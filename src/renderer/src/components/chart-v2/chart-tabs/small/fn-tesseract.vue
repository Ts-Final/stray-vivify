<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { Application, Assets, Container, PerspectiveMesh, Texture } from 'pixi.js'
import 'pixi.js/gif'
import type { GifSource } from 'pixi.js/gif'
import { Intervals } from '@renderer/core/misc/intervals'

// ---------- Props ----------
interface Props {
  textureSrc?: string
  omega12?: number
  omega34?: number
  scaleFactor?: number
  demoSize?: number
}
const props = withDefaults(defineProps<Props>(), {
  textureSrc: '/yq.jpg',
  omega12: -1,
  omega34: 1
})

// ---------- CSS 演示状态 ----------
// 用 ref 驱动，每帧更新
const t3dYaw = ref(0) // 三维绕 y
const t3dPitch = ref(0) // 三维绕 x

// ---------- 四维数据 ----------
const V4: number[][] = []
for (let i = 0; i < 16; i++) {
  V4.push([i & 1 ? 1 : -1, i & 2 ? 1 : -1, i & 4 ? 1 : -1, i & 8 ? 1 : -1])
}

const idx = (x1: number, x2: number, x3: number, x4: number) =>
  (x1 > 0 ? 1 : 0) | (x2 > 0 ? 2 : 0) | (x3 > 0 ? 4 : 0) | (x4 > 0 ? 8 : 0)

function buildFaces(): number[][] {
  const faces: number[][] = []
  const pairs = [
    [0, 1],
    [0, 2],
    [0, 3],
    [1, 2],
    [1, 3],
    [2, 3]
  ]
  for (const [i, j] of pairs) {
    const fixed = [0, 1, 2, 3].filter((k) => k !== i && k !== j)
    for (const s1 of [-1, 1]) {
      for (const s2 of [-1, 1]) {
        const corners: number[] = []
        for (const a of [-1, 1]) {
          for (const b of [-1, 1]) {
            const c = [0, 0, 0, 0]
            c[i] = a
            c[j] = b
            c[fixed[0]] = s1
            c[fixed[1]] = s2
            corners.push(idx(c[0], c[1], c[2], c[3]))
          }
        }
        faces.push([corners[0], corners[2], corners[3], corners[1]])
      }
    }
  }
  return faces
}
const FACES = buildFaces()

// ---------- 四维旋转与投影 ----------
function rotate(v: number[], t: number, w12: number, w34: number): number[] {
  const c12 = Math.cos(w12 * t)
  const s12 = Math.sin(w12 * t)
  const c34 = Math.cos(w34 * t)
  const s34 = Math.sin(w34 * t)
  const [x1, x2, x3, x4] = v
  return [x1 * c12 - x2 * s12, x1 * s12 + x2 * c12, x3 * c34 - x4 * s34, x3 * s34 + x4 * c34]
}

const DIST4 = 3.2
function project4to3(v: number[]): [number, number, number] {
  const [x1, x2, x3, x4] = v
  const k = DIST4 / (DIST4 - -x4 * 0.75)
  return [x1 * k, x3 * k, x2 * k]
}

const DIST3 = 5.0
const YAW = 0.5
const PITCH = -0.35

function project3to2(p: [number, number, number]): [number, number, number] {
  let [x, y, z] = p
  const cy = Math.cos(YAW)
  const sy = Math.sin(YAW)
  const x1 = x * cy + z * sy
  const z1 = -x * sy + z * cy
  const cp = Math.cos(PITCH)
  const sp = Math.sin(PITCH)
  const y1 = y * cp - z1 * sp
  const z2 = y * sp + z1 * cp
  const k = DIST3 / (DIST3 - z2)
  return [x1 * k, y1 * k, z2]
}

function getFirstFrameTexture(src: unknown): Texture {
  const gif = src as GifSource & { textures?: Texture[]; frames?: { texture: Texture }[] }
  if (Array.isArray(gif.textures) && gif.textures.length > 0) return gif.textures[0]
  if (Array.isArray(gif.frames) && gif.frames.length > 0) return gif.frames[0].texture
  return gif as unknown as Texture
}

// ---------- 组件状态 ----------
const hostRef = ref<HTMLDivElement | null>(null)
let app: Application | null = null
let appReady = false
let destroyed = false
let tickerCallback: (() => void) | null = null

function stopTicker() {
  if (tickerCallback) {
    Intervals.off(33, tickerCallback)
    tickerCallback = null
  }
}

function destroyApp() {
  const application = app
  app = null
  appReady = false
  if (!application) return
  stopTicker()
  application.canvas?.remove()
  // 注意：这里不能把 true 作为 destroy 的第一个参数。
  // 在 PixiJS 8.2x 中它等价于 releaseGlobalResources，
  // 会清空全局纹理池，把其他组件仍在使用的纹理一并销毁，
  // 从而出现 "destroyed while still bound to a shader" 警告。
  application.destroy({ removeView: true }, { children: true })
}

onMounted(async () => {
  const host = hostRef.value
  if (!host) return

  // ---------- PixiJS 四维 ----------
  const application = new Application()
  app = application
  await application.init({
    backgroundAlpha: 0,
    background: 'transparent',
    resizeTo: host,
    antialias: true,
    autoDensity: true,
    resolution: window.devicePixelRatio || 1
  })

  // init 期间组件已经被卸载，此时才能安全销毁
  if (destroyed) {
    if (app === application) destroyApp()
    return
  }

  appReady = true
  host.appendChild(application.canvas)

  const raw = await Assets.load(props.textureSrc)
  if (destroyed || app !== application) return
  const texture = getFirstFrameTexture(raw)

  const cube4 = new Container()
  app.stage.addChild(cube4)
  const meshes4: PerspectiveMesh[] = []
  for (let i = 0; i < FACES.length; i++) {
    const mesh = new PerspectiveMesh({
      texture,
      verticesX: 10,
      verticesY: 10,
      x0: 0,
      y0: 0,
      x1: 100,
      y1: 0,
      x2: 100,
      y2: 100,
      x3: 0,
      y3: 100
    })
    mesh.alpha = 0.3
    meshes4.push(mesh)
    cube4.addChild(mesh)
  }

  let start: number | null = null

  tickerCallback = () => {
    if (!app || destroyed) return
    const now = performance.now()
    if (start === null) start = now
    const t = (now - start) / 1000

    // 同步 CSS 演示
    t3dYaw.value = t * 0.9
    t3dPitch.value = t * 0.6

    const cx = app.screen.width / 2
    const cy = app.screen.height / 2
    const scale = Math.min(app.screen.width, app.screen.height) * 0.15

    const pts2: [number, number][] = []
    const depths: number[] = []
    for (let i = 0; i < 16; i++) {
      const v = rotate(V4[i], t, props.omega12, props.omega34)
      const p3 = project4to3(v)
      const [px, py, pz] = project3to2(p3)
      pts2.push([cx + px * scale, cy + py * scale])
      depths.push(pz)
    }

    const faceData = FACES.map((corners, i) => {
      const zAvg = corners.reduce((s, vi) => s + depths[vi], 0) / 4
      return { corners, z: zAvg, index: i }
    }).sort((a, b) => a.z - b.z)

    for (const f of faceData) {
      const mesh = meshes4[f.index]
      const [i0, i1, i2, i3] = f.corners
      const p0 = pts2[i0]
      const p1 = pts2[i1]
      const p2 = pts2[i2]
      const p3 = pts2[i3]
      mesh.setCorners(p0[0], p0[1], p1[0], p1[1], p2[0], p2[1], p3[0], p3[1])
      mesh.zIndex = faceData.indexOf(f)
      const zNorm = (f.z + 2) / 4
      mesh.alpha = 0.3 + 0.6 * Math.max(0, Math.min(1, zNorm))
    }
    cube4.sortChildren()
  }

  Intervals.on(33, tickerCallback)
})

onBeforeUnmount(() => {
  destroyed = true
  // init 尚未完成时不在这里销毁，交给 onMounted 里的收尾逻辑处理，
  // 避免在 Application 半初始化状态下调用 destroy。
  if (appReady) destroyApp()
})
</script>
<template>
  <div class="fn-tesseract">
    <div class="fn-tesseract-title">转转转</div>

    <div class="fn-tesseract-inner">
      <!-- 二维：纯 CSS -->
      <div class="fn-tst-2d">
        <div class="fn-tst-2d-img"/>
      </div>

      <!-- 三维：纯 CSS -->
      <div class="fn-tst-3d">
        <div class="fn-tst-cube">
          <div class="fn-tst-face fn-tst-face-front" />
          <div class="fn-tst-face fn-tst-face-back" />
          <div class="fn-tst-face fn-tst-face-right" />
          <div class="fn-tst-face fn-tst-face-left" />
          <div class="fn-tst-face fn-tst-face-top" />
          <div class="fn-tst-face fn-tst-face-bottom" />
        </div>
      </div>
      <!-- 四维：PixiJS 容器 -->
      <div ref="hostRef" class="fn-tst-4d" />
    </div>
  </div>
</template>

<style>
.fn-tesseract {
  width: 85%;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.fn-tesseract-inner {
  position: relative;
  width: 85%;
  height: var(--tesseract);
  overflow: hidden;
  display: flex;
  flex-direction: row;
  --tesseract: 10vmin;
  justify-content: space-evenly;
}

.fn-tst-4d {
  width: var(--tesseract);
  height: var(--tesseract);
}

.fn-tesseract-inner > div {
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  height: var(--tesseract);
  width: var(--tesseract);
}
.fn-tst-2d-img {
  width: calc(var(--tesseract) / 1.7);
  height: calc(var(--tesseract) / 1.7);
  background-size: contain;
  background-position: 0;
  background-image: url('/yq.jpg');
  animation: a-2d-spin 4s linear infinite;
}

@keyframes a-2d-spin {
  from {
    transform: rotate(0rad);
  }
  to {
    transform: rotate(6.283185307rad);
  } /* 2π */
}

/* 三维 */
.fn-tst-3d {
  position: relative;
  height: var(--tesseract);
  width: var(--tesseract);
  display: flex;
  align-items: center;
  justify-content: center;
  perspective: calc(var(--tesseract) * 6);
  overflow: hidden;
}

/* 立方体边长取 tesseract 的 0.55 倍，
   旋转时对角最大约 sqrt(3)*0.55 ≈ 0.95，不会超出容器 */
.fn-tst-cube {
  --s: calc(var(--tesseract) * 0.55);
  position: relative;
  width: var(--s);
  height: var(--s);
  transform-style: preserve-3d;
  animation: a-3d-spin 7s linear infinite;
}

@keyframes a-3d-spin {
  from {
    transform: rotateX(0rad) rotateY(0rad);
  }
  to {
    transform: rotateX(6.283185307rad) rotateY(6.283185307rad);
  }
}

.fn-tst-face {
  position: absolute;
  inset: 0;
  background-size: contain;
  background-position: center;
  background-image: url('/yq.jpg');
  box-sizing: border-box;
  opacity: 0.9;
  border: 1px solid rgba(120, 200, 255, 0.25);
}

/* 六个面：半边长 = --s / 2 */
.fn-tst-face-front {
  transform: translateZ(calc(var(--s) / 2));
}
.fn-tst-face-back {
  transform: rotateY(180deg) translateZ(calc(var(--s) / 2));
}
.fn-tst-face-right {
  transform: rotateY(90deg) translateZ(calc(var(--s) / 2));
}
.fn-tst-face-left {
  transform: rotateY(-90deg) translateZ(calc(var(--s) / 2));
}
.fn-tst-face-top {
  transform: rotateX(90deg) translateZ(calc(var(--s) / 2));
}
.fn-tst-face-bottom {
  transform: rotateX(-90deg) translateZ(calc(var(--s) / 2));
}
</style>
