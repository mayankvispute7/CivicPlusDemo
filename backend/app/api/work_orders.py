"""CIVIC PULSE — Work Order API routes."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime

from app.core.database import get_db
from app.models.models import WorkOrder, Intervention, Incident, WorkOrderStatus, IncidentStatus
from app.schemas.schemas import WorkOrderResponse, WorkOrderListResponse, CreateWorkOrderRequest

router = APIRouter(prefix="/api/work-orders", tags=["work-orders"])


@router.get("", response_model=WorkOrderListResponse)
def list_work_orders(db: Session = Depends(get_db)):
    """List all work orders."""
    work_orders = db.query(WorkOrder).order_by(WorkOrder.created_at.desc()).all()
    return WorkOrderListResponse(
        work_orders=[WorkOrderResponse.model_validate(wo) for wo in work_orders],
        total=len(work_orders),
    )


@router.get("/{work_order_id}", response_model=WorkOrderResponse)
def get_work_order(work_order_id: int, db: Session = Depends(get_db)):
    """Get work order by database ID."""
    wo = db.query(WorkOrder).filter(WorkOrder.id == work_order_id).first()
    if not wo:
        raise HTTPException(status_code=404, detail="Work order not found")
    return WorkOrderResponse.model_validate(wo)


@router.get("/by-incident/{incident_id}", response_model=WorkOrderResponse)
def get_work_order_by_incident(incident_id: int, db: Session = Depends(get_db)):
    """Get work order for a specific incident."""
    wo = db.query(WorkOrder).filter(WorkOrder.incident_id == incident_id).first()
    if not wo:
        raise HTTPException(status_code=404, detail="No work order found")
    return WorkOrderResponse.model_validate(wo)


@router.post("", response_model=WorkOrderResponse)
def create_work_order(request: CreateWorkOrderRequest, db: Session = Depends(get_db)):
    """Create a work order from an approved intervention."""
    intervention = db.query(Intervention).filter(Intervention.id == request.intervention_id).first()
    if not intervention:
        raise HTTPException(status_code=404, detail="Intervention not found")

    # Check existing
    existing = db.query(WorkOrder).filter(WorkOrder.incident_id == request.incident_id).first()
    if existing:
        return WorkOrderResponse.model_validate(existing)

    incident = db.query(Incident).filter(Incident.id == request.incident_id).first()

    wo = WorkOrder(
        work_order_id=f"WO-{datetime.utcnow().year}-{request.incident_id:04d}",
        incident_id=request.incident_id,
        intervention_id=intervention.id,
        intervention_type="Drain Cleaning",
        asset_id=intervention.target_asset_id or "D-104",
        asset_name=f"Stormwater Drain {intervention.target_asset_id or 'D-104'}",
        location_name=incident.location_name if incident else "Baner Road",
        priority="HIGH" if incident and incident.severity.value in ["HIGH", "CRITICAL"] else "MEDIUM",
        assigned_team="Drainage Response Team A",
        status=WorkOrderStatus.CREATED,
        expected_outcome="Reduce recurring water accumulation by restoring drain capacity",
        required_evidence=[
            "Before-condition photograph",
            "Work-in-progress photograph",
            "After-condition photograph",
            "Field confirmation report",
        ],
    )
    db.add(wo)

    # Update incident status
    if incident:
        incident.status = IncidentStatus.IN_PROGRESS

    db.commit()
    db.refresh(wo)
    return WorkOrderResponse.model_validate(wo)

from pydantic import BaseModel

class UpdateStatusRequest(BaseModel):
    status: str

@router.patch("/{work_order_id}/status", response_model=WorkOrderResponse)
def update_work_order_status(work_order_id: int, request: UpdateStatusRequest, db: Session = Depends(get_db)):
    wo = db.query(WorkOrder).filter(WorkOrder.id == work_order_id).first()
    if not wo:
        raise HTTPException(status_code=404, detail="Work order not found")
    wo.status = WorkOrderStatus(request.status)
    if wo.status == WorkOrderStatus.COMPLETED:
        wo.completed_at = datetime.utcnow()
    db.commit()
    db.refresh(wo)
    return WorkOrderResponse.model_validate(wo)
