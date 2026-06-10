'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { PROJECT_DATA, RADAR_LABELS, type ProjectData } from '@/lib/projects'

// ── 도장 SVG 필터 ───────────────────────────────────────────────────────────

const STAMP_GRAD_DIRS: [number, number, number, number][] = [
  [0.5, 1,   0.5, 0  ],
  [0,   1,   1,   0  ],
  [0,   0.5, 1,   0.5],
  [0,   0,   1,   1  ],
  [0.5, 0,   0.5, 1  ],
  [1,   0,   0,   1  ],
  [1,   0.5, 0,   0.5],
  [1,   1,   0,   0  ],
]

const STAMP_GRAD_URIS = STAMP_GRAD_DIRS.map(([x1, y1, x2, y2]) =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1">` +
    `<defs><linearGradient id="g" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" gradientUnits="objectBoundingBox">` +
    `<stop offset="0%" stop-color="#ddd"/>` +
    `<stop offset="100%" stop-color="white"/>` +
    `</linearGradient></defs>` +
    `<rect width="1" height="1" fill="url(#g)"/>` +
    `</svg>`
  )}`
)

function StampFilters() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }}>
      <defs>
        <filter id="pd-stamp" x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.50" numOctaves="4" stitchTiles="stitch" result="noise" />
          <feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 6 -1" in="noise" result="mask" />
          <feComposite in="SourceGraphic" in2="mask" operator="in" />
        </filter>
        {STAMP_GRAD_URIS.map((href, i) => (
          <filter key={i} id={`pd-stamp-${i}`} x="-10%" y="-10%" width="120%" height="120%">
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

function stamp(color: string, dirIdx?: number): React.CSSProperties {
  const filterId = dirIdx !== undefined ? `pd-stamp-${dirIdx % 8}` : 'pd-stamp'
  return {
    backgroundColor: color,
    backgroundImage: 'url(/paper-texture.jpg)',
    backgroundSize: '200px',
    backgroundBlendMode: 'soft-light',
    mixBlendMode: 'multiply',
    color: 'white',
    borderRadius: '3px 5px 4px 2px / 4px 3px 5px 3px',
    border: 'none',
    filter: `url(#${filterId}) saturate(0.82)`,
  }
}

// ── 이미지 패널 ─────────────────────────────────────────────────────────────

function ProjectImages({ images, label }: { images: string[]; label: string }) {
  const [dims, setDims] = useState<Array<{ w: number; h: number } | null>>(
    () => images.map(() => null)
  )

  useEffect(() => {
    setDims(images.map(() => null))
    const result: Array<{ w: number; h: number } | null> = images.map(() => null)
    let done = 0
    let cancelled = false
    const finish = () => {
      done++
      if (done === images.length && !cancelled) setDims([...result])
    }
    images.forEach((src, i) => {
      const img = new window.Image()
      img.onload  = () => { result[i] = { w: img.naturalWidth, h: img.naturalHeight }; finish() }
      img.onerror = () => { result[i] = { w: 16, h: 9 }; finish() }
      img.src = src
    })
    return () => { cancelled = true }
  }, [images])

  const loaded = dims.length === images.length && dims.every(d => d !== null)
  if (!loaded) return <div className="h-full" />

  const validDims = dims as { w: number; h: number }[]
  const portraitCount = validDims.filter(d => d.h > d.w).length
  const n = images.length
  const anim = 'animate-[fadeIn_0.5s_ease-in]'

  const stickerRotations = [-3, 2, -2, 3, -1]
  const stickerStyle = (i: number): React.CSSProperties => ({
    padding: 8,
    backgroundColor: '#fff',
    boxShadow: '2px 4px 12px rgba(0,0,0,0.18)',
    transform: `rotate(${stickerRotations[i % stickerRotations.length]}deg)`,
    flexShrink: 0,
  })

  if (n === 1) {
    const d = validDims[0]
    return (
      <div className={`h-full flex items-center justify-center ${anim}`}>
        <div style={stickerStyle(0)}>
          <img src={images[0]} alt={label}
            style={{ aspectRatio: `${d.w} / ${d.h}`, maxHeight: '38vh', maxWidth: 360, display: 'block' }}
            className="object-cover" />
        </div>
      </div>
    )
  }

  if (n === 3) {
    const ratios = validDims.map(d => d.w / d.h)
    const wideIdx = ratios.indexOf(Math.max(...ratios))
    const others = [0, 1, 2].filter(i => i !== wideIdx)
    return (
      <div className={`h-full flex flex-col items-center justify-center gap-5 ${anim}`}>
        <div style={stickerStyle(wideIdx)}>
          <img src={images[wideIdx]} alt={`${label} 1`}
            style={{ aspectRatio: `${validDims[wideIdx].w} / ${validDims[wideIdx].h}`, maxHeight: '28vh', maxWidth: 480, display: 'block' }}
            className="object-cover" />
        </div>
        <div className="flex gap-5">
          {others.map((oi, ii) => (
            <div key={oi} style={stickerStyle(ii + 1)}>
              <img src={images[oi]} alt={`${label} ${ii + 2}`}
                style={{ aspectRatio: `${validDims[oi].w} / ${validDims[oi].h}`, maxHeight: '26vh', maxWidth: 220, display: 'block' }}
                className="object-cover" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  const rowLayout = portraitCount >= Math.ceil(n / 2)

  if (rowLayout) {
    return (
      <div className={`h-full flex flex-row items-center justify-center gap-6 ${anim}`}>
        {images.map((src, i) => {
          const d = validDims[i]
          return (
            <div key={i} style={stickerStyle(i)}>
              <img src={src} alt={`${label} ${i + 1}`}
                style={{ aspectRatio: `${d.w} / ${d.h}`, maxHeight: '38vh', maxWidth: `${Math.floor(70 / n)}vw`, display: 'block' }}
                className="object-cover" />
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className={`h-full flex flex-col items-center justify-center gap-6 ${anim}`}>
      {images.map((src, i) => {
        const d = validDims[i]
        return (
          <div key={i} style={stickerStyle(i)}>
            <img src={src} alt={`${label} ${i + 1}`}
              style={{ aspectRatio: `${d.w} / ${d.h}`, maxWidth: '65%', maxHeight: `${Math.floor(60 / n)}vh`, display: 'block' }}
              className="object-cover" />
          </div>
        )
      })}
    </div>
  )
}

// ── 레이더 차트 ─────────────────────────────────────────────────────────────

function RadarChart({ stats, color, size = 150, animated = true }: {
  stats: number[]; color: string; size?: number; animated?: boolean
}) {
  const cx = size / 2
  const cy = size / 2
  const r  = size * 0.30
  const angles = Array.from({ length: 6 }, (_, i) => (i * 2 * Math.PI) / 6 - Math.PI / 2)
  const pt = (a: number, v: number) => ({ x: cx + Math.cos(a) * r * v, y: cy + Math.sin(a) * r * v })
  const poly = (pts: { x: number; y: number }[]) =>
    pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(2)},${p.y.toFixed(2)}`).join('') + 'Z'
  const dataPoly = poly(angles.map((a, i) => pt(a, stats[i] ?? 0)))

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ overflow: 'visible' }}>
      {[0.25, 0.5, 0.75, 1.0].map((lvl, i) => (
        <path key={i} d={poly(angles.map(a => pt(a, lvl)))}
          fill="none" stroke="rgba(0,0,0,0.18)" strokeWidth="1.2" />
      ))}
      {angles.map((a, i) => {
        const end = pt(a, 1)
        return <line key={i} x1={cx} y1={cy} x2={end.x} y2={end.y} stroke="rgba(0,0,0,0.15)" strokeWidth="1.2" />
      })}
      <g style={{
        transform: animated ? 'scale(1)' : 'scale(0)',
        transformOrigin: `${cx}px ${cy}px`,
        transition: 'transform 1.4s cubic-bezier(0.16,1,0.3,1)',
      }}>
        <path d={dataPoly} fill={color} fillOpacity="0.22" stroke={color} strokeWidth="2.5" strokeOpacity="0.90" />
        {angles.map((a, i) => {
          const p = pt(a, stats[i] ?? 0)
          return <circle key={i} cx={p.x} cy={p.y} r="3.5" fill={color} />
        })}
      </g>
      {angles.map((a, i) => {
        const lp  = pt(a, 1.42)
        const cos = Math.cos(a)
        const anchor = Math.abs(cos) < 0.15 ? 'middle' : cos > 0 ? 'start' : 'end'
        return (
          <g key={i}>
            <text x={lp.x} y={lp.y - 8} textAnchor={anchor} dominantBaseline="middle"
              fontSize="13" fill="rgba(0,0,0,0.65)" fontFamily="'Pretendard',sans-serif">
              {RADAR_LABELS[i]}
            </text>
            <text x={lp.x} y={lp.y + 10} textAnchor={anchor} dominantBaseline="middle"
              fontSize="12" fill={color} fontWeight="700" fontFamily="'Pretendard',sans-serif">
              {(stats[i] * 5).toFixed(1)}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

// ── 메인 컴포넌트 ────────────────────────────────────────────────────────────

export default function ProjectDetail({ id, onBack, onNavigate }: {
  id: number
  onBack?: () => void
  onNavigate?: (id: number) => void
}) {
  const p = PROJECT_DATA[id]
  const [evalReady, setEvalReady] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setEvalReady(true), 600)
    return () => clearTimeout(t)
  }, [])

  if (!p) return null

  const num = String(id + 1).padStart(2, '0')

  const labelPairs = p.label.replace(/\n/g, ' ').split('')
  const paired: string[] = []
  let i = 0
  while (i < labelPairs.length) {
    const ch = labelPairs[i]
    if (ch === ' ') { paired.push(' '); i++; continue }
    const code = ch.charCodeAt(0)
    if (code > 127) {
      paired.push(ch); i++
    } else {
      const next = labelPairs[i + 1]
      if (next && next.charCodeAt(0) <= 127 && next !== ' ') {
        paired.push(ch + next); i += 2
      } else {
        paired.push(ch); i++
      }
    }
  }

  const cols = Math.max(paired.length, 12)
  const cells = [...paired, ...Array(Math.max(0, cols - paired.length)).fill('')]
  const numRows = Math.ceil(cells.length / cols)
  const gridCells: Array<{ type: 'char' | 'strip'; ch: string }> = []
  for (let r = 0; r < numRows; r++) {
    cells.slice(r * cols, (r + 1) * cols).forEach(ch => gridCells.push({ type: 'char', ch }))
    Array.from({ length: cols }, () => gridCells.push({ type: 'strip', ch: '' }))
  }

  const awardRank = p.award?.includes('동상') ? '銅賞'
    : p.award?.includes('은상') ? '銀賞'
    : p.award?.includes('금상') ? '金賞' : null
  const awardYear = p.award?.match(/\d{4}/)?.[0] ?? p.period.match(/\d{4}/)?.[0] ?? ''

  return (
    <div className="absolute inset-0 flex" style={{
      backgroundColor: '#f0ebe0',
      backgroundImage: 'url(/paper-texture.jpg)',
      backgroundSize: '500px',
      backgroundBlendMode: 'multiply',
    }}>
      <StampFilters />

      {/* 왼쪽: 이미지 패널 */}
      <div className="flex flex-col p-5 gap-3 border-r border-black/10" style={{ width: '46%' }}>
        <div className="flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2 py-0.5 text-xs font-bold font-mono"
              style={stamp(p.color, id * 3)}>
              原 {num}
            </div>
            <span className="text-xs font-mono" style={{ color: 'rgba(0,0,0,0.35)' }}>{p.label.replace('\n', ' ')}</span>
          </div>
          <div className="flex items-center gap-1.5">
            {onBack ? (
              <button onClick={onBack}
                className="text-xs font-mono transition-colors hover:text-black"
                style={{ color: 'rgba(0,0,0,0.35)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                목 록
              </button>
            ) : (
              <Link href="/"
                className="text-xs font-mono transition-colors hover:text-black"
                style={{ color: 'rgba(0,0,0,0.35)' }}>
                목 록
              </Link>
            )}
            <div style={{ width: 1, height: 10, background: 'rgba(0,0,0,0.15)' }} />
            {PROJECT_DATA.map((_, idx) => (
              onNavigate ? (
                <button key={idx}
                  onClick={() => idx !== id && onNavigate(idx)}
                  className="text-xs font-mono w-5 h-5 flex items-center justify-center transition-colors"
                  style={idx === id
                    ? { ...stamp(p.color, idx * 3 + 1), cursor: 'default', border: 'none', padding: 0 }
                    : { color: 'rgba(0,0,0,0.30)', backgroundColor: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}>
                  {String(idx + 1).padStart(2, '0')}
                </button>
              ) : (
              <Link key={idx} replace href={`/works/${idx + 1}`}
                className="text-xs font-mono w-5 h-5 flex items-center justify-center transition-colors"
                style={idx === id
                  ? { ...stamp(p.color, idx * 3 + 1), cursor: 'default' }
                  : { color: 'rgba(0,0,0,0.30)' }}>
                {String(idx + 1).padStart(2, '0')}
              </Link>
              )
            ))}
          </div>
        </div>
        <div className="flex-1 min-h-0">
          <ProjectImages images={p.images} label={p.label} />
        </div>
      </div>

      {/* 오른쪽: 정보 패널 */}
      <div className="flex flex-col px-6 py-4 overflow-y-auto relative" style={{ width: '54%' }}>
        <div className="flex items-center mb-2 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div style={{ width: 28, height: 2, background: p.color }} />
            <span className="text-xs font-mono tracking-widest uppercase" style={{ color: p.color }}>
              PROJECT {num} · {p.period}
            </span>
          </div>
        </div>

        {p.award && awardRank && (
          <div className="absolute flex flex-col items-center justify-center rounded-full z-10"
            style={{
              width: 72, height: 72,
              top: 16, right: 24,
              transform: 'rotate(12deg)',
              ...stamp(p.color, (id + 4) % 8),
            }}>
            <span className="text-base font-bold leading-tight">{awardRank}</span>
            <span className="text-[11px] leading-tight font-mono">{awardYear}</span>
          </div>
        )}

        {/* 원고지 타이틀 */}
        <div className="flex-shrink-0 mb-1 mt-4" style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          border: '1px solid rgba(0,0,0,0.15)',
        }}>
          {gridCells.map((cell, ci) =>
            cell.type === 'char' ? (
              <div key={ci} className="flex items-center justify-center"
                style={{ border: '1px solid rgba(0,0,0,0.10)', aspectRatio: '1 / 1' }}>
                <span className="font-bold select-none" style={{
                  fontSize: '1.3rem',
                  color: '#111',
                  lineHeight: 1,
                  display: 'inline-block',
                  transform: cell.ch.length >= 2 ? 'scaleX(0.75)' : undefined,
                }}>
                  {cell.ch}
                </span>
              </div>
            ) : (
              <div key={ci} style={{ border: '1px solid rgba(0,0,0,0.07)', height: 8 }} />
            )
          )}
        </div>

        <p className="text-sm mb-3 flex-shrink-0" style={{ color: 'rgba(0,0,0,0.45)' }}>
          {p.subtitle}
        </p>

        <div className="space-y-2 mb-3 flex-shrink-0">
          <div className="flex items-start gap-4">
            <span className="text-sm font-mono w-14 flex-shrink-0 tracking-wider" style={{ color: 'rgba(0,0,0,0.45)' }}>사용 기술</span>
            <div className="flex flex-wrap gap-2">
              {p.stack.map((s, si) => (
                <span key={s} className="text-sm font-mono font-semibold px-3 py-1"
                  style={stamp(p.color, si * 2 + 1)}>
                  {s}
                </span>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm font-mono w-14 flex-shrink-0 tracking-wider" style={{ color: 'rgba(0,0,0,0.45)' }}>역 할</span>
            <span className="text-sm" style={{ color: 'rgba(0,0,0,0.72)' }}>{p.role}</span>
          </div>
          {p.award && (
            <div className="flex items-center gap-4">
              <span className="text-sm font-mono w-14 flex-shrink-0 tracking-wider" style={{ color: 'rgba(0,0,0,0.45)' }}>성 과</span>
              <span className="text-sm" style={{ color: 'rgba(0,0,0,0.72)' }}>🥉 {p.award}</span>
            </div>
          )}
          {p.link && (
            <div className="flex items-center gap-4">
              <span className="text-sm font-mono w-14 flex-shrink-0 tracking-wider" style={{ color: 'rgba(0,0,0,0.45)' }}>링 크</span>
              <a href={p.link} target="_blank" rel="noopener noreferrer"
                className="text-sm font-mono transition-colors hover:opacity-70"
                style={{ color: p.color }}>
                {p.linkLabel} →
              </a>
            </div>
          )}
        </div>

        <div className="mb-4 flex-shrink-0 space-y-2">
          {([
            { label: '문 제', text: p.problem },
            { label: '의 도', text: p.intent },
            { label: '결 과', text: p.outcome },
          ] as const).map(({ label, text }) => (
            <div key={label} style={{
              background: 'rgba(255,255,255,0.68)',
              border: '1px solid rgba(0,0,0,0.09)',
              borderTop: `2px solid ${p.color}`,
              boxShadow: '1px 3px 8px rgba(0,0,0,0.10)',
              borderRadius: '0 0 3px 3px',
              padding: '10px 14px',
            }}>
              <span className="text-xs font-mono tracking-widest block mb-1.5" style={{ color: 'rgba(0,0,0,0.38)' }}>
                {label}
              </span>
              <p className="text-sm leading-relaxed" style={{ color: 'rgba(0,0,0,0.78)' }}>{text}</p>
            </div>
          ))}
        </div>

        <div className="flex-shrink-0 flex gap-4 items-start">
          <div className="flex-1 min-w-0">
            <span className="text-xs font-mono tracking-widest mb-2 block" style={{ color: 'rgba(0,0,0,0.35)' }}>
              평 가
            </span>
            <div className="space-y-2">
              {RADAR_LABELS.map((label, li) => (
                <div key={li} className="flex items-center gap-3">
                  <span className="text-sm w-14 flex-shrink-0" style={{ color: 'rgba(0,0,0,0.62)' }}>{label}</span>
                  <div className="flex-1 h-2.5 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.08)' }}>
                    <div className="h-full rounded-full" style={{
                      width: evalReady ? `${p.stats[li] * 100}%` : '0%',
                      background: p.color,
                      transition: 'width 1.4s cubic-bezier(0.16,1,0.3,1)',
                    }} />
                  </div>
                  <span className="text-xs font-mono w-7 text-right" style={{ color: p.color }}>
                    {(p.stats[li] * 5).toFixed(1)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex-shrink-0 mt-5">
            <RadarChart stats={p.stats} color={p.color} size={160} animated={evalReady} />
          </div>
        </div>
      </div>
    </div>
  )
}
