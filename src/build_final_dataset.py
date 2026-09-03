import os
import pandas as pd
import numpy as np


# ============================================================
# CONFIGURATION
# ============================================================

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

DATA_DIR = os.path.join(BASE_DIR, "data")

MASTER_FILE = os.path.join(DATA_DIR, "master_works.csv")
BENCHMARK_FILE = os.path.join(DATA_DIR, "benchmark_works.csv")
RISK_FILE = os.path.join(DATA_DIR, "risk_scored_works.csv")
CLUSTER_FILE = os.path.join(DATA_DIR, "duplicate_clusters_v2.csv")
INVESTIGATION_FILE = os.path.join(DATA_DIR, "duplicate_investigations.csv")

OUTPUT_FILE = os.path.join(
    DATA_DIR,
    "mplads_final_dataset.csv"
)


# ============================================================
# HELPERS
# ============================================================

def check_key_uniqueness(df, key, name):
    """
    Check uniqueness while ignoring missing keys.
    """

    if key not in df.columns:
        raise ValueError(
            f"{key} not found in {name}. "
            f"Available columns: {list(df.columns)}"
        )

    valid = df[df[key].notna()]

    duplicate_count = valid[key].duplicated().sum()

    print(
        f"{name}: {key} unique check -> "
        f"{len(valid):,} valid / "
        f"{duplicate_count:,} duplicate valid keys"
    )

    if duplicate_count > 0:

        duplicated_keys = (
            valid.loc[
                valid[key].duplicated(keep=False),
                key
            ]
            .value_counts()
            .head(10)
        )

        print("Top duplicate keys:")
        print(duplicated_keys)

        return False

    return True


def safe_numeric(df, columns):
    """
    Convert selected columns to numeric safely.
    """

    for col in columns:

        if col in df.columns:

            df[col] = pd.to_numeric(
                df[col],
                errors="coerce"
            )

    return df


def merge_with_row_check(
    left,
    right,
    on,
    name,
    how="left"
):
    """
    Perform merge and guarantee that the number of rows
    does not unexpectedly increase.
    """

    before = len(left)

    print()
    print(f"Merging {name}...")
    print(f"Rows before: {before:,}")

    result = left.merge(
        right,
        on=on,
        how=how,
        suffixes=("", f"_{name.upper()}"),
        sort=False
    )

    after = len(result)

    print(f"Rows after : {after:,}")

    if after != before:

        raise RuntimeError(
            f"""
ROW COUNT CHANGED DURING {name} MERGE

Before: {before:,}
After : {after:,}

This means the right-hand dataset contains
multiple records for the same merge key.

Merge key:
{on}
"""
        )

    return result


# ============================================================
# START
# ============================================================

print("=" * 70)
print("MPLADS FINAL DATASET BUILDER")
print("=" * 70)


# ============================================================
# 1. LOAD MASTER
# ============================================================

print()
print("Loading master dataset...")

master = pd.read_csv(
    MASTER_FILE,
    low_memory=False
)

print(f"Master rows: {len(master):,}")

master = master.drop_duplicates(
    subset=["WORK_RECOMMENDATION_DTL_ID"]
).copy()

print(
    f"Master duplicate IDs removed: "
    f"{len(master):,}"
)


# ============================================================
# 2. MASTER ID VALIDATION
# ============================================================

if master["WORK_RECOMMENDATION_DTL_ID"].duplicated().any():

    raise RuntimeError(
        "WORK_RECOMMENDATION_DTL_ID is still duplicated "
        "in master dataset."
    )

print(
    "Master recommendation IDs are unique."
)


# ============================================================
# 3. LOAD BENCHMARK
# ============================================================

print()
print("Loading benchmark dataset...")

benchmark = pd.read_csv(
    BENCHMARK_FILE,
    low_memory=False
)

print(
    f"Benchmark rows: {len(benchmark):,}"
)


benchmark_features = [
    "WORK_RECOMMENDATION_DTL_ID",
    "PEER_MEDIAN_SANCTION_DELAY",
    "SANCTION_DELAY_VS_PEER",
    "PEER_MEDIAN_COMPLETION_DAYS",
    "COMPLETION_VS_PEER",
    "PEER_MEDIAN_SANCTION_AMOUNT",
    "COST_VS_PEER"
]


benchmark_features = [
    c for c in benchmark_features
    if c in benchmark.columns
]


benchmark_small = benchmark[
    benchmark_features
].copy()


# Ensure one benchmark row per recommendation ID
benchmark_small = (
    benchmark_small
    .drop_duplicates(
        subset=["WORK_RECOMMENDATION_DTL_ID"]
    )
)


check_key_uniqueness(
    benchmark_small,
    "WORK_RECOMMENDATION_DTL_ID",
    "Benchmark"
)


print(
    "Benchmark features:",
    benchmark_features
)


master = merge_with_row_check(
    master,
    benchmark_small,
    "WORK_RECOMMENDATION_DTL_ID",
    "benchmark"
)


# ============================================================
# 4. LOAD RISK DATASET
# ============================================================

print()
print("Loading risk dataset...")

risk = pd.read_csv(
    RISK_FILE,
    low_memory=False
)

print(
    f"Risk rows: {len(risk):,}"
)

print()
print("Risk columns:")
print(list(risk.columns))


risk_features = [
    "WORK_RECOMMENDATION_DTL_ID",
    "DELAY_RISK",
    "COMPLETION_RISK",
    "COST_RISK",
    "VARIANCE_RISK",
    "RISK_SCORE",
    "RISK_LEVEL",
    "RISK_REASON"
]


risk_features = [
    c for c in risk_features
    if c in risk.columns
]


risk_small = risk[
    risk_features
].copy()


risk_small = (
    risk_small
    .drop_duplicates(
        subset=["WORK_RECOMMENDATION_DTL_ID"]
    )
)


check_key_uniqueness(
    risk_small,
    "WORK_RECOMMENDATION_DTL_ID",
    "Risk"
)


# Remove columns that already exist in master
risk_merge_features = [
    "WORK_RECOMMENDATION_DTL_ID"
]

for col in risk_features:

    if col == "WORK_RECOMMENDATION_DTL_ID":
        continue

    if col in master.columns:

        print(
            f"Dropping risk duplicate column: {col}"
        )

    else:

        risk_merge_features.append(col)


risk_small = risk_small[
    risk_merge_features
]


print(
    "Risk features:",
    list(risk_small.columns)
)


master = merge_with_row_check(
    master,
    risk_small,
    "WORK_RECOMMENDATION_DTL_ID",
    "risk"
)


# ============================================================
# 5. LOAD DUPLICATE CLUSTERS
# ============================================================

print()
print("Loading duplicate clusters...")

clusters = pd.read_csv(
    CLUSTER_FILE,
    low_memory=False
)

print(
    f"Cluster rows: {len(clusters):,}"
)


cluster_features = [
    "WORK_ID",
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
    "DUPLICATE_RISK",
    "EVIDENCE"
]


cluster_features = [
    c for c in cluster_features
    if c in clusters.columns
]


clusters_small = clusters[
    cluster_features
].copy()


print(
    "Cluster features:",
    cluster_features
)


# ============================================================
# IMPORTANT:
# WORK_ID CAN BE NaN IN MASTER.
#
# Therefore:
# - Do NOT use one-to-one merge directly.
# - Do NOT allow NaN to participate in the merge.
# - Merge only rows where WORK_ID exists.
# ============================================================


# The duplicate engine uses WORK_RECOMMENDATION_DTL_ID as the
# work identifier.  Do not merge these records using WORK_ID:
# WORK_ID is a different field in the MPLADS source and doing so
# attaches clusters to unrelated works.
#
# Keep exactly one cluster record per recommendation ID.

cluster_key = "WORK_ID"

clusters_valid = clusters_small[
    clusters_small[cluster_key].notna()
].copy()

clusters_valid[cluster_key] = pd.to_numeric(
    clusters_valid[cluster_key],
    errors="coerce"
)

clusters_valid = (
    clusters_valid
    .drop_duplicates(
        subset=[cluster_key],
        keep="first"
    )
)

check_key_uniqueness(
    clusters_valid,
    cluster_key,
    "Duplicate clusters"
)

master["WORK_RECOMMENDATION_DTL_ID"] = pd.to_numeric(
    master["WORK_RECOMMENDATION_DTL_ID"],
    errors="coerce"
)

# Rename the cluster engine's WORK_ID to the actual master key.
clusters_valid = clusters_valid.rename(
    columns={"WORK_ID": "WORK_RECOMMENDATION_DTL_ID"}
)

# Ensure the final dataset receives cluster columns for every
# master work, including works that are not in a cluster.
master = master.merge(
    clusters_valid,
    on="WORK_RECOMMENDATION_DTL_ID",
    how="left",
    suffixes=("", "_CLUSTER"),
    validate="one_to_one"
)

print()
print(
    "Duplicate cluster mapping:"
)
print(
    f"  Works in clusters : "
    f"{master['CLUSTER_ID'].notna().sum():,}"
)
print(
    f"  Works outside clusters : "
    f"{master['CLUSTER_ID'].isna().sum():,}"
)
print(
    f"  Clusters mapped : "
    f"{master['CLUSTER_ID'].nunique(dropna=True):,}"
)


# ============================================================
# 7. LOAD INVESTIGATIONS
# ============================================================

print()
print("Loading duplicate investigations...")

investigations = pd.read_csv(
    INVESTIGATION_FILE,
    low_memory=False
)

print(
    f"Investigation rows: "
    f"{len(investigations):,}"
)


investigation_features = [
    "CLUSTER_ID",
    "EVIDENCE_SCORE",
    "SUSPICION_LEVEL",
    "UNIQUE_DESCRIPTIONS",
    "DESCRIPTION_CONCENTRATION",
    "EXACT_DESCRIPTION_MATCH",
    "UNIQUE_AMOUNTS",
    "AMOUNT_CONCENTRATION",
    "EXACT_AMOUNT_MATCH",
    "RECOMMENDATION_DATES",
    "RECOMMENDATION_DATE_CONCENTRATION",
    "SANCTION_DATES",
    "SANCTION_DATE_CONCENTRATION",
    "WORK_STAGES",
    "AVG_TEXT_SIMILARITY",
    "AVG_AMOUNT_SIMILARITY",
    "REPRESENTATIVE_DESCRIPTION",
    "REPRESENTATIVE_AMOUNT"
]


investigation_features = [
    c for c in investigation_features
    if c in investigations.columns
]


investigations_small = investigations[
    investigation_features
].copy()


# Only valid cluster IDs
investigations_small = investigations_small[
    investigations_small["CLUSTER_ID"].notna()
].copy()


# One investigation record per cluster
investigations_small = (
    investigations_small
    .drop_duplicates(
        subset=["CLUSTER_ID"],
        keep="first"
    )
)


check_key_uniqueness(
    investigations_small,
    "CLUSTER_ID",
    "Investigations"
)


# ============================================================
# 8. REMOVE DUPLICATE INVESTIGATION COLUMNS
# ============================================================

investigation_merge_features = [
    "CLUSTER_ID"
]


for col in investigation_features:

    if col == "CLUSTER_ID":
        continue

    if col in master.columns:

        print(
            f"Dropping investigation duplicate column: {col}"
        )

    else:

        investigation_merge_features.append(col)


investigations_small = investigations_small[
    investigation_merge_features
]


print()
print(
    "Investigation features:",
    list(investigations_small.columns)
)


# ============================================================
# 9. MERGE INVESTIGATIONS
# ============================================================

master = merge_with_row_check(
    master,
    investigations_small,
    "CLUSTER_ID",
    "investigation"
)


# ============================================================
# 10. CLEAN DUPLICATE COLUMNS
# ============================================================

print()
print("Cleaning duplicate columns...")


# These can occur depending on previous versions
# of the pipeline.

duplicate_columns_to_remove = []


for col in [
    "DUPLICATE_RISK_CLUSTER",
    "DUPLICATE_RISK_INVESTIGATION",
    "AVG_TEXT_SIMILARITY_CLUSTER",
    "AVG_AMOUNT_SIMILARITY_CLUSTER"
]:

    if col in master.columns:

        duplicate_columns_to_remove.append(col)


if duplicate_columns_to_remove:

    print(
        "Dropping:",
        duplicate_columns_to_remove
    )

    master.drop(
        columns=duplicate_columns_to_remove,
        inplace=True
    )


# ============================================================
# 10A. CALIBRATE DUPLICATE SCORE
# ============================================================
#
# The original cluster score was dominated by maximum similarity
# and cluster size.  Because candidate generation already requires
# high text/amount similarity, that formula saturated near 100 for
# almost every cluster.
#
# Recalibrate the score using:
#   - average pair similarity       45%
#   - evidence score                30%
#   - description concentration     15%
#   - amount concentration          10%
#
# This preserves the underlying signals while reserving 100 for
# cases where all available evidence is maximal.

score_inputs = [
    "AVG_PAIR_SCORE",
    "EVIDENCE_SCORE",
    "DESCRIPTION_CONCENTRATION",
    "AMOUNT_CONCENTRATION",
]

if all(col in master.columns for col in score_inputs):

    avg_pair = pd.to_numeric(
        master["AVG_PAIR_SCORE"],
        errors="coerce"
    ).fillna(0).clip(0, 100)

    evidence_score = pd.to_numeric(
        master["EVIDENCE_SCORE"],
        errors="coerce"
    ).fillna(0).clip(0, 100)

    description_concentration = pd.to_numeric(
        master["DESCRIPTION_CONCENTRATION"],
        errors="coerce"
    ).fillna(0).clip(0, 1) * 100

    amount_concentration = pd.to_numeric(
        master["AMOUNT_CONCENTRATION"],
        errors="coerce"
    ).fillna(0).clip(0, 1) * 100

    master["CLUSTER_SUSPICION_SCORE"] = (
        avg_pair * 0.45
        + evidence_score * 0.30
        + description_concentration * 0.15
        + amount_concentration * 0.10
    ).clip(0, 100).round(2)

    def calibrated_duplicate_risk(score):
        if pd.isna(score):
            return np.nan
        if score >= 90:
            return "HIGH"
        if score >= 75:
            return "MEDIUM"
        return "LOW"

    master["DUPLICATE_RISK"] = (
        master["CLUSTER_SUSPICION_SCORE"]
        .apply(calibrated_duplicate_risk)
    )

print()
print("Calibrated duplicate score distribution:")
if "CLUSTER_SUSPICION_SCORE" in master.columns:
    print(
        master.loc[
            master["CLUSTER_ID"].notna(),
            "CLUSTER_SUSPICION_SCORE"
        ].describe()
    )

if "DUPLICATE_RISK" in master.columns:
    print(
        master.loc[
            master["CLUSTER_ID"].notna(),
            "DUPLICATE_RISK"
        ].value_counts(dropna=False)
    )


# ============================================================
# 11. CREATE DUPLICATE FLAGS
# ============================================================

print()
print("Creating application flags...")


# ------------------------------------------------------------
# Risk flags
# ------------------------------------------------------------

master["IS_HIGH_RISK"] = (
    master["RISK_LEVEL"]
    .fillna("")
    .astype(str)
    .str.upper()
    .eq("HIGH")
)


master["IS_MEDIUM_RISK"] = (
    master["RISK_LEVEL"]
    .fillna("")
    .astype(str)
    .str.upper()
    .eq("MEDIUM")
)


master["IS_LOW_RISK"] = (
    master["RISK_LEVEL"]
    .fillna("")
    .astype(str)
    .str.upper()
    .eq("LOW")
)


# ------------------------------------------------------------
# Duplicate flags
# ------------------------------------------------------------

if "DUPLICATE_RISK" in master.columns:

    duplicate_risk_text = (
        master["DUPLICATE_RISK"]
        .fillna("")
        .astype(str)
        .str.upper()
    )

else:

    duplicate_risk_text = pd.Series(
        "",
        index=master.index
    )


master["IS_HIGH_DUPLICATE_RISK"] = (
    duplicate_risk_text == "HIGH"
)


master["IS_MEDIUM_DUPLICATE_RISK"] = (
    duplicate_risk_text == "MEDIUM"
)


master["IS_DUPLICATE_CLUSTER"] = (
    master["CLUSTER_ID"].notna()
)


# ------------------------------------------------------------
# Investigation flags
# ------------------------------------------------------------

if "SUSPICION_LEVEL" in master.columns:

    suspicion_text = (
        master["SUSPICION_LEVEL"]
        .fillna("")
        .astype(str)
        .str.upper()
    )

else:

    suspicion_text = pd.Series(
        "",
        index=master.index
    )


master["IS_HIGH_SUSPICION"] = (
    suspicion_text == "HIGH SUSPICION"
)


master["IS_MEDIUM_SUSPICION"] = (
    suspicion_text == "MEDIUM SUSPICION"
)


master["IS_LOW_SUSPICION"] = (
    suspicion_text == "LOW SUSPICION"
)


# ============================================================
# 12. CREATE OVERALL ALERT
# ============================================================

master["REQUIRES_REVIEW"] = (
    master["IS_HIGH_RISK"]
    |
    master["IS_HIGH_DUPLICATE_RISK"]
    |
    master["IS_HIGH_SUSPICION"]
)


# ============================================================
# 13. CREATE REVIEW REASON
# ============================================================

def build_review_reason(row):

    reasons = []

    if row.get("IS_HIGH_RISK", False):

        reasons.append(
            "HIGH FINANCIAL/EXECUTION RISK"
        )

    elif row.get("IS_MEDIUM_RISK", False):

        reasons.append(
            "MEDIUM FINANCIAL/EXECUTION RISK"
        )


    if row.get("IS_HIGH_DUPLICATE_RISK", False):

        reasons.append(
            "HIGH DUPLICATE CLUSTER RISK"
        )

    elif row.get("IS_MEDIUM_DUPLICATE_RISK", False):

        reasons.append(
            "MEDIUM DUPLICATE CLUSTER RISK"
        )


    if row.get("IS_HIGH_SUSPICION", False):

        reasons.append(
            "HIGH DUPLICATE SUSPICION"
        )

    elif row.get("IS_MEDIUM_SUSPICION", False):

        reasons.append(
            "MEDIUM DUPLICATE SUSPICION"
        )


    if not reasons:

        return "NO MAJOR ALERT"


    return " | ".join(reasons)


master["REVIEW_REASON"] = master.apply(
    build_review_reason,
    axis=1
)


# ============================================================
# 14. NUMERIC CLEANUP
# ============================================================

numeric_columns = [

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

    "RISK_SCORE",

    "PAIR_COUNT",
    "AVG_TEXT_SIMILARITY",
    "MAX_TEXT_SIMILARITY",
    "AVG_AMOUNT_SIMILARITY",
    "MAX_AMOUNT_SIMILARITY",
    "AVG_PAIR_SCORE",
    "MAX_PAIR_SCORE",

    "CLUSTER_SIZE",
    "CLUSTER_SUSPICION_SCORE",

    "EVIDENCE_SCORE",
    "DESCRIPTION_CONCENTRATION",
    "AMOUNT_CONCENTRATION",

    "RECOMMENDATION_DATE_CONCENTRATION",
    "SANCTION_DATE_CONCENTRATION",

    "REPRESENTATIVE_AMOUNT"
]


master = safe_numeric(
    master,
    numeric_columns
)


# ============================================================
# 15. DATE CLEANUP
# ============================================================

date_columns = [
    "RECOMMENDATION_DATE",
    "SANCTION_DATE",
    "ACTUAL_END_DATE"
]


for col in date_columns:

    if col in master.columns:

        master[col] = pd.to_datetime(
            master[col],
            errors="coerce"
        )


# ============================================================
# 16. FINAL SORT
# ============================================================

# Sort primarily by review priority.

sort_columns = []

if "REQUIRES_REVIEW" in master.columns:
    sort_columns.append("REQUIRES_REVIEW")

if "RISK_SCORE" in master.columns:
    sort_columns.append("RISK_SCORE")

if "EVIDENCE_SCORE" in master.columns:
    sort_columns.append("EVIDENCE_SCORE")


if sort_columns:

    master = master.sort_values(
        sort_columns,
        ascending=[False] * len(sort_columns),
        na_position="last"
    )


# ============================================================
# 17. FINAL VALIDATION
# ============================================================

print()
print("=" * 70)
print("FINAL DATASET VALIDATION")
print("=" * 70)


print(
    f"Final rows    : {len(master):,}"
)

print(
    f"Final columns : {len(master.columns):,}"
)


# ------------------------------------------------------------
# Row count must match original master
# ------------------------------------------------------------

original_master = pd.read_csv(
    MASTER_FILE,
    usecols=["WORK_RECOMMENDATION_DTL_ID"],
    low_memory=False
)


expected_rows = len(
    original_master.drop_duplicates(
        subset=["WORK_RECOMMENDATION_DTL_ID"]
    )
)


if len(master) != expected_rows:

    raise RuntimeError(
        f"""
FINAL ROW COUNT MISMATCH

Expected: {expected_rows:,}
Actual  : {len(master):,}

The final dataset cannot be trusted.
"""
    )


print(
    "✓ Row count preserved"
)


# ------------------------------------------------------------
# ID uniqueness
# ------------------------------------------------------------

if master[
    "WORK_RECOMMENDATION_DTL_ID"
].duplicated().any():

    raise RuntimeError(
        "Final dataset contains duplicate "
        "WORK_RECOMMENDATION_DTL_ID values."
    )


print(
    "✓ Recommendation IDs unique"
)


# ------------------------------------------------------------
# Work ID statistics
# ------------------------------------------------------------

print()
print("WORK ID COVERAGE")

print(
    f"Valid WORK_ID : "
    f"{master['WORK_ID'].notna().sum():,}"
)

print(
    f"Missing WORK_ID: "
    f"{master['WORK_ID'].isna().sum():,}"
)


# ------------------------------------------------------------
# Risk distribution
# ------------------------------------------------------------

if "RISK_LEVEL" in master.columns:

    print()
    print("RISK DISTRIBUTION")

    print(
        master["RISK_LEVEL"]
        .fillna("NO RISK SCORE")
        .value_counts()
    )


# ------------------------------------------------------------
# Duplicate distribution
# ------------------------------------------------------------

if "DUPLICATE_RISK" in master.columns:

    print()
    print("DUPLICATE RISK DISTRIBUTION")

    print(
        master["DUPLICATE_RISK"]
        .fillna("NOT IN CLUSTER")
        .value_counts()
    )


# ------------------------------------------------------------
# Suspicion distribution
# ------------------------------------------------------------

if "SUSPICION_LEVEL" in master.columns:

    print()
    print("SUSPICION DISTRIBUTION")

    print(
        master["SUSPICION_LEVEL"]
        .fillna("NOT INVESTIGATED")
        .value_counts()
    )


# ------------------------------------------------------------
# Review distribution
# ------------------------------------------------------------

print()
print("REVIEW DISTRIBUTION")

print(
    master["REQUIRES_REVIEW"]
    .value_counts()
)


# ============================================================
# 18. SAVE
# ============================================================

print()
print("Saving final dataset...")

master.to_csv(
    OUTPUT_FILE,
    index=False
)


# ============================================================
# COMPLETE
# ============================================================

print()
print("=" * 70)
print("MPLADS FINAL DATASET BUILDER COMPLETE")
print("=" * 70)

print()
print(
    f"Rows    : {len(master):,}"
)

print(
    f"Columns : {len(master.columns):,}"
)

print()
print(
    f"Output  : {OUTPUT_FILE}"
)

print()
print("Final dataset is ready for the application.")