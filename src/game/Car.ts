import * as THREE from 'three'
import { InputState } from './types'

export interface CarConfig {
  maxSpeed: number
  acceleration: number
  braking: number
  turnSpeed: number
  drag: number
  driftFactor: number
  turnSpeedLoss: number
}

export class Car {
  public mesh: THREE.Group
  public speed = 0
  public config: CarConfig
  public isDrifting = false
  public driftIntensity = 0

  private rotationAngle = 0
  private wheelMeshes: THREE.Mesh[] = []

  constructor(config: Partial<CarConfig> = {}) {
    this.config = {
      maxSpeed: config.maxSpeed ?? 80,
      acceleration: config.acceleration ?? 40,
      braking: config.braking ?? 60,
      turnSpeed: config.turnSpeed ?? 2.2,
      drag: config.drag ?? 0.97,
      driftFactor: config.driftFactor ?? 0.85,
      turnSpeedLoss: config.turnSpeedLoss ?? 0.92,
    }
    this.mesh = this.buildCar()
  }

  private buildCar(): THREE.Group {
    const group = new THREE.Group()
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xe02020, metalness: 0.6, roughness: 0.3 })
    const accentMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.3, roughness: 0.7 })
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 })

    const body = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.35, 4.2), bodyMat)
    body.position.y = 0.35
    group.add(body)

    const cockpit = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.4, 1.8), accentMat)
    cockpit.position.set(0, 0.65, -0.3)
    group.add(cockpit)

    const nose = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.8, 6), bodyMat)
    nose.rotation.x = -Math.PI / 2
    nose.position.set(0, 0.2, 2.4)
    group.add(nose)

    const rearWing = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.05, 0.6), accentMat)
    rearWing.position.set(0, 0.7, -2.2)
    group.add(rearWing)
    const rearWingUp = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.3, 0.1), accentMat)
    rearWingUp.position.set(0, 1.0, -2.3)
    group.add(rearWingUp)
    const frontWing = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.05, 0.4), accentMat)
    frontWing.position.set(0, 0.2, 2.2)
    group.add(frontWing)

    const wheelPositions = [
      [-0.9, 0.1, 1.2], [0.9, 0.1, 1.2],
      [-0.9, 0.1, -1.3], [0.9, 0.1, -1.3],
    ]
    for (const pos of wheelPositions) {
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.2, 12), wheelMat)
      wheel.rotation.z = Math.PI / 2
      wheel.position.set(pos[0], pos[1], pos[2])
      group.add(wheel)
      this.wheelMeshes.push(wheel)
    }

    return group
  }

  update(dt: number, input: InputState): void {
    const isTurning = input.left || input.right
    const speedRatio = Math.abs(this.speed) / this.config.maxSpeed

    if (input.accelerate) {
      this.speed = Math.min(this.speed + this.config.acceleration * dt, this.config.maxSpeed)
    } else if (input.brake) {
      this.speed = Math.max(this.speed - this.config.braking * dt, -this.config.maxSpeed * 0.3)
    } else {
      this.speed *= this.config.drag
      if (Math.abs(this.speed) < 0.1) this.speed = 0
    }

    if (isTurning && speedRatio > 0.3) {
      this.speed *= this.config.turnSpeedLoss
    }

    const turnFactor = Math.max(0.1, 1 - speedRatio * 0.35)
    if (input.left) {
      this.rotationAngle += this.config.turnSpeed * turnFactor * dt * Math.sign(this.speed || 1)
    }
    if (input.right) {
      this.rotationAngle -= this.config.turnSpeed * turnFactor * dt * Math.sign(this.speed || 1)
    }

    this.mesh.rotation.y = this.rotationAngle

    const forward = new THREE.Vector3(0, 0, -1)
    forward.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.rotationAngle)

    this.isDrifting = isTurning && speedRatio > 0.5
    this.driftIntensity = this.isDrifting ? Math.min(1, (speedRatio - 0.5) * 2) : 0
    const driftFactor = this.isDrifting ? THREE.MathUtils.lerp(1, this.config.driftFactor, this.driftIntensity) : 1

    const moveSpeed = this.speed * dt * driftFactor
    this.mesh.position.x += forward.x * moveSpeed
    this.mesh.position.z += forward.z * moveSpeed

    const tiltTarget = (input.left ? 1 : input.right ? -1 : 0) * speedRatio * 0.1
    this.mesh.rotation.z = THREE.MathUtils.lerp(this.mesh.rotation.z, tiltTarget, dt * 5)

    const pitch = (this.speed / this.config.maxSpeed) * 0.04
    this.mesh.rotation.x = THREE.MathUtils.lerp(this.mesh.rotation.x, pitch, dt * 3)

    for (const w of this.wheelMeshes) {
      w.rotation.x += this.speed * dt * 3
    }
  }

  getForward(): THREE.Vector3 {
    const forward = new THREE.Vector3(0, 0, -1)
    forward.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.rotationAngle)
    return forward
  }

  getSpeedKmh(): number {
    return Math.abs(this.speed * 3.6)
  }

  reset(position: THREE.Vector3, rotation: number): void {
    this.speed = 0
    this.rotationAngle = rotation
    this.isDrifting = false
    this.driftIntensity = 0
    this.mesh.position.copy(position)
    this.mesh.rotation.set(0, rotation, 0)
  }
}
