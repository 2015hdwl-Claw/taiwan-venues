const fs = require('fs');

console.log('🔄 第一批更新：飯店類（8 個）\n');

// 讀取現有資料
const venues = JSON.parse(fs.readFileSync('sample-data.json', 'utf8'));

// 第一批飯店清單
const batch1Hotels = [
  {
    name: '台北晶華酒店',
    url: 'https://www.regenttaiwan.com',
    meetingUrl: 'https://www.regenttaiwan.com/meetings-and-events',
    city: '台北市',
    address: '台北市中山區中山北路二段39巷3號',
    phone: '02-2523-8000',
    email: 'reservations@regenttaiwan.com'
  },
  {
    name: '台北國賓大飯店',
    url: 'https://www.ambassador-hotels.com/tc/taipei',
    meetingUrl: 'https://www.ambassador-hotels.com/tc/taipei/meetings-events',
    city: '台北市',
    address: '台北市中山區中山北路二段63號',
    phone: '02-2551-1111',
    email: 'sales@ambassador-taipei.com'
  },
  {
    name: '台北文華東方酒店',
    url: 'https://www.mandarinoriental.com/taipei',
    meetingUrl: 'https://www.mandarinoriental.com/taipei/meetings-and-events',
    city: '台北市',
    address: '台北市敦化北路158號',
    phone: '02-2715-6888',
    email: 'mo-tpe@mohg.com'
  },
  {
    name: '墾丁福華渡假飯店',
    url: 'https://www.howard-hotels.com.tw',
    meetingUrl: 'https://www.howard-hotels.com.tw/kt/meeting/',
    city: '屏東縣',
    address: '屏東縣恆春鎮墾丁路2號',
    phone: '08-886-2321',
    email: 'kt@howard-hotels.com.tw'
  },
  {
    name: '墾丁凱撒大飯店',
    url: 'https://kenting.caesarpark.com.tw',
    meetingUrl: 'https://kenting.caesarpark.com.tw/meeting/',
    city: '屏東縣',
    address: '屏東縣恆春鎮墾丁路6號',
    phone: '08-886-1888',
    email: 'sales@kenting.caesarpark.com.tw'
  },
  {
    name: '板橋凱撒大飯店',
    url: 'https://banqiao.caesarpark.com.tw',
    meetingUrl: 'https://banqiao.caesarpark.com.tw/meeting/',
    city: '新北市',
    address: '新北市板橋區縣民大道二段8號',
    phone: '02-8953-8999',
    email: 'banqiao@caesarpark.com.tw'
  },
  {
    name: '福容大飯店淡水漁人碼頭',
    url: 'https://www.fullon-hotels.com.tw/fw/',
    meetingUrl: 'https://www.fullon-hotels.com.tw/fw/meeting/',
    city: '新北市',
    address: '新北市淡水區觀海路83號',
    phone: '02-2628-7777',
    email: 'fw@fullon-hotels.com.tw'
  },
  {
    name: '台北遠東香格里拉酒店',
    url: 'https://www.shangri-la.com/taipei',
    meetingUrl: 'https://www.shangri-la.com/taipei/meetings-events/',
    city: '台北市',
    address: '台北市敦化南路二段201號',
    phone: '02-2378-8888',
    email: 'reservations.slta@shangri-la.com'
  }
];

// 準備更新資料
const updateData = {
  timestamp: new Date().toISOString(),
  batch: '第一批：飯店類',
  total: batch1Hotels.length,
  hotels: []
};

batch1Hotels.forEach((hotel, index) => {
  console.log(`${index + 1}. ${hotel.name}`);
  console.log(`   URL: ${hotel.url}`);
  console.log(`   會議室頁面: ${hotel.meetingUrl}`);
  console.log(`   地址: ${hotel.address}`);
  console.log(`   電話: ${hotel.phone}`);
  console.log('');
  
  updateData.hotels.push({
    name: hotel.name,
    url: hotel.url,
    meetingUrl: hotel.meetingUrl,
    city: hotel.city,
    address: hotel.address,
    phone: hotel.phone,
    email: hotel.email,
    needsCollection: true,
    needsPhoto: true,
    needsPrice: true,
    needsCapacity: true
  });
});

// 保存更新清單
fs.writeFileSync('batch1-hotels-update.json', JSON.stringify(updateData, null, 2));

console.log('✅ 已保存第一批更新清單到: batch1-hotels-update.json');
console.log('\n📝 下一步：使用 web_fetch 收集每個飯店的詳細資訊');
