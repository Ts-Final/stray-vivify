// why am i making this

import { Intervals } from '@renderer/core/misc/intervals'
import { modal } from '@renderer/core/misc/modal'
import { utils } from '@renderer/core/utils'
import { Storage } from '@renderer/core/storage'
import { notify } from '@renderer/core/misc/notify'

const messages = [
  ['InvalidData改编自osu!', '你的身体是为你一生服务的，而不是stray/vivify'],
  ['Rysgj', '你怎么还在写谱喵，休息一下吧'],
  ['Rysgj', '不是哥们你有几个肝啊还写'],
  ['Rysgj', '写多长时间谱啦！饮茶先嘞！'],
  ['Rysgj', '给你买了杯薄荷奶绿，快去休息！'],
  [
    'Rysgi',
    '闭嘴！我现在在叫你休息，如果你不休息，我就会一直开红死让红死一直You ' +
      ' having a heart attack'
  ],
  [
    '巧克力白咖啡',
    '如果你看到了这条，请深呼吸并检查你的精神状态，避免你的作品可能会在未来收到更多问号'
  ],
  ['巧克力白咖啡', '野兽白咖啡の嚎叫'],
  ['巧克力白咖啡', '眼保健操现在开始。第一节——'],
  ['巧克力白咖啡', '您的stray/vivify会员已到期，输入8266开启自动续费，回复TD以退订'],
  ['摸鱼月', '无论你在什么地方看到这条消息，请立刻醒来，我们没有多少机会！'],
  ['摸鱼月', '我是提醒久坐小助手，看到这条消息你立刻站起来下去跑两圈'],
  ['摸鱼月', '你眨眼变成手动挡，你呼吸变成手动挡，你身上一定有一个地方很痒']
]

class anti_addiction {
  times = 0
  disable = false

  update() {
    // ms
    const now = Storage.running_time.value
    const minutes = Storage.settings.addict.minutes
    if (now - this.times * minutes * 60e3 > minutes * 60e3) this.do_popup()
  }

  do_popup() {
    if (!Storage.settings.addict.enabled) return
    if (this.disable) return
    this.times += 1
    Intervals.wait_resume.then(() => {
      this.popup()
    })
  }

  try_out() {
    if (this.disable) {
      this.disable = false
      return notify.error("你给我关了我怎么弹出。")
    }
    this.popup()
  }

  popup() {
    const msg = utils.random(messages)

    const content = msg[1] + ' <br>by ' + msg[0]
    if (Storage.settings.addict.popup)
      modal.AntiAddictionModal.show({
        msg: msg
      })
    else notify.normal(content, 5000)
  }

  init() {
    setInterval(() => this.update(), 15e3)
  }
}

export const AntiAddiction = new anti_addiction()
