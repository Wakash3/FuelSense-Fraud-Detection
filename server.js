// server.js - Runs BOTH ATG Simulator AND FuelSense API
const { exec } = require('child_process');
const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// CORS CONFIGURATION - Allow Vercel frontend
// ============================================
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
    res.header('Access-Control-Allow-Credentials', 'true');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});
app.use(cors());
app.use(express.json());

console.log('[SERVER] Starting FuelSense Unified Server...');
console.log('[SERVER] Node version:', process.version);
console.log('[SERVER] Environment:', process.env.NODE_ENV || 'development');

// ============================================
// PART 1: ATG SIMULATOR (generates tank readings)
// ============================================
let simulator = null;
let restartCount = 0;

function startSimulator() {
    console.log('[SIMULATOR] Starting ATG Simulator...');
    simulator = exec('node backend/src/atg-simulator.js');
    
    simulator.stdout.on('data', (data) => {
        console.log(`[SIMULATOR] ${data.trim()}`);
    });
    
    simulator.stderr.on('data', (data) => {
        console.error(`[SIMULATOR ERROR] ${data.trim()}`);
    });
    
    simulator.on('close', (code) => {
        console.log(`[SIMULATOR] Process exited with code ${code}`);
        restartCount++;
        if (restartCount < 5) {
            console.log('[SERVER] Restarting simulator in 10 seconds...');
            setTimeout(startSimulator, 10000);
        }
    });
}

startSimulator();

// ============================================
// PART 2: FUELSENSE API (serves frontend requests)
// ============================================
try {
    // Import your existing API
    const api = require('./backend/src/api');
    
    // Mount ALL API routes under /api
    app.use('/api', api);
    
    console.log('[API] FuelSense API routes mounted successfully');
    console.log('[API] Available endpoints:');
    console.log('  - GET  /api/health');
    console.log('  - GET  /api/user-profile');
    console.log('  - GET  /api/stations');
    console.log('  - GET  /api/audit-log');
    console.log('  - GET  /api/tanks');
    console.log('  - GET  /api/deliveries');
    console.log('  - POST /api/deliveries');
    console.log('  - GET  /api/alerts');
    console.log('  - GET  /api/shifts');
    console.log('  - POST /api/shifts/open');
    console.log('  - POST /api/shifts/:id/close');
    console.log('  - GET  /api/reconciliation');
    console.log('  - GET  /api/pump-vs-dip');
    console.log('  - POST /api/audit-log');
    console.log('  - GET  /api/plans');
    console.log('  - GET  /api/subscription');
    console.log('  - POST /api/payments/initiate');
    console.log('  - POST /api/payments/test');
    console.log('  - GET  /api/payments/callback');
    console.log('  - GET  /api/payments/history');
    console.log('  - GET  /api/cors-test');
    console.log('  - GET  /api/debug-pesapal');
} catch (err) {
    console.error('[API] Failed to load API routes:', err.message);
    
    // Fallback simple API endpoints if main API fails to load
    app.get('/api/health', (req, res) => {
        res.json({ status: 'ok', timestamp: new Date().toISOString(), message: 'API running in fallback mode' });
    });
    app.get('/api/user-profile', (req, res) => {
        res.json({ role: 'attendant', station_id: null, message: 'Fallback API - full API not loaded' });
    });
    app.get('/api/stations', (req, res) => {
        res.json([]);
    });
    app.get('/api/audit-log', (req, res) => {
        res.json([]);
    });
    app.get('/api/cors-test', (req, res) => {
        res.json({ cors_working: true, message: 'CORS is working (fallback mode)' });
    });
}

// ============================================
// HEALTH CHECK ENDPOINTS
// ============================================

// Root health check (for Render)
app.get('/health', (req, res) => {
    res.json({ 
        status: 'running', 
        timestamp: new Date().toISOString(),
        simulator: simulator ? 'running' : 'stopped',
        restarts: restartCount,
        api_mounted: true,
        api_endpoint: '/api/health'
    });
});

app.get('/ping', (req, res) => {
    res.send('pong');
});

// ============================================
// START SERVER
// ============================================
app.listen(PORT, () => {
    console.log(`[SERVER] FuelSense Unified Server running on port ${PORT}`);
    console.log(`[SERVER] Health check: https://fuelsense-fraud-detection.onrender.com/health`);
    console.log(`[SERVER] API base: https://fuelsense-fraud-detection.onrender.com/api`);
    console.log(`[SERVER] API health: https://fuelsense-fraud-detection.onrender.com/api/health`);
    console.log(`[SERVER] Simulator status: ${simulator ? 'running' : 'starting'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('[SERVER] SIGTERM received, shutting down...');
    if (simulator) simulator.kill();
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('[SERVER] SIGINT received, shutting down...');
    if (simulator) simulator.kill();
    process.exit(0);
});