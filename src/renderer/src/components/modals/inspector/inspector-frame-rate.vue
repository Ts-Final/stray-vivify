<script lang="ts" setup>
import { FrameRate } from '@renderer/core/misc/frame-rates'
import FrameRateSingle from '@renderer/components/modals/frame-rate-single.vue'
import WordHelper from '@renderer/components/miscellaneous/word-helper.vue'
import { Storage } from '@renderer/core/storage'
import { utils } from '@renderer/core/utils'
import { MemoryUsage } from '@renderer/core/misc/inspector'
import { onMounted, onUnmounted } from 'vue'
import { Intervals } from '@renderer/core/misc/intervals'
import { route } from '@renderer/core/misc/route'

const _fps_r = FrameRate.fps.refs
const frontend = MemoryUsage.frontend
const backend = MemoryUsage.backend
const chart_tab = route.tab

function parse_size(size: number) {
  if (size < 1024) return `${size}B`
  else if (size < 1024 * 1024) return `${(size / 1024).toFixed(2)}KB`
  else return `${(size / 1024 / 1024).toFixed(2)}MB`
}
function update_memory() {
  MemoryUsage.update()
}
onMounted(() => {
  Intervals.on(1000, update_memory)
})
onUnmounted(() => Intervals.off(1000, update_memory))
</script>

<template>
  <div class="fr-wrapper">
    <div class="fr-header">Frame Rate</div>
    <table class="fr-table">
      <tbody>
        <tr>
          <th style="width: max-content">函数</th>
          <th>Min/Max</th>
          <th>avg.</th>
          <th>SD</th>
          <th>CV</th>
          <th>call_count</th>
        </tr>
        <tr>
          <td>FPS</td>
          <td>{{ _fps_r.min }}/{{ _fps_r.max }}</td>
          <td>{{ _fps_r.avg.toFixed(2) }}</td>
          <td>{{ _fps_r.sd.toFixed(2) }}</td>
          <td>{{ _fps_r.cv.toFixed(2) }}</td>
          <td>-</td>
        </tr>
        <frame-rate-single :r="FrameRate.aniFrame" msg="帧逻辑" />
        <frame-rate-single :r="FrameRate.invalidator" msg="Inspector" />
        <frame-rate-single :r="FrameRate.next_tick" msg="渲染" />
        <frame-rate-single :r="FrameRate.fuck_shown" msg="Fuck Shown" />
        <frame-rate-single v-if="chart_tab == 4" :r="FrameRate.playfield_frame" msg="Play Frame" />
        <frame-rate-single :r="FrameRate.update_pending" msg="Pending-note" />
        <frame-rate-single :r="FrameRate.calc_density" msg="calc-density" />
        <frame-rate-single :r="FrameRate.save" msg="save" />
        <frame-rate-single
          v-if="Storage.settings.song_stats"
          :r="FrameRate.calc_sr"
          msg="Star Rating"
        />
        <frame-rate-single :r="FrameRate.create_note_object" msg="Note Object" />
        <frame-rate-single :r="FrameRate.note_bottom" msg="time bottom" />
        <frame-rate-single :r="FrameRate.note_style" msg="note style" />
      </tbody>
    </table>

    <div class="fr-header">Memory Usage</div>
    <div class="memory-wrapper">
      <div>
        <span>Vue</span>
        <div>可用</div>
        <div>{{ parse_size(frontend.jsHeapSizeLimit) }}</div>
        <div>已分配</div>
        <div>{{ parse_size(frontend.totalJSHeapSize) }}</div>
        <div>活跃</div>
        <div>{{ parse_size(frontend.usedJSHeapSize) }}</div>
      </div>
      <div>
        <span>Node</span>
        <div><word-helper dec="常驻集" msg="rss" /></div>
        <div>{{ parse_size(backend.rss) }}</div>
        <div>可用</div>
        <div>{{ parse_size(backend.heapTotal) }}</div>
        <div>活跃内存</div>
        <div>{{ parse_size(backend.heapUsed) }}</div>
        <div>external</div>
        <div>{{ parse_size(backend.external) }}</div>
        <div>缓冲区</div>
        <div>{{ parse_size(backend.arrayBuffers) }}</div>
      </div>
    </div>

    <div class="fr-header">Update Rate</div>
    <table class="fr-table">
      <tbody>
        <tr>
          <th>Key</th>
          <th>Min/Max</th>
          <th>avg.</th>
          <th>SD</th>
          <th>CV</th>
        </tr>
        <tr v-for="key in utils.keyof(FrameRate.Updates)" :key="key">
          <td>{{ key }}</td>
          <td>
            {{ FrameRate.Updates[key].refs.value.min.toFixed(1) }}/{{
              FrameRate.Updates[key].refs.value.max.toFixed(1)
            }}
          </td>
          <td>{{ FrameRate.Updates[key].refs.value.avg.toFixed(2) }}</td>
          <td>{{ FrameRate.Updates[key].refs.value.sd.toFixed(2) }}</td>
          <td>{{ FrameRate.Updates[key].refs.value.cv.toFixed(2) }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.fr-wrapper {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  overflow: auto;
  user-select: none;
}
.fr-header {
  width: 100%;
  text-align: center;
  line-height: 3rem;
  font-size: 1.5rem;
  font-weight: bold;
}
.fr-table {
  width: 90%;
  margin-left: 5%;
  text-align: center;
  border-collapse: collapse;
  table-layout: fixed;
}
td {
  border: 1px solid white;
}
.fr-table tr:first-child {
  line-height: 1.4rem;
}
.memory-wrapper {
  display: grid;
  grid-template-columns: 1fr 1fr;
  user-select: none;
}
.memory-wrapper > div {
  display: grid;
  grid-template-columns: 1fr 1fr;
}
.memory-wrapper > div > span {
  width: 100%;
  grid-column: 2;
}
.memory-wrapper > div > div {
  padding: 0 5px;
}
.memory-wrapper > div > div:nth-child(2n) {
  text-align: right;
}
</style>
