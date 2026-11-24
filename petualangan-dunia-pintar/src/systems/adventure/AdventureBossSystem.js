import Phaser from "phaser";
import { uiManager } from "../UIManager.js";

export class AdventureBossSystem {
  constructor(scene, options = {}) {
    this.scene = scene;
    this.bridge = options.bridge || null;
    this.onBossDefeated = options.onBossDefeated || null;

    this.ensureTextures();

    this.boss = null;
    this.bossConfig = null;
    this.active = false;
    this.defeated = false;
    this.shieldActive = false;
    this.phase = 1;
    this.attackTimer = 1800;
    this.orbCooldown = 0;

    this.projectilesGroup = scene.physics.add.group({ allowGravity: false });
    this.knowledgeOrb = null;
    this.orbLabel = null;
  }

  ensureTextures() {
    const g = this.scene.make.graphics({ x: 0, y: 0, add: false });
    const make = (key, w, h, fn) => {
      if (this.scene.textures.exists(key)) return;
      g.clear();
      fn();
      g.generateTexture(key, w, h);
    };

    make("boss_twilight", 112, 124, () => {
      g.fillStyle(0x1e1b4b, 1);
      g.fillRoundedRect(14, 24, 84, 92, 22);
      g.fillStyle(0x4f46e5, 1);
      g.fillRoundedRect(20, 30, 72, 80, 18);
      g.fillStyle(0xf59e0b, 1);
      g.fillTriangle(26, 28, 36, 4, 48, 28);
      g.fillTriangle(64, 28, 76, 4, 86, 28);
      g.fillStyle(0x0f172a, 1);
      g.fillRoundedRect(30, 44, 52, 20, 8);
      g.fillStyle(0xfef08a, 1);
      g.fillCircle(44, 54, 5);
      g.fillCircle(68, 54, 5);
      g.fillStyle(0x38bdf8, 1);
      g.fillCircle(56, 84, 12);
    });

    make("boss_dragon", 148, 132, () => {
      g.fillStyle(0x7f1d1d, 1);
      g.fillTriangle(6, 56, 44, 16, 44, 86);
      g.fillTriangle(142, 56, 104, 16, 104, 86);
      g.fillStyle(0x991b1b, 1);
      g.fillRoundedRect(32, 24, 84, 92, 28);
      g.fillStyle(0xef4444, 1);
      g.fillRoundedRect(40, 32, 68, 76, 22);
      g.fillStyle(0xf97316, 1);
      g.fillRoundedRect(52, 70, 44, 34, 12);
      g.fillStyle(0xfacc15, 1);
      g.fillTriangle(44, 26, 54, 4, 64, 26);
      g.fillTriangle(84, 26, 94, 4, 104, 26);
      g.fillCircle(58, 52, 7);
      g.fillCircle(90, 52, 7);
      g.fillStyle(0x1e293b, 1);
      g.fillCircle(58, 52, 3);
      g.fillCircle(90, 52, 3);
    });

    make("boss_fireball", 30, 30, () => {
      g.fillStyle(0xef4444, 1);
      g.fillCircle(15, 15, 14);
      g.fillStyle(0xf97316, 1);
      g.fillCircle(15, 15, 10);
      g.fillStyle(0xfef08a, 1);
      g.fillCircle(15, 15, 5);
    });

    make("knowledge_orb", 50, 50, () => {
      g.fillStyle(0x38bdf8, 0.35);
      g.fillCircle(25, 25, 24);
      g.fillStyle(0x0ea5e9, 1);
      g.fillCircle(25, 25, 17);
      g.fillStyle(0xfef08a, 1);
      g.fillCircle(25, 25, 8);
    });

    g.destroy();
  }

  spawnBoss({
    bossType = "twilight_knight",
    name = "Ksatria Senja",
    x = 3260,
    y = 590,
    minX = 3100,
    maxX = 3380,
    maxHp = 10,
    flying = false,
    orbSpawnX = 3160,
    orbSpawnY = 560,
  } = {}) {
    if (this.boss) this.boss.destroy();
    const tex = bossType === "lava_dragon" ? "boss_dragon" : "boss_twilight";

    this.bossConfig = {
      bossType,
      name,
      minX,
      maxX,
      baseY: y,
      maxHp,
      hp: maxHp,
      flying,
      orbSpawnX,
      orbSpawnY,
    };

    this.boss = this.scene.physics.add.sprite(x, y, tex);
    this.boss.setDepth(10);
    this.boss.body.setAllowGravity(false);
    this.boss.setImmovable(true);
    this.boss.setData({ dir: -1, phaseTime: 0 });

    this.active = true;
    this.defeated = false;
    this.phase = 1;
    this.shieldActive = false;
    this.attackTimer = 1700;

    this.scene.physics.add.overlap(
      this.scene.player,
      this.boss,
      this.handlePlayerBossContact,
      null,
      this,
    );
    this.scene.physics.add.overlap(
      this.scene.attackWavesGroup,
      this.boss,
      this.handleWaveHitBoss,
      null,
      this,
    );
    this.scene.physics.add.overlap(
      this.scene.player,
      this.projectilesGroup,
      this.handleProjectileHitPlayer,
      null,
      this,
    );

    this.syncBossHUD();
    if (this.bridge) {
      this.bridge.showTransientHint(
        `${name} muncul! Serang dengan J / Skill Q, atau sentuh Bola Pengetahuan!`,
      );
    }

    this.spawnKnowledgeOrb();
    return this.boss;
  }

  syncBossHUD() {
    if (!this.bossConfig) return;
    uiManager.updateAdventureHUD({
      boss: {
        active: this.active && !this.defeated,
        name: this.shieldActive
          ? `${this.bossConfig.name} (🛡️ Perisai — Sentuh Bola Ilmu!)`
          : `${this.bossConfig.name} · Fase ${this.phase}`,
        hp: this.bossConfig.hp,
        maxHp: this.bossConfig.maxHp,
      },
    });
  }

  hideBossHUD() {
    uiManager.updateAdventureHUD({ boss: { active: false, hp: 0, maxHp: 1 } });
  }

  spawnKnowledgeOrb() {
    if (this.knowledgeOrb) this.knowledgeOrb.destroy();
    if (this.orbLabel) this.orbLabel.destroy();
    if (!this.active || this.defeated || !this.bossConfig) return;

    const ox = this.bossConfig.orbSpawnX;
    const oy = this.bossConfig.orbSpawnY;

    this.knowledgeOrb = this.scene.physics.add.staticImage(
      ox,
      oy,
      "knowledge_orb",
    );
    this.knowledgeOrb.setDepth(9);
    this.orbLabel = this.scene.add
      .text(ox, oy - 38, "Bola Ilmu (Soal = Serangan Super!)", {
        fontFamily: "Fredoka, Segoe UI, sans-serif",
        fontSize: "12px",
        fontStyle: "bold",
        color: "#fffbeb",
        backgroundColor: "#0284c7",
        padding: { x: 8, y: 3 },
      })
      .setOrigin(0.5)
      .setDepth(10);

    this.scene.tweens.add({
      targets: this.knowledgeOrb,
      scale: 1.15,
      duration: 650,
      yoyo: true,
      repeat: -1,
    });

    this.scene.physics.add.overlap(
      this.scene.player,
      this.knowledgeOrb,
      this.handleTouchKnowledgeOrb,
      null,
      this,
    );
  }

  handleTouchKnowledgeOrb() {
    if (!this.active || this.defeated || this.scene.isQuizOpen || !this.bridge)
      return;
    if (this.knowledgeOrb) {
      this.knowledgeOrb.destroy();
      this.knowledgeOrb = null;
    }
    if (this.orbLabel) {
      this.orbLabel.destroy();
      this.orbLabel = null;
    }

    this.bridge.triggerEducationChallenge({
      sourceType: "boss_knowledge_orb",
      title: `Serangan Pengetahuan vs ${this.bossConfig.name}`,
      onResolved: ({ isCorrect }) => {
        if (isCorrect) {
          this.shieldActive = false;
          this.boss.clearTint();
          this.damageBoss(4, true);
          this.bridge.showTransientHint(
            "Jawaban tepat! Serangan Pengetahuan menghantam Boss (-4 HP)!",
          );
        } else {
          this.bridge.showTransientHint(
            "Serangan Pengetahuan meleset! Bola Ilmu baru muncul sebentar lagi.",
          );
        }

        if (this.active && !this.defeated) {
          this.orbCooldown = 6500;
        }
      },
    });
  }

  damageBoss(amount = 1, bypassShield = false) {
    if (!this.active || this.defeated || !this.bossConfig) return;

    if (this.shieldActive && !bypassShield) {
      uiManager.playTone("wrong");
      if (this.bridge) {
        this.bridge.showTransientHint(
          "Boss memakai Perisai! Sentuh Bola Ilmu biru untuk memecahkannya!",
        );
      }
      return;
    }

    this.bossConfig.hp = Math.max(0, this.bossConfig.hp - amount);
    uiManager.playTone("coin");

    this.boss.setTintFill(0xffffff);
    this.scene.time.delayedCall(100, () => {
      if (this.boss && this.boss.active) {
        if (this.shieldActive) this.boss.setTint(0x38bdf8);
        else if (this.phase === 2) this.boss.setTint(0xfca5a5);
        else this.boss.clearTint();
      }
    });

    const dmgTxt = this.scene.add
      .text(this.boss.x, this.boss.y - 68, `-${amount}`, {
        fontFamily: "Fredoka, Segoe UI, sans-serif",
        fontSize: "22px",
        fontStyle: "bold",
        color: bypassShield ? "#38bdf8" : "#fef08a",
        stroke: "#1e1b4b",
        strokeThickness: 5,
      })
      .setOrigin(0.5)
      .setDepth(20);
    this.scene.tweens.add({
      targets: dmgTxt,
      y: dmgTxt.y - 45,
      alpha: 0,
      duration: 700,
      onComplete: () => dmgTxt.destroy(),
    });

    if (
      this.phase === 1 &&
      this.bossConfig.hp > 0 &&
      this.bossConfig.hp <= Math.ceil(this.bossConfig.maxHp * 0.5)
    ) {
      this.phase = 2;
      this.shieldActive = true;
      this.boss.setTint(0x38bdf8);
      this.scene.cameras.main.shake(180, 0.008);
      this.spawnKnowledgeOrb();
      if (this.bridge) {
        this.bridge.showTransientHint(
          `${this.bossConfig.name} masuk Fase 2 & mengaktifkan Perisai! Sentuh Bola Ilmu!`,
        );
      }
    }

    this.syncBossHUD();

    if (this.bossConfig.hp <= 0) {
      this.defeatBoss();
    }
  }

  defeatBoss() {
    if (this.defeated) return;
    this.defeated = true;
    this.active = false;
    this.shieldActive = false;

    if (this.knowledgeOrb) this.knowledgeOrb.destroy();
    if (this.orbLabel) this.orbLabel.destroy();
    this.projectilesGroup.clear(true, true);

    this.hideBossHUD();
    uiManager.playTone("correct");
    this.scene.cameras.main.shake(260, 0.01);

    if (this.boss && this.boss.active) {
      this.boss.disableBody(true, false);
      this.scene.tweens.add({
        targets: this.boss,
        scale: 1.5,
        alpha: 0,
        angle: 20,
        duration: 500,
        onComplete: () => {
          if (this.boss) this.boss.destroy();
        },
      });
    }

    if (typeof this.onBossDefeated === "function") {
      this.onBossDefeated(this.bossConfig);
    }
  }

  handleWaveHitBoss(wave) {
    if (!this.active || this.defeated) return;
    const power = wave?.getData("power") || 1;
    const isSpecial = Boolean(wave?.getData("isSpecial"));
    if (wave && wave.active) wave.destroy();
    this.damageBoss(power, isSpecial);
  }

  handlePlayerBossContact(player) {
    const sc = this.scene;
    if (sc.isQuizOpen || sc.levelCompleted || !this.active || this.defeated)
      return;
    if (sc.controller?.applyDamage(this.boss.x, 1)) {
      uiManager.playTone("wrong");
    }
  }

  handleProjectileHitPlayer(player, proj) {
    if (!proj || !proj.active) return;
    proj.destroy();
    const sc = this.scene;
    if (sc.isQuizOpen || sc.levelCompleted) return;
    if (sc.controller?.applyDamage(proj.x, 1)) {
      uiManager.playTone("wrong");
    }
  }

  fireBossPattern() {
    if (!this.boss || !this.boss.active || !this.scene.player) return;
    const player = this.scene.player;
    const count = this.phase === 2 ? 3 : 1;
    const baseAngle = Phaser.Math.Angle.Between(
      this.boss.x,
      this.boss.y,
      player.x,
      player.y,
    );

    for (let i = 0; i < count; i++) {
      const spread = count === 1 ? 0 : (i - 1) * 0.24;
      const angle = baseAngle + spread;
      const proj = this.projectilesGroup.create(
        this.boss.x - 20,
        this.boss.y,
        "boss_fireball",
      );
      proj.setDepth(11);
      const spd = this.phase === 2 ? 310 : 250;
      proj.setVelocity(Math.cos(angle) * spd, Math.sin(angle) * spd);
      this.scene.time.delayedCall(2600, () => {
        if (proj && proj.active) proj.destroy();
      });
    }
  }

  update(delta) {
    if (!this.active || this.defeated || !this.boss || !this.boss.active)
      return;
    const dt = Math.min(delta, 40) / 1000;
    const cfg = this.bossConfig;

    const moveSpeed = this.phase === 2 ? 125 : 85;
    let dir = this.boss.getData("dir");
    this.boss.x += moveSpeed * dir * dt;
    if (this.boss.x <= cfg.minX) {
      this.boss.x = cfg.minX;
      dir = 1;
      this.boss.setFlipX(true);
    } else if (this.boss.x >= cfg.maxX) {
      this.boss.x = cfg.maxX;
      dir = -1;
      this.boss.setFlipX(false);
    }
    this.boss.setData("dir", dir);

    if (cfg.flying) {
      const pt = (this.boss.getData("phaseTime") || 0) + dt * 2.8;
      this.boss.setData("phaseTime", pt);
      this.boss.y = cfg.baseY + Math.sin(pt) * 42;
    }

    this.attackTimer -= delta;
    if (this.attackTimer <= 0) {
      this.attackTimer = this.phase === 2 ? 1750 : 2400;
      this.fireBossPattern();
    }

    if (this.orbCooldown > 0 && !this.knowledgeOrb) {
      this.orbCooldown -= delta;
      if (this.orbCooldown <= 0) {
        this.spawnKnowledgeOrb();
      }
    }
  }
}
