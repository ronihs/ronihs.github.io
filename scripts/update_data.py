"""Fetch GitHub repos and Medium posts into data/*.json for the static site."""
import html
import json
import os
import re
import sys
import urllib.request
import xml.etree.ElementTree as ET
from email.utils import parsedate_to_datetime

GITHUB_USER = "ronihs"
MEDIUM_USER = "ronihalimsaputra"
OUT = os.path.join(os.path.dirname(__file__), "..", "data")
UA = "Mozilla/5.0 (compatible; ronihs.github.io data updater)"


def get(url, headers=None):
    req = urllib.request.Request(url, headers={"User-Agent": UA, **(headers or {})})
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read()


def write(name, data):
    path = os.path.join(OUT, name)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write("\n")
    print(f"wrote {path} ({len(data)} items)")


def update_repos():
    headers = {"Accept": "application/vnd.github+json"}
    if os.environ.get("GITHUB_TOKEN"):
        headers["Authorization"] = "Bearer " + os.environ["GITHUB_TOKEN"]
    repos = json.loads(get(f"https://api.github.com/users/{GITHUB_USER}/repos?per_page=100&sort=updated", headers))
    keep = ["name", "description", "language", "stargazers_count", "html_url", "pushed_at", "fork", "topics"]
    write("repos.json", [{k: r.get(k) for k in keep} for r in repos])


def text_excerpt(raw, limit=160):
    text = re.sub(r"<(figure|figcaption)[^>]*>.*?</\1>", " ", raw or "", flags=re.S)
    text = html.unescape(re.sub(r"<[^>]+>", " ", text))
    text = re.sub(r"\s+", " ", text).strip()
    if len(text) > limit:
        text = re.sub(r"\s\S*$", "", text[:limit]) + "…"
    return text


def update_medium():
    root = ET.fromstring(get(f"https://medium.com/feed/@{MEDIUM_USER}"))
    ns = {"content": "http://purl.org/rss/1.0/modules/content/"}
    posts = []
    for item in root.iter("item"):
        body = item.findtext("content:encoded", default="", namespaces=ns)
        img = re.search(r'<img[^>]+src="([^"]+)"', body)
        link = (item.findtext("link") or "").split("?")[0]
        date = item.findtext("pubDate")
        posts.append({
            "title": item.findtext("title"),
            "link": link,
            "date": parsedate_to_datetime(date).date().isoformat() if date else None,
            "excerpt": text_excerpt(body),
            "image": img.group(1) if img else None,
            "tags": [c.text for c in item.findall("category")],
        })
    write("medium.json", posts)


if __name__ == "__main__":
    failed = False
    for fn in (update_repos, update_medium):
        try:
            fn()
        except Exception as e:  # keep the previous file if a source is down
            print(f"{fn.__name__} failed: {e}", file=sys.stderr)
            failed = True
    sys.exit(1 if failed else 0)
