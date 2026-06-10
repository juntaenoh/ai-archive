import Link from 'next/link'
import { getAllWorks } from '@/lib/works'
import WorkCard from '@/components/WorkCard'
import { PROJECT_DATA } from '@/lib/projects'

export const metadata = {
  title: 'Works — AI Archive',
}

export default function WorksPage() {
  const mdxWorks = getAllWorks()

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f0ebe0',
      backgroundImage: 'url(/paper-texture.jpg)',
      backgroundSize: '500px',
      backgroundBlendMode: 'multiply',
    }}>
      <div className="max-w-4xl mx-auto px-8 py-14">
        {/* Header */}
        <div className="mb-10">
          <p className="text-xs font-mono tracking-widest mb-3" style={{ color: 'rgba(0,0,0,0.38)' }}>
            WORKS · 작업물
          </p>
          <h1 className="text-2xl font-bold" style={{ color: 'rgba(0,0,0,0.82)' }}>
            Projects
          </h1>
        </div>

        {/* PROJECT_DATA cards */}
        <div className="flex flex-col gap-3 mb-12">
          {PROJECT_DATA.map((p, i) => {
            const shortDesc = p.desc.length > 60 ? p.desc.slice(0, 60) + '…' : p.desc
            return (
              <Link key={i} href={`/works/${i + 1}`} style={{ textDecoration: 'none' }}>
                <div
                  className="works-card flex items-stretch rounded"
                  style={{
                    border: '1px solid rgba(0,0,0,0.10)',
                  }}
                >
                  {/* colored vertical bar */}
                  <div style={{ width: 4, borderRadius: '4px 0 0 4px', background: p.color, flexShrink: 0 }} />

                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 px-5 py-4 flex-1 min-w-0">
                    {/* Title + period */}
                    <div className="flex flex-col min-w-0" style={{ minWidth: 180 }}>
                      <span className="font-semibold text-sm leading-snug" style={{ color: 'rgba(0,0,0,0.82)' }}>
                        {p.label.replace('\n', ' ')}
                      </span>
                      <span className="font-mono text-xs mt-0.5" style={{ color: 'rgba(0,0,0,0.38)' }}>
                        {p.period}
                      </span>
                    </div>

                    {/* Role */}
                    <span className="text-xs flex-shrink-0" style={{ color: 'rgba(0,0,0,0.50)', minWidth: 120 }}>
                      {p.role}
                    </span>

                    {/* Short desc */}
                    <span className="text-xs flex-1 min-w-0 truncate" style={{ color: 'rgba(0,0,0,0.55)' }}>
                      {shortDesc}
                    </span>

                    {/* Award badge */}
                    {p.award && (
                      <span
                        className="text-xs font-mono px-2 py-0.5 rounded flex-shrink-0"
                        style={{
                          background: p.color,
                          color: 'white',
                          opacity: 0.88,
                        }}
                      >
                        {p.award.includes('동상') ? '동상' : p.award.includes('은상') ? '은상' : p.award.includes('금상') ? '금상' : '수상'}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>

        {/* MDX works section (if any) */}
        {mdxWorks.length > 0 && (
          <div>
            <p className="text-xs font-mono tracking-widest mb-4" style={{ color: 'rgba(0,0,0,0.38)' }}>
              ARTICLES · 글
            </p>
            <div className="grid gap-4">
              {mdxWorks.map((work) => (
                <WorkCard key={work.slug} work={work} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
