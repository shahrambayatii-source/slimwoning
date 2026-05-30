'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { WONINGKENMERKEN_OPTIONS, toggleWoningkenmerk } from '@/lib/woningkenmerken'

export default function EditPropertyPage() {
  const params = useParams()
  const router = useRouter()

  const [title, setTitle] = useState('')
  const [price, setPrice] = useState('')
  const [city, setCity] = useState('')
  const [description, setDescription] = useState('')
  const [images, setImages] = useState<string[]>([])

  const [slaapkamers, setSlaapkamers] = useState('')
  const [badkamers, setBadkamers] = useState('')
  const [bewoonbareOppervlakte, setBewoonbareOppervlakte] = useState('')
  const [grondoppervlakte, setGrondoppervlakte] = useState('')
  const [bouwjaar, setBouwjaar] = useState('')
  const [epc, setEpc] = useState('')
  const [woningType, setWoningType] = useState('')
  const [verwarmingstype, setVerwarmingstype] = useState('')
  const [pluspunten, setPluspunten] = useState('')
  const [minpunten, setMinpunten] = useState('')
  const [woningkenmerken, setWoningkenmerken] = useState<string[]>([])

  const [parking, setParking] = useState(false)
  const [tuin, setTuin] = useState(false)
  const [terras, setTerras] = useState(false)
  const [lift, setLift] = useState(false)
  const [gemeubeld, setGemeubeld] = useState(false)
  const [dubbelGlas, setDubbelGlas] = useState(false)

  const inputClass =
    'h-14 w-full rounded-2xl border border-gray-200 bg-[#f8fafc] px-5 text-[15px] text-[#111827] outline-none transition placeholder:text-gray-400 focus:border-blue-600'
  const textareaClass =
    'min-h-32 w-full rounded-2xl border border-gray-200 bg-[#f8fafc] p-5 text-[15px] text-[#111827] outline-none transition placeholder:text-gray-400 focus:border-blue-600'

  function cleanWoningType(value: unknown) {
    const text = String(value || '').trim()

    if (!text) return ''
    if (!Number.isNaN(Number(text))) return ''

    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()
  }

  function onlyNumbers(value: string) {
    return value.replace(/[^\d]/g, '')
  }

  function getPropertyImages(property: Record<string, unknown>) {
    const imageSources = [
      ...(Array.isArray(property.images) ? property.images : []),
      ...(Array.isArray(property.photos) ? property.photos : []),
      property.image,
      property.photo,
    ]

    return Array.from(
      new Set(
        imageSources
          .map((source) => String(source || '').trim())
          .filter(Boolean)
      )
    )
  }

  function isAcceptedImage(file: File) {
    const acceptedTypes = ['image/jpeg', 'image/png', 'image/webp']
    const acceptedExtensions = ['jpg', 'jpeg', 'png', 'webp']
    const extension = file.name.split('.').pop()?.toLowerCase() || ''

    return acceptedTypes.includes(file.type) || acceptedExtensions.includes(extension)
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])

    if (files.length === 0) return

    const validFiles = files.filter(isAcceptedImage)

    if (validFiles.length !== files.length) {
      alert('Je kunt alleen jpg, jpeg, png of webp foto’s uploaden.')
    }

    if (validFiles.length === 0) {
      e.target.value = ''
      return
    }

    const uploadedImages: string[] = []

    for (const file of validFiles) {
      const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-')
      const fileName = `${Date.now()}-${crypto.randomUUID()}-${safeFileName}`

      const { error } = await supabase.storage
        .from('properties')
        .upload(fileName, file)

      if (error) {
        alert(`Upload fout: ${error.message}`)
        console.log(error)
        continue
      }

      const { data } = supabase.storage
        .from('properties')
        .getPublicUrl(fileName)

      uploadedImages.push(data.publicUrl)
    }

    if (uploadedImages.length > 0) {
      setImages((current) => {
        return Array.from(new Set([...current, ...uploadedImages]))
      })
    }

    e.target.value = ''
  }

  function handleRemoveImage(imageToRemove: string) {
    setImages((current) => {
      return current.filter((currentImage) => currentImage !== imageToRemove)
    })
  }

  useEffect(() => {
    let isMounted = true

    async function loadProperty() {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('id', params.id)
        .single()

      if (error) {
        alert(error.message)
        console.log(error)
        return
      }

      if (!isMounted) return

      setTitle(data.title || '')
      setPrice(data.price || '')
      setCity(data.city || '')
      setDescription(data.description || '')

      const existingImages = getPropertyImages(data)
      setImages(existingImages)

      setSlaapkamers(data.slaapkamers || '')
      setBadkamers(data.badkamers || '')
      setBewoonbareOppervlakte(data.bewoonbare_oppervlakte || '')
      setGrondoppervlakte(data.grondoppervlakte || '')
      setBouwjaar(data.bouwjaar || '')
      setEpc(data.epc || '')
      setWoningType(cleanWoningType(data.woning_type))
      setVerwarmingstype(data.verwarmingstype || '')
      setPluspunten(data.pluspunten || '')
      setMinpunten(data.minpunten || '')
      setWoningkenmerken(Array.isArray(data.woningkenmerken) ? data.woningkenmerken : [])

      setParking(Boolean(data.parking))
      setTuin(Boolean(data.tuin))
      setTerras(Boolean(data.terras))
      setLift(Boolean(data.lift))
      setGemeubeld(Boolean(data.gemeubeld))
      setDubbelGlas(Boolean(data.dubbel_glas))
    }

    loadProperty()

    return () => {
      isMounted = false
    }
  }, [params.id])

  async function handleUpdateProperty() {
    if (!title.trim()) {
      alert('Titel is verplicht')
      return
    }

    if (!price.trim()) {
      alert('Prijs is verplicht')
      return
    }

    if (!city.trim()) {
      alert('Stad is verplicht')
      return
    }

    if (!woningType.trim()) {
      alert('Type woning is verplicht')
      return
    }

    const nextImages = images.filter(Boolean)
    const mainImage = nextImages[0] || ''

    const { error } = await supabase
      .from('properties')
      .update({
        title: title.trim(),
        price: onlyNumbers(price),
        city: city.trim(),
        description: description.trim(),
        image: mainImage,
        images: nextImages,
        slaapkamers: onlyNumbers(slaapkamers),
        badkamers: onlyNumbers(badkamers),
        bewoonbare_oppervlakte: onlyNumbers(bewoonbareOppervlakte),
        grondoppervlakte: onlyNumbers(grondoppervlakte),
        bouwjaar: onlyNumbers(bouwjaar),
        epc: epc.trim().toUpperCase(),
        woning_type: woningType,
        verwarmingstype: verwarmingstype.trim(),
        pluspunten: pluspunten.trim(),
        minpunten: minpunten.trim(),
        woningkenmerken,
        parking,
        tuin,
        terras,
        lift,
        gemeubeld,
        dubbel_glas: dubbelGlas,
      })
      .eq('id', params.id)

    if (error) {
      alert(`Database fout: ${error.message}`)
      console.log(error)
      return
    }

    router.push(`/properties/${params.id}`)
  }

  return (
    <div className="min-h-screen bg-[#f6f8fb] px-5 py-8 text-[#111827] md:px-10">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="mb-3 text-sm font-bold uppercase tracking-[0.3em] text-blue-700">
              SlimWoning
            </p>

            <h1 className="text-4xl font-bold md:text-5xl">
              Woning bewerken
            </h1>

            <p className="mt-3 text-gray-600">
              Pas de woninggegevens aan. Stad, prijs en type woning worden nu gecontroleerd.
            </p>
          </div>

          <Link
            href={`/properties/${params.id}`}
            className="w-fit rounded-2xl bg-white px-5 py-3 font-bold text-[#111827] shadow-sm"
          >
            Terug naar woning
          </Link>
        </div>

        <FormSection title="Basisinformatie">
          <div className="grid grid-cols-1 gap-4">
            <input
              className={inputClass}
              placeholder="Titel"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />

            <input
              className={inputClass}
              placeholder="Prijs"
              inputMode="numeric"
              value={price}
              onChange={(e) => setPrice(onlyNumbers(e.target.value))}
            />

            <input
              className={inputClass}
              placeholder="Stad"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />

            <textarea
              className={textareaClass}
              placeholder="Beschrijving"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </FormSection>

        <FormSection title="Woningdetails">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <input
              className={inputClass}
              placeholder="Aantal slaapkamers"
              inputMode="numeric"
              value={slaapkamers}
              onChange={(e) => setSlaapkamers(onlyNumbers(e.target.value))}
            />

            <input
              className={inputClass}
              placeholder="Aantal badkamers"
              inputMode="numeric"
              value={badkamers}
              onChange={(e) => setBadkamers(onlyNumbers(e.target.value))}
            />

            <input
              className={inputClass}
              placeholder="Bewoonbare oppervlakte (m²)"
              inputMode="numeric"
              value={bewoonbareOppervlakte}
              onChange={(e) => setBewoonbareOppervlakte(onlyNumbers(e.target.value))}
            />

            <input
              className={inputClass}
              placeholder="Grondoppervlakte (m²)"
              inputMode="numeric"
              value={grondoppervlakte}
              onChange={(e) => setGrondoppervlakte(onlyNumbers(e.target.value))}
            />

            <input
              className={inputClass}
              placeholder="Bouwjaar"
              inputMode="numeric"
              maxLength={4}
              value={bouwjaar}
              onChange={(e) => setBouwjaar(onlyNumbers(e.target.value).slice(0, 4))}
            />

            <select
              className={inputClass}
              value={epc}
              onChange={(e) => setEpc(e.target.value)}
            >
              <option value="">EPC-score</option>
              <option value="A+">A+</option>
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="C">C</option>
              <option value="D">D</option>
              <option value="E">E</option>
              <option value="F">F</option>
            </select>

            <select
              className={inputClass}
              value={woningType}
              onChange={(e) => setWoningType(e.target.value)}
            >
              <option value="">Type woning</option>
              <option value="Appartement">Appartement</option>
              <option value="Huis">Huis</option>
              <option value="Studio">Studio</option>
              <option value="Commercieel">Commercieel</option>
              <option value="Garage">Garage</option>
              <option value="Grond">Grond</option>
              <option value="Opbrengsteigendom">Opbrengsteigendom</option>
              <option value="Appartementsblok">Appartementsblok</option>
            </select>

            <select
              className={inputClass}
              value={verwarmingstype}
              onChange={(e) => setVerwarmingstype(e.target.value)}
            >
              <option value="">Verwarmingstype</option>
              <option value="Gas">Gas</option>
              <option value="Elektrisch">Elektrisch</option>
              <option value="Warmtepomp">Warmtepomp</option>
              <option value="Mazout">Mazout</option>
              <option value="Vloerverwarming">Vloerverwarming</option>
              <option value="Niet opgegeven">Niet opgegeven</option>
            </select>
          </div>
        </FormSection>

        <FormSection title="Woningkenmerken">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {WONINGKENMERKEN_OPTIONS.map((kenmerk) => (
              <CheckBox
                key={kenmerk}
                label={kenmerk}
                checked={woningkenmerken.includes(kenmerk)}
                onChange={() => setWoningkenmerken((current) => toggleWoningkenmerk(current, kenmerk))}
              />
            ))}
          </div>
        </FormSection>

        <FormSection title="Voorzieningen">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            <CheckBox label="Parking" checked={parking} onChange={setParking} />
            <CheckBox label="Tuin" checked={tuin} onChange={setTuin} />
            <CheckBox label="Terras" checked={terras} onChange={setTerras} />
            <CheckBox label="Lift" checked={lift} onChange={setLift} />
            <CheckBox label="Gemeubeld" checked={gemeubeld} onChange={setGemeubeld} />
            <CheckBox label="Dubbel glas" checked={dubbelGlas} onChange={setDubbelGlas} />
          </div>
        </FormSection>

        <FormSection title="Beoordeling">
          <div className="grid grid-cols-1 gap-4">
            <textarea
              className={textareaClass}
              placeholder="Pluspunten van de woning"
              value={pluspunten}
              onChange={(e) => setPluspunten(e.target.value)}
            />

            <textarea
              className={textareaClass}
              placeholder="Minpunten van de woning"
              value={minpunten}
              onChange={(e) => setMinpunten(e.target.value)}
            />
          </div>
        </FormSection>

        <FormSection title="Foto's">
          <input
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
            onChange={handleImageUpload}
            className="w-full rounded-2xl border border-gray-200 bg-[#f8fafc] p-4 text-[#111827]"
          />

          {images.length > 0 && (
            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {images.map((photo, index) => (
                <div
                  key={photo}
                  className="group relative overflow-hidden rounded-[2rem] bg-[#f8fafc] shadow-sm"
                >
                  <img
                    src={photo}
                    alt={`Woningfoto ${index + 1}`}
                    className="h-56 w-full object-cover"
                  />

                  {index === 0 && (
                    <span className="absolute left-3 top-3 rounded-full bg-blue-700 px-3 py-1 text-xs font-bold text-white shadow-sm">
                      Hoofdfoto
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={() => handleRemoveImage(photo)}
                    className="absolute right-3 top-3 rounded-full bg-white/95 px-3 py-1 text-sm font-bold text-[#111827] shadow-sm transition hover:bg-red-600 hover:text-white"
                    aria-label={`Verwijder woningfoto ${index + 1}`}
                  >
                    Verwijder
                  </button>
                </div>
              ))}
            </div>
          )}
        </FormSection>

        <button
          onClick={handleUpdateProperty}
          className="rounded-2xl bg-blue-700 p-5 text-lg font-bold text-white transition hover:bg-blue-800"
        >
          Wijzigingen opslaan
        </button>
      </div>
    </div>
  )
}

function FormSection({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-[2rem] bg-white p-6 shadow-lg md:p-7">
      <h2 className="mb-5 text-2xl font-bold">{title}</h2>
      {children}
    </section>
  )
}

function CheckBox({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <label className="flex items-center gap-3 rounded-2xl bg-[#f8fafc] p-4 font-semibold text-[#111827]">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-5 w-5"
      />
      {label}
    </label>
  )
}
