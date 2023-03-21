import './style.scss'
import { Engine } from './engine/Engine'
import { Room } from './room/Room'

new Engine({
  canvas: document.querySelector('#canvas') as HTMLCanvasElement,
  experience: Room,
  info: {
    twitter: 'https://twitter.com/maya_ndljk',
    github: 'https://github.com/mayacoda/simple-threejs-typescript-starter',
    description: 'Ausbauwohnung 61,3m²',
    documentTitle: 'WR - Weiler Reality',
    title: 'Weiler Reality',
  },
})
