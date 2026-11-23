export function runBrushPaint({ container, activity, audio, onResult }) {
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
  let selected = palette[0];
  let painting = false;
  let done = false;
  const checkpoints = [
    { x: 220, y: 120 },
    { x: 220, y: 185 },
    { x: 165, y: 160 },
    { x: 275, y: 160 },
    { x: 220, y: 230 },
  ];
  const hitSet = new Set();

  container.innerHTML = `
    <div style="width:100%; height:100%; display:flex; align-items:center; justify-content:center; gap:30px; flex-wrap:wrap;">
      <canvas id="bp-canvas" width="440" height="320" style="background:#fffdf7; border:5px solid #ffffff; border-radius:26px; box-shadow:0 10px 24px rgba(0,0,0,0.14); touch-action:none; cursor:crosshair; max-width:90%; max-height:52vh;"></canvas>
      <div style="display:flex; flex-direction:column; gap:12px; align-items:center;">
        <span class="ec-pill">🖌️ Pilih Cat Warna ${targetColor.name}</span>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
          ${palette
            .map(
              (c, idx) => `
            <button class="bp-swatch" data-id="${c.id}" style="width:118px; height:64px; border-radius:18px; border:4px solid ${idx === 0 ? "#2c3e50" : "#ffffff"}; background:${c.hex}; color:#fff; font-weight:900; font-size:1rem; cursor:pointer; box-shadow:0 6px 0 rgba(0,0,0,0.2);">
              ${c.name}
            </button>
          `,
            )
            .join("")}
        </div>
        <span style="font-weight:800; color:#2c3e50;">Usapkan kuas di dalam gambar!</span>
      </div>
    </div>
  `;

  const canvas = document.getElementById("bp-canvas");
  const ctx = canvas.getContext("2d");

  const drawOutline = () => {
    ctx.strokeStyle = "#2c3e50";
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(220, 165, 118, 0, Math.PI * 2);
    ctx.stroke();
  };
  drawOutline();

  container.querySelectorAll(".bp-swatch").forEach((btn) => {
    btn.addEventListener("click", () => {
      audio.play("select");
      selected = palette.find((p) => p.id === btn.dataset.id) || palette[0];
      container.querySelectorAll(".bp-swatch").forEach((b) => {
        b.style.borderColor = "#ffffff";
      });
      btn.style.borderColor = "#2c3e50";
    });
  });

  const getPos = (e) => {
    const rect = canvas.getBoundingClientRect();
    const cx = e.touches ? e.touches[0].clientX : e.clientX;
    const cy = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: ((cx - rect.left) / rect.width) * canvas.width,
      y: ((cy - rect.top) / rect.height) * canvas.height,
    };
  };

  const paint = (pos) => {
    if (done) return;
    if (Math.hypot(pos.x - 220, pos.y - 165) > 112) return;

    ctx.fillStyle = selected.hex;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, 26, 0, Math.PI * 2);
    ctx.fill();
    drawOutline();

    if (selected.id === targetColor.id) {
      checkpoints.forEach((pt, i) => {
        if (!hitSet.has(i) && Math.hypot(pos.x - pt.x, pos.y - pt.y) < 42) {
          hitSet.add(i);
          audio.play("click");
        }
      });
      if (hitSet.size >= checkpoints.length) {
        done = true;
        audio.play("correct");
        setTimeout(
          () => onResult(true, `Karya warna ${targetColor.name} sangat indah!`),
          300,
        );
      }
    }
  };

  const start = (e) => {
    e.preventDefault();
    painting = true;
    paint(getPos(e));
  };
  const move = (e) => {
    if (!painting) return;
    e.preventDefault();
    paint(getPos(e));
  };
  const end = () => {
    painting = false;
  };

  canvas.addEventListener("mousedown", start);
  canvas.addEventListener("mousemove", move);
  window.addEventListener("mouseup", end);
  canvas.addEventListener("touchstart", start);
  canvas.addEventListener("touchmove", move);
  window.addEventListener("touchend", end);

  return () => {
    window.removeEventListener("mouseup", end);
    window.removeEventListener("touchend", end);
  };
}

export function runDragMatch({ container, activity, audio, onResult }) {
  const pairs = activity.pairs || [
    {
      id: "p1",
      item: "🔴",
      label: "Merah",
      targetLabel: "Kotak Merah",
      color: "#fadbd8",
    },
    {
      id: "p2",
      item: "🔵",
      label: "Biru",
      targetLabel: "Kotak Biru",
      color: "#d6eaf8",
    },
  ];
  let matched = 0;
  let selectedId = null;
  const shuffled = [...pairs].sort(() => Math.random() - 0.5);

  container.innerHTML = `
    <div style="width:100%; height:100%; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:18px;">
      <div style="display:flex; flex-wrap:wrap; justify-content:center; gap:16px;">
        ${shuffled
          .map(
            (p) => `
          <div class="dm-item" draggable="true" data-id="${p.id}" style="background:#ffffff; border:4px solid #3498db; border-radius:22px; padding:14px 22px; cursor:grab; display:flex; flex-direction:column; align-items:center; min-width:118px; box-shadow:0 7px 0 rgba(52,152,219,0.28);">
            <span style="font-size:2.6rem;">${p.item}</span>
            <span style="font-size:0.95rem; font-weight:900; color:#2c3e50;">${p.label}</span>
          </div>
        `,
          )
          .join("")}
      </div>
      <div style="display:flex; flex-wrap:wrap; justify-content:center; gap:18px;">
        ${pairs
          .map(
            (p) => `
          <div class="dm-target" data-id="${p.id}" style="background:${p.color || "#fff9db"}; border:4px dashed #34495e; border-radius:24px; padding:16px 22px; min-width:160px; min-height:110px; display:flex; flex-direction:column; align-items:center; justify-content:center; font-weight:900; color:#2c3e50; cursor:pointer;">
            <div style="font-size:1.05rem;">${p.targetLabel}</div>
            <div class="dm-slot" style="font-size:2rem; margin-top:6px;">⬇️</div>
          </div>
        `,
          )
          .join("")}
      </div>
    </div>
  `;

  const tryMatch = (itemId, targetEl) => {
    if (!itemId || targetEl.dataset.done === "true") return;
    if (targetEl.dataset.id === itemId) {
      targetEl.dataset.done = "true";
      targetEl.style.borderStyle = "solid";
      targetEl.style.borderColor = "#27ae60";
      const itemEl = container.querySelector(`.dm-item[data-id="${itemId}"]`);
      const pairObj = pairs.find((x) => x.id === itemId);
      if (itemEl) {
        itemEl.style.visibility = "hidden";
        itemEl.setAttribute("draggable", "false");
      }
      const slot = targetEl.querySelector(".dm-slot");
      if (slot && pairObj) slot.textContent = `${pairObj.item} ✅`;
      selectedId = null;
      matched += 1;
      audio.play("match");
      if (matched >= pairs.length) {
        audio.play("correct");
        setTimeout(
          () =>
            onResult(true, "Semua pasangan berhasil ditempatkan dengan tepat!"),
          350,
        );
      }
    } else {
      audio.play("wrong");
      audio.speakGentleHint();
      targetEl.style.borderColor = "#e74c3c";
      setTimeout(() => {
        targetEl.style.borderColor = "#34495e";
      }, 400);
    }
  };

  container.querySelectorAll(".dm-item").forEach((el) => {
    el.addEventListener("dragstart", (e) => {
      e.dataTransfer.setData("text/plain", el.dataset.id);
      selectedId = el.dataset.id;
    });
    el.addEventListener("click", () => {
      audio.play("select");
      container.querySelectorAll(".dm-item").forEach((x) => {
        x.style.background = "#fff";
      });
      el.style.background = "#fff9db";
      selectedId = el.dataset.id;
    });
  });

  container.querySelectorAll(".dm-target").forEach((tEl) => {
    tEl.addEventListener("dragover", (e) => e.preventDefault());
    tEl.addEventListener("drop", (e) => {
      e.preventDefault();
      tryMatch(e.dataTransfer.getData("text/plain") || selectedId, tEl);
    });
    tEl.addEventListener("click", () => {
      if (selectedId) tryMatch(selectedId, tEl);
    });
  });

  return () => {};
}

export function runTracePath({ container, activity, audio, onResult }) {
  const symbol = activity.symbol || "A";
  const points = activity.points || [
    { x: 270, y: 75 },
    { x: 215, y: 175 },
    { x: 325, y: 175 },
    { x: 270, y: 260 },
  ];
  const hitSet = new Set();
  let drawing = false;
  let completed = false;

  container.innerHTML = `
    <div style="width:100%; height:100%; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:10px;">
      <canvas id="tp-canvas" width="540" height="330" style="background:#fffdf7; border:5px solid #9b59b6; border-radius:24px; touch-action:none; cursor:crosshair; max-width:92%; max-height:50vh;"></canvas>
      <span class="ec-pill">✏️ Tebalkan semua titik kuning mengikuti bentuk "${symbol}"!</span>
    </div>
  `;

  const canvas = document.getElementById("tp-canvas");
  const ctx = canvas.getContext("2d");

  const drawGuide = () => {
    ctx.font = "bold 230px Segoe UI, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "rgba(155, 89, 182, 0.16)";
    ctx.fillText(symbol, 270, 175);

    points.forEach((pt, i) => {
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 18, 0, Math.PI * 2);
      ctx.fillStyle = hitSet.has(i) ? "#2ecc71" : "#f1c40f";
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = "#2c3e50";
      ctx.stroke();
    });
  };
  drawGuide();

  const getPos = (e) => {
    const rect = canvas.getBoundingClientRect();
    const cx = e.touches ? e.touches[0].clientX : e.clientX;
    const cy = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: ((cx - rect.left) / rect.width) * canvas.width,
      y: ((cy - rect.top) / rect.height) * canvas.height,
    };
  };

  const paintAt = (pos) => {
    if (completed) return;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, 12, 0, Math.PI * 2);
    ctx.fillStyle = "#8e44ad";
    ctx.fill();

    points.forEach((pt, idx) => {
      if (!hitSet.has(idx) && Math.hypot(pos.x - pt.x, pos.y - pt.y) < 30) {
        hitSet.add(idx);
        audio.play("click");
        drawGuide();
      }
    });

    if (hitSet.size >= points.length) {
      completed = true;
      audio.play("correct");
      setTimeout(
        () => onResult(true, `Hebat! Bentuk "${symbol}" berhasil ditebalkan!`),
        300,
      );
    }
  };

  const start = (e) => {
    e.preventDefault();
    drawing = true;
    paintAt(getPos(e));
  };
  const move = (e) => {
    if (!drawing) return;
    e.preventDefault();
    paintAt(getPos(e));
  };
  const end = () => {
    drawing = false;
  };

  canvas.addEventListener("mousedown", start);
  canvas.addEventListener("mousemove", move);
  window.addEventListener("mouseup", end);
  canvas.addEventListener("touchstart", start);
  canvas.addEventListener("touchmove", move);
  window.addEventListener("touchend", end);

  return () => {
    window.removeEventListener("mouseup", end);
    window.removeEventListener("touchend", end);
  };
}

export function runBuildSequence({ container, activity, audio, onResult }) {
  const correctOrder = activity.items || ["1", "2", "3", "4"];
  const shuffled = [...correctOrder].sort(() => Math.random() - 0.5);
  let nextIdx = 0;

  container.innerHTML = `
    <div style="width:100%; height:100%; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:20px;">
      <div style="display:flex; gap:14px; flex-wrap:wrap; justify-content:center;">
        ${correctOrder
          .map(
            (_, idx) => `
          <div class="bs-slot" data-slot="${idx}" style="min-width:100px; height:100px; padding:10px; border-radius:22px; border:4px dashed #e67e22; background:#fff9db; display:flex; align-items:center; justify-content:center; font-size:2.1rem; font-weight:900; color:#2c3e50;">
            ${idx + 1}
          </div>
        `,
          )
          .join("")}
      </div>
      <div style="display:flex; gap:14px; flex-wrap:wrap; justify-content:center;">
        ${shuffled
          .map(
            (val) => `
          <button class="bs-btn" data-val="${val}" style="min-width:106px; height:92px; padding:10px 18px; border-radius:22px; border:4px solid #2c3e50; background:#ffffff; font-size:2rem; font-weight:900; cursor:pointer; box-shadow:0 7px 0 rgba(0,0,0,0.14);">
            ${val}
          </button>
        `,
          )
          .join("")}
      </div>
    </div>
  `;

  container.querySelectorAll(".bs-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (btn.disabled) return;
      if (btn.dataset.val === correctOrder[nextIdx]) {
        audio.play("match");
        const slot = container.querySelector(
          `.bs-slot[data-slot="${nextIdx}"]`,
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
          setTimeout(() => onResult(true, "Susunannya tepat sekali!"), 350);
        }
      } else {
        audio.play("wrong");
        audio.speakGentleHint();
        btn.style.background = "#fadbd8";
        setTimeout(() => {
          btn.style.background = "#ffffff";
        }, 350);
      }
    });
  });

  return () => {};
}
