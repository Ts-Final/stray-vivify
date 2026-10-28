<script lang="ts" setup>
import { Chart } from '@renderer/core/chart/chart'
import { onMounted, useTemplateRef } from 'vue'
import { DiffDrawer } from '@renderer/core/chart/drawer'
import { Storage } from '@renderer/core/storage'
import { EventHub } from '@renderer/core/misc/eventhub'
import { Chart_diff } from '@renderer/core/chart/diff'
import { route } from '@renderer/core/misc/route'

const {
  lane_width = Storage.settings.lane_width,
  x_expand = 0,
  diff_index = -1
} = defineProps<{
  lane_width?: number
  x_expand?: number
  diff_index?: number
}>()

const chart = Chart.$current
const diff = diff_index == -1 ? chart.diff : Chart_diff.useCreateDiff(chart, diff_index)

const container = useTemplateRef<HTMLDivElement>('pixi-container')
const width = diff.max_lane.value * lane_width + x_expand + 2 * 50
const drawer = new DiffDrawer(diff, { lane_width, total_width: width, x_expand })
onMounted(() => {
  drawer.init({ width: width }).then(() => {
    container.value?.appendChild(drawer.app.canvas)
    diff.force_fuck()
    EventHub.dispatch('audio-time-update')
  })
})
function fuck_wheel(e: WheelEvent) {
  if (route.tab.value != 1) return
  if (e.ctrlKey || e.altKey) return
  chart.audio.pause()
  if (!e.target) return

  chart.scr_time(e.deltaY)
}
defineExpose({ drawer: drawer })
</script>

<template>
  <div
    ref="pixi-container"
    :style="{ width: width + 'px' }"
    class="pixi-container"
    @wheel="fuck_wheel"
  />
</template>

<style>
.pixi-container {
  position: relative;
}
.chart-main .pixi-container canvas {
  position: absolute;
  bottom: 2rem;
}
</style>
