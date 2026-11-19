export function runMiniGameExploreHunt({
  container,
  activity,
  gradeKey,
  audio,
  onResult,
}) {
  const width = 940;
  const height = 400;
  const targetIcon = activity.targetIcon || "🍎";
  const targetCount = activity.targetCount || (gradeKey === "paud" ? 3 : 5);
  const distractors = activity.distractors || ["🪨", "🍂"];
  let collected = 0;
  let finished = false;
  let animId = null;
  let stepTick = 0;
  let jumpOffset = 0;

  container.innerHTML = `
    <div style="width:100%; height:100%; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:10px;">
      <div style="display:flex; align-items:center; gap:14px; flex-wrap:wrap; justify-content:center;">
        <span class="ec-pill" style="font-size:1.05rem;">🎯 Terkumpul: <span id="eh-count" style="color:#00b894;">0</span> / ${targetCount} ${targetIcon}</span>
      </div>
      <canvas id="eh-canvas" width="${width}" height="${height}" style="border:5px solid #ffffff; border-radius:24px; box-shadow:0 10px 24px rgba(0,0,0,0.16); width:96%; max-width:960px; max-height:52vh; object-fit:contain;"></canvas>
      <div style="display:flex; gap:14px; align-items:center;">
        <button id="eh-left" class="ec-btn-3d ec-btn-blue" style="min-width:74px; font-size:1.3rem;">◀</button>
        <button id="eh-up" class="ec-btn-3d ec-btn-blue" style="min-width:74px; font-size:1.3rem;">▲</button>
        <button id="eh-down" class="ec-btn-3d ec-btn-blue" style="min-width:74px; font-size:1.3rem;">▼</button>
        <button id="eh-right" class="ec-btn-3d ec-btn-blue" style="min-width:74px; font-size:1.3rem;">▶</button>
      </div>
    </div>
  `;

  const canvas = document.getElementById("eh-canvas");
  const ctx = canvas.getContext("2d");
  const countEl = document.getElementById("eh-count");

  const player = {
    x: 85,
    y: height / 2,
    speed: gradeKey === "paud" ? 4.0 : 4.6,
    facing: 1,
  };
  const keys = { left: false, right: false, up: false, down: false };
  const sparks = [];

  const items = [];
  for (let i = 0; i < targetCount; i++) {
    items.push({
      x: 185 + Math.random() * (width - 245),
      y: 55 + Math.random() * (height - 110),
      icon: targetIcon,
      isTarget: true,
      taken: false,
      phase: Math.random() * Math.PI * 2,
    });
  }
  const distTotal = gradeKey === "paud" ? 2 : 4;
  for (let i = 0; i < distTotal; i++) {
    items.push({
      x: 185 + Math.random() * (width - 245),
      y: 55 + Math.random() * (height - 110),
      icon: distractors[i % distractors.length],
      isTarget: false,
      taken: false,
      phase: Math.random() * Math.PI * 2,
    });
  }

  const keyDown = (e) => {
    const k = e.key.toLowerCase();
    if (k === "arrowleft" || k === "a") keys.left = true;
    if (k === "arrowright" || k === "d") keys.right = true;
    if (k === "arrowup" || k === "w") keys.up = true;
    if (k === "arrowdown" || k === "s") keys.down = true;
  };
  const keyUp = (e) => {
    const k = e.key.toLowerCase();
    if (k === "arrowleft" || k === "a") keys.left = false;
    if (k === "arrowright" || k === "d") keys.right = false;
    if (k === "arrowup" || k === "w") keys.up = false;
    if (k === "arrowdown" || k === "s") keys.down = false;
  };

  window.addEventListener("keydown", keyDown);
  window.addEventListener("keyup", keyUp);

  const bindBtn = (id, prop) => {
    const el = document.getElementById(id);
    if (!el) return;
    const on = (e) => {
      e.preventDefault();
      keys[prop] = true;
    };
    const off = (e) => {
      e.preventDefault();
      keys[prop] = false;
    };
    el.addEventListener("mousedown", on);
    el.addEventListener("touchstart", on);
    el.addEventListener("mouseup", off);
    el.addEventListener("mouseleave", off);
    el.addEventListener("touchend", off);
  };
  bindBtn("eh-left", "left");
  bindBtn("eh-right", "right");
  bindBtn("eh-up", "up");
  bindBtn("eh-down", "down");

  const cleanup = () => {
    finished = true;
    if (animId) cancelAnimationFrame(animId);
    window.removeEventListener("keydown", keyDown);
    window.removeEventListener("keyup", keyUp);
  };

  const draw3DMascot = (px, py, walking, facing) => {
    const bob = walking
      ? Math.abs(Math.sin(stepTick * 0.25)) * 7
      : Math.sin(stepTick * 0.08) * 3;
    const legSwing = walking ? Math.sin(stepTick * 0.28) * 8 : 0;

    ctx.save();
    ctx.translate(px, py - bob - jumpOffset);

    ctx.fillStyle = "rgba(0,0,0,0.22)";
    ctx.beginPath();
    ctx.ellipse(0, 32 + bob + jumpOffset, 28, 9, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.scale(facing, 1);

    ctx.fillStyle = "#8d5524";
    ctx.strokeStyle = "#2c3e50";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(-14 + legSwing, 16, 12, 16, 6);
    ctx.roundRect(4 - legSwing, 16, 12, 16, 6);
    ctx.fill();
    ctx.stroke();

    const bodyGrad = ctx.createLinearGradient(0, -4, 0, 24);
    bodyGrad.addColorStop(0, "#54a0ff");
    bodyGrad.addColorStop(1, "#2e86de");
    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.roundRect(-20, -4, 40, 26, 12);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#e67e22";
    ctx.beginPath();
    ctx.arc(-14, -26, 10, 0, Math.PI * 2);
    ctx.arc(14, -26, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    const headGrad = ctx.createRadialGradient(-8, -22, 4, 0, -14, 28);
    headGrad.addColorStop(0, "#feca57");
    headGrad.addColorStop(1, "#e67e22");
    ctx.fillStyle = headGrad;
    ctx.beginPath();
    ctx.roundRect(-24, -30, 48, 36, 18);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#2c3e50";
    ctx.beginPath();
    ctx.arc(-5, -14, 4, 0, Math.PI * 2);
    ctx.arc(11, -14, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(-3.5, -15.5, 1.5, 0, Math.PI * 2);
    ctx.arc(12.5, -15.5, 1.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#ff9ff3";
    ctx.beginPath();
    ctx.arc(-11, -8, 4, 0, Math.PI * 2);
    ctx.arc(16, -8, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  };

  const loop = () => {
    if (finished) return;
    stepTick += 1;
    if (jumpOffset > 0) jumpOffset = Math.max(0, jumpOffset - 1.6);

    let moving = false;
    if (keys.left) {
      player.x -= player.speed;
      player.facing = -1;
      moving = true;
    }
    if (keys.right) {
      player.x += player.speed;
      player.facing = 1;
      moving = true;
    }
    if (keys.up) {
      player.y -= player.speed;
      moving = true;
    }
    if (keys.down) {
      player.y += player.speed;
      moving = true;
    }

    player.x = Math.max(40, Math.min(width - 40, player.x));
    player.y = Math.max(48, Math.min(height - 44, player.y));

    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, "#a8e6cf");
    bgGrad.addColorStop(1, "#55efc4");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = "rgba(255,255,255,0.22)";
    ctx.beginPath();
    ctx.ellipse(width / 2, height / 2, 340, 130, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.font = "38px Segoe UI Emoji, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    items.forEach((it) => {
      if (it.taken) return;
      const floatY = Math.sin(stepTick * 0.08 + it.phase) * 5;
      ctx.fillStyle = "rgba(0,0,0,0.16)";
      ctx.beginPath();
      ctx.ellipse(it.x, it.y + 22, 18, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillText(it.icon, it.x, it.y + floatY);

      const dist = Math.hypot(player.x - it.x, player.y - it.y);
      if (dist < 42) {
        if (it.isTarget) {
          it.taken = true;
          collected += 1;
          jumpOffset = 18;
          countEl.textContent = String(collected);
          audio.play("collect");
          for (let s = 0; s < 8; s++) {
            sparks.push({
              x: it.x,
              y: it.y,
              vx: (Math.random() - 0.5) * 6,
              vy: (Math.random() - 0.5) * 6,
              life: 22,
            });
          }
          if (collected >= targetCount) {
            cleanup();
            onResult(true, "Semua benda berhasil dikumpulkan!");
          }
        } else {
          player.x = Math.max(40, player.x - 28 * player.facing);
          audio.play("wrong");
        }
      }
    });

    draw3DMascot(player.x, player.y, moving, player.facing);

    for (let i = sparks.length - 1; i >= 0; i--) {
      const sp = sparks[i];
      sp.x += sp.vx;
      sp.y += sp.vy;
      sp.life -= 1;
      ctx.fillStyle = "#ffeaa7";
      ctx.beginPath();
      ctx.arc(sp.x, sp.y, 5, 0, Math.PI * 2);
      ctx.fill();
      if (sp.life <= 0) sparks.splice(i, 1);
    }

    animId = requestAnimationFrame(loop);
  };

  loop();
  return cleanup;
}
