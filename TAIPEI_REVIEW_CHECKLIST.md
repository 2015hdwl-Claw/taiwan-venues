# 台北市場地複查檢查清單

**用途**: 後台複查時使用的快速參考
**日期**: 2026-03-05

---

## 📋 快速複查流程

### Step 1: 啟動後台
```bash
cd /root/.openclaw/workspace/taiwan-venues
python3 admin-server.py
```
開啟 http://localhost:8080

### Step 2: 篩選台北市
- 城市選「台北市」
- 狀態選「上架」

### Step 3: 逐一檢查

---

## ✅ 單一場地檢查清單

### 必查項目

| # | 項目 | 檢查方式 | 通過標準 |
|---|------|---------|---------|
| 1 | **官網 URL** | 點擊連結 | 可開啟、標題含場地名 |
| 2 | **會議室頁面** | 點擊 venueListUrl | 有會議室資訊 |
| 3 | **主照片** | 查看圖片 | 可顯示、來自官網 |
| 4 | **電話** | 查看格式 | XX-XXXX-XXXX |
| 5 | **地址** | 查看完整性 | 有區、有路段 |

### 選查項目

| # | 項目 | 檢查方式 |
|---|------|---------|
| 6 | 價格 | 是否合理（1000-500000） |
| 7 | 容量 | 是否合理（10-5000） |
| 8 | 會議室數量 | roomsCount > 0 |

---

## 🚨 常見問題快速處理

### Q1: 官網連結失效
```
1. Google 搜尋「場地名稱 官網」
2. 找到新官網 URL
3. 更新 url 欄位
4. 重新驗證
```

### Q2: 找不到會議室頁面
```
1. 進入官網
2. 搜尋「會議」「宴會」「場地」
3. 記錄找到的頁面 URL
4. 更新 venueListUrl 欄位
```

### Q3: 照片無法顯示
```
1. 進入會議室頁面
2. 找到場地照片
3. 右鍵複製圖片網址
4. 更新 venueMainImageUrl 和 images.main
5. 記錄 images.source
```

### Q4: 電話格式錯誤
```
錯誤：(02)12345678
正確：02-1234-5678

直接修正格式即可
```

---

## 📊 台北市現況統計

| 項目 | 數量 | 需處理 |
|------|------|--------|
| 總場地 | 236 | - |
| 缺 venueListUrl | 79 | ⚠️ 高優先 |
| 缺 venueMainImageUrl | 205 | ⚠️ 高優先 |
| 缺 images.main | 89 | 中優先 |

---

## 🏨 按類型處理順序

### 第一批：飯店場地（87 間）
- 國際連鎖：手動驗證（被防護）
- 本地飯店：自動驗證

### 第二批：會議中心（90 間）
- 大學場地：自動驗證
- 商業會議中心：自動驗證

### 第三批：展演場地（22 間）
- 政府場地：手動驗證
- 私人場地：自動驗證

### 第四批：其他（37 間）
- 逐一檢查

---

## 🔧 快速指令

```bash
# 查看台北市場地統計
cat venues-all-cities.json | python3 -c "
import json, sys
data = json.load(sys.stdin)
taipei = [v for v in data if v.get('city') == '台北市']
print(f'總數: {len(taipei)}')
print(f'缺 venueListUrl: {sum(1 for v in taipei if not v.get(\"venueListUrl\"))}')
print(f'缺 venueMainImageUrl: {sum(1 for v in taipei if not v.get(\"venueMainImageUrl\"))}')
"

# 驗證單一場地官網
curl -I https://example.com

# 備份資料
cp venues-all-cities.json venues-all-cities-backup-$(date +%Y%m%d).json
```

---

## 📝 記錄範本

每次複查後記錄：

```
日期：2026-03-05
複查場地：XX 個
發現問題：
  - 官網失效：X 個
  - 缺會議室頁面：X 個
  - 缺照片：X 個
  - 資料錯誤：X 個
已修正：X 個
待處理：X 個
```

---

**維護者**: Jobs (CTO)
