import { notFound } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { MDXRemote } from 'next-mdx-remote/rsc'
import { getAllWorkSlugs, getWorkContent } from '@/lib/works'
import AiToolBadge from '@/components/AiToolBadge'

type Props = { params: Promise<{ slug: string }> }

export async function generateStaticParams() {
  return getAllWorkSlugs().map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  const work = getWorkContent(slug)
  if (!work) return {}
  return { title: `${work.meta.title} — AI Archive` }
}

export default async function WorkDetailPage({ params }: Props) {
  const { slug } = await params
  const work = getWorkContent(slug)
  if (!work) notFound()

  const { meta, content } = work

  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <Link
        href="/works"
        className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-300 font-mono mb-10 transition-colors"
      >
        ← works
      </Link>

      <header className="mb-10">
        <div className="flex items-center gap-3 mb-4">
          <span className="font-mono text-xs text-zinc-500">
            {format(new Date(meta.date), 'yyyy년 MM월 dd일')}
          </span>
          <span className="text-zinc-700">·</span>
          <span className="font-mono text-xs text-zinc-500 capitalize">{meta.category}</span>
        </div>

        <h1 className="text-3xl font-bold text-zinc-100 mb-4 leading-tight">
          {meta.title}
        </h1>

        <p className="text-zinc-400 text-base leading-relaxed mb-6">
          {meta.summary}
        </p>

        <div className="flex flex-wrap gap-2 mb-6">
          {meta.aiTools.map((tool) => (
            <AiToolBadge key={tool} name={tool} />
          ))}
        </div>

        {meta.links && Object.values(meta.links).some(Boolean) && (
          <div className="flex flex-wrap gap-3 pt-4 border-t border-zinc-800">
            {meta.links.github && (
              <a
                href={meta.links.github}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-mono text-zinc-400 hover:text-zinc-100 border border-zinc-700 hover:border-zinc-500 px-3 py-1.5 rounded transition-colors"
              >
                GitHub ↗
              </a>
            )}
            {meta.links.live && (
              <a
                href={meta.links.live}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-mono text-zinc-400 hover:text-zinc-100 border border-zinc-700 hover:border-zinc-500 px-3 py-1.5 rounded transition-colors"
              >
                Live ↗
              </a>
            )}
            {meta.links.figma && (
              <a
                href={meta.links.figma}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-mono text-zinc-400 hover:text-zinc-100 border border-zinc-700 hover:border-zinc-500 px-3 py-1.5 rounded transition-colors"
              >
                Figma ↗
              </a>
            )}
          </div>
        )}
      </header>

      <article className="prose prose-invert prose-zinc max-w-none prose-headings:font-semibold prose-h2:text-xl prose-h2:mt-10 prose-h2:mb-4 prose-p:text-zinc-300 prose-p:leading-relaxed prose-a:text-emerald-400 prose-strong:text-zinc-100 prose-code:text-emerald-300 prose-code:bg-zinc-800 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-pre:bg-zinc-900 prose-pre:border prose-pre:border-zinc-800 prose-blockquote:border-l-emerald-500 prose-blockquote:text-zinc-400 prose-hr:border-zinc-800">
        <MDXRemote source={content} />
      </article>
    </div>
  )
}
