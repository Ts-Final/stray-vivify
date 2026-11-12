import { modal } from '@renderer/core/misc/modal'
import { utils } from '@renderer/core/utils'
import { Assets, Texture } from 'pixi.js'
// import { Assets, Texture } from 'pixi.js'

export namespace Skin {
  export const status: Record<string, null | Texture> = {
    '1.png': null,
    '1b.png': null,
    '1lh.png': null,
    '1rh.png': null,
    '2b.png': null,
    '2l.png': null,
    '2m.png': null,
    '2r.png': null,
    '2lh.png': null,
    '2mh.png': null,
    '2rh.png': null,
    '2sl.png': null,
    '2sm.png': null,
    '2sr.png': null,
    '3b.png': null,
    '3l.png': null,
    '3lh.png': null,
    '3r.png': null,
    '3rh.png': null,
    '3sl.png': null,
    '3sr.png': null,
    '4.png': null,
    '4b.png': null,
    '4h.png': null,
    '4s.png': null
  }

  export async function check_skin() {
    let is_missing = false
    for (const key of utils.keyof(status)) {
      try {
        status[key] = (await Assets.load(`stray:/__skin__/${key}`)) as Texture
      } catch (e) {
        is_missing = true
      }
    }
    if (is_missing) {
      modal.MissingSkinModal.show({})
    }
    if (getTexture('1.png')) {
      Skin.BaseWidth = getTexture('1.png').width
      Skin.BaseHeight = getTexture('1.png').height
    }
    return 0
  }
  export function getTexture(key: string) {
    return status[key] as Texture
  }
  export let BaseWidth =  130
  export let BaseHeight = 43
  export function height(width: number) {
    return Math.round((width / BaseWidth) * BaseHeight)
  }

  export async function load_css() {
    try {
      const r = await fetch('stray:/__skin__/skin.css')
      if (!r.ok) throw new Error('no css')

      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = 'stray:/__skin__/skin.css'
      document.head.appendChild(link);
    } catch (e) {
      console.log("skin.css not found")
    }
  }
}
