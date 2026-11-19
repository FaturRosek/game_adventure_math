import Phaser from "phaser";
import { BATTLE_COSTUMES } from "../data/battleArenaCatalog.js";

export class BattleFighterRig {
  constructor(scene, x, y, charId, facingRight = true, role = "student", cosmetic = {}) {
    this.scene = scene;
    this.baseX = x;
    this.baseY = y;
    this.charId = charId || "kiko";
    this.role = role;
    this.facingRight = facingRight;
    this.dir = facingRight ? 1 : -1;
    this.isBusy = false;
    this.isAttacking = false;
    this.fallbackSprite = null;
    this.cosmetic = cosmetic || {};

    this.shadow = scene.add
      .ellipse(x, y + 66, 110, 28, 0x000000, 0.42)
      .setDepth(5);
    this.turnAura = scene.add
      .ellipse(x, y + 66, 140, 38, 0xf1c40f, 0)
      .setDepth(4);
    this.turnAura.setStrokeStyle(4, 0xfff200, 0.95);

    this.root = scene.add.container(x, y).setDepth(8);
    this.root.setScale(this.dir, 1);

    try {
      this.ensureTexturesBuilt();
      this.buildArticulatedRig();
    } catch (e) {
      this.buildFallbackSprite();
    }

    this.startIdleAnimation();
    this.startBlinkLoop();
  }

  getPalette() {
    const isTutor = this.role === 'tutor';
    const baseByChar = {
      prof_panda: { fur: '#f5f6fa', furDark: '#cfd6e0', accent: '#2c3e50', cheek: '#ff9ff3' },
      bobi: { fur: '#b86b35', furDark: '#7a3e16', accent: '#ffeaa7', cheek: '#fab1a0' },
      cici: { fur: '#ffffff', furDark: '#dcdde1', accent: '#ff9ff3', cheek: '#ff7675' },
      kiko: { fur: '#f39c12', furDark: '#b96707', accent: '#fff5e6', cheek: '#ff7675' },
      drago: { fur: '#2ecc71', furDark: '#1e8449', accent: '#ffeaa7', cheek: '#ff7675' },
      robo: { fur: '#74b9ff', furDark: '#0984e3', accent: '#dfe6e9', cheek: '#00d2d3' }
    };
    const charColors = baseByChar[this.charId] || baseByChar.kiko;

    const palette = isTutor
      ? {
          ...charColors,
          armorTop: '#2980b9',
          armorBot: '#154360',
          trim: '#f1c40f',
          gloveTop: '#e74c3c',
          gloveBot: '#922b21',
          shoeTop: '#34495e',
          shoeBot: '#1b2631',
          cape: '#c0392b'
        }
      : {
          ...charColors,
          armorTop: '#ff7f50',
          armorBot: '#c0392b',
          trim: '#00d2d3',
          gloveTop: '#3498db',
          gloveBot: '#1b4f72',
          shoeTop: '#e67e22',
          shoeBot: '#935116',
          cape: '#f1c40f'
        };

    const costumeCfg = BATTLE_COSTUMES.find((c) => c.id === this.cosmetic?.costume);
    if (costumeCfg && costumeCfg.armorTop) {
      palette.armorTop = costumeCfg.armorTop;
      palette.armorBot = costumeCfg.armorBot;
      palette.trim = costumeCfg.trim;
    }

    return palette;
  }

  createCanvasTex(key, w, h, drawFn) {
    if (this.scene.textures.exists(key)) return key;
    const canvasTex = this.scene.textures.createCanvas(key, w, h);
    const ctx = canvasTex.getContext();
    ctx.clearRect(0, 0, w, h);
    drawFn(ctx, w, h);
    canvasTex.refresh();
    return key;
  }

  ensureTexturesBuilt() {
    const p = this.getPalette();
    const cosKey = `${this.cosmetic?.costume || 'default'}_${this.cosmetic?.accessory || 'none'}`;
    const prefix = `fighter3d_${this.role}_${this.charId}_${cosKey}`;

    this.texTorso = this.createCanvasTex(`${prefix}_torso`, 110, 110, (ctx) => {
      ctx.save();
      ctx.translate(55, 55);

      if (this.role === "tutor") {
        const capeGrad = ctx.createLinearGradient(-40, -25, -10, 45);
        capeGrad.addColorStop(0, p.cape);
        capeGrad.addColorStop(1, "#641e16");
        ctx.fillStyle = capeGrad;
        ctx.beginPath();
        ctx.moveTo(-18, -24);
        ctx.quadraticCurveTo(-48, 8, -42, 42);
        ctx.lineTo(-10, 34);
        ctx.closePath();
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = "#1e272e";
        ctx.stroke();
      } else {
        const scarfGrad = ctx.createLinearGradient(-38, -22, -14, 15);
        scarfGrad.addColorStop(0, p.trim);
        scarfGrad.addColorStop(1, "#00838f");
        ctx.fillStyle = scarfGrad;
        ctx.beginPath();
        ctx.moveTo(-16, -24);
        ctx.quadraticCurveTo(-44, -10, -40, 14);
        ctx.lineTo(-18, 6);
        ctx.closePath();
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = "#1e272e";
        ctx.stroke();
      }

      const bodyGrad = ctx.createRadialGradient(-8, -14, 6, 0, 4, 44);
      bodyGrad.addColorStop(0, p.armorTop);
      bodyGrad.addColorStop(1, p.armorBot);

      ctx.fillStyle = bodyGrad;
      ctx.beginPath();
      ctx.roundRect(-28, -28, 56, 62, 22);
      ctx.fill();
      ctx.lineWidth = 4;
      ctx.strokeStyle = "#1e272e";
      ctx.stroke();

      const chestGrad = ctx.createLinearGradient(0, -20, 0, 24);
      chestGrad.addColorStop(0, "#ffffff");
      chestGrad.addColorStop(1, "#dfe6e9");
      ctx.fillStyle = chestGrad;
      ctx.beginPath();
      ctx.roundRect(-14, -18, 28, 36, 12);
      ctx.fill();

      ctx.fillStyle = p.trim;
      ctx.beginPath();
      ctx.roundRect(-29, 12, 58, 12, 5);
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = "#1e272e";
      ctx.stroke();

      ctx.fillStyle = "#fff200";
      ctx.beginPath();
      ctx.arc(0, 18, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      if (this.role === "tutor") {
        ctx.fillStyle = "#f1c40f";
        ctx.beginPath();
        ctx.ellipse(-24, -22, 12, 8, -0.3, 0, Math.PI * 2);
        ctx.ellipse(24, -22, 12, 8, 0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }

      ctx.fillStyle = "rgba(255,255,255,0.28)";
      ctx.beginPath();
      ctx.ellipse(-10, -18, 12, 5, -0.3, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    });

    this.texArm = this.createCanvasTex(`${prefix}_arm`, 76, 76, (ctx) => {
      ctx.save();
      ctx.translate(22, 20);

      const armGrad = ctx.createLinearGradient(-8, 0, 14, 28);
      armGrad.addColorStop(0, p.fur);
      armGrad.addColorStop(1, p.furDark);
      ctx.fillStyle = armGrad;
      ctx.beginPath();
      ctx.roundRect(-8, -4, 18, 30, 9);
      ctx.fill();
      ctx.lineWidth = 3.5;
      ctx.strokeStyle = "#1e272e";
      ctx.stroke();

      const gloveGrad = ctx.createRadialGradient(4, 24, 3, 4, 28, 18);
      gloveGrad.addColorStop(0, p.gloveTop);
      gloveGrad.addColorStop(1, p.gloveBot);
      ctx.fillStyle = gloveGrad;
      ctx.beginPath();
      ctx.arc(4, 30, 15, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = 3.5;
      ctx.strokeStyle = "#1e272e";
      ctx.stroke();

      ctx.fillStyle = "rgba(255,255,255,0.45)";
      ctx.beginPath();
      ctx.ellipse(0, 23, 6, 3.5, -0.4, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    });

    this.texLeg = this.createCanvasTex(`${prefix}_leg`, 60, 64, (ctx) => {
      ctx.save();
      ctx.translate(28, 16);

      const legGrad = ctx.createLinearGradient(-8, 0, 10, 20);
      legGrad.addColorStop(0, p.armorBot);
      legGrad.addColorStop(1, "#1e272e");
      ctx.fillStyle = legGrad;
      ctx.beginPath();
      ctx.roundRect(-9, -4, 18, 22, 7);
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = "#1e272e";
      ctx.stroke();

      const shoeGrad = ctx.createLinearGradient(-10, 14, 16, 36);
      shoeGrad.addColorStop(0, p.shoeTop);
      shoeGrad.addColorStop(1, p.shoeBot);
      ctx.fillStyle = shoeGrad;
      ctx.beginPath();
      ctx.roundRect(-11, 14, 30, 18, 9);
      ctx.fill();
      ctx.lineWidth = 3.5;
      ctx.strokeStyle = "#1e272e";
      ctx.stroke();

      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.roundRect(-10, 27, 28, 5, 2);
      ctx.fill();

      ctx.restore();
    });

    this.texHead = this.createCanvasTex(`${prefix}_head`, 130, 130, (ctx) => {
      ctx.save();
      ctx.translate(65, 76);

      if (this.charId === "cici") {
        const earGrad = ctx.createLinearGradient(0, -68, 0, -24);
        earGrad.addColorStop(0, "#ffffff");
        earGrad.addColorStop(1, "#dcdde1");
        [-16, 14].forEach((ex) => {
          ctx.fillStyle = earGrad;
          ctx.beginPath();
          ctx.roundRect(ex - 9, -68, 18, 44, 9);
          ctx.fill();
          ctx.lineWidth = 3.5;
          ctx.strokeStyle = "#1e272e";
          ctx.stroke();
          ctx.fillStyle = "#ff9ff3";
          ctx.beginPath();
          ctx.roundRect(ex - 4, -60, 8, 28, 4);
          ctx.fill();
        });
      } else if (this.charId === "bobi") {
        [-26, 26].forEach((ex) => {
          ctx.fillStyle = p.furDark;
          ctx.beginPath();
          ctx.arc(ex, -28, 14, 0, Math.PI * 2);
          ctx.fill();
          ctx.lineWidth = 3.5;
          ctx.strokeStyle = "#1e272e";
          ctx.stroke();
          ctx.fillStyle = "#ffeaa7";
          ctx.beginPath();
          ctx.arc(ex, -28, 7, 0, Math.PI * 2);
          ctx.fill();
        });
      } else if (this.charId === "prof_panda") {
        [-26, 26].forEach((ex) => {
          ctx.fillStyle = "#1e272e";
          ctx.beginPath();
          ctx.arc(ex, -28, 14, 0, Math.PI * 2);
          ctx.fill();
        });
      } else {
        ctx.fillStyle = "#6e421c";
        ctx.fillRect(-14, -50, 6, 20);
        ctx.fillRect(8, -50, 6, 20);
        ctx.fillRect(-19, -44, 6, 6);
        ctx.fillRect(13, -44, 6, 6);

        ctx.fillStyle = p.fur;
        ctx.beginPath();
        ctx.moveTo(-36, -24);
        ctx.lineTo(-18, -22);
        ctx.lineTo(-24, -8);
        ctx.closePath();
        ctx.moveTo(36, -24);
        ctx.lineTo(18, -22);
        ctx.lineTo(24, -8);
        ctx.closePath();
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = "#1e272e";
        ctx.stroke();
      }

      const headGrad = ctx.createRadialGradient(-10, -18, 6, 0, -4, 44);
      headGrad.addColorStop(0, p.fur);
      headGrad.addColorStop(1, p.furDark);
      ctx.fillStyle = headGrad;
      ctx.beginPath();
      ctx.roundRect(-34, -32, 68, 56, 26);
      ctx.fill();
      ctx.lineWidth = 4;
      ctx.strokeStyle = "#1e272e";
      ctx.stroke();

      ctx.fillStyle = "rgba(255,255,255,0.35)";
      ctx.beginPath();
      ctx.ellipse(-12, -22, 14, 6, -0.3, 0, Math.PI * 2);
      ctx.fill();

      if (this.role === "student") {
        ctx.fillStyle = p.trim;
        ctx.beginPath();
        ctx.roundRect(-34, -26, 68, 10, 4);
        ctx.fill();
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = "#1e272e";
        ctx.stroke();
      } else {
        ctx.fillStyle = "#f1c40f";
        ctx.beginPath();
        ctx.moveTo(-14, -32);
        ctx.lineTo(-8, -44);
        ctx.lineTo(0, -34);
        ctx.lineTo(8, -44);
        ctx.lineTo(14, -32);
        ctx.closePath();
        ctx.fill();
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = "#1e272e";
        ctx.stroke();
      }

      if (this.charId === "prof_panda") {
        ctx.fillStyle = "#1e272e";
        ctx.beginPath();
        ctx.ellipse(-8, -4, 12, 10, -0.2, 0, Math.PI * 2);
        ctx.ellipse(16, -4, 12, 10, 0.2, 0, Math.PI * 2);
        ctx.fill();

        ctx.lineWidth = 3;
        ctx.strokeStyle = "#f1c40f";
        ctx.beginPath();
        ctx.arc(-8, -4, 11, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(16, -4, 11, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(3, -4);
        ctx.lineTo(5, -4);
        ctx.stroke();
      }

      ctx.fillStyle = p.accent;
      ctx.beginPath();
      ctx.ellipse(4, 10, 16, 10, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#1e272e";
      ctx.beginPath();
      ctx.ellipse(5, 6, 5, 3.5, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.lineWidth = 2.5;
      ctx.strokeStyle = "#1e272e";
      ctx.beginPath();
      ctx.arc(5, 11, 5, 0.15, Math.PI - 0.15);
      ctx.stroke();

      ctx.restore();
    });
  }

  buildFallbackSprite() {
    this.root.removeAll(true);
    const texKey = this.scene.textures.exists(`player_${this.charId}`)
      ? `player_${this.charId}`
      : "player_kiko";
    this.fallbackSprite = this.scene.add.sprite(0, 0, texKey).setScale(1.65);
    this.root.add(this.fallbackSprite);
  }

  buildArticulatedRig() {
    this.backLeg = this.scene.add
      .sprite(-14, 40, this.texLeg)
      .setOrigin(0.45, 0.2);
    this.frontLeg = this.scene.add
      .sprite(12, 40, this.texLeg)
      .setOrigin(0.45, 0.2);
    this.backArm = this.scene.add
      .sprite(-18, -2, this.texArm)
      .setOrigin(0.3, 0.25);
    this.torso = this.scene.add.sprite(0, 10, this.texTorso);
    this.head = this.scene.add.sprite(2, -40, this.texHead);
    this.eyesContainer = this.scene.add.container(2, -40);
    this.frontArm = this.scene.add
      .sprite(18, 0, this.texArm)
      .setOrigin(0.3, 0.25);
    this.dizzyStars = this.scene.add.container(0, -88).setVisible(false);

    for (let i = 0; i < 3; i++) {
      const ang = (i * Math.PI * 2) / 3;
      const st = this.scene.add.circle(
        Math.cos(ang) * 24,
        Math.sin(ang) * 8,
        6,
        0xf1c40f,
      );
      st.setStrokeStyle(2, 0x2c3e50);
      this.dizzyStars.add(st);
    }

    this.root.add([
      this.backArm,
      this.backLeg,
      this.torso,
      this.frontLeg,
      this.head,
      this.eyesContainer,
      this.frontArm,
      this.dizzyStars,
    ]);

    this.frontArm.setAngle(-28);
    this.backArm.setAngle(18);
    this.setExpression("idle");
  }

  setExpression(type) {
    if (this.fallbackSprite || !this.eyesContainer) return;
    this.eyesContainer.removeAll(true);
    const g = this.scene.add.graphics();
    const isPanda = this.charId === "prof_panda";
    const pupilColor = isPanda ? 0xffffff : 0x1e272e;

    if (type === "blink") {
      g.lineStyle(3.5, pupilColor, 1);
      g.strokeLineShape(new Phaser.Geom.Line(-14, 7, -3, 7));
      g.strokeLineShape(new Phaser.Geom.Line(10, 7, 21, 7));
    } else if (type === "attack") {
      g.fillStyle(pupilColor, 1);
      g.fillCircle(-8, 7, 4.5);
      g.fillCircle(16, 7, 4.5);
      g.lineStyle(3.5, 0x1e272e, 1);
      g.strokeLineShape(new Phaser.Geom.Line(-15, -1, -2, 3));
      g.strokeLineShape(new Phaser.Geom.Line(23, -1, 10, 3));
    } else if (type === "hit" || type === "defeat") {
      g.lineStyle(3.5, isPanda ? 0xff9ff3 : 0x1e272e, 1);
      g.strokeLineShape(new Phaser.Geom.Line(-13, 2, -4, 11));
      g.strokeLineShape(new Phaser.Geom.Line(-4, 2, -13, 11));
      g.strokeLineShape(new Phaser.Geom.Line(11, 2, 20, 11));
      g.strokeLineShape(new Phaser.Geom.Line(20, 2, 11, 11));
    } else if (type === "victory") {
      g.lineStyle(3.5, pupilColor, 1);
      g.beginPath();
      g.arc(-8, 9, 5.5, Math.PI, 0, false);
      g.strokePath();
      g.beginPath();
      g.arc(16, 9, 5.5, Math.PI, 0, false);
      g.strokePath();
    } else {
      g.fillStyle(pupilColor, 1);
      g.fillCircle(-8, 7, 4.8);
      g.fillCircle(16, 7, 4.8);
      if (!isPanda) {
        g.fillStyle(0xffffff, 1);
        g.fillCircle(-6.5, 5, 1.8);
        g.fillCircle(17.5, 5, 1.8);
      }
    }

    this.eyesContainer.add(g);
  }

  setTurnActive(isActive) {
    this.scene.tweens.killTweensOf(this.turnAura);
    if (isActive) {
      this.turnAura.setAlpha(0.5);
      this.scene.tweens.add({
        targets: this.turnAura,
        scaleX: 1.12,
        scaleY: 1.12,
        alpha: 0.88,
        duration: 550,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
    } else {
      this.turnAura.setAlpha(0);
      this.turnAura.setScale(1, 1);
    }
  }

  startIdleAnimation() {
    if (this.fallbackSprite) {
      this.idleTween = this.scene.tweens.add({
        targets: this.root,
        y: this.baseY - 6,
        duration: 600,
        yoyo: true,
        repeat: -1,
      });
      return;
    }

    this.idleTweens = [];

    this.idleTweens.push(
      this.scene.tweens.add({
        targets: [this.torso, this.frontArm, this.backArm],
        y: "+=4",
        duration: 620,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      }),
    );

    this.idleTweens.push(
      this.scene.tweens.add({
        targets: [this.head, this.eyesContainer],
        y: "+=5",
        angle: { from: -2, to: 3 },
        duration: 680,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      }),
    );

    this.idleTweens.push(
      this.scene.tweens.add({
        targets: this.frontArm,
        angle: { from: -34, to: -18 },
        duration: 580,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      }),
    );

    this.idleTweens.push(
      this.scene.tweens.add({
        targets: this.backArm,
        angle: { from: 12, to: 26 },
        duration: 640,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      }),
    );
  }

  stopIdleAnimations() {
    if (this.idleTween) this.idleTween.stop();
    if (this.idleTweens) {
      this.idleTweens.forEach((tw) => tw.stop());
    }
  }

  startBlinkLoop() {
    this.blinkEvent = this.scene.time.addEvent({
      delay: 3000,
      loop: true,
      callback: () => {
        if (this.isBusy || this.fallbackSprite) return;
        this.setExpression("blink");
        this.scene.time.delayedCall(130, () => {
          if (!this.isBusy) this.setExpression("idle");
        });
      },
    });
  }

  spawnFootDust(x, y) {
    for (let i = 0; i < 5; i++) {
      const dust = this.scene.add
        .circle(
          x + Phaser.Math.Between(-18, 18),
          y + 60,
          Phaser.Math.Between(6, 12),
          0xdfe6e9,
          0.75,
        )
        .setDepth(7);

      this.scene.tweens.add({
        targets: dust,
        x: dust.x - this.dir * Phaser.Math.Between(25, 55),
        y: dust.y - Phaser.Math.Between(8, 22),
        scale: 1.8,
        alpha: 0,
        duration: 380,
        ease: "Quad.easeOut",
        onComplete: () => dust.destroy(),
      });
    }
  }

  playAttackPose(isSpecial, onStrikePeak, onFinished) {
    this.isBusy = true;
    this.isAttacking = true;
    this.setExpression("attack");

    this.scene.tweens.killTweensOf(this.root);
    this.scene.tweens.killTweensOf(this.shadow);
    this.root.setPosition(this.baseX, this.baseY);
    this.shadow.setPosition(this.baseX, this.baseY + 66);
    this.root.setAngle(0);

    const windUpX = this.baseX - this.dir * 24;
    const lungeX = this.baseX + this.dir * (isSpecial ? 210 : 145);

    this.spawnFootDust(this.baseX, this.baseY);

    if (!this.fallbackSprite) {
      this.scene.tweens.add({
        targets: this.frontArm,
        angle: 40,
        duration: 110,
      });
      this.scene.tweens.add({
        targets: this.frontLeg,
        angle: -22,
        duration: 110,
      });
    }

    this.scene.tweens.add({
      targets: [this.root, this.shadow],
      x: windUpX,
      duration: 110,
      ease: "Sine.easeOut",
      onComplete: () => {
        this.spawnFootDust(windUpX, this.baseY);

        if (!this.fallbackSprite) {
          this.scene.tweens.add({
            targets: this.frontArm,
            angle: -95,
            duration: 130,
            ease: "Back.easeOut",
          });
          this.scene.tweens.add({
            targets: this.backLeg,
            angle: 32,
            duration: 140,
          });
        }

        this.scene.tweens.add({
          targets: [this.root, this.shadow],
          x: lungeX,
          duration: isSpecial ? 200 : 165,
          ease: "Cubic.easeOut",
          onComplete: () => {
            this.spawnFootDust(lungeX, this.baseY);
            if (onStrikePeak)
              onStrikePeak(lungeX + this.dir * 38, this.baseY - 4);

            this.scene.tweens.add({
              targets: [this.root, this.shadow],
              x: this.baseX,
              duration: 210,
              delay: 90,
              ease: "Power2",
              onComplete: () => {
                if (!this.fallbackSprite) {
                  this.frontArm.setAngle(-28);
                  this.frontLeg.setAngle(0);
                  this.backLeg.setAngle(0);
                }
                this.setExpression("idle");
                this.isAttacking = false;
                this.isBusy = false;
                if (onFinished) onFinished();
              },
            });
          },
        });
      },
    });
  }

  playMissPose(onFinished) {
    this.isBusy = true;
    this.setExpression("hit");
    this.scene.tweens.add({
      targets: this.root,
      angle: { from: -10, to: 10 },
      duration: 85,
      yoyo: true,
      repeat: 2,
      onComplete: () => {
        this.root.setAngle(0);
        this.setExpression("idle");
        this.isBusy = false;
        if (onFinished) onFinished();
      },
    });
  }

  playHitPose(onFinished) {
    this.setExpression("hit");
    this.spawnFootDust(this.root.x, this.baseY);

    if (this.isAttacking) {
      this.scene.time.delayedCall(220, () => {
        if (!this.isAttacking) this.setExpression("idle");
        if (onFinished) onFinished();
      });
      return;
    }

    this.isBusy = true;
    const knockX = this.baseX - this.dir * 38;

    if (!this.fallbackSprite) {
      this.frontArm.setAngle(-120);
      this.backArm.setAngle(75);
    }

    this.scene.tweens.add({
      targets: [this.root, this.shadow],
      x: knockX,
      duration: 95,
      ease: "Power2",
      onComplete: () => {
        this.scene.tweens.add({
          targets: this.root,
          angle: -this.dir * 15,
          duration: 75,
          yoyo: true,
          onComplete: () => {
            this.scene.tweens.add({
              targets: [this.root, this.shadow],
              x: this.baseX,
              duration: 165,
              ease: "Back.easeOut",
              onComplete: () => {
                this.root.setAngle(0);
                if (!this.fallbackSprite) {
                  this.frontArm.setAngle(-28);
                  this.backArm.setAngle(18);
                }
                this.setExpression("idle");
                this.isBusy = false;
                if (onFinished) onFinished();
              },
            });
          },
        });
      },
    });
  }

  playVictoryPose() {
    this.isBusy = true;
    this.stopIdleAnimations();
    this.setExpression("victory");

    if (!this.fallbackSprite) {
      this.frontArm.setAngle(-150);
      this.backArm.setAngle(-140);
    }

    this.scene.tweens.add({
      targets: this.root,
      y: this.baseY - 34,
      duration: 280,
      yoyo: true,
      repeat: -1,
      ease: "Quad.easeOut",
    });
  }

  playDefeatPose() {
    this.isBusy = true;
    this.stopIdleAnimations();
    this.setExpression("defeat");

    if (!this.fallbackSprite) {
      this.dizzyStars.setVisible(true);
      this.scene.tweens.add({
        targets: this.dizzyStars,
        angle: 360,
        duration: 1400,
        repeat: -1,
      });
    }

    this.scene.tweens.add({
      targets: this.root,
      y: this.baseY + 26,
      angle: -this.dir * 24,
      duration: 420,
      ease: "Bounce.easeOut",
    });
  }

  static renderPreviewDataURL(charId = 'kiko', role = 'student', cosmetic = {}) {
    const canvas = document.createElement('canvas');
    canvas.width = 120;
    canvas.height = 130;
    const ctx = canvas.getContext('2d');

    const baseByChar = {
      prof_panda: { fur: '#f5f6fa', furDark: '#cfd6e0', accent: '#2c3e50' },
      bobi: { fur: '#b86b35', furDark: '#7a3e16', accent: '#ffeaa7' },
      cici: { fur: '#ffffff', furDark: '#dcdde1', accent: '#ff9ff3' },
      kiko: { fur: '#f39c12', furDark: '#b96707', accent: '#fff5e6' },
      drago: { fur: '#2ecc71', furDark: '#1e8449', accent: '#ffeaa7' },
      robo: { fur: '#74b9ff', furDark: '#0984e3', accent: '#dfe6e9' }
    };
    const c = baseByChar[charId] || baseByChar.kiko;
    const costumeCfg = BATTLE_COSTUMES.find((item) => item.id === cosmetic?.costume);
    const armorTop = costumeCfg?.armorTop || (role === 'tutor' ? '#2980b9' : '#ff7f50');
    const armorBot = costumeCfg?.armorBot || (role === 'tutor' ? '#154360' : '#c0392b');
    const trim = costumeCfg?.trim || (role === 'tutor' ? '#f1c40f' : '#00d2d3');

    ctx.save();
    ctx.translate(60, 80);

    const bGrad = ctx.createLinearGradient(0, -10, 0, 42);
    bGrad.addColorStop(0, armorTop);
    bGrad.addColorStop(1, armorBot);
    ctx.fillStyle = bGrad;
    ctx.beginPath();
    ctx.roundRect(-24, -4, 48, 44, 16);
    ctx.fill();
    ctx.lineWidth = 3.5;
    ctx.strokeStyle = '#1e272e';
    ctx.stroke();

    ctx.fillStyle = trim;
    ctx.fillRect(-24, 18, 48, 8);

    const hGrad = ctx.createRadialGradient(-8, -32, 4, 0, -24, 34);
    hGrad.addColorStop(0, c.fur);
    hGrad.addColorStop(1, c.furDark);
    ctx.fillStyle = hGrad;
    ctx.beginPath();
    ctx.roundRect(-28, -52, 56, 48, 22);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#1e272e';
    ctx.beginPath();
    ctx.arc(-10, -28, 4.5, 0, Math.PI * 2);
    ctx.arc(10, -28, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-8.5, -29.5, 1.5, 0, Math.PI * 2);
    ctx.arc(11.5, -29.5, 1.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = c.accent;
    ctx.beginPath();
    ctx.ellipse(0, -16, 12, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    if (cosmetic?.accessory === 'crown') {
      ctx.fillStyle = '#f1c40f';
      ctx.beginPath();
      ctx.moveTo(-16, -50);
      ctx.lineTo(-10, -66);
      ctx.lineTo(0, -55);
      ctx.lineTo(10, -66);
      ctx.lineTo(16, -50);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else if (cosmetic?.accessory === 'visor') {
      ctx.fillStyle = 'rgba(0, 210, 211, 0.85)';
      ctx.beginPath();
      ctx.roundRect(-22, -35, 44, 13, 5);
      ctx.fill();
      ctx.stroke();
    } else if (cosmetic?.accessory === 'wizard_hat') {
      ctx.fillStyle = '#8e44ad';
      ctx.beginPath();
      ctx.moveTo(-26, -48);
      ctx.lineTo(0, -76);
      ctx.lineTo(26, -48);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    ctx.restore();
    return canvas.toDataURL();
  }
}
