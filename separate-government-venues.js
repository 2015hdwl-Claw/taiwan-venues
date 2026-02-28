const fs = require('fs');

console.log('🔄 分離機關場地到獨立資料庫...\n');

// 讀取主資料庫
const venues = JSON.parse(fs.readFileSync('sample-data.json', 'utf8'));

// 找出所有機關場地
const govtVenues = venues.filter(v =>
  v.venueType === '機關場地' ||
  v.type === '活動中心' ||
  v.type === '機關場地' ||
  v.type === '政府機關' ||
  v.name.includes('區民活動中心') ||
  v.name.includes('市民活動中心') ||
  v.name.includes('文化中心') ||
  v.name.includes('文化局') ||
  v.name.includes('政府')
);

console.log(`📊 找到機關場地: ${govtVenues.length} 個\n`);

// 創建機關場地獨立資料庫
const govtVenuesDB = {
  metadata: {
    title: "台灣機關場地資料庫",
    description: "政府機關、活動中心、演藝廳等公共場地",
    totalCount: govtVenues.length,
    lastUpdated: new Date().toISOString(),
    source: "台灣活動大師",
    contact: "https://github.com/2015hdwl-Claw/taiwan-venues"
  },
  venues: govtVenues.map(venue => ({
    ...venue,
    category: "機關場地",
    needsReview: true,
    reviewNote: "機關場地申請方式複雜，需要驗證申請流程、價格、可用時間等資訊"
  }))
};

// 保存機關場地資料庫
fs.writeFileSync('government-venues.json', JSON.stringify(govtVenuesDB, null, 2));
console.log(`✅ 已保存機關場地資料庫: government-venues.json\n`);

// 統計機關場地
const stats = {
  total: govtVenues.length,
  withPhotos: govtVenues.filter(v => v.images?.main).length,
  withoutPhotos: govtVenues.filter(v => !v.images?.main).length,
  withPrice: govtVenues.filter(v => v.priceHalfDay || v.priceFullDay).length,
  withoutPrice: govtVenues.filter(v => !v.priceHalfDay && !v.priceFullDay).length
};

console.log(`📊 機關場地統計:\n`);
console.log(`總數: ${stats.total}`);
console.log(`有照片: ${stats.withPhotos} (${((stats.withPhotos / stats.total) * 100).toFixed(1)}%)`);
console.log(`無照片: ${stats.withoutPhotos} (${((stats.withoutPhotos / stats.total) * 100).toFixed(1)}%)`);
console.log(`有價格: ${stats.withPrice} (${((stats.withPrice / stats.total) * 100).toFixed(1)}%)`);
console.log(`無價格: ${stats.withoutPrice} (${((stats.withoutPrice / stats.total) * 100).toFixed(1)}%)`);

// 按城市統計
const cityStats = {};
govtVenues.forEach(venue => {
  cityStats[venue.city] = (cityStats[venue.city] || 0) + 1;
});

console.log(`\n按城市統計:\n`);
Object.entries(cityStats)
  .sort((a, b) => b[1] - a[1])
  .forEach(([city, count]) => {
    console.log(`  ${city}: ${count} 個`);
  });

// 按類型統計
const typeStats = {};
govtVenues.forEach(venue => {
  const type = venue.type || venue.venueType || '未知';
  typeStats[type] = (typeStats[type] || 0) + 1;
});

console.log(`\n按類型統計:\n`);
Object.entries(typeStats)
  .sort((a, b) => b[1] - a[1])
  .forEach(([type, count]) => {
    console.log(`  ${type}: ${count} 個`);
  });

console.log(`\n✅ 機關場地分離完成！\n`);

console.log(`💡 建議:\n`);
console.log(`1. 優先處理有照片但無價格的場地（${govtVenues.filter(v => v.images?.main && !v.priceHalfDay && !v.priceFullDay).length} 個）`);
console.log(`2. 聯繫機關確認申請方式和價格`);
console.log(`3. 實地拍攝或索取場地照片`);
console.log(`4. 建立機關場地專屬申請指南`);
