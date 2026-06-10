'use client'

import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react'

// ── 데이터 ────────────────────────────────────────────────────────────────────

const SKILLS = [
  { name: 'Dart / Flutter', pct: 85, note: '실제 서비스 1년 운영' },
  { name: 'Python / C++',   pct: 60, note: '알고리즘 문제 해결' },
  { name: '서비스 기획',    pct: 80, note: 'B2C · B2B2C · 연구자 3트랙' },
  { name: '커뮤니케이션',   pct: 90, note: '외부 파트너 · 병원 · 지자체 · 해외' },
  { name: '아키텍처 설계',  pct: 65, note: 'Riverpod 클린 아키텍처' },
  { name: '리더십 / 주도성',pct: 80, note: '본질을 찾아 방향을 스스로 확립' },
]

const TOOLS = ['Figma', 'Jira / Confluence', 'Claude', 'Blender', 'Unity']

const AWARDS = [
  { year: '2023', title: '한이음 공모전',                  rank: '동상',  org: '한국정보산업연합회', desc: '수중 협소구역 무인 탐사정' },
  { year: '2023', title: '임베디드 창의로봇 Challenge',    rank: '우수상', org: '한국로봇산업협회',   desc: 'EV3 SPACE Challenge 2등' },
  { year: '2022', title: '캡스톤 디자인 경진대회',         rank: '동상',  org: 'LINC 3.0 사업단',    desc: 'AI 기반 주차 안내 앱' },
  { year: '2022', title: '스마트해상물류경진대회',         rank: '동상',  org: '한국정보산업연합회', desc: '스마트 해양오염 모니터링' },
]

// ── 도장 유틸 ─────────────────────────────────────────────────────────────────

const STAMP_GRAD_DIRS: [number,number,number,number][] = [
  [0.5,1,0.5,0],[0,1,1,0],[0,0.5,1,0.5],[0,0,1,1],
  [0.5,0,0.5,1],[1,0,0,1],[1,0.5,0,0.5],[1,1,0,0],
]

function stamp(color: string, dir = 0): CSSProperties {
  return {
    backgroundColor: color,
    backgroundImage: 'url(/paper-texture.png)',
    backgroundSize: '200px',
    backgroundBlendMode: 'soft-light',
    mixBlendMode: 'multiply',
    color: 'white',
    borderRadius: '3px 5px 4px 2px / 4px 3px 5px 3px',
    filter: `url(#about-stamp-${dir % 8}) saturate(0.82)`,
  }
}

function StampFilters() {
  const uris = STAMP_GRAD_DIRS.map(([x1,y1,x2,y2]) =>
    `data:image/svg+xml,${encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1">` +
      `<defs><linearGradient id="g" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" gradientUnits="objectBoundingBox">` +
      `<stop offset="0%" stop-color="#ddd"/><stop offset="100%" stop-color="white"/>` +
      `</linearGradient></defs><rect width="1" height="1" fill="url(#g)"/></svg>`
    )}`
  )
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }}>
      <defs>
        {uris.map((href, i) => (
          <filter key={i} id={`about-stamp-${i}`} x="-10%" y="-10%" width="120%" height="120%">
            <feTurbulence type="fractalNoise" baseFrequency="0.50" numOctaves="4" stitchTiles="stitch" result="noise" />
            <feImage href={href} preserveAspectRatio="none" result="grad" />
            <feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  3.5 0 0 0 -0.6" in="grad" result="gmod" />
            <feComposite in="noise" in2="gmod" operator="arithmetic" k1="1" k2="0" k3="0" k4="0" result="modulated" />
            <feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 6 -1" in="modulated" result="mask" />
            <feComposite in="SourceGraphic" in2="mask" operator="in" />
          </filter>
        ))}
      </defs>
    </svg>
  )
}

// ── 스크롤 reveal ─────────────────────────────────────────────────────────────

function Reveal({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.style.opacity = '1'
          el.style.transform = 'translateY(0)'
          obs.disconnect()
        }
      },
      { threshold: 0.12 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      style={{
        opacity: 0,
        transform: 'translateY(22px)',
        transition: `opacity 0.65s ease ${delay}ms, transform 0.65s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  )
}

// ── 스킬 바 ───────────────────────────────────────────────────────────────────

function SkillBar({ name, pct, note, delay }: { name: string; pct: number; note: string; delay: number }) {
  const barRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = barRef.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.style.width = `${pct}%`
          obs.disconnect()
        }
      },
      { threshold: 0.5 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [pct])

  return (
    <div style={{ transitionDelay: `${delay}ms` }}>
      <div className="flex items-baseline justify-between mb-1.5">
        <span className="text-sm font-semibold" style={{ color: 'rgba(0,0,0,0.80)' }}>{name}</span>
        <span className="text-xs font-mono" style={{ color: 'rgba(0,0,0,0.38)' }}>{note}</span>
      </div>
      <div className="relative h-2 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.08)' }}>
        <div
          ref={barRef}
          className="absolute inset-y-0 left-0 rounded-full"
          style={{
            width: 0,
            background: '#2c2218',
            backgroundImage: 'url(/paper-texture.png)',
            backgroundSize: '120px',
            backgroundBlendMode: 'soft-light',
            mixBlendMode: 'multiply',
            transition: `width 1.1s cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
            filter: 'url(#about-stamp-4) saturate(0.7)',
          }}
        />
      </div>
    </div>
  )
}

// ── 메인 ──────────────────────────────────────────────────────────────────────

export default function AboutContent({ onBack }: { onBack?: () => void }) {
  return (
    <div
      className="min-h-full relative"
      style={{
        backgroundColor: '#f0ebe0',
        backgroundImage: 'url(/paper-texture.png)',
        backgroundSize: '500px',
        backgroundBlendMode: 'multiply',
        color: 'rgba(0,0,0,0.82)',
      }}
    >
      <StampFilters />

      <div className="max-w-4xl mx-auto px-8 pt-12 pb-24">

        {/* 상단 바 */}
        <div className="flex items-center justify-between mb-12">
          <span className="font-mono text-xs tracking-widest select-none" style={{ color: 'rgba(0,0,0,0.35)' }}>
            原稿　<span style={{ color: 'rgba(0,0,0,0.55)', fontWeight: 700 }}>ABOUT</span>
          </span>
          {onBack && (
            <button onClick={onBack} className="font-mono text-xs tracking-widest hover:opacity-60 transition-opacity" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'rgba(0,0,0,0.45)' }}>
              ← 목 록
            </button>
          )}
        </div>

        {/* ── 1. HERO ─────────────────────────────────────────────── */}
        <div className="grid gap-12 mb-24" style={{ gridTemplateColumns: '180px 1fr', alignItems: 'start' }}>

          {/* 사진 */}
          <div>
            <div className="relative" style={{ background: '#fff', padding: 8, boxShadow: '0 20px 40px -16px rgba(60,40,20,0.35)', border: '1px solid rgba(0,0,0,0.1)' }}>
              <div className="absolute left-1/2 -translate-x-1/2" style={{ top: -10, width: 72, height: 17, background: 'rgba(0,0,0,0.06)', border: '1px dashed rgba(0,0,0,0.16)', transform: 'translateX(-50%) rotate(-1.5deg)' }} />
              <img src="/profile.jpg" alt="노준태" style={{ width: '100%', display: 'block', aspectRatio: '3/4', objectFit: 'cover', objectPosition: 'top' }} />
            </div>
            <p className="text-center font-mono text-xs mt-3 tracking-widest" style={{ color: 'rgba(0,0,0,0.28)' }}>증　明</p>
          </div>

          {/* 이름 + 첫 인상 */}
          <div className="pt-2">
            <p className="font-mono text-xs tracking-widest mb-4" style={{ color: 'rgba(0,0,0,0.38)' }}>ABOUT · 開發者</p>

            <div className="flex items-end gap-3 mb-6">
              <div className="flex" style={{ border: '1px solid rgba(0,0,0,0.15)' }}>
                {['노','준','태'].map((ch, i) => (
                  <div key={ch} className="flex flex-col" style={{ borderRight: i < 2 ? '1px solid rgba(0,0,0,0.15)' : undefined }}>
                    <div className="w-14 h-14 flex items-center justify-center text-[28px] font-bold" style={{ borderBottom: '1px solid rgba(0,0,0,0.08)', color: 'rgba(0,0,0,0.88)' }}>{ch}</div>
                    <div className="w-14 h-2.5" />
                  </div>
                ))}
              </div>
              <span className="text-lg font-medium pb-3" style={{ color: 'rgba(0,0,0,0.55)' }}>입니다.</span>
            </div>

            <p className="text-base leading-relaxed mb-5" style={{ color: 'rgba(0,0,0,0.58)' }}>
              안녕하세요. IT 서비스의 본질을 찾는 개발자
            </p>

            {/* 핵심 태그 3개 */}
            <div className="flex flex-wrap gap-2">
              {['Flutter 개발', '서비스 기획', '스타트업'].map((tag, i) => (
                <span key={tag} className="font-mono text-xs px-3 py-1.5 font-bold" style={stamp('#2c2218', i * 2 + 1)}>
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* ── 2. 철학 인용구 ───────────────────────────────────────── */}
        <Reveal>
          <div className="mb-24 py-10 px-8 relative" style={{ borderTop: '2px solid rgba(0,0,0,0.12)', borderBottom: '2px solid rgba(0,0,0,0.12)' }}>
            <span className="absolute -top-5 left-8 font-mono text-xs px-2 py-0.5" style={stamp('#b02020', 0)}>핵심 가치관</span>
            <blockquote className="text-2xl font-bold leading-relaxed" style={{ color: 'rgba(0,0,0,0.82)', letterSpacing: '-0.01em' }}>
              "제품을 어떻게 만드는지보다,<br />
              <span style={{ color: 'rgba(0,0,0,0.45)', fontWeight: 400 }}>왜 만드는지가 먼저입니다."</span>
            </blockquote>
            <p className="mt-5 text-sm leading-relaxed" style={{ color: 'rgba(0,0,0,0.55)', maxWidth: 480 }}>
              개발자로 시작해 기획을 병행하게 된 이유입니다. 코드보다 본질이 먼저라는 생각이, 지금 저의 방향을 만들었습니다.
            </p>
          </div>
        </Reveal>

        {/* ── 3. 여정 타임라인 ─────────────────────────────────────── */}
        <Reveal>
          <div className="mb-24">
            <p className="font-mono text-xs tracking-widest mb-8" style={{ color: 'rgba(0,0,0,0.38)' }}>JOURNEY · 여정</p>

            <div className="relative">
              {/* 가로 선 */}
              <div className="absolute top-5 left-0 right-0 h-px" style={{ background: 'rgba(0,0,0,0.1)' }} />

              <div className="grid grid-cols-4 gap-4">
                {[
                  { year: '2018', label: '한국해양대\n컴퓨터공학 입학', dim: true },
                  { year: '2023.01', label: '스타트업 입사\nFlutter 앱 개발', dim: false },
                  { year: '2024.02', label: '한국해양대\n졸업', dim: false },
                  { year: '현재', label: '기획 병행\n전체 구조 설계', dim: false, accent: true },
                ].map((step, i) => (
                  <div key={i} className="relative pt-10">
                    {/* 점 */}
                    <div
                      className="absolute top-0 left-4 w-10 h-10 flex items-center justify-center font-mono text-xs font-bold"
                      style={step.accent ? { ...stamp('#b02020', i) } : { ...stamp('#2c2218', i + 1), opacity: step.dim ? 0.55 : 1 }}
                    >
                      {step.year === '현재' ? '今' : step.year.slice(2, 4)}
                    </div>
                    <p className="font-mono text-xs mb-1" style={{ color: 'rgba(0,0,0,0.38)' }}>{step.year}</p>
                    <p className="text-sm font-medium leading-snug whitespace-pre-line" style={{ color: step.dim ? 'rgba(0,0,0,0.42)' : 'rgba(0,0,0,0.75)' }}>
                      {step.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Reveal>

        {/* ── 4. 스킬 ─────────────────────────────────────────────── */}
        <Reveal>
          <div className="mb-24">
            <p className="font-mono text-xs tracking-widest mb-8" style={{ color: 'rgba(0,0,0,0.38)' }}>SKILLS · 역량</p>

            <div className="grid gap-5 mb-8">
              {SKILLS.map((s, i) => (
                <SkillBar key={s.name} {...s} delay={i * 80} />
              ))}
            </div>

            <div className="flex flex-wrap gap-2 pt-4" style={{ borderTop: '1px solid rgba(0,0,0,0.08)' }}>
              <span className="font-mono text-xs tracking-widest mr-2 self-center" style={{ color: 'rgba(0,0,0,0.35)' }}>TOOLS</span>
              {TOOLS.map((t, i) => (
                <span key={t} className="font-mono text-sm px-3 py-1.5 font-semibold" style={stamp('#2c2218', i * 3 + 1)}>{t}</span>
              ))}
            </div>
          </div>
        </Reveal>

        {/* ── 5. 수상 ─────────────────────────────────────────────── */}
        <Reveal>
          <div className="mb-24">
            <p className="font-mono text-xs tracking-widest mb-6" style={{ color: 'rgba(0,0,0,0.38)' }}>AWARDS · 수상</p>

            <div className="grid grid-cols-2 gap-3">
              {AWARDS.map((a, i) => (
                <div key={i} className="p-4 relative" style={{ background: 'rgba(255,255,255,0.5)', border: '1px solid rgba(0,0,0,0.1)' }}>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-sm font-semibold leading-snug" style={{ color: 'rgba(0,0,0,0.82)' }}>{a.title}</span>
                    <span className="flex-none font-mono text-xs font-bold px-2 py-0.5 self-start" style={stamp(a.rank === '우수상' ? '#8a6520' : '#2c2218', (i + 3) % 8)}>
                      {a.rank}
                    </span>
                  </div>
                  <p className="text-xs mb-1" style={{ color: 'rgba(0,0,0,0.55)' }}>{a.desc}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs" style={{ color: 'rgba(0,0,0,0.35)' }}>{a.org}</span>
                    <span className="font-mono text-xs" style={{ color: 'rgba(0,0,0,0.35)' }}>{a.year}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Reveal>

        {/* ── 6. 연락 ─────────────────────────────────────────────── */}
        <Reveal>
          <div className="pt-8" style={{ borderTop: '1px solid rgba(0,0,0,0.1)' }}>
            <p className="font-mono text-xs tracking-widest mb-3" style={{ color: 'rgba(0,0,0,0.38)' }}>CONTACT · 연락</p>
            <a href="mailto:wnsxoze@gmail.com" className="font-mono text-base hover:opacity-60 transition-opacity" style={{ color: 'rgba(0,0,0,0.70)', textDecoration: 'none' }}>
              wnsxoze@gmail.com
            </a>
          </div>
        </Reveal>

      </div>
    </div>
  )
}
