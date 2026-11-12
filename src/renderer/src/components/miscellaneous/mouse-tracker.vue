<script lang="ts" setup>
import { computed } from 'vue'
import { Storage } from '@renderer/core/storage'
import { MouseTracker } from '@renderer/core/misc/inspector'

const pos = MouseTracker.mouse_pos
const sty = computed(() => `top: ${pos.value.y}px; left: ${pos.value.x}px;`)
const shown = computed(() => Storage.data.value.settings.mouse_tracker)
</script>

<template>
  <div v-if="shown" :style="sty" class="mouse-tracker"></div>
</template>

<style>
.mouse-tracker {
  z-index: var(--z-mouse-tracker);
  position: absolute;
  transform: translate(-50%, -50%);
  border: 6px solid #ff6363;
  pointer-events: none;
  border-radius: 6px;
}
</style>
