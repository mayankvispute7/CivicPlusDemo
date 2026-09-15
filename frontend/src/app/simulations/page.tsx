'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { api } from '@/services/api';
import type { Simulation, Incident, ScenarioResult, Intervention } from '@/types';
import ProcessingSequence from '@/components/common/ProcessingSequence';
import { SIMULATION_STEPS, formatINR, SEVERITY_COLORS } from '@/lib/constants';

function SimulationsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const incidentIdStr = searchParams.get('incident_id');
  const incidentId = incidentIdStr ? parseInt(incidentIdStr, 10) : null;

  const [incident, setIncident] = useState<Incident | null>(null);
  const [simulation, setSimulation] = useState<Simulation | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [showRoadmap, setShowRoadmap] = useState(false);
  const [isGeneratingRoadmap, setIsGeneratingRoadmap] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (incidentId) {
      loadData();
    } else {
      setLoading(false); // No incident selected
    }
  }, [incidentId]);

  async function loadData() {
    try {
      if (!incidentId) return;
      const incRes = await api.incidents.get(incidentId);
      setIncident(incRes);

      if (incRes.status === 'SIMULATED' || incRes.status === 'RECOMMENDED' || incRes.status === 'APPROVED' || incRes.status === 'IN_PROGRESS' || incRes.status === 'VERIFIED' || incRes.status === 'CLOSED') {
        try {
          const simRes = await api.simulations.getByIncident(incidentId);
          setSimulation(simRes);
        } catch (simErr) {
          console.warn('Incident status suggests simulation exists, but none found. Resetting state.');
          setIncident({ ...incRes, status: 'DETECTED' });
        }
      }
    } catch (err) {
      console.error('Failed to load simulation data', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleStartSimulation() {
    if (!incidentId) return;
    setIsSimulating(true);
    try {
      const res = await api.simulations.run(incidentId);
      setSimulation(res);
      // Wait for animation to finish before updating status
    } catch (err) {
      console.error('Simulation failed', err);
      setIsSimulating(false);
    }
  }

  function handleSimulationComplete() {
    setIsSimulating(false);
    if (incident) {
      setIncident({ ...incident, status: 'SIMULATED' });
    }
  }

  function handleGenerateRoadmap() {
    setIsGeneratingRoadmap(true);
    // Simulate AI thinking time
    setTimeout(() => {
      setIsGeneratingRoadmap(false);
      setShowRoadmap(true);
    }, 1500);
  }

  async function handleApprove(scenario: ScenarioResult) {
    if (!incidentId || !simulation) return;
    setIsApproving(true);
    try {
      let intervention;
      try {
        intervention = await api.decisions.getByIncident(incidentId);
      } catch (e) {
        // If it doesn't exist yet, we generate the recommendation on the fly
        intervention = await api.decisions.recommend(incidentId);
      }
      
      await api.decisions.approve(intervention.id, 'Operator');
      
      // Then navigate to work orders
      router.push(`/work-orders?incident_id=${incidentId}`);
    } catch (err) {
      console.error('Approval failed', err);
      setIsApproving(false);
    }
  }

  if (loading) return <div style={{ padding: 40, color: 'var(--text-tertiary)' }}>Loading...</div>;

  if (!incident) {
    return (
      <div style={{ padding: 40, color: 'var(--text-secondary)' }}>
        No incident selected for simulation. Please select an incident from the Command Center.
      </div>
    );
  }

  const isSimulated = !!simulation && !isSimulating;

  return (
    <div style={{ padding: 32, maxWidth: 1200, margin: '0 auto', height: '100%', overflowY: 'auto' }}>
      {isSimulating && (
        <ProcessingSequence
          title="RUNNING DIGITAL TWIN SIMULATION"
          steps={SIMULATION_STEPS}
          onComplete={handleSimulationComplete}
          completeLabel="SIMULATION COMPLETE"
          stepDuration={600}
        />
      )}

      <div style={{ marginBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 24, margin: '0 0 8px 0', color: 'var(--text-primary)' }}>
            Simulation Engine
          </h1>
          <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
            Target: <span style={{ fontFamily: 'var(--font-mono)' }}>{incident.incident_id}</span> — {incident.title}
          </div>
        </div>
        {!isSimulated && (
          <button className="btn btn-primary" style={{ background: 'var(--accent-purple)', borderColor: 'var(--accent-purple)' }} onClick={handleStartSimulation}>
            START SIMULATION ⚡
          </button>
        )}
        {isSimulated && (
          <button className="btn btn-outline" style={{ color: 'var(--text-secondary)' }} onClick={handleStartSimulation}>
            ↻ RE-SIMULATE (TWEAK PARAMETERS)
          </button>
        )}
      </div>

      {isSimulated && simulation && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          
          {/* Scenarios Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
            {simulation.scenarios.map((scenario) => (
              <div key={scenario.id} className={`scenario-card ${scenario.is_recommended ? 'recommended' : ''}`}>
                <div className="sc-header">
                  <div className="sc-name">{scenario.scenario_label || scenario.scenario_name}</div>
                  {scenario.is_recommended && (
                    <div className="badge badge-success" style={{ background: 'var(--accent-blue)', color: 'white' }}>
                      RECOMMENDED
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div className="metric">
                    <span className="metric-label">Impact (Reduction)</span>
                    <span className="metric-value sm" style={{ color: scenario.expected_recurrence_reduction > 50 ? 'var(--accent-green)' : 'var(--text-primary)' }}>
                      {scenario.expected_recurrence_reduction}%
                    </span>
                  </div>
                  
                  <div className="metric">
                    <span className="metric-label">Estimated Cost</span>
                    <span className="metric-value sm">
                      {formatINR(scenario.estimated_cost)}
                    </span>
                  </div>

                  <div className="metric">
                    <span className="metric-label">Risk Level</span>
                    <span className="metric-value sm" style={{ 
                      color: scenario.risk_level === 'LOW' ? 'var(--accent-green)' : 
                             scenario.risk_level === 'MEDIUM' ? 'var(--accent-amber)' : 'var(--severity-critical)' 
                    }}>
                      {scenario.risk_level}
                    </span>
                  </div>
                  
                  <div className="metric">
                    <span className="metric-label">Execution Time</span>
                    <span className="metric-value sm">
                      {scenario.execution_days} Days
                    </span>
                  </div>
                </div>

                {scenario.is_recommended && (
                  <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--border-primary)', display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {!showRoadmap ? (
                      <button
                        className="btn btn-primary"
                        style={{ width: '100%', justifyContent: 'center' }}
                        onClick={handleGenerateRoadmap}
                        disabled={isGeneratingRoadmap}
                      >
                        {isGeneratingRoadmap ? 'GENERATING...' : 'GENERATE EXECUTION ROADMAP'}
                      </button>
                    ) : (
                      <button
                        className="btn btn-success"
                        style={{ width: '100%', justifyContent: 'center', background: 'var(--accent-green)' }}
                        onClick={() => handleApprove(scenario)}
                        disabled={isApproving}
                      >
                        {isApproving ? 'DISPATCHING...' : 'APPROVE ROADMAP & DISPATCH'}
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', borderRadius: 8, padding: '20px 24px' }}>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: 12 }}>
              AI Recommendation Rationale
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
              {simulation.ai_recommendation_reason || 'The AI engine recommends the optimal balance of immediate impact and cost-efficiency. Doing nothing carries an unacceptable risk of compounding damage.'}
            </p>
          </div>

          {showRoadmap && (
            <div style={{ marginTop: 24, background: 'var(--bg-secondary)', border: '1px solid var(--accent-blue)', borderRadius: 8, padding: '20px 24px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, width: 4, bottom: 0, background: 'var(--accent-blue)' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <span style={{ fontSize: 20, color: 'var(--accent-blue)' }}>✦</span>
                <h3 style={{ margin: 0, fontSize: 16, color: 'var(--text-primary)' }}>AI-Generated Execution Roadmap</h3>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: 8 }}>Shift Timing</div>
                  <div style={{ fontSize: 14, color: 'var(--accent-amber)', fontWeight: 500 }}>Night Shift (23:00 - 05:00)</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>Recommended due to severe rush-hour traffic impact on {incident?.location_name || incident?.title}.</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: 8 }}>Resource Allocation</div>
                  <ul style={{ margin: 0, paddingLeft: 16, fontSize: 13, color: 'var(--text-primary)' }}>
                    <li>1x High-Pressure Jetter Truck</li>
                    <li>4x Drainage Technicians (Team B)</li>
                    <li>Traffic Police Escort (Requested)</li>
                  </ul>
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--border-primary)', paddingTop: 20 }}>
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: 12 }}>Day-by-Day Schedule</div>
                
                <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
                  <div style={{ width: 60, fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Day 1</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, color: 'var(--text-primary)', marginBottom: 2 }}>Site Securing & De-watering</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Setup traffic barricades, pump out standing water to access drain grate.</div>
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: 16 }}>
                  <div style={{ width: 60, fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Day 2</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, color: 'var(--text-primary)', marginBottom: 2 }}>High-Pressure De-silting</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Remove sediment blockages, clear inlet channels, restore 85%+ capacity.</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function SimulationsPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40 }}>Loading...</div>}>
      <SimulationsContent />
    </Suspense>
  );
}
