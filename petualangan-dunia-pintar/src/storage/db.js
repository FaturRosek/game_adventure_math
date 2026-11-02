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

  ensureProfileAnalyticsStructure(profile) {
    if (!profile) return null;
    profile.coins = profile.coins || 0;
    profile.stars = profile.stars || 0;
    profile.totalScore = profile.totalScore || 0;
    profile.badges = profile.badges || [];
    profile.collectibles = profile.collectibles || [];
    profile.completedLevels = profile.completedLevels || [];
    profile.adventureHistory = profile.adventureHistory || [];
    profile.duelHistory = profile.duelHistory || [];

    profile.totalQuestionsAnswered = profile.totalQuestionsAnswered || 0;
    profile.totalCorrect = profile.totalCorrect || 0;
    profile.totalWrong = profile.totalWrong || 0;
    profile.subjectPerformance = profile.subjectPerformance || {
      matematika: { answered: 0, correct: 0, wrong: 0 },
      ipas: { answered: 0, correct: 0, wrong: 0 },
    };
    profile.topicPerformance = profile.topicPerformance || {};
    profile.questionHistory = profile.questionHistory || [];
    profile.adaptiveChanges = profile.adaptiveChanges || [];
    profile.topicsToReview = profile.topicsToReview || [];
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
    const newProfile = this.ensureProfileAnalyticsStructure({
      id:
        "prof_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7),
      name: name.trim(),
      grade: Number(grade),
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
      subjectPerformance: {
        matematika: { answered: 0, correct: 0, wrong: 0 },
        ipas: { answered: 0, correct: 0, wrong: 0 },
      },
      topicPerformance: {},
      questionHistory: [],
      adaptiveChanges: [],
      topicsToReview: [],
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
    const subjKey = String(attemptData.subject || "matematika").toLowerCase();
    const topicName = attemptData.topic || "Umum";
    const topicKey = `${subjKey}:${topicName}`;
    const isCorrect = Boolean(attemptData.isCorrect);
    const difficultyUsed = String(
      attemptData.difficulty || "mudah",
    ).toLowerCase();

    profile.totalQuestionsAnswered += 1;
    if (isCorrect) profile.totalCorrect += 1;
    else profile.totalWrong += 1;

    if (!profile.subjectPerformance[subjKey]) {
      profile.subjectPerformance[subjKey] = {
        answered: 0,
        correct: 0,
        wrong: 0,
      };
    }
    profile.subjectPerformance[subjKey].answered += 1;
    if (isCorrect) profile.subjectPerformance[subjKey].correct += 1;
    else profile.subjectPerformance[subjKey].wrong += 1;

    if (!profile.topicPerformance[topicKey]) {
      profile.topicPerformance[topicKey] = {
        subject: subjKey,
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
          subject: subjKey,
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
      .map((tp) => `${tp.subject.toUpperCase()}: ${tp.topic}`);

    profile.questionHistory.push({
      questionId: attemptData.questionId,
      subject: subjKey,
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
    profile.totalQuestionsAnswered = 0;
    profile.totalCorrect = 0;
    profile.totalWrong = 0;
    profile.subjectPerformance = {
      matematika: { answered: 0, correct: 0, wrong: 0 },
      ipas: { answered: 0, correct: 0, wrong: 0 },
    };
    profile.topicPerformance = {};
    profile.questionHistory = [];
    profile.adaptiveChanges = [];
    profile.topicsToReview = [];

    return await this.saveProfile(profile);
  }

  async resetAllProfilesProgress() {
    const profiles = await this.getAllProfiles();
    for (const p of profiles) {
      await this.resetProfileProgress(p.id);
    }
    return true;
  }

  async recordAdventureResult(profileId, result) {
    const profile = await this.getProfileById(profileId);
    if (!profile) return null;

    const scoreEarned =
      (result.correctCount || 0) * 100 + (result.coinsEarned || 0) * 2;
    profile.coins = (profile.coins || 0) + (result.coinsEarned || 0);
    profile.stars = (profile.stars || 0) + (result.starsEarned || 0);
    profile.totalScore = (profile.totalScore || 0) + scoreEarned;

    if (result.levelId && !profile.completedLevels.includes(result.levelId)) {
      profile.completedLevels.push(result.levelId);
    }

    if (result.badgeEarned && !profile.badges.includes(result.badgeEarned)) {
      profile.badges.push(result.badgeEarned);
    }

    if (
      result.collectibleItem &&
      !profile.collectibles.includes(result.collectibleItem)
    ) {
      profile.collectibles.push(result.collectibleItem);
    }

    profile.adventureHistory.push({
      id:
        "adv_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6),
      levelId: result.levelId,
      levelTitle: result.levelTitle || result.levelId,
      subject: result.subject || "matematika",
      coinsEarned: result.coinsEarned || 0,
      scoreEarned,
      correctCount: result.correctCount || 0,
      wrongCount: result.wrongCount || 0,
      starsEarned: result.starsEarned || 1,
      badgeEarned: result.badgeEarned || "",
      collectibleItem: result.collectibleItem || "",
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
      version: "1.0.0-hybrid",
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
