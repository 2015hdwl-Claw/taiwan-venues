#!/usr/bin/env python3
"""
活動大師 Phase 1 - 會議室 URL 搜尋腳本
使用搜尋 API 找正確的會議室頁面
"""

import json
import re
import time
from pathlib import Path
from urllib.parse import urljoin, urlparse, quote_plus
from datetime import datetime
import requests
from bs4 import BeautifulSoup

# 配置
OUTPUT_DIR = Path("/root/.openclaw/workspace/taiwan-venues/scripts/phase1_tools/output")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# Google Custom Search API（使用搜尋引擎）
# 這裡使用 DuckDuckGo 或直接搜尋官網

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'zh-TW,zh;q=0.9,en-US;q=0.8,en;q=0.7'
}

def search_venue_list_url_duckduckgo(venue_name, site_url, max_results=5):
    """使用 DuckDuckGo 搜尋會議室頁面"""
    query = f'site:{urlparse(site_url).netloc} 會議 會議室 meeting'
    url = f'https://html.duckduckgo.com/html/?q={quote_plus(query)}'
    
    try:
        response = requests.get(url, headers=HEADERS, timeout=10)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.text, 'html.parser')
        results = []
        
        for link in soup.select('.result__a')[:max_results]:
            href = link.get('href')
            if href and urlparse(site_url).netloc in href:
                # 優先選擇包含會議相關關鍵字的 URL
                if any(k in href.lower() for k in ['meeting', 'conference', '會議', 'venue', 'space', 'room', '活動']):
                    results.append(href)
        
        return results[:3]
    except Exception as e:
        print(f"  ⚠️ DuckDuckGo 搜尋失敗: {e}")
        return []

def search_venue_list_url_direct(base_url, venue_name):
    """直接從官網搜尋會議室頁面"""
    common_paths = [
        '/meeting',
        '/meetings',
        '/meeting-room',
        '/meeting-rooms',
        '/conference',
        '/conference-room',
        '/venue',
        '/venues',
        '/space',
        '/spaces',
        '/event',
        '/events',
        '/function-room',
        '/function-rooms',
        '/宴會',
        '/宴會廳',
        '/會議',
        '/會議室',
        '/會議廳',
        '/活動',
        '/活動場地',
    ]
    
    parsed = urlparse(base_url)
    base_domain = f"{parsed.scheme}://{parsed.netloc}"
    
    valid_urls = []
    
    for path in common_paths:
        test_url = f"{base_domain}{path}"
        try:
            response = requests.head(test_url, headers=HEADERS, timeout=5, verify=False, allow_redirects=True)
            if response.status_code == 200:
                valid_urls.append({
                    'url': test_url,
                    'status': response.status_code
                })
                if len(valid_urls) >= 3:
                    break
        except Exception:
            continue
    
    return valid_urls

def extract_venue_list_from_page(html, url):
    """從頁面提取會議室清單資訊"""
    if not html:
        return None
    
    soup = BeautifulSoup(html, 'html.parser')
    
    # 檢查頁面是否包含會議室相關內容
    page_text = soup.get_text().lower()
    
    keywords = ['會議', 'meeting', 'conference', '場地', 'venue', '廳', '室', '空間']
    keyword_count = sum(1 for k in keywords if k in page_text)
    
    if keyword_count < 3:
        return None
    
    # 提取會議室名稱
    room_names = []
    
    # 常見的會議室名稱模式
    patterns = [
        r'(\w+廳)',
        r'(\w+室)',
        r'(\w+會議室)',
        r'(Room\s+\w+)',
        r'(Meeting\s+Room\s+\w+)',
    ]
    
    for pattern in patterns:
        matches = re.findall(pattern, soup.get_text())
        room_names.extend(matches)
    
    return {
        'url': url,
        'room_count_estimate': len(set(room_names)),
        'room_names': list(set(room_names))[:10],
        'relevance_score': keyword_count
    }

def find_venue_list_url(venue):
    """為單個場地尋找會議室 URL"""
    venue_id = venue.get('id')
    venue_name = venue.get('name', '')
    site_url = venue.get('url', '')
    
    if not site_url:
        return {
            'venueId': venue_id,
            'name': venue_name,
            'venueListUrl': None,
            'error': '沒有官網 URL'
        }
    
    print(f"\n🔍 搜尋: {venue_name}")
    print(f"   官網: {site_url}")
    
    # 方法 1: 直接嘗試常見路徑
    print("   方法 1: 測試常見路徑...")
    direct_results = search_venue_list_url_direct(site_url, venue_name)
    
    if direct_results:
        # 選擇最佳候選 URL
        for result in direct_results:
            url = result['url']
            # 獲取頁面內容驗證
            try:
                response = requests.get(url, headers=HEADERS, timeout=10, verify=False)
                if response.status_code == 200:
                    page_info = extract_venue_list_from_page(response.text, url)
                    if page_info and page_info['relevance_score'] >= 3:
                        print(f"   ✅ 找到有效 URL: {url}")
                        return {
                            'venueId': venue_id,
                            'name': venue_name,
                            'venueListUrl': url,
                            'method': 'direct_path',
                            'page_info': page_info
                        }
            except Exception:
                continue
    
    # 方法 2: DuckDuckGo 搜尋
    print("   方法 2: DuckDuckGo 搜尋...")
    search_results = search_venue_list_url_duckduckgo(venue_name, site_url)
    
    if search_results:
        for url in search_results:
                try:
                    response = requests.get(url, headers=HEADERS, timeout=10, verify=False)
                    if response.status_code == 200:
                        page_info = extract_venue_list_from_page(response.text, url)
                        if page_info and page_info['relevance_score'] >= 3:
                            print(f"   ✅ 找到有效 URL: {url}")
                            return {
                                'venueId': venue_id,
                                'name': venue_name,
                                'venueListUrl': url,
                                'method': 'search',
                                'page_info': page_info
                            }
                except Exception:
                    continue
    
    print(f"   ❌ 未找到有效會議室 URL")
    return {
        'venueId': venue_id,
        'name': venue_name,
        'venueListUrl': None,
        'error': '無法找到有效的會議室頁面'
    }

def process_batch(batch_id, venues):
    """處理一批場地"""
    print(f"\n{'='*60}")
    print(f"批次 {batch_id} - 搜尋會議室 URL")
    print(f"{'='*60}")
    
    results = []
    
    for i, venue in enumerate(venues, 1):
        print(f"\n[{i}/{len(venues)}] ", end='')
        result = find_venue_list_url(venue)
        results.append(result)
        
        # 避免被封鎖
        time.sleep(2)
    
    # 保存結果
    output_file = OUTPUT_DIR / f"venue_url_batch_{batch_id}.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    
    print(f"\n{'='*60}")
    print(f"批次 {batch_id} 完成")
    print(f"成功: {sum(1 for r in results if r.get('venueListUrl'))}")
    print(f"失敗: {sum(1 for r in results if not r.get('venueListUrl'))}")
    print(f"結果保存到: {output_file}")
    
    return results

