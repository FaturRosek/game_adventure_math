import {
  EARLY_CHILDHOOD_CATEGORIES,
  getEarlyChildhoodLevelActivities,
} from "../data/earlyChildhoodCatalog.js";
import { db } from "../storage/db.js";
import { earlyChildhoodAudio } from "./EarlyChildhoodAudioManager.js";
import {
  injectEarlyChildhoodStyles,
  getWorldTheme,
  renderWorldBackgroundSVG,
  renderMascotSVG,
  spawnConfettiBurst,
} from "./earlyChildhood/EarlyChildhoodVisuals.js";
import { runMiniGameExploreHunt } from "./earlyChildhood/MiniGameExploreHunt.js";
import { runMiniGameDragDrop } from "./earlyChildhood/MiniGameDragDrop.js";
import { runMiniGamePuzzle } from "./earlyChildhood/MiniGamePuzzle.js";
import { runMiniGameSortGroup } from "./earlyChildhood/MiniGameSortGroup.js";
import { runMiniGameMemoryGuess } from "./earlyChildhood/MiniGameMemoryGuess.js";
import { runMiniGameTraceDraw } from "./earlyChildhood/MiniGameTraceDraw.js";
import {
  runMiniGameColorPaint,
  runMiniGameSequenceOrder,
  runMiniGameLetterHunt,
  runMiniGameAnimalSound,
  runMiniGameSimpleMaze,
} from "./earlyChildhood/MiniGameCategorySpecials.js";

export class EarlyChildhoodAdventureManager {
  constructor() {
    this.miniGameRegistry = new Map();
    this.activeCleanup = null;
    this.registerMiniGame("explore_hunt", runMiniGameExploreHunt);
    this.registerMiniGame("drag_drop", runMiniGameDragDrop);
    this.registerMiniGame("puzzle", runMiniGamePuzzle);
    this.registerMiniGame("sort_group", runMiniGameSortGroup);
    this.registerMiniGame("memory_guess", runMiniGameMemoryGuess);
    this.registerMiniGame("trace_draw", runMiniGameTraceDraw);
    this.registerMiniGame("color_paint", runMiniGameColorPaint);
    this.registerMiniGame("sequence_order", runMiniGameSequenceOrder);
    this.registerMiniGame("letter_hunt", runMiniGameLetterHunt);
    this.registerMiniGame("animal_sound", runMiniGameAnimalSound);
    this.registerMiniGame("simple_maze", runMiniGameSimpleMaze);
  }

  registerMiniGame(activityType, handlerFn) {
    if (!activityType || typeof handlerFn !== "function") return;
    this.miniGameRegistry.set(activityType, handlerFn);
  }

  stopActiveMiniGame() {
    if (typeof this.activeCleanup === "function") {
      this.activeCleanup();
      this.activeCleanup = null;
    }
    earlyChildhoodAudio.stopSpeech();
  }

  async showActivityHub(ui, gradeKey) {
    injectEarlyChildhoodStyles();
    this.stopActiveMiniGame();
    earlyChildhoodAudio.stopBgm();
    ui.stopAllGameplayScenes();

    const cleanGrade = gradeKey === "tk" ? "tk" : "paud";
    if (ui.activeProfile) {
      ui.activeProfile = await db.getProfileById(ui.activeProfile.id);
    }

    const ecProgress = db.getEarlyChildhoodProgress(
      ui.activeProfile,
      cleanGrade,
    );
    const totalStars = ecProgress?.totalStars || 0;
    const totalCoins = ecProgress?.coins || 0;
    const charId = ui.activeProfile?.character || "kiko";
    const playerName = ui.activeProfile?.name || "Petualang Cilik";

    const worldCardsHtml = EARLY_CHILDHOOD_CATEGORIES.map((cat) => {
      const t = getWorldTheme(cat.id);
      const catProg = ecProgress?.categories?.[cat.id] || {
        unlockedLevel: 1,
        levelStars: {},
      };
      const starsInCat = Object.values(catProg.levelStars || {}).reduce(
        (s, v) => s + v,
        0,
      );
      return `
        <div class="ec-world-card ec-cat-card" data-cat="${cat.id}" style="background:${t.cardGrad};">
          <div style="font-size:3rem; filter:drop-shadow(0 4px 4px rgba(0,0,0,0.2));">${cat.icon}</div>
          <div style="font-size:1.12rem; font-weight:900; text-align:center;">${ui.escapeHtml(cat.name)}</div>
          <div style="background:rgba(255,255,255,0.28); border-radius:999px; padding:4px 12px; font-size:0.84rem; font-weight:900;">
            ⭐ ${starsInCat}/18 Bintang
          </div>
        </div>
      `;
    }).join("");

    ui.container.innerHTML = `
      <div class="ec-fullscreen">
        ${renderWorldBackgroundSVG("hub")}
        <div class="ec-world-layer">
          <div class="ec-top-hud">
            <div style="display:flex; gap:10px; flex-wrap:wrap; align-items:center;">
              <div class="ec-pill">${cleanGrade === "paud" ? "🧸 DUNIA PAUD" : "🎈 DUNIA TK"} • ${ui.escapeHtml(playerName)}</div>
              <div class="ec-pill">⭐ ${totalStars} Bintang</div>
              <div class="ec-pill">🪙 ${totalCoins} Koin</div>
            </div>
            <div style="display:flex; gap:10px;">
              <button id="btn-ec-back-grade" class="ec-btn-3d ec-btn-orange">⬅️ Pilih Kelas</button>
              <button id="btn-ec-back-menu" class="ec-btn-3d ec-btn-blue">🏠 Menu Utama</button>
            </div>
          </div>

          <div style="display:flex; align-items:center; justify-content:center; gap:16px; margin-bottom:10px;">
            ${renderMascotSVG(charId, "happy", 84)}
            <div class="ec-speech-bubble">
              Halo ${ui.escapeHtml(playerName)}! Pilih dunia petualangan yang ingin kamu jelajahi hari ini!
            </div>
          </div>

          <div style="flex:1; display:grid; grid-template-columns:repeat(3, minmax(220px, 1fr)); gap:16px; max-width:1080px; width:100%; margin:0 auto; align-content:center;">
            ${worldCardsHtml}
          </div>
        </div>
      </div>
    `;

    ui.container.querySelectorAll(".ec-cat-card").forEach((card) => {
      card.addEventListener("click", () => {
        earlyChildhoodAudio.play("click");
        this.showCategoryLevels(ui, cleanGrade, card.dataset.cat);
      });
    });

    document
      .getElementById("btn-ec-back-grade")
      .addEventListener("click", () => {
        earlyChildhoodAudio.play("click");
        ui.showGradeSelection();
      });
    document
      .getElementById("btn-ec-back-menu")
      .addEventListener("click", () => {
        earlyChildhoodAudio.play("click");
        ui.showMainMenu();
      });
  }

  async showCategoryLevels(ui, gradeKey, categoryId) {
    injectEarlyChildhoodStyles();
    this.stopActiveMiniGame();
    earlyChildhoodAudio.stopBgm();

    const cat =
      EARLY_CHILDHOOD_CATEGORIES.find((c) => c.id === categoryId) ||
      EARLY_CHILDHOOD_CATEGORIES[0];
    const theme = getWorldTheme(cat.id);
    if (ui.activeProfile) {
      ui.activeProfile = await db.getProfileById(ui.activeProfile.id);
    }
    const ecProgress = db.getEarlyChildhoodProgress(ui.activeProfile, gradeKey);
    const catProg = ecProgress?.categories?.[cat.id] || {
      unlockedLevel: 1,
      levelStars: {},
    };
    const charId = ui.activeProfile?.character || "kiko";

    const offsets = [26, -24, 22, -26, 20, -18];
    const nodesHtml = [1, 2, 3, 4, 5, 6]
      .map((lvl, idx) => {
        const unlocked = lvl <= (catProg.unlockedLevel || 1);
        const stars = catProg.levelStars?.[lvl] || 0;
        return `
        <div class="ec-level-node ec-lvl-card ${unlocked ? "unlocked" : "locked"}" data-lvl="${lvl}" data-unlocked="${unlocked}" style="transform:translateY(${offsets[idx]}px);">
          <div style="font-size:1.7rem;">${unlocked ? (stars > 0 ? "🏆" : "🎮") : "🔒"}</div>
          <div style="font-size:1.15rem;">Level ${lvl}</div>
          <div style="font-size:0.95rem;">${unlocked ? "⭐".repeat(stars) + "☆".repeat(3 - stars) : "Terkunci"}</div>
        </div>
      `;
      })
      .join("");

    ui.container.innerHTML = `
      <div class="ec-fullscreen">
        ${renderWorldBackgroundSVG(cat.id)}
        <div id="ec-map-bonus" class="ec-hidden-bonus" style="right:7%; bottom:14%;" title="Temukan kejutan!">${theme.bonusIcon}</div>
        <div class="ec-world-layer">
          <div class="ec-top-hud">
            <div class="ec-pill">${cat.icon} ${ui.escapeHtml(cat.name)} (${gradeKey.toUpperCase()})</div>
            <button id="btn-ec-back-cat" class="ec-btn-3d ec-btn-orange">⬅️ Pilih Dunia Lain</button>
          </div>

          <div style="display:flex; align-items:center; justify-content:center; gap:14px; margin-bottom:16px;">
            ${renderMascotSVG(charId, "idle", 88)}
            <div class="ec-speech-bubble" id="ec-map-msg">
              Ayo pilih Level petualanganmu! Setiap level ada 10 permainan seru!
            </div>
          </div>

          <div style="flex:1; display:flex; align-items:center; justify-content:center; gap:26px; flex-wrap:wrap; max-width:1120px; width:100%; margin:0 auto;">
            ${nodesHtml}
          </div>
        </div>
      </div>
    `;

    const bonusEl = document.getElementById("ec-map-bonus");
    if (bonusEl) {
      bonusEl.addEventListener("click", () => {
        earlyChildhoodAudio.play("reward");
        spawnConfettiBurst(16);
        const msg = document.getElementById("ec-map-msg");
        if (msg)
          msg.textContent = `Wah! Kamu menemukan ${theme.bonusLabel} tersembunyi! 🎉`;
        bonusEl.style.display = "none";
      });
    }

    ui.container.querySelectorAll(".ec-lvl-card").forEach((card) => {
      card.addEventListener("click", () => {
        if (card.dataset.unlocked !== "true") {
          earlyChildhoodAudio.play("wrong");
          earlyChildhoodAudio.speakGentleHint();
          return;
        }
        earlyChildhoodAudio.play("click");
        this.startLevelSession(ui, gradeKey, cat, Number(card.dataset.lvl));
      });
    });

    document.getElementById("btn-ec-back-cat").addEventListener("click", () => {
      earlyChildhoodAudio.play("click");
      this.showActivityHub(ui, gradeKey);
    });
  }

  startLevelSession(ui, gradeKey, categoryObj, levelNum) {
    injectEarlyChildhoodStyles();
    const activities = getEarlyChildhoodLevelActivities(
      gradeKey,
      categoryObj.id,
      levelNum,
    );
    const theme = getWorldTheme(categoryObj.id);
    const charId = ui.activeProfile?.character || "kiko";
    let currentIdx = 0;
    earlyChildhoodAudio.startBgm();

    const runStep = () => {
      this.stopActiveMiniGame();
      if (currentIdx >= activities.length) {
        earlyChildhoodAudio.stopBgm();
        this.finishLevelSession(ui, gradeKey, categoryObj, levelNum);
        return;
      }

      const act = activities[currentIdx];
      const dotsHtml = activities
        .map((_, idx) => {
          const cls =
            idx < currentIdx ? "done" : idx === currentIdx ? "current" : "";
          return `<div class="ec-progress-dot ${cls}"></div>`;
        })
        .join("");

      ui.container.innerHTML = `
        <div class="ec-fullscreen">
          ${renderWorldBackgroundSVG(categoryObj.id)}
          <div id="ec-stage-bonus" class="ec-hidden-bonus" style="left:2.5%; bottom:12%;" title="Kejutan!">${theme.bonusIcon}</div>

          <div class="ec-world-layer">
            <div class="ec-top-hud">
              <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
                <div class="ec-pill">${categoryObj.icon} Level ${levelNum}</div>
                <div class="ec-progress-track">${dotsHtml}</div>
              </div>
              <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
                <button id="btn-ec-repeat-voice" class="ec-btn-3d ec-btn-green" style="padding:8px 14px; font-size:0.88rem;">🔊 Ulangi</button>
                <button id="btn-ec-bgm" class="ec-btn-3d ec-btn-blue" style="padding:8px 12px; font-size:0.88rem;">${earlyChildhoodAudio.bgmEnabled ? "🎵 ON" : "🎵 OFF"}</button>
                <button id="btn-ec-mute" class="ec-btn-3d ec-btn-pink" style="padding:8px 12px; font-size:0.88rem;">${earlyChildhoodAudio.muted ? "🔇" : "🔊"}</button>
                <button id="btn-ec-exit-lvl" class="ec-btn-3d ec-btn-red" style="padding:8px 14px; font-size:0.88rem;">✖ Keluar</button>
              </div>
            </div>

            <div id="ec-stage-area" class="ec-play-stage"></div>

            <div class="ec-mascot-dock">
              <div id="ec-mascot-slot">${renderMascotSVG(charId, "idle", 78)}</div>
              <div id="ec-praise-text" class="ec-speech-bubble">${ui.escapeHtml(act.prompt)}</div>
            </div>
          </div>
        </div>
      `;

      const voiceText = act.voicePrompt || act.prompt;
      earlyChildhoodAudio.speak(voiceText, true);

      const bonusBtn = document.getElementById("ec-stage-bonus");
      if (bonusBtn) {
        bonusBtn.addEventListener("click", () => {
          earlyChildhoodAudio.play("reward");
          spawnConfettiBurst(12);
          bonusBtn.style.display = "none";
        });
      }

      document
        .getElementById("btn-ec-repeat-voice")
        .addEventListener("click", () => {
          earlyChildhoodAudio.play("click");
          earlyChildhoodAudio.repeatInstruction();
        });

      document.getElementById("btn-ec-bgm").addEventListener("click", (e) => {
        earlyChildhoodAudio.setBgmEnabled(!earlyChildhoodAudio.bgmEnabled);
        e.target.textContent = earlyChildhoodAudio.bgmEnabled
          ? "🎵 ON"
          : "🎵 OFF";
      });

      document.getElementById("btn-ec-mute").addEventListener("click", (e) => {
        earlyChildhoodAudio.setMuted(!earlyChildhoodAudio.muted);
        e.target.textContent = earlyChildhoodAudio.muted ? "🔇" : "🔊";
      });

      document
        .getElementById("btn-ec-exit-lvl")
        .addEventListener("click", () => {
          this.stopActiveMiniGame();
          earlyChildhoodAudio.stopBgm();
          this.showCategoryLevels(ui, gradeKey, categoryObj.id);
        });

      const stageEl = document.getElementById("ec-stage-area");
      const praiseTextEl = document.getElementById("ec-praise-text");
      const mascotSlot = document.getElementById("ec-mascot-slot");
      const runner = this.miniGameRegistry.get(act.type);

      const audioBridge = {
        play: (name) => {
          earlyChildhoodAudio.play(name);
          if (name === "wrong" && mascotSlot) {
            mascotSlot.innerHTML = renderMascotSVG(charId, "confused", 78);
            setTimeout(() => {
              if (mascotSlot)
                mascotSlot.innerHTML = renderMascotSVG(charId, "idle", 78);
            }, 900);
          }
        },
        speak: (txt, rem) => earlyChildhoodAudio.speak(txt, rem),
        speakGentleHint: () => earlyChildhoodAudio.speakGentleHint(),
      };

      if (runner) {
        this.activeCleanup = runner({
          container: stageEl,
          activity: act,
          gradeKey,
          charId,
          audio: audioBridge,
          onResult: (_ok, msg) => {
            const spokenPraise = earlyChildhoodAudio.speakPraise();
            spawnConfettiBurst(18);
            if (mascotSlot)
              mascotSlot.innerHTML = renderMascotSVG(charId, "happy", 78);
            if (praiseTextEl)
              praiseTextEl.textContent = `${spokenPraise} ${msg}`;
            setTimeout(() => {
              currentIdx += 1;
              runStep();
            }, 1200);
          },
        });
      }
    };

    runStep();
  }

  async finishLevelSession(ui, gradeKey, categoryObj, levelNum) {
    injectEarlyChildhoodStyles();
    earlyChildhoodAudio.play("level_win");
    earlyChildhoodAudio.speak(
      `Hebat sekali! Kamu menyelesaikan level ${levelNum}!`,
      false,
    );
    spawnConfettiBurst(34);

    const charId = ui.activeProfile?.character || "kiko";
    const coinsEarned = 30 + levelNum * 5;
    if (ui.activeProfile) {
      ui.activeProfile = await db.recordEarlyChildhoodLevelResult(
        ui.activeProfile.id,
        gradeKey,
        categoryObj.id,
        levelNum,
        { stars: 3, coins: coinsEarned },
      );
    }

    ui.container.innerHTML = `
      <div class="ec-fullscreen">
        ${renderWorldBackgroundSVG(categoryObj.id)}
        <div class="ec-world-layer" style="align-items:center; justify-content:center;">
          <div class="ec-play-stage" style="flex:0 1 auto; max-width:680px; flex-direction:column; gap:14px; padding:28px 34px; text-align:center;">
            <div class="ec-pill" style="background:linear-gradient(180deg,#ffeaa7,#fdcb6e); font-size:1.1rem;">
              🏆 LEVEL ${levelNum} SELESAI! 🏆
            </div>
            ${renderMascotSVG(charId, "celebrate", 136)}
            <div style="font-size:3rem; letter-spacing:8px;">⭐⭐⭐</div>
            <div style="font-size:1.35rem; font-weight:900; color:#2c3e50;">
              Hebat! Kamu mendapat +🪙 ${coinsEarned} Koin!
            </div>
            <div style="display:flex; gap:14px; flex-wrap:wrap; justify-content:center; margin-top:6px;">
              <button id="btn-ec-levels" class="ec-btn-3d ec-btn-green">🗺️ Peta Level</button>
              <button id="btn-ec-hub" class="ec-btn-3d ec-btn-blue">🌈 Pilih Dunia Lain</button>
            </div>
          </div>
        </div>
      </div>
    `;

    document.getElementById("btn-ec-levels").addEventListener("click", () => {
      earlyChildhoodAudio.play("click");
      this.showCategoryLevels(ui, gradeKey, categoryObj.id);
    });
    document.getElementById("btn-ec-hub").addEventListener("click", () => {
      earlyChildhoodAudio.play("click");
      this.showActivityHub(ui, gradeKey);
    });
  }
}

export const earlyChildhoodManager = new EarlyChildhoodAdventureManager();
