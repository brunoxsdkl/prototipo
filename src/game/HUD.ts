import { GameState } from './types'

export class HUD {
  private container: HTMLDivElement

  constructor() {
    this.container = document.createElement('div')
    this.container.id = 'hud'
    document.body.appendChild(this.container)
    this.build()
  }

  private build(): void {
    this.container.innerHTML = `
      <div id="hud-top" class="hud-hidden">
        <div id="speed-display">0 km/h</div>
        <div id="lap-display">Volta: 0/3</div>
        <div id="time-display">Tempo: 0:00.00</div>
        <div id="best-display">Melhor: --</div>
      </div>

      <div id="mobile-controls" class="hud-hidden">
        <div class="mobile-row">
          <button id="btn-left" class="touch-btn">◀</button>
          <button id="btn-right" class="touch-btn">▶</button>
        </div>
        <div class="mobile-row">
          <button id="btn-brake" class="touch-btn brake">▼</button>
          <button id="btn-accel" class="touch-btn accel">▲</button>
        </div>
      </div>

      <div id="btn-pause" class="hud-hidden">⏸</div>

      <div id="menu-screen">
        <div class="menu-content">
          <h1>FORMULA RACING</h1>
          <p class="subtitle">3D</p>
          <button id="btn-start" class="menu-btn">JOGAR</button>
          <p class="hint">WASD / Setas · Celular: botões touch</p>
        </div>
      </div>

      <div id="pause-screen" class="overlay hud-hidden">
        <div class="menu-content">
          <h2>PAUSADO</h2>
          <button id="btn-resume" class="menu-btn">CONTINUAR</button>
          <button id="btn-restart" class="menu-btn secondary">REINICIAR</button>
        </div>
      </div>

      <div id="finish-screen" class="overlay hud-hidden">
        <div class="menu-content">
          <h2>CORRIDA FINALIZADA!</h2>
          <div id="results"></div>
          <button id="btn-restart2" class="menu-btn">REINICIAR</button>
          <button id="btn-menu" class="menu-btn secondary">MENU</button>
        </div>
      </div>
    `
  }

  update(state: GameState): void {
    const speedEl = document.getElementById('speed-display')
    const lapEl = document.getElementById('lap-display')
    const timeEl = document.getElementById('time-display')
    const bestEl = document.getElementById('best-display')

    if (speedEl) speedEl.textContent = `${Math.round(state.speed * 3.6)} km/h`
    if (lapEl) lapEl.textContent = `Volta: ${state.currentLap}/${state.totalLaps}`
    if (timeEl) timeEl.textContent = `Tempo: ${this.formatTime(state.lapTime)}`
    if (bestEl) {
      bestEl.textContent = state.bestLapTime < Infinity
        ? `Melhor: ${this.formatTime(state.bestLapTime)}`
        : 'Melhor: --'
    }
  }

  showMenu(): void {
    this.setVisibility('menu-screen', true)
    this.setVisibility('hud-top', false)
    this.setVisibility('mobile-controls', false)
    this.setVisibility('btn-pause', false)
    this.setVisibility('pause-screen', false)
    this.setVisibility('finish-screen', false)
  }

  showGame(): void {
    this.setVisibility('menu-screen', false)
    this.setVisibility('hud-top', true)
    this.setVisibility('mobile-controls', true)
    this.setVisibility('btn-pause', true)
    this.setVisibility('pause-screen', false)
    this.setVisibility('finish-screen', false)
  }

  showPause(): void {
    this.setVisibility('pause-screen', true)
  }

  hidePause(): void {
    this.setVisibility('pause-screen', false)
  }

  showFinish(results: { lap: number; time: number }[], bestTime: number): void {
    this.setVisibility('hud-top', false)
    this.setVisibility('mobile-controls', false)
    this.setVisibility('btn-pause', false)
    this.setVisibility('finish-screen', true)

    const el = document.getElementById('results')
    if (!el) return
    let html = ''
    for (const r of results) {
      html += `<div class="result-row">Volta ${r.lap}: ${this.formatTime(r.time)}</div>`
    }
    if (bestTime < Infinity) {
      html += `<div class="result-row best">Melhor volta: ${this.formatTime(bestTime)}</div>`
    }
    el.innerHTML = html
  }

  onStart(handler: () => void): void {
    document.getElementById('btn-start')?.addEventListener('click', handler)
  }

  onResume(handler: () => void): void {
    document.getElementById('btn-resume')?.addEventListener('click', handler)
  }

  onRestart(handler: () => void): void {
    document.getElementById('btn-restart')?.addEventListener('click', handler)
    document.getElementById('btn-restart2')?.addEventListener('click', handler)
  }

  onMenu(handler: () => void): void {
    document.getElementById('btn-menu')?.addEventListener('click', handler)
  }

  private setVisibility(id: string, visible: boolean): void {
    const el = document.getElementById(id)
    if (el) el.classList.toggle('hud-hidden', !visible)
  }

  private formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toFixed(2).padStart(5, '0')}`
  }
}
