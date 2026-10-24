//这个版本我是按照原版计算顺序来写的//
import { FrameRate } from '@renderer/core/misc/frame-rates'
import { utils } from '@renderer/core/utils'
import { ChartTypeV2 } from '@preload/chart-types'

///类型别名///
type bpm = number
type time_ms = number
type time_sec = number
type lane = number
////////////

export function calc_stats(diff: ChartTypeV2.diff, songLengthMs: time_ms): ChartTypeV2.SongStats {
  FrameRate.calc_sr.start()

  let noteStat: number,
    speedStat: number,
    techStat: number,
    fillStat: number,
    multiStat: number,
    totalV2: number,
    totalV3: number
  //基础信息声明
  let bpmList: [number, number][] = []
  for (const bpmObj of diff.timing) {
    bpmList.push([bpmObj.time, bpmObj.bpm])
  }
  //在末尾补充一个bpm以便计算最后一个bpm的维持时间
  bpmList.push([songLengthMs, 0])
  // let averageBPM=GetAverageBPM(bpmList)
  let averageBPM = GetAverageBPM(bpmList)
  const data = new SongData(diff.timing)
  data.SetBucketLength(averageBPM, Math.ceil(songLengthMs / 1000))

  for (const note of diff.notes) {
    if ('snm' in note && note.snm == 1) continue
    let noteMs = note.time
    let noteWidth = note.width
    let noteLane = note.lane
    let noteEndMs = -1

    if ('len' in note) {
      noteEndMs = noteMs + note.len
      data.AddHoldNote(noteLane, noteMs, noteEndMs)
      continue
    }
    if (noteWidth > 1) {
      data.AddBumper(noteLane, noteMs)
      continue
    }
    data.AddNote(noteLane, noteMs)
  }

  data.CalculateJacks(data.allNotesNoHold)
  data.CalculateChains(data.allNotesNoHold)
  data.FinishDensityCalculation()

  let note = data.normalNotes
  let hold = data.holdNotes
  let bumper = data.bumpers
  let holdpiece = data.holdPieces
  let combo = data.noteCount
  let multi = data.multiNoteCount
  let length = Math.ceil(songLengthMs / 1000)
  let notesnopiece = combo - holdpiece
  let basepower = (((notesnopiece + data.averageDensity + multi * 0.75) / (length / 3)) * 4) / 1.25

  noteStat = Math.pow(
    Math.max((note / 1.5 - multi / 2.5) / (length / 20) + basepower - 20, 0),
    1.025
  )
  speedStat = Math.pow(
    Math.max(0, data.averageDensity * 5 + basepower / 2 - utils.clamp(multi, 0, 300) / 10 - 40),
    1.025
  )
  let t1 = (bumper / 2 + hold / 2) / (length / 20)
  let t2 = (data.jackStat / 2300 + data.chainStat / 2300 - Math.max(0, (length - 180) / 2.5)) / 1.5
  techStat = Math.pow(Math.max(0, t1 + basepower + t2 - 20), 1.025)
  fillStat = Math.max(data.peakDensity * 4 - 30, 0)
  multiStat = Math.pow(Math.max(0, multi / 1.5 / (length / 20) + basepower), 1.025)
  totalV2 = noteStat + speedStat + techStat + multiStat * 0.33 + fillStat * 0.5
  totalV3 = Math.pow(
    noteStat * 0.8 + techStat * 0.8 + speedStat + multiStat * 0.5 + fillStat * 0.5,
    1
  )
  FrameRate.calc_sr.end()
  return {
    note: noteStat,
    speed: speedStat,
    tech: techStat,
    fill: fillStat,
    multi: multiStat,
    total_v2: totalV2,
    total_v3: totalV3
  }
}

//辅助函数
function GetAverageBPM(bpmList: [number, number][]): bpm {
  let maxLength = -1
  let averageBPM = 0
  for (let i = 0; i < bpmList.length - 1; i++) {
    if (bpmList[i + 1][0] - bpmList[i][0] > maxLength) {
      averageBPM = bpmList[i][1]
      maxLength = bpmList[i + 1][0] - bpmList[i][0]
    }
  }
  return averageBPM
}
//没想到吧，我直接把gml那个类给复刻过来了
class SongData {
  bpmList: ChartTypeV2.diff['timing']
  bumpers = 0
  holdNotes = 0
  holdPieces = 0
  lanes = [0, 0, 0, 0]
  normalNotes = 0
  noteCount = 0
  multiNoteCount = 0
  multiHoldNoteCount = 0
  hasMods = false
  holdNoteTimings: number[][] = []
  noteTimings = new Map<time_ms, boolean>()
  bucketLength = 0
  peakDensity = 0
  lowestDensity = 900
  peakBeatDensity = 0
  buckets: number[] = []
  beatBucket = 0
  allBeatBuckets: number[] = []
  averageDensity = 0
  allNotesNoHold: number[][] = []
  jackCount = 0
  jackTimings: number[] = []
  jackStat = 0
  chainCount = 0
  chainTimings: number[] = []
  chainStat = 0
  songLength = 0
  isMulti: boolean = false

  constructor(bpmList: ChartTypeV2.diff['timing']) {
    this.bpmList = bpmList
  }
  //原GML逻辑是读到bpm类型的语句就将this.BPM变成读到的BPM
  //转换一下，也就是寻找一个noteTime在哪个bpm的区间......对吗/
  FindTimeAtBPM(bpmList: ChartTypeV2.diff['timing'], time: time_ms): bpm {
    for (let i = 0; i < bpmList.length; i++) {
      if (time < bpmList[0].time) {
        return bpmList[0].bpm
      } else if (time < bpmList[i].time) {
        return bpmList[i - 1].bpm
      } else if (time == bpmList[i].time) {
        return bpmList[i].bpm
      }
    }
    return bpmList[bpmList.length - 1].bpm
  }

  SetBucketLength(_BPM: bpm, songLength: time_sec) {
    // if (BPM >= 300) _BPM /= 2
    this.songLength = songLength
    this.bucketLength = 1000
    this.buckets = new Array(this.songLength).fill(0)
    this.allBeatBuckets = new Array(this.songLength).fill(0)
  }

  //I have no idea what arg1 stands for
  CalculateDensity(noteMs: time_ms, arg1: number) {
    let index = Math.floor(noteMs / this.bucketLength)

    if (index < 0) return

    for (let i = index; i < index + 4; i++) {
      if (i < this.buckets.length) this.buckets[i] += arg1
    }

    if (index < this.allBeatBuckets.length) this.allBeatBuckets[index] += arg1
  }

  FinishDensityCalculation() {
    let sum = 0

    for (let i = 0; i < this.buckets.length; i++) {
      if (this.buckets[i] > this.peakDensity) this.peakDensity = this.buckets[i]

      sum += this.buckets[i]

      if (this.allBeatBuckets[i] > this.peakBeatDensity)
        this.peakBeatDensity = this.allBeatBuckets[i]
    }

    this.averageDensity = sum / this.buckets.length
  }

  CheckForCollisions(noteTime: time_ms) {
    if (this.noteTimings.has(noteTime)) {
      this.multiNoteCount++
      this.isMulti = true
    } else {
      this.noteTimings.set(noteTime, true)
    }

    if (this.holdNoteTimings.length > 0) {
      let newTimings: number[][] = []

      for (let i = 0; i < this.holdNoteTimings.length; i++) {
        const timing = this.holdNoteTimings[i]

        if (timing[1] >= noteTime) newTimings.push(timing)

        if (noteTime >= timing[0] && noteTime < timing[1]) this.multiHoldNoteCount++
      }

      this.holdNoteTimings = newTimings
    }
  }

  AddNote(noteLane: lane, noteMs: time_ms) {
    this.noteCount++
    this.lanes[noteLane]++
    this.normalNotes++
    this.allNotesNoHold.push([noteLane, noteMs])
    this.isMulti = false
    this.CheckForCollisions(noteMs)
    this.CalculateDensity(noteMs, 1 - 0.2 * Number(this.isMulti))
  }

  //因为左右bumper数本体并未参与stat计算，所以舍掉了
  AddBumper(noteLane: lane, noteMs: time_ms) {
    this.noteCount++
    this.bumpers++
    this.allNotesNoHold.push([noteLane + 4, noteMs])
    this.CheckForCollisions(noteMs)
    this.CalculateDensity(noteMs, 0.75)
  }

  AddHoldNote(noteLane: lane, noteMs: time_ms, holdEndMs: time_ms) {
    this.noteCount += 2
    this.holdNotes++
    this.CheckForCollisions(noteMs)
    this.CalculateDensity(noteMs, 0.85)
    this.allNotesNoHold.push([noteLane, noteMs])
    this.holdNoteTimings.push([noteMs, holdEndMs])
    let msPerBeat = 60000 / this.FindTimeAtBPM(this.bpmList, noteMs)
    let noteDurationMs = holdEndMs - noteMs - msPerBeat
    let notes = noteDurationMs / msPerBeat
    let parts = Math.ceil(notes)

    for (let i = 0; i < parts; i++) {
      let partMs = noteMs + (i + 1) * msPerBeat

      if (partMs <= holdEndMs - 150) {
        this.holdPieces++
        this.noteCount++
      }
    }
  }

  //fuck the jacks and chains and TECH stat calculation,why these can't work properly???
  CalculateJacks(notHoldNotes: number[][]) {
    this.jackCount = 0
    this.jackTimings = []

    for (let i = 0; i < notHoldNotes.length - 1; i++) {
      if (notHoldNotes[i][0] == notHoldNotes[i + 1][0]) {
        if (notHoldNotes[i][0] < 4) {
          this.jackCount++
          this.jackTimings.push(notHoldNotes[i + 1][1] - notHoldNotes[i][1])
        }
      }
    }

    for (let i = 0; i < this.jackTimings.length; i++)
      this.jackStat += Math.max(0, 1000 - this.jackTimings[i])
  }

  CalculateChains(notHoldNotes: number[][]) {
    this.chainCount = 0
    this.chainTimings = []

    for (let i = 0; i < notHoldNotes.length - 1; i++) {
      if (notHoldNotes[i][0] < 4) {
        let lane = notHoldNotes[i][0]

        if (lane == 0 || lane == 1) {
          if (notHoldNotes[i + 1][0] == 4) {
            this.chainCount++
            this.chainTimings.push(notHoldNotes[i + 1][1] - notHoldNotes[i][1])
          }
        }

        if (lane == 2 || lane == 3) {
          if (notHoldNotes[i + 1][0] == 6) {
            this.chainCount++
            this.chainTimings.push(notHoldNotes[i + 1][1] - notHoldNotes[i][1])
          }
        }
      }
    }

    for (let i = 0; i < this.chainTimings.length; i++)
      this.chainStat += Math.max(0, 1000 - this.chainTimings[i])
  }
}
