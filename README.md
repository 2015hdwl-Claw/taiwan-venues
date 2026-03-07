# 台灣場地資料庫後台管理系統

## 簡介
台灣各類活動場地（飯店、會議中心、展演空間等）的資料庫管理系統。

## 功能
- 📊 場地資料管理（新增/編輯/刪除）
- 🏷️ 狀態管理（上架/下架）
- 📍 依城市、類型篩選
- ⚠️ 資料完整性檢查
- 📷 照片管理
- 📤 JSON 匯出
- 🤖 AI 對話功能（GLM API）

---

## 🚀 部署方式

### 方式 1：Vercel 部署（推薦）

**適用於**：生產環境、需要穩定的公開 API

```bash
# 一鍵部署
./deploy-to-vercel.sh

# 或手動部署
vercel --prod
```

📖 **詳細說明**：[VERCEL_DEPLOY.md](./VERCEL_DEPLOY.md)

**優點**：
- ✅ 免費額度充足
- ✅ 自動 HTTPS
- ✅ 全球 CDN
- ✅ 輕鬆擴展

**環境變數**：
```
GLM_API_KEY=your_glm_api_key_here
```

---

### 方式 2：本地開發

**適用於**：開發、測試、資料管理

```bash
# 方式 1：使用 Vercel Dev（推薦）
vercel dev

# 方式 2：直接運行
npm run dev
```

預設網址: http://localhost:3000

---

### 方式 3：後台管理系統

**適用於**：資料管理、視覺化編輯

```bash
python3 admin-server.py
```

預設網址: http://localhost:8080

---

## 📁 專案結構

```
taiwan-venues/
├── api/                    # API 服務
│   ├── index.js           # Vercel 入口點
│   ├── server.js          # 本地開發用
│   ├── ai-service.js      # AI 對話服務
│   └── package.json
├── migrated-data/         # 資料庫
│   ├── venues.json        # 場地資料
│   └── rooms.json         # 會議室資料
├── admin.html             # 後台管理介面
├── admin-server.py        # 後台伺服器
├── vercel.json            # Vercel 配置
├── .vercelignore          # 忽略檔案
└── .env.example           # 環境變數範例
```

---

## 🔌 API 端點

### 基礎端點
- `GET /health` - 健康檢查
- `GET /api/cities` - 取得所有城市
- `GET /api/venue-types` - 取得所有場地類型

### 場地搜尋
- `GET /api/search` - 搜尋場地
  - 參數：`city`, `venueType`, `minCapacity`, `maxPrice`, `keyword`, `limit`, `offset`

### 場地詳情
- `GET /api/venues/:id` - 取得單一場地詳情
- `GET /api/venues/:id/rooms` - 取得場地的會議室

### AI 對話
- `POST /api/chat` - AI 對話
  - Body: `{"message": "...", "sessionId": "..."}`

---

## 🧪 測試

```bash
# 測試已部署的 API
./test-api.sh https://your-app.vercel.app

# 本地測試
./test-api.sh http://localhost:3000
```

---

## 📝 資料結構

每個場地包含以下欄位：
- name: 場地名稱
- venueType: 場地類型（飯店/展演/機關/會議中心等）
- city: 城市
- address: 地址
- contactPerson: 聯絡人
- contactPhone: 聯絡電話
- contactEmail: Email
- url: 官方網站
- status: 狀態（上架/下架）
- verified: 是否已驗證
- images: 照片資訊
  - main: 主圖 URL
  - gallery: 圖片庫 URL 陣列

每個會議室包含：
- venueId: 所屬場地 ID
- name: 會議室名稱
- capacity: 容納人數
  - theater: 劇院式
  - classroom: 教室式
- pricing: 價格
  - halfDay: 半天價格
  - fullDay: 全天價格
- facilities: 設備清單

---

## 🔧 環境變數

| 變數名 | 必填 | 說明 |
|--------|------|------|
| `GLM_API_KEY` | 是 | GLM AI API 金鑰（對話功能） |

---

## 📚 相關文件

- [Vercel 部署指南](./VERCEL_DEPLOY.md)
- [資料庫結構](./DATABASE_SCHEMA.md)
- [需求文件](./REQUIREMENTS.md)

---

## 🆘 常見問題

### Q: 如何設定環境變數？
A: 在 Vercel Dashboard → Settings → Environment Variables 添加 `GLM_API_KEY`

### Q: 如何更新資料？
A: 修改 `migrated-data/` 下的 JSON 檔案，重新部署即可

### Q: 如何查看日誌？
A: `vercel logs [deployment-url]` 或在 Vercel Dashboard 查看

---

_更新日期：2026-03-07_
