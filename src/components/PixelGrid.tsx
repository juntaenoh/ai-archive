'use client'

import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { useAnimation } from '@/context/AnimationContext'

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

  // 스티커 느낌: 흰 테두리 + 약간 기울어진 그림자
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

  // 3장: 가장 가로 긴 것 위에 단독, 나머지 둘 아래 나란히
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

const CUBE      = 0.72
const THIN      = 0.14
const CUBE_H    = 20
const GAP_X     = 0.75
const LINE_GAP  = 0.04
const PAIR_H    = CUBE + LINE_GAP * 2 + THIN
const FOV       = 15
const TARGET_PX = 30

const WAVE_SPEED    = 15
const KICK          = 0.40
const KICK_SIGMA    = 0.045
const GRAVITY       = 0.058
const AIR_DAMP      = 0.985
const HOVER_FORCE   = 0.15
const HOVER_SIGMA   = 2.2
const HOVER_MAX     = 3.5
const HOVER_PAUSE   = 1.5
const IMPULSE_DECAY = 5.0

const INTRO_LETTERS = [
  '안녕하세요.\nAI 시대를 잘 즐기고 있는\n개발자 노준태입니다.',
  '이 안에는\n숨겨진 프로젝트들이\n있습니다.',
  '이 원고지를\n가득\n채우고 싶습니다.',
  '따봉',
]

// stats 순서: [재미, 완성도, 창의성, 기술력, 실용성, 근성] (0–1, 화면 표시 ×5)
const PROJECT_DATA = [
  {
    color: '#C0392B',
    label: '수중 협소구역\n무인 탐사잠수정',
    subtitle: 'Underwater ROV for Confined-Area Search',
    period: '2023',
    role: '임베디드 · 프론트엔드',
    stack: ['C++', 'Raspberry Pi', 'Embedded C', 'Servo / Sonar'],
    desc: '실종자 탐색용 ROV에 가변 프레임과 음파탐지 레이더를 추가해 협소 구역 탐사 성능을 높인 무인 잠수정. 음파 신호와 서보 데이터를 결합한 레이더 그래픽을 실시간으로 표출.',
    award: '2023 한이음 공모전 동상',
    link: null as string | null,
    linkLabel: '',
    images: ['/projects/submarine.png'],
    stats: [0.8, 0.6, 1.0, 0.8, 0.4, 0.4],
  },
  {
    color: '#0891B2',
    label: '해양 오염\n모니터링 탐사함',
    subtitle: 'Marine Pollution Monitoring Vessel',
    period: '2022',
    role: 'PM · 임베디드 · 프론트엔드',
    stack: ['Arduino/ESP', 'C++', 'Firebase', 'Flutter'],
    desc: '탁도 센서를 탑재한 자율주행 보트로 해양 오염을 실시간 측정하고, 일정 수치 초과 시 GPS 기반 오염 위치를 앱으로 전달하는 저비용 모니터링 시스템.',
    award: '2022 스마트해상물류경진대회 동상',
    link: null as string | null,
    linkLabel: '',
    images: ['/projects/ocean.jpg'],
    stats: [0.8, 0.8, 0.6, 0.6, 1.0, 0.8],
  },
  {
    color: '#059669',
    label: '영상깊이 탐색\n스마트 테이블',
    subtitle: 'Depth-Sensing Smart Adjustable Desk',
    period: '2022',
    role: '기획 · 임베디드 · 프론트엔드 · 하드웨어',
    stack: ['Arduino/ESP', 'C++', 'Firebase', 'Flutter'],
    desc: '딥러닝 영상 깊이 측정으로 사용자 체형에 맞는 높이를 자동 설정하는 스마트 책상. Flutter 앱에서 블루투스로 데이터를 전송해 모터를 제어.',
    award: null as string | null,
    link: null as string | null,
    linkLabel: '',
    images: ['/projects/table1.jpg', '/projects/table2.jpg', '/projects/table3_new.jpg'],
    stats: [1.0, 0.4, 1.0, 0.4, 0.4, 1.0],
  },
  {
    color: '#7C3AED',
    label: 'AI 기반\n주차 안내 시스템',
    subtitle: 'AI-Powered Parking Guidance System',
    period: '2022.09 – 2022.11',
    role: '서버 · 임베디드 · 프론트엔드',
    stack: ['Flutter', 'Firebase', 'Python', 'YOLO'],
    desc: 'CCTV 영상을 딥러닝으로 분석해 실시간 주차 공간 현황을 앱으로 제공하는 시스템. 소규모 설치 비용으로 주차장 전체를 커버.',
    award: '캡스톤 디자인 경진대회 동상',
    link: null as string | null,
    linkLabel: '',
    images: ['/projects/parking2.jpg', '/projects/parking3.jpg', '/projects/parking4.jpg'],
    stats: [0.6, 0.8, 0.6, 0.8, 1.0, 0.6],
  },
  {
    color: '#EA580C',
    label: '여행기 자동\n기록 어플리케이션',
    subtitle: 'Automatic Travel Journal App',
    period: '2025.07 – 2025.09',
    role: '기획 · 프론트엔드 · 디자인',
    stack: ['Flutter'],
    desc: 'GPS/위치 기반으로 방문 장소를 자동 태깅해 사용자 입력 없이 여행기가 완성되는 앱. 4인 팀 프로젝트, App Store 출시.',
    award: null as string | null,
    link: 'https://apps.apple.com/kr/app/beezip/id6749936965',
    linkLabel: 'App Store',
    images: ['/projects/beezip.png'],
    stats: [1.0, 1.0, 0.8, 0.6, 1.0, 0.8],
  },
  {
    color: '#DB2777',
    label: '실시간 비전 기반\n운동 코칭',
    subtitle: 'Real-time Vision-Based Exercise Coaching',
    period: '2025',
    role: '단독 개발',
    stack: ['Flutter', 'C++', 'CoreML', 'CocoaPods'],
    desc: '비전 데이터로 운동 자세를 실시간 분석해 횟수를 자동 카운팅하는 코칭 기능. 체형·위치 차이를 보정하는 스마트 포즈 분석 알고리즘 설계 및 CocoaPod 배포.',
    award: null as string | null,
    link: 'https://cocoapods.org/pods/ExerciseSegmentAPI',
    linkLabel: 'CocoaPods',
    images: ['/projects/coaching1.png', '/projects/coaching2.png', '/projects/coaching3.png'],
    stats: [0.8, 0.8, 0.6, 1.0, 0.8, 1.0],
  },
]

const RADAR_LABELS = ['재미', '완성도', '창의성', '기술력', '실용성', '노력']

function RadarChart({ stats, color, size = 150, animated = true }: { stats: number[]; color: string; size?: number; animated?: boolean }) {
  const cx = size / 2
  const cy = size / 2
  const r  = size * 0.30

  const angles = Array.from({ length: 6 }, (_, i) => (i * 2 * Math.PI) / 6 - Math.PI / 2)
  const pt = (a: number, v: number) => ({
    x: cx + Math.cos(a) * r * v,
    y: cy + Math.sin(a) * r * v,
  })
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
        return <line key={i} x1={cx} y1={cy} x2={end.x} y2={end.y}
          stroke="rgba(0,0,0,0.15)" strokeWidth="1.2" />
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

const fovRad = (FOV * Math.PI) / 180
const getCamY = (h: number) => CUBE * h / (2 * TARGET_PX * Math.tan(fovRad / 2))

// 8방향 도장 그라디언트: (x1,y1)=dark side, (x2,y2)=light side (objectBoundingBox)
const STAMP_GRAD_DIRS: [number, number, number, number][] = [
  [0.5, 1,   0.5, 0  ],  // 0: bottom dark → top light
  [0,   1,   1,   0  ],  // 1: bottom-left dark → top-right light
  [0,   0.5, 1,   0.5],  // 2: left dark → right light
  [0,   0,   1,   1  ],  // 3: top-left dark → bottom-right light
  [0.5, 0,   0.5, 1  ],  // 4: top dark → bottom light
  [1,   0,   0,   1  ],  // 5: top-right dark → bottom-left light
  [1,   0.5, 0,   0.5],  // 6: right dark → left light
  [1,   1,   0,   0  ],  // 7: bottom-right dark → top-left light
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

export default function PixelGrid() {
  const mountRef = useRef<HTMLDivElement>(null)
  const { paused } = useAnimation()
  const pausedRef = useRef(paused)
  useEffect(() => { pausedRef.current = paused }, [paused])

  const stamp = (color: string, dirIdx?: number): React.CSSProperties => {
    const filterId = dirIdx !== undefined ? `stamp-erode-${dirIdx % 8}` : 'stamp-erode'
    return {
      backgroundColor: color,
      backgroundImage: 'url(/paper-texture.png)',
      backgroundSize: '200px',
      backgroundBlendMode: 'soft-light',
      mixBlendMode: 'multiply',
      color: 'white',
      borderRadius: '3px 5px 4px 2px / 4px 3px 5px 3px',
      border: 'none',
      filter: `url(#${filterId}) saturate(0.82)`,
    }
  }

  const [started, setStarted] = useState(false)
  const startedRef    = useRef(false)
  const pendingStart  = useRef(false)
  const letterIdxRef       = useRef(0)
  const rebuildTextRef     = useRef<((text: string) => void) | null>(null)
  const pendingLetterRef   = useRef<number | null>(null)
  const peakReachedRef     = useRef(false)

  const [revealedProject, setRevealedProject] = useState<number | null>(null)
  const [revealFading, setRevealFading] = useState(false)
  const [evalReady, setEvalReady] = useState(false)
  const blastRef        = useRef(false)
  const blastProjectRef = useRef(-1)
  const blastTimeRef    = useRef(0)
  const blastSourcesRef = useRef<{x:number,z:number,delay:number}[]>([])
  const blastNoiseRef   = useRef<Float32Array>(new Float32Array(0))
  const revealShownRef  = useRef(false)
  const resetRef          = useRef(false)
  const frozenRef         = useRef(false)
  const sceneRef          = useRef<THREE.Scene | null>(null)
  const fadeOutRef        = useRef(false)
  const fadeProgressRef   = useRef(1.0)
  const restoreOpacityRef = useRef(false)
  const blastCubeIdxRef    = useRef(-1)
  const waitSettleRef      = useRef(false)
  const settleFadeStartRef = useRef(-1)
  const pausedRevealRef    = useRef(false)
  const fadeInRef          = useRef(false)
  const fadeInProgressRef  = useRef(0)
  const rendererRef        = useRef<THREE.WebGLRenderer | null>(null)

  useEffect(() => {
    const container = mountRef.current
    if (!container) return

    const W = container.clientWidth
    const H = container.clientHeight

    const camY0  = getCamY(H)
    const worldH = CUBE * H / TARGET_PX
    const worldW = CUBE * W / TARGET_PX
    const numPairs = Math.ceil(worldH / PAIR_H) + 2
    const GRID_Z = numPairs * 2 + 1
    const rawX   = Math.ceil(worldW / GAP_X) + 4
    const GRID_X = rawX % 2 === 0 ? rawX + 1 : rawX
    const COUNT  = GRID_X * GRID_Z

    const rowPosZ = (j: number) => {
      const pair = Math.floor(j / 2)
      return j % 2 === 0
        ? pair * PAIR_H
        : pair * PAIR_H + CUBE / 2 + LINE_GAP + THIN / 2
    }
    const gridZOffset = rowPosZ(GRID_Z - 1) / 2

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(W, H)
    renderer.setClearColor(0x000000, 0)
    rendererRef.current = renderer
    container.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    scene.background = null
    sceneRef.current = scene

    const camera = new THREE.PerspectiveCamera(FOV, W / H, 0.1, 500)
    camera.up.set(0, 0, -1)
    camera.position.set(0, camY0, 0)
    camera.lookAt(0, 0, 0)
    camera.updateMatrixWorld()

    scene.add(new THREE.AmbientLight(0xffffff, 2.0))
    const sun = new THREE.DirectionalLight(0xf0f2f5, 1.0)
    sun.position.set(1, 10, 2)
    scene.add(sun)

    const squareRows  = Math.ceil(GRID_Z / 2)
    const thinRows    = Math.floor(GRID_Z / 2)
    const squareCount = GRID_X * squareRows
    const thinCount   = GRID_X * thinRows

    const geoSquare = new THREE.BoxGeometry(CUBE, CUBE_H, CUBE)
    const geoThin   = new THREE.BoxGeometry(CUBE, CUBE_H, THIN)

    // 종이 텍스처 — 월드 포지션 triplanar 매핑 (큐브마다 다른 부위 샘플링)
    const paperTex = new THREE.TextureLoader().load('/paper-texture.png')
    paperTex.wrapS = THREE.RepeatWrapping
    paperTex.wrapT = THREE.RepeatWrapping

    const triplanarVert = `
varying vec3 vWPos;
varying vec3 vLNorm;
`
    const triplanarVertInject = `
#ifdef USE_INSTANCING
  vWPos = (instanceMatrix * vec4(position, 1.0)).xyz;
#else
  vWPos = position;
#endif
  vLNorm = normal;`

    const triplanarFrag = `
uniform sampler2D paperMap;
varying vec3 vWPos;
varying vec3 vLNorm;
`
    const triplanarFragInject = `
    vec3 blend = abs(vLNorm);
    blend = pow(blend, vec3(6.0));
    blend /= (blend.x + blend.y + blend.z + 0.001);
    float sc = 0.12;
    vec3 tXZ = texture2D(paperMap, vWPos.xz * sc).rgb;
    vec3 tXY = texture2D(paperMap, vWPos.xy * sc).rgb;
    vec3 tYZ = texture2D(paperMap, vWPos.yz * sc).rgb;
    vec3 paper = tXZ * blend.y + tXY * blend.z + tYZ * blend.x;
    diffuseColor.rgb *= paper * 1.04;
    float sideW = 1.0 - blend.y;
    float sp = fract((vWPos.z * blend.x + vWPos.x * blend.z) * 16.0);
    float groove = 1.0 - smoothstep(0.0, 0.1, sp) * smoothstep(1.0, 0.9, sp);
    diffuseColor.rgb *= 1.0 - groove * sideW * 0.09 * paper.r;
    float lum = dot(vColor.rgb, vec3(0.333));
    float sat = clamp(length(vColor.rgb - vec3(lum)) * 3.0, 0.0, 1.0);
    float coarse = texture2D(paperMap, vWPos.xz * sc * 0.35).r;
    float hole = 1.0 - smoothstep(0.46, 0.54, coarse);
    diffuseColor.rgb = mix(diffuseColor.rgb, vec3(1.0) * paper * 1.04, hole * sat * 0.9);`

    const applyPaperShader = (shader: { uniforms: Record<string, { value: unknown }>; vertexShader: string; fragmentShader: string }, tex: THREE.Texture) => {
      shader.uniforms.paperMap = { value: tex }
      shader.vertexShader = triplanarVert + shader.vertexShader
      shader.vertexShader = shader.vertexShader.replace(
        `#include <begin_vertex>`,
        `#include <begin_vertex>${triplanarVertInject}`
      )
      shader.fragmentShader = triplanarFrag + shader.fragmentShader
      shader.fragmentShader = shader.fragmentShader.replace(
        `#include <color_fragment>`,
        `#include <color_fragment>${triplanarFragInject}`
      )
    }

    const mat = new THREE.MeshStandardMaterial({
      color:           0xfefdf8,
      roughness:       0.92,
      metalness:       0.0,
      envMapIntensity: 0,
      transparent:     true,
    })
    mat.onBeforeCompile = (shader) => applyPaperShader(shader, paperTex)

    const meshSquare = new THREE.InstancedMesh(geoSquare, mat, squareCount)
    const meshThin   = new THREE.InstancedMesh(geoThin,   mat, thinCount)
    meshSquare.instanceMatrix.setUsage(THREE.DynamicDrawUsage)
    meshThin.instanceMatrix.setUsage(THREE.DynamicDrawUsage)
    scene.add(meshSquare)
    scene.add(meshThin)

    const squareInst = new Int32Array(COUNT).fill(-1)
    const thinInst   = new Int32Array(COUNT).fill(-1)
    for (let i = 0; i < GRID_X; i++) {
      for (let j = 0; j < GRID_Z; j++) {
        const idx = i * GRID_Z + j
        if (j % 2 === 0) squareInst[idx] = i * squareRows + Math.floor(j / 2)
        else             thinInst[idx]   = i * thinRows   + Math.floor(j / 2)
      }
    }

    const MIN_DIST = 8
    const minI = Math.floor(GRID_X * 0.20)
    const maxI = Math.floor(GRID_X * 0.80)
    const minJ = Math.floor(GRID_Z * 0.18)
    const maxJ = Math.floor(GRID_Z * 0.82)
    const placed: { i: number; j: number }[] = []
    for (let p = 0; p < PROJECT_DATA.length; p++) {
      let i = 0, j = 0, tries = 0
      do {
        i = minI + Math.floor(Math.random() * (maxI - minI))
        j = minJ + Math.floor(Math.random() * (maxJ - minJ))
        if (j % 2 !== 0) j++
        tries++
      } while (
        placed.some(pos => Math.hypot(pos.i - i, pos.j - j) < MIN_DIST) &&
        tries < 300
      )
      placed.push({ i, j })
    }
    const PROJECTS = PROJECT_DATA.map((p, idx) => ({ ...p, ...placed[idx] }))

    const projMap = new Map<number, { glow: number }>()
    for (const p of PROJECTS) projMap.set(p.i * GRID_Z + p.j, { glow: 0 })

    const projIdxMap = new Map<number, number>()
    PROJECTS.forEach((p, pidx) => projIdxMap.set(p.i * GRID_Z + p.j, pidx))

    // 프로젝트 큐브 — 클릭 감지용 투명 메시 + 색상 보간용 Color
    const projItems = PROJECTS.map(p => {
      const hitMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
      const mesh = new THREE.Mesh(geoSquare, hitMat)
      const wx = (p.i - Math.floor(GRID_X / 2)) * GAP_X
      const wz = rowPosZ(p.j) - gridZOffset
      mesh.position.set(wx, 0, wz)
      scene.add(mesh)
      return { mesh, mat: hitMat, color: new THREE.Color(p.color) }
    })

    // 한 칸에 한 글자 — 원고지 인트로 텍스트 (ASCII/숫자는 두 글자씩 묶음)
    const makeCharTex = (chunk: string) => {
      const canvas = document.createElement('canvas')
      canvas.width  = 64
      canvas.height = 64
      const ctx = canvas.getContext('2d')!
      ctx.clearRect(0, 0, 64, 64)
      ctx.fillStyle = 'rgba(20,20,30,0.95)'
      ctx.font = 'bold 46px "Pretendard","Apple SD Gothic Neo",sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      if (chunk.length >= 2) {
        const measured = ctx.measureText(chunk).width
        const scaleX = Math.min(1, 58 / measured)
        ctx.save()
        ctx.translate(32, 34)
        ctx.scale(scaleX, 1)
        ctx.fillText(chunk, 0, 0)
        ctx.restore()
      } else {
        ctx.fillText(chunk, 32, 34)
      }
      return new THREE.CanvasTexture(canvas)
    }

    type CharItem = { idx: number; wx: number; wz: number; sprite: THREE.Sprite; mat: THREE.SpriteMaterial; tex: THREE.CanvasTexture }
    const charItems: CharItem[] = []

    const startI = Math.floor(GRID_X * 0.20)
    let   startJ = Math.floor(GRID_Z * 0.24)
    if (startJ % 2 !== 0) startJ++

    const buildCharItems = (text: string) => {
      // 기존 스프라이트 제거
      for (const ch of charItems) {
        scene.remove(ch.sprite)
        ch.tex.dispose()
        ch.mat.dispose()
      }
      charItems.length = 0

      // ASCII/숫자 연속 두 글자는 한 청크로 묶기
      const chunks: Array<string | null> = []
      let i = 0
      while (i < text.length) {
        const ch = text[i]
        if (ch === '\n') { chunks.push('\n'); i++; continue }
        if (ch === ' ')  { chunks.push(null);  i++; continue }
        const isAscii = ch.charCodeAt(0) < 128
        if (isAscii) {
          const next = text[i + 1]
          const nextOk = next && next.charCodeAt(0) < 128 && next !== ' ' && next !== '\n'
          if (nextOk) { chunks.push(ch + next); i += 2 }
          else        { chunks.push(ch);         i++ }
        } else {
          chunks.push(ch); i++
        }
      }

      let ci = startI, cj = startJ
      for (const chunk of chunks) {
        if (chunk === '\n') { ci = startI; cj += 2; continue }
        if (chunk === null) { ci++; continue }
        if (ci < GRID_X && cj < GRID_Z) {
          const wx  = (ci - Math.floor(GRID_X / 2)) * GAP_X
          const wz  = rowPosZ(cj) - gridZOffset
          const idx = ci * GRID_Z + cj
          const tex = makeCharTex(chunk)
          const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false })
          const sprite = new THREE.Sprite(mat)
          sprite.scale.set(CUBE * 0.9, CUBE * 0.9, 1)
          sprite.renderOrder = 3
          sprite.position.set(wx, CUBE_H / 2 + 0.15, wz)
          scene.add(sprite)
          charItems.push({ idx, wx, wz, sprite, mat, tex })
        }
        ci++
      }
    }

    buildCharItems(INTRO_LETTERS[0])
    rebuildTextRef.current = buildCharItems

    const dummy     = new THREE.Object3D()
    const baseColor = new THREE.Color(0xfefdfa)

    const cubePos         = new Float32Array(COUNT).fill(0)
    const cubeVel         = new Float32Array(COUNT).fill(0)
    const restitution     = new Float32Array(COUNT)
    const kickSensitivity = new Float32Array(COUNT)
    for (let k = 0; k < COUNT; k++) {
      restitution[k]     = 0.55 + Math.random() * 0.15
      kickSensitivity[k] = 0.9  + Math.random() * 0.1
    }

    const setInstance = (idx: number, j: number, matrix: THREE.Matrix4, color: THREE.Color) => {
      if (j % 2 === 0) {
        meshSquare.setMatrixAt(squareInst[idx], matrix)
        meshSquare.setColorAt(squareInst[idx], color)
      } else {
        meshThin.setMatrixAt(thinInst[idx], matrix)
        meshThin.setColorAt(thinInst[idx], color)
      }
    }

    const tmpColor = new THREE.Color()

    for (let i = 0; i < GRID_X; i++) {
      for (let j = 0; j < GRID_Z; j++) {
        const idx = i * GRID_Z + j
        dummy.position.set((i - Math.floor(GRID_X / 2)) * GAP_X, 0, rowPosZ(j) - gridZOffset)
        dummy.scale.setScalar(1)
        dummy.updateMatrix()
        setInstance(idx, j, dummy.matrix, baseColor)
      }
    }
    meshSquare.instanceMatrix.needsUpdate = true
    meshThin.instanceMatrix.needsUpdate = true
    if (meshSquare.instanceColor) meshSquare.instanceColor.needsUpdate = true
    if (meshThin.instanceColor)   meshThin.instanceColor.needsUpdate = true

    const clickPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(400, 400),
      new THREE.MeshBasicMaterial({ visible: false, side: THREE.DoubleSide })
    )
    clickPlane.rotation.x = -Math.PI / 2
    clickPlane.position.y = CUBE_H / 2
    scene.add(clickPlane)

    const impulses: { x: number; z: number; t0: number }[] = []
    const clock     = new THREE.Clock()
    const raycaster = new THREE.Raycaster()
    const mouse     = new THREE.Vector2()

    let mouseWorldX = 0
    let mouseWorldZ = 0
    let lastClickTime = -999

    const getWorldPos = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect()
      mouse.x =  ((e.clientX - rect.left) / rect.width)  * 2 - 1
      mouse.y = -((e.clientY - rect.top)  / rect.height) * 2 + 1
      camera.updateMatrixWorld()
      raycaster.setFromCamera(mouse, camera)
      const hits = raycaster.intersectObject(clickPlane)
      if (hits.length) {
        mouseWorldX = hits[0].point.x
        mouseWorldZ = hits[0].point.z
      }
    }

    container.addEventListener('mousemove', (e) => { if (startedRef.current) getWorldPos(e) })
    container.addEventListener('click', (e) => {
      if (!startedRef.current) return
      getWorldPos(e)

      // 프로젝트 큐브 클릭 감지
      raycaster.setFromCamera(mouse, camera)
      const projHits = raycaster.intersectObjects(projItems.map(item => item.mesh))
      if (projHits.length > 0) {
        const hitIdx = projItems.findIndex(item => item.mesh === projHits[0].object)
        const hitCubeIdx = PROJECTS[hitIdx]?.i * GRID_Z + PROJECTS[hitIdx]?.j
        if (hitIdx >= 0 && (projMap.get(hitCubeIdx)?.glow ?? 0) > 0.3) {
          history.pushState({ aiarchiveProject: hitIdx }, '')
          setRevealedProject(hitIdx)
          blastProjectRef.current = hitIdx
          blastCubeIdxRef.current = PROJECTS[hitIdx].i * GRID_Z + PROJECTS[hitIdx].j
          if (pausedRef.current) {
            pausedRevealRef.current = true
            const el = renderer.domElement
            const rect = el.getBoundingClientRect()
            const ox = e.clientX - rect.left
            const oy = e.clientY - rect.top
            el.style.transformOrigin = `${ox}px ${oy}px`
            el.style.transition = 'filter 0.65s ease-in, opacity 0.65s ease-in'
            el.style.filter  = 'blur(18px)'
            el.style.opacity = '0'
            el.addEventListener('transitionend', () => { frozenRef.current = true }, { once: true })
          } else {
            if (sceneRef.current) sceneRef.current.background = null
            blastRef.current = true
            blastTimeRef.current = clock.getElapsedTime()
            revealShownRef.current = false
            impulses.length = 0

            // 랜덤 폭발 발원점 — 중심 + 주변 3~4개 무작위 지점
            const bx0 = projItems[hitIdx]?.mesh.position.x ?? 0
            const bz0 = projItems[hitIdx]?.mesh.position.z ?? 0
            const spread = GAP_X * 4
            blastSourcesRef.current = [
              { x: bx0, z: bz0, delay: 0 },
              ...Array.from({ length: 4 }, () => ({
                x: bx0 + (Math.random() - 0.5) * spread,
                z: bz0 + (Math.random() - 0.5) * spread,
                delay: Math.random() * 0.25,
              }))
            ]
            // 큐브별 타이밍 노이즈
            const noise = new Float32Array(COUNT)
            for (let k = 0; k < COUNT; k++) noise[k] = (Math.random() - 0.5) * 0.18
            blastNoiseRef.current = noise
          }
          return
        }
      }

      const ct = clock.getElapsedTime()
      lastClickTime = ct
      impulses.push({ x: mouseWorldX, z: mouseWorldZ, t0: ct })
      if (impulses.length > 6) impulses.shift()

      // 큐브가 낙하 시작할 때 편지 교체 — peak 감지용
      pendingLetterRef.current = (letterIdxRef.current + 1) % INTRO_LETTERS.length
      peakReachedRef.current = false
    })

    type FlipState =
      | { phase: 'idle' }
      | { phase: 'folding';   startT: number; pendingText: string }
      | { phase: 'unfolding'; startT: number }
    let flipState: FlipState = { phase: 'idle' }
    const FLIP_CHAR_DUR = 0.10
    const FLIP_STAGGER  = 0.025

    let animId: number
    const tick = () => {
      animId = requestAnimationFrame(tick)
      const t = clock.getElapsedTime()

      if (!startedRef.current) {
        renderer.render(scene, camera)
        return
      }

      if (pendingStart.current) {
        pendingStart.current = false
        impulses.push({ x: 0, z: 0, t0: t })
      }

      if (resetRef.current) {
        resetRef.current = false
        for (let k = 0; k < COUNT; k++) { cubePos[k] = 0; cubeVel[k] = 0 }
        for (const v of projMap.values()) v.glow = 0
        for (const item of projItems) { item.mat.opacity = 0 }
        blastRef.current = false
        revealShownRef.current = false
      }


      if (blastRef.current && !revealShownRef.current) {
        const bElapsed = t - blastTimeRef.current
        if (bElapsed > 1.5 && renderer.domElement.style.visibility !== 'hidden') {
          renderer.domElement.style.visibility = 'hidden'
        }
        if (bElapsed > 2.0) {
          revealShownRef.current = true
          blastRef.current = false
          frozenRef.current = true
        }
      }

      const settling = pausedRef.current
      if (settling) {
        impulses.length = 0
      } else {
        while (impulses.length && t - impulses[0].t0 > 10) impulses.shift()
      }

      const hoverActive = !settling && t - lastClickTime > HOVER_PAUSE

      for (let i = 0; i < GRID_X; i++) {
        for (let j = 0; j < GRID_Z; j++) {
          const idx = i * GRID_Z + j
          const wx  = (i - Math.floor(GRID_X / 2)) * GAP_X
          const wz  = rowPosZ(j) - gridZOffset

          if (!frozenRef.current) {
            cubeVel[idx] -= GRAVITY

            if (!settling) {
              for (const imp of impulses) {
                const elapsed = t - imp.t0
                const d  = Math.hypot(wx - imp.x, wz - imp.z)
                const dt = elapsed - d / WAVE_SPEED
                cubeVel[idx] += KICK
                  * kickSensitivity[idx]
                  * Math.exp(-dt * dt / (KICK_SIGMA * KICK_SIGMA))
                  * Math.exp(-d * 0.018)
                  * Math.exp(-elapsed / IMPULSE_DECAY)
              }
              if (blastRef.current) {
                const bElapsed = t - blastTimeRef.current
                const cubeNoise = blastNoiseRef.current[idx] ?? 0
                for (const src of blastSourcesRef.current) {
                  const srcElapsed = bElapsed - src.delay
                  if (srcElapsed < 0) continue
                  const d  = Math.hypot(wx - src.x, wz - src.z)
                  const dt = srcElapsed - d / 20 + cubeNoise
                  cubeVel[idx] += 0.30
                    * kickSensitivity[idx]
                    * Math.exp(-dt * dt / (0.07 * 0.07))
                    * Math.exp(-d * 0.006)
                    * Math.exp(-srcElapsed / 1.8)
                }
              }
            }

            if (hoverActive && cubePos[idx] < HOVER_MAX) {
              const dh = Math.hypot(wx - mouseWorldX, wz - mouseWorldZ)
              cubeVel[idx] += HOVER_FORCE * Math.exp(-dh * dh / (HOVER_SIGMA * HOVER_SIGMA))
            }

            cubeVel[idx] *= AIR_DAMP
            cubePos[idx] += cubeVel[idx]

            if (cubePos[idx] < 0 && cubeVel[idx] < 0) {
              cubePos[idx] = 0
              cubeVel[idx] *= -restitution[idx]
              if (Math.abs(cubeVel[idx]) < 0.002) cubeVel[idx] = 0
            }

            if (blastRef.current && idx === blastCubeIdxRef.current && cubeVel[idx] < 0) {
              cubeVel[idx] = 0
            }
          }

          const proj = projMap.get(idx)

          dummy.position.set(wx, cubePos[idx], wz)
          dummy.scale.setScalar(1)
          dummy.updateMatrix()

          if (proj) {
            const item = projItems[projIdxMap.get(idx)!]
            item.mesh.position.set(wx, cubePos[idx], wz)
            if (!frozenRef.current) {
              const triggered = settling || cubePos[idx] > 0.25
              proj.glow = triggered
                ? Math.min(1, proj.glow + 0.07)
                : Math.max(0, proj.glow - 0.030)
            }
            tmpColor.copy(baseColor).lerp(item.color, proj.glow * 0.75)
            setInstance(idx, j, dummy.matrix, tmpColor)
          } else {
            setInstance(idx, j, dummy.matrix, baseColor)
          }
        }
      }

      for (const ch of charItems) {
        ch.sprite.position.set(ch.wx, cubePos[ch.idx] + CUBE_H / 2 + 0.15, ch.wz)
      }

      if (restoreOpacityRef.current) {
        restoreOpacityRef.current = false
        fadeProgressRef.current = 1.0
        mat.opacity = 1
        for (const ch of charItems) ch.mat.opacity = 1
      }

      // 편지 교체 — peak 감지 후 flip 시작
      if (pendingLetterRef.current !== null && charItems.length > 0 && flipState.phase === 'idle') {
        const sampleIdx = charItems[Math.floor(charItems.length / 2)].idx
        if (cubeVel[sampleIdx] > 0.05) {
          peakReachedRef.current = true
        } else if (peakReachedRef.current && cubeVel[sampleIdx] < 0) {
          peakReachedRef.current = false
          flipState = { phase: 'folding', startT: t, pendingText: INTRO_LETTERS[pendingLetterRef.current] }
          pendingLetterRef.current = null
        }
      }

      // 플립보드 애니메이션
      if (flipState.phase === 'folding') {
        const elapsed = t - flipState.startT
        for (let k = 0; k < charItems.length; k++) {
          const p = Math.max(0, Math.min(1, (elapsed - k * FLIP_STAGGER) / FLIP_CHAR_DUR))
          charItems[k].sprite.scale.y = CUBE * 0.9 * (1 - p)
        }
        if (elapsed >= charItems.length * FLIP_STAGGER + FLIP_CHAR_DUR) {
          buildCharItems(flipState.pendingText)
          letterIdxRef.current = INTRO_LETTERS.indexOf(flipState.pendingText)
          for (const ch of charItems) ch.sprite.scale.y = 0
          flipState = { phase: 'unfolding', startT: t }
        }
      } else if (flipState.phase === 'unfolding') {
        const elapsed = t - flipState.startT
        for (let k = 0; k < charItems.length; k++) {
          const p = Math.max(0, Math.min(1, (elapsed - k * FLIP_STAGGER) / FLIP_CHAR_DUR))
          charItems[k].sprite.scale.y = CUBE * 0.9 * p
        }
        if (elapsed >= charItems.length * FLIP_STAGGER + FLIP_CHAR_DUR) {
          for (const ch of charItems) ch.sprite.scale.y = CUBE * 0.9
          flipState = { phase: 'idle' }
        }
      }



      meshSquare.instanceMatrix.needsUpdate = true
      meshThin.instanceMatrix.needsUpdate = true
      if (meshSquare.instanceColor) meshSquare.instanceColor.needsUpdate = true
      if (meshThin.instanceColor)   meshThin.instanceColor.needsUpdate = true
      renderer.render(scene, camera)
    }
    tick()

    const onResize = () => {
      const w = container.clientWidth
      const h = container.clientHeight
      camera.aspect = w / h
      camera.position.set(0, getCamY(h), 0)
      camera.lookAt(0, 0, 0)
      camera.updateMatrixWorld()
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }
    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', onResize)
      geoSquare.dispose()
      geoThin.dispose()
      paperTex.dispose()
      mat.dispose()
      for (const item of projItems) {
        item.mat.dispose()
      }
      for (const ch of charItems) {
        ch.mat.dispose()
        ch.tex.dispose()
      }
      renderer.dispose()
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement)
      }
    }
  }, [])

  const handleStart = () => {
    startedRef.current = true
    pendingStart.current = true
    setStarted(true)
  }

  const handleBack = () => {
    if (pausedRevealRef.current) {
      pausedRevealRef.current = false
      frozenRef.current = false
      const el = rendererRef.current?.domElement
      if (el) {
        el.style.transition = 'filter 0.65s ease-out, opacity 0.65s ease-out'
        el.style.filter  = 'blur(0px)'
        el.style.opacity = '1'
        el.addEventListener('transitionend', () => {
          setRevealedProject(null)
        }, { once: true })
      }
    } else {
      frozenRef.current = false
      fadeOutRef.current = false
      restoreOpacityRef.current = true
      setTimeout(() => {
        const el = rendererRef.current?.domElement
        if (el) el.style.visibility = 'visible'
      }, 1000)
      setTimeout(() => {
        setRevealedProject(null)
      }, 3000)
    }
  }

  useEffect(() => {
    if (revealedProject === null) return
    const onPopState = () => handleBack()
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [revealedProject])

  useEffect(() => {
    if (revealedProject === null) { setEvalReady(false); return }
    setEvalReady(false)
    const timer = setTimeout(() => setEvalReady(true), 1000)
    return () => clearTimeout(timer)
  }, [revealedProject])

  return (
    <div className="w-full relative" style={{ height: 'calc(100vh - 90px)', backgroundColor: '#eaf5fa' }}>
      {/* 도장 질감 SVG 필터 — 항상 렌더링 */}
      <svg width="0" height="0" style={{ position: 'absolute' }}>
        <defs>
          {/* 기본 도장 필터 (방향 없음) */}
          <filter id="stamp-erode" x="-10%" y="-10%" width="120%" height="120%">
            <feTurbulence type="fractalNoise" baseFrequency="0.50" numOctaves="4" stitchTiles="stitch" result="noise" />
            <feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 6 -1" in="noise" result="mask" />
            <feComposite in="SourceGraphic" in2="mask" operator="in" />
          </filter>
          {/* 8방향 도장 필터: 그라디언트가 turbulence alpha를 threshold 전에 감쇠 */}
          {STAMP_GRAD_URIS.map((href, i) => (
            <filter key={i} id={`stamp-erode-${i}`} x="-10%" y="-10%" width="120%" height="120%">
              <feTurbulence type="fractalNoise" baseFrequency="0.50" numOctaves="4" stitchTiles="stitch" result="noise" />
              <feImage href={href} preserveAspectRatio="none" result="grad" />
              {/* 그라디언트 RGB 휘도 → alpha 채널로 추출 */}
              <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0.333 0.333 0.334 0 0" in="grad" result="gmod" />
              {/* noise.A × gradient.A → 어두운 방향에서 더 많이 날아감 */}
              <feComposite in="noise" in2="gmod" operator="arithmetic" k1="1" k2="0" k3="0" k4="0" result="modulated" />
              <feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 6 -1" in="modulated" result="mask" />
              <feComposite in="SourceGraphic" in2="mask" operator="in" />
            </filter>
          ))}
        </defs>
      </svg>
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
        <p className="font-mono text-xs tracking-widest" style={{ color: '#b8d4de' }}>
          엇 여기는 아무것도 없어요
        </p>
      </div>
      {revealedProject !== null && (() => {
        const p = PROJECT_DATA[revealedProject]
        const num = String(revealedProject + 1).padStart(2, '0')

        // 원고지 타이틀 그리드 계산 (ASCII/숫자는 두 글자씩 한 칸)
        const titleStr  = p.label.replace(/\n/g, ' ')
        const rawArr    = Array.from(titleStr)
        const paired: string[] = []
        {
          let i = 0
          while (i < rawArr.length) {
            const ch = rawArr[i]
            if (ch === ' ') { paired.push(' '); i++; continue }
            const isAscii = ch.charCodeAt(0) < 128
            if (isAscii) {
              const next  = rawArr[i + 1]
              const ok    = next && next.charCodeAt(0) < 128 && next !== ' '
              if (ok) { paired.push(ch + next); i += 2 }
              else    { paired.push(ch); i++ }
            } else { paired.push(ch); i++ }
          }
        }
        // 한 줄에 모두 배치 → 현재 대비 셀 크기 ~50%
        const cols       = Math.max(paired.length, 12)
        const cells      = [...paired, ...Array(Math.max(0, cols - paired.length)).fill('')]
        const numRows    = Math.ceil(cells.length / cols)
        // 글자 행 + 좁은 행 교차 배열
        const gridCells: Array<{ type: 'char' | 'strip'; ch: string }> = []
        for (let r = 0; r < numRows; r++) {
          cells.slice(r * cols, (r + 1) * cols).forEach(ch =>
            gridCells.push({ type: 'char', ch }))
          Array.from({ length: cols }, () =>
            gridCells.push({ type: 'strip', ch: '' }))
        }

        // 수상 등급 한자
        const awardRank = p.award?.includes('동상') ? '銅賞'
          : p.award?.includes('은상') ? '銀賞'
          : p.award?.includes('금상') ? '金賞' : null
        const awardYear = p.award?.match(/\d{4}/)?.[0]
          ?? p.period.match(/\d{4}/)?.[0] ?? ''



        return (
          <div className="absolute inset-0 flex" style={{
            backgroundColor: '#f0ebe0',
            backgroundImage: 'url(/paper-texture.png)',
            backgroundSize: '500px',
            backgroundBlendMode: 'multiply',
          }}>

            {/* ── 왼쪽: 이미지 패널 ── */}
            <div className="flex flex-col p-5 gap-3 border-r border-black/10" style={{ width: '46%' }}>
              {/* 태그 행 */}
              <div className="flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 px-2 py-0.5 text-xs font-bold font-mono"
                    style={stamp(p.color, (revealedProject ?? 0) * 3)}>
                    原 {num}
                  </div>
                  <span className="text-xs font-mono" style={{ color: 'rgba(0,0,0,0.35)' }}>{p.label}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => history.back()}
                    className="text-xs font-mono transition-colors hover:text-black"
                    style={{ color: 'rgba(0,0,0,0.35)' }}>
                    목 록
                  </button>
                  <div style={{ width: 1, height: 10, background: 'rgba(0,0,0,0.15)' }} />
                  {PROJECT_DATA.map((_, i) => (
                    <div key={i}
                      className="text-xs font-mono w-5 h-5 flex items-center justify-center transition-colors"
                      style={i === revealedProject
                        ? { ...stamp(p.color, i * 3 + 1), cursor: 'default' }
                        : { color: 'rgba(0,0,0,0.30)', cursor: 'pointer' }}
                      onClick={() => {
                        if (i !== revealedProject) {
                          history.replaceState({ aiarchiveProject: i }, '')
                          setRevealedProject(i)
                        }
                      }}>
                      {String(i + 1).padStart(2, '0')}
                    </div>
                  ))}
                </div>
              </div>

              {/* 이미지 (비율 감지 자동 배치) */}
              <div className="flex-1 min-h-0">
                <ProjectImages images={p.images} label={p.label} />
              </div>
            </div>

            {/* ── 오른쪽: 정보 패널 ── */}
            <div className="flex flex-col px-6 py-4 overflow-y-auto relative" style={{ width: '54%' }}>

              {/* 헤더 */}
              <div className="flex items-center mb-2 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div style={{ width: 28, height: 2, background: p.color }} />
                  <span className="text-xs font-mono tracking-widest uppercase" style={{ color: p.color }}>
                    PROJECT {num} · {p.period}
                  </span>
                </div>
              </div>

              {/* 수상 배지 — 타이틀 우상단에 겹치게 */}
              {p.award && awardRank && (
                <div className="absolute flex flex-col items-center justify-center rounded-full z-10"
                  style={{
                    width: 72, height: 72,
                    top: 16, right: 24,
                    transform: 'rotate(12deg)',
                    ...stamp(p.color, ((revealedProject ?? 0) + 4) % 8),
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
                {gridCells.map((cell, i) =>
                  cell.type === 'char' ? (
                    <div key={i} className="flex items-center justify-center"
                      style={{ border: '1px solid rgba(0,0,0,0.10)', aspectRatio: '1 / 1' }}>
                      <span className="font-bold select-none" style={{
                        fontSize: '1.15rem',
                        color: '#111',
                        lineHeight: 1,
                        display: 'inline-block',
                        transform: cell.ch.length >= 2 ? 'scaleX(0.75)' : undefined,
                      }}>
                        {cell.ch}
                      </span>
                    </div>
                  ) : (
                    <div key={i} style={{ border: '1px solid rgba(0,0,0,0.07)', height: 8 }} />
                  )
                )}
              </div>

              {/* 영문 서브타이틀 */}
              <p className="text-xs mb-3 flex-shrink-0" style={{ color: 'rgba(0,0,0,0.35)' }}>
                {p.subtitle}
              </p>

              {/* 메타 정보 */}
              <div className="space-y-2 mb-3 flex-shrink-0">
                <div className="flex items-start gap-4">
                  <span className="text-xs font-mono w-14 flex-shrink-0 tracking-wider" style={{ color: 'rgba(0,0,0,0.38)' }}>사용 기술</span>
                  <div className="flex flex-wrap gap-2">
                    {p.stack.map((s, i) => (
                      <span key={s} className="text-sm font-mono font-semibold px-3 py-1"
                        style={stamp(p.color, i * 2 + 1)}>
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs font-mono w-14 flex-shrink-0 tracking-wider" style={{ color: 'rgba(0,0,0,0.38)' }}>역 할</span>
                  <span className="text-xs" style={{ color: 'rgba(0,0,0,0.65)' }}>{p.role}</span>
                </div>
                {p.award && (
                  <div className="flex items-center gap-4">
                    <span className="text-xs font-mono w-14 flex-shrink-0 tracking-wider" style={{ color: 'rgba(0,0,0,0.38)' }}>성 과</span>
                    <span className="text-xs" style={{ color: 'rgba(0,0,0,0.65)' }}>🥉 {p.award}</span>
                  </div>
                )}
                {p.link && (
                  <div className="flex items-center gap-4">
                    <span className="text-xs font-mono w-14 flex-shrink-0 tracking-wider" style={{ color: 'rgba(0,0,0,0.38)' }}>링 크</span>
                    <a href={p.link} target="_blank" rel="noopener noreferrer"
                      className="text-xs font-mono transition-colors hover:opacity-70"
                      style={{ color: p.color }}>
                      {p.linkLabel} →
                    </a>
                  </div>
                )}
              </div>

              {/* 설명 */}
              <div className="mb-3 flex-shrink-0 py-0.5" style={{ borderLeft: `3px solid ${p.color}`, paddingLeft: 14 }}>
                <p className="text-sm leading-relaxed" style={{ color: 'rgba(0,0,0,0.62)' }}>{p.desc}</p>
              </div>

              {/* 평가: 막대 */}
              <div className="flex-shrink-0">
                <span className="text-xs font-mono tracking-widest mb-2 block" style={{ color: 'rgba(0,0,0,0.35)' }}>
                  평 가
                </span>
                <div className="space-y-2">
                  {RADAR_LABELS.map((label, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-xs w-9 flex-shrink-0" style={{ color: 'rgba(0,0,0,0.55)' }}>{label}</span>
                      <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.08)' }}>
                        <div className="h-full rounded-full" style={{ width: evalReady ? `${p.stats[i] * 100}%` : '0%', background: p.color, transition: 'width 1.4s cubic-bezier(0.16,1,0.3,1)' }} />
                      </div>
                      <span className="text-xs font-mono w-7 text-right" style={{ color: p.color }}>
                        {(p.stats[i] * 5).toFixed(1)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 레이더 차트 */}
              <div className="flex-shrink-0 flex justify-start mt-2 ml-2">
                <RadarChart stats={p.stats} color={p.color} size={220} animated={evalReady} />
              </div>

            </div>
          </div>
        )
      })()}
      <div ref={mountRef} className={`absolute inset-0 ${started ? 'cursor-crosshair' : ''} ${revealedProject !== null ? 'pointer-events-none' : ''}`} />
      {!started && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <button
            onClick={handleStart}
            className="pointer-events-auto cursor-pointer hover:scale-105 active:scale-95 transition-transform duration-150"
            aria-label="시작"
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
            }}
          >
            <div style={{
              ...stamp('#b02020', 2),
              width: 60,
              height: 60,
              borderRadius: '5px 8px 6px 4px / 7px 5px 8px 5px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              userSelect: 'none',
            }}>
              <svg width="30" height="22" viewBox="0 0 30 22" fill="none">
                <path d="M0 9 H11 V1 L27 11 L11 21 V13 H0 Z" fill="white" />
              </svg>
            </div>
          </button>
        </div>
      )}
    </div>
  )
}
