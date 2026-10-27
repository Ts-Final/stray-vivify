import { Ref, ref } from 'vue'
import { charts_data } from '@preload/types'
import { Invoke } from '@renderer/core/ipc'
import { Chart } from '@renderer/core/chart/chart'

export namespace GlobalStat {
  export let all_chart = [] as charts_data
  export const all_chart_ref = ref(all_chart)
  export async function update_all_chart() {
    all_chart = (await Invoke('get-charts-data')).sort((a, b) => b.last_open - a.last_open)
    all_chart_ref.value = all_chart
  }
  export const window_max_state = ref(false)
  export function update_window_max_state() {
    window.electron.ipcRenderer.invoke('window-max-state').then((r) => {
      GlobalStat.window_max_state.value = r
    })
  }
  export const refs = {
    chart_tab: ref(2),
    header_display: ref(''),
    window: {
      height: ref(screen.height),
      width: ref(screen.width)
    }
  }
  // 0 - charting 1 - recording 2 - playing
  export const chart_state = ref(0) as Ref<0 | 1 | 2>

  export async function close_app() {
    const current = Chart.current
    if (current) {
      await current.save()
    }
    window.electron.ipcRenderer.send('window-close')
  }

  export const func_keys = ref({ ctrl: false, alt: false })
  document.addEventListener('mousemove', function (e) {
    func_keys.value.ctrl = e.ctrlKey
    func_keys.value.alt = e.altKey
  })

  export const rem = parseFloat(getComputedStyle(document.documentElement).fontSize)

  export const audioContext = new AudioContext()
}
