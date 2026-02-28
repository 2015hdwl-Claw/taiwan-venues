const fs = require('fs');

console.log('🔄 嚴謹的資料品質檢查系統\n');

// 讀取資料
const venues = JSON.parse(fs.readFileSync('sample-data.json', 'utf8'));

console.log(`總場地數: ${venues.length}\n`);

// 品質標準
const standards = {
  required: ['name', 'city', 'address', 'contactPhone', 'url', 'venueType'],
  recommended: ['images.main', 'dimensions.area', 'maxCapacityTheater', 'priceHalfDay', 'contactEmail']
};

// 檢查結果
const results = {
  complete: 0,
  partial: 0,
  incomplete: 0,
  unverified: 0,
  guessed: 0,
  issues: []
};

// 檢查每個場地
venues.forEach(venue => {
  let qualityLevel = 'COMPLETE';
  const issues = [];
  
  // 檢查必填欄位
  standards.required.forEach(field => {
    const value = venue[field];
    if (!value || value === '' || value === '請查詢官網') {
      issues.push(`缺少必填: ${field}`);
      qualityLevel = 'INCOMPLETE';
    }
  });
  
  // 檢查建議欄位
  standards.recommended.forEach(field => {
    const parts = field.split('.');
    let value = venue;
    parts.forEach(part => {
      value = value && value[part] ? value[part] : null;
    });
    
    if (!value || value === '' || value === '請查詢官網') {
      if (qualityLevel === 'COMPLETE') {
        qualityLevel = 'PARTIAL';
      }
      issues.push(`缺少建議: ${field}`);
    }
  });
  
  // 檢查資料來源
  if (!venue.dataSource && !venue.verified) {
    qualityLevel = 'UNVERIFIED';
    issues.push('缺少資料來源標記');
  }
  
  // 檢查猜測資料
  if (venue.notes && (
    venue.notes.includes('適合') ||
    venue.notes.includes('可能') ||
    venue.notes.includes('大約')
  )) {
    qualityLevel = 'GUESSED';
    issues.push('資料可能為猜測');
  }
  
  // 記錄結果
  results[qualityLevel]++;
  if (issues.length > 0) {
    results.issues.push({
      id: venue.id,
      name: venue.name,
      room: venue.roomName,
      city: venue.city,
      qualityLevel,
      issues
    });
  }
});

// 統計
console.log('\n📊 資料品質統計:\n');
console.log(`✅ 完整: ${results.complete} (${((results.complete / venues.length) * 100).toFixed(1)}%)`);
console.log(`⚠️ 部分: ${results.partial} (${((results.partial / venues.length) * 100).toFixed(1)}%)`);
console.log(`❌ 不完整: ${results.incomplete} (${((results.incomplete / venues.length) * 100).toFixed(1)}%)`);
console.log(`⚠️ 未驗證: ${results.unverified} (${((results.unverified / venues.length) * 100).toFixed(1)}%)`);
console.log(`❌ 猭測: ${results.guessed} (${((results.guessed / venues.length) * 100).toFixed(1)}%)`);

console.log(`\n❌ 最嚴重的問題（前 20 個）:\n`);
results.issues.slice(0, 20).forEach((venue, i) => {
  console.log(`${i + 1}. ${venue.name} ${venue.room || ''} (${venue.city})`);
  console.log(`   品質: ${venue.qualityLevel}`);
  console.log(`   問題: ${venue.issues.join(', ')}`);
  console.log('');
});

console.log(`\n📊 總結: ${results.issues.length} 個場地需要改善`);

// 保存報告
fs.writeFileSync(
  'venue-quality-report.json',
  JSON.stringify({
    timestamp: new Date().toISOString(),
    summary: {
      total: venues.length,
      ...results
    },
    details: results.issues
  }, null, 2)
);

console.log('✅ 調查報告已保存到: venue-quality-report.json');
