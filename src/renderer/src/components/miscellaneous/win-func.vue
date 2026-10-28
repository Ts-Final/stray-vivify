<script lang="ts" setup>
import { GlobalStat } from '@renderer/core/globalStat'

const ipcRenderer = window.electron.ipcRenderer
const isMax = GlobalStat.window_max_state

function min() {
  ipcRenderer.send('window-min')
  GlobalStat.update_window_max_state()
}
function max() {
  ipcRenderer.send('window-max')
  GlobalStat.update_window_max_state()
}
function close() {
  GlobalStat.close_app()
}
</script>

<template>
  <div class="header-win-func">
    <div @click="min">0</div>
    <div v-if="isMax" @click="max">2</div>
    <div v-else @click="max">1</div>
    <div class="header-close" @click="close">r</div>
  </div>
</template>

<style scoped>
.header-win-func {
  height: 100%;
  -webkit-app-region: no-drag;
  font-family: Webdings, sans-serif;
  display: flex;
  background-color: rgb(32, 33, 70);
  z-index: var(--z-highest);
}

.header-win-func > div {
  width: 4rem;
  text-align: center;
  transition: all 0.2s linear;
  box-sizing: border-box;
  cursor: pointer;
  color: #b8dcee;
  height: 100%;
  line-height: var(--header-height);
}

.header-close:hover {
  background-color: #ff1145;
  color: #0d1418;
}
</style>
