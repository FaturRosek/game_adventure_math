export function runMusicRhythm({ container, activity, audio, onResult }) {
  const pads = activity.pads || [
    {
      id: "do",
      label: "Gendang",
      icon: "🥁",
      freq: 261.63,
      color: "#ff7675",
      shadow: "#c0392b",
    },
    {
      id: "mi",
      label: "Piano",
      icon: "🎹",
      freq: 329.63,
      color: "#74b9ff",
      shadow: "#2980b9",
    },
    {
      id: "sol",
      label: "Gitar",
      icon: "🎸",
      freq: 392.0,
      color: "#ffeaa7",
      shadow: "#d35400",
    },
    {
      id: "do2",
      label: "Lonceng",
      icon: "🔔",
      freq: 523.25,
      color: "#55efc4",
      shadow: "#009473",
    },
  ];
  const pattern = activity.pattern || [0, 1, 2];
  let userStep = 0;
  let playingDemo = false;
  let done = false;

  container.innerHTML = `
    <div style="width:100%; height:100%; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:18px;">
      <div style="display:flex; gap:12px; align-items:center; flex-wrap:wrap; justify-content:center;">
        <button id="mr-demo" class="ec-btn-3d ec-btn-orange">🎵 Putar Contoh Irama</button>
        <span class="ec-pill">✨ Urutan: <strong id="mr-prog" style="color:#00b894;">0</strong> / ${pattern.length}</span>
      </div>
      <div style="display:flex; gap:18px; flex-wrap:wrap; justify-content:center;">
        ${pads
          .map(
            (p, idx) => `
          <button class="mr-pad" data-idx="${idx}" style="width:142px; height:152px; border-radius:28px; border:5px solid #ffffff; background:${p.color}; box-shadow:0 10px 0 ${p.shadow}; cursor:pointer; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:6px; transition:transform 0.12s;">
            <span style="font-size:3.6rem;">${p.icon}</span>
            <span style="font-weight:900; font-size:1.05rem; color:#2c3e50;">${p.label}</span>
          </button>
        `,
          )
          .join("")}
      </div>
    </div>
  `;

  const progEl = document.getElementById("mr-prog");
  const padEls = Array.from(container.querySelectorAll(".mr-pad"));

  const flashPad = (idx) => {
    const el = padEls[idx];
    const p = pads[idx];
    if (!el || !p) return;
    audio.playNote ? audio.playNote(p.freq) : audio.play("select");
    el.style.transform = "scale(1.12) translateY(-6px)";
    el.style.filter = "brightness(1.18)";
    setTimeout(() => {
      el.style.transform = "scale(1)";
      el.style.filter = "none";
    }, 320);
  };

  const playDemoSequence = () => {
    if (playingDemo || done) return;
    playingDemo = true;
    pattern.forEach((padIdx, i) => {
      setTimeout(() => {
        if (!done) flashPad(padIdx);
        if (i === pattern.length - 1) {
          setTimeout(() => {
            playingDemo = false;
          }, 380);
        }
      }, i * 560);
    });
  };

  document
    .getElementById("mr-demo")
    .addEventListener("click", playDemoSequence);
  setTimeout(playDemoSequence, 700);

  padEls.forEach((btn) => {
    btn.addEventListener("click", () => {
      if (playingDemo || done) return;
      const idx = Number(btn.dataset.idx);
      flashPad(idx);
      if (idx === pattern[userStep]) {
        userStep += 1;
        progEl.textContent = String(userStep);
        if (userStep >= pattern.length) {
          done = true;
          setTimeout(() => {
            audio.play("correct");
            onResult(true, "Iramanya merdu sekali! Kamu hebat!");
          }, 350);
        }
      } else {
        userStep = 0;
        progEl.textContent = "0";
        audio.play("wrong");
        audio.speakGentleHint();
      }
    });
  });

  return () => {
    done = true;
  };
}

export function runRoleplayMission({ container, activity, audio, onResult }) {
  const stationIcon = activity.stationIcon || "🍲";
  const stationName = activity.stationName || "Panci Sup";
  const neededItems = activity.neededItems || [
    { id: "i1", icon: "🥕", name: "Wortel" },
    { id: "i2", icon: "🥦", name: "Brokoli" },
    { id: "i3", icon: "🍅", name: "Tomat" },
  ];
  const wrongItems = activity.wrongItems || [
    { id: "w1", icon: "👟", name: "Sepatu" },
    { id: "w2", icon: "⚽", name: "Bola" },
  ];
  const allItems = [
    ...neededItems.map((x) => ({ ...x, valid: true })),
    ...wrongItems.map((x) => ({ ...x, valid: false })),
  ].sort(() => Math.random() - 0.5);
  const doneSet = new Set();

  container.innerHTML = `
    <div style="width:100%; height:100%; display:flex; align-items:center; justify-content:center; gap:28px; flex-wrap:wrap;">
      <div id="rp-station" style="width:240px; min-height:220px; border-radius:32px; border:5px dashed #e67e22; background:linear-gradient(180deg,#fff9db,#ffeaa7); display:flex; flex-direction:column; align-items:center; justify-content:center; padding:16px; gap:8px; box-shadow:0 10px 24px rgba(0,0,0,0.12);">
        <div style="font-size:4.6rem;">${stationIcon}</div>
        <div style="font-weight:900; font-size:1.15rem; color:#2c3e50;">${stationName}</div>
        <div id="rp-inside" style="font-size:1.9rem; min-height:36px;"></div>
        <span class="ec-pill" style="font-size:0.9rem;">Selesai: <strong id="rp-cnt">0</strong> / ${neededItems.length}</span>
      </div>

      <div style="display:flex; flex-direction:column; align-items:center; gap:12px; max-width:540px;">
        <span class="ec-pill" style="background:#eef9ff;">👆 Klik benda yang tepat untuk dimasukkan ke ${stationName}!</span>
        <div style="display:flex; flex-wrap:wrap; justify-content:center; gap:14px;">
          ${allItems
            .map(
              (it) => `
            <button class="rp-item" data-id="${it.id}" data-valid="${it.valid}" data-icon="${it.icon}" style="width:118px; height:118px; border-radius:24px; border:4px solid #ffffff; background:#ffffff; box-shadow:0 7px 0 rgba(44,62,80,0.18); cursor:pointer; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:4px; transition:transform 0.15s;">
              <span style="font-size:3.1rem;">${it.icon}</span>
              <span style="font-weight:900; font-size:0.88rem; color:#2c3e50;">${it.name}</span>
            </button>
          `,
            )
            .join("")}
        </div>
      </div>
    </div>
  `;

  const insideEl = document.getElementById("rp-inside");
  const cntEl = document.getElementById("rp-cnt");
  const stationEl = document.getElementById("rp-station");

  container.querySelectorAll(".rp-item").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (btn.disabled) return;
      if (btn.dataset.valid === "true") {
        btn.disabled = true;
        btn.style.visibility = "hidden";
        doneSet.add(btn.dataset.id);
        insideEl.textContent += ` ${btn.dataset.icon}`;
        cntEl.textContent = String(doneSet.size);
        stationEl.style.transform = "scale(1.06)";
        setTimeout(() => {
          stationEl.style.transform = "scale(1)";
        }, 180);
        audio.play("collect");
        if (doneSet.size >= neededItems.length) {
          audio.play("correct");
          setTimeout(
            () =>
              onResult(
                true,
                `Hebat! Misi ${stationName} berhasil diselesaikan!`,
              ),
            400,
          );
        }
      } else {
        audio.play("wrong");
        audio.speakGentleHint();
        btn.style.background = "#fadbd8";
        setTimeout(() => {
          btn.style.background = "#ffffff";
        }, 360);
      }
    });
  });

  return () => {};
}

export function runStickerDecorate({ container, activity, audio, onResult }) {
  const baseIcon = activity.baseIcon || "🎂";
  const baseName = activity.baseName || "Kue Ulang Tahun";
  const stickers = activity.stickers || ["🍓", "⭐", "🌸", "🕯️"];
  const needed = activity.neededCount || 4;
  let selected = stickers[0];
  let placed = 0;

  container.innerHTML = `
    <div style="width:100%; height:100%; display:flex; align-items:center; justify-content:center; gap:28px; flex-wrap:wrap;">
      <div id="sd-board" style="position:relative; width:340px; height:290px; border-radius:30px; border:5px solid #ffffff; background:linear-gradient(180deg,#fffdf7,#ffeef8); box-shadow:0 10px 24px rgba(0,0,0,0.14); display:flex; align-items:center; justify-content:center; cursor:pointer; overflow:hidden;">
        <span style="font-size:8.5rem; pointer-events:none;">${baseIcon}</span>
      </div>
      <div style="display:flex; flex-direction:column; align-items:center; gap:14px;">
        <span class="ec-pill">✨ Hias ${baseName}: <strong id="sd-cnt">0</strong> / ${needed}</span>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
          ${stickers
            .map(
              (st, idx) => `
            <button class="sd-pick" data-st="${st}" style="width:94px; height:86px; border-radius:22px; border:4px solid ${idx === 0 ? "#e84393" : "#ffffff"}; background:#ffffff; font-size:2.8rem; cursor:pointer; box-shadow:0 6px 0 rgba(0,0,0,0.14);">
              ${st}
            </button>
          `,
            )
            .join("")}
        </div>
        <span style="font-weight:800; color:#2c3e50;">Pilih hiasan lalu klik pada ${baseName}!</span>
      </div>
    </div>
  `;

  const board = document.getElementById("sd-board");
  const cntEl = document.getElementById("sd-cnt");

  container.querySelectorAll(".sd-pick").forEach((btn) => {
    btn.addEventListener("click", () => {
      audio.play("select");
      selected = btn.dataset.st;
      container.querySelectorAll(".sd-pick").forEach((b) => {
        b.style.borderColor = "#ffffff";
      });
      btn.style.borderColor = "#e84393";
    });
  });

  board.addEventListener("click", (e) => {
    if (placed >= needed) return;
    const rect = board.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const tag = document.createElement("span");
    tag.textContent = selected;
    tag.style.position = "absolute";
    tag.style.left = `${x - 20}px`;
    tag.style.top = `${y - 20}px`;
    tag.style.fontSize = "2.4rem";
    tag.style.pointerEvents = "none";
    board.appendChild(tag);

    placed += 1;
    cntEl.textContent = String(placed);
    audio.play("collect");

    if (placed >= needed) {
      audio.play("correct");
      setTimeout(
        () => onResult(true, `Wah! ${baseName} hiasanmu cantik sekali!`),
        450,
      );
    }
  });

  return () => {};
}
