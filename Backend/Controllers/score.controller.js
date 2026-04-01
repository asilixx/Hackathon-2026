// controllers/ScoreController.js

import ScoreService from "../Services/score.service.js";

const ScoreController = {
  create(req, res) {
    try {
      const result = ScoreService.createScore(req.body);
      res.status(201).json(result);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  getAll(req, res) {
    try {
      const scores = ScoreService.getAllScores();
      res.json(scores);
    } catch (error) {
      res.status(500).json({ error: "Erreur serveur" });
    }
  },

  getTop(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 5;
      const scores = ScoreService.getTopScores(limit);
      res.json(scores);
    } catch (error) {
      res.status(500).json({ error: "Erreur serveur" });
    }
  },
};

export default ScoreController;
