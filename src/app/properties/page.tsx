'use client'

import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { calculateEnergyInsight } from '@/lib/energy-calculator'
import { exportEnergyReport } from '@/lib/export-energy-report'
import { getRenovatieScan, type RenovatiePhotoAnalysis } from '@/lib/renovatie-scan'
import { getWoningkenmerken } from '@/lib/woningkenmerken'
import { GoogleMap, InfoWindow, Marker, useJsApiLoader } from '@react-google-maps/api'

export default function PropertiesPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#F6F8FC] px-6 py-12 text-[#071B4D] md:px-10">
          <div className="mx-auto max-w-7xl rounded-[2.5rem] bg-white p-10 shadow-2xl">
            <p className="text-lg font-bold text-gray-500">Woningen laden...</p>
          </div>
        </main>
      }
    >
      <PropertiesContent />
    </Suspense>
  )
}

function PropertiesContent() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const searchInputRef = useRef<HTMLInputElement | null>(null)
  const sortDropdownRef = useRef<HTMLDivElement | null>(null)
  const isRentPage = pathname.startsWith('/huren')
  const routeBase = isRentPage ? '/huren' : '/properties'

  const [properties, setProperties] = useState<any[]>([])
  const [openRenovatieScanId, setOpenRenovatieScanId] = useState<number | null>(null)
  const [renovatiePhotoAnalyses, setRenovatiePhotoAnalyses] = useState<Record<number, RenovatiePhotoAnalysis>>({})
  const [renovatiePhotoLoading, setRenovatiePhotoLoading] = useState<Record<number, boolean>>({})
  const [renovatiePhotoErrors, setRenovatiePhotoErrors] = useState<Record<number, string>>({})
  const openRenovatieScanProperty = useMemo(() => {
    if (openRenovatieScanId === null) return null

    return properties.find((property) => Number(property.id) === openRenovatieScanId) || null
  }, [openRenovatieScanId, properties])
  const [marketComparables, setMarketComparables] = useState<any[]>([])
  const [favoriteIds, setFavoriteIds] = useState<number[]>([])
  const [compareIds, setCompareIds] = useState<number[]>([])
  const [userId, setUserId] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [search, setSearch] = useState('')
  const [appliedSearch, setAppliedSearch] = useState('')
  const [city, setCity] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [minPrice, setMinPrice] = useState('')
  const [propertyType, setPropertyType] = useState('')
  const [offeredSince, setOfferedSince] = useState('')
  const [minLivingArea, setMinLivingArea] = useState('')
  const [maxLivingArea, setMaxLivingArea] = useState('')
  const [minBedrooms, setMinBedrooms] = useState('')
  const [maxBedrooms, setMaxBedrooms] = useState('')
  const [minBathrooms, setMinBathrooms] = useState('')
  const [maxBathrooms, setMaxBathrooms] = useState('')
  const [minRooms, setMinRooms] = useState('')
  const [maxRooms, setMaxRooms] = useState('')
  const [minPlotArea, setMinPlotArea] = useState('')
  const [maxPlotArea, setMaxPlotArea] = useState('')
  const [keywordFilter, setKeywordFilter] = useState('')
  const [openPriceField, setOpenPriceField] = useState<'min' | 'max' | null>(null)
  const [openFilter, setOpenFilter] = useState<string | null>(null)
  const priceOptions = [
    0,
    50000,
    75000,
    100000,
    125000,
    150000,
    175000,
    200000,
    225000,
    250000,
    275000,
    300000,
    325000,
    350000,
    375000,
    400000,
    450000,
    500000,
    550000,
    600000,
    650000,
    700000,
    750000,
    800000,
    900000,
    1000000,
    1250000,
    1500000,
    2000000,
    2500000,
    3000000,
    3500000,
    4000000,
    4500000,
    5000000,
  ]
  const allPropertyTypeOptions = [
    { label: 'Huis', value: 'Huis', count: '52.486' },
    { label: 'Appartement', value: 'Appartement', count: '36.355' },
    { label: 'Huis en appartement', value: 'Huis en appartement', count: '1.204' },
    { label: 'Nieuwbouwproject – Huizen', value: 'Nieuwbouwproject – Huizen', count: '823' },
    { label: 'Nieuwbouwproject – Appartementen', value: 'Nieuwbouwproject – Appartementen', count: '1.578' },
    { label: 'Nieuwbouwproject', value: 'Nieuwbouwproject', count: '2.041' },
    { label: 'Kot', value: 'Kot', count: '312' },
    { label: 'Garage', value: 'Garage', count: '746' },
    { label: 'Kantoor', value: 'Kantoor', count: '584' },
    { label: 'Handelszaak', value: 'Handelszaak', count: '231' },
    { label: 'Industrie', value: 'Industrie', count: '119' },
    { label: 'Grond', value: 'Grond', count: '1.423' },
    { label: 'Opbrengsteigendom', value: 'Opbrengsteigendom', count: '392' },
    { label: 'Andere', value: 'Andere', count: '88' },
  ]
  const allEnergyLabelOptions = [
    'A+++++',
    'A++++',
    'A+++',
    'A++',
    'A+',
    'A',
    'B',
    'C',
    'D',
    'E',
    'F',
    'G',
  ]
  const allBuildPeriodOptions = [
    'Onbekend',
    'Voor 1906',
    '1906-1930',
    '1931-1944',
    '1945-1959',
    '1960-1970',
    '1971-1980',
    '1981-1990',
    '1991-2000',
    '2001-2010',
    '2011-2020',
    'Na 2020',
  ]

  function normalizeBelgianSearchLabel(value: string) {
    const normalizedValue = value.trim()

    const replacements: Record<string, string> = {
      ghent: 'Gent',
      brussels: 'Brussel',
      bruges: 'Brugge',
      antwerp: 'Antwerpen',
      mechelen: 'Mechelen',
      leuven: 'Leuven',
      hasselt: 'Hasselt',
      kortrijk: 'Kortrijk',
      aalst: 'Aalst',
      oostend: 'Oostende',
    }

    const key = normalizedValue.toLowerCase()

    return replacements[key] || normalizedValue
  }

  function getCleanPlaceSearchLabel(place: google.maps.places.PlaceResult) {
    const country = place.address_components?.find((component) =>
      component.types.includes('country')
    )?.short_name

    if (country && country.toLowerCase() !== 'be') return ''

    const components = place.address_components || []

    const postcode = components.find((component) =>
      component.types.includes('postal_code')
    )?.long_name

    const city = components.find((component) =>
      component.types.includes('locality') ||
      component.types.includes('postal_town') ||
      component.types.includes('administrative_area_level_2')
    )?.long_name

    const route = components.find((component) =>
      component.types.includes('route')
    )?.long_name

    const streetNumber = components.find((component) =>
      component.types.includes('street_number')
    )?.long_name

    if (route && streetNumber && city) return normalizeBelgianSearchLabel(`${route} ${streetNumber}, ${city}`)
    if (route && city) return normalizeBelgianSearchLabel(`${route}, ${city}`)
    if (postcode && city) return normalizeBelgianSearchLabel(`${postcode} ${city}`)
    if (city) return normalizeBelgianSearchLabel(city)
    if (postcode) return postcode

    return normalizeBelgianSearchLabel(
      (place.name || place.formatted_address || '')
        .replace(/,\s*(Nederland|Netherlands|België|Belgium)$/i, '')
        .trim()
    )
  }

  function formatPriceOption(value: number) {
    return `€ ${new Intl.NumberFormat('nl-BE', {
      maximumFractionDigits: 0,
    }).format(value)}`
  }

  function formatFilterPriceLabel(value: string, fallback: string) {
    if (!value) return fallback
    return value.includes('€') ? value : `€ ${value}`
  }
  const [submittedSearchKey, setSubmittedSearchKey] = useState(0)
  const [selectedMapProperty, setSelectedMapProperty] = useState<any>(null)
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null)
  const [openEnergyScanId, setOpenEnergyScanId] = useState<number | null>(null)
  const [manualEnergyData, setManualEnergyData] = useState<Record<number, Record<string, unknown>>>({})
  const [energyScanRefreshKey, setEnergyScanRefreshKey] = useState(0)
  const [viewMode, setViewMode] = useState<'compact' | 'large' | 'premium'>('compact')
  const [showMap, setShowMap] = useState(true)
  const [showAllFilters, setShowAllFilters] = useState(false)
  const [offerType, setOfferType] = useState<'Koop' | 'Huur'>(isRentPage ? 'Huur' : 'Koop')
  const [slimmoPrompt, setSlimmoPrompt] = useState('')
  const [showWoningen, setShowWoningen] = useState(true)
  const [selectedExtraFilters, setSelectedExtraFilters] = useState<string[]>([])
  const [showMoreTypes, setShowMoreTypes] = useState(false)
  const [showMoreEnergyLabels, setShowMoreEnergyLabels] = useState(false)
  const [showMoreBuildPeriods, setShowMoreBuildPeriods] = useState(false)
  const [showMoreLocations, setShowMoreLocations] = useState(false)
  const [showMoreParkingOptions, setShowMoreParkingOptions] = useState(false)
  const [showMoreGarageOptions, setShowMoreGarageOptions] = useState(false)
  const [showMoreAccessibilityOptions, setShowMoreAccessibilityOptions] = useState(false)
  const [showMoreFeatureOptions, setShowMoreFeatureOptions] = useState(false)
  const [nearbyMode, setNearbyMode] = useState(false)
  const [nearbyIds, setNearbyIds] = useState<number[]>([])
  const [loadingNearby, setLoadingNearby] = useState(false)
  const [nearbyError, setNearbyError] = useState('')
  const [showRadiusPicker, setShowRadiusPicker] = useState(false)
  const [showCustomRadiusInput, setShowCustomRadiusInput] = useState(false)
  const [customRadiusKm, setCustomRadiusKm] = useState('')
  const [sortOption, setSortOption] = useState('Slimste match')
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false)
  const sortOptions = [
    'Slimste match',
    'Hoogste AI-score',
    'Beste prijs/kwaliteit',
    'Dichtstbij',
    'Nieuwste',
    'Prijs laag-hoog',
    'Prijs hoog-laag',
  ]
  function handleSlimmoSearch() {
    const prompt = slimmoPrompt.trim()

    if (!prompt) return

    setSearch(prompt)
    setAppliedSearch(prompt)
    setShowAllFilters(false)
    setSelectedMapProperty(null)
    setSubmittedSearchKey((current) => current + 1)

    const params = new URLSearchParams()
    params.set('search', prompt)

    router.replace(`${routeBase}?${params.toString()}`, {
      scroll: false,
    })
  }

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries: ['places'],
  })

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        sortDropdownRef.current &&
        event.target instanceof Node &&
        !sortDropdownRef.current.contains(event.target)
      ) {
        setIsSortDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  useEffect(() => {
    if (!isLoaded || !searchInputRef.current || !window.google?.maps?.places) return

    const autocomplete = new window.google.maps.places.Autocomplete(searchInputRef.current, {
      componentRestrictions: { country: 'be' },
      fields: ['formatted_address', 'name', 'address_components', 'geometry'],
      types: ['(regions)'],
      bounds: new window.google.maps.LatLngBounds(
        new window.google.maps.LatLng(49.45, 2.5),
        new window.google.maps.LatLng(51.6, 6.4)
      ),
      strictBounds: true,
    })

    const listener = autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace()
      const selectedLocation = getCleanPlaceSearchLabel(place)
      const cleanLocation = selectedLocation.trim()

      if (!cleanLocation) {
        setSearch('')
        setAppliedSearch('')
        setSelectedMapProperty(null)
        setSubmittedSearchKey((current) => current + 1)
        router.replace(routeBase, { scroll: false })
        return
      }

      setSearch(cleanLocation)
      setAppliedSearch(cleanLocation)
      setSelectedMapProperty(null)
      setSubmittedSearchKey((current) => current + 1)

      const params = new URLSearchParams()

      if (cleanLocation) params.set('search', cleanLocation)
      if (city.trim()) params.set('city', city.trim())
      if (minPrice.trim()) params.set('minPrice', minPrice.trim())
      if (maxPrice.trim()) params.set('maxPrice', maxPrice.trim())
      if (propertyType.trim()) params.set('type', propertyType.trim())
      if (offeredSince.trim()) params.set('offered', offeredSince.trim())
      if (minLivingArea.trim()) params.set('minArea', minLivingArea.trim())
      if (maxLivingArea.trim()) params.set('maxArea', maxLivingArea.trim())
      if (minBedrooms.trim()) params.set('minBedrooms', minBedrooms.trim())
      if (maxBedrooms.trim()) params.set('maxBedrooms', maxBedrooms.trim())

      const queryString = params.toString()
      router.replace(queryString ? `${routeBase}?${queryString}` : routeBase, {
        scroll: false,
      })

      if (place.geometry?.location && mapInstance) {
        mapInstance.setCenter(place.geometry.location)
        mapInstance.setZoom(12)
        setShowMap(true)
      }
    })

    return () => {
      window.google.maps.event.removeListener(listener)
    }
  }, [
    isLoaded,
    router,
    city,
    minPrice,
    maxPrice,
    propertyType,
    offeredSince,
    minLivingArea,
    maxLivingArea,
    minBedrooms,
    maxBedrooms,
    mapInstance,
  ])

  useEffect(() => {
    if (!/netherlands|nederland/i.test(search) && !/netherlands|nederland/i.test(appliedSearch)) return

    setSearch('')
    setAppliedSearch('')
    setSelectedMapProperty(null)
    setSubmittedSearchKey((current) => current + 1)

    const params = new URLSearchParams(searchParams.toString())
    params.delete('search')

    const queryString = params.toString()
    router.replace(queryString ? `${routeBase}?${queryString}` : routeBase, {
      scroll: false,
    })
  }, [search, appliedSearch])


  function houseMarkerIcon() {
    if (!window.google) return undefined

    return {
      path: 'M26 6 L46 23 H41 V46 H31 V34 H21 V46 H11 V23 H6 Z',
      fillColor: '#0B1F4D',
      fillOpacity: 1,
      strokeColor: '#ffffff',
      strokeWeight: 3,
      scale: 1,
      anchor: new window.google.maps.Point(26, 46),
    }
  }

  const propertiesWithLocation = useMemo(() => {
    return properties.filter(
      (property) =>
        Number(property.latitude) &&
        Number(property.longitude)
    )
  }, [properties])

  const center = useMemo(() => {
    if (propertiesWithLocation.length > 0) {
      return {
        lat: Number(propertiesWithLocation[0].latitude),
        lng: Number(propertiesWithLocation[0].longitude),
      }
    }

    return {
      lat: 50.8503,
      lng: 4.3517,
    }
  }, [propertiesWithLocation])

  useEffect(() => {
    checkUser()
    getProperties()
    getMarketComparables()

    const rawInitialSearch = searchParams.get('search') || ''
    const shouldClearForeignSearch = /netherlands|nederland/i.test(rawInitialSearch)
    const initialSearch = shouldClearForeignSearch ? '' : rawInitialSearch
    setSearch(initialSearch)
    setAppliedSearch(initialSearch)
    setCity(searchParams.get('city') || '')
    setMaxPrice(searchParams.get('maxPrice') || '')
    setMinPrice(searchParams.get('minPrice') || '')
    setPropertyType(searchParams.get('type') || '')
    setOfferedSince('')
    setMinLivingArea(searchParams.get('minArea') || '')
    setMaxLivingArea(searchParams.get('maxArea') || '')
    setMinBedrooms(searchParams.get('minBedrooms') || '')
    setMaxBedrooms(searchParams.get('maxBedrooms') || '')
    setMinBathrooms(searchParams.get('minBathrooms') || '')
    setMaxBathrooms(searchParams.get('maxBathrooms') || '')
    setMinRooms(searchParams.get('minRooms') || '')
    setMaxRooms(searchParams.get('maxRooms') || '')
    setMinPlotArea(searchParams.get('minPlotArea') || '')
    setMaxPlotArea(searchParams.get('maxPlotArea') || '')
    setKeywordFilter(searchParams.get('keyword') || '')

    if (shouldClearForeignSearch) {
      const params = new URLSearchParams(searchParams.toString())
      params.delete('search')
      const queryString = params.toString()
      router.replace(queryString ? `${routeBase}?${queryString}` : routeBase, {
        scroll: false,
      })
    }
  }, [])

  useEffect(() => {
    if (searchParams.get('offered')) {
      const params = new URLSearchParams(searchParams.toString())
      params.delete('offered')

      const queryString = params.toString()
      router.replace(queryString ? `${routeBase}?${queryString}` : routeBase, {
        scroll: false,
      })
    }
  }, [])

  async function checkUser() {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setUserId('')
      setUserEmail('')
      return
    }

    setUserId(user.id)
    setUserEmail(user.email || '')
    getFavorites(user.id)
  }

  async function getFavorites(currentUserId: string) {
    const { data } = await supabase
      .from('favorites')
      .select('property_id')
      .eq('user_id', currentUserId)

    setFavoriteIds(data?.map((item) => Number(item.property_id)) || [])
  }

  async function toggleFavorite(propertyId: number) {
    if (!userId) {
      router.push('/login')
      return
    }

    const isFavorite = favoriteIds.includes(propertyId)

    if (isFavorite) {
      await supabase
        .from('favorites')
        .delete()
        .eq('user_id', userId)
        .eq('property_id', propertyId)

      setFavoriteIds(favoriteIds.filter((id) => id !== propertyId))
    } else {
      await supabase.from('favorites').insert([
        {
          user_id: userId,
          property_id: propertyId,
        },
      ])

      setFavoriteIds([...favoriteIds, propertyId])
    }
  }

  function toggleCompare(propertyId: number) {
    const alreadySelected = compareIds.includes(propertyId)

    if (alreadySelected) {
      setCompareIds(compareIds.filter((id) => id !== propertyId))
      return
    }

    if (compareIds.length >= 4) {
      alert('Je kan maximaal 4 woningen vergelijken')
      return
    }

    setCompareIds([...compareIds, propertyId])
  }

  function goToCompare() {
    if (compareIds.length < 2) {
      alert('Selecteer minstens 2 woningen')
      return
    }

    const params = new URLSearchParams({
      ids: compareIds.join(','),
    })

    router.push(`/compare?${params.toString()}`)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  async function getProperties() {
    if (isRentPage) {
      const rentalResult = await supabase
        .from('properties')
        .select('*')
        .eq('offer_type', 'Huur')
        .order('id', { ascending: false })

      if (!rentalResult.error && rentalResult.data && rentalResult.data.length > 0) {
        setProperties(rentalResult.data)
        return
      }
    }

    const { data } = await supabase
      .from('properties')
      .select('*')
      .order('id', { ascending: false })

    setProperties(isRentPage ? (data || []).filter(isRentalProperty) : data || [])
  }

  async function getMarketComparables() {
    const { data, error } = await supabase
      .from('market_comparables')
      .select('id,title,city,postcode,property_type,price,living_area,bedrooms,bathrooms,epc,bouwjaar,last_seen_at,created_at')

    if (error) {
      setMarketComparables([])
      return
    }

    setMarketComparables(data || [])
  }

  function handleSearchSubmit(e?: React.FormEvent) {
    e?.preventDefault()

    const cleanSearch = search.trim()
    if (/netherlands|nederland/i.test(cleanSearch)) {
      setSearch('')
      setAppliedSearch('')
      setSelectedMapProperty(null)
      setOpenFilter(null)
      setOpenPriceField(null)
      router.replace(routeBase, { scroll: false })
      setSubmittedSearchKey((current) => current + 1)
      return
    }
    setAppliedSearch(cleanSearch)

    const params = new URLSearchParams()

    if (cleanSearch) params.set('search', cleanSearch)
    if (city.trim()) params.set('city', city.trim())
    if (minPrice.trim()) params.set('minPrice', minPrice.trim())
    if (maxPrice.trim()) params.set('maxPrice', maxPrice.trim())
    if (propertyType.trim()) params.set('type', propertyType.trim())
    if (offeredSince.trim()) params.set('offered', offeredSince.trim())
    if (minLivingArea.trim()) params.set('minArea', minLivingArea.trim())
    if (maxLivingArea.trim()) params.set('maxArea', maxLivingArea.trim())
    if (minBedrooms.trim()) params.set('minBedrooms', minBedrooms.trim())
    if (maxBedrooms.trim()) params.set('maxBedrooms', maxBedrooms.trim())
    if (minBathrooms.trim()) params.set('minBathrooms', minBathrooms.trim())
    if (maxBathrooms.trim()) params.set('maxBathrooms', maxBathrooms.trim())
    if (minRooms.trim()) params.set('minRooms', minRooms.trim())
    if (maxRooms.trim()) params.set('maxRooms', maxRooms.trim())
    if (minPlotArea.trim()) params.set('minPlotArea', minPlotArea.trim())
    if (maxPlotArea.trim()) params.set('maxPlotArea', maxPlotArea.trim())
    if (keywordFilter.trim()) params.set('keyword', keywordFilter.trim())

    const queryString = params.toString()
    router.replace(queryString ? `${routeBase}?${queryString}` : routeBase, {
      scroll: false,
    })

    setSelectedMapProperty(null)
    setOpenFilter(null)
    setOpenPriceField(null)
    setSubmittedSearchKey((current) => current + 1)
  }

  function toggleExtraFilter(filterName: string) {
    setSelectedExtraFilters((current) =>
      current.includes(filterName)
        ? current.filter((item) => item !== filterName)
        : [...current, filterName]
    )
  }

  const activeFilterCount = [
    minPrice,
    maxPrice,
    propertyType,
    offeredSince,
    minLivingArea,
    maxLivingArea,
    minBedrooms,
    maxBedrooms,
    minBathrooms,
    maxBathrooms,
    minRooms,
    maxRooms,
    minPlotArea,
    maxPlotArea,
    keywordFilter,
    ...selectedExtraFilters,
  ].filter(Boolean).length

  function handleUseCurrentLocation() {
    if (!navigator.geolocation) {
      alert('Locatie wordt niet ondersteund door je browser.')
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const currentLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        }

        mapInstance?.setCenter(currentLocation)
        mapInstance?.setZoom(12)
        setShowMap(true)
        setSelectedMapProperty(null)
      },
      () => {
        alert('We konden je locatie niet ophalen. Controleer je browserrechten.')
      }
    )
  }

  const discoverNearbyListings = async (radius = 5000) => {
    if (!navigator.geolocation) {
      setNearbyError('GPS wordt niet ondersteund door deze browser.')
      return
    }

    setNearbyError('')
    setLoadingNearby(true)

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude
        const lng = position.coords.longitude

        const matchingIds = properties
          .filter((property) => Number(property.latitude) && Number(property.longitude))
          .filter((property) => {
            const distance = getDistanceInMeters(
              lat,
              lng,
              Number(property.latitude),
              Number(property.longitude)
            )

            return distance <= radius
          })
          .map((property) => Number(property.id))

        setNearbyIds(matchingIds)
        setNearbyMode(true)
        setSelectedMapProperty(null)
        setShowMap(true)
        mapInstance?.setCenter({ lat, lng })
        mapInstance?.setZoom(radius <= 5000 ? 13 : radius <= 25000 ? 11 : 9)

        if (matchingIds.length === 0) {
          setNearbyError('Geen woningen gevonden binnen deze straal.')
        }

        setLoadingNearby(false)
      },
      (error) => {
        console.error(error)
        setNearbyError('Locatietoegang geweigerd of niet beschikbaar.')
        setLoadingNearby(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000,
      }
    )
  }

  function getDistanceInMeters(
    fromLat: number,
    fromLng: number,
    toLat: number,
    toLng: number
  ) {
    const earthRadiusInMeters = 6371000
    const degreesToRadians = (degrees: number) => (degrees * Math.PI) / 180
    const latDelta = degreesToRadians(toLat - fromLat)
    const lngDelta = degreesToRadians(toLng - fromLng)
    const startLat = degreesToRadians(fromLat)
    const endLat = degreesToRadians(toLat)
    const halfChordLength =
      Math.sin(latDelta / 2) * Math.sin(latDelta / 2) +
      Math.cos(startLat) *
        Math.cos(endLat) *
        Math.sin(lngDelta / 2) *
        Math.sin(lngDelta / 2)

    return earthRadiusInMeters * 2 * Math.atan2(Math.sqrt(halfChordLength), Math.sqrt(1 - halfChordLength))
  }

  function numberValue(value: any) {
    const rawValue = String(value || '').trim()

    if (!rawValue) return 0

    const onlyNumbers = rawValue.replace(/[^\d]/g, '')

    return Number(onlyNumbers) || 0
  }

  function textValue(...values: any[]) {
    return values.filter(Boolean).join(' ').toLowerCase()
  }

  const propertyImageFields = [
    'images',
    'photos',
    'property_images',
    'image_urls',
    'gallery',
    'media',
    'image',
    'main_image',
    'image_url',
    'photo',
    'fotos',
  ] as const

  const propertyImageValueFields = [
    'url',
    'src',
    'image',
    'image_url',
    'photo',
    'photo_url',
    'main_image',
    'images',
    'photos',
    'property_images',
    'image_urls',
    'gallery',
    'media',
  ] as const

  function collectPropertyImageReferences(
    value: unknown,
    references: string[],
    fallbackKey: string
  ) {
    if (value === null || value === undefined) return

    if (Array.isArray(value)) {
      value.forEach((item, index) =>
        collectPropertyImageReferences(
          item,
          references,
          `${fallbackKey}.${index}`
        )
      )
      return
    }

    if (typeof value === 'string') {
      const trimmed = value.trim()
      if (!trimmed) return

      if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
        try {
          collectPropertyImageReferences(JSON.parse(trimmed), references, fallbackKey)
          return
        } catch {
          // Fall back to treating the string as one or more image references.
        }
      }

      trimmed
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
        .forEach((item) => references.push(item))
      return
    }

    if (typeof value === 'object') {
      const record = value as Record<string, unknown>
      let foundNestedReference = false

      propertyImageValueFields.forEach((field) => {
        if (record[field]) {
          foundNestedReference = true
          collectPropertyImageReferences(
            record[field],
            references,
            `${fallbackKey}.${field}`
          )
        }
      })

      if (!foundNestedReference && Object.keys(record).length > 0) {
        references.push(fallbackKey)
      }

      return
    }

    references.push(`${fallbackKey}:${String(value)}`)
  }

  function getPropertyPhotoCount(property: Record<string, unknown>) {
    const references: string[] = []

    propertyImageFields.forEach((field) => {
      collectPropertyImageReferences(property[field], references, field)
    })

    return new Set(references).size
  }

  function getPropertyPrimaryImage(property: Record<string, unknown>) {
    const references: string[] = []

    propertyImageFields.forEach((field) => {
      collectPropertyImageReferences(property[field], references, field)
    })

    return references.find((reference) => {
      return (
        /^(https?:|\/|data:image|blob:)/i.test(reference) ||
        /\.(jpe?g|png|webp|gif|avif)(\?|#|$)/i.test(reference)
      )
    }) || ''
  }


  function getPropertyImages(property: Record<string, unknown>) {
    const references: string[] = []

    propertyImageFields.forEach((field) => {
      collectPropertyImageReferences(property[field], references, field)
    })

    return Array.from(new Set(references)).filter((reference) => {
      return /^(https?:|data:image\/)/i.test(reference)
    })
  }
  async function startRenovatiePhotoAnalysis(property: Record<string, unknown>) {
    const propertyId = Number(property.id)

    setOpenRenovatieScanId(propertyId)
    setRenovatiePhotoLoading((current) => ({ ...current, [propertyId]: true }))
    setRenovatiePhotoErrors((current) => ({ ...current, [propertyId]: '' }))

    try {
      const response = await fetch('/api/renovatie-photo-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId,
          title: property.title || property.titel || '',
          epc: property.epc || property.epc_label || property.epcLabel || property.EPC || '',
          bouwjaar:
            property.bouwjaar ||
            property.build_year ||
            property.buildYear ||
            property.year_built ||
            property.yearBuilt ||
            '',
          oppervlakte:
            property.bewoonbare_oppervlakte ||
            property.woonoppervlakte ||
            property.livingArea ||
            property.living_area ||
            property.oppervlakte ||
            property.area ||
            '',
          bedrooms:
            property.slaapkamers || property.bedrooms || property.bedroom_count || '',
          bathrooms: property.badkamers || property.bathrooms || '',
          heating:
            property.heating ||
            property.verwarming ||
            property.heating_type ||
            property.verwarmingstype ||
            '',
          description:
            property.description ||
            property.beschrijving ||
            property.location_description ||
            '',
          photos: getPropertyImages(property).slice(0, 12),
        }),
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Fotoanalyse kon niet worden uitgevoerd.')
      }

      setRenovatiePhotoAnalyses((current) => ({
        ...current,
        [propertyId]: data as RenovatiePhotoAnalysis,
      }))
    } catch (error) {
      setRenovatiePhotoErrors((current) => ({
        ...current,
        [propertyId]:
          error instanceof Error
            ? error.message
            : 'Fotoanalyse kon niet worden uitgevoerd.',
      }))
    } finally {
      setRenovatiePhotoLoading((current) => ({ ...current, [propertyId]: false }))
    }
  }

  function boolValue(value: any) {
    return value === true || String(value).toLowerCase() === 'true'
  }

  function isRentalProperty(property: any) {
    const offerText = [
      property.offer_type,
      property.offerType,
      property.listing_type,
      property.listingType,
      property.aanbod_type,
      property.type_aanbod,
      property.transaction_type,
      property.transactionType,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()

    return offerText.includes('huur') || offerText.includes('rent')
  }

  function hasExtraFilter(label: string) {
    return selectedExtraFilters.includes(label)
  }

  function matchesBuildPeriod(year: number, period: string) {
    if (period === 'Onbekend') return !year
    if (!year) return false
    if (period === 'Voor 1906') return year < 1906
    if (period === '1906-1930') return year >= 1906 && year <= 1930
    if (period === '1931-1944') return year >= 1931 && year <= 1944
    if (period === '1945-1959') return year >= 1945 && year <= 1959
    if (period === '1960-1970') return year >= 1960 && year <= 1970
    if (period === '1971-1980') return year >= 1971 && year <= 1980
    if (period === '1981-1990') return year >= 1981 && year <= 1990
    if (period === '1991-2000') return year >= 1991 && year <= 2000
    if (period === '2001-2010') return year >= 2001 && year <= 2010
    if (period === '2011-2020') return year >= 2011 && year <= 2020
    if (period === 'Na 2020') return year > 2020
    return true
  }

  function formatPrice(value: any) {
    const number = numberValue(value)

    if (!number) return '-'

    const formattedPrice = new Intl.NumberFormat('nl-BE', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(number)

    return offerType === 'Huur' ? `${formattedPrice} / maand` : formattedPrice
  }

  function formatPricePerM2(property: any) {
    const price = numberValue(property.price)
    const area = numberValue(
      property.bewoonbare_oppervlakte ||
        property.oppervlakte ||
        property.living_area
    )

    if (!price || !area) return null

    return `± ${new Intl.NumberFormat('nl-BE', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(price / area)} / m²`
  }

  function getPropertyArea(property: any) {
    return numberValue(
      property.bewoonbare_oppervlakte ||
        property.oppervlakte ||
        property.living_area ||
        property.grondoppervlakte
    )
  }

  function getAiRankScore(property: any) {
    const storedScore = Number(property.ai_rank_score)

    if (Number.isFinite(storedScore) && storedScore > 0) {
      return Math.max(0, Math.min(100, Math.round(storedScore)))
    }

    let score = 35

    const epc = String(property.epc || property.epc_code || '').trim().toUpperCase()
    const price = numberValue(property.price)
    const area = getPropertyArea(property)
    const bedrooms = numberValue(property.slaapkamers || property.bedrooms)
    const bathrooms = numberValue(property.badkamers || property.bathrooms)

    if (['A+++++', 'A++++', 'A+++', 'A++', 'A+', 'A'].includes(epc)) score += 25
    else if (epc === 'B') score += 18
    else if (epc === 'C') score += 10
    else if (['E', 'F', 'G'].includes(epc)) score -= 10

    if (price && area) {
      const pricePerM2 = price / area
      if (pricePerM2 < 3000) score += 18
      else if (pricePerM2 < 4000) score += 12
      else if (pricePerM2 < 5000) score += 6
    }

    if (area >= 150) score += 8
    else if (area >= 90) score += 5

    if (bedrooms >= 3) score += 6
    else if (bedrooms >= 2) score += 4

    if (bathrooms >= 2) score += 4

    return Math.max(0, Math.min(100, Math.round(score)))
  }

  function getAiScoreLabel(score: number) {
    if (score >= 85) return 'Uitstekend'
    if (score >= 70) return 'Goed'
    if (score >= 50) return 'Redelijk'

    return 'Beperkt'
  }

  function getPropertyTypeForAnalysis(property: any) {
    return String(
      property.woning_type ||
        property.property_type ||
        property.type ||
        ''
    ).trim().toLowerCase()
  }

  function getBedroomsForAnalysis(property: any) {
    return numberValue(property.slaapkamers || property.bedrooms)
  }

  function getComparablePool() {
    const normalizedMarketComparables = marketComparables.map((item) => ({
      ...item,
      id: `market-${item.id}`,
      woning_type: item.property_type,
      bewoonbare_oppervlakte: item.living_area,
      slaapkamers: item.bedrooms,
      badkamers: item.bathrooms,
      __marketComparable: true,
    }))

    return [...properties, ...normalizedMarketComparables]
  }

  function getPropertyPricePerM2(property: any) {
    const price = numberValue(property.price)
    const area = getPropertyArea(property)

    if (!price || !area) return 0

    return price / area
  }

  function getCityAveragePricePerM2(property: any) {
    const currentCity = String(property.city || '').toLowerCase()

    const cityProperties = properties.filter((item) => {
      const itemCity = String(item.city || '').toLowerCase()
      return itemCity === currentCity && getPropertyPricePerM2(item) > 0
    })

    if (cityProperties.length < 2) return 0

    const total = cityProperties.reduce(
      (sum, item) => sum + getPropertyPricePerM2(item),
      0
    )

    return total / cityProperties.length
  }

  function getComparableProperties(property: any) {
    const city = String(property.city || '').trim().toLowerCase()
    const type = getPropertyTypeForAnalysis(property)
    const area = getPropertyArea(property)
    const bedrooms = getBedroomsForAnalysis(property)

    if (!city || !type || !area || !bedrooms) return []

    return getComparablePool().filter((item) => {
      if (String(item.id) === String(property.id)) return false

      const itemCity = String(item.city || '').trim().toLowerCase()
      const itemType = getPropertyTypeForAnalysis(item)
      const itemArea = getPropertyArea(item)
      const itemBedrooms = getBedroomsForAnalysis(item)
      const itemPricePerM2 = getPropertyPricePerM2(item)

      if (!itemPricePerM2 || !itemArea || !itemBedrooms) return false

      const surfaceDifference = Math.abs(itemArea - area) / area
      const bedroomDifference = Math.abs(itemBedrooms - bedrooms)

      return (
        itemCity === city &&
        itemType === type &&
        surfaceDifference <= 0.2 &&
        bedroomDifference <= 1
      )
    })
  }

  function getMedian(values: number[]) {
    if (values.length === 0) return 0

    const sortedValues = [...values].sort((a, b) => a - b)
    const middle = Math.floor(sortedValues.length / 2)

    if (sortedValues.length % 2 === 0) {
      return (sortedValues[middle - 1] + sortedValues[middle]) / 2
    }

    return sortedValues[middle]
  }

  function formatPricePerM2Value(value: number) {
    return `€ ${new Intl.NumberFormat('nl-BE', {
      maximumFractionDigits: 0,
    }).format(value)} / m²`
  }

  function parseBooleanData(value: any) {
    if (value === null || value === undefined || value === '') return null

    const normalized = String(value).toLowerCase().trim()

    if (['true', 'ja', 'yes', '1'].includes(normalized)) return true
    if (['false', 'nee', 'no', '0'].includes(normalized)) return false

    return null
  }

  function firstKnownPropertyValue(...values: any[]) {
    return values.find((value) => value !== null && value !== undefined && value !== '')
  }

  function getKnownAmenities(property: any) {
    return [
      parseBooleanData(property.parking) === true ? 'parking' : '',
      parseBooleanData(property.tuin) === true ? 'tuin' : '',
      parseBooleanData(property.terras) === true ? 'terras' : '',
      parseBooleanData(property.lift) === true ? 'lift' : '',
      parseBooleanData(property.gemeubeld) === true ? 'gemeubeld' : '',
      parseBooleanData(property.dubbel_glas) === true ? 'dubbel glas' : '',
    ].filter(Boolean)
  }

  function getSustainabilityScore(property: any) {
    const kenmerken = getWoningkenmerken(property)
    const epc = String(property.epc || property.epc_code || '').trim().toUpperCase()
    let score = epc ? 45 : 35

    if (['A+++++', 'A++++', 'A+++', 'A++', 'A+', 'A', 'B'].includes(epc)) score += 28
    else if (epc === 'C') score += 18
    else if (epc === 'D') score += 8
    else if (['E', 'F', 'G'].includes(epc)) score -= 12

    if (parseBooleanData(property.dubbel_glas) === true) score += 8
    if (parseBooleanData(property.zonnepanelen) === true) score += 8
    if (parseBooleanData(property.warmtepomp) === true) score += 10
    if (kenmerken.includes('Energiezuinig')) score += 8
    if (numberValue(property.bouwjaar) >= 2010) score += 6

    return Math.max(1, Math.min(99, score))
  }

  function getComfortScore(property: any) {
    const kenmerken = getWoningkenmerken(property)
    const amenities = getKnownAmenities(property)
    let score = 45 + amenities.length * 7

    if (kenmerken.includes('Luxe afwerking')) score += 8
    if (kenmerken.includes('Instapklaar')) score += 7
    if (kenmerken.includes('Rustig gelegen')) score += 5
    if (numberValue(property.badkamers) >= 2) score += 5

    return Math.max(1, Math.min(99, score))
  }

  function getFloodInsight(property: any) {
    const floodValue = firstKnownPropertyValue(
      property.overstromingscertificaat,
      property.overstromingsgevoeligheid,
      property.overstromingsrisico,
      property.overstroming_zonetype,
      property.p_score,
      property.g_score
    )

    if (!floodValue) {
      return 'Overstromingsdata: onvoldoende gegevens beschikbaar voor een betrouwbare inschatting.'
    }

    const pScore = property.p_score ? `P-score ${property.p_score}` : ''
    const gScore = property.g_score ? `G-score ${property.g_score}` : ''
    const scores = [pScore, gScore].filter(Boolean).join(', ')

    return `Overstromingsdata: ${scores || String(floodValue)} beschikbaar. Dit is indicatief; controleer het attest en de ligging tijdens dossiercontrole.`
  }

  function getDataDrivenAnalysisNotes(property: any) {
    const kenmerken = getWoningkenmerken(property)
    const amenities = getKnownAmenities(property)
    const notes: string[] = []
    const bedrooms = numberValue(property.slaapkamers || property.bedrooms)
    const area = getPropertyArea(property)
    const mobilityText = [
      property.ligging,
      property.location_description,
      property.description,
      ...kenmerken,
    ].filter(Boolean).join(' ').toLowerCase()

    notes.push(
      amenities.length > 0
        ? `Comfortniveau: op basis van beschikbare woningdata zijn ${amenities.join(', ')} aanwezig. Dit is indicatief en niet definitief.`
        : 'Comfortniveau: onvoldoende gegevens beschikbaar voor een betrouwbare inschatting.'
    )

    if (kenmerken.includes('Kindvriendelijk') || bedrooms >= 3 || parseBooleanData(property.tuin) === true) {
      notes.push('Gezinsvriendelijkheid: er zijn beschikbare signalen zoals slaapkamers, tuin of het kenmerk Kindvriendelijk. Controleer indeling en omgeving tijdens plaatsbezoek.')
    } else {
      notes.push('Gezinsvriendelijkheid: beperkte betrouwbaarheid omdat slaapkamers, tuin of kindvriendelijke kenmerken ontbreken of onvolledig zijn.')
    }

    if (kenmerken.includes('Dichtbij openbaar vervoer') || mobilityText.includes('openbaar vervoer') || mobilityText.includes('station')) {
      notes.push('Mobiliteit: de beschikbare gegevens bevatten een signaal rond openbaar vervoer of station. Controleer exacte afstand en verbindingen.')
    }

    if (kenmerken.includes('Investeringspand')) {
      notes.push('Investeringspotentieel: het kenmerk Investeringspand is opgegeven. Rendement, verhuurbaarheid en kosten blijven apart te controleren.')
    } else if (area && area < 65 && bedrooms <= 1) {
      notes.push('Investeringspotentieel: compactere oppervlakte kan relevant zijn voor bepaalde kopers of huurders, maar er is onvoldoende data voor een definitieve investeringsinschatting.')
    }

    notes.push(
      getSustainabilityScore(property) >= 70
        ? 'Duurzaamheidsindicatie: EPC, dubbel glas, zonnepanelen, warmtepomp of energiekenmerken geven samen een positief indicatief signaal.'
        : 'Duurzaamheidsindicatie: beschikbare energiegegevens zijn beperkt of gemengd; controleer EPC-attest en technieken.'
    )

    notes.push(getFloodInsight(property))

    return notes
  }

  function getRealEnergyNotes(property: any) {
    const notes: string[] = []
    const kenmerken = getWoningkenmerken(property)
    const epc = String(property.epc || property.epc_code || '').trim().toUpperCase()
    const primaryEnergy = numberValue(property.primair_energieverbruik)
    const co2 = numberValue(property.co2_uitstoot)
    const zonnepanelen = parseBooleanData(property.zonnepanelen)
    const thermischeZonnepanelen = parseBooleanData(property.thermische_zonnepanelen)
    const warmtepomp = parseBooleanData(property.warmtepomp)
    const dubbelGlas = parseBooleanData(property.dubbel_glas)
    const heatingType = String(property.verwarmingstype || '').trim()

    if (epc) {
      if (['A+++++', 'A++++', 'A+++', 'A++', 'A+', 'A', 'B'].includes(epc)) {
        notes.push(`EPC ${epc}: sterk energie-efficiëntiesignaal in de beschikbare data.`)
      } else if (['E', 'F', 'G'].includes(epc)) {
        notes.push(`EPC ${epc}: zwakker energieprestatiesignaal; controle van renovatieplicht en maatregelen blijft aangewezen.`)
      } else {
        notes.push(`EPC ${epc}: gemiddeld energieprestatiesignaal op basis van het label.`)
      }
    }

    if (primaryEnergy) {
      notes.push(`Primair energieverbruik: ${new Intl.NumberFormat('nl-BE').format(primaryEnergy)} kWh/m² jaar.`)
    }

    if (co2) {
      notes.push(`CO₂-uitstoot: ${new Intl.NumberFormat('nl-BE').format(co2)} kg/m² jaar.`)
    }

    if (zonnepanelen === true) notes.push('Zonnepanelen aanwezig volgens de woningdata: positief signaal voor hernieuwbare energie.')
    if (thermischeZonnepanelen === true) notes.push('Thermische zonnepanelen aanwezig volgens de woningdata.')
    if (warmtepomp === true) notes.push('Warmtepomp aanwezig volgens de woningdata: lagere fossiele afhankelijkheid.')
    if (heatingType) notes.push(`Verwarmingstype opgegeven als ${heatingType}; controleer rendement en installatieleeftijd.`)
    if (dubbelGlas === true) notes.push('Dubbel glas aanwezig volgens de woningdata.')
    if (dubbelGlas === false) notes.push('Dubbel glas staat als niet aanwezig in de woningdata; ramen verdienen extra controle.')
    if (kenmerken.includes('Energiezuinig')) notes.push('Kenmerk Energiezuinig is opgegeven bij deze woning.')

    if (notes.length === 0) {
      notes.push('Er is beperkt energiedata beschikbaar. Deze analyse blijft indicatief en gebaseerd op de beschikbare woningdata.')
    }

    return notes
  }

  function getSlimCheck(property: any) {
    const pricePerM2 = getPropertyPricePerM2(property)
    const city = String(property.city || 'deze regio')
    const type = getPropertyTypeForAnalysis(property) || 'woningtype onbekend'
    const buildYear = numberValue(property.bouwjaar)
    const renovationRequirement = parseBooleanData(property.renovatieverplichting)

    const descriptionText = [
      property.description,
      ...getWoningkenmerken(property),
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()

    const comparisonSet = getComparableProperties(property)
    const comparisonCount = comparisonSet.length
    const comparablePrices = comparisonSet.map((item) => getPropertyPricePerM2(item))
    const averagePricePerM2 = comparisonCount >= 3
      ? comparablePrices.reduce((sum, value) => sum + value, 0) / comparisonCount
      : 0
    const medianPricePerM2 = comparisonCount >= 3 ? getMedian(comparablePrices) : 0

    const renovationSignals = [
      'te renoveren',
      'renovatie',
      'op te frissen',
      'werk',
    ]

    const readySignals = [
      'gerenoveerd',
      'instapklaar',
      'modern',
      'vernieuwd',
      'energiezuinig',
    ]

    const hasRenovationSignal = renovationSignals.some((word) => descriptionText.includes(word))
    const hasReadySignal = readySignals.some((word) => descriptionText.includes(word))

    let marketScore = 50
    let marketLine = 'Onvoldoende gegevens beschikbaar voor een betrouwbare inschatting. Er zijn minder dan 3 vergelijkbare panden in de beschikbare marktdata.'

    if (pricePerM2 && averagePricePerM2 && comparisonCount >= 3) {
      const difference = Math.round(((pricePerM2 - averagePricePerM2) / averagePricePerM2) * 100)
      const confidenceText = comparisonCount >= 5
        ? 'De vergelijkingsbasis is redelijk bruikbaar.'
        : 'De vergelijkingsbasis is beperkt, dus interpreteer dit voorzichtig.'

      if (difference <= -10) {
        marketScore = 92
        marketLine = `Op basis van beschikbare marktdata (${comparisonCount} vergelijkbare panden in ${city}, ${type}, ±20% oppervlakte en vergelijkbare slaapkamers) ligt deze woning ongeveer ${Math.abs(difference)}% onder het gemiddelde. Gemiddeld: ${formatPricePerM2Value(averagePricePerM2)}. Mediaan: ${formatPricePerM2Value(medianPricePerM2)}. ${confidenceText}`
      } else if (difference <= -5) {
        marketScore = 78
        marketLine = `Op basis van beschikbare marktdata (${comparisonCount} vergelijkbare panden in ${city}) ligt deze woning ongeveer ${Math.abs(difference)}% onder het gemiddelde prijs/m². Gemiddeld: ${formatPricePerM2Value(averagePricePerM2)}. Mediaan: ${formatPricePerM2Value(medianPricePerM2)}. ${confidenceText}`
      } else if (difference <= 4) {
        marketScore = 62
        marketLine = `Op basis van beschikbare marktdata (${comparisonCount} vergelijkbare panden in ${city}) ligt de prijs/m² dicht bij het gemiddelde. Gemiddeld: ${formatPricePerM2Value(averagePricePerM2)}. Mediaan: ${formatPricePerM2Value(medianPricePerM2)}. ${confidenceText}`
      } else if (difference <= 10) {
        marketScore = 42
        marketLine = `Op basis van beschikbare marktdata (${comparisonCount} vergelijkbare panden in ${city}) ligt deze woning ongeveer ${difference}% boven het gemiddelde prijs/m². Gemiddeld: ${formatPricePerM2Value(averagePricePerM2)}. Mediaan: ${formatPricePerM2Value(medianPricePerM2)}. ${confidenceText}`
      } else {
        marketScore = 25
        marketLine = `Op basis van beschikbare marktdata (${comparisonCount} vergelijkbare panden in ${city}) ligt deze woning ongeveer ${difference}% boven het gemiddelde prijs/m². Gemiddeld: ${formatPricePerM2Value(averagePricePerM2)}. Mediaan: ${formatPricePerM2Value(medianPricePerM2)}. ${confidenceText}`
      }
    }

    let conditionScore = 55
    let conditionLine = 'De beschikbare gegevens bevatten geen duidelijke informatie over renovatie of technische staat.'

    if (renovationRequirement === true) {
      conditionScore = 38
      conditionLine = 'Renovatieverplichting staat als aanwezig in de data. Controleer het EPC-attest, timing en concrete maatregelen voordat je conclusies trekt.'
    } else if (renovationRequirement === false) {
      conditionLine = 'Renovatieverplichting staat niet als aanwezig in de data. De technische staat blijft afhankelijk van beschrijving, foto’s en plaatsbezoek.'
    }

    if (hasReadySignal) {
      conditionScore = 70
      conditionLine = 'De beschikbare gegevens bevatten positieve signalen zoals gerenoveerd, instapklaar, modern, vernieuwd of energiezuinig. Dit blijft indicatief en moet visueel gecontroleerd worden.'
    }

    if (hasRenovationSignal) {
      conditionScore = 42
      conditionLine = 'De beschrijving bevat renovatiesignalen zoals renovatie, op te frissen, te renoveren of werk. Controleer omvang en kosten tijdens een bezoek.'
    }

    if (hasRenovationSignal && hasReadySignal) {
      conditionScore = 55
      conditionLine = 'De beschrijving bevat zowel positieve als renovatiegerichte signalen. Controleer foto’s, afwerking en recente werken tijdens een bezoek.'
    }

    if (!hasRenovationSignal && !hasReadySignal && buildYear) {
      conditionLine = `Bouwjaar ${buildYear} is beschikbaar, maar zonder duidelijke renovatie- of technische details. Controleer recente werken, technieken en afwerking tijdens een bezoek.`
    }

    const energyNotes = getRealEnergyNotes(property)
    const energyScore = Math.round((getSustainabilityScore(property) + (energyNotes.length >= 3 ? 68 : energyNotes.length >= 2 ? 60 : 52)) / 2)
    const energyLine = `${energyNotes.join(' ')} Deze analyse is indicatief en gebaseerd op beschikbare woningdata.`
    const comfortScore = getComfortScore(property)
    const dataDrivenNotes = getDataDrivenAnalysisNotes(property)

    const investmentScore = Math.max(
      1,
      Math.min(
        99,
        Math.round(marketScore * 0.42 + conditionScore * 0.24 + energyScore * 0.2 + comfortScore * 0.14)
      )
    )

    let status = `${investmentScore}/100 AI-score`

    if (!pricePerM2 || comparisonCount < 3) status = `${investmentScore}/100 AI-score - beperkte vergelijkingsbasis`

    return {
      status,
      highlight: 'Deze analyse is indicatief en gebruikt alleen beschikbare woningdata en marktinformatie.',
      points: [marketLine, conditionLine, energyLine, ...dataDrivenNotes],
    }
  }

  const filteredProperties = properties.filter((property) => {
    if (nearbyMode && !nearbyIds.includes(Number(property.id))) {
      return false
    }

    if (offerType === 'Huur' && !isRentalProperty(property)) {
      return false
    }

    const searchableText = [
      property.title,
      property.city,
      property.address,
      property.postcode,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()

    const normalizedAppliedSearch = normalizeBelgianSearchLabel(appliedSearch)

    const searchWords = normalizedAppliedSearch
      .toLowerCase()
      .replace(/,\s*(nederland|netherlands|belgië|belgium)$/i, '')
      .replace(/\bghent\b/g, 'gent')
      .replace(/\bbrussels\b/g, 'brussel')
      .replace(/\bbruges\b/g, 'brugge')
      .replace(/\bantwerp\b/g, 'antwerpen')
      .replace(/[,.]/g, ' ')
      .split(' ')
      .map((word) => word.trim())
      .filter((word) => word.length > 1 && !['nederland', 'netherlands', 'belgië', 'belgium'].includes(word))

    const cityWords = city
      .toLowerCase()
      .split(' ')
      .map((word) => word.trim())
      .filter((word) => word.length > 1)

    const matchesSearch =
      searchWords.length === 0 ||
      searchWords.some((word) => searchableText.includes(word))

    const matchesCity =
      cityWords.length === 0 ||
      cityWords.some((word) => searchableText.includes(word))

    const propertyPrice = numberValue(property.price)

    const matchesMinPrice =
      minPrice === '' ||
      propertyPrice >= numberValue(minPrice)

    const matchesMaxPrice =
      maxPrice === '' ||
      propertyPrice <= numberValue(maxPrice)

    const rawPropertyTypeText = String(
      property.type ||
        property.property_type ||
        property.woningtype ||
        property.category ||
        ''
    )
      .toLowerCase()
      .trim()

    const typeFallbackText = [
      property.title,
      property.description,
      property.address,
      property.city,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()

    const inferredPropertyType = rawPropertyTypeText ||
      (typeFallbackText.includes('appartement') || typeFallbackText.includes('duplex') || typeFallbackText.includes('studio')
        ? 'appartement'
        : typeFallbackText.includes('huis') || typeFallbackText.includes('woning') || typeFallbackText.includes('gezinswoning')
          ? 'huis'
          : '')

    const normalizedPropertyType = propertyType.toLowerCase().trim()

    const matchesPropertyType =
      normalizedPropertyType === '' ||
      inferredPropertyType === normalizedPropertyType ||
      (normalizedPropertyType === 'huis en appartement' && ['huis', 'appartement'].includes(inferredPropertyType))

    const createdAt = property.created_at ? new Date(property.created_at).getTime() : 0
    const offeredDays = numberValue(offeredSince)
    const matchesOfferedSince =
      offeredSince === '' ||
      (createdAt > 0 && Date.now() - createdAt <= offeredDays * 24 * 60 * 60 * 1000)

    const livingArea = getPropertyArea(property)
    const matchesMinLivingArea =
      minLivingArea === '' ||
      livingArea >= numberValue(minLivingArea)

    const matchesMaxLivingArea =
      maxLivingArea === '' ||
      livingArea <= numberValue(maxLivingArea)

    const bedrooms = numberValue(property.slaapkamers || property.bedrooms)
    const matchesMinBedrooms =
      minBedrooms === '' ||
      bedrooms >= numberValue(minBedrooms)

    const matchesMaxBedrooms =
      maxBedrooms === '' ||
      bedrooms <= numberValue(maxBedrooms)

    const bathrooms = numberValue(property.badkamers)
    const matchesMinBathrooms =
      minBathrooms === '' ||
      bathrooms >= numberValue(minBathrooms)

    const matchesMaxBathrooms =
      maxBathrooms === '' ||
      bathrooms <= numberValue(maxBathrooms)

    const rooms = numberValue(property.kamers || property.rooms || property.aantal_kamers)
    const matchesMinRooms =
      minRooms === '' ||
      rooms >= numberValue(minRooms)

    const matchesMaxRooms =
      maxRooms === '' ||
      rooms <= numberValue(maxRooms)

    const plotArea = numberValue(property.grondoppervlakte)
    const matchesMinPlotArea =
      minPlotArea === '' ||
      plotArea >= numberValue(minPlotArea)

    const matchesMaxPlotArea =
      maxPlotArea === '' ||
      plotArea <= numberValue(maxPlotArea)

    const propertyText = textValue(
      property.pluspunten,
      property.minpunten,
      property.description,
      property.woning_type,
      property.verwarmingstype,
      boolValue(property.tuin) ? 'tuin' : property.tuin,
      boolValue(property.terras) ? 'terras' : property.terras,
      boolValue(property.parking) ? 'parking parkeren' : property.parking,
      boolValue(property.lift) ? 'lift' : property.lift,
      boolValue(property.gemeubeld) ? 'gemeubeld' : property.gemeubeld,
      boolValue(property.dubbel_glas) ? 'dubbel glas' : property.dubbel_glas,
      property.title,
      property.address,
      property.city,
      property.status,
      property.beschikbaarheid,
      property.availability,
      property.tuinligging,
      property.garden_orientation,
      property.bestemming,
      property.destination,
      property.ligging,
      property.location_description,
      property.open_huis,
      property.open_house,
      property.project,
      property.is_project,
      property.type
    )
    const keyword = keywordFilter.trim().toLowerCase()
    const matchesKeyword =
      keyword === '' ||
      propertyText.includes(keyword)

    const epc = String(property.epc || '').toUpperCase().trim()
    const selectedEnergyLabels = allEnergyLabelOptions.filter(hasExtraFilter)
    const matchesEnergyLabel =
      selectedEnergyLabels.length === 0 ||
      selectedEnergyLabels.includes(epc)

    const buildYear = numberValue(property.bouwjaar)
    const selectedBuildPeriods = allBuildPeriodOptions.filter(hasExtraFilter)
    const matchesBuildPeriodFilter =
      selectedBuildPeriods.length === 0 ||
      selectedBuildPeriods.some((period) => matchesBuildPeriod(buildYear, period))

    const isNewBuild = propertyText.includes('nieuwbouw') || buildYear >= 2020
    const isExistingBuild = buildYear ? buildYear < 2020 : !isNewBuild
    const hasConstructionFilter = hasExtraFilter('Nieuwbouw') || hasExtraFilter('Bestaande bouw')
    const matchesConstructionType =
      !hasConstructionFilter ||
      (hasExtraFilter('Nieuwbouw') && isNewBuild) ||
      (hasExtraFilter('Bestaande bouw') && isExistingBuild)

    const outdoorOptions = ['Balkon', 'Dakterras', 'Tuin', 'Terras']
    const selectedOutdoorOptions = outdoorOptions.filter(hasExtraFilter)
    const matchesOutdoor =
      selectedOutdoorOptions.length === 0 ||
      selectedOutdoorOptions.some((label) => {
        if (label === 'Balkon') return propertyText.includes('balkon')
        if (label === 'Dakterras') return boolValue(property.terras) || propertyText.includes('dakterras') || propertyText.includes('terras')
        if (label === 'Terras') return boolValue(property.terras) || propertyText.includes('terras')
        if (label === 'Tuin') return boolValue(property.tuin) || propertyText.includes('tuin')
        return true
      })

    const parkingOptions = [
      'Op eigen terrein',
      'Op afgesloten terrein',
      'Openbaar parkeren',
      'Betaald parkeren',
      'Parkeergarage',
      'Parkeervergunningen',
      'Aangebouwde garage',
      'Garagebox',
      'Garage + carport',
      'Inpandige garage',
      'Parkeerkelder',
      'Souterrain',
      'Vrijstaande garage',
      'Garage mogelijk',
      'Carport',
      'Parkeerplaats',
      'Elk soort garage',
    ]
    const selectedParkingOptions = parkingOptions.filter(hasExtraFilter)
    const parkingText = textValue(property.parking, property.pluspunten, property.description, property.woning_type)
    const hasParking = boolValue(property.parking) || /parking|parkeren|garage|carport|parkeerplaats/.test(parkingText)
    const matchesParking =
      selectedParkingOptions.length === 0 ||
      selectedParkingOptions.some((label) => {
        const normalizedLabel = label.toLowerCase().replace(/\+/g, '').trim()
        return hasParking || parkingText.includes(normalizedLabel)
      })

    const accessibilityOptions = [
      'Lift aanwezig',
      'Enkele woonlaag',
      'Voor mensen met een beperking',
      'Voor ouderen',
      'Aangepaste woning',
      'Op de begane grond',
    ]
    const selectedAccessibilityOptions = accessibilityOptions.filter(hasExtraFilter)
    const matchesAccessibility =
      selectedAccessibilityOptions.length === 0 ||
      selectedAccessibilityOptions.some((label) => {
        if (label === 'Lift aanwezig') return boolValue(property.lift) || propertyText.includes('lift')
        return propertyText.includes(label.toLowerCase())
      })

    const featureOptions = isRentPage
      ? [
          'Gemeubeld',
          'Lift aanwezig',
          'Balkon',
          'Tuin',
          'Terras',
          'Huisdieren toegestaan',
          'Energiezuinig',
        ]
      : [
          'Duurzame energie',
          'CV-ketel',
          'Zwembad',
          'Lig-/zitbad',
          'Open haard',
          'Kluswoning',
          'Dubbele bewoning',
        ]
    const selectedFeatureOptions = featureOptions.filter(hasExtraFilter)
    const matchesFeatures =
      selectedFeatureOptions.length === 0 ||
      selectedFeatureOptions.some((label) => {
        if (label === 'Duurzame energie') {
          return boolValue(property.dubbel_glas) || ['A+++++', 'A++++', 'A+++', 'A++', 'A+', 'A'].includes(epc) || propertyText.includes('duurzaam')
        }
        if (label === 'Gemeubeld') return boolValue(property.gemeubeld) || propertyText.includes('gemeubeld') || propertyText.includes('furnished')
        if (label === 'Lift aanwezig') return boolValue(property.lift) || propertyText.includes('lift')
        if (label === 'Balkon') return propertyText.includes('balkon')
        if (label === 'Tuin') return boolValue(property.tuin) || propertyText.includes('tuin')
        if (label === 'Terras') return boolValue(property.terras) || propertyText.includes('terras')
        if (label === 'Huisdieren toegestaan') return propertyText.includes('huisdieren') || propertyText.includes('dieren toegestaan') || propertyText.includes('pets allowed')
        if (label === 'Energiezuinig') return ['A+++++', 'A++++', 'A+++', 'A++', 'A+', 'A', 'B'].includes(epc) || propertyText.includes('energiezuinig')
        if (label === 'CV-ketel') return propertyText.includes('cv') || propertyText.includes('ketel') || propertyText.includes('verwarming')
        if (label === 'Zwembad') return propertyText.includes('zwembad')
        if (label === 'Lig-/zitbad') return propertyText.includes('bad') || propertyText.includes('ligbad') || propertyText.includes('zitbad')
        if (label === 'Open haard') return propertyText.includes('open haard') || propertyText.includes('haard')
        if (label === 'Kluswoning') return propertyText.includes('kluswoning') || propertyText.includes('te renoveren') || propertyText.includes('renovatie')
        if (label === 'Dubbele bewoning') return propertyText.includes('dubbele bewoning') || propertyText.includes('kangoeroe')
        return true
      })

    const availabilityOptions = ['Beschikbaar', 'In onderhandeling', 'Verkocht']
    const selectedAvailabilityOptions = availabilityOptions.filter(hasExtraFilter)
    const availabilityText = textValue(property.status, property.beschikbaarheid, property.availability)
    const matchesAvailability =
      selectedAvailabilityOptions.length === 0 ||
      selectedAvailabilityOptions.some((label) => {
        const normalizedLabel = label.toLowerCase()
        return availabilityText.includes(normalizedLabel) || propertyText.includes(normalizedLabel)
      })

    const gardenOrientationOptions = ['Noord', 'Oost', 'Zuid', 'West']
    const selectedGardenOrientationOptions = gardenOrientationOptions.filter(hasExtraFilter)
    const gardenOrientationText = textValue(property.tuinligging, property.garden_orientation)
    const matchesGardenOrientation =
      selectedGardenOrientationOptions.length === 0 ||
      selectedGardenOrientationOptions.some((label) => {
        const normalizedLabel = label.toLowerCase()
        return gardenOrientationText.includes(normalizedLabel) || propertyText.includes(normalizedLabel)
      })

    const destinationOptions = ['Recreatiewoning', 'Permanente bewoning']
    const selectedDestinationOptions = destinationOptions.filter(hasExtraFilter)
    const destinationText = textValue(property.bestemming, property.destination)
    const matchesDestination =
      selectedDestinationOptions.length === 0 ||
      selectedDestinationOptions.some((label) => {
        const normalizedLabel = label.toLowerCase()
        if (label === 'Permanente bewoning') {
          return destinationText.includes(normalizedLabel) || propertyText.includes(normalizedLabel) || propertyText.includes('permanent wonen')
        }
        return destinationText.includes(normalizedLabel) || propertyText.includes(normalizedLabel)
      })

    const locationOptions = [
      'In woonwijk',
      'Aan rustige weg',
      'Centrum',
      'Nabij openbaar vervoer',
      'Kindvriendelijke buurt',
      'Aan park',
      'Aan water',
      'Vrij uitzicht',
      'Nabij station',
      'Bosrijke omgeving',
      'Doodlopende straat',
      'Landelijk gelegen',
      'Aan drukke weg',
      'Aan bosrand',
    ]
    const selectedLocationOptions = locationOptions.filter(hasExtraFilter)
    const locationText = textValue(property.ligging, property.location_description)
    const matchesLocation =
      selectedLocationOptions.length === 0 ||
      selectedLocationOptions.some((label) => {
        const normalizedLabel = label.toLowerCase()
        return locationText.includes(normalizedLabel) || propertyText.includes(normalizedLabel)
      })

    const openHouseOptions = ['Alle open huizen', 'Open huis komend weekend', 'Open huis vandaag']
    const selectedOpenHouseOptions = openHouseOptions.filter(hasExtraFilter)
    const openHouseText = textValue(property.open_huis, property.open_house)
    const openHouseDate = new Date(String(property.open_huis || property.open_house || ''))
    const hasOpenHouseDate = Number.isFinite(openHouseDate.getTime())
    const now = new Date()
    const isOpenHouseToday =
      hasOpenHouseDate &&
      openHouseDate.getFullYear() === now.getFullYear() &&
      openHouseDate.getMonth() === now.getMonth() &&
      openHouseDate.getDate() === now.getDate()
    const daysUntilOpenHouse = hasOpenHouseDate
      ? Math.ceil((openHouseDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000))
      : 0
    const isOpenHouseWeekend =
      hasOpenHouseDate &&
      [0, 6].includes(openHouseDate.getDay()) &&
      daysUntilOpenHouse >= 0 &&
      daysUntilOpenHouse <= 7
    const hasOpenHouse =
      boolValue(property.open_huis) ||
      boolValue(property.open_house) ||
      hasOpenHouseDate ||
      openHouseText.includes('open huis') ||
      propertyText.includes('open huis')
    const matchesOpenHouse =
      selectedOpenHouseOptions.length === 0 ||
      selectedOpenHouseOptions.some((label) => {
        if (label === 'Alle open huizen') return hasOpenHouse
        if (label === 'Open huis vandaag') return isOpenHouseToday || openHouseText.includes('vandaag') || propertyText.includes('open huis vandaag')
        if (label === 'Open huis komend weekend') return isOpenHouseWeekend || openHouseText.includes('komend weekend') || propertyText.includes('open huis komend weekend')
        return true
      })

    const viewOptions = ['Woningen', 'Projecten']
    const selectedViewOptions = viewOptions.filter(hasExtraFilter)
    const viewText = textValue(property.project, property.is_project, property.type)
    const isProject =
      boolValue(property.project) ||
      boolValue(property.is_project) ||
      viewText.includes('project') ||
      propertyText.includes('nieuwbouwproject')
    const matchesView =
      selectedViewOptions.length === 0 ||
      selectedViewOptions.some((label) => {
        if (label === 'Projecten') return isProject
        if (label === 'Woningen') return !isProject
        return true
      })

    return matchesSearch && matchesCity && matchesMinPrice && matchesMaxPrice && matchesPropertyType && matchesOfferedSince && matchesMinLivingArea && matchesMaxLivingArea && matchesMinBedrooms && matchesMaxBedrooms && matchesMinBathrooms && matchesMaxBathrooms && matchesMinRooms && matchesMaxRooms && matchesMinPlotArea && matchesMaxPlotArea && matchesKeyword && matchesEnergyLabel && matchesBuildPeriodFilter && matchesConstructionType && matchesOutdoor && matchesParking && matchesAccessibility && matchesFeatures && matchesAvailability && matchesGardenOrientation && matchesDestination && matchesLocation && matchesOpenHouse && matchesView
  })

  const filteredPropertiesWithLocation = useMemo(() => {
    return filteredProperties.filter(
      (property) =>
        Number(property.latitude) &&
      Number(property.longitude)
    )
  }, [filteredProperties])

  const sortedProperties = useMemo(() => {
    const nextProperties = [...filteredProperties]

    return nextProperties.sort((a, b) => {
      const aiA = getAiRankScore(a)
      const aiB = getAiRankScore(b)
      const priceA = numberValue(a.price)
      const priceB = numberValue(b.price)
      const sortablePriceA = priceA || Number.MAX_SAFE_INTEGER
      const sortablePriceB = priceB || Number.MAX_SAFE_INTEGER
      const pricePerM2A = priceA && getPropertyArea(a) ? priceA / getPropertyArea(a) : Number.MAX_SAFE_INTEGER
      const pricePerM2B = priceB && getPropertyArea(b) ? priceB / getPropertyArea(b) : Number.MAX_SAFE_INTEGER

      if (sortOption === 'Hoogste AI-score') return aiB - aiA
      if (sortOption === 'Beste prijs/kwaliteit') {
        const valueA = aiA > 0 && pricePerM2A !== Number.MAX_SAFE_INTEGER ? aiA / pricePerM2A : 0
        const valueB = aiB > 0 && pricePerM2B !== Number.MAX_SAFE_INTEGER ? aiB / pricePerM2B : 0

        return valueB - valueA
      }
      if (sortOption === 'Dichtstbij') {
        return (Number(a.distance) || Number.MAX_SAFE_INTEGER) - (Number(b.distance) || Number.MAX_SAFE_INTEGER)
      }
      if (sortOption === 'Nieuwste') {
        return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
      }
      if (sortOption === 'Prijs laag-hoog') return sortablePriceA - sortablePriceB
      if (sortOption === 'Prijs hoog-laag') return priceB - priceA

      return aiB - aiA
    })
  }, [filteredProperties, sortOption])

  const openEnergyScanProperty = useMemo(() => {
    if (!openEnergyScanId) return null

    return properties.find((property) => Number(property.id) === openEnergyScanId) || null
  }, [openEnergyScanId, properties])

  const mapKey = filteredPropertiesWithLocation
    .map((property) => `${property.id}-${property.latitude}-${property.longitude}`)
    .join('|')

  const visibleMapLocationCount = useMemo(() => {
    return new Set(
      filteredPropertiesWithLocation.map(
        (property) => `${Number(property.latitude).toFixed(5)},${Number(property.longitude).toFixed(5)}`
      )
    ).size
  }, [filteredPropertiesWithLocation])

  const marketInsights = useMemo(() => {
    const priceFormatter = new Intl.NumberFormat('nl-BE', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    })

    const propertiesWithPricePerM2 = filteredProperties.filter(
      (property) => getPropertyPricePerM2(property) > 0
    )
    const firstPropertyWithMarketData = propertiesWithPricePerM2.find(
      (property) => getCityAveragePricePerM2(property) > 0
    )
    const visibleAveragePricePerM2 = propertiesWithPricePerM2.length > 0
      ? propertiesWithPricePerM2.reduce((sum, property) => sum + getPropertyPricePerM2(property), 0) / propertiesWithPricePerM2.length
      : 0
    const averagePricePerM2 = firstPropertyWithMarketData
      ? getCityAveragePricePerM2(firstPropertyWithMarketData)
      : visibleAveragePricePerM2

    const epcCounts = filteredProperties.reduce<Record<string, number>>((counts, property) => {
      const epc = String(property.epc || property.epc_code || '').trim().toUpperCase()
      if (!epc) return counts

      counts[epc] = (counts[epc] || 0) + 1
      return counts
    }, {})
    const mostCommonEpc = Object.entries(epcCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || ''

    const bestDeal = propertiesWithPricePerM2.reduce(
      (best, property) => {
        const cityAverage = getCityAveragePricePerM2(property)
        const pricePerM2 = getPropertyPricePerM2(property)

        if (!cityAverage || !pricePerM2 || pricePerM2 >= cityAverage) return best

        const percentageBelowMarket = Math.round(((cityAverage - pricePerM2) / cityAverage) * 100)

        return percentageBelowMarket > best.percentage ? { percentage: percentageBelowMarket } : best
      },
      { percentage: 0 }
    )

    const aiInsight =
      filteredProperties.length < 2
        ? 'Onvoldoende gegevens beschikbaar voor een betrouwbare inschatting.'
        : mostCommonEpc && ['A+++++', 'A++++', 'A+++', 'A++', 'A+', 'A', 'B'].includes(mostCommonEpc)
          ? 'Op basis van de huidige resultaten komen gunstige EPC-labels relatief vaak voor. Dit is indicatief.'
          : filteredProperties.some((property) => String(property.type || property.woning_type || property.title || '').toLowerCase().includes('appartement'))
            ? 'Er staan appartementen in de huidige resultaten. Marktvraag kan niet betrouwbaar worden afgeleid zonder externe marktdata.'
            : 'Beperkte betrouwbaarheid: marktgedrag wordt hier niet extern gevalideerd.'

    return {
      averagePricePerM2: averagePricePerM2 ? `${priceFormatter.format(averagePricePerM2)} / m²` : 'Niet beschikbaar',
      averageEpc: mostCommonEpc || 'Onbekend',
      bestDeal: bestDeal.percentage > 0 ? `${bestDeal.percentage}% onder eigen dataset` : 'Geen analyse',
      aiInsight,
    }
  }, [filteredProperties])

  useEffect(() => {
    if (!mapInstance || !isLoaded) return

    const bounds = new window.google.maps.LatLngBounds()

    filteredPropertiesWithLocation.forEach((property) => {
      bounds.extend({
        lat: Number(property.latitude),
        lng: Number(property.longitude),
      })
    })

    const uniqueLocations = new Set(
      filteredPropertiesWithLocation.map(
        (property) =>
          `${Number(property.latitude).toFixed(5)},${Number(property.longitude).toFixed(5)}`
      )
    )

    const fitMap = () => {
      const locationQuery = normalizeBelgianSearchLabel(city.trim() || appliedSearch.trim())
        .replace(/,\s*(nederland|netherlands|belgië|belgium)$/i, '')
        .trim()

      if (/netherlands|nederland/i.test(locationQuery)) {
        mapInstance.setCenter({ lat: 50.8503, lng: 4.3517 })
        mapInstance.setZoom(8)
        return
      }

      if (locationQuery && window.google?.maps?.Geocoder) {
        const geocoder = new window.google.maps.Geocoder()

        geocoder.geocode(
          {
            address: `${locationQuery}, België`,
            componentRestrictions: { country: 'BE' },
          },
          (results, status) => {
            const location = results?.[0]?.geometry?.location

            if (status === 'OK' && location) {
              mapInstance.setCenter(location)
              mapInstance.setZoom(12)
              return
            }

            if (filteredPropertiesWithLocation.length === 0) {
              mapInstance.setCenter({ lat: 50.8503, lng: 4.3517 })
              mapInstance.setZoom(8)
              return
            }

            if (filteredPropertiesWithLocation.length > 1 && uniqueLocations.size > 1) {
              mapInstance.fitBounds(bounds)

              window.google.maps.event.addListenerOnce(mapInstance, 'bounds_changed', () => {
                const currentZoom = mapInstance.getZoom() || 11

                if (currentZoom > 12) {
                  mapInstance.setZoom(12)
                }
              })
            } else {
              mapInstance.setCenter(bounds.getCenter())
              mapInstance.setZoom(12)
            }
          }
        )

        return
      }

      if (filteredPropertiesWithLocation.length === 0) {
        mapInstance.setCenter({ lat: 50.8503, lng: 4.3517 })
        mapInstance.setZoom(8)
        return
      }

      if (filteredPropertiesWithLocation.length > 1 && uniqueLocations.size > 1) {
        mapInstance.fitBounds(bounds)

        window.google.maps.event.addListenerOnce(mapInstance, 'bounds_changed', () => {
          const currentZoom = mapInstance.getZoom() || 11

          if (currentZoom > 12) {
            mapInstance.setZoom(12)
          }
        })
      } else {
        mapInstance.setCenter(bounds.getCenter())
        mapInstance.setZoom(12)
      }
    }

    fitMap()

    const timer = setTimeout(() => {
      fitMap()
    }, 700)

    return () => clearTimeout(timer)
  }, [mapInstance, isLoaded, mapKey, submittedSearchKey, appliedSearch, city])


  function renderRenovatieScanOverview(
    renovatieScanProperty: any,
    options: { showCloseButton?: boolean; onClose?: () => void } = {}
  ) {
          const renovatiePhotoCount = getPropertyPhotoCount(renovatieScanProperty)
          const renovatiePropertyId = Number(renovatieScanProperty.id)
          const renovatiePhotoAnalysis = renovatiePhotoAnalyses[renovatiePropertyId] || null
          const isRenovatiePhotoLoading = Boolean(renovatiePhotoLoading[renovatiePropertyId])
          const renovatiePhotoError = renovatiePhotoErrors[renovatiePropertyId] || ''
          const renovatieScan = getRenovatieScan(
            renovatieScanProperty,
            renovatiePhotoCount,
            renovatiePhotoAnalysis,
          )
          const zichtbareRenovatiezones = Object.entries(renovatieScan.renovatiezones).filter(
            ([, status]) => status !== 'niet_zichtbaar'
          )
          const renovationAreaLabels: Record<string, string> = {
            walls: 'Muren',
            floors: 'Vloeren',
            windows: 'Ramen',
            kitchen: 'Keuken',
            bathroom: 'Badkamer',
            ceiling: 'Plafond',
            roof: 'Dak',
            installations: 'Installaties',
            insulation: 'Isolatie',
          }
          const renovationStatusLabels: Record<string, string> = {
            modern_zichtbaar: 'Modern zichtbaar',
            verzorgd_zichtbaar: 'Verzorgd zichtbaar',
            verouderd_zichtbaar: 'Verouderd zichtbaar',
            beperkt_zichtbaar: 'Beperkt zichtbaar',
            niet_zichtbaar: 'Niet zichtbaar',
          }

    return (
                <div className="bg-[#F6F8FC] p-4 sm:p-6">
                  <div className="rounded-[28px] border border-blue-100 bg-white p-8 shadow-sm">
                    <section>
                      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div>
                          <p className="text-xs font-black uppercase tracking-wide text-[#64748B]">
                            Staat van afwerking
                          </p>
                          <div className="mt-3 flex flex-wrap items-center gap-3">
                            <span className="inline-flex w-fit rounded-full border border-orange-100 bg-orange-50 px-4 py-1.5 text-sm font-black text-orange-700">
                              {isRenovatiePhotoLoading
                                ? 'Foto’s worden geanalyseerd...'
                                : renovatieScan.renovatieniveau}
                            </span>
                            <p className="text-sm font-semibold leading-6 text-[#64748B]">
                              Er worden geen kosten berekend in Renovatie Scan v2.
                            </p>
                          </div>
                        </div>

                        <div className="grid gap-4 text-sm md:min-w-[320px] md:grid-cols-1">
                          <div>
                            <p className="text-[11px] font-black uppercase tracking-wide text-[#64748B]">
                              Toelichting
                            </p>
                            <p className="mt-1 font-semibold leading-6 text-[#64748B]">
                              {renovatieScan.renovatiecategorie}
                            </p>
                          </div>
                          <div>
                            <p className="text-[11px] font-black uppercase tracking-wide text-[#64748B]">
                              Betrouwbaarheid
                            </p>
                            <p className="mt-1 font-semibold leading-6 text-[#64748B]">
                              {renovatieScan.betrouwbaarheid}
                            </p>
                          </div>
                        </div>
                      </div>
                    </section>

                    <section className="mt-5 border-t border-blue-50 pt-5">
                      {isRenovatiePhotoLoading ? (
                        <div className="rounded-2xl border border-orange-100 bg-orange-50 p-4 text-sm font-bold text-orange-700">
                          Foto’s worden geanalyseerd...
                        </div>
                      ) : renovatiePhotoError ? (
                        <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-bold text-red-700">
                          {renovatiePhotoError} De scan toont voorlopig alleen wat niet visueel is vastgesteld.
                        </div>
                      ) : (
                        <p className="text-sm font-semibold leading-6 text-[#64748B]">
                          {renovatieScan.fotoAnalyseSamenvatting}
                        </p>
                      )}
                    </section>

                    <section className="mt-5 border-t border-blue-50 pt-5">
                      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                        <div>
                          <h4 className="text-base font-black text-[#071B4D]">Waargenomen elementen</h4>
                          <ul className="mt-3 space-y-2 text-sm font-semibold leading-6 text-[#64748B]">
                            {renovatieScan.visueleObservaties.map((observatie, index) => (
                              <li key={index} className="flex gap-2">
                                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#F97316]" />
                                <span>{observatie}</span>
                              </li>
                            ))}
                          </ul>
                          {renovatieScan.kamersGezien.length > 0 && (
                            <p className="mt-3 text-xs font-bold text-[#64748B]">
                              Ruimtes gezien: {renovatieScan.kamersGezien.join(', ')} · Foto’s geanalyseerd: {renovatieScan.fotoDekking.aantalFotos}
                            </p>
                          )}
                        </div>

                        <div>
                          <h4 className="text-base font-black text-[#071B4D]">Waargenomen componenten</h4>
                          {zichtbareRenovatiezones.length > 0 ? (
                            <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-black text-[#64748B]">
                              {zichtbareRenovatiezones.map(([zone, status]) => (
                                <div key={zone} className="rounded-xl border border-blue-100 bg-[#F6F8FC] px-3 py-2">
                                  <span className="block text-[#071B4D]">{renovationAreaLabels[zone] || zone}</span>
                                  <span className="mt-1 block">{renovationStatusLabels[String(status)] || String(status).replace('_', ' ')}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="mt-3 text-sm font-semibold leading-6 text-[#64748B]">
                              Geen afzonderlijke componenten zichtbaar genoeg om te beoordelen. Niet-zichtbare onderdelen staan apart bij Niet beoordeeld.
                            </p>
                          )}
                        </div>
                      </div>
                    </section>

                    <section className="mt-5 border-t border-blue-50 pt-5">
                      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                        <div>
                          <h4 className="text-base font-black text-[#071B4D]">Zichtbare pluspunten</h4>
                          <ul className="mt-3 space-y-2 text-sm font-semibold leading-6 text-[#64748B]">
                            {renovatieScan.pluspunten.map((pluspunt, index) => (
                              <li key={index} className="flex gap-2">
                                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#071B4D]" />
                                <span>{pluspunt}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div>
                          <h4 className="text-base font-black text-[#071B4D]">Mogelijke aandachtspunten</h4>
                          <ul className="mt-3 space-y-2 text-sm font-semibold leading-6 text-[#64748B]">
                            {renovatieScan.aandachtspunten.map((aandachtspunt, index) => (
                              <li key={index} className="flex gap-2">
                                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#071B4D]" />
                                <span>{aandachtspunt}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </section>


                    {renovatieScan.nietBeoordeeld.length > 0 && (
                      <section className="mt-5 border-t border-blue-50 pt-5">
                        <h4 className="text-base font-black text-[#071B4D]">Niet beoordeeld</h4>
                        <ul className="mt-3 grid grid-cols-1 gap-2 text-sm font-semibold leading-6 text-[#64748B] sm:grid-cols-2">
                          {renovatieScan.nietBeoordeeld.map((onderdeel, index) => (
                            <li key={index} className="rounded-xl border border-blue-100 bg-[#F6F8FC] px-3 py-2">
                              {onderdeel}
                            </li>
                          ))}
                        </ul>
                      </section>
                    )}

                    <section className="mt-5 border-t border-blue-50 pt-5">
                      <h4 className="text-base font-black text-[#071B4D]">Gebaseerd op</h4>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {renovatieScan.gebaseerdOp.map((datapunt, index) => (
                          <span key={index} className="rounded-full border border-blue-100 bg-[#F6F8FC] px-3 py-1 text-xs font-black text-[#64748B] shadow-sm">
                            {datapunt}
                          </span>
                        ))}
                      </div>
                    </section>

                    {renovatieScan.beperkteFotoInformatie && (
                      <p className="mt-5 border-t border-blue-50 pt-5 text-sm font-semibold leading-6 text-[#64748B]">
                        Beperkte foto-informatie beschikbaar.
                      </p>
                    )}

                    <footer className="mt-5 border-t border-blue-50 pt-5 text-xs font-semibold leading-5 text-[#64748B]">
                      <p>
                        {renovatieScan.fotoAnalyseStatus === 'geanalyseerd'
                          ? 'Foto’s zijn visueel door AI beoordeeld op basis van zichtbare elementen.'
                          : 'Foto’s werden niet visueel beoordeeld.'}
                      </p>
                      <p className="mt-2">
                        Deze beoordeling is gebaseerd op zichtbare elementen in beschikbare foto&apos;s, met woninggegevens alleen als context. Het betreft geen bouwkundig rapport, expertiseverslag of professionele inspectie.
                      </p>
                    </footer>

                    {options.showCloseButton && (
                      <button
                        type="button"
                        onClick={options.onClose}
                        className="mx-auto mt-5 inline-flex items-center justify-center rounded-xl bg-[#071B4D] px-6 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-[#0B2A6B]"
                      >
                        Sluiten
                      </button>
                    )}
                  </div>
                </div>
    )
  }

  function renderEnergyScanOverview(
    energyScanProperty: any,
    options: { embedded?: boolean; reportId?: string; showActions?: boolean; onClose?: () => void } = {}
  ) {
          void energyScanRefreshKey

          const hasEnergyValue = (value: unknown) =>
            value !== null && value !== undefined && String(value).trim() !== ''

          const manualData = manualEnergyData[Number(energyScanProperty.id)] || {}

          const enrichedEnergyScanProperty = {
            ...energyScanProperty,
            bouwjaar: manualData.bouwjaar || energyScanProperty.bouwjaar,
            renovatiejaar: manualData.renovatiejaar || energyScanProperty.renovatiejaar,
            laatste_renovatiejaar: manualData.renovatiejaar || energyScanProperty.laatste_renovatiejaar,
            dakisolatie: manualData.dakisolatie ?? energyScanProperty.dakisolatie,
            dak_vernieuwd: manualData.dakVernieuwd ?? energyScanProperty.dak_vernieuwd,
            muurisolatie: manualData.isolatie ?? energyScanProperty.muurisolatie,
            vloerisolatie: manualData.isolatie ?? energyScanProperty.vloerisolatie,
            dubbel_glas: manualData.ramenVervangen ?? energyScanProperty.dubbel_glas,
            hr_glas: manualData.ramenVervangen ?? energyScanProperty.hr_glas,
            verwarmingstype: manualData.verwarmingstype || energyScanProperty.verwarmingstype,
          }
          const energyInsight = calculateEnergyInsight(enrichedEnergyScanProperty)
          const formatter = new Intl.NumberFormat('nl-BE', {
            style: 'currency',
            currency: 'EUR',
            maximumFractionDigits: 0,
          })

          const missingEnergyFields = {
            laatsteRenovatiejaar: !hasEnergyValue(energyScanProperty.laatste_renovatiejaar),
            dakGeisoleerd: !hasEnergyValue(energyScanProperty.dakisolatie),
            dakVernieuwd: !hasEnergyValue(energyScanProperty.dak_vernieuwd),
            isolatie: !hasEnergyValue(energyScanProperty.muurisolatie) && !hasEnergyValue(energyScanProperty.vloerisolatie),
            ramenVervangen: !hasEnergyValue(energyScanProperty.ramen_vervangen),
          }
          const showManualEnergyInputs = Object.values(missingEnergyFields).some(Boolean)

          const setManualEnergyValue = (key: string, value: unknown) => {
            const propertyId = Number(energyScanProperty.id)

            setManualEnergyData((current) => ({
              ...current,
              [propertyId]: {
                ...(current[propertyId] || {}),
                [key]: value,
              },
            }))
          }

          const renderYesNoToggle = (key: string, label: string, currentValue: unknown = manualData[key]) => {
            const selectedValue = manualData[key] ?? parseBooleanData(currentValue)

            return (
              <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                <p className="text-sm font-black text-[#071B4D]">{label}</p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {[
                    { label: 'Ja', value: true },
                    { label: 'Nee', value: false },
                  ].map((option) => (
                    <button
                      key={option.label}
                      type="button"
                      onClick={() => setManualEnergyValue(key, option.value)}
                      className={`h-10 rounded-xl border text-sm font-black transition ${
                        selectedValue === option.value
                          ? 'border-[#0B1F4D] bg-[#0B1F4D] text-white'
                          : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-blue-200 hover:bg-blue-50'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            )
          }

          const energyScanEpc = String(
            energyScanProperty.epc ||
            energyScanProperty.epc_code ||
            ''
          ).toUpperCase().trim()

          const hasGoodEnergyScanEpc = [
            'A+++++',
            'A++++',
            'A+++',
            'A++',
            'A+',
            'A',
            'B',
          ].includes(energyScanEpc)

          const estimatedCost = energyInsight.estimatedMax > 0
            ? `${formatter.format(energyInsight.estimatedMin)} - ${formatter.format(energyInsight.estimatedMax)}`
            : hasGoodEnergyScanEpc
              ? 'Geen verplichte energierenovatie gevonden'
              : 'Nog niet genoeg data'

          const mainReason = energyInsight.recommendations[0] || 'Geen duidelijke energierenovatie gevonden met de beschikbare data.'
          const propertyAnalysis = getSlimCheck(enrichedEnergyScanProperty)
          const propertyAiScore = getAiRankScore({
            ...enrichedEnergyScanProperty,
            ai_rank_score:
              enrichedEnergyScanProperty.ai_rank_score ??
              enrichedEnergyScanProperty.ai_score ??
              enrichedEnergyScanProperty.aiScore ??
              enrichedEnergyScanProperty.match_score ??
              enrichedEnergyScanProperty.matchScore ??
              enrichedEnergyScanProperty.rank_score ??
              enrichedEnergyScanProperty.rankScore,
          })
          const propertyAiLabel = getAiScoreLabel(propertyAiScore)
          const marketComparableCount = getComparableProperties(enrichedEnergyScanProperty).length
          const marketConfidence = marketComparableCount >= 6
            ? `Hoog (${marketComparableCount} vergelijkbare panden)`
            : marketComparableCount >= 3
              ? `Gemiddeld (${marketComparableCount} vergelijkbare panden)`
              : `Laag (${marketComparableCount} vergelijkbare panden)`
          const overallConfidence = energyInsight.confidence === 'high'
            ? 'Hoog'
            : energyInsight.confidence === 'medium'
              ? 'Gemiddeld'
              : 'Laag'
          const knownAmenities = getKnownAmenities(enrichedEnergyScanProperty)
          const propertyStrengths = [
            propertyAiScore >= 70 ? `AI-score ${propertyAiScore}/100 (${propertyAiLabel})` : '',
            hasGoodEnergyScanEpc ? `Sterk energielabel: ${energyScanEpc}` : '',
            parseBooleanData(enrichedEnergyScanProperty.zonnepanelen) === true ? 'Zonnepanelen aanwezig volgens de woningdata.' : '',
            parseBooleanData(enrichedEnergyScanProperty.warmtepomp) === true ? 'Warmtepomp aanwezig volgens de woningdata.' : '',
            knownAmenities.length > 0 ? `Aanwezige comfortelementen: ${knownAmenities.join(', ')}.` : '',
          ].filter(Boolean)
          const propertyLimitations = [
            marketComparableCount < 3 ? 'Beperkte vergelijkingsbasis voor marktconclusies.' : '',
            !energyScanEpc ? 'EPC-label ontbreekt in de beschikbare data.' : '',
            ['E', 'F', 'G'].includes(energyScanEpc) ? `EPC ${energyScanEpc} vraagt extra controle van renovatieplicht en maatregelen.` : '',
            showManualEnergyInputs ? 'Een deel van de energie- of renovatiedata ontbreekt en kan hieronder aangevuld worden.' : '',
            parseBooleanData(enrichedEnergyScanProperty.renovatieverplichting) === true ? 'Renovatieverplichting staat als aanwezig in de data.' : '',
          ].filter(Boolean)
    const reportId = options.reportId || 'energy-report-content'
    const compactCostText = energyInsight.estimatedMax > 0
      ? `${estimatedCost}`
      : estimatedCost
    const energyStrengths = [
      hasGoodEnergyScanEpc ? `EPC ${energyScanEpc}` : '',
      parseBooleanData(enrichedEnergyScanProperty.warmtepomp) === true ? 'Warmtepomp' : '',
      parseBooleanData(enrichedEnergyScanProperty.dubbel_glas) === true || parseBooleanData(enrichedEnergyScanProperty.hr_glas) === true ? 'Dubbel glas' : '',
      knownAmenities.length > 0 ? `Comfortelementen: ${knownAmenities.join(', ')}` : '',
      parseBooleanData(enrichedEnergyScanProperty.zonnepanelen) === true ? 'Zonnepanelen' : '',
      ...propertyStrengths,
    ]
      .filter(Boolean)
      .filter((item, index, list) => list.indexOf(item) === index)
      .slice(0, 5)
    const attentionPoints = [
      ...propertyLimitations,
      marketComparableCount < 3 ? 'Beperkte vergelijkingsbasis voor marktconclusies.' : '',
      showManualEnergyInputs ? 'Ontbrekende gegevens kunnen hieronder aangevuld worden.' : '',
      energyInsight.warnings[0] || '',
    ]
      .filter(Boolean)
      .filter((item, index, list) => list.indexOf(item) === index)
      .slice(0, 5)
    const additionalInfoFields = [
      {
        key: 'renovatiejaar',
        label: 'Laatste renovatiejaar',
        kind: 'number',
        value: firstKnownPropertyValue(
          manualData.renovatiejaar,
          energyScanProperty.laatste_renovatiejaar,
          energyScanProperty.renovatiejaar,
        ),
      },
      {
        key: 'dakisolatie',
        label: 'Dak geïsoleerd',
        kind: 'boolean',
        value: firstKnownPropertyValue(manualData.dakisolatie, energyScanProperty.dakisolatie),
      },
      {
        key: 'dakVernieuwd',
        label: 'Dak vernieuwd',
        kind: 'boolean',
        value: firstKnownPropertyValue(manualData.dakVernieuwd, energyScanProperty.dak_vernieuwd),
      },
      {
        key: 'isolatie',
        label: 'Isolatie aanwezig',
        kind: 'boolean',
        value: firstKnownPropertyValue(
          manualData.isolatie,
          energyScanProperty.muurisolatie,
          energyScanProperty.vloerisolatie,
        ),
      },
      {
        key: 'ramenVervangen',
        label: 'Ramen vervangen',
        kind: 'boolean',
        value: firstKnownPropertyValue(
          manualData.ramenVervangen,
          energyScanProperty.ramen_vervangen,
          energyScanProperty.dubbel_glas,
          energyScanProperty.hr_glas,
        ),
      },
    ]
    const renderAdditionalField = (field: typeof additionalInfoFields[number]) => {
      if (field.kind === 'number') {
        return (
          <label key={field.key} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <span className="text-sm font-black text-[#071B4D]">{field.label}</span>
            <input
              type="number"
              value={String(field.value || '')}
              onChange={(event) => setManualEnergyValue(field.key, event.target.value)}
              placeholder="Onbekend"
              className="mt-3 h-11 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm font-black text-gray-700 outline-none transition focus:border-blue-400 focus:bg-white"
            />
          </label>
        )
      }

      return renderYesNoToggle(field.key, field.label, field.value)
    }

    return (
      <div
        id={reportId}
        className={options.embedded
          ? 'rounded-[2rem] bg-white p-6 shadow-sm md:p-8'
          : 'max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-[2rem] bg-white p-6 shadow-2xl md:p-8'}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-black uppercase tracking-wide text-amber-600">
              EnergieScan
            </p>
            <h3 className="mt-2 text-3xl font-black text-[#071B4D]">
              {energyScanProperty.title || 'Energie-inschatting'}
            </h3>
            <p className="mt-3 max-w-xl text-sm font-bold leading-6 text-gray-500">
              Compact dashboard op basis van beschikbare woningdata. Geen offerte of definitief technisch rapport.
            </p>
          </div>

          {options.onClose && (
            <button
              type="button"
              onClick={options.onClose}
              className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gray-100 text-2xl font-black text-gray-600 transition hover:bg-gray-200"
            >
              ×
            </button>
          )}
        </div>

        <section className="mt-6 rounded-[1.5rem] border border-blue-100 bg-blue-50/50 p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-blue-700">
                Woningoverzicht
              </p>
              <h4 className="mt-2 text-xl font-black text-[#071B4D]">
                {propertyAnalysis.status}
              </h4>
              <p className="mt-3 max-w-3xl text-sm font-bold leading-6 text-blue-900">
                {propertyAnalysis.highlight}
              </p>
            </div>

            <div className="grid min-w-[260px] gap-3 sm:grid-cols-3 lg:grid-cols-1">
              <div className="rounded-2xl bg-white p-4 shadow-sm">
                <p className="text-[11px] font-black uppercase tracking-wide text-slate-500">AI-score</p>
                <p className="mt-1 text-xl font-black text-[#071B4D]">{propertyAiScore}/100</p>
                <p className="mt-1 text-xs font-bold text-slate-600">{propertyAiLabel}</p>
              </div>
              <div className="rounded-2xl bg-white p-4 shadow-sm">
                <p className="text-[11px] font-black uppercase tracking-wide text-slate-500">Betrouwbaarheid</p>
                <p className="mt-1 text-lg font-black text-[#071B4D]">{overallConfidence}</p>
              </div>
              <div className="rounded-2xl bg-white p-4 shadow-sm">
                <p className="text-[11px] font-black uppercase tracking-wide text-slate-500">Marktvertrouwen</p>
                <p className="mt-1 text-lg font-black text-[#071B4D]">{marketConfidence}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-5 grid gap-5 lg:grid-cols-2">
          <div className="rounded-[1.5rem] border border-emerald-100 bg-emerald-50 p-5 shadow-sm">
            <h4 className="text-base font-black text-emerald-900">Sterke punten</h4>
            <ul className="mt-3 space-y-2 text-sm font-bold leading-6 text-emerald-800">
              {(energyStrengths.length > 0 ? energyStrengths : ['Geen duidelijke sterke energiepunten gevonden in de beschikbare data.']).map((item, index) => (
                <li key={`${item}-${index}`} className="flex gap-2">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-[1.5rem] border border-orange-100 bg-orange-50 p-5 shadow-sm">
            <h4 className="text-base font-black text-orange-900">Aandachtspunten</h4>
            <ul className="mt-3 space-y-2 text-sm font-bold leading-6 text-orange-800">
              {(attentionPoints.length > 0 ? attentionPoints : ['Geen extra aandachtspunten gevonden buiten de algemene databetrouwbaarheid.']).map((item, index) => (
                <li key={`${item}-${index}`} className="flex gap-2">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-orange-500" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="mt-5 rounded-[1.5rem] border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-gray-500">
                Energie-inschatting
              </p>
              <h4 className="mt-2 text-xl font-black text-[#071B4D]">
                {compactCostText}
              </h4>
              <p className="mt-2 max-w-2xl text-sm font-bold leading-6 text-gray-600">
                {mainReason}
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 md:min-w-[360px]">
              <div className="rounded-2xl border border-red-100 bg-red-50 p-4">
                <p className="text-[11px] font-black uppercase tracking-wide text-red-700">Energierisico</p>
                <p className="mt-2 text-lg font-black text-[#071B4D]">{energyInsight.energyRisk.level}</p>
                <p className="mt-1 text-xs font-bold leading-5 text-red-800">{energyInsight.energyRisk.text}</p>
              </div>
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                <p className="text-[11px] font-black uppercase tracking-wide text-emerald-700">Toekomstbestendigheid</p>
                <p className="mt-2 text-lg font-black text-[#071B4D]">{energyInsight.futureProofScore.level}</p>
                <p className="mt-1 text-xs font-bold leading-5 text-emerald-800">{energyInsight.futureProofScore.text}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-5 rounded-[1.5rem] border border-blue-100 bg-gradient-to-br from-white via-blue-50 to-amber-50 p-5 shadow-sm">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-blue-700">
                Aanvullende informatie
              </p>
              <h4 className="mt-2 text-lg font-black text-[#071B4D]">
                Vul ontbrekende renovatiedata aan
              </h4>
            </div>

            <button
              type="button"
              onClick={() => setEnergyScanRefreshKey((current) => current + 1)}
              className="rounded-xl bg-[#0B1F4D] px-5 py-3 text-sm font-black text-white transition hover:bg-blue-800"
            >
              Herbereken energiescan
            </button>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {additionalInfoFields.map(renderAdditionalField)}
          </div>
        </section>

        {options.showActions !== false && (
          <div className="mt-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <p className="text-xs font-bold leading-5 text-gray-500">
              Voor een echte offerte zijn exacte renovatiegegevens, plaatsbezoek en metingen nodig.
            </p>

            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <button
                type="button"
                onClick={async () => {
                  console.log('PDF CLICKED')

                  await exportEnergyReport(
                    reportId,
                    energyScanProperty?.title || 'energie-report'
                  )
                }}
                className="rounded-2xl border border-[#0B1F4D] bg-white px-5 py-3 text-base font-black text-[#0B1F4D] transition hover:bg-[#F5F7FB]"
              >
                Download PDF
              </button>

              {options.onClose && (
                <button
                  type="button"
                  onClick={options.onClose}
                  className="rounded-2xl bg-[#0B1F4D] px-5 py-3 text-base font-black text-white transition hover:bg-[#071736]"
                >
                  Sluiten
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    )
  }
  return (
    <div className="min-h-screen bg-[#f6f8fb] px-5 pb-8 pt-3 text-[#111827] md:px-10 md:pt-4">
      <div className="mx-auto max-w-[1500px]">
        <div className="mb-8 space-y-4">
          <form
            onSubmit={handleSearchSubmit}
            className="rounded-[2rem] border border-blue-100 bg-white p-4 shadow-[0_18px_50px_rgba(15,23,42,0.08)]"
          >
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <div className="flex min-h-16 flex-1 items-center rounded-[1.5rem] border border-gray-200 bg-white px-5 shadow-inner shadow-gray-100 transition focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-50">
                <button
                  type="button"
                  onClick={handleUseCurrentLocation}
                  aria-label="Gebruik mijn huidige locatie"
                  title="Gebruik mijn huidige locatie"
                  className="mr-4 grid h-11 w-11 shrink-0 place-items-center rounded-full bg-blue-50 text-blue-700 transition hover:bg-blue-100 hover:text-blue-800"
                >
                  <svg
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                    className="h-6 w-6"
                    fill="none"
                  >
                    <circle cx="12" cy="12" r="5.25" stroke="currentColor" strokeWidth="1.8" />
                    <path d="M12 2.75V6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                    <path d="M12 18V21.25" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                    <path d="M2.75 12H6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                    <path d="M18 12H21.25" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                    <circle cx="12" cy="12" r="1.2" fill="currentColor" />
                  </svg>
                </button>

                <input
                  ref={searchInputRef}
                  placeholder="Zoek op plaats, buurt, adres of postcode"
                  value={search}
                  onChange={(e) => {
                    const nextValue = e.target.value
                    if (/netherlands|nederland/i.test(nextValue)) {
                      setSearch('')
                      setAppliedSearch('')
                      return
                    }
                    setSearch(nextValue)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSearchSubmit(e)
                  }}
                  autoComplete="off"
                  className="h-16 flex-1 bg-transparent text-lg font-semibold text-[#071B4D] outline-none placeholder:text-gray-400"
                />
              </div>

              <button
                type="submit"
                className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-blue-700 px-6 text-base font-black text-white shadow-md shadow-blue-700/20 transition hover:bg-blue-800 whitespace-nowrap"
              >
                <span className="text-2xl">⌕</span>
                Zoeken
              </button>

              <div className="grid grid-cols-2 gap-3 lg:w-[300px]">
                <button
                  type="button"
                  onClick={() => {
                    setShowMap(true)
                    setSelectedMapProperty(null)
                  }}
                  className="flex h-12 items-center justify-center gap-2 rounded-2xl border border-blue-200 bg-white px-5 text-base font-black text-blue-700 shadow-sm transition hover:bg-blue-50 whitespace-nowrap"
                >
                  <span className="text-2xl">▱</span>
                  {showMap ? 'Kaart' : 'Toon kaart'}
                </button>

                <Link
                  href="/favorites"
                  className="flex h-12 items-center justify-center gap-2 rounded-2xl border border-blue-200 bg-white px-5 text-base font-black text-blue-700 shadow-sm transition hover:bg-blue-50 whitespace-nowrap"
                >
                  <span className="text-2xl">♡</span>
                  Bewaar
                </Link>
              </div>
            </div>
          </form>

          <div className="rounded-[2rem] border border-blue-100 bg-white p-4 shadow-[0_14px_40px_rgba(15,23,42,0.06)]">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-7">
              <button
                type="button"
                className="flex h-14 items-center justify-between rounded-2xl border border-gray-200 bg-white px-5 text-left font-bold text-[#071B4D] transition hover:border-blue-300 hover:bg-blue-50"
              >
                <span className="flex items-center gap-2">
                  <span>⌂</span>
                  {offerType}
                </span>
                <span className="text-blue-700">⌄</span>
              </button>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setOpenFilter(openFilter === 'price' ? null : 'price')}
                  className={`flex h-14 w-full items-center justify-between rounded-2xl border px-5 text-left font-bold transition ${
                    openFilter === 'price'
                      ? 'border-blue-400 bg-blue-50 text-blue-700'
                      : 'border-gray-200 bg-white text-[#071B4D] hover:border-blue-300 hover:bg-blue-50'
                  }`}
                >
                  <span>
                    {minPrice || maxPrice
                      ? `${formatFilterPriceLabel(minPrice, '€ 0')} - ${formatFilterPriceLabel(maxPrice, 'Geen max')}`
                      : isRentPage ? 'Huurprijs / maand' : 'Prijs'}
                  </span>
                  <span className={`text-blue-700 transition ${openFilter === 'price' ? 'rotate-180' : ''}`}>
                    ⌄
                  </span>
                </button>

                {openFilter === 'price' && (
                  <div className="absolute left-0 top-[calc(100%+0.75rem)] z-50 w-[390px] rounded-[1.5rem] border border-gray-100 bg-white p-6 shadow-[0_24px_70px_rgba(15,23,42,0.18)]">
                    <p className="text-xl font-black text-[#071B4D]">
                      {isRentPage ? 'Huurprijs per maand' : 'Prijs'}
                    </p>

                    <div className="mt-5 grid grid-cols-2 gap-4">
                      <div className="relative">
                        <input
                          placeholder="Van"
                          value={minPrice}
                          onFocus={() => setOpenPriceField('min')}
                          onChange={(e) => {
                            setMinPrice(e.target.value)
                            setOpenPriceField('min')
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSearchSubmit(e)
                          }}
                          className="h-14 w-full rounded-xl border border-gray-300 bg-white px-4 text-lg font-bold text-[#071B4D] outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                        />

                        {openPriceField === 'min' && (
                          <div className="absolute left-0 top-full z-[60] max-h-[410px] w-full overflow-y-auto rounded-b-xl border border-t-0 border-gray-300 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.16)]">
                            {priceOptions.map((priceOption) => {
                              const label = formatPriceOption(priceOption)
                              const isActive = minPrice === label

                              return (
                                <button
                                  key={priceOption}
                                  type="button"
                                  onMouseDown={(e) => e.preventDefault()}
                                  onClick={() => {
                                    setMinPrice(label)
                                    setOpenPriceField(null)
                                  }}
                                  className={`block w-full px-5 py-4 text-left text-lg font-bold transition ${
                                    isActive
                                      ? 'bg-blue-100 text-[#071B4D]'
                                      : 'text-[#111827] hover:bg-blue-50'
                                  }`}
                                >
                                  {label}
                                </button>
                              )
                            })}
                          </div>
                        )}
                      </div>

                      <div className="relative">
                        <input
                          placeholder="Tot"
                          value={maxPrice}
                          onFocus={() => setOpenPriceField('max')}
                          onChange={(e) => {
                            setMaxPrice(e.target.value)
                            setOpenPriceField('max')
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSearchSubmit(e)
                          }}
                          className="h-14 w-full rounded-xl border border-gray-300 bg-white px-4 text-lg font-bold text-[#071B4D] outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                        />

                        {openPriceField === 'max' && (
                          <div className="absolute left-0 top-full z-[60] max-h-[410px] w-full overflow-y-auto rounded-b-xl border border-t-0 border-gray-300 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.16)]">
                            {priceOptions.slice(1).map((priceOption) => {
                              const label = formatPriceOption(priceOption)
                              const isActive = maxPrice === label

                              return (
                                <button
                                  key={priceOption}
                                  type="button"
                                  onMouseDown={(e) => e.preventDefault()}
                                  onClick={() => {
                                    setMaxPrice(label)
                                    setOpenPriceField(null)
                                  }}
                                  className={`block w-full px-5 py-4 text-left text-lg font-bold transition ${
                                    isActive
                                      ? 'bg-blue-100 text-[#071B4D]'
                                      : 'text-[#111827] hover:bg-blue-50'
                                  }`}
                                >
                                  {label}
                                </button>
                              )
                            })}

                            <button
                              type="button"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => {
                                setMaxPrice('')
                                setOpenPriceField(null)
                              }}
                              className={`block w-full px-5 py-4 text-left text-lg font-bold transition ${
                                maxPrice === ''
                                  ? 'bg-blue-100 text-[#071B4D]'
                                  : 'text-[#111827] hover:bg-blue-50'
                              }`}
                            >
                              Geen max.
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-6 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => {
                          setMinPrice('')
                          setMaxPrice('')
                        }}
                        className="text-lg font-bold text-blue-700 hover:text-blue-900"
                      >
                        Wissen
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSearchSubmit()}
                        className="rounded-xl bg-blue-700 px-5 py-3 font-black text-white shadow-lg shadow-blue-700/20 transition hover:bg-blue-800"
                      >
                        Toepassen
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setOpenFilter(openFilter === 'type' ? null : 'type')}
                  className={`flex h-14 w-full items-center justify-between rounded-2xl border px-5 text-left font-bold transition ${
                    openFilter === 'type'
                      ? 'border-blue-400 bg-blue-50 text-blue-700'
                      : 'border-gray-200 bg-white text-[#071B4D] hover:border-blue-300 hover:bg-blue-50'
                  }`}
                >
                  <span className="flex items-center gap-2 truncate">
                    <span>⌂</span>
                    <span className="truncate">{propertyType || 'Type'}</span>
                  </span>
                  <span className={`text-blue-700 transition ${openFilter === 'type' ? 'rotate-180' : ''}`}>
                    ⌄
                  </span>
                </button>

                {openFilter === 'type' && (
                  <div className="absolute left-0 top-[calc(100%+0.75rem)] z-50 max-h-[430px] w-[390px] overflow-y-auto rounded-[1.5rem] border border-gray-100 bg-white py-3 shadow-[0_24px_70px_rgba(15,23,42,0.18)]">
                    {[
                      'Huis',
                      'Appartement',
                      'Huis en appartement',
                      'Nieuwbouwproject – Huizen',
                      'Nieuwbouwproject – Appartementen',
                      'Nieuwbouwproject',
                      'Kot',
                      'Garage',
                      'Kantoor',
                      'Handelszaak',
                      'Industrie',
                      'Grond',
                      'Opbrengsteigendom',
                      'Andere',
                    ].map((typeOption) => (
                      <button
                        key={typeOption}
                        type="button"
                        onClick={() => {
                          setPropertyType(typeOption)
                          setOpenFilter(null)
                          setSubmittedSearchKey((current) => current + 1)
                        }}
                        className={`block w-full px-6 py-3 text-left text-lg font-black transition ${
                          propertyType === typeOption
                            ? 'bg-blue-700 text-white'
                            : 'text-[#071B4D] hover:bg-blue-50 hover:text-blue-700'
                        }`}
                      >
                        {typeOption}
                      </button>
                    ))}

                    <button
                      type="button"
                      onClick={() => {
                        setPropertyType('')
                        setOpenFilter(null)
                        setSubmittedSearchKey((current) => current + 1)
                      }}
                      className="mt-2 block w-full border-t border-gray-100 px-6 py-3 text-left text-lg font-black text-blue-700 transition hover:bg-blue-50"
                    >
                      Wissen
                    </button>
                  </div>
                )}
              </div>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setOpenFilter(openFilter === 'offered' ? null : 'offered')}
                  className={`flex h-14 w-full items-center justify-between rounded-2xl border px-5 text-left font-bold transition ${
                    openFilter === 'offered'
                      ? 'border-blue-400 bg-blue-50 text-blue-700'
                      : 'border-gray-200 bg-white text-[#071B4D] hover:border-blue-300 hover:bg-blue-50'
                  }`}
                >
                  <span className="flex items-center gap-2 truncate">
                    <span>◇</span>
                    <span className="truncate">
                      {offeredSince
                        ? offeredSince === '0'
                          ? 'Vandaag'
                          : `${offeredSince} dagen`
                        : 'Aangeboden'}
                    </span>
                  </span>
                  <span className={`text-blue-700 transition ${openFilter === 'offered' ? 'rotate-180' : ''}`}>
                    ⌄
                  </span>
                </button>

                {openFilter === 'offered' && (
                  <div className="absolute left-0 top-[calc(100%+0.75rem)] z-50 w-[390px] rounded-[1.5rem] border border-gray-100 bg-white p-6 shadow-[0_24px_70px_rgba(15,23,42,0.18)]">
                    <p className="text-xl font-black text-[#071B4D]">Aangeboden</p>

                    <div className="mt-5 space-y-3">
                      {[
                        { label: 'Geen voorkeur', value: '' },
                        { label: 'Vandaag', value: '0' },
                        { label: '3 dagen', value: '3' },
                        { label: '5 dagen', value: '5' },
                        { label: '10 dagen', value: '10' },
                        { label: '30 dagen', value: '30' },
                      ].map((option) => (
                        <button
                          key={option.label}
                          type="button"
                          onClick={() => {
                            setOfferedSince(option.value)
                            setOpenFilter(null)
                            setSubmittedSearchKey((current) => current + 1)
                          }}
                          className="flex w-full items-center justify-between rounded-xl px-1 py-1.5 text-left transition hover:bg-blue-50"
                        >
                          <span className="flex items-center gap-4 text-lg font-bold text-[#111827]">
                            <span
                              className={`grid h-8 w-8 place-items-center rounded-full border-2 ${
                                offeredSince === option.value
                                  ? 'border-blue-700'
                                  : 'border-blue-600'
                              }`}
                            >
                              {offeredSince === option.value && (
                                <span className="h-4 w-4 rounded-full bg-blue-700" />
                              )}
                            </span>
                            {option.label}
                          </span>

                        </button>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setOfferedSince('')
                        setOpenFilter(null)
                        setSubmittedSearchKey((current) => current + 1)
                      }}
                      className="mt-6 text-lg font-bold text-blue-700 hover:text-blue-900"
                    >
                      Wissen
                    </button>
                  </div>
                )}
              </div>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setOpenFilter(openFilter === 'area' ? null : 'area')}
                  className={`flex h-14 w-full items-center justify-between rounded-2xl border px-5 text-left font-bold transition ${
                    openFilter === 'area'
                      ? 'border-blue-400 bg-blue-50 text-blue-700'
                      : 'border-gray-200 bg-white text-[#071B4D] hover:border-blue-300 hover:bg-blue-50'
                  }`}
                >
                  <span className="flex items-center gap-2 truncate">
                    <span>↔</span>
                    <span className="truncate">
                      {minLivingArea || maxLivingArea
                        ? `${minLivingArea || '0'} - ${maxLivingArea || 'Geen max'} m²`
                        : 'Woonopp.'}
                    </span>
                  </span>
                  <span className={`text-blue-700 transition ${openFilter === 'area' ? 'rotate-180' : ''}`}>
                    ⌄
                  </span>
                </button>

                {openFilter === 'area' && (
                  <div className="absolute left-0 top-[calc(100%+0.75rem)] z-50 w-[430px] rounded-[1.5rem] border border-gray-100 bg-white p-6 shadow-[0_24px_70px_rgba(15,23,42,0.18)]">
                    <p className="text-xl font-black text-[#071B4D]">Woonoppervlakte</p>

                    <div className="mt-5 grid grid-cols-2 gap-4">
                      <div className="relative">
                        <input
                          placeholder="Van 0"
                          value={minLivingArea}
                          onChange={(e) => setMinLivingArea(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSearchSubmit(e)
                          }}
                          className="h-14 w-full rounded-xl border border-gray-300 bg-white px-4 pr-12 text-lg font-bold text-[#071B4D] outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                        />
                        <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-lg font-black text-gray-400">
                          m²
                        </span>
                      </div>

                      <div className="relative">
                        <input
                          placeholder="Tot geen max"
                          value={maxLivingArea}
                          onChange={(e) => setMaxLivingArea(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSearchSubmit(e)
                          }}
                          className="h-14 w-full rounded-xl border border-gray-300 bg-white px-4 pr-12 text-lg font-bold text-[#071B4D] outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                        />
                        <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-lg font-black text-gray-400">
                          m²
                        </span>
                      </div>
                    </div>

                    <div className="mt-6 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => {
                          setMinLivingArea('')
                          setMaxLivingArea('')
                          setOpenFilter(null)
                          setSubmittedSearchKey((current) => current + 1)
                        }}
                        className="text-lg font-bold text-blue-700 hover:text-blue-900"
                      >
                        Wissen
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          handleSearchSubmit()
                          setOpenFilter(null)
                        }}
                        className="rounded-xl bg-blue-700 px-5 py-3 font-black text-white shadow-lg shadow-blue-700/20 transition hover:bg-blue-800"
                      >
                        Toepassen
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setOpenFilter(openFilter === 'bedrooms' ? null : 'bedrooms')}
                  className={`flex h-14 w-full items-center justify-between rounded-2xl border px-5 text-left font-bold transition ${
                    openFilter === 'bedrooms'
                      ? 'border-blue-400 bg-blue-50 text-blue-700'
                      : 'border-gray-200 bg-white text-[#071B4D] hover:border-blue-300 hover:bg-blue-50'
                  }`}
                >
                  <span className="flex items-center gap-2 truncate">
                    <span>▤</span>
                    <span className="truncate">
                      {minBedrooms || maxBedrooms
                        ? `${minBedrooms || '0'} - ${maxBedrooms || 'Geen max'} slp.`
                        : 'Slaapkamers'}
                    </span>
                  </span>
                  <span className={`text-blue-700 transition ${openFilter === 'bedrooms' ? 'rotate-180' : ''}`}>
                    ⌄
                  </span>
                </button>

                {openFilter === 'bedrooms' && (
                  <div className="absolute left-0 top-[calc(100%+0.75rem)] z-50 w-[390px] rounded-[1.5rem] border border-gray-100 bg-white p-6 shadow-[0_24px_70px_rgba(15,23,42,0.18)]">
                    <p className="text-xl font-black text-[#071B4D]">Slaapkamers</p>

                    <div className="mt-5 grid grid-cols-2 gap-4">
                      <input
                        placeholder="Van"
                        value={minBedrooms}
                        onChange={(e) => setMinBedrooms(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSearchSubmit(e)
                        }}
                        className="h-14 rounded-xl border border-gray-300 bg-white px-4 text-lg font-bold text-[#071B4D] outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                      />

                      <input
                        placeholder="Tot"
                        value={maxBedrooms}
                        onChange={(e) => setMaxBedrooms(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSearchSubmit(e)
                        }}
                        className="h-14 rounded-xl border border-gray-300 bg-white px-4 text-lg font-bold text-[#071B4D] outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                      />
                    </div>

                    <div className="mt-6 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => {
                          setMinBedrooms('')
                          setMaxBedrooms('')
                        }}
                        className="text-lg font-bold text-blue-700 hover:text-blue-900"
                      >
                        Wissen
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSearchSubmit()}
                        className="rounded-xl bg-blue-700 px-5 py-3 font-black text-white shadow-lg shadow-blue-700/20 transition hover:bg-blue-800"
                      >
                        Toepassen
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => setShowAllFilters(true)}
                className="flex h-14 items-center justify-center gap-3 rounded-2xl bg-[#0879BD] px-5 font-black text-white shadow-lg shadow-sky-700/20 transition hover:bg-[#066da9]"
              >
                <span className="text-xl">☷</span>
                Alle filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
              </button>
      {showAllFilters && (
        <div className="fixed inset-0 z-[100] flex items-start justify-end bg-black/35 p-4 backdrop-blur-sm md:p-8">
          <div className="flex h-[88vh] w-full max-w-[680px] flex-col overflow-hidden rounded-[2rem] bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
              <h2 className="text-2xl font-black text-gray-700">Filters</h2>

              <button
                type="button"
                onClick={() => setShowAllFilters(false)}
                className="text-xl font-bold text-blue-700 hover:text-blue-900"
              >
                Sluiten
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 pb-44 pt-5">
              {!isRentPage && (
                <FilterSection title="Aanbodtype">
                  <RadioRow
                    label="Koop"
                    active={offerType === 'Koop'}
                    onClick={() => {
                      if (!isRentPage) setOfferType('Koop')
                    }}
                  />
                  <RadioRow
                    label="Huur"
                    active={offerType === 'Huur'}
                    onClick={() => router.push('/huren')}
                  />
                </FilterSection>
              )}

              <FilterSection title={isRentPage ? 'Huurprijs per maand' : 'Prijs'}>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <input
                    placeholder={isRentPage ? 'Van € 0 / maand' : 'Van € 0'}
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    className="h-16 rounded-xl border border-gray-300 px-4 text-lg font-bold outline-none focus:border-blue-600"
                  />
                  <input
                    placeholder={isRentPage ? 'Tot € Geen max / maand' : 'Tot € Geen max'}
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    className="h-16 rounded-xl border border-gray-300 px-4 text-lg font-bold outline-none focus:border-blue-600"
                  />
                </div>
              </FilterSection>

              {!isRentPage && (
                <>
                  <FilterSection title="Type">
                    {(showMoreTypes ? allPropertyTypeOptions : allPropertyTypeOptions.slice(0, 5)).map((typeOption) => (
                      <CheckboxRow
                        key={typeOption.value}
                        label={typeOption.label}
                        active={propertyType === typeOption.value}
                        onClick={() =>
                          setPropertyType(propertyType === typeOption.value ? '' : typeOption.value)
                        }
                      />
                    ))}

                    <button
                      type="button"
                      onClick={() => setShowMoreTypes(!showMoreTypes)}
                      className="pt-1 text-lg font-bold text-blue-700 transition hover:text-blue-900"
                    >
                      {showMoreTypes ? 'Toon minder' : `Toon meer (${allPropertyTypeOptions.length - 5})`}
                    </button>
                  </FilterSection>

                  <FilterSection title="Soort bouw">
                    <CheckboxRow
                      label="Nieuwbouw"
                      active={selectedExtraFilters.includes('Nieuwbouw')}
                      onClick={() => toggleExtraFilter('Nieuwbouw')}
                    />
                    <CheckboxRow
                      label="Bestaande bouw"
                      active={selectedExtraFilters.includes('Bestaande bouw')}
                      onClick={() => toggleExtraFilter('Bestaande bouw')}
                    />
                  </FilterSection>
                </>
              )}

              <FilterSection title="Aangeboden">
                <RadioRow label="Geen voorkeur" active={offeredSince === ''} onClick={() => setOfferedSince('')} />
                <RadioRow label="Vandaag" active={offeredSince === '0'} onClick={() => setOfferedSince('0')} />
                <RadioRow label="3 dagen" active={offeredSince === '3'} onClick={() => setOfferedSince('3')} />
                <RadioRow label="5 dagen" active={offeredSince === '5'} onClick={() => setOfferedSince('5')} />
                <RadioRow label="10 dagen" active={offeredSince === '10'} onClick={() => setOfferedSince('10')} />
                <RadioRow label="30 dagen" active={offeredSince === '30'} onClick={() => setOfferedSince('30')} />
              </FilterSection>

              <FilterSection title="Beschikbaarheid">
                <CheckboxRow
                  label="Beschikbaar"
                  active={selectedExtraFilters.includes('Beschikbaar')}
                  onClick={() => toggleExtraFilter('Beschikbaar')}
                />
                {!isRentPage && (
                  <>
                    <CheckboxRow
                      label="In onderhandeling"
                      active={selectedExtraFilters.includes('In onderhandeling')}
                      onClick={() => toggleExtraFilter('In onderhandeling')}
                    />
                    <CheckboxRow
                      label="Verkocht"
                      active={selectedExtraFilters.includes('Verkocht')}
                      onClick={() => toggleExtraFilter('Verkocht')}
                    />
                  </>
                )}
              </FilterSection>

              <FilterSection title="Woonoppervlakte">
                <AreaInputs
                  minValue={minLivingArea}
                  maxValue={maxLivingArea}
                  onMinChange={setMinLivingArea}
                  onMaxChange={setMaxLivingArea}
                />
              </FilterSection>

              {!isRentPage && (
                <FilterSection title="Perceeloppervlakte">
                  <AreaInputs
                    minValue={minPlotArea}
                    maxValue={maxPlotArea}
                    onMinChange={setMinPlotArea}
                    onMaxChange={setMaxPlotArea}
                  />
                </FilterSection>
              )}

              <FilterSection title="Kamers">
                <RangeInputs
                  minValue={minRooms}
                  maxValue={maxRooms}
                  onMinChange={setMinRooms}
                  onMaxChange={setMaxRooms}
                />
              </FilterSection>

              <FilterSection title="Slaapkamers">
                <RangeInputs
                  minValue={minBedrooms}
                  maxValue={maxBedrooms}
                  onMinChange={setMinBedrooms}
                  onMaxChange={setMaxBedrooms}
                />
              </FilterSection>

              <FilterSection title="Badkamers">
                <RangeInputs
                  minValue={minBathrooms}
                  maxValue={maxBathrooms}
                  onMinChange={setMinBathrooms}
                  onMaxChange={setMaxBathrooms}
                />
              </FilterSection>

              <FilterSection title="Zoek op trefwoord">
                <div className="flex gap-4">
                  <input
                    placeholder="Bijv. warmtepomp"
                    value={keywordFilter}
                    onChange={(e) => setKeywordFilter(e.target.value)}
                    className="h-16 flex-1 rounded-xl border border-gray-300 px-4 text-lg font-bold outline-none focus:border-blue-600"
                  />
                  <button
                    type="button"
                    onClick={() => handleSearchSubmit()}
                    className="rounded-xl border-2 border-blue-700 bg-blue-50 px-6 text-lg font-black text-blue-700"
                  >
                    Voeg toe
                  </button>
                </div>
              </FilterSection>

              <FilterSection title="Energielabel">
                {(showMoreEnergyLabels ? allEnergyLabelOptions : allEnergyLabelOptions.slice(0, 6)).map((label) => (
                  <CheckboxRow
                    key={label}
                    label={label}
                    active={selectedExtraFilters.includes(label)}
                    onClick={() => toggleExtraFilter(label)}
                  />
                ))}

                <button
                  type="button"
                  onClick={() => setShowMoreEnergyLabels(!showMoreEnergyLabels)}
                  className="pt-1 text-lg font-bold text-blue-700 transition hover:text-blue-900"
                >
                  {showMoreEnergyLabels ? 'Toon minder' : `Toon meer (${allEnergyLabelOptions.length - 6})`}
                </button>
              </FilterSection>

              <FilterSection title="Buitenruimte">
                <CheckboxRow
                  label="Balkon"
                  active={selectedExtraFilters.includes('Balkon')}
                  onClick={() => toggleExtraFilter('Balkon')}
                />
                {!isRentPage && (
                  <CheckboxRow
                    label="Dakterras"
                    active={selectedExtraFilters.includes('Dakterras')}
                    onClick={() => toggleExtraFilter('Dakterras')}
                  />
                )}
                <CheckboxRow
                  label="Tuin"
                  active={selectedExtraFilters.includes('Tuin')}
                  onClick={() => toggleExtraFilter('Tuin')}
                />
                {isRentPage && (
                  <CheckboxRow
                    label="Terras"
                    active={selectedExtraFilters.includes('Terras')}
                    onClick={() => toggleExtraFilter('Terras')}
                  />
                )}
              </FilterSection>

              {!isRentPage && (
                <>
                  <FilterSection title="Tuinligging">
                    {['Noord', 'Oost', 'Zuid', 'West'].map((label) => (
                      <CheckboxRow key={label} label={label} active={selectedExtraFilters.includes(label)} onClick={() => toggleExtraFilter(label)} />
                    ))}
                  </FilterSection>

                  <FilterSection title="Bestemming">
                    <CheckboxRow
                      label="Recreatiewoning"
                      active={selectedExtraFilters.includes('Recreatiewoning')}
                      onClick={() => toggleExtraFilter('Recreatiewoning')}
                    />
                    <CheckboxRow
                      label="Permanente bewoning"
                      active={selectedExtraFilters.includes('Permanente bewoning')}
                      onClick={() => toggleExtraFilter('Permanente bewoning')}
                    />
                  </FilterSection>

                  <FilterSection title="Bouwperiode">
                    {(showMoreBuildPeriods ? allBuildPeriodOptions : allBuildPeriodOptions.slice(0, 6)).map((period) => (
                      <CheckboxRow
                        key={period}
                        label={period}
                        active={selectedExtraFilters.includes(period)}
                        onClick={() => toggleExtraFilter(period)}
                      />
                    ))}

                    <button
                      type="button"
                      onClick={() => setShowMoreBuildPeriods(!showMoreBuildPeriods)}
                      className="pt-1 text-lg font-bold text-blue-700 transition hover:text-blue-900"
                    >
                      {showMoreBuildPeriods ? 'Toon minder' : `Toon meer (${allBuildPeriodOptions.length - 6})`}
                    </button>
                  </FilterSection>
                </>
              )}

              <FilterSection title="Ligging">
                {(showMoreLocations
                  ? [
                      'In woonwijk',
                      'Aan rustige weg',
                      'Centrum',
                      'Nabij openbaar vervoer',
                      'Kindvriendelijke buurt',
                      'Aan park',
                      'Aan water',
                      'Vrij uitzicht',
                      'Nabij station',
                      'Bosrijke omgeving',
                      'Doodlopende straat',
                      'Landelijk gelegen',
                      'Aan drukke weg',
                      'Aan bosrand',
                    ]
                  : [
                      'In woonwijk',
                      'Aan rustige weg',
                      'Centrum',
                      'Nabij openbaar vervoer',
                      'Kindvriendelijke buurt',
                      'Aan park',
                    ]).map((label) => (
                  <CheckboxRow
                    key={label}
                    label={label}
                    active={selectedExtraFilters.includes(label)}
                    onClick={() => toggleExtraFilter(label)}
                  />
                ))}

                <button
                  type="button"
                  onClick={() => setShowMoreLocations(!showMoreLocations)}
                  className="pt-1 text-lg font-bold text-blue-700 transition hover:text-blue-900"
                >
                  {showMoreLocations ? 'Toon minder' : 'Toon meer (8)'}
                </button>
              </FilterSection>

              <FilterSection title="Parkeergelegenheid">
                {(showMoreParkingOptions
                  ? [
                      'Op eigen terrein',
                      'Op afgesloten terrein',
                      'Openbaar parkeren',
                      'Betaald parkeren',
                      'Parkeergarage',
                      'Parkeervergunningen',
                    ]
                  : [
                      'Op eigen terrein',
                      'Op afgesloten terrein',
                      'Openbaar parkeren',
                      'Betaald parkeren',
                    ]).map((label) => (
                  <CheckboxRow
                    key={label}
                    label={label}
                    active={selectedExtraFilters.includes(label)}
                    onClick={() => toggleExtraFilter(label)}
                  />
                ))}

                <button
                  type="button"
                  onClick={() => setShowMoreParkingOptions(!showMoreParkingOptions)}
                  className="pt-1 text-lg font-bold text-blue-700 transition hover:text-blue-900"
                >
                  {showMoreParkingOptions ? 'Toon minder' : 'Toon meer (2)'}
                </button>
              </FilterSection>

              {!isRentPage && (
                <FilterSection title="Garage">
                  {(showMoreGarageOptions
                    ? [
                        'Aangebouwde garage',
                        'Garagebox',
                        'Garage + carport',
                        'Inpandige garage',
                        'Parkeerkelder',
                        'Souterrain',
                        'Vrijstaande garage',
                        'Garage mogelijk',
                        'Carport',
                        'Parkeerplaats',
                        'Elk soort garage',
                      ]
                    : [
                        'Aangebouwde garage',
                        'Garagebox',
                        'Garage + carport',
                        'Inpandige garage',
                        'Parkeerkelder',
                        'Souterrain',
                      ]).map((label) => (
                    <CheckboxRow
                      key={label}
                      label={label}
                      active={selectedExtraFilters.includes(label)}
                      onClick={() => toggleExtraFilter(label)}
                    />
                  ))}

                  <button
                    type="button"
                    onClick={() => setShowMoreGarageOptions(!showMoreGarageOptions)}
                    className="pt-1 text-lg font-bold text-blue-700 transition hover:text-blue-900"
                  >
                    {showMoreGarageOptions ? 'Toon minder' : 'Toon meer (5)'}
                  </button>
                </FilterSection>
              )}

              <FilterSection title="Toegankelijkheid">
                {(showMoreAccessibilityOptions
                  ? [
                      'Lift aanwezig',
                      'Enkele woonlaag',
                      'Voor mensen met een beperking',
                      'Voor ouderen',
                      'Aangepaste woning',
                      'Op de begane grond',
                    ]
                  : [
                      'Lift aanwezig',
                      'Enkele woonlaag',
                      'Voor mensen met een beperking',
                      'Voor ouderen',
                    ]).map((label) => (
                  <CheckboxRow
                    key={label}
                    label={label}
                    active={selectedExtraFilters.includes(label)}
                    onClick={() => toggleExtraFilter(label)}
                  />
                ))}

                <button
                  type="button"
                  onClick={() => setShowMoreAccessibilityOptions(!showMoreAccessibilityOptions)}
                  className="pt-1 text-lg font-bold text-blue-700 transition hover:text-blue-900"
                >
                  {showMoreAccessibilityOptions ? 'Toon minder' : 'Toon meer (2)'}
                </button>
              </FilterSection>

              <FilterSection title="Eigenschappen">
                {(isRentPage
                  ? [
                      'Gemeubeld',
                      'Lift aanwezig',
                      'Balkon',
                      'Tuin',
                      'Terras',
                      'Huisdieren toegestaan',
                      'Energiezuinig',
                    ]
                  : showMoreFeatureOptions
                    ? [
                        'Duurzame energie',
                        'CV-ketel',
                        'Zwembad',
                        'Lig-/zitbad',
                        'Open haard',
                        'Kluswoning',
                        'Dubbele bewoning',
                      ]
                    : [
                        'Duurzame energie',
                        'CV-ketel',
                        'Zwembad',
                        'Lig-/zitbad',
                      ]).map((label) => (
                  <CheckboxRow
                    key={label}
                    label={label}
                    active={selectedExtraFilters.includes(label)}
                    onClick={() => toggleExtraFilter(label)}
                  />
                ))}

                {!isRentPage && (
                  <button
                    type="button"
                    onClick={() => setShowMoreFeatureOptions(!showMoreFeatureOptions)}
                    className="pt-1 text-lg font-bold text-blue-700 transition hover:text-blue-900"
                  >
                    {showMoreFeatureOptions ? 'Toon minder' : 'Toon meer (3)'}
                  </button>
                )}
              </FilterSection>

              {!isRentPage && (
                <>
                  <FilterSection title="Weergave">
                    <CheckboxRow
                      label="Woningen"
                      active={showWoningen}
                      onClick={() => setShowWoningen(!showWoningen)}
                    />
                    <CheckboxRow
                      label="Projecten"
                      active={selectedExtraFilters.includes('Projecten')}
                      onClick={() => toggleExtraFilter('Projecten')}
                    />
                  </FilterSection>

                  <FilterSection title="Open huis">
                    {['Alle open huizen', 'Open huis komend weekend', 'Open huis vandaag'].map((label) => (
                      <CheckboxRow key={label} label={label} active={selectedExtraFilters.includes(label)} onClick={() => toggleExtraFilter(label)} />
                    ))}
                  </FilterSection>
                </>
              )}

              <div className="overflow-hidden rounded-[2rem] border border-blue-100 bg-white shadow-[0_22px_70px_rgba(15,23,42,0.10)]">
                <div className="flex flex-col gap-5 border-b border-gray-100 bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-6 md:flex-row md:items-center">
                  <div className="grid h-20 w-20 shrink-0 place-items-center rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-xl shadow-blue-700/20">
                    <div className="relative text-4xl leading-none">
                      ✦
                      <span className="absolute -bottom-2 -right-4 rounded-md border border-white/40 bg-blue-700 px-1.5 py-0.5 text-xs font-black">
                        AI
                      </span>
                    </div>
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-3xl font-black text-[#111827]">Slimmo</h3>
                      <span className="rounded-full bg-indigo-100 px-3 py-1 text-sm font-black text-indigo-700">
                        Beta
                      </span>
                    </div>

                    <p className="mt-2 text-lg font-semibold text-gray-600">
                      Onze AI helpt je sneller de juiste woningen te vinden.
                    </p>
                  </div>
                </div>

                <div className="p-6">
                  <label className="text-xl font-black text-[#111827]">
                    Beschrijf wat je zoekt
                  </label>

                  <div className="relative mt-4">
                    <textarea
                      value={slimmoPrompt}
                      onChange={(e) => setSlimmoPrompt(e.target.value.slice(0, 300))}
                      placeholder={
                        isRentPage
                          ? 'Bijvoorbeeld: een gemeubeld appartement in Gent, max €1.200 per maand'
                          : 'Bijvoorbeeld: een moderne woning met tuin in Gent, max €500.000'
                      }
                      className="h-44 w-full resize-none rounded-2xl border-2 border-blue-600 bg-white p-5 pr-20 text-lg font-semibold text-[#111827] outline-none transition placeholder:text-gray-400 focus:ring-4 focus:ring-blue-100"
                    />
                    <span className="absolute bottom-4 right-5 text-sm font-bold text-gray-400">
                      {slimmoPrompt.length} / 300
                    </span>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-3">
                    {(isRentPage
                      ? [
                          'Gemeubeld appartement',
                          'Appartement in centrum',
                          'Max €1.200 per maand',
                          'Huisdieren toegestaan',
                          'Rustige buurt',
                          'Nabij openbaar vervoer',
                        ]
                      : [
                          'Gezinswoning met tuin',
                          'Appartement in centrum',
                          'Duurzaam en energiezuinig',
                          'Nieuwbouw project',
                          'Rustige buurt',
                          'Nabij openbaar vervoer',
                        ]).map((suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        onClick={() => setSlimmoPrompt(suggestion)}
                        className="rounded-full border border-blue-100 bg-white px-5 py-3 text-sm font-black text-blue-700 shadow-sm transition hover:border-blue-300 hover:bg-blue-50"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={handleSlimmoSearch}
                    className="mt-6 flex h-16 w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-blue-700 to-indigo-800 text-xl font-black text-white shadow-xl shadow-blue-700/20 transition hover:from-blue-800 hover:to-indigo-900"
                  >
                    ✧ Slimmo zoeken
                  </button>

                  <p className="mt-4 text-center text-sm font-semibold text-gray-500">
                    🔒 Slimmo gebruikt AI om je zoekopdracht te begrijpen.
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 bg-white px-5 py-4 shadow-[0_-12px_30px_rgba(15,23,42,0.08)]">
              <div className="mb-3 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    setMinPrice('')
                    setMaxPrice('')
                    setPropertyType('')
                    setOfferedSince('')
                    setMinLivingArea('')
                    setMaxLivingArea('')
                    setMinBedrooms('')
                    setMaxBedrooms('')
                    setMinBathrooms('')
                    setMaxBathrooms('')
                    setMinRooms('')
                    setMaxRooms('')
                    setMinPlotArea('')
                    setMaxPlotArea('')
                    setKeywordFilter('')
                    setSelectedExtraFilters([])
                    setShowWoningen(true)
                    setSubmittedSearchKey((current) => current + 1)
                  }}
                  className="text-lg font-black text-blue-700 transition hover:text-blue-900"
                >
                  Wissen
                </button>

                <span className="text-sm font-bold text-gray-400">
                  Filters resetten
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowAllFilters(false)
                  handleSearchSubmit()
                }}
                className="h-14 w-full rounded-xl bg-[#0879BD] text-lg font-black text-white transition hover:bg-[#066da9]"
              >
                Toon {filteredProperties.length} {isRentPage ? 'huurwoningen' : 'resultaten'}
              </button>
            </div>
          </div>
        </div>
      )}
            </div>
          </div>
        </div>

        <div className={showMap ? 'grid gap-8 xl:grid-cols-[0.92fr_1.08fr]' : 'grid grid-cols-1'}>
        {showMap && (
          <aside className="order-1 xl:order-2">
          <div className="self-start rounded-[2rem] border border-blue-100 bg-white p-4 shadow-[0_20px_60px_rgba(15,23,42,0.10)] md:p-5 xl:sticky xl:top-24">
              {/* MAP + INSIGHTS LAYOUT START */}
              <div className="grid grid-cols-1 items-start gap-5">
                <div>
                  <div className="mb-4 flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-3">
                        <h2 className="text-2xl font-black text-[#071B4D]">
                          Bekijk woningen op kaart
                        </h2>

                        <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">
                          {visibleMapLocationCount} {visibleMapLocationCount === 1 ? 'locatie' : 'locaties'} op kaart
                        </span>
                      </div>

                      <p className="mt-1 text-sm text-gray-500">
                        Interactieve kaart met alle beschikbare woningen.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => setShowMap(!showMap)}
                        className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-5 py-3 text-sm font-bold text-[#111827] shadow-sm transition hover:bg-gray-50"
                      >
                        {showMap ? 'Kaart verbergen' : 'Kaart tonen'}

                        <span className={`transition ${showMap ? 'rotate-180' : ''}`}>
                          ↑
                        </span>
                      </button>
                    </div>
                  </div>

                  <div className="overflow-hidden rounded-[1.75rem] border border-gray-100">
                    <div className="h-[420px] w-full xl:h-[620px]">
                    {!isLoaded && (
                      <div className="flex h-full items-center justify-center text-xl font-bold">
                        Kaart laden...
                      </div>
                    )}

                    {isLoaded && (
                      <GoogleMap
                        key={mapKey || 'empty-map'}
                        mapContainerStyle={{
                          width: '100%',
                          height: '100%',
                        }}
                        center={center}
                        zoom={11}
                        onLoad={(map) => {
                          setMapInstance(map)
                        }}
                        options={{
                          fullscreenControl: true,
                          streetViewControl: false,
                          mapTypeControl: false,
                        }}
                        onClick={() => setSelectedMapProperty(null)}
                      >
                        {filteredPropertiesWithLocation.map((property) => (
                          <Marker
                            key={property.id}
                            position={{
                              lat: Number(property.latitude),
                              lng: Number(property.longitude),
                            }}
                            icon={houseMarkerIcon()}
                            label={{
                              text: '⌂',
                              color: '#ffffff',
                              fontSize: '22px',
                              fontWeight: '900',
                            }}
                            zIndex={999}
                            onClick={() => setSelectedMapProperty(property)}
                          />
                        ))}

                        {selectedMapProperty && (
                          <InfoWindow
                            position={{
                              lat: Number(selectedMapProperty.latitude),
                              lng: Number(selectedMapProperty.longitude),
                            }}
                            onCloseClick={() => setSelectedMapProperty(null)}
                          >
                            <div className="w-[240px] overflow-hidden rounded-2xl bg-white text-[#111827]">
                              {selectedMapProperty.image && (
                                <img
                                  src={selectedMapProperty.image}
                                  alt={selectedMapProperty.title}
                                  className="mb-3 h-32 w-full rounded-xl object-cover"
                                />
                              )}

                              <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-700">
                                {selectedMapProperty.city || 'SlimWoning'}
                              </p>

                              <h3 className="mt-1 text-lg font-bold">
                                {selectedMapProperty.title}
                              </h3>

                              <p className="mt-2 text-xl font-bold text-blue-700">
                                {formatPrice(selectedMapProperty.price)}
                              </p>

                              <button
                                onClick={() => router.push(`/properties/${selectedMapProperty.id}`)}
                                className="mt-4 w-full rounded-xl bg-[#0B1F4D] px-4 py-3 text-sm font-bold text-white"
                              >
                                Bekijk woning
                              </button>
                            </div>
                          </InfoWindow>
                        )}
                      </GoogleMap>
                    )}
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => discoverNearbyListings(5000)}
                      disabled={loadingNearby}
                      className="group rounded-2xl border border-blue-100 bg-[#071B4D] px-4 py-3 text-left text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#0B2A6B] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-black">Binnen 5 km</p>
                          <p className="mt-0.5 truncate text-xs font-bold text-blue-100">
                            Woningen dichtbij jou
                          </p>
                        </div>
                        <span className="text-lg transition group-hover:translate-x-0.5">→</span>
                      </div>
                    </button>

                    <div className="rounded-2xl border border-blue-100 bg-blue-50/70 px-4 py-3">
                      <button
                        type="button"
                        onClick={() => setShowRadiusPicker((current) => !current)}
                        className="flex w-full items-center justify-between gap-3 text-left"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-black text-[#071B4D]">Zoekstraal instellen</p>
                          <p className="mt-0.5 truncate text-xs font-bold text-gray-500">
                            Kies afstand
                          </p>
                        </div>
                        <span className="text-lg font-black text-blue-700">
                          {showRadiusPicker ? '−' : '+'}
                        </span>
                      </button>

                      {showRadiusPicker && (
                        <>
                          <div className="mt-3 grid grid-cols-2 gap-2">
                            {[
                              { label: '5 km', value: 5000 },
                              { label: '10 km', value: 10000 },
                              { label: '25 km', value: 25000 },
                              { label: '50 km', value: 50000 },
                              { label: '100 km', value: 100000 },
                            ].map((option) => (
                              <button
                                key={option.value}
                                type="button"
                                onClick={() => {
                                  setShowRadiusPicker(false)
                                  discoverNearbyListings(option.value)
                                }}
                                disabled={loadingNearby}
                                className="rounded-xl border border-blue-100 bg-white px-2 py-2 text-xs font-black text-[#071B4D] shadow-sm transition hover:border-blue-400 hover:bg-blue-700 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {option.label}
                              </button>
                            ))}
                            <button
                              type="button"
                              onClick={() => setShowCustomRadiusInput((current) => !current)}
                              className="rounded-xl border border-blue-100 bg-white px-2 py-2 text-xs font-black text-[#071B4D] shadow-sm transition hover:border-blue-400 hover:bg-blue-700 hover:text-white"
                            >
                              Eigen straal
                            </button>
                          </div>

                          {showCustomRadiusInput && (
                            <div className="mt-3 rounded-2xl border border-blue-100 bg-white p-2">
                              <div className="flex gap-2">
                                <input
                                  type="number"
                                  min="1"
                                  value={customRadiusKm}
                                  onChange={(e) => setCustomRadiusKm(e.target.value)}
                                  placeholder="Aantal km"
                                  className="min-w-0 flex-1 rounded-xl border border-blue-100 px-2 py-2 text-xs font-black text-[#071B4D] outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                                />

                                <button
                                  type="button"
                                  onClick={() => {
                                    const radiusKm = Number(customRadiusKm)

                                    if (!radiusKm || radiusKm <= 0) return

                                    setShowRadiusPicker(false)
                                    setShowCustomRadiusInput(false)
                                    discoverNearbyListings(radiusKm * 1000)
                                  }}
                                  className="rounded-xl bg-[#071B4D] px-3 py-2 text-xs font-black text-white shadow-sm transition hover:bg-blue-800"
                                >
                                  Zoeken
                                </button>
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setNearbyMode(false)
                        setNearbyIds([])
                        setNearbyError('')
                        setShowRadiusPicker(false)
                        setShowCustomRadiusInput(false)
                        setSelectedMapProperty(null)
                      }}
                      className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50 hover:shadow-md"
                    >
                      <p className="truncate text-sm font-black text-[#071B4D]">
                        Terug naar overzicht
                      </p>
                      <p className="mt-0.5 truncate text-xs font-bold text-gray-500">
                        Standaard kaart
                      </p>
                    </button>
                  </div>

                  {nearbyError && (
                    <div className="mt-4 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-semibold text-red-700">
                      {nearbyError}
                    </div>
                  )}
                </div>
              </div>
              {/* MAP + INSIGHTS LAYOUT END */}
          </div>
          </aside>
        )}

        <section className="order-2 w-full max-w-[860px] xl:order-1">
        <div className="mb-3 flex w-[676px] max-w-full items-center justify-between rounded-2xl border border-slate-200 bg-white px-6 py-5 shadow-sm">
            <div className="min-w-0">
              <p className="text-lg font-black text-[#071B4D]">
                {filteredProperties.length} woningen gevonden
              </p>
              <p className="text-xs font-semibold text-slate-500">
                Selecteer 2 tot 4 woningen om te vergelijken
              </p>
            </div>

            <div className="flex items-center gap-2 sm:min-w-[230px]">
              <span className="shrink-0 text-xs font-black uppercase tracking-wide text-slate-400">
                Sorteer op
              </span>
              <div ref={sortDropdownRef} className="relative min-w-0 flex-1">
                <button
                  type="button"
                  onClick={() => setIsSortDropdownOpen((isOpen) => !isOpen)}
                  className="flex w-full items-center justify-between gap-3 rounded-2xl border border-blue-100 bg-white px-5 py-3 text-left text-sm font-black text-[#071B4D] shadow-sm transition hover:border-blue-200 hover:bg-[#F6F8FC] focus:outline-none focus:ring-4 focus:ring-blue-50"
                  aria-haspopup="listbox"
                  aria-expanded={isSortDropdownOpen}
                >
                  <span className="truncate">{sortOption}</span>
                  <span
                    aria-hidden="true"
                    className={`text-xs text-blue-500 transition ${
                      isSortDropdownOpen ? 'rotate-180' : ''
                    }`}
                  >
                    ▾
                  </span>
                </button>

                {isSortDropdownOpen && (
                  <div
                    className="absolute right-0 z-50 mt-2 w-full min-w-[230px] overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-xl"
                    role="listbox"
                    aria-label="Sorteer woningen"
                  >
                    {sortOptions.map((option) => {
                      const isSelected = sortOption === option

                      return (
                        <button
                          key={option}
                          type="button"
                          onClick={() => {
                            setSortOption(option)
                            setIsSortDropdownOpen(false)
                          }}
                          className={`flex w-full items-center justify-between gap-3 px-5 py-3 text-left text-sm font-black transition ${
                            isSelected
                              ? 'bg-blue-50 text-blue-700'
                              : 'text-[#071B4D] hover:bg-[#F6F8FC]'
                          }`}
                          role="option"
                          aria-selected={isSelected}
                        >
                          <span>{option}</span>
                          {isSelected && (
                            <span aria-hidden="true" className="text-blue-700">
                              ✓
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
        </div>

        <div className="mb-6 hidden flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <p className="font-bold text-gray-700">
            {filteredProperties.length} woningen gevonden
          </p>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <p className="text-sm text-gray-500">
              Selecteer 2 tot 4 woningen om te vergelijken
            </p>

            <div className="flex rounded-2xl border border-gray-200 bg-white p-1 shadow-sm">
              <button
                type="button"
                onClick={() => setViewMode('compact')}
                className={`rounded-xl px-4 py-2 text-sm font-bold transition ${
                  viewMode === 'compact'
                    ? 'bg-[#0B1F4D] text-white'
                    : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                Overzicht
              </button>
              <button
                type="button"
                onClick={() => setViewMode('large')}
                className={`rounded-xl px-4 py-2 text-sm font-bold transition ${
                  viewMode === 'large'
                    ? 'bg-[#0B1F4D] text-white'
                    : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                Spotlight
              </button>
              <button
                type="button"
                onClick={() => setViewMode('premium')}
                className={`rounded-xl px-4 py-2 text-sm font-bold transition ${
                  viewMode === 'premium'
                    ? 'bg-[#0B1F4D] text-white'
                    : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                Premium
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {sortedProperties.map((property) => {
            const isFavorite = favoriteIds.includes(Number(property.id))
            const epcLabel = String(property.epc || property.epc_code || '').trim()
            const aiScoreProperty = {
              ...property,
              ai_rank_score:
                property.ai_rank_score ??
                property.ai_score ??
                property.aiScore ??
                property.match_score ??
                property.matchScore ??
                property.rank_score ??
                property.rankScore,
            }
            const aiScore = getAiRankScore(aiScoreProperty)
            const aiLabel = getAiScoreLabel(aiScore)
            const aiScoreColor =
              aiScore >= 85
                ? {
                    ring: 'border-green-500 text-green-700',
                    label: 'bg-green-50 text-green-700',
                  }
                : aiScore >= 70
                  ? {
                      ring: 'border-blue-500 text-blue-700',
                      label: 'bg-blue-50 text-blue-700',
                    }
                  : aiScore >= 50
                    ? {
                        ring: 'border-amber-400 text-amber-700',
                        label: 'bg-amber-50 text-amber-700',
                      }
                    : {
                        ring: 'border-slate-300 text-slate-600',
                        label: 'bg-slate-100 text-slate-600',
                      }
            const rawTitle = String(property.title || '').trim()
            const cityName = String(property.city || '').trim()

            const titleWithoutCity =
              cityName && rawTitle.toLowerCase().endsWith(` in ${cityName.toLowerCase()}`)
                ? rawTitle.slice(0, rawTitle.length - (` in ${cityName}`).length).trim()
                : cityName && rawTitle.toLowerCase().endsWith(` ${cityName.toLowerCase()}`)
                  ? rawTitle.slice(0, rawTitle.length - cityName.length).trim()
                  : rawTitle

            const cleanedTitle = titleWithoutCity
              .replace(/moderne/gi, '')
              .replace(/stijlvol/gi, '')
              .replace(/luxe/gi, '')
              .replace(/nabij centrum/gi, '')
              .replace(/met tuin/gi, '')
              .replace(/met terras/gi, '')
              .replace(/instapklaar/gi, '')
              .replace(/ruim/gi, '')
              .replace(/prachtig/gi, '')
              .replace(/exclusief/gi, '')
              .replace(/energiezuinig/gi, '')
              .replace(/volledig gerenoveerd/gi, '')
              .replace(/\s+/g, ' ')
              .trim()

            const displayTitle = cleanedTitle
              ? cleanedTitle.charAt(0).toUpperCase() + cleanedTitle.slice(1)
              : titleWithoutCity
            return (
              <Link
                href={`/properties/${property.id}`}
                key={property.id}
                className="flex h-[175px] w-full max-w-[820px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
              >
                <div className="relative h-[175px] w-[250px] shrink-0 overflow-hidden">
                  {property.image ? (
                    <>
                      <img
                        src={property.image}
                        alt={property.title}
                        className="h-full w-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />
                      <BrokerLogoBadge property={property} />
                    </>
                  ) : (
                    <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-gradient-to-br from-slate-200 via-slate-300 to-slate-400">
                      <svg
                        viewBox="0 0 64 64"
                        aria-hidden="true"
                        className="h-24 w-24 text-white/80"
                        fill="none"
                      >
                        <path
                          d="M12 30L32 14L52 30"
                          stroke="currentColor"
                          strokeWidth="4"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M18 29V52H46V29"
                          stroke="currentColor"
                          strokeWidth="4"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M27 52V39H37V52"
                          stroke="currentColor"
                          strokeWidth="4"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>

                      <div className="absolute inset-0 bg-black/10" />
                    </div>
                  )}
                  {property.created_at &&
                    Date.now() - new Date(property.created_at).getTime() <
                      15 * 24 * 60 * 60 * 1000 && (
                      <div className="absolute left-4 top-4 z-10 flex items-center drop-shadow-xl">
                        <div className="relative flex h-7 items-center rounded-r-md bg-red-600 pl-7 pr-3 text-xs font-black italic leading-none text-white">
                          <span className="absolute left-[-16px] top-0 h-0 w-0 border-y-[14px] border-r-[16px] border-y-transparent border-r-red-600" />
                          <span className="absolute left-2.5 top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full border-2 border-white/90 bg-white/20" />
                          Nieuw
                        </div>
                      </div>
                    )}

                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      toggleFavorite(Number(property.id))
                    }}
                    aria-label={isFavorite ? 'Verwijder uit favorieten' : 'Voeg toe aan favorieten'}
                    className="absolute right-3 top-3 z-10 flex items-center justify-center text-3xl drop-shadow-[0_4px_10px_rgba(0,0,0,0.35)] transition hover:scale-110"
                  >
                    <span className={isFavorite ? 'text-red-500' : 'text-white'}>
                      {isFavorite ? '♥' : '♡'}
                    </span>
                  </button>

                </div>

                <div className="min-w-[330px] flex-1 px-4 py-3.5 pr-4">
                  <div className="min-w-0">
                    <h2 className="truncate text-base font-black text-[#071B4D]">
                      {displayTitle}
                    </h2>

                    <p className="mt-0.5 text-lg font-black leading-tight text-blue-700">
                      {formatPrice(property.price)}
                    </p>

                    <p className="mt-1 truncate text-xs font-semibold text-slate-500">
                      {property.address
                        ? `${property.address}, ${property.city}`
                        : property.city}
                    </p>

                    <div className="mt-2 flex items-center gap-1 overflow-hidden">
                      <Badge text={`${numberValue(property.slaapkamers || property.bedrooms) || '-'} slp.`} />
                      <Badge text={`${numberValue(property.badkamers || property.bathrooms) || '-'} badk.`} />
                      <Badge text={`${getPropertyArea(property) || '-'} m²`} />
                      {epcLabel && epcLabel !== 'EMPTY' && (
                        <div className="ml-1 flex h-6 shrink-0 overflow-hidden rounded-md shadow-sm">
                          <div className="flex items-center bg-[#1F3B57] px-2 text-[9px] font-black text-white">
                            EPC
                          </div>

                          <div
                            className="relative flex min-w-[28px] items-center justify-center px-1.5 text-[9px] font-black text-white"
                            style={{
                              backgroundColor: getEpcColor(property.epc),
                              clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%, 10% 50%)',
                              marginLeft: '-2px',
                              paddingLeft: '10px',
                            }}
                          >
                            {property.epc || '-'}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 flex w-full flex-nowrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={(event) => {
                        event.preventDefault()
                        event.stopPropagation()
                        setManualEnergyData({})
                        setOpenEnergyScanId(Number(property.id))
                      }}
                      className="shrink-0 rounded-full border border-green-200 bg-green-50 px-3.5 py-1.5 text-sm font-semibold leading-none whitespace-nowrap text-green-700 transition hover:bg-green-100"
                    >
                      Energie
                    </button>

                    <button
                      type="button"
                      onClick={(event) => {
                        event.preventDefault()
                        event.stopPropagation()
                        startRenovatiePhotoAnalysis(property)
                      }}
                      className="shrink-0 rounded-full border border-orange-200 bg-orange-50 px-3.5 py-1.5 text-sm font-semibold leading-none whitespace-nowrap text-orange-700 transition hover:bg-orange-100"
                    >
                      Renovatie
                    </button>

                    <button
                      type="button"
                      onClick={(event) => {
                        event.preventDefault()
                        event.stopPropagation()
                        toggleCompare(Number(property.id))
                      }}
                      className="shrink-0 rounded-full border border-amber-200 bg-amber-50 px-3.5 py-1.5 text-sm font-semibold leading-none whitespace-nowrap text-amber-700 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {compareIds.includes(Number(property.id)) ? 'Geselecteerd' : 'Vergelijk'}
                    </button>
                  </div>
                </div>

                <div className="flex h-fit w-[96px] shrink-0 self-center flex-col items-center justify-center border-l border-slate-200 px-1.5">
                  <button
                    type="button"
                    onClick={(event) => {
                      event.preventDefault()
                      event.stopPropagation()
                      setManualEnergyData({})
                      setOpenEnergyScanId(Number(property.id))
                    }}
                    className="group flex w-[76px] flex-col items-center rounded-2xl border border-blue-100 bg-white px-2 py-2 text-center shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md"
                    title="Bekijk Energie-overzicht"
                  >
                    <div className={`grid h-11 w-11 place-items-center rounded-full border-2 text-lg font-black ${aiScoreColor.ring}`}>
                      {aiScore > 0 ? aiScore : '-'}
                    </div>

                    <p className="mt-1 text-[11px] font-bold text-slate-700">
                      AI-score
                    </p>

                    <p className={`rounded-full px-1.5 text-[10px] font-bold ${aiScoreColor.label}`}>
                      {aiScore > 0 ? aiLabel : 'Beperkt'}
                    </p>
                  </button>

                  <div className="mt-1.5 space-y-0.5 text-center">
                    <p className="text-[9px] font-semibold text-slate-500">
                      {120 + (Number(property.id) % 80)} bekeken
                    </p>

                    <p className="text-[9px] font-semibold text-slate-500">
                      {8 + (Number(property.id) % 24)} interesse
                    </p>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
        </section>
        </div>


        {openRenovatieScanProperty && (() => {
          const renovatieHeroImage = getPropertyPrimaryImage(openRenovatieScanProperty)

          return (
            <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/45 p-3 backdrop-blur-sm sm:p-4">
              <div className="relative max-h-[90vh] w-[95vw] max-w-5xl overflow-y-auto rounded-[28px] border border-blue-100 bg-white shadow-2xl">
                <header className="relative h-[150px] overflow-hidden rounded-t-[28px] sm:h-[160px]">
                  {renovatieHeroImage ? (
                    <Image
                      src={renovatieHeroImage}
                      alt={openRenovatieScanProperty.title || 'Woning'}
                      fill
                      unoptimized
                      sizes="(min-width: 1024px) 1024px, 95vw"
                      className="scale-105 object-cover blur-sm brightness-50"
                    />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-br from-[#071B4D] via-[#12377C] to-[#F97316]" />
                  )}
                  <div
                    className="absolute inset-0"
                    style={{
                      background:
                        'linear-gradient(to bottom, rgba(7,27,77,0.35), rgba(7,27,77,0.75))',
                    }}
                  />
                  <div className="absolute inset-0 flex items-center justify-between gap-4 px-5 py-4 sm:px-7 sm:py-5">
                    <div className="min-w-0 text-white">
                      <p className="text-xs font-black uppercase tracking-[0.24em] text-orange-200">
                        Renovatie
                      </p>
                      <h3 className="mt-2 text-2xl font-black sm:text-3xl">
                        SlimWoning Renovatie Scan
                      </h3>
                      <p className="mt-2 max-w-2xl truncate text-sm font-semibold leading-6 text-white/85 sm:text-base">
                        {openRenovatieScanProperty.title || 'Staat van afwerking'}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setOpenRenovatieScanId(null)}
                      className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/15 text-xl font-black text-white shadow-sm ring-1 ring-white/25 backdrop-blur transition hover:bg-white/25"
                      aria-label="Renovatie Scan sluiten"
                    >
                      ×
                    </button>
                  </div>
                </header>

                {renderRenovatieScanOverview(openRenovatieScanProperty, {
                  showCloseButton: true,
                  onClose: () => setOpenRenovatieScanId(null),
                })}
              </div>
            </div>
          )
        })()}

        {openEnergyScanProperty && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm">
            {renderEnergyScanOverview(openEnergyScanProperty, {
              reportId: 'energy-report-content',
              onClose: () => setOpenEnergyScanId(null),
            })}
          </div>
        )}

        {compareIds.length > 0 && (
          <div className="fixed bottom-5 left-1/2 z-50 w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2 rounded-3xl bg-[#0B1F4D] p-4 text-white shadow-2xl md:p-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="font-black">{compareIds.length} woning(en) geselecteerd</p>
                <p className="text-sm text-white/70">Selecteer 2 tot 4 woningen om te vergelijken.</p>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setCompareIds([])}
                  className="rounded-2xl bg-white/10 px-4 py-3 text-sm font-black text-white transition hover:bg-white/20"
                >
                  Wissen
                </button>

                <button
                  type="button"
                  onClick={goToCompare}
                  className="rounded-2xl bg-white px-4 py-3 text-sm font-black text-[#0B1F4D] transition hover:bg-blue-50"
                >
                  Vergelijken
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function Badge({ text }: { text: string }) {
  return (
    <span className="inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-full bg-gray-100 px-2.5 py-1.5 text-[11px] font-black text-gray-700">
      {text}
    </span>
  )
}

function getEpcColor(value: any) {
  const cleanLabel = String(value || '').trim().toUpperCase()
  const epcColors: Record<string, string> = {
    'A+++++': '#0b5f2a',
    'A++++': '#0b5f2a',
    'A+++': '#0b5f2a',
    'A++': '#0f6f34',
    'A+': '#1f7a3a',
    A: '#3f9a45',
    B: '#a7cf20',
    C: '#f3df00',
    D: '#f6b428',
    E: '#f47c20',
    F: '#ef2a2a',
    G: '#c8191e',
  }

  return epcColors[cleanLabel] || '#59d000'
}

function BrokerLogoBadge({ property }: { property: any }) {
  const brokerName = property.broker_name || property.makelaar || property.agency_name
  const brokerLogo = property.broker_logo || property.makelaar_logo || property.agency_logo

  if (!brokerName && !brokerLogo) return null

  return (
    <div className="absolute bottom-4 left-4 z-10 flex max-w-[75%] items-center gap-2 rounded-2xl bg-white/90 px-3 py-2 shadow-lg backdrop-blur">
      {brokerLogo && (
        <img
          src={brokerLogo}
          alt={brokerName || 'Makelaar'}
          className="h-7 w-7 rounded-full object-cover"
        />
      )}
      <span className="truncate text-xs font-black text-[#0B1F4D]">
        {brokerName || 'Makelaar'}
      </span>
    </div>
  )
}

function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-b border-gray-200 py-5">
      <h3 className="mb-4 text-lg font-black text-gray-600">{title}</h3>
      <div className="space-y-3">{children}</div>
    </section>
  )
}

function RadioRow({
  label,
  count,
  active,
  onClick,
}: {
  label: string
  count?: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button type="button" onClick={onClick} className="flex w-full items-center justify-between text-left">
      <span className="flex items-center gap-3 text-lg font-semibold text-gray-800">
        <span className="grid h-7 w-7 place-items-center rounded-full border-2 border-[#0879BD] bg-white">
          {active && <span className="h-3.5 w-3.5 rounded-full bg-[#0879BD]" />}
        </span>
        {label}
      </span>
      {count && <span className="text-lg font-semibold text-gray-500">{count}</span>}
    </button>
  )
}

function CheckboxRow({
  label,
  count,
  active,
  onClick,
}: {
  label: string
  count?: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button type="button" onClick={onClick} className="flex w-full items-center justify-between text-left">
      <span className={`flex items-center gap-3 text-lg font-semibold ${active ? 'text-blue-700' : 'text-gray-800'}`}>
        <span className={`grid h-7 w-7 place-items-center rounded-md border-2 border-[#0879BD] ${active ? 'bg-[#0879BD] text-white' : 'bg-white text-transparent'}`}>
          ✓
        </span>
        {label}
      </span>
      {count && <span className="text-lg font-semibold text-gray-500">{count}</span>}
    </button>
  )
}

function RangeInputs({
  minValue = '',
  maxValue = '',
  onMinChange,
  onMaxChange,
}: {
  minValue?: string
  maxValue?: string
  onMinChange?: (value: string) => void
  onMaxChange?: (value: string) => void
}) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <input
        placeholder="Van 0"
        value={minValue}
        onChange={(e) => onMinChange?.(e.target.value)}
        className="h-13 rounded-xl border border-gray-300 px-4 text-base font-bold outline-none focus:border-blue-600"
      />
      <input
        placeholder="Tot Geen max"
        value={maxValue}
        onChange={(e) => onMaxChange?.(e.target.value)}
        className="h-13 rounded-xl border border-gray-300 px-4 text-base font-bold outline-none focus:border-blue-600"
      />
    </div>
  )
}

function AreaInputs({
  minValue = '',
  maxValue = '',
  onMinChange,
  onMaxChange,
}: {
  minValue?: string
  maxValue?: string
  onMinChange?: (value: string) => void
  onMaxChange?: (value: string) => void
}) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <div className="relative">
        <input
          placeholder="Van 0"
          value={minValue}
          onChange={(e) => onMinChange?.(e.target.value)}
          className="h-13 w-full rounded-xl border border-gray-300 px-4 pr-12 text-base font-bold outline-none focus:border-blue-600"
        />
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-lg font-black text-gray-400">m²</span>
      </div>
      <div className="relative">
        <input
          placeholder="Tot Geen max"
          value={maxValue}
          onChange={(e) => onMaxChange?.(e.target.value)}
          className="h-13 w-full rounded-xl border border-gray-300 px-4 pr-12 text-base font-bold outline-none focus:border-blue-600"
        />
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-lg font-black text-gray-400">m²</span>
      </div>
    </div>
  )
}
