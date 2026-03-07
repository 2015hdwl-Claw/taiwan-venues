#!/usr/bin/env python3
"""檢查場地照片狀態"""

import json
import urllib.request
import urllib.error
import ssl
from datetime import datetime

def check_photos_status():
    # 讀取資料
    with open('venues-all-cities.json', 'r', encoding='utf-8') as f:
        venues = json.load(f)
    
    total = len(venues)
    
    # 統計
    missing_main = []      # 缺少主照片
    has_main = []          # 有主照片
    invalid_url = []       # URL 失效
    needs_update = []      # 標記需要更新
    
    print(f"📊 總場地數: {total}")
    print("-" * 50)
    
    for venue in venues:
        images = venue.get('images', {})
        main = images.get('main', '')
        needs = images.get('needsUpdate', False)
        note = images.get('note', '')
        
        venue_info = {
            'id': venue.get('id'),
            'name': venue.get('name'),
            'roomName': venue.get('roomName'),
            'city': venue.get('city'),
            'url': venue.get('url'),
            'main': main,
            'note': note
        }
        
        # 檢查是否缺少照片
        if not main or main == '' or main is None:
            missing_main.append(venue_info)
        else:
            has_main.append(venue_info)
        
        # 檢查 needsUpdate
        if needs:
            needs_update.append(venue_info)
    
    print(f"❌ 缺少主照片: {len(missing_main)} ({len(missing_main)/total*100:.1f}%)")
    print(f"✅ 有主照片: {len(has_main)} ({len(has_main)/total*100:.1f}%)")
    print(f"🔄 標記需要更新: {len(needs_update)}")
    
    # 按城市統計
    print("\n📍 缺少照片的城市分布:")
    city_stats = {}
    for v in missing_main:
        city = v.get('city', '未知')
        if city not in city_stats:
            city_stats[city] = 0
        city_stats[city] += 1
    
    for city, count in sorted(city_stats.items(), key=lambda x: -x[1]):
        print(f"  {city}: {count}")
    
    # 按類型統計
    print("\n📁 缺少照片的場地類型:")
    type_stats = {}
    for v in missing_main:
        venue_type = None
        # 從原始資料找 venueType
        for orig in venues:
            if orig.get('id') == v['id']:
                venue_type = orig.get('venueType', '未知')
                break
        if venue_type not in type_stats:
            type_stats[venue_type] = 0
        type_stats[venue_type] += 1
    
    for t, count in sorted(type_stats.items(), key=lambda x: -x[1])[:10]:
        print(f"  {t}: {count}")
    
    # 輸出需要照片的場地清單
    print(f"\n📝 前20個缺少照片的場地:")
    for v in missing_main[:20]:
        print(f"  [{v['id']}] {v['name']} - {v.get('roomName', '')} ({v.get('city', '')})")
    
    # 儲存完整清單
    output = {
        'generatedAt': datetime.now().isoformat(),
        'total': total,
        'missingMainPhoto': len(missing_main),
        'hasMainPhoto': len(has_main),
        'needsUpdate': len(needs_update),
        'missingVenues': missing_main,
        'cityStats': city_stats
    }
    
    with open('photo_status_report.json', 'w', encoding='utf-8') as f:
        json.dump(output, f, ensure_ascii=False, indent=2)
    
    print(f"\n✅ 完整報告已儲存到 photo_status_report.json")
    
    return missing_main, has_main

if __name__ == '__main__':
    check_photos_status()
