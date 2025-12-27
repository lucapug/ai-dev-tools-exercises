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
            if "/" in name:
                trimmed = name.split("/", 1)[1]
            else:
                trimmed = name
            try:
                with zf.open(info, "r") as fh:
                    text = TextIOWrapper(fh, encoding="utf-8", errors="ignore").read()
            except Exception:
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

# Test
docs = iter_markdown_from_zip(ZIP_PATH)
index = build_index(docs)

for query in ["mcp server", "authentication", "tools"]:
    results = index.search(query, boost_dict={"content": 1.0})
    top5 = [r['filename'] for r in results[:5]]
    print(f"Query: {query!r}")
    print("\n".join(top5))
    print()
