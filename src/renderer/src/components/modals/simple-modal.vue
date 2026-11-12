<script lang="ts" setup>
import { useSlots } from 'vue'

import { closeModal } from '@kolirt/vue-modal'

const slots = useSlots()
const props = defineProps({
  title: { type: String, default: '' },
  showClose: { type: Boolean, default: true },
  size: {
    type: String,
    default: '2',
    validator(value: string): boolean {
      return ['1', '2', '3', '4', '5'].includes(value)
    }
  }
})
</script>

<template>
  <div :class="`simple-modal-size-${props.size}`" class="simple-modal-content">
    <div v-if="props.title || props.showClose" class="simple-modal-header">
      <slot name="header">
        <h1 v-if="props.title" class="simple-modal-title">{{ props.title }}</h1>
      </slot>
      <button
        v-if="props.showClose"
        aria-label="Close"
        class="simple-modal-btn-close"
        @click="closeModal()"
      >
        &times;
      </button>
    </div>

    <div class="simple-modal-body">
      <slot></slot>
    </div>

    <div v-if="slots.footer" class="simple-modal-footer">
      <slot name="footer"></slot>
    </div>
  </div>
</template>

<style>
.simple-modal-content {
  background: var(--blue-bgi);
  border-radius: 0.5rem;
  font-family: inherit;
  color: black;

  &.simple-modal-size-1 {
    width: 100%;
    max-width: 35vw;
  }

  &.simple-modal-size-2 {
    width: 100%;
    max-width: 45vw;
  }

  &.simple-modal-size-3 {
    width: 100%;
    max-width: 55vw;
  }

  &.simple-modal-size-4 {
    width: 100%;
    max-width: 65vw;
  }

  &.simple-modal-size-5 {
    width: 100%;
    max-width: 75vw;
  }
  &.simple-modal-size-6 {
    width: 100%;
    max-width: 85vw;
  }
}

.simple-modal-header {
  padding: 0.5rem 1rem;
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #dee2e6;
  border-top-left-radius: 0.5rem;
  border-top-right-radius: 0.5rem;
  background: var(--purple-bgi);
}

.simple-modal-title {
  font-size: 1.25rem;
  font-weight: 500;
  margin: 0;
  user-select: none;
}

.simple-modal-btn-close {
  opacity: 0.5;
  width: 2rem;
  height: 2rem;
  background: transparent center/1em auto no-repeat;
  border: none;
  padding: 0;
  cursor: pointer;
  transition: opacity 200ms ease;
  font-size: 1.8rem;
  line-height: 2rem;

  &:hover {
    opacity: 1;
  }
}

.simple-modal-body {
  padding: 1rem;
}

.simple-modal-footer {
  padding: 1rem;
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  border-bottom-left-radius: 0.5rem;
  border-bottom-right-radius: 0.5rem;
  border-top: 1px solid #dee2e6;
  gap: 0.25rem;

  & > * {
    margin: 0.25rem;
  }
}
</style>
