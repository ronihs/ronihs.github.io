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
ROOT = os.path.join(os.path.dirname(__file__), "..")
OUT = os.path.join(ROOT, "data")
INDEX = os.path.join(ROOT, "index.html")
AI_KEYWORDS = re.compile(r"(\bai\b|ml|machine|learning|deep|neural|\bnn\b|cnn|rnn|lstm|gan|torch|tensorflow|keras|llm|rag|nlp|vision|spark|classif|predict|regress|cluster|model|data)", re.I)
MONTHS = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli",
          "Agustus", "September", "Oktober", "November", "Desember"]
FOLDER_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>'
ARROW_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17L17 7M8 7h9v9"/></svg>'
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


def esc(value):
    return html.escape(str(value or ""), quote=True)


def inject(kind, cards):
    """Replace the <!-- kind:start --> ... <!-- kind:end --> block in index.html."""
    with open(INDEX, encoding="utf-8") as f:
        page = f.read()
    block = "".join(f"\n        {c}" for c in cards)
    page, n = re.subn(
        rf"<!-- {kind}:start -->.*?<!-- {kind}:end -->",
        lambda m: f"<!-- {kind}:start -->{block}\n        <!-- {kind}:end -->",
        page, flags=re.S)
    if n != 1:
        raise RuntimeError(f"marker for {kind} not found in index.html")
    with open(INDEX, "w", encoding="utf-8") as f:
        f.write(page)


def ai_repos(repos):
    picked = []
    for r in repos:
        if r.get("fork") or r["name"].lower() == f"{GITHUB_USER}.github.io":
            continue
        hay = " ".join([r["name"], r.get("description") or "", r.get("language") or "", " ".join(r.get("topics") or [])])
        if r.get("language") == "Jupyter Notebook" or AI_KEYWORDS.search(hay):
            picked.append(r)
    picked.sort(key=lambda r: r.get("pushed_at") or "", reverse=True)
    picked.sort(key=lambda r: r.get("stargazers_count") or 0, reverse=True)
    return picked[:9]


def repo_card(r):
    lang = f'<span><span class="lang-dot"></span>{esc(r["language"])}</span>' if r.get("language") else ""
    return (f'<a class="project" href="{esc(r["html_url"])}" target="_blank" rel="noopener">'
            f'<div class="project__top">{FOLDER_SVG}{ARROW_SVG}</div>'
            f'<h3>{esc(r["name"])}</h3><p>{esc(r.get("description") or "Belum ada deskripsi.")}</p>'
            f'<div class="project__meta mono">{lang}<span>★ {r.get("stargazers_count") or 0}</span></div></a>')


def post_card(p):
    date = ""
    if p.get("date"):
        y, m, d = (int(x) for x in p["date"].split("-"))
        date = f"{d} {MONTHS[m - 1]} {y}"
    img = f'<img class="post__img" src="{esc(p["image"])}" alt="" loading="lazy" onerror="this.remove()">' if p.get("image") else ""
    return (f'<a class="post" href="{esc(p["link"])}" target="_blank" rel="noopener">{img}'
            f'<span class="post__date mono">{esc(date)}</span>'
            f'<h3>{esc(p["title"])}</h3><p>{esc(p.get("excerpt"))}</p>'
            f'<span class="post__more mono">Baca di Medium →</span></a>')


def render_from_files():
    """Write cards into index.html from whatever data/*.json currently holds."""
    for name, kind, fn in (("repos.json", "projects", lambda d: [repo_card(r) for r in ai_repos(d)]),
                           ("medium.json", "posts", lambda d: [post_card(p) for p in d[:6]])):
        with open(os.path.join(OUT, name), encoding="utf-8") as f:
            inject(kind, fn(json.load(f)))


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
    render_from_files()
    sys.exit(1 if failed else 0)
