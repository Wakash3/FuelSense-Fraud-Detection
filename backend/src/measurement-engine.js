/**
 * FuelSense - Measurement Engine
 * Phase 3
 */

require('dotenv').config();

const { Client } = require('pg');

// ---------------------------------------------------------------------------
// Database — single persistent Client (same as api.js)
// ---------------------------------------------------------------------------
const DATABASE_URL = process.env.DATABASE_URL;
let db = null;

async function getDb() {
    if (db) return db;
    db = new Client({ connectionString: DATABASE_URL });
    await db.connect();
    console.log('[measurement] Database connected');
    return db;
}

// ---------------------------------------------------------------------------
// ASTM D1250 VCF constants
// ---------------------------------------------------------------------------
const VCF_CONSTANTS = {
    petrol:   { K0: 613.9723e-6, K1: 0.0 },
    diesel:   { K0: 613.9723e-6, K1: 0.0 },
    kerosene: { K0: 613.9723e-6, K1: 0.0 },
};

// ---------------------------------------------------------------------------
// Strapping table cache
// ---------------------------------------------------------------------------
const strappingCache = {};

async function loadStrappingTable(tankId) {
    if (strappingCache[tankId]) return strappingCache[tankId];

    const client = await getDb();
    const result = await client.query(
        `SELECT depth_mm, volume_litres FROM strapping_table_entries WHERE tank_id = $1 ORDER BY depth_mm ASC`,
        [tankId]
    );

    if (result.rows.length === 0) throw new Error('No strapping table entries found for tank ' + tankId);

    strappingCache[tankId] = result.rows;
    console.log('[measurement] Strapping table cached for tank ' + tankId + ' (' + result.rows.length + ' rows)');
    return strappingCache[tankId];
}

async function lookupStrappingTable(tankId, depthMm) {
    if (depthMm < 0) depthMm = 0;
    const table    = await loadStrappingTable(tankId);
    const floorMm  = Math.floor(depthMm);
    const ceilMm   = Math.ceil(depthMm);
    const fraction = depthMm - floorMm;
    const floorRow = table.find(r => r.depth_mm === floorMm);
    if (!floorRow) throw new Error('Strapping table lookup failed: depth ' + floorMm + 'mm not found for tank ' + tankId);
    if (fraction === 0 || floorMm === ceilMm) return parseFloat(floorRow.volume_litres);
    const ceilRow = table.find(r => r.depth_mm === ceilMm);
    if (!ceilRow) return parseFloat(floorRow.volume_litres);
    return +(parseFloat(floorRow.volume_litres) + fraction * (parseFloat(ceilRow.volume_litres) - parseFloat(floorRow.volume_litres))).toFixed(3);
}

async function calculateTOVandWater(tankId, innageMm, waterMm) {
    const tov_litres   = await lookupStrappingTable(tankId, innageMm);
    const water_litres = await lookupStrappingTable(tankId, waterMm);
    return { tov_litres, water_litres, gov_litres: +(tov_litres - water_litres).toFixed(3) };
}

function calculateVCF(temperatureC, densityAt15C, fuelType = 'petrol') {
    const { K0, K1 } = VCF_CONSTANTS[fuelType] || VCF_CONSTANTS.petrol;
    const alpha  = K0 / (densityAt15C * densityAt15C) + K1 / densityAt15C;
    const deltaT = temperatureC - 15.0;
    return +Math.exp(-alpha * deltaT * (1 + 0.8 * alpha * deltaT)).toFixed(6);
}

async function calculateNSV(tankId, innageMm, waterMm, temperatureC) {
    const client     = await getDb();
    const tankResult = await client.query('SELECT fuel_type, fuel_density_at_15c FROM tanks WHERE id = $1', [tankId]);
    if (tankResult.rows.length === 0) throw new Error('Tank not found: ' + tankId);

    const { fuel_type, fuel_density_at_15c } = tankResult.rows[0];
    const density = parseFloat(fuel_density_at_15c);

    const { tov_litres, water_litres, gov_litres } = await calculateTOVandWater(tankId, innageMm, waterMm);
    const vcf        = calculateVCF(temperatureC, density, fuel_type);
    const nsv_litres = +(gov_litres * vcf).toFixed(3);

    return { tov_litres, water_litres, gov_litres, vcf, nsv_litres };
}

module.exports = { lookupStrappingTable, calculateTOVandWater, calculateVCF, calculateNSV };