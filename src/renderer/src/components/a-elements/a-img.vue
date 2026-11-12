<script lang="ts" setup>
import { ref } from 'vue'

const shown = ref(true)
defineProps<{ src: string }>()
</script>

<template>
  <img v-bind="$attrs" v-if="shown" :src="src" alt="" @error="shown = false" />
  <slot v-else v-bind="$attrs"></slot>
</template>
