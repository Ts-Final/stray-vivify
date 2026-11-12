<script lang="ts" setup>
import WordHelper from '@renderer/components/miscellaneous/word-helper.vue'
import AButton from '@renderer/components/a-elements/a-button.vue'
import { computed, ref } from 'vue'
import { Chart } from '@renderer/core/chart/chart'

const chart = Chart.$current

const emit = defineEmits<{
  (e: 'next'): void
}>()

const STR = ['Opening', 'Middle', 'Finale', 'Encore']

const phase = ref(0)

const diff_indexs = defineModel<number[]>({ required: true })
const can_pass_1 = computed(() => diff_indexs.value.some((x) => x != -1))

function drop(ix: number) {
  if (dragging == -1) return
  diff_indexs.value[ix] = dragging
  dragging = -1
}
function fuck_diff(ix: number) {
  diff_indexs.value[ix] = -1
}
let dragging = -1
function start_diff_drag(ix: number) {
  dragging = ix
}
</script>

<template>
  <div v-if="phase == 0" class="custom-diff">
    <div class="custom-diff-left">
      <span class="custom-diff-header">
        <word-helper dec="点击下面方框以删除选择，可以覆盖" msg="从右侧拖动diff！" />
      </span>
      <template v-for="(ix, i) in STR">
        <div>{{ ix }}</div>
        <div style="overflow: hidden" @click="fuck_diff(i)" @drop="drop(i)" @dragover.prevent>
          {{
            diff_indexs[i] == -1
              ? ''
              : `${chart.diffs[diff_indexs[i]].meta.diff1} - ${chart.diffs[diff_indexs[i]].meta.diff2}`
          }}
        </div>
      </template>
      <a-button
        v-if="can_pass_1"
        msg="Next"
        style="grid-column: span 2; width: 6rem"
        @click="emit('next')"
      />
    </div>
    <div class="custom-diff-right">
      <div
        v-for="(diff, ix) in chart.chart.diffs"
        class="custom-diff-single"
        draggable="true"
        @dragstart="start_diff_drag(ix)"
      >
        <div>{{ diff.meta.diff1 }} - {{ diff.meta.diff2 }}</div>
        <div>Charter: {{ diff.meta.charter }}</div>
        <div>Notes: {{ diff.notes.length }}</div>
      </div>
    </div>
  </div>
</template>

<style>
.custom-diff {
  width: 100%;
  display: grid;
  grid-template-columns: 3fr 2fr;
}
.custom-diff-left {
  display: grid;
  grid-template-columns: 1fr 2fr;
  align-items: center;
  justify-items: center;
  text-align: center;
  row-gap: 25px;
  margin-top: 50px;
  padding-left: 25px;
}
.custom-diff-header {
  grid-column: 1 / span 2;
  padding-bottom: 15px;
  font-weight: bold;
}
.custom-diff-left div:nth-child(2n + 1) {
  border: #b8dcee 2px solid;
  width: 15rem;
  height: 3rem;
  line-height: 3rem;
}
.custom-diff-single {
  width: 100%;
  height: min-content;
  display: grid;
  grid-template-areas: 'a a a' 'b c c';
  border: 1px solid #b8dcee;
  padding: 5px;
}
.custom-diff-single :nth-child(1) {
  grid-area: a;
}
.custom-diff-single :nth-child(2) {
  grid-area: b;
  font-size: 0.9rem;
}
.custom-diff-single :nth-child(3) {
  grid-area: c;
  font-size: 0.8rem;
  opacity: 0.8;
}
</style>
