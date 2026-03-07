#!/usr/bin/env python3
"""
第二批批量爬取場地官網照片
"""

import json
import re
import requests
from urllib.parse import urljoin
from bs4 import BeautifulSoup
import time

# 載入場地資料
with open('./venues-all-cities.json', 'r', encoding='utf-8') as f:
    all_venues = json.load(f)

# 載入第二批更新清單
with open('./batch2-update-list.json', 'r', encoding='utf-8') as f:
    update_list = json.load(f)

venue_map = {v['id']: v for v in all_venues}

def crawl_photos(url, venue_name):
    """從官網爬取照片"""
    print(f"  爬取: {url}")
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
    
    try:
        response = requests.get(url, headers=headers, timeout=15, verify=True)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.text, 'html.parser')
        images = []
        
        # 找 <img> 標籤
        for img in soup.find_all('img'):
            src = img.get('src') or img.get('data-src') or img.get('data-lazy-src')
            if src:
                full_url = urljoin(url, src)
                # 過濾無效圖片
                if not any(x in full_url.lower() for x in ['logo', 'icon', 'favicon', 'avatar', 'button', 'arrow', 'data:']):
                    images.append(full_url)
        
        # 找背景圖片
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
        return images[:10]
        
    except Exception as e:
        print(f"  ❌ 錯誤: {str(e)[:100]}")
        return []

# 執行批量爬取
results = []
success = 0
failed = 0

for i, item in enumerate(update_list, 1):
    venue_id = item['id']
    venue = venue_map.get(venue_id)
    
    if not venue:
        print(f"[{i}/{len(update_list)}] 找不到場地 ID: {venue_id}")
        continue
    
    print(f"\n[{i}/{len(update_list)}] [{venue_id}] {venue['name']}")
    
    url = venue.get('url') or venue.get('meetingPageUrl') or item.get('url')
    if not url:
        print(f"  ⚠️ 沒有官網 URL")
        failed += 1
        continue
    
    photos = crawl_photos(url, venue['name'])
    
    if photos:
        results.append({
            'id': venue_id,
            'name': venue['name'],
            'url': url,
            'photos': photos,
            'main': photos[0],
            'gallery': photos[1:] if len(photos) > 1 else []
        })
        success += 1
    else:
        failed += 1
    
    time.sleep(0.5)  # 避免過度請求

# 輸出結果
print(f"\n\n=== 爬取結果 ===")
print(f"成功: {success}")
print(f"失敗: {failed}")
print(f"成功率: {success/(success+failed)*100:.1f}%")

with open('./batch2-crawled-photos.json', 'w', encoding='utf-8') as f:
    json.dump(results, f, ensure_ascii=False, indent=2)

print(f"\n已輸出到 batch2-crawled-photos.json")
