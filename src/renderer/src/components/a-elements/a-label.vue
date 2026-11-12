<script lang="ts" setup>
const { label } = defineProps<{
  label: string
}>()
</script>

<template>
  <div class="a-label">
    <slot />
    <span v-html="label" />
  </div>
</template>

<style>
.a-label {
  display: flex;
  align-items: flex-start;
  width: min-content;
  margin-left: 0.5em;
}
.a-label span {
  text-wrap: nowrap;
  text-align: left;
  vertical-align: center;
}
</style>
