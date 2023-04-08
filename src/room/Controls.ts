import { Engine } from '../engine/Engine'
import { DeviceOrientationControls } from './DeviceOrientationControls'
import { RelativeControls } from './RelativeControls'

import { Teleporter } from './Teleporter'
import { VRButton } from './VRButton'

export class Controls {
  private deviceOrientationControls: DeviceOrientationControls
  private relativeControls!: RelativeControls

  teleporter: Teleporter | undefined
  vrButton?: VRButton

  constructor(private engine: Engine) {
    this.deviceOrientationControls = new DeviceOrientationControls(
      this.engine.camera.instance
    )

    this.relativeControls = new RelativeControls(
      this.engine.camera.instance,
      this.engine.canvas
    )
    this.engine.xr!.addEventListener('sessionstart', () => {
      this.teleporter = new Teleporter(this.engine)
      this.teleporter.baseReferenceSpace = this.engine.xr.getReferenceSpace()
      this.deviceOrientationControls.disconnect()
    })

    this.initButtons()
  }

  initButtons() {
    document
      .getElementById('buttonAccelerometer')
      ?.addEventListener('click', () => {
        this.deviceOrientationControls.toggle()
      })

    document.getElementById('buttonMouse')?.addEventListener('click', () => {
      this.relativeControls.lock()
    })

    this.vrButton = new VRButton(
      this.engine.renderEngine.renderer,
      document.getElementById('buttonVirtualReality')! as HTMLButtonElement
    )
  }

  update(delta: number) {
    this.deviceOrientationControls.update()
    this.relativeControls.update(delta)
  }
}
