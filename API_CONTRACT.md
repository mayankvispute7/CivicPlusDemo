# CIVIC PULSE — API CONTRACT

Version: 1.0  
Status: ACTIVE  
Base URL: `/api` (or `${NEXT_PUBLIC_API_URL}/api`)

This contract defines the strict HTTP endpoints, request payloads, and response shapes between the frontend and backend.
All entities use stable IDs defined in `DATA_CONTRACT.md`.
All endpoints support JSON unless multipart file upload is specified.

---

## 1. System & Health

### `GET /api/status`
Returns high-level system status and command metrics.
**Response (200 OK):**
```json
{
  "system": "OPERATIONAL",
  "region": "Pune Municipal Corporation",
  "data_mode": "DEMO DATA",
  "complaints_processed": 1248,
  "failure_clusters": 186,
  "recurring_failures": 42,
  "high_impact_failures": 17,
  "unresolved_recurring": 9,
  "completed_interventions": 31,
  "recurrence_cases": 12
}
```

### `GET /api/health`
Health check endpoint.
**Response (200 OK):**
```json
{ "status": "healthy", "service": "civic-pulse-backend" }
```

---

## 2. Intake Pipeline

### `POST /api/intake/upload`
Upload municipal complaint docket or citizen batch PDF.
**Content-Type:** `multipart/form-data`  
**Body:** `file` (PDF binary)

**Response (202 Accepted):**
```json
{
  "job_id": "JOB-2026-0914",
  "filename": "PMC_Ward_Complaints_Monsoon_Batch_04.pdf",
  "status": "PROCESSING",
  "step": "EXTRACTION",
  "progress_percentage": 25,
  "created_at": "2026-10-04T10:00:00Z"
}
```

### `GET /api/intake/status/{job_id}`
Poll extraction progress through the pipeline:
`PDF` → `EXTRACTION` → `NORMALIZED_COMPLAINTS` → `GEOSPATIAL_MAPPING` → `CLUSTERING` → `COMPLETED`.

**Response (200 OK):**
```json
{
  "job_id": "JOB-2026-0914",
  "status": "COMPLETED",
  "step": "COMPLETED",
  "progress_percentage": 100,
  "complaints_extracted": 148,
  "clusters_generated": 18,
  "recurring_high_impact": 4,
  "completed_at": "2026-10-04T10:01:12Z"
}
```

### `GET /api/complaints`
Retrieve normalized complaints with optional filters.
**Query Parameters:**
- `cluster_id` (string, optional)
- `site_id` (string, optional)
- `severity` (string, optional: `CRITICAL` | `HIGH` | `MODERATE` | `LOW`)

**Response (200 OK):**
```json
{
  "complaints": [
    {
      "complaint_id": "CMP-2026-0101",
      "title": "Severe road submergence at Goodluck Chowk",
      "description": "Rainwater depth >45cm preventing vehicular movement outside café. Surface runoff backing up from roadside inlets.",
      "incident_type": "WATERLOGGING",
      "reported_at": "2026-10-02T14:15:00Z",
      "site_id": "SITE-PUN-001",
      "cluster_id": "CLU-PUN-001",
      "severity": "CRITICAL",
      "source": "PMC Citizen Portal",
      "data_truth": "REAL_DATA",
      "latitude": 18.5186,
      "longitude": 73.8415,
      "address": "Goodluck Chowk, FC Road, Shivajinagar, Pune"
    }
  ],
  "total": 148
}
```

---

## 3. Failure Clusters (Situation & Command Center)

### `GET /api/clusters`
List all failure clusters across the city.
**Query Parameters:**
- `is_recurring` (boolean, optional)
- `is_high_impact` (boolean, optional)
- `status` (string, optional)

**Response (200 OK):**
```json
{
  "clusters": [
    {
      "cluster_id": "CLU-PUN-001",
      "case_id": "CAS-PUN-2026-001",
      "title": "FC Road Corridor Recurring Waterlogging",
      "complaint_count": 18,
      "incident_count": 4,
      "confidence": 0.86,
      "site_id": "SITE-PUN-001",
      "status": "INVESTIGATING",
      "location_name": "FC Road - Goodluck Chowk to Fergusson Gate",
      "failure_type": "Drainage constraint + terrain accumulation",
      "grouping_explanation": "18 complaints spatially concentrated within 150m of Goodluck depression with concurrent rainfall runoff surge.",
      "recurrence_level": "HIGH",
      "is_high_impact": true,
      "is_recurring": true,
      "latitude": 18.5186,
      "longitude": 73.8415,
      "member_complaint_ids": ["CMP-2026-0101", "CMP-2026-0102", "CMP-2026-0103"]
    }
  ],
  "total": 186
}
```

### `GET /api/clusters/{cluster_id}`
Retrieve complete cluster detail including member complaints.

---

## 4. Cases & Investigation Workspace

### `GET /api/cases`
List cases under investigation.
**Response (200 OK):**
```json
{
  "cases": [
    {
      "case_id": "CAS-PUN-2026-001",
      "cluster_id": "CLU-PUN-001",
      "site_id": "SITE-PUN-001",
      "title": "Recurring Waterlogging — FC Road Corridor",
      "failure_type": "Drainage constraint + terrain accumulation",
      "status": "INVESTIGATING",
      "created_at": "2026-10-02T16:00:00Z"
    }
  ],
  "total": 42
}
```

### `GET /api/cases/{case_id}`
Full Case Workspace payload: Fingerprint, Failure Chain, Progressive Context, History, and Hypotheses.

**Response (200 OK):**
```json
{
  "case_id": "CAS-PUN-2026-001",
  "cluster_id": "CLU-PUN-001",
  "site_id": "SITE-PUN-001",
  "title": "Recurring Waterlogging — FC Road Corridor",
  "failure_type": "Drainage constraint + terrain accumulation",
  "status": "INVESTIGATING",
  "created_at": "2026-10-02T16:00:00Z",
  "fingerprint": {
    "summary": "RECURRING WATERLOGGING",
    "complaint_count": 18,
    "incident_count": 4,
    "confidence": 0.86,
    "primary_cause": "Drainage constraint + terrain accumulation",
    "rainfall_threshold_mm": 28.5,
    "catchment_slope_pct": 2.4,
    "drain_capacity_deficit_pct": 42.0,
    "data_truth": "MODEL_ESTIMATION"
  },
  "hypotheses": [
    {
      "hypothesis_id": "HYP-001",
      "case_id": "CAS-PUN-2026-001",
      "title": "Drainage capacity & silt bottleneck",
      "confidence": 0.86,
      "status": "CONFIRMED",
      "evidence_ids": ["EV-001", "EV-002", "EV-004"]
    },
    {
      "hypothesis_id": "HYP-002",
      "case_id": "CAS-PUN-2026-001",
      "title": "Micro-basin terrain depression accumulating roadway runoff",
      "confidence": 0.79,
      "status": "SUPPORTED",
      "evidence_ids": ["EV-003", "EV-005"]
    }
  ],
  "failure_chain": {
    "nodes": [
      { "id": "fc-1", "label": "Heavy Rainfall (>30mm/hr)", "type": "trigger", "evidence_ids": ["EV-001"], "status": "confirmed" },
      { "id": "fc-2", "label": "High Surface Runoff", "type": "hydrology", "evidence_ids": ["EV-002"], "status": "confirmed" },
      { "id": "fc-3", "label": "Terrain Depression (Goodluck Basin)", "type": "terrain", "evidence_ids": ["EV-003"], "status": "confirmed" },
      { "id": "fc-4", "label": "Drainage Bottleneck (600mm Pipe Silted)", "type": "infrastructure", "evidence_ids": ["EV-004"], "status": "confirmed" },
      { "id": "fc-5", "label": "Water Accumulation (45cm Depth)", "type": "hazard", "evidence_ids": ["EV-005"], "status": "confirmed" },
      { "id": "fc-6", "label": "Road Disruption & Traffic Paralysis", "type": "impact", "evidence_ids": ["EV-006"], "status": "confirmed" },
      { "id": "fc-7", "label": "18 Citizen Complaints", "type": "symptom", "evidence_ids": ["EV-007"], "status": "confirmed" }
    ],
    "edges": [
      { "source": "fc-1", "target": "fc-2", "relationship": "generates" },
      { "source": "fc-2", "target": "fc-3", "relationship": "flows_into" },
      { "source": "fc-3", "target": "fc-4", "relationship": "overwhelms" },
      { "source": "fc-4", "target": "fc-5", "relationship": "causes" },
      { "source": "fc-5", "target": "fc-6", "relationship": "results_in" },
      { "source": "fc-6", "target": "fc-7", "relationship": "triggers" }
    ]
  },
  "history": [
    { "year": "2024", "date": "2024-07-15", "event": "Citizen complaint: 35cm waterlogging during monsoon spell", "type": "COMPLAINT", "evidence_id": "EV-H01" },
    { "year": "2025", "date": "2025-05-20", "event": "Drain cleaning executed by ward contractor (Manual silt clearance)", "type": "INTERVENTION", "evidence_id": "EV-H02" },
    { "year": "2025", "date": "2025-08-11", "event": "Recurrence observed after 3 months (40mm downpour re-submerged junction)", "type": "RECURRENCE", "evidence_id": "EV-H03" },
    { "year": "2026", "date": "2026-10-02", "event": "18 complaints logged in 3 hours", "type": "COMPLAINT", "evidence_id": "EV-H04" },
    { "year": "2026", "date": "2026-10-04", "event": "Civic Pulse Multi-Evidence Investigation opened", "type": "INVESTIGATION", "evidence_id": "EV-H05" }
  ]
}
```

### `GET /api/cases/{case_id}/evidence`
Evidence Ledger for the case.
**Response (200 OK):**
```json
{
  "evidence": [
    {
      "evidence_id": "EV-001",
      "case_id": "CAS-PUN-2026-001",
      "type": "RAINFALL",
      "title": "IMD Pune Shivaji Nagar Station Precipitation Telemetry",
      "source": "IMD Automated Weather Station #43122",
      "confidence": 0.96,
      "data_truth": "REAL_DATA",
      "value": "48.2 mm in 120 minutes (Peak 32mm/hr)",
      "observed_at": "2026-10-02T15:30:00Z"
    },
    {
      "evidence_id": "EV-004",
      "case_id": "CAS-PUN-2026-001",
      "type": "DRAINAGE",
      "title": "CCTV Stormwater Conduit Inspection & Silt Depth",
      "source": "PMC Drainage Department CCTV Sonde",
      "confidence": 0.88,
      "data_truth": "REAL_DATA",
      "value": "45% silt deposition cross-section restriction in 600mm conduit",
      "observed_at": "2026-10-03T11:00:00Z"
    },
    {
      "evidence_id": "EV-005",
      "case_id": "CAS-PUN-2026-001",
      "type": "SATELLITE",
      "title": "Sentinel-1 SAR Surface Water Backscatter Anomaly",
      "source": "ESA Copernicus Sentinel-1 GRD (VV/VH polarimetry)",
      "confidence": 0.82,
      "data_truth": "EVIDENCE",
      "value": "Dielectric surface change delta -3.8dB indicating standing water along 180m segment",
      "observed_at": "2026-10-02T18:24:00Z"
    },
    {
      "evidence_id": "EV-008",
      "case_id": "CAS-PUN-2026-001",
      "type": "TERRAIN",
      "title": "Screening-level DEM Hydrologic Flow Accumulation",
      "source": "CartoDEM 10m Elevation Model",
      "confidence": 0.85,
      "data_truth": "MODEL_ESTIMATION",
      "value": "Catchment runoff convergence factor 4.2x local roadway baseline",
      "observed_at": "2026-10-03T09:00:00Z"
    }
  ],
  "total": 8
}
```

---

## 5. Intervention Lab & Decisions

### `GET /api/cases/{case_id}/interventions`
List available intervention alternatives with scores and tradeoff metrics.

### `POST /api/cases/{case_id}/interventions/rank`
Re-rank interventions dynamically based on user-adjusted operational constraints.
**Request Body:**
```json
{
  "budget_limit": 150000,
  "deadline_days": 10,
  "available_workers": 8,
  "available_equipment": ["vacuum_suction_tanker", "trenching_excavator"]
}
```

**Response (200 OK):**
```json
{
  "ranked_interventions": [
    {
      "intervention_id": "INT-001",
      "case_id": "CAS-PUN-2026-001",
      "title": "Mechanized High-Pressure Desilting & Catch-Pit Clearing",
      "description": "Deploy vacuum suction unit + high-pressure water jetting to clear 45% conduit silt blockage from Goodluck to Fergusson Gate.",
      "ranking_tier": "RECOMMENDED",
      "estimated_cost": 85000,
      "estimated_duration_days": 3,
      "workers_required": 6,
      "equipment": ["vacuum_suction_tanker", "high_pressure_jetting_unit"],
      "materials": ["manhole_safety_mesh", "sludge_containment_sacks"],
      "complaints_addressed": 18,
      "expected_risk_reduction": 0.68,
      "recurrence_outlook": "Moderate (6-9 months before re-sedimentation)",
      "maintenance_burden": "Quarterly pre-monsoon jetting required",
      "future_savings": 240000,
      "overall_score": 0.84,
      "scores": {
        "impact_score": 0.82,
        "budget_fit": 0.95,
        "deadline_fit": 0.94,
        "evidence_confidence": 0.86,
        "recurrence_reduction": 0.68,
        "overall_score": 0.84
      }
    },
    {
      "intervention_id": "INT-002",
      "case_id": "CAS-PUN-2026-001",
      "title": "Precast Drop-Inlet Installation + Camber Regrading",
      "description": "Construct 2 supplemental curb-cut grating drop-inlets and re-grade 40m asphalt lip to divert micro-basin ponding into secondary stormwater trunk.",
      "ranking_tier": "ALTERNATIVE",
      "estimated_cost": 142000,
      "estimated_duration_days": 7,
      "workers_required": 8,
      "equipment": ["trenching_excavator", "asphalt_roller"],
      "materials": ["precast_concrete_chambers", "cast_iron_gratings", "cold_mix_asphalt"],
      "complaints_addressed": 18,
      "expected_risk_reduction": 0.84,
      "recurrence_outlook": "High durability (>36 months)",
      "maintenance_burden": "Low annual inspection",
      "future_savings": 520000,
      "overall_score": 0.81,
      "scores": {
        "impact_score": 0.89,
        "budget_fit": 0.82,
        "deadline_fit": 0.78,
        "evidence_confidence": 0.84,
        "recurrence_reduction": 0.84,
        "overall_score": 0.81
      }
    },
    {
      "intervention_id": "INT-003",
      "case_id": "CAS-PUN-2026-001",
      "title": "Stormwater Conduit Upsizing (600mm → 900mm R.C.C. Pipe)",
      "description": "Full longitudinal trench excavation and pipe upsizing from Goodluck Chowk to Mutha River outfall.",
      "ranking_tier": "HIGH_IMPACT",
      "estimated_cost": 480000,
      "estimated_duration_days": 21,
      "workers_required": 14,
      "equipment": ["hydraulic_breaker", "crane_truck", "trenching_excavator"],
      "materials": ["900mm_rcc_np3_pipes", "reinforced_bedding_concrete"],
      "complaints_addressed": 18,
      "expected_risk_reduction": 0.94,
      "recurrence_outlook": "Permanent resolution (>10 years)",
      "maintenance_burden": "Standard bi-annual inspection",
      "future_savings": 1200000,
      "overall_score": 0.65,
      "scores": {
        "impact_score": 0.96,
        "budget_fit": 0.32,
        "deadline_fit": 0.40,
        "evidence_confidence": 0.88,
        "recurrence_reduction": 0.94,
        "overall_score": 0.65
      }
    }
  ]
}
```

### `GET /api/cases/{case_id}/counterfactual`
Matrix comparing DO NOTHING vs OPTION A vs OPTION B vs OPTION C.

### `GET /api/cases/{case_id}/decision-brief`
Officer-friendly executive briefing document for human signoff.

### `POST /api/cases/{case_id}/interventions/{intervention_id}/select`
Human approval action to generate an official Work Order.

---

## 6. Execution & Dynamic Replanning

### `GET /api/work-orders/{work_order_id}`
Retrieve work order with all ordered tasks, statuses, planned and actual durations.

### `POST /api/work-orders/{work_order_id}/tasks/{task_id}/status`
Update task progress: `PENDING` | `IN_PROGRESS` | `BLOCKED` | `COMPLETED` | `ESCALATED`.

### `POST /api/work-orders/{work_order_id}/record-delay`
Trigger delay scenario (e.g., "Pump arrival delayed 2 hours").
**Response (200 OK):**
```json
{
  "work_order_id": "WO-2026-088",
  "deadline_risk": "HIGH",
  "projected_overrun_hours": 3.5,
  "critical_path_impact": "Task 3 (Jetting) delayed past night-traffic window",
  "mitigation_options": [
    {
      "option_id": "MIT-1",
      "title": "Dispatch Secondary Suction Unit from Kothrud Ward Depot",
      "eta_minutes": 25,
      "additional_cost": 4500,
      "preserves_deadline": true
    },
    {
      "option_id": "MIT-2",
      "title": "Adjust Shift Schedule to Early Morning Window (04:00 - 07:00)",
      "preserves_deadline": false,
      "schedule_slip_hours": 6
    }
  ]
}
```

---

## 7. Field Verification

### `POST /api/verification/upload`
Submit field evidence photograph with camera metadata, GPS, and timestamp.
**Response (200 OK):**
```json
{
  "verification_id": "VER-2026-042",
  "work_order_id": "WO-2026-088",
  "status": "VERIFIED",
  "overall_consistency": "HIGH",
  "checks": {
    "gps_match": true,
    "gps_deviation_meters": 4.2,
    "timestamp_match": true,
    "duplicate_check": false,
    "visual_change_score": 0.88,
    "notes": "Clear conduit aperture visible; silt evacuation consistent with work order requirements."
  }
}
```

---

## 8. Outcome & Infrastructure Memory

### `GET /api/cases/{case_id}/outcome`
Returns distinction between WORK COMPLETED and PROBLEM RESOLVED.
Compares predicted recurrence vs observed physical outcome after next rain.

### `GET /api/memory/site/{site_id}`
Returns long-term location memory, recurrence intervals, past interventions, and durability lessons learned.
