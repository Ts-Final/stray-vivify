import { createApp, nextTick } from 'vue'
import App from './App.vue'
import '@renderer/styles.css'

import { createModal } from '@kolirt/vue-modal'
import { ShortCuts } from '@renderer/core/misc/shortcut'
import { Invoke, load_ipc_handlers } from '@renderer/core/ipc'
import { Storage, Version } from '@renderer/core/storage'
import { GlobalStat } from '@renderer/core/globalStat'
import { Chart } from '@renderer/core/chart/chart'
import { FrameRate } from '@renderer/core/misc/frame-rates'
import { modal } from '@renderer/core/misc/modal'
import { Intervals } from '@renderer/core/misc/intervals'
import { Log, MouseTracker } from '@renderer/core/misc/inspector'
import { expose_variables } from '@renderer/core/misc/inspector-exposer'
import { load_external_tips } from '@renderer/core/misc/startup-tips'
import { Preinit } from '@renderer/core/misc/preinit'
import { Skin } from '@renderer/core/misc/skin'
import { AntiAddiction } from '@renderer/core/misc/anti-addiction'
import { CheckUpdate } from '@renderer/core/misc/check-update'

const app = createApp(App).use(
  createModal({
    transitionTime: 200,
    animationType: 'slideUp',
    modalStyle: {
      padding: '2rem 1rem'
    },
    overlayStyle: {
      'background-color': 'rgba(0,0,0,.3)'
    }
  })
)

function update_per_frame() {
  FrameRate.aniFrame.start()

  Chart.current?.on_update()
  requestAnimationFrame(update_per_frame)

  FrameRate.aniFrame.end()
  FrameRate.next_tick.start()

  nextTick().then(() => {
    FrameRate.next_tick.end()
  })
}
function alert_version(r: number) {
  if (r > Version.val) {
    modal.ShowInformationModal.show({ msg: `已从更新的版本（版本号${r}）回退至${Version.val}。` })
  }
  if (r < Version.val) {
    modal.VersionsModal.show({})
  }
}

async function exec(fn: CallableFunction) {
  return await fn()
}

async function main() {
  await exec(async () => {
    const r = await Storage.set_from_storage()
    ShortCuts.fromJson(Storage.data.value.shortcut)
    AntiAddiction.init()
    Preinit.Stages.load_settings = true
    if (r) Preinit.on_finish(() => alert_version(r))
  })

  await exec(async () => {
    await GlobalStat.update_all_chart()
    Invoke('leave-fullscreen')
    Preinit.Stages.all_chart = true
  })

  await exec(async () => {
    const disable_inspect = Storage.settings.disable_inspect
    Log.handle(disable_inspect)
    ShortCuts.handle()
    MouseTracker.init()
    expose_variables()
    load_external_tips()
    FrameRate.try_kill(disable_inspect)
    if (!disable_inspect) setInterval(() => FrameRate.refresh(), 1000)
    Preinit.Stages.debugs = true
  })

  await exec(async () => {
    Storage.init_interval()
    Intervals.on(1e4, () => {
      if (Storage.settings.auto_save) Chart.current?.save()
      Chart.current?.diff.update_tick_list()
      Chart.current?.diff.check_aimod()
    })
    Intervals.on(1000, () => {
      Chart.current?.diff.update_diff_counts()
      Storage.update_used_time()

      GlobalStat.refs.window.height.value = window.innerHeight
      GlobalStat.refs.window.width.value = window.innerWidth
      window.electron.ipcRenderer.invoke('window-max-state').then((r) => {
        GlobalStat.window_max_state.value = r
      })
    })
    Preinit.Stages.intervals = true
  })

  await exec(async () => {
    requestAnimationFrame(update_per_frame)
    Preinit.Stages.animation_frame = true
    await Skin.check_skin()
    Preinit.Stages.check_skin = true
  })

  Preinit.finish_init()
  // 初始化完成后自动检查更新，有新版会弹确认框
  CheckUpdate.check_update()
}

load_ipc_handlers()
app.mount('#app')
main()
