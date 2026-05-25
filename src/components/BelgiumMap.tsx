
'use client'

import { GoogleMap, OverlayView, useJsApiLoader } from '@react-google-maps/api'

// Google Maps implementation
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'


type MapProperty = {
  id?: string
  source?: string
  tag: string
  title: string
  city: string
  position: [number, number]
  price: string
  image: string
}

type BelgiumMapProps = {
  center?: [number, number]
  radiusKm?: number
  height?: string
  showRadius?: boolean
  selectedCities?: string[]
  properties?: MapProperty[]
}

const defaultCenter: [number, number] = [50.8503, 4.3517]

const cityCenters: Record<string, [number, number]> = {
  brussel: [50.8503, 4.3517],
  zaventem: [50.8798, 4.4723],
  leuven: [50.8798, 4.7005],
  antwerpen: [51.2194, 4.4025],
  gent: [51.0543, 3.7174],
  brugge: [51.2093, 3.2247],
  hasselt: [50.9307, 5.3325],
}

const cityMarkers = [
  { name: 'Brussel', position: [50.8503, 4.3517] as [number, number], count: 42 },
  { name: 'Antwerpen', position: [51.2194, 4.4025] as [number, number], count: 31 },
  { name: 'Gent', position: [51.0543, 3.7174] as [number, number], count: 18 },
  { name: 'Leuven', position: [50.8798, 4.7005] as [number, number], count: 24 },
  { name: 'Brugge', position: [51.2093, 3.2247] as [number, number], count: 14 },
  { name: 'Hasselt', position: [50.9307, 5.3325] as [number, number], count: 11 },
]

// --------------------------------------------------
// Echte woningen voor de kaart
//
// Voeg hier je eigen woningen toe met:
// - echte adressen / coordinaten
// - echte prijzen
// - echte afbeeldingen
//
// Hierdoor ziet de kaart er realistischer,
// professioneler en aantrekkelijker uit.
// --------------------------------------------------
const listingPropertyMarkers = [
  {
    source: 'listing',
    tag: 'NIEUW',
    title: 'Moderne gezinswoning in Gent',
    city: 'Gent',
    position: [51.0385, 3.6932] as [number, number],
    price: '€ 425.000',
    image:
      'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?q=80&w=1200&auto=format&fit=crop',
  },
  {
    source: 'listing',
    tag: 'TOP WONING',
    title: 'Appartement Gent',
    city: 'Gent',
    position: [51.0552, 3.7249] as [number, number],
    price: '€ 420.000',
    image:
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=1200&auto=format&fit=crop',
  },
  {
    source: 'listing',
    tag: 'ANTWERPEN',
    title: 'Moderne villa Antwerpen',
    city: 'Antwerpen',
    position: [51.2198, 4.4022] as [number, number],
    price: '€ 760.000',
    image:
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?q=80&w=1200&auto=format&fit=crop',
  },
]

const propertyMarkers = [
  ...listingPropertyMarkers,
  {
    tag: 'NIEUW',
    title: 'Luxevilla Brussel',
    city: 'Brussel',
    position: [50.8466, 4.3528] as [number, number],
    price: '€ 1.250.000',
    image:
      'https://images.unsplash.com/photo-1613977257363-707ba9348227?q=80&w=1200&auto=format&fit=crop',
  },
  {
    tag: 'TOP WONING',
    title: 'Penthouse Europese Wijk',
    city: 'Brussel',
    position: [50.8422, 4.3811] as [number, number],
    price: '€ 890.000',
    image:
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?q=80&w=1200&auto=format&fit=crop',
  },
  {
    tag: 'BRUSSEL',
    title: 'Design Appartement Elsene',
    city: 'Brussel',
    position: [50.8338, 4.3662] as [number, number],
    price: '€ 575.000',
    image:
      'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?q=80&w=1200&auto=format&fit=crop',
  },
  {
    tag: 'NIEUW',
    title: 'Villa Zaventem',
    city: 'Zaventem',
    position: [50.905, 4.53] as [number, number],
    price: '€ 645.000',
    image:
      'https://images.unsplash.com/photo-1568605114967-8130f3a36994?q=80&w=1200&auto=format&fit=crop',
  },
  {
    tag: 'TOP WONING',
    title: 'Gezinswoning Zaventem',
    city: 'Zaventem',
    position: [50.86, 4.46] as [number, number],
    price: '€ 525.000',
    image:
      'https://images.unsplash.com/photo-1605146769289-440113cc3d00?q=80&w=1200&auto=format&fit=crop',
  },
  {
    tag: 'ZAVENTEM',
    title: 'Appartement Zaventem',
    city: 'Zaventem',
    position: [50.89, 4.39] as [number, number],
    price: '€ 395.000',
    image:
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=1200&auto=format&fit=crop',
  },
  {
    tag: 'NIEUW',
    title: 'Appartement Leuven',
    city: 'Leuven',
    position: [50.89, 4.86] as [number, number],
    price: '€ 395.000',
    image:
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=1200&auto=format&fit=crop',
  },
  {
    tag: 'TOP WONING',
    title: 'Gezinswoning Leuven',
    city: 'Leuven',
    position: [50.82, 4.75] as [number, number],
    price: '€ 575.000',
    image:
      'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?q=80&w=1200&auto=format&fit=crop',
  },
  {
    tag: 'LEUVEN',
    title: 'Stadswoning Leuven',
    city: 'Leuven',
    position: [50.94, 4.68] as [number, number],
    price: '€ 465.000',
    image:
      'https://images.unsplash.com/photo-1570129477492-45c003edd2be?q=80&w=1200&auto=format&fit=crop',
  },
  {
    tag: 'NIEUW',
    title: 'Penthouse Antwerpen',
    city: 'Antwerpen',
    position: [51.22, 4.41] as [number, number],
    price: '€ 820.000',
    image:
      'https://images.unsplash.com/photo-1494526585095-c41746248156?q=80&w=1200&auto=format&fit=crop',
  },
  {
    tag: 'TOP WONING',
    title: 'Herenhuis Antwerpen',
    city: 'Antwerpen',
    position: [51.18, 4.32] as [number, number],
    price: '€ 695.000',
    image:
      'https://images.unsplash.com/photo-1600585154526-990dced4db0d?q=80&w=1200&auto=format&fit=crop',
  },
  {
    tag: 'ANTWERPEN',
    title: 'Appartement Antwerpen',
    city: 'Antwerpen',
    position: [51.27, 4.5] as [number, number],
    price: '€ 445.000',
    image:
      'https://images.unsplash.com/photo-1605146769289-440113cc3d00?q=80&w=1200&auto=format&fit=crop',
  },
  {
    tag: 'NIEUW',
    title: 'Woning Gent',
    city: 'Gent',
    position: [51.052, 3.72] as [number, number],
    price: '€ 525.000',
    image:
      'https://images.unsplash.com/photo-1570129477492-45c003edd2be?q=80&w=1200&auto=format&fit=crop',
  },
  {
    tag: 'TOP WONING',
    title: 'Villa Gent',
    city: 'Gent',
    position: [51.11, 3.63] as [number, number],
    price: '€ 735.000',
    image:
      'https://images.unsplash.com/photo-1568605114967-8130f3a36994?q=80&w=1200&auto=format&fit=crop',
  },
  {
    tag: 'GENT',
    title: 'Stadswoning Gent',
    city: 'Gent',
    position: [50.99, 3.82] as [number, number],
    price: '€ 410.000',
    image:
      'https://images.unsplash.com/photo-1598228723793-52759bba239c?q=80&w=1200&auto=format&fit=crop',
  },
]

const provincePropertyMarkers = [
  {
    tag: 'NIEUW',
    title: 'Villa Vlaams-Brabant',
    city: 'Vlaams-Brabant',
    position: [50.88, 4.55] as [number, number],
    price: '€ 645.000',
    image:
      'https://images.unsplash.com/photo-1568605114967-8130f3a36994?q=80&w=1200&auto=format&fit=crop',
  },
  {
    tag: 'TOP WONING',
    title: 'Gezinswoning Vlaams-Brabant',
    city: 'Vlaams-Brabant',
    position: [50.72, 4.48] as [number, number],
    price: '€ 575.000',
    image:
      'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?q=80&w=1200&auto=format&fit=crop',
  },
  {
    tag: 'VLAAMS-BRABANT',
    title: 'Appartement regio Leuven',
    city: 'Vlaams-Brabant',
    position: [50.97, 4.78] as [number, number],
    price: '€ 395.000',
    image:
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=1200&auto=format&fit=crop',
  },
  {
    tag: 'NIEUW',
    title: 'Woning Antwerpen',
    city: 'Antwerpen',
    position: [51.22, 4.42] as [number, number],
    price: '€ 445.000',
    image:
      'https://images.unsplash.com/photo-1605146769289-440113cc3d00?q=80&w=1200&auto=format&fit=crop',
  },
  {
    tag: 'TOP WONING',
    title: 'Herenhuis Antwerpen',
    city: 'Antwerpen',
    position: [51.1, 4.18] as [number, number],
    price: '€ 695.000',
    image:
      'https://images.unsplash.com/photo-1600585154526-990dced4db0d?q=80&w=1200&auto=format&fit=crop',
  },
  {
    tag: 'ANTWERPEN',
    title: 'Appartement Kempen',
    city: 'Antwerpen',
    position: [51.27, 4.74] as [number, number],
    price: '€ 385.000',
    image:
      'https://images.unsplash.com/photo-1494526585095-c41746248156?q=80&w=1200&auto=format&fit=crop',
  },
  {
    tag: 'NIEUW',
    title: 'Woning Oost-Vlaanderen',
    city: 'Oost-Vlaanderen',
    position: [51.05, 3.72] as [number, number],
    price: '€ 525.000',
    image:
      'https://images.unsplash.com/photo-1570129477492-45c003edd2be?q=80&w=1200&auto=format&fit=crop',
  },
  {
    tag: 'TOP WONING',
    title: 'Villa Oost-Vlaanderen',
    city: 'Oost-Vlaanderen',
    position: [50.95, 3.95] as [number, number],
    price: '€ 735.000',
    image:
      'https://images.unsplash.com/photo-1568605114967-8130f3a36994?q=80&w=1200&auto=format&fit=crop',
  },
  {
    tag: 'OOST-VLAANDEREN',
    title: 'Stadswoning Gent',
    city: 'Oost-Vlaanderen',
    position: [51.13, 3.52] as [number, number],
    price: '€ 410.000',
    image:
      'https://images.unsplash.com/photo-1598228723793-52759bba239c?q=80&w=1200&auto=format&fit=crop',
  },
]

// --- Rotating property cards helpers ---
function getThreeDayRotationIndex(length: number) {
  if (length <= 0) return 0

  const start = new Date('2026-01-01T00:00:00Z').getTime()
  const now = Date.now()
  const threeDays = 1000 * 60 * 60 * 24 * 3
  const cycle = Math.floor((now - start) / threeDays)

  return ((cycle % length) + length) % length
}


function pickRotatingProperties<T extends { city: string; tag: string }>(items: T[], maxPerCity = 3) {
  const grouped = items.reduce<Record<string, T[]>>((groups, item) => {
    groups[item.city] = groups[item.city] || []
    groups[item.city].push(item)
    return groups
  }, {})

  return Object.values(grouped).flatMap((group) => {
    const topHomes = group.filter((item) => item.tag === 'TOP WONING')
    const newHomes = group.filter((item) => item.tag === 'NIEUW')
    const normalHomes = group.filter((item) => item.tag !== 'TOP WONING' && item.tag !== 'NIEUW')

    const rotatedTopHome = topHomes.length > 0 ? [topHomes[getThreeDayRotationIndex(topHomes.length)]] : []

    return [...rotatedTopHome, ...newHomes, ...normalHomes].slice(0, maxPerCity)
  })
}

function getAiMatchScore(city: string, tag: string) {
  const cityScores: Record<string, number> = {
    brussel: 86,
    zaventem: 91,
    leuven: 94,
    antwerpen: 89,
    gent: 92,
    'vlaams-brabant': 93,
    'oost-vlaanderen': 90,
  }

  const baseScore = cityScores[city.toLowerCase()] ?? 88
  const bonus = tag === 'TOP WONING' ? 3 : tag === 'NIEUW' ? 2 : 0

  return Math.min(98, baseScore + bonus)
}

function getAiReason(city: string) {
  const reasons: Record<string, string> = {
    brussel: 'Sterke bereikbaarheid en hoge vraag in de regio.',
    zaventem: 'Dicht bij Brussel, luchthaven en groene woonzones.',
    leuven: 'Veel groen, sterke markt en uitstekende voorzieningen.',
    antwerpen: 'Grote vraag, sterke economie en veel voorzieningen.',
    gent: 'Populaire woonstad met stabiele vastgoedvraag.',
    'vlaams-brabant': 'Rustige woonzones met snelle verbinding naar Brussel.',
    'oost-vlaanderen': 'Aantrekkelijke regio met goede prijs-kwaliteitverhouding.',
  }

  return reasons[city.toLowerCase()] ?? 'Goede ligging met interessante vastgoedkansen.'
}


function getPropertyUrl(property: { id?: string; city: string; title: string }) {
  if (property.id) {
    return `/properties/${property.id}`
  }

  const slug = property.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

  return `/properties?gemeente=${encodeURIComponent(property.city)}&woning=${encodeURIComponent(slug)}`
}

export default function BelgiumMap({
  center = defaultCenter,
  radiusKm = 40,
  height = '520px',
  showRadius = true,
  selectedCities = [],
  properties = [],
}: BelgiumMapProps) {

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries: ['places'],
  })

  const [isMounted, setIsMounted] = useState(false)
  const mapRef = useRef<google.maps.Map | null>(null)
  const [mapZoomLevel, setMapZoomLevel] = useState(8)
  const normalizedSelectedCities = useMemo(
    () => selectedCities.map((city) => city.trim().toLowerCase()).filter(Boolean),
    [selectedCities]
  )
  const selectedCitiesFitKey = normalizedSelectedCities.join('|')
  const selectedCityCenter = normalizedSelectedCities.length === 1 ? cityCenters[normalizedSelectedCities[0]] : undefined
  const viewCenter = selectedCityCenter || center
  const mapZoom = selectedCities.length > 0 ? 10 : 8

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const visibleProperties = useMemo(() => {
    const realCards = properties.length > 0 ? properties : propertyMarkers
    const provinceCards = pickRotatingProperties(provincePropertyMarkers, 3)
    const cityCards = pickRotatingProperties(realCards, 3)

    // ---------------------------------
    // Zoomed OUT → provincie niveau
    // ---------------------------------
    if (mapZoomLevel <= 7) {
      return provinceCards
    }

    // ---------------------------------
    // Medium zoom → stad niveau
    // ---------------------------------
    if (mapZoomLevel > 7 && mapZoomLevel <= 10) {
      if (normalizedSelectedCities.length > 0) {
        return cityCards.filter((property) =>
          normalizedSelectedCities.includes(property.city.toLowerCase())
        )
      }

      return cityCards
    }

    // ---------------------------------
    // Deep zoom → alleen woningen in viewport
    // ---------------------------------
    const map = mapRef.current

    if (!map) {
      return cityCards
    }

    const bounds = map.getBounds()

    if (!bounds) {
      return cityCards
    }

    const viewportProperties = realCards.filter((property) => {
      return bounds.contains({
        lat: property.position[0],
        lng: property.position[1],
      })
    })

    const grouped: Record<string, typeof viewportProperties> = {}

    viewportProperties.forEach((property) => {
      grouped[property.city] = grouped[property.city] || []
      grouped[property.city].push(property)
    })

    const groupedViewportProperties = Object.values(grouped).flatMap((group) =>
      group.slice(0, 3)
    )

    return groupedViewportProperties.length > 0
      ? groupedViewportProperties
      : cityCards
  }, [mapZoomLevel, normalizedSelectedCities, properties])

  const displayedProperties = visibleProperties

  const handleMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map
    setMapZoomLevel(map.getZoom() || 8)

    map.addListener('zoom_changed', () => {
      setMapZoomLevel(map.getZoom() || 8)
    })
  }, [])

  useEffect(() => {
    if (!isLoaded || !mapRef.current || displayedProperties.length === 0) return

    const bounds = new google.maps.LatLngBounds()

    displayedProperties.forEach((property) => {
      bounds.extend({
        lat: property.position[0],
        lng: property.position[1],
      })
    })

    if (bounds.isEmpty()) return

    mapRef.current.fitBounds(bounds, {
      top: 160,
      right: 280,
      bottom: 180,
      left: 280,
    })

    window.setTimeout(() => {
      const currentZoom = mapRef.current?.getZoom()
      const maxZoom = 10
      if (currentZoom && currentZoom > maxZoom) {
        mapRef.current?.setZoom(maxZoom)
      }
    }, 120)
  }, [isLoaded, properties, normalizedSelectedCities])

  if (!isMounted) {
    return (
      <div
        className="relative overflow-hidden rounded-[2rem] bg-[#eef4fb] shadow-2xl shadow-blue-900/10"
        style={{ height }}
      />
    )
  }
  if (!isLoaded) {
    return (
      <div
        className="relative overflow-hidden rounded-[2rem] bg-[#eef4fb] shadow-2xl shadow-blue-900/10"
        style={{ height }}
      />
    )
  }

  return (
    <div
      className="relative isolate overflow-hidden rounded-[2rem] bg-[#eef4fb] shadow-2xl shadow-blue-900/10"
      style={{ height }}
    >
      <style>{`
        button.gm-fullscreen-control {
          top: 26px !important;
          right: 10px !important;
          left: auto !important;
          bottom: auto !important;
          transform: none !important;
        }

        .gm-style-mtc {
          margin-top: 16px !important;
        }
      `}</style>
      <div className="absolute inset-0 overflow-hidden rounded-[2rem]">
        <GoogleMap
          mapContainerClassName="absolute inset-0 h-full w-full rounded-[2rem]"
          center={{ lat: viewCenter[0], lng: viewCenter[1] }}
          zoom={mapZoom}
          onLoad={handleMapLoad}
          options={{
            mapTypeControl: true,
            streetViewControl: false,
            fullscreenControl: true,
            zoomControl: true,
            mapTypeId: 'hybrid',
            gestureHandling: 'greedy',
            disableDefaultUI: false,
            styles: [],
          }}
        >
          {displayedProperties.map((property) => (
            <OverlayView
              key={`${property.title}-${property.position[0]}-${property.position[1]}`}
              position={{ lat: property.position[0], lng: property.position[1] }}
              mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
            >
              <div
                onClick={() => {
                  window.location.href = getPropertyUrl(property)
                }}
                style={{
                  width: '268px',
                  height: '116px',
                  display: 'grid',
                  gridTemplateColumns: '74px 1fr',
                  alignItems: 'center',
                  gap: '10px',
                  background: 'rgba(255,255,255,0.85)',
                  borderRadius: '18px',
                  padding: '8px',
                  boxShadow: '0 16px 45px rgba(15,23,42,0.22)',
                  border: '1px solid rgba(255,255,255,0.40)',
                  fontFamily: 'Inter,Arial,sans-serif',
                  backdropFilter: 'blur(12px)',
                  boxSizing: 'border-box',
                  cursor: 'pointer',
                  transform: 'translate(-50%, -50%) scale(0.95)',
                  position: 'relative',
                }}
              >
                <img
                  src={property.image}
                  onError={(e) => {
                    ;(e.currentTarget as HTMLImageElement).src =
                      'https://images.unsplash.com/photo-1568605114967-8130f3a36994?q=80&w=1200&auto=format&fit=crop'
                  }}
                  style={{
                    width: '74px',
                    height: '100px',
                    objectFit: 'cover',
                    borderRadius: '13px',
                    display: 'block',
                  }}
                />

                <div style={{ minWidth: 0, overflow: 'hidden' }}>
                  <div
                    style={{
                      fontSize: '9px',
                      fontWeight: 900,
                      color: property.tag === 'TOP WONING' ? '#b45309' : '#2563eb',
                      textTransform: 'uppercase',
                      letterSpacing: '.16em',
                      lineHeight: 1,
                    }}
                  >
                    {property.tag}
                  </div>

                  <div
                    style={{
                      marginTop: '6px',
                      fontSize: '15px',
                      fontWeight: 950,
                      color: '#071B4D',
                      lineHeight: 1.05,
                    }}
                  >
                    {property.title}
                  </div>

                  <div
                    style={{
                      marginTop: '6px',
                      fontSize: '15px',
                      fontWeight: 950,
                      color: '#1d4ed8',
                      lineHeight: 1,
                    }}
                  >
                    {property.price}
                  </div>

                  <div
                    style={{
                      marginTop: '7px',
                      fontSize: '9px',
                      fontWeight: 800,
                      color: '#475569',
                      lineHeight: 1.15,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {getAiReason(property.city)}
                  </div>
                </div>
              </div>
            </OverlayView>
          ))}
        </GoogleMap>
      </div>

      
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/24 via-white/8 to-emerald-100/10" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-white/35" />
    </div>
  )
}
