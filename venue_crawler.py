#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
場地資料爬蟲
收集場地實景照片、座位配置圖、交通資訊
"""

import requests
from bs4 import BeautifulSoup
import json
import re
import time
from datetime import datetime
from urllib.parse import urljoin, urlparse

class VenueCrawler:
    def __init__(self):
        self.user_agent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': self.user_agent,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'zh-TW,zh;q=0.9,en;q=0.8',
            'Accept-Encoding': 'gzip, deflate',
        })

    def get_soup(self, url):
        """取得網頁 HTML"""
        try:
            response = self.session.get(url, timeout=10)
            response.raise_for_status()
            return BeautifulSoup(response.text, 'html.parser')
        except Exception as e:
            print(f"❌ 爬取失敗: {url}")
            print(f"   錯誤: {e}")
            return None

    def extract_images(self, soup, url):
        """提取網頁中的所有圖片 URL"""
        images = []
        img_tags = soup.find_all('img')

        for img in img_tags:
            img_url = img.get('src') or img.get('data-src')
            if img_url:
                # 處理相對路徑
                if not img_url.startswith('http'):
                    img_url = urljoin(url, img_url)

                # 篩選照片類型
                img_alt = img.get('alt', '').lower()
                if any(keyword in img_alt for keyword in ['照片', '圖片', 'photo', 'image', 'show', 'hall']):
                    images.append({
                        'url': img_url,
                        'alt': img.get('alt'),
                        'type': self._classify_image_type(img_url, img_alt)
                    })

        return images

    def _classify_image_type(self, url, alt):
        """分類圖片類型"""
        url_lower = url.lower()
        alt_lower = alt.lower()

        # 座位配置圖
        if any(kw in url_lower or kw in alt_lower for kw in ['layout', 'seating', '配置', '座位', 'table']):
            return 'layout'
        # 實景照片
        if any(kw in url_lower or kw in alt_lower for kw in ['scene', 'hall', 'room', 'space', '實景', '廳', '會議室']):
            return 'scene'
        # 總體照片
        if any(kw in url_lower or kw in alt_lower for kw in ['main', 'show', 'photo']):
            return 'main'
        # 其他
        return 'other'

    def extract_traffic_info(self, soup, url):
        """提取交通資訊"""
        traffic_info = {
            'metroStation': None,
            'busStation': None,
            'parkingInfo': None,
            'parkingFee': None,
            'parkingCapacity': None
        }

        text = soup.get_text()

        # 提取捷運站
        metro_pattern = r'(台北[市政府|信義|中正|大安|中山|大同|松山|文山|南港|内湖|士林|北投|基隆|板橋|新莊|三重|中和|永和|汐止|瑞芳|樹林|鶯歌|三峽|深坑|石碇|坪林|烏來|平溪|雙溪|貢寮|金瓜石|九份|瑞芳站|東門站|忠孝新生站|忠孝復興站|忠孝敦化站|忠孝瑞明站|信義安和站|市政府站|國父紀念館站|台北車站站|松山車站位)'
        metro_matches = re.findall(metro_pattern, text)
        if metro_matches:
            traffic_info['metroStation'] = metro_matches[0]

        # 提取公車站
        bus_pattern = r'([市區|公車|巴士]站\s*[:：]\s*([^\n,，]+))'
        bus_matches = re.findall(bus_pattern, text)
        if bus_matches:
            traffic_info['busStation'] = bus_matches[0][1].strip()

        # 提取停車資訊
        parking_patterns = [
            r'(停車場\s*[:：]\s*([^\n,，]+))',
            r'(停車\s*[:：]\s*([^\n,，]+))',
            r'(費用\s*[:：]\s*([^\n,，]+))',
            r'(停車費\s*[:：]\s*([^\n,，]+))',
            r'(\d+\.?\d*\s*元)',
        ]

        for pattern in parking_patterns:
            matches = re.findall(pattern, text)
            for match in matches:
                info_text = match[0]
                if '停車' in info_text or '元' in info_text:
                    traffic_info['parkingInfo'] = info_text
                    break

        # 提取停車費用數字
        fee_pattern = r'(\d+)\s*元'
        fee_matches = re.findall(fee_pattern, text)
        if fee_matches:
            traffic_info['parkingFee'] = int(fee_matches[0])

        return traffic_info

    def crawl_venue(self, venue_id, venue_name, venue_url, city):
        """爬取單一場地資訊"""
        print(f"\n{'='*60}")
        print(f"🔍 爬取場地：{venue_name} (ID: {venue_id})")
        print(f"🌐 網址：{venue_url}")
        print(f"📍 城市：{city}")
        print(f"{'='*60}")

        if not venue_url:
            print("⚠️  未提供網址，跳過")
            return None

        soup = self.get_soup(venue_url)
        if not soup:
            return None

        # 提取圖片
        images = self.extract_images(soup, venue_url)

        # 提取交通資訊
        traffic_info = self.extract_traffic_info(soup, venue_url)

        # 統計圖片
        layout_images = [img for img in images if img['type'] == 'layout']
        scene_images = [img for img in images if img['type'] == 'scene']

        result = {
            'id': venue_id,
            'name': venue_name,
            'url': venue_url,
            'city': city,
            'images': [
                img['url'] for img in images[:5]
            ],
            'layoutImageUrl': layout_images[0]['url'] if layout_images else None,
            'sceneImageUrl': scene_images[0]['url'] if scene_images else None,
            'trafficInfo': traffic_info,
            'allImages': images,
            'allTrafficInfo': traffic_info
        }

        print(f"\n✅ 爬取完成！")
        print(f"   實景照片：{len(scene_images)} 張")
        print(f"   座位配置圖：{len(layout_images)} 張")
        print(f"   捷運站：{traffic_info['metroStation']}")
        print(f"   公車站：{traffic_info['busStation']}")
        print(f"   停車資訊：{traffic_info['parkingInfo']}")
        print(f"   停車費用：{traffic_info['parkingFee']} 元")

        return result

    def crawl_multiple_venues(self, venues_list):
        """爬取多個場地"""
        results = []

        for venue in venues_list:
            result = self.crawl_venue(
                venue.get('id'),
                venue.get('name'),
                venue.get('url'),
                venue.get('city')
            )

            if result:
                results.append(result)

            # 避免被反爬蟲
            time.sleep(2)

        return results

if __name__ == '__main__':
    print("🎉 場地資料爬蟲啟動")
    print(f"時間：{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

    # 建立爬蟲實例
    crawler = VenueCrawler()

    # 測試場地名單
    test_venues = [
        {
            'id': 1,
            'name': '台北國際會議中心',
            'url': 'https://www.ticc.com.tw',
            'city': '台北市'
        },
        {
            'id': 3,
            'name': '華山1914文化創意產業園區',
            'url': 'https://www.huashan1914.com.tw',
            'city': '台北市'
        },
    ]

    # 爬取場地
    results = crawler.crawl_multiple_venues(test_venues)

    # 顯示結果
    print(f"\n{'='*60}")
    print(f"📊 爬取統計")
    print(f"{'='*60}")
    print(f"總場地數：{len(test_venues)}")
    print(f"成功爬取：{len(results)}")

    for result in results:
        print(f"\n✅ {result['name']}")
        print(f"   圖片：{len(result['allImages'])} 張")

    # 保存結果
    output_file = f'venue_crawl_results_{datetime.now().strftime("%Y%m%d_%H%M%S")}.json'
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)

    print(f"\n💾 結果已保存到：{output_file}")
