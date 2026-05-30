'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

const woningTypes = [
  'Huis',
  'Appartement',
  'Villa',
  'Studio',
  'Duplex appartement',
  'Penthouse',
  'Rijwoning',
  'Halfopen bebouwing',
  'Open bebouwing',
  'Nieuwbouw woning',
  'Nieuwbouw appartement',
  'Handelszaak',
  'Kantoor',
  'Bouwgrond',
]

const steps = [
  'Adres',
  'Basis',
  'Staat & bouw',
  'Energie',
  'Buitenruimte',
  'Prijsindicatie',
  'Rapport',
]

function parseNumber(value: string) {
  const parsed = Number(String(value || '').replace(/[^0-9.,]/g, '').replace(',', '.'))
  return Number.isFinite(parsed) ? parsed : 0
}

function formatEuro(value: number) {
  return new Intl.NumberFormat('nl-BE', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(value)
}

function estimateValue(data: {
  propertyType: string
  livingArea: string
  bedrooms: string
  bathrooms: string
  epcLabel: string
  woningStaat: string
  buildYear: string
  landArea: string
  buitenruimte: string
  parking: string
  heatingType: string
  solarPanels: string
  doubleGlass: string
  expectedPrice: string
}) {
  const living = parseNumber(data.livingArea)
  const land = parseNumber(data.landArea)
  const bedrooms = parseNumber(data.bedrooms)
  const bathrooms = parseNumber(data.bathrooms)
  const buildYear = parseNumber(data.buildYear)
  const expected = parseNumber(data.expectedPrice)

  if (expected > 0) return Math.round(expected)

  let base = Math.max(living, 60) * 2850

  if (data.propertyType.toLowerCase().includes('villa')) base *= 1.18
  if (data.propertyType.toLowerCase().includes('appartement')) base *= 1.05
  if (data.propertyType.toLowerCase().includes('bouwgrond')) base = Math.max(land, 150) * 520

  base += bedrooms * 9000
  base += bathrooms * 7000
  base += Math.min(land, 1200) * 120

  const epc = data.epcLabel.trim().toUpperCase()
  if (['A+++++', 'A++++', 'A+++', 'A++', 'A+', 'A'].includes(epc)) base *= 1.08
  else if (epc === 'B') base *= 1.04
  else if (['E', 'F'].includes(epc)) base *= 0.9

  if (data.woningStaat === 'Instapklaar') base *= 1.08
  if (data.woningStaat === 'Goed onderhouden') base *= 1.04
  if (data.woningStaat === 'Te renoveren') base *= 0.92
  if (data.woningStaat === 'Grondige renovatie nodig') base *= 0.82

  if (buildYear >= 2015) base *= 1.06
  else if (buildYear > 0 && buildYear < 1975) base *= 0.95

  if (data.buitenruimte === 'Tuin') base += 18000
  if (data.buitenruimte === 'Terras') base += 9000
  if (data.parking && data.parking !== 'Geen') base += 12000
  if (data.heatingType === 'Warmtepomp') base += 14000
  if (data.solarPanels === 'Ja') base += 10000
  if (data.doubleGlass === 'Ja') base += 6000

  return Math.round(base / 1000) * 1000
}

function buildStreetViewUrl(address: string) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  if (!address.trim() || !apiKey) return ''

  const params = new URLSearchParams({
    size: '900x420',
    location: address.trim(),
    key: apiKey,
    fov: '80',
    pitch: '5',
  })

  return `https://maps.googleapis.com/maps/api/streetview?${params.toString()}`
}

export default function SchattingPage() {
  const [step, setStep] = useState(0)
  const [address, setAddress] = useState('')
  const [propertyType, setPropertyType] = useState('')
  const [livingArea, setLivingArea] = useState('')
  const [bedrooms, setBedrooms] = useState('')
  const [bathrooms, setBathrooms] = useState('')
  const [epcLabel, setEpcLabel] = useState('')
  const [woningStaat, setWoningStaat] = useState('')
  const [buildYear, setBuildYear] = useState('')
  const [renovationYear, setRenovationYear] = useState('')
  const [landArea, setLandArea] = useState('')
  const [buitenruimte, setBuitenruimte] = useState('')
  const [parking, setParking] = useState('')
  const [lift, setLift] = useState('')
  const [heatingType, setHeatingType] = useState('')
  const [solarPanels, setSolarPanels] = useState('')
  const [doubleGlass, setDoubleGlass] = useState('')
  const [expectedPrice, setExpectedPrice] = useState('')

  const streetViewUrl = useMemo(() => buildStreetViewUrl(address), [address])
  const estimatedValue = useMemo(
    () =>
      estimateValue({
        propertyType,
        livingArea,
        bedrooms,
        bathrooms,
        epcLabel,
        woningStaat,
        buildYear,
        landArea,
        buitenruimte,
        parking,
        heatingType,
        solarPanels,
        doubleGlass,
        expectedPrice,
      }),
    [
      propertyType,
      livingArea,
      bedrooms,
      bathrooms,
      epcLabel,
      woningStaat,
      buildYear,
      landArea,
      buitenruimte,
      parking,
      heatingType,
      solarPanels,
      doubleGlass,
      expectedPrice,
    ],
  )

  const handleReset = () => {
    setStep(0)
    setAddress('')
    setPropertyType('')
    setLivingArea('')
    setBedrooms('')
    setBathrooms('')
    setEpcLabel('')
    setWoningStaat('')
    setBuildYear('')
    setRenovationYear('')
    setLandArea('')
    setBuitenruimte('')
    setParking('')
    setLift('')
    setHeatingType('')
    setSolarPanels('')
    setDoubleGlass('')
    setExpectedPrice('')
  }

  const handleDownloadPdf = async () => {
    const lines = [
      'SlimWoning schattingsrapport',
      '',
      `Adres: ${address || 'Niet opgegeven'}`,
      `Type woning: ${propertyType || 'Niet opgegeven'}`,
      `Woonoppervlakte: ${livingArea || 'Niet opgegeven'}`,
      `Slaapkamers: ${bedrooms || 'Niet opgegeven'}`,
      `Badkamers: ${bathrooms || 'Niet opgegeven'}`,
      `EPC-label: ${epcLabel || 'Niet opgegeven'}`,
      `Staat: ${woningStaat || 'Niet opgegeven'}`,
      `Bouwjaar: ${buildYear || 'Niet opgegeven'}`,
      `Renovatiejaar: ${renovationYear || 'Niet opgegeven'}`,
      `Perceeloppervlakte: ${landArea || 'Niet opgegeven'}`,
      `Buitenruimte: ${buitenruimte || 'Niet opgegeven'}`,
      `Parking: ${parking || 'Niet opgegeven'}`,
      `Lift: ${lift || 'Niet opgegeven'}`,
      `Verwarming: ${heatingType || 'Niet opgegeven'}`,
      `Zonnepanelen: ${solarPanels || 'Niet opgegeven'}`,
      `Dubbel glas: ${doubleGlass || 'Niet opgegeven'}`,
      '',
      `Indicatieve waarde: ${formatEuro(estimatedValue)}`,
      '',
      'Let op: deze indicatie is geen officiële taxatie.',
    ]

    try {
      const { jsPDF } = await import('jspdf')
      const doc = new jsPDF()
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(18)
      doc.text('SlimWoning schattingsrapport', 20, 24)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(11)
      lines.slice(2).forEach((line, index) => {
        doc.text(line, 20, 42 + index * 8)
      })
      doc.save('slimwoning-schattingsrapport.pdf')
    } catch {
      const printable = window.open('', '_blank')
      if (!printable) return
      printable.document.write(`<pre style="font-family:Arial,sans-serif;white-space:pre-wrap;padding:32px">${lines.join('\n')}</pre>`)
      printable.document.close()
      printable.print()
    }
  }

  const nextStep = () => setStep((current) => Math.min(current + 1, steps.length - 1))
  const previousStep = () => setStep((current) => Math.max(current - 1, 0))

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/50">
      <section className="px-6 py-12 md:px-10 lg:px-16">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 text-center">
            <Link
              href="/verkopen"
              className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-blue-700 transition hover:text-blue-900"
            >
              ← Terug naar schatting
            </Link>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-700">
              SlimWoning schatting
            </p>
            <h1 className="mt-3 text-4xl font-black tracking-[-0.035em] text-[#071B4D]">
              Woningwaarde in 7 stappen
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-base text-slate-700">
              Vul je gegevens stap voor stap in. We tonen de locatievisuele context via Google Street View en maken daarna een indicatief PDF-rapport.
            </p>
          </div>

          <div className="mb-6 grid gap-3 md:grid-cols-7">
            {steps.map((item, index) => (
              <button
                key={item}
                type="button"
                onClick={() => setStep(index)}
                className={`rounded-2xl border px-3 py-3 text-xs font-black transition ${
                  index === step
                    ? 'border-blue-600 bg-blue-600 text-white shadow-lg shadow-blue-900/20'
                    : index < step
                      ? 'border-green-200 bg-green-50 text-green-700'
                      : 'border-blue-100 bg-white text-slate-500'
                }`}
              >
                {index + 1}. {item}
              </button>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="rounded-[2.5rem] border border-blue-100 bg-white p-6 shadow-[0_22px_70px_rgba(15,23,42,0.10)] md:p-8">
              {step === 0 && (
                <div className="space-y-5">
                  <h2 className="text-2xl font-black text-[#071B4D]">1. Adres en gebouwbeeld</h2>
                  <label className="block">
                    <span className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                      Adres
                    </span>
                    <input
                      placeholder="Straat, nummer, gemeente"
                      value={address}
                      onChange={(event) => setAddress(event.target.value)}
                      className="w-full rounded-2xl border border-blue-100 bg-blue-50/30 px-4 py-4 text-sm font-bold text-[#071B4D] outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50"
                    />
                  </label>
                  <div className="overflow-hidden rounded-[2rem] border border-blue-100 bg-slate-100">
                    {streetViewUrl ? (
                      <img src={streetViewUrl} alt="Google Street View van het adres" className="h-[320px] w-full object-cover" />
                    ) : (
                      <div className="flex h-[320px] items-center justify-center px-6 text-center text-sm font-bold text-slate-500">
                        Vul een adres in om een Google Street View-preview van het gebouw te tonen.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {step === 1 && (
                <div className="space-y-5">
                  <h2 className="text-2xl font-black text-[#071B4D]">2. Basisgegevens</h2>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <label className="block">
                      <span className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-slate-500">Type woning</span>
                      <select value={propertyType} onChange={(event) => setPropertyType(event.target.value)} className="w-full rounded-2xl border border-blue-100 bg-blue-50/30 px-4 py-4 text-sm font-bold text-[#071B4D] outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50">
                        <option value="">Selecteer type woning</option>
                        {woningTypes.map((type) => <option key={type} value={type}>{type}</option>)}
                      </select>
                    </label>
                    <Field label="Woonoppervlakte" placeholder="Bijv. 145 m²" value={livingArea} onChange={setLivingArea} />
                    <Field label="Slaapkamers" placeholder="Bijv. 3" value={bedrooms} onChange={setBedrooms} />
                    <Field label="Badkamers" placeholder="Bijv. 2" value={bathrooms} onChange={setBathrooms} />
                    <Field label="EPC-label" placeholder="A, B, C..." value={epcLabel} onChange={setEpcLabel} />
                  </div>
                </div>
              )}

              {step === 2 && (
                <StepGrid title="3. Staat en bouw">
                  <SelectField label="Staat van de woning" value={woningStaat} onChange={setWoningStaat} options={['Instapklaar', 'Goed onderhouden', 'Te renoveren', 'Grondige renovatie nodig']} />
                  <Field label="Bouwjaar" placeholder="Bijv. 1985" value={buildYear} onChange={setBuildYear} />
                  <Field label="Renovatiejaar" placeholder="Bijv. 2015" value={renovationYear} onChange={setRenovationYear} />
                </StepGrid>
              )}

              {step === 3 && (
                <StepGrid title="4. Comfort en energie">
                  <SelectField label="Verwarmingstype" value={heatingType} onChange={setHeatingType} options={['Onbekend', 'Gas', 'Elektrisch', 'Warmtepomp', 'Stookolie']} />
                  <SelectField label="Zonnepanelen" value={solarPanels} onChange={setSolarPanels} options={['Onbekend', 'Ja', 'Nee']} />
                  <SelectField label="Dubbel glas" value={doubleGlass} onChange={setDoubleGlass} options={['Onbekend', 'Ja', 'Nee']} />
                  <SelectField label="Lift aanwezig" value={lift} onChange={setLift} options={['Niet van toepassing', 'Ja', 'Nee']} />
                </StepGrid>
              )}

              {step === 4 && (
                <StepGrid title="5. Buitenruimte en parking">
                  <Field label="Perceeloppervlakte" placeholder="Bijv. 500 m²" value={landArea} onChange={setLandArea} />
                  <SelectField label="Buitenruimte" value={buitenruimte} onChange={setBuitenruimte} options={['Geen', 'Balkon', 'Terras', 'Tuin']} />
                  <SelectField label="Parking" value={parking} onChange={setParking} options={['Geen', 'Parkeerplaats', 'Garage', 'Garagebox']} />
                </StepGrid>
              )}

              {step === 5 && (
                <div className="space-y-5">
                  <h2 className="text-2xl font-black text-[#071B4D]">6. Richtprijs</h2>
                  <Field label="Richtprijs / gewenste vraagprijs (optioneel)" placeholder="Bijv. € 425.000" value={expectedPrice} onChange={setExpectedPrice} />
                  <div className="rounded-[2rem] border border-blue-100 bg-blue-50/40 p-5">
                    <p className="text-sm font-bold text-slate-500">Voorlopige indicatie</p>
                    <p className="mt-1 text-4xl font-black text-blue-700">{formatEuro(estimatedValue)}</p>
                    <p className="mt-2 text-sm text-slate-600">Indicatieve simulatie op basis van de ingevulde woninggegevens. Geen financieel advies.</p>
                  </div>
                </div>
              )}

              {step === 6 && (
                <div className="space-y-5">
                  <h2 className="text-2xl font-black text-[#071B4D]">7. PDF-rapport</h2>
                  <div className="rounded-[2rem] border border-blue-100 bg-blue-50/40 p-5">
                    <p className="text-sm font-bold text-slate-500">Indicatieve waarde</p>
                    <p className="mt-1 text-4xl font-black text-blue-700">{formatEuro(estimatedValue)}</p>
                    <p className="mt-3 text-sm text-slate-600">Maak een compact rapport met adres, kenmerken, energiegegevens en de indicatieve waarde.</p>
                  </div>
                  <button type="button" onClick={handleDownloadPdf} className="w-full rounded-2xl bg-[#071B4D] px-5 py-4 text-sm font-black text-white shadow-lg shadow-blue-900/15 transition hover:-translate-y-0.5 hover:bg-[#0B2A6B]">
                    Download PDF-rapport
                  </button>
                </div>
              )}

              <div className="mt-8 flex flex-col gap-3 border-t border-blue-100 pt-6 sm:flex-row">
                <button type="button" onClick={handleReset} className="rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-black text-[#071B4D] transition hover:bg-slate-50 sm:w-40">
                  Wissen
                </button>
                <button type="button" onClick={previousStep} disabled={step === 0} className="rounded-2xl border border-blue-100 bg-blue-50 px-5 py-4 text-sm font-black text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-40 sm:w-40">
                  Vorige
                </button>
                <button type="button" onClick={nextStep} disabled={step === steps.length - 1} className="flex-1 rounded-2xl bg-blue-700 px-5 py-4 text-sm font-black text-white shadow-lg shadow-blue-900/15 transition hover:-translate-y-0.5 hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-40">
                  Volgende stap
                </button>
              </div>
            </div>

            <aside className="space-y-4">
              <div className="rounded-[2rem] border border-blue-100 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-700">Live samenvatting</p>
                <h2 className="mt-2 text-3xl font-black text-[#071B4D]">{formatEuro(estimatedValue)}</h2>
                <dl className="mt-5 space-y-3 text-sm">
                  <SummaryRow label="Adres" value={address || 'Niet opgegeven'} />
                  <SummaryRow label="Type" value={propertyType || 'Niet opgegeven'} />
                  <SummaryRow label="Oppervlakte" value={livingArea || 'Niet opgegeven'} />
                  <SummaryRow label="EPC" value={epcLabel || 'Niet opgegeven'} />
                  <SummaryRow label="Staat" value={woningStaat || 'Niet opgegeven'} />
                </dl>
              </div>

              <div className="rounded-[2rem] border border-blue-100 bg-blue-50/40 p-5 text-sm text-slate-700">
                <span className="font-semibold">ℹ️ Let op:</span> Deze indicatie is puur indicatief en gebaseerd op ingevulde gegevens en beschikbare marktinformatie. Dit is geen officiële taxatie.
              </div>
            </aside>
          </div>
        </div>
      </section>
    </main>
  )
}

type FieldProps = {
  label: string
  placeholder: string
  value: string
  onChange: (value: string) => void
}

function Field({ label, placeholder, value, onChange }: FieldProps) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-slate-500">{label}</span>
      <input
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-blue-100 bg-blue-50/30 px-4 py-4 text-sm font-bold text-[#071B4D] outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50"
      />
    </label>
  )
}

type SelectFieldProps = {
  label: string
  value: string
  options: string[]
  onChange: (value: string) => void
}

function SelectField({ label, value, options, onChange }: SelectFieldProps) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-slate-500">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-blue-100 bg-blue-50/30 px-4 py-4 text-sm font-bold text-[#071B4D] outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50"
      >
        <option value="">Selecteer</option>
        {options.map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
    </label>
  )
}

function StepGrid({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-5">
      <h2 className="text-2xl font-black text-[#071B4D]">{title}</h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">{children}</div>
    </div>
  )
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-blue-50 pb-3 last:border-b-0 last:pb-0">
      <dt className="font-bold text-slate-500">{label}</dt>
      <dd className="text-right font-black text-[#071B4D]">{value}</dd>
    </div>
  )
}
