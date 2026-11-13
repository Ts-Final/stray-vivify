<script lang="ts" setup>
import ATextInput from '@renderer/components/a-elements/a-text-input.vue'

const model = defineModel<string>()
const { name, disabled } = defineProps<{ name: string; disabled?: boolean }>()
</script>

<template>
  <div class="song-info-single">
    <div :data-disabled="disabled">{{ name }}</div>
    <a-text-input v-model.trim="model" :disabled="disabled" class="sis-input" />
  </div>
</template>

<style>
.sis-input.a-text-input {
  border-bottom: 1px solid #b8dcee77;
  width: 90%;
}
.song-info-single div {
  user-select: none;
}
.song-info-single div[data-disabled='true'] {
  opacity: 0.6;
}
</style>
