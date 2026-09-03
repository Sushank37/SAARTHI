import pandas as pd
import numpy as np
import os

INPUT_FILE = "../data/duplicate_candidates.csv"
OUTPUT_FILE = "../data/duplicate_clusters_v2.csv"

print("=" * 60)
print("MPLADS DUPLICATE CLUSTER ENGINE V2")
print("=" * 60)

# ------------------------------------------------------------
# LOAD DATA
# ------------------------------------------------------------

df = pd.read_csv(INPUT_FILE, low_memory=False)

print("\nLoaded candidate pairs:", len(df))

# ------------------------------------------------------------
# NORMALIZE COLUMN NAMES
# ------------------------------------------------------------

df.columns = [c.strip() for c in df.columns]

# ------------------------------------------------------------
# BASIC CLEANING
# ------------------------------------------------------------

numeric_columns = [
    "TEXT_SIMILARITY",
    "AMOUNT_SIMILARITY",
    "DUPLICATE_SCORE",
    "WORK_ID_A",
    "WORK_ID_B"
]

for col in numeric_columns:
    if col in df.columns:
        df[col] = pd.to_numeric(
            df[col],
            errors="coerce"
        )

# ------------------------------------------------------------
# STRONG DUPLICATE RELATIONSHIPS
#
# These are relationships already identified by the
# previous duplicate engine.
# ------------------------------------------------------------

strong = df[
    (df["TEXT_SIMILARITY"] >= 0.90) &
    (df["AMOUNT_SIMILARITY"] >= 0.90)
].copy()

print("Strong candidate pairs:", len(strong))

# ------------------------------------------------------------
# FIND AVAILABLE COLUMNS
# ------------------------------------------------------------

print("\nAvailable columns:")
for col in strong.columns:
    print(" -", col)

# ------------------------------------------------------------
# EVIDENCE SCORING
# ------------------------------------------------------------

def similarity_score(value):
    if pd.isna(value):
        return 0

    return float(value)


strong["TEXT_SCORE"] = (
    strong["TEXT_SIMILARITY"]
    .fillna(0)
    .clip(0, 1)
)

strong["AMOUNT_SCORE"] = (
    strong["AMOUNT_SIMILARITY"]
    .fillna(0)
    .clip(0, 1)
)

# ------------------------------------------------------------
# BASE DUPLICATE SCORE
#
# Text similarity is more important than amount similarity.
# ------------------------------------------------------------

strong["PAIR_SUSPICION_SCORE"] = (
    strong["TEXT_SCORE"] * 60
    +
    strong["AMOUNT_SCORE"] * 40
)

# ------------------------------------------------------------
# CONVERT TO CLUSTER GRAPH
# ------------------------------------------------------------

parent = {}
rank = {}


def find(x):

    if x not in parent:
        parent[x] = x
        rank[x] = 0

    if parent[x] != x:
        parent[x] = find(parent[x])

    return parent[x]


def union(a, b):

    ra = find(a)
    rb = find(b)

    if ra == rb:
        return

    if rank[ra] < rank[rb]:

        parent[ra] = rb

    elif rank[ra] > rank[rb]:

        parent[rb] = ra

    else:

        parent[rb] = ra
        rank[ra] += 1


print("\nBuilding duplicate graph...")

for _, row in strong.iterrows():

    a = int(row["WORK_ID_A"])
    b = int(row["WORK_ID_B"])

    union(a, b)

print("Graph created.")

# ------------------------------------------------------------
# CLUSTER IDS
# ------------------------------------------------------------

cluster_map = {}

for work_id in parent:

    root = find(work_id)

    if root not in cluster_map:
        cluster_map[root] = len(cluster_map) + 1

# ------------------------------------------------------------
# WORK → CLUSTER
# ------------------------------------------------------------

work_cluster = []

for work_id in parent:

    root = find(work_id)

    work_cluster.append({
        "WORK_ID": work_id,
        "CLUSTER_ID": cluster_map[root]
    })

work_cluster = pd.DataFrame(work_cluster)

print(
    "Clusters found:",
    work_cluster["CLUSTER_ID"].nunique()
)

# ------------------------------------------------------------
# PAIR STATISTICS PER CLUSTER
# ------------------------------------------------------------

def get_cluster(work_id):

    if work_id not in parent:
        return None

    return cluster_map[find(work_id)]


strong["CLUSTER_ID"] = strong["WORK_ID_A"].apply(
    get_cluster
)

# ------------------------------------------------------------
# CLUSTER EVIDENCE
# ------------------------------------------------------------

cluster_stats = (
    strong
    .groupby("CLUSTER_ID")
    .agg(
        PAIR_COUNT=("WORK_ID_A", "count"),
        AVG_TEXT_SIMILARITY=(
            "TEXT_SIMILARITY",
            "mean"
        ),
        MAX_TEXT_SIMILARITY=(
            "TEXT_SIMILARITY",
            "max"
        ),
        AVG_AMOUNT_SIMILARITY=(
            "AMOUNT_SIMILARITY",
            "mean"
        ),
        MAX_AMOUNT_SIMILARITY=(
            "AMOUNT_SIMILARITY",
            "max"
        ),
        AVG_PAIR_SCORE=(
            "PAIR_SUSPICION_SCORE",
            "mean"
        ),
        MAX_PAIR_SCORE=(
            "PAIR_SUSPICION_SCORE",
            "max"
        )
    )
    .reset_index()
)

# ------------------------------------------------------------
# CLUSTER SIZE
# ------------------------------------------------------------

cluster_sizes = (
    work_cluster
    .groupby("CLUSTER_ID")
    .size()
    .reset_index(name="CLUSTER_SIZE")
)

cluster_stats = cluster_stats.merge(
    cluster_sizes,
    on="CLUSTER_ID",
    how="left"
)

# ------------------------------------------------------------
# CLUSTER SUSPICION SCORE
# ------------------------------------------------------------

# Evidence-based score:
#
# 50% average pair similarity
# 30% strongest relationship
# 20% cluster size signal
#
# Cluster size is capped so huge clusters do not
# automatically become suspicious.

cluster_stats["SIMILARITY_COMPONENT"] = (
    cluster_stats["AVG_PAIR_SCORE"] * 0.50
)

cluster_stats["STRONGEST_COMPONENT"] = (
    cluster_stats["MAX_PAIR_SCORE"] * 0.30
)

cluster_stats["SIZE_COMPONENT"] = (
    np.minimum(
        cluster_stats["CLUSTER_SIZE"],
        20
    ) / 20 * 20
)

cluster_stats["CLUSTER_SUSPICION_SCORE"] = (
    cluster_stats["SIMILARITY_COMPONENT"]
    +
    cluster_stats["STRONGEST_COMPONENT"]
    +
    cluster_stats["SIZE_COMPONENT"]
)

cluster_stats["CLUSTER_SUSPICION_SCORE"] = (
    cluster_stats["CLUSTER_SUSPICION_SCORE"]
    .round(2)
)

# ------------------------------------------------------------
# RISK LEVEL
# ------------------------------------------------------------

def risk_level(score):

    if score >= 75:
        return "HIGH"

    if score >= 50:
        return "MEDIUM"

    return "LOW"


cluster_stats["DUPLICATE_RISK"] = (
    cluster_stats[
        "CLUSTER_SUSPICION_SCORE"
    ].apply(risk_level)
)

# ------------------------------------------------------------
# EVIDENCE EXPLANATION
# ------------------------------------------------------------

def evidence(row):

    return (
        f"{int(row['CLUSTER_SIZE'])} works linked across "
        f"{int(row['PAIR_COUNT'])} candidate relationships; "
        f"average text similarity "
        f"{row['AVG_TEXT_SIMILARITY']:.2f}; "
        f"average amount similarity "
        f"{row['AVG_AMOUNT_SIMILARITY']:.2f}"
    )


cluster_stats["EVIDENCE"] = (
    cluster_stats.apply(
        evidence,
        axis=1
    )
)

# ------------------------------------------------------------
# MERGE CLUSTER INFORMATION BACK TO WORKS
# ------------------------------------------------------------

result = work_cluster.merge(
    cluster_stats,
    on="CLUSTER_ID",
    how="left"
)

# ------------------------------------------------------------
# SAVE
# ------------------------------------------------------------

result = result.sort_values(
    [
        "DUPLICATE_RISK",
        "CLUSTER_SUSPICION_SCORE",
        "CLUSTER_SIZE"
    ],
    ascending=[
        True,
        False,
        False
    ]
)

result.to_csv(
    OUTPUT_FILE,
    index=False
)

# ------------------------------------------------------------
# SUMMARY
# ------------------------------------------------------------

print("\n" + "=" * 60)
print("DUPLICATE CLUSTER V2 RESULTS")
print("=" * 60)

print(
    "\nWorks in duplicate graph:",
    len(result)
)

print(
    "Duplicate clusters:",
    result["CLUSTER_ID"].nunique()
)

print("\nRisk distribution:")

print(
    result[
        [
            "CLUSTER_ID",
            "DUPLICATE_RISK"
        ]
    ]
    .drop_duplicates()
    ["DUPLICATE_RISK"]
    .value_counts()
)

# ------------------------------------------------------------
# TOP CLUSTERS
# ------------------------------------------------------------

top = (
    cluster_stats
    .sort_values(
        "CLUSTER_SUSPICION_SCORE",
        ascending=False
    )
    .head(20)
)

print("\nTOP 20 SUSPICIOUS CLUSTERS")

print(
    top[
        [
            "CLUSTER_ID",
            "CLUSTER_SIZE",
            "PAIR_COUNT",
            "AVG_TEXT_SIMILARITY",
            "AVG_AMOUNT_SIMILARITY",
            "CLUSTER_SUSPICION_SCORE",
            "DUPLICATE_RISK",
            "EVIDENCE"
        ]
    ]
    .to_string(index=False)
)

print("\n" + "=" * 60)
print("DUPLICATE CLUSTER V2 COMPLETE")
print("=" * 60)

print("\nOutput:")
print(os.path.abspath(OUTPUT_FILE))