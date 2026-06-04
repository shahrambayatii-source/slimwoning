'use client'

import { useEffect, useState } from 'react'


function extractPriceRange(analysisResult: string | null) {
  if (!analysisResult) return 'Nog niet berekend'

  const normalizedResult = analysisResult.replace(/\s+/g, ' ')
  const priceRangeMatch = normalizedResult.match(
    /€?\s*\d{1,3}(?:[.\s]\d{3})+(?:,\d+)?\s*(?:-|–|—|tot)\s*€?\s*\d{1,3}(?:[.\s]\d{3})+(?:,\d+)?/i,
  )

  return priceRangeMatch?.[0].trim() || 'Niet gevonden'
}

function extractResultLabel(
  analysisResult: string | null,
  heading: string,
  labels: string[],
) {
  if (!analysisResult) return 'Nog niet berekend'

  const normalizedResult = analysisResult.replace(/\s+/g, ' ')
  const headingMatch = normalizedResult.match(new RegExp(`${heading}[^.\\n:]*[:\\-]?\\s*([^.]*)`, 'i'))
  const scopedText = headingMatch?.[1] || normalizedResult
  const matchedLabel = labels.find((label) => new RegExp(`\\b${label}\\b`, 'i').test(scopedText))

  return matchedLabel || 'Niet gevonden'
}


export default function VerkopenPage() {
  // Helper to compute heading from Street View panorama to the actual address
  function getHeading(fromLat: number, fromLng: number, toLat: number, toLng: number) {
    const fromLatRad = (fromLat * Math.PI) / 180
    const toLatRad = (toLat * Math.PI) / 180
    const deltaLngRad = ((toLng - fromLng) * Math.PI) / 180

    const y = Math.sin(deltaLngRad) * Math.cos(toLatRad)
    const x =
      Math.cos(fromLatRad) * Math.sin(toLatRad) -
      Math.sin(fromLatRad) * Math.cos(toLatRad) * Math.cos(deltaLngRad)

    return (Math.atan2(y, x) * 180) / Math.PI + 360
  }
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<string | null>(null)
  const [analysisError, setAnalysisError] = useState<string | null>(null)
  const [dashboardError, setDashboardError] = useState<string | null>(null)
  const [streetViewOpenUrl, setStreetViewOpenUrl] = useState<string | null>(null)
  const [citySuggestions, setCitySuggestions] = useState<Array<{ postcode: string; name: string; label: string }>>([])
  const [radarForm, setRadarForm] = useState({
    address: '',
    city: '',
    propertyType: '',
    livingArea: '',
    bedrooms: '',
    epc: '',
    description: '',
  })

  const analysisSummary = analysisResult
    ? analysisResult.length > 520
      ? `${analysisResult.slice(0, 520).trim()}...`
      : analysisResult
    : null

  const hasHouseNumber = /\d/.test(radarForm.address)
  const marktRadarResults = [
    { label: 'Waarderaming', value: extractPriceRange(analysisResult) },
    {
      label: 'Marktpositie',
      value: extractResultLabel(analysisResult, 'Marktpositie', ['Sterk', 'Gemiddeld', 'Zwak']),
    },
    {
      label: 'Verkoopkans',
      value: extractResultLabel(analysisResult, 'Verkoopkans', ['Hoog', 'Gemiddeld', 'Laag']),
    },
  ]

  const streetViewAddress = [radarForm.address, radarForm.city, 'Belgium']
    .map((value) => value.trim())
    .filter(Boolean)
    .join(', ')

  const streetViewUrl = streetViewAddress
    ? `https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}&q=${encodeURIComponent(streetViewAddress)}`
    : null

  useEffect(() => {
    const query = radarForm.city.trim()

    if (query.length < 1) {
      setCitySuggestions([])
      return
    }

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''

    if (!apiKey) {
      setCitySuggestions([])
      return
    }

    const controller = new AbortController()

    async function loadCitySuggestions() {
      try {
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(query)}&types=(regions)&components=country:be&language=nl&key=${apiKey}`,
          { signal: controller.signal },
        )
        const data = await response.json()

        const predictions = Array.isArray(data?.predictions) ? data.predictions : []

        const suggestions = predictions.slice(0, 8).map((prediction: any) => {
          const mainText = prediction?.structured_formatting?.main_text || prediction?.description || ''
          const label = prediction?.description || mainText
          const postcodeMatch = label.match(/\b\d{4}\b/)

          return {
            postcode: postcodeMatch?.[0] || '',
            name: mainText,
            label,
          }
        }).filter((option: { name: string; label: string }) => option.name || option.label)

        setCitySuggestions(suggestions)
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          setCitySuggestions([])
        }
      }
    }

    loadCitySuggestions()

    return () => controller.abort()
  }, [radarForm.city])

  useEffect(() => {
    if (!streetViewAddress) {
      setStreetViewOpenUrl(null)
      return
    }

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''

    if (!apiKey) {
      setStreetViewOpenUrl(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(streetViewAddress)}`)
      return
    }

    let cancelled = false

    async function loadStreetViewPanorama() {
      try {
        // Geocode the address to get the real property location
        const geocodeResponse = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(streetViewAddress)}&key=${apiKey}`,
        )
        const geocodeData = await geocodeResponse.json()
        const targetLocation = geocodeData?.results?.[0]?.geometry?.location

        // Find the nearest Street View panorama
        const metadataResponse = await fetch(
          `https://maps.googleapis.com/maps/api/streetview/metadata?location=${encodeURIComponent(streetViewAddress)}&radius=120&source=outdoor&key=${apiKey}`,
        )
        const metadata = await metadataResponse.json()

        if (cancelled) return

        if (metadata?.status === 'OK' && metadata?.location?.lat && metadata?.location?.lng && targetLocation?.lat && targetLocation?.lng) {
          const heading = Math.round(
            getHeading(
              Number(metadata.location.lat),
              Number(metadata.location.lng),
              Number(targetLocation.lat),
              Number(targetLocation.lng),
            ) % 360,
          )

          const panoParam = metadata?.pano_id
            ? `&pano=${encodeURIComponent(metadata.pano_id)}`
            : `&viewpoint=${metadata.location.lat},${metadata.location.lng}`

          setStreetViewOpenUrl(`https://www.google.com/maps/@?api=1&map_action=pano${panoParam}&heading=${heading}&pitch=0&fov=80`)
          return
        }

        if (metadata?.status === 'OK' && metadata?.pano_id) {
          setStreetViewOpenUrl(`https://www.google.com/maps/@?api=1&map_action=pano&pano=${encodeURIComponent(metadata.pano_id)}&pitch=0&fov=80`)
          return
        }

        setStreetViewOpenUrl(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(streetViewAddress)}`)
      } catch {
        if (!cancelled) {
          setStreetViewOpenUrl(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(streetViewAddress)}`)
        }
      }
    }

    loadStreetViewPanorama()

    return () => {
      cancelled = true
    }
  }, [streetViewAddress])

  function goToDashboard() {
    setDashboardError(null)

    const hasSupabaseSession =
      typeof window !== 'undefined' &&
      Object.keys(window.localStorage).some((key) => {
        if (!key.startsWith('sb-') || !key.includes('auth-token')) return false

        const value = window.localStorage.getItem(key)
        return Boolean(value && value !== 'null' && value !== 'undefined')
      })

    if (!hasSupabaseSession) {
      setDashboardError('Oops, je bent niet ingelogd.')
      return
    }

    window.location.href = '/dashboard'
  }

  async function startMarktRadar() {
    setIsAnalyzing(true)
    setAnalysisError(null)
    setAnalysisResult(null)

    if (!radarForm.address.trim() || !radarForm.city.trim()) {
      setAnalysisError('Vul eerst minstens het adres en de gemeente in.')
      setIsAnalyzing(false)
      return
    }

    if (!hasHouseNumber) {
      setAnalysisError('Vul ook het huisnummer in, anders kan Google het verkeerde pand tonen.')
      setIsAnalyzing(false)
      return
    }

    try {
      const response = await fetch('/api/marktradar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(radarForm),
      })

      const data = await response.json()

      if (!response.ok || data?.success === false) {
        throw new Error(data?.error || 'MarktRadar analyse kon niet worden uitgevoerd')
      }

      const outputText =
        data?.analysis ||
        data?.result?.output_text ||
        data?.result?.output
          ?.flatMap((item: any) => item?.content || [])
          ?.map((content: any) => content?.text || '')
          ?.filter(Boolean)
          ?.join('\n\n') ||
        'Geen leesbaar AI-resultaat ontvangen.'

      setAnalysisResult(outputText)
    } catch (error) {
      setAnalysisError(error instanceof Error ? error.message : 'Onbekende fout')
    } finally {
      setIsAnalyzing(false)
    }
  }
  return (
    <main className="min-h-screen bg-[#F4F7FB] text-[#071B4D]">
      <section className="px-6 pt-10 md:px-10 lg:px-16">
        <div className="mx-auto max-w-[1400px] rounded-t-[2.5rem] bg-gradient-to-br from-[#071B4D] via-[#0A2463] to-[#071B4D] px-8 py-10 text-white shadow-[0_24px_70px_rgba(7,27,77,0.22)] md:px-12">
            <div className="flex flex-col items-center gap-8 text-center">
              <div>
                <span className="inline-flex items-center rounded-full border border-white/15 bg-white/5 px-4 py-1 text-[11px] font-black uppercase tracking-[0.25em] text-cyan-200/80 backdrop-blur-sm">
                  Slim verkopen
                </span>

                <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-black leading-tight tracking-[-0.04em] text-white md:text-5xl">
                  Verkoop je woning met meer inzicht
                </h1>

                <p className="mx-auto mt-4 max-w-2xl text-base font-semibold leading-7 text-blue-100">
                  Start een AI-verkoopanalyse die je woningdata combineert met actuele marktcontext en makelaars in jouw regio.
                </p>
              </div>

            </div>
        </div>
      </section>

      <section id="marktdata" className="px-6 pb-16 md:px-10 lg:px-16">
        <div className="mx-auto max-w-[1400px] rounded-b-[2.5rem] border-x border-b border-blue-100 bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.10)] md:p-10">
          <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
            <div>

              <div className="mt-6 rounded-[1.5rem] border border-blue-100 bg-blue-50/50 p-4">
                <p className="text-sm font-black text-[#071B4D]">Start met je woninggegevens</p>
                <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                  <input
                    value={radarForm.address}
                    onChange={(event) => setRadarForm((prev) => ({ ...prev, address: event.target.value }))}
                    placeholder="Straat + huisnummer"
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-[#071B4D] outline-none transition focus:border-blue-400"
                  />
                  <div className="relative">
                    <input
                      value={radarForm.city}
                      onChange={(event) => setRadarForm((prev) => ({ ...prev, city: event.target.value }))}
                      placeholder="Gemeente of postcode"
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-[#071B4D] outline-none transition focus:border-blue-400"
                    />

                    {citySuggestions.length > 0 && (
                      <div className="absolute left-0 right-0 top-full z-20 mt-2 overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-xl shadow-blue-950/10">
                        {citySuggestions.map((option) => (
                          <button
                            key={option.label}
                            type="button"
                            onClick={() => {
                              setRadarForm((prev) => ({ ...prev, city: option.postcode ? `${option.postcode} ${option.name}` : option.name }))
                              setCitySuggestions([])
                            }}
                            className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm font-black text-[#071B4D] transition hover:bg-blue-50"
                          >
                            <span>{option.name || option.label}</span>
                            {option.postcode && (
                              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">
                                {option.postcode}
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <input
                    value={radarForm.propertyType}
                    onChange={(event) => setRadarForm((prev) => ({ ...prev, propertyType: event.target.value }))}
                    placeholder="Type woning"
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-[#071B4D] outline-none transition focus:border-blue-400"
                  />
                  <input
                    value={radarForm.livingArea}
                    onChange={(event) => setRadarForm((prev) => ({ ...prev, livingArea: event.target.value }))}
                    placeholder="Bewoonbare oppervlakte m²"
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-[#071B4D] outline-none transition focus:border-blue-400"
                  />
                  <input
                    value={radarForm.bedrooms}
                    onChange={(event) => setRadarForm((prev) => ({ ...prev, bedrooms: event.target.value }))}
                    placeholder="Slaapkamers"
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-[#071B4D] outline-none transition focus:border-blue-400"
                  />
                  <input
                    value={radarForm.epc}
                    onChange={(event) => setRadarForm((prev) => ({ ...prev, epc: event.target.value }))}
                    placeholder="EPC-label"
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-[#071B4D] outline-none transition focus:border-blue-400"
                  />
                </div>
                <textarea
                  value={radarForm.description}
                  onChange={(event) => setRadarForm((prev) => ({ ...prev, description: event.target.value }))}
                  placeholder="Korte beschrijving van de woning"
                  rows={3}
                  className="mt-3 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-[#071B4D] outline-none transition focus:border-blue-400"
                />
                {streetViewUrl && (
                  <div className="mt-4 overflow-hidden rounded-[1.5rem] border border-blue-100 bg-white shadow-sm">
                    <div className="flex items-center justify-between gap-3 px-4 py-3">
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-700">
                          Interactieve kaart
                        </p>
                        <p className="mt-1 text-sm font-bold text-slate-600">
                          {streetViewAddress}
                        </p>
                        {!hasHouseNumber && (
                          <p className="mt-2 text-xs font-black text-amber-600">
                            Voeg een huisnummer toe voor een correcte gevelweergave.
                          </p>
                        )}
                      </div>

                      {streetViewOpenUrl && (
                        <a
                          href={streetViewOpenUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex h-10 shrink-0 items-center justify-center rounded-2xl bg-blue-700 px-4 text-xs font-black text-white transition hover:bg-blue-800"
                        >
                          Street View openen
                        </a>
                      )}
                    </div>
                    <iframe
                      src={streetViewUrl}
                      width="100%"
                      height="256"
                      style={{ border: 0 }}
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      title={`Kaart van ${streetViewAddress}`}
                      className="h-64 w-full object-cover"
                    />
                  </div>
                )}
                <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={startMarktRadar}
                    disabled={isAnalyzing}
                    className="inline-flex h-12 flex-1 items-center justify-center rounded-2xl bg-blue-700 px-6 text-sm font-black text-white shadow-lg shadow-blue-900/15 transition hover:bg-blue-800 disabled:cursor-wait disabled:opacity-70"
                  >
                    {isAnalyzing ? 'Analyse loopt...' : 'Analyse starten'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setRadarForm({
                        address: '',
                        city: '',
                        propertyType: '',
                        livingArea: '',
                        bedrooms: '',
                        epc: '',
                        description: '',
                      })
                      setAnalysisResult(null)
                      setAnalysisError(null)
                      setDashboardError(null)
                      setCitySuggestions([])
                      setStreetViewOpenUrl(null)
                    }}
                    className="inline-flex h-12 flex-1 items-center justify-center rounded-2xl border border-red-200 bg-white px-6 text-sm font-black text-red-600 transition hover:bg-red-50"
                  >
                    Wissen
                  </button>
                  <button
                    type="button"
                    onClick={goToDashboard}
                    className="inline-flex h-12 flex-1 items-center justify-center rounded-2xl border border-blue-200 bg-white px-6 text-sm font-black text-blue-700 transition hover:bg-blue-50"
                  >
                    Naar dashboard
                  </button>
                </div>
                {dashboardError && (
                  <p className="mt-3 rounded-2xl bg-red-50 px-4 py-3 text-sm font-black text-red-600">
                    {dashboardError}
                  </p>
                )}
              </div>

            </div>

            <div className="relative h-fit text-[#071B4D]">
              <div>

                <div className="mt-8">
                  <div className="flex items-end justify-between gap-4">
                    <div>
                      <p className="text-sm font-bold text-blue-700">MarktRadar resultaten</p>
                      <p className="mt-1 text-3xl font-black text-[#071B4D]">{isAnalyzing ? 'Live marktcheck...' : 'Klaar voor analyse'}</p>
                    </div>
                  </div>

                  <div className="mt-6 grid grid-cols-3 gap-4">
                    {marktRadarResults.map((result) => {
                      const isPlaceholder = result.value === 'Nog niet berekend'

                      return (
                        <div key={result.label} className="rounded-2xl bg-[#F8FBFF] p-5 min-h-[96px]">
                          <p className="text-sm font-black text-slate-600">{result.label}</p>
                          <p className={`mt-2 font-black text-blue-700 ${isPlaceholder ? 'text-xs leading-4' : 'text-lg leading-6'}`}>
                            {result.value}
                          </p>
                        </div>
                      )
                    })}
                  </div>
                </div>


                {!analysisResult && !analysisError && !isAnalyzing && (
                  <div className="mt-8 rounded-[1.5rem] border border-dashed border-blue-200 bg-white/40 p-8 text-center">
                    <p className="text-lg font-black text-[#071B4D]">
                      Je MarktRadar-analyse verschijnt hier
                    </p>
                    <p className="mx-auto mt-3 max-w-md text-sm font-semibold leading-6 text-slate-500">
                      Vul je woninggegevens in en klik op Analyse starten. SlimWoning toont hier daarna je waarderaming, marktpositie en verkoopadvies.
                    </p>
                  </div>
                )}
                {(analysisResult || analysisError) && (
                  <div className="mt-5 rounded-[1.25rem] bg-white/60 p-4">
                    <p className="text-sm font-black text-[#071B4D]">
                      {analysisError ? 'Analyse fout' : 'Samenvatting'}
                    </p>

                    {analysisError ? (
                      <p className="mt-3 text-sm font-semibold leading-6 text-red-600">
                        {analysisError}
                      </p>
                    ) : (
                      <>
                        <p className="mt-3 whitespace-pre-wrap text-sm font-semibold leading-6 text-slate-700">
                          {analysisSummary}
                        </p>

                        <details className="mt-4 rounded-2xl bg-[#F8FBFF] p-4">
                          <summary className="cursor-pointer text-sm font-black text-blue-700 transition hover:text-blue-900">
                            Lees volledig rapport
                          </summary>
                          <pre className="mt-4 max-h-96 overflow-auto whitespace-pre-wrap text-sm font-semibold leading-6 text-slate-700">
                            {analysisResult}
                          </pre>
                        </details>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <p className="mx-auto mt-6 max-w-[1400px] text-center text-xs font-semibold text-slate-500">
          De MarktRadar analyse draait server-side met een beveiligde OpenAI API key. De uiteindelijke verkoopprijs hangt af van markt, staat, timing en onderhandeling.
        </p>
      </section>
    </main>
  )
}
