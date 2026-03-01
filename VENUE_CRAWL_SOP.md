# 場地網站爬蟲標準程序 (SOP)

**建立日期**：2026-03-01
**最後更新**：2026-03-01 20:55
**目的**：確保每次爬蟲都遵循正確步驟，不鬼打牆

---

## 📊 目前統計（2026-03-01）

| 項目 | 數量 | 百分比 |
|------|------|--------|
| **總場地** | 490 | 100% |
| **有照片** | 180 | 37% |
| **台北市場地** | 203 | - |
| **台北市有照片** | 143 | 70% |
| **待確認** | 9 | 2% |

---

## ⚠️ 重要：完整檢查流程

### 第一步：檢查必填欄位（必做！）

**每個場地必須有以下欄位：**

| 欄位 | 說明 | 檢查條件 |
|------|------|---------|
| 會議室名稱 | roomName | 非空字串 |
| 價格 | priceHalfDay 或 priceFullDay | > 0 |
| 劇院式人數 | maxCapacityTheater | > 0 |
| 教室式人數 | maxCapacityClassroom | > 0 |
| 照片 | images.main 或 images.gallery | 有照片 |
| 官網 | url | 有效網址 |
| 聯絡電話 | contactPhone | 非空字串 |

**檢查腳本：**

```javascript
const fs = require('fs');
const data = JSON.parse(fs.readFileSync('venues-all-cities.json', 'utf8'));

// 定義必填欄位
const requiredFields = {
  '會議室名稱': v => v.roomName && v.roomName.trim().length > 0,
  '價格': v => v.priceHalfDay || v.priceFullDay,
  '劇院式人數': v => v.maxCapacityTheater && v.maxCapacityTheater > 0,
  '教室式人數': v => v.maxCapacityClassroom && v.maxCapacityClassroom > 0,
  '照片': v => v.images?.main || (v.images?.gallery && v.images.gallery.length > 0),
  '官網': v => v.url && v.url.startsWith('http'),
  '聯絡電話': v => v.contactPhone && v.contactPhone.trim().length > 0
};

// 檢查所有場地
const venues = data.filter(v => v.city === '台北市');
const results = venues.map(v => {
  const missing = [];
  Object.entries(requiredFields).forEach(([field, check]) => {
    if (!check(v)) missing.push(field);
  });
  return { name: v.name, missing, status: missing.length === 0 ? '完整' : '待修' };
});

// 統計
const complete = results.filter(r => r.status === '完整');
const needFix = results.filter(r => r.status === '待修');

console.log('總場地:', venues.length);
console.log('✅ 資料完整:', complete.length);
console.log('❌ 需要修補:', needFix.length);

// 儲存待修清單
fs.writeFileSync('need-fix.json', JSON.stringify(needFix, null, 2));
```

### 第二步：標記待修場地

**任何缺漏都標記為「待修」：**

```javascript
data.forEach(v => {
  const result = results.find(r => r.name === v.name);
  if (result && result.missing.length > 0) {
    v.status = '待修';
    v.missingFields = result.missing;
  } else if (result && result.missing.length === 0) {
    v.status = '上架';
    delete v.missingFields;
  }
});
```

### 第三步：確認「檢查完畢」的標準

**一個城市「檢查完畢」的定義：**

| 條件 | 說明 |
|------|------|
| ✅ 所有場地都已檢查 | 資料完整 / 待修 / 待確認 / 下架 |
| ✅ 待修場地已標記 | status = '待修'，missingFields 已記錄 |
| ✅ 待確認場地已記錄 | 官網無法連線的場地 |
| ✅ 下架場地已排除 | 不需處理 |

### 台北市目前狀況（2026-03-01 21:35）

| 分類 | 數量 | 百分比 |
|------|------|--------|
| ✅ **資料完整** | **84** | **41%** |
| ❌ **需要修補** | **119** | **59%** |
| 🟡 **待確認** | 44 | 22% |
| ⚫ **下架** | 9 | 4% |

**缺漏欄位統計：**
- 教室式人數：74 個
- 照片：55 個
- 劇院式人數：54 個
- 價格：21 個
- 聯絡電話：5 個

**結論：台北市尚未檢查完畢，還有 119 個場地需要修補資料！**

---

## 🎯 目標資料（每個場地必收集）

### 1. 官網資訊
- [ ] 官網首頁網址
- [ ] 會議/宴會場地頁面網址

### 2. 聯絡資訊
- [ ] 聯絡電話
- [ ] 聯絡 Email
- [ ] 聯絡地址

### 3. 租借資訊
- [ ] 價格（時薪/半日/全日）
- [ ] 可租借時段（平日/假日）
- [ ] 容納人數（劇院式/教室式）

### 4. 照片（最重要！）
- [ ] **主照片**：從官網抓取，不用維基百科
- [ ] **會議室照片**：每個會議室的照片陣列

---

## 🔧 工具選擇指南

### 工具比較

| 工具 | 成功率 | 速度 | 適用場景 | 安裝狀態 |
|------|--------|------|---------|---------|
| **web_fetch** | 95% | 快 | 靜態 HTML | ✅ 內建 |
| **Playwright** | 70% | 中 | 動態網頁 | ✅ 已安裝 |
| **agent-browser** | 40% | 慢 | 動態網頁 | ✅ 已安裝 |
| **Firecrawl** | 80% | 快 | 所有網頁 | ❌ 需要 API Key |

### 選擇準則

```
1. 先用 web_fetch 測試（最快）
   ↓ 失敗
2. 用 Playwright（較穩定）
   ↓ 失敗
3. 用 agent-browser（最後手段）
   ↓ 失敗
4. 標記為「待確認」
```

### Playwright 安裝

```bash
# 安裝
npm install -g playwright
playwright install chromium

# 驗證
playwright --version  # 1.58.2
```

### Playwright 使用範例

```javascript
const { chromium } = require('playwright');

async function scrapePhotos(url) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(3000);
  
  const images = await page.evaluate(() => {
    const imgs = Array.from(document.querySelectorAll('img'));
    return imgs
      .filter(img => img.src && img.width > 100 && img.height > 100)
      .map(img => img.src)
      .filter(src => 
        src.startsWith('http') &&
        !src.includes('logo') && 
        !src.includes('icon')
      );
  });
  
  await browser.close();
  return [...new Set(images)].slice(0, 5);
}
```

---

## 📋 標準爬蟲流程

### Phase 1：確認官網

```
1. 測試官網是否可連線
   curl -I "https://example.com" --connect-timeout 5

2. 如果 DNS 無法解析 → 搜尋正確官網
   - 嘗試 .com.tw / .tw 變體
   - 用 Google 搜尋「[場地名稱] 官網」

3. 如果 SSL 憑證錯誤 → 標記為「待確認」

4. 如果連線逾時 → 增加 timeout 或標記為「待確認」
```

### Phase 2：選擇工具

```
1. 先用 web_fetch 測試
   - 成功 → 提取照片 URL
   - 失敗 → 進入步驟 2

2. 用 Playwright 抓取
   - 成功 → 提取照片 URL
   - 失敗 → 進入步驟 3

3. 用 agent-browser 抓取
   - 成功 → 提取照片 URL
   - 失敗 → 標記為「待確認」
```

### Phase 3：提取照片

```javascript
// Playwright 照片提取
const images = await page.evaluate(() => {
  const imgs = Array.from(document.querySelectorAll('img'));
  return imgs
    .filter(img => img.src && img.width > 100 && img.height > 100)
    .map(img => img.src)
    .filter(src => 
      src.startsWith('http') &&
      !src.includes('logo') && 
      !src.includes('icon') &&
      !src.includes('avatar') &&
      !src.includes('sprite')
    );
});

// 過濾後的照片
const photos = [...new Set(images)].slice(0, 5);
```

### Phase 4：更新資料庫

```javascript
// 更新場地照片
venue.images = {
  main: photos[0],
  gallery: photos,
  source: url
};
venue.status = '上架';  // ⚠️ 不是 "active"
```

### Phase 5：驗證與提交

```bash
# 驗證 JSON
node -e "console.log(JSON.parse(require('fs').readFileSync('venues-all-cities.json')).length)"

# 提交更新
git add -A && git commit -m "✨ 更新場地照片" && git push
```

---

## ⚠️ 錯誤處理

### DNS 無法解析（ERR_NAME_NOT_RESOLVED）

**原因**：官網已關閉或網址已變更

**處理流程**：
```
1. 嘗試常見變體：
   - .com → .com.tw
   - www. → 無 www
   - .com → .tw

2. 如果仍失敗 → 標記為「待確認」
   venue.status = '待確認';
   venue.notes = '[官網無法連線，需手動搜尋確認]';

3. 記錄到 failed-venues.json
```

**成功案例**：
- 台北丹迪旅店：`www.ttdhotel.com` → `www.dandyhotel.com.tw` ✅
- 台北京站酒店：`www.caametro.com` → `www.cityinn.com.tw` ✅
- 台北亞都麗緻：`www.landis.com.tw` → `www.thelandis.com` ✅

### SSL 憑證錯誤（ERR_CERT_COMMON_NAME_INVALID）

**原因**：憑證過期或不匹配

**處理方式**：
- 嘗試 http:// 版本（如果可用）
- 標記為「待確認」

### 連線逾時（Timeout）

**原因**：網站回應過慢

**處理方式**：
```javascript
// 增加 timeout
await page.goto(url, { timeout: 30000 });

// 或分批處理
for (const venue of venues) {
  await scrapeVenue(venue);
  await new Promise(r => setTimeout(r, 2000)); // 間隔 2 秒
}
```

### 照片為 0

**原因**：
1. 動態載入（需要滾動或等待）
2. 擋爬蟲
3. 照片在其他頁面

**處理方式**：
```javascript
// 1. 滾動觸發載入
await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
await page.waitForTimeout(3000);

// 2. 等待特定元素
await page.waitForSelector('img[src*="venue"]', { timeout: 10000 });

// 3. 嘗試其他頁面
const links = await page.evaluate(() => 
  Array.from(document.querySelectorAll('a'))
    .filter(a => a.href.includes('venue') || a.href.includes('meeting'))
    .map(a => a.href)
);
```

---

## 🔄 批次抓取流程

### Step 1：建立待處理清單

```javascript
// 過濾無照片的場地
const pending = data.filter(v => 
  !v.images?.main && 
  (!v.images?.gallery || v.images.gallery.length === 0)
);

fs.writeFileSync('pending-venues.json', JSON.stringify(pending, null, 2));
console.log('待處理:', pending.length, '個');
```

### Step 2：分批執行

```javascript
const batchSize = 10;
const results = [];

for (let i = 0; i < pending.length; i += batchSize) {
  const batch = pending.slice(i, i + batchSize);
  
  for (const venue of batch) {
    const result = await scrapeVenue(browser, venue);
    results.push(result);
    
    // 間隔避免被封
    await new Promise(r => setTimeout(r, 1000));
  }
  
  // 每 10 分鐘回報進度
  console.log(`進度: ${results.length}/${pending.length}`);
}
```

### Step 3：合併結果

```javascript
// 讀取所有批次結果
const batchFiles = fs.readdirSync('.').filter(f => f.match(/batch.*\.json$/));

let allSuccess = [];
batchFiles.forEach(file => {
  const results = JSON.parse(fs.readFileSync(file, 'utf8'));
  const success = results.filter(r => r.status === 'success' && r.photos?.length > 0);
  allSuccess.push(...success);
});

// 更新資料庫
data.forEach(v => {
  const match = allSuccess.find(r => 
    v.name === r.name || v.name.includes(r.name.split('(')[0])
  );
  
  if (match && match.photos.length > 0) {
    v.images = {
      main: match.photos[0],
      gallery: match.photos,
      source: match.url
    };
  }
});
```

---

## 📝 資料格式規範

### 必要欄位

```json
{
  "id": 1001,
  "name": "場地名稱",
  "roomName": "會議室名稱",
  "city": "台北市",
  "address": "完整地址",
  "contactPhone": "02-XXXX-XXXX",
  "contactEmail": "email@example.com",
  "url": "官網首頁",
  "venueType": "會議中心",
  "priceHalfDay": 10000,
  "priceFullDay": 18000,
  "maxCapacityTheater": 100,
  "maxCapacityClassroom": 80,
  "images": {
    "main": "https://官網/照片.jpg",
    "gallery": ["https://官網/照片1.jpg", "https://官網/照片2.jpg"],
    "source": "照片來源網址"
  },
  "status": "上架"
}
```

### ⚠️ 常見錯誤

| 錯誤 | 正確 | 說明 |
|------|------|------|
| `"status": "active"` | `"status": "上架"` | 後台過濾條件是「上架」 |
| `"gallery": "url1\nurl2"` | `"gallery": ["url1", "url2"]` | 必須是陣列 |
| `"main": "維基百科照片"` | `"main": "官網照片"` | 照片必須來自官網 |

---

## 🏢 實戰案例

### TICC（台北國際會議中心）

**成果**：45 個會議室完整抓取

**關鍵步驟**：
1. 用 agent-browser 抓取場地查詢頁面的下拉選單
2. 發現 45 個會議室（非原本資料庫的 12 個）
3. 批量抓取每個會議室的價格與照片
4. 整合到資料庫

**腳本**：`crawl-ticc-final.js`

### 師大進修推廣學院

**成果**：13 個場地完整抓取

**關鍵步驟**：
1. 用 agent-browser 開啟官網
2. 抓取所有場地卡片
3. 提取名稱、照片、價格

### 批次抓取（73 個場地）

**成果**：32 個成功（44%）

**工具成功率**：
- agent-browser：30-40%
- Playwright：60-70%
- web_fetch：95%（靜態網頁）

---

## 📁 相關檔案

| 檔案 | 用途 |
|------|------|
| `venues-all-cities.json` | 主資料庫（490 筆） |
| `pending-venues.json` | 待處理清單 |
| `failed-venues.json` | 失敗清單 |
| `CRAWL_PROGRESS.md` | 進度追蹤 |
| `COMPLETED_VENUES.md` | 已完成清單 |
| `playwright-crawl.js` | Playwright 批次抓取腳本 |
| `fetch-correct-urls.js` | 手動搜尋官網腳本 |

---

## 🚀 快速指令

```bash
# 執行 Playwright 批次抓取
cd /root/.openclaw/workspace/taiwan-venues
node playwright-crawl.js

# 手動搜尋官網
node fetch-correct-urls.js

# 驗證 JSON
node -e "console.log(JSON.parse(require('fs').readFileSync('venues-all-cities.json')).length)"

# 統計有照片的場地
node -e "const d=JSON.parse(require('fs').readFileSync('venues-all-cities.json'));console.log('有照片:',d.filter(v=>v.images?.main||v.images?.gallery?.length).length)"

# 提交更新
git add -A && git commit -m "✨ 更新場地照片" && git push

# 後台網址
open https://2015hdwl-claw.github.io/taiwan-venues/admin.html
```

---

## 📚 學到的教訓

### 1. 工具選擇很重要
- web_fetch 最快最穩定（靜態網頁）
- Playwright 比 agent-browser 穩定
- Firecrawl 成功率最高（但需要 API Key）

### 2. DNS 問題很常見
- 約 20% 的場地官網有問題
- 需要手動搜尋正確官網
- 標記為「待確認」避免重複嘗試

### 3. 照片為 0 的原因很多
- 動態載入（需要滾動）
- 擋爬蟲
- 照片在其他頁面
- 需要等待更久

### 4. 批次處理要間隔
- 避免被網站封鎖
- 每 10 分鐘回報進度
- 記錄失敗原因

---

## 📋 待確認場地清單（9 個）

| # | 場地名稱 | 原官網 | 狀態 |
|---|---------|--------|------|
| 1 | CAMA咖啡 | `www.camacoffee.com` | DNS 無法解析 |
| 2 | Goodmans咖啡廳 | `www.goodmanscafe.com` | DNS 無法解析 |
| 3 | TCCC台灣文創訓練中心 | `www.tccc.com.tw` | DNS 無法解析 |
| 4 | 典藏咖啡廳 | `www.artco.com.tw` | SSL 憑證錯誤 |
| 5 | 台北一樂園大飯店 | `www.ile-hotel.com` | DNS 無法解析 |
| 6 | 台北八方美學商旅 | `www.hotelbf.com` | DNS 無法解析 |
| 7 | 台北典華 | `www.dianhua.com.tw` | DNS 無法解析 |
| 8 | 台北北投會館 | `www.beitou-hall.com` | DNS 無法解析 |
| 9 | 台北友春大飯店 | `www.youchun-hotel.com` | DNS 無法解析 |

---

**這份 SOP 確保每次都能延續邏輯，不會鬼打牆！**
