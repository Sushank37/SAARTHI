import pandas as pd
from pathlib import Path

# --------------------------------------------------
# Load master dataset
# --------------------------------------------------

BASE_DIR = Path(__file__).resolve().parent.parent
MASTER_FILE = BASE_DIR / "data" / "master_works.csv"

df = pd.read_csv(MASTER_FILE)

print("=" * 60)
print("MPLADS PEER BENCHMARK ANALYSIS")
print("=" * 60)

# --------------------------------------------------
# Convert dates
# --------------------------------------------------

date_columns = [
    "RECOMMENDATION_DATE",
    "SANCTION_DATE",
    "ACTUAL_END_DATE",
]

for col in date_columns:
    df[col] = pd.to_datetime(
        df[col],
        errors="coerce",
        format="mixed"
    )

# --------------------------------------------------
# Numeric conversion
# --------------------------------------------------

amount_columns = [
    "RECOMMENDED_AMOUNT",
    "SANCTION_AMOUNT",
    "ACTUAL_AMOUNT",
]

for col in amount_columns:
    df[col] = pd.to_numeric(
        df[col],
        errors="coerce"
    )

# --------------------------------------------------
# Create lifecycle metrics again
# --------------------------------------------------

df["SANCTION_DELAY_DAYS"] = (
    df["SANCTION_DATE"]
    - df["RECOMMENDATION_DATE"]
).dt.days

df["COMPLETION_DURATION_DAYS"] = (
    df["ACTUAL_END_DATE"]
    - df["SANCTION_DATE"]
).dt.days

df["COST_VARIANCE"] = (
    df["ACTUAL_AMOUNT"]
    - df["SANCTION_AMOUNT"]
)

df["COST_VARIANCE_PERCENT"] = (
    df["COST_VARIANCE"]
    / df["SANCTION_AMOUNT"]
) * 100

# --------------------------------------------------
# Peer groups
# --------------------------------------------------

print("\nCreating peer benchmarks...")

# Similar works = same state + same category

peer_group = (
    df.groupby(
        ["STATE_NAME", "WORK_CATEGORY"],
        dropna=False
    )
)

# --------------------------------------------------
# Sanction delay benchmark
# --------------------------------------------------

df["PEER_MEDIAN_SANCTION_DELAY"] = (
    peer_group["SANCTION_DELAY_DAYS"]
    .transform("median")
)

df["SANCTION_DELAY_VS_PEER"] = (
    df["SANCTION_DELAY_DAYS"]
    / df["PEER_MEDIAN_SANCTION_DELAY"]
)

# --------------------------------------------------
# Completion benchmark
# --------------------------------------------------

df["PEER_MEDIAN_COMPLETION_DAYS"] = (
    peer_group["COMPLETION_DURATION_DAYS"]
    .transform("median")
)

df["COMPLETION_VS_PEER"] = (
    df["COMPLETION_DURATION_DAYS"]
    / df["PEER_MEDIAN_COMPLETION_DAYS"]
)

# --------------------------------------------------
# Cost benchmark
# --------------------------------------------------

df["PEER_MEDIAN_SANCTION_AMOUNT"] = (
    peer_group["SANCTION_AMOUNT"]
    .transform("median")
)

df["COST_VS_PEER"] = (
    df["SANCTION_AMOUNT"]
    / df["PEER_MEDIAN_SANCTION_AMOUNT"]
)

# --------------------------------------------------
# Print examples
# --------------------------------------------------

print("\nTOP 10 SANCTION DELAYS VS PEER")

result = df[
    df["SANCTION_DELAY_DAYS"].notna()
    & df["PEER_MEDIAN_SANCTION_DELAY"].notna()
].nlargest(
    10,
    "SANCTION_DELAY_VS_PEER"
)

print(
    result[
        [
            "WORK_RECOMMENDATION_DTL_ID",
            "STATE_NAME",
            "WORK_CATEGORY",
            "SANCTION_DELAY_DAYS",
            "PEER_MEDIAN_SANCTION_DELAY",
            "SANCTION_DELAY_VS_PEER",
        ]
    ].to_string(index=False)
)

# --------------------------------------------------
# Save benchmark dataset
# --------------------------------------------------

output_file = BASE_DIR / "data" / "benchmark_works.csv"

df.to_csv(
    output_file,
    index=False
)

print("\n" + "=" * 60)
print("BENCHMARK DATASET CREATED")
print("=" * 60)

print(f"Rows    : {len(df):,}")
print(f"Columns : {len(df.columns)}")
print(f"File    : {output_file}")
