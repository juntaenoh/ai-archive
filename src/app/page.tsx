import PixelGridClient from '@/components/PixelGridClient'

export default function HomePage() {
  return (
    <div className="relative">
      <PixelGridClient />
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-center pointer-events-none">
        <p className="text-xs font-mono text-zinc-400 tracking-widest uppercase">
          click anywhere — 6 projects hidden within
        </p>
      </div>
    </div>
  )
}
