'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

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
]

const steps = [
  'Adres',
  'Kenmerken',
  'Staat & bouw',
  'Energie',
  'Buitenruimte',
  'Verkoop',
  'Rapport',
]

function parseNumber(value: string) {
  const parsed = Number(String(value || '').replace(/[^0-9.,]/g, '').replace(',', '.'))
  return Number.isFinite(parsed) ? parsed : 0
}

function formatEuro(value: number) {
  return new Intl.NumberFormat('nl-BE', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(value)
}

function hasHouseNumber(value: string) {
  return /\b\d+[a-zA-Z]?\b/.test(value)
}

const localMarketPrices = [
  {
    municipality: 'Boechout',
    postcode: '2530',
    province: 'Antwerpen',
    housePricePerM2: 3450,
    apartmentPricePerM2: 3600,
    updatedAt: '2026-05-31',
  },
  {
    municipality: 'Antwerpen',
    postcode: '2000',
    province: 'Antwerpen',
    housePricePerM2: 3700,
    apartmentPricePerM2: 3900,
    updatedAt: '2026-05-31',
  },
  {
    municipality: 'Mechelen',
    postcode: '2800',
    province: 'Antwerpen',
    housePricePerM2: 3400,
    apartmentPricePerM2: 3550,
    updatedAt: '2026-05-31',
  },
  {
    municipality: 'Zaventem',
    postcode: '1930',
    province: 'Vlaams-Brabant',
    housePricePerM2: 3550,
    apartmentPricePerM2: 2850,
    updatedAt: '2026-05-31',
  },
  {
    municipality: 'Leuven',
    postcode: '3000',
    province: 'Vlaams-Brabant',
    housePricePerM2: 3900,
    apartmentPricePerM2: 4100,
    updatedAt: '2026-05-31',
  },
  {
    municipality: 'Gent',
    postcode: '9000',
    province: 'Oost-Vlaanderen',
    housePricePerM2: 3500,
    apartmentPricePerM2: 3650,
    updatedAt: '2026-05-31',
  },
  {
    municipality: 'Brugge',
    postcode: '8000',
    province: 'West-Vlaanderen',
    housePricePerM2: 3300,
    apartmentPricePerM2: 3450,
    updatedAt: '2026-05-31',
  },
  {
    municipality: 'Hasselt',
    postcode: '3500',
    province: 'Limburg',
    housePricePerM2: 3000,
    apartmentPricePerM2: 3150,
    updatedAt: '2026-05-31',
  },
  {
    municipality: 'Brussel',
    postcode: '1000',
    province: 'Brussels Hoofdstedelijk Gewest',
    housePricePerM2: 3800,
    apartmentPricePerM2: 3950,
    updatedAt: '2026-05-31',
  },
]

function normalizeLocation(value: string) {
  return value.trim().toLowerCase()
}

function getMarketPrice(record: (typeof localMarketPrices)[number], propertyType: string) {
  const normalizedType = propertyType.toLowerCase()
  return normalizedType.includes('appartement') || normalizedType.includes('penthouse') || normalizedType.includes('studio')
    ? record.apartmentPricePerM2
    : record.housePricePerM2
}

function getLocalPricePerM2({
  municipality,
  postcode,
  province,
  propertyType,
}: {
  municipality: string
  postcode: string
  province: string
  propertyType: string
}) {
  const normalizedMunicipality = normalizeLocation(municipality)
  const normalizedPostcode = postcode.trim()
  const normalizedProvince = normalizeLocation(province)

  const localMatch = localMarketPrices.find((record) => {
    const recordMunicipality = normalizeLocation(record.municipality)
    return (
      (!!normalizedPostcode && record.postcode === normalizedPostcode) ||
      (!!normalizedMunicipality && recordMunicipality === normalizedMunicipality)
    )
  })

  if (localMatch) return getMarketPrice(localMatch, propertyType)

  const provinceMatches = localMarketPrices.filter((record) => {
    const recordProvince = normalizeLocation(record.province)
    if (recordProvince === normalizedProvince) return true
    if (['vlaanderen', 'vlaams gewest', 'flanders'].includes(normalizedProvince)) {
      return recordProvince !== normalizeLocation('Brussels Hoofdstedelijk Gewest')
    }
    return false
  })
  if (provinceMatches.length > 0) {
    const total = provinceMatches.reduce((sum, record) => sum + getMarketPrice(record, propertyType), 0)
    return Math.round(total / provinceMatches.length)
  }

  return 3000
}

function estimateValue(data: {
  address: string
  propertyType: string
  pricePerM2: number
  livingArea: string
  bedrooms: string
  bathrooms: string
  epcLabel: string
  epcScore: string
  woningStaat: string
  buildYear: string
  renovationYear: string
  landArea: string
  buitenruimte: string
  parking: string
  heatingType: string
  solarPanels: string
  doubleGlass: string
  expectedPrice: string
}) {
  const living = parseNumber(data.livingArea)
  const land = parseNumber(data.landArea)
  const bedrooms = parseNumber(data.bedrooms)
  const bathrooms = parseNumber(data.bathrooms)
  const buildYear = parseNumber(data.buildYear)
  const renovationYear = parseNumber(data.renovationYear)
  const epcScore = parseNumber(data.epcScore)
  const expected = parseNumber(data.expectedPrice)

  if (expected > 0) return Math.round(expected)

  const normalizedType = data.propertyType.toLowerCase()
  let pricePerSquareMeter = data.pricePerM2 > 0 ? data.pricePerM2 : 3000

  const normalizedAddress = data.address.toLowerCase()
  if (
    (normalizedType.includes('appartement') || normalizedType.includes('studio') || normalizedType.includes('penthouse')) &&
    (normalizedAddress.includes('1930') || normalizedAddress.includes('zaventem'))
  ) {
    pricePerSquareMeter = 2850
  }

  if (normalizedType.includes('villa')) pricePerSquareMeter *= 1.18
  else if (normalizedType.includes('penthouse')) pricePerSquareMeter *= 1.16
  else if (normalizedType.includes('studio')) pricePerSquareMeter *= 0.92
  else if (normalizedType.includes('rijwoning')) pricePerSquareMeter *= 0.98
  else if (normalizedType.includes('halfopen')) pricePerSquareMeter *= 1.04
  else if (normalizedType.includes('open bebouwing')) pricePerSquareMeter *= 1.1
  else if (normalizedType.includes('nieuwbouw')) pricePerSquareMeter *= 1.12

  const effectiveLivingArea = Math.max(living, normalizedType.includes('studio') ? 35 : 60)
  let base = effectiveLivingArea * pricePerSquareMeter

  const usefulBedrooms = Math.max(0, bedrooms - 1)
  const usefulBathrooms = Math.max(0, bathrooms - 1)
  base += usefulBedrooms * 3000
  base += usefulBathrooms * 5000

  if (land > 0) {
    const landRate = Math.max(120, Math.min(220, pricePerSquareMeter * 0.045))
    base += Math.min(land, 1500) * landRate
  }

  const epc = data.epcLabel.trim().toUpperCase()
  if (epcScore > 0) {
    if (epcScore <= 0) base *= 1.1
    else if (epcScore <= 100) base *= 1.08
    else if (epcScore <= 200) base *= 1.03
    else if (epcScore <= 300) base *= 0.98
    else if (epcScore <= 400) base *= 0.93
    else base *= 0.88
  } else if (['A+++++', 'A++++', 'A+++', 'A++', 'A+', 'A'].includes(epc)) {
    base *= 1.04
  } else if (epc === 'B') {
    base *= 1.02
  } else if (epc === 'C') {
    base *= 1.0
  } else if (epc === 'D') {
    base *= 0.96
  } else if (['E', 'F'].includes(epc)) {
    base *= 0.9
  }

  if (data.woningStaat === 'Instapklaar') base *= 1.03
  else if (data.woningStaat === 'Goed onderhouden') base *= 1.00
  else if (data.woningStaat === 'Te renoveren') base *= 0.9
  else if (data.woningStaat === 'Grondige renovatie nodig') base *= 0.8

  if (buildYear >= 2020) base *= 1.08
  else if (buildYear >= 2015) base *= 1.06
  else if (buildYear >= 2000) base *= 1.00
  else if (buildYear > 0 && buildYear < 1975) base *= 0.94

  if (renovationYear >= 2020) base *= 1.06
  else if (renovationYear >= 2015) base *= 1.04
  else if (renovationYear >= 2005) base *= 1.02

  if (data.buitenruimte === 'Tuin') base += 18000
  else if (data.buitenruimte === 'Terras') base += 3500
  else if (data.buitenruimte === 'Balkon') base += 5000

  if (data.parking === 'Garage') base += 18000
  else if (data.parking === 'Parkeerplaats') base += 10000

  if (data.heatingType === 'Warmtepomp') base += 16000
  else if (data.heatingType === 'Gas') base += 0
  else if (data.heatingType === 'Stookolie') base -= 8000
  else if (data.heatingType === 'Elektrisch') base -= 5000

  if (data.solarPanels === 'Ja') base += 10000
  if (data.doubleGlass === 'Ja') base += 0

  return Math.max(50000, Math.round(base / 1000) * 1000)
}

function buildStreetViewUrl(address: string) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  if (!address.trim() || !apiKey) return ''

  const params = new URLSearchParams({
    size: '900x420',
    location: address.trim(),
    key: apiKey,
    fov: '80',
    pitch: '5',
  })

  return `https://maps.googleapis.com/maps/api/streetview?${params.toString()}`
}

export default function SchattingPage() {
  const [step, setStep] = useState(0)
  const [address, setAddress] = useState('')
  const [municipality, setMunicipality] = useState('')
  const [postcode, setPostcode] = useState('')
  const [province, setProvince] = useState('')
  const [pricePerM2, setPricePerM2] = useState(3000)
  const [propertyType, setPropertyType] = useState('')
  const [livingArea, setLivingArea] = useState('')
  const [bedrooms, setBedrooms] = useState('')
  const [bathrooms, setBathrooms] = useState('')
  const [epcLabel, setEpcLabel] = useState('')
  const [epcScore, setEpcScore] = useState('')
  const [woningStaat, setWoningStaat] = useState('')
  const [buildYear, setBuildYear] = useState('')
  const [renovationYear, setRenovationYear] = useState('')
  const [kitchenState, setKitchenState] = useState('')
  const [bathroomState, setBathroomState] = useState('')
  const [landArea, setLandArea] = useState('')
  const [buitenruimte, setBuitenruimte] = useState('')
  const [parking, setParking] = useState('')
  const [lift, setLift] = useState('')
  const [heatingType, setHeatingType] = useState('')
  const [solarPanels, setSolarPanels] = useState('')
  const [doubleGlass, setDoubleGlass] = useState('')
  const [expectedPrice, setExpectedPrice] = useState('')
  const [saleTerm, setSaleTerm] = useState('')
  const [saleReason, setSaleReason] = useState('')
  const [contactName, setContactName] = useState('')
  const [reportEmail, setReportEmail] = useState('')
  const [googleMapsReady, setGoogleMapsReady] = useState(false)
  const [addressSuggestions, setAddressSuggestions] = useState<any[]>([])
  const [showAddressSuggestions, setShowAddressSuggestions] = useState(false)
  const [showPropertyTypeOptions, setShowPropertyTypeOptions] = useState(false)
  const [showValidation, setShowValidation] = useState(false)

  const addressInputRef = useRef<HTMLInputElement | null>(null)
  const streetViewRef = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY
    const input = addressInputRef.current

    if (!apiKey || !input || typeof window === 'undefined') return

    if (!document.getElementById('google-places-autocomplete-style')) {
      const style = document.createElement('style')
      style.id = 'google-places-autocomplete-style'
      style.innerHTML = `
        .pac-container {
          z-index: 999999 !important;
          border-radius: 18px !important;
          border: 1px solid #dbeafe !important;
          box-shadow: 0 18px 45px rgba(15, 23, 42, 0.14) !important;
          overflow: hidden !important;
          margin-top: 8px !important;
          font-family: inherit !important;
        }
        .pac-item {
          padding: 10px 14px !important;
          font-size: 14px !important;
          cursor: pointer !important;
        }
        .pac-item:hover {
          background: #f6f8fc !important;
        }
      `
      document.head.appendChild(style)
    }

    const initializeAutocomplete = async () => {
      const googleMaps = (window as any).google?.maps
      if (!googleMaps) return

      if (!googleMaps.places && typeof googleMaps.importLibrary === 'function') {
        try {
          await googleMaps.importLibrary('places')
        } catch (error) {
          console.warn('Google Places library kon niet worden geladen.', error)
        }
      }
    }

    const existingScript = document.querySelector<HTMLScriptElement>('script[data-google-places="true"]')
    if ((window as any).google?.maps) {
      setGoogleMapsReady(true)
      initializeAutocomplete()
      return
    }

    const script = existingScript || document.createElement('script')
    script.dataset.googlePlaces = 'true'
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry&language=nl&region=BE&v=weekly`
    script.async = true

    const handleLoad = () => {
      setGoogleMapsReady(true)
      initializeAutocomplete()
    }

    script.addEventListener('load', handleLoad)
    script.addEventListener('error', () => {
      console.warn('Google Places autocomplete kon niet worden geladen.')
    })

    if (!existingScript) document.head.appendChild(script)

    return () => {
      script.removeEventListener('load', handleLoad)
    }
  }, [])

  useEffect(() => {
    const googleMaps = (window as any).google?.maps
    const container = streetViewRef.current
    const query = address.trim()

    if (!googleMapsReady || !googleMaps || !container || !query) return

    let cancelled = false
    container.innerHTML = ''

    const geocoder = new googleMaps.Geocoder()
    const streetViewService = new googleMaps.StreetViewService()

    geocoder.geocode({ address: query, region: 'BE' }, (results: any[], status: string) => {
      if (cancelled || status !== 'OK' || !results?.[0]?.geometry?.location) {
        container.innerHTML = '<div class="flex h-full items-center justify-center px-6 text-center text-sm font-bold text-slate-500">Geen Google Street View gevonden voor dit adres.</div>'
        return
      }

      streetViewService.getPanorama(
        {
          location: results[0].geometry.location,
          radius: 80,
          source: googleMaps.StreetViewSource.OUTDOOR,
        },
        (data: any, panoramaStatus: string) => {
          if (cancelled) return

          if (panoramaStatus !== 'OK' || !data?.location?.pano) {
            container.innerHTML = '<div class="flex h-full items-center justify-center px-6 text-center text-sm font-bold text-slate-500">Geen Google Street View gevonden voor dit adres.</div>'
            return
          }

          const targetLocation = results[0].geometry.location
          const panoLocation = data.location.latLng
          const heading = googleMaps.geometry?.spherical?.computeHeading
            ? googleMaps.geometry.spherical.computeHeading(panoLocation, targetLocation)
            : 25

          new googleMaps.StreetViewPanorama(container, {
            pano: data.location.pano,
            pov: { heading, pitch: 5 },
            zoom: 1,
            addressControl: false,
            fullscreenControl: true,
            motionTracking: false,
            motionTrackingControl: false,
            linksControl: false,
            panControl: true,
            zoomControl: true,
          })
        },
      )
    })

    return () => {
      cancelled = true
    }
  }, [address, googleMapsReady])

  useEffect(() => {
    const googleMaps = (window as any).google?.maps
    const query = address.trim()

    if (!googleMapsReady || !googleMaps?.places || query.length < 3) {
      setAddressSuggestions([])
      return
    }

    const timeout = window.setTimeout(() => {
      const service = new googleMaps.places.AutocompleteService()
      service.getPlacePredictions(
        {
          input: query,
          componentRestrictions: { country: 'be' },
          types: ['address'],
        },
        (predictions: any[] | null, status: string) => {
          if (status !== googleMaps.places.PlacesServiceStatus.OK || !predictions) {
            setAddressSuggestions([])
            return
          }

          setAddressSuggestions(predictions.slice(0, 5))
          setShowAddressSuggestions(true)
        },
      )
    }, 250)

    return () => window.clearTimeout(timeout)
  }, [address, googleMapsReady])

  const handleSelectAddressSuggestion = (suggestion: any) => {
    const description = suggestion.description || suggestion.structured_formatting?.main_text || ''
    setAddressSuggestions([])
    setShowAddressSuggestions(false)

    const googleMaps = (window as any).google?.maps
    const placeId = suggestion.place_id

    if (!googleMaps?.places || !placeId) {
      setAddress(description)
      setPricePerM2(getLocalPricePerM2({ municipality: '', postcode: '', province: '', propertyType }))
      return
    }

    const placesContainer = document.createElement('div')
    const service = new googleMaps.places.PlacesService(placesContainer)
    service.getDetails(
      {
        placeId,
        fields: ['formatted_address', 'address_components'],
      },
      (place: any, status: string) => {
        if (status !== googleMaps.places.PlacesServiceStatus.OK || !place) {
          setAddress(description)
          return
        }

        const components = place.address_components || []
        const findComponent = (type: string) =>
          components.find((component: any) => component.types?.includes(type))?.long_name || ''

        const selectedPostcode = findComponent('postal_code')
        const selectedLocality = findComponent('locality')
        const selectedSublocality =
          findComponent('sublocality') ||
          findComponent('sublocality_level_1') ||
          findComponent('neighborhood')
        const selectedMunicipality =
          selectedSublocality ||
          selectedLocality ||
          findComponent('postal_town') ||
          findComponent('administrative_area_level_2')
        const selectedProvince = findComponent('administrative_area_level_1')

        setAddress(place.formatted_address || description)
        setPostcode(selectedPostcode)
        setMunicipality(selectedMunicipality)
        setProvince(selectedProvince)
        setPricePerM2(
          getLocalPricePerM2({
            municipality: selectedMunicipality,
            postcode: selectedPostcode,
            province: selectedProvince,
            propertyType,
          }),
        )
      },
    )
  }
  const estimatedValue = useMemo(
    () =>
      estimateValue({
        address,
        propertyType,
        pricePerM2,
        livingArea,
        bedrooms,
        bathrooms,
        epcLabel,
        epcScore,
        woningStaat,
        buildYear,
        renovationYear,
        landArea,
        buitenruimte,
        parking,
        heatingType,
        solarPanels,
        doubleGlass,
        expectedPrice,
      }),
    [
      address,
      propertyType,
      pricePerM2,
      livingArea,
      bedrooms,
      bathrooms,
      epcLabel,
      epcScore,
      woningStaat,
      buildYear,
      renovationYear,
      landArea,
      buitenruimte,
      parking,
      heatingType,
      solarPanels,
      doubleGlass,
      expectedPrice,
    ],
  )

  // Shared valuation range constants for step 7
  const minValue = Math.round((estimatedValue * 0.92) / 1000) * 1000
  const maxValue = Math.round((estimatedValue * 1.08) / 1000) * 1000
  const valueRange = `${formatEuro(minValue)} - ${formatEuro(maxValue)}`

  const handleReset = () => {
    setStep(0)
    setAddress('')
    setMunicipality('')
    setPostcode('')
    setProvince('')
    setPricePerM2(3000)
    setPropertyType('')
    setLivingArea('')
    setBedrooms('')
    setBathrooms('')
    setEpcLabel('')
    setEpcScore('')
    setWoningStaat('')
    setBuildYear('')
    setRenovationYear('')
    setKitchenState('')
    setBathroomState('')
    setLandArea('')
    setBuitenruimte('')
    setParking('')
    setLift('')
    setHeatingType('')
    setSolarPanels('')
    setDoubleGlass('')
    setExpectedPrice('')
    setSaleTerm('')
    setSaleReason('')
    setContactName('')
    setReportEmail('')
    setShowValidation(false)
    setAddressSuggestions([])
    setShowAddressSuggestions(false)
  }

  useEffect(() => {
    const handleSamePageSchatingClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null
      const link = target?.closest('a')
      if (!link) return

      const href = link.getAttribute('href')
      if (href === '/verkopen/schatting' && window.location.pathname === '/verkopen/schatting') {
        handleReset()
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
    }

    document.addEventListener('click', handleSamePageSchatingClick)
    return () => document.removeEventListener('click', handleSamePageSchatingClick)
  }, [])

  const handleDownloadPdf = async () => {
    const generatedDate = new Intl.DateTimeFormat('nl-BE', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date())

    const minValue = Math.round((estimatedValue * 0.92) / 1000) * 1000
    const maxValue = Math.round((estimatedValue * 1.08) / 1000) * 1000
    const valueRange = `${formatEuro(minValue)} - ${formatEuro(maxValue)}`
    const epc = epcLabel || 'Onbekend'
    const epcNumericScore = parseNumber(epcScore)
    const isAvailable = (value: string) => {
      const normalized = value.trim().toLowerCase()
      return !!normalized && normalized !== 'niet opgegeven' && normalized !== 'onbekend'
    }

    const availableRows = (rows: Array<[string, string]>) =>
      rows.filter(([, value]) => isAvailable(value))

    type PdfDoc = {
      addImage: (imageData: string, format: string, x: number, y: number, width: number, height: number) => void
      addPage: () => void
      line: (x1: number, y1: number, x2: number, y2: number) => void
      rect: (x: number, y: number, width: number, height: number, style?: string) => void
      roundedRect: (x: number, y: number, width: number, height: number, rx: number, ry: number, style?: string) => void
      save: (filename: string) => void
      setDrawColor: (r: number, g: number, b: number) => void
      setFillColor: (r: number, g: number, b: number) => void
      setFont: (fontName: string, fontStyle: string) => void
      setFontSize: (size: number) => void
      setLineWidth: (width: number) => void
      setTextColor: (r: number, g: number, b: number) => void
      splitTextToSize: (text: string, maxWidth: number) => string[]
      text: (text: string | string[], x: number, y: number, options?: { align?: 'left' | 'center' | 'right' }) => void
      triangle: (x1: number, y1: number, x2: number, y2: number, x3: number, y3: number, style?: string) => void
    }

    const loadImage = (src: string) =>
      new Promise<string | null>((resolve) => {
        if (!src) {
          resolve(null)
          return
        }

        const image = new window.Image()
        image.crossOrigin = 'anonymous'
        image.onload = () => {
          const canvas = document.createElement('canvas')
          canvas.width = image.naturalWidth
          canvas.height = image.naturalHeight
          const context = canvas.getContext('2d')
          if (!context) {
            resolve(null)
            return
          }
          try {
            context.drawImage(image, 0, 0)
            if (src.includes('/logo.png')) {
              resolve(canvas.toDataURL('image/png'))
            } else if (src.startsWith('data:image/svg+xml')) {
              resolve(canvas.toDataURL('image/png'))
            } else {
              resolve(canvas.toDataURL('image/jpeg', 0.92))
            }
          } catch (error) {
            console.warn('Afbeelding kon niet in PDF worden geplaatst:', error)
            resolve(null)
          }
        }
        image.onerror = () => resolve(null)
        image.src = src
      })

    const drawPage = (doc: PdfDoc) => {
      doc.setFillColor(246, 248, 252)
      doc.rect(0, 0, 210, 297, 'F')
    }

    const drawFooter = (doc: PdfDoc, page: number) => {
      doc.setDrawColor(226, 232, 240)
      doc.line(18, 282, 192, 282)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(100, 116, 139)
      doc.text('SlimWoning waarde-inschatting - geen officiële taxatie.', 18, 288)
      doc.text(`Pagina ${page}/2`, 192, 288, { align: 'right' })
    }

    const drawCardTitle = (doc: PdfDoc, title: string, x: number, y: number) => {
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10)
      doc.setTextColor(7, 27, 77)
      doc.text(title, x, y)
    }

    const drawPropertySummary = (doc: PdfDoc, x: number, y: number, width: number) => {
      doc.setFillColor(255, 255, 255)
      doc.setDrawColor(219, 234, 254)
      doc.roundedRect(x, y, width, 38, 7, 7, 'FD')
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(7)
      doc.setTextColor(100, 116, 139)
      doc.text('ADRES', x + 8, y + 9)
      doc.setFontSize(11)
      doc.setTextColor(7, 27, 77)
      doc.text(doc.splitTextToSize(address || 'Niet opgegeven', width - 16), x + 8, y + 17)

      const summaryItems = [
        ['Type woning', propertyType],
        ['Woonoppervlakte', livingArea],
        ['Slaapkamers', bedrooms],
      ].filter(([, value]) => isAvailable(value))
      const itemWidth = (width - 16) / Math.max(summaryItems.length, 1)

      summaryItems.forEach(([label, value], index) => {
        const itemX = x + 8 + index * itemWidth
        if (index > 0) {
          doc.setDrawColor(226, 232, 240)
          doc.line(itemX - 4, y + 23, itemX - 4, y + 34)
        }
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(7)
        doc.setTextColor(100, 116, 139)
        doc.text(label, itemX, y + 27)
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(9)
        doc.setTextColor(7, 27, 77)
        doc.text(doc.splitTextToSize(value, itemWidth - 8), itemX, y + 34)
      })
    }

    const drawDetailSection = (
      doc: PdfDoc,
      title: string,
      rows: Array<[string, string]>,
      x: number,
      y: number,
      width: number,
    ) => {
      const visibleRows = availableRows(rows)
      if (!visibleRows.length) return y

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(11)
      doc.setTextColor(7, 27, 77)
      doc.text(title, x, y)

      let rowY = y + 13
      visibleRows.forEach(([label, value], index) => {
        if (index > 0) {
          doc.setDrawColor(226, 232, 240)
          doc.line(x, rowY - 6, x + width, rowY - 6)
        }

        doc.setFont('helvetica', 'normal')
        doc.setFontSize(8)
        doc.setTextColor(71, 85, 105)
        doc.text(label, x, rowY)

        doc.setFont('helvetica', 'bold')
        doc.setFontSize(8)
        doc.setTextColor(7, 27, 77)
        doc.text(doc.splitTextToSize(value, width - 36), x + 36, rowY)

        rowY += 11
      })

      return rowY + 16
    }

    const getEnergyText = () => {
      const label = epc.trim().toUpperCase()

      if (['A+', 'A', 'B'].includes(label)) {
        return 'Deze woning heeft een goede energieprestatie en vereist op korte termijn geen grote energetische renovaties.'
      }

      if (['C', 'D'].includes(label)) {
        return 'Deze woning heeft een gemiddelde energieprestatie. Verdere optimalisatie kan het wooncomfort en de marktwaarde ondersteunen.'
      }

      if (['E', 'F'].includes(label)) {
        return 'Deze woning heeft een lagere energieprestatie. Energetische verbeteringen kunnen belangrijk zijn voor comfort en waarde.'
      }

      return 'Er is geen EPC-label opgegeven. De energieprestatie kon daarom niet volledig worden meegenomen.'
    }

    const createEpcScaleImage = () => {
      const svgWidth = 900
      const svgHeight = 210
      const renderWidth = 2700
      const renderHeight = 630
      const barX = 50
      const barY = 70
      const segmentWidth = 115
      const barHeight = 36
      const arrow = 22
      const labels = ['F', 'E', 'D', 'C', 'B', 'A', 'A+']
      const values = ['500', '400', '300', '200', '100', '0', '-100']
      const colors = ['#c93a32', '#dc643d', '#eea04d', '#f2d35b', '#9bc33f', '#4fa263', '#327f55']
      const selected = epc.trim().toUpperCase()
      const scoreByLabel: Record<string, number> = {
        F: 500,
        E: 420,
        D: 320,
        C: 220,
        B: 150,
        A: 50,
        'A+': -50,
      }
      const score = epcNumericScore > 0 ? epcNumericScore : scoreByLabel[selected] ?? 150
      const scaleWidth = segmentWidth * labels.length
      const markerX = barX + Math.max(0, Math.min(1, (500 - score) / 600)) * scaleWidth

      const segmentPolygon = (index: number) => {
        const x = barX + index * segmentWidth
        return [
          `${x},${barY}`,
          `${x + segmentWidth},${barY}`,
          `${x + segmentWidth + arrow},${barY + barHeight / 2}`,
          `${x + segmentWidth},${barY + barHeight}`,
          `${x},${barY + barHeight}`,
        ].join(' ')
      }

      const segments = labels
        .map((label, index) => {
          return `
            <polygon points="${segmentPolygon(index)}" fill="${colors[index]}" stroke="#ffffff" stroke-width="2.5" stroke-linejoin="round" />
          `
        })
        .reverse()
        .join('')

      const segmentTexts = labels.map((label, index) => {
        const x = barX + index * segmentWidth
        return `
          <text x="${x + segmentWidth / 2}" y="${barY + 22.5}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="15.5" font-weight="700" fill="#ffffff">${label}</text>
        `
      }).join('')

      const ticks = values.map((value, index) => {
        const x = barX + index * segmentWidth
        return `
          <line x1="${x}" y1="${barY + 58}" x2="${x}" y2="${barY + 75}" stroke="#94a3b8" stroke-width="2" />
          <text x="${x}" y="${barY + 104}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="14" fill="#475569">${value}</text>
        `
      }).join('')

      const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="${renderWidth}" height="${renderHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}">
          <rect width="${svgWidth}" height="${svgHeight}" fill="#ffffff" />
          <polygon points="${markerX - 15},30 ${markerX + 15},30 ${markerX},60" fill="#071B4D" />
          ${segments}
          ${segmentTexts}
          <line x1="${barX}" y1="${barY + 65}" x2="${barX + scaleWidth}" y2="${barY + 65}" stroke="#cbd5e1" stroke-width="2" />
          ${ticks}
        </svg>
      `

      return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
    }

    try {
      const { jsPDF } = await import('jspdf')
      const doc = new jsPDF()
      const logoImage = await loadImage('/logo.png')
      const streetViewImage = await loadImage(buildStreetViewUrl(address))

      drawPage(doc)
      doc.setFillColor(7, 27, 77)
      doc.rect(0, 0, 210, 24, 'F')
      doc.setFillColor(255, 255, 255)
      doc.roundedRect(17, 4.5, 34, 16, 3.5, 3.5, 'F')
      if (logoImage) {
        doc.addImage(logoImage, 'PNG', 21.5, 6.3, 25, 12.5)
      } else {
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(6.5)
        doc.setTextColor(7, 27, 77)
        doc.text('SlimWoning', 34, 15, { align: 'center' })
      }
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(7)
      doc.setTextColor(147, 197, 253)
      doc.text('Gegenereerd op', 192, 9, { align: 'right' })
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(9)
      doc.setTextColor(255, 255, 255)
      doc.text(generatedDate, 192, 18, { align: 'right' })

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(18)
      doc.setTextColor(7, 27, 77)
      doc.text('Gratis woningschatting', 105, 43, { align: 'center' })
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.setTextColor(71, 85, 105)
      doc.text('Persoonlijk waarderapport op basis van je woninggegevens', 105, 52, { align: 'center' })

      doc.setFillColor(255, 255, 255)
      doc.setDrawColor(219, 234, 254)
      doc.roundedRect(18, 70, 174, 88, 8, 8, 'FD')

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(71, 85, 105)
      doc.text('Geschatte marktwaarde', 28, 86)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(20)
      doc.setTextColor(7, 27, 77)
      doc.text(valueRange, 28, 101)

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(71, 85, 105)
      doc.text('Adres', 28, 117)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(9)
      doc.setTextColor(7, 27, 77)
      doc.text(doc.splitTextToSize(address || 'Niet opgegeven', 70), 28, 126)

      if (streetViewImage) {
        doc.addImage(streetViewImage, 'JPEG', 112, 82, 68, 35)
      } else {
        doc.setFillColor(226, 232, 240)
        doc.roundedRect(112, 82, 68, 35, 3, 3, 'F')
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(8)
        doc.setTextColor(71, 85, 105)
        doc.text('Street View niet beschikbaar', 146, 101, { align: 'center' })
      }

      doc.setDrawColor(226, 232, 240)
      doc.line(28, 133, 182, 133)

      const topSummary = [
        ['Type woning', propertyType || 'Niet opgegeven'],
        ['Woonoppervlakte', livingArea || 'Niet opgegeven'],
        ['Slaapkamers', bedrooms || 'Niet opgegeven'],
      ].filter(([, value]) => isAvailable(value))
      const topSummaryWidth = 154 / Math.max(topSummary.length, 1)
      topSummary.forEach(([label, value], index) => {
        const itemX = 28 + index * topSummaryWidth
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(8)
        doc.setTextColor(71, 85, 105)
        doc.text(label, itemX + topSummaryWidth / 2, 141, { align: 'center' })
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(9)
        doc.setTextColor(7, 27, 77)
        doc.text(value, itemX + topSummaryWidth / 2, 149, { align: 'center' })
      })

      // EPC card background
      doc.setFillColor(255, 255, 255)
      doc.setDrawColor(219, 234, 254)
      doc.roundedRect(18, 174, 174, 66, 8, 8, 'FD')

      // Centered EPC title
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(11)
      doc.setTextColor(7, 27, 77)
      doc.text('Energielabel', 105, 184, { align: 'center' })
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7.5)
      doc.setTextColor(71, 85, 105)
      doc.text(
        epcNumericScore > 0
          ? `${Math.round(epcNumericScore)} kWh / (m² jaar)`
          : epc === 'Onbekend'
            ? 'EPC-label niet opgegeven'
            : `${Math.round(({
                F: 500,
                E: 420,
                D: 320,
                C: 220,
                B: 150,
                A: 50,
                'A+': -50,
              } as Record<string, number>)[epc.trim().toUpperCase()] ?? 150)} kWh / (m² jaar)`,
        105,
        193,
        { align: 'center' },
      )

      // Rasterize SVG to PNG before adding to PDF
      const epcScaleImage = await loadImage(createEpcScaleImage())
      if (epcScaleImage) {
        doc.addImage(epcScaleImage, 'PNG', 36, 194, 138, 37)
      }

      // Centered explanation below
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(6.5)
      doc.setTextColor(71, 85, 105)
      doc.text(doc.splitTextToSize(getEnergyText(), 125), 105, 232, { align: 'center' })

      drawFooter(doc, 1)

      doc.addPage()
      drawPage(doc)

      doc.setFillColor(7, 27, 77)
      doc.rect(0, 0, 210, 24, 'F')
      doc.setFillColor(255, 255, 255)
      doc.roundedRect(17, 4.5, 34, 16, 3.5, 3.5, 'F')
      if (logoImage) {
        doc.addImage(logoImage, 'PNG', 21.5, 6.3, 25, 12.5)
      } else {
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(6.5)
        doc.setTextColor(7, 27, 77)
        doc.text('SlimWoning', 34, 15, { align: 'center' })
      }
      // Remove generated date block on page 2; keep header and logo only

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(17)
      doc.setTextColor(7, 27, 77)
      doc.text('Details van de woning', 18, 42)

      let leftY = 60
      let rightY = 60
      const leftX = 18
      const rightX = 110
      const columnWidth = 82

      leftY = drawDetailSection(
        doc,
        'Woninggegevens',
        [
          ['Type woning', propertyType || 'Niet opgegeven'],
          ['Woonoppervlakte', livingArea || 'Niet opgegeven'],
          ['Slaapkamers', bedrooms || 'Niet opgegeven'],
          ['Badkamers', bathrooms || 'Niet opgegeven'],
          ['Staat', woningStaat || 'Niet opgegeven'],
          ['Bouwjaar', buildYear || 'Niet opgegeven'],
          ['Renovatiejaar', renovationYear || 'Niet opgegeven'],
        ],
        leftX,
        leftY,
        columnWidth,
      )

      leftY = drawDetailSection(
        doc,
        'Renovatie',
        [
          ['Keukenstaat', kitchenState || 'Niet opgegeven'],
          ['Badkamerstaat', bathroomState || 'Niet opgegeven'],
        ],
        leftX,
        leftY,
        columnWidth,
      )

      leftY = drawDetailSection(
        doc,
        'Verkoopverwachting',
        [
          ['Termijn', saleTerm || 'Niet opgegeven'],
          ['Reden', saleReason || 'Niet opgegeven'],
          ['Waarde', valueRange],
        ],
        leftX,
        leftY,
        columnWidth,
      )

      rightY = drawDetailSection(
        doc,
        'Energie en comfort',
        [
          ['EPC-label', epc],
          ['EPC-score', epcNumericScore > 0 ? `${Math.round(epcNumericScore)} kWh/m²` : 'Niet opgegeven'],
          ['Verwarming', heatingType || 'Niet opgegeven'],
          ['Dubbel glas', doubleGlass || 'Niet opgegeven'],
          ['Zonnepanelen', solarPanels || 'Niet opgegeven'],
          ['Lift', lift || 'Niet opgegeven'],
        ],
        rightX,
        rightY,
        columnWidth,
      )

      rightY = drawDetailSection(
        doc,
        'Buitenruimte en parking',
        [
          ['Buitenruimte', buitenruimte || 'Niet opgegeven'],
          ['Perceeloppervlakte', landArea || 'Niet opgegeven'],
          ['Parking', parking || 'Niet opgegeven'],
          ['Lift', lift || 'Niet opgegeven'],
        ],
        rightX,
        rightY,
        columnWidth,
      )

      rightY = drawDetailSection(
        doc,
        'Contact',
        [
          ['Naam', contactName || 'Niet opgegeven'],
          ['E-mail', reportEmail || 'Niet opgegeven'],
        ],
        rightX,
        rightY,
        columnWidth,
      )

      // Explanation box removed as requested

      drawFooter(doc, 2)
      doc.save('slimwoning-schattingsrapport.pdf')
    } catch (error) {
      console.error('PDF generatie mislukt:', error)
      alert('PDF kon niet worden gegenereerd. Open de browserconsole voor de technische foutmelding.')
    }
  }

  const handleEmailReport = () => {
    const email = reportEmail.trim()
    if (!email || !email.includes('@')) {
      alert('Vul een geldig e-mailadres in.')
      return
    }

    const subject = encodeURIComponent('SlimWoning waarde-inschatting')
    const body = encodeURIComponent([
      'Beste,',
      '',
      'Hierbij de samenvatting van je SlimWoning waarde-inschatting:',
      '',
      `Adres: ${address || 'Niet opgegeven'}`,
      `Type woning: ${propertyType || 'Niet opgegeven'}`,
      `Geschatte marktwaarde: ${formatEuro(estimatedValue)}`,
      '',
      'Let op: deze waarde-inschatting is geen officiële taxatie.',
    ].join('\n'))

    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`
  }

  const stepValid = () => {
    if (step === 0) {
      return address.trim().length > 5 && hasHouseNumber(address)
    }

    if (step === 1) {
      return (
        !!propertyType &&
        parseNumber(livingArea) > 0 &&
        parseNumber(bedrooms) > 0 &&
        parseNumber(bathrooms) > 0 &&
        !!epcLabel
      )
    }

    if (step === 2) {
      return !!woningStaat && parseNumber(buildYear) > 0
    }

    return true
  }

  const nextStep = () => {
    if (!stepValid()) {
      setShowValidation(true)
      return
    }

    setShowValidation(false)
    setStep((current) => Math.min(current + 1, steps.length - 1))
  }
  const previousStep = () => setStep((current) => Math.max(current - 1, 0))

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/50">
      <section className="px-6 py-8 md:px-10 lg:px-16">
        <div className="mx-auto max-w-6xl">
          <div className="mb-6 text-center">
            <h1 className="text-4xl font-black tracking-[-0.035em] text-[#071B4D]">
              Woningwaarde in 7 stappen
            </h1>
          </div>

          <div className="mb-6 grid gap-3 md:grid-cols-7">
            {steps.map((item, index) => (
              <button
                key={item}
                type="button"
                onClick={() => {
                  if (index <= step) {
                    setStep(index)
                    return
                  }

                  if (!stepValid()) {
                    setShowValidation(true)
                    return
                  }

                  setStep(index)
                }}
                className={`rounded-2xl border px-3 py-3 text-xs font-black transition ${
                  index === step && index === steps.length - 1
                    ? 'border-green-500 bg-green-500 text-white shadow-lg shadow-green-900/20'
                    : index === step
                      ? 'border-blue-600 bg-blue-600 text-white shadow-lg shadow-blue-900/20'
                      : index < step
                        ? 'border-green-200 bg-green-50 text-green-700'
                        : index > step
                          ? 'border-slate-200 bg-white text-slate-400 cursor-not-allowed'
                          : 'border-blue-100 bg-white text-slate-500'
                }`}
              >
                {index + 1}. {item}
              </button>
            ))}
          </div>

          <div>
            <div className="mx-auto max-w-3xl rounded-[1.75rem] border border-blue-100 bg-white px-4 py-4 shadow-[0_16px_45px_rgba(15,23,42,0.09)] md:max-w-3xl md:px-6 md:py-6">
              {step === 0 && (
                <div className="space-y-4">
                  <h2 className="text-xl font-black text-[#071B4D] md:text-2xl">1. Adres en gebouwbeeld</h2>
                  <label className="relative block">
                    <span className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                      Adres
                    </span>
                    <input
                      ref={addressInputRef}
                      placeholder="Straat, nummer, gemeente"
                      value={address}
                      onChange={(event) => {
                        setAddress(event.target.value)
                        setMunicipality('')
                        setPostcode('')
                        setProvince('')
                        setPricePerM2(getLocalPricePerM2({ municipality: '', postcode: '', province: '', propertyType }))
                        setShowAddressSuggestions(true)
                      }}
                      onFocus={() => setShowAddressSuggestions(true)}
                      onBlur={() => window.setTimeout(() => setShowAddressSuggestions(false), 150)}
                      autoComplete="off"
                      className="w-full rounded-2xl border border-blue-100 bg-blue-50/30 px-4 py-3 text-sm font-bold text-[#071B4D] outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50"
                    />
                    {showAddressSuggestions && addressSuggestions.length > 0 && (
                      <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.14)]">
                        {addressSuggestions.map((suggestion) => (
                          <button
                            key={suggestion.place_id}
                            type="button"
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={() => handleSelectAddressSuggestion(suggestion)}
                            className="block w-full px-4 py-3 text-left text-sm font-bold text-[#071B4D] transition hover:bg-[#F6F8FC]"
                          >
                            {suggestion.description}
                          </button>
                        ))}
                      </div>
                    )}
                  </label>
                  {showValidation && !stepValid() && (
                    <p className="text-sm font-bold text-red-600">Vul een volledig adres met huisnummer in.</p>
                  )}
                  <div className="overflow-hidden rounded-[1.5rem] border border-blue-100 bg-slate-100">
                    {address.trim() ? (
                      <div ref={streetViewRef} className="h-[220px] w-full md:h-[260px]" />
                    ) : (
                      <div className="flex h-[220px] items-center justify-center px-6 text-center text-sm font-bold text-slate-500 md:h-[260px]">
                        Vul een adres in om een interactieve Google Street View-preview van het gebouw te tonen.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {step === 1 && (
                <div className="space-y-5">
                  <h2 className="text-2xl font-black text-[#071B4D]">2. Woningkenmerken</h2>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="relative">
                      <span className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-slate-500">Type woning</span>
                      <button
                        type="button"
                        onClick={() => setShowPropertyTypeOptions((current) => !current)}
                        onBlur={() => window.setTimeout(() => setShowPropertyTypeOptions(false), 150)}
                        className="flex w-full items-center justify-between rounded-2xl border border-blue-100 bg-blue-50/30 px-4 py-3 text-left text-sm font-bold text-[#071B4D] outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50"
                      >
                        <span className={propertyType ? 'text-[#071B4D]' : 'text-slate-400'}>
                          {propertyType || 'Selecteer type woning'}
                        </span>
                        <span className="text-blue-700">⌄</span>
                      </button>

                      {showPropertyTypeOptions && (
                        <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-72 overflow-auto rounded-2xl border border-blue-100 bg-white p-2 shadow-[0_18px_45px_rgba(15,23,42,0.14)]">
                          {woningTypes.map((type) => (
                            <button
                              key={type}
                              type="button"
                              onMouseDown={(event) => event.preventDefault()}
                              onClick={() => {
                                setPropertyType(type)
                                setPricePerM2(getLocalPricePerM2({ municipality, postcode, province, propertyType: type }))
                                setShowPropertyTypeOptions(false)
                              }}
                              className={`block w-full rounded-xl px-3 py-2.5 text-left text-sm font-bold transition ${
                                propertyType === type
                                  ? 'bg-blue-600 text-white'
                                  : 'text-[#071B4D] hover:bg-[#F6F8FC]'
                              }`}
                            >
                              {type}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <Field label="Woonoppervlakte" placeholder="Bijv. 145 m²" value={livingArea} onChange={setLivingArea} />
                    <Field label="Slaapkamers" placeholder="Bijv. 3" value={bedrooms} onChange={setBedrooms} />
                    <Field label="Badkamers" placeholder="Bijv. 2" value={bathrooms} onChange={setBathrooms} />
                    <SelectField
                      label="EPC-label"
                      value={epcLabel}
                      onChange={setEpcLabel}
                      options={['A+', 'A', 'B', 'C', 'D', 'E', 'F']}
                    />
                    <Field
                      label="EPC-score"
                      placeholder="Bijv. 150 kWh/m²"
                      value={epcScore}
                      onChange={setEpcScore}
                    />
                  </div>
                  {showValidation && (
                    <p className="text-sm font-bold text-red-600">
                      Vul type woning, woonoppervlakte, slaapkamers, badkamers en EPC-label in.
                    </p>
                  )}
                </div>
              )}

              {step === 2 && (
                <>
                  <StepGrid title="3. Staat en bouw">
                    <SelectField label="Staat van de woning" value={woningStaat} onChange={setWoningStaat} options={['Instapklaar', 'Goed onderhouden', 'Te renoveren', 'Grondige renovatie nodig']} />
                    <Field label="Bouwjaar" placeholder="Bijv. 1985" value={buildYear} onChange={setBuildYear} />
                    <Field label="Renovatiejaar" placeholder="Bijv. 2015" value={renovationYear} onChange={setRenovationYear} />
                    <SelectField label="Keukenstaat" value={kitchenState} onChange={setKitchenState} options={['Onbekend', 'Goed', 'Verouderd', 'Te renoveren']} />
                    <SelectField label="Badkamerstaat" value={bathroomState} onChange={setBathroomState} options={['Onbekend', 'Goed', 'Verouderd', 'Te renoveren']} />
                  </StepGrid>
                  {showValidation && (!woningStaat || parseNumber(buildYear) <= 0) && (
                    <p className="text-sm font-bold text-red-600">
                      Staat van de woning en bouwjaar zijn verplicht.
                    </p>
                  )}
                </>
              )}

              {step === 3 && (
                <StepGrid title="4. Comfort en energie">
                  <SelectField label="Verwarmingstype" value={heatingType} onChange={setHeatingType} options={['Onbekend', 'Gas', 'Elektrisch', 'Warmtepomp', 'Stookolie']} />
                  <SelectField label="Zonnepanelen" value={solarPanels} onChange={setSolarPanels} options={['Onbekend', 'Ja', 'Nee']} />
                  <SelectField label="Dubbel glas" value={doubleGlass} onChange={setDoubleGlass} options={['Onbekend', 'Ja', 'Nee']} />
                  <SelectField label="Lift aanwezig" value={lift} onChange={setLift} options={['Niet van toepassing', 'Ja', 'Nee']} />
                </StepGrid>
              )}

              {step === 4 && (
                <StepGrid title="5. Buitenruimte en parking">
                  <Field label="Perceeloppervlakte" placeholder="Bijv. 500 m²" value={landArea} onChange={setLandArea} />
                  <SelectField label="Buitenruimte" value={buitenruimte} onChange={setBuitenruimte} options={['Geen', 'Balkon', 'Terras', 'Tuin']} />
                  <SelectField label="Parking" value={parking} onChange={setParking} options={['Geen', 'Parkeerplaats', 'Garage']} />
                </StepGrid>
              )}

              
              
              {step === 5 && (
                <div className="space-y-5">
                  <h2 className="text-2xl font-black text-[#071B4D]">6. Contact en verkoopverwachting</h2>
                  <div className="rounded-[2rem] border border-blue-100 bg-white p-5 shadow-sm">
                    <p className="text-sm font-black text-[#071B4D]">Contact en verkoopverwachting</p>
                    <p className="mt-1 text-sm text-slate-600">Vul optioneel je gegevens in voor het PDF-rapport.</p>
                    <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                      <Field label="Naam" placeholder="Volledige naam" value={contactName} onChange={setContactName} />
                      <Field label="E-mail" placeholder="jouw@email.be" value={reportEmail} onChange={setReportEmail} />
                      <SelectField label="Verkooptermijn" value={saleTerm} onChange={setSaleTerm} options={['Zo snel mogelijk', 'Binnen 3 maanden', 'Binnen 6 maanden', 'Binnen 12 maanden', 'Nog niet zeker']} />
                      <SelectField label="Verkoopreden" value={saleReason} onChange={setSaleReason} options={['Anders', 'Verhuis', 'Erfenis', 'Investering', 'Nieuwe woning gekocht']} />
                    </div>
                  </div>
                </div>
              )}

              {step === 6 && (
                <div className="space-y-5">
                  <h2 className="text-2xl font-black text-[#071B4D]">7. PDF-rapport</h2>
                  <div className="py-4 text-center">
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Geschatte marktwaarde</p>
                    <p className="mt-3 text-4xl font-black tracking-[-0.03em] text-blue-700">{valueRange}</p>
                    <p className="mx-auto mt-4 max-w-xl text-sm text-slate-600">
                      Professioneel overzicht van de woningkenmerken en geschatte marktwaarde.
                    </p>
                  </div>
                  <div className="flex flex-col justify-center gap-3 sm:flex-row">
                    <button type="button" onClick={handleDownloadPdf} className="rounded-2xl bg-[#071B4D] px-8 py-4 text-sm font-black text-white shadow-lg shadow-blue-900/15 transition hover:-translate-y-0.5 hover:bg-[#0B2A6B] sm:w-56">
                      Download PDF
                    </button>
                    <button
                      type="button"
                      onClick={handleEmailReport}
                      className="rounded-2xl border border-blue-100 bg-white px-8 py-4 text-sm font-black text-blue-700 transition hover:bg-blue-50 sm:w-56"
                    >
                      Per e-mail
                    </button>
                  </div>
                </div>
              )}

              {step === steps.length - 1 ? (
                <div className="mt-4 flex justify-center border-t border-blue-100 pt-4">
                  <button
                    type="button"
                    onClick={() => setStep(0)}
                    className="rounded-2xl border border-blue-100 bg-white px-6 py-4 text-sm font-black text-blue-700 transition hover:bg-blue-50 sm:w-56"
                  >
                    Terug naar start
                  </button>
                </div>
              ) : (
                <div className="mt-4 flex flex-col justify-center gap-3 border-t border-blue-100 pt-4 sm:flex-row">
                  <button type="button" onClick={handleReset} className="rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-black text-[#071B4D] transition hover:bg-slate-50 sm:w-40">
                    Wissen
                  </button>
                  <button type="button" onClick={previousStep} disabled={step === 0} className="rounded-2xl border border-blue-100 bg-blue-50 px-5 py-4 text-sm font-black text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-40 sm:w-40">
                    Vorige
                  </button>
                  <button
                    type="button"
                    onClick={nextStep}
                    className="rounded-2xl bg-blue-700 px-5 py-4 text-sm font-black text-white shadow-lg shadow-blue-900/15 transition hover:-translate-y-0.5 hover:bg-blue-800 sm:w-40"
                  >
                    Volgende stap
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>
      </section>
    </main>
  )
}

type FieldProps = {
  label: string
  placeholder: string
  value: string
  onChange: (value: string) => void
}

function Field({ label, placeholder, value, onChange }: FieldProps) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-slate-500">{label}</span>
      <input
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-blue-100 bg-blue-50/30 px-4 py-3 text-sm font-bold text-[#071B4D] outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50"
      />
    </label>
  )
}

type SelectFieldProps = {
  label: string
  value: string
  options: string[]
  onChange: (value: string) => void
}

function SelectField({ label, value, options, onChange }: SelectFieldProps) {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <span className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-slate-500">{label}</span>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        onBlur={() => window.setTimeout(() => setOpen(false), 150)}
        className="flex w-full items-center justify-between rounded-2xl border border-blue-100 bg-blue-50/30 px-4 py-3 text-left text-sm font-bold text-[#071B4D] outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50"
      >
        <span className={value ? 'text-[#071B4D]' : 'text-slate-400'}>
          {value || 'Selecteer'}
        </span>
        <span className="text-blue-700">⌄</span>
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-72 overflow-auto rounded-2xl border border-blue-100 bg-white p-2 shadow-[0_18px_45px_rgba(15,23,42,0.14)]">
          {options.map((option) => (
            <button
              key={option}
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                onChange(option)
                setOpen(false)
              }}
              className={`block w-full rounded-xl px-3 py-2.5 text-left text-sm font-bold transition ${
                value === option
                  ? 'bg-blue-600 text-white'
                  : 'text-[#071B4D] hover:bg-[#F6F8FC]'
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function StepGrid({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-5">
      <h2 className="text-2xl font-black text-[#071B4D]">{title}</h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">{children}</div>
    </div>
  )
}
