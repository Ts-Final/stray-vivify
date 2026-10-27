import { Reactive, reactive, ref } from 'vue'
import { ShortCuts } from '@renderer/core/misc/shortcut'
import { utils } from '@renderer/core/utils'
import { Chart_diff } from '@renderer/core/chart/diff'
import { Chart } from '@renderer/core/chart/chart'
import { Storage } from '@renderer/core/storage'
import { Intervals } from '@renderer/core/misc/intervals'

const taps: Reactive<number[]> = reactive([])
function onkeydown() {
  taps.push(Chart.$current.audio.current_time - Storage.settings.tap_delay)
  sectionTap.calc(Chart.$current.diff)
}
class ISectionTap {
  ref = ref(false)
  taps = taps
  /**
   * avg: tapTime - section
   * a,b is fit-line value for estimated $$\hat{y}=ax+b$$
   *
   * Adjustment Advice:
   * diff.push_timing_all(avg)
   *
   * assume: tap at 1020ms, section 1000ms. In this case `avg=20ms`, and it's
   * advised to have `diff.timing[x].time += 20` to fit user's input.
   *
   * a,b is y=ax+b, where y is `delta = tapTime - section`, x is `tapTime`
   */
  result = ref({
    avg: 0,
    a: 0,
    b: 0
  })
  constructor() {}

  get enabled() {
    return this.ref.value
  }
  set enabled(value: boolean) {
    this.ref.value = value
  }

  start() {
    this.enabled = true
    this.reset()
    ShortCuts.stop_listening()
    document.addEventListener('keydown', onkeydown)
    Intervals.wait_resume.then(() => this.stop())
  }

  stop() {
    console.log('stop')
    this.enabled = false
    ShortCuts.resume_listening()
    document.removeEventListener('keydown', onkeydown)
  }

  calc(diff: Chart_diff) {
    const deltas: number[] = []
    // time, delta
    const xy: [number, number][] = []
    for (const tap of taps) {
      const d = tap - utils.nearest(tap, diff.section_list)
      deltas.push(d)
      xy.push([tap - (taps[0] ?? 0), d])
    }
    this.result.value.avg = utils.average(deltas)
    const fitline = utils.fitLine(xy)
    this.result.value.a = fitline.a
    this.result.value.b = fitline.b
  }
  reset() {
    utils.clear_arr(taps)
    utils.memset(this.result.value, 0)
  }
}

export const sectionTap = new ISectionTap()
