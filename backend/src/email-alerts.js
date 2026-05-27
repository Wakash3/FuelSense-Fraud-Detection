/**
 * FuelSense — Email Alerts via Resend
 * Sends professional HTML emails for critical events:
 * - Low stock warning
 * - High water level
 * - Delivery flagged
 * - Daily reconciliation variance
 * - Reading gap (ATG offline)
 */

'use strict';

const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM   = process.env.ALERT_FROM_EMAIL || 'alerts@mafutasalama.co.ke';
const TO     = process.env.ALERT_TO_EMAIL   || '';

/**
 * Send an email alert.
 * @param {string} subject
 * @param {string} htmlBody
 */
async function sendAlert(subject, htmlBody) {
  if (!TO) {
    console.warn('[EMAIL] ALERT_TO_EMAIL not set — skipping email alert');
    return;
  }

  try {
    const { data, error } = await resend.emails.send({
      from:    FROM,
      to:      TO.split(',').map(e => e.trim()),
      subject: `[FuelSense] ${subject}`,
      html:    wrapHTML(subject, htmlBody),
    });

    if (error) {
      console.error('[EMAIL] Failed to send alert:', error);
    } else {
      console.log('[EMAIL] Alert sent:', subject, '→', data.id);
    }
  } catch (err) {
    console.error('[EMAIL] Error sending alert:', err.message);
  }
}

/**
 * Wrap content in a professional HTML email template.
 */
function wrapHTML(title, content) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#f0f2f5;font-family:system-ui,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:24px;">

    <!-- Header -->
    <div style="background:#1a1a2e;border-radius:12px 12px 0 0;padding:24px;text-align:center;">
      <div style="font-size:36px;margin-bottom:8px;">⛽</div>
      <div style="color:#fff;font-size:20px;font-weight:700;">FuelSense</div>
      <div style="color:#4CAF50;font-size:12px;margin-top:4px;">Mafuta Salama · Nairobi, Kenya</div>
    </div>

    <!-- Content -->
    <div style="background:#fff;padding:24px;border-radius:0 0 12px 12px;box-shadow:0 4px 12px rgba(0,0,0,0.08);">
      <h2 style="color:#1a1a2e;margin:0 0 16px;font-size:18px;">${title}</h2>
      ${content}
      <hr style="border:none;border-top:1px solid #f0f0f0;margin:24px 0;">
      <p style="color:#999;font-size:12px;margin:0;">
        This is an automated alert from FuelSense. 
        Log in to your dashboard at 
        <a href="https://fuelsense-dashboard.vercel.app" style="color:#1a1a2e;">fuelsense-dashboard.vercel.app</a>
        to view details.
      </p>
    </div>

    <!-- Footer -->
    <div style="text-align:center;padding:16px;color:#999;font-size:11px;">
      FuelSense · Mafuta Salama · © ${new Date().getFullYear()}
    </div>
  </div>
</body>
</html>`;
}

// ── Alert types ──────────────────────────────────────────────────────────────

/**
 * Low stock alert — tank below 20%
 */
async function alertLowStock(tankNumber, fuelType, fillPct, nsvLitres) {
  await sendAlert(
    `⚠️ Low Stock — Tank ${tankNumber} (${fuelType.toUpperCase()})`,
    `
    <div style="background:#fff3cd;border:1px solid #ffc107;border-radius:8px;padding:16px;margin-bottom:16px;">
      <strong style="color:#856404;">⚠️ Tank ${tankNumber} is running low</strong>
    </div>
    <table style="width:100%;border-collapse:collapse;">
      <tr style="border-bottom:1px solid #f0f0f0;">
        <td style="padding:10px 0;color:#666;font-size:13px;">Tank</td>
        <td style="padding:10px 0;color:#1a1a2e;font-weight:600;font-size:13px;">Tank ${tankNumber} — ${fuelType.toUpperCase()}</td>
      </tr>
      <tr style="border-bottom:1px solid #f0f0f0;">
        <td style="padding:10px 0;color:#666;font-size:13px;">Current Level</td>
        <td style="padding:10px 0;color:#e74c3c;font-weight:700;font-size:16px;">${parseFloat(fillPct).toFixed(1)}%</td>
      </tr>
      <tr>
        <td style="padding:10px 0;color:#666;font-size:13px;">NSV Remaining</td>
        <td style="padding:10px 0;color:#1a1a2e;font-weight:600;font-size:13px;">${parseFloat(nsvLitres).toFixed(0)} litres</td>
      </tr>
    </table>
    <p style="color:#856404;font-size:13px;margin-top:16px;">
      <strong>Action required:</strong> Schedule a fuel delivery immediately to avoid stock-out.
    </p>
    `
  );
}

/**
 * High water alert — water level above 50mm
 */
async function alertHighWater(tankNumber, fuelType, waterMm) {
  await sendAlert(
    `🚨 High Water Level — Tank ${tankNumber}`,
    `
    <div style="background:#fdecea;border:1px solid #f5c6cb;border-radius:8px;padding:16px;margin-bottom:16px;">
      <strong style="color:#721c24;">🚨 High water detected in Tank ${tankNumber}</strong>
    </div>
    <table style="width:100%;border-collapse:collapse;">
      <tr style="border-bottom:1px solid #f0f0f0;">
        <td style="padding:10px 0;color:#666;font-size:13px;">Tank</td>
        <td style="padding:10px 0;color:#1a1a2e;font-weight:600;font-size:13px;">Tank ${tankNumber} — ${fuelType.toUpperCase()}</td>
      </tr>
      <tr>
        <td style="padding:10px 0;color:#666;font-size:13px;">Water Level</td>
        <td style="padding:10px 0;color:#e74c3c;font-weight:700;font-size:16px;">${parseFloat(waterMm).toFixed(1)} mm</td>
      </tr>
    </table>
    <p style="color:#721c24;font-size:13px;margin-top:16px;">
      <strong>Action required:</strong> Inspect the tank immediately. Water contamination can damage equipment and fuel quality.
    </p>
    `
  );
}

/**
 * Delivery flagged alert
 */
async function alertDeliveryFlagged(delivery) {
  const variance    = parseFloat(delivery.variance_litres || 0);
  const variancePct = parseFloat(delivery.variance_pct || 0);

  await sendAlert(
    `🚨 Delivery Flagged — ${delivery.bol_number}`,
    `
    <div style="background:#fdecea;border:1px solid #f5c6cb;border-radius:8px;padding:16px;margin-bottom:16px;">
      <strong style="color:#721c24;">🚨 Delivery variance exceeds tolerance</strong>
    </div>
    <table style="width:100%;border-collapse:collapse;">
      <tr style="border-bottom:1px solid #f0f0f0;">
        <td style="padding:10px 0;color:#666;font-size:13px;">BOL Number</td>
        <td style="padding:10px 0;color:#1a1a2e;font-weight:600;font-size:13px;">${delivery.bol_number}</td>
      </tr>
      <tr style="border-bottom:1px solid #f0f0f0;">
        <td style="padding:10px 0;color:#666;font-size:13px;">Supplier</td>
        <td style="padding:10px 0;color:#1a1a2e;font-size:13px;">${delivery.supplier_name}</td>
      </tr>
      <tr style="border-bottom:1px solid #f0f0f0;">
        <td style="padding:10px 0;color:#666;font-size:13px;">BOL NSV</td>
        <td style="padding:10px 0;color:#1a1a2e;font-size:13px;">${parseFloat(delivery.bol_nsv_litres).toFixed(0)} L</td>
      </tr>
      <tr style="border-bottom:1px solid #f0f0f0;">
        <td style="padding:10px 0;color:#666;font-size:13px;">Received NSV</td>
        <td style="padding:10px 0;color:#1a1a2e;font-size:13px;">${parseFloat(delivery.received_nsv_litres).toFixed(0)} L</td>
      </tr>
      <tr style="border-bottom:1px solid #f0f0f0;">
        <td style="padding:10px 0;color:#666;font-size:13px;">Variance</td>
        <td style="padding:10px 0;color:#e74c3c;font-weight:700;font-size:16px;">
          ${variance > 0 ? '+' : ''}${variance.toFixed(0)} L (${variancePct.toFixed(3)}%)
        </td>
      </tr>
      <tr>
        <td style="padding:10px 0;color:#666;font-size:13px;">Classification</td>
        <td style="padding:10px 0;color:#1a1a2e;font-size:13px;">${(delivery.variance_classification || '').replace(/_/g, ' ')}</td>
      </tr>
    </table>
    <p style="color:#721c24;font-size:13px;margin-top:16px;">
      <strong>Action required:</strong> Review the delivery records and contact the supplier to dispute the variance.
    </p>
    `
  );
}

/**
 * Reading gap alert — ATG offline
 */
async function alertReadingGap(message) {
  await sendAlert(
    '🔴 ATG Offline — Reading Gap Detected',
    `
    <div style="background:#fdecea;border:1px solid #f5c6cb;border-radius:8px;padding:16px;margin-bottom:16px;">
      <strong style="color:#721c24;">🔴 ATG probe is not sending readings</strong>
    </div>
    <p style="color:#1a1a2e;font-size:13px;">${message}</p>
    <p style="color:#721c24;font-size:13px;margin-top:16px;">
      <strong>Action required:</strong> Check the ATG console, IoT gateway connection, and network connectivity at the station.
    </p>
    `
  );
}

/**
 * Daily reconciliation variance alert
 */
async function alertDailyVariance(tankNumber, fuelType, varianceLitres, date) {
  const isNegative = varianceLitres < 0;
  await sendAlert(
    `📋 Daily Variance Alert — Tank ${tankNumber}`,
    `
    <div style="background:${isNegative ? '#fdecea' : '#fff3cd'};border:1px solid ${isNegative ? '#f5c6cb' : '#ffc107'};border-radius:8px;padding:16px;margin-bottom:16px;">
      <strong style="color:${isNegative ? '#721c24' : '#856404'};">
        ${isNegative ? '📉 Unaccounted fuel loss detected' : '📈 Unexpected fuel gain detected'}
      </strong>
    </div>
    <table style="width:100%;border-collapse:collapse;">
      <tr style="border-bottom:1px solid #f0f0f0;">
        <td style="padding:10px 0;color:#666;font-size:13px;">Date</td>
        <td style="padding:10px 0;color:#1a1a2e;font-size:13px;">${date}</td>
      </tr>
      <tr style="border-bottom:1px solid #f0f0f0;">
        <td style="padding:10px 0;color:#666;font-size:13px;">Tank</td>
        <td style="padding:10px 0;color:#1a1a2e;font-weight:600;font-size:13px;">Tank ${tankNumber} — ${fuelType.toUpperCase()}</td>
      </tr>
      <tr>
        <td style="padding:10px 0;color:#666;font-size:13px;">Daily Variance</td>
        <td style="padding:10px 0;font-weight:700;font-size:16px;color:${isNegative ? '#e74c3c' : '#f39c12'};">
          ${varianceLitres > 0 ? '+' : ''}${varianceLitres.toFixed(0)} L
        </td>
      </tr>
    </table>
    <p style="font-size:13px;margin-top:16px;color:${isNegative ? '#721c24' : '#856404'};">
      <strong>Action required:</strong> ${isNegative
        ? 'Investigate possible leak, theft, or meter fault.'
        : 'Verify pump sales figures and delivery records for this date.'}
    </p>
    `
  );
}

module.exports = {
  alertLowStock,
  alertHighWater,
  alertDeliveryFlagged,
  alertReadingGap,
  alertDailyVariance,
};