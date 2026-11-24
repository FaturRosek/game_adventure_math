import Phaser from "phaser";

export class TopDownExplorerController {
  constructor(scene, player, options = {}) {
    this.controllerName = "TopDownExplorerController (8-Arah, 0 Gravitasi)";
    this.scene = scene;
    this.player = player;
    this.charId = options.charId || "kiko";
    this.walkSpeed = options.walkSpeed || 245;
    this.sprintSpeed = options.sprintSpeed || 340;
    this.interactRadius = options.interactRadius || 96;

    this.facingX = 1;
    this.dustTimer = 0;
    this.nearestTarget = null;

    if (this.player.body) {
      this.player.body.setAllowGravity(false);
    }
  }

  findNearestInteractive(interactives = []) {
    let best = null;
    let bestDist = this.interactRadius;
    for (const item of interactives) {
      if (!item || !item.active || item.getData("disabled")) continue;
      const dist = Phaser.Math.Distance.Between(
        this.player.x,
        this.player.y,
        item.x,
        item.y,
      );
      if (dist < bestDist) {
        bestDist = dist;
        best = item;
      }
    }
    this.nearestTarget = best;
    return best;
  }

  spawnStepDust() {
    if (!this.scene.textures.exists("dust_puff")) return;
    const puff = this.scene.add.image(
      this.player.x + (Math.random() - 0.5) * 14,
      this.player.y + 30,
      "dust_puff",
    );
    puff.setDepth(Math.max(1, this.player.depth - 2));
    puff.setAlpha(0.65);
    puff.setScale(0.5);
    this.scene.tweens.add({
      targets: puff,
      alpha: 0,
      scale: 1.05,
      y: puff.y - 8,
      duration: 240,
      onComplete: () => puff.destroy(),
    });
  }

  update(delta, input, interactives = []) {
    const dx = (input.right ? 1 : 0) - (input.left ? 1 : 0);
    const dy = (input.down ? 1 : 0) - (input.up ? 1 : 0);
    const isSprinting = Boolean(input.sprint);
    const speed = isSprinting ? this.sprintSpeed : this.walkSpeed;

    let vx = dx;
    let vy = dy;
    if (vx !== 0 && vy !== 0) {
      const norm = Math.SQRT1_2;
      vx *= norm;
      vy *= norm;
    }

    this.player.setVelocity(vx * speed, vy * speed);

    if (dx !== 0) {
      this.facingX = dx;
      this.player.setFlipX(this.facingX < 0);
    }

    this.player.setDepth(Math.round(this.player.y));

    const isMoving = vx !== 0 || vy !== 0;
    if (isMoving) {
      this.dustTimer -= delta;
      if (this.dustTimer <= 0) {
        this.spawnStepDust();
        this.dustTimer = isSprinting ? 130 : 210;
      }
    }

    const animState = isMoving ? (isSprinting ? "run" : "walk") : "idle";
    const animKey = `${this.charId}_${animState}`;
    if (
      this.scene.anims.exists(animKey) &&
      this.player.anims.currentAnim?.key !== animKey
    ) {
      this.player.play(animKey, true);
    }

    const nearest = this.findNearestInteractive(interactives);
    if (input.interact && nearest && typeof input.onInteract === "function") {
      input.onInteract(nearest);
    }
    return nearest;
  }
}
