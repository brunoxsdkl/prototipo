export class FlappyBirdGame {
  private container: HTMLElement
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private backCb: (() => void) | null = null
  private raf = 0
  private running = false
  private w = 0; private h = 0
  private birdY = 0; private birdVY = 0
  private gravity = 800
  private flapStrength = -250
  private pipes: { x: number; gapY: number; passed: boolean }[] = []
  private pipeW = 50
  private gapH = 140
  private pipeSpeed = 200
  private score = 0
  private state: 'playing' | 'gameover' = 'playing'
  private groundH = 60

  constructor(container: HTMLElement) {
    this.container = container
    this.canvas = document.createElement('canvas')
    this.canvas.style.cssText = 'display:block;width:100%;height:100%'
    this.container.appendChild(this.canvas)
    this.ctx = this.canvas.getContext('2d')!
    window.addEventListener('resize', this.onResize)
    this.resize()
    this.setupInput()
  }

  private onResize = () => this.resize()
  private resize() {
    const r = this.container.getBoundingClientRect()
    this.canvas.width = r.width * devicePixelRatio
    this.canvas.height = r.height * devicePixelRatio
    this.w = r.width; this.h = r.height
    this.groundH = Math.max(40, r.height * 0.08)
  }

  private setupInput() {
    const flap = () => {
      if (this.state === 'gameover') { this.reset(); return }
      this.birdVY = this.flapStrength
    }
    this.canvas.addEventListener('click', flap)
    this.canvas.addEventListener('touchstart', (e) => { e.preventDefault(); flap() }, { passive: false })
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') flap()
    })
  }

  onBack(cb: () => void) { this.backCb = cb }

  start() { this.reset(); this.running = true; this.loop() }
  stop() { this.running = false; cancelAnimationFrame(this.raf) }
  destroy() { this.stop(); window.removeEventListener('resize', this.onResize); this.canvas.remove() }

  private reset() {
    this.birdY = this.h / 2; this.birdVY = 0
    this.pipes = []; this.score = 0; this.state = 'playing'
    this.pipeSpeed = 200
    this.spawnPipe()
  }

  private spawnPipe() {
    const minGap = 60; const maxGap = this.h - this.groundH - this.gapH - 60
    this.pipes.push({ x: this.w + 20, gapY: minGap + Math.random() * (maxGap - minGap), passed: false })
  }

  private loop = () => {
    if (!this.running) return
    const dt = 1 / 60
    this.update(dt)
    this.render()
    this.raf = requestAnimationFrame(this.loop)
  }

  private update(dt: number) {
    if (this.state !== 'playing') return
    this.birdVY += this.gravity * dt
    this.birdY += this.birdVY * dt
    if (this.birdY > this.h - this.groundH - 12) { this.state = 'gameover'; return }
    if (this.birdY < 0) { this.birdY = 0; this.birdVY = 0 }

    this.pipeSpeed = 200 + this.score * 8
    for (const p of this.pipes) p.x -= this.pipeSpeed * dt
    if (this.pipes[this.pipes.length - 1].x < this.w - 220) this.spawnPipe()
    this.pipes = this.pipes.filter(p => p.x > -this.pipeW * 2)

    for (const p of this.pipes) {
      if (!p.passed && p.x + this.pipeW < 60) { this.score++; p.passed = true }
      if (this.birdX() + 14 > p.x && this.birdX() - 14 < p.x + this.pipeW) {
        if (this.birdY - 14 < p.gapY || this.birdY + 14 > p.gapY + this.gapH) {
          this.state = 'gameover'
        }
      }
    }
  }

  private birdX() { return 60 }

  private render() {
    const c = this.ctx; const w = this.w; const h = this.h
    const grad = c.createLinearGradient(0, 0, 0, h)
    grad.addColorStop(0, '#4dc9f6'); grad.addColorStop(0.7, '#87CEEB')
    c.fillStyle = grad; c.fillRect(0, 0, w, h)

    for (const p of this.pipes) {
      c.fillStyle = '#2ecc40'
      c.fillRect(p.x, 0, this.pipeW, p.gapY)
      c.fillRect(p.x, p.gapY + this.gapH, this.pipeW, h - p.gapY - this.gapH)
      c.fillStyle = '#27ae60'
      c.fillRect(p.x - 4, p.gapY - 20, this.pipeW + 8, 20)
      c.fillRect(p.x - 4, p.gapY + this.gapH, this.pipeW + 8, 20)
    }

    c.fillStyle = '#ffcc00'
    c.beginPath()
    c.arc(this.birdX(), this.birdY, 14, 0, Math.PI * 2)
    c.fill()
    c.fillStyle = '#ff9900'
    c.beginPath()
    c.moveTo(this.birdX() + 14, this.birdY)
    c.lineTo(this.birdX() + 22, this.birdY - 4)
    c.lineTo(this.birdX() + 22, this.birdY + 4)
    c.fill()

    c.fillStyle = '#8B4513'
    c.fillRect(0, h - this.groundH, w, this.groundH)
    c.fillStyle = '#5c2e00'
    c.fillRect(0, h - this.groundH, w, 4)

    c.fillStyle = '#fff'
    c.font = `bold ${Math.min(w * 0.08, 36)}px sans-serif`
    c.textAlign = 'center'
    c.fillText(`${this.score}`, w / 2, 40)

    if (this.state === 'gameover') {
      c.fillStyle = 'rgba(0,0,0,0.7)'
      c.fillRect(0, 0, w, h)
      c.fillStyle = '#ff4444'
      c.font = `bold ${Math.min(w * 0.08, 32)}px sans-serif`
      c.textAlign = 'center'
      c.fillText('GAME OVER', w / 2, h / 2 - 20)
      c.fillStyle = '#fff'
      c.font = `${Math.min(w * 0.04, 18)}px sans-serif`
      c.fillText(`Score: ${this.score}`, w / 2, h / 2 + 20)
      c.fillStyle = '#aaa'
      c.font = `${Math.min(w * 0.035, 16)}px sans-serif`
      c.fillText('Toque para jogar novamente', w / 2, h / 2 + 55)
    }
  }
}
