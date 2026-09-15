/**
 * CIVIC PULSE — TypeScript interfaces
 * Typed contracts matching backend Pydantic schemas
 */

// ─── Enums ───────────────────────────────────────────────────────────────────

export type SeverityLevel = 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';
export type IncidentStatus = 
  | 'DETECTED' | 'ANALYZING' | 'ANALYZED' | 'SIMULATING' | 'SIMULATED'
  | 'RECOMMENDED' | 'APPROVED' | 'IN_PROGRESS' | 'COMPLETED' | 'VERIFIED' | 'CLOSED';
export type AssetType = 'STORMWATER_DRAIN' | 'ROAD_SEGMENT' | 'CULVERT' | 'MANHOLE' | 'PUMP_STATION' | 'RETENTION_BASIN';
export type AssetCondition = 'GOOD' | 'FAIR' | 'CAPACITY_CONSTRAINED' | 'DEGRADED' | 'CRITICAL';
export type EvidenceType = 'RAINFALL' | 'TERRAIN' | 'DRAINAGE' | 'ROAD_NETWORK' | 'HISTORICAL_RECURRENCE' | 'SATELLITE' | 'FIELD_OBSERVATION' | 'IMAGE' | 'SENSOR';
export type WorkOrderStatus = 'CREATED' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'VERIFIED' | 'CLOSED';
export type VerificationStatus = 'PENDING' | 'IN_PROGRESS' | 'VERIFIED' | 'REVIEW_REQUIRED' | 'REWORK_REQUIRED';

// ─── Incident ────────────────────────────────────────────────────────────────

export interface Incident {
  id: number;
  incident_id: string;
  title: string;
  description?: string;
  location_name?: string;
  latitude: number;
  longitude: number;
  severity: SeverityLevel;
  status: IncidentStatus;
  source_type?: string;
  rainfall_mm?: number;
  evidence_confidence?: number;
  recurrence_count: number;
  affected_roads: number;
  nearby_asset_id?: string;
  reported_at: string;
  analyzed_at?: string;
  resolved_at?: string;
  created_at: string;
}

export interface IncidentListResponse {
  incidents: Incident[];
  total: number;
}

// ─── Infrastructure ──────────────────────────────────────────────────────────

export interface InfrastructureAsset {
  id: number;
  asset_id: string;
  name: string;
  asset_type: AssetType;
  condition: AssetCondition;
  latitude: number;
  longitude: number;
  location_name?: string;
  capacity_rating?: number;
  last_maintenance?: string;
  maintenance_days_ago?: number;
  connected_incidents: number;
  recurrence_level?: string;
  total_interventions: number;
  successful_interventions: number;
  avg_recurrence_reduction?: number;
}

export interface InfrastructureListResponse {
  assets: InfrastructureAsset[];
  total: number;
}

// ─── Evidence ────────────────────────────────────────────────────────────────

export interface EvidenceItem {
  id: number;
  evidence_type: EvidenceType;
  title: string;
  description?: string;
  source?: string;
  confidence?: number;
  latitude?: number;
  longitude?: number;
  observed_at?: string;
  value?: string;
  unit?: string;
  image_url?: string;
  metadata_json?: Record<string, unknown>;
}

export interface EvidenceListResponse {
  evidence: EvidenceItem[];
  total: number;
}

// ─── Contributing Factors ────────────────────────────────────────────────────

export interface ContributingFactor {
  id: string;
  label: string;
  description: string;
  confidence: number;
  evidence_type?: string;
  severity?: string;
}

export interface FactorLink {
  source: string;
  target: string;
  relationship: string;
  confidence: number;
}

export interface ContributingFactorsResponse {
  factors: ContributingFactor[];
  links: FactorLink[];
  summary: string;
}

// ─── Rainfall ────────────────────────────────────────────────────────────────

export interface RainfallDataPoint {
  date: string;
  rainfall_mm: number;
  intensity?: string;
}

export interface RainfallTimelineResponse {
  data: RainfallDataPoint[];
  station: string;
  period_days: number;
}

// ─── Historical Incidents ────────────────────────────────────────────────────

export interface HistoricalIncident {
  id: number;
  incident_id?: string;
  location_name?: string;
  severity?: string;
  asset_id?: string;
  rainfall_mm?: number;
  occurred_at: string;
  resolved: boolean;
  resolution_hours?: number;
}

// ─── Simulation ──────────────────────────────────────────────────────────────

export interface ScenarioResult {
  id: number;
  scenario_name: string;
  scenario_label?: string;
  impact_score: number;
  impact_label?: string;
  estimated_cost: number;
  risk_level: string;
  risk_score?: number;
  feasibility_score: number;
  feasibility_label?: string;
  expected_recurrence_reduction: number;
  execution_days?: number;
  overall_score: number;
  is_recommended: boolean;
  details?: Record<string, unknown>;
}

export interface Simulation {
  id: number;
  simulation_id: string;
  incident_id: number;
  status: string;
  scenarios: ScenarioResult[];
  started_at?: string;
  completed_at?: string;
  ai_recommendation_reason?: string;
}

// ─── Decision / Intervention ─────────────────────────────────────────────────

export interface Intervention {
  id: number;
  incident_id: number;
  simulation_id?: number;
  intervention_type: string;
  target_asset_id?: string;
  priority_score: number;
  urgency_score?: number;
  impact_score?: number;
  recurrence_score?: number;
  feasibility_score?: number;
  cost_score?: number;
  reasons: string[];
  status: string;
  approved_by?: string;
  approved_at?: string;
  created_at: string;
}

// ─── Work Order ──────────────────────────────────────────────────────────────

export interface WorkOrder {
  id: number;
  work_order_id: string;
  incident_id: number;
  intervention_id?: number;
  intervention_type?: string;
  asset_id?: string;
  asset_name?: string;
  location_name?: string;
  priority?: string;
  assigned_team?: string;
  status: WorkOrderStatus;
  expected_outcome?: string;
  required_evidence?: string[];
  notes?: string;
  created_at: string;
  assigned_at?: string;
  started_at?: string;
  completed_at?: string;
}

export interface WorkOrderListResponse {
  work_orders: WorkOrder[];
  total: number;
}

// ─── Verification ────────────────────────────────────────────────────────────

export interface VerificationRecord {
  id: number;
  work_order_id: number;
  status: VerificationStatus;
  before_image_url?: string;
  after_image_url?: string;
  condition_improvement?: number;
  evidence_confidence?: number;
  physical_change_detected: boolean;
  analysis_details?: Record<string, unknown>;
  verified_at?: string;
  verified_by?: string;
  notes?: string;
}

// ─── Outcome / Learning ─────────────────────────────────────────────────────

export interface Outcome {
  id: number;
  incident_id: number;
  work_order_id?: number;
  asset_id?: string;
  expected_reduction?: number;
  observed_reduction?: number;
  difference?: number;
  intervention_type?: string;
  intervention_effective: boolean;
  recurrence_before?: number;
  recurrence_after?: number;
  future_recommendation?: string;
  learning_summary?: string;
  recorded_at: string;
}

export interface InstitutionalMemory {
  asset_id: string;
  asset_name: string;
  total_interventions: number;
  successful_interventions: number;
  avg_recurrence_reduction: number;
  intervention_history: Record<string, unknown>[];
  future_recommendation: string;
}

export interface InsightsResponse {
  outcomes: Outcome[];
  institutional_memory: InstitutionalMemory[];
  system_learning: Record<string, unknown>;
}

// ─── Audit ───────────────────────────────────────────────────────────────────

export interface AuditEntry {
  id: number;
  incident_id?: number;
  action: string;
  description?: string;
  actor: string;
  timestamp: string;
  metadata_json?: Record<string, unknown>;
}

// ─── System Status ───────────────────────────────────────────────────────────

export interface SystemStatus {
  system: string;
  region: string;
  data_mode: string;
  active_incidents: number;
  total_incidents: number;
  infrastructure_assets: number;
  active_work_orders: number;
}

// ─── GeoJSON ─────────────────────────────────────────────────────────────────

export interface GeoJSONFeature {
  type: 'Feature';
  geometry: {
    type: string;
    coordinates: number[];
  };
  properties: Record<string, unknown>;
}

export interface GeoJSONCollection {
  type: 'FeatureCollection';
  features: GeoJSONFeature[];
}

// ─── Processing Steps ────────────────────────────────────────────────────────

export interface ProcessingStep {
  label: string;
  status: 'pending' | 'running' | 'complete';
  duration?: number; // ms
}

// ─── Demo Mode ───────────────────────────────────────────────────────────────

export type AppMode = 'operator' | 'demo';

export interface DemoState {
  currentStage: 'overview' | 'incident' | 'analysis' | 'simulation' | 'decision' | 'work-order' | 'verification' | 'learning';
  incidentId: number;
}
