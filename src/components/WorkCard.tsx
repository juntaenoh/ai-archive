import Link from 'next/link'
import { format } from 'date-fns'
import type { WorkMeta } from '@/types/work'
import AiToolBadge from './AiToolBadge'

const CATEGORY_LABEL: Record<WorkMeta['category'], string> = {
  'planning': '기획',
  'design': '디자인',
  'development': '개발',
  'full-stack': '풀스택',
}

type Props = { work: WorkMeta }

export default function WorkCard({ work }: Props) {
  return (
    <Link href={`/works/${work.slug}`} className="group block">
      <article className="border border-zinc-800 rounded-lg p-5 bg-zinc-900 hover:border-zinc-600 hover:bg-zinc-800/80 transition-all duration-200">
        <div className="flex items-start justify-between gap-4 mb-3">
          <h2 className="text-zinc-100 font-semibold text-base group-hover:text-emerald-400 transition-colors leading-snug">
            {work.title}
          </h2>
          <span className="shrink-0 text-xs text-zinc-500 font-mono mt-0.5">
            {format(new Date(work.date), 'yyyy.MM')}
          </span>
        </div>

        <p className="text-sm text-zinc-400 mb-4 line-clamp-2 leading-relaxed">
          {work.summary}
        </p>

        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex flex-wrap gap-1.5">
            {work.aiTools.map((tool) => (
              <AiToolBadge key={tool} name={tool} />
            ))}
          </div>
          <span className="text-xs text-zinc-600 font-mono shrink-0">
            {CATEGORY_LABEL[work.category]}
          </span>
        </div>
      </article>
    </Link>
  )
}
