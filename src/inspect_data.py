import pandas as pd
from pathlib import Path

DATA_DIR = Path(__file__).resolve().parent.parent / "data"

files = {
    "Recommended": DATA_DIR / "works_recommended.csv",
    "Sanctioned": DATA_DIR / "works_sanctioned.csv",
    "Completed": DATA_DIR / "works_completed.csv",
}

for name, path in files.items():
    print("\n" + "=" * 60)
    print(f"{name.upper()}")
    print("=" * 60)

    df = pd.read_csv(path)

    print(f"Rows    : {len(df):,}")
    print(f"Columns : {len(df.columns)}")

    print("\nColumns:")
    for column in df.columns:
        print(f"  - {column}")

    print("\nFirst 3 records:")
    print(df.head(3).to_string(index=False))
