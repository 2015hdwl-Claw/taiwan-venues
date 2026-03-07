const fs = require('fs');

// 需要更新的場地清單
const venuesToUpdate = [
  // 主照片錯誤的場地
  { id: 1032, name: 'CLBC大安商務中心', url: 'https://clbc.tw/', issue: '主照片錯誤' },
  { id: 1068, name: '台北喜瑞飯店', url: 'https://www.ambiencehotel.com.tw/', issue: '主照片錯誤' },
  { id: 1116, name: '彭園婚宴會館', url: 'https://www.pengyuan.com.tw/', issue: '主照片錯誤' },
  { id: 1126, name: '豪景大酒店', url: 'https://www.riverview.com.tw/', issue: '主照片錯誤' },
  { id: 1439, name: 'CLBC大安商務中心', url: 'https://clbc.tw/', issue: '主照片錯誤' },
  { id: 1440, name: 'CLBC大安商務中心', url: 'https://clbc.tw/', issue: '主照片錯誤' },
  
  // 完全沒照片的飯店 (優先處理)
  { id: 1048, name: '台北一樂園大飯店', url: 'https://www.ile-hotel.com', issue: '完全沒有照片', venueType: '飯店場地' },
  { id: 1059, name: '台北友春大飯店', url: 'https://www.youchun-hotel.com', issue: '完全沒有照片', venueType: '飯店場地' },
  { id: 1073, name: '台北姿美大飯店', url: 'https://www.zibei-hotel.com', issue: '完全沒有照片', venueType: '飯店場地' },
  { id: 1080, name: '台北康華大飯店', url: 'https://www.kanghua-hotel.com', issue: '完全沒有照片', venueType: '飯店場地' },
  { id: 1081, name: '台北德立莊酒店', url: 'https://www.midtownrichard.com/', issue: '完全沒有照片', venueType: '飯店場地' },
  { id: 1084, name: '台北慶泰大飯店', url: 'https://www.ching-tai.com', issue: '完全沒有照片', venueType: '飯店場地' },
  { id: 1088, name: '台北松意酒店', url: 'https://www.songyi-hotel.com/', issue: '完全沒有照片', venueType: '飯店場地' },
  { id: 1089, name: '台北洛碁大飯店', url: 'https://www.chateau-china.com/', issue: '完全沒有照片', venueType: '飯店場地' },
  { id: 1092, name: '台北第一大飯店', url: 'https://www.firsthotel.com', issue: '完全沒有照片', venueType: '飯店場地' },
  { id: 1093, name: '台北第一酒店', url: 'https://www.first-hotel.com.tw/', issue: '完全沒有照片', venueType: '飯店場地' }
];

console.log('=== 批次更新計畫 ===');
console.log(`總計需要更新: ${venuesToUpdate.length} 個場地`);
console.log('');

// 分類
const byIssue = {};
venuesToUpdate.forEach(v => {
  byIssue[v.issue] = (byIssue[v.issue] || 0) + 1;
});
console.log('按問題類型:');
Object.entries(byIssue).forEach(([issue, count]) => console.log(`  ${issue}: ${count}`));

console.log('\n場地清單:');
venuesToUpdate.forEach((v, i) => console.log(`${i+1}. [${v.id}] ${v.name} - ${v.url}`));

// 輸出 JSON 供後續處理
fs.writeFileSync('./batch-update-list.json', JSON.stringify(venuesToUpdate, null, 2));
console.log('\n已輸出 batch-update-list.json');
