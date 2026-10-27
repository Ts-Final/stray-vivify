<script lang="ts" setup>
import { Preinit } from '@renderer/core/misc/preinit'
import { GlobalStat } from '@renderer/core/globalStat'
import './loading.css'
import AButton2 from '@renderer/components/a-elements/a-button2.vue'
import { Invoke } from '@renderer/core/ipc'
import { route } from '@renderer/core/misc/route'

const stages = Preinit.Stages
const finished = Preinit.finished
const ipcRenderer = window.electron.ipcRenderer
</script>

<template>
  <div class="preinit-wrapper">
    <div class="preinit">
      <div class="preinit-title">
        <div>stray-vivify</div>
        <div>loading...</div>
      </div>
      <div class="load-stages">
        <div class="load-header">Load Progress</div>
        <div>Load Settings</div>
        <div>{{ stages.load_settings }}</div>
        <div>Load All Chart</div>
        <div>{{ stages.all_chart }}</div>
        <div>Load Debugs</div>
        <div>{{ stages.debugs }}</div>
        <div>Load Intervals</div>
        <div>{{ stages.intervals }}</div>
        <div>Load Animation Frame</div>
        <div>{{ stages.animation_frame }}</div>
        <div>Load Skin</div>
        <div>{{ stages.check_skin }}</div>
      </div>
      <div class="win-func">
        <div @click="ipcRenderer.send('window-min')">0</div>
        <div @click="ipcRenderer.send('window-max')">1</div>
        <div class="header-close" @click="GlobalStat.close_app()">r</div>
      </div>
      <div>如果在某个阶段一直卡住说明大概率是出bug了。请检查控制台。</div>
      <div>
        <a-button2 msg="打开控制台" @click="Invoke('open-dev')" class="rainbow-text-color" />
      </div>
      <br />
      <template v-if="finished">
        <div>加载阶段已经结束。此提示只会在以上阶段未能全部正确加载时出现。</div>
        <div>如果强行启动其实也没什么问题。这几个缺失都不会炸掉你的谱。</div>
        <div>可以截图控制台发我修bug。</div>
        <a-button2 msg="强行启动！" @click="route.change('start')" />
      </template>
    </div>
  </div>
</template>
