export type RenovatieIndicatie =
  | 'Geen directe renovatie-indicatie'
  | 'Lichte opfrissing'
  | 'Gerichte renovatie'
  | 'Grondige renovatie'
  | 'Totaalrenovatie mogelijk'

export type RenovatieScan = {
  renovatieniveau: RenovatieIndicatie
  renovatiecategorie: string
  betrouwbaarheid: 'Laag' | 'Gemiddeld' | 'Hoog'
  pluspunten: string[]
  aandachtspunten: string[]
  gebaseerdOp: string[]
  beperkteFotoInformatie: boolean
}

const LIMITED_PHOTO_TEXT = 'Beperkte foto-informatie beschikbaar.'

function numberValue(value: unknown) {
  const number = Number(value)
  if (Number.isFinite(number)) return number

  if (typeof value === 'string') {
    const match = value.replace(',', '.').match(/\d+(?:\.\d+)?/)
    const parsed = match ? Number(match[0]) : 0

    return Number.isFinite(parsed) ? parsed : 0
  }

  return 0
}

function hasKnownValue(value: unknown) {
  return value !== null && value !== undefined && String(value).trim() !== ''
}

function normalizeText(...values: unknown[]) {
  return values.filter(hasKnownValue).join(' ').toLowerCase()
}

function firstKnownValue(...values: unknown[]) {
  return values.find(hasKnownValue)
}

function textContainsAny(text: string, signals: string[]) {
  return signals.some((signal) => hasTextSignal(text, signal))
}

function uniqueList(items: string[]) {
  return Array.from(new Set(items))
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function hasTextSignal(text: string, signal: string) {
  if (signal.includes(' ')) return text.includes(signal)

  return new RegExp(`\\b${escapeRegExp(signal)}\\b`, 'u').test(text)
}

const PROPERTY_IMAGE_FIELDS = [
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

const IMAGE_VALUE_FIELDS = [
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

function addPhotoReferences(
  value: unknown,
  references: string[],
  fallbackKey: string,
) {
  if (value === null || value === undefined) return

  if (Array.isArray(value)) {
    value.forEach((item, index) =>
      addPhotoReferences(item, references, `${fallbackKey}.${index}`),
    )
    return
  }

  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) return

    if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
      try {
        addPhotoReferences(JSON.parse(trimmed), references, fallbackKey)
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

    IMAGE_VALUE_FIELDS.forEach((field) => {
      if (hasKnownValue(record[field])) {
        foundNestedReference = true
        addPhotoReferences(record[field], references, `${fallbackKey}.${field}`)
      }
    })

    if (!foundNestedReference && Object.keys(record).length > 0) {
      references.push(fallbackKey)
    }

    return
  }

  references.push(`${fallbackKey}:${String(value)}`)
}

function getPhotoCount(
  property: Record<string, unknown>,
  providedPhotoCount?: number,
) {
  if (Number.isFinite(providedPhotoCount)) {
    return Math.max(0, Math.floor(providedPhotoCount || 0))
  }

  const propertyPhotoCount = numberValue(
    property.photo_count ||
      property.photoCount ||
      property.foto_count ||
      property.fotoCount ||
      property.aantal_fotos,
  )

  if (propertyPhotoCount > 0) return Math.floor(propertyPhotoCount)

  const references: string[] = []

  PROPERTY_IMAGE_FIELDS.forEach((field) => {
    addPhotoReferences(property[field], references, field)
  })

  return new Set(references).size
}

function getAreaValue(property: Record<string, unknown>) {
  return firstKnownValue(
    property.bewoonbare_oppervlakte,
    property.woonoppervlakte,
    property.livingArea,
    property.living_area,
    property.oppervlakte,
    property.area,
  )
}

function getEpcBand(epc: string) {
  const label = epc.trim().toUpperCase()

  if (['A+++++', 'A++++', 'A+++', 'A++', 'A+', 'A'].includes(label))
    return 'good'
  if (['B', 'C'].includes(label)) return 'average'
  if (['D', 'E', 'F'].includes(label)) return 'attention'
  if (label === 'G') return 'poor'

  return 'unknown'
}

function isNoDirectRenovationEpcLabel(epc: string) {
  const label = epc.trim().toUpperCase()

  return ['A+', 'A'].includes(label)
}

function formatKnownValue(value: unknown, fallback = 'niet beschikbaar') {
  return hasKnownValue(value) ? String(value).trim() : fallback
}

function getDescriptionKeywordSummary(matchedSignals: string[]) {
  if (matchedSignals.length === 0)
    return 'geen duidelijke renovatiekeywords gevonden'

  return uniqueList(matchedSignals).slice(0, 8).join(', ')
}

export function getRenovatieScan(
  property: Record<string, unknown>,
  photoCount?: number,
): RenovatieScan {
  const areaValue = getAreaValue(property)
  const area = numberValue(areaValue)
  const buildYearValue = firstKnownValue(
    property.bouwjaar,
    property.build_year,
    property.buildYear,
    property.year_built,
    property.yearBuilt,
  )
  const buildYear = numberValue(buildYearValue)
  const bathroomValue = firstKnownValue(property.badkamers, property.bathrooms)
  const bathrooms = numberValue(bathroomValue)
  const epcValue = firstKnownValue(
    property.epc,
    property.epc_label,
    property.epcLabel,
    property.epc_code,
    property.EPC,
  )
  const epc = String(epcValue || '')
  const epcBand = getEpcBand(epc)
  const availablePhotoCount = getPhotoCount(property, photoCount)
  const beperkteFotoInformatie = availablePhotoCount < 3

  const text = normalizeText(
    property.title,
    property.description,
    property.beschrijving,
    property.location_description,
    property.keywords,
    property.pluspunten,
    property.woningkenmerken,
    property.renovatiestatus,
    property.renovatie_toestand,
    property.renovatieadvies,
    property.soort_bouw,
  )

  const readySignals = [
    'instapklaar',
    'gerenoveerd',
    'vernieuwd',
    'recent',
    'recente',
    'modern',
    'moderne',
    'moderne keuken',
    'nieuwe badkamer',
    'energiezuinig',
    'nieuwbouw',
  ]
  const lightSignals = [
    'op te frissen',
    'opfrissen',
    'lichte renovatie',
    'cosmetisch',
  ]
  const heavySignals = [
    'renoveren',
    'renovatie',
    'te renoveren',
    'totaalrenovatie',
    'grondig te renoveren',
    'renovatieplicht',
    'renovatieverplichting',
    'kluswoning',
    'vocht',
    'schade',
    'oud',
    'verouderd',
    'enkel glas',
    'elektriciteit',
    'dak',
    'isolatie',
    'afbraak',
  ]
  const matchedReadySignals = readySignals.filter((signal) =>
    hasTextSignal(text, signal),
  )
  const matchedLightSignals = lightSignals.filter((signal) =>
    hasTextSignal(text, signal),
  )
  const matchedHeavySignals = heavySignals.filter((signal) =>
    hasTextSignal(text, signal),
  )
  const matchedDescriptionSignals = uniqueList([
    ...matchedReadySignals,
    ...matchedLightSignals,
    ...matchedHeavySignals,
  ])
  const hasReadySignal = matchedReadySignals.length > 0
  const hasLightSignal = matchedLightSignals.length > 0
  const hasHeavySignal = matchedHeavySignals.length > 0
  const hasStrongNegativeNoDirectSignal = textContainsAny(text, [
    'vocht',
    'schade',
    'renovatieplicht',
    'renovatieverplichting',
    'totaalrenovatie',
    'dak vernieuwen',
    'elektriciteit vernieuwen',
  ])
  const isNoDirectRenovationCase =
    isNoDirectRenovationEpcLabel(epc) &&
    buildYear >= 2018 &&
    !hasStrongNegativeNoDirectSignal

  let score = 20
  const pluspunten: string[] = []
  const aandachtspunten: string[] = []

  if (availablePhotoCount >= 5)
    pluspunten.push(
      'Meerdere foto’s beschikbaar voor een betere eerste inschatting.',
    )
  if (beperkteFotoInformatie) aandachtspunten.push(LIMITED_PHOTO_TEXT)

  if (area > 250) {
    score += 20
    aandachtspunten.push(
      'Zeer grote bewoonbare oppervlakte kan renovatiewerken omvangrijker maken.',
    )
  } else if (area > 150) {
    score += 12
    aandachtspunten.push(
      'Grotere bewoonbare oppervlakte kan renovatiewerken omvangrijker maken.',
    )
  } else if (area >= 80) {
    score += 4
  } else if (area > 0) {
    score -= 6
    pluspunten.push(
      'Compactere oppervlakte kan werken overzichtelijker houden.',
    )
  } else {
    aandachtspunten.push(
      'Bewoonbare oppervlakte ontbreekt in de beschikbare gegevens.',
    )
  }

  if (buildYear) {
    if (buildYear < 1950) {
      score += 22
      aandachtspunten.push(
        'Ouder bouwjaar: controleer structuur, technieken, dak en isolatie extra zorgvuldig.',
      )
    } else if (buildYear < 1985) {
      score += 14
      aandachtspunten.push(
        'Bouwperiode wijst op mogelijke verouderde technieken of isolatie.',
      )
    } else if (buildYear >= 2010) {
      score -= 12
      pluspunten.push('Recent bouwjaar verlaagt doorgaans de renovatiekans.')
    }
  } else {
    aandachtspunten.push('Bouwjaar ontbreekt in de beschikbare gegevens.')
  }

  if (epcBand === 'good') {
    score -= 18
    pluspunten.push(
      `EPC ${epc.toUpperCase()} wijst op een sterke energetische uitgangspositie.`,
    )
  } else if (epcBand === 'average') {
    pluspunten.push(
      `EPC ${epc.toUpperCase()} geeft een neutrale tot redelijke energetische basis aan.`,
    )
  } else if (epcBand === 'attention') {
    score += 18
    aandachtspunten.push(
      `EPC ${epc.toUpperCase()} verhoogt de indicatieve kans op energetische renovatiewerken.`,
    )
  } else if (epcBand === 'poor') {
    score += 28
    aandachtspunten.push(
      `EPC ${epc.toUpperCase()} wijst op verhoogde kans op energiewerken.`,
    )
  } else {
    aandachtspunten.push(
      'EPC-label ontbreekt of is niet duidelijk beschikbaar.',
    )
  }

  if (bathrooms >= 3 && !hasReadySignal) {
    score += 8
    aandachtspunten.push('Meerdere badkamers kunnen extra afwerking vragen.')
  } else if (bathrooms >= 2 && !hasReadySignal) {
    score += 4
    aandachtspunten.push('Meerdere badkamers kunnen extra afwerking vragen.')
  } else if (bathrooms >= 2) {
    pluspunten.push(
      'Meerdere badkamers zijn opgegeven; beschrijving wijst ook op recente of vernieuwde afwerking.',
    )
  } else if (!hasKnownValue(bathroomValue)) {
    aandachtspunten.push(
      'Aantal badkamers ontbreekt in de beschikbare gegevens.',
    )
  }

  if (hasReadySignal) {
    score -= 18
    pluspunten.push('Beschrijving bevat instapklare of vernieuwde signalen.')
  }
  if (hasLightSignal) {
    score += 18
    aandachtspunten.push(
      'Beschrijving bevat signalen voor opfrissing of lichte renovatie.',
    )
  }
  if (hasHeavySignal) {
    score += 35
    aandachtspunten.push('Beschrijving bevat duidelijke renovatiesignalen.')
  }

  const clampedScore = Math.max(0, Math.min(100, score))
  const renovatieniveau: RenovatieScan['renovatieniveau'] =
    clampedScore < 25
      ? 'Lichte opfrissing'
      : clampedScore < 50
        ? 'Gerichte renovatie'
        : clampedScore < 75
          ? 'Grondige renovatie'
          : 'Totaalrenovatie mogelijk'

  if (clampedScore < 25) {
    pluspunten.push(
      'Renovatie-indicatie laag op basis van de beschikbare woningdata.',
    )
  } else if (clampedScore < 65) {
    aandachtspunten.push(
      'Renovatie-indicatie gemiddeld op basis van de beschikbare woningdata.',
    )
  } else {
    aandachtspunten.push(
      'Renovatie-indicatie hoog op basis van de beschikbare woningdata.',
    )
  }

  const renovatiecategorie =
    clampedScore < 25
      ? 'Cosmetische opfrissing en beperkte afwerking'
      : clampedScore < 50
        ? 'Gerichte werken aan comfort, afwerking of technieken'
        : clampedScore < 75
          ? 'Meerdere technische en energetische werken waarschijnlijk'
          : 'Zeer ingrijpende renovatie of renovatieplicht mogelijk'

  const gebaseerdOp = [
    `EPC: ${formatKnownValue(epcValue)}`,
    `Bouwjaar: ${formatKnownValue(buildYearValue)}`,
    `Oppervlakte: ${formatKnownValue(areaValue)}`,
    `Aantal badkamers: ${formatKnownValue(bathroomValue)}`,
    `Beschrijving-keywords: ${getDescriptionKeywordSummary(matchedDescriptionSignals)}`,
    `Aantal beschikbare foto’s: ${availablePhotoCount}`,
  ]

  const knownDataPoints = [
    areaValue,
    epcValue,
    buildYearValue,
    bathroomValue,
    matchedDescriptionSignals.length > 0
      ? matchedDescriptionSignals.join(',')
      : null,
    availablePhotoCount > 0 ? availablePhotoCount : null,
  ].filter(hasKnownValue).length

  const betrouwbaarheid: RenovatieScan['betrouwbaarheid'] =
    availablePhotoCount >= 5 && knownDataPoints >= 5
      ? 'Hoog'
      : knownDataPoints >= 4 || availablePhotoCount >= 5
        ? 'Gemiddeld'
        : 'Laag'

  if (isNoDirectRenovationCase) {
    const hasVisiblePhotos = availablePhotoCount > 0
    const noDirectAttentionExclusions = [
      LIMITED_PHOTO_TEXT,
      'Grotere bewoonbare oppervlakte kan renovatiewerken omvangrijker maken.',
      'Zeer grote bewoonbare oppervlakte kan renovatiewerken omvangrijker maken.',
      'Renovatie-indicatie laag op basis van de beschikbare woningdata.',
      'Beschrijving bevat duidelijke renovatiesignalen.',
    ]
    const filteredAandachtspunten = aandachtspunten.filter(
      (item) =>
        !noDirectAttentionExclusions.includes(item) ||
        (!hasVisiblePhotos && item === LIMITED_PHOTO_TEXT),
    )

    return {
      renovatieniveau: 'Geen directe renovatie-indicatie',
      renovatiecategorie: 'Instapklaar / enkel klein onderhoud',
      betrouwbaarheid,
      pluspunten: uniqueList([
        'Geen duidelijke renovatiesignalen gevonden op basis van de beschikbare gegevens.',
        ...pluspunten,
      ]).slice(0, 5),
      aandachtspunten: uniqueList([
        'Geen directe renovatie-indicatie op basis van beschikbare gegevens.',
        ...filteredAandachtspunten,
      ]).slice(0, 6),
      gebaseerdOp,
      beperkteFotoInformatie: !hasVisiblePhotos && beperkteFotoInformatie,
    }
  }

  const fallbackPluspunten = [
    'Beschikbare woningdata is gebruikt voor een indicatieve renovatie-inschatting.',
  ]
  const fallbackAandachtspunten = [
    'Controleer de technische staat altijd tijdens een plaatsbezoek.',
  ]

  return {
    renovatieniveau,
    renovatiecategorie,
    betrouwbaarheid,
    pluspunten:
      uniqueList(pluspunten).slice(0, 5).length > 0
        ? uniqueList(pluspunten).slice(0, 5)
        : fallbackPluspunten,
    aandachtspunten:
      uniqueList(aandachtspunten).slice(0, 6).length > 0
        ? uniqueList(aandachtspunten).slice(0, 6)
        : fallbackAandachtspunten,
    gebaseerdOp,
    beperkteFotoInformatie,
  }
}
