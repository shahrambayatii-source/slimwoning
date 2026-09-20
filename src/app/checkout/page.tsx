'use client'

export default function CheckoutPage() {
  async function handleCheckout() {
    try {
      const searchParams = new URLSearchParams(window.location.search)
      const leadId = searchParams.get('lead_id') || ''
      const plan = searchParams.get('plan') || 'pro'

      console.log('Sending checkout payload:', {
        leadId,
        plan,
      })

      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          leadId,
          plan,
        }),
      })

      console.log('Response status:', response.status)

      const rawText = await response.text()

      console.log('Raw API response:', rawText)

      let data: any = {}

      try {
        data = JSON.parse(rawText)
      } catch (jsonError) {
        console.error('JSON parse failed:', jsonError)
        alert('API gaf geen geldige JSON terug.')
        return
      }

      console.log('Stripe response:', data)

      if (data.url && typeof data.url === 'string') {
        try {
          const safeUrl = new URL(data.url)
          window.location.href = safeUrl.toString()
          return
        } catch {
          console.error('Malformed Stripe URL:', data.url)
        }
      }

      console.error('Invalid Stripe URL:', data)
      alert('Stripe checkout kon niet worden gestart')
    } catch (error) {
      console.error('Checkout frontend error:', error)
      alert('Checkout fout op frontend.')
    }
  }

  const searchParams = new URLSearchParams(
    typeof window !== 'undefined' ? window.location.search : ''
  )
  const plan = searchParams.get('plan') || 'pro'

  const pricing = {
    starter: {
      price: '€29',
      title: 'SlimWoning Starter',
      label: 'Starter abonnement',
      description: 'Professionele aanwezigheid op SlimWoning met toegang tot standaard verkoopaanvragen.',
      benefits: ['Makelaarsprofiel zichtbaar', 'Dashboard toegang', 'Standaard verkoopaanvragen'],
    },
    pro: {
      price: '€79',
      title: 'SlimWoning Pro',
      label: 'Pro abonnement',
      description: 'Meer zichtbaarheid, priority matching en 1 premium lead credit per maand.',
      benefits: ['1 premium credit per maand', '7 dagen homepage zichtbaarheid', 'Priority matching'],
    },
    elite: {
      price: '€149',
      title: 'SlimWoning Elite',
      label: 'Elite abonnement',
      description: 'Maximale zichtbaarheid, hoogste prioriteit en 3 premium lead credits per maand.',
      benefits: ['3 premium credits per maand', '21 dagen homepage zichtbaarheid', 'Top makelaar badge'],
    },
  }

  const currentPlan =
    pricing[plan as keyof typeof pricing] || pricing.pro

  return (
    <main className="min-h-screen bg-[#F6F8FC] px-6 py-16 text-[#0B1F4D]">
      <div className="mx-auto max-w-5xl">
        <div className="mb-10">
          <p className="mb-4 text-sm font-black uppercase tracking-[0.28em] text-blue-700">
            SlimWoning Checkout
          </p>

          <h1 className="text-5xl font-black tracking-[-0.04em] md:text-6xl">
            {currentPlan.title} activeren
          </h1>

          <p className="mt-5 max-w-3xl text-xl leading-8 text-gray-500">
            Bevestig je {currentPlan.label.toLowerCase()}. Je wordt veilig doorgestuurd naar Stripe Checkout.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-[2.5rem] bg-white p-8 shadow-xl">
            <h2 className="text-3xl font-black text-[#071B4D]">
              Bestelling
            </h2>

            <div className="mt-8 rounded-[2rem] border border-[#E2E8F0] bg-[#F8FAFC] p-6">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-orange-600">
                {currentPlan.label}
              </p>

              <div className="mt-4 flex items-start justify-between gap-6">
                <div>
                  <h3 className="text-2xl font-black text-[#071B4D]">
                    {currentPlan.title}
                  </h3>

                  <p className="mt-3 max-w-2xl text-base leading-7 text-gray-500">
                    {currentPlan.description}
                  </p>
                </div>

                <p className="shrink-0 text-3xl font-black text-[#071B4D]">
                  {currentPlan.price}
                </p>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
              {currentPlan.benefits.map((benefit) => (
                <Benefit key={benefit} title={benefit} />
              ))}
            </div>
          </section>

          <aside className="rounded-[2.5rem] bg-[#071B4D] p-8 text-white shadow-xl">
            <p className="text-sm font-black uppercase tracking-[0.24em] text-blue-200">
              Totaal
            </p>

            <p className="mt-5 text-6xl font-black">
              {currentPlan.price}
            </p>

            <p className="mt-3 text-blue-100">
              Maandelijks abonnement.
            </p>

            <button
              type="button"
              onClick={handleCheckout}
              className="mt-8 w-full rounded-2xl bg-white px-6 py-5 text-lg font-black text-[#071B4D] transition hover:scale-[1.02]"
            >
              Betaal met Stripe
            </button>

            <p className="mt-5 text-sm leading-6 text-blue-100">
              Je wordt veilig doorgestuurd naar Stripe Checkout om je abonnement te activeren.
            </p>
          </aside>
        </div>
      </div>
    </main>
  )
}

function Benefit({ title }: { title: string }) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-[#E2E8F0]">
      <p className="font-black text-[#071B4D]">
        {title}
      </p>
    </div>
  )
}