"""CIVIC PULSE — SQLAlchemy data models.

All core entities for the OBSERVE → UNDERSTAND → SIMULATE → DECIDE → ACT → VERIFY → LEARN lifecycle.
"""

from sqlalchemy import (
    Column, Integer, String, Float, Text, DateTime, Boolean,
    ForeignKey, JSON, Enum as SQLEnum
)
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

from app.core.database import Base


# ─── Enums ────────────────────────────────────────────────────────────────────

class SeverityLevel(str, enum.Enum):
    CRITICAL = "CRITICAL"
    HIGH = "HIGH"
    MODERATE = "MODERATE"
    LOW = "LOW"


class IncidentStatus(str, enum.Enum):
    DETECTED = "DETECTED"
    ANALYZING = "ANALYZING"
    ANALYZED = "ANALYZED"
    SIMULATING = "SIMULATING"
    SIMULATED = "SIMULATED"
    RECOMMENDED = "RECOMMENDED"
    APPROVED = "APPROVED"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    VERIFIED = "VERIFIED"
    CLOSED = "CLOSED"


class AssetType(str, enum.Enum):
    STORMWATER_DRAIN = "STORMWATER_DRAIN"
    ROAD_SEGMENT = "ROAD_SEGMENT"
    CULVERT = "CULVERT"
    MANHOLE = "MANHOLE"
    PUMP_STATION = "PUMP_STATION"
    RETENTION_BASIN = "RETENTION_BASIN"


class AssetCondition(str, enum.Enum):
    GOOD = "GOOD"
    FAIR = "FAIR"
    CAPACITY_CONSTRAINED = "CAPACITY_CONSTRAINED"
    DEGRADED = "DEGRADED"
    CRITICAL = "CRITICAL"


class EvidenceType(str, enum.Enum):
    RAINFALL = "RAINFALL"
    TERRAIN = "TERRAIN"
    DRAINAGE = "DRAINAGE"
    ROAD_NETWORK = "ROAD_NETWORK"
    HISTORICAL_RECURRENCE = "HISTORICAL_RECURRENCE"
    SATELLITE = "SATELLITE"
    FIELD_OBSERVATION = "FIELD_OBSERVATION"
    IMAGE = "IMAGE"
    SENSOR = "SENSOR"


class WorkOrderStatus(str, enum.Enum):
    CREATED = "CREATED"
    ASSIGNED = "ASSIGNED"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    VERIFIED = "VERIFIED"
    CLOSED = "CLOSED"


class VerificationStatus(str, enum.Enum):
    PENDING = "PENDING"
    IN_PROGRESS = "IN_PROGRESS"
    VERIFIED = "VERIFIED"
    REVIEW_REQUIRED = "REVIEW_REQUIRED"
    REWORK_REQUIRED = "REWORK_REQUIRED"


# ─── Models ───────────────────────────────────────────────────────────────────

class Incident(Base):
    """Urban infrastructure incident — the entry point of the lifecycle."""
    __tablename__ = "incidents"

    id = Column(Integer, primary_key=True, index=True)
    incident_id = Column(String(20), unique=True, index=True, nullable=False)  # e.g. INC-1042
    title = Column(String(200), nullable=False)
    description = Column(Text)
    location_name = Column(String(200))
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    severity = Column(SQLEnum(SeverityLevel), default=SeverityLevel.MODERATE)
    status = Column(SQLEnum(IncidentStatus), default=IncidentStatus.DETECTED)
    source_type = Column(String(50))  # sensor, citizen, patrol, satellite
    rainfall_mm = Column(Float)
    evidence_confidence = Column(Float)  # 0-100
    recurrence_count = Column(Integer, default=0)
    affected_roads = Column(Integer, default=0)
    nearby_asset_id = Column(String(20))  # e.g. D-104
    reported_at = Column(DateTime, default=datetime.utcnow)
    analyzed_at = Column(DateTime, nullable=True)
    resolved_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    evidence_items = relationship("EvidenceItem", back_populates="incident")
    simulations = relationship("Simulation", back_populates="incident")
    work_orders = relationship("WorkOrder", back_populates="incident")
    audit_entries = relationship("AuditEntry", back_populates="incident")


class InfrastructureAsset(Base):
    """Physical infrastructure assets (drains, roads, culverts, etc.)."""
    __tablename__ = "infrastructure_assets"

    id = Column(Integer, primary_key=True, index=True)
    asset_id = Column(String(20), unique=True, index=True, nullable=False)  # e.g. D-104
    name = Column(String(200), nullable=False)
    asset_type = Column(SQLEnum(AssetType), nullable=False)
    condition = Column(SQLEnum(AssetCondition), default=AssetCondition.FAIR)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    location_name = Column(String(200))
    capacity_rating = Column(Float)  # 0-100
    last_maintenance = Column(DateTime, nullable=True)
    maintenance_days_ago = Column(Integer)
    connected_incidents = Column(Integer, default=0)
    recurrence_level = Column(String(20))  # HIGH, MEDIUM, LOW
    total_interventions = Column(Integer, default=0)
    successful_interventions = Column(Integer, default=0)
    avg_recurrence_reduction = Column(Float)  # percentage
    metadata_json = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow)


class RainfallObservation(Base):
    """Rainfall data observations for Pune region."""
    __tablename__ = "rainfall_observations"

    id = Column(Integer, primary_key=True, index=True)
    station_name = Column(String(100))
    latitude = Column(Float)
    longitude = Column(Float)
    observed_at = Column(DateTime, nullable=False)
    rainfall_mm = Column(Float, nullable=False)
    duration_hours = Column(Integer, default=24)
    intensity = Column(String(20))  # LIGHT, MODERATE, HEAVY, EXTREME
    created_at = Column(DateTime, default=datetime.utcnow)


class EvidenceItem(Base):
    """Evidence supporting incident analysis and recommendations."""
    __tablename__ = "evidence_items"

    id = Column(Integer, primary_key=True, index=True)
    incident_id = Column(Integer, ForeignKey("incidents.id"), nullable=False)
    evidence_type = Column(SQLEnum(EvidenceType), nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text)
    source = Column(String(100))
    confidence = Column(Float)  # 0-100
    latitude = Column(Float)
    longitude = Column(Float)
    observed_at = Column(DateTime)
    value = Column(String(100))  # numeric or categorical value
    unit = Column(String(50))
    image_url = Column(String(500))
    metadata_json = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    incident = relationship("Incident", back_populates="evidence_items")


class HistoricalIncident(Base):
    """Past incidents for recurrence analysis."""
    __tablename__ = "historical_incidents"

    id = Column(Integer, primary_key=True, index=True)
    incident_id = Column(String(20))
    location_name = Column(String(200))
    latitude = Column(Float)
    longitude = Column(Float)
    severity = Column(String(20))
    asset_id = Column(String(20))  # linked infrastructure asset
    rainfall_mm = Column(Float)
    occurred_at = Column(DateTime, nullable=False)
    resolved = Column(Boolean, default=False)
    resolution_hours = Column(Float)
    created_at = Column(DateTime, default=datetime.utcnow)


class Simulation(Base):
    """Simulation run with multiple scenario results."""
    __tablename__ = "simulations"

    id = Column(Integer, primary_key=True, index=True)
    simulation_id = Column(String(30), unique=True, index=True)
    incident_id = Column(Integer, ForeignKey("incidents.id"), nullable=False)
    status = Column(String(20), default="PENDING")  # PENDING, RUNNING, COMPLETED
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    incident = relationship("Incident", back_populates="simulations")
    scenarios = relationship("ScenarioResult", back_populates="simulation")


class ScenarioResult(Base):
    """Individual scenario outcome within a simulation."""
    __tablename__ = "scenario_results"

    id = Column(Integer, primary_key=True, index=True)
    simulation_id = Column(Integer, ForeignKey("simulations.id"), nullable=False)
    scenario_name = Column(String(100), nullable=False)  # DO_NOTHING, CLEAN_DRAIN, DRAIN_UPGRADE
    scenario_label = Column(String(100))  # Display label
    impact_score = Column(Float)  # 0-100
    impact_label = Column(String(50))  # High disruption, Reduced disruption, etc.
    estimated_cost = Column(Float)  # in INR
    risk_level = Column(String(20))  # HIGH, MEDIUM, LOW
    risk_score = Column(Float)
    feasibility_score = Column(Float)  # 0-100
    feasibility_label = Column(String(50))
    expected_recurrence_reduction = Column(Float)  # percentage
    execution_days = Column(Integer)
    overall_score = Column(Float)  # combined score for ranking
    is_recommended = Column(Boolean, default=False)
    details = Column(JSON, default=dict)

    # Relationships
    simulation = relationship("Simulation", back_populates="scenarios")


class Intervention(Base):
    """Recommended and approved intervention decision."""
    __tablename__ = "interventions"

    id = Column(Integer, primary_key=True, index=True)
    incident_id = Column(Integer, ForeignKey("incidents.id"), nullable=False)
    simulation_id = Column(Integer, ForeignKey("simulations.id"), nullable=True)
    intervention_type = Column(String(100))  # CLEAN_DRAIN, DRAIN_UPGRADE, etc.
    target_asset_id = Column(String(20))
    priority_score = Column(Float)  # 0-100
    urgency_score = Column(Float)
    impact_score = Column(Float)
    recurrence_score = Column(Float)
    feasibility_score = Column(Float)
    cost_score = Column(Float)
    reasons = Column(JSON, default=list)  # list of reason strings
    status = Column(String(20), default="RECOMMENDED")  # RECOMMENDED, APPROVED, REJECTED
    approved_by = Column(String(100), nullable=True)
    approved_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class WorkOrder(Base):
    """Operational work order created after intervention approval."""
    __tablename__ = "work_orders"

    id = Column(Integer, primary_key=True, index=True)
    work_order_id = Column(String(30), unique=True, index=True)  # e.g. WO-2026-0142
    incident_id = Column(Integer, ForeignKey("incidents.id"), nullable=False)
    intervention_id = Column(Integer, ForeignKey("interventions.id"), nullable=True)
    intervention_type = Column(String(100))
    asset_id = Column(String(20))
    asset_name = Column(String(200))
    location_name = Column(String(200))
    priority = Column(String(20))
    assigned_team = Column(String(100))
    status = Column(SQLEnum(WorkOrderStatus), default=WorkOrderStatus.CREATED)
    expected_outcome = Column(Text)
    required_evidence = Column(JSON, default=list)  # list of evidence requirements
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    assigned_at = Column(DateTime, nullable=True)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)

    # Relationships
    incident = relationship("Incident", back_populates="work_orders")
    verification = relationship("VerificationRecord", back_populates="work_order", uselist=False)


class VerificationRecord(Base):
    """Before/after verification of physical intervention."""
    __tablename__ = "verification_records"

    id = Column(Integer, primary_key=True, index=True)
    work_order_id = Column(Integer, ForeignKey("work_orders.id"), nullable=False)
    status = Column(SQLEnum(VerificationStatus), default=VerificationStatus.PENDING)
    before_image_url = Column(String(500))
    after_image_url = Column(String(500))
    condition_improvement = Column(Float)  # percentage
    evidence_confidence = Column(Float)  # 0-100
    physical_change_detected = Column(Boolean, default=False)
    analysis_details = Column(JSON, default=dict)
    verified_at = Column(DateTime, nullable=True)
    verified_by = Column(String(100), nullable=True)
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    work_order = relationship("WorkOrder", back_populates="verification")


class Outcome(Base):
    """Expected vs actual outcome for institutional learning."""
    __tablename__ = "outcomes"

    id = Column(Integer, primary_key=True, index=True)
    incident_id = Column(Integer, ForeignKey("incidents.id"), nullable=False)
    work_order_id = Column(Integer, ForeignKey("work_orders.id"), nullable=True)
    asset_id = Column(String(20))
    expected_reduction = Column(Float)  # percentage
    observed_reduction = Column(Float)  # percentage
    difference = Column(Float)  # percentage (positive = better than expected)
    intervention_type = Column(String(100))
    intervention_effective = Column(Boolean, default=True)
    recurrence_before = Column(Integer)  # incidents per period
    recurrence_after = Column(Integer)
    future_recommendation = Column(Text)
    learning_summary = Column(Text)
    recorded_at = Column(DateTime, default=datetime.utcnow)


class AuditEntry(Base):
    """Audit trail for accountability and traceability."""
    __tablename__ = "audit_entries"

    id = Column(Integer, primary_key=True, index=True)
    incident_id = Column(Integer, ForeignKey("incidents.id"), nullable=True)
    action = Column(String(100), nullable=False)
    description = Column(Text)
    actor = Column(String(100), default="system")
    timestamp = Column(DateTime, default=datetime.utcnow)
    metadata_json = Column(JSON, default=dict)

    # Relationships
    incident = relationship("Incident", back_populates="audit_entries")
