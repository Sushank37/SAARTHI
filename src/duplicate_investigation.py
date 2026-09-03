import pandas as pd
import numpy as np
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

MASTER_FILE = BASE_DIR / "data" / "master_works.csv"
CANDIDATE_FILE = BASE_DIR / "data" / "duplicate_candidates.csv"
CLUSTER_FILE = BASE_DIR / "data" / "duplicate_clusters_v2.csv"

OUTPUT_FILE = BASE_DIR / "data" / "duplicate_investigations.csv"


print("=" * 60)
print("MPLADS DUPLICATE INVESTIGATION ENGINE V2")
print("=" * 60)


# =========================================================
# LOAD DATA
# =========================================================

print("\nLoading datasets...")

master = pd.read_csv(
    MASTER_FILE,
    low_memory=False
)

candidates = pd.read_csv(
    CANDIDATE_FILE,
    low_memory=False
)

clusters = pd.read_csv(
    CLUSTER_FILE,
    low_memory=False
)

print("Master rows     :", len(master))
print("Candidate pairs :", len(candidates))
print("Cluster rows    :", len(clusters))


# =========================================================
# NORMALIZE IDS
# =========================================================

master["WORK_RECOMMENDATION_DTL_ID"] = pd.to_numeric(
    master["WORK_RECOMMENDATION_DTL_ID"],
    errors="coerce"
)

candidates["WORK_ID_A"] = pd.to_numeric(
    candidates["WORK_ID_A"],
    errors="coerce"
)

candidates["WORK_ID_B"] = pd.to_numeric(
    candidates["WORK_ID_B"],
    errors="coerce"
)


# =========================================================
# BUILD WORK -> CLUSTER MAPPING
# =========================================================

print("\nBuilding actual WORK → CLUSTER mapping...")

# The cluster file contains one row per work.
# Therefore CLUSTER_ID identifies the cluster to which
# each work belongs.

required_cluster_columns = {
    "CLUSTER_ID",
    "WORK_ID"
}

if not required_cluster_columns.issubset(
    clusters.columns
):
    print("\nERROR: Required columns missing from cluster file.")

    print("\nAvailable columns:")
    for col in clusters.columns:
        print(" -", col)

    raise SystemExit(1)


clusters["WORK_ID"] = pd.to_numeric(
    clusters["WORK_ID"],
    errors="coerce"
)

cluster_map = clusters[
    ["CLUSTER_ID", "WORK_ID"]
].dropna()

cluster_map = cluster_map.drop_duplicates()

print(
    "Unique works mapped:",
    cluster_map["WORK_ID"].nunique()
)

print(
    "Clusters mapped:",
    cluster_map["CLUSTER_ID"].nunique()
)


# =========================================================
# FILTER STRONG CANDIDATE RELATIONSHIPS
# =========================================================

print("\nFiltering strong duplicate relationships...")

if "DUPLICATE_LEVEL" in candidates.columns:

    strong = candidates[
        candidates["DUPLICATE_LEVEL"].isin(
            ["HIGH", "MEDIUM"]
        )
    ].copy()

else:

    strong = candidates[
        candidates["DUPLICATE_SCORE"] >= 50
    ].copy()


print(
    "Strong candidate pairs:",
    len(strong)
)


# =========================================================
# BUILD CLUSTER MEMBERS FROM ACTUAL WORK IDs
# =========================================================

print("\nConnecting candidate relationships to clusters...")

# Map WORK_ID_A -> CLUSTER_ID
a = strong.merge(
    cluster_map,
    left_on="WORK_ID_A",
    right_on="WORK_ID",
    how="inner"
)

a = a.rename(
    columns={
        "CLUSTER_ID": "CLUSTER_ID_A"
    }
)

a = a.drop(
    columns=["WORK_ID"],
    errors="ignore"
)


# Map WORK_ID_B -> CLUSTER_ID
b = strong.merge(
    cluster_map,
    left_on="WORK_ID_B",
    right_on="WORK_ID",
    how="inner"
)

b = b.rename(
    columns={
        "CLUSTER_ID": "CLUSTER_ID_B"
    }
)

b = b.drop(
    columns=["WORK_ID"],
    errors="ignore"
)


# Keep relationships where both works
# belong to the same cluster.

relationships = a.merge(
    b[
        [
            "WORK_ID_A",
            "WORK_ID_B",
            "CLUSTER_ID_B"
        ]
    ],
    on=["WORK_ID_A", "WORK_ID_B"],
    how="inner"
)

relationships = relationships[
    relationships["CLUSTER_ID_A"]
    ==
    relationships["CLUSTER_ID_B"]
].copy()

relationships["CLUSTER_ID"] = (
    relationships["CLUSTER_ID_A"]
)

relationships = relationships.drop(
    columns=[
        "CLUSTER_ID_A",
        "CLUSTER_ID_B"
    ],
    errors="ignore"
)

print(
    "Cluster relationships:",
    len(relationships)
)


# =========================================================
# HELPER FUNCTIONS
# =========================================================

def unique_count(df, column):

    if column not in df.columns:
        return 0

    return df[column].dropna().nunique()


def concentration(df, column):

    if column not in df.columns:
        return 0.0

    values = df[column].dropna()

    if len(values) == 0:
        return 0.0

    return float(
        values.value_counts(normalize=True).iloc[0]
    )


def mode_value(df, column):

    if column not in df.columns:
        return ""

    values = df[column].dropna()

    if len(values) == 0:
        return ""

    return values.mode().iloc[0]


# =========================================================
# INVESTIGATE CLUSTERS
# =========================================================

print("\nInvestigating clusters...")

results = []

cluster_ids = sorted(
    relationships["CLUSTER_ID"].unique()
)

print(
    "Clusters to investigate:",
    len(cluster_ids)
)


for counter, cluster_id in enumerate(
    cluster_ids,
    start=1
):

    cluster_pairs = relationships[
        relationships["CLUSTER_ID"] == cluster_id
    ]

    # -----------------------------------------------------
    # Get every work participating in this cluster
    # -----------------------------------------------------

    work_ids = set(
        cluster_pairs["WORK_ID_A"]
        .dropna()
        .tolist()
    )

    work_ids.update(
        cluster_pairs["WORK_ID_B"]
        .dropna()
        .tolist()
    )

    if len(work_ids) == 0:
        continue

    # -----------------------------------------------------
    # Get master records
    # -----------------------------------------------------

    data = master[
        master["WORK_RECOMMENDATION_DTL_ID"]
        .isin(work_ids)
    ].copy()

    if len(data) == 0:
        continue

    total_works = len(data)

    # -----------------------------------------------------
    # BASIC INFORMATION
    # -----------------------------------------------------

    state = mode_value(
        data,
        "STATE_NAME"
    )

    constituency = mode_value(
        data,
        "CONSTITUENCY"
    )

    mp = mode_value(
        data,
        "MP_NAME"
    )

    category = mode_value(
        data,
        "WORK_CATEGORY"
    )

    # -----------------------------------------------------
    # DESCRIPTION
    # -----------------------------------------------------

    unique_descriptions = unique_count(
        data,
        "WORK_DESCRIPTION"
    )

    description_concentration = concentration(
        data,
        "WORK_DESCRIPTION"
    )

    exact_description = (
        unique_descriptions == 1
    )

    # -----------------------------------------------------
    # AMOUNT
    # -----------------------------------------------------

    unique_amounts = unique_count(
        data,
        "SANCTION_AMOUNT"
    )

    amount_concentration = concentration(
        data,
        "SANCTION_AMOUNT"
    )

    exact_amount = (
        unique_amounts == 1
    )

    # -----------------------------------------------------
    # MP
    # -----------------------------------------------------

    unique_mps = unique_count(
        data,
        "MP_NAME"
    )

    same_mp = (
        unique_mps == 1
    )

    # -----------------------------------------------------
    # CONSTITUENCY
    # -----------------------------------------------------

    unique_constituencies = unique_count(
        data,
        "CONSTITUENCY"
    )

    same_constituency = (
        unique_constituencies == 1
    )

    # -----------------------------------------------------
    # CATEGORY
    # -----------------------------------------------------

    unique_categories = unique_count(
        data,
        "WORK_CATEGORY"
    )

    same_category = (
        unique_categories == 1
    )

    # -----------------------------------------------------
    # RECOMMENDATION DATE
    # -----------------------------------------------------

    recommendation_dates = unique_count(
        data,
        "RECOMMENDATION_DATE"
    )

    recommendation_concentration = concentration(
        data,
        "RECOMMENDATION_DATE"
    )

    # -----------------------------------------------------
    # SANCTION DATE
    # -----------------------------------------------------

    sanction_dates = unique_count(
        data,
        "SANCTION_DATE"
    )

    sanction_concentration = concentration(
        data,
        "SANCTION_DATE"
    )

    # -----------------------------------------------------
    # WORK STAGE
    # -----------------------------------------------------

    work_stages = unique_count(
        data,
        "WORK_STAGE"
    )

    # -----------------------------------------------------
    # CANDIDATE RELATIONSHIP STATISTICS
    # -----------------------------------------------------

    pair_count = len(
        cluster_pairs
    )

    avg_text_similarity = (
        cluster_pairs[
            "TEXT_SIMILARITY"
        ].mean()
        if "TEXT_SIMILARITY"
        in cluster_pairs.columns
        else np.nan
    )

    avg_amount_similarity = (
        cluster_pairs[
            "AMOUNT_SIMILARITY"
        ].mean()
        if "AMOUNT_SIMILARITY"
        in cluster_pairs.columns
        else np.nan
    )

    # -----------------------------------------------------
    # EVIDENCE
    # -----------------------------------------------------

    score = 0

    evidence = []

    # Large cluster
    if total_works >= 50:

        score += 20

        evidence.append(
            f"Large cluster containing "
            f"{total_works} works"
        )

    elif total_works >= 10:

        score += 12

        evidence.append(
            f"Cluster contains "
            f"{total_works} works"
        )

    elif total_works >= 5:

        score += 6

        evidence.append(
            f"Cluster contains "
            f"{total_works} works"
        )

    # Exact description
    if exact_description:

        score += 25

        evidence.append(
            "All works have identical descriptions"
        )

    elif description_concentration >= 0.8:

        score += 15

        evidence.append(
            f"{description_concentration:.0%} "
            f"of works share the same description"
        )

    # Exact amount
    if exact_amount:

        score += 20

        evidence.append(
            "All works have identical sanctioned amounts"
        )

    elif amount_concentration >= 0.8:

        score += 10

        evidence.append(
            f"{amount_concentration:.0%} "
            f"of works share the same sanctioned amount"
        )

    # Same MP
    if same_mp:

        score += 10

        evidence.append(
            "All works belong to the same MP"
        )

    # Same constituency
    if same_constituency:

        score += 10

        evidence.append(
            "All works belong to the same constituency"
        )

    # Same category
    if same_category:

        score += 5

        evidence.append(
            "All works belong to the same work category"
        )

    # Recommendation concentration
    if recommendation_concentration >= 0.8:

        score += 5

        evidence.append(
            "Recommendations are highly "
            "concentrated in time"
        )

    # Sanction concentration
    if sanction_concentration >= 0.8:

        score += 5

        evidence.append(
            "Sanctions are highly "
            "concentrated in time"
        )

    score = min(
        score,
        100
    )

    # -----------------------------------------------------
    # SUSPICION LEVEL
    # -----------------------------------------------------

    if score >= 70:

        suspicion = "HIGH SUSPICION"

    elif score >= 45:

        suspicion = "MEDIUM SUSPICION"

    else:

        suspicion = "LOW SUSPICION"

    # -----------------------------------------------------
    # REPRESENTATIVE VALUES
    # -----------------------------------------------------

    description = mode_value(
        data,
        "WORK_DESCRIPTION"
    )

    amount = mode_value(
        data,
        "SANCTION_AMOUNT"
    )

    # -----------------------------------------------------
    # SAVE RESULT
    # -----------------------------------------------------

    results.append({

        "CLUSTER_ID":
            cluster_id,

        "CLUSTER_SIZE":
            total_works,

        "PAIR_COUNT":
            pair_count,

        "STATE":
            state,

        "CONSTITUENCY":
            constituency,

        "MP_NAME":
            mp,

        "WORK_CATEGORY":
            category,

        "UNIQUE_DESCRIPTIONS":
            unique_descriptions,

        "DESCRIPTION_CONCENTRATION":
            round(
                description_concentration,
                4
            ),

        "EXACT_DESCRIPTION_MATCH":
            exact_description,

        "UNIQUE_AMOUNTS":
            unique_amounts,

        "AMOUNT_CONCENTRATION":
            round(
                amount_concentration,
                4
            ),

        "EXACT_AMOUNT_MATCH":
            exact_amount,

        "UNIQUE_MPs":
            unique_mps,

        "UNIQUE_CONSTITUENCIES":
            unique_constituencies,

        "UNIQUE_CATEGORIES":
            unique_categories,

        "RECOMMENDATION_DATES":
            recommendation_dates,

        "RECOMMENDATION_DATE_CONCENTRATION":
            round(
                recommendation_concentration,
                4
            ),

        "SANCTION_DATES":
            sanction_dates,

        "SANCTION_DATE_CONCENTRATION":
            round(
                sanction_concentration,
                4
            ),

        "WORK_STAGES":
            work_stages,

        "AVG_TEXT_SIMILARITY":
            round(
                avg_text_similarity,
                4
            )
            if not pd.isna(
                avg_text_similarity
            )
            else np.nan,

        "AVG_AMOUNT_SIMILARITY":
            round(
                avg_amount_similarity,
                4
            )
            if not pd.isna(
                avg_amount_similarity
            )
            else np.nan,

        "REPRESENTATIVE_DESCRIPTION":
            description,

        "REPRESENTATIVE_AMOUNT":
            amount,

        "EVIDENCE_SCORE":
            round(
                score,
                2
            ),

        "SUSPICION_LEVEL":
            suspicion,

        "EVIDENCE":
            " | ".join(evidence)
    })

    if counter % 100 == 0:

        print(
            f"Processed clusters: "
            f"{counter} / {len(cluster_ids)}"
        )


# =========================================================
# CREATE OUTPUT
# =========================================================

if len(results) == 0:

    print(
        "\nERROR: No investigation records were created."
    )

    print(
        "Check WORK_ID ↔ CLUSTER_ID mapping."
    )

    raise SystemExit(1)


result = pd.DataFrame(
    results
)


# =========================================================
# SORT
# =========================================================

result = result.sort_values(
    [
        "EVIDENCE_SCORE",
        "CLUSTER_SIZE",
        "PAIR_COUNT"
    ],
    ascending=[
        False,
        False,
        False
    ]
)


# =========================================================
# SAVE
# =========================================================

result.to_csv(
    OUTPUT_FILE,
    index=False
)


# =========================================================
# DISPLAY RESULTS
# =========================================================

print("\n" + "=" * 60)
print("DUPLICATE INVESTIGATION RESULTS")
print("=" * 60)

print(
    "\nClusters investigated:",
    len(result)
)

print(
    "Works investigated:",
    result["CLUSTER_SIZE"].sum()
)

print("\nSuspicion distribution:")

print(
    result[
        "SUSPICION_LEVEL"
    ].value_counts()
)


print("\nTOP 20 SUSPICIOUS CLUSTERS")

print(
    result[
        [
            "CLUSTER_ID",
            "CLUSTER_SIZE",
            "PAIR_COUNT",
            "STATE",
            "CONSTITUENCY",
            "MP_NAME",
            "UNIQUE_DESCRIPTIONS",
            "UNIQUE_AMOUNTS",
            "EVIDENCE_SCORE",
            "SUSPICION_LEVEL",
            "EVIDENCE"
        ]
    ].head(20).to_string(
        index=False
    )
)


# =========================================================
# SPECIFIC PURI CHECK
# =========================================================

print("\n" + "=" * 60)
print("PURI CLUSTER CHECK")
print("=" * 60)

puri = result[
    (
        result["STATE"].astype(str)
        .str.upper()
        == "ODISHA"
    )
    &
    (
        result["CONSTITUENCY"].astype(str)
        .str.upper()
        == "PURI"
    )
]

if len(puri) > 0:

    print(
        puri.head(10).to_string(
            index=False
        )
    )

else:

    print(
        "No Odisha / Puri cluster found."
    )


print("\nOutput:")
print(OUTPUT_FILE)

print("\n" + "=" * 60)
print("DUPLICATE INVESTIGATION ENGINE V2 COMPLETE")
print("=" * 60)