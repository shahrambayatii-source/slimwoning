export type RenovatieIndicatie =
  | 'Geen directe renovatiebehoefte vastgesteld'
  | 'Lichte opfrissing'
  | 'Gerichte renovatie'
  | 'Grondige renovatie'
  | 'Totaalrenovatie mogelijk'

export type RenovatieVisualCondition =
  | 'instapklaar'
  | 'lichte_opfrissing'
  | 'gerichte_renovatie'
  | 'grondige_renovatie'
  | 'totaalrenovatie'

export type RenovatieAreaStatus =
  | 'goed'
  | 'opfrissen'
  | 'renoveren'
  | 'ontbreekt'
  | 'onduidelijk'

export type RenovatiePhotoAnalysis = {
  visualCondition: RenovatieVisualCondition
  confidence: 'laag' | 'gemiddeld' | 'hoog'
  visibleSignals: string[]
  roomsObserved: string[]
  renovationAreas: {
    walls: RenovatieAreaStatus
    floors: RenovatieAreaStatus
    windows: RenovatieAreaStatus
    kitchen: RenovatieAreaStatus
    bathroom: RenovatieAreaStatus
    ceiling: RenovatieAreaStatus
  }
  attentionPoints: string[]
  positivePoints: string[]
  safeSummary: string
}

export type RenovatieScan = {
  renovatieniveau: RenovatieIndicatie
  renovatiecategorie: string
  betrouwbaarheid: 'Laag' | 'Gemiddeld' | 'Hoog'
  pluspunten: string[]
  aandachtspunten: string[]
  gebaseerdOp: string[]
  beperkteFotoInformatie: boolean
  visueleObservaties: string[]
  kamersGezien: string[]
  renovatiezones: RenovatiePhotoAnalysis['renovationAreas']
  fotoAnalyseSamenvatting: string
  fotoAnalyseStatus: 'geanalyseerd' | 'niet_geanalyseerd'
}

const LIMITED_PHOTO_TEXT = 'Beperkte foto-informatie beschikbaar.'

const VISUAL_CONDITION_ORDER: RenovatieVisualCondition[] = [
  'instapklaar',
  'lichte_opfrissing',
  'gerichte_renovatie',
  'grondige_renovatie',
  'totaalrenovatie',
]

const DEFAULT_RENOVATION_AREAS: RenovatiePhotoAnalysis['renovationAreas'] = {
  walls: 'onduidelijk',
  floors: 'onduidelijk',
  windows: 'onduidelijk',
  kitchen: 'onduidelijk',
  bathroom: 'onduidelijk',
  ceiling: 'onduidelijk',
}

function sanitizeRenovatieText(value: string) {
  return value
    .replace(/moet vervangen worden/gi, 'vraagt controle')
    .replace(/is kapot/gi, 'lijkt niet in recente staat')
    .replace(/is technisch afgekeurd/gi, 'is niet vast te stellen op basis van foto’s')
    .replace(/elektriciteit is slecht/gi, 'technieken vragen controle')
    .replace(/vocht aanwezig/gi, 'zichtbare sporen vragen controle')
    .replace(/\bvocht\b/gi, 'zichtbare sporen')
    .replace(/\bkapot\b/gi, 'niet in recente staat')
    .trim()
}

function sanitizeRenovatieList(items: string[]) {
  return uniqueList(items.map(sanitizeRenovatieText).filter(Boolean))
}

function visualConditionToRenovatieniveau(
  condition: RenovatieVisualCondition,
): RenovatieIndicatie {
  if (condition === 'instapklaar') return 'Geen directe renovatiebehoefte vastgesteld'
  if (condition === 'lichte_opfrissing') return 'Lichte opfrissing'
  if (condition === 'gerichte_renovatie') return 'Gerichte renovatie'
  if (condition === 'grondige_renovatie') return 'Grondige renovatie'

  return 'Totaalrenovatie mogelijk'
}

function visualConditionToCategorie(condition: RenovatieVisualCondition) {
  if (condition === 'instapklaar') return 'Instapklaar op basis van zichtbare elementen'
  if (condition === 'lichte_opfrissing') return 'Lichte opfrissing op basis van zichtbare afwerking'
  if (condition === 'gerichte_renovatie') return 'Gerichte renovatiezones zichtbaar in de foto’s'
  if (condition === 'grondige_renovatie') return 'Meerdere zichtbare elementen lijken verouderd'

  return 'Zichtbaar onafgewerkte of zeer ingrijpende renovatiezones'
}

function confidenceToBetrouwbaarheid(
  confidence: RenovatiePhotoAnalysis['confidence'],
): RenovatieScan['betrouwbaarheid'] {
  if (confidence === 'hoog') return 'Hoog'
  if (confidence === 'gemiddeld') return 'Gemiddeld'

  return 'Laag'
}

function getVisualSeverity(condition: RenovatieVisualCondition) {
  return VISUAL_CONDITION_ORDER.indexOf(condition)
}


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
  photoAnalysis?: RenovatiePhotoAnalysis | null,
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
  let renovatieniveau: RenovatieScan['renovatieniveau'] =
    clampedScore < 25
      ? 'Lichte opfrissing'
      : clampedScore < 50
        ? 'Gerichte renovatie'
        : clampedScore < 75
          ? 'Grondige renovatie'
          : 'Totaalrenovatie mogelijk'

  if (clampedScore < 25) {
    pluspunten.push(
      'Renovatiebeoordeling laag op basis van de beschikbare woningdata.',
    )
  } else if (clampedScore < 65) {
    aandachtspunten.push(
      'Renovatiebeoordeling gemiddeld op basis van de beschikbare woningdata.',
    )
  } else {
    aandachtspunten.push(
      'Renovatiebeoordeling hoog op basis van de beschikbare woningdata.',
    )
  }

  let renovatiecategorie =
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

  let betrouwbaarheid: RenovatieScan['betrouwbaarheid'] =
    availablePhotoCount >= 5 && knownDataPoints >= 5
      ? 'Hoog'
      : knownDataPoints >= 4 || availablePhotoCount >= 5
        ? 'Gemiddeld'
        : 'Laag'

  const hasPhotoAnalysis = Boolean(photoAnalysis)
  const visualCondition = photoAnalysis?.visualCondition

  if (photoAnalysis && visualCondition) {
    const visualSeverity = getVisualSeverity(visualCondition)
    const dataVisualCondition =
      clampedScore < 25
        ? 'lichte_opfrissing'
        : clampedScore < 50
          ? 'gerichte_renovatie'
          : clampedScore < 75
            ? 'grondige_renovatie'
            : 'totaalrenovatie'
    const dataSeverity = getVisualSeverity(dataVisualCondition)
    const dataStronglyContradicts =
      visualCondition === 'grondige_renovatie' &&
      clampedScore < 25 &&
      epcBand === 'good' &&
      buildYear >= 2015 &&
      hasReadySignal &&
      !hasHeavySignal
    const finalVisualCondition: RenovatieVisualCondition =
      visualCondition === 'totaalrenovatie'
        ? 'totaalrenovatie'
        : visualCondition === 'grondige_renovatie' && !dataStronglyContradicts
          ? 'grondige_renovatie'
          : visualSeverity >= dataSeverity
            ? visualCondition
            : dataVisualCondition

    renovatieniveau = visualConditionToRenovatieniveau(finalVisualCondition)
    renovatiecategorie = visualConditionToCategorie(finalVisualCondition)
    betrouwbaarheid = confidenceToBetrouwbaarheid(photoAnalysis.confidence)

    gebaseerdOp.push(
      `Fotoanalyse: ${photoAnalysis.confidence} vertrouwen`,
      `Visuele beoordeling: ${visualCondition}`,
    )

    if (photoAnalysis.safeSummary) {
      aandachtspunten.push(photoAnalysis.safeSummary)
    }
  }

  if (isNoDirectRenovationCase && !hasPhotoAnalysis) {
    const hasVisiblePhotos = availablePhotoCount > 0
    const noDirectAttentionExclusions = [
      LIMITED_PHOTO_TEXT,
      'Grotere bewoonbare oppervlakte kan renovatiewerken omvangrijker maken.',
      'Zeer grote bewoonbare oppervlakte kan renovatiewerken omvangrijker maken.',
      'Renovatiebeoordeling laag op basis van de beschikbare woningdata.',
      'Beschrijving bevat duidelijke renovatiesignalen.',
    ]
    const filteredAandachtspunten = aandachtspunten.filter(
      (item) =>
        !noDirectAttentionExclusions.includes(item) ||
        (!hasVisiblePhotos && item === LIMITED_PHOTO_TEXT),
    )

    return {
      renovatieniveau: 'Geen directe renovatiebehoefte vastgesteld',
      renovatiecategorie: 'Instapklaar / enkel klein onderhoud',
      betrouwbaarheid,
      pluspunten: uniqueList([
        'Geen duidelijke renovatiesignalen gevonden op basis van de beschikbare gegevens.',
        ...pluspunten,
      ]).slice(0, 5),
      aandachtspunten: uniqueList([
        'Geen directe renovatiebehoefte vastgesteld op basis van beschikbare gegevens.',
        ...filteredAandachtspunten,
      ]).slice(0, 6),
      gebaseerdOp,
      beperkteFotoInformatie: !hasVisiblePhotos && beperkteFotoInformatie,
      visueleObservaties: ['Foto’s werden niet visueel beoordeeld.'],
      kamersGezien: [],
      renovatiezones: DEFAULT_RENOVATION_AREAS,
      fotoAnalyseSamenvatting:
        'Foto’s werden niet visueel beoordeeld; deze inschatting gebruikt beschikbare woninggegevens.',
      fotoAnalyseStatus: 'niet_geanalyseerd',
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
      sanitizeRenovatieList([
        ...(photoAnalysis?.positivePoints || []),
        ...pluspunten,
      ]).slice(0, 6).length > 0
        ? sanitizeRenovatieList([
            ...(photoAnalysis?.positivePoints || []),
            ...pluspunten,
          ]).slice(0, 6)
        : fallbackPluspunten,
    aandachtspunten:
      sanitizeRenovatieList([
        ...(photoAnalysis?.attentionPoints || []),
        ...aandachtspunten,
      ]).slice(0, 8).length > 0
        ? sanitizeRenovatieList([
            ...(photoAnalysis?.attentionPoints || []),
            ...aandachtspunten,
          ]).slice(0, 8)
        : fallbackAandachtspunten,
    gebaseerdOp: hasPhotoAnalysis
      ? sanitizeRenovatieList(gebaseerdOp)
      : sanitizeRenovatieList([
          ...gebaseerdOp,
          'Foto’s niet visueel beoordeeld',
        ]),
    beperkteFotoInformatie,
    visueleObservaties: hasPhotoAnalysis
      ? sanitizeRenovatieList(photoAnalysis?.visibleSignals || [])
      : ['Foto’s werden niet visueel beoordeeld.'],
    kamersGezien: hasPhotoAnalysis
      ? sanitizeRenovatieList(photoAnalysis?.roomsObserved || [])
      : [],
    renovatiezones: photoAnalysis?.renovationAreas || DEFAULT_RENOVATION_AREAS,
    fotoAnalyseSamenvatting: hasPhotoAnalysis
      ? sanitizeRenovatieText(photoAnalysis?.safeSummary || '')
      : 'Foto’s werden niet visueel beoordeeld; deze inschatting gebruikt beschikbare woninggegevens.',
    fotoAnalyseStatus: hasPhotoAnalysis ? 'geanalyseerd' : 'niet_geanalyseerd',
  }
}
