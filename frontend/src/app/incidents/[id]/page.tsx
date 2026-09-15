'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/services/api';
import type { Incident, EvidenceItem, ContributingFactorsResponse } from '@/types';
import ProcessingSequence from '@/components/common/ProcessingSequence';
import {
  ANALYSIS_STEPS,
  SEVERITY_COLORS,
  SEVERITY_BG,
  formatConfidence,
  timeAgo,
  formatDateTime,
  EVIDENCE_ICONS,
} from '@/lib/constants';

export default function IncidentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const idStr = params.id as string;
  const id = parseInt(idStr, 10);

  const [incident, setIncident] = useState<Incident | null>(null);
  const [evidence, setEvidence] = useState<EvidenceItem[]>([]);
  const [factors, setFactors] = useState<ContributingFactorsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    if (!isNaN(id)) {
      loadData();
    }
  }, [id]);

  async function loadData() {
    try {
      const [incRes, evRes, facRes] = await Promise.all([
        api.incidents.get(id),
        api.incidents.evidence(id),
        api.incidents.factors(id),
      ]);
      setIncident(incRes);
      setEvidence(evRes.evidence);
      setFactors(facRes);
      
      // If incident status is DETECTED and it is the demo incident, simulate clicking analyze
      // Wait, let the user click it for the demo flow.
    } catch (err) {
      console.error('Failed to load incident detail:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleAnalyzeStart() {
    setIsAnalyzing(true);
    try {
      await api.incidents.analyze(id);
      // Wait for animation to complete before updating UI
    } catch (err) {
      console.error('Analysis failed', err);
    }
  }

  function handleAnalyzeComplete() {
    setIsAnalyzing(false);
    if (incident) {
      setIncident({ ...incident, status: 'ANALYZED' });
    }
  }

  function handleSimulate() {
    router.push(`/simulations?incident_id=${id}`);
  }

  if (loading) {
    return <div style={{ padding: 40, color: 'var(--text-tertiary)' }}>Loading...</div>;
  }

  if (!incident) {
    return <div style={{ padding: 40, color: 'var(--accent-red)' }}>Incident not found</div>;
  }

  const isAnalyzed = incident.status !== 'DETECTED' && incident.status !== 'ANALYZING';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {isAnalyzing && (
        <ProcessingSequence
          title="ANALYZING INCIDENT"
          steps={ANALYSIS_STEPS}
          onComplete={handleAnalyzeComplete}
          completeLabel="ANALYSIS COMPLETE"
          stepDuration={500}
        />
      )}

      {/* Header */}
      <div
        style={{
          padding: '24px 32px',
          borderBottom: '1px solid var(--border-primary)',
          background: `linear-gradient(135deg, ${SEVERITY_BG[incident.severity] || 'transparent'}, var(--bg-primary))`,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <span className={`badge badge-${incident.severity.toLowerCase()}`}>
                {incident.severity}
              </span>
              <span style={{ fontSize: 13, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                {incident.incident_id}
              </span>
              <span className={`badge badge-${isAnalyzed ? 'success' : 'warning'}`}>
                {incident.status}
              </span>
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 8px 0', color: 'var(--text-primary)' }}>
              {incident.title}
            </h1>
            <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
              {incident.location_name} · Reported {formatDateTime(incident.reported_at)} ({timeAgo(incident.reported_at)})
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: 12 }}>
            {!isAnalyzed ? (
              <button className="btn btn-primary" onClick={handleAnalyzeStart} style={{ padding: '12px 24px', fontSize: 14 }}>
                ANALYZE INCIDENT
              </button>
            ) : (
              <button className="btn btn-primary" onClick={handleSimulate} style={{ padding: '12px 24px', fontSize: 14, background: 'var(--accent-purple)', borderColor: 'var(--accent-purple)' }}>
                RUN SIMULATIONS →
              </button>
            )}
          </div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 32 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24, marginBottom: 32 }}>
            {/* Left Column: Description & Evidence */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <div className="panel">
                <div className="panel-header">
                  <h3 className="panel-title">Situation Description</h3>
                </div>
                <div className="panel-body">
                  <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    {incident.description || 'No description provided.'}
                  </p>
                </div>
              </div>

              {isAnalyzed && (
                <div className="panel">
                  <div className="panel-header">
                    <h3 className="panel-title">Supporting Evidence</h3>
                    <div className="badge badge-success" style={{ gap: 4 }}>
                      <span>Confidence: {formatConfidence(incident.evidence_confidence)}</span>
                    </div>
                  </div>
                  <div className="panel-body" style={{ background: 'var(--bg-secondary)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                      {evidence.map((item) => (
                        <div key={item.id} className="evidence-card" style={{ background: 'var(--bg-card)' }}>
                          <div className="ev-header">
                            <span className="ev-icon">{EVIDENCE_ICONS[item.evidence_type] || '📄'}</span>
                            <span className="ev-type">{item.evidence_type.replace('_', ' ')}</span>
                          </div>
                          <div className="ev-title">{item.title}</div>
                          <div className="ev-desc">{item.description}</div>
                          <div className="ev-meta">
                            <span>{item.source}</span>
                            <span className="ev-confidence">{formatConfidence(item.confidence)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Factors & Meta */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              
              <div className="panel">
                <div className="panel-header">
                  <h3 className="panel-title">Incident Metrics</h3>
                </div>
                <div className="panel-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div className="metric">
                    <span className="metric-label">Severity</span>
                    <span className="metric-value sm" style={{ color: SEVERITY_COLORS[incident.severity] }}>
                      {incident.severity}
                    </span>
                  </div>
                  <div className="metric">
                    <span className="metric-label">Recurrence</span>
                    <span className="metric-value sm">
                      {incident.recurrence_count}
                      <span className="metric-unit"> / 30d</span>
                    </span>
                  </div>
                  <div className="metric">
                    <span className="metric-label">Rainfall Exposure</span>
                    <span className="metric-value sm">
                      {incident.rainfall_mm || '—'}
                      <span className="metric-unit"> mm/24h</span>
                    </span>
                  </div>
                  <div className="metric">
                    <span className="metric-label">Nearby Asset</span>
                    <span className="metric-value sm" style={{ fontFamily: 'var(--font-mono)' }}>
                      {incident.nearby_asset_id || '—'}
                    </span>
                  </div>
                </div>
              </div>

              {isAnalyzed && factors && (
                <div className="panel">
                  <div className="panel-header" style={{ background: 'var(--accent-blue-dim)' }}>
                    <h3 className="panel-title" style={{ color: 'var(--accent-blue)' }}>Probable Contributing Factors</h3>
                  </div>
                  <div className="panel-body">
                    <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 20, lineHeight: 1.5 }}>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Evidence suggests:</span> {factors.summary}
                    </p>
                    
                    <div className="factor-graph">
                      {factors.factors.map((factor, idx) => (
                        <div key={factor.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                          <div className="factor-node" style={{ width: '100%' }}>
                            <div className="fn-label">{factor.label}</div>
                            <div className="fn-detail">{factor.description}</div>
                            {factor.confidence && (
                              <div style={{ marginTop: 8, fontSize: 10, color: 'var(--accent-green)', fontWeight: 600 }}>
                                Confidence: {factor.confidence}%
                              </div>
                            )}
                          </div>
                          {idx < factors.factors.length - 1 && (
                            <div className="factor-arrow" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
