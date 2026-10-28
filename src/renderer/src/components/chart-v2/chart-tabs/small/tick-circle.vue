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
  <div v-if="show_circle" class="pf-circles">
    <div class="circles-left">
      <img alt="" class="ticks-icon" src="/yq.jpg" />
      <div class="circles-sv">stray/vivify</div>
      <div class="circles-timing">
        <div>BPM</div>
        <div>{{ current_timing.bpm.toPrecision(5) }}</div>
        <div>#{{ current_timing_ix + 1 }}/{{ timing_length }}</div>
      </div>
    </div>
    <div class="circles-right">
      <div class="circles-line" />
      <div class="circles-divider" />
      <div :key="key" class="circles-tick">
        <div
          v-for="[tm, tick] in shown_t.ticks"
          :style="time_left(current_time, tm)"
          class="circles-single"
        >
          <div :style="circle_color(tick)" class="circle" />
          <div v-if="tick != 0" class="circle-tick">
            {{ tick }}
          </div>
        </div>
        <div
          v-for="t in shown_timing"
          :style="time_left(current_time, t.time)"
          class="circle-timing-line"
        >
          {{ t.bpm }}
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.pf-circles {
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
.circles-left {
  padding-left: 15px;
  padding-right: 15px;
  display: grid;
  grid-template-areas: 'a c ' 'a c ' 'b c';
  background: var(--dark-bgi);
  justify-items: center;
}
.ticks-icon {
  width: 50px;
  justify-self: center;
  grid-area: a;
}
.circles-sv {
  grid-area: b;
  color: gray;
  font-size: 12px;
  text-align: center;
}
.circles-timing {
  grid-area: c;
  display: grid;
  padding-top: 5px;
  grid-template-rows: 1fr 1fr 1fr;
  justify-items: center;
  padding-left: 15px;
  max-width: 6rem;
}
.circles-right {
  flex-grow: 1;
  overflow: hidden;
  position: relative;
}
.circles-tick {
  width: 100%;
  position: relative;
  height: 100%;
}
.circles-line {
  width: 5px;
  height: 100%;
  background: #fff;
  position: absolute;
  left: 50px;
}
.circles-single {
  display: flex;
  position: absolute;
  height: 100%;
  justify-content: center;
}
.circle {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  border: 2px white solid;
  flex-grow: 1;
  position: absolute;
  top: 20px;
}
.circle-tick {
  bottom: 2px;
  font-size: 0.9rem;
  position: absolute;
}
.circle-timing-line {
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
