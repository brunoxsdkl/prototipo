import { Hub } from './Hub'
import { Game } from '../game/Game'
import { SnakeGame } from '../games/SnakeGame'
import { PongGame } from '../games/PongGame'
import { FlappyBirdGame } from '../games/FlappyBirdGame'
import { SpaceInvadersGame } from '../games/SpaceInvadersGame'
import { DinoRunnerGame } from '../games/DinoRunnerGame'
import { BreakoutGame } from '../games/BreakoutGame'

type GameInstance = SnakeGame | PongGame | FlappyBirdGame | SpaceInvadersGame | DinoRunnerGame | BreakoutGame

export class App {
  private container: HTMLElement
  private hub: Hub
  private currentGame: Game | GameInstance | null = null
  private screenEl: HTMLDivElement

  constructor() {
    this.container = document.getElementById('game-container')!
    this.container.innerHTML = ''
    this.screenEl = document.createElement('div')
    this.screenEl.id = 'screen'
    this.container.appendChild(this.screenEl)
    this.hub = new Hub(this.screenEl)
    this.hub.onSelectGame((id) => this.startGame(id))
    this.hub.show()
  }

  private startGame(id: string) {
    this.cleanup()
    this.hub.hide()

    const backBtn = document.createElement('button')
    backBtn.id = 'game-back-btn'
    backBtn.textContent = '← Voltar'
    this.screenEl.appendChild(backBtn)

    const handler = () => this.backToHub()

    if (id === 'racing') {
      const game = new Game(this.screenEl, handler)
      this.currentGame = game
    } else {
      let game: GameInstance
      switch (id) {
        case 'snake': game = new SnakeGame(this.screenEl); break
        case 'pong': game = new PongGame(this.screenEl); break
        case 'flappy': game = new FlappyBirdGame(this.screenEl); break
        case 'invaders': game = new SpaceInvadersGame(this.screenEl); break
        case 'dino': game = new DinoRunnerGame(this.screenEl); break
        case 'breakout': game = new BreakoutGame(this.screenEl); break
        default: this.backToHub(); return
      }
      game.onBack(handler)
      game.start()
      this.currentGame = game
    }

    backBtn.addEventListener('click', () => handler())
  }

  private cleanup() {
    this.screenEl.innerHTML = ''
  }

  private backToHub() {
    this.cleanup()
    this.currentGame = null
    this.hub.show()
  }
}
