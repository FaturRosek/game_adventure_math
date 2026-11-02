const NAMES_POOL = [
  "Budi",
  "Siti",
  "Rina",
  "Adi",
  "Edo",
  "Lani",
  "Dayu",
  "Beni",
  "ayu",
  "Doni",
].map((n) => n.charAt(0).toUpperCase() + n.slice(1));

const ITEMS_POOL = [
  { name: "apel", unit: "buah", container: "keranjang" },
  { name: "jeruk", unit: "buah", container: "kantong" },
  { name: "kelereng", unit: "butir", container: "kotak" },
  { name: "pensil", unit: "batang", container: "pak" },
  { name: "buku tulis", unit: "buah", container: "tumpuk" },
  { name: "roti cokelat", unit: "bungkus", container: "kotak" },
];

const DIFFICULTY_ORDER = ["mudah", "sedang", "sulit"];

export class HybridQuestionEngine {
  constructor() {
    this.mathTemplates = this.registerMathTemplates();
    this.ipasTemplates = this.registerIpasTemplates();
  }

  randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  pickRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  pickTwoDistinct(arr) {
    const shuffled = this.shuffleArray(arr);
    return [shuffled[0], shuffled[1]];
  }

  shuffleArray(arr) {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  formatThousand(num) {
    return Number(num).toLocaleString("id-ID");
  }

  buildPlausibleNumericOptions(
    correctVal,
    unit = "",
    offsets = [-10, 10, -5, 5, -2, 2, 12, -8, 1, -1],
  ) {
    const suffix = unit ? ` ${unit}` : "";
    const correctStr = `${correctVal}${suffix}`;
    const optionSet = new Set([correctStr]);

    for (const off of this.shuffleArray(offsets)) {
      const candidateNum = correctVal + off;
      if (candidateNum >= 0 && candidateNum !== correctVal) {
        optionSet.add(`${candidateNum}${suffix}`);
      }
      if (optionSet.size >= 4) break;
    }

    let step = 1;
    while (optionSet.size < 4) {
      const fallback = correctVal + step;
      if (fallback !== correctVal) {
        optionSet.add(`${fallback}${suffix}`);
      }
      step += 1;
    }

    return this.shuffleArray(Array.from(optionSet));
  }

  getAllowedDifficultyRange(rangeBound = "mudah-sulit") {
    if (rangeBound === "mudah-sedang") return ["mudah", "sedang"];
    if (rangeBound === "sedang-sulit") return ["sedang", "sulit"];
    return ["mudah", "sedang", "sulit"];
  }

  clampDifficultyToBound(difficulty, rangeBound = "mudah-sulit") {
    const allowed = this.getAllowedDifficultyRange(rangeBound);
    const cleanDiff = String(difficulty || "mudah").toLowerCase();
    if (allowed.includes(cleanDiff)) return cleanDiff;

    const idx = DIFFICULTY_ORDER.indexOf(cleanDiff);
    if (idx === -1) return allowed[0];
    if (idx < DIFFICULTY_ORDER.indexOf(allowed[0])) return allowed[0];
    return allowed[allowed.length - 1];
  }

  resolveTargetDifficulty({
    settings = {},
    profile = null,
    subject = "matematika",
    topic = null,
  }) {
    const mode = settings.difficultyMode || "adaptif";
    const manualLevel = settings.manualDifficulty || "sedang";
    const rangeBound = settings.adaptiveBounds || "mudah-sulit";
    const initialAdaptive = settings.initialAdaptiveDifficulty || "mudah";

    if (mode === "manual") {
      return {
        difficulty: ["mudah", "sedang", "sulit"].includes(manualLevel)
          ? manualLevel
          : "sedang",
        mode: "manual",
        reason: "Ditentukan secara manual oleh Tutor",
      };
    }

    const startDiff = this.clampDifficultyToBound(initialAdaptive, rangeBound);
    if (!profile || !profile.topicPerformance) {
      return {
        difficulty: startDiff,
        mode: "adaptif",
        reason: "Data awal adaptif (belum ada riwayat topik)",
      };
    }

    const subjKey = String(subject).toLowerCase();
    let topicPerf = null;

    if (topic && topic !== "semua") {
      const key = `${subjKey}:${topic}`;
      topicPerf = profile.topicPerformance[key] || null;
    } else {
      const subjTopics = Object.entries(profile.topicPerformance)
        .filter(([k]) => k.startsWith(`${subjKey}:`))
        .map(([, v]) => v);
      if (subjTopics.length > 0) {
        subjTopics.sort(
          (a, b) => (b.lastPlayedAt || 0) - (a.lastPlayedAt || 0),
        );
        topicPerf = subjTopics[0];
      }
    }

    if (
      !topicPerf ||
      !Array.isArray(topicPerf.recentResults) ||
      topicPerf.recentResults.length < 5
    ) {
      const currentSaved = topicPerf?.currentDifficulty
        ? this.clampDifficultyToBound(topicPerf.currentDifficulty, rangeBound)
        : startDiff;
      return {
        difficulty: currentSaved,
        mode: "adaptif",
        reason: `Menunggu minimal 5 soal pada topik ini (${topicPerf?.recentResults?.length || 0}/5)`,
      };
    }

    const recentWindow = topicPerf.recentResults.slice(-5);
    const correctCount = recentWindow.filter(Boolean).length;
    const accuracyPct = Math.round((correctCount / recentWindow.length) * 100);

    let currentDiff = topicPerf.currentDifficulty || startDiff;
    currentDiff = this.clampDifficultyToBound(currentDiff, rangeBound);
    const currIdx = DIFFICULTY_ORDER.indexOf(currentDiff);

    let nextDiff = currentDiff;
    let reason = `Akurasi 5 soal terakhir ${accuracyPct}% (Pertahankan tingkat ${currentDiff})`;

    if (accuracyPct >= 80 && currIdx < DIFFICULTY_ORDER.length - 1) {
      nextDiff = DIFFICULTY_ORDER[currIdx + 1];
      reason = `Akurasi ${accuracyPct}% (≥80% dari 5 soal) → Naik tingkat`;
    } else if (accuracyPct < 40 && currIdx > 0) {
      nextDiff = DIFFICULTY_ORDER[currIdx - 1];
      reason = `Akurasi ${accuracyPct}% (<40% dari 5 soal) → Turun tingkat & latihan penguatan`;
    }

    const clampedDiff = this.clampDifficultyToBound(nextDiff, rangeBound);
    return {
      difficulty: clampedDiff,
      mode: "adaptif",
      accuracyPct,
      reason,
    };
  }

  registerMathTemplates() {
    return [
      {
        templateId: "TPL_MTK3_BILANGAN",
        subject: "Matematika",
        topic: "Bilangan",
        subtopic: "Membaca dan Menulis Bilangan",
        generate: (difficulty) => {
          const ribuan =
            difficulty === "mudah" ? this.randInt(1, 4) : this.randInt(2, 9);
          const ratusan = difficulty === "sulit" ? 0 : this.randInt(1, 8);
          const puluhan = this.randInt(1, 9);
          const satuan = this.randInt(1, 9);
          const numberVal =
            ribuan * 1000 + ratusan * 100 + puluhan * 10 + satuan;

          const kataAngka = [
            "",
            "satu",
            "dua",
            "tiga",
            "empat",
            "lima",
            "enam",
            "tujuh",
            "delapan",
            "sembilan",
          ];
          const teksRibuan =
            ribuan === 1 ? "Seribu" : `${kataAngka[ribuan]} ribu`;
          const teksRatusan =
            ratusan === 0
              ? ""
              : ratusan === 1
                ? " seratus"
                : ` ${kataAngka[ratusan]} ratus`;
          const teksPuluhan =
            puluhan === 1 ? " sepuluh" : ` ${kataAngka[puluhan]} puluh`;
          const teksSatuan = ` ${kataAngka[satuan]}`;

          const kalimat =
            `${teksRibuan}${teksRatusan}${teksPuluhan}${teksSatuan}`.trim();
          const formattedCorrect = this.formatThousand(numberVal);

          const w1 = this.formatThousand(
            ribuan * 1000 + puluhan * 100 + ratusan * 10 + satuan,
          );
          const w2 = this.formatThousand(
            ribuan * 1000 + ratusan * 100 + satuan * 10 + puluhan,
          );
          const w3 = this.formatThousand(numberVal + 110);

          const optSet = new Set([formattedCorrect, w1, w2, w3]);
          let add = 10;
          while (optSet.size < 4) {
            optSet.add(this.formatThousand(numberVal + add));
            add += 10;
          }

          return {
            question: `Lambang bilangan dari "${kalimat.charAt(0).toUpperCase() + kalimat.slice(1)}" adalah ...`,
            options: this.shuffleArray(Array.from(optSet)),
            correctAnswer: formattedCorrect,
            explanation: `${ribuan * 1000} + ${ratusan * 100} + ${puluhan * 10} + ${satuan} ditulis menjadi ${formattedCorrect}.`,
            params: { ribuan, ratusan, puluhan, satuan, numberVal },
          };
        },
      },

      {
        templateId: "TPL_MTK3_NILAITEMPAT",
        subject: "Matematika",
        topic: "Nilai Tempat",
        subtopic: "Nilai Tempat Bilangan Empat Angka",
        generate: (difficulty) => {
          const digits = this.shuffleArray([2, 3, 4, 5, 6, 7, 8, 9]).slice(
            0,
            4,
          );
          const numVal =
            digits[0] * 1000 + digits[1] * 100 + digits[2] * 10 + digits[3];
          const formattedNum = this.formatThousand(numVal);
          const places = [
            { name: "Ribuan", val: digits[0] * 1000, digit: digits[0] },
            { name: "Ratusan", val: digits[1] * 100, digit: digits[1] },
            { name: "Puluhan", val: digits[2] * 10, digit: digits[2] },
            { name: "Satuan", val: digits[3], digit: digits[3] },
          ];
          const chosen = this.pickRandom(places);

          if (difficulty === "sulit") {
            const correctStr = this.formatThousand(chosen.val);
            const opts = places.map((p) => this.formatThousand(p.val));
            return {
              question: `Pada bilangan ${formattedNum}, nilai angka ${chosen.digit} adalah ...`,
              options: this.shuffleArray(opts),
              correctAnswer: correctStr,
              explanation: `Angka ${chosen.digit} pada bilangan ${formattedNum} menempati tempat ${chosen.name.toLowerCase()}, sehingga nilainya adalah ${correctStr}.`,
              params: { numVal, digit: chosen.digit },
            };
          }

          return {
            question: `Pada bilangan ${formattedNum}, angka ${chosen.digit} menempati nilai tempat ...`,
            options: this.shuffleArray([
              "Ribuan",
              "Ratusan",
              "Puluhan",
              "Satuan",
            ]),
            correctAnswer: chosen.name,
            explanation: `Pada ${formattedNum}: ${digits[0]} ribuan, ${digits[1]} ratusan, ${digits[2]} puluhan, dan ${digits[3]} satuan. Jadi angka ${chosen.digit} menempati tempat ${chosen.name}.`,
            params: { numVal, digit: chosen.digit },
          };
        },
      },

      {
        templateId: "TPL_MTK3_PENJUMLAHAN",
        subject: "Matematika",
        topic: "Penjumlahan",
        subtopic: "Penjumlahan Bilangan Ratusan",
        generate: (difficulty) => {
          const a =
            difficulty === "mudah"
              ? this.randInt(110, 350)
              : difficulty === "sedang"
                ? this.randInt(250, 580)
                : this.randInt(450, 890);
          const b =
            difficulty === "mudah"
              ? this.randInt(105, 240)
              : difficulty === "sedang"
                ? this.randInt(165, 390)
                : this.randInt(275, 650);
          const ans = a + b;
          const person = this.pickRandom(NAMES_POOL);
          const item = this.pickRandom(ITEMS_POOL);

          const useContext = difficulty !== "mudah" || Math.random() > 0.4;
          const question = useContext
            ? `${person} memiliki ${a} ${item.unit} ${item.name}. Ia membeli lagi ${b} ${item.unit} ${item.name}. Berapa ${item.unit} jumlah ${item.name} ${person} sekarang?`
            : `Hasil penjumlahan dari ${a} + ${b} adalah ...`;

          const unitLabel = useContext ? item.unit : "";
          const options = this.buildPlausibleNumericOptions(
            ans,
            unitLabel,
            [-10, 10, -20, 20, -1, 1, 9, -9],
          );
          const correctAnswer = unitLabel ? `${ans} ${unitLabel}` : `${ans}`;

          return {
            question,
            options,
            correctAnswer,
            explanation: `Jika dijumlahkan bersusun: ${a} + ${b} = ${ans}${unitLabel ? " " + unitLabel : ""}.`,
            params: { a, b, ans },
          };
        },
      },

      {
        templateId: "TPL_MTK3_PENGURANGAN",
        subject: "Matematika",
        topic: "Pengurangan",
        subtopic: "Pengurangan Bilangan Ratusan",
        generate: (difficulty) => {
          const a =
            difficulty === "mudah"
              ? this.randInt(350, 590)
              : difficulty === "sedang"
                ? this.randInt(520, 850)
                : this.randInt(710, 980);
          const b =
            difficulty === "mudah"
              ? this.randInt(110, 230)
              : difficulty === "sedang"
                ? this.randInt(235, 460)
                : this.randInt(345, 640);
          const ans = a - b;
          const person = this.pickRandom(NAMES_POOL);
          const item = this.pickRandom(ITEMS_POOL);

          const useContext = difficulty !== "mudah" || Math.random() > 0.4;
          const question = useContext
            ? `Di toko milik keluarga ${person} terdapat ${a} ${item.unit} ${item.name}. Hari ini terjual sebanyak ${b} ${item.unit}. Berapa ${item.unit} sisa ${item.name} sekarang?`
            : `Hasil pengurangan dari ${a} - ${b} adalah ...`;

          const unitLabel = useContext ? item.unit : "";
          const options = this.buildPlausibleNumericOptions(
            ans,
            unitLabel,
            [-10, 10, -12, 12, -2, 2, 8, -8],
          );
          const correctAnswer = unitLabel ? `${ans} ${unitLabel}` : `${ans}`;

          return {
            question,
            options,
            correctAnswer,
            explanation: `Pengurangan bersusun: ${a} - ${b} = ${ans}${unitLabel ? " " + unitLabel : ""}.`,
            params: { a, b, ans },
          };
        },
      },

      {
        templateId: "TPL_MTK3_PERKALIAN",
        subject: "Matematika",
        topic: "Perkalian",
        subtopic: "Perkalian Dasar dan Puluhan",
        generate: (difficulty) => {
          const a =
            difficulty === "mudah"
              ? this.randInt(4, 9)
              : difficulty === "sedang"
                ? this.randInt(11, 18)
                : this.randInt(16, 28);
          const b =
            difficulty === "mudah"
              ? this.randInt(3, 8)
              : difficulty === "sedang"
                ? this.randInt(4, 7)
                : this.randInt(6, 9);
          const ans = a * b;
          const person = this.pickRandom(NAMES_POOL);
          const item = this.pickRandom(ITEMS_POOL);

          const question = `${person} menyiapkan ${b} ${item.container} ${item.name}. Setiap ${item.container} berisi ${a} ${item.unit} ${item.name}. Berapa ${item.unit} seluruh ${item.name} milik ${person}?`;
          const options = this.buildPlausibleNumericOptions(ans, item.unit, [
            -b,
            b,
            -a,
            a,
            4,
            -4,
            10,
            -10,
          ]);

          return {
            question,
            options,
            correctAnswer: `${ans} ${item.unit}`,
            explanation: `Jumlah seluruhnya = ${b} × ${a} = ${ans} ${item.unit}.`,
            params: { a, b, ans },
          };
        },
      },

      {
        templateId: "TPL_MTK3_PEMBAGIAN",
        subject: "Matematika",
        topic: "Pembagian",
        subtopic: "Pembagian Tanpa Sisa",
        generate: (difficulty) => {
          const divisor =
            difficulty === "mudah"
              ? this.randInt(3, 6)
              : difficulty === "sedang"
                ? this.randInt(6, 9)
                : this.randInt(7, 12);
          const quotient =
            difficulty === "mudah"
              ? this.randInt(4, 9)
              : difficulty === "sedang"
                ? this.randInt(7, 12)
                : this.randInt(9, 16);
          const dividend = divisor * quotient;
          const person = this.pickRandom(NAMES_POOL);
          const item = this.pickRandom(ITEMS_POOL);

          const question = `${person} mempunyai ${dividend} ${item.unit} ${item.name} yang akan dibagikan sama banyak kepada ${divisor} orang temannya. Berapa ${item.unit} ${item.name} yang diterima setiap teman?`;
          const options = this.buildPlausibleNumericOptions(
            quotient,
            item.unit,
            [-1, 1, -2, 2, 3, -3, 4],
          );

          return {
            question,
            options,
            correctAnswer: `${quotient} ${item.unit}`,
            explanation: `Karena ${divisor} × ${quotient} = ${dividend}, maka ${dividend} : ${divisor} = ${quotient} ${item.unit}.`,
            params: { dividend, divisor, quotient },
          };
        },
      },

      {
        templateId: "TPL_MTK3_CAMPURAN",
        subject: "Matematika",
        topic: "Operasi Hitung Campuran",
        subtopic: "Penjumlahan dan Pengurangan Berantai",
        generate: (difficulty) => {
          const a =
            difficulty === "mudah"
              ? this.randInt(120, 250)
              : this.randInt(250, 480);
          const b =
            difficulty === "mudah"
              ? this.randInt(80, 160)
              : this.randInt(140, 290);
          const c =
            difficulty === "mudah"
              ? this.randInt(50, 120)
              : this.randInt(110, 260);
          const ans = a + b - c;

          const options = this.buildPlausibleNumericOptions(
            ans,
            "",
            [-10, 10, -15, 15, -5, 5, 20],
          );
          return {
            question: `Hasil dari operasi hitung ${a} + ${b} - ${c} adalah ...`,
            options,
            correctAnswer: `${ans}`,
            explanation: `Kerjakan urut dari kiri: ${a} + ${b} = ${a + b}. Lalu dikurangi ${c}: ${a + b} - ${c} = ${ans}.`,
            params: { a, b, c, ans },
          };
        },
      },

      {
        templateId: "TPL_MTK3_PECAHAN",
        subject: "Matematika",
        topic: "Pecahan Sederhana",
        subtopic: "Mengenal Pecahan Bagian Utuh",
        generate: (difficulty) => {
          const penyebutList =
            difficulty === "mudah" ? [3, 4, 5, 6] : [6, 8, 9, 10, 12];
          const penyebut = this.pickRandom(penyebutList);
          const pembilang = this.randInt(1, penyebut - 2);
          const sisa = penyebut - pembilang;
          const person = this.pickRandom(NAMES_POOL);
          const makanan = this.pickRandom([
            "kue bolu",
            "pizza",
            "martabak manis",
            "cokelat batang",
            "semangka",
          ]);

          const askRemaining = difficulty === "sulit";
          const targetTop = askRemaining ? sisa : pembilang;
          const correctStr = `${targetTop}/${penyebut}`;

          const candidates = new Set([
            correctStr,
            `${penyebut}/${targetTop}`,
            `${askRemaining ? pembilang : sisa}/${penyebut}`,
            `${targetTop}/${penyebut + 2}`,
            `${Math.max(1, targetTop + 1)}/${penyebut}`,
          ]);

          const options = this.shuffleArray(Array.from(candidates).slice(0, 4));
          if (!options.includes(correctStr)) options[0] = correctStr;

          const question = askRemaining
            ? `Sebuah ${makanan} dipotong menjadi ${penyebut} bagian sama besar. ${person} memakan ${pembilang} bagian. Pecahan yang menyatakan SISA ${makanan} yang belum dimakan adalah ...`
            : `Sebuah ${makanan} dipotong menjadi ${penyebut} bagian sama besar. ${person} mengambil ${pembilang} potong. Bagian yang diambil ${person} bernilai pecahan ...`;

          return {
            question,
            options: this.shuffleArray(options),
            correctAnswer: correctStr,
            explanation: askRemaining
              ? `Sisa bagian adalah ${penyebut} - ${pembilang} = ${sisa} potong dari ${penyebut} bagian keseluruhan, sehingga ditulis ${correctStr}.`
              : `${pembilang} potong dari total ${penyebut} bagian sama besar ditulis sebagai pecahan ${correctStr}.`,
            params: { pembilang, penyebut, targetTop },
          };
        },
      },

      {
        templateId: "TPL_MTK3_PENGUKURAN",
        subject: "Matematika",
        topic: "Pengukuran",
        subtopic: "Konversi Panjang dan Berat",
        generate: (difficulty) => {
          const person = this.pickRandom(NAMES_POOL);
          const isWeight = Math.random() > 0.5;

          if (isWeight) {
            const kg =
              difficulty === "mudah" ? this.randInt(1, 4) : this.randInt(2, 7);
            const gramExtra =
              difficulty === "mudah" ? 500 : this.randInt(1, 9) * 100;
            const totalGram = kg * 1000 + gramExtra;
            const correctStr = `${this.formatThousand(totalGram)} gram`;

            const optSet = new Set([
              correctStr,
              `${this.formatThousand(kg * 100 + gramExtra)} gram`,
              `${this.formatThousand(totalGram + 500)} gram`,
              `${this.formatThousand(kg * 1000 + gramExtra / 10)} gram`,
            ]);

            return {
              question: `Ibu ${person} membeli ${kg} kg beras dan ${gramExtra} gram kacang hijau. Berapa gram total berat belanjaan Ibu ${person}?`,
              options: this.shuffleArray(Array.from(optSet)),
              correctAnswer: correctStr,
              explanation: `1 kg = 1.000 gram, maka ${kg} kg = ${this.formatThousand(kg * 1000)} gram. Ditambah ${gramExtra} gram = ${correctStr}.`,
              params: { kg, gramExtra, totalGram },
            };
          }

          const meter =
            difficulty === "mudah" ? this.randInt(1, 4) : this.randInt(3, 9);
          const cmExtra =
            this.randInt(1, 8) * 10 + (difficulty === "sulit" ? 5 : 0);
          const totalCm = meter * 100 + cmExtra;
          const options = this.buildPlausibleNumericOptions(totalCm, "cm", [
            -100,
            100,
            -50,
            20,
            -(meter * 90),
          ]);

          return {
            question: `Panjang bambu milik Ayah ${person} adalah ${meter} meter lebih ${cmExtra} cm. Panjang bambu tersebut jika dinyatakan seluruhnya dalam sentimeter (cm) adalah ...`,
            options,
            correctAnswer: `${totalCm} cm`,
            explanation: `1 meter = 100 cm, maka ${meter} meter = ${meter * 100} cm. Ditambah ${cmExtra} cm menjadi ${totalCm} cm.`,
            params: { meter, cmExtra, totalCm },
          };
        },
      },

      {
        templateId: "TPL_MTK3_BANGUNDATAR",
        subject: "Matematika",
        topic: "Bangun Datar",
        subtopic: "Keliling Persegi dan Persegi Panjang",
        generate: (difficulty) => {
          const isRectangle = difficulty !== "mudah" && Math.random() > 0.4;
          const benda = this.pickRandom([
            "kebun sayur",
            "kolam ikan",
            "papan tulis",
            "bingkai foto",
            "halaman bermain",
          ]);
          const unit =
            benda === "papan tulis" || benda === "bingkai foto"
              ? "cm"
              : "meter";

          if (isRectangle) {
            const panjang = this.randInt(8, 18);
            const lebar = this.randInt(4, panjang - 2);
            const keliling = 2 * (panjang + lebar);
            const options = this.buildPlausibleNumericOptions(keliling, unit, [
              -(panjang + lebar),
              panjang * lebar - keliling,
              4,
              -4,
              6,
            ]);
            return {
              question: `Sebuah ${benda} berbentuk persegi panjang memiliki ukuran panjang ${panjang} ${unit} dan lebar ${lebar} ${unit}. Berapa ${unit} keliling ${benda} tersebut?`,
              options,
              correctAnswer: `${keliling} ${unit}`,
              explanation: `Keliling persegi panjang = 2 × (panjang + lebar) = 2 × (${panjang} + ${lebar}) = ${keliling} ${unit}.`,
              params: { panjang, lebar, keliling },
            };
          }

          const sisi =
            difficulty === "mudah" ? this.randInt(5, 12) : this.randInt(13, 25);
          const keliling = 4 * sisi;
          const options = this.buildPlausibleNumericOptions(keliling, unit, [
            -sisi,
            sisi,
            -(sisi * 2),
            4,
            -4,
            8,
          ]);
          return {
            question: `Sebuah ${benda} berbentuk persegi memiliki panjang sisi ${sisi} ${unit}. Berapa ${unit} keliling ${benda} tersebut?`,
            options,
            correctAnswer: `${keliling} ${unit}`,
            explanation: `Persegi memiliki 4 sisi sama panjang. Keliling = 4 × ${sisi} ${unit} = ${keliling} ${unit}.`,
            params: { sisi, keliling },
          };
        },
      },

      {
        templateId: "TPL_MTK3_SOALCERITA",
        subject: "Matematika",
        topic: "Soal Cerita",
        subtopic: "Soal Cerita Hitung Campuran Sehari-hari",
        generate: (difficulty) => {
          const person = this.pickRandom(NAMES_POOL);
          const item = this.pickRandom(ITEMS_POOL);
          const boxes =
            difficulty === "mudah" ? this.randInt(3, 5) : this.randInt(5, 8);
          const perBox =
            difficulty === "mudah" ? this.randInt(6, 10) : this.randInt(11, 16);
          const givenAway =
            difficulty === "mudah" ? this.randInt(4, 9) : this.randInt(8, 18);
          const total = boxes * perBox;
          const remaining = total - givenAway;

          const options = this.buildPlausibleNumericOptions(
            remaining,
            item.unit,
            [givenAway, -5, 5, 10, -10],
          );

          return {
            question: `${person} membeli ${boxes} ${item.container} ${item.name}. Setiap ${item.container} berisi ${perBox} ${item.unit} ${item.name}. Jika sebanyak ${givenAway} ${item.unit} diberikan kepada tetangga, berapa ${item.unit} sisa ${item.name} milik ${person}?`,
            options,
            correctAnswer: `${remaining} ${item.unit}`,
            explanation: `Total awal = ${boxes} × ${perBox} = ${total} ${item.unit}. Dikurangi yang diberikan: ${total} - ${givenAway} = ${remaining} ${item.unit}.`,
            params: { boxes, perBox, givenAway, remaining },
          };
        },
      },
    ];
  }

  registerIpasTemplates() {
    return [
      {
        templateId: "TPL_IPAS3_MAKLUKHIDUP",
        subject: "IPAS",
        topic: "Ciri-ciri dan Kebutuhan Makhluk Hidup",
        subtopic: "Alat Pernapasan Hewan",
        generate: () => {
          const person = this.pickRandom(NAMES_POOL);
          const facts = [
            {
              hewan: "ikan mas di kolam",
              alat: "Insang",
              info: "menyerap oksigen yang terlarut di dalam air",
            },
            {
              hewan: "kucing peliharaan",
              alat: "Paru-paru",
              info: "menghirup oksigen dari udara seperti mamalia lainnya",
            },
            {
              hewan: "belalang di halaman rumput",
              alat: "Trakea",
              info: "saluran-saluran halus pada tubuh serangga",
            },
            {
              hewan: "cacing tanah di kebun",
              alat: "Permukaan kulit",
              info: "kulit yang selalu lembap untuk pertukaran udara",
            },
          ];
          const chosen = this.pickRandom(facts);
          const allTools = ["Insang", "Paru-paru", "Trakea", "Permukaan kulit"];

          return {
            question: `Saat mengamati ${chosen.hewan}, ${person} ingin mencatat alat pernapasan hewan tersebut. Alat pernapasan ${chosen.hewan} adalah ...`,
            options: this.shuffleArray(allTools),
            correctAnswer: chosen.alat,
            explanation: `Hewan ${chosen.hewan} bernapas menggunakan ${chosen.alat.toLowerCase()} untuk ${chosen.info}.`,
            params: { hewan: chosen.hewan, alat: chosen.alat },
          };
        },
      },
      {
        templateId: "TPL_IPAS3_WUJUD",
        subject: "IPAS",
        topic: "Perubahan Wujud Benda",
        subtopic: "Perubahan Wujud dalam Kehidupan Sehari-hari",
        generate: () => {
          const person = this.pickRandom(NAMES_POOL);
          const scenarios = [
            {
              desc: `meletakkan cokelat batang dan mentega di atas wajan hangat hingga berubah menjadi cair`,
              proses: "Mencair",
              detail:
                "perubahan wujud benda padat menjadi benda cair karena menerima panas",
            },
            {
              desc: `memasukkan kantong berisi air sirup ke dalam freezer kulkas hingga menjadi es lilin yang keras`,
              proses: "Membeku",
              detail:
                "perubahan wujud benda cair menjadi benda padat karena melepaskan panas (didinginkan)",
            },
            {
              desc: `menjemur handuk basah di bawah terik matahari sampai airnya hilang dan handuk menjadi kering`,
              proses: "Menguap",
              detail:
                "perubahan wujud benda cair menjadi gas (uap air) karena terkena panas",
            },
            {
              desc: `melihat titik-titik air di bagian luar gelas yang berisi air es dingin`,
              proses: "Mengembun",
              detail:
                "perubahan wujud gas (uap air di udara) menjadi titik-titik air karena suhu dingin",
            },
          ];
          const chosen = this.pickRandom(scenarios);
          return {
            question: `Di rumah, ${person} ${chosen.desc}. Peristiwa perubahan wujud benda yang diamati ${person} disebut ...`,
            options: this.shuffleArray([
              "Mencair",
              "Membeku",
              "Menguap",
              "Mengembun",
            ]),
            correctAnswer: chosen.proses,
            explanation: `${chosen.proses} adalah ${chosen.detail}.`,
            params: { proses: chosen.proses },
          };
        },
      },
      {
        templateId: "TPL_IPAS3_ENERGI",
        subject: "IPAS",
        topic: "Energi dan Pemanfaatannya",
        subtopic: "Perubahan Bentuk Energi di Rumah",
        generate: () => {
          const person = this.pickRandom(NAMES_POOL);
          const devices = [
            {
              alat: "setrika listrik",
              ubah: "Energi listrik menjadi energi panas",
              manfaat: "merapikan pakaian yang kusut",
            },
            {
              alat: "kipas angin listrik",
              ubah: "Energi listrik menjadi energi gerak",
              manfaat: "menggerakkan baling-baling agar ruangan sejuk",
            },
            {
              alat: "lampu belajar",
              ubah: "Energi listrik menjadi energi cahaya",
              manfaat: "menerangi meja saat membaca buku",
            },
            {
              alat: "bel listrik sekolah",
              ubah: "Energi listrik menjadi energi bunyi",
              manfaat: "memberi tanda waktu masuk dan istirahat",
            },
          ];
          const chosen = this.pickRandom(devices);
          const allOptions = devices.map((d) => d.ubah);

          return {
            question: `Keluarga ${person} menyalakan ${chosen.alat} untuk ${chosen.manfaat}. Perubahan bentuk energi yang terjadi pada ${chosen.alat} adalah ...`,
            options: this.shuffleArray(allOptions),
            correctAnswer: chosen.ubah,
            explanation: `Pada ${chosen.alat}, terjadi perubahan ${chosen.ubah.toLowerCase()} untuk ${chosen.manfaat}.`,
            params: { alat: chosen.alat },
          };
        },
      },
      {
        templateId: "TPL_IPAS3_SIFATBENDA",
        subject: "IPAS",
        topic: "Benda dan Sifat-sifatnya",
        subtopic: "Klasifikasi Wujud Benda",
        generate: () => {
          const person = this.pickRandom(NAMES_POOL);
          const groups = [
            {
              contoh: "buku tulis, batu kerikil, dan meja kayu",
              wujud: "Benda Padat",
              sifat: "bentuk dan ukurannya selalu tetap walau dipindahkan",
            },
            {
              contoh: "air minum, minyak goreng, dan susu cair",
              wujud: "Benda Cair",
              sifat:
                "bentuknya berubah-ubah mengikuti wadahnya dan mengalir ke tempat lebih rendah",
            },
            {
              contoh: "udara di dalam balon dan angin yang berembus",
              wujud: "Benda Gas",
              sifat: "mengisi seluruh ruangan yang ditempatinya",
            },
          ];
          const chosen = this.pickRandom(groups);

          return {
            question: `${person} mengelompokkan ${chosen.contoh} ke dalam satu kelompok yang sama. Benda-benda tersebut termasuk kelompok ...`,
            options: this.shuffleArray([
              "Benda Padat",
              "Benda Cair",
              "Benda Gas",
              "Benda Cahaya",
            ]),
            correctAnswer: chosen.wujud,
            explanation: `${chosen.contoh.charAt(0).toUpperCase() + chosen.contoh.slice(1)} adalah ${chosen.wujud.toLowerCase()} karena ${chosen.sifat}.`,
            params: { wujud: chosen.wujud },
          };
        },
      },
      {
        templateId: "TPL_IPAS3_EKONOMI",
        subject: "IPAS",
        topic: "Aktivitas Ekonomi Sederhana",
        subtopic: "Pekerjaan Menghasilkan Barang dan Jasa",
        generate: () => {
          const jobs = [
            {
              profesi: "dokter dan guru sekolah",
              jenis: "Menghasilkan jasa (pelayanan)",
              detail: "memberikan layanan kesehatan dan pendidikan",
            },
            {
              profesi: "petani padi dan nelayan ikan",
              jenis: "Menghasilkan barang (benda kebutuhan)",
              detail: "menghasilkan bahan pangan berupa beras dan ikan segar",
            },
            {
              profesi: "tukang cukur rambut dan sopir bus",
              jenis: "Menghasilkan jasa (pelayanan)",
              detail:
                "memberikan layanan merapikan rambut dan mengantar penumpang",
            },
            {
              profesi: "pengrajin meja kayu dan pembuat roti",
              jenis: "Menghasilkan barang (benda kebutuhan)",
              detail: "membuat produk perabot dan makanan yang dapat dibeli",
            },
          ];
          const chosen = this.pickRandom(jobs);
          const opts = [
            "Menghasilkan jasa (pelayanan)",
            "Menghasilkan barang (benda kebutuhan)",
            "Menghasilkan cuaca alami",
            "Tidak memiliki manfaat ekonomi",
          ];

          return {
            question: `Pekerjaan sebagai ${chosen.profesi} di masyarakat termasuk jenis aktivitas ekonomi yang ...`,
            options: this.shuffleArray(opts),
            correctAnswer: chosen.jenis,
            explanation: `Profesi ${chosen.profesi} bekerja untuk ${chosen.detail}, sehingga termasuk pekerjaan yang ${chosen.jenis.toLowerCase()}.`,
            params: { profesi: chosen.profesi },
          };
        },
      },
    ];
  }

  generateFromTemplate({
    subject = "matematika",
    topic = null,
    difficulty = "sedang",
  }) {
    const subjKey = String(subject).toLowerCase();
    const pool = subjKey === "ipas" ? this.ipasTemplates : this.mathTemplates;

    let candidates = pool;
    if (topic && topic !== "semua") {
      const matched = pool.filter(
        (t) => t.topic.toLowerCase() === topic.toLowerCase(),
      );
      if (matched.length > 0) candidates = matched;
    }

    const chosenTemplate = this.pickRandom(candidates);
    const cleanDiff = ["mudah", "sedang", "sulit"].includes(difficulty)
      ? difficulty
      : "sedang";
    const rawResult = chosenTemplate.generate(cleanDiff);

    const questionObj = {
      id: `${chosenTemplate.templateId}_${Date.now()}_${this.randInt(100, 999)}`,
      grade: 3,
      subject: chosenTemplate.subject,
      topic: chosenTemplate.topic,
      subtopic: chosenTemplate.subtopic,
      difficulty: cleanDiff,
      question: rawResult.question,
      options: rawResult.options,
      correctAnswer: rawResult.correctAnswer,
      explanation: rawResult.explanation,
      sourceType: "template_generator",
      generatorParams: rawResult.params || {},
    };

    const validation = this.validateQuestionObject(questionObj);
    if (!validation.valid) {
      return null;
    }
    return questionObj;
  }

  validateQuestionObject(q) {
    const errors = [];
    if (!q || typeof q !== "object") {
      return { valid: false, errors: ["Objek soal kosong atau bukan objek."] };
    }

    if (!q.id || String(q.id).trim().length === 0) {
      errors.push("ID soal kosong.");
    }

    if (!q.question || String(q.question).trim().length < 8) {
      errors.push("Teks pertanyaan tidak lengkap.");
    }

    const subj = String(q.subject || "").toLowerCase();
    if (!["matematika", "ipas"].includes(subj)) {
      errors.push(`Mata pelajaran tidak didukung pada tahap ini: ${q.subject}`);
    }
    if (!q.topic || String(q.topic).trim().length === 0) {
      errors.push("Topik soal kosong.");
    }

    const diff = String(q.difficulty || "").toLowerCase();
    if (!["mudah", "sedang", "sulit"].includes(diff)) {
      errors.push(`Tingkat kesulitan tidak valid: ${q.difficulty}`);
    }
    if (!q.correctAnswer || String(q.correctAnswer).trim().length === 0) {
      errors.push("Kunci jawaban kosong.");
    }

    if (!Array.isArray(q.options) || q.options.length < 2) {
      errors.push("Pilihan jawaban kurang dari 2 opsi.");
    } else {
      const normalizedOpts = q.options.map((o) => String(o).trim());
      const uniqueOpts = new Set(normalizedOpts);
      if (uniqueOpts.size !== normalizedOpts.length) {
        errors.push("Terdapat pilihan jawaban yang duplikat.");
      }

      const matchCount = normalizedOpts.filter(
        (o) => o === String(q.correctAnswer).trim(),
      ).length;
      if (matchCount !== 1) {
        errors.push(
          `Kunci jawaban harus tepat 1 di dalam pilihan (ditemukan: ${matchCount}).`,
        );
      }
    }

    if (q.sourceType === "template_generator" && q.generatorParams) {
      for (const [k, v] of Object.entries(q.generatorParams)) {
        if (typeof v === "number" && (!Number.isFinite(v) || Number.isNaN(v))) {
          errors.push(`Parameter generator "${k}" tidak valid (NaN/Infinite).`);
        }
      }
    }

    if (!q.explanation || String(q.explanation).trim().length < 5) {
      errors.push("Pembahasan soal kosong atau terlalu pendek.");
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  runAutomatedVerificationSuite(questionBanks = { matematika: [], ipas: [] }) {
    const report = {
      passed: true,
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      details: [],
    };

    const recordCheck = (name, ok, info = "") => {
      report.totalTests += 1;
      if (ok) {
        report.passedTests += 1;
      } else {
        report.failedTests += 1;
        report.passed = false;
      }
      report.details.push({ name, ok, info });
    };

    const allBankQuestions = [
      ...(questionBanks.matematika || []),
      ...(questionBanks.ipas || []),
    ];
    let bankInvalidCount = 0;
    const seenBankIds = new Set();
    let duplicateIdCount = 0;

    allBankQuestions.forEach((q) => {
      if (seenBankIds.has(q.id)) duplicateIdCount += 1;
      seenBankIds.add(q.id);
      const res = this.validateQuestionObject({
        ...q,
        sourceType: q.sourceType || "question_bank",
      });
      if (!res.valid) bankInvalidCount += 1;
    });

    recordCheck(
      "Validasi Question Bank (MTK & IPAS)",
      bankInvalidCount === 0 && duplicateIdCount === 0,
      `${allBankQuestions.length} soal diperiksa, gagal: ${bankInvalidCount}, duplikat ID: ${duplicateIdCount}`,
    );

    let mathGenSuccess = 0;
    let mathGenTotal = 0;
    this.mathTemplates.forEach((tpl) => {
      ["mudah", "sedang", "sulit"].forEach((diff) => {
        mathGenTotal += 1;
        const q = this.generateFromTemplate({
          subject: "matematika",
          topic: tpl.topic,
          difficulty: diff,
        });
        if (q && this.validateQuestionObject(q).valid) {
          mathGenSuccess += 1;
        }
      });
    });

    recordCheck(
      "Template Generator Matematika (11 Topik x 3 Kesulitan)",
      mathGenSuccess === mathGenTotal,
      `${mathGenSuccess}/${mathGenTotal} variasi soal berhasil dibuat & lulus validator 9-poin`,
    );

    let ipasGenSuccess = 0;
    let ipasGenTotal = 0;
    this.ipasTemplates.forEach((tpl) => {
      ["mudah", "sedang", "sulit"].forEach((diff) => {
        ipasGenTotal += 1;
        const q = this.generateFromTemplate({
          subject: "ipas",
          topic: tpl.topic,
          difficulty: diff,
        });
        if (q && this.validateQuestionObject(q).valid) {
          ipasGenSuccess += 1;
        }
      });
    });

    recordCheck(
      "Controlled Template Generator IPAS",
      ipasGenSuccess === ipasGenTotal,
      `${ipasGenSuccess}/${ipasGenTotal} variasi kontekstual IPAS valid dan akurat`,
    );

    const mockProfileUp = {
      topicPerformance: {
        "matematika:Perkalian": {
          currentDifficulty: "mudah",
          recentResults: [true, true, true, true, false],
        },
      },
    };
    const resUp = this.resolveTargetDifficulty({
      settings: { difficultyMode: "adaptif", adaptiveBounds: "mudah-sulit" },
      profile: mockProfileUp,
      subject: "matematika",
      topic: "Perkalian",
    });

    const mockProfileBound = {
      topicPerformance: {
        "matematika:Perkalian": {
          currentDifficulty: "sedang",
          recentResults: [true, true, true, true, true],
        },
      },
    };
    const resBound = this.resolveTargetDifficulty({
      settings: { difficultyMode: "adaptif", adaptiveBounds: "mudah-sedang" },
      profile: mockProfileBound,
      subject: "matematika",
      topic: "Perkalian",
    });

    recordCheck(
      "Aturan Adaptif (≥80% Naik Tingkat & Batas Tutor)",
      resUp.difficulty === "sedang" && resBound.difficulty === "sedang",
      `80% dari Mudah → ${resUp.difficulty} | Batas Mudah-Sedang saat 100% → tetap ${resBound.difficulty}`,
    );

    return report;
  }
}

export const hybridEngine = new HybridQuestionEngine();
