<script lang="ts" setup>
const v = defineModel<boolean>()
</script>

<template>
  <div :class="`a-checkbox2-${v ? 'y' : 'n'}`" class="a-checkbox2" @click="v = !v">
    <div class="a-checkbox2-button" />
  </div>
</template>

<style>
.a-checkbox2 {
  position: relative;
  width: 2rem;
  --a-checkbox2-height: 1rem;
  height: 1rem;
  border-radius: 0.75rem;
  border: 1px solid gray;
  transition: background-color 0.1s ease;
  cursor: pointer;
}
.a-checkbox2-y {
  background: #0f0;

  > .a-checkbox2-button {
    left: 1rem;
  }
}
.a-checkbox2-n {
  background: #f00;
  > .a-checkbox2-button {
    left: -0.4rem;
  }
}
.a-checkbox2-button {
  position: absolute;
  width: 1.4rem;
  height: 1.4rem;
  border-radius: 50%;
  background: #f8fcff;
  box-shadow: 0 0 2px rgba(0, 0, 0, 0.3) inset;
  display: flex;
  align-items: center;
  justify-content: center;
  top: -0.2rem;
  vertical-align: center;
  transition: left 0.1s ease;
  color: black;
}
</style>
