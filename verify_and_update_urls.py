#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
場地網址驗證和修正工具
確保資料中的網址是正確的官網
"""

import json
import requests
import re
from typing import Dict, Optional

class VenueURLValidator:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        })

    def verify_url(self, venue_name: str, url: str) -> Dict:
        """
        驗證網址是否正確
        返回：{is_valid, correct_url, reason}
        """
        print(f"\n{'='*80}")
        print(f"🔍 驗證：{venue_name}")
        print(f"   網址：{url}")
        print(f"{'='*80}")

        # 嘗試訪問網址
        try:
            response = self.session.get(url, timeout=10, allow_redirects=True)
            final_url = response.url

            print(f"   HTTP 狀態：{response.status_code}")
            print(f"   最終網址：{final_url}")

            # 檢查是否重定向到其他網站
            if response.status_code == 200:
                # 檢查網頁內容是否包含場地名稱
                html = response.text.lower()
                venue_keywords = venue_name.lower().split()

                matches = sum(1 for keyword in venue_keywords if keyword in html)

                if matches > 0:
                    print(f"   ✅ 網址有效（找到 {matches} 個關鍵字）")
                    return {
                        'is_valid': True,
                        'correct_url': final_url,
                        'reason': '網址正確且可訪問'
                    }
                else:
                    print(f"   ⚠️  網址可訪問但內容不符")
                    return {
                        'is_valid': False,
                        'correct_url': None,
                        'reason': '網頁內容不包含場地名稱'
                    }
            else:
                print(f"   ❌ HTTP 錯誤：{response.status_code}")
                return {
                    'is_valid': False,
                    'correct_url': None,
                    'reason': f'HTTP {response.status_code}'
                }

        except Exception as e:
            print(f"   ❌ 錯誤：{e}")
            return {
                'is_valid': False,
                'correct_url': None,
                'reason': str(e)
            }

    def search_correct_url(self, venue_name: str) -> Optional[str]:
        """
        搜尋正確的官網網址
        """
        print(f"\n🔍 搜尋正確網址：{venue_name}")

        # 這裡可以整合搜尋 API
        # 目前先手動設定已知的正確網址

        known_correct_urls = {
            '台北喜來登大飯店': 'https://www.sheratongrandtaipei.com/websev?lang=zh-tw',
            '台北國際會議中心': 'https://www.ticc.com.tw',
            # 可以繼續添加...
        }

        return known_correct_urls.get(venue_name)

    def update_venue_url(self, data_file: str, venue_name: str, new_url: str):
        """
        更新資料庫中的網址
        """
        with open(data_file, 'r', encoding='utf-8') as f:
            data = json.load(f)

        updated_count = 0
        for venue in data:
            if venue_name in venue.get('name', ''):
                old_url = venue.get('url', '')
                venue['url'] = new_url
                updated_count += 1
                print(f"  ✅ 已更新：{venue['name']}")
                print(f"     舊網址：{old_url}")
                print(f"     新網址：{new_url}")

        if updated_count > 0:
            with open(data_file, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            print(f"\n✅ 已更新 {updated_count} 筆記錄")
        else:
            print(f"\n❌ 沒有找到匹配的場地")

    def batch_verify(self, data_file: str):
        """
        批次驗證所有場地的網址
        """
        with open(data_file, 'r', encoding='utf-8') as f:
            data = json.load(f)

        results = {
            'valid': [],
            'invalid': [],
            'need_update': []
        }

        # 只檢查前20個場地作為示範
        for venue in data[:20]:
            venue_name = venue.get('name', '')
            url = venue.get('url', '')

            if not url:
                continue

            result = self.verify_url(venue_name, url)

            if result['is_valid']:
                results['valid'].append({
                    'name': venue_name,
                    'url': url
                })
            else:
                results['invalid'].append({
                    'name': venue_name,
                    'url': url,
                    'reason': result['reason']
                })

                # 嘗試搜尋正確網址
                correct_url = self.search_correct_url(venue_name)
                if correct_url:
                    results['need_update'].append({
                        'name': venue_name,
                        'old_url': url,
                        'correct_url': correct_url
                    })

        # 統計報告
        print(f"\n{'='*80}")
        print(f"📊 驗證報告")
        print(f"{'='*80}")
        print(f"\n✅ 有效網址：{len(results['valid'])} 個")
        print(f"❌ 無效網址：{len(results['invalid'])} 個")
        print(f"🔧 需要更新：{len(results['need_update'])} 個")

        if results['need_update']:
            print(f"\n需要更新的網址：")
            for item in results['need_update']:
                print(f"  - {item['name']}")
                print(f"    舊：{item['old_url']}")
                print(f"    新：{item['correct_url']}")

        # 儲存報告
        with open('url_validation_report.json', 'w', encoding='utf-8') as f:
            json.dump(results, f, ensure_ascii=False, indent=2)

        print(f"\n✅ 報告已儲存到 url_validation_report.json")

        return results


# 主程式
if __name__ == '__main__':
    print("="*80)
    print("🔍 場地網址驗證工具")
    print("="*80)

    validator = VenueURLValidator()

    # 示範：驗證並修正台北喜來登的網址
    print("\n📌 示範：修正台北喜來登大飯店的網址")
    validator.update_venue_url(
        'venues-all-cities.json',
        '台北喜來登大飯店',
        'https://www.sheratongrandtaipei.com/websev?lang=zh-tw'
    )

    # 批次驗證（可選）
    print(f"\n{'='*80}")
    print("是否要批次驗證所有網址？（會花費較多時間）")
    print("輸入 'yes' 執行，其他鍵跳過")
    choice = input(">>> ")

    if choice.lower() == 'yes':
        validator.batch_verify('venues-all-cities.json')
