<script lang="ts" setup>
import { Chart } from '@renderer/core/chart/chart'
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'
import { utils } from '@renderer/core/utils'
import { Storage, Version } from '@renderer/core/storage'
import AImg from '@renderer/components/a-elements/a-img.vue'
import { notify } from '@renderer/core/misc/notify'
import { Invoke } from '@renderer/core/ipc'
import AButton2 from '@renderer/components/a-elements/a-button2.vue'
import { ChartTypeV2 } from '@preload/chart-types'
import PixiLane from '@renderer/components/chart-v2/svg-lane/pixi-lane.vue'
import { route } from '@renderer/core/misc/route'

const chart = Chart.$current
const playfield = chart.$playfield
const paused = chart.audio.refs.paused

function onkeydown(e: KeyboardEvent) {
  if (e.key == 'Escape') {
    if (chart.audio.paused) {
      return exit_play()
    }
    pause()
  }
}

function pause() {
  chart.audio.pause()
  chart.audio.set_current_time(chart.audio.current_time - 2000)
}
function exit_play() {
  route.setTab(1)
  chart.playfield = null
}
function continue_play() {
  chart.audio.set_and_play()
}

function restart() {
  route.setTab(1)
  chart.audio.pause()
  nextTick()
    .then(() => {
      chart.init_playfield()
      route.setTab(5)
      return nextTick()
    })
    .then(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }))
    })
}

const setting = computed(() => Storage.data.value.settings.record_field)
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
  main_loop()
}
function main_loop() {
  playfield.update_per_frame()
  if (route.tab.value != 4 || chart.audio.ended) {
    console.log('play ended')
    return
  }
  requestAnimationFrame(main_loop)
}

onMounted(() => {
  Invoke('enter-fullscreen')
  if (playfield.start_from_now) {
    pause()
    animation_state.value = 3
    show_lanes.value = true
    main_loop()
  } else {
    chart.audio.set_current_time(-3000)
    notify.normal('按空格以开始游玩。')
    start_record()
    Storage.data.value.settings.meter = 1
  }
  chart.audio.on_end(() =>
    setTimeout(() => {
      show_result.value = true
      final.value = playfield.final_stats
    }, 500)
  )
  document.addEventListener('keydown', onkeydown)
})

onUnmounted(() => {
  if (interval_id != -1) clearInterval(interval_id)
  Invoke('leave-fullscreen')
  chart.audio.pause()
  off = true
  document.removeEventListener('keydown', onkeydown)
})

const { acc, last_judgement, click_sec, combo } = playfield.refs
const final = ref(playfield.final_stats)
const xs: ChartTypeV2.note_judgement['lvl'][] = [
  'miss-',
  'good-',
  'great-',
  'perfect-',
  'pure',
  'perfect+',
  'great+',
  'good+',
  'miss+',
  'boom!'
]
function title_ize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}
</script>

<template>
  <div
    id="playfield"
    ref="top-div"
    :style="{ cursor: paused ? 'default' : 'none' }"
    class="playfield"
  >
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
      <pixi-lane />
      <div class="pf-inf">
        <slot name="info"></slot>
        <div>{{ click_sec }}/sec</div>
        <div>Bpm: {{ chart.diff.timing[current_timing].bpm }}</div>
        <div class="pf-diff">{{ chart.diff.diff1 }} {{ chart.diff.diff2 }}</div>
        <div class="pf-charter">{{ chart.diff.charter }}</div>
      </div>
      <div class="pf-time">
        {{ utils.ms2str(current_time, 0) }}/{{ utils.ms2str(length, 0) }}
        <br />
        {{ Math.max(0, Math.round((current_time / length) * 100)) + '%' }}
      </div>
      <div class="pf-version">
        <div>{{ Version.str }}</div>
      </div>
      <div class="pf-acc">
        {{ acc.toFixed(2) }}%
        <br />
        {{ last_judgement }}
        <br />
        {{ combo }}
      </div>
      <div v-if="paused" class="pf-pause">
        <div class="pf-pause-header">暂停ing</div>
        <div class="pf-pause-functions">
          <a-button2 msg="resume" @click="continue_play" />
          <a-button2 msg="restart" @click="restart" />
          <a-button2 msg="exit" @click="exit_play" />
        </div>
      </div>
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
          <div class="pr-score-wrapper">
            <div class="pr-score">{{ final.acc.toFixed(2) }} %</div>
            <div class="pr-combo">
              MAX COMBO
              <br />{{ final.max_combo }} <br />COMBO <br />{{ combo }}
            </div>
          </div>
          <div class="pr-counter">
            <div v-for="k in xs">
              <div>{{ final.counts[k] }}</div>
              <div
                :style="{ height: (final.counts[k] / final.total) * 250 + 'px' }"
                class="pr-portion"
              />
              <div>{{ title_ize(k) }}</div>
            </div>
          </div>
          <div class="pr-other">
            <div>
              <div>avg. delay</div>
              <div>{{ final.avg_delay.toFixed(2) }}</div>
            </div>
            <div>
              <div>density</div>
              <div>{{ final.density.toFixed(3) }}</div>
            </div>
            <div>
              <div>Max CPS</div>
              <div>{{ final.max_cps }}</div>
            </div>
            <div>
              <div>Total Press</div>
              <div>{{ final.total_click }}</div>
            </div>
            <div>
              <div>Empty Clicks</div>
              <div>{{ final.empty }}</div>
            </div>
            <div>
              <div>Total</div>
              <div>{{ final.total }}</div>
            </div>
          </div>
          <div class="pr-back" @click="route.setTab(1)">返回编辑</div>
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
  bottom: 50px;
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
.pf-acc {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  font-size: 1.5rem;
  font-weight: bold;
  text-shadow: 0 0 2px black;
  top: 10vh;
  text-align: center;
}

.pf-pause {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  top: 30%;
  border: 2px solid white;
  box-shadow: 0 0 15px 5px black;
  background: var(--darker-bgi);
  padding: 25px;
  user-select: none;
  width: 30vw;
}
.pf-pause-header {
  font-size: 1.5rem;
  font-weight: bold;
  text-align: center;
  margin-bottom: 30px;
}
.pf-pause-functions {
  display: flex;
  flex-direction: row;
  justify-content: space-evenly;
}
.pf-pause-functions > * {
  cursor: pointer;
  line-height: 2rem;
  height: 2rem;
  width: 7rem;
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
  right: 100px;
  top: 50%;
  transform: translateY(-50%);
  width: 50%;
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
  justify-content: space-evenly;
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
  height: 300px;
  display: flex;
  flex-direction: row;
  justify-content: space-evenly;
}
.pr-counter > div {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: end;
}
.pr-counter > div > div:last-child {
  height: 1.3rem;
  line-height: 1.3rem;
}
.pr-portion {
  width: 1.5rem;
  background: #b8dcee;
}
.pr-back {
  border: 2px white solid;
  text-align: center;
  width: 6rem;
  cursor: pointer;
  line-height: 2rem;
}
.pr-other {
  width: 100%;
  display: flex;
  flex-direction: row;
  justify-content: space-evenly;
  border: 2px solid white;
  box-sizing: border-box;
  padding: 15px;
}
.pr-other > div {
  display: flex;
  flex-direction: column;
  align-items: center;
}
</style>
