import Phaser from "phaser";
import { GAME_CONFIG } from "../config/gameConfig.js";

export class AdventureLevelBuilder {
  static buildLevel(scene) {
    const levelKey = scene.levelKey || "easy";
    if (levelKey === "medium") {
      return this.buildMysteryTempleLevel(scene);
    }
    if (levelKey === "hard") {
      return this.buildLavaFortressLevel(scene);
    }
    return this.buildForestLevel(scene);
  }

  static buildForestLevel(scene) {
    const worldW = GAME_CONFIG.worldWidth;
    const worldH = GAME_CONFIG.worldHeight;
    const subjLabel = scene.getSubjectLabel();
    const [q1, q2, q3, q4] = scene.boxDistribution;

    const bg = scene.add.graphics();
    bg.fillGradientStyle(0x56ccf2, 0x56ccf2, 0xe8f8f5, 0xe8f8f5, 1);
    bg.fillRect(0, 0, worldW, worldH);

    const hills = scene.add.graphics();
    hills.fillStyle(0x2ecc71, 0.45);
    for (let x = 0; x < worldW; x += 500) {
      hills.fillCircle(x + 220, worldH - 50, 240);
      hills.fillStyle(0x27ae60, 0.65);
      hills.fillRect(x + 120, worldH - 170, 24, 110);
      hills.fillCircle(x + 132, worldH - 190, 55);
      hills.fillStyle(0x2ecc71, 0.45);
    }

    const clouds = scene.add.graphics();
    clouds.fillStyle(0xffffff, 0.88);
    for (let x = 140; x < worldW; x += 420) {
      const y = 85 + (x % 90);
      clouds.fillRoundedRect(x, y, 140, 44, 22);
      clouds.fillCircle(x + 45, y, 26);
      clouds.fillCircle(x + 95, y - 4, 32);
    }

    scene.addFloatingLabel(
      340,
      worldH - 195,
      `🌲 Petualangan Hutan ${subjLabel} (5 Soal): Jelajahi hutan, kumpulkan koin & buka peti!`,
      "#27ae60",
    );

    for (let x = 32; x < worldW; x += 64) {
      scene.platforms.create(x, worldH - 32, "ground_tile");
    }

    const floatingCoords = [
      { x: 520, y: worldH - 160 },
      { x: 820, y: worldH - 240 },
      { x: 1180, y: worldH - 175 },
      { x: 1520, y: worldH - 250 },
      { x: 1920, y: worldH - 170 },
      { x: 2250, y: worldH - 245 },
      { x: 2620, y: worldH - 180 },
      { x: 3180, y: worldH - 210 },
    ];

    floatingCoords.forEach((p) => {
      scene.platforms.create(p.x, p.y, "platform_wood");
    });

    const coinCoords = [
      { x: 320, y: worldH - 100 },
      { x: 380, y: worldH - 100 },
      { x: 480, y: worldH - 215 },
      { x: 560, y: worldH - 215 },
      { x: 780, y: worldH - 295 },
      { x: 860, y: worldH - 295 },
      { x: 1140, y: worldH - 230 },
      { x: 1220, y: worldH - 230 },
      { x: 1480, y: worldH - 305 },
      { x: 1560, y: worldH - 305 },
      { x: 1880, y: worldH - 225 },
      { x: 1960, y: worldH - 225 },
      { x: 2210, y: worldH - 300 },
      { x: 2290, y: worldH - 300 },
      { x: 2600, y: worldH - 235 },
      { x: 3180, y: worldH - 265 },
      { x: 3420, y: worldH - 100 },
    ];
    this.spawnCoinList(scene, coinCoords);

    [1020, 2060, 3340].forEach((x) => {
      scene.obstaclesGroup.create(x, worldH - 82, "obstacle_spike");
    });

    this.createChallengeNode(scene, {
      x: 820,
      y: worldH - 282,
      texture: "chest_closed",
      id: "chal_1",
      baseName: "Peti Hutan 1",
      title: `📦 Peti Hutan ${subjLabel} 1`,
      type: "chest",
      requiredCount: q1,
      labelColor: "#d35400",
    });

    this.createChallengeNode(scene, {
      x: 1680,
      y: worldH - 96,
      texture: "npc_owl",
      id: "chal_2",
      baseName: "Burung Hantu Hutan",
      title: `🦉 Misi Burung Hantu (${subjLabel})`,
      type: "npc",
      requiredCount: q2,
      labelColor: "#8e44ad",
    });

    this.createChallengeNode(scene, {
      x: 2250,
      y: worldH - 287,
      texture: "chest_closed",
      id: "chal_3",
      baseName: "Peti Pohon Tinggi",
      title: `📦 Peti Pohon ${subjLabel} 2`,
      type: "chest",
      requiredCount: q3,
      labelColor: "#d35400",
    });

    const gate = this.createChallengeNode(scene, {
      x: 2950,
      y: worldH - 128,
      texture: "math_gate",
      id: "chal_4",
      baseName: "Gerbang Hutan",
      title: `🚪 Gerbang Hutan ${subjLabel}`,
      type: "gate",
      requiredCount: q4,
      labelColor: "#c0392b",
    });
    scene.gateObject = gate;
  }

  static buildMysteryTempleLevel(scene) {
    const worldW = GAME_CONFIG.worldWidth;
    const worldH = GAME_CONFIG.worldHeight;
    const subjLabel = scene.getSubjectLabel();
    const [q1, q2, q3, q4] = scene.boxDistribution;

    const bg = scene.add.graphics();
    bg.fillGradientStyle(0x2c3e50, 0x2c3e50, 0xf39c12, 0xf39c12, 1);
    bg.fillRect(0, 0, worldW, worldH);

    const pillars = scene.add.graphics();
    pillars.fillStyle(0x34495e, 0.55);
    for (let x = 200; x < worldW; x += 460) {
      pillars.fillRect(x, 120, 56, worldH - 180);
      pillars.fillRect(x - 12, 120, 80, 24);
      pillars.fillRect(x - 12, worldH - 95, 80, 30);
    }

    scene.addFloatingLabel(
      380,
      worldH - 195,
      `🏛️ Kuil Misteri ${subjLabel} (7 Soal): Aktifkan Sakelar Kuno untuk menggerakkan jembatan & membuka jalur rahasia!`,
      "#8e44ad",
    );

    for (let x = 32; x < worldW; x += 64) {
      if ((x > 960 && x < 1340) || (x > 2180 && x < 2620)) {
        scene.obstaclesGroup.create(x, worldH - 46, "obstacle_spike");
        continue;
      }
      scene.platforms.create(x, worldH - 32, "temple_tile");
    }

    const templePlatforms = [
      { x: 460, y: worldH - 155 },
      { x: 760, y: worldH - 235 },
      { x: 1520, y: worldH - 185 },
      { x: 1840, y: worldH - 275 },
      { x: 2060, y: worldH - 175 },
      { x: 2820, y: worldH - 185 },
      { x: 3260, y: worldH - 215 },
    ];
    templePlatforms.forEach((p) => {
      scene.platforms.create(p.x, p.y, "platform_temple");
    });

    const bridge1 = scene.createMovingPlatform({
      x: 1020,
      y: worldH - 210,
      texture: "platform_moving_gold",
      moveType: "horizontal",
      minX: 980,
      maxX: 1320,
      speed: 115,
      active: false,
    });
    const bridge1Hint = scene.addFloatingLabel(
      1150,
      worldH - 265,
      "⏸️ Jembatan Kuno (Aktifkan Sakelar 1)",
      "#7f8c8d",
    );

    const secretLift = scene.createMovingPlatform({
      x: 1680,
      y: worldH - 120,
      texture: "platform_moving_gold",
      moveType: "vertical",
      minY: worldH - 390,
      maxY: worldH - 120,
      speed: 95,
      active: false,
    });
    const secretPlatform = scene.platforms.create(
      1840,
      worldH - 410,
      "platform_temple",
    );
    secretPlatform.setAlpha(0.35);
    const secretLabel = scene.addFloatingLabel(
      1840,
      worldH - 465,
      "✨ Jalur Rahasia Kuil (Terkunci)",
      "#9b59b6",
    );

    const bridge2 = scene.createMovingPlatform({
      x: 2220,
      y: worldH - 205,
      texture: "platform_moving_gold",
      moveType: "horizontal",
      minX: 2200,
      maxX: 2590,
      speed: 125,
      active: false,
    });
    const bridge2Hint = scene.addFloatingLabel(
      2400,
      worldH - 260,
      "⏸️ Lift Jembatan 2 (Aktifkan Sakelar 2)",
      "#7f8c8d",
    );

    const coinCoords = [
      { x: 430, y: worldH - 210 },
      { x: 490, y: worldH - 210 },
      { x: 1100, y: worldH - 270 },
      { x: 1200, y: worldH - 270 },
      { x: 1780, y: worldH - 465 },
      { x: 1840, y: worldH - 465 },
      { x: 1900, y: worldH - 465 },
      { x: 2350, y: worldH - 265 },
      { x: 2450, y: worldH - 265 },
      { x: 2820, y: worldH - 240 },
      { x: 3260, y: worldH - 270 },
      { x: 3480, y: worldH - 100 },
    ];
    this.spawnCoinList(scene, coinCoords);

    this.createChallengeNode(scene, {
      x: 760,
      y: worldH - 277,
      texture: "switch_off",
      id: "chal_1",
      baseName: "Sakelar Jembatan 1",
      title: `⚙️ Sakelar Kuno 1 (${subjLabel})`,
      type: "switch",
      requiredCount: q1,
      labelColor: "#d35400",
      onSolved: () => {
        bridge1.setData("active", true);
        bridge1Hint.setText("⚡ Jembatan Kuno Aktif! Naiklah ke seberang!");
      },
    });

    this.createChallengeNode(scene, {
      x: 1520,
      y: worldH - 235,
      texture: "npc_owl",
      id: "chal_2",
      baseName: "Penjaga Jalur Rahasia",
      title: `🦉 Penjaga Kuil (${subjLabel})`,
      type: "npc",
      requiredCount: q2,
      labelColor: "#8e44ad",
      onSolved: () => {
        secretLift.setData("active", true);
        secretPlatform.setAlpha(1);
        secretLabel.setText(
          "✨ Lift Jalur Rahasia Aktif! Ambil Koin Bonus di Atas!",
        );
      },
    });

    this.createChallengeNode(scene, {
      x: 2060,
      y: worldH - 217,
      texture: "switch_off",
      id: "chal_3",
      baseName: "Sakelar Jembatan 2",
      title: `⚙️ Sakelar Kuno 2 (${subjLabel})`,
      type: "switch",
      requiredCount: q3,
      labelColor: "#d35400",
      onSolved: () => {
        bridge2.setData("active", true);
        bridge2Hint.setText("⚡ Lift Jembatan 2 Aktif!");
      },
    });

    const gate = this.createChallengeNode(scene, {
      x: 3020,
      y: worldH - 128,
      texture: "math_gate",
      id: "chal_4",
      baseName: "Gerbang Kuil Kuno",
      title: `🚪 Pintu Batu Kuil (${subjLabel})`,
      type: "gate",
      requiredCount: q4,
      labelColor: "#c0392b",
    });
    scene.gateObject = gate;
  }

  static buildLavaFortressLevel(scene) {
    const worldW = GAME_CONFIG.worldWidth;
    const worldH = GAME_CONFIG.worldHeight;
    const subjLabel = scene.getSubjectLabel();
    const [q1, q2, q3, q4] = scene.boxDistribution;

    const bg = scene.add.graphics();
    bg.fillGradientStyle(0x1e272e, 0x1e272e, 0xc0392b, 0xc0392b, 1);
    bg.fillRect(0, 0, worldW, worldH);

    const volcano = scene.add.graphics();
    volcano.fillStyle(0x2d3436, 0.7);
    for (let x = 150; x < worldW; x += 650) {
      volcano.fillTriangle(x, worldH - 60, x + 220, 180, x + 440, worldH - 60);
    }

    scene.addFloatingLabel(
      400,
      worldH - 195,
      `🌋 Benteng Lava ${subjLabel} (10 Soal): Lompati kolam lava, waspadai pijakan rapuh & bola api!`,
      "#c0392b",
    );

    const isLavaGap = (x) =>
      (x > 580 && x < 920) || (x > 1340 && x < 1760) || (x > 2180 && x < 2680);

    for (let x = 32; x < worldW; x += 64) {
      if (isLavaGap(x)) {
        const lavaTile = scene.lavaGroup.create(x, worldH - 22, "lava_tile");
        lavaTile.body.setSize(64, 34);
        continue;
      }
      scene.platforms.create(x, worldH - 32, "fortress_tile");
    }

    scene.checkpoints = [
      { x: 120, y: worldH - 150 },
      { x: 1020, y: worldH - 150 },
      { x: 1880, y: worldH - 150 },
      { x: 2780, y: worldH - 150 },
    ];

    scene.platforms.create(420, worldH - 155, "platform_fortress");
    scene.platforms.create(1120, worldH - 210, "platform_fortress");
    scene.platforms.create(1980, worldH - 210, "platform_fortress");
    scene.platforms.create(2840, worldH - 185, "platform_fortress");
    scene.platforms.create(3280, worldH - 215, "platform_fortress");

    scene.createCrumblingPlatform(660, worldH - 185);
    scene.createCrumblingPlatform(820, worldH - 225);
    scene.createCrumblingPlatform(2280, worldH - 210);

    const lavaBridge1 = scene.createMovingPlatform({
      x: 1420,
      y: worldH - 200,
      texture: "platform_moving_gold",
      moveType: "horizontal",
      minX: 1380,
      maxX: 1710,
      speed: 135,
      active: true,
    });

    const lavaBridge2 = scene.createMovingPlatform({
      x: 2480,
      y: worldH - 225,
      texture: "platform_moving_gold",
      moveType: "horizontal",
      minX: 2380,
      maxX: 2650,
      speed: 140,
      active: false,
    });
    const lavaBridge2Hint = scene.addFloatingLabel(
      2520,
      worldH - 280,
      "🔒 Platform Lava Terkunci (Selesaikan Pos 3)",
      "#e67e22",
    );

    scene.spawnFireballTrap(740, worldH - 40, worldH - 310);
    scene.spawnFireballTrap(1560, worldH - 40, worldH - 320);
    scene.spawnFireballTrap(2420, worldH - 40, worldH - 330);

    [1250, 3140, 3420].forEach((x) => {
      scene.obstaclesGroup.create(x, worldH - 82, "obstacle_spike");
    });

    const coinCoords = [
      { x: 420, y: worldH - 210 },
      { x: 660, y: worldH - 240 },
      { x: 820, y: worldH - 280 },
      { x: 1480, y: worldH - 265 },
      { x: 1620, y: worldH - 265 },
      { x: 2280, y: worldH - 265 },
      { x: 2520, y: worldH - 280 },
      { x: 2840, y: worldH - 240 },
      { x: 3280, y: worldH - 270 },
    ];
    this.spawnCoinList(scene, coinCoords);

    this.createChallengeNode(scene, {
      x: 420,
      y: worldH - 197,
      texture: "chest_closed",
      id: "chal_1",
      baseName: "Peti Benteng 1",
      title: `🔥 Peti Benteng Lava 1 (${subjLabel})`,
      type: "chest",
      requiredCount: q1,
      labelColor: "#d35400",
    });

    this.createChallengeNode(scene, {
      x: 1120,
      y: worldH - 260,
      texture: "npc_owl",
      id: "chal_2",
      baseName: "Penjaga Gunung Api",
      title: `🦉 Penjaga Benteng (${subjLabel})`,
      type: "npc",
      requiredCount: q2,
      labelColor: "#8e44ad",
    });

    this.createChallengeNode(scene, {
      x: 1980,
      y: worldH - 252,
      texture: "switch_off",
      id: "chal_3",
      baseName: "Sakelar Jembatan Lava",
      title: `⚙️ Sakelar Benteng (${subjLabel})`,
      type: "switch",
      requiredCount: q3,
      labelColor: "#d35400",
      onSolved: () => {
        lavaBridge2.setData("active", true);
        lavaBridge2Hint.setText("⚡ Platform Lava Aktif! Seberangi kawah!");
      },
    });

    const gate = this.createChallengeNode(scene, {
      x: 3040,
      y: worldH - 128,
      texture: "math_gate",
      id: "chal_4",
      baseName: "Gerbang Benteng Lava",
      title: `🚪 Segel Benteng Lava (${subjLabel})`,
      type: "gate",
      requiredCount: q4,
      labelColor: "#c0392b",
    });
    scene.gateObject = gate;
  }

  static spawnCoinList(scene, coords) {
    coords.forEach((pos) => {
      const coin = scene.coinsGroup.create(pos.x, pos.y, "coin_gold");
      coin.setData("collected", false);
      scene.tweens.add({
        targets: coin,
        y: pos.y - 8,
        duration: 750,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
    });
  }

  static createChallengeNode(scene, cfg) {
    const node = scene.challengesGroup.create(cfg.x, cfg.y, cfg.texture);
    const labelOffset = cfg.type === "gate" ? 88 : 55;
    const label = scene.addFloatingLabel(
      cfg.x,
      cfg.y - labelOffset,
      `❓ ${cfg.baseName} (0/${cfg.requiredCount})`,
      cfg.labelColor || "#2c3e50",
    );
    node.setData({
      id: cfg.id,
      baseName: cfg.baseName,
      title: cfg.title,
      type: cfg.type,
      answeredCount: 0,
      requiredCount: cfg.requiredCount,
      solved: false,
      labelObj: label,
      onSolved: cfg.onSolved || null,
    });
    return node;
  }
}
