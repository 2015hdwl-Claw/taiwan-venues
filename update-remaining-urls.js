const fs = require('fs');

console.log('🔄 更新剩餘 4 個場地的 URL...\n');

// 讀取資料
const venues = JSON.parse(fs.readFileSync('sample-data.json', 'utf8'));

console.log(`總場地數: ${venues.length}\n`);

// URL 更新對照表
const urlUpdates = {
  '台北君品酒店': 'https://www.palaisdechinehotel.com/pdc-tw/rooms/27',
  '新板希爾頓酒店': 'https://www.hilton.com/zh-hant/hotels/tsatchi-hilton-taipei-sinban/events/',
  '新竹國賓大飯店': 'https://www.ambassador-hotels.com/tc/hsinchu/events/packages/venue-rental#ping',
  '宜蘭蘭城晶英酒店': 'https://www.silksplace-yilan.com.tw/n/conferences_maps.aspx'
};

// 統計
const stats = {
  updated: 0,
  notFound: 0
};

// 更新 URL
console.log('✅ 更新 URL:');
Object.entries(urlUpdates).forEach(([name, newUrl]) => {
  const venue = venues.find(v => v.name === name);
  if (venue) {
    const oldUrl = venue.url;
    venue.url = newUrl;
    venue.urlUpdated = true;
    venue.urlUpdatedAt = new Date().toISOString();
    stats.updated++;
    console.log(`${stats.updated}. ${name}`);
    console.log(`   舊 URL: ${oldUrl}`);
    console.log(`   新 URL: ${newUrl}`);
    console.log('');
  } else {
    stats.notFound++;
    console.log(`⚠️ 找不到場地: ${name}`);
  }
});

// 保存
fs.writeFileSync('sample-data.json', JSON.stringify(venues, null, 2));

console.log('\n📊 更新統計:');
console.log(`✅ 更新 URL: ${stats.updated} 個`);
console.log(`⚠️ 找不到: ${stats.notFound} 個`);
console.log(`📁 總場地數: ${venues.length} 個`);

// 生成更新報告
const report = {
  timestamp: new Date().toISOString(),
  summary: {
    total: venues.length,
    updated: stats.updated,
    notFound: stats.notFound
  },
  updatedUrls: Object.entries(urlUpdates).map(([name, url]) => ({
    name,
    newUrl: url
  }))
};

fs.writeFileSync('final-url-update-report.json', JSON.stringify(report, null, 2));

console.log('\n✅ 已保存報告到: final-url-update-report.json');
console.log('✅ 已更新 sample-data.json');

console.log('\n🎉 所有 URL 錯誤已修正完成！');
