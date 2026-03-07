const fs = require('fs');

// 載入資料
const allVenues = JSON.parse(fs.readFileSync('./venues-all-cities.json', 'utf8'));
const crawledResults = JSON.parse(fs.readFileSync('./crawled-photos-result.json', 'utf8'));

// 過濾無效圖片
function filterValidPhotos(photos) {
  return photos.filter(url => {
    // 排除 base64
    if (url.startsWith('data:')) return false;
    // 排除追蹤像素
    if (url.includes('facebook.com/tr?')) return false;
    if (url.includes('google-analytics')) return false;
    // 排除 SVG (除非是圖表)
    if (url.endsWith('.svg') && !url.includes('chart')) return false;
    // 排除小圖示
    if (url.includes('/icon') || url.includes('/favicon')) return false;
    return true;
  });
}

// 更新場地資料
let updateCount = 0;
const updates = [];

crawledResults.forEach(result => {
  const validPhotos = filterValidPhotos(result.photos);
  
  if (validPhotos.length === 0) {
    console.log(`[${result.id}] ${result.name} - 沒有有效照片`);
    return;
  }
  
  const main = validPhotos[0];
  const gallery = validPhotos.slice(1, 10); // 最多 9 張
  
  // 找到所有同 ID 的場地並更新
  allVenues.forEach(venue => {
    if (venue.id === result.id) {
      const oldMain = venue.images?.main;
      const oldGalleryCount = venue.images?.gallery?.length || 0;
      
      venue.images = venue.images || {};
      venue.images.main = main;
      venue.images.gallery = gallery;
      venue.images.source = result.url;
      venue.images.verified = true;
      venue.images.verifiedAt = new Date().toISOString();
      venue.images.updateReason = '批量更新：修正主照片錯誤';
      
      updateCount++;
      updates.push({
        id: venue.id,
        name: venue.name,
        roomName: venue.roomName,
        oldMain,
        newMain: main,
        oldGalleryCount,
        newGalleryCount: gallery.length
      });
      
      console.log(`[${venue.id}] ${venue.name} (${venue.roomName || '-'})`);
      console.log(`  舊主照: ${oldMain}`);
      console.log(`  新主照: ${main}`);
      console.log(`  相簿: ${oldGalleryCount} → ${gallery.length} 張`);
    }
  });
});

// 儲存更新後的資料
const timestamp = new Date().toISOString().slice(0, 10);
fs.writeFileSync(`./venues-all-cities-backup-${timestamp}.json`, JSON.stringify(allVenues, null, 2));
fs.writeFileSync('./venues-all-cities.json', JSON.stringify(allVenues, null, 2));

// 輸出更新報告
const report = {
  timestamp: new Date().toISOString(),
  totalCrawled: crawledResults.length,
  validPhotos: updates.length,
  updates: updates
};

fs.writeFileSync('./batch-update-report.json', JSON.stringify(report, null, 2));

console.log('\n=== 更新完成 ===');
console.log(`成功更新: ${updateCount} 筆`);
console.log(`備份檔案: venues-all-cities-backup-${timestamp}.json`);
console.log(`更新報告: batch-update-report.json`);
