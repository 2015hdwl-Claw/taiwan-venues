#!/usr/bin/env python3
"""
第三批：處理可連線的場地
"""

import json
import re
import requests
from urllib.parse import urljoin
from bs4 import BeautifulSoup
import time

# 載入場地資料
with open('./venues-all-cities.json', 'r', encoding='utf-8') as f:
    all_venues = json.load(f)

# 載入完整檢查報告
with open('./taipei-full-check-report.json', 'r', encoding='utf-8') as f:
    report = json.load(f)

# 已更新的場地
already_updated = [
    1032, 1068, 1116, 1126, 1439, 1440,  # 第一批
    1060, 1069, 1074, 1058, 1521, 1522, 1523  # 第二批
]

# 已嘗試但失敗的官網（DNS 或連線問題）
failed_domains = [
    'ile-hotel.com', 'youchun-hotel.com', 'zibei-hotel.com',
    'kanghua-hotel.com', 'midtownrichard.com', 'ching-tai.com',
    'songyi-hotel.com', 'chateau-china.com', 'firsthotel.com',
    'first-hotel.com.tw', 'tccc.com.tw', 'hotelbf.com',
    'victoriam.com', 'tbc-group.com', 'ntualumni.org.tw',
    'itcc.yff.org.tw', 'fuxing.space', 'siihub.org',
    'ntuacc.org', 'mandarin-wedding.com'
]

# 過濾可嘗試的場地
def can_try(url):
    if not url:
        return False
    for domain in failed_domains:
        if domain in url:
            return False
    # 排除 Marriott（反爬蟲）
    if 'marriott' in url.lower():
        return False
    return True

# 篩選需要更新且官網可嘗試的場地
needs_update = report['priorityUpdateList']
batch3 = []

for v in needs_update:
    if v['id'] in already_updated:
        continue
    if not can_try(v.get('url')):
        continue
    
    # 優先順序：飯店 > 會議中心 > 婚宴 > 其他
    if v['venueType'] == '飯店場地':
        batch3.insert(0, v)  # 插到前面
    else:
        batch3.append(v)
    
    if len(batch3) >= 20:
        break

print(f"第三批更新清單: {len(batch3)} 個場地")
print("\n場地列表:")
for i, v in enumerate(batch3, 1):
    print(f"{i}. [{v['id']}] {v['name']} ({v['venueType']})")
    print(f"   {v['url']}")

# 儲存
with open('./batch3-update-list.json', 'w', encoding='utf-8') as f:
    json.dump(batch3, f, ensure_ascii=False, indent=2)
