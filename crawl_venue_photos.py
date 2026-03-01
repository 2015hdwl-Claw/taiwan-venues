#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
場地照片爬蟲 - 爬取官方網站的照片
"""

import requests
from bs4 import BeautifulSoup
import json
import time
from urllib.parse import urljoin, urlparse
import re

class VenuePhotoCrawler:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'zh-TW,zh;q=0.9,en;q=0.8',
            'Accept-Encoding': 'gzip, deflate',
        })
        self.timeout = 15
        
    def crawl_page(self, url):
        """爬取網頁"""
        try:
            print(f"  正在爬取: {url}")
            response = self.session.get(url, timeout=self.timeout)
            response.raise_for_status()
            
            # 等待一下，避免請求太快
            time.sleep(1)
            
            return BeautifulSoup(response.text, 'html.parser')
        except Exception as e:
            print(f"  ❌ 爬取失敗: {e}")
            return None
    
    def extract_images(self, soup, base_url, keywords=None):
        """提取網頁中的照片"""
        if keywords is None:
            keywords = ['會議', '宴會', '廳', 'room', 'hall', 'ballroom', 'meeting', 'conference', 'venue']
        
        images = []
        
        # 找所有圖片標籤
        for img in soup.find_all('img'):
            img_url = img.get('src') or img.get('data-src') or img.get('data-original')
            
            if not img_url:
                continue
            
            # 轉換為完整網址
            if not img_url.startswith('http'):
                img_url = urljoin(base_url, img_url)
            
            # 過濾條件
            # 1. 排除太小的圖片（圖標、按鈕等）
            if any(x in img_url.lower() for x in ['icon', 'logo', 'button', 'arrow', 'close']):
                continue
            
            # 2. 檢查 alt 文字或網址是否包含關鍵字
            alt = img.get('alt', '').lower()
            url_lower = img_url.lower()
            
            is_relevant = False
            for keyword in keywords:
                if keyword.lower() in alt or keyword.lower() in url_lower:
                    is_relevant = True
                    break
            
            # 3. 如果沒有明確關鍵字，但圖片網址看起來像是會議室照片
            if not is_relevant:
                # 檢查是否為常見的照片格式
                if any(ext in img_url.lower() for ext in ['.jpg', '.jpeg', '.png', '.webp']):
                    # 排除明顯不相關的
                    if not any(x in img_url.lower() for x in ['avatar', 'profile', 'banner']):
                        is_relevant = True
            
            if is_relevant:
                images.append({
                    'url': img_url,
                    'alt': img.get('alt', '')
                })
        
        return images
    
    def crawl_ticc(self):
        """爬取台北國際會議中心"""
        print("\n📍 爬取：台北國際會議中心(TICC)")
        print("=" * 80)
        
        # 爬取首頁
        soup = self.crawl_page('https://www.ticc.com.tw')
        if not soup:
            return None
        
        # 提取照片
        images = self.extract_images(soup, 'https://www.ticc.com.tw')
        
        # 嘗試爬取會議室頁面
        soup_rooms = self.crawl_page('https://www.ticc.com.tw/meeting_room.php')
        if soup_rooms:
            images.extend(self.extract_images(soup_rooms, 'https://www.ticc.com.tw'))
        
        # 去重
        seen = set()
        unique_images = []
        for img in images:
            if img['url'] not in seen:
                seen.add(img['url'])
                unique_images.append(img)
        
        print(f"  ✅ 找到 {len(unique_images)} 張照片")
        for i, img in enumerate(unique_images[:5], 1):
            print(f"    {i}. {img['url']}")
            if img['alt']:
                print(f"       Alt: {img['alt']}")
        
        return unique_images

# 測試爬蟲
if __name__ == '__main__':
    crawler = VenuePhotoCrawler()
    
    # 測試爬取台北國際會議中心
    images = crawler.crawl_ticc()
    
    if images:
        print(f"\n✅ 成功爬取 {len(images)} 張照片")
    else:
        print("\n❌ 爬取失敗")
