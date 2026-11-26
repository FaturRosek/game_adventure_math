import { characterAssetManager } from "./CharacterAssetManager.js";
import { BATTLE_COSTUMES } from "../data/battleArenaCatalog.js";

export class BattleFighterRig {
  constructor(
    scene,
    x,
    y,
    charId = "kiko",
    facingRight = true,
    role = "student",
    cosmetic = {},
  ) {
    this.scene = scene;
    this.baseX = x;
    this.baseY = y;
    this.charId = characterAssetManager.getCharacterMeta(charId).id;
    this.facingRight = facingRight;
    this.dir = facingRight ? 1 : -1;
    this.role = role;
    this.cosmetic = cosmetic || {};
    this.isBusy = false;
    this.isAttacking = false;

    if (!scene.textures.exists(`player_sheet_${this.charId}`)) {
      characterAssetManager.buildTexturesAndAnimations(scene);
    }

    this.shadow = scene.add
      .ellipse(x, y + 66, 98, 26, 0x000000, 0.38)
      .setDepth(4);
    this.turnAura = scene.add
      .ellipse(x, y + 64, 124, 34, role === "tutor" ? 0x38bdf8 : 0xfacc15, 0.25)
      .setDepth(3);
    this.turnAura.setStrokeStyle(
      3,
      role === "tutor" ? 0x7dd3fc : 0xfef08a,
      0.9,
    );
    this.turnAura.setVisible(false);

    this.root = scene.add.container(x, y).setDepth(8);

    this.applyCostumeVisuals();

    const sheetKey = scene.textures.exists(`player_sheet_${this.charId}`)
      ? `player_sheet_${this.charId}`
      : `player_${this.charId}`;

    this.sprite = scene.add.sprite(0, 4, sheetKey).setScale(0.71);
    this.sprite.setFlipX(!facingRight);
    this.root.add(this.sprite);

    this.applyAccessoryVisuals();

    this.playAnim("idle");

    scene.tweens.add({
      targets: this.root,
      y: y - 5,
      duration: 950,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
  }

  parseHexColor(hexStr, fallback = 0xf59e0b) {
    if (typeof hexStr === "number") return hexStr;
    if (typeof hexStr === "string" && hexStr.startsWith("#")) {
      const parsed = parseInt(hexStr.replace("#", ""), 16);
      if (!Number.isNaN(parsed)) return parsed;
    }
    return fallback;
  }

  applyCostumeVisuals() {
    const costumeId = this.cosmetic?.costume || "default";
    if (!costumeId || costumeId === "default") return;

    const cfg = BATTLE_COSTUMES.find((c) => c.id === costumeId);
    const primaryCol = this.parseHexColor(cfg?.armorTop, 0xf59e0b);
    const darkCol = this.parseHexColor(cfg?.armorBot, 0xb45309);
    const trimCol = this.parseHexColor(cfg?.trim, 0xfef08a);

    const aura = this.scene.add.ellipse(0, 62, 114, 28, primaryCol, 0.22);
    aura.setStrokeStyle(3.5, trimCol, 0.92);
    this.root.add(aura);

    this.scene.tweens.add({
      targets: aura,
      scaleX: 1.08,
      scaleY: 1.08,
      alpha: 0.72,
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    const capeGfx = this.scene.add.graphics();
    const backDir = -this.dir;
    capeGfx.fillStyle(darkCol, 0.95);
    capeGfx.beginPath();
    capeGfx.moveTo(backDir * 10, -18);
    capeGfx.lineTo(backDir * 52, 46);
    capeGfx.lineTo(backDir * 8, 52);
    capeGfx.lineTo(-backDir * 14, 42);
    capeGfx.closePath();
    capeGfx.fillPath();

    capeGfx.fillStyle(primaryCol, 0.95);
    capeGfx.beginPath();
    capeGfx.moveTo(backDir * 8, -16);
    capeGfx.lineTo(backDir * 44, 40);
    capeGfx.lineTo(backDir * 6, 46);
    capeGfx.lineTo(-backDir * 10, 38);
    capeGfx.closePath();
    capeGfx.fillPath();

    capeGfx.lineStyle(3, trimCol, 0.95);
    capeGfx.strokePath();

    capeGfx.fillStyle(trimCol, 1);
    capeGfx.fillRoundedRect(-20, -20, 40, 8, 4);
    this.root.add(capeGfx);

    this.scene.tweens.add({
      targets: capeGfx,
      angle: backDir * 4,
      duration: 750,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
  }

  applyAccessoryVisuals() {
    const accId = this.cosmetic?.accessory || "none";
    if (!accId || accId === "none") return;

    const headTopY = this.charId === "kelinci_cici" ? -68 : -58;
    const eyeY = -36;
    const accGfx = this.scene.add.graphics();

    if (accId === "crown") {
      accGfx.fillStyle(0xfacc15, 1);
      accGfx.lineStyle(2.5, 0x92400e, 1);
      accGfx.beginPath();
      accGfx.moveTo(-20, headTopY + 10);
      accGfx.lineTo(-24, headTopY - 12);
      accGfx.lineTo(-10, headTopY);
      accGfx.lineTo(0, headTopY - 18);
      accGfx.lineTo(10, headTopY);
      accGfx.lineTo(24, headTopY - 12);
      accGfx.lineTo(20, headTopY + 10);
      accGfx.closePath();
      accGfx.fillPath();
      accGfx.strokePath();

      accGfx.fillStyle(0xef4444, 1);
      accGfx.fillCircle(0, headTopY + 2, 4);
      accGfx.fillStyle(0x38bdf8, 1);
      accGfx.fillCircle(-12, headTopY + 3, 3);
      accGfx.fillCircle(12, headTopY + 3, 3);
    } else if (accId === "wizard_hat") {
      accGfx.fillStyle(0x6d28d9, 1);
      accGfx.lineStyle(2.5, 0x3b0764, 1);
      accGfx.fillEllipse(0, headTopY + 8, 60, 14);
      accGfx.strokeEllipse(0, headTopY + 8, 60, 14);

      accGfx.beginPath();
      accGfx.moveTo(-20, headTopY + 6);
      accGfx.lineTo(4, headTopY - 34);
      accGfx.lineTo(20, headTopY + 6);
      accGfx.closePath();
      accGfx.fillPath();
      accGfx.strokePath();

      accGfx.fillStyle(0xfacc15, 1);
      accGfx.fillRect(-19, headTopY - 1, 38, 6);
      accGfx.fillCircle(2, headTopY - 16, 4);
    } else if (accId === "visor") {
      accGfx.fillStyle(0x06b6d4, 0.85);
      accGfx.lineStyle(2.5, 0x0f172a, 1);
      accGfx.fillRoundedRect(-24, eyeY - 7, 48, 14, 6);
      accGfx.strokeRoundedRect(-24, eyeY - 7, 48, 14, 6);
      accGfx.fillStyle(0xffffff, 0.7);
      accGfx.fillRoundedRect(-18, eyeY - 4, 16, 4, 2);
    } else {

      accGfx.fillStyle(0xfacc15, 1);
      accGfx.lineStyle(2, 0x92400e, 1);
      accGfx.fillCircle(0, headTopY, 11);
      accGfx.strokeCircle(0, headTopY, 11);
    }

    this.root.add(accGfx);
  }

  playAnim(state) {
    const key = `${this.charId}_${state}`;
    if (this.scene.anims.exists(key)) {
      this.sprite.play(key, true);
    }
  }

  setTurnActive(active) {
    this.turnAura.setVisible(Boolean(active));
  }

  spawnFootDust(x, y) {
    if (!this.scene.textures.exists("dust_puff")) return;
    for (let i = 0; i < 4; i++) {
      const p = this.scene.add
        .image(x + (Math.random() - 0.5) * 28, y + 58, "dust_puff")
        .setDepth(6)
        .setAlpha(0.7);
      this.scene.tweens.add({
        targets: p,
        x: p.x - this.dir * (18 + Math.random() * 20),
        y: p.y - 10 - Math.random() * 14,
        alpha: 0,
        scale: 1.3,
        duration: 260,
        onComplete: () => p.destroy(),
      });
    }
  }

  playAttackPose(isSpecial, onStrikePeak, onFinished) {
    this.isBusy = true;
    this.isAttacking = true;
    this.playAnim("run");

    this.scene.tweens.killTweensOf(this.root);
    this.scene.tweens.killTweensOf(this.shadow);
    this.root.setPosition(this.baseX, this.baseY);
    this.shadow.setPosition(this.baseX, this.baseY + 66);
    this.root.setAngle(0);

    const windUpX = this.baseX - this.dir * 24;
    const lungeX = this.baseX + this.dir * (isSpecial ? 210 : 150);

    this.spawnFootDust(this.baseX, this.baseY);

    this.scene.tweens.add({
      targets: [this.root, this.shadow, this.turnAura],
      x: windUpX,
      duration: 110,
      ease: "Sine.easeOut",
      onComplete: () => {
        this.playAnim("attack");
        this.spawnFootDust(windUpX, this.baseY);
        this.scene.tweens.add({
          targets: [this.root, this.shadow, this.turnAura],
          x: lungeX,
          duration: isSpecial ? 195 : 160,
          ease: "Cubic.easeOut",
          onComplete: () => {
            this.spawnFootDust(lungeX, this.baseY);
            if (onStrikePeak)
              onStrikePeak(lungeX + this.dir * 42, this.baseY - 4);

            this.scene.tweens.add({
              targets: [this.root, this.shadow, this.turnAura],
              x: this.baseX,
              duration: 210,
              delay: 95,
              ease: "Power2",
              onComplete: () => {
                this.playAnim("idle");
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

  playHitPose(onFinished) {
    this.playAnim("hurt");
    this.sprite.setTintFill(0xffffff);
    this.scene.time.delayedCall(95, () => {
      if (this.sprite && this.sprite.active) this.sprite.clearTint();
    });

    if (this.isAttacking) {
      this.scene.time.delayedCall(220, () => {
        if (!this.isAttacking) this.playAnim("idle");
        if (onFinished) onFinished();
      });
      return;
    }

    this.isBusy = true;
    const knockX = this.baseX - this.dir * 40;
    this.spawnFootDust(this.root.x, this.baseY);

    this.scene.tweens.add({
      targets: [this.root, this.shadow, this.turnAura],
      x: knockX,
      duration: 95,
      ease: "Power2",
      onComplete: () => {
        this.scene.tweens.add({
          targets: this.root,
          angle: -this.dir * 14,
          duration: 75,
          yoyo: true,
          onComplete: () => {
            this.scene.tweens.add({
              targets: [this.root, this.shadow, this.turnAura],
              x: this.baseX,
              duration: 165,
              ease: "Back.easeOut",
              onComplete: () => {
                this.root.setAngle(0);
                this.playAnim("idle");
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
    this.scene.tweens.add({
      targets: this.root,
      x: this.baseX - this.dir * 12,
      duration: 85,
      yoyo: true,
      repeat: 1,
      onComplete: () => {
        if (onFinished) onFinished();
      },
    });
  }

  playVictoryPose() {
    this.playAnim("victory");
    this.scene.tweens.add({
      targets: this.root,
      y: this.baseY - 22,
      duration: 280,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeOut",
    });
  }

  playDefeatPose() {
    this.playAnim("hurt");
    this.scene.tweens.add({
      targets: this.root,
      angle: -this.dir * 22,
      alpha: 0.72,
      duration: 320,
      ease: "Quad.easeOut",
    });
  }

  static renderPreviewDataURL(
    charId = "kiko",
    _role = "student",
    cosmetic = null,
  ) {
    const basePortrait = characterAssetManager.getPortraitCanvas(charId);
    if (
      !cosmetic ||
      ((!cosmetic.costume || cosmetic.costume === "default") &&
        (!cosmetic.accessory || cosmetic.accessory === "none"))
    ) {
      return characterAssetManager.getPortraitDataURL(charId);
    }

    const canvas = document.createElement("canvas");
    canvas.width = basePortrait.width;
    canvas.height = basePortrait.height;
    const ctx = canvas.getContext("2d");

    if (cosmetic.costume && cosmetic.costume !== "default") {
      const cfg = BATTLE_COSTUMES.find((c) => c.id === cosmetic.costume);
      const primary = cfg?.armorTop || "#f59e0b";
      const dark = cfg?.armorBot || "#b45309";
      const trim = cfg?.trim || "#fef08a";

      ctx.save();
      ctx.fillStyle = primary;
      ctx.globalAlpha = 0.28;
      ctx.beginPath();
      ctx.ellipse(
        canvas.width / 2,
        canvas.height - 26,
        118,
        28,
        0,
        0,
        Math.PI * 2,
      );
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.lineWidth = 6;
      ctx.strokeStyle = trim;
      ctx.stroke();

      ctx.fillStyle = dark;
      ctx.beginPath();
      ctx.moveTo(canvas.width * 0.34, canvas.height * 0.45);
      ctx.lineTo(canvas.width * 0.14, canvas.height * 0.84);
      ctx.lineTo(canvas.width * 0.86, canvas.height * 0.84);
      ctx.lineTo(canvas.width * 0.66, canvas.height * 0.45);
      ctx.closePath();
      ctx.fill();
      ctx.lineWidth = 6;
      ctx.strokeStyle = trim;
      ctx.stroke();
      ctx.restore();
    }

    ctx.drawImage(basePortrait, 0, 0);

    if (cosmetic.accessory && cosmetic.accessory !== "none") {
      ctx.save();
      const cx = canvas.width / 2;
      if (cosmetic.accessory === "crown") {
        const cy = 62;
        ctx.fillStyle = "#facc15";
        ctx.strokeStyle = "#92400e";
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(cx - 46, cy + 20);
        ctx.lineTo(cx - 56, cy - 28);
        ctx.lineTo(cx - 22, cy - 4);
        ctx.lineTo(cx, cy - 40);
        ctx.lineTo(cx + 22, cy - 4);
        ctx.lineTo(cx + 56, cy - 28);
        ctx.lineTo(cx + 46, cy + 20);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else if (cosmetic.accessory === "wizard_hat") {
        const cy = 68;
        ctx.fillStyle = "#6d28d9";
        ctx.strokeStyle = "#3b0764";
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.ellipse(cx, cy + 16, 86, 18, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(cx - 46, cy + 12);
        ctx.lineTo(cx + 8, cy - 62);
        ctx.lineTo(cx + 46, cy + 12);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else if (cosmetic.accessory === "visor") {
        const cy = 152;
        ctx.fillStyle = "rgba(6, 182, 212, 0.85)";
        ctx.strokeStyle = "#0f172a";
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.roundRect(cx - 64, cy - 16, 128, 34, 14);
        ctx.fill();
        ctx.stroke();
      }
      ctx.restore();
    }

    return canvas.toDataURL("image/png");
  }
}
