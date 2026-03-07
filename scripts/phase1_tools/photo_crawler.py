#!/usr/bin/env python3
"""
活動大師 Phase 1 - 照片爬蟲腳本
從官網自動抓取場地照片
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
    'Accept-Language': 'zh-TW,zh;q=0.9,en-US;q=0.8,en;q=0.7',
}

def is_valid_photo_url(url):
    """檢查照片 URL 是否有效"""
    if not url or not url.strip():
        return False
    
    # 檢查是否為禁止的來源
    forbidden_sources = [
        'wikipedia', 'unsplash', 'placeholder', 
        'via.placeholder', 'picsum.photos'
    ]
    if any(src in url.lower() for src in forbidden_sources):
        return False
    
    # 檢查是否為圖片格式
    valid_extensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp']
    url_lower = url.lower()
    has_image_ext = any(ext in url_lower for ext in valid_extensions)
    
    # 也接受常見的圖片 CDN
    image_cdns = [
        'cloudfront.net', 'cloudinary.com', 'imgix.net',
        'akamaized.net', 'image', '.cdn', 'static'
    ]
    is_cdn = any(cdn in url_lower for cdn in image_cdns)
    
    return has_image_ext or is_cdn

def fetch_page(url, timeout=15):
    """獲取頁面內容"""
    try:
        response = requests.get(url, headers=HEADERS, timeout=timeout, verify=False)
        response.raise_for_status()
        return response.text
    except Exception as e:
        print(f"  ❌ 獲取頁面失敗: {e}")
        return None

def extract_images_from_page(html, base_url):
    """從頁面提取圖片"""
    if not html:
        return []
    
    soup = BeautifulSoup(html, 'html.parser')
    images = []
    
    # 1. 尋找所有 img 標籤
    for img in soup.find_all('img'):
        src = img.get('src') or img.get('data-src') or img.get('data-original')
        if src:
            full_url = urljoin(base_url, src)
            if is_valid_photo_url(full_url):
                images.append(full_url)
    
    # 2. 尋找背景圖片（在 style 屬性中）
    for element in soup.find_all(style=True):
        style = element.get('style', '')
        matches = re.findall(r'url\(["\']?([^"\')]+)["\']?\)', style)
        for match in matches:
            full_url = urljoin(base_url, match)
            if is_valid_photo_url(full_url):
                images.append(full_url)
    
    # 3. 尋找常見的照片庫區域
    photo_selectors = [
        '.gallery img', '.photo-gallery img', '.slider img',
        '.banner img', '.hero img', '.venue-photo img',
        '[class*="photo"] img', '[class*="gallery"] img',
        '[class*="slider"] img', '[class*="banner"] img'
    ]
    for selector in photo_selectors:
        for img in soup.select(selector):
            src = img.get('src') or img.get('data-src') or img.get('data-original')
            if src:
                full_url = urljoin(base_url, src)
                if is_valid_photo_url(full_url):
                    images.append(full_url)
    
    # 去重並保持順序
    seen = set()
    unique_images = []
    for img in images:
        if img not in seen:
            seen.add(img)
            unique_images.append(img)
    
    return unique_images

def find_meeting_room_photos(html, base_url, venue_name):
    """特別尋找會議室相關照片"""
    if not html:
        return []
    
    soup = BeautifulSoup(html, 'html.parser')
    meeting_images = []
    
    # 會議室相關關鍵字
    keywords = ['會議', 'meeting', 'conference', 'banquet', '宴會', 'ballroom', '廳']
    
    # 尋找包含關鍵字的區域
    for keyword in keywords:
        # 檢查 alt 屬性
        for img in soup.find_all('img', alt=re.compile(keyword, re.I)):
            src = img.get('src') or img.get('data-src')
            if src:
                full_url = urljoin(base_url, src)
                if is_valid_photo_url(full_url):
                    meeting_images.append(full_url)
        
        # 檢查標題或類別
        for element in soup.find_all(class_=re.compile(keyword, re.I)):
            for img in element.find_all('img'):
                src = img.get('src') or img.get('data-src')
                if src:
                    full_url = urljoin(base_url, src)
                    if is_valid_photo_url(full_url):
                        meeting_images.append(full_url)
    
    # 去重
    seen = set()
    unique_images = []
    for img in meeting_images:
        if img not in seen:
            seen.add(img)
            unique_images.append(img)
    
    return unique_images

def crawl_venue_photos(venue):
    """爬取單個場地的照片"""
    venue_id = venue.get('id')
    name = venue.get('name', '')
    url = venue.get('url', '')
    
    print(f"\n[{venue_id}] {name}")
    print(f"  URL: {url}")
    
    if not url:
        print(f"  ⚠️  無官網 URL")
        return None
    
    # 檢查 URL 格式
    if not url.startswith(('http://', 'https://')):
        print(f"  ⚠️  URL 格式錯誤")
        return None
    
    # 獲取首頁
    html = fetch_page(url)
    if not html:
        return None
    
    # 提取所有圖片
    all_images = extract_images_from_page(html, url)
    print(f"  📷 找到 {len(all_images)} 張圖片")
    
    # 尋找會議室相關照片
    meeting_images = find_meeting_room_photos(html, url, name)
    if meeting_images:
        print(f"  🏢 找到 {len(meeting_images)} 張會議室相關照片")
    
    # 選擇最佳主照片
    main_photo = None
    gallery = []
    
    # 優先使用會議室照片
    if meeting_images:
        main_photo = meeting_images[0]
        gallery = meeting_images[:5]
    elif all_images:
        # 選擇較大的圖片（通常是主圖）
        main_photo = all_images[0]
        gallery = all_images[:5]
    
    if main_photo:
        print(f"  ✅ 主照片: {main_photo}")
        return {
            'venueId': venue_id,
            'name': name,
            'photoUrl': main_photo,
            'gallery': gallery,
            'totalFound': len(all_images),
            'meetingPhotos': len(meeting_images),
            'source': url,
            'crawledAt': datetime.now().isoformat()
        }
    else:
        print(f"  ❌ 未找到有效照片")
        return {
            'venueId': venue_id,
            'name': name,
            'photoUrl': None,
            'error': '未找到有效照片',
            'crawledAt': datetime.now().isoformat()
        }

def batch_crawl(venues, batch_id=1, delay=2):
    """批次爬取照片"""
    results = []
    
    print(f"\n{'='*60}")
    print(f"批次 {batch_id} - 開始爬取 {len(venues)} 個場地")
    print(f"{'='*60}")
    
    for i, venue in enumerate(venues, 1):
        print(f"\n進度: {i}/{len(venues)}")
        result = crawl_venue_photos(venue)
        if result:
            results.append(result)
        
        # 延遲避免被封鎖
        if i < len(venues):
            time.sleep(delay)
    
    # 保存結果
    output_file = OUTPUT_DIR / f"photo_crawl_batch_{batch_id}.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    
    print(f"\n{'='*60}")
    print(f"批次 {batch_id} 完成")
    print(f"成功: {sum(1 for r in results if r.get('photoUrl'))}")
    print(f"失敗: {sum(1 for r in results if not r.get('photoUrl'))}")
    print(f"結果已保存到: {output_file}")
    print(f"{'='*60}")
    
    return results

def main():
    """測試第一批"""
    # 載入分析結果
    analysis_file = OUTPUT_DIR / "venue_analysis.json"
    with open(analysis_file, 'r', encoding='utf-8') as f:
        analysis = json.load(f)
    
    # 獲取第一批場地
    batch_1 = analysis['batches'][0]
    venues = batch_1['venues']
    
    print(f"準備爬取第一批: {len(venues)} 個場地")
    print(f"預計時間: {len(venues) * 3} 秒")
    
    # 開始爬取
    results = batch_crawl(venues, batch_id=1, delay=2)
    
    return results

if __name__ == '__main__':
    import urllib3
    urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
    main()
