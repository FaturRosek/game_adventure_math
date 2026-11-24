import Phaser from "phaser";
import { characterAssetManager } from "../systems/CharacterAssetManager.js";

export class BootScene extends Phaser.Scene {
  constructor() {
    super("BootScene");
  }

  preload() {
    this.load.image("fantasy_world_bg", "./assets/ui/fantasy-world-bg.jpg");
    this.load.image("medium_battle_bg", "./assets/ui/medium-battle-bg.jpg");
    this.load.image("hard_survival_bg", "./assets/ui/hard-survival-bg.jpg");
    characterAssetManager.preloadAssets(this);
  }

  create() {
    characterAssetManager.buildTexturesAndAnimations(this);
    this.generateWorldTextures();
  }

  generateWorldTextures() {
    const g = this.make.graphics({ x: 0, y: 0, add: false });

    const make = (key, w, h, fn) => {
      if (this.textures.exists(key)) this.textures.remove(key);
      g.clear();
      fn();
      g.generateTexture(key, w, h);
    };

    make("ground_tile", 64, 64, () => {
      g.fillStyle(0x7c4a21, 1);
      g.fillRect(0, 0, 64, 64);
      g.fillStyle(0x5c3314, 1);
      g.fillRoundedRect(6, 26, 18, 14, 5);
      g.fillRoundedRect(34, 38, 22, 16, 6);
      g.fillStyle(0x9a5f2d, 1);
      g.fillCircle(46, 26, 5);
      g.fillStyle(0x16a34a, 1);
      g.fillRect(0, 0, 64, 20);
      g.fillStyle(0x4ade80, 1);
      g.fillRect(0, 0, 64, 10);
      g.fillStyle(0x86efac, 0.7);
      g.fillRect(4, 2, 56, 4);
      g.fillStyle(0x15803d, 1);
      g.fillTriangle(8, 20, 16, 26, 24, 20);
      g.fillTriangle(38, 20, 48, 27, 56, 20);
    });

    make("platform_wood", 192, 38, () => {
      g.fillStyle(0x431d07, 1);
      g.fillRoundedRect(0, 4, 192, 34, 12);
      g.fillStyle(0xb45d24, 1);
      g.fillRoundedRect(3, 6, 186, 28, 10);
      g.fillStyle(0xd9822b, 1);
      g.fillRoundedRect(6, 8, 180, 12, 6);
      g.fillStyle(0x22c55e, 1);
      g.fillRoundedRect(4, 2, 184, 12, 7);
      g.fillStyle(0x86efac, 0.85);
      g.fillRoundedRect(10, 4, 172, 4, 3);
    });

    make("temple_tile", 64, 64, () => {
      g.fillStyle(0x57534e, 1);
      g.fillRect(0, 0, 64, 64);
      g.fillStyle(0x78716c, 1);
      g.fillRoundedRect(3, 18, 28, 20, 4);
      g.fillRoundedRect(34, 18, 27, 20, 4);
      g.fillRoundedRect(10, 42, 44, 18, 4);
      g.fillStyle(0xf59e0b, 1);
      g.fillRect(0, 0, 64, 12);
      g.fillStyle(0xfef08a, 0.8);
      g.fillRect(4, 2, 56, 4);
    });

    make("platform_temple", 184, 36, () => {
      g.fillStyle(0x44403c, 1);
      g.fillRoundedRect(0, 2, 184, 34, 10);
      g.fillStyle(0xa8a29e, 1);
      g.fillRoundedRect(4, 5, 176, 26, 8);
      g.fillStyle(0xf59e0b, 1);
      g.fillRect(10, 4, 164, 6);
    });

    make("fortress_tile", 64, 64, () => {
      g.fillStyle(0x1e293b, 1);
      g.fillRect(0, 0, 64, 64);
      g.fillStyle(0x334155, 1);
      g.fillRoundedRect(3, 16, 26, 20, 4);
      g.fillRoundedRect(33, 16, 28, 20, 4);
      g.fillRoundedRect(8, 40, 48, 20, 4);
      g.fillStyle(0xef4444, 1);
      g.fillRect(0, 0, 64, 10);
      g.fillStyle(0xfca5a5, 0.7);
      g.fillRect(4, 2, 56, 3);
    });

    make("platform_fortress", 184, 36, () => {
      g.fillStyle(0x0f172a, 1);
      g.fillRoundedRect(0, 2, 184, 34, 10);
      g.fillStyle(0x475569, 1);
      g.fillRoundedRect(4, 5, 176, 26, 8);
      g.fillStyle(0xf97316, 1);
      g.fillRect(10, 4, 164, 6);
    });

    make("platform_moving_gold", 156, 32, () => {
      g.fillStyle(0x78350f, 1);
      g.fillRoundedRect(0, 0, 156, 32, 12);
      g.fillStyle(0xf59e0b, 1);
      g.fillRoundedRect(3, 3, 150, 26, 9);
      g.fillStyle(0xfef08a, 1);
      g.fillRoundedRect(10, 6, 136, 8, 4);
    });

    make("crumble_tile", 96, 28, () => {
      g.fillStyle(0x78350f, 1);
      g.fillRoundedRect(0, 0, 96, 28, 8);
      g.fillStyle(0xb45309, 1);
      g.fillRoundedRect(3, 3, 90, 22, 6);
      g.lineStyle(2.5, 0x451a03, 1);
      g.lineBetween(26, 3, 34, 16);
      g.lineBetween(34, 16, 28, 25);
      g.lineBetween(64, 3, 58, 18);
    });

    make("coin_gold", 38, 38, () => {
      g.fillStyle(0xb45309, 1);
      g.fillCircle(19, 19, 17);
      g.fillStyle(0xfacc15, 1);
      g.fillCircle(19, 19, 14);
      g.fillStyle(0xf59e0b, 1);
      g.fillCircle(19, 19, 10);
      g.fillStyle(0xfef9c3, 1);
      g.fillRoundedRect(16, 11, 5, 16, 2);
    });

    make("secret_gem", 38, 42, () => {
      g.fillStyle(0x0369a1, 1);
      g.fillTriangle(19, 2, 36, 17, 19, 40);
      g.fillStyle(0x38bdf8, 1);
      g.fillTriangle(19, 2, 2, 17, 19, 40);
      g.fillStyle(0xe0f2fe, 0.95);
      g.fillTriangle(19, 6, 28, 17, 19, 24);
    });

    make("heart_pickup", 36, 34, () => {
      g.fillStyle(0x991b1b, 1);
      g.fillCircle(12, 12, 9);
      g.fillCircle(24, 12, 9);
      g.fillTriangle(3, 15, 33, 15, 18, 32);
      g.fillStyle(0xef4444, 1);
      g.fillCircle(12, 11, 7.5);
      g.fillCircle(24, 11, 7.5);
      g.fillTriangle(5, 14, 31, 14, 18, 29);
      g.fillStyle(0xfca5a5, 1);
      g.fillCircle(10, 9, 3);
    });

    make("chest_closed", 62, 52, () => {
      g.fillStyle(0x451a03, 1);
      g.fillRoundedRect(0, 4, 62, 48, 10);
      g.fillStyle(0xb45309, 1);
      g.fillRoundedRect(4, 8, 54, 40, 8);
      g.fillStyle(0xf59e0b, 1);
      g.fillRect(4, 22, 54, 8);
      g.fillStyle(0xfef08a, 1);
      g.fillRoundedRect(25, 17, 12, 18, 4);
    });

    make("chest_open", 62, 52, () => {
      g.fillStyle(0x14532d, 1);
      g.fillRoundedRect(0, 12, 62, 40, 10);
      g.fillStyle(0x16a34a, 1);
      g.fillRoundedRect(4, 16, 54, 32, 8);
      g.fillStyle(0xfacc15, 1);
      g.fillCircle(31, 18, 13);
      g.fillStyle(0xfef9c3, 1);
      g.fillCircle(28, 15, 5);
    });

    make("npc_owl", 60, 68, () => {
      g.fillStyle(0x4c1d95, 1);
      g.fillRoundedRect(4, 6, 52, 58, 22);
      g.fillStyle(0x8b5cf6, 1);
      g.fillRoundedRect(8, 10, 44, 50, 18);
      g.fillStyle(0xffffff, 1);
      g.fillCircle(21, 26, 9);
      g.fillCircle(39, 26, 9);
      g.fillStyle(0x1e293b, 1);
      g.fillCircle(21, 26, 4.5);
      g.fillCircle(39, 26, 4.5);
      g.fillStyle(0xf59e0b, 1);
      g.fillTriangle(25, 32, 35, 32, 30, 42);
    });

    make("math_gate", 52, 138, () => {
      g.fillStyle(0x451a03, 1);
      g.fillRoundedRect(0, 0, 52, 138, 10);
      g.fillStyle(0x9a3412, 1);
      g.fillRoundedRect(4, 4, 44, 130, 8);
      g.fillStyle(0x38bdf8, 0.9);
      g.fillCircle(26, 68, 16);
      g.fillStyle(0xfef08a, 1);
      g.fillCircle(26, 68, 8);
    });

    make("switch_off", 46, 46, () => {
      g.fillStyle(0x334155, 1);
      g.fillRoundedRect(4, 28, 38, 16, 6);
      g.fillStyle(0xef4444, 1);
      g.fillRoundedRect(10, 10, 26, 20, 8);
    });

    make("switch_on", 46, 46, () => {
      g.fillStyle(0x334155, 1);
      g.fillRoundedRect(4, 28, 38, 16, 6);
      g.fillStyle(0x22c55e, 1);
      g.fillRoundedRect(10, 18, 26, 12, 6);
    });

    make("obstacle_spike", 52, 36, () => {
      g.fillStyle(0x7f1d1d, 1);
      g.fillTriangle(2, 36, 16, 4, 30, 36);
      g.fillTriangle(22, 36, 36, 4, 50, 36);
      g.fillStyle(0xef4444, 1);
      g.fillTriangle(6, 34, 16, 9, 26, 34);
      g.fillTriangle(26, 34, 36, 9, 46, 34);
    });

    make("lava_tile", 64, 40, () => {
      g.fillStyle(0xdc2626, 1);
      g.fillRect(0, 0, 64, 40);
      g.fillStyle(0xf97316, 1);
      g.fillRect(0, 0, 64, 14);
      g.fillStyle(0xfef08a, 1);
      g.fillCircle(16, 10, 5);
      g.fillCircle(48, 12, 4);
    });

    make("fireball_trap", 34, 34, () => {
      g.fillStyle(0xef4444, 1);
      g.fillCircle(17, 17, 15);
      g.fillStyle(0xfacc15, 1);
      g.fillCircle(17, 17, 9);
    });

    make("bounce_pad", 60, 30, () => {
      g.fillStyle(0x334155, 1);
      g.fillRoundedRect(8, 16, 44, 14, 5);
      g.fillStyle(0xf59e0b, 1);
      g.fillRoundedRect(2, 4, 56, 15, 8);
      g.fillStyle(0xfef08a, 1);
      g.fillRoundedRect(10, 7, 40, 5, 3);
    });

    make("checkpoint_idle", 50, 96, () => {
      g.fillStyle(0x475569, 1);
      g.fillRect(10, 12, 7, 84);
      g.fillStyle(0x94a3b8, 1);
      g.fillCircle(13, 12, 8);
      g.fillStyle(0xef4444, 1);
      g.fillTriangle(17, 16, 48, 29, 17, 44);
    });

    make("checkpoint_active", 50, 96, () => {
      g.fillStyle(0x92400e, 1);
      g.fillRect(10, 12, 7, 84);
      g.fillStyle(0xfacc15, 1);
      g.fillCircle(13, 12, 9);
      g.fillStyle(0x22c55e, 1);
      g.fillTriangle(17, 16, 48, 29, 17, 44);
      g.fillStyle(0xfef08a, 1);
      g.fillCircle(28, 29, 4.5);
    });

    make("finish_flag", 66, 144, () => {
      g.fillStyle(0x78350f, 1);
      g.fillRect(8, 12, 9, 132);
      g.fillStyle(0xfacc15, 1);
      g.fillCircle(12, 12, 10);
      g.fillStyle(0x22c55e, 1);
      g.fillTriangle(17, 16, 64, 38, 17, 60);
      g.fillStyle(0xfef08a, 1);
      g.fillCircle(32, 38, 6);
    });

    make("attack_wave", 48, 48, () => {
      g.lineStyle(7, 0x38bdf8, 0.95);
      g.beginPath();
      g.arc(16, 24, 19, -1.0, 1.0, false);
      g.strokePath();
      g.lineStyle(3.5, 0xfef08a, 1);
      g.beginPath();
      g.arc(20, 24, 14, -0.8, 0.8, false);
      g.strokePath();
    });

    make("dust_puff", 20, 20, () => {
      g.fillStyle(0xffffff, 0.9);
      g.fillCircle(10, 10, 8);
    });

    make("enemy_slime", 56, 48, () => {
      g.fillStyle(0x581c87, 1);
      g.fillRoundedRect(2, 10, 52, 36, 18);
      g.fillStyle(0xa855f7, 1);
      g.fillRoundedRect(6, 14, 44, 28, 15);
      g.fillStyle(0xe9d5ff, 0.75);
      g.fillEllipse(20, 20, 14, 7);
      g.fillStyle(0xffffff, 1);
      g.fillCircle(19, 28, 6);
      g.fillCircle(37, 28, 6);
      g.fillStyle(0x1e293b, 1);
      g.fillCircle(20, 28, 3);
      g.fillCircle(38, 28, 3);
      g.fillStyle(0xfef08a, 1);
      g.fillTriangle(22, 10, 28, 2, 34, 10);
    });

    make("race_car_player", 64, 100, () => {
      g.fillStyle(0x1e272e, 1);
      g.fillRoundedRect(2, 12, 10, 22, 4);
      g.fillRoundedRect(52, 12, 10, 22, 4);
      g.fillRoundedRect(2, 66, 10, 22, 4);
      g.fillRoundedRect(52, 66, 10, 22, 4);
      g.fillStyle(0xe74c3c, 1);
      g.fillRoundedRect(10, 4, 44, 92, 14);
      g.fillStyle(0xf1c40f, 1);
      g.fillRect(28, 4, 8, 92);
      g.fillStyle(0x74b9ff, 1);
      g.fillRoundedRect(15, 22, 34, 20, 6);
    });

    make("obstacle_car", 56, 90, () => {
      g.fillStyle(0x9b59b6, 1);
      g.fillRoundedRect(8, 4, 40, 82, 12);
      g.fillStyle(0xdfe6e9, 1);
      g.fillRoundedRect(13, 52, 30, 18, 5);
    });

    make("road_cone", 40, 40, () => {
      g.fillStyle(0xe67e22, 1);
      g.fillTriangle(20, 6, 8, 32, 32, 32);
      g.fillStyle(0xffffff, 1);
      g.fillRect(14, 18, 12, 5);
    });

    make("race_finish_banner", 240, 40, () => {
      for (let c = 0; c < 12; c++) {
        for (let r = 0; r < 2; r++) {
          g.fillStyle((c + r) % 2 === 0 ? 0xffffff : 0x2c3e50, 1);
          g.fillRect(c * 20, r * 20, 20, 20);
        }
      }
    });

    make("maze_wall_tile", 64, 64, () => {
      g.fillStyle(0x2c3e50, 1);
      g.fillRect(0, 0, 64, 64);
      g.fillStyle(0x636e72, 1);
      g.fillRect(4, 4, 26, 26);
      g.fillRect(34, 4, 26, 26);
      g.fillRect(4, 34, 56, 26);
    });

    make("maze_floor_tile", 64, 64, () => {
      g.fillStyle(0xdfe6e9, 1);
      g.fillRect(0, 0, 64, 64);
      g.lineStyle(1, 0xb2bec3, 0.5);
      g.strokeRect(0, 0, 64, 64);
    });

    make("maze_key", 44, 40, () => {
      g.fillStyle(0xf1c40f, 1);
      g.fillCircle(14, 20, 9);
      g.fillRect(22, 18, 16, 4);
      g.fillRect(33, 22, 4, 6);
    });

    make("maze_key_door", 64, 64, () => {
      g.fillStyle(0xd35400, 1);
      g.fillRoundedRect(4, 4, 56, 56, 8);
      g.fillStyle(0xf1c40f, 1);
      g.fillCircle(32, 32, 10);
    });

    make("maze_exit_portal", 60, 60, () => {
      g.fillStyle(0x1e8449, 1);
      g.fillCircle(30, 30, 28);
      g.fillStyle(0x2ecc71, 1);
      g.fillCircle(30, 30, 20);
      g.fillStyle(0xa3cb38, 1);
      g.fillCircle(30, 30, 11);
    });

    make("twilight_tile", 64, 64, () => {
      g.fillStyle(0x312e81, 1);
      g.fillRect(0, 0, 64, 64);
      g.fillStyle(0x4338ca, 1);
      g.fillRoundedRect(3, 18, 28, 20, 4);
      g.fillRoundedRect(34, 18, 27, 20, 4);
      g.fillRoundedRect(10, 42, 44, 18, 4);
      g.fillStyle(0x818cf8, 1);
      g.fillRect(0, 0, 64, 12);
      g.fillStyle(0xe0e7ff, 0.8);
      g.fillRect(4, 2, 56, 4);
    });

    make("platform_twilight", 184, 34, () => {
      g.fillStyle(0x1e1b4b, 1);
      g.fillRoundedRect(0, 2, 184, 32, 10);
      g.fillStyle(0x4f46e5, 1);
      g.fillRoundedRect(4, 5, 176, 24, 8);
      g.fillStyle(0xf59e0b, 1);
      g.fillRoundedRect(8, 4, 168, 7, 4);
    });

    make("battle_totem", 58, 72, () => {
      g.fillStyle(0x1e1b4b, 1);
      g.fillRoundedRect(8, 12, 42, 58, 10);
      g.fillStyle(0x6d28d9, 1);
      g.fillRoundedRect(12, 16, 34, 50, 8);
      g.fillStyle(0xf59e0b, 1);
      g.fillCircle(29, 34, 12);
      g.fillStyle(0xfef08a, 1);
      g.fillCircle(29, 34, 6);
    });

    make("battle_totem_open", 58, 72, () => {
      g.fillStyle(0x14532d, 1);
      g.fillRoundedRect(8, 12, 42, 58, 10);
      g.fillStyle(0x16a34a, 1);
      g.fillRoundedRect(12, 16, 34, 50, 8);
      g.fillStyle(0x4ade80, 1);
      g.fillCircle(29, 34, 12);
      g.fillStyle(0xffffff, 1);
      g.fillCircle(29, 34, 5);
    });

    make("torch_pillar", 28, 78, () => {
      g.fillStyle(0x475569, 1);
      g.fillRoundedRect(9, 26, 10, 52, 3);
      g.fillStyle(0xf97316, 1);
      g.fillCircle(14, 20, 11);
      g.fillStyle(0xfef08a, 1);
      g.fillCircle(14, 19, 6);
    });

    g.destroy();
  }
}
