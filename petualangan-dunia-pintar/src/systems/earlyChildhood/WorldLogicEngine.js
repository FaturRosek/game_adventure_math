export function runAnimalSoundQuiz({ container, activity, audio, onResult }) {
  const target = activity.target || {
    id: "kucing",
    name: "Kucing",
    icon: "🐱",
    soundText: "Meong, meong! Hewan apakah aku?",
  };
  const options = [
    ...(activity.options || [
      { id: "kucing", name: "Kucing", icon: "🐱" },
      { id: "sapi", name: "Sapi", icon: "🐄" },
      { id: "ayam", name: "Ayam", icon: "🐔" },
    ]),
  ].sort(() => Math.random() - 0.5);
  let solved = false;

  container.innerHTML = `
    <div style="width:100%; height:100%; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:22px;">
      <button id="asq-play" class="ec-btn-3d ec-btn-green" style="font-size:1.25rem; padding:14px 30px;">
        🔊 Dengarkan Suara Hewan
      </button>
      <div style="display:flex; gap:20px; flex-wrap:wrap; justify-content:center;">
        ${options
          .map(
            (opt) => `
          <button class="asq-card" data-id="${opt.id}" style="width:165px; height:165px; border-radius:28px; border:5px solid #ffffff; background:linear-gradient(180deg,#ffffff,#eef9ff); cursor:pointer; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:8px; box-shadow:0 8px 0 rgba(44,62,80,0.2);">
            <span style="font-size:4.2rem;">${opt.icon}</span>
            <span style="font-weight:900; font-size:1.15rem; color:#2c3e50;">${opt.name}</span>
          </button>
        `,
          )
          .join("")}
      </div>
    </div>
  `;

  document.getElementById("asq-play").addEventListener("click", () => {
    audio.play("click");
    audio.speak(target.soundText, false);
  });
  setTimeout(() => audio.speak(target.soundText, false), 850);

  container.querySelectorAll(".asq-card").forEach((btn) => {
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
          btn.style.background = "linear-gradient(180deg,#ffffff,#eef9ff)";
        }, 350);
      }
    });
  });

  return () => {};
}

export function runMemoryOdd({ container, activity, audio, onResult }) {
  if (activity.submode === "odd_one_out") {
    const items = activity.items || ["🍎", "🍎", "🍌", "🍎"];
    const oddIdx = typeof activity.oddIdx === "number" ? activity.oddIdx : 2;
    container.innerHTML = `
      <div style="width:100%; height:100%; display:flex; align-items:center; justify-content:center; gap:18px; flex-wrap:wrap;">
        ${items
          .map(
            (it, i) => `
          <button class="mo-odd" data-idx="${i}" style="width:120px; height:120px; font-size:3.6rem; border-radius:26px; border:5px solid #ffffff; background:#ffffff; cursor:pointer; box-shadow:0 8px 0 rgba(44,62,80,0.2);">
            ${it}
          </button>
        `,
          )
          .join("")}
      </div>
    `;
    container.querySelectorAll(".mo-odd").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (Number(btn.dataset.idx) === oddIdx) {
          audio.play("correct");
          btn.style.background = "#d4efdf";
          setTimeout(
            () =>
              onResult(true, "Jeli sekali! Kamu menemukan benda yang berbeda!"),
            300,
          );
        } else {
          audio.play("wrong");
          audio.speakGentleHint();
          btn.style.background = "#fadbd8";
        }
      });
    });
    return () => {};
  }

  const icons = activity.icons || ["🐶", "🐱", "🐰"];
  const deck = [...icons, ...icons].sort(() => Math.random() - 0.5);
  let flipped = [];
  let matched = 0;
  let lock = false;

  container.innerHTML = `
    <div style="display:grid; grid-template-columns:repeat(${icons.length}, 110px); gap:14px; justify-content:center;">
      ${deck
        .map(
          (ic, idx) => `
        <button class="mo-card" data-idx="${idx}" data-val="${ic}" style="height:105px; font-size:2.6rem; border-radius:22px; border:4px solid #ffffff; background:linear-gradient(180deg,#74b9ff,#0984e3); color:#fff; cursor:pointer; font-weight:900; box-shadow:0 7px 0 #043896;">
          ❓
        </button>
      `,
        )
        .join("")}
    </div>
  `;

  container.querySelectorAll(".mo-card").forEach((card) => {
    card.addEventListener("click", () => {
      if (lock || card.dataset.open === "true") return;
      audio.play("select");
      card.dataset.open = "true";
      card.style.background = "#ffffff";
      card.textContent = card.dataset.val;
      flipped.push(card);

      if (flipped.length === 2) {
        lock = true;
        const [c1, c2] = flipped;
        if (c1.dataset.val === c2.dataset.val) {
          audio.play("match");
          c1.style.borderColor = "#27ae60";
          c2.style.borderColor = "#27ae60";
          matched += 1;
          flipped = [];
          lock = false;
          if (matched >= icons.length) {
            audio.play("correct");
            setTimeout(
              () =>
                onResult(true, "Ingatanmu hebat! Semua pasangan ditemukan!"),
              350,
            );
          }
        } else {
          audio.play("wrong");
          setTimeout(() => {
            c1.dataset.open = "false";
            c2.dataset.open = "false";
            c1.style.background = "linear-gradient(180deg,#74b9ff,#0984e3)";
            c2.style.background = "linear-gradient(180deg,#74b9ff,#0984e3)";
            c1.textContent = "❓";
            c2.textContent = "❓";
            flipped = [];
            lock = false;
          }, 650);
        }
      }
    });
  });

  return () => {};
}
