'use client'

import Link from 'next/link'
import { useAnimation } from '@/context/AnimationContext'

export default function Header() {
  const { paused, toggle } = useAnimation()

  return (
    <header className="border-b border-white/10 bg-black/60 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link href="/" className="font-mono text-sm font-semibold text-white hover:text-white/50 transition-colors">
          nohjuntae<span className="text-white/30">_</span>
        </Link>
        <nav className="flex items-center gap-6">
          <button
            onClick={toggle}
            className="text-sm font-mono text-white/50 hover:text-white transition-colors"
            aria-label={paused ? 'resume animation' : 'pause animation'}
          >
            {paused ? '▶' : '■'}
          </button>
          <Link href="/works" className="text-sm text-white/50 hover:text-white transition-colors">
            works
          </Link>
          <Link href="/about" className="text-sm text-white/50 hover:text-white transition-colors">
            about
          </Link>
        </nav>
      </div>
    </header>
  )
}
