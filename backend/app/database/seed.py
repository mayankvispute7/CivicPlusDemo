"""CIVIC PULSE — Seed data for prototype demonstration.

Generates consistent, internally-referenced synthetic data for:
- 75 incidents across Pune's Baner–University corridor
- 30 infrastructure assets (drains, roads, culverts)
- 90 days of rainfall observations
- 7 historical incidents linked to D-104
- Evidence items for the primary incident INC-1042
- One complete lifecycle: INC-1042 → analysis → simulation → work order → verification → outcome

All data is synthetic prototype data and is clearly labelled as such.
"""

import random
from datetime import datetime, timedelta
from app.models.models import (
    Incident, InfrastructureAsset, RainfallObservation,
    EvidenceItem, HistoricalIncident, Simulation, ScenarioResult,
    Intervention, WorkOrder, VerificationRecord, Outcome, AuditEntry,
    SeverityLevel, IncidentStatus, AssetType, AssetCondition,
    EvidenceType, WorkOrderStatus, VerificationStatus,
)


# ─── Pune Baner–University Corridor Coordinates ──────────────────────────────

# Center: ~18.5596, 73.7850 (Baner area)
CORRIDOR_CENTER = (18.5596, 73.7850)
CORRIDOR_EXTENT = 0.03  # ~3km radius

# Named locations along corridor
LOCATIONS = [
    ("Baner Road", 18.5597, 73.7854),
    ("University Road Junction", 18.5523, 73.8272),
    ("Pashan–Sus Road", 18.5410, 73.7780),
    ("Baner–Balewadi Rd", 18.5680, 73.7720),
    ("ITI Road", 18.5450, 73.8100),
    ("Aundh–Baner Link", 18.5650, 73.8050),
    ("Ganeshkhind Road", 18.5510, 73.8310),
    ("DP Road Baner", 18.5560, 73.7790),
    ("Sus Road", 18.5350, 73.7650),
    ("Balewadi High St", 18.5730, 73.7680),
    ("Baner–Mahalunge Rd", 18.5500, 73.7600),
    ("Pashan Road", 18.5380, 73.7920),
]

SEVERITIES = [SeverityLevel.CRITICAL, SeverityLevel.HIGH, SeverityLevel.MODERATE, SeverityLevel.LOW]
SEVERITY_WEIGHTS = [0.08, 0.25, 0.45, 0.22]

SOURCE_TYPES = ["sensor", "citizen_report", "patrol", "satellite", "automated"]


def _jitter(base: float, extent: float = 0.005) -> float:
    return base + random.uniform(-extent, extent)


def seed_infrastructure_assets(db) -> list:
    """Create 30 infrastructure assets along the corridor."""
    assets = []

    # Drainage assets
    drain_data = [
        ("D-104", "Stormwater Drain D-104", AssetType.STORMWATER_DRAIN, AssetCondition.CAPACITY_CONSTRAINED,
         18.5597, 73.7854, "Baner Road", 42, 7, 45.0, "HIGH"),
        ("D-105", "Stormwater Drain D-105", AssetType.STORMWATER_DRAIN, AssetCondition.FAIR,
         18.5523, 73.8272, "University Road", 18, 3, 68.0, "MEDIUM"),
        ("D-106", "Stormwater Drain D-106", AssetType.STORMWATER_DRAIN, AssetCondition.GOOD,
         18.5410, 73.7780, "Pashan–Sus Road", 12, 1, 82.0, "LOW"),
        ("D-107", "Stormwater Drain D-107", AssetType.STORMWATER_DRAIN, AssetCondition.DEGRADED,
         18.5680, 73.7720, "Baner–Balewadi", 67, 5, 35.0, "HIGH"),
        ("D-108", "Stormwater Drain D-108", AssetType.STORMWATER_DRAIN, AssetCondition.FAIR,
         18.5450, 73.8100, "ITI Road", 25, 2, 62.0, "MEDIUM"),
        ("D-109", "Stormwater Drain D-109", AssetType.STORMWATER_DRAIN, AssetCondition.CAPACITY_CONSTRAINED,
         18.5650, 73.8050, "Aundh–Baner Link", 55, 4, 40.0, "HIGH"),
        ("D-110", "Stormwater Drain D-110", AssetType.STORMWATER_DRAIN, AssetCondition.GOOD,
         18.5510, 73.8310, "Ganeshkhind Road", 8, 1, 88.0, "LOW"),
        ("D-111", "Stormwater Drain D-111", AssetType.STORMWATER_DRAIN, AssetCondition.FAIR,
         18.5560, 73.7790, "DP Road Baner", 30, 3, 58.0, "MEDIUM"),
        ("D-112", "Stormwater Drain D-112", AssetType.STORMWATER_DRAIN, AssetCondition.DEGRADED,
         18.5350, 73.7650, "Sus Road", 72, 6, 30.0, "HIGH"),
        ("D-113", "Stormwater Drain D-113", AssetType.STORMWATER_DRAIN, AssetCondition.FAIR,
         18.5730, 73.7680, "Balewadi High St", 20, 2, 65.0, "MEDIUM"),
    ]

    for aid, name, atype, cond, lat, lng, loc, maint_days, conn_inc, cap, recur in drain_data:
        asset = InfrastructureAsset(
            asset_id=aid, name=name, asset_type=atype, condition=cond,
            latitude=lat, longitude=lng, location_name=loc,
            capacity_rating=cap,
            last_maintenance=datetime.utcnow() - timedelta(days=maint_days),
            maintenance_days_ago=maint_days,
            connected_incidents=conn_inc,
            recurrence_level=recur,
            total_interventions=2 if aid == "D-104" else random.randint(0, 3),
            successful_interventions=2 if aid == "D-104" else random.randint(0, 2),
            avg_recurrence_reduction=61.0 if aid == "D-104" else random.uniform(30, 70),
        )
        assets.append(asset)

    # Road segments
    road_data = [
        ("R-201", "Baner Road Segment A", 18.5600, 73.7860, "Baner Road"),
        ("R-202", "Baner Road Segment B", 18.5590, 73.7840, "Baner Road"),
        ("R-203", "University Road Segment", 18.5525, 73.8270, "University Road"),
        ("R-204", "Pashan Road Segment", 18.5385, 73.7925, "Pashan Road"),
        ("R-205", "Balewadi Road Segment", 18.5685, 73.7725, "Balewadi"),
        ("R-206", "DP Road Segment", 18.5565, 73.7795, "DP Road"),
        ("R-207", "ITI Road Segment", 18.5455, 73.8105, "ITI Road"),
        ("R-208", "Sus Road Segment", 18.5355, 73.7655, "Sus Road"),
        ("R-209", "Ganeshkhind Segment", 18.5515, 73.8315, "Ganeshkhind"),
        ("R-210", "Aundh Link Segment", 18.5655, 73.8055, "Aundh Link"),
    ]

    for rid, name, lat, lng, loc in road_data:
        asset = InfrastructureAsset(
            asset_id=rid, name=name, asset_type=AssetType.ROAD_SEGMENT,
            condition=random.choice([AssetCondition.GOOD, AssetCondition.FAIR]),
            latitude=lat, longitude=lng, location_name=loc,
            capacity_rating=random.uniform(60, 95),
            last_maintenance=datetime.utcnow() - timedelta(days=random.randint(10, 90)),
            maintenance_days_ago=random.randint(10, 90),
            connected_incidents=random.randint(0, 4),
            recurrence_level=random.choice(["LOW", "MEDIUM"]),
        )
        assets.append(asset)

    # Culverts and manholes
    other_data = [
        ("C-301", "Culvert C-301", AssetType.CULVERT, 18.5580, 73.7870, "Baner Road"),
        ("C-302", "Culvert C-302", AssetType.CULVERT, 18.5530, 73.8260, "University Road"),
        ("C-303", "Culvert C-303", AssetType.CULVERT, 18.5420, 73.7790, "Pashan Road"),
        ("M-401", "Manhole M-401", AssetType.MANHOLE, 18.5595, 73.7848, "Baner Road"),
        ("M-402", "Manhole M-402", AssetType.MANHOLE, 18.5610, 73.7865, "Baner Road"),
        ("M-403", "Manhole M-403", AssetType.MANHOLE, 18.5525, 73.8275, "University Road"),
        ("M-404", "Manhole M-404", AssetType.MANHOLE, 18.5460, 73.8110, "ITI Road"),
        ("M-405", "Manhole M-405", AssetType.MANHOLE, 18.5545, 73.7800, "DP Road"),
        ("P-501", "Pump Station P-501", AssetType.PUMP_STATION, 18.5570, 73.7830, "Baner Area"),
        ("RB-601", "Retention Basin RB-601", AssetType.RETENTION_BASIN, 18.5400, 73.7750, "Pashan Area"),
    ]

    for aid, name, atype, lat, lng, loc in other_data:
        asset = InfrastructureAsset(
            asset_id=aid, name=name, asset_type=atype,
            condition=random.choice(list(AssetCondition)),
            latitude=lat, longitude=lng, location_name=loc,
            capacity_rating=random.uniform(40, 90),
            last_maintenance=datetime.utcnow() - timedelta(days=random.randint(5, 120)),
            maintenance_days_ago=random.randint(5, 120),
            connected_incidents=random.randint(0, 3),
            recurrence_level=random.choice(["LOW", "MEDIUM", "HIGH"]),
        )
        assets.append(asset)

    db.add_all(assets)
    return assets


def seed_rainfall(db) -> list:
    """Create 90 days of rainfall observations for Pune."""
    observations = []
    base_date = datetime.utcnow() - timedelta(days=90)

    # Pune monsoon pattern: June–September heavy, rest lighter
    for day in range(90):
        date = base_date + timedelta(days=day)
        month = date.month

        # Monsoon months get heavier rainfall
        if month in [6, 7, 8, 9]:
            base_rain = random.uniform(5, 60)
            # Spike days
            if random.random() < 0.15:
                base_rain = random.uniform(60, 120)
        else:
            base_rain = random.uniform(0, 15)
            if random.random() < 0.05:
                base_rain = random.uniform(15, 40)

        # Zero rain days
        if random.random() < 0.2:
            base_rain = 0

        intensity = "NONE"
        if base_rain > 0:
            if base_rain < 10:
                intensity = "LIGHT"
            elif base_rain < 35:
                intensity = "MODERATE"
            elif base_rain < 65:
                intensity = "HEAVY"
            else:
                intensity = "EXTREME"

        obs = RainfallObservation(
            station_name="Pune-Baner AWS",
            latitude=18.5596,
            longitude=73.7850,
            observed_at=date,
            rainfall_mm=round(base_rain, 1),
            duration_hours=24,
            intensity=intensity,
        )
        observations.append(obs)

    # Ensure the latest day (today-ish) has the 82mm referenced in the primary incident
    observations[-1].rainfall_mm = 82.0
    observations[-1].intensity = "HEAVY"
    observations[-2].rainfall_mm = 45.0
    observations[-2].intensity = "HEAVY"
    observations[-3].rainfall_mm = 28.0
    observations[-3].intensity = "MODERATE"

    db.add_all(observations)
    return observations


def seed_incidents(db) -> list:
    """Create 75 incidents across the corridor."""
    incidents = []
    base_date = datetime.utcnow() - timedelta(days=60)
    random.seed(42)  # Reproducible

    # Primary incident (INC-1042) — the demo focus
    primary = Incident(
        incident_id="INC-1042",
        title="Waterlogging detected — Baner–University Corridor",
        description="Significant water accumulation reported on Baner Road near drain D-104. "
                    "Multiple citizen reports and sensor alerts indicate persistent waterlogging "
                    "affecting vehicular and pedestrian movement. Evidence suggests drainage "
                    "capacity constraint combined with heavy rainfall.",
        location_name="Baner–University Corridor",
        latitude=18.5597,
        longitude=73.7854,
        severity=SeverityLevel.HIGH,
        status=IncidentStatus.DETECTED,
        source_type="sensor",
        rainfall_mm=82.0,
        evidence_confidence=87.0,
        recurrence_count=7,
        affected_roads=3,
        nearby_asset_id="D-104",
        reported_at=datetime.utcnow() - timedelta(hours=4),
    )
    incidents.append(primary)

    # Generate 74 more incidents
    for i in range(74):
        loc = random.choice(LOCATIONS)
        severity = random.choices(SEVERITIES, weights=SEVERITY_WEIGHTS, k=1)[0]
        days_ago = random.randint(0, 55)
        rain = random.uniform(10, 100) if severity in [SeverityLevel.HIGH, SeverityLevel.CRITICAL] else random.uniform(0, 50)

        inc = Incident(
            incident_id=f"INC-{1001 + i if i < 41 else 1043 + (i - 41)}",
            title=f"{'Waterlogging' if random.random() < 0.6 else 'Road flooding'} detected — {loc[0]}",
            description=f"{'Water accumulation' if random.random() < 0.5 else 'Drainage overflow'} reported near {loc[0]}.",
            location_name=loc[0],
            latitude=_jitter(loc[1]),
            longitude=_jitter(loc[2]),
            severity=severity,
            status=random.choice(list(IncidentStatus)),
            source_type=random.choice(SOURCE_TYPES),
            rainfall_mm=round(rain, 1),
            evidence_confidence=round(random.uniform(45, 95), 1),
            recurrence_count=random.randint(0, 8),
            affected_roads=random.randint(0, 4),
            nearby_asset_id=f"D-{random.choice([104,105,106,107,108,109,110,111,112,113])}",
            reported_at=base_date + timedelta(days=days_ago, hours=random.randint(0, 23)),
        )
        incidents.append(inc)

    db.add_all(incidents)
    return incidents


def seed_historical_incidents(db) -> list:
    """Create 7 historical incidents linked to D-104 for recurrence analysis."""
    historical = []
    base_date = datetime.utcnow() - timedelta(days=30)

    events = [
        ("HIST-001", "Baner Road", SeverityLevel.HIGH, 65.0, 2, True, 18.0),
        ("HIST-002", "Baner Road", SeverityLevel.MODERATE, 42.0, 5, True, 12.0),
        ("HIST-003", "Baner Road", SeverityLevel.HIGH, 78.0, 8, True, 24.0),
        ("HIST-004", "Baner Road", SeverityLevel.MODERATE, 38.0, 12, True, 8.0),
        ("HIST-005", "Baner Road", SeverityLevel.HIGH, 91.0, 16, True, 36.0),
        ("HIST-006", "Baner Road", SeverityLevel.CRITICAL, 105.0, 22, True, 48.0),
        ("HIST-007", "Baner Road", SeverityLevel.MODERATE, 55.0, 28, True, 6.0),
    ]

    for hid, loc, sev, rain, days_ago, resolved, res_hours in events:
        hist = HistoricalIncident(
            incident_id=hid,
            location_name=loc,
            latitude=_jitter(18.5597, 0.002),
            longitude=_jitter(73.7854, 0.002),
            severity=sev.value,
            asset_id="D-104",
            rainfall_mm=rain,
            occurred_at=base_date - timedelta(days=days_ago),
            resolved=resolved,
            resolution_hours=res_hours,
        )
        historical.append(hist)

    db.add_all(historical)
    return historical


def seed_evidence_for_primary_incident(db, incident) -> list:
    """Create evidence items for the primary incident INC-1042."""
    evidence = []

    items = [
        (EvidenceType.RAINFALL, "Rainfall Alert — Heavy (82mm/24h)",
         "Automated weather station recorded 82mm rainfall in the past 24 hours at Pune-Baner AWS. "
         "This exceeds the 75th percentile for the season and triggers high-runoff alert for low-lying areas.",
         "Pune-Baner AWS", 92.0, "82", "mm/24h"),

        (EvidenceType.HISTORICAL_RECURRENCE, "Historical Recurrence — 7 events / 30 days",
         "This location has recorded 7 waterlogging incidents in the past 30 days, indicating a "
         "persistent recurring problem. Recurrence correlates with rainfall events above 35mm.",
         "Incident Database", 94.0, "7", "incidents/30d"),

        (EvidenceType.DRAINAGE, "Drain D-104 — Capacity Constrained",
         "Stormwater drain D-104 is operating at estimated 45% of rated capacity. Last maintenance "
         "was 42 days ago. Sediment accumulation likely contributing to reduced throughput.",
         "Infrastructure Registry", 85.0, "45", "% capacity"),

        (EvidenceType.TERRAIN, "Terrain Analysis — Low-Lying Depression",
         "Digital elevation model indicates this location sits in a natural depression (2.1m below "
         "surrounding road grade), making it a natural water collection point during heavy rainfall.",
         "DEM / Survey of India", 88.0, "2.1", "m below grade"),

        (EvidenceType.SATELLITE, "Satellite — Standing Water Detected",
         "Recent satellite imagery shows increased surface water reflectance in the Baner Road corridor, "
         "consistent with standing water accumulation. Estimated affected area: 1,200 sq.m.",
         "Sentinel-2 (prototype estimate)", 78.0, "1200", "sq.m"),

        (EvidenceType.FIELD_OBSERVATION, "Field Report — Road Partially Submerged",
         "Field patrol confirmed water depth of approximately 30cm on the main carriageway. "
         "Traffic diverted through service road. Two-wheeler passage not possible.",
         "Municipal Patrol Team", 95.0, "30", "cm depth"),

        (EvidenceType.ROAD_NETWORK, "Road Network — 3 Segments Affected",
         "Three road segments (R-201, R-202, R-206) are directly affected by the waterlogging. "
         "Combined average daily traffic on these segments: ~12,000 vehicles.",
         "Road Network Database", 90.0, "3", "segments"),

        (EvidenceType.IMAGE, "Field Image — Waterlogged Road Surface",
         "Photographic evidence captured by patrol team showing waterlogged road surface "
         "near drain D-104 inlet. Visible debris accumulation at drain grate.",
         "Field Patrol Camera", 91.0, None, None),
    ]

    for etype, title, desc, source, conf, val, unit in items:
        ev = EvidenceItem(
            incident_id=incident.id if incident.id else 1,
            evidence_type=etype,
            title=title,
            description=desc,
            source=source,
            confidence=conf,
            latitude=_jitter(18.5597, 0.001),
            longitude=_jitter(73.7854, 0.001),
            observed_at=datetime.utcnow() - timedelta(hours=random.randint(1, 6)),
            value=val,
            unit=unit,
            image_url="/images/evidence/waterlogged_road.jpg" if etype == EvidenceType.IMAGE else None,
        )
        evidence.append(ev)

    db.add_all(evidence)
    return evidence


def seed_complete_lifecycle(db, incident):
    """Seed the complete lifecycle for the primary incident (for demo mode).

    This creates: Simulation → Scenarios → Intervention → Work Order →
    Verification → Outcome → Audit Trail
    """

    # ─── Simulation ───────────────────────────────────────────────────────
    simulation = Simulation(
        simulation_id="SIM-2026-001",
        incident_id=incident.id if incident.id else 1,
        status="COMPLETED",
        started_at=datetime.utcnow() - timedelta(hours=3),
        completed_at=datetime.utcnow() - timedelta(hours=3) + timedelta(seconds=12),
    )
    db.add(simulation)
    db.flush()

    # Scenario results
    scenarios = [
        ScenarioResult(
            simulation_id=simulation.id,
            scenario_name="DO_NOTHING",
            scenario_label="Do Nothing",
            impact_score=15.0,
            impact_label="High disruption continues",
            estimated_cost=0,
            risk_level="HIGH",
            risk_score=85.0,
            feasibility_score=100.0,
            feasibility_label="No action required",
            expected_recurrence_reduction=0,
            execution_days=0,
            overall_score=22.0,
            is_recommended=False,
            details={
                "description": "No intervention. Waterlogging persists until natural drainage.",
                "expected_disruption_days": 3,
                "traffic_impact": "Severe",
                "health_risk": "Moderate — standing water breeding ground",
            },
        ),
        ScenarioResult(
            simulation_id=simulation.id,
            scenario_name="CLEAN_DRAIN",
            scenario_label="Clean Drain D-104",
            impact_score=82.0,
            impact_label="Significant disruption reduction",
            estimated_cost=35000,
            risk_level="LOW",
            risk_score=18.0,
            feasibility_score=92.0,
            feasibility_label="Standard operation",
            expected_recurrence_reduction=65.0,
            execution_days=2,
            overall_score=88.0,
            is_recommended=True,
            details={
                "description": "Remove sediment and debris from drain D-104 to restore capacity.",
                "expected_disruption_days": 0.5,
                "traffic_impact": "Minimal during work",
                "capacity_restoration": "Estimated 85% capacity recovery",
            },
        ),
        ScenarioResult(
            simulation_id=simulation.id,
            scenario_name="DRAIN_UPGRADE",
            scenario_label="Upgrade Drain D-104",
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
                "description": "Replace drain D-104 with higher-capacity stormwater system.",
                "expected_disruption_days": 14,
                "traffic_impact": "Significant during construction",
                "capacity_restoration": "150% of original rated capacity",
            },
        ),
    ]
    db.add_all(scenarios)
    db.flush()

    # ─── Intervention / Decision ──────────────────────────────────────────
    intervention = Intervention(
        incident_id=incident.id if incident.id else 1,
        simulation_id=simulation.id,
        intervention_type="CLEAN_DRAIN",
        target_asset_id="D-104",
        priority_score=91.0,
        urgency_score=24.0,
        impact_score=23.0,
        recurrence_score=18.0,
        feasibility_score=14.0,
        cost_score=12.0,
        reasons=[
            "High recurrence — 7 incidents in 30 days",
            "Significant rainfall exposure — 82mm in 24h",
            "Nearby constrained infrastructure — D-104 at 45% capacity",
            "Low intervention complexity — standard drain cleaning",
            "Lower estimated cost — ₹35,000",
            "Faster execution — 2 days vs 21 days",
        ],
        status="RECOMMENDED",
    )
    db.add(intervention)
    db.flush()

    # ─── Work Order ───────────────────────────────────────────────────────
    work_order = WorkOrder(
        work_order_id="WO-2026-0142",
        incident_id=incident.id if incident.id else 1,
        intervention_id=intervention.id,
        intervention_type="Drain Cleaning",
        asset_id="D-104",
        asset_name="Stormwater Drain D-104",
        location_name="Baner Road",
        priority="HIGH",
        assigned_team="Drainage Response Team A",
        status=WorkOrderStatus.CREATED,
        expected_outcome="Reduce recurring water accumulation by restoring drain capacity from 45% to estimated 85%+",
        required_evidence=[
            "Before-condition photograph",
            "Work-in-progress photograph",
            "After-condition photograph",
            "Field confirmation report",
        ],
        notes="Priority intervention based on high recurrence and evidence-supported recommendation. "
              "Coordinate with traffic management for partial road closure during drain access.",
    )
    db.add(work_order)
    db.flush()

    # ─── Verification ─────────────────────────────────────────────────────
    verification = VerificationRecord(
        work_order_id=work_order.id,
        status=VerificationStatus.VERIFIED,
        before_image_url="/images/before_drain.jpg",
        after_image_url="/images/after_drain.jpg",
        condition_improvement=85.0,
        evidence_confidence=92.0,
        physical_change_detected=True,
        analysis_details={
            "method": "Image comparison (OpenCV prototype)",
            "before_condition": "Significant sediment and debris accumulation at drain grate",
            "after_condition": "Drain grate clear, visible water flow restored",
            "change_areas": ["drain_grate", "inlet_channel", "surrounding_surface"],
            "confidence_factors": [
                "Clear visual difference in drain condition",
                "Water flow visible in after image",
                "Surrounding surface shows reduced water level",
            ],
        },
    )
    db.add(verification)
    db.flush()

    # ─── Outcome / Learning ───────────────────────────────────────────────
    outcome = Outcome(
        incident_id=incident.id if incident.id else 1,
        work_order_id=work_order.id,
        asset_id="D-104",
        expected_reduction=65.0,
        observed_reduction=72.0,
        difference=7.0,
        intervention_type="CLEAN_DRAIN",
        intervention_effective=True,
        recurrence_before=7,
        recurrence_after=2,
        future_recommendation="Prioritize preventive drain cleaning for D-104 before major rainfall events "
                             "(forecast >50mm/24h). Schedule maintenance every 30 days during monsoon season "
                             "to prevent capacity degradation below 60%.",
        learning_summary="Drain cleaning intervention at D-104 exceeded expected effectiveness. "
                        "Observed 72% recurrence reduction vs 65% expected (+7%). "
                        "Asset now has 2 successful interventions with 61% average recurrence reduction. "
                        "Pattern suggests preventive maintenance is more cost-effective than reactive response.",
    )
    db.add(outcome)

    # ─── Audit Trail ──────────────────────────────────────────────────────
    audit_events = [
        ("INCIDENT_DETECTED", "Waterlogging incident INC-1042 detected via sensor alert", "system", -4.0),
        ("ANALYSIS_STARTED", "Automated analysis initiated for INC-1042", "system", -3.5),
        ("EVIDENCE_COLLECTED", "8 evidence items collected and evaluated", "system", -3.4),
        ("ANALYSIS_COMPLETED", "Contributing factors identified, evidence confidence: 87%", "system", -3.0),
        ("SIMULATION_STARTED", "3 scenarios queued for evaluation", "system", -3.0),
        ("SIMULATION_COMPLETED", "Scenario comparison complete, recommendation generated", "system", -2.9),
        ("RECOMMENDATION_GENERATED", "Recommended: CLEAN DRAIN D-104 (Priority 91/100)", "system", -2.9),
        ("HUMAN_REVIEW_REQUESTED", "Intervention recommendation pending human approval", "system", -2.8),
        ("INTERVENTION_APPROVED", "Intervention approved by Operator", "Operator", -2.5),
        ("WORK_ORDER_CREATED", "Work order WO-2026-0142 created and assigned", "system", -2.4),
        ("WORK_ORDER_ASSIGNED", "Assigned to Drainage Response Team A", "system", -2.3),
        ("FIELD_WORK_STARTED", "Field team confirmed on-site", "Field Team A", -1.5),
        ("FIELD_WORK_COMPLETED", "Drain cleaning completed, evidence submitted", "Field Team A", -0.5),
        ("VERIFICATION_SUBMITTED", "Before/after evidence submitted for verification", "Field Team A", -0.4),
        ("VERIFICATION_COMPLETED", "Physical intervention verified, confidence: 92%", "system", -0.3),
        ("OUTCOME_RECORDED", "Outcome: 72% recurrence reduction (expected 65%)", "system", -0.2),
        ("LEARNING_UPDATED", "Institutional memory updated for asset D-104", "system", -0.1),
    ]

    for action, desc, actor, hours_ago in audit_events:
        entry = AuditEntry(
            incident_id=incident.id if incident.id else 1,
            action=action,
            description=desc,
            actor=actor,
            timestamp=datetime.utcnow() + timedelta(hours=hours_ago),
        )
        db.add(entry)


def run_seed(db):
    """Execute all seed functions."""
    random.seed(42)
    print("🌱 Seeding infrastructure assets...")
    assets = seed_infrastructure_assets(db)
    db.flush()

    print("🌧️ Seeding rainfall observations...")
    rainfall = seed_rainfall(db)
    db.flush()

    print("📍 Seeding incidents...")
    incidents = seed_incidents(db)
    db.flush()

    # Get the primary incident
    primary_incident = db.query(Incident).filter_by(incident_id="INC-1042").first()

    print("📜 Seeding historical incidents...")
    historical = seed_historical_incidents(db)
    db.flush()

    print("🔍 Seeding evidence for INC-1042...")
    evidence = seed_evidence_for_primary_incident(db, primary_incident)
    db.flush()

    print("🔄 Seeding complete lifecycle for demo...")
    seed_complete_lifecycle(db, primary_incident)

    db.commit()
    print("✅ Seed complete!")
    print(f"   → {len(assets)} infrastructure assets")
    print(f"   → {len(rainfall)} rainfall observations")
    print(f"   → {len(incidents)} incidents")
    print(f"   → {len(historical)} historical incidents")
    print(f"   → {len(evidence)} evidence items for INC-1042")
    print(f"   → 1 complete lifecycle (simulation → work order → verification → outcome)")
