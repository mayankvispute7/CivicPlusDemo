'use client';

import { useState, useEffect } from 'react';
import { api } from '@/services/api';
import type { InsightsResponse } from '@/types';
import { formatDateTime } from '@/lib/constants';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell 
} from 'recharts';

export default function InsightsPage() {
  const [insights, setInsights] = useState<InsightsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const res = await api.insights.get();
      setInsights(res);
    } catch (err) {
      console.error('Failed to load insights:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div style={{ padding: 40, color: 'var(--text-tertiary)' }}>Loading...</div>;
  if (!insights) return <div style={{ padding: 40, color: 'var(--accent-red)' }}>Failed to load insights</div>;

  // Chart data: Institutional Memory (Asset Intervention Effectiveness)
  const chartData = insights.institutional_memory
    .slice(0, 10)
    .map(mem => ({
      name: mem.asset_id,
      reduction: mem.avg_recurrence_reduction,
      successes: mem.successful_interventions,
    }))
    .sort((a, b) => b.reduction - a.reduction);

  return (
    <div style={{ padding: 32, maxWidth: 1200, margin: '0 auto', height: '100%', overflowY: 'auto' }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 24, margin: '0 0 8px 0', color: 'var(--text-primary)' }}>
          Institutional Memory
        </h1>
        <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
          System-wide learnings and long-term infrastructure health insights
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        <div className="panel" style={{ padding: '16px 20px' }}>
          <div className="metric">
            <span className="metric-label">Total Incidents Tracked</span>
            <span className="metric-value">{insights.system_learning.total_incidents_tracked as number}</span>
          </div>
        </div>
        <div className="panel" style={{ padding: '16px 20px' }}>
          <div className="metric">
            <span className="metric-label">Resolved (Verified/Closed)</span>
            <span className="metric-value">{insights.system_learning.resolved_incidents as number}</span>
          </div>
        </div>
        <div className="panel" style={{ padding: '16px 20px' }}>
          <div className="metric">
            <span className="metric-label">Total Interventions</span>
            <span className="metric-value">{insights.system_learning.total_work_orders as number}</span>
          </div>
        </div>
        <div className="panel" style={{ padding: '16px 20px' }}>
          <div className="metric">
            <span className="metric-label">Avg Effectiveness</span>
            <span className="metric-value" style={{ color: 'var(--accent-green)' }}>
              {Math.round(insights.system_learning.avg_intervention_effectiveness as number)}%
            </span>
          </div>
        </div>
      </div>

      <div className="panel" style={{ marginBottom: 24 }}>
        <div className="panel-header" style={{ background: 'var(--accent-blue-dim)' }}>
          <h3 className="panel-title" style={{ color: 'var(--accent-blue)' }}>Key System Insight</h3>
        </div>
        <div className="panel-body">
          <p style={{ fontSize: 14, color: 'var(--text-primary)', margin: 0, lineHeight: 1.6 }}>
            {insights.system_learning.key_insight as string}
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
        
        {/* Left: Chart */}
        <div className="panel">
          <div className="panel-header">
            <h3 className="panel-title">Asset Intervention Effectiveness (%)</h3>
          </div>
          <div className="panel-body" style={{ height: 360, padding: '20px 20px 0 0' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: 'var(--text-tertiary)' }} tickLine={false} axisLine={false} dy={10} />
                <YAxis tick={{ fill: 'var(--text-tertiary)' }} tickLine={false} axisLine={false} dx={-10} domain={[0, 100]} />
                <RechartsTooltip cursor={{ fill: 'var(--bg-elevated)' }} />
                <Bar dataKey="reduction" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.reduction > 50 ? 'var(--accent-green)' : 'var(--accent-amber)'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: Institutional Memory (Asset Level) */}
        <div className="panel" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="panel-header">
            <h3 className="panel-title">Asset Watchlist</h3>
          </div>
          <div className="panel-body" style={{ flex: 1, padding: 0, overflowY: 'auto', maxHeight: 360 }}>
            {insights.institutional_memory.map(mem => (
              <div key={mem.asset_id} style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-primary)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{mem.asset_name}</span>
                  <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)' }}>{mem.asset_id}</span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 8 }}>
                  {mem.total_interventions} interventions · {mem.successful_interventions} successful
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Recommendation:</span> {mem.future_recommendation}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
