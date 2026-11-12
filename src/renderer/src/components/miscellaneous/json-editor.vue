<script lang="ts">
import { defineComponent, h, onBeforeUnmount, PropType, Ref, ref, VNode } from 'vue'

export default defineComponent({
  name: 'JsonTreeEditor',
  props: {
    modelValue: {
      type: [Object, Array, String, Number, Boolean, null] as PropType<any>,
      required: true
    },
    editable: {
      type: Boolean,
      default: false
    }
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const expandedPaths = ref(new Set<string>())
    const inputStates = new Map<
      string,
      { text: Ref<string>; valid: Ref<boolean>; lastCommittedValue: any }
    >()

    // 清理（可选）
    onBeforeUnmount(() => {
      inputStates.clear()
    })

    const initializeExpandedPaths = (value: any, path: (string | number)[] = []) => {
      if (value === null || typeof value !== 'object') return
      const pathStr = path.length === 0 ? 'root' : `root.${path.join('.')}`
      expandedPaths.value.add(pathStr)
      if (Array.isArray(value)) {
        value.forEach((_, i) => initializeExpandedPaths(value[i], [...path, i]))
      } else {
        Object.keys(value).forEach((k) => initializeExpandedPaths(value[k], [...path, k]))
      }
    }

    const safeModelValue = props.modelValue ?? {}
    initializeExpandedPaths(safeModelValue)

    const getTypeColorClass = (val: any): string => {
      if (val === null) return 'json-value-null'
      if (typeof val === 'string') return 'json-value-string'
      if (typeof val === 'number') return 'json-value-number'
      if (typeof val === 'boolean') return 'json-value-boolean'
      return 'json-value-other'
    }

    const updateNestedValue = (newValue: any, path: (string | number)[]) => {
      if (path.length === 0) {
        emit('update:modelValue', newValue)
        return
      }
      const root = { ...props.modelValue }
      let current = root
      for (let i = 0; i < path.length - 1; i++) {
        const p = path[i]
        if (Array.isArray(current[p])) {
          current[p] = [...current[p]]
        } else if (current[p] && typeof current[p] === 'object') {
          current[p] = { ...current[p] }
        }
        current = current[p]
      }
      const lastKey = path[path.length - 1]
      if (Array.isArray(current)) {
        current.splice(lastKey as number, 1, newValue)
      } else {
        current[lastKey as string] = newValue
      }
      emit('update:modelValue', root)
    }

    const toggleExpand = (pathStr: string) => {
      const newSet = new Set(expandedPaths.value)
      if (newSet.has(pathStr)) {
        newSet.delete(pathStr)
      } else {
        newSet.add(pathStr)
      }
      expandedPaths.value = newSet
    }

    const renderNode = (
      value: any,
      key: string | number | null,
      path: (string | number)[],
      level: number
    ): VNode[] => {
      const pathStr = path.length === 0 ? 'root' : `root.${path.join('.')}`
      const isArray = Array.isArray(value)
      const isObj = value !== null && typeof value === 'object'
      const expandable = isObj
      const isRoot = key === null
      const indentWidth = isRoot ? 0 : level * 20

      const children = isArray
        ? value.map((_: any, i: number) => i)
        : isObj
          ? Object.keys(value)
          : []

      const lines: VNode[] = []

      const toggleEl =
        !isRoot && expandable
          ? h(
              'span',
              {
                class: 'json-toggle',
                onClick: (e: Event) => {
                  e.stopPropagation()
                  toggleExpand(pathStr)
                }
              },
              expandedPaths.value.has(pathStr) ? '▼' : '▶'
            )
          : h('span', { class: 'json-toggle-placeholder' })

      const indent = h('span', { class: 'json-indent', style: { width: `${indentWidth}px` } })
      const contentChildren: VNode[] = []

      if (!isRoot) {
        contentChildren.push(h('span', { class: 'json-key' }, `${key}:`))
      }

      if (expandable) {
        contentChildren.push(h('span', { class: 'json-bracket' }, isArray ? '[' : '{'))
        if (!expandedPaths.value.has(pathStr)) {
          contentChildren.push(h('span', isArray ? '...]' : '...}'))
        }
      } else {
        if (props.editable && !isRoot) {
          const originalType = value === null ? 'null' : typeof value

          if (!inputStates.has(pathStr)) {
            // 首次渲染：用当前 model 值初始化
            inputStates.set(pathStr, {
              text: ref(value === null ? '' : String(value)),
              valid: ref(true),
              lastCommittedValue: value // 新增：记录上次成功提交的值
            })
          }

          const state = inputStates.get(pathStr)!

          if (value !== state.lastCommittedValue) {
            state.text.value = value === null ? '' : String(value)
            state.valid.value = true
            state.lastCommittedValue = value
          }

          const validateAndCommit = () => {
            const raw = state.text.value
            let newValue: any = raw
            let valid = true

            if (originalType === 'string') {
              newValue = raw
            } else if (originalType === 'number') {
              const trimmed = raw.trim()
              if (trimmed === '') {
                newValue = 0
              } else {
                const num = Number(trimmed)
                if (isNaN(num)) {
                  valid = false
                } else {
                  newValue = num
                }
              }
            } else if (originalType === 'boolean') {
              if (raw === 'true') {
                newValue = true
              } else if (raw === 'false') {
                newValue = false
              } else {
                valid = false
              }
            } else if (originalType === 'null') {
              newValue = null
            }

            state.valid.value = valid
            if (valid) {
              state.lastCommittedValue = newValue
              updateNestedValue(newValue, path)
            }
          }

          contentChildren.push(
            h('input', {
              class: [
                'json-value-input',
                { 'json-value-invalid': !state.valid.value },
                `json-value-${originalType}`
              ],
              value: state.text.value, // 始终用缓存值
              onInput: (e: Event) => {
                state.text.value = (e.target as HTMLInputElement).value
                validateAndCommit()
              },
              spellcheck: false
            })
          )
        } else {
          const displayVal = value === null ? 'null' : String(value)
          contentChildren.push(h('span', { class: getTypeColorClass(value) }, displayVal))
        }
      }

      lines.push(
        h(
          'div',
          {
            class: [
              'json-line',
              !isRoot && expandable ? 'json-line--expandable' : '',
              isRoot ? 'json-line--root' : ''
            ].filter(Boolean),
            onClick: !isRoot && expandable ? () => toggleExpand(pathStr) : undefined
          },
          [indent, toggleEl, ...contentChildren]
        )
      )

      if (expandable && expandedPaths.value.has(pathStr)) {
        for (const childKey of children) {
          lines.push(...renderNode(value[childKey], childKey, [...path, childKey], level + 1))
        }
        lines.push(
          h('div', { class: 'json-line json-line--close' }, [
            h('span', {
              class: 'json-indent',
              style: { width: `${(level + 1) * 20}px` }
            }),
            h('span', { class: 'json-bracket' }, isArray ? ']' : '}')
          ])
        )
      }

      return lines
    }

    return () => h('div', { class: 'json-tree-editor' }, renderNode(props.modelValue, null, [], 0))
  }
})
</script>
<style>
.json-tree-editor {
  font-family: Menlo, Monaco, Consolas, 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.4;
  border-radius: 4px;
}
.json-line {
  display: flex;
  align-items: center;
  padding: 2px 0;
  cursor: default;
}
.json-line--expandable {
  cursor: pointer;
}
.json-line--expandable:hover {
  background-color: rgba(0, 0, 0, 0.03);
}
.json-indent {
  display: inline-block;
  height: 1px;
}
.json-toggle {
  cursor: pointer;
  user-select: none;
  display: inline-block;
  width: 16px;
  color: #999;
  text-align: center;
}
.json-toggle-placeholder {
  display: inline-block;
  width: 16px;
}
.json-key {
  color: rgb(132, 194, 99);
  margin-right: 6px;
}
.json-bracket {
  color: #b8dcee;
}
.json-value-string {
  color: #690;
}
.json-value-number {
  color: #1a73e8;
}
.json-value-boolean {
  color: #d73a49;
}
.json-value-null {
  color: #7986cb;
}
.json-value-other {
  color: #24292e;
}
.json-value-input {
  background: transparent;
  border: none;
  border-bottom: 1px solid #b8dcee;
  font-family: Menlo, Monaco, Consolas, 'Courier New', monospace;
  font-size: 14px;
  padding: 1px 4px;
  width: 120px;
  transition: 0.1s all linear;
  flex-grow: 1;
  max-width: 350px;
}
.json-value-input:focus {
  outline: none;
}
.json-value-invalid {
  background-color: #ff332244 !important;
  background-blend-mode: lighten;
  filter: brightness(1.5);
}
</style>
