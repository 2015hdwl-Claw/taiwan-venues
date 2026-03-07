const fs = require('fs');

// 讀取所有場地資料
const data = JSON.parse(fs.readFileSync('./venues-all-cities.json', 'utf8'));

// 篩選台北市場地
const taipeiVenues = data.filter(v => v.city === '台北市');

console.log(`總計台北市場地: ${taipeiVenues.length}`);

// 照片計數函數
function countPhotos(images) {
  if (!images) return 0;
  const main = images.main ? 1 : 0;
  const gallery = images.gallery?.length || 0;
  const floorPlan = images.floorPlan ? 1 : 0;
  return main + gallery + floorPlan;
}

// 問題分類
const problems = {
  wrongMainPhoto: [],      // 主照片錯誤 (logo, 折扇等)
  noPhotos: [],            // 完全沒有照片
  lowPhotos: [],           // 照片太少 (<3)
  invalidUrl: [],          // 官網無效
  needsUpdate: [],         // 需要更新
  offline: [],             // 可能歇業
  missingWebsite: []       // 沒有官網
};

// 錯誤照片模式
const wrongPhotoPatterns = [
  /logo/i,
  /icon/i,
  /favicon/i,
  /\.svg$/i,
  /折扇/,
  /fan/i,
  /placeholder/i,
  /default/i,
  /no-image/i,
  /coming-soon/i
];

// 分析每個場地
taipeiVenues.forEach(venue => {
  const issues = [];
  const photoCount = countPhotos(venue.images);
  
  // 檢查主照片問題
  if (venue.images?.main) {
    const mainUrl = venue.images.main;
    const isWrong = wrongPhotoPatterns.some(p => p.test(mainUrl));
    if (isWrong) {
      issues.push('主照片錯誤');
      problems.wrongMainPhoto.push({...venue, issue: '主照片錯誤', mainUrl});
    }
  }
  
  // 檢查照片數量
  if (photoCount === 0) {
    issues.push('完全沒有照片');
    problems.noPhotos.push({...venue, issue: '完全沒有照片'});
  } else if (photoCount < 3) {
    issues.push(`照片太少 (${photoCount})`);
    problems.lowPhotos.push({...venue, issue: `照片太少 (${photoCount})`, photoCount});
  }
  
  // 檢查官網
  if (!venue.url && !venue.meetingPageUrl) {
    issues.push('缺少官網');
    problems.missingWebsite.push({...venue, issue: '缺少官網'});
  }
  
  // 檢查狀態
  if (venue.status === '下架' || venue.verificationStatus === '已歇業') {
    problems.offline.push(venue);
  }
  
  // 判斷是否需要更新
  if (issues.length > 0 && venue.status !== '下架') {
    problems.needsUpdate.push({
      ...venue,
      issues,
      photoCount,
      hasWebsite: !!(venue.url || venue.meetingPageUrl)
    });
  }
});

// 按類型分類需要更新的場地
const needsUpdateByType = {};
problems.needsUpdate.forEach(v => {
  const type = v.venueType || '其他';
  if (!needsUpdateByType[type]) needsUpdateByType[type] = [];
  needsUpdateByType[type].push(v);
});

// 輸出報告
const report = {
  summary: {
    total: taipeiVenues.length,
    needsUpdate: problems.needsUpdate.length,
    wrongMainPhoto: problems.wrongMainPhoto.length,
    noPhotos: problems.noPhotos.length,
    lowPhotos: problems.lowPhotos.length,
    offline: problems.offline.length,
    missingWebsite: problems.missingWebsite.length
  },
  byType: Object.keys(needsUpdateByType).map(type => ({
    type,
    count: needsUpdateByType[type].length
  })).sort((a, b) => b.count - a.count),
  problems: {
    wrongMainPhoto: problems.wrongMainPhoto.map(v => ({
      id: v.id,
      name: v.name,
      mainUrl: v.mainUrl,
      url: v.url || v.meetingPageUrl
    })),
    noPhotos: problems.noPhotos.map(v => ({
      id: v.id,
      name: v.name,
      venueType: v.venueType,
      url: v.url || v.meetingPageUrl
    })),
    lowPhotos: problems.lowPhotos.map(v => ({
      id: v.id,
      name: v.name,
      venueType: v.venueType,
      photoCount: v.photoCount,
      url: v.url || v.meetingPageUrl
    }))
  },
  priorityUpdateList: problems.needsUpdate
    .filter(v => v.hasWebsite)
    .sort((a, b) => {
      // 優先順序：飯店 > 會議中心 > 婚宴 > 其他
      const priority = { '飯店': 1, '會議中心': 2, '婚宴會館': 3 };
      const pa = priority[a.venueType] || 99;
      const pb = priority[b.venueType] || 99;
      return pa - pb;
    })
    .map(v => ({
      id: v.id,
      name: v.name,
      venueType: v.venueType,
      issues: v.issues,
      photoCount: v.photoCount,
      url: v.url || v.meetingPageUrl
    }))
};

fs.writeFileSync('./taipei-full-check-report.json', JSON.stringify(report, null, 2));

console.log('\n=== 檢查結果 ===');
console.log(`總場地數: ${report.summary.total}`);
console.log(`需要更新: ${report.summary.needsUpdate}`);
console.log(`主照片錯誤: ${report.summary.wrongMainPhoto}`);
console.log(`完全沒照片: ${report.summary.noPhotos}`);
console.log(`照片太少: ${report.summary.lowPhotos}`);
console.log(`已歇業: ${report.summary.offline}`);
console.log(`缺少官網: ${report.summary.missingWebsite}`);

console.log('\n=== 按類型統計 ===');
report.byType.forEach(t => console.log(`${t.type}: ${t.count}`));

console.log('\n=== 優先更新清單 (有官網可爬) ===');
console.log(`共 ${report.priorityUpdateList.length} 個場地`);
console.log('前 20 個:');
report.priorityUpdateList.slice(0, 20).forEach((v, i) => {
  console.log(`${i+1}. [${v.id}] ${v.name} (${v.venueType}) - ${v.issues.join(', ')}`);
});
