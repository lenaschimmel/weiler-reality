import * as THREE from 'three'
import { Engine } from '../engine/Engine'
import { XRControllerModelFactory } from 'three/examples/jsm/webxr/XRControllerModelFactory.js'
import { Raycaster } from 'three'

export class Teleporter {
  marker: THREE.Mesh
  floor: THREE.Mesh
  intersection: THREE.Vector3 | undefined
  isSelecting: Array<boolean> = []
  baseReferenceSpace: XRReferenceSpace | null | undefined
  raycaster = new Raycaster()

  constructor(private engine: Engine) {
    // Marker for teleportation
    this.marker = new THREE.Mesh(
      new THREE.CircleGeometry(0.25, 32).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({ color: 0x808080 })
    )
    this.engine.scene.add(this.marker)

    // Floor is where you can teleport
    this.floor = new THREE.Mesh(
      new THREE.PlaneGeometry(4.8, 8.8, 2, 2)
        .rotateX(-Math.PI / 2)
        .translate(0, -0.03, 0),
      new THREE.MeshBasicMaterial({
        color: 0x808080,
        transparent: true,
        opacity: 0.05,
      })
    )
    this.engine.scene.add(this.floor)

    const controllerModelFactory = new XRControllerModelFactory()
    let controllers: Array<THREE.Group> = []
    let controllerGrips = []
    for (let i = 0; i < 2; i++) {
      let targetRayGroup: THREE.Group = this.engine.xr!.getController(i)
      targetRayGroup.addEventListener('selectstart', () => {
        this.isSelecting[i] = true
      })
      targetRayGroup.addEventListener('selectend', () => {
        this.isSelecting[i] = false

        if (this.intersection) {
          const offsetPosition = {
            x: -this.intersection.x,
            y: -this.intersection.y,
            z: -this.intersection.z,
            w: 1,
          }
          const offsetRotation = new THREE.Quaternion()
          const transform = new XRRigidTransform(offsetPosition, offsetRotation)
          const teleportSpaceOffset =
            this.baseReferenceSpace!.getOffsetReferenceSpace(transform)

          this.engine.xr!.setReferenceSpace(teleportSpaceOffset)
        }
      })
      targetRayGroup.addEventListener('connected', (event) => {
        targetRayGroup.add(this.buildController(event.data)!)
      })
      targetRayGroup.addEventListener('disconnected', () => {
        targetRayGroup.remove(targetRayGroup.children[0])
      })
      this.engine.scene.add(targetRayGroup)
      controllers[i] = targetRayGroup

      // The XRControllerModelFactory will automatically fetch controller models
      // that match what the user is holding as closely as possible. The models
      // should be attached to the object returned from getControllerGrip in
      // order to match the orientation of the held device.
      controllerGrips[i] = this.engine.xr!.getControllerGrip(i)
      controllerGrips[i].add(
        controllerModelFactory.createControllerModel(controllerGrips[i])
      )
      this.engine.scene.add(controllerGrips[i])
    }

    this.engine.renderEngine.addRenderCallback(
      (time: DOMHighResTimeStamp, _frame: XRFrame) => {
        this.intersection = undefined
        const tempMatrix = new THREE.Matrix4()
        for (let i = 0; i < 2; i++) {
          if (this.isSelecting[i] === true) {
            tempMatrix.identity().extractRotation(controllers[i].matrixWorld)

            this.raycaster.ray.origin.setFromMatrixPosition(
              controllers[i].matrixWorld
            )
            this.raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix)
            const intersects = this.raycaster.intersectObjects([this.floor])

            if (intersects.length > 0) {
              this.intersection = intersects[0].point
            }
          }
        }

        if (this.intersection) {
          this.marker.position.copy(this.intersection)
        }
        this.marker.visible = this.intersection !== undefined

        // THIS IS WHERE THE VR RENDERING TAKES PLACE
        this.engine.renderEngine.render(time)
      }
    )
  }

  buildController(data: any): THREE.Object3D | undefined {
    let geometry, material

    switch (data.targetRayMode) {
      case 'tracked-pointer':
        geometry = new THREE.BufferGeometry()
        geometry.setAttribute(
          'position',
          new THREE.Float32BufferAttribute([0, 0, 0, 0, 0, -1], 3)
        )
        geometry.setAttribute(
          'color',
          new THREE.Float32BufferAttribute([0.5, 0.5, 0.5, 0, 0, 0], 3)
        )

        material = new THREE.LineBasicMaterial({
          vertexColors: true,
          blending: THREE.AdditiveBlending,
        })

        return new THREE.Line(geometry, material)

      case 'gaze':
        geometry = new THREE.RingGeometry(0.02, 0.04, 32).translate(0, 0, -1)
        material = new THREE.MeshBasicMaterial({
          opacity: 0.5,
          transparent: true,
        })
        return new THREE.Mesh(geometry, material)
    }
    return undefined
  }
}
