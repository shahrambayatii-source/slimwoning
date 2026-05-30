import { NextResponse } from 'next/server'

const MAX_PHOTOS = 12

const VISUAL_CONDITIONS = [
  'modern_afgewerkt',
  'verzorgde_afwerking',
  'gemengde_afwerking',
  'zichtbaar_verouderd',
  'onvoldoende_zichtbaar',
] as const

const CONFIDENCE_VALUES = ['beperkt', 'gemiddeld', 'hoog'] as const
const RENOVATION_LEVEL_VALUES = [
  'duidelijk_recent_vernieuwd',
  'deels_vernieuwd',
  'onderhouden_niet_recent',
  'zichtbaar_te_moderniseren',
  'onvoldoende_zichtbaar',
] as const
const FINISH_QUALITY_VALUES = [
  'hoogwaardig_zichtbaar',
  'standaard_verzorgd',
  'basis_of_slijtage_zichtbaar',
  'gedateerd_of_sober',
  'onvoldoende_zichtbaar',
] as const
const AREA_VALUES = [
  'modern_zichtbaar',
  'verzorgd_zichtbaar',
  'verouderd_zichtbaar',
  'beperkt_zichtbaar',
  'niet_zichtbaar',
] as const

type RenovationAreaKey =
  | 'walls'
  | 'floors'
  | 'windows'
  | 'kitchen'
  | 'bathroom'
  | 'ceiling'
  | 'roof'
  | 'installations'
  | 'insulation'

type RenovatiePhotoEvidence = {
  photoIndex: number
  roomType: string
  visibleRenovationLevel: (typeof RENOVATION_LEVEL_VALUES)[number]
  visibleFinishQuality: (typeof FINISH_QUALITY_VALUES)[number]
  modernElements: string[]
  outdatedElements: string[]
  observations: string[]
}

type RenovatiePhotoAnalysis = {
  visualCondition: (typeof VISUAL_CONDITIONS)[number]
  confidence: (typeof CONFIDENCE_VALUES)[number]
  visibleSignals: string[]
  roomsObserved: string[]
  visibleRenovationLevel: (typeof RENOVATION_LEVEL_VALUES)[number]
  visibleFinishQuality: (typeof FINISH_QUALITY_VALUES)[number]
  visibleModernElements: string[]
  visibleOutdatedElements: string[]
  photoEvidence: RenovatiePhotoEvidence[]
  renovationAreas: Record<RenovationAreaKey, string>
  notAssessed: string[]
  attentionPoints: string[]
  positivePoints: string[]
  safeSummary: string
}

const defaultAnalysis: RenovatiePhotoAnalysis = {
  visualCondition: 'onvoldoende_zichtbaar',
  confidence: 'beperkt',
  visibleSignals: [],
  roomsObserved: [],
  visibleRenovationLevel: 'onvoldoende_zichtbaar',
  visibleFinishQuality: 'onvoldoende_zichtbaar',
  visibleModernElements: [],
  visibleOutdatedElements: [],
  photoEvidence: [],
  renovationAreas: {
    walls: 'niet_zichtbaar',
    floors: 'niet_zichtbaar',
    windows: 'niet_zichtbaar',
    kitchen: 'niet_zichtbaar',
    bathroom: 'niet_zichtbaar',
    ceiling: 'niet_zichtbaar',
    roof: 'niet_zichtbaar',
    installations: 'niet_zichtbaar',
    insulation: 'niet_zichtbaar',
  },
  notAssessed: [
    "Keuken — Niet zichtbaar op basis van foto's",
    "Badkamer — Niet zichtbaar op basis van foto's",
    "Dak — Niet zichtbaar op basis van foto's",
    "Installaties — Niet zichtbaar op basis van foto's",
    "Isolatie — Niet zichtbaar op basis van foto's",
  ],
  attentionPoints: [],
  positivePoints: [],
  safeSummary:
    'Niet vast te stellen op basis van foto’s; de staat van afwerking kan niet worden bepaald uit bruikbare zichtbare details.',
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function stringValue(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function safeArray(value: unknown, fallback: string[] = []) {
  if (!Array.isArray(value)) return fallback

  const sanitized = value
    .map((item) => sanitizeText(String(item || '').trim()))
    .filter(Boolean)
    .slice(0, 8)

  return sanitized.length > 0 ? sanitized : fallback
}

function enumValue<T extends readonly string[]>(
  value: unknown,
  allowed: T,
  fallback: T[number],
): T[number] {
  const raw = stringValue(value)

  return allowed.includes(raw) ? (raw as T[number]) : fallback
}

function areaValue(value: unknown) {
  return enumValue(value, AREA_VALUES, 'niet_zichtbaar')
}

function renovationLevelValue(value: unknown) {
  return enumValue(value, RENOVATION_LEVEL_VALUES, 'onvoldoende_zichtbaar')
}

function finishQualityValue(value: unknown) {
  return enumValue(value, FINISH_QUALITY_VALUES, 'onvoldoende_zichtbaar')
}

function sanitizeText(value: string) {
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

function uniqueList(items: string[]) {
  return Array.from(new Set(items))
}

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

function getVisibleRooms(rooms: string[]) {
  return uniqueList(
    rooms.map((room) => room.trim().toLowerCase()).filter(Boolean),
  )
}

function hasKeyAreaCoverage(rooms: string[]) {
  const visibleRooms = getVisibleRooms(rooms)

  return KEY_AREA_SIGNALS.some((signal) =>
    visibleRooms.some((room) => room.includes(signal)),
  )
}

function calculateEvidenceConfidence(
  rooms: string[],
  photoCount: number,
): RenovatiePhotoAnalysis['confidence'] {
  const visibleAreaCount = getVisibleRooms(rooms).length

  if (photoCount <= 1 || visibleAreaCount <= 1) return 'beperkt'
  if (visibleAreaCount >= 5 && hasKeyAreaCoverage(rooms)) return 'hoog'
  if (visibleAreaCount >= 2) return 'gemiddeld'

  return 'beperkt'
}

const AREA_LABELS: Record<RenovationAreaKey, string> = {
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

function buildNotAssessedList(
  renovationAreas: Record<string, unknown>,
  providedItems: string[],
) {
  const generatedItems = (Object.keys(AREA_LABELS) as RenovationAreaKey[])
    .filter((key) => areaValue(renovationAreas[key]) === 'niet_zichtbaar')
    .map((key) => `${AREA_LABELS[key]} — Niet zichtbaar op basis van foto's`)

  return uniqueList([...providedItems, ...generatedItems]).slice(0, 12)
}

function normalizeAnalysis(
  value: unknown,
  photoCount: number,
): RenovatiePhotoAnalysis {
  if (!isRecord(value)) return defaultAnalysis

  const renovationAreas = isRecord(value.renovationAreas)
    ? value.renovationAreas
    : {}

  const roomsObserved = safeArray(
    value.roomsObserved,
    safeArray(value.visibleRooms),
  )
  const photoEvidence = safePhotoEvidence(value.photoEvidence, photoCount)

  return {
    visualCondition: enumValue(
      value.visualCondition,
      VISUAL_CONDITIONS,
      defaultAnalysis.visualCondition,
    ),
    confidence: calculateEvidenceConfidence(roomsObserved, photoCount),
    visibleSignals: safeArray(
      value.visibleSignals,
      listFromPhotoEvidence(photoEvidence, 'observations'),
    ),
    roomsObserved,
    visibleRenovationLevel: renovationLevelValue(value.visibleRenovationLevel),
    visibleFinishQuality: finishQualityValue(value.visibleFinishQuality),
    visibleModernElements: safeArray(
      value.visibleModernElements,
      listFromPhotoEvidence(photoEvidence, 'modernElements'),
    ),
    visibleOutdatedElements: safeArray(
      value.visibleOutdatedElements,
      listFromPhotoEvidence(photoEvidence, 'outdatedElements'),
    ),
    photoEvidence,
    renovationAreas: {
      walls: areaValue(renovationAreas.walls),
      floors: areaValue(renovationAreas.floors),
      windows: areaValue(renovationAreas.windows),
      kitchen: areaValue(renovationAreas.kitchen),
      bathroom: areaValue(renovationAreas.bathroom),
      ceiling: areaValue(renovationAreas.ceiling),
      roof: areaValue(renovationAreas.roof),
      installations: areaValue(renovationAreas.installations),
      insulation: areaValue(renovationAreas.insulation),
    },
    notAssessed: buildNotAssessedList(
      renovationAreas,
      safeArray(value.notAssessed),
    ),
    attentionPoints: safeArray(value.attentionPoints),
    positivePoints: safeArray(value.positivePoints),
    safeSummary:
      sanitizeText(stringValue(value.safeSummary)) || defaultAnalysis.safeSummary,
  }
}


function safePhotoEvidence(value: unknown, photoCount: number) {
  if (!Array.isArray(value)) return []

  return value
    .map((item, index) => {
      if (!isRecord(item)) return null

      const fallbackPhotoIndex = Math.min(index + 1, Math.max(photoCount, 1))
      const photoIndex = Number(item.photoIndex)
      const normalizedPhotoIndex = Number.isFinite(photoIndex)
        ? Math.max(1, Math.min(Math.floor(photoIndex), Math.max(photoCount, 1)))
        : fallbackPhotoIndex

      return {
        photoIndex: normalizedPhotoIndex,
        roomType: sanitizeText(stringValue(item.roomType)) || 'onvoldoende_zichtbaar',
        visibleRenovationLevel: renovationLevelValue(item.visibleRenovationLevel),
        visibleFinishQuality: finishQualityValue(item.visibleFinishQuality),
        modernElements: safeArray(item.modernElements, []),
        outdatedElements: safeArray(item.outdatedElements, []),
        observations: safeArray(item.observations, []),
      }
    })
    .filter((item): item is RenovatiePhotoEvidence => item !== null)
    .slice(0, MAX_PHOTOS)
}

function listFromPhotoEvidence(
  photoEvidence: RenovatiePhotoEvidence[],
  field: 'modernElements' | 'outdatedElements' | 'observations',
) {
  return uniqueList(photoEvidence.flatMap((item) => item[field])).slice(0, 8)
}

function getValidPhotos(photos: unknown) {
  if (!Array.isArray(photos)) return []

  return photos
    .map((photo) => stringValue(photo))
    .filter((photo) => /^(https?:|data:image\/)/i.test(photo))
    .slice(0, MAX_PHOTOS)
}

function buildJsonSchema() {
  return {
    name: 'renovatie_photo_analysis',
    strict: true,
    schema: {
      type: 'object',
      additionalProperties: false,
      required: [
        'visualCondition',
        'confidence',
        'visibleSignals',
        'roomsObserved',
        'visibleRenovationLevel',
        'visibleFinishQuality',
        'visibleModernElements',
        'visibleOutdatedElements',
        'photoEvidence',
        'renovationAreas',
        'notAssessed',
        'attentionPoints',
        'positivePoints',
        'safeSummary',
      ],
      properties: {
        visualCondition: { type: 'string', enum: VISUAL_CONDITIONS },
        confidence: { type: 'string', enum: CONFIDENCE_VALUES },
        visibleSignals: {
          type: 'array',
          items: { type: 'string' },
          maxItems: 8,
        },
        roomsObserved: {
          type: 'array',
          items: { type: 'string' },
          maxItems: 8,
        },
        visibleRenovationLevel: {
          type: 'string',
          enum: RENOVATION_LEVEL_VALUES,
        },
        visibleFinishQuality: {
          type: 'string',
          enum: FINISH_QUALITY_VALUES,
        },
        visibleModernElements: {
          type: 'array',
          items: { type: 'string' },
          maxItems: 8,
        },
        visibleOutdatedElements: {
          type: 'array',
          items: { type: 'string' },
          maxItems: 8,
        },
        photoEvidence: {
          type: 'array',
          maxItems: MAX_PHOTOS,
          items: {
            type: 'object',
            additionalProperties: false,
            required: [
              'photoIndex',
              'roomType',
              'visibleRenovationLevel',
              'visibleFinishQuality',
              'modernElements',
              'outdatedElements',
              'observations',
            ],
            properties: {
              photoIndex: { type: 'number' },
              roomType: { type: 'string' },
              visibleRenovationLevel: {
                type: 'string',
                enum: RENOVATION_LEVEL_VALUES,
              },
              visibleFinishQuality: {
                type: 'string',
                enum: FINISH_QUALITY_VALUES,
              },
              modernElements: {
                type: 'array',
                items: { type: 'string' },
                maxItems: 6,
              },
              outdatedElements: {
                type: 'array',
                items: { type: 'string' },
                maxItems: 6,
              },
              observations: {
                type: 'array',
                items: { type: 'string' },
                maxItems: 6,
              },
            },
          },
        },
        renovationAreas: {
          type: 'object',
          additionalProperties: false,
          required: [
            'walls',
            'floors',
            'windows',
            'kitchen',
            'bathroom',
            'ceiling',
            'roof',
            'installations',
            'insulation',
          ],
          properties: {
            walls: { type: 'string', enum: AREA_VALUES },
            floors: { type: 'string', enum: AREA_VALUES },
            windows: { type: 'string', enum: AREA_VALUES },
            kitchen: { type: 'string', enum: AREA_VALUES },
            bathroom: { type: 'string', enum: AREA_VALUES },
            ceiling: { type: 'string', enum: AREA_VALUES },
            roof: { type: 'string', enum: AREA_VALUES },
            installations: { type: 'string', enum: AREA_VALUES },
            insulation: { type: 'string', enum: AREA_VALUES },
          },
        },
        notAssessed: {
          type: 'array',
          items: { type: 'string' },
          maxItems: 12,
        },
        attentionPoints: {
          type: 'array',
          items: { type: 'string' },
          maxItems: 8,
        },
        positivePoints: {
          type: 'array',
          items: { type: 'string' },
          maxItems: 8,
        },
        safeSummary: { type: 'string' },
      },
    },
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const photos = getValidPhotos(body.photos)

    if (!photos.length) {
      return NextResponse.json({
        ...defaultAnalysis,
        visibleSignals: ['Foto’s werden niet visueel beoordeeld.'],
        attentionPoints: [
          'Niet vast te stellen op basis van foto’s; controle aanbevolen bij verdere interesse.',
        ],
      })
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API-sleutel ontbreekt.' },
        { status: 500 },
      )
    }

    const requestContext = {
      propertyId: body.propertyId ?? null,
      photoCount: photos.length,
      epc: stringValue(body.epc),
      oppervlakte: stringValue(body.oppervlakte),
      bedrooms: stringValue(body.bedrooms),
      bathrooms: stringValue(body.bathrooms),
      propertyType: stringValue(body.propertyType || body.property_type || body.type),
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_VISION_MODEL || 'gpt-4o-mini',
        temperature: 0.1,
        response_format: {
          type: 'json_schema',
          json_schema: buildJsonSchema(),
        },
        messages: [
          {
            role: 'system',
            content:
              'Je analyseert Belgische woningfoto’s voor Renovatie Scan v2: een evidence-based beoordeling van zichtbare renovatie-indicatoren. Foto’s zijn de primaire bron voor room type, renovatieniveau, afwerkingskwaliteit, moderne elementen en verouderde elementen. De architectuur is multi-photo: beoordeel elke foto apart in photoEvidence en combineer daarna de zichtbare evidence over alle foto’s. Niet-zichtbare ruimtes of componenten krijgen geen conditieoordeel en moeten als Niet zichtbaar op basis van foto’s worden vermeld. Bij één foto blijft confidence altijd beperkt en mag je nooit concluderen dat de hele woning gerenoveerd is. EPC, oppervlakte, aantal slaapkamers/badkamers en woningtype zijn alleen secundaire context voor attentionPoints en safeSummary; ze mogen zichtbaar verouderde foto-evidence nooit neutraliseren en EPC betekent niet dat het interieur gerenoveerd is. Gebruik voorzichtige taal: zichtbaar, lijkt, mogelijk, op basis van zichtbare elementen, niet vast te stellen op basis van foto’s. Verboden formuleringen: vocht aanwezig, elektriciteit slecht, asbest aanwezig, dak defect, moet vervangen worden, is slecht, is kapot. Doe geen bouwkundige, juridische of technische afkeuringen en noem geen exacte renovatiekosten.',
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text:
                  [
                    `Voer Renovatie Scan v2 uit voor de staat van afwerking op basis van ${photos.length} beschikbare foto('s).`,
                    "Analyseer alle foto's als één evidence-set, zonder aan te nemen dat foto 1 representatief is voor de hele woning.",
                    'Stap 1: maak één photoEvidence item per aangeleverde foto met photoIndex, roomType, visibleRenovationLevel, visibleFinishQuality, modernElements, outdatedElements en observations. Gebruik roomType onvoldoende_zichtbaar als de ruimte niet herkenbaar is.',
                    'Stap 2: detecteer alleen zichtbare ruimtes uit woonkamer, keuken, badkamer, slaapkamer, hal, toilet, gevel, tuin, dak, ramen, technische ruimte en zet unieke ruimtes in roomsObserved.',
                    'Stap 3: noteer alleen observeerbare visuele bevindingen in visibleSignals, positivePoints, visibleModernElements en visibleOutdatedElements, altijd met woorden zoals zichtbaar, lijkt of op basis van zichtbare elementen.',
                    'Stap 4: kies visibleRenovationLevel uit duidelijk_recent_vernieuwd, deels_vernieuwd, onderhouden_niet_recent, zichtbaar_te_moderniseren of onvoldoende_zichtbaar op basis van de zichtbare foto-evidence.',
                    'Stap 5: kies visibleFinishQuality uit hoogwaardig_zichtbaar, standaard_verzorgd, basis_of_slijtage_zichtbaar, gedateerd_of_sober of onvoldoende_zichtbaar op basis van zichtbare materialen, afwerking, slijtage en detaillering.',
                    'Stap 6: kies visualCondition uitsluitend uit: modern_afgewerkt als zichtbare ruimtes consequent duidelijk modern ogen; verzorgde_afwerking als zichtbare ruimtes netjes zijn maar niet duidelijk nieuw; gemengde_afwerking als moderne en gedateerde elementen samen zichtbaar zijn; zichtbaar_verouderd als zichtbare elementen duidelijk ouder/gedateerd zijn; onvoldoende_zichtbaar alleen als foto’s ontbreken, onduidelijk zijn, te weinig usable detail tonen of geen bruikbare interieur/exterieurdetails tonen.',
                    'Belangrijk: één duidelijke verouderde kamer of keuken is zichtbaar_verouderd, niet onvoldoende_zichtbaar; één moderne kamer is modern_afgewerkt, maar confidence blijft beperkt.',
                    'Stap 7: confidence is altijd beperkt bij één foto of bij 0-1 zichtbare ruimtes, gemiddeld bij 2-4 zichtbare ruimtes en hoog alleen bij 5 of meer zichtbare ruimtes met sleutelruimte-dekking zoals woonkamer, keuken, badkamer of exterieur; geef nooit hoog bij één foto of één ruimte.',
                    'Componentstatussen mogen alleen modern_zichtbaar, verzorgd_zichtbaar, verouderd_zichtbaar, beperkt_zichtbaar of niet_zichtbaar zijn.',
                    "Markeer elk niet zichtbaar component als niet_zichtbaar en voeg aan notAssessed toe met exact: Niet zichtbaar op basis van foto's.",
                    'Beoordeel kamers nooit op basis van andere kamers. Zeg nooit dat de hele woning gerenoveerd is op basis van één of enkele zichtbare ruimtes.',
                    'safeSummary moet vooral zichtbare foto-evidence samenvatten en mag EPC, oppervlakte, woningtype, slaapkamers en badkamers alleen als korte context vermelden; laat foto-evidence zwaarder wegen dan EPC.',
                    'Verboden: vocht aanwezig, elektriciteit slecht, asbest aanwezig, dak defect, moet vervangen worden, is slecht, is kapot.',
                    `Geef alleen JSON volgens schema. Secundaire woningcontext voor nuance, niet als vervanging van foto-evidence: ${JSON.stringify(requestContext)}`,
                  ].join(' '),
              },
              ...photos.map((photo) => ({
                type: 'image_url',
                image_url: { url: photo, detail: 'low' },
              })),
            ],
          },
        ],
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('OpenAI renovatie-photo-analysis error', data)
      return NextResponse.json(
        { error: 'Fotoanalyse kon niet worden uitgevoerd.' },
        { status: 502 },
      )
    }

    const content = data.choices?.[0]?.message?.content
    const parsed = typeof content === 'string' ? JSON.parse(content) : content

    return NextResponse.json(normalizeAnalysis(parsed, photos.length))
  } catch (error) {
    console.error(error)

    return NextResponse.json(
      { error: 'Er ging iets mis tijdens de fotoanalyse.' },
      { status: 500 },
    )
  }
}
