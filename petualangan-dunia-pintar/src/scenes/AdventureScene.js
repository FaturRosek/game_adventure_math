import Phaser from "phaser";
import { GAME_CONFIG } from "../config/gameConfig.js";
import { questionManager } from "../systems/QuestionManager.js";
import { uiManager } from "../systems/UIManager.js";
import { db } from "../storage/db.js";
import { AdventureLevelBuilder } from "../systems/AdventureLevelBuilder.js";
import { AdventurePhysicsController } from "../systems/adventure/AdventurePhysicsController.js";
import { getAdventureModeConfig } from '../systems/adventure/AdventureModeConfig.js';
import { AdventureMissionState } from '../systems/adventure/AdventureMissionState.js';
import { AdventureSessionBridge } from '../systems/adventure/AdventureSessionBridge.js';
import { AdventureEnemySystem } from '../systems/adventure/AdventureEnemySystem.js';
import { AdventureBossSystem } from '../systems/adventure/AdventureBossSystem.js';

export class AdventureScene extends Phaser.Scene {
  constructor() {
    super("AdventureScene");
  }

  init(data) {
    this.profile = data?.profile || uiManager.activeProfile || null;
    this.grade = Number(data?.grade) || Number(this.profile?.grade) || 3;
    this.subject = data?.subject || 'matematika';
    this.levelKey = data?.levelKey || 'medium';
    this.modeConfig = getAdventureModeConfig(this.levelKey);

    this.totalChallenges = this.modeConfig.totalChallenges;
    this.boxDistribution = [...this.modeConfig.boxDistribution];
    this.maxHearts = this.modeConfig.maxHearts;

    this.coinsCollected = 0;
    this.secretGemsCollected = 0;
    this.enemiesDefeated = 0;
    this.questionsAnswered = 0;
    this.correctAnswers = 0;
    this.wrongAnswers = 0;
    this.answerHistory = [];
    this.isQuizOpen = false;
    this.levelCompleted = false;

    const worldH = GAME_CONFIG.worldHeight || 720;
    this.activeCheckpoint = { x: 120, y: worldH - 160 };
    this.movingPlatforms = [];
    this.crumblingPlatforms = [];
    this.checkpoints = [];
    this.secretZones = [];
    this.patrolEnemies = [];

    this.touchState = {
      left: false,
      right: false,
      jump: false,
      attack: false,
      dash: false,
      specialSkill: false
    };
  }

  getSubjectLabel() {
    const info = GAME_CONFIG.subjects.find((s) => s.id === this.subject);
    return info ? info.name : String(this.subject).toUpperCase();
  }

  create() {
    try {
      questionManager.resetSession();

      const worldW = GAME_CONFIG.worldWidth || 3600;
      const worldH = GAME_CONFIG.worldHeight || 720;
      this.physics.world.setBounds(0, 0, worldW, worldH + 140);

      this.platforms = this.physics.add.staticGroup();
      this.movingPlatformsGroup = this.physics.add.group({
        allowGravity: false,
        immovable: true,
      });
      this.crumblingGroup = this.physics.add.staticGroup();
      this.bouncePadsGroup = this.physics.add.staticGroup();
      this.checkpointsGroup = this.physics.add.staticGroup();
      this.coinsGroup = this.physics.add.group({
        allowGravity: false,
        immovable: true,
      });
      this.secretGemsGroup = this.physics.add.group({
        allowGravity: false,
        immovable: true,
      });
      this.heartPickupsGroup = this.physics.add.group({
        allowGravity: false,
        immovable: true,
      });
      this.obstaclesGroup = this.physics.add.staticGroup();
      this.lavaGroup = this.physics.add.staticGroup();
      this.fireballsGroup = this.physics.add.group({
        allowGravity: false,
        immovable: true,
      });
      this.challengesGroup = this.physics.add.staticGroup();
      this.enemiesGroup = this.physics.add.group({
        allowGravity: false,
        immovable: true,
      });
      this.attackWavesGroup = this.physics.add.group({ allowGravity: false });

      this.missionState = new AdventureMissionState(this.modeConfig, {
        onObjectiveUpdated: (snap) => {
          uiManager.updateAdventureHUD({ objectiveText: snap.summaryText });
        },
        onObjectiveCompleted: (obj) => {
          this.showTransientHint(`Misi tercapai: ${obj.label}!`);
        },
        onTimerTick: (_sec, formatted) => {
          uiManager.updateAdventureHUD({ timerText: formatted });
        },
        onTimerExpired: () => {
          if (this.levelCompleted) return;
          uiManager.playTone('wrong');
          this.controller.applyDamage(this.player.x, 1);
          this.missionState.addTime(45);
          this.respawnAtCheckpoint('Waktu habis! +45 detik tambahan di Checkpoint.');
        }
      });

      this.bridge = new AdventureSessionBridge(this, {
        profile: this.profile,
        grade: this.grade,
        subject: this.subject,
        levelKey: this.levelKey,
        modeConfig: this.modeConfig,
        missionState: this.missionState
      });

      this.enemySystem = new AdventureEnemySystem(this, {
        bridge: this.bridge,
        onEnemyDefeated: () => {
          this.coinsCollected += 15;
          this.enemiesDefeated += 1;
          this.missionState.updateProgressByType('combat', 1);
          if (this.controller && this.modeConfig?.energy?.gainOnHit) {
            this.controller.gainEnergy(this.modeConfig.energy.gainOnHit);
          }
          uiManager.updateAdventureHUD({ coins: this.coinsCollected });
        }
      });

      this.bossSystem = new AdventureBossSystem(this, {
        bridge: this.bridge,
        onBossDefeated: (cfg) => {
          this.coinsCollected += 45;
          uiManager.updateAdventureHUD({ coins: this.coinsCollected });
          this.showTransientHint(`${cfg.name} dikalahkan! +45 Koin! Lari menuju GARIS FINIS!`);
        }
      });

      this.events.once('shutdown', () => {
        if (this.bossSystem) this.bossSystem.hideBossHUD();
      });

      AdventureLevelBuilder.buildLevel(this);

      const charId = this.profile?.character || "kiko";
      this.activeCharId = charId;
      this.basePlayerScale = 0.84;

      const sheetKey = this.textures.exists(`player_sheet_${charId}`)
        ? `player_sheet_${charId}`
        : `player_${charId}`;

      this.player = this.physics.add.sprite(
        this.activeCheckpoint.x,
        this.activeCheckpoint.y,
        sheetKey,
      );
      this.player.setScale(this.basePlayerScale);
      this.player.setDepth(10);
      this.player.setCollideWorldBounds(true);
      this.player.setBounce(0.02);
      this.player.body.setSize(40, 86);
      this.player.body.setOffset(28, 18);

      this.enemySystem.bindCollisions(this.player, this.attackWavesGroup);
      this.bossTriggered = false;

      this.controller = new AdventurePhysicsController(this, this.player, {
        charId,
        baseScale: this.basePlayerScale,
        maxSpeed: GAME_CONFIG.playerSpeed || 295,
        jumpVelocity: GAME_CONFIG.playerJumpVelocity || -610,
        maxHearts: this.maxHearts,
        combatConfig: this.modeConfig.combat,
        energyConfig: this.modeConfig.energy,
        onHeartsChanged: (hearts, maxHearts) => {
          uiManager.updateAdventureHUD({ hearts, maxHearts });
        },
        onEnergyChanged: (energy, maxEnergy) => {
          uiManager.updateAdventureHUD({ energy, maxEnergy });
        },
        onRespawnNeeded: () => {
          this.respawnAtCheckpoint('Nyawa pulih di Checkpoint terakhir! Ayo lanjutkan!');
        },
        onAttackFired: (x, y, dir, meta) => {
          this.fireAttackWave(x, y, dir, meta);
        },
        onSpecialSkillFired: (x, y, dir) => {
          this.fireSpecialSkillWave(x, y, dir);
        }
      });

      if (this.anims.exists(`${charId}_idle`)) {
        this.player.play(`${charId}_idle`);
      }

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

      if (this.gateObject) {
        this.gateCollider = this.physics.add.collider(
          this.player,
          this.gateObject,
          this.handleTriggerChallenge,
          null,
          this
        );
      }

      this.physics.add.overlap(
        this.player,
        this.bouncePadsGroup,
        this.handleBouncePad,
        null,
        this,
      );
      this.physics.add.overlap(
        this.player,
        this.checkpointsGroup,
        this.handleReachCheckpoint,
        null,
        this,
      );
      this.physics.add.overlap(
        this.player,
        this.coinsGroup,
        this.handleCollectCoin,
        null,
        this,
      );
      this.physics.add.overlap(
        this.player,
        this.secretGemsGroup,
        this.handleCollectSecretGem,
        null,
        this,
      );
      this.physics.add.overlap(
        this.player,
        this.heartPickupsGroup,
        this.handleCollectHeart,
        null,
        this,
      );
      this.physics.add.overlap(
        this.player,
        this.obstaclesGroup,
        this.handleHitHazard,
        null,
        this,
      );
      this.physics.add.overlap(
        this.player,
        this.lavaGroup,
        this.handleHitLava,
        null,
        this,
      );
      this.physics.add.overlap(
        this.player,
        this.fireballsGroup,
        this.handleHitHazard,
        null,
        this,
      );
      this.physics.add.overlap(
        this.player,
        this.challengesGroup,
        this.handleTriggerChallenge,
        null,
        this,
      );
      this.physics.add.overlap(
        this.player,
        this.enemiesGroup,
        this.handlePlayerEnemyContact,
        null,
        this,
      );
      this.physics.add.overlap(
        this.attackWavesGroup,
        this.enemiesGroup,
        this.handleAttackHitEnemy,
        null,
        this,
      );

      this.finishFlag = this.physics.add.staticImage(
        worldW - 140,
        worldH - 134,
        "finish_flag",
      );
      this.addFloatingLabel(
        worldW - 140,
        worldH - 222,
        "GARIS FINIS",
        "#16a34a",
      );
      this.physics.add.overlap(
        this.player,
        this.finishFlag,
        this.handleReachFinish,
        null,
        this,
      );

      this.cameras.main.setBounds(0, 0, worldW, worldH);
      this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

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

      const missionSnap = this.missionState?.getSnapshot();
      uiManager.updateAdventureHUD({
        hearts: this.controller.hearts,
        maxHearts: this.controller.maxHearts,
        energy: this.controller.energy,
        maxEnergy: this.controller.maxEnergy,
        timerText: missionSnap?.timerText || '',
        objectiveText: missionSnap?.summaryText || '',
        collectibles: this.secretGemsCollected,
        coins: this.coinsCollected,
        answeredCount: this.questionsAnswered,
        totalChallenges: this.totalChallenges,
      });

      const runtimeDebug = {
        sceneKey: this.scene.key,
        mode: `${this.levelKey} (${this.modeConfig.modeLabel})`,
        controller: 'AdventurePhysicsController (Platformer)',
        hudControlType: this.modeConfig.hudGenre,
        gravityY: this.physics.world.gravity.y
      };
      console.info('[PDP RUNTIME DEBUG]', runtimeDebug);
      uiManager.updateAdventureHUD({ debugInfo: runtimeDebug });
    } catch (err) {
      console.error("AdventureScene create error:", err);
      uiManager.updateAdventureHUD({
        hintText: `Gagal memuat arena: ${err.message}`,
      });
    }
  }

  spawnCorePlatformerEnhancements(worldW, worldH) {
    this.createCheckpoint(1300, worldH - 110, "Checkpoint 1");
    this.createCheckpoint(2540, worldH - 110, "Checkpoint 2");

    this.createBouncePad(600, worldH - 78, -790);
    this.createBouncePad(2060, worldH - 78, -810);

    this.createSecretGem(600, worldH - 380);
    this.createSecretGem(2060, worldH - 385);
    this.createSecretGem(worldW - 310, worldH - 295);

    this.createHeartPickup(1760, worldH - 125);

    const secretPlat = this.platforms.create(
      600,
      worldH - 338,
      "platform_wood",
    );
    secretPlat.setTint(0xfde047);
    this.createSecretZone(
      600,
      worldH - 380,
      160,
      90,
      "Area Rahasia Ditemukan! (+30 Koin)",
    );
  }

  spawnPatrolEnemy(x, y, minX, maxX, speed = 80, tint = null) {
    const enemy = this.enemiesGroup.create(x, y, "enemy_slime");
    enemy.setDepth(9);
    if (tint) enemy.setTint(tint);
    enemy.setData({ minX, maxX, speed, dir: 1, hp: 1, defeated: false });
    this.tweens.add({
      targets: enemy,
      scaleY: 0.88,
      scaleX: 1.08,
      duration: 420,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
    this.patrolEnemies.push(enemy);
    return enemy;
  }

  addFloatingLabel(x, y, text, bgColor = "#2b1810") {
    return this.add
      .text(x, y, text, {
        fontFamily: "Fredoka, Segoe UI, sans-serif",
        fontSize: "15px",
        fontStyle: "bold",
        color: "#fffbeb",
        backgroundColor: bgColor,
        padding: { x: 10, y: 5 },
      })
      .setOrigin(0.5)
      .setDepth(6);
  }

  createMovingPlatform({
    x,
    y,
    texture = "platform_moving_gold",
    moveType = "horizontal",
    minX,
    maxX,
    minY,
    maxY,
    speed = 110,
    active = true,
  }) {
    const plat = this.movingPlatformsGroup.create(x, y, texture);
    plat.setData({
      moveType,
      minX: minX ?? x - 120,
      maxX: maxX ?? x + 120,
      minY: minY ?? y - 120,
      maxY: maxY ?? y + 120,
      speed,
      dir: 1,
      active,
      prevX: x,
      prevY: y,
    });
    this.movingPlatforms.push(plat);
    return plat;
  }

  createCrumblingPlatform(x, y) {
    const tile = this.crumblingGroup.create(x, y, "crumble_tile");
    tile.setData({ triggered: false, originX: x, originY: y });
    this.crumblingPlatforms.push(tile);
    return tile;
  }

  createBouncePad(x, y, power = -780) {
    const pad = this.bouncePadsGroup.create(x, y, "bounce_pad");
    pad.setData({ power, lastBounce: 0 });
    return pad;
  }

  createCheckpoint(x, y, label = "Checkpoint") {
    const flag = this.checkpointsGroup.create(x, y, "checkpoint_idle");
    const lbl = this.addFloatingLabel(x, y - 62, label, "#475569");
    flag.setData({ activated: false, labelObj: lbl, name: label });
    this.checkpoints.push(flag);
    return flag;
  }

  createSecretGem(x, y) {
    const gem = this.secretGemsGroup.create(x, y, "secret_gem");
    gem.setData("collected", false);
    this.tweens.add({
      targets: gem,
      y: y - 10,
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
    return gem;
  }

  createHeartPickup(x, y) {
    const heart = this.heartPickupsGroup.create(x, y, "heart_pickup");
    heart.setData("collected", false);
    this.tweens.add({
      targets: heart,
      y: y - 7,
      duration: 850,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
    return heart;
  }

  createSecretZone(x, y, w, h, message) {
    this.secretZones.push({
      bounds: new Phaser.Geom.Rectangle(x - w / 2, y - h / 2, w, h),
      discovered: false,
      message,
    });
  }

  spawnFireballTrap(x, startY, peakY) {
    const fb = this.fireballsGroup.create(x, startY, "fireball_trap");
    this.tweens.add({
      targets: fb,
      y: peakY,
      duration: 1100,
      yoyo: true,
      repeat: -1,
      hold: 180,
      repeatDelay: 420,
      ease: "Sine.easeOut",
    });
    return fb;
  }

  fireAttackWave(x, y, dir, meta = {}) {
    uiManager.playTone('jump');
    const wave = this.attackWavesGroup.create(x, y, 'attack_wave');
    wave.setFlipX(dir < 0);
    wave.setVelocityX(dir * 540);
    wave.setDepth(11);
    if (meta.comboStep === 3) {
      wave.setScale(1.3);
      wave.setTint(0xfacc15);
    } else if (meta.isJumpAttack) {
      wave.setTint(0x38bdf8);
    }
    wave.setData({ power: meta.power || 1, dir, isSpecial: false });
    this.time.delayedCall(270, () => {
      if (wave && wave.active) wave.destroy();
    });
  }

  fireSpecialSkillWave(x, y, dir) {
    uiManager.playTone('correct');
    const wave = this.attackWavesGroup.create(x, y, 'attack_wave');
    wave.setFlipX(dir < 0);
    wave.setScale(1.75);
    wave.setTint(0xf59e0b);
    wave.setVelocityX(dir * 640);
    wave.setDepth(12);
    wave.setData({ power: 3, dir, isSpecial: true });
    this.cameras.main.shake(110, 0.004);
    this.showTransientHint('Skill Spesial diluncurkan!');
    this.time.delayedCall(420, () => {
      if (wave && wave.active) wave.destroy();
    });
  }

  defeatEnemy(enemy) {
    if (!enemy || enemy.getData("defeated")) return;
    enemy.setData("defeated", true);
    enemy.disableBody(true, false);

    this.enemiesDefeated += 1;
    if (this.missionState) this.missionState.updateProgressByType('combat', 1);
    if (this.controller && this.modeConfig?.energy?.gainOnHit) this.controller.gainEnergy(this.modeConfig.energy.gainOnHit);

    this.coinsCollected += 10;
    uiManager.playTone("coin");
    uiManager.updateAdventureHUD({ coins: this.coinsCollected });
    this.controller.spawnDustBurst(enemy.x, enemy.y, 7);

    this.tweens.add({
      targets: enemy,
      scaleX: 1.4,
      scaleY: 0.2,
      alpha: 0,
      duration: 220,
      onComplete: () => enemy.destroy(),
    });
  }

  handleAttackHitEnemy(wave, enemy) {
    if (!enemy || enemy.getData("defeated")) return;
    if (wave && wave.active) wave.destroy();
    this.defeatEnemy(enemy);
    this.showTransientHint("Penjaga dikalahkan! +10 Koin!");
  }

  handlePlayerEnemyContact(player, enemy) {
    if (this.isQuizOpen || this.levelCompleted || enemy.getData("defeated"))
      return;
    const isStomp = player.body.velocity.y > 40 && player.y < enemy.y - 8;
    if (isStomp) {
      this.defeatEnemy(enemy);
      this.controller.triggerBounce(-460);
      this.showTransientHint("Injakan tepat! +10 Koin!");
      return;
    }
    const damaged = this.controller.applyDamage(enemy.x, 1);
    if (damaged) {
      uiManager.playTone("wrong");
      this.showTransientHint(
        "Tekan J / tombol SERANG atau lompat di atas musuh!",
      );
    }
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
      duration: 55,
      yoyo: true,
      repeat: 5,
    });
    this.time.delayedCall(540, () => {
      tile.disableBody(true, true);
      this.time.delayedCall(3200, () => {
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
    if (now - pad.getData("lastBounce") < 280) return;
    if (player.body.velocity.y < -80) return;
    pad.setData("lastBounce", now);
    uiManager.playTone("jump");
    this.controller.triggerBounce(pad.getData("power") || -780);
    this.tweens.add({
      targets: pad,
      scaleY: 0.65,
      scaleX: 1.2,
      duration: 90,
      yoyo: true,
    });
  }

  handleReachCheckpoint(player, flag) {
    if (flag.getData("activated")) return;
    flag.setData("activated", true);
    flag.setTexture("checkpoint_active");
    if (this.missionState) this.missionState.updateProgressByType('checkpoint', 1);
    const lbl = flag.getData("labelObj");
    if (lbl) {
      lbl.setText(`${flag.getData("name")} Aktif!`);
      lbl.setStyle({ backgroundColor: "#16a34a" });
    }
    this.activeCheckpoint = { x: flag.x, y: flag.y - 35 };
    uiManager.playTone("correct");
    this.showTransientHint("Checkpoint aktif! Posisi aman tersimpan.");
  }

  handleCollectCoin(player, coin) {
    if (coin.getData("collected")) return;
    coin.setData("collected", true);
    coin.disableBody(true, true);
    this.coinsCollected += 5;
    uiManager.playTone("coin");
    uiManager.updateAdventureHUD({ coins: this.coinsCollected });
  }

  handleCollectSecretGem(player, gem) {
    if (gem.getData("collected")) return;
    gem.setData("collected", true);
    gem.disableBody(true, true);
    this.secretGemsCollected += 1;
    if (this.missionState) this.missionState.updateProgressByType('collectible', 1);
    this.coinsCollected += 20;
    uiManager.playTone("correct");
    uiManager.updateAdventureHUD({
      coins: this.coinsCollected,
      collectibles: this.secretGemsCollected,
    });
    this.showTransientHint("Permata Rahasia ditemukan! +20 Koin!");
  }

  handleCollectHeart(player, heart) {
    if (heart.getData("collected")) return;
    if (!this.controller.heal(1)) return;
    heart.setData("collected", true);
    heart.disableBody(true, true);
    uiManager.playTone("correct");
    this.showTransientHint("Nyawa bertambah +1 Hati!");
  }

  handleHitHazard(player, hazard) {
    if (this.isQuizOpen || this.levelCompleted) return;
    if (this.controller.applyDamage(hazard.x, 1)) {
      uiManager.playTone("wrong");
      this.showTransientHint(
        "Awas rintangan! Lompati atau gunakan Dash (Shift)!",
      );
    }
  }

  handleHitLava(player, lava) {
    if (this.isQuizOpen || this.levelCompleted) return;
    if (this.controller.applyDamage(lava.x, 1)) {
      uiManager.playTone("wrong");
      if (this.controller.hearts > 0) {
        this.respawnAtCheckpoint(
          "Hati-hati lava panas! Kembali ke Checkpoint.",
        );
      }
    }
  }

  respawnAtCheckpoint(message) {
    this.player.setPosition(this.activeCheckpoint.x, this.activeCheckpoint.y);
    this.player.setVelocity(0, 0);
    if (message) this.showTransientHint(message);
  }

  showTransientHint(text) {
    uiManager.updateAdventureHUD({ hintText: text });
    if (this.hintTimer) this.hintTimer.remove(false);
    this.hintTimer = this.time.delayedCall(2600, () => {
      uiManager.updateAdventureHUD({ hintText: "" });
    });
  }

  triggerEducationChallenge(opts) {
    return this.bridge.triggerEducationChallenge(opts);
  }

  handleTriggerChallenge(player, challengeObj) {
    if (this.isQuizOpen || challengeObj.getData('solved')) return;

    const title = challengeObj.getData('title');
    const type = challengeObj.getData('type');
    const baseName = challengeObj.getData('baseName') || 'Tantangan';
    const requiredCount = challengeObj.getData('requiredCount') || 1;

    this.triggerEducationChallenge({
      sourceType: type || 'challenge_node',
      title,
      onResolved: ({ isCorrect }) => {
        const nextAnswered = (challengeObj.getData('answeredCount') || 0) + 1;
        challengeObj.setData('answeredCount', nextAnswered);

        const labelObj = challengeObj.getData('labelObj');
        const gateQuotaMet = type === 'gate' && this.questionsAnswered >= this.totalChallenges;

        if (nextAnswered >= requiredCount || gateQuotaMet) {
          challengeObj.setData('solved', true);
          if (type === 'chest') challengeObj.setTexture('chest_open');
          else if (type === 'totem') challengeObj.setTexture('battle_totem_open');
          else if (type === 'switch') challengeObj.setTexture('switch_on');
          else if (type === 'gate') {
            if (this.gateCollider) {
              this.physics.world.removeCollider(this.gateCollider);
              this.gateCollider = null;
            }
            challengeObj.disableBody(true, true);
          } else if (type === 'npc') challengeObj.setTint(0xbbf7d0);

          if (labelObj) {
            labelObj.setText(`${baseName} Selesai!`);
            labelObj.setStyle({ backgroundColor: '#16a34a' });
          }

          const onSolved = challengeObj.getData('onSolved');
          if (typeof onSolved === 'function') onSolved();
        } else {
          if (labelObj) labelObj.setText(`${baseName} (${nextAnswered}/${requiredCount})`);
          const pushDir = player.x < challengeObj.x ? -1 : 1;
          player.setX(Math.max(40, player.x + pushDir * 52));
        }

        this.showTransientHint(
          isCorrect
            ? 'Jawaban tepat! +25 Koin pengetahuan!'
            : 'Tetap semangat! Terus lanjutkan penjelajahanmu.'
        );
      }
    });
  }

  handleReachFinish() {
    if (this.levelCompleted || this.isQuizOpen) return;

    if (this.questionsAnswered < this.totalChallenges) {
      this.showTransientHint(
        `Selesaikan semua soal (${this.questionsAnswered}/${this.totalChallenges}) sebelum finis!`,
      );
      this.player.setX(this.player.x - 45);
      return;
    }

    this.bridge.completeLevel({
      bonusCoins: 30,
      collectibleLabel: this.secretGemsCollected > 0 ? `Permata Rahasia (${this.secretGemsCollected})` : '',
    });
  }

  updateMovingPlatforms(delta) {
    const dt = Math.min(delta, 40) / 1000;
    this.movingPlatforms.forEach((plat) => {
      plat.setData("prevX", plat.x);
      plat.setData("prevY", plat.y);
      if (!plat.getData("active")) return;
      const speed = plat.getData("speed");
      let dir = plat.getData("dir");
      if (plat.getData("moveType") === "vertical") {
        plat.y += speed * dir * dt;
        if (plat.y <= plat.getData("minY")) {
          plat.y = plat.getData("minY");
          dir = 1;
        }
        if (plat.y >= plat.getData("maxY")) {
          plat.y = plat.getData("maxY");
          dir = -1;
        }
      } else {
        plat.x += speed * dir * dt;
        if (plat.x <= plat.getData("minX")) {
          plat.x = plat.getData("minX");
          dir = 1;
        }
        if (plat.x >= plat.getData("maxX")) {
          plat.x = plat.getData("maxX");
          dir = -1;
        }
      }
      plat.setData("dir", dir);
      plat.body.updateFromGameObject();
    });
  }

  updatePatrolEnemies(delta) {
    const dt = Math.min(delta, 40) / 1000;
    this.patrolEnemies.forEach((enemy) => {
      if (!enemy || !enemy.active || enemy.getData("defeated")) return;
      let dir = enemy.getData("dir");
      enemy.x += enemy.getData("speed") * dir * dt;
      if (enemy.x <= enemy.getData("minX")) {
        enemy.x = enemy.getData("minX");
        dir = 1;
        enemy.setFlipX(false);
      } else if (enemy.x >= enemy.getData("maxX")) {
        enemy.x = enemy.getData("maxX");
        dir = -1;
        enemy.setFlipX(true);
      }
      enemy.setData("dir", dir);
      enemy.body.updateFromGameObject();
    });
  }

  checkSecretZones() {
    this.secretZones.forEach((z) => {
      if (z.discovered) return;
      if (
        Phaser.Geom.Rectangle.Contains(z.bounds, this.player.x, this.player.y)
      ) {
        z.discovered = true;
        this.coinsCollected += 30;
        uiManager.playTone("correct");
        uiManager.updateAdventureHUD({ coins: this.coinsCollected });
        this.showTransientHint(z.message);
      }
    });
  }

  spawnTypedEnemy(cfg) {
    if (this.enemySystem) return this.enemySystem.spawnEnemy(cfg);
    return null;
  }

  update(time, delta) {
    if (
      !this.player ||
      !this.controller ||
      this.isQuizOpen ||
      this.levelCompleted
    )
      return;

    if (this.missionState) this.missionState.tick(delta);

    if (this.enemySystem) this.enemySystem.update(delta);
    if (this.bossSystem) this.bossSystem.update(delta);

    if (!this.bossTriggered && this.player.x > 2960 && this.bossSystem) {
      this.bossTriggered = true;
      const worldH = GAME_CONFIG.worldHeight || 720;
      this.bossSystem.spawnBoss({
        bossType: 'twilight_knight',
        name: 'Ksatria Senja',
        x: 3280,
        y: worldH - 122,
        minX: 3120,
        maxX: 3400,
        maxHp: 10,
        flying: false,
        orbSpawnX: 3150,
        orbSpawnY: worldH - 140
      });
    }

    this.updateMovingPlatforms(delta);
    this.updatePatrolEnemies(delta);
    this.checkSecretZones();

    if (this.player.y > (GAME_CONFIG.worldHeight || 720) + 70) {
      this.controller.applyDamage(this.player.x, 1);
      if (this.controller.hearts > 0) {
        this.respawnAtCheckpoint("Jatuh ke jurang! Kembali ke Checkpoint.");
      }
      return;
    }

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
      onNotEnoughEnergy: () => this.showTransientHint('Energi belum cukup untuk Skill Spesial!'),
      onJumpSound: () => uiManager.playTone("jump"),
    });

    this.touchState.attack = false;
    this.touchState.dash = false;
    this.touchState.specialSkill = false;
  }
}
