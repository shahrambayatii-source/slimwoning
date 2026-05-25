export const CANONICAL_EPC_LABELS = [
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

export const CANONICAL_PROPERTY_TYPES = [
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
]

export const CANONICAL_LOCATION_TAGS = [
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

export const CANONICAL_OUTDOOR_TAGS = ['Balkon', 'Dakterras', 'Tuin']

export const CANONICAL_GARAGE_TAGS = [
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

export const CANONICAL_PARKING_TAGS = [
  'Op eigen terrein',
  'Op afgesloten terrein',
  'Openbaar parkeren',
  'Betaald parkeren',
  'Parkeergarage',
  'Parkeervergunningen',
]

export const CANONICAL_ACCESSIBILITY_TAGS = [
  'Lift aanwezig',
  'Enkele woonlaag',
  'Voor mensen met een beperking',
  'Voor ouderen',
  'Aangepaste woning',
  'Op de begane grond',
]

export const CANONICAL_FEATURE_TAGS = [
  'Duurzame energie',
  'CV-ketel',
  'Zwembad',
  'Lig-/zitbad',
  'Open haard',
  'Kluswoning',
  'Dubbele bewoning',
]

export const CANONICAL_DESTINATIONS = ['Recreatiewoning', 'Permanente bewoning']
export const CANONICAL_GARDEN_ORIENTATIONS = ['Noord', 'Oost', 'Zuid', 'West']

const CITY_ALIASES: Record<string, string> = {
  brussels: 'Brussel',
  Bruxelles: 'Brussel',
  bruxelles: 'Brussel',
  ghent: 'Gent',
  gand: 'Gent',
  antwerp: 'Antwerpen',
  bruges: 'Brugge',
  liege: 'Liège',
  liège: 'Liège',
  malines: 'Mechelen',
  namur: 'Namur',
}

const VALUE_ALIASES: Record<string, string> = {
  garden: 'Tuin',
  tuin: 'Tuin',
  terrace: 'Terras',
  parking: 'Parkeerplaats',
  'parking spot': 'Parkeerplaats',
  parkeerplek: 'Parkeerplaats',
  parkeerplaats: 'Parkeerplaats',
  centrum: 'Centrum',
  center: 'Centrum',
  centre: 'Centrum',
  lift: 'Lift aanwezig',
  elevator: 'Lift aanwezig',
}

function cleanText(value: unknown) {
  return String(value ?? '').trim().replace(/\s+/g, ' ')
}

function lookupKey(value: string) {
  return value.toLowerCase().trim()
}

function titleCase(value: string) {
  return value
    .toLowerCase()
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function normalizeFromAllowed(value: unknown, allowedValues: string[]) {
  const cleaned = cleanText(value)

  if (!cleaned) return ''

  const alias = VALUE_ALIASES[lookupKey(cleaned)]
  const candidate = alias || cleaned
  const matchingValue = allowedValues.find(
    (allowedValue) => lookupKey(allowedValue) === lookupKey(candidate)
  )

  return matchingValue || titleCase(candidate)
}

export function normalizeCity(value: unknown) {
  const cleaned = cleanText(value)

  if (!cleaned) return ''

  return CITY_ALIASES[lookupKey(cleaned)] || titleCase(cleaned)
}

export function normalizePropertyType(value: unknown) {
  return normalizeFromAllowed(value, CANONICAL_PROPERTY_TYPES)
}

export function normalizeEpcLabel(value: unknown) {
  const cleaned = cleanText(value).toUpperCase()

  if (!cleaned) return ''

  return CANONICAL_EPC_LABELS.includes(cleaned) ? cleaned : cleaned
}

export function normalizeLocationTag(value: unknown) {
  return normalizeFromAllowed(value, CANONICAL_LOCATION_TAGS)
}

export function normalizeOutdoorTag(value: unknown) {
  return normalizeFromAllowed(value, CANONICAL_OUTDOOR_TAGS)
}

export function normalizeGarageTag(value: unknown) {
  return normalizeFromAllowed(value, CANONICAL_GARAGE_TAGS)
}

export function normalizeParkingTag(value: unknown) {
  return normalizeFromAllowed(value, CANONICAL_PARKING_TAGS)
}

export function normalizeAccessibilityTag(value: unknown) {
  return normalizeFromAllowed(value, CANONICAL_ACCESSIBILITY_TAGS)
}

export function normalizeFeatureTag(value: unknown) {
  return normalizeFromAllowed(value, CANONICAL_FEATURE_TAGS)
}

export function normalizeDestination(value: unknown) {
  return normalizeFromAllowed(value, CANONICAL_DESTINATIONS)
}

export function normalizeGardenOrientation(value: unknown) {
  return normalizeFromAllowed(value, CANONICAL_GARDEN_ORIENTATIONS)
}

export function normalizeTagArray(
  values: unknown,
  allowedValues?: string[]
) {
  const rawValues = Array.isArray(values) ? values : [values]
  const seen = new Set<string>()
  const normalizedValues: string[] = []

  rawValues.forEach((value) => {
    const normalizedValue = allowedValues
      ? normalizeFromAllowed(value, allowedValues)
      : normalizeFromAllowed(value, [])

    if (!normalizedValue) return

    const key = lookupKey(normalizedValue)

    if (seen.has(key)) return

    seen.add(key)
    normalizedValues.push(normalizedValue)
  })

  return normalizedValues
}

export function normalizeBooleanValue(value: unknown) {
  if (value === null || value === undefined || value === '') return null
  if (typeof value === 'boolean') return value

  const normalized = cleanText(value).toLowerCase()

  if (['true', 'ja', 'yes', '1', 'aanwezig'].includes(normalized)) return true
  if (['false', 'nee', 'no', '0', 'niet aanwezig'].includes(normalized)) return false

  return null
}
