<script setup lang="ts">
import SimpleModal from '@renderer/components/modals/simple-modal.vue'
import { ShortCuts } from '@renderer/core/misc/shortcut'
import { computed, onUnmounted, reactive, ref } from 'vue'
import AButton from '@renderer/components/a-elements/a-button.vue'
import { utils } from '@renderer/core/utils'

const tap_time: number[] = reactive([])
const flag = ref(false)
function on_keydown() {
  tap_time.push(performance.now())
  result.value = calc_bpm()
}

function start_tap() {
  ShortCuts.stop_listening()
  utils.clear_arr(tap_time)
  flag.value = true
  document.addEventListener('keydown', on_keydown)
}
function stop_tap() {
  ShortCuts.resume_listening()
  document.removeEventListener('keydown', on_keydown)
  flag.value = false
}
onUnmounted(() => document.removeEventListener('keydown', on_keydown))

const result = ref(calc_bpm())
function calc_bpm() {
  if (tap_time.length < 2)
    return {
      bpm: '？',
      sd: '-',
      cv: '-'
    }
  const dur: number[] = []
  for (let i = 0; i < tap_time.length - 1; i++) {
    dur.push(tap_time[i + 1] - tap_time[i])
  }
  const avg = dur.reduce((a, b) => a + b, 0) / dur.length
  const sd = Math.sqrt(dur.map((x) => Math.pow(x - avg, 2)).reduce((a, b) => a + b, 0) / dur.length)
  const cv = sd / avg
  return {
    bpm: (60_000 / avg).toPrecision(4),
    sd: sd.toPrecision(3),
    cv: cv.toPrecision(3)
  }
}
const log = computed(() => {
  return tap_time
    .slice()
    .reverse()
    .map((t, ix, arr) => {
      return [
        arr.length - ix, // 原始序号
        (t - tap_time[0]).toFixed(2), // 距首项差值
        ix === 0 ? 0 : (arr[ix - 1] - t).toFixed(2) // 距上一项差值
      ]
    })
})
</script>

<template>
  <SimpleModal size="3" title="Bpm Tapper">
    <div class="bpm-cr">
      <div class="bpm-control">
        <a-button v-if="!flag" class="rainbow-text" msg="开始！" @click="start_tap()" />
        <a-button v-if="flag" msg="结束！" @click="stop_tap()" />
        <div>开始后敲击任意键即可。</div>
      </div>
      <div class="bpm-result">
        <div class="bpm-bpm">
          <span class="bpm-title">BPM: </span>
          <br />
          {{ result.bpm }}
        </div>
        <div class="bpm-sd"><span class="bpm-title">方差</span> <br />{{ result.sd }}</div>
        <div class="bpm-cv"><span class="bpm-title">CV</span> <br />{{ result.cv }}</div>
      </div>
    </div>
    <div class="bpm-log-title">记录</div>
    <div class="bpm-log">
      <template v-for="[ix, t, d] in log" :key="t">
        <div>{{ ix }}</div>
        <div>{{ t }}</div>
        <div>{{ d }}</div>
      </template>
    </div>
  </SimpleModal>
</template>

<style scoped>
.a-button {
  font-size: 1.5rem;
}
.bpm-cr {
  display: grid;
  grid-template-columns: 1fr 1fr;
  min-height: 10rem;
}
.bpm-control {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  justify-content: space-evenly;
}
.bpm-result {
  display: grid;
  grid-template-areas: 'a a' 'b c';
  text-align: center;
  gap: 5px;
}
.bpm-result > div {
  backdrop-filter: brightness(0.7) blur(4px);
}
.bpm-bpm {
  grid-area: a;
  font-size: 2rem;
  font-weight: bold;
}
.bpm-sd {
  grid-area: b;
}
.bpm-cv {
  grid-area: c;
}
.bpm-title {
  font-size: 1rem;
}
.bpm-log-title {
  text-align: center;
  width: 100%;
  margin-top: 15px;
  margin-bottom: 15px;
  font-size: 1.3rem;
}
.bpm-log {
  display: grid;
  grid-template-columns: 3rem 1fr 1fr;
  gap: 0 5px;
  height: 12rem;
  border-top: 1px solid #b8dcee;
  backdrop-filter: brightness(0.7);
  overflow: hidden auto;
  padding: 5px;
  box-sizing: border-box;
  align-content: start;
}
</style>
