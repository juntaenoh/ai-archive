import type { Metadata } from 'next'
import AiToolBadge from '@/components/AiToolBadge'

export const metadata: Metadata = {
  title: 'About — AI Archive',
}

const AI_TOOLS = ['Claude', 'Cursor', 'ChatGPT', 'Figma', 'v0', 'Midjourney']

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-bold text-zinc-100 mb-10">About</h1>

      <section className="mb-12">
        <h2 className="text-lg font-semibold text-zinc-100 mb-4">소개</h2>
        <div className="space-y-4 text-zinc-400 leading-relaxed">
          <p>
            기획, 디자인, 개발 전 과정에서 AI 도구를 활용해 작업합니다.
            이 사이트는 그 과정을 투명하게 기록하는 아카이브입니다.
          </p>
          <p>
            단순히 &quot;AI로 만들었다&quot;가 아니라, 어떤 프롬프트를 사용했고, 어디서 AI의 답변을
            수정했으며, 어떤 판단은 직접 내렸는지 — 협업의 실제 흔적을 남깁니다.
          </p>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-lg font-semibold text-zinc-100 mb-4">사용 도구</h2>
        <div className="flex flex-wrap gap-2">
          {AI_TOOLS.map((tool) => (
            <AiToolBadge key={tool} name={tool} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-zinc-100 mb-4">연락</h2>
        <p className="text-zinc-400 text-sm font-mono">
          wnsxoze@gmail.com
        </p>
      </section>
    </div>
  )
}
