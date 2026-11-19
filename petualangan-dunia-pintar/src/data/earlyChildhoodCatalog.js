export const EARLY_CHILDHOOD_CATEGORIES = [
  { id: 'angka', name: 'Mengenal Angka & Berhitung', icon: '🔢', color: '#ff9f43' },
  { id: 'huruf', name: 'Mengenal Huruf & Bahasa', icon: '🔤', color: '#54a0ff' },
  { id: 'warna_bentuk', name: 'Warna & Bentuk', icon: '🎨', color: '#ff9ff3' },
  { id: 'hewan_alam', name: 'Hewan & Alam', icon: '🦁', color: '#1dd1a1' },
  { id: 'tubuh_harian', name: 'Tubuh & Kegiatan Harian', icon: '🖐️', color: '#feca57' },
  { id: 'logika_kreasi', name: 'Logika, Pola & Kreativitas', icon: '🧩', color: '#a29bfe' }
];

export function getEarlyChildhoodLevelActivities(gradeKey, categoryId, levelNum) {
  const isTk = gradeKey === 'tk';
  const lvl = Math.max(1, Math.min(6, Number(levelNum) || 1));
  const list = [];

  for (let i = 0; i < 10; i++) {
    const step = (i + lvl) % 3;

    if (categoryId === 'angka') {
      if (step === 0) {
        const count = isTk ? Math.min(9, 4 + lvl) : Math.min(5, 2 + (lvl % 4));
        list.push({
          type: 'explore_hunt',
          prompt: `Ayo ambil ${count} buah apel!`,
          voicePrompt: `Ayo gerakkan karakter dan ambil ${count} buah apel!`,
          targetIcon: '🍎',
          targetCount: count,
          distractors: ['🪨', '🍂']
        });
      } else if (step === 1) {
        const seq = isTk ? ['6', '7', '8', '9'] : ['1', '2', '3'];
        list.push({
          type: 'sequence_order',
          prompt: 'Susun angka dari yang terkecil!',
          voicePrompt: 'Ayo susun angka berikut dari yang paling kecil!',
          items: seq
        });
      } else {
        list.push({
          type: 'drag_drop',
          prompt: isTk ? 'Pasangkan hasil penjumlahan!' : 'Pasangkan angka dengan jumlah buah!',
          voicePrompt: isTk ? 'Pasangkan penjumlahan dengan angka yang benar!' : 'Seret buah ke angka yang sesuai jumlahnya!',
          pairs: isTk
            ? [
                { id: 'n1', item: '🍎🍎 + 🍎', label: '2 + 1', targetLabel: 'Angka 3', color: '#fadbd8' },
                { id: 'n2', item: '🍌🍌 + 🍌🍌', label: '2 + 2', targetLabel: 'Angka 4', color: '#fef9e7' }
              ]
            : [
                { id: 'n1', item: '🍎', label: 'Satu', targetLabel: 'Angka 1', color: '#fadbd8' },
                { id: 'n2', item: '🍎🍎', label: 'Dua', targetLabel: 'Angka 2', color: '#d6eaf8' }
              ]
        });
      }
    } else if (categoryId === 'huruf') {
      if (step === 0) {
        const letters = ['A', 'B', 'C', 'M', 'S', 'L'];
        const target = letters[(lvl + i) % letters.length];
        list.push({
          type: 'letter_hunt',
          prompt: `Cari semua huruf ${target}!`,
          voicePrompt: `Ayo cari dan klik semua gelembung huruf ${target}!`,
          targetLetter: target,
          targetCount: isTk ? 4 : 3
        });
      } else if (step === 1) {
        if (isTk) {
          list.push({
            type: 'sequence_order',
            prompt: 'Susun huruf menjadi kata "BUKU"!',
            voicePrompt: 'Ayo susun huruf berikut menjadi kata buku!',
            items: ['B', 'U', 'K', 'U']
          });
        } else {
          list.push({
            type: 'drag_drop',
            prompt: 'Pasangkan huruf awal gambar!',
            voicePrompt: 'Seret gambar ke huruf awalnya yang tepat!',
            pairs: [
              { id: 'a', item: '🍎', label: 'Apel', targetLabel: 'Huruf A', color: '#fadbd8' },
              { id: 'b', item: '⚽', label: 'Bola', targetLabel: 'Huruf B', color: '#d6eaf8' }
            ]
          });
        }
      } else {
        const sym = ['A', 'B', 'C', 'O', 'L', 'I'][(lvl + i) % 6];
        list.push({
          type: 'trace_draw',
          prompt: `Tebalkan huruf "${sym}"!`,
          voicePrompt: `Ayo tebalkan semua titik kuning mengikuti huruf ${sym}!`,
          symbol: sym,
          points: [{ x: 270, y: 80 }, { x: 220, y: 175 }, { x: 320, y: 175 }, { x: 270, y: 255 }]
        });
      }
    } else if (categoryId === 'warna_bentuk') {
      if (step === 0) {
        const colors = [
          { id: 'merah', name: 'Merah', hex: '#e74c3c' },
          { id: 'kuning', name: 'Kuning', hex: '#f1c40f' },
          { id: 'biru', name: 'Biru', hex: '#3498db' },
          { id: 'hijau', name: 'Hijau', hex: '#2ecc71' }
        ];
        const target = colors[(lvl + i) % colors.length];
        const shapes = ['circle', 'square', 'triangle', 'star'];
        list.push({
          type: 'color_paint',
          prompt: `Warnai bentuk ini dengan warna ${target.name}!`,
          voicePrompt: `Pilih cat warna ${target.name}, lalu klik gambar untuk mewarnainya!`,
          targetColor: target,
          shapeType: shapes[(lvl + i) % shapes.length],
          palette: colors
        });
      } else if (step === 1) {
        list.push({
          type: 'drag_drop',
          prompt: 'Masukkan bentuk ke lubang yang cocok!',
          voicePrompt: 'Seret bentuk ke tempat yang sesuai!',
          pairs: [
            { id: 's1', item: '🔴', label: 'Lingkaran', targetLabel: 'Lubang Lingkaran', color: '#fadbd8' },
            { id: 's2', item: '🟦', label: 'Persegi', targetLabel: 'Lubang Persegi', color: '#d6eaf8' },
            ...(isTk ? [{ id: 's3', item: '🔺', label: 'Segitiga', targetLabel: 'Lubang Segitiga', color: '#fef9e7' }] : [])
          ]
        });
      } else {
        list.push({
          type: 'puzzle',
          prompt: 'Lengkapi pola bentuk berikut!',
          voicePrompt: 'Ayo lengkapi pola bentuk yang hilang!',
          sequence: isTk ? ['🔺', '🔵', '🔺', '🔵'] : ['🔴', '🟡', '🔴', '🟡'],
          missingIdx: 3,
          choices: isTk ? ['🔵', '🔺', '🟩'] : ['🟡', '🔴', '🔵']
        });
      }
    } else if (categoryId === 'hewan_alam') {
      if (step === 0) {
        const animals = [
          { id: 'kucing', name: 'Kucing', icon: '🐱', soundText: 'Meong, meong! Hewan apakah aku?' },
          { id: 'sapi', name: 'Sapi', icon: '🐄', soundText: 'Mooo, mooo! Hewan apakah aku?' },
          { id: 'ayam', name: 'Ayam', icon: '🐔', soundText: 'Kukuruyuk! Hewan apakah aku?' }
        ];
        const target = animals[(lvl + i) % animals.length];
        list.push({
          type: 'animal_sound',
          prompt: 'Tebak hewan dari suaranya!',
          voicePrompt: 'Dengarkan suara hewan, lalu pilih gambar hewan yang benar!',
          target,
          options: animals
        });
      } else if (step === 1) {
        list.push({
          type: 'drag_drop',
          prompt: 'Pasangkan hewan dengan makanannya!',
          voicePrompt: 'Seret hewan ke makanan kesukaannya!',
          pairs: [
            { id: 'h1', item: '🐰', label: 'Kelinci', targetLabel: '🥕 Wortel', color: '#fdebd0' },
            { id: 'h2', item: '🐒', label: 'Monyet', targetLabel: '🍌 Pisang', color: '#fef9e7' }
          ]
        });
      } else {
        list.push({
          type: 'sort_group',
          prompt: 'Kelompokkan hewan darat dan hewan air!',
          voicePrompt: 'Masukkan hewan ke keranjang tempat tinggalnya!',
          groups: [
            { id: 'darat', name: 'Hewan Darat 🌳', color: '#d4efdf' },
            { id: 'air', name: 'Hewan Air 🌊', color: '#d6eaf8' }
          ],
          items: [
            { icon: '🦁', group: 'darat' },
            { icon: '🐘', group: 'darat' },
            { icon: '🐟', group: 'air' },
            { icon: '🐙', group: 'air' }
          ]
        });
      }
    } else if (categoryId === 'tubuh_harian') {
      if (step === 0) {
        list.push({
          type: 'drag_drop',
          prompt: 'Pasangkan anggota tubuh dengan fungsinya!',
          voicePrompt: 'Seret anggota tubuh ke kegunaannya yang tepat!',
          pairs: [
            { id: 't1', item: '👀', label: 'Mata', targetLabel: 'Untuk Melihat', color: '#d6eaf8' },
            { id: 't2', item: '👂', label: 'Telinga', targetLabel: 'Untuk Mendengar', color: '#d4efdf' }
          ]
        });
      } else if (step === 1) {
        list.push({
          type: 'sequence_order',
          prompt: 'Susun urutan kegiatan pagi hari!',
          voicePrompt: 'Ayo susun urutan kegiatan pagi dari bangun tidur sampai berangkat sekolah!',
          items: ['🛏️', '🪥', '🍳', '🎒']
        });
      } else {
        list.push({
          type: 'sort_group',
          prompt: 'Pilih kebiasaan hidup bersih dan sehat!',
          voicePrompt: 'Kelompokkan benda untuk mandi dan benda untuk belajar!',
          groups: [
            { id: 'mandi', name: 'Alat Mandi 🛁', color: '#d6eaf8' },
            { id: 'belajar', name: 'Alat Belajar 📚', color: '#fef9e7' }
          ],
          items: [
            { icon: '🧼', group: 'mandi' },
            { icon: '🪥', group: 'mandi' },
            { icon: '✏️', group: 'belajar' },
            { icon: '📖', group: 'belajar' }
          ]
        });
      }
    } else {
      if (step === 0) {
        list.push({
          type: 'simple_maze',
          prompt: 'Bantu kelinci mencari jalan ke bendera finis!',
          voicePrompt: 'Gunakan tombol panah untuk membantu kelinci keluar dari labirin!'
        });
      } else if (step === 1) {
        list.push({
          type: 'memory_guess',
          submode: i % 2 === 0 ? 'odd_one_out' : 'memory',
          prompt: i % 2 === 0 ? 'Temukan 1 gambar yang berbeda!' : 'Buka kartu dan cari gambar yang sama!',
          voicePrompt: i % 2 === 0 ? 'Coba temukan satu gambar yang berbeda dari teman-temannya!' : 'Ayo buka kartu dan temukan dua gambar yang sama!',
          items: ['🍎', '🍎', '🍌', '🍎'],
          oddIdx: 2,
          icons: isTk ? ['🦁', '🐘', '🐼', '🐸'] : ['🐶', '🐱']
        });
      } else {
        list.push({
          type: 'puzzle',
          prompt: 'Lengkapi urutan pertumbuhan tanaman!',
          voicePrompt: 'Pilih gambar yang tepat untuk melengkapi urutan ini!',
          sequence: ['🌱', '🌿', '🌳', '🍎'],
          missingIdx: 3,
          choices: ['🍎', '🪨', '🎈']
        });
      }
    }
  }

  return list;
}
