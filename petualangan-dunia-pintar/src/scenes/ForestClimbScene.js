import Phaser from "phaser";
import { uiManager } from "../systems/UIManager.js";
import { characterAssetManager } from "../systems/CharacterAssetManager.js";
import { getAdventureModeConfig } from "../systems/adventure/AdventureModeConfig.js";
import { AdventureMissionState } from "../systems/adventure/AdventureMissionState.js";
import { AdventureSessionBridge } from "../systems/adventure/AdventureSessionBridge.js";

export class ForestClimbScene extends Phaser.Scene {
  constructor() {
    super("ForestClimbScene");
  }

  init(data) {
    this.profile = data?.profile || uiManager.activeProfile || null;
    this.grade = Number(data?.grade) || Number(this.profile?.grade) || 3;
    this.subject = data?.subject || "matematika";
    this.levelKey = "easy";
    this.modeConfig = getAdventureModeConfig("easy");

    this.worldW = 1280;
    this.worldH = 2320;
    this.totalChallenges = this.modeConfig.totalChallenges;
    this.coinsCollected = 0;
    this.starsCollected = 0;
    this.questionsAnswered = 0;
    this.correctAnswers = 0;
    this.wrongAnswers = 0;
    this.answerHistory = [];
    this.isQuizOpen = false;
    this.levelCompleted = false;

    this.activeCheckpoint = { x: 240, y: this.worldH - 150 };
    this.isOnVine = false;
    this.wasGrounded = false;
    this.coyoteTimer = 0;
    this.jumpBufferTimer = 0;
    this.prevJumpHeld = false;
    this.dustTimer = 0;

    this.touchState = {
      left: false,
      right: false,
      up: false,
      down: false,
      jump: false,
    };
  }

  ensureForestTextures() {
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    const make = (key, w, h, fn) => {
      if (this.textures.exists(key)) return;
      g.clear();
      fn();
      g.generateTexture(key, w, h);
    };

    make("fc_branch_wide", 260, 40, () => {
      g.fillStyle(0x451a03, 1);
      g.fillRoundedRect(0, 4, 260, 36, 13);
      g.fillStyle(0x92400e, 1);
      g.fillRoundedRect(4, 7, 252, 28, 10);
      g.fillStyle(0x22c55e, 1);
      g.fillRoundedRect(4, 2, 252, 14, 8);
      g.fillStyle(0x86efac, 0.85);
      g.fillRoundedRect(14, 4, 232, 5, 3);
    });

    make("fc_vine_seg", 42, 140, () => {
      g.fillStyle(0x15803d, 1);
      g.fillRoundedRect(16, 0, 10, 140, 5);
      g.fillStyle(0x4ade80, 1);
      for (let y = 14; y < 130; y += 26) {
        g.fillEllipse(10, y, 16, 9);
        g.fillEllipse(32, y + 12, 16, 9);
      }
    });

    make("fc_leaf_bounce", 88, 34, () => {
      g.fillStyle(0x166534, 1);
      g.fillEllipse(44, 20, 82, 24);
      g.fillStyle(0x4ade80, 1);
      g.fillEllipse(44, 15, 76, 20);
      g.fillStyle(0xfef08a, 0.85);
      g.fillEllipse(44, 13, 46, 7);
    });

    make("fc_quiz_box", 64, 64, () => {
      g.fillStyle(0x92400e, 1);
      g.fillRoundedRect(0, 0, 64, 64, 14);
      g.fillStyle(0xf59e0b, 1);
      g.fillRoundedRect(4, 4, 56, 56, 11);
      g.fillStyle(0xfef08a, 1);
      g.fillRoundedRect(11, 11, 42, 42, 9);
      g.fillStyle(0xb45309, 1);
      g.fillCircle(32, 26, 8);
      g.fillRect(29, 36, 6, 11);
    });

    make("fc_quiz_box_open", 64, 64, () => {
      g.fillStyle(0x14532d, 1);
      g.fillRoundedRect(0, 6, 64, 58, 14);
      g.fillStyle(0x22c55e, 1);
      g.fillRoundedRect(4, 10, 56, 50, 11);
      g.fillStyle(0xfef08a, 1);
      g.fillCircle(32, 33, 13);
    });

    make("fc_star_item", 44, 44, () => {
      g.fillStyle(0xf59e0b, 1);
      g.fillCircle(22, 22, 18);
      g.fillStyle(0xfef08a, 1);
      g.fillCircle(22, 22, 11);
    });

    g.destroy();
  }

  create() {
    this.physics.world.gravity.y = 920;
    this.physics.world.setBounds(0, 0, this.worldW, this.worldH);
    this.ensureForestTextures();

    this.drawVerticalForestScenery();

    this.platforms = this.physics.add.staticGroup();
    this.vinesGroup = this.physics.add.staticGroup();
    this.bounceGroup = this.physics.add.staticGroup();
    this.checkpointsGroup = this.physics.add.staticGroup();
    this.coinsGroup = this.physics.add.group({
      allowGravity: false,
      immovable: true,
    });
    this.starsGroup = this.physics.add.group({
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
      levelKey: "easy",
      modeConfig: this.modeConfig,
      missionState: this.missionState,
    });

    this.buildVerticalForestWorld();

    const charId = characterAssetManager.resolveCharacterId(
      this.profile?.character || "kiko",
    );
    this.activeCharId = charId;
    if (
      !this.textures.exists(`player_sheet_${charId}`) ||
      !this.anims.exists(`${charId}_climb`)
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

    this.physics.add.collider(this.player, this.platforms);
    this.physics.add.overlap(
      this.player,
      this.bounceGroup,
      this.handleBounceLeaf,
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
      this.coinsGroup,
      this.handleCollectCoin,
      null,
      this,
    );
    this.physics.add.overlap(
      this.player,
      this.starsGroup,
      this.handleCollectStar,
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
      this.summitFlag,
      this.handleReachSummit,
      null,
      this,
    );

    this.cameras.main.setBounds(0, 0, this.worldW, this.worldH);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.09);

    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys({
      a: Phaser.Input.Keyboard.KeyCodes.A,
      d: Phaser.Input.Keyboard.KeyCodes.D,
      w: Phaser.Input.Keyboard.KeyCodes.W,
      s: Phaser.Input.Keyboard.KeyCodes.S,
      space: Phaser.Input.Keyboard.KeyCodes.SPACE,
    });

    this.bridge.syncHUD({
      coins: 0,
      collectibles: 0,
      answeredCount: 0,
      totalChallenges: this.totalChallenges,
      objectiveText: this.missionState.getSummaryText(),
    });
  }

  drawVerticalForestScenery() {
    const g = this.add.graphics().setDepth(-30);
    g.fillGradientStyle(0x38bdf8, 0x38bdf8, 0xbbf7d0, 0xbbf7d0, 1);
    g.fillRect(0, 0, this.worldW, this.worldH);

    g.fillStyle(0x78350f, 0.78);
    g.fillRect(0, 0, 74, this.worldH);
    g.fillRect(this.worldW - 74, 0, 74, this.worldH);
    g.fillStyle(0x92400e, 0.65);
    g.fillRect(14, 0, 22, this.worldH);
    g.fillRect(this.worldW - 36, 0, 22, this.worldH);

    g.fillStyle(0x7dd3fc, 0.48);
    g.fillRect(1010, 200, 118, this.worldH - 260);
    g.fillStyle(0xe0f2fe, 0.58);
    g.fillRect(1048, 200, 34, this.worldH - 260);

    g.fillStyle(0x16a34a, 0.25);
    for (let y = 160; y < this.worldH; y += 300) {
      g.fillCircle(120, y, 125);
      g.fillCircle(this.worldW - 120, y + 130, 130);
    }
  }

  addLabel(x, y, text, bg = "#166534") {
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

  addVine(x, bottomY, segments = 3) {
    for (let i = 0; i < segments; i++) {
      const seg = this.vinesGroup.create(x, bottomY - i * 124, "fc_vine_seg");
      seg.setDepth(4);
    }
  }

  addQuizBox(x, y, idx) {
    const box = this.quizBoxesGroup.create(x, y, "fc_quiz_box");
    box.setDepth(7);
    const lbl = this.addLabel(x, y - 50, `Kotak Soal ${idx}`, "#b45309");
    box.setData({ idx, solved: false, labelObj: lbl });
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

  buildVerticalForestWorld() {
    for (let x = 32; x < this.worldW; x += 64) {
      this.platforms.create(x, this.worldH - 32, "ground_tile");
    }
    this.addLabel(
      340,
      this.worldH - 205,
      "Ayo Mendaki ke Puncak Hutan! (5 Soal)",
      "#15803d",
    );

    const branches = [

      [360, 2120],
      [700, 1995],
      [960, 1875],
      [520, 1775],

      [290, 1630],
      [660, 1515],
      [960, 1400],
      [600, 1280],

      [300, 1145],
      [660, 1025],
      [950, 910],
      [560, 795],

      [310, 655],
      [660, 535],
      [920, 415],
      [560, 355],
    ];
    branches.forEach(([x, y]) => {
      const p = this.platforms.create(x, y, "fc_branch_wide");
      p.body.checkCollision.down = false;
      p.body.checkCollision.left = false;
      p.body.checkCollision.right = false;
    });

    this.addVine(960, 1850, 3);
    this.addVine(290, 1605, 3);
    this.addVine(950, 885, 3);
    this.addVine(310, 635, 2);

    [
      [500, 2246],
      [660, 1478],
      [660, 988],
    ].forEach(([x, y]) => {
      this.bounceGroup
        .create(x, y, "fc_leaf_bounce")
        .setData({ lastBounce: 0 });
    });

    this.addCheckpoint(660, 1460, "Checkpoint Hutan 1");
    this.addCheckpoint(300, 1090, "Checkpoint Hutan 2");
    this.addCheckpoint(660, 480, "Checkpoint Hutan 3");

    this.addQuizBox(700, 1945, 1);
    this.addQuizBox(960, 1350, 2);
    this.addQuizBox(660, 975, 3);
    this.addQuizBox(310, 605, 4);
    this.addQuizBox(560, 305, 5);

    [
      [360, 2055],
      [520, 1710],
      [660, 1450],
      [600, 1215],
      [950, 845],
      [560, 730],
      [660, 470],
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
      [215, 1565],
      [1035, 845],
      [490, 295],
    ].forEach(([x, y]) => {
      const s = this.starsGroup.create(x, y, "fc_star_item").setScale(1.1);
      s.setData("collected", false);
      this.tweens.add({
        targets: s,
        y: y - 9,
        duration: 900,
        yoyo: true,
        repeat: -1,
      });
    });

    this.summitFlag = this.physics.add
      .staticImage(930, 322, "finish_flag")
      .setScale(1.1);
    this.addLabel(930, 224, "PUNCAK HUTAN (FINIS)", "#16a34a");
  }

  handleBounceLeaf(player, leaf) {
    const now = this.time.now;
    if (now - leaf.getData("lastBounce") < 300 || player.body.velocity.y < -60)
      return;
    leaf.setData("lastBounce", now);
    player.setVelocityY(-800);
    uiManager.playTone("jump");
    this.playSquashStretch(0.86, 1.16, 110);
    this.spawnDust(player.x, player.body.bottom, 5);
    this.tweens.add({
      targets: leaf,
      scaleY: 0.65,
      scaleX: 1.15,
      duration: 90,
      yoyo: true,
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
    this.bridge.showTransientHint(
      "Checkpoint aktif! Jika jatuh, kamu aman di sini.",
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

  handleCollectStar(player, star) {
    if (star.getData("collected")) return;
    star.setData("collected", true);
    star.disableBody(true, true);
    this.starsCollected += 1;
    this.coinsCollected += 20;
    this.missionState.updateProgressByType("collectible", 1);
    uiManager.playTone("correct");
    this.bridge.syncHUD({
      coins: this.coinsCollected,
      collectibles: this.starsCollected,
    });
    this.bridge.showTransientHint("Bintang Hutan ditemukan! +20 Koin!");
  }

  handleTouchQuizBox(player, box) {
    if (this.isQuizOpen || box.getData("solved")) return;
    const idx = box.getData("idx");
    this.bridge.triggerEducationChallenge({
      sourceType: "forest_quiz_box",
      title: `Kotak Pengetahuan Hutan #${idx}`,
      forceDifficulty: "mudah",
      onResolved: ({ isCorrect }) => {
        box.setData("solved", true);
        box.setTexture("fc_quiz_box_open");
        const lbl = box.getData("labelObj");
        if (lbl) {
          lbl.setText(`Kotak ${idx} Selesai!`);
          lbl.setStyle({ backgroundColor: "#16a34a" });
        }
        this.bridge.showTransientHint(
          isCorrect
            ? "Hebat! Jawaban tepat! +25 Koin!"
            : "Tetap semangat! Terus mendaki ke atas!",
        );
      },
    });
  }

  handleReachSummit() {
    if (this.levelCompleted || this.isQuizOpen) return;
    if (this.questionsAnswered < this.totalChallenges) {
      this.bridge.showTransientHint(
        `Masih ada Kotak Soal yang belum dibuka (${this.questionsAnswered}/${this.totalChallenges})!`,
      );
      this.player.setX(this.player.x - 55);
      return;
    }
    this.bridge.completeLevel({
      bonusCoins: 35,
      collectibleLabel:
        this.starsCollected > 0 ? `Bintang Hutan (${this.starsCollected})` : "",
    });
  }

  update(time, delta) {
    if (!this.player || this.isQuizOpen || this.levelCompleted) return;

    const left =
      this.cursors.left.isDown || this.keys.a.isDown || this.touchState.left;
    const right =
      this.cursors.right.isDown || this.keys.d.isDown || this.touchState.right;
    const up =
      this.cursors.up.isDown || this.keys.w.isDown || this.touchState.up;
    const down =
      this.cursors.down.isDown || this.keys.s.isDown || this.touchState.down;
    const jumpHeld = this.keys.space.isDown || this.touchState.jump;

    const touchingVine = this.physics.overlap(this.player, this.vinesGroup);
    if (touchingVine && (up || down)) {
      this.isOnVine = true;
    } else if (!touchingVine || jumpHeld) {
      this.isOnVine = false;
    }

    const moveDir = (right ? 1 : 0) - (left ? 1 : 0);
    if (moveDir !== 0) this.player.setFlipX(moveDir < 0);

    const grounded =
      this.player.body.blocked.down || this.player.body.touching.down;

    if (this.isOnVine) {
      this.player.body.setAllowGravity(false);
      this.player.setVelocityX(moveDir * 175);
      this.player.setVelocityY(up ? -235 : down ? 235 : 0);
    } else {
      this.player.body.setAllowGravity(true);
      this.player.setVelocityX(moveDir * 290);

      if (grounded && !this.wasGrounded && this.player.body.velocity.y >= 0) {
        this.playSquashStretch(1.13, 0.87, 85);
        this.spawnDust(this.player.x, this.player.body.bottom, 4);
      }
      this.wasGrounded = grounded;

      this.coyoteTimer = grounded ? 130 : Math.max(0, this.coyoteTimer - delta);
      const jumpPressed =
        (jumpHeld || (up && !touchingVine)) && !this.prevJumpHeld;
      this.prevJumpHeld = jumpHeld || (up && !touchingVine);
      this.jumpBufferTimer = jumpPressed
        ? 135
        : Math.max(0, this.jumpBufferTimer - delta);

      if (this.jumpBufferTimer > 0 && this.coyoteTimer > 0) {
        this.player.setVelocityY(-645);
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
    }

    if (this.player.y > this.activeCheckpoint.y + 480) {
      this.player.setPosition(this.activeCheckpoint.x, this.activeCheckpoint.y);
      this.player.setVelocity(0, 0);
      uiManager.playTone("jump");
      this.bridge.showTransientHint(
        "Angin hutan membawamu kembali ke Checkpoint aman!",
      );
    }

    const cid = this.activeCharId;
    let anim = `${cid}_idle`;
    if (this.isOnVine) anim = up || down ? `${cid}_climb` : `${cid}_idle`;
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
