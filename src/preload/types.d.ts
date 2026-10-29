import { Buffer } from 'buffer'
import { ChartTypeV2 } from './chart-types'

export interface MemoryUsage {
  /**
   * Resident Set Size, is the amount of space occupied in the main memory device (that is a subset of the total allocated memory) for the
   * process, including all C++ and JavaScript objects and code.
   */
  rss: number
  /**
   * Refers to V8's memory usage.
   */
  heapTotal: number
  /**
   * Refers to V8's memory usage.
   */
  heapUsed: number
  external: number
  /**
   * Refers to memory allocated for `ArrayBuffer`s and `SharedArrayBuffer`s, including all Node.js Buffers. This is also included
   * in the external value. When Node.js is used as an embedded library, this value may be `0` because allocations for `ArrayBuffer`s
   * may not be tracked in that case.
   */
  arrayBuffers: number
}

export type Invoke = {
  'get-file-buffer': {
    arg: {
      fp: string
    }
    r:
      | {
          state: 'success'
          data: Buffer
        }
      | { state: 'failed'; msg: string }
  }
  'save-chart': {
    arg: {
      id: string
      data: string
    }
    r: void
  }
  'read-vsb': {
    arg: {
      fp: string
    }
    r: [ChartTypeV2.note[], ChartTypeV2.timing[]] | undefined
  }
  'ask-song': {
    arg: {}
    r: { path: string; name: string } | undefined
  }
  'ask-vsb': {
    arg: {}
    r: { path: string; name: string } | undefined
  }
  'open-url': {
    arg: {
      url: string
    }
    r: void
  }
  'import-song': {
    arg: {
      path: string
      id: string
    }
    r: {
          state: 'success'
          folder: string
          json: string
        }
      | {
          state: 'existed'
        }
      | {
          state: 'failed'
          reason: string
        }
      | {
          state: 'cancelled'
        }
  }
  'import-vsp': {
    arg: {
      fp: string
      id: string
    }
    r: ImportVspResult
  }
  'open-song': {
    arg: {
      id: string
    }
    r: {
      data: string | undefined
      path: string
    }
  }
  'get-charts-data': {
    arg: {}
    r: charts_data
  }
  'update-chart-data': {
    arg: {
      id: string
      // parse first
      data: string
    }
    r: void
  }
  'get-conf': {
    arg: {}
    r: string | undefined
  }
  'save-conf': {
    arg: {
      data: string
    }
    r: void
  }
  'backup-chart': {
    arg: {
      id: string
      data: string
    }
    r: void
  }
  'init-data': {
    arg: {}
    r: {
      conf: string | undefined
      cd: charts_data
      skin: string | undefined
    }
  }
  'export-svc': {
    arg: {
      id: string
    }
    r: void
  }
  'export-zip': {
    arg: {
      id: string
    }
    r: void
  }
  'import-zip': {
    arg: {
      fp: string
      id: string
    }
    r: Promise<boolean>
  }
  /* 拖入压缩包时用来判断它应该走 svc 还是 vsp 的导入流程 */
  'detect-chart-pack': {
    arg: {
      fp: string
    }
    r: 'svc' | 'vsp' | 'invalid'
  }
  'remove-chart': {
    arg: {
      id: string
    }
    r: void
  }
  'import-sprite': {
    arg: {
      id: string
      fp: string
    }
    r: void
  }
  'import-background': {
    arg: {
      id: string
    }
    r: void
  }
  'enter-fullscreen': {
    arg: {}
    r: void
  }
  'leave-fullscreen': {
    arg: {}
    r: void
  }
  'write-file': {
    arg: {
      id: string
      fname: string
      data: string
    }
    r: void
  }
  'create-folder': {
    arg: {
      id: string
      fname: string
    }
    r: number
  }
  'show-file': {
    arg: {
      id: string
      fname: string
    }
    r: void
  }
  'open-skin-folder': {
    arg: {}
    r: void
  }
  'read-osz': {
    arg: { fp: string }
    r:
      | {
          diff?: ChartTypeV2.diff[]
          song?: ChartTypeV2.song
          // here pix stands for the max-index of imageData[], would be [0, img.length - 1]
          pix: number
        }
      | undefined
  }
  'close-osz': {
    arg: {}
    r: void
  }
  'import-osz': {
    arg: {
      fp: string
      id: string
    }
    r: Promise<number> | undefined
  }
  'import-osz-pics': {
    arg: { id: string; ix: number }
    r: void
  }
  'read-mcz': {
    arg: { fp: string }
    r:
      | {
          diff?: ChartTypeV2.diff[]
          song?: ChartTypeV2.song
          // same as osz, the number of images that can be previewed
          pix: number
          // charts that were skipped or adjusted while reading
          warnings?: string[]
        }
      | undefined
  }
  'close-mcz': {
    arg: {}
    r: void
  }
  'import-mcz': {
    arg: {
      fp: string
      id: string
    }
    r: Promise<number> | undefined
  }
  'import-mcz-pics': {
    arg: { id: string; ix: number }
    r: void
  }
  'export-preview-svg': {
    arg: { id: string; svg_text: string }
    r: void
  }
  'open-dev': {
    arg: {}
    r: void
  }
  'memory-backend': {
    arg: {}
    r: MemoryUsage
  }
  'is-dev': {
    arg: {}
    r: boolean
  }
  'charts-size': {
    arg: {}
    r: Promise<{
      total: number
      detail: [number, string][]
      detail_sf: [number, string][]
      exe: number
      app: number
    }>
  }
  /* The first of arg is the displayed name */
  'ask-file': {
    arg: {
      file: string[]
    }
    r: string | undefined
  }
  'open-file-utf': {
    arg: {
      path: string
    }
    r: string | undefined
  }
  'export-for-custom': {
    arg: {
      data: {
        id: string
        diffs: (string | 0)[]
        crop?: boolean
        gml: string
        as_id?: string
        sv?: boolean
      }
    }
    r: void
  }
  'set-process-name': {
    arg: {
      name: string
    }
    r: void
  }
  'joined-time': {
    arg: {}
    r: number
  }
  'read-external': {
    arg: {
      fname: string
    }
    r: string | undefined
  }
  'store-backup': {
    arg: {
      id: string
      data: ChartTypeV2.final // Changed from string to ChartTypeV2.final for efficient compression
    }
    r: void
  }
  'get-backup-list': {
    arg: {
      id: string
    }
    r: string[]
  }
  'load-backup': {
    arg: {
      id: string
      backup_name: string
    }
    r: ChartTypeV2.final | undefined // Changed from string to ChartTypeV2.final
  }
  'flash-frame': {
    arg: {
      flag: boolean
    }
    r: void
  }
  'delete-backup': {
    arg: {
      id: string
      backup_name: string
    }
    r: void
  }
  'open-path': {
    arg: {
      id: string
      path: string
    }
    r: void
  }
  /** 检查 GitHub Release 上有没有新版本 */
  'check-update': {
    arg: {}
    r: Promise<CheckUpdateResult>
  }
  /** 下载上面找到的免安装 zip 更新包 */
  'download-update': {
    arg: {}
    r: Promise<DownloadUpdateResult>
  }
  /** 上次自动更新的结果（更新脚本写下的状态文件，读一次就删） */
  'update-status': {
    arg: {}
    r: Promise<UpdateStatusResult>
  }
}

/** check-update 的结果 */
export type CheckUpdateResult =
  | {
      state: 'new'
      /** 当前版本（app.getVersion()） */
      current: string
      /** 远端版本，如 1.1.0 */
      version: string
      /** release notes，已截断 */
      notes: string
      /** 更新包字节数，未知为 0 */
      size: number
      /** 更新包文件名 */
      asset: string
    }
  | { state: 'latest'; current: string }
  | { state: 'failed'; current: string; msg: string }

/** download-update 的结果 */
export type DownloadUpdateResult =
  | {
      state: 'success'
      /** 更新包保存路径 */
      path: string
      /** 需要被覆盖的程序目录 */
      install: string
    }
  | {
      state: 'failed'
      msg: string
      /** 下载已经完成的更新包（失败时可以让用户手动解压） */
      path?: string
      install?: string
    }

/** update-status 的结果 */
export type UpdateStatusResult =
  | { state: 'none' }
  | {
      state: 'failed'
      /** 下载下来的更新包 */
      zip: string
      /** 更新脚本写的日志 */
      log: string
      /** 原本要覆盖的程序目录 */
      install: string
    }

export type Send = {
  'notify-normal': {
    arg: {
      msg: string
      dur: number
    }
    r: void
  }
  'ask-id': {
    arg: {
      ids: string[]
      def?: string
    }
    r: Promise<string | 0>
  }
  'notify-error': {
    arg: {
      msg: string
      dur: number
    }
    r: void
  }
  'im-closing': {
    arg: {}
    r: void
  }
}
type dic2arr<T> = T extends { [K in keyof T]: T[K] } ? { [K in keyof T]: T[K] }[keyof T][] : never

export namespace IpcHandlers {
  export namespace invoke {
    export type invoke = <T extends keyof Invoke>(
      msg: T,
      ...arg: Invoke[T]['arg'] extends Record<string, never> | never ? [] : [Invoke[T]['arg']]
    ) => Promise<Invoke[T]['r']>

    export type handler = {
      [T in keyof Invoke]: (_: Electron.IpcMainInvokeEvent, arg: Invoke[T]['arg']) => Invoke[T]['r']
    }
  }
  export namespace send {
    export type send = <T extends keyof Send>(
      msg: T,
      ...arg: Send[T]['arg'] extends Record<string, never> | never ? [] : [Send[T]['arg']]
    ) => Promise<Send[T]['r']>

    export type handler = {
      [T in keyof Send]: (_: Electron.IpcRendererEvent, arg: Send[T]['arg']) => Send[T]['r']
    }
  }
}
export namespace storages {
  export interface settings {
    scale: number
    meter: number
    max_scale: number
    max_meter: number
    reverse_scroll: boolean
    lane_width: number

    show_bpm_bottom: boolean
    show_ticks: boolean
    show_bottom_timing: boolean

    // for charting
    offset1: number
    // for playing
    offset2: number
    // for hit-sound
    offset3: number
    record_field: {
      show_bar_text: boolean
      show_beat_line: boolean
      show_bpm_left: boolean
      show_bpm_bottom: boolean
      detail: number
      sprite: boolean
      show_ticks: boolean
      show_circles: boolean
      circle_speed: number
    }

    sprites: {
      bar_length: number
      bar_op: number
      bar_dy: number

      bar_color1: string
      bar_color2: string
      bar_color3: string
      bar_color4: string
      bar_color5: string
      bar_color6: string
      bar_color7: string
    }

    time_max_length: number

    judgement: {
      // perfect+
      p1: number
      // perfect, also bomb
      p2: number
      // great
      p3: number
      // good
      p4: number
      // miss-early
      p5: number
    }

    density_data_count: number

    // debug
    mouse_tracker: boolean

    hit_sound: boolean
    music_volume: number
    hit_volume: number

    frame_time: boolean

    svg_shown_parts: {
      sprite: boolean
      song: boolean
      diff: boolean
      sv: boolean
      timing: boolean
      tick: boolean
      bar: boolean
    }

    song_stats: boolean
    min_lane: number

    bar_or_section: boolean
    bar_from_0: boolean
    beat_fn_time: boolean

    pooling: {
      ahead: number
      interval: number
    }

    auto_save: boolean
    exporter: {
      sv: boolean
      crop: boolean
    }
    nearest: number
    color_stats: boolean

    always_version: boolean
    stray_logo: boolean
    err_notify: boolean
    diff_reference: {
      main_lw: number
      ref_lw: number
      reverse: boolean
      bg_op: number
    }
    disable_inspect: boolean

    /** chart-main 中 fn 的排列，数组内是 fn 的 id（见 core/misc/fn-tabs.ts） */
    fn_tabs: {
      left: number[]
      right: number[]
    }
    beat_tolerance: number
    addict: {
      enabled: boolean
      minutes: number
      popup: boolean
    }
    restrict_feature: boolean
    tap_delay: number
  }
  export interface statistics {
    first_open: number
    used_time: number
  }

  export interface storage_scheme {
    settings: settings
    version: number
    shortcut: string
    username: string
    statistics: statistics
  }
}
export type charts_data = {
  last_open: number
  id: string
  name: string
  composer: string
  bpm: string
  ext: string
  diffs: string[]
}[]

export type ImportVspResult =
  { state: 'success' } | { state: 'existed' } | { state: 'failed'; reason: string }

export type CustomSongInfo = {
  chart_id: string
  name: string
  formatted_name: string
  artist: string
  sort_artists: string[]
  bpm_display: string
  version: string
  is_original: false
  is_published: boolean
  jacket_artist: string
  has_encore: boolean
  difficulty_constant_1: number
  difficulty_display_1: string
  note_designer_1: string
  difficulty_constant_2: number
  difficulty_display_2: string
  note_designer_2: string
  difficulty_constant_3: number
  difficulty_display_3: string
  note_designer_3: string
  difficulty_constant_4: number
  difficulty_display_4: string
  note_designer_4: string
  unlock: {
    type: 0
    enc_type: number
    per_difficulty: boolean
    hidden: boolean
    hint: string
    enc_hint: string
  }
  enc_data: {
    audio_id: string
    preview_id: string
    jacket: string
    bpm_display: string
    name: string
    formatted_name: string
    artist: string
    jacket_designer: string
  }
}
