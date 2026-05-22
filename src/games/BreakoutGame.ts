export class BreakoutGame {
  private container: HTMLElement
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private backCb: (() => void) | null = null
  private raf = 0
  private running = false
  private w = 0; private h = 0
  private paddleX = 0
  private paddleW = 80; private paddleH = 12
  private ballX = 0; private ballY = 0
  private ballDX = 200; private ballDY = -250
  private ballR = 6
  private bricks: { x: number; y: number; w: number; h: number; color: string; alive: boolean }[] = []
  private score = 0
  private lives = 3
  private state: 'playing' | 'gameover' | 'win' = 'playing'
  private touchX = 0

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
    this.paddleW = Math.min(80, r.width * 0.2)
  }

  private setupInput() {
    this.canvas.addEventListener('touchmove', (e) => {
      e.preventDefault()
      this.touchX = e.touches[0].clientX - this.container.getBoundingClientRect().left
    }, { passive: false })
    this.canvas.addEventListener('touchstart', (e) => {
      this.touchX = e.touches[0].clientX - this.container.getBoundingClientRect().left
    }, { passive: true })
    this.canvas.addEventListener('click', () => {
      if (this.state !== 'playing') { this.reset(); return }
    })
    window.addEventListener('keydown', (e) => {
      if (this.state !== 'playing' && (e.code === 'Space' || e.code === 'Enter')) { this.reset(); return }
      if (e.code === 'ArrowLeft') this.touchX = this.paddleX - 30
      if (e.code === 'ArrowRight') this.touchX = this.paddleX + 30
    })
  }

  onBack(cb: () => void) { this.backCb = cb }

  start() { this.reset(); this.running = true; this.loop() }
  stop() { this.running = false; cancelAnimationFrame(this.raf) }
  destroy() { this.stop(); window.removeEventListener('resize', this.onResize); this.canvas.remove() }

  private reset() {
    this.bricks = []
    const colors = ['#ff4444', '#ff8800', '#ffcc00', '#44cc44', '#4488ff']
    const cols = 8; const rows = 5
    const brickW = (this.w - 20) / cols
    const brickH = 18
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++)
        this.bricks.push({ x: 10 + c * brickW, y: 10 + r * (brickH + 4), w: brickW - 2, h: brickH, color: colors[r % colors.length], alive: true })
    this.paddleX = this.w / 2 - this.paddleW / 2
    this.ballX = this.w / 2; this.ballY = this.h - 60
    this.ballDX = 200 * (Math.random() > 0.5 ? 1 : -1)
    this.ballDY = -250
    this.score = 0; this.lives = 3
    this.state = 'playing'
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
    this.paddleX = Math.max(0, Math.min(this.w - this.paddleW, this.touchX - this.paddleW / 2))
    this.ballX += this.ballDX * dt
    this.ballY += this.ballDY * dt
    if (this.ballX < this.ballR) { this.ballX = this.ballR; this.ballDX = Math.abs(this.ballDX) }
    if (this.ballX > this.w - this.ballR) { this.ballX = this.w - this.ballR; this.ballDX = -Math.abs(this.ballDX) }
    if (this.ballY < this.ballR) { this.ballY = this.ballR; this.ballDY = Math.abs(this.ballDY) }
    if (this.ballY + this.ballR > this.h - 40 && this.ballX > this.paddleX && this.ballX < this.paddleX + this.paddleW) {
      this.ballDY = -Math.abs(this.ballDY)
      const hit = (this.ballX - (this.paddleX + this.paddleW / 2)) / (this.paddleW / 2)
      this.ballDX = hit * 250
      this.ballY = this.h - 40 - this.ballR
    }
    if (this.ballY > this.h) {
      this.lives--
      if (this.lives <= 0) { this.state = 'gameover'; return }
      this.ballX = this.w / 2; this.ballY = this.h - 60
      this.ballDX = 200 * (Math.random() > 0.5 ? 1 : -1)
      this.ballDY = -250
    }
    for (const b of this.bricks) {
      if (!b.alive) continue
      if (this.ballX + this.ballR > b.x && this.ballX - this.ballR < b.x + b.w &&
          this.ballY + this.ballR > b.y && this.ballY - this.ballR < b.y + b.h) {
        b.alive = false; this.score += 10
        const overlapX = Math.min(this.ballX + this.ballR - b.x, b.x + b.w - (this.ballX - this.ballR))
        const overlapY = Math.min(this.ballY + this.ballR - b.y, b.y + b.h - (this.ballY - this.ballR))
        if (overlapX < overlapY) this.ballDX *= -1
        else this.ballDY *= -1
        this.ballDX *= 1.02
        this.ballDY *= 1.02
      }
    }
    if (this.bricks.every(b => !b.alive)) this.state = 'win'
  }

  private render() {
    const c = this.ctx; const w = this.w; const h = this.h
    c.fillStyle = '#111'
    c.fillRect(0, 0, w, h)
    for (const b of this.bricks) {
      if (!b.alive) continue
      c.fillStyle = b.color
      c.fillRect(b.x, b.y, b.w, b.h)
      c.fillStyle = 'rgba(255,255,255,0.2)'
      c.fillRect(b.x, b.y, b.w, 3)
    }
    c.fillStyle = '#fff'
    c.fillRect(this.paddleX, h - 38, this.paddleW, this.paddleH)
    c.fillStyle = '#ddd'
    c.fillRect(this.paddleX + 4, h - 38, this.paddleW - 8, 3)
    c.beginPath()
    c.arc(this.ballX, this.ballY, this.ballR, 0, Math.PI * 2)
    c.fill()
    c.fillStyle = '#fff'
    c.font = `bold ${Math.min(w * 0.04, 18)}px monospace`
    c.textAlign = 'left'
    c.fillText(`Score: ${this.score}`, 12, 24)
    c.textAlign = 'right'
    c.fillText(`Vidas: ${'♥'.repeat(this.lives)}${'♡'.repeat(3 - this.lives)}`, w - 12, 24)
    if (this.state === 'gameover' || this.state === 'win') {
      c.fillStyle = 'rgba(0,0,0,0.7)'
      c.fillRect(0, 0, w, h)
      c.fillStyle = this.state === 'win' ? '#44ff44' : '#ff4444'
      c.font = `bold ${Math.min(w * 0.08, 32)}px sans-serif`
      c.textAlign = 'center'
      c.fillText(this.state === 'win' ? 'VOCÊ VENCEU!' : 'GAME OVER', w / 2, h / 2 - 20)
      c.fillStyle = '#fff'
      c.font = `${Math.min(w * 0.04, 18)}px sans-serif`
      c.fillText(`Score: ${this.score}`, w / 2, h / 2 + 20)
      c.fillStyle = '#aaa'
      c.font = `${Math.min(w * 0.035, 16)}px sans-serif`
      c.fillText('Toque para jogar novamente', w / 2, h / 2 + 55)
    }
  }
}
