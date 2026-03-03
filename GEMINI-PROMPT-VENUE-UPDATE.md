# Google Gemini 場地更新提示詞

**用途**：使用 Google Gemini 協助更新 4 個有問題的場地資料
**日期**：2026-03-03
**目標**：找到正確的官網 URL 和會議室頁面 URL

---

## 📋 提示詞

```
你是台灣會議場地資料庫的資料更新助手。

## 任務目標

請協助更新以下 4 個場地的資料，確保找到正確的官網 URL 和會議室頁面 URL。

---

## 待更新場地列表

### 1. 台北怡亨酒店（ID: 1082）
- **目前官網**：https://www.eclathotels.com
- **問題**：403 Forbidden（無法訪問）
- **需要**：
  - 正確的台北怡亨酒店官網 URL
  - 會議室/宴會廳頁面 URL
  - 會議室數量（roomsCount）
  - 會議室名稱列表

### 2. 台北意舍酒店 CitizenM（ID: 1083）
- **目前官網**：https://www.citizenm.com/hotels/asia/taipei/
- **問題**：URL 已過期（重定向到 Marriott 品牌頁面）
- **需要**：
  - 正確的台北意舍酒店官網 URL
  - 會議室/宴會廳頁面 URL
  - 會議室數量（roomsCount）
  - 會議室名稱列表

### 3. 台北晶華酒店 Regent Taipei（ID: 1086）
- **目前官網**：https://www.regenthotels.com/tw/regent-taipei
- **問題**：403 Forbidden（無法訪問）
- **需要**：
  - 正確的台北晶華酒店官網 URL
  - 會議室/宴會廳頁面 URL
  - 會議室數量（roomsCount）
  - 會議室名稱列表

### 4. 台北王朝大酒店（ID: 1090）
- **目前官網**：https://www.dynasty.com.tw
- **目前會議室頁面**：https://www.dynasty.com.tw/news
- **問題**：venueListUrl 指向「皇朝食品有限公司」（非酒店）
- **需要**：
  - 正確的台北王朝大酒店官網 URL
  - 會議室/宴會廳頁面 URL
  - 會議室數量（roomsCount）
  - 會議室名稱列表

---

## 輸出格式要求

請針對每個場地，按照以下 JSON 格式輸出：

```json
{
  "id": "場地 ID",
  "name": "場地名稱",
  "url": "正確的官網 URL",
  "venueListUrl": "會議室/宴會廳頁面 URL",
  "roomsCount": 會議室數量（數字）,
  "roomNames": ["會議室1", "會議室2", "..."],
  "venueType": "飯店場地",
  "verified": true,
  "lastUpdated": "2026-03-03T12:00:00Z",
  "notes": "更新說明（如：官網已更新、會議室資訊來源等）"
}
```

---

## 驗證標準

請確保：
1. **官網 URL** 是場地的官方網站，非第三方網站
2. **venueListUrl** 必須指向會議室/宴會廳的頁面，不能是首頁
3. **roomsCount** 必須與官網上的會議室數量一致
4. **roomNames** 必須列出所有會議室名稱

---

## 注意事項

1. 如果找不到某個場地的官網，請標註為「官網已失效」
2. 如果官網沒有會議室資訊，請標註為「官網無會議室資訊」
3. 如果場地已歇業，請標註為「已歇業」
4. 請優先使用官方網站，避免使用第三方訂房網站

---

## 開始執行

請逐一檢查以上 4 個場地，並按照指定格式輸出更新後的資料。
```

---

## 📊 使用方式

### 方式 1：直接貼上提示詞

將上述提示詞複製到 Google Gemini（https://gemini.google.com），讓 Gemini 執行搜尋和驗證。

### 方式 2：分批處理

如果需要更精確的結果，可以將 4 個場地分開處理：

#### 批次 1：台北怡亨酒店
```
請協助找到「台北怡亨酒店」的正確資訊：
- 官網 URL（目前 https://www.eclathotels.com 已失效）
- 會議室/宴會廳頁面 URL
- 會議室數量和名稱

輸出格式：
{
  "name": "台北怡亨酒店",
  "url": "官網 URL",
  "venueListUrl": "會議室頁面 URL",
  "roomsCount": 數量,
  "roomNames": ["名稱1", "名稱2"]
}
```

#### 批次 2：台北意舍酒店
```
請協助找到「台北意舍酒店 CitizenM」的正確資訊：
- 官網 URL（目前 https://www.citizenm.com 已重定向到 Marriott）
- 會議室/宴會廳頁面 URL
- 會議室數量和名稱

輸出格式：
{
  "name": "台北意舍酒店",
  "url": "官網 URL",
  "venueListUrl": "會議室頁面 URL",
  "roomsCount": 數量,
  "roomNames": ["名稱1", "名稱2"]
}
```

#### 批次 3：台北晶華酒店
```
請協助找到「台北晶華酒店 Regent Taipei」的正確資訊：
- 官網 URL（目前 https://www.regenthotels.com 有反爬蟲機制）
- 會議室/宴會廳頁面 URL
- 會議室數量和名稱

輸出格式：
{
  "name": "台北晶華酒店",
  "url": "官網 URL",
  "venueListUrl": "會議室頁面 URL",
  "roomsCount": 數量,
  "roomNames": ["名稱1", "名稱2"]
}
```

#### 批次 4：台北王朝大酒店
```
請協助找到「台北王朝大酒店」的正確資訊：
- 官網 URL（目前 https://www.dynasty.com.tw 是食品公司，非酒店）
- 會議室/宴會廳頁面 URL
- 會議室數量和名稱

輸出格式：
{
  "name": "台北王朝大酒店",
  "url": "官網 URL",
  "venueListUrl": "會議室頁面 URL",
  "roomsCount": 數量,
  "roomNames": ["名稱1", "名稱2"]
}
```

---

## 📝 收到 Gemini 回應後的處理流程

### 步驟 1：驗證資料

檢查 Gemini 提供的 URL 是否正確：
```bash
curl -sI --connect-timeout 10 "URL"
```

### 步驟 2：更新資料庫

```bash
node -e "
const fs = require('fs');
const data = JSON.parse(fs.readFileSync('venues-all-cities.json', 'utf8'));

// 找到對應的場地並更新
const venue = data.find(v => v.id == ID);
if (venue) {
  venue.url = '新的官網 URL';
  venue.venueListUrl = '新的會議室頁面 URL';
  venue.roomsCount = 會議室數量;
  venue.roomNames = ['會議室1', '會議室2'];
  venue.verified = true;
  venue.lastUpdated = new Date().toISOString();
}

fs.writeFileSync('venues-all-cities.json', JSON.stringify(data, null, 2));
"
```

### 步驟 3：標記完成

更新完成後，將場地狀態從「待修」改為「上架」。

---

## 🎯 預期結果

完成後，這 4 個場地的狀態：

| ID | 場地名稱 | 原狀態 | 新狀態 |
|----|----------|--------|--------|
| 1082 | 台北怡亨酒店 | 待修 | 上架 ✅ |
| 1083 | 台北意舍酒店 | 待修 | 上架 ✅ |
| 1086 | 台北晶華酒店 | 待修 | 上架 ✅ |
| 1090 | 台北王朝大酒店 | 上架 | 上架（URL 已更新）✅ |

---

## 📁 相關檔案

| 檔案 | 說明 |
|------|------|
| `GEMINI-PROMPT-VENUE-UPDATE.md` | 本提示詞檔案 |
| `V46-ACTIVE-ERRORS-LIST.md` | 錯誤場地詳細列表 |
| `venues-all-cities.json` | 主資料庫 |

---

**建立時間**：2026-03-03 12:41 GMT+8
**建立人員**：總管（Orchestrator）
