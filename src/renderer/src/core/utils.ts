import { onUnmounted, Ref, watch, WatchCallback, WatchOptions, WatchSource } from 'vue'
import { ChartTypeV2 } from '@preload/chart-types'

export namespace utils {
  /** return whether a value is between the given states */
  export function between(val: number, vs: [number, number]): boolean {
    let [v1, v2] = vs
    if (v1 > v2) [v1, v2] = [v2, v1] // Ensure v1 < v2
    return val >= v1 && val <= v2
  }

  export function remove<T>(arr: T[], v: T) {
    const ix = arr.indexOf(v)
    if (ix >= 0) arr.splice(ix, 1)
  }

  export function round(val: number, digit = 0) {
    return Math.round(val * 10 ** digit) / 10 ** digit
  }

  export function clamp(val: number, min_val: number, max_val: number) {
    return Math.min(Math.max(val, min_val), max_val)
  }

  export function deepCopy<T>(obj: T): T {
    if (obj === null || typeof obj !== 'object') {
      return obj
    }

    if (Array.isArray(obj)) {
      const copy: any[] = []
      for (let i = 0; i < obj.length; i++) {
        copy[i] = deepCopy(obj[i])
      }
      return copy as T
    }

    const copy: { [key: string]: any } = {}
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        copy[key] = deepCopy(obj[key])
      }
    }
    return copy as T
  }

  // 同意领吗写的，不管了
  export function assign<T extends object>(target: T, ...sources: Partial<T>[]): T {
    if (target == null) {
      throw new TypeError('Cannot convert undefined or null to object')
    }

    const to = Object(target)

    for (const source of sources) {
      if (source != null) {
        for (const key in source) {
          if (Object.prototype.hasOwnProperty.call(source, key)) {
            const sourceValue = source[key]
            const targetValue = to[key]

            if (
              typeof sourceValue === 'object' &&
              sourceValue !== null &&
              !Array.isArray(sourceValue)
            ) {
              if (
                typeof targetValue === 'object' &&
                targetValue !== null &&
                !Array.isArray(targetValue)
              ) {
                to[key] = assign(
                  {} as Record<Extract<keyof T, string>, unknown>,
                  targetValue,
                  sourceValue
                )
              } else {
                to[key] = assign({} as Record<Extract<keyof T, string>, unknown>, sourceValue)
              }
            } else {
              to[key] = sourceValue
            }
          }
        }
      }
    }

    return to
  }

  // only update value if there is sth accordingly in target
  export function less_assign<T extends object>(target: T, ...sources: Partial<T>[]): T {
    if (target == null) {
      throw new TypeError('Cannot convert undefined or null to object')
    }
    const to = Object(target)

    for (const source of sources) {
      if (source != null) {
        for (const key in source) {
          if (key in target) {
            // noinspection DuplicatedCode
            if (Object.prototype.hasOwnProperty.call(source, key)) {
              const sourceValue = source[key]
              const targetValue = to[key]

              if (
                typeof sourceValue === 'object' &&
                sourceValue !== null &&
                !Array.isArray(sourceValue)
              ) {
                if (
                  typeof targetValue === 'object' &&
                  targetValue !== null &&
                  !Array.isArray(targetValue)
                ) {
                  to[key] = assign(
                    {} as Record<Extract<keyof T, string>, unknown>,
                    targetValue,
                    sourceValue
                  )
                } else {
                  to[key] = assign({} as Record<Extract<keyof T, string>, unknown>, sourceValue)
                }
              } else {
                to[key] = sourceValue
              }
            }
          }
        }
      }
    }

    return to
  }

  //LOL copied from a blog

  export function GML_style_hsv_to_hsl(
    h: number,
    s: number,
    v: number
  ): { h: number; s: number; l: number } {
    h *= 24 / 17
    s /= 255
    v /= 255
    const t = (2 - s) * v
    s = v === 0 || s === 0 ? 0 : (s * v) / (t > 1 ? 2 - t : t)
    return { h: h, s: s * 100, l: (t / 2) * 100 } //h,s,v∈[0,100]
  }

  export function guard<T>(val: any, ini: T): T {
    if (typeof val != typeof ini) return ini
    else return val
  }

  export function clear_arr(arr: any[]) {
    while (arr.length) arr.pop()
  }

  export function sort_notes(a: ChartTypeV2.note, b: ChartTypeV2.note) {
    return a.time - b.time
  }

  export function around(v1: number, v2: number, gap = 20) {
    return Math.abs(v1 - v2) <= gap
  }

  export function random<T>(arr: T[]) {
    return arr[Math.floor(Math.random() * arr.length)]
  }

  export function toTimeStr(seconds: number, fix = 3) {
    const isNegative = seconds < 0
    const absSeconds = Math.abs(seconds)
    const hours = Math.floor(absSeconds / 3600)
    const remainingSeconds = absSeconds % 3600
    const minutes = Math.floor(remainingSeconds / 60)
    const secs = (remainingSeconds % 60).toFixed(fix)

    const formattedHours = hours.toString().padStart(2, '0')
    const formattedMinutes = minutes.toString().padStart(2, '0')
    const formattedSeconds = parseFloat(secs) < 10 ? '0' + secs : secs

    if (hours > 0) {
      return (
        (isNegative ? '-' : '') + formattedHours + ':' + formattedMinutes + ':' + formattedSeconds
      )
    } else {
      // 如果没有小时，则按照原来的格式返回（分钟:秒）
      if (minutes === 0) {
        return (isNegative ? '-' : '') + '0:' + formattedSeconds
      }
      return (isNegative ? '-' : '') + formattedMinutes + ':' + formattedSeconds
    }
  }
  export function toLocalTime(time: number) {
    const date = new Date(time)
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')
    const seconds = date.getSeconds().toString().padStart(2, '0')
    return `${hours}:${minutes}:${seconds}`
  }

  export function ms2str(ms: number, fix = 3) {
    return toTimeStr(ms / 1000, fix)
  }

  export function average(arr: number[]) {
    return arr.reduce((a, b) => a + b, 0) / arr.length
  }

  export function shallow_assign<T>(target: Required<T>, source: Partial<T>) {
    for (const key of keyof(source)) {
      target[key] = JSON.parse(JSON.stringify(source[key]))
    }
  }

  export function keyof<T extends object>(obj: T) {
    return Object.keys(obj) as (keyof T)[]
  }
  /* Max - Min */
  export function range(...args: number[]) {
    return Math.max(...args) - Math.min(...args)
  }
  export function timer(cb: () => void, count = 1) {
    const r0 = performance.now()
    for (let i = 0; i < count; i++) {
      cb()
    }
    return performance.now() - r0
  }
  export function nextFrame() {
    return new Promise((resolve) => requestAnimationFrame(resolve))
  }

  export function wait(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
  export function refresh() {}

  export function memset<R extends string, T>(o: Record<R, T>, v: T) {
    for (const key in o) {
      o[key] = v
    }
  }

  /**
   * Find all indexes of values that satisfies the given predicate.
   * O(n)? maybe
   * @param arr The Array to be executed
   * @param fn The predicate function
   */
  export function indexes_of<T>(arr: T[], fn: (v: T, ix: number) => boolean) {
    const r: number[] = []
    for (let i = 0; i < arr.length; i++) {
      if (fn(arr[i], i)) r.push(i)
    }
    return r
  }

  /**
   * Generate a slice of array on given indexes
   * @param arr
   * @param indexes {number}
   */
  export function from_indexes<T>(arr: T[], indexes: number[]) {
    const r: T[] = []
    for (let i = 0; i < indexes.length; i++) {
      r.push(arr[indexes[i]])
    }
    return r
  }

  export function is_equal(a: any, b: any): boolean {
    // 严格相等（处理基本类型和同一引用）
    if (a === b) {
      return true
    }

    // 至少一个为 null 或 undefined（因为上面已排除 a === b）
    if (a == null || b == null) {
      return false
    }

    // 类型不同直接返回 false
    if (typeof a !== typeof b) {
      return false
    }

    // 处理对象和数组
    if (typeof a === 'object') {
      // 数组 vs 非数组
      if (Array.isArray(a) !== Array.isArray(b)) {
        return false
      }

      const aKeys = Object.keys(a)
      const bKeys = Object.keys(b)

      // 属性数量不同
      if (aKeys.length !== bKeys.length) {
        return false
      }

      // 递归比较每个属性
      for (const key of aKeys) {
        if (!b.hasOwnProperty(key)) {
          return false
        }
        if (!is_equal(a[key], b[key])) {
          return false
        }
      }

      return true
    }

    // 其他情况（如函数、Symbol 等）不认为相等
    return false
  }
  export function useDeepWatch(observed: Ref) {
    const { stop } = watch(observed, () => {}, { deep: true })
    onUnmounted(() => stop())
  }

  export function stopWatch(source: WatchSource, cb: WatchCallback, options?: WatchOptions) {
    const x = watch(source, cb, options)
    onUnmounted(x.stop)
    return x
  }

  export function get_len(note: ChartTypeV2.note) {
    return 'len' in note ? note.len : 0
  }

  export async function decode_audio(blob: Blob, audioContext: AudioContext): Promise<AudioBuffer> {
    const arrayBuffer = await blob.arrayBuffer()
    return await audioContext.decodeAudioData(arrayBuffer)
  }

  export function or(cond: boolean, val: any) {
    if (cond) return val
    return
  }

  export function reduce_max(arr: number[]) {
    return arr.reduce((a, b) => Math.max(a, b), -Infinity)
  }

  export function nearest(val: number, arr: number[]) {
    return arr.toSorted((a, b) => Math.abs(val - a) - Math.abs(val - b))[0] ?? val
  }

  export function fitLine(data: [number, number][]): { a: number; b: number } {
    const n = data.length
    if (n < 2) return { a: NaN, b: NaN }

    // 先求均值
    const meanX = utils.average(data.map((x) => x[0]))
    const meanY = utils.average(data.map((x) => x[1]))

    // 用离差计算，避免大数相减
    let sxx = 0,
      sxy = 0
    for (const [x, y] of data) {
      const dx = x - meanX
      const dy = y - meanY
      sxx += dx * dx
      sxy += dx * dy
    }

    if (sxx === 0) return { a: Infinity, b: 0 }

    const a = sxy / sxx
    const b = meanY - a * meanX
    return { a, b }
  }

  export function variance(arr: number[], avg?: number) {
    if (!avg) avg = average(arr)
    return arr.map(x => Math.pow(x - avg, 2)).reduce((a, b) => a + b, 0) / arr.length
  }
}

// @ts-expect-error
window.utils = utils
