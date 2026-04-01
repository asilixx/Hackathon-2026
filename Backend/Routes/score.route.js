import express from "express";
import ScoreController from "../Controllers/score.controller.js";

const router = express.Router();

router.post("/", ScoreController.create);
router.get("/", ScoreController.getAll);
router.get("/top", ScoreController.getTop);

export default router;
