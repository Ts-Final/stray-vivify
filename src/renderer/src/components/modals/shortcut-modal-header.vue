<script lang="ts" setup>
const { msg } = defineProps<{ msg: string }>()
</script>

<template>
  <tr class="sc-header">
    <td colspan="4">{{ msg }}</td>
  </tr>
</template>

<style>
.sc-header {
  height: 2rem;
  line-height: 2rem;
  font-weight: bold;
  font-size: 1.2rem;
}
</style>
