import Phaser from "phaser";
import { uiManager } from "../systems/UIManager.js";
import { characterAssetManager } from "../systems/CharacterAssetManager.js";
import { getAdventureModeConfig } from "../systems/adventure/AdventureModeConfig.js";
import { AdventureMissionState } from "../systems/adventure/AdventureMissionState.js";
import { AdventureSessionBridge } from "../systems/adventure/AdventureSessionBridge.js";

export class OceanExplorerScene extends Phaser.Scene {
  constructor() {
    super("OceanExplorerScene");
  }

  init(data) {
    this.profile = data?.profile || uiManager.activeProfile || null;
    this.grade = Number(data?.grade) || Number(this.profile?.grade) || 3;
    this.subject = data?.subject || "matematika";
    this.levelKey = "medium";
    this.modeConfig = getAdventureModeConfig("medium");

    this.worldW = 2680;
    this.worldH = 1040;
    this.waterSurfaceY = 415;

    this.totalChallenges = this.modeConfig.totalChallenges;
    this.coinsCollected = 0;
    this.pearlsCollected = 0;
    this.questionsAnswered = 0;
    this.correctAnswers = 0;
    this.wrongAnswers = 0;
    this.answerHistory = [];
    this.isQuizOpen = false;
    this.levelCompleted = false;
    this.isGameOver = false;

    this.oxygen = 100;
    this.maxOxygen = 100;
    this.lastBroadcastOxy = 100;
    this.lowOxyWarned = false;
    this.isInWater = false;
    this.wasInWater = false;
    this.wasGrounded = false;
    this.activeCheckpoint = { x: 210, y: 310 };

    this.decorFish = [];
    this.bubbleTimer = 0;
    this.touchState = {
      left: false,
      right: false,
      up: false,
      down: false,
      jump: false,
    };
  }

  ensureOceanTextures() {
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    const make = (key, w, h, fn) => {
      if (this.textures.exists(key)) return;
      g.clear();
      fn();
      g.generateTexture(key, w, h);
    };

    make("oc_island_tile", 250, 54, () => {
      g.fillStyle(0xb45309, 1);
      g.fillRoundedRect(0, 14, 250, 40, 18);
      g.fillStyle(0xfde68a, 1);
      g.fillRoundedRect(5, 5, 240, 26, 13);
      g.fillStyle(0x22c55e, 1);
      g.fillRoundedRect(18, 0, 214, 13, 6);
    });

    make("oc_coral_wall", 160, 52, () => {
      g.fillStyle(0x0f766e, 1);
      g.fillRoundedRect(0, 0, 160, 52, 15);
      g.fillStyle(0x14b8a6, 1);
      g.fillRoundedRect(5, 5, 150, 35, 11);
      g.fillStyle(0xf472b6, 1);
      g.fillCircle(32, 13, 9);
      g.fillCircle(128, 13, 8);
    });

    make("oc_air_bubble", 48, 48, () => {
      g.fillStyle(0x38bdf8, 0.35);
      g.fillCircle(24, 24, 22);
      g.lineStyle(3, 0xe0f2fe, 0.95);
      g.strokeCircle(24, 24, 19);
      g.fillStyle(0xffffff, 0.9);
      g.fillCircle(16, 15, 5.5);
    });

    make("oc_pearl", 44, 44, () => {
      g.fillStyle(0xf472b6, 0.35);
      g.fillCircle(22, 22, 20);
      g.fillStyle(0xf8fafc, 1);
      g.fillCircle(22, 22, 14);
      g.fillStyle(0xffffff, 1);
      g.fillCircle(18, 17, 4.5);
    });

    make("oc_quiz_chest", 66, 58, () => {
      g.fillStyle(0x0369a1, 1);
      g.fillRoundedRect(0, 4, 66, 54, 11);
      g.fillStyle(0x0ea5e9, 1);
      g.fillRoundedRect(4, 8, 58, 46, 9);
      g.fillStyle(0xfacc15, 1);
      g.fillRect(4, 25, 58, 8);
      g.fillCircle(33, 29, 8);
    });

    make("oc_quiz_chest_open", 66, 58, () => {
      g.fillStyle(0x14532d, 1);
      g.fillRoundedRect(0, 10, 66, 48, 11);
      g.fillStyle(0x22c55e, 1);
      g.fillRoundedRect(4, 14, 58, 40, 9);
      g.fillStyle(0xfef08a, 1);
      g.fillCircle(33, 29, 12);
    });

    make("oc_fish", 50, 30, () => {
      g.fillStyle(0xf97316, 1);
      g.fillTriangle(4, 15, 16, 4, 16, 26);
      g.fillEllipse(30, 15, 32, 20);
      g.fillStyle(0xffffff, 1);
      g.fillCircle(38, 12, 4);
      g.fillStyle(0x0f172a, 1);
      g.fillCircle(39, 12, 2);
    });

    g.destroy();
  }

  create() {
    this.physics.world.gravity.y = 920;
    this.physics.world.setBounds(0, 0, this.worldW, this.worldH);
    this.ensureOceanTextures();

    this.drawOceanWorldBackdrop();

    this.islandsGroup = this.physics.add.staticGroup();
    this.coralGroup = this.physics.add.staticGroup();
    this.bubbleGuidesGroup = this.physics.add.group({
      allowGravity: false,
      immovable: true,
    });
    this.coinsGroup = this.physics.add.group({
      allowGravity: false,
      immovable: true,
    });
    this.pearlsGroup = this.physics.add.group({
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
      levelKey: "medium",
      modeConfig: this.modeConfig,
      missionState: this.missionState,
    });

    this.buildOceanWorld();

    const charId = characterAssetManager.resolveCharacterId(
      this.profile?.character || "kiko",
    );
    this.activeCharId = charId;
    if (
      !this.textures.exists(`player_sheet_${charId}`) ||
      !this.anims.exists(`${charId}_swim`)
    ) {
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

    this.oxygenFloatWarn = this.add
      .text(0, 0, "🫧 Napas menipis! Naik ke pulau!", {
        fontFamily: "Fredoka, Segoe UI, sans-serif",
        fontSize: "15px",
        fontStyle: "bold",
        color: "#ffffff",
        backgroundColor: "#dc2626",
        padding: { x: 9, y: 4 },
      })
      .setOrigin(0.5)
      .setDepth(20)
      .setVisible(false);

    this.physics.add.collider(this.player, this.islandsGroup);
    this.physics.add.collider(this.player, this.coralGroup);
    this.physics.add.overlap(
      this.player,
      this.bubbleGuidesGroup,
      this.handleBubbleGuide,
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
      this.pearlsGroup,
      this.handleCollectPearl,
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
      s: Phaser.Input.Keyboard.KeyCodes.S,
      space: Phaser.Input.Keyboard.KeyCodes.SPACE,
    });

    this.bridge.syncHUD({
      oxygenPct: 100,
      coins: 0,
      collectibles: 0,
      answeredCount: 0,
      totalChallenges: this.totalChallenges,
      objectiveText: this.missionState.getSummaryText(),
    });
  }

  drawOceanWorldBackdrop() {
    const g = this.add.graphics().setDepth(-30);
    g.fillGradientStyle(0x38bdf8, 0x38bdf8, 0xe0f2fe, 0xe0f2fe, 1);
    g.fillRect(0, 0, this.worldW, this.waterSurfaceY);

    g.fillGradientStyle(0x06b6d4, 0x06b6d4, 0x0369a1, 0x0c4a6e, 1);
    g.fillRect(
      0,
      this.waterSurfaceY,
      this.worldW,
      this.worldH - this.waterSurfaceY,
    );

    g.fillStyle(0xe0f2fe, 0.8);
    g.fillRect(0, this.waterSurfaceY - 5, this.worldW, 10);

    g.fillStyle(0xfcd34d, 0.92);
    g.fillRect(0, this.worldH - 46, this.worldW, 46);
  }

  addLabel(x, y, text, bg = "#0369a1") {
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

  addQuizBox(x, y, idx, locationName) {
    const box = this.quizBoxesGroup.create(x, y, "oc_quiz_chest");
    box.setDepth(7);
    const lbl = this.addLabel(
      x,
      y - 48,
      `Soal ${idx} · ${locationName}`,
      "#0284c7",
    );
    box.setData({ idx, locationName, solved: false, labelObj: lbl });
  }

  spawnWaterSplash(x, y, count = 7) {
    for (let i = 0; i < count; i++) {
      const drop = this.add
        .circle(
          x + (Math.random() - 0.5) * 32,
          y,
          4 + Math.random() * 3,
          0xe0f2fe,
          0.9,
        )
        .setDepth(12);
      this.tweens.add({
        targets: drop,
        x: drop.x + (Math.random() - 0.5) * 60,
        y: y - 24 - Math.random() * 34,
        alpha: 0,
        scale: 0.4,
        duration: 360 + Math.random() * 140,
        ease: "Quad.easeOut",
        onComplete: () => drop.destroy(),
      });
    }
  }

  buildOceanWorld() {
    this.restIslands = [
      { x: 210, y: 410, name: "Pulau Awal" },
      { x: 830, y: 410, name: "Pulau Karang" },
      { x: 1460, y: 410, name: "Pulau Tengah" },
      { x: 2040, y: 410, name: "Pulau Gua" },
      { x: 2510, y: 410, name: "Pulau Mercusuar" },
    ];
    this.restIslands.forEach((isl) => {
      this.islandsGroup.create(isl.x, isl.y, "oc_island_tile");
      this.addLabel(isl.x, isl.y - 48, `🏝️ ${isl.name} (Isi Napas)`, "#15803d");
    });

    [
      [530, 720],
      [1150, 760],
      [1690, 640],
      [1850, 640],
      [1770, 910],
    ].forEach(([x, y]) => this.coralGroup.create(x, y, "oc_coral_wall"));
    this.addLabel(
      1770,
      594,
      "Gua Bawah Laut (Ikuti Arus Gelembung ke Pulau!)",
      "#0f766e",
    );

    [
      [530, 645],
      [1150, 685],
      [1620, 770],
      [1920, 770],
      [2280, 650],
    ].forEach(([x, y]) => {
      const b = this.bubbleGuidesGroup.create(x, y, "oc_air_bubble");
      b.setData({ lastUsed: 0 });
      this.tweens.add({
        targets: b,
        y: y - 16,
        duration: 950,
        yoyo: true,
        repeat: -1,
      });
    });

    this.addQuizBox(500, 600, 1, "Terumbu Dangkal");
    this.addQuizBox(830, 354, 2, "Pulau Karang");
    this.addQuizBox(1150, 685, 3, "Palung Biru");
    this.addQuizBox(1460, 354, 4, "Pulau Tengah");
    this.addQuizBox(1770, 795, 5, "Gua Bawah Laut");
    this.addQuizBox(2040, 354, 6, "Pulau Gua");
    this.addQuizBox(2290, 625, 7, "Taman Karang");

    [
      [390, 535],
      [660, 585],
      [990, 560],
      [1300, 610],
      [1650, 730],
      [1890, 730],
      [2180, 550],
      [2380, 515],
    ].forEach(([x, y]) => {
      const c = this.coinsGroup.create(x, y, "coin_gold").setScale(1.12);
      c.setData("collected", false);
      this.tweens.add({
        targets: c,
        y: y - 7,
        duration: 800,
        yoyo: true,
        repeat: -1,
      });
    });

    [
      [530, 845],
      [1770, 855],
      [2290, 785],
    ].forEach(([x, y]) => {
      const p = this.pearlsGroup.create(x, y, "oc_pearl");
      p.setData("collected", false);
      this.tweens.add({
        targets: p,
        y: y - 9,
        duration: 900,
        yoyo: true,
        repeat: -1,
      });
    });

    const fishColors = [0xf97316, 0xfacc15, 0xf472b6, 0x38bdf8];
    for (let i = 0; i < 7; i++) {
      const fx = 360 + i * 320;
      const fy = 515 + (i % 3) * 125;
      const fish = this.add
        .image(fx, fy, "oc_fish")
        .setDepth(2)
        .setTint(fishColors[i % fishColors.length]);
      this.decorFish.push({
        sprite: fish,
        minX: fx - 130,
        maxX: fx + 130,
        dir: i % 2 === 0 ? 1 : -1,
        speed: 46 + (i % 3) * 14,
      });
    }

    this.finishFlag = this.physics.add
      .staticImage(2550, 314, "finish_flag")
      .setScale(1.1);
    this.addLabel(2550, 222, "PULAU FINIS", "#16a34a");
  }

  handleBubbleGuide(player, bubble) {
    if (this.isGameOver || this.levelCompleted || this.isQuizOpen) return;
    const now = this.time.now;
    if (now - bubble.getData("lastUsed") < 1800) return;
    bubble.setData("lastUsed", now);
    if (this.isInWater) {
      player.setVelocityY(-280);
    }
    uiManager.playTone("jump");
    this.spawnWaterSplash(bubble.x, bubble.y, 4);
    this.bridge.showTransientHint(
      "🫧 Arus Gelembung membantumu naik ke pulau untuk mengisi napas!",
    );
  }

  handleCollectCoin(player, coin) {
    if (this.isGameOver || this.levelCompleted || coin.getData("collected"))
      return;
    coin.setData("collected", true);
    coin.disableBody(true, true);
    this.coinsCollected += 5;
    uiManager.playTone("coin");
    this.bridge.syncHUD({ coins: this.coinsCollected });
  }

  handleCollectPearl(player, pearl) {
    if (this.isGameOver || this.levelCompleted || pearl.getData("collected"))
      return;
    pearl.setData("collected", true);
    pearl.disableBody(true, true);
    this.pearlsCollected += 1;
    this.coinsCollected += 20;
    this.missionState.updateProgressByType("collectible", 1);
    uiManager.playTone("correct");
    this.bridge.syncHUD({
      coins: this.coinsCollected,
      collectibles: this.pearlsCollected,
    });
    this.bridge.showTransientHint("Mutiara Laut ditemukan! +20 Koin!");
  }

  handleTouchQuizBox(player, box) {
    if (
      this.isGameOver ||
      this.levelCompleted ||
      this.isQuizOpen ||
      box.getData("solved")
    )
      return;
    const idx = box.getData("idx");
    const loc = box.getData("locationName");
    this.bridge.triggerEducationChallenge({
      sourceType: "ocean_quiz_box",
      title: `Kotak Laut #${idx} — ${loc}`,
      forceDifficulty: "sedang",
      onResolved: ({ isCorrect }) => {
        box.setData("solved", true);
        box.setTexture("oc_quiz_chest_open");
        const lbl = box.getData("labelObj");
        if (lbl) {
          lbl.setText(`Soal ${idx} Selesai!`);
          lbl.setStyle({ backgroundColor: "#16a34a" });
        }
        this.bridge.showTransientHint(
          isCorrect
            ? "Tepat sekali! +25 Koin! Ingat naik ke pulau untuk mengisi napas."
            : "Tetap semangat! Naiklah ke pulau terdekat saat napas menipis.",
        );
      },
    });
  }

  handleReachFinish() {
    if (this.isGameOver || this.levelCompleted || this.isQuizOpen) return;
    if (this.questionsAnswered < this.totalChallenges) {
      this.bridge.showTransientHint(
        `Buka semua kotak soal laut dahulu (${this.questionsAnswered}/${this.totalChallenges})!`,
      );
      this.player.setX(this.player.x - 55);
      return;
    }
    this.bridge.completeLevel({
      bonusCoins: 40,
      collectibleLabel:
        this.pearlsCollected > 0
          ? `Mutiara Laut (${this.pearlsCollected})`
          : "",
    });
  }

  triggerOceanGameOver() {
    if (this.isGameOver || this.levelCompleted) return;
    this.oxygen = 0;
    this.lastBroadcastOxy = 0;
    this.oxygenFloatWarn.setVisible(false);
    this.player.setAngle(0);
    uiManager.playTone("wrong");
    this.bridge.syncHUD({ oxygenPct: 0, hintText: "" });

    this.bridge.failLevel({
      reason:
        "Daya napas habis di bawah laut! Naiklah ke pulau kecil sebelum oksigen mencapai 0%.",
      theme: "ocean",
    });
  }

  update(time, delta) {
    if (!this.player || this.isQuizOpen || this.levelCompleted || this.isGameOver)
      return;
    const dt = Math.min(delta, 40) / 1000;

    this.decorFish.forEach((f) => {
      f.sprite.x += f.speed * f.dir * dt;
      if (f.sprite.x <= f.minX) {
        f.dir = 1;
        f.sprite.setFlipX(false);
      }
      if (f.sprite.x >= f.maxX) {
        f.dir = -1;
        f.sprite.setFlipX(true);
      }
    });

    const left =
      this.cursors.left.isDown || this.keys.a.isDown || this.touchState.left;
    const right =
      this.cursors.right.isDown || this.keys.d.isDown || this.touchState.right;
    const up =
      this.cursors.up.isDown || this.keys.w.isDown || this.touchState.up;
    const down =
      this.cursors.down.isDown || this.keys.s.isDown || this.touchState.down;
    const jump = this.keys.space.isDown || this.touchState.jump;

    const moveX = (right ? 1 : 0) - (left ? 1 : 0);
    const moveY = (down ? 1 : 0) - (up ? 1 : 0);
    if (moveX !== 0) this.player.setFlipX(moveX < 0);

    this.isInWater = this.player.y > this.waterSurfaceY - 2;

    if (this.isInWater && !this.wasInWater) {
      this.spawnWaterSplash(this.player.x, this.waterSurfaceY, 8);
      uiManager.playTone("jump");
    } else if (!this.isInWater && this.wasInWater) {
      this.spawnWaterSplash(this.player.x, this.waterSurfaceY, 6);
    }
    this.wasInWater = this.isInWater;

    const grounded =
      this.player.body.blocked.down || this.player.body.touching.down;
    const onLand = !this.isInWater && grounded;

    if (this.isInWater) {
      this.player.body.setAllowGravity(false);
      let vx = moveX * 245;
      let vy = moveY * 225;
      if (moveX !== 0 && moveY !== 0) {
        vx *= Math.SQRT1_2;
        vy *= Math.SQRT1_2;
      }
      this.player.setVelocity(vx, vy);

      const facingSign = this.player.flipX ? -1 : 1;
      const targetAngle =
        moveX !== 0 || moveY !== 0
          ? Phaser.Math.Clamp(moveY * 22 * facingSign + moveX * 8, -28, 28)
          : 0;
      this.player.angle = Phaser.Math.Linear(
        this.player.angle,
        targetAngle,
        0.16,
      );

      if ((jump || up) && this.player.y < this.waterSurfaceY + 62) {
        this.player.setVelocityY(-515);
      }

      this.oxygen = Math.max(0, this.oxygen - 3.5 * dt);

      this.bubbleTimer -= delta;
      if (this.bubbleTimer <= 0) {
        this.bubbleTimer = moveX !== 0 || moveY !== 0 ? 360 : 680;
        const b = this.add
          .circle(
            this.player.x - facingSign * 14,
            this.player.y - 16,
            4.5,
            0xe0f2fe,
            0.85,
          )
          .setDepth(9);
        this.tweens.add({
          targets: b,
          y: b.y - 42,
          alpha: 0,
          duration: 650,
          onComplete: () => b.destroy(),
        });
      }
    } else {
      this.player.body.setAllowGravity(true);
      this.player.angle = Phaser.Math.Linear(this.player.angle, 0, 0.25);
      this.player.setVelocityX(moveX * 280);

      if (grounded && !this.wasGrounded && this.player.body.velocity.y >= 0) {
        this.tweens.add({
          targets: this.player,
          scaleX: this.baseScale * 1.12,
          scaleY: this.baseScale * 0.88,
          duration: 85,
          yoyo: true,
        });
      }
      this.wasGrounded = grounded;

      if (onLand) {
        const nearest = this.restIslands.find(
          (isl) => Math.abs(isl.x - this.player.x) < 145,
        );
        if (nearest) {
          this.activeCheckpoint = { x: nearest.x, y: nearest.y - 105 };
        }

        this.oxygen = Math.min(this.maxOxygen, this.oxygen + 36 * dt);
        this.lowOxyWarned = false;

        if (jump || up) {
          this.player.setVelocityY(-585);
          uiManager.playTone("jump");
        }
      }
    }

    const oxyInt = Math.round(this.oxygen);
    if (oxyInt !== this.lastBroadcastOxy) {
      this.lastBroadcastOxy = oxyInt;
      this.bridge.syncHUD({ oxygenPct: oxyInt });
    }

    if (this.isInWater && this.oxygen <= 30 && this.oxygen > 0) {
      this.oxygenFloatWarn
        .setPosition(this.player.x, this.player.y - 82)
        .setVisible(true);
      if (!this.lowOxyWarned) {
        this.lowOxyWarned = true;
        this.bridge.showTransientHint(
          "🫧 Daya napas tinggal sedikit! Ayo naik ke daratan pulau!",
        );
      }
    } else {
      this.oxygenFloatWarn.setVisible(false);
    }

    if (this.oxygen <= 0) {
      this.triggerOceanGameOver();
      return;
    }

    const cid = this.activeCharId;
    let anim = `${cid}_idle`;
    if (this.isInWater) {
      anim = moveX !== 0 || moveY !== 0 ? `${cid}_swim` : `${cid}_swim_idle`;
    } else if (!grounded) {
      anim = this.player.body.velocity.y < 0 ? `${cid}_jump` : `${cid}_fall`;
    } else if (moveX !== 0) {
      anim = `${cid}_run`;
    }
    if (
      this.anims.exists(anim) &&
      this.player.anims.currentAnim?.key !== anim
    ) {
      this.player.play(anim, true);
    }
  }
}
