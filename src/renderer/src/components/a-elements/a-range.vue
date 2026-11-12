<script lang="ts" setup>
type accept = number | string
const props = defineProps<{ min: accept; max: accept; step?: accept }>()

const step = props.step ?? 1
const model = defineModel<number>()
</script>

<template>
  <input class="a-range" v-model.number="model" :max="max" :min="min" :step="step" type="range" />
</template>

<style>
input.a-range {
  width: 80%;
  appearance: none;
  background-color: transparent;
  height: 20px;
  position: relative;
  contain: inline-size paint style;
}

input.a-range::-webkit-slider-container {
  width: 100%;
  border: 1px solid var(--grey);
  border-radius: 0;
  position: relative;
  padding: 0 5px;
}

input.a-range::-webkit-slider-runnable-track {
  border: none;
  border-radius: 0;
  background-color: transparent;
  height: 100%;
}

input.a-range::-webkit-slider-thumb {
  border-radius: 0;
  appearance: none;
  width: 4px;
  height: 100%;
  box-sizing: border-box;
  border: 2px solid #b8dcee;
}
</style>
