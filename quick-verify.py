#!/usr/bin/env python3
"""
快速驗證腳本 - 檢查遷移後的資料完整性
"""

import json
import sys
from collections import defaultdict


def load_json(file_path):
    """載入 JSON 檔案"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        print(f"❌ 找不到檔案：{file_path}")
        return None
    except json.JSONDecodeError as e:
        print(f"❌ JSON 解析錯誤：{file_path}")
        print(f"   錯誤：{e}")
        return None


def check_venue_room_relationship(venues, rooms):
    """檢查場地和會議室的關聯"""
    print("\n🔗 檢查場地-會議室關聯...")
    
    venue_ids = {v['id'] for v in venues}
    rooms_by_venue = defaultdict(list)
    
    errors = []
    for room in rooms:
        if room['venueId'] not in venue_ids:
            errors.append(f"會議室 {room['id']} 的場地 {room['venueId']} 不存在")
        else:
            rooms_by_venue[room['venueId']].append(room)
    
    # 檢查場地的 roomsCount 是否正確
    for venue in venues:
        actual = len(rooms_by_venue[venue['id']])
        expected = venue.get('roomsCount', 0)
        if actual != expected:
            errors.append(f"場地 {venue['id']} ({venue['name']}) roomsCount 不正確（預期: {expected}, 實際: {actual}）")
    
    if errors:
        print(f"❌ 發現 {len(errors)} 個錯誤：")
        for error in errors[:5]:
            print(f"   - {error}")
        if len(errors) > 5:
            print(f"   ... 還有 {len(errors) - 5} 個錯誤")
        return False
    else:
        print("✅ 關聯檢查通過")
        return True


def check_required_fields(venues, rooms):
    """檢查必填欄位"""
    print("\n📝 檢查必填欄位...")
    
    errors = []
    warnings = []
    
    # 檢查 venues
    for venue in venues:
        if not venue.get('name'):
            errors.append(f"場地 {venue.get('id')} 缺少 name")
        if not venue.get('city'):
            errors.append(f"場地 {venue.get('id')} ({venue.get('name')}) 缺少 city")
        if not venue.get('venueType'):
            warnings.append(f"場地 {venue.get('id')} ({venue.get('name')}) 缺少 venueType")
    
    # 檢查 rooms
    for room in rooms:
        if not room.get('name'):
            warnings.append(f"會議室 {room.get('id')} 缺少 name")
        if room.get('venueId') is None:
            errors.append(f"會議室 {room.get('id')} 缺少 venueId")
    
    if errors:
        print(f"❌ 發現 {len(errors)} 個錯誤：")
        for error in errors[:5]:
            print(f"   - {error}")
    
    if warnings:
        print(f"⚠️  發現 {len(warnings)} 個警告：")
        for warning in warnings[:5]:
            print(f"   - {warning}")
    
    if not errors:
        print("✅ 必填欄位檢查通過")
        return True
    else:
        return False


def check_data_quality(venues, rooms):
    """檢查資料品質"""
    print("\n🔍 檢查資料品質...")
    
    issues = []
    
    # 檢查重複的場地名稱
    venue_names = [v['name'] for v in venues]
    duplicates = [name for name in set(venue_names) if venue_names.count(name) > 1]
    if duplicates:
        issues.append(f"發現 {len(duplicates)} 個重複的場地名稱")
    
    # 檢查價格異常
    zero_price_rooms = [r for r in rooms if r['pricing']['halfDay'] == 0 and r['pricing']['fullDay'] == 0]
    if zero_price_rooms:
        issues.append(f"發現 {len(zero_price_rooms)} 個價格為 0 的會議室")
    
    # 檢查容納人數異常
    zero_capacity_rooms = [r for r in rooms if r['capacity']['theater'] == 0 and r['capacity']['classroom'] == 0]
    if zero_capacity_rooms:
        issues.append(f"發現 {len(zero_capacity_rooms)} 個容納人數為 0 的會議室")
    
    if issues:
        print("⚠️  資料品質問題：")
        for issue in issues:
            print(f"   - {issue}")
    else:
        print("✅ 資料品質良好")
    
    return len(issues) == 0


def print_statistics(venues, rooms):
    """列印統計資訊"""
    print("\n📊 資料統計")
    print("=" * 60)
    print(f"場地總數：         {len(venues):>6} 個")
    print(f"會議室總數：       {len(rooms):>6} 個")
    print(f"平均每場地會議室： {len(rooms) / len(venues):>6.2f} 個")
    
    # 場地類型分佈
    type_dist = defaultdict(int)
    for venue in venues:
        type_dist[venue.get('venueType', '未知')] += 1
    
    print("\n場地類型分佈：")
    for vtype, count in sorted(type_dist.items(), key=lambda x: x[1], reverse=True):
        print(f"   {vtype:<10} {count:>4} 個")
    
    # 城市分佈
    city_dist = defaultdict(int)
    for venue in venues:
        city_dist[venue.get('city', '未知')] += 1
    
    print("\n城市分佈（Top 10）：")
    for city, count in sorted(city_dist.items(), key=lambda x: x[1], reverse=True)[:10]:
        print(f"   {city:<10} {count:>4} 個")
    
    # 狀態分佈
    status_dist = defaultdict(int)
    for venue in venues:
        status_dist[venue.get('status', '未知')] += 1
    
    print("\n場地狀態分佈：")
    for status, count in sorted(status_dist.items(), key=lambda x: x[1], reverse=True):
        print(f"   {status:<10} {count:>4} 個")
    
    print("=" * 60)


def main():
    if len(sys.argv) < 3:
        print("使用方式：python3 quick-verify.py <venues.json> <rooms.json>")
        print("範例：python3 quick-verify.py ./migrated-data/venues.json ./migrated-data/rooms.json")
        sys.exit(1)
    
    venues_file = sys.argv[1]
    rooms_file = sys.argv[2]
    
    print("=" * 60)
    print("🔍 快速驗證 - 活動大師 Phase 1")
    print("=" * 60)
    
    # 載入資料
    print(f"\n📂 載入 venues：{venues_file}")
    venues = load_json(venues_file)
    if venues is None:
        sys.exit(1)
    
    print(f"📂 載入 rooms：{rooms_file}")
    rooms = load_json(rooms_file)
    if rooms is None:
        sys.exit(1)
    
    # 執行檢查
    results = []
    results.append(check_venue_room_relationship(venues, rooms))
    results.append(check_required_fields(venues, rooms))
    results.append(check_data_quality(venues, rooms))
    
    # 列印統計
    print_statistics(venues, rooms)
    
    # 總結
    print("\n" + "=" * 60)
    if all(results):
        print("✅ 所有檢查通過！資料遷移成功。")
        sys.exit(0)
    else:
        print("❌ 部分檢查未通過，請檢查錯誤訊息。")
        sys.exit(1)


if __name__ == '__main__':
    main()
