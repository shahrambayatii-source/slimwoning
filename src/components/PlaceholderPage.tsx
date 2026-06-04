import Link from 'next/link'

type PlaceholderPageProps = {
  eyebrow?: string
  title: string
  description: string
}

export default function PlaceholderPage({
  eyebrow = 'SlimWoning',
  title,
  description,
}: PlaceholderPageProps) {
  return (
    <main className="min-h-screen bg-[#f6f8fb] px-6 py-16 text-[#071B4D]">
      <section className="mx-auto max-w-3xl rounded-[2rem] bg-white p-8 shadow-xl ring-1 ring-slate-200/70 md:p-12">
        <p className="text-xs font-black uppercase tracking-[0.24em] text-blue-700">
          {eyebrow}
        </p>
        <h1 className="mt-4 text-4xl font-black tracking-[-0.035em]">
          {title}
        </h1>
        <p className="mt-4 text-base leading-8 text-slate-600">
          {description}
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex rounded-2xl bg-[#071B4D] px-5 py-3 text-sm font-black text-white"
        >
          Terug naar home
        </Link>
      </section>
    </main>
  )
}
