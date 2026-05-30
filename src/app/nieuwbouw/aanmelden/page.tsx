'use client'

import { FormEvent, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

export default function NieuwbouwAanmeldenPage() {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = event.currentTarget
    setLoading(true)
    setError('')

    const formData = new FormData(form)
    const imageFiles = formData
      .getAll('projectafbeeldingen')
      .filter((file): file is File => file instanceof File && file.size > 0)

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setLoading(false)
      setError('Je moet ingelogd zijn om een project aan te melden.')
      return
    }

    const imageUrls: string[] = []

    for (const file of imageFiles) {
      const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '-')
      const filePath = `${Date.now()}-${crypto.randomUUID()}-${safeFileName}`

      const { error: uploadError } = await supabase.storage
        .from('nieuwbouw-images')
        .upload(filePath, file)

      if (uploadError) {
        console.error('Nieuwbouw image upload error:', uploadError)
        continue
      }

      const { data } = supabase.storage.from('nieuwbouw-images').getPublicUrl(filePath)
      imageUrls.push(data.publicUrl)
    }

    const { error: insertError } = await supabase
      .from('nieuwbouw_projecten')
      .insert({
        user_id: user.id,
        projectnaam: String(formData.get('projectnaam') || ''),
        stad: String(formData.get('stad') || ''),
        postcode: String(formData.get('postcode') || ''),
        aantal_units: Number(formData.get('aantal_units') || 0),
        vanaf_prijs: String(formData.get('vanaf_prijs') || ''),
        beschrijving: String(formData.get('beschrijving') || ''),
        contactpersoon: String(formData.get('contactpersoon') || ''),
        email: String(formData.get('email') || ''),
        telefoonnummer: String(formData.get('telefoonnummer') || ''),
        afbeeldingen: imageUrls,
      })

    setLoading(false)

    if (insertError) {
      console.error('Nieuwbouw project insert error:', insertError)
      setError(`Het project kon niet worden aangemeld: ${insertError.message}`)
      return
    }

    setSuccess(true)
    form.reset()
    window.location.href = '/nieuwbouw?submitted=1'
  }
  return (
    <main className="min-h-screen bg-[#f6f8fb] px-6 py-16 text-[#071B4D] md:px-10 lg:px-16">
      <div className="mx-auto max-w-[1100px]">
        <div className="rounded-[2.5rem] border border-blue-100 bg-white p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)] md:p-12">
          <span className="inline-flex rounded-full bg-blue-50 px-4 py-2 text-sm font-black uppercase tracking-[0.14em] text-blue-700">
            Voor ontwikkelaars
          </span>

          <h1 className="mt-6 text-5xl font-black tracking-[-0.04em] text-[#071B4D]">
            Nieuwbouwproject aanmelden
          </h1>

          <p className="mt-5 max-w-3xl text-lg font-medium leading-8 text-slate-600">
            Meld je nieuwbouwproject aan op SlimWoning en bereik kopers die actief zoeken naar moderne,
            energiezuinige woningen en investeringsprojecten.
          </p>

          <form onSubmit={handleSubmit} className="mt-12 grid gap-6 md:grid-cols-2">
            <div>
              <label className="mb-3 block text-sm font-black text-[#071B4D]">
                Projectnaam
              </label>
              <input
                type="text"
                name="projectnaam"
                required
                placeholder="Bijv. Residentie Parkzicht"
                className="h-14 w-full rounded-2xl border border-blue-100 bg-[#f8fbff] px-5 text-sm font-bold outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50"
              />
            </div>

            <div>
              <label className="mb-3 block text-sm font-black text-[#071B4D]">
                Stad
              </label>
              <input
                type="text"
                name="stad"
                required
                placeholder="Bijv. Antwerpen"
                className="h-14 w-full rounded-2xl border border-blue-100 bg-[#f8fbff] px-5 text-sm font-bold outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50"
              />
            </div>

            <div>
              <label className="mb-3 block text-sm font-black text-[#071B4D]">
                Postcode
              </label>
              <input
                type="text"
                name="postcode"
                required
                placeholder="2000"
                className="h-14 w-full rounded-2xl border border-blue-100 bg-[#f8fbff] px-5 text-sm font-bold outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50"
              />
            </div>

            <div>
              <label className="mb-3 block text-sm font-black text-[#071B4D]">
                Aantal units
              </label>
              <input
                type="number"
                name="aantal_units"
                required
                placeholder="18"
                className="h-14 w-full rounded-2xl border border-blue-100 bg-[#f8fbff] px-5 text-sm font-bold outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50"
              />
            </div>

            <div>
              <label className="mb-3 block text-sm font-black text-[#071B4D]">
                Vanaf prijs
              </label>
              <input
                type="text"
                name="vanaf_prijs"
                required
                placeholder="€ 349.000"
                className="h-14 w-full rounded-2xl border border-blue-100 bg-[#f8fbff] px-5 text-sm font-bold outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-3 block text-sm font-black text-[#071B4D]">
                Beschrijving
              </label>
              <textarea
                name="beschrijving"
                rows={6}
                placeholder="Beschrijf je project..."
                className="w-full rounded-3xl border border-blue-100 bg-[#f8fbff] px-5 py-4 text-sm font-semibold outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-3 block text-sm font-black text-[#071B4D]">
                Projectafbeeldingen
              </label>

              <input
                type="file"
                name="projectafbeeldingen"
                multiple
                accept="image/*"
                className="w-full rounded-3xl border border-dashed border-blue-200 bg-[#f8fbff] px-5 py-5 text-sm font-semibold text-slate-500"
              />
            </div>

            <div>
              <label className="mb-3 block text-sm font-black text-[#071B4D]">
                Contactpersoon
              </label>
              <input
                type="text"
                name="contactpersoon"
                required
                placeholder="Naam"
                className="h-14 w-full rounded-2xl border border-blue-100 bg-[#f8fbff] px-5 text-sm font-bold outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50"
              />
            </div>

            <div>
              <label className="mb-3 block text-sm font-black text-[#071B4D]">
                E-mail
              </label>
              <input
                type="email"
                name="email"
                required
                placeholder="naam@bedrijf.be"
                className="h-14 w-full rounded-2xl border border-blue-100 bg-[#f8fbff] px-5 text-sm font-bold outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50"
              />
            </div>

            <div>
              <label className="mb-3 block text-sm font-black text-[#071B4D]">
                Telefoonnummer
              </label>
              <input
                type="tel"
                name="telefoonnummer"
                placeholder="+32 470 12 34 56"
                className="h-14 w-full rounded-2xl border border-blue-100 bg-[#f8fbff] px-5 text-sm font-bold outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50"
              />
            </div>

            {success && (
              <div className="md:col-span-2 rounded-3xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-black text-emerald-700">
                Je project werd succesvol aangemeld. We nemen zo snel mogelijk contact met je op.
              </div>
            )}

            {error && (
              <div className="md:col-span-2 rounded-3xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-black text-red-600">
                {error}
              </div>
            )}

            <div className="md:col-span-2 flex flex-wrap items-center gap-4 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="rounded-2xl bg-[#071B4D] px-8 py-4 text-sm font-black text-white shadow-lg shadow-blue-900/15 transition hover:-translate-y-0.5 hover:bg-[#0B2A6B] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? 'Bezig met aanmelden...' : 'Project aanmelden'}
              </button>

              <p className="text-sm font-semibold text-slate-500">
                We nemen zo snel mogelijk contact met je op.
              </p>
            </div>
          </form>
        </div>
      </div>
    </main>
  )
}