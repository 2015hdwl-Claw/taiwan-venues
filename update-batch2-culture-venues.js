const fs = require('fs');

console.log('🔄 更新第二批：文化/展覽場地（5 個）\n');

// 讀取現有資料
const venues = JSON.parse(fs.readFileSync('sample-data.json', 'utf8'));

// 第二批場地的更新資料
const batch2Updates = {
  '中正紀念堂': {
    address: '臺北市中正區中山南路21號',
    phone: '02-2343-1100',
    email: 'service@cksmh.gov.tw',
    url: 'https://www.cksmh.gov.tw',
    venueType: '展覽場地',
    notes: '展覽、文化活動場地，適合大型展覽與文化活動',
    maxCapacityTheater: 800,
    priceHalfDay: null,
    priceFullDay: null,
    rentalTimeNote: '需申請場地租借'
  },
  '台北小巨蛋': {
    address: '臺北市松山區南京東路4段2號',
    phone: '02-2578-3536',
    email: 'service@arena.taipei',
    url: 'https://www.arena.taipei/',
    venueType: '體育場館',
    notes: '主場館、冰上樂園，適合大型演唱會、體育賽事',
    maxCapacityTheater: 15000,
    priceHalfDay: null,
    priceFullDay: null,
    rentalTimeNote: '需申請場地租借（分機513）'
  },
  '高雄市立美術館': {
    address: '高雄市鼓山區美術館路80號',
    phone: '07-555-0331',
    email: 'kmfa@kmfa.gov.tw',
    url: 'https://www.kmfa.gov.tw',
    venueType: '展覽場地',
    notes: '藝術展覽場地，適合展覽、文化活動',
    maxCapacityTheater: 200,
    priceHalfDay: null,
    priceFullDay: null,
    rentalTimeNote: '需申請場地租借'
  },
  '宜蘭傳藝中心': {
    address: '宜蘭縣五結鄉季新村五濱路二段201號',
    phone: '03-970-5815',
    email: 'service@ncfta.gov.tw',
    url: 'https://www.ncfta.gov.tw',
    venueType: '文化中心',
    notes: '傳統藝術中心，適合文化活動、表演',
    maxCapacityTheater: 500,
    priceHalfDay: null,
    priceFullDay: null,
    rentalTimeNote: '需申請場地租借'
  },
  '國家表演藝術中心': {
    address: '臺北市中山南路21-1號',
    phone: '02-3393-9777',
    email: 'service@npac-ntch.org',
    url: 'https://www.npac-ntch.org',
    venueType: '表演場地',
    notes: '國家級表演場地，適合音樂會、戲劇表演',
    maxCapacityTheater: 2000,
    priceHalfDay: null,
    priceFullDay: null,
    rentalTimeNote: '需申請場地租借'
  }
};

// 統計
const stats = {
  updated: 0,
  notFound: 0
};

// 更新場地資料
Object.entries(batch2Updates).forEach(([venueName, updates]) => {
  const venue = venues.find(v => v.name === venueName);
  
  if (venue) {
    // 更新資料
    venue.address = updates.address;
    venue.contactPhone = updates.phone;
    venue.contactEmail = updates.email;
    venue.url = updates.url;
    venue.venueType = updates.venueType;
    venue.notes = updates.notes;
    venue.maxCapacityTheater = updates.maxCapacityTheater;
    venue.priceHalfDay = updates.priceHalfDay;
    venue.priceFullDay = updates.priceFullDay;
    venue.rentalTimeNote = updates.rentalTimeNote;
    venue.lastUpdated = new Date().toISOString();
    
    // 標記需要補充的項目
    venue.needsUpdate = {
      photo: !venue.images?.main,
      price: !venue.priceHalfDay && !venue.priceFullDay,
      capacity: !venue.maxCapacityTheater && !venue.maxCapacityEmpty
    };
    
    stats.updated++;
    console.log(`✅ ${stats.updated}. ${venueName}`);
    console.log(`   地址: ${updates.address}`);
    console.log(`   電話: ${updates.phone}`);
    console.log(`   容納人數: ${updates.maxCapacityTheater} 人`);
    console.log(`   需要補充: 照片=${venue.needsUpdate.photo}, 價格=${venue.needsUpdate.price}`);
    console.log('');
  } else {
    stats.notFound++;
    console.log(`⚠️ 找不到場地: ${venueName}`);
  }
});

// 保存更新後的資料
fs.writeFileSync('sample-data.json', JSON.stringify(venues, null, 2));

console.log('\n📊 更新統計:');
console.log(`✅ 已更新: ${stats.updated} 個`);
console.log(`⚠️ 找不到: ${stats.notFound} 個`);

console.log('\n✅ 已更新 sample-data.json');
