
export const BALANCED_MC_OVERRIDES = {
  IPAS3_004: {
    options: ["Berudu", "Jentik nyamuk", "Kepompong", "Ulat air"],
    correctAnswer: "Berudu",
  },
  IPAS3_015: {
    options: ["Energi panas", "Energi gerak", "Energi bunyi", "Energi cahaya"],
    correctAnswer: "Energi panas",
  },
  IPAS3_019: {
    options: [
      "Belajar rajin dan menghormati orang tua",
      "Bermain game sepanjang waktu di rumah",
      "Meminta adik mengerjakan tugas sekolah",
      "Membiarkan meja belajar tetap berantakan",
    ],
    correctAnswer: "Belajar rajin dan menghormati orang tua",
  },
  IPAS3_021: {
    options: [
      "Kebutuhan primer",
      "Kebutuhan sekunder",
      "Kebutuhan tersier",
      "Kebutuhan hiburan",
    ],
    correctAnswer: "Kebutuhan primer",
  },
  IPAS3_023: {
    options: ["Kerja bakti", "Lomba desa", "Jual beli", "Pesta rakyat"],
    correctAnswer: "Kerja bakti",
  },
  IPAS3_024: {
    options: [
      "Berteman rukun tanpa membeda-bedakan suku",
      "Hanya bermain dengan teman satu daerah saja",
      "Menertawakan logat bicara teman yang berbeda",
      "Menjauhi teman yang punya kebiasaan berbeda",
    ],
    correctAnswer: "Berteman rukun tanpa membeda-bedakan suku",
  },
  BINDO3_002: {
    options: [
      "Menjaga kebersihan kelas tanggung jawab bersama",
      "Jadwal piket kelas dibuat oleh ketua kelas",
      "Belajar di rumah terasa jauh lebih nyaman",
      "Setiap siswa wajib membawa sapu dari rumah",
    ],
    correctAnswer: "Menjaga kebersihan kelas tanggung jawab bersama",
  },
  BINDO3_010: {
    options: [
      "Kita harus saling menolong saat teman kesulitan",
      "Kita sebaiknya tidak bermain dekat tepi sungai",
      "Semut kecil selalu mencari makan di dalam hutan",
      "Burung merpati suka terbang melintasi sungai",
    ],
    correctAnswer: "Kita harus saling menolong saat teman kesulitan",
  },
};

export const ADVENTURE_MULTITYPE_BANK = {
  ipas: [

    {
      id: "IPAS3_MATCH_01",
      grade: 3,
      subject: "IPAS",
      questionType: "matching",
      topic: "Panca Indraku",
      difficulty: "mudah",
      question: "Cocokkan alat indra manusia dengan fungsi yang tepat!",
      pairs: [
        { id: "p1", left: "Mata", right: "Melihat warna dan bentuk benda" },
        { id: "p2", left: "Telinga", right: "Mendengar suara di sekitar" },
        { id: "p3", left: "Lidah", right: "Mengecap rasa manis dan asin" },
      ],
      explanation:
        "Mata untuk melihat, telinga untuk mendengar, dan lidah untuk mengecap rasa makanan.",
    },
    {
      id: "IPAS3_MATCH_02",
      grade: 3,
      subject: "IPAS",
      questionType: "matching",
      topic: "Tumbuhan",
      difficulty: "mudah",
      question: "Cocokkan bagian tumbuhan dengan tugas utamanya!",
      pairs: [
        { id: "p1", left: "Akar", right: "Menyerap air dari dalam tanah" },
        {
          id: "p2",
          left: "Batang",
          right: "Menyalurkan air ke seluruh bagian",
        },
        { id: "p3", left: "Daun", right: "Tempat membuat makanan tumbuhan" },
      ],
      explanation:
        "Akar menyerap air, batang menyalurkan air dan menopang, sedangkan daun tempat fotosintesis.",
    },
    {
      id: "IPAS3_MATCH_03",
      grade: 3,
      subject: "IPAS",
      questionType: "matching",
      topic: "Rahasia Kehidupan Hewan",
      difficulty: "sedang",
      question: "Cocokkan hewan berikut dengan alat pernapasannya!",
      pairs: [
        { id: "p1", left: "Ikan mas", right: "Insang" },
        { id: "p2", left: "Kucing", right: "Paru-paru" },
        { id: "p3", left: "Belalang", right: "Trakea" },
      ],
      explanation:
        "Ikan bernapas dengan insang, kucing dengan paru-paru, dan serangga seperti belalang dengan trakea.",
    },
    {
      id: "IPAS3_MATCH_04",
      grade: 3,
      subject: "IPAS",
      questionType: "matching",
      topic: "Perubahan Wujud Benda",
      difficulty: "sulit",
      question: "Cocokkan peristiwa berikut dengan nama perubahan wujudnya!",
      pairs: [
        { id: "p1", left: "Es batu menjadi air", right: "Mencair" },
        { id: "p2", left: "Air dimasukkan ke freezer", right: "Membeku" },
        { id: "p3", left: "Baju basah dijemur jadi kering", right: "Menguap" },
      ],
      explanation:
        "Padat ke cair disebut mencair, cair ke padat disebut membeku, dan cair ke gas disebut menguap.",
    },

    {
      id: "IPAS3_ESSAY_01",
      grade: 3,
      subject: "IPAS",
      questionType: "essay",
      topic: "Tumbuhan",
      difficulty: "mudah",
      question: "Apa fungsi utama akar pada tumbuhan?",
      correctAnswer: "Menyerap air dan zat hara dari dalam tanah",
      acceptedAnswers: [
        "menyerap air",
        "menyerap air dari tanah",
        "menyerap air dan mineral",
        "menyerap air dan zat hara",
        "mengokohkan tumbuhan",
      ],
      requiredConcepts: [
        [
          "serap",
          "menyerap",
          "ambil",
          "mengambil",
          "hisap",
          "menghisap",
          "kokoh",
          "mengokohkan",
          "menahan",
        ],
        ["air", "hara", "mineral", "nutrisi", "tumbuhan", "tanaman", "berdiri"],
      ],
      clues: [
        "Coba bayangkan bagian tumbuhan yang letaknya tersembunyi di dalam tanah.",
        "Saat kita menyiram tanaman, bagian inilah yang mengambil sesuatu yang dibutuhkan tanaman.",
        "Jawabannya berkaitan dengan kegiatan mengambil/menyerap air dari tanah.",
      ],
      explanation:
        "Akar berada di dalam tanah untuk menyerap air dan zat hara serta mengokohkan berdirinya tumbuhan.",
    },
    {
      id: "IPAS3_ESSAY_02",
      grade: 3,
      subject: "IPAS",
      questionType: "essay",
      topic: "Tumbuhan",
      difficulty: "sedang",
      question:
        "Apa nama proses tumbuhan hijau membuat makanannya sendiri dengan bantuan cahaya matahari?",
      correctAnswer: "Fotosintesis",
      acceptedAnswers: ["fotosintesis", "proses fotosintesis"],
      requiredConcepts: [["fotosintesis"]],
      clues: [
        "Proses ini terjadi di bagian daun yang berwarna hijau.",
        "Tumbuhan membutuhkan cahaya matahari, air, dan udara untuk melakukannya.",
        'Nama prosesnya terdiri dari 1 kata yang diawali huruf "F".',
      ],
      explanation:
        "Fotosintesis adalah proses tumbuhan hijau memasak makanan dengan bantuan cahaya matahari.",
    },
    {
      id: "IPAS3_ESSAY_03",
      grade: 3,
      subject: "IPAS",
      questionType: "essay",
      topic: "Rahasia Kehidupan Hewan",
      difficulty: "sulit",
      question:
        "Sebutkan urutan daur hidup kupu-kupu mulai dari telur hingga dewasa!",
      correctAnswer: "Telur, ulat, kepompong, kupu-kupu",
      acceptedAnswers: [
        "telur ulat kepompong kupu kupu",
        "telur larva pupa kupu kupu",
      ],
      requiredConcepts: [
        ["telur"],
        ["ulat", "larva"],
        ["kepompong", "pupa"],
        ["kupu"],
      ],
      clues: [
        "Daur hidup kupu-kupu memiliki 4 tahap yang berbeda bentuknya.",
        "Setelah menetas dari telur, ia menjadi hewan kecil yang suka makan daun lalu berpuasa di dalam bungkus.",
        "Tuliskan 4 tahapnya berurutan: dimulai dari telur, lalu u..., ke..., dan terakhir ku...",
      ],
      explanation:
        "Kupu-kupu mengalami metamorfosis sempurna: telur → ulat (larva) → kepompong (pupa) → kupu-kupu dewasa.",
    },
  ],

  bahasa_indonesia: [

    {
      id: "BINDO3_MATCH_01",
      grade: 3,
      subject: "Bahasa Indonesia",
      questionType: "matching",
      topic: "Sinonim dan Antonim",
      difficulty: "mudah",
      question: "Cocokkan setiap kata dengan lawan katanya (antonim)!",
      pairs: [
        { id: "p1", left: "Bersih", right: "Kotor" },
        { id: "p2", left: "Rajin", right: "Malas" },
        { id: "p3", left: "Tinggi", right: "Rendah" },
      ],
      explanation:
        "Antonim adalah kata yang berlawanan makna: bersih >< kotor, rajin >< malas, tinggi >< rendah.",
    },
    {
      id: "BINDO3_MATCH_02",
      grade: 3,
      subject: "Bahasa Indonesia",
      questionType: "matching",
      topic: "Huruf Kapital dan Tanda Baca",
      difficulty: "sedang",
      question: "Cocokkan jenis kalimat dengan tanda baca penutup yang tepat!",
      pairs: [
        { id: "p1", left: "Kalimat berita", right: "Tanda titik (.)" },
        { id: "p2", left: "Kalimat tanya", right: "Tanda tanya (?)" },
        { id: "p3", left: "Kalimat perintah", right: "Tanda seru (!)" },
      ],
      explanation:
        "Kalimat berita diakhiri titik (.), kalimat tanya diakhiri (?), dan kalimat perintah diakhiri (!).",
    },
    {
      id: "BINDO3_MATCH_03",
      grade: 3,
      subject: "Bahasa Indonesia",
      questionType: "matching",
      topic: "Kosakata dan Makna Kata",
      difficulty: "sulit",
      question:
        "Cocokkan kata sifat berikut dengan persamaan maknanya (sinonim)!",
      pairs: [
        { id: "p1", left: "Pintar", right: "Pandai" },
        { id: "p2", left: "Gembira", right: "Senang" },
        { id: "p3", left: "Hemat", right: "Cermat memakai uang" },
      ],
      explanation:
        "Sinonim adalah persamaan makna kata: pintar = pandai, gembira = senang, hemat = cermat memakai uang.",
    },

    {
      id: "BINDO3_ESSAY_01",
      grade: 3,
      subject: "Bahasa Indonesia",
      questionType: "essay",
      topic: "Sinonim dan Antonim",
      difficulty: "mudah",
      question: 'Apa lawan kata (antonim) dari kata "rajin"?',
      correctAnswer: "Malas",
      acceptedAnswers: ["malas", "pemalas"],
      requiredConcepts: [["malas", "pemalas"]],
      clues: [
        "Pikirkan sifat seseorang yang tidak mau belajar atau enggan membantu pekerjaan.",
        "Lawan kata berarti kebalikan arti dari sifat giat bekerja.",
        'Jawabannya 1 kata (5 huruf) yang diawali huruf "M".',
      ],
      explanation: "Lawan kata (antonim) dari rajin adalah malas.",
    },
    {
      id: "BINDO3_ESSAY_02",
      grade: 3,
      subject: "Bahasa Indonesia",
      questionType: "essay",
      topic: "Menyusun Kalimat",
      difficulty: "sedang",
      question:
        'Susun kata acak berikut menjadi kalimat yang benar: "buku - di kelas - membaca - Rina"',
      correctAnswer: "Rina membaca buku di kelas",
      acceptedAnswers: [
        "rina membaca buku di kelas",
        "di kelas rina membaca buku",
      ],
      requiredConcepts: [["rina"], ["membaca"], ["buku"], ["kelas"]],
      clues: [
        "Mulailah kalimat dengan nama orang (Subjek) yang melakukan kegiatan.",
        "Setelah nama orang, letakkan kata kerjanya lalu benda yang dibaca.",
        "Polanya: Siapa + melakukan apa + benda apa + di mana.",
      ],
      explanation:
        "Susunan kalimat yang tepat mengikuti pola S-P-O-K: Rina membaca buku di kelas.",
    },
    {
      id: "BINDO3_ESSAY_03",
      grade: 3,
      subject: "Bahasa Indonesia",
      questionType: "essay",
      topic: "Membaca dan Memahami Teks Pendek",
      difficulty: "sulit",
      question:
        'Bacalah kalimat: "Budi mencuci tangan dengan sabun sebelum makan agar tidak sakit perut." Mengapa Budi mencuci tangan?',
      correctAnswer: "Agar tidak sakit perut",
      acceptedAnswers: [
        "agar tidak sakit perut",
        "supaya tidak sakit perut",
        "agar kuman hilang dan tidak sakit perut",
        "supaya bersih dan tidak sakit perut",
      ],
      requiredConcepts: [
        ["tidak", "jangan", "hindar", "cegah", "bebas"],
        ["sakit", "kuman", "perut"],
      ],
      clues: [
        'Baca kembali bagian akhir kalimat setelah kata "agar".',
        'Kata "agar" menunjukkan alasan atau tujuan seseorang melakukan sesuatu.',
        "Tulis alasan yang berkaitan dengan kesehatan perut Budi.",
      ],
      explanation:
        "Tujuan Budi mencuci tangan dengan sabun adalah agar kuman hilang dan tidak sakit perut.",
    },
  ],

  matematika: [

    {
      id: "MTK3_MATCH_01",
      grade: 3,
      subject: "Matematika",
      questionType: "matching",
      topic: "Bangun Datar",
      difficulty: "mudah",
      question: "Cocokkan nama bangun datar dengan jumlah sisinya!",
      pairs: [
        { id: "p1", left: "Segitiga", right: "3 sisi" },
        { id: "p2", left: "Persegi", right: "4 sisi sama panjang" },
        { id: "p3", left: "Segilima", right: "5 sisi" },
      ],
      explanation:
        "Segitiga punya 3 sisi, persegi punya 4 sisi sama panjang, dan segilima punya 5 sisi.",
    },
    {
      id: "MTK3_MATCH_02",
      grade: 3,
      subject: "Matematika",
      questionType: "matching",
      topic: "Pengukuran",
      difficulty: "sedang",
      question: "Cocokkan satuan ukuran berikut dengan nilainya yang sama!",
      pairs: [
        { id: "p1", left: "1 meter", right: "100 cm" },
        { id: "p2", left: "1 kilogram", right: "1.000 gram" },
        { id: "p3", left: "1 jam", right: "60 menit" },
      ],
      explanation: "1 m = 100 cm, 1 kg = 1.000 gram, dan 1 jam = 60 menit.",
    },

    {
      id: "MTK3_ESSAY_01",
      grade: 3,
      subject: "Matematika",
      questionType: "essay",
      topic: "Bangun Datar",
      difficulty: "mudah",
      question:
        "Sebuah meja berbentuk persegi memiliki panjang sisi 6 cm. Berapa cm keliling meja tersebut? (Tulis angkanya saja)",
      correctAnswer: "24",
      acceptedAnswers: ["24", "24 cm", "24cm"],
      requiredConcepts: [["24"]],
      clues: [
        "Bangun persegi memiliki 4 sisi yang sama panjang.",
        "Untuk mencari keliling persegi, kalikan panjang sisi dengan 4.",
        "Hitunglah hasil dari 4 × 6.",
      ],
      explanation: "Keliling persegi = 4 × sisi = 4 × 6 cm = 24 cm.",
    },
    {
      id: "MTK3_ESSAY_02",
      grade: 3,
      subject: "Matematika",
      questionType: "essay",
      topic: "Pengukuran",
      difficulty: "sedang",
      question:
        "Panjang pita Lani adalah 2 meter lebih 35 cm. Berapa cm panjang seluruh pita Lani?",
      correctAnswer: "235",
      acceptedAnswers: ["235", "235 cm", "235cm"],
      requiredConcepts: [["235"]],
      clues: [
        "Ubah dulu satuan meter menjadi sentimeter (1 meter = 100 cm).",
        "2 meter sama dengan 200 cm.",
        "Sekarang jumlahkan 200 cm ditambah 35 cm.",
      ],
      explanation: "2 meter = 200 cm. Jadi 200 cm + 35 cm = 235 cm.",
    },
  ],

  bahasa_inggris: [
    {
      id: "BING3_MATCH_01",
      grade: 3,
      subject: "Bahasa Inggris",
      questionType: "matching",
      topic: "Vocabulary",
      difficulty: "mudah",
      question:
        "Cocokkan kata Bahasa Inggris dengan artinya dalam Bahasa Indonesia!",
      pairs: [
        { id: "p1", left: "Apple", right: "Apel" },
        { id: "p2", left: "Book", right: "Buku" },
        { id: "p3", left: "Water", right: "Air" },
      ],
      explanation: "Apple = apel, Book = buku, dan Water = air.",
    },
    {
      id: "BING3_ESSAY_01",
      grade: 3,
      subject: "Bahasa Inggris",
      questionType: "essay",
      topic: "Greetings",
      difficulty: "mudah",
      question: 'Apa ucapan "Selamat pagi" dalam Bahasa Inggris?',
      correctAnswer: "Good morning",
      acceptedAnswers: ["good morning"],
      requiredConcepts: [["good"], ["morning"]],
      clues: [
        "Ucapan ini terdiri dari 2 kata Bahasa Inggris.",
        'Kata pertamanya adalah "Good".',
        'Kata keduanya berarti pagi dan diawali huruf "m".',
      ],
      explanation: '"Selamat pagi" dalam Bahasa Inggris adalah "Good morning".',
    },
  ],

  pendidikan_pancasila: [
    {
      id: "PPKN3_MATCH_01",
      grade: 3,
      subject: "Pendidikan Pancasila",
      questionType: "matching",
      topic: "Lambang Pancasila",
      difficulty: "mudah",
      question: "Cocokkan sila Pancasila dengan lambangnya yang tepat!",
      pairs: [
        { id: "p1", left: "Sila ke-1", right: "Bintang" },
        { id: "p2", left: "Sila ke-2", right: "Rantai" },
        { id: "p3", left: "Sila ke-3", right: "Pohon Beringin" },
      ],
      explanation:
        "Sila 1 = Bintang, Sila 2 = Rantai, dan Sila 3 = Pohon Beringin.",
    },
    {
      id: "PPKN3_ESSAY_01",
      grade: 3,
      subject: "Pendidikan Pancasila",
      questionType: "essay",
      topic: "Persatuan",
      difficulty: "sedang",
      question:
        'Apa arti dari semboyan negara Indonesia "Bhinneka Tunggal Ika"?',
      correctAnswer: "Berbeda-beda tetapi tetap satu jua",
      acceptedAnswers: [
        "berbeda beda tetapi tetap satu",
        "berbeda beda tapi tetap satu jua",
      ],
      requiredConcepts: [["beda", "berbeda"], ["satu"]],
      clues: [
        "Semboyan ini mengajarkan persatuan meski suku dan budaya kita bermacam-macam.",
        'Kalimatnya dimulai dengan kata "Berbeda-beda...".',
        "Walaupun berbeda-beda, kita tetap menjadi ... jua.",
      ],
      explanation:
        "Bhinneka Tunggal Ika berarti berbeda-beda tetapi tetap satu jua.",
    },
  ],
};

export function generateDynamicMultiTypeMath(
  type = "essay",
  difficulty = "mudah",
) {
  const uid = `MTK_DYN_${type.toUpperCase()}_${Date.now()}_${Math.floor(Math.random() * 999)}`;

  if (type === "matching") {
    const base = difficulty === "sulit" ? 12 : difficulty === "sedang" ? 7 : 3;
    const n1 = base + Math.floor(Math.random() * 4);
    const n2 = n1 + 2;
    const n3 = n2 + 2;
    const mult = difficulty === "sulit" ? 6 : difficulty === "sedang" ? 4 : 3;
    return {
      id: uid,
      grade: 3,
      subject: "Matematika",
      questionType: "matching",
      topic: "Perkalian",
      difficulty,
      question: "Cocokkan setiap operasi perkalian dengan hasil yang benar!",
      pairs: [
        { id: "p1", left: `${n1} × ${mult}`, right: `${n1 * mult}` },
        { id: "p2", left: `${n2} × ${mult}`, right: `${n2 * mult}` },
        { id: "p3", left: `${n3} × ${mult}`, right: `${n3 * mult}` },
      ],
      explanation: `${n1}×${mult}=${n1 * mult}, ${n2}×${mult}=${n2 * mult}, dan ${n3}×${mult}=${n3 * mult}.`,
      sourceType: "dynamic_template",
    };
  }

  const a =
    difficulty === "sulit"
      ? 120 + Math.floor(Math.random() * 140)
      : difficulty === "sedang"
        ? 45 + Math.floor(Math.random() * 40)
        : 14 + Math.floor(Math.random() * 20);
  const b =
    difficulty === "sulit"
      ? 85 + Math.floor(Math.random() * 90)
      : difficulty === "sedang"
        ? 25 + Math.floor(Math.random() * 30)
        : 11 + Math.floor(Math.random() * 15);
  const ans = a + b;
  const tensHint = Math.floor(ans / 10) * 10;

  return {
    id: uid,
    grade: 3,
    subject: "Matematika",
    questionType: "essay",
    topic: "Penjumlahan",
    difficulty,
    question: `Hitunglah hasil penjumlahan dari ${a} + ${b} = ... (Ketik angkanya)`,
    correctAnswer: String(ans),
    acceptedAnswers: [String(ans)],
    requiredConcepts: [[String(ans)]],
    clues: [
      "Jumlahkan angka satuan (bagian belakang) terlebih dahulu.",
      `Setelah menjumlahkan satuan, jumlahkan puluhan dari ${a} dan ${b}.`,
      `Hasil akhirnya berada di kisaran angka ${tensHint} sampai ${tensHint + 9}.`,
    ],
    explanation: `Hasil dari ${a} + ${b} adalah ${ans}.`,
    sourceType: "dynamic_template",
  };
}
