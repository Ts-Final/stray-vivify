<script lang="ts" setup>
import ACheckbox from '@renderer/components/a-elements/a-checkbox.vue'
import SmallDiffChoice from '@renderer/components/chart-v2/chart-tabs/small/small-diff-choice.vue'
import { computed, ComputedRef } from 'vue'
import { ChartTypeV2 } from '@preload/chart-types'
import { utils } from '@renderer/core/utils'
import SmallRefChoice from '@renderer/components/chart-v2/chart-tabs/small/small-ref-choice.vue'
import { NoteClipboard } from '@renderer/core/misc/note-clipboard'

import { NoteProps } from '@renderer/core/misc/note-props'
import { RefreshAll } from '@renderer/core/misc/refresh-all'
import { NoteType } from '@renderer/core/misc/note-type'

const { width, s, hold, b } = NoteType

const pending_note = computed(() => {
  if (hold.value) {
    return {
      time: 0,
      lane: 0,
      width: width.value,
      ani: []
    }
  } else {
    return {
      time: 0,
      lane: 0,
      width: width.value,
      ani: [],
      snm: NoteType.snm
    }
  }
}) as ComputedRef<ChartTypeV2.note>
const select = () => NoteClipboard.selected
const rkey = RefreshAll.generate_key('select')
const mt = (note: ChartTypeV2.note) => 'len' in note ? note.len + note.time : note.time
</script>

<template>
  <div class="fn-note-list">
    <small-diff-choice />
    <small-ref-choice />
    <div class="fn-note-width">
      <span>note宽</span>
      <div
        :class="width == 1 ? 'fn-note-chosen' : ''"
        class="fn-note-width-btn"
        @click="NoteType.set_width(1)"
      >
        1
      </div>
      <div
        :class="width == 2 ? 'fn-note-chosen' : ''"
        class="fn-note-width-btn"
        @click="NoteType.set_width(2)"
      >
        2
      </div>
      <div
        :class="width == 3 ? 'fn-note-chosen' : ''"
        class="fn-note-width-btn"
        @click="NoteType.set_width(3)"
      >
        3
      </div>
      <div
        :class="width == 4 ? 'fn-note-chosen' : ''"
        class="fn-note-width-btn"
        @click="NoteType.set_width(4)"
      >
        4
      </div>
    </div>
    <div class="fn-note-snb">
      <s>SBLN</s>
      <div>
        <a-checkbox v-model="s"></a-checkbox>
        S
      </div>
      <div>
        <a-checkbox v-model="b"></a-checkbox>
        B
      </div>
      <div>
        <a-checkbox v-model="hold"></a-checkbox>
        长条
      </div>
    </div>
    <div v-if="width == 0" :key="rkey" class="fn-note-select-wrapper">
      <div v-if="select().length == 0" class="fn-note-select">Select</div>
      <div v-else>
        <div>
          <div>已选中 {{ select().length }}</div>
          <div>
            {{ select().length }} notes (
            <template v-if="select().filter((x) => 'snm' in x).length">
              {{ select().filter((x) => 'snm' in x).length }}米
            </template>
            <template v-if="select().filter((x) => 'len' in x).length">
              {{ select().filter((x) => 'len' in x).length }}面
            </template>
            )
          </div>
          <div>
            {{ utils.toTimeStr(Math.min(...select().map((x) => x.time)) / 1000) }}
            ~
            {{ utils.toTimeStr(Math.max(...select().map(mt)) / 1000) }}
          </div>
        </div>
      </div>
    </div>
    <div v-else class="fn-note-pending">
      <img
        :alt="NoteProps.base_src(pending_note)"
        :src="NoteProps.getSrc(pending_note)"
        style="position: static"
      />
    </div>
  </div>
</template>

<style>
.fn-note-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 15px;
  padding-top: 10px;
}

.fn-note-width {
  display: grid;
  grid-template-columns: 2fr repeat(4, 1fr);
  gap: 5px;
}

.fn-note-width > div,
.fn-note-width > span,
.fn-note-snb > div,
.fn-note-snb > s {
  text-align: center;
  line-height: 1.5rem;
  height: 1.5rem;
}

.fn-note-width > div {
  cursor: pointer;
  transition: background-color 0.2s;
}

.fn-note-width > div:hover,
.fn-note-chosen {
  background: var(--button-hover);
}

.fn-note-snb {
  display: grid;
  grid-template-columns: 3fr 2fr 2fr 2fr;
  gap: 5px;
}

.fn-note-pending {
  display: flex;
  position: relative;
  justify-content: center;
}

.fn-note-pending > img {
  position: relative;
  max-width: 90%;
}

.fn-note-select-wrapper {
  width: 100%;
  text-align: center;
}

.fn-note-select {
  color: gray;
  font-style: italic;
}

.fn-note-counter-inner div:nth-child(2n + 1) {
  text-align: right;
}

.fn-note-counter-inner div:nth-child(2n + 2) {
  text-align: left;
}
</style>
