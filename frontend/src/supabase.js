// API client - connects to FuelSense Express backend

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3001';

async function apiFetch(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || res.statusText);
  }

  return res.json();
}

export const api = {
  getTanks:           ()           => apiFetch('/api/tanks'),
  getTankReadings:    (id)         => apiFetch(`/api/tanks/${id}/readings`),
  getDeliveries:      ()           => apiFetch('/api/deliveries'),
  getDelivery:        (id)         => apiFetch(`/api/deliveries/${id}`),
  createDelivery:     (data)       => apiFetch('/api/deliveries', { method: 'POST', body: JSON.stringify(data) }),
  getReconciliation:  ()           => apiFetch('/api/reconciliation'),
  updatePumpSales:    (data)       => apiFetch('/api/reconciliation/pump-sales', { method: 'POST', body: JSON.stringify(data) }),
  healthCheck:        ()           => apiFetch('/api/health'),
};

// Bypass Supabase auth — using our own backend instead
export const supabase = {
  auth: {
    getSession:          () => Promise.resolve({ data: { session: { user: { email: 'admin@fuelsense.co.ke' } } } }),
    onAuthStateChange:   (cb) => { cb('SIGNED_IN', { user: { email: 'admin@fuelsense.co.ke' } }); return { data: { subscription: { unsubscribe: () => {} } } }; },
    signOut:             () => Promise.resolve(),
  },
  ...api,
};