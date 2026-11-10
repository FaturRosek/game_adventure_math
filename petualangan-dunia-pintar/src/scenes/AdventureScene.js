import Phaser from "phaser";
import { GAME_CONFIG } from "../config/gameConfig.js";
import { questionManager } from "../systems/QuestionManager.js";
import { uiManager } from "../systems/UIManager.js";
import { db } from "../storage/db.js";
import { AdventureLevelBuilder } from "../systems/AdventureLevelBuilder.js";

export class AdventureScene extends Phaser.Scene {
  constructor() {
    super("AdventureScene");
  }

  init(data) {
    this.profile = data?.profile || null;
    this.grade = Number(data?.grade) || Number(this.profile?.grade) || 3;
    this.subject = data?.subject || "matematika";
    this.levelKey = data?.levelKey || "easy";

    const levelMeta =
      GAME_CONFIG.adventureLevels.find((l) => l.id === this.levelKey) ||
      GAME_CONFIG.adventureLevels[0];

    this.levelMeta = levelMeta;
    this.levelDifficulty = levelMeta.difficulty;
    this.totalChallenges = levelMeta.totalQuestions;
    this.boxDistribution = [...levelMeta.boxDistribution];

    this.coinsCollected = 0;
    this.questionsAnswered = 0;
    this.correctAnswers = 0;
    this.wrongAnswers = 0;
    this.answerHistory = [];
    this.isQuizOpen = false;
    this.levelCompleted = false;
    this.lastHitTime = 0;
    this.sessionStartTime = performance.now();

    this.movingPlatformsList = [];
    this.checkpoints = [{ x: 120, y: GAME_CONFIG.worldHeight - 150 }];
    this.lastSafeCheckpoint = { x: 120, y: GAME_CONFIG.worldHeight - 150 };

    this.touchState = {
      left: false,
      right: false,
      jump: false,
    };
  }

  getSubjectLabel() {
    const found = GAME_CONFIG.subjects.find((s) => s.id === this.subject);
    return found ? found.name : "Matematika";
  }

  create() {
    questionManager.resetSession();

    const worldW = GAME_CONFIG.worldWidth;
    const worldH = GAME_CONFIG.worldHeight;

    this.physics.world.setBounds(0, 0, worldW, worldH);

    this.platforms = this.physics.add.staticGroup();
    this.movingPlatformsGroup = this.physics.add.group({
      allowGravity: false,
      immovable: true,
    });
    this.crumblingPlatformsGroup = this.physics.add.staticGroup();
    this.coinsGroup = this.physics.add.group({
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

    AdventureLevelBuilder.buildLevel(this);

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
    this.physics.add.collider(this.player, this.movingPlatformsGroup);
    this.physics.add.collider(
      this.player,
      this.crumblingPlatformsGroup,
      this.handleStepCrumblingPlatform,
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
      this.coinsGroup,
      this.handleCollectCoin,
      null,
      this,
    );
    this.physics.add.overlap(
      this.player,
      this.obstaclesGroup,
      this.handleHitObstacle,
      null,
      this,
    );
    this.physics.add.overlap(
      this.player,
      this.fireballsGroup,
      this.handleHitObstacle,
      null,
      this,
    );
    this.physics.add.overlap(
      this.player,
      this.lavaGroup,
      this.handleFallIntoLava,
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

  addFloatingLabel(x, y, text, bgColor = "#2c3e50") {
    return this.add
      .text(x, y, text, {
        fontFamily: "Segoe UI, sans-serif",
        fontSize: "15px",
        fontStyle: "bold",
        color: "#ffffff",
        backgroundColor: bgColor,
        padding: { x: 10, y: 6 },
      })
      .setOrigin(0.5);
  }

  createMovingPlatform(cfg) {
    const plat = this.movingPlatformsGroup.create(
      cfg.x,
      cfg.y,
      cfg.texture || "platform_moving_gold",
    );
    plat.setImmovable(true);
    plat.body.allowGravity = false;
    plat.setData({
      moveType: cfg.moveType || "horizontal",
      minX: cfg.minX || cfg.x - 120,
      maxX: cfg.maxX || cfg.x + 120,
      minY: cfg.minY || cfg.y - 120,
      maxY: cfg.maxY || cfg.y + 120,
      speed: cfg.speed || 110,
      direction: 1,
      active: Boolean(cfg.active),
    });
    this.movingPlatformsList.push(plat);
    return plat;
  }

  createCrumblingPlatform(x, y) {
    const plat = this.crumblingPlatformsGroup.create(x, y, "platform_crumble");
    plat.setData({ crumbling: false, baseX: x, baseY: y });
    return plat;
  }

  handleStepCrumblingPlatform(player, plat) {
    if (plat.getData("crumbling") || !player.body.touching.down) return;
    plat.setData("crumbling", true);

    this.tweens.add({
      targets: plat,
      x: plat.getData("baseX") + 4,
      duration: 55,
      yoyo: true,
      repeat: 7,
      onComplete: () => {
        plat.disableBody(true, true);
        this.time.delayedCall(2600, () => {
          plat.enableBody(
            true,
            plat.getData("baseX"),
            plat.getData("baseY"),
            true,
            true,
          );
          plat.setData("crumbling", false);
        });
      },
    });
  }

  spawnFireballTrap(x, startY, peakY) {
    const fb = this.fireballsGroup.create(x, startY, "fireball_trap");
    this.tweens.add({
      targets: fb,
      y: peakY,
      duration: 1350,
      yoyo: true,
      repeat: -1,
      ease: "Quad.easeOut",
    });
    return fb;
  }

  handleFallIntoLava(player) {
    const now = this.time.now;
    if (now - this.lastHitTime < 1000 || this.isQuizOpen) return;
    this.lastHitTime = now;

    uiManager.playTone("wrong");
    this.cameras.main.shake(180, 0.008);

    player.setVelocity(0, 0);
    player.setPosition(this.lastSafeCheckpoint.x, this.lastSafeCheckpoint.y);

    uiManager.updateAdventureHUD({
      coins: this.coinsCollected,
      answeredCount: this.questionsAnswered,
      totalChallenges: this.totalChallenges,
      hintText:
        "🌋 Awas Kawah Lava! Kamu dikembalikan ke pijakan aman terakhir.",
    });

    this.time.delayedCall(2200, () => {
      uiManager.updateAdventureHUD({ hintText: "" });
    });
  }

  handleCollectCoin(player, coin) {
    if (coin.getData("collected")) return;
    coin.setData("collected", true);
    coin.disableBody(true, true);

    this.coinsCollected += 5;
    uiManager.playTone("coin");
    uiManager.updateAdventureHUD({
      coins: this.coinsCollected,
      answeredCount: this.questionsAnswered,
      totalChallenges: this.totalChallenges,
    });
  }

  handleHitObstacle(player, hazard) {
    const now = this.time.now;
    if (now - this.lastHitTime < 1100 || this.isQuizOpen) return;
    this.lastHitTime = now;

    uiManager.playTone("wrong");
    player.setVelocityY(-340);
    player.setVelocityX(player.x < hazard.x ? -220 : 220);

    this.cameras.main.shake(140, 0.006);
    uiManager.updateAdventureHUD({
      coins: this.coinsCollected,
      answeredCount: this.questionsAnswered,
      totalChallenges: this.totalChallenges,
      hintText:
        "⚠️ Hati-hati jebakan & rintangan! Perhatikan waktu lompatanmu!",
    });

    this.time.delayedCall(2000, () => {
      uiManager.updateAdventureHUD({ hintText: "" });
    });
  }

  handleTriggerChallenge(player, challengeObj) {
    if (!challengeObj || this.isQuizOpen || this.levelCompleted || challengeObj.getData('solved')) {
      return;
    }

    this.isQuizOpen = true;
    player.setVelocity(0, 0);
    this.physics.pause();

    this.touchState.left = false;
    this.touchState.right = false;
    this.touchState.jump = false;

    this.presentNextQuestionInBox(player, challengeObj);
  }

  presentNextQuestionInBox(player, challengeObj) {
    const boxAnswered = challengeObj.getData("answeredCount") || 0;
    const requiredCount = challengeObj.getData("requiredCount") || 1;
    const currentStepInBox = boxAnswered + 1;

    const qData = questionManager.getNextQuestion(this.subject, null, {
      grade: this.grade,
      profile: uiManager.activeProfile || this.profile,
      settings: uiManager.settings,
      forceDifficulty: this.levelDifficulty,
      modeLabel: `Level ${this.levelDifficulty.toUpperCase()}`,
    });

    if (qData.error) {
      this.physics.resume();
      this.isQuizOpen = false;
      player.setX(player.x - 45);
      uiManager.updateAdventureHUD({
        hintText: `⚠️ ${qData.message}`,
      });
      return;
    }

    const baseTitle = challengeObj.getData("title");
    const type = challengeObj.getData("type");
    const baseName = challengeObj.getData("baseName");
    const labelObj = challengeObj.getData("labelObj");
    const onSolvedCallback = challengeObj.getData("onSolved");
    const globalNumber = this.questionsAnswered + 1;

    uiManager.showQuestionModal({
      questionData: qData,
      triggerTitle: `${baseTitle} (Pos ${currentStepInBox}/${requiredCount} • Soal Ke-${globalNumber}/${this.totalChallenges})`,
      onComplete: async (isCorrect, chosenAnswer) => {
        const updatedBoxAnswered = boxAnswered + 1;
        challengeObj.setData("answeredCount", updatedBoxAnswered);

        this.questionsAnswered += 1;
        if (isCorrect) {
          this.correctAnswers += 1;
          this.coinsCollected += 25;
        } else {
          this.wrongAnswers += 1;
        }

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
              grade: this.grade,
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

        uiManager.updateAdventureHUD({
          coins: this.coinsCollected,
          answeredCount: this.questionsAnswered,
          totalChallenges: this.totalChallenges,
        });

        if (updatedBoxAnswered < requiredCount) {
          if (labelObj) {
            labelObj.setText(
              `⏳ ${baseName} (${updatedBoxAnswered}/${requiredCount})`,
            );
          }
          this.presentNextQuestionInBox(player, challengeObj);
          return;
        }

        this.physics.resume();
        this.isQuizOpen = false;
        challengeObj.setData("solved", true);

        if (type === "chest") {
          challengeObj.setTexture("chest_open");
          if (labelObj)
            labelObj.setText(
              `✅ ${baseName} (${requiredCount}/${requiredCount})`,
            );
        } else if (type === "switch") {
          challengeObj.setTexture("switch_on");
          if (labelObj)
            labelObj.setText(
              `⚡ ${baseName} Aktif! (${requiredCount}/${requiredCount})`,
            );
        } else if (type === "gate") {
          if (this.gateCollider) {
            this.physics.world.removeCollider(this.gateCollider);
          }
          challengeObj.disableBody(true, true);
          if (labelObj)
            labelObj.setText(
              `🔓 Gerbang Terbuka! (${requiredCount}/${requiredCount})`,
            );
        } else if (type === "npc") {
          challengeObj.setTint(0xbadc58);
          if (labelObj)
            labelObj.setText(
              `✅ ${baseName} (${requiredCount}/${requiredCount})`,
            );
        }

        if (typeof onSolvedCallback === "function") {
          onSolvedCallback();
        }

        const remainingTotal = this.totalChallenges - this.questionsAnswered;
        const statusMsg =
          remainingTotal > 0
            ? `🌟 Mekanisme aktif! Masih ada ${remainingTotal} soal lagi sebelum ke Garis Finis.`
            : `🏁 Seluruh ${this.totalChallenges} soal telah dikerjakan! Ayo menuju Bendera Finis!`;

        uiManager.updateAdventureHUD({
          coins: this.coinsCollected,
          answeredCount: this.questionsAnswered,
          totalChallenges: this.totalChallenges,
          hintText: statusMsg,
        });

        this.time.delayedCall(3000, () => {
          uiManager.updateAdventureHUD({ hintText: "" });
        });
      },
    });
  }

  handleReachFinish() {
    if (this.levelCompleted || this.isQuizOpen) return;

    if (this.questionsAnswered < this.totalChallenges) {
      const kurang = this.totalChallenges - this.questionsAnswered;
      uiManager.playTone("wrong");
      this.player.setX(this.player.x - 60);
      uiManager.updateAdventureHUD({
        coins: this.coinsCollected,
        answeredCount: this.questionsAnswered,
        totalChallenges: this.totalChallenges,
        hintText: `🔒 Kamu baru mengerjakan ${this.questionsAnswered}/${this.totalChallenges} soal! Selesaikan ${kurang} soal lagi di pos sebelumnya!`,
      });
      this.time.delayedCall(3500, () => {
        uiManager.updateAdventureHUD({ hintText: "" });
      });
      return;
    }

    this.levelCompleted = true;
    this.physics.pause();

    this.coinsCollected += 30;
    const durationSec = Math.max(
      1,
      Math.round((performance.now() - this.sessionStartTime) / 1000),
    );
    const accuracyPct = Math.round(
      (this.correctAnswers / this.totalChallenges) * 100,
    );

    let stars = 1;
    if (accuracyPct >= 80) {
      stars = 3;
    } else if (accuracyPct >= 55) {
      stars = 2;
    }

    const subjLabel = this.getSubjectLabel();
    const badge = `${this.levelMeta.name} — ${subjLabel}`;
    const collectibleItem = `Relik ${this.levelMeta.name} (${subjLabel})`;
    const levelTitle = `${this.levelMeta.name} — ${subjLabel} Kelas ${this.grade}`;

    uiManager.showAdventureResult({
      levelId: `g${this.grade}_${this.subject}_${this.levelKey}`,
      grade: this.grade,
      levelKey: this.levelKey,
      difficulty: this.levelDifficulty,
      levelTitle,
      subject: this.subject,
      totalQuestions: this.totalChallenges,
      coinsEarned: this.coinsCollected,
      correctCount: this.correctAnswers,
      wrongCount: this.wrongAnswers,
      accuracy: accuracyPct,
      durationSec,
      starsEarned: stars,
      badgeEarned: badge,
      collectibleItem,
      answerHistory: this.answerHistory,
    });
  }

  update() {
    if (!this.player || this.isQuizOpen || this.levelCompleted) return;

    this.movingPlatformsList.forEach((plat) => {
      if (!plat.getData("active")) {
        plat.body.setVelocity(0, 0);
        return;
      }
      const moveType = plat.getData("moveType");
      const speed = plat.getData("speed");
      let dir = plat.getData("direction");

      if (moveType === "horizontal") {
        if (plat.x >= plat.getData("maxX")) dir = -1;
        else if (plat.x <= plat.getData("minX")) dir = 1;
        plat.setData("direction", dir);
        plat.body.setVelocityX(speed * dir);
      } else {
        if (plat.y >= plat.getData("maxY")) dir = -1;
        else if (plat.y <= plat.getData("minY")) dir = 1;
        plat.setData("direction", dir);
        plat.body.setVelocityY(speed * dir);
      }
    });

    this.checkpoints.forEach((cp) => {
      if (this.player.x >= cp.x) {
        this.lastSafeCheckpoint = cp;
      }
    });

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
