<script lang="ts" setup>
import { modal } from '@renderer/core/misc/modal'
import { Invoke } from '@renderer/core/ipc'
import { GlobalStat } from '@renderer/core/globalStat'
import './header.css'
import WinFunc from '@renderer/components/miscellaneous/win-func.vue'

async function import_svc() {
  const fp = await Invoke('ask-file', { file: ['Chart', 'zip', 'svc'] })
  if (!fp) return
  const id = (await modal.AskIdModal.show({ all: GlobalStat.all_chart.map((x) => x.id) })) as
    undefined | string
  if (!id) return
  await Invoke('import-zip', { fp: fp, id: id })
  await GlobalStat.update_all_chart()
}
async function import_osz() {
  const fp = await Invoke('ask-file', { file: ['OSZ', 'osz'] })
  if (!fp) return
  const id = (await modal.AskIdModal.show({ all: GlobalStat.all_chart.map((x) => x.id) })) as
    undefined | string
  if (!id) return
  await Invoke('import-osz', { fp: fp, id: id })
  await GlobalStat.update_all_chart()
}
async function import_vsp() {
  const fp = await Invoke('ask-file', { file: ['VSP', 'vsp', 'zip'] })
  if (!fp) return
  const id = (await modal.AskIdModal.show({ all: GlobalStat.all_chart.map((x) => x.id) })) as
    undefined | string
  if (!id) return
  await Invoke('import-vsp', { fp: fp, id: id })
  await GlobalStat.update_all_chart()
}
async function import_mcz() {
  const fp = await Invoke('ask-file', { file: ['MCZ', 'mcz'] })
  if (!fp) return
  const id = (await modal.AskIdModal.show({ all: GlobalStat.all_chart.map((x) => x.id) })) as
    undefined | string
  if (!id) return
  await Invoke('import-mcz', { fp: fp, id: id })
  await GlobalStat.update_all_chart()
}
</script>

<template>
  <div class="header-wrapper">
    <div class="header-top">
      <img alt="wug" class="header-yq" src="/yq.jpg" />
      <div class="header-menu-ul">
        <div class="h-menu-btn-text" @click="modal.SettingModal.show({})">设置</div>
      </div>
      <div class="header-menu-ul">
        <div class="h-menu-btn-text">导入</div>
        <div class="h-menu-btn-i">
          <div class="h-menu-btn-text" @click="import_svc">svc</div>
          <div class="h-menu-btn-text" @click="import_vsp">vsp</div>
          <div class="h-menu-btn-text" @click="import_osz">osz</div>
          <div class="h-menu-btn-text" @click="import_mcz">mcz</div>
        </div>
      </div>
      <div class="header-menu-ul">
        <div class="h-menu-btn-text" @click="modal.H2PModal.show({})">帮助</div>
      </div>
      <div class="header-draggable" />
    </div>
    <win-func />
  </div>
</template>

<style scoped>
.h-menu-btn-i > .h-menu-btn-text {
  font-size: 1rem;
  text-align: center;
}
</style>
