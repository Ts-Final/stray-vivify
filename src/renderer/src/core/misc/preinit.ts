import { reactive, ref } from 'vue'
import { utils } from '@renderer/core/utils'
import { route } from '@renderer/core/misc/route'

export namespace Preinit {
  export function finish_init() {
    finished.value = true
    // if all passes check
    if (!Object.values(Stages).includes(false))
      route.change('start')
    fns.forEach((x) => x())
    utils.clear_arr(fns)
  }

  export const Stages = reactive({
    load_settings: false,
    all_chart: false,
    debugs: false,
    intervals: false,
    animation_frame: false,
    check_skin: false
  })

  export const finished = ref(false)

  const fns: CallableFunction[] = []
  export function on_finish(fn: CallableFunction) {
    fns.push(fn)
  }
}
