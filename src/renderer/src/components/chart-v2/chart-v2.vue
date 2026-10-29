<script lang="ts" setup>
import SongInfo from '@renderer/components/chart-v2/chart-tabs/song-info.vue'
import { Storage } from '@renderer/core/storage'
import ChartTiming from '@renderer/components/chart-v2/chart-tabs/chart-timing.vue'
import Preview from '@renderer/components/chart-v2/preview.vue'
import Playfield from '@renderer/components/chart-v2/playfield.vue'
import { onUnmounted, ref } from 'vue'
import ChartMain from '@renderer/components/chart-v2/chart-tabs/chart-main.vue'
import { EventHub } from '@renderer/core/misc/eventhub'
import { Chart } from '@renderer/core/chart/chart'
import { notify } from '@renderer/core/misc/notify'
import { route } from '@renderer/core/misc/route'

const active = GlobalStat.refs.chart_tab
active.value = 2

const drag_depth = ref(0)
/** dragenter/dragleave 在每个子元素上都会触发一次，用计数器判断是不是真的离开了 */
function on_dragenter(e: DragEvent) {
  if (!e.dataTransfer?.types.includes('Files')) return
  drag_depth.value++
  if (drag_depth.value == 1) notify.normal('松开鼠标以导入嗷')
}

function on_dragleave() {
  drag_depth.value = Math.max(0, drag_depth.value - 1)
}

async function on_drop(e: DragEvent) {
  drag_depth.value = 0
  const files = Array.from(e.dataTransfer?.files ?? [])
  for (const file of files) {
    const fp = window.api.get_path_for_file(file)
    if (!fp) {
      notify.error('没能拿到文件路径（呜呜')
      continue
    }
    await Chart.$current.import_file(fp)
  }
}

function on_keydown(e: KeyboardEvent) {
  if (e.key != 'Tab') return
  if (e.altKey || e.ctrlKey) return
  e.preventDefault()
  active.value += 1
  if (active.value > 3) active.value = 1
}

document.addEventListener('keydown', on_keydown)

onUnmounted(() => {
  document.removeEventListener('keydown', on_keydown)
})

const _meters = [1, 4, 8, 12, 16, 24, 32, 48, 64]
function fuck_wheel(e: WheelEvent) {
  if (e.ctrlKey) {
    Storage.data.value.settings.scale = Number(
      Math.max(
        1,
        Math.min(Storage.settings.scale - 0.001 * e.deltaY, Storage.settings.max_scale)
      ).toFixed(1)
    )
    EventHub.dispatch('scale-changed')
  } else if (e.altKey) {
    const current_meter_left = _meters.findIndex((v) => v >= Storage.settings.meter)
    if (current_meter_left == -1) return
    Storage.data.value.settings.meter =
      _meters[Math.max(current_meter_left - (e.deltaY > 0 ? 1 : -1), 0)] ?? 64
    Chart.current?.diff.update_meter()
    EventHub.dispatch('meter-changed')
  }
}

const chart_state = route.tab
</script>

<template>
  <div
    :data-cs="chart_state"
    class="chart-v2-wrapper"
    @wheel="fuck_wheel"
    @dragenter.prevent="on_dragenter"
    @dragover.prevent
    @dragleave="on_dragleave"
    @drop.prevent="on_drop"
  >
    <song-info v-if="chart_state == 0" />
    <chart-main v-if="chart_state == 1" />
    <chart-timing v-if="chart_state == 2" />

    <preview v-if="chart_state == 3" />
    <playfield v-if="chart_state == 4" />
  </div>
</template>

<style scoped>
.chart-v2-wrapper {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  position: relative;
  contain: inline-size style paint layout;
}
</style>
