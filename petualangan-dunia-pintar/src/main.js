import "./styles/designSystem.css";
import Phaser from "phaser";
import { GAME_CONFIG } from "./config/gameConfig.js";
import { BootScene } from "./scenes/BootScene.js";
import { TreasureExplorerScene } from "./scenes/TreasureExplorerScene.js";
import { AdventureScene } from "./scenes/AdventureScene.js";
import { SurvivalArenaScene } from "./scenes/SurvivalArenaScene.js";
import { CarRacingScene } from "./scenes/CarRacingScene.js";
import { MazeAdventureScene } from "./scenes/MazeAdventureScene.js";
import { DuelScene } from "./scenes/DuelScene.js";
import { BattleArenaScene } from "./scenes/BattleArenaScene.js";
import { uiManager } from "./systems/UIManager.js";
import { ForestClimbScene } from "./scenes/ForestClimbScene.js";
import { OceanExplorerScene } from "./scenes/OceanExplorerScene.js";
import { LavaAdventureScene } from "./scenes/LavaAdventureScene.js";

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
    scene: [
      BootScene,
      ForestClimbScene,
      OceanExplorerScene,
      LavaAdventureScene,
      TreasureExplorerScene,
      AdventureScene,
      SurvivalArenaScene,
      CarRacingScene,
      MazeAdventureScene,
      DuelScene,
      BattleArenaScene,
    ],
  };

  const game = new Phaser.Game(phaserConfig);
  await uiManager.init(game);
});
