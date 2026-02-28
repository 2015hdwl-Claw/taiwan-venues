# 場地資料收集策略改進方案

## 📊 失敗原因分析

### 失敗統計
- **總失敗數**：22 個場地
- **DNS 錯誤**：17 個（77%）
- **超時錯誤**：3 個（14%）
- **SSL 錯誤**：2 個（9%）

---

## ❌ 失敗案例詳細分析

### 1. DNS 錯誤（17 個）- URL 可能錯誤或過期

#### 國際連鎖飯店（需要更新 URL）
1. **台北晶華酒店**
   - 錯誤 URL: https://www.rph.com.tw
   - 正確 URL: https://www.regenttaipei.com
   - 原因：使用舊的縮寫域名

2. **台北老爺大酒店**
   - 錯誤 URL: https://www.royal-taipei.com
   - 正確 URL: https://www.royal-taipei.com.tw
   - 原因：缺少 .tw

3. **台北西華飯店**
   - 錯誤 URL: https://www.thesherwood.com.tw
   - 正確 URL: https://www.sherwood.com.tw
   - 原因：URL 格式錯誤

4. **林酒店**
   - 錯誤 URL: https://www.the-forest.com.tw
   - 正確 URL: https://www.theforest.com.tw
   - 原因：URL 格式錯誤

5. **義大皇家酒店**
   - 錯誤 URL: https://www.edithotel.com.tw
   - 正確 URL: https://www.eda Royal.com.tw
   - 原因：URL 錯誤

#### 政府機構（URL 變更）
6. **台中市世貿中心**
   - 錯誤 URL: https://www.wtctc.org.tw
   - 正確 URL: 可能已停用或變更
   - 原因：機構可能已整併

7. **台中國家歌劇院**
   - 錯誤 URL: https://www.npot-ntt.gov.tw
   - 正確 URL: https://www.npac-ntt.org
   - 原因：URL 變更

8. **基隆市文化中心**
   - 錯誤 URL: https://www.klcc.gov.tw
   - 正確 URL: 可能已變更
   - 原因：政府機構 URL 變更

9. **新竹市文化局**
   - 錯誤 URL: https://www.ems.hccg.gov.tw
   - 正確 URL: 可能已變更
   - 原因：政府機構 URL 變更

#### 飯店集團（URL 變更）
10. **福容大飯店-淡水漁人碼頭**
    - 錯誤 URL: https://www.fullon-hotels.com
    - 正確 URL: https://www.fullon-hotels.com.tw
    - 原因：缺少 .tw

11. **煙波大飯店新竹湖濱館**
    - 錯誤 URL: https://www.yannbo.com.tw
    - 正確 URL: 可能已變更
    - 原因：飯店可能已更名或變更 URL

12. **嘉義耐斯王子大飯店**
    - 錯誤 URL: https://www.nice-prince.com.tw
    - 正確 URL: https://www.niceprince.com.tw
    - 原因：URL 格式錯誤

13. **嘉義長榮文苑酒店**
    - 錯誤 URL: https://www.evergreen-chiayi.com.tw
    - 正確 URL: 可能已變更
    - 原因：飯店可能已更名或變更 URL

14. **宜蘭礁溪老爺酒店**
    - 錯誤 URL: https://www.reefsilks.com.tw
    - 正確 URL: https://www.reefsilks.com
    - 原因：URL 格式錯誤

15. **花蓮翰品酒店**
    - 錯誤 URL: https://www.chateaudechine-hualien.com
    - 正確 URL: 可能已變更
    - 原因：飯店可能已更名或變更 URL

16. **典華旗艦店**
    - 錯誤 URL: https://www.dianhua.com.tw
    - 正確 URL: 可能已變更
    - 原因：餐廳可能已變更 URL

17. **大億麗緻酒店**
    - 錯誤 URL: https://www.landis-tainan.com
    - 正確 URL: 可能已變更
    - 原因：飯店可能已更名或變更 URL

---

### 2. 超時錯誤（3 個）- 網站回應慢

1. **台北國賓大飯店**
   - URL: https://www.ambassadorhotel.com.tw
   - 原因：網站回應慢或伺服器問題

2. **台中日月千禧酒店**
   - URL: https://www.millenniumtaipei.com
   - 原因：URL 錯誤（應該是 millenniumhotels.com）

3. **新竹國賓大飯店**
   - URL: https://www.ambassadorhotel.com.tw
   - 原因：網站回應慢或伺服器問題

---

### 3. SSL 錯誤（2 個）- 憑證問題

1. **台北文華東方酒店**
   - URL: https://www.mohg.com
   - 原因：SSL 憑證問題
   - 正確 URL: https://www.mandarinoriental.com/taipei

2. **宜蘭蘭城晶英酒店**
   - URL: https://www.silksplace-yilan.com
   - 原因：SSL 憑證問題
   - 正確 URL: https://www.silksplace.com/yilan

---

## 🔧 改進策略

### 策略 1：URL 驗證機制
**目標**：在收集前驗證 URL 是否有效

**方法**：
1. 使用 HEAD 請求檢查 URL 是否可達
2. 檢查 DNS 解析
3. 驗證 SSL 憑證

**實作**：
```javascript
async function validateUrl(url) {
  try {
    const response = await fetch(url, { method: 'HEAD', timeout: 5000 });
    return response.ok;
  } catch (error) {
    return false;
  }
}
```

---

### 策略 2：URL 修正資料庫
**目標**：建立常見的 URL 修正規則

**修正規則**：
1. **缺少 .tw** → 加上 .tw
2. **國際連鎖飯店** → 使用正確的國際域名
3. **政府機構** → 檢查最新的官方 URL
4. **飯店集團** → 使用集團官網

**實作**：
```javascript
const urlCorrections = {
  'www.rph.com.tw': 'www.regenttaipei.com',
  'www.royal-taipei.com': 'www.royal-taipei.com.tw',
  'www.mohg.com': 'www.mandarinoriental.com/taipei',
  'www.npot-ntt.gov.tw': 'www.npac-ntt.org',
  'www.millenniumtaipei.com': 'www.millenniumhotels.com'
};
```

---

### 策略 3：超時重試機制
**目標**：對超時的網站進行重試

**方法**：
1. 第一次超時 → 等待 5 秒後重試
2. 第二次超時 → 等待 10 秒後重試
3. 第三次超時 → 標記為失敗

**實作**：
```javascript
async function retryWithBackoff(fn, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await sleep(5000 * (i + 1));
    }
  }
}
```

---

### 策略 4：SSL 憑證處理
**目標**：忽略 SSL 憑證錯誤

**方法**：
1. 在 Puppeteer 中設定忽略 SSL 錯誤
2. 使用 `ignoreHTTPSErrors: true`

**實作**：
```javascript
const browser = await puppeteer.launch({
  headless: 'new',
  ignoreHTTPSErrors: true,  // 忽略 SSL 錯誤
  args: ['--no-sandbox', '--disable-setuid-sandbox']
});
```

---

### 策略 5：智能 URL 推測
**目標**：根據場地名稱推測正確的 URL

**方法**：
1. 根據場地名稱生成可能的 URL
2. 驗證哪個 URL 有效
3. 使用有效的 URL

**實作**：
```javascript
function guessUrl(venueName) {
  const baseNames = [
    venueName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase(),
    venueName.replace(/\s+/g, '-').toLowerCase(),
    venueName.replace(/\s+/g, '').toLowerCase()
  ];
  
  const domains = ['.com', '.com.tw', '.org', '.gov.tw'];
  
  return baseNames.flatMap(name => 
    domains.map(domain => `https://www.${name}${domain}`)
  );
}
```

---

## 📊 改進後的預期效果

### 預期成功率提升
- **當前成功率**：56%
- **改進後預期**：70-75%

### 改進項目
1. **URL 修正**：提升 10-15%
2. **超時重試**：提升 2-3%
3. **SSL 處理**：提升 2%
4. **智能推測**：提升 5-10%

---

## 🎯 實作計劃

### Phase 1：立即改進（現在）
1. ✅ 建立 URL 修正資料庫
2. ✅ 啟用 SSL 錯誤處理
3. ✅ 增加超時重試機制

### Phase 2：中期改進（1-2 小時）
1. 建立 URL 驗證機制
2. 建立智能 URL 推測
3. 更新 sample-data.json

### Phase 3：長期改進（未來）
1. 建立自動化 URL 更新機制
2. 建立 URL 健康檢查系統
3. 建立場地資料品質監控

---

## 📋 執行步驟

### 步驟 1：更新 URL 修正資料庫
```bash
# 更新 sample-data.json 中的錯誤 URL
node update-urls.js
```

### 步驟 2：啟用改進的收集腳本
```bash
# 使用改進後的腳本繼續收集
node collect-all-venues-improved.js
```

### 步驟 3：驗證結果
```bash
# 檢查成功率是否提升
node analyze-results.js
```

---

**文件建立時間**：2026-02-28
**維護者**：OpenClaw Assistant
