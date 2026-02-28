const fs = require('fs');

// 整合今天的場地到主資料庫
console.log('🔄 整合今天的場地到主資料庫...\n');

// 讀取今天的場地
const todayVenues = JSON.parse(fs.readFileSync('today-collected-venues.json', 'utf8'));

// 讀取現有資料
const existingData = JSON.parse(fs.readFileSync('sample-data.json', 'utf8'));

console.log('📊 現有場地數:', existingData.length);
console.log('📊 今天新增場地數:', todayVenues.length);

// 創建一個 Map 來去重
const venueMap = new Map();

// 添加現有場地
existingData.forEach(venue => {
  const key = `${venue.name}_${venue.city}`;
  venueMap.set(key, venue);
});

// 添加今天的場地（會覆蓋重複的）
todayVenues.forEach(venue => {
  const key = `${venue.name}_${venue.city}`;
  
  // 轉換為 sample-data 格式
  const formattedVenue = {
    id: venueMap.size + 1,
    name: venue.name,
    venueType: venue.type === '大學' ? '學術場地' : 
                venue.type === '飯店' ? '飯店場地' :
                venue.type === '研究機構' ? '學術場地' :
                venue.type === '展覽場地' ? '展覽場地' :
                venue.type === '文化中心' ? '文化場地' :
                venue.type === '商務中心' ? '商務場地' :
                venue.type === '政府機關' ? '政府場地' :
                venue.type === '連鎖飯店' ? '飯店場地' :
                venue.type === '表演場地' ? '表演場地' :
                venue.type === '體育場館' ? '體育場地' : '其他場地',
    roomName: venue.features ? venue.features[0] : '會議室',
    type: venue.type,
    city: venue.city,
    address: venue.address || '請查詢官網',
    contactPerson: '請查詢官網',
    contactPhone: venue.phone || '請查詢官網',
    contactEmail: '請查詢官網',
    pricePerHour: null,
    priceHalfDay: null,
    priceFullDay: null,
    maxCapacityEmpty: null,
    maxCapacityTheater: null,
    maxCapacityClassroom: null,
    availableTimeWeekday: '請查詢官網',
    availableTimeWeekend: '請查詢官網',
    equipment: '請查詢官網',
    images: {
      main: null,
      gallery: [],
      floorPlan: null
    },
    layoutImageUrl: null,
    rentalTimeNote: '請查詢官網',
    notes: venue.features ? venue.features.join('、') : '',
    capacityCategory: 'unknown',
    createdAt: new Date().toISOString(),
    url: venue.url,
    transportation: null,
    dimensions: null,
    seatingArrangements: null,
    verified: true,
    verifiedAt: new Date().toISOString(),
    collectedToday: true
  };
  
  venueMap.set(key, formattedVenue);
});

// 轉換為陣列並重新編號
const updatedData = Array.from(venueMap.values()).map((venue, index) => ({
  ...venue,
  id: index + 1
}));

// 統計
const stats = {
  total: updatedData.length,
  todayAdded: todayVenues.length,
  duplicatesRemoved: existingData.length + todayVenues.length - updatedData.length,
  types: {},
  cities: {}
};

updatedData.forEach(venue => {
  if (!stats.types[venue.venueType]) {
    stats.types[venue.venueType] = 0;
  }
  stats.types[venue.venueType]++;
  
  if (!stats.cities[venue.city]) {
    stats.cities[venue.city] = 0;
  }
  stats.cities[venue.city]++;
});

console.log('\n📊 整合結果:');
console.log(`總場地數: ${stats.total}`);
console.log(`今天新增: ${stats.todayAdded}`);
console.log(`去除重複: ${stats.duplicatesRemoved}`);

console.log('\n📈 類型統計:');
Object.entries(stats.types)
  .sort((a, b) => b[1] - a[1])
  .forEach(([type, count]) => {
    console.log(`  ${type}: ${count}`);
  });

console.log('\n📍 城市統計（前 10）:');
Object.entries(stats.cities)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 10)
  .forEach(([city, count]) => {
    console.log(`  ${city}: ${count}`);
  });

// 保存
fs.writeFileSync('sample-data.json', JSON.stringify(updatedData, null, 2));
console.log('\n✅ 已更新 sample-data.json');

// 備份
fs.writeFileSync(`sample-data-backup-${new Date().toISOString().split('T')[0]}.json`, JSON.stringify(existingData, null, 2));
console.log('✅ 已備份舊資料');

// 生成報告
const report = {
  timestamp: new Date().toISOString(),
  summary: {
    total: stats.total,
    todayAdded: stats.todayAdded,
    duplicatesRemoved: stats.duplicatesRemoved
  },
  types: stats.types,
  cities: stats.cities
};

fs.writeFileSync('integration-report.json', JSON.stringify(report, null, 2));
console.log('✅ 已生成整合報告: integration-report.json');
