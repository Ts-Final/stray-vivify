import { Storage } from '@renderer/core/storage'
import { modal } from '@renderer/core/misc/modal'
import { Preinit } from '@renderer/core/misc/preinit'

type IBirthData = [string, [number, number]]

const data: IBirthData[] = [
  ['Arisu Suzushima', [9, 6]],
  ['白枫', [6, 28]],
  ['云枝', [3, 12]],
  ['摸鱼月', [6, 16]],
  ['InvalidData', [11, 2]],
  ['巧克力白咖啡', [11, 20]],
  ['阿凌喵', [11, 18]],
  ['Creeper_001', [10, 29]],
  ['lunathy', [12, 4]],
  ['Frac', [9, 29]],
  ['Rysgj ', [10, 9]],
  ['Alphacodmyyds', [2,17]],
  ['YFMonochrome', [8,1]],
  ['The_Gh0st_', [9,1]],
  ['Hileznx', [9,9]],
  ['AlexZX15363', [2,8]]
]

export const birthday = {
  celebrate() {
    const ls = Storage.statistics.last_seen_date
    const now = new Date()
    if (now.getDate() == ls.getDate() && now.getMonth() == ls.getMonth()) return
    const pending: string[] = []
    const month = now.getMonth() + 1
    const day = now.getDate()
    for (let i = 0; i < data.length; i++) {
      if (data[i][1][0] == month && data[i][1][1] == day) {
        pending.push(data[i][0])
      }
    }
    if (!pending.length) {
      console.log("今天并没有人生日哦……")
      return
    }
    const msg = `今天${month}月${day}日，是 <strong class="rainbow-text-color"> ${pending.join(',')} </strong> 的生日哦。祝他（们）生日快乐！`
    Preinit.on_finish(() => modal.ShowInformationModal.show({ msg: msg }))
  }
}
