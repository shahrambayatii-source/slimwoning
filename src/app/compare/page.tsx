'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import jsPDF from 'jspdf'
import { supabase } from '@/lib/supabase'
import { getWoningkenmerken } from '@/lib/woningkenmerken'

export default function ComparePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-white text-[#111827]">
          Vergelijking laden...
        </div>
      }
    >
      <CompareContent />
    </Suspense>
  )
}

function CompareContent() {
  const searchParams = useSearchParams()

  const ids = useMemo(
    () => searchParams.get('ids')?.split(',').filter(Boolean) || [],
    [searchParams]
  )

  const [properties, setProperties] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [locationData, setLocationData] = useState<any>({})
  const [locationLoading, setLocationLoading] = useState(false)

  useEffect(() => {
    getProperties()
  }, [ids.join(',')])

  useEffect(() => {
    if (properties.length > 0) {
      getLocationAnalysis()
    }
  }, [properties])

  async function getProperties() {
    if (ids.length === 0) {
      const savedSelection = JSON.parse(
        localStorage.getItem('selectedProperties') ||
          localStorage.getItem('compareProperties') ||
          '[]'
      )

      if (Array.isArray(savedSelection) && savedSelection.length >= 2) {
        setProperties(savedSelection)
      } else {
        setProperties([])
      }

      setLoading(false)
      return
    }

    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .in('id', ids)

    if (error) {
      console.log(error)
      setLoading(false)
      return
    }

    setProperties(data || [])
    setLoading(false)
  }

  async function getLocationAnalysis() {
    setLocationLoading(true)

    const results: any = {}

    await Promise.all(
      properties.map(async (property) => {
        const data = await fetchLocationAnalysisForProperty(property)

        if (data) {
          results[property.id] = data
        }
      })
    )

    setLocationData(results)
    setLocationLoading(false)
  }

  async function fetchLocationAnalysisForProperty(property: any) {
    const hasUsableAddress = Boolean(
      String(property.address || '').trim() ||
        String(property.street || '').trim() ||
        String(property.postcode || '').trim()
    )

    if ((!property.latitude || !property.longitude) && !hasUsableAddress) {
      return null
    }

    try {
      const response = await fetch('/api/location-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          latitude: Number(property.latitude) || 0,
          longitude: Number(property.longitude) || 0,
          address: property.address,
          street: property.street,
          postcode: property.postcode,
          city: property.city,
        }),
      })

      if (!response.ok) {
        console.log('Location analysis failed:', await response.text())
        return null
      }

      return await response.json()
    } catch (error) {
      console.log(error)
      return null
    }
  }

  function numberValue(value: any) {
    return Number(String(value || '').replace(/[^\d.]/g, '')) || 0
  }

  function propertyCategory(property: any) {
    const type = String(property.woning_type || '').toLowerCase()

    if (type.includes('grond')) return 'land'
    if (type.includes('garage')) return 'garage'
    if (type.includes('kantoor')) return 'office'
    if (type.includes('handel')) return 'commercial'
    if (type.includes('winkel')) return 'commercial'

    return 'residential'
  }

  function isResidential(property: any) {
    return propertyCategory(property) === 'residential'
  }

  function mainSurface(property: any) {
    const category = propertyCategory(property)

    if (category === 'land') {
      return numberValue(property.grondoppervlakte)
    }

    return numberValue(property.bewoonbare_oppervlakte) || numberValue(property.grondoppervlakte)
  }

  function mainSurfaceLabel(property: any) {
    const category = propertyCategory(property)

    if (category === 'land') return 'Grondoppervlakte'
    if (category === 'garage') return 'Oppervlakte'
    if (category === 'office') return 'Kantoorruimte'
    if (category === 'commercial') return 'Handelsruimte'

    return 'Oppervlakte'
  }

  function notApplicableForType(property: any) {
    return !isResidential(property)
  }

  function formatPrice(value: any) {
    const number = numberValue(value)
    if (!number) return '-'

    return new Intl.NumberFormat('nl-BE', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(number)
  }

  function pricePerM2(property: any) {
    const price = numberValue(property.price)
    const surface = mainSurface(property)

    if (!price || !surface) return 0

    return Math.round(price / surface)
  }

  function parseBooleanData(value: any) {
    if (value === null || value === undefined || value === '') return null

    const normalized = String(value).toLowerCase().trim()

    if (['true', 'ja', 'yes', '1'].includes(normalized)) return true
    if (['false', 'nee', 'no', '0'].includes(normalized)) return false

    return null
  }

  function firstKnownPropertyValue(...values: any[]) {
    return values.find((value) => value !== null && value !== undefined && value !== '')
  }

  function epcScore(property: any) {
    if (notApplicableForType(property) && !property.epc && !property.epc_code) return 0

    const epc = String(property.epc || property.epc_code || '').toUpperCase()

    if (epc.includes('A+')) return 100
    if (epc.includes('A')) return 92
    if (epc.includes('B')) return 80
    if (epc.includes('C')) return 65
    if (epc.includes('D')) return 48
    if (epc.includes('E')) return 32
    if (epc.includes('F')) return 18

    return 0
  }

  function sustainabilityScore(property: any) {
    if (notApplicableForType(property)) return epcScore(property)

    const kenmerken = getWoningkenmerken(property)
    let total = epcScore(property) || 35

    if (parseBooleanData(property.dubbel_glas) === true) total += 8
    if (parseBooleanData(property.zonnepanelen) === true) total += 8
    if (parseBooleanData(property.thermische_zonnepanelen) === true) total += 5
    if (parseBooleanData(property.warmtepomp) === true) total += 10
    if (String(property.verwarmingstype || '').toLowerCase().includes('warmtepomp')) total += 8
    if (kenmerken.includes('Energiezuinig')) total += 8
    if (numberValue(property.primair_energieverbruik) > 0) total += 4
    if (numberValue(property.co2_uitstoot) > 0) total += 3
    if (numberValue(property.bouwjaar) >= 2010) total += 5

    return Math.max(0, Math.min(100, Math.round(total)))
  }

  function floodDataText(property: any) {
    const floodValue = firstKnownPropertyValue(
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

    return `Overstromingsdata beschikbaar${scores ? ` (${scores})` : ''}; controleer het attest.`
  }

  function comfortScore(property: any) {
    const category = propertyCategory(property)

    if (category === 'land') {
      let total = 25
      total += property.address ? 20 : 0
      total += property.latitude && property.longitude ? 20 : 0
      total += numberValue(property.grondoppervlakte) >= 500 ? 25 : 0
      total += pricePerM2(property) > 0 ? 10 : 0
      return Math.min(100, total)
    }

    if (category === 'garage') {
      let total = 35
      total += property.address ? 20 : 0
      total += property.latitude && property.longitude ? 20 : 0
      total += mainSurface(property) >= 15 ? 15 : 0
      total += property.parking ? 10 : 0
      return Math.min(100, total)
    }

    if (category === 'office' || category === 'commercial') {
      let total = 25
      total += mainSurface(property) >= 80 ? 25 : 0
      total += property.parking ? 15 : 0
      total += property.lift ? 10 : 0
      total += property.address ? 15 : 0
      total += property.latitude && property.longitude ? 10 : 0
      return Math.min(100, total)
    }

    let total = 0

    total += parseBooleanData(property.parking) === true ? 18 : 0
    total += parseBooleanData(property.tuin) === true ? 18 : 0
    total += parseBooleanData(property.terras) === true ? 14 : 0
    total += parseBooleanData(property.lift) === true ? 12 : 0
    total += parseBooleanData(property.gemeubeld) === true ? 10 : 0
    total += parseBooleanData(property.dubbel_glas) === true ? 18 : 0
    total += numberValue(property.badkamers) >= 2 ? 10 : 0
    if (getWoningkenmerken(property).includes('Luxe afwerking')) total += 8
    if (getWoningkenmerken(property).includes('Instapklaar')) total += 7
    if (getWoningkenmerken(property).includes('Rustig gelegen')) total += 5

    return Math.min(100, total)
  }

  function spaceScore(property: any) {
    const category = propertyCategory(property)
    const surface = numberValue(property.bewoonbare_oppervlakte)
    const bedrooms = numberValue(property.slaapkamers)
    const land = numberValue(property.grondoppervlakte)

    if (category === 'land') {
      let total = 0
      total += Math.min(85, land / 8)
      if (property.address) total += 7
      if (property.latitude && property.longitude) total += 8
      return Math.min(100, Math.round(total))
    }

    if (category === 'garage') {
      let total = 0
      total += Math.min(80, mainSurface(property) * 4)
      if (property.address) total += 10
      if (property.latitude && property.longitude) total += 10
      return Math.min(100, Math.round(total))
    }

    if (category === 'office' || category === 'commercial') {
      let total = 0
      total += Math.min(80, mainSurface(property) / 2)
      if (property.parking) total += 10
      if (property.lift) total += 10
      return Math.min(100, Math.round(total))
    }

    let total = 0
    total += Math.min(55, surface / 2)
    total += Math.min(25, bedrooms * 8)
    total += Math.min(20, land / 25)

    return Math.min(100, Math.round(total))
  }

  function countNearbyPlaces(analysis: any) {
    if (!analysis) return 0

    const keys = [
      'supermarket',
      'hospital',
      'school',
      'trainStation',
      'busStation',
      'pharmacy',
      'park',
      'gym',
      'shopping',
    ]

    return keys.filter((key) => analysis[key]).length
  }

  function locationScore(property: any) {
    let total = 45
    const analysis = locationData[property.id]

    if (property.address) total += 10
    if (property.latitude && property.longitude) total += 15

    total += countNearbyPlaces(analysis) * 5

    if (analysis?.supermarket) total += 8
    if (analysis?.trainStation) total += 8
    if (analysis?.busStation) total += 7
    if (analysis?.school) total += 6
    if (analysis?.hospital) total += 5
    if (analysis?.park) total += 5

    return Math.min(100, Math.round(total))
  }

  function totalScore(property: any) {
    const category = propertyCategory(property)
    const priceScore = Math.max(
      0,
      100 - Math.min(100, pricePerM2(property) / 60)
    )

    if (category === 'land' || category === 'garage') {
      return Math.round(
        spaceScore(property) * 0.35 +
          locationScore(property) * 0.3 +
          priceScore * 0.25 +
          comfortScore(property) * 0.1
      )
    }

    if (category === 'office' || category === 'commercial') {
      return Math.round(
        spaceScore(property) * 0.25 +
          comfortScore(property) * 0.25 +
          locationScore(property) * 0.25 +
          priceScore * 0.2 +
          sustainabilityScore(property) * 0.05
      )
    }

    return Math.round(
      spaceScore(property) * 0.25 +
        comfortScore(property) * 0.2 +
        sustainabilityScore(property) * 0.2 +
        locationScore(property) * 0.2 +
        priceScore * 0.15
    )
  }

  function autoPlus(property: any) {
    const items: string[] = []
    const analysis = locationData[property.id]
    const category = propertyCategory(property)
    const residential = isResidential(property)

    if (residential && epcScore(property) >= 80) items.push('Gunstig EPC-label volgens beschikbare data')
    getWoningkenmerken(property).forEach((kenmerk) => items.push(kenmerk))

    if (residential) {
      if (parseBooleanData(property.parking) === true) items.push('Parking aanwezig')
      if (parseBooleanData(property.tuin) === true) items.push('Tuin aanwezig')
      if (parseBooleanData(property.terras) === true) items.push('Terras aanwezig')
      if (parseBooleanData(property.lift) === true) items.push('Lift aanwezig')
      if (parseBooleanData(property.dubbel_glas) === true) items.push('Dubbel glas')
      if (parseBooleanData(property.zonnepanelen) === true) items.push('Zonnepanelen aanwezig volgens beschikbare data')
      if (parseBooleanData(property.warmtepomp) === true) items.push('Warmtepomp aanwezig volgens beschikbare data')
      if (numberValue(property.primair_energieverbruik) > 0) items.push('Primair energieverbruik beschikbaar')
      if (numberValue(property.co2_uitstoot) > 0) items.push('CO₂-uitstoot beschikbaar')
    }

    if (category === 'land') {
      if (numberValue(property.grondoppervlakte) >= 500) items.push('Ruime grondoppervlakte')
    } else if (category === 'garage') {
      if (mainSurface(property) >= 15) items.push('Praktische garageoppervlakte')
    } else if (category === 'office' || category === 'commercial') {
      if (mainSurface(property) >= 80) items.push('Ruime bruikbare oppervlakte')
      if (property.parking) items.push('Parking aanwezig')
      if (property.lift) items.push('Lift aanwezig')
    } else if (numberValue(property.bewoonbare_oppervlakte) >= 120) {
      items.push('Ruime bewoonbare oppervlakte')
    }

    if (pricePerM2(property) > 0) {
      items.push('Prijs per m² beschikbaar voor vergelijking')
    }

    if (analysis?.supermarket) items.push('Supermarkt in de buurt')
    if (analysis?.trainStation) items.push('Treinstation in de buurt')
    if (analysis?.busStation) items.push('Bushalte in de buurt')
    if (analysis?.school) items.push('School in de buurt')
    if (analysis?.pharmacy) items.push('Apotheek in de buurt')
    if (analysis?.hospital) items.push('Ziekenhuis in de omgeving')
    if (analysis?.park) items.push('Park in de buurt')
    if (analysis?.gym) items.push('Fitness in de buurt')
    if (analysis?.shopping) items.push('Winkelcentrum in de buurt')

    if (property.address) items.push('Adres beschikbaar voor locatieanalyse')
    const floodText = floodDataText(property)
    if (floodText) items.push(floodText)

    return items.length
      ? items
      : ['Onvoldoende gegevens beschikbaar voor een betrouwbare inschatting.']
  }

  function autoMinus(property: any) {
    const items: string[] = []
    const analysis = locationData[property.id]
    const category = propertyCategory(property)
    const residential = isResidential(property)

    if (residential && property.epc && epcScore(property) < 50) {
      items.push('EPC-label vraagt extra controle op basis van beschikbare data')
    }

    if (residential && parseBooleanData(property.parking) === false) items.push('Parking staat als niet aanwezig in de data')

    if (residential && parseBooleanData(property.tuin) === false && property.woning_type === 'Huis') {
      items.push('Tuin staat als niet aanwezig in de data')
    }

    if (residential && parseBooleanData(property.dubbel_glas) === false) {
      items.push('Dubbel glas staat als niet aanwezig in de data')
    }

    if (residential && parseBooleanData(property.warmtepomp) === false && String(property.verwarmingstype || '').toLowerCase().includes('mazout')) {
      items.push('Verwarming op mazout vraagt extra controle op basis van beschikbare data')
    }

    if (category === 'land') {
      if (numberValue(property.grondoppervlakte) < 250) items.push('Beperkte grondoppervlakte')
    } else if (category === 'garage') {
      if (mainSurface(property) < 12) items.push('Beperkte garageoppervlakte')
    } else if (category === 'office' || category === 'commercial') {
      if (mainSurface(property) < 50) items.push('Beperkte bruikbare oppervlakte')
    } else if (numberValue(property.bewoonbare_oppervlakte) < 80) {
      items.push('Beperkte woonoppervlakte')
    }

    if (!property.address) items.push('Geen volledig adres beschikbaar')

    if (!property.latitude || !property.longitude) {
      items.push('Locatiecoördinaten ontbreken')
    }

    if (property.latitude && property.longitude && !analysis && !locationLoading) {
      items.push('Locatieanalyse nog niet beschikbaar')
    }

    if (analysis && !analysis.supermarket) {
      items.push('Geen supermarkt gevonden binnen zoekradius')
    }

    if (analysis && !analysis.trainStation) {
      items.push('Geen treinstation gevonden binnen zoekradius')
    }

    if (analysis && !analysis.busStation) {
      items.push('Geen bushalte gevonden binnen zoekradius')
    }

    if (analysis && !analysis.school) {
      items.push('Geen school gevonden binnen zoekradius')
    }

    if (analysis && !analysis.park) {
      items.push('Geen park gevonden binnen zoekradius')
    }

    return items.length
      ? items
      : ['Onvoldoende gegevens beschikbaar voor een betrouwbare inschatting.']
  }
  function nearbyPdfSummary(analysis: any) {
    if (!analysis) return 'Nog geen locatiegegevens beschikbaar'

    const items = [
      analysis.supermarket
        ? `Supermarkt: ${analysis.supermarket.name} (${analysis.supermarket.distanceText})`
        : '',
      analysis.hospital
        ? `Ziekenhuis: ${analysis.hospital.name} (${analysis.hospital.distanceText})`
        : '',
      analysis.school
        ? `School: ${analysis.school.name} (${analysis.school.distanceText})`
        : '',
      analysis.trainStation
        ? `Treinstation: ${analysis.trainStation.name} (${analysis.trainStation.distanceText})`
        : '',
      analysis.busStation
        ? `Bushalte: ${analysis.busStation.name} (${analysis.busStation.distanceText})`
        : '',
      analysis.pharmacy
        ? `Apotheek: ${analysis.pharmacy.name} (${analysis.pharmacy.distanceText})`
        : '',
      analysis.park
        ? `Park: ${analysis.park.name} (${analysis.park.distanceText})`
        : '',
      analysis.gym
        ? `Fitness: ${analysis.gym.name} (${analysis.gym.distanceText})`
        : '',
      analysis.shopping
        ? `Shopping: ${analysis.shopping.name} (${analysis.shopping.distanceText})`
        : '',
    ].filter(Boolean)

    return items.length
      ? items.join(', ')
      : 'Geen voorzieningen gevonden binnen zoekradius'
  }


  const bestOverall = properties.reduce((best, item) => {
    if (!best) return item
    return totalScore(item) > totalScore(best) ? item : best
  }, null)

  const bestPriceM2 = properties.reduce((best, item) => {
    if (!best) return item
    const current = pricePerM2(item)
    const previous = pricePerM2(best)

    if (!current) return best
    if (!previous) return item

    return current < previous ? item : best
  }, null)

  const bestEnergy = properties.reduce((best, item) => {
    if (!best) return item
    return epcScore(item) > epcScore(best) ? item : best
  }, null)

  const bestLocation = properties.reduce((best, item) => {
    if (!best) return item
    return locationScore(item) > locationScore(best) ? item : best
  }, null)

  async function downloadPDF() {
    const pdf = new jsPDF('p', 'mm', 'a4')
    const freshLocationData: any = { ...locationData }

    await Promise.all(
      properties.map(async (property) => {
        const data = await fetchLocationAnalysisForProperty(property)

        if (data) {
          freshLocationData[property.id] = data
        }
      })
    )
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const margin = 12

    const navy = '#071B4D'
    const blue = '#0B57D0'
    const text = '#0B1F4D'
    const muted = '#64748B'
    const border = '#DDE6F3'
    const soft = '#F8FAFC'
    const lightBlue = '#EFF6FF'
    const lightGreen = '#ECFDF5'
    const lightRed = '#FEF2F2'
    const green = '#15803D'
    const red = '#DC2626'

    async function imageToDataUrl(url: string) {
      if (!url) return null

      try {
        const response = await fetch(url)

        if (!response.ok) return null

        const blob = await response.blob()

        if (!blob.type.startsWith('image/')) return null

        return await new Promise<string>((resolve) => {
          const reader = new FileReader()
          reader.onloadend = () => resolve(String(reader.result))
          reader.readAsDataURL(blob)
        })
      } catch (error) {
        console.log(error)
        return null
      }
    }
    const logoDataUrl = await imageToDataUrl('/logo.png')

    function sanitize(value: any) {
      return String(value || '-')
        .replace(/[\u{1F300}-\u{1FAFF}]/gu, '')
        .replace(/Ø=ÞÍ/g, '')
    }

    function shortText(value: string, max = 70) {
      const clean = sanitize(value)
      return clean.length > max ? `${clean.slice(0, max)}...` : clean
    }

    function formatPdfDate() {
      return new Intl.DateTimeFormat('nl-BE', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(new Date())
    }

    function addHeader() {
      pdf.setFillColor(navy)
      pdf.rect(0, 0, pageWidth, 26, 'F')

      if (logoDataUrl?.startsWith('data:image/')) {
        const logoFormat = logoDataUrl.startsWith('data:image/png') ? 'PNG' : 'JPEG'
        pdf.setFillColor('#FFFFFF')
        pdf.roundedRect(10, 4.5, 33, 17, 2.5, 2.5, 'F')
        pdf.addImage(logoDataUrl, logoFormat, 13.5, 5.8, 26, 14.2)
      } else {
        pdf.setDrawColor('#FFFFFF')
        pdf.setLineWidth(0.9)
        pdf.line(12, 10, 23, 5)
        pdf.line(23, 5, 36, 10)
        pdf.line(34, 9.3, 41, 9.3)
        pdf.line(34, 9.3, 34, 7)

        pdf.setTextColor('#FFFFFF')
        pdf.setFont('helvetica', 'bold')
        pdf.setFontSize(12)
        pdf.text('Slim', 12, 19)
        pdf.setFont('helvetica', 'normal')
        pdf.text('Woning', 23, 19)
      }

      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(8)
      pdf.setTextColor('#D7E4FF')
      pdf.text('Gegenereerd op', pageWidth - margin, 10, { align: 'right' })
      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(10)
      pdf.setTextColor('#FFFFFF')
      pdf.text(formatPdfDate(), pageWidth - margin, 19, { align: 'right' })
    }

    function addFooter() {
      pdf.setFillColor(navy)
      pdf.rect(0, pageHeight - 15, pageWidth, 15, 'F')
      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(7)
      pdf.setTextColor('#FFFFFF')
      pdf.text('Dit rapport is automatisch gegenereerd door SlimWoning.', margin, pageHeight - 6)
      pdf.text(`Pagina ${pdf.getNumberOfPages()}`, pageWidth - margin, pageHeight - 6, {
        align: 'right',
      })
    }

    function drawScoreCircle(x: number, yPos: number, score: number, color: string, label: string) {
      pdf.setDrawColor(color)
      pdf.setLineWidth(1.8)
      pdf.circle(x, yPos, 10)

      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(8)
      pdf.setTextColor(color)
      pdf.text(`${Math.min(99, score)}/100`, x, yPos + 1.3, { align: 'center' })

      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(6.2)
      pdf.setTextColor(muted)
      pdf.text(label, x, yPos + 15, { align: 'center' })
    }

    function drawEpcBadge(x: number, yPos: number, epc: string) {
      const value = String(epc || '-').toUpperCase()
      const color = value.includes('A')
        ? '#22C55E'
        : value.includes('B')
          ? '#84CC16'
          : value.includes('C')
            ? '#EAB308'
            : '#F97316'

      pdf.setFillColor(navy)
      pdf.roundedRect(x, yPos, 18, 8, 2, 2, 'F')

      pdf.setFillColor(color)
      pdf.roundedRect(x + 11, yPos, 7, 8, 2, 2, 'F')

      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(8)
      pdf.setTextColor('#FFFFFF')
      pdf.text('EPC', x + 5.5, yPos + 5.4, { align: 'center' })

      pdf.setTextColor('#FFFFFF')
      pdf.text(value, x + 14.5, yPos + 5.4, { align: 'center' })
    }

    function drawTableEpcBadge(x: number, yPos: number, epc: string) {
      const value = String(epc || '-').toUpperCase()
      const color = value.includes('A')
        ? '#22C55E'
        : value.includes('B')
          ? '#84CC16'
          : value.includes('C')
            ? '#EAB308'
            : '#F97316'

      pdf.setFillColor('#EAF7EA')
      pdf.roundedRect(x, yPos, 12, 9, 2, 2, 'F')
      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(9)
      pdf.setTextColor(color)
      pdf.text(value, x + 6, yPos + 6.4, { align: 'center' })
    }

    function drawInfoCell(
      x: number,
      yPos: number,
      width: number,
      label: string,
      value: string,
      sideLabel?: string,
      sideValue?: string
    ) {
      pdf.setDrawColor(border)
      pdf.setFillColor('#FFFFFF')
      pdf.roundedRect(x, yPos, width, 22, 3, 3, 'FD')

      if (sideValue) {
        pdf.setFont('helvetica', 'normal')
        pdf.setFontSize(7)
        pdf.setTextColor(muted)
        pdf.text(label, x + 5, yPos + 7)

        pdf.setFont('helvetica', 'bold')
        pdf.setFontSize(11)
        pdf.setTextColor(text)
        pdf.text(shortText(value, 12), x + 5, yPos + 16)

        pdf.setFillColor('#EFF6FF')
        pdf.roundedRect(x + width - 28, yPos + 4, 23, 14, 2, 2, 'F')

        pdf.setFont('helvetica', 'bold')
        pdf.setFontSize(5.5)
        pdf.setTextColor(blue)
        pdf.text(sideLabel || '', x + width - 16.5, yPos + 9, {
          align: 'center',
        })

        pdf.setFont('helvetica', 'bold')
        pdf.setFontSize(8.5)
        pdf.setTextColor(blue)
        pdf.text(sideValue, x + width - 16.5, yPos + 15, {
          align: 'center',
        })

        return
      }

      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(7)
      pdf.setTextColor(muted)
      pdf.text(label, x + width / 2, yPos + 7, {
        align: 'center',
      })

      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(11)
      pdf.setTextColor(text)
      pdf.text(shortText(value, 18), x + width / 2, yPos + 16, {
        align: 'center',
      })
    }

    function drawTextBox(x: number, yPos: number, width: number, height: number, title: string, body: string, fill: string, titleColor: string, maxLines = 7) {
      pdf.setFillColor(fill)
      pdf.roundedRect(x, yPos, width, height, 3, 3, 'F')

      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(10)
      pdf.setTextColor(titleColor)
      pdf.text(title, x + 5, yPos + 8)

      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(8)
      pdf.setTextColor(text)
      const lines = pdf.splitTextToSize(sanitize(body), width - 10)
      pdf.text(lines.slice(0, maxLines), x + 5, yPos + 16)
    }

    function drawTopStat(x: number, yPos: number, width: number, label: string, value: string) {
      pdf.setDrawColor(border)
      pdf.setFillColor('#FFFFFF')
      pdf.roundedRect(x, yPos, width, 22, 3, 3, 'FD')

      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(7.5)
      pdf.setTextColor(muted)
      pdf.text(label, x + width / 2, yPos + 8, {
        align: 'center',
      })

      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(10)
      pdf.setTextColor(blue)

      const lines = pdf
        .splitTextToSize(shortText(value, 28), width - 14)
        .slice(0, 2)

      lines.forEach((line: string, index: number) => {
        pdf.text(line, x + width / 2, yPos + 16 + index * 5, {
          align: 'center',
        })
      })
    }

    addHeader()

    let y = 42

    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(text)
    pdf.setFontSize(24)
    pdf.text('Vergelijkingsrapport', margin, y)

    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(10)
    pdf.setTextColor(muted)
    pdf.text('Indicatieve vastgoedvergelijking op basis van beschikbare woningdata.', margin, y + 9)

    y += 22

    const topW = (pageWidth - margin * 2 - 12) / 3
    drawTopStat(margin, y, topW, 'Aantal woningen', String(properties.length))
    drawTopStat(margin + topW + 6, y, topW, 'Hoogste indicatieve score', bestOverall?.title || '-')
    drawTopStat(margin + (topW + 6) * 2, y, topW, 'Laagste prijs per m²', bestPriceM2?.title || '-')

    y += 36

    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(15)
    pdf.setTextColor(text)
    pdf.text('Overzicht vergelijking', margin, y)

    y += 8

    const tableX = margin
    const tableW = pageWidth - margin * 2
    const rowH = 12

    pdf.setFillColor(navy)
    pdf.roundedRect(tableX, y, tableW, rowH, 3, 3, 'F')
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(8)
    pdf.setTextColor('#FFFFFF')
    pdf.text('Woning', tableX + 6, y + 8)
    pdf.text('Prijs', tableX + 72, y + 8, { align: 'center' })
    pdf.text('Prijs/m²', tableX + 94, y + 8)
    pdf.text('Opp.', tableX + 124, y + 8)
    pdf.text('EPC', tableX + 152, y + 8, { align: 'center' })
    pdf.text('Score', tableX + 164, y + 8)

    properties.slice(0, 6).forEach((property, index) => {
      const rowY = y + rowH * (index + 1)
      pdf.setFillColor(index % 2 === 0 ? '#FFFFFF' : soft)
      pdf.rect(tableX, rowY, tableW, rowH, 'F')
      pdf.setDrawColor(border)
      pdf.rect(tableX, rowY, tableW, rowH)

      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(8)
      pdf.setTextColor(text)
      pdf.text(`${index + 1}. ${shortText(property.title || '-', 28)}`, tableX + 6, rowY + 8)
      pdf.text(formatPrice(property.price), tableX + 72, rowY + 8, { align: 'center' })
      pdf.text(pricePerM2(property) ? `€ ${pricePerM2(property)}` : '-', tableX + 94, rowY + 8)
      pdf.text(`${property.bewoonbare_oppervlakte || '-'} m²`, tableX + 124, rowY + 8)
      drawTableEpcBadge(tableX + 146, rowY + 1.5, property.epc)
      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(8)
      pdf.setTextColor(blue)
      pdf.text(`${Math.min(99, totalScore(property))}/100`, tableX + 164, rowY + 8)
    })

    addFooter()

    for (const [index, property] of properties.entries()) {
      pdf.addPage()
      addHeader()

      let py = 40

      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(22)
      pdf.setTextColor(text)
      pdf.text(`${index + 1}. ${shortText(property.title || '-', 52)}`, margin, py)

      py += 8
      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(9.5)
      pdf.setTextColor(blue)
      pdf.text(shortText(`${property.address || '-'}, ${property.city || '-'}`, 76), margin, py)

      py += 12

      const imageW = 86
      const imageH = 60
      const dataUrl = await imageToDataUrl(property.image)
      if (dataUrl) {
        const format = dataUrl.startsWith('data:image/png') ? 'PNG' : 'JPEG'
        pdf.addImage(dataUrl, format, margin, py, imageW, imageH)
      } else {
        pdf.setFillColor('#E5E7EB')
        pdf.roundedRect(margin, py, imageW, imageH, 3, 3, 'F')
        pdf.setFontSize(9)
        pdf.setTextColor(muted)
        pdf.text('Geen afbeelding', margin + imageW / 2, py + 32, { align: 'center' })
      }

      const panelX = margin + imageW + 8
      const panelW = pageWidth - margin - panelX
      pdf.setDrawColor(border)
      pdf.setFillColor('#FFFFFF')
      pdf.roundedRect(panelX, py, panelW, imageH, 4, 4, 'FD')

      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(8)
      pdf.setTextColor(muted)
      pdf.text('Vraagprijs', panelX + 6, py + 10)

      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(17)
      pdf.setTextColor(blue)
      pdf.text(formatPrice(property.price), panelX + 6, py + 24)

      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(7.3)
      pdf.setTextColor(muted)
      pdf.text(
        pricePerM2(property) ? `Prijs per m²: ± € ${pricePerM2(property)}` : 'Prijs per m²: -',
        panelX + 6,
        py + 33
      )

      if (isResidential(property) || property.epc) {
        drawEpcBadge(panelX + 6, py + 42, property.epc)
      } else {
        pdf.setFont('helvetica', 'bold')
        pdf.setFontSize(8)
        pdf.setTextColor(muted)
        pdf.text('EPC n.v.t.', panelX + 6, py + 48)
      }

      drawScoreCircle(panelX + panelW - 45, py + 31, totalScore(property), blue, 'Indicatief')
      drawScoreCircle(panelX + panelW - 18, py + 31, locationScore(property), green, 'LocatieScore')

      py += 74

      const infoW = (pageWidth - margin * 2 - 12) / 4
      const residential = isResidential(property)

      drawInfoCell(
        margin,
        py,
        infoW,
        mainSurfaceLabel(property),
        `${mainSurface(property) || '-'} m²`
      )
      drawInfoCell(
        margin + infoW + 4,
        py,
        infoW,
        'Slaapkamers',
        residential ? String(property.slaapkamers || '-') : 'N.v.t.'
      )
      drawInfoCell(
        margin + (infoW + 4) * 2,
        py,
        infoW,
        'Badkamers',
        residential ? String(property.badkamers || '-') : 'N.v.t.'
      )
      drawInfoCell(
        margin + (infoW + 4) * 3,
        py,
        infoW,
        'Type',
        property.woning_type || '-'
      )

      py += 34

      drawTextBox(
        margin,
        py,
        pageWidth - margin * 2,
        42,
        'Omgeving',
        nearbyPdfSummary(freshLocationData[property.id]),
        lightBlue,
        blue,
        4
      )

      py += 52

      const boxW = (pageWidth - margin * 2 - 6) / 2
      drawTextBox(
        margin,
        py,
        boxW,
        68,
        'Sterke punten',
        autoPlus(property).join(' • '),
        lightGreen,
        green,
        7
      )

      drawTextBox(
        margin + boxW + 6,
        py,
        boxW,
        68,
        'Aandachtspunten',
        autoMinus(property).join(' • '),
        lightRed,
        red,
        7
      )

      py += 80

      pdf.setDrawColor(border)
      pdf.setFillColor('#FFFFFF')
      pdf.roundedRect(margin, py, pageWidth - margin * 2, 32, 4, 4, 'FD')
      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(11)
      pdf.setTextColor(text)
      pdf.text('Samenvatting', margin + 6, py + 9)

      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(8.3)
      pdf.setTextColor(muted)
      const summary = `${property.title || 'Deze woning'} scoort ${Math.min(99, totalScore(property))}/100 algemeen en ${Math.min(99, locationScore(property))}/100 op locatie. De geschatte prijs per m² bedraagt ${pricePerM2(property) ? `€ ${pricePerM2(property)}` : '-'}.`
      pdf.text(pdf.splitTextToSize(summary, pageWidth - margin * 2 - 12), margin + 6, py + 18)

      addFooter()
    }

    pdf.save('slimwoning-vergelijkingsrapport.pdf')
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white text-[#111827]">
        Laden...
      </div>
    )
  }

  if (!loading && properties.length === 0) {
    return (
      <div className="min-h-screen bg-white px-5 py-16 text-[#111827] md:px-10">
        <div className="mx-auto max-w-3xl rounded-[2rem] border border-gray-200 bg-white p-8 text-center shadow-sm">
          <p className="text-sm font-black uppercase tracking-[0.25em] text-blue-700">
            Geen woningen geselecteerd
          </p>

          <h1 className="mt-4 text-4xl font-black tracking-[-0.03em] text-[#0B1F4D]">
            Selecteer eerst woningen om te vergelijken.
          </h1>

          <p className="mt-4 text-gray-600">
            Ga terug naar woningen, kies minimaal twee woningen en klik daarna opnieuw op vergelijken.
          </p>

          <Link
            href="/properties"
            className="mt-8 inline-flex rounded-2xl bg-blue-700 px-6 py-4 font-bold text-white transition hover:bg-blue-800"
          >
            Terug naar woningen
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen !bg-white px-5 py-10 !text-[#111827] md:px-10"
      style={{ background: '#ffffff', color: '#111827' }}
    >
      <div
        className="mx-auto max-w-7xl rounded-[2rem] !bg-white p-6"
        style={{ background: '#ffffff' }}
      >
        <div className="mb-10 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>

            <h1 className="text-5xl font-bold">
              Geavanceerde vastgoedanalyse
            </h1>

            <p className="mt-4 max-w-3xl text-lg text-gray-400">
              Indicatieve vergelijking op basis van beschikbare woningdata:
              prijs, ruimte, comfort, EPC, ligging, voorzieningen in de buurt
              en prijs per m².
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={downloadPDF}
              className="rounded-2xl border border-gray-200 bg-white px-6 py-4 font-bold text-[#111827] shadow-sm transition hover:bg-gray-50"
            >
              Download PDF
            </button>

            <Link
              href="/properties"
              className="rounded-2xl bg-[#111827] px-6 py-4 font-bold text-white shadow-sm"
            >
              Terug
            </Link>
          </div>
        </div>

        <section className="mb-8 grid grid-cols-1 gap-5 md:grid-cols-4">
          <InsightCard
            label="Hoogste indicatieve totaalscore"
            title={bestOverall?.title || '-'}
            text="Indicatieve score op basis van beschikbare woningdata. Niet definitief; controleer tijdens plaatsbezoek."
          />

          <InsightCard
            label="Laagste prijs per m²"
            title={bestPriceM2?.title || '-'}
            text={
              bestPriceM2
                ? `Ongeveer € ${pricePerM2(bestPriceM2)} per m², alleen op basis van vraagprijs en beschikbare oppervlakte.`
                : 'Onvoldoende gegevens beschikbaar voor een betrouwbare inschatting.'
            }
          />

          <InsightCard
            label="Gunstigste beschikbare EPC"
            title={bestEnergy?.title || '-'}
            text="Alleen gebaseerd op het beschikbare EPC-label. Ontbrekende energiegegevens beperken de betrouwbaarheid."
          />

          <InsightCard
            label="Hoogste indicatieve locatiescore"
            title={bestLocation?.title || '-'}
            text="Indicatief op basis van adres, coördinaten en beschikbare voorzieningenanalyse."
          />
        </section>

        {locationLoading && (
          <div className="mb-6 rounded-2xl border border-blue-400/30 bg-blue-500/10 p-4 text-blue-200">
            Omgevingsanalyse wordt geladen...
          </div>
        )}

        <div
          className="grid gap-6"
          style={{
            gridTemplateColumns: `repeat(${properties.length}, minmax(320px, 1fr))`,
          }}
        >
          {properties.map((property) => {
            const hasCompleteLocation = Boolean(
              property.address ||
                property.street ||
                property.postcode ||
                (property.latitude && property.longitude)
            )
            const analysis = hasCompleteLocation ? locationData[property.id] : null

            return (
            <div
              key={property.id}
              className="flex flex-col overflow-hidden rounded-[2rem] border border-gray-200 bg-white shadow-xl"
              style={{ background: '#ffffff' }}
            >
              <div className="relative">
                <img
                  src={property.image}
                  alt={property.title}
                  className="h-72 w-full object-cover md:h-80"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

                <div className="absolute left-5 top-5 rounded-full bg-white/90 px-4 py-2 text-sm font-bold text-black backdrop-blur">
                  EPC {property.epc || '-'}
                </div>

                <div className="absolute bottom-6 left-6">
                  <p className="text-xs font-extrabold uppercase tracking-[0.3em] text-white drop-shadow-lg">
                    Vraagprijs
                  </p>

                  <p className="mt-1 text-5xl font-extrabold text-blue-400 drop-shadow-xl">
                    {formatPrice(property.price)}
                  </p>
                </div>
              </div>

              <div
                className="flex flex-1 flex-col bg-white p-6"
                style={{ background: '#ffffff' }}
              >
                <div className="mb-6 rounded-2xl bg-[#f8fafc] p-5 ring-1 ring-gray-100">
                  <p className="text-sm font-extrabold uppercase tracking-[0.3em] text-blue-700 md:text-base">
                    {property.address
                      ? `${property.address}, ${property.city}`
                      : property.city || 'Locatie niet opgegeven'}
                  </p>

                  <h2 className="mt-2 text-3xl font-bold text-[#111827]">
                    {property.title}
                  </h2>

                  <p className="mt-2 text-sm text-gray-500">
                    {property.woning_type || 'Type woning niet opgegeven'}
                  </p>
                </div>

                <div className="mb-6 grid grid-cols-2 gap-3">
                  <Stat label="Indicatieve score" value={`${totalScore(property)}/100`} />
                  <Stat
                    label="Prijs per m²"
                    value={
                      pricePerM2(property)
                        ? `± € ${pricePerM2(property)}`
                        : '-'
                    }
                    note={pricePerM2(property) ? 'Op basis van vraagprijs' : undefined}
                  />
                  <Stat
                    label={mainSurfaceLabel(property)}
                    value={`${mainSurface(property) || '-'} m²`}
                    note="Beschikbare oppervlakte"
                  />
            <Stat
              label="Locatie"
              value={`${locationScore(property)}/100`}
            />
            <Stat
              label="Ruimte score"
              value={`${spaceScore(property)}/100`}
            />
            <Stat
              label="Voorzieningen"
              value={`${countNearbyPlaces(locationData[property.id])}/9`}
            />
                </div>

                <ScoreBar label="Comfort" score={comfortScore(property)} />
                {isResidential(property) || property.epc ? (
                  <ScoreBar label="Energie" score={epcScore(property)} />
                ) : null}
                <ScoreBar label="Ruimte score" score={spaceScore(property)} />
                <ScoreBar label="Locatie" score={locationScore(property)} />

                <div className="mt-6 flex flex-1 flex-col space-y-4">
                  <Detail
                    label="Sterke punten"
                    value={autoPlus(property).join(' • ')}
                  />

                  <Detail
                    label="Aandachtspunten"
                    value={autoMinus(property).join(' • ')}
                  />

                  <NearbyPlaces
                    analysis={analysis}
                    hasCompleteLocation={hasCompleteLocation}
                  />

                  <div
                    className="rounded-2xl !bg-white p-4 shadow-sm ring-1 ring-gray-100"
                    style={{ background: '#ffffff' }}
                  >
                    <p className="mb-3 text-sm text-gray-400">
                      Voorzieningen
                    </p>

                    <div className="flex min-h-[48px] flex-wrap items-center justify-center gap-2">
                      {property.parking && <Badge text="Parking" />}
                      {property.tuin && <Badge text="Tuin" />}
                      {property.terras && <Badge text="Terras" />}
                      {property.lift && <Badge text="Lift" />}
                      {property.gemeubeld && <Badge text="Gemeubeld" />}
                      {property.dubbel_glas && <Badge text="Dubbel glas" />}
                      {getWoningkenmerken(property).slice(0, 4).map((kenmerk) => (
                        <Badge key={kenmerk} text={kenmerk} />
                      ))}

                      {!property.parking &&
                        !property.tuin &&
                        !property.terras &&
                        !property.lift &&
                        !property.gemeubeld &&
                        !property.dubbel_glas &&
                        getWoningkenmerken(property).length === 0 && (
                          <p className="text-sm text-gray-500">
                            Geen voorzieningen beschikbaar
                          </p>
                        )}
                    </div>
                  </div>

                  <Link
                    href={`/properties/${property.id}`}
                    className="mt-auto block rounded-2xl bg-[#111827] p-4 text-center font-bold text-white transition hover:opacity-90"
                  >
                    Bekijk woning
                  </Link>
                </div>
              </div>
            </div>
            )
          })}
        </div>

        <section className="mt-10 rounded-[2rem] border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-3xl font-bold">
            Conclusie
          </h2>

          <p className="mt-4 leading-8 text-gray-600">
            Op basis van de beschikbare woningdata heeft{' '}
            <strong className="text-[#111827]">{bestOverall?.title || '-'}</strong>{' '}
            momenteel de hoogste indicatieve totaalscore. Voor prijs per m² komt{' '}
            <strong className="text-[#111827]">{bestPriceM2?.title || '-'}</strong>{' '}
            het laagst uit op basis van vraagprijs en beschikbare oppervlakte. Op EPC-label
            scoort{' '}
            <strong className="text-[#111827]">{bestEnergy?.title || '-'}</strong>{' '}
            het gunstigst. Deze conclusie is indicatief, niet definitief, en moet tijdens
            plaatsbezoek en dossiercontrole bevestigd worden.
          </p>
        </section>

      </div>
    </div>
  )
}

function InsightCard({
  label,
  title,
  text,
}: {
  label: string
  title: string
  text: string
}) {
  return (
    <div className="rounded-[2rem] border border-gray-200 bg-white p-6 shadow-sm">
      <p className="text-sm text-blue-400">{label}</p>
      <h3 className="mt-2 text-2xl font-bold">{title}</h3>
      <p className="mt-3 text-gray-600">{text}</p>
    </div>
  )
}

function ScoreBar({
  label,
  score,
}: {
  label: string
  score: number
}) {
  return (
    <div className="mb-4">
      <div className="mb-2 flex justify-between">
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-sm font-bold">{score}/100</p>
      </div>

      <div className="h-3 overflow-hidden rounded-full bg-gray-200">
        <div
          className="h-full rounded-full bg-blue-500"
          style={{
            width: `${score}%`,
          }}
        />
      </div>
    </div>
  )
}

function Stat({
  label,
  value,
  note,
  sideLabel,
  sideValue,
}: {
  label: string
  value: string
  note?: string
  sideLabel?: string
  sideValue?: string
}) {
  return (
    <div
      className="rounded-2xl !bg-white p-4 shadow-sm ring-1 ring-gray-100"
      style={{ background: '#ffffff' }}
    >
      <div className="flex min-h-[92px] flex-col gap-3">
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="mt-2 text-xl font-bold text-[#111827]">{value}</p>
          {note && <p className="mt-1 text-xs font-semibold text-gray-500">{note}</p>}
        </div>

        {sideValue && (
          <div className="rounded-2xl bg-blue-50 px-3 py-3 text-center">
            {sideLabel && (
              <p className="text-[10px] font-bold uppercase tracking-wide text-blue-500">
                {sideLabel}
              </p>
            )}
            <p className="mt-2 text-lg font-black text-blue-700">{sideValue}</p>
          </div>
        )}
      </div>
    </div>
  )
}

function Detail({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div
      className="rounded-2xl !bg-white p-4 shadow-sm ring-1 ring-gray-100"
      style={{ background: '#ffffff' }}
    >
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-2 leading-7 text-gray-700">{value}</p>
    </div>
  )
}

function Badge({
  text,
}: {
  text: string
}) {
  return (
    <span className="rounded-full bg-[#eef2ff] px-3 py-2 text-sm font-bold text-blue-700">
      {text}
    </span>
  )
}
function NearbyPlaces({
  analysis,
  hasCompleteLocation,
}: {
  analysis: any
  hasCompleteLocation: boolean
}) {
  if (!hasCompleteLocation) {
    return (
      <div
        className="rounded-2xl !bg-white p-4 shadow-sm ring-1 ring-gray-100"
        style={{ background: '#ffffff' }}
      >
        <p className="text-sm text-gray-500">Omgeving</p>
        <p className="mt-2 text-sm leading-7 text-gray-700">
          Geen volledig adres beschikbaar.
        </p>
      </div>
    )
  }

  if (!analysis) {
    return (
      <div
        className="rounded-2xl !bg-white p-4 shadow-sm ring-1 ring-gray-100"
        style={{ background: '#ffffff' }}
      >
        <p className="text-sm text-gray-500">Omgeving</p>
        <p className="mt-2 text-sm leading-7 text-gray-700">
          Nog geen locatiegegevens beschikbaar.
        </p>
      </div>
    )
  }

  const items = [
    { label: 'Supermarkt', value: analysis.supermarket },
    { label: 'Ziekenhuis', value: analysis.hospital },
    { label: 'School', value: analysis.school },
    { label: 'Treinstation', value: analysis.trainStation },
    { label: 'Bushalte', value: analysis.busStation },
    { label: 'Apotheek', value: analysis.pharmacy },
    { label: 'Park', value: analysis.park },
    { label: 'Fitness', value: analysis.gym },
    { label: 'Shopping', value: analysis.shopping },
  ]

  return (
    <div
      className="rounded-2xl !bg-white p-4 shadow-sm ring-1 ring-gray-100"
      style={{ background: '#ffffff' }}
    >
      <p className="text-sm text-gray-500">Omgeving</p>

      <div className="mt-3 space-y-2">
        {items.map((item) => (
          <div
            key={item.label}
            className="flex justify-between gap-3 border-b border-gray-200 pb-2 text-sm last:border-b-0 last:pb-0"
          >
            <span className="text-gray-500">{item.label}</span>
            <span className="text-right font-bold text-[#111827]">
              {item.value
                ? `${item.value.name} (${item.value.distanceText})`
                : '-'}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
