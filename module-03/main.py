from fastmcp import FastMCP
import requests
import zipfile
from io import TextIOWrapper
from typing import List, Dict
from minsearch import Index

mcp = FastMCP("Demo 🚀")

# Global index for fastmcp docs (initialized on first search)
_fastmcp_index = None
_fastmcp_docs = None

@mcp.tool
def add(a: int, b: int) -> int:
    """Add two numbers"""
    return a + b

@mcp.tool
def scrape_web(url: str) -> str:
    """
    Scrape web content from any URL and return it in markdown format.
    Uses Jina.ai reader service to convert web pages to clean markdown.
    
    Args:
        url: The URL of the webpage to scrape
        
    Returns:
        The webpage content in markdown format
    """
    jina_url = f"https://r.jina.ai/{url}"
    response = requests.get(jina_url)
    response.raise_for_status()
    return response.text

def _iter_markdown_from_zip(zip_path: str) -> List[Dict[str, str]]:
    """Extract markdown files from fastmcp-main.zip"""
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

def _build_index(docs: List[Dict[str, str]]) -> Index:
    """Build minsearch index from docs"""
    index = Index(
        text_fields=["content"],
        keyword_fields=["filename"],
    )
    index.fit(docs)
    return index

@mcp.tool
def search_fastmcp_docs(query: str) -> str:
    """
    Search the fastmcp documentation for relevant documents.
    Returns the top 5 most relevant file paths.
    
    Args:
        query: The search query (e.g., "mcp server", "authentication")
        
    Returns:
        A newline-separated list of the top 5 matching file paths
    """
    global _fastmcp_index, _fastmcp_docs
    
    # Initialize index on first call
    if _fastmcp_index is None:
        _fastmcp_docs = _iter_markdown_from_zip("fastmcp-main.zip")
        _fastmcp_index = _build_index(_fastmcp_docs)
    
    # Search and return top 5 results
    results = _fastmcp_index.search(query, boost_dict={"content": 1.0})
    top_results = [r['filename'] for r in results[:5]]
    
    return "\n".join(top_results)

if __name__ == "__main__":
    mcp.run()