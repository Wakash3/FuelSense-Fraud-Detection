import React, { useState } from 'react';
import { supabase } from '../supabase';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    async function handleLogin(e) {
        e.preventDefault();
        if (!email.trim() || !password.trim()) {
            setError('Please enter your email and password.');
            return;
        }
        setLoading(true);
        setError('');
        try {
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) setError(error.message);
        } catch (err) {
            setError('Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f0f1a' }}>
            <div style={{ width: '100%', maxWidth: '400px', padding: '0 24px' }}>

                {/* Logo */}
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <div style={{ fontSize: '56px', marginBottom: '12px' }}>⛽</div>
                    <div style={{ color: '#fff', fontSize: '24px', fontWeight: '700' }}>FuelSense</div>
                    <div style={{ color: '#e74c3c', fontSize: '13px', marginTop: '4px', fontWeight: '600', letterSpacing: '2px' }}>ADMIN PORTAL</div>
                </div>

                {/* Card */}
                <div style={{ background: '#1e1e2e', borderRadius: '16px', padding: '32px', boxShadow: '0 20px 60px rgba(0,0,0,0.4)' }}>
                    <div style={{ fontSize: '16px', fontWeight: '600', color: '#fff', marginBottom: '24px' }}>
                        Sign in to continue
                    </div>

                    {error && (
                        <div style={{ background: '#fdecea', border: '1px solid #f5c6cb', color: '#721c24', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px' }}>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleLogin}>
                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: '#888', marginBottom: '6px' }}>
                                Email Address
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="admin@fuelsense.com"
                                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #2a2a3e', background: '#0f0f1a', color: '#fff', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                            />
                        </div>

                        <div style={{ marginBottom: '24px' }}>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: '#888', marginBottom: '6px' }}>
                                Password
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder="••••••••"
                                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #2a2a3e', background: '#0f0f1a', color: '#fff', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            style={{ width: '100%', padding: '12px', background: loading ? '#555' : '#e74c3c', color: '#fff', border: 'none', borderRadius: '8px', cursor: loading ? 'not-allowed' : 'pointer', fontSize: '14px', fontWeight: '600' }}
                        >
                            {loading ? 'Signing in...' : 'Sign In'}
                        </button>
                    </form>

                    <div style={{ marginTop: '16px', fontSize: '12px', color: '#555', textAlign: 'center' }}>
                        Admin access only. Contact your system administrator for access.
                    </div>
                </div>
            </div>
        </div>
    );
}