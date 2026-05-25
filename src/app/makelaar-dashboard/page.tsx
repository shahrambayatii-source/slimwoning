'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { getWoningkenmerken } from '@/lib/woningkenmerken'

export default function MakelaarDashboardPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#F6F8FC] px-4 py-6 text-[#071B4D] md:px-8 lg:px-16">
          <div className="mx-auto max-w-5xl rounded-2xl bg-white p-4 shadow-md">
            <p className="text-base font-bold text-gray-500">Dashboard laden...</p>
          </div>
        </main>
      }
    >
      <MakelaarDashboardContent />
    </Suspense>
  )
}

function MakelaarDashboardContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const selectedPlan = searchParams.get('plan') || 'pro'
  const [leads, setLeads] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [claimingId, setClaimingId] = useState('')
  const [paymentHandled, setPaymentHandled] = useState(false)
  const [makelaarProfile, setMakelaarProfile] = useState<any>(null)
  const [subscription, setSubscription] = useState<any>(null)
  const [planMessage, setPlanMessage] = useState('')

  useEffect(() => {
    loadLeads()
  }, [])

  useEffect(() => {
    const paymentSuccess = searchParams.get('payment') === 'success'
    const leadId = searchParams.get('lead_id')

    if (paymentSuccess && !paymentHandled) {
      setPaymentHandled(true)

      async function handleSubscriptionSuccess() {
        if (leadId) {
          await handleSuccessfulPayment(leadId)
          return
        }

        const data = await saveSubscription(selectedPlan)

        if (!data) return

        setSubscription(data)
        await loadLeads()
      }

      handleSubscriptionSuccess()
    }
  }, [searchParams, paymentHandled])

  async function loadLeads() {
    const { data, error } = await supabase
      .from('makelaar_leads')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.log(error)
    }

    setLeads(data || [])
    setLoading(false)

    const { data: profileData } = await supabase
      .from('makelaar_profiles')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    setMakelaarProfile(profileData)

    const { data: subscriptionData } = await supabase
      .from('makelaar_subscriptions')
      .select('*')
      .eq('status', 'active')
      .order('current_period_end', { ascending: false })
      .limit(1)
      .single()

    if (subscriptionData?.current_period_end) {
      const periodEnded = new Date(subscriptionData.current_period_end).getTime() <= Date.now()

      if (periodEnded) {
        const nextPlan = subscriptionData.pending_plan || 'starter'
        const nextConfig = getPlanConfig(nextPlan)

        const { data: updatedSubscription, error: updateError } = await supabase
          .from('makelaar_subscriptions')
          .update({
            plan: nextPlan,
            premium_credits: nextConfig.credits,
            homepage_days: nextConfig.homepageDays,
            current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            pending_plan: null,
            cancel_at_period_end: false,
          })
          .eq('id', subscriptionData.id)
          .select()
          .single()

        if (!updateError && updatedSubscription) {
          setSubscription(updatedSubscription)
          return
        }
      }
    }

    setSubscription(subscriptionData)
  }
  function getPlanConfig(plan: string) {
    const planConfig = {
      starter: {
        credits: 0,
        homepageDays: 0,
      },
      pro: {
        credits: 1,
        homepageDays: 7,
      },
      elite: {
        credits: 3,
        homepageDays: 21,
      },
    } as const

    return planConfig[plan as keyof typeof planConfig] || planConfig.pro
  }

  async function saveSubscription(plan: string) {
    const config = getPlanConfig(plan)
    const makelaarEmail = makelaarProfile?.email || 'demo@slimwoning.be'

    const payload = {
      makelaar_email: makelaarEmail,
      plan,
      premium_credits: config.credits,
      homepage_days: config.homepageDays,
      status: 'active',
      current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      pending_plan: null,
      cancel_at_period_end: false,
    }

    let existingSubscription = subscription

    if (!existingSubscription?.id) {
      const { data: foundSubscription, error: findError } = await supabase
        .from('makelaar_subscriptions')
        .select('*')
        .eq('makelaar_email', makelaarEmail)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (findError) {
        console.error('Subscription lookup failed:', findError)
        return null
      }

      existingSubscription = foundSubscription
    }

    if (existingSubscription?.id) {
      const { data, error } = await supabase
        .from('makelaar_subscriptions')
        .update(payload)
        .eq('id', existingSubscription.id)
        .select()
        .single()

      if (error) {
        console.error('Subscription update failed:', error)
        return null
      }

      return data
    }

    const { data, error } = await supabase
      .from('makelaar_subscriptions')
      .insert(payload)
      .select()
      .single()

    if (error) {
      console.error('Subscription insert failed:', error)
      return null
    }

    return data
  }

  async function handleSuccessfulPayment(leadId: string) {
    try {
      const data = await saveSubscription(selectedPlan)

      if (!data) return

      await activatePremiumLead(leadId)
    } catch (error) {
      console.error('Subscription insert failed:', error)
    }
  }
  async function schedulePlanChange(plan: string) {
    if (!subscription?.id) {
      buyPremium('subscription', plan)
      return
    }

    if (subscription.plan === plan) {
      return
    }

    const { data, error } = await supabase
      .from('makelaar_subscriptions')
      .update({
        pending_plan: plan,
      })
      .eq('id', subscription.id)
      .select()
      .single()

    if (error) {
      console.error('Plan change scheduling failed:', error)
      alert('Wijziging kon niet worden opgeslagen.')
      return
    }

    setSubscription(data)
    setPlanMessage('Wijziging wordt toegepast vanaf volgende maand.')
  }

  async function activatePremiumLead(leadId: string) {
    console.log('Activating premium lead:', leadId)

    const { data, error } = await supabase
      .from('makelaar_leads')
      .update({ status: 'premium_pending' })
      .eq('id', leadId)
      .select()

    if (error) {
      console.error('Premium update failed:', error)
      alert('Premium status kon niet worden opgeslagen in Supabase.')
      return
    }

    console.log('Premium update result:', data)

    if (!data || data.length === 0) {
      console.error('No lead updated. Check lead_id:', leadId)
      alert('Geen lead gevonden met deze lead_id.')
      return
    }

    await loadLeads()
  }

  async function claimLead(leadId: string) {
    setClaimingId(leadId)

    await supabase
      .from('makelaar_leads')
      .update({
        status: 'claimed',
        claimed_by: 'demo-makelaar',
        claimed_at: new Date().toISOString(),
        seller_name: 'Shahram Bayati',
        seller_email: 'shahram@email.com',
        seller_phone: '+32 456 78 90 12',
      })
      .eq('id', leadId)

    await loadLeads()
    setClaimingId('')
  }

  function buyPremium(leadId: string, plan: string = 'pro') {
    console.log('Navigating to premium checkout:', leadId, plan)

    router.push(
      `/premium?lead_id=${encodeURIComponent(leadId)}&plan=${encodeURIComponent(plan)}`
    )
  }

  const paymentSuccess = searchParams.get('payment') === 'success'

  const profileSaved = searchParams.get('profile') === 'saved'
  const activePlan = subscription?.plan || 'starter'
  const premiumCredits = subscription?.premium_credits ?? 0
  const pendingPlan = subscription?.pending_plan || ''
  const hasPendingPlan = !!pendingPlan
  const newLeads = leads.filter((lead) => lead.status === 'new').length
  const claimedLeads = leads.filter(
    (lead) => lead.status === 'claimed' || lead.status === 'premium_pending'
  ).length

  return (
    <main className="min-h-screen bg-[#F6F8FC] px-4 py-6 text-[#071B4D] md:px-8 lg:px-16">
      <div className="mx-auto max-w-5xl">
        {paymentSuccess && (
          <div className="mb-10 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-800">
            <p className="font-black">Betaling succesvol</p>
            <p className="mt-1 text-sm">
              Je abonnement en premium voordelen zijn succesvol geactiveerd.
            </p>
          </div>
        )}

        {profileSaved && (
          <div className="mb-10 rounded-2xl border border-blue-200 bg-blue-50 p-5 text-blue-800">
            <p className="font-black">Profiel opgeslagen</p>
            <p className="mt-1 text-sm">
              Profiel succesvol bijgewerkt.
            </p>
          </div>
        )}

        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-blue-700">
              SlimWoning Pro
            </p>
            <h1 className="mt-2 text-2xl font-black tracking-[-0.04em] md:text-3xl">
              Makelaar Dashboard
            </h1>
            <p className="mt-2 max-w-xl text-xs leading-5 text-gray-500">
              Bekijk nieuwe verkoopaanvragen van eigenaars in jouw regio en reageer als vastgoedmakelaar.
            </p>
          </div>

          <div className="flex flex-wrap gap-4">
            <button
              type="button"
              onClick={() => (window.location.href = '/makelaar-profiel')}
              className="rounded-lg border border-[#DCE7F7] bg-white px-4 py-2.5 text-xs font-black text-[#071B4D] shadow-md transition hover:bg-[#F1F5FF]"
            >
              Mijn profiel bewerken
            </button>

            <button
              type="button"
              onClick={() => (window.location.href = '/')}
              className="rounded-lg bg-[#071B4D] px-4 py-2.5 text-xs font-black text-white shadow-md transition hover:scale-[1.02]"
            >
              Terug naar website
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <StatCard
            title="Nieuwe leads"
            value={newLeads}
            description="Nieuwe eigenaars zoeken momenteel een makelaar."
            tone="blue"
          />
          <StatCard
            title="Geclaimde leads"
            value={claimedLeads}
            description="Leads waarop jouw kantoor interesse heeft getoond."
            tone="green"
          />
          <StatCard
            title="Premium kansen"
            value={newLeads}
            description="Beschikbare aanvragen voor premium zichtbaarheid."
            tone="orange"
          />
        </div>

        <section className="mt-5 rounded-2xl bg-white p-4 shadow-md">
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-700">
                Jouw abonnement
              </p>
              <h2 className="mt-1 text-lg font-black tracking-[-0.03em]">
                {activePlan.charAt(0).toUpperCase() + activePlan.slice(1)} plan actief
              </h2>
              <p className="mt-2 max-w-xl text-xs leading-5 text-gray-500">
                Je hebt toegang tot priority matching, je verkoopaanpak en premium lead credits.
              </p>
            </div>

            <div className="rounded-lg bg-[#071B4D] px-4 py-2.5 text-xs font-black text-white">
              {premiumCredits} premium {premiumCredits === 1 ? 'credit' : 'credits'} beschikbaar
            </div>
            {(planMessage || pendingPlan) && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs font-black text-amber-700">
                {planMessage || `${pendingPlan.charAt(0).toUpperCase() + pendingPlan.slice(1)} wordt actief vanaf volgende maand.`}
              </div>
            )}
          </div>

          <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
            <PlanCard
              title="Starter"
              price="€29/maand"
              credits="0 credits"
              description="Een professionele aanwezigheid op SlimWoning."
              benefits={[
                'Professioneel makelaarsprofiel',
                'Persoonlijk dashboard',
                'Toegang tot standaard verkoopaanvragen',
                'Zichtbaarheid zonder promotieplaatsing',
              ]}
              active={activePlan === 'starter'}
              pending={pendingPlan === 'starter'}
              onSelect={() => schedulePlanChange('starter')}
              disabled={hasPendingPlan}
            />
            <PlanCard
              title="Pro"
              price="€79/maand"
              credits="1 credit/maand"
              description="Meer zichtbaarheid en prioriteit bij verkopers."
              benefits={[
                '1 premium lead credit per maand',
                '7 dagen extra zichtbaarheid op de homepage',
                'Voorrang binnen regionale matching',
                'Professionele verkoopaanpak zichtbaar voor verkopers',
              ]}
              active={activePlan === 'pro'}
              pending={pendingPlan === 'pro'}
              onSelect={() => schedulePlanChange('pro')}
              disabled={hasPendingPlan}
            />
            <PlanCard
              title="Elite"
              price="€149/maand"
              credits="3 credits/maand"
              description="Maximale zichtbaarheid en dominantie in jouw regio."
              benefits={[
                '3 premium lead credits per maand',
                '21 dagen prominente homepage zichtbaarheid',
                'Top makelaar badge op je profiel',
                'Hoogste prioriteit binnen jouw regio',
              ]}
              active={activePlan === 'elite'}
              pending={pendingPlan === 'elite'}
              onSelect={() => schedulePlanChange('elite')}
              disabled={hasPendingPlan}
            />
          </div>
        </section>

        <div className="mt-8 space-y-8">
          {loading ? (
            <div className="rounded-2xl bg-white p-4 shadow-md">
              <p className="text-base font-bold text-gray-500">Leads laden...</p>
            </div>
          ) : leads.length === 0 ? (
            <div className="rounded-2xl bg-white p-4 shadow-md">
              <p className="text-base font-bold text-gray-500">Nog geen leads beschikbaar.</p>
            </div>
          ) : (
            leads.map((lead: any) => {
              const isNew = lead.status === 'new'
              const isClaimed = lead.status === 'claimed'
              const isPremium = lead.status === 'premium_pending'

              return (
                <section
                  key={lead.id}
                  className="rounded-2xl bg-white p-4 shadow-md"
                >
                  <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-700">
                        Nieuwe aanvraag
                      </p>
                      <h2 className="mt-1 text-xl font-black tracking-[-0.03em] md:text-2xl">
                        Verkoopaanvraag in {lead.city || 'België'}
                      </h2>
                    </div>

                    <StatusBadge status={lead.status} />
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-2.5 md:grid-cols-4">
                    <InfoCard label="Voorkeur" value={lead.preferences?.[0] || 'Lokale makelaar'} />
                    <InfoCard
                      label="Status"
                      value={isPremium ? 'premium actief' : isClaimed ? 'claimed' : 'new'}
                    />
                    <InfoCard
                      label="Makelaars"
                      value={`${lead.nearby_makelaars_count || 15} actief`}
                    />
                    <InfoCard label="Regio" value={lead.city || 'Gent'} />
                  </div>

                  {getWoningkenmerken(lead).length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {getWoningkenmerken(lead).slice(0, 4).map((kenmerk) => (
                        <span
                          key={kenmerk}
                          className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-black text-blue-700"
                        >
                          {kenmerk}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="mt-4 rounded-xl border border-[#DCE7F7] bg-[#F8FBFF] p-3">
                    <p className="text-sm font-black">
                      Nieuwe eigenaar zoekt een makelaar in deze regio.
                    </p>
                    <p className="mt-1 max-w-2xl text-xs leading-5 text-gray-500">
                      {(isClaimed || isPremium)
                        ? 'Contactgegevens zijn beschikbaar voor deze lead.'
                        : 'Contactgegevens blijven verborgen tot deze lead geclaimd wordt via SlimWoning.'}
                    </p>

                    {(isClaimed || isPremium) && (
                      <>
                        {makelaarProfile && (
                          <div className="mt-4 rounded-xl border border-[#DCE7F7] bg-[#F8FBFF] p-3">
                            <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-700">
                              Jouw presentatie aan de verkoper
                            </p>

                            <h3 className="mt-2 text-xl font-black text-[#071B4D]">
                              {makelaarProfile.kantoor_naam}
                            </h3>

                            <p className="mt-2 text-xs leading-5 text-gray-600">
                              {makelaarProfile.jaren_ervaring} ervaring · {makelaarProfile.verkochte_woningen} woningen verkocht · {makelaarProfile.review_score} reviews
                            </p>

                            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                              <SellerInfo
                                label="Regio"
                                value={makelaarProfile.regio || 'Niet ingevuld'}
                              />

                              <SellerInfo
                                label="Verkoop commissie"
                                value={makelaarProfile.commissie || 'Niet ingevuld'}
                              />

                              <SellerInfo
                                label="Specialisatie"
                                value={makelaarProfile.specialisatie || 'Niet ingevuld'}
                              />

                              <SellerInfo
                                label="Contact"
                                value={makelaarProfile.email || 'Niet ingevuld'}
                              />
                            </div>

                            <div className="mt-4 rounded-xl bg-white p-4">
                              <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-700">
                                Jouw verkoopaanpak
                              </p>
                              <p className="mt-2 leading-5 text-gray-600">
                                {makelaarProfile.pitch || 'Geen verkoopaanpak ingevuld'}
                              </p>
                            </div>
                          </div>
                        )}

                        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                          <SellerInfo label="Naam" value={lead.seller_name || 'Niet ingevuld'} />
                          <SellerInfo label="E-mail" value={lead.seller_email || 'Niet ingevuld'} />
                          <SellerInfo label="Telefoon" value={lead.seller_phone || 'Niet ingevuld'} />
                          <SellerInfo label="Regio" value={lead.city || 'Gent'} />
                          <div className="rounded-lg bg-[#F8FAFC] p-2.5 md:col-span-2">
                            <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-700">
                              Woning link
                            </p>
                            {lead.property_id ? (
                              <a
                                href={`/properties/${lead.property_id}`}
                                className="mt-2 inline-block font-black text-[#071B4D] underline decoration-[#071B4D]/30 underline-offset-4 hover:decoration-[#071B4D]"
                              >
                                Bekijk woning van verkoper
                              </a>
                            ) : (
                              <p className="mt-2 font-black text-[#071B4D]">
                                Geen woning gekoppeld
                              </p>
                            )}
                          </div>
                        </div>
                      </>
                    )}

                    <div className="mt-4 flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => claimLead(lead.id)}
                        disabled={!isNew || claimingId === lead.id}
                        className={`rounded-lg px-4 py-2.5 text-xs font-black text-white transition ${
                          isNew
                            ? 'bg-[#071B4D] hover:scale-[1.02]'
                            : 'cursor-not-allowed bg-gray-400'
                        }`}
                      >
                        {claimingId === lead.id
                          ? 'Bezig...'
                          : isNew
                            ? 'Lead claimen'
                            : 'Lead geclaimd'}
                      </button>

                      <button
                        type="button"
                        onClick={() => buyPremium(lead.id)}
                        disabled={!isNew}
                        className={`rounded-lg border px-4 py-2.5 text-xs font-black transition ${
                          isNew
                            ? 'border-[#DCE7F7] bg-white text-[#071B4D] hover:bg-[#F1F5FF]'
                            : isPremium
                              ? 'cursor-not-allowed border-amber-200 bg-amber-50 text-amber-700'
                              : 'cursor-not-allowed border-gray-200 bg-gray-100 text-gray-500'
                        }`}
                      >
                        {isNew
                          ? 'Premium positie kopen'
                          : isPremium
                            ? 'Premium actief'
                            : 'Niet beschikbaar'}
                      </button>
                    </div>
                  </div>
                </section>
              )
            })
          )}
        </div>
      </div>
    </main>
  )
}

function StatCard({
  title,
  value,
  description,
  tone,
}: {
  title: string
  value: number
  description: string
  tone: 'blue' | 'green' | 'orange'
}) {
  const toneClass =
    tone === 'green'
      ? 'text-emerald-600'
      : tone === 'orange'
        ? 'text-orange-600'
        : 'text-blue-700'

  return (
    <div className="rounded-2xl bg-white p-4 shadow-md">
      <p className={`text-xs font-black uppercase tracking-[0.2em] ${toneClass}`}>
        {title}
      </p>
      <p className="mt-2 text-2xl font-black">{value}</p>
      <p className="mt-1 text-xs leading-5 text-gray-500">{description}</p>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const isPremium = status === 'premium_pending'
  const isClaimed = status === 'claimed'

  return (
    <div
      className={`rounded-full px-5 py-3 text-sm font-black ${
        isPremium
          ? 'bg-amber-50 text-amber-700'
          : isClaimed
            ? 'bg-blue-50 text-blue-700'
            : 'bg-emerald-50 text-emerald-700'
      }`}
    >
      {isPremium ? 'Premium actief' : isClaimed ? 'Lead geclaimd' : 'Nieuwe lead'}
    </div>
  )
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-[#F8FAFC] p-2.5">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="mt-1 text-sm font-black">{value}</p>
    </div>
  )
}

function SellerInfo({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-[#F8FAFC] p-4">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-700">
        {label}
      </p>
      <p className="mt-2 font-black text-[#071B4D]">
        {value}
      </p>
    </div>
  )
}

function PlanCard({
  title,
  price,
  credits,
  description,
  benefits,
  active,
  pending = false,
  disabled = false,
  onSelect,
}: {
  title: string
  price: string
  credits: string
  description: string
  benefits: string[]
  active: boolean
  pending?: boolean
  disabled?: boolean
  onSelect?: () => void
}) {
  return (
    <div
      className={`flex h-full flex-col rounded-xl border p-3 ${
        active
          ? 'border-blue-200 bg-blue-50'
          : 'border-[#DCE7F7] bg-[#F8FAFC]'
      }`}
    >
      <div className="flex items-center justify-between gap-4">
        <p className="text-base font-black text-[#071B4D]">{title}</p>
        {(active || pending) && (
          <span className="rounded-full bg-[#071B4D] px-3 py-1 text-xs font-black text-white">
            {active ? 'Actief' : 'Gepland'}
          </span>
        )}
      </div>
      <p className="mt-2 text-lg font-black text-[#071B4D]">{price}</p>
      <p className="mt-1 text-[11px] font-black uppercase tracking-[0.14em] text-blue-700">
        {credits}
      </p>
      <p className="mt-2 text-[11px] leading-5 text-gray-600">{description}</p>

      <ul className="mt-3 flex-1 space-y-1.5">
        {benefits.map((benefit) => (
          <li key={benefit} className="flex gap-2 text-[11px] font-bold text-[#071B4D]">
            <span className="mt-1 h-2 w-2 rounded-full bg-blue-700" />
            <span>{benefit}</span>
          </li>
        ))}
      </ul>

      {onSelect && (
        <button
          type="button"
          disabled={active || pending || disabled}
          onClick={() => {
            if (active || pending || disabled) return

            console.log('Plan button clicked')
            onSelect?.()
          }}
          className={`mt-3 w-full rounded-lg px-3 py-2 text-[11px] font-black text-white transition ${
            active || pending || disabled
              ? 'cursor-not-allowed bg-gray-400'
              : 'cursor-pointer bg-[#071B4D] hover:scale-[1.02]'
          }`}
        >
          {active ? 'Actief' : pending ? 'Gepland' : disabled ? 'Niet beschikbaar' : 'Kies plan'}
        </button>
      )}
    </div>
  )
}
