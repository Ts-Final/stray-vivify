import { computed, ComputedRef, onUnmounted, Ref, ref, toRaw } from 'vue'
import { Chart, ms } from './chart'
import { utils } from '../utils'
import { Storage } from '@renderer/core/storage'
import { notify } from '@renderer/core/misc/notify'
import { FrameRate } from '@renderer/core/misc/frame-rates'
import { calc_stats } from '@renderer/core/chart/calc-stat'
import { ChartTypeV2 } from '@preload/chart-types'
import { EventHub, StopClass } from '@renderer/core/misc/eventhub'
import { RefreshAll } from '@renderer/core/misc/refresh-all'
import { aiMod } from '@renderer/core/chart/ai-mod'

function parse_type(v: string) {
  switch (v) {
    case 'n':
      return 0
    case 'b':
      return 1
    case 'h':
      return 2
    case 'm':
      return 6
    case 'mb':
      return 7
    case 's':
      return 8
    case 'p':
      return 3
    default:
      throw new Error('Unknown Type.' + v)
  }
}
function is_note(v: ChartTypeV2.note): v is ChartTypeV2.normal_note {
  return 'snm' in v
}
function fix_note(v: ChartTypeV2.note) {
  if ('len' in v) {
    if (v.len == 0) {
      // @ts-expect-error
      delete v.len
      // @ts-expect-error
      v.snm = 0
    }
  } else {
    if (v.width == 1) {
      // fix for note {width1 but S}
      if (v.snm == 2) v.snm = 0
    }
  }
}

/**
 * 二分查找：在按 time 升序排列的 timing 列表中，返回满足 `timing[i].time <= t`
 * 的最大下标；若所有 timing.time 都大于 t，返回 -1。
 * 等价于 `timing.findLastIndex((v) => v.time <= t)`，但复杂度为 O(log n)。
 */
function bsearch_last_le(timing: ChartTypeV2.timing[], t: number): number {
  let lo = 0
  let hi = timing.length - 1
  let ans = -1
  while (lo <= hi) {
    const mid = (lo + hi) >> 1
    if (timing[mid].time <= t) {
      ans = mid
      lo = mid + 1
    } else {
      hi = mid - 1
    }
  }
  return ans
}

export class Chart_diff extends StopClass {
  static all: WeakSet<Chart_diff> = new WeakSet()
  chart: Chart
  counts: Ref<{
    chip: number
    bpm: number
    hold: number
    bomb: number
    hold_bumper: number
    bumper: number
    total: number
    total1: number
    avg_density: number
    s: number
    min_bpm: number
    max_bpm: number
    main_bpm: number
  }>
  diff_index: Ref<number>
  undo: (() => void)[][]
  redo: (() => void)[][]
  shown: ChartTypeV2.note[]
  last_update: number
  // 小节线
  bar_list: ms[]
  // 分音 [t, 等级]
  beat_list: [ms, number][]

  // which is for note之间的X分音
  // 我想做一个和pjsk.moe那种差不多的谱面导出所以加了一个分音的list
  ticks: [ms, number][]
  section_list: ms[]
  shown_timing_list: {
    // 小节
    bar_list: [ms, number][]
    // 分音线
    beat_list: [ms, number][]
    // reagain要的拍号
    section_list: [ms, number][]
    // 右边的xx分音
    ticks: [ms, number][]
  }
  shown_timing: ChartTypeV2.timing[]
  current_timing: ComputedRef<number>
  density_data: Ref<number[]>
  density_path: Ref<string>
  density_updating: boolean = false

  on_operating: boolean
  operating_fns: (() => void)[]

  sr: Ref<ChartTypeV2.SongStats>
  max_lane: Ref<number>
  ai_mod = ref<[number, string][]>([])
  #__density_abort = false

  constructor(chart: Chart, index?: number) {
    super()
    this.chart = chart
    this.diff_index = ref(index ?? 0)
    this.counts = ref({
      chip: 0,
      bpm: 0,
      hold: 0,
      bomb: 0,
      hold_bumper: 0,
      bumper: 0,
      s: 0,
      total: 0,
      total1: 0,
      avg_density: 0,
      min_bpm: 0,
      max_bpm: 0,
      main_bpm: 0
    })
    this.undo = []
    this.redo = []
    this.shown = []
    this.last_update = 0
    this.bar_list = []
    this.beat_list = []
    this.section_list = []
    this.shown_timing_list = {
      bar_list: [],
      beat_list: [],
      ticks: [],
      section_list: []
    }
    this.shown_timing = []
    this.current_timing = computed(
      () => this.timing_of_time(this.chart.audio.refs.current_ms.value).ix
    )
    this.density_data = ref([0])
    this.density_path = ref('')

    this.ticks = []

    this.on_operating = false
    this.operating_fns = []

    this.sr = ref({
      note: 0,
      speed: 0,
      tech: 0,
      fill: 0,
      multi: 0,
      total_v2: 0,
      total_v3: 0,
      sr: 0
    })
    this.max_lane = ref(4)
    this.calc_max_lane()

    if (index == undefined)
      this.watch(this.diff_index, () => {
        this.update_on_diff_index()
      })
    Chart_diff.all.add(this)

    this.add_stop(EventHub.on('audio-time-update', () => this.update()))
  }
  get diff() {
    return this.chart.diffs[this.diff_index.value]
  }

  get notes() {
    return this.diff.notes
  }

  set notes(v: ChartTypeV2.note[]) {
    this.diff.notes = v
    this.update_diff_counts()
  }

  get diff1() {
    return this.diff.meta.diff1
  }

  set diff1(v: string) {
    this.diff.meta.diff1 = v
    this.chart.set_header_name()
    RefreshAll.refresh('diff-choice')
  }

  get diff2() {
    return this.diff.meta.diff2
  }

  set diff2(v: string) {
    this.diff.meta.diff2 = v
    this.chart.set_header_name()
    RefreshAll.refresh('diff-choice')
  }
  get rating() {
    return this.diff.meta.rating
  }
  set rating(v) {
    this.diff.meta.rating = v
  }
  get rating_string() {
    return this.rating.toString()
  }
  set rating_string(v: string) {
    this.rating = parseFloat(v)
  }

  get charter() {
    return this.diff.meta.charter
  }

  set charter(v: string) {
    this.diff.meta.charter = v
  }

  get timing() {
    return this.diff.timing
  }

  set timing(v: ChartTypeV2.timing[]) {
    this.diff.timing = v.toSorted((a, b) => a.time - b.time)
  }

  get visible(): [number, number] {
    return [
      this.chart.audio.current_time - Storage.settings.pooling.ahead,
      this.chart.audio.current_time +
        Storage.computes.visible.value +
        Storage.settings.pooling.ahead
    ]
  }

  get toRaw() {
    return toRaw(this.notes)
  }

  get current_density() {
    return this.shown.filter((n) => {
      if (n['snm'] == 1) return false
      return 'len' in n
        ? n.time + n.len > this.chart.audio.current_time && n.time < this.chart.audio.current_time
        : Math.abs(this.chart.audio.current_time - n.time) < 500
    }).length
  }

  get get_note() {
    const x = this
    return function (ix: number): ChartTypeV2.note {
      return x.notes[ix]
    }
  }

  get to_note() {
    const x = this
    return function (v: number | ChartTypeV2.note) {
      if (typeof v == 'number') return x.notes[v]
      else return v
    }
  }

  static createDiff(): ChartTypeV2.diff {
    return {
      notes: [],
      timing: [{ time: 0, bpm: 120, num: 4, den: 4 }],
      meta: {
        diff_name: '',
        diff1: ['Finale', 'Encore', 'Backstage', 'Terminal'][Math.floor(Math.random() * 4)],
        diff2: Math.floor(Math.random() * 20) + '+',
        charter: Storage.data.value.username ?? '???',
        rating: 1.31
      }
    }
  }

  static validate_notes(notes: ChartTypeV2.note[]) {
    return notes.map((x) => {
      if (x.width == 1 && is_note(x))
        return {
          lane: Math.max(x.lane, 0),
          time: x.time,
          width: 1,
          snm: x.snm == 2 ? 0 : x.snm
        }
      if (!is_note(x)) {
        if (x.len == 0) {
          return {
            lane: x.lane,
            time: x.time,
            width: x.width,
            snm: 0
          }
        }
      }
      return x
    })
  }

  static validate_timing(timing: ChartTypeV2.timing[]) {
    return timing
      .map((x) => {
        if (x.bpm <= 0) return { ...x, bpm: 120 }
        return x
      })
      .sort((a, b) => a.time - b.time)
  }

  static to_vsc(diff: ChartTypeV2.diff) {
    const strs: string[] = []
    const parsed_notes = diff.notes.map((note) => {
      if ('len' in note) {
        return {
          time: note.time,
          lane: note.lane,
          len: note.len,
          n: 'h'
        }
      } else {
        // then its a note
        if (note.snm == 1) {
          if (note.width == 1) return { time: note.time, lane: note.lane, n: 'm' }
          return { time: note.time, lane: note.lane, n: 'mb' }
        } else if (note.snm == 2) {
          return { time: note.time, lane: note.lane, n: 's' }
        } else {
          if (note.width == 1) return { time: note.time, lane: note.lane, n: 'n' }
          else return { time: note.time, lane: note.lane, n: 'b' }
        }
      }
    })
    const all_the_notes = [
      parsed_notes,
      diff.timing.map((x) => {
        return { time: x.time, bpm: x.bpm, n: 'p', lane: 0 }
      })
    ]
      .flat()
      .toSorted((a, b) => a.time - b.time)
    for (const note of all_the_notes) {
      let str = note.time.toFixed(2)
      str += ',' + parse_type(note.n)
      str += ',' + note.lane
      if ('len' in note) {
        str += ','
        // @ts-expect-error why there's fucking me at *note.len* is number|undef
        str += (note.len + note.time).toFixed(2)
      } else if ('bpm' in note) {
        str += ','
        str += `b:${note.bpm}|t:${note.time.toFixed(2)}|v:undefined|s:undefined`
      }
      strs.push(str)
    }
    return strs
  }

  static useCreateDiff(ch: Chart, index: number) {
    const diff = new Chart_diff(ch, index)
    onUnmounted(() => {
      diff.stop()
    })
    return diff
  }

  static calc_max_lane(diff: ChartTypeV2.diff) {
    if (diff?.override?.max_lane) {
      return diff.override.max_lane
    }
    let max = Storage.settings.min_lane
    const n = diff.notes
    for (let i = 0; i < n.length; i++) {
      max = Math.max(n[i].lane + n[i].width, max)
    }
    return max
  }

  update_meter() {
    console.log(Storage.settings.meter)
    this.update_beat_line_list()
    this.update_t(this.visible)
  }

  update_on_diff_index() {
    console.log('update_on_diff_index')
    this.chart.set_header_name()
    this.calc_density()
    this.update_density_path(true)
    this.update_timing_list()
    this.sort_notes()
    this.calc_max_lane()
    this.update_sr()
    RefreshAll.refresh('svg-lane')
    utils.nextFrame().then(() => this.force_fuck())
  }

  async update_density_path(force = false) {
    if (!force && this.density_updating) return
    if (force && this.density_updating) {
      this.#__density_abort = true
      await new Promise<void>((resolve) => {
        const check = () => {
          if (!this.density_updating) {
            resolve()
          } else {
            utils.nextFrame().then(check)
          }
        }
        check()
      })
      this.#__density_abort = false
    }
    const path = this.density_path
    const data = this.density_data
    path.value = 'M 20 240'
    const max = utils.reduce_max(toRaw(data.value))
    if (data.value.findIndex((v) => v > 0) == -1) return
    const dx = 300 / data.value.length
    const dt = 1500 / data.value.length

    this.density_updating = true
    const d = utils.deepCopy(toRaw(data.value))
    for (let i = 0; i < d.length; i++) {
      if (this.#__density_abort) {
        this.#__density_abort = false
        this.density_updating = false
        return
      }
      const y = 240 - Math.floor((d[i] / max) * 230)
      path.value += `L ${(dx * i + 20).toFixed(3)} ${y}`
      await new Promise((r) => setTimeout(r, dt))
    }
    this.density_updating = false
  }

  calc_max_lane() {
    this.max_lane.value = Chart_diff.calc_max_lane(this.diff)
  }

  /* 小节线，拍号线 */
  update_bar_section_list() {
    this.bar_list = []
    this.section_list = []
    const tolerance = Storage.settings.beat_tolerance
    const v = this.timing
    for (let i = 0; i < v.length; i++) {
      const part = v[i]
      const time_per_bar = (60 / part.bpm) * part.num * 1000
      const time_per_section = (60 / part.bpm) * part.den * 250
      const part_end = this.timing_end_time(part, v, this.chart.audio.length)
      for (let time = part.time; time < part_end - tolerance; time += time_per_bar) {
        this.bar_list.push(time)
      }
      for (let time1 = part.time; time1 < part_end - tolerance; time1 += time_per_section) {
        this.section_list.push(time1)
      }
    }
  }

  /* 分音线 */
  update_beat_line_list() {
    this.beat_list = []
    const v = this.timing
    const den = Storage.settings.meter

    // Available snap divisors that are <= den, in order (coarsest to finest)
    const mod = [1, 4, 8, 16, 32, 48, 64].filter((snap) => snap <= den)

    function to_level(beat_index: number) {
      // Find the coarsest snap divisor that this beat falls on
      for (let i = 0; i < mod.length; i++) {
        const snap = mod[i]
        if (beat_index % (den / snap) === 0) {
          return i + 1
        }
      }
      return mod.length + 1 // Fallback
    }

    for (let i = 0; i < v.length; i++) {
      const timing = v[i]
      const end = this.timing_end_time(timing, v, this.chart.audio.length)

      const time_per_beat = (240 / (timing.bpm * den)) * 1000
      let beat_index = 0

      for (let time = timing.time; time < end; time += time_per_beat) {
        this.beat_list.push([time, to_level(beat_index)])
        beat_index++
      }
    }
  }

  /**
   * Update bar/beat/ticks
   * should be called when diff.timing changed
   */
  update_timing_list() {
    this.update_bar_section_list()
    this.update_beat_line_list()
    this.update_tick_list()
  }

  sort_notes() {
    this.notes = this.toRaw.toSorted(utils.sort_notes)
  }

  timing_end_time(t: ChartTypeV2.timing, timing: ChartTypeV2.timing[], max = Infinity) {
    const idx = timing.findIndex((v) => t.time == v.time)
    if (idx === -1) throw new Error()
    else if (idx == timing.length - 1) return max
    else return timing[idx + 1].time
  }

  timing_end(t: ChartTypeV2.timing) {
    return this.timing_end_time(t, this.timing, this.chart.audio.length)
  }

  update_diff_counts() {
    const v = this.diff
    const count = {
      chip: 0,
      bumper: 0,
      hold: 0,
      hold_bumper: 0,
      bomb: 0,
      s: 0
    }
    for (const note of v.notes) {
      if ('len' in note) {
        if (note.width == 1) count.hold += 1
        else count.hold_bumper += 1
      } else {
        if (note.snm == 1) {
          count.bomb += 1
          continue
        } else if (note.snm == 2) {
          count.s += 1
          count.bumper += 1
          continue
        }
        if (note.width == 1) count.chip += 1
        else count.bumper += 1
      }
    }
    this.counts.value.chip = count.chip
    this.counts.value.bumper = count.bumper
    this.counts.value.hold = count.hold
    this.counts.value.hold_bumper = count.hold_bumper
    this.counts.value.bomb = count.bomb
    this.counts.value.s = count.s
    this.counts.value.bpm = this.timing.length - 1
    this.counts.value.total = v.notes.length + count.hold
    this.counts.value.total1 = v.notes.length

    this.counts.value.avg_density = this.counts.value.total / (this.chart.audio.length / 1000)

    const bpms = this.timing.map((v) => v.bpm)
    this.counts.value.min_bpm = Math.min(...bpms)
    this.counts.value.max_bpm = Math.max(...bpms)

    const bpm_length = this.timing.map(
      (v) => [this.timing_end_time(v, this.timing, this.chart.audio.length), v] as const
    )
    const max_length = Math.max(...bpm_length.map((v) => v[0]))
    const max_timing = bpm_length.find((v) => v[0] == max_length)
    this.counts.value.main_bpm = max_timing?.[1].bpm ?? 0
  }

  set_diff(v: ChartTypeV2.diff) {
    utils.less_assign(this, v as Partial<Chart_diff>)
    this.calc_max_lane()
  }

  add_note_with_undo(v: ChartTypeV2.note) {
    const r = this.add_note(v)
    if (r)
      this.push_undo(() => {
        this.undo_add(v)
      })
    return r
  }

  add_notes_with_undo(v: ChartTypeV2.note[]) {
    const r: boolean[] = []
    const undo: (() => void)[] = []
    for (let i = 0; i < v.length; i++) {
      r.push(this.add_note(v[i]))
      undo.push(() => {
        this.undo_add(v[i])
      })
    }
    this.push_undo(() => {
      undo.forEach((v) => v())
    })
    this.force_fuck()
    return r.every((v) => v)
  }

  remove_note_with_undo(...v: ChartTypeV2.note[] | number[]) {
    const undo: (() => void)[] = []
    const r: boolean[] = []
    const notes: ChartTypeV2.note[] = []
    v.forEach((ele: ChartTypeV2.note | number) => {
      if (typeof ele == 'number') {
        notes.push(this.notes[ele])
      } else {
        notes.push(ele)
      }
    })
    for (const ele of notes) {
      r.push(this.remove_note(ele))
      undo.push(() => {
        this.undo_add(ele)
      })
    }
    this.push_undo(() => {
      undo.forEach((v) => v())
    })
    this.fuck_shown(this.chart.audio.current_time, true)
    return r.every((a) => a)
  }

  undo_add(v: ChartTypeV2.note) {
    this.remove_note(v)
    this.push_redo(() => {
      this.redo_add(v)
    })
  }

  undo_remove(v: ChartTypeV2.note) {
    this.add_note(v)
    this.push_redo(() => {
      this.redo_remove(v)
    })
  }

  redo_add(v: ChartTypeV2.note) {
    this.add_note_with_undo(v)
  }

  redo_remove(v: ChartTypeV2.note) {
    this.remove_note_with_undo(v)
  }

  // find the nearest beat-line
  // round - whether to round up/down (which could be later)
  //   or only floor down (only find early pos)
  nearest(t: ms, round = true): ms {
    const bpm = this.bpm_of_time(t)
    if (!bpm) throw new Error('No bpm found???')
    const passed = t - bpm.time
    const per_beat = (240 / (bpm.bpm * Storage.settings.meter)) * 1000
    if (round) return Math.round(Math.round(passed / per_beat) * per_beat + bpm.time)
    else return Math.round(Math.floor(passed / per_beat) * per_beat + bpm.time)
  }

  /**
   * @returns t if |nearest - t| less than threshold, and the-nearest if gt threshold
   * */
  nearest_threshold(t: ms, threshold: ms) {
    const nearest = this.nearest(t)
    if (Math.abs(t - nearest) <= threshold) return nearest
    else return t
  }

  bpm_of_time(time: ms) {
    if (time <= 0) time = 0
    const ix = bsearch_last_le(this.timing, time)
    return ix >= 0 ? this.timing[ix] : this.timing[0]
  }
  timing_of_time(time: ms) {
    if (time <= 0) time = 0
    const ix = Math.max(bsearch_last_le(this.timing, time), 0)
    return {
      timing: this.timing[ix],
      ix: ix
    }
  }

  push_undo(fn: () => void) {
    if (this.on_operating) this.operating_fns.push(fn)
    else this.undo.push([fn])
    while (this.undo.length >= 20) this.undo.shift()
  }

  execute_undo() {
    const fns = this.undo.pop()
    if (fns) {
      fns.forEach((fn) => fn())
    }
  }

  push_redo(fn: () => void) {
    if (this.on_operating) this.operating_fns.push(fn)
    else this.redo.push([fn])
    while (this.redo.length >= 20) this.redo.shift()
  }

  execute_redo() {
    const fns = this.redo.pop()
    if (fns) fns.forEach((fn) => fn())
  }

  fuck_shown(t: number, force = false) {
    if (force ? false : Math.abs(t - this.last_update) < Storage.settings.pooling.interval) return
    FrameRate.fuck_shown.start()
    const visible = [
      t - Storage.settings.pooling.ahead,
      t + Storage.computes.visible.value + Storage.settings.pooling.ahead
    ] as [number, number]
    this.shown = this.notes.filter((n) => {
      return this.isVisible(n, visible)
    })
    this.last_update = t
    FrameRate.fuck_shown.end()
    this.update_t(this.visible)
    EventHub.dispatch('fuck-shown')
  }

  update_t(visible: [number, number]) {
    const is_circle = Storage.settings.record_field.show_circles
    this.shown_timing_list = {
      bar_list: this.bar_list
        .map((x, ix) => [x, ix] as [number, number])
        .filter((x) => utils.between(x[0], visible)),
      beat_list: this.beat_list.filter((x) => utils.between(x[0], visible)),
      ticks: this.ticks.filter((x) =>
        utils.between(x[0], is_circle ? [visible[0], visible[1] + 3000] : visible)
      ),
      section_list: this.section_list
        .map((x, dx) => [x, dx] as [number, number])
        .filter((x) => utils.between(x[0], visible))
    }
    this.shown_timing = this.timing.filter((x) => utils.between(x.time, visible))
  }

  isVisible(n: ChartTypeV2.note, visible: [number, number]): boolean {
    if (utils.between(n.time, visible)) return true
    if ('len' in n) {
      return n.time < visible[0] && n.time + n.len > visible[0]
    }
    return false
  }

  add_timing(timing: ChartTypeV2.timing) {
    let same = this.timing.findIndex((tp) => Math.abs(tp.time - timing.time) < 50)
    if (same != -1) {
      notify.error('已有相同时间点的timing。')
      return same
    }
    this.timing.push(timing)
    this.timing.sort((a, b) => a.time - b.time)
    return -1
  }

  validate_chart() {
    this.notes = Chart_diff.validate_notes(this.notes)
    if (this.timing.some((x) => x.bpm <= 0)) this.timing = Chart_diff.validate_timing(this.timing)
  }

  calc_density() {
    FrameRate.calc_density.start()
    const max_count = Storage.settings.density_data_count
    const per_length = this.chart.audio.length / max_count
    const d: number[] = Array(max_count).fill(0)
    const notes = toRaw(this.notes)
    for (let i = 0; i < notes.length; i++) {
      d[Math.floor(notes[i].time / per_length)] += 1
    }
    for (let i = 0; i < d.length; i++) {
      d[i] = (d[i] / per_length) * 1000
    }
    this.density_data.value = d.slice(0, max_count)
    console.log(this.density_data.value)
    FrameRate.calc_density.end()
  }

  update() {
    this.fuck_shown(this.chart.audio.current_time)
  }

  sort_timing() {
    this.timing.sort((a, b) => a.time - b.time)
  }

  push_timing(idx: number, delta: number) {
    const end = this.timing_end(this.timing[idx])
    for (let i = 0; i < this.notes.length; i++) {
      if (utils.between(this.notes[i].time, [this.timing[idx].time, end])) {
        this.notes[i].time += delta
      }
    }
    this.timing[idx].time += delta
  }

  push_timing_all(idx: number, delta: number) {
    for (let i = 0; i < this.notes.length; i++) {
      if (this.notes[i].time > this.timing[idx].time) {
        this.notes[i].time += delta
      }
    }
    for (let i = 0; i < this.timing.length; i++) {
      if (this.timing[i].time > this.timing[idx].time) {
        this.timing[i].time += delta
      }
    }
    this.timing[idx].time += delta
    this.update_bar_section_list()
    this.update_beat_line_list()
  }

  update_sr() {
    if (!Storage.settings.song_stats) return
    this.sr.value = calc_stats(this.diff, this.chart.audio.length)
  }

  get_beat_string(time: number) {
    const { beat_at, den } = this.get_beat_info(time)
    let str = ''
    if (Storage.settings.bar_from_0) str = `${beat_at.toFixed(2)}`
    else str = `${(beat_at + 1).toFixed(2)}`
    if (den != 4) str += `/${den}`
    return str
  }

  get_beat_info(time: number) {
    const t = this.timing[0].time
    time = Math.max(t, time)

    // 2. 获取该小节的 timing 信息（使用小节起始时刻）
    const { bpm, den } = this.bpm_of_time(time)

    // the time of last bar
    const last_bar = Math.max(
      0,
      this.section_list.findLastIndex((x) => x <= time)
    )

    const quarterNoteMs = 60_000 / bpm
    const beatMs = quarterNoteMs * (4 / den) // 一拍（den 分音符）的毫秒数

    const offsetMs = Math.abs(time - this.section_list[last_bar])
    const beatOffset = offsetMs / beatMs

    return {
      beat_at: beatOffset + last_bar,
      den: den
    }
  }

  beat_to_time(beat: number) {
    return this.section_list[beat] ?? 0
  }

  update_tick_list() {
    this.ticks = []
    const v = this.timing
    const all_times = [...new Set(this.notes.map((v) => v.time))]
    for (let i = 0; i < v.length; i++) {
      const part = v[i]
      // ms
      const time_per_4 = 60000 / part.bpm
      const part_end = this.timing_end_time(part, v)
      const part_index_start = all_times.findIndex((v) => v >= part.time)
      const part_index_end = all_times.findIndex((v) => v >= part_end) - 1
      const part_times =
        i == 0
          ? all_times.slice(0, part_index_end)
          : all_times.slice(part_index_start, part_index_end)

      // here got a len-1 'cause i want to make the last independently fucked
      for (let j = 0; j < part_times.length - 1; j++) {
        let tick = 24e4 / (part_times[j + 1] - part_times[j]) / part.bpm
        if (tick > 128) continue
        // if it's a tick longer than 3' then fuck it away i dont need fuck you fuck you
        if (tick < 3) tick = 0
        this.ticks.push([part_times[j], Math.round(tick)])
      }
      const tick = (time_per_4 / (part_end - part_times[part_times.length - 1])) * 4
      if (tick > 2 && tick < 256)
        this.ticks.push([part_times[part_times.length - 1], Math.round(tick)])
    }
  }

  get_beat_length(time: number, len: number) {
    const bpm = this.bpm_of_time(time)
    return len / (60000 / bpm.bpm)
  }

  force_fuck() {
    this.fuck_shown(this.chart.audio.current_time, true)
  }

  check_aimod() {
    this.ai_mod.value = aiMod(this.diff)
  }

  /** @returns if the note is successfully removed */
  private remove_note(v: ChartTypeV2.note) {
    const index = this.findNote(v)
    if (index == -1) {
      console.log('unexist', v)
      return false
    }
    this.notes.splice(index, 1)
    return true
  }

  /**
   * Adding a note to the diff.
   * @param note note literally
   * @returns if the note is successfully added
   */
  private add_note(note: ChartTypeV2.note): boolean {
    note.time = Math.floor(note.time)
    if (this.notes.find((x) => utils.is_equal(x, note))) return false

    fix_note(note)

    const nearest = this.shown.find((x) => Math.abs(x.time - note.time) <= Storage.settings.nearest)
    if (nearest) {
      note.time = nearest.time
    }

    const pos = this.binarySearchTimePosition(note.time)
    this.notes.splice(pos, 0, note)
    return true
  }

  /**
   * 使用二分查找确定 note 应该插入的位置
   * @param time note的时间
   * @returns 插入索引
   */
  private binarySearchTimePosition(time: number): number {
    let start = 0
    let end = this.notes.length - 1

    while (start <= end) {
      const mid = Math.floor((start + end) / 2)
      if (this.notes[mid].time === time) {
        return mid
      } else if (this.notes[mid].time < time) {
        start = mid + 1
      } else {
        end = mid - 1
      }
    }

    return start
  }

  private findNote(n: ChartTypeV2.note): number {
    return this.notes.findIndex((x) => utils.is_equal(n, x))
  }
}
