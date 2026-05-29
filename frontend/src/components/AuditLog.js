import React, { useState, useEffect } from 'react';

function AuditLog({ api, activeStation, darkMode }) {
  const [logs,    setLogs]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState('all');

  const bgColor     = darkMode ? '#1e1e2e' : '#ffffff';
  const textColor   = darkMode ? '#e0e0e0' : '#1a1a2e';
  const subColor    = darkMode ? '#888'    : '#666';
  const borderColor = darkMode ? '#2a2a3e' : '#f0f0f0';

  useEffect(() => {
    loadLogs();
  }, [activeStation]); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadLogs() {
    setLoading(true);
    try {
      const stationParam = activeStation ? '?station_id=' + activeStation : '';
      const res  = await fetch(api + '/api/audit-log' + stationParam + '&limit=100');
      const data = await res.json();
      setLogs(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load audit log:', err);
    }
    setLoading(false);
  }

  const actionConfig = {
    SIGN_IN:         { icon: '🔐', color: '#27ae60', label: 'Sign In' },
    SIGN_OUT:        { icon: '🚪', color: '#95a5a6', label: 'Sign Out' },
    CREATE_DELIVERY: { icon: '🚚', color: '#3498db', label: 'Delivery Created' },
    UPDATE_DELIVERY: { icon: '✏️', color: '#f39c12', label: 'Delivery Updated' },
    PUMP_SALES:      { icon: '⛽', color: '#9b59b6', label: 'Pump Sales Entered' },
    FLAG_DELIVERY:   { icon: '🚨', color: '#e74c3c', label: 'Delivery Flagged' },
    RECONCILE:       { icon: '📋', color: '#1abc9c', label: 'Reconciliation' },
  };

  const filteredLogs = filter === 'all'
    ? logs
    : logs.filter(l => l.action === filter);

  return (
    <div>
      {/* Filter bar */}
      <div style={{ ...styles.filterBar, background: bgColor, borderColor }}>
        <div style={{ ...styles.filterTitle, color: textColor }}>🔍 Filter by action</div>
        <div style={styles.filterButtons}>
          {['all', 'SIGN_IN', 'SIGN_OUT', 'CREATE_DELIVERY', 'PUMP_SALES'].map(f => (
            <button
              key={f}
              style={{
                ...styles.filterBtn,
                background: filter === f ? '#1a1a2e' : 'transparent',
                color:      filter === f ? '#fff' : subColor,
                border:     `1px solid ${filter === f ? '#1a1a2e' : borderColor}`,
              }}
              onClick={() => setFilter(f)}
            >
              {f === 'all' ? 'All' : (actionConfig[f]?.label || f)}
            </button>
          ))}
        </div>
        <button
          style={{ ...styles.refreshBtn, color: textColor, borderColor }}
          onClick={loadLogs}
        >
          ↻ Refresh
        </button>
      </div>

      {/* Log entries */}
      <div style={{ ...styles.card, background: bgColor, borderColor }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: subColor }}>
            Loading audit log...
          </div>
        ) : filteredLogs.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: subColor }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>📋</div>
            <div>No audit log entries yet.</div>
            <div style={{ fontSize: '12px', marginTop: '8px' }}>
              Actions will appear here as users interact with the system.
            </div>
          </div>
        ) : (
          <div>
            {/* Header */}
            <div style={{ ...styles.headerRow, borderColor }}>
              <div style={{ color: subColor, fontSize: '11px', fontWeight: '600' }}>ACTION</div>
              <div style={{ color: subColor, fontSize: '11px', fontWeight: '600' }}>USER</div>
              <div style={{ color: subColor, fontSize: '11px', fontWeight: '600' }}>DETAILS</div>
              <div style={{ color: subColor, fontSize: '11px', fontWeight: '600' }}>TIME</div>
            </div>

            {filteredLogs.map(entry => {
              const config = actionConfig[entry.action] || { icon: '📝', color: '#95a5a6', label: entry.action };
              const newVal = entry.new_value ? (typeof entry.new_value === 'string' ? JSON.parse(entry.new_value) : entry.new_value) : null;

              return (
                <div key={entry.id} style={{ ...styles.row, borderColor }}>
                  {/* Action */}
                  <div style={styles.cell}>
                    <span style={{
                      ...styles.actionBadge,
                      background: config.color + '20',
                      color: config.color,
                    }}>
                      {config.icon} {config.label}
                    </span>
                  </div>

                  {/* User */}
                  <div style={styles.cell}>
                    <div style={{ fontSize: '13px', color: textColor, fontWeight: '500' }}>
                      {entry.user_email?.split('@')[0]}
                    </div>
                    <div style={{ fontSize: '11px', color: subColor, marginTop: '2px' }}>
                      {entry.user_role?.toUpperCase()}
                    </div>
                  </div>

                  {/* Details */}
                  <div style={styles.cell}>
                    {newVal && (
                      <div style={{ fontSize: '12px', color: subColor }}>
                        {newVal.bol_number && <span>BOL: {newVal.bol_number} · </span>}
                        {newVal.supplier_name && <span>{newVal.supplier_name} · </span>}
                        {newVal.bol_nsv_litres && <span>{parseFloat(newVal.bol_nsv_litres).toFixed(0)}L</span>}
                        {newVal.pump_sales_litres && <span>Sales: {parseFloat(newVal.pump_sales_litres).toFixed(0)}L</span>}
                      </div>
                    )}
                    {entry.entity_type && (
                      <div style={{ fontSize: '11px', color: subColor, marginTop: '2px' }}>
                        {entry.entity_type}
                      </div>
                    )}
                  </div>

                  {/* Time */}
                  <div style={styles.cell}>
                    <div style={{ fontSize: '12px', color: textColor }}>
                      {new Date(entry.created_at).toLocaleTimeString()}
                    </div>
                    <div style={{ fontSize: '11px', color: subColor, marginTop: '2px' }}>
                      {new Date(entry.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  filterBar:     { borderRadius: '10px', border: '1px solid', padding: '14px 16px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' },
  filterTitle:   { fontSize: '13px', fontWeight: '600', marginRight: '4px' },
  filterButtons: { display: 'flex', gap: '6px', flex: 1, flexWrap: 'wrap' },
  filterBtn:     { padding: '4px 12px', borderRadius: '99px', fontSize: '12px', cursor: 'pointer', fontWeight: '500' },
  refreshBtn:    { padding: '4px 12px', border: '1px solid', borderRadius: '6px', background: 'transparent', cursor: 'pointer', fontSize: '12px' },
  card:          { borderRadius: '10px', border: '1px solid', overflow: 'hidden' },
  headerRow:     { display: 'grid', gridTemplateColumns: '180px 150px 1fr 120px', gap: '12px', padding: '10px 16px', borderBottom: '2px solid', textTransform: 'uppercase', letterSpacing: '0.04em' },
  row:           { display: 'grid', gridTemplateColumns: '180px 150px 1fr 120px', gap: '12px', padding: '12px 16px', borderBottom: '1px solid', alignItems: 'center' },
  cell:          { },
  actionBadge:   { padding: '3px 10px', borderRadius: '99px', fontSize: '12px', fontWeight: '600', whiteSpace: 'nowrap' },
};

export default AuditLog;