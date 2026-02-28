const fs = require('fs');

console.log('🔄 收集重要會地的完整資訊...\n');

// 讀取現有資料
const venues = JSON.parse(fs.readFileSync('sample-data.json', 'utf8'));

// 第一優先級：需要詳細更新的場地
const priorityVenues = [
  {
    name: '集思會議中心',
    searchKeywords: ['集思', '會議中心'],
    urls: [
      'https://www.meeting.com.tw/',
      'https://www.accupass.com/venue/'
    ]
  },
  {
    name: '文化大學',
    searchKeywords: ['文化大學', '中國文化大學'],
    urls: [
      'https://www.pccu.edu.tw/',
      'https://www.sce.pccu.edu.tw/'
    ]
  },
  {
    name: '政大公企中心',
    searchKeywords: ['政大公企中心', '政治大學公共行政'],
    urls: [
      'https://paep.nccu.edu.tw/',
      'https://www.nccu.edu.tw/'
    ]
  },
  {
    name: '台大醫院國際會議中心',
    searchKeywords: ['台大醫院', '國際會議中心'],
    urls: [
      'https://www.ntuh.gov.tw/',
      'https://ntuh.mc.ntu.edu.tw/'
    ]
  }
];

// 檢查場地是否存在
const checkVenue = (name, keywords) => {
  const found = venues.find(v => {
    const venueName = v.name.toLowerCase();
    return keywords.some(keyword => venueName.includes(keyword.toLowerCase());
  });
  return found;
};

// 收集每個場地的資訊
console.log('📊 骨幹場地檢查:\n');
priorityVenues.forEach((venue, index) => {
  const exists = checkVenue(venue.name, venue.searchKeywords);
  console.log(`${index + 1}. ${venue.name}`);
  
  if (exists) {
    console.log(`   ✅ 已存在 (ID: ${exists.id})`);
    console.log(`   骨幹場地: ${exists.roomName || '會議室'}`);
    console.log(`   照片: ${exists.images?.main ? '✅' : '❌'}`);
    console.log(`   咪地大小: ${exists.dimensions?.area ? '✅' : '❌'}`);
    console.log(`   容納人數: ${exists.maxCapacityTheater ? '✅' : '❌'}`);
    console.log(`   蚂絡方式: ${exists.contactPhone && exists.contactPhone !== '請查詢官網' ? '✅' : '❌'}`);
    console.log('');
  } else {
    console.log(`   ❌ 不存在 - 需要新增`);
  }
});

console.log('\n🎯 開始收集資料...\n');
console.log('將使用嚴謹的資料收集流程:');
console.log('- 訪問官方網站');
console.log('- 收集真實、最新的資訊');
console.log('- 不使用猜測');
console.log('- 標記資料來源');
console.log('- 躍進交叉查核\n');
