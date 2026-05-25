import { getWoningkenmerken } from './woningkenmerken'

export type EnergyInsight = {
  priority: 'low' | 'medium' | 'high'
  confidence: 'low' | 'medium' | 'high'
  estimatedMin: number
  estimatedMax: number
  propertyType: PropertyType
  aiSummary: string
  epcTrajectory: {
    current: string
    target: string
    text: string
  }
  predictedEpcAfterImprovements: string
  futureProofScore: {
    level: 'Hoog' | 'Gemiddeld' | 'Laag'
    text: string
  }
  energyRisk: {
    level: 'Laag' | 'Gemiddeld' | 'Hoog'
    text: string
  }
  comfortImpact: {
    level: 'Beperkt' | 'Merkbaar' | 'Groot'
    text: string
  }
  yearlySavingsEstimate: {
    min: number
    max: number
    text: string
  } | null
  valuePotential: {
    level: 'Beperkt' | 'Gemiddeld' | 'Interessant renovatiepotentieel'
    text: string
  }
  energySavingImpact: string
  heatingAnalysis: string
  subsidySuggestions: string[]
  recommendationPriority: 'Informatief' | 'Aanbevolen' | 'Belangrijk' | 'Wettelijk relevant'
  costConfidence: string
  prioritizedRecommendations: {
    text: string
    priority: 'Informatief' | 'Aanbevolen' | 'Belangrijk' | 'Wettelijk relevant'
  }[]
  recommendations: string[]
  warnings: string[]
  costBreakdown: {
    workType: string
    formula: string
    estimatedMin: number
    estimatedMax: number
  }[]
}

const INSUFFICIENT_DATA_TEXT = 'Onvoldoende gegevens beschikbaar voor een betrouwbare inschatting.'

type EpcBand = 'good' | 'acceptable' | 'minimum' | 'obligation' | 'poor' | 'unknown'
export type PropertyType = 'appartement' | 'duplex' | 'rijwoning' | 'halfopen' | 'open bebouwing' | 'penthouse' | 'studio' | 'woning'

type EnergyContext = {
  epc: string
  epcBand: EpcBand
  propertyType: PropertyType
  area: number
  buildYear: number
  hasOldBuilding: boolean
  hasRenovationInfo: boolean
  isApartment: boolean
  dakisolatie: boolean | null
  muurisolatie: boolean | null
  vloerisolatie: boolean | null
  dubbelGlas: boolean | null
  heating: string
  heatingType: 'warmtepomp' | 'condensatieketel' | 'elektrisch' | 'stookolie' | 'oude gasketel' | 'gas' | 'unknown'
  hasInefficientHeating: boolean
  primaryEnergy: number
  co2: number
  zonnepanelen: boolean | null
  thermischeZonnepanelen: boolean | null
  warmtepomp: boolean | null
  woningkenmerken: string[]
  amenities: string[]
  floodDataText: string
}

export const futureEnergyModules = [
  'zonnepanelen',
  'warmtepomp',
  'epc_trajectory',
  'subsidy_suggestions',
  'battery_storage',
  'smart_heating',
  'ventilation',
] as const

function numberValue(value: unknown) {
  const number = Number(value)
  return Number.isFinite(number) ? number : 0
}

function boolValue(value: unknown) {
  if (value === null || value === undefined || value === '') return null

  const normalized = String(value).toLowerCase().trim()

  if (['true', 'ja', 'yes', '1'].includes(normalized)) return true
  if (['false', 'nee', 'no', '0'].includes(normalized)) return false

  return null
}

function hasKnownValue(value: unknown) {
  return value !== null && value !== undefined && value !== ''
}

function firstKnownValue(...values: unknown[]) {
  return values.find(hasKnownValue)
}

function textValue(...values: unknown[]) {
  return values.filter(Boolean).join(' ').toLowerCase()
}

function uniqueList(items: string[]) {
  return Array.from(new Set(items))
}

function getKnownAmenities(property: Record<string, unknown>) {
  return [
    boolValue(property.parking) === true ? 'parking' : '',
    boolValue(property.tuin) === true ? 'tuin' : '',
    boolValue(property.terras) === true ? 'terras' : '',
    boolValue(property.lift) === true ? 'lift' : '',
    boolValue(property.gemeubeld) === true ? 'gemeubeld' : '',
  ].filter(Boolean)
}

function getFloodDataText(property: Record<string, unknown>) {
  const floodValue = firstKnownValue(
    property.overstromingscertificaat,
    property.overstromingsgevoeligheid,
    property.overstromingsrisico,
    property.overstroming_zonetype,
    property.p_score,
    property.g_score
  )

  if (!floodValue) return ''

  const pScore = property.p_score ? `P-score ${property.p_score}` : ''
  const gScore = property.g_score ? `G-score ${property.g_score}` : ''
  const scores = [pScore, gScore].filter(Boolean).join(', ')

  return `Overstromingsdata is beschikbaar${scores ? ` (${scores})` : ''}. Dit beïnvloedt de energiekost niet rechtstreeks, maar hoort bij de bredere aankoopcontrole.`
}

function isClearlyInefficientHeating(value: unknown) {
  const heating = String(value || '').toLowerCase().trim()

  if (!heating || heating.includes('warmtepomp')) return false

  return [
    'mazout',
    'stookolie',
    'olie',
    'elektrisch',
    'direct elektrisch',
    'accumulatie',
    'kolen',
  ].some((term) => heating.includes(term))
}

function detectHeatingType(value: unknown): EnergyContext['heatingType'] {
  const heating = String(value || '').toLowerCase().trim()

  if (!heating) return 'unknown'
  if (heating.includes('warmtepomp')) return 'warmtepomp'
  if (heating.includes('condens')) return 'condensatieketel'
  if (heating.includes('mazout') || heating.includes('stookolie') || heating.includes('olie')) return 'stookolie'
  if (heating.includes('elektrisch') || heating.includes('accumulatie')) return 'elektrisch'
  if (heating.includes('oude') && heating.includes('gas')) return 'oude gasketel'
  if (heating.includes('gas')) return 'gas'
  return 'unknown'
}

function hasKenmerk(context: EnergyContext, label: string) {
  return context.woningkenmerken.includes(label)
}

function getEpcBand(epc: string): EpcBand {
  if (['A+++++', 'A++++', 'A+++', 'A++', 'A+', 'A', 'B'].includes(epc)) return 'good'
  if (epc === 'C') return 'acceptable'
  if (epc === 'D') return 'minimum'
  if (['E', 'F'].includes(epc)) return 'obligation'
  if (epc === 'G') return 'poor'
  return 'unknown'
}

function detectPropertyType(property: Record<string, unknown>): PropertyType {
  const propertyText = textValue(
    property.woning_type,
    property.woningtype,
    property.type,
    property.property_type,
    property.category,
    property.title,
    property.description
  )

  if (propertyText.includes('penthouse')) return 'penthouse'
  if (propertyText.includes('duplex')) return 'duplex'
  if (propertyText.includes('studio')) return 'studio'
  if (propertyText.includes('appartement')) return 'appartement'
  if (propertyText.includes('halfopen') || propertyText.includes('half open')) return 'halfopen'
  if (propertyText.includes('open bebouwing') || propertyText.includes('vrijstaand')) return 'open bebouwing'
  if (propertyText.includes('rijwoning') || propertyText.includes('gesloten bebouwing')) return 'rijwoning'
  return 'woning'
}

function isApartmentType(propertyType: PropertyType) {
  return ['appartement', 'duplex', 'studio', 'penthouse'].includes(propertyType)
}

function getLeadAdvice(context: EnergyContext) {
  if (context.epcBand === 'unknown') return INSUFFICIENT_DATA_TEXT

  if (context.epcBand === 'good') {
    return 'Volgens de beschikbare woningdata wijst het EPC-label momenteel op een gunstig niveau. Er lijkt geen verplichte energierenovatie nodig richting 2030, maar dit blijft indicatief en moet met het officiële EPC-attest worden gecontroleerd.'
  }

  if (context.epcBand === 'acceptable') {
    return 'Deze woning scoort momenteel redelijk op energievlak. Op basis van de beschikbare gegevens lijkt er geen directe renovatieverplichting, maar bijkomende energiemaatregelen kunnen later interessant worden.'
  }

  if (context.epcBand === 'minimum') {
    return 'Deze woning bevindt zich op het minimum aanbevolen energieniveau. Extra isolatie of energieverbeteringen kunnen op termijn aangewezen zijn.'
  }

  if (context.epcBand === 'obligation') {
    return 'Renovatieverplichting: bij aankoop moet deze woning binnen de wettelijke termijn minstens EPC-label D behalen. Controle van isolatie, ramen en verwarmingssysteem wordt sterk aanbevolen.'
  }

  if (context.epcBand === 'poor') {
    return 'Dit EPC-label wijst op een duidelijke energetische uitdaging. Op basis van de beschikbare gegevens zijn isolatie, ramen en verwarming prioritaire controlepunten.'
  }

  return INSUFFICIENT_DATA_TEXT
}

function getAiSummary(context: EnergyContext) {
  if (context.epcBand === 'unknown') return INSUFFICIENT_DATA_TEXT

  const supportingSignals = [
    context.zonnepanelen === true,
    context.thermischeZonnepanelen === true,
    context.warmtepomp === true || context.heatingType === 'warmtepomp',
    context.dubbelGlas === true,
    hasKenmerk(context, 'Energiezuinig'),
  ].filter(Boolean).length

  if (context.epcBand === 'good') {
    if (supportingSignals >= 2) {
      return 'Deze woning lijkt op basis van beschikbare woningdata energetisch sterk te scoren. Het EPC-label en aanvullende energiesignalen wijzen vermoedelijk op een relatief toekomstgericht profiel, maar dit blijft indicatief.'
    }

    return 'Deze woning lijkt op basis van het beschikbare EPC-label energetisch relatief sterk te scoren. Verdere optimalisaties zijn indicatief en vooral te controleren op comfort, energieprijzen en waardebehoud.'
  }

  if (context.epcBand === 'acceptable' || context.epcBand === 'minimum') {
    if (context.primaryEnergy || context.co2) {
      return 'Deze woning scoort momenteel gemiddeld op energievlak. Omdat primair energieverbruik of CO₂-data beschikbaar is, kan de energieprestatie iets gerichter worden beoordeeld, maar de inschatting blijft indicatief.'
    }

    return 'Deze woning scoort momenteel gemiddeld op energievlak. Gerichte verbeteringen kunnen het energieverbruik en het toekomstig EPC mogelijk verbeteren.'
  }

  if (context.epcBand === 'obligation' || context.epcBand === 'poor') {
    return 'Deze woning heeft meerdere energetische aandachtspunten. Renovatie- en isolatiemaatregelen lijken belangrijk om toekomstige EPC-doelen te benaderen.'
  }

  return INSUFFICIENT_DATA_TEXT
}

function getActionTone(context: EnergyContext) {
  // Recommendation generation: tone follows EPC severity without using scare language.
  if (context.epcBand === 'good') {
    return {
      roof: 'Dakisolatie eventueel controleren voor extra comfort of bijkomende energiebesparing',
      wall: 'Muurisolatie kan interessant zijn voor extra comfort',
      floor: 'Vloerisolatie kan interessant zijn voor bijkomende energiebesparing',
      glass: 'HR-glas eventueel controleren voor comfort en lagere energiekosten',
      heating: 'Verwarming evalueren voor comfort, energiekosten of toekomstige waarde',
    }
  }

  if (context.epcBand === 'acceptable' || context.epcBand === 'minimum') {
    return {
      roof: 'Dakisolatie op termijn controleren',
      wall: 'Muurisolatie op termijn onderzoeken',
      floor: 'Vloerisolatie op termijn controleren',
      glass: 'HR-glas controleren',
      heating: 'Verwarming evalueren',
    }
  }

  return {
    roof: 'Dakisolatie sterk aanbevolen om te controleren',
    wall: 'Muurisolatie sterk aanbevolen om te onderzoeken',
    floor: 'Vloerisolatie sterk aanbevolen om te controleren',
    glass: 'HR-glas of ramen sterk aanbevolen om te controleren',
    heating: 'Verwarmingssysteem met prioriteit evalueren',
  }
}

function shouldPriceMajorWorks(context: EnergyContext) {
  return context.epcBand === 'obligation' || context.epcBand === 'poor' || context.epcBand === 'minimum'
}

function shouldPriceRoofInsulation(context: EnergyContext) {
  if (context.dakisolatie !== false) return false
  if (['minimum', 'obligation', 'poor'].includes(context.epcBand)) return true

  const badSignals = [
    context.hasOldBuilding,
    !context.hasRenovationInfo,
    context.hasInefficientHeating,
    context.muurisolatie === false || context.vloerisolatie === false,
  ].filter(Boolean).length

  return badSignals >= 3
}

function getRoofSurfaceEstimate(context: EnergyContext) {
  // Property type intelligence: apartments/studios rarely carry the full roof cost alone.
  if (context.propertyType === 'studio') return context.area * 0.25
  if (context.isApartment) return context.area * 0.35
  if (context.propertyType === 'open bebouwing') return context.area * 1.15
  if (context.propertyType === 'halfopen') return context.area * 1.05
  return context.area
}

function getPredictedEpcAfterImprovements(context: EnergyContext, pricedWorkCount: number) {
  if (context.epcBand === 'unknown') return INSUFFICIENT_DATA_TEXT

  if (context.epcBand === 'good') {
    if (context.epc === 'B') return 'Mogelijk richting A bij gerichte verbeteringen'
    return 'Waarschijnlijk blijft dit op een gunstig A/B-niveau'
  }

  if (context.epcBand === 'acceptable') {
    return pricedWorkCount > 0
      ? 'Mogelijk richting B na gerichte verbeteringen'
      : 'Beperkte EPC-impact zonder duidelijke renovatie-ingrepen'
  }

  if (context.epcBand === 'minimum') {
    return pricedWorkCount > 1
      ? 'Mogelijk richting C of B, afhankelijk van uitvoering en EPC-berekening'
      : 'Mogelijk richting C bij gerichte energieverbeteringen'
  }

  if (context.epcBand === 'obligation' || context.epcBand === 'poor') {
    return pricedWorkCount > 1
      ? 'Vermoedelijk richting D of beter bij een doordacht renovatiepakket'
      : 'EPC-impact vermoedelijk beperkt zonder combinatie van maatregelen'
  }

  return INSUFFICIENT_DATA_TEXT
}

function getEpcTrajectory(context: EnergyContext, pricedWorkCount: number): EnergyInsight['epcTrajectory'] {
  if (context.epcBand === 'good') {
    return {
      current: context.epc || 'Onbekend',
      target: context.epc === 'B' ? 'A' : context.epc || 'A/B',
      text: context.epc === 'B'
        ? 'Mogelijk richting A bij gerichte optimalisaties.'
        : 'Vermoedelijk behoud van een gunstig A/B-profiel.',
    }
  }

  if (context.epcBand === 'acceptable') {
    return {
      current: context.epc || 'C',
      target: 'B',
      text: pricedWorkCount > 0
        ? 'Mogelijk richting B na gerichte verbeteringen.'
        : 'Mogelijk richting B, maar enkel na bevestigde maatregelen.',
    }
  }

  if (context.epcBand === 'minimum') {
    return {
      current: context.epc || 'D',
      target: 'C/B',
      text: 'Mogelijk richting C of B, afhankelijk van uitvoering en EPC-berekening.',
    }
  }

  if (context.epcBand === 'obligation' || context.epcBand === 'poor') {
    return {
      current: context.epc || 'E/F/G',
      target: 'D of beter',
      text: 'Mogelijk richting D of beter met een doordacht renovatiepakket.',
    }
  }

  return {
    current: 'Onbekend',
    target: 'Onbekend',
    text: INSUFFICIENT_DATA_TEXT,
  }
}

function getFutureProofScore(context: EnergyContext): EnergyInsight['futureProofScore'] {
  if (context.epcBand === 'unknown' && getConfidence(context) === 'low') {
    return {
      level: 'Laag',
      text: INSUFFICIENT_DATA_TEXT,
    }
  }

  const positiveSignals = [
    context.epcBand === 'good',
    context.heatingType === 'warmtepomp' || context.heatingType === 'condensatieketel',
    context.zonnepanelen === true,
    context.thermischeZonnepanelen === true,
    context.dakisolatie === true,
    context.muurisolatie === true || context.vloerisolatie === true,
    context.dubbelGlas === true,
    context.hasRenovationInfo,
    hasKenmerk(context, 'Energiezuinig'),
    hasKenmerk(context, 'Recent gerenoveerd'),
  ].filter(Boolean).length

  const riskSignals = [
    context.epcBand === 'obligation' || context.epcBand === 'poor',
    context.hasInefficientHeating,
    context.dakisolatie === false,
    context.muurisolatie === false,
    context.vloerisolatie === false,
    context.dubbelGlas === false,
  ].filter(Boolean).length

  if (positiveSignals >= 4 && riskSignals === 0) {
    return {
      level: 'Hoog',
      text: 'Deze woning lijkt relatief toekomstbestendig op basis van het beschikbare EPC-label en de beschikbare isolatie- en verwarmingsgegevens. Dit is indicatief en niet definitief.',
    }
  }

  if (riskSignals >= 3 || context.epcBand === 'obligation' || context.epcBand === 'poor') {
    return {
      level: 'Laag',
      text: 'Deze woning lijkt op basis van beschikbare woningdata minder toekomstbestendig zonder bijkomende energieverbeteringen. Controleer dit tijdens plaatsbezoek en dossieranalyse.',
    }
  }

  return {
    level: 'Gemiddeld',
    text: 'Deze woning lijkt op basis van beschikbare woningdata gedeeltelijk toekomstbestendig, maar enkele gegevens of energieonderdelen verdienen verdere controle.',
  }
}

function getHeatingAnalysis(context: EnergyContext) {
  if (context.warmtepomp === true || context.heatingType === 'warmtepomp') {
    return 'De verwarming lijkt gunstig: een warmtepomp past goed binnen een toekomstgerichte energiestrategie.'
  }

  if (context.heatingType === 'condensatieketel') {
    return 'Een condensatieketel lijkt momenteel aanvaardbaar. Toekomstige elektrificatie kan op termijn interessant worden, maar is niet automatisch dringend.'
  }

  if (context.heatingType === 'stookolie') {
    return 'Mazout of stookolie vormt vermoedelijk een hoger toekomstig risico. Een alternatief verwarmingssysteem kan op basis van beschikbare gegevens relevant zijn.'
  }

  if (context.heatingType === 'elektrisch') {
    return 'Direct elektrische verwarming kan een hoger gebruikskostenrisico geven. Controle van verbruik, isolatie en alternatieven is aanbevolen.'
  }

  if (context.heatingType === 'oude gasketel') {
    return 'Een oude gasketel geeft vermoedelijk een middelmatig toekomstig risico. Vervanging of optimalisatie kan op termijn interessant zijn.'
  }

  if (context.heatingType === 'gas') {
    return 'Gasverwarming is gangbaar, maar het exacte type en rendement bepalen of verbetering zinvol is.'
  }

  return 'Onvoldoende gegevens beschikbaar voor een betrouwbare inschatting van het verwarmingssysteem.'
}

function getEnergyRisk(context: EnergyContext): EnergyInsight['energyRisk'] {
  if (context.epcBand === 'unknown' && getConfidence(context) === 'low') {
    return {
      level: 'Hoog',
      text: INSUFFICIENT_DATA_TEXT,
    }
  }

  const hasBadEnvelope = [context.dakisolatie, context.muurisolatie, context.vloerisolatie, context.dubbelGlas].some((value) => value === false)
  const hasGoodEnvelope = [context.dakisolatie, context.muurisolatie, context.vloerisolatie, context.dubbelGlas].filter((value) => value === true).length >= 2

  if ((context.epcBand === 'obligation' || context.epcBand === 'poor') || context.heatingType === 'stookolie' || context.heatingType === 'elektrisch') {
    return {
      level: 'Hoog',
      text: 'Het energierisico lijkt hoger op basis van beschikbare woningdata over EPC-label, verwarmingssysteem of bevestigde renovatiepunten.',
    }
  }

  if (context.epcBand === 'good' && !context.hasInefficientHeating && (hasGoodEnvelope || !hasBadEnvelope || context.zonnepanelen === true || context.warmtepomp === true)) {
    return {
      level: 'Laag',
      text: 'Het energierisico lijkt laag op basis van het huidige EPC-label en de beschikbare energiegegevens. Dit blijft indicatief.',
    }
  }

  return {
    level: 'Gemiddeld',
    text: 'Het energierisico lijkt gemiddeld op basis van beschikbare woningdata. Enkele gegevens of onderdelen verdienen verdere controle voor aankoop.',
  }
}

function getComfortImpact(context: EnergyContext): EnergyInsight['comfortImpact'] {
  if (context.epcBand === 'good' && context.amenities.length >= 3 && context.dubbelGlas !== false) {
    return {
      level: 'Beperkt',
      text: 'De comfortwinst van bijkomende energiewerken lijkt beperkt omdat er al meerdere comfort- of voorzieningengegevens beschikbaar zijn. Controle blijft aangewezen.',
    }
  }

  if (context.epcBand === 'good' && context.isApartment && context.dubbelGlas !== false && context.dakisolatie !== false) {
    return {
      level: 'Beperkt',
      text: 'De comfortwinst lijkt vermoedelijk beperkt; optimalisaties zijn vooral fijnregeling of waardebehoud.',
    }
  }

  if (context.dakisolatie === false || [context.muurisolatie, context.vloerisolatie, context.dubbelGlas].filter((value) => value === false).length >= 2) {
    return {
      level: 'Groot',
      text: 'De comfortimpact kan groot zijn als isolatie- of raamproblemen ter plaatse bevestigd worden.',
    }
  }

  if (context.dubbelGlas === false || context.hasInefficientHeating || context.epcBand === 'acceptable' || context.epcBand === 'minimum') {
    return {
      level: 'Merkbaar',
      text: 'Gerichte verbeteringen kunnen vermoedelijk merkbaar zijn in comfort, tochtgevoel of verbruik.',
    }
  }

  return {
    level: 'Beperkt',
    text: 'Op basis van de huidige gegevens lijkt de comfortimpact van extra werken beperkt.',
  }
}

function getEnergySavingImpact(context: EnergyContext, pricedWorkCount: number) {
  if (context.epcBand === 'unknown' && getConfidence(context) === 'low') return INSUFFICIENT_DATA_TEXT

  const gapCount = [
    context.dakisolatie === false,
    context.muurisolatie === false,
    context.vloerisolatie === false,
    context.dubbelGlas === false,
    context.hasInefficientHeating,
  ].filter(Boolean).length

  if (context.epcBand === 'good' && gapCount <= 1) {
    if (context.zonnepanelen === true || context.warmtepomp === true || hasKenmerk(context, 'Energiezuinig')) {
      return 'Beperkte bijkomende impact verwacht; de beschikbare data bevat al positieve duurzaamheidssignalen.'
    }

    return 'Beperkte impact verwacht; verbeteringen zijn vooral comfort- of optimalisatiemaatregelen.'
  }
  if (gapCount >= 3 || pricedWorkCount >= 3 || context.epcBand === 'obligation' || context.epcBand === 'poor') return 'Grote energiebesparing mogelijk als meerdere zwakke punten effectief bevestigd en aangepakt worden.'
  if (gapCount >= 1 || pricedWorkCount >= 1 || context.epcBand === 'acceptable' || context.epcBand === 'minimum') return 'Gemiddelde besparing mogelijk, vooral bij gerichte isolatie- of verwarmingsmaatregelen.'
  return 'Beperkte impact op basis van de huidige beschikbare gegevens. Dit is indicatief en niet definitief.'
}

function getSubsidySuggestions(context: EnergyContext) {
  const suggestions: string[] = []

  if (context.dakisolatie === false || context.epcBand === 'obligation' || context.epcBand === 'poor') {
    suggestions.push('Mogelijk interessant voor Mijn VerbouwPremie; voorwaarden en inkomenscategorie moeten apart gecontroleerd worden.')
  }

  if (context.dakisolatie === false) {
    suggestions.push('Dakisolatiepremie kan mogelijk relevant zijn als de werken aan de voorwaarden voldoen.')
  }

  if (context.hasInefficientHeating && context.epcBand !== 'good') {
    suggestions.push('Warmtepomppremie is mogelijk beschikbaar bij een geschikte installatie en correcte plaatsing.')
  }

  if (context.zonnepanelen !== true && ['acceptable', 'minimum', 'obligation', 'poor'].includes(context.epcBand)) {
    suggestions.push('Zonnepanelen kunnen mogelijk interessant zijn, maar opbrengst, dakgeschiktheid en regelgeving moeten apart worden gecontroleerd.')
  }

  return suggestions
}

function getYearlySavingsEstimate(
  context: EnergyContext,
  costBreakdown: EnergyInsight['costBreakdown'],
  confidence: EnergyInsight['confidence']
): EnergyInsight['yearlySavingsEstimate'] {
  if (confidence === 'low' || costBreakdown.length === 0) return null

  const savingsByWorkType: Record<string, [number, number]> = {
    Dakisolatie: [180, 420],
    Muurisolatie: [160, 380],
    Vloerisolatie: [90, 240],
    'HR-glas': [140, 360],
    Warmtepomp: [300, 850],
  }

  const [min, max] = costBreakdown.reduce(
    (total, item) => {
      const range = savingsByWorkType[item.workType] || [80, 180]
      return [total[0] + range[0], total[1] + range[1]]
    },
    [0, 0]
  )

  const propertyScale = context.propertyType === 'studio' ? 0.7 : context.propertyType === 'open bebouwing' ? 1.15 : 1

  return {
    min: Math.round(min * propertyScale),
    max: Math.round(max * propertyScale),
    text: 'Indicatieve inschatting op basis van beschikbare woningdata en mogelijke maatregelen; werkelijk verbruik, energieprijzen en bewonersgedrag kunnen sterk afwijken.',
  }
}

function getValuePotential(context: EnergyContext, pricedWorkCount: number): EnergyInsight['valuePotential'] {
  if (context.epcBand === 'unknown' && getConfidence(context) === 'low') {
    return {
      level: 'Beperkt',
      text: INSUFFICIENT_DATA_TEXT,
    }
  }

  if (context.epcBand === 'good' && pricedWorkCount === 0 && !hasKenmerk(context, 'Investeringspand')) {
    return {
      level: 'Beperkt',
      text: 'Het waardepotentieel via energierenovatie lijkt op basis van beschikbare woningdata beperkt, omdat het EPC-label momenteel al gunstig scoort.',
    }
  }

  if (hasKenmerk(context, 'Investeringspand') && (context.epcBand === 'acceptable' || context.epcBand === 'minimum' || pricedWorkCount > 0)) {
    return {
      level: 'Gemiddeld',
      text: 'Het kenmerk Investeringspand is beschikbaar. Energieverbeteringen kunnen mogelijk relevant zijn voor verhuurbaarheid of waardebehoud, maar dit is indicatief.',
    }
  }

  if (context.epcBand === 'obligation' || context.epcBand === 'poor' || pricedWorkCount >= 2) {
    return {
      level: 'Interessant renovatiepotentieel',
      text: 'Er kan waardepotentieel zijn als energie-ingrepen technisch en budgettair haalbaar blijken. Dit is indicatief en niet definitief.',
    }
  }

  return {
    level: 'Gemiddeld',
    text: 'Gerichte energieverbeteringen kunnen mogelijk bijdragen aan comfort, verkoopbaarheid en waardebehoud, op basis van beschikbare woningdata.',
  }
}

function getRecommendationPriority(context: EnergyContext): EnergyInsight['recommendationPriority'] {
  if (context.epcBand === 'obligation') return 'Wettelijk relevant'
  if (context.epcBand === 'poor' || context.hasInefficientHeating) return 'Belangrijk'
  if (context.epcBand === 'acceptable' || context.epcBand === 'minimum') return 'Aanbevolen'
  return 'Informatief'
}

function getRecommendationPriorityForItem(
  context: EnergyContext,
  recommendation: string
): EnergyInsight['recommendationPriority'] {
  const normalized = recommendation.toLowerCase()

  if (context.epcBand === 'obligation' && (normalized.includes('dak') || normalized.includes('glas') || normalized.includes('verwarming'))) {
    return 'Wettelijk relevant'
  }

  if (context.epcBand === 'poor' || normalized.includes('prioriteit') || normalized.includes('sterk aanbevolen')) return 'Belangrijk'
  if (context.epcBand === 'acceptable' || context.epcBand === 'minimum' || normalized.includes('controleren')) return 'Aanbevolen'
  return 'Informatief'
}

function getCostConfidence(
  context: EnergyContext,
  costBreakdown: EnergyInsight['costBreakdown'],
  confidence: EnergyInsight['confidence']
) {
  if (costBreakdown.length === 0) {
    return 'Er is momenteel geen betrouwbare kost geraamd omdat er geen duidelijke kostdragende renovatiegegevens zijn.'
  }

  if (context.area && confidence !== 'low') {
    return 'Kostinschatting gebaseerd op beschikbare woningkenmerken.'
  }

  return 'Kostinschatting onzeker wegens beperkte renovatiegegevens.'
}

function addCost(
  costBreakdown: EnergyInsight['costBreakdown'],
  workType: string,
  formula: string,
  estimatedMin: number,
  estimatedMax: number
) {
  costBreakdown.push({
    workType,
    formula,
    estimatedMin,
    estimatedMax,
  })
}

function buildContext(property: Record<string, unknown>): EnergyContext {
  const epc = String(property.epc || property.epc_code || '').toUpperCase().trim()
  const buildYear = numberValue(property.bouwjaar)
  const warmtepomp = boolValue(property.warmtepomp)
  const heating = String(firstKnownValue(property.verwarmingstype, warmtepomp === true ? 'warmtepomp' : '') || '').toLowerCase().trim()
  const renovationYear = firstKnownValue(property.renovatiejaar, property.laatste_renovatiejaar)
  const propertyType = detectPropertyType(property)
  const woningkenmerken = getWoningkenmerken(property)
  const amenities = getKnownAmenities(property)
  const floodDataText = getFloodDataText(property)

  return {
    epc,
    epcBand: getEpcBand(epc),
    propertyType,
    area: numberValue(firstKnownValue(property.bewoonbare_oppervlakte, property.oppervlakte)),
    buildYear,
    hasOldBuilding: buildYear > 0 && buildYear < 1990,
    hasRenovationInfo: hasKnownValue(renovationYear),
    isApartment: isApartmentType(propertyType),
    dakisolatie: boolValue(property.dakisolatie),
    muurisolatie: boolValue(property.muurisolatie),
    vloerisolatie: boolValue(property.vloerisolatie),
    dubbelGlas: boolValue(firstKnownValue(property.dubbel_glas, property.hr_glas)),
    heating,
    heatingType: detectHeatingType(heating),
    hasInefficientHeating: isClearlyInefficientHeating(heating),
    primaryEnergy: numberValue(property.primair_energieverbruik),
    co2: numberValue(property.co2_uitstoot),
    zonnepanelen: boolValue(property.zonnepanelen),
    thermischeZonnepanelen: boolValue(property.thermische_zonnepanelen),
    warmtepomp,
    woningkenmerken,
    amenities,
    floodDataText,
  }
}

function getConfidence(context: EnergyContext): EnergyInsight['confidence'] {
  const importantKnownFields = [
    context.epc || null,
    context.area > 0 ? true : null,
    context.buildYear > 0 ? true : null,
    context.dakisolatie,
    context.muurisolatie,
    context.vloerisolatie,
    context.dubbelGlas,
    context.heating,
    context.zonnepanelen,
    context.warmtepomp,
    context.primaryEnergy > 0 ? true : null,
    context.co2 > 0 ? true : null,
    context.woningkenmerken.length > 0 ? true : null,
    context.amenities.length > 0 ? true : null,
    context.floodDataText || null,
    context.hasRenovationInfo ? true : null,
  ].filter(hasKnownValue).length

  if (importantKnownFields >= 7) return 'high'
  if (importantKnownFields >= 4) return 'medium'
  return 'low'
}

// Cost estimation is intentionally conservative. Missing data lowers confidence; it does not create costs.
function calculateCostsAndActions(context: EnergyContext) {
  let estimatedMin = 0
  let estimatedMax = 0
  const recommendations: string[] = []
  const warnings: string[] = []
  const costBreakdown: EnergyInsight['costBreakdown'] = []
  const tone = getActionTone(context)
  const roofSurfaceEstimate = getRoofSurfaceEstimate(context)
  const canPriceMajorWorks = shouldPriceMajorWorks(context)

  if (context.dakisolatie === false) {
    recommendations.push(tone.roof)

    if (shouldPriceRoofInsulation(context)) {
      const min = roofSurfaceEstimate * 45
      const max = roofSurfaceEstimate * 90
      estimatedMin += min
      estimatedMax += max
      addCost(
        costBreakdown,
        'Dakisolatie',
        `${Math.round(roofSurfaceEstimate)} m² × €45–€90/m²`,
        min,
        max
      )
    } else {
      warnings.push('Extra dakisolatie kan mogelijk interessant zijn voor comfort of extra energiebesparing, maar er is geen volledige dakrenovatiekost geraamd.')
    }
  } else if (context.dakisolatie === null && context.epcBand !== 'good') {
    recommendations.push(tone.roof)
    warnings.push('Dakisolatie ontbreekt in de data; hiervoor is nog geen kost toegevoegd.')
  }

  if (context.isApartment) {
    warnings.push('Bij appartementen kunnen dak- of gevelwerken deels onder gemeenschappelijke renovaties vallen, bijvoorbeeld via de VME.')
  }

  if (context.propertyType === 'open bebouwing' && context.dakisolatie === false && context.epcBand !== 'good') {
    warnings.push('Bij open bebouwing kan de dak- en gevelimpact groter zijn dan bij compacte woningen; exacte oppervlaktes moeten ter plaatse worden bevestigd.')
  }

  if (context.muurisolatie === false) {
    recommendations.push(tone.wall)

    if (canPriceMajorWorks || context.hasOldBuilding) {
      const min = context.area * 60
      const max = context.area * 120
      estimatedMin += min
      estimatedMax += max
      addCost(costBreakdown, 'Muurisolatie', `${context.area} m² × €60–€120/m²`, min, max)
    } else {
      warnings.push('Muurisolatie is een aandachtspunt, maar zonder zwak EPC-label is geen grote gevelkost automatisch geraamd.')
    }
  } else if (context.muurisolatie === null && context.hasOldBuilding && context.epcBand !== 'good') {
    recommendations.push(tone.wall)
    warnings.push('Muurisolatie ontbreekt in de data; hiervoor is nog geen kost toegevoegd.')
  }

  if (context.vloerisolatie === false) {
    recommendations.push(tone.floor)

    if (canPriceMajorWorks || context.hasOldBuilding) {
      const min = context.area * 35
      const max = context.area * 70
      estimatedMin += min
      estimatedMax += max
      addCost(costBreakdown, 'Vloerisolatie', `${context.area} m² × €35–€70/m²`, min, max)
    } else {
      warnings.push('Vloerisolatie is een aandachtspunt, maar zonder zwak EPC-label is geen grote kost automatisch geraamd.')
    }
  } else if (context.vloerisolatie === null && context.hasOldBuilding && context.epcBand !== 'good') {
    recommendations.push(tone.floor)
    warnings.push('Vloerisolatie ontbreekt in de data; hiervoor is nog geen kost toegevoegd.')
  }

  if (context.dubbelGlas === false) {
    recommendations.push(tone.glass)

    if (canPriceMajorWorks || context.epcBand === 'acceptable') {
      const min = context.area * 80
      const max = context.area * 160
      estimatedMin += min
      estimatedMax += max
      addCost(costBreakdown, 'HR-glas', `${context.area} m² × €80–€160/m²`, min, max)
    } else {
      warnings.push('HR-glas of ramen zijn een aandachtspunt, maar bij een gunstig EPC-label is dit vooral relevant voor comfort of extra energiebesparing.')
    }
  } else if (context.dubbelGlas === null && context.epcBand !== 'good') {
    recommendations.push(tone.glass)
    warnings.push('Ramen/deuren of HR-glas ontbreken in de data; hiervoor is nog geen kost toegevoegd.')
  }

  if (context.hasInefficientHeating) {
    recommendations.push(tone.heating)

    if (context.epcBand !== 'good') {
      estimatedMin += 8000
      estimatedMax += 18000
      addCost(costBreakdown, 'Warmtepomp', 'vaste richtprijs €8.000–€18.000', 8000, 18000)
    } else {
      warnings.push('Verwarming lijkt niet optimaal, maar bij een gunstig EPC-label is dit vooral een comfort-, kosten- of toekomstwaarde-afweging.')
    }
  } else if (!context.heating && ['minimum', 'obligation', 'poor'].includes(context.epcBand)) {
    recommendations.push(tone.heating)
    warnings.push('Verwarmingstype ontbreekt in de data; hiervoor is nog geen kost toegevoegd.')
  }

  return {
    estimatedMin,
    estimatedMax,
    recommendations,
    warnings,
    costBreakdown,
  }
}

// EPC logic follows cautious Flemish advisory wording: no legal certainty, only data-based indication.
function getRegulationWarnings(context: EnergyContext) {
  if (context.epcBand === 'obligation') {
    return ['Vlaamse renovatieverplichting: bij aankoop moet deze woning binnen de wettelijke termijn minstens EPC-label D behalen. Controleer altijd de meest recente EPC- en regelgevingcontext.']
  }

  if (context.epcBand === 'poor') {
    return ['Dit EPC-label wijst op een zwakke energieprestatie. Renovatie-impact en regelgeving moeten zorgvuldig gecontroleerd worden.']
  }

  return []
}

function getPriority(context: EnergyContext, estimatedMax: number): EnergyInsight['priority'] {
  if (context.epcBand === 'obligation' || context.epcBand === 'poor' || estimatedMax > 30000) return 'high'
  if (context.epcBand === 'minimum' || estimatedMax > 12000) return 'medium'
  return 'low'
}

export function calculateEnergyInsight(property: Record<string, unknown>): EnergyInsight {
  const context = buildContext(property)
  const costResult = calculateCostsAndActions(context)
  const confidence = getConfidence(context)
  const pricedWorkCount = costResult.costBreakdown.length
  const warnings = [
    ...getRegulationWarnings(context),
    ...costResult.warnings,
  ]

  if (!context.area && context.epcBand !== 'good') {
    warnings.push('Bewoonbare oppervlakte ontbreekt; kostenschatting is minder betrouwbaar.')
  }

  if (!context.buildYear && context.epcBand !== 'good') {
    warnings.push('Bouwjaar ontbreekt; isolatierisico is minder betrouwbaar.')
  }

  if (context.floodDataText) {
    warnings.push(context.floodDataText)
  }

  const estimatedMin = Math.round(costResult.estimatedMin)
  const estimatedMax = Math.round(costResult.estimatedMax)
  const recommendations = uniqueList([
    getLeadAdvice(context),
    ...costResult.recommendations,
  ])
  const actionRecommendations = uniqueList(costResult.recommendations)

  return {
    priority: getPriority(context, estimatedMax),
    confidence,
    estimatedMin,
    estimatedMax,
    propertyType: context.propertyType,
    aiSummary: getAiSummary(context),
    epcTrajectory: getEpcTrajectory(context, pricedWorkCount),
    predictedEpcAfterImprovements: getPredictedEpcAfterImprovements(context, pricedWorkCount),
    futureProofScore: getFutureProofScore(context),
    energyRisk: getEnergyRisk(context),
    comfortImpact: getComfortImpact(context),
    yearlySavingsEstimate: getYearlySavingsEstimate(context, costResult.costBreakdown, confidence),
    valuePotential: getValuePotential(context, pricedWorkCount),
    energySavingImpact: getEnergySavingImpact(context, pricedWorkCount),
    heatingAnalysis: getHeatingAnalysis(context),
    subsidySuggestions: getSubsidySuggestions(context),
    recommendationPriority: getRecommendationPriority(context),
    costConfidence: getCostConfidence(context, costResult.costBreakdown, confidence),
    prioritizedRecommendations: actionRecommendations.map((recommendation) => ({
      text: recommendation,
      priority: getRecommendationPriorityForItem(context, recommendation),
    })),
    recommendations,
    warnings: uniqueList(warnings),
    costBreakdown: costResult.costBreakdown.map((item) => ({
      ...item,
      estimatedMin: Math.round(item.estimatedMin),
      estimatedMax: Math.round(item.estimatedMax),
    })),
  }
}
