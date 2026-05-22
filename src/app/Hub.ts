export interface GameEntry {
  id: string
  title: string
  icon: string
  color: string
  bgColor: string
  desc: string
}

const games: GameEntry[] = [
  { id: 'racing', title: 'Formula Racing', icon: '🏎️', color: '#ff4444', bgColor: 'rgba(255,68,68,0.15)', desc: 'Corrida 3D' },
  { id: 'snake', title: 'Cobrinha', icon: '🐍', color: '#44ff44', bgColor: 'rgba(68,255,68,0.15)', desc: 'Snake clássico' },
  { id: 'pong', title: 'Pong', icon: '🏓', color: '#ffcc00', bgColor: 'rgba(255,204,0,0.15)', desc: 'Pong vs IA' },
  { id: 'flappy', title: 'Flappy Bird', icon: '🐦', color: '#4dc9f6', bgColor: 'rgba(77,201,246,0.15)', desc: 'Desvie dos canos' },
  { id: 'invaders', title: 'Space Invaders', icon: '👾', color: '#44ff44', bgColor: 'rgba(68,255,68,0.15)', desc: 'Invasores espaciais' },
  { id: 'dino', title: 'Dino Runner', icon: '🦖', color: '#535353', bgColor: 'rgba(83,83,83,0.15)', desc: 'Pule obstáculos' },
  { id: 'breakout', title: 'Breakout', icon: '🧱', color: '#ff8800', bgColor: 'rgba(255,136,0,0.15)', desc: 'Quebre os tijolos' },
]

export class Hub {
  private container: HTMLElement
  private el: HTMLDivElement
  private selectCb: ((id: string) => void) | null = null

  constructor(container: HTMLElement) {
    this.container = container
    this.el = document.createElement('div')
    this.el.id = 'hub-screen'
    this.build()
  }

  onSelectGame(cb: (id: string) => void) { this.selectCb = cb }

  show() {
    this.container.appendChild(this.el)
  }

  hide() {
    this.el.remove()
  }

  private build() {
    this.el.innerHTML = `
      <div class="hub-header">
        <h1>🎮 NOSTALGIC GAMES</h1>
        <p>Escolha um jogo para jogar</p>
      </div>
      <div class="hub-grid">
        ${games.map(g => `
          <div class="game-card" data-game="${g.id}" style="border-color:${g.color}20;background:${g.bgColor}">
            <div class="card-icon" style="background:${g.color}22">${g.icon}</div>
            <div class="card-title" style="color:${g.color}">${g.title}</div>
            <div class="card-desc">${g.desc}</div>
          </div>
        `).join('')}
      </div>
      <div class="hub-loto">
        <p>🎯 LOTOFÁCIL — Jogos abaixo</p>
      </div>
    `

    this.el.querySelectorAll('.game-card').forEach(card => {
      card.addEventListener('click', () => {
        const id = (card as HTMLElement).dataset.game
        if (id) this.selectCb?.(id)
      })
      card.addEventListener('touchstart', (e) => {
        (card as HTMLElement).style.transform = 'scale(0.95)'
      }, { passive: true })
      card.addEventListener('touchend', () => {
        (card as HTMLElement).style.transform = ''
      }, { passive: true })
    })
  }
}
