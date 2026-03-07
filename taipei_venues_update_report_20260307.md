const fs = require('fs');

const allVenues = JSON.parse(fs.readFileSync('./venues-all-cities.json', 'utf8'));
const taipeiVenues = allVenues.filter(v => v.city === '台北市');

// 照片計數函數
function countPhotos(images) {
  if (!images) return 0;
  const main = images.main ? 1 : 0;
  const gallery = images.gallery?.length || 0;
  const floorPlan = images.floorPlan ? 1 : 0;
  return main + gallery + floorPlan;
}

// 統計
const stats = {
  total: taipeiVenues.length,
  hasPhotos: 0,
  noPhotos: 0,
  lowPhotos: 0,
  byType: {}
};

taipeiVenues.forEach(v => {
  const photoCount = countPhotos(v.images);
  if (photoCount >= 3) stats.hasPhotos++;
  else if (photoCount === 0) stats.noPhotos++;
  else stats.lowPhotos++;

  const type = v.venueType || '其他';
  if (!stats.byType[type]) stats.byType[type] = { total: 0, hasPhotos: 0, noPhotos: 0 };
  stats.byType[type].total++;
  if (photoCount >= 3) stats.byType[type].hasPhotos++;
  else if (photoCount === 0) stats.byType[type].noPhotos++;
});

// 已更新的場地
const updated = [
  { id: 1032, name: 'CLBC大安商務中心', batch: 1, reason: '主照片錯誤' },
  { id: 1068, name: '台北喜瑞飯店', batch: 1, reason: '主照片錯誤' },
  { id: 1116, name: '彭園婚宴會館', batch: 1, reason: '主照片錯誤' },
  { id: 1126, name: '豪景大酒店', batch: 1, reason: '主照片錯誤' },
  { id: 1439, name: 'CLBC大安商務中心', batch: 1, reason: '主照片錯誤' },
  { id: 1440, name: 'CLBC大安商務中心', batch: 1, reason: '主照片錯誤' },
  { id: 1060, name: '台北君品酒店', batch: 2, reason: '照片太少' },
  { id: 1069, name: '台北國賓大飯店', batch: 2, reason: '照片太少' },
  { id: 1074, name: 'JR東日本大飯店台北', batch: 2, reason: '完全沒有照片' },
  { id: 1058, name: '台北北投會館', batch: 2, reason: '完全沒有照片' },
  { id: 1521, name: '彭園婚宴會館', batch: 2, reason: '完全沒有照片' },
  { id: 1522, name: '彭園婚宴會館', batch: 2, reason: '完全沒有照片' },
  { id: 1523, name: '彭園婚宴會館', batch: 2, reason: '完全沒有照片' },
  { id: 1086, name: '台北晶華酒店', batch: 3, reason: '照片太少' },
  { id: 1079, name: '台北小巨蛋', batch: 3, reason: '完全沒有照片' }
];

// 生成報告
const report = `# 台北市場地全面更新報告
日期：2026-03-07

## 執行摘要

### 檢查結果
- **總場地數**：${stats.total}
- **照片充足 (≥3)**：${stats.hasPhotos} (${(stats.hasPhotos/stats.total*100).toFixed(1)}%)
- **照片太少 (<3)**：${stats.lowPhotos}
- **完全沒照片**：${stats.noPhotos}

### 更新結果
- **總計更新**：${updated.length} 個場地
- **第一批**：6 個（主照片錯誤）
- **第二批**：7 個（補充照片）
- **第三批**：2 個（補充照片）

## 更新明細

### 第一批：主照片錯誤修正
| ID | 場地名稱 | 問題 | 狀態 |
|---|---|---|---|
| 1032 | CLBC大安商務中心 | 主照片為 logo.svg | ✅ 已更新 |
| 1068 | 台北喜瑞飯店 | 主照片為 logo.png | ✅ 已更新 |
| 1116 | 彭園婚宴會館 | 主照片為 open.svg | ✅ 已更新 |
| 1126 | 豪景大酒店 | 主照片為 logo.png | ✅ 已更新 |
| 1439 | CLBC大安商務中心 | 主照片為 logo.svg | ✅ 已更新 |
| 1440 | CLBC大安商務中心 | 主照片為 logo.svg | ✅ 已更新 |

### 第二批：補充照片
| ID | 場地名稱 | 問題 | 狀態 |
|---|---|---|---|
| 1060 | 台北君品酒店 | 照片太少 (2) | ✅ 已更新 |
| 1069 | 台北國賓大飯店 | 照片太少 (1) | ✅ 已更新 |
| 1074 | JR東日本大飯店台北 | 完全沒有照片 | ✅ 已更新 |
| 1058 | 台北北投會館 | 完全沒有照片 | ✅ 已更新 |
| 1521 | 彭園婚宴會館 | 完全沒有照片 | ✅ 已更新 |
| 1522 | 彭園婚宴會館 | 完全沒有照片 | ✅ 已更新 |
| 1523 | 彭園婚宴會館 | 完全沒有照片 | ✅ 已更新 |

### 第三批：補充照片
| ID | 場地名稱 | 問題 | 狀態 |
|---|---|---|---|
| 1086 | 台北晶華酒店 | 照片太少 (2) | ✅ 已更新 |
| 1079 | 台北小巨蛋 | 完全沒有照片 | ✅ 已更新 |

## 按類型統計

| 類型 | 總數 | 有照片 | 沒照片 |
|---|---|---|---|
${Object.entries(stats.byType).map(([type, s]) => `| ${type} | ${s.total} | ${s.hasPhotos} | ${s.noPhotos} |`).join('\n')}

## 無法處理的場地

以下場地因官網無法連線或已歇業，無法自動更新：

### 官網無法連線（可能歇業）
- 台北一樂園大飯店
- 台北友春大飯店
- 台北姿美大飯店
- 台北康華大飯店
- 台北德立莊酒店
- 台北慶泰大飯店
- 台北松意酒店
- 台北洛碁大飯店
- 台北第一大飯店
- 台北第一酒店
- 台北統一大飯店
- Goodmans咖啡廳
- 典藏咖啡廳

### 反爬蟲機制
- 台北W飯店（Marriott）
- 台北君悅酒店（Hyatt）
- 台北典華（Denwell）

## 建議

1. **手動處理歇業場地**：將官網無法連線的場地標記為「待確認」或「可能歇業」
2. **搜尋替代官網**：部分場地可能有新的官網 URL
3. **人工補充照片**：對於無法自動爬取的場地，考慮手動上傳照片
4. **定期驗證**：建立定期檢查機制，確保照片 URL 有效

---
報告生成時間：${new Date().toISOString()}
`;

fs.writeFileSync('./TAIPEI_VENUES_UPDATE_REPORT_20260307.md', report);
console.log(report);
