import { NextResponse } from 'next/server'

const MAX_PHOTOS = 6

const VISUAL_CONDITIONS = [
  'instapklaar',
  'lichte_opfrissing',
  'gerichte_renovatie',
  'grondige_renovatie',
  'totaalrenovatie',
] as const

const CONFIDENCE_VALUES = ['laag', 'gemiddeld', 'hoog'] as const
const AREA_VALUES = ['goed', 'opfrissen', 'renoveren', 'onduidelijk'] as const
const ROOM_AREA_VALUES = [
  'goed',
  'opfrissen',
  'renoveren',
  'ontbreekt',
  'onduidelijk',
] as const

type RenovationAreaKey =
  | 'walls'
  | 'floors'
  | 'windows'
  | 'kitchen'
  | 'bathroom'
  | 'ceiling'

type RenovatiePhotoAnalysis = {
  visualCondition: (typeof VISUAL_CONDITIONS)[number]
  confidence: (typeof CONFIDENCE_VALUES)[number]
  visibleSignals: string[]
  roomsObserved: string[]
  renovationAreas: Record<RenovationAreaKey, string>
  attentionPoints: string[]
  positivePoints: string[]
  safeSummary: string
}

const defaultAnalysis: RenovatiePhotoAnalysis = {
  visualCondition: 'lichte_opfrissing',
  confidence: 'laag',
  visibleSignals: [],
  roomsObserved: [],
  renovationAreas: {
    walls: 'onduidelijk',
    floors: 'onduidelijk',
    windows: 'onduidelijk',
    kitchen: 'onduidelijk',
    bathroom: 'onduidelijk',
    ceiling: 'onduidelijk',
  },
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

function areaValue(value: unknown, allowsMissingRoom = false) {
  return enumValue(
    value,
    allowsMissingRoom ? ROOM_AREA_VALUES : AREA_VALUES,
    'onduidelijk',
  )
}

function sanitizeText(value: string) {
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

function normalizeAnalysis(value: unknown): RenovatiePhotoAnalysis {
  if (!isRecord(value)) return defaultAnalysis

  const renovationAreas = isRecord(value.renovationAreas)
    ? value.renovationAreas
    : {}

  return {
    visualCondition: enumValue(
      value.visualCondition,
      VISUAL_CONDITIONS,
      defaultAnalysis.visualCondition,
    ),
    confidence: enumValue(value.confidence, CONFIDENCE_VALUES, 'laag'),
    visibleSignals: safeArray(value.visibleSignals),
    roomsObserved: safeArray(value.roomsObserved),
    renovationAreas: {
      walls: areaValue(renovationAreas.walls),
      floors: areaValue(renovationAreas.floors),
      windows: areaValue(renovationAreas.windows),
      kitchen: areaValue(renovationAreas.kitchen, true),
      bathroom: areaValue(renovationAreas.bathroom, true),
      ceiling: areaValue(renovationAreas.ceiling),
    },
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
          ],
          properties: {
            walls: { type: 'string', enum: AREA_VALUES },
            floors: { type: 'string', enum: AREA_VALUES },
            windows: { type: 'string', enum: AREA_VALUES },
            kitchen: { type: 'string', enum: ROOM_AREA_VALUES },
            bathroom: { type: 'string', enum: ROOM_AREA_VALUES },
            ceiling: { type: 'string', enum: AREA_VALUES },
          },
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
              'Je analyseert Belgische woningfoto’s voor een indicatieve Renovatie Scan. Baseer de visuele score primair op zichtbare afwerking en zichtbare staat van ruimtes. Gebruik uitsluitend voorzichtige professionele taal. Verboden formuleringen: moet vervangen worden, is kapot, is technisch afgekeurd, elektriciteit is slecht, vocht aanwezig. Gebruik veilige formuleringen zoals zichtbaar verouderd, lijkt verouderd, controle aanbevolen, op basis van zichtbare elementen, niet vast te stellen op basis van foto’s. Doe geen bouwkundige, juridische of technische afkeuringen.',
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text:
                  'Analyseer maximaal deze woningfoto’s en combineer ze met de woningdata. Classificatie: oud behang/oude vloeren/gedateerde haard/gedateerd interieur = gerichte_renovatie; volledig houten of duidelijk gedateerde afwerking = grondige_renovatie; zichtbare onafgewerkte wanden/plafonds/balken of ontbrekende keuken = totaalrenovatie; moderne vloeren, nette muren, recente keuken/badkamer = instapklaar of lichte_opfrissing. Geef alleen JSON volgens schema. Woningdata: ' +
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
