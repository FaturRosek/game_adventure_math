import Phaser from "phaser";
import { uiManager } from "../systems/UIManager.js";
import { characterAssetManager } from "../systems/CharacterAssetManager.js";
import { getAdventureModeConfig } from "../systems/adventure/AdventureModeConfig.js";
import { AdventureMissionState } from "../systems/adventure/AdventureMissionState.js";
import { AdventureSessionBridge } from "../systems/adventure/AdventureSessionBridge.js";

export class LavaAdventureScene extends Phaser.Scene {
  constructor() {
    super("LavaAdventureScene");
  }

  init(data) {
    this.profile = data?.profile || uiManager.activeProfile || null;
    this.grade = Number(data?.grade) || Number(this.profile?.grade) || 3;
    this.subject = data?.subject || "matematika";
    this.levelKey = "hard";
    this.modeConfig = getAdventureModeConfig("hard");

    this.worldW = 3040;
    this.worldH = 720;
    this.totalChallenges = this.modeConfig.totalChallenges;
    this.maxHearts = this.modeConfig.maxHearts;
    this.hearts = this.maxHearts;

    this.coinsCollected = 0;
    this.gemsCollected = 0;
    this.questionsAnswered = 0;
    this.correctAnswers = 0;
    this.wrongAnswers = 0;
    this.answerHistory = [];
    this.isQuizOpen = false;
    this.levelCompleted = false;

    this.activeCheckpoint = { x: 140, y: this.worldH - 170 };
    this.invincibleTimer = 0;
    this.hurtAnimTimer = 0;
    this.wasGrounded = false;
    this.coyoteTimer = 0;
    this.jumpBufferTimer = 0;
    this.prevJumpHeld = false;
    this.dustTimer = 0;
    this.movingPlatforms = [];

    this.touchState = { left: false, right: false, jump: false };
  }

  ensureLavaTextures() {
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    const make = (key, w, h, fn) => {
      if (this.textures.exists(key)) return;
      g.clear();
      fn();
      g.generateTexture(key, w, h);
    };

    make("lv_stone_wide", 240, 42, () => {
      g.fillStyle(0x1e293b, 1);
      g.fillRoundedRect(0, 2, 240, 40, 11);
      g.fillStyle(0x475569, 1);
      g.fillRoundedRect(4, 6, 232, 30, 8);
      g.fillStyle(0xf97316, 1);
      g.fillRoundedRect(10, 4, 220, 8, 4);
    });

    make("lv_crumble_wide", 164, 34, () => {
      g.fillStyle(0x78350f, 1);
      g.fillRoundedRect(0, 0, 164, 34, 8);
      g.fillStyle(0xb45309, 1);
      g.fillRoundedRect(4, 4, 156, 26, 6);
      g.lineStyle(2, 0x451a03, 1);
      g.lineBetween(48, 4, 58, 19);
      g.lineBetween(114, 4, 104, 23);
    });

    make("lv_quiz_crystal", 60, 66, () => {
      g.fillStyle(0xf97316, 0.3);
      g.fillCircle(30, 33, 28);
      g.fillStyle(0xf59e0b, 1);
      g.fillTriangle(30, 4, 54, 33, 30, 62);
      g.fillStyle(0xfef08a, 1);
      g.fillTriangle(30, 4, 8, 33, 30, 62);
    });

    make("lv_quiz_crystal_open", 60, 66, () => {
      g.fillStyle(0x22c55e, 0.35);
      g.fillCircle(30, 33, 28);
      g.fillStyle(0x16a34a, 1);
      g.fillTriangle(30, 6, 52, 33, 30, 60);
      g.fillStyle(0x86efac, 1);
      g.fillTriangle(30, 6, 10, 33, 30, 60);
    });

    g.destroy();
  }

  create() {
    this.physics.world.gravity.y = 920;
    this.physics.world.setBounds(0, 0, this.worldW, this.worldH + 120);
    this.ensureLavaTextures();

    this.renderLavaBackdrop();

    this.platforms = this.physics.add.staticGroup();
    this.movingPlatformsGroup = this.physics.add.group({
      allowGravity: false,
      immovable: true,
    });
    this.crumblingGroup = this.physics.add.staticGroup();
    this.checkpointsGroup = this.physics.add.staticGroup();
    this.lavaGroup = this.physics.add.staticGroup();
    this.geysersGroup = this.physics.add.group({
      allowGravity: false,
      immovable: true,
    });
    this.coinsGroup = this.physics.add.group({
      allowGravity: false,
      immovable: true,
    });
    this.gemsGroup = this.physics.add.group({
      allowGravity: false,
      immovable: true,
    });
    this.quizBoxesGroup = this.physics.add.staticGroup();

    this.missionState = new AdventureMissionState(this.modeConfig, {
      onObjectiveUpdated: (snap) =>
        this.bridge.syncHUD({ objectiveText: snap.summaryText }),
      onObjectiveCompleted: (obj) =>
        this.bridge.showTransientHint(`Misi tercapai: ${obj.label}!`),
    });

    this.bridge = new AdventureSessionBridge(this, {
      profile: this.profile,
      grade: this.grade,
      subject: this.subject,
      levelKey: "hard",
      modeConfig: this.modeConfig,
      missionState: this.missionState,
    });

    this.buildFriendlyLavaFortress();

    const charId = characterAssetManager.resolveCharacterId(
      this.profile?.character || "kiko",
    );
    this.activeCharId = charId;
    if (!this.textures.exists(`player_sheet_${charId}`)) {
      characterAssetManager.buildTexturesAndAnimations(this);
    }

    this.baseScale = 0.58;
    this.player = this.physics.add.sprite(
      this.activeCheckpoint.x,
      this.activeCheckpoint.y,
      `player_sheet_${charId}`,
    );
    this.player.setScale(this.baseScale);
    this.player.setDepth(10);
    this.player.setCollideWorldBounds(true);
    this.player.body.setSize(76, 164);
    this.player.body.setOffset(58, 44);
    if (this.anims.exists(`${charId}_idle`)) this.player.play(`${charId}_idle`);

    this.physics.add.collider(this.player, this.platforms);
    this.physics.add.collider(
      this.player,
      this.movingPlatformsGroup,
      this.handleRidePlatform,
      null,
      this,
    );
    this.physics.add.collider(
      this.player,
      this.crumblingGroup,
      this.handleStepCrumble,
      null,
      this,
    );
    this.physics.add.overlap(
      this.player,
      this.checkpointsGroup,
      this.handleCheckpoint,
      null,
      this,
    );
    this.physics.add.overlap(
      this.player,
      this.lavaGroup,
      this.handleTouchLava,
      null,
      this,
    );
    this.physics.add.overlap(
      this.player,
      this.geysersGroup,
      this.handleTouchLava,
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
      this.gemsGroup,
      this.handleCollectGem,
      null,
      this,
    );
    this.physics.add.overlap(
      this.player,
      this.quizBoxesGroup,
      this.handleTouchQuizBox,
      null,
      this,
    );
    this.physics.add.overlap(
      this.player,
      this.finishFlag,
      this.handleReachFinish,
      null,
      this,
    );

    this.cameras.main.setBounds(0, 0, this.worldW, this.worldH);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys({
      a: Phaser.Input.Keyboard.KeyCodes.A,
      d: Phaser.Input.Keyboard.KeyCodes.D,
      w: Phaser.Input.Keyboard.KeyCodes.W,
      space: Phaser.Input.Keyboard.KeyCodes.SPACE,
    });

    this.bridge.syncHUD({
      hearts: this.hearts,
      maxHearts: this.maxHearts,
      coins: 0,
      collectibles: 0,
      answeredCount: 0,
      totalChallenges: this.totalChallenges,
      objectiveText: this.missionState.getSummaryText(),
    });
  }

  renderLavaBackdrop() {
    const viewW = this.scale.width || 1280;
    const viewH = this.scale.height || 720;
    const bgKey = this.textures.exists("hard_survival_bg")
      ? "hard_survival_bg"
      : "fantasy_world_bg";
    if (this.textures.exists(bgKey)) {
      const bg1 = this.add
        .image(viewW / 2, viewH / 2, bgKey)
        .setDepth(-20)
        .setScrollFactor(0.14, 0);
      const scale = Math.max((viewW * 1.35) / bg1.width, viewH / bg1.height);
      bg1.setScale(scale);
      const bg2 = this.add
        .image(bg1.x + bg1.displayWidth - 2, viewH / 2, bgKey)
        .setDepth(-20)
        .setScrollFactor(0.14, 0);
      bg2.setScale(scale).setFlipX(true);
    }
    this.add
      .rectangle(viewW / 2, viewH / 2, viewW, viewH, 0xf97316, 0.08)
      .setScrollFactor(0)
      .setDepth(-15);
  }

  addLabel(x, y, text, bg = "#9a3412") {
    return this.add
      .text(x, y, text, {
        fontFamily: "Fredoka, Segoe UI, sans-serif",
        fontSize: "15px",
        fontStyle: "bold",
        color: "#fffbeb",
        backgroundColor: bg,
        padding: { x: 10, y: 5 },
      })
      .setOrigin(0.5)
      .setDepth(6);
  }

  addQuizCrystal(x, y, idx) {
    const node = this.quizBoxesGroup.create(x, y, "lv_quiz_crystal");
    node.setDepth(7);
    const lbl = this.addLabel(x, y - 52, `Soal ${idx}`, "#b45309");
    node.setData({ idx, solved: false, labelObj: lbl });
  }

  addCheckpoint(x, y, name) {
    const flag = this.checkpointsGroup
      .create(x, y, "checkpoint_idle")
      .setScale(1.08);
    flag.setDepth(7);
    const lbl = this.addLabel(x, y - 68, name, "#475569");
    flag.setData({ activated: false, name, labelObj: lbl });
  }

  spawnDust(x, y, count = 3) {
    if (!this.textures.exists("dust_puff")) return;
    for (let i = 0; i < count; i++) {
      const p = this.add
        .image(x + (Math.random() - 0.5) * 24, y - 4, "dust_puff")
        .setDepth(6)
        .setAlpha(0.75)
        .setScale(0.7);
      this.tweens.add({
        targets: p,
        x: p.x + (Math.random() - 0.5) * 28,
        y: p.y - 12 - Math.random() * 12,
        alpha: 0,
        scale: 1.35,
        duration: 280,
        onComplete: () => p.destroy(),
      });
    }
  }

  playSquashStretch(sx, sy, dur = 95) {
    this.tweens.add({
      targets: this.player,
      scaleX: this.baseScale * sx,
      scaleY: this.baseScale * sy,
      duration: dur,
      yoyo: true,
      ease: "Quad.easeOut",
    });
  }

  buildFriendlyLavaFortress() {
    const h = this.worldH;

    const isLava = (x) =>
      (x > 610 && x < 870) || (x > 1380 && x < 1660) || (x > 2180 && x < 2460);

    for (let x = 32; x < this.worldW; x += 64) {
      if (isLava(x)) {
        const l = this.lavaGroup.create(x, h - 22, "lava_tile");
        l.body.setSize(64, 30);
        continue;
      }
      this.platforms.create(x, h - 32, "fortress_tile");
    }

    [
      [380, h - 175],
      [1080, h - 175],
      [1260, h - 260],
      [1860, h - 175],
      [2040, h - 260],
      [2680, h - 175],
    ].forEach(([x, y]) => this.platforms.create(x, y, "lv_stone_wide"));

    const c1 = this.crumblingGroup.create(740, h - 150, "lv_crumble_wide");
    c1.setData({ triggered: false, originX: 740, originY: h - 150 });

    const m1 = this.movingPlatformsGroup
      .create(1520, h - 155, "platform_moving_gold")
      .setScale(1.1, 1);
    m1.setData({ minX: 1440, maxX: 1600, speed: 70, dir: 1, prevX: 1520 });
    this.movingPlatforms.push(m1);

    const m2 = this.movingPlatformsGroup
      .create(2320, h - 155, "platform_moving_gold")
      .setScale(1.1, 1);
    m2.setData({ minX: 2240, maxX: 2400, speed: 76, dir: 1, prevX: 2320 });
    this.movingPlatforms.push(m2);

    [
      { x: 740, peakY: h - 240, delay: 0 },
      { x: 2320, peakY: h - 255, delay: 900 },
    ].forEach((gCfg) => {
      const fb = this.geysersGroup.create(gCfg.x, h - 30, "fireball_trap");
      this.tweens.add({
        targets: fb,
        y: gCfg.peakY,
        duration: 1480,
        yoyo: true,
        repeat: -1,
        hold: 300,
        repeatDelay: 1250,
        delay: gCfg.delay,
        ease: "Sine.easeOut",
      });
    });

    this.addCheckpoint(520, h - 114, "Checkpoint 1");
    this.addCheckpoint(970, h - 114, "Checkpoint 2");
    this.addCheckpoint(1750, h - 114, "Checkpoint 3");
    this.addCheckpoint(2550, h - 114, "Checkpoint 4");

    [
      [270, h - 102, 1],
      [380, h - 230, 2],
      [930, h - 102, 3],
      [1080, h - 230, 4],
      [1260, h - 315, 5],
      [1860, h - 230, 6],
      [2040, h - 315, 7],
      [2120, h - 102, 8],
      [2680, h - 230, 9],
      [2810, h - 102, 10],
    ].forEach(([x, y, idx]) => this.addQuizCrystal(x, y, idx));

    [
      [440, h - 230],
      [740, h - 210],
      [1520, h - 220],
      [2320, h - 220],
      [2680, h - 235],
    ].forEach(([x, y]) => {
      const c = this.coinsGroup.create(x, y, "coin_gold").setScale(1.12);
      c.setData("collected", false);
      this.tweens.add({
        targets: c,
        y: y - 7,
        duration: 750,
        yoyo: true,
        repeat: -1,
      });
    });

    [
      [1260, h - 370],
      [2040, h - 370],
      [2680, h - 295],
    ].forEach(([x, y]) => {
      const gItem = this.gemsGroup.create(x, y, "secret_gem").setScale(1.12);
      gItem.setData("collected", false);
      this.tweens.add({
        targets: gItem,
        y: y - 8,
        duration: 850,
        yoyo: true,
        repeat: -1,
      });
    });

    this.finishFlag = this.physics.add
      .staticImage(2935, h - 140, "finish_flag")
      .setScale(1.1);
    this.addLabel(2935, h - 235, "GERBANG FINIS BENTENG", "#16a34a");
  }

  handleRidePlatform(player, plat) {
    if (player.body.touching.down && plat.body.touching.up) {
      const dx = plat.x - (plat.getData("prevX") ?? plat.x);
      if (Math.abs(dx) > 0.01) player.x += dx;
    }
  }

  handleStepCrumble(player, tile) {
    if (!player.body.touching.down || tile.getData("triggered")) return;
    tile.setData("triggered", true);
    this.tweens.add({
      targets: tile,
      x: tile.x + 3,
      duration: 85,
      yoyo: true,
      repeat: 6,
    });
    this.time.delayedCall(1100, () => {
      tile.disableBody(true, true);
      this.time.delayedCall(2500, () => {
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

  handleCheckpoint(player, flag) {
    if (flag.getData("activated")) return;
    flag.setData("activated", true);
    flag.setTexture("checkpoint_active");
    const lbl = flag.getData("labelObj");
    if (lbl) {
      lbl.setText(`${flag.getData("name")} Aktif!`);
      lbl.setStyle({ backgroundColor: "#16a34a" });
    }
    this.activeCheckpoint = { x: flag.x, y: flag.y - 45 };
    uiManager.playTone("correct");
    this.bridge.showTransientHint("Checkpoint aman tersimpan!");
  }

  handleTouchLava() {
    if (this.invincibleTimer > 0 || this.isQuizOpen || this.levelCompleted)
      return;
    this.invincibleTimer = 1450;
    this.hurtAnimTimer = 320;
    this.hearts = Math.max(0, this.hearts - 1);
    uiManager.playTone("wrong");
    this.cameras.main.shake(120, 0.005);

    if (this.hearts <= 0) {
      this.hearts = this.maxHearts;
    }
    this.bridge.syncHUD({ hearts: this.hearts, maxHearts: this.maxHearts });

    this.player.setPosition(this.activeCheckpoint.x, this.activeCheckpoint.y);
    this.player.setVelocity(0, 0);
    this.bridge.showTransientHint(
      "Awas lava panas! Kamu kembali aman di Checkpoint terakhir.",
    );
  }

  handleCollectCoin(player, coin) {
    if (coin.getData("collected")) return;
    coin.setData("collected", true);
    coin.disableBody(true, true);
    this.coinsCollected += 5;
    uiManager.playTone("coin");
    this.bridge.syncHUD({ coins: this.coinsCollected });
  }

  handleCollectGem(player, gem) {
    if (gem.getData("collected")) return;
    gem.setData("collected", true);
    gem.disableBody(true, true);
    this.gemsCollected += 1;
    this.coinsCollected += 20;
    this.missionState.updateProgressByType("collectible", 1);
    uiManager.playTone("correct");
    this.bridge.syncHUD({
      coins: this.coinsCollected,
      collectibles: this.gemsCollected,
    });
    this.bridge.showTransientHint("Kristal Lava ditemukan! +20 Koin!");
  }

  handleTouchQuizBox(player, box) {
    if (this.isQuizOpen || box.getData("solved")) return;
    const idx = box.getData("idx");
    this.bridge.triggerEducationChallenge({
      sourceType: "lava_quiz_crystal",
      title: `Tantangan Benteng Lava #${idx}`,
      forceDifficulty: "sulit",
      onResolved: ({ isCorrect }) => {
        box.setData("solved", true);
        box.setTexture("lv_quiz_crystal_open");
        const lbl = box.getData("labelObj");
        if (lbl) {
          lbl.setText(`Soal ${idx} Selesai!`);
          lbl.setStyle({ backgroundColor: "#16a34a" });
        }
        this.bridge.showTransientHint(
          isCorrect
            ? "Luar biasa! Jawaban tepat! +25 Koin!"
            : "Tetap semangat! Terus lanjutkan langkahmu.",
        );
      },
    });
  }

  handleReachFinish() {
    if (this.levelCompleted || this.isQuizOpen) return;
    if (this.questionsAnswered < this.totalChallenges) {
      this.bridge.showTransientHint(
        `Selesaikan semua soal benteng dahulu (${this.questionsAnswered}/${this.totalChallenges})!`,
      );
      this.player.setX(this.player.x - 55);
      return;
    }
    this.bridge.completeLevel({
      bonusCoins: 50,
      collectibleLabel:
        this.gemsCollected > 0 ? `Kristal Lava (${this.gemsCollected})` : "",
    });
  }

  update(time, delta) {
    if (!this.player || this.isQuizOpen || this.levelCompleted) return;
    const dt = Math.min(delta, 40) / 1000;

    if (this.invincibleTimer > 0) {
      this.invincibleTimer = Math.max(0, this.invincibleTimer - delta);
      this.player.setAlpha(
        Math.floor(this.invincibleTimer / 90) % 2 === 0 ? 0.5 : 1,
      );
      if (this.invincibleTimer === 0) this.player.setAlpha(1);
    }
    if (this.hurtAnimTimer > 0) {
      this.hurtAnimTimer = Math.max(0, this.hurtAnimTimer - delta);
    }

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

    const left =
      this.cursors.left.isDown || this.keys.a.isDown || this.touchState.left;
    const right =
      this.cursors.right.isDown || this.keys.d.isDown || this.touchState.right;
    const jumpHeld =
      this.cursors.up.isDown ||
      this.keys.w.isDown ||
      this.keys.space.isDown ||
      this.touchState.jump;

    const moveDir = (right ? 1 : 0) - (left ? 1 : 0);
    this.player.setVelocityX(moveDir * 290);
    if (moveDir !== 0) this.player.setFlipX(moveDir < 0);

    const grounded =
      this.player.body.blocked.down || this.player.body.touching.down;
    if (grounded && !this.wasGrounded && this.player.body.velocity.y >= 0) {
      this.playSquashStretch(1.13, 0.87, 85);
      this.spawnDust(this.player.x, this.player.body.bottom, 4);
    }
    this.wasGrounded = grounded;

    this.coyoteTimer = grounded ? 135 : Math.max(0, this.coyoteTimer - delta);
    const jumpPressed = jumpHeld && !this.prevJumpHeld;
    this.prevJumpHeld = jumpHeld;
    this.jumpBufferTimer = jumpPressed
      ? 135
      : Math.max(0, this.jumpBufferTimer - delta);

    if (this.jumpBufferTimer > 0 && this.coyoteTimer > 0) {
      this.player.setVelocityY(-635);
      this.jumpBufferTimer = 0;
      this.coyoteTimer = 0;
      uiManager.playTone("jump");
      this.playSquashStretch(0.88, 1.14, 100);
      this.spawnDust(this.player.x, this.player.body.bottom, 4);
    }

    if (grounded && moveDir !== 0) {
      this.dustTimer -= delta;
      if (this.dustTimer <= 0) {
        this.spawnDust(
          this.player.x - moveDir * 18,
          this.player.body.bottom,
          1,
        );
        this.dustTimer = 190;
      }
    }

    if (this.player.y > this.worldH + 70) {
      this.handleTouchLava();
      return;
    }

    const cid = this.activeCharId;
    let anim = `${cid}_idle`;
    if (this.hurtAnimTimer > 0) anim = `${cid}_hurt`;
    else if (!grounded)
      anim = this.player.body.velocity.y < 0 ? `${cid}_jump` : `${cid}_fall`;
    else if (moveDir !== 0) anim = `${cid}_run`;

    if (
      this.anims.exists(anim) &&
      this.player.anims.currentAnim?.key !== anim
    ) {
      this.player.play(anim, true);
    }
  }
}
