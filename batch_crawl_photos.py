#!/usr/bin/env python3
"""
批量爬取場地官網照片
"""

import json
import re
import requests
from urllib.parse import urljoin, urlparse
from bs4 import BeautifulSoup
import time

# 載入場地資料
with open('./venues-all-cities.json', 'r', encoding='utf-8') as f:
    all_venues = json.load(f)

# 載入需要更新的清單
with open('./batch-update-list.json', 'r', encoding='utf-8') as f:
    update_list = json.load(f)

# 建立場地 ID 對照表
venue_map = {v['id']: v for v in all_venues}

def crawl_photos(url, venue_name):
    """從官網爬取照片"""
    print(f"  正在爬取: {venue_name}")
    print(f"  URL: {url}")
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
    
    try:
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # 尋找所有圖片
        images = []
        
        # 1. 找 <img> 標籤
        for img in soup.find_all('img'):
            src = img.get('src') or img.get('data-src') or img.get('data-lazy-src')
            if src:
                full_url = urljoin(url, src)
                # 過濾掉明顯不是場地照片的圖片
                if not any(x in full_url.lower() for x in ['logo', 'icon', 'favicon', 'avatar', 'button', 'arrow']):
                    images.append(full_url)
        
        # 2. 找背景圖片 (style="background-image: url(...)")
        for element in soup.find_all(style=re.compile(r'background-image')):
            style = element.get('style', '')
            match = re.search(r'url\(["\']?([^"\')\s]+)["\']?\)', style)
            if match:
                bg_url = urljoin(url, match.group(1))
                if not any(x in bg_url.lower() for x in ['logo', 'icon', 'favicon']):
                    images.append(bg_url)
        
        # 去重
        images = list(dict.fromkeys(images))
        
        print(f"  找到 {len(images)} 張圖片")
        return images[:10]  # 最多取 10 張
        
    except Exception as e:
        print(f"  ❌ 錯誤: {e}")
        return []

# 執行批量爬取
results = []
for item in update_list:
    venue_id = item['id']
    venue = venue_map.get(venue_id)
    
    if not venue:
        print(f"找不到場地 ID: {venue_id}")
        continue
    
    print(f"\n[{venue_id}] {venue['name']}")
    
    # 嘗試爬取官網
    url = venue.get('url') or venue.get('meetingPageUrl')
    if not url:
        print(f"  ⚠️ 沒有官網 URL")
        continue
    
    photos = crawl_photos(url, venue['name'])
    
    if photos:
        results.append({
            'id': venue_id,
            'name': venue['name'],
            'url': url,
            'photos': photos,
            'main': photos[0] if photos else None,
            'gallery': photos[1:] if len(photos) > 1 else []
        })
    
    time.sleep(1)  # 避免過度請求

# 輸出結果
print(f"\n\n=== 爬取結果 ===")
print(f"成功: {len(results)} / {len(update_list)}")

with open('./crawled-photos-result.json', 'w', encoding='utf-8') as f:
    json.dump(results, f, ensure_ascii=False, indent=2)

print(f"\n已輸出到 crawled-photos-result.json")

# 顯示結果摘要
for r in results:
    print(f"\n[{r['id']}] {r['name']}")
    print(f"  主照片: {r['main']}")
    print(f"  相簿: {len(r['gallery'])} 張")
