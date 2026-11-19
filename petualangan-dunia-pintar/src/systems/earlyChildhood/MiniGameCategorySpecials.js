export function runMiniGameColorPaint({
  container,
  activity,
  audio,
  onResult,
}) {
  const targetColor = activity.targetColor || {
    id: "merah",
    name: "Merah",
    hex: "#e74c3c",
  };
  const palette = activity.palette || [
    { id: "merah", name: "Merah", hex: "#e74c3c" },
    { id: "kuning", name: "Kuning", hex: "#f1c40f" },
    { id: "biru", name: "Biru", hex: "#3498db" },
    { id: "hijau", name: "Hijau", hex: "#2ecc71" },
  ];
  const shapeType = activity.shapeType || "circle";
  let selectedColor = palette[0];
  let painted = false;

  const shapeSvg =
    shapeType === "star"
      ? `<polygon id="cp-shape" points="160,20 198,108 292,116 220,178 242,270 160,220 78,270 100,178 28,116 122,108" fill="#ffffff" stroke="#2c3e50" stroke-width="8" style="cursor:pointer;" />`
      : shapeType === "triangle"
        ? `<polygon id="cp-shape" points="160,28 286,256 34,256" fill="#ffffff" stroke="#2c3e50" stroke-width="8" style="cursor:pointer;" />`
        : shapeType === "square"
          ? `<rect id="cp-shape" x="50" y="34" width="220" height="220" rx="22" fill="#ffffff" stroke="#2c3e50" stroke-width="8" style="cursor:pointer;" />`
          : `<circle id="cp-shape" cx="160" cy="145" r="112" fill="#ffffff" stroke="#2c3e50" stroke-width="8" style="cursor:pointer;" />`;

  container.innerHTML = `
    <div style="width:100%; height:100%; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:16px;">
      <div style="font-weight:900; font-size:1.3rem; color:#2c3e50;">${activity.prompt}</div>
      <div style="display:flex; align-items:center; justify-content:center; gap:36px; flex-wrap:wrap;">
        <svg width="320" height="290" viewBox="0 0 320 290" style="background:#fffdf7; border:4px solid #34495e; border-radius:24px; box-shadow:0 8px 0 rgba(0,0,0,0.08);">
          ${shapeSvg}
        </svg>
        <div style="display:flex; flex-direction:column; gap:12px;">
          <div style="font-weight:900; font-size:1rem; color:#576574;">1. Pilih Cat Warna:</div>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
            ${palette
              .map(
                (c, idx) => `
              <button class="cp-swatch" data-id="${c.id}" style="width:110px; height:64px; border-radius:16px; border:4px solid ${idx === 0 ? "#2c3e50" : "#bdc3c7"}; background:${c.hex}; color:#fff; font-weight:900; font-size:1rem; cursor:pointer; text-shadow:1px 1px 2px #000;">
                ${c.name}
              </button>
            `,
              )
              .join("")}
          </div>
          <div style="font-weight:800; font-size:0.95rem; color:#2980b9;">2. Klik gambar di kiri untuk mewarnai!</div>
        </div>
      </div>
    </div>
  `;

  container.querySelectorAll(".cp-swatch").forEach((btn) => {
    btn.addEventListener("click", () => {
      audio.play("select");
      selectedColor =
        palette.find((p) => p.id === btn.dataset.id) || palette[0];
      container.querySelectorAll(".cp-swatch").forEach((b) => {
        b.style.borderColor = "#bdc3c7";
      });
      btn.style.borderColor = "#2c3e50";
    });
  });

  const shapeEl = document.getElementById("cp-shape");
  shapeEl.addEventListener("click", () => {
    if (painted) return;
    shapeEl.setAttribute("fill", selectedColor.hex);
    if (selectedColor.id === targetColor.id) {
      painted = true;
      audio.play("correct");
      setTimeout(
        () => onResult(true, `Warna ${targetColor.name} sangat indah!`),
        400,
      );
    } else {
      audio.play("wrong");
      audio.speakGentleHint();
    }
  });

  return () => {};
}

export function runMiniGameSequenceOrder({
  container,
  activity,
  audio,
  onResult,
}) {
  const correctOrder = activity.items || ["1", "2", "3", "4"];
  const shuffled = [...correctOrder].sort(() => Math.random() - 0.5);
  let nextIdx = 0;

  container.innerHTML = `
    <div style="width:100%; height:100%; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:20px;">
      <div style="font-weight:900; font-size:1.3rem; color:#2c3e50;">${activity.prompt}</div>
      <div id="so-slots" style="display:flex; gap:14px; flex-wrap:wrap; justify-content:center;">
        ${correctOrder
          .map(
            (_, idx) => `
          <div class="so-slot" data-slot="${idx}" style="min-width:96px; height:96px; padding:8px; border-radius:20px; border:4px dashed #3498db; background:#eef9ff; display:flex; align-items:center; justify-content:center; font-size:2rem; font-weight:900; color:#2c3e50;">
            ${idx + 1}
          </div>
        `,
          )
          .join("")}
      </div>
      <div id="so-pool" style="display:flex; gap:14px; flex-wrap:wrap; justify-content:center;">
        ${shuffled
          .map(
            (val) => `
          <button class="so-btn" data-val="${val}" style="min-width:100px; height:88px; padding:10px 18px; border-radius:20px; border:4px solid #2c3e50; background:#fff; font-size:1.9rem; font-weight:900; cursor:pointer; box-shadow:0 6px 0 rgba(0,0,0,0.12);">
            ${val}
          </button>
        `,
          )
          .join("")}
      </div>
    </div>
  `;

  container.querySelectorAll(".so-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (btn.disabled) return;
      if (btn.dataset.val === correctOrder[nextIdx]) {
        audio.play("match");
        const slot = container.querySelector(
          `.so-slot[data-slot="${nextIdx}"]`,
        );
        if (slot) {
          slot.textContent = btn.dataset.val;
          slot.style.borderStyle = "solid";
          slot.style.borderColor = "#27ae60";
          slot.style.background = "#d4efdf";
        }
        btn.disabled = true;
        btn.style.visibility = "hidden";
        nextIdx += 1;
        if (nextIdx >= correctOrder.length) {
          audio.play("correct");
          setTimeout(() => onResult(true, "Urutannya tepat sekali!"), 350);
        }
      } else {
        audio.play("wrong");
        audio.speakGentleHint();
        btn.style.background = "#fadbd8";
        setTimeout(() => {
          btn.style.background = "#fff";
        }, 350);
      }
    });
  });

  return () => {};
}

export function runMiniGameLetterHunt({
  container,
  activity,
  audio,
  onResult,
}) {
  const target = activity.targetLetter || "A";
  const targetCount = activity.targetCount || 3;
  const decoys = activity.decoys || ["B", "C", "D", "E", "M", "S"];
  const tiles = [];
  for (let i = 0; i < targetCount; i++) tiles.push(target);
  while (tiles.length < 10) tiles.push(decoys[tiles.length % decoys.length]);
  tiles.sort(() => Math.random() - 0.5);

  let found = 0;

  container.innerHTML = `
    <div style="width:100%; height:100%; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:18px;">
      <div style="font-weight:900; font-size:1.3rem; color:#2c3e50;">
        ${activity.prompt} — Ditemukan: <span id="lh-found" style="color:#27ae60;">0</span>/${targetCount}
      </div>
      <div style="display:grid; grid-template-columns:repeat(5, minmax(90px, 120px)); gap:16px; justify-content:center;">
        ${tiles
          .map(
            (ch) => `
          <button class="lh-bubble" data-ch="${ch}" style="height:96px; border-radius:50%; border:4px solid #2980b9; background:linear-gradient(145deg,#ffffff,#d6eaf8); font-size:2.4rem; font-weight:900; color:#2c3e50; cursor:pointer; box-shadow:0 6px 0 rgba(0,0,0,0.12);">
            ${ch}
          </button>
        `,
          )
          .join("")}
      </div>
    </div>
  `;

  const foundEl = document.getElementById("lh-found");
  container.querySelectorAll(".lh-bubble").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (btn.disabled) return;
      if (btn.dataset.ch === target) {
        btn.disabled = true;
        btn.style.background = "#2ecc71";
        btn.style.color = "#fff";
        btn.style.borderColor = "#1e8449";
        found += 1;
        foundEl.textContent = String(found);
        audio.play("collect");
        if (found >= targetCount) {
          audio.play("correct");
          setTimeout(
            () =>
              onResult(
                true,
                `Hebat! Semua huruf ${target} berhasil ditemukan!`,
              ),
            350,
          );
        }
      } else {
        audio.play("wrong");
        audio.speakGentleHint();
        btn.style.background = "#fadbd8";
        setTimeout(() => {
          btn.style.background = "linear-gradient(145deg,#ffffff,#d6eaf8)";
        }, 350);
      }
    });
  });

  return () => {};
}

export function runMiniGameAnimalSound({
  container,
  activity,
  audio,
  onResult,
}) {
  const target = activity.target || {
    id: "kucing",
    name: "Kucing",
    icon: "🐱",
    soundText: "Meong, meong! Hewan apakah aku?",
  };
  const options = [
    ...(activity.options || [
      { id: "kucing", name: "Kucing", icon: "🐱" },
      { id: "anjing", name: "Anjing", icon: "🐶" },
      { id: "sapi", name: "Sapi", icon: "🐄" },
    ]),
  ].sort(() => Math.random() - 0.5);

  let solved = false;

  container.innerHTML = `
    <div style="width:100%; height:100%; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:20px;">
      <div style="font-weight:900; font-size:1.3rem; color:#2c3e50;">${activity.prompt}</div>
      <button id="as-play-sound" class="btn-cartoon btn-green" style="font-size:1.2rem; padding:14px 28px;">
        🔊 Dengarkan Suara Hewan
      </button>
      <div style="display:flex; gap:18px; flex-wrap:wrap; justify-content:center;">
        ${options
          .map(
            (opt) => `
          <button class="as-card" data-id="${opt.id}" style="width:155px; height:155px; border-radius:24px; border:4px solid #34495e; background:#fff; cursor:pointer; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:8px; box-shadow:0 7px 0 rgba(0,0,0,0.12);">
            <span style="font-size:4rem;">${opt.icon}</span>
            <span style="font-weight:900; font-size:1.1rem; color:#2c3e50;">${opt.name}</span>
          </button>
        `,
          )
          .join("")}
      </div>
    </div>
  `;

  document.getElementById("as-play-sound").addEventListener("click", () => {
    audio.play("click");
    audio.speak(target.soundText, false);
  });

  setTimeout(() => audio.speak(target.soundText, false), 900);

  container.querySelectorAll(".as-card").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (solved) return;
      if (btn.dataset.id === target.id) {
        solved = true;
        audio.play("correct");
        btn.style.background = "#d4efdf";
        btn.style.borderColor = "#27ae60";
        setTimeout(
          () => onResult(true, `Benar! Itu suara ${target.name}!`),
          350,
        );
      } else {
        audio.play("wrong");
        audio.speakGentleHint();
        btn.style.background = "#fadbd8";
        setTimeout(() => {
          btn.style.background = "#fff";
        }, 350);
      }
    });
  });

  return () => {};
}

export function runMiniGameSimpleMaze({
  container,
  activity,
  audio,
  onResult,
}) {
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
    <div style="width:100%; height:100%; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:10px;">
      <div style="font-weight:900; font-size:1.2rem; color:#2c3e50;">${activity.prompt}</div>
      <div style="display:flex; align-items:center; gap:24px; flex-wrap:wrap; justify-content:center;">
        <canvas id="sm-canvas" width="${cols * tile}" height="${rows * tile}" style="border:4px solid #2c3e50; border-radius:16px; background:#ecf0f1; max-height:46vh; width:auto;"></canvas>
        <div style="display:grid; grid-template-columns:repeat(3, 64px); gap:8px;">
          <div></div><button id="sm-up" class="btn-cartoon btn-blue btn-small">▲</button><div></div>
          <button id="sm-left" class="btn-cartoon btn-blue btn-small">◀</button>
          <button id="sm-down" class="btn-cartoon btn-blue btn-small">▼</button>
          <button id="sm-right" class="btn-cartoon btn-blue btn-small">▶</button>
        </div>
      </div>
    </div>
  `;

  const canvas = document.getElementById("sm-canvas");
  const ctx = canvas.getContext("2d");

  const draw = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const ch = grid[r][c];
        const x = c * tile;
        const y = r * tile;
        if (ch === "W") {
          const wGrad = ctx.createLinearGradient(x, y, x, y + tile);
          wGrad.addColorStop(0, "#2ecc71");
          wGrad.addColorStop(1, "#1e8449");
          ctx.fillStyle = wGrad;
          ctx.beginPath();
          ctx.roundRect(x + 2, y + 2, tile - 4, tile - 4, 10);
          ctx.fill();
          ctx.fillStyle = "rgba(255,255,255,0.22)";
          ctx.beginPath();
          ctx.arc(x + 16, y + 14, 7, 0, Math.PI * 2);
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
    const cx = pc * tile + tile / 2;
    const cy = pr * tile + tile / 2;
    ctx.fillStyle = "rgba(0,0,0,0.18)";
    ctx.beginPath();
    ctx.ellipse(cx, cy + 16, 15, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    const bGrad = ctx.createRadialGradient(cx - 5, cy - 6, 3, cx, cy, 18);
    bGrad.addColorStop(0, "#ffffff");
    bGrad.addColorStop(1, "#dcdde1");
    ctx.fillStyle = bGrad;
    ctx.strokeStyle = "#2c3e50";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(cx - 10, cy - 22, 7, 14, 3);
    ctx.roundRect(cx + 3, cy - 22, 7, 14, 3);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#2c3e50";
    ctx.beginPath();
    ctx.arc(cx - 5, cy - 2, 2.5, 0, Math.PI * 2);
    ctx.arc(cx + 5, cy - 2, 2.5, 0, Math.PI * 2);
    ctx.fill();
  };

  const move = (dr, dc) => {
    if (done) return;
    const nr = pr + dr;
    const nc = pc + dc;
    if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) return;
    if (grid[nr][nc] === "W") {
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
  document.getElementById("sm-up").addEventListener("click", () => move(-1, 0));
  document
    .getElementById("sm-down")
    .addEventListener("click", () => move(1, 0));
  document
    .getElementById("sm-left")
    .addEventListener("click", () => move(0, -1));
  document
    .getElementById("sm-right")
    .addEventListener("click", () => move(0, 1));

  draw();
  return () => window.removeEventListener("keydown", onKey);
}
