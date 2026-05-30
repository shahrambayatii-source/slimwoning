'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import Footer from '@/components/Footer'
import './globals.css'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [loggedIn, setLoggedIn] = useState(false)
  const pathname = usePathname()
  const activeNavClass =
    "relative after:absolute after:left-1/2 after:bottom-[-8px] after:h-[3px] after:w-7 after:-translate-x-1/2 after:rounded-full after:bg-cyan-300 after:shadow-[0_0_10px_rgba(103,232,249,0.55)] after:content-['']"

  useEffect(() => {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    supabase.auth.getSession().then(({ data }) => {
      setLoggedIn(!!data.session)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setLoggedIn(!!session)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return (
    <html lang="nl">
      <body className="flex min-h-screen flex-col bg-[#f6f8fb] text-[#111827]">
        <header className="sticky top-0 z-50 border-b border-white/10 bg-gradient-to-r from-[#071B4D] via-[#0A2463] to-[#071B4D] text-white shadow-[0_8px_30px_rgba(2,6,23,0.25)] backdrop-blur-xl">
          <div className="mx-auto flex h-[84px] max-w-[1500px] items-center justify-between gap-10 pl-4 pr-8">
            <Link href="/" className="flex items-center transition hover:opacity-90">
              <img
                src="/logo.png"
                alt="SlimWoning"
                className="h-20 w-auto object-contain brightness-0 invert"
              />
            </Link>
            <nav className="flex items-center gap-9 text-[18px] font-semibold tracking-[-0.01em]">
              <Link
                href="/properties"
                className={`transition hover:opacity-80 ${pathname.startsWith('/properties') ? activeNavClass : ''}`}
              >
                Kopen
              </Link>

              <Link
                href="/huren"
                className={`transition hover:opacity-80 ${pathname.startsWith('/huren') ? activeNavClass : ''}`}
              >
                Huren
              </Link>

              <Link
                href="/verkopen"
                className={`transition hover:opacity-80 ${pathname.startsWith('/verkopen') ? activeNavClass : ''}`}
              >
                Verkopen
              </Link>

              <Link
                href="/verkopen/schatting"
                className={`transition hover:opacity-80 ${pathname === '/verkopen/schatting' ? activeNavClass : ''}`}
              >
                Schatting maken
              </Link>

              <Link href="/properties" className="transition hover:opacity-80">
                Nieuwbouw
              </Link>
            </nav>

            <nav className="flex items-center gap-8 text-[18px] font-semibold tracking-[-0.01em]">
              <Link
                href={loggedIn ? '/favorites' : '/login'}
                className={`flex items-center gap-2 transition hover:opacity-80 ${
                  pathname === (loggedIn ? '/favorites' : '/login') ? activeNavClass : ''
                }`}
              >
                <span className="text-2xl leading-none">♡</span>
                <span>Favorieten</span>
              </Link>

              {loggedIn ? (
                <div className="group relative">
                  <Link
                    href="/dashboard"
                    className={`flex items-center gap-2 transition hover:opacity-80 ${
                      pathname.startsWith('/dashboard') ? activeNavClass : ''
                    }`}
                  >
                    <span className="text-2xl leading-none">◎</span>
                    <span>Dashboard</span>
                  </Link>

                  <div className="invisible absolute right-0 top-[calc(100%+14px)] z-50 min-w-[220px] translate-y-2 rounded-2xl border border-white/10 bg-white p-2 opacity-0 shadow-[0_20px_60px_rgba(15,23,42,0.18)] transition-all duration-200 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
                    <Link
                      href="/dashboard"
                      className="flex items-center rounded-xl px-4 py-3 text-[15px] font-semibold text-[#0B1F4D] transition hover:bg-[#f4f7fb]"
                    >
                      Dashboard
                    </Link>

                    <button
                      type="button"
                      onClick={async () => {
                        const supabase = createClient(
                          process.env.NEXT_PUBLIC_SUPABASE_URL!,
                          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
                        )

                        await supabase.auth.signOut()
                        window.location.href = '/'
                      }}
                      className="flex w-full items-center rounded-xl px-4 py-3 text-left text-[15px] font-semibold text-red-500 transition hover:bg-red-50"
                    >
                      Uitloggen
                    </button>
                  </div>
                </div>
              ) : (
                <Link
                  href="/login"
                  className={`flex items-center gap-2 transition hover:opacity-80 ${
                    pathname === '/login' ? activeNavClass : ''
                  }`}
                >
                  <span className="text-2xl leading-none">◎</span>
                  <span>Inloggen</span>
                </Link>
              )}
            </nav>
          </div>
        </header>

        <div className="min-h-0 flex-1 bg-[#f6f8fb]">
          {children}
        </div>
        <Footer />
      </body>
    </html>
  )
}
