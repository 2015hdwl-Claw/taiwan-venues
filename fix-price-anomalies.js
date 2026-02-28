const fs = require('fs');

console.log('🔍 檢查異常價格...\n');

// 讀取資料
const venues = JSON.parse(fs.readFileSync('sample-data.json', 'utf8'));

// 價格異常的場地
const priceAnomalies = [
  { name: 'W飯店台北', expectedPrice: '需詢價', note: '五星級飯店，價格可能較高' },
  { name: '南港展覽館', expectedPrice: '需詢價', note: '大型展覽場地，價格可能較高' },
  { name: '高雄巨蛋', expectedPrice: '需詢價', note: '大型體育場地，價格可能較高' },
  { name: '文華東方婚宴會館', expectedPrice: '需詢價', note: '婚宴會館，價格可能較高' },
  { name: '台北國際會議中心', expectedPrice: '需詢價', note: '國際會議中心，價格可能較高' }
];

// 標記異常價格
console.log('📊 異常價格場地:\n');
priceAnomalies.forEach((anomaly, index) => {
  const venue = venues.find(v => v.name === anomaly.name);
  
  if (venue) {
    console.log(`${index + 1}. ${venue.name}`);
    console.log(`   半日價: ${venue.priceHalfDay || '未設定'}`);
    console.log(`   全日價: ${venue.priceFullDay || '未設定'}`);
    console.log(`   說明: ${anomaly.note}`);
    console.log(`   建議: ${anomaly.expectedPrice}`);
    
    // 標記需要手動驗證
    venue.needsManualVerification = true;
    venue.manualVerificationNotes = `價格需要驗證: ${anomaly.note}`;
    venue.dataSource = 'needs_verification';
    venue.verified = false;
    
    console.log(`   ✅ 已標記為需要手動驗證\n`);
  } else {
    console.log(`${index + 1}. ❌ 找不到場地: ${anomaly.name}\n`);
  }
});

// 處理大型場地
console.log('\n🔍 大型場地處理:\n');
const largeVenues = [
  { name: '台北小巨蛋', capacity: 15000, note: '大型演唱會場地，不適合一般會議' },
  { name: '高雄巨蛋', capacity: 5500, note: '大型演唱會場地，不適合一般會議' }
];

largeVenues.forEach((large, index) => {
  const venue = venues.find(v => v.name === large.name);
  
  if (venue) {
    console.log(`${index + 1}. ${venue.name}`);
    console.log(`   容納人數: ${venue.maxCapacityTheater || '未設定'}`);
    console.log(`   說明: ${large.note}`);
    
    // 標記為大型場地
    venue.venueType = '大型體育場館';
    venue.notes = `${venue.notes || ''} ${large.note}`.trim();
    venue.suitableForMeeting = false;
    
    console.log(`   ✅ 已標記為大型場地\n`);
  } else {
    console.log(`${index + 1}. ❌ 找不到場地: ${large.name}\n`);
  }
});

// 保存修正後的資料
fs.writeFileSync('sample-data.json', JSON.stringify(venues, null, 2));

console.log('\n✅ 已更新 sample-data.json');
