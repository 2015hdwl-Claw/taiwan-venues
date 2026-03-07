const fs = require('fs');

const allVenues = JSON.parse(fs.readFileSync('./venues-all-cities.json', 'utf8'));
const crawledResults = JSON.parse(fs.readFileSync('./batch2-crawled-photos.json', 'utf8'));

// 過濾無效圖片
function filterValidPhotos(photos) {
  return photos.filter(url => {
    if (url.startsWith('data:')) return false;
    if (url.includes('facebook.com/tr?')) return false;
    if (url.includes('google-analytics')) return false;
    if (url.endsWith('.svg')) return false;
    if (url.includes('/icon') || url.includes('/favicon')) return false;
    return true;
  });
}

let updateCount = 0;
const updates = [];

crawledResults.forEach(result => {
  const validPhotos = filterValidPhotos(result.photos);
  
  if (validPhotos.length === 0) {
    console.log(`[${result.id}] ${result.name} - 沒有有效照片`);
    return;
  }
  
  const main = validPhotos[0];
  const gallery = validPhotos.slice(1, 10);
  
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
      venue.images.updateReason = '批量更新：補充照片';
      
      updateCount++;
      updates.push({
        id: venue.id,
        name: venue.name,
        roomName: venue.roomName,
        oldGalleryCount,
        newGalleryCount: gallery.length
      });
      
      console.log(`[${venue.id}] ${venue.name}`);
      console.log(`  相簿: ${oldGalleryCount} → ${gallery.length} 張`);
    }
  });
});

// 儲存
fs.writeFileSync('./venues-all-cities.json', JSON.stringify(allVenues, null, 2));

console.log('\n=== 第二批更新完成 ===');
console.log(`成功更新: ${updateCount} 筆`);

// 輸出報告
fs.writeFileSync('./batch2-update-report.json', JSON.stringify({ updates }, null, 2));
