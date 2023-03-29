import { WebGLRenderer } from 'three'
import { Engine } from './Engine'
import * as THREE from 'three'
import { GameEntity } from './GameEntity'

const minLight = 0.5
const maxLight = 3.0
const startLight = 1.3

export class RenderEngine implements GameEntity {
  public readonly renderer: WebGLRenderer

  public light: number = startLight

  offscreenCanvas: HTMLCanvasElement

  constructor(private engine: Engine) {
    const canvas = this.engine.canvas
    const context = canvas.getContext('webgl2')
    context?.getExtension('EXT_float_blend')

    this.offscreenCanvas = document.createElement('canvas')
    this.offscreenCanvas.width = 10
    this.offscreenCanvas.height = 10

    this.renderer = new WebGLRenderer({
      canvas: canvas,
      antialias: true,
    })

    this.renderer.physicallyCorrectLights = true
    this.renderer.outputEncoding = THREE.LinearEncoding
    this.renderer.toneMapping = THREE.LinearToneMapping
    this.renderer.toneMappingExposure = 5.0
    this.renderer.setClearColor('#000000')
    this.renderer.setSize(this.engine.sizes.width, this.engine.sizes.height)
    this.renderer.setPixelRatio(Math.min(this.engine.sizes.pixelRatio, 2))
  }

  update(delta: number) {
    const canvas = this.engine.canvas
    this.renderer.render(this.engine.scene, this.engine.camera.instance)
    this.renderer.toneMappingExposure = this.light

    // We need to copy the 3d canvas to a 2d canvas, and then read the 2d canvas.
    // This was after I tried an hour without the extra canvas, but then
    // I found https://stackoverflow.com/a/40390638/39946
    var ctx = this.offscreenCanvas.getContext('2d')!
    const border = 0.3
    ctx.drawImage(
      canvas,
      canvas.width * border,
      canvas.height * 0.3,
      canvas.width * (1 - 2 * border),
      canvas.height * (1 - 2 * border),
      0,
      0,
      10,
      10
    )
    var imageData = ctx.getImageData(0, 0, 10, 10)
    // The advantage is that we can scale the full frame to a smaller off-screen canvas during the copy, and then
    // only need to process a few pixels. I ignore a wide border of 30% width and just copy the center.

    let sum = 0
    const d = imageData.data
    for (let i = 0; i < 100; i++) {
      const base = i * 4
      const lum =
        0.2126 * d[base + 0] + 0.7152 * d[base + 1] + 0.0722 * d[base + 2]
      sum += lum
    }
    const avg = sum / (100 * 255)
    const target = 0.25

    const fact =
      1.0 + THREE.MathUtils.clamp((target - avg) * delta * 2, -0.1, 0.1)

    console.log('avg: ' + avg + ' -> fact: ' + fact + ', light: ' + this.light)

    this.light = THREE.MathUtils.clamp(this.light * fact, minLight, maxLight)
  }

  resize() {
    this.renderer.setSize(this.engine.sizes.width, this.engine.sizes.height)
  }

  getXr(): THREE.WebXRManager {
    return this.renderer.xr
  }

  addRenderCallback(callback: XRFrameRequestCallback) {
    this.renderer.setAnimationLoop(callback)
  }
}
