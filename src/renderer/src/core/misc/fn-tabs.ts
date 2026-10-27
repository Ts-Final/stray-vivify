import { Component } from 'vue'
import { storages } from '@preload/types'

import FnNote from '@renderer/components/chart-v2/chart-tabs/small/fn-note.vue'
import FnCounter from '@renderer/components/chart-v2/chart-tabs/small/fn-counter.vue'
import FnDensity from '@renderer/components/chart-v2/chart-tabs/small/fn-density.vue'
import FnEditor from '@renderer/components/chart-v2/chart-tabs/small/fn-editor.vue'
import FnTime from '@renderer/components/chart-v2/chart-tabs/small/fn-time.vue'
import FnExport from '@renderer/components/chart-v2/chart-tabs/small/fn-export.vue'
import FnEditTools from '@renderer/components/chart-v2/chart-tabs/small/fn-edit-tools.vue'
import FnAimod from '@renderer/components/chart-v2/chart-tabs/small/fn-aimod.vue'
import FnMma from '@renderer/components/chart-v2/chart-tabs/small/fn-mma.vue'
import FnTesseract from '@renderer/components/chart-v2/chart-tabs/small/fn-tesseract.vue'
import FnSectionTap from '@renderer/components/chart-v2/chart-tabs/small/fn-section-tap.vue'

export type FnTabs = storages.settings['fn_tabs']

/**
 * small/fn-*.vue 与 settings.fn_tabs 中数字 id 的对应关系。
 * id 一旦确定就不要再改动，否则用户已经保存的排列会失效。
 */
export interface FnTab {
  /** 保存在 settings.fn_tabs.left / right 中的 id */
  id: number
  /** 文件名（不带后缀），也是 fn-tabs-modal 中按钮上显示的文字 */
  file: string
  component: Component
}

export const FN_TABS: FnTab[] = [
  { id: 1, file: 'fn-note', component: FnNote },
  { id: 2, file: 'fn-counter', component: FnCounter },
  { id: 3, file: 'fn-density', component: FnDensity },
  { id: 4, file: 'fn-editor', component: FnEditor },
  { id: 5, file: 'fn-time', component: FnTime },
  { id: 6, file: 'fn-export', component: FnExport },
  { id: 7, file: 'fn-edit-tools', component: FnEditTools },
  { id: 8, file: 'fn-aimod', component: FnAimod },
  { id: 9, file: 'fn-mma', component: FnMma },
  { id: 10, file: 'fn-tesseract', component: FnTesseract },
  { id: 11, file: 'fn-sectionTap', component: FnSectionTap }
]

/** 默认排列，与加入本设置前的 chart-main 布局一致 */
export const FN_TABS_DEFAULT: FnTabs = {
  left: [1, 2, 3, 10],
  right: [4, 5, 6, 7, 8, 9]
}

const fn_tab_map = new Map<number, FnTab>(FN_TABS.map((f) => [f.id, f]))

export function get_fn_tab(id: number): FnTab | undefined {
  return fn_tab_map.get(id)
}

export function fn_name(id: number): string {
  return fn_tab_map.get(id)?.file ?? `unknown-${id}`
}

export function fn_components(ids: number[]): FnTab[] {
  return ids.map((id) => get_fn_tab(id)).filter((f): f is FnTab => f != undefined)
}

/**
 * 过滤掉不存在的 id 与重复项（每个 fn 最多出现一次），用于渲染与保存前的清理。
 */
export function normalize_fn_tabs(tabs?: Partial<FnTabs>): FnTabs {
  const used = new Set<number>()
  const build = (ids?: number[]): number[] => {
    const out: number[] = []
    for (const id of ids ?? []) {
      if (!fn_tab_map.has(id) || used.has(id)) continue
      used.add(id)
      out.push(id)
    }
    return out
  }
  return { left: build(tabs?.left), right: build(tabs?.right) }
}
