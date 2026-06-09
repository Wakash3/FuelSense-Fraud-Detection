'use strict';

const ASTM_REFERENCE_TEMP = 15.0;

const ASTM_PRODUCTS = {
  petrol:   { K0: 613.9723e-6, K1: 0.0,       densityMin: 0.6110, densityMax: 0.7700 },
  diesel:   { K0: 186.9764e-6, K1: 0.4862e-3, densityMin: 0.8300, densityMax: 0.9660 },
  kerosene: { K0: 330.3010e-6, K1: 0.0,       densityMin: 0.7800, densityMax: 0.8300 },
};

async function lookupStrappingTable(db, tankId, depthMm) {
  // --- VALIDATION: Prevent NaN errors ---
  depthMm = parseFloat(depthMm);
  if (isNaN(depthMm)) depthMm = 0;
  if (depthMm <= 0) return 0;

  const floorMm = Math.floor(depthMm);
  const ceilMm = floorMm + 1;
  const fraction = depthMm - floorMm;

  try {
    const res = await db.query(
      `SELECT depth_mm, volume_litres
         FROM strapping_table_entries
        WHERE tank_id = $1
          AND depth_mm IN ($2, $3)
        ORDER BY depth_mm ASC`,
      [tankId, floorMm, ceilMm]
    );

    if (res.rows.length === 0) {
      // Fallback: linear approximation if no strapping table exists
      console.log(`[NSV] No strapping table for tank ${tankId}, using linear approximation`);
      // Assume 2000mm = 10000 litres capacity
      const maxDepth = 2000;
      const maxVolume = 10000;
      const volume = (depthMm / maxDepth) * maxVolume;
      return Math.max(0, Math.min(volume, maxVolume));
    }

    const floorRow = res.rows.find(r => parseInt(r.depth_mm) === floorMm);
    const ceilRow = res.rows.find(r => parseInt(r.depth_mm) === ceilMm);

    if (!floorRow) return 0;

    const floorVol = parseFloat(floorRow.volume_litres);
    if (!ceilRow || fraction === 0) return floorVol;

    const ceilVol = parseFloat(ceilRow.volume_litres);
    return +(floorVol + fraction * (ceilVol - floorVol)).toFixed(3);
  } catch (err) {
    console.error(`[NSV] Error looking up strapping table:`, err.message);
    // Fallback: linear approximation
    const maxDepth = 2000;
    const maxVolume = 10000;
    const volume = (depthMm / maxDepth) * maxVolume;
    return Math.max(0, Math.min(volume, maxVolume));
  }
}

async function calculateTOVandWater(db, tankId, innage_mm, water_mm) {
  // --- VALIDATION: Prevent NaN errors ---
  innage_mm = parseFloat(innage_mm);
  water_mm = parseFloat(water_mm);
  
  if (isNaN(innage_mm)) innage_mm = 0;
  if (isNaN(water_mm)) water_mm = 0;
  
  const safeWater = Math.min(water_mm, innage_mm);

  const [tov_litres, water_litres] = await Promise.all([
    lookupStrappingTable(db, tankId, innage_mm),
    lookupStrappingTable(db, tankId, safeWater),
  ]);

  const gov_litres = Math.max(0, tov_litres - water_litres);

  return {
    tov_litres: +tov_litres.toFixed(3),
    water_litres: +water_litres.toFixed(3),
    gov_litres: +gov_litres.toFixed(3),
  };
}

function calculateVCF(temperatureC, densityAt15C, fuelType = 'petrol') {
  // --- VALIDATION: Prevent NaN errors ---
  temperatureC = parseFloat(temperatureC);
  densityAt15C = parseFloat(densityAt15C);
  
  if (isNaN(temperatureC)) temperatureC = 20;
  if (isNaN(densityAt15C)) densityAt15C = 0.74; // Default petrol density
  
  const product = ASTM_PRODUCTS[fuelType.toLowerCase()];
  if (!product) {
    console.log(`[NSV] Unknown fuel type: ${fuelType}, using petrol coefficients`);
    const defaultProduct = ASTM_PRODUCTS.petrol;
    const { K0, K1 } = defaultProduct;
    const alpha = K0 / (densityAt15C * densityAt15C) + K1 / densityAt15C;
    const deltaT = temperatureC - ASTM_REFERENCE_TEMP;
    const exponent = -alpha * deltaT * (1 + 0.8 * alpha * deltaT);
    return +Math.exp(exponent).toFixed(6);
  }

  const { K0, K1 } = product;
  const alpha = K0 / (densityAt15C * densityAt15C) + K1 / densityAt15C;
  const deltaT = temperatureC - ASTM_REFERENCE_TEMP;
  const exponent = -alpha * deltaT * (1 + 0.8 * alpha * deltaT);
  return +Math.exp(exponent).toFixed(6);
}

async function calculateNSV(db, tankId, innage_mm, water_mm, temperature_c) {
  // --- VALIDATION: Prevent NaN errors ---
  innage_mm = parseFloat(innage_mm);
  water_mm = parseFloat(water_mm);
  temperature_c = parseFloat(temperature_c);
  
  if (isNaN(innage_mm)) innage_mm = 0;
  if (isNaN(water_mm)) water_mm = 0;
  if (isNaN(temperature_c)) temperature_c = 20;
  
  console.log(`[NSV] Calculating for tank ${tankId}: innage=${innage_mm}mm, water=${water_mm}mm, temp=${temperature_c}°C`);

  try {
    const tankRes = await db.query(
      `SELECT fuel_type, fuel_density_at_15c, capacity_litres FROM tanks WHERE id = $1`,
      [tankId]
    );
    
    if (!tankRes.rows.length) {
      console.error(`[NSV] Tank not found: ${tankId}`);
      // Return default values instead of throwing
      return {
        tov_litres: 0,
        water_litres: 0,
        gov_litres: 0,
        vcf: 1.0,
        nsv_litres: 0
      };
    }

    const { fuel_type, fuel_density_at_15c, capacity_litres } = tankRes.rows[0];
    const density = parseFloat(fuel_density_at_15c) || 0.74;
    
    console.log(`[NSV] Tank: fuel_type=${fuel_type}, density=${density}, capacity=${capacity_litres}L`);

    const volumes = await calculateTOVandWater(db, tankId, innage_mm, water_mm);
    const vcf = calculateVCF(temperature_c, density, fuel_type);
    const nsv_litres = +(volumes.gov_litres * vcf).toFixed(3);

    console.log(`[NSV] Results: TOV=${volumes.tov_litres}L, Water=${volumes.water_litres}L, NSV=${nsv_litres}L`);

    return { ...volumes, vcf, nsv_litres };
  } catch (err) {
    console.error(`[NSV] Error in calculateNSV:`, err.message);
    // Return safe default values
    return {
      tov_litres: 0,
      water_litres: 0,
      gov_litres: 0,
      vcf: 1.0,
      nsv_litres: 0
    };
  }
}

module.exports = {
  calculateNSV,
  calculateVCF,
  calculateTOVandWater,
  lookupStrappingTable,
  ASTM_REFERENCE_TEMP,
  ASTM_PRODUCTS,
};