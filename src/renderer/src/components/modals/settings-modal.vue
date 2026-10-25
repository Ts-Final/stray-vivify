<script lang="ts" setup>
import SimpleModal from '@renderer/components/modals/simple-modal.vue'
import AButton from '@renderer/components/a-elements/a-button.vue'
import { Storage } from '@renderer/core/storage'
import ANumberInput from '@renderer/components/a-elements/a-number-input.vue'
import SettingHeader from '@renderer/components/modals/setting-header.vue'
import AColorInput from '@renderer/components/a-elements/a-color-input.vue'
import { modal } from '@renderer/core/misc/modal'
import { Invoke } from '@renderer/core/ipc'
import ATextInput from '@renderer/components/a-elements/a-text-input.vue'
import ACheckbox2 from '@renderer/components/a-elements/a-checkbox2.vue'
import { defineComponent, h, onUnmounted } from 'vue'
import { EventHub } from '@renderer/core/misc/eventhub'
import { Chart } from '@renderer/core/chart/chart'
import AButton2 from '@renderer/components/a-elements/a-button2.vue'
import { AntiAddiction } from '@renderer/core/misc/anti-addiction'

const r = Storage._ref

const ds = defineComponent({
  name: 'ds',
  setup(_, { slots }) {
    return () => h('div', { class: 'ds' }, slots.default?.())
  }
})
onUnmounted(() => {
  Chart.current?.diff.force_fuck()
  Storage.save()
})
</script>

<template>
  <SimpleModal size="2" title="设置">
    <div class="settings-wrapper">
      <div class="contain">
        <div style="width: 100%; text-align: center; grid-column: span 2">
          编辑数字可以使用键盘上下和滚轮哦。
        </div>
        <setting-header msg="欢迎来到stray-vivify！" />

        <div>设定一个名字吧！</div>
        <a-text-input v-model="r.username" />
        <ds>会帮你自动填到谱师栏</ds>
        <div>显示stray/vivify图标</div>
        <a-checkbox2 v-model="r.settings.stray_logo" />

        <setting-header msg="子页面" />
        <div class="settings-fns">
          <a-button2 msg="快捷键设置" @click="modal.ShortcutModal.show({})" />
          <a-button2 msg="Fn排列" @click="modal.FnTabsModal.show({})" />
          <a-button2 msg="DevTools" @click="Invoke('open-dev')" />
        </div>

        <setting-header msg="Lane部分" />
        <div>lane-width (px)</div>
        <a-number-input v-model="r.settings.lane_width" class="in" min="1" />
        <ds>每个lane的宽度。以像素为单位。</ds>
        <div>最小Lane</div>
        <a-number-input v-model="r.settings.min_lane" class="in" min="1" />
        <div>右侧分音</div>
        <a-checkbox2 v-model="r.settings.show_ticks" />

        <setting-header msg="界面与显示" />

        <div>最高流速</div>
        <a-number-input v-model="r.settings.max_scale" class="in" min="1" />
        <div>最高分度</div>
        <a-number-input v-model="r.settings.max_meter" class="in" min="1" />
        <div>Stats面板</div>
        <a-checkbox2 v-model="r.settings.song_stats" />
        <div>彩色Stats</div>
        <a-checkbox2 v-model="r.settings.color_stats" />
        <div>显示Version</div>
        <a-checkbox2 v-model="r.settings.always_version" />

        <setting-header msg="编辑功能" />

        <div>滚轮反转</div>
        <a-checkbox2 v-model="r.settings.reverse_scroll" />
        <div>延迟（视觉）</div>
        <a-number-input v-model="r.settings.offset1" class="in" />
        <div>密度采样间隔</div>
        <a-number-input v-model="r.settings.density_data_count" class="in" min="10" />
        <ds>密度折线的采样数，也即折线的数据点数</ds>
        <div>小节号或拍号</div>
        <a-checkbox2 v-model="r.settings.bar_or_section" />
        <ds>
          仿照malody，不使用小节来标注，而是每一个四分音符（按timing的bpm）标一个。<br />勾选这个=启用beat。
        </ds>
        <div>显示Beat时间</div>
        <a-checkbox2 v-model="r.settings.beat_fn_time" class="in" />
        <ds>在启用Beat的时候自动开启。</ds>
        <div>Beat从0开始</div>
        <a-checkbox2 v-model="r.settings.bar_from_0" />
        <div>note时间容差</div>
        <a-number-input v-model="r.settings.nearest" />
        <ds>
          摆放note时，会自动对齐至已存在的最近(+-本数值ms)的note的时间。
          <br />在AiMod中，时间相差不大于该值的note会被认定为同一时间。
        </ds>
        <div>Beat容差</div>
        <a-number-input v-model="r.settings.beat_tolerance" />
        <ds>
          有时候计算beat会在bpm切换处爆炸（指堆叠），本数值为：在每个bpm结束前多少ms不认为有beat。
        </ds>
        <div class="rainbow-text-flow" style="font-size: 2rem; font-weight: bold">自动保存</div>
        <a-checkbox2 v-model="r.settings.auto_save" />
        <ds>在播放的时候会暂停。</ds>
        <div>note功能限制</div>
        <a-checkbox2 v-model="r.settings.restrict_feature" />
        <ds>限制sv的note选择功能，避免出现*你不想要*的那些note</ds>

        <setting-header msg="防沉迷提醒" />
        <ds>我为什么要写这个？？？</ds>
        <div>启用</div>
        <a-checkbox2 v-model="r.settings.addict.enabled" />
        <div>间隔（分钟）</div>
        <a-number-input v-model="r.settings.addict.minutes" />
        <div>使用弹窗</div>
        <a-checkbox2 v-model="r.settings.addict.popup" />
        <ds>
          勾选此项，会使用类似本窗口的modal来进行提醒
            <a-button2 msg="试一下！" @click="AntiAddiction.try_out()" />
          ，不勾则会使用右上角的notify来进行提醒
        </ds>

        <setting-header msg="难度参考" />

        <div>编辑难度lane width</div>
        <a-number-input v-model="r.settings.diff_reference.main_lw" min="1" />
        <div>参考难度lane width</div>
        <a-number-input v-model="r.settings.diff_reference.ref_lw" min="1" />
        <div>背景不透明度</div>
        <a-number-input v-model="r.settings.diff_reference.bg_op" max="100" min="0" />
        <ds>背景模式下：参考难度的不透明度。</ds>
        <div>左右颠倒</div>
        <a-checkbox2 v-model="r.settings.diff_reference.reverse" />
        <ds>勾选时，参考难度在左，编辑难度在右。勾选背景时不生效。</ds>

        <setting-header msg="Note分组" />

        <ds>
          note分组逻辑：每一段时间（最小触发间隔按照interval设置，这是音频的时间而不是现实时间），将
          [current - 时间范围, current + 时间范围 + 可见长度] 的时间内的note加载到缓存（渲染组）
          里面（可见长度是通过屏幕大小和流速计算的一个时间值，相当于屏幕等高的轨道板对应的时间长度）。
        </ds>

        <div>时间范围</div>
        <a-number-input v-model="r.settings.pooling.ahead" class="in" />
        <div>最小pooling间隔</div>
        <a-number-input v-model="r.settings.pooling.interval" min="16" />
        <ds v-if="r.settings.pooling.interval >= r.settings.pooling.ahead" class="warn">
          pooling间隔不应该大于时间范围设置。
        </ds>

        <setting-header msg="音频设置" />

        <div>打击音</div>
        <a-checkbox2 v-model="r.settings.hit_sound" />
        <div>打击音延迟</div>
        <a-number-input v-model="r.settings.offset3" class="in" />
        <div>打击音音量</div>
        <a-number-input v-model="r.settings.hit_volume" class="in" max="100" min="0" step="1" />
        <div>音乐音量</div>
        <a-number-input v-model="r.settings.music_volume" class="in" max="100" min="0" step="1" />

        <setting-header msg="预览模式" />

        <div>左侧显示小节数</div>
        <a-checkbox2 v-model="r.settings.record_field.show_bar_text" />
        <div>显示小节线</div>
        <a-checkbox2 v-model="r.settings.record_field.show_beat_line" />
        <div>左侧小节线下显示bpm</div>
        <a-checkbox2 v-model="r.settings.record_field.show_bpm_left" />
        <div>底部显示#timing</div>
        <a-checkbox2 v-model="r.settings.record_field.show_bpm_bottom" />
        <div>右侧信息密度</div>
        <a-number-input v-model="r.settings.record_field.detail" max="5" min="0" />
        <div>球ticks</div>
        <a-checkbox2 v-model="r.settings.record_field.show_circles" />
        <div>球ticks速度</div>
        <a-number-input
          v-model="r.settings.record_field.circle_speed"
          max="2"
          min="0.1"
          step="0.01"
        />

        <setting-header msg="小节线" />

        <div>小节线颜色 1</div>
        <a-color-input v-model="r.settings.sprites.bar_color1" />
        <div>小节线颜色 4</div>
        <a-color-input v-model="r.settings.sprites.bar_color2" />
        <div>小节线颜色 8</div>
        <a-color-input v-model="r.settings.sprites.bar_color3" />
        <div>小节线颜色 16</div>
        <a-color-input v-model="r.settings.sprites.bar_color4" />
        <div>小节线颜色 32</div>
        <a-color-input v-model="r.settings.sprites.bar_color5" />
        <div>小节线颜色 48</div>
        <a-color-input v-model="r.settings.sprites.bar_color6" />
        <div>小节线颜色 64</div>
        <a-color-input v-model="r.settings.sprites.bar_color7" />
        <div>小节线<b class="rainbow-text-color">不</b>透明度</div>
        <a-number-input v-model="r.settings.sprites.bar_op" max="100" min="0" step="1" />
        <ds>别看成透明度了。</ds>
        <div>小节线宽度</div>
        <a-number-input v-model="r.settings.sprites.bar_length" min="0" />
        <ds v-if="r.settings.sprites.bar_length == 0" class="warn"> 真的吗？ </ds>
        <div>小节线偏移</div>
        <a-number-input
          v-model="r.settings.sprites.bar_dy"
          @update:model-value="EventHub.dispatch('audio-time-update')"
        />
        <ds>调节小节线的位置。正值为向上移。默认是穿过note中心。</ds>

        <setting-header msg="游玩判定" />
        <ds>不必在意……</ds>

        <div>Pure</div>
        <a-number-input v-model="r.settings.judgement.p1" min="0" />
        <div>Perfect</div>
        <a-number-input v-model="r.settings.judgement.p2" min="0" />
        <div>Great</div>
        <a-number-input v-model="r.settings.judgement.p3" min="0" />
        <div>Good</div>
        <a-number-input v-model="r.settings.judgement.p4" min="0" />
        <div>Bomb</div>
        <a-number-input v-model="r.settings.judgement.p5" min="0" />
        <div>延迟（游玩）</div>
        <a-number-input v-model="r.settings.offset2" class="in" />
        <div>延迟（视觉）</div>
        <a-number-input v-model="r.settings.offset3" class="in" />

        <setting-header msg="导出设置" />

        <div>剪裁图片</div>
        <a-checkbox2 v-model="r.settings.exporter.crop" />
        <ds>勾选会将导出的图片剪裁为正方形。不勾选则会拉伸（压缩）成正方形</ds>
        <div>导出stray/vivify文件</div>
        <a-checkbox2 v-model="r.settings.exporter.sv" />

        <setting-header msg="开发者选项" />

        <div>Mouse Tracker</div>
        <a-checkbox2 v-model="r.settings.mouse_tracker" />
        <ds>osu!std同款鼠标</ds>
        <div>禁用Inspector</div>
        <a-checkbox2 v-model="r.settings.disable_inspect" />
        <ds>
          开启后会禁用报错提示（下面这个）。能够在极限情况下提升性能（比如240FPS）。不建议开启。
          <br />如果一定要开，好问题，just burn it and make a new pc.jpg
        </ds>
        <div>报错时notify</div>
        <a-checkbox2 v-model="r.settings.err_notify" />
        <ds>不建议关闭。</ds>
        <div class="settings-fns"></div>
      </div>
    </div>
    <template #footer>
      <a-button msg="帮助文档" @click="modal.H2PModal.show({})" />
      <a-button msg="Inspector" @click="modal.InspectorModal.show({})" />
      <a-button msg="查看Version" @click="modal.VersionsModal.show({})" />
      <a-button msg="Credits" @click="modal.CreditsModal.show({})" />
    </template>
  </SimpleModal>
</template>

<style scoped>
.settings-wrapper {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  max-height: 60vh;
}

.contain {
  flex: 1;
  width: 100%;
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 5px 10px;
  overflow-y: scroll;
  text-align: center;
  align-items: center;
}
.contain > div:not(.settings-header),
span,
s {
  text-align: left;
  padding-left: 15px;
}
.ds {
  grid-column: span 2;
  opacity: 0.8;
  padding-top: 0;
  margin-bottom: 10px;
  text-indent: 2rem;
}

select {
  width: 80%;
  border: none;
  outline: none;
  background-color: transparent;
  text-align: center;
  line-height: 1.3rem;
  font-size: 1rem;
}

option {
  color: black;
}

input {
  max-width: 60%;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
}
input[type='text'] {
  padding: 2px 0;
}
input[type='number'] {
  max-width: 30%;
  padding: 2px 0;
}

input:focus {
  border-bottom: transparent 1px solid !important;
}
:deep(.a-color-input) {
  justify-items: flex-start;
  width: min-content;
  gap: 0 20px;
}
input[type='checkbox'] {
  width: min-content;
}

.in ::-webkit-inner-spin-button,
.in ::-webkit-outer-spin-button {
  appearance: none;
}
.warn::before {
  content: '⚠';
  color: gold;
}
.settings-fns {
  grid-column: span 2;
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 5px 10px;
}
</style>
