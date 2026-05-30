'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { getWoningkenmerken } from '@/lib/woningkenmerken'

import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api'

export default function PropertyDetailsPage() {
  const params = useParams()
  const router = useRouter()

  const [property, setProperty] = useState<any>(null)
  const [similarProperties, setSimilarProperties] = useState<any[]>([])
  const [userId, setUserId] = useState('')
  const [showMap, setShowMap] = useState(false)
  const [showComparison, setShowComparison] = useState(false)
  const [activePhotoIndex, setActivePhotoIndex] = useState(0)

  const [mapCenter, setMapCenter] = useState({
    lat: 51.2194,
    lng: 4.4025,
  })

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
  })

  useEffect(() => {
    getProperty()
    getUser()
  }, [])

  useEffect(() => {
    setActivePhotoIndex(0)
  }, [property?.id])

  useEffect(() => {
    if (!showMap || !isLoaded || !property?.address || !window.google) return

    const geocoder = new window.google.maps.Geocoder()

    geocoder.geocode(
      {
        address: `${property.address}, ${property.city || ''}, Belgium`,
      },
      (results, status) => {
        if (status === 'OK' && results?.[0]) {
          const location = results[0].geometry.location

          setMapCenter({
            lat: location.lat(),
            lng: location.lng(),
          })
        } else {
          console.log('Geocode fout:', status)
        }
      }
    )
  }, [showMap, isLoaded, property])

  async function getUser() {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) setUserId(user.id)
  }

  async function getProperty() {
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error) {
      console.log(error)
    } else {
      setProperty(data)
      getSimilarProperties(data)
    }
  }

  async function getSimilarProperties(currentProperty: any) {
    if (!currentProperty) return

    let query = supabase
      .from('properties')
      .select('*')
      .neq('id', currentProperty.id)
      .limit(6)

    if (currentProperty.city) {
      query = query.ilike('city', `%${currentProperty.city}%`)
    }

    if (currentProperty.woning_type) {
      query = query.eq('woning_type', currentProperty.woning_type)
    }

    const { data, error } = await query

    if (error) {
      console.log(error)
      return
    }

    setSimilarProperties(data || [])
  }

  async function handleDelete() {
    const confirmDelete = confirm(
      'Weet je zeker dat je deze woning wilt verwijderen?'
    )

    if (!confirmDelete) return

    const { error } = await supabase
      .from('properties')
      .delete()
      .eq('id', params.id)

    if (error) {
      alert('Fout bij verwijderen van woning')
      console.log(error)
    } else {
      router.push('/properties')
    }
  }

  function yesNo(value: boolean | null) {
    if (value === true) return 'Ja'
    if (value === false) return 'Nee'
    return 'Niet opgegeven'
  }

  function formatPrice(value: any) {
    const number = Number(String(value || '').replace(/[^\d.]/g, '')) || 0

    if (!number) return '-'

    return new Intl.NumberFormat('nl-BE', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(number)
  }

  function estimatedMonthlyPayment(price: any) {
    const propertyPrice = Number(String(price || '').replace(/[^\d.]/g, '')) || 0

    if (!propertyPrice) return '-'

    const ownCapital = propertyPrice * 0.2
    const loanAmount = propertyPrice - ownCapital
    const yearlyInterest = 0.03
    const monthlyInterest = yearlyInterest / 12
    const months = 25 * 12

    const payment =
      loanAmount *
      (monthlyInterest / (1 - Math.pow(1 + monthlyInterest, -months)))

    return new Intl.NumberFormat('nl-BE', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(payment)
  }

  // --- Slim zoeken / match analysis helpers ---
  function getWoonMatchScore() {
    let score = 76

    if (property?.city) score += 5
    if (property?.price) score += 5
    if (property?.bewoonbare_oppervlakte) score += 4
    if (property?.slaapkamers) score += 4
    if (property?.parking) score += 2
    if (property?.tuin) score += 2
    if (property?.terras) score += 2

    return Math.min(score, 96)
  }

  function getWoonMatchPoints() {
    const city = property?.city || 'deze regio'

    return [
      {
        title: 'Ligging',
        text: `Interessante ligging in ${city} met relevante vastgoedvraag.`,
      },
      {
        title: 'Prijsindicatie',
        text: property?.price
          ? `Vraagprijs van ${formatPrice(property.price)} past binnen een duidelijke zoekcategorie.`
          : 'Prijsinformatie kan verder helpen om de match nauwkeuriger te maken.',
      },
      {
        title: 'Woonprofiel',
        text: `${cleanWoningType(property?.woning_type)} met kenmerken die geschikt kunnen zijn voor gerichte zoekers.`,
      },
    ]
  }

  function getStringArray(value: any) {
    if (!Array.isArray(value)) return []

    return value
      .map((item) => String(item || '').trim())
      .filter(Boolean)
  }

  function getPropertyPhotos(propertyValue: any) {
    if (!propertyValue) return []

    const propertyPhotos =
      getStringArray(propertyValue.photos).length
        ? getStringArray(propertyValue.photos)
        : getStringArray(propertyValue.images).length
          ? getStringArray(propertyValue.images)
          : propertyValue.photo
            ? [propertyValue.photo]
            : propertyValue.image
              ? [propertyValue.image]
              : propertyValue.mainImage
                ? [propertyValue.mainImage]
                : propertyValue.photo_url
                  ? [propertyValue.photo_url]
                  : []

    return Array.from(new Set(propertyPhotos.map((photo) => String(photo).trim()).filter(Boolean)))
  }

  function cleanWoningType(value: any) {
    const text = String(value || '').trim()

    if (!text) return 'Niet opgegeven'
    if (!Number.isNaN(Number(text))) return 'Appartement'

    return text
  }



  const propertyPhotos = getPropertyPhotos(property)
  const activePhoto = propertyPhotos[activePhotoIndex] || propertyPhotos[0] || ''

  function showPreviousPhoto() {
    setActivePhotoIndex((current) =>
      propertyPhotos.length > 0
        ? (current - 1 + propertyPhotos.length) % propertyPhotos.length
        : 0
    )
  }

  function showNextPhoto() {
    setActivePhotoIndex((current) =>
      propertyPhotos.length > 0 ? (current + 1) % propertyPhotos.length : 0
    )
  }

  if (!property) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f6f8fb] text-2xl font-bold text-[#111827]">
        Laden...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f6f8fb] px-4 py-5 text-[#111827] md:px-8">
      <div className="mx-auto max-w-[1500px]">
        <div className="mb-5 flex items-center justify-between">
          <Link
            href="/properties"
            className="rounded-2xl bg-white px-5 py-3 font-bold text-[#111827] shadow-sm"
          >
            ← Terug naar woningen
          </Link>

          <Link
            href="/properties"
            className="hidden rounded-2xl bg-blue-700 px-5 py-3 font-bold text-white md:block"
          >
            Te koop
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,58fr)_minmax(360px,42fr)] lg:gap-6">
          <div>
            <div className="relative overflow-hidden rounded-[2rem] bg-white shadow-xl">
              {activePhoto ? (
                <img
                  src={activePhoto}
                  alt={property.title}
                  className="h-[330px] w-full object-cover md:h-[430px] lg:h-[460px]"
                />
              ) : (
                <div className="flex h-[330px] w-full items-center justify-center bg-gradient-to-br from-slate-200 via-slate-300 to-slate-400 md:h-[430px] lg:h-[460px]">
                  <span className="text-lg font-black text-white/90">Geen foto beschikbaar</span>
                </div>
              )}

              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />

              {propertyPhotos.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={showPreviousPhoto}
                    className="absolute left-6 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-2xl font-black text-[#071B4D] shadow-xl transition hover:bg-white"
                    aria-label="Vorige foto"
                  >
                    ‹
                  </button>

                  <button
                    type="button"
                    onClick={showNextPhoto}
                    className="absolute right-6 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-2xl font-black text-[#071B4D] shadow-xl transition hover:bg-white"
                    aria-label="Volgende foto"
                  >
                    ›
                  </button>

                  <div className="absolute bottom-8 left-8 rounded-full bg-black/55 px-4 py-2 text-sm font-black text-white backdrop-blur">
                    {activePhotoIndex + 1} / {propertyPhotos.length}
                  </div>
                </>
              )}

              <div className="absolute bottom-8 right-8">
                <div className="inline-flex items-center overflow-visible text-white drop-shadow-xl">
                  <div className="flex h-11 items-center rounded-l-lg bg-[#263746] px-4 text-xl font-black uppercase leading-none tracking-[0.04em]">
                    EPC
                  </div>

                  <div
                    className="relative flex h-11 min-w-[58px] items-center justify-center bg-[#6BCB45] px-4 text-xl font-black leading-none"
                    style={{
                      clipPath: 'polygon(0 0, calc(100% - 14px) 0, 100% 50%, calc(100% - 14px) 100%, 0 100%, 10px 50%)',
                    }}
                  >
                    {property.epc || '-'}
                  </div>
                </div>
              </div>

              {property.created_at &&
                Date.now() - new Date(property.created_at).getTime() <
                  15 * 24 * 60 * 60 * 1000 && (
                  <div className="absolute left-8 top-8 flex items-center drop-shadow-xl">
                    <div className="relative flex h-10 items-center rounded-r-md bg-red-600 pl-10 pr-6 text-xl font-black italic leading-none text-white">
                      <span className="absolute left-[-24px] top-0 h-0 w-0 border-y-[20px] border-r-[24px] border-y-transparent border-r-red-600" />
                      <span className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border-[3px] border-white/90 bg-white/20" />
                      Nieuw
                    </div>
                  </div>
                )}
            </div>

            {propertyPhotos.length > 1 && (
              <div className="mt-3 flex gap-2 overflow-x-auto rounded-[1.25rem] bg-white p-2 shadow-md">
                {propertyPhotos.map((photo, index) => (
                  <button
                    key={`${photo}-${index}`}
                    type="button"
                    onClick={() => setActivePhotoIndex(index)}
                    className={`relative h-16 w-24 shrink-0 overflow-hidden rounded-xl ring-4 transition ${
                      activePhotoIndex === index
                        ? 'ring-blue-700'
                        : 'ring-transparent hover:ring-blue-200'
                    }`}
                    aria-label={`Toon foto ${index + 1}`}
                    aria-pressed={activePhotoIndex === index}
                  >
                    <img
                      src={photo}
                      alt={`${property.title || 'Woning'} foto ${index + 1}`}
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}

            <div className="mt-5 rounded-[1.75rem] bg-white p-5 shadow-xl md:p-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="mb-2 text-xs font-bold uppercase tracking-[0.26em] text-blue-700">
                    {property.city || 'Locatie niet opgegeven'}
                  </p>

                  <h1 className="max-w-3xl text-2xl font-bold leading-tight tracking-[-0.03em] md:text-3xl">
                    {property.title}
                  </h1>

                  {property.address && (
                    <div className="mt-3 flex flex-col gap-3 rounded-2xl bg-[#f8fafc] p-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-blue-700">
                          Adres
                        </p>

                        <p className="mt-1.5 text-base font-bold text-[#111827]">
                          {property.address}, {property.city}
                        </p>
                      </div>

                      <button
                        onClick={() => setShowMap(true)}
                        className="rounded-xl bg-blue-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-800"
                      >
                        Open kaart
                      </button>
                    </div>
                  )}
                </div>

                <div className="rounded-[1.5rem] bg-[#eef2ff] px-5 py-4">
                  <p className="text-sm font-bold uppercase tracking-[0.2em] text-blue-700">
                    Vraagprijs
                  </p>

                  <p className="mt-1 text-3xl font-bold text-blue-700">
                    {formatPrice(property.price)}
                  </p>

                  <div className="mt-3 rounded-2xl bg-white/70 p-3">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">
                      Geschatte maandelijkse aflossing
                    </p>

                    <p className="mt-1 text-xl font-bold text-[#0B1F4D]">
                      {estimatedMonthlyPayment(property.price)} / mnd
                    </p>

                    <p className="mt-2 text-xs leading-5 text-gray-500">
                      Indicatieve simulatie op basis van 20% eigen inbreng, 3% rente en 25 jaar. Geen financieel advies.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
                <QuickStat label="Slaapkamers" value={property.slaapkamers || '-'} />
                <QuickStat label="Badkamers" value={property.badkamers || '-'} />
                <QuickStat
                  label="Oppervlakte"
                  value={
                    property.bewoonbare_oppervlakte
                      ? `${property.bewoonbare_oppervlakte} m²`
                      : '-'
                  }
                />
                <QuickStat label="EPC" value={property.epc || '-'} />
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowComparison(true)}
                  className="shrink-0 rounded-full border border-amber-200 bg-amber-50 px-3.5 py-1.5 text-sm font-semibold leading-none whitespace-nowrap text-amber-700 transition hover:bg-amber-100"
                  aria-haspopup="dialog"
                >
                  Vergelijk
                </button>
              </div>
            </div>

            <SectionCard title="Beschrijving">
              <p className="leading-8 text-gray-600">
                {property.description || 'Geen beschrijving beschikbaar.'}
              </p>
            </SectionCard>

            {getWoningkenmerken(property).length > 0 && (
              <SectionCard title="Woningkenmerken">
                <div className="flex flex-wrap gap-2">
                  {getWoningkenmerken(property).map((kenmerk) => (
                    <span
                      key={kenmerk}
                      className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-black text-blue-700"
                    >
                      {kenmerk}
                    </span>
                  ))}
                </div>
              </SectionCard>
            )}

            <SectionCard title="Plus- en minpunten">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <CompactPointList
                  title="Pluspunten"
                  tone="positive"
                  text={property.pluspunten || 'Niet opgegeven'}
                />
                <CompactPointList
                  title="Minpunten"
                  tone="negative"
                  text={property.minpunten || 'Niet opgegeven'}
                />
              </div>
            </SectionCard>

            <SectionCard title="Aanbodinformatie">
              <div className="flex flex-col gap-3 rounded-2xl bg-[#f8fafc] p-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-700">
                    Status
                  </p>

                  <p className="mt-1 text-lg font-bold text-[#111827]">
                    Aangeboden door{' '}
                    {property.makelaar_kantoornaam ||
                      property.contact_name ||
                      'Particuliere verkoper'}
                  </p>
                </div>

                <div className="w-fit rounded-full bg-blue-700 px-4 py-2 text-sm font-bold text-white">
                  Actief
                </div>
              </div>
            </SectionCard>

            <AccordionSection
              title="Slim zoeken details"
              summary={`${getWoonMatchScore()}% matchscore op basis van locatie, prijs en kenmerken.`}
            >
              <div className="rounded-[1.5rem] border border-emerald-100 bg-gradient-to-br from-emerald-50/80 via-white to-blue-50/80 p-4">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-700">
                      SlimWoning woonmatch
                    </p>
                    <h3 className="mt-2 text-2xl font-black leading-tight text-[#071B4D]">
                      Waarom past deze woning bij jouw zoekprofiel?
                    </h3>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600">
                      SlimWoning bekijkt locatie, prijs en woningkenmerken om sneller relevante woningen te herkennen.
                    </p>
                  </div>

                  <div className="rounded-2xl bg-emerald-700 px-5 py-4 text-white shadow-lg shadow-emerald-900/15">
                    <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-100">
                      Matchscore
                    </p>
                    <p className="mt-1 text-3xl font-black">
                      {getWoonMatchScore()}%
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                  {getWoonMatchPoints().map((point) => (
                    <div key={point.title} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-emerald-100">
                      <p className="text-sm font-black text-[#071B4D]">{point.title}</p>
                      <p className="mt-1 text-sm leading-6 text-gray-500">{point.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </AccordionSection>


          </div>

          <div className="h-fit rounded-[1.75rem] bg-white p-5 shadow-xl lg:sticky lg:top-5">
            <h2 className="mb-4 text-2xl font-bold">Vastgoeddetails</h2>

            <div className="space-y-1">
              <InfoRow label="Adres" value={property.address} />
              <InfoRow label="Type vastgoed" value={cleanWoningType(property.woning_type)} />
              <InfoRow label="Slaapkamers" value={property.slaapkamers} />
              <InfoRow label="Badkamers" value={property.badkamers} />
              <InfoRow
                label="Bewoonbare oppervlakte"
                value={
                  property.bewoonbare_oppervlakte
                    ? `${property.bewoonbare_oppervlakte} m²`
                    : ''
                }
              />
              <InfoRow
                label="Grondoppervlakte"
                value={
                  property.grondoppervlakte
                    ? `${property.grondoppervlakte} m²`
                    : ''
                }
              />
              <InfoRow label="Bouwjaar" value={property.bouwjaar} />
              <InfoRow label="EPC" value={property.epc} />
              <InfoRow label="Verwarming" value={property.verwarmingstype} />
              <InfoRow label="Parking" value={yesNo(property.parking)} />
              <InfoRow label="Tuin" value={yesNo(property.tuin)} />
              <InfoRow label="Terras" value={yesNo(property.terras)} />
              <InfoRow label="Lift" value={yesNo(property.lift)} />
              <InfoRow label="Gemeubeld" value={yesNo(property.gemeubeld)} />
              <InfoRow label="Dubbel glas" value={yesNo(property.dubbel_glas)} />
            </div>

            {userId === property.user_id && (
              <div className="mt-4 grid grid-cols-1 gap-3">
                <Link href={`/edit-property/${property.id}`}>
                  <button className="w-full rounded-2xl bg-[#111827] p-5 font-bold text-white">
                    Bewerken
                  </button>
                </Link>

                <button
                  onClick={handleDelete}
                  className="w-full rounded-2xl bg-red-600 p-5 font-bold text-white"
                >
                  Verwijderen
                </button>
              </div>
            )}
          </div>
        </div>
      </div>


      {showComparison && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-5"
          role="dialog"
          aria-modal="true"
          aria-labelledby="comparison-title"
        >
          <div className="relative w-full max-w-4xl overflow-hidden rounded-[2rem] bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-gray-100 p-6">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.24em] text-amber-600">
                  Vergelijk
                </p>
                <h2 id="comparison-title" className="mt-1 text-2xl font-black text-[#071B4D]">
                  Vergelijkbare woningen
                </h2>
                <p className="mt-2 text-sm leading-6 text-gray-500">
                  {similarProperties.length > 0
                    ? `${similarProperties.length} gelijkaardige panden in de buurt.`
                    : 'Er zijn momenteel geen gelijkaardige panden gevonden voor deze woning.'}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowComparison(false)}
                className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#111827] text-xl font-bold text-white transition hover:bg-black"
                aria-label="Vergelijking sluiten"
              >
                ✕
              </button>
            </div>

            <div className="max-h-[70vh] overflow-y-auto p-6">
              {similarProperties.length > 0 ? (
                <div className="overflow-hidden rounded-2xl border border-gray-100">
                  <div className="grid grid-cols-[1.2fr_1fr_1fr_0.8fr] bg-gray-100 px-4 py-3 text-sm font-black text-[#111827]">
                    <span>Gemeente</span>
                    <span>Vraagprijs</span>
                    <span>Woonopp.</span>
                    <span>Bouwjaar</span>
                  </div>

                  {similarProperties.map((similarProperty) => (
                    <Link
                      key={similarProperty.id}
                      href={`/properties/${similarProperty.id}`}
                      onClick={() => setShowComparison(false)}
                      className="grid grid-cols-[1.2fr_1fr_1fr_0.8fr] border-t border-gray-100 px-4 py-3 text-sm transition hover:bg-blue-50/60"
                    >
                      <span className="font-semibold text-[#111827]">
                        {similarProperty.city || '-'}
                      </span>
                      <span>{formatPrice(similarProperty.price)}</span>
                      <span>
                        {similarProperty.bewoonbare_oppervlakte
                          ? `${similarProperty.bewoonbare_oppervlakte} m²`
                          : '-'}
                      </span>
                      <span>{similarProperty.bouwjaar || '-'}</span>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl bg-amber-50 p-5 text-sm font-semibold leading-6 text-amber-800">
                  Voeg meer woningen toe of pas de zoekcriteria aan om vergelijkbare panden te zien.
                </div>
              )}
            </div>
          </div>
        </div>
      )}


      {showMap && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-5">
          <div className="relative w-full max-w-7xl overflow-hidden rounded-[2rem] bg-white shadow-2xl">
            <button
              onClick={() => setShowMap(false)}
              className="absolute right-5 top-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-black text-2xl font-bold text-white"
            >
              ✕
            </button>

            <div className="h-[85vh] w-full">
              {!isLoaded && (
                <div className="flex h-full items-center justify-center text-2xl font-bold">
                  Map laden...
                </div>
              )}

              {isLoaded && (
                <GoogleMap
                  mapContainerStyle={{
                    width: '100%',
                    height: '100%',
                  }}
                  center={mapCenter}
                  zoom={15}
                >
                  <Marker position={mapCenter} />
                </GoogleMap>
              )}
            </div>

            <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between bg-gradient-to-t from-black/90 via-black/70 to-transparent p-8">
              <div>
                <h2 className="text-3xl font-bold text-white">
                  {property.title}
                </h2>

                <p className="mt-2 text-lg text-gray-300">
                  {property.address || property.city}
                </p>
              </div>

              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  `${property.address || ''} ${property.city || ''}`
                )}`}
                target="_blank"
                className="rounded-2xl bg-blue-700 px-7 py-5 font-bold text-white transition hover:bg-blue-800"
              >
                Open Google Maps
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function QuickStat({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="rounded-[1.25rem] bg-[#f8fafc] p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">{label}</p>
      <p className="mt-1 text-xl font-bold">{value}</p>
    </div>
  )
}

function SectionCard({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="mt-5 rounded-[1.75rem] bg-white p-5 shadow-xl md:p-6">
      <h2 className="mb-4 text-2xl font-bold">{title}</h2>
      {children}
    </div>
  )
}

function AccordionSection({
  title,
  summary,
  children,
}: {
  title: string
  summary: string
  children: React.ReactNode
}) {
  return (
    <details className="group mt-5 overflow-hidden rounded-[1.5rem] bg-white shadow-lg">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 marker:content-none md:px-6 [&::-webkit-details-marker]:hidden">
        <div>
          <h2 className="text-xl font-black text-[#071B4D]">{title}</h2>
          <p className="mt-1 text-sm leading-6 text-gray-500">{summary}</p>
        </div>
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-blue-50 text-2xl font-black text-blue-700 transition group-open:rotate-45">
          +
        </span>
      </summary>
      <div className="border-t border-gray-100 px-5 py-5 md:px-6">
        {children}
      </div>
    </details>
  )
}

function CompactPointList({
  title,
  text,
  tone,
}: {
  title: string
  text: string
  tone: 'positive' | 'negative'
}) {
  const isPositive = tone === 'positive'

  return (
    <div className={`rounded-2xl border p-4 ${isPositive ? 'border-emerald-100 bg-emerald-50/70' : 'border-amber-100 bg-amber-50/70'}`}>
      <p className={`text-sm font-black ${isPositive ? 'text-emerald-700' : 'text-amber-700'}`}>
        {isPositive ? '＋' : '−'} {title}
      </p>
      <p className="mt-2 text-sm leading-6 text-gray-600">{text}</p>
    </div>
  )
}

function InfoRow({
  label,
  value,
}: {
  label: string
  value: any
}) {
  return (
    <div className="flex justify-between gap-4 border-b border-gray-100 py-2.5">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-right text-sm font-bold">
        {value || 'Niet opgegeven'}
      </span>
    </div>
  )
}
