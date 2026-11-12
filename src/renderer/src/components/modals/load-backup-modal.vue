<script lang="ts" setup>
import SimpleModal from '@renderer/components/modals/simple-modal.vue'
import { Chart } from '@renderer/core/chart/chart'
import { ref } from 'vue'
import AButton2 from '@renderer/components/a-elements/a-button2.vue'
import { Invoke } from '@renderer/core/ipc'

const backups = ref<string[]>([])
const chart = Chart.$current

function load_backup(name: string) {
  chart.load_backup(name)
}
chart.get_backup_list().then((v) => (backups.value = v))
function parse_name(str: string) {
  const match = str.match(/^(\d{2})(\d{2})(\d{2})-(\d{2})(\d{2})(\d{2})(?:-(\d+))?\.svb$/)
  if (!match) return str

  const [, year, month, day, hour, minute, second, num] = match
  const fullYear = `20${year}`

  return `${fullYear}年${month}月${day}日 ${hour}时${minute}分${second}秒${num ? ` #${num}` : ''}`
}

let once = false
function do_backup() {
  if (once) return
  once = true
  chart.backup()
  chart.get_backup_list().then((v) => (backups.value = v.sort()))
}
async function delete_backup(name: string) {
  Invoke('delete-backup', { id: chart.id, backup_name: name })
  chart.get_backup_list().then((v) => (backups.value = v.sort()))
}
async function show_backup() {
  Invoke('open-path', { id: chart.id, path: "backup" })
}
</script>

<template>
  <simple-modal size="2">
    <template #header>Load Backup</template>
    <div v-if="backups.length" class="backup-contain">
      <template v-for="i in backups">
        <div>{{ parse_name(i) }}</div>
        <a-button2 msg="加载" @click="load_backup(i)" />
        <a-button2 style="color: #ff8686" msg="删除" @click="delete_backup(i)" />
      </template>
    </div>
    <div v-else class="backup-empty">
      没有备份哦……来一个？
      <a-button2 msg="来！！！" @click="do_backup" />
    </div>
    <template #footer>
      <a-button2 msg="打开备份文件夹" @click="show_backup" />
    </template>
  </simple-modal>
</template>

<style>
.backup-contain {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr;
  gap: 5px;
  justify-items: center;
}
.backup-empty {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}
</style>
