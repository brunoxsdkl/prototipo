import './styles.css'
import { Game } from './game/Game'

const container = document.getElementById('game-container')
if (container) {
  new Game(container)
}
