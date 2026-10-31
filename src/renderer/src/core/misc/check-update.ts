import { Invoke } from '@renderer/core/ipc'
import { modal } from '@renderer/core/misc/modal'
import { notify } from '@renderer/core/misc/notify'

/** release notes 和路径都会塞进 v-html 的 msg 里，必须先转义 */
function escape_html(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function readable_size(size: number): string {
  if (!size) return '大小未知'
  return `${(size / 1024 / 1024).toFixed(1)} MB`
}

export namespace CheckUpdate {
  /** 防止启动时的自动检查和手动检查叠在一起 */
  let checking = false

  /**
   * 检查 GitHub 上有没有新版本。发现有更新时弹确认框，
   * 用户点「确定」后调用 download-update：主进程下载 + 解压 + 生成更新脚本，
   * 然后退出程序，脚本替换完文件再把它启动回来。
   */
  export async function check_update(): Promise<void> {
    if (checking) return
    checking = true
    try {
      // 开发模式不检查更新
      if (await Invoke('is-dev')) return

      // 上次更新失败的话先说一声，不然用户只会看到"没更新成功"
      await report_last_result()

      const r = await Invoke('check-update')
      if (r.state === 'failed') {
        console.warn('[check-update] 检查更新失败：' + r.msg)
        return
      }
      if (r.state === 'latest') return

      const notes = r.notes
        ? `<br><br><span>${escape_html(r.notes).replace(/\n/g, '<br>')}</span>`
        : ''
      modal.ConfirmModal.show({
        msg:
          `发现新版本 <b>${escape_html(r.version)}</b>` +
          `（当前 ${escape_html(r.current)}，更新包 ${readable_size(r.size)}）。<br>` +
          `是否现在下载并自动更新？下载完成后程序会自动重启。${notes}`
      }).then(() => {
        void download()
      }).catch(() => {})
    } catch (e) {
      console.warn('[check-update] ' + e)
    } finally {
      checking = false
    }
  }

  const report_last_result = async (): Promise<void> => {
    const s = await Invoke('update-status')
    if (s.state !== 'failed') return
    notify.error('上次自动更新失败，程序仍是旧版本', 4000)
    modal.ShowInformationModal.show({
      msg:
        `上次自动更新失败，程序仍在旧版本。<br>` +
        `可以手动解压更新包覆盖到：<br>${escape_html(s.install)}<br><br>` +
        `更新包：${escape_html(s.zip)}<br>日志：${escape_html(s.log)}`
    })
  }

  const download = async (): Promise<void> => {
    const r = await Invoke('download-update')
    if (r.state === 'success') return // 主进程已经提示过，马上会自动重启

    notify.error(`自动更新失败：${r.msg}`, 4000)
    if (r.path && r.install) {
      modal.ShowInformationModal.show({
        msg:
          `自动更新失败：${escape_html(r.msg)}<br><br>` +
          `更新包已经下载到：<br>${escape_html(r.path)}<br>` +
          `可以解压后手动覆盖到：<br>${escape_html(r.install)}`
      })
    }
  }
}
