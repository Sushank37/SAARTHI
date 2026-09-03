import pandas as pd
import os

INPUT_FILE = "../data/duplicate_candidates.csv"

print("=" * 60)
print("MPLADS DUPLICATE CANDIDATE ANALYSIS")
print("=" * 60)

df = pd.read_csv(INPUT_FILE)

print("\nTotal candidate pairs:", len(df))

# ------------------------------------------------------------
# BASIC DISTRIBUTION
# ------------------------------------------------------------

print("\n" + "=" * 60)
print("DUPLICATE LEVEL DISTRIBUTION")
print("=" * 60)

print(df["DUPLICATE_LEVEL"].value_counts())

# ------------------------------------------------------------
# SCORE DISTRIBUTION
# ------------------------------------------------------------

print("\n" + "=" * 60)
print("DUPLICATE SCORE DISTRIBUTION")
print("=" * 60)

print(df["DUPLICATE_SCORE"].describe())

# ------------------------------------------------------------
# TEXT SIMILARITY
# ------------------------------------------------------------

print("\n" + "=" * 60)
print("TEXT SIMILARITY")
print("=" * 60)

print(df["TEXT_SIMILARITY"].describe())

print("\nSimilarity >= 0.90:",
      (df["TEXT_SIMILARITY"] >= 0.90).sum())

print("Similarity >= 0.95:",
      (df["TEXT_SIMILARITY"] >= 0.95).sum())

print("Similarity = 1.00:",
      (df["TEXT_SIMILARITY"] == 1.00).sum())

# ------------------------------------------------------------
# AMOUNT SIMILARITY
# ------------------------------------------------------------

print("\n" + "=" * 60)
print("AMOUNT SIMILARITY")
print("=" * 60)

print(df["AMOUNT_SIMILARITY"].describe())

print("\nAmount similarity >= 0.90:",
      (df["AMOUNT_SIMILARITY"] >= 0.90).sum())

print("Amount similarity >= 0.95:",
      (df["AMOUNT_SIMILARITY"] >= 0.95).sum())

print("Amount similarity = 1.00:",
      (df["AMOUNT_SIMILARITY"] == 1.00).sum())

# ------------------------------------------------------------
# HIGH SIMILARITY + HIGH AMOUNT MATCH
# ------------------------------------------------------------

strong = df[
    (df["TEXT_SIMILARITY"] >= 0.90) &
    (df["AMOUNT_SIMILARITY"] >= 0.90)
]

print("\n" + "=" * 60)
print("STRONG DUPLICATE CANDIDATES")
print("=" * 60)

print("Text >= 90% AND Amount >= 90%:",
      len(strong))

# ------------------------------------------------------------
# SAME STATE / CONSTITUENCY
# ------------------------------------------------------------

print("\n" + "=" * 60)
print("LOCATION ANALYSIS")
print("=" * 60)

print("Candidate states:",
      df["STATE"].nunique())

print("\nTop states:")
print(df["STATE"].value_counts().head(15))

print("\nTop constituencies:")
print(df["CONSTITUENCY"].value_counts().head(15))

# ------------------------------------------------------------
# HIGH RISK EXAMPLES
# ------------------------------------------------------------

print("\n" + "=" * 60)
print("TOP 30 STRONGEST CANDIDATES")
print("=" * 60)

top = df.sort_values(
    ["DUPLICATE_SCORE", "TEXT_SIMILARITY"],
    ascending=False
).head(30)

print(top.to_string(index=False))

# ------------------------------------------------------------
# SAVE STRONG CANDIDATES
# ------------------------------------------------------------

output_file = "../data/strong_duplicate_candidates.csv"

strong.sort_values(
    "DUPLICATE_SCORE",
    ascending=False
).to_csv(output_file, index=False)

print("\n" + "=" * 60)
print("ANALYSIS COMPLETE")
print("=" * 60)

print("Strong candidates saved to:")
print(os.path.abspath(output_file))