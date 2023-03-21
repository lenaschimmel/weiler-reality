import { Engine } from '../engine/Engine'
import * as THREE from 'three'
import { Experience } from '../engine/Experience'
import { Resource } from '../engine/Resources'
import { Teleporter } from './Teleporter'
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'

export class Room implements Experience {
  resources: Resource[] = []
  teleporter: Teleporter | undefined

  constructor(private engine: Engine) {}

  init() {
    this.initSkySphere()

    this.engine.xr!.addEventListener('sessionstart', () => {
      this.teleporter = new Teleporter(this.engine)
      this.teleporter.baseReferenceSpace = this.engine.xr.getReferenceSpace()
    })
    this.engine.xr.enabled = true

    this.loadScene()

    document.body.appendChild(
      VRButton.createButton(this.engine.renderEngine.renderer)
    )
  }

  resize() {}

  update() {}

  initSkySphere() {
    const skyGeometry = new THREE.SphereGeometry(500, 60, 40)
    // invert the geometry on the x-axis so that all of the faces point inward
    skyGeometry.scale(-1, 1, 1)
    //skyGeometry.rotateY(-THREE.MathUtils.degToRad(90.0 - 20.43));

    const texture = new THREE.TextureLoader().load('/wr/pano.jpg')
    texture.encoding = THREE.sRGBEncoding
    const material = new THREE.MeshBasicMaterial({ map: texture })

    const mesh = new THREE.Mesh(skyGeometry, material)

    this.engine.scene.add(mesh)
  }

  loadScene() {
    const gltfLoader = new GLTFLoader()
    gltfLoader.load('/wr/gltf/Room2new.glb', (gltf) => {
      const root = gltf.scene
      root.translateY(-71.369 + 2.18)
      this.engine.scene.add(root)
    })
  }
}
