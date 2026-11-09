import Phaser from "phaser";
import { GAME_CONFIG } from "../config/gameConfig.js";
import { questionManager } from "../systems/QuestionManager.js";
import { uiManager } from "../systems/UIManager.js";
import { db } from "../storage/db.js";

export class CarRacingScene extends Phaser.Scene {
  constructor() {
    super("CarRacingScene");
  }

  init(data) {
    this.profile = data?.profile || null;
    this.grade = Number(data?.grade) || Number(this.profile?.grade) || 3;
    this.subject = data?.subject || "matematika";
    this.levelKey = "medium";

    const levelMeta =
      GAME_CONFIG.adventureLevels.find((l) => l.id === "medium") ||
      GAME_CONFIG.adventureLevels[1];

    this.levelMeta = levelMeta;
    this.levelDifficulty = levelMeta.difficulty || "sedang";
    this.totalChallenges = levelMeta.totalQuestions || 7;

    this.coinsCollected = 0;
    this.questionsAnswered = 0;
    this.correctAnswers = 0;
    this.wrongAnswers = 0;
    this.answerHistory = [];
    this.isQuizOpen = false;
    this.levelCompleted = false;
    this.finishLineSpawned = false;
    this.lastHitTime = 0;
    this.sessionStartTime = performance.now();

    this.lanes = [410, 560, 720, 870];
    this.roadSpeed = 250;
    this.carMoveSpeed = 340;
    this.spawnTimer = 0;

    this.touchState = {
      left: false,
      right: false,
      up: false,
      down: false,
      jump: false,
    };
  }

  getSubjectLabel() {
    const found = GAME_CONFIG.subjects.find((s) => s.id === this.subject);
    return found ? found.name : "Matematika";
  }

  create() {
    questionManager.resetSession();

    const W = GAME_CONFIG.width;
    const H = GAME_CONFIG.height;

    const grass = this.add.graphics();
    grass.fillStyle(0x27ae60, 1);
    grass.fillRect(0, 0, W, H);
    grass.fillStyle(0x2ecc71, 1);
    grass.fillRect(40, 0, 260, H);
    grass.fillRect(980, 0, 260, H);

    const road = this.add.graphics();
    road.fillStyle(0x34495e, 1);
    road.fillRect(320, 0, 640, H);
    road.fillStyle(0xffffff, 1);
    road.fillRect(330, 0, 10, H);
    road.fillRect(940, 0, 10, H);

    this.roadLines = [];
    const laneDividers = [485, 640, 795];
    laneDividers.forEach((lx) => {
      for (let y = -60; y < H + 60; y += 110) {
        const stripe = this.add.rectangle(lx, y, 8, 52, 0xf1c40f);
        this.roadLines.push(stripe);
      }
    });

    this.sideTrees = [];
    for (let y = -40; y < H + 80; y += 160) {
      const treeL = this.add.circle(180, y, 36, 0x1e8449);
      const treeR = this.add.circle(1100, y + 70, 36, 0x1e8449);
      this.sideTrees.push(treeL, treeR);
    }

    this.coinsGroup = this.physics.add.group({ allowGravity: false });
    this.obstaclesGroup = this.physics.add.group({ allowGravity: false });
    this.chestGroup = this.physics.add.group({ allowGravity: false });
    this.finishGroup = this.physics.add.group({ allowGravity: false });

    const charId = this.profile?.character || "kiko";
    this.playerCar = this.physics.add.sprite(640, H - 125, "race_car_player");
    this.playerCar.setCollideWorldBounds(true);
    this.playerCar.body.allowGravity = false;
    this.playerCar.body.setSize(52, 88);

    this.driverHead = this.add
      .sprite(640, H - 120, `player_${charId}`)
      .setScale(0.55);

    this.add
      .text(
        640,
        78,
        `🏎️ BALAP MOBIL ${this.getSubjectLabel().toUpperCase()} (7 SOAL): Geser Kiri/Kanan & Tabrak Peti Soal!`,
        {
          fontFamily: "Segoe UI, sans-serif",
          fontSize: "16px",
          fontStyle: "bold",
          color: "#ffffff",
          backgroundColor: "#2c3e50",
          padding: { x: 14, y: 6 },
        },
      )
      .setOrigin(0.5)
      .setDepth(15);

    this.physics.add.overlap(
      this.playerCar,
      this.coinsGroup,
      this.handleCollectCoin,
      null,
      this,
    );
    this.physics.add.overlap(
      this.playerCar,
      this.obstaclesGroup,
      this.handleHitObstacle,
      null,
      this,
    );
    this.physics.add.overlap(
      this.playerCar,
      this.chestGroup,
      this.handleHitQuestionChest,
      null,
      this,
    );
    this.physics.add.overlap(
      this.playerCar,
      this.finishGroup,
      this.handleCrossFinishLine,
      null,
      this,
    );

    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys({
      leftA: Phaser.Input.Keyboard.KeyCodes.A,
      rightD: Phaser.Input.Keyboard.KeyCodes.D,
    });

    this.spawnWave();
  }

  spawnWave() {
    if (this.levelCompleted || this.finishLineSpawned) return;

    if (this.questionsAnswered >= this.totalChallenges) {
      this.spawnFinishBanner();
      return;
    }

    const activeChests = this.chestGroup.countActive(true);
    const laneIndices = Phaser.Utils.Array.Shuffle([0, 1, 2, 3]);

    if (activeChests < 2) {
      const chestLane = this.lanes[laneIndices[0]];
      const chest = this.chestGroup.create(chestLane, -60, "chest_closed");
      chest.body.allowGravity = false;
      chest.setVelocityY(this.roadSpeed);
      chest.setData("triggered", false);
    }

    const coinLane = this.lanes[laneIndices[1]];
    for (let i = 0; i < 3; i++) {
      const c = this.coinsGroup.create(coinLane, -70 - i * 55, "coin_gold");
      c.body.allowGravity = false;
      c.setVelocityY(this.roadSpeed);
      c.setData("collected", false);
    }

    if (Math.random() < 0.75) {
      const obsLane = this.lanes[laneIndices[2]];
      const tex = Math.random() > 0.45 ? "road_cone" : "obstacle_car";
      const obs = this.obstaclesGroup.create(obsLane, -90, tex);
      obs.body.allowGravity = false;
      obs.setVelocityY(
        tex === "obstacle_car" ? this.roadSpeed + 35 : this.roadSpeed,
      );
    }
  }

  spawnFinishBanner() {
    if (this.finishLineSpawned) return;
    this.finishLineSpawned = true;

    const finishStrip = this.finishGroup.create(640, -80, "race_finish_banner");
    finishStrip.body.allowGravity = false;
    finishStrip.setDisplaySize(600, 48);
    finishStrip.body.setSize(600, 48);
    finishStrip.setVelocityY(this.roadSpeed);

    uiManager.updateAdventureHUD({
      coins: this.coinsCollected,
      answeredCount: this.questionsAnswered,
      totalChallenges: this.totalChallenges,
      hintText: "🏁 Seluruh 7 soal selesai! Garis Finis terlihat di depan!",
    });
  }

  handleCollectCoin(car, coin) {
    if (coin.getData("collected")) return;
    coin.setData("collected", true);
    coin.destroy();

    this.coinsCollected += 5;
    uiManager.playTone("coin");
    uiManager.updateAdventureHUD({
      coins: this.coinsCollected,
      answeredCount: this.questionsAnswered,
      totalChallenges: this.totalChallenges,
    });
  }

  handleHitObstacle(car, obs) {
    const now = this.time.now;
    if (now - this.lastHitTime < 1000 || this.isQuizOpen) return;
    this.lastHitTime = now;

    obs.destroy();
    uiManager.playTone("wrong");
    this.cameras.main.shake(140, 0.007);

    uiManager.updateAdventureHUD({
      coins: this.coinsCollected,
      answeredCount: this.questionsAnswered,
      totalChallenges: this.totalChallenges,
      hintText:
        "⚠️ Awas rintangan jalan! Fokus tabrak Peti Soal berwarna merah-emas!",
    });

    this.time.delayedCall(1800, () => {
      uiManager.updateAdventureHUD({ hintText: "" });
    });
  }

  handleHitQuestionChest(car, chest) {
    if (this.isQuizOpen || this.levelCompleted || chest.getData("triggered"))
      return;
    chest.setData("triggered", true);
    chest.setTexture("chest_open");

    this.isQuizOpen = true;
    this.playerCar.setVelocity(0, 0);
    this.physics.pause();

    this.touchState.left = false;
    this.touchState.right = false;

    const qData = questionManager.getNextQuestion(this.subject, null, {
      grade: this.grade,
      profile: uiManager.activeProfile || this.profile,
      settings: uiManager.settings,
      forceDifficulty: this.levelDifficulty,
      modeLabel: `Level ${this.levelDifficulty.toUpperCase()}`,
    });

    if (qData.error) {
      chest.destroy();
      this.physics.resume();
      this.isQuizOpen = false;
      return;
    }

    const qNum = this.questionsAnswered + 1;
    const subjLabel = this.getSubjectLabel();

    uiManager.showQuestionModal({
      questionData: qData,
      triggerTitle: `🏎️ Pos Balap ${subjLabel} — Soal Ke-${qNum}/${this.totalChallenges}`,
      onComplete: async (isCorrect, chosenAnswer) => {
        chest.destroy();
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

        this.physics.resume();
        this.isQuizOpen = false;

        const sisa = this.totalChallenges - this.questionsAnswered;
        uiManager.updateAdventureHUD({
          coins: this.coinsCollected,
          answeredCount: this.questionsAnswered,
          totalChallenges: this.totalChallenges,
          hintText:
            sisa > 0
              ? `🏎️ Mantap! Tabrak ${sisa} peti soal lagi di depan!`
              : `🏁 Seluruh ${this.totalChallenges} soal tuntas! Laju terus lewati Garis Finis!`,
        });

        if (this.questionsAnswered >= this.totalChallenges) {
          this.spawnFinishBanner();
        }
      },
    });
  }

  handleCrossFinishLine() {
    if (this.levelCompleted || this.isQuizOpen) return;
    this.levelCompleted = true;
    this.physics.pause();

    this.coinsCollected += 35;
    const durationSec = Math.max(
      1,
      Math.round((performance.now() - this.sessionStartTime) / 1000),
    );
    const accuracyPct = Math.round(
      (this.correctAnswers / this.totalChallenges) * 100,
    );

    let stars = 1;
    if (accuracyPct >= 80) stars = 3;
    else if (accuracyPct >= 55) stars = 2;

    const subjLabel = this.getSubjectLabel();
    const badge = `Pembalap Cerdas ${subjLabel}`;
    const collectibleItem = `Trofi Balap Emas (${subjLabel})`;
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

  update(time, delta) {
    if (this.isQuizOpen || this.levelCompleted) return;

    const dt = delta / 1000;
    const H = GAME_CONFIG.height;

    this.roadLines.forEach((line) => {
      line.y += this.roadSpeed * dt;
      if (line.y > H + 60) line.y -= H + 120;
    });

    this.sideTrees.forEach((tree) => {
      tree.y += this.roadSpeed * dt;
      if (tree.y > H + 80) tree.y -= H + 160;
    });

    const moveLeft =
      this.cursors.left.isDown ||
      this.keys.leftA.isDown ||
      this.touchState.left;
    const moveRight =
      this.cursors.right.isDown ||
      this.keys.rightD.isDown ||
      this.touchState.right;

    if (moveLeft && this.playerCar.x > 375) {
      this.playerCar.setVelocityX(-this.carMoveSpeed);
      this.playerCar.setAngle(-6);
    } else if (moveRight && this.playerCar.x < 905) {
      this.playerCar.setVelocityX(this.carMoveSpeed);
      this.playerCar.setAngle(6);
    } else {
      this.playerCar.setVelocityX(0);
      this.playerCar.setAngle(0);
    }

    this.playerCar.x = Phaser.Math.Clamp(this.playerCar.x, 375, 905);
    this.driverHead.setPosition(this.playerCar.x, this.playerCar.y + 4);

    [this.coinsGroup, this.obstaclesGroup, this.chestGroup].forEach((grp) => {
      grp.getChildren().forEach((child) => {
        if (child.y > H + 90) child.destroy();
      });
    });

    this.spawnTimer += delta;
    if (this.spawnTimer >= 1650) {
      this.spawnTimer = 0;
      this.spawnWave();
    }
  }
}
