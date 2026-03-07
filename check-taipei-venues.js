#!/usr/bin/env node

/**
 * 台北市場地全面檢查腳本
 * 使用 SOP V4.7 標準
 */

const fs = require('fs');
const path = require('path');

// 讀取場地資料
const data = JSON.parse(fs.readFileSync('venues-all-cities.json', 'utf8'));
const taipeiVenues = data.filter(v => v.city === '台北市');

console.log(`台北市場地總數: ${taipeiVenues.length}`);

// 檢查項目
const checks = {
  total: taipeiVenues.length,
  issues: [],
  stats: {
    missingUrl: 0,
    missingVenueListUrl: 0,
    missingMainImage: 0,
    imageSourceIssue: 0,
    missingPrice: 0,
    missingCapacity: 0,
    inconsistentImages: 0,
    needsUpdate: []
  }
};

// 逐一檢查
taipeiVenues.forEach((venue, index) => {
  const issues = [];
  
  // 1. 檢查 URL
  if (!venue.url || venue.url.trim() === '') {
    issues.push('缺少官網 URL');
    checks.stats.missingUrl++;
  }
  
  // 2. 檢查 venueListUrl
  if (!venue.venueListUrl || venue.venueListUrl.trim() === '') {
    issues.push('缺少會議室清單 URL');
    checks.stats.missingVenueListUrl++;
  }
  
  // 3. 檢查主照片
  if (!venue.images || !venue.images.main || venue.images.main.trim() === '') {
    issues.push('缺少主照片');
    checks.stats.missingMainImage++;
  } else {
    // 檢查照片來源
    if (venue.images.main.includes('wikipedia') || 
        venue.images.main.includes('wikimedia')) {
      issues.push('照片來源為 Wikipedia（禁止）');
      checks.stats.imageSourceIssue++;
    }
    
    // 檢查一致性
    if (venue.venueMainImageUrl && 
        venue.venueMainImageUrl !== venue.images.main) {
      issues.push('venueMainImageUrl 與 images.main 不一致');
      checks.stats.inconsistentImages++;
    }
  }
  
  // 4. 檢查價格
  if (!venue.priceHalfDay && !venue.priceFullDay) {
    issues.push('缺少價格資訊');
    checks.stats.missingPrice++;
  }
  
  // 5. 檢查容量
  if (!venue.maxCapacityTheater && !venue.maxCapacityClassroom) {
    issues.push('缺少容量資訊');
    checks.stats.missingCapacity++;
  }
  
  // 記錄問題
  if (issues.length > 0) {
    checks.issues.push({
      id: venue.id,
      name: venue.name,
      roomName: venue.roomName,
      status: venue.status,
      currentIssues: issues,
      url: venue.url,
      venueListUrl: venue.venueListUrl,
      images: venue.images
    });
    
    // 如果是上架狀態但有問題，需要改為待修
    if (venue.status === '上架') {
      checks.stats.needsUpdate.push({
        id: venue.id,
        name: venue.name,
        newStatus: '待修',
        reason: issues.join(', ')
      });
    }
  }
});

// 輸出結果
console.log('\n=== 檢查結果 ===');
console.log(`總檢查數: ${checks.total}`);
console.log(`發現問題: ${checks.issues.length}`);

console.log('\n=== 問題統計 ===');
console.log(`缺少官網 URL: ${checks.stats.missingUrl}`);
console.log(`缺少會議室清單 URL: ${checks.stats.missingVenueListUrl}`);
console.log(`缺少主照片: ${checks.stats.missingMainImage}`);
console.log(`照片來源問題: ${checks.stats.imageSourceIssue}`);
console.log(`照片不一致: ${checks.stats.inconsistentImages}`);
console.log(`缺少價格: ${checks.stats.missingPrice}`);
console.log(`缺少容量: ${checks.stats.missingCapacity}`);

console.log(`\n需要更新狀態的場地: ${checks.stats.needsUpdate.length}`);

// 保存詳細報告
const report = {
  generatedAt: new Date().toISOString(),
  summary: {
    total: checks.total,
    issuesFound: checks.issues.length,
    needsStatusUpdate: checks.stats.needsUpdate.length
  },
  stats: checks.stats,
  issues: checks.issues
};

fs.writeFileSync(
  'taipei-venues-check-report.json',
  JSON.stringify(report, null, 2)
);

console.log('\n詳細報告已保存至: taipei-venues-check-report.json');

// 輸出前 20 個問題場地
console.log('\n=== 前 20 個問題場地 ===');
checks.issues.slice(0, 20).forEach((issue, i) => {
  console.log(`\n${i + 1}. [${issue.id}] ${issue.name} - ${issue.roomName} (${issue.status})`);
  console.log(`   問題: ${issue.currentIssues.join(', ')}`);
});
