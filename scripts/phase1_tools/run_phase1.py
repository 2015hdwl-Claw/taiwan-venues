#!/usr/bin/env python3
"""
活動大師 Phase 1 - 主執行腳本
批次處理待修場地
"""

import json
import time
from pathlib import Path
from datetime import datetime

# 匯入工具
import sys
sys.path.append('/root/.openclaw/workspace/taiwan-venues/scripts/phase1_tools')

# 載入分析結果
ANALYSIS_FILE = Path("/root/.openclaw/workspace/taiwan-venues/scripts/phase1_tools/output/venue_analysis.json")

OUTPUT_DIR = Path("/root/.openclaw/workspace/taiwan-venues/scripts/phase1_tools/output")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

def load_analysis():
    """載入分析結果"""
    with open(ANALYSIS_FILE, 'r', encoding='utf-8') as f:
        return json.load(f)

def main():
    """主執行流程"""
    print("=" * 70)
    print("活動大師 Phase 1 - 工具開發與測試")
    print(f"執行時間: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 70)
    
    # 載入分析結果
    print("\n載入分析結果...")
    analysis = load_analysis()
    
    print(f"\n📊 分析摘要:")
    print(f"  總場地數: {analysis['summary']['total_venues']}")
    print(f"  待修場地: {analysis['summary']['venues_with_issues']}")
    print(f"  缺少照片: {analysis['summary']['missing_photo']}")
    print(f"  缺少 URL: {analysis['summary']['missing_venue_url']}")
    print(f"  兩者都缺: {analysis['summary']['missing_both']}")
    
    print(f"\n📊 場地分類:")
    for vtype, count in sorted(analysis['by_type'].items(), key=lambda x: -x[1]):
        print(f"  {vtype}: {count} 個")
    
    print(f"\n📊 批次規劃:")
    print(f"  總批數: {len(analysis['batches'])} 批")
    
    # 選擇處理模式
    print("\n" + "=" * 70)
    print("選擇處理模式:")
    print("  1. 只分析（顯示統計）")
    print("  2. 測試照片爬蟲（第一批前 5 個）")
    print("  3. 測試 URL 搜尋（第一批前 5 個）")
    print("  4. 完整處理第一批（20 個場地）")
    print("  5. 生成報告")
    print("=" * 70)
    
    mode = input("\n請選擇模式 (1-5): ").strip()
    
    if mode == '1':
        # 只顯示統計
        pass
    
    elif mode == '2':
        # 測試照片爬蟲
        print("\n測試照片爬蟲...")
        batch_1 = analysis['batches'][0]
        test_venues = batch_1['venues'][:5]
        
        from photo_crawler_fast import crawl_venue_photos
        
        print(f"\n測試 {len(test_venues)} 個場地:")
        results = []
        for i, venue in enumerate(test_venues, 1):
                print(f"\n[{i}/{len(test_venues)}] {venue['name']}")
                result = crawl_venue_photos(
                    venue_id=venue['id'],
                    venue_name=venue['name'],
                    url=venue['url']
                )
                results.append(result)
                time.sleep(2)
        
        # 保存測試結果
        test_file = OUTPUT_DIR / "test_photo_crawl.json"
        with open(test_file, 'w', encoding='utf-8') as f:
            json.dump(results, f, ensure_ascii=False, indent=2)
        
        print(f"\n✅ 測試完成")
        print(f"成功: {sum(1 for r in results if r.get('photoUrl'))}")
        print(f"失敗: {sum(1 for r in results if not r.get('photoUrl'))}")
        print(f"結果: {test_file}")
    
    elif mode == '3':
        # 測試 URL 搜尋
        print("\n測試會議室 URL 搜尋...")
        batch_1 = analysis['batches'][0]
        test_venues = batch_1['venues'][:5]
        
        from venue_url_searcher import find_venue_list_url
        
        print(f"\n測試 {len(test_venues)} 個場地:")
        results = []
        for i, venue in enumerate(test_venues, 1):
                print(f"\n[{i}/{len(test_venues)}] {venue['name']}")
                result = find_venue_list_url(venue)
                results.append(result)
                time.sleep(2)
        
        # 保存測試結果
        test_file = OUTPUT_DIR / "test_url_search.json"
        with open(test_file, 'w', encoding='utf-8') as f:
            json.dump(results, f, ensure_ascii=False, indent=2)
        
        print(f"\n✅ 測試完成")
        print(f"成功: {sum(1 for r in results if r.get('venueListUrl'))}")
        print(f"失敗: {sum(1 for r in results if not r.get('venueListUrl'))}")
        print(f"結果: {test_file}")
    
    elif mode == '4':
        # 完整處理第一批
        print("\n完整處理第一批...")
        batch_1 = analysis['batches'][0]
        
        from photo_crawler_fast import crawl_venue_photos
        from venue_url_searcher import find_venue_list_url
        
        results = []
        
        for i, venue in enumerate(batch_1['venues'], 1):
                print(f"\n{'='*60}")
                print(f"[{i}/{len(batch_1['venues'])}] {venue['name']}")
                print(f"{'='*60}")
                
                # 爬取照片
                print("\n📷 爬取照片...")
                photo_result = crawl_venue_photos(
                    venue_id=venue['id'],
                    venue_name=venue['name'],
                    url=venue['url']
                )
                
                # 搜尋 URL
                print("\n🔍 搜尋會議室 URL...")
                url_result = find_venue_list_url(venue)
                
                results.append({
                    'venueId': venue['id'],
                    'name': venue['name'],
                    'city': venue['city'],
                    'venueType': venue['venueType'],
                    'photo': photo_result,
                    'venueUrl': url_result
                })
                
                time.sleep(2)
        
        # 保存完整結果
        output_file = OUTPUT_DIR / "batch_1_complete.json"
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(results, f, ensure_ascii=False, indent=2)
        
        print(f"\n{'='*70}")
        print("第一批處理完成")
        print(f"{'='*70}")
        print(f"總場地: {len(results)}")
        print(f"照片成功: {sum(1 for r in results if r['photo'].get('photoUrl'))}")
        print(f"URL 成功: {sum(1 for r in results if r['venueUrl'].get('venueListUrl'))}")
        print(f"結果: {output_file}")
    
    elif mode == '5':
        # 生成報告
        print("\n生成報告...")
        
        report = {
            'timestamp': datetime.now().isoformat(),
            'summary': analysis['summary'],
            'by_type': analysis['by_type'],
            'by_city': analysis['by_city'],
            'total_batches': len(analysis['batches']),
            'priority_venues_count': len(analysis['priority_venues']),
            'tools': {
                'photo_crawler': '/root/.openclaw/workspace/taiwan-venues/scripts/phase1_tools/photo_crawler_fast.py',
                'url_searcher': '/root/.openclaw/workspace/taiwan-venues/scripts/phase1_tools/venue_url_searcher.py'
            }
        }
        
        report_file = OUTPUT_DIR / "phase1_report.json"
        with open(report_file, 'w', encoding='utf-8') as f:
            json.dump(report, f, ensure_ascii=False, indent=2)
        
        print(f"\n✅ 報告已生成: {report_file}")
    
    else:
        print("無效的模式選擇")
    
    print("\n" + "=" * 70)
    print("Phase 1 工具開發完成")
    print("=" * 70)

if __name__ == '__main__':
    main()
