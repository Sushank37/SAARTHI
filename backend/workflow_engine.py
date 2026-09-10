"""
SAARTHI — Centralized Workflow Request Engine
Handles cross-role request routing, status transitions, role permissions,
immutable audit trails, and atomic file persistence.
Zero mock business data: every request attaches to a canonical work record
from the master MPLADS dataset.
"""

import os
import json
import uuid
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Any
import pandas as pd

BASE_DIR = Path(__file__).resolve().parent
WORKFLOW_FILE = BASE_DIR / "workflow_requests.json"

# Supported Request Types
REQUEST_TYPES = {
    "GRIEVANCE": {
        "label": "Public Grievance / Defect Report",
        "allowed_requesters": ["CITIZEN"],
        "default_target": "DISTRICT_AUTHORITY",
        "description": "Citizen reports on-ground defect, delay, or substandard asset."
    },
    "PUBLIC_VERIFICATION": {
        "label": "Citizen Social Audit Verification",
        "allowed_requesters": ["CITIZEN"],
        "default_target": "DISTRICT_AUTHORITY",
        "description": "Citizen confirms community asset completion and functionality."
    },
    "PAYMENT_REQUEST": {
        "label": "Payment / Running Bill Claim",
        "allowed_requesters": ["IMPLEMENTING_AGENCY"],
        "default_target": "DISTRICT_AUTHORITY",
        "description": "Executing agency submits contractor running bill for DA clearance."
    },
    "TIME_EXTENSION": {
        "label": "Time Extension (EOT) Application",
        "allowed_requesters": ["IMPLEMENTING_AGENCY"],
        "default_target": "DISTRICT_AUTHORITY",
        "description": "IA requests formal extension of completion deadline with reasons."
    },
    "MEASUREMENT_BOOK_SUBMISSION": {
        "label": "Measurement Book (MB) Entry",
        "allowed_requesters": ["IMPLEMENTING_AGENCY"],
        "default_target": "DISTRICT_AUTHORITY",
        "description": "IA records and submits official MB measurement measurements."
    },
    "CONSTITUENCY_INQUIRY": {
        "label": "Parliamentary Expedited Inquiry",
        "allowed_requesters": ["MP"],
        "default_target": "DISTRICT_AUTHORITY",
        "description": "Hon'ble MP requests expedited review / status from Collector."
    },
    "ADMINISTRATIVE_NOTICE": {
        "label": "Collectorate Explanation Notice",
        "allowed_requesters": ["DISTRICT_AUTHORITY"],
        "default_target": "IMPLEMENTING_AGENCY",
        "description": "District Authority issues formal notice to defaulting agency."
    },
    "ADMINISTRATIVE_ESCALATION": {
        "label": "National Administrative Escalation",
        "allowed_requesters": ["DISTRICT_AUTHORITY"],
        "default_target": "MOSPI",
        "description": "Collectorate escalates severe dispute / default to MoSPI Central."
    },
    "OVERSIGHT_DIRECTIVE": {
        "label": "MoSPI Central Directive",
        "allowed_requesters": ["MOSPI"],
        "default_target": "DISTRICT_AUTHORITY",
        "description": "Central Ministry issues compliance directive to District Nodal."
    },
}

# Status Lifecycle
STATUS_LIFECYCLE = [
    "SUBMITTED",
    "UNDER_REVIEW",
    "ACTION_TAKEN",
    "RESOLVED",
    "REJECTED"
]

# Role Permissions for Status Transitions
STATUS_TRANSITION_PERMISSIONS = {
    "DISTRICT_AUTHORITY": {
        "allowed_transitions": ["UNDER_REVIEW", "ACTION_TAKEN", "RESOLVED", "REJECTED"],
        "applies_to_targets": ["DISTRICT_AUTHORITY"]
    },
    "MOSPI": {
        "allowed_transitions": ["UNDER_REVIEW", "ACTION_TAKEN", "RESOLVED", "REJECTED"],
        "applies_to_targets": ["MOSPI"]
    },
    "IMPLEMENTING_AGENCY": {
        "allowed_transitions": ["UNDER_REVIEW", "ACTION_TAKEN", "RESOLVED"],
        "applies_to_targets": ["IMPLEMENTING_AGENCY"]
    },
    "CITIZEN": {
        "allowed_transitions": [],  # Citizens cannot alter workflow status
        "applies_to_targets": []
    },
    "MP": {
        "allowed_transitions": [],  # MPs do not administratively clear executive requests
        "applies_to_targets": []
    }
}


class WorkflowEngine:
    def __init__(self, dataset_df: Optional[pd.DataFrame] = None):
        self.df = dataset_df
        self._ensure_storage()

    def set_dataset(self, df: pd.DataFrame):
        self.df = df

    def _ensure_storage(self):
        """Ensure workflow requests storage file exists."""
        if not WORKFLOW_FILE.exists():
            try:
                with open(WORKFLOW_FILE, "w", encoding="utf-8") as f:
                    json.dump([], f, indent=2)
            except Exception as e:
                print(f"[WorkflowEngine] Error creating workflow file: {e}")

    def load_requests(self) -> List[Dict[str, Any]]:
        """Load all requests from persistent storage."""
        self._ensure_storage()
        try:
            with open(WORKFLOW_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
                return data if isinstance(data, list) else []
        except Exception as e:
            print(f"[WorkflowEngine] Error reading workflow file: {e}")
            return []

    def save_requests(self, requests_list: List[Dict[str, Any]]) -> bool:
        """Atomically persist requests to file."""
        temp_file = WORKFLOW_FILE.with_suffix(".tmp")
        try:
            with open(temp_file, "w", encoding="utf-8") as f:
                json.dump(requests_list, f, indent=2, ensure_ascii=False)
            temp_file.replace(WORKFLOW_FILE)
            return True
        except Exception as e:
            print(f"[WorkflowEngine] Error saving workflow requests: {e}")
            if temp_file.exists():
                try:
                    temp_file.unlink()
                except Exception:
                    pass
            return False

    def lookup_canonical_work(self, raw_work_id: Any) -> Optional[Dict[str, Any]]:
        """
        Locate canonical work record in master dataset.
        Handles numeric float conversion, string matching, and WORK_RECOMMENDATION_DTL_ID.
        """
        if self.df is None or self.df.empty:
            return None

        clean_str = str(raw_work_id).strip()
        if not clean_str:
            return None

        # Try matching WORK_ID numerically
        try:
            val_num = float(clean_str)
            if "WORK_ID" in self.df.columns:
                matches = self.df[self.df["WORK_ID"] == val_num]
                if not matches.empty:
                    row = matches.iloc[0]
                    return self._clean_work_record(row)
            if "WORK_RECOMMENDATION_DTL_ID" in self.df.columns:
                matches = self.df[self.df["WORK_RECOMMENDATION_DTL_ID"] == val_num]
                if not matches.empty:
                    row = matches.iloc[0]
                    return self._clean_work_record(row)
        except ValueError:
            pass

        # String match fallback
        if "WORK_ID" in self.df.columns:
            matches = self.df[self.df["WORK_ID"].astype(str).str.strip().eq(clean_str)]
            if not matches.empty:
                return self._clean_work_record(matches.iloc[0])

        if "WORK_RECOMMENDATION_DTL_ID" in self.df.columns:
            matches = self.df[self.df["WORK_RECOMMENDATION_DTL_ID"].astype(str).str.strip().eq(clean_str)]
            if not matches.empty:
                return self._clean_work_record(matches.iloc[0])

        return None

    def _clean_work_record(self, row: pd.Series) -> Dict[str, Any]:
        """Convert a row to a clean dict with native types."""
        res = {}
        for col, val in row.items():
            if pd.isna(val):
                res[col] = None
            elif isinstance(val, (int, float)) and not pd.isna(val):
                res[col] = int(val) if float(val).is_integer() else round(float(val), 2)
            else:
                res[col] = str(val).strip()
        return res

    def generate_request_id(self, existing_requests: List[Dict[str, Any]]) -> str:
        """Generate human-readable sequential Request ID like REQ-2026-0001."""
        prefix = "REQ-2026-"
        highest_num = 0
        for r in existing_requests:
            rid = str(r.get("request_id", ""))
            if rid.startswith(prefix):
                try:
                    num = int(rid[len(prefix):])
                    if num > highest_num:
                        highest_num = num
                except ValueError:
                    pass
        return f"{prefix}{highest_num + 1:04d}"

    def create_request(
        self,
        work_id: Any,
        raised_by_role: str,
        request_type: str,
        title: str,
        description: str,
        priority: str = "MEDIUM",
        raised_by_identity: Optional[str] = None,
        related_data: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Create and persist a new cross-role request.
        Validates work_id, requester permissions, routes target queue deterministically.
        """
        req_type_upper = str(request_type).strip().upper()
        if req_type_upper not in REQUEST_TYPES:
            raise ValueError(f"Invalid request_type: {request_type}. Must be one of {list(REQUEST_TYPES.keys())}")

        config = REQUEST_TYPES[req_type_upper]
        role_upper = str(raised_by_role).strip().upper()
        if role_upper not in config["allowed_requesters"]:
            raise PermissionError(
                f"Role '{raised_by_role}' is not authorized to submit request type '{req_type_upper}'. "
                f"Allowed roles: {config['allowed_requesters']}"
            )

        # Look up canonical work record
        work_record = self.lookup_canonical_work(work_id)
        if not work_record:
            raise ValueError(f"Work ID '{work_id}' not found in canonical master dataset.")

        canonical_work_id = str(work_record.get("WORK_ID") or work_record.get("WORK_RECOMMENDATION_DTL_ID"))
        work_desc = work_record.get("WORK_DESCRIPTION") or "MPLADS Development Project"
        work_state = work_record.get("STATE_NAME") or "Not Available"
        work_constituency = work_record.get("CONSTITUENCY") or "Constituency"
        work_ida = work_record.get("IDA_NAME") or "District Nodal Authority"
        work_stage = work_record.get("WORK_STAGE") or "In Progress"
        sanction_amount = work_record.get("SANCTION_AMOUNT") or work_record.get("RECOMMENDED_AMOUNT") or 0

        # Destination routing
        target_role = config["default_target"]
        if target_role == "DISTRICT_AUTHORITY":
            target_dept = f"District Collectorate ({work_ida})"
        elif target_role == "MOSPI":
            target_dept = "MoSPI Central Nodal Monitoring Cell"
        elif target_role == "IMPLEMENTING_AGENCY":
            target_dept = f"Implementing Agency Queue ({work_ida})"
        else:
            target_dept = "Public Administration Queue"

        # Identity resolution (Real identities only, never fake officer names)
        if not raised_by_identity:
            if role_upper == "CITIZEN":
                raised_by_identity = "Public Social Audit Citizen"
            elif role_upper == "IMPLEMENTING_AGENCY":
                raised_by_identity = work_ida
            elif role_upper == "MP":
                mp_name = work_record.get("MP_NAME")
                raised_by_identity = f"Hon'ble MP ({mp_name})" if mp_name else "Hon'ble Member of Parliament"
            elif role_upper == "DISTRICT_AUTHORITY":
                raised_by_identity = f"District Magistrate / Collectorate ({work_constituency})"
            elif role_upper == "MOSPI":
                raised_by_identity = "MoSPI Central Nodal Authority"
            else:
                raised_by_identity = f"{role_upper} Officer"

        now_iso = datetime.now().isoformat()
        now_display = datetime.now().strftime("%Y-%m-%d %H:%M")

        existing_requests = self.load_requests()
        new_request_id = self.generate_request_id(existing_requests)

        new_request = {
            "request_id": new_request_id,
            "work_id": canonical_work_id,
            "work_title": work_desc,
            "work_stage": work_stage,
            "state_name": work_state,
            "constituency": work_constituency,
            "ida_name": work_ida,
            "sanction_amount": sanction_amount,
            "request_type": req_type_upper,
            "request_type_label": config["label"],
            "title": str(title).strip() or config["label"],
            "description": str(description).strip(),
            "priority": str(priority).strip().upper() if priority else "MEDIUM",
            "status": "SUBMITTED",
            "raised_by_role": role_upper,
            "raised_by_identity": raised_by_identity,
            "target_role": target_role,
            "target_department": target_dept,
            "created_at": now_iso,
            "updated_at": now_iso,
            "related_data": related_data or {},
            "timeline": [
                {
                    "status": "SUBMITTED",
                    "timestamp": now_display,
                    "role": role_upper,
                    "actor": raised_by_identity,
                    "note": f"Request registered and routed to {target_dept}."
                }
            ]
        }

        # Prepend so newest is first
        existing_requests.insert(0, new_request)
        if not self.save_requests(existing_requests):
            raise IOError("Failed to persist request to disk.")

        return new_request

    def get_request_by_id(self, request_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve single request by ID."""
        requests = self.load_requests()
        req_id_upper = str(request_id).strip().upper()
        for r in requests:
            if str(r.get("request_id", "")).upper() == req_id_upper:
                return r
        return None

    def query_requests(
        self,
        role: Optional[str] = None,
        target_role: Optional[str] = None,
        raised_by_role: Optional[str] = None,
        work_id: Optional[str] = None,
        status: Optional[str] = None,
        request_type: Optional[str] = None,
        ida_name: Optional[str] = None,
        search_query: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Filter requests matching specified criteria."""
        requests = self.load_requests()
        filtered = requests

        if role:
            role_u = role.strip().upper()
            if not target_role and not raised_by_role:
                filtered = [r for r in filtered if r.get("target_role") == role_u or r.get("raised_by_role") == role_u]

        if target_role:
            tr_u = target_role.strip().upper()
            filtered = [r for r in filtered if r.get("target_role") == tr_u]

        if raised_by_role:
            rb_u = raised_by_role.strip().upper()
            filtered = [r for r in filtered if r.get("raised_by_role") == rb_u]

        if work_id:
            w_str = str(work_id).strip().lower()
            filtered = [r for r in filtered if w_str in str(r.get("work_id", "")).lower()]

        if status:
            s_u = status.strip().upper()
            if s_u != "ALL":
                filtered = [r for r in filtered if r.get("status") == s_u]

        if request_type:
            rt_u = request_type.strip().upper()
            if rt_u != "ALL":
                filtered = [r for r in filtered if r.get("request_type") == rt_u]

        if ida_name and ida_name.strip().upper() != "ALL":
            ida_clean = ida_name.strip().lower()
            filtered = [r for r in filtered if ida_clean in str(r.get("ida_name", "")).lower()]

        if search_query:
            sq = search_query.strip().lower()
            filtered = [
                r for r in filtered
                if sq in str(r.get("request_id", "")).lower()
                or sq in str(r.get("work_id", "")).lower()
                or sq in str(r.get("title", "")).lower()
                or sq in str(r.get("description", "")).lower()
                or sq in str(r.get("ida_name", "")).lower()
            ]

        return filtered

    def update_request_status(
        self,
        request_id: str,
        actor_role: str,
        new_status: str,
        note: Optional[str] = None,
        actor_identity: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Transition request status with permission check and audit event logging.
        """
        requests = self.load_requests()
        req_id_upper = str(request_id).strip().upper()
        target_idx = None
        target_req = None

        for idx, r in enumerate(requests):
            if str(r.get("request_id", "")).upper() == req_id_upper:
                target_idx = idx
                target_req = r
                break

        if target_req is None:
            raise ValueError(f"Request '{request_id}' not found.")

        new_status_u = str(new_status).strip().upper()
        if new_status_u not in STATUS_LIFECYCLE:
            raise ValueError(f"Invalid status: {new_status}. Must be one of {STATUS_LIFECYCLE}")

        actor_role_u = str(actor_role).strip().upper()
        perm_config = STATUS_TRANSITION_PERMISSIONS.get(actor_role_u)
        if not perm_config or new_status_u not in perm_config["allowed_transitions"]:
            raise PermissionError(
                f"Role '{actor_role}' is not authorized to set status '{new_status_u}'. "
                f"Allowed transitions: {perm_config['allowed_transitions'] if perm_config else []}"
            )

        # Check that actor role is the target role (or MoSPI central oversight)
        target_role = target_req.get("target_role")
        if target_role != actor_role_u and actor_role_u != "MOSPI":
            raise PermissionError(
                f"Role '{actor_role}' cannot action a request targeted to '{target_role}'."
            )

        now_iso = datetime.now().isoformat()
        now_display = datetime.now().strftime("%Y-%m-%d %H:%M")

        if not actor_identity:
            actor_identity = f"{actor_role_u} Authority"

        action_note = note.strip() if note else f"Status advanced to {new_status_u}."

        target_req["status"] = new_status_u
        target_req["updated_at"] = now_iso
        target_req.setdefault("timeline", []).append({
            "status": new_status_u,
            "timestamp": now_display,
            "role": actor_role_u,
            "actor": actor_identity,
            "note": action_note
        })

        requests[target_idx] = target_req
        if not self.save_requests(requests):
            raise IOError("Failed to persist updated request to disk.")

        return target_req

    def get_counts(self, role: Optional[str] = None, ida_name: Optional[str] = None) -> Dict[str, int]:
        """
        Calculate real-time counts of requests by status.
        Prevents hardcoded fake badges!
        """
        requests = self.query_requests(role=role, ida_name=ida_name)
        counts = {
            "total": len(requests),
            "submitted": 0,
            "under_review": 0,
            "action_taken": 0,
            "resolved": 0,
            "rejected": 0,
            "pending_action": 0
        }

        for r in requests:
            st = str(r.get("status", "")).upper()
            if st == "SUBMITTED":
                counts["submitted"] += 1
                counts["pending_action"] += 1
            elif st == "UNDER_REVIEW":
                counts["under_review"] += 1
                counts["pending_action"] += 1
            elif st == "ACTION_TAKEN":
                counts["action_taken"] += 1
            elif st == "RESOLVED":
                counts["resolved"] += 1
            elif st == "REJECTED":
                counts["rejected"] += 1

        return counts
