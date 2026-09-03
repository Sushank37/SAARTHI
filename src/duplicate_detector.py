import pandas as pd
import re
from pathlib import Path
from collections import Counter

# ============================================================
# MPLADS FAST DUPLICATE DETECTION ENGINE
# ============================================================

BASE_DIR = Path(__file__).resolve().parent.parent

INPUT_FILE = BASE_DIR / "data" / "risk_scored_works.csv"
OUTPUT_FILE = BASE_DIR / "data" / "duplicate_candidates.csv"

print("=" * 60)
print("MPLADS FAST DUPLICATE DETECTION ENGINE")
print("=" * 60)

# ------------------------------------------------------------
# LOAD DATA
# ------------------------------------------------------------

df = pd.read_csv(
    INPUT_FILE,
    low_memory=False
)

print("\nLoaded rows:", len(df))

# ------------------------------------------------------------
# NORMALIZE TEXT
# ------------------------------------------------------------

def normalize_text(text):

    if pd.isna(text):
        return ""

    text = str(text).lower()

    text = re.sub(
        r"[^a-z0-9\s]",
        " ",
        text
    )

    text = re.sub(
        r"\s+",
        " ",
        text
    )

    return text.strip()


df["NORMALIZED_DESCRIPTION"] = (
    df["WORK_DESCRIPTION"]
    .apply(normalize_text)
)

# ------------------------------------------------------------
# EXACT DUPLICATES
# ------------------------------------------------------------

df["DESCRIPTION_DUPLICATE_COUNT"] = (
    df.groupby(
        "NORMALIZED_DESCRIPTION"
    )["NORMALIZED_DESCRIPTION"]
    .transform("count")
)

df["EXACT_DUPLICATE"] = (
    df["DESCRIPTION_DUPLICATE_COUNT"] > 1
)

print(
    "Exact duplicate rows:",
    df["EXACT_DUPLICATE"].sum()
)

# ------------------------------------------------------------
# TOKEN SET
# ------------------------------------------------------------

STOPWORDS = {
    "the",
    "and",
    "of",
    "at",
    "in",
    "for",
    "to",
    "with",
    "from",
    "on",
    "near",
    "work",
    "construction",
    "constructionof"
}


def get_tokens(text):

    tokens = set(text.split())

    tokens = {
        t
        for t in tokens
        if len(t) >= 3
        and t not in STOPWORDS
    }

    return tokens


df["TOKENS"] = (
    df["NORMALIZED_DESCRIPTION"]
    .apply(get_tokens)
)

# ------------------------------------------------------------
# FAST JACCARD SIMILARITY
# ------------------------------------------------------------

def jaccard_similarity(a, b):

    if not a or not b:
        return 0.0

    intersection = len(a & b)

    union = len(a | b)

    if union == 0:
        return 0.0

    return intersection / union


# ------------------------------------------------------------
# CANDIDATE GENERATION
# ------------------------------------------------------------

candidate_rows = []

group_columns = [
    "STATE_NAME",
    "CONSTITUENCY",
    "WORK_CATEGORY"
]

groups = df.groupby(group_columns)

print(
    "Candidate groups:",
    len(groups)
)

# ------------------------------------------------------------
# PROCESS GROUPS
# ------------------------------------------------------------

processed = 0

for group_key, group in groups:

    if len(group) < 2:
        continue

    records = group.to_dict("records")

    # --------------------------------------------------------
    # Create inverted index
    #
    # token -> records containing that token
    # --------------------------------------------------------

    token_index = {}

    for idx, record in enumerate(records):

        for token in record["TOKENS"]:

            token_index.setdefault(
                token,
                set()
            ).add(idx)

    # --------------------------------------------------------
    # Generate candidates using shared tokens
    # --------------------------------------------------------

    candidate_pairs = set()

    for idx, record in enumerate(records):

        related = set()

        for token in record["TOKENS"]:

            related.update(
                token_index.get(
                    token,
                    set()
                )
            )

        related.discard(idx)

        for other_idx in related:

            if other_idx > idx:

                candidate_pairs.add(
                    (idx, other_idx)
                )

    # --------------------------------------------------------
    # Compare candidates
    # --------------------------------------------------------

    for i, j in candidate_pairs:

        a = records[i]
        b = records[j]

        tokens_a = a["TOKENS"]
        tokens_b = b["TOKENS"]

        similarity = jaccard_similarity(
            tokens_a,
            tokens_b
        )

        # Ignore weak similarities
        if similarity < 0.50:
            continue

        # ----------------------------------------------------
        # Amount similarity
        # ----------------------------------------------------

        amount_a = a.get(
            "SANCTION_AMOUNT"
        )

        amount_b = b.get(
            "SANCTION_AMOUNT"
        )

        amount_similarity = 0.0

        if (
            pd.notna(amount_a)
            and pd.notna(amount_b)
            and max(
                abs(amount_a),
                abs(amount_b)
            ) > 0
        ):

            amount_similarity = (
                1
                -
                abs(
                    amount_a - amount_b
                )
                /
                max(
                    abs(amount_a),
                    abs(amount_b)
                )
            )

            amount_similarity = max(
                0,
                amount_similarity
            )

        # ----------------------------------------------------
        # Duplicate score
        # ----------------------------------------------------

        score = (
            similarity * 0.70
            +
            amount_similarity * 0.30
        )

        if score >= 0.85:

            level = "HIGH"

        elif score >= 0.70:

            level = "MEDIUM"

        else:

            level = "LOW"

        candidate_rows.append({

            "WORK_ID_A":
                a[
                    "WORK_RECOMMENDATION_DTL_ID"
                ],

            "WORK_ID_B":
                b[
                    "WORK_RECOMMENDATION_DTL_ID"
                ],

            "STATE":
                a["STATE_NAME"],

            "CONSTITUENCY":
                a["CONSTITUENCY"],

            "CATEGORY":
                a["WORK_CATEGORY"],

            "DESCRIPTION_A":
                a["WORK_DESCRIPTION"],

            "DESCRIPTION_B":
                b["WORK_DESCRIPTION"],

            "SANCTION_AMOUNT_A":
                amount_a,

            "SANCTION_AMOUNT_B":
                amount_b,

            "TEXT_SIMILARITY":
                round(
                    similarity,
                    4
                ),

            "AMOUNT_SIMILARITY":
                round(
                    amount_similarity,
                    4
                ),

            "DUPLICATE_SCORE":
                round(
                    score * 100,
                    2
                ),

            "DUPLICATE_LEVEL":
                level
        })

    processed += 1

    if processed % 100 == 0:

        print(
            "Processed groups:",
            processed,
            "/",
            len(groups)
        )

# ------------------------------------------------------------
# OUTPUT
# ------------------------------------------------------------

result = pd.DataFrame(
    candidate_rows
)

if len(result) > 0:

    result = result.sort_values(
        "DUPLICATE_SCORE",
        ascending=False
    )

result.to_csv(
    OUTPUT_FILE,
    index=False
)

# ------------------------------------------------------------
# RESULTS
# ------------------------------------------------------------

print("\n" + "=" * 60)
print("DUPLICATE DETECTION RESULTS")
print("=" * 60)

print(
    "Candidate pairs:",
    len(result)
)

if len(result) > 0:

    print("\nDUPLICATE LEVEL")

    print(
        result[
            "DUPLICATE_LEVEL"
        ]
        .value_counts()
        .to_string()
    )

    print("\nTOP 20 CANDIDATES")

    print(
        result[
            [
                "WORK_ID_A",
                "WORK_ID_B",
                "STATE",
                "CONSTITUENCY",
                "TEXT_SIMILARITY",
                "AMOUNT_SIMILARITY",
                "DUPLICATE_SCORE",
                "DUPLICATE_LEVEL"
            ]
        ]
        .head(20)
        .to_string(index=False)
    )

print("\nOutput:")
print(OUTPUT_FILE)

print("\n" + "=" * 60)
print("FAST DUPLICATE ENGINE COMPLETE")
print("=" * 60)