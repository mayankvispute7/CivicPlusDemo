"""CIVIC PULSE — Simulation API routes."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime

from app.core.database import get_db
from app.models.models import Simulation, ScenarioResult, Incident, IncidentStatus
from app.schemas.schemas import SimulationResponse, ScenarioResultResponse, RunSimulationRequest

router = APIRouter(prefix="/api/simulations", tags=["simulations"])


@router.post("/run", response_model=SimulationResponse)
def run_simulation(request: RunSimulationRequest, db: Session = Depends(get_db)):
    """Run simulation scenarios for an incident."""
    incident = db.query(Incident).filter(Incident.id == request.incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    # Check if simulation already exists
    existing = db.query(Simulation).filter(Simulation.incident_id == request.incident_id).first()
    if existing:
        return SimulationResponse.model_validate(existing)

    # Create new simulation with deterministic scenario results
    sim = Simulation(
        simulation_id=f"SIM-{datetime.utcnow().strftime('%Y')}-{incident.id:03d}",
        incident_id=incident.id,
        status="COMPLETED",
        started_at=datetime.utcnow(),
        completed_at=datetime.utcnow(),
    )
    db.add(sim)
    db.flush()

    # Generate scenario results based on incident characteristics
    rainfall = incident.rainfall_mm or 50
    recurrence = incident.recurrence_count or 3

    scenarios = [
        ScenarioResult(
            simulation_id=sim.id,
            scenario_name="DO_NOTHING",
            scenario_label="Do Nothing",
            impact_score=max(10, 25 - recurrence * 2),
            impact_label="High disruption continues",
            estimated_cost=0,
            risk_level="HIGH",
            risk_score=min(95, 60 + recurrence * 5),
            feasibility_score=100.0,
            feasibility_label="No action required",
            expected_recurrence_reduction=0,
            execution_days=0,
            overall_score=max(15, 30 - recurrence * 2),
            is_recommended=False,
            details={
                "description": "No intervention. Problem persists until natural conditions improve.",
                "expected_disruption_days": max(1, int(rainfall / 30)),
                "traffic_impact": "Severe" if rainfall > 60 else "Moderate",
            },
        ),
        ScenarioResult(
            simulation_id=sim.id,
            scenario_name="CLEAN_DRAIN",
            scenario_label=f"Clean Drain {incident.nearby_asset_id or 'D-104'}",
            impact_score=min(90, 70 + recurrence),
            impact_label="Significant disruption reduction",
            estimated_cost=35000,
            risk_level="LOW",
            risk_score=max(10, 25 - recurrence),
            feasibility_score=92.0,
            feasibility_label="Standard operation",
            expected_recurrence_reduction=min(80, 50 + recurrence * 2),
            execution_days=2,
            overall_score=min(95, 80 + recurrence),
            is_recommended=True,
            details={
                "description": f"Remove sediment and debris from drain {incident.nearby_asset_id or 'D-104'}.",
                "expected_disruption_days": 0.5,
                "capacity_restoration": "Estimated 85% capacity recovery",
            },
        ),
        ScenarioResult(
            simulation_id=sim.id,
            scenario_name="DRAIN_UPGRADE",
            scenario_label=f"Upgrade Drain {incident.nearby_asset_id or 'D-104'}",
            impact_score=95.0,
            impact_label="Near-complete disruption elimination",
            estimated_cost=240000,
            risk_level="MEDIUM",
            risk_score=35.0,
            feasibility_score=58.0,
            feasibility_label="Requires planning & procurement",
            expected_recurrence_reduction=90.0,
            execution_days=21,
            overall_score=65.0,
            is_recommended=False,
            details={
                "description": f"Replace {incident.nearby_asset_id or 'D-104'} with higher-capacity system.",
                "expected_disruption_days": 14,
                "capacity_restoration": "150% of original rated capacity",
            },
        ),
    ]
    db.add_all(scenarios)

    # Update incident status
    incident.status = IncidentStatus.SIMULATED
    db.commit()
    db.refresh(sim)

    return SimulationResponse.model_validate(sim)


@router.get("/{simulation_id}", response_model=SimulationResponse)
def get_simulation(simulation_id: int, db: Session = Depends(get_db)):
    """Get simulation by ID."""
    sim = db.query(Simulation).filter(Simulation.id == simulation_id).first()
    if not sim:
        raise HTTPException(status_code=404, detail="Simulation not found")
    return SimulationResponse.model_validate(sim)


@router.get("/by-incident/{incident_id}", response_model=SimulationResponse)
def get_simulation_by_incident(incident_id: int, db: Session = Depends(get_db)):
    """Get simulation for a specific incident."""
    sim = db.query(Simulation).filter(Simulation.incident_id == incident_id).first()
    if not sim:
        raise HTTPException(status_code=404, detail="No simulation found for this incident")
    return SimulationResponse.model_validate(sim)
