import * as THREE from 'three'
import { Track } from './Track'
import { LapResult } from './types'

export class Checkpoints {
  private checkpoints: { p1: THREE.Vector3; p2: THREE.Vector3 }[] = []
  private nextCheckpoint = 0
  private totalCheckpoints = 0
  private currentLap = 0
  private totalLaps: number
  private lapStartTime = 0
  private lapResults: LapResult[] = []
  private bestLapTime = Infinity
  private lastCheckpointTime = 0

  constructor(track: Track, totalLaps: number) {
    this.checkpoints = track.checkpoints
    this.totalCheckpoints = this.checkpoints.length
    this.totalLaps = totalLaps
  }

  getCurrentLap(): number { return this.currentLap }
  getBestLapTime(): number { return this.bestLapTime }
  getLapResults(): LapResult[] { return this.lapResults }

  reset(raceTime: number): void {
    this.nextCheckpoint = 0
    this.currentLap = 0
    this.lapResults = []
    this.lapStartTime = raceTime
    this.lastCheckpointTime = raceTime
  }

  update(carPos: THREE.Vector3, raceTime: number): { newLap: boolean; crossedStart: boolean } {
    if (this.nextCheckpoint >= this.totalCheckpoints) return { newLap: false, crossedStart: false }

    const cp = this.checkpoints[this.nextCheckpoint]
    const closest = this.pointToSegment(carPos, cp.p1, cp.p2)

    if (closest < 2.5) {
      this.nextCheckpoint++

      if (this.nextCheckpoint >= this.totalCheckpoints) {
        this.currentLap++
        const lapTime = raceTime - this.lapStartTime
        this.lapResults.push({ lap: this.currentLap, time: lapTime })
        if (lapTime < this.bestLapTime) this.bestLapTime = lapTime
        this.lapStartTime = raceTime

        this.nextCheckpoint = 0
        return { newLap: true, crossedStart: true }
      }
    }

    return { newLap: false, crossedStart: false }
  }

  isLapComplete(): boolean {
    return this.currentLap >= this.totalLaps
  }

  private pointToSegment(p: THREE.Vector3, a: THREE.Vector3, b: THREE.Vector3): number {
    const ab = new THREE.Vector3().subVectors(b, a)
    const ap = new THREE.Vector3().subVectors(p, a)
    const t = Math.max(0, Math.min(1, ap.dot(ab) / ab.dot(ab)))
    const closest = new THREE.Vector3().copy(a).add(ab.multiplyScalar(t))
    return p.distanceTo(closest)
  }
}
