const express = require('express');
const { exec } = require('child_process');
const app = express();
const PORT = process.env.PORT || 3000;

let simulator = null;
let restartCount = 0;

function startSimulator() {
  console.log('[CLOUD] Starting ATG Simulator...');
  simulator = exec('node backend/src/atg-simulator.js');
  
  simulator.stdout.on('data', (data) => {
    console.log(`[SIM] ${data.trim()}`);
  });
  
  simulator.stderr.on('data', (data) => {
    console.error(`[SIM ERROR] ${data.trim()}`);
  });
  
  simulator.on('close', (code) => {
    console.log(`[SIM] Exited with code ${code}`);
    restartCount++;
    if (restartCount < 5) {
      console.log('[CLOUD] Restarting in 10 seconds...');
      setTimeout(startSimulator, 10000);
    }
  });
}

startSimulator();

app.get('/health', (req, res) => {
  res.json({
    status: 'running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    restarts: restartCount
  });
});

app.listen(PORT, () => {
  console.log(`[CLOUD] Health check: https://fuelsense-fraud-detection.onrender.com/health`);
});

process.on('SIGTERM', () => {
  if (simulator) simulator.kill();
  process.exit(0);
});
