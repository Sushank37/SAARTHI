import pandas as pd
from pathlib import Path

# --------------------------------------------------
# Paths
# --------------------------------------------------

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
OUTPUT_DIR = BASE_DIR / "data"

# --------------------------------------------------
# Load datasets
# --------------------------------------------------

print("Loading datasets...")

recommended = pd.read_csv(DATA_DIR / "works_recommended.csv")
sanctioned = pd.read_csv(DATA_DIR / "works_sanctioned.csv")
completed = pd.read_csv(DATA_DIR / "works_completed.csv")

print(f"Recommended : {len(recommended):,}")
print(f"Sanctioned  : {len(sanctioned):,}")
print(f"Completed   : {len(completed):,}")

# --------------------------------------------------
# Clean the common ID
# --------------------------------------------------

KEY = "WORK_RECOMMENDATION_DTL_ID"

for df in [recommended, sanctioned, completed]:
    df[KEY] = pd.to_numeric(df[KEY], errors="coerce")

# Remove rows without a work ID
recommended = recommended.dropna(subset=[KEY])
sanctioned = sanctioned.dropna(subset=[KEY])
completed = completed.dropna(subset=[KEY])

# Make the ID an integer
for df in [recommended, sanctioned, completed]:
    df[KEY] = df[KEY].astype("int64")

# --------------------------------------------------
# Remove duplicate IDs within each dataset
# --------------------------------------------------

recommended = recommended.drop_duplicates(subset=[KEY], keep="first")
sanctioned = sanctioned.drop_duplicates(subset=[KEY], keep="first")
completed = completed.drop_duplicates(subset=[KEY], keep="first")

# --------------------------------------------------
# Select useful columns
# --------------------------------------------------

recommended_cols = [
    KEY,
    "STATE_NAME",
    "CONSTITUENCY",
    "CONSTITUENCY_ID",
    "MP_NAME",
    "HOUSE_OF_PARLIAMENT",
    "IDA_NAME",
    "WORK_CATEGORY",
    "ACTIVITY_NAME",
    "WORK_DESCRIPTION",
    "RECOMMENDATION_DATE",
    "RECOMMENDED_AMOUNT",
]

sanctioned_cols = [
    KEY,
    "SANCTION_AMOUNT",
    "SANCTION_DATE",
    "WORK_STAGE",
]

completed_cols = [
    KEY,
    "WORK_ID",
    "ACTUAL_AMOUNT",
    "ACTUAL_END_DATE",
    "AVERAGE_RATING",
]

recommended = recommended[recommended_cols]
sanctioned = sanctioned[sanctioned_cols]
completed = completed[completed_cols]

# --------------------------------------------------
# Merge lifecycle
# --------------------------------------------------

print("\nBuilding master table...")

master = recommended.merge(
    sanctioned,
    on=KEY,
    how="left",
    suffixes=("", "_SANCTION")
)

master = master.merge(
    completed,
    on=KEY,
    how="left",
    suffixes=("", "_COMPLETED")
)

# --------------------------------------------------
# Date conversion
# --------------------------------------------------

date_columns = [
    "RECOMMENDATION_DATE",
    "SANCTION_DATE",
    "ACTUAL_END_DATE",
]

for col in date_columns:
    master[col] = pd.to_datetime(
        master[col],
        errors="coerce",
        dayfirst=True
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
    master[col] = pd.to_numeric(
        master[col],
        errors="coerce"
    )

# --------------------------------------------------
# Create initial lifecycle features
# --------------------------------------------------

master["SANCTION_DELAY_DAYS"] = (
    master["SANCTION_DATE"]
    - master["RECOMMENDATION_DATE"]
).dt.days

master["COMPLETION_DURATION_DAYS"] = (
    master["ACTUAL_END_DATE"]
    - master["SANCTION_DATE"]
).dt.days

master["TOTAL_LIFECYCLE_DAYS"] = (
    master["ACTUAL_END_DATE"]
    - master["RECOMMENDATION_DATE"]
).dt.days

master["COST_VARIANCE"] = (
    master["ACTUAL_AMOUNT"]
    - master["SANCTION_AMOUNT"]
)

master["COST_VARIANCE_PERCENT"] = (
    master["COST_VARIANCE"]
    / master["SANCTION_AMOUNT"]
) * 100

# --------------------------------------------------
# Save
# --------------------------------------------------

output_file = OUTPUT_DIR / "master_works.csv"

master.to_csv(
    output_file,
    index=False
)

# --------------------------------------------------
# Summary
# --------------------------------------------------

print("\n" + "=" * 60)
print("MASTER DATASET CREATED")
print("=" * 60)

print(f"Rows    : {len(master):,}")
print(f"Columns : {len(master.columns)}")
print(f"File    : {output_file}")

print("\nLifecycle coverage:")

print(
    "Recommended → Sanctioned:",
    master["SANCTION_DATE"].notna().sum()
)

print(
    "Sanctioned → Completed:",
    master["ACTUAL_END_DATE"].notna().sum()
)

print(
    "Completed works:",
    master["WORK_ID"].notna().sum()
)

print("\nNew features:")

for col in [
    "SANCTION_DELAY_DAYS",
    "COMPLETION_DURATION_DAYS",
    "TOTAL_LIFECYCLE_DAYS",
    "COST_VARIANCE",
    "COST_VARIANCE_PERCENT",
]:
    print(" -", col)