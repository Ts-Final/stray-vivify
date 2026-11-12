<script lang="ts" setup>
import { Chart } from '@renderer/core/chart/chart'
import { computed, ref } from 'vue'
import { Storage } from '@renderer/core/storage'
import { EventHub } from '@renderer/core/misc/eventhub'

const chart = Chart.$current
const current_time = chart.audio.refs.current_ms

// const bar_offset = (((lane_width - 130) / 130) * 43) / 4
const show_circle = computed(() => {
  return true
})
function time_left(t: number, time: number) {
  return `left: ${(time - t) * Storage.settings.record_field.circle_speed + 50}px;`
}
const shown_t = chart.diff.shown_timing_list
const current_timing = computed(() => chart.diff.timing[chart.diff.current_timing.value])
const current_timing_ix = chart.diff.current_timing
const timing_length = chart.diff.timing.length
const shown_timing = chart.diff.shown_timing

function circle_color(t: number) {
  let str = 'background:'

  if (t <= 2) str += 'gray'
  else if (t % 3 == 0) str += 'orange'
  else if (t % 5 == 0) str += 'red'
  else if (t % 7 == 0) str += 'green'
  else if (t % 9 == 0) str += 'pink'
  else if (t == 4 || t == 8) str += 'blue'
  else if (t == 16) str += 'purple'
  else if (t == 32) str += 'red'
  else if (t % 4 == 0) str += '#2DABFF'
  else str += 'yellow'
  return str + ';'
}
const key = ref('0')
EventHub.use('fuck-shown', () => {
  key.value = Math.random().toString()
  shown_t.ticks = chart.diff.shown_timing_list.ticks
  console.log(shown_t.ticks)
})
</script>

<template>
  <div v-if="show_circle" class="tick-circle-wrapper">
    <div class="tick-circle-left">
      <img alt="" class="tick-circle-icon" src="/yq.jpg" />
      <div class="tick-circle-sv">stray/vivify</div>
      <div class="tick-circle-timing">
        <div>BPM</div>
        <div>{{ current_timing.bpm.toPrecision(5) }}</div>
        <div>#{{ current_timing_ix + 1 }}/{{ timing_length }}</div>
      </div>
    </div>
    <div class="tick-circle-right">
      <div class="tick-circle-line" />
      <div class="tick-circle-divider" />
      <div :key="key" class="tick-circle-ticks">
        <div
          v-for="[tm, tick] in shown_t.ticks"
          :style="time_left(current_time, tm)"
          class="tick-circle-single"
        >
          <div :style="circle_color(tick)" class="tick-circle-dot" />
          <div v-if="tick != 0" class="tick-circle-tick-number">
            {{ tick }}
          </div>
        </div>
        <div
          v-for="t in shown_timing"
          :style="time_left(current_time, t.time)"
          class="tick-circle-timing-line"
        >
          {{ t.bpm }}
        </div>
      </div>
    </div>
  </div>
</template>

<style>
.tick-circle-wrapper {
  position: absolute;
  bottom: 0;
  width: 100%;
  left: 0;
  height: 100px;
  display: flex;
  z-index: var(--z-tick-circle);
  background: #000000;
  border-top: 2px solid white;
}
.tick-circle-left {
  padding-left: 15px;
  padding-right: 15px;
  display: grid;
  grid-template-areas: 'a c ' 'a c ' 'b c';
  background: var(--dark-bgi);
  justify-items: center;
}
.tick-circle-icon {
  width: 50px;
  justify-self: center;
  grid-area: a;
}
.tick-circle-sv {
  grid-area: b;
  color: gray;
  font-size: 12px;
  text-align: center;
}
.tick-circle-timing {
  grid-area: c;
  display: grid;
  padding-top: 5px;
  grid-template-rows: 1fr 1fr 1fr;
  justify-items: center;
  padding-left: 15px;
  max-width: 6rem;
}
.tick-circle-right {
  flex-grow: 1;
  overflow: hidden;
  position: relative;
}
.tick-circle-ticks {
  width: 100%;
  position: relative;
  height: 100%;
}
.tick-circle-line {
  width: 5px;
  height: 100%;
  background: #fff;
  position: absolute;
  left: 50px;
}
.tick-circle-single {
  display: flex;
  position: absolute;
  height: 100%;
  justify-content: center;
}
.tick-circle-dot {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  border: 2px white solid;
  flex-grow: 1;
  position: absolute;
  top: 20px;
}
.tick-circle-tick-number {
  bottom: 2px;
  font-size: 0.9rem;
  position: absolute;
}
.tick-circle-timing-line {
  background: white;
  color: black;
  width: min-content;
  position: absolute;
  transform: translateX(-50%);
  padding: 0 5px;
  border-radius: 5px;
  top: 0;
}
</style>
