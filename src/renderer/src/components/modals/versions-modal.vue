<script lang="ts" setup>
import SimpleModal from '@renderer/components/modals/simple-modal.vue'
import Versions from '@renderer/components/credits/versions.vue'
import { Version } from '@renderer/core/storage'
</script>

<template>
  <SimpleModal size="4">
    <template #header> 版本更新日志 （当前版本： {{ Version.str }} </template>
    <div class="versions-wrapper">
      <Versions />
    </div>
  </SimpleModal>
</template>

<style>
.versions-wrapper {
  overflow-y: auto;
  max-height: 70vh;
}

::-webkit-scrollbar {
  background: transparent;
}
</style>
