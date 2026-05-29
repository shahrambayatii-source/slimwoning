'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { calculateEnergyInsight } from '@/lib/energy-calculator'
import { exportEnergyReport } from '@/lib/export-energy-report'
import { getWoningkenmerken } from '@/lib/woningkenmerken'

export default function FavoritesPage() {
  const router = useRouter()

  const [properties, setProperties] = useState<any[]>([])
  const [marketComparables, setMarketComparables] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [compareNotice, setCompareNotice] = useState('')
  const [compareSelection, setCompareSelection] = useState<any[]>([])
  const [openInsightId, setOpenInsightId] = useState<number | null>(null)
  const [openEnergyScanId, setOpenEnergyScanId] = useState<number | null>(null)
  const [manualEnergyData, setManualEnergyData] = useState<Record<number, Record<string, unknown>>>({})
  const [energyScanRefreshKey, setEnergyScanRefreshKey] = useState(0)

  useEffect(() => {
    localStorage.removeItem('selectedProperties')
    localStorage.removeItem('compareProperties')
    setCompareSelection([])
    getFavorites()
    getMarketComparables()
  }, [])

  async function getMarketComparables() {
    const { data, error } = await supabase
      .from('market_comparables')
      .select('id,title,city,postcode,property_type,price,living_area,bedrooms,bathrooms,epc,bouwjaar,last_seen_at,created_at')

    if (error) {
      setMarketComparables([])
      return
    }

    setMarketComparables(data || [])
  }

  async function getFavorites() {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      router.push('/login')
      return
    }

    const { data: favoriteRows, error: favoritesError } = await supabase
      .from('favorites')
      .select('property_id')
      .eq('user_id', user.id)

    if (favoritesError) {
      console.log(favoritesError)
      setLoading(false)
      return
    }

    const propertyIds = favoriteRows.map((item) => item.property_id)

    if (propertyIds.length === 0) {
      setProperties([])
      setLoading(false)
      return
    }

    const { data: propertyData, error: propertiesError } = await supabase
      .from('properties')
      .select('*')
      .in('id', propertyIds)

    if (propertiesError) {
      console.log(propertiesError)
    } else {
      setProperties(propertyData)
    }

    setLoading(false)
  }

  function addToCompare(property: any) {
    const alreadySelected = compareSelection.some(
      (item: any) => String(item.id) === String(property.id)
    )

    if (alreadySelected) {
      const filtered = compareSelection.filter(
        (item: any) => String(item.id) !== String(property.id)
      )

      setCompareSelection(filtered)
      localStorage.setItem('selectedProperties', JSON.stringify(filtered))
      localStorage.setItem('compareProperties', JSON.stringify(filtered))
      return
    }

    if (compareSelection.length >= 4) {
      setCompareNotice('Je kan maximaal 4 woningen vergelijken.')
      return
    }

    const nextSelection = [...compareSelection, property]

    setCompareSelection(nextSelection)
    localStorage.setItem('selectedProperties', JSON.stringify(nextSelection))
    localStorage.setItem('compareProperties', JSON.stringify(nextSelection))

    setCompareNotice('')
  }

  function toggleCompare(propertyId: number) {
    const property = properties.find((item) => Number(item.id) === propertyId)

    if (!property) return

    addToCompare(property)
  }

  function goToCompare() {
    if (compareSelection.length < 2) {
      setCompareNotice('Selecteer minimaal 2 woningen om te vergelijken.')
      return
    }

    localStorage.setItem('selectedProperties', JSON.stringify(compareSelection))
    localStorage.setItem('compareProperties', JSON.stringify(compareSelection))

    router.push('/compare')
  }

  async function removeFavorite(propertyId: string) {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      router.push('/login')
      return
    }

    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('user_id', user.id)
      .eq('property_id', propertyId)

    if (error) {
      console.log(error)
      alert('Kon favoriet niet verwijderen.')
      return
    }

    setProperties((current) => current.filter((property) => property.id !== propertyId))
  }

  const openInsightProperty =
    properties.find((property) => Number(property.id) === openInsightId) || null

  const openEnergyScanProperty =
    properties.find((property) => String(property.id) === String(openEnergyScanId)) || null

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f6f9fc] text-3xl font-black text-[#0B1F4D]">
        Laden...
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-[#f6f9fc] px-6 py-14 text-[#111827] md:px-10">
      <div className="mx-auto mb-10 max-w-[1500px]">
        <h1 className="text-4xl font-black tracking-[-0.04em] text-[#0B1F4D] md:text-6xl">
          Mijn favorieten
        </h1>
        <p className="mt-4 max-w-2xl text-lg leading-8 text-gray-600">
          Bekijk hier de panden die je hebt opgeslagen en vergelijk ze later opnieuw.
        </p>
        {compareNotice && (
          <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50 px-5 py-4 text-sm font-bold text-blue-700">
            {compareNotice}
          </div>
        )}
      </div>

      {properties.length === 0 ? (
        <div className="mx-auto max-w-7xl rounded-[2rem] border border-blue-100 bg-white p-8 shadow-xl shadow-slate-200/60">
          <h2 className="text-2xl font-black text-[#0B1F4D]">
            Nog geen favorieten
          </h2>
          <p className="mt-3 max-w-xl text-gray-600">
            Sla interessante panden op via het hartje zodat je ze hier makkelijk terugvindt.
          </p>
          <Link
            href="/properties"
            className="mt-6 inline-flex rounded-xl bg-blue-700 px-5 py-3 text-sm font-black text-white transition hover:bg-blue-800"
          >
            Woningen bekijken
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {properties.map((property) => {
            const isSelected = compareSelection.some(
              (item: any) => String(item.id) === String(property.id)
            )
            const epcLabel = String(property.epc || property.epc_code || '').trim()

            return (
              <Link
                href={`/properties/${property.id}`}
                key={property.id}
                className={`group relative flex min-h-[420px] w-full max-w-[300px] flex-col overflow-hidden rounded-[1.5rem] bg-white shadow-xl transition hover:-translate-y-1 hover:shadow-2xl ${
                  isSelected ? 'ring-2 ring-blue-700' : ''
                }`}
              >
                <button
                  type="button"
                  onClick={(event) => {
                    event.preventDefault()
                    event.stopPropagation()
                    removeFavorite(property.id)
                  }}
                  className="absolute right-4 top-4 z-20 rounded-full bg-white px-4 py-2 text-xs font-black text-red-600 shadow-xl transition hover:bg-red-600 hover:text-white"
                >
                  Verwijderen
                </button>

                <div className="relative overflow-hidden">
                  {property.image ? (
                    <img
                      src={property.image}
                      alt={property.title}
                      className="h-44 w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="relative flex h-44 w-full items-center justify-center overflow-hidden bg-gradient-to-br from-slate-200 via-slate-300 to-slate-400">
                      <svg
                        viewBox="0 0 64 64"
                        aria-hidden="true"
                        className="h-24 w-24 text-white/80"
                        fill="none"
                      >
                        <path
                          d="M12 30L32 14L52 30"
                          stroke="currentColor"
                          strokeWidth="4"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M18 29V52H46V29"
                          stroke="currentColor"
                          strokeWidth="4"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M27 52V39H37V52"
                          stroke="currentColor"
                          strokeWidth="4"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>

                      <div className="absolute inset-0 bg-black/10" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/5 to-transparent" />
                </div>

                <div className="flex flex-1 flex-col p-3">
                  <h2 className="min-h-[44px] text-lg font-bold leading-tight line-clamp-2">
                    {property.title || 'Pand zonder titel'}
                  </h2>

                  <p className="mt-2 min-h-[28px] text-xl font-bold text-blue-700">
                    {formatPrice(property.price)}
                  </p>

                  <div className="mt-2 min-h-[28px]">
                    {formatPricePerM2(property) && (
                      <div className="inline-flex flex-wrap items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-700">
                        <span>{formatPricePerM2(property)}</span>

                        <span className="text-[10px] font-semibold text-gray-500">
                          op basis van vraagprijs
                        </span>
                      </div>
                    )}
                  </div>

                  <p className="mt-1 min-h-[20px] truncate text-sm text-gray-500">
                    {property.address
                      ? `${property.address}, ${property.city || ''}`
                      : property.city || 'Locatie niet opgegeven'}
                  </p>

                  {getWoningkenmerken(property).length > 0 && (
                    <div className="mt-2 flex min-h-[24px] flex-wrap gap-1 overflow-hidden">
                      {getWoningkenmerken(property).slice(0, 2).map((kenmerk) => (
                        <span
                          key={kenmerk}
                          className="rounded-full bg-blue-50 px-2 py-1 text-[10px] font-black text-blue-700"
                        >
                          {kenmerk}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="mt-4 flex w-full items-center gap-1 overflow-hidden">
                    <Badge text={`${numberValue(property.slaapkamers || property.bedrooms) || '-'} slp.`} />
                    <Badge text={`${numberValue(property.badkamers || property.bathrooms) || '-'} badk.`} />
                    <Badge text={`${getPropertyArea(property) || '-'} m²`} />
                    {epcLabel && epcLabel !== 'EMPTY' && (
                      <div className="ml-auto flex h-8 shrink-0 overflow-hidden rounded-md shadow-sm">
                        <div className="flex items-center bg-[#1F3B57] px-3 text-[11px] font-black text-white">
                          EPC
                        </div>

                        <div
                          className="relative flex min-w-[34px] items-center justify-center px-2 text-[11px] font-black text-white"
                          style={{
                            backgroundColor: getEpcColor(property.epc),
                            clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%, 10% 50%)',
                            marginLeft: '-2px',
                            paddingLeft: '10px',
                          }}
                        >
                          {property.epc || '-'}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={(event) => {
                        event.preventDefault()
                        event.stopPropagation()
                        setOpenInsightId(Number(property.id))
                      }}
                      className="flex h-11 min-w-0 items-center justify-center rounded-2xl border border-blue-200 bg-white px-2 text-center text-[13px] font-black text-blue-700 transition hover:bg-blue-50 whitespace-nowrap"
                    >
                      Analyse
                    </button>

                    <button
                      type="button"
                      onClick={(event) => {
                        event.preventDefault()
                        event.stopPropagation()
                        setOpenEnergyScanId(Number(property.id))
                      }}
                      className="flex h-11 min-w-0 items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50 px-2 text-center text-[13px] font-black text-emerald-700 transition hover:bg-emerald-100 whitespace-nowrap"
                    >
                      Energie
                    </button>

                    <button
                      type="button"
                      onClick={(event) => {
                        event.preventDefault()
                        event.stopPropagation()
                        toggleCompare(Number(property.id))
                      }}
                      className="flex h-11 min-w-0 items-center justify-center rounded-2xl border border-orange-200 bg-orange-50 px-2 text-center text-[13px] font-black text-orange-700 transition hover:bg-orange-100 disabled:cursor-not-allowed disabled:opacity-50 whitespace-nowrap"
                    >
                      {isSelected ? 'Geselecteerd' : 'Vergelijk'}
                    </button>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}

      {openInsightProperty && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm">
          <div className="relative max-h-[85vh] w-full max-w-5xl overflow-y-auto rounded-[2rem] bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-black uppercase tracking-wide text-emerald-600">
                  Analyse
                </p>
                <h3 className="mt-2 text-2xl font-black text-[#071B4D]">
                  {openInsightProperty.title || 'Woning analyse'}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setOpenInsightId(null)}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gray-100 text-xl font-black text-gray-600 transition hover:bg-gray-200"
              >
                ×
              </button>
            </div>

            {(() => {
              const insight = getSlimCheck(openInsightProperty, properties, marketComparables)

              return (
                <div className="mt-6 space-y-4">
                  <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5">
                    <p className="text-xl font-black text-emerald-800">
                      {insight.status}
                    </p>
                    <p className="mt-2 text-sm font-bold leading-6 text-emerald-700">
                      {insight.highlight}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {insight.points.map((point, index) => (
                      <div
                        key={index}
                        className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
                      >
                        <p className="text-sm font-semibold leading-6 text-gray-700">
                          {point}
                        </p>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => setOpenInsightId(null)}
                    className="mx-auto mt-6 inline-flex items-center justify-center rounded-xl bg-[#071B4D] px-6 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-[#0B2A6B]"
                  >
                    Sluiten
                  </button>
                </div>
              )
            })()}
          </div>
        </div>
      )}

      {openEnergyScanProperty && (() => {
        const propertyId = Number(openEnergyScanProperty.id)
        const manualData = manualEnergyData[propertyId] || {}
        const enrichedEnergyScanProperty = {
          ...openEnergyScanProperty,
          bouwjaar: manualData.bouwjaar || openEnergyScanProperty.bouwjaar,
          renovatiejaar: manualData.renovatiejaar || openEnergyScanProperty.renovatiejaar,
          dakisolatie: manualData.dakisolatie ?? openEnergyScanProperty.dakisolatie,
          muurisolatie: manualData.isolatie ?? openEnergyScanProperty.muurisolatie,
          vloerisolatie: manualData.isolatie ?? openEnergyScanProperty.vloerisolatie,
          dubbel_glas: manualData.ramenVervangen ?? openEnergyScanProperty.dubbel_glas,
          hr_glas: manualData.hr_glas ?? manualData.ramenVervangen ?? openEnergyScanProperty.hr_glas,
          verwarmingstype: manualData.verwarmingstype || openEnergyScanProperty.verwarmingstype,
        }
        const energyInsight = calculateEnergyInsight(enrichedEnergyScanProperty)
        const formatter = new Intl.NumberFormat('nl-BE', {
          style: 'currency',
          currency: 'EUR',
          maximumFractionDigits: 0,
        })
        const energyScanEpc = String(
          openEnergyScanProperty.epc ||
            openEnergyScanProperty.epc_code ||
            ''
        ).toUpperCase().trim()
        const hasGoodEnergyScanEpc = [
          'A+++++',
          'A++++',
          'A+++',
          'A++',
          'A+',
          'A',
          'B',
        ].includes(energyScanEpc)
        const estimatedCost = energyInsight.estimatedMax > 0
          ? `${formatter.format(energyInsight.estimatedMin)} - ${formatter.format(energyInsight.estimatedMax)}`
          : hasGoodEnergyScanEpc
            ? 'Geen verplichte energierenovatie gevonden'
            : 'Nog niet genoeg data'
        const realEnergyNotes = getRealEnergyNotes(openEnergyScanProperty)
        const checkItems = energyInsight.prioritizedRecommendations.filter((item) =>
          !item.text.toLowerCase().includes('volgens de beschikbare gegevens') &&
          !item.text.toLowerCase().includes('geen renovatieverplichting op basis')
        )
        const setManualEnergyValue = (key: string, value: unknown) => {
          setManualEnergyData((current) => ({
            ...current,
            [propertyId]: {
              ...(current[propertyId] || {}),
              [key]: value,
            },
          }))
        }
        const confidenceText = energyInsight.confidence === 'high'
          ? 'Hoog, omdat de belangrijkste energiegegevens beschikbaar zijn.'
          : energyInsight.confidence === 'medium'
            ? 'Gemiddeld, omdat sommige woninggegevens ontbreken.'
            : 'Laag, omdat belangrijke renovatie- of isolatiegegevens ontbreken.'
        const area = getPropertyArea(openEnergyScanProperty)
        const bathroomCount = numberValue(openEnergyScanProperty.badkamers || openEnergyScanProperty.bathrooms)
        const imageCount = Array.isArray(openEnergyScanProperty.images)
          ? openEnergyScanProperty.images.length
          : openEnergyScanProperty.image
            ? 1
            : 0
        const basedOnPills = [
          energyScanEpc ? `EPC ${energyScanEpc}` : '',
          numberValue(enrichedEnergyScanProperty.bouwjaar) ? `Bouwjaar ${numberValue(enrichedEnergyScanProperty.bouwjaar)}` : '',
          area ? `${new Intl.NumberFormat('nl-BE').format(area)} m²` : '',
          bathroomCount ? `${bathroomCount} badkamer${bathroomCount === 1 ? '' : 's'}` : '',
          imageCount ? `${imageCount} foto${imageCount === 1 ? '' : '’s'}` : '',
        ].filter(Boolean)
        const strongPoints = [
          energyInsight.futureProofScore.text,
          energyInsight.energyRisk.text,
          ...realEnergyNotes.slice(0, 2),
        ].filter(Boolean)
        const technicalAttentionPoints = [
          ...checkItems.map((item) => item.text),
          ...energyInsight.warnings,
        ].filter(Boolean)
        const compactCostText = energyInsight.estimatedMax > 0
          ? `Indicatieve kostenrange: ${estimatedCost}.`
          : estimatedCost

        return (
          <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm">
            <div
              id="energy-report-content"
              data-refresh-key={energyScanRefreshKey}
              className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-[2rem] bg-white p-6 shadow-2xl md:p-8"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-wide text-[#0B1F4D]">
                    EnergieScan
                  </p>
                  <h3 className="mt-2 text-2xl font-black text-[#071B4D]">
                    {openEnergyScanProperty.title || 'Energie-inschatting'}
                  </h3>
                  <p className="mt-2 max-w-xl text-sm font-semibold leading-6 text-gray-500">
                    Dit is geen offerte. Dit is een indicatieve scan op basis van de beschikbare woningdata.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setOpenEnergyScanId(null)}
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gray-100 text-2xl font-black text-gray-600 transition hover:bg-gray-200"
                >
                  ×
                </button>
              </div>

              <section className="mt-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-xs font-black uppercase tracking-wide text-[#0B1F4D]">
                      Samenvatting
                    </p>
                    <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-gray-600">
                      {energyInsight.aiSummary}
                    </p>
                  </div>
                  <span className="inline-flex w-fit shrink-0 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-black text-[#0B1F4D] shadow-sm">
                    Geen directe renovatiebehoefte vastgesteld
                  </span>
                </div>

                <div className="mt-4 grid gap-3 border-t border-gray-200 pt-4 text-sm md:grid-cols-3">
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-wide text-gray-500">
                      Energie-inschatting
                    </p>
                    <p className="mt-1 font-semibold leading-5 text-gray-700">{compactCostText}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-wide text-gray-500">
                      Belangrijkste aandachtspunt
                    </p>
                    <p className="mt-1 font-semibold leading-5 text-gray-700">
                      {energyInsight.recommendations[0] || 'Geen duidelijke energierenovatie gevonden met de beschikbare data.'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-wide text-gray-500">
                      Betrouwbaarheid
                    </p>
                    <p className="mt-1 font-semibold leading-5 text-gray-700">{confidenceText}</p>
                  </div>
                </div>
              </section>

              <section className="mt-5 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <h4 className="text-base font-black text-[#071B4D]">
                  Assessment details
                </h4>
                <div className="mt-4 grid gap-5 md:grid-cols-2">
                  <div>
                    <p className="text-xs font-black uppercase tracking-wide text-gray-500">
                      Sterke punten
                    </p>
                    <ul className="mt-3 space-y-2 text-sm font-semibold leading-6 text-gray-700">
                      {strongPoints.slice(0, 4).map((point, index) => (
                        <li key={`${point}-${index}`} className="flex gap-2">
                          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#0B1F4D]" />
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <p className="text-xs font-black uppercase tracking-wide text-gray-500">
                      Technische aandachtspunten
                    </p>
                    <ul className="mt-3 space-y-2 text-sm font-semibold leading-6 text-gray-700">
                      {technicalAttentionPoints.length > 0 ? (
                        technicalAttentionPoints.slice(0, 5).map((point, index) => (
                          <li key={`${point}-${index}`} className="flex gap-2">
                            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#0B1F4D]" />
                            <span>{point}</span>
                          </li>
                        ))
                      ) : (
                        <li>Geen extra controlepunten nodig op basis van de huidige gegevens.</li>
                      )}
                    </ul>
                  </div>
                </div>
              </section>

              {energyInsight.costBreakdown.length > 0 && (
                <section className="mt-5 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                  <h4 className="text-base font-black text-[#071B4D]">
                    Kostenopbouw
                  </h4>
                  <div className="mt-3 divide-y divide-gray-200">
                    {energyInsight.costBreakdown.map((item) => (
                      <div key={item.workType} className="py-3 text-sm leading-6 first:pt-0 last:pb-0">
                        <p className="font-black text-[#071B4D]">{item.workType}</p>
                        <p className="mt-1 font-semibold text-gray-600">{item.formula}</p>
                        <p className="mt-1 font-black text-[#0B1F4D]">
                          ≈ {formatter.format(item.estimatedMin)} - {formatter.format(item.estimatedMax)}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              <section className="mt-5 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <h4 className="text-base font-black text-[#071B4D]">
                  Gebaseerd op
                </h4>
                <div className="mt-3 flex flex-wrap gap-2">
                  {basedOnPills.length > 0 ? (
                    basedOnPills.map((pill) => (
                      <span key={pill} className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-black text-gray-600 shadow-sm">
                        {pill}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm font-semibold text-gray-500">
                      Beperkte woningdata beschikbaar.
                    </span>
                  )}
                </div>

                <div className="mt-5 border-t border-gray-200 pt-5">
                  <h5 className="text-sm font-black text-[#071B4D]">
                    Aanvullende gegevens
                  </h5>
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <label className="block">
                      <span className="text-[11px] font-black uppercase tracking-wide text-gray-500">
                        Bouwjaar
                      </span>
                      <input
                        type="number"
                        value={String(manualData.bouwjaar || '')}
                        onChange={(event) => setManualEnergyValue('bouwjaar', event.target.value)}
                        className="mt-2 h-10 w-full rounded-xl border border-gray-200 px-3 text-sm font-semibold outline-none focus:border-[#0B1F4D]"
                      />
                    </label>

                    <label className="block">
                      <span className="text-[11px] font-black uppercase tracking-wide text-gray-500">
                        Laatste renovatiejaar
                      </span>
                      <input
                        type="number"
                        value={String(manualData.renovatiejaar || '')}
                        onChange={(event) => setManualEnergyValue('renovatiejaar', event.target.value)}
                        className="mt-2 h-10 w-full rounded-xl border border-gray-200 px-3 text-sm font-semibold outline-none focus:border-[#0B1F4D]"
                      />
                    </label>

                    {[
                      ['hr_glas', 'HR-glas aanwezig?'],
                      ['dakisolatie', 'Dak geïsoleerd?'],
                      ['isolatie', 'Algemene isolatie aanwezig?'],
                      ['ramenVervangen', 'Ramen vervangen?'],
                    ].map(([key, label]) => (
                      <div key={key} className="rounded-xl border border-gray-200 bg-white p-3">
                        <p className="text-[11px] font-black uppercase tracking-wide text-gray-500">
                          {label}
                        </p>
                        <div className="mt-2 grid grid-cols-2 gap-2">
                          {[true, false].map((value) => (
                            <button
                              key={String(value)}
                              type="button"
                              onClick={() => setManualEnergyValue(key, value)}
                              className={`h-9 rounded-xl border border-gray-200 text-xs font-black transition ${
                                manualData[key] === value
                                  ? 'bg-[#0B1F4D] text-white'
                                  : 'bg-white text-gray-600 hover:border-[#0B1F4D]'
                              }`}
                            >
                              {value ? 'Ja' : 'Nee'}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}

                    <label className="block md:col-span-2">
                      <span className="text-[11px] font-black uppercase tracking-wide text-gray-500">
                        Type verwarming
                      </span>
                      <select
                        value={String(manualData.verwarmingstype || '')}
                        onChange={(event) => setManualEnergyValue('verwarmingstype', event.target.value)}
                        className="mt-2 h-10 w-full rounded-xl border border-gray-200 px-3 text-sm font-semibold outline-none focus:border-[#0B1F4D]"
                      >
                        <option value="">Onbekend</option>
                        <option value="Gas">Gas</option>
                        <option value="Elektrisch">Elektrisch</option>
                        <option value="Warmtepomp">Warmtepomp</option>
                        <option value="Mazout">Mazout</option>
                      </select>
                    </label>
                  </div>
                </div>
              </section>

              <div className="mt-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <p className="text-xs font-bold leading-5 text-gray-500">
                  Voor een echte offerte zijn exacte renovatiegegevens, plaatsbezoek en metingen nodig.
                </p>

                <div className="flex flex-wrap justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setEnergyScanRefreshKey((current) => current + 1)}
                    className="rounded-xl border border-[#0B1F4D] bg-white px-4 py-2.5 text-sm font-black text-[#0B1F4D] transition hover:bg-[#F5F7FB]"
                  >
                    Herbereken energiescan
                  </button>

                  <button
                    type="button"
                    onClick={async () => {
                      console.log('PDF CLICKED')

                      await exportEnergyReport(
                        'energy-report-content',
                        openEnergyScanProperty?.title || 'energie-report'
                      )
                    }}
                    className="rounded-xl border border-[#0B1F4D] bg-white px-4 py-2.5 text-sm font-black text-[#0B1F4D] transition hover:bg-[#F5F7FB]"
                  >
                    Download PDF
                  </button>

                  <button
                    type="button"
                    onClick={() => setOpenEnergyScanId(null)}
                    className="rounded-xl bg-[#0B1F4D] px-4 py-2.5 text-sm font-black text-white transition hover:bg-[#071736]"
                  >
                    Sluiten
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      })()}

      {compareSelection.length > 0 && (
        <div className="fixed bottom-6 left-1/2 z-50 flex w-[92%] max-w-3xl -translate-x-1/2 items-center justify-between rounded-full bg-[#07122F] px-6 py-4 shadow-2xl">
          <p className="text-base font-black text-white">
            {compareSelection.length} woning{compareSelection.length > 1 ? 'en' : ''} geselecteerd
          </p>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setCompareSelection([])
                localStorage.removeItem('selectedProperties')
                localStorage.removeItem('compareProperties')
              }}
              className="rounded-full bg-white/10 px-5 py-3 text-sm font-black text-white transition hover:bg-white/20"
            >
              Wissen
            </button>

            <button
              type="button"
              onClick={goToCompare}
              className="rounded-full bg-white px-6 py-3 text-sm font-black text-[#07122F] transition hover:opacity-90"
            >
              Vergelijk & PDF
            </button>
          </div>
        </div>
      )}
    </main>
  )
}

function numberValue(value: any) {
  const rawValue = String(value || '').trim()

  if (!rawValue) return 0

  const onlyNumbers = rawValue.replace(/[^\d]/g, '')

  return Number(onlyNumbers) || 0
}

function formatPrice(value: any) {
  const price = numberValue(value)

  if (!price) return 'Prijs op aanvraag'

  return `€ ${new Intl.NumberFormat('nl-BE').format(price)}`
}

function getPropertyArea(property: any) {
  return numberValue(
    property.bewoonbare_oppervlakte ||
      property.oppervlakte ||
      property.living_area ||
      property.grondoppervlakte
  )
}

function getPropertyTypeForAnalysis(property: any) {
  return String(
    property.woning_type ||
      property.property_type ||
      property.type ||
      ''
  ).trim().toLowerCase()
}

function getBedroomsForAnalysis(property: any) {
  return numberValue(property.slaapkamers || property.bedrooms)
}

function formatPricePerM2(property: any) {
  const price = numberValue(property.price)
  const area = getPropertyArea(property)

  if (!price || !area) return ''

  return `€ ${new Intl.NumberFormat('nl-BE', {
    maximumFractionDigits: 0,
  }).format(price / area)} / m²`
}

function getPropertyPricePerM2(property: any) {
  const price = numberValue(property.price)
  const area = getPropertyArea(property)

  if (!price || !area) return 0

  return price / area
}

function getCityAveragePricePerM2(property: any, properties: any[]) {
  const city = String(property.city || '').trim().toLowerCase()

  if (!city) return 0

  const comparablePrices = properties
    .filter((item) => String(item.city || '').trim().toLowerCase() === city)
    .map((item) => getPropertyPricePerM2(item))
    .filter((value) => value > 0)

  if (comparablePrices.length < 2) return 0

  return comparablePrices.reduce((total, value) => total + value, 0) / comparablePrices.length
}

function getComparablePool(properties: any[], marketComparables: any[]) {
  const normalizedMarketComparables = marketComparables.map((item) => ({
    ...item,
    id: `market-${item.id}`,
    woning_type: item.property_type,
    bewoonbare_oppervlakte: item.living_area,
    slaapkamers: item.bedrooms,
    badkamers: item.bathrooms,
    __marketComparable: true,
  }))

  return [...properties, ...normalizedMarketComparables]
}

function getComparableProperties(property: any, properties: any[], marketComparables: any[]) {
  const city = String(property.city || '').trim().toLowerCase()
  const type = getPropertyTypeForAnalysis(property)
  const area = getPropertyArea(property)
  const bedrooms = getBedroomsForAnalysis(property)

  if (!city || !type || !area || !bedrooms) return []

  return getComparablePool(properties, marketComparables).filter((item) => {
    if (String(item.id) === String(property.id)) return false

    const itemCity = String(item.city || '').trim().toLowerCase()
    const itemType = getPropertyTypeForAnalysis(item)
    const itemArea = getPropertyArea(item)
    const itemBedrooms = getBedroomsForAnalysis(item)
    const itemPricePerM2 = getPropertyPricePerM2(item)

    if (!itemPricePerM2 || !itemArea || !itemBedrooms) return false

    const surfaceDifference = Math.abs(itemArea - area) / area
    const bedroomDifference = Math.abs(itemBedrooms - bedrooms)

    return (
      itemCity === city &&
      itemType === type &&
      surfaceDifference <= 0.2 &&
      bedroomDifference <= 1
    )
  })
}

function getMedian(values: number[]) {
  if (values.length === 0) return 0

  const sortedValues = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sortedValues.length / 2)

  if (sortedValues.length % 2 === 0) {
    return (sortedValues[middle - 1] + sortedValues[middle]) / 2
  }

  return sortedValues[middle]
}

function formatPricePerM2Value(value: number) {
  return `€ ${new Intl.NumberFormat('nl-BE', {
    maximumFractionDigits: 0,
  }).format(value)} / m²`
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

function getKnownAmenities(property: any) {
  return [
    parseBooleanData(property.parking) === true ? 'parking' : '',
    parseBooleanData(property.tuin) === true ? 'tuin' : '',
    parseBooleanData(property.terras) === true ? 'terras' : '',
    parseBooleanData(property.lift) === true ? 'lift' : '',
    parseBooleanData(property.gemeubeld) === true ? 'gemeubeld' : '',
    parseBooleanData(property.dubbel_glas) === true ? 'dubbel glas' : '',
  ].filter(Boolean)
}

function getSustainabilityScore(property: any) {
  const kenmerken = getWoningkenmerken(property)
  const epc = String(property.epc || property.epc_code || '').trim().toUpperCase()
  let score = epc ? 45 : 35

  if (['A+++++', 'A++++', 'A+++', 'A++', 'A+', 'A', 'B'].includes(epc)) score += 28
  else if (epc === 'C') score += 18
  else if (epc === 'D') score += 8
  else if (['E', 'F', 'G'].includes(epc)) score -= 12

  if (parseBooleanData(property.dubbel_glas) === true) score += 8
  if (parseBooleanData(property.zonnepanelen) === true) score += 8
  if (parseBooleanData(property.warmtepomp) === true) score += 10
  if (kenmerken.includes('Energiezuinig')) score += 8
  if (numberValue(property.bouwjaar) >= 2010) score += 6

  return Math.max(1, Math.min(99, score))
}

function getComfortScore(property: any) {
  const kenmerken = getWoningkenmerken(property)
  const amenities = getKnownAmenities(property)
  let score = 45 + amenities.length * 7

  if (kenmerken.includes('Luxe afwerking')) score += 8
  if (kenmerken.includes('Instapklaar')) score += 7
  if (kenmerken.includes('Rustig gelegen')) score += 5
  if (numberValue(property.badkamers) >= 2) score += 5

  return Math.max(1, Math.min(99, score))
}

function getFloodInsight(property: any) {
  const floodValue = firstKnownPropertyValue(
    property.overstromingscertificaat,
    property.overstromingsgevoeligheid,
    property.overstromingsrisico,
    property.overstroming_zonetype,
    property.p_score,
    property.g_score
  )

  if (!floodValue) {
    return 'Overstromingsdata: onvoldoende gegevens beschikbaar voor een betrouwbare inschatting.'
  }

  const pScore = property.p_score ? `P-score ${property.p_score}` : ''
  const gScore = property.g_score ? `G-score ${property.g_score}` : ''
  const scores = [pScore, gScore].filter(Boolean).join(', ')

  return `Overstromingsdata: ${scores || String(floodValue)} beschikbaar. Dit is indicatief; controleer het attest en de ligging tijdens dossiercontrole.`
}

function getDataDrivenAnalysisNotes(property: any) {
  const kenmerken = getWoningkenmerken(property)
  const amenities = getKnownAmenities(property)
  const notes: string[] = []
  const bedrooms = numberValue(property.slaapkamers || property.bedrooms)
  const area = getPropertyArea(property)
  const mobilityText = [
    property.ligging,
    property.location_description,
    property.description,
    ...kenmerken,
  ].filter(Boolean).join(' ').toLowerCase()

  notes.push(
    amenities.length > 0
      ? `Comfortniveau: op basis van beschikbare woningdata zijn ${amenities.join(', ')} aanwezig. Dit is indicatief en niet definitief.`
      : 'Comfortniveau: onvoldoende gegevens beschikbaar voor een betrouwbare inschatting.'
  )

  if (kenmerken.includes('Kindvriendelijk') || bedrooms >= 3 || parseBooleanData(property.tuin) === true) {
    notes.push('Gezinsvriendelijkheid: er zijn beschikbare signalen zoals slaapkamers, tuin of het kenmerk Kindvriendelijk. Controleer indeling en omgeving tijdens plaatsbezoek.')
  } else {
    notes.push('Gezinsvriendelijkheid: beperkte betrouwbaarheid omdat slaapkamers, tuin of kindvriendelijke kenmerken ontbreken of onvolledig zijn.')
  }

  if (kenmerken.includes('Dichtbij openbaar vervoer') || mobilityText.includes('openbaar vervoer') || mobilityText.includes('station')) {
    notes.push('Mobiliteit: de beschikbare gegevens bevatten een signaal rond openbaar vervoer of station. Controleer exacte afstand en verbindingen.')
  }

  if (kenmerken.includes('Investeringspand')) {
    notes.push('Investeringspotentieel: het kenmerk Investeringspand is opgegeven. Rendement, verhuurbaarheid en kosten blijven apart te controleren.')
  } else if (area && area < 65 && bedrooms <= 1) {
    notes.push('Investeringspotentieel: compactere oppervlakte kan relevant zijn voor bepaalde kopers of huurders, maar er is onvoldoende data voor een definitieve investeringsinschatting.')
  }

  notes.push(
    getSustainabilityScore(property) >= 70
      ? 'Duurzaamheidsindicatie: EPC, dubbel glas, zonnepanelen, warmtepomp of energiekenmerken geven samen een positief indicatief signaal.'
      : 'Duurzaamheidsindicatie: beschikbare energiegegevens zijn beperkt of gemengd; controleer EPC-attest en technieken.'
  )

  notes.push(getFloodInsight(property))

  return notes
}

function getRealEnergyNotes(property: any) {
  const notes: string[] = []
  const kenmerken = getWoningkenmerken(property)
  const epc = String(property.epc || property.epc_code || '').trim().toUpperCase()
  const primaryEnergy = numberValue(property.primair_energieverbruik)
  const co2 = numberValue(property.co2_uitstoot)
  const zonnepanelen = parseBooleanData(property.zonnepanelen)
  const thermischeZonnepanelen = parseBooleanData(property.thermische_zonnepanelen)
  const warmtepomp = parseBooleanData(property.warmtepomp)
  const dubbelGlas = parseBooleanData(property.dubbel_glas)
  const heatingType = String(property.verwarmingstype || '').trim()

  if (epc) {
    if (['A+++++', 'A++++', 'A+++', 'A++', 'A+', 'A', 'B'].includes(epc)) {
      notes.push(`EPC ${epc}: sterk energie-efficiëntiesignaal in de beschikbare data.`)
    } else if (['E', 'F', 'G'].includes(epc)) {
      notes.push(`EPC ${epc}: zwakker energieprestatiesignaal; controle van renovatieplicht en maatregelen blijft aangewezen.`)
    } else {
      notes.push(`EPC ${epc}: gemiddeld energieprestatiesignaal op basis van het label.`)
    }
  }

  if (primaryEnergy) {
    notes.push(`Primair energieverbruik: ${new Intl.NumberFormat('nl-BE').format(primaryEnergy)} kWh/m² jaar.`)
  }

  if (co2) {
    notes.push(`CO₂-uitstoot: ${new Intl.NumberFormat('nl-BE').format(co2)} kg/m² jaar.`)
  }

  if (zonnepanelen === true) notes.push('Zonnepanelen aanwezig volgens de woningdata: positief signaal voor hernieuwbare energie.')
  if (thermischeZonnepanelen === true) notes.push('Thermische zonnepanelen aanwezig volgens de woningdata.')
  if (warmtepomp === true) notes.push('Warmtepomp aanwezig volgens de woningdata: lagere fossiele afhankelijkheid.')
  if (heatingType) notes.push(`Verwarmingstype opgegeven als ${heatingType}; controleer rendement en installatieleeftijd.`)
  if (dubbelGlas === true) notes.push('Dubbel glas aanwezig volgens de woningdata.')
  if (dubbelGlas === false) notes.push('Dubbel glas staat als niet aanwezig in de woningdata; ramen verdienen extra controle.')
  if (kenmerken.includes('Energiezuinig')) notes.push('Kenmerk Energiezuinig is opgegeven bij deze woning.')

  if (notes.length === 0) {
    notes.push('Er is beperkt energiedata beschikbaar. Deze analyse blijft indicatief en gebaseerd op de beschikbare woningdata.')
  }

  return notes
}

function getSlimCheck(property: any, properties: any[], marketComparables: any[]) {
  const pricePerM2 = getPropertyPricePerM2(property)
  const city = property.city || 'deze regio'
  const type = getPropertyTypeForAnalysis(property) || 'woningtype onbekend'
  const buildYear = numberValue(property.bouwjaar)
  const renovationRequirement = parseBooleanData(property.renovatieverplichting)
  const propertyText = [
    property.description,
    ...getWoningkenmerken(property),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  let marketScore = 58
  let marketLine = 'Onvoldoende gegevens beschikbaar voor een betrouwbare inschatting. Er zijn minder dan 3 vergelijkbare panden in de beschikbare marktdata.'
  const comparisonSet = getComparableProperties(property, properties, marketComparables)
  const comparisonCount = comparisonSet.length
  const comparablePrices = comparisonSet.map((item) => getPropertyPricePerM2(item))
  const averagePricePerM2 = comparisonCount >= 3
    ? comparablePrices.reduce((sum, value) => sum + value, 0) / comparisonCount
    : 0
  const medianPricePerM2 = comparisonCount >= 3 ? getMedian(comparablePrices) : 0

  if (pricePerM2 && averagePricePerM2 && comparisonCount >= 3) {
    const difference = Math.round(((pricePerM2 - averagePricePerM2) / averagePricePerM2) * 100)
    const confidenceText = comparisonCount >= 5
      ? 'De vergelijkingsbasis is redelijk bruikbaar.'
      : 'De vergelijkingsbasis is beperkt, dus interpreteer dit voorzichtig.'

    if (difference <= -10) {
      marketScore = 82
      marketLine = `Op basis van beschikbare marktdata (${comparisonCount} vergelijkbare panden in ${city}, ${type}, ±20% oppervlakte en vergelijkbare slaapkamers) ligt deze woning ongeveer ${Math.abs(difference)}% onder het gemiddelde. Gemiddeld: ${formatPricePerM2Value(averagePricePerM2)}. Mediaan: ${formatPricePerM2Value(medianPricePerM2)}. ${confidenceText}`
    } else if (difference <= -5) {
      marketScore = 72
      marketLine = `Op basis van beschikbare marktdata (${comparisonCount} vergelijkbare panden in ${city}) ligt deze woning ongeveer ${Math.abs(difference)}% onder het gemiddelde prijs/m². Gemiddeld: ${formatPricePerM2Value(averagePricePerM2)}. Mediaan: ${formatPricePerM2Value(medianPricePerM2)}. ${confidenceText}`
    } else if (difference <= 4) {
      marketScore = 62
      marketLine = `Op basis van beschikbare marktdata (${comparisonCount} vergelijkbare panden in ${city}) ligt de prijs/m² dicht bij het gemiddelde. Gemiddeld: ${formatPricePerM2Value(averagePricePerM2)}. Mediaan: ${formatPricePerM2Value(medianPricePerM2)}. ${confidenceText}`
    } else if (difference <= 10) {
      marketScore = 44
      marketLine = `Op basis van beschikbare marktdata (${comparisonCount} vergelijkbare panden in ${city}) ligt deze woning ongeveer ${difference}% boven het gemiddelde prijs/m². Gemiddeld: ${formatPricePerM2Value(averagePricePerM2)}. Mediaan: ${formatPricePerM2Value(medianPricePerM2)}. ${confidenceText}`
    } else {
      marketScore = 28
      marketLine = `Op basis van beschikbare marktdata (${comparisonCount} vergelijkbare panden in ${city}) ligt deze woning ongeveer ${difference}% boven het gemiddelde prijs/m². Gemiddeld: ${formatPricePerM2Value(averagePricePerM2)}. Mediaan: ${formatPricePerM2Value(medianPricePerM2)}. ${confidenceText}`
    }
  }

  const hasReadySignal = ['gerenoveerd', 'instapklaar', 'modern', 'vernieuwd', 'energiezuinig'].some((term) =>
    propertyText.includes(term)
  )
  const hasRenovationSignal = ['renovatie', 'op te frissen', 'te renoveren', 'werk'].some((term) =>
    propertyText.includes(term)
  )
  let conditionScore = hasReadySignal ? 78 : hasRenovationSignal ? 42 : 60
  let conditionLine = 'De beschikbare gegevens bevatten geen duidelijke informatie over renovatie of technische staat.'

  if (renovationRequirement === true) {
    conditionScore = 38
    conditionLine = 'Renovatieverplichting staat als aanwezig in de data. Controleer het EPC-attest, timing en concrete maatregelen voordat je conclusies trekt.'
  } else if (renovationRequirement === false) {
    conditionLine = 'Renovatieverplichting staat niet als aanwezig in de data. De technische staat blijft afhankelijk van beschrijving, foto’s en plaatsbezoek.'
  }

  if (hasReadySignal) {
    conditionLine = 'De beschikbare gegevens bevatten positieve signalen zoals gerenoveerd, instapklaar, modern, vernieuwd of energiezuinig. Dit blijft indicatief en moet visueel gecontroleerd worden.'
  }

  if (hasRenovationSignal) {
    conditionLine = 'De beschrijving bevat renovatiesignalen zoals renovatie, op te frissen, te renoveren of werk. Controleer omvang en kosten tijdens een bezoek.'
  }

  if (hasRenovationSignal && hasReadySignal) {
    conditionLine = 'De beschrijving bevat zowel positieve als renovatiegerichte signalen. Controleer foto’s, afwerking en recente werken tijdens een bezoek.'
  }

  if (!hasRenovationSignal && !hasReadySignal && buildYear) {
    conditionLine = `Bouwjaar ${buildYear} is beschikbaar, maar zonder duidelijke renovatie- of technische details. Controleer recente werken, technieken en afwerking tijdens een bezoek.`
  }

  const energyNotes = getRealEnergyNotes(property)
  const energyScore = Math.round((getSustainabilityScore(property) + (energyNotes.length >= 3 ? 68 : energyNotes.length >= 2 ? 60 : 52)) / 2)
  const energyLine = `${energyNotes.join(' ')} Deze analyse is indicatief en gebaseerd op beschikbare woningdata.`
  const comfortScore = getComfortScore(property)
  const dataDrivenNotes = getDataDrivenAnalysisNotes(property)

  const totalScore = Math.round(marketScore * 0.42 + conditionScore * 0.24 + energyScore * 0.2 + comfortScore * 0.14)
  const highlight = totalScore >= 75
    ? 'Deze favoriet lijkt op basis van de beschikbare data interessant, maar blijft indicatief.'
    : totalScore >= 58
      ? 'Deze favoriet vraagt gerichte controle op prijs, staat en energiedata.'
      : 'Deze favoriet heeft aandachtspunten in de beschikbare data. Controleer dit verder voor je vergelijkt.'

  return {
    status: comparisonCount >= 3
      ? `${totalScore}/100 Analyse score`
      : `${totalScore}/100 Analyse score - beperkte vergelijkingsbasis`,
    highlight: `${highlight} Deze analyse gebruikt alleen beschikbare woningdata en marktinformatie.`,
    points: [marketLine, conditionLine, energyLine, ...dataDrivenNotes],
  }
}

function Badge({ text }: { text: string }) {
  return (
    <span className="flex h-8 shrink-0 items-center justify-center rounded-full bg-gray-100 px-2 text-[11px] font-black text-gray-700 whitespace-nowrap">
      {text}
    </span>
  )
}

function getEpcColor(value: any) {
  const cleanLabel = String(value || '').trim().toUpperCase()
  const epcColors: Record<string, string> = {
    'A+++++': '#0b5f2a',
    'A++++': '#0b5f2a',
    'A+++': '#0b5f2a',
    'A++': '#0f6f34',
    'A+': '#1f7a3a',
    A: '#3f9a45',
    B: '#a7cf20',
    C: '#f3df00',
    D: '#f6b428',
    E: '#f47c20',
    F: '#ef2a2a',
    G: '#c8191e',
  }

  return epcColors[cleanLabel] || '#59d000'
}
