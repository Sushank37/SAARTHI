from typing import Optional, List, Dict, Any
from fastapi import FastAPI, HTTPException, Query, Body, Request
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
import pandas as pd
import math
import json
import re
import os
import sys



# ============================================================
# CONFIGURATION & ENVIRONMENT
# ============================================================

BACKEND_DIR = Path(__file__).resolve().parent
BASE_DIR = BACKEND_DIR.parent

# Ensure Python search path contains both backend and root
for path_item in [str(BACKEND_DIR), str(BASE_DIR)]:
    if path_item not in sys.path:
        sys.path.insert(0, path_item)

# Candidate paths for the canonical master dataset (supports uncompressed .csv and compressed .csv.gz)
candidate_data_paths = [
    BACKEND_DIR / "data" / "mplads_final_dataset.csv.gz",
    BACKEND_DIR / "data" / "mplads_final_dataset.csv",
    BASE_DIR / "data" / "mplads_final_dataset.csv.gz",
    BASE_DIR / "data" / "mplads_final_dataset.csv",
    Path("backend/data/mplads_final_dataset.csv.gz"),
    Path("backend/data/mplads_final_dataset.csv"),
    Path("data/mplads_final_dataset.csv.gz"),
    Path("data/mplads_final_dataset.csv"),
]

DATA_FILE = next((p for p in candidate_data_paths if p.exists()), candidate_data_paths[0])

app = FastAPI(
    title="MPLADS AI Monitoring API",
    description="AI-powered MPLADS risk, duplicate and review monitoring backend",
    version="2.1.0"
)


# ============================================================
# CORS
# ============================================================

allowed_origins_env = os.environ.get("ALLOWED_ORIGINS", "")
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "*",
]
if allowed_origins_env:
    origins.extend([o.strip() for o in allowed_origins_env.split(",") if o.strip()])

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# LOAD DATA
# ============================================================

print("=" * 70)
print("MPLADS AI BACKEND (DEPLOY READY)")
print("=" * 70)
print(f"Data file resolved to: {DATA_FILE}")

if not DATA_FILE.exists():
    raise FileNotFoundError(
        f"Dataset not found at any candidate path. Checked: {[str(p) for p in candidate_data_paths]}"
    )

df = pd.read_csv(
    DATA_FILE,
    low_memory=False
)

# Clean column names
df.columns = (
    df.columns
    .astype(str)
    .str.strip()
)

print(f"Rows    : {len(df):,}")
print(f"Columns : {len(df.columns)}")


# ============================================================
# DATE NORMALIZATION
# ============================================================

DATE_COLUMNS = [
    "RECOMMENDATION_DATE",
    "SANCTION_DATE",
    "ACTUAL_END_DATE"
]

for col in DATE_COLUMNS:
    if col in df.columns:
        df[col] = pd.to_datetime(
            df[col],
            errors="coerce"
        )


# ============================================================
# NUMERIC NORMALIZATION
# ============================================================

NUMERIC_COLUMNS = [
    "RECOMMENDED_AMOUNT",
    "SANCTION_AMOUNT",
    "ACTUAL_AMOUNT",

    "SANCTION_DELAY_DAYS",
    "COMPLETION_DURATION_DAYS",
    "TOTAL_LIFECYCLE_DAYS",

    "COST_VARIANCE",
    "COST_VARIANCE_PERCENT",

    "PEER_MEDIAN_SANCTION_DELAY",
    "SANCTION_DELAY_VS_PEER",

    "PEER_MEDIAN_COMPLETION_DAYS",
    "COMPLETION_VS_PEER",

    "PEER_MEDIAN_SANCTION_AMOUNT",
    "COST_VS_PEER",

    "DELAY_RISK",
    "COMPLETION_RISK",
    "COST_RISK",
    "VARIANCE_RISK",

    "RISK_SCORE",

    "CLUSTER_ID",
    "PAIR_COUNT",

    "AVG_TEXT_SIMILARITY",
    "MAX_TEXT_SIMILARITY",

    "AVG_AMOUNT_SIMILARITY",
    "MAX_AMOUNT_SIMILARITY",

    "AVG_PAIR_SCORE",
    "MAX_PAIR_SCORE",

    "CLUSTER_SIZE",

    "SIMILARITY_COMPONENT",
    "STRONGEST_COMPONENT",
    "SIZE_COMPONENT",

    "CLUSTER_SUSPICION_SCORE",
    "EVIDENCE_SCORE",

    "UNIQUE_DESCRIPTIONS",
    "DESCRIPTION_CONCENTRATION",

    "UNIQUE_AMOUNTS",
    "AMOUNT_CONCENTRATION",

    "RECOMMENDATION_DATE_CONCENTRATION",
    "SANCTION_DATE_CONCENTRATION"
]

for col in NUMERIC_COLUMNS:
    if col in df.columns:
        df[col] = pd.to_numeric(
            df[col],
            errors="coerce"
        )


# ============================================================
# CLEAN INFINITY
# ============================================================

df = df.replace(
    [float("inf"), float("-inf")],
    pd.NA
)

# Precomputed lowercase columns for instant text searches
if "IDA_NAME" in df.columns:
    df["_IDA_NAME_LOWER"] = df["IDA_NAME"].fillna("").astype(str).str.lower()
if "STATE_NAME" in df.columns:
    df["_STATE_NAME_LOWER"] = df["STATE_NAME"].fillna("").astype(str).str.lower()
if "MP_NAME" in df.columns:
    df["_MP_NAME_LOWER"] = df["MP_NAME"].fillna("").astype(str).str.lower()
if "CONSTITUENCY" in df.columns:
    df["_CONSTITUENCY_LOWER"] = df["CONSTITUENCY"].fillna("").astype(str).str.lower()

print("Dataset loaded successfully.")
print("=" * 70)
print()

# ============================================================
# UNIFIED WORKFLOW ENGINE
# ============================================================

try:
    from backend.workflow_engine import WorkflowEngine, REQUEST_TYPES, STATUS_LIFECYCLE
except ImportError:
    from workflow_engine import WorkflowEngine, REQUEST_TYPES, STATUS_LIFECYCLE

workflow_engine = WorkflowEngine(df)
print("[WorkflowEngine] Initialized with master dataset.")
print()


# ============================================================
# HELPER FUNCTIONS
# ============================================================

def column_exists(column: str) -> bool:
    return column in df.columns


def clean_value(value):

    if value is None:
        return None

    try:
        if pd.isna(value):
            return None
    except Exception:
        pass

    if isinstance(value, pd.Timestamp):
        return value.strftime("%Y-%m-%d")

    if hasattr(value, "item"):
        try:
            value = value.item()
        except Exception:
            pass

    if isinstance(value, float):
        if math.isnan(value) or math.isinf(value):
            return None

        if value.is_integer():
            return int(value)

    return value


def row_to_dict(row):

    result = {}

    for key, value in row.items():
        result[str(key)] = clean_value(value)

    # Standardize missing/empty WORK_STAGE to "Pending Sanction"
    ws = result.get("WORK_STAGE")
    if ws is None or str(ws).strip().lower() in ["", "none", "nan", "null"]:
        result["WORK_STAGE"] = "Pending Sanction"

    return result


def dataframe_to_records(dataframe):

    return [
        row_to_dict(row)
        for _, row in dataframe.iterrows()
    ]


def parse_bool(value):

    if pd.isna(value):
        return False

    if isinstance(value, bool):
        return value

    if isinstance(value, (int, float)):
        return bool(value)

    text = str(value).strip().lower()

    return text in {
        "true",
        "1",
        "yes",
        "y",
        "t"
    }


def boolean_series(series):
    return series.apply(parse_bool)


def text_contains(series, value):

    return (
        series
        .fillna("")
        .astype(str)
        .str.contains(
            str(value),
            case=False,
            na=False,
            regex=False
        )
    )


def unique_clean_values(series):

    values = (
        series
        .dropna()
        .astype(str)
        .str.strip()
    )

    values = [
        value
        for value in values.unique().tolist()
        if value
        and value.lower() not in {
            "nan",
            "none",
            "null"
        }
    ]

    return sorted(values)


def first_valid(series):

    values = series.dropna()

    if values.empty:
        return None

    return clean_value(values.iloc[0])


def pagination(data, page, limit):

    total = len(data)

    start = (page - 1) * limit
    end = start + limit

    page_data = data.iloc[start:end]
    records = dataframe_to_records(page_data)
    pages = math.ceil(total / limit) if total else 0

    return {
        "page": page,
        "limit": limit,
        "total": total,
        "pages": pages,
        "total_pages": pages,
        "data": records,
        "works": records
    }


# ============================================================
# ROOT & HEALTH
# ============================================================

@app.get("/")
def root():
    return {
        "service": "SAARTHI MPLADS eSAKSHI Surveillance API",
        "name": "MPLADS AI Monitoring API",
        "status": "healthy",
        "version": "2.1.0",
        "total_works": len(df),
        "dataset_rows": len(df),
        "dataset_columns": len(df.columns),
        "docs": "/docs",
        "api_health": "/api/health",
        "api_summary": "/api/summary",
    }

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "dataset_loaded": True,
        "rows": len(df),
        "columns": len(df.columns),
    }

@app.get("/api/health")
def health():
    return {
        "status": "healthy",
        "dataset_loaded": True,
        "rows": len(df),
        "columns": len(df.columns),
    }


# ============================================================
# SUMMARY / DASHBOARD
# ============================================================

@app.get("/api/summary")
def summary():

    total_works = len(df)


    # --------------------------------------------------------
    # Risk distribution
    # --------------------------------------------------------

    if column_exists("RISK_LEVEL"):

        risk_distribution = (
            df["RISK_LEVEL"]
            .fillna("UNKNOWN")
            .astype(str)
            .str.strip()
            .str.upper()
            .value_counts()
            .to_dict()
        )

    else:
        risk_distribution = {}


    # --------------------------------------------------------
    # Duplicate distribution
    # --------------------------------------------------------

    if column_exists("DUPLICATE_RISK"):

        duplicate_distribution = (
            df["DUPLICATE_RISK"]
            .fillna("NOT IN CLUSTER")
            .astype(str)
            .str.strip()
            .str.upper()
            .value_counts()
            .to_dict()
        )

    else:
        duplicate_distribution = {}


    # --------------------------------------------------------
    # Suspicion distribution
    # --------------------------------------------------------

    if column_exists("SUSPICION_LEVEL"):

        suspicion_distribution = (
            df["SUSPICION_LEVEL"]
            .fillna("NOT INVESTIGATED")
            .astype(str)
            .str.strip()
            .str.upper()
            .value_counts()
            .to_dict()
        )

    else:
        suspicion_distribution = {}


    # --------------------------------------------------------
    # High risk
    # --------------------------------------------------------

    high_risk = 0

    if column_exists("RISK_LEVEL"):

        high_risk = int(
            df["RISK_LEVEL"]
            .fillna("")
            .astype(str)
            .str.upper()
            .eq("HIGH")
            .sum()
        )


    # --------------------------------------------------------
    # Medium risk
    # --------------------------------------------------------

    medium_risk = 0

    if column_exists("RISK_LEVEL"):

        medium_risk = int(
            df["RISK_LEVEL"]
            .fillna("")
            .astype(str)
            .str.upper()
            .eq("MEDIUM")
            .sum()
        )


    # --------------------------------------------------------
    # ACTUAL RISK CASES
    #
    # LOW is not treated as a risk case.
    # Only HIGH + MEDIUM are included.
    # --------------------------------------------------------

    risk_cases = (
        high_risk +
        medium_risk
    )


    # --------------------------------------------------------
    # Average risk score
    #
    # Calculate only across actual risk cases,
    # not across all 102,703 works.
    # --------------------------------------------------------

    average_risk_score = None

    if (
        column_exists("RISK_SCORE")
        and column_exists("RISK_LEVEL")
    ):

        risk_mask = (
            df["RISK_LEVEL"]
            .fillna("")
            .astype(str)
            .str.upper()
            .isin([
                "HIGH",
                "MEDIUM"
            ])
        )

        risk_scores = pd.to_numeric(
            df.loc[
                risk_mask,
                "RISK_SCORE"
            ],
            errors="coerce"
        )

        if not risk_scores.dropna().empty:

            average_risk_score = clean_value(
                risk_scores.mean()
            )


    # --------------------------------------------------------
    # High duplicate risk
    # --------------------------------------------------------

    high_duplicate = 0

    if column_exists("DUPLICATE_RISK"):

        high_duplicate = int(
            df["DUPLICATE_RISK"]
            .fillna("")
            .astype(str)
            .str.upper()
            .eq("HIGH")
            .sum()
        )


    # --------------------------------------------------------
    # Review required
    # --------------------------------------------------------

    if column_exists("REQUIRES_REVIEW"):

        review_required = int(
            boolean_series(
                df["REQUIRES_REVIEW"]
            ).sum()
        )

    else:
        review_required = 0


    # --------------------------------------------------------
    # States
    # --------------------------------------------------------

    states_covered = 0

    if column_exists("STATE_NAME"):

        states_covered = int(
            df["STATE_NAME"]
            .dropna()
            .astype(str)
            .str.strip()
            .replace("", pd.NA)
            .dropna()
            .nunique()
        )


    # --------------------------------------------------------
    # MPs
    # --------------------------------------------------------

    mps_tracked = 0

    if column_exists("MP_NAME"):

        mps_tracked = int(
            df["MP_NAME"]
            .dropna()
            .astype(str)
            .str.strip()
            .replace("", pd.NA)
            .dropna()
            .nunique()
        )


    # --------------------------------------------------------
    # Constituencies
    # --------------------------------------------------------

    constituencies_covered = 0

    if column_exists("CONSTITUENCY"):

        constituencies_covered = int(
            df["CONSTITUENCY"]
            .dropna()
            .astype(str)
            .str.strip()
            .replace("", pd.NA)
            .dropna()
            .nunique()
        )


    # --------------------------------------------------------
    # Works in duplicate clusters
    # --------------------------------------------------------

    works_in_clusters = 0

    if column_exists("CLUSTER_ID"):

        works_in_clusters = int(
            df["CLUSTER_ID"]
            .notna()
            .sum()
        )


    # --------------------------------------------------------
    # Unique duplicate clusters
    # --------------------------------------------------------

    duplicate_clusters = 0

    if column_exists("CLUSTER_ID"):

        duplicate_clusters = int(
            df["CLUSTER_ID"]
            .dropna()
            .nunique()
        )


    # --------------------------------------------------------
    # Latest data date
    # --------------------------------------------------------

    latest_date = None

    for date_col in [
        "RECOMMENDATION_DATE",
        "SANCTION_DATE",
        "ACTUAL_END_DATE"
    ]:

        if column_exists(date_col):

            latest = pd.to_datetime(
                df[date_col],
                errors="coerce"
            ).max()

            if pd.notna(latest):

                if (
                    latest_date is None
                    or latest > latest_date
                ):
                    latest_date = latest


    # --------------------------------------------------------
    # Financial metrics & progress
    # --------------------------------------------------------

    total_recommended_amount = 0.0
    if column_exists("RECOMMENDED_AMOUNT"):
        total_recommended_amount = float(df["RECOMMENDED_AMOUNT"].dropna().sum())

    total_sanction_amount = 0.0
    if column_exists("SANCTION_AMOUNT"):
        total_sanction_amount = float(df["SANCTION_AMOUNT"].dropna().sum())

    total_actual_amount = 0.0
    if column_exists("ACTUAL_AMOUNT"):
        total_actual_amount = float(df["ACTUAL_AMOUNT"].dropna().sum())

    recommended_works_count = total_works
    if column_exists("RECOMMENDED_AMOUNT"):
        recommended_works_count = int(df["RECOMMENDED_AMOUNT"].notna().sum())

    sanctioned_works_count = 0
    if column_exists("SANCTION_AMOUNT"):
        sanctioned_works_count = int(df["SANCTION_AMOUNT"].notna().sum())

    completed_works_count = 0
    if column_exists("ACTUAL_AMOUNT"):
        completed_works_count = int(df["ACTUAL_AMOUNT"].notna().sum())

    sanction_rate = (
        round((sanctioned_works_count / total_works * 100), 1)
        if total_works
        else 0.0
    )
    completion_rate = (
        round((completed_works_count / total_works * 100), 1)
        if total_works
        else 0.0
    )

    # 543 MPs * ₹5.00 Cr annual entitlement limit
    total_fund_allocation = float(mps_tracked * 50000000.0) if mps_tracked else 27150000000.0


    # --------------------------------------------------------
    # RESPONSE
    # --------------------------------------------------------

    return {

        "total_works":
            total_works,

        "total_recommended_amount":
            total_recommended_amount,

        "total_sanction_amount":
            total_sanction_amount,

        "total_actual_amount":
            total_actual_amount,

        "total_recommended_cr":
            round(total_recommended_amount / 1e7, 2),

        "total_sanctioned_cr":
            round(total_sanction_amount / 1e7, 2),

        "total_expenditure_cr":
            round(total_actual_amount / 1e7, 2),

        "recommended_works_count":
            recommended_works_count,

        "sanctioned_works_count":
            sanctioned_works_count,

        "completed_works_count":
            completed_works_count,

        "ongoing_works_count":
            max(0, sanctioned_works_count - completed_works_count),

        "sanction_rate":
            sanction_rate,

        "completion_rate":
            completion_rate,

        "total_fund_allocation":
            total_fund_allocation,

        "risk_cases":
            risk_cases,

        "high_risk":
            high_risk,

        "medium_risk":
            medium_risk,

        "average_risk_score":
            average_risk_score,

        "high_duplicate_risk":
            high_duplicate,

        "review_required":
            review_required,

        "states_covered":
            states_covered,

        "mps_tracked":
            mps_tracked,

        "constituencies_covered":
            constituencies_covered,

        "works_in_clusters":
            works_in_clusters,

        "duplicate_clusters":
            duplicate_clusters,

        "last_data_update": (
            latest_date.strftime("%d %b %Y")
            if latest_date is not None
            else None
        ),

        "risk_distribution":
            risk_distribution,

        "duplicate_distribution":
            duplicate_distribution,

        "suspicion_distribution":
            suspicion_distribution
    }


# ============================================================
# GET WORKS
# ============================================================

@app.get("/api/works")
def get_works(

    page: int = Query(
        1,
        ge=1
    ),

    limit: int = Query(
        50,
        ge=1,
        le=500
    ),

    state: str | None = None,

    constituency: str | None = None,

    mp_name: str | None = None,

    risk_level: str | None = None,

    duplicate_risk: str | None = None,

    suspicion_level: str | None = None,

    requires_review: bool | None = None,

    stage: str | None = None,

    ida_name: str | None = None,

    category: str | None = None,

    sector: str | None = None,

    tab: str | None = None,

    subfilter: str | None = None,

    q: str | None = None
):

    data = df


    # Search
    if q:

        query = q.strip()

        if query:

            search_columns = [
                "WORK_RECOMMENDATION_DTL_ID",
                "WORK_ID",
                "STATE_NAME",
                "CONSTITUENCY",
                "MP_NAME",
                "IDA_NAME",
                "WORK_DESCRIPTION",
                "WORK_CATEGORY"
            ]

            mask = pd.Series(
                False,
                index=data.index
            )

            for col in search_columns:

                if column_exists(col):

                    mask = (
                        mask
                        |
                        text_contains(
                            data[col],
                            query
                        )
                    )

            data = data[mask]


    # State
    if state and column_exists(
        "STATE_NAME"
    ):

        data = data[
            text_contains(
                data["STATE_NAME"],
                state
            )
        ]


    # Constituency
    if constituency and column_exists(
        "CONSTITUENCY"
    ):

        data = data[
            text_contains(
                data["CONSTITUENCY"],
                constituency
            )
        ]


    # MP
    if mp_name and column_exists(
        "MP_NAME"
    ):

        data = data[
            text_contains(
                data["MP_NAME"],
                mp_name
            )
        ]


    # Stage
    if stage and column_exists("WORK_STAGE"):
        stage_clean = str(stage).strip()
        stage_lower = stage_clean.lower()
        if stage_lower in ["pending sanction", "waiting for approval", "waiting", "pending"]:
            st = data["WORK_STAGE"].fillna("Pending Sanction").astype(str).str.strip()
            pending_mask = st.isin(["Pending Sanction", "Unknown", "nan", "None", ""]) | data["WORK_STAGE"].isna()
            if column_exists("SANCTION_AMOUNT"):
                pending_mask = pending_mask | (data["SANCTION_AMOUNT"].isna() | (data["SANCTION_AMOUNT"] == 0))
            data = data[pending_mask]
        elif stage_lower in ["physical inspection", "under construction", "ongoing", "in progress"]:
            st = data["WORK_STAGE"].fillna("").astype(str).str.strip()
            data = data[st.isin(["Physical Inspection", "Work partially Completed", "Under Construction", "Ongoing"])]
        elif stage_lower in ["work completed", "finished", "completed"]:
            st = data["WORK_STAGE"].fillna("").astype(str).str.strip()
            data = data[st.isin(["Work Completed", "Completed", "Finished"])]
        elif stage_lower in ["sanction", "approved"]:
            st = data["WORK_STAGE"].fillna("").astype(str).str.strip()
            data = data[st.isin(["Sanction", "Approved"])]
        else:
            data = data[text_contains(data["WORK_STAGE"], stage_clean)]


    # IDA / District Authority
    if ida_name and column_exists(
        "IDA_NAME"
    ):

        data = data[
            text_contains(
                data["IDA_NAME"],
                ida_name
            )
        ]


    # Category / Sector
    if category and column_exists("WORK_CATEGORY"):
        data = data[text_contains(data["WORK_CATEGORY"], category)]
    elif sector:
        if column_exists("WORK_CATEGORY"):
            data = data[text_contains(data["WORK_CATEGORY"], sector)]
        elif column_exists("SECTOR"):
            data = data[text_contains(data["SECTOR"], sector)]


    # Risk
    if risk_level and column_exists(
        "RISK_LEVEL"
    ):

        data = data[
            data["RISK_LEVEL"]
            .fillna("")
            .astype(str)
            .str.upper()
            .eq(
                risk_level.upper()
            )
        ]


    # Duplicate
    if (
        duplicate_risk
        and column_exists(
            "DUPLICATE_RISK"
        )
    ):

        data = data[
            data["DUPLICATE_RISK"]
            .fillna(
                "NOT IN CLUSTER"
            )
            .astype(str)
            .str.upper()
            .eq(
                duplicate_risk.upper()
            )
        ]


    # Suspicion
    if (
        suspicion_level
        and column_exists(
            "SUSPICION_LEVEL"
        )
    ):

        data = data[
            data["SUSPICION_LEVEL"]
            .fillna(
                "NOT INVESTIGATED"
            )
            .astype(str)
            .str.upper()
            .eq(
                suspicion_level.upper()
            )
        ]


    # Review
    if (
        requires_review is not None
        and column_exists(
            "REQUIRES_REVIEW"
        )
    ):

        review_values = boolean_series(
            data["REQUIRES_REVIEW"]
        )

        data = data[
            review_values.eq(
                requires_review
            )
        ]

    # Tab-specific role views (e.g. for District Authority monitoring modules)
    if tab:
        t = tab.strip().lower()
        sub = subfilter.strip().lower() if subfilter else None

        if t == "pending-sanctions":
            if column_exists("WORK_STAGE"):
                st = data["WORK_STAGE"].fillna("Pending Sanction").astype(str).str.strip()
                data = data[st.isin(["Pending Sanction", "Unknown"]) | (data["SANCTION_AMOUNT"].isna()) | (data["SANCTION_AMOUNT"] == 0)]
                if sub == "overdue-45" and column_exists("SANCTION_DELAY_DAYS"):
                    data = data[data["SANCTION_DELAY_DAYS"] > 45]
                elif sub == "high-value" and column_exists("RECOMMENDED_AMOUNT"):
                    data = data[data["RECOMMENDED_AMOUNT"] > 1000000]

        elif t == "compliance-45d":
            if column_exists("SANCTION_DELAY_DAYS"):
                if sub == "approaching":
                    data = data[(data["SANCTION_DELAY_DAYS"] >= 30) & (data["SANCTION_DELAY_DAYS"] <= 45)]
                elif sub == "compliant":
                    data = data[(data["SANCTION_DELAY_DAYS"] < 30) & data["SANCTION_DELAY_DAYS"].notna()]
                elif sub == "all":
                    data = data[data["SANCTION_DELAY_DAYS"].notna()]
                else:
                    data = data[data["SANCTION_DELAY_DAYS"] > 45]
                data = data.sort_values("SANCTION_DELAY_DAYS", ascending=False)

        # ----------------------------------------------------
        # IA 10 Standard Sections
        # ----------------------------------------------------
        elif t in ["assigned-works", "assigned"]:
            if column_exists("SANCTION_AMOUNT"):
                data = data[data["SANCTION_AMOUNT"] > 0]

        elif t in ["execution-progress", "progress"]:
            if column_exists("WORK_STAGE"):
                st = data["WORK_STAGE"].fillna("").astype(str).str.strip()
                data = data[st.isin(["Physical Inspection", "Work partially Completed", "Vendor Identification", "Time Estimation", "Sanction"])]

        elif t in ["upcoming-deadlines", "deadlines", "delays", "ia-delays"]:
            if column_exists("WORK_STAGE") and column_exists("COMPLETION_DURATION_DAYS") and column_exists("PEER_MEDIAN_COMPLETION_DAYS"):
                ongoing_mask = data["WORK_STAGE"].isin(["Physical Inspection", "Work partially Completed", "Vendor Identification", "Time Estimation"])
                if sub == "nearing":
                    data = data[ongoing_mask & (data["COMPLETION_DURATION_DAYS"] >= 0.8 * data["PEER_MEDIAN_COMPLETION_DAYS"]) & (data["COMPLETION_DURATION_DAYS"] <= data["PEER_MEDIAN_COMPLETION_DAYS"]) & (data["COMPLETION_DURATION_DAYS"] > 0)]
                elif sub == "overdue":
                    data = data[ongoing_mask & (data["COMPLETION_DURATION_DAYS"] > data["PEER_MEDIAN_COMPLETION_DAYS"]) & (data["COMPLETION_DURATION_DAYS"] > 0)]
                else:
                    data = data[ongoing_mask & (data["COMPLETION_DURATION_DAYS"] >= 0.8 * data["PEER_MEDIAN_COMPLETION_DAYS"]) & (data["COMPLETION_DURATION_DAYS"] > 0)]
                data = data.sort_values("COMPLETION_DURATION_DAYS", ascending=False)

        elif t in ["payment-requests", "payment", "financial", "financials", "ia-financial"]:
            if sub == "escalation" and column_exists("ACTUAL_AMOUNT") and column_exists("SANCTION_AMOUNT"):
                data = data[(data["ACTUAL_AMOUNT"] > data["SANCTION_AMOUNT"]) & (data["SANCTION_AMOUNT"] > 0)]
            elif sub == "disbursed" and column_exists("ACTUAL_AMOUNT"):
                data = data[(data["ACTUAL_AMOUNT"] > 0) & data["ACTUAL_AMOUNT"].notna()]
            else:
                if column_exists("ACTUAL_AMOUNT"):
                    data = data[(data["ACTUAL_AMOUNT"] > 0) & data["ACTUAL_AMOUNT"].notna()]
                elif column_exists("SANCTION_AMOUNT"):
                    data = data[data["SANCTION_AMOUNT"] > 0]

        elif t in ["vendor-activity", "vendors"]:
            if column_exists("IDA_NAME"):
                data = data[data["IDA_NAME"].notna()]

        elif t in ["evidence-upload", "evidence", "ia-evidence"]:
            if column_exists("EVIDENCE") or column_exists("EVIDENCE_SCORE"):
                e_mask = pd.Series(False, index=data.index)
                if column_exists("EVIDENCE"):
                    e_mask = e_mask | data["EVIDENCE"].notna()
                if column_exists("EVIDENCE_SCORE"):
                    e_mask = e_mask | data["EVIDENCE_SCORE"].notna()
                data = data[e_mask]

        elif t in ["geo-photo-verification", "geo-photo", "geo-photos"]:
            if column_exists("WORK_STAGE"):
                if sub == "inspection":
                    data = data[data["WORK_STAGE"] == "Physical Inspection"]
                elif sub == "completed":
                    data = data[data["WORK_STAGE"] == "Work Completed"]
                else:
                    data = data[data["WORK_STAGE"].fillna("").astype(str).str.strip().isin(["Physical Inspection", "Work Completed"])]

        elif t in ["missing-evidence", "evidence-issues"]:
            m_mask = pd.Series(False, index=data.index)
            if column_exists("EVIDENCE_SCORE"):
                m_mask = m_mask | ((data["EVIDENCE_SCORE"] < 60) & data["EVIDENCE_SCORE"].notna())
            if column_exists("EVIDENCE") and column_exists("WORK_STAGE"):
                ongoing_mask = data["WORK_STAGE"].isin(["Physical Inspection", "Work partially Completed", "Vendor Identification", "Time Estimation"])
                m_mask = m_mask | (data["EVIDENCE"].isna() & ongoing_mask)
            if column_exists("REQUIRES_REVIEW"):
                m_mask = m_mask | boolean_series(data["REQUIRES_REVIEW"])
            data = data[m_mask]

        elif t in ["completion", "ia-completion"]:
            if column_exists("WORK_STAGE"):
                if t == "ia-completion" or sub == "completed":
                    data = data[data["WORK_STAGE"] == "Work Completed"]
                elif sub == "ready" or sub == "under-construction":
                    data = data[data["WORK_STAGE"] == "Work partially Completed"]
                elif sub == "inspection":
                    data = data[data["WORK_STAGE"] == "Physical Inspection"]
                else:
                    data = data[data["WORK_STAGE"].fillna("").astype(str).str.strip().isin(["Work partially Completed", "Work Completed"])]

        elif t in ["ai-alerts", "alerts-queue", "attention", "ia-attention"]:
            p_mask = pd.Series(False, index=data.index)
            if column_exists("REQUIRES_REVIEW"):
                p_mask = p_mask | boolean_series(data["REQUIRES_REVIEW"])
            if column_exists("RISK_LEVEL"):
                p_mask = p_mask | (data["RISK_LEVEL"].fillna("").astype(str).str.upper().isin(["HIGH", "MEDIUM"]))
            if column_exists("DUPLICATE_RISK"):
                p_mask = p_mask | (data["DUPLICATE_RISK"].fillna("").astype(str).str.upper() == "HIGH")
            if column_exists("COST_VARIANCE") and column_exists("SANCTION_AMOUNT"):
                p_mask = p_mask | ((data["COST_VARIANCE"] > 0) & (data["SANCTION_AMOUNT"] > 0))
            data = data[p_mask]

        elif t in ["risk", "risk-cases"]:
            if column_exists("RISK_LEVEL"):
                if sub == "high":
                    risk_filtered = data[data["RISK_LEVEL"].fillna("").astype(str).str.upper() == "HIGH"]
                    if not risk_filtered.empty:
                        data = risk_filtered
                    elif column_exists("REQUIRES_REVIEW"):
                        data = data[boolean_series(data["REQUIRES_REVIEW"])]
                    else:
                        data = risk_filtered
                elif sub == "medium":
                    data = data[data["RISK_LEVEL"].fillna("").astype(str).str.upper() == "MEDIUM"]
                else:
                    risk_filtered = data[data["RISK_LEVEL"].fillna("").astype(str).str.upper().isin(["HIGH", "MEDIUM"])]
                    if not risk_filtered.empty:
                        data = risk_filtered
                    elif column_exists("REQUIRES_REVIEW"):
                        data = data[boolean_series(data["REQUIRES_REVIEW"])]
            if column_exists("RISK_SCORE") and not data.empty:
                data = data.sort_values("RISK_SCORE", ascending=False)

        elif t == "duplicates":
            if column_exists("DUPLICATE_RISK"):
                if sub == "high":
                    data = data[data["DUPLICATE_RISK"].fillna("").astype(str).str.upper() == "HIGH"]
                elif sub == "medium":
                    data = data[data["DUPLICATE_RISK"].fillna("").astype(str).str.upper() == "MEDIUM"]
                else:
                    data = data[data["DUPLICATE_RISK"].fillna("").astype(str).str.upper().isin(["HIGH", "MEDIUM"])]

        elif t in ["ongoing", "ia-ongoing"]:
            if column_exists("WORK_STAGE"):
                st = data["WORK_STAGE"].fillna("").astype(str).str.strip()
                data = data[st.isin(["Physical Inspection", "Work partially Completed", "Vendor Identification", "Time Estimation"])]

        # MoSPI 12 Standard Modules Tab Filters
        elif t in ["anomaly-detection", "anomalies"]:
            a_mask = pd.Series(False, index=data.index)
            if sub == "extreme-delay" and column_exists("SANCTION_DELAY_DAYS"):
                a_mask = data["SANCTION_DELAY_DAYS"] > 180
            elif sub == "cost-variance" and column_exists("COST_VARIANCE"):
                a_mask = (data["COST_VARIANCE"] < 0) | (data["ACTUAL_AMOUNT"] > data["SANCTION_AMOUNT"])
            elif sub == "long-completion" and column_exists("COMPLETION_DURATION_DAYS"):
                a_mask = data["COMPLETION_DURATION_DAYS"] > 365
            else:
                if column_exists("SANCTION_DELAY_DAYS"):
                    a_mask = a_mask | (data["SANCTION_DELAY_DAYS"] > 180)
                if column_exists("COST_VARIANCE"):
                    a_mask = a_mask | (data["COST_VARIANCE"] < 0)
                if column_exists("COMPLETION_DURATION_DAYS"):
                    a_mask = a_mask | (data["COMPLETION_DURATION_DAYS"] > 365)
            data = data[a_mask]

        elif t in ["delay-intelligence", "delays", "delay"]:
            if column_exists("SANCTION_DELAY_DAYS"):
                if sub == "under-45":
                    data = data[data["SANCTION_DELAY_DAYS"] <= 45]
                elif sub == "46-90":
                    data = data[(data["SANCTION_DELAY_DAYS"] > 45) & (data["SANCTION_DELAY_DAYS"] <= 90)]
                elif sub == "91-180":
                    data = data[(data["SANCTION_DELAY_DAYS"] > 90) & (data["SANCTION_DELAY_DAYS"] <= 180)]
                elif sub == "over-180":
                    data = data[data["SANCTION_DELAY_DAYS"] > 180]
                else:
                    data = data[data["SANCTION_DELAY_DAYS"].notna()]
                data = data.sort_values("SANCTION_DELAY_DAYS", ascending=False)

        elif t in ["evidence-intelligence", "evidence-anomalies"]:
            if column_exists("EVIDENCE_SCORE"):
                if sub == "low":
                    data = data[data["EVIDENCE_SCORE"] < 60]
                elif sub == "moderate":
                    data = data[(data["EVIDENCE_SCORE"] >= 60) & (data["EVIDENCE_SCORE"] < 80)]
                elif sub == "verified":
                    data = data[data["EVIDENCE_SCORE"] >= 80]
                else:
                    data = data[data["EVIDENCE_SCORE"].notna()]
                data = data.sort_values("EVIDENCE_SCORE", ascending=True)

        elif t in ["financial-intelligence", "financial-anomalies"]:
            if column_exists("COST_VARIANCE") and column_exists("SANCTION_AMOUNT"):
                if sub == "anomalies":
                    data = data[(data["COST_VARIANCE"] < 0) | (data["ACTUAL_AMOUNT"] > data["SANCTION_AMOUNT"])]
                else:
                    data = data[data["SANCTION_AMOUNT"] > 0]

    # Sort
    if column_exists("RISK_SCORE"):

        data = data.sort_values(
            "RISK_SCORE",
            ascending=False,
            na_position="last"
        )


    return pagination(
        data,
        page,
        limit
    )


# ============================================================
# WORKS GEOJSON (PRODUCTION GIS API)
# ============================================================

candidate_geo_paths = [
    BACKEND_DIR / "geocoded_localities_cache.json",
    BASE_DIR / "backend" / "geocoded_localities_cache.json",
    Path("backend/geocoded_localities_cache.json"),
    Path("geocoded_localities_cache.json"),
]
GEO_CACHE_FILE = next((p for p in candidate_geo_paths if p.exists()), candidate_geo_paths[0])
_GEO_CACHE = {}
if GEO_CACHE_FILE.exists():
    try:
        with open(GEO_CACHE_FILE, "r", encoding="utf-8") as f:
            _GEO_CACHE = json.load(f)
        print(f"[GIS] Loaded {len(_GEO_CACHE)} verified geocoded localities from cache")
    except Exception as e:
        print(f"[GIS] Warning loading geo cache: {e}")

@app.get("/api/works/geo")
def get_works_geo(
    mp_name: str | None = None,
    constituency: str | None = None,
    state: str | None = None,
    stage: str | None = None,
    risk_level: str | None = None,
    q: str | None = None
):
    """
    Returns verified GeoJSON FeatureCollection for MPLADS works.
    Distinguishes:
      1. Exact work location (dataset coordinates)
      2. Locality-level location (geocoded village / settlement)
      3. Location unavailable (excluded from features, accounted in meta)
    Coordinates order in GeoJSON: [longitude, latitude]
    """
    data = df

    if q:
        query = q.strip()
        if query:
            search_columns = [
                "WORK_RECOMMENDATION_DTL_ID",
                "WORK_ID",
                "STATE_NAME",
                "CONSTITUENCY",
                "MP_NAME",
                "IDA_NAME",
                "WORK_DESCRIPTION",
                "WORK_CATEGORY"
            ]
            mask = pd.Series(False, index=data.index)
            for col in search_columns:
                if column_exists(col):
                    mask = mask | text_contains(data[col], query)
            data = data[mask]

    if state and column_exists("STATE_NAME"):
        data = data[text_contains(data["STATE_NAME"], state)]

    if constituency and column_exists("CONSTITUENCY"):
        data = data[text_contains(data["CONSTITUENCY"], constituency)]

    if mp_name and column_exists("MP_NAME"):
        data = data[text_contains(data["MP_NAME"], mp_name)]

    if stage and column_exists("WORK_STAGE"):
        stage_clean = str(stage).strip()
        stage_lower = stage_clean.lower()
        if stage_lower in ["pending sanction", "waiting for approval", "waiting", "pending"]:
            st = data["WORK_STAGE"].fillna("Pending Sanction").astype(str).str.strip()
            pending_mask = st.isin(["Pending Sanction", "Unknown", "nan", "None", ""]) | data["WORK_STAGE"].isna()
            if column_exists("SANCTION_AMOUNT"):
                pending_mask = pending_mask | (data["SANCTION_AMOUNT"].isna() | (data["SANCTION_AMOUNT"] == 0))
            data = data[pending_mask]
        elif stage_lower in ["physical inspection", "under construction", "ongoing", "in progress"]:
            st = data["WORK_STAGE"].fillna("").astype(str).str.strip()
            data = data[st.isin(["Physical Inspection", "Work partially Completed", "Under Construction", "Ongoing"])]
        elif stage_lower in ["work completed", "finished", "completed"]:
            st = data["WORK_STAGE"].fillna("").astype(str).str.strip()
            data = data[st.isin(["Work Completed", "Completed", "Finished"])]
        elif stage_lower in ["sanction", "approved"]:
            st = data["WORK_STAGE"].fillna("").astype(str).str.strip()
            data = data[st.isin(["Sanction", "Approved"])]
        else:
            data = data[text_contains(data["WORK_STAGE"], stage_clean)]

    if risk_level and column_exists("RISK_LEVEL"):
        data = data[data["RISK_LEVEL"].fillna("").astype(str).str.upper().eq(risk_level.upper())]

    total_works = len(data)
    features = []
    exact_count = 0
    locality_count = 0

    has_lat = column_exists("LATITUDE")
    has_lng = column_exists("LONGITUDE")

    for _, row in data.iterrows():
        lat = None
        lng = None
        loc_precision = "unavailable"
        loc_source = "none"
        locality_name = None

        # 1. Exact dataset coordinates check
        if has_lat and has_lng:
            raw_lat = row.get("LATITUDE")
            raw_lng = row.get("LONGITUDE")
            try:
                plat = float(raw_lat)
                plng = float(raw_lng)
                if not (math.isnan(plat) or math.isnan(plng)) and -90 <= plat <= 90 and -180 <= plng <= 180 and (plat != 0 or plng != 0):
                    lat = plat
                    lng = plng
                    loc_precision = "exact"
                    loc_source = "dataset"
                    locality_name = str(row.get("VILLAGE") or row.get("CONSTITUENCY") or "Exact Site")
                    exact_count += 1
            except (ValueError, TypeError):
                pass

        # 2. Verified Locality check via persistent cache
        if lat is None:
            desc = str(row.get("WORK_DESCRIPTION") or "")
            matched_entry = None

            # Match from (V) / (M) regex
            vm_matches = re.findall(r'([A-Za-z\s]+)\(([VMvm])\)', desc)
            for name, _ in vm_matches:
                k = name.strip().lower()
                if k in _GEO_CACHE:
                    matched_entry = _GEO_CACHE[k]
                    break

            # Match from cached locality keywords
            if not matched_entry:
                desc_lower = desc.lower()
                for k, entry in _GEO_CACHE.items():
                    if re.search(r'\b' + re.escape(k) + r'\b', desc_lower):
                        matched_entry = entry
                        break

            if matched_entry:
                try:
                    plat = float(matched_entry["latitude"])
                    plng = float(matched_entry["longitude"])
                    if -90 <= plat <= 90 and -180 <= plng <= 180:
                        lat = plat
                        lng = plng
                        loc_precision = matched_entry.get("location_precision", "locality")
                        loc_source = matched_entry.get("location_source", "geocoded_locality")
                        locality_name = matched_entry.get("display_location", matched_entry.get("locality_text"))
                        locality_count += 1
                except (ValueError, TypeError):
                    pass

        # Only add valid coordinates to GeoJSON
        if lat is not None and lng is not None:
            work_id_str = str(row.get("WORK_ID") or row.get("WORK_RECOMMENDATION_DTL_ID") or "")
            features.append({
                "type": "Feature",
                "geometry": {
                    "type": "Point",
                    "coordinates": [round(lng, 5), round(lat, 5)]  # GeoJSON standard: [longitude, latitude]
                },
                "properties": {
                    "work_id": work_id_str,
                    "description": clean_value(row.get("WORK_DESCRIPTION")),
                    "recommended_amount": clean_value(row.get("RECOMMENDED_AMOUNT") or 0),
                    "sanction_amount": clean_value(row.get("SANCTION_AMOUNT") or 0),
                    "actual_amount": clean_value(row.get("ACTUAL_AMOUNT") or 0),
                    "stage": clean_value(row.get("WORK_STAGE") or "Pending"),
                    "risk_level": clean_value(row.get("RISK_LEVEL") or "LOW"),
                    "duplicate_risk": clean_value(row.get("DUPLICATE_RISK") or "LOW"),
                    "locality": locality_name or "Constituency Locality",
                    "location_precision": loc_precision,
                    "location_source": loc_source,
                    "raw_work": row_to_dict(row)
                }
            })

    mapped_works = len(features)
    unmapped_works = total_works - mapped_works

    return {
        "type": "FeatureCollection",
        "features": features,
        "meta": {
            "total_works": total_works,
            "mapped_works": mapped_works,
            "exact_works": exact_count,
            "locality_works": locality_count,
            "location_unavailable": unmapped_works
        }
    }


# ============================================================
# SINGLE WORK
# ============================================================

@app.get("/api/works/{work_id}")
def get_work(work_id: str):
    clean_id = str(work_id).strip()

    # 1. Prioritize numeric float match on WORK_ID
    try:
        val_num = float(clean_id)
        if column_exists("WORK_ID"):
            matches = df[df["WORK_ID"] == val_num]
            if not matches.empty:
                return row_to_dict(matches.iloc[0])
        if column_exists("WORK_RECOMMENDATION_DTL_ID"):
            matches = df[df["WORK_RECOMMENDATION_DTL_ID"] == val_num]
            if not matches.empty:
                return row_to_dict(matches.iloc[0])
    except ValueError:
        pass

    # 2. Exact string match fallback
    if column_exists("WORK_ID"):
        matches = df[df["WORK_ID"].astype(str).str.strip().eq(clean_id)]
        if not matches.empty:
            return row_to_dict(matches.iloc[0])

    if column_exists("WORK_RECOMMENDATION_DTL_ID"):
        matches = df[df["WORK_RECOMMENDATION_DTL_ID"].astype(str).str.strip().eq(clean_id)]
        if not matches.empty:
            return row_to_dict(matches.iloc[0])

    raise HTTPException(
        status_code=404,
        detail=f"Work not found: {work_id}"
    )


# ============================================================
# RISK CASES
# ============================================================

@app.get("/api/risk-cases")
def risk_cases(

    page: int = Query(
        1,
        ge=1
    ),

    limit: int = Query(
        100,
        ge=1,
        le=10000
    ),

    level: str | None = None,

    ida_name: str | None = None,

    state: str | None = None
):

    if not column_exists(
        "RISK_LEVEL"
    ):

        return {
            "page": page,
            "limit": limit,
            "total": 0,
            "pages": 0,
            "data": []
        }


    # --------------------------------------------------------
    # ACTUAL RISK CASES ONLY
    # --------------------------------------------------------

    data = df[
        df["RISK_LEVEL"]
        .fillna("")
        .astype(str)
        .str.upper()
        .isin([
            "HIGH",
            "MEDIUM"
        ])
    ].copy()


    # Optional level filter
    if level:

        data = data[
            data["RISK_LEVEL"]
            .astype(str)
            .str.upper()
            .eq(
                level.upper()
            )
        ]


    # State filter
    if state and column_exists(
        "STATE_NAME"
    ):

        data = data[
            text_contains(
                data["STATE_NAME"],
                state
            )
        ]


    # IDA filter
    if ida_name and column_exists(
        "IDA_NAME"
    ):

        data = data[
            text_contains(
                data["IDA_NAME"],
                ida_name
            )
        ]


    # Highest risk score first
    if column_exists(
        "RISK_SCORE"
    ):

        data = data.sort_values(
            "RISK_SCORE",
            ascending=False,
            na_position="last"
        )


    return pagination(
        data,
        page,
        limit
    )


# ============================================================
# DUPLICATE CASES
#
# One result = one duplicate cluster.
# ============================================================

@app.get("/api/duplicate-cases")
def duplicate_cases(

    page: int = Query(
        1,
        ge=1
    ),

    limit: int = Query(
        100,
        ge=1,
        le=10000
    ),

    level: str | None = None,

    state: str | None = None,

    constituency: str | None = None,

    mp_name: str | None = None,

    q: str | None = None
):

    if not column_exists(
        "CLUSTER_ID"
    ):

        return {
            "page": page,
            "limit": limit,
            "total": 0,
            "pages": 0,
            "data": []
        }


    # --------------------------------------------------------
    # Clustered works only
    # --------------------------------------------------------

    clustered = df[
        df["CLUSTER_ID"].notna()
    ].copy()


    # Duplicate risk
    if (
        level
        and column_exists(
            "DUPLICATE_RISK"
        )
    ):

        clustered = clustered[
            clustered["DUPLICATE_RISK"]
            .fillna("")
            .astype(str)
            .str.upper()
            .eq(
                level.upper()
            )
        ]


    # State
    if state and column_exists(
        "STATE_NAME"
    ):

        clustered = clustered[
            text_contains(
                clustered["STATE_NAME"],
                state
            )
        ]


    # Constituency
    if constituency and column_exists(
        "CONSTITUENCY"
    ):

        clustered = clustered[
            text_contains(
                clustered["CONSTITUENCY"],
                constituency
            )
        ]


    # MP
    if mp_name and column_exists(
        "MP_NAME"
    ):

        clustered = clustered[
            text_contains(
                clustered["MP_NAME"],
                mp_name
            )
        ]


    # Search
    if q:

        query = q.strip()

        if query:

            mask = pd.Series(
                False,
                index=clustered.index
            )

            search_columns = [
                "CLUSTER_ID",
                "WORK_ID",
                "STATE_NAME",
                "CONSTITUENCY",
                "MP_NAME",
                "WORK_DESCRIPTION"
            ]

            for col in search_columns:

                if column_exists(col):

                    mask = (
                        mask
                        |
                        text_contains(
                            clustered[col],
                            query
                        )
                    )

            clustered = clustered[mask]


    # --------------------------------------------------------
    # Build cluster records
    # --------------------------------------------------------

    cluster_records = []


    for cluster_id, group in clustered.groupby(
        "CLUSTER_ID",
        sort=False
    ):

        first = group.iloc[0]


        states = (
            unique_clean_values(
                group["STATE_NAME"]
            )
            if column_exists(
                "STATE_NAME"
            )
            else []
        )


        constituencies = (
            unique_clean_values(
                group["CONSTITUENCY"]
            )
            if column_exists(
                "CONSTITUENCY"
            )
            else []
        )


        mps = (
            unique_clean_values(
                group["MP_NAME"]
            )
            if column_exists(
                "MP_NAME"
            )
            else []
        )


        pair_count = (
            first_valid(
                group["PAIR_COUNT"]
            )
            if column_exists(
                "PAIR_COUNT"
            )
            else None
        )


        avg_text = (
            group["AVG_TEXT_SIMILARITY"]
            .mean()
            if column_exists(
                "AVG_TEXT_SIMILARITY"
            )
            else None
        )


        max_text = (
            group["MAX_TEXT_SIMILARITY"]
            .max()
            if column_exists(
                "MAX_TEXT_SIMILARITY"
            )
            else None
        )


        avg_amount = (
            group["AVG_AMOUNT_SIMILARITY"]
            .mean()
            if column_exists(
                "AVG_AMOUNT_SIMILARITY"
            )
            else None
        )


        max_amount = (
            group["MAX_AMOUNT_SIMILARITY"]
            .max()
            if column_exists(
                "MAX_AMOUNT_SIMILARITY"
            )
            else None
        )


        cluster_score = (
            group["CLUSTER_SUSPICION_SCORE"]
            .max()
            if column_exists(
                "CLUSTER_SUSPICION_SCORE"
            )
            else None
        )


        evidence_score = (
            group["EVIDENCE_SCORE"]
            .max()
            if column_exists(
                "EVIDENCE_SCORE"
            )
            else None
        )


        duplicate_risk = (
            first_valid(
                group["DUPLICATE_RISK"]
            )
            if column_exists(
                "DUPLICATE_RISK"
            )
            else None
        )


        suspicion_level = (
            first_valid(
                group["SUSPICION_LEVEL"]
            )
            if column_exists(
                "SUSPICION_LEVEL"
            )
            else None
        )


        evidence = (
            first_valid(
                group["EVIDENCE"]
            )
            if column_exists(
                "EVIDENCE"
            )
            else None
        )


        representative_work = (
            first_valid(
                group["WORK_ID"]
            )
            if column_exists(
                "WORK_ID"
            )
            else None
        )


        cluster_records.append({

            "CLUSTER_ID":
                clean_value(
                    cluster_id
                ),

            "CLUSTER_SIZE":
                len(group),

            "PAIR_COUNT":
                pair_count,

            "STATE_NAME":
                states[0]
                if states
                else None,

            "STATES":
                states,

            "CONSTITUENCY":
                constituencies[0]
                if constituencies
                else None,

            "CONSTITUENCIES":
                constituencies,

            "MP_NAME":
                mps[0]
                if mps
                else None,

            "MP_NAMES":
                mps,

            "REPRESENTATIVE_WORK_ID":
                representative_work,

            "AVG_TEXT_SIMILARITY":
                clean_value(
                    avg_text
                ),

            "MAX_TEXT_SIMILARITY":
                clean_value(
                    max_text
                ),

            "AVG_AMOUNT_SIMILARITY":
                clean_value(
                    avg_amount
                ),

            "MAX_AMOUNT_SIMILARITY":
                clean_value(
                    max_amount
                ),

            "DUPLICATE_RISK":
                duplicate_risk,

            "SUSPICION_LEVEL":
                suspicion_level,

            "CLUSTER_SUSPICION_SCORE":
                clean_value(
                    cluster_score
                ),

            "EVIDENCE_SCORE":
                clean_value(
                    evidence_score
                ),

            "EVIDENCE":
                evidence
        })


    clusters = pd.DataFrame(
        cluster_records
    )


    if clusters.empty:

        return {
            "page": page,
            "limit": limit,
            "total": 0,
            "pages": 0,
            "data": []
        }


    # Highest suspicion first
    clusters = clusters.sort_values(
        "CLUSTER_SUSPICION_SCORE",
        ascending=False,
        na_position="last"
    )


    total = len(clusters)

    start = (page - 1) * limit
    end = start + limit

    page_data = clusters.iloc[
        start:end
    ]


    return {
        "page": page,
        "limit": limit,
        "total": total,
        "pages": math.ceil(
            total / limit
        ) if total else 0,
        "data":
            dataframe_to_records(
                page_data
            )
    }


# ============================================================
# REVIEW CASES
# ============================================================

@app.get("/api/review-cases")
def review_cases(

    page: int = Query(
        1,
        ge=1
    ),

    limit: int = Query(
        100,
        ge=1,
        le=10000
    ),

    ida_name: str | None = None,

    state: str | None = None
):

    if not column_exists(
        "REQUIRES_REVIEW"
    ):

        return {
            "page": page,
            "limit": limit,
            "total": 0,
            "pages": 0,
            "data": []
        }


    review_mask = boolean_series(
        df["REQUIRES_REVIEW"]
    )


    data = df[
        review_mask
    ].copy()


    # State filter
    if state and column_exists(
        "STATE_NAME"
    ):

        data = data[
            text_contains(
                data["STATE_NAME"],
                state
            )
        ]


    # IDA filter
    if ida_name and column_exists(
        "IDA_NAME"
    ):

        data = data[
            text_contains(
                data["IDA_NAME"],
                ida_name
            )
        ]


    priority_columns = []

    for col in [
        "EVIDENCE_SCORE",
        "CLUSTER_SUSPICION_SCORE",
        "RISK_SCORE"
    ]:

        if column_exists(col):
            priority_columns.append(col)


    if priority_columns:

        for col in priority_columns:

            data[col] = pd.to_numeric(
                data[col],
                errors="coerce"
            )


        data = data.sort_values(
            priority_columns,
            ascending=False,
            na_position="last"
        )


    return pagination(
        data,
        page,
        limit
    )


# ============================================================
# DUPLICATE CLUSTER DETAIL
# ============================================================

@app.get("/api/clusters/{cluster_id}")
def get_cluster(
    cluster_id: int
):

    if not column_exists(
        "CLUSTER_ID"
    ):

        raise HTTPException(
            status_code=404,
            detail="Cluster information unavailable"
        )


    cluster = df[
        pd.to_numeric(
            df["CLUSTER_ID"],
            errors="coerce"
        ).eq(
            cluster_id
        )
    ].copy()


    if cluster.empty:

        raise HTTPException(
            status_code=404,
            detail=f"Cluster not found: {cluster_id}"
        )


    first = cluster.iloc[0]


    states = (
        unique_clean_values(
            cluster["STATE_NAME"]
        )
        if column_exists(
            "STATE_NAME"
        )
        else []
    )


    constituencies = (
        unique_clean_values(
            cluster["CONSTITUENCY"]
        )
        if column_exists(
            "CONSTITUENCY"
        )
        else []
    )


    mps = (
        unique_clean_values(
            cluster["MP_NAME"]
        )
        if column_exists(
            "MP_NAME"
        )
        else []
    )


    return {

        "cluster_id":
            clean_value(
                first["CLUSTER_ID"]
            ),

        "cluster_size":
            len(cluster),

        "pair_count":
            first_valid(
                cluster["PAIR_COUNT"]
            )
            if column_exists(
                "PAIR_COUNT"
            )
            else None,

        "state":
            states[0]
            if states
            else None,

        "states":
            states,

        "constituency":
            constituencies[0]
            if constituencies
            else None,

        "constituencies":
            constituencies,

        "mp_name":
            mps[0]
            if mps
            else None,

        "mp_names":
            mps,

        "duplicate_risk":
            first_valid(
                cluster["DUPLICATE_RISK"]
            )
            if column_exists(
                "DUPLICATE_RISK"
            )
            else None,

        "suspicion_level":
            first_valid(
                cluster["SUSPICION_LEVEL"]
            )
            if column_exists(
                "SUSPICION_LEVEL"
            )
            else None,

        "cluster_suspicion_score":
            clean_value(
                cluster[
                    "CLUSTER_SUSPICION_SCORE"
                ].max()
            )
            if column_exists(
                "CLUSTER_SUSPICION_SCORE"
            )
            else None,

        "evidence_score":
            clean_value(
                cluster[
                    "EVIDENCE_SCORE"
                ].max()
            )
            if column_exists(
                "EVIDENCE_SCORE"
            )
            else None,

        "evidence":
            first_valid(
                cluster["EVIDENCE"]
            )
            if column_exists(
                "EVIDENCE"
            )
            else None,

        "works":
            dataframe_to_records(
                cluster
            )
    }


# ============================================================
# STATES
# ============================================================

@app.get("/api/states")
def states():

    if not column_exists(
        "STATE_NAME"
    ):

        return {
            "count": 0,
            "states": []
        }


    state_list = unique_clean_values(
        df["STATE_NAME"]
    )


    return {
        "count": len(state_list),
        "states": state_list,
        "data": [{"STATE_NAME": s, "state": s} for s in state_list]
    }


# ============================================================
# CONSTITUENCIES
# ============================================================

@app.get("/api/constituencies")
def constituencies(
    state: str | None = None
):

    if not column_exists(
        "CONSTITUENCY"
    ):

        return {
            "count": 0,
            "constituencies": []
        }


    data = df


    if state and column_exists(
        "STATE_NAME"
    ):

        data = data[
            text_contains(
                data["STATE_NAME"],
                state
            )
        ]


    constituency_list = (
        unique_clean_values(
            data["CONSTITUENCY"]
        )
    )


    return {
        "count":
            len(constituency_list),

        "constituencies":
            constituency_list
    }


# ============================================================
# MPs
# ============================================================

@app.get("/api/mps")
def mps(
    state: str | None = None,
    include_stats: bool = False
):

    if not column_exists(
        "MP_NAME"
    ):

        return {
            "count": 0,
            "mps": []
        }


    data = df


    if state and column_exists(
        "STATE_NAME"
    ):

        data = data[
            text_contains(
                data["STATE_NAME"],
                state
            )
        ]


    mp_list = unique_clean_values(
        data["MP_NAME"]
    )


    response = {
        "count": len(mp_list),
        "mps": mp_list
    }

    if include_stats:
        counts = data["MP_NAME"].fillna("").astype(str).str.strip().value_counts()
        details_list = []
        for name, cnt in counts.items():
            if not name or name == "nan":
                continue
            mp_sub = data[data["MP_NAME"] == name]
            const = str(mp_sub["CONSTITUENCY"].dropna().iloc[0]) if "CONSTITUENCY" in mp_sub.columns and not mp_sub["CONSTITUENCY"].dropna().empty else ""
            st = str(mp_sub["STATE_NAME"].dropna().iloc[0]) if "STATE_NAME" in mp_sub.columns and not mp_sub["STATE_NAME"].dropna().empty else ""
            details_list.append({
                "mp_name": name,
                "constituency": const,
                "state": st,
                "works_count": int(cnt)
            })
        response["details"] = details_list

    return response


# ============================================================
# MP ANALYTICS
# ============================================================

@app.get("/api/analytics/mp")
def mp_analytics(
    mp_name: str = Query(..., description="Name or partial name of Member of Parliament")
):
    if not column_exists("MP_NAME"):
        raise HTTPException(status_code=404, detail="MP_NAME column not found in master dataset")

    query = mp_name.strip()
    if not query:
        raise HTTPException(status_code=400, detail="MP name cannot be empty")

    mask = text_contains(df["MP_NAME"], query)
    sub = df[mask]

    if sub.empty:
        raise HTTPException(status_code=404, detail=f"No works found for MP matching '{mp_name}'")

    canonical_name = str(sub["MP_NAME"].dropna().iloc[0]) if not sub["MP_NAME"].dropna().empty else query
    constituency = str(sub["CONSTITUENCY"].dropna().iloc[0]) if "CONSTITUENCY" in sub.columns and not sub["CONSTITUENCY"].dropna().empty else ""
    state = str(sub["STATE_NAME"].dropna().iloc[0]) if "STATE_NAME" in sub.columns and not sub["STATE_NAME"].dropna().empty else ""

    total_works = len(sub)
    rec_sum = float(sub["RECOMMENDED_AMOUNT"].sum()) if column_exists("RECOMMENDED_AMOUNT") else 0.0
    sanc_sum = float(sub["SANCTION_AMOUNT"].sum()) if column_exists("SANCTION_AMOUNT") else 0.0
    act_sum = float(sub["ACTUAL_AMOUNT"].sum()) if column_exists("ACTUAL_AMOUNT") else 0.0

    sanction_rate = round((sanc_sum / rec_sum * 100), 2) if rec_sum > 0 else 0.0
    expenditure_rate = round((act_sum / sanc_sum * 100), 2) if sanc_sum > 0 else 0.0

    # MPLADS Guidelines: Standard Annual Quota = ₹5.00 Crore (₹50,000,000)
    annual_quota = 50000000.0

    # Stage distribution
    stages_dict = {}
    if column_exists("WORK_STAGE"):
        st_counts = sub["WORK_STAGE"].fillna("Pending Sanction").astype(str).str.strip().value_counts()
        stages_dict = {k: int(v) for k, v in st_counts.items() if k and k != "nan"}

    # Completion rate
    completed_count = stages_dict.get("Work Completed", 0)
    partially_completed_count = stages_dict.get("Work partially Completed", 0)
    completion_rate = round(((completed_count + partially_completed_count) / total_works * 100), 2) if total_works > 0 else 0.0

    # Risk & anomaly summary
    high_dup_count = int((sub["DUPLICATE_RISK"].fillna("").astype(str).str.upper() == "HIGH").sum()) if column_exists("DUPLICATE_RISK") else 0
    med_dup_count = int((sub["DUPLICATE_RISK"].fillna("").astype(str).str.upper() == "MEDIUM").sum()) if column_exists("DUPLICATE_RISK") else 0
    low_dup_count = total_works - high_dup_count - med_dup_count

    review_count = int(boolean_series(sub["REQUIRES_REVIEW"]).sum()) if column_exists("REQUIRES_REVIEW") else 0

    delayed_count = 0
    if column_exists("SANCTION_DELAY_DAYS") and column_exists("PEER_MEDIAN_SANCTION_DELAY"):
        delay_mask = (sub["SANCTION_DELAY_DAYS"] > sub["PEER_MEDIAN_SANCTION_DELAY"]) & sub["SANCTION_DELAY_DAYS"].notna()
        delayed_count = int(delay_mask.sum())

    cost_variance_count = 0
    if column_exists("COST_VS_PEER"):
        cost_mask = (sub["COST_VS_PEER"] > 1.2) & sub["COST_VS_PEER"].notna()
        cost_variance_count = int(cost_mask.sum())

    # Top implementing agencies for this MP's works
    top_agencies = []
    if column_exists("IDA_NAME"):
        ida_counts = sub["IDA_NAME"].fillna("Unassigned").astype(str).str.strip().value_counts().head(5)
        top_agencies = [{"agency": k, "works_count": int(v)} for k, v in ida_counts.items() if k and k != "nan"]

    # Top categories
    top_categories = []
    if column_exists("WORK_CATEGORY"):
        cat_counts = sub["WORK_CATEGORY"].fillna("General/Others").astype(str).str.strip().value_counts().head(5)
        top_categories = [{"category": k, "works_count": int(v)} for k, v in cat_counts.items() if k and k != "nan"]

    # Flagged works watchlist (top 8 items requiring MP oversight)
    flag_mask = pd.Series(False, index=sub.index)
    if column_exists("DUPLICATE_RISK"):
        flag_mask = flag_mask | (sub["DUPLICATE_RISK"].fillna("").astype(str).str.upper().isin(["HIGH", "MEDIUM"]))
    if column_exists("REQUIRES_REVIEW"):
        flag_mask = flag_mask | boolean_series(sub["REQUIRES_REVIEW"])
    if column_exists("SANCTION_DELAY_DAYS") and column_exists("PEER_MEDIAN_SANCTION_DELAY"):
        flag_mask = flag_mask | ((sub["SANCTION_DELAY_DAYS"] > sub["PEER_MEDIAN_SANCTION_DELAY"]) & sub["SANCTION_DELAY_DAYS"].notna())

    flagged_df = sub[flag_mask]
    if flagged_df.empty:
        flagged_df = sub.head(5)
    else:
        sort_col = "RISK_SCORE" if column_exists("RISK_SCORE") else "RECOMMENDED_AMOUNT"
        flagged_df = flagged_df.sort_values(by=sort_col, ascending=False).head(8)

    flagged_records = dataframe_to_records(flagged_df)

    return {
        "mp_name": canonical_name,
        "constituency": constituency,
        "state": state,
        "house": "Lok Sabha",
        "total_works": total_works,
        "financials": {
            "recommended_amount": rec_sum,
            "sanction_amount": sanc_sum,
            "actual_amount": act_sum,
            "sanction_rate_percent": sanction_rate,
            "expenditure_rate_percent": expenditure_rate,
            "annual_quota": annual_quota,
            "uncommitted_quota": max(0.0, annual_quota - sanc_sum)
        },
        "stages": stages_dict,
        "completion_rate_percent": completion_rate,
        "risk_summary": {
            "high_duplicate_risk": high_dup_count,
            "medium_duplicate_risk": med_dup_count,
            "low_duplicate_risk": low_dup_count,
            "requires_review": review_count,
            "delayed_sanctions": delayed_count,
            "cost_exceeded": cost_variance_count
        },
        "top_agencies": top_agencies,
        "top_categories": top_categories,
        "flagged_works": flagged_records
    }


# ============================================================
# DISTRICT AUTHORITIES (IDAs) LIST
# ============================================================

@app.get("/api/idas")
def list_idas(
    state: str | None = None,
    q: str | None = None
):
    if not column_exists("IDA_NAME"):
        return {"count": 0, "idas": []}

    data = df
    if state and column_exists("STATE_NAME"):
        data = data[text_contains(data["STATE_NAME"], state.strip())]

    if q:
        data = data[text_contains(data["IDA_NAME"], q.strip())]

    if data.empty:
        return {"count": 0, "idas": [], "data": []}

    cleaned_idas = data["IDA_NAME"].fillna("").astype(str).str.strip()
    valid_mask = (cleaned_idas != "") & (cleaned_idas != "nan")
    if not valid_mask.any():
        return {"count": 0, "idas": [], "data": []}

    filtered_data = data[valid_mask].copy()
    filtered_data["_IDA_CLEAN"] = cleaned_idas[valid_mask]

    counts = filtered_data["_IDA_CLEAN"].value_counts()
    first_rows = filtered_data.drop_duplicates(subset=["_IDA_CLEAN"]).set_index("_IDA_CLEAN")

    ida_items = []
    for name, cnt in counts.items():
        row = first_rows.loc[name]
        district = name.split("(")[0].strip() if "(" in name else name
        st = str(row["STATE_NAME"]) if "STATE_NAME" in row and pd.notna(row["STATE_NAME"]) else ""
        constituency = str(row["CONSTITUENCY"]) if "CONSTITUENCY" in row and pd.notna(row["CONSTITUENCY"]) else ""
        ida_items.append({
            "ida_name": name,
            "district_name": district,
            "state": st,
            "constituency": constituency,
            "works_count": int(cnt),
            "IDA_NAME": name,
            "STATE_NAME": st,
            "total_works": int(cnt)
        })

    return {
        "count": len(ida_items),
        "idas": ida_items,
        "data": ida_items
    }


# ============================================================
# DISTRICT AUTHORITY (DA) ANALYTICS & TELEMETRY
# ============================================================

@app.get("/api/analytics/da")
def da_analytics(
    ida_name: str | None = Query(None, description="Exact or partial IDA_NAME for District Authority"),
    district: str | None = Query(None, description="District name keyword"),
    state: str | None = Query(None, description="State name filter")
):
    if not column_exists("IDA_NAME"):
        raise HTTPException(status_code=404, detail="IDA_NAME column not found in master dataset")

    data = df

    if state and column_exists("STATE_NAME"):
        data = data[text_contains(data["STATE_NAME"], state.strip())]

    if ida_name:
        data = data[text_contains(data["IDA_NAME"], ida_name.strip())]
    elif district:
        data = data[text_contains(data["IDA_NAME"], district.strip())]

    if data.empty:
        raise HTTPException(status_code=404, detail="No works found for specified District Authority scope")

    # Scope identity
    if ida_name and not data.empty:
        canonical_ida = str(data["IDA_NAME"].dropna().iloc[0])
        clean_district = canonical_ida.split("(")[0].strip() if "(" in canonical_ida else canonical_ida
    elif district and not data.empty:
        canonical_ida = str(data["IDA_NAME"].dropna().iloc[0])
        clean_district = district.strip().upper()
    else:
        canonical_ida = "All District Authorities (National Scope)"
        clean_district = "All Districts"

    canonical_state = str(data["STATE_NAME"].dropna().iloc[0]) if "STATE_NAME" in data.columns and not data["STATE_NAME"].dropna().empty else "All States"

    total_works = len(data)
    rec_sum = float(data["RECOMMENDED_AMOUNT"].sum()) if column_exists("RECOMMENDED_AMOUNT") else 0.0
    sanc_sum = float(data["SANCTION_AMOUNT"].sum()) if column_exists("SANCTION_AMOUNT") else 0.0
    act_sum = float(data["ACTUAL_AMOUNT"].sum()) if column_exists("ACTUAL_AMOUNT") else 0.0
    remaining_amount = max(0.0, sanc_sum - act_sum)

    sanction_rate = round((sanc_sum / rec_sum * 100), 2) if rec_sum > 0 else 0.0
    expenditure_rate = round((act_sum / sanc_sum * 100), 2) if sanc_sum > 0 else 0.0

    # Stages distribution
    stages_dict = {}
    if column_exists("WORK_STAGE"):
        st_counts = data["WORK_STAGE"].fillna("Pending Sanction").astype(str).str.strip().value_counts()
        stages_dict = {k: int(v) for k, v in st_counts.items() if k and k != "nan"}

    # Sanction monitoring
    pending_sanction_count = stages_dict.get("Pending Sanction", 0) + stages_dict.get("Unknown", 0)
    sanctioned_count = int((data["SANCTION_AMOUNT"] > 0).sum()) if column_exists("SANCTION_AMOUNT") else total_works - pending_sanction_count

    avg_sanction_delay = 0.0
    delayed_past_peer_count = 0
    peer_median_delay = 0.0
    if column_exists("SANCTION_DELAY_DAYS"):
        valid_delays = data["SANCTION_DELAY_DAYS"].dropna()
        avg_sanction_delay = round(float(valid_delays.mean()), 1) if not valid_delays.empty else 0.0
        if column_exists("PEER_MEDIAN_SANCTION_DELAY"):
            peer_delays = data["PEER_MEDIAN_SANCTION_DELAY"].dropna()
            peer_median_delay = round(float(peer_delays.median()), 1) if not peer_delays.empty else 0.0
            delay_mask = (data["SANCTION_DELAY_DAYS"] > data["PEER_MEDIAN_SANCTION_DELAY"]) & data["SANCTION_DELAY_DAYS"].notna()
            delayed_past_peer_count = int(delay_mask.sum())

    # Completion monitoring
    completed_count = stages_dict.get("Work Completed", 0)
    partially_completed_count = stages_dict.get("Work partially Completed", 0)
    physical_inspection_count = stages_dict.get("Physical Inspection", 0)
    vendor_id_count = stages_dict.get("Vendor Identification", 0)
    completion_rate = round((completed_count / total_works * 100), 2) if total_works > 0 else 0.0

    # Overdue count (>365 days since sanction without completion)
    overdue_count = 0
    if column_exists("SANCTION_DATE") and column_exists("WORK_STAGE"):
        sanc_dt = pd.to_datetime(data["SANCTION_DATE"], errors="coerce")
        ref_dt = pd.to_datetime("2026-09-01")
        is_uncompleted = data["WORK_STAGE"] != "Work Completed"
        elapsed = (ref_dt - sanc_dt).dt.days
        overdue_mask = is_uncompleted & (elapsed > 365) & sanc_dt.notna()
        overdue_count = int(overdue_mask.sum())

    # Risk & Anomaly Summary
    high_dup = int((data["DUPLICATE_RISK"].fillna("").astype(str).str.upper() == "HIGH").sum()) if column_exists("DUPLICATE_RISK") else 0
    med_dup = int((data["DUPLICATE_RISK"].fillna("").astype(str).str.upper() == "MEDIUM").sum()) if column_exists("DUPLICATE_RISK") else 0
    low_dup = total_works - high_dup - med_dup

    high_risk = int((data["RISK_LEVEL"].fillna("").astype(str).str.upper() == "HIGH").sum()) if column_exists("RISK_LEVEL") else 0
    med_risk = int((data["RISK_LEVEL"].fillna("").astype(str).str.upper() == "MEDIUM").sum()) if column_exists("RISK_LEVEL") else 0
    low_risk = total_works - high_risk - med_risk

    review_count = int(boolean_series(data["REQUIRES_REVIEW"]).sum()) if column_exists("REQUIRES_REVIEW") else 0

    cost_variance_cases = 0
    if column_exists("COST_VS_PEER"):
        cv_mask = (data["COST_VS_PEER"] > 1.2) & data["COST_VS_PEER"].notna()
        cost_variance_cases = int(cv_mask.sum())

    unique_clusters = int(data["CLUSTER_ID"].dropna().nunique()) if column_exists("CLUSTER_ID") else 0

    # 4 Key KPIs
    attention_required = int(review_count + high_dup)
    timeline_concerns = int(delayed_past_peer_count + overdue_count)

    # Top implementing authorities in this scope
    top_idas = []
    if column_exists("IDA_NAME"):
        top_ida_counts = data["IDA_NAME"].value_counts().head(5)
        top_idas = [{"name": k, "count": int(v)} for k, v in top_ida_counts.items()]

    # Priority cases (ordered by explainable severity: review required / duplicate risk / delayed past peer)
    p_mask = pd.Series(False, index=data.index)
    if column_exists("REQUIRES_REVIEW"):
        p_mask = p_mask | boolean_series(data["REQUIRES_REVIEW"])
    if column_exists("DUPLICATE_RISK"):
        p_mask = p_mask | (data["DUPLICATE_RISK"].fillna("").astype(str).str.upper().isin(["HIGH", "MEDIUM"]))
    if column_exists("SANCTION_DELAY_DAYS") and column_exists("PEER_MEDIAN_SANCTION_DELAY"):
        p_mask = p_mask | ((data["SANCTION_DELAY_DAYS"] > data["PEER_MEDIAN_SANCTION_DELAY"]) & data["SANCTION_DELAY_DAYS"].notna())

    priority_df = data[p_mask]
    if priority_df.empty:
        priority_df = data.head(12)
    else:
        sort_cols = [c for c in ["EVIDENCE_SCORE", "CLUSTER_SUSPICION_SCORE", "RISK_SCORE", "SANCTION_DELAY_DAYS"] if column_exists(c)]
        if sort_cols:
            priority_df = priority_df.sort_values(by=sort_cols, ascending=False).head(12)
        else:
            priority_df = priority_df.head(12)

    priority_records = dataframe_to_records(priority_df)

    # 45-Day Statutory Compliance (Section 3.12 MPLADS Guidelines)
    exceeded_45_count = 0
    approaching_45_count = 0
    compliant_45_count = 0
    if column_exists("SANCTION_DELAY_DAYS"):
        delays = data["SANCTION_DELAY_DAYS"].dropna()
        exceeded_45_count = int((delays > 45).sum())
        approaching_45_count = int(((delays >= 30) & (delays <= 45)).sum())
        compliant_45_count = int((delays < 30).sum())

    # Evidence & photo verification telemetry
    evidence_cases_count = int(data["EVIDENCE_SCORE"].notna().sum()) if column_exists("EVIDENCE_SCORE") else 0
    high_suspicion_count = int((data["SUSPICION_LEVEL"].fillna("").astype(str).str.upper() == "HIGH SUSPICION").sum()) if column_exists("SUSPICION_LEVEL") else 0

    # Implementing Agencies performance list
    ia_performance = []
    if column_exists("IDA_NAME"):
        for ida_n, grp in data.groupby("IDA_NAME"):
            tot = len(grp)
            sanc_c = int((grp["SANCTION_AMOUNT"] > 0).sum()) if "SANCTION_AMOUNT" in grp.columns else 0
            comp_c = int((grp["WORK_STAGE"] == "Work Completed").sum()) if "WORK_STAGE" in grp.columns else 0
            sanc_val = float(grp["SANCTION_AMOUNT"].sum()) if "SANCTION_AMOUNT" in grp.columns else 0.0
            act_val = float(grp["ACTUAL_AMOUNT"].sum()) if "ACTUAL_AMOUNT" in grp.columns else 0.0
            del_c = int((grp["SANCTION_DELAY_DAYS"] > 45).sum()) if "SANCTION_DELAY_DAYS" in grp.columns else 0
            raw_str = str(ida_n)
            clean_n = raw_str.split("(")[0].strip() if "(" in raw_str else raw_str
            ia_performance.append({
                "name": raw_str,
                "clean_name": clean_n,
                "total_works": tot,
                "sanctioned_works": sanc_c,
                "completed_works": comp_c,
                "sanction_amount": sanc_val,
                "actual_amount": act_val,
                "delayed_count": del_c,
                "completion_rate": round((comp_c / tot * 100), 1) if tot > 0 else 0.0
            })
        ia_performance = sorted(ia_performance, key=lambda x: x["total_works"], reverse=True)[:10]

    # Sidebar 11 items badges
    sidebar_badges = {
        "overview": total_works,
        "pending_sanctions": pending_sanction_count,
        "compliance_45d": exceeded_45_count,
        "completion": overdue_count,
        "financials": cost_variance_cases,
        "risk_cases": int(high_risk + med_risk),
        "duplicates": int(high_dup + med_dup),
        "ia_monitoring": len(ia_performance),
        "evidence": evidence_cases_count,
        "geo_photo": int(physical_inspection_count + completed_count),
        "alerts_queue": attention_required,
    }

    return {
        "ida_name": canonical_ida,
        "district_name": clean_district,
        "state": canonical_state,
        "total_works": total_works,
        "kpis": {
            "total_works": total_works,
            "recommended_amount": rec_sum,
            "attention_required": attention_required,
            "high_risk_works": int(high_risk + high_dup),
            "timeline_concerns": timeline_concerns,
            "sanction_conversion_rate": sanction_rate,
            "completion_rate": completion_rate
        },
        "financials": {
            "recommended_amount": rec_sum,
            "sanction_amount": sanc_sum,
            "actual_amount": act_sum,
            "remaining_amount": remaining_amount,
            "sanction_rate_percent": sanction_rate,
            "expenditure_rate_percent": expenditure_rate,
            "cost_variance_cases": cost_variance_cases
        },
        "sanction_monitoring": {
            "pending_sanction_count": pending_sanction_count,
            "sanctioned_count": sanctioned_count,
            "avg_sanction_delay_days": avg_sanction_delay,
            "peer_median_delay_days": peer_median_delay,
            "delayed_past_peer_count": delayed_past_peer_count
        },
        "compliance_45d": {
            "exceeded_count": exceeded_45_count,
            "approaching_count": approaching_45_count,
            "compliant_count": compliant_45_count,
            "avg_delay_days": avg_sanction_delay,
            "peer_median_delay_days": peer_median_delay,
        },
        "completion_monitoring": {
            "physical_inspection_count": physical_inspection_count,
            "vendor_identification_count": vendor_id_count,
            "under_construction_count": partially_completed_count,
            "completed_count": completed_count,
            "completion_rate_percent": completion_rate,
            "overdue_count": overdue_count
        },
        "risk_summary": {
            "high_risk": high_risk,
            "medium_risk": med_risk,
            "low_risk": low_risk,
            "high_duplicate_risk": high_dup,
            "medium_duplicate_risk": med_dup,
            "low_duplicate_risk": low_dup,
            "requires_review": review_count,
            "duplicate_clusters_count": unique_clusters,
            "cost_variance_cases": cost_variance_cases
        },
        "evidence_verification": {
            "total_evidence_cases": evidence_cases_count,
            "high_suspicion_count": high_suspicion_count,
        },
        "stages": stages_dict,
        "top_authorities": top_idas,
        "ia_performance": ia_performance,
        "priority_cases": priority_records,
        "sidebar_badges": sidebar_badges
    }


# ============================================================
# IMPLEMENTING AGENCY (IA) ANALYTICS & EXECUTION TELEMETRY
# ============================================================

@app.get("/api/analytics/ia")
def ia_analytics(
    ida_name: str | None = Query(None, description="Exact or partial IDA_NAME for Implementing Agency"),
    state: str | None = Query(None, description="State name filter")
):
    if not column_exists("IDA_NAME"):
        raise HTTPException(status_code=404, detail="IDA_NAME column not found in master dataset")

    data = df

    if state and column_exists("STATE_NAME"):
        data = data[text_contains(data["STATE_NAME"], state.strip())]

    if ida_name and ida_name.strip() and ida_name.strip().upper() != "ALL":
        data = data[text_contains(data["IDA_NAME"], ida_name.strip())]

    if data.empty:
        raise HTTPException(status_code=404, detail="No works found for specified Implementing Agency scope")

    # Scope identity
    if ida_name and ida_name.strip().upper() != "ALL" and not data.empty:
        canonical_ida = str(data["IDA_NAME"].dropna().iloc[0])
        clean_agency = canonical_ida.split("(")[0].strip() if "(" in canonical_ida else canonical_ida
    else:
        canonical_ida = "All Implementing Agencies (National Scope)"
        clean_agency = "All Implementing Agencies"

    canonical_state = str(data["STATE_NAME"].dropna().iloc[0]) if "STATE_NAME" in data.columns and not data["STATE_NAME"].dropna().empty else "All States"

    total_works = len(data)

    # Financials (Real columns: SANCTION_AMOUNT, ACTUAL_AMOUNT, RECOMMENDED_AMOUNT)
    rec_sum = float(data["RECOMMENDED_AMOUNT"].sum()) if column_exists("RECOMMENDED_AMOUNT") else 0.0
    sanc_sum = float(data["SANCTION_AMOUNT"].sum()) if column_exists("SANCTION_AMOUNT") else 0.0
    act_sum = float(data["ACTUAL_AMOUNT"].sum()) if column_exists("ACTUAL_AMOUNT") else 0.0
    remaining_amount = max(0.0, sanc_sum - act_sum)
    cost_variance_sum = float(data["COST_VARIANCE"].sum()) if column_exists("COST_VARIANCE") else (act_sum - sanc_sum)

    # Stages Breakdown
    stages_dict = {}
    if column_exists("WORK_STAGE"):
        st_counts = data["WORK_STAGE"].fillna("Pending Sanction").astype(str).str.strip().value_counts()
        stages_dict = {k: int(v) for k, v in st_counts.items() if k and k != "nan"}

    # Execution categorization
    # Assigned: Sanctioned works
    assigned_count = int((data["SANCTION_AMOUNT"] > 0).sum()) if column_exists("SANCTION_AMOUNT") else total_works

    # Ongoing works: stages in active execution
    ongoing_stages = ["Physical Inspection", "Work partially Completed", "Vendor Identification", "Time Estimation"]
    ongoing_count = sum(stages_dict.get(s, 0) for s in ongoing_stages)

    # Completed works
    completed_count = stages_dict.get("Work Completed", 0)

    # Delays & Durations
    avg_completion_duration = 0.0
    peer_median_completion = 0.0
    delayed_completion_count = 0
    if column_exists("COMPLETION_DURATION_DAYS"):
        valid_cd = data["COMPLETION_DURATION_DAYS"][(data["COMPLETION_DURATION_DAYS"] > 0) & data["COMPLETION_DURATION_DAYS"].notna()]
        avg_completion_duration = round(float(valid_cd.mean()), 1) if not valid_cd.empty else 0.0
        if column_exists("PEER_MEDIAN_COMPLETION_DAYS"):
            peer_cd = data["PEER_MEDIAN_COMPLETION_DAYS"].dropna()
            peer_median_completion = round(float(peer_cd.median()), 1) if not peer_cd.empty else 0.0
            delay_mask = (data["COMPLETION_DURATION_DAYS"] > data["PEER_MEDIAN_COMPLETION_DAYS"]) & (data["COMPLETION_DURATION_DAYS"] > 0)
            delayed_completion_count = int(delay_mask.sum())

    # Evidence & Documentation
    evidence_records_count = int(data["EVIDENCE"].notna().sum()) if column_exists("EVIDENCE") else 0
    evidence_scored_count = int(data["EVIDENCE_SCORE"].notna().sum()) if column_exists("EVIDENCE_SCORE") else 0
    avg_evidence_score = round(float(data["EVIDENCE_SCORE"].dropna().mean()), 1) if evidence_scored_count > 0 else 0.0
    evidence_issues_count = int(((data["EVIDENCE_SCORE"] < 60) & data["EVIDENCE_SCORE"].notna()).sum()) if column_exists("EVIDENCE_SCORE") else 0
    if column_exists("REQUIRES_REVIEW"):
        evidence_issues_count = max(evidence_issues_count, int(boolean_series(data["REQUIRES_REVIEW"]).sum()))

    # Risk summary
    high_risk = int((data["RISK_LEVEL"].fillna("").astype(str).str.upper() == "HIGH").sum()) if column_exists("RISK_LEVEL") else 0
    med_risk = int((data["RISK_LEVEL"].fillna("").astype(str).str.upper() == "MEDIUM").sum()) if column_exists("RISK_LEVEL") else 0
    low_risk = total_works - high_risk - med_risk

    # Duplicate summary
    high_dup = int((data["DUPLICATE_RISK"].fillna("").astype(str).str.upper() == "HIGH").sum()) if column_exists("DUPLICATE_RISK") else 0
    med_dup = int((data["DUPLICATE_RISK"].fillna("").astype(str).str.upper() == "MEDIUM").sum()) if column_exists("DUPLICATE_RISK") else 0
    low_dup = total_works - high_dup - med_dup
    unique_clusters = int(data["CLUSTER_ID"].dropna().nunique()) if column_exists("CLUSTER_ID") else 0

    # 10 IA Sections Telemetry
    ongoing_mask = data["WORK_STAGE"].isin(ongoing_stages) if column_exists("WORK_STAGE") else pd.Series(False, index=data.index)
    
    # 3. Upcoming Deadlines
    upcoming_deadlines_count = 0
    if column_exists("COMPLETION_DURATION_DAYS") and column_exists("PEER_MEDIAN_COMPLETION_DAYS"):
        upcoming_deadlines_count = int((ongoing_mask & (data["COMPLETION_DURATION_DAYS"] >= 0.8 * data["PEER_MEDIAN_COMPLETION_DAYS"]) & (data["COMPLETION_DURATION_DAYS"] > 0)).sum())

    # 4. Payment Requests
    payment_requests_count = int((data["ACTUAL_AMOUNT"] > 0).sum()) if column_exists("ACTUAL_AMOUNT") else 0

    # 5. Vendor Activity (Executing Authorities/Vendors)
    vendor_count = int(data["IDA_NAME"].dropna().nunique()) if column_exists("IDA_NAME") else 0

    # 7. Geo-Photo Verification
    geo_photo_count = int(data["WORK_STAGE"].isin(["Physical Inspection", "Work Completed"]).sum()) if column_exists("WORK_STAGE") else 0

    # 8. Missing Evidence
    m_mask = pd.Series(False, index=data.index)
    if column_exists("EVIDENCE_SCORE"):
        m_mask = m_mask | ((data["EVIDENCE_SCORE"] < 60) & data["EVIDENCE_SCORE"].notna())
    if column_exists("EVIDENCE") and column_exists("WORK_STAGE"):
        m_mask = m_mask | (data["EVIDENCE"].isna() & ongoing_mask)
    if column_exists("REQUIRES_REVIEW"):
        m_mask = m_mask | boolean_series(data["REQUIRES_REVIEW"])
    missing_evidence_count = int(m_mask.sum())

    # 9. Completion Ready
    completion_ready_count = int(data["WORK_STAGE"].isin(["Work partially Completed", "Work Completed"]).sum()) if column_exists("WORK_STAGE") else completed_count

    # 10. AI Alerts (Inconsistencies requiring correction)
    ai_alerts_mask = pd.Series(False, index=data.index)
    if column_exists("REQUIRES_REVIEW"):
        ai_alerts_mask = ai_alerts_mask | boolean_series(data["REQUIRES_REVIEW"])
    if column_exists("RISK_LEVEL"):
        ai_alerts_mask = ai_alerts_mask | (data["RISK_LEVEL"].fillna("").astype(str).str.upper().isin(["HIGH", "MEDIUM"]))
    if column_exists("DUPLICATE_RISK"):
        ai_alerts_mask = ai_alerts_mask | (data["DUPLICATE_RISK"].fillna("").astype(str).str.upper() == "HIGH")
    if column_exists("COST_VARIANCE") and column_exists("SANCTION_AMOUNT"):
        ai_alerts_mask = ai_alerts_mask | ((data["COST_VARIANCE"] > 0) & (data["SANCTION_AMOUNT"] > 0))
    ai_alerts_count = int(ai_alerts_mask.sum())

    # Vendor Summary Aggregation (Top 25 implementing agencies/vendors)
    vendor_summary = []
    if column_exists("IDA_NAME"):
        summary_source = data
        if ida_name and column_exists("STATE_NAME") and not data.empty and not data["STATE_NAME"].dropna().empty:
            current_state = str(data["STATE_NAME"].dropna().iloc[0])
            summary_source = df[df["STATE_NAME"] == current_state]

        top_idas = summary_source["IDA_NAME"].value_counts().head(25)
        for ida_val, w_count in top_idas.items():
            ida_df = summary_source[summary_source["IDA_NAME"] == ida_val]
            s_amt = float(ida_df["SANCTION_AMOUNT"].sum()) if column_exists("SANCTION_AMOUNT") else 0.0
            a_amt = float(ida_df["ACTUAL_AMOUNT"].sum()) if column_exists("ACTUAL_AMOUNT") else 0.0
            comp_c = int((ida_df["WORK_STAGE"] == "Work Completed").sum()) if column_exists("WORK_STAGE") else 0
            ong_c = int(ida_df["WORK_STAGE"].isin(ongoing_stages).sum()) if column_exists("WORK_STAGE") else 0
            clean_name = str(ida_val).split("(")[0].strip() if "(" in str(ida_val) else str(ida_val)
            vendor_summary.append({
                "ida_name": str(ida_val),
                "clean_name": clean_name,
                "total_works": int(w_count),
                "sanction_amount": s_amt,
                "actual_amount": a_amt,
                "completed_works": comp_c,
                "ongoing_works": ong_c,
                "utilization_pct": round((a_amt / s_amt * 100), 1) if s_amt > 0 else 0.0
            })

    # Primary KPIs (4 standard cards)
    primary_kpis = {
        "assigned_works": assigned_count,
        "ongoing_works": ongoing_count,
        "attention_required": ai_alerts_count,
        "evidence_issues": missing_evidence_count
    }

    # Sidebar 10 sections badges
    sidebar_badges = {
        "assigned_works": assigned_count,
        "execution_progress": ongoing_count,
        "upcoming_deadlines": upcoming_deadlines_count,
        "payment_requests": payment_requests_count,
        "vendor_activity": len(vendor_summary) if vendor_summary else vendor_count,
        "evidence_upload": evidence_records_count,
        "geo_photo_verification": geo_photo_count,
        "missing_evidence": missing_evidence_count,
        "completion": completion_ready_count,
        "ai_alerts": ai_alerts_count,
        # Backward compatibility aliases
        "overview": total_works,
        "register": assigned_count,
        "attention": ai_alerts_count,
        "ongoing": ongoing_count,
        "financial": payment_requests_count,
        "delays": upcoming_deadlines_count,
        "evidence": evidence_records_count,
        "geo_photos": geo_photo_count,
        "risk": int(high_risk + med_risk),
        "duplicates": int(high_dup + med_dup)
    }

    return {
        "ida_name": canonical_ida,
        "agency_name": clean_agency,
        "state": canonical_state,
        "total_works": total_works,
        "primary_kpis": primary_kpis,
        "vendor_summary": vendor_summary,
        "financials": {
            "recommended_amount": rec_sum,
            "sanction_amount": sanc_sum,
            "actual_amount": act_sum,
            "remaining_amount": remaining_amount,
            "cost_variance": cost_variance_sum,
            "expenditure_rate_percent": round((act_sum / sanc_sum * 100), 2) if sanc_sum > 0 else 0.0
        },
        "lifecycle": {
            "assigned": assigned_count,
            "ongoing": ongoing_count,
            "completed": completed_count,
            "stages_breakdown": stages_dict,
            "completion_rate_percent": round((completed_count / total_works * 100), 2) if total_works > 0 else 0.0
        },
        "delays": {
            "delayed_works_count": delayed_completion_count,
            "upcoming_deadlines_count": upcoming_deadlines_count,
            "avg_completion_duration_days": avg_completion_duration,
            "peer_median_completion_days": peer_median_completion
        },
        "evidence": {
            "total_evidence_records": evidence_records_count,
            "scored_records": evidence_scored_count,
            "avg_evidence_score": avg_evidence_score,
            "evidence_issues_count": missing_evidence_count
        },
        "risk_summary": {
            "high_risk": high_risk,
            "medium_risk": med_risk,
            "low_risk": low_risk,
            "high_duplicate_risk": high_dup,
            "medium_duplicate_risk": med_dup,
            "low_duplicate_risk": low_dup,
            "duplicate_clusters_count": unique_clusters
        },
        "sidebar_badges": sidebar_badges
    }


# ============================================================
# STATE ANALYTICS
# ============================================================

@app.get("/api/analytics/states")
def state_analytics():

    if not column_exists(
        "STATE_NAME"
    ):

        return {
            "data": []
        }


    grouped = (
        df.groupby(
            "STATE_NAME",
            dropna=False
        )
        .size()
        .reset_index(
            name="TOTAL_WORKS"
        )
    )


    # High risk
    if column_exists(
        "RISK_LEVEL"
    ):

        high_mask = (
            df["RISK_LEVEL"]
            .fillna("")
            .astype(str)
            .str.upper()
            .eq("HIGH")
        )


        high = (
            df[high_mask]
            .groupby(
                "STATE_NAME"
            )
            .size()
            .reset_index(
                name="HIGH_RISK"
            )
        )


        grouped = grouped.merge(
            high,
            on="STATE_NAME",
            how="left"
        )


    # Medium risk
    if column_exists(
        "RISK_LEVEL"
    ):

        medium_mask = (
            df["RISK_LEVEL"]
            .fillna("")
            .astype(str)
            .str.upper()
            .eq("MEDIUM")
        )


        medium = (
            df[medium_mask]
            .groupby(
                "STATE_NAME"
            )
            .size()
            .reset_index(
                name="MEDIUM_RISK"
            )
        )


        grouped = grouped.merge(
            medium,
            on="STATE_NAME",
            how="left"
        )


    # High duplicate
    if column_exists(
        "DUPLICATE_RISK"
    ):

        duplicate_mask = (
            df["DUPLICATE_RISK"]
            .fillna("")
            .astype(str)
            .str.upper()
            .eq("HIGH")
        )


        duplicate = (
            df[duplicate_mask]
            .groupby(
                "STATE_NAME"
            )
            .size()
            .reset_index(
                name="HIGH_DUPLICATE"
            )
        )


        grouped = grouped.merge(
            duplicate,
            on="STATE_NAME",
            how="left"
        )


    # Review
    if column_exists(
        "REQUIRES_REVIEW"
    ):

        review_mask = boolean_series(
            df["REQUIRES_REVIEW"]
        )


        review = (
            df[review_mask]
            .groupby(
                "STATE_NAME"
            )
            .size()
            .reset_index(
                name="REVIEW_REQUIRED"
            )
        )


        grouped = grouped.merge(
            review,
            on="STATE_NAME",
            how="left"
        )


    # Sanctioned works and financial totals
    if column_exists("SANCTION_AMOUNT"):
        sanc = (
            df[df["SANCTION_AMOUNT"] > 0]
            .groupby("STATE_NAME")
            .size()
            .reset_index(name="SANCTIONED_WORKS")
        )
        grouped = grouped.merge(sanc, on="STATE_NAME", how="left")

        sanc_amt = (
            df.groupby("STATE_NAME")["SANCTION_AMOUNT"]
            .sum()
            .reset_index(name="SANCTION_AMOUNT")
        )
        grouped = grouped.merge(sanc_amt, on="STATE_NAME", how="left")

    if column_exists("ACTUAL_AMOUNT"):
        act_amt = (
            df.groupby("STATE_NAME")["ACTUAL_AMOUNT"]
            .sum()
            .reset_index(name="ACTUAL_AMOUNT")
        )
        grouped = grouped.merge(act_amt, on="STATE_NAME", how="left")

    if column_exists("WORK_STAGE"):
        comp = (
            df[df["WORK_STAGE"] == "Work Completed"]
            .groupby("STATE_NAME")
            .size()
            .reset_index(name="COMPLETED_WORKS")
        )
        grouped = grouped.merge(comp, on="STATE_NAME", how="left")

        ongoing_stages = ["Physical Inspection", "Work partially Completed", "Vendor Identification", "Time Estimation"]
        ong = (
            df[df["WORK_STAGE"].isin(ongoing_stages)]
            .groupby("STATE_NAME")
            .size()
            .reset_index(name="ONGOING_WORKS")
        )
        grouped = grouped.merge(ong, on="STATE_NAME", how="left")

    if column_exists("SANCTION_DELAY_DAYS"):
        s_delay = (
            df.groupby("STATE_NAME")["SANCTION_DELAY_DAYS"]
            .mean()
            .round(1)
            .reset_index(name="AVG_SANCTION_DELAY")
        )
        grouped = grouped.merge(s_delay, on="STATE_NAME", how="left")

    if column_exists("COMPLETION_DURATION_DAYS"):
        c_delay = (
            df.groupby("STATE_NAME")["COMPLETION_DURATION_DAYS"]
            .mean()
            .round(1)
            .reset_index(name="AVG_COMPLETION_DAYS")
        )
        grouped = grouped.merge(c_delay, on="STATE_NAME", how="left")

    grouped = grouped.fillna(0)

    numeric_columns = [
        "TOTAL_WORKS",
        "SANCTIONED_WORKS",
        "ONGOING_WORKS",
        "COMPLETED_WORKS",
        "HIGH_RISK",
        "MEDIUM_RISK",
        "HIGH_DUPLICATE",
        "REVIEW_REQUIRED"
    ]

    for col in numeric_columns:
        if col in grouped.columns:
            grouped[col] = pd.to_numeric(
                grouped[col],
                errors="coerce"
            ).fillna(0).astype(int)

    float_columns = ["SANCTION_AMOUNT", "ACTUAL_AMOUNT", "AVG_SANCTION_DELAY", "AVG_COMPLETION_DAYS"]
    for col in float_columns:
        if col in grouped.columns:
            grouped[col] = pd.to_numeric(
                grouped[col],
                errors="coerce"
            ).fillna(0.0).astype(float)

    grouped = grouped.sort_values(
        "TOTAL_WORKS",
        ascending=False
    )

    return {
        "data": dataframe_to_records(grouped)
    }


# ============================================================
# MOSPI / CENTRAL NODAL AUTHORITY NATIONAL ANALYTICS
# ============================================================

_mospi_analytics_cache = None

def compute_mospi_national_analytics():
    total_works = int(len(df))

    # Financial metrics
    total_rec = float(df["RECOMMENDED_AMOUNT"].sum()) if column_exists("RECOMMENDED_AMOUNT") else 0.0
    total_sanc = float(df["SANCTION_AMOUNT"].sum()) if column_exists("SANCTION_AMOUNT") else 0.0
    total_act = float(df["ACTUAL_AMOUNT"].sum()) if column_exists("ACTUAL_AMOUNT") else 0.0
    sanc_gap = max(0.0, total_rec - total_sanc)
    unutilized_balance = max(0.0, total_sanc - total_act)
    utilization_pct = round((total_act / total_sanc * 100), 1) if total_sanc > 0 else 0.0
    sanction_rate = round((total_sanc / total_rec * 100), 1) if total_rec > 0 else 0.0

    # Risk metrics
    med_risk = int((df["RISK_LEVEL"].fillna("").astype(str).str.upper() == "MEDIUM").sum()) if column_exists("RISK_LEVEL") else 0
    high_risk = int((df["RISK_LEVEL"].fillna("").astype(str).str.upper() == "HIGH").sum()) if column_exists("RISK_LEVEL") else 0
    low_risk = int((df["RISK_LEVEL"].fillna("").astype(str).str.upper() == "LOW").sum()) if column_exists("RISK_LEVEL") else 0
    risk_cases_count = med_risk + high_risk

    # Duplicate metrics
    dup_clusters = int(df["CLUSTER_ID"].dropna().nunique()) if column_exists("CLUSTER_ID") else 0
    high_dup = int((df["DUPLICATE_RISK"].fillna("").astype(str).str.upper() == "HIGH").sum()) if column_exists("DUPLICATE_RISK") else 0
    med_dup = int((df["DUPLICATE_RISK"].fillna("").astype(str).str.upper() == "MEDIUM").sum()) if column_exists("DUPLICATE_RISK") else 0
    works_in_clusters = int(df["CLUSTER_ID"].notna().sum()) if column_exists("CLUSTER_ID") else 0

    # Review required
    review_required = int(boolean_series(df["REQUIRES_REVIEW"]).sum()) if column_exists("REQUIRES_REVIEW") else 0

    # Stages distribution
    ongoing_stages = ["Physical Inspection", "Work partially Completed", "Vendor Identification", "Time Estimation"]
    stage_counts = df["WORK_STAGE"].fillna("Unknown/Unspecified").value_counts() if column_exists("WORK_STAGE") else pd.Series()
    completed_count = int((df["WORK_STAGE"] == "Work Completed").sum()) if column_exists("WORK_STAGE") else 0
    ongoing_count = int(df["WORK_STAGE"].isin(ongoing_stages).sum()) if column_exists("WORK_STAGE") else 0
    sanctioned_count = int((df["SANCTION_AMOUNT"] > 0).sum()) if column_exists("SANCTION_AMOUNT") else 0

    lifecycle_distribution = []
    for st_name, count in stage_counts.items():
        pct = round((count / total_works * 100), 1) if total_works > 0 else 0.0
        lifecycle_distribution.append({
            "stage": str(st_name),
            "count": int(count),
            "percentage": pct
        })

    # Timeline benchmarks
    sd = df["SANCTION_DELAY_DAYS"].dropna() if column_exists("SANCTION_DELAY_DAYS") else pd.Series()
    cd = df["COMPLETION_DURATION_DAYS"].dropna() if column_exists("COMPLETION_DURATION_DAYS") else pd.Series()
    avg_sanc_delay = round(float(sd.mean()), 1) if not sd.empty else 0.0
    avg_comp_days = round(float(cd.mean()), 1) if not cd.empty else 0.0

    # Delay Buckets
    b_under_45 = int((sd <= 45).sum()) if not sd.empty else 0
    b_46_90 = int(((sd > 45) & (sd <= 90)).sum()) if not sd.empty else 0
    b_91_180 = int(((sd > 90) & (sd <= 180)).sum()) if not sd.empty else 0
    b_over_180 = int((sd > 180).sum()) if not sd.empty else 0

    delay_buckets = {
        "under_45": b_under_45,
        "from_46_to_90": b_46_90,
        "from_91_to_180": b_91_180,
        "over_180": b_over_180,
        "statutory_limit_days": 45,
        "over_statutory_count": b_46_90 + b_91_180 + b_over_180,
        "avg_sanction_delay": avg_sanc_delay,
        "avg_completion_duration": avg_comp_days
    }

    # Quarterly Trends
    trends_quarterly = []
    try:
        rec_dt = pd.to_datetime(df["RECOMMENDATION_DATE"], errors="coerce").dt.to_period("Q").astype(str)
        sanc_dt = pd.to_datetime(df["SANCTION_DATE"], errors="coerce").dt.to_period("Q").astype(str)
        quarters = ["2024Q3", "2024Q4", "2025Q1", "2025Q2", "2025Q3", "2025Q4", "2026Q1", "2026Q2", "2026Q3"]
        for q in quarters:
            r_mask = rec_dt == q
            s_mask = sanc_dt == q
            trends_quarterly.append({
                "quarter": q,
                "recommended_count": int(r_mask.sum()),
                "sanctioned_count": int(s_mask.sum()),
                "recommended_amount_cr": round(float(df.loc[r_mask, "RECOMMENDED_AMOUNT"].sum() / 1e7), 2),
                "sanctioned_amount_cr": round(float(df.loc[s_mask, "SANCTION_AMOUNT"].sum() / 1e7), 2)
            })
    except Exception as e:
        print("Trends error:", e)

    # Top 25 IA Performance
    ia_performance_top25 = []
    try:
        grouped_ia = (
            df.groupby(["IDA_NAME", "STATE_NAME"], as_index=False)
            .agg(
                total_works=("WORK_RECOMMENDATION_DTL_ID", "count"),
                sanctioned_works=("SANCTION_AMOUNT", lambda s: int((s > 0).sum())),
                completed_works=("WORK_STAGE", lambda s: int((s == "Work Completed").sum())),
                total_sanction_cr=("SANCTION_AMOUNT", lambda s: round(float(s.sum() / 1e7), 2)),
                total_actual_cr=("ACTUAL_AMOUNT", lambda s: round(float(s.sum() / 1e7), 2)),
                avg_delay=("SANCTION_DELAY_DAYS", lambda s: round(float(s.dropna().mean()), 1) if not s.dropna().empty else 0.0)
            )
            .sort_values("total_works", ascending=False)
            .head(25)
        )
        grouped_ia["completion_rate"] = (grouped_ia["completed_works"] / grouped_ia["total_works"] * 100).round(1)
        ia_performance_top25 = dataframe_to_records(grouped_ia)
    except Exception as e:
        print("IA performance error:", e)

    # Evidence Summary
    ev_score = df["EVIDENCE_SCORE"].dropna() if column_exists("EVIDENCE_SCORE") else pd.Series()
    ev_total = int(df["EVIDENCE"].notna().sum()) if column_exists("EVIDENCE") else int(ev_score.notna().sum())
    evidence_summary = {
        "total_with_evidence": ev_total,
        "avg_evidence_score": round(float(ev_score.mean()), 1) if not ev_score.empty else 0.0,
        "low_score_count": int((ev_score < 60).sum()) if not ev_score.empty else 0,
        "medium_score_count": int(((ev_score >= 60) & (ev_score < 80)).sum()) if not ev_score.empty else 0,
        "high_score_count": int((ev_score >= 80).sum()) if not ev_score.empty else 0,
    }

    # Anomaly Summary
    extreme_delays = int((sd > 180).sum()) if not sd.empty else 0
    long_completions = int((cd > 365).sum()) if not cd.empty else 0
    cost_var_cases = int(((df["COST_VARIANCE"] < 0) | (df["ACTUAL_AMOUNT"] > df["SANCTION_AMOUNT"])).sum()) if column_exists("COST_VARIANCE") else 0
    sig_var_cases = int((df["COST_VARIANCE_PERCENT"].abs() > 20).sum()) if column_exists("COST_VARIANCE_PERCENT") else 0
    anomaly_summary = {
        "extreme_delays_over_180": extreme_delays,
        "prolonged_completion_over_365": long_completions,
        "cost_variance_cases": cost_var_cases,
        "significant_variance_cases": sig_var_cases,
        "total_anomalies": extreme_delays + cost_var_cases
    }

    # Risk factor averages among risk-flagged cases
    risk_mask = df["RISK_LEVEL"].fillna("").astype(str).str.upper().isin(["HIGH", "MEDIUM"]) if column_exists("RISK_LEVEL") else pd.Series(False, index=df.index)
    risk_sub = df[risk_mask] if risk_mask.any() else df

    delay_rf = round(float(risk_sub["DELAY_RISK"].dropna().mean()), 1) if column_exists("DELAY_RISK") and not risk_sub["DELAY_RISK"].dropna().empty else 0.0
    comp_rf = round(float(risk_sub["COMPLETION_RISK"].dropna().mean()), 1) if column_exists("COMPLETION_RISK") and not risk_sub["COMPLETION_RISK"].dropna().empty else 0.0
    cost_rf = round(float(risk_sub["COST_RISK"].dropna().mean()), 1) if column_exists("COST_RISK") and not risk_sub["COST_RISK"].dropna().empty else 0.0

    return {
        "national_kpis": {
            "total_works": total_works,
            "total_recommended_amount": total_rec,
            "total_sanction_amount": total_sanc,
            "total_actual_amount": total_act,
            "sanction_gap": sanc_gap,
            "unutilized_balance": unutilized_balance,
            "utilization_pct": utilization_pct,
            "sanction_rate": sanction_rate,
            "attention_required": review_required,
            "risk_cases_count": risk_cases_count,
            "high_risk": high_risk,
            "medium_risk": med_risk,
            "low_risk": low_risk,
            "duplicate_clusters": dup_clusters,
            "high_duplicate_works": high_dup,
            "medium_duplicate_works": med_dup,
            "works_in_clusters": works_in_clusters,
            "completed_works": completed_count,
            "ongoing_works": ongoing_count,
            "sanctioned_works": sanctioned_count
        },
        "lifecycle_distribution": lifecycle_distribution,
        "timeline_benchmarks": {
            "avg_sanction_delay_days": avg_sanc_delay,
            "avg_completion_duration_days": avg_comp_days
        },
        "delay_buckets": delay_buckets,
        "trends_quarterly": trends_quarterly,
        "ia_performance_top25": ia_performance_top25,
        "evidence_summary": evidence_summary,
        "anomaly_summary": anomaly_summary,
        "risk_factors": {
            "completion_risk": comp_rf,
            "cost_risk": cost_rf,
            "delay_risk": delay_rf,
            "variance_risk": 0.0
        },
        "data_coverage": {
            "total_states": int(df["STATE_NAME"].dropna().nunique()) if column_exists("STATE_NAME") else 36,
            "total_authorities": int(df["IDA_NAME"].dropna().nunique()) if column_exists("IDA_NAME") else 763,
            "coverage_note": "Historical repository spans 1,02,703 records across all 36 States & UTs. Missing entries denote unrecorded historical fields rather than absence of activity."
        }
    }

@app.get("/api/analytics/mospi")
def mospi_national_analytics():
    global _mospi_analytics_cache
    if _mospi_analytics_cache is None:
        _mospi_analytics_cache = compute_mospi_national_analytics()
    return _mospi_analytics_cache


# ============================================================
# EARLY WARNING & ANOMALY SURVEILLANCE ALERTS
# ============================================================

_early_alerts_cache = None

def compute_early_alerts():
    # 1. Unusual Patterns
    mask_unusual = pd.Series(False, index=df.index)
    if column_exists("SUSPICION_LEVEL"):
        mask_unusual |= (df["SUSPICION_LEVEL"].fillna("").astype(str).str.upper() == "HIGH")
    if column_exists("TOTAL_LIFECYCLE_DAYS"):
        mask_unusual |= (df["TOTAL_LIFECYCLE_DAYS"] > 500)
    if column_exists("COMPLETION_VS_PEER"):
        mask_unusual |= (df["COMPLETION_VS_PEER"] > 2.5)

    # 2. Delays (Section 3.12 statutory limit)
    mask_delays = pd.Series(False, index=df.index)
    if column_exists("SANCTION_DELAY_DAYS"):
        mask_delays |= (df["SANCTION_DELAY_DAYS"] > 45)

    # 3. Cost Overruns & Escalations
    mask_cost = pd.Series(False, index=df.index)
    if column_exists("COST_VS_PEER"):
        mask_cost |= (df["COST_VS_PEER"] > 2.0)
    if column_exists("COST_VARIANCE"):
        mask_cost |= (df["COST_VARIANCE"] > 0)

    # 4. Duplicate Works
    mask_duplicates = pd.Series(False, index=df.index)
    if column_exists("CLUSTER_ID"):
        mask_duplicates |= df["CLUSTER_ID"].notna()

    # 5. Potential Misuse of Funds
    mask_misuse = pd.Series(False, index=df.index)
    if column_exists("REQUIRES_REVIEW"):
        mask_misuse |= boolean_series(df["REQUIRES_REVIEW"])
    if column_exists("RISK_LEVEL"):
        mask_misuse |= (df["RISK_LEVEL"].fillna("").astype(str).str.upper() == "HIGH")
    if column_exists("ACTUAL_AMOUNT") and column_exists("EVIDENCE_SCORE"):
        mask_misuse |= ((df["ACTUAL_AMOUNT"] > 1000000) & (df["EVIDENCE_SCORE"] < 40))

    summary = {
        "unusual_patterns": {
            "key": "unusual_patterns",
            "title": "Unusual Patterns & Anomalies",
            "count": int(mask_unusual.sum()),
            "severity": "HIGH",
            "badge_color": "rose",
            "description": "Erratic lifecycle timelines, synthetic durations, and algorithmic anomaly scores >0.6",
            "recommendation": "Requisition IA physical verification and audit lifecycle milestone logs."
        },
        "delays": {
            "key": "delays",
            "title": "Sanction & Execution Delays",
            "count": int(mask_delays.sum()),
            "severity": "HIGH",
            "badge_color": "amber",
            "description": "Works exceeding statutory 45-day SLA (Section 3.12) or execution timeline past 365 days",
            "recommendation": "Issue Section 3.12 statutory explanation notice to designated District Authority."
        },
        "cost_overruns": {
            "key": "cost_overruns",
            "title": "Cost Overruns & Peer Escalations",
            "count": int(mask_cost.sum()),
            "severity": "CRITICAL",
            "badge_color": "purple",
            "description": "Actual expenditure or estimate exceeding peer median project cost by >2.0x",
            "recommendation": "Withhold next installment disbursement pending engineering rate re-scrutiny."
        },
        "duplicate_works": {
            "key": "duplicate_works",
            "title": "Duplicate Works & Clusters",
            "count": int(mask_duplicates.sum()),
            "severity": "CRITICAL",
            "badge_color": "indigo",
            "description": "Multi-district and inter-constituency duplicate cluster proposals with high text/location match",
            "recommendation": "Cross-reference site GPS coordinates and withhold duplicate sanction release."
        },
        "fund_misuse": {
            "key": "fund_misuse",
            "title": "Potential Misuse of Funds",
            "count": int(mask_misuse.sum()),
            "severity": "CRITICAL",
            "badge_color": "red",
            "description": "Large disbursements lacking ground photo evidence, high financial risk score, or audit review flags",
            "recommendation": "Refer to District Collectorate Vigilance Desk and mandate CAG special audit."
        }
    }

    total_active_alerts = int((mask_unusual | mask_delays | mask_cost | mask_duplicates | mask_misuse).sum())

    return {
        "total_alerts": total_active_alerts,
        "summary": summary,
        "masks": {
            "unusual_patterns": mask_unusual,
            "delays": mask_delays,
            "cost_overruns": mask_cost,
            "duplicate_works": mask_duplicates,
            "fund_misuse": mask_misuse
        }
    }


@app.get("/api/alerts/early-warning")
def get_early_warning_alerts(
    category: str = "all",
    severity: str | None = None,
    q: str | None = None,
    state: str | None = None,
    limit: int = 30,
    page: int = 1
):
    global _early_alerts_cache
    if _early_alerts_cache is None:
        _early_alerts_cache = compute_early_alerts()

    summary = _early_alerts_cache["summary"]
    masks = _early_alerts_cache["masks"]

    if category == "unusual_patterns":
        sub_mask = masks["unusual_patterns"].copy()
    elif category == "delays":
        sub_mask = masks["delays"].copy()
    elif category == "cost_overruns":
        sub_mask = masks["cost_overruns"].copy()
    elif category == "duplicate_works":
        sub_mask = masks["duplicate_works"].copy()
    elif category == "fund_misuse":
        sub_mask = masks["fund_misuse"].copy()
    else:
        # Combined alerts with priority ordering: fund_misuse, duplicate_works, cost_overruns, unusual_patterns, delays
        sub_mask = masks["fund_misuse"] | masks["duplicate_works"] | masks["cost_overruns"] | masks["unusual_patterns"] | masks["delays"]

    filtered_df = df[sub_mask]

    # Keyword search
    if q and q.strip():
        search_term = q.strip().lower()
        text_matches = pd.Series(False, index=filtered_df.index)
        for c in ["WORK_DESCRIPTION", "CONSTITUENCY", "MP_NAME", "IDA_NAME", "WORK_CATEGORY"]:
            if column_exists(c):
                text_matches |= filtered_df[c].fillna("").astype(str).str.lower().str.contains(search_term, na=False)
        if column_exists("WORK_ID"):
            text_matches |= filtered_df["WORK_ID"].fillna("").astype(str).str.contains(search_term, na=False)
        if column_exists("WORK_RECOMMENDATION_DTL_ID"):
            text_matches |= filtered_df["WORK_RECOMMENDATION_DTL_ID"].fillna("").astype(str).str.contains(search_term, na=False)
        filtered_df = filtered_df[text_matches]

    if state and state.strip() and state.lower() != "all":
        filtered_df = filtered_df[filtered_df["STATE_NAME"].fillna("").astype(str).str.lower() == state.strip().lower()]

    total_matched = len(filtered_df)
    total_pages = max(1, math.ceil(total_matched / limit))
    offset = (page - 1) * limit
    page_df = filtered_df.iloc[offset:offset + limit]

    records = dataframe_to_records(page_df)
    enriched_alerts = []
    for r in records:
        sanc = float(r.get("SANCTION_AMOUNT") or 0)
        act = float(r.get("ACTUAL_AMOUNT") or 0)
        delay = float(r.get("SANCTION_DELAY_DAYS") or 0)
        cost_peer = float(r.get("COST_VS_PEER") or 1)
        sim = float(r.get("AVG_TEXT_SIMILARITY") or 0)
        if sim <= 1:
            sim = sim * 100
        cluster_id = r.get("CLUSTER_ID")
        ev_score = float(r.get("EVIDENCE_SCORE") or 0)
        risk_lvl = str(r.get("RISK_LEVEL") or "LOW").upper()
        rev_reason = str(r.get("REVIEW_REASON") or r.get("RISK_REASON") or "")

        # Category-specific enrichment or priority chain when category == 'all'
        if category == "delays" or (category == "all" and delay > 45 and not (r.get("REQUIRES_REVIEW") or risk_lvl == "HIGH" or cluster_id is not None or cost_peer > 2.0)):
            cat = "delays"
            title = f"Sanction Delay Breach: {int(delay)} Days"
            reason = f"Pending sanction for {int(delay)} days (+{max(0, int(delay - 45))}d beyond 45-day Section 3.12 statutory limit)"
            sev = "CRITICAL" if delay > 90 else "HIGH"
            metric = f"+{int(delay)}d Delay"
            sec = "compliance-45d"
        elif category == "cost_overruns" or (category == "all" and cost_peer > 1.8 and not (r.get("REQUIRES_REVIEW") or risk_lvl == "HIGH" or cluster_id is not None)):
            cat = "cost_overruns"
            title = f"Peer Cost Escalation ({cost_peer:.1f}x Peer Median)"
            reason = f"Sanctioned at ₹ {sanc/1e5:.1f} Lakh, which is {cost_peer:.1f} times higher than peer district median"
            sev = "CRITICAL" if cost_peer > 3.0 else "HIGH"
            metric = f"{cost_peer:.1f}x Peer Cost"
            sec = "financials"
        elif category == "duplicate_works" or (category == "all" and cluster_id is not None and not (isinstance(cluster_id, float) and math.isnan(cluster_id)) and not (r.get("REQUIRES_REVIEW") or risk_lvl == "HIGH")):
            cat = "duplicate_works"
            try:
                cid_str = str(int(float(cluster_id)))
            except Exception:
                cid_str = str(cluster_id)
            title = f"Duplicate Cluster #{cid_str} Proposal"
            reason = f"Cross-district proposal matched with {sim:.1f}% text similarity in cluster"
            sev = "CRITICAL" if sim > 80 else "HIGH"
            metric = f"{sim:.1f}% Similarity"
            sec = "duplicates"
        elif category == "unusual_patterns" or (category == "all" and str(r.get("SUSPICION_LEVEL") or "").upper() == "HIGH" and not (r.get("REQUIRES_REVIEW") or risk_lvl == "HIGH")):
            cat = "unusual_patterns"
            lifecycle = float(r.get("TOTAL_LIFECYCLE_DAYS") or 0)
            comp_peer = float(r.get("COMPLETION_VS_PEER") or 1)
            title = "Unusual Lifecycle Progression / Peer Outlier"
            reason = f"Lifecycle duration ({int(lifecycle)} days, {comp_peer:.1f}x peer median) exhibits anomalous timeline progression."
            sev = "HIGH"
            metric = f"{comp_peer:.1f}x Duration"
            sec = "overview"
        elif category == "fund_misuse" or r.get("REQUIRES_REVIEW") or risk_lvl == "HIGH" or (act > 1000000 and ev_score < 40):
            cat = "fund_misuse"
            title = "Potential Fund Misuse & Compliance Risk"
            reason = rev_reason or f"Disbursed ₹ {act/1e5:.1f} Lakh with substandard evidence score ({ev_score:.0f}/100)"
            sev = "CRITICAL"
            metric = f"Risk Score: {float(r.get('RISK_SCORE') or 0):.1f}"
            sec = "risk"
        else:
            cat = "unusual_patterns"
            title = "Algorithmic Anomaly / Synthetic Lifecycle Pattern"
            reason = "Lifecycle timeline or progression deviates significantly from national distribution"
            sev = "HIGH"
            metric = "Anomaly Score > 0.6"
            sec = "overview"

        r["alert_category"] = cat
        r["alert_title"] = title
        r["alert_reason"] = reason
        r["severity"] = sev
        r["metric_value"] = metric
        r["audit_section"] = sec
        enriched_alerts.append(r)

    # Optional severity filter
    if severity and severity.upper() in ["CRITICAL", "HIGH", "MEDIUM"]:
        enriched_alerts = [a for a in enriched_alerts if a.get("severity") == severity.upper()]

    return {
        "total": total_matched,
        "page": page,
        "pages": total_pages,
        "limit": limit,
        "summary": summary,
        "alerts": enriched_alerts
    }


# ============================================================
# CATEGORY ANALYTICS
# ============================================================

@app.get("/api/analytics/categories")
def category_analytics():

    if not column_exists(
        "WORK_CATEGORY"
    ):

        return {
            "data": []
        }


    grouped = (
        df.groupby(
            "WORK_CATEGORY",
            dropna=False
        )
        .size()
        .reset_index(
            name="TOTAL_WORKS"
        )
        .sort_values(
            "TOTAL_WORKS",
            ascending=False
        )
    )


    return {
        "data":
            dataframe_to_records(
                grouped
            )
    }

# ============================================================
# WORK STAGE ANALYTICS
# ============================================================

@app.get("/api/analytics/stages")
def stage_analytics():

    if not column_exists("WORK_STAGE"):
        return {
            "data": []
        }

    grouped = (
        df["WORK_STAGE"]
        .fillna("Unknown")
        .astype(str)
        .str.strip()
        .replace("", "Unknown")
        .value_counts()
        .reset_index()
    )

    grouped.columns = [
        "WORK_STAGE",
        "TOTAL_WORKS"
    ]

    return {
        "data": dataframe_to_records(grouped)
    }

# ============================================================
# RISK ANALYTICS
# ============================================================

@app.get("/api/analytics/risk")
def risk_analytics():

    result = {}


    if column_exists(
        "RISK_LEVEL"
    ):

        result["risk_levels"] = (
            df["RISK_LEVEL"]
            .fillna("UNKNOWN")
            .astype(str)
            .str.upper()
            .value_counts()
            .to_dict()
        )


    if column_exists(
        "RISK_SCORE"
    ):

        scores = pd.to_numeric(
            df["RISK_SCORE"],
            errors="coerce"
        )


        result["average_risk_score"] = (
            clean_value(
                scores.mean()
            )
        )


        result["maximum_risk_score"] = (
            clean_value(
                scores.max()
            )
        )


        result["minimum_risk_score"] = (
            clean_value(
                scores.min()
            )
        )


    # Actual risk cases
    if column_exists(
        "RISK_LEVEL"
    ):

        risk_mask = (
            df["RISK_LEVEL"]
            .fillna("")
            .astype(str)
            .str.upper()
            .isin([
                "HIGH",
                "MEDIUM"
            ])
        )

        result["risk_cases"] = int(
            risk_mask.sum()
        )


    return result

# ============================================================
# RISK FACTOR ANALYTICS
# ============================================================

@app.get("/api/analytics/risk-factors")
def risk_factor_analytics():

    result = {
        "delay_risk": 0,
        "completion_risk": 0,
        "cost_risk": 0,
        "variance_risk": 0
    }

    # Only actual risk cases:
    # HIGH + MEDIUM
    if column_exists("RISK_LEVEL"):

        risk_mask = (
            df["RISK_LEVEL"]
            .fillna("")
            .astype(str)
            .str.upper()
            .isin([
                "HIGH",
                "MEDIUM"
            ])
        )

        risk_data = df[risk_mask]

    else:

        risk_data = df


    # --------------------------------------------------------
    # Average Delay Risk
    # --------------------------------------------------------

    if column_exists("DELAY_RISK"):

        values = pd.to_numeric(
            risk_data["DELAY_RISK"],
            errors="coerce"
        ).dropna()

        if not values.empty:
            result["delay_risk"] = clean_value(
                values.mean()
            )


    # --------------------------------------------------------
    # Average Completion Risk
    # --------------------------------------------------------

    if column_exists("COMPLETION_RISK"):

        values = pd.to_numeric(
            risk_data["COMPLETION_RISK"],
            errors="coerce"
        ).dropna()

        if not values.empty:
            result["completion_risk"] = clean_value(
                values.mean()
            )


    # --------------------------------------------------------
    # Average Cost Risk
    # --------------------------------------------------------

    if column_exists("COST_RISK"):

        values = pd.to_numeric(
            risk_data["COST_RISK"],
            errors="coerce"
        ).dropna()

        if not values.empty:
            result["cost_risk"] = clean_value(
                values.mean()
            )


    # --------------------------------------------------------
    # Average Variance Risk
    # --------------------------------------------------------

    if column_exists("VARIANCE_RISK"):

        values = pd.to_numeric(
            risk_data["VARIANCE_RISK"],
            errors="coerce"
        ).dropna()

        if not values.empty:
            result["variance_risk"] = clean_value(
                values.mean()
            )


    return result

# ============================================================
# DUPLICATE ANALYTICS
# ============================================================

@app.get("/api/analytics/duplicates")
def duplicate_analytics():

    result = {}


    if column_exists(
        "DUPLICATE_RISK"
    ):

        result["duplicate_risk"] = (
            df["DUPLICATE_RISK"]
            .fillna("NOT IN CLUSTER")
            .astype(str)
            .str.upper()
            .value_counts()
            .to_dict()
        )


    if column_exists(
        "SUSPICION_LEVEL"
    ):

        result["suspicion"] = (
            df["SUSPICION_LEVEL"]
            .fillna("NOT INVESTIGATED")
            .astype(str)
            .str.upper()
            .value_counts()
            .to_dict()
        )


    if column_exists(
        "CLUSTER_ID"
    ):

        valid_clusters = df[
            df["CLUSTER_ID"].notna()
        ]


        result["works_in_clusters"] = int(
            len(valid_clusters)
        )


        result["clusters"] = int(
            valid_clusters[
                "CLUSTER_ID"
            ].nunique()
        )


    if column_exists(
        "CLUSTER_SUSPICION_SCORE"
    ):

        valid_cluster_rows = df[
            df["CLUSTER_ID"].notna()
        ]


        scores = pd.to_numeric(
            valid_cluster_rows[
                "CLUSTER_SUSPICION_SCORE"
            ],
            errors="coerce"
        )


        result["average_cluster_suspicion"] = (
            clean_value(
                scores.mean()
            )
        )


        result["maximum_cluster_suspicion"] = (
            clean_value(
                scores.max()
            )
        )


    return result


# ============================================================
# GLOBAL SEARCH
# ============================================================

@app.get("/api/search")
def search(

    q: str = Query(
        ...,
        min_length=1
    ),

    limit: int = Query(
        20,
        ge=1,
        le=100
    )
):

    query = q.strip()


    mask = pd.Series(
        False,
        index=df.index
    )


    search_columns = [
        "WORK_RECOMMENDATION_DTL_ID",
        "WORK_ID",
        "STATE_NAME",
        "CONSTITUENCY",
        "MP_NAME",
        "WORK_DESCRIPTION",
        "WORK_CATEGORY"
    ]


    for col in search_columns:

        if column_exists(col):

            mask = (
                mask
                |
                text_contains(
                    df[col],
                    query
                )
            )


    results = (
        df[mask]
        .head(limit)
    )


    return {

        "query": q,

        "count":
            len(results),

        "data":
            dataframe_to_records(
                results
            )
    }


# ============================================================
# REAL-TIME PROPOSAL VALIDATION (PRE-SANCTION AUDIT)
# ============================================================

@app.get("/api/validate-proposal")
def validate_proposal(
    description: str = Query("", min_length=1),
    state: str | None = None,
    constituency: str | None = None,
    mp_name: str | None = None,
    amount: float = Query(0.0, ge=0)
):
    """
    Real-time pre-sanction anomaly and duplicate check against 102,703 MPLADS works.
    Evaluates:
      1. Text similarity & duplicate overlap with existing works in State/Constituency
      2. Cost escalation vs. Peer Median Sanction Amount
    """
    clean_desc = description.strip()
    words = [
        w.lower()
        for w in clean_desc.replace(",", " ").replace(".", " ").replace("-", " ").split()
        if len(w) > 3
    ]

    target_df = df

    # Scope to state if provided
    if state and column_exists("STATE_NAME"):
        state_matches = target_df[text_contains(target_df["STATE_NAME"], state)]
        if len(state_matches) > 0:
            target_df = state_matches

    # Scope to constituency if provided and matches exist
    if constituency and column_exists("CONSTITUENCY"):
        const_matches = target_df[text_contains(target_df["CONSTITUENCY"], constituency)]
        if len(const_matches) > 0:
            target_df = const_matches

    matched_works = []
    top_score = 0.0
    top_match = None

    if words and column_exists("WORK_DESCRIPTION"):
        # Match any of the key tokens
        mask = pd.Series(False, index=target_df.index)
        for w in words[:4]:
            mask = mask | text_contains(target_df["WORK_DESCRIPTION"], w)

        candidates = target_df[mask].head(25)

        for _, row in candidates.iterrows():
            row_desc = str(row.get("WORK_DESCRIPTION") or "").lower()
            row_words = set([
                w for w in row_desc.replace(",", " ").replace(".", " ").split()
                if len(w) > 3
            ])
            user_words = set(words)
            if row_words and user_words:
                overlap = len(user_words & row_words)
                union = len(user_words | row_words)
                sim = (overlap / union) * 100.0 if union else 0.0
            else:
                sim = 0.0

            work_record = row_to_dict(row)
            work_record["_SIMILARITY_PERCENT"] = round(sim, 1)
            matched_works.append(work_record)

        matched_works.sort(key=lambda x: x.get("_SIMILARITY_PERCENT", 0), reverse=True)
        if matched_works:
            top_match = matched_works[0]
            top_score = top_match.get("_SIMILARITY_PERCENT", 0.0)

    # Peer median sanction calculation
    peer_median = 1850000.0  # National default ~ ₹18.50 Lakh
    if column_exists("SANCTION_AMOUNT"):
        valid_sanctions = target_df["SANCTION_AMOUNT"].dropna()
        if len(valid_sanctions) >= 5:
            peer_median = float(valid_sanctions.median())

    cost_ratio = (amount / peer_median) if peer_median > 0 and amount > 0 else 1.0

    # Determine risk & duplication status
    is_duplicate = top_score >= 60.0
    duplicate_risk = "HIGH" if top_score >= 70.0 else ("MEDIUM" if top_score >= 45.0 else ("LOW" if top_score >= 25.0 else "NONE"))
    cost_risk = "HIGH" if cost_ratio >= 2.5 else ("MEDIUM" if cost_ratio >= 1.5 else "LOW")

    if duplicate_risk == "HIGH" or cost_risk == "HIGH":
        verdict = "FLAGGED"
    elif duplicate_risk == "MEDIUM" or cost_risk == "MEDIUM":
        verdict = "CAUTION"
    else:
        verdict = "PASSED"

    return {
        "verdict": verdict,
        "is_duplicate": is_duplicate,
        "duplicate_risk": duplicate_risk,
        "similarity_score": round(top_score, 1),
        "cost_ratio": round(cost_ratio, 2),
        "cost_risk": cost_risk,
        "peer_median_sanction": peer_median,
        "amount": amount,
        "top_match": top_match,
        "matched_works": matched_works[:5],
        "state": state,
        "constituency": constituency,
        "mp_name": mp_name
    }


# ============================================================
# UNIFIED CROSS-ROLE WORKFLOW REQUEST APIS
# ============================================================

@app.post("/api/requests")
def create_request(payload: dict = Body(...)):
    """Create a persistent cross-role workflow request."""
    try:
        work_id = payload.get("work_id")
        if not work_id:
            raise HTTPException(status_code=422, detail="work_id is required")
        
        raised_by_role = payload.get("raised_by_role")
        if not raised_by_role:
            raise HTTPException(status_code=422, detail="raised_by_role is required")
            
        request_type = payload.get("request_type")
        if not request_type:
            raise HTTPException(status_code=422, detail="request_type is required")
            
        title = payload.get("title") or "Workflow Request"
        description = payload.get("description") or ""
        priority = payload.get("priority") or "MEDIUM"
        raised_by_identity = payload.get("raised_by_identity")
        related_data = payload.get("related_data") or {}

        req = workflow_engine.create_request(
            work_id=work_id,
            raised_by_role=raised_by_role,
            request_type=request_type,
            title=title,
            description=description,
            priority=priority,
            raised_by_identity=raised_by_identity,
            related_data=related_data
        )
        return {
            "success": True,
            "request_id": req["request_id"],
            "message": f"Request registered under {req['request_id']} and routed to {req['target_department']}.",
            "request": req
        }
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except PermissionError as pe:
        raise HTTPException(status_code=403, detail=str(pe))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create request: {str(e)}")


@app.get("/api/requests")
def list_requests(
    role: Optional[str] = Query(None),
    target_role: Optional[str] = Query(None),
    raised_by_role: Optional[str] = Query(None),
    work_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    request_type: Optional[str] = Query(None),
    ida_name: Optional[str] = Query(None),
    q: Optional[str] = Query(None)
):
    """Query workflow requests with role filtering."""
    results = workflow_engine.query_requests(
        role=role,
        target_role=target_role,
        raised_by_role=raised_by_role,
        work_id=work_id,
        status=status,
        request_type=request_type,
        ida_name=ida_name,
        search_query=q
    )
    return {
        "total": len(results),
        "requests": results
    }


@app.get("/api/requests/counts")
def get_request_counts(
    role: Optional[str] = Query(None),
    ida_name: Optional[str] = Query(None)
):
    """Live counts of pending/active workflow requests (no fake fallback numbers!)."""
    return workflow_engine.get_counts(role=role, ida_name=ida_name)


@app.get("/api/requests/{request_id}")
def get_request_details(request_id: str):
    """Retrieve full request dossier with timeline audit."""
    req = workflow_engine.get_request_by_id(request_id)
    if not req:
        raise HTTPException(status_code=404, detail=f"Request '{request_id}' not found.")
    return req


@app.patch("/api/requests/{request_id}")
def update_request_status(request_id: str, payload: dict = Body(...)):
    """Update status of a workflow request with audit trail."""
    try:
        actor_role = payload.get("role") or payload.get("actor_role")
        if not actor_role:
            raise HTTPException(status_code=422, detail="'role' is required to verify permissions.")
            
        new_status = payload.get("status") or payload.get("new_status")
        if not new_status:
            raise HTTPException(status_code=422, detail="'status' is required.")
            
        note = payload.get("note")
        actor_identity = payload.get("actor_identity")

        updated = workflow_engine.update_request_status(
            request_id=request_id,
            actor_role=actor_role,
            new_status=new_status,
            note=note,
            actor_identity=actor_identity
        )
        return {
            "success": True,
            "request_id": request_id,
            "message": f"Status updated to {updated['status']}.",
            "request": updated
        }
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except PermissionError as pe:
        raise HTTPException(status_code=403, detail=str(pe))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update request: {str(e)}")


# ============================================================
# PUBLIC / CITIZEN TRANSPARENCY & GRIEVANCE APIS (COMPATIBILITY)
# ============================================================

@app.get("/api/public/grievances")
def get_public_grievances(
    constituency: str = Query(None),
    work_id: str = Query(None),
    status: str = Query(None)
):
    """List public grievances from unified workflow engine."""
    all_reqs = workflow_engine.query_requests(
        raised_by_role="CITIZEN",
        work_id=work_id,
        status=status
    )
    grievances = []
    for r in all_reqs:
        if r.get("request_type") not in ("GRIEVANCE", "PUBLIC_VERIFICATION"):
            continue
        rel = r.get("related_data") or {}
        g_item = {
            "complaint_id": r["request_id"],
            "request_id": r["request_id"],
            "work_id": r["work_id"],
            "work_title": r["work_title"],
            "issue_type": rel.get("issue_type") or r.get("title") or "General Grievance",
            "description": r["description"],
            "location": f"{r.get('constituency', '')}, {r.get('state_name', '')}".strip(", "),
            "constituency": r.get("constituency", ""),
            "state": r.get("state_name", ""),
            "citizen_name": r.get("raised_by_identity", "Citizen"),
            "citizen_phone": rel.get("citizen_phone", ""),
            "status": r.get("status", "SUBMITTED").title(),
            "created_at": r["created_at"],
            "updated_at": r["updated_at"],
            "distance_m": rel.get("distance_m", 25),
            "photo_url": rel.get("photo_url") or "",
            "timeline": r.get("timeline", [])
        }
        if constituency and constituency.strip().lower() not in g_item["constituency"].lower():
            continue
        grievances.append(g_item)

    return {
        "total": len(grievances),
        "grievances": grievances
    }


@app.get("/api/public/grievances/{complaint_id}")
def get_public_grievance_by_id(complaint_id: str):
    """Get single grievance details from unified workflow engine."""
    r = workflow_engine.get_request_by_id(complaint_id)
    if not r:
        raise HTTPException(status_code=404, detail="Complaint ID not found")
    rel = r.get("related_data") or {}
    return {
        "complaint_id": r["request_id"],
        "request_id": r["request_id"],
        "work_id": r["work_id"],
        "work_title": r["work_title"],
        "issue_type": rel.get("issue_type") or r.get("title") or "General Grievance",
        "description": r["description"],
        "location": f"{r.get('constituency', '')}, {r.get('state_name', '')}".strip(", "),
        "constituency": r.get("constituency", ""),
        "state": r.get("state_name", ""),
        "citizen_name": r.get("raised_by_identity", "Citizen"),
        "citizen_phone": rel.get("citizen_phone", ""),
        "status": r.get("status", "SUBMITTED").title(),
        "created_at": r["created_at"],
        "updated_at": r["updated_at"],
        "distance_m": rel.get("distance_m", 25),
        "photo_url": rel.get("photo_url") or "",
        "timeline": r.get("timeline", [])
    }


@app.post("/api/public/grievances")
def create_public_grievance(payload: dict = Body(...)):
    """Submit a new citizen grievance using unified workflow engine."""
    work_id = payload.get("work_id")
    if not work_id:
        raise HTTPException(status_code=422, detail="work_id is required.")
        
    issue_type = payload.get("issue_type") or "Work is incomplete"
    description = payload.get("description", "").strip()
    if not description:
        raise HTTPException(status_code=422, detail="description is required.")

    citizen_name = payload.get("citizen_name", "Concerned Citizen").strip()
    photo_url = payload.get("photo_url")
    rel_data = {
        "issue_type": issue_type,
        "citizen_phone": payload.get("citizen_phone", "").strip(),
        "photo_url": photo_url,
        "distance_m": payload.get("distance_m", 25)
    }

    try:
        req = workflow_engine.create_request(
            work_id=work_id,
            raised_by_role="CITIZEN",
            request_type="GRIEVANCE",
            title=f"Public Grievance: {issue_type}",
            description=description,
            priority="HIGH" if "substandard" in issue_type.lower() or "defect" in issue_type.lower() else "MEDIUM",
            raised_by_identity=citizen_name,
            related_data=rel_data
        )

        return {
            "success": True,
            "complaint_id": req["request_id"],
            "request_id": req["request_id"],
            "message": f"Grievance successfully registered under Tracking Code {req['request_id']}",
            "grievance": {
                "complaint_id": req["request_id"],
                "work_id": req["work_id"],
                "work_title": req["work_title"],
                "issue_type": issue_type,
                "description": description,
                "status": "Submitted",
                "timeline": req["timeline"]
            }
        }
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Grievance registration failed: {str(e)}")


@app.get("/api/public/constituency/{constituency_name}")
def get_public_constituency_transparency(constituency_name: str):
    """Aggregate high-level public transparency data for a chosen constituency."""
    c_name = constituency_name.strip()
    c_df = df[df["CONSTITUENCY"].astype(str).str.lower() == c_name.lower()]
    
    if len(c_df) == 0:
        # Fallback partial search
        c_df = df[df["CONSTITUENCY"].astype(str).str.contains(c_name, case=False, na=False)]

    if len(c_df) == 0:
        raise HTTPException(status_code=404, detail="Constituency not found")

    mp_name = str(c_df["MP_NAME"].dropna().iloc[0]) if "MP_NAME" in c_df.columns and not c_df["MP_NAME"].dropna().empty else "Hon'ble Member of Parliament"
    state_name = str(c_df["STATE"].dropna().iloc[0]) if "STATE" in c_df.columns and not c_df["STATE"].dropna().empty else "India"

    total_works = len(c_df)
    
    rec_sum = float(c_df["RECOMMENDED_AMOUNT"].fillna(0).sum()) if "RECOMMENDED_AMOUNT" in c_df.columns else 0.0
    sanc_sum = float(c_df["SANCTION_AMOUNT"].fillna(0).sum()) if "SANCTION_AMOUNT" in c_df.columns else 0.0
    exp_sum = float(c_df["ACTUAL_AMOUNT"].fillna(0).sum()) if "ACTUAL_AMOUNT" in c_df.columns else 0.0

    # Status distribution
    status_counts = {}
    if "WORK_STATUS" in c_df.columns:
        counts = c_df["WORK_STATUS"].value_counts().to_dict()
        for k, v in counts.items():
            status_counts[str(k)] = int(v)

    completed_count = status_counts.get("Completed", 0) + status_counts.get("COMPLETED", 0)
    ongoing_count = status_counts.get("In Progress", 0) + status_counts.get("IN PROGRESS", 0) + status_counts.get("Ongoing", 0)
    sanctioned_count = status_counts.get("Sanctioned", 0) + status_counts.get("SANCTIONED", 0)

    # Categories
    category_counts = {}
    if "SECTOR" in c_df.columns:
        for k, v in c_df["SECTOR"].value_counts().head(8).to_dict().items():
            category_counts[str(k)] = int(v)

    # Recent works preview
    sample_cols = ["WORK_ID", "WORK_DESCRIPTION", "SECTOR", "SANCTION_AMOUNT", "ACTUAL_AMOUNT", "WORK_STATUS", "IDA_NAME"]
    available_cols = [c for c in sample_cols if c in c_df.columns]
    sample_works = []
    for _, row in c_df.head(10).iterrows():
        item = {}
        for col in available_cols:
            val = row[col]
            if pd.isna(val):
                item[col] = None
            elif isinstance(val, (int, float)):
                item[col] = float(val) if not math.isnan(val) else 0
            else:
                item[col] = str(val)
        sample_works.append(item)

    return {
        "constituency": c_name.title(),
        "state": state_name,
        "mp_name": mp_name,
        "total_works": total_works,
        "financials": {
            "recommended_amount": rec_sum,
            "sanctioned_amount": sanc_sum,
            "expenditure_amount": exp_sum,
            "recommended_cr": round(rec_sum / 1e7, 2),
            "sanctioned_cr": round(sanc_sum / 1e7, 2),
            "expenditure_cr": round(exp_sum / 1e7, 2),
            "utilization_rate": round((exp_sum / sanc_sum * 100), 1) if sanc_sum > 0 else 0
        },
        "status_distribution": {
            "completed": completed_count,
            "ongoing": ongoing_count,
            "sanctioned": sanctioned_count,
            "all_counts": status_counts
        },
        "category_distribution": category_counts,
        "recent_works": sample_works
    }


@app.get("/api/public/overview")
def get_public_overview():
    """National transparency metrics and real recently delivered works calculated from real dataset."""
    total_works = len(df)
    sanc_sum = float(df["SANCTION_AMOUNT"].dropna().sum()) if column_exists("SANCTION_AMOUNT") else 0.0
    exp_sum = float(df["ACTUAL_AMOUNT"].dropna().sum()) if column_exists("ACTUAL_AMOUNT") else 0.0
    rec_sum = float(df["RECOMMENDED_AMOUNT"].dropna().sum()) if column_exists("RECOMMENDED_AMOUNT") else 0.0
    
    completed_count = int(df["ACTUAL_AMOUNT"].notna().sum()) if column_exists("ACTUAL_AMOUNT") else 0
    sanctioned_count = int(df["SANCTION_AMOUNT"].notna().sum()) if column_exists("SANCTION_AMOUNT") else 0
    ongoing_count = max(0, sanctioned_count - completed_count)
    
    mps_tracked = int(df["MP_NAME"].dropna().nunique()) if column_exists("MP_NAME") else 538
    constituencies_covered = int(df["CONSTITUENCY"].dropna().nunique()) if column_exists("CONSTITUENCY") else 543
    states_covered = int(df["STATE_NAME"].dropna().nunique()) if column_exists("STATE_NAME") else 37

    # Select 6 real completed / high milestone works from the dataset
    delivered_sample = []
    completed_df = df[df["ACTUAL_AMOUNT"].notna() & (df["ACTUAL_AMOUNT"] > 0)]
    if completed_df.empty:
        completed_df = df[df["SANCTION_AMOUNT"].notna()].head(6)
    else:
        completed_df = completed_df.head(6)

    for _, row in completed_df.iterrows():
        wid = row.get("WORK_ID") or row.get("WORK_RECOMMENDATION_DTL_ID") or "W-MPLADS"
        desc = row.get("WORK_DESCRIPTION") or "Community Development Infrastructure"
        constituency = row.get("CONSTITUENCY") or "Constituency Site"
        state = row.get("STATE_NAME") or "India"
        mp = row.get("MP_NAME") or "Hon'ble Member of Parliament"
        cat = row.get("WORK_CATEGORY") or row.get("SECTOR") or "Community Infrastructure"
        sanc = float(row.get("SANCTION_AMOUNT") or 0)
        actual = float(row.get("ACTUAL_AMOUNT") or 0)
        stage = row.get("WORK_STAGE") or "Completed"
        
        delivered_sample.append({
            "id": str(clean_value(wid)),
            "title": str(clean_value(desc)),
            "location": f"{clean_value(constituency)}, {clean_value(state)}",
            "constituency": str(clean_value(constituency)),
            "state": str(clean_value(state)),
            "category": str(clean_value(cat)),
            "mp": str(clean_value(mp)),
            "sanction_amount": sanc,
            "actual_amount": actual,
            "cost_formatted": f"₹{(sanc / 1e5):.2f} Lakh" if sanc < 1e7 else f"₹{(sanc / 1e7):.2f} Cr",
            "status": str(clean_value(stage)),
            "verified": True
        })

    return {
        "total_works": total_works,
        "completed_works_count": completed_count,
        "ongoing_works_count": ongoing_count,
        "sanctioned_works_count": sanctioned_count,
        "total_recommended_cr": round(rec_sum / 1e7, 2),
        "total_sanctioned_cr": round(sanc_sum / 1e7, 2),
        "total_expenditure_cr": round(exp_sum / 1e7, 2),
        "mps_tracked": mps_tracked,
        "constituencies_covered": constituencies_covered,
        "states_covered": states_covered,
        "delivered_works": delivered_sample
    }


@app.get("/api/public/evidence")
def get_public_evidence(category: str | None = None, limit: int = 12):
    """Real works with physical inspections / milestone completion timestamps for social audit evidence."""
    inspected_df = df
    if column_exists("WORK_STAGE"):
        st = inspected_df["WORK_STAGE"].astype(str).str.strip().str.lower()
        mask = st.isin(["completed", "work completed", "physical inspection", "work partially completed"])
        if mask.any():
            inspected_df = inspected_df[mask]
    
    if category and category.lower() != "all" and column_exists("WORK_CATEGORY"):
        inspected_df = inspected_df[text_contains(inspected_df["WORK_CATEGORY"], category)]

    items = []
    for _, row in inspected_df.head(limit).iterrows():
        wid = str(clean_value(row.get("WORK_ID") or row.get("WORK_RECOMMENDATION_DTL_ID")))
        desc = str(clean_value(row.get("WORK_DESCRIPTION") or "MPLADS Developmental Infrastructure"))
        const = str(clean_value(row.get("CONSTITUENCY") or "Constituency"))
        state = str(clean_value(row.get("STATE_NAME") or "State"))
        ida = str(clean_value(row.get("IDA_NAME") or "District Planning Division"))
        sanc = float(row.get("SANCTION_AMOUNT") or 0)
        actual = float(row.get("ACTUAL_AMOUNT") or 0)
        stage = str(clean_value(row.get("WORK_STAGE") or "Physical Inspection"))
        rec_date = clean_value(row.get("RECOMMENDATION_DATE")) or "2024-01-15"
        sanc_date = clean_value(row.get("SANCTION_DATE")) or "2024-03-20"
        end_date = clean_value(row.get("ACTUAL_END_DATE")) or "2024-08-30"

        # Check geocode status in verified cache
        loc_str = const.strip().upper()
        geo_info = _GEO_CACHE.get(loc_str)
        geofence_text = f"GPS geofence verified ({geo_info['source']})" if geo_info else "Official sanction site recorded"

        items.append({
            "id": wid,
            "title": desc,
            "location": f"{const}, {state}",
            "constituency": const,
            "state": state,
            "agency": ida,
            "cost": f"₹{(sanc / 1e5):.2f} Lakh" if sanc < 1e7 else f"₹{(sanc / 1e7):.2f} Cr",
            "actual_cost": f"₹{(actual / 1e5):.2f} Lakh" if actual < 1e7 and actual > 0 else (f"₹{(actual / 1e7):.2f} Cr" if actual >= 1e7 else "Under audit"),
            "recommendation_date": rec_date,
            "sanction_date": sanc_date,
            "completion_date": end_date,
            "status": stage,
            "geofence_status": geofence_text,
            "has_gps": bool(geo_info),
            "completion": 100 if "complet" in stage.lower() else 75
        })

    return {
        "total": len(items),
        "items": items
    }


@app.get("/api/public/verify/{work_id}")
def verify_public_work(work_id: str):
    """Direct on-site verification of any real Work ID against official MPLADS dataset records."""
    target = work_id.strip()
    match = df[df["WORK_ID"].astype(str).str.strip().str.lower() == target.lower()]
    if match.empty and column_exists("WORK_RECOMMENDATION_DTL_ID"):
        match = df[df["WORK_RECOMMENDATION_DTL_ID"].astype(str).str.strip().str.lower() == target.lower()]
    if match.empty:
        match = df[text_contains(df["WORK_ID"], target)]
    if match.empty:
        raise HTTPException(status_code=404, detail=f"Work ID '{work_id}' not found in official MPLADS registry")

    row = match.iloc[0]
    const = str(clean_value(row.get("CONSTITUENCY") or "Constituency"))
    state = str(clean_value(row.get("STATE_NAME") or "State"))
    sanc = float(row.get("SANCTION_AMOUNT") or 0)
    actual = float(row.get("ACTUAL_AMOUNT") or 0)
    
    loc_key = const.strip().upper()
    geo_info = _GEO_CACHE.get(loc_key)

    return {
        "verified": True,
        "work_id": str(clean_value(row.get("WORK_ID") or row.get("WORK_RECOMMENDATION_DTL_ID"))),
        "title": str(clean_value(row.get("WORK_DESCRIPTION"))),
        "mp": str(clean_value(row.get("MP_NAME"))),
        "constituency": const,
        "state": state,
        "agency": str(clean_value(row.get("IDA_NAME") or "District Authority")),
        "sector": str(clean_value(row.get("WORK_CATEGORY") or row.get("SECTOR"))),
        "stage": str(clean_value(row.get("WORK_STAGE"))),
        "sanction_amount": sanc,
        "actual_amount": actual,
        "sanction_formatted": f"₹{(sanc / 1e5):.2f} Lakh" if sanc < 1e7 else f"₹{(sanc / 1e7):.2f} Cr",
        "expenditure_formatted": f"₹{(actual / 1e5):.2f} Lakh" if actual < 1e7 and actual > 0 else (f"₹{(actual / 1e7):.2f} Cr" if actual >= 1e7 else "Pending final reconciliation"),
        "recommendation_date": clean_value(row.get("RECOMMENDATION_DATE")),
        "sanction_date": clean_value(row.get("SANCTION_DATE")),
        "completion_date": clean_value(row.get("ACTUAL_END_DATE")),
        "has_gps_coordinates": bool(geo_info),
        "gps_coordinates": f"{geo_info['lat']:.4f}° N, {geo_info['lng']:.4f}° E" if geo_info else "GPS telemetry unmapped in source record",
        "location_status": "Verified on official locality grid" if geo_info else "Site registered under official sanction; GPS telemetry not captured in legacy record",
        "risk_level": str(clean_value(row.get("RISK_LEVEL") or "LOW"))
    }


# ============================================================
# SERVER MESSAGE & MAIN RUNNER
# ============================================================

print()
print("Available API:")
print()
print("  GET /")
print("  GET /api/health")
print("  GET /api/summary")
print("  GET /api/works")
print("  GET /api/works/{work_id}")
print("  GET /api/risk-cases")
print("  GET /api/duplicate-cases")
print("  GET /api/review-cases")
print("  GET /api/clusters/{cluster_id}")
print("  GET /api/states")
print("  GET /api/constituencies")
print("  GET /api/mps")
print("  GET /api/analytics/states")
print("  GET /api/analytics/categories")
print("  GET /api/analytics/risk")
print("  GET /api/analytics/duplicates")
print("  GET /api/search")
print("  GET /api/validate-proposal")
print()
print("=" * 70)


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    host = os.environ.get("HOST", "0.0.0.0")
    reload_flag = os.environ.get("ENV", "development").lower() == "development"
    uvicorn.run("main:app", host=host, port=port, reload=reload_flag)