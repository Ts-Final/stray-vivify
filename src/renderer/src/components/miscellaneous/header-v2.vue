<script lang="ts" setup>
import { GlobalStat } from '@renderer/core/globalStat'
import { modal } from '@renderer/core/misc/modal'
import { Chart } from '@renderer/core/chart/chart'
import { Invoke } from '@renderer/core/ipc'
import { RefreshAll } from '@renderer/core/misc/refresh-all'
import './header.css'
import WinFunc from '@renderer/components/miscellaneous/win-func.vue'
import { route } from '@renderer/core/misc/route'

const active = defineModel<number>()

const song_name = GlobalStat.refs.header_display

function do_refresh() {
  RefreshAll.refreshAll()
}

function close_chart() {
  if (Chart.current) {
    Chart.current.save()
    Chart.current.audio.pause()
    Chart.current.stop()
    Chart.current.diff.stop()
  }
  Chart.current = undefined
  route.change('start')
  Invoke('set-process-name', { name: 'stray/vivify' })
}
function open_exporter() {
  modal.IExporterModal.show({})
}
function open_custom() {
  modal.ExportCustomModal.show({})
}
function open_backup() {
  modal.LoadBackupModal.show({})
}
function open_chart_folder() {
  Invoke('open-path', { id: Chart.current?.id ?? '', path: '' })
}

function start_play() {
  Chart.$current.init_playfield()
  route.setTab(4)
}
function start_play_now() {
  Chart.$current.init_playfield(true)
  route.setTab(4)
}
function start_preview() {
  route.setTab(3)
}

function is_active(i: number, i1: number) {
  return i == i1 ? 'header-active' : ''
}

const tab = route.tab
</script>

<template>
  <div v-if="tab < 3" class="header-wrapper">
    <div class="header-top">
      <img alt="wug" class="header-yq" src="/yq.jpg" />
      <div class="header-menu-ul">
        <div class="h-menu-btn-text">工具</div>
        <div class="h-menu-btn-i">
          <div class="h-menu-btn-text" @click="open_exporter">导入/导出</div>
          <div class="h-menu-btn-text" @click="open_custom">Custom</div>
          <div class="h-menu-btn-text" @click="open_backup">加载备份</div>
          <div class="h-menu-btn-text" @click="open_chart_folder">打开谱面文件夹</div>
          <div class="h-menu-btn-text h-menu-btn-i-sep" @click="modal.SettingModal.show({})">
            设置
          </div>
          <div class="h-menu-btn-text" @click="do_refresh">刷新</div>
          <div class="h-menu-btn-text" @click="close_chart">关闭文件</div>
          <div class="h-menu-btn-text" @click="modal.H2PModal.show({})">帮助</div>
        </div>
      </div>
      <div :class="is_active(tab, 0)" class="header-menu-ul" @click="active = 1">
        <div class="h-menu-btn-text">曲目</div>
      </div>
      <div :class="is_active(tab, 1)" class="header-menu-ul" @click="active = 2">
        <div class="h-menu-btn-text">编排</div>
      </div>
      <div :class="is_active(tab, 2)" class="header-menu-ul" @click="active = 3">
        <div class="h-menu-btn-text">时轴</div>
      </div>
      <div class="header-menu-ul" @click="start_preview">
        <div class="h-menu-btn-text">预览</div>
      </div>
      <div class="header-menu-ul">
        <div class="h-menu-btn-text" @click="start_play">试玩</div>
        <div class="h-menu-btn-i">
          <div class="h-menu-btn-text" @click="start_play_now">从当前时间开始</div>
        </div>
      </div>
      <div class="chart-name">{{ song_name }}</div>
    </div>
    <win-func />
  </div>
</template>
