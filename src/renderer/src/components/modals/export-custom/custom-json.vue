<script lang="ts" setup>
import AButton from '@renderer/components/a-elements/a-button.vue'
import ACheckbox from '@renderer/components/a-elements/a-checkbox.vue'
import ATextInput from '@renderer/components/a-elements/a-text-input.vue'
import JsonEditor from '@renderer/components/miscellaneous/json-editor.vue'
import WordHelper from '@renderer/components/miscellaneous/word-helper.vue'
import { Chart_diff } from '@renderer/core/chart/diff'
import { Invoke } from '@renderer/core/ipc'
import { modal } from '@renderer/core/misc/modal'
import { CustomSongInfo } from '@preload/types'
import { Chart } from '@renderer/core/chart/chart'
import { ref } from 'vue'
import { Storage } from '@renderer/core/storage'

const chart = Chart.$current
const info_data = defineModel<CustomSongInfo>({ required: true })

const { diff_indexs } = defineProps<{
    diff_indexs: number[]
}>()

const args = ref({
    crop: Storage.settings.exporter.crop,
    as_id: chart.id,
    sv: Storage.settings.exporter.sv
})
function do_export() {
    const gml = info_data.value
    if (!gml) return
    const diffs = diff_indexs.map((ix) =>
        ix == -1 ? 0 : Chart_diff.to_vsc(chart.diffs[ix]).join('\n')
    )
    const _arg = {
        crop: args.value.crop,
        as_id: args.value.as_id == '' ? undefined : args.value.as_id,
        sv: args.value.sv,
        diffs: diffs,
        gml: JSON.stringify(gml, null, 4),
        id: chart.id
    }
    chart
        .save()
        .then(() => Invoke('export-for-custom', { data: _arg }))
        .then(() => {
            modal.close_all()
        })
}
</script>

<template>
    <div class="custom-json">
        <div class="custom-json-functions">
            <WordHelper dec="指定导出文件夹的命名，若不给定则使用内置默认命名" msg="文件夹名" />
            <a-text-input v-model="args.as_id" />
            <WordHelper dec="是否裁剪图片，勾选则会剪切中间的正方形，不勾选则拉伸" msg="裁剪" />
            <a-checkbox v-model="args.crop" />
            <WordHelper dec="是否在导出中包含stray/vivify的数据文件（不*应该*影响customsong的读取）" msg="SV" />
            <a-checkbox v-model="args.sv" />
            <a-button class="custom-json-export-btn" msg="Export" @click="do_export" />
        </div>
        <div class="custom-json-editor">
            <JsonEditor v-model="info_data" :editable="true" />
        </div>
    </div>
</template>

<style>
.custom-json-diff-left div:nth-child(2n + 1) {
    border: #b8dcee 2px solid;
    width: 15rem;
    height: 3rem;
    line-height: 3rem;
}

.diff-single :nth-child(1) {
    grid-area: a;
}

.diff-single :nth-child(2) {
    grid-area: b;
    font-size: 0.9rem;
}

.diff-single :nth-child(3) {
    grid-area: c;
    font-size: 0.8rem;
    opacity: 0.8;
}

.custom-json {
    display: flex;
    flex-direction: row;
    flex-wrap: nowrap;
    width: 100%;
    height: 100%;
}

.custom-json-functions {
    display: grid;
    grid-template-columns: 5rem 1fr;
    justify-items: center;
    width: min-content;
    padding: 10px;
    height: min-content;
}

.custom-json-editor {
    flex-grow: 1;
    font-size: 1rem;
    height: 100%;
    overflow-y: auto;
    min-height: 0;
    border-left: 2px #b8dcee dotted;
}

.custom-json-export-btn {
    grid-column: span 2;
    text-align: center;
    margin-top: 15px;
}
</style>
