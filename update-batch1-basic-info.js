const fs = require('fs');

console.log('🔄 更新第一批飯店的基本資訊...\n');

// 讀取現有資料
const venues = JSON.parse(fs.readFileSync('sample-data.json', 'utf8'));

// 第一批飯店的更新資料
const hotelUpdates = {
  '台北晶華酒店': {
    address: '台北市中山區中山北路二段39巷3號',
    phone: '02-2523-8000',
    email: 'reservations@regenttaiwan.com',
    url: 'https://www.regenttaiwan.com',
    notes: '五星級奢華酒店，擁有先進高端的會議場地'
  },
  '台北國賓大飯店': {
    address: '台北市中山區中山北路二段63號',
    phone: '02-2551-1111',
    email: 'sales@ambassador-taipei.com',
    url: 'https://www.ambassador-hotels.com/tc/taipei',
    notes: '五星級酒店，提供多樣化會議及宴會空間'
  },
  '台北文華東方酒店': {
    address: '台北市敦化北路158號',
    phone: '02-2715-6888',
    email: 'mo-tpe@mohg.com',
    url: 'https://www.mandarinoriental.com/taipei',
    notes: '國際頂級奢華酒店，精緻的會議與活動場地'
  },
  '墾丁福華渡假飯店': {
    address: '屏東縣恆春鎮墾丁路2號',
    phone: '08-886-2321',
    email: 'kt@howard-hotels.com.tw',
    url: 'https://www.howard-hotels.com.tw',
    notes: '渡假型飯店，適合企業訓練及團體活動'
  },
  '墾丁凱撒大飯店': {
    address: '屏東縣恆春鎮墾丁路6號',
    phone: '08-886-1888',
    email: 'sales@kenting.caesarpark.com.tw',
    url: 'https://kenting.caesarpark.com.tw',
    notes: '南洋風情渡假飯店，擁有多功能會議室'
  },
  '板橋凱撒大飯店': {
    address: '新北市板橋區縣民大道二段8號',
    phone: '02-8953-8999',
    email: 'banqiao@caesarpark.com.tw',
    url: 'https://banqiao.caesarpark.com.tw',
    notes: '三鐵共構飯店，交通便利，適合商務會議'
  },
  '福容大飯店淡水漁人碼頭': {
    address: '新北市淡水區觀海路83號',
    phone: '02-2628-7777',
    email: 'fw@fullon-hotels.com.tw',
    url: 'https://www.fullon-hotels.com.tw/fw/',
    notes: '郵輪造型飯店，台灣最美飯店之一'
  },
  '台北遠東香格里拉酒店': {
    address: '台北市敦化南路二段201號',
    phone: '02-2378-8888',
    email: 'reservations.slta@shangri-la.com',
    url: 'https://www.shangri-la.com/taipei',
    notes: '五星級國際連鎖酒店，高樓層景觀會議場地'
  }
};

// 統計
const stats = {
  updated: 0,
  notFound: 0
};

// 更新場地資料
Object.entries(hotelUpdates).forEach(([hotelName, updates]) => {
  const venue = venues.find(v => v.name === hotelName);
  
  if (venue) {
    // 更新資料
    venue.address = updates.address;
    venue.contactPhone = updates.phone;
    venue.contactEmail = updates.email;
    venue.url = updates.url;
    venue.notes = updates.notes;
    venue.lastUpdated = new Date().toISOString();
    
    // 標記需要補充的項目
    venue.needsUpdate = {
      photo: !venue.images?.main,
      price: !venue.priceHalfDay && !venue.priceFullDay,
      capacity: !venue.maxCapacityTheater && !venue.maxCapacityEmpty
    };
    
    stats.updated++;
    console.log(`✅ ${stats.updated}. ${hotelName}`);
    console.log(`   地址: ${updates.address}`);
    console.log(`   電話: ${updates.phone}`);
    console.log(`   需要補充: 照片=${venue.needsUpdate.photo}, 價格=${venue.needsUpdate.price}, 容納=${venue.needsUpdate.capacity}`);
    console.log('');
  } else {
    stats.notFound++;
    console.log(`⚠️ 找不到場地: ${hotelName}`);
  }
});

// 保存更新後的資料
fs.writeFileSync('sample-data.json', JSON.stringify(venues, null, 2));

console.log('\n📊 更新統計:');
console.log(`✅ 已更新: ${stats.updated} 個`);
console.log(`⚠️ 找不到: ${stats.notFound} 個`);

// 生成需要手動補充的清單
const manualUpdateList = venues.filter(v => v.needsUpdate && (v.needsUpdate.photo || v.needsUpdate.price || v.needsUpdate.capacity));

console.log(`\n📋 需要手動補充詳細資訊的場地: ${manualUpdateList.length} 個`);

const manualList = manualUpdateList.map(v => ({
  name: v.name,
  room: v.roomName,
  city: v.city,
  needsPhoto: v.needsUpdate.photo,
  needsPrice: v.needsUpdate.price,
  needsCapacity: v.needsUpdate.capacity,
  url: v.url
}));

fs.writeFileSync('manual-update-list.json', JSON.stringify(manualList, null, 2));

console.log('✅ 已保存手動補充清單到: manual-update-list.json');
console.log('✅ 已更新 sample-data.json');
