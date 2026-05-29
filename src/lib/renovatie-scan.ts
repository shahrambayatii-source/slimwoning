export type RenovatieIndicatie =
  | 'Moderne afwerking zichtbaar'
  | 'Gemengde renovatie-indruk'
  | 'Beperkte visuele beoordeling'

export type RenovatieVisualCondition =
  | 'moderne_afwerking_zichtbaar'
  | 'gemengde_renovatie_indruk'
  | 'beperkte_visuele_beoordeling'

export type RenovatieAreaStatus =
  | 'modern_zichtbaar'
  | 'verzorgd_zichtbaar'
  | 'beperkt_zichtbaar'
  | 'niet_zichtbaar'

export type RenovatiePhotoAnalysis = {
  visualCondition: RenovatieVisualCondition
  confidence: 'beperkt' | 'gemiddeld' | 'hoog'
  visibleSignals: string[]
  roomsObserved: string[]
  renovationAreas: {
    walls: RenovatieAreaStatus
    floors: RenovatieAreaStatus
    windows: RenovatieAreaStatus
    kitchen: RenovatieAreaStatus
    bathroom: RenovatieAreaStatus
    ceiling: RenovatieAreaStatus
    roof: RenovatieAreaStatus
    installations: RenovatieAreaStatus
    insulation: RenovatieAreaStatus
  }
  notAssessed?: string[]
  attentionPoints: string[]
  positivePoints: string[]
  safeSummary: string
}

export type RenovatieScan = {
  renovatieniveau: RenovatieIndicatie
  renovatiecategorie: string
  betrouwbaarheid: 'Beperkt' | 'Gemiddeld' | 'Hoog'
  pluspunten: string[]
  aandachtspunten: string[]
  gebaseerdOp: string[]
  beperkteFotoInformatie: boolean
  visueleObservaties: string[]
  kamersGezien: string[]
  renovatiezones: RenovatiePhotoAnalysis['renovationAreas']
  fotoAnalyseSamenvatting: string
  nietBeoordeeld: string[]
  fotoAnalyseStatus: 'geanalyseerd' | 'niet_geanalyseerd'
}

const LIMITED_PHOTO_TEXT =
  'Beperkte foto-informatie beschikbaar; beoordeling blijft beperkt tot zichtbare elementen.'

const DEFAULT_RENOVATION_AREAS: RenovatiePhotoAnalysis['renovationAreas'] = {
  walls: 'niet_zichtbaar',
  floors: 'niet_zichtbaar',
  windows: 'niet_zichtbaar',
  kitchen: 'niet_zichtbaar',
  bathroom: 'niet_zichtbaar',
  ceiling: 'niet_zichtbaar',
  roof: 'niet_zichtbaar',
  installations: 'niet_zichtbaar',
  insulation: 'niet_zichtbaar',
}

function sanitizeRenovatieText(value: string) {
  return value
    .replace(/moet vervangen worden/gi, 'controle aanbevolen')
    .replace(/moeten vervangen worden/gi, 'controle aanbevolen')
    .replace(/moet worden vervangen/gi, 'controle aanbevolen')
    .replace(/is kapot/gi, 'lijkt niet in recente staat')
    .replace(/is technisch afgekeurd/gi, 'is niet vast te stellen op basis van foto’s')
    .replace(/elektriciteit is slecht/gi, 'technieken niet vast te stellen op basis van foto’s')
    .replace(/asbest aanwezig/gi, 'niet vast te stellen op basis van foto’s')
    .replace(/dak defect/gi, 'dak niet vast te stellen op basis van foto’s')
    .replace(/is slecht/gi, 'lijkt verouderd')
    .replace(/vocht aanwezig/gi, 'zichtbare sporen vragen controle')
    .replace(/\bvocht\b/gi, 'zichtbare sporen')
    .replace(/\bkapot\b/gi, 'niet in recente staat')
    .replace(/\bdefect\b/gi, 'niet vast te stellen op basis van foto’s')
    .trim()
}

function sanitizeRenovatieList(items: string[]) {
  return uniqueList(items.map(sanitizeRenovatieText).filter(Boolean))
}

function visualConditionToRenovatieniveau(
  condition: RenovatieVisualCondition,
): RenovatieIndicatie {
  if (condition === 'moderne_afwerking_zichtbaar') return 'Moderne afwerking zichtbaar'
  if (condition === 'gemengde_renovatie_indruk') return 'Gemengde renovatie-indruk'

  return 'Beperkte visuele beoordeling'
}

function visualConditionToCategorie(condition: RenovatieVisualCondition) {
  if (condition === 'moderne_afwerking_zichtbaar')
    return 'Moderne afwerking zichtbaar op basis van zichtbare elementen'
  if (condition === 'gemengde_renovatie_indruk')
    return 'Gemengde renovatie-indruk op basis van zichtbare elementen'

  return 'Beperkte visuele beoordeling door beperkte zichtbaarheid'
}

function confidenceToBetrouwbaarheid(
  confidence: RenovatiePhotoAnalysis['confidence'],
): RenovatieScan['betrouwbaarheid'] {
  if (confidence === 'hoog') return 'Hoog'
  if (confidence === 'gemiddeld') return 'Gemiddeld'

  return 'Beperkt'
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

function formatKnownValue(value: unknown, fallback = 'niet beschikbaar') {
  return hasKnownValue(value) ? String(value).trim() : fallback
}

function getDescriptionKeywordSummary(matchedSignals: string[]) {
  if (matchedSignals.length === 0)
    return 'geen duidelijke renovatiekeywords gevonden'

  return uniqueList(matchedSignals).slice(0, 8).join(', ')
}

const RENOVATION_AREA_LABELS: Record<keyof RenovatiePhotoAnalysis['renovationAreas'], string> = {
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

const REQUIRED_NOT_VISIBLE_COMPONENTS = [
  'Keuken',
  'Badkamer',
  'Dak',
  'Installaties',
  'Isolatie',
] as const

function calculateVisualConfidence(
  roomsObserved: string[],
): RenovatiePhotoAnalysis['confidence'] {
  const visibleAreaCount = uniqueList(
    roomsObserved.map((room) => room.toLowerCase()),
  ).length

  if (visibleAreaCount >= 5) return 'hoog'
  if (visibleAreaCount >= 2) return 'gemiddeld'

  return 'beperkt'
}

function buildNietBeoordeeld(photoAnalysis?: RenovatiePhotoAnalysis | null) {
  const fromAreas = Object.entries(
    photoAnalysis?.renovationAreas || DEFAULT_RENOVATION_AREAS,
  )
    .filter(([, status]) => status === 'niet_zichtbaar')
    .map(([area]) => {
      const key = area as keyof RenovatiePhotoAnalysis['renovationAreas']

      return `${RENOVATION_AREA_LABELS[key]} — Niet zichtbaar op basis van foto's`
    })
  const requiredItems = REQUIRED_NOT_VISIBLE_COMPONENTS.map((component) => {
    const entry = Object.entries(
      photoAnalysis?.renovationAreas || DEFAULT_RENOVATION_AREAS,
    ).find(
      ([area]) =>
        RENOVATION_AREA_LABELS[
          area as keyof RenovatiePhotoAnalysis['renovationAreas']
        ] === component,
    )

    if (entry && entry[1] !== 'niet_zichtbaar') return ''

    return `${component} — Niet zichtbaar op basis van foto's`
  }).filter(Boolean)

  return sanitizeRenovatieList([
    ...(photoAnalysis?.notAssessed || []),
    ...fromAreas,
    ...requiredItems,
  ]).slice(0, 12)
}

function componentEvidenceSummary(photoAnalysis: RenovatiePhotoAnalysis) {
  return Object.entries(photoAnalysis.renovationAreas)
    .filter(([, status]) => status !== 'niet_zichtbaar')
    .map(([area, status]) => {
      const key = area as keyof RenovatiePhotoAnalysis['renovationAreas']
      const label = RENOVATION_AREA_LABELS[key]

      if (status === 'modern_zichtbaar') return `${label}: modern zichtbaar`
      if (status === 'verzorgd_zichtbaar') return `${label}: verzorgd zichtbaar`

      return `${label}: beperkt zichtbaar`
    })
}

function buildPropertyContextNotes(
  epcValue: unknown,
  buildYearValue: unknown,
  areaValue: unknown,
  bathroomValue: unknown,
  matchedDescriptionSignals: string[],
) {
  const notes: string[] = []

  if (hasKnownValue(epcValue)) {
    notes.push(
      `EPC ${String(epcValue).toUpperCase()} is alleen als woningdata-context meegenomen; de visuele renovatie-indruk blijft gebaseerd op foto's.`,
    )
  }
  if (hasKnownValue(buildYearValue)) {
    notes.push(
      `Bouwjaar ${String(buildYearValue)} is context en geen visueel conditieoordeel.`,
    )
  }
  if (hasKnownValue(areaValue)) {
    notes.push(
      `Oppervlakte ${String(areaValue)} is context en zegt niets over niet-zichtbare ruimtes.`,
    )
  }
  if (hasKnownValue(bathroomValue)) {
    notes.push(
      `Aantal badkamers is opgegeven, maar badkamers worden alleen beoordeeld wanneer ze zichtbaar zijn.`,
    )
  }
  if (matchedDescriptionSignals.length > 0) {
    notes.push(
      `Beschrijving bevat contextsignalen (${getDescriptionKeywordSummary(matchedDescriptionSignals)}); foto's blijven leidend.`,
    )
  }

  return notes
}

export function getRenovatieScan(
  property: Record<string, unknown>,
  photoCount?: number,
  photoAnalysis?: RenovatiePhotoAnalysis | null,
): RenovatieScan {
  const areaValue = getAreaValue(property)
  const buildYearValue = firstKnownValue(
    property.bouwjaar,
    property.build_year,
    property.buildYear,
    property.year_built,
    property.yearBuilt,
  )
  const bathroomValue = firstKnownValue(property.badkamers, property.bathrooms)
  const epcValue = firstKnownValue(
    property.epc,
    property.epc_label,
    property.epcLabel,
    property.epc_code,
    property.EPC,
  )
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
  const descriptionSignals = [
    'instapklaar',
    'gerenoveerd',
    'vernieuwd',
    'recent',
    'moderne keuken',
    'nieuwe badkamer',
    'op te frissen',
    'renovatie',
    'te renoveren',
    'totaalrenovatie',
    'renovatieplicht',
    'kluswoning',
    'verouderd',
  ]
  const matchedDescriptionSignals = descriptionSignals.filter((signal) =>
    hasTextSignal(text, signal),
  )

  const gebaseerdOp = sanitizeRenovatieList([
    `EPC: ${formatKnownValue(epcValue)}`,
    `Bouwjaar: ${formatKnownValue(buildYearValue)}`,
    `Oppervlakte: ${formatKnownValue(areaValue)}`,
    `Aantal badkamers: ${formatKnownValue(bathroomValue)}`,
    `Beschrijving-keywords: ${getDescriptionKeywordSummary(matchedDescriptionSignals)}`,
    `Aantal beschikbare foto’s: ${availablePhotoCount}`,
    photoAnalysis
      ? `Fotoanalyse: ${calculateVisualConfidence(photoAnalysis.roomsObserved)} vertrouwen op basis van zichtbare ruimtes`
      : 'Foto’s niet visueel beoordeeld',
  ])

  if (!photoAnalysis) {
    const nietBeoordeeld = buildNietBeoordeeld(null)

    return {
      renovatieniveau: 'Beperkte visuele beoordeling',
      renovatiecategorie:
        'Beperkte visuele beoordeling: foto’s werden niet visueel geanalyseerd',
      betrouwbaarheid: 'Beperkt',
      pluspunten: [
        'Geen visuele pluspunten vastgesteld omdat foto’s niet visueel beoordeeld zijn.',
      ],
      aandachtspunten: sanitizeRenovatieList([
        'Niet vast te stellen op basis van foto’s; visuele controle aanbevolen.',
        ...buildPropertyContextNotes(
          epcValue,
          buildYearValue,
          areaValue,
          bathroomValue,
          matchedDescriptionSignals,
        ),
      ]).slice(0, 8),
      gebaseerdOp,
      beperkteFotoInformatie,
      visueleObservaties: ['Foto’s werden niet visueel beoordeeld.'],
      kamersGezien: [],
      renovatiezones: DEFAULT_RENOVATION_AREAS,
      fotoAnalyseSamenvatting:
        'Foto’s werden niet visueel beoordeeld; niet-zichtbare elementen worden niet geclassificeerd.',
      nietBeoordeeld,
      fotoAnalyseStatus: 'niet_geanalyseerd',
    }
  }

  const confidence = calculateVisualConfidence(photoAnalysis.roomsObserved)
  const visualSignals = sanitizeRenovatieList(photoAnalysis.visibleSignals)
  const positivePoints = sanitizeRenovatieList(photoAnalysis.positivePoints)
  const observedComponents = componentEvidenceSummary(photoAnalysis)
  const visibleEvidence = sanitizeRenovatieList([
    ...visualSignals,
    ...observedComponents,
  ]).slice(0, 10)
  const nietBeoordeeld = buildNietBeoordeeld(photoAnalysis)
  const visualCondition =
    confidence === 'beperkt' && visibleEvidence.length < 2
      ? 'beperkte_visuele_beoordeling'
      : photoAnalysis.visualCondition
  const propertyContextNotes = buildPropertyContextNotes(
    epcValue,
    buildYearValue,
    areaValue,
    bathroomValue,
    matchedDescriptionSignals,
  )

  return {
    renovatieniveau: visualConditionToRenovatieniveau(visualCondition),
    renovatiecategorie: visualConditionToCategorie(visualCondition),
    betrouwbaarheid: confidenceToBetrouwbaarheid(confidence),
    pluspunten:
      sanitizeRenovatieList([...positivePoints, ...observedComponents]).slice(
        0,
        6,
      ).length > 0
        ? sanitizeRenovatieList([...positivePoints, ...observedComponents]).slice(
            0,
            6,
          )
        : [
            'Geen positieve elementen vastgesteld buiten wat zichtbaar is op de foto’s.',
          ],
    aandachtspunten: sanitizeRenovatieList([
      ...(photoAnalysis.attentionPoints || []),
      ...(beperkteFotoInformatie ? [LIMITED_PHOTO_TEXT] : []),
      ...propertyContextNotes,
      ...(nietBeoordeeld.length > 0
        ? ['Niet-zichtbare onderdelen zijn niet beoordeeld.']
        : []),
    ]).slice(0, 8),
    gebaseerdOp,
    beperkteFotoInformatie,
    visueleObservaties:
      visibleEvidence.length > 0
        ? visibleEvidence
        : ['Afwerking niet duidelijk zichtbaar op basis van de foto’s.'],
    kamersGezien: sanitizeRenovatieList(photoAnalysis.roomsObserved || []),
    renovatiezones: photoAnalysis.renovationAreas,
    fotoAnalyseSamenvatting:
      sanitizeRenovatieText(photoAnalysis.safeSummary) ||
      'Visuele beoordeling alleen op basis van zichtbare elementen; niet-zichtbare onderdelen zijn niet vastgesteld.',
    nietBeoordeeld,
    fotoAnalyseStatus: 'geanalyseerd',
  }
}
