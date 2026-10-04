/**
 * CIVIC PULSE — TypeScript Models
 * Strictly conforming to DATA_CONTRACT.md and API_CONTRACT.md.
 * 
 * Stable identifiers:
 * - complaint_id
 * - site_id
 * - cluster_id
 * - case_id
 * - evidence_id
 * - hypothesis_id
 * - intervention_id
 * - work_order_id
 * - task_id
 * - verification_id
 * - outcome_id
 * - memory_id
 */

// ─── Data Truth & Provenance ────────────────────────────────────────────────

export type DataTruth = 
  | 'REAL_DATA'
  | 'SYNTHETIC_DATA'
  | 'MODEL_ESTIMATION'
  | 'AI_GENERATED_TEXT'
  | 'EVIDENCE'
  | 'ASSUMPTION';

// ─── Enums & Statuses ───────────────────────────────────────────────────────

export type SeverityLevel = 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';

export type ClusterStatus = 'ACTIVE' | 'INVESTIGATING' | 'RESOLVED' | 'MONITORING';

export type CaseStatus = 
  | 'DETECTED'
  | 'INVESTIGATING'
  | 'ANALYZED'
  | 'SIMULATING'
  | 'DECIDED'
  | 'EXECUTING'
  | 'VERIFIED'
  | 'RESOLVED';

export type EvidenceType = 
  | 'COMPLAINT'
  | 'RAINFALL'
  | 'TERRAIN'
  | 'DRAINAGE'
  | 'ROAD'
  | 'SATELLITE'
  | 'FIELD_PHOTO'
  | 'HISTORICAL_INCIDENT'
  | 'WORK_ORDER'
  | 'OUTCOME'
  | 'CROSS_CITY_CASE';

export type WorkOrderStatus = 
  | 'CREATED'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'VERIFIED'
  | 'CLOSED';

export type WorkOrderApprovalState = 
  | 'DRAFT'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'REJECTED'
  | 'CANCELLED';

export type TaskStatus = 
  | 'PENDING'
  | 'IN_PROGRESS'
  | 'BLOCKED'
  | 'COMPLETED'
  | 'ESCALATED';

export type VerificationStatus = 
  | 'VERIFIED'
  | 'REVIEW_REQUIRED'
  | 'REJECTED';

export type VerificationConsistency = 'HIGH' | 'LOW';

export type OutcomeStatus = 
  | 'IMPROVED'
  | 'UNCHANGED'
  | 'RECURRENCE'
  | 'INCONCLUSIVE';

export type ComparisonResult = 
  | 'MATCHED'
  | 'PARTIALLY_MATCHED'
  | 'MISMATCHED'
  | 'INCONCLUSIVE';

// ─── 1. Complaint ───────────────────────────────────────────────────────────

export interface Complaint {
  complaint_id: string;
  title: string;
  description: string;
  incident_type: string;
  reported_at: string;
  site_id: string;
  severity: SeverityLevel;
  source: string;
  data_truth: DataTruth;
  cluster_id?: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  attachments?: string[];
  // Legacy compatibility fields
  id?: string | number;
  incident_id?: string;
  location_name?: string;
  rainfall_mm?: number;
  evidence_confidence?: number;
  recurrence_count?: number;
  affected_roads?: number;
  status?: string;
}

export interface ComplaintListResponse {
  complaints: Complaint[];
  total: number;
}

// ─── 2. Site ────────────────────────────────────────────────────────────────

export interface Site {
  site_id: string;
  latitude: number;
  longitude: number;
  site_label: string;
  road_segment_id?: string;
  h3_cell?: string;
  ward?: string;
  neighborhood?: string;
  drain_ids?: string[];
  building_ids?: string[];
}

// ─── 3. Failure Cluster ─────────────────────────────────────────────────────

export interface FailureCluster {
  cluster_id: string;
  case_id?: string;
  title: string;
  complaint_count: number;
  incident_count: number;
  confidence: number;
  site_id: string;
  status: ClusterStatus | string;
  member_complaint_ids: string[];
  location_name?: string;
  failure_type?: string;
  grouping_explanation?: string;
  recurrence_level?: 'HIGH' | 'MEDIUM' | 'LOW';
  is_high_impact?: boolean;
  is_recurring?: boolean;
  latitude?: number;
  longitude?: number;
}

export interface FailureClusterListResponse {
  clusters: FailureCluster[];
  total: number;
}

// ─── 4. Case & Failure Fingerprint ──────────────────────────────────────────

export interface CaseFingerprint {
  summary: string;
  complaint_count: number;
  incident_count: number;
  confidence: number;
  primary_cause: string;
  rainfall_threshold_mm?: number;
  catchment_slope_pct?: number;
  drain_capacity_deficit_pct?: number;
  data_truth: DataTruth;
}

export interface FailureHypothesis {
  hypothesis_id: string;
  case_id: string;
  title: string;
  confidence: number;
  status: 'CONFIRMED' | 'SUPPORTED' | 'INVESTIGATING' | 'REJECTED';
  evidence_ids: string[];
}

export interface FailureChainNode {
  id: string;
  label: string;
  type: 'trigger' | 'hydrology' | 'terrain' | 'infrastructure' | 'hazard' | 'impact' | 'symptom';
  evidence_ids: string[];
  status: 'confirmed' | 'probable' | 'investigating';
  description?: string;
}

export interface FailureChainEdge {
  source: string;
  target: string;
  relationship: string;
}

export interface FailureChain {
  nodes: FailureChainNode[];
  edges: FailureChainEdge[];
}

export interface HistoryEvent {
  year: string;
  date: string;
  event: string;
  type: 'COMPLAINT' | 'INTERVENTION' | 'RECURRENCE' | 'INVESTIGATION';
  evidence_id?: string;
  notes?: string;
}

export interface Case {
  case_id: string;
  cluster_id: string;
  site_id: string;
  title: string;
  failure_type: string;
  status: CaseStatus | string;
  created_at: string;
  fingerprint?: CaseFingerprint;
  hypotheses?: FailureHypothesis[];
  failure_chain?: FailureChain;
  history?: HistoryEvent[];
  decision_readiness?: DecisionReadiness;
  selected_intervention?: Intervention;
  outcome?: Outcome;
}

export interface CaseListResponse {
  cases: Case[];
  total: number;
}

// ─── 5. Evidence Ledger ─────────────────────────────────────────────────────

export interface Evidence {
  evidence_id: string;
  case_id: string;
  type: EvidenceType;
  title: string;
  source: string;
  confidence: number;
  data_truth: DataTruth;
  description?: string;
  observed_at?: string;
  value?: string;
  unit?: string;
  image_url?: string;
  metadata?: Record<string, unknown>;
}

export interface EvidenceListResponse {
  evidence: Evidence[];
  total: number;
}

// ─── 6. Satellite / Earth Observation ───────────────────────────────────────

export interface SatelliteObservation {
  observation_id: string;
  case_id: string;
  satellite: 'Sentinel-1 SAR' | 'Sentinel-2 Multispectral' | 'CartoDEM';
  acquisition_date: string;
  label: 'INDEPENDENT SPATIAL EVIDENCE';
  metric_name: string;
  metric_value: string;
  supporting_confidence: number;
  data_truth: DataTruth;
  description: string;
  imagery_url?: string;
  baseline_imagery_url?: string;
  comparison_notes: string;
}

// ─── 7. Intervention Lab & Constraints ──────────────────────────────────────

export interface InterventionScore {
  impact_score: number;
  budget_fit: number;
  deadline_fit: number;
  evidence_confidence: number;
  recurrence_reduction: number;
  overall_score: number;
}

export interface OperationalConstraints {
  budget_limit: number;
  deadline_days: number;
  available_workers: number;
  available_equipment: string[];
  available_materials?: string[];
  operational_restrictions?: string[];
  weather_constraints?: string[];
}

export interface Intervention {
  intervention_id: string;
  case_id: string;
  title: string;
  description: string;
  ranking_tier: 'RECOMMENDED' | 'ALTERNATIVE' | 'HIGH_IMPACT';
  estimated_cost: number;
  estimated_duration_days: number;
  workers_required: number;
  overall_score: number;
  scores: InterventionScore;
  equipment?: string[];
  materials?: string[];
  complaints_addressed?: number;
  expected_risk_reduction?: number;
  recurrence_outlook?: string;
  maintenance_burden?: string;
  future_savings?: number;
  budget_fit?: number;
  deadline_fit?: number;
  // Legacy aliases
  id?: number | string;
  scenario_name?: string;
  is_recommended?: boolean;
}

export interface RankedInterventionsResponse {
  ranked_interventions: Intervention[];
  active_constraints?: OperationalConstraints;
}

// ─── 8. Counterfactual & Decision Brief ─────────────────────────────────────

export interface CounterfactualScenario {
  id: string;
  name: string;
  expected_recurrence: string;
  estimated_cost: number;
  duration_days: number;
  impact_summary: string;
  exposure_summary: string;
  future_savings: number;
  assumptions: string[];
  is_status_quo?: boolean;
  score: number;
}

export interface CounterfactualResponse {
  case_id: string;
  scenarios: CounterfactualScenario[];
}

export interface DecisionReadiness {
  ready: boolean;
  evidence_sufficiency: number;
  stakeholder_signoff_required: boolean;
  recommended_action: string;
}

export interface DecisionBrief {
  case_id: string;
  problem: string;
  why_it_happened: string;
  evidence_summary: string[];
  history_summary: string;
  options_considered: number;
  recommended_option: Intervention;
  why_recommended: string;
  total_cost: number;
  timeline_days: number;
  expected_outcome: string;
  risks: string[];
  assumptions: string[];
  human_approval_required: boolean;
}

// ─── 9. Work Order & Execution ──────────────────────────────────────────────

export interface ExecutionTask {
  task_id: string;
  work_order_id: string;
  title: string;
  sequence: number;
  status: TaskStatus;
  planned_duration_hours: number;
  actual_duration_hours?: number;
  workers?: string[];
  equipment?: string[];
  materials?: string[];
  dependencies?: string[];
  planned_start?: string;
  planned_end?: string;
  actual_start?: string;
  actual_end?: string;
  notes?: string;
}

export interface WorkOrder {
  work_order_id: string;
  intervention_id: string;
  case_id?: string;
  title?: string;
  assigned_team?: string;
  status: WorkOrderStatus;
  approval_state: WorkOrderApprovalState;
  created_at: string;
  approved_by?: string;
  approved_at?: string;
  tasks?: ExecutionTask[];
  // Legacy aliases
  id?: number | string;
  intervention_type?: string;
  asset_name?: string;
  location_name?: string;
  expected_outcome?: string;
}

export interface WorkOrderListResponse {
  work_orders: WorkOrder[];
  total: number;
}

export interface ReplanMitigationOption {
  option_id: string;
  title: string;
  eta_minutes?: number;
  additional_cost?: number;
  preserves_deadline: boolean;
  schedule_slip_hours?: number;
}

export interface ReplanResponse {
  work_order_id: string;
  replan_id?: string;
  deadline_risk: 'LOW' | 'MEDIUM' | 'HIGH';
  reason: string;
  projected_overrun_hours: number;
  critical_path_impact: string;
  mitigation_options: ReplanMitigationOption[];
  requires_human_approval: boolean;
}

// ─── 10. Field Verification ─────────────────────────────────────────────────

export interface FieldVerificationChecks {
  gps_match: boolean;
  gps_deviation_meters: number;
  timestamp_match: boolean;
  duplicate_check: boolean;
  visual_change_score: number;
  notes: string;
}

export interface VerificationRecord {
  verification_id: string;
  work_order_id: string;
  task_id?: string;
  captured_at: string;
  latitude: number;
  longitude: number;
  image_url?: string;
  status: VerificationStatus;
  overall_consistency: VerificationConsistency;
  checks: FieldVerificationChecks;
  action_taken?: 'ACCEPT' | 'REQUEST_RECAPTURE' | 'ESCALATE';
  // Legacy compatibility fields
  id?: number | string;
  before_image_url?: string;
  after_image_url?: string;
  physical_change_detected?: boolean;
  condition_improvement?: number;
  evidence_confidence?: number;
  analysis_details?: Record<string, unknown>;
}

// ─── 11. Outcome & Prediction vs Reality ────────────────────────────────────

export interface Outcome {
  outcome_id: string;
  case_id: string;
  observed_at: string;
  status: OutcomeStatus;
  prediction: {
    recurrence_probability: number;
    expected_risk_reduction: number;
  };
  observed: {
    recurrence: boolean;
    rainfall_event_date?: string;
    rainfall_event_depth_mm?: number;
  };
  comparison: ComparisonResult;
  work_completed: boolean;
  problem_resolved: boolean;
  notes: string;
}

// ─── 12. Infrastructure Memory ──────────────────────────────────────────────

export interface SiteMemoryPattern {
  pattern: string;
  durability_assessment: string;
  advice: string;
}

export interface InfrastructureMemory {
  memory_id: string;
  site_id: string;
  site_label: string;
  total_incidents: number;
  recurring_count: number;
  recurrence_interval_days: number;
  past_interventions_count: number;
  recurrence_after_intervention_count: number;
  successful_outcomes_count: number;
  cases: string[];
  interventions: string[];
  outcomes: string[];
  learned_patterns: SiteMemoryPattern[];
}

export interface CrossCityCase {
  case_id: string;
  city: string;
  corridor: string;
  problem_type: string;
  intervention: string;
  approx_cost_inr: number;
  reported_outcome: string;
  recurrence_observed: boolean;
  durability_months: number;
  applicability_notes: string;
  source: string;
  data_truth: DataTruth;
}

// ─── 13. System Status & Intake Pipeline ────────────────────────────────────

export interface SystemStatus {
  system: string;
  region: string;
  data_mode: string;
  complaints_processed: number;
  failure_clusters: number;
  recurring_failures: number;
  high_impact_failures: number;
  unresolved_recurring: number;
  completed_interventions: number;
  recurrence_cases: number;
  // Legacy aliases
  active_incidents?: number;
  total_incidents?: number;
  infrastructure_assets?: number;
  active_work_orders?: number;
}

export interface IntakeJobStatus {
  job_id: string;
  filename: string;
  status: 'PROCESSING' | 'COMPLETED' | 'FAILED';
  step: 'PDF' | 'EXTRACTION' | 'NORMALIZED_COMPLAINTS' | 'GEOSPATIAL_MAPPING' | 'CLUSTERING' | 'COMPLETED';
  progress_percentage: number;
  complaints_extracted?: number;
  clusters_generated?: number;
  recurring_high_impact?: number;
  created_at: string;
  completed_at?: string;
}

// ─── 14. UI & Map State ─────────────────────────────────────────────────────

export type SpatialContextLevel = 
  | '50m_site'
  | '250m_local'
  | 'catchment'
  | 'corridor'
  | 'neighborhood';

export interface MapLayerState {
  complaints: boolean;
  clusters: boolean;
  roads: boolean;
  drainage: boolean;
  terrain: boolean;
  buildings: boolean;
  critical_facilities: boolean;
  satellite: boolean;
}

export type AppMode = 'operator' | 'demo';

// ─── 15. Legacy Aliases for Seamless Backward Compatibility ─────────────────

export type Incident = Complaint;
export type IncidentListResponse = ComplaintListResponse;
export type ScenarioResult = Intervention;
export interface Simulation {
  id: number;
  simulation_id?: string;
  incident_id?: number;
  status?: string;
  scenarios: Intervention[];
}
export interface ProcessingStep {
  label: string;
  status: 'pending' | 'running' | 'complete';
  duration?: number;
}
export interface GeoJSONFeature {
  type: 'Feature';
  geometry: {
    type: string;
    coordinates: number[] | number[][];
  };
  properties: Record<string, unknown>;
}
export interface GeoJSONCollection {
  type: 'FeatureCollection';
  features: GeoJSONFeature[];
}
