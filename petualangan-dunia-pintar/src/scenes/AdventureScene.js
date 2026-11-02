import Phaser from "phaser";
import { GAME_CONFIG } from "../config/gameConfig.js";
import { questionManager } from "../systems/QuestionManager.js";
import { uiManager } from "../systems/UIManager.js";
import { db } from "../storage/db.js";

export class AdventureScene extends Phaser.Scene {
  constructor() {
    super("AdventureScene");
  }

  init(data) {
    this.profile = data?.profile || null;
    this.subject = data?.subject || "matematika";
    this.coinsCollected = 0;
    this.correctAnswers = 0;
    this.wrongAnswers = 0;
    this.totalChallenges = 4;
    this.answerHistory = [];
    this.isQuizOpen = false;
    this.levelCompleted = false;
    this.lastHitTime = 0;

    this.touchState = {
      left: false,
      right: false,
      jump: false,
    };
  }

  create() {
    questionManager.resetSession();

    const worldW = GAME_CONFIG.worldWidth;
    const worldH = GAME_CONFIG.worldHeight;
    const isIpas = this.subject === "ipas";

    this.physics.world.setBounds(0, 0, worldW, worldH);

    this.createBackgroundDecor(worldW, worldH, isIpas);

    this.platforms = this.physics.add.staticGroup();
    this.createLevelPlatforms(worldW, worldH);

    const charId = this.profile?.character || "kiko";
    this.player = this.physics.add.sprite(
      120,
      worldH - 150,
      `player_${charId}`,
    );
    this.player.setCollideWorldBounds(true);
    this.player.setBounce(0.05);
    this.player.body.setSize(38, 56);
    this.player.body.setOffset(7, 8);

    this.physics.add.collider(this.player, this.platforms);

    this.coinsGroup = this.physics.add.group({
      allowGravity: false,
      immovable: true,
    });
    this.spawnLevelCoins();
    this.physics.add.overlap(
      this.player,
      this.coinsGroup,
      this.handleCollectCoin,
      null,
      this,
    );

    this.obstaclesGroup = this.physics.add.staticGroup();
    this.spawnLevelObstacles(worldH);
    this.physics.add.overlap(
      this.player,
      this.obstaclesGroup,
      this.handleHitObstacle,
      null,
      this,
    );

    this.challengesGroup = this.physics.add.staticGroup();
    this.spawnSubjectChallenges(worldH, isIpas);
    this.physics.add.overlap(
      this.player,
      this.challengesGroup,
      this.handleTriggerChallenge,
      null,
      this,
    );

    this.gateCollider = this.physics.add.collider(this.player, this.gateObject);

    this.finishFlag = this.physics.add.staticImage(
      worldW - 140,
      worldH - 134,
      "finish_flag",
    );
    this.addFloatingLabel(
      worldW - 140,
      worldH - 220,
      "🏁 GARIS FINIS",
      "#2ecc71",
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
      space: Phaser.Input.Keyboard.KeyCodes.SPACE,
    });
  }

  createBackgroundDecor(worldW, worldH, isIpas) {
    const bg = this.add.graphics();
    if (isIpas) {
      bg.fillGradientStyle(0x38ef7d, 0x38ef7d, 0xe8f8f5, 0xe8f8f5, 1);
    } else {
      bg.fillGradientStyle(0x56ccf2, 0x56ccf2, 0xdff9fb, 0xdff9fb, 1);
    }
    bg.fillRect(0, 0, worldW, worldH);

    const hills = this.add.graphics();
    hills.fillStyle(isIpas ? 0x27ae60 : 0xa3cb38, 0.5);
    for (let x = 0; x < worldW; x += 520) {
      hills.fillCircle(x + 240, worldH - 60, 260);
    }

    const clouds = this.add.graphics();
    clouds.fillStyle(0xffffff, 0.85);
    for (let x = 150; x < worldW; x += 420) {
      const y = 90 + (x % 110);
      clouds.fillRoundedRect(x, y, 150, 46, 23);
      clouds.fillCircle(x + 45, y, 28);
      clouds.fillCircle(x + 95, y - 4, 34);
    }

    const bannerTitle = isIpas
      ? "🌿 Ekspedisi Alam IPAS: Gunakan A / D / Panah & SPACE untuk Melompat!"
      : "📐 Pulau Matematika: Gunakan A / D / Panah & SPACE untuk Melompat!";

    this.addFloatingLabel(
      260,
      worldH - 190,
      bannerTitle,
      isIpas ? "#16a085" : "#f39c12",
    );
  }

  addFloatingLabel(x, y, text, bgColor = "#2c3e50") {
    return this.add
      .text(x, y, text, {
        fontFamily: "Segoe UI, sans-serif",
        fontSize: "16px",
        fontStyle: "bold",
        color: "#ffffff",
        backgroundColor: bgColor,
        padding: { x: 10, y: 6 },
      })
      .setOrigin(0.5);
  }

  createLevelPlatforms(worldW, worldH) {
    for (let x = 32; x < worldW; x += 64) {
      this.platforms.create(x, worldH - 32, "ground_tile");
    }

    const floatingCoords = [
      { x: 520, y: worldH - 165 },
      { x: 820, y: worldH - 250 },
      { x: 1180, y: worldH - 180 },
      { x: 1520, y: worldH - 265 },
      { x: 1920, y: worldH - 175 },
      { x: 2250, y: worldH - 260 },
      { x: 2620, y: worldH - 190 },
      { x: 3180, y: worldH - 220 },
    ];

    floatingCoords.forEach((p) => {
      this.platforms.create(p.x, p.y, "platform_wood");
    });
  }

  spawnLevelCoins() {
    const h = GAME_CONFIG.worldHeight;
    const coinPositions = [
      { x: 320, y: h - 100 },
      { x: 370, y: h - 100 },
      { x: 420, y: h - 100 },
      { x: 480, y: h - 220 },
      { x: 520, y: h - 220 },
      { x: 560, y: h - 220 },
      { x: 780, y: h - 305 },
      { x: 820, y: h - 305 },
      { x: 860, y: h - 305 },
      { x: 1140, y: h - 235 },
      { x: 1220, y: h - 235 },
      { x: 1480, y: h - 320 },
      { x: 1520, y: h - 320 },
      { x: 1560, y: h - 320 },
      { x: 1880, y: h - 230 },
      { x: 1960, y: h - 230 },
      { x: 2210, y: h - 315 },
      { x: 2250, y: h - 315 },
      { x: 2290, y: h - 315 },
      { x: 2600, y: h - 245 },
      { x: 2650, y: h - 245 },
      { x: 3140, y: h - 275 },
      { x: 3220, y: h - 275 },
      { x: 3420, y: h - 100 },
      { x: 3480, y: h - 100 },
    ];

    coinPositions.forEach((pos) => {
      const coin = this.coinsGroup.create(pos.x, pos.y, "coin_gold");
      coin.setData("collected", false);
      this.tweens.add({
        targets: coin,
        y: pos.y - 8,
        duration: 750,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
    });
  }

  spawnLevelObstacles(worldH) {
    const spikeXList = [670, 1350, 2080, 2780, 3320];
    spikeXList.forEach((x) => {
      this.obstaclesGroup.create(x, worldH - 82, "obstacle_spike");
    });
  }

  spawnSubjectChallenges(worldH, isIpas) {
    const labelSubject = isIpas ? "IPAS" : "Matematika";

    const chest1 = this.challengesGroup.create(
      820,
      worldH - 292,
      "chest_closed",
    );
    chest1.setData({
      id: "chal_1",
      title: `📦 Peti Pengetahuan ${labelSubject} 1`,
      type: "chest",
      solved: false,
    });
    this.addFloatingLabel(
      820,
      worldH - 345,
      `❓ Peti ${labelSubject} 1`,
      "#d35400",
    );

    const owlNpc = this.challengesGroup.create(1680, worldH - 96, "npc_owl");
    owlNpc.setData({
      id: "chal_2",
      title: `🦉 Misi Burung Hantu (${labelSubject})`,
      type: "npc",
      solved: false,
    });
    this.addFloatingLabel(
      1680,
      worldH - 155,
      `🦉 Misi ${labelSubject}`,
      "#8e44ad",
    );

    const chest2 = this.challengesGroup.create(
      2250,
      worldH - 302,
      "chest_closed",
    );
    chest2.setData({
      id: "chal_3",
      title: `📦 Peti Harta Karun ${labelSubject} 2`,
      type: "chest",
      solved: false,
    });
    this.addFloatingLabel(
      2250,
      worldH - 355,
      `❓ Peti ${labelSubject} 2`,
      "#d35400",
    );

    this.gateObject = this.challengesGroup.create(
      2950,
      worldH - 128,
      "math_gate",
    );
    this.gateObject.setData({
      id: "chal_4",
      title: `🚪 Gerbang Kunci ${labelSubject}`,
      type: "gate",
      solved: false,
    });
    this.gateLabel = this.addFloatingLabel(
      2950,
      worldH - 215,
      `🔒 Jawab Soal ${labelSubject} untuk Buka Gerbang!`,
      "#c0392b",
    );
  }

  handleCollectCoin(player, coin) {
    if (coin.getData("collected")) return;
    coin.setData("collected", true);
    coin.disableBody(true, true);

    this.coinsCollected += 5;
    uiManager.playTone("coin");
    uiManager.updateAdventureHUD({
      coins: this.coinsCollected,
      correctCount: this.correctAnswers,
      totalChallenges: this.totalChallenges,
    });
  }

  handleHitObstacle(player, spike) {
    const now = this.time.now;
    if (now - this.lastHitTime < 1100 || this.isQuizOpen) return;
    this.lastHitTime = now;

    uiManager.playTone("wrong");
    player.setVelocityY(-340);
    player.setVelocityX(player.x < spike.x ? -220 : 220);

    this.cameras.main.shake(140, 0.006);
    uiManager.updateAdventureHUD({
      coins: this.coinsCollected,
      correctCount: this.correctAnswers,
      totalChallenges: this.totalChallenges,
      hintText: "⚠️ Hati-hati rintangan berduri! Ayo lompati!",
    });

    this.time.delayedCall(2000, () => {
      uiManager.updateAdventureHUD({ hintText: "" });
    });
  }

  handleTriggerChallenge(player, challengeObj) {
    if (this.isQuizOpen || challengeObj.getData("solved")) return;

    this.isQuizOpen = true;
    player.setVelocity(0, 0);
    this.physics.pause();

    this.touchState.left = false;
    this.touchState.right = false;
    this.touchState.jump = false;

    const qData = questionManager.getNextQuestion(this.subject, null, {
      profile: uiManager.activeProfile || this.profile,
      settings: uiManager.settings,
    });

    if (qData.error) {
      this.physics.resume();
      this.isQuizOpen = false;
      uiManager.updateAdventureHUD({
        hintText: `⚠️ ${qData.message}`,
      });
      return;
    }

    const title = challengeObj.getData("title");
    const type = challengeObj.getData("type");

    uiManager.showQuestionModal({
      questionData: qData,
      triggerTitle: title,
      onComplete: async (isCorrect, chosenAnswer) => {
        this.physics.resume();
        this.isQuizOpen = false;

        this.answerHistory.push({
          questionId: qData.id,
          topic: qData.topic,
          difficulty: qData.difficulty,
          sourceType: qData.sourceType || "question_bank",
          chosenAnswer: chosenAnswer || "",
          correctAnswer: qData.correctAnswer,
          isCorrect,
        });

        if (uiManager.activeProfile) {
          uiManager.activeProfile = await db.recordQuestionAttempt(
            uiManager.activeProfile.id,
            {
              questionId: qData.id,
              subject: this.subject,
              topic: qData.topic,
              difficulty: qData.difficulty,
              sourceType: qData.sourceType,
              isCorrect,
              mode: "adventure",
            },
            uiManager.settings,
          );
          this.profile = uiManager.activeProfile;
        }

        if (isCorrect) {
          this.correctAnswers += 1;
          this.coinsCollected += 25;
          challengeObj.setData("solved", true);

          if (type === "chest") {
            challengeObj.setTexture("chest_open");
          } else if (type === "gate") {
            if (this.gateCollider) {
              this.physics.world.removeCollider(this.gateCollider);
            }
            challengeObj.disableBody(true, true);
            if (this.gateLabel) this.gateLabel.setText("🔓 Gerbang Terbuka!");
          } else if (type === "npc") {
            challengeObj.setTint(0xbadc58);
          }

          uiManager.updateAdventureHUD({
            coins: this.coinsCollected,
            correctCount: this.correctAnswers,
            totalChallenges: this.totalChallenges,
            hintText: "🌟 Mantap! Kamu mendapat tambahan +25 Koin!",
          });
        } else {
          this.wrongAnswers += 1;
          player.setX(player.x - 45);
          uiManager.updateAdventureHUD({
            coins: this.coinsCollected,
            correctCount: this.correctAnswers,
            totalChallenges: this.totalChallenges,
            hintText:
              "💡 Dekati lagi objeknya untuk berlatih soal penguatan pada materi ini!",
          });
        }

        this.time.delayedCall(2500, () => {
          uiManager.updateAdventureHUD({ hintText: "" });
        });
      },
    });
  }

  handleReachFinish() {
    if (this.levelCompleted || this.isQuizOpen) return;
    this.levelCompleted = true;
    this.physics.pause();

    this.coinsCollected += 30;

    let stars = 1;
    if (this.correctAnswers >= 4 && this.wrongAnswers === 0) {
      stars = 3;
    } else if (this.correctAnswers >= 3) {
      stars = 3;
    } else if (this.correctAnswers >= 2) {
      stars = 2;
    }

    const isIpas = this.subject === "ipas";
    const badge = isIpas
      ? stars === 3
        ? "Ilmuwan Cilik Alam & Sosial"
        : "Penjelajah Lingkungan IPAS"
      : stars === 3
        ? "Juara Matematika Pulau Pintar"
        : "Penjelajah Matematika Pemberani";

    const collectibleItem = isIpas
      ? "Kristal Daun Zamrud IPAS"
      : "Kompas Emas Angka Pintar";

    const levelTitle = isIpas
      ? "Petualangan IPAS: Ekspedisi Alam & Kehidupan"
      : "Petualangan Matematika: Lembah Bilangan & Hitungan";

    uiManager.showAdventureResult({
      levelId: isIpas ? "ipas3_level_1" : "mtk3_level_1",
      levelTitle,
      subject: this.subject,
      coinsEarned: this.coinsCollected,
      correctCount: this.correctAnswers,
      wrongCount: this.wrongAnswers,
      starsEarned: stars,
      badgeEarned: badge,
      collectibleItem,
      answerHistory: this.answerHistory,
    });
  }

  update() {
    if (!this.player || this.isQuizOpen || this.levelCompleted) return;

    const moveLeft =
      this.cursors.left.isDown ||
      this.keys.leftA.isDown ||
      this.touchState.left;
    const moveRight =
      this.cursors.right.isDown ||
      this.keys.rightD.isDown ||
      this.touchState.right;
    const wantJump =
      this.cursors.up.isDown || this.keys.space.isDown || this.touchState.jump;

    if (moveLeft) {
      this.player.setVelocityX(-GAME_CONFIG.playerSpeed);
      this.player.setFlipX(true);
    } else if (moveRight) {
      this.player.setVelocityX(GAME_CONFIG.playerSpeed);
      this.player.setFlipX(false);
    } else {
      this.player.setVelocityX(0);
    }

    const isGrounded =
      this.player.body.blocked.down || this.player.body.touching.down;
    if (wantJump && isGrounded) {
      this.player.setVelocityY(GAME_CONFIG.playerJumpVelocity);
      uiManager.playTone("jump");
      this.touchState.jump = false;
    }
  }
}
