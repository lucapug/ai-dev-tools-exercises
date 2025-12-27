import requests

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
    # Test the scrape_web function
    test_url = "https://github.com/alexeygrigorev/minsearch"
    print(f"Scraping: {test_url}")
    print("-" * 80)
    
    try:
        content = scrape_web(test_url)
        print(content)
        print("-" * 80)
        print(f"✓ Successfully scraped {len(content)} characters")
    except Exception as e:
        print(f"✗ Error: {e}")
