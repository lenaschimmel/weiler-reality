import { WebGLRenderer } from 'three'
import { Engine } from './Engine'
import * as THREE from 'three'
import { GameEntity } from './GameEntity'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass'
import { AdaptiveToneMappingPass } from 'three/examples/jsm/postprocessing/AdaptiveToneMappingPass'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass'
//import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass'
import { GammaCorrectionShader } from 'three/examples/jsm/shaders/GammaCorrectionShader.js'

export class RenderEngine implements GameEntity {
  public readonly renderer: WebGLRenderer
  composer: EffectComposer
  dynamicHdrEffectComposer: EffectComposer
  //bloomPass: UnrealBloomPass

  constructor(private engine: Engine) {
    const canvas = this.engine.canvas
    canvas.getContext('webgl2')?.getExtension('EXT_float_blend')
    this.renderer = new WebGLRenderer({
      canvas: canvas,
      antialias: true,
    })

    this.renderer.physicallyCorrectLights = true
    this.renderer.outputEncoding = THREE.LinearEncoding
    this.renderer.toneMapping = THREE.LinearToneMapping
    this.renderer.toneMappingExposure = 1.0
    this.renderer.setClearColor('#000000')
    this.renderer.setSize(this.engine.sizes.width, this.engine.sizes.height)
    this.renderer.setPixelRatio(Math.min(this.engine.sizes.pixelRatio, 2))

    this.composer = new EffectComposer(this.renderer)

    const renderPass = new RenderPass(
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

    this.dynamicHdrEffectComposer.addPass(renderPass)
    this.dynamicHdrEffectComposer.addPass(adaptToneMappingPass)
    this.dynamicHdrEffectComposer.addPass(gammaCorrectionPass)
    //this.dynamicHdrEffectComposer.addPass( this.bloomPass );
  }

  update(delta: number) {
    this.composer.render()
    this.dynamicHdrEffectComposer.render(delta)
  }

  resize() {
    this.renderer.setSize(this.engine.sizes.width, this.engine.sizes.height)
    this.composer.setSize(this.engine.sizes.width, this.engine.sizes.height)
    this.composer.render()
  }

  getXr(): THREE.WebXRManager {
    return this.renderer.xr
  }

  addRenderCallback(callback: XRFrameRequestCallback) {
    this.renderer.setAnimationLoop(callback)
  }
}
