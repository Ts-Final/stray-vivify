<script generic="T" lang="ts" setup>
import { computed } from 'vue'

const props = defineProps<{
  // cb: (n: T) => void
  options: { val: T; display: string }[] | T[],
  maxh?: string
}>()
const model = defineModel<T>()

const option: { val: T; display: string }[] = (() => {
  if (props.options.length == 0) return []
  if (typeof props.options[0] == 'object') {
    return props.options
  } else {
    return props.options.map((v) => {
      return { val: v, display: v }
    })
  }
})() as { val: T; display: string }[]

const val = computed(() => {
  return option.find((v) => v.val == model.value)?.display
})

const on_click = (val: T) => {
  model.value = val
}
const option_class = computed(() => (props.maxh ? 'a-select-ovf' : ''))
const maxh = props.maxh
</script>

<template>
  <div class="a-select">
    <div class="a-select-value" v-html="val" />
    <div class="a-select-option-wrapper" :class="option_class">
      <div v-for="o in option" class="a-select-option" @click="() => on_click(o.val)" v-html="o.display" />
    </div>
  </div>
</template>

<style>
.a-select {
  display: inline-block;
  min-width: 120px;
  width: max-content;
  text-align: left;
  user-select: none;
  position: relative;
  padding-left: 1em;
  border: 1px solid;
  margin: 0 10px;
  padding-right: 20px;
  height: min-content;
  padding-bottom: 2px;
}
.a-select-value {
  text-overflow: ellipsis;
}
.a-select-value:after {
  content: '\25BC';
  position: absolute;
  right: 2px;
  height: 100%;
  top: 50%;
  transform: translateY(-50%) scale(0.6);
  text-align: center;
}

.a-select-option-wrapper {
  background: var(--darker-bgi);
  display: flex;
  flex-direction: column;
  position: absolute;
  transition: 0.1s linear opacity;
  top: calc(1em + 5px);
  border: 1px solid var(--grey);
  min-width: 100%;
  left: 0;
  box-sizing: border-box;
  opacity: 0;
  pointer-events: none;
}

.a-select:hover .a-select-option-wrapper {
  opacity: 1;
  pointer-events: all;
  z-index: var(--z-highest);
}

.a-select-option {
  background-color: transparent;
  line-height: 1.5em;
  text-align: left;
  padding-left: 1rem;
  padding-right: 1rem;
  transition: all 0.1s linear;
  width: calc(100% - 2rem);
  white-space: nowrap;
}
.a-select-option:hover {
  filter: brightness(1.1);
  background-color: #3b4652;
}
.a-select-ovf {
  overflow: auto;
  max-height: v-bind(maxh);
}
</style>
