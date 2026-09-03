import pandas as pd
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

FILE = BASE_DIR / "data" / "risk_scored_works.csv"

df = pd.read_csv(FILE)

print("=" * 60)
print("MPLADS DUPLICATE DETECTION DATA INSPECTION")
print("=" * 60)

# --------------------------------------------------
# Basic information
# --------------------------------------------------

print("\nROWS:", len(df))

print("\nWORK DESCRIPTION")

print(
    "Missing:",
    df["WORK_DESCRIPTION"].isna().sum()
)

print(
    "Unique:",
    df["WORK_DESCRIPTION"].nunique()
)

# --------------------------------------------------
# Exact duplicates
# --------------------------------------------------

duplicate_mask = (
    df["WORK_DESCRIPTION"]
    .fillna("")
    .duplicated(keep=False)
)

duplicates = df[duplicate_mask].copy()

print("\nEXACT DESCRIPTION DUPLICATES")
print(
    "Rows:",
    len(duplicates)
)

print(
    "Unique descriptions:",
    duplicates["WORK_DESCRIPTION"]
    .nunique()
)

# --------------------------------------------------
# Show examples
# --------------------------------------------------

print("\nTOP EXACT DUPLICATE GROUPS")

counts = (
    df["WORK_DESCRIPTION"]
    .fillna("")
    .value_counts()
)

print(
    counts[counts > 1]
    .head(20)
    .to_string()
)

# --------------------------------------------------
# Duplicate works across important dimensions
# --------------------------------------------------

cols = [
    "STATE_NAME",
    "CONSTITUENCY",
    "WORK_CATEGORY",
    "WORK_DESCRIPTION"
]

available = [
    c for c in cols
    if c in df.columns
]

print("\nDUPLICATES BY STATE + CONSTITUENCY + CATEGORY + DESCRIPTION")

group_counts = (
    df.groupby(available)
    .size()
    .reset_index(name="COUNT")
)

suspicious_groups = group_counts[
    group_counts["COUNT"] > 1
]

print(
    "Groups:",
    len(suspicious_groups)
)

print(
    suspicious_groups
    .sort_values("COUNT", ascending=False)
    .head(20)
    .to_string(index=False)
)

# --------------------------------------------------
# Similarity candidates
# --------------------------------------------------

print("\nSAMPLE WORK DESCRIPTIONS")

sample = (
    df[
        [
            "WORK_RECOMMENDATION_DTL_ID",
            "STATE_NAME",
            "CONSTITUENCY",
            "WORK_CATEGORY",
            "SANCTION_AMOUNT",
            "WORK_DESCRIPTION"
        ]
    ]
    .dropna(subset=["WORK_DESCRIPTION"])
    .sample(
        min(20, len(df)),
        random_state=42
    )
)

for _, row in sample.iterrows():

    print("\nID:", row["WORK_RECOMMENDATION_DTL_ID"])
    print("STATE:", row["STATE_NAME"])
    print("CONSTITUENCY:", row["CONSTITUENCY"])
    print("CATEGORY:", row["WORK_CATEGORY"])
    print("AMOUNT:", row["SANCTION_AMOUNT"])
    print("DESCRIPTION:", row["WORK_DESCRIPTION"])

print("\n" + "=" * 60)
print("INSPECTION COMPLETE")
print("=" * 60)