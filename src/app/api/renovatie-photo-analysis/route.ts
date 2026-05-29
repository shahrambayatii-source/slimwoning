import { NextResponse } from 'next/server'

const MAX_PHOTOS = 6

const VISUAL_CONDITIONS = [
  'moderne_afwerking_zichtbaar',
  'gemengde_renovatie_indruk',
  'beperkte_visuele_beoordeling',
] as const

const CONFIDENCE_VALUES = ['beperkt', 'gemiddeld', 'hoog'] as const
const AREA_VALUES = [
  'modern_zichtbaar',
  'verzorgd_zichtbaar',
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

type RenovatiePhotoAnalysis = {
  visualCondition: (typeof VISUAL_CONDITIONS)[number]
  confidence: (typeof CONFIDENCE_VALUES)[number]
  visibleSignals: string[]
  roomsObserved: string[]
  renovationAreas: Record<RenovationAreaKey, string>
  notAssessed: string[]
  attentionPoints: string[]
  positivePoints: string[]
  safeSummary: string
}

const defaultAnalysis: RenovatiePhotoAnalysis = {
  visualCondition: 'beperkte_visuele_beoordeling',
  confidence: 'beperkt',
  visibleSignals: [],
  roomsObserved: [],
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
    'Niet vast te stellen op basis van foto’s; gebruik de beschikbare woninggegevens als indicatieve basis.',
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function stringValue(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function safeArray(value: unknown, fallback: string[] = []) {
  if (!Array.isArray(value)) return fallback

  return value
    .map((item) => sanitizeText(String(item || '').trim()))
    .filter(Boolean)
    .slice(0, 8)
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

function calculateEvidenceConfidence(
  rooms: string[],
): RenovatiePhotoAnalysis['confidence'] {
  const visibleAreaCount = uniqueList(
    rooms.map((room) => room.toLowerCase()),
  ).length

  if (visibleAreaCount >= 5) return 'hoog'
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

function normalizeAnalysis(value: unknown): RenovatiePhotoAnalysis {
  if (!isRecord(value)) return defaultAnalysis

  const renovationAreas = isRecord(value.renovationAreas)
    ? value.renovationAreas
    : {}

  const roomsObserved = safeArray(
    value.roomsObserved,
    safeArray(value.visibleRooms),
  )

  return {
    visualCondition: enumValue(
      value.visualCondition,
      VISUAL_CONDITIONS,
      defaultAnalysis.visualCondition,
    ),
    confidence: calculateEvidenceConfidence(roomsObserved),
    visibleSignals: safeArray(value.visibleSignals),
    roomsObserved,
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

    const propertyContext = {
      propertyId: body.propertyId ?? null,
      title: body.title ?? null,
      epc: body.epc ?? null,
      bouwjaar: body.bouwjaar ?? null,
      oppervlakte: body.oppervlakte ?? null,
      bedrooms: body.bedrooms ?? null,
      bathrooms: body.bathrooms ?? null,
      heating: body.heating ?? null,
      description: body.description ?? null,
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
              'Je analyseert Belgische woningfoto’s voor Renovatie Scan v2: een evidence-based visuele beoordeling. Beoordeel uitsluitend wat zichtbaar is op de foto’s. Niet zichtbare ruimtes of componenten krijgen geen conditieoordeel en moeten als Niet zichtbaar op basis van foto’s worden vermeld. Gebruik woningdata alleen als ondersteunende context; EPC, bouwjaar of beschrijving mogen nooit een zichtbaar oordeel vervangen. Gebruik voorzichtige taal: zichtbaar, lijkt, mogelijk, op basis van zichtbare elementen, niet vast te stellen op basis van foto’s. Verboden formuleringen: vocht aanwezig, elektriciteit slecht, asbest aanwezig, dak defect, moet vervangen worden, is slecht, is kapot. Doe geen bouwkundige, juridische of technische afkeuringen.',
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text:
                  'Voer Renovatie Scan v2 uit. Stap 1: detecteer alleen zichtbare ruimtes uit woonkamer, keuken, badkamer, slaapkamer, hal, toilet, gevel, tuin, dak, ramen, technische ruimte en zet die in roomsObserved. Stap 2: noteer alleen observeerbare visuele bevindingen in visibleSignals en positivePoints, altijd met woorden zoals zichtbaar, lijkt of op basis van zichtbare elementen. Stap 3: gebruik EPC, bouwjaar, oppervlakte en beschrijving alleen als context in safeSummary, nooit om een niet-zichtbare ruimte te beoordelen. Stap 4: confidence is beperkt bij 0-1 zichtbare ruimtes, gemiddeld bij 2-4 en hoog bij 5 of meer; geef nooit hoog bij één ruimte. Componentstatussen mogen alleen modern_zichtbaar, verzorgd_zichtbaar, beperkt_zichtbaar of niet_zichtbaar zijn. Markeer elk niet zichtbaar component als niet_zichtbaar en voeg aan notAssessed toe met exact: Niet zichtbaar op basis van foto\'s. Beoordeel kamers nooit op basis van andere kamers. Verboden: vocht aanwezig, elektriciteit slecht, asbest aanwezig, dak defect, moet vervangen worden. Geef alleen JSON volgens schema. Woningdata: ' +
                  JSON.stringify(propertyContext),
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

    return NextResponse.json(normalizeAnalysis(parsed))
  } catch (error) {
    console.error(error)

    return NextResponse.json(
      { error: 'Er ging iets mis tijdens de fotoanalyse.' },
      { status: 500 },
    )
  }
}
