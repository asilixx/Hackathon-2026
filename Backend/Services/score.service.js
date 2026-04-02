import ScoreRepository from "../Repository/score.Repository.js";

const scoreService = {
  createScore({ pseudo, score, wave, zombiesKilled }) {
    if (!pseudo || typeof pseudo !== "string") {
      throw new Error("Le pseudo est obligatoire.");
    }

    const numericScore = Number(score);
    const numericWave = Number(wave ?? score);
    const numericZombiesKilled = Number(zombiesKilled ?? 0);

    if (Number.isNaN(numericScore)) {
      throw new Error("Le score doit etre un nombre.");
    }

    if (Number.isNaN(numericWave)) {
      throw new Error("La vague doit etre un nombre.");
    }

    if (Number.isNaN(numericZombiesKilled)) {
      throw new Error("Le nombre de zombies tues doit etre un nombre.");
    }

    const result = ScoreRepository.insert(
      pseudo.trim(),
      numericScore,
      numericWave,
      numericZombiesKilled,
    );

    return {
      id: result.lastInsertRowid,
      pseudo: pseudo.trim(),
      score: numericScore,
      wave: numericWave,
      zombiesKilled: numericZombiesKilled,
    };
  },

  getAllScores() {
    return ScoreRepository.getAll();
  },

  getTopScores(limit = 5) {
    return ScoreRepository.getTop(limit);
  },
};

export default scoreService;
