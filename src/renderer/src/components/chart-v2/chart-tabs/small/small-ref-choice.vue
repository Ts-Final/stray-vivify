<script lang="ts" setup>
import ASelect from '@renderer/components/a-elements/a-select.vue'
import { Chart } from '@renderer/core/chart/chart'
import { RefreshAll } from '@renderer/core/misc/refresh-all'

const chart = Chart.$current
const options = () =>
  [{ val: -1, display: '无' }].concat(
    chart.diffs.map((x, v: number) => {
      if (x.meta.diff2 == '') return { val: v, display: x.meta.diff1 }
      return { val: v, display: x.meta.diff1 + ' - ' + x.meta.diff2 }
    })
  )
const dix = chart.refs.diff_ref
const rkey = RefreshAll.generate_key('diff-choice')
</script>

<template>
  <div class="ref-choice">
    <div>参考难度：</div>
    <a-select :key="rkey" v-model="dix" :options="options()" />
  </div>
</template>

<style>
.ref-choice {
  display: flex;
  flex-direction: row;
  gap: 10px 0;
  justify-content: space-evenly;
  width: 100%;
  white-space: nowrap;
}
.ref-choice .a-select-value {
  overflow-x: hidden;
}
</style>
