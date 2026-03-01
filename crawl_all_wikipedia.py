#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
批量從維基百科提取照片
"""

import requests
import re
import json
import time
from urllib.parse import unquote

def get_wikipedia_image_url(file_page_url):
    """從維基百科檔案頁面提取原始圖片網址"""
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }

    try:
        response = requests.get(file_page_url, headers=headers, timeout=10)
        html = response.text

        # 尋找原始檔案連結
        pattern = r'href="(//upload\.wikimedia\.org/wikipedia/commons/[^"]+)"'
        matches = re.findall(pattern, html)

        if matches:
            img_url = matches[0]
            if img_url.startswith('//'):
                img_url = 'https:' + img_url
            return img_url

        return None
    except Exception as e:
        return None

def extract_wikipedia_photos(wiki_url, venue_name):
    """從維基百科頁面提取所有照片"""
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }

    try:
        print(f"\n{'='*80}")
        print(f"📍 {venue_name}")
        print(f"{'='*80}")
        print(f"正在爬取: {wiki_url}")

        response = requests.get(wiki_url, headers=headers, timeout=15)
        html = response.text

        # 提取所有檔案連結
        pattern = r'/wiki/File:([^"]+)"'
        file_names = re.findall(pattern, html)

        # 去重
        file_names = list(set(file_names))

        print(f"  找到 {len(file_names)} 個檔案")

        images = []
        for file_name in file_names[:15]:  # 處理前15個
            file_name = unquote(file_name)

            # 過濾不相關的檔案
            if any(x in file_name.lower() for x in ['logo', 'icon', 'symbol', 'emblem']):
                continue

            # 只保留圖片格式
            if not any(ext in file_name.lower() for ext in ['.jpg', '.jpeg', '.png', '.gif']):
                continue

            file_url = f"https://zh.wikipedia.org/wiki/File:{file_name}"

            img_url = get_wikipedia_image_url(file_url)

            if img_url:
                images.append({
                    'file_name': file_name,
                    'image_url': img_url
                })
                print(f"  ✅ {file_name[:50]}")

            time.sleep(0.3)

        return images

    except Exception as e:
        print(f"  ❌ 爬取失敗: {e}")
        return []

# 主程式
if __name__ == '__main__':
    # 7個場地
    venues = {
        '台北喜來登大飯店': 'https://zh.wikipedia.org/wiki/台北喜來登大飯店',
        '台北圓山大飯店': 'https://zh.wikipedia.org/wiki/圓山大飯店',
        '台北文華東方酒店': 'https://zh.wikipedia.org/wiki/台北文華東方酒店',
        '台北國賓大飯店': 'https://zh.wikipedia.org/wiki/台北國賓大飯店',
        '台北威斯汀六福皇宮': 'https://zh.wikipedia.org/wiki/六福皇宮',
        '台北寒舍艾美酒店': 'https://zh.wikipedia.org/wiki/台北寒舍艾美酒店',
        '台北君品酒店': 'https://zh.wikipedia.org/wiki/君品酒店'
    }

    all_results = {}

    for venue_name, wiki_url in venues.items():
        images = extract_wikipedia_photos(wiki_url, venue_name)
        all_results[venue_name] = images
        time.sleep(2)  # 避免請求太快

    # 儲存結果
    with open('all_venues_wikipedia_photos.json', 'w', encoding='utf-8') as f:
        json.dump(all_results, f, ensure_ascii=False, indent=2)

    print(f"\n{'='*80}")
    print("✅ 爬取完成")
    print(f"{'='*80}")
    print(f"結果已儲存到 all_venues_wikipedia_photos.json")

    # 統計
    for venue_name, images in all_results.items():
        print(f"  {venue_name}: {len(images)} 張照片")
