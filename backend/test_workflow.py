"""
Automated Test Suite for SAARTHI Cross-Role Workflow, Canonical Work Data,
and Role Permissions.
"""

import sys
import json
from pathlib import Path

# Add project root to sys.path
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

import pandas as pd
from backend.workflow_engine import WorkflowEngine, REQUEST_TYPES, STATUS_LIFECYCLE


def run_tests():
    print("=" * 60)
    print("RUNNING SAARTHI WORKFLOW TEST SUITE")
    print("=" * 60)

    # 1. Load dataset
    data_file = BASE_DIR / "data" / "mplads_final_dataset.csv"
    print(f"Loading master dataset from: {data_file}")
    df = pd.read_csv(data_file, low_memory=False)
    df.columns = df.columns.astype(str).str.strip()
    print(f"Dataset loaded: {len(df):,} rows.")

    engine = WorkflowEngine(df)

    # TEST 1: Canonical Work ID Resolution
    print("\n[TEST 1] Canonical Work ID Resolution (Work #172106)...")
    work = engine.lookup_canonical_work("172106")
    assert work is not None, "Failed to locate work 172106"
    assert str(work.get("STATE_NAME")).lower() == "telangana", f"Expected Telangana, got {work.get('STATE_NAME')}"
    assert "WARANGAL" in str(work.get("IDA_NAME")), f"Expected Warangal in IDA_NAME, got {work.get('IDA_NAME')}"
    print(f"✓ Work #172106 correctly resolved: {work.get('WORK_DESCRIPTION')[:60]}...")

    # TEST 2: Citizen -> DA Workflow
    print("\n[TEST 2] Citizen -> DA Workflow (Grievance Submission & Review)...")
    req = engine.create_request(
        work_id="172106",
        raised_by_role="CITIZEN",
        request_type="GRIEVANCE",
        title="Compound Wall Plaster Cracking",
        description="Drainage settling observed along the boundary wall.",
        priority="HIGH",
        raised_by_identity="Concerned Citizen (Konaimakula)"
    )
    req_id = req["request_id"]
    assert req["target_role"] == "DISTRICT_AUTHORITY", f"Expected target DISTRICT_AUTHORITY, got {req['target_role']}"
    assert req["status"] == "SUBMITTED", f"Expected status SUBMITTED, got {req['status']}"
    assert len(req["timeline"]) == 1, "Expected 1 initial timeline event"
    print(f"✓ Created {req_id} routed to {req['target_department']}")

    # DA updates status to UNDER_REVIEW
    updated = engine.update_request_status(
        request_id=req_id,
        actor_role="DISTRICT_AUTHORITY",
        new_status="UNDER_REVIEW",
        note="Field inspection scheduled for AE Panchayati Raj.",
        actor_identity="District Collectorate (Warangal)"
    )
    assert updated["status"] == "UNDER_REVIEW"
    assert len(updated["timeline"]) == 2
    print(f"✓ DA transitioned {req_id} to UNDER_REVIEW with inspection note.")

    # TEST 3: IA -> DA Payment Workflow
    print("\n[TEST 3] IA -> DA Payment Workflow...")
    ia_req = engine.create_request(
        work_id="172106",
        raised_by_role="IMPLEMENTING_AGENCY",
        request_type="PAYMENT_REQUEST",
        title="Milestone 2 Running Contractor Bill Claim",
        description="Civil construction 80% complete as verified in MB.",
        priority="MEDIUM"
    )
    assert ia_req["target_role"] == "DISTRICT_AUTHORITY"
    assert ia_req["raised_by_role"] == "IMPLEMENTING_AGENCY"
    print(f"✓ Created IA Payment Request {ia_req['request_id']} routed to DA.")

    # TEST 4: DA -> MoSPI Escalation
    print("\n[TEST 4] DA -> MoSPI National Escalation...")
    esc = engine.create_request(
        work_id="172106",
        raised_by_role="DISTRICT_AUTHORITY",
        request_type="ADMINISTRATIVE_ESCALATION",
        title="Inter-Departmental Allocation Dispute",
        description="Escalating execution impasse to MoSPI Central Surveillance.",
        priority="CRITICAL"
    )
    assert esc["target_role"] == "MOSPI"
    assert esc["target_department"] == "MoSPI Central Nodal Monitoring Cell"
    print(f"✓ Created DA Escalation {esc['request_id']} routed to MoSPI Central.")

    # TEST 5: Security & Role Permission Enforcement
    print("\n[TEST 5] Role Security & Permissions Check...")
    # Citizen cannot resolve
    try:
        engine.update_request_status(req_id, actor_role="CITIZEN", new_status="RESOLVED")
        assert False, "Security failure: Citizen was allowed to resolve a request!"
    except PermissionError as pe:
        print(f"✓ Blocked unauthorized Citizen resolution: {pe}")

    # Citizen cannot create OVERSIGHT_DIRECTIVE
    try:
        engine.create_request(
            work_id="172106",
            raised_by_role="CITIZEN",
            request_type="OVERSIGHT_DIRECTIVE",
            title="Fake Directive",
            description="Trying unauthorized directive"
        )
        assert False, "Security failure: Citizen created MoSPI directive!"
    except PermissionError as pe:
        print(f"✓ Blocked unauthorized request type for Citizen: {pe}")

    # Non-existent work ID check
    try:
        engine.create_request(
            work_id="99999999999",
            raised_by_role="CITIZEN",
            request_type="GRIEVANCE",
            title="Non existent",
            description="Test"
        )
        assert False, "Failure: Allowed creation on non-existent work!"
    except ValueError as ve:
        print(f"✓ Rejected non-existent work ID: {ve}")

    # TEST 6: Dynamic Counts
    print("\n[TEST 6] Real-time Counts Test (No fake badges)...")
    counts = engine.get_counts(role="DISTRICT_AUTHORITY")
    assert counts["total"] > 0
    assert "pending_action" in counts
    print(f"✓ Counts verified: {counts}")

    print("\n" + "=" * 60)
    print("ALL TESTS PASSED SUCCESSFULLY! ✓")
    print("=" * 60)


if __name__ == "__main__":
    run_tests()
