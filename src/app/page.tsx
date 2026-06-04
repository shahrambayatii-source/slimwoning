'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'
import dynamic from 'next/dynamic'

const BelgiumMap = dynamic(
  () => import('@/components/BelgiumMap'),
  { ssr: false }
)

type LocationSuggestion = {
  id: string
  label: string
}

const propertyTypesWithoutBedrooms = ['Grond', 'Handelszaak', 'Kot', 'Garage']

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type Property = {
  id: string
  title?: string
  city?: string
  price?: number
  image_url?: string
  image?: string
  photo_url?: string
  main_image?: string
  images?: string[]
  created_at?: string
}

const belgiumPostcodes: LocationSuggestion[] = [
  { id: '1930-zaventem', label: '1930 Zaventem' },
  { id: '1930-nossegem', label: '1930 Nossegem' },
  { id: '1933-sterrebeek', label: '1933 Sterrebeek' },
  { id: '1000-brussel', label: '1000 Brussel' },
  { id: '2000-antwerpen', label: '2000 Antwerpen' },
  { id: '9000-gent', label: '9000 Gent' },
]

function getCityFromLocation(value: string) {
  const normalized = value.trim().toLowerCase()
  if (!normalized) return ''

  const knownCities = [
    'Zaventem',
    'Nossegem',
    'Sterrebeek',
    'Brussel',
    'Antwerpen',
    'Gent',
    'Leuven',
    'Brugge',
    'Boechout',
    'Hove',
    'Hasselt',
  ]

  return knownCities.find((city) => normalized.includes(city.toLowerCase())) || value.trim()
}

const defaultMapTiles = [
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/10/522/341.png',
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/10/523/341.png',
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/10/524/341.png',
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/10/525/341.png',
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/10/522/342.png',
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/10/523/342.png',
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/10/524/342.png',
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/10/525/342.png',
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/10/522/343.png',
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/10/523/343.png',
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/10/524/343.png',
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/10/525/343.png',
]


const zaventemMapTiles = [
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/12/2097/1372.png',
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/12/2098/1372.png',
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/12/2099/1372.png',
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/12/2100/1372.png',
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/12/2097/1373.png',
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/12/2098/1373.png',
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/12/2099/1373.png',
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/12/2100/1373.png',
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/12/2097/1374.png',
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/12/2098/1374.png',
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/12/2099/1374.png',
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/12/2100/1374.png',
]

function makeMapTileGrid(x: number, y: number, zoom = 12) {
  return [
    `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${zoom}/${x - 1}/${y - 1}.png`,
    `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${zoom}/${x}/${y - 1}.png`,
    `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${zoom}/${x + 1}/${y - 1}.png`,
    `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${zoom}/${x + 2}/${y - 1}.png`,
    `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${zoom}/${x - 1}/${y}.png`,
    `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${zoom}/${x}/${y}.png`,
    `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${zoom}/${x + 1}/${y}.png`,
    `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${zoom}/${x + 2}/${y}.png`,
    `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${zoom}/${x - 1}/${y + 1}.png`,
    `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${zoom}/${x}/${y + 1}.png`,
    `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${zoom}/${x + 1}/${y + 1}.png`,
    `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${zoom}/${x + 2}/${y + 1}.png`,
  ]
}

const focusedMapTilesByCity: Record<string, string[]> = {
  zaventem: zaventemMapTiles,
  boechout: makeMapTileGrid(2099, 1368),
  hove: makeMapTileGrid(2098, 1368),
  leuven: makeMapTileGrid(2101, 1373),
  gent: makeMapTileGrid(2090, 1370),
  antwerpen: makeMapTileGrid(2098, 1367),
  brugge: makeMapTileGrid(2084, 1367),
  hasselt: makeMapTileGrid(2108, 1372),
}

const defaultMapPins = [
  { city: 'Brugge', count: 14, top: '25%', left: '14%' },
  { city: 'Gent', count: 18, top: '39%', left: '26%' },
  { city: 'Antwerpen', count: 31, top: '22%', left: '48%' },
  { city: 'Hove', count: 7, top: '31%', left: '48%' },
  { city: 'Boechout', count: 12, top: '29%', left: '52%' },
  { city: 'Zaventem', count: 8, top: '45%', left: '58%' },
  { city: 'Leuven', count: 24, top: '47%', left: '64%' },
  { city: 'Hasselt', count: 11, top: '39%', left: '82%' },
]

const cityMapCenters: Record<string, [number, number]> = {
  brussel: [50.8503, 4.3517],
  zaventem: [50.8798, 4.4723],
  leuven: [50.8798, 4.7005],
  antwerpen: [51.2194, 4.4025],
  gent: [51.0543, 3.7174],
  brugge: [51.2093, 3.2247],
  hasselt: [50.9307, 5.3325],
}

const mapCardOffsets: [number, number][] = [
  [-0.018, -0.024],
  [0.016, 0.018],
  [0.026, -0.012],
  [-0.024, 0.022],
]

function getPropertyImage(property: Property) {
  return (
    property.image_url ||
    property.image ||
    property.photo_url ||
    property.main_image ||
    property.images?.[0] ||
    'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?q=80&w=1200&auto=format&fit=crop'
  )
}

export default function HomePage() {
  const [locationQuery, setLocationQuery] = useState('')
  const [selectedLocations, setSelectedLocations] = useState<string[]>([])
  const [showHeroSearch, setShowHeroSearch] = useState(true)
  const [locationSuggestions, setLocationSuggestions] = useState<LocationSuggestion[]>([])
  const [locationLoading, setLocationLoading] = useState(false)
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false)
  const [bedrooms, setBedrooms] = useState(0)
  const [propertyType, setPropertyType] = useState('')
  const [minPrice, setMinPrice] = useState('0')
  const [maxPrice, setMaxPrice] = useState('0')
  const bedroomsDisabled = propertyTypesWithoutBedrooms.includes(propertyType)
  const [latestProperties, setLatestProperties] = useState<Property[]>([])
  const [questionSent, setQuestionSent] = useState(false)
  const [questionText, setQuestionText] = useState('')
  const [questionEmail, setQuestionEmail] = useState('')
  const [sendingQuestion, setSendingQuestion] = useState(false)
  const [aiAnswer, setAiAnswer] = useState('')
  const [savingAlert, setSavingAlert] = useState(false)
  const [searchAlertSaved, setSearchAlertSaved] = useState(false)
  const [showSearchAlertForm, setShowSearchAlertForm] = useState(false)
  const [searchAlertEmail, setSearchAlertEmail] = useState('')
  const [guestQuestionsUsed, setGuestQuestionsUsed] = useState(0)
  const [assistantEmail, setAssistantEmail] = useState('')
  const [assistantEmailSent, setAssistantEmailSent] = useState(false)
  const [showGuestLimitMessage, setShowGuestLimitMessage] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [authChecked, setAuthChecked] = useState(false)
  const [detectedLatitude, setDetectedLatitude] = useState<number | null>(null)
  const [detectedLongitude, setDetectedLongitude] = useState<number | null>(null)
  const [radiusKm, setRadiusKm] = useState(40)
  const [showRadiusCircle, setShowRadiusCircle] = useState(true)
  const [smartFilters, setSmartFilters] = useState<string[]>([])
  const [showSmartFilters, setShowSmartFilters] = useState(false)
  const FREE_LIMIT = 3
  const typedCity = getCityFromLocation(locationQuery)
  const selectedCities = selectedLocations
    .map((location) => getCityFromLocation(location))
    .filter(Boolean)
  const activeCities = selectedCities.length > 0 ? selectedCities : typedCity ? [typedCity] : []
  const focusedCity = activeCities.length === 1 ? activeCities[0] : ''
  const focusedCityKey = focusedCity.toLowerCase()
  const heroMapTiles = focusedCityKey && focusedMapTilesByCity[focusedCityKey]
    ? focusedMapTilesByCity[focusedCityKey]
    : defaultMapTiles
  const heroMapPins = activeCities.length > 0
    ? defaultMapPins.filter((pin) =>
        activeCities.some((city) => city.toLowerCase() === pin.city.toLowerCase())
      )
    : defaultMapPins
  const searchCities = activeCities.join(',')
  const compactMapCards = activeCities.length > 0
  const selectedHomesCount = heroMapPins.reduce((total, pin) => total + pin.count, 0)
  const mapListings = latestProperties.slice(0, 12).map((property, index) => {
    const city = property.city || 'België'
    const baseCenter = cityMapCenters[city.toLowerCase()] || cityMapCenters.brussel
    const offset = mapCardOffsets[index % mapCardOffsets.length]

    return {
      id: property.id,
      source: 'listing',
      tag: index === 0 ? 'NIEUW' : index === 1 ? 'TOP WONING' : city.toUpperCase(),
      title: property.title || 'Woning',
      city,
      position: [baseCenter[0] + offset[0], baseCenter[1] + offset[1]] as [number, number],
      price: `€ ${(property.price || 0).toLocaleString('nl-BE')}`,
      image: getPropertyImage(property),
    }
  })
  const smartFilterOptions = [
    'Rustig wonen',
    'Dicht bij werk',
    'Goed voor gezinnen',
    'Interessant als investering',
    'Veel groen',
  ]

  function toggleSmartFilter(value: string) {
    setSmartFilters((current) =>
      current.includes(value)
        ? current.filter((filter) => filter !== value)
        : [...current, value]
    )
  }

  const heroSponsoredCards = (() => {
    if (activeCities.length === 1) {
      const city = activeCities[0]

      return [
        {
          label: 'Uitgelicht',
          title: `Villa in ${city}`,
          price: '€ 645.000',
          image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=900&q=80',
          alt: `Uitgelichte woning in ${city}`,
        },
        {
          label: 'Top woning',
          title: `Gezinswoning ${city}`,
          price: '€ 525.000',
          image: 'https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?auto=format&fit=crop&w=900&q=80',
          alt: `Top woning in ${city}`,
        },
        {
          label: 'Nieuw',
          title: `Appartement ${city}`,
          price: '€ 395.000',
          image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=900&q=80',
          alt: `Nieuwe woning in ${city}`,
        },
      ]
    }

    if (activeCities.length > 1) {
      const sponsoredSlots = ['Uitgelicht', 'Top woning', 'Nieuw']

      return activeCities.slice(0, 3).map((city, index) => {
        const label = sponsoredSlots[index]

        return {
          label,
          title:
            label === 'Uitgelicht'
              ? `Villa in ${city}`
              : label === 'Top woning'
                ? `Gezinswoning ${city}`
                : `Appartement ${city}`,
          price: label === 'Nieuw' ? '€ 395.000' : label === 'Top woning' ? '€ 525.000' : '€ 645.000',
          image:
            label === 'Nieuw'
              ? 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=900&q=80'
              : label === 'Top woning'
                ? 'https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?auto=format&fit=crop&w=900&q=80'
                : 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=900&q=80',
          alt: `${label} in ${city}`,
        }
      })
    }

    return [
      {
        label: 'Uitgelicht',
        title: 'Villa nabij Gent',
        price: '€ 645.000',
        image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=900&q=80',
        alt: 'Uitgelichte woning in België',
      },
      {
        label: 'Nieuw',
        title: 'Appartement Antwerpen',
        price: '€ 395.000',
        image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=900&q=80',
        alt: 'Nieuw appartement in België',
      },
      {
        label: 'Top woning',
        title: 'Gezinswoning Leuven',
        price: '€ 525.000',
        image: 'https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?auto=format&fit=crop&w=900&q=80',
        alt: 'Top woning in Leuven',
      },
    ]
  })()

  function addSelectedLocation(value: string) {
    const trimmed = value.trim()

    if (!trimmed) return

    setSelectedLocations((current) => {
      if (current.some((location) => location.toLowerCase() === trimmed.toLowerCase())) {
        return current
      }

      return [...current, trimmed]
    })
    setLocationQuery('')
    setLocationSuggestions([])
    setShowLocationSuggestions(false)
  }

  function removeSelectedLocation(value: string) {
    setSelectedLocations((current) => current.filter((location) => location !== value))
  }

  useEffect(() => {
    async function loadAuthAndGuestLimit() {
      const { data: sessionData } = await supabase.auth.getSession()
      const { data: userData } = await supabase.auth.getUser()
      const hasUser = Boolean(sessionData.session?.user || userData.user)

      setIsLoggedIn(hasUser)
      setAuthChecked(true)

      if (hasUser) {
        setGuestQuestionsUsed(0)
        setShowGuestLimitMessage(false)
        localStorage.removeItem('slimmo_guest_questions')
        return
      }

      const used = localStorage.getItem('slimmo_guest_questions')

      if (used) {
        setGuestQuestionsUsed(Number(used))
      }
    }

    loadAuthAndGuestLimit()

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const hasUser = Boolean(session?.user)

      setIsLoggedIn(hasUser)
      setAuthChecked(true)

      if (hasUser) {
        setGuestQuestionsUsed(0)
        setShowGuestLimitMessage(false)
        localStorage.removeItem('slimmo_guest_questions')
      }
    })

    return () => {
      listener.subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    async function loadLatestProperties() {
      try {
        const { data } = await supabase
          .from('properties')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(4)

        if (data) {
          setLatestProperties(data)
        }
      } catch (error) {
        console.log(error)
      }
    }

    loadLatestProperties()
  }, [])

  async function useCurrentLocation() {
    if (!navigator.geolocation) {
      alert('Locatie wordt niet ondersteund door deze browser.')
      return
    }

    setLocationLoading(true)

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords

          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`
          )

          const data = await response.json()
          const postcode = data.address?.postcode
          const city =
            data.address?.city ||
            data.address?.town ||
            data.address?.village ||
            data.address?.municipality ||
            data.address?.county

          const label = [postcode, city].filter(Boolean).join(' ')

          if (label) {
            addSelectedLocation(label)
          } else {
            alert('Locatie gevonden, maar gemeente kon niet worden bepaald.')
          }
        } catch (error) {
          console.log(error)
          alert('Locatie kon niet worden opgehaald.')
        } finally {
          setLocationLoading(false)
        }
      },
      () => {
        setLocationLoading(false)
        alert('Locatietoegang geweigerd.')
      }
    )
  }

  useEffect(() => {
    const query = locationQuery.trim()

    if (query.length < 2) {
      setLocationSuggestions([])
      setShowLocationSuggestions(false)
      return
    }

    const localSuggestions = belgiumPostcodes.filter((item) =>
      item.label.toLowerCase().includes(query.toLowerCase())
    )

    if (localSuggestions.length > 0) {
      setLocationSuggestions(localSuggestions)
      setShowLocationSuggestions(true)
      return
    }

    const timeout = setTimeout(async () => {
      try {
        setLocationLoading(true)

        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&countrycodes=be&addressdetails=1&limit=6&q=${encodeURIComponent(query)}`
        )

        const data = await response.json()

        const suggestions = data
          .map((item: any) => {
            const postcode = item.address?.postcode
            const city =
              item.address?.city ||
              item.address?.town ||
              item.address?.village ||
              item.address?.municipality ||
              item.address?.county

            if (!city && !postcode) return null

            return {
              id: String(item.place_id),
              label: [postcode, city].filter(Boolean).join(' '),
            }
          })
          .filter(Boolean)
          .filter(
            (item: LocationSuggestion, index: number, list: LocationSuggestion[]) =>
              list.findIndex((other) => other.label === item.label) === index
          )

        setLocationSuggestions(suggestions)
        setShowLocationSuggestions(suggestions.length > 0)
      } catch (error) {
        console.log(error)
        setLocationSuggestions([])
        setShowLocationSuggestions(false)
      } finally {
        setLocationLoading(false)
      }
    }, 350)

    return () => clearTimeout(timeout)
  }, [locationQuery])

  async function sendQuestion() {
    const text = questionText.trim()

    if (!text) {
      alert('Voer eerst een vraag in.')
      return
    }
    if (authChecked && !isLoggedIn && guestQuestionsUsed >= FREE_LIMIT) {
      setShowGuestLimitMessage(true)
      return
    }

    try {
      setSendingQuestion(true)

      const { error } = await supabase.from('questions').insert({
        message: text,
        email: questionEmail.trim() || null,
      })

      const aiResponse = await fetch('/api/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: text,
        }),
      })

      const aiData = await aiResponse.json()

      if (error) {
        console.log(error)
        alert(error.message)
        return
      }

      if (aiData.answer) {
        setAiAnswer(aiData.answer)
        setAssistantEmailSent(false)
      }

      if (!isLoggedIn) {
        const newCount = guestQuestionsUsed + 1

        setGuestQuestionsUsed(newCount)

        localStorage.setItem(
          'slimmo_guest_questions',
          String(newCount)
        )

        setShowGuestLimitMessage(newCount >= FREE_LIMIT)
      } else {
        setShowGuestLimitMessage(false)
      }

      setQuestionSent(true)
      setQuestionText('')
      setQuestionEmail('')
    } catch (error: any) {
      console.log(error)
      alert(error?.message || 'Vraag kon niet worden verzonden.')
    } finally {
      setSendingQuestion(false)
    }
  }

  async function saveSearchAlert() {
    if (!searchAlertEmail.trim()) {
      setShowSearchAlertForm(true)
      alert('Voer eerst een e-mailadres in.')
      return
    }

    try {
      setSavingAlert(true)

      const { error } = await supabase.from('search_alerts').insert({
        email: searchAlertEmail.trim(),
        location: searchCities || locationQuery || null,
        property_type: propertyType || null,
        min_price: Number(minPrice) || 0,
        max_price: Number(maxPrice) || 0,
        bedrooms: bedrooms || 0,
      })

      if (error) {
        console.log(error)
        alert('Zoekopdracht kon niet worden opgeslagen.')
        return
      }

      setSearchAlertSaved(true)
      setSearchAlertEmail('')
      setShowSearchAlertForm(false)
    } catch (error) {
      console.log(error)
      alert('Zoekopdracht kon niet worden opgeslagen.')
    } finally {
      setSavingAlert(false)
    }
  }

  return (
    <>
    <main className="min-h-screen bg-[#f4f7fb] px-5 py-6 text-[#111827] md:hidden">
      <section className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-sm flex-col justify-between">
        <div className="pt-8">
          <div className="flex justify-center">
            <div className="flex h-24 w-24 items-center justify-center rounded-[1.75rem] bg-[#071B4D] shadow-2xl shadow-blue-900/20">
              <img
                src="/logo.png"
                alt="SlimWoning"
                className="h-20 w-auto object-contain brightness-0 invert"
              />
            </div>
          </div>

          <div className="mt-8 text-center">
            <h1 className="text-4xl font-black tracking-[-0.04em] text-[#071B4D]">
              SlimWoning
            </h1>
            <p className="mx-auto mt-4 max-w-xs text-base font-semibold leading-7 text-slate-600">
              Slim vastgoedplatform voor kopen, verkopen en analyseren van woningen.
            </p>
          </div>

          <div className="mt-10 space-y-3">
            <Link
              href="/properties"
              className="flex h-14 w-full items-center justify-center rounded-2xl bg-[#071B4D] text-base font-black text-white shadow-xl shadow-blue-900/20 transition active:scale-[0.99]"
            >
              Woningen zoeken
            </Link>

            <Link
              href="/verkopen"
              className="flex h-14 w-full items-center justify-center rounded-2xl border border-blue-100 bg-white text-base font-black text-[#071B4D] shadow-sm transition active:scale-[0.99]"
            >
              Woning verkopen
            </Link>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <Link
              href="/login"
              className="flex h-12 items-center justify-center rounded-2xl border border-slate-200 bg-white text-sm font-black text-blue-700 shadow-sm transition active:scale-[0.99]"
            >
              Inloggen
            </Link>

            <Link
              href="/favorites"
              className="flex h-12 items-center justify-center rounded-2xl border border-slate-200 bg-white text-sm font-black text-blue-700 shadow-sm transition active:scale-[0.99]"
            >
              Favorieten
            </Link>
          </div>
        </div>

        <p className="pb-5 text-center text-xs font-bold leading-5 text-slate-500">
          Open in Safari → Deel → Zet op beginscherm
        </p>
      </section>
    </main>

    <main className="hidden min-h-screen overflow-hidden bg-[#f4f7fb] text-[#111827] md:block">
      <style>{`
        .leaflet-container {
          background: #dbeafe;
        }

        .leaflet-tile {
          filter: saturate(1.12) contrast(1.04) brightness(1.06);
        }
      `}</style>
      <section className="relative bg-[#f4f7fb] px-4 pb-8 pt-0 md:px-8 md:pb-10 md:pt-0 lg:px-20">

        <div className="relative left-1/2 z-0 mb-[-5rem] h-[320px] w-screen -translate-x-1/2 overflow-hidden bg-[#f4f7fb] md:h-[380px]">
          <img
            src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=2400&q=100"
            alt="Luxe moderne woningen"
            className="absolute inset-0 h-full w-full object-cover object-center"
          />

          <div className="absolute inset-0 bg-gradient-to-r from-[#071B4D]/42 via-[#071B4D]/12 to-transparent" />


          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#f4f7fb] via-[#f4f7fb]/88 to-transparent" />

          <div className="absolute -right-24 top-10 h-72 w-72 rounded-full bg-blue-200/30 blur-3xl" />
        </div>
        <div className="relative z-10 mx-auto mt-10 max-w-[1400px]">
          <div className="relative -mt-1 overflow-hidden rounded-[2.75rem] border border-white/70 bg-[#F8FBFF]/95 shadow-2xl shadow-blue-900/10 backdrop-blur-xl">
            <div className="relative min-h-[732px] overflow-hidden bg-white p-4 md:p-6 lg:min-h-[724px]">
              <div className={`absolute inset-x-4 h-[460px] overflow-hidden rounded-[2rem] bg-[#f4f7fb] transition-all duration-300 md:inset-x-6 ${showHeroSearch ? 'top-[15.5rem] md:top-[14.5rem]' : 'top-4 md:top-6'}`}>
                <BelgiumMap
                  center={detectedLatitude && detectedLongitude ? [detectedLatitude, detectedLongitude] : undefined}
                  radiusKm={radiusKm}
                  height="100%"
                  showRadius={showRadiusCircle}
                  selectedCities={activeCities}
                  properties={mapListings}
                />
              </div>



              {!showHeroSearch && (
                <button
                  type="button"
                  onClick={() => setShowHeroSearch(true)}
                  className="absolute left-1/2 top-6 z-50 -translate-x-1/2 rounded-2xl border border-white/80 bg-white/95 px-5 py-3 text-sm font-black text-blue-700 shadow-2xl shadow-blue-900/15 backdrop-blur-2xl transition hover:-translate-x-1/2 hover:-translate-y-0.5 hover:bg-white"
                >
                  Toon zoekfilters
                </button>
              )}

              {showHeroSearch && (
              <div className="relative z-40 rounded-[2rem] border border-blue-100 bg-white/95 p-4 shadow-2xl shadow-blue-900/10 backdrop-blur-2xl">
                <div className="mb-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div className="inline-flex w-fit items-center gap-4 rounded-2xl border border-white/90 bg-white/95 px-4 pt-3 shadow-xl shadow-blue-900/8 backdrop-blur-2xl">
                    <button className="relative pb-3 text-sm font-extrabold text-blue-700">
                      Te koop
                      <span className="absolute bottom-[-1px] left-0 h-1 w-full rounded-full bg-blue-700" />
                    </button>
                    <button className="pb-3 text-sm font-bold text-gray-500">
                      Te huur
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowSmartFilters((value) => !value)}
                      className={`relative pb-3 text-sm font-extrabold transition ${
                        smartFilters.length > 0 || showSmartFilters
                          ? 'text-emerald-700'
                          : 'text-gray-500 hover:text-emerald-700'
                      }`}
                    >
                      Slim zoeken
                      {(smartFilters.length > 0 || showSmartFilters) && (
                        <span className="absolute bottom-[-1px] left-0 h-1 w-full rounded-full bg-emerald-600" />
                      )}
                      {smartFilters.length > 0 && (
                        <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-black text-emerald-700">
                          {smartFilters.length}
                        </span>
                      )}
                    </button>
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <button
                      type="button"
                      onClick={() => setShowSearchAlertForm((value) => !value)}
                      className="inline-flex h-11 items-center justify-center rounded-2xl border border-blue-100 bg-blue-50 px-4 text-xs font-black text-blue-700 shadow-sm shadow-blue-900/5 transition hover:-translate-y-0.5 hover:bg-blue-100"
                    >
                      Bewaar zoekopdracht per e-mail
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowHeroSearch(false)}
                      className="inline-flex h-11 items-center justify-center rounded-2xl bg-[#071B4D] px-4 text-xs font-black text-white shadow-lg shadow-blue-900/10 transition hover:-translate-y-0.5 hover:bg-blue-900"
                    >
                      Kaart groter maken
                    </button>
                  </div>
                </div>

                {showSearchAlertForm && (
                  <div className="mb-3 rounded-2xl border border-blue-100 bg-blue-50/70 p-3">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                      <input
                        type="email"
                        value={searchAlertEmail}
                        onChange={(event) => setSearchAlertEmail(event.target.value)}
                        placeholder="E-mailadres"
                        className="h-11 flex-1 rounded-xl border border-blue-100 bg-white px-4 text-sm font-semibold text-[#071B4D] outline-none transition focus:border-blue-600"
                      />
                      <button
                        type="button"
                        onClick={saveSearchAlert}
                        disabled={savingAlert}
                        className="inline-flex h-11 items-center justify-center rounded-xl bg-[#071B4D] px-4 text-xs font-black text-white shadow-lg shadow-blue-900/10 transition hover:-translate-y-0.5 hover:bg-blue-900 disabled:opacity-50"
                      >
                        {savingAlert ? 'Opslaan...' : 'Bewaar zoekopdracht'}
                      </button>
                    </div>
                    <p className="mt-2 text-xs font-semibold text-gray-600">
                      Bewaar je zoekopdracht en ontvang een e-mail wanneer er nieuwe panden verschijnen die passen bij je gekozen gemeenten en filters.
                    </p>
                  </div>
                )}

                <div className="mt-4">
                  {showSmartFilters && (
                    <div className="mt-3 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-700">
                        Slim zoeken
                      </p>
                      <h3 className="mt-1 text-sm font-black text-[#071B4D]">
                        Waar zoek je naar?
                      </h3>

                      <div className="mt-3 flex flex-wrap gap-2">
                        {smartFilterOptions.map((filter) => {
                          const isActive = smartFilters.includes(filter)

                          return (
                            <button
                              key={filter}
                              type="button"
                              onClick={() => toggleSmartFilter(filter)}
                              className={`rounded-full border px-3 py-2 text-xs font-black transition ${
                                isActive
                                  ? 'border-emerald-600 bg-emerald-600 text-white shadow-lg shadow-emerald-900/15'
                                  : 'border-emerald-100 bg-white text-[#071B4D] hover:-translate-y-0.5 hover:border-emerald-300 hover:bg-emerald-50'
                              }`}
                            >
                              {filter}
                            </button>
                          )
                        })}
                      </div>

                      {smartFilters.length > 0 && (
                        <p className="mt-3 text-xs font-bold text-emerald-700">
                          SlimWoning verfijnt de kaart op basis van: {smartFilters.join(', ')}.
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1.35fr_1fr_0.95fr_0.9fr_0.9fr_9.5rem] lg:items-start">
                  <div className="rounded-2xl border border-white/90 bg-white/95 p-3 shadow-xl shadow-blue-900/8 backdrop-blur-2xl">
                    <label className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-gray-500">
                      Locatie
                    </label>
                    <div className="relative">
                      <input
                        value={locationQuery}
                        onChange={(event) => setLocationQuery(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ',') {
                            event.preventDefault()
                            addSelectedLocation(locationQuery)
                          }
                        }}
                        onFocus={() => {
                          if (locationSuggestions.length > 0) {
                            setShowLocationSuggestions(true)
                          }
                        }}
                        placeholder={selectedLocations.length > 0 ? 'Nog een gemeente toevoegen' : 'Gemeente of postcode'}
                        className="h-12 w-full rounded-2xl border border-gray-200 bg-white px-4 pr-11 text-sm font-semibold text-[#071B4D] outline-none transition focus:border-blue-600"
                      />
                      <button
                        type="button"
                        onClick={useCurrentLocation}
                        className="absolute right-3 top-6 -translate-y-1/2 text-xl text-blue-700 transition hover:scale-110"
                        aria-label="Gebruik mijn locatie"
                      >
                        ⌖
                      </button>
                      {showLocationSuggestions && (
                        <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-40 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl">
                          {locationSuggestions.map((suggestion) => (
                            <button
                              key={suggestion.id}
                              type="button"
                              onClick={() => addSelectedLocation(suggestion.label)}
                              className="block w-full px-5 py-3 text-left text-xs font-bold text-[#0B1F4D] transition hover:bg-[#eef5ff]"
                            >
                              {suggestion.label}
                            </button>
                          ))}
                        </div>
                      )}
                      {locationLoading && (
                        <p className="mt-2 text-xs font-semibold text-blue-700">
                          Gemeenten zoeken...
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/90 bg-white/95 p-3 shadow-xl shadow-blue-900/8 backdrop-blur-2xl">
                    <label className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-gray-500">
                      Type vastgoed
                    </label>
                    <div className="relative">
                      <select
                        value={propertyType}
                        onChange={(event) => {
                          const value = event.target.value
                          setPropertyType(value)

                          if (propertyTypesWithoutBedrooms.includes(value)) {
                            setBedrooms(0)
                          }
                        }}
                        className="h-12 w-full appearance-none rounded-2xl border border-blue-100 bg-white px-4 pr-10 text-sm font-bold text-[#071B4D] outline-none transition focus:border-blue-600"
                      >
                        <option>Selecteer...</option>
                        <option>Huis</option>
                        <option>Appartement</option>
                        <option>Huis en appartement</option>
                        <option>Nieuwbouwproject - Huizen</option>
                        <option>Nieuwbouwproject - Appartementen</option>
                        <option>Nieuwbouwproject</option>
                        <option>Kot</option>
                        <option>Garage</option>
                        <option>Kantoor</option>
                        <option>Handelszaak</option>
                        <option>Industrie</option>
                        <option>Grond</option>
                        <option>Opbrengsteigendom</option>
                        <option>Andere</option>
                      </select>
                      <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-blue-700">
                        ▼
                      </span>
                    </div>
                  </div>

                  <div className={`rounded-2xl border border-white/90 bg-white/95 p-3 shadow-xl shadow-blue-900/8 backdrop-blur-2xl ${bedroomsDisabled ? 'opacity-40' : ''}`}>
                    <label className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-gray-500">
                      Slaapkamers
                    </label>
                    <div className="flex h-12 items-center overflow-hidden rounded-2xl border border-blue-100 bg-white">
                      <button
                        type="button"
                        disabled={bedroomsDisabled}
                        onClick={() => setBedrooms((value) => Math.max(0, value - 1))}
                        className="flex h-12 w-11 items-center justify-center bg-[#F4F7FC] text-base font-black text-gray-500 transition hover:bg-gray-200"
                      >
                        -
                      </button>
                      <div className="flex-1 text-center text-base font-black text-blue-700">
                        {bedrooms}
                      </div>
                      <button
                        type="button"
                        disabled={bedroomsDisabled}
                        onClick={() => setBedrooms((value) => value + 1)}
                        className="flex h-12 w-11 items-center justify-center border-l border-blue-100 bg-white text-base font-black text-blue-700 transition hover:bg-blue-50"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/90 bg-white/95 p-3 shadow-xl shadow-blue-900/8 backdrop-blur-2xl">
                    <label className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-gray-500">
                      Minimumprijs
                    </label>
                    <input
                      type="number"
                      value={minPrice}
                      onChange={(event) => setMinPrice(event.target.value)}
                      className="h-12 w-full rounded-2xl border border-blue-100 bg-white px-4 text-sm font-bold text-[#071B4D] outline-none transition focus:border-blue-600"
                      placeholder="€ 0"
                    />
                  </div>

                  <div className="rounded-2xl border border-white/90 bg-white/95 p-3 shadow-xl shadow-blue-900/8 backdrop-blur-2xl">
                    <label className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-gray-500">
                      Maximumprijs
                    </label>
                    <input
                      type="number"
                      value={maxPrice}
                      onChange={(event) => setMaxPrice(event.target.value)}
                      className="h-12 w-full rounded-2xl border border-blue-100 bg-white px-4 text-sm font-bold text-[#071B4D] outline-none transition focus:border-blue-600"
                      placeholder="€ 0"
                    />
                  </div>

                  <div className="rounded-2xl border border-white/90 bg-white/95 p-2 shadow-2xl shadow-blue-900/14 backdrop-blur-2xl">
                    <Link
                      href={{
                        pathname: '/properties',
                        query: {
                          search: searchCities || locationQuery,
                          city: activeCities[0] || locationQuery,
                          cities: searchCities || undefined,
                          radiusKm: detectedLatitude && detectedLongitude ? String(radiusKm) : undefined,
                          lat: detectedLatitude || undefined,
                          lng: detectedLongitude || undefined,
                          maxPrice,
                        },
                      }}
                      className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#071B4D] px-5 text-sm font-black text-white shadow-xl shadow-blue-900/15 transition hover:-translate-y-0.5 hover:bg-blue-900"
                    >
                      Zoeken
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        setBedrooms(0)
                        setMinPrice('0')
                        setMaxPrice('0')
                        setLocationQuery('')
                        setSelectedLocations([])
                        setSmartFilters([])
                      }}
                      className="mt-2 block w-full text-center text-xs font-bold text-blue-700 underline underline-offset-4"
                    >
                      Filters wissen
                    </button>
                  </div>
                </div>

                {selectedLocations.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2 rounded-2xl border border-blue-100 bg-blue-50/60 p-3">
                    {selectedLocations.map((location) => (
                      <button
                        key={location}
                        type="button"
                        onClick={() => removeSelectedLocation(location)}
                        className="inline-flex items-center gap-2 rounded-full bg-blue-700 px-3 py-1.5 text-xs font-black text-white shadow-md shadow-blue-900/10 transition hover:-translate-y-0.5 hover:bg-blue-900"
                      >
                        {getCityFromLocation(location)}
                        <span className="text-white/80">×</span>
                      </button>
                    ))}
                  </div>
                )}


                {searchAlertSaved && (
                  <p className="mt-2 text-center text-[11px] font-black text-emerald-600">
                    Zoekopdracht opgeslagen
                  </p>
                )}
              </div>
              )}





            </div>
          </div>

          <div className="relative mx-auto mt-8 max-w-[1400px] rounded-[2rem] border border-blue-100 bg-white/90 p-5 shadow-xl shadow-blue-900/5 backdrop-blur-xl md:p-6">
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
              <div>
                <h2 className="mt-2 text-2xl font-black tracking-[-0.035em] text-[#071B4D] md:text-3xl">
                  SlimWoning Assistant
                </h2>
                <p className="mt-3 text-sm font-bold text-gray-500">
                  Slimme hulp voor wonen, kopen, huren en vastgoed.
                </p>
                {aiAnswer && (
                  <div className="mt-5 flex flex-wrap gap-2">
                    {[
                      'Wat betekent EPC?',
                      'Welke kosten komen bij kopen?',
                      'Waarop letten bij huren?',
                      'Welke attesten zijn nodig?',
                    ].map((example) => (
                      <button
                        key={example}
                        type="button"
                        onClick={() => {
                          setQuestionText(example)
                          setQuestionSent(false)
                          setShowGuestLimitMessage(false)
                          setAiAnswer('')
                        }}
                        className="rounded-full border border-blue-100 bg-blue-50 px-3 py-2 text-xs font-black text-blue-700 transition hover:-translate-y-0.5 hover:bg-blue-100"
                      >
                        {example}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <textarea
                  value={questionText}
                  placeholder="Stel je vraag over kopen, huren, verkopen, renoveren, EPC, attesten of kosten..."
                  onChange={(event) => {
                    setQuestionText(event.target.value)
                    setQuestionSent(false)
                    setShowGuestLimitMessage(false)
                    setAiAnswer('')
                  }}
                  className="min-h-[110px] w-full rounded-2xl border border-blue-100 bg-white px-4 py-3 text-sm font-medium text-[#111827] outline-none transition focus:border-blue-600 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400"
                />
                <div className="mt-3 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                  {!aiAnswer && !questionSent && (
                    <div className="flex flex-wrap gap-2">
                      {[
                        'Wat betekent EPC?',
                        'Welke kosten komen bij kopen?',
                      ].map((example) => (
                        <button
                          key={example}
                          type="button"
                          onClick={() => {
                            setQuestionText(example)
                            setQuestionSent(false)
                            setShowGuestLimitMessage(false)
                            setAiAnswer('')
                          }}
                          className="rounded-full border border-blue-100 bg-blue-50 px-3 py-2 text-xs font-black text-blue-700 transition hover:-translate-y-0.5 hover:bg-blue-100"
                        >
                          {example}
                        </button>
                      ))}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={sendQuestion}
                    disabled={sendingQuestion}
                    className="ml-auto rounded-2xl bg-[#071B4D] px-6 py-3 text-sm font-black text-white shadow-xl shadow-blue-900/15 transition hover:-translate-y-0.5 hover:bg-blue-900 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {sendingQuestion ? 'Verzenden...' : 'Vraag stellen'}
                  </button>
                </div>
                {questionSent && (
                  <p className="mt-3 text-sm font-bold text-green-600">
                    Vraag verzonden ✓
                  </p>
                )}
                {authChecked && !isLoggedIn && showGuestLimitMessage && (
                  <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50 p-4">
                    <p className="text-sm font-bold text-[#0B1F4D]">
                      Je hebt je 3 gratis vragen gebruikt. Maak een account aan om onbeperkt vragen te stellen.
                    </p>
                    <Link
                      href="/register"
                      className="mt-3 inline-flex rounded-xl bg-blue-700 px-4 py-2 text-sm font-black text-white transition hover:bg-blue-800"
                    >
                      Account aanmaken
                    </Link>
                  </div>
                )}
                {aiAnswer && (
                  <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50/80 p-5 shadow-sm shadow-blue-900/5">
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-700">
                      SlimWoning Assistent
                    </p>
                    <p className="mt-3 whitespace-pre-line text-sm leading-7 text-[#0B1F4D]">
                      {aiAnswer}
                    </p>
                    <div className="mt-5 rounded-2xl border border-blue-100 bg-white/80 p-4">
                      <p className="text-sm font-black text-[#071B4D]">
                        Wil je dit antwoord per e-mail ontvangen?
                      </p>
                      <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                        <input
                          type="email"
                          value={assistantEmail}
                          onChange={(event) => setAssistantEmail(event.target.value)}
                          placeholder="Jouw e-mailadres"
                          className="h-11 flex-1 rounded-xl border border-blue-100 bg-white px-4 text-sm font-medium text-[#111827] outline-none transition focus:border-blue-600"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (!assistantEmail.trim()) {
                              alert('Voer eerst een e-mailadres in.')
                              return
                            }
                            setAssistantEmailSent(true)
                          }}
                          className="h-11 rounded-xl bg-[#071B4D] px-5 text-sm font-black text-white transition hover:bg-blue-900"
                        >
                          Versturen
                        </button>
                      </div>
                      {assistantEmailSent && (
                        <p className="mt-3 text-xs font-bold text-emerald-600">
                          Antwoord wordt naar je e-mail gestuurd ✓
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-8">
            <div className="mb-7 flex items-end justify-between gap-6">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.2em] text-blue-700">
                  Nieuw toegevoegd
                </p>
                <h2 className="mt-1 text-2xl font-black tracking-[-0.035em] text-[#0B1F4D] md:text-3xl">
                  Nieuwste woningen
                </h2>
              </div>
              <Link
                href="/properties"
                className="text-sm font-bold text-blue-700 transition hover:text-blue-900"
              >
                Bekijk alles →
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2 xl:grid-cols-4">
              {latestProperties.map((property) => (
                <Link
                  key={property.id}
                  href={`/properties/${property.id}`}
                  className="block overflow-hidden rounded-lg bg-white shadow-sm shadow-slate-900/5 ring-1 ring-slate-100 transition hover:-translate-y-1 hover:shadow-md hover:shadow-slate-900/10"
                >
                  <div className="h-40 bg-gradient-to-br from-blue-100 via-white to-blue-200">
                    {(() => {
                      const imageSrc =
                        property.image_url ||
                        property.image ||
                        property.photo_url ||
                        property.main_image ||
                        property.images?.[0]
                      return imageSrc ? (
                        <img
                          src={imageSrc}
                          alt={property.title || 'Woning'}
                          className="h-full w-full object-cover"
                        />
                      ) : null
                    })()}
                  </div>
                  <div className="p-2.5">
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-700">
                      {property.city || 'België'}
                    </p>
                    <h3 className="mt-1 text-sm font-black leading-5 text-[#0B1F4D]">
                      {property.title || 'Woning'}
                    </h3>
                    <p className="mt-1.5 text-sm font-black text-blue-700">
                      € {property.price?.toLocaleString() || '0'}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div className="relative mx-auto mt-8 max-w-[1400px] rounded-[2rem] border border-blue-100 bg-gradient-to-br from-white via-blue-50/40 to-cyan-50/30 p-5 shadow-[0_24px_80px_rgba(37,99,235,0.10)] backdrop-blur-xl md:p-6">
            <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-700">
                    Veel gezocht
                  </p>
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-[11px] font-black text-blue-700">
                    Slim inzicht
                  </span>
                </div>
                <h2 className="mt-2 text-2xl font-black tracking-[-0.035em] text-[#071B4D] md:text-3xl">
                  Populaire regio’s
                </h2>
                <p className="mt-2 text-sm font-semibold text-slate-500">
                  Ontdek woningen in veelgevraagde Belgische steden.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
              {[
                {
                  city: 'Gent',
                  count: '18 woningen',
                  averagePrice: '€ 382.000',
                  averageEpc: 'B',
                },
                {
                  city: 'Antwerpen',
                  count: '31 woningen',
                  averagePrice: '€ 349.000',
                  averageEpc: 'C',
                },
                {
                  city: 'Leuven',
                  count: '24 woningen',
                  averagePrice: '€ 421.000',
                  averageEpc: 'B',
                },
                {
                  city: 'Brugge',
                  count: '14 woningen',
                  averagePrice: '€ 365.000',
                  averageEpc: 'C',
                },
              ].map((item) => (
                <Link
                  key={item.city}
                  href={{
                    pathname: '/properties',
                    query: {
                      search: item.city,
                      city: item.city,
                    },
                  }}
                  className="group relative overflow-hidden rounded-2xl border border-blue-100 bg-white/75 p-5 shadow-sm backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-blue-300 hover:shadow-[0_18px_50px_rgba(37,99,235,0.16)]"
                >
                  <div className="absolute inset-x-5 top-0 h-[3px] rounded-full bg-gradient-to-r from-blue-600 via-cyan-400 to-emerald-400" />

                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-blue-700">
                        Regio
                      </p>
                      <h3 className="mt-2 text-xl font-black text-[#071B4D]">
                        {item.city}
                      </h3>
                      <span className="mt-2 inline-flex rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-black text-emerald-700">
                        AI-match 92%
                      </span>
                    </div>

                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#071B4D] to-blue-700 text-sm font-black text-white shadow-lg shadow-blue-900/20 transition group-hover:translate-x-1">
                      →
                    </span>
                  </div>

                  <div className="mt-5 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <span className="text-xs font-bold text-slate-500">🏠 Woningen</span>
                      <span className="text-sm font-black text-[#071B4D]">{item.count}</span>
                    </div>
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <span className="text-xs font-bold text-slate-500">€ Gem. prijs</span>
                      <span className="text-sm font-black text-[#071B4D]">{item.averagePrice}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-500">⚡ Gem. EPC</span>
                      <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-black text-emerald-700">
                        {item.averageEpc}
                      </span>
                    </div>
                  </div>

                  <div className="mt-5 inline-flex rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 px-4 py-2 text-xs font-black text-white shadow-sm">
                    Bekijk woningen
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
    </>
  )
}
