'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

type PendingProject = {
  id: string
  projectnaam: string
  stad: string
  postcode: string
  vanaf_prijs: string
  aantal_units: number
  beschrijving: string
  afbeeldingen: string[]
  status: string
  type_project?: string | null
  oplevering?: string | null
  energieprestatie?: string | null
  adres?: string | null
  ontwikkelaar_naam?: string | null
  contactpersoon?: string | null
  email?: string | null
  telefoonnummer?: string | null
}

export default function DashboardNieuwbouwPage() {
  const [projects, setProjects] = useState<PendingProject[]>([])
  const [loading, setLoading] = useState(true)
  const [rejectProjectId, setRejectProjectId] = useState<string | null>(null)
  const [rejectNote, setRejectNote] = useState('')
  const [selectedProject, setSelectedProject] = useState<PendingProject | null>(null)
  const [lightboxImage, setLightboxImage] = useState<string | null>(null)
  const [deleteProjectId, setDeleteProjectId] = useState<string | null>(null)

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    loadProjects()
  }, [])

  async function loadProjects() {
    setLoading(true)

    const { data, error } = await supabase
      .from('nieuwbouw_projecten')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Dashboard nieuwbouw fetch error:', error)
      setLoading(false)
      return
    }

    setProjects(data || [])
    setLoading(false)
  }

  async function approveProject(id: string) {
    const { error } = await supabase
      .from('nieuwbouw_projecten')
      .update({ status: 'approved' })
      .eq('id', id)

    if (error) {
      console.error('Nieuwbouw approve error:', error)
      alert('Approve mislukt. Controleer RLS/policies in Supabase.')
      return
    }

    setSelectedProject(null)
    setLightboxImage(null)
    setProjects((current) => current.filter((project) => project.id !== id))
  }

  function openRejectModal(id: string) {
    setRejectProjectId(id)
    setRejectNote('')
  }

  function closeRejectModal() {
    setRejectProjectId(null)
    setRejectNote('')
  }

  async function submitRejectReason() {
    if (!rejectProjectId || !rejectNote.trim()) return

    const { error } = await supabase
      .from('nieuwbouw_projecten')
      .update({
        status: 'revision_requested',
        moderation_note: rejectNote.trim(),
      })
      .eq('id', rejectProjectId)

    if (error) {
      console.error('Nieuwbouw reject error:', error)
      alert('Aanpassing vragen mislukt. Controleer RLS/policies in Supabase.')
      return
    }

    const rejectedId = rejectProjectId
    closeRejectModal()
    setSelectedProject(null)
    setProjects((current) => current.filter((project) => project.id !== rejectedId))
  }

  async function deleteProject(id: string) {
    const { error } = await supabase
      .from('nieuwbouw_projecten')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Nieuwbouw delete error:', error)
      alert('Verwijderen mislukt. Controleer RLS/policies in Supabase.')
      return
    }

    setDeleteProjectId(null)
    setSelectedProject(null)
    setLightboxImage(null)
    setProjects((current) => current.filter((project) => project.id !== id))
  }

  return (
    <main className="min-h-screen bg-[#f6f8fb] px-6 py-10 text-[#071B4D] md:px-10 lg:px-16">
      <div className="mx-auto max-w-[1400px]">
        <div className="mb-10 flex items-center justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-blue-600">
              Admin dashboard
            </p>

            <h1 className="mt-3 text-5xl font-black tracking-[-0.04em] text-[#071B4D]">
              Nieuwbouw moderatie
            </h1>
          </div>

          <div className="rounded-3xl border border-blue-100 bg-white px-6 py-4 shadow-sm">
            <p className="text-sm font-bold text-slate-500">
              {projects.length} pending projecten
            </p>
          </div>
        </div>

        {loading ? (
          <div className="rounded-[2rem] border border-blue-100 bg-white p-10 text-center text-lg font-bold text-slate-500">
            Projecten laden...
          </div>
        ) : projects.length === 0 ? (
          <div className="rounded-[2rem] border border-blue-100 bg-white p-10 text-center text-lg font-bold text-slate-500">
            Geen pending projecten gevonden.
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-2 xl:grid-cols-3">
            {projects.map((project) => (
              <article
                key={project.id}
                className="flex h-full flex-col overflow-hidden rounded-[2rem] border border-blue-100 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.06)]"
              >
                <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
                  <img
                    src={
                      project.afbeeldingen?.[0] ||
                      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=1200&auto=format&fit=crop'
                    }
                    alt={project.projectnaam}
                    className="h-full w-full object-cover"
                  />

                  <div className="absolute left-4 top-4 rounded-full bg-white/90 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-[#071B4D] backdrop-blur-md">
                    {project.status}
                  </div>
                </div>

                <div className="flex flex-1 flex-col p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-3xl font-black text-[#071B4D]">
                        {project.projectnaam}
                      </h2>

                      <p className="mt-2 text-sm font-bold text-slate-500">
                        {project.postcode} {project.stad}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-[#f4f7fb] px-4 py-3 text-right">
                      <p className="text-[11px] font-black uppercase tracking-[0.16em] text-blue-700">
                        Vanaf
                      </p>

                      <p className="mt-1 text-xl font-black text-[#071B4D]">
                        {project.vanaf_prijs}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-3">
                    <div className="rounded-full bg-[#f7f9fc] px-4 py-3 text-sm font-black text-[#071B4D]">
                      {project.aantal_units} units
                    </div>

                    <div className="rounded-full bg-[#f7f9fc] px-4 py-3 text-sm font-black text-[#071B4D]">
                      Nieuwbouw
                    </div>
                  </div>

                  <p className="mt-6 line-clamp-4 text-sm font-semibold leading-7 text-slate-600">
                    {project.beschrijving}
                  </p>

                  <div className="mt-auto pt-8">
                    <button
                      type="button"
                      onClick={() => setSelectedProject(project)}
                      className="mb-3 w-full rounded-2xl border border-blue-100 bg-white px-5 py-4 text-sm font-black text-[#071B4D] transition hover:bg-blue-50"
                    >
                      Bekijk aanvraag
                    </button>

                    <div className="grid grid-cols-3 gap-3">
                      <button
                        type="button"
                        onClick={() => approveProject(project.id)}
                        className="rounded-2xl bg-emerald-500 px-4 py-4 text-sm font-black text-white transition hover:bg-emerald-600"
                      >
                        Approve
                      </button>

                      <button
                        type="button"
                        onClick={() => openRejectModal(project.id)}
                        className="rounded-2xl bg-amber-400 px-4 py-4 text-sm font-black text-[#071B4D] transition hover:bg-amber-500"
                      >
                        Reject
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeleteProjectId(project.id)}
                        className="rounded-2xl bg-red-500 px-4 py-4 text-sm font-black text-white transition hover:bg-red-600"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
      {selectedProject && (
        <div className="fixed inset-0 z-[200] overflow-y-auto bg-slate-950/70 px-4 py-10 backdrop-blur-sm">
          <div className="mx-auto max-w-6xl rounded-[2rem] bg-white p-6 shadow-[0_30px_90px_rgba(15,23,42,0.35)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.18em] text-blue-600">
                  Nieuwbouwaanvraag
                </p>

                <h2 className="mt-2 text-4xl font-black tracking-[-0.04em] text-[#071B4D]">
                  {selectedProject.projectnaam}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setSelectedProject(null)}
                className="rounded-full bg-slate-100 px-4 py-2 text-sm font-black text-slate-500 transition hover:bg-slate-200"
              >
                Sluiten
              </button>
            </div>

            <div className="mt-8 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
              <div>
                {selectedProject.afbeeldingen?.length ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {selectedProject.afbeeldingen.map((image, index) => (
                      <button
                        key={`${image}-${index}`}
                        type="button"
                        onClick={() => setLightboxImage(image)}
                        className="overflow-hidden rounded-3xl border border-blue-100 bg-slate-100"
                      >
                        <img
                          src={image}
                          alt={`Project afbeelding ${index + 1}`}
                          className="aspect-[16/10] h-full w-full object-cover transition duration-500 hover:scale-105"
                        />
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="grid min-h-[280px] place-items-center rounded-3xl border border-dashed border-blue-100 bg-slate-50 text-sm font-black text-slate-400">
                    Geen afbeeldingen toegevoegd.
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="rounded-3xl bg-[#f7f9fc] p-5">
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-blue-700">
                    Ontwikkelaar
                  </p>

                  <p className="mt-2 text-lg font-black text-[#071B4D]">
                    {selectedProject.ontwikkelaar_naam || 'Niet ingevuld'}
                  </p>
                </div>

                <div className="rounded-3xl bg-[#f7f9fc] p-5">
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-blue-700">
                    Locatie
                  </p>

                  <p className="mt-2 text-lg font-black text-[#071B4D]">
                    {selectedProject.postcode} {selectedProject.stad}
                  </p>

                  {selectedProject.adres && (
                    <p className="mt-2 text-sm font-bold text-slate-500">
                      {selectedProject.adres}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-3xl bg-[#f7f9fc] p-5">
                    <p className="text-xs font-black uppercase tracking-[0.14em] text-blue-700">
                      Type project
                    </p>

                    <p className="mt-2 text-lg font-black text-[#071B4D]">
                      {selectedProject.type_project || 'Niet ingevuld'}
                    </p>
                  </div>

                  <div className="rounded-3xl bg-[#f7f9fc] p-5">
                    <p className="text-xs font-black uppercase tracking-[0.14em] text-blue-700">
                      Units
                    </p>

                    <p className="mt-2 text-lg font-black text-[#071B4D]">
                      {selectedProject.aantal_units}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-3xl bg-[#f7f9fc] p-5">
                    <p className="text-xs font-black uppercase tracking-[0.14em] text-blue-700">
                      Vanaf prijs
                    </p>

                    <p className="mt-2 text-lg font-black text-[#071B4D]">
                      {selectedProject.vanaf_prijs}
                    </p>
                  </div>

                  <div className="rounded-3xl bg-[#f7f9fc] p-5">
                    <p className="text-xs font-black uppercase tracking-[0.14em] text-blue-700">
                      Oplevering
                    </p>

                    <p className="mt-2 text-lg font-black text-[#071B4D]">
                      {selectedProject.oplevering || 'Niet ingevuld'}
                    </p>
                  </div>
                </div>

                <div className="rounded-3xl bg-[#f7f9fc] p-5">
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-blue-700">
                    Energieprestatie
                  </p>

                  <p className="mt-2 text-lg font-black text-[#071B4D]">
                    {selectedProject.energieprestatie || 'Niet ingevuld'}
                  </p>
                </div>

                <div className="rounded-3xl bg-[#f7f9fc] p-5">
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-blue-700">
                    Beschrijving
                  </p>

                  <p className="mt-3 text-sm font-semibold leading-7 text-slate-600">
                    {selectedProject.beschrijving || 'Geen beschrijving toegevoegd.'}
                  </p>
                </div>

                <div className="rounded-3xl bg-[#f7f9fc] p-5">
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-blue-700">
                    Contactgegevens
                  </p>

                  <div className="mt-3 space-y-2 text-sm font-bold text-slate-600">
                    <p>Contactpersoon: {selectedProject.contactpersoon || 'Niet ingevuld'}</p>
                    <p>E-mail: {selectedProject.email || 'Niet ingevuld'}</p>
                    <p>Telefoon: {selectedProject.telefoonnummer || 'Niet ingevuld'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => approveProject(selectedProject.id)}
                    className="rounded-2xl bg-emerald-500 px-4 py-4 text-sm font-black text-white transition hover:bg-emerald-600"
                  >
                    Approve
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedProject(null)
                      openRejectModal(selectedProject.id)
                    }}
                    className="rounded-2xl bg-amber-400 px-4 py-4 text-sm font-black text-[#071B4D] transition hover:bg-amber-500"
                  >
                    Reject
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeleteProjectId(selectedProject.id)}
                    className="rounded-2xl bg-red-500 px-4 py-4 text-sm font-black text-white transition hover:bg-red-600"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {deleteProjectId && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center bg-slate-950/70 px-4 backdrop-blur-sm">
          <div className="w-full max-w-[520px] rounded-[2rem] bg-white p-6 shadow-[0_30px_90px_rgba(15,23,42,0.35)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.18em] text-red-500">
                  Definitief verwijderen
                </p>

                <h2 className="mt-2 text-3xl font-black tracking-[-0.03em] text-[#071B4D]">
                  Aanvraag verwijderen?
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setDeleteProjectId(null)}
                className="rounded-full bg-slate-100 px-4 py-2 text-sm font-black text-slate-500 transition hover:bg-slate-200"
              >
                Sluiten
              </button>
            </div>

            <p className="mt-5 text-sm font-semibold leading-7 text-slate-600">
              Deze actie kan niet ongedaan worden gemaakt. De aanvraag wordt permanent verwijderd uit SlimWoning.
            </p>

            <div className="mt-8 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteProjectId(null)}
                className="rounded-2xl border border-blue-100 bg-white px-6 py-4 text-sm font-black text-[#071B4D] transition hover:bg-slate-50"
              >
                Annuleren
              </button>

              <button
                type="button"
                onClick={() => deleteProject(deleteProjectId)}
                className="rounded-2xl bg-red-500 px-6 py-4 text-sm font-black text-white transition hover:bg-red-600"
              >
                Definitief verwijderen
              </button>
            </div>
          </div>
        </div>
      )}

      {lightboxImage && (
        <div
          className="fixed inset-0 z-[300] flex items-center justify-center bg-black/90 p-6"
          onClick={() => setLightboxImage(null)}
        >
          <img
            src={lightboxImage}
            alt="Fullscreen project afbeelding"
            className="max-h-full max-w-full rounded-3xl object-contain"
          />
        </div>
      )}

      {rejectProjectId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 px-4 backdrop-blur-sm">
          <div className="w-full max-w-[620px] rounded-[2rem] bg-white p-6 shadow-[0_30px_90px_rgba(15,23,42,0.28)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.18em] text-amber-500">
                  Aanpassing nodig
                </p>

                <h2 className="mt-2 text-3xl font-black tracking-[-0.03em] text-[#071B4D]">
                  Waarom afkeuren?
                </h2>
              </div>

              <button
                type="button"
                onClick={closeRejectModal}
                className="rounded-full bg-slate-100 px-4 py-2 text-sm font-black text-slate-500 transition hover:bg-slate-200"
              >
                Sluiten
              </button>
            </div>

            <p className="mt-4 text-sm font-semibold leading-7 text-slate-600">
              Schrijf duidelijk wat de aanbieder moet aanpassen. Deze reden wordt bij het project opgeslagen.
            </p>

            <textarea
              value={rejectNote}
              onChange={(event) => setRejectNote(event.target.value)}
              rows={6}
              placeholder="Bijv. Voeg betere projectfoto’s toe, vermeld een realistische vanafprijs en vul de beschrijving vollediger in."
              className="mt-5 w-full rounded-3xl border border-blue-100 bg-[#f8fbff] px-5 py-4 text-sm font-semibold text-[#071B4D] outline-none transition focus:border-amber-400 focus:bg-white focus:ring-4 focus:ring-amber-50"
            />

            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={closeRejectModal}
                className="rounded-2xl border border-blue-100 bg-white px-6 py-4 text-sm font-black text-[#071B4D] transition hover:bg-slate-50"
              >
                Annuleren
              </button>

              <button
                type="button"
                onClick={submitRejectReason}
                disabled={!rejectNote.trim()}
                className="rounded-2xl bg-amber-400 px-6 py-4 text-sm font-black text-[#071B4D] transition hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Aanpassing vragen
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}