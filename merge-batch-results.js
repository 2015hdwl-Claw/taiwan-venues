const fs = require('fs');

console.log('🔄 整合第一批爬蟲結果到主資料庫...\n');

// 讀取主資料庫
const venues = JSON.parse(fs.readFileSync('sample-data.json', 'utf8'));

// 讀取爬蟲結果
const crawlResults = JSON.parse(fs.readFileSync('batch-crawl-results.json', 'utf8'));

console.log(`📊 爬蟲結果: ${crawlResults.length} 個場地\n`);

let updatedCount = 0;

crawlResults.forEach(result => {
  if (result.success && result.photos && result.photos.length > 0) {
    // 找到對應的場地
    venues.forEach(venue => {
      const fullName = `${venue.name} ${venue.roomName || ''}`.trim();

      if (fullName === result.venueName) {
        // 更新照片
        if (!venue.images) {
          venue.images = {};
        }

        venue.images.main = result.photos[0];
        venue.images.gallery = result.photos;

        // 移除標記
        delete venue.needsVerification;

        updatedCount++;
        console.log(`✅ 更新: ${venue.name} ${venue.roomName || ''}`);
        console.log(`   照片數量: ${result.photos.length} 張\n`);
      }
    });
  }
});

console.log(`📊 更新統計:\n`);
console.log(`更新場地數: ${updatedCount}\n`);

// 保存更新後的資料
fs.writeFileSync('sample-data.json', JSON.stringify(venues, null, 2));
console.log('✅ 已保存到 sample-data.json\n');

// 統計剩餘需要處理的場地
const remaining = venues.filter(v =>
  !v.images?.main ||
  v.images?.main?.includes('unsplash') ||
  v.images?.main?.includes('wikipedia') ||
  v.images?.main?.includes('upload.wikimedia')
);

console.log(`📊 剩餘需要處理的場地: ${remaining.length} 個\n`);

console.log('🎉 整合完成！');
