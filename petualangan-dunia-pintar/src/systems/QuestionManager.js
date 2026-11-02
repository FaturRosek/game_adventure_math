import mathGrade3Data from "../data/mathGrade3.json";
import ipasGrade3Data from "../data/ipasGrade3.json";
import { db } from "../storage/db.js";

export class QuestionManager {
  constructor() {
    this.baseBanks = {
      matematika: [...mathGrade3Data],
      ipas: [...ipasGrade3Data],
    };
    this.banks = {
      matematika: [...mathGrade3Data],
      ipas: [...ipasGrade3Data],
    };
    this.usedQuestionIds = new Set();
  }

  async loadCustomQuestionsFromDB() {
    const customList = await db.getCustomQuestions();
    this.banks = {
      matematika: [...this.baseBanks.matematika],
      ipas: [...this.baseBanks.ipas],
    };

    const existingIds = new Set([
      ...this.banks.matematika.map((q) => q.id),
      ...this.banks.ipas.map((q) => q.id),
    ]);

    customList.forEach((q) => {
      if (!q || !q.id || existingIds.has(q.id)) return;
      const subjKey = String(q.subject || "").toLowerCase();
      if (subjKey === "ipas") {
        this.banks.ipas.push(q);
      } else {
        this.banks.matematika.push(q);
      }
      existingIds.add(q.id);
    });
  }

  resetSession() {
    this.usedQuestionIds.clear();
  }

  getSubjectBank(subject = "matematika") {
    const key = String(subject).toLowerCase();
    return this.banks[key] || this.banks.matematika;
  }

  getAllQuestionsCombined() {
    return [...this.banks.matematika, ...this.banks.ipas];
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
      bySubject: {
        matematika: { total: 0, mudah: 0, sedang: 0, sulit: 0, topics: {} },
        ipas: { total: 0, mudah: 0, sedang: 0, sulit: 0, topics: {} },
      },
    };

    ["matematika", "ipas"].forEach((subj) => {
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
    });

    return stats;
  }

  /**
   * Validasi dan impor array soal JSON dari Panel Tutor.
   * Menolak soal dengan struktur tidak lengkap atau ID duplikat.
   */
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

    const items = Array.isArray(parsed) ? parsed : [parsed];
    if (items.length === 0) {
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

    items.forEach((item, idx) => {
      const rowNum = idx + 1;
      if (!item || typeof item !== "object") {
        errors.push(`Baris #${rowNum}: Bukan objek soal yang valid.`);
        return;
      }

      const id = String(item.id || "").trim();
      const subject = String(item.subject || "").trim();
      const topic = String(item.topic || "").trim();
      const difficulty = String(item.difficulty || "")
        .trim()
        .toLowerCase();
      const question = String(item.question || "").trim();
      const correctAnswer = String(item.correctAnswer || "").trim();
      const explanation = String(item.explanation || "").trim();
      const options = item.options;

      if (
        !id ||
        !subject ||
        !topic ||
        !difficulty ||
        !question ||
        !correctAnswer ||
        !explanation
      ) {
        errors.push(
          `Soal #${rowNum} (${id || "Tanpa ID"}): Field wajib (id, subject, topic, difficulty, question, correctAnswer, explanation) harus lengkap.`,
        );
        return;
      }

      if (existingIds.has(id)) {
        skippedDuplicateCount += 1;
        return;
      }

      const subjLower = subject.toLowerCase();
      if (subjLower !== "matematika" && subjLower !== "ipas") {
        errors.push(
          `Soal ID "${id}": Mata pelajaran harus "Matematika" atau "IPAS".`,
        );
        return;
      }

      if (!["mudah", "sedang", "sulit"].includes(difficulty)) {
        errors.push(
          `Soal ID "${id}": Tingkat kesulitan harus mudah, sedang, atau sulit.`,
        );
        return;
      }

      if (!Array.isArray(options) || options.length < 2) {
        errors.push(
          `Soal ID "${id}": Pilihan jawaban (options) harus berupa array minimal 2 pilihan.`,
        );
        return;
      }

      const cleanOptions = options.map((o) => String(o).trim());
      if (!cleanOptions.includes(correctAnswer)) {
        errors.push(
          `Soal ID "${id}": Kunci jawaban (${correctAnswer}) tidak ditemukan di dalam pilihan options.`,
        );
        return;
      }

      const normalizedQuestion = {
        id,
        grade: Number(item.grade) || 3,
        subject: subjLower === "ipas" ? "IPAS" : "Matematika",
        topic,
        subtopic: String(item.subtopic || topic).trim(),
        difficulty,
        question,
        options: cleanOptions,
        correctAnswer,
        explanation,
        isCustom: true,
      };

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

  shuffleArray(arr) {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  getNextQuestion(subject = "matematika", topicFilter = null) {
    const bank = this.getSubjectBank(subject);
    let available = bank.filter((q) => !this.usedQuestionIds.has(q.id));

    if (topicFilter && topicFilter !== "semua") {
      const byTopic = available.filter(
        (q) => q.topic.toLowerCase() === topicFilter.toLowerCase(),
      );
      if (byTopic.length > 0) {
        available = byTopic;
      }
    }

    let poolExhaustedNotice = false;
    if (available.length === 0) {
      poolExhaustedNotice = true;
      this.usedQuestionIds.clear();
      available = [...bank];
    }

    const shuffledPool = this.shuffleArray(available);
    const picked = shuffledPool[0];
    this.usedQuestionIds.add(picked.id);

    return {
      ...picked,
      options: this.shuffleArray(picked.options),
      poolExhaustedNotice,
    };
  }

  getDuelQuestionPair({
    subject = "matematika",
    topic = "semua",
    difficulty = "semua",
  }) {
    const subjKey = String(subject).toLowerCase();
    const bank = this.getSubjectBank(subjKey);

    let candidates = bank.filter((q) => !this.usedQuestionIds.has(q.id));

    if (topic && topic !== "semua") {
      const topicMatches = candidates.filter(
        (q) => q.topic.toLowerCase() === topic.toLowerCase(),
      );
      if (topicMatches.length >= 2) {
        candidates = topicMatches;
      }
    }

    if (difficulty && difficulty !== "semua") {
      const diffMatches = candidates.filter(
        (q) => q.difficulty.toLowerCase() === difficulty.toLowerCase(),
      );
      if (diffMatches.length >= 2) {
        candidates = diffMatches;
      }
    }

    if (candidates.length < 2) {
      if (subjKey === "matematika") {
        return this.generateValidatedMathPair(topic, difficulty);
      } else {
        this.usedQuestionIds.clear();
        candidates = [...bank];
        if (topic && topic !== "semua") {
          const tMatch = candidates.filter(
            (q) => q.topic.toLowerCase() === topic.toLowerCase(),
          );
          if (tMatch.length >= 2) candidates = tMatch;
        }
      }
    }

    const shuffled = this.shuffleArray(candidates);
    const tutorQ = shuffled[0];
    this.usedQuestionIds.add(tutorQ.id);

    const studentPool = shuffled
      .slice(1)
      .filter((q) => q.id !== tutorQ.id && q.question !== tutorQ.question);

    const sameTopicAndDiff = studentPool.filter(
      (q) => q.topic === tutorQ.topic && q.difficulty === tutorQ.difficulty,
    );
    const sameTopicOnly = studentPool.filter((q) => q.topic === tutorQ.topic);
    const sameDiffOnly = studentPool.filter(
      (q) => q.difficulty === tutorQ.difficulty,
    );

    let studentQ = null;
    if (sameTopicAndDiff.length > 0) {
      studentQ = sameTopicAndDiff[0];
    } else if (sameTopicOnly.length > 0) {
      studentQ = sameTopicOnly[0];
    } else if (subjKey === "matematika") {
      studentQ = this.createEquivalentMathTwin(tutorQ);
    } else if (sameDiffOnly.length > 0) {
      studentQ = sameDiffOnly[0];
    } else {
      studentQ = studentPool[0];
    }

    this.usedQuestionIds.add(studentQ.id);

    return {
      tutorQuestion: {
        ...tutorQ,
        options: this.shuffleArray(tutorQ.options),
      },
      studentQuestion: {
        ...studentQ,
        options: this.shuffleArray(studentQ.options),
      },
    };
  }

  createEquivalentMathTwin(referenceQ) {
    const topic = referenceQ.topic;
    const diff = referenceQ.difficulty || "sedang";
    const uniqueId = `MTK3_DYN_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    if (topic === "Penjumlahan") {
      const a = 215 + Math.floor(Math.random() * 250);
      const b = 124 + Math.floor(Math.random() * 210);
      const ans = a + b;
      return {
        id: uniqueId,
        grade: 3,
        subject: "Matematika",
        topic: "Penjumlahan",
        subtopic: "Penjumlahan Bilangan Ratusan",
        difficulty: diff,
        question: `Hasil penjumlahan dari ${a} + ${b} adalah ...`,
        options: this.buildNumericOptions(ans, 10),
        correctAnswer: String(ans),
        explanation: `Jika dijumlahkan bersusun: ${a} + ${b} = ${ans}.`,
      };
    }

    if (topic === "Pengurangan") {
      const a = 540 + Math.floor(Math.random() * 320);
      const b = 185 + Math.floor(Math.random() * 220);
      const ans = a - b;
      return {
        id: uniqueId,
        grade: 3,
        subject: "Matematika",
        topic: "Pengurangan",
        subtopic: "Pengurangan Bilangan Ratusan",
        difficulty: diff,
        question: `Hasil pengurangan dari ${a} - ${b} adalah ...`,
        options: this.buildNumericOptions(ans, 10),
        correctAnswer: String(ans),
        explanation: `Jika dikurangkan bersusun: ${a} - ${b} = ${ans}.`,
      };
    }

    if (topic === "Perkalian") {
      const a = 11 + Math.floor(Math.random() * 8);
      const b = 4 + Math.floor(Math.random() * 5);
      const ans = a * b;
      return {
        id: uniqueId,
        grade: 3,
        subject: "Matematika",
        topic: "Perkalian",
        subtopic: "Perkalian Puluhan",
        difficulty: diff,
        question: `Hasil perkalian dari ${a} × ${b} adalah ...`,
        options: this.buildNumericOptions(ans, 6),
        correctAnswer: String(ans),
        explanation: `${a} dikalikan ${b} sama dengan ${ans}.`,
      };
    }

    if (topic === "Pembagian") {
      const divisor = 6 + Math.floor(Math.random() * 4);
      const quotient = 6 + Math.floor(Math.random() * 6);
      const dividend = divisor * quotient;
      return {
        id: uniqueId,
        grade: 3,
        subject: "Matematika",
        topic: "Pembagian",
        subtopic: "Pembagian Dasar",
        difficulty: diff,
        question: `Hasil pembagian dari ${dividend} : ${divisor} adalah ...`,
        options: this.buildNumericOptions(quotient, 1),
        correctAnswer: String(quotient),
        explanation: `Karena ${divisor} × ${quotient} = ${dividend}, maka ${dividend} : ${divisor} = ${quotient}.`,
      };
    }

    if (topic === "Bangun Datar") {
      const side = 8 + Math.floor(Math.random() * 9);
      const keliling = side * 4;
      return {
        id: uniqueId,
        grade: 3,
        subject: "Matematika",
        topic: "Bangun Datar",
        subtopic: "Keliling Persegi",
        difficulty: diff,
        question: `Sebuah papan tulis berbentuk persegi memiliki panjang sisi ${side} cm. Berapa cm keliling papan tulis tersebut?`,
        options: [
          `${keliling} cm`,
          `${side * 3} cm`,
          `${side * 2} cm`,
          `${keliling + 8} cm`,
        ],
        correctAnswer: `${keliling} cm`,
        explanation: `Keliling persegi = 4 × sisi = 4 × ${side} cm = ${keliling} cm.`,
      };
    }

    if (topic === "Pengukuran") {
      const meter = 2 + Math.floor(Math.random() * 5);
      const cmMore = (1 + Math.floor(Math.random() * 8)) * 10;
      const totalCm = meter * 100 + cmMore;
      return {
        id: uniqueId,
        grade: 3,
        subject: "Matematika",
        topic: "Pengukuran",
        subtopic: "Konversi Panjang",
        difficulty: diff,
        question: `Panjang pita Siti adalah ${meter} meter lebih ${cmMore} cm. Jika diubah ke sentimeter (cm), panjang pita Siti adalah ...`,
        options: [
          `${totalCm} cm`,
          `${meter * 10 + cmMore} cm`,
          `${totalCm + 100} cm`,
          `${meter}${cmMore}0 cm`,
        ],
        correctAnswer: `${totalCm} cm`,
        explanation: `${meter} meter = ${meter * 100} cm. Ditambah ${cmMore} cm menjadi ${totalCm} cm.`,
      };
    }

    const boxes = 4 + Math.floor(Math.random() * 4);
    const perBox = 12 + Math.floor(Math.random() * 5);
    const given = 5 + Math.floor(Math.random() * 6);
    const remain = boxes * perBox - given;
    return {
      id: uniqueId,
      grade: 3,
      subject: "Matematika",
      topic: referenceQ.topic || "Soal Cerita",
      subtopic: "Soal Cerita Hitung Campuran",
      difficulty: diff,
      question: `Ibu membeli ${boxes} kotak pensil. Setiap kotak berisi ${perBox} batang pensil. Jika ${given} pensil diberikan kepada adik, berapa sisa pensil Ibu?`,
      options: [
        `${remain} batang`,
        `${remain + 10} batang`,
        `${remain - 4} batang`,
        `${boxes * perBox} batang`,
      ],
      correctAnswer: `${remain} batang`,
      explanation: `Total pensil = ${boxes} × ${perBox} = ${boxes * perBox} batang. Dikurangi ${given} menjadi ${remain} batang.`,
    };
  }

  generateValidatedMathPair(topic = "semua", difficulty = "sedang") {
    const chosenTopic = topic && topic !== "semua" ? topic : "Penjumlahan";
    const baseRef = {
      topic: chosenTopic,
      difficulty: difficulty && difficulty !== "semua" ? difficulty : "sedang",
    };
    const q1 = this.createEquivalentMathTwin(baseRef);
    let q2 = this.createEquivalentMathTwin(baseRef);
    while (q2.question === q1.question) {
      q2 = this.createEquivalentMathTwin(baseRef);
    }
    return {
      tutorQuestion: { ...q1, options: this.shuffleArray(q1.options) },
      studentQuestion: { ...q2, options: this.shuffleArray(q2.options) },
    };
  }

  buildNumericOptions(correctNum, step = 5) {
    const set = new Set([String(correctNum)]);
    const offsets = [step, -step, step * 2, -step * 2, step + 2, -step - 1];
    for (const off of offsets) {
      const candidate = correctNum + off;
      if (candidate > 0) {
        set.add(String(candidate));
      }
      if (set.size >= 4) break;
    }
    return Array.from(set);
  }
}

export const questionManager = new QuestionManager();
