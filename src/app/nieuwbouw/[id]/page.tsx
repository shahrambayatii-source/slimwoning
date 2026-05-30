'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

type ProjectDetail = {
  id: string
  projectnaam: string
  stad: string
  postcode: string
  aantal_units: number | null
  vanaf_prijs: string
  beschrijving: string
  afbeeldingen: string[]
  ontwikkelaar_naam?: string
  adres?: string
  type_project?: string
  oplevering?: string
  energieprestatie?: string
}

type ProjectUnit = {
  id: string
  project_id: string
  titel: string | null
  type_unit: string | null
  prijs: string | null
  slaapkamers: number | null
  badkamers: number | null
  oppervlakte: number | null
  status: string | null
  verdieping: string | null
  terras: boolean | null
  beschrijving: string | null
  afbeeldingen?: string[] | null
}

const fallbackImage =
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=1400&auto=format&fit=crop'

const fallbackProjects: ProjectDetail[] = [
  {
    id: 'fallback-parkzicht',
    projectnaam: 'Residentie Parkzicht',
    stad: 'Antwerpen',
    postcode: '2000',
    aantal_units: 18,
    vanaf_prijs: 'Vanaf € 349.000',
    beschrijving:
      'Residentie Parkzicht combineert moderne architectuur met energiezuinig wonen op een sterke stedelijke locatie.',
    afbeeldingen: [
      'https://images.unsplash.com/photo-1460317442991-0ec209397118?q=80&w=1400&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1494526585095-c41746248156?q=80&w=900&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?q=80&w=900&auto=format&fit=crop',
    ],
  },
  {
    id: 'fallback-zaventem',
    projectnaam: 'Nieuwbouw Zaventem',
    stad: 'Zaventem',
    postcode: '1930',
    aantal_units: 9,
    vanaf_prijs: 'Vanaf € 425.000',
    beschrijving:
      'Een kleinschalig nieuwbouwproject met comfortabele woningen, kwalitatieve afwerking en vlotte verbindingen.',
    afbeeldingen: [
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=1400&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=900&auto=format&fit=crop',
    ],
  },
  {
    id: 'fallback-groene-poort',
    projectnaam: 'Groene Poort',
    stad: 'Gent',
    postcode: '9000',
    aantal_units: 24,
    vanaf_prijs: 'Vanaf € 289.000',
    beschrijving:
      'Groene Poort is een gemengd project met veel aandacht voor licht, groen en duurzame woonkwaliteit.',
    afbeeldingen: [
      'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?q=80&w=1400&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?q=80&w=900&auto=format&fit=crop',
    ],
  },
]

export default function NieuwbouwDetailPage() {
  const params = useParams<{ id: string }>()
  const id = params.id
  const [project, setProject] = useState<ProjectDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [units, setUnits] = useState<ProjectUnit[]>([])

  useEffect(() => {
    const loadProject = async () => {
      const fallbackProject = fallbackProjects.find((item) => item.id === id)

      if (fallbackProject) {
        setProject(fallbackProject)
        setUnits([])
        setLoading(false)
        return
      }

      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )

      const { data, error } = await supabase
        .from('nieuwbouw_projecten')
        .select(`id, projectnaam, stad, postcode, aantal_units, vanaf_prijs, beschrijving, afbeeldingen, status, ontwikkelaar_naam, adres, type_project, oplevering, energieprestatie`)
        .eq('id', id)
        .eq('status', 'approved')
        .maybeSingle()

      const { data: unitData, error: unitsError } = await supabase
        .from('nieuwbouw_units')
        .select('*')
        .eq('project_id', id)
        .order('created_at', { ascending: true })

      if (unitsError) {
        console.error('Nieuwbouw units fetch error:', unitsError)
      }

      if (error) {
        console.error('Nieuwbouw detail fetch error:', error)
      }

      if (data) {
        setProject({
          id: String(data.id),
          projectnaam: String(data.projectnaam || 'Nieuwbouwproject'),
          stad: String(data.stad || ''),
          postcode: String(data.postcode || ''),
          aantal_units: data.aantal_units ? Number(data.aantal_units) : null,
          vanaf_prijs: String(data.vanaf_prijs || 'Prijs op aanvraag'),
          beschrijving: String(data.beschrijving || ''),
          afbeeldingen: Array.isArray(data.afbeeldingen) ? data.afbeeldingen : [],
          ontwikkelaar_naam: data.ontwikkelaar_naam || '',
          adres: data.adres || '',
          type_project: data.type_project || '',
          oplevering: data.oplevering || '',
          energieprestatie: data.energieprestatie || '',
        })
        setUnits(unitData || [])
      } else {
        setProject(null)
        setUnits([])
      }

      setLoading(false)
    }

    loadProject()
  }, [id])


  // Image gallery state
  const images = useMemo(() => {
    if (!project?.afbeeldingen?.length) return [fallbackImage]
    return project.afbeeldingen
  }, [project])
  const [mainImageIdx, setMainImageIdx] = useState(0)
  const mainImage = images[mainImageIdx] || fallbackImage

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f6f8fb] px-6 py-16 text-[#071B4D]">
        <div className="mx-auto max-w-[1200px] rounded-[2rem] border border-blue-100 bg-white p-10 text-center shadow-sm">
          <p className="text-sm font-black text-slate-500">Project laden...</p>
        </div>
      </main>
    )
  }

  if (!project) {
    return (
      <main className="min-h-screen bg-[#f6f8fb] px-6 py-16 text-[#071B4D]">
        <div className="mx-auto max-w-[760px] rounded-[2rem] border border-blue-100 bg-white p-10 text-center shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
          <h1 className="text-3xl font-black tracking-[-0.03em]">Project niet gevonden</h1>
          <p className="mt-3 text-sm font-semibold text-slate-500">
            Dit nieuwbouwproject is niet beschikbaar of nog niet goedgekeurd.
          </p>
          <Link
            href="/nieuwbouw"
            className="mt-7 inline-flex rounded-2xl bg-[#071B4D] px-6 py-4 text-sm font-black text-white transition hover:bg-[#0B2A6B]"
          >
            Terug naar nieuwbouw
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#f6f8fb] text-[#071B4D]">
      <section className="px-6 py-10 md:px-10 lg:px-16">
        <div className="mx-auto max-w-[1280px]">
          <Link
            href="/nieuwbouw"
            className="mb-6 inline-flex text-sm font-black text-blue-700 transition hover:text-[#071B4D]"
          >
            Terug naar projecten
          </Link>

          {/* Hero section with gallery */}
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_420px]">
            <div className="rounded-[2rem] border border-blue-100 bg-white p-4 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
              <div className="flex flex-col gap-4 lg:flex-row lg:gap-6">
                {/* Main image */}
                <div className="relative flex-1 overflow-hidden rounded-[1.5rem] bg-slate-100 aspect-[16/10] min-h-[260px] lg:min-h-[420px]">
                  <img
                    src={mainImage}
                    alt={project.projectnaam}
                    className="absolute inset-0 h-full w-full object-cover transition-all duration-200"
                  />
                </div>
                {/* Thumbnails */}
                <div className="flex gap-3 overflow-x-auto lg:w-[96px] lg:flex-col lg:items-center lg:justify-start lg:overflow-y-auto lg:overflow-x-hidden">
                  {images.map((img, idx) => (
                    <button
                      key={img + idx}
                      onClick={() => setMainImageIdx(idx)}
                      className={`overflow-hidden rounded-xl border-2 ${mainImageIdx === idx ? 'border-[#071B4D]' : 'border-transparent'} bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-200 transition`}
                      style={{ width: 80, height: 56 }}
                      aria-label={`Toon afbeelding ${idx + 1}`}
                    >
                      <img
                        src={img}
                        alt={`Thumbnail ${idx + 1}`}
                        className="object-cover w-full h-full"
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Info card */}
            <aside className="rounded-[2rem] border border-blue-100 bg-white p-7 shadow-[0_24px_80px_rgba(15,23,42,0.08)] flex flex-col gap-4">
              <span className="inline-flex rounded-full bg-blue-50 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-blue-700">
                Nieuwbouw
              </span>

              <h1 className="mt-2 text-4xl font-black tracking-[-0.04em]">
                {project.projectnaam}
              </h1>

              <p className="text-base font-bold text-slate-500">
                {project.postcode} {project.stad}
              </p>
              {project.adres && (
                <p className="text-sm font-semibold text-slate-400">{project.adres}</p>
              )}

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-3xl bg-blue-50 p-5">
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-blue-700">
                    Vanaf prijs
                  </p>
                  <p className="mt-2 text-xl font-black">{project.vanaf_prijs}</p>
                </div>
                <div className="rounded-3xl bg-slate-50 p-5">
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                    Units
                  </p>
                  <p className="mt-2 text-xl font-black">
                    {project.aantal_units ? `${project.aantal_units}` : 'Op aanvraag'}
                  </p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-3xl bg-slate-50 p-5">
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                    Type project
                  </p>
                  <p className="mt-2 text-base font-black">
                    {project.type_project || 'n.v.t.'}
                  </p>
                </div>
                <div className="rounded-3xl bg-slate-50 p-5">
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                    Oplevering
                  </p>
                  <p className="mt-2 text-base font-black">
                    {project.oplevering || 'n.v.t.'}
                  </p>
                </div>
                <div className="rounded-3xl bg-slate-50 p-5">
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                    Energieprestatie
                  </p>
                  <p className="mt-2 text-base font-black">
                    {project.energieprestatie || 'n.v.t.'}
                  </p>
                </div>
                <div className="rounded-3xl bg-slate-50 p-5">
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                    Ontwikkelaar
                  </p>
                  <p className="mt-2 text-base font-black">
                    {project.ontwikkelaar_naam || 'n.v.t.'}
                  </p>
                </div>
              </div>

              <div className="mt-7 flex flex-wrap gap-3">
                <a
                  href="#units"
                  className="flex-1 rounded-2xl bg-[#071B4D] px-6 py-4 text-center text-sm font-black text-white shadow-lg shadow-blue-900/15 transition hover:bg-[#0B2A6B]"
                >
                  Bekijk units
                </a>
                <button className="rounded-2xl border border-blue-100 bg-white px-6 py-4 text-sm font-black text-[#071B4D] transition hover:bg-blue-50">
                  Bewaar project
                </button>
              </div>
            </aside>
          </div>

          {/* Projectomschrijving & contact */}
          <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_420px]">
            <section className="rounded-[2rem] border border-blue-100 bg-white p-8 shadow-sm">
              <h2 className="text-2xl font-black tracking-[-0.03em]">Projectomschrijving</h2>
              <p className="mt-5 whitespace-pre-line text-base font-medium leading-8 text-slate-600">
                {project.beschrijving || 'Geen beschrijving beschikbaar.'}
              </p>
            </section>

            <section
              id="contact"
              className="rounded-[2rem] border border-blue-100 bg-gradient-to-br from-[#071B4D] to-[#0A2463] p-7 text-white shadow-[0_24px_80px_rgba(7,27,77,0.22)]"
            >
              <h2 className="text-2xl font-black tracking-[-0.03em]">Interesse?</h2>
              <p className="mt-4 text-sm font-semibold leading-7 text-blue-100">
                Neem contact op voor meer informatie over beschikbaarheid, plannen en prijzen.
              </p>
              <button className="mt-6 w-full rounded-2xl bg-white px-6 py-4 text-sm font-black text-[#071B4D] transition hover:bg-cyan-50">
                Contact opnemen
              </button>
            </section>
          </div>

          <section id="units" className="mt-10 scroll-mt-32">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.18em] text-blue-600">
                  Beschikbaarheid
                </p>
                <h2 className="mt-2 text-3xl font-black tracking-[-0.04em] text-[#071B4D]">
                  Beschikbare units
                </h2>
                <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-slate-500">
                  Bekijk de beschikbare units met prijs, oppervlakte, slaapkamers en status.
                </p>
              </div>

              {units.length > 0 && (
                <span className="rounded-full bg-white px-5 py-3 text-xs font-black uppercase tracking-[0.12em] text-blue-700 shadow-sm ring-1 ring-blue-100">
                  {units.length} unit{units.length === 1 ? '' : 's'}
                </span>
              )}
            </div>

            {units.length === 0 ? (
              <div className="mt-6 rounded-[2rem] border border-dashed border-blue-200 bg-white px-6 py-8 text-center shadow-sm">
                <p className="text-sm font-black text-[#071B4D]">
                  Nog geen units gepubliceerd.
                </p>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
                  Neem contact op voor actuele beschikbaarheid, plannen en prijzen.
                </p>
              </div>
            ) : (
              <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {units.map((unit) => {
                  const unitImage = Array.isArray(unit.afbeeldingen) && unit.afbeeldingen.length > 0
                    ? unit.afbeeldingen[0]
                    : images[0]

                  return (
                    <article
                      key={unit.id}
                      className="group overflow-hidden rounded-[2rem] border border-blue-100 bg-white shadow-[0_18px_55px_rgba(15,23,42,0.08)] transition hover:-translate-y-1 hover:shadow-[0_26px_70px_rgba(15,23,42,0.12)]"
                    >
                      <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
                        <img
                          src={unitImage || fallbackImage}
                          alt={unit.titel || 'Nieuwbouw unit'}
                          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                        />

                        <span className={`absolute left-4 top-4 rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] shadow-sm ${
                          unit.status === 'verkocht'
                            ? 'bg-red-50 text-red-600'
                            : unit.status === 'gereserveerd'
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-emerald-50 text-emerald-700'
                        }`}>
                          {unit.status || 'beschikbaar'}
                        </span>
                      </div>

                      <div className="p-5">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="text-xl font-black tracking-[-0.03em] text-[#071B4D]">
                              {unit.titel || 'Unit zonder titel'}
                            </h3>
                            <p className="mt-1 text-sm font-bold text-slate-500">
                              {[unit.type_unit, unit.verdieping].filter(Boolean).join(' · ') || 'Geen type ingevuld'}
                            </p>
                          </div>

                          <div className="rounded-2xl bg-blue-50 px-4 py-3 text-right">
                            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-blue-700">Prijs</p>
                            <p className="mt-1 text-base font-black text-[#071B4D]">{unit.prijs || 'Op aanvraag'}</p>
                          </div>
                        </div>

                        <div className="mt-5 grid grid-cols-2 gap-3">
                          <div className="rounded-2xl bg-[#f8fbff] px-4 py-3">
                            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">Oppervlakte</p>
                            <p className="mt-1 text-sm font-black text-[#071B4D]">{unit.oppervlakte ? `${unit.oppervlakte} m²` : 'n.v.t.'}</p>
                          </div>

                          <div className="rounded-2xl bg-[#f8fbff] px-4 py-3">
                            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">Slaapkamers</p>
                            <p className="mt-1 text-sm font-black text-[#071B4D]">{unit.slaapkamers ?? 0}</p>
                          </div>

                          <div className="rounded-2xl bg-[#f8fbff] px-4 py-3">
                            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">Badkamers</p>
                            <p className="mt-1 text-sm font-black text-[#071B4D]">{unit.badkamers ?? 0}</p>
                          </div>

                          <div className="rounded-2xl bg-[#f8fbff] px-4 py-3">
                            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">Terras</p>
                            <p className="mt-1 text-sm font-black text-[#071B4D]">{unit.terras ? 'Ja' : 'Nee'}</p>
                          </div>
                        </div>

                        {unit.beschrijving && (
                          <p className="mt-4 line-clamp-3 text-sm font-semibold leading-6 text-slate-500">
                            {unit.beschrijving}
                          </p>
                        )}

                        <a
                          href="#contact"
                          className="mt-5 inline-flex w-full justify-center rounded-2xl bg-[#071B4D] px-5 py-3 text-sm font-black text-white transition hover:bg-[#0B2A6B]"
                        >
                          Interesse in deze unit
                        </a>
                      </div>
                    </article>
                  )
                })}
              </div>
            )}
          </section>

          {/* Projectdetails section */}
          <div className="mt-10">
            <h2 className="text-2xl font-black tracking-[-0.03em] mb-6">Projectdetails</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
              <div className="rounded-2xl bg-blue-50 p-6 flex flex-col items-start">
                <span className="text-xs font-black uppercase tracking-[0.14em] text-blue-700 mb-2">Type project</span>
                <span className="text-lg font-black text-[#071B4D]">{project.type_project || 'n.v.t.'}</span>
              </div>
              <div className="rounded-2xl bg-blue-50 p-6 flex flex-col items-start">
                <span className="text-xs font-black uppercase tracking-[0.14em] text-blue-700 mb-2">Oplevering</span>
                <span className="text-lg font-black text-[#071B4D]">{project.oplevering || 'n.v.t.'}</span>
              </div>
              <div className="rounded-2xl bg-blue-50 p-6 flex flex-col items-start">
                <span className="text-xs font-black uppercase tracking-[0.14em] text-blue-700 mb-2">Energieprestatie</span>
                <span className="text-lg font-black text-[#071B4D]">{project.energieprestatie || 'n.v.t.'}</span>
              </div>
              <div className="rounded-2xl bg-blue-50 p-6 flex flex-col items-start">
                <span className="text-xs font-black uppercase tracking-[0.14em] text-blue-700 mb-2">Ontwikkelaar</span>
                <span className="text-lg font-black text-[#071B4D]">{project.ontwikkelaar_naam || 'n.v.t.'}</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
