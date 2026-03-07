#!/usr/bin/env node
/**
 * 修正狀態不一致的場地
 * 用途：將缺重要資訊的「上架」場地改為「下架」
 */

const fs = require('fs');
const path = require('path');

// 讀取資料
const dataPath = path.join(__dirname, '..', 'venues-all-cities.json');
const venues = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

console.log(`\n🔧 修正狀態不一致的場地`);
console.log(`總場地數：${venues.length}`);
console.log(`=` .repeat(60));

let fixedCount = 0;
const fixedVenues = [];

venues.forEach(venue => {
  if (venue.status === '上架') {
    const problems = [];

    // 檢查必填資訊
    if (!venue.contactPhone || venue.contactPhone.trim() === '') {
      problems.push('缺電話');
    }

    if (!venue.address || venue.address.trim() === '') {
      problems.push('缺地址');
    }

    // 檢查照片
    const images = venue.images || {};
    const hasValidPhoto = (images.main && images.main.trim() !== '') ||
                          (images.gallery && images.gallery.length > 0);

    if (!hasValidPhoto) {
      problems.push('缺照片');
    }

    // 如果有問題，改為下架
    if (problems.length > 0) {
      venue.status = '下架';
      venue.offlineReason = `資料不完整：${problems.join('、')}`;
      venue.lastFixedAt = new Date().toISOString();

      fixedCount++;
      fixedVenues.push({
        id: venue.id,
        name: venue.name,
        roomName: venue.roomName,
        problems
      });

      console.log(`[修正] [${venue.id}] ${venue.name} - ${venue.roomName || '無廳房'}`);
      console.log(`  原因：${problems.join('、')}`);
    }
  }
});

// 儲存修正後的資料
fs.writeFileSync(dataPath, JSON.stringify(venues, null, 2));

console.log(`\n✅ 修正完成：${fixedCount} 筆場地已改為下架`);

// 儲存修正報告
const report = {
  fixedAt: new Date().toISOString(),
  totalFixed: fixedCount,
  venues: fixedVenues
};

const reportPath = path.join(__dirname, '..', 'fix-status-report.json');
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

console.log(`📝 修正報告已儲存至：${reportPath}`);
console.log(`\n下一步：請執行 git add venues-all-cities.json && git commit -m "fix: 修正 ${fixedCount} 筆狀態不一致場地"\n`);
