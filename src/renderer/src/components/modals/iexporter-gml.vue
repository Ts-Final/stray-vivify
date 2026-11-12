<script lang="ts" setup>
import AButton2 from '@renderer/components/a-elements/a-button2.vue'
import ATextInput from '@renderer/components/a-elements/a-text-input.vue'
import { Chart } from '@renderer/core/chart/chart'
import { ref, watch } from 'vue'
import { Invoke } from '@renderer/core/ipc'

const chart = Chart.$current
const gml = ref(`array_push(global.song_list,
{
    song_id: array_length(global.song_list),
    name: "${chart.song.name}",
    formatted_name: "${chart.song.name_roman}",
    artist: "${chart.song.composer}",
    chart_id: "${chart.id}",
    audio_id: music_chart_${chart.id},
    jacket: song_${chart.id},
    preview_id: preview_${chart.id},
    bpm_display: "${chart.diff.timing[0].bpm}",
    version: "9.9.9",
    has_encore: false,
    is_original: false,
    is_published: true,
    jacket_artist: "N/A",
    difficulty_constant_1: 0,
    difficulty_display_1: "0",
    note_designer_1: "N/A",
    difficulty_constant_2: 0,
    difficulty_display_2: "0",
    note_designer_2: "N/A",
    difficulty_constant_3: ${chart.diff.diff2.replace(/[^0-9]/g, '')},
    difficulty_display_3: "${chart.diff.diff2.replace(/[^0-9]/g, '')}",
    note_designer_3: "${chart.diff.charter}",
    difficulty_constant_4: 0,
    difficulty_display_4: "0",
    note_designer_4: "N/A",
    unlock:
    {
        song_id: array_length(global.song_list),
        type: 0,
        enc_type: 0,
        per_difficulty: false,
        hidden: false,
        hint: "",
        enc_hint: ""
    },
    is_custom: true
});`)

const the_id = ref(chart.id)
watch(the_id, (v1, v0) => {
  gml.value = gml.value.replaceAll(v0, v1)
})

function write_gml() {
  Invoke('write-file', {id:chart.id, fname:'songinfo.gml',data: gml.value}).then(() => {
    return Invoke('show-file',{id: chart.id, fname:'songinfo.gml'})
  })
}
</script>

<template>
  <div>修改下方的diff_constant_3来调整一个合适的定数，其它的帮你填好啦。</div>
  <div>注意准备的音乐需要和这个谱面是同一个id哦，或者你可以修改chart-id字段</div>
  <br />
  <label>
    填个id
    <a-text-input v-model="the_id" />
  </label>
  <textarea id="vsc-gml" v-model="gml" spellcheck="false" />
  <div class="gml-export">
    <a-button2 class="gml-btn" msg="导出gml" @click="write_gml" />
  </div>
</template>

<style>
.iexporter-gml-header {
  font-size: 1.5rem;
  margin-bottom: 1rem;
}
#vsc-gml {
  width: 100%;
  background: none;
  height: 45vh;
  font-size: 1.1rem;
  font-family: monospace;
  margin-top: 1.5rem;
}
#vsc-gml::spelling-error {
  text-decoration: none;
}
.gml-export {
  display: flex;
  justify-content: space-evenly;
  margin-top: 1rem;
  width: 100%;
}
</style>
