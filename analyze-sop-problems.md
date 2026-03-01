# SOP 問題分析

## 🔍 台北六福客棧案例

### 目前的資料

```json
{
  "name": "台北六福客棧(Leofoo)",
  "roomName": "六福廳",
  "priceHalfDay": 22000,
  "priceFullDay": 40000,
  "maxCapacityTheater": 200,
  "maxCapacityClassroom": 120,
  "url": "https://www.leofoo.com.tw",
  "images": {
    "main": "https://www.leofoo.com.tw/asset/types/main/img/index/kv_img_01.jpg",
    "gallery": [...]
  }
}
```

### 問題分析

#### 1. ❌ 官網錯誤

- **資料庫官網**：`https://www.leofoo.com.tw`
- **實際內容**：六福旅遊集團首頁（不是六福客棧）
- **正確官網**：需要搜尋確認

#### 2. ❌ 照片錯誤

- **資料庫照片**：`kv_img_01.jpg`（首頁輪播圖）
- **實際內容**：可能是飯店外觀或宣傳圖
- **正確照片**：應該是會議室照片

#### 3. ❌ 會議室資訊未驗證

- **會議室名稱**：六福廳（是否正確？）
- **價格**：22000/40000（是否與官網一致？）
- **人數**：200/120（是否與官網一致？）
- **來源**：未知（沒有記錄資料來源）

---

## 🚨 SOP 的根本問題

### 問題 1：只抓首頁照片

**現狀**：
```javascript
// 只開啟官網首頁
await page.goto(venue.url);

// 抓取所有圖片
const images = Array.from(document.querySelectorAll('img'));
```

**問題**：
- 首頁照片通常是飯店外觀、宣傳圖
- 不是會議室照片
- 沒有去會議室頁面

### 問題 2：沒有驗證資料

**現狀**：
- 只檢查「有沒有資料」
- 沒有檢查「資料是否正確」

**應該做的**：
- 到官網會議室頁面
- 抓取會議室名稱
- 抓取價格
- 抓取人數
- 與資料庫比對

### 問題 3：沒有記錄資料來源

**現狀**：
- 資料來源不明
- 無法追溯驗證

**應該做的**：
- 記錄會議室頁面 URL
- 記錄資料抓取時間
- 記錄資料來源頁面

### 問題 4：官網 URL 不驗證

**現狀**：
- 只測試「能不能連線」
- 沒有檢查「是不是正確的官網」

**應該做的**：
- 驗證官網標題
- 檢查官網內容是否匹配場地名稱
- 找到會議室頁面

---

## ✅ 正確的 SOP

### Phase 1：驗證官網

```javascript
// 1. 開啟官網
await page.goto(venue.url);

// 2. 驗證官網標題
const title = await page.title();
if (!title.includes(venue.name.split('(')[0])) {
  console.log('⚠️ 官網標題不匹配');
  // 搜尋正確官網
}

// 3. 尋找會議室頁面
const meetingLinks = await page.evaluate(() => {
  const links = Array.from(document.querySelectorAll('a'));
  return links.filter(a => 
    a.href.includes('meeting') || 
    a.href.includes('conference') ||
    a.textContent.includes('會議')
  ).map(a => a.href);
});
```

### Phase 2：抓取會議室資料

```javascript
// 1. 開啟會議室頁面
await page.goto(meetingUrl);

// 2. 抓取會議室資訊
const meetingData = await page.evaluate(() => {
  // 會議室名稱
  const roomName = document.querySelector('h1, h2')?.textContent;
  
  // 價格
  const priceText = document.body.innerText.match(/(\d{1,3}(,\d{3})*)\s*元/);
  
  // 人數
  const capacityText = document.body.innerText.match(/(\d+)\s*(人|位)/);
  
  // 會議室照片（過濾掉 logo、icon）
  const photos = Array.from(document.querySelectorAll('img'))
    .filter(img => 
      img.src && 
      img.width > 200 && 
      !img.src.includes('logo') &&
      !img.src.includes('icon')
    )
    .map(img => img.src);
  
  return { roomName, priceText, capacityText, photos };
});
```

### Phase 3：驗證與更新

```javascript
// 1. 比對資料
if (meetingData.roomName !== venue.roomName) {
  console.log('⚠️ 會議室名稱不一致');
  console.log('  資料庫:', venue.roomName);
  console.log('  官網:', meetingData.roomName);
}

// 2. 更新資料
venue.roomName = meetingData.roomName;
venue.images = {
  main: meetingData.photos[0],
  gallery: meetingData.photos,
  source: meetingUrl  // 記錄來源
};
venue.lastVerified = new Date().toISOString();
```

---

## 📋 完整檢查清單

### 必須驗證的項目

| 項目 | 檢查方式 | 來源 |
|------|---------|------|
| **官網 URL** | 開啟官網，驗證標題 | 官網首頁 |
| **會議室頁面** | 找到會議室/宴會頁面連結 | 官網選單 |
| **會議室名稱** | 抓取會議室頁面的名稱 | 會議室頁面 |
| **會議室照片** | 抓取會議室頁面的照片 | 會議室頁面 |
| **價格** | 抓取會議室頁面的價格 | 會議室頁面 |
| **人數** | 抓取會議室頁面的人數 | 會議室頁面 |

### 必須記錄的資訊

```json
{
  "url": "官網首頁",
  "meetingPageUrl": "會議室頁面 URL",
  "lastVerified": "2026-03-01T13:50:00Z",
  "verifiedBy": "SOP v3.0",
  "dataSources": {
    "roomName": "會議室頁面",
    "price": "會議室頁面",
    "photos": "會議室頁面"
  }
}
```

---

## 🎯 結論

**資料對了才有價值，資料錯了一文不值。**

目前的 SOP 有嚴重缺陷：
1. ❌ 只抓首頁照片，不確認是否為會議室照片
2. ❌ 不驗證會議室名稱、價格、人數
3. ❌ 不記錄資料來源
4. ❌ 不驗證官網是否正確

**必須重新設計 SOP**，確保：
1. ✅ 找到正確的會議室頁面
2. ✅ 從會議室頁面抓取照片
3. ✅ 驗證所有資料與官網一致
4. ✅ 記錄所有資料來源
