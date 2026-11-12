<script lang="ts" setup>
import SimpleModal from '@renderer/components/modals/simple-modal.vue'
import AButton2 from '@renderer/components/a-elements/a-button2.vue'

const { msg } = defineProps<{ msg: string }>()
</script>

<template>
  <simple-modal size="2">
    {{ msg }}
    <template #footer>
      <a-button2 msg="ok" @click="$emit('close')" />
    </template>
  </simple-modal>
</template>
