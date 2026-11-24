import Phaser from "phaser";
import { uiManager } from "../systems/UIManager.js";
import { getAdventureModeConfig } from "../systems/adventure/AdventureModeConfig.js";
import { AdventureMissionState } from "../systems/adventure/AdventureMissionState.js";
import { AdventureSessionBridge } from "../systems/adventure/AdventureSessionBridge.js";
import { TopDownExplorerController } from "../systems/adventure/TopDownExplorerController.js";

export class TreasureExplorerScene extends Phaser.Scene {
  constructor() {
    super("TreasureExplorerScene");
  }

  init(data) {
    this.profile = data?.profile || uiManager.activeProfile || null;
    this.grade = Number(data?.grade) || Number(this.profile?.grade) || 3;
    this.subject = data?.subject || "matematika";
    this.levelKey = data?.levelKey || "easy";
    this.modeConfig = getAdventureModeConfig("easy");

    this.totalChallenges = this.modeConfig.totalChallenges;
    this.coinsCollected = 0;
    this.artifactsCollected = 0;
    this.questionsAnswered = 0;
    this.correctAnswers = 0;
    this.wrongAnswers = 0;
    this.answerHistory = [];
    this.isQuizOpen = false;
    this.isDialogOpen = false;
    this.levelCompleted = false;

    this.interactives = [];
    this.touchState = {
      left: false,
      right: false,
      up: false,
      down: false,
      interact: false,
      sprint: false,
    };
  }

  ensureTopDownTextures() {
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    const make = (key, w, h, fn) => {
      if (this.textures.exists(key)) return;
      g.clear();
      fn();
      g.generateTexture(key, w, h);
    };

    make("td_tree", 84, 96, () => {
      g.fillStyle(0x14532d, 0.35);
      g.fillEllipse(42, 86, 56, 18);
      g.fillStyle(0x78350f, 1);
      g.fillRoundedRect(34, 52, 16, 36, 5);
      g.fillStyle(0x16a34a, 1);
      g.fillCircle(42, 38, 30);
      g.fillStyle(0x22c55e, 1);
      g.fillCircle(28, 44, 20);
      g.fillCircle(56, 44, 20);
      g.fillStyle(0x4ade80, 1);
      g.fillCircle(42, 26, 18);
    });

    make("td_rock", 68, 54, () => {
      g.fillStyle(0x1e293b, 0.25);
      g.fillEllipse(34, 46, 56, 14);
      g.fillStyle(0x64748b, 1);
      g.fillRoundedRect(6, 14, 56, 34, 16);
      g.fillStyle(0x94a3b8, 1);
      g.fillRoundedRect(12, 16, 42, 16, 10);
    });

    make("td_rune_stone", 60, 74, () => {
      g.fillStyle(0x1e293b, 0.3);
      g.fillEllipse(30, 66, 46, 14);
      g.fillStyle(0x475569, 1);
      g.fillRoundedRect(10, 8, 40, 58, 12);
      g.fillStyle(0x38bdf8, 1);
      g.fillCircle(30, 32, 11);
      g.fillStyle(0xe0f2fe, 1);
      g.fillCircle(30, 32, 5);
    });

    make("td_artifact", 52, 58, () => {
      g.fillStyle(0xf59e0b, 0.28);
      g.fillCircle(26, 29, 24);
      g.fillStyle(0xd97706, 1);
      g.fillRoundedRect(12, 14, 28, 30, 8);
      g.fillStyle(0xfef08a, 1);
      g.fillTriangle(26, 6, 38, 22, 14, 22);
      g.fillStyle(0x38bdf8, 1);
      g.fillCircle(26, 29, 7);
    });

    make("td_portal_locked", 96, 96, () => {
      g.fillStyle(0x475569, 1);
      g.fillCircle(48, 48, 44);
      g.fillStyle(0x1e293b, 1);
      g.fillCircle(48, 48, 32);
    });

    make("td_portal_open", 96, 96, () => {
      g.fillStyle(0xf59e0b, 1);
      g.fillCircle(48, 48, 45);
      g.fillStyle(0x38bdf8, 1);
      g.fillCircle(48, 48, 35);
      g.fillStyle(0xe0f2fe, 1);
      g.fillCircle(48, 48, 18);
    });

    g.destroy();
  }

  create() {
    this.physics.world.gravity.y = 0;
    this.ensureTopDownTextures();

    const mapW = 1920;
    const mapH = 1360;
    this.physics.world.setBounds(48, 48, mapW - 96, mapH - 96);

    this.drawTopDownWorldMap(mapW, mapH);

    this.solidProps = this.physics.add.staticGroup();
    this.coinsGroup = this.physics.add.group({
      allowGravity: false,
      immovable: true,
    });

    this.missionState = new AdventureMissionState(this.modeConfig, {
      onObjectiveUpdated: (snap) => {
        this.bridge.syncHUD({ objectiveText: snap.summaryText });
      },
      onObjectiveCompleted: (obj) => {
        this.bridge.showTransientHint(`Misi tercapai: ${obj.label}!`);
      },
    });

    this.bridge = new AdventureSessionBridge(this, {
      profile: this.profile,
      grade: this.grade,
      subject: this.subject,
      levelKey: "easy",
      modeConfig: this.modeConfig,
      missionState: this.missionState,
    });

    this.buildExplorationAreas();

    const charId = this.profile?.character || "kiko";
    this.activeCharId = charId;
    const sheetKey = this.textures.exists(`player_sheet_${charId}`)
      ? `player_sheet_${charId}`
      : `player_${charId}`;

    this.player = this.physics.add.sprite(280, 290, sheetKey);
    this.player.setScale(0.78);
    this.player.setCollideWorldBounds(true);
    this.player.body.setAllowGravity(false);
    this.player.body.setSize(42, 34);
    this.player.body.setOffset(27, 68);
    if (this.anims.exists(`${charId}_idle`)) {
      this.player.play(`${charId}_idle`);
    }

    this.controller = new TopDownExplorerController(this, this.player, {
      charId,
      walkSpeed: 245,
      sprintSpeed: 340,
      interactRadius: 96,
    });

    this.physics.add.collider(this.player, this.solidProps);
    this.physics.add.overlap(
      this.player,
      this.coinsGroup,
      this.handleCollectCoin,
      null,
      this,
    );

    this.interactPrompt = this.add
      .text(0, 0, "Tekan E / INTERAKSI", {
        fontFamily: "Fredoka, Segoe UI, sans-serif",
        fontSize: "14px",
        fontStyle: "bold",
        color: "#451a03",
        backgroundColor: "#fef08a",
        padding: { x: 10, y: 5 },
      })
      .setOrigin(0.5)
      .setDepth(9999)
      .setVisible(false);

    this.cameras.main.setBounds(0, 0, mapW, mapH);
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);

    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys({
      w: Phaser.Input.Keyboard.KeyCodes.W,
      a: Phaser.Input.Keyboard.KeyCodes.A,
      s: Phaser.Input.Keyboard.KeyCodes.S,
      d: Phaser.Input.Keyboard.KeyCodes.D,
      e: Phaser.Input.Keyboard.KeyCodes.E,
      space: Phaser.Input.Keyboard.KeyCodes.SPACE,
      shift: Phaser.Input.Keyboard.KeyCodes.SHIFT,
    });

    const runtimeDebug = {
      sceneKey: this.scene.key,
      mode: `${this.levelKey} (${this.modeConfig.modeLabel})`,
      controller: this.controller.controllerName,
      hudControlType: this.modeConfig.hudGenre,
      gravityY: this.physics.world.gravity.y,
    };
    console.info("[PDP RUNTIME DEBUG]", runtimeDebug);

    this.bridge.syncHUD({
      coins: 0,
      collectibles: 0,
      answeredCount: 0,
      totalChallenges: this.totalChallenges,
      objectiveText: this.missionState.getSummaryText(),
      debugInfo: runtimeDebug,
    });
  }

  drawTopDownWorldMap(mapW, mapH) {
    const g = this.add.graphics().setDepth(-50);

    g.fillStyle(0x0284c7, 1);
    g.fillRect(0, 0, mapW, mapH);

    g.fillStyle(0xfde68a, 1);
    g.fillRoundedRect(38, 38, mapW - 76, mapH - 76, 44);
    g.fillStyle(0x86efac, 1);
    g.fillRoundedRect(64, 64, 880, 600, 32);

    g.fillStyle(0x4ade80, 1);
    g.fillRoundedRect(960, 64, 896, 600, 32);

    g.fillStyle(0xcbd5e1, 1);
    g.fillRoundedRect(64, 680, 880, 616, 32);
    g.fillStyle(0x93c5fd, 0.45);
    g.fillRoundedRect(120, 740, 740, 490, 28);

    g.fillStyle(0xfef3c7, 1);
    g.fillRoundedRect(960, 680, 896, 616, 32);
    g.fillStyle(0xd6d3d1, 0.75);
    g.fillRoundedRect(1040, 760, 730, 460, 24);

    g.fillStyle(0xd4a36a, 1);
    g.fillRoundedRect(240, 300, 1340, 74, 24);
    g.fillRoundedRect(460, 300, 78, 720, 24);
    g.fillRoundedRect(1380, 300, 78, 720, 24);
    g.fillRoundedRect(460, 960, 998, 74, 24);

    const addAreaBanner = (x, y, label, bg) => {
      this.add
        .text(x, y, label, {
          fontFamily: "Fredoka, Segoe UI, sans-serif",
          fontSize: "16px",
          fontStyle: "bold",
          color: "#ffffff",
          backgroundColor: bg,
          padding: { x: 12, y: 6 },
        })
        .setOrigin(0.5)
        .setDepth(-10);
    };

    addAreaBanner(440, 115, "AREA 1: PULAU PEMBUKA", "#15803d");
    addAreaBanner(1410, 115, "AREA 2: HUTAN CERIA", "#166534");
    addAreaBanner(440, 725, "AREA 3: GUA KRISTAL", "#0369a1");
    addAreaBanner(1410, 725, "AREA 4: RERUNTUHAN KUNO", "#92400e");
  }

  addSolidProp(x, y, key) {
    const obj = this.solidProps.create(x, y, key);
    obj.setDepth(Math.round(y));
    obj.body.setSize(obj.width * 0.65, obj.height * 0.42);
    obj.body.setOffset(obj.width * 0.17, obj.height * 0.52);
    return obj;
  }

  addInteractiveObject({ x, y, texture, id, title, label, kind }) {
    const obj = this.physics.add.staticImage(x, y, texture);
    obj.setDepth(Math.round(y));
    const lbl = this.add
      .text(x, y - 50, label, {
        fontFamily: "Fredoka, Segoe UI, sans-serif",
        fontSize: "14px",
        fontStyle: "bold",
        color: "#fffbeb",
        backgroundColor: "#2b1810",
        padding: { x: 9, y: 4 },
      })
      .setOrigin(0.5)
      .setDepth(Math.round(y) + 2);

    obj.setData({
      id,
      title,
      label,
      kind,
      solved: false,
      disabled: false,
      labelObj: lbl,
    });

    this.interactives.push(obj);
    return obj;
  }

  buildExplorationAreas() {
    const subjLabel = this.bridge.getSubjectLabel();

    [
      [170, 190],
      [670, 210],
      [820, 480],
      [1120, 210],
      [1640, 220],
      [1740, 490],
      [1160, 520],
    ].forEach(([x, y]) => this.addSolidProp(x, y, "td_tree"));

    [
      [190, 860],
      [740, 840],
      [210, 1140],
      [1120, 850],
      [1680, 1120],
    ].forEach(([x, y]) => this.addSolidProp(x, y, "td_rock"));

    [
      [380, 336],
      [620, 336],
      [860, 336],
      [1140, 336],
      [1420, 460],
      [1420, 620],
      [500, 520],
      [500, 740],
      [780, 995],
      [1080, 995],
      [260, 1020],
      [1660, 380],
    ].forEach(([x, y]) => {
      const coin = this.coinsGroup.create(x, y, "coin_gold");
      coin.setDepth(Math.round(y));
      coin.setData("collected", false);
      this.tweens.add({
        targets: coin,
        y: y - 6,
        duration: 750,
        yoyo: true,
        repeat: -1,
      });
    });

    this.addInteractiveObject({
      x: 560,
      y: 230,
      texture: "npc_owl",
      id: "exp_npc_1",
      kind: "npc",
      label: "Pemandu Pulau",
      title: `Misi Pemandu Pulau (${subjLabel})`,
    });

    this.addInteractiveObject({
      x: 1180,
      y: 250,
      texture: 'npc_owl',
      id: 'exp_helper_npc',
      kind: 'helper_npc',
      label: 'Penjelajah Hutan (Petunjuk)',
      title: 'Petunjuk Penjelajah Hutan'
    });

    this.addInteractiveObject({
      x: 1520,
      y: 260,
      texture: "td_rune_stone",
      id: "exp_rune_2",
      kind: "puzzle",
      label: "Batu Rune Hutan",
      title: `Puzzle Batu Rune (${subjLabel})`,
    });

    this.addInteractiveObject({
      x: 1620,
      y: 540,
      texture: "chest_closed",
      id: "exp_chest_3",
      kind: "chest",
      label: "Peti Rahasia Hutan",
      title: `Peti Harta Hutan (${subjLabel})`,
    });

    this.addInteractiveObject({
      x: 340,
      y: 1020,
      texture: "td_artifact",
      id: "exp_artifact_4",
      kind: "artifact",
      label: "Artefak Gua Kristal",
      title: `Artefak Kristal (${subjLabel})`,
    });

    this.portalNode = this.addInteractiveObject({
      x: 1540,
      y: 990,
      texture: "td_portal_locked",
      id: "exp_portal_5",
      kind: "portal",
      label: "Portal Reruntuhan (Terkunci)",
      title: `Segel Portal Reruntuhan (${subjLabel})`,
    });
  }

  handleCollectCoin(player, coin) {
    if (coin.getData("collected")) return;
    coin.setData("collected", true);
    coin.disableBody(true, true);
    this.coinsCollected += 5;
    uiManager.playTone("coin");
    this.bridge.syncHUD({ coins: this.coinsCollected });
  }

  handleInteract(target) {
    if (!target || this.isQuizOpen || this.levelCompleted) return;
    const kind = target.getData("kind");

    if (kind === 'helper_npc') {
      this.isDialogOpen = true;
      this.player.setVelocity(0, 0);
      const alreadyClaimed = target.getData('solved');
      uiManager.showNpcDialog({
        npcName: 'Penjelajah Hutan',
        text: alreadyClaimed
          ? 'Jangan lupa cek Gua Kristal di selatan dan Reruntuhan Kuno di tenggara untuk membuka Portal!'
          : 'Halo Petualang! Aku menemukan Batu Rune di timur dan Artefak Kristal di Gua selatan. Ambil +15 Koin ini sebagai bekalmu!',
        onClose: () => {
          this.isDialogOpen = false;
          if (!alreadyClaimed) {
            target.setData('solved', true);
            this.coinsCollected += 15;
            uiManager.playTone('coin');
            this.bridge.syncHUD({ coins: this.coinsCollected });
          }
        }
      });
      return;
    }

    if (kind === 'npc' && !target.getData('introShown')) {
      this.isDialogOpen = true;
      this.player.setVelocity(0, 0);
      uiManager.showNpcDialog({
        npcName: 'Pemandu Pulau',
        text: 'Selamat datang di Pulau Pengetahuan! Bantu aku menjawab teka-teki ini untuk membuka petunjuk menuju Portal Reruntuhan.',
        onClose: () => {
          this.isDialogOpen = false;
          target.setData('introShown', true);
          this.handleInteract(target);
        }
      });
      return;
    }

    if (kind === "portal" && target.getData("solved")) {
      this.bridge.completeLevel({
        bonusCoins: 35,
        collectibleLabel: `Artefak Pulau (${this.artifactsCollected})`,
      });
      return;
    }

    if (target.getData("solved")) {
      this.bridge.showTransientHint(
        "Area ini sudah diselesaikan! Jelajahi area lainnya.",
      );
      return;
    }

    if (
      kind === "portal" &&
      this.questionsAnswered < this.totalChallenges - 1
    ) {
      this.bridge.showTransientHint(
        `Selesaikan 4 petunjuk di Pulau, Hutan, dan Gua dahulu (${this.questionsAnswered}/${this.totalChallenges - 1})!`,
      );
      return;
    }

    this.bridge.triggerEducationChallenge({
      sourceType: kind,
      title: target.getData("title"),
      forceDifficulty: "mudah",
      onResolved: ({ isCorrect }) => {
        target.setData("solved", true);
        const lbl = target.getData("labelObj");

        if (kind === "chest") target.setTexture("chest_open");
        else if (kind === "artifact" || kind === "puzzle") {
          this.artifactsCollected += 1;
          this.missionState.updateProgressByType("collectible", 1);
          target.setTint(0x86efac);
          this.bridge.syncHUD({ collectibles: this.artifactsCollected });
        } else if (kind === "npc") {
          target.setTint(0xbbf7d0);
        } else if (kind === "portal") {
          target.setTexture("td_portal_open");
          if (lbl) {
            lbl.setText("Portal Terbuka! (Tekan E untuk Finis)");
            lbl.setStyle({ backgroundColor: "#16a34a" });
          }
          this.bridge.showTransientHint(
            "Portal Reruntuhan terbuka! Tekan E untuk menyelesaikan ekspedisi!",
          );
          return;
        }

        if (lbl) {
          lbl.setText(`${target.getData("label")} ✓`);
          lbl.setStyle({ backgroundColor: "#16a34a" });
        }

        if (
          this.questionsAnswered >= this.totalChallenges - 1 &&
          this.portalNode
        ) {
          const pLbl = this.portalNode.getData("labelObj");
          if (pLbl) {
            pLbl.setText("Portal Reruntuhan (Siap Dibuka!)");
            pLbl.setStyle({ backgroundColor: "#d97706" });
          }
        }

        this.bridge.showTransientHint(
          isCorrect
            ? "Hebat! Petunjuk & artefak berhasil dibuka (+25 Koin)!"
            : "Petunjuk tetap terbuka! Ayo lanjutkan eksplorasi.",
        );
      },
    });
  }

  update(time, delta) {
    if (!this.player || !this.controller || this.isQuizOpen || this.isDialogOpen || this.levelCompleted) return;

    const interactPressed =
      Phaser.Input.Keyboard.JustDown(this.keys.e) ||
      Phaser.Input.Keyboard.JustDown(this.keys.space) ||
      this.touchState.interact;

    const nearest = this.controller.update(
      delta,
      {
        left:
          this.cursors.left.isDown ||
          this.keys.a.isDown ||
          this.touchState.left,
        right:
          this.cursors.right.isDown ||
          this.keys.d.isDown ||
          this.touchState.right,
        up: this.cursors.up.isDown || this.keys.w.isDown || this.touchState.up,
        down:
          this.cursors.down.isDown ||
          this.keys.s.isDown ||
          this.touchState.down,
        sprint: this.keys.shift.isDown || this.touchState.sprint,
        interact: interactPressed,
        onInteract: (obj) => this.handleInteract(obj),
      },
      this.interactives,
    );

    this.touchState.interact = false;

    if (nearest) {
      this.interactPrompt.setPosition(nearest.x, nearest.y - 78);
      this.interactPrompt.setVisible(true);
    } else {
      this.interactPrompt.setVisible(false);
    }
  }
}
