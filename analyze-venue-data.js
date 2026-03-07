#!/usr/bin/env node
/**
 * 場地資料分析工具
 * 用途：檢測資料問題、生成清理報告
 */

const fs = require('fs');
const path = require('path');

// 讀取資料
const dataPath = path.join(__dirname, 'venues-all-cities.json');
const venues = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

console.log(`\n📊 場地資料分析報告`);
console.log(`總場地數：${venues.length}`);
console.log(`=` .repeat(60));

// 問題統計
const issues = {
  missingPhone: [],
  missingPhotos: [],
  missingPrice: [],
  missingAddress: [],
  invalidPhotos: [],
  outdatedPhotos: [],
  duplicateNames: [],
  inconsistentStatus: [],
  missingCity: [],
  missingVenueType: []
};

// 照片網址檢查
const photoPatterns = {
  placeholder: [/placeholder/i, /example\.com/i, /待補充/i],
  invalid: [/^$/, /^http:\/\/localhost/i]
};

// 1. 檢查必填欄位
venues.forEach(venue => {
  // 缺電話
  if (!venue.contactPhone || venue.contactPhone.trim() === '') {
    issues.missingPhone.push({
      id: venue.id,
      name: venue.name,
      roomName: venue.roomName
    });
  }

  // 缺地址
  if (!venue.address || venue.address.trim() === '') {
    issues.missingAddress.push({
      id: venue.id,
      name: venue.name
    });
  }

  // 缺城市
  if (!venue.city || venue.city.trim() === '') {
    issues.missingCity.push({
      id: venue.id,
      name: venue.name
    });
  }

  // 缺場地類型
  if (!venue.venueType || venue.venueType.trim() === '') {
    issues.missingVenueType.push({
      id: venue.id,
      name: venue.name
    });
  }

  // 缺價格
  if (!venue.priceHalfDay && !venue.priceFullDay && !venue.pricePerHour) {
    issues.missingPrice.push({
      id: venue.id,
      name: venue.name,
      roomName: venue.roomName
    });
  }
});

// 2. 檢查照片問題
venues.forEach(venue => {
  const images = venue.images || {};
  const mainPhoto = images.main || '';
  const gallery = images.gallery || [];
  
  // 檢查主照片
  let hasValidPhoto = false;
  let hasPlaceholder = false;
  
  if (mainPhoto && mainPhoto.trim() !== '') {
    // 檢查是否為佔位符
    if (photoPatterns.placeholder.some(p => p.test(mainPhoto))) {
      hasPlaceholder = true;
    } else if (!photoPatterns.invalid.some(p => p.test(mainPhoto))) {
      hasValidPhoto = true;
    }
  }
  
  // 檢查 gallery
  gallery.forEach(url => {
    if (url && url.trim() !== '') {
      if (photoPatterns.placeholder.some(p => p.test(url))) {
        hasPlaceholder = true;
      } else if (!photoPatterns.invalid.some(p => p.test(url))) {
        hasValidPhoto = true;
      }
    }
  });
  
  // 標記問題
  if (!hasValidPhoto) {
    issues.missingPhotos.push({
      id: venue.id,
      name: venue.name,
      roomName: venue.roomName,
      hasPlaceholder
    });
  }
  
  // 標記過期照片
  if (images.needsUpdate || (images.note && images.note.includes('待補充'))) {
    issues.outdatedPhotos.push({
      id: venue.id,
      name: venue.name,
      roomName: venue.roomName,
      note: images.note
    });
  }
});

// 3. 檢查重複名稱
const nameMap = {};
venues.forEach(venue => {
  const key = `${venue.name}|${venue.roomName || ''}`;
  if (!nameMap[key]) {
    nameMap[key] = [];
  }
  nameMap[key].push(venue.id);
});

Object.entries(nameMap).forEach(([key, ids]) => {
  if (ids.length > 1) {
    const [name, roomName] = key.split('|');
    issues.duplicateNames.push({
      name,
      roomName: roomName || null,
      ids
    });
  }
});

// 4. 檢查狀態一致性
venues.forEach(venue => {
  if (venue.status === '上架') {
    // 上架但缺少重要資訊
    const problems = [];
    if (!venue.contactPhone) problems.push('缺電話');
    if (issues.missingPhotos.some(p => p.id === venue.id)) problems.push('缺照片');
    if (!venue.priceHalfDay && !venue.priceFullDay) problems.push('缺價格');
    
    if (problems.length > 0) {
      issues.inconsistentStatus.push({
        id: venue.id,
        name: venue.name,
        status: venue.status,
        problems
      });
    }
  }
});

// 生成報告
console.log(`\n📋 問題統計：`);
console.log(`- 缺電話：${issues.missingPhone.length} 筆`);
console.log(`- 缺照片：${issues.missingPhotos.length} 筆（含 ${issues.missingPhotos.filter(p => p.hasPlaceholder).length} 筆有佔位符）`);
console.log(`- 缺價格：${issues.missingPrice.length} 筆`);
console.log(`- 缺地址：${issues.missingAddress.length} 筆`);
console.log(`- 缺城市：${issues.missingCity.length} 筆`);
console.log(`- 缺類型：${issues.missingVenueType.length} 筆`);
console.log(`- 照片待更新：${issues.outdatedPhotos.length} 筆`);
console.log(`- 重複名稱：${issues.duplicateNames.length} 組`);
console.log(`- 狀態不一致：${issues.inconsistentStatus.length} 筆`);

// 儲存詳細報告
const report = {
  generatedAt: new Date().toISOString(),
  totalVenues: venues.length,
  summary: {
    missingPhone: issues.missingPhone.length,
    missingPhotos: issues.missingPhotos.length,
    missingPrice: issues.missingPrice.length,
    missingAddress: issues.missingAddress.length,
    missingCity: issues.missingCity.length,
    missingVenueType: issues.missingVenueType.length,
    outdatedPhotos: issues.outdatedPhotos.length,
    duplicateNames: issues.duplicateNames.length,
    inconsistentStatus: issues.inconsistentStatus.length
  },
  details: issues
};

const reportPath = path.join(__dirname, 'venue-data-analysis-report.json');
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

console.log(`\n✅ 詳細報告已儲存至：${reportPath}`);

// 顯示前幾筆問題範例
console.log(`\n📝 問題範例（前 5 筆）：`);

console.log(`\n缺電話：`);
issues.missingPhone.slice(0, 5).forEach(p => {
  console.log(`  - [${p.id}] ${p.name} - ${p.roomName || '無廳房'}`);
});

console.log(`\n缺照片：`);
issues.missingPhotos.slice(0, 5).forEach(p => {
  console.log(`  - [${p.id}] ${p.name} - ${p.roomName || '無廳房'} ${p.hasPlaceholder ? '(有佔位符)' : ''}`);
});

console.log(`\n狀態不一致（上架但缺資訊）：`);
issues.inconsistentStatus.slice(0, 5).forEach(p => {
  console.log(`  - [${p.id}] ${p.name}：${p.problems.join(', ')}`);
});

console.log(`\n`);
