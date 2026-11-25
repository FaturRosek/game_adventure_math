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

  showTransientHint(text, duration = 2800) {
    uiManager.updateAdventureHUD({ hintText: text });
    if (this.hintTimer) this.hintTimer.remove(false);
    this.hintTimer = this.scene.time.delayedCall(duration, () => {
      uiManager.updateAdventureHUD({ hintText: "" });
    });
  }

  syncHUD(partial = {}) {
    uiManager.updateAdventureHUD(partial);
  }

  setKeyboardCapture(enabled) {
    const kb = this.scene?.input?.keyboard;
    if (!kb) return;
    kb.enabled = enabled;
    if (enabled) kb.enableGlobalCapture();
    else kb.disableGlobalCapture();
    kb.resetKeys();
  }

  triggerEducationChallenge({
    sourceType = "quiz_box",
    title = "Tantangan Pengetahuan",
    topic = null,
    forceDifficulty = null,
    onResolved = null,
  } = {}) {
    const sc = this.scene;
    if (sc.isQuizOpen || sc.levelCompleted || sc.isGameOver) return false;

    sc.isQuizOpen = true;
    if (sc.player?.body) sc.player.setVelocity(0, 0);
    if (sc.physics) sc.physics.pause();
    this.setKeyboardCapture(false);
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
      allowMultiType: true,
      questionIndex: sc.questionsAnswered || 0,
      totalQuestions: sc.totalChallenges || 5,
    });

    if (qData.error) {
      if (sc.physics) sc.physics.resume();
      this.setKeyboardCapture(true);
      if (this.missionState) this.missionState.resumeTimer();
      sc.isQuizOpen = false;
      this.showTransientHint(qData.message || "Stok soal tidak mencukupi.");
      return false;
    }

    uiManager.showQuestionModal({
      questionData: qData,
      triggerTitle: title,
      onComplete: async (isCorrect, chosenAnswer, meta = {}) => {
        if (sc.physics) sc.physics.resume();
        this.setKeyboardCapture(true);
        if (this.missionState) this.missionState.resumeTimer();
        sc.isQuizOpen = false;

        sc.questionsAnswered = (sc.questionsAnswered || 0) + 1;
        sc.answerHistory = sc.answerHistory || [];
        sc.answerHistory.push({
          questionId: qData.id,
          questionType: qData.questionType || "multiple_choice",
          cluesUsed: meta?.cluesUsed || 0,
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

  completeLevel({ bonusCoins = 35, collectibleLabel = "" } = {}) {
    const sc = this.scene;
    if (sc.levelCompleted || sc.isGameOver) return;
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
      badgeEarned: acc >= 0.8 ? `Penjelajah ${modeLabel} ${subjLabel}` : "",
      collectibleItem: collectibleLabel,
      answerHistory: sc.answerHistory || [],
    });
  }

  failLevel({
    reason = "Daya napas habis sebelum misi selesai.",
    theme = "ocean",
  } = {}) {
    const sc = this.scene;
    if (sc.levelCompleted || sc.isGameOver) return;

    sc.isGameOver = true;
    sc.isQuizOpen = false;
    if (sc.player?.body) sc.player.setVelocity(0, 0);
    if (sc.physics) sc.physics.pause();
    if (this.missionState) this.missionState.pauseTimer();

    if (sc.touchState) {
      Object.keys(sc.touchState).forEach((k) => {
        sc.touchState[k] = false;
      });
    }
    this.setKeyboardCapture(false);

    if (sc.activeCharId && sc.anims.exists(`${sc.activeCharId}_hurt`)) {
      sc.player.play(`${sc.activeCharId}_hurt`, true);
    }

    const total = Math.max(1, sc.totalChallenges || 1);
    const answered = Math.min(total, sc.questionsAnswered || 0);
    const remaining = Math.max(0, total - answered);

    uiManager.showAdventureGameOver({
      levelKey: this.levelKey,
      modeLabel: this.modeConfig?.modeLabel || "Ocean Explorer",
      subjectName: this.getSubjectLabel(),
      answeredCount: answered,
      remainingCount: remaining,
      totalChallenges: total,
      correctCount: sc.correctAnswers || 0,
      reason,
      theme,
    });
  }
}
