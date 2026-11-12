<script lang="ts" setup>
import SimpleModal from '@renderer/components/modals/simple-modal.vue'
import { closeModal, confirmModal } from '@kolirt/vue-modal'
import AButton from '@renderer/components/a-elements/a-button.vue'

const { msg } = defineProps<{
  msg: string
}>()
</script>

<template>
  <SimpleModal :show-close="false" size="1">
    <span v-html="msg"></span>
    <template #footer>
      <a-button class="btn btn-primary" msg="确定" @click="confirmModal()" />
      <a-button class="btn btn-secondary" msg="no" @click="closeModal()" />
    </template>
  </SimpleModal>
</template>
