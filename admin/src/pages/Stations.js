import React, { useState, useEffect } from 'react';

export default function Stations({ api }) {
    const [stations, setStations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({ name: '', location: '' });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    async function loadStations() {
        setLoading(true);
        try {
            const res = await fetch(`${api}/api/admin/stations`);
            const data = await res.json();
            setStations(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Failed to load stations:', err);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => { loadStations(); }, []);

    function openAdd() {
        setEditing(null);
        setForm({ name: '', location: '' });
        setError('');
        setShowForm(true);
    }

    function openEdit(station) {
        setEditing(station);
        setForm({ name: station.name, location: station.location || '' });
        setError('');
        setShowForm(true);
    }

    async function handleSave() {
        if (!form.name.trim()) { setError('Station name is required.'); return; }
        setSaving(true);
        setError('');
        try {
            const url = editing ? `${api}/api/admin/stations/${editing.id}` : `${api}/api/admin/stations`;
            const method = editing ? 'PUT' : 'POST';
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            const data = await res.json();
            if (data.error) { setError(data.error); return; }
            setShowForm(false);
            loadStations();
        } catch (err) {
            setError('Failed to save station.');
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete(station) {
        if (!window.confirm(`Delete station "${station.name}"? This cannot be undone.`)) return;
        try {
            await fetch(`${api}/api/admin/stations/${station.id}`, { method: 'DELETE' });
            loadStations();
        } catch (err) {
            alert('Failed to delete station.');
        }
    }

    const inputStyle = {
        width: '100%', padding: '9px 12px', borderRadius: '8px',
        border: '1px solid #e0e0e0', fontSize: '13px', outline: 'none',
        boxSizing: 'border-box', background: '#f8f8f8',
    };

    return (
        <div>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div style={{ fontSize: '14px', color: '#666' }}>{stations.length} station{stations.length !== 1 ? 's' : ''} total</div>
                <button
                    onClick={openAdd}
                    style={{ padding: '9px 18px', background: '#1a1a2e', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}
                >
                    + Add Station
                </button>
            </div>

            {/* Form */}
            {showForm && (
                <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', marginBottom: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '1px solid #e0e0e0' }}>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#1a1a2e', marginBottom: '16px' }}>
                        {editing ? '✏️ Edit Station' : '🏪 Add New Station'}
                    </div>
                    {error && (
                        <div style={{ background: '#fdecea', color: '#721c24', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px' }}>
                            {error}
                        </div>
                    )}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: '#666', marginBottom: '4px' }}>Station Name *</label>
                            <input
                                type="text"
                                value={form.name}
                                onChange={e => setForm({ ...form, name: e.target.value })}
                                placeholder="e.g. Mafuta Salama Nairobi"
                                style={inputStyle}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: '#666', marginBottom: '4px' }}>Location</label>
                            <input
                                type="text"
                                value={form.location}
                                onChange={e => setForm({ ...form, location: e.target.value })}
                                placeholder="e.g. Westlands, Nairobi"
                                style={inputStyle}
                            />
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            style={{ padding: '9px 20px', background: saving ? '#888' : '#27ae60', color: '#fff', border: 'none', borderRadius: '8px', cursor: saving ? 'not-allowed' : 'pointer', fontSize: '13px', fontWeight: '600' }}
                        >
                            {saving ? 'Saving...' : editing ? 'Update Station' : 'Add Station'}
                        </button>
                        <button
                            onClick={() => setShowForm(false)}
                            style={{ padding: '9px 20px', background: '#f0f0f0', color: '#333', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' }}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* List */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>Loading stations...</div>
            ) : stations.length === 0 ? (
                <div style={{ background: '#fff', borderRadius: '12px', padding: '60px 24px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏪</div>
                    <div style={{ fontSize: '16px', fontWeight: '500', color: '#1a1a2e', marginBottom: '8px' }}>No stations yet</div>
                    <div style={{ fontSize: '13px', color: '#888' }}>Add your first station to get started.</div>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {stations.map(station => (
                        <div key={station.id} style={{ background: '#fff', borderRadius: '12px', padding: '20px 24px', boxShadow: '0 2px 6px rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <div style={{ fontSize: '15px', fontWeight: '600', color: '#1a1a2e', marginBottom: '4px' }}>
                                    🏪 {station.name}
                                </div>
                                <div style={{ fontSize: '13px', color: '#888' }}>
                                    {station.location || 'No location set'} &nbsp;·&nbsp;
                                    <span style={{ color: '#3498db' }}>{station.tank_count || 0} tank{station.tank_count !== '1' ? 's' : ''}</span>
                                </div>
                                <div style={{ fontSize: '11px', color: '#bbb', marginTop: '4px' }}>
                                    ID: {station.id}
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                    onClick={() => openEdit(station)}
                                    style={{ padding: '7px 14px', background: '#e8f4fd', color: '#1a5276', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '500' }}
                                >
                                    ✏️ Edit
                                </button>
                                <button
                                    onClick={() => handleDelete(station)}
                                    style={{ padding: '7px 14px', background: '#fdecea', color: '#e74c3c', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '500' }}
                                >
                                    🗑 Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}