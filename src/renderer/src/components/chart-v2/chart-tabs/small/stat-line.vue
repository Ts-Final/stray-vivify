<script lang="ts" setup>
import { computed } from 'vue'
import { Storage } from '@renderer/core/storage'
import { utils } from '@renderer/core/utils'
import { Chart } from '@renderer/core/chart/chart'
import { ChartTypeV2 } from '@preload/chart-types'

const props = defineProps<{
  str: keyof ChartTypeV2.SongStats
}>()

const chart = Chart.$current
const sr = chart.diff.sr

const value = computed(() => {
  return sr.value[props.str]
})

function getStatStyle(statName: keyof ChartTypeV2.SongStats) {
  const val = sr.value[statName]

  if (!Storage._ref.value.settings.color_stats) {
    const width = val > 200 ? '100%' : (val) / 2 + '%'
    return {
      width: width,
      bg: 'white',
      class_line: 'stat-white'
    }
  }
  if (val < 200) {
    const colObj = utils.GML_style_hsv_to_hsl(55 + 200 * (val / 200), 200, 255)
    const width = val / 2 + '%'

    return {
      bg: `hsl(${colObj.h}, ${colObj.s}%, ${colObj.l}%)`,
      class_line: '',
      width: width
    }
  } else if (val >= 200 && val < 400) {
    const width = (val - 200) / 2 + '%'
    return {
      //用于控制hsl循环内的lightness
      class_line: 'stat-rainbow',
      width: width,
      bg: 'white'
    }
  } else {
    return {
      class_line: 'rainbow-line',
      width: '100%'
    }
  }
}
const style_fill = computed(() => {
  const s = getStatStyle(props.str)
  return {
    width: s.width,
    background: s.bg
  }
})

const class_line = computed(() => {
  return getStatStyle(props.str).class_line
})
</script>

<template>
  <div class="stat-line-wrapper">
    <div :class="class_line" class="stat-line">
      <div :style="style_fill" class="stat-line-fill"></div>
    </div>
    <div class="stat-line-str">{{ value.toFixed(2) }}</div>
  </div>
</template>

<style scoped>
.stat-line-wrapper {
  display: flex;
  width: 90%;
  align-items: center;
}

.stat-line {
  flex-grow: 1;
  height: 1rem;
  margin: 0 10px;
  max-width: 200px;
}
.stat-line-fill {
  height: 100%;
  transition: width 0.2s ease-in-out;
}
.stat-line-str {
  flex-basis: 3rem;
}
.stat-rainbow {
  animation: a-rainbow-cycle-stat 3s infinite linear;
}
.stat-white {
  background: #bbbbbb44;
}

.rainbow-line {
  position: relative; /* 必须设置 relative，作为伪元素的定位基准 */
  display: flex;
  justify-content: center;
  align-items: center;
  color: white;
  z-index: 1;
  --rainbow-line-background: linear-gradient(
    90deg,
    #ff0000,
    #ff8000,
    #ffff00,
    #80ff00,
    #00ff80,
    #00ffff,
    #0080ff,
    #8000ff,
    #ff00ff,
    #ff0000
  );
  animation-duration: 3s;
}

/* 1. 内部的彩虹流动背景 (使用 ::after 实现) */
.rainbow-line::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--rainbow-line-background);
  background-size: 200% 100%; /* 放大背景尺寸，为流动做准备 */
  z-index: -1; /* 放在文字下方 */
  animation: a-rainbowline linear infinite; /* 绑定流动动画 */
  opacity: 0.8; /* 稍微调低一点透明度，让文字更清晰 */
  animation-duration: inherit;
}

/* 2. 外侧的彩虹发光效果 (使用 ::before 实现) */
.rainbow-line::before {
  content: '';
  position: absolute;
  /* 让伪元素比主盒子大一圈，用来做外发光 */
  top: -4px;
  left: -4px;
  right: -4px;
  bottom: -4px;
  /* 使用和内部完全一样的 45° 彩虹渐变 */
  background: var(--rainbow-line-background);
  background-size: 200% 100%;
  z-index: -2; /* 放在最底层 */
  border-radius: 5px; /* 比主盒子的圆角稍大一点 */
  filter: blur(5px); /* 核心：高斯模糊制造光晕 */
  opacity: 0.7; /* 控制发光的亮度 */
  animation: a-rainbowline linear infinite; /* 绑定完全同步的流动动画 */
  animation-duration: inherit;
}

/* 定义彩虹流动动画：改变背景位置 */
@keyframes a-rainbowline {
  0% {
    background-position: 0% 100%;
  }
  100% {
    background-position: 200% 100%;
  }
}
</style>
