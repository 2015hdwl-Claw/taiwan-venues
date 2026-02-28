const fs = require('fs');

console.log('🔄 更新第三批：大學/研究機構（35 個）\n');

// 讀取現有資料
const venues = JSON.parse(fs.readFileSync('sample-data.json', 'utf8'));

// 第三批：大學/研究機構的更新資料
const batch3Universities = {
  '國立臺灣大學': {
    address: '台北市羅斯福路四段1號',
    phone: '02-3366-9828',
    email: 'ntu@ntu.edu.tw',
    url: 'https://www.ntu.edu.tw',
    venueType: '學術場地',
    notes: '會議中心、學術場地，適合學術會議、研討會',
    maxCapacityTheater: 1000,
    priceHalfDay: null,
    priceFullDay: null,
    rentalTimeNote: '需申請場地租借'
  },
  '國立政治大學': {
    address: '台北市文山區指南路二段64號',
    phone: '02-2939-3091',
    email: 'nccu@nccu.edu.tw',
    url: 'https://www.nccu.edu.tw',
    venueType: '學術場地',
    notes: '會議中心、學術場地',
    maxCapacityTheater: 500,
    priceHalfDay: null,
    priceFullDay: null,
    rentalTimeNote: '需申請場地租借'
  },
  '國立清華大學': {
    address: '新竹市光復路二段101號',
    phone: '03-571-5131',
    email: 'nthu@nthu.edu.tw',
    url: 'https://www.nthu.edu.tw',
    venueType: '學術場地',
    notes: '會議中心、學術場地',
    maxCapacityTheater: 800,
    priceHalfDay: null,
    priceFullDay: null,
    rentalTimeNote: '需申請場地租借'
  },
  '國立成功大學': {
    address: '台南市東區大學路1號',
    phone: '06-275-7575',
    email: 'ncku@ncku.edu.tw',
    url: 'https://www.ncku.edu.tw',
    venueType: '學術場地',
    notes: '會議中心、學術場地',
    maxCapacityTheater: 1000,
    priceHalfDay: null,
    priceFullDay: null,
    rentalTimeNote: '需申請場地租借'
  },
  '國立臺灣科技大學': {
    address: '台北市基隆路四段43號',
    phone: '02-2733-3141',
    email: 'ntust@ntust.edu.tw',
    url: 'https://www.ntust.edu.tw',
    venueType: '學術場地',
    notes: '會議中心、學術場地',
    maxCapacityTheater: 400,
    priceHalfDay: null,
    priceFullDay: null,
    rentalTimeNote: '需申請場地租借'
  },
  '工業技術研究院': {
    address: '新竹縣竹東鎮中興路四段195號',
    phone: '03-591-6666',
    email: 'itri@itri.org.tw',
    url: 'https://www.itri.org.tw',
    venueType: '學術場地',
    notes: '會議中心、研究場地',
    maxCapacityTheater: 500,
    priceHalfDay: null,
    priceFullDay: null,
    rentalTimeNote: '需申請場地租借'
  },
  '中央研究院': {
    address: '台北市南港區研究院路二段128號',
    phone: '02-2789-9629',
    email: 'sinica@gate.sinica.edu.tw',
    url: 'https://www.sinica.edu.tw',
    venueType: '學術場地',
    notes: '會議中心、學術場地',
    maxCapacityTheater: 800,
    priceHalfDay: null,
    priceFullDay: null,
    rentalTimeNote: '需申請場地租借'
  },
  '國立臺灣師範大學': {
    address: '台北市和平東路一段162號',
    phone: '02-7734-1111',
    email: 'ntnu@ntnu.edu.tw',
    url: 'https://www.ntnu.edu.tw',
    venueType: '學術場地',
    notes: '會議中心、學術場地',
    maxCapacityTheater: 600,
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
Object.entries(batch3Universities).forEach(([venueName, updates]) => {
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
