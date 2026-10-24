import { Ref, ref, watch } from 'vue'
import { Invoke } from '@renderer/core/ipc'
import { Storage } from '@renderer/core/storage'
import { notify } from '@renderer/core/misc/notify'

export namespace ChartSize {
  export const data = ref({
    total: 0,
    detail: [] as [number, string][],
    detail_sf: [] as [number, string][],
    exe: 0,
    app: 0
  })

  export async function update() {
    data.value = await Invoke('charts-size')
  }
}

export namespace MemoryUsage {
  export interface MemoryInfo {
    jsHeapSizeLimit: number
    totalJSHeapSize: number
    usedJSHeapSize: number
  }
  export const backend = ref({
    rss: 0,
    heapTotal: 0,
    heapUsed: 0,
    external: 0,
    arrayBuffers: 0
  })
  export const frontend = ref({
    jsHeapSizeLimit: 0,
    totalJSHeapSize: 0,
    usedJSHeapSize: 0
  })
  export function update() {
    Invoke('memory-backend').then((r) => {
      backend.value = r
    })
    if ((performance as any).memory)
      frontend.value = (performance as any).memory as MemoryInfo
  }
}
export namespace MouseTracker {
  export const mouse_pos = ref({ x: 0, y: 0 })
  function listener(e: MouseEvent) {
    mouse_pos.value = { x: e.clientX, y: e.clientY }
  }
  export function init() {
    watch(
      () => Storage.data.value.settings.mouse_tracker,
      (v) => {
        if (v) {
          document.addEventListener('mousemove', listener)
          document.documentElement.classList.add('no-cursor')
        } else {
          document.removeEventListener('mousemove', listener)
          document.documentElement.classList.remove('no-cursor')
        }
      },
      { immediate: true }
    )
  }
}

type log = {
  level: 'msg' | 'err' | 'warn' | 'debug'
  msg: string
  time: number
}
export const Log = {
  count: ref({
    msg: 0,
    err: 0,
    warn: 0,
    debug: 0,
    all: 0
  }),
  error_list: ref([]) as Ref<log[]>,
  need_img: ref([]) as Ref<[string, number][]>,
  handle(disable_inspect: boolean) {
    window.addEventListener(
      'error',
      (e) => {
        let msg = e.message
        if (e.target instanceof HTMLImageElement) {
          const t = e.target
          const src = decodeURIComponent(t.src)
          const ix = this.need_img.value.findIndex((v) => v[0] == src)
          if (ix >= 0) {
            this.need_img.value[ix][1] += 1
          } else {
            this.need_img.value.push([src, 1])
          }
          return
        }
        Log.error(msg)
        if (Storage.settings.err_notify) {
          notify.error('发生未捕获的错误！请查看Inspector。')
        }
        this.fix_max()
      },
      true
    )
    window.addEventListener('unhandledrejection', (e) => {
      let msg = e.reason
      if (msg == 'opened') return
      Log.error(msg)
      if (Storage.settings.err_notify) {
        notify.error('发生未捕获的错误！请查看Inspector。')
      }
      this.fix_max()
    })
    if (disable_inspect) return
    if (location.protocol == 'http:') return
    const keys = ['log', 'warn', 'error', 'debug']
    for (const key of keys) {
      const old: Function = console[key]
      console[key] = function (...args: any) {
        old.call(console, ...args)
        args = args.map((v) => {
          if (typeof v === 'object')
            try {
              return JSON.stringify(v)
            } catch (e) {
              // pass
            }
          else return v
        })
        Log[key](args.join(' '))
      }
    }
  },
  error(msg: string) {
    this.error_list.value.push({
      level: 'err',
      msg,
      time: Date.now()
    })
    this.count.value.err++
  },
  log(msg: string) {
    this.error_list.value.push({
      level: 'msg',
      msg,
      time: Date.now()
    })
    this.count.value.msg++
  },
  warn(msg: string) {
    this.error_list.value.push({
      level: 'warn',
      msg,
      time: Date.now()
    })
    this.count.value.warn++
  },
  debug(msg: string) {
    this.error_list.value.push({
      level: 'debug',
      msg,
      time: Date.now()
    })
    this.count.value.debug++
  },
  fix_max() {
    this.error_list.value.length = Math.min(this.error_list.value.length, 500)
  }
}
