from fastmcp import FastMCP
import requests

mcp = FastMCP("Demo 🚀")

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

if __name__ == "__main__":
    mcp.run()