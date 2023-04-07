/**
 * @author richt / http://richt.me
 * @author WestLangley / http://github.com/WestLangley
 *
 * W3C Device Orientation control (http://w3c.github.io/deviceorientation/spec-source-orientation.html)
 */

// based on http://richtr.github.io/three.js/examples/js/controls/DeviceOrientationControls.js
// This was no longer maintained because the used API is deprecated, but the original example still
// worked on a current Android device. I updated this to Typescript with classes, but did not (yet)
// change any internals.
import * as THREE from 'three'

export class DeviceOrientationControls {
  private object: THREE.Object3D

  private enabled: boolean = true

  private deviceOrientation: any = {}
  private screenOrientation: number = 0

  //private alpha: number = 0;
  private alphaOffsetAngle: number = 0

  private zee: THREE.Vector3
  private euler: THREE.Euler
  private q0: THREE.Quaternion
  private q1: THREE.Quaternion

  constructor(object: THREE.Object3D) {
    this.object = object
    this.object.rotation.reorder('YXZ')

    this.zee = new THREE.Vector3(0, 0, 1)
    this.euler = new THREE.Euler()
    this.q0 = new THREE.Quaternion()
    this.q1 = new THREE.Quaternion(-Math.sqrt(0.5), 0, 0, Math.sqrt(0.5)) // - PI/2 around the x-axis

    this.connect()
  }

  public onDeviceOrientationChangeEvent(event: any) {
    this.deviceOrientation = event
  }

  public onScreenOrientationChangeEvent() {
    this.screenOrientation = window.orientation || 0
  }

  // The angles alpha, beta and gamma form a set of intrinsic Tait-Bryan angles of type Z-X'-Y''
  public setObjectQuaternion(
    quaternion: THREE.Quaternion,
    alpha: number,
    beta: number,
    gamma: number,
    orient: number
  ) {
    this.euler.set(beta, alpha, -gamma, 'YXZ') // 'ZXY' for the device, but 'YXZ' for us
    quaternion.setFromEuler(this.euler) // orient the device
    quaternion.multiply(this.q1) // camera looks out the back of the device, not the top
    quaternion.multiply(this.q0.setFromAxisAngle(this.zee, -orient)) // adjust for screen orientation
  }

  public connect() {
    this.onScreenOrientationChangeEvent() // run once on load

    window.addEventListener(
      'orientationchange',
      () => this.onScreenOrientationChangeEvent(),
      false
    )
    window.addEventListener(
      'deviceorientation',
      (e) => this.onDeviceOrientationChangeEvent(e),
      false
    )

    this.enabled = true
  }

  public disconnect() {
    window.removeEventListener(
      'orientationchange',
      this.onScreenOrientationChangeEvent,
      false
    )
    window.removeEventListener(
      'deviceorientation',
      this.onDeviceOrientationChangeEvent,
      false
    )

    this.enabled = false
  }

  public update() {
    if (this.enabled === false) return

    var alpha = this.deviceOrientation.alpha
      ? THREE.MathUtils.degToRad(this.deviceOrientation.alpha) +
        this.alphaOffsetAngle
      : 0 // Z
    var beta = this.deviceOrientation.beta
      ? THREE.MathUtils.degToRad(this.deviceOrientation.beta)
      : 0 // X'
    var gamma = this.deviceOrientation.gamma
      ? THREE.MathUtils.degToRad(this.deviceOrientation.gamma)
      : 0 // Y''
    var orient = this.screenOrientation
      ? THREE.MathUtils.degToRad(this.screenOrientation)
      : 0 // O

    this.setObjectQuaternion(this.object.quaternion, alpha, beta, gamma, orient)
    //this.alpha = alpha;
  }

  public updateAlphaOffsetAngle(angle: number) {
    this.alphaOffsetAngle = angle
    this.update()
  }

  public dispose() {
    this.disconnect()
  }
}
