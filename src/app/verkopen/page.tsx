'use client'

import { useEffect, useRef, useState } from 'react'
import { useJsApiLoader } from '@react-google-maps/api'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

const features = [
  {
    title: 'AI-waardescore',
    icon: '📊',
    text: 'Krijg een duidelijke score op basis van woningdata, ligging en marktpositie.',
  },
  {
    title: 'Marktvergelijking',
    icon: '📈',
    text: 'Vergelijk je woning met relevante panden in dezelfde regio en prijsklasse.',
  },
  {
    title: 'Verkoopadvies',
    icon: '💡',
    text: 'Ontdek welke stappen je verkoopkansen en presentatie kunnen versterken.',
  },
  {
    title: 'Energie-impact',
    icon: '⚡',
    text: 'Zie hoe EPC en renovaties je verwachte verkoopwaarde kunnen beïnvloeden.',
  },
]

const woningTypes = [
  'Huis',
  'Appartement',
  'Villa',
  'Studio',
  'Duplex appartement',
  'Penthouse',
  'Rijwoning',
  'Halfopen bebouwing',
  'Open bebouwing',
  'Nieuwbouw woning',
  'Nieuwbouw appartement',
  'Handelszaak',
  'Kantoor',
  'Bouwgrond',
]

export default function VerkopenPage() {
  const [address, setAddress] = useState('')
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null)
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null)
  const [streetViewUrl, setStreetViewUrl] = useState('')
  const [isPreviewLoading, setIsPreviewLoading] = useState(false)
  const [previewError, setPreviewError] = useState('')
  const [propertyType, setPropertyType] = useState('')
  const [livingArea, setLivingArea] = useState('')
  const [bedrooms, setBedrooms] = useState('')
  const [epcLabel, setEpcLabel] = useState('')
  const [expectedPrice, setExpectedPrice] = useState('')
  const [woningStaat, setWoningStaat] = useState('')
  const [bathrooms, setBathrooms] = useState('')
  const [buildYear, setBuildYear] = useState('')
  const [landArea, setLandArea] = useState('')
  const [buitenruimte, setBuitenruimte] = useState('')
  const [parking, setParking] = useState('')
  const [lift, setLift] = useState('')
  const [renovationYear, setRenovationYear] = useState('')
  const [heatingType, setHeatingType] = useState('')
  const [solarPanels, setSolarPanels] = useState('')
  const [doubleGlass, setDoubleGlass] = useState('')
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  const [showInsights, setShowInsights] = useState(false)
  const [city, setCity] = useState('')
  const [comparables, setComparables] = useState<any[]>([])
  const [comparisonLoading, setComparisonLoading] = useState(false)
  const addressInputRef = useRef<HTMLInputElement | null>(null)
  const formCardRef = useRef<HTMLDivElement | null>(null)
  const featureCardsRef = useRef<HTMLDivElement | null>(null)

  const priceFormatter = new Intl.NumberFormat('nl-BE', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  })

  const parseNumeric = (value: string) => {
    const digits = value.replace(/[^\d]/g, '')
    return digits ? Number(digits) : NaN
  }

  const extractCityFromPlace = (addressComponents: any[] | undefined) => {
    if (!addressComponents?.length) return ''

    const cityComponent =
      addressComponents.find((component) =>
        component.types?.includes('locality') ||
        component.types?.includes('postal_town') ||
        component.types?.includes('administrative_area_level_2') ||
        component.types?.includes('administrative_area_level_1')
      ) || addressComponents[addressComponents.length - 1]

    return cityComponent?.long_name ?? ''
  }

  const parseRegionFromAddress = (value: string) => {
    const parts = value.split(',').map((part) => part.trim()).filter(Boolean)
    return parts.length > 1 ? parts[parts.length - 1] : parts[0] || ''
  }

  const userPrice = parseNumeric(expectedPrice)
  const userArea = parseNumeric(livingArea)
  const userPricePerM2 = Number.isFinite(userPrice) && Number.isFinite(userArea) && userArea > 0 ? userPrice / userArea : NaN
  const hasValidPricePerM2 = Number.isFinite(userPricePerM2) && userPricePerM2 > 0

  const cityQuery = (city || parseRegionFromAddress(address)).trim()
  const comparableAreaMin = Number.isFinite(userArea) ? Math.floor(userArea * 0.8) : NaN
  const comparableAreaMax = Number.isFinite(userArea) ? Math.ceil(userArea * 1.2) : NaN

  const comparableCount = comparables.length
  const comparableAvgPricePerM2 = comparableCount > 0
    ? comparables.reduce((sum, item) => sum + (Number(item.pricePerM2) || 0), 0) / comparableCount
    : NaN
  const comparableDifferencePercent = hasValidPricePerM2 && comparableCount > 0
    ? ((userPricePerM2 - comparableAvgPricePerM2) / comparableAvgPricePerM2) * 100
    : NaN
  const hasEnoughComparables = comparableCount >= 3

  const comparisonMessage = comparisonLoading
    ? 'Beschikbare woningdata wordt geladen ...'
    : hasEnoughComparables
      ? 'Deze vergelijking gebruikt beschikbare regionale woningdata en vergelijkbare panden met een vergelijkbaar type, oppervlakte en prijs per m².'
      : 'Er zijn onvoldoende vergelijkbare panden beschikbaar voor een betrouwbare vergelijking.'

  const getFormattedNumber = (value: number) =>
    Number.isFinite(value) ? priceFormatter.format(value) : '-'

  const getRoundedPercent = (value: number) => `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries: ['places'],
  })

  useEffect(() => {
    const query = address.trim()
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

    setStreetViewUrl('')
    setPreviewError('')

    if (!query) {
      setIsPreviewLoading(false)
      return
    }

    if (!apiKey) {
      setPreviewError('Locatiepreview is tijdelijk niet beschikbaar.')
      setIsPreviewLoading(false)
      return
    }

    const controller = new AbortController()
    const timeout = window.setTimeout(async () => {
      setIsPreviewLoading(true)

      try {
        const locationCoordinates = coordinates
          ? { lat: coordinates.lat, lng: coordinates.lng }
          : null

        const coordinatesString = locationCoordinates
          ? `${locationCoordinates.lat},${locationCoordinates.lng}`
          : null

        const useSelectedPlaceLocation = selectedPlaceId !== null && coordinatesString

        if (useSelectedPlaceLocation) {
          const metadataResponse = await fetch(
            `https://maps.googleapis.com/maps/api/streetview/metadata?location=${coordinatesString}&radius=50&key=${apiKey}`,
            { signal: controller.signal }
          )
          const metadata = await metadataResponse.json()

          if (!metadataResponse.ok || metadata?.status !== 'OK') {
            throw new Error('Street View unavailable')
          }

          setStreetViewUrl(
            `https://www.google.com/maps/embed/v1/streetview?key=${apiKey}&location=${coordinatesString}&heading=210&pitch=10&fov=80`
          )
          setPreviewError('')
          return
        }

        const geocodeResponse = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${apiKey}`,
          { signal: controller.signal }
        )
        const geocodeData = await geocodeResponse.json()
        const location = geocodeData?.results?.[0]?.geometry?.location

        if (!geocodeResponse.ok || geocodeData?.status !== 'OK' || !location) {
          throw new Error('Geocoding failed')
        }

        const coordinateString = `${location.lat},${location.lng}`
        const metadataResponse = await fetch(
          `https://maps.googleapis.com/maps/api/streetview/metadata?location=${coordinateString}&radius=50&key=${apiKey}`,
          { signal: controller.signal }
        )
        const metadata = await metadataResponse.json()

        if (!metadataResponse.ok || metadata?.status !== 'OK') {
          throw new Error('Street View unavailable')
        }

        setStreetViewUrl(
          `https://www.google.com/maps/embed/v1/streetview?key=${apiKey}&location=${coordinateString}&heading=210&pitch=10&fov=80`
        )
        setPreviewError('')
      } catch (error) {
        if (!controller.signal.aborted) {
          setStreetViewUrl('')
          setPreviewError('Geen Street View-preview gevonden voor dit adres.')
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsPreviewLoading(false)
        }
      }
    }, 700)

    return () => {
      window.clearTimeout(timeout)
      controller.abort()
    }
  }, [address, coordinates, selectedPlaceId])

  const scrollToForm = () => {
    formCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    addressInputRef.current?.focus()
  }

  const scrollToMarketInfo = () => {
    featureCardsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const loadComparableListings = async () => {
    if (!propertyType || Number.isNaN(userArea) || userArea <= 0) {
      setComparables([])
      return
    }

    setComparisonLoading(true)
    setComparables([])

    const bedroomsNumber = Number.isFinite(parseNumeric(bedrooms)) ? parseNumeric(bedrooms) : null
    const epcTerm = epcLabel.trim()

    let query = supabase
      .from('market_comparables')
      .select('id,price,living_area,property_type,city,postcode,bedrooms,epc')

    if (cityQuery) {
      query = query.ilike('city', `%${cityQuery}%`)
    }

    if (propertyType) {
      query = query.eq('property_type', propertyType)
    }

    if (Number.isFinite(comparableAreaMin) && Number.isFinite(comparableAreaMax)) {
      query = query.gte('living_area', comparableAreaMin).lte('living_area', comparableAreaMax)
    }

    if (bedroomsNumber !== null) {
      query = query.eq('bedrooms', bedroomsNumber)
    }

    if (epcTerm) {
      query = query.ilike('epc', `${epcTerm}%`)
    }

    const { data, error } = await query.limit(100)

    if (error || !data) {
      setComparisonLoading(false)
      return
    }

    const filteredData = (data as any[])
      .map((item) => {
        const price = Number(item.price ?? NaN)
        const area = Number(item.living_area ?? NaN)
        const pricePerM2 = area > 0 && Number.isFinite(price) ? price / area : NaN
        return { ...item, pricePerM2 }
      })
      .filter((item) => Number.isFinite(item.pricePerM2) && item.pricePerM2 > 0)

    const comparableResults = hasValidPricePerM2
      ? filteredData.filter(
          (item) =>
            item.pricePerM2 >= userPricePerM2 * 0.8 &&
            item.pricePerM2 <= userPricePerM2 * 1.2
        )
      : filteredData

    setComparables(comparableResults)
    setComparisonLoading(false)
  }

  const handleSubmitForm = () => {
    const errors: Record<string, string> = {}

    if (!address.trim()) {
      errors.address = 'Vul het adres in.'
    }

    if (!propertyType.trim()) {
      errors.propertyType = 'Vul het type woning in.'
    }

    if (!livingArea.trim()) {
      errors.livingArea = 'Vul de woonoppervlakte in.'
    }

    if (!woningStaat.trim()) {
      errors.woningStaat = 'Vul de staat van de woning in.'
    }

    setFormErrors(errors)

    if (Object.keys(errors).length > 0) {
      setShowInsights(false)
      setComparables([])
      return
    }

    setShowInsights(true)
  }

  useEffect(() => {
    if (!showInsights) return
    loadComparableListings()
  }, [showInsights, propertyType, cityQuery, userArea, bedrooms, epcLabel, userPricePerM2])

  useEffect(() => {
    if (!isLoaded || !addressInputRef.current || !window.google?.maps?.places) return

    const autocomplete = new window.google.maps.places.Autocomplete(addressInputRef.current, {
      componentRestrictions: { country: 'be' },
      fields: ['formatted_address', 'geometry', 'address_components'],
      types: ['address'],
    })

    const listener = autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace()
      const formattedAddress = place.formatted_address || ''
      const placeId = place.place_id || null

      if (!formattedAddress) return

      const placeCity = extractCityFromPlace(place.address_components)
      setAddress(formattedAddress)
      setSelectedPlaceId(placeId)
      setCity(placeCity)

      if (place.geometry?.location) {
        setCoordinates({
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
        })
      } else {
        setCoordinates(null)
      }
    })

    return () => {
      window.google.maps.event.removeListener(listener)
    }
  }, [isLoaded])

  return (
    <main className="min-h-screen bg-[#F4F7FB] text-[#071B4D]">
      <section className="px-6 py-12 md:px-10 lg:px-16">
        <div className="mx-auto flex max-w-[1200px] justify-center">
          <div className="flex min-h-[560px] flex-col justify-between overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-[#071B4D] via-[#0A2463] to-[#071B4D] p-8 text-white shadow-[0_28px_90px_rgba(0,0,0,0.15)] w-full">
            <div>
              <span className="mb-10 inline-flex items-center rounded-full border border-white/15 bg-white/5 px-4 py-1 text-[11px] font-bold uppercase tracking-[0.25em] text-cyan-200/80 backdrop-blur-sm">
                Slim verkopen
              </span>
              <h1 className="text-6xl font-black leading-[0.95] text-white">
                Verkoop je woning slimmer
              </h1>
              <p className="mt-6 max-w-2xl text-xl font-semibold leading-8 text-blue-100">
                Ontvang een slimme inschatting op basis van woningdata en marktinformatie.
              </p>

              <div className="mt-8 h-[260px] overflow-hidden rounded-[1.5rem] border border-white/15 bg-white/5 shadow-[0_20px_60px_rgba(0,0,0,0.20)]">
                {streetViewUrl ? (
                  <iframe
                    title="Locatiepreview woning"
                    src={streetViewUrl}
                    className="h-full w-full border-0"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                ) : isPreviewLoading ? (
                  <div className="grid h-full place-items-center p-6 text-center">
                    <p className="max-w-sm text-sm font-semibold leading-6 text-blue-100">
                      Locatiepreview laden...
                    </p>
                  </div>
                ) : previewError ? (
                  <div className="grid h-full place-items-center p-6 text-center">
                    <p className="max-w-sm text-sm font-semibold leading-6 text-blue-100">
                      {previewError}
                    </p>
                  </div>
                ) : (
                  <div className="grid h-full place-items-center p-6 text-center">
                    <p className="max-w-sm text-sm font-semibold leading-6 text-blue-100">
                      Vul je adres in om de ligging van je woning te bekijken.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
              <Link
                href="/verkopen/schatting"
                className="inline-flex h-14 items-center justify-center rounded-2xl bg-white px-6 text-sm font-black text-[#071B4D] shadow-xl shadow-black/15 transition hover:-translate-y-0.5 hover:shadow-2xl"
              >
                Start gratis inschatting
              </Link>
              <button
                type="button"
                onClick={scrollToMarketInfo}
                className="inline-flex h-14 items-center justify-center rounded-2xl border border-white/25 px-6 text-sm font-black text-white transition hover:bg-white/10"
              >
                Bekijk marktdata
              </button>
            </div>
          </div>

        </div>
      </section>

      <section className="px-6 pb-14 md:px-10 lg:px-16">
        <div className="mb-6">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-700">
            Gratis indicatie
          </p>
          <h2 className="mt-2 text-3xl font-black tracking-[-0.035em] text-[#071B4D]">
            Woninggegevens
          </h2>
        </div>

        {!showInsights ? (
          <form className="grid grid-cols-1 gap-4">
            {/* Basic Required Fields */}
            <div className="grid grid-cols-1 gap-4">
              {/* Adres */}
              <label className="block">
                <span className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                  Adres
                </span>
                <input
                  ref={addressInputRef}
                  placeholder="Straat, nummer, gemeente"
                  value={address}
                  onChange={(event) => {
                    setAddress(event.target.value)
                    setCity('')
                    setSelectedPlaceId(null)
                    setCoordinates(null)
                    setFormErrors((current) => ({ ...current, address: '' }))
                    setShowInsights(false)
                  }}
                  className="h-13 w-full rounded-2xl border border-blue-100 bg-blue-50/30 px-4 py-4 text-sm font-bold text-[#071B4D] outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-blue-50/50"
                />
                {formErrors.address && (
                  <p className="mt-2 text-xs font-semibold text-red-600">{formErrors.address}</p>
                )}
              </label>

              {/* Type woning */}
              <label className="block">
                <span className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                  Type woning
                </span>
                <div className="relative">
                  <select
                    value={propertyType}
                    onChange={(e) => {
                      setPropertyType(e.target.value)
                      setFormErrors((current) => ({ ...current, propertyType: '' }))
                      setShowInsights(false)
                    }}
                    className="h-13 w-full appearance-none rounded-2xl border border-blue-100 bg-blue-50/30 px-4 py-4 pr-12 text-sm font-bold text-[#071B4D] outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-blue-50/50"
                  >
                    <option value="">Selecteer type woning</option>
                    {woningTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                  <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-slate-400">
                    ▾
                  </span>
                </div>
                {formErrors.propertyType && (
                  <p className="mt-2 text-xs font-semibold text-red-600">{formErrors.propertyType}</p>
                )}
              </label>

              {/* Woonoppervlakte */}
              <label className="block">
                <span className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                  Woonoppervlakte
                </span>
                <input
                  placeholder="Bijv. 145 m²"
                  value={livingArea}
                  onChange={(event) => {
                    setLivingArea(event.target.value)
                    setFormErrors((current) => ({ ...current, livingArea: '' }))
                    setShowInsights(false)
                  }}
                  className="h-13 w-full rounded-2xl border border-blue-100 bg-blue-50/30 px-4 py-4 text-sm font-bold text-[#071B4D] outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-blue-50/50"
                />
                {formErrors.livingArea && (
                  <p className="mt-2 text-xs font-semibold text-red-600">{formErrors.livingArea}</p>
                )}
              </label>

              {/* Slaapkamers */}
              <label className="block">
                <span className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                  Slaapkamers
                </span>
                <input
                  placeholder="Bijv. 3"
                  value={bedrooms}
                  onChange={(event) => {
                    setBedrooms(event.target.value)
                    setShowInsights(false)
                  }}
                  className="h-13 w-full rounded-2xl border border-blue-100 bg-blue-50/30 px-4 py-4 text-sm font-bold text-[#071B4D] outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-blue-50/50"
                />
              </label>

              {/* EPC-label */}
              <label className="block">
                <span className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                  EPC-label
                </span>
                <input
                  placeholder="A, B, C..."
                  value={epcLabel}
                  onChange={(event) => {
                    setEpcLabel(event.target.value)
                    setShowInsights(false)
                  }}
                  className="h-13 w-full rounded-2xl border border-blue-100 bg-blue-50/30 px-4 py-4 text-sm font-bold text-[#071B4D] outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-blue-50/50"
                />
              </label>

              {/* Staat van de woning - REQUIRED */}
              <label className="block">
                <span className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                  Staat van de woning
                </span>
                <div className="relative">
                  <select
                    value={woningStaat}
                    onChange={(e) => {
                      setWoningStaat(e.target.value)
                      setFormErrors((current) => ({ ...current, woningStaat: '' }))
                      setShowInsights(false)
                    }}
                    className="h-13 w-full appearance-none rounded-2xl border border-blue-100 bg-blue-50/30 px-4 py-4 pr-12 text-sm font-bold text-[#071B4D] outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-blue-50/50"
                  >
                    <option value="">Selecteer staat van de woning</option>
                    <option value="Instapklaar">Instapklaar</option>
                    <option value="Goed onderhouden">Goed onderhouden</option>
                    <option value="Te renoveren">Te renoveren</option>
                    <option value="Grondige renovatie nodig">Grondige renovatie nodig</option>
                  </select>
                  <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-slate-400">
                    ▾
                  </span>
                </div>
                {formErrors.woningStaat && (
                  <p className="mt-2 text-xs font-semibold text-red-600">{formErrors.woningStaat}</p>
                )}
              </label>

              {/* Richtprijs / gewenste vraagprijs - OPTIONAL */}
              <label className="block">
                <span className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                  Richtprijs / gewenste vraagprijs
                </span>
                <input
                  placeholder="Optioneel, bijv. € 425.000"
                  value={expectedPrice}
                  onChange={(event) => {
                    setExpectedPrice(event.target.value)
                    setShowInsights(false)
                  }}
                  className="h-13 w-full rounded-2xl border border-blue-100 bg-blue-50/30 px-4 py-4 text-sm font-bold text-[#071B4D] outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-blue-50/50"
                />
              </label>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={handleSubmitForm}
                className="flex-1 rounded-2xl bg-[#071B4D] px-5 py-4 text-sm font-black text-white shadow-lg shadow-blue-900/15 transition hover:-translate-y-0.5 hover:bg-[#0B2A6B]"
              >
                Bereken slimme inschatting
              </button>
              <Link
                href="/verkopen/schatting"
                className="flex-1 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-center text-sm font-black text-[#071B4D] shadow-lg shadow-blue-900/10 transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lg"
              >
                Uitgebreide schatting
              </Link>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5 text-sm text-slate-700">
              <h3 className="text-lg font-black text-[#071B4D]">Indicatieve woninginzichten</h3>

              <div className="mt-4 space-y-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Ingevulde gegevens
                  </p>
                  <ul className="mt-3 space-y-2 text-sm text-slate-700">
                    <li>Adres: {address || '-'}</li>
                    <li>Type woning: {propertyType || '-'}</li>
                    <li>Woonoppervlakte: {livingArea ? `${livingArea} m²` : '-'}</li>
                    <li>Slaapkamers: {bedrooms || '-'}</li>
                    <li>Badkamers: {bathrooms || '-'}</li>
                    <li>EPC-label: {epcLabel || '-'}</li>
                    <li>Staat van de woning: {woningStaat || '-'}</li>
                    <li>Richtprijs / gewenste vraagprijs: {expectedPrice ? expectedPrice : '-'} </li>
                    {buildYear && <li>Bouwjaar: {buildYear}</li>}
                    {landArea && <li>Perceeloppervlakte: {landArea}</li>}
                    {buitenruimte && <li>Buitenruimte: {buitenruimte}</li>}
                    {parking && <li>Parking: {parking}</li>}
                    {lift && <li>Lift aanwezig: {lift}</li>}
                    {renovationYear && <li>Renovatiejaar: {renovationYear}</li>}
                    {heatingType && <li>Verwarmingstype: {heatingType}</li>}
                    {solarPanels && <li>Zonnepanelen: {solarPanels}</li>}
                    {doubleGlass && <li>Dubbel glas: {doubleGlass}</li>}
                  </ul>
                </div>

                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Prijs per m²
                  </p>
                  {!expectedPrice.trim() ? (
                    <p className="mt-3 text-sm text-slate-700">
                      Geen richtprijs ingevuld. We tonen alleen inzichten op basis van woninggegevens en beschikbare marktinformatie.
                    </p>
                  ) : hasValidPricePerM2 ? (
                    <p className="mt-3 text-sm text-slate-700">
                      Prijs per m²: ± {getFormattedNumber(userPricePerM2)}/m²
                    </p>
                  ) : (
                    <p className="mt-3 text-sm text-slate-700">
                      Prijs per m² kan niet worden berekend zonder een geldige vraagprijs en woonoppervlakte.
                    </p>
                  )}
                </div>

                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Vergelijkingsbasis
                  </p>
                  <div className="mt-3 text-sm text-slate-700">
                    {comparisonLoading ? (
                      <p>Beschikbare woningdata wordt geladen...</p>
                    ) : hasEnoughComparables ? (
                      <>
                        <p>
                          Deze vergelijking is gemaakt met beschikbare woningdata die overeenkomt met je regio, type woning en oppervlakte.
                        </p>
                        <div className="mt-4 space-y-2 rounded-2xl bg-white p-4 text-slate-700 shadow-sm">
                          <p>
                            Aantal vergelijkbare panden: <span className="font-semibold">{comparableCount}</span>
                          </p>
                          <p>
                            Gemiddelde prijs per m²: <span className="font-semibold">{getFormattedNumber(comparableAvgPricePerM2)}/m²</span>
                          </p>
                          <p>
                            Ingevoerde prijs per m²: <span className="font-semibold">{hasValidPricePerM2 ? `${getFormattedNumber(userPricePerM2)}/m²` : '-'}</span>
                          </p>
                          <p>
                            Verschil: <span className="font-semibold">{Number.isFinite(comparableDifferencePercent) ? getRoundedPercent(comparableDifferencePercent) : '-'}</span>
                          </p>
                        </div>
                      </>
                    ) : (
                      <p>{comparisonMessage}</p>
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Aandachtspunten
                  </p>
                  <ul className="mt-3 space-y-2 text-sm text-slate-700">
                    <li>Deze inzichten zijn indicatief en gebaseerd op de ingevulde gegevens en beschikbare woningdata.</li>
                    <li>Dit is geen officiële waardebepaling of vastgoedadvies.</li>
                    {!hasValidPricePerM2 ? (
                      <li>Controleer of vraagprijs en woonoppervlakte correct zijn ingevuld voor een betere berekening.</li>
                    ) : null}
                  </ul>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowInsights(false)}
              className="mt-2 inline-flex h-14 items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 text-sm font-black text-[#071B4D] shadow-lg shadow-blue-900/10 transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lg"
            >
              Sluiten
            </button>
          </div>
        )}
      </section>

      <section className="px-6 pb-14 md:px-10 lg:px-16">
        <div ref={featureCardsRef} className="mx-auto grid max-w-[1400px] grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {features.map((feature) => (
            <article
              key={feature.title}
              className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-blue-300 hover:shadow-xl"
            >
              <div className="mb-5 flex items-center justify-between gap-4">
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-blue-50 text-xl">
                  {feature.icon}
                </span>
                <div className="h-1.5 w-12 rounded-full bg-gradient-to-r from-blue-600 to-cyan-400" />
              </div>
              <h3 className="text-xl font-black text-[#071B4D]">
                {feature.title}
              </h3>
              <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
                {feature.text}
              </p>
            </article>
          ))}
        </div>

        <div className="mx-auto mt-8 max-w-[1400px] rounded-[2rem] border border-blue-100 bg-white p-6 shadow-[0_18px_55px_rgba(15,23,42,0.08)] md:p-8">
          <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-700">
                Voorbereid verkopen
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-[-0.035em] text-[#071B4D]">
                Krijg meer inzicht voordat je verkoopt
              </h2>
              <p className="mt-3 max-w-3xl text-sm font-semibold leading-7 text-slate-600">
                Breng je woninggegevens samen, ontdek sterke punten en vergelijk je positie met relevante panden in de markt voordat je een vraagprijs bepaalt.
              </p>
            </div>

            <a
              href="#waardebepaling"
              className="inline-flex h-12 items-center justify-center rounded-2xl bg-[#071B4D] px-5 text-sm font-black text-white shadow-lg shadow-blue-900/15 transition hover:-translate-y-0.5 hover:shadow-2xl"
            >
              Inzicht starten
            </a>
          </div>
        </div>

        <div className="mx-auto mt-8 max-w-[1400px] rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
          <h2 className="text-3xl font-black tracking-[-0.035em] text-[#071B4D]">
            Van voorbereiding tot sleuteloverdracht
          </h2>
          <div className="mt-4 space-y-5 text-justify text-base font-medium leading-8 text-slate-600">
            <p>
              Een woning verkopen begint niet bij de advertentie, maar bij een goede voorbereiding. Verzamel eerst je woninggegevens, documenten, EPC-informatie, foto's en eventuele renovatiegegevens.
            </p>
            <p>
              Daarna bepaal je een realistische vraagprijs op basis van vergelijkbare woningen, ligging, staat, oppervlakte en marktinformatie. Een duidelijke presentatie helpt om de juiste koper aan te trekken.
            </p>
            <p>
              Wanneer geïnteresseerden reageren, volgen bezichtigingen, vragen, onderhandelingen en eventueel een bod. Na akkoord worden de afspraken vastgelegd en begeleidt de notaris de juridische afhandeling.
            </p>
            <p>
              SlimWoning helpt je om deze stappen overzichtelijk voor te bereiden, zodat je met meer inzicht en vertrouwen aan het verkoopproces begint.
            </p>
          </div>
        </div>

        <div className="mx-auto mt-8 max-w-[1400px]">
          <div className="mb-5">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-700">
              Rapportvoorbeelden
            </p>
            <h2 className="mt-2 text-3xl font-black tracking-[-0.035em] text-[#071B4D]">
              Voorbeeld vergelijkingsrapporten
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {[
              {
                title: 'Prijspositie',
                text: 'Bekijk hoe een woning zich verhoudt tot vergelijkbare panden in dezelfde regio.',
              },
              {
                title: 'Energieprofiel',
                text: 'Krijg inzicht in EPC, renovatiesignalen en mogelijke impact op verkoopwaarde.',
              },
              {
                title: 'Marktkansen',
                text: 'Ontdek sterke punten, aandachtspunten en presentatiekansen voor verkoop.',
              },
            ].map((report) => (
              <article
                key={report.title}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl"
              >
                <div className="mb-5 h-1.5 w-12 rounded-full bg-gradient-to-r from-blue-600 to-cyan-400" />
                <h3 className="text-xl font-black text-[#071B4D]">
                  {report.title}
                </h3>
                <p className="mt-3 text-sm font-medium leading-6 text-slate-600">
                  {report.text}
                </p>
              </article>
            ))}
          </div>
        </div>

        <p className="mx-auto mt-6 max-w-[1400px] text-center text-xs font-semibold text-slate-500">
          Alle inzichten zijn indicatief en gebaseerd op beschikbare woningdata en marktinformatie.
        </p>
      </section>
    </main>
  )
}
