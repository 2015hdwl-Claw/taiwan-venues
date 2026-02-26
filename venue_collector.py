#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
高效場地資料爬蟲 - 2小時衝刺版（已更新）
收集場地實景照片、座位配置圖、交通資訊
"""

import requests
import re
import json
import time
from datetime import datetime
from urllib.parse import urljoin

class VenueDataCollector:
    def __init__(self):
        self.user_agent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': self.user_agent,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        })
        self.collected_data = []
        self.website_list = []

    def crawl_website(self, url):
        """爬取網站並提取資訊"""
        try:
            response = self.session.get(url, timeout=15, allow_redirects=True)
            response.raise_for_status()
            return response.text
        except Exception as e:
            print(f"   ❌ 爬取失敗：{url}")
            print(f"      錯誤：{e}")
            return None

    def extract_images(self, html, url):
        """提取圖片 URL"""
        images = []

        # 方法 1: 從 HTML 標籤提取
        img_patterns = [
            r'<img[^>]+src=["\']([^"\']+)["\']',
            r'<img[^>]+data-src=["\']([^"\']+)["\']',
        ]

        for pattern in img_patterns:
            matches = re.findall(pattern, html, re.IGNORECASE)
            for match in matches[:5]:  # 限制最多 5 張
                img_url = match
                # 處理相對路徑
                if not img_url.startswith('http'):
                    img_url = urljoin(url, img_url)

                # 篩選照片類型
                if any(kw in img_url.lower() or kw in img_url.lower() for kw in ['photo', 'image', 'img', 'photo', 'jpg', 'jpeg', 'png', 'show', 'hall', 'room']):
                    if img_url not in [i['url'] for i in images]:
                        images.append({'url': img_url, 'type': 'photo'})

        return images[:3]  # 限制 3 張

    def extract_traffic_info(self, html):
        """提取交通資訊"""
        traffic = {
            'metroStation': None,
            'busStation': None,
            'parkingInfo': None,
            'parkingFee': None
        }

        # 提取捷運站
        metro_pattern = r'(台北[市政府|信義|中正|大安|中山|大同|松山|文山|南港|内湖|士林|北投|基隆|板橋|新莊|三重|中和|永和|汐止|瑞芳|樹林|鶯歌|三峽|深坑|石碇|坪林|烏來|平溪|雙溪|貢寮|金瓜石|九份|瑞芳站|東門站|忠孝新生站|忠孝復興站|忠孝敦化站|忠孝瑞明站|信義安和站|市政府站|國父紀念館站|台北車站位)'
        metro_matches = re.findall(metro_pattern, html)
        if metro_matches:
            traffic['metroStation'] = metro_matches[0]

        # 提取公車站
        bus_pattern = r'(站\s*[:：]\s*([^\n,，]+)|公車站\s*[:：]\s*([^\n,，]+))'
        bus_matches = re.findall(bus_pattern, html)
        if bus_matches:
            bus_text = bus_matches[0][1] if bus_matches[0][1] else bus_matches[0][2]
            traffic['busStation'] = bus_text.strip()

        # 提取停車資訊
        parking_patterns = [
            r'停車場\s*[:：]\s*([^\n,，]+)',
            r'停車\s*[:：]\s*([^\n,，]+)',
            r'停車費\s*[:：]\s*([^\n,，]+)',
            r'(停車\d+元)',
        ]

        for pattern in parking_patterns:
            matches = re.findall(pattern, html)
            for match in matches[:2]:
                if isinstance(match, tuple):
                    info_text = match[0]
                else:
                    info_text = str(match)

                if '停車' in info_text or '元' in info_text:
                    traffic['parkingInfo'] = info_text
                    break

        # 提取停車費用數字
        fee_pattern = r'(\d+)\s*元'
        fee_matches = re.findall(fee_pattern, html)
        if fee_matches:
            traffic['parkingFee'] = int(fee_matches[0])

        return traffic

    def extract_layout_and_size(self, html):
        """提取場地佈局和尺寸"""
        layout_info = {
            'venueLayout': None,
            'dimensions': None
        }

        # 提取佈局類型
        layout_patterns = [
            (r'(劇院型|theater| theater)', '劇院型'),
            (r'(會議型|classroom| classroom)', '會議型'),
            (r'(馬蹄型|horseshoe| horseshoe)', '馬蹄型'),
            (r'(宴會型|banquet| banquet)', '宴會型'),
            (r'(U型|U-Shape| U-Shape)', 'U型'),
            (r'(圓型|round| round)', '圓型'),
        ]

        for pattern, layout_name in layout_patterns:
            if re.search(pattern, html):
                layout_info['venueLayout'] = layout_name
                break

        # 提取尺寸
        size_patterns = [
            r'(\d+\.?\d*)\s*[x×]\s*(\d+\.?\d*)',
            r'(\d+\.?\d*)\s*[x×]\s*(\d+\.?\d*)\s*公尺',
            r'長\s*(\d+\.?\d*)\s*公尺',
            r'寬\s*(\d+\.?\d*)\s*公尺',
            r'面積\s*(\d+\.?\d*)\s*平方公尺',
        ]

        for pattern in size_patterns:
            matches = re.findall(pattern, html)
            if matches:
                dim = matches[0]
                if isinstance(dim, tuple) and len(dim) >= 2:
                    layout_info['dimensions'] = {
                        'length': float(dim[0]),
                        'width': float(dim[1]) if len(dim) > 1 else None
                    }
                break

        return layout_info

    def collect_venue_data(self, venue_id, name, website, city):
        """收集單一場地資訊"""
        print(f"\n{'='*60}")
        print(f"🔍 收集場地：{name}")
        print(f"🌐 網址：{website}")
        print(f"📍 城市：{city}")
        print(f"{'='*60}")

        html = self.crawl_website(website)
        if not html:
            return None

        # 提取資訊
        images = self.extract_images(html, website)
        traffic_info = self.extract_traffic_info(html)
        layout_info = self.extract_layout_and_size(html)

        result = {
            'id': venue_id,
            'name': name,
            'url': website,
            'city': city,
            'images': [img['url'] for img in images],
            'layoutImageUrl': images[0]['url'] if images else None,
            'trafficInfo': traffic_info,
            'venueLayout': layout_info['venueLayout'],
            'dimensions': layout_info['dimensions']
        }

        # 顯示結果
        print(f"\n   ✅ 收集完成")
        print(f"      圖片：{len(images)} 張")
        print(f"      捷運：{traffic_info['metroStation']}")
        print(f"      公車：{traffic_info['busStation']}")
        print(f"      停車：{traffic_info['parkingInfo']}")
        print(f"      佈局：{result['venueLayout']}")
        print(f"      尺寸：{result['dimensions']}")

        self.collected_data.append(result)
        self.website_list.append(result)

        return result

    def process_all_venues(self, venues_list):
        """處理所有場地"""
        print(f"\n{'='*60}")
        print(f"🚀 開始處理 {len(venues_list)} 個場地")
        print(f"{'='*60}")

        for venue in venues_list:
            result = self.collect_venue_data(
                venue.get('id'),
                venue.get('name'),
                venue.get('website'),
                venue.get('city')
            )

            if result:
                print(f"\n   💾 已加入收集列表")
                time.sleep(2)  # 避免過度請求

        print(f"\n{'='*60}")
        print(f"📊 收集統計")
        print(f"{'='*60}")
        print(f"成功收集：{len(self.collected_data)} 個場地")
        print(f"成功率：{len(self.collected_data)/len(venues_list)*100:.1f}%")

        return self.collected_data

if __name__ == '__main__':
    print("=" * 60)
    print("🚀 場地資料收集器 - 2小時衝刺版 v2")
    print(f"時間：{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)

    # 載入場地名單
    with open('sample-data.json', 'r', encoding='utf-8') as f:
        all_venues = json.load(f)

    # 優先選擇可爬取的場地
    target_venues = []

    # 會議中心與展演場地
    conferences = [v for v in all_venues if v.get('venueType') in ['會議場地', '展演場地']]
    target_venues.extend(conferences[:15])

    # 飯店場地
    hotels = [v for v in all_venues if v.get('venueType') == '飯店場地']
    target_venues.extend(hotels[:20])

    print(f"\n📊 選擇場地名單：{len(target_venues)} 個")
    print(f"  - 會議場地/展演場地：{len(conferences[:15])} 個")
    print(f"  - 飯店場地：{len(hotels[:20])} 個")

    # 建立收集器
    collector = VenueDataCollector()

    # 開始收集
    results = collector.process_all_venues(target_venues)

    # 保存結果
    output_file = f'venue_data_collected_{datetime.now().strftime("%Y%m%d_%H%M%S")}.json'
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)

    print(f"\n💾 結果已保存到：{output_file}")
    print(f"\n🎉 收集完成！")
