export type AfwerkingsStaat =
  | 'Modern afgewerkt'
  | 'Gemiddeld'
  | 'Renovatie nodig'

export type RenovatieVisualCondition =
  | 'modern_afgewerkt'
  | 'verzorgde_afwerking'
  | 'gemengde_afwerking'
  | 'zichtbaar_verouderd'
  | 'onvoldoende_zichtbaar'

export type RenovatieAreaStatus =
  | 'modern_zichtbaar'
  | 'verzorgd_zichtbaar'
  | 'verouderd_zichtbaar'
  | 'beperkt_zichtbaar'
  | 'niet_zichtbaar'

export type RenovatieVisibleRenovationLevel =
  | 'duidelijk_recent_vernieuwd'
  | 'deels_vernieuwd'
  | 'onderhouden_niet_recent'
  | 'zichtbaar_te_moderniseren'
  | 'onvoldoende_zichtbaar'

export type RenovatieVisibleFinishQuality =
  | 'hoogwaardig_zichtbaar'
  | 'standaard_verzorgd'
  | 'basis_of_slijtage_zichtbaar'
  | 'gedateerd_of_sober'
  | 'onvoldoende_zichtbaar'

export type RenovatiePhotoEvidence = {
  photoIndex: number
  roomType: string
  visibleRenovationLevel: RenovatieVisibleRenovationLevel
  visibleFinishQuality: RenovatieVisibleFinishQuality
  modernElements: string[]
  outdatedElements: string[]
  observations: string[]
}

export type RenovatiePhotoAnalysis = {
  visualCondition: RenovatieVisualCondition
  confidence: 'beperkt' | 'gemiddeld' | 'hoog'
  visibleSignals: string[]
  roomsObserved: string[]
  visibleRenovationLevel?: RenovatieVisibleRenovationLevel
  visibleFinishQuality?: RenovatieVisibleFinishQuality
  visibleModernElements?: string[]
  visibleOutdatedElements?: string[]
  photoEvidence?: RenovatiePhotoEvidence[]
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
  renovatieniveau: AfwerkingsStaat
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
  fotoDekking: {
    aantalFotos: number
    zichtbareRuimtes: number
    sleutelruimtesGezien: string[]
  }
  zichtbaarRenovatieniveau: string
  zichtbaarAfwerkingsniveau: string
  zichtbareModerneElementen: string[]
  zichtbareVerouderdeElementen: string[]
  fotoBewijs: RenovatiePhotoEvidence[]
  korteToelichting: string
  watWeZien: string[]
  extraFotoSuggesties: string[]
  betrouwbaarheidToelichting: string
}

const LIMITED_PHOTO_TEXT =
  'Beperkte foto-informatie beschikbaar; de beoordeling blijft beperkt tot zichtbare elementen.'

const SINGLE_PHOTO_BASED_TEXT =
  'De beoordeling is gebaseerd op de beschikbare woningfoto.'

const SINGLE_PHOTO_UNSEEN_TEXT =
  'Andere delen van de woning zijn niet vast te stellen op basis van deze foto.'

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
  context: RenovatieScanContext,
): AfwerkingsStaat {
  const oldAreaCount = Object.values(context.renovationAreas).filter(
    (status) => status === 'verouderd_zichtbaar',
  ).length
  const modernAreaCount = Object.values(context.renovationAreas).filter(
    (status) => status === 'modern_zichtbaar',
  ).length
  const outdatedCount = context.visibleOutdatedElements.length
  const modernCount = context.visibleModernElements.length

  if (condition === 'zichtbaar_verouderd') return 'Renovatie nodig'
  if (oldAreaCount >= 2 || outdatedCount >= 3) return 'Renovatie nodig'
  if (oldAreaCount >= 1 && context.roomsObserved.length >= 2) return 'Renovatie nodig'

  if (
    condition === 'modern_afgewerkt' &&
    oldAreaCount === 0 &&
    outdatedCount === 0 &&
    (modernAreaCount >= 2 || modernCount >= 2 || context.roomsObserved.length >= 2)
  ) {
    return 'Modern afgewerkt'
  }

  return 'Gemiddeld'
}


function visualConditionToCategorie(status: AfwerkingsStaat) {
  if (status === 'Modern afgewerkt')
    return 'De zichtbare afwerking oogt overwegend modern; woningdata zoals EPC en oppervlakte zijn meegewogen als context.'
  if (status === 'Renovatie nodig')
    return 'De zichtbare foto-evidence toont duidelijke renovatiegevoelige onderdelen; EPC en oppervlakte zijn meegewogen voor de impact.'

  return 'De woning toont een gemengd of gemiddeld renovatiebeeld op basis van foto’s en beschikbare woninggegevens.'
}


function confidenceToBetrouwbaarheid(
  confidence: RenovatiePhotoAnalysis['confidence'],
): RenovatieScan['betrouwbaarheid'] {
  if (confidence === 'hoog') return 'Hoog'
  if (confidence === 'gemiddeld') return 'Gemiddeld'

  return 'Beperkt'
}

type RenovatieScanContext = {
  epc: string
  area: number
  propertyType: string
  bedrooms: number
  bathrooms: number
  photoCount: number
  roomsObserved: string[]
  renovationAreas: RenovatiePhotoAnalysis['renovationAreas']
  visibleModernElements: string[]
  visibleOutdatedElements: string[]
}

const IMPORTANT_ROOM_LABELS = ['woonkamer', 'keuken', 'badkamer'] as const

function getPropertyEpc(property: Record<string, unknown>) {
  const epc = String(
    property.epc || property.epc_code || property.epc_label || property.epcLabel || property.EPC || '',
  )
    .trim()
    .toUpperCase()

  return epc && epc !== 'EMPTY' ? epc : ''
}

function getPropertyAreaValue(property: Record<string, unknown>) {
  return numberValue(
    property.bewoonbare_oppervlakte ||
      property.woonoppervlakte ||
      property.livingArea ||
      property.living_area ||
      property.oppervlakte ||
      property.area ||
      property.grondoppervlakte,
  )
}

function getPropertyTypeLabel(property: Record<string, unknown>) {
  return String(
    property.woning_type || property.property_type || property.type || property.propertyType || '',
  ).trim()
}

function getPropertyBedrooms(property: Record<string, unknown>) {
  return numberValue(property.slaapkamers || property.bedrooms || property.bedroom_count)
}

function getPropertyBathrooms(property: Record<string, unknown>) {
  return numberValue(property.badkamers || property.bathrooms || property.bathroom_count)
}

function formatArea(area: number) {
  return area > 0 ? `${Math.round(area)} m²` : ''
}

function buildGebaseerdOpChips(context: RenovatieScanContext) {
  return sanitizeRenovatieList([
    `Foto’s: ${context.photoCount}`,
    context.epc ? `EPC: ${context.epc}` : '',
    context.area ? `Oppervlakte: ${formatArea(context.area)}` : '',
    context.propertyType ? `Type: ${context.propertyType}` : '',
    context.bedrooms ? `Slaapkamers: ${context.bedrooms}` : '',
    context.bathrooms ? `Badkamers: ${context.bathrooms}` : '',
  ])
}

function roomsContain(rooms: string[], needle: string) {
  return rooms.some((room) => room.toLowerCase().includes(needle))
}

function getMissingImportantRooms(rooms: string[], photoCount: number) {
  if (photoCount >= 6 && IMPORTANT_ROOM_LABELS.filter((room) => roomsContain(rooms, room)).length >= 2) {
    return []
  }

  return IMPORTANT_ROOM_LABELS.filter((room) => !roomsContain(rooms, room))
}

function buildWatWeZien(context: RenovatieScanContext, visibleEvidence: string[]) {
  const rooms = context.roomsObserved
  const oldAreas = Object.entries(context.renovationAreas)
    .filter(([, status]) => status === 'verouderd_zichtbaar')
    .map(([area]) => RENOVATION_AREA_LABELS[area as keyof RenovatiePhotoAnalysis['renovationAreas']])
  const modernAreas = Object.entries(context.renovationAreas)
    .filter(([, status]) => status === 'modern_zichtbaar')
    .map(([area]) => RENOVATION_AREA_LABELS[area as keyof RenovatiePhotoAnalysis['renovationAreas']])

  return sanitizeRenovatieList([
    ...oldAreas.map((area) => `${area} lijkt verouderd zichtbaar`),
    ...context.visibleOutdatedElements.map((element) => `${element} zichtbaar`),
    ...modernAreas.map((area) => `${area} oogt modern zichtbaar`),
    ...context.visibleModernElements.map((element) => `${element} zichtbaar`),
    rooms.length >= 3 ? 'Meerdere ruimtes geanalyseerd' : '',
    roomsContain(rooms, 'keuken') ? 'Keuken zichtbaar' : '',
    roomsContain(rooms, 'badkamer') ? 'Badkamer zichtbaar' : '',
    ...visibleEvidence,
  ]).slice(0, 6)
}

function buildKorteToelichting(
  status: AfwerkingsStaat,
  context: RenovatieScanContext,
  fallbackSummary: string,
) {
  const oldAreas = Object.entries(context.renovationAreas)
    .filter(([, value]) => value === 'verouderd_zichtbaar')
    .map(([area]) => RENOVATION_AREA_LABELS[area as keyof RenovatiePhotoAnalysis['renovationAreas']].toLowerCase())
    .slice(0, 3)
  const dataContext = sanitizeRenovatieList([
    context.area >= 180 ? `Door de ruime oppervlakte (${formatArea(context.area)}) kan de renovatie-impact groter zijn.` : '',
    context.epc && ['E', 'F', 'G'].includes(context.epc) ? `EPC ${context.epc} vraagt extra aandacht in de totale renovatie-inschatting.` : '',
    context.epc && ['A+++++', 'A++++', 'A+++', 'A++', 'A+', 'A', 'B'].includes(context.epc) ? `EPC ${context.epc} is energetisch gunstig, maar zegt niet alles over de interieurafwerking.` : '',
  ])[0]

  if (status === 'Renovatie nodig') {
    const detail = oldAreas.length
      ? ` Vooral ${oldAreas.join(', ')} lijken renovatiegevoelig.`
      : ' Meerdere zichtbare elementen lijken renovatiegevoelig.'

    return sanitizeRenovatieText(`De woning oogt op basis van de foto’s op meerdere punten verouderd.${detail} ${dataContext || ''}`)
  }

  if (status === 'Modern afgewerkt') {
    return sanitizeRenovatieText(
      `De zichtbare ruimtes ogen overwegend modern en verzorgd afgewerkt. ${dataContext || 'De beschikbare woningdata ondersteunt de context, maar de foto’s blijven doorslaggevend.'}`,
    )
  }

  return sanitizeRenovatieText(
    fallbackSummary ||
      `De foto’s tonen een gemengd renovatiebeeld: sommige onderdelen ogen verzorgd, terwijl andere afwerking niet duidelijk recent is. ${dataContext || ''}`,
  )
}

function buildAandachtspunten(
  context: RenovatieScanContext,
  photoAttentionPoints: string[],
  missingImportantRooms: string[],
) {
  const oldAreas = Object.entries(context.renovationAreas)
    .filter(([, status]) => status === 'verouderd_zichtbaar')
    .map(([area]) => RENOVATION_AREA_LABELS[area as keyof RenovatiePhotoAnalysis['renovationAreas']])

  return sanitizeRenovatieList([
    oldAreas.includes('Badkamer') ? 'Badkamer mogelijk vernieuwen' : '',
    oldAreas.includes('Keuken') ? 'Keukenafwerking controleren en eventueel moderniseren' : '',
    oldAreas.includes('Muren') || oldAreas.includes('Vloeren')
      ? 'Wand- en vloerafwerking moderniseren'
      : '',
    ...photoAttentionPoints,
    'Elektriciteit en verwarming controleren bij plaatsbezoek',
    context.epc ? 'EPC meenemen in totale renovatie-inschatting' : '',
    context.area >= 180 ? 'Grotere oppervlakte kan de renovatie-impact verhogen' : '',
    missingImportantRooms.length > 0
      ? `Extra foto’s van ${missingImportantRooms.join(', ')} kunnen de inschatting verfijnen`
      : '',
  ]).slice(0, 5)
}

function buildBetrouwbaarheidToelichting(
  betrouwbaarheid: RenovatieScan['betrouwbaarheid'],
  photoCount: number,
  roomsObserved: string[],
) {
  const enoughRooms = photoCount >= 6 && roomsObserved.length >= 4
  const roomText = enoughRooms
    ? 'genoeg belangrijke ruimtes zichtbaar'
    : roomsObserved.length > 0
      ? `${roomsObserved.length} zichtbare ruimte${roomsObserved.length === 1 ? '' : 's'}`
      : 'geen herkenbare ruimtes zichtbaar'

  return `${betrouwbaarheid} — ${photoCount} ${photoCount === 1 ? 'foto' : 'foto’s'} geanalyseerd, ${roomText}`
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

function uniqueList(items: string[]) {
  return Array.from(new Set(items))
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

const RENOVATION_LEVEL_LABELS: Record<RenovatieVisibleRenovationLevel, string> = {
  duidelijk_recent_vernieuwd: 'Duidelijk recent vernieuwd zichtbaar',
  deels_vernieuwd: 'Deels vernieuwd zichtbaar',
  onderhouden_niet_recent: 'Onderhouden, niet duidelijk recent',
  zichtbaar_te_moderniseren: 'Zichtbaar te moderniseren',
  onvoldoende_zichtbaar: 'Onvoldoende zichtbaar',
}

const FINISH_QUALITY_LABELS: Record<RenovatieVisibleFinishQuality, string> = {
  hoogwaardig_zichtbaar: 'Hoogwaardige afwerking zichtbaar',
  standaard_verzorgd: 'Standaard verzorgde afwerking zichtbaar',
  basis_of_slijtage_zichtbaar: 'Basisafwerking of slijtage zichtbaar',
  gedateerd_of_sober: 'Gedateerde of sobere afwerking zichtbaar',
  onvoldoende_zichtbaar: 'Onvoldoende zichtbaar',
}

function renovationLevelLabel(value?: RenovatieVisibleRenovationLevel) {
  return RENOVATION_LEVEL_LABELS[value || 'onvoldoende_zichtbaar']
}

function finishQualityLabel(value?: RenovatieVisibleFinishQuality) {
  return FINISH_QUALITY_LABELS[value || 'onvoldoende_zichtbaar']
}

function photoEvidenceRoomList(photoAnalysis?: RenovatiePhotoAnalysis | null) {
  return sanitizeRenovatieList(
    (photoAnalysis?.photoEvidence || [])
      .map((item) => item.roomType)
      .filter((room) => room && room !== 'onvoldoende_zichtbaar'),
  )
}

function flattenPhotoEvidence(
  photoAnalysis: RenovatiePhotoAnalysis,
  field: 'modernElements' | 'outdatedElements' | 'observations',
) {
  return sanitizeRenovatieList(
    (photoAnalysis.photoEvidence || []).flatMap((item) => item[field] || []),
  )
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

const KEY_AREA_SIGNALS = [
  'woonkamer',
  'living',
  'keuken',
  'badkamer',
  'gevel',
  'buiten',
  'exterieur',
  'tuin',
  'dak',
] as const

function getVisibleRooms(roomsObserved: string[]) {
  return uniqueList(
    roomsObserved
      .map((room) => room.trim().toLowerCase())
      .filter(Boolean),
  )
}

function getKeyAreasSeen(roomsObserved: string[]) {
  const visibleRooms = getVisibleRooms(roomsObserved)

  return KEY_AREA_SIGNALS.filter((signal) =>
    visibleRooms.some((room) => room.includes(signal)),
  )
}

function calculateVisualConfidence(
  roomsObserved: string[],
  photoCount = 0,
): RenovatiePhotoAnalysis['confidence'] {
  const visibleAreaCount = getVisibleRooms(roomsObserved).length

  if (photoCount <= 1 || visibleAreaCount <= 1) return 'beperkt'
  if (visibleAreaCount >= 5 && getKeyAreasSeen(roomsObserved).length > 0) {
    return 'hoog'
  }
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
      if (status === 'verouderd_zichtbaar') return `${label}: verouderd zichtbaar`

      return `${label}: beperkt zichtbaar`
    })
}


function normalizeVisualConditionByEvidence(
  condition: RenovatieVisualCondition,
  roomsObserved: string[],
  renovationAreas: RenovatiePhotoAnalysis['renovationAreas'],
  visibleEvidence: string[],
): RenovatieVisualCondition {
  const hasUsableEvidence = roomsObserved.length > 0 || visibleEvidence.length > 0

  if (!hasUsableEvidence) return 'onvoldoende_zichtbaar'
  if (condition !== 'onvoldoende_zichtbaar') return condition

  const statuses = Object.values(renovationAreas)
  const hasModern = statuses.includes('modern_zichtbaar')
  const hasVerzorgd = statuses.includes('verzorgd_zichtbaar')
  const hasVerouderd = statuses.includes('verouderd_zichtbaar')

  if (hasVerouderd && (hasModern || hasVerzorgd)) return 'gemengde_afwerking'
  if (hasVerouderd) return 'zichtbaar_verouderd'
  if (hasModern) return 'modern_afgewerkt'
  if (hasVerzorgd) return 'verzorgde_afwerking'

  return 'onvoldoende_zichtbaar'
}

export function getRenovatieScan(
  property: Record<string, unknown>,
  photoCount?: number,
  photoAnalysis?: RenovatiePhotoAnalysis | null,
): RenovatieScan {
  const availablePhotoCount = getPhotoCount(property, photoCount)
  const beperkteFotoInformatie = availablePhotoCount < 3

  const evidenceRooms = photoAnalysis
    ? sanitizeRenovatieList([
        ...photoAnalysis.roomsObserved,
        ...photoEvidenceRoomList(photoAnalysis),
      ])
    : []

  const baseContext: RenovatieScanContext = {
    epc: getPropertyEpc(property),
    area: getPropertyAreaValue(property),
    propertyType: getPropertyTypeLabel(property),
    bedrooms: getPropertyBedrooms(property),
    bathrooms: getPropertyBathrooms(property),
    photoCount: availablePhotoCount,
    roomsObserved: evidenceRooms,
    renovationAreas: photoAnalysis?.renovationAreas || DEFAULT_RENOVATION_AREAS,
    visibleModernElements: [],
    visibleOutdatedElements: [],
  }
  const gebaseerdOp = buildGebaseerdOpChips(baseContext)

  if (!photoAnalysis) {
    const nietBeoordeeld = buildNietBeoordeeld(null)

    return {
      renovatieniveau: 'Gemiddeld',
      renovatiecategorie:
        'Foto’s werden nog niet visueel geanalyseerd; de inschatting blijft voorlopig beperkt.',
      betrouwbaarheid: 'Beperkt',
      pluspunten: [
        'Geen visuele pluspunten vastgesteld omdat foto’s niet visueel beoordeeld zijn.',
      ],
      aandachtspunten: sanitizeRenovatieList([
        'Niet vast te stellen op basis van foto’s; visuele controle aanbevolen.',
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
      fotoDekking: {
        aantalFotos: availablePhotoCount,
        zichtbareRuimtes: 0,
        sleutelruimtesGezien: [],
      },
      zichtbaarRenovatieniveau: renovationLevelLabel(),
      zichtbaarAfwerkingsniveau: finishQualityLabel(),
      zichtbareModerneElementen: [],
      zichtbareVerouderdeElementen: [],
      fotoBewijs: [],
      korteToelichting:
        'Er is nog geen visuele fotoanalyse beschikbaar. De woninggegevens worden getoond als context, maar de renovatiestatus blijft voorlopig beperkt.',
      watWeZien: ['Foto’s werden nog niet visueel beoordeeld.'],
      extraFotoSuggesties: getMissingImportantRooms([], availablePhotoCount),
      betrouwbaarheidToelichting: buildBetrouwbaarheidToelichting('Beperkt', availablePhotoCount, []),
    }
  }

  const confidence = calculateVisualConfidence(
    photoAnalysis.roomsObserved,
    availablePhotoCount,
  )
  const isSinglePhotoAnalysis = availablePhotoCount <= 1
  const visualSignals = sanitizeRenovatieList(photoAnalysis.visibleSignals)
  const positivePoints = sanitizeRenovatieList(photoAnalysis.positivePoints)
  const observedComponents = componentEvidenceSummary(photoAnalysis)
  const visibleEvidence = sanitizeRenovatieList([
    ...visualSignals,
    ...observedComponents,
    ...flattenPhotoEvidence(photoAnalysis, 'observations'),
  ]).slice(0, 10)
  const nietBeoordeeld = buildNietBeoordeeld(photoAnalysis)
  const visualCondition = normalizeVisualConditionByEvidence(
    photoAnalysis.visualCondition,
    photoAnalysis.roomsObserved,
    photoAnalysis.renovationAreas,
    visibleEvidence,
  )
  const visibleModernElements = sanitizeRenovatieList([
    ...(photoAnalysis.visibleModernElements || []),
    ...flattenPhotoEvidence(photoAnalysis, 'modernElements'),
  ]).slice(0, 8)
  const visibleOutdatedElements = sanitizeRenovatieList([
    ...(photoAnalysis.visibleOutdatedElements || []),
    ...flattenPhotoEvidence(photoAnalysis, 'outdatedElements'),
  ]).slice(0, 8)
  const scanContext: RenovatieScanContext = {
    ...baseContext,
    roomsObserved: evidenceRooms,
    renovationAreas: photoAnalysis.renovationAreas,
    visibleModernElements,
    visibleOutdatedElements,
  }
  const renovatieniveau = visualConditionToRenovatieniveau(
    visualCondition,
    scanContext,
  )
  const betrouwbaarheid = confidenceToBetrouwbaarheid(confidence)
  const missingImportantRooms = getMissingImportantRooms(
    evidenceRooms,
    availablePhotoCount,
  )
  const fotoAnalyseSamenvatting = isSinglePhotoAnalysis
    ? sanitizeRenovatieText(
        `${SINGLE_PHOTO_BASED_TEXT} ${photoAnalysis.safeSummary || ''} ${SINGLE_PHOTO_UNSEEN_TEXT}`,
      )
    : sanitizeRenovatieText(photoAnalysis.safeSummary) ||
      'Visuele beoordeling alleen op basis van zichtbare elementen; niet-zichtbare onderdelen zijn niet vastgesteld.'
  const aandachtspunten = buildAandachtspunten(
    scanContext,
    [
      ...(photoAnalysis.attentionPoints || []),
      ...(isSinglePhotoAnalysis
        ? [SINGLE_PHOTO_BASED_TEXT, SINGLE_PHOTO_UNSEEN_TEXT]
        : []),
      ...(beperkteFotoInformatie ? [LIMITED_PHOTO_TEXT] : []),
    ],
    missingImportantRooms,
  )
  const watWeZien = buildWatWeZien(scanContext, visibleEvidence)

  return {
    renovatieniveau,
    renovatiecategorie: visualConditionToCategorie(renovatieniveau),
    betrouwbaarheid,
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
    aandachtspunten,
    gebaseerdOp,
    beperkteFotoInformatie,
    visueleObservaties:
      visibleEvidence.length > 0
        ? visibleEvidence
        : ['Afwerking niet duidelijk zichtbaar op basis van de foto’s.'],
    kamersGezien: evidenceRooms,
    renovatiezones: photoAnalysis.renovationAreas,
    fotoAnalyseSamenvatting,
    nietBeoordeeld,
    fotoAnalyseStatus: 'geanalyseerd',
    fotoDekking: {
      aantalFotos: availablePhotoCount,
      zichtbareRuimtes: getVisibleRooms(photoAnalysis.roomsObserved).length,
      sleutelruimtesGezien: getKeyAreasSeen(photoAnalysis.roomsObserved),
    },
    zichtbaarRenovatieniveau: renovationLevelLabel(
      photoAnalysis.visibleRenovationLevel,
    ),
    zichtbaarAfwerkingsniveau: finishQualityLabel(photoAnalysis.visibleFinishQuality),
    zichtbareModerneElementen: visibleModernElements,
    zichtbareVerouderdeElementen: visibleOutdatedElements,
    fotoBewijs: photoAnalysis.photoEvidence || [],
    korteToelichting: buildKorteToelichting(
      renovatieniveau,
      scanContext,
      fotoAnalyseSamenvatting,
    ),
    watWeZien:
      watWeZien.length > 0
        ? watWeZien
        : ['Afwerking niet duidelijk zichtbaar op basis van de foto’s.'],
    extraFotoSuggesties: missingImportantRooms,
    betrouwbaarheidToelichting: buildBetrouwbaarheidToelichting(
      betrouwbaarheid,
      availablePhotoCount,
      evidenceRooms,
    ),
  }
}
