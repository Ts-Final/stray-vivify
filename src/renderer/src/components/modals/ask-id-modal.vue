<script lang="ts" setup>
import { closeModal, confirmModal } from '@kolirt/vue-modal'
import AButton from '@renderer/components/a-elements/a-button.vue'
import SimpleModal from '@renderer/components/modals/simple-modal.vue'
import { computed, onMounted, ref } from 'vue'
import ATextInput from '@renderer/components/a-elements/a-text-input.vue'

const props = defineProps<{
  all: string[]
  def?: string
}>()

const pending = ref(props.def ?? '')
const valid = computed(() => !props.all.includes(pending.value) && pending.value.length > 0)

onMounted(() => {
  setTimeout(() => document.getElementById('id-input-box')?.focus(), 400)
})
</script>

<template>
  <SimpleModal :show-close="false" size="1">
    <div>请输入一个id以识别该曲目</div>
    <a-text-input
      id="id-input-box"
      v-model="pending"
      placeholder="这里输入哦"
      @keydown.enter.capture="confirmModal(pending)"
    />
    <div>建议：不要使用中文或特殊字符</div>
    <div v-if="all.includes(pending)">该id已存在。请换一个试试。</div>
    <template #footer>
      <a-button v-if="valid" class="btn btn-primary" msg="确定" @click="confirmModal(pending)" />
      <a-button class="btn btn-secondary" msg="no" @click="closeModal()" />
    </template>
  </SimpleModal>
</template>

<style>
#id-input-box {
  width: 90%;
}
</style>
