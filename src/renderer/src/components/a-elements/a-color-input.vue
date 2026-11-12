<script lang="ts" setup>
const model = defineModel<string>()
</script>

<template>
  <div class="a-color-input">
    <input
      v-model="model"
      type="color"
      class="a-color-input"
    />
    <div>{{ model }}</div>
  </div>
</template>

<style>
div.a-color-input {
  display: grid;
  grid-template-columns: 1fr 1fr;
}
input.a-color-input {
  border: none;
  cursor: pointer;
  box-shadow: 0 0 2px white;
  text-align: right;
  justify-self: center;
}
.a-color-input div {
  user-select: none;
  text-align: left;
}
</style>
