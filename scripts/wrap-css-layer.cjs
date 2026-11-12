/* eslint-disable @typescript-eslint/no-require-imports -- 这是一个 CommonJS 构建脚本 */
/**
 * 将 out 目录下所有构建产物的 CSS 声明包裹进一个 cascade layer。
 *
 * 皮肤（skin.css）是运行时以普通（未分层）样式表加载的。把应用自身的
 * CSS 放进 layer 后，未分层的 skin.css 会优先于应用默认样式，
 * 不需要再靠提高优先级或 !important 来覆盖。
 *
 * 用法：node scripts/wrap-css-layer.cjs [layerName]
 * 默认 layer 名：app（也可通过 CSS_LAYER_NAME 环境变量指定）
 */
const fs = require('node:fs')
const path = require('node:path')

const root = path.resolve(__dirname, '..')
const outDir = path.join(root, 'out')
const layerName = process.argv[2] || process.env.CSS_LAYER_NAME || 'app'

if (!/^[A-Za-z_-][\w.-]*$/.test(layerName)) {
  console.error(`[css-layer] 非法的 layer 名称: ${layerName}`)
  process.exit(1)
}

if (!fs.existsSync(outDir)) {
  console.error(`[css-layer] 找不到构建输出目录: ${outDir}`)
  process.exit(1)
}

const marker = `/* css-layer:${layerName} */`
const anyMarker = /\/\* css-layer:[\w.-]+ \*\//

/** 递归收集 out 下的 .css 文件 */
function collectCssFiles(dir) {
  const files = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) files.push(...collectCssFiles(full))
    else if (entry.isFile() && entry.name.endsWith('.css')) files.push(full)
  }
  return files
}

/**
 * @charset 必须位于样式表最前面，所以保留在 layer 外面。
 * BOM 同理。
 */
function splitPreamble(css) {
  let head = ''
  if (css.charCodeAt(0) === 0xfeff) head += css[0]
  const rest = css.slice(head.length)
  const charset = rest.match(/^\s*@charset\s+[^;]+;\s*/i)
  if (charset) head += charset[0]
  return { head, body: rest.slice(charset ? charset[0].length : 0) }
}

function wrapCss(css) {
  if (anyMarker.test(css)) return { css, changed: false }

  const eol = css.includes('\r\n') ? '\r\n' : '\n'
  const { head, body } = splitPreamble(css)
  if (!body.trim()) return { css, changed: false }

  const inner = body.replace(/\s+$/, '')
  return {
    css: `${head}${marker}${eol}@layer ${layerName} {${eol}${inner}${eol}}${eol}`,
    changed: true
  }
}

const cssFiles = collectCssFiles(outDir)
if (cssFiles.length === 0) {
  console.error(`[css-layer] ${outDir} 下没有找到任何 CSS 文件`)
  process.exit(1)
}

let changed = 0
for (const file of cssFiles) {
  const source = fs.readFileSync(file, 'utf8')
  const result = wrapCss(source)
  if (result.changed) {
    fs.writeFileSync(file, result.css)
    changed++
    console.log(`[css-layer] 已包裹: ${path.relative(root, file)}`)
  } else {
    console.log(`[css-layer] 已存在 layer，跳过: ${path.relative(root, file)}`)
  }
}

console.log(`[css-layer] 完成：${changed}/${cssFiles.length} 个文件包裹进 @layer ${layerName}`)
