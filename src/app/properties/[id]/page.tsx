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
  const [nearbyMakelaars, setNearbyMakelaars] = useState<any[]>([])
  const [makelaarsLoading, setMakelaarsLoading] = useState(false)
  const [showMatchModal, setShowMatchModal] = useState(false)
  const [matchPreferences, setMatchPreferences] = useState<string[]>([])
  const [matchRequestSent, setMatchRequestSent] = useState(false)

  const [mapCenter, setMapCenter] = useState({
    lat: 51.2194,
    lng: 4.4025,
  })

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries: ['places'],
  })

  useEffect(() => {
    getProperty()
    getUser()
  }, [])

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

  useEffect(() => {
    if (!isLoaded || !property?.address || !window.google?.maps?.places) return

    loadNearbyMakelaars()
  }, [isLoaded, property])

  function calculateDistanceMeters(
    origin: google.maps.LatLng,
    destination: google.maps.LatLng
  ) {
    const earthRadius = 6371000
    const originLat = (origin.lat() * Math.PI) / 180
    const destinationLat = (destination.lat() * Math.PI) / 180
    const deltaLat = ((destination.lat() - origin.lat()) * Math.PI) / 180
    const deltaLng = ((destination.lng() - origin.lng()) * Math.PI) / 180

    const a =
      Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
      Math.cos(originLat) *
        Math.cos(destinationLat) *
        Math.sin(deltaLng / 2) *
        Math.sin(deltaLng / 2)

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

    return earthRadius * c
  }

  async function loadNearbyMakelaars() {
    if (!property?.address || !window.google?.maps?.places) return

    setMakelaarsLoading(true)

    const address = `${property.address || ''}, ${property.city || ''}, Belgium`
    const geocoder = new window.google.maps.Geocoder()

    geocoder.geocode({ address }, (geocodeResults, geocodeStatus) => {
      if (geocodeStatus !== 'OK' || !geocodeResults?.[0]) {
        setNearbyMakelaars([])
        setMakelaarsLoading(false)
        return
      }

      const location = geocodeResults[0].geometry.location
      const serviceElement = document.createElement('div')
      const service = new window.google.maps.places.PlacesService(serviceElement)

      service.nearbySearch(
        {
          location,
          radius: 5000,
          keyword: 'immo vastgoed makelaar estate realty property',
        },
        (places, placesStatus) => {
          if (
            placesStatus !== window.google.maps.places.PlacesServiceStatus.OK ||
            !places
          ) {
            setNearbyMakelaars([])
            setMakelaarsLoading(false)
            return
          }

          const filteredMakelaars = places
            .map((place: any) => {
              const placeLocation = place.geometry?.location
              const distanceMeters = placeLocation
                ? calculateDistanceMeters(location, placeLocation)
                : 0

              return {
                name: place.name,
                address: place.vicinity,
                vicinity: place.vicinity,
                distanceMeters,
                distanceText: distanceMeters
                  ? distanceMeters >= 1000
                    ? `${(distanceMeters / 1000).toFixed(1)} km`
                    : `${Math.round(distanceMeters)} m`
                  : '',
              }
            })
            .filter((makelaar: any) => {
              const value = `${makelaar.name || ''} ${makelaar.vicinity || ''}`.toLowerCase()
              const blockedWords = ['insurance', 'verzekering', 'verzekeringen', 'bank', 'crelan', 'bnp', 'kbc', 'belfius']
              const allowedWords = ['immo', 'vastgoed', 'makelaar', 'estate', 'realty', 'properties', 'property', 'immobili']

              return (
                !blockedWords.some((word) => value.includes(word)) &&
                allowedWords.some((word) => value.includes(word))
              )
            })
            .filter((makelaar: any) => {
              const distance = Number(makelaar.distanceMeters || 0)
              return distance > 0 && distance <= 5000
            })
            .filter((makelaar: any, index: number, array: any[]) => {
              const normalized = String(makelaar.name || '')
                .toLowerCase()
                .replace(/[^a-z0-9]/g, '')

              return (
                normalized &&
                array.findIndex((item: any) =>
                  String(item.name || '')
                    .toLowerCase()
                    .replace(/[^a-z0-9]/g, '') === normalized
                ) === index
              )
            })
            .sort((a: any, b: any) => {
              return (a.distanceMeters || 999999) - (b.distanceMeters || 999999)
            })

          setNearbyMakelaars(filteredMakelaars)
          setMakelaarsLoading(false)
        }
      )
    })
  }

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

  function cleanWoningType(value: any) {
    const text = String(value || '').trim()

    if (!text) return 'Niet opgegeven'
    if (!Number.isNaN(Number(text))) return 'Appartement'

    return text
  }

  function toggleMatchPreference(value: string) {
    setMatchPreferences((current) =>
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value]
    )
  }

  async function handleMatchRequest() {
    if (!property) return

    const { error } = await supabase.from('makelaar_leads').insert([
      {
        property_id: property.id,
        seller_user_id: property.user_id,
        city: property.city,
        preferences: matchPreferences,
        nearby_makelaars_count: nearbyMakelaars.length,
        status: 'new',
      },
    ])

    if (error) {
      alert(`Fout bij aanvraag: ${error.message}`)
      return
    }

    setMatchRequestSent(true)
    setShowMatchModal(false)
  }


  if (!property) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f6f8fb] text-2xl font-bold text-[#111827]">
        Laden...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f6f8fb] px-5 py-8 text-[#111827] md:px-10">
      <div className="mx-auto max-w-[1500px]">
        <div className="mb-8 flex items-center justify-between">
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

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1.6fr_0.8fr]">
          <div>
            <div className="relative overflow-hidden rounded-[2.5rem] bg-white shadow-2xl">
              <img
                src={property.image}
                alt={property.title}
                className="h-[500px] w-full object-cover md:h-[720px]"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />

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

            <div className="mt-8 rounded-[2rem] bg-white p-8 shadow-xl">
              <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="mb-4 text-sm font-bold uppercase tracking-[0.3em] text-blue-700">
                    {property.city || 'Locatie niet opgegeven'}
                  </p>

                  <h1 className="max-w-3xl text-2xl font-bold leading-tight tracking-[-0.03em] md:text-4xl">
                    {property.title}
                  </h1>

                  {property.address && (
                    <div className="mt-5 flex flex-col gap-3 rounded-2xl bg-[#f8fafc] p-4 md:flex-row md:items-center md:justify-between">
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

                <div className="rounded-[1.5rem] bg-[#eef2ff] px-7 py-6">
                  <p className="text-sm font-bold uppercase tracking-[0.2em] text-blue-700">
                    Vraagprijs
                  </p>

                  <p className="mt-2 text-4xl font-bold text-blue-700">
                    {formatPrice(property.price)}
                  </p>

                  <div className="mt-5 rounded-2xl bg-white/70 p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">
                      Geschatte maandelijkse aflossing
                    </p>

                    <p className="mt-2 text-2xl font-bold text-[#0B1F4D]">
                      {estimatedMonthlyPayment(property.price)} / mnd
                    </p>

                    <p className="mt-2 text-xs leading-5 text-gray-500">
                      Indicatieve simulatie op basis van 20% eigen inbreng, 3% rente en 25 jaar. Geen financieel advies.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
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

            <SectionCard title="Slim zoeken">
              <div className="overflow-hidden rounded-[1.75rem] border border-emerald-100 bg-gradient-to-br from-emerald-50/80 via-white to-blue-50/80">
                <div className="flex flex-col gap-5 border-b border-emerald-100 px-6 py-6 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-700">
                      SlimWoning woonmatch
                    </p>
                    <h3 className="mt-3 text-3xl font-black leading-tight text-[#071B4D]">
                      Waarom past deze woning bij jouw zoekprofiel?
                    </h3>
                    <p className="mt-3 max-w-2xl text-base leading-8 text-gray-600">
                      SlimWoning bekijkt locatie, prijs en woningkenmerken om sneller relevante woningen te herkennen.
                    </p>
                  </div>

                  <div className="rounded-[1.5rem] bg-emerald-700 px-6 py-5 text-white shadow-xl shadow-emerald-900/15">
                    <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-100">
                      Matchscore
                    </p>
                    <p className="mt-2 text-4xl font-black">
                      {getWoonMatchScore()}%
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 px-6 py-6 md:grid-cols-3">
                  {getWoonMatchPoints().map((point) => (
                    <div key={point.title} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-emerald-100">
                      <p className="text-sm font-black text-[#071B4D]">{point.title}</p>
                      <p className="mt-2 text-sm leading-6 text-gray-500">{point.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </SectionCard>

            <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
              <SectionCard title="Pluspunten">
                <p className="leading-8 text-gray-600">
                  {property.pluspunten || 'Niet opgegeven'}
                </p>
              </SectionCard>

              <SectionCard title="Minpunten">
                <p className="leading-8 text-gray-600">
                  {property.minpunten || 'Niet opgegeven'}
                </p>
              </SectionCard>
            </div>

            <SectionCard title="Verkoopinformatie">
              <div className="flex items-center justify-between rounded-2xl bg-[#f8fafc] p-5">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-700">
                    Status
                  </p>

                  <p className="mt-2 text-xl font-bold text-[#111827]">
                    Bezig met verkoop door{' '}
                    {property.makelaar_kantoornaam ||
                      property.contact_name ||
                      'Particuliere verkoper'}
                  </p>
                </div>

                <div className="rounded-full bg-blue-700 px-5 py-3 text-sm font-bold text-white">
                  Actief
                </div>
              </div>

              <div className="mt-6 overflow-hidden rounded-[1.75rem] border border-[#DCE7F7] bg-gradient-to-br from-[#F8FBFF] via-white to-[#EEF4FF]">
                <div className="border-b border-[#E5EDF9] px-6 py-6 md:px-8">
                  <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                    <div className="max-w-3xl">
                      <p className="text-xs font-black uppercase tracking-[0.24em] text-blue-700">
                        SlimWoning Matchmaking
                      </p>

                      <h3 className="mt-3 text-3xl font-black leading-tight text-[#071B4D]">
                        Ontvang voorstellen van geschikte makelaars
                      </h3>

                      <p className="mt-4 text-base leading-8 text-gray-600">
                        SlimWoning analyseert automatisch jouw woning, locatie en verkoopprofiel en zoekt actieve vastgoedmakelaars binnen jouw regio.
                      </p>
                    </div>

                    <div className="rounded-[1.5rem] bg-[#071B4D] px-6 py-5 text-white shadow-xl">
                      <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-200">
                        Match status
                      </p>

                      <p className="mt-2 text-2xl font-black">
                        {nearbyMakelaars.length > 0
                          ? `${nearbyMakelaars.length}+ makelaars actief`
                          : 'Regio wordt gescand'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="px-6 py-6 md:px-8">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-[#E2E8F0]">
                      <p className="text-sm font-black text-[#071B4D]">1. Analyse</p>
                      <p className="mt-2 text-sm leading-6 text-gray-500">
                        We bekijken locatie, type vastgoed, prijs en verkoopprofiel.
                      </p>
                    </div>

                    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-[#E2E8F0]">
                      <p className="text-sm font-black text-[#071B4D]">2. Matching</p>
                      <p className="mt-2 text-sm leading-6 text-gray-500">
                        Geschikte makelaars in de regio kunnen interesse tonen.
                      </p>
                    </div>

                    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-[#E2E8F0]">
                      <p className="text-sm font-black text-[#071B4D]">3. Voorstellen</p>
                      <p className="mt-2 text-sm leading-6 text-gray-500">
                        Je ontvangt alleen relevante voorstellen, geen openbare lijst.
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 rounded-2xl border border-[#DCE7F7] bg-white p-5">
                    <p className="text-sm font-black text-[#071B4D]">
                      {makelaarsLoading
                        ? 'We scannen jouw regio...'
                        : nearbyMakelaars.length > 0
                          ? `${nearbyMakelaars.length} makelaars actief gevonden in jouw regio.`
                          : 'SlimWoning kan makelaars in jouw regio benaderen.'}
                    </p>

                    <p className="mt-2 text-sm leading-6 text-gray-500">
                      Namen en contactgegevens worden niet openbaar getoond. Relevante makelaars kunnen via SlimWoning reageren op jouw verkoopaanvraag.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-4 border-t border-[#E5EDF9] px-6 py-6 md:flex-row md:items-center md:justify-between md:px-8">
                  <div>
                    <p className="text-sm font-bold text-[#071B4D]">
                      {matchRequestSent
                        ? 'Je aanvraag is verzonden.'
                        : 'Wil je passende makelaars voor deze verkoop ontvangen?'}
                    </p>

                    <p className="mt-1 text-sm text-gray-500">
                      {matchRequestSent
                        ? 'SlimWoning verwerkt je aanvraag en kan relevante makelaars benaderen.'
                        : 'Start gratis een aanvraag. Je gegevens worden niet als openbare lijst getoond.'}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowMatchModal(true)}
                    disabled={matchRequestSent}
                    className="rounded-2xl bg-[#071B4D] px-6 py-4 font-black text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {matchRequestSent ? 'Aanvraag verzonden' : 'Start makelaar matching'}
                  </button>
                </div>
              </div>
            </SectionCard>

            {similarProperties.length > 0 && (
              <SectionCard title="Gelijkaardige panden in de buurt">
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
              </SectionCard>
            )}

          </div>

          <div className="h-fit rounded-[2rem] bg-white p-7 shadow-xl lg:sticky lg:top-8">
            <h2 className="mb-6 text-3xl font-bold">Vastgoeddetails</h2>

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

      {showMatchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-5">
          <div className="w-full max-w-2xl rounded-[2rem] bg-white p-7 shadow-2xl">
            <div className="flex items-start justify-between gap-5">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.24em] text-blue-700">
                  Makelaar matching
                </p>

                <h2 className="mt-3 text-3xl font-black text-[#071B4D]">
                  Waar ben je naar op zoek?
                </h2>

                <p className="mt-3 text-sm leading-7 text-gray-500">
                  Kies wat belangrijk is voor jouw verkoop. SlimWoning gebruikt dit om relevante makelaars te selecteren.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowMatchModal(false)}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#F1F5F9] text-xl font-black text-[#071B4D]"
              >
                ×
              </button>
            </div>

            <div className="mt-7 grid grid-cols-1 gap-3 md:grid-cols-2">
              {[
                'Snel verkopen',
                'Hoogste verkoopprijs',
                'Lage commissie',
                'Lokale makelaar',
                'Luxe vastgoed expert',
                'Nieuwbouw specialist',
              ].map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => toggleMatchPreference(option)}
                  className={`rounded-2xl border p-4 text-left font-bold transition ${
                    matchPreferences.includes(option)
                      ? 'border-[#071B4D] bg-[#EFF6FF] text-[#071B4D]'
                      : 'border-[#E2E8F0] bg-white text-gray-600 hover:border-[#071B4D]'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>

            <div className="mt-8 flex flex-col gap-3 md:flex-row md:justify-end">
              <button
                type="button"
                onClick={() => setShowMatchModal(false)}
                className="rounded-2xl border border-[#CBD5E1] px-6 py-4 font-bold text-[#071B4D]"
              >
                Annuleren
              </button>

              <button
                type="button"
                onClick={handleMatchRequest}
                className="rounded-2xl bg-[#071B4D] px-6 py-4 font-black text-white transition hover:opacity-90"
              >
                Verstuur aanvraag
              </button>
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

function Badge({
  children,
  variant,
}: {
  children: React.ReactNode
  variant: 'green' | 'blue' | 'amber'
}) {
  const classes = {
    green: 'bg-emerald-50 text-emerald-700',
    blue: 'bg-blue-50 text-blue-700',
    amber: 'bg-amber-50 text-amber-700',
  }

  return (
    <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-black ${classes[variant]}`}>
      {children}
    </span>
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
    <div className="rounded-[1.5rem] bg-[#f8fafc] p-5">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-2 text-2xl font-bold">{value}</p>
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
    <div className="mt-6 rounded-[2rem] bg-white p-8 shadow-xl">
      <h2 className="mb-5 text-3xl font-bold">{title}</h2>
      {children}
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
    <div className="flex justify-between gap-5 border-b border-gray-100 py-4">
      <span className="text-gray-500">{label}</span>
      <span className="text-right font-bold">
        {value || 'Niet opgegeven'}
      </span>
    </div>
  )
}
