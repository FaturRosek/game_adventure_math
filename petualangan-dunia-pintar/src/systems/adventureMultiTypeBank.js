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
      topic: "Bab 1 — My Self",
      difficulty: "mudah",
      question:
        "Match the question with the best response! (Cocokkan pertanyaan dengan jawabannya)",
      pairs: [
        { id: "p1", left: "What is your name?", right: "My name is Edo." },
        {
          id: "p2",
          left: "What is your favorite activity?",
          right: "I like cycling.",
        },
        { id: "p3", left: "Nice to meet you.", right: "Nice to meet you too." },
      ],
      explanation:
        "Setiap ungkapan perkenalan dan aktivitas favorit dipasangkan dengan respons percakapan yang tepat.",
    },
    {
      id: "BING3_MATCH_02",
      grade: 3,
      subject: "Bahasa Inggris",
      questionType: "matching",
      topic: "Bab 2 — My Family",
      difficulty: "sedang",
      question: "Match each family member with the right description!",
      pairs: [
        { id: "p1", left: "Grandfather", right: "My father's father" },
        { id: "p2", left: "Aunt", right: "My mother's sister" },
        { id: "p3", left: "Parents", right: "My father and mother" },
      ],
      explanation:
        "Grandfather = kakek, Aunt = bibi/tante, dan Parents = orang tua (ayah dan ibu).",
    },
    {
      id: "BING3_MATCH_03",
      grade: 3,
      subject: "Bahasa Inggris",
      questionType: "matching",
      topic: "Bab 3 — My Family's Activities at Home",
      difficulty: "sulit",
      question: "Match the activity at home with the right place!",
      pairs: [
        { id: "p1", left: "Cooking breakfast", right: "In the kitchen" },
        { id: "p2", left: "Watering the flowers", right: "In the garden" },
        { id: "p3", left: "Tidying the bed", right: "In the bedroom" },
      ],
      explanation:
        "Memasak di dapur (kitchen), menyiram bunga di taman (garden), dan merapikan tempat tidur di kamar (bedroom).",
    },

    {
      id: "BING3_ESSAY_01",
      grade: 3,
      subject: "Bahasa Inggris",
      questionType: "essay",
      topic: "Bab 1 — My Self",
      difficulty: "mudah",
      question:
        'Complete the sentence to introduce yourself: "Hello! My ___ is Rina."',
      correctAnswer: "name",
      acceptedAnswers: ["name", "my name is rina"],
      requiredConcepts: [["name"]],
      clues: [
        "Kalimat ini digunakan untuk menyebutkan nama diri sendiri.",
        'Kata yang hilang dalam Bahasa Indonesia berarti "nama".',
        'Jawabannya 1 kata Bahasa Inggris (4 huruf) yang diawali huruf "n".',
      ],
      explanation:
        'Untuk memperkenalkan nama diri dalam Bahasa Inggris, kita mengucapkan "My name is ...".',
    },
    {
      id: "BING3_ESSAY_02",
      grade: 3,
      subject: "Bahasa Inggris",
      questionType: "essay",
      topic: "Bab 2 — My Family",
      difficulty: "sedang",
      visualId: "en_family_tree",
      question:
        "Look at the family tree! Who is Mrs. Ani to Raka? (Write in English)",
      correctAnswer: "mother",
      acceptedAnswers: ["mother", "mom", "his mother", "my mother"],
      requiredConcepts: [["mother", "mom", "mama"]],
      clues: [
        "Lihat kotak berwarna merah muda di bagian atas bagan keluarga.",
        "Mrs. Ani adalah ibu dari Raka dan Lina.",
        'Tuliskan kata "ibu" dalam Bahasa Inggris (diawali huruf "m").',
      ],
      explanation:
        'Mrs. Ani adalah ibu Raka, yang dalam Bahasa Inggris disebut "mother".',
    },
    {
      id: "BING3_ESSAY_03",
      grade: 3,
      subject: "Bahasa Inggris",
      questionType: "essay",
      topic: "Bab 3 — My Family's Activities at Home",
      difficulty: "sulit",
      question:
        'Complete the sentence: "Mother is in the kitchen. She is ___ dinner for our family."',
      vocabHelp: "dinner = makan malam",
      correctAnswer: "cooking",
      acceptedAnswers: ["cooking", "making", "preparing"],
      requiredConcepts: [["cooking", "making", "preparing"]],
      clues: [
        "Pikirkan kegiatan yang dilakukan Ibu di dapur (kitchen) untuk menyiapkan makan malam.",
        'Dalam Bahasa Indonesia, kata kerjanya berarti "sedang memasak".',
        'Kata Bahasa Inggrisnya berakhiran "-ing" dan diawali huruf "c".',
      ],
      explanation:
        'Kegiatan memasak di dapur dalam Bahasa Inggris adalah "cooking".',
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

  seni_rupa: [

    {
      id: "SR3_MATCH_01",
      grade: 3,
      subject: "Seni Rupa",
      questionType: "matching",
      topic: "Bab 1 — Eksplorasi Garis dan Bentuk",
      difficulty: "mudah",
      question:
        "Cocokkan jenis garis atau bentuk dengan contoh bendanya di sekitar kita!",
      pairs: [
        { id: "p1", left: "Garis bergelombang", right: "Ombak air laut" },
        {
          id: "p2",
          left: "Bentuk geometris",
          right: "Papan tulis persegi panjang",
        },
        { id: "p3", left: "Bentuk organik", right: "Awan dan dedaunan" },
      ],
      explanation:
        "Ombak memakai garis bergelombang, papan tulis berbentuk geometris, dan awan/daun berbentuk organik.",
    },
    {
      id: "SR3_MATCH_02",
      grade: 3,
      subject: "Seni Rupa",
      questionType: "matching",
      topic: "Bab 2 — Eksplorasi Warna",
      difficulty: "mudah",
      visualId: "sr_color_wheel",
      question:
        "Amati roda warna di atas! Cocokkan campuran warna primer dengan warna sekunder hasilnya!",
      pairs: [
        { id: "p1", left: "Merah + Kuning", right: "Oranye" },
        { id: "p2", left: "Kuning + Biru", right: "Hijau" },
        { id: "p3", left: "Merah + Biru", right: "Ungu" },
      ],
      explanation:
        "Merah+Kuning = Oranye, Kuning+Biru = Hijau, dan Merah+Biru = Ungu.",
    },
    {
      id: "SR3_MATCH_03",
      grade: 3,
      subject: "Seni Rupa",
      questionType: "matching",
      topic: "Bab 4 — Eksplorasi Komposisi",
      difficulty: "sedang",
      question: "Cocokkan jenis komposisi keseimbangan dengan ciri susunannya!",
      pairs: [
        {
          id: "p1",
          left: "Komposisi simetris",
          right: "Kiri dan kanan sama persis",
        },
        {
          id: "p2",
          left: "Komposisi asimetris",
          right: "Berbeda bentuk tetapi seimbang",
        },
        {
          id: "p3",
          left: "Komposisi radial",
          right: "Memancar dari titik tengah",
        },
      ],
      explanation:
        "Simetris sama persis kiri-kanan, asimetris berbeda namun seimbang, dan radial memancar dari pusat.",
    },
    {
      id: "SR3_MATCH_04",
      grade: 3,
      subject: "Seni Rupa",
      questionType: "matching",
      topic: "Bab 5 — Mengenal dan Mengeksplorasi Tekstur",
      difficulty: "sulit",
      visualId: "sr_texture_animals",
      question:
        "Amati gambar hewan di atas! Cocokkan hewan dengan tekstur permukaan tubuhnya!",
      pairs: [
        { id: "p1", left: "Kucing", right: "Berbulu lembut" },
        { id: "p2", left: "Ikan", right: "Bersisik licin" },
        { id: "p3", left: "Kura-kura", right: "Bertempurung keras" },
      ],
      explanation:
        "Setiap hewan memiliki tekstur tubuh khas: kucing berbulu lembut, ikan bersisik licin, dan kura-kura bertempurung keras.",
    },

    {
      id: "SR3_ESSAY_01",
      grade: 3,
      subject: "Seni Rupa",
      questionType: "essay",
      topic: "Bab 2 — Eksplorasi Warna",
      difficulty: "mudah",
      visualId: "sr_color_primary",
      question:
        "Amati tiga warna pokok pada gambar di atas! Sebutkan ketiga warna primer tersebut!",
      correctAnswer: "Merah, kuning, dan biru",
      acceptedAnswers: [
        "merah kuning biru",
        "merah, kuning, biru",
        "merah kuning dan biru",
      ],
      requiredConcepts: [["merah"], ["kuning"], ["biru"]],
      clues: [
        "Lihat ketiga lingkaran warna yang ditampilkan di bagian atas soal.",
        "Warna primer terdiri dari 3 warna dasar yang tidak bisa dibuat dari campuran warna lain.",
        "Sebutkan 3 warnanya: diawali huruf M, K, dan B.",
      ],
      explanation:
        "Tiga warna primer dalam seni rupa adalah merah, kuning, dan biru.",
    },
    {
      id: "SR3_ESSAY_02",
      grade: 3,
      subject: "Seni Rupa",
      questionType: "essay",
      topic: "Bab 3 — Menggambar Cerita",
      difficulty: "sedang",
      visualId: "sr_art_tools",
      question:
        "Alat apa yang digunakan untuk menghapus garis sketsa pensil yang salah saat menggambar cerita?",
      correctAnswer: "Penghapus",
      acceptedAnswers: ["penghapus", "karet penghapus", "stipo"],
      requiredConcepts: [["penghapus", "hapus"]],
      clues: [
        "Lihat benda berwarna merah muda di bagian tengah gambar alat di atas.",
        "Benda ini terbuat dari karet lembut yang selalu dipakai bersama pensil.",
        'Jawabannya 1 kata yang diawali "Peng...".',
      ],
      explanation:
        "Penghapus digunakan untuk membersihkan atau memperbaiki garis sketsa pensil.",
    },
    {
      id: "SR3_ESSAY_03",
      grade: 3,
      subject: "Seni Rupa",
      questionType: "essay",
      topic: "Bab 4 — Eksplorasi Komposisi",
      difficulty: "sedang",
      visualId: "sr_comp_symmetric",
      question:
        "Amati gambar di atas! Jika sisi kiri dan kanan memiliki bentuk serta ukuran yang sama persis, disebut komposisi keseimbangan apa?",
      correctAnswer: "Simetris",
      acceptedAnswers: [
        "simetris",
        "komposisi simetris",
        "formal",
        "komposisi formal",
      ],
      requiredConcepts: [["simetris", "formal"]],
      clues: [
        "Bayangkan kertas yang dilipat tepat di garis putus-putus tengah, lalu sisi kiri dan kanannya saling menumpuk pas.",
        "Komposisi ini disebut juga komposisi formal.",
        'Nama lainnya terdiri dari 1 kata yang diawali huruf "S".',
      ],
      explanation:
        "Susunan kiri dan kanan yang sama persis disebut komposisi formal atau simetris.",
    },
    {
      id: "SR3_ESSAY_04",
      grade: 3,
      subject: "Seni Rupa",
      questionType: "essay",
      topic: "Bab 5 — Mengenal dan Mengeksplorasi Tekstur",
      difficulty: "sulit",
      visualId: "sr_texture_frottage",
      question:
        "Amati gambar di atas! Apa nama teknik memindahkan pola tekstur koin ke atas kertas dengan cara menggosoknya memakai krayon atau pensil?",
      correctAnswer: "Teknik gosok",
      acceptedAnswers: ["teknik gosok", "gosok", "frottage", "menggosok"],
      requiredConcepts: [["gosok", "menggosok", "frottage"]],
      clues: [
        "Perhatikan gerakan krayon di atas kertas yang di bawahnya terdapat uang koin.",
        "Nama tekniknya sesuai dengan cara kita menggerakkan krayon di atas permukaan kertas.",
        'Jawabannya adalah "Teknik ..." (diawali huruf "g") atau istilah "frottage".',
      ],
      explanation:
        "Teknik memindahkan tekstur benda timbul ke kertas dengan menggosok krayon/pensil disebut teknik gosok (frottage).",
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
