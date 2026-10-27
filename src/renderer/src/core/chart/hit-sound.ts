import { Chart } from '@renderer/core/chart/chart'
import { watch } from 'vue'
import { Storage } from '@renderer/core/storage'
import { utils } from '@renderer/core/utils'
import { notify } from '@renderer/core/misc/notify'
import { GlobalStat } from '@renderer/core/globalStat'
import { sectionTap } from '@renderer/core/misc/section-tap'

const audioContext = GlobalStat.audioContext
export class HitSoundSystem {
  hit_error = false
  private audioBuffer: AudioBuffer | null = null
  private gainNode: GainNode | null = null
  private maxVoices = 64
  private activeVoices: Array<{ source: AudioBufferSourceNode; endTime: number }> = []
  private chart: Chart
  private last_trigger: number

  constructor(chart: Chart) {
    this.chart = chart
    this.initWebAudio()
    this.last_trigger = -Infinity
  }
  get shown() {
    return this.chart.diff.shown
  }

  get enabled() {
    return Storage.settings.hit_sound
  }

  on_unpause() {
    this.last_trigger = this.chart.audio.current_time
  }

  public async play_hit() {
    if (this.hit_error || !this.audioBuffer || !this.gainNode || !this.enabled) {
      return
    }

    const now = audioContext.currentTime
    this.activeVoices = this.activeVoices.filter((v) => v.endTime > now)

    const last = this.last_trigger
    const current = this.chart.audio.current_time - Storage.settings.offset3
    if (last == current) return

    // Find note in current time window
    // or if sectionTap is enabled, find section in current time window
    const hitNote = sectionTap.enabled
      ? this.chart.diff.section_list.some((x) => {
          return utils.between(x, [last, current])
        })
      : this.shown.some((x) => {
          if (!utils.between(x.time, [last, current])) return false
          if ('snm' in x) return x.snm != 1
          return true
        })
    this.last_trigger = this.chart.audio.current_time - Storage.settings.offset3

    if (hitNote) {
      if (this.activeVoices.length >= this.maxVoices) {
        this.activeVoices.shift()
      }
      try {
        const source = audioContext.createBufferSource()
        source.buffer = this.audioBuffer
        source.connect(this.gainNode)
        source.start(now)

        // Track active voice
        this.activeVoices.push({
          source,
          endTime: now + (this.audioBuffer.duration || 0.5)
        })
      } catch (e) {
        console.error('Failed to play sound:', e)
      }
    }
  }

  private async initWebAudio() {
    try {
      this.gainNode = audioContext.createGain()
      watch(
        () => Storage.settings.hit_volume,
        (v) => {
          if (this.gainNode) this.gainNode.gain.value = v / 100
          else notify.error('打击音炸了！')
        },
        {
          immediate: true
        }
      )
      this.gainNode.connect(audioContext.destination)

      const response = await fetch('stray:/__hit__/')
      if (!response.ok) {
        this.hit_error = true
        return console.error('Hitsound unfound')
      }

      const arrayBuffer = await response.arrayBuffer()
      this.audioBuffer = await audioContext.decodeAudioData(arrayBuffer)
    } catch (error) {
      this.hit_error = true
      notify.error('打击音无法加载。请检查打击音文件是否有效。')
    }
  }
}
