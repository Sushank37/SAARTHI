"""
Test suite for ConcernsDB SQLite engine
"""
import sys
from pathlib import Path
import pandas as pd

backend_dir = Path(__file__).resolve().parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from concerns_db import ConcernsDB, CONCERN_CATEGORIES, PRIORITIES, STATUS_LIFECYCLE

# Create a sample DataFrame matching master dataset format
sample_df = pd.DataFrame([
    {
        "WORK_ID": 2018.0,
        "WORK_RECOMMENDATION_DTL_ID": 10542.0,
        "WORK_DESCRIPTION": "Construction of CC Road from Main road to SC Colony",
        "STATE_NAME": "Telangana",
        "CONSTITUENCY": "Nizamabad",
        "IDA_NAME": "Executive Engineer PWD Nizamabad",
        "MP_NAME": "Arvind Dharmapuri",
        "SANCTION_AMOUNT": 500000.0,
        "WORK_STAGE": "In Progress"
    }
])

test_db_path = backend_dir / "test_concerns.db"
if test_db_path.exists():
    test_db_path.unlink()

db = ConcernsDB(db_path=test_db_path, dataset_df=sample_df)

print("1. Testing concern creation...")
concern = db.create_concern(
    work_id="2018",
    raised_by_role="MP",
    mp_name="Arvind Dharmapuri",
    category="Delayed Work",
    title="Delay in CC Road completion beyond 6 months",
    description="The agency has not commenced work despite sanction issued in January.",
    requested_action="Immediate Site Inspection",
    priority="HIGH",
    evidence_attachment="https://example.com/site_inspection_photo.jpg"
)
assert concern["concern_id"] == "CONC-2026-0001", f"Unexpected concern_id: {concern['concern_id']}"
assert concern["status"] == "RAISED"
assert concern["work_id"] == "2018"
assert len(concern["timeline"]) == 1
assert len(concern["attachments"]) == 1
print(f"✓ Concern created: {concern['concern_id']}")

print("2. Testing DA acknowledgment...")
updated = db.record_action(
    concern_id=concern["concern_id"],
    actor_role="DISTRICT_AUTHORITY",
    action_type="ACKNOWLEDGE_RECEIPT",
    action_description="Concern reviewed by Collectorate Nodal Officer. Initiating inspection notice.",
    new_status="RECEIVED",
    actor_user_id="District Magistrate Nodal Officer"
)
assert updated["status"] == "RECEIVED"
assert len(updated["actions"]) == 1
assert len(updated["timeline"]) == 2
print("✓ DA acknowledged")

print("3. Testing DA assignment to IA...")
assigned = db.record_action(
    concern_id=concern["concern_id"],
    actor_role="DISTRICT_AUTHORITY",
    action_type="ASSIGN_IA_RECTIFICATION",
    action_description="Executive Engineer PWD directed to submit physical progress report within 7 days.",
    new_status="ACTION_ASSIGNED",
    assigned_to="Executive Engineer PWD Nizamabad"
)
assert assigned["status"] == "ACTION_ASSIGNED"
assert assigned["assigned_officer"] == "Executive Engineer PWD Nizamabad"
print("✓ Action assigned to IA")

print("4. Testing IA response with evidence...")
responded = db.submit_response(
    concern_id=concern["concern_id"],
    responder_role="IMPLEMENTING_AGENCY",
    response_text="Material mobilized on site. Earthwork 60% complete. Pouring of concrete scheduled for Friday.",
    response_type="PROGRESS_UPDATE",
    evidence_url="https://example.com/cc_road_progress_march2026.jpg",
    responder_user_id="AE Sub-division PWD"
)
assert responded["status"] == "EVIDENCE_SUBMITTED"
assert len(responded["responses"]) == 1
print("✓ IA responded with evidence")

print("5. Testing DA resolution...")
resolved = db.record_action(
    concern_id=concern["concern_id"],
    actor_role="DISTRICT_AUTHORITY",
    action_type="CONFIRM_RECTIFICATION",
    action_description="Collectorate engineering team verified concrete work completed. Issue resolved.",
    new_status="RESOLVED"
)
assert resolved["status"] == "RESOLVED"
assert resolved["resolved_at"] is not None
print("✓ Concern resolved by DA")

print("6. Testing metrics calculation...")
metrics = db.get_metrics(mp_name="Arvind Dharmapuri")
assert metrics["total"] == 1
assert metrics["resolved"] == 1
assert metrics["high_priority"] == 1
print(f"✓ Metrics verified: {metrics}")

# Clean up test db
if test_db_path.exists():
    test_db_path.unlink()

print("ALL BACKEND DATABASE TESTS PASSED SUCCESSFULLY! ✓")
