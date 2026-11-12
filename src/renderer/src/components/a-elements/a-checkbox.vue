<script lang="ts" setup>

const m = defineModel<boolean>()
</script>

<template>
  <input class="a-checkbox" v-model="m" type="checkbox"/>
</template>

<style>
.a-checkbox {
  vertical-align: center;
  align-self: center;
}
</style>
