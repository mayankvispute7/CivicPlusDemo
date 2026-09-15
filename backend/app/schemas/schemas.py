"""CIVIC PULSE — Pydantic response/request schemas.

Typed API contracts for all endpoints.
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Any
from datetime import datetime


# ─── Incident ─────────────────────────────────────────────────────────────────

class IncidentBase(BaseModel):
    incident_id: str
    title: str
    description: Optional[str] = None
    location_name: Optional[str] = None
    latitude: float
    longitude: float
    severity: str
    status: str
    source_type: Optional[str] = None
    rainfall_mm: Optional[float] = None
    evidence_confidence: Optional[float] = None
    recurrence_count: int = 0
    affected_roads: int = 0
    nearby_asset_id: Optional[str] = None


class IncidentResponse(IncidentBase):
    id: int
    reported_at: datetime
    analyzed_at: Optional[datetime] = None
    resolved_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


class IncidentListResponse(BaseModel):
    incidents: List[IncidentResponse]
    total: int


class IncidentSummary(BaseModel):
    """Compact incident summary for map markers and lists."""
    id: int
    incident_id: str
    title: str
    location_name: Optional[str] = None
    latitude: float
    longitude: float
    severity: str
    status: str
    rainfall_mm: Optional[float] = None
    evidence_confidence: Optional[float] = None
    recurrence_count: int = 0
    reported_at: datetime

    class Config:
        from_attributes = True


# ─── Infrastructure ───────────────────────────────────────────────────────────

class InfrastructureAssetResponse(BaseModel):
    id: int
    asset_id: str
    name: str
    asset_type: str
    condition: str
    latitude: float
    longitude: float
    location_name: Optional[str] = None
    capacity_rating: Optional[float] = None
    last_maintenance: Optional[datetime] = None
    maintenance_days_ago: Optional[int] = None
    connected_incidents: int = 0
    recurrence_level: Optional[str] = None
    total_interventions: int = 0
    successful_interventions: int = 0
    avg_recurrence_reduction: Optional[float] = None

    class Config:
        from_attributes = True


class InfrastructureListResponse(BaseModel):
    assets: List[InfrastructureAssetResponse]
    total: int


# ─── Evidence ─────────────────────────────────────────────────────────────────

class EvidenceItemResponse(BaseModel):
    id: int
    evidence_type: str
    title: str
    description: Optional[str] = None
    source: Optional[str] = None
    confidence: Optional[float] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    observed_at: Optional[datetime] = None
    value: Optional[str] = None
    unit: Optional[str] = None
    image_url: Optional[str] = None
    metadata_json: Optional[dict] = None

    class Config:
        from_attributes = True


class EvidenceListResponse(BaseModel):
    evidence: List[EvidenceItemResponse]
    total: int


# ─── Contributing Factors ─────────────────────────────────────────────────────

class ContributingFactor(BaseModel):
    id: str
    label: str
    description: str
    confidence: float
    evidence_type: Optional[str] = None
    severity: Optional[str] = None


class FactorLink(BaseModel):
    source: str
    target: str
    relationship: str
    confidence: float


class ContributingFactorsResponse(BaseModel):
    factors: List[ContributingFactor]
    links: List[FactorLink]
    summary: str


# ─── Rainfall ─────────────────────────────────────────────────────────────────

class RainfallDataPoint(BaseModel):
    date: str
    rainfall_mm: float
    intensity: Optional[str] = None

    class Config:
        from_attributes = True


class RainfallTimelineResponse(BaseModel):
    data: List[RainfallDataPoint]
    station: str
    period_days: int


# ─── Historical Incidents ─────────────────────────────────────────────────────

class HistoricalIncidentResponse(BaseModel):
    id: int
    incident_id: Optional[str] = None
    location_name: Optional[str] = None
    severity: Optional[str] = None
    asset_id: Optional[str] = None
    rainfall_mm: Optional[float] = None
    occurred_at: datetime
    resolved: bool = False
    resolution_hours: Optional[float] = None

    class Config:
        from_attributes = True


# ─── Simulation ───────────────────────────────────────────────────────────────

class RunSimulationRequest(BaseModel):
    incident_id: int


class ScenarioResultResponse(BaseModel):
    id: int
    scenario_name: str
    scenario_label: Optional[str] = None
    impact_score: float
    impact_label: Optional[str] = None
    estimated_cost: float
    risk_level: str
    risk_score: Optional[float] = None
    feasibility_score: float
    feasibility_label: Optional[str] = None
    expected_recurrence_reduction: float
    execution_days: Optional[int] = None
    overall_score: float
    is_recommended: bool = False
    details: Optional[dict] = None

    class Config:
        from_attributes = True


class SimulationResponse(BaseModel):
    id: int
    simulation_id: str
    incident_id: int
    status: str
    scenarios: List[ScenarioResultResponse]
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ─── Decision / Intervention ──────────────────────────────────────────────────

class InterventionResponse(BaseModel):
    id: int
    incident_id: int
    simulation_id: Optional[int] = None
    intervention_type: str
    target_asset_id: Optional[str] = None
    priority_score: float
    urgency_score: Optional[float] = None
    impact_score: Optional[float] = None
    recurrence_score: Optional[float] = None
    feasibility_score: Optional[float] = None
    cost_score: Optional[float] = None
    reasons: List[str] = []
    status: str
    approved_by: Optional[str] = None
    approved_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


class ApproveInterventionRequest(BaseModel):
    approved_by: str = "Operator"


# ─── Work Order ───────────────────────────────────────────────────────────────

class WorkOrderResponse(BaseModel):
    id: int
    work_order_id: str
    incident_id: int
    intervention_id: Optional[int] = None
    intervention_type: Optional[str] = None
    asset_id: Optional[str] = None
    asset_name: Optional[str] = None
    location_name: Optional[str] = None
    priority: Optional[str] = None
    assigned_team: Optional[str] = None
    status: str
    expected_outcome: Optional[str] = None
    required_evidence: Optional[List[str]] = None
    notes: Optional[str] = None
    created_at: datetime
    assigned_at: Optional[datetime] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class WorkOrderListResponse(BaseModel):
    work_orders: List[WorkOrderResponse]
    total: int


class CreateWorkOrderRequest(BaseModel):
    incident_id: int
    intervention_id: int


# ─── Verification ─────────────────────────────────────────────────────────────

class VerificationResponse(BaseModel):
    id: int
    work_order_id: int
    status: str
    before_image_url: Optional[str] = None
    after_image_url: Optional[str] = None
    condition_improvement: Optional[float] = None
    evidence_confidence: Optional[float] = None
    physical_change_detected: bool = False
    analysis_details: Optional[dict] = None
    verified_at: Optional[datetime] = None
    verified_by: Optional[str] = None
    notes: Optional[str] = None

    class Config:
        from_attributes = True


class RunVerificationRequest(BaseModel):
    work_order_id: int


# ─── Outcome / Learning ──────────────────────────────────────────────────────

class OutcomeResponse(BaseModel):
    id: int
    incident_id: int
    work_order_id: Optional[int] = None
    asset_id: Optional[str] = None
    expected_reduction: Optional[float] = None
    observed_reduction: Optional[float] = None
    difference: Optional[float] = None
    intervention_type: Optional[str] = None
    intervention_effective: bool = True
    recurrence_before: Optional[int] = None
    recurrence_after: Optional[int] = None
    future_recommendation: Optional[str] = None
    learning_summary: Optional[str] = None
    recorded_at: datetime

    class Config:
        from_attributes = True


class InstitutionalMemory(BaseModel):
    """Asset-level learning summary."""
    asset_id: str
    asset_name: str
    total_interventions: int
    successful_interventions: int
    avg_recurrence_reduction: float
    intervention_history: List[dict]
    future_recommendation: str


class InsightsResponse(BaseModel):
    outcomes: List[OutcomeResponse]
    institutional_memory: List[InstitutionalMemory]
    system_learning: dict


# ─── Audit ────────────────────────────────────────────────────────────────────

class AuditEntryResponse(BaseModel):
    id: int
    incident_id: Optional[int] = None
    action: str
    description: Optional[str] = None
    actor: str
    timestamp: datetime
    metadata_json: Optional[dict] = None

    class Config:
        from_attributes = True


# ─── GeoJSON for map layers ──────────────────────────────────────────────────

class GeoJSONFeature(BaseModel):
    type: str = "Feature"
    geometry: dict
    properties: dict


class GeoJSONCollection(BaseModel):
    type: str = "FeatureCollection"
    features: List[GeoJSONFeature]
