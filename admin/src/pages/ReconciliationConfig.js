import React, { useState, useEffect } from 'react';

export default function ReconciliationConfig({ api }) {
    const [stations, setStations] = useState([]);
    const [selectedStation, setSelectedStation] = useState('');
    const [config, setConfig] = useState(null);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState('');

    async function loadStations() {
        try {
            const res = await fetch(`${api}/api/admin/stations`);
            const data = await res.json();
            setStations(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Failed to load stations:', err);
        }
    }

    async function loadConfig(stationId) {
        setLoading(true);
        setError('');
        try {
            const res = await fetch(`${api}/api/admin/reconciliation-config/${stationId}`);
            const data = await res.json();
            setConfig(data);
        } catch (err) {
            setError('Failed to load reconciliation config.');
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => { loadStations(); }, []);

    useEffect(() => {
        if (selectedStation) loadConfig(selectedStation);
        else setConfig(null);
    }, [selectedStation]);

    async function handleSave() {
        if (!selectedStation) { setError('Please select a station.'); return; }
        setSaving(true);
        setError('');
        setSaved(false);
        try {
            const res = await fetch(`${api}/api/admin/reconciliation-config`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...config, station_id: selectedStation }),
            });
            const data = await res.json();
            if (data.error) { setError(data.error); return; }
            setConfig(data);
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (err) {
            setError('Failed to save config.');
        } finally {
            setSaving(false);
        }
    }

    const inputStyle = {
        width: '100%', padding: '9px 12px', borderRadius: '8px',
        border: '1px solid #e0e0e0', fontSize: '13px', outline: 'none',
        boxSizing: 'border-box', background: '#f8f8f8',
    };

    const labelStyle = {
        display: 'block', fontSize: '12px', fontWeight: '500',
        color: '#666', marginBottom: '4px',
    };

    const sectionStyle = {
        background: '#fff', borderRadius: '12px', padding: '24px',
        marginBottom: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        border: '1px solid #e0e0e0',
    };

    return (
        <div>
            {/* Header */}
            <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '14px', color: '#666', marginBottom: '12px' }}>
                    Select a station to configure its reconciliation constants.
                </div>
                <select
                    value={selectedStation}
                    onChange={e => setSelectedStation(e.target.value)}
                    style={{ padding: '9px 12px', borderRadius: '8px', border: '1px solid #e0e0e0', fontSize: '13px', background: '#fff', outline: 'none', minWidth: '280px' }}
                >
                    <option value="">Select a station...</option>
                    {stations.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
            </div>

            {error && (
                <div style={{ background: '#fdecea', color: '#721c24', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px' }}>
                    {error}
                </div>
            )}

            {saved && (
                <div style={{ background: '#eafaf1', color: '#1e8449', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px' }}>
                    ✅ Reconciliation configuration saved successfully
                </div>
            )}

            {loading && (
                <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>Loading config...</div>
            )}

            {config && !loading && (
                <>
                    <div style={sectionStyle}>
                        <div style={{ fontSize: '14px', fontWeight: '600', color: '#1a1a2e', marginBottom: '6px' }}>
                            ⚖️ Reconciliation Constants
                        </div>
                        <div style={{ fontSize: '12px', color: '#888', marginBottom: '16px' }}>
                            These values control how the system detects deliveries, flags variances and locks readings.
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                            <div>
                                <label style={labelStyle}>Default Tolerance (%)</label>
                                <input
                                    type="number" step="0.01" min="0" max="10"
                                    value={config.default_tolerance_pct}
                                    onChange={e => setConfig({ ...config, default_tolerance_pct: e.target.value })}
                                    style={inputStyle}
                                />
                                <div style={{ fontSize: '11px', color: '#aaa', marginTop: '4px' }}>
                                    Default: 0.25% — delivery variance threshold when no supplier-specific tolerance is set
                                </div>
                            </div>

                            <div>
                                <label style={labelStyle}>Stabilisation Std Dev Threshold (°C)</label>
                                <input
                                    type="number" step="0.001" min="0"
                                    value={config.stabilisation_std_dev_threshold}
                                    onChange={e => setConfig({ ...config, stabilisation_std_dev_threshold: e.target.value })}
                                    style={inputStyle}
                                />
                                <div style={{ fontSize: '11px', color: '#aaa', marginTop: '4px' }}>
                                    Default: 0.3°C — temperature must stay within this range to confirm stabilisation
                                </div>
                            </div>

                            <div>
                                <label style={labelStyle}>Delivery Detection Threshold (mm)</label>
                                <input
                                    type="number" step="1" min="1"
                                    value={config.delivery_detection_threshold_mm}
                                    onChange={e => setConfig({ ...config, delivery_detection_threshold_mm: e.target.value })}
                                    style={inputStyle}
                                />
                                <div style={{ fontSize: '11px', color: '#aaa', marginTop: '4px' }}>
                                    Default: 50mm — minimum rise in tank level to detect a delivery has started
                                </div>
                            </div>

                            <div>
                                <label style={labelStyle}>ATG Polling Interval (seconds)</label>
                                <input
                                    type="number" step="1" min="10"
                                    value={config.atg_polling_interval_seconds}
                                    onChange={e => setConfig({ ...config, atg_polling_interval_seconds: e.target.value })}
                                    style={inputStyle}
                                />
                                <div style={{ fontSize: '11px', color: '#aaa', marginTop: '4px' }}>
                                    Default: 60 seconds — how often the system reads the ATG probe
                                </div>
                            </div>

                            <div>
                                <label style={labelStyle}>Stabilisation Timeout (hours)</label>
                                <input
                                    type="number" step="1" min="1"
                                    value={config.stabilisation_timeout_hours}
                                    onChange={e => setConfig({ ...config, stabilisation_timeout_hours: e.target.value })}
                                    style={inputStyle}
                                />
                                <div style={{ fontSize: '11px', color: '#aaa', marginTop: '4px' }}>
                                    Default: 14 hours — after this time, delivery is locked even if not stabilised
                                </div>
                            </div>
                        </div>

                        {/* Visual reference */}
                        <div style={{ background: '#f8f8f8', borderRadius: '8px', padding: '14px 16px', fontSize: '12px', color: '#666' }}>
                            <strong>Current settings summary:</strong><br />
                            Variance flag: ±{config.default_tolerance_pct}% &nbsp;·&nbsp;
                            Delivery detected at: +{config.delivery_detection_threshold_mm}mm rise &nbsp;·&nbsp;
                            Poll every: {config.atg_polling_interval_seconds}s &nbsp;·&nbsp;
                            Lock after: {config.stabilisation_timeout_hours}hrs
                        </div>
                    </div>

                    <button
                        onClick={handleSave}
                        disabled={saving}
                        style={{ padding: '11px 28px', background: saving ? '#888' : '#1a1a2e', color: '#fff', border: 'none', borderRadius: '8px', cursor: saving ? 'not-allowed' : 'pointer', fontSize: '14px', fontWeight: '600' }}
                    >
                        {saving ? 'Saving...' : '💾 Save Reconciliation Config'}
                    </button>
                </>
            )}

            {!selectedStation && !loading && (
                <div style={{ background: '#fff', borderRadius: '12px', padding: '60px 24px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚖️</div>
                    <div style={{ fontSize: '16px', fontWeight: '500', color: '#1a1a2e', marginBottom: '8px' }}>No station selected</div>
                    <div style={{ fontSize: '13px', color: '#888' }}>Select a station above to configure its reconciliation constants.</div>
                </div>
            )}
        </div>
    );
}