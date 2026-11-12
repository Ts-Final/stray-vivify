<script lang="ts" setup>
import { Chart } from '@renderer/core/chart/chart'
import WordHelper from '@renderer/components/miscellaneous/word-helper.vue'
import { Storage } from '@renderer/core/storage'
import StatLine from '@renderer/components/chart-v2/chart-tabs/small/stat-line.vue'

const chart = Chart.$current
const counts = chart.diff.counts
const sr = chart.diff.sr
</script>
<template>
  <div class="fn-counter">
    <div class="fn-counter-title">统计</div>
    <div class="fn-counter-inner">
      <div>单键</div>
      <div>{{ counts.chip }}</div>
      <div>面</div>
      <div>{{ counts.hold }}</div>
      <div>宽键</div>
      <div>{{ counts.bumper }}</div>
      <div>宽面</div>
      <div>{{ counts.hold_bumper }}</div>
      <div>雷</div>
      <div>{{ counts.bomb }}</div>
      <div>s</div>
      <div>{{ counts.s }}</div>
      <div>总计</div>
      <div>{{ counts.total }}</div>
      <div>平均密度</div>
      <div>{{ counts.avg_density.toFixed(2) }}</div>
      <div>BPM</div>
      <div>{{ counts.min_bpm.toFixed(0) }} ~ {{ counts.max_bpm.toFixed(0) }}</div>
      <div>(Mainly</div>
      <div>{{ counts.main_bpm }})</div>
    </div>

    <div v-if="Storage.settings.song_stats" class="fn-counter-sr">
      <div class="fn-counter-sr-header" @click="chart.diff.update_sr()">
        <word-helper :msg="`Lv. ${(sr.total_v3 / 50).toFixed(2)}`"
                     style="text-wrap: nowrap"
                     dec="开玩笑的，点击刷新" />
      </div>
      <div>CHIP</div>
      <stat-line str="note" />
      <div>TECH</div>
      <stat-line str="tech" />
      <div>STREAM</div>
      <stat-line str="speed" />
      <div>CHORD</div>
      <stat-line str="multi" />
      <div>BURST</div>
      <stat-line str="fill" />
    </div>
  </div>
</template>
<style>
.fn-counter {
  user-select: none;
}
.fn-counter-note-width > div,
.fn-counter-note-width > span,
.fn-counter-note-snb > div,
.fn-counter-note-snb > s {
  text-align: center;
  line-height: 1.5rem;
  height: 1.5rem;
}

.fn-counter-note-width > div {
  cursor: pointer;
  transition: background-color 0.2s;
}

.fn-counter-note-pending > img {
  position: relative;
  max-width: 90%;
}

.fn-counter-title {
  text-align: center;
}

.fn-counter-inner {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr;
  gap: 0 15px;
  text-wrap: nowrap;
}

.fn-counter-inner div:nth-child(2n + 1),
.fn-counter-sr div:nth-child(2n) {
  text-align: right;
}

.fn-counter-inner div:nth-child(2n),
.fn-counter-sr div:nth-child(2n + 1) {
  text-align: left;
}

.fn-counter-sr div:first-child {
  grid-column: 1 / 3;
  text-align: center;
  display: flex;
  justify-content: space-evenly;
}

.fn-counter-sr {
  margin-top: 10px;
  display: grid;
  grid-template-columns: 1fr 3fr;
  gap: 0 15px;
}
</style>
