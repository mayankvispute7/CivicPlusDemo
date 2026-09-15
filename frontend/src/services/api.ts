/**
 * CIVIC PULSE — API Client Service
 * Centralized API communication with the FastAPI backend
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(error.detail || `API error: ${res.status}`);
  }

  return res.json();
}

// ─── System ──────────────────────────────────────────────────────────────────

import type {
  SystemStatus,
  IncidentListResponse,
  Incident,
  EvidenceListResponse,
  ContributingFactorsResponse,
  RainfallTimelineResponse,
  InfrastructureListResponse,
  Simulation,
  Intervention,
  WorkOrderListResponse,
  WorkOrder,
  VerificationRecord,
  InsightsResponse,
  Outcome,
  GeoJSONCollection,
} from '@/types';

export const api = {
  // System
  status: () => fetchAPI<SystemStatus>('/api/status'),
  health: () => fetchAPI<{ status: string }>('/api/health'),

  // Incidents
  incidents: {
    list: (params?: { severity?: string; status?: string }) => {
      const query = new URLSearchParams();
      if (params?.severity) query.set('severity', params.severity);
      if (params?.status) query.set('status', params.status);
      const qs = query.toString();
      return fetchAPI<IncidentListResponse>(`/api/incidents${qs ? `?${qs}` : ''}`);
    },
    get: (id: number) => fetchAPI<Incident>(`/api/incidents/${id}`),
    getByCode: (code: string) => fetchAPI<Incident>(`/api/incidents/by-code/${code}`),
    geojson: () => fetchAPI<GeoJSONCollection>('/api/incidents/geojson'),
    evidence: (id: number) => fetchAPI<EvidenceListResponse>(`/api/incidents/${id}/evidence`),
    factors: (id: number) => fetchAPI<ContributingFactorsResponse>(`/api/incidents/${id}/factors`),
    rainfall: (id: number, days?: number) =>
      fetchAPI<RainfallTimelineResponse>(`/api/incidents/${id}/rainfall${days ? `?days=${days}` : ''}`),
    history: (id: number) =>
      fetchAPI<{ incident_id: string; asset_id: string; history: unknown[]; total: number }>(
        `/api/incidents/${id}/history`
      ),
    audit: (id: number) =>
      fetchAPI<{ entries: unknown[]; total: number }>(`/api/incidents/${id}/audit`),
    analyze: (id: number) =>
      fetchAPI<{ status: string; message: string }>(`/api/incidents/${id}/analyze`, { method: 'POST' }),
  },

  // Infrastructure
  infrastructure: {
    list: () => fetchAPI<InfrastructureListResponse>('/api/infrastructure'),
    geojson: () => fetchAPI<GeoJSONCollection>('/api/infrastructure/geojson'),
    get: (assetId: string) => fetchAPI<unknown>(`/api/infrastructure/${assetId}`),
  },

  // Simulations
  simulations: {
    run: (incidentId: number) =>
      fetchAPI<Simulation>('/api/simulations/run', {
        method: 'POST',
        body: JSON.stringify({ incident_id: incidentId }),
      }),
    get: (id: number) => fetchAPI<Simulation>(`/api/simulations/${id}`),
    getByIncident: (incidentId: number) =>
      fetchAPI<Simulation>(`/api/simulations/by-incident/${incidentId}`),
  },

  // Decisions
  decisions: {
    recommend: (incidentId: number) =>
      fetchAPI<Intervention>(`/api/interventions/recommend?incident_id=${incidentId}`, { method: 'POST' }),
    getByIncident: (incidentId: number) =>
      fetchAPI<Intervention>(`/api/interventions/by-incident/${incidentId}`),
    approve: (interventionId: number, approvedBy: string = 'Operator') =>
      fetchAPI<Intervention>(`/api/interventions/${interventionId}/approve`, {
        method: 'POST',
        body: JSON.stringify({ approved_by: approvedBy }),
      }),
  },

  // Work Orders
  workOrders: {
    list: () => fetchAPI<WorkOrderListResponse>('/api/work-orders'),
    get: (id: number) => fetchAPI<WorkOrder>(`/api/work-orders/${id}`),
    getByIncident: (incidentId: number) =>
      fetchAPI<WorkOrder>(`/api/work-orders/by-incident/${incidentId}`),
    create: (incidentId: number, interventionId: number) =>
      fetchAPI<WorkOrder>('/api/work-orders', {
        method: 'POST',
        body: JSON.stringify({ incident_id: incidentId, intervention_id: interventionId }),
      }),
    updateStatus: (id: number, status: string) =>
      fetchAPI<WorkOrder>(`/api/work-orders/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }),
  },

  // Verification
  verification: {
    run: (workOrderId: number) =>
      fetchAPI<VerificationRecord>('/api/verification/analyze', {
        method: 'POST',
        body: JSON.stringify({ work_order_id: workOrderId }),
      }),
    getByWorkOrder: (workOrderId: number) =>
      fetchAPI<VerificationRecord>(`/api/verification/by-work-order/${workOrderId}`),
  },

  // Insights
  insights: {
    get: () => fetchAPI<InsightsResponse>('/api/insights'),
    outcome: (incidentId: number) => fetchAPI<Outcome>(`/api/insights/outcome/${incidentId}`),
  },
};
