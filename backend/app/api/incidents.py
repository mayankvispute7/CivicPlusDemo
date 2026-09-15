"""CIVIC PULSE — Incident API routes."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional

from app.core.database import get_db
from app.models.models import (
    Incident, EvidenceItem, HistoricalIncident, AuditEntry, IncidentStatus
)
from app.schemas.schemas import (
    IncidentResponse, IncidentListResponse, IncidentSummary,
    EvidenceItemResponse, EvidenceListResponse,
    ContributingFactorsResponse, ContributingFactor, FactorLink,
    HistoricalIncidentResponse, AuditEntryResponse,
    RainfallDataPoint, RainfallTimelineResponse,
)
from app.models.models import RainfallObservation

router = APIRouter(prefix="/api/incidents", tags=["incidents"])


@router.get("", response_model=IncidentListResponse)
def list_incidents(
    severity: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    """List all incidents with optional filtering."""
    query = db.query(Incident)
    if severity:
        query = query.filter(Incident.severity == severity)
    if status:
        query = query.filter(Incident.status == status)
    query = query.order_by(Incident.reported_at.desc())

    total = query.count()
    incidents = query.limit(limit).all()

    return IncidentListResponse(
        incidents=[IncidentResponse.model_validate(inc) for inc in incidents],
        total=total,
    )


@router.get("/geojson")
def incidents_geojson(db: Session = Depends(get_db)):
    """Return incidents as GeoJSON for map rendering."""
    incidents = db.query(Incident).all()
    features = []
    for inc in incidents:
        features.append({
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [inc.longitude, inc.latitude],
            },
            "properties": {
                "id": inc.id,
                "incident_id": inc.incident_id,
                "title": inc.title,
                "location_name": inc.location_name,
                "severity": inc.severity.value if inc.severity else "MODERATE",
                "status": inc.status.value if inc.status else "DETECTED",
                "rainfall_mm": inc.rainfall_mm,
                "evidence_confidence": inc.evidence_confidence,
                "recurrence_count": inc.recurrence_count,
                "reported_at": inc.reported_at.isoformat() if inc.reported_at else None,
            },
        })
    return {"type": "FeatureCollection", "features": features}


@router.get("/{incident_id}", response_model=IncidentResponse)
def get_incident(incident_id: int, db: Session = Depends(get_db)):
    """Get incident by database ID."""
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    return IncidentResponse.model_validate(incident)


@router.get("/by-code/{code}", response_model=IncidentResponse)
def get_incident_by_code(code: str, db: Session = Depends(get_db)):
    """Get incident by incident code (e.g., INC-1042)."""
    incident = db.query(Incident).filter(Incident.incident_id == code).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    return IncidentResponse.model_validate(incident)


@router.get("/{incident_id}/evidence", response_model=EvidenceListResponse)
def get_incident_evidence(incident_id: int, db: Session = Depends(get_db)):
    """Get all evidence items for an incident."""
    evidence = db.query(EvidenceItem).filter(EvidenceItem.incident_id == incident_id).all()
    return EvidenceListResponse(
        evidence=[EvidenceItemResponse.model_validate(e) for e in evidence],
        total=len(evidence),
    )


@router.get("/{incident_id}/factors", response_model=ContributingFactorsResponse)
def get_contributing_factors(incident_id: int, db: Session = Depends(get_db)):
    """Get probable contributing factors for an incident."""
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    # Deterministic contributing factor graph for the prototype
    factors = [
        ContributingFactor(
            id="heavy_rainfall",
            label="HEAVY RAINFALL",
            description=f"Recorded {incident.rainfall_mm or 82}mm in past 24 hours — exceeds 75th percentile",
            confidence=92.0,
            evidence_type="RAINFALL",
            severity="HIGH",
        ),
        ContributingFactor(
            id="high_runoff",
            label="HIGH SURFACE RUNOFF",
            description="Heavy rainfall combined with urbanized surface generates excessive runoff volume",
            confidence=88.0,
            evidence_type="TERRAIN",
            severity="HIGH",
        ),
        ContributingFactor(
            id="drain_constraint",
            label=f"DRAIN {incident.nearby_asset_id or 'D-104'} — CAPACITY CONSTRAINT",
            description=f"Drain operating at ~45% capacity. Last maintenance 42 days ago. Sediment accumulation probable.",
            confidence=85.0,
            evidence_type="DRAINAGE",
            severity="HIGH",
        ),
        ContributingFactor(
            id="water_accumulation",
            label="WATER ACCUMULATION",
            description="Insufficient drainage throughput leads to surface water pooling in low-lying depression",
            confidence=90.0,
            evidence_type="FIELD_OBSERVATION",
            severity="HIGH",
        ),
        ContributingFactor(
            id="road_disruption",
            label="ROAD DISRUPTION",
            description=f"{incident.affected_roads or 3} road segments affected. Vehicular and pedestrian movement impaired.",
            confidence=95.0,
            evidence_type="ROAD_NETWORK",
            severity="HIGH",
        ),
    ]

    links = [
        FactorLink(source="heavy_rainfall", target="high_runoff", relationship="causes", confidence=92.0),
        FactorLink(source="high_runoff", target="drain_constraint", relationship="overwhelms", confidence=85.0),
        FactorLink(source="drain_constraint", target="water_accumulation", relationship="results_in", confidence=88.0),
        FactorLink(source="water_accumulation", target="road_disruption", relationship="causes", confidence=90.0),
    ]

    return ContributingFactorsResponse(
        factors=factors,
        links=links,
        summary="Evidence suggests heavy rainfall (82mm/24h) generated surface runoff that overwhelmed "
                f"drain {incident.nearby_asset_id or 'D-104'}'s constrained capacity (45%), leading to water "
                "accumulation in a natural depression and disrupting traffic on 3 road segments.",
    )


@router.get("/{incident_id}/history")
def get_incident_history(incident_id: int, db: Session = Depends(get_db)):
    """Get historical incidents for the same location/asset."""
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    historical = db.query(HistoricalIncident).filter(
        HistoricalIncident.asset_id == incident.nearby_asset_id
    ).order_by(HistoricalIncident.occurred_at.desc()).all()

    return {
        "incident_id": incident.incident_id,
        "asset_id": incident.nearby_asset_id,
        "history": [HistoricalIncidentResponse.model_validate(h) for h in historical],
        "total": len(historical),
    }


@router.get("/{incident_id}/rainfall")
def get_incident_rainfall(incident_id: int, days: int = 30, db: Session = Depends(get_db)):
    """Get rainfall timeline for incident area."""
    from datetime import datetime, timedelta

    rainfall = db.query(RainfallObservation).order_by(
        RainfallObservation.observed_at.desc()
    ).limit(days).all()

    data = [
        RainfallDataPoint(
            date=r.observed_at.strftime("%Y-%m-%d") if r.observed_at else "",
            rainfall_mm=r.rainfall_mm,
            intensity=r.intensity,
        )
        for r in reversed(rainfall)
    ]

    return RainfallTimelineResponse(data=data, station="Pune-Baner AWS", period_days=days)


@router.get("/{incident_id}/audit")
def get_incident_audit(incident_id: int, db: Session = Depends(get_db)):
    """Get audit trail for an incident."""
    entries = db.query(AuditEntry).filter(
        AuditEntry.incident_id == incident_id
    ).order_by(AuditEntry.timestamp.asc()).all()

    return {
        "entries": [AuditEntryResponse.model_validate(e) for e in entries],
        "total": len(entries),
    }


@router.post("/{incident_id}/analyze")
def analyze_incident(incident_id: int, db: Session = Depends(get_db)):
    """Trigger analysis for an incident. Updates status."""
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    from datetime import datetime
    incident.status = IncidentStatus.ANALYZED
    incident.analyzed_at = datetime.utcnow()
    db.commit()

    return {"status": "ANALYZED", "message": "Analysis complete", "incident_id": incident.incident_id}
