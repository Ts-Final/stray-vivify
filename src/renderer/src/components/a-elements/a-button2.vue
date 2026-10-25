<script lang="ts" setup>
const {msg} = defineProps<{msg: string}>()
</script>

<template>
  <div class="a-button2" v-html="msg" />
</template>

<style scoped>
.a-button2 {
  border-radius: 3px;
  background:var(--purple-bgi);
  line-height: 1.6rem;
  height: 1.6rem;
  cursor: pointer;
  user-select: none;
  padding: 0 5px;
  width: min-content;
  text-wrap: nowrap;
  text-align: center;
  transition: transform 0.1s ease-out;
  display: inline;
}
.a-button2:hover {
  transform: scale(1.1);
}
.a-button2[disabled] {
  cursor: not-allowed;
  pointer-events: none;
  opacity: 0.7;
}
</style>
