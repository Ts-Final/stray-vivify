import { Ref, ref } from 'vue'

export namespace route {
  export const query = {
    query: new Map<string, string>(),
    put(key: string, value: string) {
      this.query.set(key, value)
    },
    /**
     * Get and remove the query param
     * @param key
     * @param or fallback value
     * */
    digest(key: string, or?: string) {
      const v = this.query.get(key)
      this.query.delete(key)
      if (v) return v
      return or
    }
  }

  type routes = 'start' | 'editor' | 'preinit' | 'load-song'
  export const route: Ref<routes> = ref('preinit')
  export function change(p: routes) {
    route.value = p
  }
  /* 0: info, 1: main, 2: timing, 3: preview, 4: playfield */
  export const tab = ref(1)
  export function setTab(p: number) {
    tab.value = p
  }
}
