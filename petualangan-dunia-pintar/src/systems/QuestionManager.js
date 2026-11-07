import mathGrade3Data from "../data/mathGrade3.json";
import ipasGrade3Data from "../data/ipasGrade3.json";
import bindoGrade3Data from "../data/bindoGrade3.json";
import bingGrade3Data from "../data/bingGrade3.json";
import { db } from "../storage/db.js";
import { hybridEngine } from "./HybridQuestionEngine.js";

export class QuestionManager {
  constructor() {
    this.baseBanks = {
      matematika: mathGrade3Data.map((q) => ({
        ...q,
        sourceType: "question_bank",
      })),
      ipas: ipasGrade3Data.map((q) => ({ ...q, sourceType: "question_bank" })),
      bahasa_indonesia: bindoGrade3Data.map((q) => ({
        ...q,
        sourceType: "question_bank",
      })),
      bahasa_inggris: bingGrade3Data.map((q) => ({
        ...q,
        sourceType: "question_bank",
      })),
    };
    this.banks = {
      matematika: [...this.baseBanks.matematika],
      ipas: [...this.baseBanks.ipas],
      bahasa_indonesia: [...this.baseBanks.bahasa_indonesia],
      bahasa_inggris: [...this.baseBanks.bahasa_inggris],
    };
    this.usedQuestionIds = new Set();
    this.usedQuestionSignatures = new Set();
  }

  normalizeSubjectKey(subject = "matematika") {
    const raw = String(subject || "matematika")
      .trim()
      .toLowerCase();
    if (raw === "ipas") return "ipas";
    if (
      raw === "bahasa_indonesia" ||
      raw === "bahasa indonesia" ||
      raw === "bindo"
    ) {
      return "bahasa_indonesia";
    }
    if (
      raw === "bahasa_inggris" ||
      raw === "bahasa inggris" ||
      raw === "bing" ||
      raw === "english"
    ) {
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
    this.banks = {
      matematika: [...this.baseBanks.matematika],
      ipas: [...this.baseBanks.ipas],
      bahasa_indonesia: [...this.baseBanks.bahasa_indonesia],
      bahasa_inggris: [...this.baseBanks.bahasa_inggris],
    };

    const existingIds = new Set(
      this.getAllQuestionsCombined().map((q) => q.id),
    );

    customList.forEach((q) => {
      if (!q || !q.id || existingIds.has(q.id)) return;
      const withSource = { ...q, sourceType: q.sourceType || "custom_bank" };
      const check = hybridEngine.validateQuestionObject(withSource);
      if (!check.valid) return;

      const subjKey = this.normalizeSubjectKey(q.subject);
      this.banks[subjKey].push(withSource);
      existingIds.add(q.id);
    });
  }

  resetSession() {
    this.usedQuestionIds.clear();
    this.usedQuestionSignatures.clear();
  }

  getSubjectBank(subject = "matematika") {
    const key = this.normalizeSubjectKey(subject);
    return this.banks[key] || this.banks.matematika;
  }

  getAllQuestionsCombined() {
    return [
      ...this.banks.matematika,
      ...this.banks.ipas,
      ...this.banks.bahasa_indonesia,
      ...this.banks.bahasa_inggris,
    ];
  }

  getTopicsBySubject(subject = "matematika") {
    const bank = this.getSubjectBank(subject);
    const topicSet = new Set();
    bank.forEach((q) => {
      if (q.topic) topicSet.add(q.topic);
    });
    return Array.from(topicSet);
  }

  getBankStatistics() {
    const stats = {
      total: 0,
      mathTemplateCount: hybridEngine.mathTemplates.length,
      ipasTemplateCount: hybridEngine.ipasTemplates.length,
      bindoTemplateCount: hybridEngine.bindoTemplates.length,
      bingTemplateCount: hybridEngine.bingTemplates.length,
      bySubject: {
        matematika: { total: 0, mudah: 0, sedang: 0, sulit: 0, topics: {} },
        ipas: { total: 0, mudah: 0, sedang: 0, sulit: 0, topics: {} },
        bahasa_indonesia: {
          total: 0,
          mudah: 0,
          sedang: 0,
          sulit: 0,
          topics: {},
        },
        bahasa_inggris: { total: 0, mudah: 0, sedang: 0, sulit: 0, topics: {} },
      },
    };

    ["matematika", "ipas", "bahasa_indonesia", "bahasa_inggris"].forEach(
      (subj) => {
        const list = this.banks[subj] || [];
        stats.bySubject[subj].total = list.length;
        stats.total += list.length;

        list.forEach((q) => {
          const diff = String(q.difficulty || "sedang").toLowerCase();
          if (stats.bySubject[subj][diff] !== undefined) {
            stats.bySubject[subj][diff] += 1;
          }
          const topic = q.topic || "Umum";
          stats.bySubject[subj].topics[topic] =
            (stats.bySubject[subj].topics[topic] || 0) + 1;
        });
      },
    );

    return stats;
  }

  exportQuestionBankPayload() {
    return {
      app: "Petualangan Dunia Pintar - Question Bank Export",
      version: "1.0.0-4subjects",
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

    const rawItems =
      parsed && Array.isArray(parsed.questions)
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

    const existingIds = new Set(
      this.getAllQuestionsCombined().map((q) => String(q.id).trim()),
    );
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
      const normalizedQuestion = {
        id,
        grade: Number(item.grade) || 3,
        subject: this.formatSubjectDisplayName(subjKey),
        topic: String(item.topic || "").trim(),
        subtopic: String(item.subtopic || item.topic || "").trim(),
        difficulty: String(item.difficulty || "")
          .trim()
          .toLowerCase(),
        question: String(item.question || "").trim(),
        options: Array.isArray(item.options)
          ? item.options.map((o) => String(o).trim())
          : [],
        correctAnswer: String(item.correctAnswer || "").trim(),
        explanation: String(item.explanation || "").trim(),
        sourceType: "custom_bank",
        isCustom: true,
      };

      const check = hybridEngine.validateQuestionObject(normalizedQuestion);
      if (!check.valid) {
        errors.push(
          `Soal #${rowNum} (${id || "Tanpa ID"}): ${check.errors.join(", ")}`,
        );
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

  pickAdventureTopic(
    subject = "matematika",
    profile = null,
    explicitTopic = null,
  ) {
    if (explicitTopic && explicitTopic !== "semua") return explicitTopic;
    const subjKey = this.normalizeSubjectKey(subject);
    const allTopics = this.getTopicsBySubject(subjKey);

    if (profile && profile.topicPerformance) {
      const remedialTopics = Object.values(profile.topicPerformance)
        .filter(
          (tp) =>
            tp.subject === subjKey && (tp.needsReview || tp.wrong > tp.correct),
        )
        .map((tp) => tp.topic);

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

    const chosenTopic = this.pickAdventureTopic(subjKey, profile, topicFilter);
    const diffResolution = options.forceDifficulty
      ? {
          difficulty: options.forceDifficulty,
          mode:
            options.modeLabel || settings.difficultyMode || "level_adventure",
          reason: `Mengikuti tingkat kesulitan level (${options.forceDifficulty})`,
        }
      : hybridEngine.resolveTargetDifficulty({
          settings,
          profile,
          subject: subjKey,
          topic: chosenTopic,
        });

    const targetDiff = diffResolution.difficulty;
    const preferTemplateProb = subjKey === "matematika" ? 0.55 : 0.35;

    let selectedQuestion = null;

    if (Math.random() >= preferTemplateProb) {
      selectedQuestion =
        this.pickValidFromBank(subjKey, chosenTopic, targetDiff) ||
        this.pickValidFromBank(subjKey, null, targetDiff);
    }

    if (!selectedQuestion) {
      selectedQuestion =
        this.tryGenerateUniqueFromTemplate(subjKey, chosenTopic, targetDiff) ||
        this.tryGenerateUniqueFromTemplate(subjKey, null, targetDiff);
    }

    if (!selectedQuestion) {
      selectedQuestion = this.pickValidFromBank(subjKey, null, targetDiff);
    }

    if (!selectedQuestion) {
      selectedQuestion = this.pickValidFromBank(subjKey, null, null);
    }

    if (!selectedQuestion) {
      return {
        error: true,
        poolExhaustedError: true,
        message: `Stok soal unik untuk mata pelajaran ${this.formatSubjectDisplayName(subjKey)} (${targetDiff.toUpperCase()}) tidak mencukupi.`,
      };
    }

    this.usedQuestionIds.add(selectedQuestion.id);
    this.usedQuestionSignatures.add(selectedQuestion.question);

    return {
      ...selectedQuestion,
      difficulty: targetDiff,
      options: hybridEngine.shuffleArray(selectedQuestion.options),
      adaptiveMeta: diffResolution,
    };
  }

  tryGenerateUniqueFromTemplate(subject, topic, difficulty) {
    for (let attempt = 0; attempt < 12; attempt++) {
      const candidate = hybridEngine.generateFromTemplate({
        subject,
        topic,
        difficulty,
      });
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

  pickValidFromBank(subject, topic = null, difficulty = null) {
    const bank = this.getSubjectBank(subject);
    let pool = bank.filter(
      (q) =>
        !this.usedQuestionIds.has(q.id) &&
        !this.usedQuestionSignatures.has(q.question),
    );

    if (topic && topic !== "semua") {
      const byTopic = pool.filter(
        (q) => q.topic.toLowerCase() === topic.toLowerCase(),
      );
      if (byTopic.length > 0) pool = byTopic;
      else return null;
    }

    if (difficulty && difficulty !== "semua") {
      const byDiff = pool.filter(
        (q) => q.difficulty.toLowerCase() === difficulty.toLowerCase(),
      );
      if (byDiff.length > 0) pool = byDiff;
      else return null;
    }

    const shuffled = hybridEngine.shuffleArray(pool);
    for (const item of shuffled) {
      const normalized = {
        ...item,
        sourceType: item.sourceType || "question_bank",
      };
      const check = hybridEngine.validateQuestionObject(normalized);
      if (check.valid) {
        return normalized;
      }
    }
    return null;
  }

  getDuelQuestionPair({
    subject = "matematika",
    topic = "semua",
    difficulty = "adaptif",
    profile = null,
    settings = {},
  }) {
    const subjKey = this.normalizeSubjectKey(subject);
    const roundTopic =
      topic && topic !== "semua"
        ? topic
        : hybridEngine.pickRandom(this.getTopicsBySubject(subjKey));

    let roundDifficulty = difficulty;
    let adaptiveMeta = {
      mode: "manual",
      difficulty: roundDifficulty,
      reason: "Manual",
    };

    if (
      !roundDifficulty ||
      roundDifficulty === "adaptif" ||
      roundDifficulty === "semua"
    ) {
      adaptiveMeta = hybridEngine.resolveTargetDifficulty({
        settings: { ...settings, difficultyMode: "adaptif" },
        profile,
        subject: subjKey,
        topic: roundTopic,
      });
      roundDifficulty = adaptiveMeta.difficulty;
    }

    const tutorQ = this.getNextQuestion(subjKey, roundTopic, {
      profile,
      settings,
      forceDifficulty: roundDifficulty,
    });

    let studentQ = this.getNextQuestion(subjKey, tutorQ.topic || roundTopic, {
      profile,
      settings,
      forceDifficulty: tutorQ.difficulty || roundDifficulty,
    });

    if (studentQ.question === tutorQ.question) {
      const twin =
        this.tryGenerateUniqueFromTemplate(
          subjKey,
          tutorQ.topic || roundTopic,
          roundDifficulty,
        ) || this.pickValidFromBank(subjKey, null, null);
      if (twin) {
        this.usedQuestionIds.add(twin.id);
        this.usedQuestionSignatures.add(twin.question);
        studentQ = {
          ...twin,
          difficulty: roundDifficulty,
          options: hybridEngine.shuffleArray(twin.options),
          adaptiveMeta,
        };
      }
    }

    return {
      roundDifficulty: tutorQ.difficulty || roundDifficulty,
      roundTopic: tutorQ.topic || roundTopic,
      adaptiveMeta,
      tutorQuestion: tutorQ,
      studentQuestion: studentQ,
    };
  }
}

export const questionManager = new QuestionManager();
