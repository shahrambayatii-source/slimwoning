'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

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

type ProjectInfo = {
  id: string
  projectnaam: string
  stad: string
  postcode: string
  afbeeldingen: string[]
}

const fallbackImage =
  'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?q=80&w=1600&auto=format&fit=crop'

export default function NieuwbouwUnitsPage() {
  const params = useParams<{ id: string }>()
  const projectId = params.id

  const [loading, setLoading] = useState(true)
  const [project, setProject] = useState<ProjectInfo | null>(null)
  const [units, setUnits] = useState<ProjectUnit[]>([])
  const [lightboxImages, setLightboxImages] = useState<string[]>([])
  const [lightboxIndex, setLightboxIndex] = useState(0)

  const supabase = useMemo(
    () =>
      createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      ),
    []
  )

  useEffect(() => {
    async function loadData() {
      setLoading(true)

      const { data: projectData } = await supabase
        .from('nieuwbouw_projecten')
        .select('id, projectnaam, stad, postcode, afbeeldingen')
        .eq('id', projectId)
        .maybeSingle()

      const { data: unitsData, error } = await supabase
        .from('nieuwbouw_units')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Units fetch error:', error)
      }

      if (projectData) {
        setProject({
          id: String(projectData.id),
          projectnaam: String(projectData.projectnaam || 'Nieuwbouwproject'),
          stad: String(projectData.stad || ''),
          postcode: String(projectData.postcode || ''),
          afbeeldingen: Array.isArray(projectData.afbeeldingen) ? projectData.afbeeldingen : [],
        })
      }

      setUnits(unitsData || [])
      setLoading(false)
    }

    loadData()
  }, [projectId, supabase])

  function openLightbox(images: string[], index = 0) {
    if (images.length === 0) return
    setLightboxImages(images)
    setLightboxIndex(index)
  }

  function closeLightbox() {
    setLightboxImages([])
    setLightboxIndex(0)
  }

  function showPreviousImage() {
    setLightboxIndex((current) =>
      current === 0 ? lightboxImages.length - 1 : current - 1
    )
  }

  function showNextImage() {
    setLightboxIndex((current) =>
      current === lightboxImages.length - 1 ? 0 : current + 1
    )
  }

  return (
    <main className="min-h-screen bg-[#f4f7fb] pb-20">
      <section className="border-b border-blue-100 bg-white">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-4 px-6 py-6 lg:px-10">
          <div>
            <Link
              href={`/nieuwbouw/${projectId}`}
              className="text-sm font-black uppercase tracking-[0.14em] text-blue-600 transition hover:text-[#071B4D]"
            >
              ← Terug naar project
            </Link>

            <h1 className="mt-3 text-4xl font-black tracking-[-0.05em] text-[#071B4D]">
              {project?.projectnaam || 'Beschikbare units'}
            </h1>

            <p className="mt-3 text-sm font-semibold text-slate-500">
              {project?.postcode} {project?.stad}
            </p>
          </div>

          <div className="rounded-full bg-blue-50 px-5 py-3 text-xs font-black uppercase tracking-[0.14em] text-blue-700">
            {units.length} unit{units.length === 1 ? '' : 's'}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1400px] px-6 pt-10 lg:px-10">
        {loading ? (
          <div className="rounded-[2rem] border border-blue-100 bg-white px-8 py-14 text-center shadow-sm">
            <p className="text-lg font-black text-[#071B4D]">
              Units laden...
            </p>
          </div>
        ) : units.length === 0 ? (
          <div className="rounded-[2rem] border border-dashed border-blue-200 bg-white px-8 py-14 text-center shadow-sm">
            <p className="text-lg font-black text-[#071B4D]">
              Nog geen units beschikbaar.
            </p>

            <p className="mt-3 text-sm font-semibold leading-6 text-slate-500">
              Neem contact op voor actuele beschikbaarheid en prijzen.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {units.map((unit) => {
              const unitImage =
                Array.isArray(unit.afbeeldingen) && unit.afbeeldingen.length > 0
                  ? unit.afbeeldingen[0]
                  : project?.afbeeldingen?.[0] || fallbackImage

              const unitGallery =
                Array.isArray(unit.afbeeldingen) && unit.afbeeldingen.length > 0
                  ? unit.afbeeldingen
                  : project?.afbeeldingen?.length
                    ? project.afbeeldingen
                    : [fallbackImage]

              return (
                <article
                  key={unit.id}
                  className="group overflow-hidden rounded-[2rem] border border-blue-100 bg-white shadow-[0_18px_55px_rgba(15,23,42,0.08)] transition hover:-translate-y-1 hover:shadow-[0_26px_70px_rgba(15,23,42,0.12)]"
                >
                  <button
                    type="button"
                    onClick={() => openLightbox(unitGallery, 0)}
                    className="relative block aspect-[16/10] w-full overflow-hidden bg-slate-100 text-left"
                  >
                    <img
                      src={unitImage}
                      alt={unit.titel || 'Nieuwbouw unit'}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />

                    <span
                      className={`absolute left-4 top-4 rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] shadow-sm ${
                        unit.status === 'verkocht'
                          ? 'bg-red-50 text-red-600'
                          : unit.status === 'gereserveerd'
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-emerald-50 text-emerald-700'
                      }`}
                    >
                      {unit.status || 'beschikbaar'}
                    </span>
                    {unitGallery.length > 1 && (
                      <span className="absolute bottom-4 right-4 rounded-full bg-white/95 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-[#071B4D] shadow-sm backdrop-blur-sm">
                        {unitGallery.length} foto’s
                      </span>
                    )}
                  </button>

                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h2 className="text-2xl font-black tracking-[-0.04em] text-[#071B4D]">
                          {unit.titel || 'Unit zonder titel'}
                        </h2>

                        <p className="mt-2 text-sm font-bold text-slate-500">
                          {[unit.type_unit, unit.verdieping]
                            .filter(Boolean)
                            .join(' · ') || 'Geen type ingevuld'}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-blue-50 px-4 py-3 text-right">
                        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-blue-700">
                          Prijs
                        </p>
                        <p className="mt-1 text-lg font-black text-[#071B4D]">
                          {unit.prijs || 'Op aanvraag'}
                        </p>
                      </div>
                    </div>

                    <div className="mt-6 grid grid-cols-2 gap-3">
                      <div className="rounded-2xl bg-[#f8fbff] px-4 py-3">
                        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
                          Oppervlakte
                        </p>
                        <p className="mt-1 text-sm font-black text-[#071B4D]">
                          {unit.oppervlakte
                            ? `${unit.oppervlakte} m²`
                            : 'n.v.t.'}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-[#f8fbff] px-4 py-3">
                        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
                          Slaapkamers
                        </p>
                        <p className="mt-1 text-sm font-black text-[#071B4D]">
                          {unit.slaapkamers ?? 0}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-[#f8fbff] px-4 py-3">
                        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
                          Badkamers
                        </p>
                        <p className="mt-1 text-sm font-black text-[#071B4D]">
                          {unit.badkamers ?? 0}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-[#f8fbff] px-4 py-3">
                        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
                          Terras
                        </p>
                        <p className="mt-1 text-sm font-black text-[#071B4D]">
                          {unit.terras ? 'Ja' : 'Nee'}
                        </p>
                      </div>
                    </div>

                    {unit.beschrijving && (
                      <p className="mt-5 line-clamp-3 text-sm font-semibold leading-6 text-slate-500">
                        {unit.beschrijving}
                      </p>
                    )}

                    <a
                      href="#contact"
                      className="mt-6 inline-flex w-full justify-center rounded-2xl bg-[#071B4D] px-5 py-4 text-sm font-black text-white transition hover:bg-[#0B2A6B]"
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
      {lightboxImages.length > 0 && (
        <div className="fixed inset-0 z-[120] bg-slate-950/85 px-4 py-6 backdrop-blur-sm">
          <div className="mx-auto flex h-full max-w-[1200px] flex-col">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div className="rounded-full bg-white/10 px-4 py-2 text-sm font-black text-white">
                {lightboxIndex + 1}/{lightboxImages.length}
              </div>

              <button
                type="button"
                onClick={closeLightbox}
                className="rounded-full bg-white px-5 py-2 text-sm font-black text-[#071B4D] transition hover:bg-blue-50"
              >
                Sluiten
              </button>
            </div>

            <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded-[2rem] bg-white/5">
              <img
                src={lightboxImages[lightboxIndex]}
                alt={`Unit foto ${lightboxIndex + 1}`}
                className="max-h-full max-w-full rounded-[1.5rem] object-contain"
              />

              {lightboxImages.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={showPreviousImage}
                    className="absolute left-4 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-white text-2xl font-black text-[#071B4D] shadow-lg transition hover:bg-blue-50"
                  >
                    ‹
                  </button>

                  <button
                    type="button"
                    onClick={showNextImage}
                    className="absolute right-4 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-white text-2xl font-black text-[#071B4D] shadow-lg transition hover:bg-blue-50"
                  >
                    ›
                  </button>
                </>
              )}
            </div>

            {lightboxImages.length > 1 && (
              <div className="mt-4 flex gap-3 overflow-x-auto pb-2">
                {lightboxImages.map((image, index) => (
                  <button
                    key={`${image}-${index}`}
                    type="button"
                    onClick={() => setLightboxIndex(index)}
                    className={`h-20 w-28 shrink-0 overflow-hidden rounded-2xl border-2 bg-white/10 transition ${
                      index === lightboxIndex ? 'border-white' : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={image}
                      alt={`Thumbnail ${index + 1}`}
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  )
}