'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import './globals.css'

const footerColumns = [
  {
    title: 'Snel naar',
    links: [
      { label: 'Woningen kopen', href: '/properties' },
      { label: 'Woningwaarde schatten', href: '/verkopen/schatting' },
      { label: 'EnergieScan', href: '#' },
      { label: 'RenovatieScan', href: '#' },
      { label: 'Vergelijk woningen', href: '/compare' },
    ],
  },
  {
    title: 'Voor kopers',
    links: [
      { label: 'Favorieten', href: '/favorites' },
      { label: 'Slim zoeken', href: '/properties' },
      { label: 'AI-score uitleg', href: '#' },
      { label: 'Hypotheek simulatie', href: '#' },
      { label: 'Bezichtiging voorbereiden', href: '#' },
    ],
  },
  {
    title: 'Voor verkopers',
    links: [
      { label: 'Woning verkopen', href: '/verkopen' },
      { label: 'Gratis schatting maken', href: '/verkopen/schatting' },
      { label: 'Verkooprapport', href: '#' },
      { label: 'Makelaar matching', href: '#' },
      { label: 'Nieuwbouw project plaatsen', href: '#' },
    ],
  },
  {
    title: 'SlimWoning',
    links: [
      { label: 'Over SlimWoning', href: '#' },
      { label: 'Contact', href: '#' },
      { label: 'Privacybeleid', href: '#' },
      { label: 'Algemene voorwaarden', href: '#' },
      { label: 'Disclaimer', href: '#' },
    ],
  },
]

const footerExcludedPathPrefixes = [
  '/dashboard',
  '/makelaar-dashboard',
  '/login',
  '/register',
  '/checkout',
  '/add-property',
  '/edit-property',
]

function shouldShowFooter(pathname: string) {
  return !footerExcludedPathPrefixes.some((pathPrefix) => pathname.startsWith(pathPrefix))
}

function Footer() {
  return (
    <footer className="border-t border-[#dbe7f3] bg-white/95 text-[#0B1F4D]">
      <div className="mx-auto max-w-[1500px] px-6 py-10 sm:px-8 lg:px-10">
        <div className="grid grid-cols-1 gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
          {footerColumns.map((column) => (
            <section key={column.title} aria-labelledby={`footer-${column.title.toLowerCase().replaceAll(' ', '-')}`}>
              <h2
                id={`footer-${column.title.toLowerCase().replaceAll(' ', '-')}`}
                className="mb-4 text-[16px] font-bold tracking-[-0.01em] text-[#071B4D]"
              >
                {column.title}
              </h2>
              <ul className="space-y-2.5 text-[15px] font-medium">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-[#1268B3] transition hover:text-[#071B4D] hover:underline hover:underline-offset-4"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <div className="mt-9 border-t border-[#dbe7f3] pt-5 text-[14px] font-medium text-[#53657D]">
          © 2026 SlimWoning. Alle rechten voorbehouden.
        </div>
      </div>
    </footer>
  )
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [loggedIn, setLoggedIn] = useState(false)
  const pathname = usePathname()
  const showFooter = shouldShowFooter(pathname)
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
      <body className="bg-[#f6f8fb] text-[#111827]">
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

        {children}
        {showFooter && <Footer />}
      </body>
    </html>
  )
}
