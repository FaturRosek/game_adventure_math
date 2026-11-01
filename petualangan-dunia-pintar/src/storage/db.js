const DB_NAME = "PetualanganDuniaPintarDB";
const DB_VERSION = 1;
const STORE_PROFILES = "profiles";
const STORE_SETTINGS = "settings";
const ACTIVE_PROFILE_KEY = "pdp_active_profile_id";

class LocalDatabase {
  constructor() {
    this.db = null;
  }

  async init() {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
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
      };

      request.onsuccess = (event) => {
        this.db = event.target.result;
        resolve(this.db);
      };

      request.onerror = (event) => {
        console.error("Gagal membuka IndexedDB:", event.target.error);
        reject(event.target.error);
      };
    });
  }

  async getAllProfiles() {
    await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(STORE_PROFILES, "readonly");
      const store = tx.objectStore(STORE_PROFILES);
      const request = store.getAll();

      request.onsuccess = () => {
        const list = request.result || [];
        list.sort((a, b) => b.createdAt - a.createdAt);
        resolve(list);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getProfileById(id) {
    if (!id) return null;
    await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(STORE_PROFILES, "readonly");
      const store = tx.objectStore(STORE_PROFILES);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async createProfile({ name, grade = 3, character = "kiko" }) {
    await this.init();
    const newProfile = {
      id:
        "prof_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7),
      name: name.trim(),
      grade: Number(grade),
      character,
      coins: 0,
      stars: 0,
      badges: [],
      completedLevels: [],
      adventureHistory: [],
      duelHistory: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await this.saveProfile(newProfile);
    this.setActiveProfileId(newProfile.id);
    return newProfile;
  }

  async saveProfile(profileData) {
    await this.init();
    profileData.updatedAt = Date.now();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(STORE_PROFILES, "readwrite");
      const store = tx.objectStore(STORE_PROFILES);
      const request = store.put(profileData);

      request.onsuccess = () => resolve(profileData);
      request.onerror = () => reject(request.error);
    });
  }

  async recordAdventureResult(profileId, result) {
    const profile = await this.getProfileById(profileId);
    if (!profile) return null;

    profile.coins = (profile.coins || 0) + (result.coinsEarned || 0);
    profile.stars = (profile.stars || 0) + (result.starsEarned || 0);

    if (result.levelId && !profile.completedLevels.includes(result.levelId)) {
      profile.completedLevels.push(result.levelId);
    }

    if (result.badgeEarned && !profile.badges.includes(result.badgeEarned)) {
      profile.badges.push(result.badgeEarned);
    }

    profile.adventureHistory = profile.adventureHistory || [];
    profile.adventureHistory.push({
      levelId: result.levelId,
      subject: result.subject || "matematika",
      coinsEarned: result.coinsEarned,
      correctCount: result.correctCount,
      wrongCount: result.wrongCount,
      starsEarned: result.starsEarned,
      badgeEarned: result.badgeEarned,
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

    profile.coins = (profile.coins || 0) + bonusCoins;
    profile.stars = (profile.stars || 0) + bonusStars;

    if (
      duelSummary.badgeEarned &&
      !profile.badges.includes(duelSummary.badgeEarned)
    ) {
      profile.badges.push(duelSummary.badgeEarned);
    }

    profile.duelHistory = profile.duelHistory || [];
    profile.duelHistory.push({
      subject: duelSummary.subject,
      topic: duelSummary.topic,
      difficulty: duelSummary.difficulty,
      totalRounds: duelSummary.totalRounds,
      winner: duelSummary.winner,
      studentStats: duelSummary.studentStats,
      tutorStats: duelSummary.tutorStats,
      masteredTopics: duelSummary.masteredTopics || [],
      reviewTopics: duelSummary.reviewTopics || [],
      playedAt: Date.now(),
    });

    await this.saveProfile(profile);
    return profile;
  }

  setActiveProfileId(id) {
    localStorage.setItem(ACTIVE_PROFILE_KEY, id);
  }

  getActiveProfileId() {
    return localStorage.getItem(ACTIVE_PROFILE_KEY);
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
    return new Promise((resolve) => {
      const tx = this.db.transaction(STORE_SETTINGS, "readonly");
      const store = tx.objectStore(STORE_SETTINGS);
      const req = store.get("game_settings");
      req.onsuccess = () => {
        resolve(
          req.result
            ? req.result.value
            : { soundEffects: true, showTouchControls: true },
        );
      };
      req.onerror = () =>
        resolve({ soundEffects: true, showTouchControls: true });
    });
  }

  async saveSettings(settingsObj) {
    await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(STORE_SETTINGS, "readwrite");
      const store = tx.objectStore(STORE_SETTINGS);
      const req = store.put({ key: "game_settings", value: settingsObj });
      req.onsuccess = () => resolve(settingsObj);
      req.onerror = () => reject(req.error);
    });
  }
}

export const db = new LocalDatabase();
