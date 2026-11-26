import { uiIcons } from "./UIIcons.js";
import { getAdventureModeConfig } from "./adventure/AdventureModeConfig.js";
import {
  characterAssetManager,
  CHARACTER_ROSTER,
} from "./CharacterAssetManager.js";
import {
  renderMainMenuBackdrop,
  renderFantasyWorldBackdrop,
  renderFallbackTitleCrest,
} from "./ThemeVisualAssets.js";
import { GAME_CONFIG } from "../config/gameConfig.js";
import { db } from "../storage/db.js";
import { questionManager } from "./QuestionManager.js";
import { hybridEngine } from "./HybridQuestionEngine.js";
import { questionQualityEngine } from "./QuestionQualityEngine.js";
import { questionVisualRenderer } from "./QuestionVisualRenderer.js";
import {
  BATTLE_CHARACTERS,
  BATTLE_COSTUMES,
  BATTLE_ACCESSORIES,
  BATTLE_ATTACK_EFFECTS,
  BATTLE_VICTORY_EFFECTS,
  BATTLE_ACHIEVEMENTS,
  calculateBattleLevel,
} from "../data/battleArenaCatalog.js";
import { battleAudio } from "./BattleAudioManager.js";
import { BattleFighterRig } from "../systems/BattleFighterRig.js";
import { earlyChildhoodManager } from "./EarlyChildhoodAdventureManager.js";

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
    this.battleSession = null;
    this.tutorUnlocked = false;
  }

  async init(phaserGame) {
    this.phaserGame = phaserGame;
    await db.init();
    this.settings = await db.getSettings();
    battleAudio.configure({
      muted: Boolean(this.settings.battleMuted),
      volume: this.settings.battleVolume ?? 0.6,
    });
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

  formatGradeLabel(grade) {
    const raw = String(grade ?? 3).toLowerCase();
    if (raw === "paud") return "PAUD";
    if (raw === "tk") return "TK";
    return `Kelas ${raw} SD`;
  }

  renderProfileBanner() {
    if (!this.activeProfile) {
      return `
        <div class="active-profile-pill">
          ${uiIcons.get("user", 18)}
          <span>Belum ada profil aktif</span>
        </div>
      `;
    }
    const gradeLabel = this.formatGradeLabel(this.activeProfile.grade);
    return `
      <div class="active-profile-pill">
        ${uiIcons.get("user", 18)}
        <span><strong>${this.escapeHtml(this.activeProfile.name)}</strong> · ${this.escapeHtml(gradeLabel)}</span>
        <span class="pdp-profile-metric">${uiIcons.get("coin", 16)} ${this.activeProfile.coins || 0}</span>
        <span class="pdp-profile-metric">${uiIcons.get("star", 16)} ${this.activeProfile.stars || 0}</span>
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
    [
      'ForestClimbScene',
      'OceanExplorerScene',
      'LavaAdventureScene',
      'TreasureExplorerScene',
      'AdventureScene',
      'SurvivalArenaScene',
      'CarRacingScene',
      'MazeAdventureScene',
      'DuelScene',
      'BattleArenaScene'
    ].forEach((scKey) => {
      if (this.phaserGame.scene.isActive(scKey)) {
        this.phaserGame.scene.stop(scKey);
      }
    });
  }

  getActiveAdventureSceneInstance() {
    if (!this.phaserGame) return null;
    for (const key of [
      'ForestClimbScene',
      'OceanExplorerScene',
      'LavaAdventureScene',
      'TreasureExplorerScene',
      'AdventureScene',
      'SurvivalArenaScene',
      'CarRacingScene',
      'MazeAdventureScene'
    ]) {
      if (this.phaserGame.scene.isActive(key)) {
        return this.phaserGame.scene.getScene(key);
      }
    }
    return null;
  }

  renderFantasyBackdrop() {
    return renderFantasyWorldBackdrop();
  }

  showMainMenu() {
    this.stopAllGameplayScenes();

    const activeName = this.activeProfile
      ? this.activeProfile.name
      : "Petualang Baru";
    const activeGradeText = this.activeProfile
      ? `Untuk ${this.formatGradeLabel(this.activeProfile.grade)}`
      : "Untuk Kelas 3 SD";
    const activeStars = this.activeProfile?.stars || 0;
    const activeLevel = Math.max(
      1,
      Math.floor((this.activeProfile?.totalScore || 0) / 500) + 1,
    );
    const avatarInitial = activeName.charAt(0).toUpperCase();
    const activeCharId = this.activeProfile?.character || "kiko";
    const activeCharUrl =
      characterAssetManager.getPortraitDataURL(activeCharId);

    this.container.innerHTML = `
      <div class="screen-overlay">
        ${renderMainMenuBackdrop()}
        <div class="pdp-menu-screen">
          <div class="pdp-menu-topbar">
            <div class="pdp-top-right-group">
              <div id="btn-top-profile" class="pdp-top-profile-pill" title="Kelola Profil">
                <div class="pdp-top-avatar">
                  <img src="${activeCharUrl}" alt="${this.escapeHtml(activeName)}" />
                </div>
                <div style="text-align:left;line-height:1.25;">
                  <div style="font-weight:900;font-size:0.98rem;color:#ffffff;">${this.escapeHtml(activeName)}</div>
                  <div style="font-size:0.8rem;color:#fde68a;font-weight:800;display:flex;align-items:center;gap:5px;">
                    <span>Level ${activeLevel}</span>
                    ${uiIcons.get("star", 14)}
                    <span>${activeStars}</span>
                  </div>
                </div>
              </div>
              <button id="btn-top-settings" class="pdp-top-gear-btn" aria-label="Pengaturan">
                ${uiIcons.get("settings", 24)}
              </button>
            </div>
          </div>

          <div class="pdp-menu-stage-grid">
            <div class="pdp-menu-left-col">
              ${renderFallbackTitleCrest()}
              <div class="pdp-motto-sign">
                ${uiIcons.get("star", 24)}
                <span>Jadilah Petualang Cerdas,<br/>Raih Bintang Pengetahuan!</span>
              </div>
            </div>

            <div class="pdp-wood-signpost">
              <svg class="pdp-wood-leaves" viewBox="0 0 90 46" aria-hidden="true">
                <path d="M46 42 Q40 16 14 14 Q28 36 46 42 Z" fill="#22c55e" stroke="#14532d" stroke-width="2.5"/>
                <path d="M48 42 Q56 10 82 14 Q68 38 48 42 Z" fill="#4ade80" stroke="#14532d" stroke-width="2.5"/>
                <path d="M47 40 Q47 10 50 4 Q58 22 47 40 Z" fill="#84cc16" stroke="#14532d" stroke-width="2"/>
              </svg>

              <button id="btn-start-game" class="btn-cartoon pdp-btn-gold">
                ${uiIcons.get("play", 24)}
                <span>Mulai Petualangan</span>
              </button>
              <button id="btn-battle-arena" class="btn-cartoon btn-red">
                ${uiIcons.get("swords", 22)}
                <span>Quiz Battle Arena</span>
              </button>
              <button id="btn-profile" class="btn-cartoon btn-blue">
                ${uiIcons.get("users", 22)}
                <span>Profil &amp; Karakter</span>
              </button>
              <button id="btn-tutor-panel" class="btn-cartoon btn-purple">
                ${uiIcons.get("trophy", 22)}
                <span>Panel Tutor</span>
              </button>
              <button id="btn-settings" class="btn-cartoon btn-green">
                ${uiIcons.get("settings", 22)}
                <span>Pengaturan</span>
              </button>
              <button id="btn-about" class="btn-cartoon pdp-btn-wood">
                ${uiIcons.get("gamepad", 22)}
                <span>Tentang Game</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    document.getElementById("btn-start-game").addEventListener("click", () => {
      this.playTone("click");
      if (!this.activeProfile) {
        this.showProfileMenu();
      } else {
        this.showGradeSelection();
      }
    });

    document
      .getElementById("btn-battle-arena")
      .addEventListener("click", () => {
        this.playTone("click");
        this.showBattleArenaHub("setup");
      });

    const openProfile = () => {
      this.playTone("click");
      this.showProfileMenu();
    };
    document
      .getElementById("btn-profile")
      .addEventListener("click", openProfile);
    document
      .getElementById("btn-top-profile")
      .addEventListener("click", openProfile);

    document.getElementById("btn-tutor-panel").addEventListener("click", () => {
      this.playTone("click");
      this.showTutorLoginModal();
    });

    const openSettings = () => {
      this.playTone("click");
      this.showSettingsMenu();
    };
    document
      .getElementById("btn-settings")
      .addEventListener("click", openSettings);
    document
      .getElementById("btn-top-settings")
      .addEventListener("click", openSettings);

    document.getElementById("btn-about").addEventListener("click", () => {
      this.playTone("click");
      this.showAboutMenu();
    });
  }

  async showCharacterSelection({
    currentCharId = "kiko",
    profileToUpdate = null,
    onSelect,
  } = {}) {
    await characterAssetManager.ensureLineupImageLoaded();
    let selectedCharId =
      characterAssetManager.getCharacterMeta(currentCharId).id;
    let previewPose = "idle";
    let stopPreview = null;

    const poses = [
      { key: "idle", label: "Diam" },
      { key: "run", label: "Berlari" },
      { key: "jump", label: "Melompat" },
      { key: "attack", label: "Menyerang" },
      { key: "victory", label: "Menang" },
    ];

    const renderScreen = () => {
      if (stopPreview) stopPreview();
      const meta = characterAssetManager.getCharacterMeta(selectedCharId);

      const cardsHtml = CHARACTER_ROSTER.map((c) => {
        const thumbUrl = characterAssetManager.getPortraitDataURL(c.id);
        const isSel = c.id === selectedCharId;
        return `
          <div class="pdp-char-select-card ${isSel ? "selected" : ""}" data-char="${c.id}">
            <img class="pdp-char-thumb" src="${thumbUrl}" alt="${this.escapeHtml(c.name)}" />
            <div style="font-weight:900;font-size:1rem;color:#2b1810;">${this.escapeHtml(c.name)}</div>
            <span class="status-badge" style="background:${c.badgeBg};color:${c.badgeText};font-size:0.68rem;">
              ${this.escapeHtml(c.title)}
            </span>
          </div>
        `;
      }).join("");

      const posesHtml = poses
        .map(
          (p) => `
        <button class="pdp-pose-btn ${p.key === previewPose ? "active" : ""}" data-pose="${p.key}">
          ${this.escapeHtml(p.label)}
        </button>
      `,
        )
        .join("");

      this.container.innerHTML = `
        <div class="screen-overlay">
          ${this.renderFantasyBackdrop()}
          <div class="cartoon-panel" style="max-width:940px;">
            <div>
              <h2 class="panel-header-title">${uiIcons.get("users", 26)} Pilih Karakter Petualang 3D</h2>
              <p class="game-subtitle" style="margin-bottom:8px;">
                ${profileToUpdate ? `Pilih karakter untuk profil <strong>${this.escapeHtml(profileToUpdate.name)}</strong>` : "Lihat animasi karakter sebelum memulai petualanganmu!"}
              </p>
            </div>

            <div class="pdp-char-studio-grid">
              <div class="pdp-char-stage-box">
                <canvas id="pdp-char-live-canvas" width="250" height="250"></canvas>
                <div class="pdp-pose-bar">${posesHtml}</div>
                <div style="text-align:center;padding:4px 8px;">
                  <div style="font-weight:900;font-size:1.2rem;color:#2b1810;">${this.escapeHtml(meta.name)}</div>
                  <div style="font-weight:800;font-size:0.86rem;color:${meta.accentColor};margin-bottom:4px;">
                    ${this.escapeHtml(meta.specialty)}
                  </div>
                  <div style="font-size:0.84rem;font-weight:600;color:#5c3a21;line-height:1.4;">
                    ${this.escapeHtml(meta.desc)}
                  </div>
                </div>
              </div>

              <div class="pdp-char-cards-grid">
                ${cardsHtml}
              </div>
            </div>

            <div class="btn-group-horizontal">
              <button id="btn-char-cancel" class="btn-cartoon btn-gray btn-small">
                ${uiIcons.get("back", 16)} <span>Kembali</span>
              </button>
              <button id="btn-char-confirm" class="btn-cartoon btn-green">
                ${uiIcons.get("check", 18)} <span>Gunakan ${this.escapeHtml(meta.name)}</span>
              </button>
            </div>
          </div>
        </div>
      `;

      const liveCanvas = document.getElementById("pdp-char-live-canvas");
      stopPreview = characterAssetManager.mountLivePreview(
        liveCanvas,
        () => selectedCharId,
        () => previewPose,
      );

      this.container
        .querySelectorAll(".pdp-char-select-card")
        .forEach((card) => {
          card.addEventListener("click", () => {
            this.playTone("click");
            selectedCharId = card.dataset.char;
            renderScreen();
          });
        });

      this.container.querySelectorAll(".pdp-pose-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
          this.playTone("click");
          previewPose = btn.dataset.pose;
          renderScreen();
        });
      });

      document
        .getElementById("btn-char-cancel")
        .addEventListener("click", () => {
          if (stopPreview) stopPreview();
          this.playTone("click");
          this.showProfileMenu();
        });

      document
        .getElementById("btn-char-confirm")
        .addEventListener("click", async () => {
          if (stopPreview) stopPreview();
          this.playTone("correct");
          if (profileToUpdate) {
            profileToUpdate.character = selectedCharId;
            await db.saveProfile(profileToUpdate);
            if (
              this.activeProfile &&
              this.activeProfile.id === profileToUpdate.id
            ) {
              this.activeProfile = profileToUpdate;
            }
            if (this.phaserGame) {
              characterAssetManager.buildTexturesAndAnimations(
                this.phaserGame.scene.getScene("BootScene"),
              );
            }
            this.showProfileMenu();
            return;
          }
          if (onSelect) {
            onSelect(selectedCharId);
          } else {
            this.showProfileMenu();
          }
        });
    };

    renderScreen();
  }

  async showProfileMenu(draftState = null) {
    this.stopAllGameplayScenes();
    await characterAssetManager.ensureLineupImageLoaded();
    const profiles = await db.getAllProfiles();
    let draftName = draftState?.name || "";
    let draftGrade = draftState?.grade ?? 3;
    let selectedChar = draftState?.character || "kiko";

    const charMeta = characterAssetManager.getCharacterMeta(selectedChar);
    const charThumbUrl = characterAssetManager.getPortraitDataURL(selectedChar);

    const profileItemsHtml =
      profiles.length === 0
        ? `<div style="padding:14px;color:#7c563a;font-weight:700;">Belum ada profil siswa. Buat profil pertamamu di bawah ini!</div>`
        : profiles
            .map((p) => {
              const isCurrent =
                this.activeProfile && this.activeProfile.id === p.id;
              const pMeta = characterAssetManager.getCharacterMeta(p.character);
              const pThumb = characterAssetManager.getPortraitDataURL(
                p.character,
              );
              return `
                <div class="profile-item" style="${isCurrent ? "border-color:#f59e0b;background:#fffbeb;" : ""}">
                  <div class="profile-item-info">
                    <img src="${pThumb}" alt="${this.escapeHtml(pMeta.name)}" style="width:48px;height:56px;object-fit:contain;flex-shrink:0;" />
                    <div>
                      <div style="font-weight:900;font-size:1.02rem;color:#2b1810;">
                        ${this.escapeHtml(p.name)} ${isCurrent ? '<span class="status-badge badge-active" style="margin-left:6px;">Aktif</span>' : ""}
                      </div>
                      <div style="font-size:0.84rem;font-weight:700;color:#5c3a21;">
                        ${this.escapeHtml(this.formatGradeLabel(p.grade))} · ${this.escapeHtml(pMeta.name)} · ${p.coins || 0} Koin · ${p.stars || 0} Bintang
                      </div>
                    </div>
                  </div>
                  <div style="display:flex;gap:6px;flex-wrap:wrap;">
                    <button class="btn-cartoon btn-purple btn-small btn-change-char" data-id="${p.id}">
                      ${uiIcons.get("users", 15)} <span>Karakter</span>
                    </button>
                    <button class="btn-cartoon btn-blue btn-small btn-select-prof" data-id="${p.id}">
                      ${uiIcons.get("check", 15)} <span>Pilih</span>
                    </button>
                    <button class="btn-cartoon btn-red btn-small btn-del-prof" data-id="${p.id}">
                      ${uiIcons.get("x", 15)}
                    </button>
                  </div>
                </div>
              `;
            })
            .join("");

    this.container.innerHTML = `
      <div class="screen-overlay">
        ${this.renderFantasyBackdrop()}
        <div class="cartoon-panel" style="max-width:880px;">
          <h2 class="panel-header-title">${uiIcons.get("users", 26)} Profil &amp; Karakter Petualang</h2>
          <p class="game-subtitle" style="margin-bottom:10px;">Pilih profil murid yang sudah tersimpan atau buat profil petualang baru.</p>

          <div class="profile-list">${profileItemsHtml}</div>

          <div class="form-box">
            <div style="font-weight:900;font-size:1.04rem;margin-bottom:10px;color:#2b1810;">Buat Profil Siswa Baru</div>
            <div style="display:grid;grid-template-columns:1.2fr 0.8fr;gap:16px;align-items:center;">
              <div>
                <div class="form-group">
                  <label for="inp-student-name">Nama Siswa</label>
                  <input type="text" id="inp-student-name" class="input-cartoon" placeholder="Contoh: Raka" maxlength="24" value="${this.escapeHtml(draftName)}" />
                </div>
                <div class="form-group" style="margin-bottom:0;">
                  <label for="inp-student-grade">Jenjang / Kelas</label>
                  <select id="inp-student-grade" class="input-cartoon">
                    <option value="paud" ${String(draftGrade) === "paud" ? "selected" : ""}>PAUD (Aktif)</option>
                    <option value="tk" ${String(draftGrade) === "tk" ? "selected" : ""}>TK (Aktif)</option>
                    <option value="1" ${Number(draftGrade) === 1 ? "selected" : ""}>Kelas 1 SD (Aktif)</option>
                    <option value="2" ${Number(draftGrade) === 2 ? "selected" : ""}>Kelas 2 SD (Aktif)</option>
                    <option value="3" ${Number(draftGrade) === 3 ? "selected" : ""}>Kelas 3 SD (Aktif)</option>
                    <option value="4" ${Number(draftGrade) === 4 ? "selected" : ""}>Kelas 4 SD (Aktif)</option>
                    <option value="5" disabled>Kelas 5 SD (Coming Soon)</option>
                    <option value="6" disabled>Kelas 6 SD (Coming Soon)</option>
                  </select>
                </div>
              </div>

              <div style="background:#fffbeb;border:2px solid #f59e0b;border-radius:18px;padding:12px;text-align:center;display:flex;flex-direction:column;align-items:center;gap:6px;">
                <img src="${charThumbUrl}" alt="${this.escapeHtml(charMeta.name)}" style="width:86px;height:98px;object-fit:contain;" />
                <div style="font-weight:900;font-size:0.98rem;color:#2b1810;">${this.escapeHtml(charMeta.name)}</div>
                <button type="button" id="btn-open-char-studio" class="btn-cartoon btn-blue btn-small">
                  ${uiIcons.get("users", 15)} <span>Pilih Karakter 3D</span>
                </button>
              </div>
            </div>

            <div class="btn-group-horizontal" style="margin-top:14px;">
              <button id="btn-save-profile" class="btn-cartoon btn-green">
                ${uiIcons.get("check", 18)} <span>Simpan &amp; Mulai</span>
              </button>
              <button id="btn-back-from-profile" class="btn-cartoon btn-gray btn-small">
                ${uiIcons.get("back", 16)} <span>Kembali ke Menu</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    document
      .getElementById("btn-open-char-studio")
      .addEventListener("click", () => {
        this.playTone("click");
        const currentName = document.getElementById("inp-student-name").value;
        const currentGrade = document.getElementById("inp-student-grade").value;
        this.showCharacterSelection({
          currentCharId: selectedChar,
          onSelect: (chosenId) => {
            this.showProfileMenu({
              name: currentName,
              grade: currentGrade,
              character: chosenId,
            });
          },
        });
      });

    this.container.querySelectorAll(".btn-change-char").forEach((btn) => {
      btn.addEventListener("click", () => {
        this.playTone("click");
        const target = profiles.find((p) => p.id === btn.dataset.id);
        if (!target) return;
        this.showCharacterSelection({
          currentCharId: target.character,
          profileToUpdate: target,
        });
      });
    });

    this.container.querySelectorAll(".btn-select-prof").forEach((btn) => {
      btn.addEventListener("click", async () => {
        this.playTone("click");
        const found = await db.getProfileById(btn.dataset.id);
        if (found) {
          this.activeProfile = found;
          this.selectedGrade = found.grade;
          db.setActiveProfileId(found.id);
          this.showMainMenu();
        }
      });
    });

    this.container.querySelectorAll(".btn-del-prof").forEach((btn) => {
      btn.addEventListener("click", async () => {
        this.playTone("wrong");
        if (confirm("Hapus profil siswa ini beserta progresnya?")) {
          await db.deleteProfile(btn.dataset.id);
          if (this.activeProfile && this.activeProfile.id === btn.dataset.id) {
            this.activeProfile = await db.getActiveProfile();
          }
          this.showProfileMenu();
        }
      });
    });

    document
      .getElementById("btn-save-profile")
      .addEventListener("click", async () => {
        const nameVal = document
          .getElementById("inp-student-name")
          .value.trim();
        const gradeVal = document.getElementById("inp-student-grade").value;
        if (!nameVal) {
          this.playTone("wrong");
          alert("Silakan masukkan nama siswa terlebih dahulu.");
          return;
        }
        this.playTone("correct");
        const created = await db.createProfile({
          name: nameVal,
          grade: gradeVal,
          character: selectedChar,
        });
        this.activeProfile = created;
        this.selectedGrade = created.grade;
        this.showMainMenu();
      });

    document
      .getElementById("btn-back-from-profile")
      .addEventListener("click", () => {
        this.playTone("click");
        this.showMainMenu();
      });
  }
  showGradeSelection() {
    this.stopAllGameplayScenes();
    const cardsHtml = GAME_CONFIG.classes
      .map(
        (cls) => `
      <div class="choice-card ${cls.active ? "" : "card-disabled"} ${String(this.selectedGrade) === String(cls.grade) ? "selected" : ""}" data-grade="${cls.grade}" data-active="${cls.active}">
        <div class="pdp-card-icon-wrap" style="${cls.active ? "" : "background:#f1f5f9;color:#94a3b8;"}">
          ${uiIcons.get(cls.active ? "graduation" : "lock", 26)}
        </div>
        <div class="card-title">${this.escapeHtml(cls.name)}</div>
        <span class="status-badge ${cls.active ? "badge-active" : "badge-soon"}">
          ${this.escapeHtml(cls.statusText)}
        </span>
      </div>
    `,
      )
      .join("");

    this.container.innerHTML = `
      <div class="screen-overlay">
        ${this.renderFantasyBackdrop()}
        <div class="cartoon-panel">
          ${this.renderProfileBanner()}
          <div>
            <h2 class="panel-header-title">${uiIcons.get("graduation", 26)} Pilih Jenjang Kelas</h2>
            <p class="game-subtitle">Pilih jenjang PAUD, TK, atau Kelas 1–4 SD untuk memulai petualangan belajarmu.</p>
          </div>
          <div class="selection-grid-4">${cardsHtml}</div>
          <div class="btn-group-horizontal">
            <button id="btn-back-main" class="btn-cartoon btn-gray btn-small">
              ${uiIcons.get("back", 16)} <span>Kembali ke Menu</span>
            </button>
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
        const rawGrade = card.dataset.grade;
        if (rawGrade === "paud" || rawGrade === "tk") {
          this.selectedGrade = rawGrade;
          earlyChildhoodManager.showActivityHub(this, rawGrade);
          return;
        }
        this.selectedGrade = Number(rawGrade);
        this.showSubjectSelection();
      });
    });

    document.getElementById("btn-back-main").addEventListener("click", () => {
      this.playTone("click");
      this.showMainMenu();
    });
  }

  getSubjectsForGrade(grade = this.selectedGrade) {
    const g = Number(grade) || 3;
    return GAME_CONFIG.subjects.filter(
      (sub) =>
        !Array.isArray(sub.allowedGrades) || sub.allowedGrades.includes(g),
    );
  }
  showSubjectSelection() {
    const availableSubjects = this.getSubjectsForGrade(this.selectedGrade);
    if (!availableSubjects.some((s) => s.id === this.selectedSubject)) {
      this.selectedSubject = availableSubjects[0]?.id || "matematika";
    }

    const subjectCardsHtml = availableSubjects
      .map(
        (sub) => `
      <div class="choice-card ${sub.active ? "" : "card-disabled"} ${this.selectedSubject === sub.id ? "selected" : ""}" data-id="${sub.id}" data-active="${sub.active}">
        <div class="pdp-card-icon-wrap">
          ${uiIcons.forSubject(sub.id)}
        </div>
        <div class="card-title">${this.escapeHtml(sub.name)}</div>
        <div class="card-desc">${this.escapeHtml(sub.desc)}</div>
        <span class="status-badge ${sub.active ? "badge-active" : "badge-soon"}">
          ${this.escapeHtml(sub.statusText)}
        </span>
      </div>
    `,
      )
      .join("");

    this.container.innerHTML = `
      <div class="screen-overlay">
        ${this.renderFantasyBackdrop()}
        <div class="cartoon-panel">
          ${this.renderProfileBanner()}
          <div>
            <h2 class="panel-header-title">${uiIcons.get("book", 26)} Pilih Mata Pelajaran — Kelas ${this.selectedGrade} SD</h2>
            <p class="game-subtitle">Setiap mata pelajaran memiliki progres petualangan dan statistik belajar terpisah.</p>
          </div>
          <div class="selection-grid">${subjectCardsHtml}</div>
          <div class="btn-group-horizontal">
            <button id="btn-back-grade" class="btn-cartoon btn-gray btn-small">
              ${uiIcons.get("back", 16)} <span>Kembali ke Pilihan Kelas</span>
            </button>
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
    const subInfo = this.getSubjectInfo(this.selectedSubject);
    this.container.innerHTML = `
      <div class="screen-overlay">
        ${this.renderFantasyBackdrop()}
        <div class="cartoon-panel" style="max-width:780px;">
          ${this.renderProfileBanner()}
          <div>
            <h2 class="panel-header-title">${uiIcons.get("compass", 26)} Pilih Mode Permainan</h2>
            <p class="game-subtitle">${this.escapeHtml(subInfo.name)} · Kelas ${this.selectedGrade} SD</p>
          </div>

          <div class="selection-grid" style="grid-template-columns:repeat(auto-fit, minmax(260px, 1fr));">
            <div class="choice-card" id="card-mode-adventure">
              <div class="pdp-card-icon-wrap" style="background:#d1fae5;color:#059669;">
                ${uiIcons.get("compass", 28)}
              </div>
              <div class="card-title">Adventure Mode</div>
              <div class="card-desc">Jelajahi dunia platformer, hadapi rintangan dan Boss, serta taklukkan tantangan belajar!</div>
              <span class="status-badge badge-active">Aktif</span>
            </div>

            <div class="choice-card" id="card-mode-duel">
              <div class="pdp-card-icon-wrap" style="background:#fef3c7;color:#d97706;">
                ${uiIcons.get("trophy", 28)}
              </div>
              <div class="card-title">Duel Mode (Hot Seat)</div>
              <div class="card-desc">Berlomba bersama Tutor di satu perangkat dengan soal setara anti-meniru.</div>
              <span class="status-badge badge-active">Aktif</span>
            </div>
          </div>

          <div class="btn-group-horizontal">
            <button id="btn-back-subject" class="btn-cartoon btn-gray btn-small">
              ${uiIcons.get("back", 16)} <span>Kembali ke Mata Pelajaran</span>
            </button>
          </div>
        </div>
      </div>
    `;

    document
      .getElementById("card-mode-adventure")
      .addEventListener("click", () => {
        this.playTone("click");
        this.showAdventureLevelSelection();
      });

    document.getElementById("card-mode-duel").addEventListener("click", () => {
      this.playTone("click");
      this.showDuelSetupScreen();
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

    const iconStyleByLevel = {
      easy: "background:#d1fae5;color:#059669;",
      medium: "background:#ede9fe;color:#6d28d9;",
      hard: "background:#fee2e2;color:#dc2626;",
    };

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

        let statusLabel = "Terkunci";
        let badgeClass = "badge-soon";
        if (isCompleted) {
          statusLabel = "Lulus (Bisa Diulang)";
          badgeClass = "badge-active";
        } else if (isUnlocked) {
          statusLabel = "Terbuka";
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
            ? `<div style="font-size:0.84rem; font-weight:800; color:#14532d; background:#dcfce7; padding:6px 10px; border-radius:10px; width:100%;">
               Rekor Terbaik: ${state.correctAnswers}/${lvl.totalQuestions} Benar (${state.bestAccuracy || state.accuracy || 0}%)
             </div>`
            : `<div style="font-size:0.84rem; font-weight:800; color:#1e40af; background:#dbeafe; padding:6px 10px; border-radius:10px; width:100%;">
               Target Lulus: Minimal ${minCorrect} dari ${lvl.totalQuestions} soal benar
             </div>`
          : `<div style="font-size:0.84rem; font-weight:800; color:#991b1b; background:#fee2e2; padding:6px 10px; border-radius:10px; width:100%;">
             ${this.escapeHtml(lvl.unlockRequirementText)}
           </div>`;

        const iconWrapStyle = isUnlocked
          ? iconStyleByLevel[lvl.id] || ""
          : "background:#f1f5f9;color:#94a3b8;";

        return `
        <div class="choice-card adv-level-card ${isUnlocked ? "" : "card-disabled"} ${isCompleted ? "selected" : ""}"
             data-level="${lvl.id}"
             data-unlocked="${isUnlocked}">
          <div class="pdp-card-icon-wrap" style="${iconWrapStyle}">
            ${uiIcons.get(isUnlocked ? lvl.icon || "compass" : "lock", 28)}
          </div>
          <div class="card-title">${this.escapeHtml(lvl.name)}</div>
          <div style="font-weight:900; font-size:0.88rem; color:#b45309;">
            ${this.escapeHtml(targetInfoText)}
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
        ${this.renderFantasyBackdrop()}
        <div class="cartoon-panel" style="max-width: 900px;">
          ${this.renderProfileBanner()}
          <div class="game-logo-badge">
            ${uiIcons.forSubject(this.selectedSubject)}
            <span>ADVENTURE ${this.escapeHtml(subInfo.name.toUpperCase())}</span>
          </div>
          <div>
            <h2 class="panel-header-title" style="margin-bottom: 8px;">
              ${uiIcons.get("compass", 26)} Pilih Level Adventure ${this.escapeHtml(subInfo.name)}
            </h2>
          </div>

          <div style="background:#fffbeb; border:2px solid #f59e0b; border-radius:16px; padding:10px 16px; margin: 0 auto 14px; max-width: 780px; text-align:left; font-size:0.88rem; font-weight:800; color:#2b1810;">
            <div style="color:#b45309; font-size:0.94rem; margin-bottom:4px; display:flex; align-items:center; gap:6px;">
              ${uiIcons.get("star", 16)} <span>Syarat Membuka Level Berikutnya (Minimal Nilai 80%):</span>
            </div>
            <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap:6px;">
              <div><strong>Mudah (Treasure Explorer):</strong> min. 4/5 benar</div>
              <div><strong>Sedang (Battle Adventure):</strong> min. 6/7 benar</div>
              <div><strong>Sulit (Survival Arena):</strong> min. 8/10 benar</div>
            </div>
          </div>

          <div id="adv-level-notice" style="display:none; background:#fee2e2; color:#991b1b; border:2px solid #ef4444; border-radius:14px; padding:10px; font-weight:800; margin-bottom:10px;"></div>

          <div class="selection-grid-3">
            ${levelCardsHtml}
          </div>

          <div class="btn-group-horizontal">
            <button id="btn-back-mode-sel" class="btn-cartoon btn-gray btn-small">
              ${uiIcons.get("back", 16)} <span>Kembali ke Pilihan Mode</span>
            </button>
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
                ? "Level Mudah: Treasure Explorer (minimal 4/5 benar)"
                : "Level Sedang: Battle Adventure (minimal 6/7 benar)";
            noticeEl.textContent = `Level ini masih terkunci! Selesaikan ${prevName} terlebih dahulu untuk membukanya.`;
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
    const chosenLevelKey = String(levelKey || this.selectedAdventureLevelKey || 'easy').toLowerCase();
    this.selectedAdventureLevelKey = chosenLevelKey;

    const modeCfg = getAdventureModeConfig(chosenLevelKey);
    const targetSceneKey = modeCfg.sceneKey;

    if (!this.phaserGame?.scene?.keys?.[targetSceneKey]) {
      console.error(`[PDP ROUTING ERROR] Scene "${targetSceneKey}" belum terdaftar di src/main.js!`);
      return;
    }

    const subInfo = this.getSubjectInfo(this.selectedSubject);

    this.renderAdventureHUD({
      playerName: this.activeProfile?.name || 'Petualang',
      subjectName: subInfo.name,
      levelName: modeCfg.modeLabel,
      genre: modeCfg.hudGenre,
      controlHint: modeCfg.controlHint,
      hearts: modeCfg.maxHearts,
      maxHearts: modeCfg.maxHearts,
      oxygenEnabled: Boolean(modeCfg.oxygenEnabled),
      oxygenPct: 100,
      objectiveText: modeCfg.mission.objectives[0]?.label || '',
      coins: 0,
      answeredCount: 0,
      totalChallenges: modeCfg.totalChallenges
    });

    this.phaserGame.scene.start(targetSceneKey, {
      profile: this.activeProfile,
      grade: this.selectedGrade,
      subject: this.selectedSubject,
      levelKey: chosenLevelKey
    });
  }

  renderAdventureHUD(stats) {
    let touchHtml = '<div></div>';
    if (this.settings.showTouchControls) {
      if (stats.genre === 'climb') {
        touchHtml = `
          <div class="hud-touch-controls">
            <div class="touch-dpad">
              <button id="touch-left" class="btn-touch" aria-label="Kiri">◀</button>
              <button id="touch-right" class="btn-touch" aria-label="Kanan">▶</button>
            </div>
            <div class="touch-dpad">
              <button id="touch-up" class="btn-touch" style="background:linear-gradient(180deg,#4ade80,#16a34a);" aria-label="Panjat Atas">▲</button>
              <button id="touch-down" class="btn-touch" style="background:linear-gradient(180deg,#4ade80,#16a34a);" aria-label="Turun">▼</button>
              <button id="touch-jump" class="btn-touch btn-touch-jump" aria-label="Lompat">LOMPAT</button>
            </div>
          </div>
        `;
      } else if (stats.genre === 'ocean') {
        touchHtml = `
          <div class="hud-touch-controls">
            <div style="display:grid;grid-template-columns:repeat(3,54px);gap:6px;pointer-events:auto;">
              <div></div>
              <button id="touch-up" class="btn-touch" style="width:54px;height:54px;" aria-label="Naik/Berenang Atas">▲</button>
              <div></div>
              <button id="touch-left" class="btn-touch" style="width:54px;height:54px;" aria-label="Kiri">◀</button>
              <button id="touch-down" class="btn-touch" style="width:54px;height:54px;" aria-label="Menyelam Bawah">▼</button>
              <button id="touch-right" class="btn-touch" style="width:54px;height:54px;" aria-label="Kanan">▶</button>
            </div>
            <div class="touch-dpad">
              <button id="touch-jump" class="btn-touch btn-touch-jump" aria-label="Lompat / Naik">LOMPAT ▲</button>
            </div>
          </div>
        `;
      } else {
        touchHtml = `
          <div class="hud-touch-controls">
            <div class="touch-dpad">
              <button id="touch-left" class="btn-touch" aria-label="Kiri">◀</button>
              <button id="touch-right" class="btn-touch" aria-label="Kanan">▶</button>
            </div>
            <div class="touch-dpad">
              <button id="touch-jump" class="btn-touch btn-touch-jump" aria-label="Lompat">LOMPAT ▲</button>
            </div>
          </div>
        `;
      }
    }

    const heartsPill = stats.maxHearts > 0
      ? `<div class="hud-pill" id="hud-hearts-val">${uiIcons.renderHearts(stats.hearts ?? stats.maxHearts, stats.maxHearts)}</div>`
      : '';

    const oxygenPill = stats.oxygenEnabled
      ? `
        <div class="hud-pill" id="hud-oxygen-pill" style="border-color:#38bdf8;gap:8px;">
          <span>🫧 Napas</span>
          <div style="width:92px;height:12px;background:rgba(15,23,42,0.55);border-radius:999px;overflow:hidden;border:1px solid rgba(255,255,255,0.4);">
            <div id="hud-oxygen-fill" style="width:${stats.oxygenPct ?? 100}%;height:100%;background:linear-gradient(90deg,#38bdf8,#22d3ee);transition:width 120ms linear;"></div>
          </div>
          <span id="hud-oxygen-val">${stats.oxygenPct ?? 100}%</span>
        </div>
      `
      : '';

    const objectivePill = stats.objectiveText
      ? `<div class="hud-pill" style="border-color:#22c55e;">${uiIcons.get('flag', 15)} <span id="hud-objective-val">${this.escapeHtml(stats.objectiveText)}</span></div>`
      : '';

    this.container.innerHTML = `
      <div class="hud-overlay" id="adventure-hud">
        <div class="hud-top-bar">
          <div class="hud-stats-group">
            <div class="hud-pill">
              ${uiIcons.get('user', 16)}
              <span>${this.escapeHtml(stats.playerName)}</span>
            </div>
            <div class="hud-pill">
              ${uiIcons.get('book', 16)}
              <span>${this.escapeHtml(stats.subjectName)} · ${this.escapeHtml(stats.levelName)}</span>
            </div>
            ${heartsPill}
            ${oxygenPill}
            <div class="hud-pill">
              ${uiIcons.get('coin', 16)}
              <span id="hud-coin-val">${stats.coins}</span>
            </div>
            <div class="hud-pill" id="hud-gem-pill" style="display:none;">
              ${uiIcons.get('gem', 16)}
              <span id="hud-collectible-val">0</span>
            </div>
            <div class="hud-pill">
              ${uiIcons.get('puzzle', 16)}
              <span id="hud-quest-val">${stats.answeredCount}/${stats.totalChallenges}</span>
            </div>
            ${objectivePill}
          </div>

          <div style="display:flex;gap:8px;pointer-events:auto;">
            <button id="btn-hud-exit" class="btn-cartoon btn-red btn-small">
              ${uiIcons.get('pause', 15)} <span>Jeda</span>
            </button>
          </div>
        </div>

        <div id="hud-hint-banner" class="pdp-hud-hint" style="display:block;">
          ${this.escapeHtml(stats.controlHint || 'Gunakan tombol arah untuk menjelajah!')}
        </div>

        ${touchHtml}
      </div>
    `;

    setTimeout(() => {
      const hintEl = document.getElementById('hud-hint-banner');
      if (hintEl && hintEl.dataset.sticky !== 'true') {
        hintEl.style.display = 'none';
      }
    }, 4500);

    document.getElementById('btn-hud-exit').addEventListener('click', () => {
      this.playTone('click');
      this.showPauseConfirmModal();
    });

    this.bindTouchButtons();
  }

  updateAdventureHUD({
    coins,
    answeredCount,
    correctCount,
    totalChallenges,
    hintText,
    hearts,
    maxHearts,
    collectibles,
    oxygenPct,
    objectiveText
  }) {
    const coinEl = document.getElementById('hud-coin-val');
    const questEl = document.getElementById('hud-quest-val');
    const heartsEl = document.getElementById('hud-hearts-val');
    const objEl = document.getElementById('hud-objective-val');
    const hintEl = document.getElementById('hud-hint-banner');
    const gemPill = document.getElementById('hud-gem-pill');
    const gemVal = document.getElementById('hud-collectible-val');
    const oxyPill = document.getElementById('hud-oxygen-pill');
    const oxyFill = document.getElementById('hud-oxygen-fill');
    const oxyVal = document.getElementById('hud-oxygen-val');

    if (coinEl && typeof coins === 'number') coinEl.textContent = String(coins);
    if (questEl && typeof totalChallenges === 'number') {
      const shown = typeof answeredCount === 'number' ? answeredCount : (correctCount || 0);
      questEl.textContent = `${shown}/${totalChallenges}`;
    }
    if (heartsEl && typeof hearts === 'number' && typeof maxHearts === 'number') {
      heartsEl.innerHTML = uiIcons.renderHearts(hearts, maxHearts);
    }
    if (objEl && typeof objectiveText === 'string') {
      objEl.textContent = objectiveText;
    }
    if (gemPill && gemVal && typeof collectibles === 'number') {
      gemPill.style.display = 'flex';
      gemVal.textContent = String(collectibles);
    }
    if (oxyFill && oxyVal && typeof oxygenPct === 'number') {
      const pct = Math.max(0, Math.min(100, Math.round(oxygenPct)));
      oxyFill.style.width = `${pct}%`;
      oxyVal.textContent = `${pct}%`;
      if (pct <= 22) {
        oxyFill.style.background = 'linear-gradient(90deg,#ef4444,#f87171)';
        if (oxyPill) oxyPill.style.borderColor = '#ef4444';
      } else if (pct <= 40) {
        oxyFill.style.background = 'linear-gradient(90deg,#f59e0b,#facc15)';
        if (oxyPill) oxyPill.style.borderColor = '#f59e0b';
      } else {
        oxyFill.style.background = 'linear-gradient(90deg,#38bdf8,#22d3ee)';
        if (oxyPill) oxyPill.style.borderColor = '#38bdf8';
      }
    }
    if (hintEl && typeof hintText === 'string') {
      if (hintText.trim()) {
        hintEl.textContent = hintText;
        hintEl.style.display = 'block';
      } else {
        hintEl.style.display = 'none';
      }
    }
  }

  showPauseConfirmModal() {
    const existing = document.getElementById("pdp-pause-modal");
    if (existing) return;

    const advScene = this.getActiveAdventureSceneInstance();
    if (advScene && advScene.physics) {
      advScene.physics.pause();
    }
    if (advScene && advScene.missionState) {
      advScene.missionState.pauseTimer();
    }

    const modal = document.createElement("div");
    modal.id = "pdp-pause-modal";
    modal.className = "modal-backdrop";
    modal.style.position = "absolute";
    modal.style.inset = "0";

    modal.innerHTML = `
      <div class="quiz-panel" style="max-width:460px;">
        <h3 class="panel-header-title" style="font-size:1.45rem;">${uiIcons.get("pause", 22)} Permainan Dijeda</h3>
        <p class="game-subtitle" style="margin-bottom:16px;">Apakah kamu ingin melanjutkan petualangan atau kembali ke peta level?</p>
        <div class="btn-group-horizontal">
          <button id="btn-pause-resume" class="btn-cartoon btn-green btn-small">
            ${uiIcons.get("play", 16)} <span>Lanjutkan</span>
          </button>
          <button id="btn-pause-leave" class="btn-cartoon btn-red btn-small">
            ${uiIcons.get("home", 16)} <span>Keluar Level</span>
          </button>
        </div>
      </div>
    `;

    this.container.appendChild(modal);

    modal.querySelector("#btn-pause-resume").addEventListener("click", () => {
      this.playTone("click");
      modal.remove();
      if (advScene && advScene.physics && !advScene.isQuizOpen) {
        advScene.physics.resume();
      }
      if (advScene && advScene.missionState && !advScene.isQuizOpen) {
        advScene.missionState.resumeTimer();
      }
    });

    modal
      .querySelector("#btn-pause-leave")
      .addEventListener("click", async () => {
        this.playTone("click");
        modal.remove();
        if (advScene && this.activeProfile && !advScene.levelCompleted) {
          this.activeProfile = await db.saveIncompleteAdventureSession(
            this.activeProfile.id,
            this.selectedSubject,
            {
              grade: this.selectedGrade,
              levelKey: advScene.levelKey,
              questionsAnswered: advScene.questionsAnswered,
              totalChallenges: advScene.totalChallenges,
              correctAnswers: advScene.correctAnswers,
              wrongAnswers: advScene.wrongAnswers,
            },
            this.selectedGrade,
          );
        }
        this.showAdventureLevelSelection();
      });
  }

  showNpcDialog({ npcName = "Pemandu Petualangan", text = "", onClose }) {
    const existing = document.getElementById("pdp-npc-modal");
    if (existing) existing.remove();

    const modal = document.createElement("div");
    modal.id = "pdp-npc-modal";
    modal.className = "duel-modal-backdrop";
    modal.style.position = "absolute";
    modal.style.inset = "0";

    modal.innerHTML = `
      <div class="pdp-npc-dialog">
        <div class="pdp-npc-name">${uiIcons.get("compass", 16)} ${this.escapeHtml(npcName)}</div>
        <div style="font-size:1.05rem;font-weight:700;color:#2b1810;line-height:1.5;">
          ${this.escapeHtml(text)}
        </div>
        <div style="display:flex;justify-content:flex-end;">
          <button id="btn-npc-ok" class="btn-cartoon btn-green btn-small">
            ${uiIcons.get("check", 16)} <span>Mengerti!</span>
          </button>
        </div>
      </div>
    `;

    this.container.appendChild(modal);
    modal.querySelector("#btn-npc-ok").addEventListener("click", () => {
      this.playTone("click");
      modal.remove();
      if (onClose) onClose();
    });
  }

  bindTouchButtons() {
    const bindKey = (elId, stateProp) => {
      const btn = document.getElementById(elId);
      if (!btn) return;
      const setVal = (val) => {
        const activeScene = this.getActiveAdventureSceneInstance();
        if (activeScene && activeScene.touchState) {
          activeScene.touchState[stateProp] = val;
        }
      };
      ['mousedown', 'touchstart'].forEach((evt) => {
        btn.addEventListener(evt, (e) => {
          e.preventDefault();
          setVal(true);
        });
      });
      ['mouseup', 'mouseleave', 'touchend', 'touchcancel'].forEach((evt) => {
        btn.addEventListener(evt, (e) => {
          e.preventDefault();
          setVal(false);
        });
      });
    };

    bindKey('touch-left', 'left');
    bindKey('touch-right', 'right');
    bindKey('touch-up', 'up');
    bindKey('touch-down', 'down');
    bindKey('touch-jump', 'jump');
  }

  showQuestionModal({ questionData, triggerTitle, onComplete }) {
    const existing = document.getElementById('active-quiz-modal');
    if (existing) existing.remove();

    const qType = questionData.questionType || 'multiple_choice';
    const diffLabel = String(questionData.difficulty || 'sedang').toUpperCase();
    const diffStyle =
      diffLabel === 'MUDAH'
        ? 'background:#d1fae5;color:#065f46;'
        : diffLabel === 'SULIT'
          ? 'background:#fee2e2;color:#991b1b;'
          : 'background:#fef3c7;color:#92400e;';

    const typeBadgeLabel =
      qType === 'matching'
        ? 'Mencocokkan'
        : qType === 'essay'
          ? 'Isian / Essay'
          : 'Pilihan Ganda';

    const modalEl = document.createElement('div');
    modalEl.id = 'active-quiz-modal';
    modalEl.className = 'modal-backdrop';
    modalEl.style.position = 'absolute';
    modalEl.style.inset = '0';

    let bodyHtml = '';

    if (qType === 'matching') {
      const leftHtml = (questionData.leftItems || []).map((item, idx) => `
        <button type="button" class="pdp-match-btn pdp-match-left" data-left-id="${this.escapeHtml(item.id)}">
          <span class="pdp-match-num">${idx + 1}</span>
          <span>${this.escapeHtml(item.text)}</span>
          <span class="pdp-match-tag" data-tag-for="${this.escapeHtml(item.id)}"></span>
        </button>
      `).join('');

      const rightHtml = (questionData.rightItems || []).map((item) => `
        <button type="button" class="pdp-match-btn pdp-match-right" data-right-id="${this.escapeHtml(item.id)}">
          <span>${this.escapeHtml(item.text)}</span>
          <span class="pdp-match-badge" data-rbadge-for="${this.escapeHtml(item.id)}"></span>
        </button>
      `).join('');

      bodyHtml = `
        <div style="font-size:0.86rem;font-weight:700;color:#5c3a21;margin-bottom:8px;">
          Klik satu kotak di sebelah kiri, lalu klik pasangannya di sebelah kanan.
        </div>
        <div class="pdp-matching-grid">
          <div class="pdp-match-col">${leftHtml}</div>
          <div class="pdp-match-col">${rightHtml}</div>
        </div>
        <div class="btn-group-horizontal" style="margin-top:12px;">
          <button id="btn-check-matching" class="btn-cartoon btn-blue btn-small" disabled>
            ${uiIcons.get('check', 16)} <span>Periksa Pasangan</span>
          </button>
        </div>
      `;
    } else if (qType === 'essay') {
      const cluesCount = (questionData.clues || []).length;
      bodyHtml = `
        <div class="pdp-essay-wrap">
          <input
            type="text"
            id="inp-essay-answer"
            class="input-cartoon"
            placeholder="Ketik jawabanmu di sini..."
            autocomplete="off"
          />
          <div class="pdp-essay-actions">
            <button type="button" id="btn-check-essay" class="btn-cartoon btn-blue btn-small">
              ${uiIcons.get('check', 16)} <span>Periksa Jawaban</span>
            </button>
            <button type="button" id="btn-essay-clue" class="btn-cartoon btn-small pdp-clue-btn">
              💡 <span>Clue (0/${cluesCount})</span>
            </button>
          </div>
          <div id="essay-clues-box" class="pdp-clues-box" style="display:none;"></div>
        </div>
      `;
    } else {
      const letters = ['A', 'B', 'C', 'D'];
      const optionsHtml = (questionData.options || []).map((opt, idx) => `
        <button class="btn-option pdp-quiz-opt" data-answer="${this.escapeHtml(opt)}">
          <span class="option-letter">${letters[idx] || idx + 1}</span>
          <span>${this.escapeHtml(opt)}</span>
        </button>
      `).join('');
      bodyHtml = `<div class="quiz-options-grid">${optionsHtml}</div>`;
    }

    modalEl.innerHTML = `
      <div class="quiz-panel">
        <div class="quiz-header-badges">
          <span class="status-badge" style="background:#eff6ff;color:#1d4ed8;">
            ${this.escapeHtml(triggerTitle || 'Tantangan Belajar')}
          </span>
          <div style="display:flex;gap:6px;flex-wrap:wrap;">
            <span class="status-badge" style="background:#ede9fe;color:#5b21b6;">
              ${typeBadgeLabel}
            </span>
            <span class="status-badge" style="background:#f1f5f9;color:#334155;">
              ${this.escapeHtml(questionData.topic || 'Materi')}
            </span>
            <span class="status-badge" style="${diffStyle}">
              ${this.escapeHtml(diffLabel)}
            </span>
          </div>
        </div>

        ${questionVisualRenderer.render(questionData.visualId)}

        <div class="quiz-question-box">
          ${this.escapeHtml(questionData.question)}
          ${questionData.vocabHelp ? `
            <div style="margin-top:6px;font-size:0.8rem;font-weight:700;color:#0369a1;background:#f0f9ff;border-radius:8px;padding:4px 8px;display:inline-block;">
              💡 Kosakata: ${this.escapeHtml(questionData.vocabHelp)}
            </div>
          ` : ''}
        </div>

        ${bodyHtml}

        <div id="quiz-feedback" style="display:none;"></div>

        <div id="quiz-continue-wrap" class="btn-group-horizontal" style="display:none;margin-top:14px;">
          <button id="btn-quiz-continue" class="btn-cartoon btn-green btn-small">
            ${uiIcons.get('check', 16)} <span>Lanjutkan Petualangan</span>
          </button>
        </div>
      </div>
    `;

    this.container.appendChild(modalEl);

    const feedbackEl = modalEl.querySelector('#quiz-feedback');
    const continueWrap = modalEl.querySelector('#quiz-continue-wrap');
    const continueBtn = modalEl.querySelector('#btn-quiz-continue');

    const enableContinue = (isCorrect, chosenVal, meta = {}) => {
      continueWrap.style.display = 'flex';
      continueBtn.onclick = () => {
        this.playTone('click');
        modalEl.remove();
        if (onComplete) onComplete(isCorrect, chosenVal, meta);
      };
    };

    if (qType === 'matching') {
      const pairs = questionData.pairs || [];
      const mappings = {};
      let activeLeftId = null;
      let submitted = false;

      const leftBtns = modalEl.querySelectorAll('.pdp-match-left');
      const rightBtns = modalEl.querySelectorAll('.pdp-match-right');
      const checkBtn = modalEl.querySelector('#btn-check-matching');

      const refreshMatchUI = () => {
        const leftOrder = Array.from(leftBtns).map((b) => b.dataset.leftId);
        leftBtns.forEach((btn) => {
          const lid = btn.dataset.leftId;
          btn.classList.toggle('active', lid === activeLeftId);
          btn.classList.toggle('paired', Boolean(mappings[lid]));
          const tag = btn.querySelector('.pdp-match-tag');
          if (tag) tag.textContent = mappings[lid] ? '✓' : '';
        });

        rightBtns.forEach((btn) => {
          const rid = btn.dataset.rightId;
          const pairedLeftId = Object.keys(mappings).find((k) => mappings[k] === rid);
          btn.classList.toggle('paired', Boolean(pairedLeftId));
          const badge = btn.querySelector('.pdp-match-badge');
          if (badge) {
            badge.textContent = pairedLeftId ? `#${leftOrder.indexOf(pairedLeftId) + 1}` : '';
          }
        });

        checkBtn.disabled = Object.keys(mappings).length < pairs.length;
      };

      leftBtns.forEach((btn) => {
        btn.addEventListener('click', () => {
          if (submitted) return;
          this.playTone('click');
          activeLeftId = btn.dataset.leftId;
          refreshMatchUI();
        });
      });

      rightBtns.forEach((btn) => {
        btn.addEventListener('click', () => {
          if (submitted || !activeLeftId) return;
          this.playTone('click');
          const rid = btn.dataset.rightId;
          Object.keys(mappings).forEach((k) => {
            if (mappings[k] === rid) delete mappings[k];
          });
          mappings[activeLeftId] = rid;
          activeLeftId = null;
          refreshMatchUI();
        });
      });

      checkBtn.addEventListener('click', () => {
        if (submitted) return;
        submitted = true;
        checkBtn.style.display = 'none';

        const result = questionQualityEngine.evaluateMatchingAnswer(mappings, pairs);
        if (result.isCorrect) {
          this.playTone('correct');
          feedbackEl.className = 'quiz-feedback-box feedback-correct';
          feedbackEl.innerHTML = `
            <div style="font-weight:800;margin-bottom:4px;">Semua pasangan tepat (${result.correctCount}/${result.totalPairs})!</div>
            <div>${this.escapeHtml(questionData.explanation || '')}</div>
          `;
        } else {
          this.playTone('wrong');
          const keySummary = pairs.map((p) => `${p.left} → ${p.right}`).join(' · ');
          feedbackEl.className = 'quiz-feedback-box feedback-wrong';
          feedbackEl.innerHTML = `
            <div style="font-weight:800;margin-bottom:4px;">Tepat ${result.correctCount}/${result.totalPairs} pasangan.</div>
            <div><strong>Pasangan benar:</strong> ${this.escapeHtml(keySummary)}</div>
          `;
        }
        feedbackEl.style.display = 'block';
        enableContinue(result.isCorrect, JSON.stringify(mappings));
      });
      return;
    }

    if (qType === 'essay') {
      const inp = modalEl.querySelector('#inp-essay-answer');
      const checkBtn = modalEl.querySelector('#btn-check-essay');
      const clueBtn = modalEl.querySelector('#btn-essay-clue');
      const cluesBox = modalEl.querySelector('#essay-clues-box');
      const clues = questionData.clues || [];
      let cluesUsed = 0;
      let solved = false;

      setTimeout(() => inp?.focus(), 60);

      clueBtn.addEventListener('click', () => {
        if (solved || cluesUsed >= clues.length) return;
        this.playTone('click');
        cluesUsed += 1;
        clueBtn.innerHTML = `💡 <span>Clue (${cluesUsed}/${clues.length})</span>`;
        if (cluesUsed >= clues.length) {
          clueBtn.disabled = true;
        }
        cluesBox.style.display = 'block';
        cluesBox.innerHTML = clues
          .slice(0, cluesUsed)
          .map((c, i) => `<div><strong>Petunjuk ${i + 1}:</strong> ${this.escapeHtml(c)}</div>`)
          .join('');
      });

      const handleCheckEssay = () => {
        if (solved) return;
        const userVal = inp.value.trim();
        const evalRes = questionQualityEngine.evaluateEssayAnswer(userVal, questionData);

        if (evalRes.isCorrect) {
          solved = true;
          this.playTone('correct');
          inp.disabled = true;
          checkBtn.disabled = true;
          clueBtn.disabled = true;

          feedbackEl.className = 'quiz-feedback-box feedback-correct';
          feedbackEl.innerHTML = `
            <div style="font-weight:800;margin-bottom:4px;">${this.escapeHtml(evalRes.feedback)}</div>
            <div>${this.escapeHtml(questionData.explanation || '')}</div>
          `;
          feedbackEl.style.display = 'block';
          enableContinue(true, userVal, { cluesUsed });
        } else {
          this.playTone('wrong');
          feedbackEl.className = 'quiz-feedback-box feedback-wrong';
          feedbackEl.innerHTML = `
            <div style="font-weight:800;">${this.escapeHtml(evalRes.feedback)}</div>
            <div style="font-size:0.86rem;margin-top:3px;">Perbaiki jawabanmu dulu agar bisa melanjutkan petualangan!</div>
          `;
          feedbackEl.style.display = 'block';
          inp.focus();
        }
      };

      checkBtn.addEventListener('click', handleCheckEssay);
      inp.addEventListener('keydown', (e) => {
        e.stopPropagation();
        if (e.key === 'Enter') {
          e.preventDefault();
          handleCheckEssay();
        }
      });

      inp.addEventListener('keyup', (e) => {
        e.stopPropagation();
      });
      return;
    }

    let answered = false;
    const optButtons = modalEl.querySelectorAll('.pdp-quiz-opt');

    optButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        if (answered) return;
        answered = true;

        const chosen = btn.dataset.answer;
        const isCorrect = chosen === questionData.correctAnswer;

        optButtons.forEach((b) => {
          b.disabled = true;
          if (b.dataset.answer === questionData.correctAnswer) {
            b.classList.add('correct');
          }
        });

        if (isCorrect) {
          this.playTone('correct');
          btn.classList.add('correct');
          feedbackEl.className = 'quiz-feedback-box feedback-correct';
          feedbackEl.innerHTML = `
            <div style="display:flex;align-items:center;gap:6px;font-weight:800;margin-bottom:4px;">
              ${uiIcons.get('check', 18)} <span>Jawaban Tepat!</span>
            </div>
            <div>${this.escapeHtml(questionData.explanation || '')}</div>
          `;
        } else {
          this.playTone('wrong');
          btn.classList.add('wrong');
          feedbackEl.className = 'quiz-feedback-box feedback-wrong';
          feedbackEl.innerHTML = `
            <div style="display:flex;align-items:center;gap:6px;font-weight:800;margin-bottom:4px;">
              ${uiIcons.get('x', 18)} <span>Belum tepat. Jawaban benar: ${this.escapeHtml(questionData.correctAnswer)}</span>
            </div>
            <div>${this.escapeHtml(questionData.explanation || '')}</div>
          `;
        }

        feedbackEl.style.display = 'block';
        enableContinue(isCorrect, chosen);
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

  showAdventureGameOver({
    levelKey = 'medium',
    modeLabel = 'Ocean Explorer',
    subjectName = '',
    answeredCount = 0,
    remainingCount = 0,
    totalChallenges = 7,
    correctCount = 0,
    reason = 'Daya napas habis sebelum misi selesai.',
    theme = 'ocean'
  } = {}) {
    const existingQuiz = document.getElementById('active-quiz-modal');
    if (existingQuiz) existingQuiz.remove();

    const existingModal = document.getElementById('adventure-gameover-modal');
    if (existingModal) existingModal.remove();

    const isOcean = theme === 'ocean';
    const headerGrad = isOcean
      ? 'linear-gradient(135deg, #0369a1 0%, #06b6d4 100%)'
      : 'linear-gradient(135deg, #991b1b 0%, #ea580c 100%)';

    const modalEl = document.createElement('div');
    modalEl.id = 'adventure-gameover-modal';
    modalEl.className = 'modal-backdrop';
    modalEl.style.position = 'absolute';
    modalEl.style.inset = '0';
    modalEl.style.zIndex = '60';

    modalEl.innerHTML = `
      <div class="cartoon-panel" style="max-width:520px;padding:0;overflow:hidden;border:4px solid #0284c7;background:#f0f9ff;">
        <div style="background:${headerGrad};color:#ffffff;padding:22px 24px 18px;text-align:center;">
          <div style="font-size:2.6rem;line-height:1;margin-bottom:6px;">${isOcean ? '🫧🌊' : '⚠️'}</div>
          <h2 style="margin:0;font-size:1.65rem;font-weight:900;letter-spacing:0.4px;text-shadow:0 2px 6px rgba(15,23,42,0.35);">
            Misi Gagal!
          </h2>
          <div style="margin-top:4px;font-size:0.92rem;font-weight:700;opacity:0.95;">
            ${this.escapeHtml(modeLabel)}${subjectName ? ` · ${this.escapeHtml(subjectName)}` : ''}
          </div>
        </div>

        <div style="padding:20px 24px 24px;text-align:center;">
          <div style="background:#e0f2fe;border:2px solid #7dd3fc;border-radius:14px;padding:10px 14px;color:#0c4a6e;font-weight:800;font-size:0.92rem;margin-bottom:16px;">
            ${this.escapeHtml(reason)}
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:18px;">
            <div style="background:#ffffff;border:2px solid #bae6fd;border-radius:16px;padding:12px 10px;">
              <div style="font-size:0.8rem;font-weight:800;color:#0369a1;margin-bottom:4px;">Soal Selesai</div>
              <div style="font-size:1.55rem;font-weight:900;color:#15803d;">${answeredCount}/${totalChallenges}</div>
              <div style="font-size:0.78rem;font-weight:700;color:#64748b;">(${correctCount} dijawab benar)</div>
            </div>

            <div style="background:#ffffff;border:2px solid #fecaca;border-radius:16px;padding:12px 10px;">
              <div style="font-size:0.8rem;font-weight:800;color:#b91c1c;margin-bottom:4px;">Belum Selesai</div>
              <div style="font-size:1.55rem;font-weight:900;color:#dc2626;">${remainingCount} Soal</div>
              <div style="font-size:0.78rem;font-weight:700;color:#64748b;">Selesaikan semua untuk lulus</div>
            </div>
          </div>

          <div style="font-size:0.84rem;font-weight:700;color:#475569;margin-bottom:18px;">
            Progres percobaan ini direset, tetapi profil &amp; pencapaian sebelumnya tetap aman tersimpan.
          </div>

          <div class="btn-group-horizontal" style="justify-content:center;gap:10px;">
            <button id="btn-gameover-retry" class="btn-cartoon btn-green">
              🔄 <span>Coba Lagi</span>
            </button>
            <button id="btn-gameover-levels" class="btn-cartoon btn-gray btn-small">
              ${uiIcons.get('back', 16)} <span>Pilih Level</span>
            </button>
          </div>
        </div>
      </div>
    `;

    this.container.appendChild(modalEl);

    document.getElementById('btn-gameover-retry').addEventListener('click', () => {
      this.playTone('click');
      modalEl.remove();
      questionManager.resetSession();
      this.startAdventureMode(levelKey);
    });

    document.getElementById('btn-gameover-levels').addEventListener('click', () => {
      this.playTone('click');
      modalEl.remove();
      this.showAdventureLevelSelection();
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
      const topics = questionManager.getTopicsBySubject(
        chosenSubject,
        this.selectedGrade,
      );
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
                    ${this.getSubjectsForGrade(this.selectedGrade)
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

  renderSubjectAdventureTableForTutor(
    profile,
    subjectId,
    subjectTitle,
    grade = null,
  ) {
    const targetGrade = Number(grade) || Number(profile?.grade) || 3;
    const subjProg = db.getSubjectAdventureProgress(
      profile,
      subjectId,
      targetGrade,
    );
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

        const advTablesHtml = this.getSubjectsForGrade(targetProfile.grade || 3)
          .filter((s) => s.active)
          .map((s) =>
            this.renderSubjectAdventureTableForTutor(
              targetProfile,
              s.id,
              `${s.icon} Progres Adventure ${s.name} (Kelas ${targetProfile.grade || 3}):`,
              targetProfile.grade || 3,
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

  showBattleArenaSetup() {
    this.showBattleArenaHub("setup");
  }

  isBattleCharOwned(charObj, bp) {
    if (!charObj) return false;
    return Boolean(charObj.free) || (bp?.unlockedCharacters || []).includes(charObj.id);
  }

  async showBattleArenaHub(activeTab = 'setup', options = {}) {
    this.stopAllGameplayScenes();
    await characterAssetManager.ensureLineupImageLoaded();

    if (this.activeProfile) {
      this.activeProfile = await db.getProfileById(this.activeProfile.id);
    }

    const bp = this.activeProfile?.battleArenaProgress || db.ensureBattleArenaProgress();
    const lvlInfo = calculateBattleLevel(bp.xp);

    if (activeTab === 'setup') {
      this.renderBattleArenaSetupTab(bp, lvlInfo);
    } else if (activeTab === 'collection') {
      this.renderBattleCollectionTab(bp, lvlInfo, options);
    } else if (activeTab === 'achievements') {
      this.renderBattleAchievementsTab(bp, lvlInfo);
    } else if (activeTab === 'history') {
      this.renderBattleHistoryTab(bp, lvlInfo);
    }
  }

  renderBattleHubHeader(activeTab, bp, lvlInfo) {
    return `
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; margin-bottom:10px;">
        <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
          <span class="game-logo-badge" style="margin:0; background:#e74c3c; color:#fff;">⚔️ QUIZ BATTLE ARENA</span>
          <span class="badge-tag" id="ba-header-coins" style="background:#fff9db;">🪙 ${bp.coins} Koin</span>
          <span class="badge-tag" style="background:#d6eaf8;">⭐ Lv.${lvlInfo.level} (${lvlInfo.currentLevelXp}/${lvlInfo.nextLevelXp} XP)</span>
        </div>
        <div style="display:flex; align-items:center; gap:8px;">
          <button id="btn-ba-mute" class="btn-cartoon btn-small ${this.settings.battleMuted ? 'btn-red' : 'btn-green'}" style="padding:5px 10px; font-size:0.85rem;">
            ${this.settings.battleMuted ? '🔇 Mute' : '🔊 Audio'}
          </button>
          <input id="inp-ba-vol" type="range" min="0" max="1" step="0.1" value="${this.settings.battleVolume ?? 0.6}" style="width:75px; cursor:pointer;" />
          <button id="btn-ba-home-top" class="btn-cartoon btn-gray btn-small" style="padding:5px 12px; font-size:0.85rem;">🏠 Menu</button>
        </div>
      </div>

      <div class="tutor-tabs-nav" style="margin-bottom:12px;">
        <button class="tutor-tab-btn ba-hub-tab ${activeTab === 'setup' ? 'active' : ''}" data-tab="setup">⚔️ Pertarungan</button>
        <button class="tutor-tab-btn ba-hub-tab ${activeTab === 'collection' ? 'active' : ''}" data-tab="collection">🎨 Kustom & Toko</button>
        <button class="tutor-tab-btn ba-hub-tab ${activeTab === 'achievements' ? 'active' : ''}" data-tab="achievements">🏆 Level & Achievement</button>
        <button class="tutor-tab-btn ba-hub-tab ${activeTab === 'history' ? 'active' : ''}" data-tab="history">📜 Riwayat</button>
      </div>
    `;
  }

  bindBattleHubHeaderEvents(currentTab) {
    document.getElementById("btn-ba-home-top").addEventListener("click", () => {
      battleAudio.play("click");
      this.showMainMenu();
    });

    document
      .getElementById("btn-ba-mute")
      .addEventListener("click", async () => {
        this.settings.battleMuted = !this.settings.battleMuted;
        battleAudio.configure({
          muted: this.settings.battleMuted,
          volume: this.settings.battleVolume ?? 0.6,
        });
        await db.saveSettings(this.settings);
        this.showBattleArenaHub(currentTab);
      });

    document
      .getElementById("inp-ba-vol")
      .addEventListener("input", async (e) => {
        this.settings.battleVolume = Number(e.target.value);
        this.settings.battleMuted = this.settings.battleVolume === 0;
        battleAudio.configure({
          muted: this.settings.battleMuted,
          volume: this.settings.battleVolume,
        });
        await db.saveSettings(this.settings);
      });

    this.container.querySelectorAll(".ba-hub-tab").forEach((btn) => {
      btn.addEventListener("click", () => {
        battleAudio.play("click");
        this.showBattleArenaHub(btn.dataset.tab);
      });
    });
  }

  renderBattleArenaSetupTab(bp, lvlInfo) {
    let tutorName = 'Tutor';
    let studentName = this.activeProfile?.name || 'Murid';
    let tutorChar = bp.unlockedCharacters.includes(bp.selectedTutorChar) ? bp.selectedTutorChar : 'prof_panda';
    let studentChar = bp.unlockedCharacters.includes(bp.selectedStudentChar) ? bp.selectedStudentChar : 'kiko';
    let chosenGrade = this.selectedGrade || this.activeProfile?.grade || 3;
    let availableSubjects = this.getSubjectsForGrade(chosenGrade);
    let chosenSubject = availableSubjects[0]?.id || 'matematika';
    let chosenDifficulty = 'adaptif';
    let chosenRounds = 5;
    let lockedNotice = '';

    const renderView = () => {
      availableSubjects = this.getSubjectsForGrade(chosenGrade);
      if (!availableSubjects.some((s) => s.id === chosenSubject)) {
        chosenSubject = availableSubjects[0]?.id || 'matematika';
      }

      const classOpts = GAME_CONFIG.classes
        .filter((c) => c.active)
        .map((c) => `<option value="${c.grade}" ${chosenGrade === c.grade ? 'selected' : ''}>${c.name}</option>`)
        .join('');

      const subjOpts = availableSubjects
        .map((s) => `<option value="${s.id}" ${chosenSubject === s.id ? 'selected' : ''}>${s.icon} ${this.escapeHtml(s.name)}</option>`)
        .join('');

      const renderCharCards = (role, selectedId) =>
        BATTLE_CHARACTERS.map((ch) => {
          const owned = this.isBattleCharOwned(ch, bp);
          const previewUrl = BattleFighterRig.renderPreviewDataURL(ch.id);
          const statusLabel = owned
            ? selectedId === ch.id
              ? '✅ Dipilih'
              : ch.free
                ? 'Gratis'
                : 'Dimiliki'
            : `🔒 ${ch.price} Koin`;

          return `
            <div class="choice-card ${role === 'tutor' ? 'ba-tutor-char' : 'ba-student-char'} ${selectedId === ch.id ? 'selected' : ''} ${!owned ? 'card-disabled' : ''}"
                 data-char="${ch.id}"
                 data-name="${this.escapeHtml(ch.name)}"
                 data-price="${ch.price}"
                 data-unlocked="${owned}"
                 style="padding:6px; gap:3px;">
              <img src="${previewUrl}" alt="${this.escapeHtml(ch.name)}" style="width:52px; height:58px; object-fit:contain; ${!owned ? 'filter:grayscale(0.65) opacity(0.75);' : ''}" />
              <div style="font-weight:900; font-size:0.76rem; line-height:1.15;">${this.escapeHtml(ch.name)}</div>
              <span style="font-size:0.68rem; font-weight:800; color:${owned ? '#15803d' : '#b91c1c'};">
                ${statusLabel}
              </span>
              ${!owned ? `<span style="font-size:0.64rem; font-weight:700; color:#64748b;">Beli di menu Kustom</span>` : ''}
            </div>
          `;
        }).join('');

      this.container.innerHTML = `
        <div class="screen-overlay">
          ${this.renderFantasyBackdrop()}
          <div class="cartoon-panel" style="max-width: 980px;">
            ${this.renderBattleHubHeader('setup', bp, lvlInfo)}

            <div class="form-box" style="margin-top:0;">
              <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; margin-bottom:8px;">
                <div class="form-group" style="margin:0;">
                  <label>👨🏫 Nama Tutor:</label>
                  <input id="ba-tutor-name" type="text" class="input-cartoon" value="${this.escapeHtml(tutorName)}" maxlength="20" />
                </div>
                <div class="form-group" style="margin:0;">
                  <label>🧒 Nama Murid:</label>
                  <input id="ba-student-name" type="text" class="input-cartoon" value="${this.escapeHtml(studentName)}" maxlength="20" />
                </div>
              </div>

              <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(165px, 1fr)); gap:8px; margin-bottom:10px;">
                <select id="ba-sel-grade" class="input-cartoon">${classOpts}</select>
                <select id="ba-sel-subject" class="input-cartoon">${subjOpts}</select>
                <select id="ba-sel-diff" class="input-cartoon">
                  <option value="adaptif" ${chosenDifficulty === 'adaptif' ? 'selected' : ''}>🤖 Adaptif Setara</option>
                  <option value="mudah" ${chosenDifficulty === 'mudah' ? 'selected' : ''}>🌱 Mudah</option>
                  <option value="sedang" ${chosenDifficulty === 'sedang' ? 'selected' : ''}>⚡ Sedang</option>
                  <option value="sulit" ${chosenDifficulty === 'sulit' ? 'selected' : ''}>🔥 Sulit</option>
                </select>
                <select id="ba-sel-rounds" class="input-cartoon">
                  <option value="5" ${chosenRounds === 5 ? 'selected' : ''}>5 Ronde</option>
                  <option value="7" ${chosenRounds === 7 ? 'selected' : ''}>7 Ronde</option>
                  <option value="10" ${chosenRounds === 10 ? 'selected' : ''}>10 Ronde</option>
                </select>
              </div>

              ${lockedNotice ? `
                <div style="display:flex; align-items:center; justify-content:space-between; gap:10px; flex-wrap:wrap; background:#fffbeb; border:2px solid #f59e0b; border-radius:12px; padding:8px 12px; margin-bottom:10px; font-size:0.84rem; font-weight:800; color:#92400e;">
                  <span>🔒 ${this.escapeHtml(lockedNotice)}</span>
                  <button type="button" id="btn-go-char-shop" class="btn-cartoon btn-purple btn-small" style="padding:4px 12px; font-size:0.78rem;">
                    🛒 Buka Toko Karakter
                  </button>
                </div>
              ` : ''}

              <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px;">
                <div>
                  <div style="font-weight:900; font-size:0.88rem; margin-bottom:4px;">Pilih Karakter Tutor:</div>
                  <div style="display:grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap:6px;">${renderCharCards('tutor', tutorChar)}</div>
                </div>
                <div>
                  <div style="font-weight:900; font-size:0.88rem; margin-bottom:4px;">Pilih Karakter Murid:</div>
                  <div style="display:grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap:6px;">${renderCharCards('student', studentChar)}</div>
                </div>
              </div>
            </div>

            <div class="btn-group-horizontal">
              <button id="btn-ba-start" class="btn-cartoon btn-red">⚔️ MULAI PERTARUNGAN!</button>
            </div>
          </div>
        </div>
      `;

      this.bindBattleHubHeaderEvents('setup');

      const goShopBtn = document.getElementById('btn-go-char-shop');
      if (goShopBtn) {
        goShopBtn.addEventListener('click', () => {
          battleAudio.play('click');
          this.showBattleArenaHub('collection', { subCategory: 'character' });
        });
      }

      document.getElementById('ba-tutor-name').addEventListener('input', (e) => { tutorName = e.target.value; });
      document.getElementById('ba-student-name').addEventListener('input', (e) => { studentName = e.target.value; });
      document.getElementById('ba-sel-grade').addEventListener('change', (e) => {
        chosenGrade = Number(e.target.value);
        renderView();
      });
      document.getElementById('ba-sel-subject').addEventListener('change', (e) => { chosenSubject = e.target.value; });
      document.getElementById('ba-sel-diff').addEventListener('change', (e) => { chosenDifficulty = e.target.value; });
      document.getElementById('ba-sel-rounds').addEventListener('change', (e) => { chosenRounds = Number(e.target.value); });

      const bindCharSelect = (selector, onSelect) => {
        this.container.querySelectorAll(selector).forEach((card) => {
          card.addEventListener('click', () => {
            if (card.dataset.unlocked !== 'true') {
              battleAudio.play('wrong');
              lockedNotice = `${card.dataset.name} masih terkunci (${card.dataset.price} Koin). Kamu bisa membelinya di menu Kustom → Karakter.`;
              renderView();
              return;
            }
            battleAudio.play('click');
            lockedNotice = '';
            onSelect(card.dataset.char);
            renderView();
          });
        });
      };

      bindCharSelect('.ba-tutor-char', (id) => { tutorChar = id; });
      bindCharSelect('.ba-student-char', (id) => { studentChar = id; });

      document.getElementById('btn-ba-start').addEventListener('click', async () => {
        battleAudio.play('special');
        if (this.activeProfile) {
          this.activeProfile = await db.updateBattleArenaSelection(this.activeProfile.id, {
            tutorChar,
            studentChar
          });
        }
        const latestEquipped = this.activeProfile?.battleArenaProgress?.equipped || bp.equipped;
        this.startBattleArenaMatch({
          tutorName: tutorName.trim() || 'Tutor',
          studentName: studentName.trim() || 'Murid',
          tutorCharacter: tutorChar,
          studentCharacter: studentChar,
          studentCosmetic: { ...latestEquipped },
          grade: chosenGrade,
          subject: chosenSubject,
          difficulty: chosenDifficulty,
          maxLives: chosenRounds,
          rounds: chosenRounds
        });
      });
    };

    renderView();
  }

  renderBattleCollectionTab(bp, lvlInfo, options = {}) {
    let activeSubCat = options.subCategory || 'character';
    let previewCharId = options.previewCharId || bp.selectedStudentChar || 'kiko';
    let shopFeedback = options.feedback || null;
    let isProcessingPurchase = false;

    const subCategories = [
      { key: 'character', label: '🦁 Karakter' },
      { key: 'costume', label: '👕 Kostum' },
      { key: 'accessory', label: '👑 Aksesori' },
      { key: 'effects', label: '⚡ Efek Arena' }
    ];

    const renderView = () => {
      const previewCharObj = BATTLE_CHARACTERS.find((c) => c.id === previewCharId) || BATTLE_CHARACTERS[0];
      const isPreviewOwned = this.isBattleCharOwned(previewCharObj, bp);
      const previewUrl = BattleFighterRig.renderPreviewDataURL(previewCharObj.id, 'student', bp.equipped);
      const activeCostumeName = BATTLE_COSTUMES.find((c) => c.id === bp.equipped.costume)?.name || 'Default';
      const activeAccName = BATTLE_ACCESSORIES.find((a) => a.id === bp.equipped.accessory)?.name || 'Tanpa Aksesori';
      const activeAtkName = BATTLE_ATTACK_EFFECTS.find((e) => e.id === bp.equipped.attackEffect)?.name || 'Default';
      const activeVicName = BATTLE_VICTORY_EFFECTS.find((v) => v.id === bp.equipped.victoryEffect)?.name || 'Confetti';

      const renderStandardShopGroup = (title, category, items, ownedList, equippedId) => {
        const cards = items.map((it) => {
          const owned = ownedList.includes(it.id);
          const equipped = equippedId === it.id;
          return `
            <div class="choice-card" style="padding:10px; gap:6px; ${equipped ? 'background:#fff6d6; border-color:#f39c12;' : ''}">
              <div style="font-weight:900; font-size:0.88rem;">${this.escapeHtml(it.name)}</div>
              <div style="font-size:0.78rem; font-weight:700; color:#576574;">${owned ? 'Dimiliki' : `🪙 ${it.price} Koin`}</div>
              ${owned
                ? `<button type="button" class="btn-cartoon btn-small ${equipped ? 'btn-green' : 'btn-blue'} btn-equip-item" data-cat="${category}" data-id="${it.id}" style="padding:4px 10px; font-size:0.78rem;">${equipped ? 'Dipakai' : 'Pakai'}</button>`
                : `<button type="button" class="btn-cartoon btn-small btn-purple btn-buy-item" data-cat="${category}" data-id="${it.id}" data-name="${this.escapeHtml(it.name)}" data-price="${it.price}" style="padding:4px 10px; font-size:0.78rem;">Beli 🪙${it.price}</button>`
              }
            </div>
          `;
        }).join('');

        return `
          <div style="margin-bottom:12px;">
            <div style="font-weight:900; text-align:left; margin-bottom:6px; font-size:0.92rem;">${title}</div>
            <div class="selection-grid-4" style="margin:0;">${cards}</div>
          </div>
        `;
      };

      const renderCharacterShopSection = () => {
        const purchasableChars = BATTLE_CHARACTERS.filter((c) => !c.free);
        const cards = purchasableChars.map((ch) => {
          const owned = this.isBattleCharOwned(ch, bp);
          const isPreviewing = previewCharId === ch.id;
          const thumbUrl = BattleFighterRig.renderPreviewDataURL(ch.id);

          return `
            <div class="choice-card" style="padding:10px; gap:5px; ${isPreviewing ? 'background:#eef9ff; border-color:#2563eb;' : ''}">
              <img src="${thumbUrl}" alt="${this.escapeHtml(ch.name)}" style="width:68px; height:76px; object-fit:contain;" />
              <div style="font-weight:900; font-size:0.9rem; color:#2b1810;">${this.escapeHtml(ch.name)}</div>
              <div style="font-size:0.74rem; font-weight:700; color:#64748b;">${this.escapeHtml(ch.roleTag || 'Koleksi Karakter')}</div>
              <div style="font-size:0.8rem; font-weight:800; color:${owned ? '#15803d' : '#b45309'};">
                ${owned ? '✅ Dimiliki' : `🪙 ${ch.price} Koin`}
              </div>
              <div style="display:flex; gap:6px; justify-content:center; flex-wrap:wrap; margin-top:2px;">
                <button type="button" class="btn-cartoon btn-small btn-blue btn-preview-char" data-id="${ch.id}" style="padding:4px 9px; font-size:0.74rem;">
                  👁️ Preview
                </button>
                ${owned
                  ? `<span class="status-badge badge-active" style="font-size:0.72rem;">Dimiliki</span>`
                  : `<button type="button" class="btn-cartoon btn-small btn-purple btn-buy-char" data-id="${ch.id}" data-name="${this.escapeHtml(ch.name)}" data-price="${ch.price}" style="padding:4px 10px; font-size:0.74rem;">Beli</button>`
                }
              </div>
            </div>
          `;
        }).join('');

        return `
          <div style="margin-bottom:10px;">
            <div style="font-weight:900; text-align:left; margin-bottom:6px; font-size:0.92rem;">
              🦁 Toko Karakter Koleksi (Dapat dipakai sebagai Tutor &amp; Murid)
            </div>
            <div class="selection-grid-4" style="margin:0;">${cards}</div>
          </div>
        `;
      };

      let shopContentHtml = '';
      if (activeSubCat === 'character') {
        shopContentHtml = renderCharacterShopSection();
      } else if (activeSubCat === 'costume') {
        shopContentHtml = renderStandardShopGroup('👕 Kostum Petarung', 'costume', BATTLE_COSTUMES, bp.unlockedCostumes, bp.equipped.costume);
      } else if (activeSubCat === 'accessory') {
        shopContentHtml = renderStandardShopGroup('👑 Aksesori Petarung', 'accessory', BATTLE_ACCESSORIES, bp.unlockedAccessories, bp.equipped.accessory);
      } else {
        shopContentHtml = `
          ${renderStandardShopGroup('⚡ Efek Serangan', 'attackEffect', BATTLE_ATTACK_EFFECTS, bp.unlockedAttackEffects, bp.equipped.attackEffect)}
          ${renderStandardShopGroup('🎉 Efek Kemenangan', 'victoryEffect', BATTLE_VICTORY_EFFECTS, bp.unlockedVictoryEffects, bp.equipped.victoryEffect)}
        `;
      }

      const subTabsHtml = subCategories.map((sc) => `
        <button type="button" class="btn-cartoon btn-small ba-shop-subtab ${activeSubCat === sc.key ? 'btn-blue' : 'btn-gray'}" data-subcat="${sc.key}" style="padding:5px 12px; font-size:0.82rem;">
          ${sc.label}
        </button>
      `).join('');

      this.container.innerHTML = `
        <div class="screen-overlay">
          ${this.renderFantasyBackdrop()}
          <div class="cartoon-panel" style="max-width: 980px;">
            ${this.renderBattleHubHeader('collection', bp, lvlInfo)}

            <div style="display:flex; align-items:center; justify-content:center; gap:18px; background:#eef9ff; border:3px solid #3498db; border-radius:16px; padding:10px 14px; margin-bottom:10px; flex-wrap:wrap;">
              <img src="${previewUrl}" alt="Preview" style="width:76px; height:86px; object-fit:contain;" />
              <div style="text-align:left; font-size:0.88rem; font-weight:800;">
                <div style="font-size:1rem; color:#1e3a8a;">
                  ✨ Preview: ${this.escapeHtml(previewCharObj.name)}
                  <span class="status-badge ${isPreviewOwned ? 'badge-active' : 'badge-soon'}" style="margin-left:6px; font-size:0.72rem;">
                    ${isPreviewOwned ? 'Dimiliki' : `Preview Saja · 🔒 ${previewCharObj.price} Koin`}
                  </span>
                </div>
                <div style="color:#475569; font-size:0.8rem; margin-top:2px;">
                  Kosmetik murni — adil tanpa bonus damage atau statistik pertandingan.
                </div>
                <div style="color:#0369a1; font-size:0.8rem; margin-top:2px;">
                  Kostum: ${this.escapeHtml(activeCostumeName)} · Aksesori: ${this.escapeHtml(activeAccName)} · Serangan: ${this.escapeHtml(activeAtkName)} · Menang: ${this.escapeHtml(activeVicName)}
                </div>
              </div>
            </div>

            <div style="display:flex; justify-content:center; gap:8px; flex-wrap:wrap; margin-bottom:10px;">
              ${subTabsHtml}
            </div>

            ${shopFeedback ? `
              <div id="shop-msg" style="background:${shopFeedback.type === 'success' ? '#dcfce7' : '#fee2e2'}; color:${shopFeedback.type === 'success' ? '#14532d' : '#991b1b'}; border:2px solid ${shopFeedback.type === 'success' ? '#22c55e' : '#ef4444'}; border-radius:12px; padding:8px 12px; font-weight:800; font-size:0.86rem; margin-bottom:10px;">
                ${this.escapeHtml(shopFeedback.text)}
              </div>
            ` : ''}

            <div class="tutor-scroll-area" style="max-height:300px;">
              ${shopContentHtml}
            </div>
          </div>
        </div>
      `;

      this.bindBattleHubHeaderEvents('collection');

      this.container.querySelectorAll('.ba-shop-subtab').forEach((btn) => {
        btn.addEventListener('click', () => {
          battleAudio.play('click');
          activeSubCat = btn.dataset.subcat;
          shopFeedback = null;
          renderView();
        });
      });

      this.container.querySelectorAll('.btn-preview-char').forEach((btn) => {
        btn.addEventListener('click', () => {
          battleAudio.play('click');
          previewCharId = btn.dataset.id;
          renderView();
        });
      });

      this.container.querySelectorAll('.btn-buy-char').forEach((btn) => {
        btn.addEventListener('click', () => {
          if (!this.activeProfile || isProcessingPurchase) return;
          const charId = btn.dataset.id;
          const charObj = BATTLE_CHARACTERS.find((c) => c.id === charId);
          if (!charObj) return;

          if (this.isBattleCharOwned(charObj, bp)) {
            shopFeedback = { type: 'error', text: `${charObj.name} sudah dimiliki.` };
            renderView();
            return;
          }

          if ((bp.coins || 0) < charObj.price) {
            battleAudio.play('wrong');
            const kurang = charObj.price - (bp.coins || 0);
            shopFeedback = {
              type: 'error',
              text: `Koin belum cukup untuk membeli ${charObj.name}! Kamu butuh ${kurang} koin lagi (saldo: ${bp.coins || 0} koin).`
            };
            renderView();
            return;
          }

          battleAudio.play('click');
          this.showBattlePurchaseConfirmModal({
            charObj,
            currentCoins: bp.coins || 0,
            onConfirm: async () => {
              if (isProcessingPurchase) return;
              isProcessingPurchase = true;
              const res = await db.purchaseBattleArenaItem(
                this.activeProfile.id,
                'character',
                charObj.id,
                charObj.price
              );
              isProcessingPurchase = false;

              if (res.success) {
                battleAudio.play('reward');
                this.activeProfile = res.profile;
                this.showBattleArenaHub('collection', {
                  subCategory: 'character',
                  previewCharId: charObj.id,
                  feedback: {
                    type: 'success',
                    text: `Berhasil! ${charObj.name} kini Dimiliki dan langsung bisa dipilih sebagai Tutor atau Murid di tab Pertarungan.`
                  }
                });
              } else {
                battleAudio.play('wrong');
                shopFeedback = { type: 'error', text: res.message || 'Pembelian gagal diproses.' };
                renderView();
              }
            }
          });
        });
      });

      this.container.querySelectorAll('.btn-buy-item').forEach((btn) => {
        btn.addEventListener('click', () => {
          if (!this.activeProfile || isProcessingPurchase) return;
          const cat = btn.dataset.cat;
          const itemId = btn.dataset.id;
          const itemName = btn.dataset.name || itemId;
          const itemPrice = Number(btn.dataset.price) || 0;

          const ownedListMap = {
            costume: bp.unlockedCostumes,
            accessory: bp.unlockedAccessories,
            attackEffect: bp.unlockedAttackEffects,
            victoryEffect: bp.unlockedVictoryEffects
          };
          if ((ownedListMap[cat] || []).includes(itemId)) {
            shopFeedback = { type: 'error', text: `${itemName} sudah kamu miliki.` };
            renderView();
            return;
          }

          if ((bp.coins || 0) < itemPrice) {
            battleAudio.play('wrong');
            const kurang = itemPrice - (bp.coins || 0);
            shopFeedback = {
              type: 'error',
              text: `Koin belum cukup untuk membeli ${itemName}! Butuh ${kurang} koin lagi (saldo: ${bp.coins || 0} koin).`
            };
            renderView();
            return;
          }

          battleAudio.play('click');
          this.showBattlePurchaseConfirmModal({
            title: 'Konfirmasi Pembelian Item',
            itemName,
            itemSubtitle:
              cat === 'costume'
                ? 'Kostum Karakter'
                : cat === 'accessory'
                  ? 'Aksesori Karakter'
                  : 'Efek Arena Quiz Battle',
            price: itemPrice,
            currentCoins: bp.coins || 0,
            previewUrl:
              cat === 'costume'
                ? BattleFighterRig.renderPreviewDataURL(previewCharId, 'student', { ...bp.equipped, costume: itemId })
                : cat === 'accessory'
                  ? BattleFighterRig.renderPreviewDataURL(previewCharId, 'student', { ...bp.equipped, accessory: itemId })
                  : null,
            onConfirm: async () => {
              if (isProcessingPurchase) return;
              isProcessingPurchase = true;
              const res = await db.purchaseBattleArenaItem(this.activeProfile.id, cat, itemId, itemPrice);
              isProcessingPurchase = false;

              if (res.success) {
                battleAudio.play('reward');
                this.activeProfile = res.profile;
                this.showBattleArenaHub('collection', {
                  subCategory: activeSubCat,
                  previewCharId,
                  feedback: {
                    type: 'success',
                    text: `Berhasil membeli ${itemName}! Klik tombol "Pakai" untuk langsung menggunakannya di arena.`
                  }
                });
              } else {
                battleAudio.play('wrong');
                shopFeedback = { type: 'error', text: res.message || 'Pembelian gagal diproses.' };
                renderView();
              }
            }
          });
        });
      });

      this.container.querySelectorAll('.btn-equip-item').forEach((btn) => {
        btn.addEventListener('click', async () => {
          if (!this.activeProfile) return;
          battleAudio.play('click');
          this.activeProfile = await db.equipBattleArenaItem(
            this.activeProfile.id,
            btn.dataset.cat,
            btn.dataset.id
          );
          this.showBattleArenaHub('collection', {
            subCategory: activeSubCat,
            previewCharId
          });
        });
      });
    };

    renderView();
  }

  showBattlePurchaseConfirmModal({
    charObj = null,
    title = 'Konfirmasi Pembelian',
    itemName = '',
    itemSubtitle = '',
    price = 0,
    previewUrl = null,
    currentCoins = 0,
    onConfirm
  }) {
    const existing = document.getElementById('ba-buy-confirm-modal');
    if (existing) existing.remove();

    const resolvedName = charObj ? charObj.name : itemName;
    const resolvedSub = charObj ? (charObj.roleTag || 'Koleksi Karakter') : itemSubtitle;
    const resolvedPrice = charObj ? charObj.price : price;
    const resolvedImg = charObj ? BattleFighterRig.renderPreviewDataURL(charObj.id) : previewUrl;
    const sisaKoin = Math.max(0, currentCoins - resolvedPrice);

    const modalEl = document.createElement('div');
    modalEl.id = 'ba-buy-confirm-modal';
    modalEl.className = 'modal-backdrop';
    modalEl.style.position = 'absolute';
    modalEl.style.inset = '0';
    modalEl.style.zIndex = '70';

    modalEl.innerHTML = `
      <div class="cartoon-panel" style="max-width:440px; padding:22px; text-align:center;">
        <h3 style="margin:0 0 8px; font-size:1.25rem; font-weight:900; color:#2b1810;">
          🛒 ${this.escapeHtml(charObj ? 'Konfirmasi Pembelian Karakter' : title)}
        </h3>
        <div style="background:#eef9ff; border:2px solid #38bdf8; border-radius:16px; padding:12px; margin-bottom:14px;">
          ${resolvedImg ? `<img src="${resolvedImg}" alt="${this.escapeHtml(resolvedName)}" style="width:94px; height:106px; object-fit:contain;" />` : `<div style="font-size:2.6rem;">✨</div>`}
          <div style="font-weight:900; font-size:1.08rem; color:#1e3a8a; margin-top:4px;">${this.escapeHtml(resolvedName)}</div>
          <div style="font-size:0.84rem; font-weight:700; color:#475569;">${this.escapeHtml(resolvedSub)}</div>
        </div>

        <div style="background:#fffbeb; border:2px solid #f59e0b; border-radius:12px; padding:10px 14px; font-size:0.88rem; font-weight:800; color:#78350f; margin-bottom:16px;">
          <div>Harga: <strong>🪙 ${resolvedPrice} Koin</strong></div>
          <div style="font-size:0.82rem; margin-top:4px; color:#576574;">
            Saldo Sekarang: ${currentCoins} Koin → Sisa Setelah Beli: <strong>${sisaKoin} Koin</strong>
          </div>
        </div>

        <div class="btn-group-horizontal" style="justify-content:center; gap:10px;">
          <button type="button" id="btn-ba-confirm-cancel" class="btn-cartoon btn-gray btn-small">Batal</button>
          <button type="button" id="btn-ba-confirm-ok" class="btn-cartoon btn-green btn-small">✅ Konfirmasi Beli</button>
        </div>
      </div>
    `;

    this.container.appendChild(modalEl);

    let confirmedOnce = false;
    document.getElementById('btn-ba-confirm-cancel').addEventListener('click', () => {
      battleAudio.play('click');
      modalEl.remove();
    });

    const okBtn = document.getElementById('btn-ba-confirm-ok');
    okBtn.addEventListener('click', async () => {
      if (confirmedOnce) return;
      confirmedOnce = true;
      okBtn.disabled = true;
      modalEl.remove();
      if (onConfirm) await onConfirm();
    });
  }

  renderBattleAchievementsTab(bp, lvlInfo) {
    const st = bp.stats;
    const acc =
      st.totalQuestions > 0
        ? Math.round((st.totalCorrect / st.totalQuestions) * 100)
        : 0;

    const achCards = BATTLE_ACHIEVEMENTS.map((a) => {
      const unlocked = bp.achievements.includes(a.id);
      return `
        <div class="choice-card ${unlocked ? "selected" : "card-disabled"}" style="padding:10px;">
          <div style="font-size:2rem;">${unlocked ? a.icon : "🔒"}</div>
          <div style="font-weight:900; font-size:0.95rem;">${this.escapeHtml(a.name)}</div>
          <div style="font-size:0.8rem; font-weight:700; color:#576574;">${this.escapeHtml(a.desc)}</div>
          <span class="status-badge ${unlocked ? "badge-active" : "badge-soon"}">${unlocked ? "Terbuka" : "Terkunci"}</span>
        </div>
      `;
    }).join("");

    this.container.innerHTML = `
      <div class="screen-overlay">
        <div class="cartoon-panel" style="max-width: 960px;">
          ${this.renderBattleHubHeader("achievements", bp, lvlInfo)}

          <div class="tutor-kpi-grid" style="margin-bottom:10px;">
            <div class="tutor-kpi-card"><div class="tutor-kpi-val">Lv.${lvlInfo.level}</div><div class="tutor-kpi-label">XP: ${bp.xp} (${lvlInfo.progressPct}%)</div></div>
            <div class="tutor-kpi-card"><div class="tutor-kpi-val">${st.wins}W / ${st.losses}L</div><div class="tutor-kpi-label">Menang / Kalah (${st.draws} Seri)</div></div>
            <div class="tutor-kpi-card"><div class="tutor-kpi-val">${acc}%</div><div class="tutor-kpi-label">Akurasi (${st.totalCorrect}/${st.totalQuestions})</div></div>
            <div class="tutor-kpi-card"><div class="tutor-kpi-val">🔥 ${st.highestCombo}x</div><div class="tutor-kpi-label">Combo Tertinggi</div></div>
          </div>

          <div class="tutor-scroll-area" style="max-height:290px;">
            <div class="selection-grid-3" style="margin:0;">${achCards}</div>
          </div>
        </div>
      </div>
    `;

    this.bindBattleHubHeaderEvents("achievements");
  }

  renderBattleHistoryTab(bp, lvlInfo) {
    const history = [
      ...(this.activeProfile?.battleArenaHistory || []),
    ].reverse();
    const rows =
      history.length === 0
        ? `<tr><td colspan="6" style="text-align:center; font-weight:700;">Belum ada riwayat pertandingan Quiz Battle Arena.</td></tr>`
        : history
            .map(
              (h) => `
          <tr>
            <td>${this.formatDate(h.playedAt)}</td>
            <td>${this.escapeHtml(h.tutorName)} vs ${this.escapeHtml(h.studentName)}</td>
            <td>Kls ${h.grade} — ${this.escapeHtml(h.subject)}</td>
            <td>${this.escapeHtml(h.difficulty)}</td>
            <td>HP: ${h.tutorHpLeft} vs ${h.studentHpLeft} | Akurasi: ${h.studentStats?.accuracy || 0}%</td>
            <td><strong>${h.winner === "student" ? "🏆 Murid" : h.winner === "tutor" ? "👨🏫 Tutor" : "🤝 Seri"}</strong></td>
          </tr>
        `,
            )
            .join("");

    this.container.innerHTML = `
      <div class="screen-overlay">
        <div class="cartoon-panel" style="max-width: 960px;">
          ${this.renderBattleHubHeader("history", bp, lvlInfo)}
          <div class="tutor-scroll-area" style="max-height:360px;">
            <table class="tutor-table">
              <thead>
                <tr><th>Tanggal</th><th>Pemain</th><th>Kelas & Mapel</th><th>Kesulitan</th><th>Ringkasan Skor</th><th>Hasil</th></tr>
              </thead>
              <tbody>${rows}</tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    this.bindBattleHubHeaderEvents("history");
  }

  clearBattleTimers() {
    if (this.battleTimerInterval) {
      clearInterval(this.battleTimerInterval);
      this.battleTimerInterval = null;
    }
    if (this.battleTutorNextTimeout) {
      clearTimeout(this.battleTutorNextTimeout);
      this.battleTutorNextTimeout = null;
    }
    if (this.battleStudentNextTimeout) {
      clearTimeout(this.battleStudentNextTimeout);
      this.battleStudentNextTimeout = null;
    }
    if (this.battleEndTimeout) {
      clearTimeout(this.battleEndTimeout);
      this.battleEndTimeout = null;
    }
    if (this.battleKeyHandler) {
      window.removeEventListener("keydown", this.battleKeyHandler);
      this.battleKeyHandler = null;
    }
  }

  startBattleArenaMatch(config) {
    this.clearBattleTimers();
    this.stopAllGameplayScenes();
    questionManager.resetSession();

    const maxLives = Number(config.maxLives) || 5;

    this.battleSession = {
      matchId:
        "ba_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6),
      tutorName: config.tutorName,
      studentName: config.studentName,
      tutorCharacter: config.tutorCharacter,
      studentCharacter: config.studentCharacter,
      studentCosmetic: config.studentCosmetic || {},
      grade: config.grade,
      subject: config.subject,
      difficulty: config.difficulty,
      effectiveDifficulty:
        config.difficulty === "adaptif" ? null : config.difficulty,
      maxLives,
      matchEnded: false,
      pendingEndCheck: false,
      tutor: {
        lives: maxLives,
        answered: 0,
        correct: 0,
        wrong: 0,
        attacks: 0,
        combo: 0,
        maxCombo: 0,
        qNum: 0,
        currentQuestion: null,
        inputLocked: false,
      },
      student: {
        lives: maxLives,
        answered: 0,
        correct: 0,
        wrong: 0,
        attacks: 0,
        combo: 0,
        maxCombo: 0,
        qNum: 0,
        currentQuestion: null,
        inputLocked: false,
      },
    };

    this.phaserGame.scene.start("BattleArenaScene", {
      tutorName: config.tutorName,
      studentName: config.studentName,
      tutorCharacter: config.tutorCharacter,
      studentCharacter: config.studentCharacter,
      studentCosmetic: config.studentCosmetic,
      maxLives,
    });

    this.renderDualRaceArenaOverlay();
    this.loadNextQuestionForPlayer("tutor");
    this.loadNextQuestionForPlayer("student");
  }

  renderDualRaceArenaOverlay() {
    this.clearBattleTimers();
    const s = this.battleSession;
    const subInfo = this.getSubjectInfo(s.subject);

    this.container.innerHTML = `
      <div class="hud-overlay" style="padding:8px 14px;">
        <div class="hud-top-bar">
          <div class="hud-stats-group">
            <div class="hud-pill" style="background:#fff9db;">
              <span>⚔️ <strong>DUAL BATTLE RACE</strong></span>
            </div>
            <div class="hud-pill" style="background:#eef9ff;">
              <span>${subInfo.icon} ${this.escapeHtml(subInfo.name)} Kelas ${s.grade}</span>
            </div>
          </div>
          <button id="btn-ba-quit" class="btn-cartoon btn-red btn-small" style="pointer-events:auto; padding:5px 12px; font-size:0.85rem;">✖ Keluar</button>
        </div>

        <div class="duel-modal-backdrop" style="background:transparent; padding:0;">
          <div class="quiz-panel" style="max-width:1080px; padding:10px 12px; border-radius:18px; margin-bottom:2px;">
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px;">
              <div id="ba-panel-tutor" style="background:#f0f8ff; border:3px solid #3498db; border-radius:14px; padding:9px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px; font-weight:900; font-size:0.84rem; color:#2980b9;">
                  <span>👨‍🏫 ${this.escapeHtml(s.tutorName)} [A / S / D / F]</span>
                  <span id="ba-qnum-tutor">Soal #1</span>
                </div>
                <div id="ba-qtext-tutor" style="background:#ffffff; border:2px solid #aed6f1; border-radius:10px; padding:8px 10px; font-weight:800; font-size:0.9rem; color:#2c3e50; min-height:58px; margin-bottom:7px; text-align:left; line-height:1.32;"></div>
                <div id="ba-opts-tutor" style="display:grid; grid-template-columns: 1fr 1fr; gap:6px;"></div>
                <div id="ba-fb-tutor" style="margin-top:6px; min-height:24px; font-weight:900; font-size:0.82rem; border-radius:8px; padding:3px 8px; text-align:center;"></div>
              </div>

              <div id="ba-panel-student" style="background:#fffaf0; border:3px solid #e67e22; border-radius:14px; padding:9px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px; font-weight:900; font-size:0.84rem; color:#d35400;">
                  <span>🧒 ${this.escapeHtml(s.studentName)} [H / J / K / L]</span>
                  <span id="ba-qnum-student">Soal #1</span>
                </div>
                <div id="ba-qtext-student" style="background:#ffffff; border:2px solid #fad7a0; border-radius:10px; padding:8px 10px; font-weight:800; font-size:0.9rem; color:#2c3e50; min-height:58px; margin-bottom:7px; text-align:left; line-height:1.32;"></div>
                <div id="ba-opts-student" style="display:grid; grid-template-columns: 1fr 1fr; gap:6px;"></div>
                <div id="ba-fb-student" style="margin-top:6px; min-height:24px; font-weight:900; font-size:0.82rem; border-radius:8px; padding:3px 8px; text-align:center;"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    document.getElementById("btn-ba-quit").addEventListener("click", () => {
      this.clearBattleTimers();
      battleAudio.play("click");
      this.showBattleArenaHub("setup");
    });

    const tutorKeyMap = { A: 0, S: 1, D: 2, F: 3 };
    const studentKeyMap = { H: 0, J: 1, K: 2, L: 3 };

    this.battleKeyHandler = (e) => {
      if (!this.battleSession || this.battleSession.matchEnded) return;
      if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;

      const tag =
        e.target && e.target.tagName ? e.target.tagName.toUpperCase() : "";
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      const key = String(e.key || "").toUpperCase();
      if (Object.prototype.hasOwnProperty.call(tutorKeyMap, key)) {
        e.preventDefault();
        this.handleDualRaceAnswer("tutor", tutorKeyMap[key]);
      } else if (Object.prototype.hasOwnProperty.call(studentKeyMap, key)) {
        e.preventDefault();
        this.handleDualRaceAnswer("student", studentKeyMap[key]);
      }
    };

    window.addEventListener("keydown", this.battleKeyHandler);
  }

  fetchUniqueQuestionForPlayer(role) {
    const s = this.battleSession;
    const opponentRole = role === "tutor" ? "student" : "tutor";
    const oppQ = s[opponentRole]?.currentQuestion;

    let qData = questionManager.getNextQuestion(s.subject, null, {
      grade: s.grade,
      profile: this.activeProfile,
      settings: this.settings,
      forceDifficulty: s.effectiveDifficulty || null,
    });

    if (!qData || qData.error || (oppQ && qData.question === oppQ.question)) {
      questionManager.resetSession();
      if (oppQ) {
        questionManager.usedQuestionIds.add(oppQ.id);
        questionManager.usedQuestionSignatures.add(oppQ.question);
      }
      qData = questionManager.getNextQuestion(s.subject, null, {
        grade: s.grade,
        profile: this.activeProfile,
        settings: this.settings,
        forceDifficulty: s.effectiveDifficulty || null,
      });
    }

    if (!s.effectiveDifficulty && qData && !qData.error && qData.difficulty) {
      s.effectiveDifficulty = qData.difficulty;
    }

    return qData;
  }

  loadNextQuestionForPlayer(role) {
    const s = this.battleSession;
    if (!s || s.matchEnded) return;

    const pState = s[role];
    const qData = this.fetchUniqueQuestionForPlayer(role);
    if (!qData || qData.error) return;

    pState.qNum += 1;
    pState.currentQuestion = qData;
    pState.inputLocked = false;

    const qNumEl = document.getElementById(`ba-qnum-${role}`);
    const qTextEl = document.getElementById(`ba-qtext-${role}`);
    const optsEl = document.getElementById(`ba-opts-${role}`);
    const fbEl = document.getElementById(`ba-fb-${role}`);

    if (!qTextEl || !optsEl) return;

    const letters = ["A", "B", "C", "D"];
    const keyHints =
      role === "tutor" ? ["A", "S", "D", "F"] : ["H", "J", "K", "L"];

    if (qNumEl)
      qNumEl.textContent = `Soal #${pState.qNum} (${qData.difficulty.toUpperCase()})`;
    qTextEl.textContent = qData.question;

    optsEl.innerHTML = qData.options
      .map(
        (opt, idx) => `
      <button class="btn-option ba-race-btn-${role}" data-idx="${idx}" style="padding:6px 8px; font-size:0.84rem; min-height:38px;">
        <span class="option-letter" style="width:22px; height:22px; font-size:0.76rem;">${letters[idx]}</span>
        <span style="flex:1; text-align:left; line-height:1.2;">${this.escapeHtml(opt)}</span>
        <span style="font-size:0.7rem; opacity:0.65; font-weight:900;">[${keyHints[idx]}]</span>
      </button>
    `,
      )
      .join("");

    if (fbEl) {
      fbEl.textContent = "";
      fbEl.style.background = "transparent";
    }

    optsEl.querySelectorAll(`.ba-race-btn-${role}`).forEach((btn) => {
      btn.addEventListener("click", () => {
        this.handleDualRaceAnswer(role, Number(btn.dataset.idx));
      });
    });
  }

  handleDualRaceAnswer(role, optionIdx) {
    const s = this.battleSession;
    if (!s || s.matchEnded) return;

    const pState = s[role];
    if (!pState || pState.inputLocked || !pState.currentQuestion) return;

    const qData = pState.currentQuestion;
    if (optionIdx < 0 || optionIdx >= qData.options.length) return;

    pState.inputLocked = true;
    const chosenAnswer = qData.options[optionIdx];
    const isCorrect = chosenAnswer === qData.correctAnswer;

    pState.answered += 1;

    const optsEl = document.getElementById(`ba-opts-${role}`);
    const fbEl = document.getElementById(`ba-fb-${role}`);

    if (optsEl) {
      optsEl.querySelectorAll("button").forEach((btn, idx) => {
        btn.disabled = true;
        if (qData.options[idx] === qData.correctAnswer) {
          btn.classList.add("correct");
        } else if (idx === optionIdx && !isCorrect) {
          btn.classList.add("wrong");
        }
      });
    }

    if (isCorrect) {
      pState.correct += 1;
      pState.attacks += 1;
      pState.combo += 1;
      pState.maxCombo = Math.max(pState.maxCombo, pState.combo);

      if (fbEl) {
        fbEl.textContent = "⚔️ BENAR! Menyerang lawan (-1 ❤️)";
        fbEl.style.background = "#d4efdf";
        fbEl.style.color = "#145a32";
      }

      battleAudio.play("attack");

      const battleScene = this.phaserGame.scene.getScene("BattleArenaScene");
      if (battleScene) {
        battleScene.triggerIndependentAttack(role, (attackerRole) => {
          if (!this.battleSession || this.battleSession.matchEnded) return;
          battleAudio.play("hit");
          if (attackerRole === "tutor") {
            this.battleSession.student.lives = Math.max(
              0,
              this.battleSession.student.lives - 1,
            );
          } else {
            this.battleSession.tutor.lives = Math.max(
              0,
              this.battleSession.tutor.lives - 1,
            );
          }
          battleScene.updateLives(
            this.battleSession.tutor.lives,
            this.battleSession.student.lives,
          );
          this.checkDualRaceMatchEnd();
        });
      } else {
        if (role === "tutor")
          s.student.lives = Math.max(0, s.student.lives - 1);
        else s.tutor.lives = Math.max(0, s.tutor.lives - 1);
        this.checkDualRaceMatchEnd();
      }
    } else {
      pState.wrong += 1;
      pState.combo = 0;

      if (fbEl) {
        fbEl.textContent = `❌ Salah! Jawaban: ${qData.correctAnswer}`;
        fbEl.style.background = "#fadbd8";
        fbEl.style.color = "#78281f";
      }

      battleAudio.play("wrong");
    }

    const delayMs = isCorrect ? 720 : 900;
    const timeoutId = setTimeout(() => {
      this.loadNextQuestionForPlayer(role);
    }, delayMs);

    if (role === "tutor") {
      if (this.battleTutorNextTimeout)
        clearTimeout(this.battleTutorNextTimeout);
      this.battleTutorNextTimeout = timeoutId;
    } else {
      if (this.battleStudentNextTimeout)
        clearTimeout(this.battleStudentNextTimeout);
      this.battleStudentNextTimeout = timeoutId;
    }
  }

  checkDualRaceMatchEnd() {
    const s = this.battleSession;
    if (!s || s.matchEnded) return;

    if (s.tutor.lives <= 0 || s.student.lives <= 0) {
      if (s.pendingEndCheck) return;
      s.pendingEndCheck = true;

      this.battleEndTimeout = setTimeout(() => {
        if (!this.battleSession || this.battleSession.matchEnded) return;
        this.battleSession.matchEnded = true;
        this.battleSession.tutor.inputLocked = true;
        this.battleSession.student.inputLocked = true;
        this.showBattleResult();
      }, 260);
    }
  }

  async showBattleResult() {
    this.clearBattleTimers();
    const s = this.battleSession;

    let winner = "draw";
    let titleText = "🤝 PERTARUNGAN SERI!";
    let subText = "Kedua petarung kehabisan nyawa pada saat bersamaan!";

    if (s.student.lives > s.tutor.lives) {
      winner = "student";
      titleText = `🏆 PEMENANG: ${s.studentName.toUpperCase()}!`;
      subText = `Hebat sekali ${s.studentName}! Kamu menang dengan sisa ${s.student.lives} nyawa!`;
      battleAudio.play("victory");
    } else if (s.tutor.lives > s.student.lives) {
      winner = "tutor";
      titleText = `🏆 PEMENANG: ${s.tutorName.toUpperCase()}!`;
      subText = `Balapan yang seru! Ayo ${s.studentName}, coba tanding lagi!`;
      battleAudio.play("defeat");
    } else {
      battleAudio.play("reward");
    }

    const battleScene = this.phaserGame.scene.getScene("BattleArenaScene");
    if (battleScene) {
      battleScene.playEndMatchAnimation(winner);
    }

    let rewardHtml = "";
    if (this.activeProfile) {
      const saveRes = await db.recordBattleArenaResult(this.activeProfile.id, {
        matchId: s.matchId,
        grade: s.grade,
        subject: s.subject,
        difficulty: s.difficulty,
        maxLives: s.maxLives,
        totalQuestionsPlayed: s.tutor.answered + s.student.answered,
        winner,
        tutorName: s.tutorName,
        studentName: s.studentName,
        tutorCharacter: s.tutorCharacter,
        studentCharacter: s.studentCharacter,
        tutorLivesLeft: s.tutor.lives,
        studentLivesLeft: s.student.lives,
        tutorStats: s.tutor,
        studentStats: s.student,
      });

      if (saveRes?.profile) {
        this.activeProfile = saveRes.profile;
      }

      if (saveRes?.rewardBreakdown) {
        const rb = saveRes.rewardBreakdown;
        battleAudio.play("reward");
        rewardHtml = `
          <div style="background:#fff9db; border:3px solid #f39c12; border-radius:14px; padding:10px; margin-bottom:10px; font-weight:800; font-size:0.9rem;">
            🎁 <strong>REWARD DIDAPAT:</strong> +🪙 ${rb.totalCoinsEarned} Koin Battle | +⭐ ${rb.totalXpEarned} XP
            ${rb.leveledUp ? ` | 🎉 <strong>NAIK KE LEVEL ${rb.newLevel}!</strong>` : ""}
            ${rb.newAchievements.length > 0 ? ` | 🏆 Achievement Baru: ${rb.newAchievements.join(", ")}` : ""}
          </div>
        `;
      }
    }

    const tAcc =
      s.tutor.answered > 0
        ? Math.round((s.tutor.correct / s.tutor.answered) * 100)
        : 0;
    const sAcc =
      s.student.answered > 0
        ? Math.round((s.student.correct / s.student.answered) * 100)
        : 0;

    this.container.innerHTML = `
      <div class="screen-overlay" style="background: rgba(20, 30, 48, 0.84);">
        <div class="cartoon-panel" style="max-width: 820px;">
          <div class="game-logo-badge" style="background:#f1c40f; color:#2c3e50;">⚔️ HASIL DUAL QUESTION BATTLE RACE ⚔️</div>
          <h2 class="panel-header-title" style="margin-bottom:4px;">${this.escapeHtml(titleText)}</h2>
          <p class="game-subtitle" style="color:#27ae60; margin-bottom:10px;">${this.escapeHtml(subText)}</p>

          ${rewardHtml}

          <div class="duel-comparison-grid">
            <div class="duel-player-card" style="background:#f4f9fd; border-color:#3498db;">
              <div style="font-size:1.1rem; font-weight:900; color:#2980b9; margin-bottom:6px;">👨‍🏫 ${this.escapeHtml(s.tutorName)}</div>
              <div class="result-stat-row"><span>❤️ Sisa Nyawa:</span><span>${s.tutor.lives}/${s.maxLives}</span></div>
              <div class="result-stat-row"><span>📝 Total Soal:</span><span>${s.tutor.answered} Soal</span></div>
              <div class="result-stat-row"><span>⚔️ Serangan Berhasil:</span><span>${s.tutor.attacks}</span></div>
              <div class="result-stat-row"><span>✅ Benar / ❌ Salah:</span><span>${s.tutor.correct} / ${s.tutor.wrong}</span></div>
              <div class="result-stat-row" style="border:none;"><span>🎯 Akurasi:</span><span>${tAcc}%</span></div>
            </div>

            <div class="duel-player-card" style="background:#fffdf2; border-color:#f39c12;">
              <div style="font-size:1.1rem; font-weight:900; color:#d35400; margin-bottom:6px;">🧒 ${this.escapeHtml(s.studentName)}</div>
              <div class="result-stat-row"><span>❤️ Sisa Nyawa:</span><span>${s.student.lives}/${s.maxLives}</span></div>
              <div class="result-stat-row"><span>📝 Total Soal:</span><span>${s.student.answered} Soal</span></div>
              <div class="result-stat-row"><span>⚔️ Serangan Berhasil:</span><span>${s.student.attacks}</span></div>
              <div class="result-stat-row"><span>✅ Benar / ❌ Salah:</span><span>${s.student.correct} / ${s.student.wrong}</span></div>
              <div class="result-stat-row" style="border:none;"><span>🎯 Akurasi:</span><span>${sAcc}%</span></div>
            </div>
          </div>

          <div class="btn-group-horizontal">
            <button id="btn-ba-rematch" class="btn-cartoon btn-red btn-small">🔄 Tanding Lagi</button>
            <button id="btn-ba-hub" class="btn-cartoon btn-blue btn-small">⚔️ Hub Battle Arena</button>
          </div>
        </div>
      </div>
    `;

    document.getElementById("btn-ba-rematch").addEventListener("click", () => {
      battleAudio.play("click");
      this.showBattleArenaHub("setup");
    });

    document.getElementById("btn-ba-hub").addEventListener("click", () => {
      battleAudio.play("click");
      this.showBattleArenaHub("collection");
    });
  }
}

export const uiManager = new UIManager();
