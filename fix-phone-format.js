const fs = require('fs');

console.log('🔧 修正電話號碼格式...\n');

// 讀取資料
const venues = JSON.parse(fs.readFileSync('sample-data.json', 'utf8'));

// 統計
const stats = {
  total: venues.length,
  fixed: 0,
  alreadyCorrect: 0,
  needsManualFix: 0
};

// 修正電話號碼格式
function formatPhoneNumber(phone) {
  if (!phone || phone === '請查詢官網') {
    return phone;
  }
  
  // 移除所有非數字字元
  let cleaned = phone.replace(/[^\d]/g, '');
  
  // 如果是 10 碼（02 開頭）
  if (cleaned.length === 10 && cleaned.startsWith('02')) {
    return `${cleaned.slice(0, 2)}-${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
  }
  
  // 如果是 10 碼（其他區碼）
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}-${cleaned.slice(7)}`;
  }
  
  // 如果是 9 碼（手機）
  if (cleaned.length === 9 && cleaned.startsWith('09')) {
    return `${cleaned.slice(0, 4)}-${cleaned.slice(4)}`;
  }
  
  // 如果是 8 碼
  if (cleaned.length === 8) {
    return `${cleaned.slice(0, 4)}-${cleaned.slice(4)}`;
  }
  
  // 如果是 7 碼
  if (cleaned.length === 7) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
  }
  
  // 無法自動修正，標記為需要手動修正
  return phone;
}

// 修正每個場地的電話號碼
venues.forEach(venue => {
  if (venue.contactPhone && venue.contactPhone !== '請查詢官網') {
    const original = venue.contactPhone;
    const formatted = formatPhoneNumber(original);
    
    // 檢查是否符合標準格式
    const phoneRegex = /^[0-9]{2,4}-[0-9]{3,4}-[0-9]{3,4}$/;
    
    if (phoneRegex.test(formatted)) {
      venue.contactPhone = formatted;
      stats.fixed++;
      console.log(`✅ ${venue.name}: ${original} → ${formatted}`);
    } else if (phoneRegex.test(original)) {
      stats.alreadyCorrect++;
    } else {
      stats.needsManualFix++;
      console.log(`⚠️ ${venue.name}: ${original}（需手動修正）`);
    }
  }
});

// 保存修正後的資料
fs.writeFileSync('sample-data.json', JSON.stringify(venues, null, 2));

console.log('\n📊 修正統計:');
console.log(`✅ 已修正: ${stats.fixed} 個`);
console.log(`✅ 已正確: ${stats.alreadyCorrect} 個`);
console.log(`⚠️ 需手動修正: ${stats.needsManualFix} 個`);
console.log(`\n✅ 已更新 sample-data.json`);
