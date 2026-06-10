import { notFound } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { MDXRemote } from 'next-mdx-remote/rsc'
import { getAllWorkSlugs, getWorkContent } from '@/lib/works'
import AiToolBadge from '@/components/AiToolBadge'
import ProjectDetail from '@/components/ProjectDetail'
import { PROJECT_DATA } from '@/lib/projects'

type Props = { params: Promise<{ slug: string }> }

export async function generateStaticParams() {
  const mdxSlugs = getAllWorkSlugs().map((slug) => ({ slug }))
  const idSlugs = PROJECT_DATA.map((_, i) => ({ slug: String(i + 1) }))
  return [...idSlugs, ...mdxSlugs]
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  const idx = parseInt(slug) - 1
  if (!isNaN(idx) && PROJECT_DATA[idx]) {
    const p = PROJECT_DATA[idx]
    return { title: `${p.label.replace('\n', ' ')} — nohjuntae_` }
  }
  const work = getWorkContent(slug)
  if (!work) return {}
  return { title: `${work.meta.title} — nohjuntae_` }
}

export default async function WorkDetailPage({ params }: Props) {
  const { slug } = await params

  // 숫자 slug → PROJECT_DATA 페이지
  const idx = parseInt(slug) - 1
  if (!isNaN(idx) && PROJECT_DATA[idx]) {
    return (
      <div className="w-full relative" style={{ height: '100vh' }}>
        <ProjectDetail id={idx} />
      </div>
    )
  }

  // 문자 slug → MDX 페이지
  const work = getWorkContent(slug)
  if (!work) notFound()

  const { meta, content } = work

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f0ebe0',
      backgroundImage: 'url(/paper-texture.jpg)',
      backgroundSize: '500px',
      backgroundBlendMode: 'multiply',
    }}>
      <div className="max-w-3xl mx-auto px-6 py-16">
        <Link
          href="/works"
          className="inline-flex items-center gap-1.5 text-sm font-mono mb-10 transition-opacity hover:opacity-70"
          style={{ color: 'rgba(0,0,0,0.45)' }}
        >
          ← works
        </Link>

        <header className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <span className="font-mono text-xs" style={{ color: 'rgba(0,0,0,0.45)' }}>
              {format(new Date(meta.date), 'yyyy년 MM월 dd일')}
            </span>
            <span style={{ color: 'rgba(0,0,0,0.30)' }}>·</span>
            <span className="font-mono text-xs capitalize" style={{ color: 'rgba(0,0,0,0.45)' }}>{meta.category}</span>
          </div>

          <h1 className="text-3xl font-bold mb-4 leading-tight" style={{ color: 'rgba(0,0,0,0.88)' }}>
            {meta.title}
          </h1>

          <p className="text-base leading-relaxed mb-6" style={{ color: 'rgba(0,0,0,0.68)' }}>
            {meta.summary}
          </p>

          <div className="flex flex-wrap gap-2 mb-6">
            {meta.aiTools.map((tool) => (
              <AiToolBadge key={tool} name={tool} />
            ))}
          </div>

          {meta.links && Object.values(meta.links).some(Boolean) && (
            <div className="flex flex-wrap gap-3 pt-4" style={{ borderTop: '1px solid rgba(0,0,0,0.15)' }}>
              {meta.links.github && (
                <a href={meta.links.github} target="_blank" rel="noopener noreferrer"
                  className="text-xs font-mono px-3 py-1.5 rounded transition-colors hover:opacity-70"
                  style={{ color: 'rgba(0,0,0,0.62)', border: '1px solid rgba(0,0,0,0.15)' }}>
                  GitHub ↗
                </a>
              )}
              {meta.links.live && (
                <a href={meta.links.live} target="_blank" rel="noopener noreferrer"
                  className="text-xs font-mono px-3 py-1.5 rounded transition-colors hover:opacity-70"
                  style={{ color: 'rgba(0,0,0,0.62)', border: '1px solid rgba(0,0,0,0.15)' }}>
                  Live ↗
                </a>
              )}
              {meta.links.figma && (
                <a href={meta.links.figma} target="_blank" rel="noopener noreferrer"
                  className="text-xs font-mono px-3 py-1.5 rounded transition-colors hover:opacity-70"
                  style={{ color: 'rgba(0,0,0,0.62)', border: '1px solid rgba(0,0,0,0.15)' }}>
                  Figma ↗
                </a>
              )}
            </div>
          )}
        </header>

        <article className="prose prose-stone max-w-none prose-headings:font-semibold prose-h2:text-xl prose-h2:mt-10 prose-h2:mb-4 prose-a:text-emerald-700 prose-strong:text-stone-800 prose-code:text-emerald-800 prose-code:bg-stone-200 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-pre:bg-stone-100 prose-pre:border prose-pre:border-stone-300 prose-blockquote:border-l-stone-400 prose-hr:border-stone-300">
          <MDXRemote source={content} />
        </article>
      </div>
    </div>
  )
}
