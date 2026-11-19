import Phaser from "phaser";
import { GAME_CONFIG } from "../config/gameConfig.js";
import { BattleFighterRig } from "../systems/BattleFighterRig.js";
import { BATTLE_ATTACK_EFFECTS } from "../data/battleArenaCatalog.js";

export class BattleArenaScene extends Phaser.Scene {
  constructor() {
    super("BattleArenaScene");
  }

  init(data) {
    this.battleConfig = data || {};
    this.tutorName = this.battleConfig.tutorName || "Tutor";
    this.studentName = this.battleConfig.studentName || "Murid";
    this.tutorCharId = this.battleConfig.tutorCharacter || "prof_panda";
    this.studentCharId = this.battleConfig.studentCharacter || "kiko";
    this.maxLives = Number(this.battleConfig.maxLives) || 5;
    this.tutorLives = this.maxLives;
    this.studentLives = this.maxLives;

    this.studentCosmetic = this.battleConfig.studentCosmetic || {
      costume: "default",
      accessory: "none",
      attackEffect: "default",
      victoryEffect: "confetti",
    };
  }

  create() {
    this.buildGrand3DArena();

    this.tutorBaseX = 335;
    this.studentBaseX = 945;
    this.charY = 322;

    this.tutorRig = new BattleFighterRig(
      this,
      this.tutorBaseX,
      this.charY,
      this.tutorCharId,
      true,
      "tutor",
    );
    this.studentRig = new BattleFighterRig(
      this,
      this.studentBaseX,
      this.charY,
      this.studentCharId,
      false,
      "student",
      this.studentCosmetic,
    );
    this.tutorRig.setTurnActive(false);
    this.studentRig.setTurnActive(false);

    this.createLivesHUD();
    this.updateLives(this.maxLives, this.maxLives);
  }

  buildGrand3DArena() {
    const W = GAME_CONFIG.width;
    const H = GAME_CONFIG.height;
    const bgKey = "grand_battle_arena_bg_v2";

    if (!this.textures.exists(bgKey)) {
      const tex = this.textures.createCanvas(bgKey, W, H);
      const ctx = tex.getContext();

      const skyGrad = ctx.createLinearGradient(0, 0, 0, 480);
      skyGrad.addColorStop(0, "#0f2027");
      skyGrad.addColorStop(0.45, "#203a43");
      skyGrad.addColorStop(1, "#2c5364");
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, W, H);

      const glowCenter = ctx.createRadialGradient(
        W / 2,
        230,
        30,
        W / 2,
        230,
        520,
      );
      glowCenter.addColorStop(0, "rgba(52, 152, 219, 0.42)");
      glowCenter.addColorStop(0.6, "rgba(155, 89, 182, 0.16)");
      glowCenter.addColorStop(1, "rgba(15, 32, 39, 0)");
      ctx.fillStyle = glowCenter;
      ctx.fillRect(0, 0, W, 500);

      ctx.fillStyle = "#162436";
      ctx.beginPath();
      ctx.ellipse(W / 2, 330, 680, 175, 0, Math.PI, 0);
      ctx.fill();

      ctx.strokeStyle = "rgba(0, 210, 211, 0.35)";
      ctx.lineWidth = 3;
      for (let i = 0; i < 9; i++) {
        const ax = 120 + i * 130;
        ctx.beginPath();
        ctx.arc(ax, 300, 48, Math.PI, 0);
        ctx.stroke();
      }

      for (let i = 0; i < 75; i++) {
        const bx = 90 + ((i * 73) % (W - 180));
        const by = 185 + ((i * 29) % 105);
        ctx.fillStyle =
          i % 3 === 0
            ? "rgba(241, 196, 15, 0.45)"
            : i % 2 === 0
              ? "rgba(0, 210, 211, 0.4)"
              : "rgba(255, 255, 255, 0.35)";
        ctx.beginPath();
        ctx.arc(bx, by, (i % 3) + 2, 0, Math.PI * 2);
        ctx.fill();
      }

      [140, W - 140].forEach((px) => {
        const pilGrad = ctx.createLinearGradient(px - 26, 130, px + 26, 130);
        pilGrad.addColorStop(0, "#1e272e");
        pilGrad.addColorStop(0.5, "#485460");
        pilGrad.addColorStop(1, "#1e272e");
        ctx.fillStyle = pilGrad;
        ctx.fillRect(px - 24, 150, 48, 220);
        ctx.fillStyle = "#00d2d3";
        ctx.fillRect(px - 6, 165, 12, 185);
      });

      const floorDark = ctx.createLinearGradient(0, 420, 0, H);
      floorDark.addColorStop(0, "#131d29");
      floorDark.addColorStop(1, "#0a0f16");
      ctx.fillStyle = floorDark;
      ctx.fillRect(0, 420, W, H - 420);

      const platY = 380;
      const platRx = 470;
      const platRy = 64;

      const rimGrad = ctx.createLinearGradient(
        W / 2 - platRx,
        platY,
        W / 2 + platRx,
        platY,
      );
      rimGrad.addColorStop(0, "#1b2631");
      rimGrad.addColorStop(0.25, "#34495e");
      rimGrad.addColorStop(0.5, "#5d6d7e");
      rimGrad.addColorStop(0.75, "#34495e");
      rimGrad.addColorStop(1, "#1b2631");

      ctx.fillStyle = rimGrad;
      ctx.beginPath();
      ctx.ellipse(W / 2, platY + 34, platRx, platRy, 0, 0, Math.PI);
      ctx.lineTo(W / 2 - platRx, platY);
      ctx.ellipse(W / 2, platY, platRx, platRy, 0, Math.PI, 0, true);
      ctx.closePath();
      ctx.fill();
      ctx.lineWidth = 4;
      ctx.strokeStyle = "#0a0f16";
      ctx.stroke();

      ctx.strokeStyle = "#f1c40f";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.ellipse(
        W / 2,
        platY + 16,
        platRx - 4,
        platRy - 2,
        0,
        0.12,
        Math.PI - 0.12,
      );
      ctx.stroke();

      const topGrad = ctx.createRadialGradient(
        W / 2,
        platY - 12,
        40,
        W / 2,
        platY,
        platRx,
      );
      topGrad.addColorStop(0, "#ffeaa7");
      topGrad.addColorStop(0.45, "#f6b93b");
      topGrad.addColorStop(0.85, "#e58e26");
      topGrad.addColorStop(1, "#b76e14");

      ctx.fillStyle = topGrad;
      ctx.beginPath();
      ctx.ellipse(W / 2, platY, platRx, platRy, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = 6;
      ctx.strokeStyle = "#2c3e50";
      ctx.stroke();

      ctx.strokeStyle = "rgba(255, 255, 255, 0.55)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(W / 2, platY, platRx - 34, platRy - 8, 0, 0, Math.PI * 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.ellipse(W / 2, platY, 120, 22, 0, 0, Math.PI * 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(W / 2, platY - platRy + 6);
      ctx.lineTo(W / 2, platY + platRy - 6);
      ctx.stroke();

      tex.refresh();
    }

    this.add.image(W / 2, H / 2, bgKey).setDepth(0);

    const beamL = this.add
      .triangle(260, 120, 0, 0, -90, 320, 90, 320, 0x74b9ff, 0.12)
      .setDepth(2)
      .setOrigin(0.5, 0);
    const beamR = this.add
      .triangle(W - 260, 120, 0, 0, -90, 320, 90, 320, 0xffeaa7, 0.12)
      .setDepth(2)
      .setOrigin(0.5, 0);

    this.tweens.add({
      targets: beamL,
      angle: { from: -14, to: 10 },
      duration: 3200,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    this.tweens.add({
      targets: beamR,
      angle: { from: 14, to: -10 },
      duration: 3400,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
  }

  createLivesHUD() {
    const W = GAME_CONFIG.width;

    const frame = this.add.graphics().setDepth(12);
    frame.fillStyle(0x131d29, 0.94);
    frame.fillRoundedRect(70, 56, 405, 86, 16);
    frame.fillRoundedRect(W - 475, 56, 405, 86, 16);
    frame.lineStyle(4, 0x3498db, 1);
    frame.strokeRoundedRect(70, 56, 405, 86, 16);
    frame.lineStyle(4, 0xff7f50, 1);
    frame.strokeRoundedRect(W - 475, 56, 405, 86, 16);

    const vsCircle = this.add.circle(W / 2, 98, 30, 0xe74c3c).setDepth(13);
    vsCircle.setStrokeStyle(5, 0xf1c40f);
    this.add
      .text(W / 2, 98, "VS", {
        fontFamily: "Segoe UI, sans-serif",
        fontSize: "23px",
        fontStyle: "bold",
        color: "#ffffff",
        stroke: "#2c3e50",
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setDepth(14);

    this.add
      .text(88, 64, `${this.tutorName.toUpperCase()} (TUTOR)`, {
        fontFamily: "Segoe UI, sans-serif",
        fontSize: "15px",
        fontStyle: "bold",
        color: "#74b9ff",
      })
      .setDepth(14);

    this.add
      .text(W - 88, 64, `${this.studentName.toUpperCase()} (MURID)`, {
        fontFamily: "Segoe UI, sans-serif",
        fontSize: "15px",
        fontStyle: "bold",
        color: "#ffeaa7",
      })
      .setOrigin(1, 0)
      .setDepth(14);

    this.tutorLifeCountText = this.add
      .text(456, 64, `${this.maxLives}/${this.maxLives} ❤️`, {
        fontFamily: "Segoe UI, sans-serif",
        fontSize: "15px",
        fontStyle: "bold",
        color: "#ff6b81",
      })
      .setOrigin(1, 0)
      .setDepth(14);

    this.studentLifeCountText = this.add
      .text(W - 456, 64, `${this.maxLives}/${this.maxLives} ❤️`, {
        fontFamily: "Segoe UI, sans-serif",
        fontSize: "15px",
        fontStyle: "bold",
        color: "#ff6b81",
      })
      .setOrigin(0, 0)
      .setDepth(14);

    this.tutorHeartsText = this.add
      .text(88, 96, "", {
        fontFamily: "Segoe UI, sans-serif",
        fontSize: this.maxLives >= 10 ? "18px" : "22px",
      })
      .setDepth(14);

    this.studentHeartsText = this.add
      .text(W - 88, 96, "", {
        fontFamily: "Segoe UI, sans-serif",
        fontSize: this.maxLives >= 10 ? "18px" : "22px",
      })
      .setOrigin(1, 0)
      .setDepth(14);
  }

  updateLives(tutorLives, studentLives) {
    this.tutorLives = Math.max(0, Math.min(this.maxLives, tutorLives));
    this.studentLives = Math.max(0, Math.min(this.maxLives, studentLives));

    const tHearts =
      "❤️".repeat(this.tutorLives) +
      "🖤".repeat(this.maxLives - this.tutorLives);
    const sHearts =
      "🖤".repeat(this.maxLives - this.studentLives) +
      "❤️".repeat(this.studentLives);

    this.tutorHeartsText.setText(tHearts);
    this.studentHeartsText.setText(sHearts);
    this.tutorLifeCountText.setText(`${this.tutorLives}/${this.maxLives} ❤️`);
    this.studentLifeCountText.setText(
      `${this.studentLives}/${this.maxLives} ❤️`,
    );
  }

  triggerIndependentAttack(attackerRole, onImpactCallback) {
    const isTutor = attackerRole === 'tutor';
    const attackerRig = isTutor ? this.tutorRig : this.studentRig;
    const defenderRig = isTutor ? this.studentRig : this.tutorRig;
    const defenderX = isTutor ? this.studentBaseX : this.tutorBaseX;

    attackerRig.playAttackPose(
      false,
      (startX, startY) => {
        const customFx = !isTutor
          ? BATTLE_ATTACK_EFFECTS.find((fx) => fx.id === this.studentCosmetic?.attackEffect)
          : null;
        const orbColor = customFx ? customFx.color : isTutor ? 0x3498db : 0x00d2d3;

        const orb = this.add.circle(startX, startY, 19, orbColor).setDepth(10);
        orb.setStrokeStyle(5, 0xffffff);

        this.tweens.add({
          targets: orb,
          x: defenderX,
          y: this.charY,
          scale: 1.3,
          duration: 195,
          ease: 'Cubic.easeIn',
          onComplete: () => {
            orb.destroy();
            this.spawnImpactEffect(defenderX, this.charY);
            if (onImpactCallback) onImpactCallback(attackerRole);
            defenderRig.playHitPose();
          }
        });
      },
      null
    );
  }

  spawnImpactEffect(x, y) {
    this.cameras.main.shake(150, 0.006);

    const flash = this.add.circle(x, y, 42, 0xffffff, 0.88).setDepth(11);
    this.tweens.add({
      targets: flash,
      scale: 2.1,
      alpha: 0,
      duration: 230,
      onComplete: () => flash.destroy(),
    });

    const shockwave = this.add
      .ellipse(x, y + 62, 60, 18, 0xf1c40f, 0)
      .setDepth(9);
    shockwave.setStrokeStyle(5, 0xffffff);
    this.tweens.add({
      targets: shockwave,
      scaleX: 2.5,
      scaleY: 1.9,
      alpha: 0,
      duration: 340,
      onComplete: () => shockwave.destroy(),
    });

    for (let i = 0; i < 9; i++) {
      const spark = this.add
        .circle(x, y, 5, i % 2 === 0 ? 0xf1c40f : 0xffffff)
        .setDepth(11);
      this.tweens.add({
        targets: spark,
        x: x + Phaser.Math.Between(-95, 95),
        y: y + Phaser.Math.Between(-85, 85),
        alpha: 0,
        scale: 0.1,
        duration: 420,
        onComplete: () => spark.destroy(),
      });
    }

    this.spawnFloatingText(x, y - 92, "-1 ❤️ NYAWA!", "#ff4757");
  }

  spawnFloatingText(x, y, text, colorHex) {
    const txt = this.add
      .text(x, y, text, {
        fontFamily: "Segoe UI, sans-serif",
        fontSize: "23px",
        fontStyle: "bold",
        color: colorHex,
        stroke: "#000000",
        strokeThickness: 5,
      })
      .setOrigin(0.5)
      .setDepth(16)
      .setScale(0.6);

    this.tweens.add({
      targets: txt,
      scale: 1.12,
      y: y - 48,
      alpha: 0,
      duration: 900,
      ease: "Back.easeOut",
      onComplete: () => txt.destroy(),
    });
  }

  playEndMatchAnimation(winnerRole) {
    this.tweens.killTweensOf(this.tutorRig.root);
    this.tweens.killTweensOf(this.studentRig.root);
    this.tutorRig.root.setPosition(this.tutorBaseX, this.charY).setAngle(0);
    this.studentRig.root.setPosition(this.studentBaseX, this.charY).setAngle(0);
    this.tutorRig.shadow.setPosition(this.tutorBaseX, this.charY + 66);
    this.studentRig.shadow.setPosition(this.studentBaseX, this.charY + 66);

    if (winnerRole === 'draw') {
      this.spawnFloatingText(GAME_CONFIG.width / 2, 230, '🤝 PERTARUNGAN SERI!', '#f1c40f');
      return;
    }

    if (winnerRole === 'tutor') {
      this.tutorRig.playVictoryPose();
      this.studentRig.playDefeatPose();
    } else {
      this.studentRig.playVictoryPose();
      this.tutorRig.playDefeatPose();
    }

    const confettiColors = [0xf1c40f, 0xe74c3c, 0x2ecc71, 0x3498db, 0x9b59b6];
    for (let i = 0; i < 32; i++) {
      const cx = Phaser.Math.Between(120, GAME_CONFIG.width - 120);
      const piece = this.add.rectangle(cx, -20, 12, 8, confettiColors[i % confettiColors.length]).setDepth(15);
      this.tweens.add({
        targets: piece,
        y: Phaser.Math.Between(260, 420),
        x: cx + Phaser.Math.Between(-90, 90),
        angle: Phaser.Math.Between(-360, 360),
        alpha: 0,
        duration: Phaser.Math.Between(1100, 1900),
        delay: i * 35,
        onComplete: () => piece.destroy()
      });
    }
  }
}
