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
    this.grade1Templates = this.registerGrade1Templates();
    this.grade2Templates = this.registerGrade2Templates();

    this.mathTemplates = this.registerMathTemplates();
    this.ipasTemplates = this.registerIpasTemplates();
    this.bindoTemplates = this.registerBindoTemplates();
    this.bingTemplates = this.registerBingTemplates();
    this.pancasilaTemplates = this.registerPancasilaGrade3Templates();
    this.senirupaTemplates = this.registerSenirupaGrade3Templates();
    this.paiTemplates = this.registerPaiGrade3Templates();
    this.maduraTemplates = this.registerMaduraGrade3Templates();
    this.pjokTemplates = this.registerPjokGrade3Templates();

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
        templateId: "TPL_IPAS3_BAB1_INDRA",
        grade: 3,
        subject: "IPAS",
        topic: "Bab 1 — Panca Indraku",
        subtopic: "Bentuk dan fungsi organ indra",
        generate: (difficulty) => {
          const pool = {
            mudah: [
              {
                question:
                  "Ketika menyentuh permukaan es batu yang dingin dan selimut yang lembut, pancaindra yang membantu kita merasakan perbedaan suhu dan tekstur tersebut adalah ...",
                correctAnswer: "Kulit (indra peraba)",
                options: [
                  "Kulit (indra peraba)",
                  "Telinga (indra pendengar)",
                  "Hidung (indra pembau)",
                  "Mata (indra penglihat)",
                ],
                explanation:
                  "Kulit memiliki ujung saraf peraba yang peka terhadap sentuhan halus, kasar, panas, dan dingin.",
              },
            ],
            sedang: [
              {
                question:
                  "Saat cahaya matahari di luar ruangan terlalu silau, bagian hitam di tengah mata (pupil) secara otomatis mengecil. Tujuan pupil mengecil saat cahaya terang adalah ...",
                correctAnswer:
                  "Mengatur agar cahaya yang masuk ke dalam mata tidak terlalu banyak sehingga mata terlindungi",
                options: [
                  "Mengatur agar cahaya yang masuk ke dalam mata tidak terlalu banyak sehingga mata terlindungi",
                  "Menghentikan seluruh cahaya agar mata tidak bisa melihat apa pun",
                  "Mengubah warna benda di sekitar menjadi gelap",
                  "Membantu telinga mendengar suara lebih nyaring",
                ],
                explanation:
                  "Pupil berfungsi mengatur banyaknya cahaya yang masuk ke mata; ia mengecil saat terang dan melebar saat redup.",
              },
            ],
            sulit: [
              {
                question:
                  "Rudi sering mendengarkan musik menggunakan earphone dengan volume sangat keras dalam waktu lama. Risiko kesehatan yang dapat terjadi pada organ pendengarannya adalah ...",
                correctAnswer:
                  "Gendang telinga dan saraf pendengaran dapat terganggu sehingga kemampuan mendengar menurun",
                options: [
                  "Gendang telinga dan saraf pendengaran dapat terganggu sehingga kemampuan mendengar menurun",
                  "Daun telinga akan berubah bentuk menjadi kotak",
                  "Indra pengecap di lidah tidak bisa merasakan manis lagi",
                  "Telinga menjadi mampu menangkap suara dari luar angkasa",
                ],
                explanation:
                  "Bunyi terlalu keras dalam waktu lama dapat merusak gendang telinga dan sel pendengaran, sehingga volume suara harus dijaga tetap aman.",
              },
            ],
          };
          const chosen = this.pickRandom(pool[difficulty] || pool.sedang);
          return {
            question: chosen.question,
            options: this.shuffleArray(chosen.options),
            correctAnswer: chosen.correctAnswer,
            explanation: chosen.explanation,
            params: { chapter: "Bab 1 — Panca Indraku" },
          };
        },
      },
      {
        templateId: "TPL_IPAS3_BAB2_DAHULU_KINI",
        grade: 3,
        subject: "IPAS",
        topic: "Bab 2 — Dahulu, Kini, dan Nanti",
        subtopic: "Perkembangan sosial dan budaya",
        generate: (difficulty) => {
          const pool = {
            mudah: [
              {
                question:
                  "Dahulu banyak orang memasak nasi menggunakan tungku kayu bakar, sedangkan sekarang banyak keluarga menggunakan penanak nasi listrik (rice cooker). Hal ini merupakan contoh perkembangan dalam ...",
                correctAnswer: "Peralatan rumah tangga sehari-hari",
                options: [
                  "Peralatan rumah tangga sehari-hari",
                  "Bentuk silsilah keluarga",
                  "Siklus hidup tumbuhan",
                  "Jumlah pancaindra manusia",
                ],
                explanation:
                  "Perubahan dari tungku kayu ke penanak nasi listrik adalah contoh perkembangan teknologi peralatan sehari-hari.",
              },
            ],
            sedang: [
              {
                question:
                  'Sebuah kampung yang dahulu terkenal dengan banyak perajin gerabah dari tanah liat dinamai "Kampung Gerabah". Hal tersebut menunjukkan bahwa nama tempat dapat mencerminkan ...',
                correctAnswer:
                  "Kegiatan mata pencaharian atau keahlian khas warga setempat",
                options: [
                  "Kegiatan mata pencaharian atau keahlian khas warga setempat",
                  "Daftar pelajaran sekolah dasar di kota lain",
                  "Cuaca hujan yang turun satu kali dalam setahun",
                  "Jumlah kendaraan yang lewat pada hari Minggu",
                ],
                explanation:
                  "Asal-usul nama tempat sering berkaitan dengan sejarah, ciri alam, atau keahlian khas masyarakat di wilayah tersebut.",
              },
            ],
            sulit: [
              {
                question:
                  "Perubahan teknologi membuat kita mudah membeli makanan lewat aplikasi, tetapi juga bisa membuat orang jarang bertegur sapa dengan tetangga. Sikap bijak menghadapi perubahan tersebut adalah ...",
                correctAnswer:
                  "Tetap menggunakan teknologi secara seimbang sambil menjaga kebiasaan ramah dan gotong royong bersama tetangga",
                options: [
                  "Tetap menggunakan teknologi secara seimbang sambil menjaga kebiasaan ramah dan gotong royong bersama tetangga",
                  "Melarang semua orang menggunakan telepon genggam di lingkungan rumah",
                  "Tidak perlu mengenal tetangga lagi karena semua bisa dipesan lewat gawai",
                  "Menganggap tradisi gotong royong sudah tidak penting di masa kini",
                ],
                explanation:
                  "Kemajuan teknologi sebaiknya dimanfaatkan untuk kemudahan hidup tanpa menghilangkan nilai kerukunan dan kepedulian sosial.",
              },
            ],
          };
          const chosen = this.pickRandom(pool[difficulty] || pool.sedang);
          return {
            question: chosen.question,
            options: this.shuffleArray(chosen.options),
            correctAnswer: chosen.correctAnswer,
            explanation: chosen.explanation,
            params: { chapter: "Bab 2 — Dahulu, Kini, dan Nanti" },
          };
        },
      },
      {
        templateId: "TPL_IPAS3_BAB3_PERJALANANKU",
        grade: 3,
        subject: "IPAS",
        topic: "Bab 3 — Perjalananku",
        subtopic: "Gizi seimbang",
        generate: (difficulty) => {
          const pool = {
            mudah: [
              {
                question:
                  "Telur, ikan, tahu, dan tempe merupakan kelompok lauk pauk yang kaya protein. Manfaat utama protein bagi anak yang sedang tumbuh adalah ...",
                correctAnswer:
                  "Membantu pertumbuhan tubuh dan memperbaiki sel tubuh yang rusak",
                options: [
                  "Membantu pertumbuhan tubuh dan memperbaiki sel tubuh yang rusak",
                  "Menggantikan kebutuhan tidur malam hari",
                  "Membuat pakaian sekolah tetap bersih",
                  "Mengubah warna rambut menjadi cerah",
                ],
                explanation:
                  "Protein adalah zat pembangun yang sangat penting untuk mendukung pertumbuhan otot, tulang, dan jaringan tubuh anak.",
              },
            ],
            sedang: [
              {
                question:
                  "Ketika masih bayi, Lani hanya bisa menangis dan tengkurap. Sekarang di kelas 3 SD, Lani sudah lancar bercerita dan menulis karangan pendek. Perubahan kemampuan Lani tersebut termasuk contoh ...",
                correctAnswer: "Perkembangan kemampuan berpikir dan berbahasa",
                options: [
                  "Perkembangan kemampuan berpikir dan berbahasa",
                  "Perubahan ukuran sepatu semata",
                  "Pergantian musim di lingkungan rumah",
                  "Metamorfosis sempurna seperti kupu-kupu",
                ],
                explanation:
                  "Bertambahnya kecakapan berbicara, menulis, dan berpikir merupakan contoh perkembangan pada manusia.",
              },
            ],
            sulit: [
              {
                question:
                  "Jika seorang anak hanya mau makan nasi dan kerupuk setiap hari tanpa sayur, buah, dan lauk pauk, mengapa pola makan tersebut TIDAK termasuk gizi seimbang?",
                correctAnswer:
                  "Karena tubuh kekurangan protein, vitamin, dan mineral yang dibutuhkan untuk pertumbuhan dan daya tahan tubuh",
                options: [
                  "Karena tubuh kekurangan protein, vitamin, dan mineral yang dibutuhkan untuk pertumbuhan dan daya tahan tubuh",
                  "Karena nasi tidak mengandung karbohidrat sama sekali",
                  "Karena kerupuk membuat tinggi badan langsung bertambah dua kali lipat",
                  "Karena gizi seimbang hanya terdiri atas buah-buahan tanpa makanan pokok",
                ],
                explanation:
                  "Gizi seimbang mengharuskan variasi makanan pokok, lauk berprotein, sayur, buah, dan air putih agar semua kebutuhan nutrisi terpenuhi.",
              },
            ],
          };
          const chosen = this.pickRandom(pool[difficulty] || pool.sedang);
          return {
            question: chosen.question,
            options: this.shuffleArray(chosen.options),
            correctAnswer: chosen.correctAnswer,
            explanation: chosen.explanation,
            params: { chapter: "Bab 3 — Perjalananku" },
          };
        },
      },
      {
        templateId: "TPL_IPAS3_BAB3_PAHLAWAN",
        grade: 3,
        subject: "IPAS",
        topic: "Bab 3 — Aku Peduli Aku Pahlawan",
        subtopic: "Nilai dan norma keluarga",
        generate: (difficulty) => {
          const pool = {
            mudah: [
              {
                question:
                  "Setelah selesai belajar di ruang tengah, buku dan alat tulis Adi masih berserakan di meja. Tindakan peduli yang harus segera dilakukan Adi adalah ...",
                correctAnswer:
                  "Merapikan kembali buku dan alat tulisnya ke dalam tas atau rak belajar",
                options: [
                  "Merapikan kembali buku dan alat tulisnya ke dalam tas atau rak belajar",
                  "Membiarkannya berserakan hingga besok pagi",
                  "Menyuruh adik kecilnya membereskan seluruh buku pelajaran",
                  "Menyembunyikan buku di belakang sofa ruang tamu",
                ],
                explanation:
                  "Membereskan barang milik sendiri adalah tanggung jawab anak untuk menjaga kerapian dan kenyamanan rumah.",
              },
            ],
            sedang: [
              {
                question:
                  "Saat ayah dan ibu sedang berbincang di ruang keluarga, kita ingin menyampaikan sesuatu yang penting. Cara yang sesuai dengan norma kesopanan keluarga adalah ...",
                correctAnswer:
                  'Menunggu jeda pembicaraan lalu mengucapkan "Permisi, Ayah dan Ibu" dengan suara lembut',
                options: [
                  'Menunggu jeda pembicaraan lalu mengucapkan "Permisi, Ayah dan Ibu" dengan suara lembut',
                  "Berteriak kencang memotong pembicaraan orang tua",
                  "Menarik-narik baju orang tua dengan kasar agar langsung diperhatikan",
                  "Membanting pintu kamar sampai orang tua menoleh",
                ],
                explanation:
                  "Tidak memotong pembicaraan dan berbicara santun adalah penerapan norma kesopanan di dalam keluarga.",
              },
            ],
            sulit: [
              {
                question:
                  "Di rumah Siti terdapat kesepakatan bahwa semua anggota keluarga makan malam bersama tanpa memainkan gawai di meja makan. Nilai positif yang dibangun dari norma keluarga tersebut adalah ...",
                correctAnswer:
                  "Kebersamaan, saling menghargai, dan komunikasi hangat antaranggota keluarga",
                options: [
                  "Kebersamaan, saling menghargai, dan komunikasi hangat antaranggota keluarga",
                  "Persaingan agar siapa yang selesai makan paling cepat mendapat hadiah",
                  "Larangan menggunakan teknologi untuk belajar sekolah selamanya",
                  "Kebiasaan makan sambil menonton televisi dengan suara keras",
                ],
                explanation:
                  "Makan bersama tanpa gawai melatih fokus pada keluarga, saling mendengarkan, dan mempererat kasih sayang.",
              },
            ],
          };
          const chosen = this.pickRandom(pool[difficulty] || pool.sedang);
          return {
            question: chosen.question,
            options: this.shuffleArray(chosen.options),
            correctAnswer: chosen.correctAnswer,
            explanation: chosen.explanation,
            params: { chapter: "Bab 3 — Aku Peduli Aku Pahlawan" },
          };
        },
      },
      {
        templateId: "TPL_IPAS3_BAB4_HEWAN",
        grade: 3,
        subject: "IPAS",
        topic: "Bab 4 — Rahasia Kehidupan Hewan",
        subtopic: "Metamorfosis sempurna dan tidak sempurna",
        generate: (difficulty) => {
          const pool = {
            mudah: [
              {
                question:
                  "Hewan katak hidup di air saat masih kecil (berudu/kecebong) dan bernapas dengan insang, lalu berubah menjadi katak dewasa berkaki empat. Katak mengalami ...",
                correctAnswer: "Metamorfosis sempurna",
                options: [
                  "Metamorfosis sempurna",
                  "Perkembangbiakan dengan melahirkan",
                  "Pertumbuhan tanpa perubahan bentuk",
                  "Pembiakan melalui biji",
                ],
                explanation:
                  "Katak mengalami metamorfosis sempurna karena bentuk berudu sangat berbeda dengan katak dewasa.",
              },
            ],
            sedang: [
              {
                question:
                  "Belalang muda (nimfa) yang baru menetas dari telur memiliki bentuk tubuh yang sudah mirip dengan belalang dewasa, hanya saja ukurannya lebih kecil dan belum bersayap sempurna. Artinya belalang mengalami ...",
                correctAnswer: "Metamorfosis tidak sempurna",
                options: [
                  "Metamorfosis tidak sempurna",
                  "Metamorfosis sempurna dengan kepompong",
                  "Perkembangbiakan vivipar",
                  "Perubahan wujud benda",
                ],
                explanation:
                  "Pada metamorfosis tidak sempurna (telur → nimfa → dewasa), hewan muda sudah menyerupai induknya tanpa fase kepompong.",
              },
            ],
            sulit: [
              {
                question:
                  "Penyu laut sering terancam punah karena pantai tempat bertelurnya penuh sampah plastik dan telurnya diambil manusia. Langkah pelestarian yang paling tepat untuk membantu kelangsungan hidup penyu adalah ...",
                correctAnswer:
                  "Menjaga kebersihan pantai dari sampah plastik dan melindungi kawasan peneluran penyu",
                options: [
                  "Menjaga kebersihan pantai dari sampah plastik dan melindungi kawasan peneluran penyu",
                  "Memindahkan seluruh penyu laut ke kolam ikan kecil di dalam ruangan",
                  "Membuang sampah plastik ke tengah laut agar pantai terlihat bersih",
                  "Mengumpulkan telur penyu untuk dijadikan mainan anak-anak",
                ],
                explanation:
                  "Melindungi tempat bertelur penyu dan menjaga pantai bebas sampah plastik memastikan siklus hidup penyu tetap berlanjut.",
              },
            ],
          };
          const chosen = this.pickRandom(pool[difficulty] || pool.sedang);
          return {
            question: chosen.question,
            options: this.shuffleArray(chosen.options),
            correctAnswer: chosen.correctAnswer,
            explanation: chosen.explanation,
            params: { chapter: "Bab 4 — Rahasia Kehidupan Hewan" },
          };
        },
      },
      {
        templateId: "TPL_IPAS3_BAB4_TUMBUHAN",
        grade: 3,
        subject: "IPAS",
        topic: "Bab 4 — Tumbuhan",
        subtopic: "Bagian tumbuhan",
        generate: (difficulty) => {
          const pool = {
            mudah: [
              {
                question:
                  "Bagian tumbuhan yang berfungsi menyalurkan air dan zat hara dari akar menuju daun serta menopang dahan dan bunga adalah ...",
                correctAnswer: "Batang",
                options: ["Batang", "Biji", "Kelopak bunga", "Kulit buah"],
                explanation:
                  "Batang berfungsi sebagai penopang tubuh tumbuhan sekaligus saluran pengangkut air dan hasil makanan.",
              },
            ],
            sedang: [
              {
                question:
                  "Pada banyak tumbuhan berbunga seperti mangga dan jeruk, bagian bunga yang sudah mengalami penyerbukan akan berkembang menjadi buah. Di dalam buah tersebut terdapat bagian penting untuk menghasilkan tumbuhan baru, yaitu ...",
                correctAnswer: "Biji",
                options: [
                  "Biji",
                  "Akar tunggang",
                  "Kulit batang",
                  "Tangkai daun",
                ],
                explanation:
                  "Biji di dalam buah merupakan calon individu tumbuhan baru yang akan berkecambah jika ditanam di lingkungan yang sesuai.",
              },
            ],
            sulit: [
              {
                question:
                  "Jika seluruh daun pada sebuah tanaman pot dipetik habis secara sengaja, apa akibat yang akan terjadi pada pertumbuhan tanaman tersebut?",
                correctAnswer:
                  "Tanaman kesulitan membuat makanannya sendiri melalui fotosintesis sehingga pertumbuhannya terganggu atau layu",
                options: [
                  "Tanaman kesulitan membuat makanannya sendiri melalui fotosintesis sehingga pertumbuhannya terganggu atau layu",
                  "Akar tanaman langsung berubah warna menjadi hijau dan berbuah lebat",
                  "Tanaman tidak lagi membutuhkan air untuk hidup",
                  "Batang tanaman langsung membesar dua kali lipat dalam sehari",
                ],
                explanation:
                  "Daun adalah tempat utama fotosintesis. Tanpa daun, tumbuhan kehilangan kemampuan utama memproduksi makanan.",
              },
            ],
          };
          const chosen = this.pickRandom(pool[difficulty] || pool.sedang);
          return {
            question: chosen.question,
            options: this.shuffleArray(chosen.options),
            correctAnswer: chosen.correctAnswer,
            explanation: chosen.explanation,
            params: { chapter: "Bab 4 — Tumbuhan" },
          };
        },
      },
    ];
  }

  registerBindoTemplates() {
    return [
      {
        templateId: "TPL_BINDO3_BAB1",
        grade: 3,
        subject: "Bahasa Indonesia",
        topic: "Bab 1",
        subtopic: "Huruf kapital dan tanda baca",
        generate: (difficulty) => {
          const pool = {
            mudah: [
              {
                question:
                  'Kalimat yang menanyakan sesuatu seperti "Di mana kamu menyimpan bukumu" harus diakhiri dengan tanda baca ...',
                correctAnswer: "Tanda tanya (?)",
                options: [
                  "Tanda tanya (?)",
                  "Tanda titik (.)",
                  "Tanda koma (,)",
                  "Tanda hubung (-)",
                ],
                explanation:
                  "Setiap kalimat tanya wajib diakhiri dengan tanda tanya (?).",
              },
            ],
            sedang: [
              {
                question:
                  'Perhatikan instruksi berikut: "Cuci tangan dengan sabun, bilas dengan air mengalir, lalu keringkan dengan handuk bersih." Apa langkah terakhir yang harus dilakukan sesuai instruksi tersebut?',
                correctAnswer: "Mengeringkan tangan dengan handuk bersih",
                options: [
                  "Mengeringkan tangan dengan handuk bersih",
                  "Menuangkan sabun ke atas handuk",
                  "Membilas handuk dengan air kotor",
                  "Langsung makan tanpa membilas tangan",
                ],
                explanation:
                  'Kata penghubung "lalu" menandakan langkah terakhir dalam instruksi tersebut adalah mengeringkan tangan dengan handuk bersih.',
              },
            ],
            sulit: [
              {
                question:
                  "Manakah penulisan kalimat berikut yang paling tepat sesuai kaidah huruf kapital dan tanda baca?",
                correctAnswer:
                  "Pada hari Selasa, Dina dan Edo berkunjung ke Museum Kota.",
                options: [
                  "Pada hari Selasa, Dina dan Edo berkunjung ke Museum Kota.",
                  "Pada Hari selasa, dina dan Edo berkunjung ke museum kota.",
                  "pada hari Selasa, Dina dan edo berkunjung ke Museum Kota?",
                  "Pada hari Selasa Dina, dan Edo berkunjung ke Museum Kota!",
                ],
                explanation:
                  "Huruf kapital digunakan pada awal kalimat, nama hari (Selasa), nama orang (Dina, Edo), dan nama tempat (Museum Kota), serta diakhiri tanda titik.",
              },
            ],
          };
          const chosen = this.pickRandom(pool[difficulty] || pool.sedang);
          return {
            question: chosen.question,
            options: this.shuffleArray(chosen.options),
            correctAnswer: chosen.correctAnswer,
            explanation: chosen.explanation,
            params: { chapter: "Bab 1" },
          };
        },
      },
      {
        templateId: "TPL_BINDO3_BAB2",
        grade: 3,
        subject: "Bahasa Indonesia",
        topic: "Bab 2",
        subtopic: "Ciri dan unsur kalimat sederhana",
        generate: (difficulty) => {
          const pool = {
            mudah: [
              {
                question:
                  'Perhatikan kalimat berikut: "Siti menulis puisi." Kata yang berperan sebagai Predikat (kegiatan yang dilakukan) adalah ...',
                correctAnswer: "menulis",
                options: ["menulis", "Siti", "puisi", "Siti puisi"],
                explanation:
                  "Siti adalah Subjek (pelaku), menulis adalah Predikat (tindakan), dan puisi adalah Objek.",
              },
            ],
            sedang: [
              {
                question:
                  "Manakah di bawah ini yang merupakan cerita FIKSI (rekaan/khayalan)?",
                correctAnswer:
                  "Kisah seekor semut yang membangun kapal terbang dari sehelai daun untuk pergi ke negeri awan.",
                options: [
                  "Kisah seekor semut yang membangun kapal terbang dari sehelai daun untuk pergi ke negeri awan.",
                  "Semut hidup berkelompok dan bekerja sama mengumpulkan makanan di sarangnya.",
                  "Indonesia memiliki dua musim utama, yaitu musim hujan dan musim kemarau.",
                  "Siswa kelas 3 mengikuti upacara bendera setiap hari Senin pagi.",
                ],
                explanation:
                  "Semut membangun kapal terbang ke negeri awan adalah peristiwa imajinatif/rekaan (fiksi), bukan kenyataan.",
              },
            ],
            sulit: [
              {
                question:
                  "Pada bagian TENGAH sebuah cerita pendek, unsur yang biasanya dimunculkan oleh penulis adalah ...",
                correctAnswer:
                  "Peristiwa utama atau masalah yang mulai dialami oleh tokoh cerita",
                options: [
                  "Peristiwa utama atau masalah yang mulai dialami oleh tokoh cerita",
                  "Daftar pustaka dan nama penerbit buku cerita",
                  "Penutup cerita sebelum tokoh diperkenalkan",
                  "Judul buku dan nomor halaman saja",
                ],
                explanation:
                  "Struktur cerita terdiri atas awal (pengenalan), tengah (peristiwa utama/masalah tokoh), dan akhir (penyelesaian).",
              },
            ],
          };
          const chosen = this.pickRandom(pool[difficulty] || pool.sedang);
          return {
            question: chosen.question,
            options: this.shuffleArray(chosen.options),
            correctAnswer: chosen.correctAnswer,
            explanation: chosen.explanation,
            params: { chapter: "Bab 2" },
          };
        },
      },
      {
        templateId: "TPL_BINDO3_BAB3",
        grade: 3,
        subject: "Bahasa Indonesia",
        topic: "Bab 3",
        subtopic: "Majas hiperbola",
        generate: (difficulty) => {
          const pool = {
            mudah: [
              {
                question:
                  'Kalimat "Air matanya mengalir deras seperti sungai" menggunakan majas hiperbola yang berarti ...',
                correctAnswer:
                  "Ia menangis sangat sedih dan mengeluarkan banyak air mata",
                options: [
                  "Ia menangis sangat sedih dan mengeluarkan banyak air mata",
                  "Ia sedang berenang di tengah sungai besar",
                  "Ia sedang menyiram kebun dengan air sungai",
                  "Ia tertawa terbahak-bahak bersama teman",
                ],
                explanation:
                  "Majas hiperbola melebih-lebihkan keadaan untuk menekankan bahwa tangisannya sangat deras.",
              },
            ],
            sedang: [
              {
                question:
                  'Bacalah paragraf berikut! "Lebah madu sangat berguna bagi lingkungan. Lebah membantu penyerbukan berbagai bunga di kebun. Selain itu, lebah menghasilkan madu yang menyehatkan manusia." Ide pokok paragraf tersebut adalah ...',
                correctAnswer: "Lebah madu sangat berguna bagi lingkungan",
                options: [
                  "Lebah madu sangat berguna bagi lingkungan",
                  "Semua bunga di kebun berwarna kuning cerah",
                  "Madu hanya bisa dibeli di toko kue",
                  "Lebah tidak pernah terbang di pagi hari",
                ],
                explanation:
                  "Kalimat pertama menyampaikan gagasan utama (lebah berguna), lalu kalimat berikutnya menjelaskan bentuk kegunaannya.",
              },
            ],
            sulit: [
              {
                question:
                  'Ketika mencari informasi tentang "hewan langka Indonesia" di internet bersama orang tua, mengapa kita sebaiknya membandingkan minimal dua sumber tepercaya?',
                correctAnswer:
                  "Untuk memastikan kebenaran informasi agar terhindar dari berita keliru atau hoaks",
                options: [
                  "Untuk memastikan kebenaran informasi agar terhindar dari berita keliru atau hoaks",
                  "Agar waktu menatap layar komputer menjadi berjam-jam lebih lama",
                  "Karena semua buku pelajaran di sekolah tidak pernah benar",
                  "Supaya kita bisa menyalin semua tulisan tanpa membacanya",
                ],
                explanation:
                  "Membandingkan beberapa sumber resmi dan tepercaya membantu memastikan informasi dari internet akurat dan valid.",
              },
            ],
          };
          const chosen = this.pickRandom(pool[difficulty] || pool.sedang);
          return {
            question: chosen.question,
            options: this.shuffleArray(chosen.options),
            correctAnswer: chosen.correctAnswer,
            explanation: chosen.explanation,
            params: { chapter: "Bab 3" },
          };
        },
      },
      {
        templateId: "TPL_BINDO3_BAB4",
        grade: 3,
        subject: "Bahasa Indonesia",
        topic: "Bab 4",
        subtopic: "Kalimat aktif dan pasif",
        generate: (difficulty) => {
          const pool = {
            mudah: [
              {
                question:
                  'Kalimat "Kue bolu itu dimakan oleh adik" merupakan kalimat pasif. Bentuk kalimat AKTIF yang tepat adalah ...',
                correctAnswer: "Adik memakan kue bolu itu.",
                options: [
                  "Adik memakan kue bolu itu.",
                  "Kue bolu memakan adik itu.",
                  "Adik dimakan kue bolu itu.",
                  "Memakan kue bolu adik itu.",
                ],
                explanation:
                  "Pada kalimat aktif, pelaku (Adik) menjadi Subjek dan predikat berawalan di- (dimakan) berubah menjadi me- (memakan).",
              },
            ],
            sedang: [
              {
                question:
                  "Dalam sebuah puisi tentang keindahan alam pegunungan yang sejuk dan damai, tempo membaca yang paling sesuai adalah ...",
                correctAnswer:
                  "Sedang hingga pelan dengan penghayatan lembut dan tenang",
                options: [
                  "Sedang hingga pelan dengan penghayatan lembut dan tenang",
                  "Sangat cepat sambil berteriak sekeras-kerasnya",
                  "Terputus-putus sambil tertawa keras di setiap kata",
                  "Berbisik tanpa terdengar oleh pendengar di baris depan",
                ],
                explanation:
                  "Puisi bernuansa damai dan sejuk cocok dibacakan dengan tempo tenang, intonasi lembut, dan lafal yang jelas.",
              },
            ],
            sulit: [
              {
                question:
                  'Jika sebuah ilustrasi pada cerita "Piket Kelas yang Kompak" hanya menggambar satu anak menyapu sendirian sementara teman-teman lain tidur di bangku, evaluasi yang paling tepat adalah ...',
                correctAnswer:
                  'Ilustrasi tidak mencerminkan isi judul "kompak" sehingga perlu diperbaiki dengan menggambar beberapa siswa bekerja sama',
                options: [
                  'Ilustrasi tidak mencerminkan isi judul "kompak" sehingga perlu diperbaiki dengan menggambar beberapa siswa bekerja sama',
                  "Ilustrasi sudah sempurna karena jumlah anak di gambar cukup banyak",
                  "Semua kata di dalam cerita harus dihapus agar sesuai gambar",
                  "Gambar tidak perlu menampilkan kegiatan membersihkan kelas sama sekali",
                ],
                explanation:
                  "Ilustrasi yang baik harus mendukung makna utama cerita; kekompakan piket seharusnya digambarkan melalui kerja sama beberapa siswa.",
              },
            ],
          };
          const chosen = this.pickRandom(pool[difficulty] || pool.sedang);
          return {
            question: chosen.question,
            options: this.shuffleArray(chosen.options),
            correctAnswer: chosen.correctAnswer,
            explanation: chosen.explanation,
            params: { chapter: "Bab 4" },
          };
        },
      },
    ];
  }

  registerBingTemplates() {
    return [
      {
        templateId: "TPL_BING3_MY_SELF",
        subject: "Bahasa Inggris",
        topic: "Bab 1 — My Self",
        subtopic: "Introducing Yourself & Favorite Activities",
        generate: () => {
          const person = this.pickRandom(NAMES_POOL);
          const cases = [
            {
              question: `Read the short greeting: "Hello! My name is ${person}. I am a third-grade student. Nice to meet you!" What should a new classmate say in reply?`,
              options: [
                "Nice to meet you too!",
                "Good night, see you tomorrow!",
                "I am sweeping the floor.",
                "She is my grandmother.",
              ],
              correctAnswer: "Nice to meet you too!",
              explanation:
                'Ungkapan sopan untuk membalas perkenalan "Nice to meet you!" adalah "Nice to meet you too!".',
              vocabHelp: "classmate = teman sekelas; reply = membalas",
              visualId: null,
            },
            {
              question: `${person} wants to introduce a new friend named Sinta to the teacher. Which sentence is the most polite?`,
              options: [
                "Miss, this is my friend Sinta.",
                "Miss, Sinta is reading a newspaper.",
                "Hello, my father works in the garden.",
                "I prefer playing football after school.",
              ],
              correctAnswer: "Miss, this is my friend Sinta.",
              explanation:
                'Untuk memperkenalkan teman kepada orang lain, gunakan pola "This is my friend ...".',
              vocabHelp: "introduce = memperkenalkan; polite = sopan",
              visualId: null,
            },
            {
              question: `${person} always brings a sketchbook and colored pencils after school because ${person} loves drawing. What is ${person}'s favorite activity?`,
              options: [
                "Drawing pictures",
                "Swimming in the pool",
                "Cooking in the kitchen",
                "Watering the flowers",
              ],
              correctAnswer: "Drawing pictures",
              explanation:
                "Membawa buku sketsa dan pensil warna menunjukkan aktivitas kegemaran menggambar (drawing pictures).",
              vocabHelp: "after school = sepulang sekolah; favorite = kesukaan",
              visualId: null,
            },
          ];
          const chosen = this.pickRandom(cases);
          return {
            question: chosen.question,
            options: this.shuffleArray(chosen.options),
            correctAnswer: chosen.correctAnswer,
            explanation: chosen.explanation,
            vocabHelp: chosen.vocabHelp,
            visualId: chosen.visualId,
            params: {},
          };
        },
      },
      {
        templateId: "TPL_BING3_MY_FAMILY",
        subject: "Bahasa Inggris",
        topic: "Bab 2 — My Family",
        subtopic: "Family Members and Relationships",
        generate: () => {
          const cases = [
            {
              question:
                "Look at the family chart! Based on the diagram, who is Mr. Ali to Raka?",
              options: ["Father", "Brother", "Uncle", "Grandfather"],
              correctAnswer: "Father",
              explanation:
                "Pada bagan keluarga terlihat Mr. Ali adalah ayah (Father) dari Raka.",
              vocabHelp: "father = ayah; family chart = bagan keluarga",
              visualId: "en_family_tree",
            },
            {
              question:
                "Look at the family chart! Raka is a boy and Lina is a girl from the same parents. What is Lina to Raka?",
              options: ["Sister", "Mother", "Aunt", "Cousin"],
              correctAnswer: "Sister",
              explanation:
                "Saudara perempuan kandung dalam Bahasa Inggris disebut Sister.",
              vocabHelp: "sister = saudara perempuan",
              visualId: "en_family_tree",
            },
            {
              question:
                "Look at the family chart! Mrs. Ani has two children: Raka and Lina. Who is Raka to Mrs. Ani?",
              options: ["Her son", "Her daughter", "Her father", "Her brother"],
              correctAnswer: "Her son",
              explanation:
                "Anak laki-laki dari seorang ibu disebut son (Her son = anak laki-lakinya).",
              vocabHelp: "son = anak laki-laki; daughter = anak perempuan",
              visualId: "en_family_tree",
            },
          ];
          const chosen = this.pickRandom(cases);
          return {
            question: chosen.question,
            options: this.shuffleArray(chosen.options),
            correctAnswer: chosen.correctAnswer,
            explanation: chosen.explanation,
            vocabHelp: chosen.vocabHelp,
            visualId: chosen.visualId,
            params: {},
          };
        },
      },
      {
        templateId: "TPL_BING3_HOME_ACTIVITIES",
        subject: "Bahasa Inggris",
        topic: "Bab 3 — My Family's Activities at Home",
        subtopic: "Daily Family Activities at Home",
        generate: () => {
          const cases = [
            {
              question:
                "The living room floor is dusty. Mother takes a broom and starts cleaning. What is Mother doing?",
              options: [
                "She is sweeping the floor",
                "She is reading a newspaper",
                "She is watering the plants",
                "She is sleeping on the sofa",
              ],
              correctAnswer: "She is sweeping the floor",
              explanation:
                "Menggunakan sapu (broom) untuk membersihkan lantai berarti sedang menyapu (sweeping the floor).",
              vocabHelp: "dusty = berdebu; broom = sapu",
              visualId: null,
            },
            {
              question:
                "Every morning, Father sits in the yard with a cup of tea and reads the daily news. What is Father doing?",
              options: [
                "He is reading a newspaper",
                "He is washing the dishes",
                "He is feeding the cat",
                "He is tidying his bed",
              ],
              correctAnswer: "He is reading a newspaper",
              explanation:
                "Membaca berita harian disebut reading a newspaper.",
              vocabHelp: "newspaper = koran; yard = halaman",
              visualId: null,
            },
            {
              question:
                "In the afternoon, Raka goes to the backyard with a bowl of fish food for his pets. What is Raka doing?",
              options: [
                "He is feeding his pets",
                "He is cooking breakfast",
                "He is mopping the floor",
                "He is watching television",
              ],
              correctAnswer: "He is feeding his pets",
              explanation:
                "Memberi makan hewan peliharaan di halaman belakang disebut feeding his pets.",
              vocabHelp: "backyard = halaman belakang; feeding = memberi makan",
              visualId: null,
            },
          ];
          const chosen = this.pickRandom(cases);
          return {
            question: chosen.question,
            options: this.shuffleArray(chosen.options),
            correctAnswer: chosen.correctAnswer,
            explanation: chosen.explanation,
            vocabHelp: chosen.vocabHelp,
            visualId: chosen.visualId,
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
        templateId: "TPL_SR3_GARIS_BENTUK",
        grade: 3,
        subject: "Seni Rupa",
        topic: "Bab 1 — Eksplorasi Garis dan Bentuk",
        subtopic: "Mengidentifikasi Garis dan Bentuk",
        generate: () => {
          const cases = [
            {
              question:
                "Perhatikan gambar di atas! Jenis garis yang meliuk lembut seperti ombak laut pada gambar tersebut adalah ...",
              correct: "Garis bergelombang",
              options: [
                "Garis bergelombang",
                "Garis zig-zag",
                "Garis lurus vertikal",
                "Garis spiral melingkar",
              ],
              explanation:
                "Garis bergelombang memiliki lengkungan naik-turun yang halus menyerupai ombak air.",
              visualId: "sr_line_wavy",
            },
            {
              question:
                "Perhatikan gambar bentuk di atas! Ketiga bangun tersebut (persegi, segitiga, lingkaran) termasuk kelompok ...",
              correct: "Bentuk geometris",
              options: [
                "Bentuk geometris",
                "Bentuk organik alami",
                "Tekstur kasar buatan",
                "Komposisi radial",
              ],
              explanation:
                "Persegi, segitiga, dan lingkaran adalah bentuk teratur yang disebut bentuk geometris.",
              visualId: "sr_shape_geometric",
            },
          ];
          const chosen = this.pickRandom(cases);
          return {
            question: chosen.question,
            options: this.shuffleArray(chosen.options),
            correctAnswer: chosen.correct,
            explanation: chosen.explanation,
            visualId: chosen.visualId,
            params: {},
          };
        },
      },
      {
        templateId: "TPL_SR3_WARNA",
        grade: 3,
        subject: "Seni Rupa",
        topic: "Bab 2 — Eksplorasi Warna",
        subtopic: "Warna Primer, Sekunder & Roda Warna",
        generate: () => {
          const cases = [
            {
              question:
                "Perhatikan ilustrasi pencampuran dua warna primer di atas! Jika warna Merah dan Kuning dicampur secara merata, warna sekunder apakah yang terbentuk?",
              correct: "Oranye (Jingga)",
              options: [
                "Oranye (Jingga)",
                "Hijau",
                "Ungu",
                "Abu-abu",
              ],
              explanation:
                "Pencampuran warna primer Merah dan Kuning menghasilkan warna sekunder Oranye (Jingga).",
              visualId: "sr_color_mix_ry",
            },
            {
              question:
                "Perhatikan ilustrasi pencampuran warna di atas! Jika cat air Kuning dan Biru dicampur bersama di palet, warna baru yang dihasilkan adalah ...",
              correct: "Hijau",
              options: ["Hijau", "Oranye", "Ungu", "Merah muda"],
              explanation:
                "Campuran dua warna primer Kuning dan Biru menghasilkan warna sekunder Hijau.",
              visualId: "sr_color_mix_yb",
            },
            {
              question:
                "Perhatikan ilustrasi pencampuran warna di atas! Warna sekunder apakah yang muncul saat warna Merah dan Biru dicampur?",
              correct: "Ungu",
              options: ["Ungu", "Hijau", "Oranye", "Kuning"],
              explanation:
                "Campuran warna primer Merah dan Biru menghasilkan warna sekunder Ungu.",
              visualId: "sr_color_mix_rb",
            },
          ];
          const chosen = this.pickRandom(cases);
          return {
            question: chosen.question,
            options: this.shuffleArray(chosen.options),
            correctAnswer: chosen.correct,
            explanation: chosen.explanation,
            visualId: chosen.visualId,
            params: {},
          };
        },
      },
      {
        templateId: "TPL_SR3_MENGGAMBAR_CERITA",
        grade: 3,
        subject: "Seni Rupa",
        topic: "Bab 3 — Menggambar Cerita",
        subtopic: "Panel Gambar Cerita dan Alat Gambar",
        generate: () => {
          const cases = [
            {
              question:
                "Perhatikan urutan 3 panel gambar cerita di atas! Mengapa gambar cerita disajikan dalam beberapa panel secara berurutan?",
              correct:
                "Agar alur cerita dari awal hingga akhir mudah dipahami pembaca",
              options: [
                "Agar alur cerita dari awal hingga akhir mudah dipahami pembaca",
                "Agar kertas gambar tidak memiliki ruang kosong sama sekali",
                "Karena pensil hanya bisa dipakai untuk satu kotak kecil",
                "Supaya warna latar belakangnya menjadi gelap semua",
              ],
              explanation:
                "Panel berurutan membantu menunjukkan langkah kejadian dari awal, tengah, hingga akhir cerita.",
              visualId: "sr_story_panels",
            },
            {
              question:
                "Perhatikan alat-alat gambar pada gambar di atas! Alat manakah yang paling tepat digunakan untuk menarik garis tepi panel agar lurus dan rapi?",
              correct: "Penggaris",
              options: ["Penggaris", "Penghapus", "Krayon", "Kuas cat air"],
              explanation:
                "Penggaris membantu membuat garis lurus dan ukuran bingkai panel yang rapi.",
              visualId: "sr_art_tools",
            },
          ];
          const chosen = this.pickRandom(cases);
          return {
            question: chosen.question,
            options: this.shuffleArray(chosen.options),
            correctAnswer: chosen.correct,
            explanation: chosen.explanation,
            visualId: chosen.visualId,
            params: {},
          };
        },
      },
      {
        templateId: "TPL_SR3_KOMPOSISI",
        grade: 3,
        subject: "Seni Rupa",
        topic: "Bab 4 — Eksplorasi Komposisi",
        subtopic: "Komposisi Simetris, Asimetris, dan Radial",
        generate: () => {
          const cases = [
            {
              question:
                "Perhatikan gambar tata letak benda di atas! Bagian kiri dan kanan garis tengah memiliki bentuk serta jarak yang sama persis. Komposisi ini disebut ...",
              correct: "Komposisi simetris",
              options: [
                "Komposisi simetris",
                "Komposisi asimetris",
                "Komposisi radial",
                "Tekstur kasar",
              ],
              explanation:
                "Komposisi simetris menata objek secara seimbang dan sama persis di sisi kiri dan kanan sumbu tengah.",
              visualId: "sr_comp_symmetric",
            },
            {
              question:
                "Perhatikan komposisi gambar di atas! Sisi kiri berisi satu lingkaran besar, sedangkan sisi kanan berisi beberapa bentuk kecil agar tetap seimbang. Pola ini disebut ...",
              correct: "Komposisi asimetris",
              options: [
                "Komposisi asimetris",
                "Komposisi simetris",
                "Komposisi radial",
                "Garis spiral",
              ],
              explanation:
                "Komposisi asimetris menyeimbangkan objek yang berbeda ukuran/jumlah antara sisi kiri dan kanan.",
              visualId: "sr_comp_asymmetric",
            },
            {
              question:
                "Perhatikan gambar kelopak bunga yang memancar dari titik pusat di tengah! Jenis komposisi tersebut adalah ...",
              correct: "Komposisi radial",
              options: [
                "Komposisi radial",
                "Komposisi simetris lurus",
                "Komposisi asimetris acak",
                "Teknik frottage",
              ],
              explanation:
                "Komposisi radial menyusun unsur gambar memancar atau melingkar dari satu titik pusat di tengah.",
              visualId: "sr_comp_radial",
            },
          ];
          const chosen = this.pickRandom(cases);
          return {
            question: chosen.question,
            options: this.shuffleArray(chosen.options),
            correctAnswer: chosen.correct,
            explanation: chosen.explanation,
            visualId: chosen.visualId,
            params: {},
          };
        },
      },
      {
        templateId: "TPL_SR3_TEKSTUR",
        grade: 3,
        subject: "Seni Rupa",
        topic: "Bab 5 — Mengenal dan Mengeksplorasi Tekstur",
        subtopic: "Tekstur Nyata, Semu, dan Teknik Frottage",
        generate: () => {
          const cases = [
            {
              question:
                "Perhatikan perbandingan Benda A (Kulit Kayu) dan Benda B (Kaca) pada gambar di atas! Jika diraba langsung, bagaimana perbedaan tekstur keduanya?",
              correct: "Kulit kayu bertekstur kasar, sedangkan kaca bertekstur halus",
              options: [
                "Kulit kayu bertekstur kasar, sedangkan kaca bertekstur halus",
                "Kulit kayu bertekstur halus, sedangkan kaca bertekstur kasar",
                "Keduanya sama-sama memiliki tekstur sangat kasar",
                "Keduanya sama-sama lunak seperti kapas",
              ],
              explanation:
                "Permukaan kulit kayu memiliki lekukan kasar saat diraba, sedangkan permukaan kaca licin dan halus.",
              visualId: "sr_texture_compare",
            },
            {
              question:
                "Perhatikan gambar teknik menggosok kertas di atas uang koin menggunakan pensil! Teknik mencetak tekstur ini disebut ...",
              correct: "Teknik frottage (gosok)",
              options: [
                "Teknik frottage (gosok)",
                "Teknik mozaik tempel",
                "Teknik lipat origami",
                "Komposisi simetris",
              ],
              explanation:
                "Teknik frottage dilakukan dengan meletakkan kertas di atas benda bertekstur lalu menggosoknya dengan pensil atau krayon.",
              visualId: "sr_texture_frottage",
            },
          ];
          const chosen = this.pickRandom(cases);
          return {
            question: chosen.question,
            options: this.shuffleArray(chosen.options),
            correctAnswer: chosen.correct,
            explanation: chosen.explanation,
            visualId: chosen.visualId,
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

  registerGrade1Templates() {
    return {
      matematika: [
        {
          templateId: "TPL_MTK1_HITUNG_20",
          grade: 1,
          subject: "Matematika",
          topic: "Penjumlahan dan Pengurangan Sederhana",
          subtopic: "Operasi Hitung Bilangan 1 sampai 20",
          generate: (difficulty) => {
            const isSub = difficulty !== "mudah" && Math.random() > 0.5;
            if (isSub) {
              const a = this.randInt(11, 19);
              const b = this.randInt(3, 8);
              const ans = a - b;
              const options = this.buildPlausibleNumericOptions(
                ans,
                "buah",
                [-2, -1, 1, 2, 3],
              );
              return {
                question: `Di keranjang ada ${a} buah jeruk. Sebanyak ${b} buah jeruk dimakan bersama keluarga. Berapa buah jeruk yang masih tersisa?`,
                options,
                correctAnswer: `${ans} buah`,
                explanation: `Karena dimakan, jumlahnya berkurang: ${a} - ${b} = ${ans} buah jeruk.`,
                params: { a, b, ans },
              };
            }
            const a = this.randInt(5, 11);
            const b = this.randInt(4, 8);
            const ans = a + b;
            const options = this.buildPlausibleNumericOptions(
              ans,
              "",
              [-2, -1, 1, 2, 3],
            );
            return {
              question: `Hasil penjumlahan dari ${a} + ${b} adalah ...`,
              options,
              correctAnswer: `${ans}`,
              explanation: `${a} ditambah ${b} hasilnya adalah ${ans}.`,
              params: { a, b, ans },
            };
          },
        },
      ],
      ipas: [
        {
          templateId: "TPL_IPAS1_PANCAINDRA",
          grade: 1,
          subject: "IPAS",
          topic: "Mengenal Pancaindra",
          subtopic: "Fungsi Alat Indra Manusia",
          generate: () => {
            const items = [
              {
                act: "mendengarkan kicauan burung yang merdu di pagi hari",
                indra: "Telinga",
                info: "mendengar berbagai suara",
              },
              {
                act: "melihat warna-warni pelangi yang indah di langit",
                indra: "Mata",
                info: "melihat benda dan warna di sekitar kita",
              },
              {
                act: "merasakan manisnya madu dan asinnya garam",
                indra: "Lidah",
                info: "mengecap rasa makanan",
              },
            ];
            const chosen = this.pickRandom(items);
            return {
              question: `Anggota tubuh (pancaindra) yang kita gunakan untuk ${chosen.act} adalah ...`,
              options: this.shuffleArray(["Telinga", "Mata", "Lidah", "Kulit"]),
              correctAnswer: chosen.indra,
              explanation: `${chosen.indra} adalah pancaindra yang berfungsi untuk ${chosen.info}.`,
              params: {},
            };
          },
        },
      ],
      bahasa_indonesia: [
        {
          templateId: "TPL_BINDO1_VOKAL_SUKUKATA",
          grade: 1,
          subject: "Bahasa Indonesia",
          topic: "Membaca Suku Kata dan Kata Sederhana",
          subtopic: "Menghitung Jumlah Suku Kata",
          generate: () => {
            const words = [
              { word: "BONEKA", split: "bo - ne - ka", count: "3 suku kata" },
              { word: "BUKU", split: "bu - ku", count: "2 suku kata" },
              {
                word: "MATAHARI",
                split: "ma - ta - ha - ri",
                count: "4 suku kata",
              },
            ];
            const w = this.pickRandom(words);
            return {
              question: `Kata "${w.word}" jika diucapkan per suku kata menjadi "${w.split}". Berapa jumlah suku kata pada kata ${w.word}?`,
              options: this.shuffleArray([
                "2 suku kata",
                "3 suku kata",
                "4 suku kata",
                "5 suku kata",
              ]),
              correctAnswer: w.count,
              explanation: `Kata ${w.word} (${w.split}) memiliki ${w.count}.`,
              params: {},
            };
          },
        },
      ],
      bahasa_inggris: [
        {
          templateId: "TPL_BING1_NUMBERS_10",
          grade: 1,
          subject: "Bahasa Inggris",
          topic: "Numbers 1-10",
          subtopic: "Mengenal Angka 1 sampai 10",
          generate: () => {
            const pairs = [
              { n: 3, eng: "Three", w: ["Two", "Four", "Ten"] },
              { n: 7, eng: "Seven", w: ["Six", "Eight", "Nine"] },
              { n: 10, eng: "Ten", w: ["One", "Eight", "Five"] },
            ];
            const p = this.pickRandom(pairs);
            return {
              question: `Bahasa Inggris dari angka "${p.n}" adalah ...`,
              options: this.shuffleArray([p.eng, ...p.w]),
              correctAnswer: p.eng,
              explanation: `Angka ${p.n} dalam Bahasa Inggris adalah "${p.eng}".`,
              params: {},
            };
          },
        },
      ],
      pendidikan_pancasila: [
        {
          templateId: "TPL_PPKN1_SIKAP_BAIK",
          grade: 1,
          subject: "Pendidikan Pancasila",
          topic: "Sikap Baik kepada Keluarga dan Teman",
          subtopic: "Perilaku Santun Sehari-hari",
          generate: () => {
            return {
              question:
                "Saat tidak sengaja menjatuhkan pensil milik teman di meja, kata baik yang harus segera kita ucapkan adalah ...",
              options: this.shuffleArray([
                "Maaf",
                "Awas",
                "Biar saja",
                "Cepat ambil",
              ]),
              correctAnswer: "Maaf",
              explanation:
                'Mengucapkan kata "Maaf" ketika melakukan kesalahan adalah sikap anak yang sopan dan bertanggung jawab.',
              params: {},
            };
          },
        },
      ],
      seni_rupa: [
        {
          templateId: "TPL_SR1_WARNA_BENDA",
          grade: 1,
          subject: "Seni Rupa",
          topic: "Mengenal Warna Primer",
          subtopic: "Mengamati Warna Objek Sekitar",
          generate: () => {
            return {
              question:
                "Saat cuaca sangat cerah di siang hari, warna langit di atas kita tampak berwarna ...",
              options: this.shuffleArray([
                "Biru cerah",
                "Hijau tua",
                "Hitam pekat",
                "Merah tua",
              ]),
              correctAnswer: "Biru cerah",
              explanation:
                "Pada siang hari yang cerah, langit tampak berwarna biru cerah.",
              params: {},
            };
          },
        },
      ],
    };
  }

  registerGrade2Templates() {
    return {
      matematika: [
        {
          templateId: "TPL_MTK2_HITUNG_100",
          grade: 2,
          subject: "Matematika",
          topic: "Penjumlahan dan Pengurangan Sampai 100",
          subtopic: "Penjumlahan dan Pengurangan Bilangan Dua Angka",
          generate: (difficulty) => {
            const isSub = difficulty !== "mudah" && Math.random() > 0.5;
            if (isSub) {
              const a = this.randInt(52, 95);
              const b = this.randInt(18, 39);
              const ans = a - b;
              const options = this.buildPlausibleNumericOptions(
                ans,
                "",
                [-10, 10, -2, 2, 5],
              );
              return {
                question: `Hasil pengurangan dari ${a} - ${b} adalah ...`,
                options,
                correctAnswer: `${ans}`,
                explanation: `Pengurangan bersusun: ${a} - ${b} = ${ans}.`,
                params: { a, b, ans },
              };
            }
            const a = this.randInt(24, 58);
            const b = this.randInt(15, 37);
            const ans = a + b;
            const options = this.buildPlausibleNumericOptions(
              ans,
              "",
              [-10, 10, -2, 2, 4],
            );
            return {
              question: `Hasil penjumlahan dari ${a} + ${b} adalah ...`,
              options,
              correctAnswer: `${ans}`,
              explanation: `Penjumlahan bersusun: ${a} + ${b} = ${ans}.`,
              params: { a, b, ans },
            };
          },
        },
      ],
      ipas: [
        {
          templateId: "TPL_IPAS2_WUJUD_LINGKUNGAN",
          grade: 2,
          subject: "IPAS",
          topic: "Perubahan Wujud Benda Sederhana",
          subtopic: "Mencair dan Membeku di Rumah",
          generate: () => {
            return {
              question:
                "Ibu memasukkan air minum ke dalam cetakan es lalu menaruhnya di dalam freezer kulkas. Beberapa jam kemudian air berubah menjadi es batu yang keras. Perubahan wujud dari cair menjadi padat ini disebut ...",
              options: this.shuffleArray([
                "Membeku",
                "Mencair",
                "Menguap",
                "Membakar",
              ]),
              correctAnswer: "Membeku",
              explanation:
                "Membeku adalah perubahan wujud benda dari cair (air) menjadi padat (es batu) karena didinginkan.",
              params: {},
            };
          },
        },
      ],
      bahasa_indonesia: [
        {
          templateId: "TPL_BINDO2_KATA_TANYA",
          grade: 2,
          subject: "Bahasa Indonesia",
          topic: "Mengenal Kata Tanya",
          subtopic: "Memilih Kata Tanya Sesuai Jawaban",
          generate: () => {
            return {
              question:
                '"... nama teman baru yang duduk di sebelah Siti?" — Jawab: "Namanya adalah Lani." Kata tanya yang tepat untuk melengkapi kalimat tersebut adalah ...',
              options: this.shuffleArray([
                "Siapa",
                "Kapan",
                "Di mana",
                "Berapa",
              ]),
              correctAnswer: "Siapa",
              explanation:
                'Kata tanya "Siapa" digunakan untuk menanyakan nama orang atau tokoh.',
              params: {},
            };
          },
        },
      ],
      bahasa_inggris: [
        {
          templateId: "TPL_BING2_NUMBERS_20",
          grade: 2,
          subject: "Bahasa Inggris",
          topic: "Numbers 1-20",
          subtopic: "Mengenal Angka 11 sampai 20",
          generate: () => {
            const pairs = [
              { n: 14, eng: "Fourteen", w: ["Forty", "Four", "Sixteen"] },
              { n: 17, eng: "Seventeen", w: ["Seven", "Seventy", "Thirteen"] },
              { n: 20, eng: "Twenty", w: ["Twelve", "Two", "Ten"] },
            ];
            const p = this.pickRandom(pairs);
            return {
              question: `Bahasa Inggris yang benar untuk bilangan "${p.n}" adalah ...`,
              options: this.shuffleArray([p.eng, ...p.w]),
              correctAnswer: p.eng,
              explanation: `Bilangan ${p.n} dalam Bahasa Inggris adalah "${p.eng}".`,
              params: {},
            };
          },
        },
      ],
      pendidikan_pancasila: [
        {
          templateId: "TPL_PPKN2_GOTONG_ROYONG",
          grade: 2,
          subject: "Pendidikan Pancasila",
          topic: "Mempraktikkan Gotong Royong",
          subtopic: "Manfaat Bekerja Sama di Sekolah",
          generate: () => {
            return {
              question:
                "Saat merapikan buku-buku cerita di pojok baca kelas bersama teman-teman, sikap yang harus kita tunjukkan agar pekerjaan cepat selesai adalah ...",
              options: this.shuffleArray([
                "Membagi tugas dengan adil dan bekerja sama dengan tertib",
                "Duduk melihat teman bekerja sambil bermain kertas",
                "Melempar buku ke rak dari jarak jauh",
                "Berebut buku cerita sehingga rak menjadi berantakan",
              ]),
              correctAnswer:
                "Membagi tugas dengan adil dan bekerja sama dengan tertib",
              explanation:
                "Pembagian tugas dan kerja sama yang tertib membuat pekerjaan bersama cepat selesai dan rapi.",
              params: {},
            };
          },
        },
      ],
      seni_rupa: [
        {
          templateId: "TPL_SR2_CAMPURAN_WARNA",
          grade: 2,
          subject: "Seni Rupa",
          topic: "Warna Primer dan Sekunder",
          subtopic: "Pencampuran Dua Warna Primer",
          generate: () => {
            return {
              question:
                "Jika kita mencampurkan cat warna Merah dan cat warna Kuning dengan jumlah yang sama di atas palet, maka akan menghasilkan warna sekunder yaitu ...",
              options: this.shuffleArray([
                "Oranye (Jingga)",
                "Hijau",
                "Ungu",
                "Biru muda",
              ]),
              correctAnswer: "Oranye (Jingga)",
              explanation:
                "Merah + Kuning menghasilkan Oranye (Jingga), Kuning + Biru = Hijau, dan Merah + Biru = Ungu.",
              params: {},
            };
          },
        },
      ],
    };
  }

  registerPaiGrade3Templates() {
    return [
      {
        templateId: "TPL_PAI3_AKHLAK_IBADAH",
        grade: 3,
        subject: "Pendidikan Agama Islam",
        topic: "Akhlak",
        subtopic: "Penerapan Akhlak Terpuji dan Ibadah Harian",
        generate: () => {
          const cases = [
            {
              question:
                "Ketika hendak masuk ke dalam masjid untuk melaksanakan salat berjamaah, adab yang dicontohkan oleh Rasulullah SAW adalah mendahulukan kaki ... sambil membaca doa masuk masjid.",
              correct: "Kaki kanan terlebih dahulu",
              options: [
                "Kaki kanan terlebih dahulu",
                "Kaki kiri terlebih dahulu",
                "Melompat dengan kedua kaki sekaligus",
                "Berlari kencang tanpa melepas alas kaki",
              ],
              explanation:
                "Untuk hal-hal yang mulia dan baik seperti masuk masjid dan memakai pakaian, Rasulullah SAW mencontohkan mendahulukan sebelah kanan.",
            },
            {
              question:
                'Allah SWT memiliki Asmaul Husna "As-Sami\'" yang artinya Allah Maha Mendengar segala suara, baik yang diucapkan keras maupun yang berbisik di dalam hati. Cara kita mengamalkan keyakinan tersebut adalah ...',
              correct:
                "Menjaga lisan agar selalu berkata baik, jujur, dan rajin berdoa kepada Allah SWT",
              options: [
                "Menjaga lisan agar selalu berkata baik, jujur, dan rajin berdoa kepada Allah SWT",
                "Berbisik-bisik membicarakan keburukan teman karena mengira tidak ada yang mendengar",
                "Berteriak keras-keras saat berdoa di dalam ruang kelas",
                "Menutup telinga ketika orang tua sedang memberikan nasihat",
              ],
              explanation:
                "Karena Allah Maha Mendengar (As-Sami'), kita harus menjaga perkataan kita dari ucapan buruk meskipun sedang tidak dilihat manusia.",
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

  registerMaduraGrade3Templates() {
    return [
      {
        templateId: "TPL_MDR3_UNDHAK_USUK",
        grade: 3,
        subject: "Bahasa Madura",
        topic: "Tingkatan Bahasa Madura (Undhak-Usuk Bhasa)",
        subtopic: "Penerapan Bahasa Engghi-Bhunten di Rumah dan Sekolah",
        generate: () => {
          const cases = [
            {
              question:
                "Ketika kamu hendak berangkat ke sekolah pada pagi hari, kalimat pamitan yang paling sopan dalam Bahasa Madura halus (Engghi-Bhunten) kepada Ibu adalah ...",
              correct: '"Ebhu, kaula nyoona edi badhi mangkat ka sakola\'an."',
              options: [
                '"Ebhu, kaula nyoona edi badhi mangkat ka sakola\'an."',
                "\"Ebhu, sengko' mangkaddha ka sakola'an ya!\"",
                "\"Ba'na entara ka sakola'an sateya.\"",
                '"Mayu mangkat amaen ka taneyan."',
              ],
              explanation:
                'Dalam bahasa Engghi-Bhunten kepada Ibu, gunakan "kaula" (saya), "nyoona edi" (mohon izin), dan "badhi mangkat" (hendak berangkat).',
            },
            {
              question:
                'Perhatikan perbandingan kosakata berikut: Dalam bahasa Enja\'-Iya (kepada teman sebaya), kata "Tidur" adalah "Tedhung". Sedangkan apabila berbicara tentang Kakek atau Ayah yang sedang tidur, kata halus (Engghi-Bhunten) yang benar adalah ...',
              correct: "Asaren",
              options: ["Asaren", "Tedhung", "Adha'ar", "Alengghi"],
              correctAnswer: "Asaren",
              explanation:
                'Bahasa halus (Engghi-Bhunten) dari "tedhung" (tidur) adalah "asaren". Adapun "adha\'ar" artinya makan, dan "alengghi" artinya duduk.',
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

  registerPjokGrade3Templates() {
    return [
      {
        templateId: "TPL_PJOK3_GERAK_KESEHATAN",
        grade: 3,
        subject: "PJOK",
        topic: "Gerak Dasar",
        subtopic: "Analisis Gerak Dasar dan Pola Hidup Sehat",
        generate: () => {
          const cases = [
            {
              question:
                'Saat bermain lompat tali (skipping) di halaman sekolah, tubuh kita melakukan tolakan dua kaki ke atas melewati tali. Perbedaan utama antara gerakan "Melompat" dan "Meloncat" dalam PJOK adalah ...',
              correct:
                "Melompat menggunakan tumpuan satu kaki, sedangkan meloncat menggunakan tumpuan dua kaki secara bersamaan",
              options: [
                "Melompat menggunakan tumpuan satu kaki, sedangkan meloncat menggunakan tumpuan dua kaki secara bersamaan",
                "Melompat dilakukan sambil duduk, sedangkan meloncat dilakukan sambil tidur",
                "Melompat tidak berpindah tempat, sedangkan meloncat menggunakan bola",
                "Keduanya hanya boleh dilakukan di dalam kolam renang",
              ],
              explanation:
                "Dalam gerak dasar lokomotor, melompat bertumpu pada satu kaki (seperti lompat jauh), sedangkan meloncat bertumpu pada dua kaki sekaligus (seperti loncat katak).",
            },
            {
              question:
                "Agar tubuh anak usia sekolah dasar dapat tumbuh sehat, bugar, dan bersemangat mengikuti pelajaran di pagi hari, kebiasaan pola makan dan istirahat yang paling tepat adalah ...",
              correct:
                "Tidur malam tepat waktu (8–10 jam) dan selalu sarapan makanan bergizi seimbang sebelum berangkat sekolah",
              options: [
                "Tidur malam tepat waktu (8–10 jam) dan selalu sarapan makanan bergizi seimbang sebelum berangkat sekolah",
                "Begadang bermain game sampai tengah malam lalu berangkat sekolah tanpa sarapan",
                "Hanya makan permen dan kerupuk setiap pagi tanpa minum air putih",
                "Berolahraga berat di bawah terik matahari siang saat perut sedang kosong",
              ],
              explanation:
                "Tidur yang cukup dan sarapan makanan bergizi (karbohidrat, lauk berprotein, sayur, buah, dan air putih) memberikan energi bagi otak dan otot untuk beraktivitas.",
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

  generateFromTemplate({
    grade = 3,
    subject = "matematika",
    topic = null,
    difficulty = "sedang",
  }) {
    const numGrade = [1, 2, 3, 4].includes(Number(grade)) ? Number(grade) : 3;
    const rawSubj = String(subject)
      .toLowerCase()
      .replace(/^g\d+_/, "");

    let subjKey = "matematika";
    if (rawSubj === "ipas") subjKey = "ipas";
    else if (rawSubj.includes("indonesia") || rawSubj === "bindo")
      subjKey = "bahasa_indonesia";
    else if (rawSubj.includes("inggris") || rawSubj === "bing")
      subjKey = "bahasa_inggris";
    else if (rawSubj.includes("pancasila") || rawSubj === "ppkn")
      subjKey = "pendidikan_pancasila";
    else if (rawSubj.includes("seni") || rawSubj === "senirupa")
      subjKey = "seni_rupa";
    else if (rawSubj === "pai" || rawSubj.includes("agama islam"))
      subjKey = "pai";
    else if (rawSubj.includes("madura")) subjKey = "bahasa_madura";
    else if (
      rawSubj === "pjok" ||
      rawSubj.includes("jasmani") ||
      rawSubj.includes("olahraga")
    )
      subjKey = "pjok";

    let pool = [];
    if (numGrade === 1) {
      pool = this.grade1Templates[subjKey] || this.grade1Templates.matematika;
    } else if (numGrade === 2) {
      pool = this.grade2Templates[subjKey] || this.grade2Templates.matematika;
    } else if (numGrade === 4) {
      if (subjKey === "ipas") pool = this.ipasGrade4Templates;
      else if (subjKey === "bahasa_indonesia") pool = this.bindoGrade4Templates;
      else if (subjKey === "bahasa_inggris") pool = this.bingGrade4Templates;
      else if (subjKey === "pendidikan_pancasila")
        pool = this.pancasilaGrade4Templates;
      else if (subjKey === "seni_rupa") pool = this.senirupaGrade4Templates;
      else pool = this.mathGrade4Templates;
    } else {
      if (subjKey === "ipas") pool = this.ipasTemplates;
      else if (subjKey === "bahasa_indonesia") pool = this.bindoTemplates;
      else if (subjKey === "bahasa_inggris") pool = this.bingTemplates;
      else if (subjKey === "pendidikan_pancasila")
        pool = this.pancasilaTemplates;
      else if (subjKey === "seni_rupa") pool = this.senirupaTemplates;
      else if (subjKey === "pai") pool = this.paiTemplates;
      else if (subjKey === "bahasa_madura") pool = this.maduraTemplates;
      else if (subjKey === "pjok") pool = this.pjokTemplates;
      else pool = this.mathTemplates;
    }

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
      grade: numGrade,
      subject: chosenTemplate.subject,
      topic: chosenTemplate.topic,
      subtopic: chosenTemplate.subtopic,
      difficulty: cleanDiff,
      question: rawResult.question,
      options: rawResult.options,
      correctAnswer: rawResult.correctAnswer,
      explanation: rawResult.explanation,
      visualId: rawResult.visualId || null,
      vocabHelp: rawResult.vocabHelp || null,
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

    if (!q.question || String(q.question).trim().length < 6) {
      errors.push("Teks pertanyaan tidak lengkap.");
    }

    const subj = String(q.subject || "").toLowerCase();
    const validSubjects = [
      "matematika",
      "ipas",
      "bahasa indonesia",
      "bahasa_indonesia",
      "bahasa inggris",
      "bahasa_inggris",
      "pendidikan pancasila",
      "pendidikan_pancasila",
      "ppkn",
      "seni rupa",
      "seni_rupa",
      "pendidikan agama islam",
      "pai",
      "bahasa madura",
      "bahasa_madura",
      "pjok",
      "pendidikan jasmani, olahraga, dan kesehatan",
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
      ...(questionBanks.seni_rupa || []),
      ...(questionBanks.pai || []),
      ...(questionBanks.bahasa_madura || []),
      ...(questionBanks.pjok || []),
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

    testTemplatePool("Matematika", "matematika", this.mathTemplates);
    testTemplatePool("IPAS", "ipas", this.ipasTemplates);
    testTemplatePool(
      "Bahasa Indonesia",
      "bahasa_indonesia",
      this.bindoTemplates,
    );
    testTemplatePool("Bahasa Inggris", "bahasa_inggris", this.bingTemplates);
    testTemplatePool(
      "Pendidikan Pancasila",
      "pendidikan_pancasila",
      this.pancasilaTemplates,
    );
    testTemplatePool("Seni Rupa", "seni_rupa", this.senirupaTemplates);
    testTemplatePool("Pendidikan Agama Islam", "pai", this.paiTemplates);
    testTemplatePool("Bahasa Madura", "bahasa_madura", this.maduraTemplates);
    testTemplatePool("PJOK", "pjok", this.pjokTemplates);

    return report;
  }
}

export const hybridEngine = new HybridQuestionEngine();
