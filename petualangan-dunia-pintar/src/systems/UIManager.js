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
    this.selectedAdventureLevelKey = "easy";
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
    return `
      <div class="active-profile-pill">
        <span>${char.emoji} <strong>${this.escapeHtml(this.activeProfile.name)}</strong> (Kelas ${this.activeProfile.grade})</span>
        <span>| 🪙 ${this.activeProfile.coins || 0}</span>
        <span>| ⭐ ${this.activeProfile.stars || 0}</span>
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
                  <option value="4">Kelas 4 SD (Aktif)</option>
                  <option value="1" disabled>Kelas 1 SD (Coming Soon)</option>
                  <option value="2" disabled>Kelas 2 SD (Coming Soon)</option>
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
          <p class="game-subtitle">Setiap mata pelajaran memiliki progres petualangan masing-masing!</p>

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
          this.showAdventureLevelSelection();
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

  async showAdventureLevelSelection() {
    this.stopAllGameplayScenes();
    if (this.activeProfile) {
      this.activeProfile = await db.getProfileById(this.activeProfile.id);
    }

    const subInfo = this.getSubjectInfo(this.selectedSubject);
    const subjProgress = db.getSubjectAdventureProgress(
      this.activeProfile,
      this.selectedSubject,
      this.selectedGrade,
    );

    const levelCardsHtml = GAME_CONFIG.adventureLevels
      .map((lvl) => {
        const minCorrect = Math.ceil(lvl.totalQuestions * 0.8);
        const state = subjProgress?.levels?.[lvl.id] || {
          unlocked: lvl.id === "easy",
          completed: false,
          totalQuestions: lvl.totalQuestions,
          correctAnswers: 0,
          wrongAnswers: 0,
          bestAccuracy: 0,
        };

        const isUnlocked = Boolean(state.unlocked);
        const isCompleted = Boolean(state.completed);

        let statusLabel = "🔒 Terkunci";
        let badgeClass = "badge-soon";
        if (isCompleted) {
          statusLabel = "✅ Lulus (Bisa Diulang)";
          badgeClass = "badge-active";
        } else if (isUnlocked) {
          statusLabel = "🔓 Terbuka";
          badgeClass = "badge-active";
        }

        const targetInfoText =
          lvl.id === "easy"
            ? "5 soal, minimal 4 benar (80%)"
            : lvl.id === "medium"
              ? "7 soal, minimal 6 benar (minimal 80%)"
              : "10 soal, minimal 8 benar (80%)";

        const progressDetailHtml = isUnlocked
          ? isCompleted
            ? `<div style="font-size:0.84rem; font-weight:800; color:#1e8449; background:#e8f8f5; padding:6px 10px; border-radius:10px; width:100%;">
               🏆 Rekor Terbaik: ${state.correctAnswers}/${lvl.totalQuestions} Benar (${state.bestAccuracy || state.accuracy || 0}%)
             </div>`
            : `<div style="font-size:0.84rem; font-weight:800; color:#2980b9; background:#eef9ff; padding:6px 10px; border-radius:10px; width:100%;">
               🎯 Target Lulus: Minimal ${minCorrect} dari ${lvl.totalQuestions} soal benar
             </div>`
          : `<div style="font-size:0.84rem; font-weight:800; color:#c0392b; background:#fadbd8; padding:6px 10px; border-radius:10px; width:100%;">
             🔒 ${this.escapeHtml(lvl.unlockRequirementText)}
           </div>`;

        return `
        <div class="choice-card adv-level-card ${isUnlocked ? "" : "card-disabled"} ${isCompleted ? "selected" : ""}"
             data-level="${lvl.id}"
             data-unlocked="${isUnlocked}">
          <div class="card-icon">${isUnlocked ? lvl.icon : "🔒"}</div>
          <div class="card-title">${this.escapeHtml(lvl.name)}</div>
          <div style="font-weight:900; font-size:0.92rem; color:#d35400;">
            📝 ${this.escapeHtml(targetInfoText)}
          </div>
          <div class="card-desc">${this.escapeHtml(lvl.desc)}</div>
          ${progressDetailHtml}
          <span class="status-badge ${badgeClass}" style="margin-top:4px;">
            ${statusLabel}
          </span>
        </div>
      `;
      })
      .join("");

    this.container.innerHTML = `
      <div class="screen-overlay">
        <div class="cartoon-panel" style="max-width: 880px;">
          ${this.renderProfileBanner()}
          <div class="game-logo-badge">${subInfo.icon} ADVENTURE ${subInfo.name.toUpperCase()}</div>
          <h2 class="panel-header-title" style="margin-bottom: 6px;">🗺️ Pilih Level Adventure ${this.escapeHtml(subInfo.name)}</h2>

          <div style="background:#fff9db; border:3px solid #f39c12; border-radius:18px; padding:10px 16px; margin: 0 auto 12px; max-width: 760px; text-align:left; font-size:0.92rem; font-weight:800; color:#2c3e50; box-shadow: 0 4px 0 rgba(0,0,0,0.08);">
            <div style="color:#d35400; font-size:0.98rem; margin-bottom:4px;">⭐ Syarat Membuka Level Berikutnya (Minimal Nilai 80%):</div>
            <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap:6px;">
              <div>🌱 <strong>Mudah:</strong> 5 soal, minimal <strong>4 benar (80%)</strong></div>
              <div>⚡ <strong>Sedang:</strong> 7 soal, minimal <strong>6 benar (minimal 80%)</strong></div>
              <div>🔥 <strong>Sulit:</strong> 10 soal, minimal <strong>8 benar (80%)</strong></div>
            </div>
          </div>

          <div id="adv-level-notice" style="display:none; background:#fadbd8; color:#78281f; border:3px solid #34495e; border-radius:14px; padding:10px; font-weight:800; margin-bottom:10px;"></div>

          <div class="selection-grid-3">
            ${levelCardsHtml}
          </div>

          <div class="btn-group-horizontal">
            <button id="btn-back-mode-sel" class="btn-cartoon btn-gray btn-small">⬅️ Kembali ke Pilihan Mode</button>
          </div>
        </div>
      </div>
    `;

    const noticeEl = document.getElementById("adv-level-notice");

    this.container.querySelectorAll(".adv-level-card").forEach((card) => {
      card.addEventListener("click", () => {
        const levelKey = card.dataset.level;
        const isUnlocked = card.dataset.unlocked === "true";
        const lvlCfg = GAME_CONFIG.adventureLevels.find(
          (l) => l.id === levelKey,
        );

        if (!isUnlocked) {
          this.playTone("wrong");
          if (noticeEl && lvlCfg) {
            const prevName =
              levelKey === "medium"
                ? "Level Mudah (minimal 4/5 benar)"
                : "Level Sedang (minimal 6/7 benar)";
            noticeEl.textContent = `🔒 Level ini masih terkunci! Selesaikan ${prevName} terlebih dahulu untuk membukanya.`;
            noticeEl.style.display = "block";
          }
          return;
        }

        this.playTone("click");
        this.selectedAdventureLevelKey = levelKey;
        this.startAdventureMode(levelKey);
      });
    });

    document
      .getElementById("btn-back-mode-sel")
      .addEventListener("click", () => {
        this.playTone("click");
        this.showModeSelection();
      });
  }

  showSettingsMenu() {
    const isManual = this.settings.difficultyMode === "manual";

    this.container.innerHTML = `
      <div class="screen-overlay">
        <div class="cartoon-panel" style="max-width: 640px;">
          <h2 class="panel-header-title">⚙️ Pengaturan Permainan & Kesulitan Duel</h2>

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
              <span>🎯 Mode Kesulitan Default (Duel)</span>
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
              <strong>Petualangan Dunia Pintar</strong> adalah game edukasi interaktif Kelas 3 SD untuk mata pelajaran <strong>Matematika</strong> dan <strong>IPAS</strong> yang berjalan 100% Offline.
            </p>
            <p style="margin-bottom: 8px;">
              🗺️ <strong>Adventure Mode Bertahap Per Mapel:</strong> Setiap mata pelajaran memiliki 3 level terpisah: <strong>Level Mudah (5 Soal)</strong>, <strong>Level Sedang (7 Soal)</strong>, dan <strong>Level Sulit (10 Soal)</strong> yang terbuka secara berurutan.
            </p>
            <p style="margin-bottom: 8px;">
              ⚔️ <strong>Duel Mode (Hot Seat):</strong> Kompetisi 1 lawan 1 bersama Tutor sampai garis finis dengan sistem <em>Anti-Meniru</em> dan <em>Tie-Breaker</em> kecepatan.
            </p>
            <p>
              👨‍🏫 <strong>Panel Tutor:</strong> Dilengkapi pemantauan status level Adventure per mapel, analitik performa per topik, impor/ekspor Bank Soal JSON, dan <em>Backup/Restore</em> data (PIN Bawaan: <strong>1234</strong>).
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

  startAdventureMode(levelKey = null) {
    this.stopAllGameplayScenes();
    const chosenLevelKey = levelKey || this.selectedAdventureLevelKey || "easy";
    this.selectedAdventureLevelKey = chosenLevelKey;

    const levelMeta =
      GAME_CONFIG.adventureLevels.find((l) => l.id === chosenLevelKey) ||
      GAME_CONFIG.adventureLevels[0];

    const charInfo = this.getCharacterInfo(this.activeProfile?.character);
    const subInfo = this.getSubjectInfo(this.selectedSubject);

    this.renderAdventureHUD({
      characterEmoji: charInfo.emoji,
      playerName: this.activeProfile?.name || "Petualang",
      subjectName: subInfo.name,
      levelName: levelMeta.name,
      coins: 0,
      answeredCount: 0,
      totalChallenges: levelMeta.totalQuestions,
    });

    this.phaserGame.scene.start("AdventureScene", {
      profile: this.activeProfile,
      grade: this.selectedGrade,
      subject: this.selectedSubject,
      levelKey: chosenLevelKey,
    });
  }

  renderAdventureHUD(stats) {
    this.container.innerHTML = `
      <div class="hud-overlay" id="adventure-hud">
        <div class="hud-top-bar">
          <div class="hud-stats-group">
            <div class="hud-pill">
              <span>${stats.characterEmoji} ${this.escapeHtml(stats.playerName)}</span>
            </div>
            <div class="hud-pill" style="background: #eef9ff;">
              <span>📘 ${this.escapeHtml(stats.subjectName)} — ${this.escapeHtml(stats.levelName)}</span>
            </div>
            <div class="hud-pill" style="background: #fff9db;">
              <span>🪙 Koin: <span id="hud-coin-val">${stats.coins}</span></span>
            </div>
            <div class="hud-pill" style="background: #e8f8f5;">
              <span>🧩 Soal Dikerjakan: <span id="hud-quest-val">${stats.answeredCount}/${stats.totalChallenges}</span></span>
            </div>
          </div>

          <button id="btn-hud-exit" class="btn-cartoon btn-red btn-small" style="pointer-events: auto;">
            🏠 Keluar Level
          </button>
        </div>

        <div id="hud-hint-banner" style="align-self: center; background: rgba(44,62,80,0.92); color: #fff; padding: 8px 20px; border-radius: 30px; font-weight: 800; font-size: 1rem; display: none;">
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

    document
      .getElementById("btn-hud-exit")
      .addEventListener("click", async () => {
        this.playTone("click");
        const advScene = this.phaserGame?.scene.getScene("AdventureScene");
        if (advScene && this.activeProfile && !advScene.levelCompleted) {
          this.activeProfile = await db.saveIncompleteAdventureSession(
            this.activeProfile.id,
            this.selectedSubject,
            {
              levelKey: advScene.levelKey,
              questionsAnswered: advScene.questionsAnswered,
              totalChallenges: advScene.totalChallenges,
              correctAnswers: advScene.correctAnswers,
              wrongAnswers: advScene.wrongAnswers,
            },
          );
        }
        this.showAdventureLevelSelection();
      });

    this.bindTouchButtons();
  }

  updateAdventureHUD({ coins, answeredCount, totalChallenges, hintText }) {
    const coinEl = document.getElementById("hud-coin-val");
    const questEl = document.getElementById("hud-quest-val");
    const hintEl = document.getElementById("hud-hint-banner");

    if (coinEl && coins !== undefined) coinEl.textContent = coins;
    if (questEl && answeredCount !== undefined) {
      questEl.textContent = `${answeredCount}/${totalChallenges}`;
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
    const existingModal = document.getElementById("active-quiz-modal");
    if (existingModal) existingModal.remove();

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
    const diffBadgeText = `Level: ${(questionData.difficulty || "mudah").toUpperCase()}`;

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
            ${this.escapeHtml(questionData.topic)} | ${this.escapeHtml(diffBadgeText)}
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
          <button id="btn-quiz-continue" class="btn-cartoon btn-green btn-small">Lanjutkan ➡️</button>
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
    const levelKey = resultData.levelKey || "easy";
    const requiredCount =
      Number(resultData.totalQuestions) ||
      (levelKey === "easy" ? 5 : levelKey === "medium" ? 7 : 10);

    const minCorrectRequired = Math.ceil(requiredCount * 0.8);
    const correctCount = Number(resultData.correctCount) || 0;
    const wrongCount = Number(resultData.wrongCount) || 0;
    const accuracyPct =
      requiredCount > 0 ? Math.round((correctCount / requiredCount) * 100) : 0;

    const isPassed = correctCount >= minCorrectRequired && accuracyPct >= 80;

    this.playTone(isPassed ? "correct" : "wrong");

    const normalizedResult = {
      ...resultData,
      levelKey,
      totalQuestions: requiredCount,
      correctCount,
      wrongCount,
      accuracy: accuracyPct,
      starsEarned: isPassed ? (correctCount === requiredCount ? 3 : 2) : 0,
    };

    if (this.activeProfile) {
      this.activeProfile = await db.recordAdventureResult(
        this.activeProfile.id,
        normalizedResult,
      );
    }

    const earnedStars = isPassed ? normalizedResult.starsEarned : 0;
    const starIcons = "⭐".repeat(earnedStars) + "☆".repeat(3 - earnedStars);
    const subInfo = this.getSubjectInfo(resultData.subject);

    const topBadgeText = isPassed ? "🏆 LEVEL LULUS! 🏆" : "⚠️ BELUM LULUS ⚠️";
    const topBadgeStyle = isPassed
      ? "background: #2ecc71; color: #ffffff;"
      : "background: #e74c3c; color: #ffffff;";

    let statusBannerHtml = "";
    if (!isPassed) {
      statusBannerHtml = `
        <div style="background:#fadbd8; color:#78281f; border:3px solid #34495e; border-radius:16px; padding:12px 16px; font-weight:800; margin-bottom:12px; font-size:0.98rem; line-height:1.45;">
          Belum mencapai target! Kamu harus menjawab minimal <strong>${minCorrectRequired} dari ${requiredCount} soal</strong> dengan benar. Yuk, coba lagi!
        </div>
      `;
    } else if (levelKey === "easy") {
      statusBannerHtml = `
        <div style="background:#d4efdf; color:#145a32; border:3px solid #34495e; border-radius:16px; padding:12px 16px; font-weight:800; margin-bottom:12px; font-size:0.98rem; line-height:1.45;">
          🎉 <strong>LEVEL LULUS (${accuracyPct}%)!</strong> Selamat, kamu berhasil menjawab ${correctCount} dari ${requiredCount} soal dengan benar.<br/>
          🔓 <strong>Level Sedang (${this.escapeHtml(subInfo.name)}) sekarang telah TERBUKA!</strong>
        </div>
      `;
    } else if (levelKey === "medium") {
      statusBannerHtml = `
        <div style="background:#d4efdf; color:#145a32; border:3px solid #34495e; border-radius:16px; padding:12px 16px; font-weight:800; margin-bottom:12px; font-size:0.98rem; line-height:1.45;">
          🎉 <strong>LEVEL LULUS (${accuracyPct}%)!</strong> Selamat, kamu berhasil menjawab ${correctCount} dari ${requiredCount} soal dengan benar.<br/>
          🔓 <strong>Level Sulit (${this.escapeHtml(subInfo.name)}) sekarang telah TERBUKA!</strong>
        </div>
      `;
    } else {
      statusBannerHtml = `
        <div style="background:#fff3cd; color:#856404; border:3px solid #34495e; border-radius:16px; padding:12px 16px; font-weight:800; margin-bottom:12px; font-size:0.98rem; line-height:1.45;">
          👑 <strong>LEVEL LULUS (${accuracyPct}%)!</strong> Luar biasa, kamu berhasil menjawab ${correctCount} dari ${requiredCount} soal dengan benar dan menamatkan Level Sulit ${this.escapeHtml(subInfo.name)}!
        </div>
      `;
    }

    this.container.innerHTML = `
      <div class="screen-overlay">
        <div class="cartoon-panel" style="max-width: 640px;">
          <div class="game-logo-badge" style="${topBadgeStyle}">${topBadgeText}</div>
          <h2 class="panel-header-title" style="margin-bottom: 4px; color: ${isPassed ? "#27ae60" : "#c0392b"};">
            ${isPassed ? "LEVEL LULUS" : "BELUM LULUS"}
          </h2>
          <div style="font-weight:800; font-size:1rem; color:#2c3e50; margin-bottom:2px;">
            ${this.escapeHtml(resultData.levelTitle)}
          </div>
          <div class="stars-display">${starIcons}</div>

          ${statusBannerHtml}

          <div class="result-stats-box">
            <div class="result-stat-row">
              <span>📝 Jumlah Soal:</span>
              <span>${requiredCount}/${requiredCount} Soal</span>
            </div>
            <div class="result-stat-row">
              <span>✅ Jawaban Benar:</span>
              <span style="color: #27ae60;">${correctCount} Soal (Target Minimal: ${minCorrectRequired})</span>
            </div>
            <div class="result-stat-row">
              <span>❌ Jawaban Salah:</span>
              <span style="color: #c0392b;">${wrongCount} Soal</span>
            </div>
            <div class="result-stat-row">
              <span>🎯 Akurasi:</span>
              <span style="color: ${isPassed ? "#27ae60" : "#c0392b"};">${accuracyPct}% (Syarat Lulus: 80%)</span>
            </div>
            <div class="result-stat-row">
              <span>⏱️ Waktu Penyelesaian:</span>
              <span>${resultData.durationSec || 0} detik</span>
            </div>
            <div class="result-stat-row">
              <span>🪙 Koin Diperoleh:</span>
              <span style="color: #d35400;">+${resultData.coinsEarned || 0} Koin</span>
            </div>
            <div class="result-stat-row" style="border-bottom: none;">
              <span>📌 Status Level:</span>
              <span style="color: ${isPassed ? "#27ae60" : "#c0392b"};">
                ${isPassed ? "✅ LEVEL LULUS" : "❌ BELUM LULUS (Ulangi Level)"}
              </span>
            </div>
          </div>

          <div class="btn-group-horizontal">
            <button id="btn-play-again" class="btn-cartoon btn-green btn-small">
              🔄 ${isPassed ? "Main Lagi" : "Ulangi Level Ini"}
            </button>
            <button id="btn-select-adv-level" class="btn-cartoon btn-blue btn-small">
              🗺️ Menu Level Adventure
            </button>
            <button id="btn-back-menu" class="btn-cartoon btn-gray btn-small">
              🏠 Menu Utama
            </button>
          </div>
        </div>
      </div>
    `;

    document.getElementById("btn-play-again").addEventListener("click", () => {
      this.playTone("click");
      this.startAdventureMode(levelKey);
    });

    document
      .getElementById("btn-select-adv-level")
      .addEventListener("click", () => {
        this.playTone("click");
        this.showAdventureLevelSelection();
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
    let chosenTargetSteps = 5;
    let tutorChar = "prof_panda";
    let studentChar = this.activeProfile?.character || "kiko";

    const renderSetupHTML = () => {
      const topics = questionManager.getTopicsBySubject(chosenSubject, this.selectedGrade);
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
            <div class="game-logo-badge">⚔️ MODE KOMPETISI 1 LAYAR (BALAPAN SAMPAI FINIS) ⚔️</div>
            <h2 class="panel-header-title" style="margin-bottom: 6px;">Persiapan Duel: Tutor vs Murid</h2>

            <div class="form-box">
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 10px;">
                <div class="form-group">
                  <label for="duel-sel-subject">📘 Mata Pelajaran:</label>
                  <select id="duel-sel-subject" class="input-cartoon">
                    ${GAME_CONFIG.subjects
                      .filter((s) => s.active)
                      .map(
                        (s) => `
                      <option value="${s.id}" ${chosenSubject === s.id ? "selected" : ""}>
                        ${s.icon} ${this.escapeHtml(s.name)} Kelas ${this.selectedGrade}
                      </option>
                    `,
                      )
                      .join("")}
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
                  <label for="duel-sel-rounds">🏁 Target Jarak Garis Finis:</label>
                  <select id="duel-sel-rounds" class="input-cartoon">
                    <option value="5" ${chosenTargetSteps === 5 ? "selected" : ""}>5 Langkah Benar (Lintasan Pendek)</option>
                    <option value="10" ${chosenTargetSteps === 10 ? "selected" : ""}>10 Langkah Benar (Lintasan Panjang)</option>
                  </select>
                </div>
              </div>

              <div style="background:#eef9ff; border:2px dashed #3498db; border-radius:12px; padding:8px 12px; margin-bottom:10px; font-size:0.86rem; font-weight:700; color:#2c3e50;">
                💡 <strong>Aturan Balapan Sampai Finis:</strong> Soal terus diberikan tanpa batas sampai ada pemain yang menyentuh Garis Finis (${chosenTargetSteps} langkah benar). Jika Tutor menyentuh finis duluan, Murid tetap diberi giliran menyamakan kedudukan. Jika imbang di garis finis, diadakan <strong>1 Soal Penentuan (Siapa Cepat & Tepat Dia Menang)</strong>!
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
          chosenTargetSteps = Number(e.target.value);
          renderSetupHTML();
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
            rounds: chosenTargetSteps,
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
      targetSteps: config.rounds,
      totalRounds: config.rounds,
      currentRound: 1,
      isTieBreaker: false,
      tieBreakerResult: null,
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
        tieBreakerCorrect: false,
        tieBreakerTimeMs: 0,
      },
      studentStats: {
        correct: 0,
        wrong: 0,
        streak: 0,
        totalTimeMs: 0,
        tieBreakerCorrect: false,
        tieBreakerTimeMs: 0,
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
      grade: this.selectedGrade,
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

    const duelScene = this.phaserGame.scene.getScene("DuelScene");
    const pos = duelScene
      ? duelScene.getRacePositions()
      : {
          tutorStep: s.tutorStats.correct,
          studentStep: s.studentStats.correct,
        };

    const isStudentEqualizerChance =
      !isTutor &&
      !s.isTieBreaker &&
      pos.tutorStep >= s.targetSteps &&
      pos.studentStep === s.targetSteps - 1;

    let badgeHeader = `${subInfo.icon} ${subInfo.name.toUpperCase()} — RONDE KE-${s.currentRound} (TARGET FINIS: ${s.targetSteps} LANGKAH)`;
    if (s.isTieBreaker) {
      badgeHeader = `⚡BABAK PENENTUAN (SUDDEN DEATH TIE-BREAKER) — SIAPA CEPAT & TEPAT DIA MENANG!⚡`;
    }

    const headingText = isTutor
      ? s.isTieBreaker
        ? "⚡ GILIRAN TUTOR (SOAL PENENTUAN CEPAT)!"
        : "👨‍🏫 SEKARANG GILIRAN TUTOR!"
      : s.isTieBreaker
        ? `⚡ GILIRAN ${this.escapeHtml(s.studentName.toUpperCase())} (SOAL PENENTUAN CEPAT)!`
        : `🧒 SEKARANG GILIRAN ${this.escapeHtml(s.studentName.toUpperCase())}!`;

    let instructionText = isTutor
      ? "Serahkan laptop kepada Tutor. Pastikan layar siap untuk memulai ronde."
      : "Serahkan laptop kepada Murid. Soal Tutor sebelumnya telah disembunyikan sepenuhnya.";

    if (isStudentEqualizerChance) {
      instructionText = `🔥 Tutor sudah menyentuh garis finis! Ini kesempatan ${this.escapeHtml(s.studentName)} untuk menjawab BENAR agar menyamakan kedudukan dan memicu Babak Penentuan!`;
    } else if (s.isTieBreaker) {
      instructionText = isTutor
        ? "Kedudukan seri di Garis Finis! Jawab 1 soal penentuan ini dengan BENAR dan SECEPAT MUNGKIN!"
        : `Kedudukan seri di Garis Finis! Serahkan laptop kepada ${this.escapeHtml(s.studentName)}. Jawab 1 soal penentuan ini dengan BENAR dan SECEPAT MUNGKIN!`;
    }

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
          <div class="game-logo-badge" style="${s.isTieBreaker ? "background:#ff4757; color:#fff;" : ""}">
            ${this.escapeHtml(badgeHeader)}
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
            🔒 <strong>Posisi Saat Ini:</strong> Tutor (${pos.tutorStep}/${s.targetSteps}) vs ${this.escapeHtml(s.studentName)} (${pos.studentStep}/${s.targetSteps})<br/>
            Topik Ronde Ini: <strong>${this.escapeHtml(roundTopicLabel)}</strong> | Kesulitan Setara: <strong>${this.escapeHtml(roundDiffLabel)}</strong>
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
      : { tutorStep: 0, studentStep: 0, tutorPct: 0, studentPct: 0 };

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

    const roundBadgeText = s.isTieBreaker
      ? "⚡ BABAK PENENTUAN CEPAT ⚡"
      : `🏁 Ronde Ke-${s.currentRound} (Finis: ${s.targetSteps} Langkah)`;

    this.container.innerHTML = `
      <div class="hud-overlay" style="padding: 12px 18px;">
        <div class="hud-top-bar">
          <div class="hud-stats-group">
            <div class="hud-pill" style="background: ${s.isTieBreaker ? "#ffeaa7" : "#fff9db"};">
              <span><strong>${roundBadgeText}</strong></span>
            </div>
            <div class="hud-pill" style="background: ${isTutor ? "#d6eaf8" : "#fdebd0"};">
              <span>${charInfo.emoji} Giliran: <strong>${this.escapeHtml(playerName)}</strong></span>
            </div>
            <div class="hud-pill">
              <span>👨‍🏫 Tutor: ${posInfo.tutorStep}/${s.targetSteps} (${posInfo.tutorPct}%) | 🧒 ${this.escapeHtml(s.studentName)}: ${posInfo.studentStep}/${s.targetSteps} (${posInfo.studentPct}%)</span>
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
                ${charInfo.emoji} ${s.isTieBreaker ? "SOAL PENENTUAN KECEPATAN:" : "SOAL UNTUK"} ${this.escapeHtml(playerName.toUpperCase())}
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
          150,
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
          round: s.isTieBreaker ? "TIE_BREAKER" : s.currentRound,
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
          if (s.isTieBreaker) {
            s.tutorStats.tieBreakerCorrect = isCorrect;
            s.tutorStats.tieBreakerTimeMs = elapsedMs;
          } else if (isCorrect) {
            s.tutorStats.correct += 1;
            s.tutorStats.streak += 1;
          } else {
            s.tutorStats.wrong += 1;
            s.tutorStats.streak = 0;
          }
        } else {
          s.studentStats.totalTimeMs += elapsedMs;
          if (s.isTieBreaker) {
            s.studentStats.tieBreakerCorrect = isCorrect;
            s.studentStats.tieBreakerTimeMs = elapsedMs;
          } else if (isCorrect) {
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

        const timeSecStr = (elapsedMs / 1000).toFixed(2);
        const qCard = document.getElementById("duel-question-card");
        if (qCard) {
          qCard.innerHTML = `
            <div style="padding: 16px;">
              <h3 style="font-size: 1.4rem; font-weight: 900; color: ${isCorrect ? "#27ae60" : "#e67e22"};">
                ${
                  isCorrect
                    ? `🎉 JAWABAN BENAR! (${timeSecStr} detik)`
                    : `💪 Belum Tepat! (${timeSecStr} detik)`
                }
              </h3>
              <p style="margin-top: 6px; font-weight: 700; color: #576574;">
                Soal telah disembunyikan secara otomatis untuk menjaga kerahasiaan giliran berikutnya.
              </p>
            </div>
          `;
        }

        if (s.isTieBreaker) {
          if (duelScene && isCorrect) {
            const runnerX = duelScene.finishX;
            const runnerY = isTutor ? duelScene.tutorY : duelScene.studentY;
            duelScene.spawnTurboEffect(
              runnerX,
              runnerY,
              `⚡ ${timeSecStr} dtk!`,
            );
          }
          setTimeout(() => {
            this.advanceDuelTurnState(turnRole);
          }, 800);
          return;
        }

        const currentStreak = isTutor
          ? s.tutorStats.streak
          : s.studentStats.streak;

        if (duelScene) {
          duelScene.animateRunnerMove({
            role: turnRole,
            isCorrect,
            streak: currentStreak,
            onComplete: () => {
              setTimeout(() => {
                this.advanceDuelTurnState(turnRole);
              }, 650);
            },
          });
        } else {
          this.advanceDuelTurnState(turnRole);
        }
      });
    });
  }

  advanceDuelTurnState(completedRole) {
    const s = this.duelSession;

    if (completedRole === "tutor") {
      this.showHotSeatTransition("student");
      return;
    }

    if (s.isTieBreaker) {
      this.showDuelMatchResult();
      return;
    }

    const duelScene = this.phaserGame.scene.getScene("DuelScene");
    const pos = duelScene
      ? duelScene.getRacePositions()
      : {
          tutorStep: s.tutorStats.correct,
          studentStep: s.studentStats.correct,
        };

    const tutorFinished = pos.tutorStep >= s.targetSteps;
    const studentFinished = pos.studentStep >= s.targetSteps;

    if (tutorFinished && studentFinished) {
      s.isTieBreaker = true;
      this.prepareNextDuelRound();
      return;
    }

    if (tutorFinished || studentFinished) {
      this.showDuelMatchResult();
      return;
    }

    s.currentRound += 1;
    this.prepareNextDuelRound();
  }

  async showDuelMatchResult() {
    this.playTone("correct");
    const s = this.duelSession;
    const duelScene = this.phaserGame.scene.getScene("DuelScene");
    const pos = duelScene
      ? duelScene.getRacePositions()
      : {
          tutorStep: Math.min(s.targetSteps, s.tutorStats.correct),
          studentStep: Math.min(s.targetSteps, s.studentStats.correct),
          tutorPct: Math.min(
            100,
            Math.round((s.tutorStats.correct / s.targetSteps) * 100),
          ),
          studentPct: Math.min(
            100,
            Math.round((s.studentStats.correct / s.targetSteps) * 100),
          ),
        };

    let winner = "draw";
    let bannerTitle = "🤝 PERTANDINGAN SERI! SAMA-SAMA HEBAT!";
    let encouragingMsg =
      "Luar biasa! Tutor dan Murid sama-sama tangguh di lintasan balap!";
    let tieBreakerNoteHtml = "";

    if (s.isTieBreaker) {
      const tOk = s.tutorStats.tieBreakerCorrect;
      const sOk = s.studentStats.tieBreakerCorrect;
      const tSec = (s.tutorStats.tieBreakerTimeMs / 1000).toFixed(2);
      const sSec = (s.studentStats.tieBreakerTimeMs / 1000).toFixed(2);

      if (sOk && !tOk) {
        winner = "student";
        bannerTitle = `🏆 PEMENANG TIE-BREAKER: ${s.studentName.toUpperCase()}!`;
        encouragingMsg = `Luar biasa ${s.studentName}! Kamu berhasil menjawab soal penentuan dengan tepat!`;
      } else if (tOk && !sOk) {
        winner = "tutor";
        bannerTitle = "🏆 PEMENANG TIE-BREAKER: TUTOR!";
        encouragingMsg = `Pertandingan yang sangat sengit! ${s.studentName} berhasil memaksa Tutor hingga ke Babak Penentuan!`;
      } else if (sOk && tOk) {
        if (s.studentStats.tieBreakerTimeMs <= s.tutorStats.tieBreakerTimeMs) {
          winner = "student";
          bannerTitle = `⚡ MENANG ADU CEPAT: ${s.studentName.toUpperCase()}!`;
          encouragingMsg = `Hebat sekali ${s.studentName}! Keduanya menjawab benar di Babak Penentuan, dan kamu menang karena menjawab lebih cepat (${sSec} detik vs ${tSec} detik)!`;
        } else {
          winner = "tutor";
          bannerTitle = "⚡ MENANG ADU CEPAT: TUTOR!";
          encouragingMsg = `Luar biasa ${s.studentName}! Kamu dan Tutor sama-sama menjawab benar di Babak Penentuan, hanya terpaut tipis di kecepatan waktu (${tSec} detik vs ${sSec} detik)!`;
        }
      } else {
        if (s.studentStats.totalTimeMs <= s.tutorStats.totalTimeMs) {
          winner = "student";
          bannerTitle = `🏆 PEMENANG KECEPATAN TOTAL: ${s.studentName.toUpperCase()}!`;
        } else {
          winner = "tutor";
          bannerTitle = "🏆 PEMENANG KECEPATAN TOTAL: TUTOR!";
        }
      }

      tieBreakerNoteHtml = `
        <div style="background:#fff3cd; border:3px solid #34495e; border-radius:14px; padding:10px; margin-bottom:10px; font-weight:800; font-size:0.92rem;">
          ⚡ <strong>Hasil Babak Penentuan (Tie-Breaker):</strong>
          🧒 ${this.escapeHtml(s.studentName)}: ${sOk ? "✅ Benar" : "❌ Salah"} (${sSec} dtk) &nbsp;|&nbsp;
          👨‍🏫 Tutor: ${tOk ? "✅ Benar" : "❌ Salah"} (${tSec} dtk)
        </div>
      `;
    } else if (pos.studentStep > pos.tutorStep) {
      winner = "student";
      bannerTitle = `🏆 PEMENANG: ${s.studentName.toUpperCase()}!`;
      encouragingMsg = `Selamat ${s.studentName}! Kamu berhasil menyentuh Garis Finis lebih dulu!`;
    } else if (pos.tutorStep > pos.studentStep) {
      winner = "tutor";
      bannerTitle = "🏆 PEMENANG: TUTOR!";
      encouragingMsg = `Usaha yang sangat hebat, ${s.studentName}! Kamu sudah berjuang keras. Yuk tanding lagi!`;
    }

    const tutorTotalAns =
      s.tutorStats.correct + s.tutorStats.wrong + (s.isTieBreaker ? 1 : 0);
    const studentTotalAns =
      s.studentStats.correct + s.studentStats.wrong + (s.isTieBreaker ? 1 : 0);

    const tutorTotalCorrect =
      s.tutorStats.correct + (s.tutorStats.tieBreakerCorrect ? 1 : 0);
    const studentTotalCorrect =
      s.studentStats.correct + (s.studentStats.tieBreakerCorrect ? 1 : 0);

    const tutorAcc =
      tutorTotalAns > 0
        ? Math.round((tutorTotalCorrect / tutorTotalAns) * 100)
        : 0;
    const studentAcc =
      studentTotalAns > 0
        ? Math.round((studentTotalCorrect / studentTotalAns) * 100)
        : 0;

    const tutorAvgSec =
      tutorTotalAns > 0
        ? (s.tutorStats.totalTimeMs / tutorTotalAns / 1000).toFixed(2)
        : "0.00";
    const studentAvgSec =
      studentTotalAns > 0
        ? (s.studentStats.totalTimeMs / studentTotalAns / 1000).toFixed(2)
        : "0.00";

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
        totalRounds: s.currentRound,
        winner,
        studentStats: {
          correct: studentTotalCorrect,
          wrong: studentTotalAns - studentTotalCorrect,
          accuracy: studentAcc,
          avgTimeSec: Number(studentAvgSec),
          finalPositionPct: pos.studentPct,
        },
        tutorStats: {
          correct: tutorTotalCorrect,
          wrong: tutorTotalAns - tutorTotalCorrect,
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
          <div class="game-logo-badge">🏁 HASIL AKHIR DUEL MODE (${s.currentRound} RONDE BERLANGSUNG) 🏁</div>
          <h2 class="panel-header-title" style="margin-bottom: 4px;">${this.escapeHtml(bannerTitle)}</h2>
          <p class="game-subtitle" style="margin-bottom: 10px; font-size: 0.98rem; color: #27ae60;">
            ${this.escapeHtml(encouragingMsg)}
          </p>

          ${tieBreakerNoteHtml}

          <div class="duel-comparison-grid">
            <div class="duel-player-card" style="background: #fffdf2; border-color: #f39c12;">
              <div style="font-size: 1.15rem; font-weight: 900; color: #d35400; margin-bottom: 6px;">
                🧒 Murid: ${this.escapeHtml(s.studentName)}
              </div>
              <div class="result-stat-row"><span>📍 Posisi Finis:</span><span>${pos.studentPct}% (${pos.studentStep}/${s.targetSteps} Langkah)</span></div>
              <div class="result-stat-row"><span>✅ Total Jawaban Benar:</span><span style="color:#27ae60;">${studentTotalCorrect} dari ${studentTotalAns} Soal</span></div>
              <div class="result-stat-row"><span>🎯 Akurasi:</span><span>${studentAcc}%</span></div>
              <div class="result-stat-row" style="border:none;"><span>⏱️ Rata-rata Kecepatan:</span><span>${studentAvgSec} detik/soal</span></div>
            </div>

            <div class="duel-player-card" style="background: #f4f9fd; border-color: #3498db;">
              <div style="font-size: 1.15rem; font-weight: 900; color: #2980b9; margin-bottom: 6px;">
                👨‍🏫 Tutor Pendamping
              </div>
              <div class="result-stat-row"><span>📍 Posisi Finis:</span><span>${pos.tutorPct}% (${pos.tutorStep}/${s.targetSteps} Langkah)</span></div>
              <div class="result-stat-row"><span>✅ Total Jawaban Benar:</span><span style="color:#27ae60;">${tutorTotalCorrect} dari ${tutorTotalAns} Soal</span></div>
              <div class="result-stat-row"><span>🎯 Akurasi:</span><span>${tutorAcc}%</span></div>
              <div class="result-stat-row" style="border:none;"><span>⏱️ Rata-rata Kecepatan:</span><span>${tutorAvgSec} detik/soal</span></div>
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

  renderSubjectAdventureTableForTutor(profile, subjectId, subjectTitle, grade = null) {
    const targetGrade = Number(grade) || Number(profile?.grade) || 3;
    const subjProg = db.getSubjectAdventureProgress(profile, subjectId, targetGrade);
    const rowsHtml = GAME_CONFIG.adventureLevels
      .map((lvl) => {
        const st = subjProg?.levels?.[lvl.id] || {
          unlocked: lvl.id === "easy",
          completed: false,
          totalQuestions: lvl.totalQuestions,
          questionsAnswered: 0,
          correctAnswers: 0,
          wrongAnswers: 0,
          accuracy: 0,
        };

        let badgeHtml = `<span style="color:#c0392b; font-weight:800;">🔒 Terkunci</span>`;
        if (st.completed) {
          badgeHtml = `<span style="color:#27ae60; font-weight:900;">✅ Selesai (${st.playCount || 1}x)</span>`;
        } else if (st.unlocked) {
          badgeHtml = `<span style="color:#2980b9; font-weight:800;">🔓 Terbuka</span>`;
        }

        return `
        <tr>
          <td><strong>${lvl.icon} ${this.escapeHtml(lvl.name)}</strong></td>
          <td>${badgeHtml}</td>
          <td>${st.questionsAnswered || 0} / ${lvl.totalQuestions} Soal</td>
          <td>✅ ${st.correctAnswers || 0} / ❌ ${st.wrongAnswers || 0}</td>
          <td><strong>${st.accuracy || 0}%</strong></td>
        </tr>
      `;
      })
      .join("");

    return `
      <div style="margin-bottom: 12px;">
        <div style="font-weight: 900; margin-bottom: 4px; color: #2c3e50;">${subjectTitle}</div>
        <table class="tutor-table">
          <thead>
            <tr>
              <th>Level Adventure</th>
              <th>Status Level</th>
              <th>Soal Dikerjakan</th>
              <th>Benar / Salah</th>
              <th>Akurasi Level</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      </div>
    `;
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
                const mtkProg = db.getSubjectAdventureProgress(p, "matematika");
                const ipasProg = db.getSubjectAdventureProgress(p, "ipas");

                const countCompleted = (prog) =>
                  ["easy", "medium", "hard"].filter(
                    (k) => prog?.levels?.[k]?.completed,
                  ).length;

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
                <td>${countCompleted(mtkProg)}/3 Level Selesai</td>
                <td>${countCompleted(ipasProg)}/3 Level Selesai</td>
                <td>${duelCount}x Duel</td>
                <td>${totAns} Soal (${acc}%)</td>
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
          <div style="font-weight: 900; margin-bottom: 6px;">📊 Ringkasan Progres Seluruh Siswa (Adventure Terpisah Per Mapel & Duel):</div>
          <table class="tutor-table">
            <thead>
              <tr>
                <th>Nama Siswa</th>
                <th>Kelas</th>
                <th>Adventure Matematika</th>
                <th>Adventure IPAS</th>
                <th>Mode Duel</th>
                <th>Total Soal (Akurasi)</th>
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

        const advTablesHtml = GAME_CONFIG.subjects
          .filter((s) => s.active)
          .map((s) =>
            this.renderSubjectAdventureTableForTutor(
              targetProfile,
              s.id,
              `${s.icon} Progres Adventure ${s.name} (Terpisah dari Mapel Lain & Mode Duel):`,
            ),
          )
          .join("");

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

        const duelRows =
          (targetProfile.duelHistory || []).length === 0
            ? `<tr><td colspan="5" style="text-align:center;">Belum ada riwayat pertandingan Duel.</td></tr>`
            : [...targetProfile.duelHistory]
                .reverse()
                .slice(0, 10)
                .map(
                  (d) => `
              <tr>
                <td>${this.formatDate(d.playedAt)}</td>
                <td>${this.escapeHtml((d.subject || "").toUpperCase())} (${this.escapeHtml(d.topic)})</td>
                <td>✅ ${d.studentStats?.correct || 0} / ❌ ${d.studentStats?.wrong || 0} (${d.studentStats?.accuracy || 0}%)</td>
                <td>Murid ${d.studentStats?.finalPositionPct || 0}% vs Tutor ${d.tutorStats?.finalPositionPct || 0}%</td>
                <td><strong>${d.winner === "student" ? "🏆 Murid" : d.winner === "tutor" ? "👨‍🏫 Tutor" : "🤝 Seri"}</strong></td>
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

          <div class="tutor-scroll-area" style="max-height: 330px;">
            ${advTablesHtml}

            <div class="topic-eval-box" style="margin-top:0; margin-bottom:10px;">
              <div>
                📖 <strong>Materi yang Perlu Diulang / Penguatan (Total Akurasi Siswa: ${sAcc}%):</strong>
                <span style="color:#d35400;">
                  ${(targetProfile.topicsToReview || []).length > 0 ? this.escapeHtml(targetProfile.topicsToReview.join(", ")) : "Tidak ada topik yang tertinggal!"}
                </span>
              </div>
            </div>

            <div style="font-weight:900; margin: 8px 0 4px;">🎯 Performa Per Topik & Tingkat Kesulitan Adaptif:</div>
            <table class="tutor-table" style="margin-bottom: 12px;">
              <thead>
                <tr><th>Mapel</th><th>Topik</th><th>Dijawab</th><th>Akurasi</th><th>Level Adaptif</th><th>Status</th></tr>
              </thead>
              <tbody>${topicPerfRows}</tbody>
            </table>

            <div style="font-weight:900; margin: 8px 0 4px;">⚔️ Riwayat Pertandingan Duel (Terpisah dari Progres Adventure):</div>
            <table class="tutor-table">
              <thead>
                <tr><th>Waktu</th><th>Mapel & Topik</th><th>Benar/Salah (Akurasi)</th><th>Posisi Finis</th><th>Pemenang</th></tr>
              </thead>
              <tbody>${duelRows}</tbody>
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
              🎯 Konfigurasi Tingkat Kesulitan Duel (Manual & Adaptif)
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
            <h2 class="panel-header-title" style="margin-bottom:0;">👨‍🏫 Panel Tutor & Progres Adventure Per Mapel</h2>
            <button id="btn-close-tutor" class="btn-cartoon btn-gray btn-small">🏠 Kembali ke Menu Utama</button>
          </div>

          <div class="tutor-tabs-nav">
            <button class="tutor-tab-btn ${activeTab === "dashboard" ? "active" : ""}" data-tab="dashboard">📊 Dashboard</button>
            <button class="tutor-tab-btn ${activeTab === "students" ? "active" : ""}" data-tab="students">👦 Manajemen Siswa</button>
            <button class="tutor-tab-btn ${activeTab === "reports" ? "active" : ""}" data-tab="reports">📈 Laporan Adventure & Duel</button>
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
