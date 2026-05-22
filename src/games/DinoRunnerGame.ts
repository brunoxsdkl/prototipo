export class DinoRunnerGame {
  private container: HTMLElement
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private backCb: (() => void) | null = null
  private raf = 0
  private running = false
  private w = 0; private h = 0
  private dinoX = 50
  private dinoY = 0
  private dinoVY = 0
  private dinoW = 30; private dinoH = 40
  private groundY = 0
  private gravity = 1200
  private jumpStrength = -500
  private obstacles: { x: number; w: number; h: number; type: 'cactus' | 'bird' }[] = []
  private speed = 300
  private score = 0
  private state: 'playing' | 'gameover' = 'playing'
  private canDoubleJump = true
  private jumpCount = 0
  private groundOffset = 0

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
    this.groundY = this.h - 50
  }

  private setupInput() {
    const jump = () => {
      if (this.state === 'gameover') { this.reset(); return }
      if (this.jumpCount < 2) {
        this.dinoVY = this.jumpStrength
        this.jumpCount++
      }
    }
    this.canvas.addEventListener('click', jump)
    this.canvas.addEventListener('touchstart', (e) => { e.preventDefault(); jump() }, { passive: false })
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') jump()
    })
  }

  onBack(cb: () => void) { this.backCb = cb }

  start() { this.reset(); this.running = true; this.loop() }
  stop() { this.running = false; cancelAnimationFrame(this.raf) }
  destroy() { this.stop(); window.removeEventListener('resize', this.onResize); this.canvas.remove() }

  private reset() {
    this.dinoY = this.groundY - this.dinoH
    this.dinoVY = 0; this.obstacles = []
    this.speed = 300; this.score = 0
    this.state = 'playing'; this.jumpCount = 0
    this.canDoubleJump = true
  }

  private spawnObstacle() {
    if (this.obstacles.length > 0 && this.obstacles[this.obstacles.length - 1].x > this.w - 300) return
    const type = Math.random() > 0.7 ? 'bird' : 'cactus'
    if (type === 'cactus') {
      const h = 25 + Math.random() * 25
      this.obstacles.push({ x: this.w + 20, w: 16, h, type: 'cactus' })
    } else {
      this.obstacles.push({ x: this.w + 20, w: 24, h: 14, type: 'bird' })
    }
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
    this.speed = 300 + this.score * 2
    this.score += dt * 10
    this.groundOffset = (this.groundOffset + this.speed * dt) % 40

    this.dinoVY += this.gravity * dt
    this.dinoY += this.dinoVY * dt
    if (this.dinoY > this.groundY - this.dinoH) {
      this.dinoY = this.groundY - this.dinoH
      this.dinoVY = 0
      this.jumpCount = 0
    }

    this.spawnObstacle()
    for (const o of this.obstacles) o.x -= this.speed * dt
    this.obstacles = this.obstacles.filter(o => o.x > -60)

    for (const o of this.obstacles) {
      const dinoLeft = this.dinoX; const dinoRight = this.dinoX + this.dinoW
      const dinoTop = this.dinoY; const dinoBot = this.dinoY + this.dinoH
      const obsLeft = o.x; const obsRight = o.x + o.w
      let obsTop: number, obsBot: number
      if (o.type === 'cactus') {
        obsTop = this.groundY - o.h; obsBot = this.groundY
      } else {
        obsTop = this.groundY - 40; obsBot = this.groundY - 40 + o.h
      }
      if (dinoRight > obsLeft && dinoLeft < obsRight && dinoBot > obsTop && dinoTop < obsBot) {
        this.state = 'gameover'
      }
    }
  }

  private render() {
    const c = this.ctx; const w = this.w; const h = this.h
    c.fillStyle = '#f7f7f7'
    c.fillRect(0, 0, w, h)

    for (let x = -this.groundOffset; x < w + 40; x += 40) {
      c.fillStyle = '#535353'
      c.fillRect(x, this.groundY, 20, 2)
    }

    c.fillStyle = '#333'
    c.fillRect(this.dinoX, this.dinoY, this.dinoW, this.dinoH)
    c.fillStyle = '#555'
    c.fillRect(this.dinoX + 4, this.dinoY - 6, 8, 8)

    for (const o of this.obstacles) {
      if (o.type === 'cactus') {
        c.fillStyle = '#2d7a2d'
        c.fillRect(o.x, this.groundY - o.h, o.w, o.h)
        c.fillStyle = '#1a5a1a'
        c.fillRect(o.x - 4, this.groundY - o.h + 4, o.w + 8, 4)
        c.fillRect(o.x - 2, this.groundY - o.h + 12, o.w + 4, 4)
      } else {
        c.fillStyle = '#8B4513'
        c.fillRect(o.x, this.groundY - 40, o.w, o.h)
        c.fillStyle = '#5c2e00'
        c.fillRect(o.x, this.groundY - 40, o.w, 3)
        c.fillRect(o.x, this.groundY - 28, o.w, 3)
      }
    }

    c.fillStyle = '#555'
    c.font = `bold ${Math.min(w * 0.05, 22)}px monospace`
    c.textAlign = 'right'
    c.fillText(`${Math.floor(this.score)}`, w - 12, 30)

    if (this.state === 'gameover') {
      c.fillStyle = 'rgba(0,0,0,0.7)'
      c.fillRect(0, 0, w, h)
      c.fillStyle = '#ff4444'
      c.font = `bold ${Math.min(w * 0.08, 32)}px sans-serif`
      c.textAlign = 'center'
      c.fillText('GAME OVER', w / 2, h / 2 - 20)
      c.fillStyle = '#fff'
      c.font = `${Math.min(w * 0.04, 18)}px sans-serif`
      c.fillText(`Score: ${Math.floor(this.score)}`, w / 2, h / 2 + 20)
      c.fillStyle = '#aaa'
      c.font = `${Math.min(w * 0.035, 16)}px sans-serif`
      c.fillText('Toque para jogar novamente', w / 2, h / 2 + 55)
    }
  }
}
