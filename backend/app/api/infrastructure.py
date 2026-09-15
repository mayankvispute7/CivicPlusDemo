"""CIVIC PULSE — Infrastructure API routes."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.models import InfrastructureAsset
from app.schemas.schemas import InfrastructureAssetResponse, InfrastructureListResponse

router = APIRouter(prefix="/api/infrastructure", tags=["infrastructure"])


@router.get("", response_model=InfrastructureListResponse)
def list_assets(
    asset_type: str = None,
    condition: str = None,
    db: Session = Depends(get_db),
):
    """List all infrastructure assets."""
    query = db.query(InfrastructureAsset)
    if asset_type:
        query = query.filter(InfrastructureAsset.asset_type == asset_type)
    if condition:
        query = query.filter(InfrastructureAsset.condition == condition)

    assets = query.all()
    return InfrastructureListResponse(
        assets=[InfrastructureAssetResponse.model_validate(a) for a in assets],
        total=len(assets),
    )


@router.get("/geojson")
def infrastructure_geojson(db: Session = Depends(get_db)):
    """Return infrastructure assets as GeoJSON."""
    assets = db.query(InfrastructureAsset).all()
    features = []
    for asset in assets:
        features.append({
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [asset.longitude, asset.latitude],
            },
            "properties": {
                "id": asset.id,
                "asset_id": asset.asset_id,
                "name": asset.name,
                "asset_type": asset.asset_type.value if asset.asset_type else None,
                "condition": asset.condition.value if asset.condition else None,
                "capacity_rating": asset.capacity_rating,
                "maintenance_days_ago": asset.maintenance_days_ago,
                "connected_incidents": asset.connected_incidents,
                "recurrence_level": asset.recurrence_level,
                "location_name": asset.location_name,
            },
        })
    return {"type": "FeatureCollection", "features": features}


@router.get("/{asset_id}", response_model=InfrastructureAssetResponse)
def get_asset(asset_id: str, db: Session = Depends(get_db)):
    """Get infrastructure asset by asset_id code (e.g., D-104)."""
    asset = db.query(InfrastructureAsset).filter(
        InfrastructureAsset.asset_id == asset_id
    ).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    return InfrastructureAssetResponse.model_validate(asset)
