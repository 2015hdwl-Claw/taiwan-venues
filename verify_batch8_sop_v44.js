const fs = require('fs');

// Load venue data
const venues = JSON.parse(fs.readFileSync('/tmp/batch8_venues.json', 'utf8'));

// SOP V4.4 Verification Function
function verifyVenueSOPV44(venue) {
  const result = {
    id: venue.id,
    name: venue.name,
    venueListUrl: venue.venueListUrl || venue.meetingPageUrl || null,
    venueMainImageUrl: venue.venueMainImageUrl || (venue.images && venue.images.main) || null,
    roomsCount: venue.rooms ? venue.rooms.length : (venue.roomName ? 1 : 0),
    status: '待修',
    notes: [],
    phases: {
      phase1: { pass: false, error: null, url: null },
      phase2: { pass: false, error: null, url: null },
      phase3: { pass: false, error: null, roomsCount: 0 },
      phase4: { pass: false, error: null, imageUrl: null, source: null },
      phase5: { pass: false, error: null, brand: null },
      phase6: { pass: false, error: null, consistent: false },
      phase7: { pass: false, error: null, status: null }
    }
  };

  // Phase 1: 官網驗證
  if (venue.url && venue.url.length > 0) {
    result.phases.phase1.pass = true;
    result.phases.phase1.url = venue.url;
  } else {
    result.phases.phase1.error = '缺少官網 URL';
    result.notes.push('Phase 1: 缺少官網 URL');
  }

  // Phase 2: 會議室頁面尋找
  if (venue.venueListUrl || venue.meetingPageUrl) {
    result.phases.phase2.pass = true;
    result.phases.phase2.url = venue.venueListUrl || venue.meetingPageUrl;
    result.venueListUrl = venue.venueListUrl || venue.meetingPageUrl;
  } else {
    result.phases.phase2.error = '缺少會議室頁面 URL';
    result.notes.push('Phase 2: 缺少 venueListUrl');
  }

  // Phase 3: 會議室完整清單
  if (venue.rooms && Array.isArray(venue.rooms) && venue.rooms.length > 0) {
    result.phases.phase3.pass = true;
    result.phases.phase3.roomsCount = venue.rooms.length;
    result.roomsCount = venue.rooms.length;
  } else if (venue.roomName) {
    // Only one room recorded, not complete list
    result.phases.phase3.error = '會議室清單不完整（僅記錄一個會議室）';
    result.phases.phase3.roomsCount = 1;
    result.roomsCount = 1;
    result.notes.push('Phase 3: 會議室清單不完整（僅記錄一個會議室）');
  } else {
    result.phases.phase3.error = '會議室清單缺失';
    result.notes.push('Phase 3: 會議室清單缺失');
  }

  // Phase 4: 照片抓取（場地外觀，禁止第三方來源）
  const mainImageUrl = venue.venueMainImageUrl || (venue.images && venue.images.main);
  
  if (mainImageUrl && mainImageUrl.length > 0) {
    // Check if it's from a third-party source
    const isWikipedia = mainImageUrl.includes('wikipedia') || mainImageUrl.includes('wikimedia');
    const isUnsplash = mainImageUrl.includes('unsplash');
    const isThirdParty = isWikipedia || isUnsplash;
    
    if (isThirdParty) {
      result.phases.phase4.error = `照片來源為第三方（${isWikipedia ? 'Wikipedia' : 'Unsplash'}），應使用官方來源`;
      result.phases.phase4.imageUrl = mainImageUrl;
      result.phases.phase4.source = isWikipedia ? 'Wikipedia' : 'Unsplash';
      result.notes.push(`Phase 4: 照片來源為第三方（${isWikipedia ? 'Wikipedia' : 'Unsplash'}）`);
    } else {
      // Check if source is official
      const imageSource = venue.images && venue.images.source;
      const isOfficial = !imageSource || 
                        imageSource.includes('eclathotels') ||
                        imageSource.includes('citizenm') ||
                        imageSource.includes('mandarinoriental') ||
                        imageSource.includes('regenthotels');
      
      if (isOfficial) {
        result.phases.phase4.pass = true;
        result.phases.phase4.imageUrl = mainImageUrl;
        result.phases.phase4.source = imageSource || '官方網站';
        result.venueMainImageUrl = mainImageUrl;
      } else {
        result.phases.phase4.error = '照片來源不明確，需確認是否為官方來源';
        result.phases.phase4.imageUrl = mainImageUrl;
        result.phases.phase4.source = imageSource;
        result.notes.push('Phase 4: 照片來源不明確');
      }
    }
  } else {
    result.phases.phase4.error = '缺少場地主照片';
    result.notes.push('Phase 4: 缺少場地主照片');
  }

  // Phase 5: 品牌/機構場地檢查
  const brandKeywords = {
    '怡亨': '怡亨酒店品牌',
    '意舍': 'CitizenM品牌',
    '文華東方': 'Mandarin Oriental品牌',
    '晶華': 'Regent品牌'
  };
  
  const matchedBrand = Object.keys(brandKeywords).find(kw => venue.name.includes(kw));
  if (matchedBrand) {
    result.phases.phase5.pass = true;
    result.phases.phase5.brand = brandKeywords[matchedBrand];
    // Note: We should check if all venues of this brand are recorded
    // For now, we just mark it as needing verification
    result.notes.push(`Phase 5: ${brandKeywords[matchedBrand]}場地需確認完整性`);
  } else {
    result.phases.phase5.pass = true;
  }

  // Phase 6: 資料一致性檢查
  if (venue.venueMainImageUrl && venue.images && venue.images.main) {
    if (venue.venueMainImageUrl === venue.images.main) {
      result.phases.phase6.pass = true;
      result.phases.phase6.consistent = true;
    } else {
      result.phases.phase6.error = 'venueMainImageUrl 和 images.main 不一致';
      result.phases.phase6.consistent = false;
      result.notes.push('Phase 6: venueMainImageUrl 和 images.main 不一致');
    }
  } else if (venue.images && venue.images.main && !venue.venueMainImageUrl) {
    result.phases.phase6.error = '缺少 venueMainImageUrl（但有 images.main）';
    result.notes.push('Phase 6: 缺少 venueMainImageUrl（但有 images.main）');
  } else if (!venue.venueMainImageUrl && !(venue.images && venue.images.main)) {
    result.phases.phase6.error = '缺少 venueMainImageUrl 和 images.main';
    result.notes.push('Phase 6: 缺少 venueMainImageUrl 和 images.main');
  } else {
    result.phases.phase6.pass = true;
  }

  // Phase 7: 狀態判定
  const criticalPhases = [result.phases.phase1, result.phases.phase2, result.phases.phase3, result.phases.phase4, result.phases.phase6];
  const allPassed = criticalPhases.every(p => p.pass);
  const somePassed = criticalPhases.filter(p => p.pass).length >= 2;
  
  if (allPassed) {
    result.status = '上架';
    result.phases.phase7.pass = true;
    result.phases.phase7.status = '上架';
  } else if (somePassed) {
    result.status = '待修';
    result.phases.phase7.error = '資料不完整，需修正';
    result.phases.phase7.status = '待修';
  } else {
    result.status = '待修';
    result.phases.phase7.error = '資料嚴重缺失';
    result.phases.phase7.status = '待修';
  }

  return result;
}

// Verify all venues
const verificationResults = venues.map(venue => verifyVenueSOPV44(venue));

// Output results
console.log(JSON.stringify(verificationResults, null, 2));

// Save to file
fs.writeFileSync('/tmp/batch8_verification_results.json', JSON.stringify(verificationResults, null, 2));
console.log('\n\nResults saved to /tmp/batch8_verification_results.json');
