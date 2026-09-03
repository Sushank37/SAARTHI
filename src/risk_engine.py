import pandas as pd
import numpy as np
from pathlib import Path

# --------------------------------------------------
# Load benchmark dataset
# --------------------------------------------------

BASE_DIR = Path(__file__).resolve().parent.parent
INPUT_FILE = BASE_DIR / "data" / "benchmark_works.csv"

df = pd.read_csv(INPUT_FILE)

print("=" * 60)
print("MPLADS EXPLAINABLE RISK ENGINE")
print("=" * 60)

# --------------------------------------------------
# Numeric conversion
# --------------------------------------------------

numeric_columns = [
    "SANCTION_DELAY_DAYS",
    "COMPLETION_DURATION_DAYS",
    "SANCTION_DELAY_VS_PEER",
    "COMPLETION_VS_PEER",
    "COST_VS_PEER",
    "COST_VARIANCE_PERCENT",
]

for col in numeric_columns:
    if col in df.columns:
        df[col] = pd.to_numeric(
            df[col],
            errors="coerce"
        )

# --------------------------------------------------
# Safe ratio scoring
# --------------------------------------------------

def ratio_risk(ratio):
    """
    Convert peer ratio into a 0-100 risk score.

    < 1.5x  -> low
    1.5x    -> ~15
    3x      -> ~35
    5x      -> ~55
    8x      -> ~75
    12x+    -> 100
    """

    if pd.isna(ratio):
        return 0.0

    if ratio <= 1.5:
        return 0.0

    score = (
        (ratio - 1.5)
        / (12.0 - 1.5)
    ) * 100

    return float(
        np.clip(score, 0, 100)
    )


# --------------------------------------------------
# 1. SANCTION DELAY RISK
# --------------------------------------------------

df["DELAY_RISK"] = (
    df["SANCTION_DELAY_VS_PEER"]
    .apply(ratio_risk)
)

# --------------------------------------------------
# 2. COMPLETION RISK
# --------------------------------------------------

df["COMPLETION_RISK"] = (
    df["COMPLETION_VS_PEER"]
    .apply(ratio_risk)
)

# --------------------------------------------------
# 3. COST RISK
# --------------------------------------------------

df["COST_RISK"] = (
    df["COST_VS_PEER"]
    .apply(ratio_risk)
)

# --------------------------------------------------
# 4. EXPENDITURE VARIANCE RISK
# --------------------------------------------------

def variance_risk(value):

    if pd.isna(value):
        return 0.0

    if value <= 10:
        return 0.0

    score = (
        (value - 10)
        / (50 - 10)
    ) * 100

    return float(
        np.clip(score, 0, 100)
    )


df["VARIANCE_RISK"] = (
    df["COST_VARIANCE_PERCENT"]
    .apply(variance_risk)
)

# --------------------------------------------------
# Overall risk
# --------------------------------------------------

df["RISK_SCORE"] = (
    df["DELAY_RISK"] * 0.30
    + df["COMPLETION_RISK"] * 0.25
    + df["COST_RISK"] * 0.25
    + df["VARIANCE_RISK"] * 0.20
)

df["RISK_SCORE"] = (
    df["RISK_SCORE"]
    .clip(0, 100)
    .round(2)
)

# --------------------------------------------------
# Risk levels
# --------------------------------------------------

df["RISK_LEVEL"] = "LOW"

df.loc[
    df["RISK_SCORE"] >= 35,
    "RISK_LEVEL"
] = "MEDIUM"

df.loc[
    df["RISK_SCORE"] >= 60,
    "RISK_LEVEL"
] = "HIGH"

df.loc[
    df["RISK_SCORE"] >= 80,
    "RISK_LEVEL"
] = "CRITICAL"

# --------------------------------------------------
# Generate explanations
# --------------------------------------------------

def format_ratio(value):

    if pd.isna(value):
        return None

    return f"{value:.1f}x"


def generate_reason(row):

    reasons = []

    delay_ratio = format_ratio(
        row["SANCTION_DELAY_VS_PEER"]
    )

    completion_ratio = format_ratio(
        row["COMPLETION_VS_PEER"]
    )

    cost_ratio = format_ratio(
        row["COST_VS_PEER"]
    )

    # Delay
    if (
        delay_ratio is not None
        and row["DELAY_RISK"] >= 60
    ):
        reasons.append(
            f"Sanction delay is {delay_ratio} "
            f"the peer median"
        )

    elif (
        delay_ratio is not None
        and row["DELAY_RISK"] >= 20
    ):
        reasons.append(
            f"Sanction delay is {delay_ratio} "
            f"the peer median"
        )

    # Completion
    if (
        completion_ratio is not None
        and row["COMPLETION_RISK"] >= 60
    ):
        reasons.append(
            f"Completion duration is "
            f"{completion_ratio} the peer median"
        )

    elif (
        completion_ratio is not None
        and row["COMPLETION_RISK"] >= 20
    ):
        reasons.append(
            f"Completion duration is "
            f"{completion_ratio} the peer median"
        )

    # Cost
    if (
        cost_ratio is not None
        and row["COST_RISK"] >= 60
    ):
        reasons.append(
            f"Sanction amount is "
            f"{cost_ratio} peer median"
        )

    elif (
        cost_ratio is not None
        and row["COST_RISK"] >= 20
    ):
        reasons.append(
            f"Sanction amount is "
            f"{cost_ratio} peer median"
        )

    # Actual expenditure
    variance = row["COST_VARIANCE_PERCENT"]

    if (
        pd.notna(variance)
        and variance > 10
    ):
        reasons.append(
            f"Actual expenditure is "
            f"{variance:.1f}% above sanction"
        )

    if not reasons:
        reasons.append(
            "No major anomaly detected"
        )

    return " | ".join(reasons)


df["RISK_REASON"] = df.apply(
    generate_reason,
    axis=1
)

# --------------------------------------------------
# Save
# --------------------------------------------------

output_file = (
    BASE_DIR
    / "data"
    / "risk_scored_works.csv"
)

df.to_csv(
    output_file,
    index=False
)

# --------------------------------------------------
# Results
# --------------------------------------------------

print("\nRISK DISTRIBUTION")

print(
    df["RISK_LEVEL"]
    .value_counts()
    .to_string()
)

print("\nTOP 20 RISK CASES")

top = df.nlargest(
    20,
    "RISK_SCORE"
)

print(
    top[
        [
            "WORK_RECOMMENDATION_DTL_ID",
            "STATE_NAME",
            "WORK_CATEGORY",
            "RISK_SCORE",
            "RISK_LEVEL",
            "RISK_REASON",
        ]
    ].to_string(index=False)
)

print("\n" + "=" * 60)
print("RISK ENGINE COMPLETE")
print("=" * 60)

print(f"Rows    : {len(df):,}")
print(f"Columns : {len(df.columns)}")
print(f"Output  : {output_file}")