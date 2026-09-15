'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/services/api';
import type { WorkOrder } from '@/types';
import { formatDateTime } from '@/lib/constants';
import { Suspense } from 'react';

function WorkOrdersContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const res = await api.workOrders.list();
      setWorkOrders(res.work_orders);
    } catch (err) {
      console.error('Failed to load work orders:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateStatus(id: number, status: string) {
    try {
      await api.workOrders.updateStatus(id, status);
      loadData();
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  }

  if (loading) return <div style={{ padding: 40, color: 'var(--text-tertiary)' }}>Loading...</div>;

  return (
    <div style={{ padding: 32, maxWidth: 1200, margin: '0 auto', height: '100%', overflowY: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 24, margin: '0 0 8px 0', color: 'var(--text-primary)' }}>
            Work Orders
          </h1>
          <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
            Active interventions and field deployments
          </div>
        </div>
        <button className="btn btn-outline" onClick={() => router.push('/')}>
          ← BACK TO COMMAND MAP (QUEUE MORE)
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {workOrders.map((wo) => {
          const isCompleted = wo.status === 'COMPLETED' || wo.status === 'VERIFIED' || wo.status === 'CLOSED';
          const isActive = wo.status === 'IN_PROGRESS';
          
          return (
            <div key={wo.id} className="panel" style={{ display: 'flex', borderLeft: isActive ? '3px solid var(--accent-blue)' : isCompleted ? '3px solid var(--accent-green)' : '3px solid transparent' }}>
              <div style={{ padding: 20, flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                  <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)' }}>
                    {wo.work_order_id}
                  </span>
                  <span className={`badge badge-${isActive ? 'warning' : isCompleted ? 'success' : 'low'}`}>
                    {wo.status}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 'auto' }}>
                    Created {formatDateTime(wo.created_at)}
                  </span>
                </div>
                
                <h3 style={{ fontSize: 16, margin: '0 0 4px 0', color: 'var(--text-primary)' }}>
                  {wo.intervention_type} at {wo.asset_name}
                </h3>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                  {wo.location_name}
                </div>
                
                <div style={{ marginTop: 16, display: 'flex', gap: 32, fontSize: 12 }}>
                  <div>
                    <span style={{ color: 'var(--text-tertiary)' }}>Assigned Team:</span>
                    <br />
                    <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{wo.assigned_team}</span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-tertiary)' }}>Expected Outcome:</span>
                    <br />
                    <span style={{ color: 'var(--text-primary)' }}>{wo.expected_outcome}</span>
                  </div>
                </div>
              </div>
              
              <div style={{ width: 240, padding: 20, borderLeft: '1px solid var(--border-primary)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                {(!isCompleted && !isActive) && (
                  <button 
                    className="btn btn-primary" 
                    style={{ width: '100%', justifyContent: 'center' }}
                    onClick={() => handleUpdateStatus(wo.id, 'IN_PROGRESS')}
                  >
                    DISPATCH TEAM
                  </button>
                )}
                {wo.status === 'IN_PROGRESS' && (
                  <button 
                    className="btn btn-warning" 
                    style={{ width: '100%', justifyContent: 'center', background: 'var(--accent-amber)', color: '#000', borderColor: 'var(--accent-amber)' }}
                    onClick={() => handleUpdateStatus(wo.id, 'COMPLETED')}
                  >
                    MARK AS COMPLETED (SIMULATE FIELD APP)
                  </button>
                )}
                {wo.status === 'COMPLETED' && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, width: '100%' }}>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)', textAlign: 'center' }}>
                      Pending Evidence Upload...
                    </div>
                    <button 
                      className="btn btn-primary" 
                      style={{ width: '100%', justifyContent: 'center', background: 'var(--accent-purple)', borderColor: 'var(--accent-purple)' }}
                      onClick={() => {
                        setIsUploading(true);
                        setTimeout(() => router.push(`/verification?work_order_id=${wo.id}`), 1500);
                      }}
                      disabled={isUploading}
                    >
                      {isUploading ? 'UPLOADING PHOTOS...' : '📷 UPLOAD BEFORE/AFTER PHOTOS'}
                    </button>
                  </div>
                )}
                {wo.status === 'VERIFIED' && (
                  <button className="btn btn-outline" style={{ width: '100%', justifyContent: 'center' }} onClick={() => router.push(`/verification?work_order_id=${wo.id}`)}>
                    VIEW VERIFICATION
                  </button>
                )}
              </div>
            </div>
          );
        })}
        
        {workOrders.length === 0 && (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-tertiary)' }}>
            No work orders found. Generate one from the Simulation Engine.
          </div>
        )}
      </div>
    </div>
  );
}

export default function WorkOrdersPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40 }}>Loading Work Orders...</div>}>
      <WorkOrdersContent />
    </Suspense>
  );
}
