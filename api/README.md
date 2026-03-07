# Taiwan Venue Search API

台灣場地搜尋 API - 4 天 MVP 專案

## 📊 專案狀態

**Day 1 完成 (2026-03-07)** ✅

- ✅ API Server 建立 (Fastify)
- ✅ 資料載入 (361 場地 + 526 會議室)
- ✅ 搜尋功能實作
- ✅ API 測試通過

## 🚀 快速開始

```bash
# 安裝依賴
npm install

# 啟動伺服器
npm start

# 開發模式 (自動重啟)
npm run dev
```

伺服器預設在 `http://localhost:3000`

## 📡 API Endpoints

### 1. 健康檢查
```
GET /health
```

回應範例：
```json
{
  "status": "ok",
  "venues": 361,
  "rooms": 526,
  "timestamp": "2026-03-07T15:37:38.503Z"
}
```

### 2. 取得所有城市
```
GET /api/cities
```

### 3. 取得所有場地類型
```
GET /api/venue-types
```

### 4. 搜尋場地
```
GET /api/search
```

查詢參數：
- `city` - 城市名稱（需 URL encode）
- `venueType` - 場地類型
- `minCapacity` - 最小容納人數
- `maxPrice` - 最高價格（半日或全日）
- `keyword` - 關鍵字搜尋
- `limit` - 每頁筆數（預設 20）
- `offset` - 分頁起始（預設 0）

範例：
```bash
# 搜尋台北市場地
curl "http://localhost:3000/api/search?city=%E5%8F%B0%E5%8C%97%E5%B8%82&limit=5"

# 搜尋容納 50 人以上
curl "http://localhost:3000/api/search?minCapacity=50"

# 搜尋 5000 元以下
curl "http://localhost:3000/api/search?maxPrice=5000"
```

### 5. 取得單一場地
```
GET /api/venues/:id
```

### 6. 取得場地的會議室
```
GET /api/venues/:id/rooms
```

### 7. AI 對話
```
POST /api/chat
```

請求 body:
```json
{
  "message": "我需要在台北市找一個可以容納50人的會議室",
  "sessionId": "optional-session-id"
}
```

回應範例:
```json
{
  "success": true,
  "message": "我了解您的需求了！請問您希望的活動地點是在哪個城市？",
  "sessionId": "session_xxx",
  "venues": [
    {
      "id": 1001,
      "name": "CAMA咖啡",
      "city": "台北市",
      "maxCapacity": 40,
      "minPrice": 6000
    }
  ]
}
```

**注意**: AI 對話功能需要設定 `GLM_API_KEY` 環境變數才能使用完整功能。若未設定，會返回預設回應但仍會執行搜尋。

## 📁 資料結構

### Venue (場地)
```json
{
  "id": 1001,
  "name": "CAMA咖啡",
  "venueType": "咖啡廳",
  "city": "台北市",
  "address": "台北市信義區永吉路30巷145號",
  "contactPerson": "場地租借",
  "contactPhone": "02-2765-2299",
  "contactEmail": "booking@camacoffee.com",
  "url": "https://www.camacafe.com/",
  "status": "上架",
  "roomsCount": 1,
  "images": {
    "main": "...",
    "gallery": ["...", "..."]
  }
}
```

### Room (會議室)
```json
{
  "id": 2031,
  "venueId": 1001,
  "name": "包場空間",
  "roomType": "咖啡廳包場",
  "capacity": {
    "theater": 40,
    "classroom": 25
  },
  "pricing": {
    "halfDay": 6000,
    "fullDay": 10000
  },
  "availability": {
    "weekday": "07:00-22:00",
    "weekend": "07:00-22:00"
  },
  "equipment": ["投影機", "音響"],
  "images": {
    "main": "...",
    "gallery": ["..."],
    "floorPlan": ""
  }
}
```

## 🗓️ 接下來的計畫

### Day 2 - AI 對話系統
- 整合 GLM-4.7-Flash API
- 設計場地推薦 prompt
- 實作對話記憶（session-based）
- 整合搜尋結果到 AI 回覆

### Day 3 - LINE Bot / Web UI
- LINE Bot 設定（或簡易 Web UI）
- 串接搜尋 API
- 串接 AI 對話

### Day 4 - Mail 預訂 + 部署
- Mail 預訂功能
- 端到端測試
- 部署上線

## 🔧 技術棧

- **Runtime**: Node.js 22
- **Framework**: Fastify 4.26
- **資料格式**: JSON
- **CORS**: 已啟用

## 📝 開發筆記

- 目前顯示所有場地（包括下架狀態）
- URL 中文需要 encode
- 搜尋效能良好（<50ms）
