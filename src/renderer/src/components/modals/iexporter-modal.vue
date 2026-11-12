<script lang="ts" setup>
import { Chart } from '@renderer/core/chart/chart'
import SimpleModal from '@renderer/components/modals/simple-modal.vue'
import AButton2 from '@renderer/components/a-elements/a-button2.vue'
import { Invoke } from '@renderer/core/ipc'
import Hide from '@renderer/components/a-elements/hide.vue'
import { modal } from '@renderer/core/misc/modal'
import IexporterGml from '@renderer/components/modals/iexporter-gml.vue'

const chart = Chart.$current

async function read_vsb() {
  const fp = await Invoke('ask-file', { file: ['vsb文件', 'vsb'] })
  if (!fp) return
  chart.load_vsb_file(fp)
}

async function read_vsc() {
  const fp = await Invoke('ask-file', { file: ['vsc文件', 'vsc'] })
  if (!fp) return
  chart.load_vsc_file(fp)
}

function write_vsc() {
  const chart = Chart.current
  if (!chart) throw new Error('?????')
  chart.write_current_vsc()
}
function export_svc() {
  Chart.$current.export_chart('svc')
}
function export_zip() {
  Chart.$current.export_chart('zip')
}

async function import_osz() {
  const fp = await Invoke('ask-file', { file: ['OSZ', 'osz'] })
  if (!fp) return
  Chart.$current.import_osz(fp)
}

async function import_mcz() {
  const fp = await Invoke('ask-file', { file: ['MCZ', 'mcz'] })
  if (!fp) return
  Chart.$current.import_mcz(fp)
}

function open_svg() {
  modal.ChartPreviewModal.show({})
}
</script>

<template>
  <simple-modal size="1" title="好多东西啊……">
    <div class="iexporter-wrapper">
      <Hide :def="true" title="导入/导出">
        <div class="iexporter-buttons">
          <a-button2 msg="导入vsb" @click="read_vsb" />
          <a-button2 msg="导入vsc" @click="read_vsc" />
          <a-button2 msg="导入osz" @click="import_osz" />
          <a-button2 msg="导入mcz" @click="import_mcz" />
        </div>
      </Hide>
      <Hide :def="true" title="导出">
        <div class="iexporter-buttons">
          <a-button2 msg="导出vsc" @click="write_vsc" />
          <a-button2 msg="导出svc" @click="export_svc" />
          <a-button2 msg="导出zip" @click="export_zip" />
          <a-button2 v-if="chart.diff.notes.length != 0" msg="导出svg" @click="open_svg" />
        </div>
      </Hide>
      <Hide title="gml">
        <IexporterGml />
      </Hide>
    </div>
  </simple-modal>
</template>

<style>
.iexporter-wrapper {
  display: flex;
  justify-content: center;
  flex-direction: column;
  align-items: center;
  max-height: 55vh;
  width: 100%;
  overflow-y: auto;
}
.iexporter-buttons {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr;
  width: 100%;
  justify-items: center;
  gap: 5px;
}
</style>
