# Sub-agent 提示詞範本 - SOP V4.6

## 重要：錯誤分類精確化

當遇到網站無法訪問時，**必須精確區分錯誤類型**：

### 錯誤分類標準

| 錯誤類型 | 判斷標準 | 輸出代碼 |
|----------|----------|----------|
| DNS 解析失敗 | 域名完全不存在，curl 無回應 | `DNS_FAIL` |
| 連線超時 | DNS 正常但連線逾時 | `TIMEOUT` |
| HTTP 403 | 反爬蟲機制 | `HTTP_403` |
| HTTP 404 | 頁面不存在 | `HTTP_404` |
| HTTP 301/302 | 重定向（仍可訪問） | `REDIRECT` |
| HTTP 200 | 正常訪問 | `OK` |
| 內容提取失敗 | HTTP 200 但無法解析 | `PARSE_FAIL` |

### 二次驗證要求

**對所有標記為 DNS 失敗的場地，必須執行二次驗證：**

```bash
curl -sI --connect-timeout 10 "$url" | head -1
```

### 輸出格式

```json
{
  "id": "1050",
  "name": "台北丹迪旅店",
  "url": "https://www.dandyhotel.com.tw",
  "errorType": "HTTP_200",
  "errorTypeOriginal": "DNS_FAIL",
  "isMisjudgment": true,
  "verificationMethod": "curl",
  "verificationTime": "2026-03-03T07:48:00Z"
}
```

## 範本：SOP V4.6 驗證任務

```markdown
你是台灣會議場地驗證 sub-agent。

## 任務：SOP V4.6 Phase 3 會議室數量檢查

### 場地列表
[場地列表]

## SOP V4.6 強制執行

### Phase 1-7
[原有流程]

### Phase 8: 失敗重試（新增）
1. 對所有標記為「DNS 失敗」的場地進行二次測試
2. 使用 curl 直接測試 HTTP 狀態碼
3. 區分錯誤類型（DNS_FAIL, TIMEOUT, HTTP_403, HTTP_404, REDIRECT, OK, PARSE_FAIL）
4. 更正誤判的場地狀態

## 輸出格式
對每個場地回報：
- ID
- 名稱
- roomsCount
- roomNames
- 狀態
- 錯誤類型（精確分類）
- 備註
```

## 測試案例

### 案例 1：台北丹迪旅店（誤判修正）
- 原判斷：DNS 解析失敗
- curl 測試：HTTP 200 OK
- 正確分類：OK
- 結論：誤判，應為正常

### 案例 2：TCCC台灣文創訓練中心
- 原判斷：DNS 解析失敗
- curl 測試：無回應
- 正確分類：DNS_FAIL
- 結論：正確，域名確實不存在

## 注意事項

1. **不要統一歸類為「DNS 解析失敗」**
2. **必須區分 HTTP 狀態碼**
3. **HTTP 301/302 應視為正常可訪問**
4. **執行二次驗證後更新錯誤分類**

---

## ⚠️ ID 查詢注意事項 - 絕對不可誤判

### 🚨 強制規定：ID 查詢必須精確

**誤判案例（V4.5）**：
- Sub-agent 報告「ID 不存在」
- 實際情況：ID 存在，是重複記錄
- 原因：查詢方式錯誤或類型不匹配

### ✅ 正確的 ID 查詢方式

```javascript
// ✅ 正確：使用 == 進行寬鬆比對（支援數字和字串）
const venue = data.find(v => v.id == targetId);

// ❌ 錯誤：使用 === 進行嚴格比對（類型不匹配會失敗）
const venue = data.find(v => v.id === targetId);
```

### 🔒 ID 查詢強制流程

**步驟 1**：使用 `find()` 方法查詢
```javascript
const venue = data.find(v => v.id == targetId);
```

**步驟 2**：檢查結果
```javascript
if (venue === undefined) {
  // 可能真的不存在，但必須進一步驗證
}
```

**步驟 3**：使用 id-query.js 驗證（強制）
```bash
node id-query.js query <id>
```

**步驟 4**：記錄查詢結果
- 記錄查詢方式
- 記錄返回結果
- 記錄驗證結果

### 🚫 禁止行為

| 禁止 | 原因 |
|------|------|
| 直接判斷「ID 不存在」 | 必須使用 id-query.js 驗證 |
| 使用 `===` 嚴格比對 | 類型不匹配會失敗 |
| 統一歸類為「ID 不存在」 | 必須精確區分原因 |

### 📋 輸出格式（強制）

```json
{
  "id": "1433",
  "exists": true,
  "queryMethod": "find() + id-query.js",
  "verificationTime": "2026-03-03T08:00:00Z"
}
```

### 🔧 ID 查詢腳本

```bash
# 查詢單一 ID
node id-query.js query 1433

# 批次查詢
node id-query.js batch 1433 1436 1439

# 搜尋重複記錄
node id-query.js duplicates "集思台大會議中心"
```
