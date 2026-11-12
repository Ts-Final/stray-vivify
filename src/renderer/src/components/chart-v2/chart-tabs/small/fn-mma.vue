<script lang="ts" setup>
/**
 * fn-mma —— ManiaMapAnalyser 卡片的 Vue 版。
 *
 * 内容对应 `ManiaMapAnalyser by Leo_Black/index.html` 的卡片：
 *   状态行 / star-block（星数胶囊 + LN%+Keys + 右胶囊 + 段位标签 + 星星点）/
 *   Pattern 进度条（有几个画几个，最多 5 条）+ Category / 模式标签。
 *
 * 按需求**排除**：暂停计数与暂停标记、Etterna 技能条、ReworkPP 条、难度图（header/body）、
 * 以及全部配置项（算法固定 Sunny、OD 固定 8、不考虑 SV）。点击状态行可重新计算。
 */
import { computed, onMounted, ref, watch } from 'vue'
import { Chart } from '@renderer/core/chart/chart'
import { Rework, Rework_Display, Rework_Types } from '@renderer/core/chart/rework'
import { utils } from '@renderer/core/utils'
import WordHelper from '@renderer/components/miscellaneous/word-helper.vue'

const chart = Chart.$current
const diff = chart.diff

/**
 * 固定选项（不再暴露 UI）：
 *   - 算法 = Sunny（星数胶囊显示的就是 Sunny 原始 sr）；
 *   - od = 8（stray-vivify 的 diff 不保存 OverallDifficulty，`osz-reader.ts` 导入时丢弃）；
 *   - classicMod = false → **使用 CArrV2（v2 密度表）**，见下方说明；
 *   - enableAlwaysShowLNDifficulty = false → 默认为关：LN 占比 < 15% 时不显示 `|| LN` 段；
 *   - SV 检测关闭（不传 useSvDetection）。
 */
const OD = 8.0

/**
 * classic 语义：只切换 Sunny 的**星数密度**系数表（CArr ↔ CArrV2），不影响 v2Acc/PP 公式。
 *   - **false（本项目采用）= CArrV2（v2）**：当前 osu! lazer / ScoreV2 口径，也是这份 rework
 *     实现的回归锚点（缺省时与引入 classic 功能之前的输出逐位一致）；
 *   - true = CArr：osu! stable / ScoreV1（带 CL）口径。
 * 实测本仓库 charts/ 的 21 个 diff：两者 Sunny sr 的平均绝对差约 0.069、最大 0.255，
 * 段位标签偶尔跨档（如 “Reform 6 low” ↔ “Reform 5 high”）。此处固定用 v2。
 */
const CLASSIC_MOD = false

/**
 * always show LN：默认为关。
 * 关：lnRatio < 0.15（LN 头占全部物件比例）时标签只显示 RC 段，如 “Reform 5 high”；
 * 开：无论占比多低都拼上 LN 段，如 “Reform 5 high || LN 4 mid”。
 * 注意：纯 Sunny 下 LN 段是**同一个 sr** 套 LN 区间表的结果（不是独立 LN 星数——那需要
 * 未移植的 SunnyWindow 的 estDiff2）。
 */
const ALWAYS_SHOW_LN = false

const busy = ref(false)
const elapsedMs = ref(0)
const estimate = ref<Rework_Types.EstimateResult | null>(null)
const pattern = ref<Rework_Types.PatternPresentation | null>(null)
const fatals = ref<string[]>([])

function options(): Rework_Types.AnalyzeOptions {
  return {
    algorithm: 'Sunny',
    od: OD,
    classicMod: CLASSIC_MOD,
    enableAlwaysShowLNDifficulty: ALWAYS_SHOW_LN
  }
}

async function run() {
  if (busy.value) return
  busy.value = true
  try {
    // 让「计算中」先渲染一帧
    await utils.nextFrame()
    const target = diff.diff
    if (!target || !target.notes || target.notes.length === 0) {
      estimate.value = null
      pattern.value = null
      fatals.value = []
      elapsedMs.value = 0
      return
    }

    const t0 = performance.now()
    const est = Rework.runEstimator(target, options())
    await utils.nextFrame()
    const pat = Rework.presentPattern(target, options())
    elapsedMs.value = performance.now() - t0

    estimate.value = est
    pattern.value = pat.error ? null : pat
    fatals.value = [...est.errors, ...(pat.error ? [`Pattern failed: ${pat.error}`] : [])]
  } catch (err: any) {
    fatals.value = [String(err?.message ?? err)]
    estimate.value = null
    pattern.value = null
  } finally {
    busy.value = false
  }
}

onMounted(run)
watch(() => diff.diff_index.value, run)

const star = computed(() => Number(estimate.value?.star ?? Number.NaN))
const starText = computed(() => (Number.isFinite(star.value) ? star.value.toFixed(2) : '-'))
const starBg = computed(() => Rework_Display.starColorFor(star.value))
const starFg = computed(() =>
  Rework_Display.pickReadableTextColor(
    star.value,
    starBg.value,
    Rework_Display.starTextColorFor(star.value)
  )
)

const lnPercentText = computed(() => {
  const v = Number(estimate.value?.lnRatio)
  return Number.isFinite(v) ? `${(v * 100).toFixed(1)}%` : '-'
})

const keysText = computed(() => {
  const v = Number(estimate.value?.columnCount)
  return Number.isFinite(v) && v > 0 ? String(v) : '-'
})

const diffText = computed(() => Rework_Display.formatDiffForDisplay(estimate.value?.estDiff))
const starTipLevel = computed(() => Rework_Display.parseRcDifficultyLevel(diffText.value))

const category = computed(() => pattern.value?.category ?? '-')
const modeTag = computed(() => pattern.value?.modeTag ?? 'Mix')
const modeTagClass = computed(() => `mma-mode-${modeTag.value.toLowerCase()}`)
/** 有几个画几个（不补空条、最多 5 条，由 Rework.presentPattern 保证） */
const bars = computed<Rework_Types.PatternBarItem[]>(() => pattern.value?.bars ?? [])

/**
 * 被键型解析器忽略的 stacknote 数（同列音符落在 LN 体内 / LN 头相撞）。
 * 显示在 mode tag 那一行（RC / LN / HB / Mix 旁边），不占状态行。
 */
const droppedNotes = computed(() => pattern.value?.droppedNotes ?? 0)

const statusText = computed(() => {
  if (busy.value) return 'Analyzing…'
  if (fatals.value.length) return `[Error] ${fatals.value[0]}`
  if (!estimate.value) return 'No data（点击重新计算）'
  return `${chart.song.name} [${diff.diff1} ${diff.diff2}] (${diff.charter}) // Sunny // ${elapsedMs.value.toFixed(0)}ms`
})

const statusKind = computed(() => {
  if (busy.value) return 'mma-loading'
  if (fatals.value.length) return 'mma-error'
  return estimate.value ? 'mma-ok' : ''
})
</script>

<template>
  <div class="mma-card">
    <div class="mma-status-row" title="点击重新计算" @click="run">
      <p class="mma-status" :class="statusKind">{{ statusText }}</p>
    </div>

    <!-- ── star-block ─────────────────────────────────────────────── -->
    <div class="star-block">
      <div class="star-left">
        <div :style="{ background: starBg, color: starFg }" class="star-value has-unit">
          {{ starText }}<span class="star-unit">SR</span>
        </div>
        <div class="star-meta">LN%: {{ lnPercentText }}<br />Keys: {{ keysText }}</div>
      </div>

      <div class="star-right-group">
        <div class="star-right">
          <div class="star-right-capsule">{{ category }}</div>
          <div class="star-diff">{{ diffText }}</div>
          <div class="star-caption">Estimate Difficulty</div>
        </div>
        <div class="star-tip">
          <span
            v-for="lvl in [5, 4, 3, 2, 1]"
            :key="lvl"
            :class="{ lit: lvl <= starTipLevel }"
            class="star-dot"
          />
        </div>
      </div>
    </div>

    <!-- ── Pattern：有几个画几个（无簇时整段不显示） ─────────────── -->
    <template v-if="bars.length > 0">
      <div class="full-separator">Pattern</div>
      <ol class="cluster-bars">
        <li v-for="(item, i) in bars" :key="i" class="cluster-item">
          <div class="cluster-label">{{ item.label }}</div>
          <div class="cluster-track">
            <div :style="{ width: item.width + '%' }" class="cluster-fill" />
          </div>
          <div class="cluster-subtype">{{ item.subtype }}</div>
        </li>
      </ol>
    </template>

    <!-- ── mode tag（右侧附被忽略的 stacknote 计数） ─────────────── -->
    <div class="mma-mode-tag-group">
      <span :class="modeTagClass" class="mma-mode-tag">{{ modeTag }}</span>
      <word-helper
        v-if="droppedNotes > 0"
        :dec="`${droppedNotes} 个音符与同列 LN 冲突（落在 LN 体内或与 LN 尾同刻），键型分析已忽略它们`"
        class="stacked-hint"
      >
        ({{ droppedNotes }} stacked)
      </word-helper>
    </div>

    <div v-if="fatals.length > 1" class="mma-errors">
      <div v-for="(msg, i) in fatals" :key="i">{{ msg }}</div>
    </div>
  </div>
</template>

<style>
/* 移植自 MMA styles/status.css + star.css + bars.css 的相关规则（去掉暂停/进度图部分） */
.mma-card {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 320px;
  padding: 12px 14px 14px;
  border-radius: 12px;
  background: linear-gradient(180deg, rgba(24, 28, 40, 0.94), rgba(16, 18, 26, 0.94));
  border: 1px solid rgba(184, 220, 238, 0.22);
  color: #eaf3fb;
  user-select: none;
  box-sizing: border-box;
}

/* ── status ──────────────────────────────────────────────────────── */
.mma-status-row {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 18px;
  cursor: pointer;
}
.mma-status {
  margin: 0;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 11px;
  letter-spacing: 0.02em;
  color: #b8dcee;
}
.mma-status.mma-loading {
  color: #ffd966;
}
.mma-status.mma-ok {
  color: #8bff66;
}
.mma-status.mma-error {
  color: #ff7a69;
}

/* ── star-block ──────────────────────────────────────────────────── */
.star-block {
  display: flex;
  align-items: stretch;
  gap: 10px;
}
.star-left {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}
.star-value {
  display: flex;
  align-items: baseline;
  justify-content: center;
  min-width: 96px;
  padding: 6px 10px;
  border-radius: 10px;
  font-size: 28px;
  font-weight: 700;
  line-height: 1.1;
  font-variant-numeric: tabular-nums;
  transition:
    background-color 260ms ease,
    color 260ms ease;
}
.star-unit {
  margin-left: 3px;
  font-size: 11px;
  font-weight: 600;
  opacity: 0.75;
}
.star-meta {
  font-size: 11px;
  line-height: 1.3;
  text-align: center;
  color: #b8dcee;
  font-variant-numeric: tabular-nums;
}
.star-right-group {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  flex: 1;
  min-width: 0;
}
.star-right {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
  min-width: 0;
}
.star-right-capsule {
  align-self: flex-start;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  padding: 3px 9px;
  border-radius: 999px;
  background: rgba(184, 220, 238, 0.16);
  font-size: 11px;
  font-weight: 600;
}
.star-diff {
  font-size: 15px;
  font-weight: 600;
  line-height: 1.25;
  white-space: pre-line;
  color: #f6fbff;
}
.star-caption {
  font-size: 10px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: rgba(184, 220, 238, 0.6);
}
.star-tip {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding-top: 2px;
}
.star-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: rgba(184, 220, 238, 0.2);
  transition:
    background-color 200ms ease,
    box-shadow 200ms ease;
}
.star-dot.lit {
  background: #7afbff;
  box-shadow: 0 0 6px rgba(122, 251, 255, 0.7);
}

/* ── separators ──────────────────────────────────────────────────── */
.full-separator {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 2px;
  font-size: 10px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: rgba(184, 220, 238, 0.62);
}
.full-separator::after {
  content: '';
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, rgba(184, 220, 238, 0.28), rgba(184, 220, 238, 0));
}

/* ── pattern cluster bars ────────────────────────────────────────── */
.cluster-bars {
  display: flex;
  flex-direction: column;
  gap: 7px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.cluster-item {
  display: grid;
  grid-template-columns: 78px 1fr;
  align-items: center;
  gap: 8px;
  animation: item-float-in 400ms ease both;
}
/* 错峰入场：步长 80ms（MMA 的 ITEM_STAGGER_DELAY_MS），最多 5 条 */
.cluster-item:nth-child(1) {
  animation-delay: 0ms;
}
.cluster-item:nth-child(2) {
  animation-delay: 80ms;
}
.cluster-item:nth-child(3) {
  animation-delay: 160ms;
}
.cluster-item:nth-child(4) {
  animation-delay: 240ms;
}
.cluster-item:nth-child(5) {
  animation-delay: 320ms;
}
.cluster-label {
  font-size: 11px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.cluster-track {
  position: relative;
  height: 8px;
  border-radius: 999px;
  background: rgba(184, 220, 238, 0.14);
  overflow: hidden;
}
.cluster-fill {
  /* 默认 0：宽度由模板内联 style 写入（缺失时不会铺满整条轨道） */
  width: 0;
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, #4ec7ff, #58f0d9, #f6ef6b);
  transition: width 420ms cubic-bezier(0.22, 0.61, 0.36, 1);
}
.cluster-subtype {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 10px;
  color: rgba(184, 220, 238, 0.72);
  font-variant-numeric: tabular-nums;
  grid-column: span 2;
  margin-top: -5px;
}

/* ── mode tags ───────────────────────────────────────────────────── */
.mma-mode-tag-group {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 2px;
}
.mma-mode-tag {
  padding: 2px 9px;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #0d1016;
}
/* mode tag 旁被忽略的 stacknote 计数 */
.stacked-hint {
  font-size: 10px;
  color: rgba(184, 220, 238, 0.62);
  font-variant-numeric: tabular-nums;
  cursor: help;
}
.mma-mode-rc {
  background: #7afbff;
}
.mma-mode-ln {
  background: #f64eff;
}
.mma-mode-hb {
  background: #fff04e;
}
.mma-mode-mix {
  background: #8bff66;
}

.mma-errors {
  max-height: 60px;
  overflow-y: auto;
  font-size: 10px;
  line-height: 1.4;
  color: #ff7a69;
}

@keyframes item-float-in {
  from {
    opacity: 0;
    transform: translateY(4px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}
</style>
