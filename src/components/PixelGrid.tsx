'use client'

import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { useAnimation } from '@/context/AnimationContext'
import { PROJECT_DATA } from '@/lib/projects'
import ProjectDetail from '@/components/ProjectDetail'
import AboutDetail from '@/components/AboutDetail'

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
  const { paused, toggle } = useAnimation()
  const pausedRef = useRef(paused)
  const toggleRef = useRef(toggle)
  useEffect(() => { pausedRef.current = paused }, [paused])
  useEffect(() => { toggleRef.current = toggle }, [toggle])

  const pauseCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const pauseTexRef    = useRef<THREE.CanvasTexture | null>(null)
  useEffect(() => {
    const canvas = pauseCanvasRef.current
    const tex    = pauseTexRef.current
    if (!canvas || !tex) return
    const ctx = canvas.getContext('2d')!
    ctx.clearRect(0, 0, 64, 64)
    ctx.fillStyle = 'rgba(20,20,28,0.9)'
    ctx.font = 'bold 26px monospace'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(paused ? '▶' : '■', 32, 32)
    tex.needsUpdate = true
  }, [paused])

  const stamp = (color: string, dirIdx?: number): React.CSSProperties => {
    const filterId = dirIdx !== undefined ? `stamp-erode-${dirIdx % 8}` : 'stamp-erode'
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

  const [started, setStarted] = useState(false)
  const startedRef    = useRef(false)
  const pendingStart  = useRef(false)
  const letterIdxRef       = useRef(0)
  const rebuildTextRef     = useRef<((text: string) => void) | null>(null)
  const pendingLetterRef   = useRef<number | null>(null)
  const peakReachedRef     = useRef(false)

  const [revealedProject, setRevealedProject] = useState<number | null>(null)
  const [evalReady, setEvalReady]             = useState(false)
  const [revealedAbout, setRevealedAbout]     = useState(false)
  const blastRef           = useRef(false)
  const blastTimeRef       = useRef(0)
  const blastSourcesRef    = useRef<{x:number,z:number,delay:number}[]>([])
  const blastNoiseRef      = useRef<Float32Array>(new Float32Array(0))
  const revealShownRef     = useRef(false)
  const frozenRef          = useRef(false)
  const sceneRef           = useRef<THREE.Scene | null>(null)
  const fadeOutRef         = useRef(false)
  const fadeProgressRef    = useRef(1.0)
  const restoreOpacityRef  = useRef(false)
  const blastCubeIdxRef    = useRef(-1)
  const pausedRevealRef    = useRef(false)
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
    const paperTex = new THREE.TextureLoader().load('/paper-texture.jpg')
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

    // Nav 큐브 — 일시정지 / about (그리드 상단 양쪽 코너)
    const toEvenJ = (j: number) => j % 2 === 0 ? j : j + 1
    const NAV_P_I = Math.floor(GRID_X * 0.78)
    const NAV_P_J = toEvenJ(Math.floor(GRID_Z * 0.15))
    const NAV_A_I = Math.floor(GRID_X * 0.83)
    const NAV_A_J = toEvenJ(Math.floor(GRID_Z * 0.15))
    const navPWx = (NAV_P_I - Math.floor(GRID_X / 2)) * GAP_X
    const navPWz = rowPosZ(NAV_P_J) - gridZOffset
    const navAWx = (NAV_A_I - Math.floor(GRID_X / 2)) * GAP_X
    const navAWz = rowPosZ(NAV_A_J) - gridZOffset

    const makeNavTex = (text: string, canvas?: HTMLCanvasElement) => {
      const c = canvas ?? document.createElement('canvas')
      c.width = 64; c.height = 64
      const ctx = c.getContext('2d')!
      ctx.clearRect(0, 0, 64, 64)
      ctx.fillStyle = 'rgba(20,20,28,0.9)'
      ctx.font = 'bold 26px monospace'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(text, 32, 32)
      return c
    }

    // 일시정지 스프라이트
    const pCanvas = makeNavTex(pausedRef.current ? '▶' : '■')
    pauseCanvasRef.current = pCanvas
    const pauseTex = new THREE.CanvasTexture(pCanvas)
    pauseTexRef.current = pauseTex
    const pauseMat = new THREE.SpriteMaterial({ map: pauseTex, transparent: true, depthWrite: false })
    const pauseSprite = new THREE.Sprite(pauseMat)
    pauseSprite.scale.set(CUBE * 0.9, CUBE * 0.9, 1)
    pauseSprite.renderOrder = 3
    pauseSprite.position.set(navPWx, CUBE_H / 2 + 0.2, navPWz)
    scene.add(pauseSprite)

    // about — '나에대해' 세로 4칸
    const ABOUT_CHARS = ['나', '에', '대', '해']
    const navAboutItems = ABOUT_CHARS.map((char, idx) => {
      const aj = Math.min(NAV_A_J + idx * 2, GRID_Z - 1)
      const awz = rowPosZ(aj) - gridZOffset
      const c = document.createElement('canvas')
      c.width = 64; c.height = 64
      const cx = c.getContext('2d')!
      cx.clearRect(0, 0, 64, 64)
      cx.fillStyle = 'rgba(20,20,28,0.9)'
      cx.font = 'bold 40px "Pretendard","Apple SD Gothic Neo",sans-serif'
      cx.textAlign = 'center'
      cx.textBaseline = 'middle'
      cx.fillText(char, 32, 32)
      const tex = new THREE.CanvasTexture(c)
      const sMat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false })
      const sprite = new THREE.Sprite(sMat)
      sprite.scale.set(CUBE * 0.9, CUBE * 0.9, 1)
      sprite.renderOrder = 3
      sprite.position.set(navAWx, CUBE_H / 2 + 0.2, awz)
      scene.add(sprite)
      const hMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
      const mesh = new THREE.Mesh(geoSquare, hMat)
      mesh.position.set(navAWx, 0, awz)
      scene.add(mesh)
      return { sprite, sMat, tex, mesh, hMat, aj, awz }
    })

    // 클릭 감지용 투명 메시 (일시정지)
    const navPauseMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
    const navPauseMesh = new THREE.Mesh(geoSquare, navPauseMat)
    navPauseMesh.position.set(navPWx, 0, navPWz)
    scene.add(navPauseMesh)

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

      // Nav 큐브 클릭 감지 (프로젝트보다 우선)
      raycaster.setFromCamera(mouse, camera)
      const navHits = raycaster.intersectObjects([navPauseMesh, ...navAboutItems.map(a => a.mesh)])
      if (navHits.length > 0) {
        if (navHits[0].object === navPauseMesh) {
          toggleRef.current()
        } else {
          history.pushState({}, '', '/about')
          setRevealedAbout(true)
          if (pausedRef.current) {
            pausedRevealRef.current = true
            const el = renderer.domElement
            el.style.transition = 'filter 0.65s ease-in, opacity 0.65s ease-in'
            el.style.filter  = 'blur(18px)'
            el.style.opacity = '0'
          } else {
            if (sceneRef.current) sceneRef.current.background = null
            blastRef.current = true
            blastTimeRef.current = clock.getElapsedTime()
            revealShownRef.current = false
            impulses.length = 0
            const spread = GAP_X * 4
            blastSourcesRef.current = Array.from({ length: 5 }, (_, k) => ({
              x: (Math.random() - 0.5) * spread * 3,
              z: (Math.random() - 0.5) * spread * 3,
              delay: k * 0.08,
            }))
            const noise = new Float32Array(COUNT)
            for (let k = 0; k < COUNT; k++) noise[k] = (Math.random() - 0.5) * 0.18
            blastNoiseRef.current = noise
          }
        }
        return
      }

      // 프로젝트 큐브 클릭 감지
      raycaster.setFromCamera(mouse, camera)
      const projHits = raycaster.intersectObjects(projItems.map(item => item.mesh))
      if (projHits.length > 0) {
        const hitIdx = projItems.findIndex(item => item.mesh === projHits[0].object)
        const hitCubeIdx = PROJECTS[hitIdx]?.i * GRID_Z + PROJECTS[hitIdx]?.j
        if (hitIdx >= 0 && (projMap.get(hitCubeIdx)?.glow ?? 0) > 0.3) {
          // 즉시 detail 레이어 렌더 + URL 업데이트
          history.pushState({}, '', `/works/${hitIdx + 1}`)
          setRevealedProject(hitIdx)
          blastCubeIdxRef.current = PROJECTS[hitIdx].i * GRID_Z + PROJECTS[hitIdx].j

          if (pausedRef.current) {
            // 일시정지 상태: 캔버스 blur/fade만
            pausedRevealRef.current = true
            const el = renderer.domElement
            const rect = el.getBoundingClientRect()
            const ox = e.clientX - rect.left
            const oy = e.clientY - rect.top
            el.style.transformOrigin = `${ox}px ${oy}px`
            el.style.transition = 'filter 0.65s ease-in, opacity 0.65s ease-in'
            el.style.filter  = 'blur(18px)'
            el.style.opacity = '0'
          } else {
            // 일반 상태: 큐브 폭발 후 캔버스 fade
            if (sceneRef.current) sceneRef.current.background = null
            blastRef.current = true
            blastTimeRef.current = clock.getElapsedTime()
            revealShownRef.current = false
            impulses.length = 0

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

      // blast → 1.5s 후 캔버스 숨김, 2s 후 frozen
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

      if (restoreOpacityRef.current) {
        restoreOpacityRef.current = false
        fadeProgressRef.current = 1.0
        mat.opacity = 1
        for (const ch of charItems) ch.mat.opacity = 1
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
              // nav 큐브(■ + 나에대해 4글자) 근처 호버 50% 감쇠
              const dNavP = Math.hypot(wx - navPWx, wz - navPWz)
              const dNavA = Math.min(...navAboutItems.map(a => Math.hypot(wx - navAWx, wz - a.awz)))
              const dNav  = Math.min(dNavP, dNavA)
              const envelope = Math.exp(-dNav * dNav / (1.8 * 1.8))
              // 가장 가까운 nav 클러스터의 x 기준으로 왼쪽(중심 방향) 추가 억제
              const refX      = dNavP < dNavA ? navPWx : navAWx
              const leftOfNav = Math.max(0, refX - wx)
              const leftBoost = 0.10 * (1.0 - Math.exp(-leftOfNav * leftOfNav / (1.0 * 1.0)))
              const navDamp   = 1.0 - (0.50 + leftBoost) * envelope
              cubeVel[idx] += HOVER_FORCE * navDamp * Math.exp(-dh * dh / (HOVER_SIGMA * HOVER_SIGMA))
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
            {
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
      const navPIdx = NAV_P_I * GRID_Z + NAV_P_J
      pauseSprite.position.y = cubePos[navPIdx] + CUBE_H / 2 + 0.2
      navPauseMesh.position.y = cubePos[navPIdx]
      for (const a of navAboutItems) {
        const aIdx = NAV_A_I * GRID_Z + a.aj
        a.sprite.position.y = cubePos[aIdx] + CUBE_H / 2 + 0.2
        a.mesh.position.y = cubePos[aIdx]
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
      pauseMat.dispose(); pauseTex.dispose()
      navPauseMat.dispose()
      for (const a of navAboutItems) { a.sMat.dispose(); a.tex.dispose(); a.hMat.dispose() }
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

  const restoreCanvas = (onHide: () => void) => {
    if (pausedRevealRef.current) {
      pausedRevealRef.current = false
      frozenRef.current = false
      const el = rendererRef.current?.domElement
      if (el) {
        el.style.transition = 'filter 0.65s ease-out, opacity 0.65s ease-out'
        el.style.filter  = 'blur(0px)'
        el.style.opacity = '1'
        el.addEventListener('transitionend', onHide, { once: true })
      }
    } else {
      frozenRef.current = false
      blastRef.current = false
      restoreOpacityRef.current = true
      const el = rendererRef.current?.domElement
      if (el) {
        el.style.opacity = '0'
        el.style.visibility = 'visible'
        el.style.transition = 'opacity 1.2s ease-in'
        requestAnimationFrame(() => { el.style.opacity = '1' })
      }
      setTimeout(onHide, 2800)
    }
  }

  const handleBack      = () => restoreCanvas(() => setRevealedProject(null))
  const handleAboutBack = () => restoreCanvas(() => setRevealedAbout(false))

  useEffect(() => {
    if (revealedProject === null && !revealedAbout) return
    const onPopState = () => {
      history.pushState({}, '', '/')
      if (revealedProject !== null) handleBack()
      else handleAboutBack()
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [revealedProject, revealedAbout])

  useEffect(() => {
    if (revealedProject === null) { setEvalReady(false); return }
    setEvalReady(false)
    const timer = setTimeout(() => setEvalReady(true), 1000)
    return () => clearTimeout(timer)
  }, [revealedProject])

  return (
    <div className="w-full relative" style={{ height: '100vh', backgroundColor: '#eaf5fa' }}>
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
      {/* 프로젝트 detail — 캔버스 아래에 미리 깔림 */}
      {revealedProject !== null && (
        <div className="absolute inset-0" style={{ zIndex: 0 }}>
          <ProjectDetail
            id={revealedProject}
            onBack={handleBack}
            onNavigate={(newId) => {
              history.replaceState({}, '', `/works/${newId + 1}`)
              setRevealedProject(newId)
            }}
          />
        </div>
      )}
      {/* about — 캔버스 아래에 미리 깔림 */}
      {revealedAbout && (
        <div className="absolute inset-0" style={{ zIndex: 0 }}>
          <AboutDetail onBack={handleAboutBack} />
        </div>
      )}
      {/* Three.js 캔버스 — 숨겨진 후엔 클릭 통과 */}
      <div ref={mountRef} className={`absolute inset-0 ${started ? 'cursor-crosshair' : ''}`} style={{ zIndex: 1, pointerEvents: (revealedProject !== null || revealedAbout) ? 'none' : 'auto' }} />
      {!started && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ zIndex: 2 }}>
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
