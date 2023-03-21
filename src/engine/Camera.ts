import { Engine } from './Engine'
import * as THREE from 'three'
import { FirstPersonControls } from 'three/examples/jsm/controls/FirstPersonControls.js'
// TODO: use
// import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';
// and implement it like
// https://github.com/mrdoob/three.js/blob/master/examples/misc_controls_pointerlock.html
import { GameEntity } from './GameEntity'

export class Camera implements GameEntity {
  public instance!: THREE.PerspectiveCamera
  private controls!: FirstPersonControls

  constructor(private engine: Engine) {
    this.initCamera()
    this.initControls()
  }

  private initCamera() {
    this.instance = new THREE.PerspectiveCamera(
      50,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    )
    this.instance.position.set(0, 1, 3)
    this.engine.scene.add(this.instance)
  }

  private initControls() {
    this.controls = new FirstPersonControls(this.instance, this.engine.canvas)
    this.controls.movementSpeed = 3
    this.controls.lookSpeed = 0.1
    this.controls.update(0)
  }

  resize() {
    this.instance.aspect = this.engine.sizes.aspectRatio
    this.instance.updateProjectionMatrix()
  }

  update(delta: number) {
    this.controls.update(delta)
  }
}
