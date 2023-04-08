import { Engine } from './Engine'
import * as THREE from 'three'
import { GameEntity } from './GameEntity'

export class Camera implements GameEntity {
  public instance!: THREE.PerspectiveCamera

  constructor(private engine: Engine) {
    this.initCamera()
  }

  private initCamera() {
    this.instance = new THREE.PerspectiveCamera(
      70,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    )
    this.instance.position.set(0, 1.7, 3)
    this.engine.scene.add(this.instance)
  }

  resize() {
    this.instance.aspect = this.engine.sizes.aspectRatio
    this.instance.updateProjectionMatrix()
  }

  update() {}
}
