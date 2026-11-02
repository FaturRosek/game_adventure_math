import { GAME_CONFIG } from "../config/gameConfig.js";
import { db } from "../storage/db.js";
import { questionManager } from "./QuestionManager.js";
import { hybridEngine } from "./HybridQuestionEngine.js";

export class UIManager {
  constructor() {
    this.container = document.getElementById("ui-layer");
    this.phaserGame = null;
    this.activeProfile = null;
    this.settings = {
      soundEffects: true,
      showTouchControls: true,
      tutorPin: "1234",
      difficultyMode: "adaptif",
      manualDifficulty: "sedang",
      adaptiveBounds: "mudah-sulit",
      initialAdaptiveDifficulty: "mudah",
    };
    this.selectedGrade = 3;
    this.selectedSubject = "matematika";
    this.audioCtx = null;
    this.duelSession = null;
    this.tutorUnlocked = false;
  }

  async init(phaserGame) {
    this.phaserGame = phaserGame;
    await db.init();
    this.settings = await db.getSettings();
    await questionManager.loadCustomQuestionsFromDB();
    this.activeProfile = await db.getActiveProfile();
    this.showMainMenu();
  }

  playTone(type = "click") {
    if (!this.settings.soundEffects) return;
    try {
      if (!this.audioCtx) {
        const AudioContextClass =
          window.AudioContext || window.webkitAudioContext;
        this.audioCtx = new AudioContextClass();
      }
      if (this.audioCtx.state === "suspended") {
        this.audioCtx.resume();
      }

      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      const now = this.audioCtx.currentTime;

      if (type === "click") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(520, now);
        osc.frequency.exponentialRampToValueAtTime(680, now + 0.08);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
      } else if (type === "coin") {
        osc.type = "triangle";
        osc.frequency.setValueAtTime(987.77, now);
        osc.frequency.setValueAtTime(1318.51, now + 0.07);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.22);
        osc.start(now);
        osc.stop(now + 0.22);
      } else if (type === "jump") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(240, now);
        osc.frequency.exponentialRampToValueAtTime(520, now + 0.16);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.16);
        osc.start(now);
        osc.stop(now + 0.16);
      } else if (type === "correct") {
        osc.type = "triangle";
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.setValueAtTime(659.25, now + 0.1);
        osc.frequency.setValueAtTime(783.99, now + 0.2);
        osc.frequency.setValueAtTime(1046.5, now + 0.3);
        gain.gain.setValueAtTime(0.22, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.45);
        osc.start(now);
        osc.stop(now + 0.45);
      } else if (type === "wrong") {
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.linearRampToValueAtTime(180, now + 0.28);
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
      }
    } catch (err) {}
  }

  getCharacterInfo(charId) {
    return (
      GAME_CONFIG.characters.find((c) => c.id === charId) ||
      GAME_CONFIG.characters[0]
    );
  }

  getSubjectInfo(subId) {
    return (
      GAME_CONFIG.subjects.find((s) => s.id === subId) ||
      GAME_CONFIG.subjects[0]
    );
  }

  formatSourceBadge(sourceType) {
    if (sourceType === "template_generator") return "⚙️ Generator Dinamis";
    if (sourceType === "custom_bank") return "📥 Bank Soal Impor";
    return "📚 Bank Soal";
  }

  renderProfileBanner() {
    if (!this.activeProfile) {
      return `
        <div class="active-profile-pill">
          <span>👤 Belum ada profil aktif</span>
        </div>
      `;
    }
    const char = this.getCharacterInfo(this.activeProfile.character);
    const diffModeLabel =
      this.settings.difficultyMode === "manual"
        ? `Manual (${(this.settings.manualDifficulty || "sedang").toUpperCase()})`
        : `Adaptif (${this.settings.adaptiveBounds || "mudah-sulit"})`;

    return `
      <div class="active-profile-pill">
        <span>${char.emoji} <strong>${this.escapeHtml(this.activeProfile.name)}</strong> (Kelas ${this.activeProfile.grade})</span>
        <span>| 🪙 ${this.activeProfile.coins || 0}</span>
        <span>| ⭐ ${this.activeProfile.stars || 0}</span>
        <span>| 🎯 ${this.escapeHtml(diffModeLabel)}</span>
      </div>
    `;
  }

  escapeHtml(str) {
    return String(str ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  formatDate(ts) {
    if (!ts) return "-";
    try {
      return new Date(ts).toLocaleString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (e) {
      return "-";
    }
  }

  stopAllGameplayScenes() {
    if (!this.phaserGame) return;
    if (this.phaserGame.scene.isActive("AdventureScene")) {
      this.phaserGame.scene.stop("AdventureScene");
    }
    if (this.phaserGame.scene.isActive("DuelScene")) {
      this.phaserGame.scene.stop("DuelScene");
    }
  }

  showMainMenu() {
    this.stopAllGameplayScenes();

    this.container.innerHTML = `
      <div class="screen-overlay">
        <div class="cloud-bg cloud-1"></div>
        <div class="cloud-bg cloud-2"></div>
        <div class="cloud-bg cloud-3"></div>

        <div class="cartoon-panel">
          <div class="game-logo-badge">🌟 GAME EDUKASI ANAK INDONESIA 🌟</div>
          <h1 class="game-title">PETUALANGAN<br/>DUNIA PINTAR</h1>
          <p class="game-subtitle">Belajar Matematika & IPAS dengan Sistem Soal Dinamis Hybrid!</p>

          ${this.renderProfileBanner()}

          <div class="btn-group-vertical">
            <button id="btn-start-game" class="btn-cartoon btn-green">🚀 Mulai Bermain</button>
            <button id="btn-profile" class="btn-cartoon btn-blue">👦 Profil Pemain</button>
            <button id="btn-tutor-panel" class="btn-cartoon btn-purple">👨‍🏫 Panel Tutor</button>
            <button id="btn-settings" class="btn-cartoon">⚙️ Pengaturan</button>
            <button id="btn-about" class="btn-cartoon btn-gray">📖 Tentang Game</button>
          </div>
        </div>
      </div>
    `;

    document.getElementById("btn-start-game").addEventListener("click", () => {
      this.playTone("click");
      if (!this.activeProfile) {
        this.showProfileMenu(true);
      } else {
        this.showGradeSelection();
      }
    });

    document.getElementById("btn-profile").addEventListener("click", () => {
      this.playTone("click");
      this.showProfileMenu(false);
    });

    document.getElementById("btn-tutor-panel").addEventListener("click", () => {
      this.playTone("click");
      this.showTutorPinGate();
    });

    document.getElementById("btn-settings").addEventListener("click", () => {
      this.playTone("click");
      this.showSettingsMenu();
    });

    document.getElementById("btn-about").addEventListener("click", () => {
      this.playTone("click");
      this.showAboutMenu();
    });
  }

  async showProfileMenu(redirectToPlay = false) {
    const profiles = await db.getAllProfiles();
    let selectedChar = "kiko";
    const studentCharacters = GAME_CONFIG.characters.filter(
      (c) => c.id !== "prof_panda",
    );

    const profileItemsHtml =
      profiles.length === 0
        ? `<p style="padding: 12px; font-weight: 700; color: #7f8c8d;">Belum ada profil tersimpan. Yuk buat profil barumu di bawah!</p>`
        : profiles
            .map((p) => {
              const char = this.getCharacterInfo(p.character);
              const isCurrent =
                this.activeProfile && this.activeProfile.id === p.id;
              return `
            <div class="profile-item" style="${isCurrent ? "background:#fff9db; border-color:#f39c12;" : ""}">
              <div class="profile-item-info">
                <span style="font-size: 2rem;">${char.emoji}</span>
                <div>
                  <div style="font-weight: 900; font-size: 1.05rem;">${this.escapeHtml(p.name)} ${isCurrent ? "✅" : ""}</div>
                  <div style="font-size: 0.84rem; font-weight: 700; color: #576574;">
                    Kelas ${p.grade} SD | 🪙 ${p.coins || 0} | ⭐ ${p.stars || 0} | 📝 ${p.totalQuestionsAnswered || 0} Soal Dijawab
                  </div>
                </div>
              </div>
              <button class="btn-cartoon btn-small ${isCurrent ? "btn-green" : "btn-blue"} btn-select-prof" data-id="${p.id}">
                ${isCurrent ? "Dipilih" : "Pilih"}
              </button>
            </div>
          `;
            })
            .join("");

    const charCardsHtml = studentCharacters
      .map(
        (c, idx) => `
      <div class="choice-card char-choice ${idx === 0 ? "selected" : ""}" data-char="${c.id}" style="padding: 10px;">
        <div style="font-size: 2.1rem;">${c.emoji}</div>
        <div style="font-weight: 900; font-size: 0.95rem;">${c.name}</div>
        <div style="font-size: 0.78rem; color: #636e72; font-weight: 600;">${c.desc}</div>
      </div>
    `,
      )
      .join("");

    this.container.innerHTML = `
      <div class="screen-overlay">
        <div class="cartoon-panel" style="max-width: 780px;">
          <h2 class="panel-header-title">👦 Pilih atau Buat Profil Siswa</h2>

          <div style="text-align: left; font-weight: 800; margin-bottom: 4px;">Daftar Profil Tersimpan:</div>
          <div class="profile-list">
            ${profileItemsHtml}
          </div>

          <div class="form-box">
            <div style="font-weight: 900; font-size: 1.08rem; margin-bottom: 8px; color: #d35400;">
              ➕ Buat Profil Siswa Baru
            </div>
            <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 10px;">
              <div class="form-group">
                <label for="inp-student-name">Nama Siswa:</label>
                <input id="inp-student-name" type="text" class="input-cartoon" placeholder="Contoh: Budi Santoso" maxlength="25" />
              </div>
              <div class="form-group">
                <label for="inp-student-grade">Kelas:</label>
                <select id="inp-student-grade" class="input-cartoon">
                  <option value="3" selected>Kelas 3 SD (Aktif)</option>
                  <option value="1" disabled>Kelas 1 SD (Coming Soon)</option>
                  <option value="2" disabled>Kelas 2 SD (Coming Soon)</option>
                  <option value="4" disabled>Kelas 4 SD (Coming Soon)</option>
                  <option value="5" disabled>Kelas 5 SD (Coming Soon)</option>
                  <option value="6" disabled>Kelas 6 SD (Coming Soon)</option>
                </select>
              </div>
            </div>

            <div class="form-group" style="margin-bottom: 8px;">
              <label>Pilih Karakter Petualang:</label>
              <div class="selection-grid-3" id="char-picker-grid" style="margin: 6px 0;">
                ${charCardsHtml}
              </div>
            </div>

            <div id="profile-err-msg" style="color: #e74c3c; font-weight: 800; margin-bottom: 8px; display: none;"></div>

            <button id="btn-save-profile" class="btn-cartoon btn-green btn-small" style="width: 100%;">
              💾 Simpan & Gunakan Profil Baru
            </button>
          </div>

          <div class="btn-group-horizontal">
            <button id="btn-back-main" class="btn-cartoon btn-gray btn-small">⬅️ Menu Utama</button>
            ${this.activeProfile ? `<button id="btn-continue-grade" class="btn-cartoon btn-blue btn-small">Lanjut Pilih Kelas ➡️</button>` : ""}
          </div>
        </div>
      </div>
    `;

    const charCards = this.container.querySelectorAll(".char-choice");
    charCards.forEach((card) => {
      card.addEventListener("click", () => {
        this.playTone("click");
        charCards.forEach((c) => c.classList.remove("selected"));
        card.classList.add("selected");
        selectedChar = card.dataset.char;
      });
    });

    this.container.querySelectorAll(".btn-select-prof").forEach((btn) => {
      btn.addEventListener("click", async () => {
        this.playTone("click");
        const profId = btn.dataset.id;
        db.setActiveProfileId(profId);
        this.activeProfile = await db.getProfileById(profId);
        if (redirectToPlay) {
          this.showGradeSelection();
        } else {
          this.showProfileMenu(false);
        }
      });
    });

    document
      .getElementById("btn-save-profile")
      .addEventListener("click", async () => {
        const nameInput = document.getElementById("inp-student-name");
        const gradeInput = document.getElementById("inp-student-grade");
        const errBox = document.getElementById("profile-err-msg");
        const cleanName = nameInput.value.trim();

        if (!cleanName) {
          this.playTone("wrong");
          errBox.textContent = "⚠️ Nama siswa tidak boleh kosong ya!";
          errBox.style.display = "block";
          nameInput.focus();
          return;
        }

        this.playTone("correct");
        this.activeProfile = await db.createProfile({
          name: cleanName,
          grade: Number(gradeInput.value) || 3,
          character: selectedChar,
        });

        if (redirectToPlay) {
          this.showGradeSelection();
        } else {
          this.showProfileMenu(false);
        }
      });

    document.getElementById("btn-back-main").addEventListener("click", () => {
      this.playTone("click");
      this.showMainMenu();
    });

    const btnCont = document.getElementById("btn-continue-grade");
    if (btnCont) {
      btnCont.addEventListener("click", () => {
        this.playTone("click");
        this.showGradeSelection();
      });
    }
  }

  showGradeSelection() {
    const gradeCardsHtml = GAME_CONFIG.classes
      .map(
        (cls) => `
      <div class="choice-card ${cls.active ? "selected" : "card-disabled"}" data-grade="${cls.grade}" data-active="${cls.active}">
        <div class="card-icon">${cls.active ? "🏫" : "🔒"}</div>
        <div class="card-title">${cls.name}</div>
        <span class="status-badge ${cls.active ? "badge-active" : "badge-soon"}">
          ${cls.statusText}
        </span>
      </div>
    `,
      )
      .join("");

    this.container.innerHTML = `
      <div class="screen-overlay">
        <div class="cartoon-panel">
          ${this.renderProfileBanner()}
          <h2 class="panel-header-title">🎒 Pilih Kelas Kamu</h2>
          <p class="game-subtitle">Saat ini petualangan tersedia untuk Kelas 3 SD!</p>

          <div class="selection-grid-3">
            ${gradeCardsHtml}
          </div>

          <div class="btn-group-horizontal">
            <button id="btn-back-main" class="btn-cartoon btn-gray btn-small">⬅️ Menu Utama</button>
          </div>
        </div>
      </div>
    `;

    this.container.querySelectorAll(".choice-card").forEach((card) => {
      card.addEventListener("click", () => {
        if (card.dataset.active !== "true") {
          this.playTone("wrong");
          return;
        }
        this.playTone("click");
        this.selectedGrade = Number(card.dataset.grade);
        this.showSubjectSelection();
      });
    });

    document.getElementById("btn-back-main").addEventListener("click", () => {
      this.playTone("click");
      this.showMainMenu();
    });
  }

  showSubjectSelection() {
    const subjectCardsHtml = GAME_CONFIG.subjects
      .map(
        (sub) => `
      <div class="choice-card ${sub.active ? "" : "card-disabled"} ${this.selectedSubject === sub.id ? "selected" : ""}" data-id="${sub.id}" data-active="${sub.active}">
        <div class="card-icon">${sub.icon}</div>
        <div class="card-title">${sub.name}</div>
        <div class="card-desc">${sub.desc}</div>
        <span class="status-badge ${sub.active ? "badge-active" : "badge-soon"}">
          ${sub.statusText}
        </span>
      </div>
    `,
      )
      .join("");

    this.container.innerHTML = `
      <div class="screen-overlay">
        <div class="cartoon-panel">
          ${this.renderProfileBanner()}
          <h2 class="panel-header-title">📚 Pilih Mata Pelajaran (Kelas ${this.selectedGrade})</h2>
          <p class="game-subtitle">Matematika dan IPAS dilengkapi Sistem Soal Dinamis Hybrid!</p>

          <div class="selection-grid">
            ${subjectCardsHtml}
          </div>

          <div class="btn-group-horizontal">
            <button id="btn-back-grade" class="btn-cartoon btn-gray btn-small">⬅️ Kembali ke Pilihan Kelas</button>
          </div>
        </div>
      </div>
    `;

    this.container.querySelectorAll(".choice-card").forEach((card) => {
      card.addEventListener("click", () => {
        if (card.dataset.active !== "true") {
          this.playTone("wrong");
          return;
        }
        this.playTone("click");
        this.selectedSubject = card.dataset.id;
        this.showModeSelection();
      });
    });

    document.getElementById("btn-back-grade").addEventListener("click", () => {
      this.playTone("click");
      this.showGradeSelection();
    });
  }

  showModeSelection() {
    this.stopAllGameplayScenes();
    const subInfo = this.getSubjectInfo(this.selectedSubject);

    const modeCardsHtml = GAME_CONFIG.modes
      .map(
        (m) => `
      <div class="choice-card ${m.active ? "selected" : "card-disabled"}" data-id="${m.id}" data-active="${m.active}">
        <div class="card-icon">${m.icon}</div>
        <div class="card-title">${m.name}</div>
        <div class="card-desc">${m.desc}</div>
        <span class="status-badge ${m.active ? "badge-active" : "badge-soon"}">
          ${m.statusText}
        </span>
      </div>
    `,
      )
      .join("");

    this.container.innerHTML = `
      <div class="screen-overlay">
        <div class="cartoon-panel">
          ${this.renderProfileBanner()}
          <h2 class="panel-header-title">🎮 Pilih Mode Permainan</h2>
          <p class="game-subtitle">
            Mata Pelajaran Aktif: <strong>${subInfo.icon} ${subInfo.name} — Kelas ${this.selectedGrade} SD</strong>
          </p>

          <div class="selection-grid">
            ${modeCardsHtml}
          </div>

          <div class="btn-group-horizontal">
            <button id="btn-back-subject" class="btn-cartoon btn-gray btn-small">⬅️ Kembali ke Mata Pelajaran</button>
          </div>
        </div>
      </div>
    `;

    this.container.querySelectorAll(".choice-card").forEach((card) => {
      card.addEventListener("click", () => {
        if (card.dataset.active !== "true") {
          this.playTone("wrong");
          return;
        }
        this.playTone("click");
        const modeId = card.dataset.id;
        if (modeId === "adventure") {
          this.startAdventureMode();
        } else if (modeId === "duel") {
          this.showDuelSetupScreen();
        }
      });
    });

    document
      .getElementById("btn-back-subject")
      .addEventListener("click", () => {
        this.playTone("click");
        this.showSubjectSelection();
      });
  }

  showSettingsMenu() {
    const isManual = this.settings.difficultyMode === "manual";

    this.container.innerHTML = `
      <div class="screen-overlay">
        <div class="cartoon-panel" style="max-width: 640px;">
          <h2 class="panel-header-title">⚙️ Pengaturan Permainan & Kesulitan</h2>

          <div class="result-stats-box" style="max-width: 100%;">
            <div class="result-stat-row" style="align-items: center;">
              <span>🔊 Efek Suara Permainan</span>
              <button id="btn-toggle-sfx" class="btn-cartoon btn-small ${this.settings.soundEffects ? "btn-green" : "btn-red"}">
                ${this.settings.soundEffects ? "AKTIF" : "MATI"}
              </button>
            </div>
            <div class="result-stat-row" style="align-items: center;">
              <span>📱 Tombol Sentuh Adventure</span>
              <button id="btn-toggle-touch" class="btn-cartoon btn-small ${this.settings.showTouchControls ? "btn-green" : "btn-red"}">
                ${this.settings.showTouchControls ? "TAMPIL" : "SEMBUNYI"}
              </button>
            </div>
            <div class="result-stat-row" style="align-items: center;">
              <span>🎯 Mode Tingkat Kesulitan Soal</span>
              <select id="sel-quick-diff-mode" class="input-cartoon" style="max-width: 240px;">
                <option value="adaptif" ${!isManual ? "selected" : ""}>🤖 Adaptif (Sesuai Performa)</option>
                <option value="manual" ${isManual ? "selected" : ""}>🖐️ Manual (Pilihan Tutor)</option>
              </select>
            </div>
            ${
              isManual
                ? `
              <div class="result-stat-row" style="align-items: center; border-bottom: none;">
                <span>⚡ Tingkat Kesulitan Manual</span>
                <select id="sel-quick-manual-lvl" class="input-cartoon" style="max-width: 240px;">
                  <option value="mudah" ${this.settings.manualDifficulty === "mudah" ? "selected" : ""}>Mudah</option>
                  <option value="sedang" ${this.settings.manualDifficulty === "sedang" ? "selected" : ""}>Sedang</option>
                  <option value="sulit" ${this.settings.manualDifficulty === "sulit" ? "selected" : ""}>Sulit</option>
                </select>
              </div>
            `
                : `
              <div class="result-stat-row" style="align-items: center; border-bottom: none;">
                <span>🛡️ Batas Adaptif Tutor</span>
                <select id="sel-quick-bounds" class="input-cartoon" style="max-width: 240px;">
                  <option value="mudah-sulit" ${this.settings.adaptiveBounds === "mudah-sulit" ? "selected" : ""}>Mudah s/d Sulit</option>
                  <option value="mudah-sedang" ${this.settings.adaptiveBounds === "mudah-sedang" ? "selected" : ""}>Mudah s/d Sedang</option>
                  <option value="sedang-sulit" ${this.settings.adaptiveBounds === "sedang-sulit" ? "selected" : ""}>Sedang s/d Sulit</option>
                </select>
              </div>
            `
            }
          </div>

          <div class="btn-group-horizontal">
            <button id="btn-back-main" class="btn-cartoon btn-blue btn-small">⬅️ Kembali ke Menu Utama</button>
          </div>
        </div>
      </div>
    `;

    document
      .getElementById("btn-toggle-sfx")
      .addEventListener("click", async () => {
        this.settings.soundEffects = !this.settings.soundEffects;
        await db.saveSettings(this.settings);
        this.playTone("click");
        this.showSettingsMenu();
      });

    document
      .getElementById("btn-toggle-touch")
      .addEventListener("click", async () => {
        this.settings.showTouchControls = !this.settings.showTouchControls;
        await db.saveSettings(this.settings);
        this.playTone("click");
        this.showSettingsMenu();
      });

    document
      .getElementById("sel-quick-diff-mode")
      .addEventListener("change", async (e) => {
        this.settings.difficultyMode = e.target.value;
        await db.saveSettings(this.settings);
        this.playTone("click");
        this.showSettingsMenu();
      });

    const manualSel = document.getElementById("sel-quick-manual-lvl");
    if (manualSel) {
      manualSel.addEventListener("change", async (e) => {
        this.settings.manualDifficulty = e.target.value;
        await db.saveSettings(this.settings);
        this.playTone("click");
      });
    }

    const boundsSel = document.getElementById("sel-quick-bounds");
    if (boundsSel) {
      boundsSel.addEventListener("change", async (e) => {
        this.settings.adaptiveBounds = e.target.value;
        await db.saveSettings(this.settings);
        this.playTone("click");
      });
    }

    document.getElementById("btn-back-main").addEventListener("click", () => {
      this.playTone("click");
      this.showMainMenu();
    });
  }

  showAboutMenu() {
    this.container.innerHTML = `
      <div class="screen-overlay">
        <div class="cartoon-panel" style="max-width: 740px;">
          <h2 class="panel-header-title">📖 Tentang Petualangan Dunia Pintar</h2>
          <div class="form-box" style="font-size: 0.96rem; line-height: 1.55; font-weight: 700;">
            <p style="margin-bottom: 8px;">
              <strong>Petualangan Dunia Pintar (Hybrid Question Engine Edition)</strong> adalah game edukasi interaktif Kelas 3 SD untuk mata pelajaran <strong>Matematika</strong> dan <strong>IPAS</strong> yang berjalan 100% Offline.
            </p>
            <p style="margin-bottom: 8px;">
              🧠 <strong>Hybrid Question System:</strong> Menggabungkan <em>Template Question Generator</em> (variasi angka, nama, benda, dan konteks otomatis tanpa batas) dan <em>Question Bank</em> tervalidasi.
            </p>
            <p style="margin-bottom: 8px;">
              🎯 <strong>Kesulitan Manual & Adaptif per Topik:</strong> Pada mode Adaptif, tingkat kesulitan menyesuaikan akurasi 5 soal terakhir siswa pada tiap topik di dalam batas yang ditentukan Tutor.
            </p>
            <p>
              👨‍🏫 <strong>Panel Tutor:</strong> Dilengkapi analitik performa per topik, log perubahan adaptif, impor/ekspor Bank Soal JSON, pengujian otomatis (<em>Self-Test</em>), dan <em>Backup/Restore</em> data (PIN Bawaan: <strong>1234</strong>).
            </p>
          </div>
          <div class="btn-group-horizontal">
            <button id="btn-back-main" class="btn-cartoon btn-blue btn-small">⬅️ Kembali ke Menu Utama</button>
          </div>
        </div>
      </div>
    `;

    document.getElementById("btn-back-main").addEventListener("click", () => {
      this.playTone("click");
      this.showMainMenu();
    });
  }

  startAdventureMode() {
    this.stopAllGameplayScenes();
    const charInfo = this.getCharacterInfo(this.activeProfile?.character);
    const subInfo = this.getSubjectInfo(this.selectedSubject);

    this.renderAdventureHUD({
      characterEmoji: charInfo.emoji,
      playerName: this.activeProfile?.name || "Petualang",
      subjectName: subInfo.name,
      coins: 0,
      correctCount: 0,
      totalChallenges: 4,
    });

    this.phaserGame.scene.start("AdventureScene", {
      profile: this.activeProfile,
      subject: this.selectedSubject,
    });
  }

  renderAdventureHUD(stats) {
    const modeLabel =
      this.settings.difficultyMode === "manual"
        ? `Manual: ${(this.settings.manualDifficulty || "sedang").toUpperCase()}`
        : `Adaptif (${this.settings.adaptiveBounds || "mudah-sulit"})`;

    this.container.innerHTML = `
      <div class="hud-overlay" id="adventure-hud">
        <div class="hud-top-bar">
          <div class="hud-stats-group">
            <div class="hud-pill">
              <span>${stats.characterEmoji} ${this.escapeHtml(stats.playerName)}</span>
            </div>
            <div class="hud-pill" style="background: #eef9ff;">
              <span>📘 ${this.escapeHtml(stats.subjectName)} (${this.escapeHtml(modeLabel)})</span>
            </div>
            <div class="hud-pill" style="background: #fff9db;">
              <span>🪙 Koin: <span id="hud-coin-val">${stats.coins}</span></span>
            </div>
            <div class="hud-pill" style="background: #e8f8f5;">
              <span>🧩 Misi: <span id="hud-quest-val">${stats.correctCount}/${stats.totalChallenges}</span></span>
            </div>
          </div>

          <button id="btn-hud-exit" class="btn-cartoon btn-red btn-small" style="pointer-events: auto;">
            🏠 Keluar Level
          </button>
        </div>

        <div id="hud-hint-banner" style="align-self: center; background: rgba(44,62,80,0.9); color: #fff; padding: 8px 20px; border-radius: 30px; font-weight: 800; font-size: 1rem; display: none;">
        </div>

        ${
          this.settings.showTouchControls
            ? `
          <div class="hud-touch-controls">
            <div class="touch-dpad">
              <button id="touch-left" class="btn-touch" aria-label="Kiri">◀</button>
              <button id="touch-right" class="btn-touch" aria-label="Kanan">▶</button>
            </div>
            <button id="touch-jump" class="btn-touch btn-touch-jump" aria-label="Lompat">LOMPAT ▲</button>
          </div>
        `
            : "<div></div>"
        }
      </div>
    `;

    document.getElementById("btn-hud-exit").addEventListener("click", () => {
      this.playTone("click");
      this.showModeSelection();
    });

    this.bindTouchButtons();
  }

  updateAdventureHUD({ coins, correctCount, totalChallenges, hintText }) {
    const coinEl = document.getElementById("hud-coin-val");
    const questEl = document.getElementById("hud-quest-val");
    const hintEl = document.getElementById("hud-hint-banner");

    if (coinEl && coins !== undefined) coinEl.textContent = coins;
    if (questEl && correctCount !== undefined) {
      questEl.textContent = `${correctCount}/${totalChallenges}`;
    }
    if (hintEl) {
      if (hintText) {
        hintEl.textContent = hintText;
        hintEl.style.display = "block";
      } else {
        hintEl.style.display = "none";
      }
    }
  }

  bindTouchButtons() {
    const btnLeft = document.getElementById("touch-left");
    const btnRight = document.getElementById("touch-right");
    const btnJump = document.getElementById("touch-jump");

    if (!btnLeft || !btnRight || !btnJump) return;

    const setInputState = (key, val) => {
      const scene = this.phaserGame?.scene.getScene("AdventureScene");
      if (scene && scene.touchState) {
        scene.touchState[key] = val;
      }
    };

    ["mousedown", "touchstart"].forEach((evt) => {
      btnLeft.addEventListener(evt, (e) => {
        e.preventDefault();
        setInputState("left", true);
      });
      btnRight.addEventListener(evt, (e) => {
        e.preventDefault();
        setInputState("right", true);
      });
      btnJump.addEventListener(evt, (e) => {
        e.preventDefault();
        setInputState("jump", true);
      });
    });

    ["mouseup", "mouseleave", "touchend", "touchcancel"].forEach((evt) => {
      btnLeft.addEventListener(evt, (e) => {
        e.preventDefault();
        setInputState("left", false);
      });
      btnRight.addEventListener(evt, (e) => {
        e.preventDefault();
        setInputState("right", false);
      });
      btnJump.addEventListener(evt, (e) => {
        e.preventDefault();
        setInputState("jump", false);
      });
    });
  }

  showQuestionModal({ questionData, triggerTitle, onComplete }) {
    const letters = ["A", "B", "C", "D"];
    const modalWrapper = document.createElement("div");
    modalWrapper.className = "modal-backdrop";
    modalWrapper.id = "active-quiz-modal";

    const optionsHtml = questionData.options
      .map(
        (opt, idx) => `
      <button class="btn-option" data-answer="${this.escapeHtml(opt)}">
        <span class="option-letter">${letters[idx] || idx + 1}</span>
        <span>${this.escapeHtml(opt)}</span>
      </button>
    `,
      )
      .join("");

    const sourceBadgeText = this.formatSourceBadge(questionData.sourceType);
    const modeBadgeText =
      questionData.adaptiveMeta?.mode === "adaptif"
        ? `🤖 Adaptif: ${questionData.difficulty.toUpperCase()}`
        : `🖐️ Manual: ${questionData.difficulty.toUpperCase()}`;

    modalWrapper.innerHTML = `
      <div class="quiz-panel">
        <div class="quiz-header-badges">
          <span class="status-badge badge-active" style="font-size: 0.85rem;">
            ${this.escapeHtml(triggerTitle || "Tantangan Soal")}
          </span>
          <span class="status-badge" style="background: #e8f8f5; color: #117a65;">
            ${this.escapeHtml(sourceBadgeText)}
          </span>
          <span class="status-badge" style="background: #fff3cd; color: #856404;">
            ${this.escapeHtml(questionData.topic)} | ${this.escapeHtml(modeBadgeText)}
          </span>
        </div>

        <div class="quiz-question-box">
          ${this.escapeHtml(questionData.question)}
        </div>

        <div class="quiz-options-grid" id="quiz-options-container">
          ${optionsHtml}
        </div>

        <div id="quiz-feedback-area" style="display: none;"></div>

        <div class="btn-group-horizontal" id="quiz-action-buttons" style="display: none; margin-top: 12px;">
          <button id="btn-quiz-continue" class="btn-cartoon btn-green btn-small">Lanjutkan Petualangan ➡️</button>
        </div>
      </div>
    `;

    this.container.appendChild(modalWrapper);

    let answered = false;
    let selectedAnswerText = "";
    const optionButtons = modalWrapper.querySelectorAll(".btn-option");
    const feedbackArea = modalWrapper.querySelector("#quiz-feedback-area");
    const actionArea = modalWrapper.querySelector("#quiz-action-buttons");
    const btnContinue = modalWrapper.querySelector("#btn-quiz-continue");

    optionButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        if (answered) return;
        answered = true;

        selectedAnswerText = btn.dataset.answer;
        const isCorrect = selectedAnswerText === questionData.correctAnswer;

        optionButtons.forEach((b) => {
          b.disabled = true;
          if (b.dataset.answer === questionData.correctAnswer) {
            b.classList.add("correct");
          }
        });

        if (isCorrect) {
          this.playTone("correct");
          btn.classList.add("correct");
          feedbackArea.className = "quiz-feedback-box feedback-correct";
          feedbackArea.innerHTML = `
            <div>🎉 <strong>HEBAT! Jawaban Kamu Benar! (+25 Koin)</strong></div>
            <div style="margin-top: 4px; font-weight: 600;">💡 Pembahasan: ${this.escapeHtml(questionData.explanation)}</div>
          `;
        } else {
          this.playTone("wrong");
          btn.classList.add("wrong");
          feedbackArea.className = "quiz-feedback-box feedback-wrong";
          feedbackArea.innerHTML = `
            <div>💪 <strong>Belum Tepat, Jangan Menyerah Ya!</strong></div>
            <div style="margin-top: 4px;">Jawaban yang benar adalah: <strong>${this.escapeHtml(questionData.correctAnswer)}</strong></div>
            <div style="margin-top: 4px; font-weight: 600;">💡 Petunjuk & Pembahasan: ${this.escapeHtml(questionData.explanation)}</div>
          `;
        }

        feedbackArea.style.display = "block";
        actionArea.style.display = "flex";

        btnContinue.onclick = () => {
          this.playTone("click");
          modalWrapper.remove();
          onComplete(isCorrect, selectedAnswerText);
        };
      });
    });
  }

  async showAdventureResult(resultData) {
    this.playTone("correct");

    if (this.activeProfile) {
      this.activeProfile = await db.recordAdventureResult(
        this.activeProfile.id,
        resultData,
      );
    }

    const starIcons =
      "⭐".repeat(resultData.starsEarned) +
      "☆".repeat(3 - resultData.starsEarned);

    this.container.innerHTML = `
      <div class="screen-overlay">
        <div class="cartoon-panel" style="max-width: 620px;">
          <div class="game-logo-badge">🏆 LEVEL SELESAI! 🏆</div>
          <h2 class="panel-header-title" style="margin-bottom: 4px;">${this.escapeHtml(resultData.levelTitle)}</h2>
          <div class="stars-display">${starIcons}</div>

          <div class="result-stats-box">
            <div class="result-stat-row">
              <span>🪙 Total Koin Diperoleh:</span>
              <span style="color: #d35400;">+${resultData.coinsEarned} Koin</span>
            </div>
            <div class="result-stat-row">
              <span>✅ Jawaban Soal Benar:</span>
              <span style="color: #27ae60;">${resultData.correctCount} Soal</span>
            </div>
            <div class="result-stat-row">
              <span>❌ Jawaban Soal Salah:</span>
              <span style="color: #c0392b;">${resultData.wrongCount} Soal</span>
            </div>
            <div class="result-stat-row">
              <span>⭐ Bintang Diperoleh:</span>
              <span style="color: #f39c12;">${resultData.starsEarned} / 3 Bintang</span>
            </div>
            <div class="result-stat-row">
              <span>🏅 Badge Penghargaan:</span>
              <span style="color: #8e44ad;">${this.escapeHtml(resultData.badgeEarned)}</span>
            </div>
            <div class="result-stat-row" style="border-bottom: none;">
              <span>💎 Item Koleksi:</span>
              <span style="color: #16a085;">${this.escapeHtml(resultData.collectibleItem || "-")}</span>
            </div>
          </div>

          <div class="btn-group-horizontal">
            <button id="btn-play-again" class="btn-cartoon btn-green">🔄 Main Lagi</button>
            <button id="btn-back-menu" class="btn-cartoon btn-blue">🏠 Kembali ke Menu</button>
          </div>
        </div>
      </div>
    `;

    document.getElementById("btn-play-again").addEventListener("click", () => {
      this.playTone("click");
      this.startAdventureMode();
    });

    document.getElementById("btn-back-menu").addEventListener("click", () => {
      this.playTone("click");
      this.showMainMenu();
    });
  }

  showDuelSetupScreen() {
    this.stopAllGameplayScenes();

    let chosenSubject = this.selectedSubject || "matematika";
    let chosenTopic = "semua";
    let chosenDifficulty =
      this.settings.difficultyMode === "manual"
        ? this.settings.manualDifficulty
        : "adaptif";
    let chosenBounds = this.settings.adaptiveBounds || "mudah-sulit";
    let chosenRounds = 5;
    let tutorChar = "prof_panda";
    let studentChar = this.activeProfile?.character || "kiko";

    const renderSetupHTML = () => {
      const topics = questionManager.getTopicsBySubject(chosenSubject);
      const topicOptionsHtml = [
        `<option value="semua">Semua Topik (${chosenSubject.toUpperCase()})</option>`,
        ...topics.map(
          (t) =>
            `<option value="${this.escapeHtml(t)}" ${chosenTopic === t ? "selected" : ""}>${this.escapeHtml(t)}</option>`,
        ),
      ].join("");

      const tutorCharCards = GAME_CONFIG.characters
        .map(
          (c) => `
        <div class="choice-card tutor-char-card ${tutorChar === c.id ? "selected" : ""}" data-char="${c.id}" style="padding: 8px;">
          <div style="font-size: 1.8rem;">${c.emoji}</div>
          <div style="font-weight: 800; font-size: 0.85rem;">${c.name}</div>
        </div>
      `,
        )
        .join("");

      const studentCharCards = GAME_CONFIG.characters
        .map(
          (c) => `
        <div class="choice-card student-char-card ${studentChar === c.id ? "selected" : ""}" data-char="${c.id}" style="padding: 8px;">
          <div style="font-size: 1.8rem;">${c.emoji}</div>
          <div style="font-weight: 800; font-size: 0.85rem;">${c.name}</div>
        </div>
      `,
        )
        .join("");

      this.container.innerHTML = `
        <div class="screen-overlay">
          <div class="cartoon-panel" style="max-width: 880px;">
            <div class="game-logo-badge">⚔️ MODE KOMPETISI 1 LAYAR (HOT SEAT SETARA) ⚔️</div>
            <h2 class="panel-header-title" style="margin-bottom: 6px;">Persiapan Duel: Tutor vs Murid</h2>

            <div class="form-box">
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 10px;">
                <div class="form-group">
                  <label for="duel-sel-subject">📘 Mata Pelajaran:</label>
                  <select id="duel-sel-subject" class="input-cartoon">
                    <option value="matematika" ${chosenSubject === "matematika" ? "selected" : ""}>📐 Matematika Kelas 3</option>
                    <option value="ipas" ${chosenSubject === "ipas" ? "selected" : ""}>🌿 IPAS Kelas 3</option>
                  </select>
                </div>

                <div class="form-group">
                  <label for="duel-sel-topic">🧩 Topik Materi:</label>
                  <select id="duel-sel-topic" class="input-cartoon">
                    ${topicOptionsHtml}
                  </select>
                </div>

                <div class="form-group">
                  <label for="duel-sel-diff">🎯 Mode & Tingkat Kesulitan:</label>
                  <select id="duel-sel-diff" class="input-cartoon">
                    <option value="adaptif" ${chosenDifficulty === "adaptif" ? "selected" : ""}>🤖 Adaptif Setara (Otomatis)</option>
                    <option value="mudah" ${chosenDifficulty === "mudah" ? "selected" : ""}>🖐️ Manual: Mudah</option>
                    <option value="sedang" ${chosenDifficulty === "sedang" ? "selected" : ""}>🖐️ Manual: Sedang</option>
                    <option value="sulit" ${chosenDifficulty === "sulit" ? "selected" : ""}>🖐️ Manual: Sulit</option>
                  </select>
                </div>

                ${
                  chosenDifficulty === "adaptif"
                    ? `
                  <div class="form-group">
                    <label for="duel-sel-bounds">🛡️ Batas Adaptif Tutor:</label>
                    <select id="duel-sel-bounds" class="input-cartoon">
                      <option value="mudah-sulit" ${chosenBounds === "mudah-sulit" ? "selected" : ""}>Mudah s/d Sulit</option>
                      <option value="mudah-sedang" ${chosenBounds === "mudah-sedang" ? "selected" : ""}>Mudah s/d Sedang</option>
                      <option value="sedang-sulit" ${chosenBounds === "sedang-sulit" ? "selected" : ""}>Sedang s/d Sulit</option>
                    </select>
                  </div>
                `
                    : ""
                }

                <div class="form-group">
                  <label for="duel-sel-rounds">🏁 Jumlah Ronde:</label>
                  <select id="duel-sel-rounds" class="input-cartoon">
                    <option value="5" ${chosenRounds === 5 ? "selected" : ""}>5 Ronde (Cepat)</option>
                    <option value="10" ${chosenRounds === 10 ? "selected" : ""}>10 Ronde (Maraton)</option>
                  </select>
                </div>
              </div>

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-top: 6px;">
                <div>
                  <label style="font-weight: 800; display: block; margin-bottom: 4px;">👨‍🏫 Karakter Tutor:</label>
                  <div class="selection-grid-4">
                    ${tutorCharCards}
                  </div>
                </div>
                <div>
                  <label style="font-weight: 800; display: block; margin-bottom: 4px;">🧒 Karakter Murid (${this.escapeHtml(this.activeProfile?.name || "Murid")}):</label>
                  <div class="selection-grid-4">
                    ${studentCharCards}
                  </div>
                </div>
              </div>
            </div>

            <div class="btn-group-horizontal">
              <button id="btn-back-mode" class="btn-cartoon btn-gray btn-small">⬅️ Kembali</button>
              <button id="btn-start-duel-match" class="btn-cartoon btn-green">🏁 Mulai Pertandingan Duel!</button>
            </div>
          </div>
        </div>
      `;

      document
        .getElementById("duel-sel-subject")
        .addEventListener("change", (e) => {
          this.playTone("click");
          chosenSubject = e.target.value;
          this.selectedSubject = chosenSubject;
          chosenTopic = "semua";
          renderSetupHTML();
        });

      document
        .getElementById("duel-sel-topic")
        .addEventListener("change", (e) => {
          chosenTopic = e.target.value;
        });

      document
        .getElementById("duel-sel-diff")
        .addEventListener("change", (e) => {
          this.playTone("click");
          chosenDifficulty = e.target.value;
          renderSetupHTML();
        });

      const boundsEl = document.getElementById("duel-sel-bounds");
      if (boundsEl) {
        boundsEl.addEventListener("change", (e) => {
          chosenBounds = e.target.value;
        });
      }

      document
        .getElementById("duel-sel-rounds")
        .addEventListener("change", (e) => {
          chosenRounds = Number(e.target.value);
        });

      this.container.querySelectorAll(".tutor-char-card").forEach((card) => {
        card.addEventListener("click", () => {
          this.playTone("click");
          tutorChar = card.dataset.char;
          renderSetupHTML();
        });
      });

      this.container.querySelectorAll(".student-char-card").forEach((card) => {
        card.addEventListener("click", () => {
          this.playTone("click");
          studentChar = card.dataset.char;
          renderSetupHTML();
        });
      });

      document.getElementById("btn-back-mode").addEventListener("click", () => {
        this.playTone("click");
        this.showModeSelection();
      });

      document
        .getElementById("btn-start-duel-match")
        .addEventListener("click", async () => {
          this.playTone("correct");
          this.settings.adaptiveBounds = chosenBounds;
          if (chosenDifficulty === "adaptif") {
            this.settings.difficultyMode = "adaptif";
          } else {
            this.settings.difficultyMode = "manual";
            this.settings.manualDifficulty = chosenDifficulty;
          }
          await db.saveSettings(this.settings);

          this.startDuelMatch({
            subject: chosenSubject,
            topic: chosenTopic,
            difficulty: chosenDifficulty,
            adaptiveBounds: chosenBounds,
            rounds: chosenRounds,
            tutorCharacter: tutorChar,
            studentCharacter: studentChar,
          });
        });
    };

    renderSetupHTML();
  }

  startDuelMatch(config) {
    questionManager.resetSession();

    const studentName = this.activeProfile?.name || "Murid";

    this.duelSession = {
      subject: config.subject,
      topic: config.topic,
      difficulty: config.difficulty,
      adaptiveBounds: config.adaptiveBounds || "mudah-sulit",
      totalRounds: config.rounds,
      currentRound: 1,
      tutorCharacter: config.tutorCharacter,
      studentCharacter: config.studentCharacter,
      studentName,
      currentPair: null,
      answerLog: [],
      tutorStats: {
        correct: 0,
        wrong: 0,
        streak: 0,
        totalTimeMs: 0,
      },
      studentStats: {
        correct: 0,
        wrong: 0,
        streak: 0,
        totalTimeMs: 0,
        masteredSet: new Set(),
        reviewSet: new Set(),
      },
    };

    if (this.phaserGame.scene.isActive("DuelScene")) {
      this.phaserGame.scene.stop("DuelScene");
    }
    this.phaserGame.scene.start("DuelScene", {
      rounds: config.rounds,
      tutorCharacter: config.tutorCharacter,
      studentCharacter: config.studentCharacter,
      studentName,
    });

    this.prepareNextDuelRound();
  }

  prepareNextDuelRound() {
    const s = this.duelSession;
    s.currentPair = questionManager.getDuelQuestionPair({
      subject: s.subject,
      topic: s.topic,
      difficulty: s.difficulty,
      profile: this.activeProfile,
      settings: {
        ...this.settings,
        adaptiveBounds: s.adaptiveBounds,
      },
    });

    this.showHotSeatTransition("tutor");
  }

  showHotSeatTransition(turnRole) {
    const s = this.duelSession;
    const isTutor = turnRole === "tutor";
    const charInfo = this.getCharacterInfo(
      isTutor ? s.tutorCharacter : s.studentCharacter,
    );
    const subInfo = this.getSubjectInfo(s.subject);

    const headingText = isTutor
      ? "👨‍🏫 SEKARANG GILIRAN TUTOR!"
      : `🧒 SEKARANG GILIRAN ${this.escapeHtml(s.studentName.toUpperCase())}!`;

    const instructionText = isTutor
      ? "Serahkan laptop kepada Tutor. Pastikan layar siap untuk memulai ronde baru."
      : "Serahkan laptop kepada Murid. Soal Tutor sebelumnya telah disembunyikan sepenuhnya.";

    const buttonLabel = isTutor
      ? "🚀 MULAI GILIRAN TUTOR"
      : "🚀 MULAI GILIRAN MURID";

    const roundDiffLabel = (
      s.currentPair?.roundDifficulty || "sedang"
    ).toUpperCase();
    const roundTopicLabel = s.currentPair?.roundTopic || s.topic;

    this.container.innerHTML = `
      <div class="hotseat-screen">
        <div class="hotseat-card">
          <div class="game-logo-badge">
            ${subInfo.icon} ${subInfo.name.toUpperCase()} — RONDE ${s.currentRound} DARI ${s.totalRounds}
          </div>
          <div style="margin-top: 8px;">
            <div class="hotseat-avatar-badge">${charInfo.emoji}</div>
          </div>
          <h2 class="panel-header-title" style="color: ${isTutor ? "#2980b9" : "#d35400"}; margin-bottom: 8px;">
            ${headingText}
          </h2>
          <p class="game-subtitle" style="font-size: 1.05rem; margin-bottom: 12px;">
            ${instructionText}
          </p>
          <div style="background: #eef9ff; border: 2px dashed #3498db; border-radius: 14px; padding: 10px; margin-bottom: 16px; font-weight: 700; font-size: 0.9rem;">
            🔒 <strong>Anti-Meniru & Keadilan Setara:</strong> Topik ronde ini adalah <strong>${this.escapeHtml(roundTopicLabel)}</strong> dengan tingkat kesulitan setara <strong>${this.escapeHtml(roundDiffLabel)}</strong> untuk kedua pemain.
          </div>

          <div class="btn-group-horizontal">
            <button id="btn-abort-duel" class="btn-cartoon btn-gray btn-small">🏠 Keluar Duel</button>
            <button id="btn-start-turn" class="btn-cartoon ${isTutor ? "btn-blue" : "btn-green"}">
              ${buttonLabel}
            </button>
          </div>
        </div>
      </div>
    `;

    document.getElementById("btn-abort-duel").addEventListener("click", () => {
      this.playTone("click");
      this.showModeSelection();
    });

    document.getElementById("btn-start-turn").addEventListener("click", () => {
      this.playTone("click");
      this.showDuelQuestionTurn(turnRole);
    });
  }

  showDuelQuestionTurn(turnRole) {
    const s = this.duelSession;
    const isTutor = turnRole === "tutor";
    const qData = isTutor
      ? s.currentPair.tutorQuestion
      : s.currentPair.studentQuestion;
    const charInfo = this.getCharacterInfo(
      isTutor ? s.tutorCharacter : s.studentCharacter,
    );
    const playerName = isTutor ? "Tutor" : s.studentName;
    const letters = ["A", "B", "C", "D"];

    const duelScene = this.phaserGame.scene.getScene("DuelScene");
    const posInfo = duelScene
      ? duelScene.getRacePositions()
      : { tutorPct: 0, studentPct: 0 };

    const optionsHtml = qData.options
      .map(
        (opt, idx) => `
      <button class="btn-option duel-opt-btn" data-answer="${this.escapeHtml(opt)}">
        <span class="option-letter">${letters[idx] || idx + 1}</span>
        <span>${this.escapeHtml(opt)}</span>
      </button>
    `,
      )
      .join("");

    this.container.innerHTML = `
      <div class="hud-overlay" style="padding: 12px 18px;">
        <div class="hud-top-bar">
          <div class="hud-stats-group">
            <div class="hud-pill" style="background: #fff9db;">
              <span>🏁 Ronde <strong>${s.currentRound}/${s.totalRounds}</strong></span>
            </div>
            <div class="hud-pill" style="background: ${isTutor ? "#d6eaf8" : "#fdebd0"};">
              <span>${charInfo.emoji} Giliran: <strong>${this.escapeHtml(playerName)}</strong></span>
            </div>
            <div class="hud-pill">
              <span>👨‍🏫 Tutor: ${posInfo.tutorPct}% | 🧒 ${this.escapeHtml(s.studentName)}: ${posInfo.studentPct}%</span>
            </div>
          </div>
          <button id="btn-duel-quit" class="btn-cartoon btn-red btn-small" style="pointer-events: auto;">
            ✖ Keluar
          </button>
        </div>

        <div class="duel-modal-backdrop" style="background: transparent; padding: 0;">
          <div class="quiz-panel" id="duel-question-card" style="max-width: 860px; padding: 16px 22px;">
            <div class="quiz-header-badges">
              <span class="status-badge badge-active">
                ${charInfo.emoji} SOAL UNTUK ${this.escapeHtml(playerName.toUpperCase())}
              </span>
              <span class="status-badge" style="background: #e8f8f5; color: #117a65;">
                ${this.escapeHtml(this.formatSourceBadge(qData.sourceType))}
              </span>
              <span class="status-badge" style="background: #fff3cd; color: #856404;">
                Topik: ${this.escapeHtml(qData.topic)} (${this.escapeHtml(qData.difficulty.toUpperCase())})
              </span>
            </div>

            <div class="quiz-question-box" style="font-size: 1.18rem; padding: 12px; margin-bottom: 10px;">
              ${this.escapeHtml(qData.question)}
            </div>

            <div class="quiz-options-grid" style="margin-bottom: 4px;">
              ${optionsHtml}
            </div>
          </div>
        </div>
      </div>
    `;

    document.getElementById("btn-duel-quit").addEventListener("click", () => {
      this.playTone("click");
      this.showModeSelection();
    });

    const turnStartTime = performance.now();
    let locked = false;

    this.container.querySelectorAll(".duel-opt-btn").forEach((btn) => {
      btn.addEventListener("click", async () => {
        if (locked) return;
        locked = true;

        const elapsedMs = Math.max(
          200,
          Math.round(performance.now() - turnStartTime),
        );
        const chosenAnswer = btn.dataset.answer;
        const isCorrect = chosenAnswer === qData.correctAnswer;

        if (isCorrect) {
          this.playTone("correct");
        } else {
          this.playTone("wrong");
        }

        s.answerLog.push({
          round: s.currentRound,
          role: turnRole,
          questionId: qData.id,
          topic: qData.topic,
          difficulty: qData.difficulty,
          sourceType: qData.sourceType || "question_bank",
          isCorrect,
          timeMs: elapsedMs,
        });

        if (isTutor) {
          s.tutorStats.totalTimeMs += elapsedMs;
          if (isCorrect) {
            s.tutorStats.correct += 1;
            s.tutorStats.streak += 1;
          } else {
            s.tutorStats.wrong += 1;
            s.tutorStats.streak = 0;
          }
        } else {
          s.studentStats.totalTimeMs += elapsedMs;
          if (isCorrect) {
            s.studentStats.correct += 1;
            s.studentStats.streak += 1;
            s.studentStats.masteredSet.add(qData.topic);
          } else {
            s.studentStats.wrong += 1;
            s.studentStats.streak = 0;
            s.studentStats.reviewSet.add(qData.topic);
          }

          if (this.activeProfile) {
            this.activeProfile = await db.recordQuestionAttempt(
              this.activeProfile.id,
              {
                questionId: qData.id,
                subject: s.subject,
                topic: qData.topic,
                difficulty: qData.difficulty,
                sourceType: qData.sourceType,
                isCorrect,
                mode: "duel",
              },
              { ...this.settings, adaptiveBounds: s.adaptiveBounds },
            );
          }
        }

        const qCard = document.getElementById("duel-question-card");
        if (qCard) {
          qCard.innerHTML = `
            <div style="padding: 16px;">
              <h3 style="font-size: 1.4rem; font-weight: 900; color: ${isCorrect ? "#27ae60" : "#e67e22"};">
                ${
                  isCorrect
                    ? `🎉 JAWABAN BENAR! Karakter ${this.escapeHtml(playerName)} Bergerak Maju!`
                    : `💪 Belum Tepat! Karakter ${this.escapeHtml(playerName)} Tetap Bertahan di Posisinya!`
                }
              </h3>
              <p style="margin-top: 6px; font-weight: 700; color: #576574;">
                Soal telah disembunyikan secara otomatis untuk menjaga kerahasiaan giliran berikutnya.
              </p>
            </div>
          `;
        }

        const currentStreak = isTutor
          ? s.tutorStats.streak
          : s.studentStats.streak;

        if (duelScene) {
          duelScene.animateRunnerMove({
            role: turnRole,
            isCorrect,
            streak: currentStreak,
            onComplete: (reachedFinish) => {
              setTimeout(() => {
                this.advanceDuelTurnState(turnRole, reachedFinish);
              }, 650);
            },
          });
        } else {
          this.advanceDuelTurnState(turnRole, false);
        }
      });
    });
  }

  advanceDuelTurnState(completedRole, reachedFinish) {
    const s = this.duelSession;

    if (completedRole === "tutor") {
      this.showHotSeatTransition("student");
      return;
    }

    const duelScene = this.phaserGame.scene.getScene("DuelScene");
    const pos = duelScene
      ? duelScene.getRacePositions()
      : {
          tutorStep: s.tutorStats.correct,
          studentStep: s.studentStats.correct,
        };

    const someoneFinished =
      pos.tutorStep >= s.totalRounds || pos.studentStep >= s.totalRounds;
    const allRoundsDone = s.currentRound >= s.totalRounds;

    if (someoneFinished || allRoundsDone || reachedFinish) {
      this.showDuelMatchResult();
    } else {
      s.currentRound += 1;
      this.prepareNextDuelRound();
    }
  }

  async showDuelMatchResult() {
    this.playTone("correct");
    const s = this.duelSession;
    const duelScene = this.phaserGame.scene.getScene("DuelScene");
    const pos = duelScene
      ? duelScene.getRacePositions()
      : {
          tutorStep: s.tutorStats.correct,
          studentStep: s.studentStats.correct,
          tutorPct: Math.round((s.tutorStats.correct / s.totalRounds) * 100),
          studentPct: Math.round(
            (s.studentStats.correct / s.totalRounds) * 100,
          ),
        };

    let winner = "draw";
    let bannerTitle = "🤝 PERTANDINGAN SERI! SAMA-SAMA HEBAT!";
    let encouragingMsg =
      "Luar biasa! Tutor dan Murid sama-sama tangguh di lintasan balap!";

    if (pos.studentStep > pos.tutorStep) {
      winner = "student";
      bannerTitle = `🏆 PEMENANG: ${s.studentName.toUpperCase()}!`;
      encouragingMsg = `Selamat ${s.studentName}! Kamu berhasil melesat memimpin balapan dengan sangat cerdas!`;
    } else if (pos.tutorStep > pos.studentStep) {
      winner = "tutor";
      bannerTitle = "🏆 PEMENANG: TUTOR!";
      encouragingMsg = `Usaha yang sangat hebat, ${s.studentName}! Kamu sudah menjawab banyak tantangan dengan berani. Yuk terus berlatih!`;
    }

    const tutorTotalAns = s.tutorStats.correct + s.tutorStats.wrong;
    const studentTotalAns = s.studentStats.correct + s.studentStats.wrong;

    const tutorAcc =
      tutorTotalAns > 0
        ? Math.round((s.tutorStats.correct / tutorTotalAns) * 100)
        : 0;
    const studentAcc =
      studentTotalAns > 0
        ? Math.round((s.studentStats.correct / studentTotalAns) * 100)
        : 0;

    const tutorAvgSec =
      tutorTotalAns > 0
        ? (s.tutorStats.totalTimeMs / tutorTotalAns / 1000).toFixed(1)
        : "0.0";
    const studentAvgSec =
      studentTotalAns > 0
        ? (s.studentStats.totalTimeMs / studentTotalAns / 1000).toFixed(1)
        : "0.0";

    const masteredTopics = Array.from(s.studentStats.masteredSet);
    const reviewTopics = Array.from(s.studentStats.reviewSet);

    const badgeEarned =
      winner === "student"
        ? "Juara Balap Duel Pintar"
        : "Pejuang Duel Pemberani";

    if (this.activeProfile) {
      this.activeProfile = await db.recordDuelResult(this.activeProfile.id, {
        subject: s.subject,
        topic: s.topic,
        difficulty: s.difficulty,
        difficultyMode: s.difficulty === "adaptif" ? "adaptif" : "manual",
        totalRounds: s.totalRounds,
        winner,
        studentStats: {
          correct: s.studentStats.correct,
          wrong: s.studentStats.wrong,
          accuracy: studentAcc,
          avgTimeSec: Number(studentAvgSec),
          finalPositionPct: pos.studentPct,
        },
        tutorStats: {
          correct: s.tutorStats.correct,
          wrong: s.tutorStats.wrong,
          accuracy: tutorAcc,
          avgTimeSec: Number(tutorAvgSec),
          finalPositionPct: pos.tutorPct,
        },
        answerLog: s.answerLog,
        masteredTopics,
        reviewTopics,
        badgeEarned,
      });
    }

    this.container.innerHTML = `
      <div class="screen-overlay" style="background: rgba(20, 30, 48, 0.82);">
        <div class="cartoon-panel" style="max-width: 820px;">
          <div class="game-logo-badge">🏁 HASIL AKHIR DUEL MODE 🏁</div>
          <h2 class="panel-header-title" style="margin-bottom: 4px;">${this.escapeHtml(bannerTitle)}</h2>
          <p class="game-subtitle" style="margin-bottom: 10px; font-size: 0.98rem; color: #27ae60;">
            ${this.escapeHtml(encouragingMsg)}
          </p>

          <div class="duel-comparison-grid">
            <div class="duel-player-card" style="background: #fffdf2; border-color: #f39c12;">
              <div style="font-size: 1.15rem; font-weight: 900; color: #d35400; margin-bottom: 6px;">
                🧒 Murid: ${this.escapeHtml(s.studentName)}
              </div>
              <div class="result-stat-row"><span>📍 Posisi Akhir:</span><span>${pos.studentPct}% (${pos.studentStep}/${s.totalRounds})</span></div>
              <div class="result-stat-row"><span>✅ Jawaban Benar:</span><span style="color:#27ae60;">${s.studentStats.correct}</span></div>
              <div class="result-stat-row"><span>❌ Jawaban Salah:</span><span style="color:#c0392b;">${s.studentStats.wrong}</span></div>
              <div class="result-stat-row"><span>🎯 Akurasi:</span><span>${studentAcc}%</span></div>
              <div class="result-stat-row" style="border:none;"><span>⏱️ Rata-rata Waktu:</span><span>${studentAvgSec} dtk</span></div>
            </div>

            <div class="duel-player-card" style="background: #f4f9fd; border-color: #3498db;">
              <div style="font-size: 1.15rem; font-weight: 900; color: #2980b9; margin-bottom: 6px;">
                👨‍🏫 Tutor Pendamping
              </div>
              <div class="result-stat-row"><span>📍 Posisi Akhir:</span><span>${pos.tutorPct}% (${pos.tutorStep}/${s.totalRounds})</span></div>
              <div class="result-stat-row"><span>✅ Jawaban Benar:</span><span style="color:#27ae60;">${s.tutorStats.correct}</span></div>
              <div class="result-stat-row"><span>❌ Jawaban Salah:</span><span style="color:#c0392b;">${s.tutorStats.wrong}</span></div>
              <div class="result-stat-row"><span>🎯 Akurasi:</span><span>${tutorAcc}%</span></div>
              <div class="result-stat-row" style="border:none;"><span>⏱️ Rata-rata Waktu:</span><span>${tutorAvgSec} dtk</span></div>
            </div>
          </div>

          <div class="topic-eval-box">
            <div style="margin-bottom: 5px;">
              🌟 <strong>Materi yang Berhasil Dikuasai Murid:</strong>
              <span style="color: #1e8449;">
                ${masteredTopics.length > 0 ? this.escapeHtml(masteredTopics.join(", ")) : "Terus berlatih untuk membuka penguasaan topik pertama!"}
              </span>
            </div>
            <div>
              📖 <strong>Materi yang Perlu Dipelajari Kembali:</strong>
              <span style="color: #d35400;">
                ${reviewTopics.length > 0 ? this.escapeHtml(reviewTopics.join(", ")) : "Hebat! Tidak ada topik yang terlewat pada pertandingan ini."}
              </span>
            </div>
          </div>

          <div class="btn-group-horizontal">
            <button id="btn-duel-rematch" class="btn-cartoon btn-green btn-small">🔄 Tanding Lagi</button>
            <button id="btn-duel-home" class="btn-cartoon btn-blue btn-small">🏠 Menu Utama</button>
          </div>
        </div>
      </div>
    `;

    document
      .getElementById("btn-duel-rematch")
      .addEventListener("click", () => {
        this.playTone("click");
        this.showDuelSetupScreen();
      });

    document.getElementById("btn-duel-home").addEventListener("click", () => {
      this.playTone("click");
      this.showMainMenu();
    });
  }

  showTutorPinGate() {
    if (this.tutorUnlocked) {
      this.showTutorPanel("dashboard");
      return;
    }

    this.container.innerHTML = `
      <div class="screen-overlay">
        <div class="cartoon-panel" style="max-width: 480px;">
          <div class="game-logo-badge">🔒 AKSES KHUSUS PENDAMPING</div>
          <h2 class="panel-header-title">👨‍🏫 PIN Panel Tutor</h2>
          <p class="game-subtitle" style="font-size: 0.96rem;">
            Masukkan PIN lokal untuk membuka Panel Evaluasi & Pengelolaan Tutor (PIN Bawaan: <strong>1234</strong>).
          </p>

          <div class="form-group">
            <input id="inp-tutor-pin" type="password" class="input-cartoon" placeholder="Masukkan PIN..." maxlength="10" style="text-align: center; font-size: 1.4rem; letter-spacing: 6px;" />
          </div>
          <div id="pin-err-msg" style="color: #e74c3c; font-weight: 800; margin-bottom: 10px; display: none;">
            ⚠️ PIN salah! Silakan coba lagi.
          </div>

          <div class="btn-group-horizontal">
            <button id="btn-pin-back" class="btn-cartoon btn-gray btn-small">⬅️ Batal</button>
            <button id="btn-pin-submit" class="btn-cartoon btn-green btn-small">🔓 Buka Panel Tutor</button>
          </div>
        </div>
      </div>
    `;

    const pinInput = document.getElementById("inp-tutor-pin");
    const errMsg = document.getElementById("pin-err-msg");
    pinInput.focus();

    const verifyPin = () => {
      const entered = pinInput.value.trim();
      const validPin = String(this.settings.tutorPin || "1234");
      if (entered === validPin) {
        this.playTone("correct");
        this.tutorUnlocked = true;
        this.showTutorPanel("dashboard");
      } else {
        this.playTone("wrong");
        errMsg.style.display = "block";
      }
    };

    document
      .getElementById("btn-pin-submit")
      .addEventListener("click", verifyPin);
    pinInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") verifyPin();
    });

    document.getElementById("btn-pin-back").addEventListener("click", () => {
      this.playTone("click");
      this.showMainMenu();
    });
  }

  async showTutorPanel(activeTab = "dashboard", selectedStudentId = null) {
    const profiles = await db.getAllProfiles();
    const bankStats = questionManager.getBankStatistics();

    let totalAdvGames = 0;
    let totalDuelMatches = 0;
    let globalCorrect = 0;
    let globalWrong = 0;

    profiles.forEach((p) => {
      const advList = p.adventureHistory || [];
      const duelList = p.duelHistory || [];
      totalAdvGames += advList.length;
      totalDuelMatches += duelList.length;

      globalCorrect += p.totalCorrect || 0;
      globalWrong += p.totalWrong || 0;
    });

    const totalGames = totalAdvGames + totalDuelMatches;
    const globalTotalAns = globalCorrect + globalWrong;
    const globalAcc =
      globalTotalAns > 0
        ? Math.round((globalCorrect / globalTotalAns) * 100)
        : 0;

    const targetProfile =
      profiles.find((p) => p.id === selectedStudentId) ||
      this.activeProfile ||
      profiles[0] ||
      null;

    let tabContentHtml = "";

    if (activeTab === "dashboard") {
      const summaryRows =
        profiles.length === 0
          ? `<tr><td colspan="6" style="text-align:center; font-weight:700;">Belum ada profil siswa terdaftar.</td></tr>`
          : profiles
              .map((p) => {
                const char = this.getCharacterInfo(p.character);
                const advCount = (p.adventureHistory || []).length;
                const duelCount = (p.duelHistory || []).length;
                const totAns = (p.totalCorrect || 0) + (p.totalWrong || 0);
                const acc =
                  totAns > 0
                    ? Math.round(((p.totalCorrect || 0) / totAns) * 100)
                    : 0;
                return `
              <tr>
                <td><strong>${char.emoji} ${this.escapeHtml(p.name)}</strong></td>
                <td>Kelas ${p.grade}</td>
                <td>${totAns} Soal (${acc}%)</td>
                <td>${advCount}x Main</td>
                <td>${duelCount}x Duel</td>
                <td>🪙 ${p.coins || 0} | ⭐ ${p.stars || 0}</td>
              </tr>
            `;
              })
              .join("");

      tabContentHtml = `
        <div class="tutor-kpi-grid">
          <div class="tutor-kpi-card">
            <div class="tutor-kpi-val">${profiles.length}</div>
            <div class="tutor-kpi-label">👦 Profil Siswa</div>
          </div>
          <div class="tutor-kpi-card">
            <div class="tutor-kpi-val">${totalGames}</div>
            <div class="tutor-kpi-label">🎮 Total Sesi Main</div>
          </div>
          <div class="tutor-kpi-card">
            <div class="tutor-kpi-val">${bankStats.total} + ${bankStats.mathTemplateCount + bankStats.ipasTemplateCount} Tpl</div>
            <div class="tutor-kpi-label">🧠 Bank + Template Hybrid</div>
          </div>
          <div class="tutor-kpi-card">
            <div class="tutor-kpi-val">${globalAcc}%</div>
            <div class="tutor-kpi-label">🎯 Akurasi Global</div>
          </div>
        </div>

        <div class="tutor-scroll-area">
          <div style="font-weight: 900; margin-bottom: 6px;">📊 Ringkasan Progres Seluruh Siswa:</div>
          <table class="tutor-table">
            <thead>
              <tr>
                <th>Nama Siswa</th>
                <th>Kelas</th>
                <th>Soal Dijawab (Akurasi)</th>
                <th>Adventure</th>
                <th>Duel</th>
                <th>Koin & Bintang</th>
              </tr>
            </thead>
            <tbody>
              ${summaryRows}
            </tbody>
          </table>
        </div>
      `;
    }

    if (activeTab === "students") {
      const studentListHtml =
        profiles.length === 0
          ? `<p style="font-weight:700; color:#7f8c8d;">Belum ada data siswa.</p>`
          : profiles
              .map((p) => {
                const char = this.getCharacterInfo(p.character);
                const badgesHtml =
                  (p.badges || []).length > 0
                    ? p.badges
                        .map(
                          (b) =>
                            `<span class="badge-tag">🏅 ${this.escapeHtml(b)}</span>`,
                        )
                        .join("")
                    : `<span style="color:#7f8c8d; font-size:0.85rem;">Belum ada badge</span>`;
                const itemsHtml =
                  (p.collectibles || []).length > 0
                    ? p.collectibles
                        .map(
                          (it) =>
                            `<span class="badge-tag" style="background:#e8f8f5;">💎 ${this.escapeHtml(it)}</span>`,
                        )
                        .join("")
                    : "";

                return `
              <div class="profile-item" style="margin-bottom: 8px; align-items: flex-start;">
                <div style="text-align: left; flex: 1;">
                  <div style="font-weight: 900; font-size: 1.08rem;">
                    ${char.emoji} ${this.escapeHtml(p.name)}
                    <span style="font-size: 0.82rem; color: #636e72;">(ID: ${this.escapeHtml(p.id)} | Dibuat: ${this.formatDate(p.createdAt)})</span>
                  </div>
                  <div style="font-size: 0.88rem; font-weight: 700; margin: 4px 0;">
                    Kelas ${p.grade} SD | Skor: <strong>${p.totalScore || 0}</strong> | Soal: ${p.totalQuestionsAnswered || 0} (✅${p.totalCorrect || 0}/❌${p.totalWrong || 0}) | 🪙 ${p.coins || 0} | ⭐ ${p.stars || 0}
                  </div>
                  <div>${badgesHtml} ${itemsHtml}</div>
                </div>
                <div style="display: flex; gap: 6px; flex-wrap: wrap;">
                  <button class="btn-cartoon btn-blue btn-small btn-view-report" data-id="${p.id}">📈 Laporan</button>
                  <button class="btn-cartoon btn-red btn-small btn-del-student" data-id="${p.id}" data-name="${this.escapeHtml(p.name)}">🗑️ Hapus</button>
                </div>
              </div>
            `;
              })
              .join("");

      tabContentHtml = `
        <div class="tutor-scroll-area">
          <div style="font-weight: 900; margin-bottom: 8px;">👦 Daftar & Detail Profil Siswa:</div>
          ${studentListHtml}
        </div>
      `;
    }

    if (activeTab === "reports") {
      if (!targetProfile) {
        tabContentHtml = `<p style="font-weight:700; padding:16px;">Belum ada siswa untuk ditampilkan laporannya.</p>`;
      } else {
        const studentSelectorOptions = profiles
          .map(
            (p) => `
          <option value="${p.id}" ${p.id === targetProfile.id ? "selected" : ""}>
            ${this.escapeHtml(p.name)} (Kelas ${p.grade})
          </option>
        `,
          )
          .join("");

        const sCorrect = targetProfile.totalCorrect || 0;
        const sWrong = targetProfile.totalWrong || 0;
        const sTotal = sCorrect + sWrong;
        const sAcc = sTotal > 0 ? Math.round((sCorrect / sTotal) * 100) : 0;

        const mtkPerf = targetProfile.subjectPerformance?.matematika || {
          answered: 0,
          correct: 0,
          wrong: 0,
        };
        const ipasPerf = targetProfile.subjectPerformance?.ipas || {
          answered: 0,
          correct: 0,
          wrong: 0,
        };
        const mtkAcc =
          mtkPerf.answered > 0
            ? Math.round((mtkPerf.correct / mtkPerf.answered) * 100)
            : 0;
        const ipasAcc =
          ipasPerf.answered > 0
            ? Math.round((ipasPerf.correct / ipasPerf.answered) * 100)
            : 0;

        const topicEntries = Object.values(
          targetProfile.topicPerformance || {},
        );
        const topicPerfRows =
          topicEntries.length === 0
            ? `<tr><td colspan="6" style="text-align:center;">Belum ada data pengerjaan soal per topik.</td></tr>`
            : topicEntries
                .map((tp) => {
                  const tAcc =
                    tp.answered > 0
                      ? Math.round((tp.correct / tp.answered) * 100)
                      : 0;
                  return `
                <tr>
                  <td><strong>${this.escapeHtml((tp.subject || "").toUpperCase())}</strong></td>
                  <td>${this.escapeHtml(tp.topic)}</td>
                  <td>${tp.answered} Soal (✅${tp.correct} / ❌${tp.wrong})</td>
                  <td><strong>${tAcc}%</strong></td>
                  <td><span class="badge-tag">${this.escapeHtml((tp.currentDifficulty || "mudah").toUpperCase())}</span></td>
                  <td>${tp.needsReview ? '<span style="color:#c0392b; font-weight:800;">⚠️ Perlu Penguatan</span>' : '<span style="color:#27ae60; font-weight:800;">🌟 Baik</span>'}</td>
                </tr>
              `;
                })
                .join("");

        const adaptiveLogRows =
          (targetProfile.adaptiveChanges || []).length === 0
            ? `<tr><td colspan="4" style="text-align:center;">Belum ada perubahan tingkat kesulitan adaptif (butuh minimal 5 soal pada satu topik).</td></tr>`
            : [...targetProfile.adaptiveChanges]
                .reverse()
                .map(
                  (chg) => `
              <tr>
                <td>${this.formatDate(chg.changedAt)}</td>
                <td>${this.escapeHtml(chg.subject.toUpperCase())} — ${this.escapeHtml(chg.topic)}</td>
                <td><strong>${this.escapeHtml(chg.fromDifficulty.toUpperCase())} ➡️ ${this.escapeHtml(chg.toDifficulty.toUpperCase())}</strong></td>
                <td>Akurasi 5 soal terakhir: ${chg.accuracy5}%</td>
              </tr>
            `,
                )
                .join("");

        tabContentHtml = `
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; margin-bottom:10px;">
            <div style="font-weight:900;">Pilih Siswa untuk Evaluasi:</div>
            <select id="sel-report-student" class="input-cartoon" style="max-width: 280px;">
              ${studentSelectorOptions}
            </select>
          </div>

          <div class="tutor-kpi-grid" style="margin-bottom:10px;">
            <div class="tutor-kpi-card">
              <div class="tutor-kpi-val" style="color:#27ae60;">${sCorrect} / ${sWrong}</div>
              <div class="tutor-kpi-label">✅ Benar / ❌ Salah (${sAcc}%)</div>
            </div>
            <div class="tutor-kpi-card">
              <div class="tutor-kpi-val" style="color:#2980b9;">${mtkPerf.answered} Soal</div>
              <div class="tutor-kpi-label">📐 Matematika (${mtkAcc}%)</div>
            </div>
            <div class="tutor-kpi-card">
              <div class="tutor-kpi-val" style="color:#16a085;">${ipasPerf.answered} Soal</div>
              <div class="tutor-kpi-label">🌿 IPAS (${ipasAcc}%)</div>
            </div>
          </div>

          <div class="tutor-scroll-area" style="max-height: 260px;">
            <div class="topic-eval-box" style="margin-top:0; margin-bottom:10px;">
              <div>
                📖 <strong>Materi yang Perlu Diulang / Penguatan pada Sesi Berikutnya:</strong>
                <span style="color:#d35400;">
                  ${(targetProfile.topicsToReview || []).length > 0 ? this.escapeHtml(targetProfile.topicsToReview.join(", ")) : "Tidak ada topik yang tertinggal!"}
                </span>
              </div>
            </div>

            <div style="font-weight:900; margin: 8px 0 4px;">🎯 Performa Per Topik & Tingkat Kesulitan Adaptif Saat Ini:</div>
            <table class="tutor-table" style="margin-bottom: 12px;">
              <thead>
                <tr><th>Mapel</th><th>Topik</th><th>Dijawab</th><th>Akurasi</th><th>Level Adaptif</th><th>Status</th></tr>
              </thead>
              <tbody>${topicPerfRows}</tbody>
            </table>

            <div style="font-weight:900; margin: 8px 0 4px;">🔄 Riwayat Perubahan Tingkat Kesulitan Adaptif:</div>
            <table class="tutor-table">
              <thead>
                <tr><th>Waktu</th><th>Topik</th><th>Perubahan Level</th><th>Keterangan</th></tr>
              </thead>
              <tbody>${adaptiveLogRows}</tbody>
            </table>
          </div>
        `;
      }
    }

    if (activeTab === "questions") {
      const mtkStats = bankStats.bySubject.matematika;
      const ipasStats = bankStats.bySubject.ipas;
      const allQuestions = questionManager.getAllQuestionsCombined();

      const topicBadgesMtk = Object.entries(mtkStats.topics)
        .map(
          ([t, c]) =>
            `<span class="badge-tag">${this.escapeHtml(t)}: ${c}</span>`,
        )
        .join("");
      const topicBadgesIpas = Object.entries(ipasStats.topics)
        .map(
          ([t, c]) =>
            `<span class="badge-tag" style="background:#e8f8f5;">${this.escapeHtml(t)}: ${c}</span>`,
        )
        .join("");

      const qRows = allQuestions
        .map(
          (q) => `
        <tr>
          <td><strong>${this.escapeHtml(q.id)}</strong></td>
          <td>${this.escapeHtml(q.subject)}</td>
          <td>${this.escapeHtml(q.topic)}</td>
          <td>${this.escapeHtml(q.difficulty)}</td>
          <td>${this.escapeHtml(q.question)}</td>
          <td><strong>${this.escapeHtml(q.correctAnswer)}</strong></td>
        </tr>
      `,
        )
        .join("");

      tabContentHtml = `
        <div class="tutor-scroll-area" style="max-height: 360px;">
          <div class="duel-comparison-grid" style="margin-top:0;">
            <div class="duel-player-card">
              <div style="font-weight:900; color:#2980b9; margin-bottom:4px;">
                📐 Matematika Kelas 3 (Bank: ${mtkStats.total} Soal + ${bankStats.mathTemplateCount} Generator Topik)
              </div>
              <div style="font-size:0.86rem; font-weight:700; margin-bottom:6px;">
                Mudah: ${mtkStats.mudah} | Sedang: ${mtkStats.sedang} | Sulit: ${mtkStats.sulit}
              </div>
              <div>${topicBadgesMtk}</div>
            </div>
            <div class="duel-player-card">
              <div style="font-weight:900; color:#27ae60; margin-bottom:4px;">
                🌿 IPAS Kelas 3 (Bank: ${ipasStats.total} Soal + ${bankStats.ipasTemplateCount} Generator Konteks)
              </div>
              <div style="font-size:0.86rem; font-weight:700; margin-bottom:6px;">
                Mudah: ${ipasStats.mudah} | Sedang: ${ipasStats.sedang} | Sulit: ${ipasStats.sulit}
              </div>
              <div>${topicBadgesIpas}</div>
            </div>
          </div>

          <div class="form-box" style="margin-bottom: 12px;">
            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; margin-bottom:8px;">
              <div style="font-weight:900; color:#d35400;">
                📥 Impor / 📤 Ekspor Bank Soal JSON & Uji Otomatis Validator
              </div>
              <div style="display:flex; gap:8px; flex-wrap:wrap;">
                <button id="btn-export-qbank" class="btn-cartoon btn-blue btn-small">📤 Ekspor Bank Soal (.json)</button>
                <button id="btn-run-autotest" class="btn-cartoon btn-purple btn-small">🧪 Jalankan Uji Otomatis Engine</button>
              </div>
            </div>
            <div style="display:flex; gap:10px; align-items:center; flex-wrap:wrap;">
              <input type="file" id="inp-import-json" accept=".json,application/json" class="input-cartoon" style="max-width:340px;" />
              <button id="btn-process-import-q" class="btn-cartoon btn-green btn-small">✅ Validasi & Impor JSON</button>
            </div>
            <div id="import-q-feedback" style="margin-top:8px; font-weight:800; font-size:0.9rem; display:none;"></div>
          </div>

          <div style="font-weight:900; margin-bottom:6px;">📋 Daftar Seluruh Soal di Question Bank (${allQuestions.length} Soal):</div>
          <table class="tutor-table">
            <thead>
              <tr><th>ID</th><th>Mapel</th><th>Topik</th><th>Kesulitan</th><th>Pertanyaan</th><th>Kunci</th></tr>
            </thead>
            <tbody>${qRows}</tbody>
          </table>
        </div>
      `;
    }

    if (activeTab === "settings") {
      const dMode = this.settings.difficultyMode || "adaptif";
      const mDiff = this.settings.manualDifficulty || "sedang";
      const aBounds = this.settings.adaptiveBounds || "mudah-sulit";
      const initDiff = this.settings.initialAdaptiveDifficulty || "mudah";

      tabContentHtml = `
        <div class="tutor-scroll-area" style="max-height: 360px;">
          <div class="form-box" style="background:#eef9ff; border-color:#3498db; margin-top:0; margin-bottom:12px;">
            <div style="font-weight:900; font-size:1.05rem; color:#2980b9; margin-bottom:8px;">
              🎯 Konfigurasi Tingkat Kesulitan Hybrid (Manual & Adaptif)
            </div>
            <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap:10px;">
              <div class="form-group">
                <label for="tutor-sel-diffmode">Mode Kesulitan:</label>
                <select id="tutor-sel-diffmode" class="input-cartoon">
                  <option value="adaptif" ${dMode === "adaptif" ? "selected" : ""}>🤖 Adaptif (Berdasarkan Performa)</option>
                  <option value="manual" ${dMode === "manual" ? "selected" : ""}>🖐️ Manual (Ditentukan Tutor)</option>
                </select>
              </div>
              <div class="form-group">
                <label for="tutor-sel-manualdiff">Tingkat Manual:</label>
                <select id="tutor-sel-manualdiff" class="input-cartoon">
                  <option value="mudah" ${mDiff === "mudah" ? "selected" : ""}>Mudah</option>
                  <option value="sedang" ${mDiff === "sedang" ? "selected" : ""}>Sedang</option>
                  <option value="sulit" ${mDiff === "sulit" ? "selected" : ""}>Sulit</option>
                </select>
              </div>
              <div class="form-group">
                <label for="tutor-sel-bounds">Batas Adaptif Tutor:</label>
                <select id="tutor-sel-bounds" class="input-cartoon">
                  <option value="mudah-sulit" ${aBounds === "mudah-sulit" ? "selected" : ""}>Mudah sampai Sulit</option>
                  <option value="mudah-sedang" ${aBounds === "mudah-sedang" ? "selected" : ""}>Mudah sampai Sedang</option>
                  <option value="sedang-sulit" ${aBounds === "sedang-sulit" ? "selected" : ""}>Sedang sampai Sulit</option>
                </select>
              </div>
              <div class="form-group">
                <label for="tutor-sel-initdiff">Tingkat Awal Adaptif:</label>
                <select id="tutor-sel-initdiff" class="input-cartoon">
                  <option value="mudah" ${initDiff === "mudah" ? "selected" : ""}>Mudah</option>
                  <option value="sedang" ${initDiff === "sedang" ? "selected" : ""}>Sedang</option>
                  <option value="sulit" ${initDiff === "sulit" ? "selected" : ""}>Sulit</option>
                </select>
              </div>
            </div>
            <button id="btn-save-diff-config" class="btn-cartoon btn-green btn-small">
              💾 Simpan Pengaturan Tingkat Kesulitan
            </button>
            <span id="diff-save-msg" style="color:#27ae60; font-weight:800; margin-left:10px; display:none;">✅ Tersimpan!</span>
          </div>

          <div class="duel-comparison-grid">
            <div class="duel-player-card">
              <div style="font-weight:900; font-size:1.02rem; margin-bottom:8px; color:#8e44ad;">
                🔐 Pengaturan PIN Tutor
              </div>
              <div class="form-group">
                <label for="inp-new-pin">Ubah PIN Lokal Panel Tutor:</label>
                <input id="inp-new-pin" type="text" class="input-cartoon" value="${this.escapeHtml(this.settings.tutorPin || "1234")}" maxlength="10" />
              </div>
              <button id="btn-save-pin" class="btn-cartoon btn-purple btn-small" style="width:100%;">
                💾 Simpan PIN Baru
              </button>
              <div id="pin-save-msg" style="color:#27ae60; font-weight:800; font-size:0.88rem; margin-top:6px; display:none;">✅ PIN berhasil diperbarui!</div>
            </div>

            <div class="duel-player-card">
              <div style="font-weight:900; font-size:1.02rem; margin-bottom:8px; color:#2980b9;">
                💾 Cadangan Data Offline (Backup & Restore JSON)
              </div>
              <button id="btn-export-backup" class="btn-cartoon btn-blue btn-small" style="width:100%; margin-bottom:8px;">
                📤 Ekspor Cadangan Data Siswa (.json)
              </button>
              <div class="form-group" style="margin-bottom:6px;">
                <input type="file" id="inp-restore-backup" accept=".json,application/json" class="input-cartoon" />
              </div>
              <button id="btn-import-backup" class="btn-cartoon btn-green btn-small" style="width:100%;">
                📥 Pulihkan Data dari JSON
              </button>
              <div id="backup-status-msg" style="margin-top:6px; font-weight:800; font-size:0.86rem; display:none;"></div>
            </div>
          </div>

          <div class="form-box" style="border-color:#e74c3c; background:#fff5f5; margin-top:10px;">
            <div style="font-weight:900; color:#c0392b; margin-bottom:4px;">⚠️ Zona Reset Progres Siswa</div>
            <button id="btn-reset-all-progress" class="btn-cartoon btn-red btn-small">
              🔄 Reset Seluruh Progres Siswa (Dengan Konfirmasi)
            </button>
          </div>
        </div>
      `;
    }

    this.container.innerHTML = `
      <div class="screen-overlay">
        <div class="cartoon-panel" style="max-width: 940px;">
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; margin-bottom:8px;">
            <h2 class="panel-header-title" style="margin-bottom:0;">👨‍🏫 Panel Tutor & Hybrid Question Engine</h2>
            <button id="btn-close-tutor" class="btn-cartoon btn-gray btn-small">🏠 Kembali ke Menu Utama</button>
          </div>

          <div class="tutor-tabs-nav">
            <button class="tutor-tab-btn ${activeTab === "dashboard" ? "active" : ""}" data-tab="dashboard">📊 Dashboard</button>
            <button class="tutor-tab-btn ${activeTab === "students" ? "active" : ""}" data-tab="students">👦 Manajemen Siswa</button>
            <button class="tutor-tab-btn ${activeTab === "reports" ? "active" : ""}" data-tab="reports">📈 Laporan & Adaptif</button>
            <button class="tutor-tab-btn ${activeTab === "questions" ? "active" : ""}" data-tab="questions">📚 Bank Soal & Generator</button>
            <button class="tutor-tab-btn ${activeTab === "settings" ? "active" : ""}" data-tab="settings">⚙️ Pengaturan & Backup</button>
          </div>

          ${tabContentHtml}
        </div>
      </div>
    `;

    document.getElementById("btn-close-tutor").addEventListener("click", () => {
      this.playTone("click");
      this.showMainMenu();
    });

    this.container.querySelectorAll(".tutor-tab-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        this.playTone("click");
        this.showTutorPanel(btn.dataset.tab, targetProfile?.id);
      });
    });

    if (activeTab === "students") {
      this.container.querySelectorAll(".btn-view-report").forEach((btn) => {
        btn.addEventListener("click", () => {
          this.playTone("click");
          this.showTutorPanel("reports", btn.dataset.id);
        });
      });

      this.container.querySelectorAll(".btn-del-student").forEach((btn) => {
        btn.addEventListener("click", async () => {
          const sName = btn.dataset.name;
          const sId = btn.dataset.id;
          if (
            window.confirm(
              `Apakah Anda yakin ingin menghapus profil siswa "${sName}" beserta seluruh riwayat belajarnya?`,
            )
          ) {
            this.playTone("wrong");
            await db.deleteProfile(sId);
            this.activeProfile = await db.getActiveProfile();
            this.showTutorPanel("students");
          }
        });
      });
    }

    if (activeTab === "reports") {
      const selStudent = document.getElementById("sel-report-student");
      if (selStudent) {
        selStudent.addEventListener("change", (e) => {
          this.playTone("click");
          this.showTutorPanel("reports", e.target.value);
        });
      }
    }

    if (activeTab === "questions") {
      const btnImportQ = document.getElementById("btn-process-import-q");
      const fileInpQ = document.getElementById("inp-import-json");
      const feedbackQ = document.getElementById("import-q-feedback");

      document
        .getElementById("btn-export-qbank")
        .addEventListener("click", () => {
          this.playTone("correct");
          const payload = questionManager.exportQuestionBankPayload();
          const blob = new Blob([JSON.stringify(payload, null, 2)], {
            type: "application/json",
          });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `bank-soal-dunia-pintar-${new Date().toISOString().slice(0, 10)}.json`;
          document.body.appendChild(a);
          a.click();
          a.remove();
          URL.revokeObjectURL(url);
        });

      document
        .getElementById("btn-run-autotest")
        .addEventListener("click", () => {
          this.playTone("correct");
          const testReport = hybridEngine.runAutomatedVerificationSuite(
            questionManager.banks,
          );
          feedbackQ.style.display = "block";
          feedbackQ.style.color = testReport.passed ? "#1e8449" : "#c0392b";
          const detailLines = testReport.details
            .map(
              (d) =>
                `${d.ok ? "✅" : "❌"} <strong>${this.escapeHtml(d.name)}:</strong> ${this.escapeHtml(d.info)}`,
            )
            .join("<br/>");
          feedbackQ.innerHTML = `
          <div style="background:#fff; border:2px solid #34495e; border-radius:12px; padding:10px; margin-top:4px;">
            <div><strong>Hasil Pengujian Otomatis Hybrid Question Engine (${testReport.passedTests}/${testReport.totalTests} Lulus):</strong></div>
            <div style="margin-top:4px; font-weight:700; font-size:0.85rem;">${detailLines}</div>
          </div>
        `;
        });

      if (btnImportQ && fileInpQ) {
        btnImportQ.addEventListener("click", () => {
          if (!fileInpQ.files || fileInpQ.files.length === 0) {
            this.playTone("wrong");
            feedbackQ.style.display = "block";
            feedbackQ.style.color = "#c0392b";
            feedbackQ.textContent =
              "⚠️ Pilih file .json bank soal terlebih dahulu.";
            return;
          }

          const reader = new FileReader();
          reader.onload = async (evt) => {
            const result = await questionManager.validateAndImportQuestions(
              evt.target.result,
            );
            feedbackQ.style.display = "block";
            if (result.success) {
              this.playTone("correct");
              feedbackQ.style.color = "#27ae60";
              const errNote =
                result.errors.length > 0
                  ? `<br/><span style="color:#d35400;">Catatan soal ditolak validator (${result.errors.length}): ${this.escapeHtml(result.errors.slice(0, 2).join(" | "))}</span>`
                  : "";
              feedbackQ.innerHTML = `✅ Berhasil mengimpor <strong>${result.addedCount} soal baru</strong>! (Dilewati ID duplikat: ${result.skippedDuplicateCount})${errNote}`;
              setTimeout(() => this.showTutorPanel("questions"), 1800);
            } else {
              this.playTone("wrong");
              feedbackQ.style.color = "#c0392b";
              feedbackQ.innerHTML = `❌ Gagal mengimpor soal. Dilewati ID duplikat: ${result.skippedDuplicateCount}.<br/>Detail gagal validasi: ${this.escapeHtml(result.errors.slice(0, 3).join(" | "))}`;
            }
          };
          reader.readAsText(fileInpQ.files[0]);
        });
      }
    }

    if (activeTab === "settings") {
      document
        .getElementById("btn-save-diff-config")
        .addEventListener("click", async () => {
          this.settings.difficultyMode =
            document.getElementById("tutor-sel-diffmode").value;
          this.settings.manualDifficulty = document.getElementById(
            "tutor-sel-manualdiff",
          ).value;
          this.settings.adaptiveBounds =
            document.getElementById("tutor-sel-bounds").value;
          this.settings.initialAdaptiveDifficulty =
            document.getElementById("tutor-sel-initdiff").value;
          await db.saveSettings(this.settings);
          this.playTone("correct");
          const msg = document.getElementById("diff-save-msg");
          msg.style.display = "inline";
        });

      document
        .getElementById("btn-save-pin")
        .addEventListener("click", async () => {
          const newPin = document.getElementById("inp-new-pin").value.trim();
          if (!newPin) return;
          this.settings.tutorPin = newPin;
          await db.saveSettings(this.settings);
          this.playTone("correct");
          document.getElementById("pin-save-msg").style.display = "block";
        });

      document
        .getElementById("btn-export-backup")
        .addEventListener("click", async () => {
          this.playTone("correct");
          const backupData = await db.exportBackupData();
          const blob = new Blob([JSON.stringify(backupData, null, 2)], {
            type: "application/json",
          });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `backup-dunia-pintar-${new Date().toISOString().slice(0, 10)}.json`;
          document.body.appendChild(a);
          a.click();
          a.remove();
          URL.revokeObjectURL(url);
        });

      document
        .getElementById("btn-import-backup")
        .addEventListener("click", () => {
          const inpRestore = document.getElementById("inp-restore-backup");
          const statusMsg = document.getElementById("backup-status-msg");
          if (!inpRestore.files || inpRestore.files.length === 0) {
            this.playTone("wrong");
            statusMsg.style.display = "block";
            statusMsg.style.color = "#c0392b";
            statusMsg.textContent =
              "⚠️ Pilih file cadangan (.json) terlebih dahulu!";
            return;
          }

          const reader = new FileReader();
          reader.onload = async (evt) => {
            try {
              const parsed = JSON.parse(evt.target.result);
              const summary = await db.importBackupData(parsed);
              await questionManager.loadCustomQuestionsFromDB();
              this.settings = await db.getSettings();
              this.activeProfile = await db.getActiveProfile();
              this.playTone("correct");
              statusMsg.style.display = "block";
              statusMsg.style.color = "#27ae60";
              statusMsg.textContent = `✅ Berhasil memulihkan ${summary.profilesCount} profil siswa & ${summary.customQuestionsCount} soal kustom!`;
            } catch (err) {
              this.playTone("wrong");
              statusMsg.style.display = "block";
              statusMsg.style.color = "#c0392b";
              statusMsg.textContent = `❌ Gagal memulihkan cadangan: ${err.message}`;
            }
          };
          reader.readAsText(inpRestore.files[0]);
        });

      document
        .getElementById("btn-reset-all-progress")
        .addEventListener("click", async () => {
          if (
            window.confirm(
              "PERINGATAN: Apakah Anda yakin ingin mereset seluruh koin, bintang, dan riwayat belajar semua siswa menjadi 0?",
            )
          ) {
            this.playTone("wrong");
            await db.resetAllProfilesProgress();
            this.activeProfile = await db.getActiveProfile();
            this.showTutorPanel("settings");
          }
        });
    }
  }
}

export const uiManager = new UIManager();
