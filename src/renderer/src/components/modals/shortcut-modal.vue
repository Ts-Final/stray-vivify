<script lang="ts" setup>
import SimpleModal from '@renderer/components/modals/simple-modal.vue'
import ShortcutModalSingle from '@renderer/components/modals/shortcut-modal-single.vue'
import { ShortCuts } from '@renderer/core/misc/shortcut'
import ShortcutModalHeader from '@renderer/components/modals/shortcut-modal-header.vue'
</script>

<template>
  <SimpleModal size="1" title="快捷键设置">
    <div style="text-align: center">点击右侧的键位以输入</div>
    <table class="sc-table">
      <tbody>
        <shortcut-modal-header msg="切换宽度" />
        <shortcut-modal-single :short="ShortCuts.$fun('w1')" msg="1宽" />
        <shortcut-modal-single :short="ShortCuts.$fun('w2')" msg="2宽" />
        <shortcut-modal-single :short="ShortCuts.$fun('w3')" msg="3宽" />
        <shortcut-modal-single :short="ShortCuts.$fun('w4')" msg="4宽" />

        <shortcut-modal-header msg="切换类型" />
        <shortcut-modal-single :short="ShortCuts.$fun('mine')" msg="地雷" />
        <shortcut-modal-single :short="ShortCuts.$fun('s')" msg="s" />
        <shortcut-modal-single :short="ShortCuts.$fun('hold')" msg="面" />

        <shortcut-modal-header msg="CTRL家族" />
        <shortcut-modal-single :short="ShortCuts.$fun('undo')" msg="撤销" />
        <shortcut-modal-single :short="ShortCuts.$fun('redo')" msg="重做" />
        <shortcut-modal-single :short="ShortCuts.$fun('copy')" msg="复制" />
        <shortcut-modal-single :short="ShortCuts.$fun('cut')" msg="剪切" />
        <shortcut-modal-single :short="ShortCuts.$fun('paste')" msg="粘贴" />
        <shortcut-modal-single :short="ShortCuts.$fun('save')" msg="保存" />

        <shortcut-modal-header msg="Modals" />
        <shortcut-modal-single :short="ShortCuts.$fun('log')" msg="Inspector" />
        <shortcut-modal-single :short="ShortCuts.$fun('settings')" msg="Settings" />
        <shortcut-modal-single :short="ShortCuts.$fun('iexport')" msg="导入导出" />

        <shortcut-modal-header msg="键位" />
        <shortcut-modal-single :short="ShortCuts.$fun('4k1')" msg="4k-1" />
        <shortcut-modal-single :short="ShortCuts.$fun('4k2')" msg="4k-2" />
        <shortcut-modal-single :short="ShortCuts.$fun('4k3')" msg="4k-3" />
        <shortcut-modal-single :short="ShortCuts.$fun('4k4')" msg="4k-4" />

      <shortcut-modal-header msg="Debug"  />
      <shortcut-modal-single :short="ShortCuts.$fun('dev')" msg="打开devTools"  />
      <shortcut-modal-single msg="手动报错" :short="ShortCuts.$fun('error')"/>
      <shortcut-modal-single msg="一键刷新" :short="ShortCuts.$fun('refresh')" />
      </tbody>
    </table>
  </SimpleModal>
</template>

<style>
.sc-table {
  width: 100%;
  text-align: center;
  margin-top: 15px;
}
</style>
