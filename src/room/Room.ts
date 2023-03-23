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
  envMap: THREE.Texture | undefined

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
    // Construct an actual sphere that we use for rendering the background.
    // We will also use the same texture as envMap for reflections on materials.
    const skyGeometry = new THREE.SphereGeometry(500, 60, 40)
    // invert the geometry on the x-axis so that all of the faces point inward
    skyGeometry.scale(-1, 1, 1)

    this.envMap = new THREE.TextureLoader().load('/wr/pano.jpg')
    this.envMap.encoding = THREE.sRGBEncoding
    this.envMap.mapping = THREE.EquirectangularReflectionMapping
    const material = new THREE.MeshBasicMaterial({ map: this.envMap })

    const mesh = new THREE.Mesh(skyGeometry, material)

    this.engine.scene.add(mesh)
  }

  loadScene() {
    const gltfLoader = new GLTFLoader()
    gltfLoader.load('/wr/gltf/BakeTest.gltf', (gltf) => {
      const root = gltf.scene

      // SimpleBake adds a copy of each object with fully baked textures (containing
      // combined base texture and lighting), which is the inferior approach to visualization.
      // We do not use or need it, so let's collect them and then remove them from the scene.
      const toRemove: Array<THREE.Object3D> = []

      // For each object that we don't want to remove, upgrade the material to use the proper
      // textures for lighting and reflection.
      root.traverse((object: THREE.Object3D) => {
        if (object.name.endsWith('_Baked')) {
          toRemove.push(object)
        } else if (object.type == 'Mesh') {
          let mesh = object as THREE.Mesh

          // material may be a single object or an array (ough, what an ugly API decision!)
          // and we will definitely have meshed with multiple materials in our room model.
          if (Array.isArray(mesh.material)) {
            let matArray = mesh.material as Array<THREE.Material>
            for (const mat of matArray) {
              this.upgradeMaterial(mat as THREE.Material, object.name)
            }
          } else {
            mesh.material = this.upgradeMaterial(
              mesh.material as THREE.Material,
              object.name
            )
          }
        }
      })

      root.remove(...toRemove)

      // needed to bring the room down from absolute position (about
      // 70m above sea level) to local position. Not needed for other demos.
      //root.translateY(-71.369 + 2.18)

      this.engine.scene.add(root)
    })
  }

  // Makes a copy of the given material if it is a MeshStandardMaterial,
  // adds lightMap, envMap, aoMap and returns it. Remember to assign it to
  // the object afterwards.
  upgradeMaterial(mat: THREE.Material, name: string): THREE.Material {
    // Many material types have the needed attributes (lightMap, envMap, aoMap) but the base class
    // doesn't, and there is no common super class which has it.
    // I think that all objects will have a MeshStandardMaterial, but if we ever encounter
    // another type, we have to find a better way than this casting:

    if (mat.type == 'MeshStandardMaterial') {
      // In the original model, multiple objects may share the same material.
      // But since each object has its own lightmap, each needs its own material as well.
      const stdMat = mat.clone() as THREE.MeshStandardMaterial

      // The names of textures are constructed from the object name.
      // Since the integrated de-noising does not work, we use ImageMagick via a shell script, which adds
      // "_denoise" to the name.
      const textureLightmap = new THREE.TextureLoader().load(
        'gltf/' + name + '_Bake1_PBR_Lightmap_denoise.jpg'
      )
      textureLightmap.flipY = false
      stdMat.lightMap = textureLightmap
      stdMat.lightMapIntensity = 1.2
      stdMat.envMap = this.envMap!

      const textureAO = new THREE.TextureLoader().load(
        'gltf/' + name + '_Bake1_PBR_Ambient_Occlusion_denoise.jpg'
      )
      textureAO.flipY = false
      stdMat.aoMap = textureAO

      return stdMat
    } else {
      console.log('Unsupported material type: ', mat.type)
    }
    return mat
  }
}
