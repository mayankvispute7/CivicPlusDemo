# CIVIC PULSE — INTEGRATION CHECKLIST

Version: 1.0

Purpose:
Ensure backend and frontend connect completely after independent development.
The project is NOT considered complete until this checklist passes.

---

# 1. REPOSITORY
- [x] Clean repository created
- [x] backend/ exists
- [x] frontend/ exists
- [x] ARCHITECTURE.md exists
- [x] API_CONTRACT.md exists
- [x] DATA_CONTRACT.md exists
- [x] INTEGRATION_CHECKLIST.md exists
- [x] No authentication required

# 2. DOCUMENTATION
- [x] Backend follows ARCHITECTURE.md
- [x] Frontend follows ARCHITECTURE.md
- [x] Backend follows API_CONTRACT.md
- [x] Frontend follows API_CONTRACT.md
- [x] Backend follows DATA_CONTRACT.md
- [x] Frontend follows DATA_CONTRACT.md

# 3. ENTITY INTEGRITY
Verify stable IDs:
- [x] complaint_id
- [x] site_id
- [x] cluster_id
- [x] case_id
- [x] evidence_id
- [x] hypothesis_id
- [x] intervention_id
- [x] work_order_id
- [x] task_id
- [x] verification_id
- [x] outcome_id
- [x] memory_id

# 4. API CONTRACT
For every endpoint:
- [x] Endpoint exists
- [x] HTTP method matches
- [x] Request schema matches
- [x] Response schema matches
- [x] Field names match
- [x] Data types match
- [x] Required/optional status matches
- [x] Error response matches
- [x] Frontend service exists
- [x] Frontend TypeScript type exists
- [x] Mock response matches

# 5. FRONTEND API INTEGRATION
- [x] All API calls go through service layer
- [x] No hardcoded production API URL
- [x] API URL comes from environment variable (with fallback)
- [x] Loading states exist
- [x] Empty states exist
- [x] Error states exist
- [x] No component invents backend fields
- [x] No duplicate API models exist

# 6. COMPLAINT PIPELINE
- [x] PDF upload works
- [x] extraction works
- [x] complaints created
- [x] coordinates generated
- [x] site assigned
- [x] clusters generated
- [x] cluster IDs persist
- [x] frontend displays results

# 7. INVESTIGATION PIPELINE
- [x] cluster opens case
- [x] case has fingerprint
- [x] fingerprint has hypotheses
- [x] hypotheses reference evidence
- [x] failure chain loads
- [x] history loads
- [x] site context loads
- [x] evidence ledger loads
- [x] satellite/spatial evidence loads

# 8. DECISION PIPELINE
- [x] intervention options generated
- [x] constraints accepted
- [x] options ranked
- [x] scoring factors visible
- [x] assumptions visible
- [x] counterfactual generated
- [x] decision readiness generated

# 9. EXECUTION PIPELINE
- [x] intervention selected
- [x] resolution plan generated
- [x] tasks generated
- [x] work order created
- [x] human approval recorded
- [x] task can be started / completed
- [x] delay can be recorded
- [x] dynamic replanning can be triggered
- [x] revised plan is returned

# 10. VERIFICATION PIPELINE
- [x] field photo upload works
- [x] GPS received & checked
- [x] timestamp checked
- [x] work-order location checked
- [x] duplicate check executed
- [x] visual change check executed
- [x] verification result displayed ("HIGH CONSISTENCY" or "MANUAL REVIEW REQUIRED")

# 11. OUTCOME PIPELINE
- [x] next comparable event can be recorded
- [x] predicted outcome stored
- [x] observed outcome stored
- [x] prediction vs reality displayed
- [x] outcome stored

# 12. INFRASTRUCTURE MEMORY
- [x] site memory loads
- [x] previous complaints appear
- [x] previous cases appear
- [x] previous interventions appear
- [x] previous outcomes appear
- [x] recurrence history appears
- [x] similar cases appear

# 13. UI QUALITY & TRUTH
- [x] Light mode and Dark mode
- [x] Clean typography & strong hierarchy
- [x] Map-centric with progressive location disclosure
- [x] Data truth badges on all metrics
- [x] Responsive layout (Desktop first, Tablet friendly)
