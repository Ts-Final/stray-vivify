<script lang="ts" setup>
import { ref } from 'vue'

const props = defineProps({
  def: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: ''
  }
})
const slots = defineSlots<{
  default: () => void
}>()
const shown = ref(props.def)
</script>

<template>
  <div class="hide-header" @click="shown = !shown">
    {{ props.title }} {{ shown ? '&#128899;' : '&#128897;' }}
  </div>
  <slot v-if="shown"></slot>
</template>

<style>
.hide-header {
  width: 100%;
  line-height: 3rem;
  border-bottom: 1px solid #b8dcee;
  text-align: center;
  cursor: pointer;
  font-size: 1.4rem;
  margin-bottom: 1rem;
}
</style>
