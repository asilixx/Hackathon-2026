const config = {
  wave: {
    baseCount: 5,
    growthMultiplier: 1.8,
    maxCount: 40,
  },
  enemy: {
    baseSpeed: 1.5,
    speedMultiplier: 0.3,
    baseHp: 1,
    hpMultiplier: 0.8,
  },
  enemyTypes: {
    normal: {
      speedRatio: 1,
      hpRatio: 1,
      unlockLevel: 1,
      spawnChance: 0.5,
    },
    fast: {
      speedRatio: 1.6,
      hpRatio: 0.3,
      unlockLevel: 3,
      spawnChance: 0.3,
    },
    tank: {
      speedRatio: 0.5,
      hpRatio: 3,
      unlockLevel: 6,
      spawnChance: 0.2,
    },
  },
};

export default config;