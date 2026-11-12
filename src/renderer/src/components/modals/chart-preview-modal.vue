<script lang="ts" setup>
import SimpleModal from '@renderer/components/modals/simple-modal.vue'
import FullNotes from '@renderer/components/chart-v2/full-notes.vue'
import AButton2 from '@renderer/components/a-elements/a-button2.vue'
import { Chart } from '@renderer/core/chart/chart'
import { toRef } from 'vue'
import ACheckbox from '@renderer/components/a-elements/a-checkbox.vue'
import ALabel from '@renderer/components/a-elements/a-label.vue'
import { Storage } from '@renderer/core/storage'

function write_png() {
  Chart.current?.write_png()
}

const shown_ticks = toRef(Storage.data.value.settings.svg_shown_parts)
</script>

<template>
  <SimpleModal size="3">
    <div class="chart-preview-wrapper">
      <div class="chart-preview-top">
        <a-label label="曲绘">
          <a-checkbox v-model="shown_ticks.sprite" />
        </a-label>
        <a-label label="曲名">
          <a-checkbox v-model="shown_ticks.song" />
        </a-label>
        <a-label label="谱面信息">
          <a-checkbox v-model="shown_ticks.diff" />
        </a-label>
        <a-label label="水印">
          <a-checkbox v-model="shown_ticks.sv" />
        </a-label>
        <a-label label="timing">
          <a-checkbox v-model="shown_ticks.timing" />
        </a-label>
        <a-label label="小节线">
          <a-checkbox v-model="shown_ticks.bar" />
        </a-label>
        <a-label label="分音">
          <a-checkbox v-model="shown_ticks.tick" />
        </a-label>
        <a-button2 msg="导出为png" @click="write_png" />
      </div>
      <div class="chart-preview-svg">
        <div>
          <full-notes :shown_parts="shown_ticks" />
        </div>
      </div>
    </div>
  </SimpleModal>
</template>

<style>
.chart-preview-wrapper {
  height: 60vh;
  width: 100%;
}
.chart-preview-top {
  line-height: 3rem;
  border-bottom: 3px solid #b8dcee;
  margin-bottom: 15px;
  display: flex;
  justify-content: center;
  padding-bottom: 5px;
}
.chart-preview-svg {
  max-height: calc(100% - 3rem - 30px);
  overflow: scroll;
}
</style>
