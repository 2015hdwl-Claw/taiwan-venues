# 場地資料驗證標準程序 (SOP v4.0)

**建立日期**：2026-03-01
**最後更新**：2026-03-05 13:40
**目的**：確保所有場地資料都是正確的
**版本更新**：v4.0 - 加入「逐一檢查每個廳房 URL」和「確認照片是否正確」步驟

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

### 🚨 Phase 3.5：逐一檢查每個廳房 URL（v4.0 新增）

> **重要**：許多場地有多個廳房，必須逐一檢查每個廳房的 URL，確保資料正確！

#### 3.5.1 檢查是否有場地清單頁面

```javascript
// 尋找「場地一覽」「會議室介紹」「宴會廳房」等頁面
const venueListLinks = await page.evaluate(() => {
  const links = Array.from(document.querySelectorAll('a'));
  const keywords = ['場地一覽', '會議室介紹', '宴會廳房', '場地介紹', '會議設施', 'venue list', 'meeting rooms', 'facilities'];
  
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
    .slice(0, 5);
});

if (venueListLinks.length > 0) {
  console.log('\n找到場地清單頁面:', venueListLinks.length, '個');
  
  // 開啟場地清單頁面
  const listUrl = venueListLinks[0].href;
  await page.goto(listUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });
  
  // 記錄場地清單 URL
  venue.venueListUrl = listUrl;
}
```

#### 3.5.2 抓取所有廳房資訊

```javascript
// 從場地清單頁面抓取所有廳房資訊
const allRooms = await page.evaluate(() => {
  // 方法1：尋找廳房列表
  const roomCards = Array.from(document.querySelectorAll('.room-card, .venue-item, .meeting-room, [class*="room"], [class*="venue"]'));
  
  if (roomCards.length > 0) {
    return roomCards.map(card => {
      const nameEl = card.querySelector('h3, h4, .name, .title');
      const linkEl = card.querySelector('a');
      const imgEl = card.querySelector('img');
      
      return {
        name: nameEl ? nameEl.textContent.trim() : '',
        url: linkEl ? linkEl.href : '',
        photo: imgEl ? imgEl.src : ''
      };
    }).filter(r => r.name);
  }
  
  // 方法2：尋找廳房名稱（包含「廳」「室」「房」等）
  const headings = Array.from(document.querySelectorAll('h2, h3, h4'));
  const roomNames = headings
    .filter(h => /廳|室|房|Room|Hall/.test(h.textContent))
    .map(h => h.textContent.trim());
  
  return roomNames.map(name => ({ name }));
});

if (allRooms.length > 0) {
  console.log('\n找到廳房:', allRooms.length, '個');
  allRooms.forEach((room, i) => {
    console.log(`  ${i+1}. ${room.name}${room.url ? ` → ${room.url}` : ''}`);
  });
  
  // 記錄廳房資訊
  venue.roomsCount = allRooms.length;
  venue.roomNames = allRooms.map(r => r.name);
  venue.roomUrls = allRooms.filter(r => r.url).map(r => ({ name: r.name, url: r.url }));
}
```

#### 3.5.3 逐一檢查每個廳房

```javascript
// 如果有多個廳房，逐一檢查
if (allRooms.length > 1) {
  console.log('\n開始逐一檢查每個廳房...');
  
  for (const room of allRooms) {
    if (room.url && room.url !== meetingUrl) {
      console.log(`\n檢查: ${room.name}`);
      console.log(`  URL: ${room.url}`);
      
      // 開啟廳房頁面
      await page.goto(room.url, { waitUntil: 'domcontentloaded', timeout: 20000 });
      await page.waitForTimeout(2000);
      
      // 抓取該廳房的照片
      const roomPhotos = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('img'))
          .filter(img => 
            img.src && 
            img.width > 200 && 
            img.height > 150 &&
            !img.src.includes('logo') &&
            !img.src.includes('icon')
          )
          .map(img => img.src);
      });
      
      if (roomPhotos.length > 0) {
        console.log(`  ✅ 找到照片: ${roomPhotos.length} 張`);
        // 可以選擇性地保存每個廳房的照片
      } else {
        console.log(`  ⚠️ 未找到照片`);
      }
    }
  }
}
```

---

### 🚨 Phase 3.6：確認照片是否正確（v4.0 新增）

> **重要**：照片錯誤是最常見的問題！必須實際查看照片內容，確認是否為該會議室的照片！

#### 3.6.1 檢查照片 URL 是否有效

```javascript
// 檢查照片 URL 是否可以訪問
async function checkPhotoUrl(url) {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch (error) {
    return false;
  }
}

// 檢查所有照片
if (venue.images && venue.images.main) {
  const isValid = await checkPhotoUrl(venue.images.main);
  if (!isValid) {
    console.log('\n⚠️ 主照片 URL 無效:', venue.images.main);
    venue.status = '待修';
    venue.notes = (venue.notes || '') + ' [主照片 URL 無效]';
  }
}
```

#### 3.6.2 驗證照片內容（人工或 AI 輔助）

```javascript
// 方法1：使用 AI 視覺模型驗證照片內容
// （需要調用外部 API，如 Google Vision、OpenAI Vision 等）

// 方法2：人工檢查清單
const photoChecklist = [
  '照片中是否有會議桌/宴會桌？',
  '照片中是否有椅子？',
  '照片中是否有投影設備/螢幕？',
  '照片是否顯示的是室內空間（不是戶外）？',
  '照片是否顯示的是會議/宴會場地（不是餐廳、客房、大廳）？',
  '照片是否清晰可辨識？'
];

console.log('\n📸 照片驗證清單:');
photoChecklist.forEach((item, i) => {
  console.log(`  ${i+1}. ${item}`);
});

// 如果有任何一項不符合，標記為待修
if (/* 照片內容不符 */) {
  console.log('\n❌ 照片內容不符');
  venue.status = '待修';
  venue.images.needsUpdate = true;
  venue.images.note = '照片內容錯誤：[描述問題]';
}
```

#### 3.6.3 常見的照片錯誤類型

| 錯誤類型 | 描述 | 範例 |
|---------|------|------|
| **Logo/Icon** | 照片是 logo 或 icon，不是會議室 | ID 1085 - 主照片是一把折扇 |
| **錯誤廳房** | 照片是其他廳房，不是目標廳房 | ID 1450 - 照片是大會堂，不是101A |
| **大廳/外觀** | 照片是飯店大廳或外觀 | 常見於只抓首頁照片的情況 |
| **餐廳/客房** | 照片是餐廳或客房 | 不是會議室 |
| **模糊/解析度低** | 照片品質不佳 | 需要更換高清照片 |
| **URL 失效** | 照片連結無法訪問 | 404 錯誤 |

#### 3.6.4 照片驗證最佳實踐

```javascript
// 完整的照片驗證流程
async function verifyPhotos(venue, page) {
  console.log('\n📸 開始照片驗證...');
  
  // 1. 檢查是否有照片
  if (!venue.images || !venue.images.main) {
    console.log('❌ 缺少照片');
    venue.status = '待修';
    venue.images = {
      main: '',
      gallery: [],
      needsUpdate: true,
      note: '缺少照片'
    };
    return;
  }
  
  // 2. 檢查照片 URL 是否有效
  const isValid = await checkPhotoUrl(venue.images.main);
  if (!isValid) {
    console.log('❌ 照片 URL 無效');
    venue.status = '待修';
    venue.images.needsUpdate = true;
    venue.images.note = '照片 URL 無效';
    return;
  }
  
  // 3. 檢查照片來源
  if (!venue.images.source) {
    console.log('⚠️ 未記錄照片來源');
    venue.images.needsUpdate = true;
  }
  
  // 4. 檢查照片是否來自會議室頁面
  if (venue.images.source && !venue.images.source.includes('meeting') && !venue.images.source.includes('event')) {
    console.log('⚠️ 照片可能來自首頁，而非會議室頁面');
    venue.images.needsUpdate = true;
    venue.images.note = (venue.images.note || '') + ' [照片來源可能是首頁]';
  }
  
  // 5. 標記照片已驗證
  venue.images.verified = true;
  venue.images.verifiedAt = new Date().toISOString();
  venue.images.verifiedBy = 'SOP v4.0';
  
  console.log('✅ 照片驗證完成');
}
```

---

### Phase 4：記錄驗證資訊

```javascript
// 記錄驗證資訊
venue.lastVerified = new Date().toISOString();
venue.verifiedBy = 'SOP v4.0';
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

**SOP v4.0 的核心改進**（基於用戶反饋的資料品質問題）：

### ✅ v3.0 的改進
1. **必須找到會議室頁面**（不是首頁）
2. **必須從會議室頁面抓取照片**（不是首頁照片）
3. **必須驗證所有資料**（不是只檢查有沒有資料）
4. **必須記錄資料來源**（可以追溯驗證）

### 🚨 v4.0 的新增改進（2026-03-05）

基於以下真實案例的慘痛教訓：

#### 案例 1：ID 1512 - 政大公企中心
- **問題**：沒有價格與照片，但標記為「上架」
- **修正**：改為「待修」
- **教訓**：必須檢查資料完整性

#### 案例 2：ID 1085 - 台北文華東方酒店
- **問題**：主照片是一把折扇，不是會議室照片！
- **修正**：改為「待修」，標記照片錯誤
- **教訓**：必須實際查看照片內容

#### 案例 3：ID 1450 - 台北國際會議中心
- **問題**：照片是大會堂，不是 101A 會議室
- **修正**：改為「待修」，標記照片錯誤
- **教訓**：必須確認照片是否為該廳房

### 📋 v4.0 新增的關鍵步驟

5. ✅ **必須逐一檢查每個廳房的 URL**（Phase 3.5）
   - 找到場地清單頁面
   - 抓取所有廳房資訊
   - 逐一檢查每個廳房

6. ✅ **必須確認照片是否正確**（Phase 3.6）
   - 檢查照片 URL 是否有效
   - 驗證照片內容（AI 或人工）
   - 識別常見的照片錯誤類型
   - 標記需要更新的照片

---

## 🔥 為什麼這些改進如此重要？

**資料品質 = 產品價值**

- ❌ **錯誤的照片** → 用戶失去信任
- ❌ **不完整的資料** → 用戶無法決策
- ❌ **錯誤的價格** → 用戶感到被欺騙
- ❌ **錯誤的廳房** → 用戶訂錯場地

**每一個錯誤都在傷害產品的信譽！**

---

**這份 SOP 確保所有資料都是正確的！**
**v4.0 - 2026-03-05**
