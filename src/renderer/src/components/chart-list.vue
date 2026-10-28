<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import ATextInput from '@renderer/components/a-elements/a-text-input.vue'
import { Invoke } from '@renderer/core/ipc'
import { GlobalStat } from '@renderer/core/globalStat'
import { Chart } from '@renderer/core/chart/chart'
import { charts_data } from '@preload/types'
import AButton2 from '@renderer/components/a-elements/a-button2.vue'
import { modal } from '@renderer/core/misc/modal'
import { Storage } from '@renderer/core/storage'
import AImg from '@renderer/components/a-elements/a-img.vue'
import { utils } from '@renderer/core/utils'
import { StartUpTips } from '@renderer/core/misc/startup-tips'
import { notify } from '@renderer/core/misc/notify'

const shown = ref(GlobalStat.all_chart)
const search = ref('')
watch(search, (c) => {
  shown.value = GlobalStat.all_chart.filter((v) => JSON.stringify(v).includes(c))
})

watch(GlobalStat.all_chart_ref, () => {
  search.value = ''
  shown.value = GlobalStat.all_chart
})
GlobalStat.update_all_chart()

const display_id = ref<string>()
const display_data = ref<charts_data[number]>()
let state = false

async function import_chart() {
  if (state) return
  const song = await Invoke('ask-song')
  if (!song) return
  const id = (await modal.AskIdModal.show({ all: GlobalStat.all_chart.map((x) => x.id) })) as
    undefined | string
  if (!id) return
  const r = await Invoke('import-song', { id: id, path: song.path })
  console.log(r)
  await GlobalStat.update_all_chart()
  shown.value = GlobalStat.all_chart
}

const drag_depth = ref(0)

function on_dragenter(e: DragEvent) {
  if (!e.dataTransfer?.types.includes('Files')) return
  // dragenter 在每个子元素上都会再来一次，只在最开始提示一遍
  drag_depth.value++
  if (drag_depth.value == 1) notify.normal('松开鼠标以导入嗷')
}

function on_dragleave() {
  if (drag_depth.value > 0) drag_depth.value--
}

async function on_drop(e: DragEvent) {
  drag_depth.value = 0
  const files = Array.from(e.dataTransfer?.files ?? [])
  for (const file of files) {
    await import_pack(file)
  }
}

/** 拖进来的压缩包：先确定它是哪种格式，再走对应的导入流程 */
async function import_pack(file: File) {
  if (state) return
  const fp = window.api.get_path_for_file(file)
  if (!fp) return notify.error('没能拿到文件路径……')
  const ext = (file.name.split('.').pop() ?? '').toLowerCase()

  let kind: 'svc' | 'vsp' | 'osz' | 'mcz' | 'music'
  if (ext == 'osz') kind = 'osz'
  else if (ext == 'mcz') kind = 'mcz'
  else if (ext == 'vsp') kind = 'vsp'
  else if (ext == 'svc' || ext == 'zip') {
    const detected = await Invoke('detect-chart-pack', { fp })
    if (detected == 'invalid') return notify.error('这个压缩包里没有可以导入的谱面……')
    kind = detected
  } else if (['mp3', 'ogg', 'wav', 'm4a'].includes(ext)) {
    kind = 'music'
  } else return notify.error(`不认识的格式：${ext || '没有扩展名'}……`)

  state = true
  try {
    const id = (await modal.AskIdModal.show({ all: GlobalStat.all_chart.map((x) => x.id) })) as
      undefined | string
    if (!id) return

    let err = false
    if (kind == 'osz') {
      if ((await Invoke('import-osz', { fp, id })) != 1) err = true
    } else if (kind == 'mcz') {
      if ((await Invoke('import-mcz', { fp, id })) != 1) err = true
    } else if (kind == 'vsp') {
      const r = await Invoke('import-vsp', { fp, id })
      if (r.state == 'failed') err = true
      else if (r.state == 'existed') err = true
    } else if (kind == 'music') {
      const r = await Invoke('import-song', { path: fp, id: id })
      if (r.state != 'success') err = true
    } else if (!(await Invoke('import-zip', { fp, id }))) {
      err = true
    }

    if (err) notify.error('导入失败，爆！')
    await GlobalStat.update_all_chart()
    shown.value = GlobalStat.all_chart
  } finally {
    state = false
  }
}

function open_proj(id: string) {
  if (state) return
  state = true
  Chart.open_chart(id).catch(() => {
    state = false
  })
}

function try_delete(id: string) {
  /*if (state) return
  if (!Storage._ref.value.settings.delete_no_confirm) {
    modal.ConfirmModal.show({
      msg: `确定要删除${name} (id: ${id})吗？不可以撤销的哦！<br><small>设置中可以关闭此确认。</small>`
    })
      .then(() => {
        debugger
        return Invoke('remove-chart', { id })
      })
      .catch(() => {})
      .then(() => {
        GlobalStat.update_all_chart()
      })
  } else {
    Invoke('remove-chart', { id })
  }*/
  if (state) return
  to_delete.value = id
  reconfirm.value = true
}

function do_delete(id: string) {
  if (state) return
  Invoke('remove-chart', { id }).then(() => {
    GlobalStat.update_all_chart()
  })
  delete_cancel()
}

function delete_cancel() {
  to_delete.value = undefined
  reconfirm.value = false
}

const to_delete = ref<string>()
const reconfirm = ref(false)

function detail(id: string) {
  if (state) return
  const ch = GlobalStat.all_chart.find((v) => v.id == id)
  if (!ch) return
  display_id.value = id
  display_data.value = ch
}

const username = Storage.data.value.username
const pass_days = (Date.now() - Storage.data.value.statistics.first_open) / (24 * 60 * 60 * 1000)
const running = Storage.running_time
const useLogo = computed(() => Storage.settings.stray_logo)
const tip = ref(utils.random(StartUpTips))
function random_tip() {
  tip.value = utils.random(StartUpTips)
}
</script>

<template>
  <div
    class="chart-list-wrapper"
    @dragenter.prevent="on_dragenter"
    @dragover.prevent
    @dragleave="on_dragleave"
    @drop.prevent="on_drop"
  >
    <div class="chart-list-left">
      <img
        v-if="useLogo"
        alt="logo"
        class="su-logo"
        draggable="false"
        src="/sv.png"
        @click="random_tip"
      />
      <div v-else class="su-title" @click="random_tip">stray/vivify</div>
      <div class="su-tip" v-html="tip" :class="utils.or(tip.length > 100, 'su-long')" />
      <div class="su-greeting">
        欢迎，{{ username }}<br />
        这是你使用stray/vivify的第{{ pass_days.toFixed(0) }}天！ <br />
        已运行：{{ utils.toTimeStr(running / 1000, 0) }}
      </div>
      <div v-if="!display_id" class="su-desc">
        广告位招租 <br />
        一定要请画师来加个看板……？
      </div>
      <div v-if="display_data" class="su-display">
        <div class="sd-title">{{ display_data.name }}</div>
        <div class="sd-composer">by {{ display_data.composer }}</div>
        <div class="sd-info">
          <span>bpm: {{ display_data.bpm }}</span>
          <span>id: {{ display_data.id }}</span>
        </div>
        <br />
        <div class="sd-diff">
          <div>Diffs:</div>
          <div v-for="d in display_data.diffs">- {{ d }}</div>
        </div>
      </div>
    </div>
    <div class="chart-list-right">
      <div class="charts-func">
        <div class="search-wrapper">
          <a-text-input v-model="search" class="charts-input" placeholder="点击输入文字！" />
          <div>{{ shown.length }} 结果</div>
        </div>
        <div class="importer">
          <a-button2 msg="导入曲目" @click="import_chart" />
        </div>
      </div>
      <div class="charts-wrapper">
        <TransitionGroup>
          <div
            v-for="chart in shown"
            :key="chart.id"
            class="chart-unit"
            @click="open_proj(chart.id)"
            @contextmenu="try_delete(chart.id)"
            @mouseenter="detail(chart.id)"
          >
            <div class="chart-unit-name">{{ chart.name }}</div>
            <div class="chart-unit-cid">
              <div class="chart-unit-composer">{{ chart.composer }}</div>
              <div class="chart-unit-id">id: {{ chart.id }}</div>
            </div>
            <a-img :src="`stray:///__sprite__/${chart.id}`" class="chart-unit-bg">
              <img alt="???" class="chart-unit-bg" src="/song.jpg" style="opacity: 0.3" />
            </a-img>
            <transition>
              <div v-if="to_delete == chart.id" class="chart-unit-delete">
                <div>真的要删掉吗？</div>
                <a-button2
                  msg="我确定！"
                  style="color: #e66"
                  @click.capture.stop="do_delete(chart.id)"
                />
                <a-button2 msg="算了算了" @click.capture.stop="delete_cancel" />
              </div>
            </transition>
          </div>
        </TransitionGroup>
        <div v-if="shown.length == 0">这里没有歌哦。试试导入和更换搜索方式吧！</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.chart-list-wrapper {
  display: grid;
  grid-template-columns: 45vw 55vw;
  justify-content: space-between;
  height: calc(100vh - 2rem);
  width: 100vw;
}

.chart-list-left {
  position: relative;
  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: 1fr auto 6rem 10fr;
  justify-items: center;
  gap: 20px;

  overflow-x: hidden;
  overflow-y: auto;
  scrollbar-width: none;
  padding-bottom: 250px;
}

.su-title {
  font-size: 2.5rem;
  text-align: center;
  position: relative;
  padding-top: 10%;
  cursor: pointer;
}

.su-logo {
  padding-top: 5%;
  width: 260px;
  cursor: pointer;
}

.su-tip {
  position: relative;
  color: gold;
  line-height: 1.5rem;
  max-width: 85%;
}

.su-long {
  text-indent: 2em each-line;
}

.su-greeting {
  text-align: center;
}

.su-desc {
  font-size: 1.5rem;
  width: 100%;
  text-align: center;
}

.su-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  text-wrap: nowrap;
  text-overflow: ellipsis;
}

.sd-title {
  font-size: 1.5rem;
  height: 1.8rem;
  max-width: 35vw;
  text-overflow: ellipsis;
  overflow: hidden;
}

.sd-info {
  width: 50%;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 25px;
  align-content: space-evenly;
  margin-top: 15px;
  max-width: 90%;
}

.sd-info > span:first-child {
  text-align: left;
}

.sd-info > span:last-child {
  text-align: right;
  text-wrap: nowrap;
  text-overflow: ellipsis;
}

.sd-diff {
  width: 50%;
  text-overflow: ellipsis;
  text-align: left;
}

.chart-list-right {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow-x: hidden;
}

.charts-func {
  height: 5rem;
  border-bottom: 2px solid #b8dcee;
  margin-bottom: 15px;
  display: flex;
  flex-direction: row;
  align-items: center;
  padding-right: 10%;
}

.search-wrapper {
  flex-grow: 1;
  padding-left: 25px;
}

.importer {
  display: flex;
  flex-direction: column;
  justify-content: space-evenly;
  height: 100%;
}

.charts-input {
  width: calc(100% - 50px);
  text-align: left;
}

.charts-wrapper {
  display: flex;
  flex-direction: column;
  gap: 10px;
  height: calc(100vh - 7rem - 20px);
  overflow: hidden auto;
  transform: translateX(calc(0 - var(--ch-transform-len)));
  border: 4px solid transparent;
  width: calc(100% - 10px);
  padding-top: 5px;

  --ch-transform-len: 0.5rem;
}

.chart-unit {
  display: flex;
  flex-direction: column;
  transition: 0.2s ease all;
  cursor: pointer;
  transform: translateX(var(--ch-transform-len));
  padding: 5px;
  border-radius: 5px;
  min-height: 2.2rem;
  position: relative;
  max-width: calc(100% - 5px);
}

.chart-unit:last-child {
  margin-bottom: 120px;
}

.chart-unit:hover {
  transform: translateX(2px);
}

.chart-unit:hover > .chart-unit-cid {
  filter: brightness(1.5);
}

.chart-unit > div {
  user-select: none;
}

.chart-unit:hover .chart-unit-name {
  box-shadow: 0 0 2px black;
  background-color: rgba(0, 0, 0, 0.4);
  color: #e2f2ff;
}

.chart-unit-bg {
  width: 100%;
  position: absolute;
  height: 100%;
  object-fit: cover;
  z-index: var(--z-background);
  top: 0;
  left: 0;
  filter: blur(2px);
  opacity: 0.6;
}

.chart-unit-name {
  text-align: left;
  text-wrap: nowrap;
  line-height: 1.2rem;
  font-size: 1.2rem;
  font-weight: bold;
  width: min-content;
  transition: all 0.2s ease;
  height: 1.2rem;
  max-width: 50vw;
}

.chart-unit-cid {
  display: flex;
  flex-direction: row;
  justify-content: space-around;
}

.chart-unit-composer {
  text-align: left;
}

.chart-unit-id {
  text-align: right;
  opacity: 0.7;
  flex-grow: 1;
  padding-right: 10px;
}

.chart-unit-delete {
  display: grid;
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  backdrop-filter: blur(4px);
  grid-template-columns: 4fr 1fr 1fr;
  padding-left: 5px;
  box-sizing: border-box;
  background-color: rgba(0, 0, 0, 0.4);
  align-items: center;
  box-shadow: red 0 0 4px;
}

.v-move, /* 对移动中的元素应用的过渡 */
.v-enter-active,
.v-leave-active {
  transition: all 0.3s ease;
}

.v-enter-from,
.v-leave-to {
  opacity: 0;
  transform: translateX(50px);
}
</style>
