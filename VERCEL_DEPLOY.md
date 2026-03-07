# 🚀 Vercel 部署指南

## 📋 部署前準備

### 1. 確認專案結構
```
taiwan-venues/
├── api/
│   ├── index.js          # Vercel 入口點
│   ├── server.js         # 本地開發用
│   ├── ai-service.js     # AI 服務
│   └── package.json
├── migrated-data/
│   ├── venues.json       # 場地資料
│   └── rooms.json        # 會議室資料
├── vercel.json           # Vercel 配置
├── .env.example          # 環境變數範例
└── .vercelignore         # 忽略檔案
```

### 2. 安裝 Vercel CLI
```bash
npm install -g vercel
```

---

## 🔧 配置環境變數

### 方法 1：透過 Vercel Dashboard（推薦）

1. 登入 [Vercel Dashboard](https://vercel.com/dashboard)
2. 選擇專案 → Settings → Environment Variables
3. 添加環境變數：
   - **Name**: `GLM_API_KEY`
   - **Value**: `your_glm_api_key_here`
   - **Environment**: Production, Preview, Development（全選）

### 方法 2：使用 CLI
```bash
vercel env add GLM_API_KEY
# 粘貼 API Key
# 選擇所有環境（Production, Preview, Development）
```

---

## 🚀 部署步驟

### Step 1: 登入 Vercel
```bash
vercel login
```

### Step 2: 連結專案
```bash
cd taiwan-venues
vercel
```

第一次執行會問：
- **Link to existing project?** → No
- **Project name?** → taiwan-venue-api
- **In which directory?** → ./
- **Want to override settings?** → No

### Step 3: 部署到 Production
```bash
vercel --prod
```

部署完成後，會得到類似這樣的 URL：
```
https://taiwan-venue-api.vercel.app
```

---

## ✅ 測試 API

### 健康檢查
```bash
curl https://your-app.vercel.app/health
```

預期回應：
```json
{
  "status": "ok",
  "venues": 100,
  "rooms": 250,
  "timestamp": "2026-03-07T15:50:00.000Z"
}
```

### 取得城市列表
```bash
curl https://your-app.vercel.app/api/cities
```

### 搜尋場地
```bash
curl "https://your-app.vercel.app/api/search?city=台北市&limit=5"
```

### AI 對話
```bash
curl -X POST https://your-app.vercel.app/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "我需要在台北市找一個會議室，大約 50 人"}'
```

---

## 🔄 更新部署

每次修改代碼後：
```bash
git add .
git commit -m "Update message"
git push

# 或者直接部署
vercel --prod
```

---

## 🛠️ 本地測試

### 使用 Vercel Dev（推薦）
```bash
vercel dev
```
這會在本地模擬 Vercel 環境，包括環境變數。

### 使用 Node.js
```bash
npm run dev
```

---

## 📊 監控和日誌

### 查看即時日誌
```bash
vercel logs [deployment-url]
```

### 在 Dashboard 查看
1. Vercel Dashboard → 專案 → Deployments
2. 點擊具體部署 → Logs

---

## ⚠️ 常見問題

### 1. 資料檔案載入失敗
**問題**：`venues.json` 或 `rooms.json` 讀取失敗

**解決**：
- 確認 `migrated-data/` 目錄存在
- 檢查 `.vercelignore` 沒有排除 JSON 檔案
- 確認檔案路徑正確（使用相對路徑）

### 2. 環境變數無效
**問題**：`process.env.GLM_API_KEY` 為 undefined

**解決**：
- 確認在 Vercel Dashboard 已添加環境變數
- 重新部署專案（環境變數需要重新部署才會生效）

### 3. CORS 錯誤
**問題**：前端無法呼叫 API

**解決**：
- 已在 `api/index.js` 啟用 CORS（`origin: '*'`）
- 如果需要限制來源，修改為具體域名

### 4. 請求超時
**問題**：Serverless Function 執行超過 10 秒

**解決**：
- Vercel 免費版限制 10 秒
- 優化查詢邏輯
- 升級到 Pro 版（60 秒）

---

## 📝 環境變數清單

| 變數名 | 必填 | 說明 |
|--------|------|------|
| `GLM_API_KEY` | 是 | GLM AI API 金鑰（對話功能） |

---

## 🎯 下一步

1. **設定自訂域名**
   ```bash
   vercel domains add your-domain.com
   ```

2. **啟用日誌持久化**
   - Vercel → 專案 → Settings → Logging

3. **設置自動部署**
   - 連結 GitHub repo
   - 每次 push 自動部署

4. **監控和告警**
   - 設置 Uptime 監控
   - 整合 Sentry 錯誤追蹤

---

## 📚 相關資源

- [Vercel Documentation](https://vercel.com/docs)
- [Vercel CLI Reference](https://vercel.com/docs/cli)
- [Serverless Functions](https://vercel.com/docs/functions)
- [Environment Variables](https://vercel.com/docs/environment-variables)

---

_部署日期：2026-03-07_
_部署者：Jobs (CTO)_
