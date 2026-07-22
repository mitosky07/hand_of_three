import Phaser from 'phaser'
import './style.css'

class EmptyScene extends Phaser.Scene {
  constructor() {
    super('EmptyScene')
  }
}

new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'app',
  width: 1280,
  height: 720,
  backgroundColor: '#1a1a1a',
  scene: EmptyScene,
})
