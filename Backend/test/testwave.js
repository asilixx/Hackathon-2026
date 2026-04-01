// testWave.js
import WaveService from "../Services/waveservice.js";

for (let waveNumber = 1; waveNumber <= 10; waveNumber++) {
  const wave = WaveService.generateWave(waveNumber);
  console.log(`Vague ${waveNumber}:`);
  console.log(wave);
  console.log("-----------");
}