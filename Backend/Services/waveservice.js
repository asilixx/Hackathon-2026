import config from "../wave/config.js";

const WaveService = {
  generateWave(waveNumber) {
    const totalEnemies = Math.min(
      Math.floor(
        config.wave.baseCount *
          Math.pow(config.wave.growthMultiplier, waveNumber - 1),
      ),
      config.wave.maxCount,
    );

    const availableTypes = [];
    for (const name in config.enemyTypes) {
      const type = config.enemyTypes[name];
      if (type.unlockLevel <= waveNumber) {
        availableTypes.push([name, type]);
      }
      
    }
    
    const enemies = [];

    for (const [name, type] of availableTypes) {
      const count = Math.floor(totalEnemies * type.spawnChance);
      const hp =
        config.enemy.baseHp * type.hpRatio +
        config.enemy.hpMultiplier * (waveNumber - 1);
      const speed =
        config.enemy.baseSpeed * type.speedRatio +
        config.enemy.speedMultiplier * (waveNumber - 1);

      enemies.push({ name, count, hp, speed });
    }

    return enemies;
  },
};

export default WaveService;
