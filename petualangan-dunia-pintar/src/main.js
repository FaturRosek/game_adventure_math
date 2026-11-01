import Phaser from "phaser";
import { GAME_CONFIG } from "./config/gameConfig.js";
import { BootScene } from "./scenes/BootScene.js";
import { AdventureScene } from "./scenes/AdventureScene.js";
import { DuelScene } from "./scenes/DuelScene.js";
import { uiManager } from "./systems/UIManager.js";

window.addEventListener("DOMContentLoaded", async () => {
  const phaserConfig = {
    type: Phaser.AUTO,
    parent: "phaser-container",
    width: GAME_CONFIG.width,
    height: GAME_CONFIG.height,
    backgroundColor: "#56ccf2",
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    physics: {
      default: "arcade",
      arcade: {
        gravity: { y: GAME_CONFIG.gravityY },
        debug: false,
      },
    },
    scene: [BootScene, AdventureScene, DuelScene],
  };

  const game = new Phaser.Game(phaserConfig);
  await uiManager.init(game);
});
