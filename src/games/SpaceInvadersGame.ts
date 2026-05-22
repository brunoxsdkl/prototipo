export class SpaceInvadersGame {
  private container: HTMLElement
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private backCb: (() => void) | null = null
  private raf = 0
  private running = false
  private w = 0; private h = 0
  private playerX = 0
  private playerW = 40; private playerH = 20
  private bullets: { x: number; y: number }[] = []
  private enemyBullets: { x: number; y: number }[] = []
  private enemies: { x: number; y: number; alive: boolean }[] = []
  private enemyDir = 1
  private enemySpeed = 40
  private enemyDrop = 10
  private score = 0
  private state: 'playing' | 'gameover' | 'win' = 'playing'
  private shootTimer = 0
  private enemyShootTimer = 0
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
  }

  private setupInput() {
    this.canvas.addEventListener('touchmove', (e) => {
      e.preventDefault()
      this.touchX = e.touches[0].clientX - this.container.getBoundingClientRect().left
    }, { passive: false })
    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault()
      this.touchX = e.touches[0].clientX - this.container.getBoundingClientRect().left
      this.shoot()
    }, { passive: false })
    this.canvas.addEventListener('click', () => {
      if (this.state !== 'playing') { this.reset(); return }
      this.shoot()
    })
    window.addEventListener('keydown', (e) => {
      if (this.state !== 'playing' && (e.code === 'Space' || e.code === 'Enter')) { this.reset(); return }
      if (e.code === 'ArrowLeft') this.playerX -= 30
      if (e.code === 'ArrowRight') this.playerX += 30
      if (e.code === 'Space') this.shoot()
    })
  }

  onBack(cb: () => void) { this.backCb = cb }

  start() { this.reset(); this.running = true; this.loop() }
  stop() { this.running = false; cancelAnimationFrame(this.raf) }
  destroy() { this.stop(); window.removeEventListener('resize', this.onResize); this.canvas.remove() }

  private shoot() {
    if (this.state !== 'playing') return
    this.bullets.push({ x: this.playerX + this.playerW / 2 - 2, y: this.h - 60 - this.playerH })
  }

  private reset() {
    this.enemies = []
    for (let row = 0; row < 5; row++)
      for (let col = 0; col < 8; col++)
        this.enemies.push({ x: 40 + col * 55, y: 30 + row * 40, alive: true })
    this.playerX = this.w / 2 - this.playerW / 2
    this.bullets = []; this.enemyBullets = []; this.score = 0
    this.enemyDir = 1; this.enemySpeed = 40
    this.shootTimer = 0; this.enemyShootTimer = 0
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
    this.playerX = Math.max(0, Math.min(this.w - this.playerW, this.touchX - this.playerW / 2))

    let moveDown = false
    let edgeHit = false
    for (const e of this.enemies) {
      if (!e.alive) continue
      if ((e.x > this.w - 50 && this.enemyDir > 0) || (e.x < 10 && this.enemyDir < 0)) edgeHit = true
    }
    if (edgeHit) { this.enemyDir *= -1; moveDown = true }

    for (const e of this.enemies) {
      if (!e.alive) continue
      e.x += this.enemySpeed * this.enemyDir * dt
      if (moveDown) e.y += this.enemyDrop
      if (e.y + 20 > this.h - 60) { this.state = 'gameover' }
    }
    this.enemySpeed = 40 + (5 - this.enemies.filter(e => e.alive).length / 8) * 30

    this.shootTimer += dt
    if (this.shootTimer > 0.3) { this.shootTimer = 0; this.shoot() }

    for (const b of this.bullets) b.y -= 400 * dt
    this.bullets = this.bullets.filter(b => b.y > 0)
    for (const b of this.bullets) {
      for (const e of this.enemies) {
        if (!e.alive) continue
        if (b.x > e.x && b.x < e.x + 40 && b.y > e.y && b.y < e.y + 20) {
          e.alive = false; this.score += 10
          b.y = -100
        }
      }
    }

    this.enemyShootTimer += dt
    if (this.enemyShootTimer > 0.8) {
      this.enemyShootTimer = 0
      const alive = this.enemies.filter(e => e.alive)
      if (alive.length) {
        const e = alive[Math.floor(Math.random() * alive.length)]
        this.enemyBullets.push({ x: e.x + 20, y: e.y + 20 })
      }
    }
    for (const b of this.enemyBullets) b.y += 300 * dt
    this.enemyBullets = this.enemyBullets.filter(b => b.y < this.h)
    for (const b of this.enemyBullets) {
      if (b.x > this.playerX && b.x < this.playerX + this.playerW && b.y > this.h - 60 - this.playerH && b.y < this.h - 60) {
        this.state = 'gameover'
      }
    }

    if (this.enemies.every(e => !e.alive)) this.state = 'win'
  }

  private render() {
    const c = this.ctx; const w = this.w; const h = this.h
    c.fillStyle = '#0a0a1a'
    c.fillRect(0, 0, w, h)

    for (let i = 0; i < 40; i++) {
      c.fillStyle = `rgba(255,255,255,${0.1 + Math.random() * 0.4})`
      c.beginPath()
      c.arc(Math.random() * w, Math.random() * h * 0.6, 1 + Math.random() * 2, 0, Math.PI * 2)
      c.fill()
    }

    for (const e of this.enemies) {
      if (!e.alive) continue
      c.fillStyle = '#44ff44'
      c.fillRect(e.x, e.y, 40, 16)
      c.fillStyle = '#22aa22'
      c.fillRect(e.x + 4, e.y + 16, 32, 4)
      c.fillStyle = '#ff4444'
      c.fillRect(e.x + 8, e.y - 4, 6, 4)
      c.fillRect(e.x + 26, e.y - 4, 6, 4)
    }

    c.fillStyle = '#4488ff'
    c.fillRect(this.playerX, h - 60 - this.playerH, this.playerW, this.playerH)
    c.fillStyle = '#6688ff'
    c.fillRect(this.playerX + 8, h - 60 - this.playerH - 8, this.playerW - 16, 8)

    for (const b of this.bullets) {
      c.fillStyle = '#ffff44'
      c.fillRect(b.x, b.y, 4, 12)
    }
    for (const b of this.enemyBullets) {
      c.fillStyle = '#ff4444'
      c.fillRect(b.x - 2, b.y, 4, 10)
    }

    c.fillStyle = '#fff'
    c.font = `bold ${Math.min(w * 0.05, 22)}px monospace`
    c.textAlign = 'left'
    c.fillText(`Score: ${this.score}`, 12, 26)

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
      c.fillText('Toque para jogar novamente', w / 2, h / 2 + 55)
    }
  }
}
