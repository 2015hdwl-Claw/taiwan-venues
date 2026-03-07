#!/usr/bin/env node

/**
 * 更新台北市場地狀態
 * 根據 SOP V4.7 標準
 */

const fs = require('fs');

// 讀取場地資料
const data = JSON.parse(fs.readFileSync('venues-all-cities.json', 'utf8'));
const report = JSON.parse(fs.readFileSync('taipei-venues-check-report-v2.json', 'utf8'));

console.log('=== 開始更新場地狀態 ===');
console.log(`總場地數: ${data.length}`);
console.log(`台北市場地數: ${data.filter(v => v.city === '台北市').length}`);
console.log(`需要更新的場地: ${report.needsUpdate.length}`);

// 更新計數器
let updatedCount = 0;
const updateLog = [];

// 更新場地狀態
report.needsUpdate.forEach(update => {
  const venue = data.find(v => v.id === update.id);
  
  if (venue) {
    const oldStatus = venue.status;
    
    // 更新狀態
    venue.status = '待修';
    venue.lastUpdated = new Date().toISOString();
    venue.updateReason = `SOP V4.7 驗證: ${update.reason}`;
    venue.updateSource = '自動檢查腳本';
    
    updatedCount++;
    updateLog.push({
      id: venue.id,
      name: venue.name,
      roomName: venue.roomName,
      venueType: update.venueType,
      oldStatus: oldStatus,
      newStatus: '待修',
      reason: update.reason
    });
  }
});

// 保存更新後的資料
fs.writeFileSync(
  'venues-all-cities.json',
  JSON.stringify(data, null, 2)
);

// 保存更新日誌
fs.writeFileSync(
  'taipei-venues-update-log.json',
  JSON.stringify({
    updatedAt: new Date().toISOString(),
    totalUpdated: updatedCount,
    updates: updateLog
  }, null, 2)
);

console.log(`\n=== 更新完成 ===`);
console.log(`已更新場地數: ${updatedCount}`);
console.log(`更新日誌: taipei-venues-update-log.json`);

// 輸出前 10 筆更新記錄
console.log('\n=== 前 10 筆更新記錄 ===');
updateLog.slice(0, 10).forEach((log, i) => {
  console.log(`${i + 1}. [${log.id}] ${log.name} - ${log.roomName}`);
  console.log(`   ${log.oldStatus} → ${log.newStatus}`);
  console.log(`   原因: ${log.reason}`);
});

// 統計更新後的狀態
const taipeiVenues = data.filter(v => v.city === '台北市');
const statusCount = {};
taipeiVenues.forEach(v => {
  statusCount[v.status] = (statusCount[v.status] || 0) + 1;
});

console.log('\n=== 更新後狀態分布 ===');
Object.entries(statusCount).sort((a,b) => b[1] - a[1]).forEach(([status, count]) => {
  console.log(`  ${status}: ${count}`);
});
