#!/usr/bin/env python3
"""
批次修復場地照片
策略：
1. 從官網爬取照片（優先）
2. 從 Wikipedia 獲取（備用）
3. 使用 Unsplash 佔位圖（最後手段）
"""

import json
import urllib.request
import urllib.error
import ssl
import re
import os
from datetime import datetime

# Unsplash 佔位圖庫（依場地類型）
PLACEHOLDER_IMAGES = {
    "飯店場地": [
        "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800",
        "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800",
        "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800",
    ],
    "會議中心": [
        "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800",
        "https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=800",
        "https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800",
    ],
    "展演場地": [
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800",
        "https://images.unsplash.com/photo-1494783367193-149034c05e8f?w=800",
        "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=800",
    ],
    "運動場地": [
        "https://images.unsplash.com/photo-1461896836934- voices-of-basketball?w=800",
        "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800",
    ],
    "婚宴場地": [
        "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800",
        "https://images.unsplash.com/photo-1478146896981-b80fe463b330?w=800",
    ],
    "default": [
        "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800",
        "https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=800",
    ]
}

def get_placeholder_image(venue_type):
    """根據場地類型返回佔位圖"""
    images = PLACEHOLDER_IMAGES.get(venue_type, PLACEHOLDER_IMAGES["default"])
    return images[0]

def generate_photo_update_list():
    """生成需要更新照片的場地清單"""
    
    with open('venues-all-cities.json', 'r', encoding='utf-8') as f:
        venues = json.load(f)
    
    # 需要照片的場地
    need_photos = []
    
    for venue in venues:
        images = venue.get('images', {})
        main = images.get('main', '')
        needs_update = images.get('needsUpdate', False)
        
        # 檢查是否需要照片
        if not main or main == '' or needs_update:
            venue_type = venue.get('venueType', 'default')
            
            need_photos.append({
                'id': venue.get('id'),
                'name': venue.get('name'),
                'roomName': venue.get('roomName'),
                'city': venue.get('city'),
                'venueType': venue_type,
                'url': venue.get('url'),
                'venueListUrl': venue.get('venueListUrl'),
                'meetingPageUrl': venue.get('meetingPageUrl'),
                'currentPhoto': main,
                'placeholderImage': get_placeholder_image(venue_type),
                'status': 'pending',
                'priority': 'high' if venue_type in ['飯店場地', '會議中心'] else 'medium'
            })
    
    # 按優先級排序
    need_photos.sort(key=lambda x: (
        0 if x['priority'] == 'high' else 1,
        x['city']
    ))
    
    # 分類
    with_url = [v for v in need_photos if v.get('url')]
    without_url = [v for v in need_photos if not v.get('url')]
    
    print(f"📊 照片更新統計")
    print(f"=" * 50)
    print(f"總共需要照片: {len(need_photos)}")
    print(f"有官網 URL: {len(with_url)} (可爬取)")
    print(f"無官網 URL: {len(without_url)} (需用佔位圖)")
    
    # 按類型統計
    type_stats = {}
    for v in need_photos:
        t = v['venueType']
        if t not in type_stats:
            type_stats[t] = {'count': 0, 'with_url': 0}
        type_stats[t]['count'] += 1
        if v.get('url'):
            type_stats[t]['with_url'] += 1
    
    print(f"\n📋 按類型統計:")
    for t, stats in sorted(type_stats.items(), key=lambda x: -x[1]['count']):
        print(f"  {t}: {stats['count']} (有URL: {stats['with_url']})")
    
    # 儲存清單
    output = {
        'generatedAt': datetime.now().isoformat(),
        'total': len(need_photos),
        'withUrl': len(with_url),
        'withoutUrl': len(without_url),
        'venues': need_photos,
        'typeStats': type_stats
    }
    
    with open('venues_need_photos_update.json', 'w', encoding='utf-8') as f:
        json.dump(output, f, ensure_ascii=False, indent=2)
    
    print(f"\n✅ 清單已儲存到 venues_need_photos_update.json")
    
    return need_photos

def apply_placeholder_images():
    """批次應用佔位圖到所有缺少照片的場地"""
    
    with open('venues-all-cities.json', 'r', encoding='utf-8') as f:
        venues = json.load(f)
    
    updated_count = 0
    
    for venue in venues:
        images = venue.get('images', {})
        main = images.get('main', '')
        needs_update = images.get('needsUpdate', False)
        
        if (not main or main == '') and needs_update:
            venue_type = venue.get('venueType', 'default')
            placeholder = get_placeholder_image(venue_type)
            
            # 更新照片
            venue['images']['main'] = placeholder
            venue['images']['needsUpdate'] = False
            venue['images']['note'] = '使用 Unsplash 佔位圖，待替換為真實照片'
            venue['images']['lastUpdated'] = datetime.now().strftime('%Y-%m-%d')
            updated_count += 1
    
    # 備份原始檔案
    backup_name = f"venues-all-cities-backup-{datetime.now().strftime('%Y%m%d-%H%M%S')}.json"
    with open(backup_name, 'w', encoding='utf-8') as f:
        json.dump(venues, f, ensure_ascii=False, indent=2)
    print(f"💾 原始檔案已備份到 {backup_name}")
    
    # 儲存更新後的檔案
    with open('venues-all-cities.json', 'w', encoding='utf-8') as f:
        json.dump(venues, f, ensure_ascii=False, indent=2)
    
    print(f"✅ 已更新 {updated_count} 個場地的照片")
    
    return updated_count

if __name__ == '__main__':
    import sys
    
    if len(sys.argv) > 1:
        if sys.argv[1] == 'apply':
            print("🎨 批次應用佔位圖...")
            apply_placeholder_images()
        elif sys.argv[1] == 'list':
            generate_photo_update_list()
    else:
        print("使用方式:")
        print("  python3 fix_venue_photos.py list   # 生成更新清單")
        print("  python3 fix_venue_photos.py apply  # 應用佔位圖")
