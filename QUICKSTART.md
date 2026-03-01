# 快速開始指南

## 🚀 立即使用

### 步驟 1：開啟網頁
```bash
# 方式 1：直接用瀏覽器開啟
open index.html

# 方式 2：使用簡單的 HTTP 伺服器
python3 -m http.server 8000
# 然後在瀏覽器開啟 http://localhost:8000
```

### 步驟 2：載入範例資料（選用）
1. 開啟網頁後，點擊「匯入資料」按鈕
2. 選擇 `sample-data.json` 檔案
3. 系統會自動載入 10 個範例場地

### 步驟 3：開始使用
- 搜尋場地
- 篩選場地
- 新增場地
- 查看詳情
- 匯出資料

## 📱 測試不同裝置

### 手機測試
1. 確保電腦和手機在同一個 WiFi 網路
2. 查看電腦 IP 位址：
   ```bash
   # Linux/Mac
   ifconfig | grep inet

   # Windows
   ipconfig
   ```
3. 在手機瀏覽器輸入：`http://你的IP:8000`

### 平板測試
同上，使用平板瀏覽器訪問。

## 🎯 常用操作

### 新增場地
1. 點擊「新增場地」按鈕
2. 填寫必填欄位（標記 * 號）
3. 點擊「新增場地」儲存

### 搜尋場地
- 在搜尋框輸入關鍵字
- 即時顯示搜尋結果

### 篩選場地
1. 選擇活動規模
2. 選擇縣市
3. 選擇場地類型
4. 點擊「重設篩選」清除

### 查看詳情
- 點擊任何場地卡片
- 查看完整資訊
- 可刪除場地

### 匯出資料
1. 點擊「匯出 CSV」或「匯出 JSON」
2. 檔案會自動下載

### 匯入資料
1. 準備 CSV 或 JSON 格式的資料
2. 點擊「匯入資料」按鈕
3. 選擇檔案
4. 資料會自動加入現有資料庫

## 🔧 進階功能

### 自訂場地類型
編輯 `script.js` 中的 `typeFilter` 選項：
```javascript
<option value="你的類型">你的類型</option>
```

### 自訂縣市列表
編輯 `index.html` 和 `script.js` 中的 `cityFilter` 選項。

### 修改顏色主題
編輯 `style.css` 中的漸層色彩：
```css
background: linear-gradient(135deg, #你的顏色1 0%, #你的顏色2 100%);
```

## 📊 資料格式

### JSON 格式
```json
{
  "id": 1,
  "name": "場地名稱",
  "roomName": "廳別",
  "type": "會議室",
  "city": "台北市",
  "address": "詳細地址",
  "contactPerson": "聯絡人",
  "contactPhone": "02-1234-5678",
  "contactEmail": "email@example.com",
  "pricePerHour": "1000",
  "priceHalfDay": "5000",
  "priceFullDay": "8000",
  "maxCapacityEmpty": 100,
  "maxCapacityTheater": 100,
  "maxCapacityClassroom": 50,
  "availableTimeWeekday": "09:00-21:00",
  "availableTimeWeekend": "09:00-18:00",
  "equipment": "設備資訊",
  "notes": "備註"
}
```

### CSV 格式
```csv
場地名稱,廳別,類型,縣市,地址,聯絡人,電話,電子郵件,每小時費用,半天費用,全天費用,最大容納(空場),最大容納(劇院型),最大容納(教室型),平日時間,假日時間,設備費用,備註,活動規模
```

## 🐛 故障排除

### 資料消失了
- 檢查是否清除了瀏覽器資料
- 嘗試從備份檔案匯入

### 匯入失敗
- 確認檔案格式正確
- CSV 檔案建議使用 UTF-8 編碼
- JSON 檔案要符合格式要求

### 顯示異常
- 嘗試重新整理網頁
- 清除瀏覽器快取
- 使用無痕模式測試

## 📞 需要幫助？

如有任何問題，請：
1. 查閱 README.md 完整文件
2. 檢查瀏覽器主控台的錯誤訊息
3. 聯繫技術支援

---

**祝你使用愉快！** 🎉
