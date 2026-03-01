# 場地網址驗證機制

## 🎯 目標
確保資料庫中的網址是正確的官方網站

## 📋 多層驗證策略

### 第1層：自動驗證（快速）
```python
1. HTTP 狀態檢查
   - 網址是否可訪問？
   - 是否重定向？

2. 內容關鍵字匹配
   - 網頁是否包含場地名稱？
   - 是否包含相關關鍵字（會議、宴會等）？

3. 網址結構檢查
   - 是否是官方域名？
   - 是否包含品牌名稱？
```

### 第2層：搜尋引擎驗證（中等）
```python
1. Google 搜尋
   query = f"{venue_name} 官網"
   - 檢查第一個結果
   - 比對是否與資料庫中的網址一致

2. 知名飯店品牌資料庫
   - 建立品牌官網對照表
   - 例如：Sheraton → sheraton.com / marriott.com
```

### 第3層：人工審核（慢但準確）
```python
1. 重要場地清單
   - 列出 top 50 重要場地
   - 人工逐一確認官網

2. 異常標記
   - HTTP 錯誤的場地
   - 內容不符的場地
   - 需要人工檢查
```

## 🔧 實作建議

### 方案A：預處理驗證
```bash
# 在爬蟲前先驗證網址
python verify_urls.py --fix
```

### 方案B：爬蟲時驗證
```python
# 爬蟲時自動驗證
if not verify_url(url):
    url = search_correct_url(venue_name)
```

### 方案C：定期審核
```bash
# 每週執行一次
cron: 0 0 * * 0 python verify_urls.py --report
```

## 📊 優先順序

1. **立即執行**：修正已知的錯誤網址（如台北喜來登）
2. **短期執行**：驗證 top 50 重要場地的網址
3. **長期執行**：建立自動驗證機制

## 🛠️ 工具

已創建：
- `verify_and_update_urls.py`：網址驗證和修正工具

待開發：
- 搜尋引擎整合（Google/Bing API）
- 品牌官網對照表
- 自動修正建議系統

## 📝 範例

### 台北喜來登大飯店
- ❌ 錯誤：https://www.sheraton.com/taipei
- ✅ 正確：https://www.sheratongrandtaipei.com/websev?lang=zh-tw
- 原因：全球品牌網站 vs 台灣官網

### 驗證方法
1. Google 搜尋 "台北喜來登大飯店 官網"
2. 檢查搜尋結果第一個連結
3. 確認網頁內容包含場地資訊
4. 更新資料庫
