#!/usr/bin/env python3
"""Mirror public Substack RSS metadata; never request private posts or credentials."""
import hashlib
import json
from datetime import datetime
from email.utils import parsedate_to_datetime
from html.parser import HTMLParser
from pathlib import Path
from urllib.request import Request, urlopen
import xml.etree.ElementTree as ET

FEED = "https://moreshwarpidadi.substack.com/feed"
DEST = Path(__file__).resolve().parents[1] / "substack-posts.json"

class TextOnly(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.parts = []
    def handle_data(self, data):
        self.parts.append(data)

def plain(html):
    parser = TextOnly()
    parser.feed(html or "")
    return " ".join(" ".join(parser.parts).split())

def child_text(item, name):
    child = item.find(name)
    return (child.text or "").strip() if child is not None else ""

def iso_date(value):
    try:
        return parsedate_to_datetime(value).date().isoformat()
    except (ValueError, TypeError, IndexError):
        return ""

def main():
    request = Request(FEED, headers={
        "User-Agent": "Mozilla/5.0 (compatible; Moreshwar-Lab/1.0)",
        "Accept": "application/rss+xml,application/xml,text/xml,*/*",
    })
    with urlopen(request, timeout=40) as response:
        xml = response.read(5_000_000)
    root = ET.fromstring(xml)
    items = root.findall("./channel/item")
    if not items:
        raise ValueError("RSS feed returned no published items; keeping previous archive unchanged.")
    articles = []
    for item in items[:100]:
        title = plain(child_text(item, "title"))
        url = child_text(item, "link")
        if not title or not url.startswith("https://moreshwarpidadi.substack.com/p/"):
            continue
        excerpt = plain(child_text(item, "description"))
        if not excerpt:
            excerpt = plain(child_text(item, "{http://purl.org/rss/1.0/modules/content/}encoded"))
        if len(excerpt) > 280:
            excerpt = excerpt[:277].rsplit(" ", 1)[0] + "…"
        articles.append({
            "id": "substack-" + hashlib.sha256(url.encode("utf-8")).hexdigest()[:16],
            "title": title,
            "date": iso_date(child_text(item, "pubDate")),
            "excerpt": excerpt or "Read the full article on Substack.",
            "category": "Substack",
            "url": url,
            "source": "Substack",
        })
    if not articles:
        raise ValueError("No valid public Substack articles were found; archive left unchanged.")
    articles.sort(key=lambda item: item["date"], reverse=True)
    payload = {"source": FEED, "count": len(articles), "posts": articles}
    DEST.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("Synchronized", len(articles), "public Substack articles.")

if __name__ == "__main__":
    main()
