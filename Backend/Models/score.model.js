const Score = (row) => ({
  id: row.id,
  pseudo: row.pseudo,
  score: row.score,
  wave: row.wave,
  zombiesKilled: row.zombies_killed,
});

export default  Score;
