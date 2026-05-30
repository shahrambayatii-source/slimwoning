'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'

const fallbackProjects = [
  {
    id: 'fallback-parkzicht',
    title: 'Residentie Parkzicht',
    city: 'Antwerpen',
    postalCode: '2000',
    type: 'Appartementen',
    units: '18 units',
    delivery: 'Oplevering 2026',
    price: 'Vanaf € 349.000',
    priceValue: 349000,
    energy: 'E-peil < 30',
    image:
'https://images.unsplash.com/photo-1460317442991-0ec209397118?q=80&w=1200&auto=format&fit=crop',
  },
  {
    id: 'fallback-zaventem',
    title: 'Nieuwbouw Zaventem',
    city: 'Zaventem',
    postalCode: '1930',
    type: 'Woningen',
    units: '9 units',
    delivery: 'Oplevering 2025',
    price: 'Vanaf € 425.000',
    priceValue: 425000,
    energy: 'BEN-woning',
    image:
'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=1200&auto=format&fit=crop',
  },
  {
    id: 'fallback-groene-poort',
    title: 'Groene Poort',
    city: 'Gent',
    postalCode: '9000',
    type: 'Gemengd project',
    units: '24 units',
    delivery: 'Oplevering 2027',
    price: 'Vanaf € 289.000',
    priceValue: 289000,
    energy: 'Energiezuinig',
    image:
'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?q=80&w=1200&auto=format&fit=crop',
  },
]

const benefits = [
  'Energiezuinige woningen met moderne technieken',
  'Nieuwe projecten op sterke locaties in België',
  'Duidelijke prijsinformatie en projectdetails',
  'Interessant voor eigen bewoning of investering',
]

const propertyTypes = ['Alle types', 'Appartementen', 'Woningen', 'Gemengd project']
const budgets = ['Elk budget', 'Tot € 300.000', 'Tot € 400.000', 'Tot € 500.000']

type NieuwbouwProject = {
  id: string
  title: string
  city: string
  postalCode: string
  type: string
  units: string
  delivery: string
  price: string
  priceValue: number
  energy: string
  image: string
}

export default function NieuwbouwPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState(propertyTypes[0])
  const [selectedBudget, setSelectedBudget] = useState(budgets[0])
  const [submittedProjects, setSubmittedProjects] = useState<NieuwbouwProject[]>([])

  useEffect(() => {
    const loadSubmittedProjects = async () => {
      const supabase = createClient(
process.env.NEXT_PUBLIC_SUPABASE_URL!,
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )

      const { data, error } = await supabase
        .from('nieuwbouw_projecten')
        .select('id, projectnaam, stad, postcode, aantal_units, vanaf_prijs, beschrijving, afbeeldingen, created_at, status, type_project, oplevering, energieprestatie, adres, ontwikkelaar_naam')
        .eq('status', 'approved')
        .order('created_at', { ascending: false })

if (error) {
        console.error('Nieuwbouw projects fetch error:', error)
        return
      }

      const mappedProjects: NieuwbouwProject[] = (data || []).map((project) => {
        const priceText = String(project.vanaf_prijs || 'Prijs op aanvraag')
        const priceValue = Number(priceText.replace(/[^0-9]/g, '')) || 0
        const images = Array.isArray(project.afbeeldingen) ? project.afbeeldingen : []

        return {
          id: String(project.id),
          title: String(project.projectnaam || 'Nieuwbouwproject'),
          city: String(project.stad || ''),
          postalCode: String(project.postcode || ''),
          type: String(project.type_project || 'Appartementen'),
          units: project.aantal_units ? `${project.aantal_units} units` : 'Units op aanvraag',
          delivery: String(project.oplevering || 'Nieuw aangemeld project'),
          price: priceText.toLowerCase().startsWith('vanaf') ? priceText : `Vanaf ${priceText}`,
          priceValue,
          energy: String(project.energieprestatie || 'Energiezuinig'),
          image:
images[0] ||
            'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=1200&auto=format&fit=crop',
        }
      })

      setSubmittedProjects(mappedProjects)
    }

    loadSubmittedProjects()
  }, [])

  const allProjects = useMemo(
() => [...submittedProjects, ...fallbackProjects],
[submittedProjects]
)

  const filteredProjects = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()
    const normalizedDigits = normalizedSearch.replace(/\D/g, '')

    return allProjects.filter((project) => {
      const searchableText = [
        project.title,
        project.city,
        project.postalCode,
        project.type,
        project.units,
        project.delivery,
        project.energy,
      ]
.join(' ')
.toLowerCase()

      const matchesSearch =
        !normalizedSearch ||
        searchableText.includes(normalizedSearch) ||
Boolean(normalizedDigits && project.postalCode.includes(normalizedDigits))

      const matchesType = selectedType === 'Alle types' || project.type === selectedType

      const budgetLimit =
        selectedBudget === 'Tot € 300.000'
? 300000
          :         selectedBudget === 'Tot € 400.000'
? 400000
            :         selectedBudget === 'Tot € 500.000'
? 500000
              :         Infinity

      const matchesBudget = project.priceValue <= budgetLimit

      return matchesSearch && matchesType && matchesBudget
    })
  }, [allProjects, searchTerm, selectedType, selectedBudget])

  const resetFilters = () => {
    setSearchTerm('')
    setSelectedType(propertyTypes[0])
    setSelectedBudget(budgets[0])
  }

  return (
    <main className="min-h-screen bg-[#f6f8fb] text-[#071B4D]">
      <section className="relative overflow-hidden border-b border-blue-100 bg-gradient-to-r from-[#071B4D] via-[#0A2463] to-[#071B4D] px-6 pb-20 pt-10 text-white md:px-10 lg:px-16">
        <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_20%_20%,rgba(103,232,249,0.35),transparent_28%),radial-gradient(circle_at_80%_10%,rgba(59,130,246,0.3),transparent_24%)]" />

        <div className="relative mx-auto grid max-w-[1400px] gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
<div>
          <span className="inline-flex rounded-full border border-white/10 bg-white/10 px-4 py-1 text-sm font-semibold backdrop-blur-sm">
            Nieuwbouwprojecten
          </span>

          <h1 className="mt-6 max-w-4xl text-5xl font-black leading-[1.04] tracking-[-0.04em] md:text-6xl">
            Ontdek moderne nieuwbouwprojecten in België
          </h1>

          <p className="mt-6 max-w-2xl text-lg font-medium leading-8 text-blue-100">
            Bekijk nieuwbouw appartementen, woningen en investeringsprojecten met moderne architectuur,
energiezuinige technieken en toplocaties.
          </p>

          <div className="mt-9 flex flex-wrap gap-4">
            <a
href="#projecten"
className="rounded-2xl bg-white px-6 py-4 text-sm font-black text-[#071B4D] shadow-xl shadow-black/20 transition hover:-translate-y-0.5 hover:bg-cyan-50"
>
              Bekijk projecten
            </a>

            <Link
href="/nieuwbouw/aanmelden"
className="rounded-2xl border border-white/20 bg-white/10 px-6 py-4 text-sm font-black text-white backdrop-blur-sm transition hover:bg-white/20"
>
              Project aanmelden
            </Link>
</div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/10 p-5 shadow-[0_24px_90px_rgba(0,0,0,0.25)] backdrop-blur-md">
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                [`${allProjects.length}+`, 'Projecten beschikbaar'],
                ['A/A+', 'Focus op energieprestatie'],
                ['3', 'Populaire regio’s'],
                ['2025', 'Nieuwe opleveringen'],
              ].map(([value, label]) => (
                <div key={label} className="rounded-3xl bg-white/95 p-5 text-[#071B4D]">
                  <p className="text-3xl font-black">{value}</p>
                  <p className="mt-2 text-sm font-bold text-slate-500">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 py-10 md:px-10 lg:px-16">
        <div className="mx-auto max-w-[1400px] rounded-[2rem] border border-blue-100 bg-white p-4 shadow-[0_18px_55px_rgba(15,23,42,0.08)] md:p-5">
            <form
            onSubmit={(event) => {
              event.preventDefault()
              document.getElementById('projecten')?.scrollIntoView({ behavior: 'smooth' })
            }}
className="grid gap-3 md:grid-cols-[1fr_auto_auto_auto]"
>
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Zoek op stad, project of postcode"
                className="h-14 rounded-2xl border border-blue-100 bg-blue-50/40 px-5 text-sm font-bold text-[#071B4D] outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50"
              />

              <select
value={selectedType}
onChange={(event) => setSelectedType(event.target.value)}
className="h-14 appearance-none rounded-2xl border border-blue-100 bg-white px-5 text-sm font-black text-[#071B4D] outline-none transition hover:bg-blue-50 focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
>
                {propertyTypes.map((type) => (
<option key={type} value={type}>
                  {type === 'Alle types' ? 'Type woning' : type}
</option>
              ))}
              </select>

              <select
value={selectedBudget}
onChange={(event) => setSelectedBudget(event.target.value)}
className="h-14 appearance-none rounded-2xl border border-blue-100 bg-white px-5 text-sm font-black text-[#071B4D] outline-none transition hover:bg-blue-50 focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
>
                {budgets.map((budget) => (
<option key={budget} value={budget}>
                  {budget === 'Elk budget' ? 'Budget' : budget}
</option>
              ))}
              </select>

            <button
              type="submit"
              className="inline-flex h-14 items-center justify-center rounded-2xl bg-[#071B4D] px-7 text-sm font-black text-white shadow-lg shadow-blue-900/15 transition hover:-translate-y-0.5 hover:bg-[#0B2A6B]"
            >
              Zoeken
            </button>
          </form>
        </div>
      </section>

      <section id="projecten" className="px-6 pb-16 md:px-10 lg:px-16">
        <div className="mx-auto max-w-[1400px]">
          <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.2em] text-blue-700">
                Nieuw aanbod
              </p>

              <h2 className="mt-3 text-4xl font-black tracking-[-0.03em] text-[#071B4D]">
                Populaire nieuwbouwprojecten
              </h2>
              <p className="mt-2 text-sm font-bold text-slate-500">
                {filteredProjects.length} projecten gevonden
                {submittedProjects.length > 0 ? ` · ${submittedProjects.length} nieuw aangemeld` : ''}
              </p>
            </div>

            <button
              type="button"
              onClick={resetFilters}
              className="w-fit rounded-2xl border border-blue-100 bg-white px-5 py-3 text-sm font-bold text-[#071B4D] shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg"
            >
              Alle projecten
            </button>
          </div>

{filteredProjects.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {filteredProjects.map((project) => (
<article
                  key={`${project.title}-${project.postalCode}-${project.price}`}
                  className="overflow-hidden rounded-[2rem] border border-blue-100 bg-white shadow-[0_18px_60px_rgba(15,23,42,0.08)] transition hover:-translate-y-1 hover:shadow-[0_24px_80px_rgba(15,23,42,0.12)]"
                >
                  <div className="relative h-[260px] overflow-hidden">
                    <img
                      src={project.image}
                      alt={project.title}
                      className="h-full w-full object-cover transition duration-500 hover:scale-105"
                    />

                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />

                    <span className="absolute left-5 top-5 rounded-full bg-white/90 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-[#071B4D] backdrop-blur-sm">
                      Nieuwbouw
                    </span>

                    <button className="absolute right-5 top-5 grid h-11 w-11 place-items-center rounded-full bg-white/90 text-2xl text-[#071B4D] backdrop-blur-sm transition hover:bg-white">
                      ♡
                    </button>
                  </div>

                  <div className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-2xl font-black text-[#071B4D]">
                          {project.title}
                        </h3>

                        <p className="mt-2 text-sm font-semibold text-slate-500">
                          {project.postalCode} {project.city}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-blue-50 px-4 py-3 text-right">
                        <p className="text-xs font-black uppercase tracking-[0.14em] text-blue-700">
                          Vanaf
                        </p>

                        <p className="mt-1 text-sm font-black text-[#071B4D]">
                          {project.price.replace('Vanaf ', '')}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 grid grid-cols-3 gap-2 text-center text-xs font-black text-[#071B4D]">
                      <div className="rounded-2xl bg-slate-50 px-3 py-3">{project.type}</div>
                      <div className="rounded-2xl bg-slate-50 px-3 py-3">{project.units}</div>
                      <div className="rounded-2xl bg-slate-50 px-3 py-3">{project.energy}</div>
                    </div>

                    <p className="mt-4 text-sm font-semibold text-slate-500">
                      {project.delivery}
                    </p>

                    <div className="mt-6 flex items-center gap-3">
              <Link
                                href={`/nieuwbouw/${project.id}`}
                className="flex-1 rounded-2xl bg-[#071B4D] px-5 py-4 text-center text-sm font-black text-white transition hover:bg-[#0B2A6B]"
                      >
                        Bekijk project
                      </Link>

                      <button className="rounded-2xl border border-blue-100 bg-white px-5 py-4 text-sm font-black text-[#071B4D] transition hover:bg-blue-50">
                        Info
                      </button>
</div>
                  </div>
</article>
              ))}
            </div>
          ) : (
            <div className="rounded-[2rem] border border-blue-100 bg-white p-10 text-center shadow-sm">
              <h3 className="text-2xl font-black text-[#071B4D]">Geen projecten gevonden</h3>
              <p className="mt-3 text-sm font-semibold text-slate-500">
                Pas je zoekopdracht of filters aan om opnieuw te zoeken.
              </p>
              <button
                type="button"
                onClick={resetFilters}
                className="mt-6 rounded-2xl bg-[#071B4D] px-6 py-4 text-sm font-black text-white transition hover:bg-[#0B2A6B]"
              >
                Filters wissen
              </button>
            </div>
          )}
        </div>
      </section>

      <section className="px-6 pb-16 md:px-10 lg:px-16">
        <div className="mx-auto grid max-w-[1400px] gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[2rem] border border-blue-100 bg-white p-7 shadow-sm">
            <p className="text-sm font-black uppercase tracking-[0.2em] text-blue-700">
              Waarom nieuwbouw?
            </p>

            <h2 className="mt-3 text-3xl font-black tracking-[-0.03em] text-[#071B4D]">
              Comfort, energie en zekerheid
            </h2>

            <div className="mt-6 space-y-4">
              {benefits.map((benefit) => (
                <div key={benefit} className="flex gap-3 rounded-2xl bg-blue-50/60 p-4 text-sm font-bold text-slate-700">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#071B4D] text-xs text-white">
                    ✓
                  </span>
                  {benefit}
                </div>
))}
            </div>
          </div>

          <div
            id="project-aanmelden"
            className="rounded-[2rem] border border-blue-100 bg-gradient-to-br from-[#071B4D] to-[#0A2463] p-7 text-white shadow-[0_24px_80px_rgba(7,27,77,0.22)]"
          >
            <p className="text-sm font-black uppercase tracking-[0.2em] text-cyan-200">
              Voor ontwikkelaars
            </p>

            <h2 className="mt-3 text-3xl font-black tracking-[-0.03em]">
              Nieuwbouwproject aanbieden?
            </h2>

            <p className="mt-4 max-w-2xl text-sm font-semibold leading-7 text-blue-100">
              Zet je project zichtbaar op SlimWoning en bereik kopers die actief zoeken naar nieuwbouw,
              energiezuinige woningen en investeringsopportuniteiten.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/nieuwbouw/aanmelden"
                className="rounded-2xl bg-white px-6 py-4 text-sm font-black text-[#071B4D] transition hover:bg-cyan-50"
              >
                Project aanmelden
              </Link>
            
              <button className="rounded-2xl border border-white/20 px-6 py-4 text-sm font-black text-white transition hover:bg-white/10">
                Meer informatie
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}