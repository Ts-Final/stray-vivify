<script lang="ts" setup>
import ARange from '@renderer/components/a-elements/a-range.vue'
import { Chart } from '@renderer/core/chart/chart'
import { utils } from '@renderer/core/utils'
import { Storage } from '@renderer/core/storage'
import { computed } from 'vue'

const chart = Chart.$current
const { current_ms, writable_play_rate, play_rate, writable_current_second } = chart.audio.refs
const show_beat_time = computed(
  () => Storage.settings.beat_fn_time || Storage.settings.bar_or_section
)
</script>
<template>
  <div class="fn-time">
    <label>
      <span class="fn-time-str1">{{ utils.toTimeStr(current_ms / 1000) }}</span>
      <span class="fn-time-str2"> /{{ utils.toTimeStr(chart.audio.length / 1000) }} </span>
      <template v-if="show_beat_time">
        <br />
        <span class="fn-time-str1">{{ chart.diff.get_beat_string(current_ms) }}</span>
        <span class="fn-time-str2"> /{{ chart.diff.section_list.length - 1 }} </span>
      </template>
    </label>
    <a-range
      v-model="writable_current_second"
      :max="chart.audio.length / 1000"
      min="0"
      step="0.1"
    />
    <label @click="writable_play_rate = 1">播放速度:{{ play_rate }}x</label>
    <a-range v-model="writable_play_rate" max="2" min="0.25" step="0.05" />
    <label>音乐音量: {{ Storage.settings.music_volume }}</label>
    <a-range
      v-model="Storage.settings.music_volume"
      max="100"
      min="0"
      step="1"
    />
    <template v-if="Storage.settings.hit_sound">
      <label v-if="!chart.hit_sounder.hit_error">打击音量: {{ Storage.settings.hit_volume }}</label>
      <a-range
        v-if="!chart.hit_sounder.hit_error"
        v-model="Storage.settings.hit_volume"
        max="300"
        min="0"
        step="1"
      />
      <div v-else class="fn-time-hit-err">打击音加载失败。</div>
    </template>
  </div>
</template>
<style>
.fn-time input {
  width: 100%;
}

.fn-time {
  display: grid;
  grid-template-columns: 7fr 6fr;
  align-items: center;
  justify-items: center;
  gap: 15px 0;
  text-align: center;
  padding: 15px 15px 15px 10px;
  box-sizing: border-box;
}

.fn-time > input {
  background-color: transparent;
  outline: none;
  border: none;
  font-size: 1rem;
  line-height: 1rem;
  text-align: center;
  border-bottom: 1px solid transparent;
}

.fn-time > input:focus {
  border-bottom: 1px solid var(--grey);
}

.fn-time-hit-err {
  grid-column: span 2;
  text-align: center;
}

.fn-time-str1 {
  width: 9rch;
}

.fn-time-str2 {
  width: 7.2rch;
  font-size: 0.8em;
  color: gray;
}
</style>
