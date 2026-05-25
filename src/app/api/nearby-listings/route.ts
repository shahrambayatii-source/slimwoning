import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'
export const revalidate = 0

function distanceInMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
) {
  const R = 6371000

  const toRad = (value: number) => (value * Math.PI) / 180

  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) ** 2

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)

  const latParam = searchParams.get('lat')
  const lngParam = searchParams.get('lng')
  const radiusParam = searchParams.get('radius')

  const lat = latParam ? Number(latParam) : null
  const lng = lngParam ? Number(lngParam) : null
  const radius = radiusParam ? Number(radiusParam) : 1000

  if (
    lat === null ||
    lng === null ||
    Number.isNaN(lat) ||
    Number.isNaN(lng)
  ) {
    return NextResponse.json(
      { error: 'Latitude and longitude are required' },
      { status: 400 }
    )
  }

  // REAL PROPERTIES TABLE
  const { data, error } = await supabase
    .from('properties')
    .select('*')

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }

  const nearbyListings = (data || [])
    .filter(
      (listing) =>
        listing.latitude &&
        listing.longitude
    )
    .map((listing) => {
      const distance = distanceInMeters(
        lat,
        lng,
        Number(listing.latitude),
        Number(listing.longitude)
      )

      return {
        ...listing,
        distance: Math.round(distance),
      }
    })
    .filter((listing) => listing.distance <= radius)
    .sort((a, b) => a.distance - b.distance)

  return NextResponse.json(
    {
      count: nearbyListings.length,
      radius,
      totalInDatabase: data?.length || 0,
      listings: nearbyListings,
    },
    {
      headers: {
        'Cache-Control': 'no-store',
      },
    }
  )
}
