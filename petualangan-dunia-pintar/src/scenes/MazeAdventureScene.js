import Phaser from "phaser";
import { GAME_CONFIG } from "../config/gameConfig.js";
import { questionManager } from "../systems/QuestionManager.js";
import { uiManager } from "../systems/UIManager.js";
import { db } from "../storage/db.js";

export class MazeAdventureScene extends Phaser.Scene {
  constructor() {
    super("MazeAdventureScene");
  }

  init(data) {
    this.profile = data?.profile || null;
    this.grade = Number(data?.grade) || Number(this.profile?.grade) || 3;
    this.subject = data?.subject || "matematika";
    this.levelKey = "hard";

    const levelMeta =
      GAME_CONFIG.adventureLevels.find((l) => l.id === "hard") ||
      GAME_CONFIG.adventureLevels[2];

    this.levelMeta = levelMeta;
    this.levelDifficulty = levelMeta.difficulty || "sulit";
    this.totalChallenges = levelMeta.totalQuestions || 10;

    this.coinsCollected = 0;
    this.keysOwned = 0;
    this.questionsAnswered = 0;
    this.correctAnswers = 0;
    this.wrongAnswers = 0;
    this.answerHistory = [];
    this.isQuizOpen = false;
    this.levelCompleted = false;
    this.lastHitTime = 0;
    this.sessionStartTime = performance.now();

    this.tileSize = 64;
    this.moveSpeed = 230;

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

    const grid = this.generateAndValidateMaze();
    const rows = grid.length;
    const cols = grid[0].length;
    const worldW = cols * this.tileSize;
    const worldH = rows * this.tileSize;

    this.physics.world.setBounds(0, 0, worldW, worldH);

    this.wallsGroup = this.physics.add.staticGroup();
    this.coinsGroup = this.physics.add.group({
      allowGravity: false,
      immovable: true,
    });
    this.keysGroup = this.physics.add.group({
      allowGravity: false,
      immovable: true,
    });
    this.keyDoorsGroup = this.physics.add.staticGroup();
    this.trapsGroup = this.physics.add.staticGroup();
    this.questionNodesGroup = this.physics.add.staticGroup();

    let startX = 96;
    let startY = 96;
    let qNodeIndex = 0;
    const questionQuotas = [1, 1, 1, 1, 1, 1, 2, 2];

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const ch = grid[r][c];
        const x = c * this.tileSize + this.tileSize / 2;
        const y = r * this.tileSize + this.tileSize / 2;

        this.add.image(x, y, "maze_floor_tile");

        if (ch === "W") {
          const wall = this.wallsGroup.create(x, y, "maze_wall_tile");
          wall.refreshBody();
        } else if (ch === "S") {
          startX = x;
          startY = y;
        } else if (ch === "C") {
          const coin = this.coinsGroup.create(x, y, "coin_gold");
          coin.setData("collected", false);
        } else if (ch === "K") {
          const keyItem = this.keysGroup.create(x, y, "maze_key");
          keyItem.setData("collected", false);
          this.tweens.add({
            targets: keyItem,
            scale: 1.15,
            duration: 600,
            yoyo: true,
            repeat: -1,
          });
        } else if (ch === "D") {
          const kDoor = this.keyDoorsGroup.create(x, y, "maze_key_door");
          kDoor.setDisplaySize(56, 56);
          kDoor.refreshBody();
          kDoor.body.setSize(52, 52);
          kDoor.setData("opened", false);
          const doorLbl = this.add
            .text(x, y - 28, "🔑 Pintu Kunci", {
              fontSize: "11px",
              fontStyle: "bold",
              color: "#fff",
              backgroundColor: "#d35400",
              padding: { x: 4, y: 2 },
            })
            .setOrigin(0.5)
            .setDepth(10);
          kDoor.setData("labelObj", doorLbl);
        } else if (ch === "T") {
          const trap = this.trapsGroup.create(x, y, "obstacle_spike");
          trap.refreshBody();
          trap.body.setSize(32, 26);
        } else if (ch === "Q" || ch === "G") {
          const quota = questionQuotas[qNodeIndex] || 1;
          qNodeIndex += 1;
          const isGate = ch === "G";
          const tex = isGate ? "math_gate" : "chest_closed";
          const node = this.questionNodesGroup.create(x, y, tex);
          if (isGate) {
            node.setDisplaySize(54, 54);
          }
          node.refreshBody();
          node.body.setSize(48, 48);

          const lbl = this.add
            .text(
              x,
              y - 30,
              isGate ? `🚪 Pintu Soal (0/${quota})` : `📦 Peti (0/${quota})`,
              {
                fontFamily: "Segoe UI, sans-serif",
                fontSize: "12px",
                fontStyle: "bold",
                color: "#ffffff",
                backgroundColor: isGate ? "#c0392b" : "#2980b9",
                padding: { x: 5, y: 2 },
              },
            )
            .setOrigin(0.5)
            .setDepth(12);

          node.setData({
            id: `maze_q_${qNodeIndex}`,
            type: isGate ? "gate" : "chest",
            answeredCount: 0,
            requiredCount: quota,
            solved: false,
            labelObj: lbl,
          });
        } else if (ch === "E") {
          this.exitPortal = this.physics.add.staticImage(
            x,
            y,
            "maze_exit_portal",
          );
          this.exitPortal.refreshBody();
          this.add
            .text(x, y - 34, "🏁 KELUAR", {
              fontSize: "13px",
              fontStyle: "bold",
              color: "#fff",
              backgroundColor: "#27ae60",
              padding: { x: 6, y: 2 },
            })
            .setOrigin(0.5)
            .setDepth(12);
        }
      }
    }

    const charId = this.profile?.character || "kiko";
    this.player = this.physics.add.sprite(startX, startY, `player_${charId}`);
    this.player.setScale(0.68);
    this.player.setCollideWorldBounds(true);
    this.player.body.allowGravity = false;
    this.player.body.setSize(30, 34);
    this.player.body.setOffset(11, 20);

    this.guideBanner = this.add
      .text(startX, startY - 40, "🧭 Cari Peti Soal & Kunci!", {
        fontFamily: "Segoe UI, sans-serif",
        fontSize: "13px",
        fontStyle: "bold",
        color: "#fff200",
        backgroundColor: "#2c3e50",
        padding: { x: 8, y: 3 },
      })
      .setOrigin(0.5)
      .setDepth(20);

    this.physics.add.collider(this.player, this.wallsGroup);
    this.physics.add.collider(
      this.player,
      this.keyDoorsGroup,
      this.handleTouchKeyDoor,
      null,
      this,
    );
    this.physics.add.collider(
      this.player,
      this.questionNodesGroup,
      this.handleTouchQuestionNode,
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
      this.keysGroup,
      this.handleCollectKey,
      null,
      this,
    );
    this.physics.add.overlap(
      this.player,
      this.trapsGroup,
      this.handleStepTrap,
      null,
      this,
    );
    if (this.exitPortal) {
      this.physics.add.overlap(
        this.player,
        this.exitPortal,
        this.handleReachExitPortal,
        null,
        this,
      );
    }

    this.cameras.main.setBounds(0, 0, worldW, worldH);
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);

    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys({
      upW: Phaser.Input.Keyboard.KeyCodes.W,
      downS: Phaser.Input.Keyboard.KeyCodes.S,
      leftA: Phaser.Input.Keyboard.KeyCodes.A,
      rightD: Phaser.Input.Keyboard.KeyCodes.D,
    });
  }

  generateAndValidateMaze() {
    const candidateLayouts = [
      [
        "WWWWWWWWWWWWWWWWWWWW",
        "WS..Q...W...C..Q..KW",
        "W.WWWWW.W.WWWWWWW.WW",
        "W.C.....W.......W..W",
        "W.WWWWW.WWWWWWW.W.QW",
        "W...Q...W..T..C.W..W",
        "WWWWWWW.W.WWWWW.WWWW",
        "WK..C...D.....Q....W",
        "W.WWWWW.W.WWWWWWW..W",
        "W.Q.....W..T....W.CW",
        "W.WWWWW.WWWWWWW.W..W",
        "W...C......Q....G.EW",
        "WWWWWWWWWWWWWWWWWWWW",
      ],
      [
        "WWWWWWWWWWWWWWWWWWWW",
        "WS..C..Q..W....Q..KW",
        "W.WWWWWWW.W.WWWWWWWW",
        "W.......W.W........W",
        "WWWWWWW.W.WWWWWWW..W",
        "WK..Q...W...T...C.QW",
        "W.WWWWW.WWWWWWW.W..W",
        "W.C.....D.......W..W",
        "W.WWWWW.W.WWWWWWW..W",
        "W...Q...W.....Q....W",
        "WWWWWWW.WWWWW.WWWW.W",
        "W...C.....T.....G.EW",
        "WWWWWWWWWWWWWWWWWWWW",
      ],
      [
        "WWWWWWWWWWWWWWWWWWWW",
        "WS....Q...W..C..Q.KW",
        "W.WWWWWWW.W.WWWWWW.W",
        "W.C.......W........W",
        "W.WWWWWWW.WWWWWWW..W",
        "W...Q.....W..T..C.QW",
        "WWWWWWWWW.W.WWWWW..W",
        "WK..C.....D...Q....W",
        "W.WWWWWWW.W.WWWWWW.W",
        "W.Q.......W........W",
        "W.WWWWWWW.WWWWWWW..W",
        "W...C..T.....Q..G.EW",
        "WWWWWWWWWWWWWWWWWWWW",
      ],
    ];

    const shuffled = Phaser.Utils.Array.Shuffle([...candidateLayouts]);

    for (const rawLayout of shuffled) {
      const grid = rawLayout.map((row) => row.split(""));
      if (this.validateMazeWithBFS(grid)) {
        return grid;
      }
    }

    const fallbackGrid = candidateLayouts[0].map((row) => row.split(""));
    this.repairMazeConnectivity(fallbackGrid);
    return fallbackGrid;
  }

  validateMazeWithBFS(grid) {
    let startPos = null;
    let exitPos = null;
    const keyPositions = [];
    const doorPositions = [];
    const questionPositions = [];

    for (let r = 0; r < grid.length; r++) {
      for (let c = 0; c < grid[r].length; c++) {
        const ch = grid[r][c];
        if (ch === "S") startPos = { r, c };
        else if (ch === "E") exitPos = { r, c };
        else if (ch === "K") keyPositions.push({ r, c });
        else if (ch === "D") doorPositions.push({ r, c });
        else if (ch === "Q" || ch === "G") questionPositions.push({ r, c });
      }
    }

    if (!startPos || !exitPos || questionPositions.length !== 8) {
      return false;
    }

    const phase1Visited = this.bfsReachable(
      grid,
      startPos,
      new Set(["W", "D", "G", "T"]),
    );
    const reachableKeysBeforeDoor = keyPositions.filter((k) =>
      phase1Visited.has(`${k.r},${k.c}`),
    );

    if (doorPositions.length > 0 && reachableKeysBeforeDoor.length === 0) {
      return false;
    }

    for (const d of doorPositions) {
      if (!this.isAdjacentToVisited(d, phase1Visited)) {
        return false;
      }
    }

    const phase2Visited = this.bfsReachable(
      grid,
      startPos,
      new Set(["W", "T"]),
    );

    for (const q of questionPositions) {
      if (!phase2Visited.has(`${q.r},${q.c}`)) {
        return false;
      }
    }

    for (const k of keyPositions) {
      if (!phase2Visited.has(`${k.r},${k.c}`)) {
        return false;
      }
    }

    if (!phase2Visited.has(`${exitPos.r},${exitPos.c}`)) {
      return false;
    }

    return true;
  }

  bfsReachable(grid, startPos, blockedCharsSet) {
    const rows = grid.length;
    const cols = grid[0].length;
    const visited = new Set();
    const queue = [startPos];
    visited.add(`${startPos.r},${startPos.c}`);

    const dirs = [
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1],
    ];

    while (queue.length > 0) {
      const curr = queue.shift();
      for (const [dr, dc] of dirs) {
        const nr = curr.r + dr;
        const nc = curr.c + dc;
        if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
        const key = `${nr},${nc}`;
        if (visited.has(key)) continue;

        const ch = grid[nr][nc];
        if (blockedCharsSet.has(ch)) continue;

        visited.add(key);
        queue.push({ r: nr, c: nc });
      }
    }

    return visited;
  }

  isAdjacentToVisited(pos, visitedSet) {
    const dirs = [
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1],
    ];
    return dirs.some(([dr, dc]) =>
      visitedSet.has(`${pos.r + dr},${pos.c + dc}`),
    );
  }

  repairMazeConnectivity(grid) {
    for (let r = 1; r < grid.length - 1; r++) {
      for (let c = 1; c < grid[r].length - 1; c++) {
        if (grid[r][c] === "W" && r % 2 === 1 && c % 4 === 0) {
          grid[r][c] = ".";
        }
      }
    }
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

  handleCollectKey(player, keyItem) {
    if (keyItem.getData("collected")) return;
    keyItem.setData("collected", true);
    keyItem.disableBody(true, true);

    this.keysOwned += 1;
    uiManager.playTone("correct");
    uiManager.updateAdventureHUD({
      coins: this.coinsCollected,
      answeredCount: this.questionsAnswered,
      totalChallenges: this.totalChallenges,
      hintText: `🔑 Kamu menemukan Kunci Emas! (Kunci dimiliki: ${this.keysOwned})`,
    });
  }

  handleTouchKeyDoor(player, door) {
    if (door.getData("opened")) return;
    if (this.keysOwned > 0) {
      this.keysOwned -= 1;
      door.setData("opened", true);
      door.disableBody(true, true);
      const lbl = door.getData("labelObj");
      if (lbl) lbl.setText("🔓 Terbuka");
      uiManager.playTone("correct");
      uiManager.updateAdventureHUD({
        hintText:
          "🔓 Pintu Kunci terbuka! Jalur baru di labirin telah terbuka!",
      });
    } else {
      uiManager.playTone("wrong");
      uiManager.updateAdventureHUD({
        hintText:
          "🔒 Pintu ini membutuhkan Kunci Emas (🔑)! Ambil kunci di jalur yang sudah terbuka!",
      });
    }
  }

  handleStepTrap(player, trap) {
    const now = this.time.now;
    if (now - this.lastHitTime < 1200 || this.isQuizOpen) return;
    this.lastHitTime = now;

    uiManager.playTone("wrong");
    this.cameras.main.shake(120, 0.005);

    uiManager.updateAdventureHUD({
      hintText:
        "⚠️ Hati-hati jebakan lantai berduri! Lewati dari jalur di sebelahnya.",
    });
  }

  handleTouchQuestionNode(player, node) {
    if (this.isQuizOpen || node.getData("solved")) return;

    this.isQuizOpen = true;
    player.setVelocity(0, 0);
    this.physics.pause();

    this.touchState.left = false;
    this.touchState.right = false;
    this.touchState.up = false;
    this.touchState.down = false;

    this.presentNextMazeQuestion(player, node);
  }

  presentNextMazeQuestion(player, node) {
    const answeredCount = node.getData("answeredCount") || 0;
    const requiredCount = node.getData("requiredCount") || 1;
    const stepNum = answeredCount + 1;

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
      return;
    }

    const type = node.getData("type");
    const labelObj = node.getData("labelObj");
    const subjLabel = this.getSubjectLabel();
    const globalNumber = this.questionsAnswered + 1;

    uiManager.showQuestionModal({
      questionData: qData,
      triggerTitle: `🧭 Labirin ${subjLabel} (Pos ${stepNum}/${requiredCount} • Total Soal Ke-${globalNumber}/${this.totalChallenges})`,
      onComplete: async (isCorrect, chosenAnswer) => {
        const nextBoxCount = answeredCount + 1;
        node.setData("answeredCount", nextBoxCount);

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

        if (nextBoxCount < requiredCount) {
          if (labelObj)
            labelObj.setText(`⏳ (${nextBoxCount}/${requiredCount})`);
          this.presentNextMazeQuestion(player, node);
          return;
        }

        this.physics.resume();
        this.isQuizOpen = false;
        node.setData("solved", true);

        if (type === "gate") {
          node.disableBody(true, true);
          if (labelObj) labelObj.setText("🔓 Terbuka!");
        } else {
          node.setTexture("chest_open");
          node.disableBody(true, false);
          if (labelObj) labelObj.setText("✅ Selesai!");
        }

        const sisa = this.totalChallenges - this.questionsAnswered;
        uiManager.updateAdventureHUD({
          coins: this.coinsCollected,
          answeredCount: this.questionsAnswered,
          totalChallenges: this.totalChallenges,
          hintText:
            sisa > 0
              ? `🧭 Bagus! Ikuti kompas penunjuk arah untuk mencari ${sisa} soal lagi!`
              : `🏁 Seluruh 10 soal Labirin selesai! Menujulah ke Portal KELUAR di kanan bawah!`,
        });
      },
    });
  }

  handleReachExitPortal() {
    if (this.levelCompleted || this.isQuizOpen) return;

    if (this.questionsAnswered < this.totalChallenges) {
      const kurang = this.totalChallenges - this.questionsAnswered;
      uiManager.playTone("wrong");
      this.player.setPosition(this.player.x - 36, this.player.y);
      uiManager.updateAdventureHUD({
        hintText: `🔒 Selesaikan ${kurang} soal lagi di dalam labirin sebelum masuk ke Portal Keluar!`,
      });
      return;
    }

    this.levelCompleted = true;
    this.physics.pause();

    this.coinsCollected += 40;
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
    const badge = `Penakluk Labirin ${subjLabel}`;
    const collectibleItem = `Mahkota Labirin Pintar (${subjLabel})`;
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

  updateCompassHint() {
    let targetObj = null;
    let minDist = Infinity;

    this.questionNodesGroup.getChildren().forEach((node) => {
      if (!node.getData("solved")) {
        const d = Phaser.Math.Distance.Between(
          this.player.x,
          this.player.y,
          node.x,
          node.y,
        );
        if (d < minDist) {
          minDist = d;
          targetObj = node;
        }
      }
    });

    if (!targetObj && this.exitPortal) {
      targetObj = this.exitPortal;
    }

    if (targetObj && this.guideBanner) {
      const dx = targetObj.x - this.player.x;
      const dy = targetObj.y - this.player.y;
      let dirArrow = "➡️";
      if (Math.abs(dx) > Math.abs(dy)) {
        dirArrow = dx > 0 ? "➡️ Kanan" : "⬅️ Kiri";
      } else {
        dirArrow = dy > 0 ? "⬇️ Bawah" : "⬆️ Atas";
      }
      const labelTarget =
        this.questionsAnswered < this.totalChallenges
          ? "Peti/Pintu Soal"
          : "Portal Keluar";
      this.guideBanner.setText(`🧭 Arah ${labelTarget}: ${dirArrow}`);
      this.guideBanner.setPosition(this.player.x, this.player.y - 38);
    }
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
    const moveUp =
      this.cursors.up.isDown || this.keys.upW.isDown || this.touchState.up;
    const moveDown =
      this.cursors.down.isDown ||
      this.keys.downS.isDown ||
      this.touchState.down;

    let vx = 0;
    let vy = 0;

    if (moveLeft) {
      vx = -this.moveSpeed;
      this.player.setFlipX(true);
    } else if (moveRight) {
      vx = this.moveSpeed;
      this.player.setFlipX(false);
    }

    if (moveUp) {
      vy = -this.moveSpeed;
    } else if (moveDown) {
      vy = this.moveSpeed;
    }

    this.player.setVelocity(vx, vy);
    this.updateCompassHint();
  }
}
