import pandas as pd
import os

INPUT_FILE = "../data/duplicate_candidates.csv"
OUTPUT_FILE = "../data/duplicate_clusters.csv"

print("=" * 60)
print("MPLADS DUPLICATE CLUSTER ENGINE")
print("=" * 60)

# ------------------------------------------------------------
# LOAD CANDIDATES
# ------------------------------------------------------------

df = pd.read_csv(INPUT_FILE)

print("\nLoaded candidate pairs:", len(df))

# ------------------------------------------------------------
# BUILD GRAPH
#
# Every work = node
# Every strong duplicate relationship = edge
#
# We use:
#   - text similarity >= 0.90
#   - amount similarity >= 0.90
# ------------------------------------------------------------

strong = df[
    (df["TEXT_SIMILARITY"] >= 0.90) &
    (df["AMOUNT_SIMILARITY"] >= 0.90)
].copy()

print("Strong candidate pairs:", len(strong))

# ------------------------------------------------------------
# UNION-FIND
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
# ASSIGN CLUSTERS
# ------------------------------------------------------------

print("\nCreating clusters...")

cluster_map = {}

for work_id in parent:
    root = find(work_id)

    if root not in cluster_map:
        cluster_map[root] = len(cluster_map) + 1

cluster_count = len(cluster_map)

print("Clusters found:", cluster_count)

# ------------------------------------------------------------
# CREATE WORK → CLUSTER TABLE
# ------------------------------------------------------------

work_cluster = []

for work_id in parent:

    root = find(work_id)

    work_cluster.append({
        "WORK_ID": work_id,
        "CLUSTER_ID": cluster_map[root]
    })

work_cluster = pd.DataFrame(work_cluster)

# ------------------------------------------------------------
# ADD WORK DETAILS
#
# The candidate file contains details for both sides.
# We'll construct a clean lookup table.
# ------------------------------------------------------------

columns_a = [
    "WORK_ID_A",
    "STATE",
    "CONSTITUENCY",
    "CATEGORY",
    "DESCRIPTION_A",
    "SANCTION_AMOUNT_A"
]

details_a = strong[columns_a].copy()

details_a = details_a.rename(columns={
    "WORK_ID_A": "WORK_ID",
    "DESCRIPTION_A": "DESCRIPTION",
    "SANCTION_AMOUNT_A": "SANCTION_AMOUNT"
})

columns_b = [
    "WORK_ID_B",
    "STATE",
    "CONSTITUENCY",
    "CATEGORY",
    "DESCRIPTION_B",
    "SANCTION_AMOUNT_B"
]

details_b = strong[columns_b].copy()

details_b = details_b.rename(columns={
    "WORK_ID_B": "WORK_ID",
    "DESCRIPTION_B": "DESCRIPTION",
    "SANCTION_AMOUNT_B": "SANCTION_AMOUNT"
})

details = pd.concat(
    [details_a, details_b],
    ignore_index=True
)

# Remove repeated work entries
details = details.drop_duplicates(
    subset=["WORK_ID"]
)

# ------------------------------------------------------------
# MERGE CLUSTER INFORMATION
# ------------------------------------------------------------

result = work_cluster.merge(
    details,
    on="WORK_ID",
    how="left"
)

# ------------------------------------------------------------
# CLUSTER SIZE
# ------------------------------------------------------------

cluster_sizes = (
    result.groupby("CLUSTER_ID")["WORK_ID"]
    .count()
    .reset_index(name="CLUSTER_SIZE")
)

result = result.merge(
    cluster_sizes,
    on="CLUSTER_ID",
    how="left"
)

# ------------------------------------------------------------
# CLUSTER RISK
# ------------------------------------------------------------

def cluster_risk(size):

    if size >= 10:
        return "HIGH"

    if size >= 4:
        return "MEDIUM"

    return "LOW"


result["DUPLICATE_RISK"] = result["CLUSTER_SIZE"].apply(
    cluster_risk
)

# ------------------------------------------------------------
# EVIDENCE
# ------------------------------------------------------------

result["EVIDENCE"] = (
    "Multiple works linked by >=90% description similarity "
    "and >=90% amount similarity"
)

# ------------------------------------------------------------
# SAVE
# ------------------------------------------------------------

result = result.sort_values(
    ["DUPLICATE_RISK", "CLUSTER_SIZE"],
    ascending=[True, False]
)

result.to_csv(
    OUTPUT_FILE,
    index=False
)

# ------------------------------------------------------------
# SUMMARY
# ------------------------------------------------------------

print("\n" + "=" * 60)
print("DUPLICATE CLUSTER RESULTS")
print("=" * 60)

print("\nWorks in duplicate graph:", len(result))
print("Duplicate clusters:", result["CLUSTER_ID"].nunique())

print("\nCluster size distribution:")

print(
    result.groupby("CLUSTER_ID")["WORK_ID"]
    .count()
    .describe()
)

print("\nRisk distribution:")

print(
    result["DUPLICATE_RISK"]
    .value_counts()
)

print("\nTOP 20 CLUSTERS")

top_clusters = (
    result.groupby(
        [
            "CLUSTER_ID",
            "STATE",
            "CONSTITUENCY",
            "DUPLICATE_RISK"
        ]
    )
    .agg(
        WORKS=("WORK_ID", "count")
    )
    .reset_index()
    .sort_values(
        "WORKS",
        ascending=False
    )
    .head(20)
)

print(top_clusters.to_string(index=False))

print("\n" + "=" * 60)
print("DUPLICATE CLUSTER ENGINE COMPLETE")
print("=" * 60)

print("\nOutput:")
print(os.path.abspath(OUTPUT_FILE))