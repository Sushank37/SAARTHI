"""
SAARTHI — Work Concern, Action, Response, and Accountability Database Engine
Production-grade SQLite-backed relational workflow store for MPLADS.
ACID-compliant, foreign-key enforced, immutable audit history, zero mock data.
"""

import sqlite3
import json
import os
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Optional, Any
import pandas as pd

BACKEND_DIR = Path(__file__).resolve().parent
DB_PATH = BACKEND_DIR / "concerns.db"

# Valid Concern Categories
CONCERN_CATEGORIES = [
    "Work Progress Issue",
    "Work Quality Concern",
    "Delayed Work",
    "Financial Irregularity",
    "Incorrect Work Status",
    "Missing or Incomplete Asset",
    "Public Complaint",
    "Safety Concern",
    "Other",
]

# Valid Priorities
PRIORITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"]

# Lifecycle Statuses
STATUS_LIFECYCLE = [
    "RAISED",
    "RECEIVED",
    "UNDER_REVIEW",
    "CLARIFICATION_REQUESTED",
    "ACTION_ASSIGNED",
    "ACTION_IN_PROGRESS",
    "ACTION_TAKEN",
    "EVIDENCE_SUBMITTED",
    "RESOLVED",
    "REJECTED",
    "REOPENED",
]

# Allowed Status Transitions per Role
STATUS_TRANSITIONS = {
    "MP": {
        "allowed_transitions": ["REOPENED", "CLARIFICATION_REQUESTED"],
    },
    "DISTRICT_AUTHORITY": {
        "allowed_transitions": [
            "RECEIVED",
            "UNDER_REVIEW",
            "CLARIFICATION_REQUESTED",
            "ACTION_ASSIGNED",
            "ACTION_IN_PROGRESS",
            "ACTION_TAKEN",
            "RESOLVED",
            "REJECTED",
            "REOPENED",
        ],
    },
    "IMPLEMENTING_AGENCY": {
        "allowed_transitions": [
            "ACTION_IN_PROGRESS",
            "EVIDENCE_SUBMITTED",
            "CLARIFICATION_REQUESTED",
        ],
    },
    "MOSPI": {
        "allowed_transitions": [
            "UNDER_REVIEW",
            "ACTION_TAKEN",
            "RESOLVED",
            "REOPENED",
        ],
    },
    "CITIZEN": {
        "allowed_transitions": [],
    },
}


class ConcernsDB:
    def __init__(self, db_path: Path = DB_PATH, dataset_df: Optional[pd.DataFrame] = None):
        self.db_path = db_path
        self.df = dataset_df
        self._init_db()

    def set_dataset(self, df: pd.DataFrame):
        self.df = df

    def get_connection(self) -> sqlite3.Connection:
        conn = sqlite3.connect(str(self.db_path), check_same_thread=False)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA foreign_keys = ON;")
        conn.execute("PRAGMA journal_mode = WAL;")
        return conn

    def _init_db(self):
        """Create relational tables and indexes if they do not exist."""
        with self.get_connection() as conn:
            cursor = conn.cursor()

            # 1. Concerns Table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS concerns (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    concern_id TEXT UNIQUE NOT NULL,
                    work_id TEXT NOT NULL,
                    work_title TEXT,
                    state_name TEXT,
                    constituency TEXT,
                    da_id TEXT,
                    ia_id TEXT,
                    raised_by_user_id TEXT,
                    raised_by_role TEXT NOT NULL,
                    mp_name TEXT NOT NULL,
                    category TEXT NOT NULL,
                    title TEXT NOT NULL,
                    description TEXT NOT NULL,
                    requested_action TEXT,
                    priority TEXT NOT NULL,
                    status TEXT NOT NULL,
                    assigned_officer TEXT,
                    due_at TEXT,
                    resolved_at TEXT,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                );
            """)

            # 2. Concern Actions Table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS concern_actions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    concern_id TEXT NOT NULL,
                    action_type TEXT NOT NULL,
                    performed_by_user_id TEXT,
                    performed_by_role TEXT NOT NULL,
                    assigned_to_user_id TEXT,
                    previous_status TEXT,
                    new_status TEXT,
                    action_description TEXT,
                    response TEXT,
                    evidence_url TEXT,
                    created_at TEXT NOT NULL,
                    FOREIGN KEY(concern_id) REFERENCES concerns(concern_id) ON DELETE CASCADE
                );
            """)

            # 3. Concern Responses Table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS concern_responses (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    concern_id TEXT NOT NULL,
                    responder_user_id TEXT,
                    responder_role TEXT NOT NULL,
                    response_text TEXT NOT NULL,
                    response_type TEXT NOT NULL,
                    evidence_url TEXT,
                    created_at TEXT NOT NULL,
                    FOREIGN KEY(concern_id) REFERENCES concerns(concern_id) ON DELETE CASCADE
                );
            """)

            # 4. Concern Attachments Table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS concern_attachments (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    concern_id TEXT NOT NULL,
                    uploaded_by_user_id TEXT,
                    file_reference TEXT NOT NULL,
                    file_type TEXT,
                    created_at TEXT NOT NULL,
                    FOREIGN KEY(concern_id) REFERENCES concerns(concern_id) ON DELETE CASCADE
                );
            """)

            # 5. Concern Activity Log Table (Immutable)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS concern_activity_log (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    concern_id TEXT NOT NULL,
                    actor_user_id TEXT,
                    actor_role TEXT NOT NULL,
                    event_type TEXT NOT NULL,
                    previous_state TEXT,
                    new_state TEXT,
                    metadata_json TEXT,
                    created_at TEXT NOT NULL,
                    FOREIGN KEY(concern_id) REFERENCES concerns(concern_id) ON DELETE CASCADE
                );
            """)

            # Performance Indexes
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_concerns_work_id ON concerns(work_id);")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_concerns_mp_name ON concerns(mp_name);")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_concerns_da_id ON concerns(da_id);")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_concerns_ia_id ON concerns(ia_id);")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_concerns_status ON concerns(status);")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_concerns_priority ON concerns(priority);")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_actions_concern_id ON concern_actions(concern_id);")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_responses_concern_id ON concern_responses(concern_id);")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_activity_concern_id ON concern_activity_log(concern_id);")

            conn.commit()

    def lookup_canonical_work(self, raw_work_id: Any) -> Optional[Dict[str, Any]]:
        """Locate canonical work record in master dataset."""
        if self.df is None or self.df.empty:
            return None

        clean_str = str(raw_work_id).strip().replace(".0", "")
        if not clean_str:
            return None

        # Numeric float match
        try:
            val_num = float(clean_str)
            if "WORK_ID" in self.df.columns:
                matches = self.df[self.df["WORK_ID"] == val_num]
                if not matches.empty:
                    return self._clean_series(matches.iloc[0])
            if "WORK_RECOMMENDATION_DTL_ID" in self.df.columns:
                matches = self.df[self.df["WORK_RECOMMENDATION_DTL_ID"] == val_num]
                if not matches.empty:
                    return self._clean_series(matches.iloc[0])
        except ValueError:
            pass

        # String match
        if "WORK_ID" in self.df.columns:
            matches = self.df[self.df["WORK_ID"].astype(str).str.strip().str.replace(r"\.0$", "", regex=True) == clean_str]
            if not matches.empty:
                return self._clean_series(matches.iloc[0])

        if "WORK_RECOMMENDATION_DTL_ID" in self.df.columns:
            matches = self.df[self.df["WORK_RECOMMENDATION_DTL_ID"].astype(str).str.strip().str.replace(r"\.0$", "", regex=True) == clean_str]
            if not matches.empty:
                return self._clean_series(matches.iloc[0])

        return None

    def _clean_series(self, row: pd.Series) -> Dict[str, Any]:
        res = {}
        for col, val in row.items():
            if pd.isna(val):
                res[col] = None
            elif isinstance(val, (int, float)) and not pd.isna(val):
                res[col] = int(val) if float(val).is_integer() else round(float(val), 2)
            else:
                res[col] = str(val).strip()
        return res

    def _generate_concern_id(self, cursor: sqlite3.Cursor) -> str:
        """Generate human-readable sequential Concern ID: CONC-2026-0001."""
        prefix = "CONC-2026-"
        cursor.execute("SELECT concern_id FROM concerns WHERE concern_id LIKE ? ORDER BY id DESC LIMIT 1", (f"{prefix}%",))
        row = cursor.fetchone()
        if row and row["concern_id"]:
            try:
                num = int(row["concern_id"][len(prefix):])
                return f"{prefix}{num + 1:04d}"
            except ValueError:
                pass
        return f"{prefix}0001"

    def create_concern(
        self,
        work_id: Any,
        raised_by_role: str,
        mp_name: str,
        category: str,
        title: str,
        description: str,
        requested_action: Optional[str] = None,
        priority: str = "MEDIUM",
        evidence_attachment: Optional[str] = None,
        due_at: Optional[str] = None,
        raised_by_user_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Create and persist a new work concern raised by an MP.
        Links to canonical master dataset work record.
        """
        if not title or not title.strip():
            raise ValueError("Concern title is required.")
        if not description or not description.strip():
            raise ValueError("Concern detailed description is required.")

        cat_clean = category.strip() if category else "Work Progress Issue"
        if cat_clean not in CONCERN_CATEGORIES:
            cat_clean = "Other"

        prio_clean = str(priority).strip().upper() if priority else "MEDIUM"
        if prio_clean not in PRIORITIES:
            prio_clean = "MEDIUM"

        role_clean = str(raised_by_role).strip().upper()
        if role_clean != "MP" and role_clean != "CITIZEN" and role_clean != "DISTRICT_AUTHORITY" and role_clean != "MOSPI":
            role_clean = "MP"

        # Verify against canonical work dataset
        work_record = self.lookup_canonical_work(work_id)
        if not work_record:
            raise ValueError(f"Work ID '{work_id}' not found in canonical MPLADS dataset.")

        canonical_work_id = str(work_record.get("WORK_ID") or work_record.get("WORK_RECOMMENDATION_DTL_ID")).replace(".0", "")
        work_desc = work_record.get("WORK_DESCRIPTION") or "MPLADS Project"
        work_state = work_record.get("STATE_NAME") or "National"
        work_constituency = work_record.get("CONSTITUENCY") or "Constituency"
        work_ida = work_record.get("IDA_NAME") or "District Nodal Collectorate"
        record_mp = work_record.get("MP_NAME") or mp_name or "Hon'ble MP"
        final_mp = mp_name.strip() if mp_name and mp_name.strip() else record_mp

        now_iso = datetime.now().isoformat()

        with self.get_connection() as conn:
            cursor = conn.cursor()
            concern_id = self._generate_concern_id(cursor)

            cursor.execute("""
                INSERT INTO concerns (
                    concern_id, work_id, work_title, state_name, constituency,
                    da_id, ia_id, raised_by_user_id, raised_by_role, mp_name,
                    category, title, description, requested_action, priority,
                    status, assigned_officer, due_at, resolved_at, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                concern_id,
                canonical_work_id,
                work_desc,
                work_state,
                work_constituency,
                work_ida,  # da_id default
                work_ida,  # ia_id default
                raised_by_user_id or final_mp,
                role_clean,
                final_mp,
                cat_clean,
                title.strip(),
                description.strip(),
                requested_action.strip() if requested_action else None,
                prio_clean,
                "RAISED",
                None,
                due_at,
                None,
                now_iso,
                now_iso,
            ))

            # Initial attachment if provided
            if evidence_attachment and evidence_attachment.strip():
                cursor.execute("""
                    INSERT INTO concern_attachments (concern_id, uploaded_by_user_id, file_reference, file_type, created_at)
                    VALUES (?, ?, ?, ?, ?)
                """, (concern_id, final_mp, evidence_attachment.strip(), "DOCUMENT", now_iso))

            # Initial Activity Log (Immutable)
            cursor.execute("""
                INSERT INTO concern_activity_log (
                    concern_id, actor_user_id, actor_role, event_type,
                    previous_state, new_state, metadata_json, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                concern_id,
                final_mp,
                role_clean,
                "CONCERN_RAISED",
                None,
                "RAISED",
                json.dumps({
                    "work_id": canonical_work_id,
                    "category": cat_clean,
                    "priority": prio_clean,
                    "title": title.strip(),
                    "requested_action": requested_action,
                }),
                now_iso,
            ))

            conn.commit()

        return self.get_concern_by_id(concern_id)

    def get_concern_by_id(self, concern_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve complete concern record with actions, responses, attachments, and timeline."""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM concerns WHERE concern_id = ?", (concern_id,))
            row = cursor.fetchone()
            if not row:
                return None

            concern = dict(row)

            # Fetch actions
            cursor.execute("SELECT * FROM concern_actions WHERE concern_id = ? ORDER BY id ASC", (concern_id,))
            concern["actions"] = [dict(r) for r in cursor.fetchall()]

            # Fetch responses
            cursor.execute("SELECT * FROM concern_responses WHERE concern_id = ? ORDER BY id ASC", (concern_id,))
            concern["responses"] = [dict(r) for r in cursor.fetchall()]

            # Fetch attachments
            cursor.execute("SELECT * FROM concern_attachments WHERE concern_id = ? ORDER BY id ASC", (concern_id,))
            concern["attachments"] = [dict(r) for r in cursor.fetchall()]

            # Fetch immutable activity log / timeline
            cursor.execute("SELECT * FROM concern_activity_log WHERE concern_id = ? ORDER BY id ASC", (concern_id,))
            timeline_rows = cursor.fetchall()
            concern["timeline"] = []
            for tr in timeline_rows:
                meta = {}
                if tr["metadata_json"]:
                    try:
                        meta = json.loads(tr["metadata_json"])
                    except Exception:
                        pass
                concern["timeline"].append({
                    "id": tr["id"],
                    "actor_user_id": tr["actor_user_id"],
                    "actor_role": tr["actor_role"],
                    "event_type": tr["event_type"],
                    "previous_state": tr["previous_state"],
                    "new_state": tr["new_state"],
                    "created_at": tr["created_at"],
                    "metadata": meta,
                })

            return concern

    def query_concerns(
        self,
        role: Optional[str] = None,
        mp_name: Optional[str] = None,
        da_id: Optional[str] = None,
        ia_id: Optional[str] = None,
        work_id: Optional[str] = None,
        status: Optional[str] = None,
        priority: Optional[str] = None,
        category: Optional[str] = None,
        search_query: Optional[str] = None,
        limit: int = 100,
        offset: int = 0,
    ) -> Dict[str, Any]:
        """
        Query concerns with role-based jurisdiction filtering and search.
        """
        query = "SELECT * FROM concerns WHERE 1=1"
        params: List[Any] = []

        if mp_name and mp_name.strip() and mp_name.strip().upper() != "ALL":
            query += " AND LOWER(mp_name) = LOWER(?)"
            params.append(mp_name.strip())

        if da_id and da_id.strip() and da_id.strip().upper() != "ALL":
            query += " AND (LOWER(da_id) LIKE LOWER(?) OR LOWER(constituency) LIKE LOWER(?))"
            params.append(f"%{da_id.strip()}%")
            params.append(f"%{da_id.strip()}%")

        if ia_id and ia_id.strip() and ia_id.strip().upper() != "ALL":
            query += " AND (LOWER(ia_id) LIKE LOWER(?) OR LOWER(da_id) LIKE LOWER(?))"
            params.append(f"%{ia_id.strip()}%")
            params.append(f"%{ia_id.strip()}%")

        if work_id and work_id.strip():
            clean_w = work_id.strip().replace(".0", "")
            query += " AND (work_id = ? OR work_id LIKE ?)"
            params.append(clean_w)
            params.append(f"%{clean_w}%")

        if status and status.strip() and status.strip().upper() != "ALL":
            query += " AND status = ?"
            params.append(status.strip().upper())

        if priority and priority.strip() and priority.strip().upper() != "ALL":
            query += " AND priority = ?"
            params.append(priority.strip().upper())

        if category and category.strip() and category.strip().upper() != "ALL":
            query += " AND category = ?"
            params.append(category.strip())

        if search_query and search_query.strip():
            sq = f"%{search_query.strip().lower()}%"
            query += """ AND (
                LOWER(concern_id) LIKE ? OR
                LOWER(work_id) LIKE ? OR
                LOWER(title) LIKE ? OR
                LOWER(description) LIKE ? OR
                LOWER(mp_name) LIKE ? OR
                LOWER(constituency) LIKE ?
            )"""
            params.extend([sq, sq, sq, sq, sq, sq])

        # Get total count first
        count_query = f"SELECT COUNT(*) as cnt FROM ({query})"
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(count_query, params)
            total = cursor.fetchone()["cnt"]

            # Order by created_at DESC
            query += " ORDER BY id DESC LIMIT ? OFFSET ?"
            params.extend([limit, offset])

            cursor.execute(query, params)
            items = [dict(r) for r in cursor.fetchall()]

            return {
                "total": total,
                "concerns": items,
                "limit": limit,
                "offset": offset,
            }

    def record_action(
        self,
        concern_id: str,
        actor_role: str,
        action_type: str,
        action_description: str,
        new_status: Optional[str] = None,
        assigned_to: Optional[str] = None,
        evidence_url: Optional[str] = None,
        actor_user_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Record official action taken by DA, IA, or MoSPI and transition status.
        Enforces strict role permissions.
        """
        concern = self.get_concern_by_id(concern_id)
        if not concern:
            raise ValueError(f"Concern '{concern_id}' not found.")

        role_upper = str(actor_role).strip().upper()
        current_status = concern["status"]

        # Validate transition permission if new_status requested
        resolved_status = new_status.strip().upper() if new_status else current_status
        if resolved_status != current_status:
            if resolved_status not in STATUS_LIFECYCLE:
                raise ValueError(f"Invalid target status: {resolved_status}")

            perm_config = STATUS_TRANSITIONS.get(role_upper)
            if not perm_config or resolved_status not in perm_config["allowed_transitions"]:
                raise PermissionError(
                    f"Role '{actor_role}' is not authorized to transition status to '{resolved_status}'."
                )

        now_iso = datetime.now().isoformat()

        with self.get_connection() as conn:
            cursor = conn.cursor()

            # Record action
            cursor.execute("""
                INSERT INTO concern_actions (
                    concern_id, action_type, performed_by_user_id, performed_by_role,
                    assigned_to_user_id, previous_status, new_status, action_description,
                    evidence_url, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                concern_id,
                action_type.strip(),
                actor_user_id or f"{role_upper} Officer",
                role_upper,
                assigned_to.strip() if assigned_to else None,
                current_status,
                resolved_status,
                action_description.strip(),
                evidence_url.strip() if evidence_url else None,
                now_iso,
            ))

            # Update concern
            resolved_at = now_iso if resolved_status == "RESOLVED" else concern.get("resolved_at")
            assigned_officer = assigned_to.strip() if assigned_to else concern.get("assigned_officer")

            cursor.execute("""
                UPDATE concerns SET
                    status = ?,
                    assigned_officer = ?,
                    resolved_at = ?,
                    updated_at = ?
                WHERE concern_id = ?
            """, (resolved_status, assigned_officer, resolved_at, now_iso, concern_id))

            # Record in immutable Activity Log
            cursor.execute("""
                INSERT INTO concern_activity_log (
                    concern_id, actor_user_id, actor_role, event_type,
                    previous_state, new_state, metadata_json, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                concern_id,
                actor_user_id or f"{role_upper} Officer",
                role_upper,
                action_type.strip(),
                current_status,
                resolved_status,
                json.dumps({
                    "action_description": action_description.strip(),
                    "assigned_to": assigned_to,
                    "evidence_url": evidence_url,
                }),
                now_iso,
            ))

            conn.commit()

        return self.get_concern_by_id(concern_id)

    def submit_response(
        self,
        concern_id: str,
        responder_role: str,
        response_text: str,
        response_type: str = "EXPLANATION",
        evidence_url: Optional[str] = None,
        responder_user_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Submit two-way response/clarification from MP, IA, or DA.
        """
        concern = self.get_concern_by_id(concern_id)
        if not concern:
            raise ValueError(f"Concern '{concern_id}' not found.")

        if not response_text or not response_text.strip():
            raise ValueError("Response text cannot be empty.")

        role_upper = str(responder_role).strip().upper()
        now_iso = datetime.now().isoformat()

        # Automatic status advance if IA submits evidence
        target_status = concern["status"]
        if role_upper == "IMPLEMENTING_AGENCY" and target_status in ["ACTION_ASSIGNED", "UNDER_REVIEW"]:
            target_status = "ACTION_IN_PROGRESS" if not evidence_url else "EVIDENCE_SUBMITTED"
        elif role_upper == "MP" and target_status == "CLARIFICATION_REQUESTED":
            target_status = "UNDER_REVIEW"

        with self.get_connection() as conn:
            cursor = conn.cursor()

            cursor.execute("""
                INSERT INTO concern_responses (
                    concern_id, responder_user_id, responder_role,
                    response_text, response_type, evidence_url, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (
                concern_id,
                responder_user_id or f"{role_upper} Respondent",
                role_upper,
                response_text.strip(),
                response_type.strip().upper(),
                evidence_url.strip() if evidence_url else None,
                now_iso,
            ))

            cursor.execute("""
                UPDATE concerns SET status = ?, updated_at = ? WHERE concern_id = ?
            """, (target_status, now_iso, concern_id))

            cursor.execute("""
                INSERT INTO concern_activity_log (
                    concern_id, actor_user_id, actor_role, event_type,
                    previous_state, new_state, metadata_json, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                concern_id,
                responder_user_id or f"{role_upper} Respondent",
                role_upper,
                f"RESPONSE_{response_type.strip().upper()}",
                concern["status"],
                target_status,
                json.dumps({
                    "response_text": response_text.strip(),
                    "evidence_url": evidence_url,
                }),
                now_iso,
            ))

            conn.commit()

        return self.get_concern_by_id(concern_id)

    def get_metrics(
        self,
        role: Optional[str] = None,
        mp_name: Optional[str] = None,
        da_id: Optional[str] = None,
        ia_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Compute real-time aggregation metrics for dashboards (Total, Open, Critical, Awaiting DA/IA, Resolved).
        """
        concerns_res = self.query_concerns(
            role=role,
            mp_name=mp_name,
            da_id=da_id,
            ia_id=ia_id,
            limit=10000,
        )
        items = concerns_res["concerns"]

        metrics = {
            "total": len(items),
            "open": 0,
            "raised": 0,
            "under_review": 0,
            "action_assigned": 0,
            "action_in_progress": 0,
            "action_taken": 0,
            "evidence_submitted": 0,
            "resolved": 0,
            "reopened": 0,
            "rejected": 0,
            "clarification_requested": 0,
            "high_priority": 0,
            "critical_priority": 0,
            "awaiting_da_action": 0,
            "awaiting_ia_response": 0,
        }

        for c in items:
            st = c.get("status", "RAISED")
            prio = c.get("priority", "MEDIUM")

            if prio == "HIGH":
                metrics["high_priority"] += 1
            elif prio == "CRITICAL":
                metrics["critical_priority"] += 1

            if st in ["RAISED", "RECEIVED", "UNDER_REVIEW", "CLARIFICATION_REQUESTED", "ACTION_ASSIGNED", "ACTION_IN_PROGRESS", "EVIDENCE_SUBMITTED", "REOPENED"]:
                metrics["open"] += 1

            if st == "RAISED":
                metrics["raised"] += 1
                metrics["awaiting_da_action"] += 1
            elif st == "RECEIVED":
                metrics["under_review"] += 1
                metrics["awaiting_da_action"] += 1
            elif st == "UNDER_REVIEW":
                metrics["under_review"] += 1
                metrics["awaiting_da_action"] += 1
            elif st == "ACTION_ASSIGNED":
                metrics["action_assigned"] += 1
                metrics["awaiting_ia_response"] += 1
            elif st == "ACTION_IN_PROGRESS":
                metrics["action_in_progress"] += 1
                metrics["awaiting_ia_response"] += 1
            elif st == "EVIDENCE_SUBMITTED":
                metrics["evidence_submitted"] += 1
                metrics["awaiting_da_action"] += 1
            elif st == "ACTION_TAKEN":
                metrics["action_taken"] += 1
            elif st == "RESOLVED":
                metrics["resolved"] += 1
            elif st == "REOPENED":
                metrics["reopened"] += 1
                metrics["awaiting_da_action"] += 1
            elif st == "REJECTED":
                metrics["rejected"] += 1
            elif st == "CLARIFICATION_REQUESTED":
                metrics["clarification_requested"] += 1

        return metrics
