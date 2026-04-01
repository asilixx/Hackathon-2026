import ScoreRepository from "../Repository/score.Repository.js";

const scoreService = {
  createScore({ pseudo, score }) {
    if (!pseudo || typeof pseudo !== "string") {
      throw new Error("Le pseudo est obligatoire.");
    }

    const numericScore = Number(score);

    if (Number.isNaN(numericScore)) {
      throw new Error("Le score doit etre un nombre.");
    }

    const result = ScoreRepository.insert(pseudo.trim(), numericScore);

    return {
      id: result.lastInsertRowid,
      pseudo: pseudo.trim(),
      score: numericScore,
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
