'use client';

import { useState, useEffect } from 'react';
import type { AppMode, SystemStatus } from '@/types';
import { api } from '@/services/api';

interface TopBarProps {
  mode: AppMode;
  onModeChange: (mode: AppMode) => void;
}

export default function TopBar({ mode, onModeChange }: TopBarProps) {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [time, setTime] = useState(new Date());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    api.status().then(setStatus).catch(console.error);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="app-topbar">
      <div className="topbar-status">
        <span className="status-dot" />
        <span style={{ color: 'var(--accent-green)' }}>SYSTEM OPERATIONAL</span>
      </div>

      <div className="topbar-divider" />

      <span className="topbar-region">
        {status?.region || 'PUNE'} REGION
      </span>

      <div className="topbar-divider" />

      <span className="topbar-badge">DEMO DATA</span>

      {status && (
        <>
          <div className="topbar-divider" />
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
            {status.active_incidents} active · {status.infrastructure_assets} assets
          </span>
        </>
      )}

      <div className="topbar-divider" />

      <div className="mode-toggle">
        <button
          className={mode === 'operator' ? 'active' : ''}
          onClick={() => onModeChange('operator')}
        >
          Operator
        </button>
        <button
          className={mode === 'demo' ? 'active' : ''}
          onClick={() => onModeChange('demo')}
        >
          Demo
        </button>
      </div>

      <span className="topbar-time">
        {mounted ? (
          <>
            {time.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
            {' '}
            {time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
          </>
        ) : (
          <span style={{ opacity: 0 }}>00 Jan 0000 00:00:00</span>
        )}
      </span>
    </header>
  );
}
