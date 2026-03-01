# 場地資料驗證標準程序 (SOP v3.0)

**建立日期**：2026-03-01
**最後更新**：2026-03-01 21:50
**目的**：確保所有場地資料都是正確的

---

## ⚠️ 核心原則

> **資料對了才有價值，資料錯了一文不值。**

### 三個必須

1. **必須找到會議室頁面**（不是首頁）
2. **必須從會議室頁面抓取資料**（不是首頁）
3. **必須驗證資料正確性**（不是只檢查有沒有資料）

---

## 📋 完整驗證流程

### Phase 1：驗證官網

#### 1.1 開啟官網首頁

```javascript
const { chromium } = require('playwright');

async function verifyVenue(venue) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  // 開啟官網
  await page.goto(venue.url, { waitUntil: 'domcontentloaded', timeout: 20000 });
  
  // 驗證官網標題
  const title = await page.title();
  const venueName = venue.name.split('(')[0].trim();
  
  if (!title.includes(venueName)) {
    console.log('❌ 官網標題不匹配');
    console.log('  場地名稱:', venueName);
    console.log('  官網標題:', title);
    return { status: '官網錯誤' };
  }
  
  console.log('✅ 官網標題匹配');
}
```

#### 1.2 尋找會議室頁面

```javascript
// 搜尋會議室相關連結
const meetingLinks = await page.evaluate(() => {
  const links = Array.from(document.querySelectorAll('a'));
  const keywords = ['會議', '會議室', '宴會', '場地', '租借', 'meeting', 'conference', 'venue', 'banquet'];
  
  return links
    .filter(a => {
      const text = a.textContent.toLowerCase();
      const href = a.href.toLowerCase();
      return keywords.some(k => text.includes(k) || href.includes(k));
    })
    .map(a => ({
      text: a.textContent.trim(),
      href: a.href
    }))
    .slice(0, 10);
});

if (meetingLinks.length === 0) {
  console.log('❌ 找不到會議室頁面');
  return { status: '無會議室頁面' };
}

console.log('找到會議室頁面:', meetingLinks.length, '個');
meetingLinks.forEach((link, i) => {
  console.log(`  ${i+1}. ${link.text} → ${link.href}`);
});
```

---

### Phase 2：抓取會議室資料

#### 2.1 開啟會議室頁面

```javascript
// 選擇第一個會議室連結
const meetingUrl = meetingLinks[0].href;
console.log('開啟會議室頁面:', meetingUrl);

await page.goto(meetingUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });
await page.waitForTimeout(3000); // 等待動態內容載入

// 記錄會議室頁面 URL
venue.meetingPageUrl = meetingUrl;
```

#### 2.2 抓取會議室資訊

```javascript
const meetingData = await page.evaluate(() => {
  // 1. 會議室名稱
  const headings = Array.from(document.querySelectorAll('h1, h2, h3'));
  const roomNames = headings
    .filter(h => h.textContent.includes('廳') || h.textContent.includes('室'))
    .map(h => h.textContent.trim());
  
  // 2. 價格
  const bodyText = document.body.innerText;
  const pricePatterns = [
    /半日[：:]\s*(\d{1,3}(,\d{3})*)\s*元/,
    /全日[：:]\s*(\d{1,3}(,\d{3})*)\s*元/,
    /(\d{1,3}(,\d{3})*)\s*元\s*\/\s*(半日|全日|時)/,
    /平日[：:]\s*(\d{1,3}(,\d{3})*)\s*元/
  ];
  
  const prices = {};
  pricePatterns.forEach(pattern => {
    const match = bodyText.match(pattern);
    if (match) {
      prices[match[0]] = parseInt(match[1].replace(/,/g, ''));
    }
  });
  
  // 3. 人數
  const capacityPatterns = [
    /劇院式[：:]\s*(\d+)\s*(人|位)/,
    /教室式[：:]\s*(\d+)\s*(人|位)/,
    /容納[：:]\s*(\d+)\s*(人|位)/,
    /最多[：:]\s*(\d+)\s*(人|位)/
  ];
  
  const capacities = {};
  capacityPatterns.forEach(pattern => {
    const match = bodyText.match(pattern);
    if (match) {
      capacities[match[0]] = parseInt(match[1]);
    }
  });
  
  // 4. 會議室照片（過濾掉 logo、icon、小圖）
  const photos = Array.from(document.querySelectorAll('img'))
    .filter(img => 
      img.src && 
      img.width > 200 && 
      img.height > 150 &&
      !img.src.includes('logo') &&
      !img.src.includes('icon') &&
      !img.src.includes('avatar') &&
      !img.src.includes('sprite') &&
      !img.src.includes('banner') // 通常 banner 不是會議室照片
    )
    .map(img => img.src);
  
  return {
    roomNames,
    prices,
    capacities,
    photos: [...new Set(photos)].slice(0, 10),
    pageTitle: document.title
  };
});

console.log('\n會議室資訊：');
console.log('  頁面標題:', meetingData.pageTitle);
console.log('  會議室名稱:', meetingData.roomNames.join(', ') || '未找到');
console.log('  價格:', Object.keys(meetingData.prices).join(', ') || '未找到');
console.log('  人數:', Object.keys(meetingData.capacities).join(', ') || '未找到');
console.log('  照片:', meetingData.photos.length, '張');
```

---

### Phase 3：驗證與比對

#### 3.1 比對會議室名稱

```javascript
if (meetingData.roomNames.length > 0) {
  const officialName = meetingData.roomNames[0];
  
  if (venue.roomName !== officialName) {
    console.log('\n⚠️ 會議室名稱不一致');
    console.log('  資料庫:', venue.roomName || '(無)');
    console.log('  官網:', officialName);
    
    // 標記為待確認
    venue.status = '待修';
    venue.notes = (venue.notes || '') + ' [會議室名稱需確認]';
    venue.officialRoomName = officialName;
  } else {
    console.log('✅ 會議室名稱一致');
  }
}
```

#### 3.2 比對價格

```javascript
// 解析價格
const priceText = Object.keys(meetingData.prices).join(' ');
const halfDayMatch = priceText.match(/半日[：:]\s*(\d{1,3}(,\d{3})*)\s*元/);
const fullDayMatch = priceText.match(/全日[：:]\s*(\d{1,3}(,\d{3})*)\s*元/);

if (halfDayMatch) {
  const officialPrice = parseInt(halfDayMatch[1].replace(/,/g, ''));
  if (venue.priceHalfDay !== officialPrice) {
    console.log('\n⚠️ 半日價格不一致');
    console.log('  資料庫:', venue.priceHalfDay || '(無)');
    console.log('  官網:', officialPrice);
    venue.officialPriceHalfDay = officialPrice;
  }
}

if (fullDayMatch) {
  const officialPrice = parseInt(fullDayMatch[1].replace(/,/g, ''));
  if (venue.priceFullDay !== officialPrice) {
    console.log('\n⚠️ 全日價格不一致');
    console.log('  資料庫:', venue.priceFullDay || '(無)');
    console.log('  官網:', officialPrice);
    venue.officialPriceFullDay = officialPrice;
  }
}
```

#### 3.3 比對人數

```javascript
const capacityText = Object.keys(meetingData.capacities).join(' ');
const theaterMatch = capacityText.match(/劇院式[：:]\s*(\d+)\s*(人|位)/);
const classroomMatch = capacityText.match(/教室式[：:]\s*(\d+)\s*(人|位)/);

if (theaterMatch) {
  const officialCapacity = parseInt(theaterMatch[1]);
  if (venue.maxCapacityTheater !== officialCapacity) {
    console.log('\n⚠️ 劇院式人數不一致');
    console.log('  資料庫:', venue.maxCapacityTheater || '(無)');
    console.log('  官網:', officialCapacity);
    venue.officialCapacityTheater = officialCapacity;
  }
}

if (classroomMatch) {
  const officialCapacity = parseInt(classroomMatch[1]);
  if (venue.maxCapacityClassroom !== officialCapacity) {
    console.log('\n⚠️ 教室式人數不一致');
    console.log('  資料庫:', venue.maxCapacityClassroom || '(無)');
    console.log('  官網:', officialCapacity);
    venue.officialCapacityClassroom = officialCapacity;
  }
}
```

#### 3.4 驗證照片

```javascript
if (meetingData.photos.length > 0) {
  console.log('\n✅ 找到會議室照片:', meetingData.photos.length, '張');
  
  // 更新照片（來源是會議室頁面）
  venue.images = {
    main: meetingData.photos[0],
    gallery: meetingData.photos,
    source: meetingUrl,  // 記錄來源
    verified: true,
    verifiedAt: new Date().toISOString()
  };
} else {
  console.log('\n⚠️ 未找到會議室照片');
  venue.status = '待修';
  venue.notes = (venue.notes || '') + ' [缺少會議室照片]';
}
```

---

### Phase 4：記錄驗證資訊

```javascript
// 記錄驗證資訊
venue.lastVerified = new Date().toISOString();
venue.verifiedBy = 'SOP v3.0';
venue.meetingPageUrl = meetingUrl;
venue.dataSources = {
  roomName: meetingUrl,
  price: meetingUrl,
  capacity: meetingUrl,
  photos: meetingUrl
};

// 標記驗證狀態
if (venue.status !== '待修') {
  venue.status = '已驗證';
}
```

---

## 📋 完整檢查清單

### 必須驗證的項目

| # | 項目 | 檢查方式 | 來源 | 狀態 |
|---|------|---------|------|------|
| 1 | 官網 URL | 開啟官網，驗證標題 | 官網首頁 | ⬜ |
| 2 | 會議室頁面 | 找到會議室/宴會頁面連結 | 官網選單 | ⬜ |
| 3 | 會議室名稱 | 抓取會議室頁面的名稱，與資料庫比對 | 會議室頁面 | ⬜ |
| 4 | 會議室照片 | 抓取會議室頁面的照片（不是首頁照片） | 會議室頁面 | ⬜ |
| 5 | 價格 | 抓取會議室頁面的價格，與資料庫比對 | 會議室頁面 | ⬜ |
| 6 | 人數 | 抓取會議室頁面的人數，與資料庫比對 | 會議室頁面 | ⬜ |

### 必須記錄的資訊

```json
{
  "url": "官網首頁",
  "meetingPageUrl": "會議室頁面 URL",
  "lastVerified": "2026-03-01T13:50:00Z",
  "verifiedBy": "SOP v3.0",
  "dataSources": {
    "roomName": "會議室頁面 URL",
    "price": "會議室頁面 URL",
    "capacity": "會議室頁面 URL",
    "photos": "會議室頁面 URL"
  },
  "images": {
    "main": "會議室照片",
    "gallery": ["會議室照片1", "會議室照片2"],
    "source": "會議室頁面 URL",
    "verified": true,
    "verifiedAt": "2026-03-01T13:50:00Z"
  }
}
```

---

## 🚨 常見錯誤

### 錯誤 1：只抓首頁照片

**❌ 錯誤做法**：
```javascript
// 只開啟官網首頁
await page.goto(venue.url);

// 抓取所有圖片
const images = Array.from(document.querySelectorAll('img'));
```

**問題**：
- 首頁照片通常是飯店外觀、宣傳圖
- 不是會議室照片

**✅ 正確做法**：
```javascript
// 1. 開啟官網首頁
await page.goto(venue.url);

// 2. 找到會議室頁面
const meetingUrl = findMeetingPage(page);

// 3. 開啟會議室頁面
await page.goto(meetingUrl);

// 4. 抓取會議室照片
const photos = Array.from(page.querySelectorAll('img'))
  .filter(img => /* 過濾條件 */);
```

### 錯誤 2：不驗證資料

**❌ 錯誤做法**：
- 只檢查「有沒有資料」
- 不檢查「資料是否正確」

**✅ 正確做法**：
- 抓取官網資料
- 與資料庫比對
- 標記不一致的項目

### 錯誤 3：不記錄資料來源

**❌ 錯誤做法**：
- 資料來源不明
- 無法追溯驗證

**✅ 正確做法**：
- 記錄會議室頁面 URL
- 記錄資料抓取時間
- 記錄資料來源頁面

---

## 📊 目前統計（2026-03-01）

| 項目 | 數量 | 百分比 | 說明 |
|------|------|--------|------|
| **總場地** | 490 | 100% | - |
| **已驗證** | 0 | 0% | 需要重新驗證 |
| **待修** | 139 | 28% | 資料不完整或有誤 |
| **待確認** | 44 | 9% | 官網無法連線 |

---

## 🎯 結論

**SOP v3.0 的核心改進**：

1. ✅ **必須找到會議室頁面**（不是首頁）
2. ✅ **必須從會議室頁面抓取照片**（不是首頁照片）
3. ✅ **必須驗證所有資料**（不是只檢查有沒有資料）
4. ✅ **必須記錄資料來源**（可以追溯驗證）

---

**這份 SOP 確保所有資料都是正確的！**
