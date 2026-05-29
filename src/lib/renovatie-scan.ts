export type RenovatieKostenrange =
  | '€2.000 - €7.500'
  | '€7.500 - €20.000'
  | '€20.000 - €50.000'
  | '€50.000 - €100.000'
  | '€100.000+'

export type RenovatieScan = {
  renovatieniveau: 'Lichte opfrissing' | 'Gerichte renovatie' | 'Grondige renovatie' | 'Totaalrenovatie'
  renovatiecategorie: string
  betrouwbaarheid: 'Laag' | 'Gemiddeld' | 'Hoog'
  pluspunten: string[]
  aandachtspunten: string[]
  kostenrange: RenovatieKostenrange
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

function boolValue(value: unknown) {
  if (value === null || value === undefined || value === '') return null
  if (typeof value === 'boolean') return value

  const normalized = String(value).toLowerCase().trim()

  if (['true', 'ja', 'yes', '1', 'aanwezig'].includes(normalized)) return true
  if (['false', 'nee', 'no', '0', 'niet aanwezig'].includes(normalized)) return false

  return null
}

function hasKnownValue(value: unknown) {
  return value !== null && value !== undefined && String(value).trim() !== ''
}

function normalizeText(...values: unknown[]) {
  return values.filter(hasKnownValue).join(' ').toLowerCase()
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
  'image',
  'images',
  'photos',
  'property_images',
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
] as const

function addPhotoReferences(
  value: unknown,
  references: string[],
  fallbackKey: string
) {
  if (value === null || value === undefined) return

  if (Array.isArray(value)) {
    value.forEach((item, index) =>
      addPhotoReferences(item, references, `${fallbackKey}.${index}`)
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
  providedPhotoCount?: number
) {
  if (Number.isFinite(providedPhotoCount)) {
    return Math.max(0, Math.floor(providedPhotoCount || 0))
  }

  const propertyPhotoCount = numberValue(
    property.photo_count ||
      property.photoCount ||
      property.foto_count ||
      property.fotoCount ||
      property.aantal_fotos
  )

  if (propertyPhotoCount > 0) return Math.floor(propertyPhotoCount)

  const references: string[] = []

  PROPERTY_IMAGE_FIELDS.forEach((field) => {
    addPhotoReferences(property[field], references, field)
  })

  return new Set(references).size
}

function getArea(property: Record<string, unknown>) {
  return numberValue(
    property.bewoonbare_oppervlakte ||
      property.woonoppervlakte ||
      property.livingArea ||
      property.living_area ||
      property.oppervlakte ||
      property.area
  )
}

function getEpcBand(epc: string) {
  const label = epc.trim().toUpperCase()

  if (['A+++++', 'A++++', 'A+++', 'A++', 'A+', 'A'].includes(label)) return 'good'
  if (['B', 'C'].includes(label)) return 'average'
  if (['D', 'E', 'F'].includes(label)) return 'attention'
  if (label === 'G') return 'poor'

  return 'unknown'
}

function getAreaTier(area: number) {
  if (area <= 0) return 1
  if (area < 80) return 0
  if (area <= 150) return 1
  if (area <= 250) return 2
  return 3
}

function getCostRange(score: number, area: number): RenovatieKostenrange {
  const areaTier = getAreaTier(area)
  let costTier = score < 18
    ? 0
    : score < 38
      ? 1
      : score < 62
        ? 2
        : score < 82
          ? 3
          : 4

  if (areaTier === 0 && score < 62) costTier -= 1
  if (areaTier === 2 && score >= 28) costTier += 1
  if (areaTier === 3 && score >= 18) costTier += 2

  const clampedTier = Math.max(0, Math.min(4, costTier))

  if (clampedTier === 0) return '€2.000 - €7.500'
  if (clampedTier === 1) return '€7.500 - €20.000'
  if (clampedTier === 2) return '€20.000 - €50.000'
  if (clampedTier === 3) return '€50.000 - €100.000'
  return '€100.000+'
}

export function getRenovatieScan(property: Record<string, unknown>, photoCount?: number): RenovatieScan {
  const area = getArea(property)
  const buildYear = numberValue(property.bouwjaar || property.build_year)
  const bedrooms = numberValue(property.slaapkamers || property.bedrooms)
  const bathrooms = numberValue(property.badkamers || property.bathrooms)
  const epc = String(property.epc || property.epc_label || property.epc_code || property.EPC || '')
  const epcBand = getEpcBand(epc)
  const availablePhotoCount = getPhotoCount(property, photoCount)
  const beperkteFotoInformatie = availablePhotoCount < 3
  const renovationRequirement = boolValue(property.renovatieverplichting)
  const doubleGlass = boolValue(property.dubbel_glas || property.hr_glas)
  const roofInsulation = boolValue(property.dakisolatie)
  const wallInsulation = boolValue(property.muurisolatie)
  const floorInsulation = boolValue(property.vloerisolatie)
  const hasHeatPump = boolValue(property.warmtepomp)
  const hasSolarPanels = boolValue(property.zonnepanelen)
  const lastRenovationYear = numberValue(
    property.renovatiejaar || property.laatste_renovatiejaar || property.last_renovation_year
  )

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
    property.renovatieverplichting,
    property.soort_bouw,
    property.verwarmingstype
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
  const lightSignals = ['op te frissen', 'opfrissen', 'lichte renovatie', 'cosmetisch']
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

  const hasReadySignal = readySignals.some((signal) => hasTextSignal(text, signal))
  const hasLightSignal = lightSignals.some((signal) => hasTextSignal(text, signal))
  const hasHeavySignal = heavySignals.some((signal) => hasTextSignal(text, signal))

  let score = 20
  const pluspunten: string[] = []
  const aandachtspunten: string[] = []

  if (availablePhotoCount >= 5) pluspunten.push('Meerdere foto’s beschikbaar voor een betere eerste inschatting.')
  if (beperkteFotoInformatie) aandachtspunten.push(LIMITED_PHOTO_TEXT)

  if (area > 250) {
    score += 20
    aandachtspunten.push('Zeer grote bewoonbare oppervlakte kan de indicatieve renovatiekost sterk verhogen.')
  } else if (area > 150) {
    score += 12
    aandachtspunten.push('Grotere bewoonbare oppervlakte kan renovatiewerken omvangrijker maken.')
  } else if (area >= 80) {
    score += 4
  } else if (area > 0) {
    score -= 6
    pluspunten.push('Compactere oppervlakte kan werken overzichtelijker houden.')
  } else {
    aandachtspunten.push('Bewoonbare oppervlakte ontbreekt in de beschikbare gegevens.')
  }

  if (buildYear) {
    if (buildYear < 1950) {
      score += 22
      aandachtspunten.push('Ouder bouwjaar: controleer structuur, technieken, dak en isolatie extra zorgvuldig.')
    } else if (buildYear < 1985) {
      score += 14
      aandachtspunten.push('Bouwperiode wijst op mogelijke verouderde technieken of isolatie.')
    } else if (buildYear >= 2010) {
      score -= 12
      pluspunten.push('Recent bouwjaar verlaagt doorgaans de renovatiekans.')
    }
  } else {
    aandachtspunten.push('Bouwjaar ontbreekt in de beschikbare gegevens.')
  }

  if (epcBand === 'good') {
    score -= 18
    pluspunten.push(`EPC ${epc.toUpperCase()} wijst op een sterke energetische uitgangspositie.`)
  } else if (epcBand === 'average') {
    pluspunten.push(`EPC ${epc.toUpperCase()} geeft een neutrale tot redelijke energetische basis aan.`)
  } else if (epcBand === 'attention') {
    score += 18
    aandachtspunten.push(`EPC ${epc.toUpperCase()} verhoogt de indicatieve kans op energetische renovatiewerken.`)
  } else if (epcBand === 'poor') {
    score += 28
    aandachtspunten.push(`EPC ${epc.toUpperCase()} wijst op verhoogde kans op energiewerken.`)
  } else {
    aandachtspunten.push('EPC-label ontbreekt of is niet duidelijk beschikbaar.')
  }

  if (renovationRequirement === true) {
    score += 30
    aandachtspunten.push('Renovatieverplichting is opgegeven: controleer wettelijke timing en vereiste werken.')
  } else if (renovationRequirement === false) {
    pluspunten.push('Geen renovatieverplichting opgegeven in de beschikbare data.')
  }

  if (lastRenovationYear >= 2015) {
    score -= 18
    pluspunten.push('Recente renovatie-informatie is beschikbaar.')
  } else if (lastRenovationYear > 0 && lastRenovationYear < 2005) {
    score += 8
    aandachtspunten.push('Laatste renovatie lijkt ouder; controleer afwerking en technieken.')
  }

  if (doubleGlass === true) pluspunten.push('Dubbel of hoogrendementsglas is opgegeven.')
  if (doubleGlass === false) {
    score += 10
    aandachtspunten.push('Ramen/beglazing verdienen aandacht volgens de beschikbare data.')
  }

  if (roofInsulation === true || wallInsulation === true || floorInsulation === true) {
    pluspunten.push('Er is isolatie-informatie met minstens één positief isolatiesignaal beschikbaar.')
  }
  if (roofInsulation === false || wallInsulation === false || floorInsulation === false) {
    score += 10
    aandachtspunten.push('Een of meerdere isolatievelden staan als ontbrekend of negatief opgegeven.')
  }

  if (hasHeatPump === true || hasSolarPanels === true) {
    score -= 8
    pluspunten.push('Duurzame technieken zoals warmtepomp of zonnepanelen zijn opgegeven.')
  }

  if (bathrooms >= 3 && !hasReadySignal) {
    score += 8
    aandachtspunten.push('Meerdere badkamers kunnen de kost voor cosmetische vernieuwing verhogen.')
  } else if (bathrooms >= 2 && !hasReadySignal) {
    score += 4
    aandachtspunten.push('Meerdere badkamers kunnen extra afwerkingsbudget vragen.')
  } else if (bathrooms >= 2) {
    pluspunten.push('Meerdere badkamers zijn opgegeven; beschrijving wijst ook op recente of vernieuwde afwerking.')
  }
  if (bedrooms >= 4 && bathrooms <= 1 && bathrooms > 0) {
    score += 5
    aandachtspunten.push('Aantal slaapkamers tegenover badkamers kan functionele updates wenselijk maken.')
  }

  if (hasReadySignal) {
    score -= 18
    pluspunten.push('Beschrijving bevat instapklare of vernieuwde signalen.')
  }
  if (hasLightSignal) {
    score += 18
    aandachtspunten.push('Beschrijving bevat signalen voor opfrissing of lichte renovatie.')
  }
  if (hasHeavySignal) {
    score += 35
    aandachtspunten.push('Beschrijving bevat duidelijke renovatiesignalen.')
  }

  const clampedScore = Math.max(0, Math.min(100, score))
  const renovatieniveau: RenovatieScan['renovatieniveau'] = clampedScore < 25
    ? 'Lichte opfrissing'
    : clampedScore < 50
      ? 'Gerichte renovatie'
      : clampedScore < 75
        ? 'Grondige renovatie'
        : 'Totaalrenovatie'

  if (clampedScore < 25) {
    pluspunten.push('Renovatieniveau laag op basis van de beschikbare woningdata.')
  } else if (clampedScore < 65) {
    aandachtspunten.push('Renovatieniveau gemiddeld op basis van de beschikbare woningdata.')
  } else {
    aandachtspunten.push('Renovatieniveau hoog op basis van de beschikbare woningdata.')
  }

  const renovatiecategorie = clampedScore < 25
    ? 'Cosmetische opfrissing en beperkte afwerking'
    : clampedScore < 50
      ? 'Gerichte werken aan comfort, afwerking of technieken'
      : clampedScore < 75
        ? 'Meerdere technische en energetische werken waarschijnlijk'
        : 'Zeer ingrijpende renovatie of renovatieplicht mogelijk'

  const knownDataPoints = [
    area,
    epc,
    buildYear,
    bedrooms,
    bathrooms,
    property.description || property.beschrijving,
    availablePhotoCount > 0 ? availablePhotoCount : null,
    property.renovatieverplichting,
    property.renovatiejaar || property.laatste_renovatiejaar,
    property.dubbel_glas || property.hr_glas,
    property.dakisolatie || property.muurisolatie || property.vloerisolatie,
  ].filter(hasKnownValue).length

  const betrouwbaarheid: RenovatieScan['betrouwbaarheid'] = availablePhotoCount >= 5 && knownDataPoints >= 7
    ? 'Hoog'
    : knownDataPoints >= 8 && availablePhotoCount >= 3
      ? 'Hoog'
      : availablePhotoCount >= 5 && knownDataPoints >= 4
        ? 'Gemiddeld'
        : knownDataPoints >= 5
          ? 'Gemiddeld'
          : 'Laag'

  const fallbackPluspunten = ['Beschikbare woningdata is gebruikt voor een indicatieve renovatie-inschatting.']
  const fallbackAandachtspunten = ['Controleer de technische staat altijd tijdens een plaatsbezoek.']

  return {
    renovatieniveau,
    renovatiecategorie,
    betrouwbaarheid,
    pluspunten: uniqueList(pluspunten).slice(0, 5).length > 0 ? uniqueList(pluspunten).slice(0, 5) : fallbackPluspunten,
    aandachtspunten: uniqueList(aandachtspunten).slice(0, 6).length > 0 ? uniqueList(aandachtspunten).slice(0, 6) : fallbackAandachtspunten,
    kostenrange: getCostRange(clampedScore, area),
    beperkteFotoInformatie,
  }
}
