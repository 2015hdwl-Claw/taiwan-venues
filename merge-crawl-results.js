const fs = require('fs');

console.log('🔄 整合所有爬蟲結果到主資料庫...\n');

// 讀取主資料庫
const venues = JSON.parse(fs.readFileSync('sample-data.json', 'utf8'));
console.log(`📊 原始場地數: ${venues.length}`);

// 讀取第一批爬蟲結果
const results1 = JSON.parse(fs.readFileSync('photo-crawl-results-final.json', 'utf8'));
console.log(`✅ 第一批爬蟲結果: ${results1.length} 個場地`);

// 讀取第二批爬蟲結果
const results2 = JSON.parse(fs.readFileSync('photo-crawl-results-remaining-final.json', 'utf8'));
console.log(`✅ 第二批爬蟲結果: ${results2.length} 個場地`);

// 讀取新場地爬蟲結果
const newVenues = JSON.parse(fs.readFileSync('new-venues-playwright.json', 'utf8'));
console.log(`✅ 新場地爬蟲結果: ${newVenues.length} 個場地\n`);

// 合併所有爬蟲結果
const allCrawlResults = [...results1, ...results2];
console.log(`📊 總爬蟲結果: ${allCrawlResults.length} 個場地\n`);

// 更新主資料庫中的照片
let updatedCount = 0;
allCrawlResults.forEach(result => {
  if (result.photos && result.photos.length > 0) {
    // 找到對應的場地
    const venueName = result.venueName.replace(/\s+/g, ' ').trim();

    venues.forEach(venue => {
      const fullName = `${venue.name} ${venue.roomName || ''}`.replace(/\s+/g, ' ').trim();

      if (fullName === venueName || venue.name === venueName) {
        // 更新照片
        if (!venue.images) {
          venue.images = {};
        }

        // 選擇第一張照片作為主照片
        if (result.photos[0]) {
          venue.images.main = result.photos[0].url;
        }

        // 保存所有照片
        venue.images.gallery = result.photos.map(p => p.url);

        updatedCount++;
        console.log(`✅ 更新照片: ${venue.name} ${venue.roomName || ''} (${result.photos.length} 張)`);
      }
    });
  }
});

console.log(`\n📊 更新統計:`);
console.log(`✅ 已更新照片: ${updatedCount} 個場地\n`);

// 添加新場地
const newVenuesToAdd = [];

newVenues.forEach(newVenue => {
  if (newVenue.photos && newVenue.photos.length > 0 && !newVenue.error) {
    // 創建新場地物件
    const venueObj = {
      name: newVenue.venueName,
      roomName: '',
      venueType: '會議中心',
      city: newVenue.venueName.includes('台中') ? '台中市' : '台北市',
      address: '',
      phone: '',
      email: '',
      url: newVenue.url,
      capacity: {
        min: parseInt(newVenue.capacity) || 0,
        max: parseInt(newVenue.capacity) || 0
      },
      size: {
        min: parseInt(newVenue.size) || 0,
        max: parseInt(newVenue.size) || 0
      },
      price: {
        halfDay: 0,
        fullDay: 0
      },
      equipment: newVenue.equipment || [],
      images: {
        main: newVenue.photos[0]?.url || '',
        gallery: newVenue.photos.map(p => p.url)
      },
      description: newVenue.description || '',
      rules: [],
      catering: false,
      parking: false,
      accessibility: false,
      source: 'playwright-crawl',
      crawledAt: newVenue.crawledAt
    };

    newVenuesToAdd.push(venueObj);
    console.log(`✅ 新增場地: ${newVenue.venueName} (${newVenue.photos.length} 張照片)`);
  }
});

// 添加新場地到主資料庫
venues.push(...newVenuesToAdd);

console.log(`\n📊 最終統計:`);
console.log(`總場地數: ${venues.length}`);
console.log(`新增場地: ${newVenuesToAdd.length}`);
console.log(`更新照片: ${updatedCount}\n`);

// 保存更新後的資料
fs.writeFileSync('sample-data.json', JSON.stringify(venues, null, 2));
console.log('✅ 已保存到 sample-data.json\n');

console.log('🎉 整合完成！');
