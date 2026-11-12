<script lang="ts" setup>
import { onUnmounted, useTemplateRef } from 'vue'
import { WordHelper } from '@renderer/core/word-helper'

const prop = defineProps<{
  msg?: string
  dec?: string
}>()
const r = useTemplateRef('wh')
let flag = false
function _in(e:MouseEvent) {
  if (!r.value) return
  const rect = (r.value.children[0] ?? e.target).getBoundingClientRect()
  WordHelper.call_helper([rect.right, rect.bottom], prop.dec || '')
  flag = true
}
function _out() {
  WordHelper.hide_helper()
  flag = false
}
onUnmounted(() => {
  if (flag) WordHelper.hide_helper()
})
</script>

<template>
  <span ref="wh" @mouseenter="_in" @mouseleave="_out" class="word-helper">
    <slot>
      <span v-html="msg" />
    </slot>
  </span>
</template>

<style>
.word-helper {
  text-decoration: underline #b8dcee 1px;
  cursor: help;
  user-select: none;
}
</style>
