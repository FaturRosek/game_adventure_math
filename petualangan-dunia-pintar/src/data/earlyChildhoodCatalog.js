export const EARLY_CHILDHOOD_CATEGORIES = [
  {
    id: "huruf",
    name: "Mengenal Huruf",
    icon: "🔤",
    color: "#74b9ff",
    desc: "Alfabet A–Z, huruf & gambar",
  },
  {
    id: "angka",
    name: "Mengenal Angka",
    icon: "🔢",
    color: "#ffb142",
    desc: "Hitung benda, angka 1–10 & urutan",
  },
  {
    id: "warna_bentuk",
    name: "Warna dan Bentuk",
    icon: "🌈",
    color: "#ff9ff3",
    desc: "Warna, bentuk & memilah objek",
  },
  {
    id: "hewan",
    name: "Dunia Hewan",
    icon: "🦁",
    color: "#55efc4",
    desc: "Nama, suara, makanan & habitat",
  },
  {
    id: "buah_sayur",
    name: "Buah dan Sayuran",
    icon: "🍓",
    color: "#ff7675",
    desc: "Kenali & kelompokkan buah sayur",
  },
  {
    id: "kendaraan",
    name: "Kendaraan",
    icon: "🚗",
    color: "#48dbfb",
    desc: "Jenis, suara & guna kendaraan",
  },
  {
    id: "puzzle_logika",
    name: "Puzzle dan Logika",
    icon: "🧩",
    color: "#a29bfe",
    desc: "Puzzle, pasangan & cari beda",
  },
  {
    id: "kreativitas",
    name: "Kreativitas",
    icon: "🎨",
    color: "#fd79a8",
    desc: "Mewarnai, menghias & susun bentuk",
  },
  {
    id: "bermain_peran",
    name: "Bermain Peran",
    icon: "👩‍🍳",
    color: "#feca57",
    desc: "Memasak, belanja, dokter & petani",
  },
  {
    id: "petualangan",
    name: "Petualangan",
    icon: "🗺️",
    color: "#1dd1a1",
    desc: "Hutan, kebun, pantai & harta karun",
  },
  {
    id: "musik_suara",
    name: "Musik dan Suara",
    icon: "🎵",
    color: "#c56cf0",
    desc: "Alat musik, suara & ikut irama",
  },
  {
    id: "kehidupan_harian",
    name: "Kehidupan Sehari-hari",
    icon: "🏡",
    color: "#81ecec",
    desc: "Mandi, sikat gigi, baju & rapi",
  },
];

export function getEarlyChildhoodLevelActivities(
  gradeKey,
  categoryId,
  levelNum,
) {
  const isTk = gradeKey === "tk";
  const lvl = Math.max(1, Math.min(6, Number(levelNum) || 1));
  const list = [];

  for (let i = 0; i < 10; i++) {
    const slot = (i + lvl) % 4;

    if (categoryId === "huruf") {
      const alphabet = [
        "A",
        "B",
        "C",
        "D",
        "E",
        "F",
        "G",
        "H",
        "I",
        "K",
        "L",
        "M",
        "S",
        "T",
      ];
      const target = alphabet[(lvl * 2 + i) % alphabet.length];
      if (slot === 0) {
        list.push({
          type: "world_catch",
          prompt: `Tangkap balon huruf "${target}"!`,
          voicePrompt: `Ayo tangkap balon bertuliskan huruf ${target}!`,
          helpText: `Gerakkan karakter ke bawah bola huruf ${target}.`,
          targetLabel: target,
          targetCount: isTk ? 4 : 3,
          decoys: alphabet.filter((x) => x !== target),
        });
      } else if (slot === 1) {
        list.push({
          type: "drag_match",
          prompt: "Cocokkan huruf dengan gambar yang sesuai!",
          voicePrompt: "Seret gambar ke huruf awal yang tepat!",
          helpText: "Apel huruf A, Bola huruf B.",
          pairs: [
            {
              id: "a",
              item: "🍎",
              label: "Apel",
              targetLabel: "Huruf A",
              color: "#fadbd8",
            },
            {
              id: "b",
              item: "⚽",
              label: "Bola",
              targetLabel: "Huruf B",
              color: "#d6eaf8",
            },
            ...(isTk
              ? [
                  {
                    id: "c",
                    item: "🌶️",
                    label: "Cabai",
                    targetLabel: "Huruf C",
                    color: "#fef9e7",
                  },
                ]
              : []),
          ],
        });
      } else if (slot === 2) {
        list.push({
          type: "trace_path",
          prompt: `Tebalkan bentuk huruf "${target}"!`,
          voicePrompt: `Tebalkan semua titik kuning pada huruf ${target}!`,
          helpText: "Usap semua titik kuning hingga berubah hijau.",
          symbol: target,
        });
      } else {
        const word = isTk ? ["B", "U", "K", "U"] : ["A", "B", "C"];
        list.push({
          type: "build_sequence",
          prompt: isTk
            ? "Susun huruf menjadi kata BUKU!"
            : "Susun urutan huruf A, B, C!",
          voicePrompt: isTk
            ? "Ayo susun huruf menjadi kata buku!"
            : "Susun huruf A, B, lalu C!",
          helpText: `Mulai dari huruf ${word[0]}.`,
          items: word,
        });
      }
    } else if (categoryId === "angka") {
      const count = isTk ? Math.min(10, 4 + lvl) : Math.min(5, 2 + (lvl % 4));
      if (slot === 0) {
        list.push({
          type: "world_harvest_deliver",
          prompt: `Kumpulkan ${count} bintang angka ke keranjang!`,
          voicePrompt: `Ayo kumpulkan ${count} bintang ke keranjang!`,
          helpText: "Ambil bintang lalu bawa ke keranjang di kanan.",
          targetIcon: "⭐",
          targetCount: count,
          deliverZone: { icon: "🧺", label: "Keranjang" },
          bgTop: "#ffeaa7",
          bgBot: "#81ecec",
        });
      } else if (slot === 1) {
        const seq = isTk ? ["4", "5", "6", "7"] : ["1", "2", "3"];
        list.push({
          type: "build_sequence",
          prompt: "Urutkan angka dari yang terkecil!",
          voicePrompt: "Ayo urutkan angka dari yang paling kecil!",
          helpText: `Klik angka ${seq[0]} terlebih dahulu.`,
          items: seq,
        });
      } else if (slot === 2) {
        list.push({
          type: "drag_match",
          prompt: "Cocokkan jumlah benda dengan angkanya!",
          voicePrompt: "Hitung benda lalu seret ke angka yang benar!",
          helpText: "Hitung satu per satu sebelum memasangkan.",
          pairs: [
            {
              id: "n1",
              item: "🎈",
              label: "1 Balon",
              targetLabel: "Angka 1",
              color: "#fadbd8",
            },
            {
              id: "n2",
              item: "🎈🎈",
              label: "2 Balon",
              targetLabel: "Angka 2",
              color: "#d6eaf8",
            },
            ...(isTk
              ? [
                  {
                    id: "n3",
                    item: "🎈🎈🎈",
                    label: "3 Balon",
                    targetLabel: "Angka 3",
                    color: "#d4efdf",
                  },
                ]
              : []),
          ],
        });
      } else {
        const sym = String(((lvl + i) % 9) + 1);
        list.push({
          type: "trace_path",
          prompt: `Tebalkan angka "${sym}"!`,
          voicePrompt: `Ayo tebalkan bentuk angka ${sym}!`,
          helpText: "Ikuti semua titik kuning.",
          symbol: sym,
        });
      }
    } else if (categoryId === "warna_bentuk") {
      const colors = [
        { id: "merah", name: "Merah", hex: "#ff7675" },
        { id: "kuning", name: "Kuning", hex: "#fdcb6e" },
        { id: "biru", name: "Biru", hex: "#74b9ff" },
        { id: "hijau", name: "Hijau", hex: "#55efc4" },
      ];
      const tc = colors[(lvl + i) % colors.length];
      if (slot === 0) {
        list.push({
          type: "brush_paint",
          prompt: `Warnai lingkaran ini dengan warna ${tc.name}!`,
          voicePrompt: `Pilih warna ${tc.name}, lalu gosokkan kuas di dalam lingkaran!`,
          helpText: `Klik tombol warna ${tc.name} lalu warnai gambar.`,
          targetColor: tc,
          palette: colors,
        });
      } else if (slot === 1) {
        list.push({
          type: "drag_match",
          prompt: "Cocokkan bentuk ke lubang yang sama!",
          voicePrompt: "Masukkan setiap bentuk ke lubang yang cocok!",
          helpText: "Lingkaran ke lingkaran, kotak ke kotak.",
          pairs: [
            {
              id: "b1",
              item: "🔴",
              label: "Lingkaran",
              targetLabel: "Lubang Bulat",
              color: "#fadbd8",
            },
            {
              id: "b2",
              item: "🟦",
              label: "Persegi",
              targetLabel: "Lubang Kotak",
              color: "#d6eaf8",
            },
          ],
        });
      } else if (slot === 2) {
        list.push({
          type: "build_sequence",
          prompt: "Susun pola warna pelangi!",
          voicePrompt: "Susun urutan warna merah, kuning, lalu biru!",
          helpText: "Klik warna merah dahulu.",
          items: isTk ? ["🔴", "🟡", "🟢", "🔵"] : ["🔴", "🟡", "🔵"],
        });
      } else {
        list.push({
          type: "memory_odd",
          submode: "odd_one_out",
          prompt: "Cari 1 bentuk yang berbeda!",
          voicePrompt: "Klik satu bentuk yang berbeda dari teman-temannya!",
          helpText: "Lihat bentuk mana yang tidak sama.",
          items: ["🔵", "🔵", "🔺", "🔵"],
          oddIdx: 2,
        });
      }
    } else if (categoryId === "hewan") {
      if (slot === 0) {
        const animals = [
          {
            id: "kucing",
            name: "Kucing",
            icon: "🐱",
            soundText: "Meong, meong! Siapakah aku?",
          },
          {
            id: "sapi",
            name: "Sapi",
            icon: "🐄",
            soundText: "Mooo, mooo! Siapakah aku?",
          },
          {
            id: "ayam",
            name: "Ayam",
            icon: "🐔",
            soundText: "Kukuruyuk! Siapakah aku?",
          },
        ];
        list.push({
          type: "animal_sound_quiz",
          prompt: "Tebak nama hewan dari suaranya!",
          voicePrompt: "Dengarkan suara hewan lalu klik gambar hewannya!",
          helpText: "Klik tombol hijau untuk mendengar suara lagi.",
          target: animals[(lvl + i) % animals.length],
          options: animals,
        });
      } else if (slot === 1) {
        list.push({
          type: "world_harvest_deliver",
          prompt: "Antarkan 3 wortel untuk kelinci lapar!",
          voicePrompt: "Ayo ambil tiga wortel lalu berikan kepada kelinci!",
          helpText: "Ambil wortel lalu bawa ke gambar kelinci di kanan.",
          targetIcon: "🥕",
          targetCount: isTk ? 4 : 3,
          deliverZone: { icon: "🐰", label: "Kelinci" },
          bgTop: "#c8f7c5",
          bgBot: "#55efc4",
        });
      } else if (slot === 2) {
        list.push({
          type: "drag_match",
          prompt: "Cocokkan hewan dengan tempat tinggalnya!",
          voicePrompt: "Seret hewan ke habitat yang tepat!",
          helpText: "Ikan di air, singa di hutan.",
          pairs: [
            {
              id: "h1",
              item: "🐟",
              label: "Ikan",
              targetLabel: "🌊 Air Laut",
              color: "#d6eaf8",
            },
            {
              id: "h2",
              item: "🦁",
              label: "Singa",
              targetLabel: "🌳 Hutan",
              color: "#d4efdf",
            },
          ],
        });
      } else {
        list.push({
          type: "world_hide_seek",
          prompt: "Cari kucing yang bersembunyi di semak!",
          voicePrompt: "Ayo klik semak hijau untuk menemukan kucing!",
          helpText: "Buka semua semak satu per satu.",
          spots: [
            { id: "s1", cover: "🌿", hidden: "🐱", isTarget: true },
            { id: "s2", cover: "🌿", hidden: "🌸", isTarget: false },
            { id: "s3", cover: "🌿", hidden: "🐱", isTarget: true },
            { id: "s4", cover: "🌿", hidden: "🍄", isTarget: false },
            { id: "s5", cover: "🌿", hidden: "🐱", isTarget: true },
            { id: "s6", cover: "🌿", hidden: "🪨", isTarget: false },
          ],
        });
      }
    } else if (categoryId === "buah_sayur") {
      if (slot === 0) {
        list.push({
          type: "roleplay_mission",
          prompt: "Masukkan buah-buahan ke keranjang buah!",
          voicePrompt:
            "Ayo pilih buah-buahan yang segar lalu masukkan ke keranjang!",
          helpText: "Pilih apel, pisang, dan anggur saja.",
          stationIcon: "🧺",
          stationName: "Keranjang Buah",
          neededItems: [
            { id: "f1", icon: "🍎", name: "Apel" },
            { id: "f2", icon: "🍌", name: "Pisang" },
            { id: "f3", icon: "🍇", name: "Anggur" },
          ],
          wrongItems: [
            { id: "w1", icon: "🚗", name: "Mobil" },
            { id: "w2", icon: "👟", name: "Sepatu" },
          ],
        });
      } else if (slot === 1) {
        list.push({
          type: "drag_match",
          prompt: "Kelompokkan buah dan sayuran!",
          voicePrompt: "Seret gambar ke kotak buah atau kotak sayuran!",
          helpText: "Wortel adalah sayur, apel adalah buah.",
          pairs: [
            {
              id: "bs1",
              item: "🍓",
              label: "Stroberi",
              targetLabel: "🧺 Buah",
              color: "#fadbd8",
            },
            {
              id: "bs2",
              item: "🥦",
              label: "Brokoli",
              targetLabel: "🥗 Sayuran",
              color: "#d4efdf",
            },
          ],
        });
      } else if (slot === 2) {
        list.push({
          type: "world_harvest_deliver",
          prompt: "Petik 3 stroberi segar di kebun!",
          voicePrompt: "Ayo petik tiga stroberi segar di kebun!",
          helpText: "Gerakkan karakter menyentuh buah stroberi.",
          targetIcon: "🍓",
          targetCount: isTk ? 5 : 3,
          bgTop: "#ffeaa7",
          bgBot: "#a8e6cf",
        });
      } else {
        list.push({
          type: "memory_odd",
          submode: "memory",
          prompt: "Cocokkan pasangan gambar buah dan sayur!",
          voicePrompt: "Buka kartu dan cari gambar buah yang sama!",
          helpText: "Ingat posisi kartu yang sudah dibuka.",
          icons: isTk ? ["🍎", "🍌", "🥕", "🥦"] : ["🍎", "🥕"],
        });
      }
    } else if (categoryId === "kendaraan") {
      if (slot === 0) {
        const vehicles = [
          {
            id: "mobil",
            name: "Mobil",
            icon: "🚗",
            soundText: "Tin, tin! Brmmm! Kendaraan apakah aku?",
          },
          {
            id: "kereta",
            name: "Kereta Api",
            icon: "🚂",
            soundText: "Tut, tut, tut! Jes jes jes! Kendaraan apakah aku?",
          },
          {
            id: "pesawat",
            name: "Pesawat",
            icon: "✈️",
            soundText: "Wuuuush! Aku terbang tinggi di langit! Siapakah aku?",
          },
        ];
        list.push({
          type: "animal_sound_quiz",
          prompt: "Tebak kendaraan dari suaranya!",
          voicePrompt: "Dengarkan suara kendaraan lalu klik gambarnya!",
          helpText: "Klik tombol hijau untuk mendengar suara kendaraan.",
          target: vehicles[(lvl + i) % vehicles.length],
          options: vehicles,
        });
      } else if (slot === 1) {
        list.push({
          type: "drag_match",
          prompt: "Cocokkan kendaraan dengan jalannya!",
          voicePrompt: "Seret kendaraan ke tempat jalannya yang benar!",
          helpText: "Kapal di laut, pesawat di langit.",
          pairs: [
            {
              id: "k1",
              item: "🚢",
              label: "Kapal",
              targetLabel: "🌊 Laut",
              color: "#d6eaf8",
            },
            {
              id: "k2",
              item: "✈️",
              label: "Pesawat",
              targetLabel: "☁️ Langit",
              color: "#eef9ff",
            },
            ...(isTk
              ? [
                  {
                    id: "k3",
                    item: "🚌",
                    label: "Bus",
                    targetLabel: "🛣️ Jalan Raya",
                    color: "#fef9e7",
                  },
                ]
              : []),
          ],
        });
      } else if (slot === 2) {
        list.push({
          type: "world_catch",
          prompt: "Tangkap simbol Mobil 🚗 yang turun!",
          voicePrompt: "Geser karakter untuk menangkap gambar mobil!",
          helpText: "Tangkap hanya lingkaran bergambar mobil.",
          targetLabel: "🚗",
          targetCount: isTk ? 4 : 3,
          decoys: ["🚢", "✈️", "🚲"],
        });
      } else {
        list.push({
          type: "memory_odd",
          submode: "odd_one_out",
          prompt: "Cari kendaraan yang berbeda!",
          voicePrompt: "Klik satu kendaraan yang berbeda dari yang lain!",
          helpText: "Lihat mana yang bukan mobil.",
          items: ["🚗", "🚗", "✈️", "🚗"],
          oddIdx: 2,
        });
      }
    } else if (categoryId === "puzzle_logika") {
      if (slot === 0) {
        list.push({
          type: "memory_odd",
          submode: "memory",
          prompt: "Cocokkan semua pasangan kartu!",
          voicePrompt: "Buka dua kartu yang gambarnya sama!",
          helpText: "Ingat gambar di balik kartu biru.",
          icons: isTk ? ["⭐", "🌈", "🎈", "🎁"] : ["⭐", "🌈"],
        });
      } else if (slot === 1) {
        list.push({
          type: "memory_odd",
          submode: "odd_one_out",
          prompt: "Temukan 1 gambar yang berbeda!",
          voicePrompt: "Amati dengan teliti, klik satu gambar yang berbeda!",
          helpText: "Cari bentuk yang berbeda sendiri.",
          items: ["🧸", "🧸", "🤖", "🧸"],
          oddIdx: 2,
        });
      } else if (slot === 2) {
        list.push({
          type: "build_sequence",
          prompt: "Susun urutan pertumbuhan tanaman!",
          voicePrompt: "Susun dari tunas kecil sampai pohon berbuah!",
          helpText: "Mulai dari tunas paling kecil.",
          items: ["🌱", "🌿", "🌳", "🍎"],
        });
      } else {
        list.push({
          type: "world_maze",
          prompt: "Cari jalan keluar labirin menuju bintang!",
          voicePrompt: "Bantu karakter mencari jalan menuju bintang emas!",
          helpText: "Gunakan tombol panah mengikuti lorong terang.",
        });
      }
    } else if (categoryId === "kreativitas") {
      if (slot === 0) {
        list.push({
          type: "sticker_decorate",
          prompt: "Hias kue ulang tahun dengan 4 hiasan lucu!",
          voicePrompt: "Pilih hiasan lalu klik pada kue untuk menghiasnya!",
          helpText: "Klik stiker di kanan lalu klik di atas kue.",
          baseIcon: "🎂",
          baseName: "Kue Lucu",
          stickers: ["🍓", "⭐", "🌸", "🕯️"],
          neededCount: 4,
        });
      } else if (slot === 1) {
        list.push({
          type: "brush_paint",
          prompt: "Warnai kanvas lingkaran dengan warna Biru!",
          voicePrompt: "Pilih cat biru lalu usapkan kuas di dalam lingkaran!",
          helpText: "Klik warna Biru lalu gosokkan kuas di tengah.",
          targetColor: { id: "biru", name: "Biru", hex: "#74b9ff" },
        });
      } else if (slot === 2) {
        list.push({
          type: "sticker_decorate",
          prompt: "Hias taman rumah dengan bunga dan kupu-kupu!",
          voicePrompt: "Ayo hias rumah taman ini agar semakin indah!",
          helpText: "Tempelkan 4 hiasan pada gambar rumah.",
          baseIcon: "🏡",
          baseName: "Rumah Taman",
          stickers: ["🌻", "🦋", "🌈", "🌳"],
          neededCount: 4,
        });
      } else {
        list.push({
          type: "trace_path",
          prompt: 'Gambar bentuk lingkaran "O" dengan rapi!',
          voicePrompt: "Ayo ikuti titik kuning untuk menggambar lingkaran!",
          helpText: "Usap seluruh titik kuning.",
          symbol: "O",
        });
      }
    } else if (categoryId === "bermain_peran") {
      if (slot === 0) {
        list.push({
          type: "roleplay_mission",
          prompt: "Bermain Memasak! Masukkan bahan sup sayur ke panci!",
          voicePrompt:
            "Ayo jadi koki cilik! Masukkan wortel, brokoli, dan tomat ke panci!",
          helpText: "Klik sayuran yang bisa dimasak menjadi sup.",
          stationIcon: "🍲",
          stationName: "Panci Koki",
          neededItems: [
            { id: "m1", icon: "🥕", name: "Wortel" },
            { id: "m2", icon: "🥦", name: "Brokoli" },
            { id: "m3", icon: "🍅", name: "Tomat" },
          ],
          wrongItems: [
            { id: "w1", icon: "🧸", name: "Boneka" },
            { id: "w2", icon: "📚", name: "Buku" },
          ],
        });
      } else if (slot === 1) {
        list.push({
          type: "roleplay_mission",
          prompt: "Bermain Dokter! Siapkan alat dokter di tas kesehatan!",
          voicePrompt:
            "Ayo jadi dokter cilik! Pilih alat kesehatan untuk tas dokter!",
          helpText: "Pilih stetoskop, plester, dan termometer.",
          stationIcon: "🩺",
          stationName: "Tas Dokter",
          neededItems: [
            { id: "d1", icon: "🩹", name: "Plester" },
            { id: "d2", icon: "🌡️", name: "Termometer" },
            { id: "d3", icon: "💊", name: "Vitamin" },
          ],
          wrongItems: [
            { id: "w1", icon: "🎸", name: "Gitar" },
            { id: "w2", icon: "⚽", name: "Bola" },
          ],
        });
      } else if (slot === 2) {
        list.push({
          type: "roleplay_mission",
          prompt: "Bermain Belanja! Masukkan pesanan susu, roti, dan telur!",
          voicePrompt:
            "Ayo berbelanja! Masukkan susu, roti, dan telur ke troli!",
          helpText: "Pilih makanan dan minuman untuk belanja.",
          stationIcon: "🛒",
          stationName: "Troli Belanja",
          neededItems: [
            { id: "b1", icon: "🥛", name: "Susu" },
            { id: "b2", icon: "🍞", name: "Roti" },
            { id: "b3", icon: "🥚", name: "Telur" },
          ],
          wrongItems: [
            { id: "w1", icon: "🪨", name: "Batu" },
            { id: "w2", icon: "🪑", name: "Kursi" },
          ],
        });
      } else {
        list.push({
          type: "world_harvest_deliver",
          prompt: "Bermain Petani! Panen 3 jagung lalu bawa ke lumbung!",
          voicePrompt:
            "Ayo jadi petani rajin! Panen jagung lalu antarkan ke lumbung!",
          helpText: "Ambil jagung lalu bawa ke lumbung di kanan.",
          targetIcon: "🌽",
          targetCount: isTk ? 4 : 3,
          deliverZone: { icon: "🏚️", label: "Lumbung" },
          bgTop: "#ffeaa7",
          bgBot: "#55efc4",
        });
      }
    } else if (categoryId === "petualangan") {
      if (slot === 0) {
        list.push({
          type: "world_maze",
          prompt: "Jelajahi labirin hutan menuju bintang harta karun!",
          voicePrompt:
            "Ayo jelajahi hutan dan temukan jalan ke bintang harta karun!",
          helpText: "Ikuti lorong terang menuju bintang kuning.",
        });
      } else if (slot === 1) {
        list.push({
          type: "world_hide_seek",
          prompt: "Cari 3 peti harta karun yang tersembunyi di pantai!",
          voicePrompt:
            "Ayo buka pasir dan kerang pantai untuk menemukan harta karun!",
          helpText: "Klik kotak pasir untuk mencari peti harta karun.",
          spots: [
            { id: "p1", cover: "🏝️", hidden: "💎", isTarget: true },
            { id: "p2", cover: "🏝️", hidden: "🦀", isTarget: false },
            { id: "p3", cover: "🏝️", hidden: "💎", isTarget: true },
            { id: "p4", cover: "🏝️", hidden: "🐚", isTarget: false },
            { id: "p5", cover: "🏝️", hidden: "💎", isTarget: true },
            { id: "p6", cover: "🏝️", hidden: "⭐", isTarget: false },
          ],
        });
      } else if (slot === 2) {
        list.push({
          type: "world_harvest_deliver",
          prompt: "Kumpulkan 3 kunci emas untuk membuka peti kebun!",
          voicePrompt:
            "Ayo kumpulkan tiga kunci emas dan bawa ke peti harta karun!",
          helpText: "Ambil kunci emas lalu bawa ke peti di kanan.",
          targetIcon: "🔑",
          targetCount: isTk ? 4 : 3,
          deliverZone: { icon: "🎁", label: "Peti Harta" },
          bgTop: "#74b9ff",
          bgBot: "#ffeaa7",
        });
      } else {
        list.push({
          type: "world_catch",
          prompt: "Tangkap koin emas 🪙 yang jatuh dari langit!",
          voicePrompt: "Geser karakter untuk menangkap koin emas!",
          helpText: "Tangkap bola bergambar koin emas.",
          targetLabel: "🪙",
          targetCount: isTk ? 5 : 3,
          decoys: ["🪨", "🍂"],
        });
      }
    } else if (categoryId === "musik_suara") {
      if (slot === 0 || slot === 2) {
        const patterns = [
          [0, 1, 2],
          [0, 2, 1, 3],
          [1, 2, 3, 2],
        ];
        const pat = isTk ? patterns[(lvl + i) % patterns.length] : [0, 1, 2];
        list.push({
          type: "music_rhythm",
          prompt: "Dengarkan dan ikuti irama alat musik!",
          voicePrompt:
            "Perhatikan urutan alat musik yang menyala, lalu ikuti iramanya!",
          helpText: "Klik tombol Putar Contoh Irama jika ingin mengulang.",
          pattern: pat,
        });
      } else if (slot === 1) {
        const inst = [
          {
            id: "gendang",
            name: "Gendang",
            icon: "🥁",
            soundText: "Dung, dung, tak! Alat musik pukul apakah aku?",
          },
          {
            id: "gitar",
            name: "Gitar",
            icon: "🎸",
            soundText: "Jreng, jreng! Alat musik petik bersenar apakah aku?",
          },
          {
            id: "lonceng",
            name: "Lonceng",
            icon: "🔔",
            soundText: "Ting, ting, ting! Suara nyaring apakah aku?",
          },
        ];
        list.push({
          type: "animal_sound_quiz",
          prompt: "Tebak alat musik dari bunyinya!",
          voicePrompt: "Dengarkan bunyinya lalu pilih alat musik yang tepat!",
          helpText: "Klik tombol hijau untuk mendengar ulang.",
          target: inst[(lvl + i) % inst.length],
          options: inst,
        });
      } else {
        list.push({
          type: "drag_match",
          prompt: "Pasangkan alat musik dengan cara memainkannya!",
          voicePrompt: "Seret alat musik ke cara memainkannya yang benar!",
          helpText: "Gendang dipukul, gitar dipetik.",
          pairs: [
            {
              id: "ms1",
              item: "🥁",
              label: "Gendang",
              targetLabel: "✋ Dipukul",
              color: "#fadbd8",
            },
            {
              id: "ms2",
              item: "🎸",
              label: "Gitar",
              targetLabel: "🎶 Dipetik",
              color: "#d6eaf8",
            },
          ],
        });
      }
    } else {
      if (slot === 0) {
        list.push({
          type: "roleplay_mission",
          prompt: "Waktunya Mandi & Sikat Gigi! Pilih perlengkapan mandi!",
          voicePrompt:
            "Ayo pilih sabun, sikat gigi, dan handuk untuk mandi bersih!",
          helpText: "Pilih perlengkapan yang dipakai saat mandi.",
          stationIcon: "🛁",
          stationName: "Bak Mandi Bersih",
          neededItems: [
            { id: "k1", icon: "🧼", name: "Sabun" },
            { id: "k2", icon: "🪥", name: "Sikat Gigi" },
            { id: "k3", icon: "🧴", name: "Sampo" },
          ],
          wrongItems: [
            { id: "w1", icon: "🚲", name: "Sepeda" },
            { id: "w2", icon: "✏️", name: "Pensil" },
          ],
        });
      } else if (slot === 1) {
        list.push({
          type: "world_harvest_deliver",
          prompt: "Ayo rapikan mainan! Masukkan 3 mainan ke kotak mainan!",
          voicePrompt:
            "Setelah bermain, ayo rapikan mainan ke dalam kotak mainan!",
          helpText: "Ambil mainan lalu bawa ke kotak di kanan.",
          targetIcon: "🧸",
          targetCount: isTk ? 4 : 3,
          deliverZone: { icon: "📦", label: "Kotak Mainan" },
          distractors: ["👟", "🍌"],
          bgTop: "#81ecec",
          bgBot: "#ffeaa7",
        });
      } else if (slot === 2) {
        list.push({
          type: "build_sequence",
          prompt: "Susun urutan kegiatan pagi yang sehat!",
          voicePrompt:
            "Susun urutan kegiatan pagi: bangun tidur, sikat gigi, sarapan, lalu berpakaian rapi!",
          helpText: "Mulai dari bangun tidur (kasur).",
          items: ["🛏️", "🪥", "🍳", "👕"],
        });
      } else {
        list.push({
          type: "drag_match",
          prompt: "Pasangkan pakaian dengan bagian tubuhnya!",
          voicePrompt: "Seret topi dan sepatu ke tempat pemakaiannya!",
          helpText: "Topi di kepala, sepatu di kaki.",
          pairs: [
            {
              id: "pk1",
              item: "🧢",
              label: "Topi",
              targetLabel: "😊 Kepala",
              color: "#fef9e7",
            },
            {
              id: "pk2",
              item: "👟",
              label: "Sepatu",
              targetLabel: "🦶 Kaki",
              color: "#d6eaf8",
            },
          ],
        });
      }
    }
  }

  return list;
}
