import { Invoke, IpcHandlers } from '../preload/types'
import fs, { existsSync, readFileSync } from 'fs'
import VsbParser from './vsbParser'
import * as electron from 'electron'
import { app, dialog, ipcMain, shell } from 'electron'
import path, { basename, extname } from 'node:path'
import ChartManager from './chart-manager'
import { file_paths, folder_size } from './fp-parser'
import { OszReader } from './osz-reader'
import { MczReader } from './mcz-reader'
import { check_update, download_update, read_update_status } from './update'
import { ChartType } from '../preload/chart-types'

function time_str() {
  const date = new Date()
  const h = date.getHours().toString().padStart(2, '0')
  const m = date.getMinutes().toString().padStart(2, '0')
  const s = date.getSeconds().toString().padStart(2, '0')
  return `[${h}:${m}:${s}]`
}

export function load_ipc_handlers(mainWindow: Electron.BrowserWindow) {
  const handler = Handler(mainWindow)
  for (const key of Object.keys(handler)) {
    ipcMain.handle(key, (event, args) => {
      console.log(time_str() + key)
      return handler[key](event, args)
    })
  }
  // console.log("loaded song handlers")
}

const Handler = (mw: Electron.BrowserWindow) => {
  const chart_manager = new ChartManager()
  return {
    'ask-song': function (_) {
      const x = dialog.showOpenDialogSync({
        properties: ['openFile'],
        filters: [{ name: 'Music Files', extensions: ['mp3', 'wav', 'ogg', 'm4a'] }]
      })
      if (!x) return undefined
      return { path: x[0], name: basename(x[0]) }
    },
    'ask-vsb': function (_): Invoke['ask-vsb']['r'] {
      const x = dialog.showOpenDialogSync({
        properties: ['openFile'],
        filters: [{ name: 'VSB', extensions: ['vsb'] }]
      })
      if (!x) return undefined
      return { path: x[0], name: basename(x[0]) }
    },
    'get-file-buffer': function (_, { fp }) {
      if (existsSync(fp)) {
        return { state: 'success', data: readFileSync(fp) }
      } else {
        return { state: 'failed', msg: '' }
      }
    },
    'open-url': function (_, { url }) {
      electron.shell.openExternal(url)
    },
    'read-vsb': function (_, { fp: p }) {
      if (!existsSync(p)) return
      const buf = readFileSync(p)
      return new VsbParser(buf).runToNotes()
    },
    'save-chart': function (_, { id, data }) {
      chart_manager.write_chart(id, JSON.parse(data))
    },
    'import-song': function (_, { id, path: music_path }) {
      return chart_manager.import_song(music_path, id)
    },
    'import-vsp': function (_, { fp, id }) {
      return chart_manager.create_from_vsp(id, fp)
    },
    'open-song': function (_, { id }) {
      if (chart_manager.exists(id)) {
        return chart_manager.open_song(id)
      }
      // this wont be triggered bc in open_song it will fuck
      throw new Error('')
    },
    'get-charts-data': function (_) {
      return chart_manager.chart_list()
    },
    'update-chart-data': function (_, { id, data }) {
      const data1 = JSON.parse(data) as { song: ChartType.song; diffs: string[] }
      chart_manager.update_chart(
        id,
        data1.song.name,
        data1.song.composer,
        data1.song.bpm,
        data1.diffs
      )
    },
    'get-conf': function (_) {
      if (fs.existsSync(file_paths.config)) {
        return fs.readFileSync(file_paths.config, 'utf-8')
      } else return undefined
    },
    'save-conf': function (_, { data }) {
      fs.writeFileSync(file_paths.config, data, 'utf-8')
    },
    'backup-chart': function (_, { id, data }) {
      chart_manager.backup_chart(id, data)
    },
    'store-backup': async function (_, { id, data }) {
      // Now data is ChartTypeV2.final, chart-manager will handle compression
      // 现在data是ChartTypeV2.final，chart-manager将处理压缩
      await chart_manager.write_backup(id, data)
    },
    'get-backup-list': function (_, { id }) {
      return chart_manager.get_backup_list(id)
    },
    'load-backup': function (_, { id, backup_name }) {
      // Returns ChartTypeV2.final directly after decompression
      // 直接返回解压后的ChartTypeV2.final
      return chart_manager.load_backup(id, backup_name)
    },
    'init-data': function (_) {
      const cd = chart_manager.chart_list()
      let conf: string | undefined = undefined
      if (fs.existsSync(file_paths.config)) {
        conf = fs.readFileSync(file_paths.config, 'utf-8')
      }
      let skin: string | undefined = undefined
      if (fs.existsSync(file_paths.skin)) {
        skin = fs.readFileSync(file_paths.skin, 'utf-8')
      }
      return {
        conf: conf,
        skin: skin,
        cd: cd
      }
    },
    'export-svc': function (_, { id }) {
      chart_manager.export_svc(id)
    },
    'export-zip': (_, { id }) => {
      chart_manager.export_zip(id)
    },
    'import-zip': function (_, { fp, id }) {
      return chart_manager.import_chart(fp, id)
    },
    'detect-chart-pack': function (_, { fp }) {
      return chart_manager.detect_chart_pack(fp)
    },
    'remove-chart': function (_, { id }) {
      chart_manager.remove_chart(id)
    },
    'import-sprite': (_, { id }) => {
      chart_manager.import_sprite(id)
    },
    'import-background': (_, { id }) => {
      chart_manager.import_bg(id)
    },
    'enter-fullscreen': () => {
      mw.setFullScreen(true)
    },
    'leave-fullscreen': () => {
      mw.setFullScreen(false)
    },
    'write-file': (_, { id, fname, data }) => {
      chart_manager.write_file(id, fname, data)
    },
    'show-file': (_, { id, fname }) => {
      chart_manager.show_file(id, fname)
    },
    'open-skin-folder': () => {
      shell.openPath(file_paths.skin)
    },
    'read-osz': (_, { fp }) => {
      if (!fp || !existsSync(fp)) return
      const osz = OszReader.create(fp)
      return {
        song: osz.get_song(),
        diff: osz.get_diffs(),
        pix: osz.getImages().length
      }
    },
    'import-osz': async (_, { fp, id }) => {
      const osz = OszReader.create(fp)
      const song = osz.getAudioFile()
      if (!song) return 0
      chart_manager.create_from_osz(id, osz)
      return 1
    },
    'import-osz-pics': (_, { id, ix }) => {
      const current = OszReader.current
      if (!current) return
      const images = current.getImages()
      if (images.length == 0) return
      chart_manager.import_osz_sprite(id, images[ix][0], extname(images[ix][1]))
    },
    'close-osz': () => {
      OszReader.current = undefined
      console.log('osz closed')
    },
    'read-mcz': (_, { fp }) => {
      if (!fp || !existsSync(fp)) return
      const mcz = MczReader.create(fp)
      return {
        song: mcz.get_song(),
        diff: mcz.get_diffs(),
        pix: mcz.getImages().length,
        warnings: mcz.get_warnings()
      }
    },
    'import-mcz': async (_, { fp, id }) => {
      const mcz = MczReader.create(fp)
      const song = mcz.getAudioFile()
      if (!song) return 0
      chart_manager.create_from_mcz(id, mcz)
      return 1
    },
    'import-mcz-pics': (_, { id, ix }) => {
      const current = MczReader.current
      if (!current) return
      const images = current.getImages()
      if (images.length == 0) return
      chart_manager.import_mcz_sprite(id, images[ix][0], extname(images[ix][1]))
    },
    'close-mcz': () => {
      MczReader.current = undefined
      console.log('mcz closed')
    },
    'export-preview-svg': (_, { id, svg_text }) => {
      chart_manager.write_svg_text(id, svg_text)
    },
    'open-dev': () => {
      mw.webContents.openDevTools({ mode: 'right' })
    },
    'memory-backend': () => {
      return process.memoryUsage()
    },
    'is-dev': () => {
      return process.env.NODE_ENV === 'development'
    },
    'charts-size': async () => {
      const what = fs.readdirSync(file_paths.charts)
      let detail: [number, string][] = []
      let detailsf: [number, string][] = []
      for (let i = 0; i < what.length; i++) {
        const lstat = fs.lstatSync(path.join(file_paths.charts, what[i]))
        if (lstat.isDirectory())
          detail.push([await folder_size(path.join(file_paths.charts, what[i])), what[i]])
        else detailsf.push([lstat.size, what[i]])
      }
      const _app = await folder_size(app.getPath('userData'))
      const _exe = await folder_size(path.dirname(app.getPath('module')))
      const _total = await folder_size(file_paths.charts)
      return {
        detail: detail,
        detail_sf: detailsf,
        app: _app,
        exe: _exe,
        total: _total
      }
    },
    'ask-file': (_, { file: f }) => {
      const fp = dialog.showOpenDialogSync({
        properties: ['openFile'],
        filters: [{ name: f[0], extensions: f.slice(1) }]
      })
      if (!fp) return
      return fp[0]
    },
    'open-file-utf': (_, { path: fp }) => {
      if (!fs.existsSync(fp)) return
      return fs.readFileSync(fp, 'utf-8')
    },
    'create-folder': (_, { id, fname: name }) => {
      if (fs.existsSync(path.join(file_paths.charts, id)))
        if (fs.existsSync(path.join(file_paths.charts, id, name))) return 1
      return 0
    },
    'export-for-custom': (_, { data }) => {
      chart_manager.export_for_custom(data)
    },
    'set-process-name': (_, { name }) => {
      mw.title = name
    },
    'joined-time': (_) => {
      let T = Infinity
      T = Math.min(T, fs.statSync(file_paths.module).birthtimeMs)
      T = Math.min(T, fs.statSync(app.getPath('userData')).birthtimeMs)
      if (process.env.APPDATA) {
        const p = path.join(process.env.APPDATA, 'vs-charter-ev')
        if (fs.existsSync(p)) T = Math.min(T, fs.statSync(p).birthtimeMs)
      }
      return T
    },
    'read-external': (_, { fname }) => {
      if (fs.existsSync(path.join(file_paths.external, fname))) {
        return fs.readFileSync(path.join(file_paths.external, fname), 'utf-8')
      }
      return undefined
    },
    'flash-frame': (_, { flag = true }) => {
      mw.flashFrame(flag)
    },
    'delete-backup': (_, { id, backup_name }) => {
      chart_manager.delete_backup(id, backup_name)
    },
    'open-path': (_, { id, path: fname }) => {
      chart_manager.show_folder(id, fname)
    },
    // 自动更新（见 src/main/update.ts）
    'check-update': () => check_update(),
    'download-update': () => download_update(mw),
    'update-status': () => read_update_status()
  } as Required<IpcHandlers.invoke.handler>
}
