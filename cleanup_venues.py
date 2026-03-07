#!/usr/bin/env python3
"""
活動大師 - 專業場地資料清理腳本
版本: 1.0
日期: 2026-03-05
用途: 篩選專業場地、檢查資料完整性、生成報告
"""

import json
import sys
from datetime import datetime
from collections import defaultdict

# 專業場地類型
PROFESSIONAL_TYPES = ['飯店場地', '會議中心', '展演場地', '展覽中心']

# 必要欄位
REQUIRED_FIELDS = [
    'name', 'address', 'contactPhone', 
    'priceHalfDay', 'maxCapacityTheater'
]

def load_venues(file_path):
    """載入場地資料"""
    print(f"📂 載入資料: {file_path}")
    with open(file_path, 'r', encoding='utf-8') as f:
        venues = json.load(f)
    print(f"✅ 載入完成: {len(venues)} 筆")
    return venues

def filter_professional_venues(venues):
    """篩選專業場地"""
    professional = []
    other = []
    
    for venue in venues:
        if venue.get('venueType') in PROFESSIONAL_TYPES:
            professional.append(venue)
        else:
            other.append(venue)
    
    return professional, other

def check_completeness(venue):
    """檢查資料完整性"""
    missing = []
    for field in REQUIRED_FIELDS:
        if not venue.get(field):
            missing.append(field)
    return missing

def analyze_venues(venues):
    """分析場地資料"""
    stats = {
        'total': len(venues),
        'by_type': defaultdict(int),
        'by_city': defaultdict(int),
        'by_status': defaultdict(int),
        'verified': 0,
        'complete': 0,
        'missing_fields': defaultdict(int),
        'has_photos': 0,
        'needs_photo_update': 0
    }
    
    for venue in venues:
        # 類型統計
        stats['by_type'][venue.get('venueType', '未分類')] += 1
        
        # 城市統計
        stats['by_city'][venue.get('city', '未知')] += 1
        
        # 狀態統計
        stats['by_status'][venue.get('status', '未知')] += 1
        
        # 驗證狀態
        if venue.get('verified'):
            stats['verified'] += 1
        
        # 完整性檢查
        missing = check_completeness(venue)
        if not missing:
            stats['complete'] += 1
        else:
            for field in missing:
                stats['missing_fields'][field] += 1
        
        # 照片狀態
        if venue.get('images', {}).get('main'):
            stats['has_photos'] += 1
        if venue.get('images', {}).get('needsUpdate'):
            stats['needs_photo_update'] += 1
    
    return stats

def generate_report(stats, title="場地資料分析"):
    """生成分析報告"""
    report = []
    report.append("=" * 60)
    report.append(f"📊 {title}")
    report.append("=" * 60)
    report.append("")
    
    # 總覽
    report.append("## 📈 總覽")
    report.append(f"總場地數: {stats['total']}")
    report.append(f"完整資料: {stats['complete']} ({stats['complete']/stats['total']*100:.1f}%)")
    report.append(f"已驗證: {stats['verified']} ({stats['verified']/stats['total']*100:.1f}%)")
    report.append("")
    
    # 場地類型
    report.append("## 🏨 場地類型分佈")
    for vtype, count in sorted(stats['by_type'].items(), key=lambda x: x[1], reverse=True):
        pct = count / stats['total'] * 100
        report.append(f"  {vtype}: {count} ({pct:.1f}%)")
    report.append("")
    
    # 城市分佈（前 10）
    report.append("## 📍 城市分佈（前 10）")
    for city, count in sorted(stats['by_city'].items(), key=lambda x: x[1], reverse=True)[:10]:
        pct = count / stats['total'] * 100
        report.append(f"  {city}: {count} ({pct:.1f}%)")
    report.append("")
    
    # 狀態分佈
    report.append("## 📊 上架狀態")
    for status, count in sorted(stats['by_status'].items(), key=lambda x: x[1], reverse=True):
        pct = count / stats['total'] * 100
        report.append(f"  {status}: {count} ({pct:.1f}%)")
    report.append("")
    
    # 缺少欄位統計
    if stats['missing_fields']:
        report.append("## ⚠️ 缺少欄位統計")
        for field, count in sorted(stats['missing_fields'].items(), key=lambda x: x[1], reverse=True):
            pct = count / stats['total'] * 100
            report.append(f"  {field}: {count} ({pct:.1f}%)")
        report.append("")
    
    # 照片狀態
    report.append("## 📸 照片狀態")
    report.append(f"  有主照片: {stats['has_photos']} ({stats['has_photos']/stats['total']*100:.1f}%)")
    report.append(f"  需要更新: {stats['needs_photo_update']} ({stats['needs_photo_update']/stats['total']*100:.1f}%)")
    report.append("")
    
    report.append("=" * 60)
    
    return "\n".join(report)

def save_venues(venues, file_path):
    """儲存場地資料"""
    print(f"💾 儲存資料: {file_path}")
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(venues, f, ensure_ascii=False, indent=2)
    print(f"✅ 儲存完成: {len(venues)} 筆")

def identify_priority_venues(venues):
    """識別優先處理的場地"""
    priority = {
        'high_value': [],      # 高價值場地（價格 > 50K）
        'incomplete': [],      # 資料不完整
        'missing_photos': [],  # 缺少照片
        'unverified': []       # 未驗證
    }
    
    for venue in venues:
        # 高價值場地
        try:
            price = venue.get('priceFullDay', 0)
            if isinstance(price, str):
                price = float(price.replace(',', '').replace('NT$', ''))
            if price > 50000:
                priority['high_value'].append({
                    'id': venue.get('id'),
                    'name': venue.get('name'),
                    'price': price
                })
        except:
            pass
        
        # 資料不完整
        missing = check_completeness(venue)
        if missing:
            priority['incomplete'].append({
                'id': venue.get('id'),
                'name': venue.get('name'),
                'missing_fields': missing
            })
        
        # 缺少照片
        if not venue.get('images', {}).get('main'):
            priority['missing_photos'].append({
                'id': venue.get('id'),
                'name': venue.get('name')
            })
        
        # 未驗證
        if not venue.get('verified'):
            priority['unverified'].append({
                'id': venue.get('id'),
                'name': venue.get('name')
            })
    
    return priority

def generate_priority_report(priority):
    """生成優先處理報告"""
    report = []
    report.append("=" * 60)
    report.append("🎯 優先處理清單")
    report.append("=" * 60)
    report.append("")
    
    report.append("## 1. 高價值場地（價格 > NT$50,000）")
    report.append(f"共 {len(priority['high_value'])} 筆")
    for v in priority['high_value'][:10]:  # 只顯示前 10 筆
        report.append(f"  [{v['id']}] {v['name']} - NT${v['price']:,}")
    if len(priority['high_value']) > 10:
        report.append(f"  ... 還有 {len(priority['high_value']) - 10} 筆")
    report.append("")
    
    report.append("## 2. 資料不完整場地")
    report.append(f"共 {len(priority['incomplete'])} 筆")
    for v in priority['incomplete'][:10]:
        report.append(f"  [{v['id']}] {v['name']}")
        report.append(f"    缺少: {', '.join(v['missing_fields'])}")
    if len(priority['incomplete']) > 10:
        report.append(f"  ... 還有 {len(priority['incomplete']) - 10} 筆")
    report.append("")
    
    report.append("## 3. 缺少照片場地")
    report.append(f"共 {len(priority['missing_photos'])} 筆")
    for v in priority['missing_photos'][:10]:
        report.append(f"  [{v['id']}] {v['name']}")
    if len(priority['missing_photos']) > 10:
        report.append(f"  ... 還有 {len(priority['missing_photos']) - 10} 筆")
    report.append("")
    
    report.append("## 4. 未驗證場地")
    report.append(f"共 {len(priority['unverified'])} 筆")
    for v in priority['unverified'][:10]:
        report.append(f"  [{v['id']}] {v['name']}")
    if len(priority['unverified']) > 10:
        report.append(f"  ... 還有 {len(priority['unverified']) - 10} 筆")
    report.append("")
    
    report.append("=" * 60)
    
    return "\n".join(report)

def main():
    """主程式"""
    print("🚀 活動大師 - 專業場地資料清理")
    print("")
    
    # 1. 載入資料
    input_file = 'venues-all-cities.json'
    venues = load_venues(input_file)
    print("")
    
    # 2. 分析全部場地
    print("📊 分析全部場地...")
    all_stats = analyze_venues(venues)
    all_report = generate_report(all_stats, "全部場地資料分析")
    print(all_report)
    print("")
    
    # 3. 篩選專業場地
    print("🔍 篩選專業場地...")
    professional, other = filter_professional_venues(venues)
    print(f"  專業場地: {len(professional)} 筆")
    print(f"  其他場地: {len(other)} 筆")
    print("")
    
    # 4. 分析專業場地
    print("📊 分析專業場地...")
    pro_stats = analyze_venues(professional)
    pro_report = generate_report(pro_stats, "專業場地資料分析")
    print(pro_report)
    print("")
    
    # 5. 識別優先處理場地
    print("🎯 識別優先處理場地...")
    priority = identify_priority_venues(professional)
    priority_report = generate_priority_report(priority)
    print(priority_report)
    print("")
    
    # 6. 儲存結果
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    
    # 儲存專業場地
    pro_file = f'venues-professional-{timestamp}.json'
    save_venues(professional, pro_file)
    
    # 儲存其他場地
    other_file = f'venues-other-{timestamp}.json'
    save_venues(other, other_file)
    
    # 儲存優先清單
    priority_file = f'venues-priority-{timestamp}.json'
    save_venues(priority, priority_file)
    
    # 儲存報告
    report_file = f'venues-analysis-report-{timestamp}.txt'
    print(f"💾 儲存報告: {report_file}")
    with open(report_file, 'w', encoding='utf-8') as f:
        f.write(all_report + "\n\n")
        f.write(pro_report + "\n\n")
        f.write(priority_report)
    print(f"✅ 報告已儲存")
    print("")
    
    # 7. 總結
    print("=" * 60)
    print("✅ 資料清理完成")
    print("=" * 60)
    print(f"📊 總場地數: {len(venues)}")
    print(f"🏨 專業場地: {len(professional)} ({len(professional)/len(venues)*100:.1f}%)")
    print(f"✅ 完整資料: {pro_stats['complete']} ({pro_stats['complete']/len(professional)*100:.1f}%)")
    print(f"🔍 已驗證: {pro_stats['verified']} ({pro_stats['verified']/len(professional)*100:.1f}%)")
    print("")
    print("📁 輸出檔案:")
    print(f"  1. {pro_file}")
    print(f"  2. {other_file}")
    print(f"  3. {priority_file}")
    print(f"  4. {report_file}")
    print("=" * 60)

if __name__ == '__main__':
    main()
