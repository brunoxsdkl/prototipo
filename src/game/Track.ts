import * as THREE from 'three'

export interface TrackPoint {
  x: number
  z: number
}

export class Track {
  public mesh: THREE.Group
  public centerLine: TrackPoint[] = []
  public checkpoints: { p1: THREE.Vector3; p2: THREE.Vector3 }[] = []
  public startPosition: THREE.Vector3 = new THREE.Vector3(0, 0, 0)
  public startRotation: number = 0

  // Oval track parameters
  private straightLen = 30
  private turnRadius = 18
  private trackWidth = 10

  constructor() {
    this.mesh = new THREE.Group()
    this.buildTrack()
  }

  private buildTrack(): void {
    const segments = 48
    this.centerLine = []
    const points: THREE.Vector3[] = []

    for (let i = 0; i <= segments; i++) {
      const t = (i / segments) * Math.PI * 2
      let x: number, z: number

      if (t < Math.PI / 2) {
        const r = this.turnRadius
        x = this.straightLen + r * Math.sin(t)
        z = -(r - r * Math.cos(t))
      } else if (t < Math.PI) {
        const tt = t - Math.PI / 2
        x = this.straightLen + this.turnRadius * Math.sin(Math.PI / 2) - tt * (this.straightLen * 2 / (segments / 2))
        z = -this.turnRadius
      } else if (t < Math.PI * 1.5) {
        const tt = t - Math.PI
        x = -(this.straightLen + this.turnRadius * Math.sin(tt))
        z = -(this.turnRadius - this.turnRadius * Math.cos(tt))
      } else {
        const tt = t - Math.PI * 1.5
        x = -(this.straightLen + this.turnRadius * Math.sin(Math.PI / 2)) + tt * (this.straightLen * 2 / (segments / 2))
        z = this.turnRadius
      }

      points.push(new THREE.Vector3(x, 0, z))
      this.centerLine.push({ x, z })
    }

    this.startPosition = new THREE.Vector3(points[0].x, 0, points[0].z)
    this.startRotation = 0

    // Asphalt track surface
    const trackShape = new THREE.Shape()
    const hw = this.trackWidth / 2
    const first = points[0]
    trackShape.moveTo(first.x - hw, first.z - hw)
    trackShape.lineTo(first.x + hw, first.z - hw)

    for (let i = 1; i < points.length; i++) {
      const p = points[i]
      const prev = points[i - 1]
      const dx = p.x - prev.x
      const dz = p.z - prev.z
      const len = Math.sqrt(dx * dx + dz * dz)
      if (len === 0) continue
      const nx = -dz / len * hw
      const nz = dx / len * hw

      if (i === 1) {
        trackShape.moveTo(p.x - nx, p.z - nz)
        trackShape.lineTo(p.x + nx, p.z + nz)
      } else {
        trackShape.lineTo(p.x + nx, p.z + nz)
      }
    }
    for (let i = points.length - 1; i >= 0; i--) {
      const p = points[i]
      const prev = points[(i + 1) % points.length]
      const dx = prev.x - p.x
      const dz = prev.z - p.z
      const len = Math.sqrt(dx * dx + dz * dz)
      if (len === 0) continue
      let nx = -dz / len * hw
      let nz = dx / len * hw
      if (i === points.length - 1) {
        const next = points[i - 1]
        const ddx = next.x - p.x
        const ddz = next.z - p.z
        const llen = Math.sqrt(ddx * ddx + ddz * ddz)
        if (llen > 0) { nx = -ddz / llen * hw; nz = ddx / llen * hw }
      }
      trackShape.lineTo(p.x - nx, p.z - nz)
    }
    trackShape.closePath()

    const trackGeom = new THREE.ShapeGeometry(trackShape)
    const asphaltMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.9, metalness: 0.1, side: THREE.DoubleSide })
    const trackMesh = new THREE.Mesh(trackGeom, asphaltMat)
    trackMesh.rotation.x = -Math.PI / 2
    trackMesh.position.y = -0.01
    this.mesh.add(trackMesh)

    // Curbs (zebras)
    const curbMat = new THREE.MeshStandardMaterial({ color: 0xcc0000, roughness: 0.8 })
    const curbMatW = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8 })

    for (let i = 0; i < points.length; i += 3) {
      const p = points[i]
      const prev = points[(i - 1 + points.length) % points.length]
      const dx = p.x - prev.x
      const dz = p.z - prev.z
      const len = Math.sqrt(dx * dx + dz * dz) || 1
      const nx = -dz / len * (hw + 0.3)
      const nz = dx / len * (hw + 0.3)

      for (const side of [-1, 1]) {
        const curb = new THREE.Mesh(
          new THREE.BoxGeometry(1.5, 0.05, 0.3),
          i % 6 < 3 ? curbMat : curbMatW
        )
        curb.position.set(p.x + nx * side, 0, p.z + nz * side)
        this.mesh.add(curb)
      }
    }

    // Grass plane around
    const grassMat = new THREE.MeshStandardMaterial({ color: 0x3a8c3a, roughness: 0.9 })
    const grassGeom = new THREE.PlaneGeometry(200, 200)
    const grass = new THREE.Mesh(grassGeom, grassMat)
    grass.rotation.x = -Math.PI / 2
    grass.position.y = -0.02
    this.mesh.add(grass)

    // Start/finish line
    const startMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 })
    for (let i = -4; i <= 4; i++) {
      const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.02, 0.5), startMat)
      stripe.position.set(first.x + i * 0.6, 0.01, first.z - hw - 0.5)
      this.mesh.add(stripe)
    }

    // Grandstands (arquibancadas)
    const standMat = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.7 })
    const standMat2 = new THREE.MeshStandardMaterial({ color: 0x884422, roughness: 0.7 })
    for (let side = -1; side <= 1; side += 2) {
      for (let i = 0; i < 3; i++) {
        const stand = new THREE.Mesh(new THREE.BoxGeometry(10, 2, 4), standMat)
        stand.position.set(i * 12 - 12, 1, (this.turnRadius + this.trackWidth + 8) * side)
        this.mesh.add(stand)
        for (let row = 0; row < 3; row++) {
          const seat = new THREE.Mesh(new THREE.BoxGeometry(9, 0.2, 0.8), standMat2)
          seat.position.set(i * 12 - 12, 0.4 + row * 0.5, (this.turnRadius + this.trackWidth + 8 + (row - 1) * 0.7) * side)
          this.mesh.add(seat)
        }
      }
    }

    // Trees
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5c3a1a, roughness: 0.9 })
    const leafMat = new THREE.MeshStandardMaterial({ color: 0x2d7a2d, roughness: 0.8 })
    const treePositions = [
      [-25, -25], [30, -28], [-30, 28], [35, 30],
      [-40, -20], [45, -22], [-35, 25], [40, -35],
      [-20, -35], [20, 35], [-45, 5], [50, -5],
    ]
    for (const pos of treePositions) {
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.25, 1.5), trunkMat)
      trunk.position.set(pos[0], 0.75, pos[1])
      this.mesh.add(trunk)
      const leaf = new THREE.Mesh(new THREE.SphereGeometry(1.2, 6, 6), leafMat)
      leaf.position.set(pos[0], 2.2, pos[1])
      this.mesh.add(leaf)
    }

    // Decorative billboards
    const billMat = new THREE.MeshStandardMaterial({ color: 0x1a4477, roughness: 0.5 })
    const billMat2 = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 })
    const billPositions = [
      [-8, this.turnRadius + this.trackWidth + 5],
      [8, this.turnRadius + this.trackWidth + 5],
      [-8, -(this.turnRadius + this.trackWidth + 5)],
      [8, -(this.turnRadius + this.trackWidth + 5)],
    ]
    for (const pos of billPositions) {
      const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.2, 2, 0.2), billMat2)
      pillar.position.set(pos[0], 1, pos[1])
      this.mesh.add(pillar)
      const board = new THREE.Mesh(new THREE.BoxGeometry(3, 1, 0.1), billMat)
      board.position.set(pos[0], 2.5, pos[1])
      this.mesh.add(board)
    }

    // Build checkpoints
    this.buildCheckpoints(points)
  }

  private buildCheckpoints(points: THREE.Vector3[]): void {
    const checkpointIndices = [0, 6, 12, 18, 24, 30, 36, 42]
    const hw = this.trackWidth / 2

    for (const idx of checkpointIndices) {
      const p = points[idx]
      const prev = points[(idx - 1 + points.length) % points.length]
      const dx = p.x - prev.x
      const dz = p.z - prev.z
      const len = Math.sqrt(dx * dx + dz * dz) || 1
      const nx = -dz / len
      const nz = dx / len

      this.checkpoints.push({
        p1: new THREE.Vector3(p.x + nx * hw, 0, p.z + nz * hw),
        p2: new THREE.Vector3(p.x - nx * hw, 0, p.z - nz * hw),
      })
    }
  }

  getClosestPointIndex(x: number, z: number): number {
    let minDist = Infinity
    let minIdx = 0
    for (let i = 0; i < this.centerLine.length; i++) {
      const dx = x - this.centerLine[i].x
      const dz = z - this.centerLine[i].z
      const dist = dx * dx + dz * dz
      if (dist < minDist) { minDist = dist; minIdx = i }
    }
    return minIdx
  }

  isOnTrack(x: number, z: number): boolean {
    const idx = this.getClosestPointIndex(x, z)
    const cx = this.centerLine[idx].x
    const cz = this.centerLine[idx].z
    const dist = Math.sqrt((x - cx) ** 2 + (z - cz) ** 2)
    return dist < this.trackWidth / 2 + 0.5
  }
}
