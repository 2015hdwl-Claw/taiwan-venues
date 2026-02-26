#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
手動更新場地網站資訊
從 contactEmail 推斷網站
"""

import json
import re
from datetime import datetime

def infer_website_from_email(email):
    """從 email 推斷網站"""
    if not email:
        return None
    
    email_lower = email.lower()
    
    # 飯店網站關鍵字
    hotel_keywords = {
        'hyatt': 'hyatt',
        'shangri-la': 'shangri-la',
        'sheraton': 'sheraton',
        'marriott': 'marriott',
        'hilton': 'hilton',
        'westin': 'westin',
        'mandarin-oriental': 'mandarin-oriental',
        'grand-hotel': 'grand-hotel',
        'regent': 'regent',
        'ifg': 'intercontinental',
    }
    
    for keyword, domain in hotel_keywords.items():
        if keyword in email_lower:
            return f'https://www.{domain}.com'
    
    # 會議中心關鍵字
    conference_keywords = {
        'ticc': 'ticc',
        'huashan': 'huashan1914',
        '3create': '3create',
        'taipeimart': 'taipeimart',
        'nuzone': 'nuzone',
    }
    
    for keyword, domain in conference_keywords.items():
        if keyword in email_lower:
            return f'https://www.{domain}.com'
    
    return None

def update_venue_sites(venues):
    """更新場地網站資訊"""
    updated_count = 0
    
    for venue in venues:
        # 如果已經有網站，跳過
        if venue.get('url'):
            continue
        
        # 從 email 推斷網站
        email = venue.get('contactEmail')
        website = infer_website_from_email(email)
        
        if website:
            venue['url'] = website
            updated_count += 1
            print(f"✅ {venue['name']}: {website}")
    
    return venues, updated_count

if __name__ == '__main__':
    print("=" * 60)
    print("🚀 手動更新場地網站資訊")
    print(f"時間：{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)
    
    # 載入場地資料
    with open('sample-data.json', 'r', encoding='utf-8') as f:
        venues = json.load(f)
    
    print(f"\n📍 總場地數：{len(venues)} 筆")
    print(f"📝 已有網站的場地：{sum(1 for v in venues if v.get('url'))} 筆")
    print(f"⚠️  缺少網站的場地：{len(venues) - sum(1 for v in venues if v.get('url'))} 筆")
    
    # 更新場地資訊
    print(f"\n🔄 開始更新...")
    venues, updated_count = update_venue_sites(venues)
    
    print(f"\n✅ 更新完成")
    print(f"   成功更新：{updated_count} 個場地")
    print(f"   剩餘未更新：{len(venues) - updated_count} 個場地")
    
    # 保存更新後的資料
    output_file = 'sample-data-updated.json'
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(venues, f, ensure_ascii=False, indent=2)
    
    print(f"\n💾 更新後的資料已保存到：{output_file}")
    
    # 統計
    venues_with_site = sum(1 for v in venues if v.get('url'))
    print(f"\n📊 統計")
    print(f"   總場地數：{len(venues)} 筆")
    print(f"   有網站的場地：{venues_with_site} 筆 ({venues_with_site/len(venues)*100:.1f}%)")
    print(f"   有照片的場地：{sum(1 for v in venues if v.get('images'))} 筆")
    print(f"   有交通資訊的場地：{sum(1 for v in venues if v.get('metroStation') or v.get('parkingInfo'))} 筆")
    print(f"   有佈局圖的場地：{sum(1 for v in venues if v.get('layoutImageUrl'))} 筆")
