export class PongGame {
  private container: HTMLElement
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private backCb: (() => void) | null = null
  private raf = 0
  private running = false
  private w = 0; private h = 0
  private paddleH = 80; private paddleW = 12
  private ballSize = 10
  private playerY = 0; private aiY = 0
  private ballX = 0; private ballY = 0
  private ballDX = 0; private ballDY = 0
  private playerScore = 0; private aiScore = 0
  private state: 'playing' | 'gameover' = 'playing'
  private touchY = 0
  private winner = ''

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
  }

  private setupInput() {
    this.canvas.addEventListener('touchmove', (e) => {
      e.preventDefault()
      this.touchY = e.touches[0].clientY - this.container.getBoundingClientRect().top
    }, { passive: false })
    this.canvas.addEventListener('click', () => {
      if (this.state === 'gameover') this.reset()
    })
    window.addEventListener('keydown', (e) => {
      if (this.state === 'gameover' && (e.code === 'Space' || e.code === 'Enter')) { this.reset(); return }
      if (e.code === 'ArrowUp') this.touchY = this.playerY - 30
      if (e.code === 'ArrowDown') this.touchY = this.playerY + 30
    })
  }

  onBack(cb: () => void) { this.backCb = cb }

  start() { this.reset(); this.running = true; this.loop() }
  stop() { this.running = false; cancelAnimationFrame(this.raf) }
  destroy() { this.stop(); window.removeEventListener('resize', this.onResize); this.canvas.remove() }

  private reset() {
    this.playerY = this.h / 2 - this.paddleH / 2
    this.aiY = this.h / 2 - this.paddleH / 2
    this.ballX = this.w / 2; this.ballY = this.h / 2
    this.ballDX = (Math.random() > 0.5 ? 300 : -300)
    this.ballDY = (Math.random() - 0.5) * 200
    this.playerScore = 0; this.aiScore = 0
    this.state = 'playing'; this.winner = ''
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
    const py = Math.max(0, Math.min(this.h - this.paddleH, this.touchY - this.paddleH / 2))
    this.playerY += (py - this.playerY) * 0.3

    const aiTarget = this.ballY - this.paddleH / 2 + this.ballSize
    const aiSpeed = 200
    if (this.aiY + this.paddleH / 2 < aiTarget) this.aiY += aiSpeed * dt
    else if (this.aiY + this.paddleH / 2 > aiTarget) this.aiY -= aiSpeed * dt
    this.aiY = Math.max(0, Math.min(this.h - this.paddleH, this.aiY))

    this.ballX += this.ballDX * dt
    this.ballY += this.ballDY * dt

    if (this.ballY < 0 || this.ballY > this.h) this.ballDY *= -1

    if (this.ballX < this.paddleW + 5 && this.ballY > this.playerY && this.ballY < this.playerY + this.paddleH) {
      this.ballDX = Math.abs(this.ballDX) + 20
      const hit = (this.ballY - (this.playerY + this.paddleH / 2)) / (this.paddleH / 2)
      this.ballDY = hit * 200
    }
    if (this.ballX > this.w - this.paddleW - 5 && this.ballY > this.aiY && this.ballY < this.aiY + this.paddleH) {
      this.ballDX = -Math.abs(this.ballDX) - 20
      const hit = (this.ballY - (this.aiY + this.paddleH / 2)) / (this.paddleH / 2)
      this.ballDY = hit * 200
    }

    if (this.ballX < -20) { this.aiScore++; this.serve() }
    if (this.ballX > this.w + 20) { this.playerScore++; this.serve() }

    if (this.playerScore >= 5) { this.state = 'gameover'; this.winner = 'Você' }
    if (this.aiScore >= 5) { this.state = 'gameover'; this.winner = 'IA' }
  }

  private serve() {
    this.ballX = this.w / 2; this.ballY = this.h / 2
    this.ballDX = (Math.random() > 0.5 ? 250 : -250)
    this.ballDY = (Math.random() - 0.5) * 150
  }

  private render() {
    const c = this.ctx; const w = this.w; const h = this.h
    c.fillStyle = '#000'
    c.fillRect(0, 0, w, h)

    c.strokeStyle = '#333'
    c.setLineDash([10, 10])
    c.lineWidth = 2
    c.beginPath()
    c.moveTo(w / 2, 0); c.lineTo(w / 2, h)
    c.stroke()
    c.setLineDash([])

    c.fillStyle = '#fff'
    c.fillRect(10, this.playerY, this.paddleW, this.paddleH)
    c.fillRect(w - 10 - this.paddleW, this.aiY, this.paddleW, this.paddleH)

    c.beginPath()
    c.arc(this.ballX, this.ballY, this.ballSize, 0, Math.PI * 2)
    c.fill()

    c.font = `bold ${Math.min(w * 0.08, 40)}px monospace`
    c.textAlign = 'center'
    c.fillText(`${this.playerScore}`, w / 2 - 40, 40)
    c.fillText(`${this.aiScore}`, w / 2 + 40, 40)

    if (this.state === 'gameover') {
      c.fillStyle = 'rgba(0,0,0,0.7)'
      c.fillRect(0, 0, w, h)
      c.fillStyle = '#ffcc00'
      c.font = `bold ${Math.min(w * 0.08, 32)}px sans-serif`
      c.textAlign = 'center'
      c.fillText(`${this.winner} venceu!`, w / 2, h / 2 - 20)
      c.fillStyle = '#fff'
      c.font = `${Math.min(w * 0.035, 16)}px sans-serif`
      c.fillText(`Placar: ${this.playerScore} x ${this.aiScore}`, w / 2, h / 2 + 20)
      c.fillStyle = '#aaa'
      c.fillText('Toque para jogar novamente', w / 2, h / 2 + 55)
    }
  }
}
