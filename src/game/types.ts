export interface GameState {
  phase: 'menu' | 'playing' | 'paused' | 'finished'
  speed: number
  currentLap: number
  totalLaps: number
  lapTime: number
  bestLapTime: number
  raceTime: number
  maxSpeed: number
}

export interface InputState {
  accelerate: boolean
  brake: boolean
  left: boolean
  right: boolean
}

export interface CheckpointData {
  index: number
  position: { x: number; z: number }
  width: number
  passed: boolean
}

export interface LapResult {
  lap: number
  time: number
}
