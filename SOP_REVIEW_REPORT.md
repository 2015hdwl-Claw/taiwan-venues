# SOP 與人工檢查落差分析報告

## 📋 報告概述

**報告日期**：2026-03-22
**問題嚴重性**：🔴 高（用戶指出「最基本的錯誤」）
**負責人**：Jobs (Global CTO)

---

## 🚨 階段 1：誠懇承認問題

### 1.1 問題確認

**核心問題**：SOP 執行中的確存在嚴重缺陷，導致資料與人工檢查有巨大落差。

**具體承認**：

1. ✅ **承認沒有真正深度檢視官網內容**
   - SOP 雖然列出「官方網站」作為資料來源
   - 但實際執行時，過度依賴自動化工具
   - 沒有真正在瀏覽器中打開官網查看當前內容

2. ✅ **承認資料來源驗證不足**
   - 允許從第三方網站（如 Wikipedia）抓取資料
   - 沒有強制要求資料必須來自官網當前頁面
   - 沒有檢查資料的時效性（10 年前的照片）

3. ✅ **承認 URL 驗證缺失**
   - 台北美福大酒店的官網 URL 輸入錯誤
   - SOP 沒有要求驗證 URL 的準確性
   - 沒有測試 URL 是否可以正確訪問

### 1.2 問題影響

- **資料準確性受損**：用戶無法信任場地資料
- **品牌信譽受損**：被用戶指出「最基本的錯誤」
- **時間成本增加**：需要重新審查所有已更新的場地

---

## 🔍 階段 2：根本原因分析

### 2.1 現有 SOP 的缺陷

**檢視 VENUE_UPDATE_SOP.md 中的流程**：

| 步驟 | SOP 要求 | 實際問題 |
|------|---------|---------|
| **步驟 1：收集來源資料** | 列出「官方網站」為第二優先 | ❌ 沒有明確要求「人工打開官網」<br>❌ 沒有要求「驗證資料時效性」 |
| **步驟 2：提取宴會廳資訊** | 使用 image 工具分析平面圖 | ❌ 沒有提到「驗證照片來源」<br>❌ 沒有檢查「是否為當前官網照片」 |
| **步驟 3：更新 venues.json** | 記錄 dataSource | ⚠️ 只記錄來源，但沒有驗證來源可靠性 |
| **步驟 4：驗證更新** | 驗證 JSON 格式和資料結構 | ❌ 只驗證結構，沒有驗證內容準確性 |

### 2.2 SOP 缺少的關鍵步驟

**發現的缺失**：

1. **沒有「人工檢視官網內容」的步驟**
   ```
   ❌ 現有：收集來源資料 → 提取資訊 → 更新 JSON
   ✅ 應該：收集來源資料 → 人工檢視官網 → 提取資訊 → 更新 JSON
   ```

2. **沒有「驗證資料時效性」的步驟**
   - 沒有檢查照片是否為當前樣貌
   - 沒有檢查價格是否為最新
   - 沒有檢查會議室名稱是否準確

3. **沒有「多來源交叉驗證」的步驟**
   - 只依賴單一來源（可能是過時的）
   - 沒有要求用官網 + 電話確認雙重驗證

4. **沒有「URL 準確性驗證」的步驟**
   - 沒有測試 URL 是否可訪問
   - 沒有驗證 URL 是否為正確的官網

### 2.3 為何爬蟲工具與人工檢查有落差

**技術原因**：

1. **爬蟲工具的局限性**：
   - 某些官網有反爬蟲機制
   - 動態內容可能無法正確抓取
   - 照片 URL 可能失效或指向錯誤位置

2. **第三方資料來源的問題**：
   - Wikipedia 照片可能過時（如 2013 年）
   - 第三方網站的資料可能不準確
   - 沒有時效性標記

3. **URL 輸入錯誤**：
   - 人為輸入錯誤（grandformosa.com vs grandformosa.com.tw）
   - 沒有驗證 URL 的步驟

---

## 📌 階段 3：具體錯誤案例分析

### 3.1 案例一：台北圓山大飯店 (ID 1072)

**問題描述**：照片來自 Wikipedia（2013 年），不是官網真實照片

**根本原因**：

1. **為何會使用 Wikipedia 照片？**
   - 爬蟲工具可能無法正確抓取官網照片
   - 工具轉向第三方來源（Wikipedia）
   - **SOP 沒有要求驗證照片來源的可靠性**

2. **為何沒有發現照片是 10 年前的？**
   - SOP 沒有要求檢查資料的時效性
   - 沒有「人工在瀏覽器中打開官網」的步驟
   - 沒有對比官網當前照片和抓取的照片

3. **SOP 的具體缺陷**：
   ```
   ❌ 步驟 2：只提到「使用 image 工具分析平面圖」
   ❌ 沒有提到「驗證照片來源」
   ❌ 沒有提到「檢查照片是否為當前官網照片」
   ```

**應該如何做**：
```
✅ 步驟 2.1：在瀏覽器中打開官網
✅ 步驟 2.2：人工查看宴會廳照片
✅ 步驟 2.3：確認照片是當前樣貌（不是 10 年前的）
✅ 步驟 2.4：截圖保存當前官網照片
✅ 步驟 2.5：記錄照片來源 URL 和日期
```

### 3.2 案例二：台北美福大酒店 (ID 1095)

**問題 1：官網資料不完整，但 SOP 沒有深度檢視**

**根本原因**：
- SOP 沒有要求「深度檢視官網內容」
- 遇到資料不完整時，沒有繼續挖掘
- 沒有要求「電話確認」作為補充

**問題 2：官網 URL 輸入錯誤**

**根本原因**：
- 人為輸入錯誤（grandformosa.com vs grandformosa.com.tw）
- **SOP 沒有要求驗證 URL 的準確性**
- 沒有測試 URL 是否可以正確訪問

**應該如何做**：
```
✅ 步驟 1.1：驗證官網 URL 是否可訪問
✅ 步驟 1.2：在瀏覽器中打開官網，確認是正確的官網
✅ 步驟 1.3：深度檢視官網所有相關頁面
✅ 步驟 1.4：如果官網資料不完整，電話確認
```

---

## 💡 階段 4：改進方案

### 4.1 核心改進原則

**從「自動化優先」改為「準確性優先」**

```
舊原則：自動化處理（省 token、省時間）
新原則：準確性第一，人工驗證不可少
```

### 4.2 具體改進措施

#### 改進 1：強制人工檢視官網內容

**新增步驟**：

```
步驟 1.5：人工檢視官網內容
- [ ] 在瀏覽器中打開官網（不是用爬蟲工具）
- [ ] 人工查看宴會廳照片
- [ ] 人工查看宴會廳資訊頁面
- [ ] 截圖保存當前官網頁面
- [ ] 記錄訪問日期和時間
```

**強制要求**：
- 每個場地更新前，必須在瀏覽器中打開官網
- 不允許只依賴爬蟲工具或第三方網站

#### 改進 2：驗證資料時效性

**新增步驟**：

```
步驟 2.5：驗證資料時效性
- [ ] 檢查照片是否為當前官網照片（不是 10 年前的）
- [ ] 檢查價格是否有標註年度
- [ ] 檢查會議室名稱是否與官網當前頁面一致
- [ ] 記錄資料的時效性（如「2026-03-22 官網資料」）
```

**強制要求**：
- 照片必須來自官網當前頁面
- 不允許使用 Wikipedia 或其他第三方來源的照片

#### 改進 3：多來源交叉驗證

**新增步驟**：

```
步驟 3.5：多來源交叉驗證
- [ ] 官網資料 + 電話確認（至少兩個來源）
- [ ] 如果官網資料不完整，必須電話確認
- [ ] 記錄所有驗證來源
```

**強制要求**：
- 關鍵資料（價格、容量）必須雙重驗證
- 不允許只依賴單一來源

#### 改進 4：建立檢查清單

**新增檢查清單**：

```
品質檢查清單（更新版）：

資料來源驗證：
- [ ] 資料來自官網當前頁面（不是第三方網站）
- [ ] 照片來自官網當前頁面（不是 Wikipedia）
- [ ] URL 已驗證可正確訪問

資料時效性：
- [ ] 照片是當前樣貌（不是 10 年前的）
- [ ] 價格有標註年度或確認日期
- [ ] 會議室名稱與官網當前頁面一致

多來源驗證：
- [ ] 關鍵資料已通過至少兩個來源驗證
- [ ] 官網資料不完整時，已電話確認

人工檢視：
- [ ] 已在瀏覽器中打開官網查看
- [ ] 已截圖保存當前官網頁面
- [ ] 已記錄訪問日期和時間
```

### 4.3 工具改進

#### 工具 1：官網 URL 驗證工具

```python
def verify_official_url(url: str, venue_name: str) -> dict:
    """驗證官網 URL 的準確性"""
    import requests
    from urllib.parse import urlparse
    
    result = {
        "url": url,
        "is_accessible": False,
        "is_official": False,
        "redirects_to": None,
        "error": None
    }
    
    try:
        # 1. 測試 URL 是否可訪問
        response = requests.get(url, timeout=10, allow_redirects=True)
        result["is_accessible"] = response.status_code == 200
        result["redirects_to"] = response.url if response.url != url else None
        
        # 2. 檢查是否為官網（包含飯店名稱）
        domain = urlparse(url).netloc
        result["is_official"] = venue_name.lower() in domain.lower()
        
    except Exception as e:
        result["error"] = str(e)
    
    return result
```

#### 工具 2：照片時效性檢查工具

```python
def check_photo_recency(photo_url: str, official_url: str) -> dict:
    """檢查照片是否來自官網當前頁面"""
    from urllib.parse import urlparse
    
    result = {
        "photo_url": photo_url,
        "is_from_official_site": False,
        "is_wikipedia": False,
        "warning": None
    }
    
    photo_domain = urlparse(photo_url).netloc
    official_domain = urlparse(official_url).netloc
    
    # 檢查是否來自 Wikipedia
    if "wikipedia" in photo_domain.lower():
        result["is_wikipedia"] = True
        result["warning"] = "⚠️ 照片來自 Wikipedia，可能過時"
    
    # 檢查是否來自官網
    elif photo_domain == official_domain:
        result["is_from_official_site"] = True
    else:
        result["warning"] = "⚠️ 照片不是來自官網"
    
    return result
```

---

## 📝 階段 5：更新 SOP

### 5.1 新增的強制步驟

**在 VENUE_UPDATE_SOP.md 中新增以下章節**：

```markdown
## 🔒 強制人工驗證步驟（不可跳過）

### ⚠️ 重要聲明

**本節所有步驟都是強制的，不可跳過！**

- 不允許只依賴爬蟲工具或自動化腳本
- 必須在瀏覽器中人工檢視官網內容
- 必須驗證資料的時效性
- 必須多來源交叉驗證

---

### 步驟 1.5：人工檢視官網內容

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
      "screenshot_2026-03-22_01-09-01.png",
      "screenshot_2026-03-22_01-09-15.png",
      "screenshot_2026-03-22_01-09-30.png"
    ],
    "pagesInspected": [
      "https://www.grandformosa.com.tw/banquet",
      "https://www.grandformosa.com.tw/banquet/grand-ballroom"
    ]
  }
}
```

---

### 步驟 1.6：驗證官網 URL 準確性

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

---

### 步驟 2.5：驗證資料時效性

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
4. 確認照片是當前樣貌

---

### 步驟 3.5：多來源交叉驗證

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
```
```

### 5.2 更新品質檢查清單

**新增以下檢查項目**：

```markdown
## 🔍 品質檢查清單（更新版）

### 資料來源驗證（新增）
- [ ] 資料來自官網當前頁面（不是第三方網站）
- [ ] 照片來自官網當前頁面（不是 Wikipedia）
- [ ] URL 已驗證可正確訪問
- [ ] 已在瀏覽器中人工檢視官網

### 資料時效性（新增）
- [ ] 照片是當前樣貌（不是 10 年前的）
- [ ] 價格有標註年度或確認日期
- [ ] 會議室名稱與官網當前頁面一致

### 多來源驗證（新增）
- [ ] 關鍵資料已通過至少兩個來源驗證
- [ ] 官網資料不完整時，已電話確認

### 人工檢視（新增）
- [ ] 已在瀏覽器中打開官網查看
- [ ] 已截圖保存當前官網頁面
- [ ] 已記錄訪問日期和時間

### 原有檢查（保留）
- [ ] `rooms` 陣列包含所有宴會廳
- [ ] 每個 room 有 `name`, `area`, `capacity`
- [ ] `maxCapacityTheater` 等於最大廳的容量
- [ ] `combinations` 列出可合併配置
- [ ] `verified` 設為 `true`
- [ ] `verifiedAt` 和 `lastUpdated` 有時間戳
- [ ] `dataSource` 記錄來源
```

### 5.3 更新資料結構

**在 venues.json 中新增以下欄位**：

```json
{
  "id": 1095,
  "name": "台北美福大酒店",
  "...": "...",
  "manualInspection": {
    "inspector": "Jobs",
    "inspectedAt": "2026-03-22T01:09:00.000Z",
    "officialUrl": "https://www.grandformosa.com.tw/",
    "screenshots": [
      "screenshots/grandformosa_2026-03-22_01-09-01.png"
    ],
    "pagesInspected": [
      "https://www.grandformosa.com.tw/banquet"
    ]
  },
  "verificationSources": [
    {
      "type": "official_website",
      "url": "https://www.grandformosa.com.tw/banquet",
      "inspectedAt": "2026-03-22T01:09:00.000Z"
    },
    {
      "type": "phone_confirmation",
      "phoneNumber": "+886-2-xxxx-xxxx",
      "confirmedAt": "2026-03-22T01:15:00.000Z",
      "confirmedData": ["priceHalfDay", "priceFullDay"]
    }
  ],
  "photoRecency": {
    "main": {
      "url": "https://www.grandformosa.com.tw/images/banquet.jpg",
      "isFromOfficialSite": true,
      "isWikipedia": false,
      "verifiedAt": "2026-03-22T01:09:00.000Z"
    }
  }
}
```

---

## 📊 改進效果預期

### 短期效果（1 週內）

1. **資料準確性提升**
   - 消除過時照片（如 Wikipedia 2013 年照片）
   - 消除 URL 錯誤
   - 消除資料不完整的問題

2. **用戶信任度恢復**
   - 用戶可以看到「人工檢視」的記錄
   - 用戶可以查看截圖證明
   - 用戶可以信任資料來源

### 長期效果（1 個月內）

1. **流程標準化**
   - 所有場地更新都遵循新 SOP
   - 品質檢查清單確保一致性

2. **錯誤率降低**
   - 多來源交叉驗證降低錯誤率
   - 人工檢視避免自動化工具的局限性

---

## 🎯 總結

### 核心教訓

1. **「自動化」不能取代「準確性」**
   - 自動化工具可以節省時間，但不能犧牲準確性
   - 人工驗證是不可或缺的步驟

2. **「資料來源」比「資料處理」更重要**
   - 資料來源的可靠性決定資料的準確性
   - 不允許使用過時或不可靠的來源

3. **「人工檢視」是品質保證的基石**
   - 在瀏覽器中打開官網是最基本的驗證
   - 截圖和記錄是問責的基礎

### 行動計畫

1. **立即行動**（今天）
   - 更新 VENUE_UPDATE_SOP.md
   - 重新審查台北圓山大飯店和台北美福大酒店

2. **短期行動**（1 週內）
   - 實施新的品質檢查清單
   - 開發 URL 驗證工具和照片時效性檢查工具

3. **長期行動**（1 個月內）
   - 重新審查所有已更新的場地
   - 建立定期審查機制

---

**報告完成日期**：2026-03-22
**負責人**：Jobs (Global CTO)
**下一步**：更新 VENUE_UPDATE_SOP.md 並執行改進方案
