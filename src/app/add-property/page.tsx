'use client'

import { useEffect, useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useJsApiLoader } from '@react-google-maps/api'
import { WONINGKENMERKEN_OPTIONS, toggleWoningkenmerk } from '@/lib/woningkenmerken'
import {
  CANONICAL_ACCESSIBILITY_TAGS,
  CANONICAL_EPC_LABELS,
  CANONICAL_FEATURE_TAGS,
  CANONICAL_GARAGE_TAGS,
  CANONICAL_LOCATION_TAGS,
  CANONICAL_OUTDOOR_TAGS,
  CANONICAL_PARKING_TAGS,
  CANONICAL_PROPERTY_TYPES,
  normalizeBooleanValue,
  normalizeCity,
  normalizeDestination,
  normalizeEpcLabel,
  normalizeGardenOrientation,
  normalizePropertyType,
  normalizeTagArray,
} from '@/lib/property-normalizers'

export default function AddPropertyPage() {
  const router = useRouter()

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries: ['places'],
  })

  const [title, setTitle] = useState('')
  const [price, setPrice] = useState('')
  const [city, setCity] = useState('')
  const [showCityOptions, setShowCityOptions] = useState(false)
  const [address, setAddress] = useState('')
  const [latitude, setLatitude] = useState<number | null>(null)
  const [longitude, setLongitude] = useState<number | null>(null)
  const [description, setDescription] = useState('')
  const [image, setImage] = useState('')
  const [images, setImages] = useState<string[]>([])
  const [makelaarLogo, setMakelaarLogo] = useState('')
  const [makelaarKantoornaam, setMakelaarKantoornaam] = useState('')
  const [makelaarWebsite, setMakelaarWebsite] = useState('')
  const [makelaarTelefoon, setMakelaarTelefoon] = useState('')
  const [makelaarEmail, setMakelaarEmail] = useState('')
  const [makelaarAdres, setMakelaarAdres] = useState('')
  const [premiumPartner, setPremiumPartner] = useState(false)
  const [isMakelaar, setIsMakelaar] = useState(false)

  const [slaapkamers, setSlaapkamers] = useState('')
  const [badkamers, setBadkamers] = useState('')
  const [kamers, setKamers] = useState('')
  const [bewoonbareOppervlakte, setBewoonbareOppervlakte] = useState('')
  const [grondoppervlakte, setGrondoppervlakte] = useState('')
  const [bouwjaar, setBouwjaar] = useState('')
  const [epc, setEpc] = useState('')
  const [woningType, setWoningType] = useState('')
  const [aanbodType, setAanbodType] = useState('Koop')
  const [soortBouw, setSoortBouw] = useState('')
  const [beschikbaarheid, setBeschikbaarheid] = useState('')
  const [tuinligging, setTuinligging] = useState('')
  const [bestemming, setBestemming] = useState('')
  const [ligging, setLigging] = useState('')
  const [liggingTags, setLiggingTags] = useState<string[]>([])
  const [liggingSearch, setLiggingSearch] = useState('')
  const [openHuis, setOpenHuis] = useState('')
  const [isProject, setIsProject] = useState(false)
  const [keywords, setKeywords] = useState('')
  const [buitenruimteFilters, setBuitenruimteFilters] = useState<string[]>([])
  const [parkingFilters, setParkingFilters] = useState<string[]>([])
  const [garageFilters, setGarageFilters] = useState<string[]>([])
  const [toegankelijkheidFilters, setToegankelijkheidFilters] = useState<string[]>([])
  const [eigenschapFilters, setEigenschapFilters] = useState<string[]>([])
  const [eigenschapSearch, setEigenschapSearch] = useState('')
  const [verwarmingstype, setVerwarmingstype] = useState('')
  const [woningkenmerken, setWoningkenmerken] = useState<string[]>([])

  const [parking, setParking] = useState(false)
  const [tuin, setTuin] = useState(false)
  const [terras, setTerras] = useState(false)
  const [lift, setLift] = useState(false)
  const [gemeubeld, setGemeubeld] = useState(false)
  const [dubbelGlas, setDubbelGlas] = useState(false)

  const [beschermdErfgoed, setBeschermdErfgoed] = useState('')
  const [gevelbreedte, setGevelbreedte] = useState('')
  const [asbestcertificaat, setAsbestcertificaat] = useState('')
  const [primairEnergieverbruik, setPrimairEnergieverbruik] = useState('')
  const [renovatieverplichting, setRenovatieverplichting] = useState('')
  const [epcCode, setEpcCode] = useState('')
  const [co2Uitstoot, setCo2Uitstoot] = useState('')
  const [jaarlijksEnergieverbruik, setJaarlijksEnergieverbruik] = useState('')
  const [elektriciteitsattest, setElektriciteitsattest] = useState('')
  const [dagvaarding, setDagvaarding] = useState('')
  const [vlaamsMaatregelenregister, setVlaamsMaatregelenregister] = useState('')
  const [overstromingscertificaat, setOverstromingscertificaat] = useState('')
  const [warmtepomp, setWarmtepomp] = useState('')
  const [zonnepanelen, setZonnepanelen] = useState('')
  const [thermischeZonnepanelen, setThermischeZonnepanelen] = useState('')
  const [bouwvergunning, setBouwvergunning] = useState('')
  const [bebouwbareGrondoppervlakte, setBebouwbareGrondoppervlakte] = useState('')
  const [kadastraalPlan, setKadastraalPlan] = useState('')
  const [voorkeurrechtHuurder, setVoorkeurrechtHuurder] = useState('')
  const [bouwverplichting, setBouwverplichting] = useState('')
  const [verkavelingsvergunning, setVerkavelingsvergunning] = useState('')
  const [voorkooprecht, setVoorkooprecht] = useState('')
  const [stedenbouwkundigeBestemming, setStedenbouwkundigeBestemming] = useState('')
  const [overstromingZonetype, setOverstromingZonetype] = useState('')
  const [pScore, setPScore] = useState('')
  const [gScore, setGScore] = useState('')

  const [contactNaam, setContactNaam] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [contactTelefoon, setContactTelefoon] = useState('')
  const [contactBericht, setContactBericht] = useState('')
  const [bezoekMogelijk, setBezoekMogelijk] = useState('')
  const [showVisitOptions, setShowVisitOptions] = useState(false)
  const [beschikbareBezoekmomenten, setBeschikbareBezoekmomenten] = useState('')
  const [publicatiestatus, setPublicatiestatus] = useState('Concept')
  const [presentationStyle, setPresentationStyle] = useState<'focus' | 'story' | 'signature'>('story')
  const [showPublicationOptions, setShowPublicationOptions] = useState(false)
  const [openSelect, setOpenSelect] = useState<string | null>(null)
  const [validationWarnings, setValidationWarnings] = useState<string[]>([])
  const [pendingSaveMode, setPendingSaveMode] = useState<'publish' | 'draft' | null>(null)

  const inputClass =
    'rounded-xl border border-[#CBD5E1] bg-white p-4 text-[#071B4D] placeholder-gray-500 outline-none focus:border-[#071B4D] focus:ring-2 focus:ring-[#071B4D]/10'

  const selectClass = `${inputClass} h-[58px] appearance-none bg-[url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23071B4D'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")] bg-[length:18px_18px] bg-[right_1rem_center] bg-no-repeat pr-12`

  const yesNoOptions = ['Ja', 'Nee', 'Niet gespecificeerd']
  const scoreOptions = ['A', 'B', 'C', 'D', 'Niet gespecificeerd']

  const publicationStatuses = ['Concept', 'Online', 'In optie', 'Verkocht']
  const propertyTypeOptions = CANONICAL_PROPERTY_TYPES
  const epcOptions = CANONICAL_EPC_LABELS
  const locationOptions = CANONICAL_LOCATION_TAGS
  const parkingOptions = CANONICAL_PARKING_TAGS
  const garageOptions = CANONICAL_GARAGE_TAGS
  const accessibilityOptions = CANONICAL_ACCESSIBILITY_TAGS
  const featureOptions = CANONICAL_FEATURE_TAGS

  const presentationStyles = [
    {
      id: 'focus' as const,
      title: 'Focus',
      subtitle: 'Snel en duidelijk',
      description: 'Compacte presentatie voor kopers die snel willen vergelijken.',
      maxPhotos: 10,
      accent: 'emerald',
      bullets: ['Compacte weergave', 'Snel en overzichtelijk', 'Ideaal voor efficiënte verkoop'],
    },
    {
      id: 'story' as const,
      title: 'Story',
      subtitle: 'Aanbevolen',
      description: 'Brengt sfeer, ruimte en beleving sterker naar voren.',
      maxPhotos: 20,
      accent: 'blue',
      bullets: ['Grotere foto’s', 'Sfeervolle presentatie', 'Meer betrokkenheid van kopers'],
    },
    {
      id: 'signature' as const,
      title: 'Signature',
      subtitle: 'Meest premium',
      description: 'Cinematische presentatie met maximale visuele impact.',
      maxPhotos: 30,
      accent: 'purple',
      bullets: ['Grote hero foto’s', 'Cinematische uitstraling', 'Maximale aandacht en impact'],
    },
  ]

  const selectedPresentationStyle =
    presentationStyles.find((style) => style.id === presentationStyle) || presentationStyles[1]
  const propertyTypeTips: Record<string, string[]> = {
    Appartement: [
      'Lift aanwezig',
      'Balkon',
      'Verdieping',
      'Syndicus / gemeenschappelijke kosten',
      'EPC label',
    ],
    Huis: [
      'Tuin',
      'Garage',
      'Perceeloppervlakte',
      'Aantal slaapkamers',
      'Tuinligging',
    ],
    Grond: [
      'Perceeloppervlakte',
      'Bestemming',
      'Ligging',
      'Bouwmogelijkheid',
      'Straatbreedte',
    ],
    Kantoor: [
      'Oppervlakte',
      'Parking',
      'Bereikbaarheid',
      'Lift',
      'Beschikbaarheid',
    ],
  }
  const selectedPropertyTypeTips =
    propertyTypeTips[normalizePropertyType(woningType)] || []

  const belgianCities = [
    'Aalst',
    'Aarschot',
    'Antwerpen',
    'Arlon',
    'Asse',
    'Bastogne',
    'Beersel',
    'Beringen',
    'Beveren',
    'Bilzen',
    'Blankenberge',
    'Boom',
    'Brasschaat',
    'Brugge',
    'Brussel',
    'Charleroi',
    'Dendermonde',
    'Diest',
    'Dilbeek',
    'Dinant',
    'Drogenbos',
    'Edegem',
    'Evergem',
    'Genk',
    'Gent',
    'Geraardsbergen',
    'Halle',
    'Hasselt',
    'Herentals',
    'Hoboken',
    'Ieper',
    'Ixelles',
    'Jette',
    'Knokke-Heist',
    'Kortrijk',
    'La Louvière',
    'Leuven',
    'Lier',
    'Liège',
    'Lokeren',
    'Maasmechelen',
    'Malines',
    'Mechelen',
    'Menen',
    'Middelkerke',
    'Mol',
    'Mons',
    'Mortsel',
    'Namur',
    'Ninove',
    'Oostende',
    'Oudenaarde',
    'Roeselare',
    'Ronse',
    'Schaarbeek',
    'Sint-Niklaas',
    'Sint-Truiden',
    'Tienen',
    'Tongeren',
    'Torhout',
    'Turnhout',
    'Uccle',
    'Vilvoorde',
    'Wavre',
    'Wetteren',
    'Zaventem',
    'Zottegem',
  ]

  const filteredBelgianCities = belgianCities.filter((cityName) =>
    cityName.toLowerCase().includes(city.toLowerCase())
  )

  useEffect(() => {
    checkAccountType()
  }, [])

  async function checkAccountType() {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const accountType =
      user?.user_metadata?.account_type ||
      user?.user_metadata?.role ||
      user?.app_metadata?.account_type ||
      user?.app_metadata?.role

    setIsMakelaar(accountType === 'makelaar')
  }

  function onlyNumbers(value: string) {
    return value.replace(/[^\d]/g, '')
  }

  function numberFromInput(value: string) {
    const cleanValue = onlyNumbers(value)

    return cleanValue ? Number(cleanValue) : 0
  }

  function toggleStringOption(current: string[], value: string) {
    return current.includes(value)
      ? current.filter((item) => item !== value)
      : [...current, value]
  }

  function scoreValue(value: number) {
    return Math.max(0, Math.min(100, Math.round(value)))
  }

  function payloadNumber(propertyPayload: Record<string, unknown>, key: string) {
    const value = propertyPayload[key]
    const numericValue = Number(value)

    return Number.isFinite(numericValue) ? numericValue : 0
  }

  function payloadBoolean(propertyPayload: Record<string, unknown>, key: string) {
    return normalizeBooleanValue(propertyPayload[key]) === true
  }

  function payloadText(propertyPayload: Record<string, unknown>, key: string) {
    return String(propertyPayload[key] || '').toLowerCase()
  }

  function calculateInitialPropertyScores(propertyPayload: Record<string, unknown>) {
    const importantFields = [
      'title',
      'price',
      'city',
      'address',
      'description',
      'woning_type',
      'slaapkamers',
      'badkamers',
      'bewoonbare_oppervlakte',
      'grondoppervlakte',
      'bouwjaar',
      'epc',
      'verwarmingstype',
      'parking',
      'tuin',
      'terras',
      'lift',
      'dubbel_glas',
      'ligging',
      'bestemming',
      'tuinligging',
      'woningkenmerken',
    ]
    const filledImportantFields = importantFields.filter((field) => {
      const value = propertyPayload[field]

      if (Array.isArray(value)) return value.length > 0
      if (typeof value === 'boolean') return true

      return value !== null && value !== undefined && String(value).trim() !== ''
    }).length
    const dataQualityScore = scoreValue(
      (filledImportantFields / importantFields.length) * 100
    )

    const epcScores: Record<string, number> = {
      'A+++++': 100,
      'A++++': 98,
      'A+++': 96,
      'A++': 94,
      'A+': 90,
      A: 85,
      B: 75,
      C: 62,
      D: 48,
      E: 32,
      F: 18,
      G: 8,
    }
    const epcScore = epcScores[String(propertyPayload.epc || '').toUpperCase()] ?? 50
    const energyScore = scoreValue(
      epcScore +
        (payloadBoolean(propertyPayload, 'zonnepanelen') ? 8 : 0) +
        (payloadBoolean(propertyPayload, 'warmtepomp') ? 10 : 0) +
        (payloadBoolean(propertyPayload, 'dubbel_glas') ? 7 : 0)
    )

    const bedrooms = payloadNumber(propertyPayload, 'slaapkamers')
    const bathrooms = payloadNumber(propertyPayload, 'badkamers')
    const garageText = payloadText(propertyPayload, 'pluspunten')
    const comfortScore = scoreValue(
      35 +
        (payloadBoolean(propertyPayload, 'tuin') ? 12 : 0) +
        (payloadBoolean(propertyPayload, 'terras') ? 8 : 0) +
        (payloadBoolean(propertyPayload, 'parking') ? 10 : 0) +
        (payloadBoolean(propertyPayload, 'lift') ? 8 : 0) +
        (/garage|carport|parkeerplaats|parkeren/.test(garageText) ? 8 : 0) +
        Math.min(bedrooms, 4) * 4 +
        Math.min(bathrooms, 3) * 4
    )

    const locationText = [
      propertyPayload.ligging,
      propertyPayload.location_description,
      propertyPayload.pluspunten,
      Array.isArray(propertyPayload.woningkenmerken)
        ? propertyPayload.woningkenmerken.join(' ')
        : '',
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
    const locationSignals = [
      'centrum',
      'nabij station',
      'nabij openbaar vervoer',
      'aan park',
      'aan water',
      'rustig gelegen',
      'aan rustige weg',
      'kindvriendelijk',
    ]
    const locationScore = scoreValue(
      50 +
        locationSignals.filter((signal) => locationText.includes(signal)).length * 7
    )

    const marketScore = 50
    const aiRankScore = scoreValue(
      dataQualityScore * 0.2 +
        locationScore * 0.2 +
        energyScore * 0.2 +
        comfortScore * 0.2 +
        marketScore * 0.2
    )

    return {
      data_quality_score: dataQualityScore,
      location_score: locationScore,
      energy_score: energyScore,
      comfort_score: comfortScore,
      market_score: marketScore,
      ai_rank_score: aiRankScore,
      ai_score_updated_at: new Date().toISOString(),
    }
  }

  function getValidationWarnings() {
    const warnings: string[] = []
    const normalizedPropertyType = normalizePropertyType(woningType)
    const normalizedEpc = normalizeEpcLabel(epc)
    const normalizedAanbodType = normalizeTagArray(aanbodType, ['Koop', 'Huur'])[0] || 'Koop'
    const priceValue = numberFromInput(price)
    const livingAreaValue = numberFromInput(bewoonbareOppervlakte)
    const plotAreaValue = numberFromInput(grondoppervlakte)
    const buildYearValue = numberFromInput(bouwjaar)
    const hasGarden = normalizeBooleanValue(tuin) === true
    const hasRenovationObligation = normalizeBooleanValue(renovatieverplichting) === true
    const goodEpcLabels = ['A+++++', 'A++++', 'A+++', 'A++', 'A+', 'A']

    if (normalizedPropertyType === 'Grond') {
      const filledBuildingFields = [
        slaapkamers,
        badkamers,
        kamers,
        bewoonbareOppervlakte,
      ].some((value) => Boolean(onlyNumbers(value)))

      if (filledBuildingFields) {
        warnings.push(
          'Type vastgoed staat op Grond, maar er zijn woonvelden ingevuld zoals kamers, badkamers of woonoppervlakte.'
        )
      }
    }

    if (!hasGarden && normalizeGardenOrientation(tuinligging)) {
      warnings.push(
        'Er is een tuinligging ingevuld terwijl Tuin niet is aangevinkt.'
      )
    }

    if (
      normalizedAanbodType === 'Koop' &&
      ['Huis', 'Appartement', 'Huis en appartement'].includes(normalizedPropertyType) &&
      priceValue > 0 &&
      priceValue < 75000
    ) {
      warnings.push(
        'De verkoopprijs lijkt opvallend laag voor een huis of appartement. Controleer of het bedrag volledig is ingevuld.'
      )
    }

    if (
      normalizedAanbodType === 'Koop' &&
      priceValue > 0 &&
      priceValue < 25000
    ) {
      warnings.push(
        'De verkoopprijs is extreem laag. Controleer of dit geen maandprijs of onvolledig bedrag is.'
      )
    }

    if (
      normalizedAanbodType === 'Huur' &&
      priceValue > 10000
    ) {
      warnings.push(
        'De huurprijs lijkt uitzonderlijk hoog voor een maandelijkse prijs. Controleer of dit bedrag klopt.'
      )
    }

    if (goodEpcLabels.includes(normalizedEpc) && hasRenovationObligation) {
      warnings.push(
        'Het EPC-label is zeer gunstig, maar renovatieverplichting staat op Ja. Controleer of deze combinatie klopt.'
      )
    }

    if (
      normalizedPropertyType === 'Appartement' &&
      plotAreaValue > 1000
    ) {
      warnings.push(
        'De perceeloppervlakte lijkt hoog voor een appartement. Controleer of dit geen gebouw- of projectoppervlakte is.'
      )
    }

    if (
      normalizedPropertyType === 'Huis' &&
      livingAreaValue > 0 &&
      livingAreaValue < 30
    ) {
      warnings.push(
        'De woonoppervlakte lijkt erg laag voor een huis. Controleer het aantal m².'
      )
    }

    if (buildYearValue > new Date().getFullYear()) {
      warnings.push(
        'Het bouwjaar ligt in de toekomst. Controleer of dit het juiste jaar is.'
      )
    }

    const openHouseLabelOptions = [
      'Alle open huizen',
      'Open huis komend weekend',
      'Open huis vandaag',
    ]
    const normalizedOpenHouse = openHouseLabelOptions.find(
      (option) => option.toLowerCase() === openHuis.trim().toLowerCase()
    )
    const openHouseDate = new Date(openHuis)

    if (
      openHuis.trim() &&
      !normalizedOpenHouse &&
      Number.isFinite(openHouseDate.getTime()) &&
      openHouseDate.getTime() < Date.now()
    ) {
      warnings.push(
        'De open huis datum lijkt in het verleden te liggen.'
      )
    }

    return warnings
  }

  function buildPropertyPayload(userId: string, statusOverride?: string) {
    const normalizedAanbodType = normalizeTagArray(aanbodType, ['Koop', 'Huur'])[0] || 'Koop'
    const normalizedSoortBouw = normalizeTagArray(soortBouw, ['Nieuwbouw', 'Bestaande bouw'])[0] || ''
    const normalizedBeschikbaarheid =
      normalizeTagArray(beschikbaarheid, ['Beschikbaar', 'In onderhandeling', 'Verkocht'])[0] || ''
    const normalizedOpenHuis =
      normalizeTagArray(openHuis, ['Alle open huizen', 'Open huis komend weekend', 'Open huis vandaag'])[0] || ''
    const normalizedPropertyType = normalizePropertyType(woningType)
    const normalizedEpc = normalizeEpcLabel(epc)
    const normalizedLiggingTags = normalizeTagArray(
      [...liggingTags, ligging],
      CANONICAL_LOCATION_TAGS
    )
    const normalizedLigging = normalizedLiggingTags.join(' ')
    const normalizedTuinligging = normalizeGardenOrientation(tuinligging)
    const normalizedBestemming = normalizeDestination(bestemming)
    const normalizedBuitenruimteFilters = normalizeTagArray(
      buitenruimteFilters,
      CANONICAL_OUTDOOR_TAGS
    )
    const normalizedParkingFilters = normalizeTagArray(
      parkingFilters,
      CANONICAL_PARKING_TAGS
    )
    const normalizedGarageFilters = normalizeTagArray(
      garageFilters,
      CANONICAL_GARAGE_TAGS
    )
    const normalizedToegankelijkheidFilters = normalizeTagArray(
      toegankelijkheidFilters,
      CANONICAL_ACCESSIBILITY_TAGS
    )
    const normalizedEigenschapFilters = normalizeTagArray(
      eigenschapFilters,
      CANONICAL_FEATURE_TAGS
    )
    const normalizedWoningkenmerken = normalizeTagArray(
      woningkenmerken,
      WONINGKENMERKEN_OPTIONS
    )
    const filterTerms = [
      keywords.trim(),
      normalizedSoortBouw,
      ...normalizedLiggingTags,
      ...normalizedBuitenruimteFilters,
      ...normalizedParkingFilters,
      ...normalizedGarageFilters,
      ...normalizedToegankelijkheidFilters,
      ...normalizedEigenschapFilters,
    ]
      .filter(Boolean)
      .join(' ')

    const propertyPayload = {
      title: title.trim() || 'Concept vastgoed',
      price: onlyNumbers(price) || null,
      city: normalizeCity(city) || null,
      address: address.trim() || null,
      description: description.trim() || null,
      image: images[0] || null,
      images: images,
      makelaar_logo: isMakelaar ? makelaarLogo : null,
      makelaar_kantoornaam: isMakelaar ? makelaarKantoornaam.trim() : null,
      makelaar_website: isMakelaar ? makelaarWebsite.trim() : null,
      makelaar_telefoon: isMakelaar ? makelaarTelefoon.trim() : null,
      makelaar_email: isMakelaar ? makelaarEmail.trim() : null,
      makelaar_adres: isMakelaar ? makelaarAdres.trim() : null,
      premium_partner: isMakelaar ? premiumPartner : false,
      user_id: userId,
      latitude,
      longitude,
      aanbod_type: normalizedAanbodType || null,
      listing_type: normalizedAanbodType === 'Huur' ? 'rent' : 'sale',
      slaapkamers: onlyNumbers(slaapkamers) || null,
      badkamers: onlyNumbers(badkamers) || null,
      kamers: onlyNumbers(kamers) || null,
      bewoonbare_oppervlakte: onlyNumbers(bewoonbareOppervlakte) || null,
      grondoppervlakte: onlyNumbers(grondoppervlakte) || null,
      bouwjaar: onlyNumbers(bouwjaar) || null,
      epc: normalizedEpc || null,
      woning_type: normalizedPropertyType || null,
      type: normalizedPropertyType || null,
      soort_bouw: normalizedSoortBouw || null,
      status: normalizedBeschikbaarheid || statusOverride || publicatiestatus,
      beschikbaarheid: normalizedBeschikbaarheid || null,
      availability: normalizedBeschikbaarheid || null,
      tuinligging: normalizedTuinligging || null,
      garden_orientation: normalizedTuinligging || null,
      bestemming: normalizedBestemming || null,
      destination: normalizedBestemming || null,
      ligging: normalizedLigging || null,
      location_description: normalizedLigging || null,
      open_huis: normalizedOpenHuis || null,
      open_house: normalizedOpenHuis || null,
      project: isProject,
      is_project: isProject,
      keywords: keywords.trim() || null,
      pluspunten: filterTerms || null,
      verwarmingstype: verwarmingstype.trim() || null,
      parking: normalizeBooleanValue(parking),
      tuin: normalizeBooleanValue(tuin),
      terras: normalizeBooleanValue(terras),
      lift: normalizeBooleanValue(lift),
      gemeubeld: normalizeBooleanValue(gemeubeld),
      dubbel_glas: normalizeBooleanValue(dubbelGlas),
      beschermd_erfgoed: beschermdErfgoed || null,
      gevelbreedte: onlyNumbers(gevelbreedte) || null,
      asbestcertificaat: asbestcertificaat || null,
      primair_energieverbruik: onlyNumbers(primairEnergieverbruik) || null,
      renovatieverplichting: renovatieverplichting || null,
      epc_code: epcCode.trim() || null,
      co2_uitstoot: co2Uitstoot.trim() || null,
      jaarlijks_energieverbruik: jaarlijksEnergieverbruik.trim() || null,
      elektriciteitsattest: elektriciteitsattest || null,
      dagvaarding: dagvaarding || null,
      vlaams_maatregelenregister: vlaamsMaatregelenregister || null,
      overstromingscertificaat: overstromingscertificaat || null,
      warmtepomp: warmtepomp || null,
      zonnepanelen: zonnepanelen || null,
      thermische_zonnepanelen: thermischeZonnepanelen || null,
      bouwvergunning: bouwvergunning || null,
      bebouwbare_grondoppervlakte: onlyNumbers(bebouwbareGrondoppervlakte) || null,
      kadastraal_plan: kadastraalPlan || null,
      voorkeurrecht_huurder: voorkeurrechtHuurder || null,
      bouwverplichting: bouwverplichting || null,
      verkavelingsvergunning: verkavelingsvergunning || null,
      voorkooprecht: voorkooprecht || null,
      stedenbouwkundige_bestemming: stedenbouwkundigeBestemming || null,
      overstroming_zonetype: overstromingZonetype || null,
      p_score: pScore || null,
      g_score: gScore || null,
      contact_naam: contactNaam.trim() || null,
      contact_email: contactEmail.trim() || null,
      contact_telefoon: contactTelefoon.trim() || null,
      contact_bericht: contactBericht.trim() || null,
      bezoek_mogelijk: bezoekMogelijk || null,
      beschikbare_bezoekmomenten: beschikbareBezoekmomenten.trim() || null,
      publicatiestatus: statusOverride || publicatiestatus,
      presentation_style: presentationStyle,
      woningkenmerken: normalizedWoningkenmerken,
    }

    return {
      ...propertyPayload,
      ...calculateInitialPropertyScores(propertyPayload),
    }
  }

  function formatPrice(value: string) {
    const cleanValue = onlyNumbers(value)

    if (!cleanValue) {
      return '-'
    }

    return `${Number(cleanValue).toLocaleString('nl-BE')} €`
  }

  function renderSelectField({
    id,
    value,
    placeholder,
    options,
    onChange,
  }: {
    id: string
    value: string
    placeholder: string
    options: string[]
    onChange: (value: string) => void
  }) {
    const isOpen = openSelect === id

    return (
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpenSelect(isOpen ? null : id)}
          onBlur={() => {
            window.setTimeout(() => setOpenSelect(null), 120)
          }}
          className={`${inputClass} flex h-[58px] w-full items-center justify-between text-left font-normal ${
            value ? 'text-[#071B4D]' : 'text-gray-500'
          }`}
        >
          <span>{value || placeholder}</span>
          <span className="text-[#071B4D]">⌄</span>
        </button>

        {isOpen && (
          <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-40 max-h-64 overflow-y-auto rounded-2xl border border-[#CBD5E1] bg-white p-2 shadow-xl">
            {options.map((option) => (
              <button
                key={option}
                type="button"
                onMouseDown={() => {
                  onChange(option)
                  setOpenSelect(null)
                }}
                className={`block w-full rounded-xl px-4 py-3 text-left font-semibold transition hover:bg-[#EFF6FF] ${
                  value === option
                    ? 'bg-[#EFF6FF] text-[#071B4D]'
                    : 'text-[#071B4D]'
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

  function renderSearchableTagInput({
    title,
    placeholder,
    options,
    values,
    onChange,
    searchValue,
    onSearchChange,
  }: {
    title: string
    placeholder: string
    options: string[]
    values: string[]
    onChange: Dispatch<SetStateAction<string[]>>
    searchValue: string
    onSearchChange: (value: string) => void
  }) {
    const normalizedSearch = searchValue.trim().toLowerCase()
    const matchingOptions = options.filter(
      (option) =>
        !values.includes(option) &&
        (!normalizedSearch || option.toLowerCase().includes(normalizedSearch))
    )
    const visibleOptions = normalizedSearch
      ? matchingOptions.slice(0, 8)
      : matchingOptions.slice(0, 5)

    function addTag(value: string) {
      onChange((current) =>
        current.includes(value) ? current : [...current, value]
      )
      onSearchChange('')
    }

    return (
      <div>
        <p className="mb-3 text-sm font-black uppercase tracking-wide text-gray-500">
          {title}
        </p>

        <div className="rounded-2xl border border-[#CBD5E1] bg-[#F8FAFC] p-3 focus-within:border-blue-600 focus-within:ring-4 focus-within:ring-blue-50">
          {values.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {values.map((value) => (
                <span
                  key={value}
                  className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white px-3 py-1.5 text-xs font-black text-blue-700"
                >
                  {value}
                  <button
                    type="button"
                    onClick={() =>
                      onChange((current) =>
                        current.filter((item) => item !== value)
                      )
                    }
                    className="text-sm leading-none text-blue-400 transition hover:text-blue-800"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}

          <div className="relative">
            <input
              className="h-12 w-full bg-transparent px-1 text-[#071B4D] placeholder-gray-500 outline-none"
              placeholder={placeholder}
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key !== 'Enter' || visibleOptions.length === 0) return

                e.preventDefault()
                addTag(visibleOptions[0])
              }}
            />

            {normalizedSearch && visibleOptions.length > 0 && (
              <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-30 max-h-56 overflow-y-auto rounded-2xl border border-[#CBD5E1] bg-white p-2 shadow-xl">
                {visibleOptions.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onMouseDown={(event) => {
                      event.preventDefault()
                      addTag(option)
                    }}
                    className="block w-full rounded-xl px-4 py-3 text-left text-sm font-bold text-[#071B4D] transition hover:bg-[#EFF6FF]"
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])

    if (files.length === 0) return

    if (files.length < 5) {
      alert('Voeg minstens 5 foto’s toe.')
      e.target.value = ''
      return
    }

    if (files.length > selectedPresentationStyle.maxPhotos) {
      alert(`Je kunt maximaal ${selectedPresentationStyle.maxPhotos} foto’s uploaden voor ${selectedPresentationStyle.title}.`)
      e.target.value = ''
      return
    }

    const uploadedUrls: string[] = []

    for (const file of files) {
      const fileName = `${Date.now()}-${crypto.randomUUID()}-${file.name}`
      const { error } = await supabase.storage.from('properties').upload(fileName, file)

      if (error) {
        alert(`Upload fout: ${error.message}`)
        return
      }

      const { data } = supabase.storage.from('properties').getPublicUrl(fileName)
      uploadedUrls.push(data.publicUrl)
    }

    setImages(uploadedUrls)
    setImage(uploadedUrls[0] || '')
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const fileName = `logo-${Date.now()}-${file.name}`
    const { error } = await supabase.storage.from('properties').upload(fileName, file)

    if (error) {
      alert(`Logo upload fout: ${error.message}`)
      return
    }

    const { data } = supabase.storage.from('properties').getPublicUrl(fileName)
    setMakelaarLogo(data.publicUrl)
  }

  async function getCoordinates() {
    if (!isLoaded || !address.trim()) return

    const fullAddress = `${address}, ${city}, Belgium`
    const geocoder = new window.google.maps.Geocoder()

    geocoder.geocode({ address: fullAddress }, (results, status) => {
      if (status === 'OK' && results?.[0]) {
        const location = results[0].geometry.location
        setLatitude(location.lat())
        setLongitude(location.lng())
      } else {
        console.log('Geocode fout:', status)
      }
    })
  }

  async function handleAddProperty(skipWarnings = false) {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      alert('Je moet eerst inloggen')
      router.push('/login')
      return
    }

    if (!title.trim()) {
      alert('Titel is verplicht')
      return
    }

    if (!price.trim()) {
      alert('Prijs is verplicht')
      return
    }

    if (!city.trim()) {
      alert('Stad is verplicht')
      return
    }

    if (!address.trim()) {
      alert('Adres is verplicht')
      return
    }

    if (!woningType.trim()) {
      alert('Type vastgoed is verplicht')
      return
    }

    if (images.length < 5) {
      alert('Voeg minstens 5 foto’s toe.')
      return
    }

    if (images.length > selectedPresentationStyle.maxPhotos) {
      alert(`Je kunt maximaal ${selectedPresentationStyle.maxPhotos} foto’s uploaden voor ${selectedPresentationStyle.title}.`)
      return
    }

    const warnings = getValidationWarnings()

    if (warnings.length > 0 && !skipWarnings) {
      setValidationWarnings(warnings)
      setPendingSaveMode('publish')
      return
    }

    const { error } = await supabase.from('properties').insert([
      buildPropertyPayload(user.id),
    ])

    if (error) {
      alert(`Database fout: ${error.message}`)
      console.log(error)
      return
    }

    setValidationWarnings([])
    setPendingSaveMode(null)
    router.push('/dashboard')
  }

  async function handleSaveDraft(skipWarnings = false) {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      alert('Je moet eerst inloggen')
      router.push('/login')
      return
    }

    const warnings = getValidationWarnings()

    if (warnings.length > 0 && !skipWarnings) {
      setValidationWarnings(warnings)
      setPendingSaveMode('draft')
      return
    }

    const { error } = await supabase.from('properties').insert([
      buildPropertyPayload(user.id, 'Concept'),
    ])

    if (error) {
      alert(`Opslaan mislukt: ${error.message}`)
      console.log(error)
      return
    }

    setValidationWarnings([])
    setPendingSaveMode(null)
    alert('Concept opgeslagen. Je kunt dit vastgoed later verder aanvullen.')
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-white px-5 py-10 text-[#071B4D]">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-8 px-6">
        <div>
          <h1 className="text-4xl font-bold md:text-5xl">
            Vastgoed toevoegen
          </h1>

          <p className="mt-3 text-gray-500">
            Vul de gegevens van het vastgoed zo volledig mogelijk in.
          </p>
        </div>

        <div className="grid grid-cols-1 items-stretch gap-8 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
          <div className="flex flex-col gap-8">

        <section className="h-fit w-full rounded-3xl border border-[#E2E8F0] bg-white p-5 shadow-sm md:p-7">
          <h2 className="mb-4 text-2xl font-bold">Basisinformatie</h2>

          <div className="grid grid-cols-1 gap-4">
            <input
              className={`${inputClass} !bg-[#F8FAFC]`}
              placeholder="Titel"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />

            <input
              className={`${inputClass} !bg-[#F8FAFC]`}
              placeholder="Prijs"
              inputMode="numeric"
              value={price}
              onChange={(e) => setPrice(onlyNumbers(e.target.value))}
            />

            <div className="[&_button]:!bg-[#F8FAFC]">
              {renderSelectField({
                id: 'aanbodType',
                value: aanbodType,
                placeholder: 'Aanbodtype',
                options: ['Koop', 'Huur'],
                onChange: setAanbodType,
              })}
            </div>

            <div className="relative">
              <input
                className={`${inputClass} w-full pr-12 !bg-[#F8FAFC]`}
                placeholder="Stad"
                value={city}
                onFocus={() => setShowCityOptions(true)}
                onChange={(e) => {
                  setCity(e.target.value)
                  setShowCityOptions(true)
                }}
                onBlur={() => {
                  window.setTimeout(() => setShowCityOptions(false), 120)
                }}
              />

              <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#071B4D]">
               ⌄
              </span>

              {showCityOptions && filteredBelgianCities.length > 0 && (
                <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-30 max-h-64 overflow-y-auto rounded-2xl border border-[#CBD5E1] bg-white p-2 shadow-xl">
                  {filteredBelgianCities.map((cityName) => (
                    <button
                      key={cityName}
                      type="button"
                      onMouseDown={() => {
                        setCity(cityName)
                        setShowCityOptions(false)
                      }}
                      className="block w-full rounded-xl px-4 py-3 text-left font-semibold text-[#071B4D] transition hover:bg-[#EFF6FF]"
                    >
                      {cityName}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <input
              className={`${inputClass} !bg-[#F8FAFC]`}
              placeholder="Adres"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              onBlur={getCoordinates}
            />

            <textarea
              className="min-h-36 rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] p-4 text-[#071B4D] placeholder-gray-500 outline-none focus:border-[#071B4D] focus:ring-2 focus:ring-[#071B4D]/10"
              placeholder="Beschrijving"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </section>

        {/* Vastgoeddetails moved from right column to here */}
        <section className="h-fit w-full rounded-3xl border border-[#E2E8F0] bg-white p-5 shadow-sm md:p-7">
          <h2 className="mb-4 text-2xl font-bold">Vastgoeddetails</h2>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <input
              className={`${inputClass} !bg-[#F8FAFC]`}
              placeholder="Aantal slaapkamers"
              inputMode="numeric"
              value={slaapkamers}
              onChange={(e) => setSlaapkamers(onlyNumbers(e.target.value))}
            />

            <input
              className={`${inputClass} !bg-[#F8FAFC]`}
              placeholder="Aantal badkamers"
              inputMode="numeric"
              value={badkamers}
              onChange={(e) => setBadkamers(onlyNumbers(e.target.value))}
            />

            <input
              className={`${inputClass} !bg-[#F8FAFC]`}
              placeholder="Aantal kamers"
              inputMode="numeric"
              value={kamers}
              onChange={(e) => setKamers(onlyNumbers(e.target.value))}
            />

            <input
              className={`${inputClass} !bg-[#F8FAFC]`}
              placeholder="Bewoonbare oppervlakte (m²)"
              inputMode="numeric"
              value={bewoonbareOppervlakte}
              onChange={(e) => setBewoonbareOppervlakte(onlyNumbers(e.target.value))}
            />

            <input
              className={`${inputClass} !bg-[#F8FAFC]`}
              placeholder="Grondoppervlakte (m²)"
              inputMode="numeric"
              value={grondoppervlakte}
              onChange={(e) => setGrondoppervlakte(onlyNumbers(e.target.value))}
            />

            <input
              className={`${inputClass} !bg-[#F8FAFC]`}
              placeholder="Bouwjaar"
              inputMode="numeric"
              maxLength={4}
              value={bouwjaar}
              onChange={(e) => setBouwjaar(onlyNumbers(e.target.value).slice(0, 4))}
            />

            <div className="[&_button]:!bg-[#F8FAFC]">
              {renderSelectField({
                id: 'epc',
                value: epc,
                placeholder: 'Energielabel',
                options: epcOptions,
                onChange: setEpc,
              })}
            </div>

            <div className="[&_button]:!bg-[#F8FAFC]">
              {renderSelectField({
                id: 'woningType',
                value: woningType,
                placeholder: 'Type vastgoed',
                options: propertyTypeOptions,
                onChange: setWoningType,
              })}
            </div>

            {selectedPropertyTypeTips.length > 0 && (
              <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 md:col-span-2">
                <p className="text-sm font-black text-[#071B4D]">
                  Slimme invultips
                </p>
                <p className="mt-1 text-sm font-semibold text-blue-700">
                  Deze velden helpen kopers beter filteren en vergelijken.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {selectedPropertyTypeTips.map((tip) => (
                    <span
                      key={tip}
                      className="rounded-full border border-blue-100 bg-white px-3 py-1.5 text-xs font-black text-blue-700"
                    >
                      {tip}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="[&_button]:!bg-[#F8FAFC]">
              {renderSelectField({
                id: 'soortBouw',
                value: soortBouw,
                placeholder: 'Soort bouw',
                options: ['Nieuwbouw', 'Bestaande bouw'],
                onChange: setSoortBouw,
              })}
            </div>

            <div className="[&_button]:!bg-[#F8FAFC]">
              {renderSelectField({
                id: 'verwarmingstype',
                value: verwarmingstype,
                placeholder: 'Verwarmingstype',
                options: ['Gas', 'Elektrisch', 'Warmtepomp', 'Mazout', 'Vloerverwarming', 'Niet opgegeven'],
                onChange: setVerwarmingstype,
              })}
            </div>
          </div>
        </section>

        {/* Woningkenmerken */}
        <section className="h-fit w-full rounded-3xl border border-[#E2E8F0] bg-white p-5 shadow-sm md:p-7">
          <h2 className="mb-4 text-2xl font-bold">Woningkenmerken</h2>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {WONINGKENMERKEN_OPTIONS.map((kenmerk) => (
              <label
                key={kenmerk}
                className="flex items-center gap-3 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4 font-medium"
              >
                <input
                  type="checkbox"
                  checked={woningkenmerken.includes(kenmerk)}
                  onChange={() =>
                    setWoningkenmerken((current) =>
                      toggleWoningkenmerk(current, kenmerk)
                    )
                  }
                />
                {kenmerk}
              </label>
            ))}
          </div>
        </section>

        {/* Voorzieningen */}
        <section className="h-fit w-full rounded-3xl border border-[#E2E8F0] bg-white p-5 shadow-sm md:p-7">
          <h2 className="mb-4 text-2xl font-bold">Voorzieningen</h2>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {[
              ['Parking', parking, setParking],
              ['Tuin', tuin, setTuin],
              ['Terras', terras, setTerras],
              ['Lift', lift, setLift],
              ['Gemeubeld', gemeubeld, setGemeubeld],
              ['Dubbel glas', dubbelGlas, setDubbelGlas],
            ].map(([label, checked, setter]) => (
              <label
                key={label as string}
                className="flex items-center gap-3 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4 font-medium"
              >
                <input
                  type="checkbox"
                  checked={checked as boolean}
                  onChange={(e) =>
                    (
                      setter as React.Dispatch<
                        React.SetStateAction<boolean>
                      >
                    )(e.target.checked)
                  }
                />
                {label as string}
              </label>
            ))}
          </div>
        </section>

        <section className="h-fit w-full rounded-3xl border border-[#E2E8F0] bg-white p-5 shadow-sm md:p-7">
          <h2 className="mb-4 text-2xl font-bold">Filterinformatie</h2>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="[&_button]:!bg-[#F8FAFC]">
              {renderSelectField({
                id: 'beschikbaarheid',
                value: beschikbaarheid,
                placeholder: 'Beschikbaarheid',
                options: ['Beschikbaar', 'In onderhandeling', 'Verkocht'],
                onChange: setBeschikbaarheid,
              })}
            </div>

            <div className="[&_button]:!bg-[#F8FAFC]">
              {renderSelectField({
                id: 'tuinligging',
                value: tuinligging,
                placeholder: 'Tuinligging',
                options: ['Noord', 'Oost', 'Zuid', 'West'],
                onChange: setTuinligging,
              })}
            </div>

            <div className="[&_button]:!bg-[#F8FAFC]">
              {renderSelectField({
                id: 'bestemming',
                value: bestemming,
                placeholder: 'Bestemming',
                options: ['Recreatiewoning', 'Permanente bewoning'],
                onChange: setBestemming,
              })}
            </div>

            <div className="md:col-span-2">
              {renderSearchableTagInput({
                title: 'Ligging',
                placeholder: 'Zoek ligging, bv. Centrum of Aan park',
                options: locationOptions,
                values: liggingTags,
                onChange: setLiggingTags,
                searchValue: liggingSearch,
                onSearchChange: setLiggingSearch,
              })}
            </div>

            <div className="[&_button]:!bg-[#F8FAFC]">
              {renderSelectField({
                id: 'openHuis',
                value: openHuis,
                placeholder: 'Open huis',
                options: ['Alle open huizen', 'Open huis komend weekend', 'Open huis vandaag'],
                onChange: setOpenHuis,
              })}
            </div>

            <label className="flex items-center gap-3 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4 font-medium">
              <input
                type="checkbox"
                checked={isProject}
                onChange={(e) => setIsProject(e.target.checked)}
              />
              Project
            </label>

            <input
              className={`${inputClass} !bg-[#F8FAFC] md:col-span-2`}
              placeholder="Zoekwoorden, bv. warmtepomp, rustig, renovatie"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
            />
          </div>

          <div className="mt-6 space-y-5">
            {[
              {
                title: 'Buitenruimte',
                options: ['Balkon', 'Dakterras', 'Tuin'],
                values: buitenruimteFilters,
                setter: setBuitenruimteFilters,
              },
              {
                title: 'Parkeergelegenheid',
                options: parkingOptions,
                values: parkingFilters,
                setter: setParkingFilters,
              },
              {
                title: 'Garage',
                options: garageOptions,
                values: garageFilters,
                setter: setGarageFilters,
              },
              {
                title: 'Toegankelijkheid',
                options: accessibilityOptions,
                values: toegankelijkheidFilters,
                setter: setToegankelijkheidFilters,
              },
            ].map((group) => (
              <div key={group.title}>
                <p className="mb-3 text-sm font-black uppercase tracking-wide text-gray-500">
                  {group.title}
                </p>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {group.options.map((option) => (
                    <label
                      key={option}
                      className="flex items-center gap-3 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4 font-medium"
                    >
                      <input
                        type="checkbox"
                        checked={group.values.includes(option)}
                        onChange={() =>
                          group.setter((current) =>
                            toggleStringOption(current, option)
                          )
                        }
                      />
                      {option}
                    </label>
                  ))}
                </div>
              </div>
            ))}

            {renderSearchableTagInput({
              title: 'Eigenschappen',
              placeholder: 'Zoek eigenschap, bv. Zwembad of Open haard',
              options: featureOptions,
              values: eigenschapFilters,
              onChange: setEigenschapFilters,
              searchValue: eigenschapSearch,
              onSearchChange: setEigenschapSearch,
            })}
          </div>
        </section>

        {isMakelaar && (
        <section className="h-fit w-full rounded-3xl border border-[#E2E8F0] bg-white p-5 shadow-sm md:p-7">
          <h2 className="mb-4 text-2xl font-bold">Makelaar branding</h2>

          <p className="text-sm text-gray-500">
            Upload een makelaar logo dat zichtbaar wordt op de vastgoedkaart.
          </p>

          <input
            type="file"
            onChange={handleLogoUpload}
            className="mt-5 w-full rounded-xl border border-[#CBD5E1] bg-white p-4 text-[#071B4D]"
          />

          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
            <input
              className={inputClass}
              placeholder="Kantoornaam"
              value={makelaarKantoornaam}
              onChange={(e) => setMakelaarKantoornaam(e.target.value)}
            />

            <input
              className={inputClass}
              placeholder="Website"
              value={makelaarWebsite}
              onChange={(e) => setMakelaarWebsite(e.target.value)}
            />

            <input
              className={inputClass}
              placeholder="Telefoon kantoor"
              value={makelaarTelefoon}
              onChange={(e) => setMakelaarTelefoon(e.target.value)}
            />

            <input
              className={inputClass}
              placeholder="E-mail kantoor"
              type="email"
              value={makelaarEmail}
              onChange={(e) => setMakelaarEmail(e.target.value)}
            />

            <textarea
              className="min-h-28 rounded-xl border border-[#CBD5E1] bg-white p-4 text-[#071B4D] placeholder-gray-500 outline-none focus:border-[#071B4D] focus:ring-2 focus:ring-[#071B4D]/10 md:col-span-2"
              placeholder="Kantooradres"
              value={makelaarAdres}
              onChange={(e) => setMakelaarAdres(e.target.value)}
            />
          </div>

          {makelaarLogo && (
            <div className="mt-5 inline-flex overflow-hidden rounded-xl bg-white shadow-lg">
              {premiumPartner && (
                <div className="flex items-center bg-sky-500 px-3 text-xs font-black text-white">
                  Premium partner
                </div>
              )}

              <img
                src={makelaarLogo}
                alt="Makelaar logo"
                className="h-16 max-w-[180px] bg-white px-4 py-3 object-contain"
              />
            </div>
          )}

          <label className="mt-5 flex items-center gap-3 text-sm font-medium text-[#071B4D]">
            <input
              type="checkbox"
              checked={premiumPartner}
              onChange={(e) => setPremiumPartner(e.target.checked)}
            />
            Makelaar zichtbaar als premium partner
          </label>
        </section>
        )}

        <section className="h-fit w-full rounded-3xl border border-[#E2E8F0] bg-white p-5 shadow-sm md:p-7">
          <h2 className="mb-4 text-2xl font-bold">Vastgoedfoto's</h2>

          <p className="mb-5 text-sm text-gray-500">
            Upload minstens 5 duidelijke foto’s van het vastgoed. Met {selectedPresentationStyle.title} kun je maximaal {selectedPresentationStyle.maxPhotos} foto’s toevoegen.
          </p>

          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleImageUpload}
            className="w-full rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] p-4 text-[#071B4D]"
          />

          <p className="mt-2 text-sm text-gray-500">
            {images.length} / {selectedPresentationStyle.maxPhotos} foto’s geselecteerd
          </p>

          {images.length > 0 && (
            <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3">
              {images.slice(0, 6).map((photoUrl, index) => (
                <div key={photoUrl} className="relative overflow-hidden rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC]">
                  <img
                    src={photoUrl}
                    alt={`Vastgoed foto ${index + 1}`}
                    className="h-32 w-full object-cover"
                  />
                  {index === 0 && (
                    <span className="absolute left-2 top-2 rounded-full bg-[#071B4D] px-3 py-1 text-xs font-bold text-white">
                      Cover
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>



          </div>

          <div className="flex flex-col gap-8">
        {/* Energie section moved from left to right column, as the first section */}
        <section className="h-fit w-full rounded-3xl border border-[#E2E8F0] bg-white p-5 shadow-sm md:p-7">
          <h2 className="mb-4 text-2xl font-bold">Energie</h2>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <input
              className={`${inputClass} !bg-[#F8FAFC]`}
              placeholder="Primair energieverbruik (kWh/m²)"
              inputMode="numeric"
              value={primairEnergieverbruik}
              onChange={(e) => setPrimairEnergieverbruik(onlyNumbers(e.target.value))}
            />

            <input
              className={`${inputClass} !bg-[#F8FAFC]`}
              placeholder="Unieke code EPC/EPB"
              value={epcCode}
              onChange={(e) => setEpcCode(e.target.value)}
            />

            <div className="[&_button]:!bg-[#F8FAFC]">
              {renderSelectField({
                id: 'renovatieverplichting',
                value: renovatieverplichting,
                placeholder: 'Verplicht renovatiewerken uit te voeren',
                options: yesNoOptions,
                onChange: setRenovatieverplichting,
              })}
            </div>

            <input
              className={`${inputClass} !bg-[#F8FAFC]`}
              placeholder="CO₂ uitstoot"
              value={co2Uitstoot}
              onChange={(e) => setCo2Uitstoot(e.target.value)}
            />

            <input
              className={`${inputClass} !bg-[#F8FAFC]`}
              placeholder="Jaarlijks theoretisch totaal energieverbruik"
              value={jaarlijksEnergieverbruik}
              onChange={(e) => setJaarlijksEnergieverbruik(e.target.value)}
            />

            <div className="[&_button]:!bg-[#F8FAFC]">
              {renderSelectField({
                id: 'elektriciteitsattest',
                value: elektriciteitsattest,
                placeholder: 'Geldig keuringsattest elektriciteit',
                options: yesNoOptions,
                onChange: setElektriciteitsattest,
              })}
            </div>

            <div className="[&_button]:!bg-[#F8FAFC]">
              {renderSelectField({
                id: 'dagvaarding',
                value: dagvaarding,
                placeholder: 'Dagvaarding / herstelmaatregel opgelegd',
                options: yesNoOptions,
                onChange: setDagvaarding,
              })}
            </div>

            <div className="[&_button]:!bg-[#F8FAFC]">
              {renderSelectField({
                id: 'vlaamsMaatregelenregister',
                value: vlaamsMaatregelenregister,
                placeholder: 'Vlaamse maatregelenregister geraadpleegd',
                options: yesNoOptions,
                onChange: setVlaamsMaatregelenregister,
              })}
            </div>

            <div className="[&_button]:!bg-[#F8FAFC]">
              {renderSelectField({
                id: 'overstromingscertificaat',
                value: overstromingscertificaat,
                placeholder: 'Geldig overstromingscertificaat',
                options: yesNoOptions,
                onChange: setOverstromingscertificaat,
              })}
            </div>

            <div className="[&_button]:!bg-[#F8FAFC]">
              {renderSelectField({
                id: 'warmtepomp',
                value: warmtepomp,
                placeholder: 'Warmtepomp',
                options: yesNoOptions,
                onChange: setWarmtepomp,
              })}
            </div>

            <div className="[&_button]:!bg-[#F8FAFC]">
              {renderSelectField({
                id: 'zonnepanelen',
                value: zonnepanelen,
                placeholder: 'Fotovoltaïsche zonnepanelen',
                options: yesNoOptions,
                onChange: setZonnepanelen,
              })}
            </div>

            <div className="[&_button]:!bg-[#F8FAFC]">
              {renderSelectField({
                id: 'thermischeZonnepanelen',
                value: thermischeZonnepanelen,
                placeholder: 'Thermische zonnepanelen',
                options: yesNoOptions,
                onChange: setThermischeZonnepanelen,
              })}
            </div>
          </div>
        </section>

        {/* Algemeen section moved from left to right column, after Energie */}
        <section className="h-fit w-full rounded-[32px] border border-[#E2E8F0] bg-white p-8 shadow-[0_4px_18px_rgba(15,23,42,0.06)]">
          <h2 className="mb-6 text-[42px] font-black tracking-[-0.02em] text-[#071B4D]">
            Algemeen
          </h2>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="[&_button]:!bg-[#F8FAFC]">
              {renderSelectField({
                id: 'beschermdErfgoed',
                value: beschermdErfgoed,
                placeholder: 'Beschermd erfgoed',
                options: yesNoOptions,
                onChange: setBeschermdErfgoed,
              })}
            </div>

            <input
              className={`${inputClass} !bg-[#F8FAFC]`}
              placeholder="Gevelbreedte aan de straatkant (m)"
              inputMode="numeric"
              value={gevelbreedte}
              onChange={(e) => setGevelbreedte(onlyNumbers(e.target.value))}
            />

            <div className="[&_button]:!bg-[#F8FAFC]">
              {renderSelectField({
                id: 'asbestcertificaat',
                value: asbestcertificaat,
                placeholder: 'Asbestcertificaat beschikbaar',
                options: yesNoOptions,
                onChange: setAsbestcertificaat,
              })}
            </div>
          </div>
        </section>
        {/* Stedenbouw en risico's */}
        <section className="h-fit w-full rounded-3xl border border-[#E2E8F0] bg-white p-5 shadow-sm md:p-7">
          <h2 className="mb-4 text-2xl font-bold">Stedenbouw en risico's</h2>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="[&_button]:!bg-[#F8FAFC]">
              {renderSelectField({
                id: 'bouwvergunning',
                value: bouwvergunning,
                placeholder: 'Bouwvergunning',
                options: yesNoOptions,
                onChange: setBouwvergunning,
              })}
            </div>

            <input
              className={`${inputClass} !bg-[#F8FAFC]`}
              placeholder="Totale bebouwbare grondoppervlakte (m²)"
              inputMode="numeric"
              value={bebouwbareGrondoppervlakte}
              onChange={(e) => setBebouwbareGrondoppervlakte(onlyNumbers(e.target.value))}
            />

            <div className="[&_button]:!bg-[#F8FAFC]">
              {renderSelectField({
                id: 'kadastraalPlan',
                value: kadastraalPlan,
                placeholder: 'Kadastraal plan',
                options: yesNoOptions,
                onChange: setKadastraalPlan,
              })}
            </div>

            <div className="[&_button]:!bg-[#F8FAFC]">
              {renderSelectField({
                id: 'voorkeurrechtHuurder',
                value: voorkeurrechtHuurder,
                placeholder: 'Voorkeurrecht voor de huurder',
                options: yesNoOptions,
                onChange: setVoorkeurrechtHuurder,
              })}
            </div>

            <div className="[&_button]:!bg-[#F8FAFC]">
              {renderSelectField({
                id: 'bouwverplichting',
                value: bouwverplichting,
                placeholder: 'Bouwverplichting',
                options: yesNoOptions,
                onChange: setBouwverplichting,
              })}
            </div>

            <div className="[&_button]:!bg-[#F8FAFC]">
              {renderSelectField({
                id: 'verkavelingsvergunning',
                value: verkavelingsvergunning,
                placeholder: 'Verkavelingsvergunning',
                options: yesNoOptions,
                onChange: setVerkavelingsvergunning,
              })}
            </div>

            <div className="[&_button]:!bg-[#F8FAFC]">
              {renderSelectField({
                id: 'voorkooprecht',
                value: voorkooprecht,
                placeholder: 'Voorkooprecht',
                options: yesNoOptions,
                onChange: setVoorkooprecht,
              })}
            </div>

            <input
              className={`${inputClass} !bg-[#F8FAFC]`}
              placeholder="Meest recente stedenbouwkundige bestemming"
              value={stedenbouwkundigeBestemming}
              onChange={(e) => setStedenbouwkundigeBestemming(e.target.value)}
            />

            <input
              className={`${inputClass} !bg-[#F8FAFC]`}
              placeholder="Overstroming zonetype"
              value={overstromingZonetype}
              onChange={(e) => setOverstromingZonetype(e.target.value)}
            />

            <div className="[&_button]:!bg-[#F8FAFC]">
              {renderSelectField({
                id: 'pScore',
                value: pScore,
                placeholder: 'P-score',
                options: scoreOptions,
                onChange: setPScore,
              })}
            </div>

            <div className="[&_button]:!bg-[#F8FAFC]">
              {renderSelectField({
                id: 'gScore',
                value: gScore,
                placeholder: 'G-score',
                options: scoreOptions,
                onChange: setGScore,
              })}
            </div>
          </div>
        </section>



        {/* Publicatie */}
        <section className="h-fit w-full rounded-3xl border border-[#E2E8F0] bg-white p-5 shadow-sm md:p-6">
          <h2 className="mb-4 text-2xl font-bold">Publicatie</h2>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowPublicationOptions((current) => !current)}
                onBlur={() => {
                  window.setTimeout(() => setShowPublicationOptions(false), 120)
                }}
                className={`${inputClass} flex h-[58px] w-full items-center justify-between text-left font-normal !bg-[#F8FAFC]`}
              >
                <span>{publicatiestatus}</span>
                <span className="text-[#071B4D]">⌄</span>
              </button>

              {showPublicationOptions && (
                <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-30 rounded-2xl border border-[#CBD5E1] bg-white p-2 shadow-xl">
                  {publicationStatuses.map((status) => (
                    <button
                      key={status}
                      type="button"
                      onMouseDown={() => {
                        setPublicatiestatus(status)
                        setShowPublicationOptions(false)
                      }}
                      className={`block w-full rounded-xl px-4 py-3 text-left font-semibold transition hover:bg-[#EFF6FF] ${
                        publicatiestatus === status
                          ? 'bg-[#EFF6FF] text-[#071B4D]'
                          : 'text-[#071B4D]'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Financieel */}
        <section className="h-fit w-full rounded-3xl border border-[#E2E8F0] bg-white p-5 shadow-sm md:p-6">
          <h2 className="mb-4 text-2xl font-bold">Financieel</h2>

          <p className="text-lg text-gray-500">
            Vraagprijs exclusief notariskosten (excl. eventuele registratiekosten)
          </p>

          <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] p-4">
              <p className="text-sm font-semibold text-gray-500">Prijs</p>
              <p className="mt-1 text-2xl font-black text-[#071B4D]">
                {formatPrice(price)}
              </p>
            </div>
          </div>
        </section>

          </div>
        </div>

        <div className="grid grid-cols-1 items-start gap-8 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
          <div className="flex h-full flex-col pt-[72px]">
            {/* Presentatiestijl */}
            <section className="h-fit w-full rounded-3xl border border-[#E2E8F0] bg-white p-5 shadow-sm md:p-7">
              <div className="mb-6 text-center">
                <h2 className="text-2xl font-black text-[#071B4D]">Presentatiestijl</h2>
                <p className="mt-2 text-sm text-gray-500">
                  Kies hoe je woning aan kopers wordt getoond. Je kunt dit later nog aanpassen.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
                {presentationStyles.map((style) => {
                  const isSelected = presentationStyle === style.id
                  const accentClasses =
                    style.accent === 'emerald'
                      ? 'text-emerald-700'
                      : style.accent === 'purple'
                        ? 'text-purple-700'
                        : 'text-[#2563EB]'
                  const pillClasses =
                    style.accent === 'emerald'
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                      : style.accent === 'purple'
                        ? 'border-purple-200 bg-purple-50 text-purple-700'
                        : 'border-blue-200 bg-blue-50 text-[#2563EB]'

                  return (
                    <button
                      key={style.id}
                      type="button"
                      onClick={() => setPresentationStyle(style.id)}
                      className={`relative rounded-[24px] border bg-white p-4 text-left transition duration-200 hover:-translate-y-1 hover:border-[#071B4D] hover:shadow-[0_12px_30px_rgba(15,23,42,0.10)] ${
                        isSelected
                          ? 'border-[#071B4D] shadow-[0_14px_36px_rgba(7,27,77,0.12)] ring-1 ring-[#071B4D]/10'
                          : 'border-[#D9E2F1] shadow-[0_4px_14px_rgba(15,23,42,0.05)]'
                      }`}
                    >
                      <div className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#071B4D] text-sm font-black text-[#071B4D]">
                        i
                      </div>

                      {style.id === 'story' && (
                        <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#2563EB] px-4 py-1 text-[11px] font-black uppercase tracking-wide text-white shadow-md">
                          Aanbevolen
                        </div>
                      )}

                      <div className="mt-4 text-center">
                        <h3 className="text-xl font-black text-[#071B4D]">{style.title}</h3>
                        <p className="mt-2 min-h-[38px] text-sm font-medium leading-snug text-[#071B4D]">
                          {style.description}
                        </p>
                      </div>

                      <div className="my-5 flex min-h-[120px] items-center justify-center">
                        {style.id === 'focus' && (
                          <div className="overflow-hidden rounded-[18px] bg-white shadow-sm">
                            <div className="flex h-[96px] w-[200px] overflow-hidden rounded-[16px] bg-white">
                              <img
                                src="https://images.unsplash.com/photo-1600607688969-a5bfcd646154?auto=format&fit=crop&w=900&q=80"
                                alt="Focus presentatie voorbeeld"
                                className="h-full w-[56%] object-cover"
                              />
                              <div className="flex flex-1 flex-col justify-between bg-white p-3">
                                <div>
                                  <div className="h-3 w-20 rounded-full bg-[#071B4D]/15" />
                                  <div className="mt-2 h-2 w-14 rounded-full bg-[#071B4D]/10" />
                                  <div className="mt-1 h-2 w-16 rounded-full bg-[#071B4D]/10" />
                                </div>
                                <div className="w-fit rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700">
                                  Compact
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {style.id === 'story' && (
                          <div className="overflow-hidden rounded-[18px] bg-white shadow-sm">
                            <div className="relative h-[110px]">
                              <img
                                src="https://images.unsplash.com/photo-1600607688969-a5bfcd646154?auto=format&fit=crop&w=900&q=80"
                                alt="Story presentatie voorbeeld"
                                className="h-full w-full object-cover"
                              />
                              <div className="absolute bottom-3 left-3 rounded-full bg-white/90 px-3 py-1 text-[10px] font-bold text-[#071B4D] shadow-sm">
                                Featured
                              </div>
                            </div>
                            <div className="space-y-2 p-3">
                              <div className="h-3 w-24 rounded-full bg-[#071B4D]/15" />
                              <div className="h-2 w-full rounded-full bg-[#071B4D]/10" />
                              <div className="grid grid-cols-4 gap-1 pt-1">
                                {[
                                  'https://images.unsplash.com/photo-1600607688969-a5bfcd646154?auto=format&fit=crop&w=900&q=80',
                                  'https://images.unsplash.com/photo-1600607688969-a5bfcd646154?auto=format&fit=crop&w=900&q=80',
                                  'https://images.unsplash.com/photo-1600607688969-a5bfcd646154?auto=format&fit=crop&w=900&q=80',
                                  'https://images.unsplash.com/photo-1600607688969-a5bfcd646154?auto=format&fit=crop&w=900&q=80',
                                ].map((photoUrl, index) => (
                                  <img
                                    key={`${photoUrl}-${index}`}
                                    src={photoUrl}
                                    alt="Story miniatuur voorbeeld"
                                    className="h-7 rounded-lg object-cover"
                                  />
                                ))}
                              </div>
                            </div>
                          </div>
                        )}

                        {style.id === 'signature' && (
                          <div className="overflow-hidden rounded-[18px] bg-white shadow-sm">
                            <div className="relative grid h-[130px] grid-cols-[1.55fr_0.72fr] gap-1 bg-white p-1">
                              <div className="relative overflow-hidden rounded-[14px]">
                                <img
                                  src="https://images.unsplash.com/photo-1600607688969-a5bfcd646154?auto=format&fit=crop&w=900&q=80"
                                  alt="Signature presentatie voorbeeld"
                                  className="h-full w-full object-cover"
                                />
                                <div className="absolute bottom-2 left-2 rounded-full bg-[#071B4D]/90 px-3 py-1 text-[10px] font-black uppercase tracking-wide text-white shadow-sm">
                                  Premium gallery
                                </div>
                              </div>
                              <div className="grid grid-rows-2 gap-1">
                                <img
                                  src="https://images.unsplash.com/photo-1600607688969-a5bfcd646154?auto=format&fit=crop&w=900&q=80"
                                  alt="Signature miniatuur voorbeeld"
                                  className="h-full w-full rounded-[12px] object-cover"
                                />
                                <div className="relative overflow-hidden rounded-[12px]">
                                  <img
                                    src="https://images.unsplash.com/photo-1600607688969-a5bfcd646154?auto=format&fit=crop&w=900&q=80"
                                    alt="Signature miniatuur voorbeeld"
                                    className="h-full w-full object-cover"
                                  />
                                  <div className="absolute inset-0 flex items-center justify-center bg-[#071B4D]/55 text-xs font-black text-white">
                                    +27
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="space-y-1.5 p-2">
                              <div className="h-3 w-28 rounded-full bg-[#071B4D]/20" />
                              <div className="h-2 w-24 rounded-full bg-[#071B4D]/10" />
                              <div className="flex gap-1 pt-1">
                                {[1, 2, 3].map((item) => (
                                  <div key={item} className="h-4 flex-1 rounded-md bg-purple-50" />
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2 border-t border-[#EEF2F7] pt-3">
                        <div className="flex items-center gap-3 text-[#071B4D]">
                          <span className={`text-lg font-black ${accentClasses}`}>✓</span>
                          <span className="text-base font-bold">{style.maxPhotos} foto’s</span>
                        </div>
                        {style.bullets.map((bullet) => (
                          <div key={bullet} className="flex items-start gap-2 text-sm font-medium text-[#071B4D]">
                            <span className={`mt-0.5 text-lg font-black ${accentClasses}`}>✓</span>
                            <span>{bullet}</span>
                          </div>
                        ))}
                        <div className={`mt-3 inline-flex rounded-full border px-3 py-1 text-xs font-black ${pillClasses}`}>
                          Tot {style.maxPhotos} foto’s
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>

              <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-[#071B4D]">
                <span className="font-black">Goed om te weten:</span>{' '}
                {selectedPresentationStyle.title} laat maximaal {selectedPresentationStyle.maxPhotos} foto’s toe. De eerste foto wordt gebruikt als cover.
              </div>
            </section>
          </div>

          <div className="flex h-full flex-col">
            {/* Contactgegevens */}
            <section className="h-fit w-full rounded-3xl border border-[#E2E8F0] bg-white p-5 shadow-sm md:p-7">
              <h2 className="mb-4 text-2xl font-bold">Contactgegevens</h2>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <input
                  className={`${inputClass} !bg-[#F8FAFC]`}
                  placeholder="Naam contactpersoon"
                  value={contactNaam}
                  onChange={(e) => setContactNaam(e.target.value)}
                />

                <input
                  className={`${inputClass} !bg-[#F8FAFC]`}
                  placeholder="E-mailadres"
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                />

                <input
                  className={`${inputClass} !bg-[#F8FAFC]`}
                  placeholder="Telefoonnummer"
                  value={contactTelefoon}
                  onChange={(e) => setContactTelefoon(e.target.value)}
                />

                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowVisitOptions((current) => !current)}
                    onBlur={() => {
                      window.setTimeout(() => setShowVisitOptions(false), 120)
                    }}
                    className={`${inputClass} flex h-[58px] w-full items-center justify-between text-left font-normal !bg-[#F8FAFC]`}
                  >
                    <span>{bezoekMogelijk || 'Bezoek mogelijk op afspraak'}</span>
                    <span className="text-[#071B4D]">⌄</span>
                  </button>

                  {showVisitOptions && (
                    <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-30 rounded-2xl border border-[#CBD5E1] bg-white p-2 shadow-xl">
                      {yesNoOptions.map((option) => (
                        <button
                          key={option}
                          type="button"
                          onMouseDown={() => {
                            setBezoekMogelijk(option)
                            setShowVisitOptions(false)
                          }}
                          className={`block w-full rounded-xl px-4 py-3 text-left font-semibold transition hover:bg-[#EFF6FF] ${
                            bezoekMogelijk === option
                              ? 'bg-[#EFF6FF] text-[#071B4D]'
                              : 'text-[#071B4D]'
                          }`}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <input
                  className={`${inputClass} md:col-span-2 !bg-[#F8FAFC]`}
                  placeholder="Beschikbare bezoekmomenten"
                  value={beschikbareBezoekmomenten}
                  onChange={(e) => setBeschikbareBezoekmomenten(e.target.value)}
                />

                <textarea
                  className="min-h-32 rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] p-4 text-[#071B4D] placeholder-gray-500 outline-none focus:border-[#071B4D] focus:ring-2 focus:ring-[#071B4D]/10 md:col-span-2"
                  placeholder="Extra bericht voor geïnteresseerden"
                  value={contactBericht}
                  onChange={(e) => setContactBericht(e.target.value)}
                />
              </div>
            </section>
          </div>
        </div>

        {validationWarnings.length > 0 && (
          <section className="rounded-3xl border border-amber-200 bg-amber-50 p-5 text-[#071B4D] shadow-sm md:p-6">
            <p className="text-lg font-black text-amber-900">
              Controleer deze gegevens voor je opslaat
            </p>
            <ul className="mt-3 space-y-2 text-sm font-bold leading-6 text-amber-800">
              {validationWarnings.map((warning) => (
                <li key={warning}>• {warning}</li>
              ))}
            </ul>
            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => {
                  if (pendingSaveMode === 'draft') {
                    handleSaveDraft(true)
                    return
                  }

                  handleAddProperty(true)
                }}
                className="rounded-xl bg-[#071B4D] px-5 py-3 text-sm font-black text-white transition hover:bg-blue-800"
              >
                Toch opslaan
              </button>
              <button
                type="button"
                onClick={() => {
                  setValidationWarnings([])
                  setPendingSaveMode(null)
                }}
                className="rounded-xl border border-amber-200 bg-white px-5 py-3 text-sm font-black text-amber-800 transition hover:bg-amber-100"
              >
                Aanpassen
              </button>
            </div>
          </section>
        )}

        <div className="sticky bottom-5 z-20 flex justify-center gap-3 pointer-events-none">
          <button
            onClick={() => handleSaveDraft()}
            className="pointer-events-auto h-10 w-full max-w-[160px] rounded-xl border border-[#CBD5E1] bg-white px-5 text-sm font-bold text-[#071B4D] shadow-[0_10px_24px_rgba(15,23,42,0.10)] transition hover:scale-[1.01] hover:bg-[#F8FAFC]"
          >
            Opslaan
          </button>

          <button
            onClick={() => handleAddProperty()}
            className="pointer-events-auto h-10 w-full max-w-[160px] rounded-xl bg-[#071B4D] px-5 text-sm font-bold text-white shadow-[0_10px_26px_rgba(15,23,42,0.16)] transition hover:scale-[1.01] hover:opacity-90"
          >
            Toevoegen
          </button>
        </div>
      </div>
    </div>
  )
}
