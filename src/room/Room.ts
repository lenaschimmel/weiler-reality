import { Engine } from '../engine/Engine'
import * as THREE from 'three'
import { Experience } from '../engine/Experience'
import { Resource } from '../engine/Resources'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { EXRLoader } from 'three/examples/jsm/loaders/EXRLoader'
import { Controls } from './Controls'

export class Room implements Experience {
  resources: Resource[] = []
  envMap: THREE.Texture | undefined
  lightmaps: Map<string, Promise<THREE.DataTexture>> = new Map()
  controls?: Controls

  // TODO use vite env vars to set this according to build mode
  // TODO understand why this is a thing at all, we use /wr in the URL in both modes anyway!
  prefix = '/wr/'
  //prefix = '';

  constructor(private engine: Engine) {}

  init() {
    this.initSkySphere()
    // This does not only load the scene, it also applies several changes
    this.loadScene()
    this.engine.xr.enabled = true
    this.controls = new Controls(this.engine)
    // document.body.appendChild(
    //   VRButton.createButton(this.engine.renderEngine.renderer)
    // )
  }

  resize() {}

  update(delta: number) {
    this.controls?.update(delta)
  }

  initSkySphere() {
    const pmremGenerator = new THREE.PMREMGenerator(
      this.engine.renderEngine.renderer
    )
    pmremGenerator.compileEquirectangularShader()
    new EXRLoader().load('/wr/gltf/pano_spring_dwab.exr', (texture) => {
      //new THREE.TextureLoader().load('/wr/gltf/pano_spring.png', (texture) => {
      texture.mapping = THREE.EquirectangularReflectionMapping
      texture.encoding = THREE.LinearEncoding
      pmremGenerator.fromEquirectangular(texture)
      this.envMap = texture

      // Construct an actual sphere that we use for rendering the background.
      // We will also use the same texture as envMap for reflections on materials.
      const skyGeometry = new THREE.SphereGeometry(500, 60, 40)
      // invert the geometry on the x-axis so that all of the faces point inward
      skyGeometry.scale(-1, 1, 1)
      skyGeometry.rotateY(THREE.MathUtils.degToRad(180))

      const material = new THREE.MeshBasicMaterial({ map: this.envMap })
      material.color = new THREE.Color(0x888888)

      const mesh = new THREE.Mesh(skyGeometry, material)

      this.engine.scene.add(mesh)
    })
  }

  loadScene() {
    const gltfLoader = new GLTFLoader()
    gltfLoader.load('/wr/gltf/Room2.gltf', (gltf) => {
      const root = gltf.scene

      // this.logObjectTree(root)

      // SimpleBake adds a copy of each object with fully baked textures (containing
      // combined base texture and lighting), which is the inferior approach to visualization.
      // We do not use or need it, so let's collect them and then remove them from the scene.
      const toRemove: Array<THREE.Object3D> = []

      // For each object that we don't want to remove, upgrade the material to use the proper
      // textures for lighting and reflection.
      this.convertObject(root, toRemove)

      for (const obj of toRemove) {
        console.log('Removing: ', obj.name)
      }
      root.remove(...toRemove)

      // needed to bring the room down from absolute position (about
      // 70m above sea level) to local position. Not needed for other demos.
      root.translateY(-71.369 + 2.18)

      this.engine.scene.add(root)
    })
  }

  logObjectTree(object: THREE.Object3D): void {
    if (object.type == 'Group') {
      console.group('Group: ' + object.name)
      for (const child of object.children) {
        this.logObjectTree(child)
      }
      console.groupEnd()
    } else {
      console.log(object.type + ': ' + object.name)
    }
  }

  convertObject(object: THREE.Object3D, toRemove: Array<THREE.Object3D>): void {
    // Step down into groups recursively
    if (object.type == 'Group') {
      for (const child of object.children) {
        this.convertObject(child, toRemove)
      }
    } else {
      if (object.name.endsWith('_Baked') || object.type != 'Mesh') {
        toRemove.push(object)
        return
      }

      let mesh = object as THREE.Mesh
      let name = object.name
      // Exporting with SimpleBake will create Groups from single objects with multiple materials, and may append numbers
      // to the mesh name. We need the original mesh name to find the generated maps which are shared by all new objects.
      if (object.parent?.name != 'Scene') {
        name = object.parent?.name || name
      }

      if (['Leucht', 'Spiegel'].includes(name)) {
        // Nothing to do in those simple materials now
        return
      }

      // material may be a single object or an array (ough, what an ugly API decision!)
      // and we will definitely have meshes with multiple materials in our room model.
      if (Array.isArray(mesh.material)) {
        let matArray = mesh.material as Array<THREE.Material>
        for (let i = 0; i < matArray.length; i++) {
          matArray[i] = this.upgradeMaterial(
            matArray[i] as THREE.Material,
            name
          )
        }
      } else {
        mesh.material = this.upgradeMaterial(
          mesh.material as THREE.Material,
          name
        )
      }
    }
  }

  // Makes a copy of the given material if it is a MeshStandardMaterial,
  // adds lightMap, envMap, aoMap and returns it. Remember to assign it to
  // the object afterwards.
  upgradeMaterial(mat: THREE.Material, name: string): THREE.Material {
    // Many material types have the needed attributes (lightMap, envMap, aoMap) but the base class
    // doesn't, and there is no common super class which has it. So we support a limited set of materials.
    let castedMat: THREE.MeshPhysicalMaterial | THREE.MeshStandardMaterial

    // In the original model, multiple objects may share the same material.
    // But since each object has its own lightmap, each needs its own material as well.
    if (mat.type == 'MeshStandardMaterial') {
      castedMat = new THREE.MeshPhysicalMaterial({
        ...mat,
        blendDstAlpha: 0,
        blendEquationAlpha: 0,
        blendSrcAlpha: 0,
        shadowSide: THREE.FrontSide,
      })
      // mat.clone() as THREE.MeshStandardMaterial
    } else if (mat.type == 'MeshPhysicalMaterial') {
      castedMat = mat.clone() as THREE.MeshPhysicalMaterial
    } else {
      console.log('Unsupported material type: ', mat.type, ' in object ', name)
      return mat
    }

    if (mat.name == 'Fensterglass unsichtbar') {
      return new THREE.MeshBasicMaterial({
        transparent: true,
        opacity: 0,
        envMap: this.envMap!,
      })
    }
    // console.log(name + ": converting material " + mat.name);

    let objectName = name.replace(/Mesh(_.)?/, '').replaceAll(' ', '%20')

    if (objectName.startsWith('Abstellbuegel')) {
      objectName = 'Abstellbuegel'
    }
    if (objectName.startsWith('Stuetze')) {
      objectName = 'Stuetze'
    }
    if (objectName.startsWith('LaubengangOG')) {
      objectName = 'LaubengangOG'
    }

    let lightmapName = this.prefix + '/bakes/' + objectName + '_map.exr'
    // console.log(
    //   'Prefix is ' +
    //     this.prefix +
    //     ' and constructed lightmapName is ' +
    //     lightmapName
    // )

    let lightmapTex = this.lightmaps.get(lightmapName)
    if (!lightmapTex && !lightmapName.endsWith('RaumplanMoebel_map.exr')) {
      lightmapTex = new EXRLoader().loadAsync(lightmapName)
      this.lightmaps.set(lightmapName, lightmapTex)
    }

    lightmapTex?.then((textureLightmap) => {
      textureLightmap.flipY = true
      textureLightmap.encoding = THREE.LinearEncoding
      // Lightmaps must be assigned as ao maps to work as expected!
      castedMat.aoMap = textureLightmap
      castedMat.envMap = this.envMap!
    })

    if (mat.name == 'Window Spacer Bar') {
      castedMat.metalness = 1
      castedMat.metalnessMap = null
      castedMat.roughness = 0.2
      castedMat.roughnessMap = null
      castedMat.lightMap = null
      castedMat.aoMap = null
    }

    //console.log(name + ': converted material ' + mat.name + ' to', castedMat)

    return castedMat
  }
}
