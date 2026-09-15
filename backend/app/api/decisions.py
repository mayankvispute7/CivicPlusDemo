"""CIVIC PULSE — Decision & Intervention API routes."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime

from app.core.database import get_db
from app.models.models import Intervention, Incident, Simulation, IncidentStatus
from app.schemas.schemas import InterventionResponse, ApproveInterventionRequest

router = APIRouter(prefix="/api/interventions", tags=["decisions"])


@router.post("/recommend", response_model=InterventionResponse)
def recommend_intervention(incident_id: int, db: Session = Depends(get_db)):
    """Generate intervention recommendation for an incident."""
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    # Check existing
    existing = db.query(Intervention).filter(Intervention.incident_id == incident_id).first()
    if existing:
        return InterventionResponse.model_validate(existing)

    simulation = db.query(Simulation).filter(Simulation.incident_id == incident_id).first()

    # Deterministic priority scoring
    recurrence = min(incident.recurrence_count or 0, 10)
    rainfall = min(incident.rainfall_mm or 0, 120)
    confidence = incident.evidence_confidence or 70

    urgency = min(25, int(18 + (rainfall / 120) * 7))
    impact = min(25, int(17 + (recurrence / 10) * 8))
    recurrence_score = min(20, int(12 + (recurrence / 10) * 8))
    feasibility = min(15, int(11 + (confidence / 100) * 4))
    cost = 12  # Standard for drain cleaning
    total = urgency + impact + recurrence_score + feasibility + cost

    reasons = []
    if recurrence >= 5:
        reasons.append(f"High recurrence — {incident.recurrence_count} incidents in 30 days")
    if rainfall >= 50:
        reasons.append(f"Significant rainfall exposure — {incident.rainfall_mm}mm in 24h")
    reasons.append(f"Nearby constrained infrastructure — {incident.nearby_asset_id or 'D-104'} at reduced capacity")
    reasons.append("Low intervention complexity — standard drain cleaning")
    reasons.append("Lower estimated cost — ₹35,000")
    reasons.append("Faster execution — 2 days vs 21 days for upgrade")

    intervention = Intervention(
        incident_id=incident.id,
        simulation_id=simulation.id if simulation else None,
        intervention_type="CLEAN_DRAIN",
        target_asset_id=incident.nearby_asset_id or "D-104",
        priority_score=total,
        urgency_score=urgency,
        impact_score=impact,
        recurrence_score=recurrence_score,
        feasibility_score=feasibility,
        cost_score=cost,
        reasons=reasons,
        status="RECOMMENDED",
    )
    db.add(intervention)
    incident.status = IncidentStatus.RECOMMENDED
    db.commit()
    db.refresh(intervention)

    return InterventionResponse.model_validate(intervention)


@router.get("/by-incident/{incident_id}", response_model=InterventionResponse)
def get_intervention_by_incident(incident_id: int, db: Session = Depends(get_db)):
    """Get intervention for a specific incident."""
    intervention = db.query(Intervention).filter(
        Intervention.incident_id == incident_id
    ).first()
    if not intervention:
        raise HTTPException(status_code=404, detail="No intervention found")
    return InterventionResponse.model_validate(intervention)


@router.post("/{intervention_id}/approve", response_model=InterventionResponse)
def approve_intervention(
    intervention_id: int,
    request: ApproveInterventionRequest,
    db: Session = Depends(get_db),
):
    """Approve an intervention (human-in-the-loop)."""
    intervention = db.query(Intervention).filter(Intervention.id == intervention_id).first()
    if not intervention:
        raise HTTPException(status_code=404, detail="Intervention not found")

    intervention.status = "APPROVED"
    intervention.approved_by = request.approved_by
    intervention.approved_at = datetime.utcnow()

    # Update incident status
    incident = db.query(Incident).filter(Incident.id == intervention.incident_id).first()
    if incident:
        incident.status = IncidentStatus.APPROVED

    db.commit()
    db.refresh(intervention)
    return InterventionResponse.model_validate(intervention)
