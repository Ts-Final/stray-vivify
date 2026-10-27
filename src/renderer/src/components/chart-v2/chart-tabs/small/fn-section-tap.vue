<script setup lang="ts">
import { Chart } from '@renderer/core/chart/chart'
import AButton2 from '@renderer/components/a-elements/a-button2.vue'
import { onUnmounted, ref } from 'vue'
import { sectionTap } from '@renderer/core/misc/section-tap'
import { utils } from '@renderer/core/utils'
import { notify } from '@renderer/core/misc/notify'

const chart = Chart.$current
const current_timing_ix = chart.diff.current_timing
const go_tap = ref(false)
const isST = sectionTap.ref
const result = sectionTap.result

function tap() {
  chart.audio.set_and_play()
  go_tap.value = true
  sectionTap.start()
}
function nearest_tap() {
  chart.audio.set_current_time(chart.diff.nearest(chart.audio.current_time, false))
  tap()
}

function start_tap() {
  chart.audio.set_current_time(chart.diff.timing[current_timing_ix.value].time)
  tap()
}

function reset() {
  sectionTap.reset()
}

function end_tap() {
  chart.audio.pause()
  sectionTap.stop()
}
function close_tap() {
  go_tap.value = false
  end_tap()
}
function apply_delay() {
  if (Math.abs(result.value.a) > 1e-3 || !result.value.a)
    return notify.error('数据稳定性不足！')
  chart.diff.push_timing_all(0, result.value.avg)
  notify.success('已应用延迟调整。')
}
onUnmounted(() => end_tap())
</script>

<template>
  <div class="fn-sectiontap">
    <div class="st-title">Timing #{{ current_timing_ix }}</div>
    <div class="st-body" :class="utils.or(go_tap, 'st-col')">
      <div class="st-timing">
        <div class="st-timing-info">
          <div>BPM</div>
          <div class="st-bpm">{{ chart.diff.timing[current_timing_ix].bpm.toFixed(2) }}</div>
          <div>
            {{
              chart.diff.timing[current_timing_ix].num +
              '/' +
              chart.diff.timing[current_timing_ix].den
            }}
          </div>
        </div>
        <div class="st-timing-btns">
          <a-button2 msg="Tap" @click="nearest_tap()" />
          <a-button2 msg="从开头Tap" @click="start_tap()" />
          <template v-if="!go_tap">
            <a-button2 v-if="!isST" msg="打开节拍器！" @click="isST = true" />
            <a-button2 v-else msg="关掉节拍器" @click="isST = false" />
          </template>
        </div>
      </div>
      <div class="st-tap" v-if="go_tap">
        <strong class="rainbow-text-flow" v-if="isST">正在Tap!</strong>
        <div>
          Avg. Delta:
          <strong>{{ result.avg.toFixed(2) }}</strong>
          ms
        </div>
        <div :class="utils.or(Math.abs(result.a) < 1e-3 && !!result.a, 'rainbow-text-color')">
          â: {{ result.a.toExponential(3) }}
        </div>
        <div class="st-stop">
          <a-button2 msg="清空数据" @click="reset()" />
          <a-button2 msg="stop" @click="end_tap()" />
          <a-button2 v-if="!isST" msg="应用延迟" @click="apply_delay()" />
          <a-button2 msg="关闭" @click="close_tap()" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.fn-sectiontap {
  display: flex;
  flex-direction: column;
  justify-content: center;
  text-align: center;
}
.st-body {
  display: grid;
  grid-template-columns: 1fr;
}
.st-body.st-col {
  grid-template-columns: min-content 1fr;
}
.st-bpm {
  font-size: 2rem;
  font-weight: bold;
}
.st-timing-info {
  display: flex;
  flex-direction: row;
  gap: 10px;
  word-break: keep-all;
  justify-content: space-evenly;
  align-items: center;
}
.st-col .st-timing {
  padding: 0 5px;
  box-sizing: border-box;
}
.st-col .st-timing-info {
  flex-direction: column;
  gap: 5px;
}
.st-timing-btns {
  display: flex;
  flex-direction: row;
  gap: 10px;
  justify-content: space-evenly;
  align-items: center;
}
.st-tap {
  border-left: gray 1px solid;
  padding-left: 15px;
  box-sizing: border-box;
  margin-left: 5px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.st-stop {
  display: flex;
  gap: 10px;
}
</style>
