import { useCallback } from 'react';

const API = process.env.REACT_APP_API_URL || 'http://localhost:3001';

export function useAuditLog(session, userProfile, activeStation) {
  const log = useCallback(async (action, entityType, entityId, oldValue, newValue) => {
    if (!session?.user?.email) return;

    try {
      await fetch(API + '/api/audit-log', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          user_email:  session.user.email,
          user_role:   userProfile?.role || 'unknown',
          action,
          entity_type: entityType,
          entity_id:   entityId || null,
          station_id:  activeStation || null,
          old_value:   oldValue || null,
          new_value:   newValue || null,
        }),
      });
    } catch (err) {
      console.error('Audit log error:', err.message);
    }
  }, [session, userProfile, activeStation]);

  return { log };
}