<script lang="ts" setup>
defineProps<{msg: string}>()
</script>

<template>
  <div class="settings-header" v-html="msg"/>
</template>

<style>
.settings-header {
  font-size: 1.5rem;
  font-weight: bold;
  line-height: 2rem;
  text-align: left;
  display: block !important;
  margin-top: 25px;
  grid-column: span 2;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding-bottom: 5px;
}
</style>
