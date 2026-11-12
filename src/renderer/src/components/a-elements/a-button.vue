<script lang="ts" setup>
const { msg } = defineProps<{
  msg: string
}>()
</script>

<template>
  <div class="a-button" v-html="msg" />
</template>

<style>
.a-button {
  display: inline-block;
  cursor: pointer;
  color: #b8dcee;
  background: var(--darker-bgi);
  user-select: none;
  border-radius: 5px;
  border: 2px solid transparent;
  box-shadow: black 0 0 5px;
  transition: all 0.1s linear;
  padding: 2px 5px;
  z-index: var(--z-highest);
  text-align: center;
}
.a-button:hover {
  transform: scale(1.1);
}
</style>
