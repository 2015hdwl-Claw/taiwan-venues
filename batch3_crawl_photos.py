#!/usr/bin/env python3
import json, re, requests, time
from urllib.parse import urljoin
from bs4 import BeautifulSoup

with open('./venues-all-cities.json', 'r', encoding='utf-8') as f:
    all_venues = json.load(f)
with open('./batch3-update-list.json', 'r', encoding='utf-8') as f:
    update_list = json.load(f)

venue_map = {v['id']: v for v in all_venues}

def crawl_photos(url, venue_name):
    print(f"  爬取: {url}")
    headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
    try:
        response = requests.get(url, headers=headers, timeout=15)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'html.parser')
        images = []
        for img in soup.find_all('img'):
            src = img.get('src') or img.get('data-src') or img.get('data-lazy-src')
            if src and not src.startswith('data:'):
                full_url = urljoin(url, src)
                if not any(x in full_url.lower() for x in ['logo', 'icon', 'favicon', 'avatar', 'button']):
                    images.append(full_url)
        images = list(dict.fromkeys(images))
        print(f"  找到 {len(images)} 張")
        return images[:10]
    except Exception as e:
        print(f"  ❌ {str(e)[:80]}")
        return []

results = []
for i, item in enumerate(update_list, 1):
    venue_id = item['id']
    venue = venue_map.get(venue_id)
    if not venue:
        continue
    print(f"\n[{i}/{len(update_list)}] [{venue_id}] {venue['name']}")
    url = venue.get('url') or venue.get('meetingPageUrl') or item.get('url')
    if not url:
        continue
    photos = crawl_photos(url, venue['name'])
    if photos:
        results.append({'id': venue_id, 'name': venue['name'], 'url': url, 'photos': photos, 'main': photos[0], 'gallery': photos[1:] if len(photos) > 1 else []})
    time.sleep(0.5)

print(f"\n\n成功: {len(results)}/{len(update_list)}")
with open('./batch3-crawled-photos.json', 'w', encoding='utf-8') as f:
    json.dump(results, f, ensure_ascii=False, indent=2)
