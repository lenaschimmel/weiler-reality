import { WebGLRenderer } from 'three'
import { Engine } from './Engine'
import * as THREE from 'three'
import { GameEntity } from './GameEntity'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass'
import { AdaptiveToneMappingPass } from 'three/examples/jsm/postprocessing/AdaptiveToneMappingPass'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass'
import { GammaCorrectionShader } from 'three/examples/jsm/shaders/GammaCorrectionShader.js'

export class RenderEngine implements GameEntity {
  public readonly renderer: WebGLRenderer
  composer!: EffectComposer
  dynamicHdrEffectComposer: EffectComposer
  renderPass: RenderPass
  width: number
  height: number
  time: number = 0
  //bloomPass: UnrealBloomPass

  constructor(private engine: Engine) {
    const canvas = this.engine.canvas
    canvas
      .getContext('webgl2', { xrCompatible: true })
      ?.getExtension('EXT_float_blend')
    this.renderer = new WebGLRenderer({
      canvas: canvas,
      antialias: true,
    })

    this.width = canvas.width
    this.height = canvas.height

    this.renderer.physicallyCorrectLights = true
    this.renderer.outputEncoding = THREE.LinearEncoding
    this.renderer.toneMapping = THREE.LinearToneMapping
    this.renderer.toneMappingExposure = 1.0
    this.renderer.setClearColor('#000000')
    this.renderer.setSize(this.engine.sizes.width, this.engine.sizes.height)
    this.renderer.setPixelRatio(Math.min(this.engine.sizes.pixelRatio, 2))

    this.composer = new EffectComposer(this.renderer)

    this.renderPass = new RenderPass(
      this.engine.scene,
      this.engine.camera.instance
    )
    const hdrRenderTarget = new THREE.WebGLRenderTarget(
      this.engine.sizes.width,
      this.engine.sizes.height,
      {
        type: THREE.FloatType,
      }
    )
    this.dynamicHdrEffectComposer = new EffectComposer(
      this.renderer,
      hdrRenderTarget
    )
    this.dynamicHdrEffectComposer.setSize(window.innerWidth, window.innerHeight)

    const adaptToneMappingPass = new AdaptiveToneMappingPass(true, 256)
    adaptToneMappingPass.setAdaptionRate(0.85)
    adaptToneMappingPass.setAverageLuminance(0.4)
    adaptToneMappingPass.setMaxLuminance(0.9)
    adaptToneMappingPass.setMinLuminance(0.01)
    adaptToneMappingPass.setMiddleGrey(0.09)
    adaptToneMappingPass.needsSwap = true
    const gammaCorrectionPass = new ShaderPass(GammaCorrectionShader)

    //this.bloomPass = new UnrealBloomPass(undefined, 0.3, 0.06, 1.01);

    this.dynamicHdrEffectComposer.addPass(this.renderPass)
    this.dynamicHdrEffectComposer.addPass(adaptToneMappingPass)
    this.dynamicHdrEffectComposer.addPass(gammaCorrectionPass)
  }

  update(delta: number) {
    // THIS LINE works in "inline" and "vr" mode, but does not adjust brightness
    this.render(delta)

    // THOSE LINES adjust brightness in "inline", but remove all geometry except
    // the skybox in "vr" mode
    //this.composer.render()
    //this.dynamicHdrEffectComposer.render(delta)
    this.time += delta
    const multi = Math.sin(this.time / 1) * 20 + 25
    console.log(multi)
    this.engine.scene.traverse((obj) => {
      let mesh = obj as THREE.Mesh
      if (Array.isArray(mesh.material)) {
        let matArray = mesh.material as Array<THREE.Material>
        for (let i = 0; i < matArray.length; i++) {
          ;(matArray[i] as THREE.MeshPhysicalMaterial).lightMapIntensity = multi
        }
      } else if (mesh.material != null) {
        ;(mesh.material as THREE.MeshPhysicalMaterial).lightMapIntensity = multi
      }
    })
  }

  render(delta: number) {
    const gl = this.renderer
    const camera = this.engine.camera.instance

    // If not in session, render normally
    if (!gl.xr.isPresenting) {
      return this.renderer.render(this.engine.scene, camera)
    }

    // Manually handle XR
    //gl.xr.enabled = false

    // Update camera with XRPose
    gl.xr.updateCamera(camera)

    // Render stereo cameras
    const { cameras } = gl.xr.getCamera()

    cameras.forEach(({ viewport, matrixWorld, projectionMatrix }) => {
      gl.setViewport(viewport)
      camera.position.setFromMatrixPosition(matrixWorld)
      camera.projectionMatrix.copy(projectionMatrix)

      this.composer.render(delta)
      this.renderer.render(this.engine.scene, camera)
    })

    // Reset
    gl.setViewport(0, 0, this.width, this.height)
    gl.xr.updateCamera(camera)
    //gl.xr.enabled = true
  }

  resize() {
    this.width = this.engine.sizes.width
    this.height = this.engine.sizes.height
    this.renderer.setSize(this.width, this.height)
  }

  getXr(): THREE.WebXRManager {
    return this.renderer.xr
  }

  addRenderCallback(callback: XRFrameRequestCallback) {
    this.renderer.setAnimationLoop(callback)
  }
}
