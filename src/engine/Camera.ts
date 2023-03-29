import { Engine } from './Engine'
import * as THREE from 'three'
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js'
import { GameEntity } from './GameEntity'

export class Camera implements GameEntity {
  public instance!: THREE.PerspectiveCamera
  private controls!: PointerLockControls
  private moveForward: boolean = false
  private moveBackward: boolean = false
  private moveLeft: boolean = false
  private moveRight: boolean = false
  private movementSpeed = 4

  constructor(private engine: Engine) {
    this.initCamera()
    this.initControls()
    this.initController()
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

  private initControls() {
    this.controls = new PointerLockControls(this.instance, this.engine.canvas)
  }

  resize() {
    this.instance.aspect = this.engine.sizes.aspectRatio
    this.instance.updateProjectionMatrix()
  }

  update(delta: number) {
    if (this.moveForward) {
      this.controls.moveForward(delta * this.movementSpeed)
    }
    if (this.moveBackward) {
      this.controls.moveForward(-delta * this.movementSpeed)
    }
    if (this.moveLeft) {
      this.controls.moveRight(-delta * this.movementSpeed)
    }
    if (this.moveRight) {
      this.controls.moveRight(delta * this.movementSpeed)
    }
  }

  initController() {
    const blocker = document.getElementById('blocker')!
    const instructions = document.getElementById('instructions')!

    instructions.addEventListener('click', () => {
      this.controls.lock()
    })

    this.controls.addEventListener('lock', () => {
      instructions.style.display = 'none'
      blocker.style.display = 'none'
    })

    this.controls.addEventListener('unlock', () => {
      blocker.style.display = 'block'
      instructions.style.display = ''
    })

    const onKeyDown = (event: KeyboardEvent) => {
      switch (event.code) {
        case 'ArrowUp':
        case 'KeyW':
          this.moveForward = true
          break

        case 'ArrowLeft':
        case 'KeyA':
          this.moveLeft = true
          break

        case 'ArrowDown':
        case 'KeyS':
          this.moveBackward = true
          break

        case 'ArrowRight':
        case 'KeyD':
          this.moveRight = true
          break
      }
    }

    const onKeyUp = (event: KeyboardEvent) => {
      switch (event.code) {
        case 'ArrowUp':
        case 'KeyW':
          this.moveForward = false
          break

        case 'ArrowLeft':
        case 'KeyA':
          this.moveLeft = false
          break

        case 'ArrowDown':
        case 'KeyS':
          this.moveBackward = false
          break

        case 'ArrowRight':
        case 'KeyD':
          this.moveRight = false
          break
      }
    }

    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('keyup', onKeyUp)
  }
}
