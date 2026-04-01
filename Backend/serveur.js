import express from "express";
import scoreRoutes from "./Routes/score.route.js";
import waveRoutes from "./Routes/wave.route.js";

const app = express();

app.use(express.json());

app.use("/scores", scoreRoutes);
app.use("/waves", waveRoutes);

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
