import { ChartTypeV2 } from '@preload/chart-types'
import { ref } from 'vue'

export const NoteClipboard = {
  selected: [] as ChartTypeV2.note[],
  clipboard: ref<ChartTypeV2.note[]>([]),
  clipboard_width: 0,
  clear() {
    this.clipboard.value = []
    this.selected = []
    this.clipboard_width = 0
  },
  copy: () => {},
  cut: () => {},
  paste: () => {}
}
