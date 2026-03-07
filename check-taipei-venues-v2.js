#!/usr/bin/env node

/**
 * 台北市場地全面檢查腳本 V2
 * 使用 SOP V4.7 標準，區分場地類型
 */

const fs = require('fs');

// 讀取場地資料
const data = JSON.parse(fs.readFileSync('venues-all-cities.json', 'utf8'));
const taipeiVenues = data.filter(v => v.city === '台北市');

console.log(`台北市場地總數: ${taipeiVenues.length}`);

// 場地類型分類
const needsVenueListUrl = ['飯店場地', '會議中心', '展演場地', '宴會廳', '婚宴場地'];
const optionalVenueListUrl = ['咖啡廳', '餐廳', '共享空間', '活動中心'];

// 檢查項目
const checks = {
  total: taipeiVenues.length,
  criticalIssues: [],  // 嚴重問題（必須修正）
  minorIssues: [],     // 輕微問題（建議修正）
  stats: {
    missingUrl: 0,
    missingVenueListUrl: 0,
    missingMainImage: 0,
    imageFromWikipedia: 0,
    imageFromOther: 0,
    missingPrice: 0,
    missingCapacity: 0,
    inconsistentImages: 0
  }
};

// 逐一檢查
taipeiVenues.forEach((venue) => {
  const critical = [];
  const minor = [];
  
  // 1. 檢查 URL（所有場地都必須有）
  if (!venue.url || venue.url.trim() === '') {
    critical.push('❌ 缺少官網 URL');
    checks.stats.missingUrl++;
  }
  
  // 2. 檢查 venueListUrl（根據場地類型）
  const venueType = venue.venueType || '未知';
  if (needsVenueListUrl.includes(venueType)) {
    if (!venue.venueListUrl || venue.venueListUrl.trim() === '') {
      critical.push('❌ 缺少會議室清單 URL');
      checks.stats.missingVenueListUrl++;
    }
  } else if (optionalVenueListUrl.includes(venueType)) {
    if (!venue.venueListUrl || venue.venueListUrl.trim() === '') {
      minor.push('⚠️ 建議補充會議室清單 URL');
    }
  }
  
  // 3. 檢查主照片（所有場地都必須有）
  if (!venue.images || !venue.images.main || venue.images.main.trim() === '') {
    critical.push('❌ 缺少主照片');
    checks.stats.missingMainImage++;
  } else {
    // 檢查照片來源
    const imageUrl = venue.images.main.toLowerCase();
    if (imageUrl.includes('wikipedia') || imageUrl.includes('wikimedia')) {
      critical.push('❌ 照片來源為 Wikipedia（禁止）');
      checks.stats.imageFromWikipedia++;
    } else if (!imageUrl.includes(venue.url?.replace('https://', '').replace('http://', '').split('/')[0] || '')) {
      // 照片 URL 不包含官網域名，可能是第三方來源
      minor.push('⚠️ 照片可能非官網來源');
      checks.stats.imageFromOther++;
    }
    
    // 檢查一致性
    if (venue.venueMainImageUrl && venue.venueMainImageUrl !== venue.images.main) {
      minor.push('⚠️ venueMainImageUrl 與 images.main 不一致');
      checks.stats.inconsistentImages++;
    }
  }
  
  // 4. 檢查價格（建議有）
  if (!venue.priceHalfDay && !venue.priceFullDay) {
    minor.push('⚠️ 缺少價格資訊');
    checks.stats.missingPrice++;
  }
  
  // 5. 檢查容量（建議有）
  if (!venue.maxCapacityTheater && !venue.maxCapacityClassroom) {
    minor.push('⚠️ 缺少容量資訊');
    checks.stats.missingCapacity++;
  }
  
  // 記錄問題
  if (critical.length > 0) {
    checks.criticalIssues.push({
      id: venue.id,
      name: venue.name,
      roomName: venue.roomName,
      venueType: venueType,
      status: venue.status,
      issues: critical,
      url: venue.url,
      venueListUrl: venue.venueListUrl,
      images: venue.images
    });
  }
  
  if (minor.length > 0) {
    checks.minorIssues.push({
      id: venue.id,
      name: venue.name,
      roomName: venue.roomName,
      venueType: venueType,
      status: venue.status,
      issues: minor
    });
  }
});

// 輸出結果
console.log('\n=== 檢查結果 ===');
console.log(`總檢查數: ${checks.total}`);
console.log(`嚴重問題: ${checks.criticalIssues.length}`);
console.log(`輕微問題: ${checks.minorIssues.length}`);

console.log('\n=== 嚴重問題統計 ===');
console.log(`缺少官網 URL: ${checks.stats.missingUrl}`);
console.log(`缺少會議室清單 URL: ${checks.stats.missingVenueListUrl}`);
console.log(`缺少主照片: ${checks.stats.missingMainImage}`);
console.log(`照片來自 Wikipedia: ${checks.stats.imageFromWikipedia}`);

console.log('\n=== 輕微問題統計 ===');
console.log(`照片可能非官網來源: ${checks.stats.imageFromOther}`);
console.log(`照片不一致: ${checks.stats.inconsistentImages}`);
console.log(`缺少價格: ${checks.stats.missingPrice}`);
console.log(`缺少容量: ${checks.stats.missingCapacity}`);

// 計算需要改為待修的場地（有嚴重問題的上架場地）
const needsUpdate = checks.criticalIssues.filter(v => v.status === '上架');
console.log(`\n需要改為【待修】的上架場地: ${needsUpdate.length}`);

// 保存詳細報告
const report = {
  generatedAt: new Date().toISOString(),
  summary: {
    total: checks.total,
    criticalIssues: checks.criticalIssues.length,
    minorIssues: checks.minorIssues.length,
    needsStatusUpdate: needsUpdate.length
  },
  stats: checks.stats,
  criticalIssues: checks.criticalIssues,
  minorIssues: checks.minorIssues,
  needsUpdate: needsUpdate.map(v => ({
    id: v.id,
    name: v.name,
    roomName: v.roomName,
    venueType: v.venueType,
    newStatus: '待修',
    reason: v.issues.join(', ')
  }))
};

fs.writeFileSync(
  'taipei-venues-check-report-v2.json',
  JSON.stringify(report, null, 2)
);

console.log('\n詳細報告已保存至: taipei-venues-check-report-v2.json');

// 輸出前 20 個嚴重問題場地
console.log('\n=== 前 20 個嚴重問題場地 ===');
checks.criticalIssues.slice(0, 20).forEach((issue, i) => {
  console.log(`\n${i + 1}. [${issue.id}] ${issue.name} - ${issue.roomName} (${issue.venueType}, ${issue.status})`);
  issue.issues.forEach(issueText => {
    console.log(`   ${issueText}`);
  });
});

// 場地類型分布
console.log('\n=== 嚴重問題場地類型分布 ===');
const typeCount = {};
checks.criticalIssues.forEach(v => {
  typeCount[v.venueType] = (typeCount[v.venueType] || 0) + 1;
});
Object.entries(typeCount).sort((a,b) => b[1] - a[1]).forEach(([type, count]) => {
  console.log(`  ${type}: ${count}`);
});
