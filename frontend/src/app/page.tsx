'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/services/api';
import type { Incident, GeoJSONCollection } from '@/types';
import { SEVERITY_COLORS, SEVERITY_BG, formatConfidence, timeAgo, formatINR } from '@/lib/constants';

import { Suspense } from 'react';

// Dynamic import for Leaflet (SSR incompatible)
const CommandMap = dynamic(() => import('@/components/map/CommandMap'), { ssr: false });

function OverviewContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const res = await api.incidents.list();
      setIncidents(res.incidents);
      
      const selectId = searchParams.get('select');
      if (selectId) {
        const target = res.incidents.find((i) => i.incident_id === selectId);
        if (target) setSelectedIncident(target);
      } else {
        // Auto-select the primary incident
        const primary = res.incidents.find((i) => i.incident_id === 'INC-1042');
        if (primary) setSelectedIncident(primary);
      }
    } catch (err) {
      console.error('Failed to load incidents:', err);
    } finally {
      setLoading(false);
    }
  }

  function handleIncidentSelect(incident: Incident) {
    setSelectedIncident(incident);
  }

  function handleAnalyze() {
    if (selectedIncident) {
      router.push(`/incidents/${selectedIncident.id}`);
    }
  }

  // Aggregate stats
  const activeIncidents = incidents.filter(
    (i) => ['DETECTED', 'ANALYZING', 'ANALYZED'].includes(i.status)
  ).length;
  const criticalCount = incidents.filter((i) => i.severity === 'CRITICAL').length;
  const highCount = incidents.filter((i) => i.severity === 'HIGH').length;

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      {/* Left Column: Recent Incidents List */}
      <div style={{ width: 320, background: 'var(--bg-secondary)', borderRight: '1px solid var(--border-primary)', overflowY: 'auto', flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid var(--border-primary)', background: 'var(--bg-card)' }}>
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.8px', textTransform: 'uppercase' as const, color: 'var(--text-tertiary)' }}>
            Incident Feed
          </div>
        </div>
        <div style={{ padding: 12 }}>
          {incidents.slice(0, 15).map((inc) => (
            <div
              key={inc.id}
              onClick={() => handleIncidentSelect(inc)}
              style={{
                padding: '10px 12px',
                borderRadius: 6,
                cursor: 'pointer',
                marginBottom: 6,
                background: selectedIncident?.id === inc.id ? 'var(--accent-blue-dim)' : 'var(--bg-primary)',
                border: '1px solid',
                borderColor: selectedIncident?.id === inc.id ? 'var(--accent-blue)' : 'var(--border-primary)',
                transition: 'all 0.15s',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>
                  {inc.incident_id}
                </span>
                <span
                  className={`badge badge-${inc.severity.toLowerCase()}`}
                  style={{ fontSize: 9 }}
                >
                  {inc.severity}
                </span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                {inc.location_name}
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: inc.status === 'DETECTED' ? 'var(--accent-amber)' : 'var(--accent-green)', display: 'inline-block' }} />
                {inc.status} · {timeAgo(inc.reported_at)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Center Map Area */}
      <div style={{ flex: 1, position: 'relative' }}>
        <CommandMap
          incidents={incidents}
          selectedIncident={selectedIncident}
          onIncidentSelect={handleIncidentSelect}
        />

        {/* Bottom operational bar */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 40,
            background: 'rgba(15, 17, 23, 0.92)',
            borderTop: '1px solid var(--border-primary)',
            display: 'flex',
            alignItems: 'center',
            padding: '0 16px',
            gap: 24,
            fontSize: 11,
            zIndex: 1000,
            backdropFilter: 'blur(8px)',
          }}
        >
          <span style={{ color: 'var(--text-tertiary)', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase' as const }}>
            Operations
          </span>
          <span style={{ color: 'var(--accent-amber)' }}>
            ⚠ {activeIncidents} active incidents
          </span>
          <span style={{ color: 'var(--severity-critical)' }}>
            {criticalCount} critical
          </span>
          <span style={{ color: 'var(--severity-high)' }}>
            {highCount} high
          </span>
          <span style={{ color: 'var(--text-tertiary)', marginLeft: 'auto' }}>
            {incidents.length} total incidents tracked
          </span>
        </div>
      </div>

      {/* Right Column: Incident Details */}
      {selectedIncident && (
        <div
          style={{
            width: 360,
            background: 'var(--bg-secondary)',
            borderLeft: '1px solid var(--border-primary)',
            overflowY: 'auto',
            flexShrink: 0,
          }}
        >
          <IncidentPanel incident={selectedIncident} onAnalyze={handleAnalyze} />
        </div>
      )}
    </div>
  );
}

// ─── Incident Panel ──────────────────────────────────────────────────────────

function IncidentPanel({ incident, onAnalyze }: { incident: Incident; onAnalyze: () => void }) {
  const severityColor = SEVERITY_COLORS[incident.severity] || '#6b7280';

  return (
    <div style={{ padding: 0 }}>
      {/* Header */}
      <div
        style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-primary)',
          background: `linear-gradient(135deg, ${SEVERITY_BG[incident.severity] || 'transparent'}, transparent)`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <span className={`badge badge-${incident.severity.toLowerCase()}`}>
            {incident.severity}
          </span>
          <span style={{ fontSize: 10, color: 'var(--text-tertiary)', letterSpacing: '0.5px', textTransform: 'uppercase' as const }}>
            ACTIVE INCIDENT
          </span>
        </div>
        <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)', marginBottom: 4 }}>
          {incident.incident_id}
        </div>
        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
          {incident.title}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
          {incident.location_name}
        </div>
      </div>

      {/* Metrics grid */}
      <div style={{ padding: '16px 20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="metric">
          <span className="metric-label">Severity</span>
          <span className="metric-value sm" style={{ color: severityColor }}>{incident.severity}</span>
        </div>
        <div className="metric">
          <span className="metric-label">Recurrence</span>
          <span className="metric-value sm">
            {incident.recurrence_count}
            <span className="metric-unit"> / 30d</span>
          </span>
        </div>
        <div className="metric">
          <span className="metric-label">Rainfall</span>
          <span className="metric-value sm">
            {incident.rainfall_mm || '—'}
            <span className="metric-unit"> mm/24h</span>
          </span>
        </div>
        <div className="metric">
          <span className="metric-label">Affected Roads</span>
          <span className="metric-value sm">{incident.affected_roads}</span>
        </div>
        <div className="metric">
          <span className="metric-label">Nearby Drain</span>
          <span className="metric-value sm" style={{ fontFamily: 'var(--font-mono)' }}>
            {incident.nearby_asset_id || '—'}
          </span>
        </div>
        <div className="metric">
          <span className="metric-label">Evidence Confidence</span>
          <span className="metric-value sm" style={{ color: 'var(--accent-green)' }}>
            {formatConfidence(incident.evidence_confidence)}
          </span>
        </div>
      </div>

      {/* Description */}
      {incident.description && (
        <div style={{ padding: '0 20px 16px' }}>
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase' as const, color: 'var(--text-tertiary)', marginBottom: 6 }}>
            Description
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
            {incident.description}
          </p>
        </div>
      )}

      {/* Status */}
      <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border-primary)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className={`badge badge-${incident.status === 'DETECTED' ? 'warning' : 'success'}`}>
            {incident.status}
          </span>
          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
            Reported {timeAgo(incident.reported_at)}
          </span>
        </div>
      </div>

      {/* Action button */}
      <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border-primary)' }}>
        <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={onAnalyze}>
          ANALYZE INCIDENT →
        </button>
      </div>
    </div>
  );
}

export default function OverviewPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40 }}>Loading Command Center...</div>}>
      <OverviewContent />
    </Suspense>
  );
}
