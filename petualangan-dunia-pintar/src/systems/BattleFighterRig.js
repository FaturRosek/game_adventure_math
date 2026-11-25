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
      .ellipse(x, y + 64, 122, 34, role === "tutor" ? 0x38bdf8 : 0xfacc15, 0.25)
      .setDepth(3);
    this.turnAura.setStrokeStyle(
      3,
      role === "tutor" ? 0x7dd3fc : 0xfef08a,
      0.9,
    );
    this.turnAura.setVisible(false);

    this.root = scene.add.container(x, y).setDepth(8);

    const sheetKey = scene.textures.exists(`player_sheet_${this.charId}`)
      ? `player_sheet_${this.charId}`
      : `player_${this.charId}`;

    this.sprite = scene.add.sprite(0, 6, sheetKey).setScale(0.71);
    this.sprite.setFlipX(!facingRight);
    this.root.add(this.sprite);

    const costumeCfg = BATTLE_COSTUMES.find(
      (c) => c.id === this.cosmetic?.costume,
    );
    if (costumeCfg && costumeCfg.trim) {
      this.costumeRing = scene.add.ellipse(0, 60, 108, 26, 0xffffff, 0);
      this.costumeRing.setStrokeStyle(
        3,
        parseInt(costumeCfg.trim.replace("#", ""), 16),
        0.85,
      );
      this.root.addAt(this.costumeRing, 0);
    }

    if (this.cosmetic?.accessory && this.cosmetic.accessory !== "none") {
      const accIcon =
        this.cosmetic.accessory === "crown"
          ? "👑"
          : this.cosmetic.accessory === "wizard_hat"
            ? "🎩"
            : "🕶️";
      this.accBadge = scene.add
        .text(0, -68, accIcon, { fontSize: "26px" })
        .setOrigin(0.5);
      this.root.add(this.accBadge);
    }

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

  static renderPreviewDataURL(charId = "kiko") {
    return characterAssetManager.getPortraitDataURL(charId);
  }
}
