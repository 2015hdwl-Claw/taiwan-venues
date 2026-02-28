const fs = require('fs');

console.log('🔧 修正香格里拉的照片 URL（從原始爬蟲結果）...\n');

// 讀取主資料庫
const venues = JSON.parse(fs.readFileSync('sample-data.json', 'utf8'));

// 讀取原始爬蟲結果
const crawlResults = JSON.parse(fs.readFileSync('new-venues-playwright.json', 'utf8'));

// 找到香格里拉的爬蟲結果
const shangriLaCrawl = crawlResults.find(r => r.venueName === '台北香格里拉遠東國際大飯店');

if (shangriLaCrawl && shangriLaCrawl.photos && shangriLaCrawl.photos.length > 0) {
  console.log(`✅ 找到原始爬蟲結果：${shangriLaCrawl.photos.length} 張照片\n`);

  // 過濾掉 loading 圖片
  const validPhotos = shangriLaCrawl.photos.filter(photo =>
    !photo.includes('loading') && !photo.includes('loading_type')
  );

  console.log(`✅ 過濾後的有效照片：${validPhotos.length} 張\n`);

  // 找到主資料庫中的香格里拉
  const venueIndex = venues.findIndex(v => v.name === '台北香格里拉遠東國際大飯店' && !v.roomName);

  if (venueIndex >= 0) {
    // 更新照片
    venues[venueIndex].images = {
      main: validPhotos[0] || '',
      gallery: validPhotos
    };

    console.log(`✅ 已更新：${venues[venueIndex].name}`);
    console.log(`   主照片：${venues[venueIndex].images.main.substring(0, 80)}...`);
    console.log(`   照片數量：${validPhotos.length} 張\n`);

    // 保存
    fs.writeFileSync('sample-data.json', JSON.stringify(venues, null, 2));
    console.log('✅ 已保存到 sample-data.json\n');
  } else {
    console.log('❌ 找不到對應的場地\n');
  }
} else {
  console.log('❌ 找不到原始爬蟲結果\n');
}

console.log('🎉 修正完成！');
