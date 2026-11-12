<script lang="ts" setup>
import SimpleModal from '@renderer/components/modals/simple-modal.vue'
import ATab from '@renderer/components/a-elements/a-tab.vue'
import { ref } from 'vue'
import { Chart } from '@renderer/core/chart/chart'
import { utils } from '@renderer/core/utils'
import CustomDiff from '@renderer/components/modals/export-custom/custom-diff.vue'
import CustomJson from '@renderer/components/modals/export-custom/custom-json.vue'
import CustomInfo from '@renderer/components/modals/export-custom/custom-info.vue'
import type { CustomSongInfo } from '@preload/types.d.ts'

const chart = Chart.$current
const phase = ref(0)
const diff_indexs = ref([-1, -1, -1, -1])

// ----------- Phase 1: Info
function filter_STR() {
  const fl: number[] = []
  for (let i = 0; i < 4; i++) {
    if (diff_indexs.value[i] == -1) continue
    fl.push(i)
  }
  return fl
}
function start_phase_1() {
  info_data.value = {
    ...info_data.value,
    chart_id: chart.id.replace(' ', '-'),
    name: chart.song.name,
    formatted_name: chart.song.name_roman,
    artist: chart.song.composer,
    sort_artists: [chart.song.composer],
    bpm_display: chart.song.bpm,
    has_encore: diff_indexs.value[3] != -1
  }
  for (let i = 0; i < 4; i++) {
    if (diff_indexs.value[i] == -1) continue
    const the_index = diff_indexs.value[i]
    info_data.value[`difficulty_constant_${i + 1}`] = chart.diffs[the_index].meta.rating
    info_data.value[`note_designer_${i + 1}`] = chart.diffs[the_index].meta.charter
    info_data.value[`difficulty_display_${i + 1}`] = chart.diffs[the_index].meta.rating.toString()
  }
  phase.value = 1
}
const is_backstage = ref(false)
const info_data = ref<CustomSongInfo>({
  chart_id: '',
  name: '',
  formatted_name: '',
  artist: '',
  sort_artists: <string[]>[],
  bpm_display: '120',
  version: '9.9.9',
  is_original: false,
  is_published: true,
  jacket_artist: 'N/A',
  has_encore: false,
  difficulty_constant_1: 0,
  difficulty_display_1: '0',
  note_designer_1: 'N/A',
  difficulty_constant_2: 0,
  difficulty_display_2: '0',
  note_designer_2: 'N/A',
  difficulty_constant_3: 0,
  difficulty_display_3: '0',
  note_designer_3: 'N/A',
  difficulty_constant_4: 0,
  difficulty_display_4: '0',
  note_designer_4: 'N/A',
  unlock: {
    type: 0,
    enc_type: 0,
    per_difficulty: false,
    hidden: false,
    hint: '',
    enc_hint: ''
  },
  enc_data: {
    audio_id: '',
    preview_id: '',
    jacket: '',
    bpm_display: chart.song.bpm,
    name: chart.song.name,
    formatted_name: chart.song.name_roman,
    artist: chart.song.composer,
    jacket_designer: 'N/A'
  }
})
// -------------- Phase 2 ------------------
function start_phase_2() {
  if (!is_backstage.value) {
    // @ts-expect-error
    delete info_data.value.enc_data
  } else if (diff_indexs.value[3] != -1) {
    for (const _i of utils.keyof(info_data.value['enc_data'])) {
      if (info_data.value['enc_data'][_i] == '') delete info_data.value['enc_data'][_i]
    }
  }
  phase.value = 2
}
</script>

<template>
  <SimpleModal size="3" title="gugu gaga">
    <div class="export-custom-wrapper">
      <a-tab v-model="phase">
        <div disabled="true">选择diff</div>
        <div disabled="true">填数据</div>
        <div disabled="true">最后修改</div>
      </a-tab>
      <div class="export-custom-inner">
        <custom-diff v-if="phase == 0" v-model="diff_indexs" @next="start_phase_1" />
        <custom-info
          v-if="phase == 1"
          v-model:info="info_data"
          v-model:is_backstage="is_backstage"
          :diff_indexs="diff_indexs"
          :filter_STR="filter_STR"
          @next="start_phase_2"
        />
        <custom-json v-else-if="phase == 2" v-model="info_data" :diff_indexs="diff_indexs" />
      </div>
    </div>
  </SimpleModal>
</template>

<style>
.export-custom-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  min-height: 60vh;
  max-height: 70vh;
}

.export-custom-inner {
  width: 100%;
  height: 60vh;
}

.export-custom-diff {
  width: 100%;
  display: grid;
  grid-template-columns: 3fr 2fr;
}

.export-custom-diff-left {
  display: grid;
  grid-template-columns: 1fr 2fr;
  align-items: center;
  justify-items: center;
  text-align: center;
  row-gap: 25px;
  margin-top: 50px;
  padding-left: 25px;
}

.export-custom-diff-left div:nth-child(2n + 1) {
  border: #b8dcee 2px solid;
  width: 15rem;
  height: 3rem;
  line-height: 3rem;
}

.export-custom-diff-single {
  width: 100%;
  height: min-content;
  display: grid;
  grid-template-areas: 'a a a' 'b c c';
  border: 1px solid #b8dcee;
  padding: 5px;
}

.export-custom-diff-single :nth-child(1) {
  grid-area: a;
}

.export-custom-diff-single :nth-child(2) {
  grid-area: b;
  font-size: 0.9rem;
}

.export-custom-diff-single :nth-child(3) {
  grid-area: c;
  font-size: 0.8rem;
  opacity: 0.8;
}

.export-custom-wrapper input {
  color: #b8dcee;
  background: transparent;
}
</style>
