# 已下架飯店場地驗證計畫

**日期**: 2026-03-03
**目標**: 重新驗證 232 個已下架的飯店場地，找回誤判下架的會議場地

---

## 📊 已下架場地分析

### 總覽

| 項目 | 數量 | 百分比 |
|------|------|--------|
| 總已下架場地 | 520 | 100% |
| 飯店場地 | 232 | 45% |
| 展演場地 | 60 | 12% |
| 運動場館 | 27 | 5% |
| 其他 | 201 | 38% |

### 驗證重點

**只驗證飯店場地（232 個）**，因為：
- ✅ 飯店通常都有會議室
- ✅ roomsCount = 0 可能是資料不完整
- ❌ 展演、運動場地本來就不是會議場地（不驗證）

---

## 🎯 驗證計畫

### 階段 1：取樣驗證（30 個）

先驗證 30 個代表性的飯店，評估誤判率。

**預期結果**：
- 有會議室：20-25 個（67-83%）
- 確實無會議室：5-10 個（17-33%）

### 階段 2：全面驗證（232 個）

根據階段 1 的結果，決定是否驗證全部 232 個飯店。

---

## 📋 驗證清單（30 個）

### 台中市（14 個）
- 台中中港大飯店
- 台中全国大飯店
- 台中全國大飯店
- 台中日月千禧酒店
- 台中日航酒店
- 台中林酒店
- 台中永豐棧酒店
- 台中福華大飯店
- 台中裕元花園酒店
- 台中通豪大飯店
- 台中金典酒店
- 台中長榮桂冠酒店
- 台中麒麟大飯店
- 統一渡假村-谷關

### 台北市（8 個）
- 六福萬怡酒店
- 台北W飯店
- 台北一樂園大飯店
- 台北亞都麗緻大飯店
- 台北京站酒店
- 台北六福客棧
- 台北六福萬怡酒店
- 台北友春大飯店
- 台北君品酒店
- 台北君悅酒店

### 南投縣（3 個）
- 南投涵碧樓大飯店
- 南投溪頭妖怪主題飯店
- 南投溪頭米堤大飯店

### 其他縣市（5 個）
- 各地區代表性飯店

---

## 🔧 使用 Gemini 驗證

### 方式 1：完整版提示詞

**檔案**：`GEMINI-PROMPT-OFFLINE-VENUES.md`

適合需要詳細說明的情況。

### 方式 2：簡潔版提示詞

**檔案**：`GEMINI-PROMPT-SIMPLE.md`

適合快速驗證，直接複製貼上。

---

## 📊 CSV 清單（可直接複製）

```
ID,名稱,城市,官網URL
1002,南投涵碧樓大飯店,南投縣,https://www.thelalu.com.tw/
1003,南投溪頭妖怪主題飯店,南投縣,https://www.mingshan.com.tw/
1004,南投溪頭米堤大飯店,南投縣,https://www.lemidi-hotel.com.tw/
1006,台中中港大飯店,台中市,http://www.harbor-hotel.com.tw/
1007,台中全国大飯店,台中市,https://www.hotel-national.com.tw/
1008,台中全國大飯店,台中市,https://hotel-national.com.tw/
1013,台中日月千禧酒店,台中市,https://www.millenniumhotels.com/zh-tw/taichung/
1014,台中日航酒店,台中市,https://www.nikko-taichung.com/
1015,台中日航酒店,台中市,https://www.nikkotaichung.com
1016,台中林酒店,台中市,https://www.thelin.com.tw/
1017,台中永豐棧酒店,台中市,https://www.tempus.com.tw/
1019,台中福華大飯店,台中市,https://www.howard-hotels.com.tw/zh_TW/HotelBusiness/96
1020,台中裕元花園酒店,台中市,https://www.windsortaiwan.com/
1022,台中通豪大飯店,台中市,https://www.tunghao.com.tw
1024,台中金典酒店,台中市,https://www.splendor-taichung.com.tw/
1025,台中長榮桂冠酒店,台中市,https://www.evergreen-hotels.com/branch2/?d1b_sn=5
1026,台中麒麟大飯店,台中市,https://www.kirin-hotel.com
1029,統一渡假村-谷關,台中市,https://www.uni-resort.com.tw/gu/
1043,六福萬怡酒店,台北市,https://www.courtyard.com/taipei
1047,台北W飯店,台北市,https://www.marriott.com/en-us/hotels/tpewh-w-taipei/
1048,台北一樂園大飯店,台北市,https://www.ile-hotel.com
1051,台北亞都麗緻大飯店,台北市,https://taipei.landishotelsresorts.com/
1052,台北京站酒店,台北市,https://www.cityinn.com.tw
1055,台北六福客棧,台北市,https://www.leofoo.com.tw
1056,台北六福萬怡酒店,台北市,https://www.courtyard.com/taipei-six
1059,台北友春大飯店,台北市,https://www.youchun-hotel.com
1060,台北君品酒店,台北市,https://www.palaisdechinehotel.com/
1061,台北君悅酒店,台北市,https://www.hyatt.com/zh-TW/hotel/taiwan/grand-hyatt-taipei/tyoph
1062,台北君悅酒店,台北市,https://www.hyatt.com/taipei
1063,台北君悅酒店,台北市,https://www.hyatt.com/taipei
```

---

## ✅ 執行步驟

### 步驟 1：複製提示詞

選擇以下之一：
- `GEMINI-PROMPT-SIMPLE.md` - 簡潔版（推薦）
- `GEMINI-PROMPT-OFFLINE-VENUES.md` - 完整版

### 步驟 2：貼到 Gemini

前往 https://gemini.google.com，貼上提示詞。

### 步驟 3：等待回應

Gemini 會逐一驗證並輸出 JSON 格式的結果。

### 步驟 4：更新資料庫

提供 Gemini 的 JSON 回應，我會協助更新資料庫：
- 將有會議室的飯店從「下架」改為「上架」
- 更新 venueListUrl、roomsCount 等資訊

---

## 📈 預期成果

### 階段 1（30 個）

| 預期 | 數量 | 百分比 |
|------|------|--------|
| 有會議室 | 20-25 | 67-83% |
| 確實無會議室 | 5-10 | 17-33% |

### 階段 2（232 個全部）

| 預期 | 數量 |
|------|------|
| 有會議室 | 150-190 |
| 確實無會議室 | 40-80 |

### 最終目標

- **上架場地**：從 6 個增加到 150-200 個
- **資料完整性**：從 1.1% 提升到 30-40%

---

## 📁 相關檔案

| 檔案 | 說明 |
|------|------|
| `GEMINI-PROMPT-OFFLINE-VENUES.md` | 完整版提示詞 |
| `GEMINI-PROMPT-SIMPLE.md` | 簡潔版提示詞 |
| `GEMINI-OFFLINE-VERIFICATION-PLAN.md` | 本計畫文件 |

---

**建立時間**: 2026-03-03 12:54 GMT+8
**建立人員**: 總管（Orchestrator）
