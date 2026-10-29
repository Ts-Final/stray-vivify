<script lang="ts" setup>
import { Chart } from '@renderer/core/chart/chart'
import TimingSingle from '@renderer/components/chart-v2/timing-single.vue'
import { computed, onMounted, onUnmounted, provide, ref } from 'vue'
import AButton2 from '@renderer/components/a-elements/a-button2.vue'
import ACheckbox from '@renderer/components/a-elements/a-checkbox.vue'
import { modal } from '@renderer/core/misc/modal'
import { route } from '@renderer/core/misc/route'

const chart = Chart.$current
const diff = chart.diff
const index = ref(-1)
const bpm_input = ref<HTMLInputElement>()
const move1 = ref(false)
const move2 = ref(false)
provide('focus', (idx: number) => {
  index.value = idx
  bpm_input.value?.focus()
})
const bpm_comp = computed({
  get() {
    return diff.timing[index.value].bpm
  },
  set(value) {
    diff.timing[index.value].bpm = value
  }
})
const num_comp = computed({
  get() {
    return diff.timing[index.value].num
  },
  set(value) {
    diff.timing[index.value].num = value
  }
})
const den_comp = computed({
  get() {
    return diff.timing[index.value].den
  },
  set(value) {
    diff.timing[index.value].den = value
  }
})
const time = computed({
  get() {
    return diff.timing[index.value].time
  },
  set(value) {
    const delta = value - diff.timing[index.value].time
    if (move2.value) chart.diff.push_timing_all(index.value, delta)
    else if (move1.value) chart.diff.push_timing(index.value, delta)
    else diff.timing[index.value].time = value
  }
})

function del_timing(ix: number) {
  if (ix == 0) {
    if (chart.diff.timing.length == 1) return
  }
  diff.timing.splice(ix, 1)
  index.value = -1
}
function add_timing() {
  let r = diff.add_timing({
    bpm: 120,
    num: 4,
    den: 4,
    time: chart.audio.current_time
  })
  if (r != -1) {
    index.value = r
  }
}

function switcher(t: number) {
  chart.audio.set_current_time(t)
  route.tab.value = 1
}

onMounted(() => {
  chart.diff.sort_timing()
})

function bpm_change(e: Event) {
  bpm_comp.value = parseFloat((e.target as HTMLInputElement).value)
}

function copy_timing_list() {
  navigator.clipboard.writeText(chart.diff.timing.map((t) => `${t.time}, ${t.bpm}`).join('\n'))
}

function open_tap() {
  modal.TapBPMModal.show({})
}

onUnmounted(() => chart.diff.update_timing_list())
</script>

<template>
  <div class="timing-wrapper">
    <div class="timing-left">
      <div class="timing-list">
        <div class="timing-header">
          <div style="flex: 1">Timing List</div>
          <a-button2 class="timing-add" msg="Tap BPM" @click="open_tap()" />
          <a-button2 class="timing-add" msg="复制timing list" @click="copy_timing_list" />
          <a-button2 class="timing-add" msg="+new Timing" @click="add_timing" />
        </div>
        <div class="timing-list-inner">
          <timing-single
            v-for="(t, idx) in diff.timing"
            :class="index == idx ? 'chosen' : ''"
            :idx="idx"
            :timing="t"
            @click="index = idx"
            @click.ctrl.capture="switcher(t.time)"
            @contextmenu.ctrl.capture="del_timing(idx)"
          />
        </div>
      </div>
    </div>
    <div class="timing-right">
      <div v-if="index != -1" class="timing-editor">
        <div class="timing-index">timing #{{ index }}</div>
        <div>
          <span>Time</span>
          <input v-model="time" class="timing-input" min="0" type="number" />
        </div>
        <div>
          <span>BPM</span>
          <input
            ref="bpm_input"
            :value="bpm_comp"
            class="timing-input"
            min="1"
            type="number"
            @change="bpm_change"
          />
        </div>
        <div style="display: flex; justify-content: center; align-items: center">
          <span>拍号</span>
          <div class="timing-signature">
            <input v-model="num_comp" class="timing-input" min="1" type="number" />
            <div style="border: 1px solid #b8dcee"></div>
            <input v-model="den_comp" class="timing-input" min="1" type="number" />
          </div>
        </div>

        <div
          :class="index == 0 ? 'timing-first' : ''"
          class="timing-delete"
          @click="del_timing(index)"
        >
          删除
        </div>
        <div class="timing-move">
          <div @click="move1 = !move1"><a-checkbox v-model="move1" /> 移动此timing内的所有物件</div>
          <div @click="move2 = !move2">
            <a-checkbox v-model="move2" /> 移动此timing之后的所有物件
          </div>
        </div>
      </div>
      <div v-else-if="diff.timing.length == 1" class="timing-placeholder">
        没有变奏呢。好曲（师）！
      </div>
      <div v-else-if="diff.timing.length == 0" class="timing-placeholder">
        为什么这里一个timing都没有，我代码哪里炸了？
      </div>
      <div v-else class="timing-placeholder">古希腊掌管变奏的神。</div>
    </div>
  </div>
</template>

<style scoped>
.timing-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: row;
  position: relative;
}
.timing-left {
  bottom: 0;
  margin: 50px 50px 0;
  background: var(--darker-bgi);
  box-shadow: 0 0 10px 10px #000;
  width: 50%;
}
.timing-header {
  line-height: 1.6rem;
  border-bottom: 2px solid #b8dcee;
  margin-bottom: 10px;
  display: flex;
  justify-content: space-between;
  padding-left: 15px;
  gap: 5px;
}
.timing-add {
  border-radius: 3px;
  background: var(--purple-bgi);
  line-height: 1.6rem;
  height: 1.6rem;
  cursor: pointer;
  user-select: none;
}
.timing-list {
  padding: 15px;
  height: 100%;
}
.timing-list-inner {
  overflow-y: auto;
  max-height: calc(100% - 60px - 2rem);
  height: 100%;
}
.chosen {
  background: var(--button-hover);
}
.timing-right {
  position: absolute;
  right: 0;
  background: var(--darker-bgi);
  max-width: 35vw;
  width: 30%;
  top: calc(45% - 25vh);
  padding: 30px;
  border-radius: 15px 0 0 15px;
  height: 50vh;
  display: flex;
  justify-content: center;
  align-items: center;
}
.timing-placeholder {
  color: #3b4652;
  font-style: italic;
  text-align: center;
  position: relative;
  top: -50px;
}
.timing-editor {
  text-align: center;
}
.timing-index {
  margin-bottom: 40px;
}
.timing-input {
  border-radius: 5px 5px 0 0;
  line-height: 1.5rem;
  height: 1.4rem;
  font-size: 1rem;
  margin: 5px;
  text-align: center;
  border: none;
  border-bottom: 2px solid #000;
  background: var(--purple-bgi);
}
.timing-input::-webkit-inner-spin-button,
.timing-input::-webkit-outer-spin-button {
  -webkit-appearance: none;
}
.timing-signature {
  display: flex;
  flex-direction: column;
  max-width: 5rem;
  margin-left: 5px;
}
.timing-delete {
  border: 2px solid crimson;
  width: 6rem;
  height: 2rem;
  line-height: 2rem;
  left: calc(50% - 3rem);
  position: relative;
  margin-top: 25px;
  cursor: pointer;
  user-select: none;
  margin-bottom: 15px;
}
.timing-first {
  cursor: not-allowed;
  filter: brightness(0.6);
  font-style: italic;
}
.timing-move {
  display: flex;
  flex-direction: column;
  align-items: start;
}
.timing-move > div {
  cursor: pointer;
}
</style>
