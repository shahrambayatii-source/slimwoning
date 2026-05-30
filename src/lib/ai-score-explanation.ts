import type { EnergyInsight } from './energy-calculator'
import type { RenovatieScan } from './renovatie-scan'

export type AiScoreExplanation = {
  positiveFactors: string[]
  limitations: string[]
}

type MarketData = {
  comparableCount?: number
  marketConfidence?: 'Laag' | 'Gemiddeld' | 'Hoog' | string
  aiScore?: number
  aiScoreLabel?: string
}

function numberValue(value: unknown) {
  const number = Number(String(value || '').replace(/[^\d.]/g, ''))
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
  return value !== null && value !== undefined && String(value).trim() !== ''
}

function uniqueList(items: string[]) {
  return Array.from(new Set(items.filter(Boolean)))
}

function getEpcLabel(property: Record<string, unknown>) {
  return String(property.epc || property.epc_code || property.epc_label || property.epcLabel || '')
    .toUpperCase()
    .trim()
}

function hasMissingRenovationData(property: Record<string, unknown>) {
  const hasRenovationYear = hasKnownValue(property.renovatiejaar) || hasKnownValue(property.laatste_renovatiejaar)
  const hasRoofInfo = hasKnownValue(property.dakisolatie) || hasKnownValue(property.dak_vernieuwd)
  const hasInsulationInfo = hasKnownValue(property.muurisolatie) || hasKnownValue(property.vloerisolatie)
  const hasWindowInfo = hasKnownValue(property.ramen_vervangen) || hasKnownValue(property.dubbel_glas) || hasKnownValue(property.hr_glas)

  return !hasRenovationYear || !hasRoofInfo || !hasInsulationInfo || !hasWindowInfo
}

function hasMissingCoreData(property: Record<string, unknown>) {
  return [
    property.price,
    property.city,
    property.woning_type || property.property_type || property.type,
    property.bewoonbare_oppervlakte || property.oppervlakte || property.living_area,
    property.slaapkamers || property.bedrooms,
  ].some((value) => !hasKnownValue(value))
}

export function getAiScoreExplanation(
  property: Record<string, unknown>,
  energyScan?: EnergyInsight | null,
  renovationScan?: RenovatieScan | null,
  marketData: MarketData = {},
): AiScoreExplanation {
  const epc = getEpcLabel(property)
  const area = numberValue(property.bewoonbare_oppervlakte || property.oppervlakte || property.living_area)
  const comparableCount = Number(marketData.comparableCount || 0)
  const marketConfidence = String(marketData.marketConfidence || '').toLowerCase()
  const aiScore = Number(marketData.aiScore || 0)
  const aiScoreLabel = String(marketData.aiScoreLabel || '').trim()

  const hasModernVisibleFinish =
    renovationScan?.fotoAnalyseStatus === 'geanalyseerd' &&
    (renovationScan.renovatieniveau === 'Modern afgewerkt' ||
      renovationScan.pluspunten.some((point) => point.toLowerCase().includes('modern')))

  const positiveFactors = uniqueList([
    ['A+++++', 'A++++', 'A+++', 'A++', 'A+', 'A'].includes(epc) ? `EPC ${epc}` : '',
    boolValue(property.warmtepomp) === true ? 'Warmtepomp aanwezig' : '',
    boolValue(property.dubbel_glas) === true || boolValue(property.hr_glas) === true ? 'Dubbel glas aanwezig' : '',
    area >= 150 ? 'Grote bewoonbare oppervlakte' : '',
    boolValue(property.tuin) === true ? 'Tuin aanwezig' : '',
    boolValue(property.parking) === true ? 'Parking aanwezig' : '',
    hasModernVisibleFinish ? 'Moderne afwerking zichtbaar op basis van zichtbare elementen' : '',
    energyScan?.energyRisk.level === 'Laag' ? 'Lage energierisico-inschatting' : '',
    aiScore > 0 && aiScoreLabel ? `AI-score valt in categorie ${aiScoreLabel}` : '',
  ]).slice(0, 6)

  const limitations = uniqueList([
    comparableCount < 3 ? 'Beperkte vergelijkingsbasis' : '',
    hasMissingRenovationData(property) ? 'Ontbrekende renovatiegegevens' : '',
    renovationScan?.beperkteFotoInformatie ? 'Beperkte foto-informatie' : '',
    renovationScan?.fotoAnalyseStatus === 'geanalyseerd' && renovationScan.betrouwbaarheid === 'Beperkt'
      ? 'Fotoanalyse is gebaseerd op beperkte foto-informatie'
      : '',
    hasMissingCoreData(property) ? 'Sommige woninggegevens ontbreken' : '',
    comparableCount >= 3 && marketConfidence.includes('laag') ? 'Marktvertrouwen laag' : '',
    energyScan?.confidence === 'low' ? 'Energie-inschatting heeft beperkte databetrouwbaarheid' : '',
  ]).slice(0, 4)

  return {
    positiveFactors,
    limitations,
  }
}
