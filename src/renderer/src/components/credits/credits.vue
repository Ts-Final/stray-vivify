<script lang="ts" setup>
import AHref from '@renderer/components/a-elements/a-href.vue'
import { Storage } from '@renderer/core/storage'
import { computed } from 'vue'
import { utils } from '@renderer/core/utils'

const total = computed(() => utils.toTimeStr(Storage.data.value.statistics.used_time / 1000, 0))
</script>

<template>
  <div class="credits-list">
    <div class="credits-head">Felleta: stray/vivify</div>
    <div class="credits-head">Creator</div>
    <div class="credits-col">
      <a-href href="https://space.bilibili.com/517691213">Allesta</a-href>
      <a-href href="https://github.com/Ts-Final">TerminalFlow (github)</a-href>
      <div>Felleta</div>
    </div>
    <div class="credits-head">先锋测试员</div>
    <div class="credits-3col">
      <span>chichiga</span>
      <span>Fyato</span>
      <span>GouYu</span>
      <span>Hileznx</span>
      <span>Kirαri</span>
      <span>zhangjunyuan</span>
      <span>QWQTATQWQTAT</span>
      <span>星茄</span>
      <span>玄天空翼</span>
      <span>yzuio</span>
      <span>1sk3se</span>
      <span>2569083408</span>
      <span>૮ ・ﻌ・ა</span>
      <span>-Re-Again-</span>
    </div>
    <div class="credits-head">开发帮助</div>
    <div class="credits-2col">
      <span>图标</span>
      <span>雫星沫RainFoamp</span>
      <span>Custom Song</span>
      <span>And_why, <a-href href="https://github.com/CreeperI">Creeper_001</a-href></span>
      <span>五维Stats统计</span>
      <span><a-href href="https://github.com/CreeperI">Creeper_001</a-href></span>
      <span>皮肤制作</span>
      <span>
        <a-href href="https://space.bilibili.com/432834039">-Re-Again-</a-href>
        <a-href href="https://space.bilibili.com/501410744">InvalidData</a-href>
      </span>
      <s>vsb导出</s>
      <span><a-href href="https://github.com/RGBproductions/">RGBproductions</a-href></span>
    </div>
    <div class="credits-head">Special Thanks</div>
    <div class="credits-4col">
      <a-href href="https://www.electronjs.org/">Electron</a-href>
      <a-href href="https://cn.vuejs.org/">Vue</a-href>
      <a-href href="https://vitejs.cn/">Vite</a-href>
      <a-href href="https://github.com/kolirt/vue-modal">kolirt (vue-modal)</a-href>
      <a-href href="https://vite.electron.js.cn/">Electron-Vite</a-href>
      <a-href href="https://wiki.rotaeno.cn/">Rotaeno中文维基</a-href>
      <a-href href="https://pixijs.com/">Pixi.js</a-href>
    </div>
    <div class="credits-head">And You</div>
    <div class="credits-col">
      <div>stray/vivify的不断发展，感谢每一个你的帮助。</div>
      <div>你总计使用了 {{ total }}</div>
    </div>
  </div>
</template>

<style>
.credits-list a {
  color: #b8dcee;
}
.credits-list a:visited {
  color: #b8dcee;
}
.credits-list {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.credits-list > div {
  width: 100%;
}
.credits-head {
  width: 100%;
  text-align: center;
  margin-bottom: 10px;
  font-size: 1.5rem;
  text-shadow: #16b7cc 1px 1px;
  font-weight: bolder;
}
.credits-head:not(:first-child) {
  margin-top: 50px;
}

.credits-2col {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  * {
    flex-basis: 50%;
  }
}
.credits-3col {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  * {
    flex-basis: 33%;
  }
}
.credits-4col {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  * {
    flex-basis: 25%;
  }
  align-items: center;
}
.credits-col {
  display: flex;
  flex-direction: column;
  gap: 5px;
  align-items: center;
  justify-content: center;
  * {
    flex-basis: 100%;
    text-align: center;
  }
}
* {
  user-select: none;
  text-align: center;
  font-size: 1.1rem;
}
</style>
