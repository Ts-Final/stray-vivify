<script lang="ts" setup>
import SimpleModal from '@renderer/components/modals/simple-modal.vue'
import AButton2 from '@renderer/components/a-elements/a-button2.vue'
import { AntiAddiction } from '@renderer/core/misc/anti-addiction'
import { closeModal } from '@kolirt/vue-modal'

defineProps<{ msg: string[] }>()
function close_and_disable() {
  AntiAddiction.disable = true
  closeModal()
}
</script>

<template>
  <simple-modal size="2">
    {{ msg[1] }}
    <br />
    <div class="anti-addict-by">--{{ msg[0] }}</div>
    <template #footer>
      <a-button2 msg="本次启动关闭" @click="close_and_disable" />
      <a-button2 msg="ok" @click="closeModal()" />
    </template>
  </simple-modal>
</template>

<style>
.anti-addict-by {
  text-indent: 2rem;
  opacity: 0.7;
}
</style>
