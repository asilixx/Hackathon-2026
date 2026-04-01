import WaveService from "../Services/waveservice.js";

const WaveController = {
  getWave(req, res) {
    const num = Number(req.params.waveNumber);

    if (!num || num < 1)
      return res.status(400).json({ error: "Numéro de vague invalide." });
    res.json({ waveNumber: num, enemies: WaveService.generateWave(num) });
  },
};

export default WaveController;
