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
      this.drawUniqueCharacter(g, char.id);
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

    g.clear();
    g.fillStyle(0x576574, 1);
    g.fillRect(0, 0, 64, 64);
    g.fillStyle(0xd35400, 1);
    g.fillRect(0, 0, 64, 14);
    g.lineStyle(3, 0x2c3e50, 1);
    g.strokeRect(1, 1, 62, 62);
    g.generateTexture("temple_tile", 64, 64);

    g.clear();
    g.fillStyle(0x2c3e50, 1);
    g.fillRoundedRect(0, 0, 192, 36, 10);
    g.fillStyle(0x7f8c8d, 1);
    g.fillRoundedRect(3, 3, 186, 30, 8);
    g.fillStyle(0xf39c12, 1);
    g.fillRect(10, 6, 172, 6);
    g.generateTexture("platform_temple", 192, 36);

    g.clear();
    g.fillStyle(0x1e272e, 1);
    g.fillRect(0, 0, 64, 64);
    g.fillStyle(0xc0392b, 1);
    g.fillRect(0, 0, 64, 12);
    g.lineStyle(3, 0x000000, 1);
    g.strokeRect(1, 1, 62, 62);
    g.generateTexture("fortress_tile", 64, 64);

    g.clear();
    g.fillStyle(0x000000, 1);
    g.fillRoundedRect(0, 0, 192, 36, 8);
    g.fillStyle(0x2d3436, 1);
    g.fillRoundedRect(3, 3, 186, 30, 6);
    g.fillStyle(0xe74c3c, 1);
    g.fillRect(12, 6, 168, 5);
    g.generateTexture("platform_fortress", 192, 36);

    g.clear();
    g.fillStyle(0x2c3e50, 1);
    g.fillRoundedRect(0, 0, 160, 32, 10);
    g.fillStyle(0xf1c40f, 1);
    g.fillRoundedRect(3, 3, 154, 26, 8);
    g.fillStyle(0xe67e22, 1);
    g.fillRect(14, 12, 132, 8);
    g.generateTexture("platform_moving_gold", 160, 32);

    g.clear();
    g.fillStyle(0x2c3e50, 1);
    g.fillRoundedRect(0, 0, 140, 30, 8);
    g.fillStyle(0x95a5a6, 1);
    g.fillRoundedRect(3, 3, 134, 24, 6);
    g.lineStyle(3, 0x2c3e50, 1);
    g.beginPath();
    g.moveTo(45, 3);
    g.lineTo(55, 16);
    g.lineTo(48, 27);
    g.moveTo(95, 3);
    g.lineTo(88, 15);
    g.lineTo(96, 27);
    g.strokePath();
    g.generateTexture("platform_crumble", 140, 30);

    g.clear();
    g.fillStyle(0x2c3e50, 1);
    g.fillRoundedRect(4, 26, 48, 22, 6);
    g.fillStyle(0x7f8c8d, 1);
    g.fillRoundedRect(7, 29, 42, 16, 4);
    g.lineStyle(6, 0xc0392b, 1);
    g.beginPath();
    g.moveTo(28, 28);
    g.lineTo(14, 6);
    g.strokePath();
    g.fillStyle(0xe74c3c, 1);
    g.fillCircle(14, 6, 7);
    g.generateTexture("switch_off", 56, 48);

    g.clear();
    g.fillStyle(0x2c3e50, 1);
    g.fillRoundedRect(4, 26, 48, 22, 6);
    g.fillStyle(0x7f8c8d, 1);
    g.fillRoundedRect(7, 29, 42, 16, 4);
    g.lineStyle(6, 0x27ae60, 1);
    g.beginPath();
    g.moveTo(28, 28);
    g.lineTo(42, 6);
    g.strokePath();
    g.fillStyle(0x2ecc71, 1);
    g.fillCircle(42, 6, 7);
    g.generateTexture("switch_on", 56, 48);

    g.clear();
    g.fillStyle(0xc0392b, 1);
    g.fillRect(0, 8, 64, 36);
    g.fillStyle(0xe67e22, 1);
    g.fillRect(0, 8, 64, 16);
    g.fillStyle(0xf1c40f, 1);
    g.fillCircle(16, 12, 8);
    g.fillCircle(48, 12, 8);
    g.generateTexture("lava_tile", 64, 44);

    g.clear();
    g.fillStyle(0xe74c3c, 1);
    g.fillCircle(16, 16, 15);
    g.fillStyle(0xf1c40f, 1);
    g.fillCircle(16, 16, 9);
    g.generateTexture("fireball_trap", 32, 32);

    g.clear();
    g.fillStyle(0x1e272e, 1);
    g.fillRoundedRect(2, 12, 10, 22, 4);
    g.fillRoundedRect(52, 12, 10, 22, 4);
    g.fillRoundedRect(2, 66, 10, 22, 4);
    g.fillRoundedRect(52, 66, 10, 22, 4);
    g.fillStyle(0x2c3e50, 1);
    g.fillRoundedRect(8, 2, 48, 96, 16);
    g.fillStyle(0xe74c3c, 1);
    g.fillRoundedRect(11, 5, 42, 90, 14);
    g.fillStyle(0xf1c40f, 1);
    g.fillRect(28, 5, 8, 90);
    g.fillStyle(0x74b9ff, 1);
    g.fillRoundedRect(15, 22, 34, 20, 6);
    g.generateTexture("race_car_player", 64, 100);

    g.clear();
    g.fillStyle(0x2c3e50, 1);
    g.fillRoundedRect(6, 2, 44, 86, 14);
    g.fillStyle(0x9b59b6, 1);
    g.fillRoundedRect(9, 5, 38, 80, 12);
    g.fillStyle(0xdfe6e9, 1);
    g.fillRoundedRect(13, 52, 30, 18, 5);
    g.generateTexture("obstacle_car", 56, 90);

    g.clear();
    g.fillStyle(0x2c3e50, 1);
    g.fillRoundedRect(4, 28, 32, 10, 3);
    g.fillTriangle(20, 4, 6, 32, 34, 32);
    g.fillStyle(0xe67e22, 1);
    g.fillTriangle(20, 7, 9, 30, 31, 30);
    g.fillStyle(0xffffff, 1);
    g.fillRect(14, 18, 12, 5);
    g.generateTexture("road_cone", 40, 40);

    g.clear();
    for (let c = 0; c < 12; c++) {
      for (let r = 0; r < 2; r++) {
        g.fillStyle((c + r) % 2 === 0 ? 0xffffff : 0x2c3e50, 1);
        g.fillRect(c * 20, r * 20, 20, 20);
      }
    }
    g.generateTexture("race_finish_banner", 240, 40);

    g.clear();
    g.fillStyle(0x2c3e50, 1);
    g.fillRect(0, 0, 64, 64);
    g.fillStyle(0x636e72, 1);
    g.fillRect(4, 4, 26, 26);
    g.fillRect(34, 4, 26, 26);
    g.fillRect(4, 34, 56, 26);
    g.generateTexture("maze_wall_tile", 64, 64);

    g.clear();
    g.fillStyle(0xdfe6e9, 1);
    g.fillRect(0, 0, 64, 64);
    g.lineStyle(1, 0xb2bec3, 0.5);
    g.strokeRect(0, 0, 64, 64);
    g.generateTexture("maze_floor_tile", 64, 64);

    g.clear();
    g.fillStyle(0x2c3e50, 1);
    g.fillCircle(14, 20, 11);
    g.fillRect(22, 16, 18, 8);
    g.fillRect(32, 22, 6, 8);
    g.fillStyle(0xf1c40f, 1);
    g.fillCircle(14, 20, 8);
    g.fillRect(22, 18, 16, 4);
    g.fillRect(33, 22, 4, 6);
    g.generateTexture("maze_key", 44, 40);

    g.clear();
    g.fillStyle(0x2c3e50, 1);
    g.fillRoundedRect(2, 2, 60, 60, 8);
    g.fillStyle(0xd35400, 1);
    g.fillRoundedRect(6, 6, 52, 52, 6);
    g.fillStyle(0xf1c40f, 1);
    g.fillCircle(32, 32, 10);
    g.generateTexture("maze_key_door", 64, 64);

    g.clear();
    g.fillStyle(0x1e8449, 1);
    g.fillCircle(30, 30, 28);
    g.fillStyle(0x2ecc71, 1);
    g.fillCircle(30, 30, 20);
    g.fillStyle(0xa3cb38, 1);
    g.fillCircle(30, 30, 11);
    g.generateTexture("maze_exit_portal", 60, 60);
    g.destroy();
  }

  drawUniqueCharacter(g, charId) {
    const outline = 0x2c3e50;

    if (charId === "cici") {
      g.fillStyle(outline, 1);
      g.fillRoundedRect(11, 0, 11, 24, 5);
      g.fillRoundedRect(30, 0, 11, 24, 5);
      g.fillStyle(0xf8efba, 1);
      g.fillRoundedRect(13, 2, 7, 20, 4);
      g.fillRoundedRect(32, 2, 7, 20, 4);
      g.fillStyle(0xff9ff3, 1);
      g.fillRoundedRect(15, 4, 3, 14, 2);
      g.fillRoundedRect(34, 4, 3, 14, 2);

      g.fillStyle(outline, 1);
      g.fillRoundedRect(12, 54, 11, 10, 4);
      g.fillRoundedRect(29, 54, 11, 10, 4);
      g.fillStyle(0xf8efba, 1);
      g.fillRoundedRect(14, 55, 7, 7, 3);
      g.fillRoundedRect(31, 55, 7, 7, 3);

      g.fillStyle(outline, 1);
      g.fillRoundedRect(9, 36, 34, 22, 10);
      g.fillStyle(0x9b59b6, 1);
      g.fillRoundedRect(11, 38, 30, 18, 8);
      g.fillStyle(0xf1c40f, 1);
      g.fillCircle(26, 46, 3);

      g.fillStyle(outline, 1);
      g.fillRoundedRect(7, 16, 38, 25, 12);
      g.fillStyle(0xffffff, 1);
      g.fillRoundedRect(9, 18, 34, 21, 10);

      g.fillStyle(0x1e272e, 1);
      g.fillCircle(19, 27, 3.5);
      g.fillCircle(33, 27, 3.5);
      g.fillStyle(0xffffff, 1);
      g.fillCircle(20, 26, 1.2);
      g.fillCircle(34, 26, 1.2);

      g.fillStyle(0xff9ff3, 0.85);
      g.fillCircle(14, 31, 3);
      g.fillCircle(38, 31, 3);

      g.fillStyle(0xe84393, 1);
      g.fillTriangle(24, 30, 28, 30, 26, 33);
      g.fillStyle(0xffffff, 1);
      g.fillRect(24, 33, 4, 4);
      g.lineStyle(1.5, outline, 1);
      g.strokeRect(24, 33, 4, 4);
    } else if (charId === "bobi") {
      g.fillStyle(outline, 1);
      g.fillCircle(12, 12, 8);
      g.fillCircle(40, 12, 8);
      g.fillStyle(0x8d5524, 1);
      g.fillCircle(12, 12, 6);
      g.fillCircle(40, 12, 6);
      g.fillStyle(0xe0ac69, 1);
      g.fillCircle(12, 12, 3);
      g.fillCircle(40, 12, 3);

      g.fillStyle(outline, 1);
      g.fillRoundedRect(10, 53, 12, 11, 5);
      g.fillRoundedRect(30, 53, 12, 11, 5);
      g.fillStyle(0x8d5524, 1);
      g.fillRoundedRect(12, 54, 8, 8, 3);
      g.fillRoundedRect(32, 54, 8, 8, 3);

      g.fillStyle(outline, 1);
      g.fillRoundedRect(6, 34, 40, 23, 11);
      g.fillStyle(0x3498db, 1);
      g.fillRoundedRect(8, 36, 36, 19, 9);
      g.fillStyle(0xe0ac69, 1);
      g.fillRoundedRect(18, 38, 16, 15, 7);

      g.fillStyle(outline, 1);
      g.fillRoundedRect(6, 12, 40, 27, 13);
      g.fillStyle(0xa0522d, 1);
      g.fillRoundedRect(8, 14, 36, 23, 11);

      g.fillStyle(0xffeaa7, 1);
      g.fillRoundedRect(17, 24, 18, 11, 5);

      g.fillStyle(0x1e272e, 1);
      g.fillCircle(17, 21, 3.2);
      g.fillCircle(35, 21, 3.2);
      g.fillStyle(0xffffff, 1);
      g.fillCircle(18, 20, 1.2);
      g.fillCircle(36, 20, 1.2);

      g.fillStyle(0x2c3e50, 1);
      g.fillRoundedRect(23, 25, 6, 4, 2);
      g.lineStyle(2, 0x2c3e50, 1);
      g.beginPath();
      g.arc(26, 30, 4, 0.2, Math.PI - 0.2, false);
      g.strokePath();
    } else if (charId === "prof_panda") {
      g.fillStyle(0x1e272e, 1);
      g.fillCircle(12, 12, 8);
      g.fillCircle(40, 12, 8);

      g.fillStyle(0x1e272e, 1);
      g.fillRoundedRect(11, 53, 12, 11, 5);
      g.fillRoundedRect(29, 53, 12, 11, 5);

      g.fillStyle(outline, 1);
      g.fillRoundedRect(7, 34, 38, 23, 10);
      g.fillStyle(0x2ecc71, 1);
      g.fillRoundedRect(9, 36, 34, 19, 8);
      g.fillStyle(0xffffff, 1);
      g.fillRect(21, 36, 10, 17);
      g.fillStyle(0xe74c3c, 1);
      g.fillTriangle(23, 37, 29, 37, 26, 49);

      g.fillStyle(outline, 1);
      g.fillRoundedRect(6, 12, 40, 26, 13);
      g.fillStyle(0xffffff, 1);
      g.fillRoundedRect(8, 14, 36, 22, 11);

      g.fillStyle(0x1e272e, 1);
      g.fillCircle(18, 23, 5.5);
      g.fillCircle(34, 23, 5.5);

      g.fillStyle(0xffffff, 1);
      g.fillCircle(18, 23, 2.2);
      g.fillCircle(34, 23, 2.2);

      g.lineStyle(2, 0xf1c40f, 1);
      g.strokeCircle(18, 23, 6.5);
      g.strokeCircle(34, 23, 6.5);
      g.strokeLineShape(new Phaser.Geom.Line(24, 23, 28, 23));

      g.fillStyle(0x1e272e, 1);
      g.fillRoundedRect(23, 28, 6, 4, 2);
    } else {
      g.fillStyle(0x6e421c, 1);
      g.fillRect(19, 3, 3, 10);
      g.fillRect(30, 3, 3, 10);
      g.fillRect(17, 5, 3, 3);
      g.fillRect(32, 5, 3, 3);

      g.fillStyle(outline, 1);
      g.fillTriangle(4, 10, 17, 12, 12, 21);
      g.fillTriangle(48, 10, 35, 12, 40, 21);
      g.fillStyle(0xe67e22, 1);
      g.fillTriangle(6, 11, 16, 13, 12, 19);
      g.fillTriangle(46, 11, 36, 13, 40, 19);

      g.fillStyle(outline, 1);
      g.fillRoundedRect(13, 53, 10, 11, 4);
      g.fillRoundedRect(29, 53, 10, 11, 4);
      g.fillStyle(0xd35400, 1);
      g.fillRoundedRect(15, 54, 6, 8, 3);
      g.fillRoundedRect(31, 54, 6, 8, 3);

      g.fillStyle(outline, 1);
      g.fillRoundedRect(9, 35, 34, 21, 9);
      g.fillStyle(0xe67e22, 1);
      g.fillRoundedRect(11, 37, 30, 17, 8);
      g.fillStyle(0xfff5e6, 1);
      g.fillRoundedRect(18, 39, 16, 13, 6);

      g.fillStyle(0xe74c3c, 1);
      g.fillRoundedRect(11, 34, 30, 6, 3);

      g.fillStyle(outline, 1);
      g.fillRoundedRect(8, 11, 36, 26, 12);
      g.fillStyle(0xf39c12, 1);
      g.fillRoundedRect(10, 13, 32, 22, 10);

      g.fillStyle(0xfff9db, 1);
      g.fillCircle(23, 17, 2);
      g.fillCircle(29, 17, 2);
      g.fillCircle(26, 20, 1.8);

      g.fillStyle(0x1e272e, 1);
      g.fillCircle(18, 24, 3.4);
      g.fillCircle(34, 24, 3.4);
      g.fillStyle(0xffffff, 1);
      g.fillCircle(19, 23, 1.2);
      g.fillCircle(35, 23, 1.2);

      g.fillStyle(0xfff5e6, 1);
      g.fillRoundedRect(20, 26, 12, 8, 4);
      g.fillStyle(0x2c3e50, 1);
      g.fillCircle(26, 28, 2.5);
      g.lineStyle(2, 0x2c3e50, 1);
      g.beginPath();
      g.arc(26, 30, 3.5, 0.2, Math.PI - 0.2, false);
      g.strokePath();
    }
  }
}
