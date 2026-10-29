import path, { extname } from 'node:path'
import fs from 'fs'
import { charts_data, CustomSongInfo, ImportVspResult } from '../preload/types'
import * as electron from 'electron'
import { dialog, shell } from 'electron'
import { file_paths } from './fp-parser'
import AdmZip from 'adm-zip'
import { find_png, find_song } from './stray'
import * as child_process from 'node:child_process'
import { ChartTypeV2 } from '../preload/chart-types'
import { OszReader } from './osz-reader'
import { MczReader } from './mcz-reader'
import { serialize } from './serialize'

/**
 * The surface shared by the chart packages we can read (osz / mcz).
 */
interface ChartPackReader {
  getAudioFile(): [string, Buffer] | null
  getImages(): [Buffer, string][]
  get_diffs(): ChartTypeV2.diff[]
  get_song(): ChartTypeV2.song | null
}

function timestr() {
  const date = new Date()
  return `${date.getHours()}${date.getMinutes()}${date.getSeconds()}`
}

const VSP_DIFF_NAMES = ['Opening', 'Middle', 'Finale', 'Encore']

/**
 * Parse a game-readable .vsc file into the chart data structure used by the editor.
 * Keep this in sync with Chart.load_vsc in the renderer.
 */
function parse_vsc(text: string): Pick<ChartTypeV2.diff, 'notes' | 'timing'> {
  const notes: ChartTypeV2.note[] = []
  const timing: ChartTypeV2.timing[] = []

  for (const raw_line of text.split(/\r?\n/)) {
    const line = raw_line.trim()
    if (!line) continue
    const [stime, stype, slane, sextra] = line.split(',')
    const time = Number.parseFloat(stime)
    const type = Number.parseInt(stype, 10)
    const lane = Number.parseInt(slane, 10)
    if (!Number.isFinite(time) || !Number.isFinite(type) || !Number.isFinite(lane)) continue

    if (type == 2) {
      // hold note: time,type,lane,end-time
      if (!sextra) continue
      const end_time = Number.parseFloat(sextra)
      if (!Number.isFinite(end_time)) continue
      notes.push({
        time,
        lane,
        width: 1,
        len: Math.max(end_time - time, 0)
      })
      continue
    }

    if (type == 3) {
      // bpm change: time,type,lane,b:bpm|t:time|v:...|s:...
      if (!sextra) continue
      const bpm = Number.parseFloat(sextra.split('|')[0].replace(/^b:\s*/, ''))
      if (!Number.isFinite(bpm)) continue
      timing.push({ time, bpm, num: 4, den: 4 })
      continue
    }

    let width = 1
    let snm = 0
    if (type == 1 || type == 7 || type == 8) width = 2
    if (type == 6 || type == 7) snm = 1
    if (type == 8) snm = 2
    notes.push({ time, lane, width, snm })
  }

  notes.sort((a, b) => a.time - b.time)
  timing.sort((a, b) => a.time - b.time)
  if (timing.length == 0) {
    timing.push({ time: 0, bpm: 120, num: 4, den: 4 })
  }
  return { notes, timing }
}

export default class ChartManager {
  private readonly charts_folder: string
  private data: charts_data = []
  private readonly json_path: string

  constructor() {
    this.charts_folder = file_paths.charts
    this.json_path = path.join(this.charts_folder, 'charts.json')
    this.read_json()
    this.rename()
    this.possible_charts()
    this.unexists()
    this.write_json()
  }

  add_chart(
    id: string,
    name: string,
    composer: string,
    bpm: string,
    ext: string,
    diffs: string[],
    last_open?: number
  ) {
    this.data.push({
      last_open: last_open ?? Date.now(),
      id,
      name,
      composer,
      bpm,
      ext,
      diffs
    })
    this.write_json()
  }

  update_chart(id: string, name: string, composer: string, bpm: string, diffs: string[]) {
    const chart = this.data.find((v) => v.id === id)
    if (chart) {
      chart.name = name
      chart.composer = composer
      chart.bpm = bpm
      chart.diffs = diffs
      this.write_json()
    }
  }

  import_song(fp: string, id: string) {
    const folder = path.join(this.charts_folder, id)
    if (fs.existsSync(folder)) {
      return {
        state: 'existed'
      }
    }
    try {
      fs.mkdirSync(folder)
      const song_path = path.join(folder, 'song' + path.extname(fp))
      fs.copyFileSync(fp, song_path)
      if (fs.existsSync(path.join(path.dirname(fp), 'vs-chart.json'))) {
        fs.copyFileSync(
          path.join(path.dirname(fp), 'vs-chart.json'),
          path.join(folder, 'vs-chart.json')
        )
        const chart = JSON.parse(
          fs.readFileSync(path.join(folder, 'vs-chart.json'), 'utf-8')
        ) as ChartTypeV2.final
        if (chart.version)
          this.add_chart(
            id,
            path.basename(fp, path.extname(fp)),
            chart.song.composer,
            chart.song.bpm,
            path.extname(fp),
            chart.diffs.map((v) => v.meta.diff1 + ' ' + v.meta.diff2)
          )
      } else {
        this.add_chart(
          id,
          path.basename(fp, path.extname(fp)),
          'unknown',
          'unknown',
          path.extname(fp),
          []
        )
      }
      return {
        state: 'success',
        folder: song_path,
        json: path.join(folder, 'vs-chart.json')
      }
    } catch (e) {
      return {
        state: 'failed',
        reason: JSON.stringify(e)
      }
    }
  }

  exists(id: string) {
    return this.data.some((v) => v.id === id)
  }

  remove_chart(id: string) {
    const index = this.data.findIndex((v) => v.id === id)
    if (index !== -1) {
      this.data.splice(index, 1)
      try {
        fs.rmSync(path.join(this.charts_folder, id), { recursive: true, force: true })
      } catch (e) {
        dialog.showErrorBox('Error', `Error removing song id ${id}.`)
      }
      this.write_json()
    }
  }

  id_list() {
    return this.data.map((v) => v.id)
  }

  chart_list() {
    return this.data
  }

  write_file(id: string, fname: string, data: string) {
    const chart = this.data.find((v) => v.id === id)
    if (chart) {
      fs.writeFileSync(path.join(this.charts_folder, id, fname), data)
    }
  }

  read_chart(id: string, ext: string) {
    const folder = path.join(this.charts_folder, id)
    if (fs.existsSync(path.join(folder, 'vs-chart.json'))) {
      return {
        data: fs.readFileSync(path.join(folder, 'vs-chart.json'), 'utf-8'),
        path: path.join(folder, 'song' + ext)
      }
    }
    return {
      data: undefined,
      path: path.join(folder, 'song' + ext)
    }
  }

  open_song(id: string) {
    const chart = this.data.find((v) => v.id === id)
    if (chart) {
      chart.last_open = Date.now()
      this.write_json()
      return this.read_chart(id, chart.ext)
    } else {
      this.remove_chart(id)
    }
    dialog.showErrorBox('Error', `Error opening song id ${id}, check if it exists.`)
    throw new Error('???')
  }

  write_chart(id: string, chd: ChartTypeV2.final) {
    const chart = this.data.find((v) => v.id === id)
    if (chart) {
      fs.writeFileSync(
        path.join(this.charts_folder, id, 'vs-chart.json'),
        JSON.stringify(chd, null, 2)
      )
    }
  }

  backup_chart(id: string, d: string) {
    const chart = this.data.find((v) => v.id === id)
    if (chart) {
      fs.writeFileSync(path.join(this.charts_folder, id, 'backup.json'), JSON.stringify(d, null, 2))
    }
  }

  /**
   * Write backup file with timestamp-based naming (binary .svb format)
   * 写入备份文件，使用时间戳命名（二进制 .svb 格式）
   * @param id - Chart ID
   * @param chartData - Chart final data to compress and store
   */
  async write_backup(id: string, chartData: ChartTypeV2.final) {
    const chart = this.data.find((v) => v.id === id)
    if (!chart) return

    const backupFolder = path.join(this.charts_folder, id, 'backup')

    // Create backup folder if it doesn't exist
    // 如果备份文件夹不存在则创建
    if (!fs.existsSync(backupFolder)) {
      fs.mkdirSync(backupFolder, { recursive: true })
    }

    // Generate timestamp-based filename (yymmdd-hhmmss)
    // 生成基于时间戳的文件名（yymmdd-hhmmss）
    const now = new Date()
    const year = now.getFullYear().toString().slice(-2)
    const month = (now.getMonth() + 1).toString().padStart(2, '0')
    const day = now.getDate().toString().padStart(2, '0')
    const hours = now.getHours().toString().padStart(2, '0')
    const minutes = now.getMinutes().toString().padStart(2, '0')
    const seconds = now.getSeconds().toString().padStart(2, '0')

    let baseFilename = `${year}${month}${day}-${hours}${minutes}${seconds}.svb`
    let filePath = path.join(backupFolder, baseFilename)

    // If file exists, add suffix with incrementing number
    // 如果文件已存在，添加递增序号后缀
    let counter = 1
    while (fs.existsSync(filePath)) {
      baseFilename = `${year}${month}${day}-${hours}${minutes}${seconds}-${counter}.svb`
      filePath = path.join(backupFolder, baseFilename)
      counter++
    }

    // Compress each diff and create the backup structure
    // 压缩每个diff并创建备份结构
    const compressedDiffs = chartData.diffs.map((diff) => serialize.compressDiff(diff))

    // Create a header with metadata
    // 创建包含元数据的头部
    const header = {
      version: chartData.version,
      song: chartData.song,
      diffCount: chartData.diffs.length
    }
    const headerBuffer = Buffer.from(JSON.stringify(header))

    // Combine all buffers: [header_length(4)][header][diff_count(4)][diff1_length(4)][diff1][diff2_length(4)][diff2]...
    // 组合所有缓冲区
    let totalSize = 4 + headerBuffer.length + 4
    for (const diffBuffer of compressedDiffs) {
      totalSize += 4 + diffBuffer.length
    }

    const finalBuffer = Buffer.alloc(totalSize)
    let offset = 0

    // Write header
    // 写入头部
    finalBuffer.writeUInt32BE(headerBuffer.length, offset)
    offset += 4
    headerBuffer.copy(finalBuffer, offset)
    offset += headerBuffer.length

    // Write diff count
    // 写入diff数量
    finalBuffer.writeUInt32BE(compressedDiffs.length, offset)
    offset += 4

    // Write each compressed diff
    // 写入每个压缩的diff
    for (const diffBuffer of compressedDiffs) {
      finalBuffer.writeUInt32BE(diffBuffer.length, offset)
      offset += 4
      diffBuffer.copy(finalBuffer, offset)
      offset += diffBuffer.length
    }

    // Write the backup file as binary
    // 以二进制形式写入备份文件
    fs.writeFileSync(filePath, finalBuffer)
  }

  /**
   * Get list of backup files for a chart
   * 获取谱面的备份文件列表
   * @param id - Chart ID
   * @returns Array of backup filenames sorted by time (newest first)
   */
  get_backup_list(id: string): string[] {
    const chart = this.data.find((v) => v.id === id)
    if (!chart) return []

    const backupFolder = path.join(this.charts_folder, id, 'backup')

    // Return empty array if backup folder doesn't exist
    // 如果备份文件夹不存在则返回空数组
    if (!fs.existsSync(backupFolder)) {
      return []
    }

    // Read all .svb files from backup folder
    // 读取备份文件夹中的所有 .svb 文件
    return fs
      .readdirSync(backupFolder)
      .filter((file) => file.endsWith('.svb'))
      .sort((a, b) => {
        // Sort by filename (timestamp-based, so alphabetical sort works)
        // 按文件名排序（基于时间戳，所以字母排序有效）
        return b.localeCompare(a) // Newest first
      })
  }

  /**
   * Load a backup file and return its content
   * 加载备份文件并返回其内容
   * @param id - Chart ID
   * @param backup_name - Backup filename
   * @returns Restored ChartTypeV2.final object, or undefined if not found
   */
  load_backup(id: string, backup_name: string): ChartTypeV2.final | undefined {
    const chart = this.data.find((v) => v.id === id)
    if (!chart) return undefined

    const backupPath = path.join(this.charts_folder, id, 'backup', backup_name)

    // Check if backup file exists
    // 检查备份文件是否存在
    if (!fs.existsSync(backupPath)) {
      return undefined
    }

    // Read and decompress backup content
    // 读取并解压缩备份内容
    try {
      const fileBuffer = fs.readFileSync(backupPath)
      let offset = 0

      // Read header length and data
      // 读取头部长度和数据
      const headerLength = fileBuffer.readUInt32BE(offset)
      offset += 4
      const headerJson = fileBuffer.slice(offset, offset + headerLength).toString('utf-8')
      offset += headerLength
      const header = JSON.parse(headerJson) as {
        version: number
        song: ChartTypeV2.song
        diffCount: number
      }

      // Read diff count
      // 读取diff数量
      const diffCount = fileBuffer.readUInt32BE(offset)
      offset += 4

      // Decompress each diff
      // 解压缩每个diff
      const diffs: ChartTypeV2.diff[] = []
      for (let i = 0; i < diffCount; i++) {
        const diffLength = fileBuffer.readUInt32BE(offset)
        offset += 4
        const diffBuffer = fileBuffer.slice(offset, offset + diffLength)
        offset += diffLength
        diffs.push(serialize.decompressDiff(diffBuffer))
      }

      return {
        version: header.version,
        song: header.song,
        diffs
      }
    } catch (error) {
      console.error('Failed to load backup:', error)
      return undefined
    }
  }

  delete_backup(id: string, backup_name: string) {
    const chart = this.data.find((v) => v.id === id)
    if (!chart) return

    const backupPath = path.join(this.charts_folder, id, 'backup', backup_name)

    // Check if backup file exists
    // 检查备份文件是否存在
    if (!fs.existsSync(backupPath)) {
      return
    }

    // Delete backup file
    // 删除备份文件
    fs.unlinkSync(backupPath)
  }
  export_svc(id: string) {
    this._export_chart(id, '.svc')
  }
  export_zip(id: string) {
    this._export_chart(id, '.zip')
  }

  show_file(id: string, fp: string) {
    shell.showItemInFolder(path.join(this.charts_folder, id, fp))
  }
  show_folder(id: string, fp: string) {
    shell.openPath(path.join(this.charts_folder, id, fp))
  }

  /**
   * 判断一个压缩包应该按哪种格式导入：带 vs-chart.json / chart.json 的算 svc，
   * 否则看有没有 info.json 当 vsp，都没有就是不认识的压缩包。
   */
  detect_chart_pack(fp: string): 'svc' | 'vsp' | 'invalid' {
    if (!fp || !fs.existsSync(fp)) return 'invalid'
    let names: string[]
    try {
      names = new AdmZip(fp)
        .getEntries()
        .filter((v) => !v.isDirectory)
        .map((v) => path.basename(v.entryName).toLowerCase())
    } catch {
      return 'invalid'
    }
    if (names.includes('vs-chart.json') || names.includes('chart.json')) return 'svc'
    if (names.includes('info.json')) return 'vsp'
    return 'invalid'
  }

  async import_chart(fp: string, id: string): Promise<boolean> {
    if (!fs.existsSync(fp)) return false
    const zip = new AdmZip(fp)
    const zip_entry = zip.getEntries()
    const json = zip_entry.find(
      (v) => v.entryName === 'chart.json' || v.entryName == 'vs-chart.json'
    )
    const song = zip_entry.find((v) => {
      return ['.mp3', '.wav', '.ogg', '.m4a'].includes(path.extname(v.entryName))
    })
    if (!json || !song) {
      return false
    }
    const chart_data = JSON.parse(json.getData().toString('utf-8')) as ChartTypeV2.final
    try {
      fs.mkdirSync(path.join(this.charts_folder, id))
      zip.extractAllTo(path.join(this.charts_folder, id))
      this.rename()
      if (chart_data.version)
        this.add_chart(
          id,
          chart_data.song.name,
          chart_data.song.composer,
          chart_data.song.bpm,
          path.extname(song.entryName),
          chart_data.diffs.map((v) => v.meta.diff1 + ' ' + v.meta.diff2)
        )
      else
        this.add_chart(
          id,
          path.basename(song.entryName, path.extname(song.entryName)),
          'unknown',
          'unknown',
          path.extname(song.entryName),
          []
        )
    } catch (e) {
      return false
    }
    return true
  }

  import_sprite(id: string, fp: string) {
    try {
      fs.copyFileSync(fp, path.join(this.charts_folder, id, 'song' + path.extname(fp)))
    } catch (e) {
      return
    }
  }

  import_bg(id: string) {
    const png = dialog.showOpenDialogSync({
      properties: ['openFile'],
      filters: [{ name: 'pictures', extensions: ['png', 'jpg', 'gif', '.jpeg'] }]
    })
    if (!png) return
    try {
      fs.copyFileSync(png[0], path.join(this.charts_folder, id, 'bg' + path.extname(png[0])))
    } catch (e) {
      return
    }
  }

  create_from_vsp(id: string, fp: string): ImportVspResult {
    if (!fs.existsSync(fp)) return { state: 'failed', reason: '文件不存在' }
    if (fs.existsSync(path.join(this.charts_folder, id))) return { state: 'existed' }

    let zip: AdmZip
    try {
      zip = new AdmZip(fp)
    } catch {
      return { state: 'failed', reason: '不是有效的 ZIP 文件' }
    }

    let entries: AdmZip.IZipEntry[]
    try {
      entries = zip.getEntries().filter((v) => !v.isDirectory)
    } catch {
      return { state: 'failed', reason: '无法读取 ZIP 内容' }
    }
    const find_entry = (name: string) =>
      entries.find((v) => path.basename(v.entryName).toLowerCase() == name)

    const info_entry = find_entry('info.json')
    if (!info_entry) return { state: 'failed', reason: '缺少 info.json' }
    const music_entry = find_entry('music.ogg')
    if (!music_entry) return { state: 'failed', reason: '缺少 music.ogg' }

    let info: CustomSongInfo
    try {
      info = JSON.parse(info_entry.getData().toString('utf-8')) as CustomSongInfo
    } catch {
      return { state: 'failed', reason: 'info.json 解析失败' }
    }
    if (!info || typeof info != 'object') {
      return { state: 'failed', reason: 'info.json 格式不正确' }
    }

    const constants = [
      info.difficulty_constant_1,
      info.difficulty_constant_2,
      info.difficulty_constant_3,
      info.difficulty_constant_4
    ]
    const displays = [
      info.difficulty_display_1,
      info.difficulty_display_2,
      info.difficulty_display_3,
      info.difficulty_display_4
    ]
    const designers = [
      info.note_designer_1,
      info.note_designer_2,
      info.note_designer_3,
      info.note_designer_4
    ]

    const diffs: ChartTypeV2.diff[] = []
    for (let i = 0; i < VSP_DIFF_NAMES.length; i++) {
      const vsc_entry = find_entry(VSP_DIFF_NAMES[i].toLowerCase() + '.vsc')
      if (!vsc_entry) continue

      let parsed: Pick<ChartTypeV2.diff, 'notes' | 'timing'>
      try {
        parsed = parse_vsc(vsc_entry.getData().toString('utf-8'))
      } catch {
        continue
      }
      const diff1 = i == 3 && !!info.enc_data ? 'Backstage' : VSP_DIFF_NAMES[i]
      const rating = Number(constants[i])
      diffs.push({
        notes: parsed.notes,
        timing: parsed.timing,
        meta: {
          charter: designers[i] ?? '',
          diff1,
          diff2: displays[i] ?? '',
          rating: Number.isFinite(rating) ? rating : 0,
          diff_name: diff1
        }
      })
    }
    if (diffs.length == 0) return { state: 'failed', reason: '没有可导入的 vsc 难度' }

    const chart: ChartTypeV2.final = {
      diffs,
      song: {
        name: info.name || 'song',
        name_roman: info.formatted_name || info.name || '',
        composer: info.artist || 'unknown',
        composer_roman: info.artist || '',
        bpm: info.bpm_display || 'unknown',
        source: '',
        sprite: '',
        ref: ''
      },
      version: -1
    }

    const folder = path.join(this.charts_folder, id)
    try {
      fs.mkdirSync(folder)
      fs.writeFileSync(path.join(folder, 'song.ogg'), music_entry.getData())
      const image_entry = entries.find((v) => {
        return /^jacket\.(png|jpe?g|gif|webp)$/i.test(path.basename(v.entryName))
      })
      if (image_entry) {
        const image_ext = extname(image_entry.entryName).toLowerCase()
        const app_image_ext = image_ext == '.jpeg' ? '.jpg' : image_ext
        fs.writeFileSync(path.join(folder, 'song' + app_image_ext), image_entry.getData())
      }
      const preview_entry = find_entry('preview.ogg')
      if (preview_entry) fs.writeFileSync(path.join(folder, 'preview.ogg'), preview_entry.getData())
    } catch {
      fs.rmSync(folder, { recursive: true, force: true })
      return { state: 'failed', reason: '写入谱面文件失败' }
    }

    this.add_chart(
      id,
      chart.song.name,
      chart.song.composer,
      chart.song.bpm,
      '.ogg',
      chart.diffs.map((d) => d.meta.diff1 + ' ' + d.meta.diff2)
    )
    this.write_chart(id, chart)
    return { state: 'success' }
  }

  create_with_buffer(id: string, buf: Buffer, ext: string) {
    const folder = path.join(this.charts_folder, id)
    if (fs.existsSync(folder)) return 0
    fs.mkdirSync(folder)
    fs.writeFileSync(path.join(folder, 'song' + ext), buf)
    this.add_chart(id, 'song', 'unknown', 'unknown', ext, [])
    return 1
  }

  create_from_osz(id: string, osz: OszReader) {
    return this.create_from_pack(id, osz)
  }

  create_from_mcz(id: string, mcz: MczReader) {
    return this.create_from_pack(id, mcz)
  }

  private create_from_pack(id: string, pack: ChartPackReader) {
    const folder = path.join(this.charts_folder, id)
    if (fs.existsSync(folder)) return 0
    fs.mkdirSync(folder)
    const s = pack.getAudioFile()
    if (!s) return
    fs.writeFileSync(path.join(folder, 'song' + s[0]), s[1])
    const imgs = pack.getImages()
    if (imgs.length != 0) {
      fs.writeFileSync(path.join(folder, 'song' + imgs[0][1]), imgs[0][0])
    }
    const chart: ChartTypeV2.final = {
      diffs: pack.get_diffs(),
      song: pack.get_song() || {
        name: 'song',
        composer: 'unknown',
        bpm: 'unknown',
        name_roman: '',
        composer_roman: '',
        source: '',
        sprite: '',
        ref: ''
      },
      version: -1
    }
    this.add_chart(
      id,
      chart.song.name,
      chart.song.composer,
      chart.song.bpm,
      s[0],
      chart.diffs.map((d) => d.meta.diff1 + ' ' + d.meta.diff2)
    )
    this.write_chart(id, chart)
    return chart
  }

  import_osz_sprite(id: string, buf: Buffer, ext: string) {
    this.import_pack_sprite(id, buf, ext)
  }

  import_mcz_sprite(id: string, buf: Buffer, ext: string) {
    this.import_pack_sprite(id, buf, ext)
  }

  private import_pack_sprite(id: string, buf: Buffer, ext: string) {
    const folder = path.join(this.charts_folder, id)
    if (fs.existsSync(path.join(folder, 'song' + ext))) fs.rmSync(path.join(folder, 'song' + ext))
    fs.writeFileSync(path.join(folder, 'song' + ext), buf)
  }

  write_svg_text(id: string, text: string) {
    const chart = this.data.find((v) => v.id === id)
    if (!chart) return

    const img = electron.nativeImage.createFromDataURL(text)
    const png_buffer = img.toPNG()

    const fname = `preview-${id}-${timestr()}`

    fs.writeFileSync(path.join(this.charts_folder, id, fname + '.png'), png_buffer)
    shell.showItemInFolder(path.join(this.charts_folder, id, fname + '.png'))
  }

  export_for_custom(data: {
    id: string
    diffs: (string | 0)[]
    crop?: boolean
    gml: string
    as_id?: string
    sv?: boolean
  }) {
    const { id, diffs, crop = false, gml, as_id = -1, sv = false } = data
    // if all is 0
    if (!diffs.some((v) => v != 0)) return
    const chart = this.data.find((v) => v.id === id)
    if (!chart) return

    const exported_path =
      as_id == -1
        ? path.join(this.charts_folder, id, `exported-${timestr()}`)
        : path.join(this.charts_folder, id, as_id)
    if (as_id != -1) {
      try {
        fs.rmSync(exported_path, { force: true, recursive: true })
        console.log('removed old')
      } catch (e) {
        console.log(e)
      }
    }
    fs.mkdirSync(exported_path)

    const vsc_names = ['OPENING', 'MIDDLE', 'FINALE', 'ENCORE']
    for (let i = 0; i < diffs.length; i++) {
      const diff = diffs[i]
      if (diff == 0) continue
      try {
        fs.writeFileSync(path.join(exported_path, vsc_names[i] + '.vsc'), diff)
      } catch (e) {
        // pass
      }
    }

    fs.writeFileSync(path.join(exported_path, 'info.json'), gml)
    const png = find_png(path.join(this.charts_folder, id), 'song')
    if (png && crop !== undefined) {
      try {
        const imagePath = path.join(this.charts_folder, id, png)
        const image = electron.nativeImage.createFromPath(imagePath)
        const { width, height } = image.getSize()
        let processedImage: Electron.NativeImage
        if (crop) {
          // Crop to square (centered)
          const size = Math.min(width, height)
          const x = (width - size) / 2
          const y = (height - size) / 2
          processedImage = image.crop({ x, y, width: size, height: size })
        } else {
          // Stretch to square
          const size = Math.max(width, height)
          processedImage = image.resize({ width: size, height: size })
        }
        fs.writeFileSync(path.join(exported_path, `jacket.png`), processedImage.toPNG())
      } catch (e) {
        // pass
      }
    }
    const _song = find_song(path.join(this.charts_folder, id), 'song')
    if (sv) {
      fs.copyFileSync(
        path.join(this.charts_folder, id, 'vs-chart.json'),
        path.join(exported_path, 'vs-chart.json')
      )
      const _png = find_png(path.join(this.charts_folder, id), 'song')
      if (_png) {
        fs.copyFileSync(
          path.join(this.charts_folder, id, _png),
          path.join(exported_path, 'song.png')
        )
      }
      if (_song) {
        fs.copyFileSync(
          path.join(this.charts_folder, id, _song),
          path.join(exported_path, `song${extname(_song)}`)
        )
      }
    }
    if (_song)
      child_process.exec(
        `ffmpeg -i "${path.join(this.charts_folder, id, _song)}" "${path.join(exported_path, `music.ogg`)}"`,
        (...a) => console.log(...a)
      )
    shell.showItemInFolder(path.join(exported_path, 'info.json'))
  }

  show_chart(id: string) {
    const chart = this.data.find((v) => v.id === id)
    if (!chart) return
    shell.showItemInFolder(path.join(this.charts_folder, id, 'vs-chart.json'))
  }

  private _export_chart(id: string, ext: string) {
    const chart = this.data.find((v) => v.id === id)
    if (!chart) return
    const zip = new AdmZip()
    const chart_folder = path.join(this.charts_folder, id)
    zip.addLocalFile(path.join(chart_folder, 'song' + chart.ext))
    zip.addLocalFile(path.join(chart_folder, 'vs-chart.json'))
    const sprite = find_png(chart_folder, 'song')
    if (sprite) zip.addLocalFile(path.join(chart_folder, sprite))

    zip.writeZip(path.join(this.charts_folder, id + ext))
    shell.showItemInFolder(path.join(this.charts_folder, id + ext))
  }

  private init_json() {
    fs.writeFileSync(this.json_path, JSON.stringify([], null, 2))
  }

  private write_json() {
    if (fs.existsSync(this.json_path)) {
      fs.writeFileSync(this.json_path, JSON.stringify(this.data, null, 2))
    }
  }

  private guard_data() {
    for (const chart of this.data) {
      chart.diffs = chart.diffs ?? []
    }
  }

  private read_json() {
    if (fs.existsSync(this.json_path)) {
      const content = fs.readFileSync(this.json_path, 'utf-8')
      this.data.push(...JSON.parse(content))
      this.guard_data()
    } else {
      this.init_json()
    }
  }

  private possible_charts() {
    const json_charts = this.data.map((v) => v.id)
    const folders = fs
      .readdirSync(this.charts_folder)
      .filter((v) => {
        return fs.lstatSync(path.join(this.charts_folder, v)).isDirectory()
      })
      .filter((v) => !json_charts.includes(v))

    // so we got those folders excluded in json!
    for (const folder of folders) {
      if (fs.existsSync(path.join(this.charts_folder, folder, 'vs-chart.json'))) {
        const song = find_song(path.join(this.charts_folder, folder), 'song')
        if (!song) continue
        const chart = JSON.parse(
          fs.readFileSync(path.join(this.charts_folder, folder, 'vs-chart.json'), 'utf-8')
        ) as ChartTypeV2.final
        // old version fuck
        if (!chart.version) continue
        this.add_chart(
          folder,
          chart.song.name,
          chart.song.composer,
          chart.song.bpm,
          path.extname(song),
          chart.diffs.map((v) => v.meta.diff1 + ' ' + v.meta.diff2),
          0
        )
      }
    }
  }

  private rename() {
    const folders = fs
      .readdirSync(this.charts_folder)
      .filter((v) => fs.lstatSync(path.join(this.charts_folder, v)).isDirectory())
    for (const folder of folders) {
      if (fs.existsSync(path.join(this.charts_folder, folder, 'chart.json'))) {
        fs.renameSync(
          path.join(this.charts_folder, folder, 'chart.json'),
          path.join(this.charts_folder, folder, 'vs-chart.json')
        )
      }
    }
  }

  private unexists() {
    const to_delete: string[] = []
    for (const datum of this.data) {
      if (!fs.existsSync(path.join(this.charts_folder, datum.id))) {
        to_delete.push(datum.id)
      }
    }
    for (const datum of to_delete) {
      const ix = this.data.findIndex((v) => v.id == datum)
      if (ix >= 0) {
        this.data.splice(ix, 1)
      }
    }
  }
}
