import db from "../db.js";
import Score from "../Models/score.model.js";

const ScoreRepository = {
  insert(pseudo, score) {
    const stmt = db.prepare(
      "INSERT INTO scores (pseudo, score) VALUES (@pseudo, @score)",
    );
    return stmt.run({ pseudo, score });
  },

  getAll() {
    const stmt = db.prepare("SELECT * FROM scores ORDER BY score DESC, id DESC");
    return stmt.all().map(Score);
  },

  getTop(limit) {
    const stmt = db.prepare(
      "SELECT * FROM scores ORDER BY score DESC, id DESC LIMIT @limit",
    );
    return stmt.all({ limit }).map(Score);
  },
};

export default ScoreRepository;
