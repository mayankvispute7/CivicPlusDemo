'use client';

import { useState, useEffect } from 'react';
import { api } from '@/services/api';
import type { InfrastructureAsset } from '@/types';
import { CONDITION_COLORS } from '@/lib/constants';

export default function InfrastructurePage() {
  const [assets, setAssets] = useState<InfrastructureAsset[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const res = await api.infrastructure.list();
      setAssets(res.assets);
    } catch (err) {
      console.error('Failed to load infrastructure:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div style={{ padding: 40, color: 'var(--text-tertiary)' }}>Loading...</div>;

  return (
    <div style={{ padding: 32, maxWidth: 1200, margin: '0 auto', height: '100%', overflowY: 'auto' }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 24, margin: '0 0 8px 0', color: 'var(--text-primary)' }}>
          Infrastructure Assets
        </h1>
        <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
          Monitored urban infrastructure nodes and segments
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
        {assets.map((asset) => (
          <div key={asset.id} className="panel">
            <div className="panel-header" style={{ padding: '12px 16px', background: 'var(--bg-secondary)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{asset.name}</span>
                <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)' }}>{asset.asset_id}</span>
              </div>
            </div>
            <div className="panel-body" style={{ padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <span className="badge" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
                  {asset.asset_type.replace('_', ' ')}
                </span>
                <span className="badge" style={{ color: CONDITION_COLORS[asset.condition] || 'var(--text-primary)', border: `1px solid ${CONDITION_COLORS[asset.condition] || 'transparent'}` }}>
                  {asset.condition.replace('_', ' ')}
                </span>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 16 }}>
                <div className="metric">
                  <span className="metric-label">Capacity</span>
                  <span className="metric-value sm">
                    {asset.capacity_rating ? `${asset.capacity_rating.toFixed(0)}%` : '—'}
                  </span>
                </div>
                <div className="metric">
                  <span className="metric-label">Connected Incidents</span>
                  <span className="metric-value sm">
                    {asset.connected_incidents}
                  </span>
                </div>
                <div className="metric">
                  <span className="metric-label">Maintenance</span>
                  <span className="metric-value sm">
                    {asset.maintenance_days_ago ? `${asset.maintenance_days_ago}d ago` : '—'}
                  </span>
                </div>
                <div className="metric">
                  <span className="metric-label">Location</span>
                  <span className="metric-value sm" style={{ fontSize: 12, fontWeight: 400 }}>
                    {asset.location_name || '—'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
