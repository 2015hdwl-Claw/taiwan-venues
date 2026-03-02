#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
批次 6 場地驗證 - SOP V4.5 Phase 3 會議室數量檢查
驗證日期: 2026-03-03
"""

import requests
from bs4 import BeautifulSoup
import json
import re
from datetime import datetime

# 批次 6 場地列表
VENUES = [
    {"id": 1099, "name": "台北艾美酒店", "venueListUrl": "https://le-meridien.marriott.com/programmes/meetings-and-events/", "website": None},
    {"id": 1100, "name": "台北花園大酒店", "venueListUrl": "https://www.taipeigarden.com.tw/banquets-conferences/meeting-package/", "website": None},
    {"id": 1101, "name": "台北華國大飯店", "venueListUrl": None, "website": "https://www.imperialhotel.com.tw"},
    {"id": 1102, "name": "台北華泰瑞舍", "venueListUrl": None, "website": None},
    {"id": 1103, "name": "台北萬豪酒店", "venueListUrl": "https://www.taipeimarriott.com.tw/websev?cat=page&subcat=17", "website": None},
    {"id": 1105, "name": "台北陽明山中國麗緻大飯店", "venueListUrl": None, "website": None},
    {"id": 1106, "name": "台北香格里拉遠東國際大飯店", "venueListUrl": None, "website": "https://www.shangri-la.com/taipei"},
    {"id": 1107, "name": "台北體育館", "venueListUrl": "https://vbs.sports.taipei/venues/?G=3", "website": None},
    {"id": 1108, "name": "台大校友會館", "venueListUrl": None, "website": "https://www.ntualumni.org.tw"},
    {"id": 1109, "name": "台大綜合體育館", "venueListUrl": "https://event.ntu.edu.tw/azalea/2026/", "website": None},
]

class VenueVerifier:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'zh-TW,zh;q=0.9,en;q=0.8',
        })
    
    def get_soup(self, url):
        """取得網頁 HTML"""
        try:
            response = self.session.get(url, timeout=15)
            response.raise_for_status()
            return BeautifulSoup(response.text, 'html.parser'), response.status_code
        except Exception as e:
            print(f"❌ 無法訪問 {url}: {e}")
            return None, None
    
    def extract_room_names(self, soup):
        """提取會議室名稱"""
        room_names = []
        
        # 方法 1: 尋找包含會議室/廳的標題
        for tag in soup.find_all(['h1', 'h2', 'h3', 'h4', 'h5']):
            text = tag.get_text(strip=True)
            if re.search(r'(廳|室|場|房|館|ballroom|room|hall|suite)', text, re.I):
                # 過濾太長或太短的文字
                if 2 <= len(text) <= 30:
                    room_names.append(text)
        
        # 方法 2: 尋找 class 包含 room/ballroom/hall 的元素
        for tag in soup.find_all(class_=re.compile(r'(room|ballroom|hall|venue|meeting)', re.I)):
            text = tag.get_text(strip=True)
            if text and 2 <= len(text) <= 30:
                room_names.append(text)
        
        # 去重
        room_names = list(dict.fromkeys(room_names))
        
        return room_names
    
    def verify_venue(self, venue):
        """驗證單一場地"""
        result = {
            "id": venue["id"],
            "name": venue["name"],
            "roomsCount": 0,
            "roomNames": [],
            "status": "待修",
            "notes": [],
            "venueListUrl": venue.get("venueListUrl"),
            "website": venue.get("website")
        }
        
        print(f"\n{'='*60}")
        print(f"驗證: {venue['name']} (ID: {venue['id']})")
        print(f"{'='*60}")
        
        # Phase 1: 開啟 venueListUrl 或官網
        url = venue.get("venueListUrl") or venue.get("website")
        
        if not url:
            result["notes"].append("缺少 venueListUrl 和 website")
            result["status"] = "待修"
            print("❌ 缺少 URL")
            return result
        
        print(f"📍 訪問: {url}")
        soup, status_code = self.get_soup(url)
        
        if not soup:
            result["notes"].append(f"無法訪問網站 (HTTP {status_code})")
            result["status"] = "待修"
            return result
        
        print(f"✅ 網站可訪問 (HTTP {status_code})")
        
        # Phase 2: 尋找會議室/宴會廳名稱
        print("\n🔍 尋找會議室名稱...")
        room_names = self.extract_room_names(soup)
        
        if room_names:
            result["roomNames"] = room_names[:10]  # 最多保留 10 個
            result["roomsCount"] = len(room_names)
            print(f"✅ 找到 {len(room_names)} 個會議室/場地:")
            for i, name in enumerate(room_names[:10], 1):
                print(f"  {i}. {name}")
        else:
            result["notes"].append("未找到會議室名稱")
            print("⚠️  未找到會議室名稱")
        
        # Phase 3: 統計會議室總數（⭐ 強制驗證）
        # 如果網頁直接提到數量，使用該數字
        page_text = soup.get_text()
        
        # 搜尋 "X個會議室" 或 "X間會議室" 的模式
        count_patterns = [
            r'(\d+)\s*個\s*(?:多功能)?活動場地',
            r'(\d+)\s*(?:間|個)?會議室',
            r'(\d+)\s*(?:間|個)?宴會廳',
            r'(\d+)\s*meeting\s*rooms?',
            r'(\d+)\s*function\s*rooms?',
            r'(\d+)\s*event\s*spaces?',
        ]
        
        for pattern in count_patterns:
            match = re.search(pattern, page_text, re.I)
            if match:
                count = int(match.group(1))
                if count > result["roomsCount"]:
                    result["roomsCount"] = count
                    print(f"✅ 網頁提到: {count} 個場地")
                    break
        
        # 狀態判定
        if result["roomsCount"] > 0:
            result["status"] = "上架"
        elif result["roomNames"]:
            result["status"] = "待修"
            result["notes"].append("有會議室名稱但數量不明確")
        else:
            result["status"] = "待修"
            result["notes"].append("無法統計會議室數量")
        
        return result
    
    def verify_all(self):
        """驗證所有場地"""
        results = []
        
        for venue in VENUES:
            result = self.verify_venue(venue)
            results.append(result)
        
        return results

def main():
    print("=" * 60)
    print("批次 6 場地驗證 - SOP V4.5 Phase 3")
    print(f"驗證時間: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"場地數量: {len(VENUES)}")
    print("=" * 60)
    
    verifier = VenueVerifier()
    results = verifier.verify_all()
    
    # 輸出總結
    print("\n\n" + "=" * 60)
    print("驗證結果總結")
    print("=" * 60)
    
    for r in results:
        print(f"\nID: {r['id']} | {r['name']}")
        print(f"  roomsCount: {r['roomsCount']}")
        print(f"  roomNames: {', '.join(r['roomNames'][:5]) if r['roomNames'] else '(無)'}")
        print(f"  狀態: {r['status']}")
        print(f"  備註: {'; '.join(r['notes']) if r['notes'] else '(無)'}")
    
    # 統計
    status_count = {}
    for r in results:
        status_count[r['status']] = status_count.get(r['status'], 0) + 1
    
    print(f"\n\n狀態統計:")
    for status, count in status_count.items():
        print(f"  {status}: {count} 個")
    
    # 保存結果
    output_file = f'/root/.openclaw/workspace/taiwan-venues/batch6-verification-results-{datetime.now().strftime("%Y%m%d-%H%M%S")}.json'
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    
    print(f"\n✅ 結果已保存至: {output_file}")

if __name__ == '__main__':
    main()
