<script lang="ts" setup>
import SimpleModal from '@renderer/components/modals/simple-modal.vue'
import { ChartTypeV2 } from '@preload/chart-types'
import AButton2 from '@renderer/components/a-elements/a-button2.vue'
import { Chart } from '@renderer/core/chart/chart'
import { onUnmounted, ref } from 'vue'
import Hide from '@renderer/components/a-elements/hide.vue'
import { utils } from '@renderer/core/utils'
import { Invoke } from '@renderer/core/ipc'

defineProps<{
  diff?: ChartTypeV2.diff[]
  song?: ChartTypeV2.song
  pix: number
  warnings?: string[]
}>()

const chart = Chart.$current
const imported = ref<number[]>([])
function import_diff(d: ChartTypeV2.diff, ix: number) {
  chart.add_diff(d)
  imported.value.push(ix)
}
function import_png(ix: number) {
  chart.import_mcz_pics(ix)
}

const show_song = ref(false)
function load_song(s: ChartTypeV2.song) {
  utils.less_assign(chart.song, s)
  show_song.value = true
  chart.set_header_name()
}
onUnmounted(() => {
  Invoke('close-mcz')
})
</script>

<template>
  <simple-modal size="3" title="importing mcz">
    <div class="mcz-wrapper">
      <Hide :def="true" title="谱面">
        <div v-if="diff && diff.length" class="mcz-diffs">
          <div v-for="(d, ix) in diff" :key="ix" class="mcz-diff-line">
            <div>{{ d.meta.diff1 || '未命名' }}</div>
            <div>by {{ d.meta.charter || 'unknown' }}</div>
            <div>{{ d.meta.diff2 }}k</div>
            <a-button2 v-if="imported.includes(ix)" disabled msg="已导入！" />
            <a-button2 v-else msg="导入" @click="import_diff(d, ix)" />
          </div>
        </div>
        <div v-else class="mcz-empty">没有可以导入的 Key 谱面。</div>
      </Hide>
      <Hide :def="true" title="歌曲信息">
        <div v-if="song" class="mcz-song">
          <div>
            <strong>{{ song.name }}</strong> - {{ song.composer }}
          </div>
          <div>
            <strong>{{ song.name_roman }}</strong> - {{ song.composer_roman }}
          </div>
          <a-button2 v-if="show_song" disabled msg="已导入" @click="load_song(song)"></a-button2>
          <a-button2 v-else msg="导入" @click="load_song(song)"></a-button2>
        </div>
      </Hide>
      <Hide title="背景">
        <div class="mcz-imgs">
          <div v-for="i in pix" :key="i">
            <img :alt="`${i - 1}`" :src="`stray://__mcz__/${i - 1}`" />
            <a-button2 msg="我要这个！" @click="import_png(i - 1)" />
          </div>
        </div>
      </Hide>
    </div>
  </simple-modal>
</template>

<style>
.mcz-wrapper {
  width: 100%;
  max-height: 50vh;
  overflow: hidden scroll;
}
.mcz-warnings {
  margin-bottom: 1rem;
  padding: 0.5rem 1rem;
  border-left: 3px solid #e8b339;
  color: #8a6a12;
  font-size: 1.2rem;
  line-height: 1.8rem;
}
.mcz-diffs {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.mcz-diff-line {
  display: grid;
  grid-template-columns: 3fr 1fr 1fr 1fr;
  text-align: center;
  align-items: center;
}
.mcz-diff-line > :first-child {
  word-break: keep-all;
}
.mcz-empty {
  text-align: center;
  opacity: 0.7;
}
.mcz-song {
  display: flex;
  justify-content: space-evenly;
  align-items: center;
}
.mcz-imgs {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: space-evenly;
  gap: 50px 0;
}
.mcz-imgs > div {
  display: grid;
  grid-template-rows: 25vh 1fr;
  max-width: 45%;
  justify-items: center;
  gap: 10px;
}
.mcz-imgs > div > img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}
</style>
