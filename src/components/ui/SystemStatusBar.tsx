'use client';

/**
 * SystemStatusBar — displays Kernel version, health badge, and active loop count.
 * Polls /api/status every 60 seconds.
 */

import { useState, useEffect } from 'react';

interface SystemStatus {
  version: string;
  status: 'active' | 'halted' | 'vault-error';
  activeLoops?: number;
}

export function SystemStatusBar() {
  const [status, setStatus] = useState<SystemStatus | null>(null);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch('/api/status');
        if (res.ok) {
          const data = await res.json();
          setStatus(data);
        }
      } catch {
        // Silently fail — status bar is non-critical
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 60_000);
    return () => clearInterval(interval);
  }, []);

  if (!status) return null;

  const statusColor =
    status.status === 'active'
      ? 'bg-green-500'
      : status.status === 'halted'
      ? 'bg-red-500'
      : 'bg-yellow-500';

  return (
    <div className="w-full bg-gray-900 border-b border-gray-700 px-4 py-2 flex items-center gap-4 text-sm">
      <span className="text-gray-400">Kernel</span>
      <span className="text-white font-mono">{status.version}</span>
      <span className={`inline-block w-2 h-2 rounded-full ${statusColor}`} aria-label={`Status: ${status.status}`} />
      <span className="text-gray-300 capitalize">{status.status}</span>
      {status.activeLoops !== undefined && (
        <span className="text-gray-400 ml-auto">{status.activeLoops} active loops</span>
      )}
    </div>
  );
}
