#!/usr/bin/env python3
"""
活動大師 Phase 1 - 快速照片爬蟲
專注於從官網首頁快速提取主圖片
"""

import json
import re
import time
from pathlib import Path
from urllib.parse import urljoin, urlparse
from datetime import datetime
import requests
from bs4 import BeautifulSoup

# 配置
OUTPUT_DIR = Path("/root/.openclaw/workspace/taiwan-venues/scripts/phase1_tools/output")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'zh-TW,zh;q=0.9,en-US;q=0.8,en;q=0.7'
}

def is_valid_photo_url(url):
    """檢查照片 URL 是否有效"""
    if not url or not url.strip():
        return False
    
    url_lower = url.lower()
    forbidden = [
        'wikipedia', 'unsplash', 'placeholder', 'via.placeholder',
        'picsum.photos'
    ]
    
    if any(f in url_lower for f in forbidden):
        return False
    
    valid_extensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp']
    if not any(url_lower.endswith(ext) for ext in valid_extensions):
        return False
    
    return True

def fetch_page_fast(url, timeout=10):
    """快速獲取頁面"""
    try:
        response = requests.get(url, headers=HEADERS, timeout=timeout, verify=False)
        response.raise_for_status()
        return response.text
    except Exception:
        return None

def extract_main_image(html, base_url):
    """從首頁提取主圖片（優化版）"""
    if not html:
        return None
    
    soup = BeautifulSoup(html, 'html.parser')
    
    # 優先順序：og:image > hero 圖片 > header 圖片
    candidates = []
    
    # 1. og:image
    og_images = soup.select('meta[property="og:image"]')
    if og_images:
        for img in og_images[:1]:
            content = img.get('content')
            if content and is_valid_photo_url(content):
                return content
    
    # 2. Hero 區域圖片
    hero = soup.select_one('[class*="hero"], [class*="banner"], [class*="slide"]')
    if hero:
        hero_images = hero.select_all('img')[:3]
        for img in hero_images:
            src = img.get('src') or img.get('data-src')
            if src:
                if src.startswith('//'):
                    src = 'https:' + src
                elif src.startswith('/'):
                    parsed = urlparse(base_url)
                    src = f"{parsed.scheme}://{parsed.netloc}{src}"
                if is_valid_photo_url(src):
                    return src
    
    # 3. Header 圖片
    header = soup.select_one('header')
    if header:
        header_images = header.select_all('img')[:2]
        for img in header_images:
            src = img.get('src') or img.get('data-src')
            if src:
                if src.startswith('//'):
                    src = 'https:' + src
                elif src.startswith('/'):
                    parsed = urlparse(base_url)
                    src = f"{parsed.scheme}://{parsed.netloc}{src}"
                if is_valid_photo_url(src):
                    return src
    
    return None

