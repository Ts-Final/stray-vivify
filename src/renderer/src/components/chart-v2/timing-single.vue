<script lang="ts" setup>
import { utils } from '@renderer/core/utils'
import { inject } from 'vue'
import { ChartTypeV2 } from '@preload/chart-types'

const { timing, idx } = defineProps<{ timing: ChartTypeV2.timing; idx: number }>()

const fn = inject<(idx: number) => void>('focus') ?? ((_) => {})
</script>

<template>
  <div class="timing-single">
    <span class="timing-time">{{ utils.toTimeStr(timing.time / 1000) }}</span>
    <span class="timing-bpm" @click="() => fn(idx)">{{ timing.bpm.toFixed(2) }}</span>
    <span>{{ timing.num }}/{{ timing.den }}</span>
  </div>
</template>

<style>
.timing-single {
  max-width: 45vw;
  min-width: 30vw;
  display: grid;
  grid-template-columns: 1fr 4fr 2fr 1fr;
  border-radius: 4px;
  transition: background-color 0.1s ease-out;
  padding: 3px;
}
.timing-single:hover {
  background: var(--button-hover);
}
.timing-time {
  border-left: #b8dcee 5px solid;
  padding-left: 5px;
}
.timing-bpm {
  text-align: right;
  padding-right: 15px;
  cursor: pointer;
}
.timing-single * {
  user-select: none;
}
</style>
