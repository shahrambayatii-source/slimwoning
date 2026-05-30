import Link from 'next/link'

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

export default function Footer() {
  return (
    <footer className="border-t border-[#dbe7f3] bg-[#f6f8fb] text-[#0B1F4D]">
      <div className="mx-auto max-w-[1500px] px-6 py-10 sm:px-8 lg:px-10">
        <div className="grid grid-cols-1 gap-x-10 gap-y-8 md:grid-cols-2 lg:grid-cols-4">
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

        <div className="mt-8 border-t border-[#dbe7f3] pt-5 text-[14px] font-medium text-[#53657D]">
          © 2026 SlimWoning. Alle rechten voorbehouden.
        </div>
      </div>
    </footer>
  )
}
