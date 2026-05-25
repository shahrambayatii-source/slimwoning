import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const GOOGLE_MAPS_API_KEY =
  process.env.GOOGLE_MAPS_SERVER_API_KEY ||
  process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

async function getCoordinates(address: string, city: string) {
  try {
    const query = encodeURIComponent(
      `${address || ''}, ${city || ''}, Belgium`
    )

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${query}&key=${GOOGLE_MAPS_API_KEY}`
    )

    const data = await response.json()

    if (!data.results || data.results.length === 0) {
      return {
        latitude: null,
        longitude: null,
      }
    }

    const location = data.results[0].geometry.location

    return {
      latitude: location.lat,
      longitude: location.lng,
    }
  } catch (error) {
    console.error('Geocode error:', error)

    return {
      latitude: null,
      longitude: null,
    }
  }
}

export async function GET() {
  const { data: properties, error } = await supabase
    .from('properties')
    .select('id,address,city,title')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const updated = []

  for (const property of properties || []) {
    const coords = await getCoordinates(
      property.address || '',
      property.city || ''
    )

    if (!coords.latitude || !coords.longitude) {
      updated.push({
        id: property.id,
        title: property.title,
        status: 'skipped',
      })
      continue
    }

    const { error: updateError } = await supabase
      .from('properties')
      .update({
        latitude: coords.latitude,
        longitude: coords.longitude,
      })
      .eq('id', property.id)

    updated.push({
      id: property.id,
      title: property.title,
      latitude: coords.latitude,
      longitude: coords.longitude,
      status: updateError ? 'failed' : 'updated',
      error: updateError?.message || null,
    })
  }

  return NextResponse.json({
    count: updated.length,
    updated,
  })
}
