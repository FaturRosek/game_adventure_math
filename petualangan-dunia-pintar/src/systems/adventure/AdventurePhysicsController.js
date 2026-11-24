export class AdventurePhysicsController {
  constructor(scene, player, options = {}) {
    this.scene = scene;
    this.player = player;
    this.charId = options.charId || "kiko";
    this.baseScale = options.baseScale || 0.84;

    this.maxSpeed = options.maxSpeed || 295;
    this.groundAccel = 2200;
    this.groundDecel = 2400;
    this.airAccel = 1450;
    this.airDecel = 650;
    this.jumpVelocity = options.jumpVelocity || -610;
    this.jumpCutMultiplier = 0.48;

    this.coyoteDuration = 115;
    this.jumpBufferDuration = 120;
    this.coyoteTimer = 0;
    this.jumpBufferTimer = 0;
    this.wasGrounded = false;
    this.prevJumpHeld = false;

    this.dashSpeed = 590;
    this.dashDuration = 175;
    this.dashCooldown = 780;
    this.dashTimer = 0;
    this.dashCooldownTimer = 0;
    this.dashDir = 1;
    this.ghostTimer = 0;

    this.combatConfig = {
      enableCombo: Boolean(options.combatConfig?.enableCombo),
      enableJumpAttack: options.combatConfig?.enableJumpAttack !== false,
      enableSpecialSkill: Boolean(options.combatConfig?.enableSpecialSkill),
    };

    this.attackCooldown = 320;
    this.attackDuration = 220;
    this.attackCooldownTimer = 0;
    this.attackTimer = 0;
    this.comboStep = 0;
    this.comboWindowTimer = 0;
    this.comboWindowDuration = 700;

    this.specialCooldown = 900;
    this.specialCooldownTimer = 0;

    const eCfg = options.energyConfig || {};
    this.energyEnabled = Boolean(eCfg.enabled);
    this.maxEnergy = Number(eCfg.max) || 100;
    this.energy = this.energyEnabled
      ? Math.min(this.maxEnergy, Number(eCfg.initial) || 0)
      : 0;
    this.energyRegenPerSec = Number(eCfg.regenPerSec) || 0;
    this.specialEnergyCost = Number(eCfg.specialCost) || 50;
    this._lastBroadcastEnergy = Math.floor(this.energy);

    this.maxHearts = options.maxHearts || 4;
    this.hearts = this.maxHearts;
    this.invincibleTimer = 0;
    this.hurtTimer = 0;
    this.facing = 1;
    this.dustTimer = 0;

    this.onHeartsChanged = options.onHeartsChanged || null;
    this.onEnergyChanged = options.onEnergyChanged || null;
    this.onRespawnNeeded = options.onRespawnNeeded || null;
    this.onAttackFired = options.onAttackFired || null;
    this.onSpecialSkillFired = options.onSpecialSkillFired || null;
  }

  getStateSnapshot() {
    return {
      hearts: this.hearts,
      maxHearts: this.maxHearts,
      energyEnabled: this.energyEnabled,
      energy: Math.floor(this.energy),
      maxEnergy: this.maxEnergy,
      comboStep: this.comboStep,
      facing: this.facing,
      isDashing: this.dashTimer > 0,
      isAttacking: this.attackTimer > 0,
      isInvincible: this.invincibleTimer > 0,
    };
  }

  gainEnergy(amount = 0) {
    if (!this.energyEnabled || amount <= 0) return;
    this.energy = Math.min(this.maxEnergy, this.energy + amount);
    this._emitEnergyIfChanged(true);
  }

  spendEnergy(cost) {
    if (!this.energyEnabled) return false;
    if (this.energy < cost) return false;
    this.energy = Math.max(0, this.energy - cost);
    this._emitEnergyIfChanged(true);
    return true;
  }

  _emitEnergyIfChanged(force = false) {
    if (!this.energyEnabled || !this.onEnergyChanged) return;
    const floored = Math.floor(this.energy);
    if (force || floored !== this._lastBroadcastEnergy) {
      this._lastBroadcastEnergy = floored;
      this.onEnergyChanged(floored, this.maxEnergy);
    }
  }

  heal(amount = 1) {
    const before = this.hearts;
    this.hearts = Math.min(this.maxHearts, this.hearts + amount);
    if (this.hearts !== before && this.onHeartsChanged) {
      this.onHeartsChanged(this.hearts, this.maxHearts);
    }
    return this.hearts > before;
  }

  applyDamage(sourceX, amount = 1) {
    if (this.invincibleTimer > 0 || this.hearts <= 0) return false;

    this.hearts = Math.max(0, this.hearts - amount);
    this.invincibleTimer = 1250;
    this.hurtTimer = 280;
    this.dashTimer = 0;
    this.comboStep = 0;

    const pushDir = this.player.x < sourceX ? -1 : 1;
    this.player.setVelocity(pushDir * 240, -340);

    if (this.scene.cameras?.main) {
      this.scene.cameras.main.shake(150, 0.007);
    }

    if (this.onHeartsChanged) {
      this.onHeartsChanged(this.hearts, this.maxHearts);
    }

    if (this.hearts <= 0 && this.onRespawnNeeded) {
      this.scene.time.delayedCall(380, () => {
        this.hearts = this.maxHearts;
        this.invincibleTimer = 1400;
        if (this.onHeartsChanged) {
          this.onHeartsChanged(this.hearts, this.maxHearts);
        }
        this.onRespawnNeeded();
      });
    }

    return true;
  }

  triggerBounce(bounceVelocity = -790) {
    this.player.setVelocityY(bounceVelocity);
    this.coyoteTimer = 0;
    this.jumpBufferTimer = 0;
    this.playStretchTween(0.84, 1.2, 120);
    this.spawnDustBurst(this.player.x, this.player.body.bottom, 6);
  }

  playStretchTween(scaleXMult, scaleYMult, duration = 95) {
    this.scene.tweens.add({
      targets: this.player,
      scaleX: this.baseScale * scaleXMult,
      scaleY: this.baseScale * scaleYMult,
      duration,
      yoyo: true,
      ease: "Quad.easeOut",
    });
  }

  spawnDustBurst(x, y, count = 3) {
    if (!this.scene.textures.exists("dust_puff")) return;
    for (let i = 0; i < count; i++) {
      const puff = this.scene.add.image(
        x + (Math.random() - 0.5) * 18,
        y - 4,
        "dust_puff",
      );
      puff.setDepth(5);
      puff.setAlpha(0.75);
      puff.setScale(0.55 + Math.random() * 0.4);
      this.scene.tweens.add({
        targets: puff,
        x: puff.x + (Math.random() - 0.5) * 26,
        y: puff.y - 12 - Math.random() * 12,
        alpha: 0,
        scale: 1.25,
        duration: 280 + Math.random() * 140,
        onComplete: () => puff.destroy(),
      });
    }
  }

  spawnDashGhost() {
    const ghost = this.scene.add.sprite(
      this.player.x,
      this.player.y,
      this.player.texture.key,
      this.player.frame.name,
    );
    ghost.setScale(this.player.scaleX, this.player.scaleY);
    ghost.setFlipX(this.player.flipX);
    ghost.setTint(0x38bdf8);
    ghost.setAlpha(0.45);
    ghost.setDepth(this.player.depth - 1);
    this.scene.tweens.add({
      targets: ghost,
      alpha: 0,
      duration: 180,
      onComplete: () => ghost.destroy(),
    });
  }

  update(delta, input) {
    const dt = Math.min(delta, 40) / 1000;
    const body = this.player.body;
    const isGrounded = body.blocked.down || body.touching.down;

    if (this.invincibleTimer > 0) {
      this.invincibleTimer = Math.max(0, this.invincibleTimer - delta);
      this.player.setAlpha(
        Math.floor(this.invincibleTimer / 85) % 2 === 0 ? 0.45 : 1,
      );
      if (this.invincibleTimer === 0) this.player.setAlpha(1);
    }

    if (this.hurtTimer > 0)
      this.hurtTimer = Math.max(0, this.hurtTimer - delta);
    if (this.dashCooldownTimer > 0)
      this.dashCooldownTimer = Math.max(0, this.dashCooldownTimer - delta);
    if (this.attackCooldownTimer > 0)
      this.attackCooldownTimer = Math.max(0, this.attackCooldownTimer - delta);
    if (this.attackTimer > 0)
      this.attackTimer = Math.max(0, this.attackTimer - delta);
    if (this.specialCooldownTimer > 0)
      this.specialCooldownTimer = Math.max(
        0,
        this.specialCooldownTimer - delta,
      );

    if (this.comboWindowTimer > 0) {
      this.comboWindowTimer = Math.max(0, this.comboWindowTimer - delta);
      if (this.comboWindowTimer === 0) this.comboStep = 0;
    }

    if (
      this.energyEnabled &&
      this.energyRegenPerSec > 0 &&
      this.energy < this.maxEnergy
    ) {
      this.energy = Math.min(
        this.maxEnergy,
        this.energy + this.energyRegenPerSec * dt,
      );
      this._emitEnergyIfChanged(false);
    }

    if (isGrounded) {
      this.coyoteTimer = this.coyoteDuration;
      if (!this.wasGrounded && body.velocity.y >= 0) {
        this.playStretchTween(1.14, 0.86, 85);
        this.spawnDustBurst(this.player.x, body.bottom, 4);
      }
    } else {
      this.coyoteTimer = Math.max(0, this.coyoteTimer - delta);
    }
    this.wasGrounded = isGrounded;

    const jumpJustPressed = input.jump && !this.prevJumpHeld;
    const jumpJustReleased = !input.jump && this.prevJumpHeld;
    this.prevJumpHeld = input.jump;

    if (jumpJustPressed) {
      this.jumpBufferTimer = this.jumpBufferDuration;
    } else {
      this.jumpBufferTimer = Math.max(0, this.jumpBufferTimer - delta);
    }

    const moveDir = (input.right ? 1 : 0) - (input.left ? 1 : 0);
    if (moveDir !== 0 && this.hurtTimer <= 0) {
      this.facing = moveDir;
      this.player.setFlipX(this.facing < 0);
    }

    if (
      input.dash &&
      this.dashCooldownTimer <= 0 &&
      this.dashTimer <= 0 &&
      this.hurtTimer <= 0
    ) {
      this.dashTimer = this.dashDuration;
      this.dashCooldownTimer = this.dashCooldown;
      this.dashDir = moveDir !== 0 ? moveDir : this.facing;
      this.facing = this.dashDir;
      this.player.setFlipX(this.facing < 0);
      this.ghostTimer = 0;
      this.spawnDustBurst(this.player.x, body.bottom, 5);
    }

    if (
      input.specialSkill &&
      this.combatConfig.enableSpecialSkill &&
      this.specialCooldownTimer <= 0 &&
      this.hurtTimer <= 0
    ) {
      if (this.spendEnergy(this.specialEnergyCost)) {
        this.attackTimer = 280;
        this.specialCooldownTimer = this.specialCooldown;
        this.playStretchTween(1.18, 0.9, 110);
        if (this.onSpecialSkillFired) {
          this.onSpecialSkillFired(
            this.player.x + this.facing * 48,
            this.player.y - 4,
            this.facing,
          );
        }
      } else if (input.onNotEnoughEnergy) {
        input.onNotEnoughEnergy();
      }
    }

    if (input.attack && this.attackCooldownTimer <= 0 && this.hurtTimer <= 0) {
      const isJumpAttack = !isGrounded && this.combatConfig.enableJumpAttack;
      if (this.combatConfig.enableCombo && isGrounded) {
        this.comboStep = (this.comboStep % 3) + 1;
        this.comboWindowTimer = this.comboWindowDuration;
      } else {
        this.comboStep = 1;
      }

      this.attackTimer = this.attackDuration;
      this.attackCooldownTimer =
        this.comboStep === 3 ? 420 : this.attackCooldown;

      if (this.onAttackFired) {
        this.onAttackFired(
          this.player.x + this.facing * 42,
          this.player.y - 4,
          this.facing,
          {
            comboStep: this.comboStep,
            isJumpAttack,
            power: this.comboStep === 3 ? 2 : 1,
          },
        );
      }
    }

    if (this.dashTimer > 0) {
      this.dashTimer = Math.max(0, this.dashTimer - delta);
      this.player.setVelocity(this.dashDir * this.dashSpeed, 0);
      this.ghostTimer -= delta;
      if (this.ghostTimer <= 0) {
        this.spawnDashGhost();
        this.ghostTimer = 42;
      }
    } else if (this.hurtTimer <= 0) {
      const accel = isGrounded ? this.groundAccel : this.airAccel;
      const decel = isGrounded ? this.groundDecel : this.airDecel;
      let vx = body.velocity.x;

      if (moveDir !== 0) {
        const targetVx = moveDir * this.maxSpeed;
        if (vx < targetVx) vx = Math.min(targetVx, vx + accel * dt);
        else if (vx > targetVx) vx = Math.max(targetVx, vx - accel * dt);
      } else {
        if (vx > 0) vx = Math.max(0, vx - decel * dt);
        else if (vx < 0) vx = Math.min(0, vx + decel * dt);
      }

      this.player.setVelocityX(vx);
    }

    if (
      this.jumpBufferTimer > 0 &&
      this.coyoteTimer > 0 &&
      this.hurtTimer <= 0
    ) {
      this.player.setVelocityY(this.jumpVelocity);
      this.jumpBufferTimer = 0;
      this.coyoteTimer = 0;
      this.dashTimer = 0;
      this.playStretchTween(0.88, 1.14, 105);
      this.spawnDustBurst(this.player.x, body.bottom, 4);
      if (input.onJumpSound) input.onJumpSound();
    }

    if (jumpJustReleased && body.velocity.y < -160) {
      this.player.setVelocityY(body.velocity.y * this.jumpCutMultiplier);
    }

    if (isGrounded && Math.abs(body.velocity.x) > 150) {
      this.dustTimer -= delta;
      if (this.dustTimer <= 0) {
        this.spawnDustBurst(this.player.x - this.facing * 14, body.bottom, 1);
        this.dustTimer = 170;
      }
    }

    this.updateAnimation(
      isGrounded,
      Math.abs(body.velocity.x),
      body.velocity.y,
    );
  }

  updateAnimation(isGrounded, absVx, vy) {
    let state = "idle";
    if (this.hurtTimer > 0) {
      state = "hurt";
    } else if (this.attackTimer > 0) {
      state = "attack";
    } else if (!isGrounded) {
      state = vy < 0 ? "jump" : "fall";
    } else if (absVx > 190 || this.dashTimer > 0) {
      state = "run";
    } else if (absVx > 20) {
      state = "walk";
    }

    const animKey = `${this.charId}_${state}`;
    if (
      this.scene.anims.exists(animKey) &&
      this.player.anims.currentAnim?.key !== animKey
    ) {
      this.player.play(animKey, true);
    }
  }
}
