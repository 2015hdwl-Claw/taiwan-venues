const fs = require('fs');

console.log('📊 檢測場地資料完整性...\n');

// 讀取資料
const venues = JSON.parse(fs.readFileSync('sample-data.json', 'utf8'));

console.log(`總場地數: ${venues.length}\n`);

// 統計缺少的資訊
const stats = {
  total: venues.length,
  missingPrice: 0,
  missingCapacity: 0,
  missingMainImage: 0,
  missingGallery: 0,
  missingUrl: 0,
  missingAddress: 0,
  missingPhone: 0,
  missingEmail: 0,
  verifiedVenues: 0,
  todayCollected: 0
};

// 詳細清單
const missingDetails = {
  price: [],
  capacity: [],
  mainImage: [],
  gallery: [],
  url: [],
  address: [],
  contact: []
};

venues.forEach(venue => {
  // 檢查價格
  if (!venue.pricePerHour && !venue.priceHalfDay && !venue.priceFullDay) {
    stats.missingPrice++;
    if (missingDetails.price.length < 20) {
      missingDetails.price.push({
        name: venue.name,
        city: venue.city,
        id: venue.id
      });
    }
  }
  
  // 檢查容納人數
  if (!venue.maxCapacityEmpty && !venue.maxCapacityTheater && !venue.maxCapacityClassroom) {
    stats.missingCapacity++;
    if (missingDetails.capacity.length < 20) {
      missingDetails.capacity.push({
        name: venue.name,
        city: venue.city,
        id: venue.id
      });
    }
  }
  
  // 檢查主圖片
  if (!venue.images || !venue.images.main) {
    stats.missingMainImage++;
    if (missingDetails.mainImage.length < 20) {
      missingDetails.mainImage.push({
        name: venue.name,
        city: venue.city,
        id: venue.id
      });
    }
  }
  
  // 檢查畫廊
  if (!venue.images || !venue.images.gallery || venue.images.gallery.length === 0) {
    stats.missingGallery++;
  }
  
  // 檢查 URL
  if (!venue.url) {
    stats.missingUrl++;
    missingDetails.url.push({
      name: venue.name,
      city: venue.city,
      id: venue.id
    });
  }
  
  // 檢查地址
  if (!venue.address || venue.address === '請查詢官網') {
    stats.missingAddress++;
  }
  
  // 檢查電話
  if (!venue.contactPhone || venue.contactPhone === '請查詢官網') {
    stats.missingPhone++;
  }
  
  // 檢查 Email
  if (!venue.contactEmail || venue.contactEmail === '請查詢官網') {
    stats.missingEmail++;
  }
  
  // 檢查驗證狀態
  if (venue.verified) {
    stats.verifiedVenues++;
  }
  
  // 檢查今天收集
  if (venue.collectedToday) {
    stats.todayCollected++;
  }
});

// 計算百分比
const percentage = {
  missingPrice: ((stats.missingPrice / stats.total) * 100).toFixed(1),
  missingCapacity: ((stats.missingCapacity / stats.total) * 100).toFixed(1),
  missingMainImage: ((stats.missingMainImage / stats.total) * 100).toFixed(1),
  missingGallery: ((stats.missingGallery / stats.total) * 100).toFixed(1),
  missingUrl: ((stats.missingUrl / stats.total) * 100).toFixed(1),
  missingAddress: ((stats.missingAddress / stats.total) * 100).toFixed(1),
  missingPhone: ((stats.missingPhone / stats.total) * 100).toFixed(1),
  missingEmail: ((stats.missingEmail / stats.total) * 100).toFixed(1)
};

console.log('📊 資料完整性統計:\n');
console.log(`缺少價格: ${stats.missingPrice} (${percentage.missingPrice}%)`);
console.log(`缺少容納人數: ${stats.missingCapacity} (${percentage.missingCapacity}%)`);
console.log(`缺少主圖片: ${stats.missingMainImage} (${percentage.missingMainImage}%)`);
console.log(`缺少畫廊: ${stats.missingGallery} (${percentage.missingGallery}%)`);
console.log(`缺少 URL: ${stats.missingUrl} (${percentage.missingUrl}%)`);
console.log(`缺少地址: ${stats.missingAddress} (${percentage.missingAddress}%)`);
console.log(`缺少電話: ${stats.missingPhone} (${percentage.missingPhone}%)`);
console.log(`缺少 Email: ${stats.missingEmail} (${percentage.missingEmail}%)`);

console.log('\n📈 驗證狀態:');
console.log(`已驗證場地: ${stats.verifiedVenues} (${((stats.verifiedVenues / stats.total) * 100).toFixed(1)}%)`);
console.log(`今天收集: ${stats.todayCollected} (${((stats.todayCollected / stats.total) * 100).toFixed(1)}%)`);

// 顯示缺少價格的前 10 個場地
console.log('\n📋 缺少價格的場地（前 10 個）:');
missingDetails.price.slice(0, 10).forEach((v, i) => {
  console.log(`${i + 1}. ${v.name} (${v.city}) - ID: ${v.id}`);
});

// 顯示缺少容納人數的前 10 個場地
console.log('\n📋 缺少容納人數的場地（前 10 個）:');
missingDetails.capacity.slice(0, 10).forEach((v, i) => {
  console.log(`${i + 1}. ${v.name} (${v.city}) - ID: ${v.id}`);
});

// 顯示缺少主圖片的前 10 個場地
console.log('\n📋 缺少主圖片的場地（前 10 個）:');
missingDetails.mainImage.slice(0, 10).forEach((v, i) => {
  console.log(`${i + 1}. ${v.name} (${v.city}) - ID: ${v.id}`);
});

// 保存報告
const report = {
  timestamp: new Date().toISOString(),
  summary: stats,
  percentages: percentage,
  details: missingDetails
};

fs.writeFileSync('data-completeness-report.json', JSON.stringify(report, null, 2));

console.log('\n✅ 已保存報告到: data-completeness-report.json');

// 計算完整度評分
const completenessScore = (
  (100 - parseFloat(percentage.missingPrice)) * 0.2 +
  (100 - parseFloat(percentage.missingCapacity)) * 0.2 +
  (100 - parseFloat(percentage.missingMainImage)) * 0.2 +
  (100 - parseFloat(percentage.missingGallery)) * 0.1 +
  (100 - parseFloat(percentage.missingUrl)) * 0.1 +
  (100 - parseFloat(percentage.missingAddress)) * 0.1 +
  (100 - parseFloat(percentage.missingPhone)) * 0.05 +
  (100 - parseFloat(percentage.missingEmail)) * 0.05
).toFixed(1);

console.log(`\n🎯 資料完整度評分: ${completenessScore}/100`);
