'use client'

import Link from 'next/link'
import { ChangeEvent, FormEvent, useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

type ProjectUnit = {
  id: string
  project_id: string
  titel: string | null
  type_unit: string | null
  status: string | null
  prijs: string | null
  oppervlakte: number | null
  slaapkamers: number | null
  badkamers: number | null
  verdieping: string | null
  terras: boolean | null
  beschrijving: string | null
  afbeeldingen?: string[] | null
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseAnonKey)

export default function ProjectUnitsManagementPage() {
  const params = useParams<{ id: string }>()
  const projectId = params.id

  const [units, setUnits] = useState<ProjectUnit[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingUnit, setEditingUnit] = useState<ProjectUnit | null>(null)
  const [unitType, setUnitType] = useState('Appartement')
  const [unitStatus, setUnitStatus] = useState('beschikbaar')
  const [unitFloor, setUnitFloor] = useState('')
  const [existingImages, setExistingImages] = useState<string[]>([])
  const [newImages, setNewImages] = useState<File[]>([])
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([])
  const [lightboxImages, setLightboxImages] = useState<string[]>([])
  const [lightboxIndex, setLightboxIndex] = useState(0)

  useEffect(() => {
    fetchUnits()
  }, [projectId])

  async function fetchUnits() {
    setLoading(true)

    const { data, error } = await supabase
      .from('nieuwbouw_units')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Units fetch error:', error)
      setUnits([])
    } else {
      setUnits((data || []) as ProjectUnit[])
    }

    setLoading(false)
  }

  function resetModal() {
    setModalOpen(false)
    setEditingUnit(null)
    setUnitType('Appartement')
    setUnitStatus('beschikbaar')
    setUnitFloor('')
    setExistingImages([])
    setNewImages([])
    setNewImagePreviews([])
  }

  function openAddModal() {
    resetModal()
    setModalOpen(true)
  }

  function openEditModal(unit: ProjectUnit) {
    setEditingUnit(unit)
    setUnitType(unit.type_unit || 'Appartement')
    setUnitStatus(unit.status || 'beschikbaar')
    setUnitFloor((unit.verdieping || '').replace('e verdieping', ''))
    setExistingImages(Array.isArray(unit.afbeeldingen) ? unit.afbeeldingen : [])
    setNewImages([])
    setNewImagePreviews([])
    setModalOpen(true)
  }

  function handleUnitImages(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files || [])
    const allowedFiles = files.filter((file) => file.type.startsWith('image/') && file.size <= 8 * 1024 * 1024)
    const availableSlots = Math.max(0, 8 - existingImages.length - newImages.length)
    const nextFiles = allowedFiles.slice(0, availableSlots)

    setNewImages((current) => [...current, ...nextFiles])
    setNewImagePreviews((current) => [...current, ...nextFiles.map((file) => URL.createObjectURL(file))])
    event.target.value = ''
  }

  function removeExistingImage(index: number) {
    setExistingImages((current) => current.filter((_, currentIndex) => currentIndex !== index))
  }

  function removeNewImage(index: number) {
    setNewImages((current) => current.filter((_, currentIndex) => currentIndex !== index))
    setNewImagePreviews((current) => current.filter((_, currentIndex) => currentIndex !== index))
  }

  function moveExistingImage(index: number, direction: 'up' | 'down') {
    setExistingImages((current) => {
      const targetIndex = direction === 'up' ? index - 1 : index + 1
      if (targetIndex < 0 || targetIndex >= current.length) return current

      const next = [...current]
      const currentImage = next[index]
      next[index] = next[targetIndex]
      next[targetIndex] = currentImage
      return next
    })
  }

  function moveNewImage(index: number, direction: 'up' | 'down') {
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= newImages.length) return

    setNewImages((current) => {
      const next = [...current]
      const currentImage = next[index]
      next[index] = next[targetIndex]
      next[targetIndex] = currentImage
      return next
    })

    setNewImagePreviews((current) => {
      const next = [...current]
      const currentImage = next[index]
      next[index] = next[targetIndex]
      next[targetIndex] = currentImage
      return next
    })
  }

  function setExistingAsMainPhoto(index: number) {
    setExistingImages((current) => {
      if (index === 0) return current

      const next = [...current]
      const selected = next[index]
      next.splice(index, 1)
      next.unshift(selected)
      return next
    })
  }

  function setNewAsMainPhoto(index: number) {
    setNewImages((current) => {
      if (index === 0) return current

      const next = [...current]
      const selected = next[index]
      next.splice(index, 1)
      next.unshift(selected)
      return next
    })

    setNewImagePreviews((current) => {
      if (index === 0) return current

      const next = [...current]
      const selected = next[index]
      next.splice(index, 1)
      next.unshift(selected)
      return next
    })
  }

  async function saveUnit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)

    const formData = new FormData(event.currentTarget)
    const uploadedImageUrls: string[] = []

    for (const file of newImages) {
      const filePath = `units/${projectId}/${Date.now()}-${file.name}`

      const { error: uploadError } = await supabase.storage
        .from('nieuwbouw-images')
        .upload(filePath, file, { upsert: true })

      if (uploadError) {
        console.error('Unit image upload error:', uploadError)
        setSaving(false)
        return
      }

      const { data: publicUrlData } = supabase.storage
        .from('nieuwbouw-images')
        .getPublicUrl(filePath)

      uploadedImageUrls.push(publicUrlData.publicUrl)
    }

    const payload = {
      project_id: projectId,
      titel: String(formData.get('titel') || ''),
      type_unit: unitType,
      status: unitStatus,
      prijs: String(formData.get('prijs') || ''),
      oppervlakte: Number(formData.get('oppervlakte') || 0),
      slaapkamers: Number(formData.get('slaapkamers') || 0),
      badkamers: Number(formData.get('badkamers') || 0),
      verdieping: unitFloor ? `${unitFloor}e verdieping` : '',
      terras: formData.get('terras') === 'on',
      beschrijving: String(formData.get('beschrijving') || ''),
      afbeeldingen: [...existingImages, ...uploadedImageUrls],
    }

    const { error } = editingUnit
      ? await supabase.from('nieuwbouw_units').update(payload).eq('id', editingUnit.id)
      : await supabase.from('nieuwbouw_units').insert(payload)

    setSaving(false)

    if (error) {
      console.error('Unit save error:', error)
      return
    }

    resetModal()
    fetchUnits()
  }

  async function deleteUnit(unit: ProjectUnit) {
    const confirmed = window.confirm(`Weet je zeker dat je ${unit.titel || 'deze unit'} wilt verwijderen?`)
    if (!confirmed) return

    setDeletingId(unit.id)

    const { error } = await supabase
      .from('nieuwbouw_units')
      .delete()
      .eq('id', unit.id)

    setDeletingId(null)

    if (error) {
      console.error('Unit delete error:', error)
      return
    }

    setUnits((current) => current.filter((item) => item.id !== unit.id))
  }

  function openLightbox(images: string[], index = 0) {
    if (images.length === 0) return
    setLightboxImages(images)
    setLightboxIndex(index)
  }

  function closeLightbox() {
    setLightboxImages([])
    setLightboxIndex(0)
  }

  function previousLightboxImage() {
    setLightboxIndex((current) =>
      current === 0 ? lightboxImages.length - 1 : current - 1
    )
  }

  function nextLightboxImage() {
    setLightboxIndex((current) =>
      current === lightboxImages.length - 1 ? 0 : current + 1
    )
  }

  return (
    <main className="min-h-screen bg-[#f4f7fb] p-6 lg:p-10">
      <div className="mx-auto max-w-[1400px]">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-blue-600">
              Units beheer
            </p>

            <h1 className="mt-2 text-4xl font-black tracking-[-0.04em] text-[#071B4D]">
              Alle units beheren
            </h1>
          </div>

          <div className="flex gap-3">
            <Link
              href="/dashboard/mijn-projecten"
              className="rounded-2xl border border-blue-100 bg-white px-5 py-3 text-sm font-black text-[#071B4D] transition hover:bg-blue-50"
            >
              Terug
            </Link>

            <button
              type="button"
              onClick={openAddModal}
              className="rounded-2xl bg-[#071B4D] px-5 py-3 text-sm font-black text-white transition hover:bg-[#0B2A6B]"
            >
              Unit toevoegen
            </button>
          </div>
        </div>

        <div className="rounded-[2rem] border border-blue-100 bg-white p-8 shadow-sm">
          {loading ? (
            <p className="text-lg font-black text-[#071B4D]">Units laden...</p>
          ) : units.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-blue-200 bg-[#f8fbff] px-6 py-12 text-center">
              <p className="text-lg font-black text-[#071B4D]">Nog geen units toegevoegd.</p>
              <p className="mt-2 text-sm font-semibold text-slate-500">Klik op Unit toevoegen om te beginnen.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] border-collapse text-sm text-[#071B4D]">
                <thead>
                  <tr>
                    <th className="border-b border-blue-100 px-4 py-3 text-left font-black">Unit</th>
                    <th className="border-b border-blue-100 px-4 py-3 text-left font-black">Status</th>
                    <th className="border-b border-blue-100 px-4 py-3 text-left font-black">Prijs</th>
                    <th className="border-b border-blue-100 px-4 py-3 text-left font-black">Opp.</th>
                    <th className="border-b border-blue-100 px-4 py-3 text-left font-black">Slaapkamers</th>
                    <th className="border-b border-blue-100 px-4 py-3 text-left font-black">Foto’s</th>
                    <th className="border-b border-blue-100 px-4 py-3 text-right font-black">Acties</th>
                  </tr>
                </thead>

                <tbody>
                  {units.map((unit) => (
                    <tr key={unit.id} className="border-b border-blue-100 last:border-0">
                      <td className="px-4 py-4 font-black">{unit.titel || 'Unit zonder titel'}</td>
                      <td className="px-4 py-4">
                        <span className={`rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.1em] ${
                          unit.status === 'verkocht'
                            ? 'bg-red-50 text-red-600'
                            : unit.status === 'gereserveerd'
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-blue-50 text-blue-700'
                        }`}>
                          {unit.status || 'beschikbaar'}
                        </span>
                      </td>
                      <td className="px-4 py-4">€{String(unit.prijs || '0')}</td>
                      <td className="px-4 py-4">{unit.oppervlakte || 0} m²</td>
                      <td className="px-4 py-4">{unit.slaapkamers ?? 0}</td>
                      <td className="px-4 py-4">
                        {Array.isArray(unit.afbeeldingen) && unit.afbeeldingen.length > 0 ? (
                          <div className="flex items-center gap-2">
                            <div className="flex -space-x-2">
                              {unit.afbeeldingen.slice(0, 3).map((image, index) => (
                                <button
                                  key={`${image}-${index}`}
                                  type="button"
                                  onClick={() => openLightbox(unit.afbeeldingen || [], index)}
                                  className="h-12 w-16 overflow-hidden rounded-xl border-2 border-white bg-slate-100 shadow-sm transition hover:scale-105"
                                >
                                  <img
                                    src={image}
                                    alt={`${unit.titel || 'Unit'} foto ${index + 1}`}
                                    className="h-full w-full object-cover"
                                  />
                                </button>
                              ))}
                            </div>

                            <button
                              type="button"
                              onClick={() => openLightbox(unit.afbeeldingen || [], 0)}
                              className="rounded-full bg-blue-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.1em] text-blue-700 transition hover:bg-blue-100"
                            >
                              {unit.afbeeldingen.length} foto{unit.afbeeldingen.length === 1 ? '' : '’s'}
                            </button>
                          </div>
                        ) : (
                          <span className="rounded-full bg-slate-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.1em] text-slate-400">
                            Geen foto’s
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openEditModal(unit)}
                            className="rounded-xl border border-blue-100 bg-white px-3 py-2 text-[10px] font-black uppercase tracking-[0.08em] text-[#071B4D] transition hover:bg-blue-50"
                          >
                            Bewerken
                          </button>

                          <button
                            type="button"
                            onClick={() => deleteUnit(unit)}
                            disabled={deletingId === unit.id}
                            className="rounded-xl border border-red-200 bg-white px-3 py-2 text-[10px] font-black uppercase tracking-[0.08em] text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {deletingId === unit.id ? '...' : 'Verwijderen'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-[130] overflow-y-auto bg-slate-950/70 px-4 py-8 backdrop-blur-sm">
          <div className="flex min-h-full items-start justify-center">
            <div className="my-10 w-full max-w-[780px] rounded-[2rem] bg-white p-6 shadow-[0_30px_90px_rgba(15,23,42,0.35)]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-black uppercase tracking-[0.18em] text-blue-600">
                    Unit beheer
                  </p>

                  <h2 className="mt-2 text-3xl font-black tracking-[-0.03em] text-[#071B4D]">
                    {editingUnit ? 'Unit bewerken' : 'Nieuwe unit toevoegen'}
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={resetModal}
                  className="rounded-full bg-slate-100 px-4 py-2 text-sm font-black text-slate-500 transition hover:bg-slate-200"
                >
                  Sluiten
                </button>
              </div>

              <form key={editingUnit?.id || 'new-unit'} onSubmit={saveUnit} className="mt-8 grid gap-5 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-black text-[#071B4D]">Unit titel</label>
                  <input
                    name="titel"
                    defaultValue={editingUnit?.titel || ''}
                    placeholder="Bijv. Appartement 1.2"
                    required
                    className="h-14 w-full rounded-2xl border border-blue-100 bg-white px-5 text-sm font-bold outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50 text-[#071B4D] placeholder:text-slate-400"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-black text-[#071B4D]">Type unit</label>
                  <select
                    value={unitType}
                    onChange={(event) => setUnitType(event.target.value)}
                    className="h-14 w-full appearance-none rounded-2xl border border-blue-100 bg-white px-5 text-sm font-black text-[#071B4D] outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50"
                  >
                    <option>Appartement</option>
                    <option>Penthouse</option>
                    <option>Woning</option>
                    <option>Studio</option>
                    <option>Duplex</option>
                    <option>Commerciële ruimte</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-black text-[#071B4D]">Prijs</label>
                  <input
                    name="prijs"
                    defaultValue={editingUnit?.prijs || ''}
                    placeholder="Bijv. 389000"
                    required
                    className="h-14 w-full rounded-2xl border border-blue-100 bg-white px-5 text-sm font-bold outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50 text-[#071B4D] placeholder:text-slate-400"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-black text-[#071B4D]">Slaapkamers</label>
                  <input
                    type="number"
                    name="slaapkamers"
                    min="0"
                    defaultValue={editingUnit?.slaapkamers ?? 1}
                    className="h-14 w-full rounded-2xl border border-blue-100 bg-white px-5 text-sm font-bold outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50 text-[#071B4D]"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-black text-[#071B4D]">Badkamers</label>
                  <input
                    type="number"
                    name="badkamers"
                    min="0"
                    defaultValue={editingUnit?.badkamers ?? 1}
                    className="h-14 w-full rounded-2xl border border-blue-100 bg-white px-5 text-sm font-bold outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50 text-[#071B4D]"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-black text-[#071B4D]">Oppervlakte m²</label>
                  <input
                    type="number"
                    name="oppervlakte"
                    min="0"
                    defaultValue={editingUnit?.oppervlakte || ''}
                    placeholder="Bijv. 84"
                    className="h-14 w-full rounded-2xl border border-blue-100 bg-white px-5 text-sm font-bold outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50 text-[#071B4D] placeholder:text-slate-400"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-black text-[#071B4D]">Verdieping</label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      value={unitFloor}
                      onChange={(event) => setUnitFloor(event.target.value)}
                      placeholder="Bijv. 1"
                      className="h-14 w-full rounded-2xl border border-blue-100 bg-white px-5 pr-32 text-sm font-bold outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50 text-[#071B4D] placeholder:text-slate-400"
                    />
                    <span className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 text-sm font-black text-slate-400">
                      {unitFloor ? 'e verdieping' : 'verdieping'}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-black text-[#071B4D]">Status</label>
                  <select
                    value={unitStatus}
                    onChange={(event) => setUnitStatus(event.target.value)}
                    className="h-14 w-full appearance-none rounded-2xl border border-blue-100 bg-white px-5 text-sm font-black text-[#071B4D] outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50"
                  >
                    <option value="beschikbaar">Beschikbaar</option>
                    <option value="gereserveerd">Gereserveerd</option>
                    <option value="verkocht">Verkocht</option>
                  </select>
                </div>

                <label className="mt-7 flex h-14 items-center gap-3 rounded-2xl border border-blue-100 bg-white px-5 text-sm font-black text-[#071B4D]">
                  <input type="checkbox" name="terras" defaultChecked={Boolean(editingUnit?.terras)} className="h-4 w-4" />
                  Terras aanwezig
                </label>

                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-black text-[#071B4D]">Beschrijving</label>
                  <textarea
                    name="beschrijving"
                    defaultValue={editingUnit?.beschrijving || ''}
                    rows={4}
                    placeholder="Korte beschrijving van deze unit..."
                    className="w-full rounded-3xl border border-blue-100 bg-white px-5 py-4 text-sm font-semibold text-[#071B4D] placeholder:text-slate-400 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50"
                  />
                </div>

                <div className="md:col-span-2 rounded-[2rem] border border-blue-100 bg-white p-5">
                  <div className="flex flex-wrap items-end justify-between gap-3">
                    <div>
                      <label className="block text-sm font-black text-[#071B4D]">Unit afbeeldingen</label>
                      <p className="mt-1 text-xs font-semibold text-slate-500">
                        Voeg foto’s toe, verwijder foto’s of wijzig de volgorde. De eerste foto wordt de hoofdfoto.
                      </p>
                    </div>

                    <span className="rounded-full bg-blue-50 px-4 py-2 text-xs font-black text-blue-700">
                      {existingImages.length + newImages.length}/8 foto’s
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
                    <span className="mt-1 text-xs font-semibold text-slate-500">JPG, PNG of WEBP tot 8 MB per foto.</span>
                  </label>

                  {(existingImages.length > 0 || newImagePreviews.length > 0) && (
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      {existingImages.map((image, index) => (
                        <div key={`${image}-${index}`} className="overflow-hidden rounded-2xl border border-blue-100 bg-white">
                          <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
                            <img src={image} alt={`Unit afbeelding ${index + 1}`} className="h-full w-full object-cover" />
                            <div className="absolute left-3 top-3 flex flex-col gap-2">
                              <button
                                type="button"
                                onClick={() => setExistingAsMainPhoto(index)}
                                className="rounded-full bg-[#071B4D]/95 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.08em] text-white shadow-sm backdrop-blur-sm transition hover:bg-[#0B2A6B]"
                              >
                                ★ Kies als hoofdfoto
                              </button>

                              <div className="flex gap-1">
                                <button
                                  type="button"
                                  onClick={() => moveExistingImage(index, 'up')}
                                  disabled={index === 0}
                                  className="grid h-8 w-8 place-items-center rounded-full bg-white/90 text-sm font-black text-[#071B4D] shadow-sm backdrop-blur-sm transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                  ↑
                                </button>

                                <button
                                  type="button"
                                  onClick={() => moveExistingImage(index, 'down')}
                                  disabled={index === existingImages.length - 1}
                                  className="grid h-8 w-8 place-items-center rounded-full bg-white/90 text-sm font-black text-[#071B4D] shadow-sm backdrop-blur-sm transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                  ↓
                                </button>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => removeExistingImage(index)}
                              className="absolute right-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-black text-red-600 shadow-sm backdrop-blur-sm transition hover:bg-red-50"
                            >
                              Verwijder
                            </button>
                          </div>
                        </div>
                      ))}

                      {newImagePreviews.map((image, index) => (
                        <div key={`${image}-${index}`} className="overflow-hidden rounded-2xl border border-blue-100 bg-white">
                          <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
                            <img src={image} alt={`Nieuwe unit afbeelding ${index + 1}`} className="h-full w-full object-cover" />
                            <div className="absolute left-3 top-3 flex flex-col gap-2">
                              <button
                                type="button"
                                onClick={() => setNewAsMainPhoto(index)}
                                className="rounded-full bg-[#071B4D]/95 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.08em] text-white shadow-sm backdrop-blur-sm transition hover:bg-[#0B2A6B]"
                              >
                                ★ Kies als hoofdfoto
                              </button>

                              <div className="flex gap-1">
                                <button
                                  type="button"
                                  onClick={() => moveNewImage(index, 'up')}
                                  disabled={index === 0}
                                  className="grid h-8 w-8 place-items-center rounded-full bg-white/90 text-sm font-black text-[#071B4D] shadow-sm backdrop-blur-sm transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                  ↑
                                </button>

                                <button
                                  type="button"
                                  onClick={() => moveNewImage(index, 'down')}
                                  disabled={index === newImagePreviews.length - 1}
                                  className="grid h-8 w-8 place-items-center rounded-full bg-white/90 text-sm font-black text-[#071B4D] shadow-sm backdrop-blur-sm transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                  ↓
                                </button>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => removeNewImage(index)}
                              className="absolute right-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-black text-red-600 shadow-sm backdrop-blur-sm transition hover:bg-red-50"
                            >
                              Verwijder
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="md:col-span-2 flex flex-wrap justify-end gap-3 border-t border-blue-50 pt-6">
                  <button
                    type="button"
                    onClick={resetModal}
                    className="rounded-2xl border border-blue-100 bg-white px-6 py-4 text-sm font-black text-[#071B4D] transition hover:bg-slate-50"
                  >
                    Annuleren
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-2xl bg-[#071B4D] px-6 py-4 text-sm font-black text-white transition hover:bg-[#0B2A6B] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {saving ? 'Opslaan...' : editingUnit ? 'Unit bijwerken' : 'Unit opslaan'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      {lightboxImages.length > 0 && (
        <div className="fixed inset-0 z-[160] bg-slate-950/90 px-4 py-6 backdrop-blur-sm">
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
                    onClick={previousLightboxImage}
                    className="absolute left-4 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-white text-2xl font-black text-[#071B4D] shadow-lg transition hover:bg-blue-50"
                  >
                    ‹
                  </button>

                  <button
                    type="button"
                    onClick={nextLightboxImage}
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