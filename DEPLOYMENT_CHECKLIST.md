# ✅ Vercel 部署檢查清單

## 部署前檢查

### 📁 檔案結構
- [x] `api/index.js` - Vercel 入口點
- [x] `api/ai-service.js` - AI 服務
- [x] `migrated-data/venues.json` - 場地資料
- [x] `migrated-data/rooms.json` - 會議室資料
- [x] `vercel.json` - Vercel 配置
- [x] `package.json` - 依賴配置
- [x] `.vercelignore` - 忽略檔案
- [x] `.env.example` - 環境變數範例

### 🔧 配置檢查
- [x] `vercel.json` 配置正確
  - [x] 使用 `@vercel/node`
  - [x] 路由正確指向 `api/index.js`
  - [x] 環境變數配置
  
- [x] `package.json` 依賴完整
  - [x] fastify
  - [x] @fastify/cors
  - [x] vercel (devDependency)

- [x] `.vercelignore` 正確排除
  - [x] 不必要的 .js 檔案
  - [x] 備份檔案
  - [x] 圖片和截圖

### 🔐 環境變數
- [ ] `GLM_API_KEY` 已設定
  - 方法 1：Vercel Dashboard
  - 方法 2：`vercel env add`

### 📊 資料檔案
- [x] `venues.json` 存在且有效
- [x] `rooms.json` 存在且有效
- [x] 檔案大小合理（< 5MB）

---

## 部署步驟

### Step 1: 安裝 Vercel CLI
```bash
npm install -g vercel
```

### Step 2: 登入 Vercel
```bash
vercel login
```

### Step 3: 設定環境變數
```bash
vercel env add GLM_API_KEY
# 粘貼 API Key
# 選擇 Production, Preview, Development
```

### Step 4: 部署
```bash
vercel --prod
```

### Step 5: 測試
```bash
# 取得部署 URL
curl https://your-app.vercel.app/health

# 或使用測試腳本
./test-api.sh https://your-app.vercel.app
```

---

## 部署後檢查

### ✅ 功能測試
- [ ] 健康檢查正常
  ```bash
  curl https://your-app.vercel.app/health
  ```
  
- [ ] API 端點正常
  ```bash
  curl https://your-app.vercel.app/api/cities
  curl https://your-app.vercel.app/api/venue-types
  ```
  
- [ ] 搜尋功能正常
  ```bash
  curl "https://your-app.vercel.app/api/search?city=台北市&limit=5"
  ```
  
- [ ] AI 對話正常
  ```bash
  curl -X POST https://your-app.vercel.app/api/chat \
    -H "Content-Type: application/json" \
    -d '{"message":"測試"}'
  ```

### 📊 監控設定
- [ ] 在 Vercel Dashboard 查看部署狀態
- [ ] 檢查 Function Logs 無錯誤
- [ ] 設定 Uptime 監控（可選）

### 🔒 安全檢查
- [ ] 環境變數已設定
- [ ] API Key 不在代碼中
- [ ] CORS 設定正確（目前 `origin: '*'`）

---

## 常見問題排除

### ❌ 部署失敗
**檢查項目**：
1. `vercel.json` 格式正確
2. `package.json` 依賴完整
3. 檔案路徑正確

### ❌ API 500 錯誤
**檢查項目**：
1. 資料檔案路徑正確
2. JSON 格式有效
3. 環境變數已設定

### ❌ AI 對話失敗
**檢查項目**：
1. `GLM_API_KEY` 已設定
2. API Key 有效
3. GLM API 服務正常

### ❌ CORS 錯誤
**解決方案**：
1. 確認 `api/index.js` 有啟用 CORS
2. 如需限制來源，修改 `origin: '*'` 為具體域名

---

## 優化建議

### 🚀 效能優化
- [ ] 啟用 Vercel 的 Edge Functions（可選）
- [ ] 壓縮 JSON 資料
- [ ] 實作快取機制

### 🔒 安全優化
- [ ] 限制 CORS 來源
- [ ] 添加 Rate Limiting
- [ ] 實作 API Key 驗證（如需）

### 📊 監控優化
- [ ] 設定 Sentry 錯誤追蹤
- [ ] 設定日誌持久化
- [ ] 設定效能監控

---

## 下一步

1. **設定自訂域名**
   ```bash
   vercel domains add your-domain.com
   ```

2. **設置自動部署**
   - 連結 GitHub repo
   - 每次 push 自動部署

3. **設置預覽環境**
   - PR 自動建立預覽部署
   - 測試新功能

---

_檢查清單版本：1.0_
_更新日期：2026-03-07_
