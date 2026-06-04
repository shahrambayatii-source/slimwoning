import Link from 'next/link'

type Makelaar = {
  name: string
  office: string
  location: string
  distance: string
  matchScore: number
  specialties: string[]
  email: string
  phone: string
  address: string
  website: string
  lat: number
  lng: number
}

type GooglePlaceResult = {
  place_id: string
  name: string
  formatted_address?: string
  geometry?: {
    location?: {
      lat: number
      lng: number
    }
  }
}

const makelaarsByGemeente: Record<string, Makelaar[]> = {
  gent: [
    {
      name: 'Agence Rosseel Gent',
      office: 'Agence Rosseel Gent',
      location: 'Gent',
      distance: '',
      matchScore: 97,
      specialties: ['Gent', 'Huizen', 'Appartementen'],
      email: 'info@rosseel.be',
      phone: '+32 9 220 50 00',
      address: 'Kortrijksesteenweg 672, 9000 Gent',
      website: 'https://rosseel.be/over-agence-rosseel/kantoren/kantoor-gent',
      lat: 51.0381,
      lng: 3.7157,
    },
    {
      name: 'Agence Rosseel Gent Noord',
      office: 'Agence Rosseel Gent Noord',
      location: 'Gent Noord',
      distance: '',
      matchScore: 95,
      specialties: ['Gent Noord', 'Huizen', 'Appartementen'],
      email: 'info@rosseel.be',
      phone: '+32 9 220 50 00',
      address: 'Antwerpsesteenweg 376, 9040 Sint-Amandsberg',
      website: 'https://rosseel.be/contact',
      lat: 51.0649,
      lng: 3.7536,
    },
    {
      name: 'Dewaele Gent',
      office: 'Dewaele Gent',
      location: 'Gent',
      distance: '',
      matchScore: 92,
      specialties: ['Gent', 'Huizen', 'Appartementen'],
      email: 'gent@dewaele.com',
      phone: '+32 9 234 34 34',
      address: 'Kortrijksesteenweg 292, 9000 Gent',
      website: 'https://www.dewaele.com/nl/kantoren/gent',
      lat: 51.0361,
      lng: 3.7139,
    },
    {
      name: 'Immo Da Vinci Gent',
      office: 'Immo Da Vinci',
      location: 'Gent',
      distance: '',
      matchScore: 90,
      specialties: ['Gent', 'Huizen', 'Appartementen'],
      email: 'info@immodavinci.be',
      phone: '+32 9 277 99 99',
      address: 'Koningin Elisabethlaan 25, 9000 Gent',
      website: 'https://www.immodavinci.be/',
      lat: 51.0465,
      lng: 3.7172,
    },
    {
      name: 'Engel & Völkers Gent',
      office: 'Engel & Völkers Gent',
      location: 'Gent',
      distance: '',
      matchScore: 89,
      specialties: ['Gent', 'Premium', 'Appartementen'],
      email: 'gent@engelvoelkers.com',
      phone: '+32 9 243 94 36',
      address: 'Hoogstraat 19, 9000 Gent',
      website: 'https://www.engelvoelkers.com/be/nl/shops/gent',
      lat: 51.0557,
      lng: 3.7206,
    },
    {
      name: 'CENTURY 21 Woonkantoor',
      office: 'CENTURY 21 Woonkantoor',
      location: 'Gent',
      distance: '',
      matchScore: 87,
      specialties: ['Gent', 'Huizen', 'Appartementen'],
      email: 'info@century21woonkantoor.be',
      phone: '+32 9 222 27 76',
      address: 'Hundelgemsesteenweg 57, 9050 Gent',
      website: 'https://www.century21.be/nl/kantoor/century-21-woonkantoor/-3iBaHQBHQt8ouNfnYuk',
      lat: 51.0382,
      lng: 3.7342,
    },
    {
      name: 'CENTURY 21 Partners',
      office: 'CENTURY 21 Partners',
      location: 'Gent',
      distance: '',
      matchScore: 86,
      specialties: ['Gent', 'Huizen', 'Appartementen'],
      email: 'info@century21partners.be',
      phone: '+32 9 233 39 33',
      address: 'Dendermondsesteenweg 39, 9000 Gent',
      website: 'https://www.century21.be/nl/kantoor/century-21-partners/NsT1v5oBkKpB5b5Lb0_V',
      lat: 51.0550,
      lng: 3.7364,
    },
    {
      name: 'TOP Vastgoed Wondelgem',
      office: 'TOP Vastgoed',
      location: 'Wondelgem',
      distance: '',
      matchScore: 85,
      specialties: ['Wondelgem', 'Huizen', 'Gent'],
      email: 'info@topvastgoed.be',
      phone: '+32 9 274 15 53',
      address: 'Botestraat 98, 9032 Wondelgem',
      website: 'https://topvastgoed.be/',
      lat: 51.0887,
      lng: 3.7145,
    },
    {
      name: 'TOP Vastgoed Mariakerke',
      office: 'TOP Vastgoed',
      location: 'Mariakerke',
      distance: '',
      matchScore: 84,
      specialties: ['Mariakerke', 'Huizen', 'Gent'],
      email: 'info@topvastgoed.be',
      phone: '+32 9 274 15 53',
      address: 'Brugsesteenweg 540, 9030 Mariakerke',
      website: 'https://topvastgoed.be/',
      lat: 51.0736,
      lng: 3.6893,
    },
  ],
  brussel: [
    {
      name: 'Amine Peeters',
      office: 'Brussels Home Brokers',
      location: 'Brussel centrum',
      distance: '1,8 km',
      matchScore: 93,
      specialties: ['Appartementen', 'Brussel', 'Investeerders'],
      email: 'contact@brusselshomebrokers.be',
      phone: '+32 2 000 00 01',
      address: 'Anspachlaan 55, 1000 Brussel',
      website: 'www.brusselshomebrokers.be',
      lat: 50.8466,
      lng: 4.3528,
    },
    {
      name: 'Laura Janssens',
      office: 'Immo Capital',
      location: 'Elsene',
      distance: '2,7 km',
      matchScore: 89,
      specialties: ['Stadswoningen', 'Prijsstrategie', 'EPC'],
      email: 'info@immocapital.be',
      phone: '+32 2 000 00 02',
      address: 'Louizalaan 210, 1050 Elsene',
      website: 'www.immocapital.be',
      lat: 50.8333,
      lng: 4.3667,
    },
  ],
}

function normalizeGemeente(value?: string | null) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace('brussels', 'brussel')
}

function getDistanceKm(from: { lat: number; lng: number }, to: { lat: number; lng: number }) {
  const earthRadiusKm = 6371
  const toRad = (value: number) => (value * Math.PI) / 180
  const dLat = toRad(to.lat - from.lat)
  const dLng = toRad(to.lng - from.lng)
  const lat1 = toRad(from.lat)
  const lat2 = toRad(to.lat)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return earthRadiusKm * c
}

function formatDistance(distanceKm: number) {
  return `${distanceKm.toFixed(1).replace('.', ',')} km`
}

function getWebsiteUrl(website: string) {
  if (!website) return '#'
  return website.startsWith('http') ? website : `https://${website}`
}

function getHostname(website: string) {
  return website.replace(/^https?:\/\//, '').replace(/\/$/, '')
}

function getCityMakelaarsSearchUrl(city: string) {
  return `https://www.google.com/maps/search/${encodeURIComponent(`vastgoedmakelaar in ${city}`)}`
}

async function getPlaceDetails(placeId: string) {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY
  if (!apiKey) return null

  try {
    const url = new URL('https://maps.googleapis.com/maps/api/place/details/json')
    url.searchParams.set('place_id', placeId)
    url.searchParams.set('fields', 'website,formatted_phone_number')
    url.searchParams.set('key', apiKey)

    const response = await fetch(url.toString(), { next: { revalidate: 60 * 60 * 24 } })
    const data = await response.json()

    return data?.result || null
  } catch {
    return null
  }
}

async function fetchMakelaarsFromGooglePlaces(city: string, property: { lat: number; lng: number }) {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY
  if (!apiKey) return null

  try {
    const url = new URL('https://maps.googleapis.com/maps/api/place/textsearch/json')
    url.searchParams.set('query', `vastgoedmakelaar in ${city}`)
    url.searchParams.set('language', 'nl')
    url.searchParams.set('key', apiKey)

    const response = await fetch(url.toString(), { next: { revalidate: 60 * 60 * 24 } })
    const data = await response.json()
    const results: GooglePlaceResult[] = Array.isArray(data?.results) ? data.results : []

    if (results.length === 0) return []

    const enrichedMakelaars = await Promise.all(
      results.map(async (place, index) => {
        const details = await getPlaceDetails(place.place_id)
        const lat = place.geometry?.location?.lat ?? property.lat
        const lng = place.geometry?.location?.lng ?? property.lng

        return {
          name: place.name,
          office: place.name,
          location: city,
          distance: '',
          matchScore: Math.max(70, 96 - index),
          specialties: [city, 'Vastgoedmakelaar', 'Google Maps'],
          email: '',
          phone: details?.formatted_phone_number || 'Niet opgegeven',
          address: place.formatted_address || city,
          website: details?.website || getCityMakelaarsSearchUrl(city),
          lat,
          lng,
        } satisfies Makelaar
      }),
    )

    return enrichedMakelaars
  } catch {
    return null
  }
}


function getMockProperty(id?: string) {
  const safeId = String(id || '')
  const isBrussel = safeId.toLowerCase().includes('brussel')

  return {
    id: safeId,
    title: isBrussel ? 'Appartement' : 'Moderne gezinswoning in Gent',
    address: isBrussel ? 'Brussel' : 'Kortrijksesteenweg 145',
    gemeente: isBrussel ? 'Brussel' : 'Gent',
    deelgemeente: isBrussel ? 'Brussel centrum' : 'Gent centrum',
    type: isBrussel ? 'Appartement' : 'Huis',
    lat: isBrussel ? 50.8466 : 51.0362,
    lng: isBrussel ? 4.3528 : 3.7167,
  }
}

export default async function MakelaarAanvraagPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const property = getMockProperty(id)
  const gemeenteKey = normalizeGemeente(property.gemeente)
  const googleMakelaars = await fetchMakelaarsFromGooglePlaces(property.gemeente, {
    lat: property.lat,
    lng: property.lng,
  })
  const sourceMakelaars = googleMakelaars && googleMakelaars.length > 0
    ? googleMakelaars
    : (makelaarsByGemeente[gemeenteKey] || [])
  const matchedMakelaars = sourceMakelaars
    .map((makelaar) => {
      const distanceKm = getDistanceKm(
        { lat: property.lat, lng: property.lng },
        { lat: makelaar.lat, lng: makelaar.lng },
      )

      return {
        ...makelaar,
        distance: formatDistance(distanceKm),
        distanceKm,
      }
    })
    .sort((a, b) => a.distanceKm - b.distanceKm)

  return (
    <div className="min-h-screen bg-[#f6f8fb] px-6 py-8 text-[#111827]">
      <div className="mx-auto max-w-6xl">
        <Link
          href={`/dashboard/properties/${id}`}
          className="inline-flex rounded-2xl bg-white px-5 py-3 font-bold text-[#111827] shadow-sm transition hover:bg-slate-50"
        >
          ← Terug naar woning
        </Link>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-[2rem] bg-white p-8 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-blue-700">
              Makelaar matching
            </p>

            <h1 className="mt-3 text-4xl font-black tracking-[-0.03em] text-[#071B4D]">
              Makelaars in {property.gemeente}
            </h1>

            <p className="mt-4 text-lg leading-8 text-slate-600">
              We zoeken makelaars in de stad van de woning en sorteren ze van dichtstbij naar verst weg. Met een Google Maps API key tonen we alle gevonden makelaars uit Google Places. Voor deze woning gebruiken we: {property.address}, {property.deelgemeente}.
            </p>

            <div className="mt-6 rounded-2xl bg-blue-50 p-5">
              <p className="text-sm font-black uppercase tracking-[0.2em] text-blue-700">
                Woning
              </p>
              <h2 className="mt-2 text-2xl font-black text-[#071B4D]">
                {property.title}
              </h2>
              <p className="mt-1 text-sm font-bold text-slate-600">
                {property.type} · {property.address} · {property.deelgemeente}
              </p>
            </div>
          </section>

          <aside className="rounded-[2rem] bg-white p-8 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-blue-700">
              Resultaat
            </p>
            <p className="mt-3 text-5xl font-black text-blue-700">
              {matchedMakelaars.length}
            </p>
            <p className="mt-1 text-base font-bold text-slate-600">
              makelaars in deze stad, gesorteerd van dichtbij naar verder weg
            </p>
            <a
              href={getCityMakelaarsSearchUrl(property.gemeente)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex text-sm font-black text-blue-700 transition hover:text-blue-800 hover:underline"
            >
              Bekijk alle makelaars in Google Maps
            </a>

            <button
              type="button"
              className="mt-6 w-full rounded-2xl bg-blue-700 px-6 py-4 font-black text-white transition hover:bg-blue-800"
            >
              Aanvraag naar geselecteerde makelaars sturen
            </button>
          </aside>
        </div>

        <section className="mt-6 rounded-[2rem] bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-blue-700">
                Geselecteerde makelaars
              </p>
              <h2 className="mt-2 text-3xl font-black text-[#071B4D]">
                Dichtstbijzijnde makelaars
              </h2>
            </div>
          </div>

          {matchedMakelaars.length > 0 ? (
            <div className="mt-6 grid gap-4">
              {matchedMakelaars.map((makelaar) => (
                <article
                  key={`${makelaar.office}-${makelaar.email}`}
                  className="rounded-2xl border border-slate-200 p-5 transition hover:border-blue-200 hover:shadow-md"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h3 className="text-xl font-black text-[#071B4D]">
                        {makelaar.office}
                      </h3>
                      <p className="mt-1 text-sm font-bold text-slate-600">
                        {makelaar.name} · {makelaar.location} · {makelaar.distance}
                      </p>

                      <div className="mt-3 space-y-1 text-sm font-semibold text-slate-600">
                        <p>{makelaar.address}</p>
                        <a
                          href={getWebsiteUrl(makelaar.website)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex font-black text-blue-700 transition hover:text-blue-800 hover:underline"
                        >
                          {getHostname(makelaar.website)}
                        </a>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        {makelaar.specialties.map((specialty) => (
                          <span
                            key={specialty}
                            className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600"
                          >
                            {specialty}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-col items-start gap-3 md:items-end">
                      <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-center">
                        <p className="text-2xl font-black text-emerald-700">
                          {makelaar.matchScore}%
                        </p>
                        <p className="text-xs font-bold text-emerald-700">
                          match
                        </p>
                      </div>

                      <div className="flex flex-wrap justify-start gap-2 md:justify-end">
                        <a
                          href={getWebsiteUrl(makelaar.website)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-xl border border-blue-700 px-4 py-2 text-sm font-black text-blue-700 transition hover:bg-blue-50"
                        >
                          Website
                        </a>

                        <label className="flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2 text-sm font-black text-[#071B4D]">
                          <input type="checkbox" defaultChecked className="h-5 w-5" />
                          Selecteren
                        </label>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="mt-6 text-base font-semibold text-slate-500">
              Geen makelaars gevonden voor deze gemeente. Voeg later een zoekkoppeling of database toe.
            </p>
          )}
        </section>
      </div>
    </div>
  )
}