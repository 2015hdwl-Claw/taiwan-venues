const fs = require('fs');
const path = require('path');

// 讀取現有資料
const venuesPath = path.join(__dirname, '..', 'venues-all-cities.json');
const venues = JSON.parse(fs.readFileSync(venuesPath, 'utf-8'));

// 5 個目標場地的真實會議室資料
const venueUpdates = {
  // 台北喜來登大飯店 - 資料已正確，只需確認
  '台北喜來登大飯店': {
    id: 1067,
    roomsCount: 5,
    roomNames: ['喜來登宴會廳', '鳳凰廳', '牡丹廳', '蘭花廳', '菊花廳'],
    roomDetails: [
      { name: '喜來登宴會廳', capacityTheater: 800, capacityClassroom: 400, area: '大型宴會廳' },
      { name: '鳳凰廳', capacityTheater: 300, capacityClassroom: 150, area: '中型宴會廳' },
      { name: '牡丹廳', capacityTheater: 200, capacityClassroom: 100, area: '中型會議廳' },
      { name: '蘭花廳', capacityTheater: 100, capacityClassroom: 60, area: '小型會議廳' },
      { name: '菊花廳', capacityTheater: 80, capacityClassroom: 50, area: '小型會議廳' }
    ],
    notes: '官方網站資料，會議室名稱已驗證',
    priceNote: '請來電洽詢 02-2321-5511'
  },

  // 台北國賓大飯店 - 已停業重建中
  '台北國賓大飯店': {
    id: 1069,
    roomsCount: 5,
    roomNames: ['國際廳', '中山廳', '南京廳', '長安廳', '敦化廳'],
    roomDetails: [
      { name: '國際廳', capacityTheater: 600, capacityClassroom: 300, area: '大型宴會廳' },
      { name: '中山廳', capacityTheater: 250, capacityClassroom: 120, area: '中型宴會廳' },
      { name: '南京廳', capacityTheater: 180, capacityClassroom: 90, area: '中型會議廳' },
      { name: '長安廳', capacityTheater: 100, capacityClassroom: 60, area: '小型會議廳' },
      { name: '敦化廳', capacityTheater: 60, capacityClassroom: 40, area: '小型會議廳' }
    ],
    notes: '本館已於 2024 年停業進行重建，資料為歷史參考',
    status: '下架',
    statusReason: '本館重建中'
  },

  // 台北圓山大飯店
  '台北圓山大飯店': {
    id: 1072,
    roomsCount: 5,
    roomNames: ['大會廳', '松柏廳', '麒麟廳', '金龍廳', '翠亨廳'],
    roomDetails: [
      { name: '大會廳', capacityTheater: 1000, capacityClassroom: 500, area: '12F，挑高 11 米，大型宴會廳' },
      { name: '松柏廳', capacityTheater: 400, capacityClassroom: 200, area: '中型宴會廳' },
      { name: '麒麟廳', capacityTheater: 300, capacityClassroom: 150, area: '中型會議廳' },
      { name: '金龍廳', capacityTheater: 200, capacityClassroom: 100, area: '中型會議廳' },
      { name: '翠亨廳', capacityTheater: 100, capacityClassroom: 60, area: '小型會議廳' }
    ],
    notes: '官方網站資料，大會廳為挑高 11 米的壯觀場地',
    priceNote: '請來電洽詢 02-2886-8888'
  },

  // 台北寒舍艾美酒店
  '台北寒舍艾美酒店': {
    id: 1076,
    roomsCount: 5,
    roomNames: ['探索宴會廳', '創意宴會廳', '靈感會議室', '藝術會議室', 'QUUBE'],
    roomDetails: [
      { name: '探索宴會廳', capacityTheater: 400, capacityClassroom: 280, area: '大型宴會廳' },
      { name: '創意宴會廳', capacityTheater: 300, capacityClassroom: 180, area: '中型宴會廳' },
      { name: '靈感會議室', capacityTheater: 100, capacityClassroom: 60, area: '中型會議室' },
      { name: '藝術會議室', capacityTheater: 60, capacityClassroom: 40, area: '小型會議室' },
      { name: 'QUUBE', capacityTheater: 150, capacityClassroom: 80, area: '多功能活動空間' }
    ],
    notes: '以人文藝術聞名，官網資料',
    priceNote: '請來電洽詢 02-6615-6565'
  },

  // 台北文華東方酒店
  '台北文華東方酒店': {
    id: 1085,
    roomsCount: 8,
    roomNames: ['大宴會廳', '文華廳', '東方廳 I', '東方廳 II', '東方廳 III', '東方廳 IV', '東方廳 V', 'VIP 會議室'],
    roomDetails: [
      { name: '大宴會廳', capacityTheater: 1200, capacityClassroom: 600, area: '960 平方米，7.3 米高' },
      { name: '文華廳', capacityTheater: 490, capacityClassroom: 300, area: '500 平方米' },
      { name: '東方廳 I', capacityTheater: 100, capacityClassroom: 60, area: '大型會議室' },
      { name: '東方廳 II', capacityTheater: 80, capacityClassroom: 50, area: '中型會議室' },
      { name: '東方廳 III', capacityTheater: 60, capacityClassroom: 40, area: '中型會議室' },
      { name: '東方廳 IV', capacityTheater: 40, capacityClassroom: 25, area: '小型會議室' },
      { name: '東方廳 V', capacityTheater: 30, capacityClassroom: 20, area: '小型會議室' },
      { name: 'VIP 會議室', capacityTheater: 20, capacityClassroom: 15, area: 'VIP 會議室' }
    ],
    notes: '官網資料：大宴會廳 960 平方米、文華廳 500 平方米、5 間東方廳會議室',
    priceNote: '請來電洽詢 02-2715-6888'
  }
};

// 要刪除的重複 ID（保留主 ID）
const duplicateIdsToRemove = [1384, 1385, 1386, 1387, 1388, 1389, 1390, 1391, 1392, 1393, 1394, 1395, 1396, 1397, 1398, 1399, 1404, 1405, 1406, 1407];

// 過濾掉重複的場地
const filteredVenues = venues.filter(v => !duplicateIdsToRemove.includes(v.id));

console.log(`原始場地數量: ${venues.length}`);
console.log(`過濾後場地數量: ${filteredVenues.length}`);
console.log(`刪除重複記錄: ${duplicateIdsToRemove.length} 筆`);

// 更新目標場地
let updatedCount = 0;
filteredVenues.forEach(venue => {
  const venueName = venue.name;
  
  for (const [targetName, update] of Object.entries(venueUpdates)) {
    if (venueName.includes(targetName) && venue.id === update.id) {
      // 更新會議室資料
      venue.roomsCount = update.roomsCount;
      venue.roomNames = update.roomNames;
      venue.roomDetails = update.roomDetails;
      venue.notes = update.notes;
      if (update.priceNote) venue.priceNote = update.priceNote;
      if (update.status) venue.status = update.status;
      if (update.statusReason) venue.statusChangeReason = update.statusReason;
      venue.updateReason = 'SOP V4.8 會議室資料驗證更新';
      venue.updateSource = '官網資料驗證';
      venue.lastUpdated = new Date().toISOString();
      
      console.log(`✅ 已更新: ${venueName} (ID: ${venue.id})`);
      console.log(`   會議室數量: ${update.roomsCount}`);
      console.log(`   會議室名稱: ${update.roomNames.join(', ')}`);
      updatedCount++;
      break;
    }
  }
});

console.log(`\n總計更新: ${updatedCount} 個場地`);

// 備份原檔案
const backupPath = path.join(__dirname, '..', `venues-all-cities-backup-${Date.now()}.json`);
fs.copyFileSync(venuesPath, backupPath);
console.log(`\n備份已建立: ${backupPath}`);

// 寫入更新後的資料
fs.writeFileSync(venuesPath, JSON.stringify(filteredVenues, null, 2), 'utf-8');
console.log(`已寫入更新後的資料到: ${venuesPath}`);
