import Phaser from "phaser";
import { GAME_CONFIG } from "../config/gameConfig.js";

export class BootScene extends Phaser.Scene {
  constructor() {
    super("BootScene");
  }

  create() {
    this.generateCartoonTextures();
  }

  generateCartoonTextures() {
    const g = this.make.graphics({ x: 0, y: 0, add: false });

    GAME_CONFIG.characters.forEach((char) => {
      g.clear();
      g.fillStyle(0x2c3e50, 1);
      g.fillRoundedRect(2, 6, 48, 56, 16);
      g.fillStyle(char.color, 1);
      g.fillRoundedRect(5, 9, 42, 50, 14);
      g.fillStyle(0xfff5e6, 1);
      g.fillRoundedRect(13, 28, 26, 26, 10);
      g.fillStyle(0xffffff, 1);
      g.fillCircle(19, 21, 6);
      g.fillCircle(35, 21, 6);
      g.fillStyle(0x1e272e, 1);
      g.fillCircle(20, 21, 3);
      g.fillCircle(36, 21, 3);
      g.lineStyle(3, 0x2c3e50, 1);
      g.beginPath();
      g.arc(27, 25, 6, 0.2, Math.PI - 0.2, false);
      g.strokePath();

      g.generateTexture(`player_${char.id}`, 52, 64);
    });

    g.clear();
    g.fillStyle(0x8d5524, 1);
    g.fillRect(0, 0, 64, 64);
    g.fillStyle(0x6e421c, 1);
    g.fillCircle(16, 36, 5);
    g.fillCircle(46, 48, 6);
    g.fillCircle(32, 28, 4);
    g.fillStyle(0x2ecc71, 1);
    g.fillRect(0, 0, 64, 18);
    g.fillStyle(0x27ae60, 1);
    g.fillRect(0, 14, 64, 5);
    g.lineStyle(3, 0x1e8449, 1);
    g.strokeRect(1, 1, 62, 62);
    g.generateTexture("ground_tile", 64, 64);

    g.clear();
    g.fillStyle(0x2c3e50, 1);
    g.fillRoundedRect(0, 0, 192, 36, 12);
    g.fillStyle(0xd35400, 1);
    g.fillRoundedRect(3, 3, 186, 30, 10);
    g.fillStyle(0x2ecc71, 1);
    g.fillRoundedRect(3, 3, 186, 12, 8);
    g.generateTexture("platform_wood", 192, 36);

    g.clear();
    g.fillStyle(0x2c3e50, 1);
    g.fillCircle(18, 18, 17);
    g.fillStyle(0xf1c40f, 1);
    g.fillCircle(18, 18, 14);
    g.fillStyle(0xf39c12, 1);
    g.fillCircle(18, 18, 10);
    g.fillStyle(0xfff9db, 1);
    g.fillRect(16, 11, 4, 14);
    g.generateTexture("coin_gold", 36, 36);

    g.clear();
    g.fillStyle(0x2c3e50, 1);
    g.fillRoundedRect(0, 0, 56, 48, 8);
    g.fillStyle(0xc0392b, 1);
    g.fillRoundedRect(3, 3, 50, 42, 6);
    g.fillStyle(0xf1c40f, 1);
    g.fillRect(3, 18, 50, 8);
    g.fillRect(23, 14, 10, 16);
    g.generateTexture("chest_closed", 56, 48);

    g.clear();
    g.fillStyle(0x2c3e50, 1);
    g.fillRoundedRect(0, 10, 56, 38, 8);
    g.fillStyle(0x27ae60, 1);
    g.fillRoundedRect(3, 13, 50, 32, 6);
    g.fillStyle(0xf1c40f, 1);
    g.fillCircle(28, 16, 12);
    g.generateTexture("chest_open", 56, 48);

    g.clear();
    g.fillStyle(0x2c3e50, 1);
    g.fillRoundedRect(4, 6, 48, 56, 20);
    g.fillStyle(0x8e44ad, 1);
    g.fillRoundedRect(7, 9, 42, 50, 18);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(19, 24, 9);
    g.fillCircle(37, 24, 9);
    g.fillStyle(0x2c3e50, 1);
    g.fillCircle(19, 24, 4);
    g.fillCircle(37, 24, 4);
    g.fillStyle(0xf39c12, 1);
    g.fillTriangle(23, 30, 33, 30, 28, 39);
    g.generateTexture("npc_owl", 56, 64);

    g.clear();
    g.fillStyle(0x2c3e50, 1);
    g.fillRoundedRect(0, 0, 44, 130, 6);
    g.fillStyle(0xe74c3c, 1);
    g.fillRect(4, 4, 36, 122);
    g.fillStyle(0xf1c40f, 1);
    g.fillCircle(22, 65, 12);
    g.generateTexture("math_gate", 44, 130);

    g.clear();
    g.fillStyle(0x2c3e50, 1);
    g.fillTriangle(2, 36, 16, 4, 30, 36);
    g.fillTriangle(18, 36, 32, 4, 46, 36);
    g.fillStyle(0xe74c3c, 1);
    g.fillTriangle(5, 34, 16, 8, 27, 34);
    g.fillTriangle(21, 34, 32, 8, 43, 34);
    g.generateTexture("obstacle_spike", 48, 36);

    g.clear();
    g.fillStyle(0x2c3e50, 1);
    g.fillRect(8, 10, 8, 130);
    g.fillStyle(0xf1c40f, 1);
    g.fillCircle(12, 10, 9);
    g.fillStyle(0x2ecc71, 1);
    g.fillTriangle(16, 14, 62, 34, 16, 56);
    g.generateTexture("finish_flag", 64, 140);

    g.clear();
    g.fillStyle(0xf1c40f, 1);
    g.fillCircle(12, 12, 10);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(12, 12, 5);
    g.generateTexture("turbo_spark", 24, 24);

    g.clear();
    const sq = 14;
    for (let row = 0; row < 10; row++) {
      for (let col = 0; col < 2; col++) {
        const isWhite = (row + col) % 2 === 0;
        g.fillStyle(isWhite ? 0xffffff : 0x2c3e50, 1);
        g.fillRect(col * sq, row * sq, sq, sq);
      }
    }
    g.generateTexture("checker_line", 28, 140);

    g.destroy();
  }
}
