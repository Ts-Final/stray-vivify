<script lang="ts" setup>
import { GlobalStat } from '@renderer/core/globalStat'
import { ChartSize } from '@renderer/core/misc/inspector'

const size = ChartSize.data

function parse_size(size: number) {
  if (size < 1024) return `${size}B`
  else if (size < 1024 * 1024) return `${(size / 1024).toFixed(2)}KB`
  else return `${(size / 1024 / 1024).toFixed(2)}MB`
}

function parse_chart_name(str: string) {
  return GlobalStat.all_chart.find((c) => c.name === str)?.name || str
}
ChartSize.update()
</script>

<template>
  <div v-if="size.total !== 0" class="disk-wrapper">
    <div class="disk-header">SV最爱吃内存的一集</div>
    <div class="disk-total">
      <div>总共吃掉了</div>
      <div>{{ parse_size(size.app + size.exe) }}</div>
      <div>谱面文件夹总占用</div>
      <div>{{ parse_size(size.total) }}</div>
      <div>整个sv文件夹吃掉的</div>
      <div>{{ parse_size(size.exe) }}</div>
      <div>AppData占用</div>
      <div>{{ parse_size(size.app) }}</div>
    </div>
    <div class="disk-list">
      <span class="disk-list-sep">Files</span>
      <template v-for="ch in size.detail_sf" :key="'sf-' + ch[1]">
        <div class="disk-list-name">{{ ch[1] }}</div>
        <div>{{ parse_size(ch[0]) }}</div>
      </template>
      <br />
      <span class="disk-list-sep">Charts</span>
      <template v-for="ch in size.detail" :key="'ch-' + ch[1]">
        <div class="disk-list-name">{{ parse_chart_name(ch[1]) }}</div>
        <div>{{ parse_size(ch[0]) }}</div>
      </template>
    </div>
  </div>
  <div v-else class="disk-wrapper-loading">Loading.......</div>
</template>

<style>
.disk-wrapper {
  display: grid;
  grid-template-columns: 1fr 2fr;
  user-select: none;
  height: 90%;
}
.disk-wrapper-loading {
  text-align: center;
}
.disk-header {
  grid-column: 1 / 3;
  margin: 15px;
  font-size: 1.5rem;
  border-bottom: 2px solid #b8dcee;
  line-height: 3rem;
  text-align: center;
}
.disk-total {
  display: grid;
  grid-template-columns: 1fr 1fr;
  justify-items: center;
  gap: 10px;
  height: min-content;
}
.disk-list {
  display: grid;
  grid-template-columns: 1fr 1fr;
  height: calc(100%);
  overflow-y: auto;
}
.disk-total > div:nth-child(odd) {
  text-align: right;
  width: 100%;
}
.disk-list-name {
  text-align: right;
  padding-right: 10px;
}
.disk-list-sep {
  text-align: center;
  font-size: 1.2rem;
  grid-column: 1 / 3;
  border-bottom: 1px solid #b8dcee;
  margin-bottom: 5px;
  width: 6rem;
  padding: 0 5px;
  justify-self: center;
}
</style>
