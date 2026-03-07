# 活動大師 Phase 1 - 工具開發

## 📋 概述

本目錄包含用於修復台灣場地資料的自動化工具。

## 🎯 目標

- 修復 411 個待修場地
- 為 386 個場地補充主照片
- 為 352 個場地補充會議室 URL
- 優先處理 327 個兩者都缺的場地

## 🛠️ 工具

### 1. 場地分析器 (analyze_venues.py)
分析場地資料，產生分類和批次資訊。

```bash
python3 analyze_venues.py
```

輸出：
- `output/venue_analysis.json` - 完整分析結果

### 2. 照片爬蟲 (photo_crawler_fast.py)
從官網首頁快速爬取主照片。

```bash
# 測試單個場地
python3 photo_crawler_fast.py --venue-id 1001 --name "測試飯店" --url "https://example.com"

# 批次處理
python3 photo_crawler_fast.py --batch 1
```

功能：
- 提取 og:image
- 提取 hero 區域圖片
- 提取 header 圖片
- 自動驗證照片有效性
- 過濾禁止的來源 (Wikipedia, Unsplash)

### 3. 會議室 URL 搜尋器 (venue_url_searcher.py)
搜尋場地的會議室頁面 URL。

```bash
# 測試單個場地
python3 venue_url_searcher.py --venue-id 1001 --name "測試飯店" --url "https://example.com"

# 批次處理
python3 venue_url_searcher.py --batch 1
```

功能：
- 測試常見會議室路徑 (/meeting, /conference, 等)
- DuckDuckGo 搜尋
- 驗證頁面相關性
- 提取會議室名稱

### 4. 主執行腳本 (run_phase1.py)
互動式主執行腳本，提供選單選擇。

```bash
python3 run_phase1.py
```

選項：
1. 只分析（顯示統計）
2. 測試照片爬蟲（前 5 個）
3. 測試 URL 搜尋（前 5 個）
4. 完整處理第一批（20 個）
5. 生成報告

## 📊 場地分類

待修場地按類型分布：
- 飯店: 208 個
- 其他: 92 個
- 展演場地: 62 個
- 會議中心: 49 個

按城市分布（前 10）：
- 台北市: 121 個
- 台中市: 43 個
- 高雄市: 37 個
- 新北市: 32 個
- 台南市: 23 個
- 桃園市: 19 個
- 屏東縣: 18 個
- 新竹市: 15 個
- 宜蘭縣: 13 個
- 花蓮縣: 13 個

## 📦 批次處理

- 總批數: 21 批
- 每批: 20 個場地
- 優先順序: 兩者都缺 > 缺照片 > 缺 URL

## 🚀 使用流程

### 快速開始

```bash
# 1. 分析場地資料
cd /root/.openclaw/workspace/taiwan-venues/scripts/phase1_tools
python3 analyze_venues.py

# 2. 測試工具
python3 run_phase1.py
# 選擇模式 2 或 3 進行測試

# 3. 完整處理第一批
python3 run_phase1.py
# 選擇模式 4

# 4. 查看結果
ls -lh output/
```

### 批次處理建議

1. **第一批（測試）**: 選擇模式 4，處理 20 個場地
2. **評估結果**: 檢查成功率，調整策略
3. **後續批次**: 根據測試結果決定是否繼續

## 📝 輸出格式

### 照片爬蟲結果
```json
{
  "venueId": 1001,
  "name": "測試飯店",
  "photoUrl": "https://example.com/photo.jpg",
  "gallery": ["url1", "url2"],
  "totalFound": 5,
  "meetingPhotos": 2,
  "source": "https://example.com",
  "crawledAt": "2026-03-05T15:30:00"
}
```

### URL 搜尋結果
```json
{
  "venueId": 1001,
  "name": "測試飯店",
  "venueListUrl": "https://example.com/meeting",
  "method": "direct_path",
  "page_info": {
    "url": "https://example.com/meeting",
    "room_count_estimate": 5,
    "room_names": ["A廳", "B廳"],
    "relevance_score": 8
  }
}
```

## ⚠️ 注意事項

1. **避免被封鎖**: 工具已加入延遲（2秒）
2. **驗證來源**: 自動過濾 Wikipedia, Unsplash 等禁止來源
3. **SSL 驗證**: 已禁用以處理憑證問題
4. **超時設定**: 10-15 秒超時避免卡住

## 📈 成功率目標

- 照片爬取: > 70%
- URL 搜尋: > 50%
- 整體修復: > 60%

## 🔧 故障排除

### 照片爬取失敗
- 檢查官網是否可訪問
- 嘗試手動搜尋
- 使用備用來源（如有）

### URL 搜尋失敗
- 確認場地是否提供會議服務
- 檢查官網結構
- 可能需要手動驗證

## 📚 相關文件

- 場地資料: `/root/.openclaw/workspace/taiwan-venues/venues-all-cities.json`
- 分析結果: `output/venue_analysis.json`
- 測試結果: `output/test_*.json`
- 批次結果: `output/batch_*_complete.json`

---

**開發時間**: 2026-03-05 15:27-15:57 (30 分鐘)
**開發者**: Jobs (Global CTO)
