# Google Gemini 已下架飯店場地驗證提示詞

**用途**：重新驗證已下架的飯店場地，確認是否真的無會議室
**日期**：2026-03-03
**目標**：找回誤判下架的飯店會議場地

---

## 📋 提示詞

```
你是台灣會議場地資料庫的資料驗證助手。

## 任務目標

以下 30 個飯店場地被標記為「下架」，原因是「roomsCount = 0」（沒有會議室記錄）。

請協助驗證這些飯店是否真的沒有會議室，還是只是資料不完整。

---

## 待驗證飯店列表（30 個）

### 台北市（8 個）

1. **六福萬怡酒店** (ID: 1043)
   - 官網：https://www.courtyard.com/taipei
   - 原狀態：下架
   - 需驗證：是否有會議室？

2. **台北W飯店** (ID: 1047)
   - 官網：https://www.marriott.com/en-us/hotels/tpewh-w-taipei/
   - 原狀態：下架
   - 需驗證：是否有會議室？

### 南投縣（2 個）

3. **南投涵碧樓大飯店** (ID: 1002)
   - 官網：https://www.thelalu.com.tw/
   - 原狀態：下架
   - 需驗證：是否有會議室？

4. **南投溪頭妖怪主題飯店** (ID: 1003)
   - 官網：https://www.mingshan.com.tw/
   - 原狀態：下架
   - 需驗證：是否有會議室？

### 台中市（2 個）

5. **台中中港大飯店** (ID: 1006)
   - 官網：http://www.harbor-hotel.com.tw/
   - 原狀態：下架
   - 需驗證：是否有會議室？

6. **台中全国大飯店** (ID: 1007)
   - 官網：https://www.hotel-national.com.tw/
   - 原狀態：下架
   - 需驗證：是否有會議室？

### 台南市（2 個）

7. **台南劍橋大飯店** (ID: 1131)
   - 官網：http://www.cambridge-hotel.com.tw/
   - 原狀態：下架
   - 需驗證：是否有會議室？

8. **台南和逸飯店** (ID: 1132)
   - 官網：https://hotelcozzi.com/tainan-ximen/
   - 原狀態：下架
   - 需驗證：是否有會議室？

### 台東縣（2 個）

9. **台東娜路彎大酒店** (ID: 1150)
   - 官網：https://www.naruwan-hotel.com.tw/
   - 原狀態：下架
   - 需驗證：是否有會議室？

10. **台東知本老爺酒店** (ID: 1151)
    - 官網：https://www.hotelroyal.com.tw/zh-tw/chihpen
    - 原狀態：下架
    - 需驗證：是否有會議室？

### 嘉義市（2 個）

11. **嘉義兆品酒店** (ID: 1156)
    - 官網：https://chiayi.maisondechinehotel.com/
    - 原狀態：下架
    - 需驗證：是否有會議室？

12. **嘉義耐斯王子大飯店** (ID: 1159)
    - 官網：https://www.niceprincehotel.com.tw/
    - 原狀態：下架
    - 需驗證：是否有會議室？

### 基隆市（2 個）

13. **基隆華國大飯店** (ID: 1165)
    - 官網：https://www.huakuo.com.tw
    - 原狀態：下架
    - 需驗證：是否有會議室？

14. **基隆長榮桂冠酒店** (ID: 1166)
    - 官網：https://www.evergreen-hotels.com/branch2/?d1b_sn=4
    - 原狀態：下架
    - 需驗證：是否有會議室？

### 宜蘭縣（2 個）

15. **傳藝老爺行旅** (ID: 1167)
    - 官網：https://www.hotelroyal.com.tw/yilan
    - 原狀態：下架
    - 需驗證：是否有會議室？

16. **宜蘭傳藝老爺行旅** (ID: 1169)
    - 官網：https://www.yilanhotelroyal.com
    - 原狀態：下架
    - 需驗證：是否有會議室？

### 屏東縣（2 個）

17. **墾丁凱撒大飯店** (ID: 1177)
    - 官網：https://kenting.caesarpark.com.tw/
    - 原狀態：下架
    - 需驗證：是否有會議室？

18. **墾丁凱撒大飯店** (ID: 1178)
    - 官網：https://www.caesarpark.com.tw/kenting
    - 原狀態：下架
    - 需驗證：是否有會議室？

### 新北市（2 個）

19. **台北淡水將捷金鬱金香酒店** (ID: 1202)
    - 官網：https://www.goldentulip-fabhotel.com.tw/
    - 原狀態：下架
    - 需驗證：是否有會議室？

20. **台北淡水承億酒店** (ID: 1203)
    - 官網：https://www.hotelday.com.tw/hotel.aspx?id=12
    - 原狀態：下架
    - 需驗證：是否有會議室？

### 新竹市（2 個）

21. **新竹喜來登大飯店** (ID: 1229)
    - 官網：https://www.marriott.com/en-us/hotels/hszsi-sheraton-hsinchu-hotel/
    - 原狀態：下架
    - 需驗證：是否有會議室？

22. **新竹喜來登大飯店** (ID: 1230)
    - 官網：https://www.sheraton.com/hsinchu
    - 原狀態：下架
    - 需驗證：是否有會議室？

### 新竹縣（2 個）

23. **新竹喜來登飯店** (ID: 1240)
    - 官網：https://www.sheraton.com/hsinchu
    - 原狀態：下架
    - 需驗證：是否有會議室？

24. **新竹豐邑喜來登大飯店** (ID: 1242)
    - 官網：https://www.marriott.com/en-us/hotels/hszsi-sheraton-hsinchu-hotel/
    - 原狀態：下架
    - 需驗證：是否有會議室？

### 桃園市（2 個）

25. **桃園假日酒店** (ID: 1249)
    - 官網：https://www.ihg.com/holidayinn/hotels/tw/zh/taoyuan/tyntw/hoteldetail
    - 原狀態：下架
    - 需驗證：是否有會議室？

26. **桃園南方莊園度假飯店** (ID: 1251)
    - 官網：https://www.southgarden.com.tw/
    - 原狀態：下架
    - 需驗證：是否有會議室？

### 澎湖縣（2 個）

27. **澎湖福朋喜來登酒店** (ID: 1263)
    - 官網：https://www.fourpoints-penghu.com/
    - 原狀態：下架
    - 需驗證：是否有會議室？

28. **澎湖福朋喜來登酒店** (ID: 1264)
    - 官網：https://www.fourpoints.com/penghu
    - 原狀態：下架
    - 需驗證：是否有會議室？

### 彰化縣（1 個）

29. **彰化桂冠歐悅酒店** (ID: 1196)
    - 官網：https://www.ohya.com.tw/
    - 原狀態：下架
    - 需驗證：是否有會議室？

### 嘉義縣（1 個）

30. **嘉義長榮文苑酒店** (ID: 1164)
    - 官網：https://www.evergreen-hotels.com/branch2/?d1b_sn=65
    - 原狀態：下架
    - 需驗證：是否有會議室？

---

## 驗證標準

### 如果飯店有會議室，請提供：

1. **正確的官網 URL**
2. **會議室/宴會廳頁面 URL**（venueListUrl）
3. **會議室數量**（roomsCount）
4. **會議室名稱列表**（roomNames）

### 如果飯店確實無會議室，請標註：

- 「確認無會議室」- 如果官網明確沒有會議室資訊
- 「官網已失效」- 如果官網無法訪問
- 「已歇業」- 如果飯店已歇業

---

## 輸出格式

請針對**每個有會議室的飯店**，按照以下 JSON 格式輸出：

```json
[
  {
    "id": "場地 ID",
    "name": "場地名稱（正確全名）",
    "url": "正確的官網 URL",
    "venueListUrl": "會議室/宴會廳頁面 URL",
    "roomsCount": 會議室數量（數字）,
    "roomNames": ["會議室1", "會議室2", "..."],
    "venueType": "飯店場地",
    "verified": true,
    "lastUpdated": "2026-03-03T12:00:00Z",
    "notes": "驗證說明"
  }
]
```

**重要**：
- 只輸出**有會議室**的飯店
- 確實無會議室的飯店不需要輸出
- 請以 JSON 陣列格式輸出，方便後續處理

---

## 開始執行

請逐一驗證以上 30 個飯店，並輸出有會議室的飯店資料。
```

---

## 📊 使用方式

### 步驟 1：複製提示詞

將上述提示詞複製到 Google Gemini（https://gemini.google.com）

### 步驟 2：執行驗證

Gemini 會逐一驗證 30 個飯店，並輸出有會議室的飯店資料

### 步驟 3：更新資料庫

收到 Gemini 回應後，我會協助將資料更新到資料庫，並將這些場地從「下架」改為「上架」

---

## 📝 預期結果

| 項目 | 預期 |
|------|------|
| 驗證飯店數 | 30 個 |
| 預期有會議室 | 20-25 個 |
| 預期無會議室 | 5-10 個 |
| 預期官網失效 | 0-5 個 |

---

## 🎯 目標

透過這次驗證，找回被誤判下架的飯店會議場地，提升資料庫的完整性。

---

## 📁 相關檔案

| 檔案 | 說明 |
|------|------|
| `GEMINI-PROMPT-OFFLINE-VENUES.md` | 本提示詞檔案 |
| `GEMINI-UPDATE-REPORT.md` | 上次更新報告 |
| `venues-all-cities.json` | 主資料庫 |

---

**建立時間**：2026-03-03 12:54 GMT+8
**建立人員**：總管（Orchestrator）
