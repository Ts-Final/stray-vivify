<script lang="ts" setup>
import SimpleModal from '@renderer/components/modals/simple-modal.vue'
import AButton from '@renderer/components/a-elements/a-button.vue'
import { Storage } from '@renderer/core/storage'
import { closeModal } from '@kolirt/vue-modal'
import { computed, onMounted, ref } from 'vue'
import { FN_TABS, FN_TABS_DEFAULT, fn_name, normalize_fn_tabs } from '@renderer/core/misc/fn-tabs'

type Side = 'left' | 'right'

const sides: Side[] = ['left', 'right']

const tabs = () => Storage.settings.fn_tabs

/** 当前正在拖动的 fn，null 表示没有在拖动 */
const dragging = ref<number | null>(null)
/** 拖动时鼠标所在的插入位置（用于画插入线） */
const drop = ref<{ side: Side; index: number } | null>(null)

const placed = computed(() => {
  const m = new Map<number, Side>()
  tabs().left.forEach((id) => m.set(id, 'left'))
  tabs().right.forEach((id) => m.set(id, 'right'))
  return m
})

function col(side: Side): number[] {
  return side === 'left' ? tabs().left : tabs().right
}

function save() {
  Storage.save()
}

/** 把 fn 放到某一列的指定位置（会先从原来的位置移除） */
function place(id: number, side: Side, index: number) {
  const t = tabs()
  const from: Side | null = t.left.includes(id) ? 'left' : t.right.includes(id) ? 'right' : null
  const from_index = from ? col(from).indexOf(id) : -1
  if (from != null) col(from).splice(from_index, 1)
  // 同一个数组里取出元素后，它后面的元素会前移
  if (from === side && from_index != -1 && from_index < index) index--
  const arr = col(side)
  arr.splice(Math.max(0, Math.min(index, arr.length)), 0, id)
  save()
}

function remove(side: Side, index: number) {
  col(side).splice(index, 1)
  save()
}

function remove_id(id: number) {
  const t = tabs()
  const li = t.left.indexOf(id)
  if (li != -1) t.left.splice(li, 1)
  const ri = t.right.indexOf(id)
  if (ri != -1) t.right.splice(ri, 1)
  save()
}

function reset_default() {
  const t = tabs()
  t.left = [...FN_TABS_DEFAULT.left]
  t.right = [...FN_TABS_DEFAULT.right]
  save()
}

function start_drag(id: number, e: DragEvent) {
  dragging.value = id
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', String(id))
  }
}

function end_drag() {
  dragging.value = null
  drop.value = null
}

/** dragover 每秒会触发很多次，位置没变就不要写响应式状态（避免无意义的重渲染） */
function set_drop(side: Side, index: number) {
  const d = drop.value
  if (d != null && d.side === side && d.index === index) return
  drop.value = { side, index }
}

/** 鼠标在这一列的空白处 -> 放到最后 */
function over_col(side: Side) {
  if (dragging.value == null) return
  set_drop(side, col(side).length)
}

/** 鼠标在顶部按钮区 -> 不显示插入线（拖到这里等于删除） */
function over_pool() {
  if (drop.value != null) drop.value = null
}

/** 鼠标在某一项的上/下半 -> 放到它前面/后面 */
function over_item(side: Side, i: number, e: DragEvent) {
  if (dragging.value == null) return
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
  const after = e.clientY > rect.top + rect.height / 2
  set_drop(side, after ? i + 1 : i)
}

function drop_at(side: Side, fallback: number) {
  const id = dragging.value
  if (id != null) {
    const d = drop.value
    place(id, side, d && d.side === side ? d.index : fallback)
  }
  end_drag()
}

function drop_pool() {
  if (dragging.value != null) remove_id(dragging.value)
  end_drag()
}

/**
 * 插入线的位置。用绝对定位的伪元素来画，不占据布局，
 * 这样鼠标下面的按钮不会被顶开（否则会出现"线一动、鼠标下面的项就换一个"的抖动）。
 */
function insert_class(side: Side, i: number): string {
  const d = drop.value
  if (dragging.value == null || d == null || d.side !== side) return ''
  if (d.index === i) return 'fn-tabs-insert-before'
  if (d.index === i + 1) return 'fn-tabs-insert-after'
  return ''
}

onMounted(() => {
  const n = normalize_fn_tabs(tabs())
  const t = tabs()
  if (n.left.length != t.left.length || n.right.length != t.right.length) {
    t.left = n.left
    t.right = n.right
    save()
  }
})
</script>

<template>
  <SimpleModal size="2" title="Fn排列">
    <div class="fn-tabs">
      <div class="fn-tabs-pool" @dragover.prevent="over_pool" @drop.prevent="drop_pool">
        <div class="fn-tabs-pool-title">右键删除。命名别问，问就是代码名称。</div>
        <div class="fn-tabs-pool-list">
          <div
            v-for="fn in FN_TABS"
            :key="fn.id"
            :class="{ 'fn-tabs-dim': placed.has(fn.id) }"
            class="fn-tabs-chip"
            draggable="true"
            @dragend="end_drag"
            @dragstart="start_drag(fn.id, $event)"
          >
            {{ fn.file }}
          </div>
        </div>
      </div>

      <div
        v-for="side in sides"
        :key="side"
        class="fn-tabs-col"
        @dragover.prevent="over_col(side)"
        @drop.prevent="drop_at(side, col(side).length)"
      >
        <div class="fn-tabs-col-title">{{ side == 'left' ? '左列' : '右列' }}</div>
        <div
          v-for="(id, i) in col(side)"
          :key="id"
          :class="insert_class(side, i)"
          class="fn-tabs-chip fn-tabs-placed"
          draggable="true"
          @contextmenu.prevent="remove(side, i)"
          @dragend="end_drag"
          @dragstart="start_drag(id, $event)"
          @dragover.prevent.stop="over_item(side, i, $event)"
          @drop.prevent.stop="drop_at(side, i)"
        >
          {{ fn_name(id) }}
        </div>
        <div v-if="col(side).length == 0" :class="insert_class(side, 0)" class="fn-tabs-empty">
          把 fn 拖到这里
        </div>
      </div>
    </div>
    <template #footer>
      <a-button msg="恢复默认" @click="reset_default" />
      <a-button msg="完成" @click="closeModal()" />
    </template>
  </SimpleModal>
</template>

<style>
.fn-tabs {
  width: 100%;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.fn-tabs-pool {
  grid-column: span 2;
  border: 1px dashed rgba(184, 220, 238, 0.4);
  border-radius: 5px;
  padding: 8px;
}

.fn-tabs-pool-title {
  font-size: 0.85rem;
  opacity: 0.8;
  text-align: center;
  margin-bottom: 8px;
}

.fn-tabs-pool-list {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 6px;
}

.fn-tabs-col {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-height: 8rem;
  max-height: 45vh;
  overflow-y: auto;
  border: 1px dashed rgba(184, 220, 238, 0.4);
  border-radius: 5px;
  padding: 8px;
}

.fn-tabs-col-title {
  text-align: center;
  font-size: 0.9rem;
  opacity: 0.8;
  flex-shrink: 0;
}

.fn-tabs-chip {
  cursor: grab;
  text-align: center;
  padding: 3px 6px;
  border: 1px solid #b8dcee;
  border-radius: 4px;
  background: var(--darker-bgi);
  box-shadow: black 0 0 5px;
  transition: opacity 0.1s linear;
}

.fn-tabs-chip.fn-tabs-placed {
  width: 100%;
  box-sizing: border-box;
  flex-shrink: 0;
}

.fn-tabs-chip.fn-tabs-dim {
  opacity: 0.35;
}

.fn-tabs-empty {
  text-align: center;
  font-size: 0.85rem;
  font-style: italic;
  opacity: 0.5;
}

/* 插入线：绝对定位，不占布局 */
.fn-tabs-insert-before,
.fn-tabs-insert-after {
  position: relative;
}

.fn-tabs-insert-before::before,
.fn-tabs-insert-after::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  height: 3px;
  border-radius: 2px;
  background: #b8dcee;
}

.fn-tabs-insert-before::before {
  top: -4px;
}

.fn-tabs-insert-after::after {
  bottom: -4px;
}
</style>
