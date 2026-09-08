from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
import pandas as pd
import math



# ============================================================
# CONFIGURATION
# ============================================================

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_FILE = BASE_DIR / "data" / "mplads_final_dataset.csv"

app = FastAPI(
    title="MPLADS AI Monitoring API",
    description="AI-powered MPLADS risk, duplicate and review monitoring backend",
    version="2.1.0"
)


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "*",
    ],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# LOAD DATA
# ============================================================

print("=" * 70)
print("MPLADS AI BACKEND")
print("=" * 70)
print()
print("Loading dataset:")
print(DATA_FILE)

if not DATA_FILE.exists():
    raise FileNotFoundError(
        f"Dataset not found: {DATA_FILE}"
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

print("Dataset loaded successfully.")
print("=" * 70)
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

    return {
        "page": page,
        "limit": limit,
        "total": total,
        "pages": math.ceil(total / limit) if total else 0,
        "data": dataframe_to_records(page_data)
    }


# ============================================================
# ROOT
# ============================================================

@app.get("/")
def root():

    return {
        "name": "MPLADS AI Monitoring API",
        "status": "running",
        "dataset_rows": len(df),
        "dataset_columns": len(df.columns),
        "version": "2.1.0"
    }


# ============================================================
# HEALTH
# ============================================================

@app.get("/api/health")
def health():

    return {
        "status": "healthy",
        "dataset_loaded": True,
        "rows": len(df),
        "columns": len(df.columns)
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

        "recommended_works_count":
            recommended_works_count,

        "sanctioned_works_count":
            sanctioned_works_count,

        "completed_works_count":
            completed_works_count,

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
    if stage and column_exists(
        "WORK_STAGE"
    ):

        data = data[
            text_contains(
                data["WORK_STAGE"],
                stage
            )
        ]


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
                    data = data[data["RISK_LEVEL"].fillna("").astype(str).str.upper() == "HIGH"]
                elif sub == "medium":
                    data = data[data["RISK_LEVEL"].fillna("").astype(str).str.upper() == "MEDIUM"]
                else:
                    data = data[data["RISK_LEVEL"].fillna("").astype(str).str.upper().isin(["HIGH", "MEDIUM"])]

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
# SINGLE WORK
# ============================================================

@app.get("/api/works/{work_id}")
def get_work(work_id: str):

    # Recommendation detail ID
    if column_exists(
        "WORK_RECOMMENDATION_DTL_ID"
    ):

        matches = df[
            df[
                "WORK_RECOMMENDATION_DTL_ID"
            ]
            .astype(str)
            .eq(
                str(work_id)
            )
        ]

        if not matches.empty:

            return row_to_dict(
                matches.iloc[0]
            )


    # WORK_ID
    if column_exists("WORK_ID"):

        matches = df[
            df["WORK_ID"]
            .astype(str)
            .eq(
                str(work_id)
            )
        ]

        if not matches.empty:

            return row_to_dict(
                matches.iloc[0]
            )


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
        "states": state_list
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

    counts = data["IDA_NAME"].fillna("").astype(str).str.strip().value_counts()
    ida_items = []
    for name, cnt in counts.items():
        if not name or name == "nan":
            continue
        sub = data[data["IDA_NAME"] == name]
        district = name.split("(")[0].strip() if "(" in name else name
        st = str(sub["STATE_NAME"].dropna().iloc[0]) if "STATE_NAME" in sub.columns and not sub["STATE_NAME"].dropna().empty else ""
        constituency = str(sub["CONSTITUENCY"].dropna().iloc[0]) if "CONSTITUENCY" in sub.columns and not sub["CONSTITUENCY"].dropna().empty else ""
        ida_items.append({
            "ida_name": name,
            "district_name": district,
            "state": st,
            "constituency": constituency,
            "works_count": int(cnt)
        })

    return {
        "count": len(ida_items),
        "idas": ida_items
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


    grouped = grouped.fillna(0)


    numeric_columns = [
        "TOTAL_WORKS",
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


    grouped = grouped.sort_values(
        "TOTAL_WORKS",
        ascending=False
    )


    return {
        "data":
            dataframe_to_records(
                grouped
            )
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
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)