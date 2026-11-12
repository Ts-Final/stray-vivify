<script lang="ts" setup>
import { WordHelper } from '@renderer/core/word-helper'

const { word, shown, position } = WordHelper
</script>

<template>
  <transition name="fade-0.2">
    <div
      v-if="shown"
      :style="{ left: position[0] + 'px', top: position[1] + 'px' }"
      class="word-helper-overlay"
      v-html="word"
    />
  </transition>
</template>

<style>
.word-helper-overlay {
  position: absolute;
  z-index: var(--z-word-helper);
  background: var(--darker-bgi);
  padding: 5px 15px;
  border: 2px solid #b8dcee;
  user-select: none;
  pointer-events: none;
  max-width: 40vw;
}
</style>
