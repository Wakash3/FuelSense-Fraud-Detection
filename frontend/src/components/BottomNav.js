import React from 'react';

const navItems = [
  { id: 'dashboard',      icon: '📊', label: 'Dashboard' },
  { id: 'deliveries',     icon: '🚚', label: 'Deliveries' },
  { id: 'reconciliation', icon: '📋', label: 'Recon' },
  { id: 'reports',        icon: '📈', label: 'Reports' },
];

function BottomNav({ activeTab, setActiveTab, darkMode }) {
  return (
    <div style={{
      ...styles.nav,
      background: darkMode ? '#1a1a2e' : '#ffffff',
      borderTop: `1px solid ${darkMode ? '#2a2a3e' : '#e0e0e0'}`,
    }}>
      {navItems.map(item => (
        <button
          key={item.id}
          style={{
            ...styles.navItem,
            color: activeTab === item.id
              ? '#4CAF50'
              : darkMode ? '#888' : '#999',
          }}
          onClick={() => setActiveTab(item.id)}
        >
          <span style={styles.icon}>{item.icon}</span>
          <span style={{
            ...styles.label,
            fontWeight: activeTab === item.id ? '600' : '400',
          }}>
            {item.label}
          </span>
        </button>
      ))}
    </div>
  );
}

const styles = {
  nav:     { position: 'fixed', bottom: 0, left: 0, right: 0, display: 'flex', zIndex: 100, padding: '8px 0', paddingBottom: 'env(safe-area-inset-bottom)' },
  navItem: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', border: 'none', background: 'none', cursor: 'pointer', padding: '6px 0' },
  icon:    { fontSize: '20px' },
  label:   { fontSize: '10px' },
};

export default BottomNav;