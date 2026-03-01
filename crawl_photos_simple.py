#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
簡單的照片爬蟲 - 使用 requests + 正則表達式
"""

import requests
import re
import json
import time
from urllib.parse import urljoin

def crawl_images(url, keywords=None):
    """爬取網頁中的圖片"""
    if keywords is None:
        keywords = ['會議', '宴會', '廳', 'room', 'hall', 'ballroom', 'meeting', 'conference', 'venue', 'event']
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'zh-TW,zh;q=0.9,en;q=0.8',
    }
    
    try:
        print(f"正在爬取: {url}")
        response = requests.get(url, headers=headers, timeout=15)
        response.raise_for_status()
        
        # 等待一下
        time.sleep(1)
        
        html = response.text
        
        # 使用正則表達式提取所有圖片標籤
        img_pattern = r'<img[^>]+src=["\']([^"\']+)["\'][^>]*>'
        img_tags = re.findall(img_pattern, html, re.IGNORECASE)
        
        # 也提取 data-src
        data_src_pattern = r'<img[^>]+data-src=["\']([^"\']+)["\'][^>]*>'
        data_src_tags = re.findall(data_src_pattern, html, re.IGNORECASE)
        
        all_images = img_tags + data_src_tags
        
        # 過濾和清理圖片網址
        images = []
        seen = set()
        
        for img_url in all_images:
            # 轉換為完整網址
            if not img_url.startswith('http'):
                img_url = urljoin(url, img_url)
            
            # 去重
            if img_url in seen:
                continue
            seen.add(img_url)
            
            # 過濾條件
            # 1. 排除太小的圖片（圖標、按鈕等）
            if any(x in img_url.lower() for x in ['icon', 'logo', 'button', 'arrow', 'close', 'avatar', 'profile']):
                continue
            
            # 2. 檢查是否為圖片格式
            if not any(ext in img_url.lower() for ext in ['.jpg', '.jpeg', '.png', '.gif', '.webp']):
                continue
            
            # 3. 檢查是否相關（包含關鍵字）
            is_relevant = False
            for keyword in keywords:
                if keyword.lower() in img_url.lower():
                    is_relevant = True
                    break
            
            # 4. 如果沒有明確關鍵字，但看起來像是照片，也保留
            if not is_relevant:
                # 檢查網址路徑是否包含相關詞彙
                if any(x in img_url.lower() for x in ['upload', 'photo', 'image', 'pic', 'gallery']):
                    is_relevant = True
            
            if is_relevant:
                images.append(img_url)
        
        return images
        
    except Exception as e:
        print(f"❌ 爬取失敗: {e}")
        return []

def crawl_venue(venue_name, url):
    """爬取單個場地"""
    print(f"\n{'='*80}")
    print(f"📍 {venue_name}")
    print(f"   官網: {url}")
    print(f"{'='*80}")
    
    images = crawl_images(url)
    
    if images:
        print(f"✅ 找到 {len(images)} 張照片")
        for i, img_url in enumerate(images[:10], 1):
            print(f"   {i}. {img_url}")
        
        if len(images) > 10:
            print(f"   ... 還有 {len(images) - 10} 張")
    else:
        print("❌ 沒有找到相關照片")
    
    return images

# 主程式
if __name__ == '__main__':
    # 10個重要場地
    venues = {
        '台北國際會議中心(TICC)': 'https://www.ticc.com.tw',
        '台北喜來登大飯店': 'https://www.sheraton.com/taipei',
        '台北圓山大飯店': 'https://www.grand-hotel.org',
        '台北文華東方酒店': 'https://www.mandarinoriental.com/taipei',
        '台北國賓大飯店': 'https://www.ambassadorhotel.com.tw/taipei',
        '台北威斯汀六福皇宮': 'https://www.westin.com/taipei',
        '台北寒舍艾美酒店': 'https://www.lemeridien-taipei.com',
        '台北君品酒店': 'https://www.palaisdechine.com',
        '集思台大會議中心': 'https://www.meeting.com.tw',
        '張榮發基金會國際會議中心': 'https://www.klcfoffice.org'
    }
    
    results = {}
    
    for venue_name, url in venues.items():
        images = crawl_venue(venue_name, url)
        results[venue_name] = images
        time.sleep(2)  # 避免請求太快
    
    # 儲存結果
    with open('crawled_photos.json', 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    
    print(f"\n{'='*80}")
    print("✅ 爬取完成，結果已儲存到 crawled_photos.json")
    print(f"{'='*80}")
