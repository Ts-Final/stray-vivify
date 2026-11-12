<script lang="ts" setup>
import { ref } from 'vue'

const bind = defineModel<string[]>({ required: true })
const input = ref('')

function rm_artist(i: number) {
  bind.value.splice(i, 1)
}
function add_artist() {
  if (input.value.length == 0) return
  bind.value.push(input.value)
  input.value = ''
}
</script>

<template>
  <div>曲师列表</div>
  <div class="custom-artist-input">
    <div v-for="(artist, i) in bind" class="custom-artist-single" @click="rm_artist(i)">
      {{ artist }}
    </div>
    <input v-model="input" placeholder="按enter以添加" type="text" @keyup.enter="add_artist" />
  </div>
</template>

<style>
.custom-artist-input {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  grid-column: 1 / span 2;
  max-width: 85%;
  gap: 0 5px;
}

.custom-artist-single {
  background: rgba(20, 30, 40, 0.6);
  backdrop-filter: blur(10px);
  padding-right: 1.1rem;
  padding-left: 0.5rem;
  line-height: 1.5rem;
  height: 1.5rem;
}

.custom-artist-single::after {
  content: '×';
  position: absolute;
  right: 0;
  border-radius: 50%;
  top: 0.25rem;
  height: 1rem;
  width: 1rem;
  line-height: 1rem;
  text-align: center;
  color: #b8dcee;
}
.custom-artist-single:hover::after {
  background: #b8dcee;
  color: black;
}
.custom-artist-input input {
  line-height: 1rem;
  font-size: 1rem;
  flex-grow: 1;
  max-width: 90%;
  appearance: none;
  background-color: transparent;
  outline: none;
  border: none;
  text-align: center;
  border-bottom: 1px solid transparent;
  height: 1.5rem;
}
.custom-artist-input input:focus {
  border-bottom: 1px solid var(--grey);
}
</style>
