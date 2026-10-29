<script lang="ts" setup>
import SongInfoSingle from '@renderer/components/chart-v2/chart-tabs/small/song-info-single.vue'
import ASelect from '@renderer/components/a-elements/a-select.vue'
import AButton2 from '@renderer/components/a-elements/a-button2.vue'
import { Invoke } from '@renderer/core/ipc'
import { Chart } from '@renderer/core/chart/chart'
import { RefreshAll } from '@renderer/core/misc/refresh-all'
import { CONSTANT } from '@preload/constant'
import { notify } from '@renderer/core/misc/notify'

const chart = Chart.$current

const refs = chart.song.refs

const options = () =>
  chart.diffs.map((x, v: number) => {
    if (x.meta.diff2 == '') return { val: v, display: x.meta.diff1 }
    return { val: v, display: x.meta.diff1 + ' - ' + x.meta.diff2 }
  })
const dix = chart.diff.diff_index
const src = `stray:///__sprite__/${chart.id}`
/*const src2 = `stray:///__bg__/${chart.id}`
const img2_show = chart.bg_err*/
const img_show = chart.sprite_err

function add_diff() {
  chart.create_diff()
}
function delete_diff() {
  chart.delete_diff()
}
function copy_diff() {
  chart.copy_diff()
}

async function import_sprite() {
  const png = await Invoke('ask-file', { file: CONSTANT.ext.image })
  if (!png) return notify.error('选到滚木了！')
  await chart.import_sprite(png)
}
/*function import_bg() {
  Invoke('import-background', { id: chart.id })
}*/
const dkey = RefreshAll.generate_key('diff-choice')
const pkey = RefreshAll.generate_key('song-cover')
</script>

<template>
  <div class="info-wrapper">
    <div class="info-inner">
      <song-info-single v-model="refs.name" name="曲名" />
      <song-info-single v-model="refs.name_roman" name="曲名-罗马音" />
      <song-info-single v-model="refs.composer" name="编曲" />
      <song-info-single v-model="refs.composer_roman" name="编曲-罗马音" />
      <song-info-single v-model="refs.sprite" name="画师" />
      <song-info-single v-model.trim="refs.bpm" name="BPM" />
      <song-info-single v-model="refs.source" name="来源" />
      <song-info-single v-model="refs.ref" name="注释" />
      <div :key="pkey" class="song-info-single">
        <div>曲绘<a-button2 msg="导入曲绘" @click="import_sprite" /></div>
        <img
          v-if="!img_show"
          :src="src"
          alt="how are you reading this?"
          class="song-sprite"
          @error="img_show = true"
        />
      </div>
      <!--      <div :key="pkey" class="song-info-single">
        <div>背景<a-button2 msg="导入背景" @click="import_bg" /></div>
        <img
          v-if="!img2_show"
          :src="src2"
          alt="how are you reading this?"
          class="song-sprite"
          @error="img2_show = true"
        />
      </div>-->
    </div>
    <div class="info-inner">
      <div class="song-info-single diff-choose">
        <div :key="dkey">
          <div>选择难度：</div>
          <a-select v-model="dix" :options="options()" />
        </div>
        <div>
          <a-button2 msg="新建难度" @click="add_diff" />
          <a-button2 msg="删除该难度" @click="delete_diff" />
          <a-button2 msg="复制该难度" @click="copy_diff" />
        </div>
      </div>
      <song-info-single v-model="chart.diff.diff1" name="难度" />
      <song-info-single v-model="chart.diff.diff2" name="等级" />
      <song-info-single v-model="chart.diff.charter" name="谱师" />
      <song-info-single v-model.number="chart.diff.rating_string" name="定数" />
    </div>
  </div>
</template>

<style scoped>
.info-wrapper {
  width: 100%;
  height: 100%;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 25px;
  box-sizing: border-box;
  border: 50px solid transparent;
}
.song-sprite {
  left: 50%;
  position: relative;
  transform: translateX(-50%);
  height: 15vh;
  background: white;
  padding: 5px;
}
.info-inner {
  display: flex;
  flex-direction: column;
  padding: 15px;
  gap: 10px;
  height: 100%;
  overflow-y: auto;
}
.song-info-single {
  position: relative;
  border-radius: 10px;
  padding: 15px;
  background: var(--darker-bgi);
}
.song-info-single:last-child {
  margin-bottom: 10vh;
}
.song-info-single > div:first-child {
  display: flex;
  justify-content: space-between;
}
.diff-choose {
  display: flex;
  flex-direction: column;
  gap: 10px 0;
  align-items: center;
}
.diff-choose > div {
  flex-direction: row;
  display: flex;
  gap: 25px;
}
</style>
