'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [userId, setUserId] = useState('');
  const [clearanceCode, setClearanceCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, clearanceCode }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error?.message ?? 'Login failed');
        return;
      }
      router.push('/dashboard');
    } catch {
      setError('Network error — please try again');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-white mb-2">Imperial Codex</h1>
        <p className="text-gray-400 text-sm mb-8">Dalizebo Holdings — Clearance Required</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-300 mb-1" htmlFor="userId">User ID</label>
            <input
              id="userId"
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              required
              className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-gray-500"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1" htmlFor="clearanceCode">Clearance Code</label>
            <input
              id="clearanceCode"
              type="password"
              value={clearanceCode}
              onChange={(e) => setClearanceCode(e.target.value)}
              required
              className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-gray-500"
            />
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-white text-gray-950 font-semibold py-2 rounded text-sm hover:bg-gray-200 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Authenticating…' : 'Enter Codex'}
          </button>
        </form>
      </div>
    </main>
  );
}
