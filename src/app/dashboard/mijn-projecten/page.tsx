'use client'

import { ChangeEvent, useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'

type UserProject = {
  id: string
  projectnaam: string
  stad: string
  postcode: string
  vanaf_prijs: string
  aantal_units: number
  beschrijving: string
  afbeeldingen: string[]
  status: string
  moderation_note: string | null
  type_project?: string | null
  oplevering?: string | null
  energieprestatie?: string | null
  adres?: string | null
  ontwikkelaar_naam?: string | null
}

type UnitFormProject = Pick<UserProject, 'id' | 'projectnaam'>

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

export default function MijnProjectenPage() {
  const [projects, setProjects] = useState<UserProject[]>([])
  const [loading, setLoading] = useState(true)
  const [editingProject, setEditingProject] = useState<UserProject | null>(null)
  const [saving, setSaving] = useState(false)
  const [editingImages, setEditingImages] = useState<string[]>([])
  const [newImages, setNewImages] = useState<File[]>([])
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([])
  const [editProjectType, setEditProjectType] = useState('Appartementen')
  const [projectTypeOpen, setProjectTypeOpen] = useState(false)
  const [editEnergyPerformance, setEditEnergyPerformance] = useState('BEN-woning')
  const [energyPerformanceOpen, setEnergyPerformanceOpen] = useState(false)
  const [deletingProjectId, setDeletingProjectId] = useState<string | null>(null)
  const [deleteProjectTarget, setDeleteProjectTarget] = useState<UserProject | null>(null)
  const [unitProjectTarget, setUnitProjectTarget] = useState<UnitFormProject | null>(null)
  const [editingUnitTarget, setEditingUnitTarget] = useState<ProjectUnit | null>(null)
  const [savingUnit, setSavingUnit] = useState(false)
  const [deletingUnitId, setDeletingUnitId] = useState<string | null>(null)
  const [unitStatus, setUnitStatus] = useState('beschikbaar')
  const [unitStatusOpen, setUnitStatusOpen] = useState(false)
  const [unitType, setUnitType] = useState('Appartement')
  const [unitTypeOpen, setUnitTypeOpen] = useState(false)
  const [unitFloor, setUnitFloor] = useState('')
  const [projectUnits, setProjectUnits] = useState<ProjectUnit[]>([])
  const [loadingUnits, setLoadingUnits] = useState(false)
  const [unitImages, setUnitImages] = useState<File[]>([])
  const [unitImagePreviews, setUnitImagePreviews] = useState<string[]>([])

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    loadProjects()
  }, [])

  async function loadProjects() {
    setLoading(true)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setLoading(false)
      return
    }

    const { data, error } = await supabase
      .from('nieuwbouw_projecten')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Mijn projecten fetch error:', error)
      setLoading(false)
      return
    }

    setProjects(data || [])
    setLoading(false)
  }

  async function loadUnits(projectId: string) {
    setLoadingUnits(true)

    const { data, error } = await supabase
      .from('nieuwbouw_units')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Units fetch error:', error)
      setProjectUnits([])
      setLoadingUnits(false)
      return
    }

    setProjectUnits(data || [])
    setLoadingUnits(false)
  }

  function openEditProject(project: UserProject) {
    setEditingProject(project)
    setEditingImages(Array.isArray(project.afbeeldingen) ? project.afbeeldingen : [])
    setNewImages([])
    setNewImagePreviews([])
    setEditProjectType(project.type_project || 'Appartementen')
    setProjectTypeOpen(false)
    setEditEnergyPerformance(project.energieprestatie || 'BEN-woning')
    setEnergyPerformanceOpen(false)
    loadUnits(project.id)
  }

  function closeEditProject() {
    setEditingProject(null)
    setEditingImages([])
    setNewImages([])
    setNewImagePreviews([])
    setEditProjectType('Appartementen')
    setProjectTypeOpen(false)
    setEditEnergyPerformance('BEN-woning')
    setEnergyPerformanceOpen(false)
    setProjectUnits([])
    setLoadingUnits(false)
  }

  function handleNewImages(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files || [])
    const allowedFiles = files.filter((file) => file.type.startsWith('image/') && file.size <= 8 * 1024 * 1024)
    const availableSlots = Math.max(0, 12 - editingImages.length - newImages.length)
    const nextFiles = allowedFiles.slice(0, availableSlots)

    setNewImages((current) => [...current, ...nextFiles])
    setNewImagePreviews((current) => [...current, ...nextFiles.map((file) => URL.createObjectURL(file))])
    event.target.value = ''
  }

  function handleUnitImages(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files || [])
    const allowedFiles = files.filter((file) => file.type.startsWith('image/') && file.size <= 8 * 1024 * 1024)
    const availableSlots = Math.max(0, 8 - unitImages.length)
    const nextFiles = allowedFiles.slice(0, availableSlots)

    setUnitImages((current) => [...current, ...nextFiles])
    setUnitImagePreviews((current) => [...current, ...nextFiles.map((file) => URL.createObjectURL(file))])
    event.target.value = ''
  }

  function removeUnitImage(index: number) {
    setUnitImages((current) => current.filter((_, currentIndex) => currentIndex !== index))
    setUnitImagePreviews((current) => current.filter((_, currentIndex) => currentIndex !== index))
  }

  function removeExistingUnitImage(index: number) {
    if (!editingUnitTarget) return

    setEditingUnitTarget({
      ...editingUnitTarget,
      afbeeldingen: (editingUnitTarget.afbeeldingen || []).filter((_, currentIndex) => currentIndex !== index),
    })
  }

  function resetUnitModal() {
    setUnitProjectTarget(null)
    setEditingUnitTarget(null)
    setUnitStatus('beschikbaar')
    setUnitStatusOpen(false)
    setUnitType('Appartement')
    setUnitTypeOpen(false)
    setUnitFloor('')
    setUnitImages([])
    setUnitImagePreviews([])
  }

  function openAddUnitModal(project: UnitFormProject) {
    resetUnitModal()
    setUnitProjectTarget(project)
  }

  function openEditUnitModal(unit: ProjectUnit) {
    setUnitProjectTarget({ id: unit.project_id, projectnaam: editingProject?.projectnaam || 'project' })
    setEditingUnitTarget(unit)
    setUnitStatus(unit.status || 'beschikbaar')
    setUnitStatusOpen(false)
    setUnitType(unit.type_unit || 'Appartement')
    setUnitTypeOpen(false)
    setUnitFloor((unit.verdieping || '').replace('e verdieping', ''))
    setUnitImages([])
    setUnitImagePreviews([])
  }

  function removeExistingImage(index: number) {
    setEditingImages((current) => current.filter((_, currentIndex) => currentIndex !== index))
  }

  function removeNewImage(index: number) {
    setNewImages((current) => current.filter((_, currentIndex) => currentIndex !== index))
    setNewImagePreviews((current) => current.filter((_, currentIndex) => currentIndex !== index))
  }

  function moveExistingImage(index: number, direction: 'up' | 'down') {
    setEditingImages((current) => {
      const next = [...current]
      const targetIndex = direction === 'up' ? index - 1 : index + 1

      if (targetIndex < 0 || targetIndex >= next.length) return current

      const target = next[targetIndex]
      next[targetIndex] = next[index]
      next[index] = target
      return next
    })
  }

  function makeExistingImageMain(index: number) {
    setEditingImages((current) => {
      if (index <= 0 || index >= current.length) return current

      const next = [...current]
      const [selectedImage] = next.splice(index, 1)
      return [selectedImage, ...next]
    })
  }

  async function saveProjectEdit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!editingProject) return

    setSaving(true)

    const formData = new FormData(event.currentTarget)

    const uploadedImageUrls: string[] = []

    for (const file of newImages) {
      const filePath = `projecten/${editingProject.id}/${Date.now()}-${file.name}`

      const { error: uploadError } = await supabase.storage
        .from('nieuwbouw-images')
        .upload(filePath, file, { upsert: true })

      if (uploadError) {
        console.error('Project image upload error:', uploadError)
        setSaving(false)
        return
      }

      const { data: publicUrlData } = supabase.storage
        .from('nieuwbouw-images')
        .getPublicUrl(filePath)

      uploadedImageUrls.push(publicUrlData.publicUrl)
    }

    const nextImages = [...editingImages, ...uploadedImageUrls]

    const { error } = await supabase
      .from('nieuwbouw_projecten')
      .update({
        projectnaam: String(formData.get('projectnaam') || ''),
        ontwikkelaar_naam: String(formData.get('ontwikkelaar_naam') || ''),
        stad: String(formData.get('stad') || ''),
        postcode: String(formData.get('postcode') || ''),
        adres: String(formData.get('adres') || ''),
        type_project: String(formData.get('type_project') || ''),
        aantal_units: Number(formData.get('aantal_units') || 0),
        vanaf_prijs: String(formData.get('vanaf_prijs') || ''),
        oplevering: String(formData.get('oplevering') || ''),
        energieprestatie: String(formData.get('energieprestatie') || ''),
        beschrijving: String(formData.get('beschrijving') || ''),
        afbeeldingen: nextImages,
        status: 'pending',
        moderation_note: null,
      })
      .eq('id', editingProject.id)

    setSaving(false)

    if (error) {
      console.error('Project edit error:', error)
      return
    }

    closeEditProject()
    loadProjects()
  }

  async function deleteProject(project: UserProject) {
    setDeletingProjectId(project.id)

    const { error } = await supabase
      .from('nieuwbouw_projecten')
      .delete()
      .eq('id', project.id)

    setDeletingProjectId(null)

    if (error) {
      console.error('Project delete error:', error)
      return
    }

    setDeleteProjectTarget(null)
    setProjects((current) => current.filter((item) => item.id !== project.id))
  }

  async function saveUnit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!unitProjectTarget) return

    setSavingUnit(true)

    const formData = new FormData(event.currentTarget)
    const uploadedUnitImageUrls: string[] = []

    for (const file of unitImages) {
      const filePath = `units/${unitProjectTarget.id}/${Date.now()}-${file.name}`

      const { error: uploadError } = await supabase.storage
        .from('nieuwbouw-images')
        .upload(filePath, file, { upsert: true })

      if (uploadError) {
        console.error('Unit image upload error:', uploadError)
        setSavingUnit(false)
        return
      }

      const { data: publicUrlData } = supabase.storage
        .from('nieuwbouw-images')
        .getPublicUrl(filePath)

      uploadedUnitImageUrls.push(publicUrlData.publicUrl)
    }

    const nextUnitImages = editingUnitTarget
      ? [...(editingUnitTarget.afbeeldingen || []), ...uploadedUnitImageUrls]
      : uploadedUnitImageUrls

    const unitPayload = {
      project_id: unitProjectTarget.id,
      titel: String(formData.get('titel') || ''),
      type_unit: unitType,
      prijs: String(formData.get('prijs') || ''),
      slaapkamers: Number(formData.get('slaapkamers') || 0),
      badkamers: Number(formData.get('badkamers') || 0),
      oppervlakte: Number(formData.get('oppervlakte') || 0),
      verdieping: unitFloor ? `${unitFloor}e verdieping` : '',
      status: unitStatus,
      terras: formData.get('terras') === 'on',
      beschrijving: String(formData.get('beschrijving') || ''),
      afbeeldingen: nextUnitImages,
    }

    const { error } = editingUnitTarget
      ? await supabase
          .from('nieuwbouw_units')
          .update(unitPayload)
          .eq('id', editingUnitTarget.id)
      : await supabase
          .from('nieuwbouw_units')
          .insert(unitPayload)

    setSavingUnit(false)

    if (error) {
      console.error('Unit insert error:', error)
      return
    }

    resetUnitModal()
    if (editingProject) {
      loadUnits(editingProject.id)
    }
  }

  async function deleteUnit(unit: ProjectUnit) {
    setDeletingUnitId(unit.id)

    const { error } = await supabase
      .from('nieuwbouw_units')
      .delete()
      .eq('id', unit.id)

    setDeletingUnitId(null)

    if (error) {
      console.error('Unit delete error:', error)
      return
    }

    setProjectUnits((current) => current.filter((item) => item.id !== unit.id))
  }

  return (
    <main className="min-h-screen bg-[#f6f8fb] px-6 py-10 text-[#071B4D] md:px-10 lg:px-16">
      <div className="mx-auto max-w-[1400px]">
        <div className="mb-10 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-blue-600">
              Dashboard
            </p>

            <h1 className="mt-3 text-5xl font-black tracking-[-0.04em] text-[#071B4D]">
              Mijn nieuwbouwprojecten
            </h1>
          </div>

          <Link
            href="/nieuwbouw/aanmelden"
            className="rounded-2xl bg-[#071B4D] px-6 py-4 text-sm font-black text-white transition hover:bg-[#0B2A6B]"
          >
            Nieuw project toevoegen
          </Link>
        </div>

        {loading ? (
          <div className="rounded-[2rem] border border-blue-100 bg-white p-10 text-center text-lg font-bold text-slate-500">
            Projecten laden...
          </div>
        ) : projects.length === 0 ? (
          <div className="rounded-[2rem] border border-blue-100 bg-white p-10 text-center text-lg font-bold text-slate-500">
            Je hebt nog geen projecten toegevoegd.
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 2xl:grid-cols-4">
            {projects.map((project) => (
              <article
                key={project.id}
                className="flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-blue-100 bg-white shadow-[0_12px_36px_rgba(15,23,42,0.05)]"
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

                <div className="flex flex-1 flex-col p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-[2rem] font-black leading-none text-[#071B4D]">
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

                  <div className="mt-4 flex flex-wrap gap-2">
                    <div className="rounded-full bg-[#f7f9fc] px-3 py-2 text-xs font-black text-[#071B4D]">
                      {project.aantal_units} units
                    </div>

                    <div className="rounded-full bg-[#f7f9fc] px-3 py-2 text-xs font-black text-[#071B4D]">
                      Nieuwbouw
                    </div>
                  </div>

                  {project.moderation_note && (
                    <div className="group relative mt-5 inline-flex w-fit rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-amber-700">
                      Aanpassing gevraagd

                      <div className="pointer-events-none absolute left-0 top-[calc(100%+10px)] z-30 w-[280px] rounded-2xl border border-amber-200 bg-white p-4 text-left normal-case tracking-normal text-amber-950 opacity-0 shadow-[0_18px_50px_rgba(15,23,42,0.16)] transition group-hover:opacity-100">
                        <p className="text-[11px] font-black uppercase tracking-[0.14em] text-amber-600">
                          Reden
                        </p>

                        <p className="mt-2 text-sm font-semibold leading-6">
                          {project.moderation_note}
                        </p>
                      </div>
                    </div>
                  )}

                  <p className="mt-5 line-clamp-3 text-sm font-semibold leading-6 text-slate-600">
                    {project.beschrijving}
                  </p>

                  <div className="mt-auto space-y-3 pt-6">
                    <div className="rounded-2xl bg-[#f4f7fb] px-5 py-4 text-sm font-bold text-slate-500">
                      {project.status === 'approved' && 'Je project is gepubliceerd.'}
                      {project.status === 'pending' && 'Je project wacht op moderatie.'}
                      {project.status === 'revision_requested' &&
                        'Werk je project bij en dien het opnieuw in.'}
                      {project.status === 'rejected' &&
                        'Je project werd afgekeurd.'}
                    </div>

                    <div className="flex flex-wrap justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => openEditProject(project)}
                        className="rounded-xl border border-[#0B2A6B] bg-[#071B4D] px-5 py-2.5 text-xs font-black uppercase tracking-[0.08em] text-white transition hover:bg-[#0B2A6B]"
                      >
                        Bewerken
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeleteProjectTarget(project)}
                        disabled={deletingProjectId === project.id}
                        className="rounded-xl border border-red-200 bg-white px-5 py-2.5 text-xs font-black uppercase tracking-[0.08em] text-red-600 transition hover:border-red-500 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {deletingProjectId === project.id ? 'Verwijderen...' : 'Verwijderen'}
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {editingProject && (
        <div className="fixed inset-0 z-[100] overflow-y-auto bg-slate-950/50 px-4 py-8 backdrop-blur-sm">
          <div className="flex min-h-full items-start justify-center">
            <div className="my-10 w-full max-w-[1280px] rounded-[2rem] bg-white p-8 shadow-[0_30px_90px_rgba(15,23,42,0.28)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.18em] text-blue-600">
                  Project bewerken
                </p>

                <h2 className="mt-2 text-3xl font-black tracking-[-0.03em] text-[#071B4D]">
                  Gegevens aanpassen
                </h2>
              </div>

              <button
                type="button"
                onClick={closeEditProject}
                className="rounded-full bg-slate-100 px-4 py-2 text-sm font-black text-slate-500 transition hover:bg-slate-200"
              >
                Sluiten
              </button>
            </div>

            <form onSubmit={saveProjectEdit} className="mt-8 grid gap-8 lg:grid-cols-[0.78fr_1.22fr]">
              <div className="space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-black text-[#071B4D]">Projectnaam</label>
                  <input
                    name="projectnaam"
                    defaultValue={editingProject.projectnaam}
                    required
                    className="h-14 w-full rounded-2xl border border-blue-100 bg-[#f8fbff] px-5 text-sm font-bold outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-black text-[#071B4D]">Ontwikkelaar naam</label>
                  <input
                    name="ontwikkelaar_naam"
                    defaultValue={editingProject.ontwikkelaar_naam || ''}
                    className="h-14 w-full rounded-2xl border border-blue-100 bg-[#f8fbff] px-5 text-sm font-bold outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-black text-[#071B4D]">Stad</label>
                  <input
                    name="stad"
                    defaultValue={editingProject.stad}
                    required
                    className="h-14 w-full rounded-2xl border border-blue-100 bg-[#f8fbff] px-5 text-sm font-bold outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-black text-[#071B4D]">Postcode</label>
                  <input
                    name="postcode"
                    defaultValue={editingProject.postcode}
                    required
                    className="h-14 w-full rounded-2xl border border-blue-100 bg-[#f8fbff] px-5 text-sm font-bold outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-black text-[#071B4D]">Adres / buurt</label>
                  <input
                    name="adres"
                    defaultValue={editingProject.adres || ''}
                    className="h-14 w-full rounded-2xl border border-blue-100 bg-[#f8fbff] px-5 text-sm font-bold outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-black text-[#071B4D]">Aantal units</label>
                  <input
                    type="number"
                    name="aantal_units"
                    defaultValue={editingProject.aantal_units}
                    required
                    className="h-14 w-full rounded-2xl border border-blue-100 bg-[#f8fbff] px-5 text-sm font-bold outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-black text-[#071B4D]">Type project</label>
                  <input type="hidden" name="type_project" value={editProjectType} />

                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setProjectTypeOpen((open) => !open)}
                      className="flex h-14 w-full items-center justify-between rounded-2xl border border-blue-100 bg-[#f8fbff] px-5 text-left text-sm font-black text-[#071B4D] outline-none transition hover:bg-white focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50"
                    >
                      <span>{editProjectType}</span>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        className={`h-5 w-5 transition ${projectTypeOpen ? 'rotate-180' : ''}`}
                      >
                        <path
                          fillRule="evenodd"
                          d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>

                    {projectTypeOpen && (
                      <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-40 overflow-hidden rounded-2xl border border-blue-100 bg-white p-2 shadow-[0_18px_50px_rgba(15,23,42,0.16)]">
                        {['Appartementen', 'Woningen', 'Gemengd project'].map((type) => (
                          <button
                            key={type}
                            type="button"
                            onClick={() => {
                              setEditProjectType(type)
                              setProjectTypeOpen(false)
                            }}
                            className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-sm font-black transition ${
                              editProjectType === type
                                ? 'bg-[#071B4D] text-white'
                                : 'text-[#071B4D] hover:bg-blue-50'
                            }`}
                          >
                            <span>{type}</span>
                            {editProjectType === type && <span>✓</span>}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-black text-[#071B4D]">Vanaf prijs</label>
                  <input
                    name="vanaf_prijs"
                    defaultValue={editingProject.vanaf_prijs}
                    required
                    className="h-14 w-full rounded-2xl border border-blue-100 bg-[#f8fbff] px-5 text-sm font-bold outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-black text-[#071B4D]">Oplevering</label>
                  <input
                    name="oplevering"
                    defaultValue={editingProject.oplevering || ''}
                    placeholder="Bijv. Oplevering 2026"
                    className="h-14 w-full rounded-2xl border border-blue-100 bg-[#f8fbff] px-5 text-sm font-bold outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-black text-[#071B4D]">Energieprestatie</label>
                  <input type="hidden" name="energieprestatie" value={editEnergyPerformance} />

                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setEnergyPerformanceOpen((open) => !open)}
                      className="flex h-14 w-full items-center justify-between rounded-2xl border border-blue-100 bg-[#f8fbff] px-5 text-left text-sm font-black text-[#071B4D] outline-none transition hover:bg-white focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50"
                    >
                      <span>{editEnergyPerformance}</span>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        className={`h-5 w-5 transition ${energyPerformanceOpen ? 'rotate-180' : ''}`}
                      >
                        <path
                          fillRule="evenodd"
                          d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>

                    {energyPerformanceOpen && (
                      <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-40 overflow-hidden rounded-2xl border border-blue-100 bg-white p-2 shadow-[0_18px_50px_rgba(15,23,42,0.16)]">
                        {['BEN-woning', 'E-peil < 30', 'E-peil < 20', 'A-label', 'A+', 'A++', 'A+++', 'A++++'].map((energy) => (
                          <button
                            key={energy}
                            type="button"
                            onClick={() => {
                              setEditEnergyPerformance(energy)
                              setEnergyPerformanceOpen(false)
                            }}
                            className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-sm font-black transition ${
                              editEnergyPerformance === energy
                                ? 'bg-[#071B4D] text-white'
                                : 'text-[#071B4D] hover:bg-blue-50'
                            }`}
                          >
                            <span>{energy}</span>
                            {editEnergyPerformance === energy && <span>✓</span>}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-black text-[#071B4D]">Beschrijving</label>
                  <textarea
                    name="beschrijving"
                    defaultValue={editingProject.beschrijving}
                    rows={6}
                    required
                    className="w-full rounded-3xl border border-blue-100 bg-[#f8fbff] px-5 py-4 text-sm font-semibold text-[#071B4D] outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50"
                  />
                </div>

                <div className="rounded-[2rem] border border-blue-100 bg-[#f8fbff] p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-600">
                        Units
                      </p>

                      <h3 className="mt-1 text-xl font-black text-[#071B4D]">
                        Units beheren
                      </h3>

                      <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
                        Voeg units toe of beheer alle appartementen, woningen en penthouses op een aparte pagina.
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => openAddUnitModal({ id: editingProject.id, projectnaam: editingProject.projectnaam })}
                        className="rounded-2xl bg-[#071B4D] px-4 py-3 text-xs font-black uppercase tracking-[0.08em] text-white transition hover:bg-[#0B2A6B]"
                      >
                        Unit toevoegen
                      </button>

                      <Link
                        href={`/dashboard/mijn-projecten/${editingProject.id}/units`}
                        className="rounded-2xl border border-blue-100 bg-white px-4 py-3 text-xs font-black uppercase tracking-[0.08em] text-[#071B4D] transition hover:bg-blue-50"
                      >
                        Units beheren
                      </Link>
                    </div>
                  </div>

                  <div className="mt-5 rounded-2xl border border-dashed border-blue-200 bg-white px-5 py-6 text-center">
                    <p className="text-sm font-black text-[#071B4D]">
                      {loadingUnits ? 'Units laden...' : `${projectUnits.length} unit${projectUnits.length === 1 ? '' : 's'} toegevoegd`}
                    </p>

                    <p className="mt-2 text-xs font-semibold leading-5 text-slate-500">
                      Gebruik de aparte beheerpagina voor overzicht, foto’s, bewerken en verwijderen.
                    </p>
                  </div>
                </div>
              </div>

              <div className="lg:sticky lg:top-8 lg:self-start">
                <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <label className="block text-sm font-black text-[#071B4D]">Projectafbeeldingen</label>
                    <p className="mt-1 text-xs font-semibold text-slate-500">
                      De eerste afbeelding wordt gebruikt als hoofdfoto. Maximaal 12 afbeeldingen.
                    </p>
                  </div>

                  <span className="rounded-full bg-blue-50 px-4 py-2 text-xs font-black text-blue-700">
                    {editingImages.length + newImages.length}/12 foto’s
                  </span>
                </div>

                <label className="flex min-h-[130px] cursor-pointer flex-col items-center justify-center rounded-[2rem] border-2 border-dashed border-blue-200 bg-[#f8fbff] px-6 py-6 text-center transition hover:border-blue-400 hover:bg-blue-50/50">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleNewImages}
                    className="hidden"
                  />

                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#071B4D] text-2xl text-white">+</span>
                  <span className="mt-3 text-sm font-black text-[#071B4D]">Nieuwe foto’s toevoegen</span>
                  <span className="mt-1 text-xs font-semibold text-slate-500">JPG, PNG of WEBP tot 8 MB per foto.</span>
                </label>

                {(editingImages.length > 0 || newImagePreviews.length > 0) && (
                  <div className="mt-5 grid max-h-[560px] gap-4 overflow-y-auto pb-28 pr-2 sm:grid-cols-2 xl:grid-cols-3">
                    {editingImages.map((image, index) => (
                      <div key={`${image}-${index}`} className="overflow-hidden rounded-3xl border border-blue-100 bg-white shadow-[0_12px_34px_rgba(15,23,42,0.08)]">
                        <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
                          <img src={image} alt={`Project afbeelding ${index + 1}`} className="h-full w-full object-cover" />

                          {index === 0 ? (
                            <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.12em] text-[#071B4D] shadow-sm backdrop-blur-sm">
                              Hoofdfoto
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => makeExistingImageMain(index)}
                              className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-[#071B4D]/85 px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.08em] text-white shadow-sm backdrop-blur-sm transition hover:bg-[#0B2A6B]"
                            >
                              <span aria-hidden="true">★</span>
                              <span>Kies als hoofdfoto</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => removeExistingImage(index)}
                            className="absolute right-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-black text-red-600 shadow-sm backdrop-blur-sm transition hover:bg-red-50"
                          >
                            Verwijder
                          </button>
                        </div>

                        <div className="flex items-center justify-between gap-3 p-4">
                          <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">Foto {index + 1}</p>

                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => moveExistingImage(index, 'up')}
                              disabled={index === 0}
                              className="rounded-xl border border-blue-100 px-3 py-2 text-xs font-black text-[#071B4D] transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              ↑
                            </button>
                            <button
                              type="button"
                              onClick={() => moveExistingImage(index, 'down')}
                              disabled={index === editingImages.length - 1}
                              className="rounded-xl border border-blue-100 px-3 py-2 text-xs font-black text-[#071B4D] transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              ↓
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}

                    {newImagePreviews.map((image, index) => (
                      <div key={`${image}-${index}`} className="overflow-hidden rounded-3xl border border-blue-100 bg-white shadow-[0_12px_34px_rgba(15,23,42,0.08)]">
                        <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
                          <img src={image} alt={`Nieuwe afbeelding ${index + 1}`} className="h-full w-full object-cover" />

                          {editingImages.length === 0 && index === 0 && (
                            <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.12em] text-[#071B4D] backdrop-blur-sm">
                              Hoofdfoto
                            </span>
                          )}

                          <button
                            type="button"
                            onClick={() => removeNewImage(index)}
                            className="absolute right-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-black text-red-600 shadow-sm backdrop-blur-sm transition hover:bg-red-50"
                          >
                            Verwijder
                          </button>
                        </div>

                        <div className="p-4">
                          <p className="text-xs font-black uppercase tracking-[0.12em] text-emerald-600">Nieuwe foto</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="sticky bottom-0 z-50 lg:col-span-2 -mx-8 mt-4 flex flex-wrap justify-end gap-4 border-t border-blue-50 bg-white/95 px-8 pb-2 pt-6 backdrop-blur">
                <button
                  type="button"
                  onClick={closeEditProject}
                  className="rounded-2xl border border-blue-100 bg-white px-6 py-4 text-sm font-black text-[#071B4D] transition hover:bg-slate-50"
                >
                  Annuleren
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-2xl bg-[#071B4D] px-6 py-4 text-sm font-black text-white transition hover:bg-[#0B2A6B] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? 'Opslaan...' : 'Opslaan en opnieuw indienen'}
                </button>
              </div>
            </form>
            </div>
          </div>
        </div>
      )}
      {unitProjectTarget && (
        <div className="fixed inset-0 z-[130] overflow-y-auto bg-slate-950/70 px-4 py-8 backdrop-blur-sm">
          <div className="flex min-h-full items-start justify-center">
            <div className="my-10 w-full max-w-[760px] rounded-[2rem] bg-white p-6 shadow-[0_30px_90px_rgba(15,23,42,0.35)]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-black uppercase tracking-[0.18em] text-blue-600">
                    Unit toevoegen
                  </p>

                  <h2 className="mt-2 text-3xl font-black tracking-[-0.03em] text-[#071B4D]">
                    {editingUnitTarget ? 'Unit bewerken' : `Nieuwe unit voor ${unitProjectTarget.projectnaam}`}
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={resetUnitModal}
                  className="rounded-full bg-slate-100 px-4 py-2 text-sm font-black text-slate-500 transition hover:bg-slate-200"
                >
                  Sluiten
                </button>
              </div>

              <form key={editingUnitTarget?.id || 'new-unit'} onSubmit={saveUnit} className="mt-8 grid gap-5 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-black text-[#071B4D]">Unit titel</label>
                  <input
                    name="titel"
                    defaultValue={editingUnitTarget?.titel || ''}
                    placeholder="Bijv. Appartement 1.2"
                    required
                    className="h-14 w-full rounded-2xl border border-blue-100 bg-[#f8fbff] px-5 text-sm font-bold outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-black text-[#071B4D]">Type unit</label>
                  <input type="hidden" name="type_unit" value={unitType} />

                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setUnitTypeOpen((open) => !open)}
                      className="flex h-14 w-full items-center justify-between rounded-2xl border border-blue-100 bg-[#f8fbff] px-5 text-left text-sm font-black text-[#071B4D] outline-none transition hover:bg-white focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50"
                    >
                      <span>{unitType}</span>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        className={`h-5 w-5 transition ${unitTypeOpen ? 'rotate-180' : ''}`}
                      >
                        <path
                          fillRule="evenodd"
                          d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>

                    {unitTypeOpen && (
                      <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 overflow-hidden rounded-2xl border border-blue-100 bg-white p-2 shadow-[0_18px_50px_rgba(15,23,42,0.16)]">
                        {['Appartement', 'Penthouse', 'Woning', 'Studio', 'Duplex', 'Commerciële ruimte'].map((type) => (
                          <button
                            key={type}
                            type="button"
                            onClick={() => {
                              setUnitType(type)
                              setUnitTypeOpen(false)
                            }}
                            className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-sm font-black transition ${
                              unitType === type
                                ? 'bg-[#071B4D] text-white'
                                : 'text-[#071B4D] hover:bg-blue-50'
                            }`}
                          >
                            <span>{type}</span>
                            {unitType === type && <span>✓</span>}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-black text-[#071B4D]">Prijs</label>
                  <input
                    name="prijs"
                    defaultValue={editingUnitTarget?.prijs || ''}
                    placeholder="Bijv. 389000"
                    required
                    className="h-14 w-full rounded-2xl border border-blue-100 bg-[#f8fbff] px-5 text-sm font-bold outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-black text-[#071B4D]">Slaapkamers</label>
                  <input
                    type="number"
                    name="slaapkamers"
                    min="0"
                    defaultValue={editingUnitTarget?.slaapkamers ?? 1}
                    className="h-14 w-full rounded-2xl border border-blue-100 bg-[#f8fbff] px-5 text-sm font-bold outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-black text-[#071B4D]">Badkamers</label>
                  <input
                    type="number"
                    name="badkamers"
                    min="0"
                    defaultValue={editingUnitTarget?.badkamers ?? 1}
                    className="h-14 w-full rounded-2xl border border-blue-100 bg-[#f8fbff] px-5 text-sm font-bold outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-black text-[#071B4D]">Oppervlakte m²</label>
                  <input
                    type="number"
                    name="oppervlakte"
                    min="0"
                    defaultValue={editingUnitTarget?.oppervlakte || ''}
                    placeholder="Bijv. 84"
                    className="h-14 w-full rounded-2xl border border-blue-100 bg-[#f8fbff] px-5 text-sm font-bold outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-black text-[#071B4D]">Verdieping</label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      name="verdieping_nummer"
                      value={unitFloor}
                      onChange={(event) => setUnitFloor(event.target.value)}
                      placeholder="Bijv. 1"
                      className="h-14 w-full rounded-2xl border border-blue-100 bg-[#f8fbff] px-5 pr-32 text-sm font-bold outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50"
                    />
                    <span className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 text-sm font-black text-slate-400">
                      {unitFloor ? 'e verdieping' : 'verdieping'}
                    </span>
                  </div>
                </div>

                <div className="md:col-span-2 grid gap-5 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-black text-[#071B4D]">Status</label>
                    <input type="hidden" name="status" value={unitStatus} />

                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setUnitStatusOpen((open) => !open)}
                        className="flex h-14 w-full items-center justify-between rounded-2xl border border-blue-100 bg-[#f8fbff] px-5 text-left text-sm font-black text-[#071B4D] outline-none transition hover:bg-white focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50"
                      >
                        <span className="capitalize">{unitStatus}</span>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          className={`h-5 w-5 transition ${unitStatusOpen ? 'rotate-180' : ''}`}
                        >
                          <path
                            fillRule="evenodd"
                            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>

                      {unitStatusOpen && (
                        <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 overflow-hidden rounded-2xl border border-blue-100 bg-white p-2 shadow-[0_18px_50px_rgba(15,23,42,0.16)]">
                          {['beschikbaar', 'gereserveerd', 'verkocht'].map((status) => (
                            <button
                              key={status}
                              type="button"
                              onClick={() => {
                                setUnitStatus(status)
                                setUnitStatusOpen(false)
                              }}
                              className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-sm font-black capitalize transition ${
                                unitStatus === status
                                  ? 'bg-[#071B4D] text-white'
                                  : 'text-[#071B4D] hover:bg-blue-50'
                              }`}
                            >
                              <span>{status}</span>
                              {unitStatus === status && <span>✓</span>}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <label className="mt-7 flex h-14 items-center gap-3 rounded-2xl border border-blue-100 bg-[#f8fbff] px-5 text-sm font-black text-[#071B4D]">
                    <input type="checkbox" name="terras" defaultChecked={Boolean(editingUnitTarget?.terras)} className="h-4 w-4" />
                    Terras aanwezig
                  </label>
                </div>

                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-black text-[#071B4D]">Beschrijving</label>
                  <textarea
                    name="beschrijving"
                    defaultValue={editingUnitTarget?.beschrijving || ''}
                    rows={4}
                    placeholder="Korte beschrijving van deze unit..."
                    className="w-full rounded-3xl border border-blue-100 bg-[#f8fbff] px-5 py-4 text-sm font-semibold text-[#071B4D] outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50"
                  />
                </div>

                <div className="md:col-span-2 rounded-[2rem] border border-blue-100 bg-[#f8fbff] p-5">
                  <div className="flex flex-wrap items-end justify-between gap-3">
                    <div>
                      <label className="block text-sm font-black text-[#071B4D]">Unit afbeeldingen</label>
                      <p className="mt-1 text-xs font-semibold text-slate-500">
                        Voeg maximaal 8 foto’s toe voor deze unit.
                      </p>
                      <p className="mt-2 rounded-2xl bg-blue-50 px-4 py-3 text-xs font-bold leading-5 text-[#071B4D]">
                        Gebruik bij voorkeur horizontale foto’s in 16:9 formaat. Verticale foto’s kunnen in de galerij met lege ruimte of afgesneden worden weergegeven.
                      </p>
                    </div>

                    <span className="rounded-full bg-blue-50 px-4 py-2 text-xs font-black text-blue-700">
                      {unitImages.length}/8 foto’s
                    </span>
                  </div>

                  <label className="mt-4 flex min-h-[120px] cursor-pointer flex-col items-center justify-center rounded-[1.5rem] border-2 border-dashed border-blue-200 bg-white px-6 py-6 text-center transition hover:border-blue-400 hover:bg-blue-50/50">
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleUnitImages}
                      className="hidden"
                    />

                    <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#071B4D] text-2xl text-white">+</span>
                    <span className="mt-3 text-sm font-black text-[#071B4D]">Unit foto’s toevoegen</span>
                    <span className="mt-1 text-xs font-semibold text-slate-500">JPG, PNG of WEBP tot 8 MB per foto. Beste formaat: horizontaal 16:9.</span>
                  </label>

                  {editingUnitTarget?.afbeeldingen && editingUnitTarget.afbeeldingen.length > 0 && (
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      {editingUnitTarget.afbeeldingen.map((image, index) => (
                        <div key={`${image}-${index}`} className="overflow-hidden rounded-2xl border border-blue-100 bg-white">
                          <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
                            <img src={image} alt={`Bestaande unit afbeelding ${index + 1}`} className="h-full w-full object-cover" />
                            <button
                              type="button"
                              onClick={() => removeExistingUnitImage(index)}
                              className="absolute right-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-black text-red-600 shadow-sm backdrop-blur-sm transition hover:bg-red-50"
                            >
                              Verwijder
                            </button>
                          </div>
                          <div className="p-3">
                            <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">Bestaande foto {index + 1}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {unitImagePreviews.length > 0 && (
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      {unitImagePreviews.map((image, index) => (
                        <div key={`${image}-${index}`} className="overflow-hidden rounded-2xl border border-blue-100 bg-white">
                          <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
                            <img src={image} alt={`Unit afbeelding ${index + 1}`} className="h-full w-full object-cover" />

                            <button
                              type="button"
                              onClick={() => removeUnitImage(index)}
                              className="absolute right-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-black text-red-600 shadow-sm backdrop-blur-sm transition hover:bg-red-50"
                            >
                              Verwijder
                            </button>
                          </div>

                          <div className="p-3">
                            <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">Foto {index + 1}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="md:col-span-2 flex flex-wrap justify-end gap-3 border-t border-blue-50 pt-6">
                  <button
                    type="button"
                    onClick={resetUnitModal}
                    className="rounded-2xl border border-blue-100 bg-white px-6 py-4 text-sm font-black text-[#071B4D] transition hover:bg-slate-50"
                  >
                    Annuleren
                  </button>

                  <button
                    type="submit"
                    disabled={savingUnit}
                    className="rounded-2xl bg-[#071B4D] px-6 py-4 text-sm font-black text-white transition hover:bg-[#0B2A6B] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {savingUnit ? 'Unit opslaan...' : editingUnitTarget ? 'Unit bijwerken' : 'Unit opslaan'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {deleteProjectTarget && (
      <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/70 px-4 backdrop-blur-sm">
        <div className="w-full max-w-[520px] rounded-[2rem] bg-white p-6 shadow-[0_30px_90px_rgba(15,23,42,0.35)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.18em] text-red-500">
                Definitief verwijderen
              </p>

              <h2 className="mt-2 text-3xl font-black tracking-[-0.03em] text-[#071B4D]">
                Project verwijderen?
              </h2>
            </div>

            <button
              type="button"
              onClick={() => setDeleteProjectTarget(null)}
              className="rounded-full bg-slate-100 px-4 py-2 text-sm font-black text-slate-500 transition hover:bg-slate-200"
            >
              Sluiten
            </button>
          </div>

          <p className="mt-5 text-sm font-semibold leading-7 text-slate-600">
            Je staat op het punt om <span className="font-black text-[#071B4D]">{deleteProjectTarget.projectnaam}</span> permanent te verwijderen. Deze actie kan niet ongedaan worden gemaakt.
          </p>

          <div className="mt-8 flex flex-wrap justify-end gap-3">
            <button
              type="button"
              onClick={() => setDeleteProjectTarget(null)}
              className="rounded-2xl border border-blue-100 bg-white px-6 py-4 text-sm font-black text-[#071B4D] transition hover:bg-slate-50"
            >
              Annuleren
            </button>

            <button
              type="button"
              onClick={() => deleteProject(deleteProjectTarget)}
              disabled={deletingProjectId === deleteProjectTarget.id}
              className="rounded-2xl bg-red-500 px-6 py-4 text-sm font-black text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {deletingProjectId === deleteProjectTarget.id ? 'Verwijderen...' : 'Definitief verwijderen'}
            </button>
          </div>
        </div>
      </div>
    )}
    </main>
  )
}