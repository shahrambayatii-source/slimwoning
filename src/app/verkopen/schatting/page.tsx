'use client'

import Link from 'next/link'
import { useRef, useState } from 'react'

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

export default function SchattingPage() {
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

  const handleReset = () => {
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

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/50">
      <section className="px-6 py-14 md:px-10 lg:px-16">
        <div className="mx-auto max-w-5xl">
          {/* Header */}
          <div className="mb-12 text-center">
            <Link
              href="/verkopen"
              className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-blue-700 transition hover:text-blue-900"
            >
              ← Terug naar schatting
            </Link>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-700">
              Uitgebreide indicatie
            </p>
            <h1 className="mt-3 text-4xl font-black tracking-[-0.035em] text-[#071B4D]">
              Gedetailleerde woninganalyse
            </h1>
            <p className="mt-4 max-w-2xl text-base text-slate-700">
              Vul zoveel mogelijk gegevens in voor een nauwkeurigere indicatieve inschatting op basis van woningdata en marktinformatie.
            </p>
          </div>

          {/* Form Card */}
          <div className="rounded-[2.5rem] border border-blue-100 bg-white p-6 shadow-[0_22px_70px_rgba(15,23,42,0.10)] md:p-8">
            <form className="grid grid-cols-1 gap-6">
              {/* Section 1: Basisgegevens */}
              <div>
                <h2 className="mb-4 text-lg font-black text-[#071B4D]">1. Basisgegevens</h2>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {/* Adres */}
                  <div className="md:col-span-2">
                    <label className="block">
                      <span className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                        Adres
                      </span>
                      <input
                        placeholder="Straat, nummer, gemeente"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="h-13 w-full rounded-2xl border border-blue-100 bg-blue-50/30 px-4 py-4 text-sm font-bold text-[#071B4D] outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50"
                      />
                    </label>
                  </div>

                  {/* Type woning */}
                  <label className="block">
                    <span className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                      Type woning
                    </span>
                    <div className="relative">
                      <select
                        value={propertyType}
                        onChange={(e) => setPropertyType(e.target.value)}
                        className="h-13 w-full appearance-none rounded-2xl border border-blue-100 bg-blue-50/30 px-4 py-4 pr-12 text-sm font-bold text-[#071B4D] outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50"
                      >
                        <option value="">Selecteer type woning</option>
                        {woningTypes.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                      <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-slate-400">
                        ▾
                      </span>
                    </div>
                  </label>

                  {/* Woonoppervlakte */}
                  <label className="block">
                    <span className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                      Woonoppervlakte
                    </span>
                    <input
                      placeholder="Bijv. 145 m²"
                      value={livingArea}
                      onChange={(e) => setLivingArea(e.target.value)}
                      className="h-13 w-full rounded-2xl border border-blue-100 bg-blue-50/30 px-4 py-4 text-sm font-bold text-[#071B4D] outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50"
                    />
                  </label>

                  {/* Slaapkamers */}
                  <label className="block">
                    <span className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                      Slaapkamers
                    </span>
                    <input
                      placeholder="Bijv. 3"
                      value={bedrooms}
                      onChange={(e) => setBedrooms(e.target.value)}
                      className="h-13 w-full rounded-2xl border border-blue-100 bg-blue-50/30 px-4 py-4 text-sm font-bold text-[#071B4D] outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50"
                    />
                  </label>

                  {/* Badkamers */}
                  <label className="block">
                    <span className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                      Badkamers
                    </span>
                    <input
                      placeholder="Bijv. 2"
                      value={bathrooms}
                      onChange={(e) => setBathrooms(e.target.value)}
                      className="h-13 w-full rounded-2xl border border-blue-100 bg-blue-50/30 px-4 py-4 text-sm font-bold text-[#071B4D] outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50"
                    />
                  </label>

                  {/* EPC-label */}
                  <label className="block">
                    <span className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                      EPC-label
                    </span>
                    <input
                      placeholder="A, B, C..."
                      value={epcLabel}
                      onChange={(e) => setEpcLabel(e.target.value)}
                      className="h-13 w-full rounded-2xl border border-blue-100 bg-blue-50/30 px-4 py-4 text-sm font-bold text-[#071B4D] outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50"
                    />
                  </label>
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-blue-100" />

              {/* Section 2: Staat en bouw */}
              <div>
                <h2 className="mb-4 text-lg font-black text-[#071B4D]">2. Staat en bouw</h2>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {/* Staat van de woning */}
                  <label className="block">
                    <span className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                      Staat van de woning
                    </span>
                    <div className="relative">
                      <select
                        value={woningStaat}
                        onChange={(e) => setWoningStaat(e.target.value)}
                        className="h-13 w-full appearance-none rounded-2xl border border-blue-100 bg-blue-50/30 px-4 py-4 pr-12 text-sm font-bold text-[#071B4D] outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50"
                      >
                        <option value="">Selecteer staat van de woning</option>
                        <option value="Instapklaar">Instapklaar</option>
                        <option value="Goed onderhouden">Goed onderhouden</option>
                        <option value="Te renoveren">Te renoveren</option>
                        <option value="Grondige renovatie nodig">Grondige renovatie nodig</option>
                      </select>
                      <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-slate-400">
                        ▾
                      </span>
                    </div>
                  </label>

                  {/* Bouwjaar */}
                  <label className="block">
                    <span className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                      Bouwjaar
                    </span>
                    <input
                      placeholder="Bijv. 1985"
                      value={buildYear}
                      onChange={(e) => setBuildYear(e.target.value)}
                      className="h-13 w-full rounded-2xl border border-blue-100 bg-blue-50/30 px-4 py-4 text-sm font-bold text-[#071B4D] outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50"
                    />
                  </label>

                  {/* Renovatiejaar */}
                  <label className="block">
                    <span className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                      Renovatiejaar
                    </span>
                    <input
                      placeholder="Bijv. 2015"
                      value={renovationYear}
                      onChange={(e) => setRenovationYear(e.target.value)}
                      className="h-13 w-full rounded-2xl border border-blue-100 bg-blue-50/30 px-4 py-4 text-sm font-bold text-[#071B4D] outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50"
                    />
                  </label>
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-blue-100" />

              {/* Section 3: Comfort en energie */}
              <div>
                <h2 className="mb-4 text-lg font-black text-[#071B4D]">3. Comfort en energie</h2>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {/* Verwarmingstype */}
                  <label className="block">
                    <span className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                      Verwarmingstype
                    </span>
                    <div className="relative">
                      <select
                        value={heatingType}
                        onChange={(e) => setHeatingType(e.target.value)}
                        className="h-13 w-full appearance-none rounded-2xl border border-blue-100 bg-blue-50/30 px-4 py-4 pr-12 text-sm font-bold text-[#071B4D] outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50"
                      >
                        <option value="">Selecteer verwarmingstype</option>
                        <option value="Onbekend">Onbekend</option>
                        <option value="Gas">Gas</option>
                        <option value="Elektrisch">Elektrisch</option>
                        <option value="Warmtepomp">Warmtepomp</option>
                        <option value="Stookolie">Stookolie</option>
                      </select>
                      <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-slate-400">
                        ▾
                      </span>
                    </div>
                  </label>

                  {/* Zonnepanelen */}
                  <label className="block">
                    <span className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                      Zonnepanelen
                    </span>
                    <div className="relative">
                      <select
                        value={solarPanels}
                        onChange={(e) => setSolarPanels(e.target.value)}
                        className="h-13 w-full appearance-none rounded-2xl border border-blue-100 bg-blue-50/30 px-4 py-4 pr-12 text-sm font-bold text-[#071B4D] outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50"
                      >
                        <option value="">Selecteer</option>
                        <option value="Onbekend">Onbekend</option>
                        <option value="Ja">Ja</option>
                        <option value="Nee">Nee</option>
                      </select>
                      <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-slate-400">
                        ▾
                      </span>
                    </div>
                  </label>

                  {/* Dubbel glas */}
                  <label className="block">
                    <span className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                      Dubbel glas
                    </span>
                    <div className="relative">
                      <select
                        value={doubleGlass}
                        onChange={(e) => setDoubleGlass(e.target.value)}
                        className="h-13 w-full appearance-none rounded-2xl border border-blue-100 bg-blue-50/30 px-4 py-4 pr-12 text-sm font-bold text-[#071B4D] outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50"
                      >
                        <option value="">Selecteer</option>
                        <option value="Onbekend">Onbekend</option>
                        <option value="Ja">Ja</option>
                        <option value="Nee">Nee</option>
                      </select>
                      <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-slate-400">
                        ▾
                      </span>
                    </div>
                  </label>

                  {/* Lift aanwezig */}
                  <label className="block">
                    <span className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                      Lift aanwezig
                    </span>
                    <div className="relative">
                      <select
                        value={lift}
                        onChange={(e) => setLift(e.target.value)}
                        className="h-13 w-full appearance-none rounded-2xl border border-blue-100 bg-blue-50/30 px-4 py-4 pr-12 text-sm font-bold text-[#071B4D] outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50"
                      >
                        <option value="">Selecteer</option>
                        <option value="Niet van toepassing">Niet van toepassing</option>
                        <option value="Ja">Ja</option>
                        <option value="Nee">Nee</option>
                      </select>
                      <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-slate-400">
                        ▾
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-blue-100" />

              {/* Section 4: Buitenruimte en parking */}
              <div>
                <h2 className="mb-4 text-lg font-black text-[#071B4D]">4. Buitenruimte en parking</h2>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {/* Perceeloppervlakte */}
                  <label className="block">
                    <span className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                      Perceeloppervlakte
                    </span>
                    <input
                      placeholder="Bijv. 500 m²"
                      value={landArea}
                      onChange={(e) => setLandArea(e.target.value)}
                      className="h-13 w-full rounded-2xl border border-blue-100 bg-blue-50/30 px-4 py-4 text-sm font-bold text-[#071B4D] outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50"
                    />
                  </label>

                  {/* Buitenruimte */}
                  <label className="block">
                    <span className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                      Buitenruimte
                    </span>
                    <div className="relative">
                      <select
                        value={buitenruimte}
                        onChange={(e) => setBuitenruimte(e.target.value)}
                        className="h-13 w-full appearance-none rounded-2xl border border-blue-100 bg-blue-50/30 px-4 py-4 pr-12 text-sm font-bold text-[#071B4D] outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50"
                      >
                        <option value="">Selecteer buitenruimte</option>
                        <option value="Geen">Geen</option>
                        <option value="Balkon">Balkon</option>
                        <option value="Terras">Terras</option>
                        <option value="Tuin">Tuin</option>
                      </select>
                      <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-slate-400">
                        ▾
                      </span>
                    </div>
                  </label>

                  {/* Parking */}
                  <label className="block">
                    <span className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                      Parking
                    </span>
                    <div className="relative">
                      <select
                        value={parking}
                        onChange={(e) => setParking(e.target.value)}
                        className="h-13 w-full appearance-none rounded-2xl border border-blue-100 bg-blue-50/30 px-4 py-4 pr-12 text-sm font-bold text-[#071B4D] outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50"
                      >
                        <option value="">Selecteer parkingtype</option>
                        <option value="Geen">Geen</option>
                        <option value="Parkeerplaats">Parkeerplaats</option>
                        <option value="Garage">Garage</option>
                        <option value="Garagebox">Garagebox</option>
                      </select>
                      <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-slate-400">
                        ▾
                      </span>
                    </div>
                  </label>

                  {/* Richtprijs - Optional */}
                  <label className="block md:col-span-2">
                    <span className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                      Richtprijs / gewenste vraagprijs (optioneel)
                    </span>
                    <input
                      placeholder="Bijv. € 425.000"
                      value={expectedPrice}
                      onChange={(e) => setExpectedPrice(e.target.value)}
                      className="h-13 w-full rounded-2xl border border-blue-100 bg-blue-50/30 px-4 py-4 text-sm font-bold text-[#071B4D] outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50"
                    />
                  </label>
                </div>
              </div>

              {/* Buttons */}
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={handleReset}
                  className="flex-1 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-black text-[#071B4D] shadow-lg shadow-blue-900/10 transition hover:-translate-y-0.5 hover:bg-slate-50"
                >
                  Wissen
                </button>
                <button
                  type="button"
                  className="flex-1 rounded-2xl bg-[#071B4D] px-5 py-4 text-sm font-black text-white shadow-lg shadow-blue-900/15 transition hover:-translate-y-0.5 hover:bg-[#0B2A6B]"
                >
                  Bereken uitgebreide indicatie
                </button>
              </div>
            </form>

            {/* Info note */}
            <div className="mt-8 rounded-2xl border border-blue-100 bg-blue-50/30 p-4">
              <p className="text-sm text-slate-700">
                <span className="font-semibold">ℹ️ Let op:</span> Deze indicatie is puur indicatief en gebaseerd op de ingevulde woninggegevens en beschikbare marktinformatie. Dit is geen officiële taxatie.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
