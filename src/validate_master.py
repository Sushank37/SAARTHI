import pandas as pd
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
MASTER_FILE = BASE_DIR / "data" / "master_works.csv"

df = pd.read_csv(MASTER_FILE)

print("=" * 60)
print("MASTER DATA VALIDATION")
print("=" * 60)

print(f"Rows    : {len(df):,}")
print(f"Columns : {len(df.columns)}")

# --------------------------------------------------
# Date conversion
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
# Basic coverage
# --------------------------------------------------

print("\nDATA COVERAGE")

for col in date_columns:
    print(
        f"{col:25} {df[col].notna().sum():,}"
    )

# --------------------------------------------------
# Lifecycle statistics
# --------------------------------------------------

print("\nSANCTION DELAY")

print(
    df["SANCTION_DELAY_DAYS"]
    .describe()
    .to_string()
)

print("\nCOMPLETION DURATION")

print(
    df["COMPLETION_DURATION_DAYS"]
    .describe()
    .to_string()
)

print("\nTOTAL LIFECYCLE")

print(
    df["TOTAL_LIFECYCLE_DAYS"]
    .describe()
    .to_string()
)

# --------------------------------------------------
# Impossible date sequences
# --------------------------------------------------

print("\nDATE CONSISTENCY")

negative_sanction_delay = (
    df["SANCTION_DATE"].notna()
    & df["RECOMMENDATION_DATE"].notna()
    & (
        df["SANCTION_DATE"]
        < df["RECOMMENDATION_DATE"]
    )
)

negative_completion_duration = (
    df["ACTUAL_END_DATE"].notna()
    & df["SANCTION_DATE"].notna()
    & (
        df["ACTUAL_END_DATE"]
        < df["SANCTION_DATE"]
    )
)

print(
    "Sanction before recommendation:",
    negative_sanction_delay.sum()
)

print(
    "Completion before sanction:",
    negative_completion_duration.sum()
)

# --------------------------------------------------
# Financial validation
# --------------------------------------------------

print("\nFINANCIAL DATA")

for col in [
    "RECOMMENDED_AMOUNT",
    "SANCTION_AMOUNT",
    "ACTUAL_AMOUNT",
]:
    print(
        f"{col:25} "
        f"{df[col].notna().sum():,} non-null"
    )

negative_actual = (
    df["ACTUAL_AMOUNT"].notna()
    & (df["ACTUAL_AMOUNT"] < 0)
)

print(
    "Negative actual amounts:",
    negative_actual.sum()
)

# --------------------------------------------------
# Extreme values
# --------------------------------------------------

print("\nEXTREME LIFECYCLE VALUES")

print(
    df.nlargest(
        10,
        "SANCTION_DELAY_DAYS"
    )[
        [
            "WORK_RECOMMENDATION_DTL_ID",
            "STATE_NAME",
            "WORK_CATEGORY",
            "RECOMMENDATION_DATE",
            "SANCTION_DATE",
            "SANCTION_DELAY_DAYS",
        ]
    ].to_string(index=False)
)

print("\nValidation complete.")