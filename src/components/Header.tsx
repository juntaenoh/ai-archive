import Link from 'next/link'

export default function Header() {
  return (
    <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link href="/" className="font-mono text-sm font-semibold text-zinc-100 hover:text-emerald-400 transition-colors">
          ai-archive<span className="text-emerald-400">_</span>
        </Link>
        <nav className="flex items-center gap-6">
          <Link href="/works" className="text-sm text-zinc-400 hover:text-zinc-100 transition-colors">
            works
          </Link>
          <Link href="/about" className="text-sm text-zinc-400 hover:text-zinc-100 transition-colors">
            about
          </Link>
        </nav>
      </div>
    </header>
  )
}
