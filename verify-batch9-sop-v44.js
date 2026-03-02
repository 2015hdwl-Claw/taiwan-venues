const fs = require('fs');

// 讀取資料
const allVenues = JSON.parse(fs.readFileSync('./taipei-v44-batches.json', 'utf8'));
const venues = Array.isArray(allVenues) ? allVenues.flat() : [];

// 批次 9 任務指定的場地
const batch9Task = [
  { taskId: 1088, name: '台北松意酒店' },
  { taskId: 1089, name: '台北洛碁大飯店' },
  { taskId: 1090, name: '台北王朝大酒店' },
  { taskId: 1091, name: '台北神旺大飯店' },
  { taskId: 1093, name: '台北第一酒店' }
];

// 根據場地名稱或 ID 找出資料庫中的場地
function findVenuesByIdOrName(taskId, name) {
  // 先用 ID 找
  let found = venues.find(v => v.id === taskId);
  if (found) return found;

  // 再用名稱找
  found = venues.find(v => v.name === name || v.name.includes(name));
  if (found) return found;

  return null;
}

// SOP V4.4 驗證標準
function verifyVenue(venue, taskId) {
  const result = {
    taskId,
    name: venue.name,
    id: venue.id,
    venueListUrl: venue.venueListUrl || venue.meetingPageUrl || null,
    venueMainImageUrl: venue.venueMainImageUrl || venue.images?.main || null,
    roomsCount: venue.rooms ? venue.rooms.length : 0,
    status: '待修',
    notes: [],
    phases: {}
  };

  // Phase 1: 官網驗證
  result.phases.phase1 = { pass: false, error: null };
  if (venue.url && venue.url.length > 0) {
    // 檢查官網是否可以連線（檢查 verificationError）
    if (venue.verificationError && venue.verificationError.includes('ERR_NAME_NOT_RESOLVED')) {
      result.phases.phase1.error = `官網無法連線: ${venue.url}`;
      result.notes.push('Phase 1: 官網無法連線');
    } else {
      result.phases.phase1.pass = true;
      result.phases.phase1.url = venue.url;
    }
  } else {
    result.phases.phase1.error = '缺少官網 URL';
    result.notes.push('Phase 1: 缺少官網 URL');
  }

  // Phase 2: 會議室頁面尋找
  result.phases.phase2 = { pass: false, error: null };
  if (venue.venueListUrl || venue.meetingPageUrl) {
    result.phases.phase2.pass = true;
    result.phases.phase2.venueListUrl = venue.venueListUrl || venue.meetingPageUrl;
  } else {
    result.phases.phase2.error = '缺少會議室頁面 URL';
    result.notes.push('Phase 2: 缺少會議室頁面 URL');
  }

  // Phase 3: 會議室完整清單
  result.phases.phase3 = { pass: false, error: null };
  if (venue.rooms && Array.isArray(venue.rooms) && venue.rooms.length > 0) {
    result.phases.phase3.pass = true;
    result.phases.phase3.roomsCount = venue.rooms.length;
    result.roomsCount = venue.rooms.length;
  } else {
    // 檢查是否有 roomName（單一會議室）
    if (venue.roomName && venue.roomName.length > 0) {
      result.phases.phase3.pass = true;
      result.phases.phase3.roomsCount = 1;
      result.roomsCount = 1;
      result.phases.phase3.note = `單一會議室: ${venue.roomName}`;
    } else {
      result.phases.phase3.error = '會議室清單不完整或缺失';
      result.notes.push('Phase 3: 會議室清單不完整或缺失');
    }
  }

  // Phase 4: 照片抓取（場地外觀，禁止第三方來源）
  result.phases.phase4 = { pass: false, error: null };
  const imageUrl = venue.venueMainImageUrl || venue.images?.main;
  if (imageUrl && imageUrl.length > 0) {
    // 檢查是否為第三方來源（Wikipedia, Unsplash 等）
    const isThirdParty = imageUrl.includes('wikipedia') ||
                          imageUrl.includes('unsplash') ||
                          imageUrl.includes('wikimedia');
    if (isThirdParty) {
      result.phases.phase4.error = '照片來源為第三方（Wikipedia/Unsplash），應使用官方來源';
      result.notes.push('Phase 4: 照片來源為第三方');
    } else {
      // 檢查是否為空字串或無效 URL
      if (imageUrl === '' || imageUrl === null) {
        result.phases.phase4.error = '場地主照片為空';
        result.notes.push('Phase 4: 場地主照片為空');
      } else {
        result.phases.phase4.pass = true;
        result.phases.phase4.imageUrl = imageUrl;
        result.venueMainImageUrl = imageUrl;
      }
    }
  } else {
    result.phases.phase4.error = '缺少場地主照片';
    result.notes.push('Phase 4: 缺少場地主照片');
  }

  // Phase 5: 品牌/機構場地檢查
  result.phases.phase5 = { pass: false, error: null };
  const brandKeywords = ['神旺', '王朝', '第一', '洛碁', '松意'];
  const hasBrand = brandKeywords.some(kw => venue.name.includes(kw));
  if (hasBrand) {
    result.phases.phase5.pass = true;
    result.phases.phase5.note = '品牌場地';
  } else {
    result.phases.phase5.pass = true;
    result.phases.phase5.note = '非品牌場地';
  }

  // Phase 6: 資料一致性檢查
  result.phases.phase6 = { pass: false, error: null };
  if (venue.venueMainImageUrl && venue.images && venue.images.main) {
    if (venue.venueMainImageUrl === venue.images.main) {
      result.phases.phase6.pass = true;
    } else {
      result.phases.phase6.error = `venueMainImageUrl 和 images.main 不一致`;
      result.phases.phase6.details = {
        venueMainImageUrl: venue.venueMainImageUrl,
        imagesMain: venue.images.main
      };
      result.notes.push('Phase 6: venueMainImageUrl 和 images.main 不一致');
    }
  } else if (!venue.venueMainImageUrl && !venue.images?.main) {
    // 兩者都沒有，記錄但不算錯誤（Phase 4 已處理）
    result.phases.phase6.pass = true;
    result.phases.phase6.note = '兩者都缺失（已在 Phase 4 標記）';
  } else {
    result.phases.phase6.pass = true;
    result.phases.phase6.note = '僅有其中一個';
  }

  // Phase 7: 狀態判定
  result.phases.phase7 = { pass: false, error: null };
  const allPassed = result.phases.phase1.pass &&
                    result.phases.phase2.pass &&
                    result.phases.phase3.pass &&
                    result.phases.phase4.pass &&
                    result.phases.phase5.pass &&
                    result.phases.phase6.pass;

  if (allPassed) {
    result.status = '上架';
    result.phases.phase7.pass = true;
  } else if (result.phases.phase1.pass && result.phases.phase2.pass) {
    result.status = '待修';
    result.phases.phase7.error = '資料不完整，需修正';
  } else {
    result.status = '待修';
    result.phases.phase7.error = '資料嚴重缺失';
  }

  return result;
}

// 驗證每個場地
const verificationResults = [];

batch9Task.forEach(task => {
  const venue = findVenuesByIdOrName(task.taskId, task.name);
  if (!venue) {
    verificationResults.push({
      taskId: task.taskId,
      name: task.name,
      id: null,
      venueListUrl: null,
      venueMainImageUrl: null,
      roomsCount: 0,
      status: '待修',
      notes: [`資料庫中未找到場地「${task.name}」`],
      phases: {
        phase1: { pass: false, error: '場地不存在' },
        phase2: { pass: false, error: '場地不存在' },
        phase3: { pass: false, error: '場地不存在' },
        phase4: { pass: false, error: '場地不存在' },
        phase5: { pass: false, error: '場地不存在' },
        phase6: { pass: false, error: '場地不存在' },
        phase7: { pass: false, error: '場地不存在' }
      }
    });
  } else {
    verificationResults.push(verifyVenue(venue, task.taskId));
  }
});

// 輸出結果
const outputPath = `batch9-verify-results-${new Date().toISOString().replace(/:/g, '-')}.json`;
fs.writeFileSync(outputPath, JSON.stringify(verificationResults, null, 2));
console.log(JSON.stringify(verificationResults, null, 2));
console.log(`\n結果已儲存至: ${outputPath}`);
