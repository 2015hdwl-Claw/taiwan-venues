#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
智能爬蟲流程：根據網頁類型選擇最佳工具
- 靜態網頁 → web_fetch（快速、省資源）
- 動態網頁 → agent-browser（處理 JS 渲染）
"""

import json
import subprocess
import re
import time
from typing import Dict, List, Optional

class SmartVenueCrawler:
    def __init__(self):
        self.session = None
        self.results = {}

    def try_web_fetch(self, url: str) -> Optional[Dict]:
        """
        嘗試使用 web_fetch（靜態網頁）
        返回 None 表示需要動態渲染
        """
        print(f"  嘗試 web_fetch...")

        try:
            # 使用 OpenClaw 的 web_fetch
            # 這裡我們用 requests 模擬
            import requests
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
            response = requests.get(url, headers=headers, timeout=10)

            if response.status_code != 200:
                return None

            html = response.text

            # 提取照片
            img_pattern = r'<img[^>]+src=["\']([^"\']+\.(jpg|jpeg|png|webp))["\']'
            images = re.findall(img_pattern, html, re.IGNORECASE)

            if len(images) < 2:
                print(f"  ❌ 靜態網頁但照片不足（{len(images)}張）")
                return None

            # 過濾和整理照片
            photo_urls = []
            for img_url, ext in images:
                if not img_url.startswith('http'):
                    from urllib.parse import urljoin
                    img_url = urljoin(url, img_url)

                # 過濾不相關的照片
                if any(x in img_url.lower() for x in ['logo', 'icon', 'button', 'avatar']):
                    continue

                photo_urls.append(img_url)

            if len(photo_urls) >= 2:
                print(f"  ✅ 靜態網頁成功（{len(photo_urls)}張照片）")
                return {
                    'method': 'web_fetch',
                    'main': photo_urls[0] if photo_urls else '',
                    'gallery': photo_urls[1:4] if len(photo_urls) > 1 else []
                }

            return None

        except Exception as e:
            print(f"  ❌ web_fetch 失敗: {e}")
            return None

    def use_agent_browser(self, url: str, venue_name: str) -> Optional[Dict]:
        """
        使用 agent-browser（動態網頁）
        """
        print(f"  啟動 agent-browser...")

        try:
            # 打開網站
            subprocess.run(
                ['agent-browser', 'open', url],
                capture_output=True,
                timeout=30
            )
            time.sleep(2)

            # 獲取 HTML
            result = subprocess.run(
                ['agent-browser', 'get', 'html', 'body'],
                capture_output=True,
                text=True,
                timeout=30
            )

            html = result.stdout

            # 提取照片
            img_pattern = r'<img[^>]+src=["\']([^"\']+\.(jpg|jpeg|png|webp))["\']'
            images = re.findall(img_pattern, html, re.IGNORECASE)

            # 整理照片
            photo_urls = []
            for img_url, ext in images:
                if not img_url.startswith('http'):
                    from urllib.parse import urljoin
                    img_url = urljoin(url, img_url)

                # 過濾
                if any(x in img_url.lower() for x in ['logo', 'icon', 'button', 'avatar']):
                    continue

                photo_urls.append(img_url)

            # 關閉瀏覽器
            subprocess.run(['agent-browser', 'close'], capture_output=True, timeout=10)

            if len(photo_urls) >= 2:
                print(f"  ✅ agent-browser 成功（{len(photo_urls)}張照片）")
                return {
                    'method': 'agent_browser',
                    'main': photo_urls[0],
                    'gallery': photo_urls[1:4]
                }
            else:
                print(f"  ❌ 照片不足（{len(photo_urls)}張）")
                return None

        except subprocess.TimeoutExpired:
            print(f"  ❌ 超時")
            subprocess.run(['agent-browser', 'close'], capture_output=True, timeout=5)
            return None
        except Exception as e:
            print(f"  ❌ agent-browser 失敗: {e}")
            try:
                subprocess.run(['agent-browser', 'close'], capture_output=True, timeout=5)
            except:
                pass
            return None

    def crawl_venue(self, venue_name: str, url: str) -> Optional[Dict]:
        """
        智能爬取單個場地
        """
        print(f"\n{'='*80}")
        print(f"📍 {venue_name}")
        print(f"   {url}")
        print(f"{'='*80}")

        # 策略1: 先嘗試 web_fetch（快速）
        result = self.try_web_fetch(url)

        if result:
            return result

        # 策略2: 使用 agent-browser（處理動態渲染）
        print(f"  ⏸️  需要動態渲染，啟動 agent-browser...")
        result = self.use_agent_browser(url, venue_name)

        return result

    def crawl_all(self, venues: Dict[str, str]):
        """
        爬取所有場地
        """
        print(f"\n{'#'*80}")
        print(f"# 智能爬蟲：靜態 → 動態")
        print(f"# 總共 {len(venues)} 個場地")
        print(f"{'#'*80}")

        for venue_name, url in venues.items():
            result = self.crawl_venue(venue_name, url)
            if result:
                self.results[venue_name] = result
            else:
                print(f"  ⚠️  無法獲取照片")

            # 避免請求太快
            time.sleep(1)

        # 統計
        print(f"\n{'='*80}")
        print(f"📊 爬取完成")
        print(f"{'='*80}")

        web_fetch_count = sum(1 for r in self.results.values() if r['method'] == 'web_fetch')
        agent_browser_count = sum(1 for r in self.results.values() if r['method'] == 'agent_browser')

        print(f"  ✅ 成功: {len(self.results)} 個場地")
        print(f"    - web_fetch: {web_fetch_count} 個（快速）")
        print(f"    - agent_browser: {agent_browser_count} 個（動態）")
        print(f"  ❌ 失敗: {len(venues) - len(self.results)} 個場地")

        # 儲存結果
        output_file = 'crawled_photos_smart.json'
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(self.results, f, ensure_ascii=False, indent=2)

        print(f"\n✅ 已儲存到 {output_file}")

        return self.results


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

    crawler = SmartVenueCrawler()
    results = crawler.crawl_all(venues)

    print(f"\n{'='*80}")
    print(f"🎉 完成！")
    print(f"{'='*80}")
