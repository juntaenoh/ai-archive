import { getAllWorks } from '@/lib/works'
import WorkCard from '@/components/WorkCard'

export const metadata = {
  title: 'Works — AI Archive',
}

export default function WorksPage() {
  const works = getAllWorks()

  return (
    <div className="max-w-4xl mx-auto px-6 py-16">
      <div className="mb-12">
        <h1 className="text-3xl font-bold text-zinc-100 mb-3">Works</h1>
        <p className="text-zinc-400">
          AI 도구를 활용해 진행한 작업물 모음입니다.
        </p>
      </div>

      {works.length === 0 ? (
        <div className="text-center py-24">
          <p className="text-zinc-600 font-mono text-sm">작업물이 없습니다.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {works.map((work) => (
            <WorkCard key={work.slug} work={work} />
          ))}
        </div>
      )}
    </div>
  )
}
