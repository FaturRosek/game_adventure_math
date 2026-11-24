import { GAME_CONFIG } from "../config/gameConfig.js";

export class AdventureLevelBuilder {
  static buildLevel(scene) {
    const levelKey = scene.levelKey || "easy";
    if (levelKey === "medium") {
      return this.buildTempleBiome(scene);
    }
    if (levelKey === "hard") {
      return this.buildSkyFortressBiome(scene);
    }
    return this.buildFantasyValleyBiome(scene);
  }

  static renderParallaxFantasyBg(scene, tintHex = null, overlayAlpha = 0) {
    const viewW = scene.scale.width || GAME_CONFIG.width || 1280;
    const viewH = scene.scale.height || GAME_CONFIG.height || 720;

    if (scene.textures.exists("fantasy_world_bg")) {
      const bg1 = scene.add.image(viewW / 2, viewH / 2, "fantasy_world_bg");
      const scale = Math.max((viewW * 1.35) / bg1.width, viewH / bg1.height);
      bg1.setScale(scale);
      bg1.setScrollFactor(0.14, 0);
      bg1.setDepth(-20);
      if (tintHex) bg1.setTint(tintHex);

      const bg2 = scene.add.image(
        bg1.x + bg1.displayWidth - 2,
        viewH / 2,
        "fantasy_world_bg",
      );
      bg2.setScale(scale);
      bg2.setFlipX(true);
      bg2.setScrollFactor(0.14, 0);
      bg2.setDepth(-20);
      if (tintHex) bg2.setTint(tintHex);
    } else {
      const fallback = scene.add.graphics().setDepth(-20).setScrollFactor(0);
      fallback.fillGradientStyle(0x0ea5e9, 0x0ea5e9, 0xbae6fd, 0xbae6fd, 1);
      fallback.fillRect(0, 0, viewW, viewH);
    }

    if (overlayAlpha > 0 && tintHex) {
      const veil = scene.add.rectangle(
        viewW / 2,
        viewH / 2,
        viewW,
        viewH,
        tintHex,
        overlayAlpha,
      );
      veil.setScrollFactor(0);
      veil.setDepth(-15);
    }
  }

  static buildFantasyValleyBiome(scene) {
    const worldW = GAME_CONFIG.worldWidth || 3600;
    const worldH = GAME_CONFIG.worldHeight || 720;
    const subjLabel = scene.getSubjectLabel();
    const [q1, q2, q3, q4] = scene.boxDistribution;

    this.renderParallaxFantasyBg(scene, null, 0);

    for (let x = 32; x < worldW; x += 64) {
      if (x > 1360 && x < 1560) continue;
      scene.platforms.create(x, worldH - 32, "ground_tile");
    }

    const floating = [
      { x: 480, y: worldH - 165 },
      { x: 820, y: worldH - 250 },
      { x: 1180, y: worldH - 180 },
      { x: 1460, y: worldH - 210 },
      { x: 1860, y: worldH - 185 },
      { x: 2240, y: worldH - 265 },
      { x: 2620, y: worldH - 190 },
      { x: 3180, y: worldH - 215 },
    ];
    floating.forEach((p) => scene.platforms.create(p.x, p.y, "platform_wood"));

    scene.createMovingPlatform({
      x: 1460,
      y: worldH - 125,
      texture: "platform_moving_gold",
      moveType: "horizontal",
      minX: 1360,
      maxX: 1580,
      speed: 90,
      active: true,
    });

    scene.spawnPatrolEnemy(640, worldH - 92, 500, 780, 75, 0xa855f7);
    scene.spawnPatrolEnemy(1180, worldH - 220, 1100, 1260, 70, 0xec4899);
    scene.spawnPatrolEnemy(2040, worldH - 92, 1880, 2200, 85, 0xf97316);
    scene.spawnPatrolEnemy(2780, worldH - 92, 2640, 2890, 90, 0xa855f7);

    const coins = [
      { x: 300, y: worldH - 105 },
      { x: 360, y: worldH - 105 },
      { x: 440, y: worldH - 220 },
      { x: 520, y: worldH - 220 },
      { x: 780, y: worldH - 305 },
      { x: 860, y: worldH - 305 },
      { x: 1420, y: worldH - 265 },
      { x: 1500, y: worldH - 265 },
      { x: 1820, y: worldH - 240 },
      { x: 1900, y: worldH - 240 },
      { x: 2200, y: worldH - 320 },
      { x: 2280, y: worldH - 320 },
      { x: 2620, y: worldH - 245 },
      { x: 3180, y: worldH - 270 },
      { x: 3420, y: worldH - 105 },
    ];
    this.spawnCoinList(scene, coins);

    [1010, 2400, 3320].forEach((x) =>
      scene.obstaclesGroup.create(x, worldH - 82, "obstacle_spike"),
    );

    this.createChallengeNode(scene, {
      x: 820,
      y: worldH - 294,
      texture: "chest_closed",
      id: "chal_1",
      baseName: "Peti Lembah 1",
      title: `Peti Lembah ${subjLabel} 1`,
      type: "chest",
      requiredCount: q1,
      labelColor: "#b45309",
    });

    this.createChallengeNode(scene, {
      x: 1700,
      y: worldH - 98,
      texture: "npc_owl",
      id: "chal_2",
      baseName: "Penjaga Lembah",
      title: `Misi Pemandu (${subjLabel})`,
      type: "npc",
      requiredCount: q2,
      labelColor: "#6d28d9",
    });

    this.createChallengeNode(scene, {
      x: 2240,
      y: worldH - 309,
      texture: "chest_closed",
      id: "chal_3",
      baseName: "Peti Menara 2",
      title: `Peti Menara ${subjLabel} 2`,
      type: "chest",
      requiredCount: q3,
      labelColor: "#b45309",
    });

    scene.gateObject = this.createChallengeNode(scene, {
      x: 2980,
      y: worldH - 132,
      texture: "math_gate",
      id: "chal_4",
      baseName: "Gerbang Kastil",
      title: `Gerbang Kastil ${subjLabel}`,
      type: "gate",
      requiredCount: q4,
      labelColor: "#991b1b",
    });
  }

  static buildTempleBiome(scene) {
    const worldW = GAME_CONFIG.worldWidth || 3600;
    const worldH = GAME_CONFIG.worldHeight || 720;
    const subjLabel = scene.getSubjectLabel();
    const [q1, q2, q3, q4] = scene.boxDistribution;

    const viewW = scene.scale.width || GAME_CONFIG.width || 1280;
    const viewH = scene.scale.height || GAME_CONFIG.height || 720;
    const bgKey = scene.textures.exists('medium_battle_bg') ? 'medium_battle_bg' : 'fantasy_world_bg';

    if (scene.textures.exists(bgKey)) {
      const bg1 = scene.add.image(viewW / 2, viewH / 2, bgKey);
      const scale = Math.max((viewW * 1.35) / bg1.width, viewH / bg1.height);
      bg1.setScale(scale).setScrollFactor(0.16, 0).setDepth(-20);

      const bg2 = scene.add.image(bg1.x + bg1.displayWidth - 2, viewH / 2, bgKey);
      bg2.setScale(scale).setFlipX(true).setScrollFactor(0.16, 0).setDepth(-20);
    }

    for (let x = 32; x < worldW; x += 64) {
      if ((x > 1020 && x < 1260) || (x > 2180 && x < 2420)) {
        continue;
      }
      scene.platforms.create(x, worldH - 32, 'twilight_tile');
    }

    [280, 880, 1480, 2060, 2660, 3260].forEach((tx) => {
      const torch = scene.add.image(tx, worldH - 102, 'torch_pillar').setDepth(2);
      scene.tweens.add({ targets: torch, scaleY: 1.04, duration: 480, yoyo: true, repeat: -1 });
    });

    [
      { x: 480, y: worldH - 165 },
      { x: 780, y: worldH - 250 },
      { x: 1520, y: worldH - 185 },
      { x: 1840, y: worldH - 275 },
      { x: 2660, y: worldH - 190 },
      { x: 3260, y: worldH - 210 }
    ].forEach((p) => scene.platforms.create(p.x, p.y, 'platform_twilight'));

    scene.createMovingPlatform({
      x: 1140,
      y: worldH - 135,
      texture: 'platform_moving_gold',
      moveType: 'horizontal',
      minX: 1040,
      maxX: 1240,
      speed: 95,
      active: true
    });

    scene.createMovingPlatform({
      x: 2300,
      y: worldH - 150,
      texture: 'platform_moving_gold',
      moveType: 'horizontal',
      minX: 2200,
      maxX: 2400,
      speed: 105,
      active: true
    });

    scene.createBouncePad(620, worldH - 78, -790);
    scene.createBouncePad(1980, worldH - 78, -810);

    scene.createCheckpoint(1360, worldH - 110, 'Checkpoint 1');
    scene.createCheckpoint(2540, worldH - 110, 'Checkpoint 2');

    scene.createSecretGem(780, worldH - 315);
    scene.createSecretGem(1840, worldH - 340);
    scene.createSecretGem(3260, worldH - 275);
    scene.createHeartPickup(1680, worldH - 115);

    scene.spawnTypedEnemy({ type: 'walker', x: 560, y: worldH - 92, minX: 420, maxX: 740, speed: 95 });
    scene.spawnTypedEnemy({ type: 'hopper', x: 900, y: worldH - 92, minX: 800, maxX: 980, speed: 92 });
    scene.spawnTypedEnemy({ type: 'flyer', x: 1660, y: worldH - 255, minX: 1460, maxX: 1880, speed: 115 });
    scene.spawnTypedEnemy({ type: 'shielded', x: 2040, y: worldH - 96, minX: 1920, maxX: 2140, speed: 68 });
    scene.spawnTypedEnemy({ type: 'hopper', x: 2780, y: worldH - 92, minX: 2620, maxX: 2900, speed: 105 });

    this.spawnCoinList(scene, [
      { x: 340, y: worldH - 105 }, { x: 400, y: worldH - 105 },
      { x: 450, y: worldH - 220 }, { x: 510, y: worldH - 220 },
      { x: 1140, y: worldH - 200 }, { x: 1480, y: worldH - 240 },
      { x: 1560, y: worldH - 240 }, { x: 2300, y: worldH - 215 },
      { x: 2660, y: worldH - 245 }, { x: 3420, y: worldH - 105 }
    ]);

    this.createChallengeNode(scene, {
      x: 780,
      y: worldH - 302,
      texture: 'battle_totem',
      id: 'chal_1',
      baseName: 'Totem Senja 1',
      title: `Totem Pertarungan 1 (${subjLabel})`,
      type: 'totem',
      requiredCount: q1,
      labelColor: '#6d28d9'
    });

    this.createChallengeNode(scene, {
      x: 1520,
      y: worldH - 240,
      texture: 'npc_owl',
      id: 'chal_2',
      baseName: 'Ksatria Pengintai',
      title: `Misi Pengintai Benteng (${subjLabel})`,
      type: 'npc',
      requiredCount: q2,
      labelColor: '#1d4ed8'
    });

    this.createChallengeNode(scene, {
      x: 2660,
      y: worldH - 242,
      texture: 'battle_totem',
      id: 'chal_3',
      baseName: 'Totem Senja 2',
      title: `Totem Pertarungan 2 (${subjLabel})`,
      type: 'totem',
      requiredCount: q3,
      labelColor: '#6d28d9'
    });

    scene.gateObject = this.createChallengeNode(scene, {
      x: 3020,
      y: worldH - 132,
      texture: 'math_gate',
      id: 'chal_4',
      baseName: 'Gerbang Benteng Senja',
      title: `Gerbang Benteng Senja (${subjLabel})`,
      type: 'gate',
      requiredCount: q4,
      labelColor: '#991b1b'
    });
  }

    static buildSkyFortressBiome(scene) {
    const worldW = GAME_CONFIG.worldWidth || 3600;
    const worldH = GAME_CONFIG.worldHeight || 720;
    const subjLabel = scene.getSubjectLabel();
    const [q1, q2, q3, q4] = scene.boxDistribution;

    this.renderParallaxFantasyBg(scene, 0xfca5a5, 0.22);

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

    scene.platforms.create(420, worldH - 155, "platform_fortress");
    scene.platforms.create(1120, worldH - 210, "platform_fortress");
    scene.platforms.create(1980, worldH - 210, "platform_fortress");
    scene.platforms.create(2840, worldH - 185, "platform_fortress");
    scene.platforms.create(3280, worldH - 215, "platform_fortress");

    scene.createCrumblingPlatform(660, worldH - 185);
    scene.createCrumblingPlatform(820, worldH - 225);
    scene.createCrumblingPlatform(2280, worldH - 210);

    scene.createMovingPlatform({
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
      "Jembatan Benteng Terkunci",
      "#b45309",
    );

    scene.spawnFireballTrap(740, worldH - 40, worldH - 310);
    scene.spawnFireballTrap(1560, worldH - 40, worldH - 320);
    scene.spawnFireballTrap(2420, worldH - 40, worldH - 330);

    scene.spawnPatrolEnemy(1120, worldH - 92, 980, 1260, 110, 0xef4444);
    scene.spawnPatrolEnemy(1960, worldH - 92, 1820, 2120, 115, 0xf97316);
    scene.spawnPatrolEnemy(2860, worldH - 92, 2720, 2960, 120, 0xef4444);

    [1250, 3140, 3420].forEach((x) =>
      scene.obstaclesGroup.create(x, worldH - 82, "obstacle_spike"),
    );

    this.spawnCoinList(scene, [
      { x: 420, y: worldH - 210 },
      { x: 660, y: worldH - 240 },
      { x: 1480, y: worldH - 265 },
      { x: 2280, y: worldH - 265 },
      { x: 2840, y: worldH - 240 },
      { x: 3280, y: worldH - 270 },
    ]);

    this.createChallengeNode(scene, {
      x: 420,
      y: worldH - 200,
      texture: "chest_closed",
      id: "chal_1",
      baseName: "Peti Benteng 1",
      title: `Peti Benteng ${subjLabel} 1`,
      type: "chest",
      requiredCount: q1,
      labelColor: "#b45309",
    });

    this.createChallengeNode(scene, {
      x: 1120,
      y: worldH - 262,
      texture: "npc_owl",
      id: "chal_2",
      baseName: "Penjaga Benteng",
      title: `Penjaga Benteng (${subjLabel})`,
      type: "npc",
      requiredCount: q2,
      labelColor: "#6d28d9",
    });

    this.createChallengeNode(scene, {
      x: 1980,
      y: worldH - 252,
      texture: "switch_off",
      id: "chal_3",
      baseName: "Sakelar Benteng",
      title: `Sakelar Benteng (${subjLabel})`,
      type: "switch",
      requiredCount: q3,
      labelColor: "#b45309",
      onSolved: () => {
        lavaBridge2.setData("active", true);
        lavaBridge2Hint.setText("Jembatan Benteng Aktif!");
      },
    });

    scene.gateObject = this.createChallengeNode(scene, {
      x: 3040,
      y: worldH - 132,
      texture: "math_gate",
      id: "chal_4",
      baseName: "Gerbang Benteng",
      title: `Gerbang Benteng (${subjLabel})`,
      type: "gate",
      requiredCount: q4,
      labelColor: "#991b1b",
    });
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
    const labelOffset = cfg.type === "gate" ? 90 : 56;
    const label = scene.addFloatingLabel(
      cfg.x,
      cfg.y - labelOffset,
      `${cfg.baseName} (0/${cfg.requiredCount})`,
      cfg.labelColor || "#2b1810",
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
