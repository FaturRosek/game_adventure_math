import Phaser from "phaser";
import { uiManager } from "../systems/UIManager.js";
import { getAdventureModeConfig } from "../systems/adventure/AdventureModeConfig.js";
import { AdventureMissionState } from "../systems/adventure/AdventureMissionState.js";
import { AdventureSessionBridge } from "../systems/adventure/AdventureSessionBridge.js";
import { AdventurePhysicsController } from "../systems/adventure/AdventurePhysicsController.js";
import { AdventureEnemySystem } from '../systems/adventure/AdventureEnemySystem.js';
import { AdventureBossSystem } from '../systems/adventure/AdventureBossSystem.js';

export class SurvivalArenaScene extends Phaser.Scene {
  constructor() {
    super("SurvivalArenaScene");
  }

  init(data) {
    this.profile = data?.profile || uiManager.activeProfile || null;
    this.grade = Number(data?.grade) || Number(this.profile?.grade) || 3;
    this.subject = data?.subject || "matematika";
    this.levelKey = "hard";
    this.modeConfig = getAdventureModeConfig("hard");

    this.totalChallenges = this.modeConfig.totalChallenges;
    this.maxHearts = this.modeConfig.maxHearts;
    this.coinsCollected = 0;
    this.questionsAnswered = 0;
    this.correctAnswers = 0;
    this.wrongAnswers = 0;
    this.answerHistory = [];
    this.currentWave = 1;
    this.isQuizOpen = false;
    this.levelCompleted = false;

    this.movingPlatforms = [];
    this.sawTraps = [];
    this.arenaSpawn = { x: 220, y: 520 };

    this.touchState = {
      left: false,
      right: false,
      jump: false,
      attack: false,
      dash: false,
      specialSkill: false,
    };
  }

  ensureArenaTextures() {
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    const make = (key, w, h, fn) => {
      if (this.textures.exists(key)) return;
      g.clear();
      fn();
      g.generateTexture(key, w, h);
    };

    make("arena_saw", 56, 56, () => {
      g.fillStyle(0x475569, 1);
      g.fillCircle(28, 28, 22);
      g.fillStyle(0xe2e8f0, 1);
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        g.fillTriangle(
          28 + Math.cos(a) * 16,
          28 + Math.sin(a) * 16,
          28 + Math.cos(a + 0.25) * 28,
          28 + Math.sin(a + 0.25) * 28,
          28 + Math.cos(a + 0.5) * 16,
          28 + Math.sin(a + 0.5) * 16,
        );
      }
      g.fillStyle(0xef4444, 1);
      g.fillCircle(28, 28, 8);
    });

    make("arena_hourglass", 38, 46, () => {
      g.fillStyle(0x78350f, 1);
      g.fillRect(6, 4, 26, 6);
      g.fillRect(6, 36, 26, 6);
      g.fillStyle(0x38bdf8, 0.85);
      g.fillTriangle(10, 10, 28, 10, 19, 23);
      g.fillTriangle(19, 23, 10, 36, 28, 36);
      g.fillStyle(0xfacc15, 1);
      g.fillTriangle(14, 12, 24, 12, 19, 21);
    });

    make("arena_crystal", 54, 66, () => {
      g.fillStyle(0x7c3aed, 0.35);
      g.fillCircle(27, 33, 26);
      g.fillStyle(0x38bdf8, 1);
      g.fillTriangle(27, 4, 46, 32, 27, 62);
      g.fillStyle(0x818cf8, 1);
      g.fillTriangle(27, 4, 8, 32, 27, 62);
      g.fillStyle(0xfef08a, 1);
      g.fillCircle(27, 32, 8);
    });

    g.destroy();
  }

  create() {
    this.ensureArenaTextures();

    const w = this.scale.width || 1280;
    const h = this.scale.height || 720;
    this.physics.world.setBounds(0, 0, w, h + 100);

    this.renderArenaBackdrop(w, h);

    this.platforms = this.physics.add.staticGroup();
    this.movingPlatformsGroup = this.physics.add.group({
      allowGravity: false,
      immovable: true,
    });
    this.crumblingGroup = this.physics.add.staticGroup();
    this.bouncePadsGroup = this.physics.add.staticGroup();
    this.lavaGroup = this.physics.add.staticGroup();
    this.hazardsGroup = this.physics.add.group({
      allowGravity: false,
      immovable: true,
    });
    this.pickupsGroup = this.physics.add.group({
      allowGravity: false,
      immovable: true,
    });
    this.attackWavesGroup = this.physics.add.group({ allowGravity: false });

    this.missionState = new AdventureMissionState(this.modeConfig, {
      onObjectiveUpdated: (snap) => {
        this.bridge.syncHUD({ objectiveText: snap.summaryText });
      },
      onObjectiveCompleted: (obj) => {
        this.bridge.showTransientHint(`Gelombang selesai: ${obj.label}!`);
      },
      onTimerTick: (_sec, formatted) => {
        this.bridge.syncHUD({ timerText: formatted });
      },
      onTimerExpired: () => {
        if (this.levelCompleted) return;
        uiManager.playTone("wrong");
        this.controller.applyDamage(this.player.x, 1);
        this.missionState.addTime(40);
        this.respawnPlayer("Waktu survival habis! +40 detik darurat.");
      },
    });

    this.bridge = new AdventureSessionBridge(this, {
      profile: this.profile,
      grade: this.grade,
      subject: this.subject,
      levelKey: "hard",
      modeConfig: this.modeConfig,
      missionState: this.missionState,
    });

    this.buildSurvivalArenaLayout(w, h);

    const charId = this.profile?.character || "kiko";
    this.activeCharId = charId;
    const sheetKey = this.textures.exists(`player_sheet_${charId}`)
      ? `player_sheet_${charId}`
      : `player_${charId}`;

    this.player = this.physics.add.sprite(
      this.arenaSpawn.x,
      this.arenaSpawn.y,
      sheetKey,
    );
    this.player.setScale(0.84);
    this.player.setDepth(10);
    this.player.setCollideWorldBounds(true);
    this.player.body.setSize(40, 86);
    this.player.body.setOffset(28, 18);
    if (this.anims.exists(`${charId}_idle`)) {
      this.player.play(`${charId}_idle`);
    }

    this.controller = new AdventurePhysicsController(this, this.player, {
      charId,
      baseScale: 0.84,
      maxSpeed: 315,
      jumpVelocity: -630,
      maxHearts: this.maxHearts,
      combatConfig: this.modeConfig.combat,
      energyConfig: this.modeConfig.energy,
      onHeartsChanged: (hearts, maxHearts) =>
        this.bridge.syncHUD({ hearts, maxHearts }),
      onEnergyChanged: (energy, maxEnergy) =>
        this.bridge.syncHUD({ energy, maxEnergy }),
      onRespawnNeeded: () =>
        this.respawnPlayer("Nyawa pulih di titik aman Arena!"),
      onAttackFired: (x, y, dir, meta) => this.fireArenaAttack(x, y, dir, meta),
      onSpecialSkillFired: (x, y, dir) =>
        this.activateSurvivalShieldSkill(x, y, dir),
    });
    this.controller.dashCooldown = 580;

    this.enemySystem = new AdventureEnemySystem(this, {
      bridge: this.bridge,
      onEnemyDefeated: () => {
        this.coinsCollected += 15;
        if (this.controller && this.modeConfig?.energy?.gainOnHit) {
          this.controller.gainEnergy(this.modeConfig.energy.gainOnHit);
        }
        this.bridge.syncHUD({ coins: this.coinsCollected });
      }
    });
    this.enemySystem.bindCollisions(this.player, this.attackWavesGroup);

    this.bossSystem = new AdventureBossSystem(this, {
      bridge: this.bridge,
      onBossDefeated: (cfg) => {
        this.coinsCollected += 60;
        this.missionState.addTime(25);
        this.bridge.syncHUD({ coins: this.coinsCollected });
        this.bridge.showTransientHint(`${cfg.name} tumbang! +60 Koin! Selesaikan sisa Kristal Survival!`);
      }
    });
    this.bossSpawned = false;
    this.waveSpawnTimer = 2500;

    this.events.once('shutdown', () => {
      if (this.bossSystem) this.bossSystem.hideBossHUD();
    });

    this.physics.add.collider(this.player, this.platforms);
    this.physics.add.collider(
      this.player,
      this.movingPlatformsGroup,
      this.handleRideMovingPlatform,
      null,
      this,
    );
    this.physics.add.collider(
      this.player,
      this.crumblingGroup,
      this.handleStepCrumbling,
      null,
      this,
    );
    this.physics.add.overlap(
      this.player,
      this.bouncePadsGroup,
      this.handleBouncePad,
      null,
      this,
    );
    this.physics.add.overlap(
      this.player,
      this.lavaGroup,
      this.handleLavaHit,
      null,
      this,
    );
    this.physics.add.overlap(
      this.player,
      this.hazardsGroup,
      this.handleHazardHit,
      null,
      this,
    );
    this.physics.add.overlap(
      this.player,
      this.pickupsGroup,
      this.handleCollectPickup,
      null,
      this,
    );

    this.spawnSurvivalCrystal();

    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys({
      leftA: Phaser.Input.Keyboard.KeyCodes.A,
      rightD: Phaser.Input.Keyboard.KeyCodes.D,
      upW: Phaser.Input.Keyboard.KeyCodes.W,
      space: Phaser.Input.Keyboard.KeyCodes.SPACE,
      dashShift: Phaser.Input.Keyboard.KeyCodes.SHIFT,
      dashK: Phaser.Input.Keyboard.KeyCodes.K,
      attackJ: Phaser.Input.Keyboard.KeyCodes.J,
      attackX: Phaser.Input.Keyboard.KeyCodes.X,
      skillQ: Phaser.Input.Keyboard.KeyCodes.Q,
      skillL: Phaser.Input.Keyboard.KeyCodes.L,
    });

    this.bridge.syncHUD({
      hearts: this.controller.hearts,
      maxHearts: this.controller.maxHearts,
      energy: Math.floor(this.controller.energy),
      maxEnergy: this.controller.maxEnergy,
      timerText: this.missionState.formatTime(),
      objectiveText: this.missionState.getSummaryText(),
      coins: 0,
      answeredCount: 0,
      totalChallenges: this.totalChallenges,
    });

    const runtimeDebug = {
      sceneKey: this.scene.key,
      mode: `${this.levelKey} (${this.modeConfig.modeLabel})`,
      controller: 'AdventurePhysicsController (Survival Arena)',
      hudControlType: this.modeConfig.hudGenre,
      gravityY: this.physics.world.gravity.y
    };
    console.info('[PDP RUNTIME DEBUG]', runtimeDebug);
    this.bridge.syncHUD({ debugInfo: runtimeDebug });
  }

  renderArenaBackdrop(w, h) {
    const bgKey = this.textures.exists('hard_survival_bg') ? 'hard_survival_bg' : 'fantasy_world_bg';
    if (this.textures.exists(bgKey)) {
      const bg = this.add.image(w / 2, h / 2, bgKey).setDepth(-20);
      const scale = Math.max(w / bg.width, h / bg.height);
      bg.setScale(scale);
    }
    this.add.rectangle(w / 2, h / 2, w, h, 0x0f172a, 0.22).setDepth(-15);
  }

  buildSurvivalArenaLayout(w, h) {
    for (let x = 32; x < w; x += 64) {
      if ((x > 360 && x < 520) || (x > 760 && x < 920)) {
        const lava = this.lavaGroup.create(x, h - 22, "lava_tile");
        lava.body.setSize(64, 34);
        continue;
      }
      this.platforms.create(x, h - 32, "fortress_tile");
    }

    this.platforms.create(230, h - 200, "platform_fortress");
    this.platforms.create(w - 230, h - 200, "platform_fortress");

    this.createCrumbling(440, h - 210);
    this.createCrumbling(w - 440, h - 210);

    const centerLift = this.movingPlatformsGroup.create(
      w / 2,
      h - 320,
      "platform_moving_gold",
    );
    centerLift.setData({
      minX: w / 2 - 140,
      maxX: w / 2 + 140,
      speed: 120,
      dir: 1,
      prevX: w / 2,
    });
    this.movingPlatforms.push(centerLift);

    this.bouncePadsGroup
      .create(110, h - 78, "bounce_pad")
      .setData({ power: -820, lastBounce: 0 });
    this.bouncePadsGroup
      .create(w - 110, h - 78, "bounce_pad")
      .setData({ power: -820, lastBounce: 0 });

    const saw = this.hazardsGroup.create(w / 2, h - 86, "arena_saw");
    saw.setData({ minX: 540, maxX: 740, speed: 130, dir: 1 });
    this.sawTraps.push(saw);

    const fb1 = this.hazardsGroup.create(440, h - 40, "fireball_trap");
    this.tweens.add({
      targets: fb1,
      y: h - 340,
      duration: 1200,
      yoyo: true,
      repeat: -1,
      repeatDelay: 500,
    });

    const fb2 = this.hazardsGroup.create(w - 440, h - 40, "fireball_trap");
    this.tweens.add({
      targets: fb2,
      y: h - 340,
      duration: 1350,
      yoyo: true,
      repeat: -1,
      repeatDelay: 650,
      delay: 400,
    });

    const hg = this.pickupsGroup.create(w / 2, h - 380, "arena_hourglass");
    hg.setData({ kind: "hourglass", collected: false });
    this.tweens.add({
      targets: hg,
      y: h - 392,
      duration: 850,
      yoyo: true,
      repeat: -1,
    });
  }

  createCrumbling(x, y) {
    const tile = this.crumblingGroup.create(x, y, "crumble_tile");
    tile.setData({ triggered: false, originX: x, originY: y });
  }

  spawnSurvivalCrystal() {
    if (this.survivalCrystal) this.survivalCrystal.destroy();
    if (this.crystalLabel) this.crystalLabel.destroy();

    const spots = [
      { x: 640, y: 310 },
      { x: 230, y: 455 },
      { x: 1050, y: 455 },
      { x: 640, y: 560 },
    ];
    const spot = spots[this.questionsAnswered % spots.length];

    this.survivalCrystal = this.physics.add.staticImage(
      spot.x,
      spot.y,
      "arena_crystal",
    );
    this.survivalCrystal.setDepth(8);
    this.crystalLabel = this.add
      .text(
        spot.x,
        spot.y - 48,
        `Kristal Survival (${this.questionsAnswered}/${this.totalChallenges})`,
        {
          fontFamily: "Fredoka, Segoe UI, sans-serif",
          fontSize: "14px",
          fontStyle: "bold",
          color: "#fffbeb",
          backgroundColor: "#7c3aed",
          padding: { x: 8, y: 4 },
        },
      )
      .setOrigin(0.5)
      .setDepth(9);

    this.physics.add.overlap(
      this.player,
      this.survivalCrystal,
      this.handleTouchCrystal,
      null,
      this,
    );
  }

  handleTouchCrystal() {
    if (this.isQuizOpen || this.levelCompleted) return;
    this.bridge.triggerEducationChallenge({
      sourceType: "survival_crystal",
      title: `Segel Survival Gelombang ${this.currentWave}`,
      forceDifficulty: "sulit",
      onResolved: ({ isCorrect }) => {
        if (isCorrect) {
          this.missionState.addTime(15);
          this.bridge.showTransientHint(
            "Segel pecah! +15 detik waktu & +40 Energi!",
          );
        } else {
          this.bridge.showTransientHint(
            "Tetap waspada terhadap jebakan arena!",
          );
        }

        if (this.questionsAnswered >= this.totalChallenges) {
          if (this.bossSystem && this.bossSystem.active) this.bossSystem.defeatBoss();
          this.bridge.completeLevel({
            bonusCoins: 50,
            collectibleLabel: "Lencana Penyintas Benteng Lava",
          });
          return;
        }

        this.currentWave =
          this.questionsAnswered >= 6 ? 3 : this.questionsAnswered >= 3 ? 2 : 1;
        this.spawnSurvivalCrystal();
      },
    });
  }

  fireArenaAttack(x, y, dir, meta = {}) {
    uiManager.playTone("jump");
    const wave = this.attackWavesGroup.create(x, y, "attack_wave");
    wave.setFlipX(dir < 0);
    wave.setVelocityX(dir * 560);
    wave.setDepth(11);
    if (meta.comboStep === 3) {
      wave.setScale(1.3);
      wave.setTint(0xfacc15);
    }
    this.time.delayedCall(260, () => {
      if (wave && wave.active) wave.destroy();
    });
  }

  activateSurvivalShieldSkill(x, y, dir) {
    uiManager.playTone("correct");
    this.controller.invincibleTimer = Math.max(
      this.controller.invincibleTimer,
      2200,
    );
    const wave = this.attackWavesGroup.create(x, y, "attack_wave");
    wave.setFlipX(dir < 0);
    wave.setScale(1.8);
    wave.setTint(0x38bdf8);
    wave.setVelocityX(dir * 660);
    wave.setDepth(12);
    this.cameras.main.shake(100, 0.004);
    this.bridge.showTransientHint("Perisai Energi Aktif (Kebal 2 detik)!");
    this.time.delayedCall(400, () => {
      if (wave && wave.active) wave.destroy();
    });
  }

  handleRideMovingPlatform(player, plat) {
    if (player.body.touching.down && plat.body.touching.up) {
      const dx = plat.x - (plat.getData("prevX") ?? plat.x);
      if (Math.abs(dx) > 0.01) player.x += dx;
    }
  }

  handleStepCrumbling(player, tile) {
    if (!player.body.touching.down || tile.getData("triggered")) return;
    tile.setData("triggered", true);
    this.tweens.add({
      targets: tile,
      x: tile.x + 4,
      duration: 50,
      yoyo: true,
      repeat: 4,
    });
    this.time.delayedCall(500, () => {
      tile.disableBody(true, true);
      this.time.delayedCall(2800, () => {
        tile.enableBody(
          true,
          tile.getData("originX"),
          tile.getData("originY"),
          true,
          true,
        );
        tile.setData("triggered", false);
      });
    });
  }

  handleBouncePad(player, pad) {
    const now = this.time.now;
    if (now - pad.getData("lastBounce") < 280 || player.body.velocity.y < -80)
      return;
    pad.setData("lastBounce", now);
    uiManager.playTone("jump");
    this.controller.triggerBounce(pad.getData("power") || -820);
  }

  handleHazardHit(player, hazard) {
    if (this.isQuizOpen || this.levelCompleted) return;
    if (this.controller.applyDamage(hazard.x, 1)) {
      uiManager.playTone("wrong");
      this.bridge.showTransientHint(
        "Awas jebakan arena! Gunakan Dash (Shift) atau Perisai (Q)!",
      );
    }
  }

  handleLavaHit(player, lava) {
    if (this.isQuizOpen || this.levelCompleted) return;
    if (this.controller.applyDamage(lava.x, 1)) {
      uiManager.playTone("wrong");
      if (this.controller.hearts > 0)
        this.respawnPlayer("Terkena lava! Kembali ke pijakan aman.");
    }
  }

  handleCollectPickup(player, item) {
    if (item.getData("collected")) return;
    item.setData("collected", true);
    item.disableBody(true, true);
    if (item.getData("kind") === "hourglass") {
      this.missionState.addTime(20);
      uiManager.playTone("correct");
      this.bridge.showTransientHint(
        "Jam Pasir diambil! +20 detik waktu bertahan!",
      );
      this.time.delayedCall(18000, () => {
        if (!this.levelCompleted) {
          item.enableBody(true, item.x, item.y, true, true);
          item.setData("collected", false);
        }
      });
    }
  }

  respawnPlayer(msg) {
    this.player.setPosition(this.arenaSpawn.x, this.arenaSpawn.y);
    this.player.setVelocity(0, 0);
    if (msg) this.bridge.showTransientHint(msg);
  }

  updateSurvivalWaves(delta) {
    if (this.enemySystem) this.enemySystem.update(delta);
    if (this.bossSystem) this.bossSystem.update(delta);

    const w = this.scale.width || 1280;
    const h = this.scale.height || 720;

    if (!this.bossSpawned && this.questionsAnswered >= 6 && this.bossSystem) {
      this.bossSpawned = true;
      this.bossSystem.spawnBoss({
        bossType: 'lava_dragon',
        name: 'Naga Lava Kawah',
        x: w - 220,
        y: 230,
        minX: w - 420,
        maxX: w - 120,
        maxHp: 14,
        flying: true,
        orbSpawnX: 230,
        orbSpawnY: h - 255
      });
    }

    this.waveSpawnTimer -= delta;
    if (this.waveSpawnTimer <= 0 && this.enemySystem.getActiveCount() < 2) {
      this.waveSpawnTimer = this.currentWave >= 3 ? 6500 : 5200;
      const pool =
        this.currentWave === 1
          ? ['walker', 'flyer']
          : this.currentWave === 2
            ? ['hopper', 'shielded', 'flyer']
            : ['hopper', 'flyer'];
      const chosen = pool[Math.floor(Math.random() * pool.length)];
      const spawnY = chosen === 'flyer' ? 250 : h - 92;
      const spawnX = Math.random() < 0.5 ? 220 : w - 220;
      this.enemySystem.spawnEnemy({
        type: chosen,
        x: spawnX,
        y: spawnY,
        minX: Math.max(90, spawnX - 180),
        maxX: Math.min(w - 90, spawnX + 180)
      });
    }
  }

  update(time, delta) {
    if (
      !this.player ||
      !this.controller ||
      this.isQuizOpen ||
      this.levelCompleted
    )
      return;

    const dt = Math.min(delta, 40) / 1000;
    this.missionState.tick(delta);
    this.updateSurvivalWaves(delta);

    this.movingPlatforms.forEach((plat) => {
      plat.setData("prevX", plat.x);
      let dir = plat.getData("dir");
      plat.x += plat.getData("speed") * dir * dt;
      if (plat.x <= plat.getData("minX")) {
        plat.x = plat.getData("minX");
        dir = 1;
      }
      if (plat.x >= plat.getData("maxX")) {
        plat.x = plat.getData("maxX");
        dir = -1;
      }
      plat.setData("dir", dir);
      plat.body.updateFromGameObject();
    });

    this.sawTraps.forEach((saw) => {
      saw.angle += 280 * dt;
      let dir = saw.getData("dir");
      saw.x += saw.getData("speed") * dir * dt;
      if (saw.x <= saw.getData("minX")) {
        saw.x = saw.getData("minX");
        dir = 1;
      }
      if (saw.x >= saw.getData("maxX")) {
        saw.x = saw.getData("maxX");
        dir = -1;
      }
      saw.setData("dir", dir);
      saw.body.updateFromGameObject();
    });

    this.controller.update(delta, {
      left:
        this.cursors.left.isDown ||
        this.keys.leftA.isDown ||
        this.touchState.left,
      right:
        this.cursors.right.isDown ||
        this.keys.rightD.isDown ||
        this.touchState.right,
      jump:
        this.cursors.up.isDown ||
        this.keys.upW.isDown ||
        this.keys.space.isDown ||
        this.touchState.jump,
      dash:
        Phaser.Input.Keyboard.JustDown(this.keys.dashShift) ||
        Phaser.Input.Keyboard.JustDown(this.keys.dashK) ||
        this.touchState.dash,
      attack:
        Phaser.Input.Keyboard.JustDown(this.keys.attackJ) ||
        Phaser.Input.Keyboard.JustDown(this.keys.attackX) ||
        this.touchState.attack,
      specialSkill:
        Phaser.Input.Keyboard.JustDown(this.keys.skillQ) ||
        Phaser.Input.Keyboard.JustDown(this.keys.skillL) ||
        this.touchState.specialSkill,
      onJumpSound: () => uiManager.playTone("jump"),
      onNotEnoughEnergy: () =>
        this.bridge.showTransientHint("Energi belum cukup untuk Perisai (Q)!"),
    });

    this.touchState.attack = false;
    this.touchState.dash = false;
    this.touchState.specialSkill = false;
  }
}
