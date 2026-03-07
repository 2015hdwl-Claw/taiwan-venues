# LINE Bot 對話流程設計

**版本**: 1.0
**日期**: 2026-03-05
**適用**: 活動大師、升學大師

---

## 📋 目錄

1. [設計原則](#設計原則)
2. [意圖分類](#意圖分類)
3. [對話流程](#對話流程)
4. [訊息模板](#訊息模板)
5. [上下文管理](#上下文管理)
6. [錯誤處理](#錯誤處理)

---

## 設計原則

### 1. 用戶體驗優先

- **快速回應**: 3 秒內回覆
- **簡潔訊息**: 每次訊息 < 300 字
- **視覺化**: 使用卡片、按鈕、圖片
- **引導式**: 提供選項而非開放式問題

### 2. 漸進式揭露

```
Level 1: 快速摘要（3-5 筆）
    ↓ 點擊「查看更多」
Level 2: 詳細列表（10-20 筆）
    ↓ 點擊「查看詳情」
Level 3: 完整資訊（單一場地）
```

### 3. 智能推薦

- 根據用戶歷史記錄推薦
- 根據當前上下文推薦
- 根據熱門程度推薦

---

## 意圖分類

### 活動大師意圖

| 意圖 | 觸發詞 | 動作 |
|------|--------|------|
| **搜尋場地** | 找場地、找地方、需要場地 | 搜尋場地 |
| **比較場地** | 比較、差異、哪個好 | 場地比較 |
| **查詢價格** | 多少錢、價格、費用 | 查詢價格 |
| **查詢容量** | 多少人、容納、人數 | 查詢容量 |
| **查詢設備** | 有什麼設備、設施 | 查詢設備 |
| **查詢詳情** | 詳細資訊、更多資訊 | 場地詳情 |
| **預約諮詢** | 預約、諮詢、聯絡 | 預約流程 |
| **附近場地** | 附近、周圍、附近有什麼 | 地理搜尋 |
| **熱門場地** | 熱門、推薦、排行榜 | 熱門推薦 |
| **幫助** | 幫助、怎麼用、功能 | 使用說明 |

### 升學大師意圖

| 意圖 | 觸發詞 | 動作 |
|------|--------|------|
| **搜尋學校** | 找學校、大學、科系 | 搜尋學校 |
| **比較學校** | 比較、差異、哪個好 | 學校比較 |
| **查詢分數** | 多少分、錄取分數 | 查詢分數 |
| **查詢科系** | 有什麼系、科系 | 查詢科系 |
| **入學管道** | 怎麼申請、入學方式 | 入學管道 |
| **查詢詳情** | 詳細資訊、更多資訊 | 學校詳情 |
| **推薦學校** | 推薦、適合我 | 學校推薦 |
| **科系介紹** | 科系介紹、學什麼 | 科系詳情 |
| **幫助** | 幫助、怎麼用、功能 | 使用說明 |

---

## 對話流程

### 1. 搜尋場地流程

```
用戶: 找台北的飯店場地，100人左右
    │
    ▼
┌─────────────────────────────────────────────┐
│ 🎯 搜尋條件：                                │
│ 📍 台北市                                   │
│ 🏨 飯店場地                                 │
│ 👥 100人以上                                │
│                                             │
│ 找到 23 個場地                              │
└─────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────┐
│ 📌 推薦場地 (Top 3)                         │
│                                             │
│ ┌─────────────────────────────────────────┐│
│ │ 台北國際會議中心 (TICC)                 ││
│ │ 📍 信義區  👥 3,000人  💰 NT$50K/天    ││
│ │ ⭐⭐⭐⭐⭐ (4.8)  📸 45張              ││
│ │ [查看詳情] [加入比較]                  ││
│ └─────────────────────────────────────────┘│
│                                             │
│ ┌─────────────────────────────────────────┐│
│ │ 台北喜來登大飯店                        ││
│ │ 📍中正區  👥 800人  💰 NT$80K/天      ││
│ │ ⭐⭐⭐⭐ (4.5)  📸 12張               ││
│ │ [查看詳情] [加入比較]                  ││
│ └─────────────────────────────────────────┘│
│                                             │
│ [查看更多] [調整條件] [聯絡我們]           │
└─────────────────────────────────────────────┘
```

**狀態管理**:
```json
{
  "intent": "搜尋場地",
  "filters": {
    "city": "台北市",
    "venueType": "飯店場地",
    "minCapacity": 100
  },
  "results": [123, 456, 789, ...],
  "displayCount": 3,
  "state": "browsing"
}
```

### 2. 場地詳情流程

```
用戶: [點擊「查看詳情」]
    │
    ▼
┌─────────────────────────────────────────────┐
│ 🏨 台北國際會議中心 (TICC)                  │
│                                             │
│ 📍 台北市信義區信義路五段1號               │
│ 📞 02-2725-5200                            │
│ 🌐 www.ticc.com.tw                         │
│                                             │
│ ┌─────────────────────────────────────────┐│
│ │ 📸 場地照片（輪播）                     ││
│ │ [1/6] 大會堂                            ││
│ └─────────────────────────────────────────┘│
│                                             │
│ 📊 基本資訊                                 │
│ ├─ 會議室數量: 45間                        │
│ ├─ 最大容納: 3,000人（劇院式）            │
│ ├─ 價格範圍: NT$30K - 150K/天             │
│ └─ 停車位: 500個                           │
│                                             │
│ 🎯 設備與服務                               │
│ ✅ 投影設備  ✅ 音響系統  ✅ 視訊會議     │
│ ✅ 燈光控制  ✅ 空調  ✅ WiFi              │
│                                             │
│ [查看所有會議室] [立即諮詢] [加入比較]    │
└─────────────────────────────────────────────┘
```

### 3. 場地比較流程

```
用戶: 比較 TICC 和喜來登
    │
    ▼
┌─────────────────────────────────────────────┐
│ 📊 場地比較                                 │
│                                             │
│ ┌───────────────┬───────────┬─────────────┐│
│ │ 項目          │ TICC      │ 喜來登      ││
│ ├───────────────┼───────────┼─────────────┤│
│ │ 最大容納      │ 3,000人   │ 800人       ││
│ │ 會議室數量    │ 45間      │ 5間         ││
│ │ 價格/天       │ NT$50K    │ NT$80K      ││
│ │ 停車位        │ 500個     │ 200個       ││
│ │ 評價          │ ⭐ 4.8    │ ⭐ 4.5      ││
│ │ 照片數量      │ 45張      │ 12張        ││
│ └───────────────┴───────────┴─────────────┘│
│                                             │
│ 💡 推薦指數                                 │
│ TICC: ⭐⭐⭐⭐⭐ (大型活動首選)            │
│ 喜來登: ⭐⭐⭐⭐ (精品會議)                │
│                                             │
│ [查看TICC詳情] [查看喜來登詳情]            │
└─────────────────────────────────────────────┘
```

### 4. 預約諮詢流程

```
用戶: 我要預約 TICC
    │
    ▼
┌─────────────────────────────────────────────┐
│ 📝 預約諮詢                                 │
│                                             │
│ 您已選擇：台北國際會議中心 (TICC)          │
│                                             │
│ 請填寫以下資訊，我們將盡快與您聯繫：       │
│                                             │
│ 📅 活動日期：［選擇日期］                  │
│ 👥 預計人數：［輸入人數］                  │
│ 📧 聯絡信箱：［輸入信箱］                  │
│ 📱 聯絡電話：［輸入電話］                  │
│ 💬 其他需求：［輸入備註］                  │
│                                             │
│ [提交諮詢] [取消]                           │
└─────────────────────────────────────────────┘
    │
    ▼ (用戶提交)
    │
┌─────────────────────────────────────────────┐
│ ✅ 諮詢已送出                               │
│                                             │
│ 感謝您的諮詢！我們已收到您的需求：         │
│                                             │
│ 📅 活動日期: 2026-04-15                    │
│ 👥 預計人數: 500人                         │
│                                             │
│ 我們將在 24 小時內與您聯繫。               │
│                                             │
│ 如有緊急需求，請直接聯繫：                 │
│ 📞 02-2725-5200                            │
│                                             │
│ [返回首頁] [繼續搜尋]                      │
└─────────────────────────────────────────────┘
```

---

## 訊息模板

### 1. Flex Message 範例

#### 場地卡片

```json
{
  "type": "flex",
  "altText": "場地推薦",
  "contents": {
    "type": "bubble",
    "hero": {
      "type": "image",
      "url": "https://example.com/venue.jpg",
      "size": "full",
      "aspectRatio": "20:13",
      "aspectMode": "cover"
    },
    "body": {
      "type": "box",
      "layout": "vertical",
      "contents": [
        {
          "type": "text",
          "text": "台北國際會議中心 (TICC)",
          "weight": "bold",
          "size": "xl"
        },
        {
          "type": "box",
          "layout": "baseline",
          "contents": [
            {
              "type": "text",
              "text": "📍",
              "size": "sm"
            },
            {
              "type": "text",
              "text": "台北市信義區",
              "size": "sm",
              "color": "#666666",
              "flex": 1
            }
          ]
        },
        {
          "type": "box",
          "layout": "baseline",
          "contents": [
            {
              "type": "text",
              "text": "👥",
              "size": "sm"
            },
            {
              "type": "text",
              "text": "3,000人",
              "size": "sm",
              "color": "#666666",
              "flex": 1
            }
          ]
        },
        {
          "type": "box",
          "layout": "baseline",
          "contents": [
            {
              "type": "text",
              "text": "💰",
              "size": "sm"
            },
            {
              "type": "text",
              "text": "NT$50,000/天",
              "size": "sm",
              "color": "#666666",
              "flex": 1
            }
          ]
        }
      ]
    },
    "footer": {
      "type": "box",
      "layout": "horizontal",
      "contents": [
        {
          "type": "button",
          "style": "primary",
          "action": {
            "type": "postback",
            "label": "查看詳情",
            "data": "action=detail&id=123"
          }
        },
        {
          "type": "button",
          "style": "secondary",
          "action": {
            "type": "postback",
            "label": "加入比較",
            "data": "action=compare&id=123"
          }
        }
      ]
    }
  }
}
```

### 2. Quick Reply 範例

```json
{
  "type": "text",
  "text": "請問您需要什麼協助？",
  "quickReply": {
    "items": [
      {
        "type": "action",
        "action": {
          "type": "message",
          "label": "搜尋場地",
          "text": "搜尋場地"
        }
      },
      {
        "type": "action",
        "action": {
          "type": "message",
          "label": "熱門推薦",
          "text": "熱門場地"
        }
      },
      {
        "type": "action",
        "action": {
          "type": "message",
          "label": "附近場地",
          "text": "我附近的場地"
        }
      },
      {
        "type": "action",
        "action": {
          "type": "location",
          "label": "傳送位置"
        }
      }
    ]
  }
}
```

---

## 上下文管理

### 1. 上下文結構

```json
{
  "userId": "U123456789",
  "botType": "活動大師",
  "currentIntent": "搜尋場地",
  "state": "browsing",
  "filters": {
    "city": "台北市",
    "venueType": "飯店場地",
    "minCapacity": 100,
    "maxPrice": 100000
  },
  "searchResults": [123, 456, 789],
  "displayedResults": [123, 456],
  "compareList": [123],
  "selectedVenue": null,
  "lastAction": "view_detail",
  "timestamp": "2026-03-05T10:30:00Z"
}
```

### 2. 狀態轉換

```
┌──────────┐
│   IDLE   │ 初始狀態
└─────┬────┘
      │ 搜尋場地
      ▼
┌──────────┐
│ SEARCHING│ 搜尋中
└─────┬────┘
      │ 找到結果
      ▼
┌──────────┐
│ BROWSING │ 瀏覽結果
└─────┬────┘
      │ 查看詳情
      ▼
┌──────────┐
│ DETAIL   │ 查看詳情
└─────┬────┘
      │ 加入比較
      ▼
┌──────────┐
│ COMPARING│ 比較中
└─────┬────┘
      │ 預約諮詢
      ▼
┌──────────┐
│ BOOKING  │ 預約中
└──────────┘
```

### 3. 上下文過期

```javascript
const contextExpiry = {
  // 搜尋結果：30 分鐘
  searchResults: 30 * 60 * 1000,
  
  // 比較清單：1 小時
  compareList: 60 * 60 * 1000,
  
  // 用戶偏好：永久
  preferences: Infinity
};

// 清理過期上下文
function cleanExpiredContext(context) {
  const now = Date.now();
  for (const key in contextExpiry) {
    if (context[key] && context[key].timestamp) {
      const elapsed = now - context[key].timestamp;
      if (elapsed > contextExpiry[key]) {
        delete context[key];
      }
    }
  }
  return context;
}
```

---

## 錯誤處理

### 1. 錯誤類型

| 錯誤類型 | 原因 | 處理方式 |
|---------|------|---------|
| **無法理解** | 意圖識別失敗 | 引導用戶重新輸入 |
| **無結果** | 搜尋條件過嚴 | 建議放寬條件 |
| **資料缺失** | 欄位不完整 | 顯示可用資訊 |
| **系統錯誤** | API 錯誤 | 提供替代方案 |
| **超時** | AI 回應過慢 | 顯示快取結果 |

### 2. 錯誤訊息模板

#### 無法理解

```json
{
  "type": "text",
  "text": "抱歉，我不太明白您的意思 🤔\n\n您可以試試看：",
  "quickReply": {
    "items": [
      {
        "type": "action",
        "action": {
          "type": "message",
          "label": "搜尋場地",
          "text": "搜尋場地"
        }
      },
      {
        "type": "action",
        "action": {
          "type": "message",
          "label": "查看功能",
          "text": "幫助"
        }
      }
    ]
  }
}
```

#### 無結果

```json
{
  "type": "text",
  "text": "沒有找到符合條件的場地 😅\n\n建議您可以：\n• 擴大搜尋範圍（例如：整個台北市）\n• 降低人數要求\n• 提高預算上限\n\n要我重新搜尋嗎？",
  "quickReply": {
    "items": [
      {
        "type": "action",
        "action": {
          "type": "message",
          "label": "放寬條件",
          "text": "放寬搜尋條件"
        }
      },
      {
        "type": "action",
        "action": {
          "type": "message",
          "label": "重新搜尋",
          "text": "重新搜尋"
        }
      }
    ]
  }
}
```

#### 系統錯誤

```json
{
  "type": "text",
  "text": "系統暫時無法回應，請稍後再試 🙏\n\n或者您可以：\n• 直接聯繫客服：0800-123-456\n• 傳送 Email：service@eventmaster.com\n\n造成不便，敬請見諒。"
}
```

---

## AI 整合

### 1. Gemini API 整合

```javascript
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function analyzeIntent(userMessage, context) {
  const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
  
  const prompt = `
你是一個場地搜尋助手。分析用戶訊息，提取意圖和實體。

用戶訊息: "${userMessage}"
當前上下文: ${JSON.stringify(context)}

請以 JSON 格式回應：
{
  "intent": "搜尋場地|比較場地|查詢價格|...",
  "entities": {
    "city": "台北市",
    "venueType": "飯店場地",
    "capacity": 100,
    "price": 50000
  },
  "confidence": 0.95,
  "response": "好的，我幫您搜尋台北市的飯店場地..."
}
`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  return JSON.parse(response.text());
}
```

### 2. 對話流程控制

```javascript
async function handleMessage(event, context) {
  const userMessage = event.message.text;
  
  // 1. 分析意圖
  const analysis = await analyzeIntent(userMessage, context);
  
  // 2. 更新上下文
  context.currentIntent = analysis.intent;
  context.entities = analysis.entities;
  
  // 3. 執行動作
  let response;
  switch (analysis.intent) {
    case '搜尋場地':
      response = await searchVenues(analysis.entities, context);
      break;
    case '比較場地':
      response = await compareVenues(analysis.entities, context);
      break;
    case '查詢詳情':
      response = await getVenueDetail(analysis.entities, context);
      break;
    default:
      response = createUnknownIntentMessage();
  }
  
  // 4. 儲存上下文
  await saveContext(context);
  
  return response;
}
```

---

## 效能優化

### 1. 回應時間目標

| 操作 | 目標時間 | 快取策略 |
|------|---------|---------|
| 意圖分析 | < 1s | 無（即時） |
| 搜尋場地 | < 2s | 快取熱門搜尋 |
| 查詢詳情 | < 1s | 快取場地資料 |
| 比較場地 | < 2s | 無（即時計算） |

### 2. 快取策略

```javascript
const cache = new Redis();

// 快取熱門搜尋
async function searchVenues(filters) {
  const cacheKey = `search:${hashFilters(filters)}`;
  
  // 檢查快取
  const cached = await cache.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }
  
  // 執行搜尋
  const results = await db.query(/* ... */);
  
  // 快取結果（10 分鐘）
  await cache.setex(cacheKey, 600, JSON.stringify(results));
  
  return results;
}

// 快取場地詳情
async function getVenueDetail(venueId) {
  const cacheKey = `venue:${venueId}`;
  
  const cached = await cache.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }
  
  const venue = await db.query(/* ... */);
  
  // 快取結果（1 小時）
  await cache.setex(cacheKey, 3600, JSON.stringify(venue));
  
  return venue;
}
```

---

**文件維護**: Jobs (CTO)
**最後更新**: 2026-03-05
**版本**: 1.0
