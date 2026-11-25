export const ADVENTURE_MODE_CONFIGS = {
  easy: {
    key: "easy",
    sceneKey: "ForestClimbScene",
    hudGenre: "climb",
    modeType: "climb",
    modeLabel: "Forest Climb Adventure",
    biome: "forest_vertical",
    maxHearts: 0,
    oxygenEnabled: false,
    totalChallenges: 5,
    controlHint: "Kiri/Kanan Gerak · Atas/Bawah Panjat Rambat · Spasi Lompat",
    timer: { enabled: false, durationSec: 0 },
    mission: {
      sequential: false,
      objectives: [
        {
          id: "quiz_clear",
          label: "Buka Kotak Pengetahuan Hutan",
          type: "quiz",
          target: 5,
          required: true,
        },
        {
          id: "collect_stars",
          label: "Kumpulkan Bintang Hutan",
          type: "collectible",
          target: 3,
          required: false,
        },
      ],
    },
  },

  medium: {
    key: "medium",
    sceneKey: "OceanExplorerScene",
    hudGenre: "ocean",
    modeType: "ocean",
    modeLabel: "Ocean Explorer",
    biome: "ocean_islands",
    maxHearts: 0,
    oxygenEnabled: true,
    totalChallenges: 7,
    controlHint:
      "Di Air: WASD/Panah Berenang · Di Pulau: Gerak & Spasi Lompat · Jaga Napas!",
    timer: { enabled: false, durationSec: 0 },
    mission: {
      sequential: false,
      objectives: [
        {
          id: "quiz_clear",
          label: "Temukan Kotak Pengetahuan Laut",
          type: "quiz",
          target: 7,
          required: true,
        },
        {
          id: "collect_pearls",
          label: "Kumpulkan Mutiara Laut",
          type: "collectible",
          target: 3,
          required: false,
        },
      ],
    },
  },

  hard: {
    key: "hard",
    sceneKey: "LavaAdventureScene",
    hudGenre: "lava",
    modeType: "lava",
    modeLabel: "Lava Adventure",
    biome: "lava_fortress",
    maxHearts: 5,
    oxygenEnabled: false,
    totalChallenges: 10,
    controlHint:
      "Kiri/Kanan (A/D) Gerak · Spasi/Atas Lompat · Gunakan Checkpoint Aman",
    timer: { enabled: false, durationSec: 0 },
    mission: {
      sequential: false,
      objectives: [
        {
          id: "quiz_clear",
          label: "Buka Kotak Pengetahuan Benteng",
          type: "quiz",
          target: 10,
          required: true,
        },
        {
          id: "collect_gems",
          label: "Temukan Kristal Lava",
          type: "collectible",
          target: 3,
          required: false,
        },
      ],
    },
  },
};

export function getAdventureModeConfig(levelKey = "easy") {
  const key = String(levelKey || "easy").toLowerCase();
  const base = ADVENTURE_MODE_CONFIGS[key] || ADVENTURE_MODE_CONFIGS.easy;
  return {
    ...base,
    timer: { ...base.timer },
    mission: {
      ...base.mission,
      objectives: base.mission.objectives.map((o) => ({ ...o })),
    },
  };
}
