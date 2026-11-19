import { GAME_CONFIG } from "../config/gameConfig.js";
import { calculateBattleLevel } from "../data/battleArenaCatalog.js";

const DB_NAME = "PetualanganDuniaPintarDB";
const DB_VERSION = 2;
const STORE_PROFILES = "profiles";
const STORE_SETTINGS = "settings";
const STORE_CUSTOM_QUESTIONS = "custom_questions";
const ACTIVE_PROFILE_KEY = "pdp_active_profile_id";

class LocalDatabase {
  constructor() {
    this.db = null;
    this.useFallback = false;
    this.memoryFallback = {
      profiles: new Map(),
      settings: new Map(),
      custom_questions: new Map(),
    };
  }

  async init() {
    if (this.db || this.useFallback) return this.db;

    if (typeof indexedDB === "undefined") {
      console.warn(
        "IndexedDB tidak tersedia, menggunakan fallback penyimpanan lokal.",
      );
      this.useFallback = true;
      return null;
    }

    return new Promise((resolve) => {
      try {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
          const db = event.target.result;

          if (!db.objectStoreNames.contains(STORE_PROFILES)) {
            const profileStore = db.createObjectStore(STORE_PROFILES, {
              keyPath: "id",
            });
            profileStore.createIndex("name", "name", { unique: false });
          }

          if (!db.objectStoreNames.contains(STORE_SETTINGS)) {
            db.createObjectStore(STORE_SETTINGS, { keyPath: "key" });
          }

          if (!db.objectStoreNames.contains(STORE_CUSTOM_QUESTIONS)) {
            db.createObjectStore(STORE_CUSTOM_QUESTIONS, { keyPath: "id" });
          }
        };

        request.onsuccess = (event) => {
          this.db = event.target.result;
          resolve(this.db);
        };

        request.onerror = (event) => {
          console.warn(
            "Gagal membuka IndexedDB, beralih ke mode fallback:",
            event.target.error,
          );
          this.useFallback = true;
          resolve(null);
        };
      } catch (err) {
        console.warn(
          "Exception saat inisialisasi IndexedDB, menggunakan fallback:",
          err,
        );
        this.useFallback = true;
        resolve(null);
      }
    });
  }

  normalizeProfileGrade(grade = 3) {
    const raw = String(grade ?? 3).trim().toLowerCase();
    if (raw === 'paud' || raw === 'tk') return raw;
    const num = Number(grade);
    return Number.isFinite(num) && num >= 1 && num <= 6 ? num : 3;
  }

  getScopedSubjectKey(subjectId = "matematika", grade = 3) {
    const cleanSubj = String(subjectId || "matematika")
      .toLowerCase()
      .replace(/^g\d+_/, "");
    const numGrade = Number(grade) || 3;
    return numGrade === 3 ? cleanSubj : `g${numGrade}_${cleanSubj}`;
  }

  createDefaultSubjectAdventureProgress(studentId, subjectId, grade = 3) {
    return {
      studentId,
      subjectId,
      grade: Number(grade) || 3,
      mode: "adventure",
      levels: {
        easy: {
          levelId: "easy",
          difficulty: "mudah",
          unlocked: true,
          completed: false,
          playCount: 0,
          totalQuestions: 5,
          questionsAnswered: 0,
          correctAnswers: 0,
          wrongAnswers: 0,
          accuracy: 0,
          bestAccuracy: 0,
          lastPlayedAt: null,
        },
        medium: {
          levelId: "medium",
          difficulty: "sedang",
          unlocked: false,
          completed: false,
          playCount: 0,
          totalQuestions: 7,
          questionsAnswered: 0,
          correctAnswers: 0,
          wrongAnswers: 0,
          accuracy: 0,
          bestAccuracy: 0,
          lastPlayedAt: null,
        },
        hard: {
          levelId: "hard",
          difficulty: "sulit",
          unlocked: false,
          completed: false,
          playCount: 0,
          totalQuestions: 10,
          questionsAnswered: 0,
          correctAnswers: 0,
          wrongAnswers: 0,
          accuracy: 0,
          bestAccuracy: 0,
          lastPlayedAt: null,
        },
      },
    };
  }

  ensureProfileAnalyticsStructure(profile) {
    if (!profile) return null;
    profile.grade = this.normalizeProfileGrade(profile.grade);
    profile.coins = profile.coins || 0;
    profile.stars = profile.stars || 0;
    profile.totalScore = profile.totalScore || 0;
    profile.badges = profile.badges || [];
    profile.collectibles = profile.collectibles || [];
    profile.completedLevels = profile.completedLevels || [];
    profile.adventureHistory = profile.adventureHistory || [];
    profile.duelHistory = profile.duelHistory || [];
    profile.battleArenaHistory = profile.battleArenaHistory || [];
    profile.battleArenaProgress = this.ensureBattleArenaProgress(
      profile.battleArenaProgress,
      profile.character,
    );
    profile.earlyChildhoodProgress = profile.earlyChildhoodProgress || {};
    ['paud', 'tk'].forEach((ecKey) => {
      if (!profile.earlyChildhoodProgress[ecKey]) {
        profile.earlyChildhoodProgress[ecKey] = {
          grade: ecKey,
          totalStars: 0,
          completedActivities: {},
          history: []
        };
      }
    });

    profile.totalQuestionsAnswered = profile.totalQuestionsAnswered || 0;
    profile.totalCorrect = profile.totalCorrect || 0;
    profile.totalWrong = profile.totalWrong || 0;
    profile.subjectPerformance = profile.subjectPerformance || {};
    profile.topicPerformance = profile.topicPerformance || {};
    profile.questionHistory = profile.questionHistory || [];
    profile.adaptiveChanges = profile.adaptiveChanges || [];
    profile.topicsToReview = profile.topicsToReview || [];
    profile.adventureProgress = profile.adventureProgress || {};

    const activeGrades = GAME_CONFIG.classes
      .filter((c) => c.active && typeof c.grade === 'number')
      .map((c) => c.grade);
    activeGrades.forEach((g) => {
      GAME_CONFIG.subjects.forEach((sub) => {
        if (
          Array.isArray(sub.allowedGrades) &&
          !sub.allowedGrades.includes(g)
        ) {
          return;
        }
        const scopedKey = this.getScopedSubjectKey(sub.id, g);
        if (!profile.subjectPerformance[scopedKey]) {
          profile.subjectPerformance[scopedKey] = {
            grade: g,
            subject: sub.id,
            answered: 0,
            correct: 0,
            wrong: 0,
          };
        }
        if (
          !profile.adventureProgress[scopedKey] ||
          !profile.adventureProgress[scopedKey].levels
        ) {
          profile.adventureProgress[scopedKey] =
            this.createDefaultSubjectAdventureProgress(profile.id, sub.id, g);
        } else {
          const def = this.createDefaultSubjectAdventureProgress(
            profile.id,
            sub.id,
            g,
          );
          ["easy", "medium", "hard"].forEach((lvlKey) => {
            profile.adventureProgress[scopedKey].levels[lvlKey] = {
              ...def.levels[lvlKey],
              ...(profile.adventureProgress[scopedKey].levels[lvlKey] || {}),
            };
          });
          profile.adventureProgress[scopedKey].levels.easy.unlocked = true;
          if (profile.adventureProgress[scopedKey].levels.easy.completed) {
            profile.adventureProgress[scopedKey].levels.medium.unlocked = true;
          }
          if (profile.adventureProgress[scopedKey].levels.medium.completed) {
            profile.adventureProgress[scopedKey].levels.hard.unlocked = true;
          }
        }
      });
    });

    return profile;
  }

  getSubjectAdventureProgress(profile, subjectId, grade = null) {
    if (!profile) return null;
    this.ensureProfileAnalyticsStructure(profile);
    const targetGrade = Number(grade) || Number(profile.grade) || 3;
    const scopedKey = this.getScopedSubjectKey(subjectId, targetGrade);
    if (!profile.adventureProgress[scopedKey]) {
      profile.adventureProgress[scopedKey] =
        this.createDefaultSubjectAdventureProgress(
          profile.id,
          subjectId,
          targetGrade,
        );
    }
    return profile.adventureProgress[scopedKey];
  }

  getEarlyChildhoodProgress(profile, gradeKey = 'paud') {
    if (!profile) return null;
    this.ensureProfileAnalyticsStructure(profile);
    const key = String(gradeKey).toLowerCase() === 'tk' ? 'tk' : 'paud';
    return profile.earlyChildhoodProgress[key];
  }

  async recordEarlyChildhoodActivity(profileId, gradeKey, activityId, result = {}) {
    const profile = await this.getProfileById(profileId);
    if (!profile) return null;

    const key = String(gradeKey).toLowerCase() === 'tk' ? 'tk' : 'paud';
    const ecProg = this.getEarlyChildhoodProgress(profile, key);
    const earnedStars = Math.max(0, Math.min(3, Number(result.stars) || 0));
    const prev = ecProg.completedActivities[activityId] || { completed: false, stars: 0, playCount: 0 };

    ecProg.completedActivities[activityId] = {
      activityId,
      completed: Boolean(result.completed || prev.completed),
      stars: Math.max(prev.stars || 0, earnedStars),
      playCount: (prev.playCount || 0) + 1,
      lastPlayedAt: Date.now()
    };

    ecProg.totalStars = Object.values(ecProg.completedActivities).reduce(
      (sum, item) => sum + (item.stars || 0),
      0
    );

    ecProg.history.push({
      id: 'ec_' + Date.now(),
      activityId,
      stars: earnedStars,
      score: Number(result.score) || 0,
      playedAt: Date.now()
    });
    if (ecProg.history.length > 60) {
      ecProg.history = ecProg.history.slice(-60);
    }

    await this.saveProfile(profile);
    return profile;
  }

  async recordEarlyChildhoodLevelResult(profileId, gradeKey, categoryId, levelNum, { stars = 3, coins = 30 } = {}) {
    const profile = await this.getProfileById(profileId);
    if (!profile) return null;

    const key = String(gradeKey).toLowerCase() === 'tk' ? 'tk' : 'paud';
    const ecProg = this.getEarlyChildhoodProgress(profile, key);
    ecProg.categories = ecProg.categories || {};
    ecProg.coins = (ecProg.coins || 0) + coins;

    if (!ecProg.categories[categoryId]) {
      ecProg.categories[categoryId] = { unlockedLevel: 1, levelStars: {} };
    }

    const catProg = ecProg.categories[categoryId];
    const prevStars = catProg.levelStars[levelNum] || 0;
    catProg.levelStars[levelNum] = Math.max(prevStars, stars);

    if (levelNum < 6 && (catProg.unlockedLevel || 1) <= levelNum) {
      catProg.unlockedLevel = levelNum + 1;
    }

    let sumStars = 0;
    Object.values(ecProg.categories).forEach((c) => {
      Object.values(c.levelStars || {}).forEach((st) => {
        sumStars += st;
      });
    });
    ecProg.totalStars = sumStars;

    await this.saveProfile(profile);
    return profile;
  }

  async getAllProfiles() {
    await this.init();
    if (this.useFallback) {
      const list = Array.from(this.memoryFallback.profiles.values()).map((p) =>
        this.ensureProfileAnalyticsStructure(p),
      );
      return list.sort((a, b) => b.createdAt - a.createdAt);
    }

    return new Promise((resolve) => {
      try {
        const tx = this.db.transaction(STORE_PROFILES, "readonly");
        const store = tx.objectStore(STORE_PROFILES);
        const request = store.getAll();

        request.onsuccess = () => {
          const list = (request.result || []).map((p) =>
            this.ensureProfileAnalyticsStructure(p),
          );
          list.sort((a, b) => b.createdAt - a.createdAt);
          resolve(list);
        };
        request.onerror = () => resolve([]);
      } catch (e) {
        resolve([]);
      }
    });
  }

  async getProfileById(id) {
    if (!id) return null;
    await this.init();
    if (this.useFallback) {
      const found = this.memoryFallback.profiles.get(id) || null;
      return this.ensureProfileAnalyticsStructure(found);
    }

    return new Promise((resolve) => {
      try {
        const tx = this.db.transaction(STORE_PROFILES, "readonly");
        const store = tx.objectStore(STORE_PROFILES);
        const request = store.get(id);

        request.onsuccess = () =>
          resolve(this.ensureProfileAnalyticsStructure(request.result || null));
        request.onerror = () => resolve(null);
      } catch (e) {
        resolve(null);
      }
    });
  }

  async createProfile({ name, grade = 3, character = "kiko" }) {
    await this.init();
    const newId =
      "prof_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7);
    const newProfile = this.ensureProfileAnalyticsStructure({
      id: newId,
      name: name.trim(),
      grade: this.normalizeProfileGrade(grade),
      character,
      coins: 0,
      stars: 0,
      totalScore: 0,
      badges: [],
      collectibles: [],
      completedLevels: [],
      adventureHistory: [],
      duelHistory: [],
      totalQuestionsAnswered: 0,
      totalCorrect: 0,
      totalWrong: 0,
      subjectPerformance: {},
      topicPerformance: {},
      questionHistory: [],
      adaptiveChanges: [],
      topicsToReview: [],
      adventureProgress: {},
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    await this.saveProfile(newProfile);
    this.setActiveProfileId(newProfile.id);
    return newProfile;
  }

  async saveProfile(profileData) {
    await this.init();
    this.ensureProfileAnalyticsStructure(profileData);
    profileData.updatedAt = Date.now();

    if (this.useFallback) {
      this.memoryFallback.profiles.set(profileData.id, { ...profileData });
      return profileData;
    }

    return new Promise((resolve, reject) => {
      try {
        const tx = this.db.transaction(STORE_PROFILES, "readwrite");
        const store = tx.objectStore(STORE_PROFILES);
        const request = store.put(profileData);

        request.onsuccess = () => resolve(profileData);
        request.onerror = () => reject(request.error);
      } catch (e) {
        this.memoryFallback.profiles.set(profileData.id, { ...profileData });
        resolve(profileData);
      }
    });
  }

  async recordQuestionAttempt(profileId, attemptData, settings = null) {
    const profile = await this.getProfileById(profileId);
    if (!profile) return null;

    const currentSettings = settings || (await this.getSettings());
    const targetGrade = Number(attemptData.grade) || Number(profile.grade) || 3;
    const cleanSubj = String(attemptData.subject || "matematika")
      .toLowerCase()
      .replace(/^g\d+_/, "");
    const scopedSubjKey = this.getScopedSubjectKey(cleanSubj, targetGrade);
    const topicName = attemptData.topic || "Umum";
    const topicKey = `${scopedSubjKey}:${topicName}`;
    const isCorrect = Boolean(attemptData.isCorrect);
    const difficultyUsed = String(
      attemptData.difficulty || "mudah",
    ).toLowerCase();

    profile.totalQuestionsAnswered += 1;
    if (isCorrect) profile.totalCorrect += 1;
    else profile.totalWrong += 1;

    if (!profile.subjectPerformance[scopedSubjKey]) {
      profile.subjectPerformance[scopedSubjKey] = {
        grade: targetGrade,
        subject: cleanSubj,
        answered: 0,
        correct: 0,
        wrong: 0,
      };
    }
    profile.subjectPerformance[scopedSubjKey].answered += 1;
    if (isCorrect) profile.subjectPerformance[scopedSubjKey].correct += 1;
    else profile.subjectPerformance[scopedSubjKey].wrong += 1;

    if (!profile.topicPerformance[topicKey]) {
      profile.topicPerformance[topicKey] = {
        grade: targetGrade,
        subject: cleanSubj,
        scopedSubject: scopedSubjKey,
        topic: topicName,
        answered: 0,
        correct: 0,
        wrong: 0,
        recentResults: [],
        currentDifficulty: currentSettings.initialAdaptiveDifficulty || "mudah",
        needsReview: false,
        lastPlayedAt: Date.now(),
      };
    }

    const tPerf = profile.topicPerformance[topicKey];
    tPerf.answered += 1;
    if (isCorrect) tPerf.correct += 1;
    else tPerf.wrong += 1;
    tPerf.lastPlayedAt = Date.now();

    tPerf.recentResults.push(isCorrect);
    if (tPerf.recentResults.length > 10) {
      tPerf.recentResults = tPerf.recentResults.slice(-10);
    }

    const order = ["mudah", "sedang", "sulit"];
    const bound = currentSettings.adaptiveBounds || "mudah-sulit";
    const allowed =
      bound === "mudah-sedang"
        ? ["mudah", "sedang"]
        : bound === "sedang-sulit"
          ? ["sedang", "sulit"]
          : ["mudah", "sedang", "sulit"];

    let oldDiff = tPerf.currentDifficulty || "mudah";
    if (!allowed.includes(oldDiff)) oldDiff = allowed[0];

    if (tPerf.recentResults.length >= 5) {
      const last5 = tPerf.recentResults.slice(-5);
      const correct5 = last5.filter(Boolean).length;
      const acc5 = Math.round((correct5 / 5) * 100);
      const idx = order.indexOf(oldDiff);

      let nextDiff = oldDiff;
      if (acc5 >= 80 && idx < order.length - 1) {
        nextDiff = order[idx + 1];
        tPerf.needsReview = false;
      } else if (acc5 < 40 && idx > 0) {
        nextDiff = order[idx - 1];
        tPerf.needsReview = true;
      } else if (acc5 < 40) {
        tPerf.needsReview = true;
      } else if (acc5 >= 60) {
        tPerf.needsReview = false;
      }

      if (!allowed.includes(nextDiff)) {
        nextDiff = oldDiff;
      }

      if (nextDiff !== oldDiff) {
        tPerf.currentDifficulty = nextDiff;
        profile.adaptiveChanges.push({
          topicKey,
          grade: targetGrade,
          subject: cleanSubj,
          topic: topicName,
          fromDifficulty: oldDiff,
          toDifficulty: nextDiff,
          accuracy5: acc5,
          changedAt: Date.now(),
        });
        tPerf.recentResults = [];
      } else {
        tPerf.currentDifficulty = oldDiff;
      }
    } else if (!isCorrect && tPerf.wrong > tPerf.correct) {
      tPerf.needsReview = true;
    }

    profile.topicsToReview = Object.values(profile.topicPerformance)
      .filter((tp) => tp.needsReview || tp.wrong > tp.correct)
      .map(
        (tp) =>
          `[Kls ${tp.grade || 3}] ${tp.subject.toUpperCase()}: ${tp.topic}`,
      );

    profile.questionHistory.push({
      questionId: attemptData.questionId,
      grade: targetGrade,
      subject: cleanSubj,
      topic: topicName,
      difficulty: difficultyUsed,
      sourceType: attemptData.sourceType || "question_bank",
      isCorrect,
      mode: attemptData.mode || "adventure",
      answeredAt: Date.now(),
    });
    if (profile.questionHistory.length > 120) {
      profile.questionHistory = profile.questionHistory.slice(-120);
    }

    await this.saveProfile(profile);
    return profile;
  }

  async saveIncompleteAdventureSession(
    profileId,
    subjectId,
    sessionSnapshot,
    grade = null,
  ) {
    const profile = await this.getProfileById(profileId);
    if (!profile) return null;

    const targetGrade =
      Number(grade) ||
      Number(sessionSnapshot?.grade) ||
      Number(profile.grade) ||
      3;
    const subjProg = this.getSubjectAdventureProgress(
      profile,
      subjectId,
      targetGrade,
    );
    subjProg.incompleteSession = {
      ...sessionSnapshot,
      grade: targetGrade,
      savedAt: Date.now(),
    };

    await this.saveProfile(profile);
    return profile;
  }

  async recordAdventureResult(profileId, result) {
    const profile = await this.getProfileById(profileId);
    if (!profile) return null;

    const targetGrade = Number(result.grade) || Number(profile.grade) || 3;
    const subjKey = String(result.subject || "matematika")
      .toLowerCase()
      .replace(/^g\d+_/, "");
    const scopedSubjKey = this.getScopedSubjectKey(subjKey, targetGrade);
    const levelKey = result.levelKey || "easy";
    const requiredCount =
      levelKey === "easy" ? 5 : levelKey === "medium" ? 7 : 10;

    const minCorrectRequired = Math.ceil(requiredCount * 0.8);
    const correctCount = result.correctCount || 0;
    const wrongCount = result.wrongCount || 0;
    const totalAnswered = correctCount + wrongCount;

    const isFullyAnswered = totalAnswered >= requiredCount;
    const isPassed = isFullyAnswered && correctCount >= minCorrectRequired;

    const scoreEarned = correctCount * 100 + (result.coinsEarned || 0) * 2;
    profile.coins = (profile.coins || 0) + (result.coinsEarned || 0);
    profile.stars =
      (profile.stars || 0) + (isPassed ? result.starsEarned || 0 : 0);
    profile.totalScore = (profile.totalScore || 0) + scoreEarned;

    const uniqueLevelId = `${scopedSubjKey}_${levelKey}`;
    if (isPassed && !profile.completedLevels.includes(uniqueLevelId)) {
      profile.completedLevels.push(uniqueLevelId);
    }

    if (
      isPassed &&
      result.badgeEarned &&
      !profile.badges.includes(result.badgeEarned)
    ) {
      profile.badges.push(result.badgeEarned);
    }

    if (
      isPassed &&
      result.collectibleItem &&
      !profile.collectibles.includes(result.collectibleItem)
    ) {
      profile.collectibles.push(result.collectibleItem);
    }

    const subjProg = this.getSubjectAdventureProgress(
      profile,
      subjKey,
      targetGrade,
    );
    const lvlRecord = subjProg.levels[levelKey];

    if (lvlRecord && isFullyAnswered) {
      const acc = Math.round((correctCount / requiredCount) * 100);
      lvlRecord.unlocked = true;
      lvlRecord.playCount = (lvlRecord.playCount || 0) + 1;
      lvlRecord.totalQuestions = requiredCount;
      lvlRecord.questionsAnswered = requiredCount;
      lvlRecord.correctAnswers = correctCount;
      lvlRecord.wrongAnswers = wrongCount;
      lvlRecord.accuracy = acc;
      lvlRecord.bestAccuracy = Math.max(lvlRecord.bestAccuracy || 0, acc);
      lvlRecord.lastPlayedAt = Date.now();

      if (isPassed) {
        lvlRecord.completed = true;
        if (levelKey === "easy") {
          subjProg.levels.medium.unlocked = true;
        } else if (levelKey === "medium") {
          subjProg.levels.hard.unlocked = true;
        }
      }

      if (
        subjProg.incompleteSession &&
        subjProg.incompleteSession.levelKey === levelKey
      ) {
        subjProg.incompleteSession = null;
      }
    }

    profile.adventureHistory.push({
      id:
        "adv_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6),
      levelId: uniqueLevelId,
      levelKey,
      difficulty: result.difficulty || lvlRecord?.difficulty || "mudah",
      levelTitle: result.levelTitle || uniqueLevelId,
      subject: subjKey,
      totalQuestions: requiredCount,
      questionsAnswered: totalAnswered,
      passed: isPassed,
      minCorrectRequired,
      coinsEarned: result.coinsEarned || 0,
      scoreEarned,
      correctCount,
      wrongCount,
      accuracy:
        requiredCount > 0
          ? Math.round((correctCount / requiredCount) * 100)
          : 0,
      durationSec: Number(result.durationSec) || 0,
      starsEarned: isPassed ? result.starsEarned || 1 : 0,
      badgeEarned: isPassed ? result.badgeEarned || "" : "",
      collectibleItem: isPassed ? result.collectibleItem || "" : "",
      answerHistory: result.answerHistory || [],
      playedAt: Date.now(),
    });

    await this.saveProfile(profile);
    return profile;
  }

  async recordDuelResult(profileId, duelSummary) {
    const profile = await this.getProfileById(profileId);
    if (!profile) return null;

    const bonusCoins = (duelSummary.studentStats?.correct || 0) * 15 + 10;
    const bonusStars = duelSummary.winner === "student" ? 2 : 1;
    const scoreEarned = (duelSummary.studentStats?.correct || 0) * 100;

    profile.coins = (profile.coins || 0) + bonusCoins;
    profile.stars = (profile.stars || 0) + bonusStars;
    profile.totalScore = (profile.totalScore || 0) + scoreEarned;

    if (
      duelSummary.badgeEarned &&
      !profile.badges.includes(duelSummary.badgeEarned)
    ) {
      profile.badges.push(duelSummary.badgeEarned);
    }

    profile.duelHistory.push({
      matchId:
        "duel_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6),
      profileId: profile.id,
      studentName: profile.name,
      subject: duelSummary.subject,
      topic: duelSummary.topic,
      difficulty: duelSummary.difficulty,
      difficultyMode: duelSummary.difficultyMode || "adaptif",
      totalRounds: duelSummary.totalRounds,
      winner: duelSummary.winner,
      studentStats: duelSummary.studentStats,
      tutorStats: duelSummary.tutorStats,
      answerLog: duelSummary.answerLog || [],
      masteredTopics: duelSummary.masteredTopics || [],
      reviewTopics: duelSummary.reviewTopics || [],
      playedAt: Date.now(),
    });

    await this.saveProfile(profile);
    return profile;
  }

  ensureBattleArenaProgress(existing = null, defaultChar = "kiko") {
    const base = {
      coins: 0,
      xp: 0,
      level: 1,
      selectedTutorChar: "prof_panda",
      selectedStudentChar: defaultChar || "kiko",
      unlockedCharacters: ["kiko", "bobi", "cici", "prof_panda"],
      unlockedCostumes: ["default"],
      unlockedAccessories: ["none"],
      unlockedAttackEffects: ["default"],
      unlockedVictoryEffects: ["confetti"],
      equipped: {
        costume: "default",
        accessory: "none",
        attackEffect: "default",
        victoryEffect: "confetti",
      },
      stats: {
        matches: 0,
        wins: 0,
        losses: 0,
        draws: 0,
        totalQuestions: 0,
        totalCorrect: 0,
        highestCombo: 0,
      },
      achievements: [],
      claimedMatchIds: [],
    };

    if (!existing || typeof existing !== "object") return base;

    const merged = {
      ...base,
      ...existing,
      equipped: { ...base.equipped, ...(existing.equipped || {}) },
      stats: { ...base.stats, ...(existing.stats || {}) },
      unlockedCharacters: Array.from(
        new Set([
          ...base.unlockedCharacters,
          ...(existing.unlockedCharacters || []),
        ]),
      ),
      unlockedCostumes: Array.from(
        new Set([
          ...base.unlockedCostumes,
          ...(existing.unlockedCostumes || []),
        ]),
      ),
      unlockedAccessories: Array.from(
        new Set([
          ...base.unlockedAccessories,
          ...(existing.unlockedAccessories || []),
        ]),
      ),
      unlockedAttackEffects: Array.from(
        new Set([
          ...base.unlockedAttackEffects,
          ...(existing.unlockedAttackEffects || []),
        ]),
      ),
      unlockedVictoryEffects: Array.from(
        new Set([
          ...base.unlockedVictoryEffects,
          ...(existing.unlockedVictoryEffects || []),
        ]),
      ),
      achievements: Array.from(new Set(existing.achievements || [])),
      claimedMatchIds: Array.from(new Set(existing.claimedMatchIds || [])),
    };

    merged.level = calculateBattleLevel(merged.xp).level;
    return merged;
  }

  async updateBattleArenaSelection(profileId, { tutorChar, studentChar }) {
    const profile = await this.getProfileById(profileId);
    if (!profile) return null;
    if (tutorChar) profile.battleArenaProgress.selectedTutorChar = tutorChar;
    if (studentChar)
      profile.battleArenaProgress.selectedStudentChar = studentChar;
    await this.saveProfile(profile);
    return profile;
  }

  async purchaseBattleArenaItem(profileId, category, itemId, price) {
    const profile = await this.getProfileById(profileId);
    if (!profile) return { success: false, message: "Profil tidak ditemukan." };

    const bp = profile.battleArenaProgress;
    const listMap = {
      character: "unlockedCharacters",
      costume: "unlockedCostumes",
      accessory: "unlockedAccessories",
      attackEffect: "unlockedAttackEffects",
      victoryEffect: "unlockedVictoryEffects",
    };

    const listKey = listMap[category];
    if (!listKey) return { success: false, message: "Kategori tidak valid." };
    if (bp[listKey].includes(itemId))
      return { success: true, alreadyOwned: true, profile };
    if (bp.coins < price)
      return { success: false, message: "Koin Battle Arena belum mencukupi." };

    bp.coins -= price;
    bp[listKey].push(itemId);
    await this.saveProfile(profile);
    return { success: true, profile };
  }

  async equipBattleArenaItem(profileId, category, itemId) {
    const profile = await this.getProfileById(profileId);
    if (!profile) return null;
    const bp = profile.battleArenaProgress;

    if (category === "costume" && bp.unlockedCostumes.includes(itemId)) {
      bp.equipped.costume = itemId;
    } else if (
      category === "accessory" &&
      bp.unlockedAccessories.includes(itemId)
    ) {
      bp.equipped.accessory = itemId;
    } else if (
      category === "attackEffect" &&
      bp.unlockedAttackEffects.includes(itemId)
    ) {
      bp.equipped.attackEffect = itemId;
    } else if (
      category === "victoryEffect" &&
      bp.unlockedVictoryEffects.includes(itemId)
    ) {
      bp.equipped.victoryEffect = itemId;
    }

    await this.saveProfile(profile);
    return profile;
  }

  async recordBattleArenaResult(profileId, battleSummary) {
    const profile = await this.getProfileById(profileId);
    if (!profile)
      return { profile: null, rewardBreakdown: null, alreadyClaimed: false };

    const bp = profile.battleArenaProgress;
    const matchId = battleSummary.matchId || "battle_" + Date.now();

    if (bp.claimedMatchIds.includes(matchId)) {
      return { profile, rewardBreakdown: null, alreadyClaimed: true };
    }

    const sStats = battleSummary.studentStats || {
      answered: 0,
      correct: 0,
      wrong: 0,
      attacks: 0,
      maxCombo: 0,
    };
    const tStats = battleSummary.tutorStats || {
      answered: 0,
      correct: 0,
      wrong: 0,
      attacks: 0,
    };
    const totalQ =
      Number(sStats.answered) || (sStats.correct || 0) + (sStats.wrong || 0);
    const accuracy =
      totalQ > 0 ? Math.round(((sStats.correct || 0) / totalQ) * 100) : 0;
    const tTotalQ =
      Number(tStats.answered) || (tStats.correct || 0) + (tStats.wrong || 0);
    const tAccuracy =
      tTotalQ > 0 ? Math.round(((tStats.correct || 0) / tTotalQ) * 100) : 0;

    const isWin = battleSummary.winner === "student";
    const isDraw = battleSummary.winner === "draw";

    const baseCoins = 20;
    const victoryCoinBonus = isWin ? 35 : isDraw ? 15 : 5;
    const comboCoinBonus =
      (sStats.maxCombo || 0) >= 3 ? 20 : (sStats.maxCombo || 0) >= 2 ? 10 : 0;
    const accuracyCoinBonus = accuracy >= 90 ? 25 : accuracy >= 75 ? 10 : 0;
    const totalCoinsEarned =
      baseCoins + victoryCoinBonus + comboCoinBonus + accuracyCoinBonus;

    const baseXp = 30;
    const victoryXpBonus = isWin ? 40 : isDraw ? 20 : 15;
    const accuracyXpBonus = Math.round(accuracy * 0.3);
    const totalXpEarned = baseXp + victoryXpBonus + accuracyXpBonus;

    const oldLevel = calculateBattleLevel(bp.xp).level;
    bp.coins += totalCoinsEarned;
    bp.xp += totalXpEarned;
    const newLevelInfo = calculateBattleLevel(bp.xp);
    bp.level = newLevelInfo.level;

    bp.stats.matches += 1;
    if (isWin) bp.stats.wins += 1;
    else if (isDraw) bp.stats.draws += 1;
    else bp.stats.losses += 1;

    bp.stats.totalQuestions += totalQ;
    bp.stats.totalCorrect += sStats.correct || 0;
    bp.stats.highestCombo = Math.max(
      bp.stats.highestCombo || 0,
      sStats.maxCombo || 0,
    );

    const newAchievements = [];
    const unlockAch = (achId) => {
      if (!bp.achievements.includes(achId)) {
        bp.achievements.push(achId);
        newAchievements.push(achId);
      }
    };

    if (isWin) unlockAch("first_victory");
    if (totalQ > 0 && (sStats.wrong || 0) === 0) unlockAch("perfect_fighter");
    if ((sStats.maxCombo || 0) >= 3) unlockAch("combo_master");
    if (isWin && Number(battleSummary.studentLivesLeft) === 1)
      unlockAch("comeback_hero");
    if (totalQ > 0 && accuracy >= 90) unlockAch("knowledge_champion");
    if (bp.stats.matches >= 5) unlockAch("battle_veteran");

    bp.claimedMatchIds.push(matchId);
    if (bp.claimedMatchIds.length > 100) {
      bp.claimedMatchIds = bp.claimedMatchIds.slice(-100);
    }

    profile.battleArenaHistory = profile.battleArenaHistory || [];
    profile.battleArenaHistory.push({
      matchId,
      grade: battleSummary.grade,
      subject: battleSummary.subject,
      difficulty: battleSummary.difficulty,
      maxLives: battleSummary.maxLives || 5,
      totalQuestionsPlayed: battleSummary.totalQuestionsPlayed || totalQ,
      winner: battleSummary.winner,
      tutorName: battleSummary.tutorName,
      studentName: battleSummary.studentName,
      tutorCharacter: battleSummary.tutorCharacter,
      studentCharacter: battleSummary.studentCharacter,
      tutorLivesLeft: battleSummary.tutorLivesLeft,
      studentLivesLeft: battleSummary.studentLivesLeft,
      tutorStats: { ...tStats, accuracy: tAccuracy },
      studentStats: { ...sStats, accuracy },
      coinsEarned: totalCoinsEarned,
      xpEarned: totalXpEarned,
      playedAt: Date.now(),
    });

    await this.saveProfile(profile);

    return {
      profile,
      alreadyClaimed: false,
      rewardBreakdown: {
        baseCoins,
        victoryCoinBonus,
        comboCoinBonus,
        accuracyCoinBonus,
        totalCoinsEarned,
        totalXpEarned,
        leveledUp: newLevelInfo.level > oldLevel,
        newLevel: newLevelInfo.level,
        levelInfo: newLevelInfo,
        newAchievements,
      },
    };
  }

  async deleteProfile(profileId) {
    await this.init();
    if (this.getActiveProfileId() === profileId) {
      localStorage.removeItem(ACTIVE_PROFILE_KEY);
    }

    if (this.useFallback) {
      this.memoryFallback.profiles.delete(profileId);
      return true;
    }

    return new Promise((resolve) => {
      try {
        const tx = this.db.transaction(STORE_PROFILES, "readwrite");
        const store = tx.objectStore(STORE_PROFILES);
        const req = store.delete(profileId);
        req.onsuccess = () => resolve(true);
        req.onerror = () => resolve(false);
      } catch (e) {
        resolve(false);
      }
    });
  }

  async resetProfileProgress(profileId) {
    const profile = await this.getProfileById(profileId);
    if (!profile) return null;

    profile.coins = 0;
    profile.stars = 0;
    profile.totalScore = 0;
    profile.badges = [];
    profile.collectibles = [];
    profile.completedLevels = [];
    profile.adventureHistory = [];
    profile.duelHistory = [];
    profile.battleArenaHistory = [];
    profile.totalQuestionsAnswered = 0;
    profile.totalCorrect = 0;
    profile.totalWrong = 0;
    profile.subjectPerformance = {};
    profile.topicPerformance = {};
    profile.questionHistory = [];
    profile.adaptiveChanges = [];
    profile.topicsToReview = [];
    profile.adventureProgress = {};

    return await this.saveProfile(profile);
  }

  async resetAllProfilesProgress() {
    const profiles = await this.getAllProfiles();
    for (const p of profiles) {
      await this.resetProfileProgress(p.id);
    }
    return true;
  }

  setActiveProfileId(id) {
    try {
      localStorage.setItem(ACTIVE_PROFILE_KEY, id);
    } catch (e) {}
  }

  getActiveProfileId() {
    try {
      return localStorage.getItem(ACTIVE_PROFILE_KEY);
    } catch (e) {
      return null;
    }
  }

  async getActiveProfile() {
    const activeId = this.getActiveProfileId();
    if (activeId) {
      const found = await this.getProfileById(activeId);
      if (found) return found;
    }
    const all = await this.getAllProfiles();
    if (all.length > 0) {
      this.setActiveProfileId(all[0].id);
      return all[0];
    }
    return null;
  }

  async getSettings() {
    await this.init();
    const defaultSettings = {
      soundEffects: true,
      showTouchControls: true,
      tutorPin: "1234",
      difficultyMode: "adaptif",
      manualDifficulty: "sedang",
      adaptiveBounds: "mudah-sulit",
      initialAdaptiveDifficulty: "mudah",
      battleMuted: false,
      battleVolume: 0.6,
    };

    if (this.useFallback) {
      return {
        ...defaultSettings,
        ...(this.memoryFallback.settings.get("game_settings") || {}),
      };
    }

    return new Promise((resolve) => {
      try {
        const tx = this.db.transaction(STORE_SETTINGS, "readonly");
        const store = tx.objectStore(STORE_SETTINGS);
        const req = store.get("game_settings");
        req.onsuccess = () => {
          resolve(
            req.result
              ? { ...defaultSettings, ...req.result.value }
              : defaultSettings,
          );
        };
        req.onerror = () => resolve(defaultSettings);
      } catch (e) {
        resolve(defaultSettings);
      }
    });
  }

  async saveSettings(settingsObj) {
    await this.init();
    if (this.useFallback) {
      this.memoryFallback.settings.set("game_settings", settingsObj);
      return settingsObj;
    }

    return new Promise((resolve) => {
      try {
        const tx = this.db.transaction(STORE_SETTINGS, "readwrite");
        const store = tx.objectStore(STORE_SETTINGS);
        const req = store.put({ key: "game_settings", value: settingsObj });
        req.onsuccess = () => resolve(settingsObj);
        req.onerror = () => resolve(settingsObj);
      } catch (e) {
        resolve(settingsObj);
      }
    });
  }

  async getCustomQuestions() {
    await this.init();
    if (this.useFallback) {
      return Array.from(this.memoryFallback.custom_questions.values());
    }

    return new Promise((resolve) => {
      try {
        const tx = this.db.transaction(STORE_CUSTOM_QUESTIONS, "readonly");
        const store = tx.objectStore(STORE_CUSTOM_QUESTIONS);
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => resolve([]);
      } catch (e) {
        resolve([]);
      }
    });
  }

  async saveCustomQuestionsBatch(questionsArray) {
    await this.init();
    if (this.useFallback) {
      questionsArray.forEach((q) =>
        this.memoryFallback.custom_questions.set(q.id, q),
      );
      return questionsArray.length;
    }

    return new Promise((resolve, reject) => {
      try {
        const tx = this.db.transaction(STORE_CUSTOM_QUESTIONS, "readwrite");
        const store = tx.objectStore(STORE_CUSTOM_QUESTIONS);
        questionsArray.forEach((q) => store.put(q));
        tx.oncomplete = () => resolve(questionsArray.length);
        tx.onerror = () => reject(tx.error);
      } catch (e) {
        reject(e);
      }
    });
  }

  async exportBackupData() {
    const profiles = await this.getAllProfiles();
    const settings = await this.getSettings();
    const customQuestions = await this.getCustomQuestions();

    return {
      app: "Petualangan Dunia Pintar",
      version: "1.0.0-adventure-levels",
      exportedAt: new Date().toISOString(),
      profiles,
      settings,
      customQuestions,
    };
  }

  async importBackupData(backupPayload) {
    if (!backupPayload || typeof backupPayload !== "object") {
      throw new Error("Format file cadangan tidak valid.");
    }
    if (!Array.isArray(backupPayload.profiles)) {
      throw new Error(
        "Data profil siswa tidak ditemukan di dalam file cadangan.",
      );
    }

    for (const prof of backupPayload.profiles) {
      if (prof && prof.id && prof.name) {
        await this.saveProfile(prof);
      }
    }

    if (backupPayload.settings && typeof backupPayload.settings === "object") {
      const currentSettings = await this.getSettings();
      await this.saveSettings({
        ...currentSettings,
        ...backupPayload.settings,
      });
    }

    if (
      Array.isArray(backupPayload.customQuestions) &&
      backupPayload.customQuestions.length > 0
    ) {
      await this.saveCustomQuestionsBatch(backupPayload.customQuestions);
    }

    return {
      profilesCount: backupPayload.profiles.length,
      customQuestionsCount: Array.isArray(backupPayload.customQuestions)
        ? backupPayload.customQuestions.length
        : 0,
    };
  }
}

export const db = new LocalDatabase();
