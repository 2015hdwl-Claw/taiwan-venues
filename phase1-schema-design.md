# Phase 1 - 資料結構重構設計書

> **日期**：2026-03-07
> **目標**：將扁平化結構改為兩層結構（venues + rooms）

---

## 一、現況分析

### 現有結構
- **總記錄數**：526 筆
- **唯一場地數**：361 個
- **平均每場地會議室數**：1.45 個
- **問題**：同一場地的資訊（地址、電話、email）重複存放在每個會議室記錄中

### 現有欄位分類

#### 場地層級欄位（不應重複）
- `name` - 場地名稱
- `venueType` - 場地類型（飯店場地/展演場地/會議中心）
- `city` - 城市
- `address` - 地址
- `contactPerson` - 聯絡人
- `contactPhone` - 聯絡電話
- `contactEmail` - 聯絡信箱
- `url` - 官網
- `status` - 狀態（上架/下架/待修）
- `verified` - 是否驗證
- `verifiedAt` - 驗證日期

#### 會議室層級欄位（每個會議室不同）
- `roomName` - 會議室名稱
- `roomType` - 會議室類型
- `priceHalfDay` - 半天價格
- `priceFullDay` - 全天價格
- `maxCapacityTheater` - 劇院式容納人數
- `maxCapacityClassroom` - 教室式容納人數
- `availableTimeWeekday` - 平日可用時間
- `availableTimeWeekend` - 假日可用時間
- `equipment` - 設備
- `images` - 照片（可能有會議室專屬照片）

---

## 二、新 Schema 設計

### 2.1 venues 表（場地層級）

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Venue",
  "type": "object",
  "required": ["id", "name", "venueType", "city", "address"],
  "properties": {
    "id": {
      "type": "integer",
      "description": "場地唯一識別碼（從現有 ID 提取或重新編號）"
    },
    "name": {
      "type": "string",
      "description": "場地名稱"
    },
    "venueType": {
      "type": "string",
      "enum": ["飯店場地", "展演場地", "會議中心", "政府場地", "學校場地", "其他"],
      "description": "場地類型"
    },
    "city": {
      "type": "string",
      "description": "城市"
    },
    "district": {
      "type": "string",
      "description": "行政區（可選）"
    },
    "address": {
      "type": "string",
      "description": "完整地址"
    },
    "contactPerson": {
      "type": "string",
      "description": "聯絡人/部門"
    },
    "contactPhone": {
      "type": "string",
      "description": "聯絡電話"
    },
    "contactEmail": {
      "type": "string",
      "description": "聯絡信箱"
    },
    "url": {
      "type": "string",
      "format": "uri",
      "description": "官方網站"
    },
    "status": {
      "type": "string",
      "enum": ["上架", "下架", "待修"],
      "default": "上架"
    },
    "verified": {
      "type": "boolean",
      "default": false
    },
    "verifiedAt": {
      "type": "string",
      "format": "date",
      "description": "最後驗證日期"
    },
    "verifiedTitle": {
      "type": "string",
      "description": "驗證時網頁標題"
    },
    "meetingPageUrl": {
      "type": "string",
      "description": "會議室介紹頁面"
    },
    "venueListUrl": {
      "type": "string",
      "description": "會議室列表頁面"
    },
    "roomsCount": {
      "type": "integer",
      "default": 0,
      "description": "會議室數量"
    },
    "notes": {
      "type": "string",
      "description": "備註"
    },
    "images": {
      "type": "object",
      "properties": {
        "main": {
          "type": "string",
          "description": "場地主照片"
        },
        "gallery": {
          "type": "array",
          "items": { "type": "string" },
          "description": "場地照片集"
        }
      }
    },
    "geolocation": {
      "type": "object",
      "properties": {
        "lat": { "type": "number" },
        "lng": { "type": "number" }
      },
      "description": "GPS 座標（可選）"
    },
    "createdAt": {
      "type": "string",
      "format": "date-time"
    },
    "updatedAt": {
      "type": "string",
      "format": "date-time"
    }
  }
}
```

### 2.2 rooms 表（會議室層級）

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Room",
  "type": "object",
  "required": ["id", "venueId", "name"],
  "properties": {
    "id": {
      "type": "integer",
      "description": "會議室唯一識別碼"
    },
    "venueId": {
      "type": "integer",
      "description": "所屬場地 ID（外鍵）"
    },
    "name": {
      "type": "string",
      "description": "會議室名稱"
    },
    "roomType": {
      "type": "string",
      "description": "會議室類型（宴會廳/會議室/展演廳等）"
    },
    "capacity": {
      "type": "object",
      "properties": {
        "theater": {
          "type": "integer",
          "description": "劇院式容納人數"
        },
        "classroom": {
          "type": "integer",
          "description": "教室式容納人數"
        },
        "banquet": {
          "type": "integer",
          "description": "宴會式容納人數（可選）"
        }
      }
    },
    "pricing": {
      "type": "object",
      "properties": {
        "halfDay": {
          "type": "integer",
          "description": "半天價格"
        },
        "fullDay": {
          "type": "integer",
          "description": "全天價格"
        },
        "hourly": {
          "type": "integer",
          "description": "每小時價格（可選）"
        },
        "note": {
          "type": "string",
          "description": "價格備註"
        }
      }
    },
    "availability": {
      "type": "object",
      "properties": {
        "weekday": {
          "type": "string",
          "description": "平日可用時間"
        },
        "weekend": {
          "type": "string",
          "description": "假日可用時間"
        }
      }
    },
    "equipment": {
      "type": "array",
      "items": { "type": "string" },
      "description": "設備清單"
    },
    "size": {
      "type": "object",
      "properties": {
        "length": { "type": "number" },
        "width": { "type": "number" },
        "unit": { "type": "string", "default": "公尺" }
      },
      "description": "會議室尺寸（可選）"
    },
    "images": {
      "type": "object",
      "properties": {
        "main": {
          "type": "string",
          "description": "會議室主照片"
        },
        "gallery": {
          "type": "array",
          "items": { "type": "string" },
          "description": "會議室照片集"
        },
        "floorPlan": {
          "type": "string",
          "description": "平面圖"
        }
      }
    },
    "status": {
      "type": "string",
      "enum": ["開放", "維護中", "已停用"],
      "default": "開放"
    },
    "sortOrder": {
      "type": "integer",
      "default": 0,
      "description": "排序順序"
    },
    "createdAt": {
      "type": "string",
      "format": "date-time"
    },
    "updatedAt": {
      "type": "string",
      "format": "date-time"
    }
  }
}
```

---

## 三、遷移策略

### 3.1 識別唯一場地

**策略**：使用 `name` 欄位作為場地識別依據
- 同一 `name` 的記錄屬於同一場地
- 注意：需要處理名稱相似但不完全相同的情況（如「涵碧樓」vs「涵碧樓 The Lalu」）

**替代方案**：使用組合鍵
- `name` + `address` 組合判斷
- 更嚴謹，但可能過度分割

### 3.2 ID 重新編號

**場地 ID (venue_id)**：
- 從 1001 開始
- 按 `city` + `name` 排序
- 確保唯一性

**會議室 ID (room_id)**：
- 從 2001 開始
- 按所屬場地 ID + `roomName` 排序

### 3.3 資料合併規則

對於同一場地的多個記錄：

| 欄位 | 合併規則 |
|------|---------|
| `contactPerson` | 取第一筆非空值 |
| `contactPhone` | 取第一筆非空值 |
| `contactEmail` | 取第一筆非空值 |
| `url` | 取第一筆非空值 |
| `status` | 若任一為「上架」→「上架」，否則取第一筆 |
| `verified` | 若任一為 true → true |
| `verifiedAt` | 取最新日期 |
| `notes` | 合併所有非空值（去重） |

### 3.4 備份策略

1. **完整備份**
   ```bash
   cp venues-all-cities.json venues-all-cities-backup-$(date +%Y%m%d).json
   ```

2. **版本控制**
   - 在 Git 中建立分支 `feature/phase1-schema-migration`
   - 所有變更先提交到分支

3. **驗證點**
   - 遷移前：記錄總數、唯一場地數
   - 遷移後：venues 數、rooms 數、關聯完整性

---

## 四、前台/後台影響評估

### 4.1 前台（用戶端）

**影響**：中等

| 功能 | 需要調整 |
|------|---------|
| 場地搜尋 | 需改為查詢 venues 表 |
| 場地詳情頁 | 需同時載入 venue + rooms |
| 會議室列表 | 需透過 venue_id 過濾 |
| 價格顯示 | 改為讀取 rooms.pricing |
| 篩選功能 | 可能需要調整查詢邏輯 |

**API 變更**：
```javascript
// 舊 API
GET /api/venues  // 返回所有記錄（含重複場地資訊）

// 新 API
GET /api/venues          // 返回場地列表
GET /api/venues/:id      // 返回單一場地（含 rooms）
GET /api/venues/:id/rooms // 返回該場地的所有會議室
```

### 4.2 後台（管理端）

**影響**：較大

| 功能 | 需要調整 |
|------|---------|
| 場地管理 | 改為兩層管理（先選場地，再選會議室）|
| 新增場地 | 需分兩步：先建場地，再建會議室 |
| 編輯場地資訊 | 只需改一次（venue 層級）|
| 批次匯入 | 需調整匯入邏輯 |
| 資料驗證 | 需驗證 venue_id 外鍵完整性 |

**UI 變更建議**：
```
場地管理
├── 場地列表
│   ├── [新增場地]
│   └── 場地卡片
│       ├── 場地名稱、地址、聯絡資訊
│       ├── 會議室數量
│       └── [查看會議室] [編輯] [刪除]
│
└── 會議室管理（某場地下）
    ├── [新增會議室]
    └── 會議室卡片
        ├── 會議室名稱、容納人數、價格
        └── [編輯] [刪除]
```

### 4.3 資料庫層面

**關聯完整性**：
- rooms.venueId 必須存在於 venues.id
- 刪除場地時需檢查是否有關聯會議室
- 可考慮使用 CASCADE 刪除（或禁止刪除）

**索引建議**：
```sql
-- venues 表
CREATE INDEX idx_venues_city ON venues(city);
CREATE INDEX idx_venues_status ON venues(status);
CREATE INDEX idx_venues_type ON venues(venueType);

-- rooms 表
CREATE INDEX idx_rooms_venueId ON rooms(venueId);
CREATE INDEX idx_rooms_capacity ON rooms(capacity_theater);
```

---

## 五、風險與注意事項

### 5.1 資料品質風險

| 風險 | 應對措施 |
|------|---------|
| 場地名稱不一致 | 手動檢查相似名稱，建立對照表 |
| 同場地不同聯絡資訊 | 保留最新/最完整版本 |
| 遺失會議室資訊 | 遷移前後計數比對 |
| 外鍵關聯錯誤 | 遷移後驗證所有 room 都有對應 venue |

### 5.2 系統停機風險

**建議**：
- 選擇低流量時段執行（凌晨 2-4 點）
- 預計停機時間：30-60 分鐘
- 準備回滾計畫

### 5.3 回滾計畫

若遷移失敗：
1. 從備份檔案還原 `venues-all-cities.json`
2. 切換回舊版 API
3. 通知用戶系統維護

---

## 六、下一步

- [x] 完成 Schema 設計
- [ ] 撰寫遷移腳本（Python）
- [ ] 撰寫驗證腳本
- [ ] 準備測試資料
- [ ] 執行試運行
- [ ] 更新前台 API
- [ ] 更新後台管理介面
- [ ] 撰寫更新文件

---

_設計者：Jobs (CTO)_
_日期：2026-03-07_
