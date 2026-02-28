const fs = require('fs');

console.log('📝 更新 sample-data.json 中的 URL\n');

// 讀取檔案
const sampleData = JSON.parse(fs.readFileSync('sample-data.json', 'utf8'));
const repairedData = JSON.parse(fs.readFileSync('taiwan_venues_repaired_2026.json', 'utf8'));

console.log('原始場地數:', sampleData.length);
console.log('修正 URL 數:', repairedData.venues.length);

// 建立 URL 修正對照表
const urlMap = {};
repairedData.venues.forEach(venue => {
  const key = `${venue.name}_${venue.city}`;
  urlMap[key] = venue.url;
});

console.log('URL 對照表建立完成\n');

// 更新 sample-data.json
let updatedCount = 0;
let notFoundCount = 0;

sampleData.forEach(venue => {
  const key = `${venue.name}_${venue.city}`;
  if (urlMap[key]) {
    venue.url = urlMap[key];
    updatedCount++;
  } else {
    notFoundCount++;
  }
});

console.log('✅ 更新完成！');
console.log(`已更新: ${updatedCount} 個場地`);
console.log(`未找到: ${notFoundCount} 個場地`);

// 保存更新後的檔案
const timestamp = new Date().toISOString().split('T')[0];
const backupFile = `sample-data-backup-${timestamp}.json`;
const outputFile = 'sample-data-updated.json';

// 備份原始檔案
fs.writeFileSync(backupFile, JSON.stringify(sampleData, null, 2));
console.log(`\n✅ 備份已保存: ${backupFile}`);

// 保存更新後的檔案
fs.writeFileSync(outputFile, JSON.stringify(sampleData, null, 2));
console.log(`✅ 更新後檔案已保存: ${outputFile}`);

// 顯示前 10 個更新的場地
console.log('\n--- 前 10 個更新的場地 ---\n');
let count = 0;
for (let i = 0; i < sampleData.length && count < 10; i++) {
  const venue = sampleData[i];
  const key = `${venue.name}_${venue.city}`;
  if (urlMap[key]) {
    count++;
    console.log(`${count}. ${venue.name} (${venue.city})`);
    console.log(`   新 URL: ${venue.url}\n`);
  }
}

console.log('\n✅ 完成！');
