# URL 驗證失敗報告

**生成時間**：2026-02-28 12:02 GMT+8
**總場地數**：374
**成功**：122 (32.6%)
**失敗**：252 (67.4%)

---

## 📊 失敗原因分析

| 失敗原因 | 數量 | 百分比 | 說明 |
|---------|------|--------|------|
| fetch failed | 178 | 70.6% | DNS 錯誤或 URL 不存在 |
| HTTP 錯誤 | 57 | 22.6% | 404/403/405 等 |
| Timeout | 17 | 6.7% | 網站回應超時 |

---

## 🔍 可能可修正的場地（201 個）

這些場地可能只需要修正 URL 即可成功：

### HTTP 404 錯誤（14 個）

1. **板橋凱撒大飯店**
   - URL: https://www.caesarpark.com.tw/banqiao
   - 可能正確: https://www.caesarpark.com.tw

2. **桃園諾富特華航酒店**
   - URL: https://www.novotel.com/taoyuan-airport
   - 可能正確: https://www.novotel.com

3. **雲林劍湖山王子大飯店**
   - URL: https://www.janfusun.com.tw/prince
   - 可能正確: https://www.janfusun.com.tw

4. **福容大飯店淡水漁人碼頭**
   - URL: https://www.fullon-hotels.com.tw/tamsui
   - 可能正確: https://www.fullon-hotels.com.tw

5. **六福萬怡酒店**
   - URL: https://www.courtyard.com/taipei
   - 可能正確: https://www.marriott.com

6. **中正紀念堂**
   - URL: https://www.cksmh.gov.tw
   - 可能正確: https://www.cksmh.gov.tw

7. **台北小巨蛋**
   - URL: https://www.taipeiarena.com
   - 可能正確: https://www.tms.gov.tw

8. **林口福容婚宴會館**
   - URL: https://www.fullon-hotels.com.tw/linkou
   - 可能正確: https://www.fullon-hotels.com.tw

9. **高雄市立美術館**
   - URL: https://www.kmfa.gov.tw
   - 可能正確: https://www.kmfa.gov.tw

10. **墾丁凱撒大飯店**
    - URL: https://www.caesarpark.com.tw/kenting
    - 可能正確: https://www.caesarpark.com.tw

11. **宜蘭晶英酒店**
    - URL: https://www.silksplace.com/yilan
    - 可能正確: https://www.silksplace.com

12. **宜蘭傳藝中心**
    - URL: https://www.ncfta.gov.tw
    - 可能正確: https://www.ncfta.gov.tw

### HTTP 403 錯誤（可能需要特殊處理）

- 新北市公有場地
- 台北君悅酒店
- 台北君品酒店
- 高雄洲際酒店
- 桃園市政府
- 台北萬豪酒店
- 桃園假日酒店

### HTTP 405 錯誤（網站不支援 HEAD 請求）

- 台北國際會議中心
- 台北寒舍艾麗酒店
- 台北怡亨酒店

### fetch failed 錯誤（DNS 或 URL 錯誤）

**需要手動確認的場地**：

1. 台北晶華酒店
   - URL: https://www.rph.com.tw
   - 可能正確: https://www.regenthotels.com/taipei

2. 台北老爺大酒店
   - URL: https://www.royal-taipei.com
   - 可能正確: https://www.hotelroyal.com.tw/taipei

3. 台北文華東方酒店
   - URL: https://www.mohg.com
   - 可能正確: https://www.mandarinoriental.com/taipei

4. 台北西華飯店
   - URL: https://www.thesherwood.com.tw
   - 可能正確: https://www.sherwood.com.tw

5. 福容大飯店-淡水漁人碼頭
   - URL: https://www.fullon-hotels.com
   - 可能正確: https://www.fullon-hotels.com.tw

---

## 🎯 建議的處理方式

### 選項 A：手動修正 URL（推薦）
1. 提供前 30-50 個失敗場地的清單
2. 您手動提供正確 URL
3. 更新 sample-data.json
4. 重新驗證

**優點**：準確性高
**缺點**：需要您的時間

### 選項 B：跳過失敗的場地
1. 只收集 122 個成功的場地
2. 稍後處理失敗的場地

**優點**：快速開始
**缺點**：資料不完整

### 選項 C：自動嘗試常見 URL 變體
1. 嘗試 .com → .com.tw
2. 嘗試 www.xxx.com → www.xxx.com.tw
3. 記錄成功的 URL

**優點**：自動化
**缺點**：可能不準確

---

## 📊 超時錯誤（17 個）

這些場地的網站回應慢，可能需要：
1. 增加超時時間
2. 或使用其他方法驗證

---

## 🎯 下一步

請告訴我您希望如何處理這些失敗的 URL！
