import { Euler, EventDispatcher, Vector3 } from 'three'

import * as THREE from 'three'

const _vector = new Vector3()
const _changeEvent = { type: 'change' }
const _lockEvent = { type: 'lock' }
const _unlockEvent = { type: 'unlock' }

const _PI_2 = Math.PI / 2

export class RelativeControls extends EventDispatcher {
  private camera: THREE.Camera
  private domElement: Element
  private isLocked: boolean
  private minPolarAngle: number
  private maxPolarAngle: number
  private pointerSpeed: number
  private _onMouseMove: any
  private _onPointerlockChange: any
  private _onPointerlockError: any
  private _euler = new Euler(0, 0, 0, 'YXZ')

  private isMovingForward: boolean = false
  private isMovingBackward: boolean = false
  private isMovingLeft: boolean = false
  private isMovingRight: boolean = false
  private movementSpeed = 4

  constructor(camera: THREE.Camera, domElement: Element) {
    super()

    this.camera = camera
    this.domElement = domElement

    this.isLocked = false

    // Set to constrain the pitch of the camera
    // Range is 0 to Math.PI radians
    this.minPolarAngle = 0 // radians
    this.maxPolarAngle = Math.PI // radians
    this.pointerSpeed = 1.0
    this._onMouseMove = (event: MouseEvent) => this.onMouseMove(event)
    this._onPointerlockChange = () => this.onPointerlockChange()
    this._onPointerlockError = () => this.onPointerlockError()

    this.connect()

    const onKeyDown = (event: KeyboardEvent) => {
      console.log('onKeyDown', event.code)
      switch (event.code) {
        case 'ArrowUp':
        case 'KeyW':
          this.isMovingForward = true
          break

        case 'ArrowLeft':
        case 'KeyA':
          this.isMovingLeft = true
          break

        case 'ArrowDown':
        case 'KeyS':
          this.isMovingBackward = true
          break

        case 'ArrowRight':
        case 'KeyD':
          this.isMovingRight = true
          break
      }
    }

    const onKeyUp = (event: KeyboardEvent) => {
      switch (event.code) {
        case 'ArrowUp':
        case 'KeyW':
          this.isMovingForward = false
          break

        case 'ArrowLeft':
        case 'KeyA':
          this.isMovingLeft = false
          break

        case 'ArrowDown':
        case 'KeyS':
          this.isMovingBackward = false
          break

        case 'ArrowRight':
        case 'KeyD':
          this.isMovingRight = false
          break
      }
    }

    const onMouseDown = (event: MouseEvent) => {
      console.log('onMouseDown', event.button)
      if (event.button == 0) {
        this.isMovingForward = true
      }
      if (event.button == 2) {
        this.isMovingBackward = true
        event.preventDefault()
      }
    }
    const onMouseUp = (event: MouseEvent) => {
      console.log('onMouseUp', event.button)
      if (event.button == 0) {
        this.isMovingForward = false
      }
      if (event.button == 2) {
        this.isMovingBackward = false
        event.preventDefault()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('mousedown', onMouseDown)
    document.addEventListener('keyup', onKeyUp)
    document.addEventListener('mouseup', onMouseUp)
    document.addEventListener('contextmenu', (event) => event.preventDefault())
  }

  connect() {
    this.domElement.ownerDocument.addEventListener(
      'mousemove',
      this._onMouseMove
    )
    this.domElement.ownerDocument.addEventListener(
      'pointerlockchange',
      this._onPointerlockChange
    )
    this.domElement.ownerDocument.addEventListener(
      'pointerlockerror',
      this._onPointerlockError
    )
  }

  disconnect() {
    this.domElement.ownerDocument.removeEventListener(
      'mousemove',
      this._onMouseMove
    )
    this.domElement.ownerDocument.removeEventListener(
      'pointerlockchange',
      this._onPointerlockChange
    )
    this.domElement.ownerDocument.removeEventListener(
      'pointerlockerror',
      this._onPointerlockError
    )
  }

  dispose() {
    this.disconnect()
  }

  getObject() {
    // retaining this method for backward compatibility
    return this.camera
  }

  getDirection(v: THREE.Vector3) {
    return v.set(0, 0, -1).applyQuaternion(this.camera.quaternion)
  }

  moveForward(distance: number) {
    // move forward parallel to the xz-plane
    // assumes camera.up is y-up
    const camera = this.camera
    _vector.setFromMatrixColumn(camera.matrix, 0)
    _vector.crossVectors(camera.up, _vector)
    camera.position.addScaledVector(_vector, distance)
  }

  moveRight(distance: number) {
    const camera = this.camera
    _vector.setFromMatrixColumn(camera.matrix, 0)
    camera.position.addScaledVector(_vector, distance)
  }

  lock() {
    this.domElement.requestPointerLock()
  }

  unlock() {
    this.domElement.ownerDocument.exitPointerLock()
  }

  onMouseMove(event: MouseEvent) {
    if (this.isLocked === false) return

    const movementX = event.movementX || 0
    const movementY = event.movementY || 0

    const camera = this.camera
    this._euler.setFromQuaternion(camera.quaternion)
    this._euler.y -= movementX * 0.002 * this.pointerSpeed
    this._euler.x -= movementY * 0.002 * this.pointerSpeed
    this._euler.x = Math.max(
      _PI_2 - this.maxPolarAngle,
      Math.min(_PI_2 - this.minPolarAngle, this._euler.x)
    )

    camera.quaternion.setFromEuler(this._euler)

    this.dispatchEvent(_changeEvent)
  }

  onPointerlockChange() {
    if (this.domElement.ownerDocument.pointerLockElement === this.domElement) {
      this.dispatchEvent(_lockEvent)
      this.isLocked = true
    } else {
      this.dispatchEvent(_unlockEvent)
      this.isLocked = false
    }
  }

  onPointerlockError() {
    console.error('THREE.PointerLockControls: Unable to use Pointer Lock API')
  }

  update(delta: number) {
    if (this.isMovingForward) {
      this.moveForward(delta * this.movementSpeed)
      console.log('moveForward', delta, this.movementSpeed)
    }
    if (this.isMovingBackward) {
      this.moveForward(-delta * this.movementSpeed)
    }
    if (this.isMovingLeft) {
      this.moveRight(-delta * this.movementSpeed)
    }
    if (this.isMovingRight) {
      this.moveRight(delta * this.movementSpeed)
    }
  }
}
