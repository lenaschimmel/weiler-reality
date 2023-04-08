import { WebGLRenderer } from 'three'

class VRButton {
  private currentSession: XRSession | null = null
  private renderer: WebGLRenderer
  private button: HTMLButtonElement | null = null
  private xrSessionIsGranted: boolean = false

  constructor(renderer: WebGLRenderer, button: HTMLButtonElement) {
    this.renderer = renderer
    this.button = button

    if ('xr' in navigator) {
      navigator.xr
        ?.isSessionSupported('immersive-vr')
        .then((supported) => {
          supported ? this.showEnterVR() : this.showWebXRNotFound()
          if (supported && this.xrSessionIsGranted) {
            this.button?.click()
          }
        })
        .catch((e) => {
          this.showVRNotAllowed(e)
        })
    }

    this.xrSessionIsGranted = false
    this.registerSessionGrantedListener()
  }

  showEnterVR() {
    this.button!.textContent = 'ENTER VR'

    this.button!.onclick = () => {
      if (this.currentSession === null) {
        // WebXR's requestReferenceSpace only works if the corresponding feature
        // was requested at session creation time. For simplicity, just ask for
        // the interesting ones as optional features, but be aware that the
        // requestReferenceSpace call will fail if it turns out to be unavailable.
        // ('local' is always available for immersive sessions and doesn't need to
        // be requested separately.)

        const sessionInit = {
          optionalFeatures: [
            'local-floor',
            'bounded-floor',
            'hand-tracking',
            'layers',
          ],
        }
        navigator.xr
          ?.requestSession('immersive-vr', sessionInit)
          .then((session) => {
            this.onSessionStarted(session)
            return
          })
      } else {
        this.currentSession.end()
      }
    }
  }

  async onSessionStarted(session: XRSession) {
    session.addEventListener('end', () => this.onSessionEnded())
    await this.renderer.xr?.setSession(session)
    this.button!.textContent = 'EXIT VR'
    this.currentSession = session
  }

  onSessionEnded(/*event*/) {
    //this.currentSession?.removeEventListener( 'end', onSessionEnded );

    this.button!.textContent = 'ENTER VR'
    this.currentSession = null
  }

  disableButton() {
    this.button!.onclick = null
  }

  showWebXRNotFound() {
    this.disableButton()
    this.button!.textContent = 'VR NOT SUPPORTED'
  }

  showVRNotAllowed(exception: any) {
    this.disableButton()
    console.warn(
      'Exception when trying to call xr.isSessionSupported',
      exception
    )
    this.button!.textContent = 'VR NOT ALLOWED'
  }

  registerSessionGrantedListener() {
    if ('xr' in navigator) {
      // WebXRViewer (based on Firefox) has a bug where addEventListener
      // throws a silent exception and aborts execution entirely.
      if (/WebXRViewer\//i.test(navigator.userAgent)) return

      navigator.xr?.addEventListener('sessiongranted', () => {
        this.xrSessionIsGranted = true
      })
    }
  }
}

export { VRButton }
