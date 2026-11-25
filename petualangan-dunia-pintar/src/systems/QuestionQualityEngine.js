const STOP_WORDS = new Set([
  "yang",
  "dan",
  "atau",
  "di",
  "ke",
  "dari",
  "pada",
  "untuk",
  "agar",
  "supaya",
  "dengan",
  "adalah",
  "yaitu",
  "sebuah",
  "suatu",
  "itu",
  "ini",
  "nya",
  "sangat",
  "lebih",
  "dapat",
  "bisa",
  "akan",
  "juga",
  "karena",
]);

export class QuestionQualityEngine {
  constructor() {
    this.sessionAnswerPosCounts = [0, 0, 0, 0];
  }

  resetSessionBalance() {
    this.sessionAnswerPosCounts = [0, 0, 0, 0];
  }

  shuffleArray(arr) {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  normalizeBalancedOptions(questionObj) {
    if (
      !questionObj ||
      !Array.isArray(questionObj.options) ||
      questionObj.options.length < 2
    ) {
      return questionObj;
    }

    const opts = questionObj.options.map((o) => String(o).trim());
    let correct = String(questionObj.correctAnswer || "").trim();

    const parenCount = opts.filter((o) => /\([^)]+\)/.test(o)).length;
    const correctHasParen = /\([^)]+\)/.test(correct);

    if (parenCount === 1 && correctHasParen) {
      const cleanedCorrect = correct.replace(/\s*\([^)]+\)\s*/g, "").trim();
      const cleanedOpts = opts.map((o) => (o === correct ? cleanedCorrect : o));
      if (
        new Set(cleanedOpts).size === cleanedOpts.length &&
        cleanedCorrect.length > 0
      ) {
        correct = cleanedCorrect;
        return { ...questionObj, options: cleanedOpts, correctAnswer: correct };
      }
    }

    return { ...questionObj, options: opts, correctAnswer: correct };
  }

  balanceAndShuffleMultipleChoice(questionObj) {
    const normalized = this.normalizeBalancedOptions(questionObj);
    const correct = normalized.correctAnswer;
    const distractors = this.shuffleArray(
      normalized.options.filter((opt) => opt !== correct),
    );

    if (distractors.length !== normalized.options.length - 1) {
      return {
        ...normalized,
        questionType: "multiple_choice",
        options: this.shuffleArray(normalized.options),
      };
    }

    const slotCount = normalized.options.length;
    const counts = this.sessionAnswerPosCounts.slice(0, slotCount);
    const minCount = Math.min(...counts);
    const candidateSlots = [];
    counts.forEach((c, idx) => {
      if (c <= minCount + 1) candidateSlots.push(idx);
    });

    const targetIndex =
      candidateSlots[Math.floor(Math.random() * candidateSlots.length)] ?? 0;

    const arranged = [];
    let dIdx = 0;
    for (let i = 0; i < slotCount; i++) {
      if (i === targetIndex) arranged.push(correct);
      else arranged.push(distractors[dIdx++]);
    }

    if (this.sessionAnswerPosCounts[targetIndex] !== undefined) {
      this.sessionAnswerPosCounts[targetIndex] += 1;
    }

    return {
      ...normalized,
      questionType: "multiple_choice",
      options: arranged,
      correctAnswer: correct,
    };
  }

  prepareMatchingQuestion(questionObj) {
    const pairs = (questionObj.pairs || []).map((p, idx) => ({
      id: p.id || `pair_${idx}`,
      left: String(p.left || "").trim(),
      right: String(p.right || "").trim(),
    }));

    const leftItems = this.shuffleArray(
      pairs.map((p) => ({ id: p.id, text: p.left })),
    );
    let rightItems = this.shuffleArray(
      pairs.map((p) => ({ id: p.id, text: p.right })),
    );

    if (leftItems.length > 1) {
      for (let attempt = 0; attempt < 8; attempt++) {
        const anyAligned = leftItems.some((l, i) => rightItems[i]?.id === l.id);
        if (!anyAligned) break;
        rightItems = this.shuffleArray(rightItems);
      }
      if (leftItems.every((l, i) => rightItems[i]?.id === l.id)) {
        rightItems.push(rightItems.shift());
      }
    }

    return {
      ...questionObj,
      questionType: "matching",
      pairs,
      leftItems,
      rightItems,
      correctAnswer: pairs.map((p) => `${p.left} = ${p.right}`).join(" | "),
    };
  }

  evaluateMatchingAnswer(userMappings, pairs) {
    let correctCount = 0;
    const details = pairs.map((p) => {
      const chosenRightId = userMappings[p.id] || null;
      const isMatch = chosenRightId === p.id;
      if (isMatch) correctCount += 1;
      return {
        pairId: p.id,
        left: p.left,
        expectedRight: p.right,
        chosenRightId,
        isMatch,
      };
    });

    return {
      isCorrect: correctCount === pairs.length && pairs.length > 0,
      correctCount,
      totalPairs: pairs.length,
      details,
    };
  }

  normalizeText(text) {
    return String(text || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  tokenizeMeaningful(text) {
    return this.normalizeText(text)
      .split(" ")
      .filter((w) => w.length > 0 && !STOP_WORDS.has(w));
  }

  levenshtein(a, b) {
    if (a === b) return 0;
    if (!a.length) return b.length;
    if (!b.length) return a.length;

    const dp = Array.from({ length: a.length + 1 }, () =>
      new Array(b.length + 1).fill(0),
    );
    for (let i = 0; i <= a.length; i++) dp[i][0] = i;
    for (let j = 0; j <= b.length; j++) dp[0][j] = j;

    for (let i = 1; i <= a.length; i++) {
      for (let j = 1; j <= b.length; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,
          dp[i][j - 1] + 1,
          dp[i - 1][j - 1] + cost,
        );
      }
    }
    return dp[a.length][b.length];
  }

  isWordFuzzyMatch(inputWord, targetWord) {
    if (inputWord === targetWord) return true;

    if (/^\d+$/.test(targetWord) || /^\d+$/.test(inputWord)) {
      return inputWord === targetWord;
    }

    if (targetWord.length <= 3) return inputWord === targetWord;
    if (targetWord.length <= 6)
      return this.levenshtein(inputWord, targetWord) <= 1;
    return this.levenshtein(inputWord, targetWord) <= 2;
  }

  evaluateEssayAnswer(rawUserInput, questionData) {
    const cleanInput = this.normalizeText(rawUserInput);
    if (!cleanInput) {
      return {
        isCorrect: false,
        feedback: "Silakan ketik jawabanmu terlebih dahulu, ya!",
      };
    }

    const acceptedList = [
      questionData.correctAnswer,
      ...(Array.isArray(questionData.acceptedAnswers)
        ? questionData.acceptedAnswers
        : []),
    ]
      .filter(Boolean)
      .map((a) => this.normalizeText(a));

    for (const acc of acceptedList) {
      if (cleanInput === acc) {
        return { isCorrect: true, feedback: "Jawabanmu tepat sekali!" };
      }
      const isPureNumeric = /^\d+(\s+[a-z]+)?$/.test(acc);
      if (!isPureNumeric && acc.length >= 5) {
        const maxDist = acc.length >= 10 ? 2 : 1;
        if (this.levenshtein(cleanInput, acc) <= maxDist) {
          return {
            isCorrect: true,
            feedback:
              "Jawabanmu benar! (Ada sedikit salah ketik, tidak apa-apa.)",
          };
        }
      }
    }

    const userTokens = this.tokenizeMeaningful(cleanInput);
    if (
      Array.isArray(questionData.requiredConcepts) &&
      questionData.requiredConcepts.length > 0
    ) {
      const allConceptsMet = questionData.requiredConcepts.every(
        (synonymGroup) => {
          const groupList = Array.isArray(synonymGroup)
            ? synonymGroup
            : [synonymGroup];
          return groupList.some((conceptPhrase) => {
            const phraseNorm = this.normalizeText(conceptPhrase);
            if (cleanInput.includes(phraseNorm)) return true;
            const phraseTokens = this.tokenizeMeaningful(phraseNorm);
            if (phraseTokens.length === 0) return false;
            return phraseTokens.every((pt) =>
              userTokens.some((ut) => this.isWordFuzzyMatch(ut, pt)),
            );
          });
        },
      );

      if (allConceptsMet) {
        return {
          isCorrect: true,
          feedback: "Bagus! Makna jawabanmu sudah sesuai dengan konsep materi!",
        };
      }
    }

    return {
      isCorrect: false,
      feedback:
        "Jawabanmu belum tepat. Coba baca kembali soalnya atau tekan tombol Clue untuk mendapat petunjuk!",
    };
  }

  buildProgressiveClues(questionData) {
    if (Array.isArray(questionData.clues) && questionData.clues.length >= 2) {
      return questionData.clues.slice(0, 3);
    }

    const ans = String(questionData.correctAnswer || "").trim();
    const words = ans.split(/\s+/).filter(Boolean);
    const firstLetter = ans ? ans[0].toUpperCase() : "?";

    return [
      `Ingat kembali materi tentang "${questionData.topic || "pelajaran ini"}".`,
      `Perhatikan kata kunci pada pertanyaan untuk menentukan konsep yang diminta.`,
      words.length > 1
        ? `Jawabannya terdiri dari ${words.length} kata dan diawali huruf "${firstLetter}".`
        : `Jawabannya terdiri dari 1 kata (${ans.length} huruf) yang diawali huruf "${firstLetter}".`,
    ];
  }

  prepareEssayQuestion(questionObj) {
    return {
      ...questionObj,
      questionType: "essay",
      clues: this.buildProgressiveClues(questionObj),
    };
  }
}

export const questionQualityEngine = new QuestionQualityEngine();
