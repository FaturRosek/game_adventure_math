import Phaser from "phaser";
import { GAME_CONFIG } from "../config/gameConfig.js";

export class DuelScene extends Phaser.Scene {
  constructor() {
    super("DuelScene");
  }

  init(data) {
    this.duelConfig = data || {};
    this.totalRounds = Number(this.duelConfig.rounds) || 5;
    this.tutorCharId = this.duelConfig.tutorCharacter || "prof_panda";
    this.studentCharId = this.duelConfig.studentCharacter || "kiko";
    this.studentName = this.duelConfig.studentName || "Murid";

    this.startX = 160;
    this.finishX = 1120;
    this.trackDistance = this.finishX - this.startX;
    this.stepDistance = this.trackDistance / this.totalRounds;

    this.tutorStep = 0;
    this.studentStep = 0;
  }

  create() {
    const W = GAME_CONFIG.width;
    const H = GAME_CONFIG.height;

    const bg = this.add.graphics();
    bg.fillGradientStyle(0x74ebd5, 0x74ebd5, 0xacb6e5, 0xacb6e5, 1);
    bg.fillRect(0, 0, W, H);

    bg.fillStyle(0x2ecc71, 1);
    bg.fillRect(0, 75, W, 250);

    const trackTop = 105;
    const trackHeight = 190;

    bg.fillStyle(0x2c3e50, 1);
    bg.fillRoundedRect(70, trackTop - 8, W - 140, trackHeight + 16, 20);

    bg.fillStyle(0xe67e22, 1);
    bg.fillRoundedRect(76, trackTop, W - 152, trackHeight, 16);

    bg.lineStyle(4, 0xffffff, 0.75);
    for (let x = this.startX; x < this.finishX; x += 40) {
      bg.strokeLineShape(
        new Phaser.Geom.Line(
          x,
          trackTop + trackHeight / 2,
          x + 22,
          trackTop + trackHeight / 2,
        ),
      );
    }

    for (let r = 1; r <= this.totalRounds; r++) {
      const markerX = this.startX + r * this.stepDistance;
      bg.lineStyle(2, 0xfff9db, 0.55);
      bg.strokeLineShape(
        new Phaser.Geom.Line(
          markerX,
          trackTop + 6,
          markerX,
          trackTop + trackHeight - 6,
        ),
      );
    }

    this.add
      .image(this.startX, trackTop + trackHeight / 2, "checker_line")
      .setDisplaySize(20, trackHeight - 8);
    this.add
      .image(this.finishX, trackTop + trackHeight / 2, "checker_line")
      .setDisplaySize(26, trackHeight - 8);

    this.add
      .text(this.startX, trackTop - 22, "🚩 START", {
        fontFamily: "Segoe UI, sans-serif",
        fontSize: "15px",
        fontStyle: "bold",
        color: "#ffffff",
        backgroundColor: "#2980b9",
        padding: { x: 8, y: 3 },
      })
      .setOrigin(0.5);

    this.add
      .text(this.finishX, trackTop - 22, "🏁 FINIS", {
        fontFamily: "Segoe UI, sans-serif",
        fontSize: "15px",
        fontStyle: "bold",
        color: "#ffffff",
        backgroundColor: "#27ae60",
        padding: { x: 8, y: 3 },
      })
      .setOrigin(0.5);

    this.tutorY = trackTop + 48;
    this.studentY = trackTop + 142;

    this.tutorSprite = this.add.sprite(
      this.startX,
      this.tutorY,
      `player_${this.tutorCharId}`,
    );
    this.tutorLabel = this.add
      .text(this.startX, this.tutorY - 42, "👨‍🏫 TUTOR (0%)", {
        fontFamily: "Segoe UI, sans-serif",
        fontSize: "14px",
        fontStyle: "bold",
        color: "#ffffff",
        backgroundColor: "#2c3e50",
        padding: { x: 8, y: 3 },
      })
      .setOrigin(0.5);

    this.studentSprite = this.add.sprite(
      this.startX,
      this.studentY,
      `player_${this.studentCharId}`,
    );
    this.studentLabel = this.add
      .text(
        this.startX,
        this.studentY - 42,
        `🧒 ${this.studentName.toUpperCase()} (0%)`,
        {
          fontFamily: "Segoe UI, sans-serif",
          fontSize: "14px",
          fontStyle: "bold",
          color: "#ffffff",
          backgroundColor: "#d35400",
          padding: { x: 8, y: 3 },
        },
      )
      .setOrigin(0.5);

    this.tweens.add({
      targets: [this.tutorSprite, this.studentSprite],
      scaleY: 1.05,
      duration: 550,
      yoyo: true,
      repeat: -1,
    });
  }

  animateRunnerMove({ role, isCorrect, streak = 0, onComplete }) {
    const isTutor = role === "tutor";
    const sprite = isTutor ? this.tutorSprite : this.studentSprite;
    const label = isTutor ? this.tutorLabel : this.studentLabel;
    const baseY = isTutor ? this.tutorY : this.studentY;

    if (!isCorrect) {
      this.tweens.add({
        targets: sprite,
        angle: { from: -8, to: 8 },
        duration: 90,
        yoyo: true,
        repeat: 2,
        onComplete: () => {
          sprite.setAngle(0);
          if (onComplete) onComplete(false);
        },
      });
      return;
    }

    if (isTutor) {
      this.tutorStep = Math.min(this.totalRounds, this.tutorStep + 1);
    } else {
      this.studentStep = Math.min(this.totalRounds, this.studentStep + 1);
    }

    const currentStep = isTutor ? this.tutorStep : this.studentStep;
    const targetX = this.startX + currentStep * this.stepDistance;
    const progressPct = Math.round((currentStep / this.totalRounds) * 100);

    if (streak >= 2) {
      this.spawnTurboEffect(
        sprite.x,
        baseY,
        isTutor ? "⚡ TURBO TUTOR!" : "🔥 TURBO MURID!",
      );
    }

    const hopTween = this.tweens.add({
      targets: sprite,
      y: baseY - 14,
      duration: 110,
      yoyo: true,
      repeat: 3,
    });

    this.tweens.add({
      targets: [sprite, label],
      x: targetX,
      duration: 750,
      ease: "Power2",
      onComplete: () => {
        hopTween.stop();
        sprite.y = baseY;
        if (isTutor) {
          label.setText(`👨‍🏫 TUTOR (${progressPct}%)`);
        } else {
          label.setText(
            `🧒 ${this.studentName.toUpperCase()} (${progressPct}%)`,
          );
        }

        const reachedFinish = currentStep >= this.totalRounds;
        if (onComplete) onComplete(reachedFinish);
      },
    });
  }

  spawnTurboEffect(x, y, textBanner) {
    for (let i = 0; i < 8; i++) {
      const spark = this.add.image(
        x - 10,
        y + Phaser.Math.Between(-15, 15),
        "turbo_spark",
      );
      this.tweens.add({
        targets: spark,
        x: x - Phaser.Math.Between(45, 95),
        y: y + Phaser.Math.Between(-25, 25),
        alpha: 0,
        scale: 0.2,
        duration: 500,
        onComplete: () => spark.destroy(),
      });
    }

    const turboTxt = this.add
      .text(x, y - 65, textBanner, {
        fontFamily: "Segoe UI, sans-serif",
        fontSize: "18px",
        fontStyle: "bold",
        color: "#fff200",
        stroke: "#000000",
        strokeThickness: 4,
      })
      .setOrigin(0.5);

    this.tweens.add({
      targets: turboTxt,
      y: y - 95,
      alpha: 0,
      duration: 900,
      onComplete: () => turboTxt.destroy(),
    });
  }

  getRacePositions() {
    return {
      tutorStep: this.tutorStep,
      studentStep: this.studentStep,
      tutorPct: Math.round((this.tutorStep / this.totalRounds) * 100),
      studentPct: Math.round((this.studentStep / this.totalRounds) * 100),
    };
  }
}
