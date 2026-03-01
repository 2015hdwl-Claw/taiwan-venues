# 場地網站爬蟲標準程序 (SOP)

**建立日期**：2026-03-01
**最後更新**：2026-03-01 19:30
**目的**：確保每次爬蟲都遵循正確步驟，不鬼打牆

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

## 📋 標準爬蟲流程

### Step 1：確認官網
```
1. 用 web_search 搜尋「[場地名稱] 官網」
2. 確認官網網址正確
3. 記錄官網首頁
```

### Step 2：找會議/宴會場地頁面
```
1. 用 web_fetch 抓取官網首頁（靜態）
2. 搜尋關鍵字：會議、宴會、場地、租借
3. 如果 web_fetch 失敗 → 使用 agent-browser
```

### Step 3：提取聯絡資訊
```
1. 從會議場地頁面提取
2. 如果頁面沒有 → 回首頁找聯絡我們
```

### Step 4：提取照片
```
⚠️ 重要：照片必須來自官網，不用維基百科！

1. 用 agent-browser 開啟會議室頁面
2. 用 eval 提取所有圖片網址
3. 過濾出會議室相關照片
4. 確保是陣列格式，不是字串
```

### Step 5：驗證與記錄
```
1. 驗證 JSON 格式正確
2. status 必須是 "上架"（不是 "active"）
3. images.gallery 必須是陣列
4. 記錄到 venues-all-cities.json
5. 更新 CRAWL_PROGRESS.md
6. git commit + git push
```

---

## 🔧 工具選擇準則

### web_fetch（優先）
- 適用：靜態 HTML 網頁
- 優點：快速

### agent-browser（動態網頁）
- 適用：需要 JavaScript 渲染的網頁
- 位置：`~/.openclaw/workspace/skills/agent-browser/SKILL.md`

### OpenClaw browser 服務
- ⚠️ WSL 環境無法使用（snap 版 Chromium + 無 GUI）
- 改用 agent-browser CLI

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

## 🏢 TICC 爬蟲實戰案例

### 場地資訊
- **名稱**：台北國際會議中心 (TICC)
- **官網**：https://www.ticc.com.tw/
- **會議室數量**：45 個（含組合型）

### Step 1：發現所有會議室

**方法**：用 agent-browser 抓取場地查詢頁面的下拉選單

```javascript
// 抓取所有會議室選項
const options = Array.from(document.querySelectorAll('#roomId option'));
options.map(o => ({ value: o.value, text: o.textContent }));
```

**結果**：發現 45 個會議室（非原本資料庫的 12 個）

### Step 2：批量抓取腳本

**檔案**：`crawl-ticc-final.js`

```javascript
const venues = [
  { roomId: "PH", name: "大會堂" },
  { roomId: "101", name: "101全室" },
  { roomId: "101A", name: "101A" },
  // ... 共 45 個
];

for (const venue of venues) {
  const url = `https://www.ticc.com.tw/wSite/sp?xdUrl=/wSite/ap/cp_VenueSearch.jsp&roomId=${venue.roomId}&ctNode=322&CtUnit=99&BaseDSD=7&mp=1`;
  
  // 開啟頁面
  execSync(`agent-browser open "${url}" --timeout 15000`);
  
  // 抓取頁面文字
  const text = execSync(`agent-browser eval "document.body.innerText"`);
  
  // 解析價格
  const priceWeekdayMatch = text.match(/週一[～~]週五[\s\S]*?(\d+)\s*元/);
  
  // 抓取照片
  const photoResult = execSync(`agent-browser eval "Array.from(document.querySelectorAll('img')).filter(i=>i.src&&i.src.includes('/public/Img/f')).map(i=>i.src).slice(0,10).join('\\\\n')"`);
}
```

### Step 3：照片格式處理

**問題**：agent-browser eval 返回的照片是換行分隔的字串

```javascript
// 錯誤格式
"\"https://xxx.jpg\\nhttps://yyy.jpg\\nhttps://zzz.jpg\""

// 解析函數
function parsePhotos(photos) {
  if (!photos || !Array.isArray(photos)) return [];
  let urls = [];
  photos.forEach(p => {
    if (typeof p === 'string') {
      p.split('\\n').forEach(url => {
        url = url.trim().replace(/"/g, '');
        if (url.startsWith('http')) urls.push(url);
      });
    }
  });
  return [...new Set(urls)]; // 去重
}
```

### Step 4：整合到資料庫

```javascript
const fs = require('fs');
const data = JSON.parse(fs.readFileSync('venues-all-cities.json', 'utf8'));
const crawled = JSON.parse(fs.readFileSync('ticc-crawled-data.json', 'utf8'));

// 移除舊的 TICC 資料
const filtered = data.filter(v => !v.name.includes('TICC'));

// 新增新的 TICC 資料
let nextId = Math.max(...data.map(v => v.id)) + 1;
const newTicc = crawled.map(room => ({
  id: nextId++,
  name: '台北國際會議中心(TICC)',
  city: '台北市',
  // ... 其他欄位
  images: {
    main: room.photos[0] || '',
    gallery: room.photos,
    source: room.url
  },
  status: '上架'  // ⚠️ 不是 "active"
}));

const merged = [...filtered, ...newTicc];
fs.writeFileSync('venues-all-cities.json', JSON.stringify(merged, null, 2));
```

### TICC 會議室清單（45 個）

| 樓層 | 會議室 |
|------|--------|
| 1F | 大會堂(PH)、101全室、101A、101AB、101B、101C、101CD、101D、102、103、105、106、1F北貴賓室、1F南貴賓室 |
| 2F | 201全室、201A~201F（含組合型：201AB、201ABC、201ABEF、201AF、201BC、201BCDE、201BE、201CD、201DE、201DEF、201EF）、202全室、202A、202B、203全室、203A、203B |
| 3F | 3樓宴會廳、3樓北軒、3樓南軒 |
| 4F | 401會議室、4樓悅軒、4樓雅軒、4樓鳳凰廳 |

### 成果
- ✅ 45 個會議室完整抓取
- ✅ 價格：$5,000 ~ $159,000
- ✅ 照片：每間 6-9 張官網照片
- ✅ status: "上架"

---

## ⚠️ 學到的教訓

### 1. status 必須是「上架」
```javascript
// ❌ 錯誤
v.status = 'active';

// ✅ 正確
v.status = '上架';
```
**原因**：後台過濾條件是 `status === '上架'`

### 2. 照片不用維基百科
```javascript
// ❌ 錯誤
main: 'https://upload.wikimedia.org/wikipedia/...'

// ✅ 正確
main: 'https://www.ticc.com.tw/wSite/public/Img/...'
```
**原因**：維基百科照片不是會議室照片

### 3. gallery 必須是陣列
```javascript
// ❌ 錯誤
gallery: "url1\nurl2\nurl3"

// ✅ 正確
gallery: ["url1", "url2", "url3"]
```

### 4. agent-browser eval 返回格式
- 返回的是 JSON 字串，需要解析
- 換行符是 `\\n`（字面字串），需要用 `split('\\n')` 處理

---

## 📁 相關檔案

| 檔案 | 用途 |
|------|------|
| `venues-all-cities.json` | 主資料庫 |
| `CRAWL_PROGRESS.md` | 進度追蹤 |
| `COMPLETED_VENUES.md` | 已完成清單 |
| `ticc-crawled-data.json` | TICC 原始抓取資料 |
| `crawl-ticc-final.js` | TICC 批量抓取腳本 |

---

## 🚀 快速指令

```bash
# 執行 TICC 抓取
cd /root/.openclaw/workspace/taiwan-venues
node crawl-ticc-final.js

# 驗證 JSON
node -e "console.log(JSON.parse(require('fs').readFileSync('venues-all-cities.json')).length)"

# 提交更新
git add -A && git commit -m "✨ TICC 完成" && git push

# 後台網址
open https://2015hdwl-claw.github.io/taiwan-venues/admin.html
```

---

**這份 SOP 確保每次都能延續邏輯，不會鬼打牆！**
