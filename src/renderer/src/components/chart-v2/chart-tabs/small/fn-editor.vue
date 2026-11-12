<script lang="ts" setup>
import { computed } from 'vue'
import { Storage } from '@renderer/core/storage'
import ARange from '@renderer/components/a-elements/a-range.vue'
import ANumberInput from '@renderer/components/a-elements/a-number-input.vue'
import { EventHub } from '@renderer/core/misc/eventhub'
import { Chart } from '@renderer/core/chart/chart'

const scale = computed({
  get() {
    return Storage.settings.scale
  },
  set(v) {
    Storage.settings.scale = v
    EventHub.dispatch('scale-changed')
  }
})
const meter = computed({
  get() {
    return Storage.settings.meter
  },
  set(v) {
    Storage.settings.meter = v
    Chart.current?.diff.update_meter()
    EventHub.dispatch('meter-changed')
  }
})
</script>
<template>
  <table class="fn-editor">
    <tbody>
      <tr>
        <td style="width: 10%">流速</td>
        <td colspan="9">
          <a-range
            v-model="scale"
            :max="Storage.settings.max_scale"
            :min="0.1"
            :step="0.1"
            style="width: 100%"
          />
        </td>
        <td style="width: 15%">
          <a-number-input v-model="scale" :max="Storage.settings.max_scale" min="0.1" step="0.1" />
        </td>
      </tr>
      <tr>
        <td rowspan="2">分音</td>
        <td colspan="9">
          <a-range
            v-model="meter"
            :max="Storage.settings.max_meter"
            min="1"
            step="1"
            style="width: 100%"
          />
        </td>
        <td>
          <a-number-input v-model="meter" :max="Storage.settings.max_meter" min="1" step="1" />
        </td>
      </tr>
      <tr>
        <td class="fn-editor-meter-button" @click="meter = 4">4</td>
        <td class="fn-editor-meter-button" @click="meter = 6">6</td>
        <td class="fn-editor-meter-button" @click="meter = 8">8</td>
        <td class="fn-editor-meter-button" @click="meter = 12">12</td>
        <td class="fn-editor-meter-button" @click="meter = 16">16</td>
        <td class="fn-editor-meter-button" @click="meter = 24">24</td>
        <td class="fn-editor-meter-button" @click="meter = 32">32</td>
        <td class="fn-editor-meter-button" @click="meter = 48">48</td>
        <td class="fn-editor-meter-button" @click="meter = 64">64</td>
      </tr>
    </tbody>
  </table>
</template>
<style>
.fn-editor {
  height: min-content;
}

.fn-editor input {
  width: 100%;
}

.fn-editor td {
  text-align: center;
}

.fn-editor-meter-button {
  text-align: center;
  cursor: pointer;
  width: calc(75% / 9);
  box-sizing: content-box;
  border: 4px solid transparent;
  transition: 0.2s linear background-color;
}

.fn-editor-meter-button:hover {
  background: #444;
}
</style>
