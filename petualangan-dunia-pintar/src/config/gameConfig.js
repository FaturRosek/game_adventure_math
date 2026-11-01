export const GAME_CONFIG = {
  title: "Petualangan Dunia Pintar",
  version: "1.0.0",
  width: 1280,
  height: 720,
  worldWidth: 3800,
  worldHeight: 720,
  gravityY: 1050,
  playerSpeed: 290,
  playerJumpVelocity: -560,

  characters: [
    {
      id: "kiko",
      name: "Kiko si Kancil",
      emoji: "🦌",
      color: 0xe67e22,
      desc: "Lincah dan suka berhitung",
    },
    {
      id: "bobi",
      name: "Bobi si Beruang",
      emoji: "🐻",
      color: 0x3498db,
      desc: "Kuat dan pantang menyerah",
    },
    {
      id: "cici",
      name: "Cici si Kelinci",
      emoji: "🐰",
      color: 0x9b59b6,
      desc: "Cepat dan sangat teliti",
    },
    {
      id: "prof_panda",
      name: "Tutor Panda Pintar",
      emoji: "🐼",
      color: 0x2ecc71,
      desc: "Pendamping belajar yang bijaksana",
    },
  ],

  classes: [
    { grade: 1, name: "Kelas 1 SD", active: false, statusText: "Coming Soon" },
    { grade: 2, name: "Kelas 2 SD", active: false, statusText: "Coming Soon" },
    { grade: 3, name: "Kelas 3 SD", active: true, statusText: "Aktif" },
    { grade: 4, name: "Kelas 4 SD", active: false, statusText: "Coming Soon" },
    { grade: 5, name: "Kelas 5 SD", active: false, statusText: "Coming Soon" },
    { grade: 6, name: "Kelas 6 SD", active: false, statusText: "Coming Soon" },
  ],

  subjects: [
    {
      id: "matematika",
      name: "Matematika",
      icon: "📐",
      active: true,
      statusText: "Aktif",
      desc: "Bilangan, Operasi Hitung, Pecahan, Pengukuran & Bangun Datar",
    },
    {
      id: "ipas",
      name: "IPAS",
      icon: "🌿",
      active: true,
      statusText: "Aktif",
      desc: "Makhluk Hidup, Lingkungan, Wujud Benda, Energi & Sosial",
    },
  ],

  modes: [
    {
      id: "adventure",
      name: "Adventure Mode",
      icon: "🗺️",
      active: true,
      statusText: "Aktif",
      desc: "Jelajahi dunia pulau pintar, kumpulkan koin, dan pecahkan teka-teki!",
    },
    {
      id: "duel",
      name: "Duel Mode (Tutor vs Murid)",
      icon: "⚔️",
      active: true,
      statusText: "Aktif",
      desc: "Balapan seru 1 lawan 1 bersama Tutor di satu layar (Hot Seat)!",
    },
  ],
};
