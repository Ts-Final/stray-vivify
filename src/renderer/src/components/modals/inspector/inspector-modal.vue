<script lang="ts" setup>
import SimpleModal from '@renderer/components/modals/simple-modal.vue'
import { ref } from 'vue'
import ATab from '@renderer/components/a-elements/a-tab.vue'
import InspectorLog from '@renderer/components/modals/inspector/inspector-log.vue'
import InspectorFrameRate from '@renderer/components/modals/inspector/inspector-frame-rate.vue'
import InspectorImg from '@renderer/components/modals/inspector/inspector-img.vue'
import InspectorDisk from '@renderer/components/modals/inspector/inspector-disk.vue'

const func_state = ref(0)
</script>

<template>
  <SimpleModal size="3" title="Log">
    <div class="inspector-wrapper">
      <ATab v-model="func_state">
        <div>Log</div>
        <div>Performance</div>
        <div>Lack Img</div>
        <div>Disk Usage</div>
      </ATab>
      <inspector-log v-if="func_state == 0" />
      <inspector-frame-rate v-if="func_state == 1" />
      <inspector-img v-if="func_state == 2" />
      <inspector-disk v-if="func_state == 3" />
    </div>
  </SimpleModal>
</template>

<style>
.inspector-wrapper {
  height: 60vh;
  width: 100%;
  display: flex;
  flex-direction: column;
}
.inspector-modal-log-wrapper {
  overflow: auto;
  width: calc(90% - 20px);
  display: flex;
  flex-direction: column;
  margin-left: 5%;
  background: var(--darker-bgi);
  margin-bottom: 5%;
  border: 2px solid white;
  padding: 5px;
  gap: 5px;
  flex-grow: 1;
}
.inspector-modal-counter {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr 1fr 1fr;
  padding-bottom: 2rem;
  margin-left: 5%;
}
.inspector-modal-counter > div:not(:last-child) {
  cursor: pointer;
}
.inspector-modal-counter > div:last-child {
  cursor: help;
}
.inspector-modal-log-wrapper > div {
  display: grid;
  grid-template-columns: 5rem 1fr;
  word-break: break-all;
}
.inspector-modal-warn {
  background: #f3ff1f66;
}
.inspector-modal-err {
  background: darkred;
}
.inspector-modal-fr-wrapper {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  overflow: auto;
  user-select: none;
}
.inspector-modal-fr-header {
  width: 100%;
  text-align: center;
  line-height: 3rem;
  font-size: 1.5rem;
  font-weight: bold;
}
.inspector-modal-fr-table {
  width: 90%;
  margin-left: 5%;
  text-align: center;
  border-collapse: collapse;
  table-layout: fixed;
}
.inspector-modal-fr-table td {
  border: 1px solid white;
}
.inspector-modal-fr-table tr:first-child {
  line-height: 1.4rem;
}
.inspector-modal-imgs-wrapper {
  display: grid;
  grid-template-columns: 1fr 1fr;
  overflow-y: hidden;
  max-height: 100%;
  margin-top: 15px;
}
.inspector-modal-imgs-header {
  border-bottom: 2px solid #b8dcee;
  border-collapse: collapse;
  line-height: 1.5rem;
  margin-bottom: 10px;
}
.inspector-modal-imgs-wrapper > div {
  display: grid;
  grid-template-columns: 1fr 1fr;
  width: 100%;
  justify-items: center;
}
.inspector-modal-memory-wrapper {
  display: grid;
  grid-template-columns: 1fr 1fr;
  user-select: none;
}
.inspector-modal-memory-wrapper > div {
  display: grid;
  grid-template-columns: 1fr 1fr;
}
.inspector-modal-memory-wrapper > div > span {
  width: 100%;
  grid-column: 2;
}
.inspector-modal-memory-wrapper > div > div {
  padding: 0 5px;
}
.inspector-modal-memory-wrapper > div > div:nth-child(2n) {
  text-align: right;
}

.inspector-modal-disk-wrapper {
  display: grid;
  grid-template-columns: 1fr 2fr;
  user-select: none;
  height: 90%;
}
.inspector-modal-disk-wrapper-loading {
  text-align: center;
}
.inspector-modal-disk-header {
  grid-column: 1/3;
  margin: 15px;
  font-size: 1.5rem;
  border-bottom: 2px solid #b8dcee;
  line-height: 3rem;
  text-align: center;
}
.inspector-modal-disk-total {
  display: grid;
  grid-template-columns: 1fr 1fr;
  justify-items: center;
  gap: 10px;
  height: min-content;
}
.inspector-modal-disk-list {
  display: grid;
  grid-template-columns: 1fr 1fr;
  height: calc(100%);
  overflow-y: auto;
}
.inspector-modal-disk-total > div:nth-child(odd) {
  text-align: right;
  width: 100%;
}
.inspector-modal-disk-list-name {
  text-align: right;
  padding-right: 10px;
}
.inspector-modal-disk-list-sep {
  text-align: center;
  font-size: 1.2rem;
  grid-column: 1/3;
  border-bottom: 1px solid #b8dcee;
  margin-bottom: 5px;
  width: 6rem;
  padding: 0 5px;
  justify-self: center;
}
</style>
