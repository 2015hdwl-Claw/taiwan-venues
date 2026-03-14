#!/usr/bin/env python3
"""
更新台北市場地官網網址
根據檢查結果更新失效的網址
"""

import json
from datetime import datetime

# 讀取原始資料
with open('venues-all-cities.json', 'r', encoding='utf-8') as f:
    venues = json.load(f)

# 失效網址清單（DNS 失效或 404）
dead_urls = {
    'https://www.goodmans-coffee.com/': 'DNS 失效',
    'https://www.tccc.com.tw/': 'DNS 失效',
    'https://www.taipeiarena.com': '網域出售中',
    'https://www.midtownrichard.com/': 'DNS 失效',
    'https://www.regenthotels.com/taipei': '404 錯誤',
    'https://www.songyi-hotel.com/': 'DNS 失效',
    'https://www.chateau-china.com/': 'DNS 失效',
    'https://www.san-want.com/': 'DNS 失效',
    'https://www.first-hotel.com.tw/': 'DNS 失效',
    'https://www.tongyi-hotel.com/': 'DNS 失效',
    'https://www.imperial-hotel.com.tw/': 'DNS 失效',
    'https://www.gloria-residence.com/': 'DNS 失效',
    'https://www.landisresort.com/': 'DNS 失效',
    'http://www.ntualumni.org.tw/': 'DNS 失效',
    'https://www.taipeiexpopark.tw/': 'DNS 失效',
    'https://www.tms.gov.taipei/': 'DNS 失效',
    'https://itcc.yff.org.tw/': 'DNS 失效',
}

# 正確網址對照表
correct_urls = {
    # 晶華酒店
    'https://www.regenthotels.com/taipei': 'https://www.regenttaiwan.com/',
    # 神旺大飯店
    'https://www.san-want.com/': 'https://www.sanwant.com',
    # 台北小巨蛋
    'https://www.taipeiarena.com': 'https://arena.taipei/',
}

# 更新統計
stats = {
    'total_taipei': 0,
    'checked': 0,
    'found_dead': 0,
    'updated': 0,
    'marked_closed': 0,
}

# 更新場地資料
for venue in venues:
    if venue.get('city') != '台北市':
        continue
    
    stats['total_taipei'] += 1
    url = venue.get('url', '')
    
    if url in dead_urls:
        stats['checked'] += 1
        stats['found_dead'] += 1
        
        # 檢查是否有正確網址
        if url in correct_urls:
            # 更新為正確網址
            venue['url'] = correct_urls[url]
            venue['lastUpdated'] = datetime.now().isoformat()
            venue['updateReason'] = f'官網網址更新（原網址{dead_urls[url]}）'
            venue['updateSource'] = '自動檢查腳本'
            venue['status'] = '上架'
            stats['updated'] += 1
            print(f"✅ 更新: {venue['name']}")
            print(f"   舊網址: {url}")
            print(f"   新網址: {correct_urls[url]}")
        else:
            # 標註為歇業
            if venue.get('status') != '下架':
                venue['status'] = '下架'
                venue['lastUpdated'] = datetime.now().isoformat()
                venue['updateReason'] = f'官網失效（{dead_urls[url]}），無法找到新網址'
                venue['updateSource'] = '自動檢查腳本'
                venue['note'] = f"官網失效（{dead_urls[url]}），可能已歇業"
                stats['marked_closed'] += 1
                print(f"❌ 標註歇業: {venue['name']}")
                print(f"   網址: {url} ({dead_urls[url]})")

# 保存更新後的資料
with open('venues-all-cities.json', 'w', encoding='utf-8') as f:
    json.dump(venues, f, ensure_ascii=False, indent=2)

# 輸出統計
print("\n" + "="*60)
print("更新統計：")
print(f"  台北市場地總數: {stats['total_taipei']}")
print(f"  檢查失效網址: {stats['checked']}")
print(f"  發現失效: {stats['found_dead']}")
print(f"  成功更新: {stats['updated']}")
print(f"  標註歇業: {stats['marked_closed']}")
print("="*60)

# 保存統計報告
report = {
    'timestamp': datetime.now().isoformat(),
    'stats': stats,
    'dead_urls': dead_urls,
    'updated_venues': [v for v in venues if v.get('updateReason', '').startswith('官網')],
}

with open('taipei-url-update-report.json', 'w', encoding='utf-8') as f:
    json.dump(report, f, ensure_ascii=False, indent=2)

print("\n報告已保存到 taipei-url-update-report.json")
