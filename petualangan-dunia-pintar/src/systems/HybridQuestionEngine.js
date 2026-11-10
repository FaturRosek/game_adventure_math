const NAMES_POOL = [
  "Budi",
  "Siti",
  "Rina",
  "Adi",
  "Edo",
  "Lani",
  "Dayu",
  "Beni",
  "Ayu",
  "Doni",
];

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
    this.bindoTemplates = this.registerBindoTemplates();
    this.bingTemplates = this.registerBingTemplates();
    this.pancasilaTemplates = this.registerPancasilaGrade3Templates();
    this.senirupaTemplates = this.registerSenirupaGrade3Templates();

    this.mathGrade4Templates = this.registerMathGrade4Templates();
    this.ipasGrade4Templates = this.registerIpasGrade4Templates();
    this.bindoGrade4Templates = this.registerBindoGrade4Templates();
    this.bingGrade4Templates = this.registerBingGrade4Templates();
    this.pancasilaGrade4Templates = this.registerPancasilaGrade4Templates();
    this.senirupaGrade4Templates = this.registerSenirupaGrade4Templates();
  }

  randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  pickRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
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
    grade = 3,
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

    const numGrade = Number(grade) || Number(profile.grade) || 3;
    const cleanSubj = String(subject)
      .toLowerCase()
      .replace(/^g\d+_/, "");
    const scopedSubj = numGrade === 3 ? cleanSubj : `g${numGrade}_${cleanSubj}`;
    let topicPerf = null;

    if (topic && topic !== "semua") {
      const key = `${scopedSubj}:${topic}`;
      topicPerf = profile.topicPerformance[key] || null;
    } else {
      const subjTopics = Object.entries(profile.topicPerformance)
        .filter(([k]) => k.startsWith(`${scopedSubj}:`))
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
            params: {},
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
            params: {},
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
            params: {},
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
            params: {},
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
            params: {},
          };
        },
      },
    ];
  }

  registerBindoTemplates() {
    return [
      {
        templateId: "TPL_BINDO3_SINONIM_ANTONIM",
        subject: "Bahasa Indonesia",
        topic: "Sinonim dan Antonim",
        subtopic: "Persamaan dan Lawan Kata",
        generate: (difficulty) => {
          const person = this.pickRandom(NAMES_POOL);
          const pairs = [
            {
              word: "Rajin",
              syn: "Giat",
              ant: "Malas",
              wrong: ["Tinggi", "Cepat", "Lambat"],
            },
            {
              word: "Gembira",
              syn: "Senang",
              ant: "Sedih",
              wrong: ["Marah", "Takut", "Lapar"],
            },
            {
              word: "Besar",
              syn: "Raksasa",
              ant: "Kecil",
              wrong: ["Panjang", "Lebar", "Jauh"],
            },
            {
              word: "Jauh",
              syn: "Renggang",
              ant: "Dekat",
              wrong: ["Tinggi", "Rendah", "Dalam"],
            },
            {
              word: "Hemat",
              syn: "Cermat",
              ant: "Boros",
              wrong: ["Kaya", "Miskin", "Dermawan"],
            },
          ];
          const p = this.pickRandom(pairs);
          const askAntonym = difficulty !== "mudah" && Math.random() > 0.45;

          if (askAntonym) {
            return {
              question: `${person} sedang mencari lawan kata (antonim) dari kata "${p.word}". Antonim dari kata "${p.word}" adalah ...`,
              options: this.shuffleArray([
                p.ant,
                p.syn,
                p.wrong[0],
                p.wrong[1],
              ]),
              correctAnswer: p.ant,
              explanation: `Antonim adalah lawan kata. Lawan kata dari "${p.word}" adalah "${p.ant}".`,
              params: {},
            };
          }

          return {
            question: `Persamaan kata (sinonim) dari kata "${p.word}" adalah ...`,
            options: this.shuffleArray([p.syn, p.ant, p.wrong[0], p.wrong[2]]),
            correctAnswer: p.syn,
            explanation: `Sinonim adalah persamaan makna kata. Persamaan kata dari "${p.word}" adalah "${p.syn}".`,
            params: {},
          };
        },
      },
      {
        templateId: "TPL_BINDO3_MENYUSUN_KALIMAT",
        subject: "Bahasa Indonesia",
        topic: "Menyusun Kalimat",
        subtopic: "Menyusun Kata Acak Menjadi Kalimat Padu",
        generate: () => {
          const person = this.pickRandom(NAMES_POOL);
          const templates = [
            {
              scrambled: `menyiram - ${person} - di taman - bunga`,
              correct: `${person} menyiram bunga di taman`,
              w1: `Bunga menyiram ${person} di taman`,
              w2: `Di taman bunga menyiram ${person}`,
              w3: `Menyiram ${person} bunga di taman`,
            },
            {
              scrambled: `di halaman - bermain - ${person} - sepeda`,
              correct: `${person} bermain sepeda di halaman`,
              w1: `Sepeda bermain ${person} di halaman`,
              w2: `Di halaman sepeda bermain ${person}`,
              w3: `Bermain ${person} di halaman sepeda`,
            },
            {
              scrambled: `membantu - mencuci piring - ${person} - ibu`,
              correct: `${person} membantu ibu mencuci piring`,
              w1: `Piring mencuci ${person} membantu ibu`,
              w2: `Mencuci piring ibu ${person} membantu`,
              w3: `Membantu piring ${person} mencuci ibu`,
            },
          ];
          const chosen = this.pickRandom(templates);
          return {
            question: `Susunlah kata-kata acak berikut menjadi kalimat yang benar: "${chosen.scrambled}"`,
            options: this.shuffleArray([
              chosen.correct,
              chosen.w1,
              chosen.w2,
              chosen.w3,
            ]),
            correctAnswer: chosen.correct,
            explanation: `Kalimat yang benar diawali Subjek (${person}) diikuti Predikat, Objek, dan Keterangan: "${chosen.correct}".`,
            params: {},
          };
        },
      },
      {
        templateId: "TPL_BINDO3_KAPITAL_TANDABACA",
        subject: "Bahasa Indonesia",
        topic: "Huruf Kapital dan Tanda Baca",
        subtopic: "Penggunaan Huruf Kapital Nama Orang dan Tempat",
        generate: () => {
          const person = this.pickRandom(NAMES_POOL);
          const kota = this.pickRandom([
            "Jakarta",
            "Bandung",
            "Surabaya",
            "Yogyakarta",
            "Malang",
          ]);
          const hari = this.pickRandom(["Senin", "Minggu", "Sabtu", "Jumat"]);

          const correct = `Pada hari ${hari}, ${person} pergi ke ${kota}.`;
          const w1 = `pada hari ${hari.toLowerCase()}, ${person.toLowerCase()} pergi ke ${kota.toLowerCase()}.`;
          const w2 = `Pada hari ${hari.toLowerCase()}, ${person} pergi ke ${kota.toLowerCase()}?`;
          const w3 = `pada Hari ${hari}, ${person.toLowerCase()} Pergi ke ${kota}!`;

          return {
            question: `Manakah kalimat di bawah ini yang menggunakan huruf kapital dan tanda baca dengan benar?`,
            options: this.shuffleArray([correct, w1, w2, w3]),
            correctAnswer: correct,
            explanation: `Huruf kapital digunakan pada awal kalimat (Pada), nama hari (${hari}), nama orang (${person}), dan nama kota (${kota}), serta diakhiri tanda titik (.).`,
            params: {},
          };
        },
      },
      {
        templateId: "TPL_BINDO3_TEKS_PENDEK",
        subject: "Bahasa Indonesia",
        topic: "Membaca dan Memahami Teks Pendek",
        subtopic: "Menemukan Informasi Bacaan",
        generate: () => {
          const person = this.pickRandom(NAMES_POOL);
          const stories = [
            {
              text: `Setiap sore pukul empat, ${person} memberi makan kelinci peliharaannya dengan sayur wortel segar.`,
              q: `Apa makanan yang diberikan ${person} kepada kelinci peliharaannya?`,
              ans: "Sayur wortel segar",
              opts: [
                "Sayur wortel segar",
                "Biji jagung kering",
                "Rumput laut",
                "Ikan goreng",
              ],
            },
            {
              text: `${person} membawa payung berwarna merah ke sekolah karena sejak pagi langit tampak mendung tebal.`,
              q: `Mengapa ${person} membawa payung ke sekolah?`,
              ans: "Karena sejak pagi langit tampak mendung tebal",
              opts: [
                "Karena sejak pagi langit tampak mendung tebal",
                "Karena ingin bermain hujan-hujanan di lapangan",
                "Karena disuruh oleh penjaga sekolah",
                "Karena cuaca sangat panas dan cerah",
              ],
            },
          ];
          const s = this.pickRandom(stories);
          return {
            question: `Bacalah teks berikut! "${s.text}" ${s.q}`,
            options: this.shuffleArray(s.opts),
            correctAnswer: s.ans,
            explanation: `Berdasarkan teks bacaan tersebut, jawabannya adalah: ${s.ans}.`,
            params: {},
          };
        },
      },
    ];
  }

  registerBingTemplates() {
    return [
      {
        templateId: "TPL_BING3_NUMBERS",
        subject: "Bahasa Inggris",
        topic: "Numbers",
        subtopic: "Numbers 1 to 100",
        generate: () => {
          const pairs = [
            { num: 7, word: "Seven", wrong: ["Six", "Eight", "Seventeen"] },
            { num: 12, word: "Twelve", wrong: ["Twenty", "Ten", "Two"] },
            {
              num: 19,
              word: "Nineteen",
              wrong: ["Ninety", "Nine", "Seventeen"],
            },
            { num: 20, word: "Twenty", wrong: ["Twelve", "Two", "Thirty"] },
            {
              num: 25,
              word: "Twenty-five",
              wrong: ["Fifty-two", "Fifteen", "Thirty-five"],
            },
            { num: 40, word: "Forty", wrong: ["Fourteen", "Four", "Fifty"] },
            {
              num: 100,
              word: "One hundred",
              wrong: ["One thousand", "Ten", "Ninety"],
            },
          ];
          const chosen = this.pickRandom(pairs);
          return {
            question: `Bahasa Inggris yang tepat untuk angka "${chosen.num}" adalah ...`,
            options: this.shuffleArray([chosen.word, ...chosen.wrong]),
            correctAnswer: chosen.word,
            explanation: `Angka ${chosen.num} dalam Bahasa Inggris ditulis dan dibaca "${chosen.word}".`,
            params: {},
          };
        },
      },
      {
        templateId: "TPL_BING3_COLORS_OBJECTS",
        subject: "Bahasa Inggris",
        topic: "Colors",
        subtopic: "Mengenal Warna dalam Bahasa Inggris",
        generate: () => {
          const person = this.pickRandom(NAMES_POOL);
          const colorFacts = [
            {
              obj: "pisang yang matang (ripe banana)",
              eng: "Yellow (Kuning)",
              wrong: ["Purple (Ungu)", "Blue (Biru)", "Black (Hitam)"],
            },
            {
              obj: "buah apel merah (red apple)",
              eng: "Red (Merah)",
              wrong: ["White (Putih)", "Blue (Biru)", "Grey (Abu-abu)"],
            },
            {
              obj: "susu putih (fresh milk)",
              eng: "White (Putih)",
              wrong: ["Black (Hitam)", "Green (Hijau)", "Red (Merah)"],
            },
            {
              obj: "daun segar di pohon (fresh leaf)",
              eng: "Green (Hijau)",
              wrong: ["Pink (Merah muda)", "Blue (Biru)", "White (Putih)"],
            },
          ];
          const c = this.pickRandom(colorFacts);
          return {
            question: `${person} melihat ${c.obj}. Warna benda tersebut dalam Bahasa Inggris adalah ...`,
            options: this.shuffleArray([c.eng, ...c.wrong]),
            correctAnswer: c.eng,
            explanation: `Warna ${c.obj} dalam Bahasa Inggris adalah ${c.eng}.`,
            params: {},
          };
        },
      },
      {
        templateId: "TPL_BING3_ANIMALS_FOOD",
        subject: "Bahasa Inggris",
        topic: "Animals",
        subtopic: "Vocabulary Hewan dan Cirinya",
        generate: () => {
          const items = [
            {
              desc: "Hewan ini suka melompat, bertelinga panjang, dan suka makan wortel (It has long ears and likes carrots)",
              ans: "Rabbit (Kelinci)",
              wrong: ["Fish (Ikan)", "Bird (Burung)", "Snake (Ular)"],
            },
            {
              desc: "Hewan ini bisa terbang tinggi di langit dan memiliki sayap (It has wings and can fly in the sky)",
              ans: "Bird (Burung)",
              wrong: ["Cow (Sapi)", "Cat (Kucing)", "Goat (Kambing)"],
            },
            {
              desc: "Hewan ternak ini menghasilkan susu segar dan berbunyi moo (It gives us milk)",
              ans: "Cow (Sapi)",
              wrong: ["Chicken (Ayam)", "Duck (Bebek)", "Ant (Semut)"],
            },
            {
              desc: "Hewan ini hidup di air dan berenang menggunakan sirip (It lives in water and can swim)",
              ans: "Fish (Ikan)",
              wrong: ["Monkey (Monyet)", "Horse (Kuda)", "Lion (Singa)"],
            },
          ];
          const it = this.pickRandom(items);
          return {
            question: `Tebaklah hewan berikut dalam Bahasa Inggris! "${it.desc}". Hewan apakah itu?`,
            options: this.shuffleArray([it.ans, ...it.wrong]),
            correctAnswer: it.ans,
            explanation: `Berdasarkan deskripsi tersebut, jawabannya adalah ${it.ans}.`,
            params: {},
          };
        },
      },
      {
        templateId: "TPL_BING3_SIMPLE_SENTENCES",
        subject: "Bahasa Inggris",
        topic: "Simple Sentences",
        subtopic: "Kalimat Sederhana tentang Kesukaan dan Kepemilikan",
        generate: () => {
          const person = this.pickRandom(NAMES_POOL);
          const sentences = [
            {
              indo: `${person} suka makan buah apel`,
              eng: `${person} likes to eat apples`,
              w1: `${person} sleeping in the classroom`,
              w2: `Apples like to eat ${person}`,
              w3: `${person} is a red apple`,
            },
            {
              indo: `Saya mempunyai sebuah tas sekolah baru`,
              eng: `I have a new school bag`,
              w1: `I am a school bag`,
              w2: `Bag have a new school I`,
              w3: `My school is a new bag`,
            },
            {
              indo: `Ini adalah buku cerita saya`,
              eng: `This is my story book`,
              w1: `That are my pencil`,
              w2: `Book is my this story`,
              w3: `I am a story book`,
            },
          ];
          const s = this.pickRandom(sentences);
          return {
            question: `Bahasa Inggris yang tepat untuk kalimat "${s.indo}" adalah ...`,
            options: this.shuffleArray([s.eng, s.w1, s.w2, s.w3]),
            correctAnswer: s.eng,
            explanation: `Terjemahan Bahasa Inggris yang tepat untuk "${s.indo}" adalah "${s.eng}".`,
            params: {},
          };
        },
      },
    ];
  }

  registerMathGrade4Templates() {
    return [
      {
        templateId: "TPL_MTK4_PENJUMLAHAN_RIBUAN",
        grade: 4,
        subject: "Matematika",
        topic: "Penjumlahan dan Pengurangan",
        subtopic: "Operasi Penjumlahan dan Pengurangan Ribuan",
        generate: (difficulty) => {
          const isSubtraction = difficulty !== "mudah" && Math.random() > 0.45;
          const person = this.pickRandom(NAMES_POOL);
          if (isSubtraction) {
            const a =
              difficulty === "sedang"
                ? this.randInt(4200, 6800)
                : this.randInt(6500, 9500);
            const b =
              difficulty === "sedang"
                ? this.randInt(1350, 2900)
                : this.randInt(2450, 5200);
            const ans = a - b;
            const correctStr = this.formatThousand(ans);
            const opts = [
              correctStr,
              this.formatThousand(ans + 100),
              this.formatThousand(ans - 100),
              this.formatThousand(ans + 20),
            ];
            return {
              question: `Gudang beras milik Paman ${person} menyimpan ${this.formatThousand(a)} kg beras. Sebanyak ${this.formatThousand(b)} kg beras dikirim ke pasar. Berapa kg beras yang tersisa di gudang?`,
              options: this.shuffleArray(opts),
              correctAnswer: correctStr,
              explanation: `Sisa beras = ${this.formatThousand(a)} - ${this.formatThousand(b)} = ${correctStr} kg.`,
              params: { a, b, ans },
            };
          }
          const a =
            difficulty === "mudah"
              ? this.randInt(1200, 3500)
              : this.randInt(3200, 5800);
          const b =
            difficulty === "mudah"
              ? this.randInt(1100, 2400)
              : this.randInt(2150, 3900);
          const ans = a + b;
          const correctStr = this.formatThousand(ans);
          const opts = [
            correctStr,
            this.formatThousand(ans + 100),
            this.formatThousand(ans - 100),
            this.formatThousand(ans + 10),
          ];
          return {
            question: `Hasil penjumlahan dari ${this.formatThousand(a)} + ${this.formatThousand(b)} adalah ...`,
            options: this.shuffleArray(opts),
            correctAnswer: correctStr,
            explanation: `Jika dijumlahkan bersusun: ${this.formatThousand(a)} + ${this.formatThousand(b)} = ${correctStr}.`,
            params: { a, b, ans },
          };
        },
      },
      {
        templateId: "TPL_MTK4_PERKALIAN_PEMBAGIAN",
        grade: 4,
        subject: "Matematika",
        topic: "Perkalian dan Pembagian",
        subtopic: "Perkalian dan Pembagian Dua Angka",
        generate: (difficulty) => {
          const isDivision = Math.random() > 0.5;
          const person = this.pickRandom(NAMES_POOL);
          const item = this.pickRandom(ITEMS_POOL);

          if (isDivision) {
            const divisor =
              difficulty === "mudah"
                ? this.randInt(6, 9)
                : this.randInt(11, 16);
            const quotient =
              difficulty === "mudah"
                ? this.randInt(11, 15)
                : this.randInt(12, 22);
            const dividend = divisor * quotient;
            const options = this.buildPlausibleNumericOptions(
              quotient,
              item.unit,
              [-2, 2, -4, 4, 1, -1],
            );
            return {
              question: `Panitia sekolah memiliki ${dividend} ${item.unit} ${item.name} yang akan dimasukkan sama banyak ke dalam ${divisor} ${item.container}. Berapa ${item.unit} isi setiap ${item.container}?`,
              options,
              correctAnswer: `${quotient} ${item.unit}`,
              explanation: `Karena ${divisor} × ${quotient} = ${dividend}, maka ${dividend} : ${divisor} = ${quotient} ${item.unit}.`,
              params: { dividend, divisor, quotient },
            };
          }

          const a =
            difficulty === "mudah"
              ? this.randInt(12, 19)
              : this.randInt(21, 36);
          const b =
            difficulty === "mudah" ? this.randInt(6, 9) : this.randInt(11, 18);
          const ans = a * b;
          const options = this.buildPlausibleNumericOptions(ans, item.unit, [
            -10,
            10,
            -b,
            b,
            12,
            -12,
          ]);
          return {
            question: `Toko buku membeli ${b} ${item.container} ${item.name}. Setiap ${item.container} berisi ${a} ${item.unit}. Berapa ${item.unit} jumlah seluruh ${item.name}?`,
            options,
            correctAnswer: `${ans} ${item.unit}`,
            explanation: `Total seluruhnya = ${b} × ${a} = ${ans} ${item.unit}.`,
            params: { a, b, ans },
          };
        },
      },
      {
        templateId: "TPL_MTK4_KELILING_LUAS",
        grade: 4,
        subject: "Matematika",
        topic: "Keliling dan Luas Bangun Datar",
        subtopic: "Menghitung Luas Persegi dan Persegi Panjang",
        generate: (difficulty) => {
          const p =
            difficulty === "mudah" ? this.randInt(7, 12) : this.randInt(13, 22);
          const l =
            difficulty === "mudah" ? this.randInt(4, 8) : this.randInt(9, 15);
          const luas = p * l;
          const keliling = 2 * (p + l);
          const options = this.buildPlausibleNumericOptions(luas, "cm²", [
            keliling - luas,
            10,
            -10,
            p,
            -l,
          ]);
          return {
            question: `Sebuah kertas karton berbentuk persegi panjang memiliki panjang ${p} cm dan lebar ${l} cm. Berapakah luas kertas karton tersebut?`,
            options,
            correctAnswer: `${luas} cm²`,
            explanation: `Luas persegi panjang = panjang × lebar = ${p} cm × ${l} cm = ${luas} cm².`,
            params: { p, l, luas },
          };
        },
      },
      {
        templateId: "TPL_MTK4_KELIPATAN_POLA",
        grade: 4,
        subject: "Matematika",
        topic: "Faktor dan Kelipatan",
        subtopic: "Kelipatan Bilangan",
        generate: () => {
          const base = this.randInt(4, 9);
          const seq = [base, base * 2, base * 3, base * 4];
          const nextVal = base * 5;
          const options = this.buildPlausibleNumericOptions(nextVal, "", [
            -2,
            2,
            base,
            -base,
            3,
          ]);
          return {
            question: `Perhatikan barisan bilangan kelipatan ${base} berikut: ${seq.join(", ")}, ... Bilangan kelipatan selanjutnya adalah ...`,
            options,
            correctAnswer: `${nextVal}`,
            explanation: `Kelipatan ke-5 dari ${base} adalah 5 × ${base} = ${nextVal}.`,
            params: { base, nextVal },
          };
        },
      },
    ];
  }

  registerIpasGrade4Templates() {
    return [
      {
        templateId: "TPL_IPAS4_GAYA",
        grade: 4,
        subject: "IPAS",
        topic: "Gaya dan Pengaruhnya terhadap Benda",
        subtopic: "Macam-macam Gaya dalam Kehidupan",
        generate: () => {
          const person = this.pickRandom(NAMES_POOL);
          const items = [
            {
              act: "menarik busur panah yang terbuat dari karet elastis",
              gaya: "Gaya pegas",
              info: "dihasilkan oleh benda yang lentur atau elastis",
            },
            {
              act: "mendekatkan magnet batang ke paku-paku besi kecil hingga menempel",
              gaya: "Gaya magnet",
              info: "tarikan atau dorongan yang dihasilkan oleh magnet terhadap benda logam tertentu",
            },
            {
              act: "mengerem sepeda yang sedang melaju di jalan beraspal",
              gaya: "Gaya gesek",
              info: "terjadi karena dua permukaan benda (kampas rem dan roda) saling bersentuhan",
            },
            {
              act: "mengangkat ember air dari dalam sumur menggunakan tangan",
              gaya: "Gaya otot",
              info: "menggunakan tenaga otot tubuh manusia",
            },
          ];
          const chosen = this.pickRandom(items);
          return {
            question: `Saat beraktivitas, ${person} ${chosen.act}. Jenis gaya yang bekerja pada kegiatan ${person} adalah ...`,
            options: this.shuffleArray([
              "Gaya pegas",
              "Gaya magnet",
              "Gaya gesek",
              "Gaya otot",
            ]),
            correctAnswer: chosen.gaya,
            explanation: `${chosen.gaya} adalah gaya yang ${chosen.info}.`,
            params: {},
          };
        },
      },
      {
        templateId: "TPL_IPAS4_EKOSISTEM",
        grade: 4,
        subject: "IPAS",
        topic: "Ekosistem dan Rantai Makanan",
        subtopic: "Peran Makhluk Hidup dalam Rantai Makanan",
        generate: () => {
          const chains = [
            {
              rantai: "Rumput -> Kelinci -> Ular -> Elang",
              tanya: "Kelinci",
              peran: "Konsumen tingkat I (Herbivora)",
            },
            {
              rantai: "Padi -> Tikus -> Ular -> Elang",
              tanya: "Padi",
              peran: "Produsen penghasil makanan",
            },
            {
              rantai: "Fitoplankton -> Ikan Kecil -> Ikan Besar -> Hiu",
              tanya: "Ikan Kecil",
              peran: "Konsumen tingkat I (Herbivora)",
            },
          ];
          const c = this.pickRandom(chains);
          return {
            question: `Perhatikan rantai makanan berikut: "${c.rantai}". Peran "${c.tanya}" pada rantai makanan tersebut adalah sebagai ...`,
            options: this.shuffleArray([
              "Produsen penghasil makanan",
              "Konsumen tingkat I (Herbivora)",
              "Konsumen puncak",
              "Benda mati tak hidup",
            ]),
            correctAnswer: c.peran,
            explanation: `Pada rantai makanan "${c.rantai}", ${c.tanya} berperan sebagai ${c.peran.toLowerCase()}.`,
            params: {},
          };
        },
      },
    ];
  }

  registerBindoGrade4Templates() {
    return [
      {
        templateId: "TPL_BINDO4_KATA_BAKU",
        grade: 4,
        subject: "Bahasa Indonesia",
        topic: "Kata Baku dan Tidak Baku",
        subtopic: "Memilih Kata Baku Sesuai KBBI",
        generate: () => {
          const pairs = [
            {
              baku: "aktif",
              tidakBaku: "aktip",
              kalimat: "Siswa kelas 4 sangat ... bertanya saat berdiskusi.",
            },
            {
              baku: "nasihat",
              tidakBaku: "nasehat",
              kalimat:
                "Kita harus mendengarkan ... yang diberikan oleh orang tua.",
            },
            {
              baku: "jadwal",
              tidakBaku: "jadual",
              kalimat:
                "Ketua kelas menempelkan ... piket kebersihan di dinding.",
            },
            {
              baku: "praktik",
              tidakBaku: "praktek",
              kalimat:
                "Hari ini siswa kelas 4 melakukan ... menanam kacang hijau.",
            },
          ];
          const p = this.pickRandom(pairs);
          return {
            question: `Lengkapilah kalimat berikut dengan kata baku yang tepat! "${p.kalimat}"`,
            options: this.shuffleArray([
              p.baku,
              p.tidakBaku,
              `${p.baku}s`,
              `${p.tidakBaku}an`,
            ]),
            correctAnswer: p.baku,
            explanation: `Penulisan kata baku yang tepat sesuai KBBI adalah "${p.baku}", bukan "${p.tidakBaku}".`,
            params: {},
          };
        },
      },
    ];
  }

  registerBingGrade4Templates() {
    return [
      {
        templateId: "TPL_BING4_DAILY_ROOMS",
        grade: 4,
        subject: "Bahasa Inggris",
        topic: "Rooms and Objects at Home",
        subtopic: "Activities in Different Rooms",
        generate: () => {
          const person = this.pickRandom(NAMES_POOL);
          const scenarios = [
            {
              act: "sleeps on a comfortable bed with a pillow and blanket",
              room: "Bedroom (Kamar tidur)",
            },
            {
              act: "takes a bath using soap and water",
              room: "Bathroom (Kamar mandi)",
            },
            {
              act: "cooks fried rice and boils water on the stove",
              room: "Kitchen (Dapur)",
            },
            {
              act: "welcomes guests on the sofa",
              room: "Living room (Ruang tamu)",
            },
          ];
          const s = this.pickRandom(scenarios);
          return {
            question: `${person} ${s.act}. Where is ${person}? (Di ruangan manakah ${person} berada?)`,
            options: this.shuffleArray([
              "Bedroom (Kamar tidur)",
              "Bathroom (Kamar mandi)",
              "Kitchen (Dapur)",
              "Living room (Ruang tamu)",
            ]),
            correctAnswer: s.room,
            explanation: `Kegiatan "${s.act}" dilakukan di ${s.room}.`,
            params: {},
          };
        },
      },
    ];
  }

  registerPancasilaGrade3Templates() {
    return [
      {
        templateId: "TPL_PPKN3_KASUS_SILAPANCASILA",
        grade: 3,
        subject: "Pendidikan Pancasila",
        topic: "Penerapan Nilai Pancasila",
        subtopic: "Analisis Tindakan Sesuai Sila Pancasila",
        generate: () => {
          const cases = [
            {
              question:
                "Saat jam istirahat, bekal makanan milik teman sebangkumu tidak sengaja terjatuh hingga tumpah seluruhnya. Tindakan yang paling mencerminkan nilai kemanusiaan pada sila kedua Pancasila adalah ...",
              correct:
                "Membantu membersihkan makanan yang tumpah dan berbagi sebagian bekal makanan kita dengannya",
              options: [
                "Membantu membersihkan makanan yang tumpah dan berbagi sebagian bekal makanan kita dengannya",
                "Membiarkannya kelaparan karena itu kesalahan dirinya sendiri yang kurang hati-hati",
                "Menceritakan kejadian tersebut sambil tertawa kepada teman-teman di kelas lain",
                "Meminta uang ganti rugi karena lantai dekat meja kita ikut menjadi kotor",
              ],
              explanation:
                "Menolong teman yang sedang mengalami musibah dan berbagi makanan merupakan wujud sikap peduli dan beradab sesuai sila kedua Pancasila.",
            },
            {
              question:
                "Di kelas terdapat siswa baru yang logat bicaranya berbeda karena berasal dari pulau lain. Beberapa anak tampak ragu untuk mengajaknya bermain. Sikap yang sebaiknya kamu lakukan untuk menjaga persatuan di kelas adalah ...",
              correct:
                "Menyapanya lebih dulu dengan ramah dan mengajaknya bermain bersama teman-teman lainnya",
              options: [
                "Menyapanya lebih dulu dengan ramah dan mengajaknya bermain bersama teman-teman lainnya",
                "Menirukan logat bicaranya sebagai bahan candaan agar suasana kelas ramai",
                "Hanya mau berbicara dengannya jika ia sudah bisa menghilangkan logat daerahnya",
                "Meminta guru memisahkan tempat duduk siswa baru tersebut di pojok belakang",
              ],
              explanation:
                "Menyambut teman tanpa memandang asal daerah dan menghargai logat bahasanya adalah wujud pengamalan sila ketiga, Persatuan Indonesia.",
            },
            {
              question:
                "Ketika memilih lagu daerah yang akan dinyanyikan kelompok untuk pentas kelas, tiga anggota memilih lagu A dan satu anggota memilih lagu B. Agar masalah selesai dengan rukun, cara yang tepat ditempuh kelompok tersebut adalah ...",
              correct:
                "Menyepakati lagu A untuk pentas kali ini secara mufakat dan berjanji menyanyikan lagu B pada latihan berikutnya",
              options: [
                "Menyepakati lagu A untuk pentas kali ini secara mufakat dan berjanji menyanyikan lagu B pada latihan berikutnya",
                "Membubarkan kelompok karena tidak semua anggota memiliki keinginan yang sama",
                "Memaksa anggota yang memilih lagu B untuk keluar dari kelompok",
                "Tidak jadi mengikuti pentas kelas agar tidak ada lagu yang dinyanyikan",
              ],
              explanation:
                "Musyawarah yang bijaksana menghargai semua usulan dan mencari jalan keluar bersama yang adil serta menjaga kerukunan.",
            },
          ];
          const chosen = this.pickRandom(cases);
          return {
            question: chosen.question,
            options: this.shuffleArray(chosen.options),
            correctAnswer: chosen.correct,
            explanation: chosen.explanation,
            params: {},
          };
        },
      },
      {
        templateId: "TPL_PPKN3_ATURAN_HAK_KEWAJIBAN",
        grade: 3,
        subject: "Pendidikan Pancasila",
        topic: "Hak dan Kewajiban Sederhana",
        subtopic: "Penalaran Sebab-Akibat Pelaksanaan Kewajiban",
        generate: () => {
          const cases = [
            {
              question:
                "Di rumah, ayah dan ibu memberikan hak kepada anak-anak untuk menonton televisi pada sore hari setelah selesai belajar. Mengapa kewajiban belajar harus didahulukan sebelum menuntut hak menonton televisi?",
              correct:
                "Agar tugas sekolah terselesaikan dengan baik dan waktu istirahat dapat dinikmati dengan tenang",
              options: [
                "Agar tugas sekolah terselesaikan dengan baik dan waktu istirahat dapat dinikmati dengan tenang",
                "Karena televisi di rumah hanya bisa menyala jika buku pelajaran sudah dibuka",
                "Supaya orang tua tidak ikut menonton acara televisi bersama anak-anak",
                "Karena belajar merupakan hukuman bagi anak yang suka menonton televisi",
              ],
              explanation:
                "Mendahulukan kewajiban sebelum menuntut hak melatih kedisiplinan dan tanggung jawab sebagai seorang pelajar.",
            },
            {
              question:
                "Perpustakaan sekolah memiliki aturan dilarang makan, minum, dan berbicara keras di ruang baca. Apa tujuan utama dibuatnya aturan tersebut bagi seluruh siswa?",
              correct:
                "Agar buku-buku tidak kotor/rusak terkena makanan dan semua siswa dapat membaca dengan konsentrasi",
              options: [
                "Agar buku-buku tidak kotor/rusak terkena makanan dan semua siswa dapat membaca dengan konsentrasi",
                "Agar siswa merasa takut dan tidak mau lagi berkunjung ke perpustakaan",
                "Supaya petugas perpustakaan bisa tidur siang tanpa diganggu siswa",
                "Karena makanan di kantin sekolah tidak boleh dibawa melewati pintu kelas",
              ],
              explanation:
                "Aturan di tempat fasilitas bersama bertujuan melindungi barang milik bersama (buku) dan menjaga hak orang lain untuk mendapatkan ketenangan.",
            },
          ];
          const chosen = this.pickRandom(cases);
          return {
            question: chosen.question,
            options: this.shuffleArray(chosen.options),
            correctAnswer: chosen.correct,
            explanation: chosen.explanation,
            params: {},
          };
        },
      },
    ];
  }

  registerPancasilaGrade4Templates() {
    return [
      {
        templateId: "TPL_PPKN4_NORMA_TANGGUNGJAWAB",
        grade: 4,
        subject: "Pendidikan Pancasila",
        topic: "Norma dan Aturan dalam Masyarakat",
        subtopic: "Analisis Penerapan Norma dan Tanggung Jawab Sosial",
        generate: () => {
          const cases = [
            {
              question:
                "Saat malam hari, warga kampung sepakat memberlakukan aturan mematikan suara musik atau televisi yang keras di atas pukul 21.00 malam. Nilai norma dan tanggung jawab apa yang terkandung dalam kesepakatan warga tersebut?",
              correct:
                "Menghormati hak tetangga untuk beristirahat dengan tenang dan menjaga keharmonisan lingkungan",
              options: [
                "Menghormati hak tetangga untuk beristirahat dengan tenang dan menjaga keharmonisan lingkungan",
                "Melarang warga memiliki televisi atau radio di dalam rumahnya masing-masing",
                "Membuat suasana kampung menjadi menakutkan ketika malam tiba",
                "Membatasi hak warga untuk berkumpul bersama keluarganya sendiri",
              ],
              explanation:
                "Hidup bermasyarakat menuntut kita membatasi kebebasan diri agar tidak mengganggu hak ketenangan dan kenyamanan tetangga sekitar.",
            },
            {
              question:
                "Dalam diskusi kelompok membahas rencana penghijauan sekolah, usulan tanaman yang disampaikan oleh salah satu anggota ternyata kurang cocok karena berduri tajam. Cara menyampaikan ketidaksetujuan yang sesuai dengan etika musyawarah Pancasila adalah ...",
              correct:
                "Menyampaikan alasan secara santun tanpa memotong pembicaraannya, lalu menawarkan alternatif tanaman lain yang lebih aman",
              options: [
                "Menyampaikan alasan secara santun tanpa memotong pembicaraannya, lalu menawarkan alternatif tanaman lain yang lebih aman",
                "Langsung membentak dan menyuruh teman tersebut diam karena usulnya berbahaya",
                "Menertawakan usulan tersebut bersama anggota lain hingga teman itu merasa malu",
                "Meninggalkan ruang diskusi karena tidak setuju dengan pendapat teman tersebut",
              ],
              explanation:
                "Etika bermusyawarah mengajarkan kita menghargai setiap pendapat, tidak memotong pembicaraan, dan menyampaikan saran secara sopan disertai alasan yang logis.",
            },
          ];
          const chosen = this.pickRandom(cases);
          return {
            question: chosen.question,
            options: this.shuffleArray(chosen.options),
            correctAnswer: chosen.correct,
            explanation: chosen.explanation,
            params: {},
          };
        },
      },
    ];
  }

  registerSenirupaGrade3Templates() {
    return [
      {
        templateId: "TPL_SR3_OBSERVASI_VISUAL",
        grade: 3,
        subject: "Seni Rupa",
        topic: "Warna Primer dan Pencampuran Warna",
        subtopic: "Pemecahan Masalah Pencampuran Warna dan Bentuk",
        generate: () => {
          const cases = [
            {
              question:
                "Saat menggambar buah jeruk matang yang segar, kamu ingin membuat warna ORANYE (Jingga), tetapi di kotak cat airmu hanya ada warna Merah, Kuning, dan Biru. Campuran manakah yang harus kamu buat di atas palet?",
              correct: "Mencampurkan warna Merah dan Kuning secara merata",
              options: [
                "Mencampurkan warna Merah dan Kuning secara merata",
                "Mencampurkan warna Biru dan Kuning secara merata",
                "Mencampurkan warna Merah dan Biru secara merata",
                "Mencampurkan ketiga warna primer sekaligus hingga menjadi cokelat gelap",
              ],
              explanation:
                "Warna sekunder Oranye (Jingga) dihasilkan dari pencampuran dua warna primer, yaitu Merah dan Kuning.",
            },
            {
              question:
                "Bayangkan kamu mengamati dua benda di ruang kelas: selembar kertas gambar yang tipis dan sebuah kotak tempat pensil dari kayu. Mengapa kotak pensil kayu disebut karya tiga dimensi sedangkan kertas gambar disebut dua dimensi?",
              correct:
                "Karena kotak pensil kayu memiliki ukuran panjang, lebar, tinggi, serta rongga ruang di dalamnya, sedangkan kertas hanya berupa bidang datar",
              options: [
                "Karena kotak pensil kayu memiliki ukuran panjang, lebar, tinggi, serta rongga ruang di dalamnya, sedangkan kertas hanya berupa bidang datar",
                "Karena kertas gambar warnanya putih sedangkan kotak pensil warnanya cokelat",
                "Karena kotak pensil kayu tidak bisa digambari dengan pensil warna",
                "Karena kertas gambar lebih berat daripada kotak pensil kayu",
              ],
              explanation:
                "Ciri utama benda tiga dimensi (3D) adalah memiliki ketebalan/tinggi dan volume ruang sehingga dapat dilihat dari berbagai sisi.",
            },
          ];
          const chosen = this.pickRandom(cases);
          return {
            question: chosen.question,
            options: this.shuffleArray(chosen.options),
            correctAnswer: chosen.correct,
            explanation: chosen.explanation,
            params: {},
          };
        },
      },
    ];
  }

  registerSenirupaGrade4Templates() {
    return [
      {
        templateId: "TPL_SR4_ANALISIS_TEKNIK_KOMPOSISI",
        grade: 4,
        subject: "Seni Rupa",
        topic: "Teknik Kolase, Montase, dan Mozaik",
        subtopic: "Analisis Perbandingan Teknik Tempel dan Komposisi",
        generate: () => {
          const cases = [
            {
              question:
                "Seorang siswa ingin membuat hiasan dinding bergambar burung hantu dengan menempelkan biji-bijian utuh yang beragam (biji jagung untuk sayap, kacang hijau untuk badan, dan beras merah untuk paruh) di atas kertas karton. Teknik berkarya seni rupa tempel yang digunakan siswa tersebut adalah ...",
              correct:
                "Teknik Kolase, karena memadukan berbagai jenis bahan berbeda yang ditempelkan pada permukaan pola gambar",
              options: [
                "Teknik Kolase, karena memadukan berbagai jenis bahan berbeda yang ditempelkan pada permukaan pola gambar",
                "Teknik Montase, karena menggunting foto-foto dari majalah bekas",
                "Teknik Pahat, karena mengurangi bahan keras menggunakan alat pahat",
                "Teknik Cetak Tinggi, karena menggunakan cetakan stempel tinta",
              ],
              explanation:
                "Kolase menggunakan bermacam-macam bahan berbeda (biji-bijian, daun kering, ranting, kain perca) yang dipadukan dan ditempel pada permukaan gambar.",
            },
            {
              question:
                "Dalam menggambar pemandangan di atas kertas, jika seluruh objek pohon, rumah, dan gunung hanya ditumpuk di pojok kiri bawah sementara sisa kertas sebelah kanan dibiarkan kosong melompong, maka gambar tersebut terasa kurang indah karena mengabaikan prinsip ...",
              correct:
                "Keseimbangan (Balance) dalam penyusunan komposisi bidang gambar",
              options: [
                "Keseimbangan (Balance) dalam penyusunan komposisi bidang gambar",
                "Pencampuran warna primer menjadi warna sekunder",
                "Penggunaan bahan daur ulang plastik",
                "Pembuatan karya patung tiga dimensi",
              ],
              explanation:
                "Prinsip keseimbangan (balance) mengatur tata letak objek di bidang gambar agar tidak berat sebelah antara sisi kiri, kanan, atas, dan bawah.",
            },
          ];
          const chosen = this.pickRandom(cases);
          return {
            question: chosen.question,
            options: this.shuffleArray(chosen.options),
            correctAnswer: chosen.correct,
            explanation: chosen.explanation,
            params: {},
          };
        },
      },
    ];
  }

  generateFromTemplate({ grade = 3, subject = 'matematika', topic = null, difficulty = 'sedang' }) {
    const numGrade = Number(grade) || 3;
    const subjKey = String(subject).toLowerCase().replace(/^g\d+_/, '');

    let pool = numGrade === 4 ? this.mathGrade4Templates : this.mathTemplates;
    if (subjKey === 'ipas') {
      pool = numGrade === 4 ? this.ipasGrade4Templates : this.ipasTemplates;
    } else if (subjKey === 'bahasa_indonesia' || subjKey === 'bahasa indonesia') {
      pool = numGrade === 4 ? this.bindoGrade4Templates : this.bindoTemplates;
    } else if (subjKey === 'bahasa_inggris' || subjKey === 'bahasa inggris') {
      pool = numGrade === 4 ? this.bingGrade4Templates : this.bingTemplates;
    } else if (subjKey === 'pendidikan_pancasila' || subjKey === 'pendidikan pancasila' || subjKey === 'ppkn') {
      pool = numGrade === 4 ? this.pancasilaGrade4Templates : this.pancasilaTemplates;
    } else if (subjKey === 'seni_rupa' || subjKey === 'seni rupa') {
      pool = numGrade === 4 ? this.senirupaGrade4Templates : this.senirupaTemplates;
    }

    let candidates = pool;
    if (topic && topic !== 'semua') {
      const matched = pool.filter((t) => t.topic.toLowerCase() === topic.toLowerCase());
      if (matched.length > 0) candidates = matched;
    }

    const chosenTemplate = this.pickRandom(candidates);
    const cleanDiff = ['mudah', 'sedang', 'sulit'].includes(difficulty) ? difficulty : 'sedang';
    const rawResult = chosenTemplate.generate(cleanDiff);

    const questionObj = {
      id: `${chosenTemplate.templateId}_${Date.now()}_${this.randInt(100, 999)}`,
      grade: numGrade,
      subject: chosenTemplate.subject,
      topic: chosenTemplate.topic,
      subtopic: chosenTemplate.subtopic,
      difficulty: cleanDiff,
      question: rawResult.question,
      options: rawResult.options,
      correctAnswer: rawResult.correctAnswer,
      explanation: rawResult.explanation,
      sourceType: 'template_generator',
      generatorParams: rawResult.params || {}
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

    if (!q.question || String(q.question).trim().length < 6) {
      errors.push("Teks pertanyaan tidak lengkap.");
    }

    const subj = String(q.subject || "").toLowerCase();
    const validSubjects = [
      'matematika',
      'ipas',
      'bahasa indonesia',
      'bahasa_indonesia',
      'bahasa inggris',
      'bahasa_inggris',
      'pendidikan pancasila',
      'pendidikan_pancasila',
      'ppkn',
      'seni rupa',
      'seni_rupa'
    ];
    if (!validSubjects.includes(subj)) {
      errors.push(`Mata pelajaran tidak didukung: ${q.subject}`);
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

  runAutomatedVerificationSuite(questionBanks = {}) {
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
      ...(questionBanks.bahasa_indonesia || []),
      ...(questionBanks.bahasa_inggris || []),
      ...(questionBanks.pendidikan_pancasila || []),
      ...(questionBanks.seni_rupa || [])
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
      "Validasi Question Bank (MTK, IPAS, B.Indo, B.Inggris)",
      bankInvalidCount === 0 && duplicateIdCount === 0,
      `${allBankQuestions.length} soal diperiksa, gagal: ${bankInvalidCount}, duplikat ID: ${duplicateIdCount}`,
    );

    const testTemplatePool = (poolName, subjectKey, tplArray) => {
      let okCount = 0;
      let total = 0;
      tplArray.forEach((tpl) => {
        ["mudah", "sedang", "sulit"].forEach((diff) => {
          total += 1;
          const q = this.generateFromTemplate({
            subject: subjectKey,
            topic: tpl.topic,
            difficulty: diff,
          });
          if (q && this.validateQuestionObject(q).valid) okCount += 1;
        });
      });
      recordCheck(
        `Generator ${poolName}`,
        okCount === total,
        `${okCount}/${total} variasi lulus validator`,
      );
    };

    testTemplatePool('Matematika', 'matematika', this.mathTemplates);
    testTemplatePool('IPAS', 'ipas', this.ipasTemplates);
    testTemplatePool('Bahasa Indonesia', 'bahasa_indonesia', this.bindoTemplates);
    testTemplatePool('Bahasa Inggris', 'bahasa_inggris', this.bingTemplates);
    testTemplatePool('Pendidikan Pancasila', 'pendidikan_pancasila', this.pancasilaTemplates);
    testTemplatePool('Seni Rupa', 'seni_rupa', this.senirupaTemplates);

    return report;
  }
}

export const hybridEngine = new HybridQuestionEngine();
