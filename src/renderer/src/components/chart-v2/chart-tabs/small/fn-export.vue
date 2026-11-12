<script lang="ts" setup>
import { Chart } from '@renderer/core/chart/chart'
import AButton2 from '@renderer/components/a-elements/a-button2.vue'
import { utils } from '@renderer/core/utils'

const chart = Chart.$current
function write_vsc() {
  chart.write_current_vsc()
}
function backup() {
  chart.backup()
}
const last_backup = chart.backup_last
</script>

<template>
  <div class="fn-export">
    <div style="grid-column: span 2">命名征集中</div>
    <a-button2 msg="导出vsc" @click="write_vsc" />
    <a-button2 msg="备份" @click="backup" />

    <div v-if="!last_backup.init" class="fn-export-last-backup">
      最后备份： {{ utils.toLocalTime(last_backup.time) }}
    </div>
  </div>
</template>

<style>
.fn-export {
  display: grid;
  grid-template-columns: repeat(var(--cols), auto);
  justify-items: center;
  --cols: 2;
}
.fn-export-last-backup {
  grid-column: span var(--cols);
  color: gray;
}
</style>
