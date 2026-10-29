<script lang="ts" setup>
import Header from '@renderer/components/miscellaneous/header.vue'
import { ModalTarget } from '@kolirt/vue-modal'
import AButton from '@renderer/components/a-elements/a-button.vue'
import ChartList from '@renderer/components/chart-list.vue'
import ChartV2 from '@renderer/components/chart-v2/chart-v2.vue'
import { Storage, Version } from '@renderer/core/storage'
import WordHelperOverlay from '@renderer/components/miscellaneous/word-helper-overlay.vue'
import MouseTracker from '@renderer/components/miscellaneous/mouse-tracker.vue'
import { modal } from '@renderer/core/misc/modal'
import { RefreshAll } from '@renderer/core/misc/refresh-all'
import { computed } from 'vue'
import PreInitPage from '@renderer/components/miscellaneous/pre-init-page.vue'
import HeaderV2 from '@renderer/components/miscellaneous/header-v2.vue'
import LoadSongPage from '@renderer/components/miscellaneous/load-song-page.vue'
import { route } from '@renderer/core/misc/route'

const state = route.route
// @ts-ignore i just dont understand why this sucks
const app_key = RefreshAll.generate_key('app')

const show_version = computed(() => {
  if (Storage.settings.always_version) return true
  else return state.value != 'editor'
})
</script>

<template>
  <template v-if="state == 'start'">
    <Header />
    <ChartList v-if="state == 'start'" />
  </template>
  <template v-else-if="state == 'editor'">
    <HeaderV2 />
    <ChartV2 />
  </template>
  <pre-init-page v-else-if="state == 'preinit'" />
  <load-song-page v-else-if="state == 'load-song'" />
  <ModalTarget />
  <div id="n-c" class="notify-container" />
  <a-button
    v-if="show_version"
    :msg="`Version: ${Version.str}`"
    class="--build"
    @click="modal.VersionsModal.show({})"
  />
  <WordHelperOverlay />
  <MouseTracker />
</template>
<style scoped>
.--build {
  position: fixed;
  right: 0;
  bottom: 0;
  border: 1px solid #b8dcee;
  background: var(--darker-bgi);
  box-shadow: none;
}
</style>

<style>
#n-c {
  position: absolute;
  right: 5px;
  top: var(--header-height);
  z-index: var(--z-highest);
  align-items: end;
  margin-top: 10px;
}

.notify-container > div {
  max-width: 350px;
  padding: 0 15px;
  line-height: 2em;
  font-size: 1.2rem;
  margin: 5px 0;
}

.notify-box {
  max-width: 300px;
  margin-top: 0.2rem;
  padding: 0.5rem 1.5rem;
  animation-fill-mode: both;
  border: 2px solid;
}

.notify-normal {
  background-color: #b8dcee;
  color: #000000;
  border-color: #16ccae;
}

.notify-error {
  background-color: #943430;
  color: #b8dcee;
  border-color: #b60000;
}

.notify-success {
  background-color: #f7f12c;
  color: #000000;
  border-color: #bbb516;
}

.notify-a-enter {
  animation: notify-enter 0.3s ease-in;
}

@keyframes notify-enter {
  0% {
    transform: translateX(125%);
  }
  50% {
    transform: translateX(2rem);
  }
  75% {
    transform: translateX(-1rem);
  }
  100% {
    transform: translateX(0);
  }
}

.notify-a-leave {
  animation: notify-leave 0.3s ease-out;
}

@keyframes notify-leave {
  0% {
    transform: translateX(0);
  }
  50% {
    transform: translateX(-1rem);
  }
  75% {
    transform: translateX(2rem);
  }
  100% {
    transform: translateX(125%);
  }
}
</style>

<style>
:root,
body {
  background-image: var(--blue-bgi);
  margin: 0;
  display: flex;
  place-items: center;
  min-width: 320px;
  height: 100%;
  width: 100vw;
  position: relative;
  left: 0;
  top: 0;
  overflow: hidden;

  --darker-bgi: linear-gradient(60deg, #0d1418 0%, #11161b 100%);
  --blue-bgi: linear-gradient(220.55deg, #34495d 0%, #0e2c5e 100%);
  --purple-bgi: linear-gradient(90deg, rgba(32, 33, 70, 1) 0%, rgba(37, 49, 50, 1) 100%);
  --green-bgi: linear-gradient(220.55deg, #97e8b5 0%, #5cb67f 100%);
  --gray-bgi: linear-gradient(220.55deg, #afcccb 0%, #616566 100%);
  --dark-bgi: linear-gradient(1.83rad, #1e1e1ed6 0%, #1f1d1d 14%, #1f1d1d 80%, #171717d6 100%);
  --grey: #3b4652;
  --z-highest: 100;
  --h-l-b: 80px;

  --z-background: -1;

  --z-tick-circle: 100;
  --z-preview-result: 101;

  --z-modal-target: 200;
  --z-word-helper: 201; /* because the vue-modal is 200*/
  --z-header: 202;
  --z-mouse-tracker: 203;

  --header-font-size: 1.2rem;
  --header-line-height: 2rem;
  --header-height: 2rem;

  --button-base: #000;
  --button-hover: #444;

  --stat-lightness: 50%;
}
#app {
  height: 100vh;
  width: 100vw;
  overflow: hidden;
}

code {
  line-height: 1em;
  font-size: 1rem;
}
</style>
