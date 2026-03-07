#!/usr/bin/env python3
"""
Phase 1 - 資料結構遷移腳本
將扁平化結構遷移為兩層結構（venues + rooms）

使用方式：
    python3 migrate-to-two-layer.py [--dry-run] [--input INPUT_FILE] [--output OUTPUT_DIR]

選項：
    --dry-run         只產生遷移計畫，不實際寫入檔案
    --input           輸入檔案路徑（預設：venues-all-cities.json）
    --output          輸出目錄（預設：./migrated-data）
"""

import json
import sys
import os
from datetime import datetime
from collections import defaultdict
from typing import Dict, List, Any
import argparse
import shutil


class VenueMigration:
    """場地資料遷移器"""
    
    def __init__(self, input_file: str, output_dir: str, dry_run: bool = False):
        self.input_file = input_file
        self.output_dir = output_dir
        self.dry_run = dry_run
        
        self.raw_data = []
        self.venues = {}
        self.rooms = []
        
        self.stats = {
            'total_records': 0,
            'unique_venues': 0,
            'total_rooms': 0,
            'venues_created': 0,
            'rooms_created': 0,
            'errors': []
        }
    
    def load_data(self):
        """載入原始資料"""
        print(f"📂 載入資料：{self.input_file}")
        
        with open(self.input_file, 'r', encoding='utf-8') as f:
            self.raw_data = json.load(f)
        
        self.stats['total_records'] = len(self.raw_data)
        print(f"✅ 載入 {self.stats['total_records']} 筆記錄")
    
    def extract_venues(self):
        """提取唯一場地"""
        print("\n🔍 識別唯一場地...")
        
        # 使用 name 作為場地識別鍵
        venue_groups = defaultdict(list)
        
        for record in self.raw_data:
            venue_name = record.get('name', '').strip()
            if venue_name:
                venue_groups[venue_name].append(record)
        
        self.stats['unique_venues'] = len(venue_groups)
        print(f"✅ 識別到 {self.stats['unique_venues']} 個唯一場地")
        
        # 為每個場地建立 venue 記錄
        venue_id = 1001
        for venue_name, records in sorted(venue_groups.items()):
            venue = self._create_venue(venue_id, records)
            self.venues[venue_id] = venue
            venue_id += 1
        
        self.stats['venues_created'] = len(self.venues)
        print(f"✅ 建立 {self.stats['venues_created']} 個場地記錄")
    
    def _create_venue(self, venue_id: int, records: List[Dict]) -> Dict:
        """從多筆記錄建立單一場地"""
        # 取第一筆作為基礎
        first = records[0]
        
        venue = {
            'id': venue_id,
            'name': first.get('name', ''),
            'venueType': first.get('venueType', '其他'),
            'city': first.get('city', ''),
            'address': first.get('address', ''),
            'contactPerson': self._get_first_non_empty(records, 'contactPerson'),
            'contactPhone': self._get_first_non_empty(records, 'contactPhone'),
            'contactEmail': self._get_first_non_empty(records, 'contactEmail'),
            'url': self._get_first_non_empty(records, 'url'),
            'status': self._merge_status(records),
            'verified': any(r.get('verified', False) for r in records),
            'verifiedAt': self._get_latest_date(records, 'verifiedAt'),
            'verifiedTitle': self._get_first_non_empty(records, 'verifiedTitle'),
            'meetingPageUrl': self._get_first_non_empty(records, 'meetingPageUrl'),
            'venueListUrl': self._get_first_non_empty(records, 'venueListUrl'),
            'roomsCount': len(records),
            'notes': self._merge_notes(records),
            'images': {
                'main': first.get('images', {}).get('main', ''),
                'gallery': first.get('images', {}).get('gallery', [])
            },
            'createdAt': datetime.now().isoformat(),
            'updatedAt': datetime.now().isoformat()
        }
        
        return venue
    
    def _get_first_non_empty(self, records: List[Dict], field: str) -> Any:
        """取得第一個非空值"""
        for record in records:
            value = record.get(field)
            if value and str(value).strip():
                return value
        return ''
    
    def _merge_status(self, records: List[Dict]) -> str:
        """合併狀態：若任一為「上架」→「上架」"""
        for record in records:
            if record.get('status') == '上架':
                return '上架'
        return records[0].get('status', '待修')
    
    def _get_latest_date(self, records: List[Dict], field: str) -> str:
        """取得最新日期"""
        dates = [r.get(field, '') for r in records if r.get(field)]
        return max(dates) if dates else ''
    
    def _merge_notes(self, records: List[Dict]) -> str:
        """合併備註（去重）"""
        notes = set()
        for record in records:
            note = record.get('notes', '').strip()
            if note:
                notes.add(note)
        return ' | '.join(sorted(notes))
    
    def extract_rooms(self):
        """提取會議室並建立關聯"""
        print("\n🏠 建立會議室記錄...")
        
        # 建立場地名稱到 ID 的對照表
        name_to_id = {v['name']: v_id for v_id, v in self.venues.items()}
        
        room_id = 2001
        for record in self.raw_data:
            venue_name = record.get('name', '').strip()
            venue_id = name_to_id.get(venue_name)
            
            if not venue_id:
                self.stats['errors'].append(f"找不到場地：{venue_name}")
                continue
            
            room = self._create_room(room_id, venue_id, record)
            self.rooms.append(room)
            room_id += 1
        
        self.stats['rooms_created'] = len(self.rooms)
        print(f"✅ 建立 {self.stats['rooms_created']} 個會議室記錄")
    
    def _create_room(self, room_id: int, venue_id: int, record: Dict) -> Dict:
        """建立會議室記錄"""
        return {
            'id': room_id,
            'venueId': venue_id,
            'name': record.get('roomName', ''),
            'roomType': record.get('roomType', ''),
            'capacity': {
                'theater': record.get('maxCapacityTheater', 0),
                'classroom': record.get('maxCapacityClassroom', 0)
            },
            'pricing': {
                'halfDay': record.get('priceHalfDay', 0),
                'fullDay': record.get('priceFullDay', 0)
            },
            'availability': {
                'weekday': record.get('availableTimeWeekday', ''),
                'weekend': record.get('availableTimeWeekend', '')
            },
            'equipment': self._parse_equipment(record.get('equipment', '')),
            'images': {
                'main': record.get('images', {}).get('main', ''),
                'gallery': record.get('images', {}).get('gallery', []),
                'floorPlan': record.get('images', {}).get('floorPlan', '')
            },
            'status': '開放' if record.get('status') == '上架' else '維護中',
            'sortOrder': 0,
            'createdAt': datetime.now().isoformat(),
            'updatedAt': datetime.now().isoformat()
        }
    
    def _parse_equipment(self, equipment_str: str) -> List[str]:
        """解析設備字串為清單"""
        if not equipment_str:
            return []
        
        # 常見分隔符：中文頓號、逗號、空格
        separators = ['、', '，', ',', ' ']
        
        for sep in separators:
            if sep in equipment_str:
                return [item.strip() for item in equipment_str.split(sep) if item.strip()]
        
        # 若無分隔符，視為單一設備
        return [equipment_str.strip()] if equipment_str.strip() else []
    
    def validate(self):
        """驗證資料完整性"""
        print("\n✅ 驗證資料完整性...")
        
        errors = []
        
        # 檢查所有會議室都有對應的場地
        venue_ids = set(self.venues.keys())
        for room in self.rooms:
            if room['venueId'] not in venue_ids:
                errors.append(f"會議室 {room['id']} 的場地 {room['venueId']} 不存在")
        
        # 檢查場地都有至少一個會議室
        rooms_by_venue = defaultdict(int)
        for room in self.rooms:
            rooms_by_venue[room['venueId']] += 1
        
        for venue_id in venue_ids:
            if rooms_by_venue[venue_id] == 0:
                errors.append(f"場地 {venue_id} 沒有任何會議室")
        
        # 檢查必填欄位
        for venue in self.venues.values():
            if not venue['name']:
                errors.append(f"場地 {venue['id']} 缺少名稱")
            if not venue['city']:
                errors.append(f"場地 {venue['id']} ({venue['name']}) 缺少城市")
        
        for room in self.rooms:
            if not room['name']:
                errors.append(f"會議室 {room['id']} 缺少名稱")
        
        self.stats['errors'].extend(errors)
        
        if errors:
            print(f"⚠️  發現 {len(errors)} 個錯誤：")
            for error in errors[:10]:  # 只顯示前 10 個
                print(f"   - {error}")
            if len(errors) > 10:
                print(f"   ... 還有 {len(errors) - 10} 個錯誤")
        else:
            print("✅ 資料完整性檢查通過")
    
    def save(self):
        """儲存遷移後的資料"""
        if self.dry_run:
            print("\n⚠️  DRY RUN 模式：不會實際寫入檔案")
            return
        
        print(f"\n💾 儲存資料到：{self.output_dir}")
        
        # 建立輸出目錄
        os.makedirs(self.output_dir, exist_ok=True)
        
        # 儲存 venues
        venues_list = sorted(self.venues.values(), key=lambda v: (v['city'], v['name']))
        venues_file = os.path.join(self.output_dir, 'venues.json')
        with open(venues_file, 'w', encoding='utf-8') as f:
            json.dump(venues_list, f, ensure_ascii=False, indent=2)
        print(f"   ✅ venues.json ({len(venues_list)} 筆)")
        
        # 儲存 rooms
        rooms_list = sorted(self.rooms, key=lambda r: (r['venueId'], r['name']))
        rooms_file = os.path.join(self.output_dir, 'rooms.json')
        with open(rooms_file, 'w', encoding='utf-8') as f:
            json.dump(rooms_list, f, ensure_ascii=False, indent=2)
        print(f"   ✅ rooms.json ({len(rooms_list)} 筆)")
        
        # 儲存統計資訊
        stats_file = os.path.join(self.output_dir, 'migration-stats.json')
        with open(stats_file, 'w', encoding='utf-8') as f:
            json.dump(self.stats, f, ensure_ascii=False, indent=2)
        print(f"   ✅ migration-stats.json")
    
    def print_summary(self):
        """列印遷移摘要"""
        print("\n" + "=" * 60)
        print("📊 遷移摘要")
        print("=" * 60)
        print(f"原始記錄數：     {self.stats['total_records']:>6} 筆")
        print(f"唯一場地數：     {self.stats['unique_venues']:>6} 個")
        print(f"─────────────────────────────")
        print(f"建立場地數：     {self.stats['venues_created']:>6} 個")
        print(f"建立會議室數：   {self.stats['rooms_created']:>6} 個")
        print(f"─────────────────────────────")
        print(f"錯誤數：         {len(self.stats['errors']):>6} 個")
        print("=" * 60)
    
    def run(self):
        """執行完整遷移流程"""
        print("=" * 60)
        print("🚀 Phase 1 - 資料結構遷移")
        print("=" * 60)
        
        # 1. 載入資料
        self.load_data()
        
        # 2. 提取場地
        self.extract_venues()
        
        # 3. 提取會議室
        self.extract_rooms()
        
        # 4. 驗證
        self.validate()
        
        # 5. 儲存
        self.save()
        
        # 6. 摘要
        self.print_summary()
        
        return len(self.stats['errors']) == 0


def backup_original_file(input_file: str):
    """備份原始檔案"""
    timestamp = datetime.now().strftime('%Y%m%d-%H%M%S')
    backup_file = f"{input_file}.backup-{timestamp}"
    
    shutil.copy2(input_file, backup_file)
    print(f"✅ 已備份原始檔案：{backup_file}")
    return backup_file


def main():
    parser = argparse.ArgumentParser(
        description='將扁平化場地資料遷移為兩層結構（venues + rooms）'
    )
    parser.add_argument(
        '--dry-run',
        action='store_true',
        help='只產生遷移計畫，不實際寫入檔案'
    )
    parser.add_argument(
        '--input',
        default='venues-all-cities.json',
        help='輸入檔案路徑（預設：venues-all-cities.json）'
    )
    parser.add_argument(
        '--output',
        default='./migrated-data',
        help='輸出目錄（預設：./migrated-data）'
    )
    parser.add_argument(
        '--backup',
        action='store_true',
        help='備份原始檔案'
    )
    
    args = parser.parse_args()
    
    # 檢查輸入檔案
    if not os.path.exists(args.input):
        print(f"❌ 錯誤：找不到輸入檔案 {args.input}")
        sys.exit(1)
    
    # 備份（如果需要）
    if args.backup and not args.dry_run:
        backup_original_file(args.input)
    
    # 執行遷移
    migration = VenueMigration(
        input_file=args.input,
        output_dir=args.output,
        dry_run=args.dry_run
    )
    
    success = migration.run()
    
    sys.exit(0 if success else 1)


if __name__ == '__main__':
    main()
