<script lang="ts" setup>
import SimpleModal from '@renderer/components/modals/simple-modal.vue'
import Credits from '@renderer/components/credits/credits.vue'
</script>

<template>
  <SimpleModal size="2" title="Credits">
    <div class="credits-wrapper">
      <Credits />
    </div>
  </SimpleModal>
</template>

<style>
.credits-wrapper {
  overflow-y: auto;
  min-height: 60vh;
  max-height: 70vh;
}
</style>
