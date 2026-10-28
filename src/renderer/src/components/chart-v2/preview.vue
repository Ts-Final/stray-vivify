<script lang="ts" setup>
import { Chart } from '@renderer/core/chart/chart'
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { utils } from '@renderer/core/utils'
import { Storage, Version } from '@renderer/core/storage'
import AImg from '@renderer/components/a-elements/a-img.vue'
import FnCounter from '@renderer/components/chart-v2/chart-tabs/small/fn-counter.vue'
import { notify } from '@renderer/core/misc/notify'
import { Invoke } from '@renderer/core/ipc'
import TickCircle from '@renderer/components/chart-v2/chart-tabs/small/tick-circle.vue'
import PixiLane from '@renderer/components/chart-v2/svg-lane/pixi-lane.vue'
import { route } from '@renderer/core/misc/route'

const chart = Chart.$current

function onkeydown(e: KeyboardEvent) {
  if (e.key == 'Escape') {
    route.setTab(1)
  }
}
const setting = computed(() => Storage.data.value.settings.record_field)
const editor = computed(() => Storage.settings)
const current_time = chart.audio.refs.current_ms
const length = chart.audio.length
const current_timing = chart.diff.current_timing

const img_src = ref(`stray:///__sprite__/${chart.id}`)
const no_img = ref(false)
const bg_src = ref(`stray:///__bg__/${chart.id}`)
const bg_error = ref(0)

function wait_until_space() {
  return new Promise<void>((r) => {
    document.addEventListener('keydown', (e) => {
      if (e.key == ' ') {
        r()
      }
    })
  })
}
function wait_time(ms: number) {
  return new Promise<void>((r) => {
    setTimeout(() => {
      r()
    }, ms)
  })
}
const animation_state = ref(0)
const show_lanes = ref(false)
let interval_id = -1
const current_density = ref(0)
function calc_density() {
  current_density.value = chart.diff.current_density
}
const show_result = ref(false)

let off = false

async function start_record() {
  await wait_until_space()
  if (off) return
  animation_state.value = 1

  await wait_time(2500)
  if (off) return
  animation_state.value = 2
  show_lanes.value = true

  await wait_time(2000)
  if (off) return
  animation_state.value = 3
  chart.audio.play_pause()
  interval_id = Number(setInterval(() => calc_density(), 500))
  chart.audio.on_end(() =>
    setTimeout(() => {
      show_result.value = true
    }, 2000)
  )
}

onMounted(() => {
  Invoke('enter-fullscreen')
  chart.audio.set_current_time(-5000)
  notify.normal('按空格以开始。')
  start_record()
  Storage.data.value.settings.meter = 1
  document.addEventListener('keydown', onkeydown)
})
onUnmounted(() => {
  if (interval_id != -1) clearInterval(interval_id)
  Invoke('leave-fullscreen')
  chart.audio.pause()
  off = true
  document.removeEventListener('keydown', onkeydown)
})
</script>

<template>
  <div id="preview-field" ref="top-div" class="playfield">
    <img v-if="bg_error == 0" :src="bg_src" alt="" class="playfield-bg" @error="bg_error = 1" />
    <transition name="fadeout">
      <div v-if="animation_state < 3" class="pf-animations">
        <template v-if="animation_state > 0">
          <img v-if="no_img" alt="" class="pf-ani-img" src="/song.jpg" />
          <img v-else :src="img_src" alt="" class="pf-ani-img" @error="no_img = true" />
          <div class="pf-ani-inf">
            <div class="pf-ani-name">{{ chart.song.name }}</div>
            <div class="pf-ani-comp">by {{ chart.song.composer }}</div>
            <transition name="fade">
              <div v-if="animation_state < 2" class="pf-ani-diff">
                <div>{{ chart.diff.diff1 }}</div>
                <div>{{ chart.diff.diff2 }}</div>
              </div>
            </transition>
          </div>
        </template>
        <div v-if="animation_state > 1" class="pf-ani-inf2">
          <div>
            <div>谱师</div>
            <div>{{ chart.diff.charter }}</div>
          </div>

          <div v-if="chart.song.source">
            <div>来源</div>
            <div>{{ chart.song.source }}</div>
          </div>
          <div v-if="no_img">
            <div>曲绘</div>
            <div>stray/vivify (TerminalFlow)</div>
          </div>
          <div v-else-if="chart.song.sprite">
            <div>曲绘</div>
            <div>{{ chart.song.sprite }}</div>
          </div>
          <div v-if="chart.song.ref">
            <div></div>
            <div>{{ chart.song.ref }}</div>
          </div>
        </div>
      </div>
    </transition>
    <template v-if="show_lanes">
      <div class="pf-song">
        <div class="pf-name">{{ chart.song.name }}</div>
        <div class="pf-comp">by {{ chart.song.composer }}</div>
      </div>
      <div v-if="setting.sprite" class="pf-sprite">
        <a-img :src="img_src" alt="" />
      </div>
      <slot>
        <pixi-lane />
      </slot>

      <tick-circle v-if="Storage.settings.record_field.show_circles" />

      <div class="pf-inf">
        <slot name="info"></slot>
        <div v-if="setting.detail > 2">scale: {{ editor.scale }}</div>
        <div v-if="setting.detail > 1">{{ current_density }}/sec</div>
        <div>Bpm: {{ chart.diff.timing[current_timing].bpm }}</div>
        <div class="pf-diff">{{ chart.diff.diff1 }} {{ chart.diff.diff2 }}</div>
        <div class="pf-charter">{{ chart.diff.charter }}</div>
      </div>
      <div class="pf-time">
        {{ utils.ms2str(current_time, 0) }}/{{ utils.ms2str(length, 0) }}
        <br />
        {{ Math.max(0, Math.round((current_time / length) * 100)) + '%' }}
      </div>
      <div class="pf-version">{{ Version.str }}</div>
    </template>
    <transition v-if="show_result" name="fade">
      <div class="pf-results" style="cursor: auto">
        <div class="pr-inf">
          <div class="pr-name">{{ chart.song.name }}</div>
          <div class="pr-comp">{{ chart.song.composer }}</div>
          <img v-if="no_img" alt="" class="pr-img" src="/song.jpg" />
          <img v-else :src="img_src" alt="" class="pr-img" />
          <div class="pr-diff">{{ chart.diff.diff1 }} {{ chart.diff.diff2 }}</div>
          <div class="pr-charter">{{ chart.diff.charter }}</div>
        </div>
        <div class="pr-result">
          <slot name="result">
            <div class="pr-score-wrapper">
              <div class="pr-score">101.0000%</div>
              <div class="pr-combo">COMBO<br />{{ chart.diff.notes.length }}</div>
            </div>
            <fn-counter class="pr-counter" />
            <div class="pr-back" @click="route.setTab(1)">返回编辑</div>
          </slot>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.playfield {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  background-color: black;
  user-select: none;
  cursor: none;
}
.playfield-bg {
  position: absolute;
  height: 80%;
  top: 10%;
  left: 50%;
  transform: translateX(-50%);
  filter: blur(3px);
}
img {
  pointer-events: none;
}
.pf-animations,
.pf-results {
  position: absolute;
  width: 100%;
  height: 100%;
  background-image: var(--purple-bgi);
  z-index: var(--z-preview-result);
}
@keyframes pf-ani-img {
  0% {
    height: 0;
  }
  100% {
    height: 30vh;
  }
}
.pf-ani-img {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  height: 30vh;
  top: 15vh;
  border: 2px solid white;
  overflow: hidden;
  animation: pf-ani-img 0.3s ease-in-out forwards;
  animation-fill-mode: both;
}
@keyframes pf-ani-inf {
  0% {
    opacity: 0;
    transform: translate(-50%, 20%);
  }
  100% {
    transform: translate(-50%, 0%);
    opacity: 1;
  }
}
.pf-ani-inf {
  position: absolute;
  opacity: 0;
  left: 50%;
  top: 50vh;
  animation-fill-mode: both;
  animation: pf-ani-inf 0.3s ease-in-out forwards;
  animation-delay: 0.3s;
}
.pf-ani-name {
  font-size: 2.5rem;
  text-align: center;
  font-weight: bold;
}
.pf-ani-comp {
  font-size: 1.5rem;
  text-align: center;
}
.pf-ani-diff {
  margin-top: 15px;
  font-size: 1.2rem;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 25px;
  justify-items: center;
}
@keyframes pf-ani-inf2 {
  0% {
    opacity: 0;
    transform: translateY(50px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}
.pf-ani-inf2 {
  opacity: 0;
  animation-fill-mode: both;
  animation: pf-ani-inf2 0.4s linear forwards;
  position: absolute;
  top: calc(50vh + 5rem + 30px);
  left: 35vw;
  width: 30vw;
  display: grid;
  grid-template-columns: 1fr 1fr;
  row-gap: 15px;
}
.pf-ani-inf2 > div > div:first-child {
  font-size: 1.5rem;
  font-weight: bold;
}
.pf-song {
  position: absolute;
  left: 50px;
  bottom: 80px;
}
.pf-name {
  font-size: 1.5rem;
  font-weight: bold;
}
.pf-sprite {
  position: absolute;
  left: 50px;
  bottom: 250px;
}
.pf-sprite > img {
  width: 200px;
  border: #b8dcee 2px solid;
}
.pf-inf {
  position: absolute;
  right: 50px;
  bottom: 80px;
  text-align: right;
}
.pf-diff {
  font-size: 1.5rem;
}
.pf-charter {
  color: gray;
}
.pf-time {
  position: absolute;
  right: 15px;
  top: 15px;
  text-align: right;
}
.pf-version {
  position: absolute;
  top: 15px;
  left: 15px;
  opacity: 0.4;
  color: gray;
}
.pr-inf {
  position: absolute;
  left: 10%;
  top: 50%;
  transform: translateY(-50%);
  border: solid 2px white;
  width: 20%;
  overflow-x: hidden;
  text-align: center;
  background: var(--darker-bgi);
  padding: 10px 0;
}
.pr-name {
  font-weight: bold;
  font-size: 1.2rem;
  color: white;
}
.pr-comp {
  color: gray;
}
.pr-img {
  width: 100%;
  margin: 10px 0;
}
.pr-diff {
  font-size: 1.1rem;
}
.pr-charter {
  color: gray;
}
.pr-result {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translateY(-50%);
  width: 30%;
  display: flex;
  gap: 50px;
  flex-direction: column;
  align-items: center;
}
.pr-result > div {
  background: var(--darker-bgi);
}

.pr-score-wrapper {
  width: 100%;
  height: 10vh;
  border: 2px solid white;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
}
.pr-score {
  font-family: oppo-sans, sans-serif;
  font-size: 2rem;
}
.pr-combo {
  text-align: center;
}
.pr-counter {
  width: calc(100% - 30px);
  border: 2px white solid;
  padding: 15px;
}
.pr-back {
  border: 2px white solid;
  text-align: center;
  width: 6rem;
  cursor: pointer;
  line-height: 2rem;
}
</style>
