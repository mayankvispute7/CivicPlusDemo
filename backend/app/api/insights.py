"""CIVIC PULSE — Insights & Learning API routes."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.models import Outcome, InfrastructureAsset, Incident, WorkOrder
from app.schemas.schemas import OutcomeResponse, InsightsResponse, InstitutionalMemory

router = APIRouter(prefix="/api/insights", tags=["insights"])


@router.get("", response_model=InsightsResponse)
def get_insights(db: Session = Depends(get_db)):
    """Get system insights, outcomes, and institutional memory."""
    outcomes = db.query(Outcome).all()

    # Build institutional memory from assets with interventions
    assets_with_history = db.query(InfrastructureAsset).filter(
        InfrastructureAsset.total_interventions > 0
    ).all()

    memories = []
    for asset in assets_with_history:
        # Get related outcomes
        asset_outcomes = db.query(Outcome).filter(Outcome.asset_id == asset.asset_id).all()
        history = []
        for o in asset_outcomes:
            history.append({
                "intervention_type": o.intervention_type,
                "expected_reduction": o.expected_reduction,
                "observed_reduction": o.observed_reduction,
                "effective": o.intervention_effective,
                "date": o.recorded_at.isoformat() if o.recorded_at else None,
            })

        memories.append(InstitutionalMemory(
            asset_id=asset.asset_id,
            asset_name=asset.name,
            total_interventions=asset.total_interventions,
            successful_interventions=asset.successful_interventions,
            avg_recurrence_reduction=asset.avg_recurrence_reduction or 0,
            intervention_history=history,
            future_recommendation=asset_outcomes[0].future_recommendation if asset_outcomes else
                "Schedule preventive maintenance before monsoon season.",
        ))

    # System learning summary
    total_incidents = db.query(Incident).count()
    resolved = db.query(Incident).filter(Incident.status.in_(["VERIFIED", "CLOSED"])).count()
    total_wo = db.query(WorkOrder).count()

    system_learning = {
        "total_incidents_tracked": total_incidents,
        "resolved_incidents": resolved,
        "total_work_orders": total_wo,
        "total_outcomes_recorded": len(outcomes),
        "avg_intervention_effectiveness": (
            sum(o.observed_reduction or 0 for o in outcomes) / max(len(outcomes), 1)
        ),
        "key_insight": "Preventive drain maintenance before heavy rainfall events shows "
                      "consistently higher effectiveness than reactive interventions.",
    }

    return InsightsResponse(
        outcomes=[OutcomeResponse.model_validate(o) for o in outcomes],
        institutional_memory=memories,
        system_learning=system_learning,
    )


@router.get("/outcome/{incident_id}", response_model=OutcomeResponse)
def get_outcome(incident_id: int, db: Session = Depends(get_db)):
    """Get outcome for a specific incident."""
    outcome = db.query(Outcome).filter(Outcome.incident_id == incident_id).first()
    if not outcome:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="No outcome found")
    return OutcomeResponse.model_validate(outcome)
