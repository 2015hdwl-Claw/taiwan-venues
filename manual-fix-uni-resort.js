const fs = require('fs');

console.log('🔧 手動處理統一渡假村資料...\n');

// 讀取主資料庫
const venues = JSON.parse(fs.readFileSync('sample-data.json', 'utf8'));

console.log('📊 統一渡假村處理方案：\n');
console.log('1. 統一渡假村-墾丁：官網無法訪問，標記為「需要驗證」');
console.log('2. 台北統一大飯店：官網無法訪問，標記為「需要驗證」\n');

let updatedCount = 0;

venues.forEach(venue => {
  // 處理統一渡假村-墾丁
  if (venue.name === '統一渡假村-墾丁' && venue.roomName === '會議室') {
    venue.needsVerification = true;
    venue.verificationNote = '官網無法訪問（DNS 錯誤），需要手動驗證場地是否仍在營業';
    venue.lastChecked = new Date().toISOString();
    updatedCount++;
    console.log(`✅ 已標記：${venue.name} ${venue.roomName}`);
    console.log(`   地址：${venue.address}`);
    console.log(`   狀態：需要驗證\n`);
  }

  // 處理台北統一大飯店
  if (venue.name === '台北統一大飯店' && venue.roomName === '統一廳') {
    venue.needsVerification = true;
    venue.verificationNote = '官網無法訪問（DNS 錯誤），需要手動驗證場地是否仍在營業';
    venue.lastChecked = new Date().toISOString();
    updatedCount++;
    console.log(`✅ 已標記：${venue.name} ${venue.roomName}`);
    console.log(`   地址：${venue.address}`);
    console.log(`   狀態：需要驗證\n`);
  }
});

console.log(`📊 更新統計：`);
console.log(`已標記場地數：${updatedCount}\n`);

// 保存更新後的資料
fs.writeFileSync('sample-data.json', JSON.stringify(venues, null, 2));
console.log('✅ 已保存到 sample-data.json\n');

console.log('🎉 手動處理完成！');
console.log('\n💡 建議：');
console.log('1. 聯繫統一企業集團確認這些場地是否仍在營業');
console.log('2. 如有新官網，更新 URL 並重新爬蟲照片');
console.log('3. 如已結束營業，建議從資料庫中刪除');
