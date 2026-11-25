export const BATTLE_CHARACTERS = [
  { id: 'kiko', name: 'Kiko', roleTag: 'Petualang Pemberani', price: 0, free: true },
  { id: 'cici', name: 'Cici', roleTag: 'Penjelajah Ceria', price: 0, free: true },
  { id: 'bobi', name: 'Bobi', roleTag: 'Ahli Strategi', price: 0, free: true },
  { id: 'prof_panda', name: 'Prof. Panda', roleTag: 'Mentor Bijaksana', price: 0, free: true },
  { id: 'kancil_kiko', name: 'Kiko si Kancil', roleTag: 'Kancil Cerdik', price: 100, free: false },
  { id: 'kelinci_cici', name: 'Cici si Kelinci', roleTag: 'Kelinci Gesit', price: 120, free: false },
  { id: 'beruang_bobi', name: 'Bobi si Beruang', roleTag: 'Beruang Tangguh', price: 150, free: false },
  { id: 'panda_tutor', name: 'Tutor Panda', roleTag: 'Panda Klasik Bijak', price: 180, free: false }
];

export const BATTLE_COSTUMES = [
  {
    id: "default",
    name: "Kostum Standar",
    price: 0,
    free: true,
    armorTop: null,
    armorBot: null,
    trim: null,
  },
  {
    id: "royal_gold",
    name: "Zirah Emas Raja",
    price: 100,
    free: false,
    armorTop: "#f39c12",
    armorBot: "#b76e14",
    trim: "#fff200",
  },
  {
    id: "cyber_neon",
    name: "Kostum Neon Siber",
    price: 140,
    free: false,
    armorTop: "#00d2d3",
    armorBot: "#01a3a4",
    trim: "#ff9ff3",
  },
  {
    id: "forest_knight",
    name: "Ksatria Hutan",
    price: 120,
    free: false,
    armorTop: "#2ecc71",
    armorBot: "#1e8449",
    trim: "#f1c40f",
  },
];

export const BATTLE_ACCESSORIES = [
  { id: "none", name: "Tanpa Aksesori", price: 0, free: true },
  { id: "crown", name: "Mahkota Juara", price: 90, free: false },
  { id: "visor", name: "Kacamata Visor", price: 110, free: false },
  { id: "wizard_hat", name: "Topi Penyihir", price: 130, free: false },
];

export const BATTLE_ATTACK_EFFECTS = [
  {
    id: "default",
    name: "Bola Energi Biru",
    price: 0,
    free: true,
    color: 0x00d2d3,
  },
  {
    id: "fire_burst",
    name: "Semburan Api",
    price: 120,
    free: false,
    color: 0xff4757,
  },
  {
    id: "star_wave",
    name: "Gelombang Bintang",
    price: 150,
    free: false,
    color: 0xf1c40f,
  },
  {
    id: "lightning_bolt",
    name: "Petir Ungu",
    price: 180,
    free: false,
    color: 0x9b59b6,
  },
];

export const BATTLE_VICTORY_EFFECTS = [
  { id: "confetti", name: "Hujan Konfeti", price: 0, free: true },
  { id: "fireworks", name: "Kembang Api Arena", price: 140, free: false },
  { id: "golden_rain", name: "Hujan Bintang Emas", price: 170, free: false },
];

export const BATTLE_ACHIEVEMENTS = [
  {
    id: "first_victory",
    name: "First Victory",
    icon: "🏆",
    desc: "Raih kemenangan pertamamu di Quiz Battle Arena.",
  },
  {
    id: "perfect_fighter",
    name: "Perfect Fighter",
    icon: "💎",
    desc: "Selesaikan pertandingan tanpa satu pun jawaban salah.",
  },
  {
    id: "combo_master",
    name: "Combo Master",
    icon: "🔥",
    desc: "Capai Combo 3x atau lebih dalam satu pertandingan.",
  },
  {
    id: "comeback_hero",
    name: "Comeback Hero",
    icon: "⚡",
    desc: "Menangkan pertandingan saat sisa HP 25 atau kurang.",
  },
  {
    id: "knowledge_champion",
    name: "Knowledge Champion",
    icon: "🧠",
    desc: "Capai akurasi jawaban minimal 90% dalam satu pertandingan.",
  },
  {
    id: "battle_veteran",
    name: "Battle Veteran",
    icon: "🛡️",
    desc: "Selesaikan minimal 5 pertandingan di Quiz Battle Arena.",
  },
];

export function calculateBattleLevel(totalXp = 0) {
  const xp = Math.max(0, Number(totalXp) || 0);
  let level = 1;
  let required = 100;
  let remaining = xp;

  while (remaining >= required) {
    remaining -= required;
    level += 1;
    required = Math.round(required * 1.35);
  }

  return {
    level,
    currentLevelXp: remaining,
    nextLevelXp: required,
    progressPct: Math.min(100, Math.round((remaining / required) * 100)),
  };
}
