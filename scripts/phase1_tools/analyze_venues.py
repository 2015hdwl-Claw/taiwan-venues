#!/usr/bin/env python3
"""
活動大師 Phase 1 - 場地分析腳本
分析待修場地並分類
"""

import json
from pathlib import Path
from collections import defaultdict
from datetime import datetime

# 讀取場地資料
DATA_FILE = Path("/root/.openclaw/workspace/taiwan-venues/venues-all-cities.json")
OUTPUT_DIR = Path("/root/.openclaw/workspace/taiwan-venues/scripts/phase1_tools/output")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

def load_venues():
    """載入場地資料"""
    with open(DATA_FILE, 'r', encoding='utf-8') as f:
        return json.load(f)

def analyze_venue(venue):
    """分析單個場地"""
    issues = []
    
    # 檢查主照片
    has_main_photo = False
    images = venue.get('images', {})
    main_photo = images.get('main', '')
    
    # 判斷照片是否有效
    if main_photo and main_photo.strip() and not main_photo.startswith('http://via.placeholder'):
        # 檢查是否為禁止的來源
        forbidden_sources = ['wikipedia', 'unsplash', 'placeholder']
        is_forbidden = any(src in main_photo.lower() for src in forbidden_sources)
        if not is_forbidden:
            has_main_photo = True
    
    if not has_main_photo:
        issues.append('missing_photo')
    
    # 檢查會議室 URL
    has_venue_url = bool(venue.get('venueListUrl', '').strip())
    if not has_venue_url:
        issues.append('missing_venue_url')
    
    return {
        'id': venue.get('id'),
        'name': venue.get('name', ''),
        'city': venue.get('city', ''),
        'venueType': venue.get('venueType', ''),
        'url': venue.get('url', ''),
        'issues': issues,
        'has_photo': has_main_photo,
        'has_venue_url': has_venue_url,
        'status': venue.get('status', ''),
        'images': images
    }

def classify_venue_type(venue_type):
    """分類場地類型"""
    venue_type_lower = venue_type.lower() if venue_type else ''
    
    if any(k in venue_type_lower for k in ['飯店', 'hotel', '宴會']):
        return '飯店'
    elif any(k in venue_type_lower for k in ['會議', '會議中心', 'conference']):
        return '會議中心'
    elif any(k in venue_type_lower for k in ['展演', '展覽', '劇院', '演藝', '體育']):
        return '展演場地'
    else:
        return '其他'

def main():
    print("=" * 60)
    print("活動大師 Phase 1 - 場地分析")
    print(f"執行時間: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)
    
    # 載入資料
    venues = load_venues()
    print(f"\n總場地數: {len(venues)}")
    
    # 分析所有場地
    analyzed = [analyze_venue(v) for v in venues]
    
    # 統計
    total_venues = len(analyzed)
    venues_with_issues = [v for v in analyzed if v['issues']]
    venues_missing_photo = [v for v in analyzed if 'missing_photo' in v['issues']]
    venues_missing_url = [v for v in analyzed if 'missing_venue_url' in v['issues']]
    venues_missing_both = [v for v in analyzed if set(v['issues']) == {'missing_photo', 'missing_venue_url'}]
    
    print(f"\n待修場地統計:")
    print(f"  - 缺少主照片: {len(venues_missing_photo)} 個")
    print(f"  - 缺少會議室 URL: {len(venues_missing_url)} 個")
    print(f"  - 兩者都缺（優先處理）: {len(venues_missing_both)} 個")
    print(f"  - 總待修場地: {len(venues_with_issues)} 個")
    
    # 按類型分類
    by_type = defaultdict(list)
    for v in venues_with_issues:
        category = classify_venue_type(v['venueType'])
        by_type[category].append(v)
    
    print(f"\n待修場地分類:")
    for category, items in sorted(by_type.items(), key=lambda x: -len(x[1])):
        print(f"  - {category}: {len(items)} 個")
    
    # 按城市分類
    by_city = defaultdict(list)
    for v in venues_with_issues:
        by_city[v['city']].append(v)
    
    print(f"\n待修場地按城市分布（前 10）:")
    for city, items in sorted(by_city.items(), key=lambda x: -len(x[1]))[:10]:
        print(f"  - {city}: {len(items)} 個")
    
    # 準備批次處理（分成 6 批，每批 20 個）
    # 優先順序：兩者都缺 > 缺照片 > 缺 URL
    priority_order = (
        venues_missing_both + 
        [v for v in venues_missing_photo if v not in venues_missing_both] +
        [v for v in venues_missing_url if v not in venues_missing_photo and v not in venues_missing_both]
    )
    
    batch_size = 20
    batches = []
    for i in range(0, len(priority_order), batch_size):
        batch = priority_order[i:i+batch_size]
        batches.append({
            'batch_id': i // batch_size + 1,
            'total': len(batch),
            'venues': [
                {
                    'id': v['id'],
                    'name': v['name'],
                    'city': v['city'],
                    'venueType': v['venueType'],
                    'url': v['url'],
                    'issues': v['issues']
                }
                for v in batch
            ]
        })
    
    print(f"\n批次處理準備:")
    print(f"  - 總批數: {len(batches)} 批")
    for batch in batches[:6]:
        print(f"  - 第 {batch['batch_id']} 批: {batch['total']} 個場地")
    
    # 輸出結果
    output = {
        'timestamp': datetime.now().isoformat(),
        'summary': {
            'total_venues': total_venues,
            'venues_with_issues': len(venues_with_issues),
            'missing_photo': len(venues_missing_photo),
            'missing_venue_url': len(venues_missing_url),
            'missing_both': len(venues_missing_both)
        },
        'by_type': {k: len(v) for k, v in by_type.items()},
        'by_city': {k: len(v) for k, v in sorted(by_city.items(), key=lambda x: -len(x[1]))[:20]},
        'batches': batches,
        'priority_venues': [
            {
                'id': v['id'],
                'name': v['name'],
                'city': v['city'],
                'venueType': v['venueType'],
                'url': v['url'],
                'issues': v['issues']
            }
            for v in priority_order
        ]
    }
    
    output_file = OUTPUT_DIR / "venue_analysis.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(output, f, ensure_ascii=False, indent=2)
    
    print(f"\n✓ 分析結果已保存到: {output_file}")
    print(f"\n準備開發工具...")
    
    return output

if __name__ == '__main__':
    main()
