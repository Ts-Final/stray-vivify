<script lang="ts" setup>
import AButton from '@renderer/components/a-elements/a-button.vue'
import ACheckbox from '@renderer/components/a-elements/a-checkbox.vue'
import ANumberInput from '@renderer/components/a-elements/a-number-input.vue'
import ATextInput from '@renderer/components/a-elements/a-text-input.vue'
import CustomArtistList from '@renderer/components/modals/custom-artist-list.vue'
import { CustomSongInfo } from '@preload/types'

const info_data = defineModel<CustomSongInfo>('info', { required: true })
const is_backstage = defineModel<boolean>('is_backstage', { default: false })
const emit = defineEmits<{
  (e: 'next'): void
}>()
const STR = ['Opening', 'Middle', 'Finale', 'Encore']
defineProps<{
  filter_STR: () => number[]
  diff_indexs: number[]
}>()
</script>

<template>
  <div class="custom-info">
    <div class="custom-info-json">
      <div class="custom-info-header">曲目信息</div>
      <div>ID</div>
      <a-text-input v-model="info_data.chart_id" />
      <div>名称</div>
      <a-text-input v-model="info_data.name" />
      <div>格式化名称</div>
      <a-text-input v-model="info_data.formatted_name" />
      <div>曲师</div>
      <a-text-input v-model="info_data.artist" />
      <custom-artist-list v-model="info_data.sort_artists" />
      <div>BPM</div>
      <a-text-input v-model="info_data.bpm_display" />
      <div>画师</div>
      <a-text-input v-model="info_data.jacket_artist" placeholder="请输入文本" />
      <a-button msg="Next" style="grid-column: span 2; width: 6rem" @click="emit('next')" />
    </div>
    <div class="custom-info-per-diff">
      <div class="custom-info-header">难度信息</div>
      <template v-for="ix in filter_STR()">
        <div class="custom-info-header">{{ STR[ix] }}</div>
        <div>定数</div>
        <a-number-input v-model="info_data[`difficulty_constant_${ix + 1}`]" min="0" step="0.001" />
        <div>定数显示</div>
        <a-text-input v-model="info_data[`difficulty_display_${ix + 1}`]" />
        <div>Charter</div>
        <a-text-input v-model="info_data[`note_designer_${ix + 1}`]" />
      </template>
      <template v-if="diff_indexs[3] != -1">
        <div>Backstage?</div>
        <a-checkbox v-model="is_backstage" />
        <template v-if="is_backstage">
          <div>音频 id</div>
          <a-text-input v-model="info_data.enc_data.audio_id" placeholder="音频文件名" />
          <div>预览 id</div>
          <a-text-input v-model="info_data.enc_data.preview_id" placeholder="预览文件名" />
          <div>曲绘 id</div>
          <a-text-input v-model="info_data.enc_data.jacket" placeholder="曲绘文件名" />

          <div>曲名</div>
          <a-text-input v-model="info_data.enc_data.name" />
          <div>格式化名称</div>
          <a-text-input v-model="info_data.enc_data.formatted_name" />
          <div>曲师</div>
          <a-text-input v-model="info_data.enc_data.artist" />
          <div>BPM</div>
          <a-text-input v-model="info_data.enc_data.bpm_display" />
          <div>画师</div>
          <a-text-input v-model="info_data.enc_data.jacket_designer" />
        </template>
      </template>
    </div>
  </div>
</template>

<style>
.custom-info-header {
  grid-column: 1 / span 2;
  padding-bottom: 15px;
  font-weight: bold;
}

.custom-info-diff-left div:nth-child(2n + 1) {
  border: #b8dcee 2px solid;
  width: 15rem;
  height: 3rem;
  line-height: 3rem;
}

.custom-info-diff-single :nth-child(1) {
  grid-area: a;
}

.custom-info-diff-single :nth-child(2) {
  grid-area: b;
  font-size: 0.9rem;
}

.custom-info-diff-single :nth-child(3) {
  grid-area: c;
  font-size: 0.8rem;
  opacity: 0.8;
}

.custom-info {
  display: grid;
  grid-template-columns: 1fr 1fr;
  width: 100%;
}

.custom-info-json,
.custom-info-per-diff {
  display: grid;
  grid-template-columns: 1fr 2fr;
  justify-items: center;
  height: min-content;
  gap: 5px;
}

.custom-info input {
  color: #b8dcee;
  background: transparent;
}
</style>
