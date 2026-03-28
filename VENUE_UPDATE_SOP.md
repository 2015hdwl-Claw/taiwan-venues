# 場地資料更新 SOP (Standard Operating Procedure)

## 📋 概述

本文檔定義了更新台灣場地資料庫 (`venues.json`) 的標準作業流程，確保：
- ✅ **準確性第一**（最重要的原則）
- ✅ **人工驗證不可少**（每個場地都必須人工檢視）
- ✅ 資料結構一致
- ✅ 多來源交叉驗證

---

## ⚠️ 核心原則更新（2026-03-22）

**重要變更**：從「自動化優先」改為「準確性優先」

### 為何要更新？

根據用戶反饋，發現以下嚴重問題：
1. **台北圓山大飯店 (1072)**：照片來自 Wikipedia（2013 年），不是官網真實照片
2. **台北美福大酒店 (1095)**：官網 URL 輸入錯誤，導致無法獲取正確資料
3. **資料與人工檢查有巨大落差**

**核心教訓**：
- 「自動化」不能取代「準確性」
- 「資料來源」比「資料處理」更重要
- 「人工檢視」是品質保證的基石

---

## 🔒 強制人工驗證步驟（不可跳過）

### 重要聲明

**本節所有步驟都是強制的，不可跳過！**

- 不允許只依賴爬蟲工具或自動化腳本
- 必須在瀏覽器中人工檢視官網內容
- 必須驗證資料的時效性
- 必須多來源交叉驗證

### 強制步驟 1：驗證官網 URL 準確性

**執行時機**：在步驟 1 之前

**強制要求**：
- [ ] 測試 URL 是否可以正確訪問
- [ ] 確認 URL 是否為正確的官網（不是錯誤的域名）
- [ ] 檢查是否有重定向
- [ ] 記錄最終 URL

**工具**：
```bash
# 測試 URL
curl -I "https://www.grandformosa.com.tw/"

# 檢查重定向
curl -L "https://www.grandformosa.com/" -w "%{url_effective}\n"
```

**常見錯誤**：
- ❌ `grandformosa.com` → 應該是 `grandformosa.com.tw`
- ❌ `http://` → 應該是 `https://`

**記錄格式**：
```json
{
  "urlVerification": {
    "originalUrl": "https://www.grandformosa.com/",
    "finalUrl": "https://www.grandformosa.com.tw/",
    "isAccessible": true,
    "hasRedirect": true,
    "verifiedAt": "2026-03-22T01:09:00.000Z",
    "verifiedBy": "Jobs"
  }
}
```

### 強制步驟 2：人工檢視官網內容

**執行時機**：在步驟 1 之後，步驟 2 之前

**強制要求**：
- [ ] 在瀏覽器中打開官網（Chrome/Firefox/Safari）
- [ ] 人工查看「宴會廳」或「會議室」頁面
- [ ] 截圖保存當前官網頁面（至少 3 張）
  - 宴會廳列表頁
  - 單一宴會廳詳情頁
  - 宴會廳照片頁
- [ ] 記錄訪問日期和時間（ISO 8601 格式）

**禁止事項**：
- ❌ 不允許只使用爬蟲工具
- ❌ 不允許只查看 PDF 或平面圖
- ❌ 不允許跳過人工檢視步驟

**記錄格式**：
```json
{
  "manualInspection": {
    "inspector": "Jobs",
    "inspectedAt": "2026-03-22T01:09:00.000Z",
    "officialUrl": "https://www.grandformosa.com.tw/",
    "screenshots": [
      "screenshots/grandformosa_2026-03-22_01-09-01.png",
      "screenshots/grandformosa_2026-03-22_01-09-15.png",
      "screenshots/grandformosa_2026-03-22_01-09-30.png"
    ],
    "pagesInspected": [
      "https://www.grandformosa.com.tw/banquet",
      "https://www.grandformosa.com.tw/banquet/grand-ballroom"
    ]
  }
}
```

### 強制步驟 3：驗證照片時效性

**執行時機**：在步驟 2 之後

**強制要求**：
- [ ] 檢查照片是否為當前官網照片
- [ ] 確認照片不是來自 Wikipedia 或其他第三方網站
- [ ] 檢查照片是否有年份標記
- [ ] 對比官網當前照片和抓取的照片

**禁止事項**：
- ❌ 不允許使用 Wikipedia 照片
- ❌ 不允許使用 3 年前的照片
- ❌ 不允許使用第三方網站的照片

**如何檢查**：
1. 在官網上找到宴會廳照片
2. 右鍵點擊照片 →「檢查」
3. 查看照片 URL 是否來自官網域名
4. 確認照片是當前樣貌（不是 10 年前的）

**記錄格式**：
```json
{
  "photoRecency": {
    "main": {
      "url": "https://www.grandformosa.com.tw/images/banquet.jpg",
      "isFromOfficialSite": true,
      "isWikipedia": false,
      "verifiedAt": "2026-03-22T01:09:00.000Z"
    },
    "gallery": [
      {
        "url": "https://www.grandformosa.com.tw/images/banquet2.jpg",
        "isFromOfficialSite": true,
        "isWikipedia": false
      }
    ]
  }
}
```

### 強制步驟 4：多來源交叉驗證

**執行時機**：在步驟 3 之前

**強制要求**：
- [ ] 官網資料 + 電話確認（至少兩個來源）
- [ ] 如果官網資料不完整，必須電話確認
- [ ] 記錄所有驗證來源和時間

**驗證來源優先順序**：
1. 官網當前頁面（必須）
2. 官方 PDF 平面圖（如果可用）
3. 電話確認（必須，用於關鍵資料）

**記錄格式**：
```json
{
  "verificationSources": [
    {
      "type": "official_website",
      "url": "https://www.grandformosa.com.tw/banquet",
      "inspectedAt": "2026-03-22T01:09:00.000Z",
      "inspector": "Jobs"
    },
    {
      "type": "phone_confirmation",
      "phoneNumber": "+886-2-xxxx-xxxx",
      "confirmedAt": "2026-03-22T01:15:00.000Z",
      "confirmedBy": "Jobs",
      "confirmedData": ["priceHalfDay", "priceFullDay"]
    }
  ]
}

---

## 🔄 完整更新流程

### 步驟 1：收集來源資料

**優先順序：**
1. **官方 PDF 平面圖**（最佳）- 包含準確尺寸、容量
2. **官方網站** - 容量、設備資訊
3. **電話確認** - 價格、最新資訊

**Google Drive PDF 處理：**
```bash
# 方法 A：使用 gdrive-pdf（自動清理）
gdrive-pdf "https://drive.google.com/file/d/xxx/view"

# 方法 B：保留 PDF（如果是圖片 PDF 需要 OCR）
python3 /root/.openclaw/workspace/scripts/gdrive_pdf_extractor.py "<URL>" --keep

# 如果是圖片 PDF，轉成圖片分析
pdftoppm -png /tmp/gdrive_pdf_xxx/downloaded.pdf /tmp/venue
# 然後使用 image 工具分析
```

### 步驟 2：提取宴會廳資訊

**使用 image 工具分析平面圖：**
```
prompt: 這是 [場地名稱] 的宴會廳平面圖。請提取：
1. 所有宴會廳/會議室的名稱
2. 每個廳的面積（坪數和平方公尺）
3. 容納人數（劇院式、課桌式、宴會式、U型）
4. 樓層位置
5. 特殊配置（可合併、挑高等）
```

### 步驟 3：更新 venues.json

**資料結構規範：**

```json
{
  "id": 1077,
  "name": "台北寒舍艾麗酒店",
  "venueType": "飯店場地",
  "city": "台北市",
  "address": "完整地址",
  "contactPerson": "聯絡人/部門",
  "contactPhone": "電話",
  "contactEmail": "email",
  "url": "官方網站",
  "priceHalfDay": "半日價格",
  "priceFullDay": "全日價格",
  "maxCapacityTheater": 720,
  "maxCapacityClassroom": 360,
  "availableTimeWeekday": "09:00-22:00",
  "availableTimeWeekend": "09:00-22:00",
  "equipment": "設備清單",
  "floorHeight": "5.3公尺",
  "rooms": [
    {
      "name": "宴會全廳 Grand Ballroom",
      "nameEn": "Grand Ballroom",
      "area": {"sqm": 702, "ping": 212},
      "dimensions": {"length": 21.8, "width": 32},
      "ceilingHeight": 5.3,
      "capacity": {
        "theater": 720,
        "classroom": 360,
        "banquet": 500,
        "ushape": null
      },
      "features": ["可合併多個廳", "LED牆", "頂級影音設備"]
    }
  ],
  "combinations": [
    {
      "name": "蘭+葵",
      "area": {"sqm": 453, "ping": 137},
      "capacity": {"theater": 480, "classroom": 264}
    }
  ],
  "images": {
    "main": "主圖 URL",
    "gallery": ["圖片1", "圖片2"],
    "floorplan": "平面圖 URL",
    "source": "來源網址",
    "verified": true,
    "verifiedAt": "2024-03-16T09:45:00.000Z"
  },
  "verified": true,
  "verifiedAt": "2024-03-16T09:45:00.000Z",
  "dataSource": "Google Drive PDF - 宴會廳平面圖",
  "lastUpdated": "2024-03-16T09:45:00.000Z"
}
```

### 步驟 4：驗證更新

```bash
# 驗證 JSON 格式
python3 -c "import json; json.load(open('venues.json'))"

# 確認更新成功
python3 -c "
import json
with open('venues.json') as f:
    venues = json.load(f)
v = next(x for x in venues if x['id'] == 1077)
print(f'✅ ID 1077: {v[\"name\"]}')
print(f'   Rooms: {len(v.get(\"rooms\", []))} 個')
print(f'   Verified: {v.get(\"verified\", False)}')
"
```

---

## 🚀 自動化腳本

### 批量更新腳本

```python
#!/usr/bin/env python3
"""
批量更新場地資料
使用方式：python3 update_venue.py <venue_id> <pdf_url>
"""

import sys
import json
from datetime import datetime

def update_venue(venue_id: int, pdf_url: str, rooms_data: dict):
    """更新單一場地"""
    with open('venues.json', 'r') as f:
        venues = json.load(f)
    
    index = next((i for i, v in enumerate(venues) if v['id'] == venue_id), None)
    if index is None:
        raise ValueError(f"找不到 ID {venue_id}")
    
    # 更新資料
    venues[index].update({
        "rooms": rooms_data.get("rooms", []),
        "combinations": rooms_data.get("combinations", []),
        "maxCapacityTheater": rooms_data.get("maxCapacityTheater"),
        "maxCapacityClassroom": rooms_data.get("maxCapacityClassroom"),
        "floorHeight": rooms_data.get("floorHeight"),
        "verified": True,
        "verifiedAt": datetime.now().isoformat(),
        "dataSource": f"Google Drive PDF - {pdf_url}",
        "lastUpdated": datetime.now().isoformat()
    })
    
    with open('venues.json', 'w') as f:
        json.dump(venues, f, indent=2, ensure_ascii=False)
    
    print(f"✅ ID {venue_id} 更新完成")

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("使用方式: python3 update_venue.py <venue_id> <pdf_url>")
        sys.exit(1)
    
    venue_id = int(sys.argv[1])
    pdf_url = sys.argv[2]
    # ... 從 PDF 提取資料並更新
```

---

## 📊 待更新場地優先順序

### 高優先級（台北/新北市飯店）
這些場地需求量大，應優先更新：

| ID | 場地名稱 | 現有容量 | 狀態 |
|----|---------|---------|------|
| 1077 | 台北寒舍艾麗酒店 | 720 | ✅ 已更新 |
| - | 台北君悅酒店 | - | 待更新 |
| - | 台北文華東方 | - | 待更新 |
| - | 台北萬豪酒店 | - | 待更新 |
| - | 台北晶華酒店 | - | 待更新 |

### 中優先級（其他直轄市飯店）
台中市、高雄市、台南市的主要飯店

### 低優先級（縣市級場地）
其他縣市的場地

---

## 🔍 品質檢查清單（更新版）

### 資料來源驗證（新增 - 強制）
- [ ] 資料來自官網當前頁面（不是第三方網站）
- [ ] 照片來自官網當前頁面（不是 Wikipedia）
- [ ] URL 已驗證可正確訪問
- [ ] 已在瀏覽器中人工檢視官網

### 資料時效性（新增 - 強制）
- [ ] 照片是當前樣貌（不是 10 年前的）
- [ ] 價格有標註年度或確認日期
- [ ] 會議室名稱與官網當前頁面一致

### 多來源驗證（新增 - 強制）
- [ ] 關鍵資料已通過至少兩個來源驗證
- [ ] 官網資料不完整時，已電話確認

### 人工檢視（新增 - 強制）
- [ ] 已在瀏覽器中打開官網查看
- [ ] 已截圖保存當前官網頁面
- [ ] 已記錄訪問日期和時間

### 資料結構（原有）
- [ ] `rooms` 陣列包含所有宴會廳
- [ ] 每個 room 有 `name`, `area`, `capacity`
- [ ] `maxCapacityTheater` 等於最大廳的容量
- [ ] `combinations` 列出可合併配置
- [ ] `verified` 設為 `true`
- [ ] `verifiedAt` 和 `lastUpdated` 有時間戳
- [ ] `dataSource` 記錄來源

### 新增記錄欄位（強制）
- [ ] `urlVerification` 記錄 URL 驗證結果
- [ ] `manualInspection` 記錄人工檢視結果
- [ ] `photoRecency` 記錄照片時效性驗證
- [ ] `verificationSources` 記錄所有驗證來源

---

## 📝 注意事項

### 核心原則（更新）

1. **準確性第一**（最重要的原則）
   - 不允許為了省時間而犧牲準確性
   - 人工驗證是不可或缺的步驟

2. **資料來源驗證**（新增）
   - 所有照片必須來自官網當前頁面
   - 不允許使用 Wikipedia 或其他第三方來源
   - 必須驗證資料的時效性（不是 10 年前的）

3. **面積單位**：同時記錄 `sqm`（平方公尺）和 `ping`（坪）
   - 1 坪 = 3.305785 平方公尺

4. **容量配置**：
   - `theater`：劇院式（最多人）
   - `classroom`：課桌式
   - `banquet`：宴會式（圓桌）
   - `ushape`：U型（適合討論）

5. **資料來源優先順序**（更新）：
   - **官網當前頁面**（必須）> 官方 PDF 平面圖 > 電話確認 > ❌ 第三方網站（禁止）

6. **圖片處理**：
   - 如果 PDF 是圖片格式（掃描或 Illustrator），需要轉成圖片後用 image 工具分析
   - **所有照片必須驗證來源和時效性**

7. **URL 驗證**（新增）：
   - 所有官網 URL 必須測試是否可訪問
   - 必須確認是正確的官網域名
   - 記錄任何重定向

---

## 📅 維護計畫（更新）

### 定期審查機制

- **每週**：檢查新更新的場地是否符合新 SOP
- **每月**：抽查 10% 的場地，驗證資料準確性
- **每季**：檢查高優先級場地的資料是否過時
- **每年**：全面檢查所有場地
- **即時**：收到用戶反饋時，立即審查相關場地

### 資料時效性檢查

- **照片**：每年檢查一次，確保不是過時照片
- **價格**：每季檢查一次，確保是最新價格
- **會議室名稱**：每半年檢查一次，確保與官網一致

### 問題追蹤

所有發現的問題都記錄在 `SOP_REVIEW_REPORT.md` 中，並定期更新。

---

## 📚 相關文件

- **反思報告**：`SOP_REVIEW_REPORT.md` - 詳細的問題分析和改進方案
- **場地資料**：`venues.json` - 主要場地資料庫
- **備份**：`venues-backup-*.json` - 定期備份

---

*最後更新：2026-03-22*
*維護者：Jobs (Global CTO)*
*版本：2.0（重大更新：加入強制人工驗證步驟）*
