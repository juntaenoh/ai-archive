import Link from 'next/link'
import { getAllWorks } from '@/lib/works'
import WorkCard from '@/components/WorkCard'

export default function HomePage() {
  const recentWorks = getAllWorks().slice(0, 3)

  return (
    <div className="max-w-4xl mx-auto px-6 py-20">
      <section className="mb-20">
        <p className="font-mono text-emerald-400 text-sm mb-4 tracking-widest uppercase">
          AI Archive
        </p>
        <h1 className="text-4xl font-bold text-zinc-100 leading-tight mb-6">
          AI와 함께 만든<br />
          작업물 아카이브
        </h1>
        <p className="text-zinc-400 text-lg leading-relaxed max-w-xl mb-8">
          기획부터 디자인, 개발까지 — AI를 어떻게 활용하는지 과정 전체를 기록합니다.
          단순한 결과물이 아닌, AI와 협업하는 방식 자체를 보여줍니다.
        </p>
        <Link
          href="/works"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-sm rounded-lg transition-colors"
        >
          작업물 보기 →
        </Link>
      </section>

      {recentWorks.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-zinc-100 font-semibold text-lg">최근 작업물</h2>
            <Link href="/works" className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors font-mono">
              전체 보기 →
            </Link>
          </div>
          <div className="grid gap-4">
            {recentWorks.map((work) => (
              <WorkCard key={work.slug} work={work} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
