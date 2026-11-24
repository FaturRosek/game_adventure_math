import { questionManager } from "../QuestionManager.js";
import { uiManager } from "../UIManager.js";
import { db } from "../../storage/db.js";
import { GAME_CONFIG } from "../../config/gameConfig.js";

export class AdventureSessionBridge {
  constructor(scene, config = {}) {
    this.scene = scene;
    this.profile = config.profile || uiManager.activeProfile || null;
    this.grade = Number(config.grade) || Number(this.profile?.grade) || 3;
    this.subject = config.subject || "matematika";
    this.levelKey = config.levelKey || "easy";
    this.modeConfig = config.modeConfig;
    this.missionState = config.missionState || null;
    this.hintTimer = null;
  }

  getSubjectLabel() {
    const info = GAME_CONFIG.subjects.find((s) => s.id === this.subject);
    return info ? info.name : String(this.subject).toUpperCase();
  }

  showTransientHint(text, duration = 2600) {
    uiManager.updateAdventureHUD({ hintText: text });
    if (this.hintTimer) this.hintTimer.remove(false);
    this.hintTimer = this.scene.time.delayedCall(duration, () => {
      uiManager.updateAdventureHUD({ hintText: "" });
    });
  }

  syncHUD(partial = {}) {
    uiManager.updateAdventureHUD(partial);
  }

  triggerEducationChallenge({
    sourceType = "world_object",
    title = "Tantangan Belajar",
    topic = null,
    forceDifficulty = null,
    onResolved = null,
  } = {}) {
    const sc = this.scene;
    if (sc.isQuizOpen || sc.levelCompleted) return false;

    sc.isQuizOpen = true;
    if (sc.player?.body) sc.player.setVelocity(0, 0);
    if (sc.physics) sc.physics.pause();
    if (this.missionState) this.missionState.pauseTimer();
    if (sc.touchState) {
      Object.keys(sc.touchState).forEach((k) => {
        sc.touchState[k] = false;
      });
    }

    const resolvedDiff =
      forceDifficulty ||
      (this.levelKey === "hard"
        ? "sulit"
        : this.levelKey === "medium"
          ? "sedang"
          : "mudah");

    const qData = questionManager.getNextQuestion(this.subject, topic, {
      grade: this.grade,
      profile: uiManager.activeProfile || this.profile,
      settings: uiManager.settings,
      forceDifficulty: resolvedDiff,
    });

    if (qData.error) {
      if (sc.physics) sc.physics.resume();
      if (this.missionState) this.missionState.resumeTimer();
      sc.isQuizOpen = false;
      this.showTransientHint(qData.message || "Stok soal tidak mencukupi.");
      return false;
    }

    uiManager.showQuestionModal({
      questionData: qData,
      triggerTitle: title,
      onComplete: async (isCorrect, chosenAnswer) => {
        if (sc.physics) sc.physics.resume();
        if (this.missionState) this.missionState.resumeTimer();
        sc.isQuizOpen = false;

        sc.questionsAnswered = (sc.questionsAnswered || 0) + 1;
        sc.answerHistory = sc.answerHistory || [];
        sc.answerHistory.push({
          questionId: qData.id,
          topic: qData.topic,
          difficulty: qData.difficulty,
          sourceType: qData.sourceType || "question_bank",
          triggerSource: sourceType,
          chosenAnswer: chosenAnswer || "",
          correctAnswer: qData.correctAnswer,
          isCorrect,
        });

        if (uiManager.activeProfile) {
          uiManager.activeProfile = await db.recordQuestionAttempt(
            uiManager.activeProfile.id,
            {
              questionId: qData.id,
              subject: this.subject,
              topic: qData.topic,
              difficulty: qData.difficulty,
              sourceType: qData.sourceType,
              isCorrect,
              mode: "adventure",
            },
            uiManager.settings,
          );
          this.profile = uiManager.activeProfile;
          sc.profile = uiManager.activeProfile;
        }

        if (isCorrect) {
          sc.correctAnswers = (sc.correctAnswers || 0) + 1;
          sc.coinsCollected = (sc.coinsCollected || 0) + 25;
          if (
            sc.controller?.gainEnergy &&
            this.modeConfig?.energy?.gainOnCorrectAnswer
          ) {
            sc.controller.gainEnergy(
              this.modeConfig.energy.gainOnCorrectAnswer,
            );
          }
        } else {
          sc.wrongAnswers = (sc.wrongAnswers || 0) + 1;
        }

        if (this.missionState) {
          this.missionState.updateProgressByType("quiz", 1);
        }

        uiManager.updateAdventureHUD({
          coins: sc.coinsCollected || 0,
          answeredCount: sc.questionsAnswered,
          totalChallenges: sc.totalChallenges,
        });

        if (typeof onResolved === "function") {
          onResolved({ isCorrect, chosenAnswer, questionData: qData });
        }
      },
    });

    return true;
  }

  completeLevel({ bonusCoins = 30, collectibleLabel = "" } = {}) {
    const sc = this.scene;
    if (sc.levelCompleted) return;
    sc.levelCompleted = true;
    if (sc.physics) sc.physics.pause();
    if (this.missionState) this.missionState.pauseTimer();

    sc.coinsCollected = (sc.coinsCollected || 0) + bonusCoins;

    if (sc.activeCharId && sc.anims.exists(`${sc.activeCharId}_victory`)) {
      sc.player.play(`${sc.activeCharId}_victory`, true);
    }

    const total = Math.max(1, sc.totalChallenges || 1);
    const acc = (sc.correctAnswers || 0) / total;
    const stars = acc >= 0.9 ? 3 : acc >= 0.8 ? 2 : 1;
    const subjLabel = this.getSubjectLabel();
    const modeLabel = this.modeConfig?.modeLabel || this.levelKey.toUpperCase();

    uiManager.showAdventureResult({
      levelId: `${this.subject}_g${this.grade}_${this.levelKey}`,
      levelKey: this.levelKey,
      grade: this.grade,
      levelTitle: `${modeLabel} — ${subjLabel}`,
      subject: this.subject,
      coinsEarned: sc.coinsCollected,
      correctCount: sc.correctAnswers || 0,
      wrongCount: sc.wrongAnswers || 0,
      starsEarned: stars,
      badgeEarned: acc >= 0.8 ? `Juara ${modeLabel} ${subjLabel}` : "",
      collectibleItem: collectibleLabel,
      answerHistory: sc.answerHistory || [],
    });
  }
}
