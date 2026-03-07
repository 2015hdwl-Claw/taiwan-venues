# Phase 1 - 測試計畫

> **日期**：2026-03-07
> **目標**：確保資料遷移的正確性和完整性

---

## 一、測試環境

### 1.1 測試資料準備

**方式 A：完整資料測試**
- 使用 `venues-all-cities.json` 完整資料
- 優點：真實場景
- 缺點：可能較難追蹤問題

**方式 B：抽樣測試**
- 建立小型測試資料集（10-20 筆）
- 包含各種邊界情況
- 優點：容易驗證
- 缺點：可能遺漏特殊情況

**建議**：先執行抽樣測試，再執行完整測試

### 1.2 測試資料集

建立 `test-sample.json`：

```json
[
  {
    "id": 1001,
    "name": "測試場地 A",
    "roomName": "會議室 1",
    "venueType": "飯店場地",
    "city": "台北市",
    "address": "台北市信義區信義路五段7號",
    "contactPhone": "02-12345678",
    "contactEmail": "test-a@example.com",
    "priceHalfDay": 10000,
    "priceFullDay": 18000,
    "maxCapacityTheater": 100,
    "maxCapacityClassroom": 60,
    "status": "上架",
    "verified": true
  },
  {
    "id": 1002,
    "name": "測試場地 A",
    "roomName": "會議室 2",
    "venueType": "飯店場地",
    "city": "台北市",
    "address": "台北市信義區信義路五段7號",
    "contactPhone": "02-12345678",
    "contactEmail": "test-a@example.com",
    "priceHalfDay": 15000,
    "priceFullDay": 28000,
    "maxCapacityTheater": 150,
    "maxCapacityClassroom": 90,
    "status": "上架",
    "verified": false
  },
  {
    "id": 1003,
    "name": "測試場地 B",
    "roomName": "宴會廳",
    "venueType": "會議中心",
    "city": "新北市",
    "address": "新北市板橋區縣民大道二段7號",
    "contactPhone": "02-87654321",
    "contactEmail": "test-b@example.com",
    "priceHalfDay": 20000,
    "priceFullDay": 35000,
    "maxCapacityTheater": 200,
    "maxCapacityClassroom": 120,
    "status": "下架",
    "verified": true
  },
  {
    "id": 1004,
    "name": "測試場地 C",
    "roomName": null,
    "venueType": "展演場地",
    "city": "台中市",
    "address": "台中市西屯區台灣大道三段",
    "contactPhone": null,
    "contactEmail": null,
    "priceHalfDay": 0,
    "priceFullDay": 0,
    "maxCapacityTheater": 0,
    "maxCapacityClassroom": 0,
    "status": "待修",
    "verified": false
  }
]
```

**測試要點**：
- ✅ 場地 A 有 2 個會議室（測試多會議室合併）
- ✅ 場地 B 只有 1 個會議室（測試基本情況）
- ✅ 場地 C 資料不完整（測試空值處理）
- ✅ 不同的狀態（上架/下架/待修）
- ✅ 不同的驗證狀態

---

## 二、測試案例

### 2.1 資料遷移測試

| 編號 | 測試項目 | 預期結果 | 驗證方式 |
|------|---------|---------|---------|
| TC-01 | 場地數量正確 | 3 個唯一場地 | `len(venues) == 3` |
| TC-02 | 會議室數量正確 | 4 個會議室 | `len(rooms) == 4` |
| TC-03 | 場地 A 有 2 個會議室 | venue.roomsCount == 2 | 檢查 venue 記錄 |
| TC-04 | 場地 B 有 1 個會議室 | venue.roomsCount == 1 | 檢查 venue 記錄 |
| TC-05 | 場地 C 有 1 個會議室 | venue.roomsCount == 1 | 檢查 venue 記錄 |
| TC-06 | 所有會議室都有 venueId | 每個 room 都有有效的 venueId | 檢查外鍵完整性 |
| TC-07 | 場地 A 的 verified 為 true | 任一記錄 verified=true → true | 檢查 venue.verified |
| TC-08 | 場地 A 的 status 為「上架」 | 任一記錄 status=上架 → 上架 | 檢查 venue.status |
| TC-09 | 空值正確處理 | 場地 C 的 contactPhone 為空字串 | 檢查空值欄位 |
| TC-10 | ID 不重複 | 所有 venue.id 和 room.id 唯一 | 檢查 ID 唯一性 |

### 2.2 資料完整性測試

| 編號 | 測試項目 | 預期結果 |
|------|---------|---------|
| TC-11 | 所有 venue 都有 name | ✅ |
| TC-12 | 所有 venue 都有 city | ✅ |
| TC-13 | 所有 venue 都有 address | ✅ |
| TC-14 | 所有 venue 都有 venueType | ✅ |
| TC-15 | 所有 room 都有 name | ⚠️ （場地 C 的 roomName 為 null） |
| TC-16 | 所有 room 都有有效的 venueId | ✅ |

### 2.3 資料轉換測試

| 編號 | 測試項目 | 輸入 | 預期輸出 |
|------|---------|------|---------|
| TC-17 | equipment 字串轉陣列 | "投影設備、音響" | ["投影設備", "音響"] |
| TC-18 | equipment 空字串 | "" | [] |
| TC-19 | capacity 結構化 | maxCapacityTheater: 100 | capacity.theater: 100 |
| TC-20 | pricing 結構化 | priceHalfDay: 10000 | pricing.halfDay: 10000 |
| TC-21 | status 映射 | status: "上架" | room.status: "開放" |
| TC-22 | status 映射 | status: "下架" | room.status: "維護中" |

### 2.4 邊界情況測試

| 編號 | 測試項目 | 說明 |
|------|---------|------|
| TC-23 | 場地名稱完全相同 | 應合併為同一場地 |
| TC-24 | 場地名稱相似但不相同 | 應視為不同場地 |
| TC-25 | 會議室名稱為 null | 應轉為空字串 |
| TC-26 | 價格為 0 | 應保留 0，不轉為 null |
| TC-27 | 容納人數為 0 | 應保留 0，不轉為 null |

---

## 三、測試執行

### 3.1 自動化測試腳本

建立 `test-migration.py`：

```python
#!/usr/bin/env python3
"""測試遷移腳本"""

import json
import sys
from collections import defaultdict

def load_json(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        return json.load(f)

def test_venue_count(venues, expected):
    """TC-01: 場地數量正確"""
    actual = len(venues)
    passed = actual == expected
    print(f"TC-01: 場地數量 - {'✅' if passed else '❌'} (預期: {expected}, 實際: {actual})")
    return passed

def test_room_count(rooms, expected):
    """TC-02: 會議室數量正確"""
    actual = len(rooms)
    passed = actual == expected
    print(f"TC-02: 會議室數量 - {'✅' if passed else '❌'} (預期: {expected}, 實際: {actual})")
    return passed

def test_venue_rooms_count(venues, rooms):
    """TC-03~05: 場地的會議室數量"""
    passed = True
    rooms_by_venue = defaultdict(list)
    for room in rooms:
        rooms_by_venue[room['venueId']].append(room)
    
    for venue in venues:
        expected = venue['roomsCount']
        actual = len(rooms_by_venue[venue['id']])
        match = expected == actual
        print(f"TC-03~05: {venue['name']} 會議室數量 - {'✅' if match else '❌'} (預期: {expected}, 實際: {actual})")
        passed = passed and match
    
    return passed

def test_foreign_key_integrity(venues, rooms):
    """TC-06: 外鍵完整性"""
    venue_ids = {v['id'] for v in venues}
    passed = all(r['venueId'] in venue_ids for r in rooms)
    invalid = [r for r in rooms if r['venueId'] not in venue_ids]
    print(f"TC-06: 外鍵完整性 - {'✅' if passed else '❌'} (無效: {len(invalid)})")
    return passed

def test_id_uniqueness(venues, rooms):
    """TC-10: ID 唯一性"""
    venue_ids = [v['id'] for v in venues]
    room_ids = [r['id'] for r in rooms]
    
    venue_unique = len(venue_ids) == len(set(venue_ids))
    room_unique = len(room_ids) == len(set(room_ids))
    no_overlap = len(set(venue_ids) & set(room_ids)) == 0
    
    passed = venue_unique and room_unique and no_overlap
    print(f"TC-10: ID 唯一性 - {'✅' if passed else '❌'}")
    return passed

def test_required_fields(venues, rooms):
    """TC-11~16: 必填欄位"""
    passed = True
    
    # 檢查 venues
    for venue in venues:
        if not venue['name']:
            print(f"TC-11: 場地 {venue['id']} 缺少 name - ❌")
            passed = False
        if not venue['city']:
            print(f"TC-12: 場地 {venue['id']} 缺少 city - ❌")
            passed = False
    
    # 檢查 rooms
    for room in rooms:
        if not room['name']:
            print(f"TC-15: 會議室 {room['id']} 缺少 name - ⚠️")
    
    print(f"TC-11~16: 必填欄位檢查 - {'✅' if passed else '❌'}")
    return passed

def run_tests(venues_file, rooms_file):
    """執行所有測試"""
    print("=" * 60)
    print("🧪 執行測試")
    print("=" * 60)
    
    venues = load_json(venues_file)
    rooms = load_json(rooms_file)
    
    results = []
    results.append(test_venue_count(venues, 3))
    results.append(test_room_count(rooms, 4))
    results.append(test_venue_rooms_count(venues, rooms))
    results.append(test_foreign_key_integrity(venues, rooms))
    results.append(test_id_uniqueness(venues, rooms))
    results.append(test_required_fields(venues, rooms))
    
    print("=" * 60)
    total = len(results)
    passed = sum(results)
    print(f"測試結果：{passed}/{total} 通過")
    print("=" * 60)
    
    return all(results)

if __name__ == '__main__':
    if len(sys.argv) < 3:
        print("使用方式：python3 test-migration.py <venues.json> <rooms.json>")
        sys.exit(1)
    
    success = run_tests(sys.argv[1], sys.argv[2])
    sys.exit(0 if success else 1)
```

### 3.2 執行步驟

#### 步驟 1：準備測試資料
```bash
# 建立測試資料集
cat > taiwan-venues/test-sample.json << 'EOF'
[... 測試資料 ...]
EOF
```

#### 步驟 2：執行遷移（dry-run）
```bash
cd taiwan-venues
python3 migrate-to-two-layer.py --dry-run --input test-sample.json
```

#### 步驟 3：執行遷移（實際）
```bash
python3 migrate-to-two-layer.py --input test-sample.json --output ./test-output
```

#### 步驟 4：執行測試
```bash
python3 test-migration.py ./test-output/venues.json ./test-output/rooms.json
```

#### 步驟 5：檢查結果
```bash
# 查看場地
cat ./test-output/venues.json | python3 -m json.tool | head -50

# 查看會議室
cat ./test-output/rooms.json | python3 -m json.tool | head -50

# 查看統計
cat ./test-output/migration-stats.json | python3 -m json.tool
```

---

## 四、完整資料測試

### 4.1 執行步驟

```bash
# 1. 備份原始檔案
cp taiwan-venues/venues-all-cities.json taiwan-venues/venues-all-cities-backup-$(date +%Y%m%d).json

# 2. 執行遷移（dry-run）
cd taiwan-venues
python3 migrate-to-two-layer.py --dry-run

# 3. 執行遷移（實際）
python3 migrate-to-two-layer.py --backup --output ./migrated-data

# 4. 驗證結果
python3 test-migration.py ./migrated-data/venues.json ./migrated-data/rooms.json

# 5. 檢查統計
cat ./migrated-data/migration-stats.json
```

### 4.2 預期結果

```
原始記錄數：      526 筆
唯一場地數：      361 個
─────────────────────────────
建立場地數：      361 個
建立會議室數：    526 筆
─────────────────────────────
錯誤數：          0 個
```

---

## 五、迴歸測試

### 5.1 API 相容性測試

**舊 API**：
```bash
# 搜尋台北市場地
curl "http://localhost:3000/api/venues?city=台北市"
```

**新 API**：
```bash
# 搜尋台北市場地
curl "http://localhost:3000/api/venues?city=台北市"

# 取得單一場地（含會議室）
curl "http://localhost:3000/api/venues/1001"

# 取得場地的會議室
curl "http://localhost:3000/api/venues/1001/rooms"
```

### 5.2 前台顯示測試

- [ ] 場地列表頁正常顯示
- [ ] 場地詳情頁顯示所有會議室
- [ ] 搜尋功能正常
- [ ] 篩選功能正常（城市、類型、容納人數）
- [ ] 價格顯示正確

### 5.3 後台管理測試

- [ ] 場地列表頁正常顯示
- [ ] 新增場地功能正常
- [ ] 編輯場地功能正常
- [ ] 新增會議室功能正常
- [ ] 編輯會議室功能正常
- [ ] 刪除場地時檢查關聯會議室

---

## 六、效能測試

### 6.1 查詢效能

| 查詢類型 | 預期時間 |
|---------|---------|
| 取得所有場地 | < 100ms |
| 取得單一場地 | < 50ms |
| 取得場地的會議室 | < 50ms |
| 搜尋場地（城市） | < 200ms |
| 搜尋場地（關鍵字） | < 500ms |

### 6.2 資料大小

| 檔案 | 原始大小 | 遷移後大小 |
|------|---------|-----------|
| venues-all-cities.json | ~X MB | - |
| venues.json | - | ~Y MB |
| rooms.json | - | ~Z MB |

---

## 七、驗收標準

### 7.1 必須通過

- ✅ 所有測試案例通過（TC-01 ~ TC-27）
- ✅ 資料完整性檢查通過
- ✅ 外鍵關聯正確
- ✅ 無資料遺失

### 7.2 建議通過

- ⚠️ 空值處理合理（roomName 為 null 的情況）
- ⚠️ 效能符合預期
- ⚠️ API 回應時間 < 500ms

---

## 八、問題追蹤

| 問題編號 | 描述 | 狀態 | 解決方案 |
|---------|------|------|---------|
| | | | |

---

_建立日期：2026-03-07_
_最後更新：2026-03-07_
