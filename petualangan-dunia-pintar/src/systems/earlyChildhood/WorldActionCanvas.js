function drawCartoonHero(
  ctx,
  x,
  y,
  facing,
  stepTick,
  jumpOffset,
  carryingIcon,
) {
  const bob = Math.abs(Math.sin(stepTick * 0.22)) * 6;
  const legSwing = Math.sin(stepTick * 0.25) * 7;

  ctx.save();
  ctx.translate(x, y - bob - jumpOffset);

  ctx.fillStyle = "rgba(0,0,0,0.22)";
  ctx.beginPath();
  ctx.ellipse(0, 34 + bob + jumpOffset, 28, 9, 0, 0, Math.PI * 2);
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

  if (carryingIcon) {
    ctx.scale(facing, 1);
    ctx.font = "32px Segoe UI Emoji, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(carryingIcon, 0, -52);
  }

  ctx.restore();
}

export function runWorldHarvestDeliver({
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
  const deliverMode = Boolean(activity.deliverZone);
  const deliverZone = activity.deliverZone || {
    icon: "🧺",
    label: "Keranjang",
  };
  const distractors = activity.distractors || ["🪨", "🍂"];

  let delivered = 0;
  let carrying = null;
  let finished = false;
  let animId = null;
  let tick = 0;
  let jumpOffset = 0;

  container.innerHTML = `
    <div style="width:100%; height:100%; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:8px;">
      <div style="display:flex; gap:12px; align-items:center; flex-wrap:wrap; justify-content:center;">
        <span class="ec-pill" style="font-size:1.05rem;">
          ${deliverMode ? `${deliverZone.icon} Terkirim:` : "🎯 Terkumpul:"}
          <strong id="wa-count" style="color:#00b894;">0</strong> / ${targetCount} ${targetIcon}
        </span>
        <span class="ec-pill" style="font-size:0.9rem; background:#fff9db;">
          👆 Klik di arena atau pakai Panah / WASD untuk bergerak!
        </span>
      </div>
      <canvas id="wa-canvas" width="${width}" height="${height}" style="border:5px solid #ffffff; border-radius:24px; box-shadow:0 10px 24px rgba(0,0,0,0.16); width:96%; max-width:960px; max-height:50vh; object-fit:contain; cursor:pointer;"></canvas>
      <div style="display:flex; gap:12px;">
        <button id="wa-l" class="ec-btn-3d ec-btn-blue" style="min-width:68px; font-size:1.25rem;">◀</button>
        <button id="wa-u" class="ec-btn-3d ec-btn-blue" style="min-width:68px; font-size:1.25rem;">▲</button>
        <button id="wa-d" class="ec-btn-3d ec-btn-blue" style="min-width:68px; font-size:1.25rem;">▼</button>
        <button id="wa-r" class="ec-btn-3d ec-btn-blue" style="min-width:68px; font-size:1.25rem;">▶</button>
      </div>
    </div>
  `;

  const canvas = document.getElementById("wa-canvas");
  const ctx = canvas.getContext("2d");
  const countEl = document.getElementById("wa-count");

  const player = {
    x: 110,
    y: height / 2,
    speed: gradeKey === "paud" ? 4.4 : 5.0,
    facing: 1,
    tx: null,
    ty: null,
  };
  const keys = { left: false, right: false, up: false, down: false };
  const sparks = [];
  const dropPoint = { x: width - 95, y: height / 2, r: 58 };

  const items = [];
  for (let i = 0; i < targetCount; i++) {
    items.push({
      x: 190 + Math.random() * (width - (deliverMode ? 360 : 250)),
      y: 65 + Math.random() * (height - 130),
      icon: targetIcon,
      isTarget: true,
      taken: false,
      phase: Math.random() * Math.PI * 2,
    });
  }
  const dTotal = gradeKey === "paud" ? 2 : 3;
  for (let i = 0; i < dTotal; i++) {
    items.push({
      x: 200 + Math.random() * (width - 360),
      y: 65 + Math.random() * (height - 130),
      icon: distractors[i % distractors.length],
      isTarget: false,
      taken: false,
      phase: Math.random() * Math.PI * 2,
    });
  }

  const setPointerTarget = (e) => {
    const rect = canvas.getBoundingClientRect();
    const cx = e.touches ? e.touches[0].clientX : e.clientX;
    const cy = e.touches ? e.touches[0].clientY : e.clientY;
    player.tx = ((cx - rect.left) / rect.width) * width;
    player.ty = ((cy - rect.top) / rect.height) * height;
  };
  canvas.addEventListener("mousedown", setPointerTarget);
  canvas.addEventListener("touchstart", (e) => {
    e.preventDefault();
    setPointerTarget(e);
  });

  const keyDown = (e) => {
    const k = e.key.toLowerCase();
    player.tx = null;
    player.ty = null;
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
      player.tx = null;
      player.ty = null;
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
  bindBtn("wa-l", "left");
  bindBtn("wa-r", "right");
  bindBtn("wa-u", "up");
  bindBtn("wa-d", "down");

  const cleanup = () => {
    finished = true;
    if (animId) cancelAnimationFrame(animId);
    window.removeEventListener("keydown", keyDown);
    window.removeEventListener("keyup", keyUp);
  };

  const spawnSparks = (x, y) => {
    for (let i = 0; i < 10; i++) {
      sparks.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 7,
        vy: (Math.random() - 0.5) * 7,
        life: 24,
      });
    }
  };

  const loop = () => {
    if (finished) return;
    tick += 1;
    if (jumpOffset > 0) jumpOffset = Math.max(0, jumpOffset - 1.5);

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

    if (player.tx !== null && player.ty !== null) {
      const dx = player.tx - player.x;
      const dy = player.ty - player.y;
      const dist = Math.hypot(dx, dy);
      if (dist > 8) {
        player.x += (dx / dist) * player.speed;
        player.y += (dy / dist) * player.speed;
        player.facing = dx >= 0 ? 1 : -1;
        moving = true;
      } else {
        player.tx = null;
        player.ty = null;
      }
    }

    player.x = Math.max(42, Math.min(width - 42, player.x));
    player.y = Math.max(52, Math.min(height - 44, player.y));

    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, activity.bgTop || "#a8e6cf");
    bgGrad.addColorStop(1, activity.bgBot || "#55efc4");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = "rgba(255,255,255,0.22)";
    ctx.beginPath();
    ctx.ellipse(width / 2, height / 2, 360, 140, 0, 0, Math.PI * 2);
    ctx.fill();

    if (deliverMode) {
      ctx.fillStyle = carrying
        ? "rgba(241, 196, 15, 0.35)"
        : "rgba(255, 255, 255, 0.45)";
      ctx.beginPath();
      ctx.arc(
        dropPoint.x,
        dropPoint.y,
        dropPoint.r + Math.sin(tick * 0.1) * 4,
        0,
        Math.PI * 2,
      );
      ctx.fill();
      ctx.lineWidth = 4;
      ctx.strokeStyle = carrying ? "#f39c12" : "#2c3e50";
      ctx.stroke();

      ctx.font = "46px Segoe UI Emoji, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(deliverZone.icon, dropPoint.x, dropPoint.y - 6);
      ctx.font = "bold 16px Segoe UI, sans-serif";
      ctx.fillStyle = "#2c3e50";
      ctx.fillText(deliverZone.label, dropPoint.x, dropPoint.y + 34);

      if (
        carrying &&
        Math.hypot(player.x - dropPoint.x, player.y - dropPoint.y) < 64
      ) {
        carrying = null;
        delivered += 1;
        jumpOffset = 20;
        countEl.textContent = String(delivered);
        audio.play("collect");
        spawnSparks(dropPoint.x, dropPoint.y);
        if (delivered >= targetCount) {
          cleanup();
          onResult(
            true,
            `Semua ${targetCount} ${targetIcon} berhasil diantarkan!`,
          );
          return;
        }
      }
    }

    ctx.font = "38px Segoe UI Emoji, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    items.forEach((it) => {
      if (it.taken) return;
      const fy = Math.sin(tick * 0.08 + it.phase) * 5;
      ctx.fillStyle = "rgba(0,0,0,0.16)";
      ctx.beginPath();
      ctx.ellipse(it.x, it.y + 22, 18, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillText(it.icon, it.x, it.y + fy);

      if (Math.hypot(player.x - it.x, player.y - it.y) < 42) {
        if (it.isTarget) {
          if (deliverMode) {
            if (!carrying) {
              it.taken = true;
              carrying = it.icon;
              jumpOffset = 14;
              audio.play("select");
              spawnSparks(it.x, it.y);
            }
          } else {
            it.taken = true;
            delivered += 1;
            jumpOffset = 18;
            countEl.textContent = String(delivered);
            audio.play("collect");
            spawnSparks(it.x, it.y);
            if (delivered >= targetCount) {
              cleanup();
              onResult(
                true,
                `Hebat! Semua ${targetCount} ${targetIcon} terkumpul!`,
              );
            }
          }
        } else {
          player.x = Math.max(42, player.x - 28 * player.facing);
          audio.play("wrong");
        }
      }
    });

    drawCartoonHero(
      ctx,
      player.x,
      player.y,
      player.facing,
      moving ? tick : tick * 0.3,
      jumpOffset,
      carrying,
    );

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

export function runWorldCatch({
  container,
  activity,
  gradeKey,
  audio,
  onResult,
}) {
  const width = 940;
  const height = 400;
  const targetLabel = activity.targetLabel || "A";
  const targetCount = activity.targetCount || (gradeKey === "paud" ? 3 : 5);
  const decoys = activity.decoys || ["B", "C", "M"];

  let caught = 0;
  let finished = false;
  let animId = null;
  let tick = 0;
  let jumpOffset = 0;

  container.innerHTML = `
    <div style="width:100%; height:100%; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:8px;">
      <span class="ec-pill" style="font-size:1.08rem;">
        🧺 Tangkap "${targetLabel}": <strong id="wc-count" style="color:#00b894;">0</strong> / ${targetCount}
      </span>
      <canvas id="wc-canvas" width="${width}" height="${height}" style="border:5px solid #ffffff; border-radius:24px; width:96%; max-width:960px; max-height:50vh; object-fit:contain; cursor:ew-resize;"></canvas>
      <div style="display:flex; gap:18px;">
        <button id="wc-l" class="ec-btn-3d ec-btn-blue" style="min-width:110px; font-size:1.25rem;">◀ Kiri</button>
        <button id="wc-r" class="ec-btn-3d ec-btn-blue" style="min-width:110px; font-size:1.25rem;">Kanan ▶</button>
      </div>
    </div>
  `;

  const canvas = document.getElementById("wc-canvas");
  const ctx = canvas.getContext("2d");
  const countEl = document.getElementById("wc-count");

  const player = { x: width / 2, y: height - 58, speed: 7, facing: 1 };
  const keys = { left: false, right: false };
  const drops = [];

  const spawnDrop = () => {
    const isTarget = Math.random() < 0.58;
    drops.push({
      x: 70 + Math.random() * (width - 140),
      y: -30,
      vy: (gradeKey === "paud" ? 2.2 : 3.0) + Math.random() * 1.1,
      label: isTarget
        ? targetLabel
        : decoys[Math.floor(Math.random() * decoys.length)],
      isTarget,
    });
  };

  const onMove = (e) => {
    const rect = canvas.getBoundingClientRect();
    const cx = e.touches ? e.touches[0].clientX : e.clientX;
    const nx = ((cx - rect.left) / rect.width) * width;
    player.facing = nx >= player.x ? 1 : -1;
    player.x = Math.max(50, Math.min(width - 50, nx));
  };
  canvas.addEventListener("mousemove", onMove);
  canvas.addEventListener("touchmove", (e) => {
    e.preventDefault();
    onMove(e);
  });

  const keyDown = (e) => {
    const k = e.key.toLowerCase();
    if (k === "arrowleft" || k === "a") keys.left = true;
    if (k === "arrowright" || k === "d") keys.right = true;
  };
  const keyUp = (e) => {
    const k = e.key.toLowerCase();
    if (k === "arrowleft" || k === "a") keys.left = false;
    if (k === "arrowright" || k === "d") keys.right = false;
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
  bindBtn("wc-l", "left");
  bindBtn("wc-r", "right");

  const cleanup = () => {
    finished = true;
    if (animId) cancelAnimationFrame(animId);
    window.removeEventListener("keydown", keyDown);
    window.removeEventListener("keyup", keyUp);
  };

  const loop = () => {
    if (finished) return;
    tick += 1;
    if (jumpOffset > 0) jumpOffset = Math.max(0, jumpOffset - 1.5);
    if (tick % 48 === 0) spawnDrop();

    if (keys.left) {
      player.x -= player.speed;
      player.facing = -1;
    }
    if (keys.right) {
      player.x += player.speed;
      player.facing = 1;
    }
    player.x = Math.max(50, Math.min(width - 50, player.x));

    const sky = ctx.createLinearGradient(0, 0, 0, height);
    sky.addColorStop(0, "#74b9ff");
    sky.addColorStop(1, "#dfe6e9");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = "#2ecc71";
    ctx.fillRect(0, height - 30, width, 30);

    for (let i = drops.length - 1; i >= 0; i--) {
      const d = drops[i];
      d.y += d.vy;

      ctx.beginPath();
      ctx.arc(d.x, d.y, 28, 0, Math.PI * 2);
      ctx.fillStyle = d.isTarget ? "#ffeaa7" : "#ffffff";
      ctx.fill();
      ctx.lineWidth = 4;
      ctx.strokeStyle = d.isTarget ? "#e67e22" : "#74b9ff";
      ctx.stroke();

      ctx.font = "bold 28px Segoe UI, sans-serif";
      ctx.fillStyle = "#2c3e50";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(d.label, d.x, d.y + 1);

      if (Math.hypot(player.x - d.x, player.y - d.y) < 52) {
        drops.splice(i, 1);
        if (d.isTarget) {
          caught += 1;
          jumpOffset = 18;
          countEl.textContent = String(caught);
          audio.play("collect");
          if (caught >= targetCount) {
            cleanup();
            onResult(
              true,
              `Hebat! Kamu menangkap ${targetCount} "${targetLabel}"!`,
            );
            return;
          }
        } else {
          audio.play("wrong");
        }
      } else if (d.y > height + 35) {
        drops.splice(i, 1);
      }
    }

    drawCartoonHero(
      ctx,
      player.x,
      player.y,
      player.facing,
      tick * 0.4,
      jumpOffset,
      null,
    );
    animId = requestAnimationFrame(loop);
  };

  spawnDrop();
  loop();
  return cleanup;
}

export function runWorldHideSeek({ container, activity, audio, onResult }) {
  const spots = activity.spots || [
    { id: "s1", cover: "🌿", hidden: "🐱", isTarget: true },
    { id: "s2", cover: "🌿", hidden: "🍄", isTarget: false },
    { id: "s3", cover: "🌿", hidden: "🐱", isTarget: true },
    { id: "s4", cover: "🌿", hidden: "🌸", isTarget: false },
    { id: "s5", cover: "🌿", hidden: "🐱", isTarget: true },
    { id: "s6", cover: "🌿", hidden: "🪨", isTarget: false },
  ];
  const shuffled = [...spots].sort(() => Math.random() - 0.5);
  const targetTotal = shuffled.filter((s) => s.isTarget).length;
  let found = 0;

  container.innerHTML = `
    <div style="width:100%; height:100%; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:16px;">
      <span class="ec-pill" style="font-size:1.1rem;">🔍 Ditemukan: <strong id="whs-cnt" style="color:#00b894;">0</strong> / ${targetTotal}</span>
      <div style="display:grid; grid-template-columns:repeat(3, minmax(120px, 165px)); gap:18px; justify-content:center;">
        ${shuffled
          .map(
            (sp, i) => `
          <button class="whs-spot" data-idx="${i}" data-target="${sp.isTarget}" data-hidden="${sp.hidden}" style="height:125px; border-radius:26px; border:5px solid #ffffff; background:linear-gradient(180deg,#55efc4,#00b894); box-shadow:0 8px 0 #006b53; font-size:3.5rem; cursor:pointer; transition:transform 0.16s;">
            ${sp.cover}
          </button>
        `,
          )
          .join("")}
      </div>
    </div>
  `;

  const cntEl = document.getElementById("whs-cnt");
  container.querySelectorAll(".whs-spot").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (btn.disabled) return;
      btn.disabled = true;
      btn.textContent = btn.dataset.hidden;
      if (btn.dataset.target === "true") {
        btn.style.background = "linear-gradient(180deg,#ffeaa7,#fdcb6e)";
        btn.style.boxShadow = "0 8px 0 #d35400";
        found += 1;
        cntEl.textContent = String(found);
        audio.play("collect");
        if (found >= targetTotal) {
          setTimeout(
            () =>
              onResult(true, "Jeli sekali! Semua yang bersembunyi ditemukan!"),
            400,
          );
        }
      } else {
        btn.style.background = "#dfe6e9";
        btn.style.boxShadow = "0 6px 0 #b2bec3";
        audio.play("click");
      }
    });
  });

  return () => {};
}

export function runWorldMaze({ container, activity, audio, onResult }) {
  const grid = activity.grid || [
    "WWWWWWW",
    "WS....W",
    "WWWWW.W",
    "W.....W",
    "W.WWWWW",
    "W....EW",
    "WWWWWWW",
  ];
  const rows = grid.length;
  const cols = grid[0].length;
  const tile = 54;
  let pr = 1;
  let pc = 1;
  let done = false;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c] === "S") {
        pr = r;
        pc = c;
      }
    }
  }

  container.innerHTML = `
    <div style="width:100%; height:100%; display:flex; align-items:center; justify-content:center; gap:28px; flex-wrap:wrap;">
      <canvas id="wm-canvas" width="${cols * tile}" height="${rows * tile}" style="border:5px solid #ffffff; border-radius:20px; box-shadow:0 10px 24px rgba(0,0,0,0.18); max-height:54vh; width:auto;"></canvas>
      <div style="display:grid; grid-template-columns:repeat(3, 68px); gap:10px;">
        <div></div><button id="wm-u" class="ec-btn-3d ec-btn-blue" style="font-size:1.3rem;">▲</button><div></div>
        <button id="wm-l" class="ec-btn-3d ec-btn-blue" style="font-size:1.3rem;">◀</button>
        <button id="wm-d" class="ec-btn-3d ec-btn-blue" style="font-size:1.3rem;">▼</button>
        <button id="wm-r" class="ec-btn-3d ec-btn-blue" style="font-size:1.3rem;">▶</button>
      </div>
    </div>
  `;

  const canvas = document.getElementById("wm-canvas");
  const ctx = canvas.getContext("2d");

  const draw = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const ch = grid[r][c];
        const x = c * tile;
        const y = r * tile;
        if (ch === "W") {
          const g = ctx.createLinearGradient(x, y, x, y + tile);
          g.addColorStop(0, "#2ecc71");
          g.addColorStop(1, "#1e8449");
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.roundRect(x + 2, y + 2, tile - 4, tile - 4, 10);
          ctx.fill();
        } else {
          ctx.fillStyle = "#fff9db";
          ctx.fillRect(x, y, tile, tile);
          ctx.strokeStyle = "#f6e58d";
          ctx.strokeRect(x, y, tile, tile);
          if (ch === "E") {
            ctx.fillStyle = "#f1c40f";
            ctx.beginPath();
            ctx.arc(x + tile / 2, y + tile / 2, 18, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = "#2c3e50";
            ctx.font = "bold 20px Segoe UI, sans-serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText("★", x + tile / 2, y + tile / 2 + 1);
          }
        }
      }
    }
    drawCartoonHero(
      ctx,
      pc * tile + tile / 2,
      pr * tile + tile / 2 - 4,
      1,
      0,
      0,
      null,
    );
  };

  const move = (dr, dc) => {
    if (done) return;
    const nr = pr + dr;
    const nc = pc + dc;
    if (nr < 0 || nr >= rows || nc < 0 || nc >= cols || grid[nr][nc] === "W") {
      audio.play("wrong");
      return;
    }
    pr = nr;
    pc = nc;
    audio.play("click");
    draw();
    if (grid[pr][pc] === "E") {
      done = true;
      audio.play("correct");
      setTimeout(
        () => onResult(true, "Hore! Kamu berhasil keluar dari labirin!"),
        300,
      );
    }
  };

  const onKey = (e) => {
    const k = e.key.toLowerCase();
    if (k === "arrowup" || k === "w") {
      e.preventDefault();
      move(-1, 0);
    }
    if (k === "arrowdown" || k === "s") {
      e.preventDefault();
      move(1, 0);
    }
    if (k === "arrowleft" || k === "a") {
      e.preventDefault();
      move(0, -1);
    }
    if (k === "arrowright" || k === "d") {
      e.preventDefault();
      move(0, 1);
    }
  };

  window.addEventListener("keydown", onKey);
  document.getElementById("wm-u").addEventListener("click", () => move(-1, 0));
  document.getElementById("wm-d").addEventListener("click", () => move(1, 0));
  document.getElementById("wm-l").addEventListener("click", () => move(0, -1));
  document.getElementById("wm-r").addEventListener("click", () => move(0, 1));

  draw();
  return () => window.removeEventListener("keydown", onKey);
}
