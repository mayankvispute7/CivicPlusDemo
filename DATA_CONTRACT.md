# CIVIC PULSE — DATA CONTRACT

Version: 1.0
Status: ACTIVE

This document defines the shared data model.
The purpose is to prevent backend and frontend from creating different meanings for the same object.

---

# 1. CORE ENTITY CHAIN

Complaint
→ Site
→ Failure Cluster
→ Case
→ Evidence
→ Hypothesis
→ Intervention
→ Work Order
→ Task
→ Verification
→ Outcome
→ Memory

---

# 2. COMPLAINT

Required:
- complaint_id
- title
- description
- incident_type
- reported_at
- site_id
- severity
- source
- data_truth

Optional:
- cluster_id
- latitude
- longitude
- address
- attachments

---

# 3. SITE

A Site is a stable physical location.

Required:
- site_id
- latitude
- longitude
- site_label

Optional:
- road_segment_id
- h3_cell
- ward
- neighborhood
- drain_ids
- building_ids

The Site ID should remain stable even when complaint geocoding varies slightly.

---

# 4. FAILURE CLUSTER

Required:
- cluster_id
- title
- complaint_count
- incident_count
- confidence
- site_id
- status

Must maintain:
- member complaint IDs

Never lose the relationship between a cluster and its complaints.

---

# 5. CASE

A Case represents an investigated infrastructure failure.

Required:
- case_id
- cluster_id
- site_id
- title
- failure_type
- status
- created_at

Optional:
- fingerprint
- history
- failure_chain
- decision_readiness
- selected_intervention
- outcome

---

# 6. FAILURE HYPOTHESIS

Required:
- hypothesis_id
- case_id
- title
- confidence
- status
- evidence_ids

---

# 7. EVIDENCE

Required:
- evidence_id
- case_id
- type
- title
- source
- confidence
- data_truth

Possible types:
- COMPLAINT
- RAINFALL
- TERRAIN
- DRAINAGE
- ROAD
- SATELLITE
- FIELD_PHOTO
- HISTORICAL_INCIDENT
- WORK_ORDER
- OUTCOME
- CROSS_CITY_CASE

---

# 8. DATA TRUTH

Every record should use one of:
- REAL_DATA
- SYNTHETIC_DATA
- MODEL_ESTIMATION
- AI_GENERATED_TEXT
- EVIDENCE
- ASSUMPTION

For mixed records, separate the components instead of falsely assigning one label to everything.

---

# 9. INTERVENTION

Required:
- intervention_id
- case_id
- title
- description
- estimated_cost
- estimated_duration_days
- workers_required
- overall_score

Optional:
- equipment
- materials
- complaints_addressed
- expected_risk_reduction
- recurrence_outlook
- budget_fit
- deadline_fit
- maintenance_burden
- future_savings

---

# 10. INTERVENTION SCORE

Scores must be explainable. Store individual components:
- impact_score
- budget_fit
- deadline_fit
- evidence_confidence
- recurrence_reduction
- overall_score

---

# 11. CONSTRAINTS

Constraints are first-class data:
- budget_limit
- deadline
- available_workers
- available_equipment
- available_materials
- operational_restrictions
- weather_constraints

---

# 12. WORK ORDER

Required:
- work_order_id
- intervention_id
- status
- approval_state
- created_at

Approval states:
- DRAFT
- PENDING_APPROVAL
- APPROVED
- REJECTED
- CANCELLED

---

# 13. TASK

Required:
- task_id
- work_order_id
- title
- sequence
- status
- planned_duration_hours

Optional:
- actual_duration_hours
- workers
- equipment
- materials
- dependencies
- planned_start
- planned_end
- actual_start
- actual_end
- notes

---

# 14. EXECUTION EVENTS

- TASK_STARTED
- TASK_COMPLETED
- TASK_DELAYED
- RESOURCE_CHANGED
- TASK_BLOCKED
- PLAN_REVISED
- APPROVAL_GRANTED

---

# 15. REPLAN

Required:
- replan_id
- work_order_id
- reason
- created_at
- requires_human_approval

Optional:
- previous_plan
- new_plan
- deadline_risk
- recommended_actions

---

# 16. FIELD EVIDENCE

Required:
- evidence_id
- work_order_id
- task_id
- captured_at
- latitude
- longitude

Optional:
- image_url
- metadata
- visual_change
- duplicate_similarity
- location_consistency
- timestamp_consistency
- manipulation_indicators

---

# 17. VERIFICATION

Required:
- verification_id
- work_order_id
- status (VERIFIED | REVIEW_REQUIRED | REJECTED)
- overall_consistency (HIGH | LOW)

Verification must NOT automatically mean problem resolution.

---

# 18. OUTCOME

Required:
- outcome_id
- case_id
- observed_at
- status (IMPROVED | UNCHANGED | RECURRENCE | INCONCLUSIVE)

Must preserve:
- predicted outcome
- observed outcome

---

# 19. PREDICTION VS REALITY

Store both:
- prediction
- observed
- comparison (MATCHED | PARTIALLY_MATCHED | MISMATCHED | INCONCLUSIVE)

---

# 20. MEMORY

Required:
- memory_id
- site_id
- cases
- interventions
- outcomes
- recurrence
- learned_patterns

---

# 21. STABLE IDENTIFIERS

All relationships MUST use stable IDs:
- `complaint_id`
- `site_id`
- `cluster_id`
- `case_id`
- `evidence_id`
- `hypothesis_id`
- `intervention_id`
- `work_order_id`
- `task_id`
- `verification_id`
- `outcome_id`
- `memory_id`
