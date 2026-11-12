<script lang="ts" setup>
const props = defineProps<{
  min?: number | string
  max?: number | string
}>()

const model = defineModel<number>({ required: true })

function clamp(value: number): number {
  let clamped = value
  if (props.min !== undefined) clamped = Math.max(Number(props.min), clamped)
  if (props.max !== undefined) clamped = Math.min(Number(props.max), clamped)
  return clamped
}

function handleInput(e: Event) {
  const input = e.target as HTMLInputElement
  const rawValue = input.value

  if (rawValue === '') {
    input.placeholder = String(model.value)
    return
  }

  const num = Number(rawValue)
  if (!isNaN(num)) {
    if (clamp(num) == num) model.value = num
  }
}

function wheel(e: WheelEvent) {
  if (e.target instanceof HTMLInputElement) {
    e.target.blur()
    const delta = Math.sign(e.deltaY)
    model.value = clamp(model.value - delta)
    e.target.value = String(model.value)
    e.target.focus()
  }
}
</script>

<template>
  <input
    :value="model"
    type="number"
    :min="min"
    :max="max"
    @input="handleInput"
    @wheel.passive.prevent="wheel"
    class="a-number-input"
  />
</template>

<style>
input.a-number-input {
  background-color: transparent;
  outline: none;
  border: none;
  font-size: 1rem;
  line-height: 1rem;
  text-align: center;
  border-bottom: 1px solid transparent;
  box-sizing: border-box;
}
input.a-number-input:focus {
  border-bottom: 1px solid var(--grey);
}
input.a-number-input::-webkit-outer-spin-button,
input.a-number-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
input.a-number-input[disabled] {
  cursor: not-allowed;
  opacity: 0.6;
}
</style>
