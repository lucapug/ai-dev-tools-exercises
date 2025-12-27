import sys
import zipfile
from io import TextIOWrapper
from typing import List, Dict

from minsearch import Index

ZIP_PATH = "fastmcp-main.zip"


def iter_markdown_from_zip(zip_path: str) -> List[Dict[str, str]]:
    docs: List[Dict[str, str]] = []

    with zipfile.ZipFile(zip_path, "r") as zf:
        for info in zf.infolist():
            if info.is_dir():
                continue
            name = info.filename
            lname = name.lower()
            if not (lname.endswith(".md") or lname.endswith(".mdx")):
                continue

            # Remove the first path segment: "fastmcp-main/..." -> "..."
            if "/" in name:
                trimmed = name.split("/", 1)[1]
            else:
                trimmed = name

            try:
                with zf.open(info, "r") as fh:
                    text = TextIOWrapper(fh, encoding="utf-8", errors="ignore").read()
            except Exception:
                # Skip files that fail to read/decode
                continue

            docs.append({
                "filename": trimmed,
                "content": text,
            })

    return docs


def build_index(docs: List[Dict[str, str]]) -> Index:
    index = Index(
        text_fields=["content"],
        keyword_fields=["filename"],
    )
    index.fit(docs)
    return index


def main():
    docs = iter_markdown_from_zip(ZIP_PATH)
    print(f"Indexed {len(docs)} markdown files from {ZIP_PATH}")

    # Optional quick search if a query is provided as an argument
    if len(sys.argv) > 1:
        query = " ".join(sys.argv[1:])
        print(f"\nTop results for query: {query!r}\n")
        index = build_index(docs)
        results = index.search(query, boost_dict={"content": 1.0})
        for r in results[:10]:
            score = r.get("_score")
            if isinstance(score, (int, float)):
                score_str = f"{score:.3f}"
            else:
                score_str = "?"
            print(f"score={score_str} | {r['filename']}")


if __name__ == "__main__":
    main()
