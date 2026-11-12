<script lang="ts" setup>
const model = defineModel()
</script>

<template>
  <input class="a-text-input" v-model="model" spellcheck="false" type="text" />
</template>

<style>
input.a-text-input {
  background-color: transparent;
  outline: none;
  border: none;
  font-size: 1rem;
  line-height: 1rem;
  text-align: center;
  border-bottom: 1px solid transparent;
}
input.a-text-input:focus {
  border-bottom: 1px solid var(--grey);
}
input.a-text-input[disabled] {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
