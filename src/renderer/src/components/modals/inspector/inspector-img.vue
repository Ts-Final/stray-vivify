<script lang="ts" setup>
import { Log } from '@renderer/core/misc/inspector'

const needed = Log.need_img
</script>

<template>
  <div class="inspector-img-wrapper">
    <div class="inspector-img-header">
      <div>需要的图片</div>
      <div>请求次数</div>
    </div>
    <div class="inspector-img-header">
      <div>需要的图片</div>
      <div>请求次数</div>
    </div>
    <div v-for="(i, idx) in needed" :key="idx">
      <div v-html="i[0]"></div>
      <div v-html="i[1]"></div>
    </div>
  </div>
</template>

<style>
.inspector-img-wrapper {
  display: grid;
  grid-template-columns: 1fr 1fr;
  overflow-y: hidden;
  max-height: 100%;
  margin-top: 15px;
}
.inspector-img-header {
  border-bottom: 2px solid #b8dcee;
  border-collapse: collapse;
  line-height: 1.5rem;
  margin-bottom: 10px;
}
.inspector-img-wrapper > div {
  display: grid;
  grid-template-columns: 1fr 1fr;
  width: 100%;
  justify-items: center;
}
</style>
