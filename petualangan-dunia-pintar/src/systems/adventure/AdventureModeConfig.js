export const ADVENTURE_MODE_CONFIGS = {
  easy: {
    key: "easy",
    sceneKey: "TreasureExplorerScene",
    hudGenre: "topdown",
    modeType: "exploration",
    modeLabel: "Treasure Explorer",
    biome: "fantasy_island_topdown",
    maxHearts: 0,
    totalChallenges: 5,
    boxDistribution: [1, 1, 1, 2],
    controlHint: "WASD / Panah 8 Arah · Shift Lari · E / Space Interaksi",
    timer: {
      enabled: false,
      durationSec: 0,
      onExpire: "none",
    },
    energy: {
      enabled: false,
      max: 100,
      initial: 0,
      regenPerSec: 0,
      gainOnHit: 0,
      gainOnCorrectAnswer: 0,
      specialCost: 50,
    },
    combat: {
      enableCombo: false,
      enableJumpAttack: false,
      enableSpecialSkill: false,
    },
    mission: {
      sequential: false,
      requireAllObjectivesForFinish: false,
      objectives: [
        {
          id: "quiz_clear",
          label: "Pecahkan Puzzle & Petunjuk Pulau",
          type: "quiz",
          target: 5,
          required: true,
        },
        {
          id: "collect_artifacts",
          label: "Temukan Artefak Pulau",
          type: "collectible",
          target: 2,
          required: false,
        },
      ],
    },
  },

  medium: {
    key: "medium",
    sceneKey: "AdventureScene",
    hudGenre: "platformer",
    modeType: "combat",
    modeLabel: "Battle Adventure",
    biome: "mystery_temple",
    maxHearts: 4,
    totalChallenges: 7,
    boxDistribution: [2, 1, 2, 2],
    controlHint: "A/D Gerak · Space Lompat · Shift Dash · J Combo · Q Skill",
    timer: {
      enabled: true,
      durationSec: 240,
      onExpire: "respawn_penalty",
    },
    energy: {
      enabled: true,
      max: 100,
      initial: 40,
      regenPerSec: 4,
      gainOnHit: 18,
      gainOnCorrectAnswer: 35,
      specialCost: 50,
    },
    combat: {
      enableCombo: true,
      enableJumpAttack: true,
      enableSpecialSkill: true,
    },
    mission: {
      sequential: false,
      requireAllObjectivesForFinish: false,
      objectives: [
        {
          id: "quiz_clear",
          label: "Buka Kelemahan & Segel Kuil",
          type: "quiz",
          target: 7,
          required: true,
        },
        {
          id: "combat_clear",
          label: "Kalahkan Penjaga Kuil",
          type: "combat",
          target: 3,
          required: false,
        },
      ],
    },
  },

  hard: {
    key: "hard",
    sceneKey: "SurvivalArenaScene",
    hudGenre: "survival",
    modeType: "survival",
    modeLabel: "Survival Arena",
    biome: "sky_fortress",
    maxHearts: 3,
    totalChallenges: 10,
    boxDistribution: [2, 2, 3, 3],
    controlHint: "A/D Gerak · Space Lompat · Shift Dash · J Serang · Q Perisai",
    timer: {
      enabled: true,
      durationSec: 300,
      onExpire: "respawn_penalty",
    },
    energy: {
      enabled: true,
      max: 100,
      initial: 30,
      regenPerSec: 3,
      gainOnHit: 15,
      gainOnCorrectAnswer: 40,
      specialCost: 45,
    },
    combat: {
      enableCombo: true,
      enableJumpAttack: true,
      enableSpecialSkill: true,
    },
    mission: {
      sequential: true,
      requireAllObjectivesForFinish: false,
      objectives: [
        {
          id: "quiz_clear",
          label: "Pecahkan Segel Survival",
          type: "quiz",
          target: 10,
          required: true,
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
    boxDistribution: [...base.boxDistribution],
    timer: { ...base.timer },
    energy: { ...base.energy },
    combat: { ...base.combat },
    mission: {
      ...base.mission,
      objectives: base.mission.objectives.map((o) => ({ ...o })),
    },
  };
}
