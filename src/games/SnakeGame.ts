export class SnakeGame {
  private container: HTMLElement
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private backCb: (() => void) | null = null
  private raf = 0
  private running = false
  private cols = 15; private rows = 15
  private cellSize = 0
  private snake: { x: number; y: number }[] = []
  private food = { x: 0, y: 0 }
  private dir = { x: 1, y: 0 }
  private nextDir = { x: 1, y: 0 }
  private score = 0
  private state: 'playing' | 'gameover' = 'playing'
  private moveTimer = 0
  private moveInterval = 0.15
  private startX = 0
  private startY = 0
  private swiping = false

  constructor(container: HTMLElement) {
    this.container = container
    this.canvas = document.createElement('canvas')
    this.canvas.style.cssText = 'display:block;width:100%;height:100%'
    this.container.appendChild(this.canvas)
    this.ctx = this.canvas.getContext('2d')!
    this.resize()
    window.addEventListener('resize', this.onResize)
    this.setupInput()
  }

  private onResize = () => this.resize()
  private resize() {
    const rect = this.container.getBoundingClientRect()
    this.canvas.width = rect.width * devicePixelRatio
    this.canvas.height = rect.height * devicePixelRatio
    this.ctx.scale(devicePixelRatio, devicePixelRatio)
    this.cellSize = Math.min(rect.width, rect.height) / Math.max(this.cols, this.rows)
  }

  private setupInput() {
    this.canvas.addEventListener('touchstart', (e) => {
      const t = e.touches[0]
      this.startX = t.clientX; this.startY = t.clientY
      this.swiping = true
    }, { passive: true })
    this.canvas.addEventListener('touchend', (e) => {
      if (!this.swiping) return
      this.swiping = false
      const t = e.changedTouches[0]
      const dx = t.clientX - this.startX
      const dy = t.clientY - this.startY
      if (Math.abs(dx) > Math.abs(dy)) {
        if (dx > 20 && this.dir.x !== -1) this.nextDir = { x: 1, y: 0 }
        else if (dx < -20 && this.dir.x !== 1) this.nextDir = { x: -1, y: 0 }
      } else {
        if (dy > 20 && this.dir.y !== -1) this.nextDir = { x: 0, y: 1 }
        else if (dy < -20 && this.dir.y !== 1) this.nextDir = { x: 0, y: -1 }
      }
    }, { passive: true })
    this.canvas.addEventListener('click', () => {
      if (this.state === 'gameover') this.reset()
    })
    window.addEventListener('keydown', (e) => {
      if (this.state === 'gameover' && (e.code === 'Space' || e.code === 'Enter')) { this.reset(); return }
      switch (e.code) {
        case 'ArrowUp': if (this.dir.y !== 1) this.nextDir = { x: 0, y: -1 }; break
        case 'ArrowDown': if (this.dir.y !== -1) this.nextDir = { x: 0, y: 1 }; break
        case 'ArrowLeft': if (this.dir.x !== 1) this.nextDir = { x: -1, y: 0 }; break
        case 'ArrowRight': if (this.dir.x !== -1) this.nextDir = { x: 1, y: 0 }; break
      }
    })
  }

  onBack(cb: () => void) { this.backCb = cb }

  start() {
    this.reset()
    this.running = true
    this.loop()
  }

  stop() {
    this.running = false
    cancelAnimationFrame(this.raf)
  }

  destroy() {
    this.stop()
    window.removeEventListener('resize', this.onResize)
    this.canvas.remove()
  }

  private reset() {
    this.snake = [{ x: 7, y: 7 }, { x: 6, y: 7 }, { x: 5, y: 7 }]
    this.dir = { x: 1, y: 0 }
    this.nextDir = { x: 1, y: 0 }
    this.score = 0
    this.state = 'playing'
    this.moveTimer = 0
    this.spawnFood()
  }

  private spawnFood() {
    const free: { x: number; y: number }[] = []
    for (let x = 0; x < this.cols; x++)
      for (let y = 0; y < this.rows; y++)
        if (!this.snake.some(s => s.x === x && s.y === y)) free.push({ x, y })
    if (free.length) { const f = free[Math.floor(Math.random() * free.length)]; this.food = f }
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
    this.moveTimer += dt
    if (this.moveTimer < this.moveInterval) return
    this.moveTimer = 0

    this.dir = { ...this.nextDir }
    const head = { x: this.snake[0].x + this.dir.x, y: this.snake[0].y + this.dir.y }
    if (head.x < 0 || head.x >= this.cols || head.y < 0 || head.y >= this.rows || this.snake.some(s => s.x === head.x && s.y === head.y)) {
      this.state = 'gameover'
      return
    }
    this.snake.unshift(head)
    if (head.x === this.food.x && head.y === this.food.y) {
      this.score++
      this.spawnFood()
    } else {
      this.snake.pop()
    }
  }

  private render() {
    const c = this.ctx
    const w = this.canvas.width / devicePixelRatio
    const h = this.canvas.height / devicePixelRatio
    const cs = this.cellSize
    const ox = (w - cs * this.cols) / 2
    const oy = (h - cs * this.rows) / 2

    c.fillStyle = '#1a1a2e'
    c.fillRect(0, 0, w, h)

    for (let x = 0; x < this.cols; x++) {
      for (let y = 0; y < this.rows; y++) {
        c.fillStyle = (x + y) % 2 === 0 ? '#1e1e35' : '#252545'
        c.fillRect(ox + x * cs, oy + y * cs, cs, cs)
      }
    }

    this.snake.forEach((s, i) => {
      c.fillStyle = i === 0 ? '#44ff44' : '#22aa22'
      c.fillRect(ox + s.x * cs + 1, oy + s.y * cs + 1, cs - 2, cs - 2)
      if (i === 0) {
        c.fillStyle = '#fff'
        const dx = this.dir.x, dy = this.dir.y
        c.fillRect(ox + s.x * cs + cs / 2 + dx * 4 - 2, oy + s.y * cs + cs / 2 + dy * 4 - 2, 4, 4)
      }
    })

    c.fillStyle = '#ff4444'
    c.beginPath()
    c.arc(ox + this.food.x * cs + cs / 2, oy + this.food.y * cs + cs / 2, cs / 2 - 2, 0, Math.PI * 2)
    c.fill()

    c.fillStyle = '#fff'
    c.font = `bold ${Math.max(14, cs * 0.7)}px monospace`
    c.textAlign = 'left'
    c.fillText(`Score: ${this.score}`, 12, 24)

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
