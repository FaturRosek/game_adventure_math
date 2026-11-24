import Phaser from "phaser";
import { uiManager } from "../UIManager.js";

export class AdventureEnemySystem {
  constructor(scene, options = {}) {
    this.scene = scene;
    this.bridge = options.bridge || null;
    this.onEnemyDefeated = options.onEnemyDefeated || null;

    this.ensureTextures();

    this.enemiesGroup = scene.physics.add.group({
      allowGravity: false,
      immovable: true,
    });
    this.projectilesGroup = scene.physics.add.group({ allowGravity: false });
    this.enemies = [];
    this.waveTimer = 0;
  }

  ensureTextures() {
    const g = this.scene.make.graphics({ x: 0, y: 0, add: false });
    const make = (key, w, h, fn) => {
      if (this.scene.textures.exists(key)) return;
      g.clear();
      fn();
      g.generateTexture(key, w, h);
    };

    make("enemy_walker", 56, 52, () => {
      g.fillStyle(0x4c1d95, 1);
      g.fillRoundedRect(4, 12, 48, 36, 16);
      g.fillStyle(0x9333ea, 1);
      g.fillRoundedRect(8, 16, 40, 28, 13);
      g.fillStyle(0xffffff, 1);
      g.fillCircle(19, 28, 6);
      g.fillCircle(37, 28, 6);
      g.fillStyle(0x1e293b, 1);
      g.fillCircle(20, 28, 3);
      g.fillCircle(38, 28, 3);
      g.fillStyle(0xfacc15, 1);
      g.fillTriangle(20, 12, 28, 2, 36, 12);
    });

    make("enemy_hopper", 54, 52, () => {
      g.fillStyle(0x9a3412, 1);
      g.fillRoundedRect(6, 14, 42, 34, 15);
      g.fillStyle(0xf97316, 1);
      g.fillRoundedRect(10, 18, 34, 26, 12);
      g.fillStyle(0xfef08a, 1);
      g.fillCircle(19, 24, 6);
      g.fillCircle(35, 24, 6);
      g.fillStyle(0x1e293b, 1);
      g.fillCircle(19, 24, 3);
      g.fillCircle(35, 24, 3);
      g.fillStyle(0x7c2d12, 1);
      g.fillRoundedRect(2, 38, 16, 12, 5);
      g.fillRoundedRect(36, 38, 16, 12, 5);
    });

    make("enemy_flyer", 68, 46, () => {
      g.fillStyle(0x581c87, 1);
      g.fillTriangle(4, 24, 24, 10, 24, 34);
      g.fillTriangle(64, 24, 44, 10, 44, 34);
      g.fillStyle(0x7e22ce, 1);
      g.fillCircle(34, 24, 16);
      g.fillStyle(0xfef08a, 1);
      g.fillCircle(28, 22, 4);
      g.fillCircle(40, 22, 4);
      g.fillStyle(0xef4444, 1);
      g.fillCircle(28, 22, 2);
      g.fillCircle(40, 22, 2);
    });

    make("enemy_shielded", 64, 66, () => {
      g.fillStyle(0x1e293b, 1);
      g.fillRoundedRect(10, 10, 44, 52, 12);
      g.fillStyle(0x475569, 1);
      g.fillRoundedRect(14, 14, 36, 44, 10);
      g.fillStyle(0xef4444, 1);
      g.fillRect(20, 24, 24, 7);
      g.fillStyle(0x0284c7, 0.9);
      g.fillRoundedRect(46, 14, 16, 44, 7);
      g.fillStyle(0x38bdf8, 1);
      g.fillRoundedRect(49, 18, 10, 36, 5);
    });

    make("enemy_bolt", 22, 22, () => {
      g.fillStyle(0xef4444, 1);
      g.fillCircle(11, 11, 10);
      g.fillStyle(0xfef08a, 1);
      g.fillCircle(11, 11, 5);
    });

    g.destroy();
  }

  bindCollisions(player, attackWavesGroup) {
    this.scene.physics.add.overlap(
      player,
      this.enemiesGroup,
      this.handlePlayerContact,
      null,
      this,
    );
    this.scene.physics.add.overlap(
      attackWavesGroup,
      this.enemiesGroup,
      this.handleAttackHit,
      null,
      this,
    );
    this.scene.physics.add.overlap(
      player,
      this.projectilesGroup,
      this.handleProjectileHit,
      null,
      this,
    );
  }

  spawnEnemy({
    type = "walker",
    x = 500,
    y = 600,
    minX = null,
    maxX = null,
    speed = null,
    hp = null,
    canShoot = false,
  } = {}) {
    const texMap = {
      walker: "enemy_walker",
      hopper: "enemy_hopper",
      flyer: "enemy_flyer",
      shielded: "enemy_shielded",
    };
    const defaultHp = type === "shielded" ? 3 : type === "hopper" ? 2 : 1;
    const defaultSpeed =
      type === "flyer"
        ? 115
        : type === "hopper"
          ? 95
          : type === "shielded"
            ? 68
            : 88;

    const enemy = this.enemiesGroup.create(
      x,
      y,
      texMap[type] || "enemy_walker",
    );
    enemy.setDepth(9);

    const resolvedHp = hp ?? defaultHp;
    const isShielded = type === "shielded";

    const hpText = this.scene.add
      .text(x, y - 38, isShielded ? "🛡️ Perisai" : "", {
        fontFamily: "Fredoka, Segoe UI, sans-serif",
        fontSize: "12px",
        fontStyle: "bold",
        color: "#fef08a",
        backgroundColor: "rgba(15,23,42,0.75)",
        padding: { x: 6, y: 2 },
      })
      .setOrigin(0.5)
      .setDepth(10)
      .setVisible(isShielded);

    enemy.setData({
      type,
      baseY: y,
      minX: minX ?? x - 140,
      maxX: maxX ?? x + 140,
      speed: speed ?? defaultSpeed,
      dir: 1,
      hp: resolvedHp,
      maxHp: resolvedHp,
      shielded: isShielded,
      defeated: false,
      phase: Math.random() * Math.PI * 2,
      hopTimer: 900 + Math.random() * 600,
      shootTimer: 2200 + Math.random() * 1200,
      canShoot: canShoot || type === "flyer",
      hpLabel: hpText,
    });

    this.enemies.push(enemy);
    return enemy;
  }

  getActiveCount() {
    return this.enemies.filter((e) => e && e.active && !e.getData("defeated"))
      .length;
  }

  showFloatingNumber(x, y, text, color = "#fef08a") {
    const txt = this.scene.add
      .text(x, y, text, {
        fontFamily: "Fredoka, Segoe UI, sans-serif",
        fontSize: "17px",
        fontStyle: "bold",
        color,
        stroke: "#1e1b4b",
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setDepth(20);

    this.scene.tweens.add({
      targets: txt,
      y: y - 38,
      alpha: 0,
      duration: 650,
      ease: "Cubic.easeOut",
      onComplete: () => txt.destroy(),
    });
  }

  damageEnemy(enemy, damage = 1, isSpecial = false) {
    if (!enemy || !enemy.active || enemy.getData("defeated")) return;

    if (enemy.getData("shielded")) {
      if (isSpecial) {
        enemy.setData("shielded", false);
        const lbl = enemy.getData("hpLabel");
        if (lbl) lbl.setText("Perisai Pecah!");
        this.showFloatingNumber(
          enemy.x,
          enemy.y - 30,
          "PERISAI PECAH!",
          "#38bdf8",
        );
        uiManager.playTone("correct");
      } else {
        this.showFloatingNumber(
          enemy.x,
          enemy.y - 28,
          "TERTANGKIS!",
          "#94a3b8",
        );
        uiManager.playTone("wrong");
        if (this.bridge) {
          this.bridge.showTransientHint(
            "Gunakan Skill (Q) atau dekati Penjaga Perisai untuk pecahkan lewat Soal!",
          );
        }
        return;
      }
    }

    const nextHp = Math.max(0, (enemy.getData("hp") || 1) - damage);
    enemy.setData("hp", nextHp);
    this.showFloatingNumber(
      enemy.x,
      enemy.y - 24,
      `-${damage}`,
      isSpecial ? "#facc15" : "#ffffff",
    );

    enemy.setTintFill(0xffffff);
    this.scene.time.delayedCall(90, () => {
      if (enemy && enemy.active) enemy.clearTint();
    });

    if (nextHp <= 0) {
      this.defeatEnemy(enemy);
    } else {
      const lbl = enemy.getData("hpLabel");
      if (lbl) {
        lbl.setVisible(true);
        lbl.setText(`HP ${nextHp}/${enemy.getData("maxHp")}`);
      }
      uiManager.playTone("coin");
    }
  }

  defeatEnemy(enemy) {
    if (!enemy || enemy.getData("defeated")) return;
    enemy.setData("defeated", true);
    enemy.disableBody(true, false);

    const lbl = enemy.getData("hpLabel");
    if (lbl) lbl.destroy();

    if (this.scene.controller?.spawnDustBurst) {
      this.scene.controller.spawnDustBurst(enemy.x, enemy.y, 7);
    }

    uiManager.playTone("coin");
    if (typeof this.onEnemyDefeated === "function") {
      this.onEnemyDefeated(enemy);
    }

    this.scene.tweens.add({
      targets: enemy,
      scaleX: 1.35,
      scaleY: 0.2,
      alpha: 0,
      duration: 210,
      onComplete: () => enemy.destroy(),
    });
  }

  handleAttackHit(wave, enemy) {
    if (!enemy || enemy.getData("defeated")) return;
    const power = wave?.getData("power") || 1;
    const isSpecial = Boolean(wave?.getData("isSpecial"));
    if (wave && wave.active && !isSpecial) {
      wave.destroy();
    }
    this.damageEnemy(enemy, power, isSpecial);
  }

  handlePlayerContact(player, enemy) {
    const sc = this.scene;
    if (sc.isQuizOpen || sc.levelCompleted || enemy.getData("defeated")) return;

    if (enemy.getData("shielded") && this.bridge) {
      this.bridge.triggerEducationChallenge({
        sourceType: "shield_enemy",
        title: "Pecahkan Perisai Penjaga!",
        onResolved: ({ isCorrect }) => {
          if (isCorrect) {
            enemy.setData("shielded", false);
            this.damageEnemy(enemy, 2, true);
            this.bridge.showTransientHint(
              "Perisai Penjaga hancur oleh jawaban tepatmu!",
            );
          } else {
            const push = player.x < enemy.x ? -70 : 70;
            player.setX(Math.max(50, player.x + push));
            this.bridge.showTransientHint(
              "Perisai masih aktif! Coba lagi atau pakai Skill (Q).",
            );
          }
        },
      });
      return;
    }

    const isStomp = player.body.velocity.y > 40 && player.y < enemy.y - 8;
    if (isStomp) {
      this.damageEnemy(enemy, 1, false);
      if (sc.controller) sc.controller.triggerBounce(-470);
      return;
    }

    if (sc.controller?.applyDamage(enemy.x, 1)) {
      uiManager.playTone("wrong");
      if (this.bridge) {
        this.bridge.showTransientHint(
          "Serang dengan J (Combo), Skill (Q), atau lompat di atas musuh!",
        );
      }
    }
  }

  handleProjectileHit(player, bolt) {
    const sc = this.scene;
    if (!bolt || !bolt.active) return;
    bolt.destroy();
    if (sc.isQuizOpen || sc.levelCompleted) return;
    if (sc.controller?.applyDamage(bolt.x, 1)) {
      uiManager.playTone("wrong");
    }
  }

  fireEnemyBolt(enemy) {
    const player = this.scene.player;
    if (!player || !enemy.active) return;
    const dist = Phaser.Math.Distance.Between(
      enemy.x,
      enemy.y,
      player.x,
      player.y,
    );
    if (dist > 520) return;

    const bolt = this.projectilesGroup.create(
      enemy.x,
      enemy.y + 8,
      "enemy_bolt",
    );
    bolt.setDepth(11);
    const angle = Phaser.Math.Angle.Between(
      enemy.x,
      enemy.y,
      player.x,
      player.y,
    );
    const spd = 250;
    bolt.setVelocity(Math.cos(angle) * spd, Math.sin(angle) * spd);

    this.scene.time.delayedCall(2200, () => {
      if (bolt && bolt.active) bolt.destroy();
    });
  }

  update(delta) {
    const dt = Math.min(delta, 40) / 1000;

    this.enemies = this.enemies.filter((e) => e && e.active);
    this.enemies.forEach((enemy) => {
      if (enemy.getData("defeated")) return;
      const type = enemy.getData("type");
      let dir = enemy.getData("dir");
      const speed = enemy.getData("speed");

      enemy.x += speed * dir * dt;
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

      if (type === "flyer") {
        const nextPhase = enemy.getData("phase") + dt * 4.2;
        enemy.setData("phase", nextPhase);
        enemy.y = enemy.getData("baseY") + Math.sin(nextPhase) * 32;
      } else if (type === "hopper") {
        let hopT = enemy.getData("hopTimer") - delta;
        if (hopT <= 0) {
          hopT = 1350;
          this.scene.tweens.add({
            targets: enemy,
            y: enemy.getData("baseY") - 78,
            duration: 280,
            yoyo: true,
            ease: "Quad.easeOut",
          });
        }
        enemy.setData("hopTimer", hopT);
      }

      if (enemy.getData("canShoot")) {
        let sT = enemy.getData("shootTimer") - delta;
        if (sT <= 0) {
          sT = 2600;
          this.fireEnemyBolt(enemy);
        }
        enemy.setData("shootTimer", sT);
      }

      const lbl = enemy.getData("hpLabel");
      if (lbl && lbl.active) {
        lbl.setPosition(enemy.x, enemy.y - 40);
      }
      enemy.body.updateFromGameObject();
    });
  }
}
