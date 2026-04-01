// Backend/Routes/wave.route.js
import express from "express";
import WaveController from "../Controllers/wave.controller.js";

const router = express.Router();

router.get("/:waveNumber", WaveController.getWave);

export default router;