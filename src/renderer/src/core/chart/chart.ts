import { ChartType, ChartTypeV2 } from '@preload/chart-types'
import { notify } from '@renderer/core/misc/notify'
import { computed, ComputedRef, ref, Ref, watch, WritableComputedRef } from 'vue'
import { Chart_audio } from '@renderer/core/chart/audio'
import { Chart_song } from '@renderer/core/chart/song'
import { Chart_diff } from '@renderer/core/chart/diff'
import { Chart_playfield } from './playfield'
import { GlobalStat } from '@renderer/core/globalStat'
import { Storage } from '@renderer/core/storage'
import { modal } from '@renderer/core/misc/modal'
import { Invoke } from '@renderer/core/ipc'
import { utils } from '@renderer/core/utils'
import { FrameRate } from '@renderer/core/misc/frame-rates'
import { EventHub, StopClass } from '@renderer/core/misc/eventhub'
import { RefreshAll } from '@renderer/core/misc/refresh-all'
import { HitSoundSystem } from '@renderer/core/chart/hit-sound'
import { LoadSong } from '@renderer/core/misc/load-song'
import nextFrame = utils.nextFrame
import { route } from '@renderer/core/misc/route'

/** 取文件路径的扩展名，小写、不带点 */
function file_ext(fp: string): string {
  const name = fp.split(/[\\/]/).pop() ?? fp
  const dot = name.lastIndexOf('.')
  return dot < 0 ? '' : name.slice(dot + 1).toLowerCase()
}

function parse_old_diff(dif: ChartType.Diff): ChartTypeV2.diff {
  const new_diff = Chart_diff.createDiff()
  new_diff.timing = []
  dif.notes.forEach((note) => {
    switch (note.n) {
      case 'p':
        new_diff.timing.push({
          time: note.t,
          bpm: note.v,
          num: 4,
          den: 4
        })
        break
      case 'h':
        new_diff.notes.push({
          time: note.t,
          lane: note.l,
          len: note.h,
          width: 1
        })
        break
      case 'n':
        new_diff.notes.push({
          time: note.t,
          lane: note.l,
          width: 1,
          snm: 0
        })
        break
      case 'b':
        new_diff.notes.push({
          time: note.t,
          lane: note.l,
          width: 2,
          snm: 0
        })
        break
      case 's':
        new_diff.notes.push({
          time: note.t,
          lane: note.l,
          width: 2,
          snm: 2
        })
        break
      case 'm':
        new_diff.notes.push({
          time: note.t,
          lane: note.l,
          width: 1,
          snm: 1
        })
        break
      case 'mb':
        new_diff.notes.push({
          time: note.t,
          lane: note.l,
          width: 2,
          snm: 1
        })
        break
      default:
        console.log('waht')
    }
  })
  new_diff.meta.diff1 = dif.name
  new_diff.meta.diff2 = dif.hard
  new_diff.meta.charter = dif.charter
  return new_diff
}
export type ms = number

export class Chart extends StopClass {
  static current: Chart | undefined = undefined
  song: Chart_song
  diffs: ChartTypeV2.diff[]
  audio: Chart_audio
  diff: Chart_diff
  playfield: Chart_playfield | null
  // for audio counting only
  length_end: ms
  shown_timing: ComputedRef<[ms, ms]>
  current_bpm: WritableComputedRef<number>
  id: string
  sprite_err: Ref<boolean>
  bg_err: Ref<boolean>
  hit_sounder: HitSoundSystem

  refs: {
    diff_ref: Ref<number>
  }
  backup_last = ref({ time: Date.now(), init: true })

  constructor(id: string, buffer: AudioBuffer, length: ms) {
    super()
    this.id = id
    this.song = new Chart_song(this)
    this.diffs = [Chart_diff.createDiff()]
    this.audio = new Chart_audio(this, buffer, length)
    this.length_end = -1
    this.shown_timing = computed(() => [
      this.audio.refs.current_ms.value,
      this.audio.refs.current_ms.value + Storage.computes.visible.value
    ])
    const me = this
    this.current_bpm = computed({
      get() {
        return me.bpm_of_time(me.audio.refs.current_ms.value)?.bpm ?? 120
      },
      set(v) {
        const n = me.diff.timing.findLast((tp) => tp.time <= me.audio.current_time)
        if (n) n.bpm = v
      }
    })
    this.diff = new Chart_diff(this)
    this.playfield = null
    this.sprite_err = ref(false)
    this.bg_err = ref(false)
    this.refs = {
      diff_ref: ref(-1)
    }
    this.hit_sounder = new HitSoundSystem(this)

    this.length_end = this.audio.length + 3000
    this.set_header_name()
    this.audio.init_on_end()
  }

  /*static create_vsb(vsb_path: string): Promise<Chart> {
    const chart = new Chart()
    chart.set_path(vsb_path)
    return new Promise((resolve, reject) => {
      Charter.invoke('read-vsb', vsb_path).then((r) => {
        if (!r) {
          reject('')
          return
        }
        chart.diff.set_notes(r)
        resolve(chart)
      })
    })
  }*/

  static get $current() {
    if (!this.current) throw new Error("where's my chart!")
    return this.current
  }

  get chart(): ChartTypeV2.final {
    return {
      song: this.song.save(),
      diffs: this.diffs,
      version: Storage.version
    }
  }

  get $playfield() {
    if (!this.playfield) this.init_playfield()
    return this.playfield as Chart_playfield
  }

  static createChart(n = ''): ChartTypeV2.final {
    return {
      song: {
        name: n,
        name_roman: n,
        composer: '',
        composer_roman: '',
        bpm: '120',
        source: 'stray-vivify',
        ref: '',
        sprite: '???'
      },
      diffs: [Chart_diff.createDiff()],
      version: Storage.version
    }
  }

  static async open_chart(id: string) {
    route.change('load-song')
    LoadSong.init()
    const file = await Invoke('open-song', { id })
    LoadSong.status.open_song = true
    const blob = await this.fetch_blob(id)
    LoadSong.status.fetch_blob = true
    let buffer: AudioBuffer
    try {
      buffer = await utils.decode_audio(blob, GlobalStat.audioContext)
    } catch (e) {
      notify.error('音频解码失败，无法打开该谱面。')
      route.change('start')
      throw e
    }
    const length = buffer.duration * 1000
    LoadSong.status.audio_length = true
    LoadSong.status.blob_path = true
    const chart = new Chart(id, buffer, length)
    if (file.data) {
      const data = this.parse_data(file.data)
      if (data.status == 'converted') {
        await Invoke('backup-chart', { id, data: file.data })
      }
      chart.set_chart(data.data)
      chart.set_name(data.data.song.name)
      chart.diff.update_on_diff_index()
    }
    LoadSong.status.set_data = true
    this.current = chart
    route.change('editor')
    Invoke('set-process-name', { name: `${chart.song.name} - stray/vivify` })
    watch(
      route.route,
      () => {
        chart.audio.pause()
      },
      { once: true }
    )
  }

  static async fetch_blob(id: string) {
    const r = await fetch('stray:/__song__/' + id)
    if (r.ok) return await r.blob()
    throw new Error('what fetch failed')
  }

  static parse_data(data: string): { data: ChartTypeV2.final; status: 'converted' | 'loaded' } {
    const parsed = JSON.parse(data) as ChartType.Chart | ChartTypeV2.final
    if (Object.keys(parsed).includes('version')) {
      return {
        data: parsed as ChartTypeV2.final,
        status: 'loaded'
      }
    } else {
      // for the old versions
      const new_data = this.createChart()
      new_data.diffs.pop()

      parsed.diffs.forEach((d) => new_data.diffs.push(parse_old_diff(d)))
      new_data.song.name = parsed.song.name
      new_data.song.name_roman = parsed.song.name
      new_data.song.composer = parsed.song.composer
      new_data.song.composer_roman = parsed.song.composer
      new_data.song.bpm = parsed.song.bpm
      return {
        data: new_data,
        status: 'converted'
      }
    }
  }

  load_vsb(r: [ChartTypeV2.note[], ChartTypeV2.timing[]] | undefined) {
    if (!r) return
    const new_diff = Chart_diff.createDiff()
    new_diff.notes = r[0]
    new_diff.timing = r[1]
    this.add_diff(new_diff)
    setTimeout(() => {
      this.diff.fuck_shown(this.audio.current_time, true)
      this.diff.update_diff_counts()
    }, 200)
  }

  load_vsc(r: string) {
    const lines = r.split('\n')
    const notes: ChartTypeV2.note[] = []
    const timing: ChartTypeV2.timing[] = []
    lines.forEach((line) => {
      const [stime, stype, slane, sextra = undefined] = line.split(',')
      const time = parseFloat(stime)
      const type = parseInt(stype)
      const lane = parseInt(slane)
      if (type == 2 && sextra) {
        return notes.push({
          time,
          lane,
          width: 1,
          len: (parseFloat(sextra) ?? 0) - time
        })
      } else if (type == 3 && sextra) {
        const matched = sextra.split('|')[0].slice(2)
        return timing.push({
          time: time,
          bpm: parseFloat(matched ?? '120'),
          num: 4,
          den: 4
        })
      }
      let width = 1
      let snm = 0
      if (type == 1 || type == 8 || type == 7) width = 2
      if (type == 6 || type == 7) snm = 1
      if (type == 8) snm = 2
      return notes.push({
        time,
        lane,
        width,
        snm
      })
    })

    const diff = Chart_diff.createDiff()
    diff.notes = Chart_diff.validate_notes(notes)
    diff.timing = Chart_diff.validate_timing(timing)
    this.add_diff(diff)
    setTimeout(() => {
      this.diff.fuck_shown(this.audio.current_time, true)
      this.diff.update_diff_counts()
    }, 200)
  }

  set_name(n: string) {
    this.song.name = n
  }

  set_header_name() {
    GlobalStat.refs.header_display.value =
      this.song.name + ' - ' + this.diff.diff1 + ' ' + this.diff.diff2
  }

  create_diff() {
    let new_diff = Chart_diff.createDiff()
    new_diff.timing = this.diff.timing
    this.diffs.push(new_diff)
    this.diff.diff_index.value = this.diffs.length - 1
  }

  add_diff(d: ChartTypeV2.diff) {
    d.notes = Chart_diff.validate_notes(d.notes)
    d.timing = Chart_diff.validate_timing(d.timing)
    this.diffs.push(d)
    this.diff.diff_index.value = this.diffs.length - 1
    RefreshAll.refresh('diff-choice')
  }

  delete_diff() {
    if (this.diffs.length == 1)
      modal.ConfirmModal.show({
        msg: '这是最后一张谱面了。这样做会清空已有的note哦。要继续吗？<br>timing将会保留。'
      }).then(() => {
        this.diff.notes = []
        this.diff.force_fuck()
      })
    else
      modal.ConfirmModal.show({ msg: '确定要删除这个diff吗……不能撤回哦。' }).then(() => {
        this.diffs.splice(this.diff.diff_index.value, 1)
        this.diff.diff_index.value = 0
        this.diff.update_on_diff_index()
        this.diff.force_fuck()
        RefreshAll.refresh('diff-choice')
      })
  }

  bpm_of_time(time: ms) {
    return this.diff.bpm_of_time(time)
  }

  set_chart(v: ChartTypeV2.final) {
    this.song.set_song(v.song)
    this.diffs = v.diffs.map((x) => {
      let r = Chart_diff.createDiff()
      utils.assign(r as Required<ChartTypeV2.diff>, x)
      r.notes = Chart_diff.validate_notes(r.notes)
      return r
    })
    // this.diff.set_diff(this.diffs[this.diff_index])
    this.diff.diff_index.value = 0
    this.diff.set_diff(this.diffs[this.diff.diff_index.value])
  }

  on_update() {
    this.audio.update()
    if (!this.audio.paused) this.hit_sounder.play_hit()
  }

  async save(do_notify = false) {
    if (this.audio.buffer) {
      FrameRate.save.start()
      this.diff.validate_chart()
      await nextFrame()
      Invoke('save-chart', { id: this.id, data: JSON.stringify(this.chart) })
      FrameRate.save.end()
      if (do_notify) notify.success('保存成功！')
      await nextFrame()
      await Invoke('update-chart-data', {
        id: this.id,
        data: JSON.stringify({
          song: this.song.save(),
          diffs: this.diffs.map((x) => x.meta.diff1 + ' ' + x.meta.diff2)
        })
      })
      if (performance.now() - this.backup_last.value.time > 900e3) {
        this.backup()
      }
    }
    return
  }

  /**
   * Backup chart with efficient binary compression (binary .svb format)
   * 备份谱面，使用高效的二进制压缩（二进制 .svb 格式）
   */
  async backup() {
    // Create final structure - chart-manager will handle compression
    // 创建final结构 - chart-manager将处理压缩
    const final: ChartTypeV2.final = {
      song: this.song.save(),
      version: Storage.version,
      diffs: this.diffs
    }

    // Send to main process for compression and backup
    // 发送到主进程进行压缩和备份
    await Invoke('store-backup', {
      id: this.id,
      data: final
    })
    notify.success('已备份！')
    this.backup_last.value.time = Date.now()
    this.backup_last.value.init = false
  }

  /**
   * Get list of backup files
   * 获取备份文件列表
   * @returns Array of backup filenames sorted by time (newest first)
   */
  async get_backup_list(): Promise<string[]> {
    return await Invoke('get-backup-list', { id: this.id })
  }

  /**
   * Load a backup file and restore chart data
   * 加载备份文件并恢复谱面数据
   * @param backup_name - Backup filename
   */
  async load_backup(backup_name: string) {
    const restoredData = await Invoke('load-backup', {
      id: this.id,
      backup_name
    })

    if (!restoredData) {
      notify.error('备份文件不存在或读取失败')
      return
    }

    try {
      this.song.refs.value = { ...restoredData.song }
      this.diffs = restoredData.diffs

      // Update current diff
      // 更新当前 diff
      this.diff.set_diff(this.diffs[this.diff.diff_index.value])

      // Refresh display
      // 刷新显示
      this.diff.force_fuck()
      GlobalStat.update_all_chart()

      notify.success(`已从备份 ${backup_name} 恢复`)
    } catch (error) {
      notify.error('备份数据解析失败')
    }
  }

  write_current_vsc() {
    const fname = this.diff.diff1 + '.vsc'
    Invoke('write-file', {
      id: this.id,
      data: Chart_diff.to_vsc(this.diff.diff).join('\n'),
      fname: fname
    })
      .then(() => notify.success('已导出为vsc!!!!!!!'))
      .then(() => {
        Invoke('show-file', { id: this.id, fname: fname })
      })
  }
  async export_chart(ext: 'svc' | 'zip') {
    const r = this.save()
    if (!r) return
    await r
    if (ext == 'svc') await Invoke('export-svc', { id: this.id })
    else if (ext == 'zip') await Invoke('export-zip', { id: this.id })
  }

  init_playfield(start_from_now = false) {
    this.playfield = new Chart_playfield(this, start_from_now)
  }

  handle_key(key: number) {
    this.playfield?.handle_keydown(key)
  }

  handle_keyup(key: number) {
    this.playfield?.handle_keyup(key)
  }

  async import_osz(fp: string) {
    const r = await Invoke('read-osz', { fp })
    if (!r) return notify.error('读取osz失败……')
    modal.LoadOszModal.show({ diff: r.diff, song: r.song, pix: r.pix })
  }

  import_osz_pics(ix: number) {
    Invoke('import-osz-pics', { id: this.id, ix: ix }).then(() => {
      RefreshAll.refresh('song-cover')
      notify.success('曲绘一份！')
    })
  }

  async import_mcz(fp: string) {
    const r = await Invoke('read-mcz', { fp })
    if (!r) return notify.error('读取mcz失败……')
    modal.LoadMczModal.show({
      diff: r.diff,
      song: r.song,
      pix: r.pix,
      warnings: r.warnings
    })
  }

  import_mcz_pics(ix: number) {
    Invoke('import-mcz-pics', { id: this.id, ix: ix }).then(() => {
      RefreshAll.refresh('song-cover')
      notify.success('曲绘一份！')
    })
  }

  async load_vsb_file(fp: string) {
    const r = await Invoke('read-vsb', { fp })
    if (!r) return notify.error('读取vsb失败……')
    this.load_vsb(r)
  }

  async load_vsc_file(fp: string) {
    const r = await Invoke('open-file-utf', { path: fp })
    if (!r) return notify.error('读取vsc失败……')
    this.load_vsc(r)
  }

  /** 拖进来的文件：按扩展名分派到对应的读取流程 */
  async import_file(fp: string) {
    const ext = file_ext(fp)
    if (ext == 'vsb') return this.load_vsb_file(fp)
    if (ext == 'vsc') return this.load_vsc_file(fp)
    if (ext == 'osz') return this.import_osz(fp)
    if (ext == 'mcz') return this.import_mcz(fp)
    notify.error(`不认识的格式：${ext || '没有扩展名'}……`)
  }
  async write_png() {
    const svg = document.getElementById('chart-preview-svg')
    if (!svg) return

    // 获取 SVG 尺寸
    const { width, height } = svg.getBoundingClientRect()

    // 创建 Canvas
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height

    const ctx = canvas.getContext('2d')
    if (!ctx) {
      throw new Error('无法获取 Canvas 上下文')
    }

    // 设置白色背景
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, width, height)

    // 克隆 SVG 元素以避免修改原元素
    const clonedSvg = svg.cloneNode(true) as SVGElement

    // 处理 SVG 中的 image 元素，将其转换为 data URL
    const imageElements = clonedSvg.querySelectorAll('image')
    const imagePromises: Promise<void>[] = []

    // 处理每个 image 元素
    imageElements.forEach((imgElement) => {
      const promise = new Promise<void>((resolve) => {
        const href = imgElement.getAttribute('href') || imgElement.getAttribute('xlink:href')
        if (!href) {
          resolve()
          return
        }

        // 如果是 data URL，直接使用
        if (href.startsWith('data:')) {
          resolve()
          return
        }

        const img = new Image()
        img.crossOrigin = 'anonymous'

        img.onload = () => {
          try {
            // 创建临时 canvas 来转换图片
            const tempCanvas = document.createElement('canvas')
            tempCanvas.width = img.width
            tempCanvas.height = img.height

            const tempCtx = tempCanvas.getContext('2d')
            if (!tempCtx) {
              console.warn('无法创建临时 Canvas 上下文')
              resolve()
              return
            }

            tempCtx.drawImage(img, 0, 0)

            // 转换为 data URL
            const dataUrl = tempCanvas.toDataURL('image/png')

            // 更新 image 元素的 href
            if (imgElement.hasAttribute('xlink:href')) {
              imgElement.setAttribute('xlink:href', dataUrl)
            } else {
              imgElement.setAttribute('href', dataUrl)
            }

            resolve()
          } catch (error) {
            console.warn('图片转换失败:', error)
            resolve() // 即使失败也继续处理
          }
        }

        img.onerror = () => {
          console.warn('图片加载失败:', href)
          resolve()
        }

        img.src = href
      })

      imagePromises.push(promise)
    })

    // 等待所有图片处理完成
    await Promise.all(imagePromises)

    // 将 SVG 转换为数据 URL
    const svgString = new XMLSerializer().serializeToString(clonedSvg)
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' })
    const svgUrl = URL.createObjectURL(svgBlob)

    // 创建图片元素来加载 SVG
    const pngDataUrl = await new Promise<string>((resolve, reject) => {
      const img = new Image()

      img.onload = () => {
        try {
          // 绘制到 Canvas
          ctx.drawImage(img, 0, 0, width, height)

          // 转换为 PNG data URL
          const pngData = canvas.toDataURL('image/png')

          // 清理 URL
          URL.revokeObjectURL(svgUrl)

          resolve(pngData)
        } catch (error) {
          URL.revokeObjectURL(svgUrl)
          reject(error)
        }
      }

      img.onerror = () => {
        URL.revokeObjectURL(svgUrl)
        reject(new Error('SVG 图片加载失败'))
      }

      img.src = svgUrl
    })

    // 调用主进程保存
    Invoke('export-preview-svg', { id: this.id, svg_text: pngDataUrl })
  }

  copy_diff() {
    const new_d = Chart_diff.createDiff()
    new_d.notes = this.diff.notes
    new_d.timing = this.diff.timing
    new_d.meta.charter = this.diff.charter
    // new_d.sv = this.diff.sv

    this.add_diff(new_d)
    notify.success('new diffed')
  }

  scr_time(deltaY: number) {
    const current_time = this.audio.current_time
    const meter = Storage.settings.meter
    const current_bpm = this.diff.bpm_of_time(current_time)?.bpm ?? 120

    EventHub.pause()
    this.audio.set_current_time(this.diff.nearest(current_time))
    const scr = Math.round((4 / meter) * (60 / current_bpm) * Math.sign(deltaY) * 1000)
    EventHub.resume()
    if (Storage.settings.reverse_scroll) {
      this.audio.set_current_time(this.audio.current_time + scr)
    } else {
      this.audio.set_current_time(this.audio.current_time - scr)
    }
  }
}
