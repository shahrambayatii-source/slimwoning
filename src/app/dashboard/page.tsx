'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { getWoningkenmerken } from '@/lib/woningkenmerken'

export default function DashboardPage() {
  const [properties, setProperties] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [userEmail, setUserEmail] = useState('')

  const router = useRouter()

  useEffect(() => {
    checkUser()
  }, [])

  async function checkUser() {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      router.push('/login')
      return
    }

    setUserEmail(session.user.email || '')
    await getProperties(session.user.id)
  }

  async function getProperties(userId: string) {
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.log(error)
      setProperties([])
    } else {
      setProperties(data || [])
    }

    setLoading(false)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white text-3xl font-bold text-[#071B4D]">
        Laden...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white px-5 py-10 text-[#071B4D] md:px-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="mb-2 text-4xl font-bold md:text-5xl">
              Mijn dashboard
            </h1>

            <p className="text-sm text-gray-500 md:text-base">
              Ingelogd als: {userEmail}
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="w-full rounded-xl bg-red-600 px-5 py-3 font-bold text-white transition hover:opacity-90 md:w-auto"
          >
            Uitloggen
          </button>
        </div>

        <div className="mb-8">
          <Link href="/add-property">
            <button className="w-full rounded-xl bg-[#071B4D] px-5 py-4 font-bold text-white transition hover:opacity-90 md:w-auto">
              Vastgoed toevoegen
            </button>
          </Link>
        </div>

        {properties.length === 0 ? (
          <p className="text-xl text-gray-500">
            Je hebt nog geen vastgoed toegevoegd.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {properties.map((property) => (
              <div
                key={property.id}
                className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm"
              >
                {property.image && (
                  <img
                    src={property.image}
                    alt={property.title || 'Vastgoed'}
                    className="h-52 w-full rounded-xl object-cover"
                  />
                )}

                <h2 className="mt-4 text-2xl font-bold">
                  {property.title}
                </h2>

                <p className="mt-2 font-semibold">
                  € {property.price}
                </p>

                <p className="text-gray-500">
                  {property.city}
                </p>

                {getWoningkenmerken(property).length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {getWoningkenmerken(property).slice(0, 3).map((kenmerk) => (
                      <span
                        key={kenmerk}
                        className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700"
                      >
                        {kenmerk}
                      </span>
                    ))}
                  </div>
                )}

                <Link href={`/dashboard/properties/${property.id}`}>
                  <button className="mt-4 w-full rounded-xl bg-[#071B4D] px-4 py-3 font-bold text-white transition hover:opacity-90">
                    Bekijk vastgoed
                  </button>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
