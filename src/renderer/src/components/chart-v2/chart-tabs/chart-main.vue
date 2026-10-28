<script lang="ts" setup>
import PixiEditor from '@renderer/components/chart-v2/svg-lane/pixi-editor.vue'
import { Chart } from '@renderer/core/chart/chart'
import DiffRef from '@renderer/components/chart-v2/svg-lane/diff-ref.vue'
import { Storage } from '@renderer/core/storage'
import { computed } from 'vue'
import { fn_components, normalize_fn_tabs } from '@renderer/core/misc/fn-tabs'

const chart = Chart.$current
const d_ref = chart.refs.diff_ref

const fn_tabs = computed(() => normalize_fn_tabs(Storage.settings.fn_tabs))
const left_fns = computed(() => fn_components(fn_tabs.value.left))
const right_fns = computed(() => fn_components(fn_tabs.value.right))
</script>

<template>
  <div class="chart-main">
    <div v-if="left_fns.length" class="chart-fn fn-wrapper">
      <component :is="fn.component" v-for="fn in left_fns" :key="fn.id" />
    </div>
    <!--  when comparing in bg-mode  -->
    <diff-ref v-if="d_ref != -1" />
    <pixi-editor v-else />
    <div v-if="right_fns.length" class="chart-fn fn-wrapper">
      <component :is="fn.component" v-for="fn in right_fns" :key="fn.id" />
    </div>
  </div>
</template>

<style scoped>
.chart-main {
  display: flex;
  flex-direction: row;
  width: 100%;
  height: 100%;
  flex-grow: 1;
  justify-content: space-around;
  position: relative;
  contain: strict;
  gap: 5px;
}
</style>
