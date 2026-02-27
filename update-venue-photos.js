const fs = require('fs');

// 載入照片資料來源
const wikimediaPhotos = JSON.parse(fs.readFileSync('real_venue_photos.json', 'utf8'));
const crawledPhotos = JSON.parse(fs.readFileSync('venue-photos-crawled.json', 'utf8'));
const importantPhotos = JSON.parse(fs.readFileSync('important_venue_photos.json', 'utf8'));
const originalData = JSON.parse(fs.readFileSync('sample-data.json', 'utf8'));

// 建立照片映射
const photoMap = new Map();

// 從 Wikilibrary Commons 整合
Object.entries(wikimediaPhotos.photos).forEach(([name, url]) => {
  photoMap.set(name.trim(), url);
});

// 從重要場地照片整合
importantPhotos.venues.forEach(venue => {
  photoMap.set(venue.name, venue.photo);
});

// 從爬取結果整合（優先使用爬取的結果）
crawledPhotos.forEach(venue => {
  venue.images.forEach(img => {
    photoMap.set(venue.name, img);
  });
});

console.log('=== 照片映射統計 ===');
console.log('映射的場地數:', photoMap.size);
console.log('');

// 遍歷所有場地，更新照片
let updatedCount = 0;
let unchangedCount = 0;
let noMatchCount = 0;

originalData.forEach(venue => {
  const name = venue.name;
  let found = false;

  // 嘗試直接匹配
  if (photoMap.has(name)) {
    const newPhoto = photoMap.get(name);
    if (venue.images && venue.images.main !== newPhoto) {
      venue.images.main = newPhoto;
      updatedCount++;
      console.log(`✅ 更新照片: ${name}`);
    } else {
      unchangedCount++;
    }
    found = true;
  } else {
    // 嘗試部分匹配（去除括號內容）
    const baseName = name.replace(/\([^)]+\)/, '').trim();
    if (photoMap.has(baseName)) {
      const newPhoto = photoMap.get(baseName);
      if (venue.images && venue.images.main !== newPhoto) {
        venue.images.main = newPhoto;
        updatedCount++;
        console.log(`✅ 更新照片: ${name} (來自 ${baseName})`);
      } else {
        unchangedCount++;
      }
      found = true;
    }
  }

  if (!found) {
    noMatchCount++;
  }
});

console.log('');
console.log('=== 更新統計 ===');
console.log('總場地數:', originalData.length);
console.log('已更新照片:', updatedCount);
console.log('照片無變更:', unchangedCount);
console.log('找不到對應場地:', noMatchCount);

// 儲存更新後的資料
fs.writeFileSync('sample-data.json', JSON.stringify(originalData, null, 2));

console.log('');
console.log('✅ 照片更新完成！');
console.log('📄 已更新 sample-data.json');
