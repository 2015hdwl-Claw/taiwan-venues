const fs = require('fs');

console.log('🔄 刪除復興美學共享空間...\n');

// 讀取資料
const venues = JSON.parse(fs.readFileSync('sample-data.json', 'utf8'));

// 找到並刪除復興美學共享空間
const index = venues.findIndex(v => v.name.includes('復興美學'));

if (index >= 0) {
  const deleted = venues.splice(index, 1)[0];
  console.log(`✅ 已刪除: ${deleted.name}`);
  console.log(`   地址: ${deleted.address}`);
  console.log(`   城市: ${deleted.city}`);

  // 保存更新後的資料
  fs.writeFileSync('sample-data.json', JSON.stringify(venues, null, 2));

  console.log(`\n📊 更新後總場地數: ${venues.length}`);
  console.log('✅ 已更新 sample-data.json');
} else {
  console.log('❌ 找不到復興美學共享空間');
}
