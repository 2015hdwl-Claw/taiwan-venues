const fs = require('fs');

// 讀取資料
const data = JSON.parse(fs.readFileSync('./taipei-v44-batches.json', 'utf8'));

// 任務指定的場地（根據場地名稱匹配）
const batch4Task = [
  { taskId: 1049, name: '台北世貿中心展覽大樓', keyword: '台北世貿中心(TWTCA)展覽大樓' },
  { taskId: 1050, name: '台北世貿中心展覽三館', keyword: '南港展覽館' }, // 南港展覽館即世貿中心展覽三館
  { taskId: 1051, name: '台北艾美酒店', keyword: '台北艾美酒店' },
  { taskId: 1052, name: '台北花園大酒店', keyword: '台北花園大酒店' },
  { taskId: 1053, name: '台北亞都麗緻大飯店', keyword: '台北亞都麗緻大飯店' }
];

// 根據關鍵字查找場地
function findVenueByKeyword(keyword) {
  const venues = data.flat().filter(v => v.name.includes(keyword));
  // 選擇有 venueListUrl 的場地
  return venues.find(v => v.venueListUrl) || venues[0];
}

// SOP V4.4 驗證標準
function verifyVenue(venue, task) {
  const result = {
    taskId: task.taskId,
    name: task.name,
    id: venue ? venue.id : null,
    venueListUrl: venue ? (venue.venueListUrl || null) : null,
    venueMainImageUrl: venue ? (venue.venueMainImageUrl || null) : null,
    roomsCount: venue && venue.rooms ? venue.rooms.length : 0,
    status: '待修',
    notes: []
  };

  if (!venue) {
    result.notes.push('資料庫中未找到此場地');
    result.status = '待修';
    return result;
  }

  // Phase 1: 官網驗證
  if (venue.url && venue.url.length > 0) {
    result.phase1Pass = true;
    result.url = venue.url;
  } else {
    result.notes.push('Phase 1: 缺少官網 URL');
  }

  // Phase 2: 會議室頁面尋找
  if (venue.venueListUrl || venue.meetingPageUrl) {
    result.phase2Pass = true;
    result.venueListUrl = venue.venueListUrl || venue.meetingPageUrl;
  } else {
    result.notes.push('Phase 2: 缺少會議室頁面 URL');
  }

  // Phase 3: 會議室完整清單
  if (venue.rooms && Array.isArray(venue.rooms) && venue.rooms.length > 0) {
    result.phase3Pass = true;
    result.roomsCount = venue.rooms.length;
  } else if (venue.verificationNote && venue.verificationNote.includes('會議室清單')) {
    // 有 verificationNote 表示已補充會議室清單
    result.phase3Pass = true;
    result.notes.push('Phase 3: 會議室清單已補充（根據 verificationNote）');
  } else {
    result.notes.push('Phase 3: 會議室清單不完整或缺失');
  }

  // Phase 4: 照片抓取（場地外觀，禁止第三方來源）
  if (venue.venueMainImageUrl && venue.venueMainImageUrl.length > 0) {
    // 檢查是否為第三方來源
    const isThirdParty = venue.venueMainImageUrl.includes('wikipedia') ||
                          venue.venueMainImageUrl.includes('unsplash') ||
                          venue.venueMainImageUrl.includes('wikimedia');
    if (isThirdParty) {
      result.notes.push('Phase 4: 照片來源為第三方（Wikipedia/Unsplash），應使用官方來源');
    } else {
      result.phase4Pass = true;
      result.venueMainImageUrl = venue.venueMainImageUrl;
    }
  } else if (venue.images && venue.images.main && venue.images.main.length > 0) {
    // 檢查 images.main
    const isThirdParty = venue.images.main.includes('wikipedia') ||
                          venue.images.main.includes('unsplash') ||
                          venue.images.main.includes('wikimedia');
    if (isThirdParty) {
      result.notes.push('Phase 4: 照片來源為第三方（Wikipedia/Unsplash），應使用官方來源');
    } else {
      result.phase4Pass = true;
      result.venueMainImageUrl = venue.images.main;
    }
  } else {
    result.notes.push('Phase 4: 缺少場地主照片');
  }

  // Phase 5: 品牌/機構場地檢查
  const brandKeywords = ['世貿', '艾美', '花園', '亞都', '南港展覽'];
  const hasBrand = brandKeywords.some(kw => venue.name.includes(kw));
  if (hasBrand) {
    result.phase5Pass = true;
    result.notes.push('Phase 5: 品牌場地，需確認同一品牌其他場地是否完整');
  } else {
    result.phase5Pass = true;
  }

  // Phase 6: 資料一致性檢查
  if (venue.venueMainImageUrl && venue.images && venue.images.main) {
    if (venue.venueMainImageUrl === venue.images.main) {
      result.phase6Pass = true;
    } else {
      result.notes.push('Phase 6: venueMainImageUrl 和 images.main 不一致');
    }
  } else if (venue.venueMainImageUrl && !venue.images) {
    // 只有 venueMainImageUrl，沒有 images
    result.notes.push('Phase 6: 缺少 images.main 欄位');
  } else if (!venue.venueMainImageUrl && venue.images && venue.images.main) {
    // 只有 images.main，沒有 venueMainImageUrl
    result.notes.push('Phase 6: 缺少 venueMainImageUrl 欄位');
  } else {
    result.notes.push('Phase 6: 缺少照片欄位');
  }

  // Phase 7: 狀態判定
  const allPassed = result.phase1Pass && result.phase2Pass && result.phase3Pass &&
                    result.phase4Pass && result.phase5Pass && result.phase6Pass;
  if (allPassed) {
    result.status = '上架';
  } else if (result.phase1Pass && result.phase2Pass && result.phase3Pass) {
    // Phase 1-3 通過，但照片或一致性有問題
    result.status = '待修';
  } else {
    result.status = '待修';
  }

  return result;
}

// 驗證每個場地
const verificationResults = [];

batch4Task.forEach(task => {
  const venue = findVenueByKeyword(task.keyword);
  const result = verifyVenue(venue, task);
  
  // 輸出每個場地的驗證結果
  console.log('='.repeat(80));
  console.log(`ID: ${result.taskId} | ${result.name}`);
  console.log('='.repeat(80));
  console.log(`資料庫 ID: ${result.id || '未找到'}`);
  console.log(`venueListUrl: ${result.venueListUrl || 'N/A'}`);
  console.log(`venueMainImageUrl: ${result.venueMainImageUrl ? result.venueMainImageUrl.substring(0, 80) + '...' : 'N/A'}`);
  console.log(`roomsCount: ${result.roomsCount}`);
  console.log(`status: ${result.status}`);
  console.log('');
  console.log('備註:');
  if (result.notes.length > 0) {
    result.notes.forEach(note => console.log(`  - ${note}`));
  } else {
    console.log('  無');
  }
  console.log('');
  
  verificationResults.push(result);
});

// 輸出摘要
console.log('='.repeat(80));
console.log('批次 4 驗證摘要');
console.log('='.repeat(80));
console.log(`總場地數: ${verificationResults.length}`);
console.log(`上架: ${verificationResults.filter(r => r.status === '上架').length}`);
console.log(`待修: ${verificationResults.filter(r => r.status === '待修').length}`);
console.log('');

// 保存結果到檔案
fs.writeFileSync('./batch4-verify-results.json', JSON.stringify(verificationResults, null, 2));
console.log('結果已保存至 batch4-verify-results.json');
