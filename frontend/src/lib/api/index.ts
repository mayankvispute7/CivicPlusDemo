/**
 * CIVIC PULSE — Centralized API Service Layer
 * Strictly adheres to API_CONTRACT.md and DATA_CONTRACT.md.
 * 
 * Communicates with the FastAPI backend while providing full contract-parity
 * mock fallbacks during independent backend development.
 */

import type {
  SystemStatus,
  Complaint,
  ComplaintListResponse,
  FailureCluster,
  FailureClusterListResponse,
  Case,
  CaseListResponse,
  Evidence,
  EvidenceListResponse,
  SatelliteObservation,
  Intervention,
  RankedInterventionsResponse,
  OperationalConstraints,
  CounterfactualResponse,
  DecisionBrief,
  WorkOrder,
  WorkOrderListResponse,
  ReplanResponse,
  VerificationRecord,
  Outcome,
  InfrastructureMemory,
  CrossCityCase,
  IntakeJobStatus,
  TaskStatus,
} from '@/types';

import {
  mockSystemStatus,
  mockComplaints,
  mockClusters,
  mockDetailedCase,
  mockEvidenceList,
  mockSatelliteObservation,
  mockInterventions,
  mockCounterfactual,
  mockDecisionBrief,
  mockWorkOrder,
  mockVerification,
  mockOutcome,
  mockSiteMemory,
  mockCrossCityCases,
} from './mockData';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://civicplusdemo.onrender.com';

async function safeFetch<T>(endpoint: string, options?: RequestInit, fallback?: T): Promise<T> {
  try {
    const url = `${API_BASE_URL}${endpoint}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      if (fallback !== undefined) return fallback;
      throw new Error(`API error: ${res.status} ${res.statusText}`);
    }

    return await res.json();
  } catch {
    if (fallback !== undefined) {
      return fallback;
    }
    throw new Error(`Failed to reach backend endpoint: ${endpoint}`);
  }
}

// ─── Civic Pulse API Client ─────────────────────────────────────────────────

export const api = {
  // ─── 1. System Status ─────────────────────────────────────────────────────
  system: {
    status: async (): Promise<SystemStatus> => {
      const fallback: SystemStatus = {
        ...mockSystemStatus,
        active_incidents: mockSystemStatus.high_impact_failures,
        total_incidents: mockSystemStatus.recurring_failures,
        infrastructure_assets: 186,
        active_work_orders: mockSystemStatus.completed_interventions,
      };
      return safeFetch<SystemStatus>('/api/status', undefined, fallback);
    },
    health: async (): Promise<{ status: string }> => {
      return safeFetch<{ status: string }>('/api/health', undefined, { status: 'healthy' });
    },
  },

  // Legacy root status method
  status: async (): Promise<SystemStatus> => {
    return api.system.status();
  },

  // ─── 2. Intake Pipeline ───────────────────────────────────────────────────
  intake: {
    upload: async (file: File): Promise<IntakeJobStatus> => {
      try {
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch(`${API_BASE_URL}/api/intake/upload`, {
          method: 'POST',
          body: formData,
        });
        if (res.ok) {
          return await res.json();
        }
      } catch {
        // Fallback for mock environment
      }

      return {
        job_id: `JOB-${Date.now()}`,
        filename: file.name,
        status: 'PROCESSING',
        step: 'EXTRACTION',
        progress_percentage: 20,
        created_at: new Date().toISOString(),
      };
    },

    getStatus: async (jobId: string, currentStepIndex = 1): Promise<IntakeJobStatus> => {
      const fallbackSteps: IntakeJobStatus['step'][] = [
        'PDF',
        'EXTRACTION',
        'NORMALIZED_COMPLAINTS',
        'GEOSPATIAL_MAPPING',
        'CLUSTERING',
        'COMPLETED',
      ];
      const step = fallbackSteps[Math.min(currentStepIndex, fallbackSteps.length - 1)];
      const progress = Math.min(100, Math.round(((currentStepIndex + 1) / fallbackSteps.length) * 100));

      const fallback: IntakeJobStatus = {
        job_id: jobId,
        filename: 'PMC_Ward_Complaints_Monsoon_Batch_04.pdf',
        status: progress >= 100 ? 'COMPLETED' : 'PROCESSING',
        step,
        progress_percentage: progress,
        complaints_extracted: 148,
        clusters_generated: 18,
        recurring_high_impact: 4,
        created_at: new Date(Date.now() - 60000).toISOString(),
        completed_at: progress >= 100 ? new Date().toISOString() : undefined,
      };

      return safeFetch<IntakeJobStatus>(`/api/intake/status/${jobId}`, undefined, fallback);
    },
  },

  // ─── 3. Complaints / Incidents ────────────────────────────────────────────
  complaints: {
    list: async (params?: { cluster_id?: string; site_id?: string; severity?: string; status?: string }): Promise<ComplaintListResponse> => {
      let filtered = [...mockComplaints];
      if (params?.cluster_id) {
        filtered = filtered.filter((c) => c.cluster_id === params.cluster_id);
      }
      if (params?.site_id) {
        filtered = filtered.filter((c) => c.site_id === params.site_id);
      }
      if (params?.severity) {
        filtered = filtered.filter((c) => c.severity === params.severity);
      }

      const qs = new URLSearchParams(params as Record<string, string>).toString();
      const endpoint = `/api/complaints${qs ? `?${qs}` : ''}`;
      return safeFetch<ComplaintListResponse>(endpoint, undefined, {
        complaints: filtered,
        total: filtered.length,
      });
    },

    get: async (complaintId: string | number): Promise<Complaint> => {
      const strId = String(complaintId);
      const fallback = mockComplaints.find((c) => c.complaint_id === strId || String(c.id) === strId) || mockComplaints[0];
      return safeFetch<Complaint>(`/api/complaints/${complaintId}`, undefined, fallback);
    },
    getByCode: async (code: string): Promise<Complaint> => {
      return api.complaints.get(code);
    },
    geojson: async () => ({
      type: 'FeatureCollection',
      features: mockComplaints.map((c) => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [c.longitude || 73.8415, c.latitude || 18.5186] },
        properties: { ...c },
      })),
    }),
    evidence: async (id: number | string) => api.cases.getEvidence(String(id)),
    factors: async () => ({
      factors: [
        { id: '1', label: 'Drainage Bottleneck', description: '45% silt block in 600mm conduit', confidence: 0.86 },
        { id: '2', label: 'Terrain Depression', description: '1.18m micro-basin bowl', confidence: 0.79 },
      ],
      links: [{ source: '1', target: '2', relationship: 'compounds', confidence: 0.84 }],
      summary: 'Evidence indicates conduit silting combined with natural elevation depression.',
    }),
    rainfall: async () => ({
      station: 'IMD Shivaji Nagar #43122',
      period_days: 7,
      data: [
        { date: '2026-09-28', rainfall_mm: 4.2 },
        { date: '2026-09-29', rainfall_mm: 12.0 },
        { date: '2026-09-30', rainfall_mm: 8.5 },
        { date: '2026-10-01', rainfall_mm: 18.2 },
        { date: '2026-10-02', rainfall_mm: 48.2, intensity: 'HEAVY' },
        { date: '2026-10-03', rainfall_mm: 14.1 },
        { date: '2026-10-04', rainfall_mm: 6.0 },
      ],
    }),
    history: async () => ({
      incident_id: 'CAS-PUN-2026-001',
      asset_id: 'SITE-PUN-001',
      history: mockDetailedCase.history || [],
      total: mockDetailedCase.history?.length || 0,
    }),
    audit: async () => ({ entries: [], total: 0 }),
    analyze: async () => ({ status: 'ANALYZED', message: 'Analysis complete' }),
  },

  // Alias for backward compatibility
  get incidents() {
    return this.complaints;
  },

  // ─── 4. Failure Clusters (Situation / Command Center) ─────────────────────
  clusters: {
    list: async (params?: { is_recurring?: boolean; is_high_impact?: boolean }): Promise<FailureClusterListResponse> => {
      let filtered = [...mockClusters];
      if (params?.is_recurring !== undefined) {
        filtered = filtered.filter((cl) => cl.is_recurring === params.is_recurring);
      }
      if (params?.is_high_impact !== undefined) {
        filtered = filtered.filter((cl) => cl.is_high_impact === params.is_high_impact);
      }

      const qs = new URLSearchParams(params as unknown as Record<string, string>).toString();
      return safeFetch<FailureClusterListResponse>(`/api/clusters${qs ? `?${qs}` : ''}`, undefined, {
        clusters: filtered,
        total: filtered.length,
      });
    },

    get: async (clusterId: string): Promise<FailureCluster | undefined> => {
      const fallback = mockClusters.find((cl) => cl.cluster_id === clusterId) || mockClusters[0];
      return safeFetch<FailureCluster>(`/api/clusters/${clusterId}`, undefined, fallback);
    },
  },

  // ─── 5. Cases & Workspace ─────────────────────────────────────────────────
  cases: {
    list: async (): Promise<CaseListResponse> => {
      const fallback: CaseListResponse = {
        cases: [mockDetailedCase],
        total: 1,
      };
      return safeFetch<CaseListResponse>('/api/cases', undefined, fallback);
    },

    get: async (caseId: string): Promise<Case> => {
      return safeFetch<Case>(`/api/cases/${caseId}`, undefined, mockDetailedCase);
    },

    getEvidence: async (caseId: string): Promise<EvidenceListResponse> => {
      return safeFetch<EvidenceListResponse>(`/api/cases/${caseId}/evidence`, undefined, {
        evidence: mockEvidenceList,
        total: mockEvidenceList.length,
      });
    },

    getSatellite: async (caseId: string): Promise<SatelliteObservation> => {
      return safeFetch<SatelliteObservation>(
        `/api/cases/${caseId}/satellite`,
        undefined,
        mockSatelliteObservation
      );
    },

    getInterventions: async (caseId: string): Promise<RankedInterventionsResponse> => {
      return safeFetch<RankedInterventionsResponse>(
        `/api/cases/${caseId}/interventions`,
        undefined,
        {
          ranked_interventions: mockInterventions,
        }
      );
    },

    rankInterventions: async (
      caseId: string,
      constraints: OperationalConstraints
    ): Promise<RankedInterventionsResponse> => {
      const reRanked = mockInterventions.map((inv) => {
        const budgetFit = Math.max(0, Math.min(1, 1 - (inv.estimated_cost - constraints.budget_limit) / constraints.budget_limit));
        const deadlineFit = Math.max(0, Math.min(1, 1 - (inv.estimated_duration_days - constraints.deadline_days) / constraints.deadline_days));
        
        const newOverall = Number(
          (
            inv.scores.impact_score * 0.35 +
            budgetFit * 0.25 +
            deadlineFit * 0.20 +
            inv.scores.recurrence_reduction * 0.20
          ).toFixed(2)
        );

        let ranking_tier: 'RECOMMENDED' | 'ALTERNATIVE' | 'HIGH_IMPACT' = 'ALTERNATIVE';
        if (newOverall >= 0.80) ranking_tier = 'RECOMMENDED';
        else if (inv.estimated_cost > constraints.budget_limit) ranking_tier = 'HIGH_IMPACT';

        return {
          ...inv,
          ranking_tier,
          overall_score: newOverall,
          scores: {
            ...inv.scores,
            budget_fit: Number(budgetFit.toFixed(2)),
            deadline_fit: Number(deadlineFit.toFixed(2)),
            overall_score: newOverall,
          },
        };
      }).sort((a, b) => b.overall_score - a.overall_score);

      const fallback: RankedInterventionsResponse = {
        ranked_interventions: reRanked,
        active_constraints: constraints,
      };

      return safeFetch<RankedInterventionsResponse>(
        `/api/cases/${caseId}/interventions/rank`,
        {
          method: 'POST',
          body: JSON.stringify(constraints),
        },
        fallback
      );
    },

    getCounterfactual: async (caseId: string): Promise<CounterfactualResponse> => {
      return safeFetch<CounterfactualResponse>(
        `/api/cases/${caseId}/counterfactual`,
        undefined,
        {
          case_id: caseId,
          scenarios: mockCounterfactual,
        }
      );
    },

    getDecisionBrief: async (caseId: string): Promise<DecisionBrief> => {
      return safeFetch<DecisionBrief>(
        `/api/cases/${caseId}/decision-brief`,
        undefined,
        mockDecisionBrief
      );
    },

    selectIntervention: async (
      caseId: string,
      interventionId: string
    ): Promise<{ status: string; work_order_id: string; message: string }> => {
      const fallback = {
        status: 'SUCCESS',
        work_order_id: 'WO-2026-088',
        message: 'Intervention approved. Work Order WO-2026-088 issued.',
      };
      return safeFetch(
        `/api/cases/${caseId}/interventions/${interventionId}/select`,
        { method: 'POST' },
        fallback
      );
    },
  },

  // ─── Legacy Decision and Simulation facades ───────────────────────────────
  decisions: {
    recommend: async () => mockInterventions[0],
    getByIncident: async () => mockInterventions[0],
    approve: async () => mockInterventions[0],
  },

  simulations: {
    run: async () => ({
      id: 1,
      simulation_id: 'SIM-001',
      status: 'COMPLETED',
      scenarios: mockInterventions,
    }),
    get: async () => ({
      id: 1,
      simulation_id: 'SIM-001',
      status: 'COMPLETED',
      scenarios: mockInterventions,
    }),
    getByIncident: async () => ({
      id: 1,
      simulation_id: 'SIM-001',
      status: 'COMPLETED',
      scenarios: mockInterventions,
    }),
  },

  infrastructure: {
    list: async () => ({
      assets: [
        {
          id: 1,
          asset_id: 'SITE-PUN-001',
          name: 'FC Road Goodluck Box Culvert & Conduit',
          asset_type: 'STORMWATER_DRAIN',
          condition: 'CAPACITY_CONSTRAINED',
          latitude: 18.5186,
          longitude: 73.8415,
          location_name: 'FC Road Goodluck Chowk',
          connected_incidents: 18,
          total_interventions: 3,
          successful_interventions: 2,
        },
      ],
      total: 1,
    }),
    geojson: async () => ({
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [73.8415, 18.5186] },
          properties: { name: 'FC Road Goodluck Box Culvert' },
        },
      ],
    }),
    get: async () => ({}),
  },

  insights: {
    get: async () => ({
      outcomes: [mockOutcome],
      institutional_memory: [
        {
          asset_id: 'SITE-PUN-001',
          asset_name: 'FC Road Goodluck Corridor',
          total_interventions: 3,
          successful_interventions: 2,
          avg_recurrence_reduction: 0.68,
          intervention_history: [],
          future_recommendation: 'Mandate mechanical vacuum suction desilting prior to monsoon',
        },
      ],
      system_learning: {},
    }),
    outcome: async () => mockOutcome,
  },

  // ─── 6. Execution & Work Orders ───────────────────────────────────────────
  workOrders: {
    list: async (): Promise<WorkOrderListResponse> => {
      const wo: WorkOrder = {
        ...mockWorkOrder,
        id: 1,
        intervention_type: 'Mechanized Desilting',
        asset_name: 'FC Road Goodluck Drain',
        location_name: 'Goodluck Chowk, FC Road',
        expected_outcome: 'Restore 100% pipe discharge flow',
      };
      return safeFetch<WorkOrderListResponse>('/api/work-orders', undefined, {
        work_orders: [wo],
        total: 1,
      });
    },

    get: async (workOrderId: string | number): Promise<WorkOrder> => {
      const wo: WorkOrder = {
        ...mockWorkOrder,
        id: 1,
        intervention_type: 'Mechanized Desilting',
        asset_name: 'FC Road Goodluck Drain',
        location_name: 'Goodluck Chowk, FC Road',
        expected_outcome: 'Restore 100% pipe discharge flow',
      };
      return safeFetch<WorkOrder>(
        `/api/work-orders/${workOrderId}`,
        undefined,
        wo
      );
    },

    getByIncident: async (incidentId: number | string) => {
      return api.workOrders.get(String(incidentId));
    },

    create: async () => mockWorkOrder,

    updateStatus: async (id: number | string, status: string) => {
      return { ...mockWorkOrder, status: status as any };
    },

    updateTaskStatus: async (
      workOrderId: string,
      taskId: string,
      status: TaskStatus
    ): Promise<WorkOrder> => {
      const updatedTasks = mockWorkOrder.tasks?.map((t) =>
        t.task_id === taskId ? { ...t, status } : t
      );
      const fallback: WorkOrder = {
        ...mockWorkOrder,
        tasks: updatedTasks,
      };

      return safeFetch<WorkOrder>(
        `/api/work-orders/${workOrderId}/tasks/${taskId}/status`,
        {
          method: 'POST',
          body: JSON.stringify({ status }),
        },
        fallback
      );
    },

    recordDelay: async (
      workOrderId: string,
      delayHours: number,
      reason: string
    ): Promise<ReplanResponse> => {
      const fallback: ReplanResponse = {
        work_order_id: workOrderId,
        replan_id: 'RPL-2026-004',
        deadline_risk: 'HIGH',
        reason: reason || 'Vacuum tanker arrival delayed by 2 hours due to equipment depot dispatch queue',
        projected_overrun_hours: delayHours + 1.5,
        critical_path_impact: 'Conduit jetting task delayed into high-traffic daytime window',
        requires_human_approval: true,
        mitigation_options: [
          {
            option_id: 'MIT-1',
            title: 'Dispatch Secondary Tanker from Kothrud Ward Depot',
            eta_minutes: 25,
            additional_cost: 4500,
            preserves_deadline: true,
          },
          {
            option_id: 'MIT-2',
            title: 'Shift Schedule Adjustment to Dawn Window (04:00 - 08:00)',
            schedule_slip_hours: 5,
            preserves_deadline: false,
          },
        ],
      };

      return safeFetch<ReplanResponse>(
        `/api/work-orders/${workOrderId}/record-delay`,
        {
          method: 'POST',
          body: JSON.stringify({ delay_hours: delayHours, reason }),
        },
        fallback
      );
    },
  },

  // ─── 7. Field Verification ────────────────────────────────────────────────
  verification: {
    get: async (workOrderId: string | number): Promise<VerificationRecord> => {
      const ver: VerificationRecord = {
        ...mockVerification,
        id: 1,
        before_image_url: '/images/verification_chamber_cleared.jpg',
        after_image_url: '/images/verification_chamber_cleared.jpg',
        physical_change_detected: true,
        condition_improvement: 92,
        evidence_confidence: 0.95,
        analysis_details: { silt_evacuation_percentage: 95 },
      };
      return safeFetch<VerificationRecord>(
        `/api/verification/${workOrderId}`,
        undefined,
        ver
      );
    },

    getByWorkOrder: async (workOrderId: string | number) => {
      return api.verification.get(workOrderId);
    },

    run: async (workOrderId: string | number) => {
      return api.verification.get(workOrderId);
    },

    upload: async (payload: {
      work_order_id: string;
      latitude: number;
      longitude: number;
      photo_base64?: string;
    }): Promise<VerificationRecord> => {
      const fallback: VerificationRecord = {
        ...mockVerification,
        work_order_id: payload.work_order_id,
        latitude: payload.latitude,
        longitude: payload.longitude,
      };

      return safeFetch<VerificationRecord>(
        '/api/verification/upload',
        {
          method: 'POST',
          body: JSON.stringify(payload),
        },
        fallback
      );
    },

    action: async (
      verificationId: string,
      action: 'ACCEPT' | 'REQUEST_RECAPTURE' | 'ESCALATE'
    ): Promise<{ status: string; action_recorded: string }> => {
      const fallback = { status: 'SUCCESS', action_recorded: action };
      return safeFetch(
        `/api/verification/${verificationId}/action`,
        {
          method: 'POST',
          body: JSON.stringify({ action }),
        },
        fallback
      );
    },
  },

  // ─── 8. Outcome & Prediction vs Reality ───────────────────────────────────
  outcomes: {
    get: async (caseId: string): Promise<Outcome> => {
      return safeFetch<Outcome>(`/api/cases/${caseId}/outcome`, undefined, mockOutcome);
    },

    recordEvent: async (
      caseId: string,
      rainfallMm: number,
      recurrenceObserved: boolean
    ): Promise<Outcome> => {
      const fallback: Outcome = {
        ...mockOutcome,
        observed: {
          recurrence: recurrenceObserved,
          rainfall_event_date: new Date().toISOString().split('T')[0],
          rainfall_event_depth_mm: rainfallMm,
        },
        comparison: !recurrenceObserved ? 'MATCHED' : 'MISMATCHED',
        problem_resolved: !recurrenceObserved,
      };

      return safeFetch<Outcome>(
        `/api/cases/${caseId}/outcome/record-event`,
        {
          method: 'POST',
          body: JSON.stringify({ rainfall_mm: rainfallMm, recurrence: recurrenceObserved }),
        },
        fallback
      );
    },
  },

  // ─── 9. Infrastructure Memory ─────────────────────────────────────────────
  memory: {
    getSite: async (siteId: string): Promise<InfrastructureMemory> => {
      return safeFetch<InfrastructureMemory>(
        `/api/memory/site/${siteId}`,
        undefined,
        mockSiteMemory
      );
    },

    getCrossCity: async (): Promise<CrossCityCase[]> => {
      return safeFetch<CrossCityCase[]>(
        '/api/memory/cross-city',
        undefined,
        mockCrossCityCases
      );
    },
  },
};
