import { InputState } from './types'

export class Input {
  private state: InputState = {
    accelerate: false,
    brake: false,
    left: false,
    right: false,
  }

  private onPause: (() => void) | null = null

  constructor() {
    this.setupKeyboard()
    this.setupTouchButtons()
  }

  private setupKeyboard(): void {
    window.addEventListener('keydown', (e) => {
      switch (e.code) {
        case 'KeyW': case 'ArrowUp': this.state.accelerate = true; break
        case 'KeyS': case 'ArrowDown': this.state.brake = true; break
        case 'KeyA': case 'ArrowLeft': this.state.left = true; break
        case 'KeyD': case 'ArrowRight': this.state.right = true; break
        case 'Escape': this.onPause?.(); break
      }
    })
    window.addEventListener('keyup', (e) => {
      switch (e.code) {
        case 'KeyW': case 'ArrowUp': this.state.accelerate = false; break
        case 'KeyS': case 'ArrowDown': this.state.brake = false; break
        case 'KeyA': case 'ArrowLeft': this.state.left = false; break
        case 'KeyD': case 'ArrowRight': this.state.right = false; break
      }
    })
  }

  private setupTouchButtons(): void {
    const ids = ['btn-accel', 'btn-brake', 'btn-left', 'btn-right']
    const keys: (keyof InputState)[] = ['accelerate', 'brake', 'left', 'right']

    ids.forEach((id, i) => {
      const el = document.getElementById(id)
      if (!el) return
      el.addEventListener('touchstart', (e) => { e.preventDefault(); this.state[keys[i]] = true })
      el.addEventListener('touchend', (e) => { e.preventDefault(); this.state[keys[i]] = false })
      el.addEventListener('touchcancel', () => { this.state[keys[i]] = false })
      el.addEventListener('mousedown', () => { this.state[keys[i]] = true })
      el.addEventListener('mouseup', () => { this.state[keys[i]] = false })
      el.addEventListener('mouseleave', () => { this.state[keys[i]] = false })
    })

    const pauseBtn = document.getElementById('btn-pause')
    pauseBtn?.addEventListener('click', () => this.onPause?.())
  }

  getState(): InputState {
    return { ...this.state }
  }

  setPauseHandler(handler: () => void): void {
    this.onPause = handler
  }

  reset(): void {
    this.state = { accelerate: false, brake: false, left: false, right: false }
  }
}
