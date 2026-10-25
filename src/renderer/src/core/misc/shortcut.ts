import { Storage } from '@renderer/core/storage'
import { ref } from 'vue'
import { Chart } from '@renderer/core/chart/chart'
import { GlobalStat } from '@renderer/core/globalStat'
import { modal } from '@renderer/core/misc/modal'
import { notify } from '@renderer/core/misc/notify'
import { Invoke } from '@renderer/core/ipc'
import { RefreshAll } from '@renderer/core/misc/refresh-all'
import { NoteClipboard } from '@renderer/core/misc/note-clipboard'
import { NoteType } from '@renderer/core/misc/note-type'

const functions = [
  'redo',
  'undo',
  'delete',
  'copy',
  'paste',
  'cut',
  'dev',
  'pause',

  'scale-up',
  'scale-down',
  'refresh',

  'log',
  'settings',
  'iexport',
  'save',
  'error',

  '4k1',
  '4k2',
  '4k3',
  '4k4',

  'w1',
  'w2',
  'w3',
  'w4',
  's',
  'mine',
  'hold',
] as const

type SC_save = {
  name: (typeof functions)[number]
  key: string
  alt: boolean
  ctrl: boolean
  shift: boolean
}
const on_listening = ref(false)
export class ShortCuts {
  static all: ShortCuts[] = []
  static on_listening = on_listening
  name: (typeof functions)[number]
  private _alt: boolean
  private _ctrl: boolean
  private _shift: boolean
  private readonly cb: (e: KeyboardEvent) => any
  private keyup: ((e: KeyboardEvent) => any) | null

  constructor(
    name: (typeof functions)[number],
    k: string,
    cb: (e: KeyboardEvent) => any,
    alt = false,
    ctrl = false,
    shift = false
  ) {
    this.name = name
    this._key = k
    this._alt = alt
    this._ctrl = ctrl
    this._shift = shift
    this.cb = cb
    this.keyup = null
    ShortCuts.all.push(this)
  }

  private _key: string

  get key() {
    return this._key
  }

  get data() {
    return {
      name: this.name,
      key: this.key,
      alt: this._alt,
      ctrl: this._ctrl,
      shift: this._shift
    }
  }

  static exists(k: string, alt = false, ctrl = false, shift = false) {
    return ShortCuts.all.find((x) => {
      return x.is(k, alt, ctrl, shift)
    })
  }

  static handle() {
    document.addEventListener(
      'keydown',
      (e) => {
        if (on_listening.value) return
        if (e.target instanceof HTMLInputElement) {
          if (e.target.type == 'text' || e.target.type == 'number') return
          else e.target.blur()
        }
        ShortCuts.all.forEach((x) => {
          x.handle(e)
        })
      },
      true
    )
    document.addEventListener('keyup', (e) => this.handle_keyup(e), true)
  }

  static handle_keyup(e: KeyboardEvent) {
    if (on_listening.value) return
    if (e.target instanceof HTMLInputElement) {
      if (e.target.type == 'text' || e.target.type == 'number') return
      else e.target.blur()
    }
    ShortCuts.all.forEach((x) => {
      x.handle_keyup(e)
    })
  }

  static fun(fn: (typeof functions)[number]) {
    return this.all.find((x) => x.name == fn)
  }

  static $fun(fn: (typeof functions)[number]) {
    const x = this.all.find((x) => x.name == fn)
    if (!x) throw new Error()
    return x
  }

  static toJson(): SC_save[] {
    return ShortCuts.all.map((x) => {
      return {
        name: x.name,
        key: x.key,
        alt: x._alt,
        ctrl: x._ctrl,
        shift: x._shift
      }
    })
  }

  static to_string() {
    return JSON.stringify(this.toJson())
  }

  static fromJson(data: string) {
    if (data == '') return
    const p1 = JSON.parse(data) as SC_save[]
    for (const p of p1) {
      const x = ShortCuts.all.find((x) => x.name == p.name)
      if (!x) return
      x.set_key(p.key, p.alt, p.ctrl, p.shift)
    }
  }

  static stop_listening() {
    this.on_listening.value = true
  }
  static resume_listening() {
    this.on_listening.value = false
  }

  handle_keyup(e: KeyboardEvent) {
    if (this.keyup == null) return
    if (this.is(e.key, e.altKey, e.ctrlKey, e.shiftKey)) {
      this.keyup(e)
    }
  }

  set_keyup(fn: (e?: KeyboardEvent) => any) {
    this.keyup = fn
  }

  set_key(k: string, alt = false, ctrl = false, shift = false) {
    const same = ShortCuts.exists(k, alt, ctrl, shift)
    if (same) {
      notify.error(`有按键(${same.name})重合了哦！`)
    }
    this._key = k
    this._ctrl = ctrl
    this._alt = alt
    this._shift = shift
    Storage._ref.value.shortcut = ShortCuts.to_string()
  }

  is(k: string, alt = false, ctrl = false, shift = false) {
    return this.key.toLowerCase() == k.toLowerCase() && this._alt == alt && this._ctrl == ctrl && this._shift == shift
  }

  handle(e: KeyboardEvent) {
    if (this.is(e.key, e.altKey, e.ctrlKey, e.shiftKey)) {
      this.cb(e)
    }
  }

  parse() {
    const l: string[] = []
    if (this._ctrl) l.push('Ctrl')
    if (this._alt) l.push('Alt')
    if (this._shift) l.push('Shift')
    l.push(this.key.toUpperCase())
    return l.join('+')
  }

  set_data(data: SC_save) {
    this.name = data.name
    this.set_key(data.key, data.alt, data.ctrl, data.shift)
  }
}

new ShortCuts('redo', 'y', () => Chart.current?.diff.execute_redo(), false, true)
new ShortCuts('undo', 'z', () => Chart.current?.diff.execute_undo(), false, true)

new ShortCuts('w1', '1', () =>   NoteType.set_width(1))
new ShortCuts('w2', '2', () =>   NoteType.set_width(2))
new ShortCuts('w3', '3', () =>   NoteType.set_width(3))
new ShortCuts('w4', '4', () =>   NoteType.set_width(4))
new ShortCuts('s', 'q', () =>    NoteType.change_s())
new ShortCuts('mine', 'w', () => NoteType.change_b())
new ShortCuts('hold', 'e', () => NoteType.change_hold())
new ShortCuts('pause', ' ', () => {
  if (GlobalStat.chart_state.value != 0) return
  Chart.current?.audio.play_pause()
})

new ShortCuts('log', 'F1', () => {
  modal.InspectorModal.show({})
})
new ShortCuts('settings', 'F2', () => {
  modal.SettingModal.show({})
})

new ShortCuts('dev', 'F12', () => {
  Invoke('open-dev')
})

new ShortCuts(
  'copy',
  'c',
  () => {
    NoteClipboard.copy()
  },
  false,
  true
)
new ShortCuts(
  'paste',
  'v',
  () => {
    NoteClipboard.paste()
  },
  false,
  true
)
new ShortCuts(
  'cut',
  'x',
  () => {
    NoteClipboard.cut()
  },
  false,
  true
)

new ShortCuts('4k1', 'd', () => {
  Chart.current?.handle_key(0)
})
new ShortCuts('4k2', 'f', () => {
  Chart.current?.handle_key(1)
})
new ShortCuts('4k3', 'j', () => {
  Chart.current?.handle_key(2)
})
new ShortCuts('4k4', 'k', () => {
  Chart.current?.handle_key(3)
})

new ShortCuts('iexport', 'p', () => {
  modal.IExporterModal.show({})
})

ShortCuts.$fun('4k1').set_keyup(() => Chart.current?.handle_keyup(0))
ShortCuts.$fun('4k2').set_keyup(() => Chart.current?.handle_keyup(1))
ShortCuts.$fun('4k3').set_keyup(() => Chart.current?.handle_keyup(2))
ShortCuts.$fun('4k4').set_keyup(() => Chart.current?.handle_keyup(3))

new ShortCuts(
  'save',
  's',
  () => {
    Chart.current?.save(true)
  },
  false,
  true
)

new ShortCuts('refresh', 'r', () => RefreshAll.refreshAll(), false, true)

new ShortCuts("error", "F3", () => { throw new Error("Thrown by shortcut call")})
