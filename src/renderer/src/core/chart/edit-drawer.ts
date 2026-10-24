import { Chart } from '@renderer/core/chart/chart'
import { BlurFilter, Graphics, Sprite } from 'pixi.js'
import { Storage } from '@renderer/core/storage'
import { DiffDrawer, DrawerExtension, NoteDrawer } from '@renderer/core/chart/drawer'
import { ChartTypeV2 } from '@preload/chart-types'
import { GlobalStat } from '@renderer/core/globalStat'
import { toRaw } from 'vue'
import { notify } from '@renderer/core/misc/notify'
import { utils } from '@renderer/core/utils'
import { Chart_diff } from '@renderer/core/chart/diff'
import { Skin } from '@renderer/core/misc/skin'
import { NoteClipboard } from '@renderer/core/misc/note-clipboard'
import { RefreshAll } from '@renderer/core/misc/refresh-all'
import { NoteType } from '@renderer/core/misc/note-type'

const mul = Storage.computes.mul
const pointer_last = {
  x: 0,
  y: 0
}
/**
 * @property p Pending
 * @property s select
 * @property d shadow
 * */
const psd = {
  p: null as null | Pending,
  s: null as null | Select,
  d: null as null | Shadow
}

class Pending {
  diff_drawer: DiffDrawer
  chart: Chart
  diff: Chart_diff
  drawer: {
    note: DrawerExtension<Sprite, ChartTypeV2.note>
    ln: DrawerExtension<Sprite, ChartTypeV2.note>
  }
  hold_fixed = false
  hold_fixed_time = 0
  dragging: boolean
  dragging_base_time = 0
  dragging_base_lane = 0
  dragging_delta = 0
  dragging_notes: ChartTypeV2.note[] = []
  /**
   * a flag check for drag
   *
   * the event triggers follow the order of:
   *    sprite.mousedown -> canvas.mousedown
   * on sprite.mousedown would set this to true, preventing add-note of canvas.mousedown
   * if none sprite is clicked, enables add-note
   */
  pre_drag = false
  dragging_width = 0

  constructor(diff_drawer: DiffDrawer, chart: Chart) {
    this.diff_drawer = diff_drawer
    this.chart = chart
    this.diff = chart.diff
    this.dragging = false
    const pending_note_drawer = new DrawerExtension(
      (note: ChartTypeV2.note) => {
        return NoteDrawer.createNote.apply(this.diff_drawer, [note])
      },
      { label: 'pending_note', zIndex: 11, alpha: 0.7 }
    )
    const pending_ln_drawer = new DrawerExtension(
      (note: ChartTypeV2.note) => {
        return NoteDrawer.createLn.apply(this.diff_drawer, [note])
      },
      { label: 'pending_ln', zIndex: 10, alpha: 0.7 }
    )
    this.drawer = {
      note: pending_note_drawer,
      ln: pending_ln_drawer
    }
    this.diff_drawer.add_on('scale-changed', () => {
      this.update_pending()
    })
    this.diff_drawer.add_on('audio-time-update', () => this.update_pending())
    this.bind_clipboard()
    psd.p = this
  }

  get select() {
    return !!NoteClipboard.selected.length
  }

  get snm() {
    return NoteType.snm
  }

  set snm(_) {
    this.recreate()
  }

  _time: number = 0

  get time() {
    return this._time
  }

  set time(v: number) {
    this._time = v
    this.update_pending()
  }

  _lane: number = 0

  get lane() {
    return this._lane
  }

  set lane(v: number) {
    this._lane = v
    this.recreate()
  }

  _len: number = 0

  get len() {
    return this._len
  }

  set len(v: number) {
    this._len = v
  }

  _display: boolean = false

  get display() {
    return this._display
  }

  set display(v: boolean) {
    this._display = v
    this.update_display()
  }

  get pending_note(): ChartTypeV2.note[] {
    if (this.dragging) {
      return this.dragging_notes.map((note) => {
        return {
          ...note,
          time: this.time + (note.time - this.dragging_base_time) - this.dragging_delta,
          lane: this.lane + (note.lane - this.dragging_base_lane)
        }
      })
    }
    if (NoteClipboard.clipboard.value.length) {
      return NoteClipboard.clipboard.value.map((x) => {
        return {
          ...x,
          time: this.time + x.time
        }
      })
    }
    if (NoteType.w == 0) return []
    if (NoteType.h) return [{ time: this.time, lane: this.lane, width: NoteType.w, len: this.len }]
    else return [{ time: this.time, lane: this.lane, width: NoteType.w, snm: this.snm }]
  }

  get is_hold() {
    return NoteType.h
  }

  get pending_width() {
    if (this.dragging) return this.dragging_width
    else return NoteType.w
  }

  get select_raw() {
    return toRaw(NoteClipboard.selected)
  }

  update_pending() {
    this.drawer.note.update((g, note) => {
      g.x = this.diff_drawer.x_of(note.lane)
      g.y = this.diff_drawer.get_y(note.time, this.chart.audio.current_time, mul.value)
    })
    this.drawer.ln.update((g, note) => {
      g.x = this.diff_drawer.x_of(note.lane)
      g.y = this.diff_drawer.get_y_ln(
        note.time,
        this.chart.audio.current_time,
        mul.value,
        utils.get_len(note)
      )
    })
  }
  update_ln() {
    this.drawer.ln.update((g, note) => {
      if ('len' in note) {
        g.height = this.diff_drawer.get_height_ln(note.len, mul.value)
      }
    })
  }

  recreate() {
    this.drawer.note.recreate(...this.pending_note)
    this.drawer.ln.recreate(...this.pending_note)
  }

  update_display(v?: boolean) {
    if (!v) v = this._display
    this.drawer.note.container.visible = v
    this.drawer.ln.container.visible = v
  }

  on_click() {
    if (psd.p?.pre_drag) return
    if (GlobalStat.chart_state.value != 0) return
    if (NoteClipboard.clipboard.value.length) {
      this.diff.add_notes_with_undo(this.pending_note)
      NoteClipboard.clear()
      return
    }
    if (NoteType.w == 0) {
      return
    }

    if (NoteType.hold.value) {
      if (this.hold_fixed) {
        if (!this.diff.add_notes_with_undo(this.pending_note)) notify.error('添加note失败。')
        this.len = 0
        this.hold_fixed = false
        this.hold_fixed_time = 0
      } else {
        this.hold_fixed = true
        this.hold_fixed_time = this.time
      }
      this.recreate()
      return
    } else {
      if (!this.diff.add_notes_with_undo(this.pending_note)) notify.error('添加note失败。')
    }
  }
  on_right() {
    this.hold_fixed = false
    this.len = 0
    this.hold_fixed_time = 0
    this.recreate()
    this.update_pending()
  }

  /** trigger on mousedown */
  pre_drag_start() {
    this.pre_drag = true
  }

  pre_drag_end() {
    this.pre_drag = false
  }

  /* trigger on mousemove */
  drag_start(note: ChartTypeV2.note) {
    if (!this.pre_drag) return
    if (this.dragging) return

    this.dragging = true
    if (this.select) {
      if (NoteClipboard.selected.includes(note)) {
        this.dragging_notes = NoteClipboard.selected.map((x) => x)
      }
    } else this.dragging_notes = [note]
    this.dragging_base_lane = Math.min(...this.dragging_notes.map((x) => x.lane))
    this.dragging_base_time = Math.min(...this.dragging_notes.map((x) => x.time))
    this.dragging_delta = note.time - this.dragging_base_time
    this.dragging_width = utils.range(
      ...this.dragging_notes
        .map((n) => {
          return [n.lane, n.lane + n.width]
        })
        .flat()
    )
    this.hold_fixed = false
    this.len = 0
    this.update_dragging_visible()
    this.recreate()
  }

  cancel_drag() {
    this.dragging = false
    this.pre_drag = false
    this.dragging_base_time = 0
    this.dragging_base_lane = 0
    this.dragging_notes = []
    this.dragging_delta = 0
    this.dragging_width = 0
    this.update_dragging_visible()
    this.recreate()
  }

  drop() {
    if (!this.dragging) return
    if (!this.diff.remove_note_with_undo(...this.dragging_notes)) {
      notify.error('删除note失败。')
      return this.cancel_drag()
    }
    if (!this.diff.add_notes_with_undo(this.pending_note)) {
      notify.error('添加note失败。')
    }
    this.cancel_drag()
  }

  update_dragging_visible() {
    const x = this.dragging
      ? (g: Sprite, note: ChartTypeV2.note) => (g.visible = !this.dragging_notes.includes(note))
      : (g: Sprite) => (g.visible = true)

    this.diff_drawer.drawers.notes.update(x)
    this.diff_drawer.drawers.ln.update(x)
  }

  bind_clipboard() {
    NoteClipboard.copy = () => this.copy()
    NoteClipboard.cut = () => this.cut()
    NoteClipboard.paste = () => this.paste()
  }

  copy() {
    if (!this.select) return
    const to_note = this.diff.to_note
    const min = Math.min(...NoteClipboard.selected.map((x) => to_note(x).time))
    NoteClipboard.clipboard.value = NoteClipboard.selected.map((x) => {
      const note = to_note(x)
      return {
        ...note,
        time: note.time - min
      }
    })
    NoteClipboard.selected = []
    this.recreate()
  }
  cut() {
    if (!this.select) return
    const to_note = this.diff.to_note
    const min = Math.min(...this.select_raw.map((x) => to_note(x).time))
    NoteClipboard.clipboard.value = this.select_raw.map((x) => {
      const note = to_note(x)
      return {
        ...note,
        time: note.time - min
      }
    })
    this.diff.remove_note_with_undo(...NoteClipboard.selected)
    NoteClipboard.selected = []
    this.recreate()
  }
  paste() {
    this.diff.add_notes_with_undo(this.pending_note)
    NoteClipboard.clipboard.value = []
    this.recreate()
  }
}
class Shadow {
  drawer: DrawerExtension<Graphics, ChartTypeV2.note>
  diff_drawer: DiffDrawer
  diff: Chart_diff
  chart: Chart
  width: number
  constructor(diff_drawer: DiffDrawer, width = 2) {
    this.width = width
    this.chart = diff_drawer.diff.chart
    this.diff = diff_drawer.diff
    this.diff_drawer = diff_drawer
    const lane_width = diff_drawer.sizing.lane_width
    this.drawer = new DrawerExtension(
      (note: ChartTypeV2.note) => {
        const gh = this.shadow_height(note)
        const gw = lane_width * note.width + 2 * width
        const g = new Graphics().rect(0, 0, gw, gh).fill('gold')
        g.x = this.diff_drawer.x_of(note.lane) - 10
        return g
      },
      {
        label: 'shadow',
        zIndex: 5,
        filters: [new BlurFilter({ strength: 5 })]
      }
    )
    psd.d = this
  }
  shadow_height(note: ChartTypeV2.note) {
    if ('len' in note) return note.len * mul.value + 0.5 * Skin.BaseHeight + 2 * this.width
    else return Skin.BaseHeight + 2 * this.width
  }
  update() {
    const c = this.chart.audio.current_time
    const m = mul.value
    this.drawer.update((g, i) => {
      const note = this.diff_drawer.diff.to_note(i)
      g.x = this.diff_drawer.x_of(note.lane) - this.width
      if ('len' in note) g.y = this.diff_drawer.get_y_ln(note.time, c, m, note.len) - this.width
      else g.y = this.diff_drawer.get_y(note.time, c, m) - this.width
    })
  }
  recreate() {
    this.drawer.recreate(...NoteClipboard.selected)
    this.update()
  }
  update_scale() {
    this.drawer.update((g, i) => {
      const note = this.diff_drawer.diff.to_note(i)
      g.height = this.shadow_height(note)
      if ('len' in note)
        g.y =
          this.diff_drawer.get_y_ln(note.time, this.chart.audio.current_time, mul.value, note.len) -
          this.width
      else
        g.y =
          this.diff_drawer.get_y(note.time, this.chart.audio.current_time, mul.value) - this.width
    })
  }
  hide() {
    this.drawer.container.visible = false
  }
  show() {
    this.drawer.container.visible = true
  }
}
class Select {
  rect: Graphics
  selecting = false
  start_time = 0
  base_x = 0
  drawer: DiffDrawer
  constructor(drawer: DiffDrawer) {
    this.rect = new Graphics({ label: 'select-rect' }).fill('#b8dcee')
    this.drawer = drawer
    this.rect.alpha = 0.6
    this.rect.visible = false
    this.rect.zIndex = 15
    drawer.app.stage.addChild(this.rect)
    this.rect.x = 0
    this.rect.y = 0
    this.drawer.add_on('audio-time-update', () => {
      this.update(pointer_last.x, this.drawer.event_time(pointer_last.y))
    })
    psd.s = this
  }
  on_mousedown(e: MouseEvent) {
    if (this.selecting) return
    if (NoteType.w != 0) return
    this.selecting = true
    this.rect.visible = true
    this.base_x = e.offsetX
    this.start_time = this.drawer.mouse_time(e.offsetY)
    document.addEventListener('mouseup', () => this.on_mouseup(pointer_last.x), {
      once: true
    })
  }
  update(mouseX: number, mousetime: number) {
    if (!this.selecting) return
    const height = Math.abs(mousetime - this.start_time) * mul.value
    const width = Math.abs(mouseX - this.base_x)
    const x = Math.min(mouseX, this.base_x)
    const y =
      this.drawer.get_y(
        Math.max(mousetime, this.start_time),
        this.drawer.chart.audio.current_time,
        mul.value
      ) +
      0.5 * Skin.height(this.drawer.sizing.lane_width)
    this.rect.clear()
    this.rect.rect(x, y, width, height).fill('#b8dcee')
  }
  on_mouseup(eX: number) {
    if (!this.selecting) return
    const diff = this.drawer.diff
    const mouse_time = this.drawer.event_time(pointer_last.y)

    // main select
    const bar_width = this.drawer.sizing.total_width - 100 - this.drawer.sizing.x_expand
    const max_lane = this.drawer.diff.max_lane.value
    const lane0 = ((eX - 50) / bar_width) * max_lane
    const lane1 = ((this.base_x - 50) / bar_width) * max_lane
    const lane_min = Math.min(lane0, lane1)
    const lane_max = Math.max(lane0, lane1)

    const time0 = Math.min(mouse_time, this.start_time) - 50
    const time1 = Math.max(mouse_time, this.start_time) + 50
    if (GlobalStat.func_keys.value.ctrl)
      NoteClipboard.selected.push(
        ...diff.notes.filter((n) => {
          if (n.time >= time0 && n.time <= time1) {
            if (NoteClipboard.selected.includes(n)) return false
            if (n.lane + 0.25 >= lane_min && n.lane + n.width - 0.25 <= lane_max) return true
          }
          return false
        })
      )
    else
      NoteClipboard.selected = diff.notes.filter((n) => {
        if (n.time >= time0 && n.time <= time1)
          if (n.lane + 0.25 >= lane_min && n.lane + n.width - 0.25 <= lane_max) return true
        return false
      })

    psd.d?.recreate()
    this.cleanup()
    RefreshAll.refresh('select')
  }
  cleanup() {
    this.selecting = false
    this.rect.visible = false
    this.base_x = 0
    this.start_time = 0
    this.rect.clear()
  }
}
export function editable_note_drawer(this: DiffDrawer, chart: Chart) {
  const diff = chart.diff
  const { lane_width } = this.sizing

  function change_select(n: ChartTypeV2.note) {
    if (NoteClipboard.selected.includes(n)) {
      utils.remove(NoteClipboard.selected, n)
    } else {
      NoteClipboard.selected.push(n)
    }
    shadow.recreate()
  }
  function del_note(n: ChartTypeV2.note) {
    if (pending.hold_fixed) return
    if (NoteClipboard.selected.includes(n)) {
      diff.remove_note_with_undo(...NoteClipboard.selected)
      utils.clear_arr(NoteClipboard.selected)
      return
    }
    if (!diff.remove_note_with_undo(to_note(n))) notify.error('删除note失败。')
  }

  const to_note = chart.diff.to_note
  function _handle(sprite: Sprite, note: ChartTypeV2.note) {
    sprite.on('click', (ev) => {
      if (ev.ctrlKey) {
        change_select(note)
        ev.stopPropagation()
      }
    })
    sprite.on('mousedown', (ev) => {
      console.log("sprite: mousedown")
      if (!ev.ctrlKey && !ev.altKey) pending.pre_drag_start()
      ev.stopPropagation()
    })
    sprite.on('rightclick', () => del_note(note))
    sprite.on('mousemove', () => {
      // show() at pixi-editor.vue
      if (pending.pre_drag) shadow.drawer.remove()
      pending.drag_start(note)
    })
    sprite.on('mouseup', () => {
      pending.pre_drag_end()
    })
    sprite.eventMode = 'static'
  }
  const note_drawer = new DrawerExtension(
    (note: ChartTypeV2.note) => {
      const sprite = NoteDrawer.createNote.apply(this, [note])
      if (!sprite) return null
      _handle(sprite, note)
      return sprite
    },
    { label: 'editor-note', zIndex: 10 }
  )
  const ln_drawer = new DrawerExtension(
    (note: ChartTypeV2.note) => {
      const border = NoteDrawer.createLn.apply(this, [note])
      if (!border) return null
      _handle(border, note)
      border.eventMode = 'static'
      return border
    },
    { label: 'editor-ln', zIndex: 9, cullable: false }
  )
  const shadow = new Shadow(this)
  const pending = new Pending(this, chart)
  const select = new Select(this)

  const listen_handle = () => {
    this.add_on('audio-time-update', () => {
      shadow.update()
    })
    this.add_on('fuck-shown', () => {
      const v = diff.shown
      note_drawer.recreate(...v)
      ln_drawer.recreate(...v)
      shadow.update()
      this.update()
    })
    this.add_on('scale-changed', () => {
      shadow.update_scale()
    })
  }
  const __drawer = this
  function update_pending(e: { offsetX: number; offsetY: number; altKey: boolean }) {
    if (GlobalStat.chart_state.value != 0) return
    if (!chart.audio.paused) return
    const mouse_time = __drawer.event_time(e.offsetY)
    if (!pending.dragging) {
      if (select.selecting) {
        return select.update(e.offsetX, __drawer.mouse_time(e.offsetY))
      }
    }
    if (pending.hold_fixed) {
      pending.len = Math.abs(mouse_time - pending.hold_fixed_time)
      if (mouse_time <= pending.hold_fixed_time) {
        // so the user is 倒着拉条
        pending.time = pending.hold_fixed_time - pending.len
      }
      pending.recreate()
      pending.update_pending()
      return
    }
    // this is initial value referring the % of the mouse
    const max_lane = diff.max_lane.value
    let lane: number = utils.clamp((e.offsetX - 50) / (max_lane * lane_width), 0, 1)
    const width = pending.pending_width
    lane = utils.clamp(Math.floor(lane * (diff.max_lane.value - width + 1)), 0, max_lane - width)

    if (e.altKey) pending.time = mouse_time
    else pending.time = diff.nearest(mouse_time)
    pending.lane = lane
    pending.snm = NoteType.snm

    pending.display = pending.time >= 0
    pending.update_pending()
  }
  function mousein() {
    pending.display = chart.audio.paused
  }
  function mouseout() {
    pending.display = false
  }
  utils.stopWatch(chart.audio.refs.paused, (v) => (pending.display = v))
  utils.stopWatch(NoteType.width, () => {
    pending.recreate()
    pending.update_pending()
    update_pending({ offsetX: pointer_last.x, offsetY: pointer_last.y, altKey: true })
  })

  const event_handle = () => {
    this.app.canvas.addEventListener(
      'mousemove',
      (e) => {
        update_pending(e)

        pointer_last.x = e.offsetX
        pointer_last.y = e.offsetY
      },
      true
    )
    this.app.canvas.addEventListener('mouseenter', mousein)
    this.app.canvas.addEventListener('mouseleave', mouseout)
    this.app.canvas.addEventListener('mousedown', (e) => {
      if (!chart.audio.paused) return
      if (e.button == 2) pending.on_right()
      if (e.button == 0) pending.on_click()
    })
    this.app.canvas.addEventListener('mouseup', (e) => {
      pending.drop()
      shadow.show()
      select.on_mouseup(e.offsetX)
    })
    this.app.canvas.addEventListener('mousedown', (e) => {
      if (!chart.audio.paused) return
      select.on_mousedown(e)
    })
  }
  return {
    note_drawer,
    ln_drawer,
    shadow,
    pending: pending,
    listen_handle,
    event_handle
  }
}
