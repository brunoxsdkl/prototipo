import * as THREE from 'three'

export class CameraFollow {
  private camera: THREE.PerspectiveCamera
  private target: THREE.Object3D
  private offset = new THREE.Vector3(0, 5, 8)
  private lookOffset = new THREE.Vector3(0, 1, -5)
  private smoothSpeed = 4
  private currentPos = new THREE.Vector3()
  private currentLook = new THREE.Vector3()

  constructor(camera: THREE.PerspectiveCamera, target: THREE.Object3D) {
    this.camera = camera
    this.target = target
    this.currentPos.copy(target.position).add(this.offset)
    this.currentLook.copy(target.position).add(this.lookOffset)
  }

  update(dt: number): void {
    const idealPos = new THREE.Vector3()
    const idealLook = new THREE.Vector3()

    const forward = new THREE.Vector3(0, 0, -1)
    forward.applyQuaternion(this.target.quaternion)

    idealPos.copy(this.target.position)
    idealPos.add(forward.clone().multiplyScalar(-this.offset.z))
    idealPos.y += this.offset.y

    idealLook.copy(this.target.position)
    idealLook.add(forward.clone().multiplyScalar(-this.lookOffset.z))
    idealLook.y += this.lookOffset.y

    this.currentPos.lerp(idealPos, dt * this.smoothSpeed)
    this.currentLook.lerp(idealLook, dt * this.smoothSpeed)

    this.camera.position.copy(this.currentPos)
    this.camera.lookAt(this.currentLook)
  }

  reset(): void {
    this.currentPos.copy(this.target.position).add(this.offset)
    this.currentLook.copy(this.target.position).add(this.lookOffset)
  }
}
