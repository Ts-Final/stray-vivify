<script lang="ts" setup>
import { EditorTools } from '@renderer/core/chart/select-tools'
import { ref } from 'vue'
import ANumberInput from '@renderer/components/a-elements/a-number-input.vue'
import ACheckbox from '@renderer/components/a-elements/a-checkbox.vue'
import { NoteClipboard } from '@renderer/core/misc/note-clipboard'
import { RefreshAll } from '@renderer/core/misc/refresh-all'

const selectedNID = () => NoteClipboard.selected
const toolMultiArgs = ref({
  multiVal: 1,
  baseZero: false
})
console.log(toolMultiArgs.value)
const rkey = RefreshAll.generate_key('select')
</script>

<template>
  <div v-show="selectedNID().length > 0" :key="rkey" class="fn-edit-tools-frame">
    <p style="text-align: center">想做些什么呢？</p>
    <div class="fn-edit-tools-button-frame">
      <div>
        <div class="fn-edit-tools-button" @click="EditorTools.mirror(selectedNID())">对称</div>
      </div>
      <div>
        <div
          class="fn-edit-tools-button"
          @click="
            EditorTools.mutiplier(selectedNID(), toolMultiArgs.multiVal, toolMultiArgs.baseZero)
          "
        >
          TimeMultiply
        </div>
        <a-number-input
          v-model="toolMultiArgs.multiVal"
          :min="0.1"
          :step="0.1"
          style="max-width: 6rem"
        />
        <label class="ln2" style="grid-column: span 1">0ms base</label>
        <a-checkbox v-model="toolMultiArgs.baseZero" class="ln2" style="grid-column: span 1" />
      </div>
    </div>
  </div>
</template>

<style>
.fn-edit-tools-frame {
  padding-top: 0;
}

.fn-edit-tools-button-frame {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.fn-edit-tools-button-frame > div {
  display: flex;
  flex-direction: row;
  justify-content: space-evenly;
  align-items: center;
}

.fn-edit-tools-button {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0.5rem;
}

.fn-edit-tools-button:hover {
  transition: background-color 0.2s;
  background-color: rgba(200, 200, 200, 0.2);
}
</style>
