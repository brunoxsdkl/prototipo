import * as THREE from 'three'
import { Car } from './Car'
import { Track } from './Track'
import { Input } from './Input'
import { HUD } from './HUD'
import { CameraFollow } from './CameraFollow'
import { Checkpoints } from './Checkpoints'
import { GameState } from './types'

export class Game {
  private scene: THREE.Scene
  private camera: THREE.PerspectiveCamera
  private renderer: THREE.WebGLRenderer
  private car: Car
  private track: Track
  private input: Input
  private hud: HUD
  private cameraFollow: CameraFollow
  private checkpoints: Checkpoints

  private state: GameState
  private clock = new THREE.Clock()
  private running = false
  private rafId = 0

  constructor(container: HTMLElement) {
    this.scene = new THREE.Scene()

    this.camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 200)
    this.camera.position.set(0, 6, 10)

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
    })
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.shadowMap.enabled = false
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.2
    container.appendChild(this.renderer.domElement)

    // Sky
    const skyColor = new THREE.Color(0x87CEEB)
    this.scene.background = skyColor

    // Lighting
    const ambient = new THREE.AmbientLight(0xffffff, 0.5)
    this.scene.add(ambient)

    const sun = new THREE.DirectionalLight(0xffffff, 1.5)
    sun.position.set(30, 30, 20)
    this.scene.add(sun)

    const fill = new THREE.DirectionalLight(0x88aaff, 0.3)
    fill.position.set(-20, 10, -20)
    this.scene.add(fill)

    // Fog
    this.scene.fog = new THREE.Fog(0x87CEEB, 60, 120)

    // Track
    this.track = new Track()
    this.scene.add(this.track.mesh)

    // Car
    this.car = new Car({ maxSpeed: 80, acceleration: 35, turnSpeed: 2.0 })
    this.car.reset(this.track.startPosition, this.track.startRotation)
    this.scene.add(this.car.mesh)

    // Camera
    this.cameraFollow = new CameraFollow(this.camera, this.car.mesh)

    // Input
    this.input = new Input()
    this.input.setPauseHandler(() => {
      if (this.state.phase === 'playing') this.pause()
      else if (this.state.phase === 'paused') this.resume()
    })

    // HUD
    this.hud = new HUD()
    this.hud.onStart(() => this.start())
    this.hud.onResume(() => this.resume())
    this.hud.onRestart(() => this.restart())
    this.hud.onMenu(() => this.goToMenu())

    // Checkpoints
    this.checkpoints = new Checkpoints(this.track, 3)

    // State
    this.state = {
      phase: 'menu',
      speed: 0,
      currentLap: 0,
      totalLaps: 3,
      lapTime: 0,
      bestLapTime: Infinity,
      raceTime: 0,
      maxSpeed: 80,
    }

    this.hud.showMenu()

    // Resize
    window.addEventListener('resize', () => this.resize())

    this.resize()
  }

  private resize(): void {
    const w = window.innerWidth
    const h = window.innerHeight
    this.camera.aspect = w / h
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(w, h)
  }

  start(): void {
    this.state.phase = 'playing'
    this.state.raceTime = 0
    this.state.lapTime = 0
    this.state.currentLap = 0
    this.state.bestLapTime = Infinity
    this.car.reset(this.track.startPosition, this.track.startRotation)
    this.cameraFollow.reset()
    this.checkpoints.reset(0)
    this.hud.showGame()
    this.clock.start()
    if (!this.running) { this.running = true; this.loop() }
  }

  pause(): void {
    if (this.state.phase !== 'playing') return
    this.state.phase = 'paused'
    this.hud.showPause()
  }

  resume(): void {
    if (this.state.phase !== 'paused') return
    this.state.phase = 'playing'
    this.hud.hidePause()
    this.clock.getDelta()
  }

  restart(): void {
    this.start()
  }

  goToMenu(): void {
    this.state.phase = 'menu'
    this.hud.showMenu()
    this.car.reset(this.track.startPosition, this.track.startRotation)
    this.cameraFollow.reset()
  }

  private loop(): void {
    this.rafId = requestAnimationFrame(() => this.loop())

    const dt = Math.min(this.clock.getDelta(), 0.05)

    if (this.state.phase === 'playing') {
      this.state.raceTime += dt
      this.state.lapTime += dt

      const input = this.input.getState()
      this.car.update(dt, input)

      // Keep car on track
      const pos = this.car.mesh.position
      if (!this.track.isOnTrack(pos.x, pos.z)) {
        const idx = this.track.getClosestPointIndex(pos.x, pos.z)
        const cx = this.track.centerLine[idx].x
        const cz = this.track.centerLine[idx].z
        const dir = new THREE.Vector3(pos.x - cx, 0, pos.z - cz).normalize()
        pos.x += dir.x * dt * 20
        pos.z += dir.z * dt * 20
        this.car.speed *= 0.95
      }

      const result = this.checkpoints.update(pos, this.state.raceTime)
      if (result.newLap) {
        this.state.currentLap = this.checkpoints.getCurrentLap()
        this.state.bestLapTime = this.checkpoints.getBestLapTime()
        this.state.lapTime = 0
      }

      if (this.checkpoints.isLapComplete()) {
        this.state.phase = 'finished'
        this.hud.showFinish(this.checkpoints.getLapResults(), this.state.bestLapTime)
      }

      this.state.speed = this.car.speed
      this.hud.update(this.state)

      this.cameraFollow.update(dt)
    } else if (this.state.phase === 'menu') {
      this.car.mesh.rotation.y += dt * 0.5
    }

    this.renderer.render(this.scene, this.camera)
  }
}
