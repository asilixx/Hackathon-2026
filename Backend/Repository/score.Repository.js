import db from "../db.js";
import Score from "../Models/score.model.js";

const ScoreRepository = {
  insert(pseudo, score, wave, zombiesKilled) {
    const stmt = db.prepare(
      `INSERT INTO scores (pseudo, score, wave, zombies_killed)
       VALUES (@pseudo, @score, @wave, @zombiesKilled)`,
    );
    return stmt.run({ pseudo, score, wave, zombiesKilled });
  },

  getAll() {
    const stmt = db.prepare(
      "SELECT * FROM scores ORDER BY wave DESC, zombies_killed DESC, id DESC",
    );
    return stmt.all().map(Score);
  },

  getTop(limit) {
    const stmt = db.prepare(
      `SELECT * FROM scores
       ORDER BY wave DESC, zombies_killed DESC, id DESC
       LIMIT @limit`,
    );
    return stmt.all({ limit }).map(Score);
  },
};

export default ScoreRepository;
