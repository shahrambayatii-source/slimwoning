'use client'

import Link from 'next/link'

const footerColumns = [
  {
    title: 'Snel naar',
    links: [
      { label: 'Woningen kopen', href: '/properties' },
      { label: 'Woningwaarde schatten', href: '/schatting-maken' },
      { label: 'EnergieScan', href: '/energiescan' },
      { label: 'RenovatieScan', href: '/renovatiescan' },
      { label: 'Vergelijk woningen', href: '/vergelijken' },
    ],
  },
  {
    title: 'Voor kopers',
    links: [
      { label: 'Favorieten', href: '/favorieten' },
      { label: 'Slim zoeken', href: '/slim-zoeken' },
      { label: 'AI-score uitleg', href: '/ai-score' },
      { label: 'Hypotheek simulatie', href: '/hypotheek' },
      { label: 'Bezichtiging voorbereiden', href: '/bezichtiging' },
    ],
  },
  {
    title: 'Voor verkopers',
    links: [
      { label: 'Woning verkopen', href: '/verkopen' },
      { label: 'Gratis schatting maken', href: '/schatting-maken' },
      { label: 'Verkooprapport', href: '/verkooprapport' },
      { label: 'Nieuwbouw project plaatsen', href: '/nieuwbouw/plaatsen' },
    ],
  },
  {
    title: 'SlimWoning',
    links: [
      { label: 'Over SlimWoning', href: '/over' },
      { label: 'Contact', href: '/contact' },
      { label: 'Privacybeleid', href: '/privacy' },
      { label: 'Algemene voorwaarden', href: '/voorwaarden' },
      { label: 'Disclaimer', href: '/disclaimer' },
    ],
  },
]

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-[1280px] px-6 py-12 md:px-10">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          {footerColumns.map((column) => (
            <div key={column.title}>
              <h3 className="text-base font-black text-[#071B4D]">
                {column.title}
              </h3>

              <div className="mt-5 space-y-3">
                {column.links.map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    className="block text-base font-medium text-blue-700 transition hover:text-blue-900 hover:underline"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 border-t border-slate-200 pt-6">
          <p className="text-sm font-medium text-slate-500">
            © 2026 SlimWoning. Alle rechten voorbehouden.
          </p>
        </div>
      </div>
    </footer>
  )
}
