#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
智能網站推斷器 - 根據場地名稱和地址推斷網站
"""

import re
from urllib.parse import urljoin

class WebsiteInference:
    def __init__(self):
        # 常見飯店網站關鍵字對應
        self.hotel_keywords = {
            '君悅': 'hyatt',
            '晶華': 'shangri-la',
            'W': 'w-hotel',
            '香格里拉': 'shangri-la',
            '君品': 'grand hyatt',
            '喜來登': 'sheraton',
            '國賓': 'regent',
            '老爺': 'grand-hotel',
            '亞都麗緻': 'htl',
            '文華東方': 'mandarin-oriental',
            '西華': 'westin',
            '威斯汀': 'westin',
            '諾富特': 'novotel',
            '希爾頓': 'hilton',
            '文華': 'mandarin-oriental',
            '翰品': 'grand-hotel',
            '涵碧樓': 'hanbi-lou',
            '晶華': 'shangri-la',
            '國泰': 'pak-sha-lou',
            '統一': 'hsinchih-lou',
            '長榮': 'caira',
        }

        # 常見會議中心網站關鍵字
        self.conf_keywords = {
            '台北國際會議中心': 'ticc',
            '台北世貿中心': 'taipeimart',
            '華山': 'huashan1914',
            '三創': '3create',
            'NUZONE': 'nuzone',
            '台中日月千禧': 'booking',
            '台中日月千禧酒店': 'booking',
        }

    def infer_website(self, name, city, email=None):
        """推斷場地網站"""
        name_lower = name.lower()
        city_lower = city.lower()

        # 1. 先從 email 推斷
        if email:
            # 移除特殊字元
            email_lower = email.lower()
            # 提取網域名稱
            domain_match = re.search(r'@([\w.]+)', email)
            if domain_match:
                domain = domain_match.group(1)
                # 轉換為網站
                if 'hyatt' in domain:
                    return f'https://www.{domain}'
                elif 'shangri-la' in domain:
                    return f'https://www.{domain}'
                elif 'sheraton' in domain:
                    return f'https://www.{domain}'
                elif 'hilton' in domain:
                    return f'https://www.{domain}'

        # 2. 從場地名稱推斷
        for hotel_name, keyword in sorted(self.hotel_keywords.items(), key=lambda x: -len(x[0])):
            if hotel_name in name:
                return f'https://www.{keyword}.com'

        for conf_name, keyword in sorted(self.conf_keywords.items(), key=lambda x: -len(x[0])):
            if conf_name in name:
                return f'https://www.{keyword}.com'

        # 3. 根據城市推斷（通用網站）
        if '台北' in city:
            return 'https://www.taipei.gov.tw'
        elif '新北' in city or '板橋' in city:
            return 'https://www.newtaipei.gov.tw'
        elif '台中' in city:
            return 'https://www.taichung.gov.tw'
        elif '台南' in city:
            return 'https://www.tainan.gov.tw'
        elif '高雄' in city:
            return 'https://www.kaohsiung.gov.tw'
        elif '桃園' in city:
            return 'https://www.taoyuan.gov.tw'

        # 4. 預設網站
        return f'https://www.{name.replace(' ', '')}.com'

    def process_venues(self, venues):
        """處理所有場地，推斷網站"""
        results = []

        for venue in venues:
            name = venue.get('name', '')
            city = venue.get('city', '')
            email = venue.get('contactEmail', '')

            website = self.infer_website(name, city, email)

            # 優化網站（排除明顯錯誤的）
            if 'unknown' in website and len(name) > 3:
                website = f'https://www.{name.replace(" ", "").lower()}.com'

            result = {
                'id': venue.get('id'),
                'name': name,
                'city': city,
                'website': website,
                'original_url': venue.get('url'),
                'email': email
            }

            results.append(result)

        return results

if __name__ == '__main__':
    import json

    print("🤖 智能網站推斷器啟動")
    print("開始時間：2026-02-26 17:45:00")

    # 載入場地資料
    with open('sample-data.json', 'r', encoding='utf-8') as f:
        venues = json.load(f)

    # 推斷網站
    inferrer = WebsiteInference()
    website_list = inferrer.process_venues(venues[:10])  # 測試前 10 個

    # 顯示結果
    print("\n=== 推斷結果（前 10 個場地）===")
    for item in website_list:
        print(f"\n{item['name']}: {item['website']}")

    # 保存結果
    with open('website_list.json', 'w', encoding='utf-8') as f:
        json.dump(website_list, f, ensure_ascii=False, indent=2)

    print("\n💾 結果已保存到：website_list.json")
    print("✅ 推斷完成")
