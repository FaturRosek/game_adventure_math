import mathGrade3Data from "../data/mathGrade3.json";
import ipasGrade3Data from "../data/ipasGrade3.json";
import bindoGrade3Data from "../data/bindoGrade3.json";
import bingGrade3Data from "../data/bingGrade3.json";
import mathGrade4Data from "../data/mathGrade4.json";
import ipasGrade4Data from "../data/ipasGrade4.json";
import bindoGrade4Data from "../data/bindoGrade4.json";
import bingGrade4Data from "../data/bingGrade4.json";
import { db } from "../storage/db.js";
import { hybridEngine } from "./HybridQuestionEngine.js";

export class QuestionManager {
  constructor() {
    this.baseBanksByGrade = {
      3: {
        matematika: mathGrade3Data.map((q) => ({ ...q, grade: 3, sourceType: "question_bank" })),
        ipas: ipasGrade3Data.map((q) => ({ ...q, grade: 3, sourceType: "question_bank" })),
        bahasa_indonesia: bindoGrade3Data.map((q) => ({ ...q, grade: 3, sourceType: "question_bank" })),
        bahasa_inggris: bingGrade3Data.map((q) => ({ ...q, grade: 3, sourceType: "question_bank" })),
      },
      4: {
        matematika: mathGrade4Data.map((q) => ({ ...q, grade: 4, sourceType: "question_bank" })),
        ipas: ipasGrade4Data.map((q) => ({ ...q, grade: 4, sourceType: "question_bank" })),
        bahasa_indonesia: bindoGrade4Data.map((q) => ({ ...q, grade: 4, sourceType: "question_bank" })),
        bahasa_inggris: bingGrade4Data.map((q) => ({ ...q, grade: 4, sourceType: "question_bank" })),
      },
    };
    this.banksByGrade = {
      3: {
        matematika: [...this.baseBanksByGrade[3].matematika],
        ipas: [...this.baseBanksByGrade[3].ipas],
        bahasa_indonesia: [...this.baseBanksByGrade[3].bahasa_indonesia],
        bahasa_inggris: [...this.baseBanksByGrade[3].bahasa_inggris],
      },
      4: {
        matematika: [...this.baseBanksByGrade[4].matematika],
        ipas: [...this.baseBanksByGrade[4].ipas],
        bahasa_indonesia: [...this.baseBanksByGrade[4].bahasa_indonesia],
        bahasa_inggris: [...this.baseBanksByGrade[4].bahasa_inggris],
      },
    };
    this.banks = this.banksByGrade[3];
    this.usedQuestionIds = new Set();
    this.usedQuestionSignatures = new Set();
  }

  normalizeSubjectKey(subject = "matematika") {
    const raw = String(subject || "matematika").trim().toLowerCase().replace(/^g\d+_/, "");
    if (raw === "ipas") return "ipas";
    if (raw === "bahasa_indonesia" || raw === "bahasa indonesia" || raw === "bindo") {
      return "bahasa_indonesia";
    }
    if (raw === "bahasa_inggris" || raw === "bahasa inggris" || raw === "bing" || raw === "english") {
      return "bahasa_inggris";
    }
    return "matematika";
  }

  formatSubjectDisplayName(subjKey) {
    const k = this.normalizeSubjectKey(subjKey);
    if (k === "ipas") return "IPAS";
    if (k === "bahasa_indonesia") return "Bahasa Indonesia";
    if (k === "bahasa_inggris") return "Bahasa Inggris";
    return "Matematika";
  }

  async loadCustomQuestionsFromDB() {
    const customList = await db.getCustomQuestions();
    [3, 4].forEach((g) => {
      this.banksByGrade[g] = {
        matematika: [...this.baseBanksByGrade[g].matematika],
        ipas: [...this.baseBanksByGrade[g].ipas],
        bahasa_indonesia: [...this.baseBanksByGrade[g].bahasa_indonesia],
        bahasa_inggris: [...this.baseBanksByGrade[g].bahasa_inggris],
      };
    });

    const existingIds = new Set(this.getAllQuestionsCombined().map((q) => q.id));

    customList.forEach((q) => {
      if (!q || !q.id || existingIds.has(q.id)) return;
      const withSource = { ...q, sourceType: q.sourceType || "custom_bank" };
      const check = hybridEngine.validateQuestionObject(withSource);
      if (!check.valid) return;

      const g = Number(q.grade) === 4 ? 4 : 3;
      const subjKey = this.normalizeSubjectKey(q.subject);
      this.banksByGrade[g][subjKey].push(withSource);
      existingIds.add(q.id);
    });

    this.banks = this.banksByGrade[3];
  }

  resetSession() {
    this.usedQuestionIds.clear();
    this.usedQuestionSignatures.clear();
  }

  getSubjectBank(subject = "matematika", grade = 3) {
    const g = Number(grade) === 4 ? 4 : 3;
    const key = this.normalizeSubjectKey(subject);
    return this.banksByGrade[g][key] || this.banksByGrade[g].matematika;
  }

  getAllQuestionsCombined() {
    return [
      ...this.banksByGrade[3].matematika,
      ...this.banksByGrade[3].ipas,
      ...this.banksByGrade[3].bahasa_indonesia,
      ...this.banksByGrade[3].bahasa_inggris,
      ...this.banksByGrade[4].matematika,
      ...this.banksByGrade[4].ipas,
      ...this.banksByGrade[4].bahasa_indonesia,
      ...this.banksByGrade[4].bahasa_inggris,
    ];
  }

  getTopicsBySubject(subject = "matematika", grade = 3) {
    const bank = this.getSubjectBank(subject, grade);
    const topicSet = new Set();
    bank.forEach((q) => {
      if (q.topic) topicSet.add(q.topic);
    });
    return Array.from(topicSet);
  }

  getBankStatistics() {
    const stats = {
      total: 0,
      mathTemplateCount: hybridEngine.mathTemplates.length + hybridEngine.mathGrade4Templates.length,
      ipasTemplateCount: hybridEngine.ipasTemplates.length + hybridEngine.ipasGrade4Templates.length,
      bindoTemplateCount: hybridEngine.bindoTemplates.length + hybridEngine.bindoGrade4Templates.length,
      bingTemplateCount: hybridEngine.bingTemplates.length + hybridEngine.bingGrade4Templates.length,
      bySubject: {
        matematika: { total: 0, mudah: 0, sedang: 0, sulit: 0, topics: {} },
        ipas: { total: 0, mudah: 0, sedang: 0, sulit: 0, topics: {} },
        bahasa_indonesia: { total: 0, mudah: 0, sedang: 0, sulit: 0, topics: {} },
        bahasa_inggris: { total: 0, mudah: 0, sedang: 0, sulit: 0, topics: {} },
      },
    };

    [3, 4].forEach((g) => {
      ["matematika", "ipas", "bahasa_indonesia", "bahasa_inggris"].forEach((subj) => {
        const list = this.banksByGrade[g][subj] || [];
        stats.bySubject[subj].total += list.length;
        stats.total += list.length;

        list.forEach((q) => {
          const diff = String(q.difficulty || "sedang").toLowerCase();
          if (stats.bySubject[subj][diff] !== undefined) {
            stats.bySubject[subj][diff] += 1;
          }
          const topic = `[Kls ${g}] ${q.topic || "Umum"}`;
          stats.bySubject[subj].topics[topic] = (stats.bySubject[subj].topics[topic] || 0) + 1;
        });
      });
    });

    return stats;
  }

  exportQuestionBankPayload() {
    return {
      app: "Petualangan Dunia Pintar - Question Bank Export",
      version: "1.0.0-grade3-4",
      exportedAt: new Date().toISOString(),
      totalQuestions: this.getAllQuestionsCombined().length,
      questions: this.getAllQuestionsCombined(),
    };
  }

  async validateAndImportQuestions(jsonInput) {
    let parsed = jsonInput;
    if (typeof jsonInput === "string") {
      try {
        parsed = JSON.parse(jsonInput);
      } catch (e) {
        return {
          success: false,
          addedCount: 0,
          skippedDuplicateCount: 0,
          errors: ["File bukan format JSON yang valid."],
        };
      }
    }

    const rawItems = parsed && Array.isArray(parsed.questions)
      ? parsed.questions
      : Array.isArray(parsed)
        ? parsed
        : [parsed];

    if (rawItems.length === 0) {
      return {
        success: false,
        addedCount: 0,
        skippedDuplicateCount: 0,
        errors: ["Array JSON kosong."],
      };
    }

    const existingIds = new Set(this.getAllQuestionsCombined().map((q) => String(q.id).trim()));
    const validToSave = [];
    const errors = [];
    let skippedDuplicateCount = 0;

    rawItems.forEach((item, idx) => {
      const rowNum = idx + 1;
      if (!item || typeof item !== "object") {
        errors.push(`Baris #${rowNum}: Bukan objek soal yang valid.`);
        return;
      }

      const id = String(item.id || "").trim();
      if (id && existingIds.has(id)) {
        skippedDuplicateCount += 1;
        return;
      }

      const subjKey = this.normalizeSubjectKey(item.subject);
      const itemGrade = Number(item.grade) === 4 ? 4 : 3;
      const normalizedQuestion = {
        id,
        grade: itemGrade,
        subject: this.formatSubjectDisplayName(subjKey),
        topic: String(item.topic || "").trim(),
        subtopic: String(item.subtopic || item.topic || "").trim(),
        difficulty: String(item.difficulty || "").trim().toLowerCase(),
        question: String(item.question || "").trim(),
        options: Array.isArray(item.options) ? item.options.map((o) => String(o).trim()) : [],
        correctAnswer: String(item.correctAnswer || "").trim(),
        explanation: String(item.explanation || "").trim(),
        sourceType: "custom_bank",
        isCustom: true,
      };

      const check = hybridEngine.validateQuestionObject(normalizedQuestion);
      if (!check.valid) {
        errors.push(`Soal #${rowNum} (${id || "Tanpa ID"}): ${check.errors.join(", ")}`);
        return;
      }

      existingIds.add(id);
      validToSave.push(normalizedQuestion);
    });

    if (validToSave.length > 0) {
      await db.saveCustomQuestionsBatch(validToSave);
      await this.loadCustomQuestionsFromDB();
    }

    return {
      success: validToSave.length > 0,
      addedCount: validToSave.length,
      skippedDuplicateCount,
      errors,
    };
  }

  pickAdventureTopic(subject = "matematika", profile = null, explicitTopic = null, grade = 3) {
    if (explicitTopic && explicitTopic !== "semua") return explicitTopic;
    const subjKey = this.normalizeSubjectKey(subject);
    const numGrade = Number(grade) === 4 ? 4 : 3;
    const allTopics = this.getTopicsBySubject(subjKey, numGrade);

    if (profile && profile.topicPerformance) {
      const remedialTopics = Object.values(profile.topicPerformance)
        .filter(
          (tp) =>
            (Number(tp.grade) || 3) === numGrade &&
            tp.subject === subjKey &&
            (tp.needsReview || tp.wrong > tp.correct),
        )
        .map((tp) => tp.topic)
        .filter((tName) => allTopics.includes(tName));

      if (remedialTopics.length > 0 && Math.random() < 0.65) {
        return hybridEngine.pickRandom(remedialTopics);
      }
    }

    return hybridEngine.pickRandom(allTopics);
  }

  getNextQuestion(subject = "matematika", topicFilter = null, options = {}) {
    const subjKey = this.normalizeSubjectKey(subject);
    const profile = options.profile || null;
    const settings = options.settings || {};
    const targetGrade = Number(options.grade) || Number(profile?.grade) || 3;

    const chosenTopic = this.pickAdventureTopic(subjKey, profile, topicFilter, targetGrade);
    const diffResolution = options.forceDifficulty
      ? {
          difficulty: options.forceDifficulty,
          mode: options.modeLabel || settings.difficultyMode || "level_adventure",
          reason: `Mengikuti tingkat kesulitan level (${options.forceDifficulty})`,
        }
      : hybridEngine.resolveTargetDifficulty({
          settings,
          profile,
          grade: targetGrade,
          subject: subjKey,
          topic: chosenTopic,
        });

    const targetDiff = diffResolution.difficulty;
    const preferTemplateProb = subjKey === "matematika" ? 0.5 : 0.3;

    let selectedQuestion = null;

    if (Math.random() >= preferTemplateProb) {
      selectedQuestion =
        this.pickValidFromBank(subjKey, chosenTopic, targetDiff, targetGrade) ||
        this.pickValidFromBank(subjKey, null, targetDiff, targetGrade);
    }

    if (!selectedQuestion) {
      selectedQuestion =
        this.tryGenerateUniqueFromTemplate(subjKey, chosenTopic, targetDiff, targetGrade) ||
        this.tryGenerateUniqueFromTemplate(subjKey, null, targetDiff, targetGrade);
    }

    if (!selectedQuestion) {
      selectedQuestion = this.pickValidFromBank(subjKey, null, targetDiff, targetGrade);
    }

    if (!selectedQuestion) {
      selectedQuestion = this.pickValidFromBank(subjKey, null, null, targetGrade);
    }

    if (!selectedQuestion) {
      return {
        error: true,
        poolExhaustedError: true,
        message: `Stok soal unik ${this.formatSubjectDisplayName(subjKey)} Kelas ${targetGrade} (${targetDiff.toUpperCase()}) tidak mencukupi.`,
      };
    }

    this.usedQuestionIds.add(selectedQuestion.id);
    this.usedQuestionSignatures.add(selectedQuestion.question);

    return {
      ...selectedQuestion,
      grade: targetGrade,
      difficulty: targetDiff,
      options: hybridEngine.shuffleArray(selectedQuestion.options),
      adaptiveMeta: diffResolution,
    };
  }

  tryGenerateUniqueFromTemplate(subject, topic, difficulty, grade = 3) {
    for (let attempt = 0; attempt < 12; attempt++) {
      const candidate = hybridEngine.generateFromTemplate({ grade, subject, topic, difficulty });
      if (
        candidate &&
        !this.usedQuestionIds.has(candidate.id) &&
        !this.usedQuestionSignatures.has(candidate.question)
      ) {
        const check = hybridEngine.validateQuestionObject(candidate);
        if (check.valid) return candidate;
      }
    }
    return null;
  }

  pickValidFromBank(subject, topic = null, difficulty = null, grade = 3) {
    const bank = this.getSubjectBank(subject, grade);
    let pool = bank.filter(
      (q) => !this.usedQuestionIds.has(q.id) && !this.usedQuestionSignatures.has(q.question),
    );

    if (topic && topic !== "semua") {
      const byTopic = pool.filter((q) => q.topic.toLowerCase() === topic.toLowerCase());
      if (byTopic.length > 0) pool = byTopic;
      else return null;
    }

    if (difficulty && difficulty !== "semua") {
      const byDiff = pool.filter((q) => q.difficulty.toLowerCase() === difficulty.toLowerCase());
      if (byDiff.length > 0) pool = byDiff;
      else return null;
    }

    const shuffled = hybridEngine.shuffleArray(pool);
    for (const item of shuffled) {
      const normalized = { ...item, grade: Number(grade) || 3, sourceType: item.sourceType || "question_bank" };
      const check = hybridEngine.validateQuestionObject(normalized);
      if (check.valid) {
        return normalized;
      }
    }
    return null;
  }

  getDuelQuestionPair({
    grade = 3,
    subject = "matematika",
    topic = "semua",
    difficulty = "adaptif",
    profile = null,
    settings = {},
  }) {
    const numGrade = Number(grade) || Number(profile?.grade) || 3;
    const subjKey = this.normalizeSubjectKey(subject);
    const roundTopic =
      topic && topic !== "semua"
        ? topic
        : hybridEngine.pickRandom(this.getTopicsBySubject(subjKey, numGrade));

    let roundDifficulty = difficulty;
    let adaptiveMeta = { mode: "manual", difficulty: roundDifficulty, reason: "Manual" };

    if (!roundDifficulty || roundDifficulty === "adaptif" || roundDifficulty === "semua") {
      adaptiveMeta = hybridEngine.resolveTargetDifficulty({
        settings: { ...settings, difficultyMode: "adaptif" },
        profile,
        grade: numGrade,
        subject: subjKey,
        topic: roundTopic,
      });
      roundDifficulty = adaptiveMeta.difficulty;
    }

    const tutorQ = this.getNextQuestion(subjKey, roundTopic, {
      grade: numGrade,
      profile,
      settings,
      forceDifficulty: roundDifficulty,
    });

    let studentQ = this.getNextQuestion(subjKey, tutorQ.topic || roundTopic, {
      grade: numGrade,
      profile,
      settings,
      forceDifficulty: tutorQ.difficulty || roundDifficulty,
    });

    if (studentQ.question === tutorQ.question) {
      const twin =
        this.tryGenerateUniqueFromTemplate(subjKey, tutorQ.topic || roundTopic, roundDifficulty, numGrade) ||
        this.pickValidFromBank(subjKey, null, null, numGrade);
      if (twin) {
        this.usedQuestionIds.add(twin.id);
        this.usedQuestionSignatures.add(twin.question);
        studentQ = {
          ...twin,
          grade: numGrade,
          difficulty: roundDifficulty,
          options: hybridEngine.shuffleArray(twin.options),
          adaptiveMeta,
        };
      }
    }

    return {
      grade: numGrade,
      roundDifficulty: tutorQ.difficulty || roundDifficulty,
      roundTopic: tutorQ.topic || roundTopic,
      adaptiveMeta,
      tutorQuestion: tutorQ,
      studentQuestion: studentQ,
    };
  }
}

export const questionManager = new QuestionManager();
