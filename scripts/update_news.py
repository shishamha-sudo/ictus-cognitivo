#!/usr/bin/env python3
import datetime as dt
import email.utils
import hashlib
import html
import json
import re
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from pathlib import Path

OUT=Path("v3-preview/news.json")
NOW=dt.datetime.now(dt.timezone.utc)
LOADED=NOW.isoformat()

QUERIES=[
    "stroke cognitive rehabilitation memory",
    "cognitive neuroscience memory attention rehabilitation",
    "ictus rehabilitacion cognitiva memoria neurorehabilitacion",
    "aphasia cognitive rehabilitation stroke",
]
FEEDS=[
    ("Google News", "https://news.google.com/rss/search?q="+urllib.parse.quote(q)+"&hl=en-US&gl=US&ceid=US:en")
    for q in QUERIES[:2]
] + [
    ("Google News", "https://news.google.com/rss/search?q="+urllib.parse.quote(q)+"&hl=es&gl=ES&ceid=ES:es")
    for q in QUERIES[2:]
]

KEYWORDS=[
    "cognit","memory","memoria","attention","atenci","stroke","ictus","rehabilit",
    "neurorehabilit","brain","cerebr","neurosc","aphasia","afasia","executive",
    "working memory","mild cognitive","dement","alzheimer","neuroplastic"
]

def fetch(url):
    req=urllib.request.Request(url,headers={"User-Agent":"ICTUS-Cognitivo-NewsBot/1.0"})
    with urllib.request.urlopen(req,timeout=30) as response:
        return response.read()

def strip_html(value):
    value=html.unescape(value or "")
    value=re.sub(r"<[^>]+>"," ",value)
    return re.sub(r"\s+"," ",value).strip()

def parse_date(value):
    if not value:
        return None
    try:
        date=email.utils.parsedate_to_datetime(value)
        if date.tzinfo is None:
            date=date.replace(tzinfo=dt.timezone.utc)
        return date.astimezone(dt.timezone.utc).isoformat()
    except Exception:
        return None

def tags_for(title,description):
    text=(title+" "+description).lower()
    mapping=[
        ("Ictus",["stroke","ictus"]),
        ("Memoria",["memory","memoria","working memory"]),
        ("Rehabilitación",["rehabilit","neurorehabilit"]),
        ("Neurociencia",["brain","neurosc","cerebr"]),
        ("Atención",["attention","atenci"]),
        ("Lenguaje",["aphasia","afasia"]),
        ("Deterioro cognitivo",["mild cognitive","dement","alzheimer"]),
    ]
    return [label for label,words in mapping if any(word in text for word in words)]

def relevant(title,description):
    text=(title+" "+description).lower()
    return any(keyword in text for keyword in KEYWORDS)

def parse_feed(raw):
    root=ET.fromstring(raw)
    records=[]
    for node in root.findall(".//item"):
        title=strip_html(node.findtext("title"))
        link=strip_html(node.findtext("link"))
        description=strip_html(node.findtext("description"))
        published=parse_date(node.findtext("pubDate"))
        source_node=node.find("source")
        source=strip_html(source_node.text if source_node is not None else "") or "Google News"
        if not title or not link or not relevant(title,description):
            continue
        uid=hashlib.sha256((title+"|"+link).encode("utf-8")).hexdigest()[:20]
        if not description:
            found=tags_for(title,"")
            description="Noticia relacionada con "+(", ".join(found) if found else "cognición y neurorehabilitación")+"."
        records.append({
            "id":uid,
            "source":source,
            "title":title[:320],
            "description":description[:700],
            "url":link,
            "publishedAt":published,
            "loadedAt":LOADED,
            "tags":tags_for(title,description),
        })
    return records

existing=[]
if OUT.exists():
    try:
        existing=json.loads(OUT.read_text(encoding="utf-8")).get("items",[])
    except Exception:
        existing=[]

by_id={item.get("id"):item for item in existing if item.get("id")}
errors=[]

for label,url in FEEDS:
    try:
        for item in parse_feed(fetch(url)):
            old=by_id.get(item["id"])
            if old and old.get("loadedAt"):
                item["loadedAt"]=old["loadedAt"]
            by_id[item["id"]]=item
    except Exception as exc:
        errors.append({"source":label,"error":str(exc)[:250]})

items=list(by_id.values())
items.sort(key=lambda x:(x.get("publishedAt") or "",x.get("loadedAt") or ""),reverse=True)
items=items[:300]

payload={
    "updatedAt":LOADED,
    "items":items,
    "sources":[url for _,url in FEEDS],
    "errors":errors,
}
OUT.parent.mkdir(parents=True,exist_ok=True)
OUT.write_text(json.dumps(payload,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
print("Wrote",len(items),"news items; feed errors:",len(errors))
