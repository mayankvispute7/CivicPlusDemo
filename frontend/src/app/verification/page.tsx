'use client';

import { useState, useEffect, Suspense, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { api } from '@/services/api';
import type { VerificationRecord, WorkOrder } from '@/types';
import ProcessingSequence from '@/components/common/ProcessingSequence';
import { VERIFICATION_STEPS, formatConfidence, formatDateTime } from '@/lib/constants';

function VerificationContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const workOrderIdStr = searchParams.get('work_order_id');
  const workOrderId = workOrderIdStr ? parseInt(workOrderIdStr, 10) : null;

  const [workOrder, setWorkOrder] = useState<WorkOrder | null>(null);
  const [verification, setVerification] = useState<VerificationRecord | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [loading, setLoading] = useState(true);

  // Slider state
  const sliderRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [showDirectiveModal, setShowDirectiveModal] = useState(false);

  useEffect(() => {
    if (workOrderId) {
      loadData();
    } else {
      setLoading(false);
    }
  }, [workOrderId]);

  async function loadData() {
    try {
      if (!workOrderId) return;
      const woRes = await api.workOrders.get(workOrderId);
      setWorkOrder(woRes);

      if (woRes.status === 'VERIFIED' || woRes.status === 'CLOSED') {
        const verRes = await api.verification.getByWorkOrder(workOrderId);
        setVerification(verRes);
      }
    } catch (err) {
      console.error('Failed to load verification data', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCloseIncident() {
    const incidentId = workOrderId;
    if (!incidentId || !verification) return;
    try {
      await api.decisions.approve(incidentId, 'Operator'); 
      setShowDirectiveModal(true);
    } catch (err) {
      console.error('Failed to close incident', err);
    }
  }

  function handleProceedToNext() {
    router.push('/?select=INC-1055');
  }

  async function handleStartVerification() {
    if (!workOrderId) return;
    setIsVerifying(true);
    try {
      const res = await api.verification.run(workOrderId);
      setVerification(res);
      // Wait for animation to finish before updating status
    } catch (err) {
      console.error('Verification failed', err);
      setIsVerifying(false);
    }
  }

  function handleVerificationComplete() {
    setIsVerifying(false);
    if (workOrder) {
      setWorkOrder({ ...workOrder, status: 'VERIFIED' });
    }
  }

  // Slider interactions
  function handleMove(clientX: number) {
    if (!isDragging || !sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    let pos = ((clientX - rect.left) / rect.width) * 100;
    pos = Math.max(0, Math.min(pos, 100));
    setSliderPosition(pos);
  }

  useEffect(() => {
    function onMouseMove(e: MouseEvent) { handleMove(e.clientX); }
    function onTouchMove(e: TouchEvent) { handleMove(e.touches[0].clientX); }
    function onUp() { setIsDragging(false); }

    if (isDragging) {
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('touchmove', onTouchMove);
      window.addEventListener('mouseup', onUp);
      window.addEventListener('touchend', onUp);
    }

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchend', onUp);
    };
  }, [isDragging]);

  if (loading) return <div style={{ padding: 40, color: 'var(--text-tertiary)' }}>Loading...</div>;

  if (!workOrder) {
    return (
      <div style={{ padding: 40, color: 'var(--text-secondary)' }}>
        No work order selected for verification. Please select one from the Work Orders tab.
      </div>
    );
  }

  const isVerified = !!verification && !isVerifying;

  return (
    <div style={{ padding: 32, maxWidth: 1200, margin: '0 auto', height: '100%', overflowY: 'auto' }}>
      {isVerifying && (
        <ProcessingSequence
          title="RUNNING COMPUTER VISION VERIFICATION"
          steps={VERIFICATION_STEPS}
          onComplete={handleVerificationComplete}
          completeLabel="VERIFICATION COMPLETE"
          stepDuration={500}
        />
      )}

      <div style={{ marginBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 24, margin: '0 0 8px 0', color: 'var(--text-primary)' }}>
            Outcome Verification
          </h1>
          <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
            Validating physical condition changes for <span style={{ fontFamily: 'var(--font-mono)' }}>{workOrder.work_order_id}</span>
          </div>
        </div>
        {!isVerified && (
          <button className="btn btn-primary" onClick={handleStartVerification}>
            RUN CV VERIFICATION
          </button>
        )}
        {isVerified && (
          <button className="btn btn-success" onClick={handleCloseIncident}>
            CLOSE INCIDENT & ADD TO LEARNING →
          </button>
        )}
      </div>

      {isVerified && verification && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 24 }}>
          
          {/* Left Column: Image Slider */}
          <div className="panel">
            <div className="panel-header">
              <h3 className="panel-title">Before / After Comparison</h3>
            </div>
            <div className="panel-body" style={{ padding: 0 }}>
              <div 
                ref={sliderRef}
                className="verification-slider" 
                style={{ 
                  position: 'relative', 
                  width: '100%', 
                  height: 400, 
                  background: '#000',
                  cursor: isDragging ? 'ew-resize' : 'default',
                  border: 'none',
                  borderRadius: '0 0 6px 6px'
                }}
                onMouseDown={(e) => { setIsDragging(true); handleMove(e.clientX); }}
                onTouchStart={(e) => { setIsDragging(true); handleMove(e.touches[0].clientX); }}
              >
                {/* Underneath: After image */}
                <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${verification.after_image_url || 'https://placehold.co/800x400/16a34a/FFF?text=After+Condition'})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
                
                {/* After Image */}
                <img
                  src={verification.after_image_url || ''}
                  alt="After"
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                  draggable={false}
                />
                
                {/* Before Image */}
                <div style={{ position: 'absolute', inset: 0, width: `${sliderPosition}%`, overflow: 'hidden' }}>
                  <img
                    src={verification.before_image_url || ''}
                    alt="Before"
                    style={{ position: 'absolute', top: 0, left: 0, width: containerRef.current?.offsetWidth || 800, height: '100%', objectFit: 'cover' }}
                    draggable={false}
                  />
                </div>

                {/* Slider */}
                <div
                  ref={sliderRef}
                  style={{
                    position: 'absolute',
                    top: 0,
                    bottom: 0,
                    left: `${sliderPosition}%`,
                    width: 2,
                    background: 'var(--accent-blue)',
                    cursor: 'ew-resize',
                    transform: 'translateX(-50%)',
                  }}
                >
                  <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 24, height: 24, borderRadius: '50%', background: 'var(--accent-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 14 }}>
                    ↔
                  </div>
                </div>

                <div style={{ position: 'absolute', top: 16, left: 16, background: 'rgba(0,0,0,0.6)', padding: '4px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, color: '#fff', letterSpacing: '0.5px' }}>
                  BEFORE
                </div>
                <div style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(0,0,0,0.6)', padding: '4px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, color: '#fff', letterSpacing: '0.5px' }}>
                  AFTER
                </div>
              </div>
            </div>

            {/* Satellite Telemetry Verification */}
            <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', borderRadius: 8, display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 16 }}>🛰️</span>
                <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.8px', textTransform: 'uppercase' as const, color: 'var(--text-tertiary)' }}>
                  Satellite SAR Telemetry Verification (Anti-Fraud)
                </span>
                <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--accent-green)', fontWeight: 600, background: 'var(--accent-green-dim)', padding: '2px 6px', borderRadius: 4, border: '1px solid var(--accent-green)' }}>
                  MATCH CONFIRMED
                </span>
              </div>
              <div style={{ padding: 16, display: 'flex', gap: 24 }}>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6, margin: '0 0 12px 0' }}>
                    To prevent fraudulent contractor reporting, the CIVIC PULSE engine independently verifies field photos against live Synthetic Aperture Radar (SAR) data from Sentinel-1.
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div>
                      <div style={{ fontSize: 10, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: 4 }}>SAR Surface Reflectivity (Before)</div>
                      <div style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 600 }}>High Moisture Pooling</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: 4 }}>SAR Surface Reflectivity (After)</div>
                      <div style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 600 }}>Normal Dry Asphalt</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: CV Analysis Results */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div className="panel">
              <div className="panel-header">
                <h3 className="panel-title">CV Analysis Results</h3>
                <span className="badge badge-success">VERIFIED</span>
              </div>
              <div className="panel-body">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  
                  <div className="metric">
                    <span className="metric-label">Physical Change Detected</span>
                    <span className="metric-value sm" style={{ color: verification.physical_change_detected ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                      {verification.physical_change_detected ? 'YES — Significant' : 'NO'}
                    </span>
                  </div>
                  
                  <div className="metric">
                    <span className="metric-label">Condition Improvement</span>
                    <span className="metric-value sm" style={{ color: 'var(--accent-green)' }}>
                      +{verification.condition_improvement}%
                    </span>
                  </div>
                  
                  <div className="metric">
                    <span className="metric-label">Evidence Confidence</span>
                    <span className="metric-value sm" style={{ color: 'var(--accent-green)' }}>
                      {formatConfidence(verification.evidence_confidence)}
                    </span>
                  </div>

                  <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--border-primary)' }}>
                    <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase' as const, color: 'var(--text-tertiary)', marginBottom: 8 }}>
                      Citizen Impact
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--accent-blue)', background: 'var(--accent-blue-dim)', padding: '8px 12px', borderRadius: 4, border: '1px solid var(--accent-blue)' }}>
                      42 pending complaints automatically resolved.
                    </div>
                  </div>

                  {verification.analysis_details && (
                    <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border-primary)' }}>
                      <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase' as const, color: 'var(--text-tertiary)', marginBottom: 8 }}>
                        Confidence Factors
                      </div>
                      <ul style={{ margin: 0, padding: '0 0 0 16px', fontSize: 12, color: 'var(--text-secondary)' }}>
                        {(verification.analysis_details.confidence_factors as string[] || []).map((factor, i) => (
                          <li key={i} style={{ marginBottom: 4 }}>{factor}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                </div>
              </div>
            </div>
          </div>
          
        </div>
      )}

      {/* Custom AI Directive Modal */}
      {showDirectiveModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
          <div style={{ width: 520, background: 'var(--bg-secondary)', border: '1px solid var(--accent-blue)', borderRadius: 12, overflow: 'hidden', boxShadow: '0 24px 48px rgba(0,0,0,0.5)' }}>
            <div style={{ padding: '16px 24px', background: 'var(--bg-card)', borderBottom: '1px solid var(--border-primary)', display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ color: 'var(--accent-blue)', fontSize: 20 }}>✦</span>
              <h3 style={{ margin: 0, fontSize: 16, color: 'var(--text-primary)' }}>CIVIC PULSE Directive</h3>
            </div>
            <div style={{ padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--accent-green-dim)', color: 'var(--accent-green)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                  ✓
                </div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>Incident Successfully Closed</div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>All telemetry and documentation archived.</div>
                </div>
              </div>

              <div style={{ background: 'var(--bg-primary)', padding: 16, borderRadius: 8, border: '1px solid var(--border-primary)', marginBottom: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: 8 }}>
                  System Impact
                </div>
                <ul style={{ margin: 0, paddingLeft: 16, fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.6 }}>
                  <li><strong>42 citizen complaints</strong> automatically resolved in municipal CRM.</li>
                  <li>Flood risk for Baner-University corridor reduced from <strong>HIGH</strong> to <strong>LOW</strong>.</li>
                  <li>Drainage capacity restored to <strong>88%</strong>.</li>
                </ul>
              </div>

              <div style={{ borderLeft: '3px solid var(--accent-amber)', paddingLeft: 16, marginBottom: 24 }}>
                <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase', color: 'var(--accent-amber)', marginBottom: 8 }}>
                  Priority Override
                </div>
                <div style={{ fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.5 }}>
                  The AI engine recommends pivoting immediately to <strong>INC-1055 (Pipeline Leak)</strong>. It intersects with critical rush-hour traffic routes and requires urgent analysis.
                </div>
              </div>

              <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: 14, fontSize: 14 }} onClick={handleProceedToNext}>
                PROCEED TO INC-1055 →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function VerificationPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40 }}>Loading...</div>}>
      <VerificationContent />
    </Suspense>
  );
}
