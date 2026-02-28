const fs = require('fs');

console.log('🔄 整合 TICC 會議室資料...\n');

// 讀取 TICC 完整資料
const ticcData = JSON.parse(fs.readFileSync('ticc-complete-data-updated.json', 'utf8'));

// 讀取現有資料
const venues = JSON.parse(fs.readFileSync('sample-data.json', 'utf8'));

console.log('📊 TICC 會議室數:', ticcData.rooms.length);
console.log('📊 現有場地數:', venues.length);

// 刪除舊的 TICC 場地
const oldTiccCount = venues.filter(v => v.name.includes('台北國際會議中心')).length;
const filteredVenues = venues.filter(v => !v.name.includes('台北國際會議中心'));

console.log('📊 刪除舊 TICC 場地:', oldTiccCount);

// 轉換 TICC 會議室為 sample-data 格式
const ticcVenues = ticcData.rooms.map((room, index) => {
  // 計算價格
  let priceDisplay = '請查詢官網';
  if (room.pricing.weekday) {
    priceDisplay = `平日 ${room.pricing.weekday.toLocaleString()} 元/時段`;
    if (room.pricing.weekend) {
      priceDisplay += ` | 假日 ${room.pricing.weekend.toLocaleString()} 元/時段`;
    }
  }

  // 計算容納人數
  let capacity = room.capacity.theater || room.capacity.classroom || 0;
  let capacityCategory = 'unknown';
  if (capacity <= 50) capacityCategory = 'small';
  else if (capacity <= 150) capacityCategory = 'medium';
  else if (capacity <= 500) capacityCategory = 'large';
  else capacityCategory = 'extra-large';

  // 主要照片
  const mainPhoto = room.photos.length > 0 ? room.photos[0] : 
    'https://www.ticc.com.tw/wSite/xslgip/style1/images/ticc/img-hero.jpg';

  return {
    id: filteredVenues.length + index + 1,
    name: '台北國際會議中心',
    venueType: '會議場地',
    roomName: room.roomName,
    type: '會議室',
    city: '台北市',
    address: ticcData.address,
    contactPerson: '場地租借部',
    contactPhone: ticcData.contact.phone,
    contactEmail: ticcData.contact.email,
    pricePerHour: null,
    priceHalfDay: room.pricing.weekday || null,
    priceFullDay: room.pricing.weekend || null,
    maxCapacityEmpty: capacity,
    maxCapacityTheater: room.capacity.theater || null,
    maxCapacityClassroom: room.capacity.classroom || null,
    availableTimeWeekday: ticcData.rentalRules.timeSlots.join(', '),
    availableTimeWeekend: ticcData.rentalRules.timeSlots.join(', '),
    equipment: room.equipment.join(', '),
    images: {
      main: mainPhoto,
      gallery: room.photos.length > 1 ? room.photos.slice(1) : [],
      floorPlan: null
    },
    layoutImageUrl: null,
    rentalTimeNote: room.pricing.notes || '每時段價格',
    notes: room.description || '',
    capacityCategory: capacityCategory,
    createdAt: new Date().toISOString(),
    url: room.source || ticcData.venueUrl,
    transportation: {
      mrt: ticcData.transportation.mrt,
      bus: [{
        stop: ticcData.transportation.bus,
        routes: [],
        walkingMinutes: 2
      }],
      parking: {
        name: ticcData.transportation.parking,
        spaces: null,
        hourlyRate: null,
        dailyMax: null,
        notes: '付費停車'
      }
    },
    dimensions: room.area.dimensions ? {
      area: room.area.ping,
      unit: '坪',
      length: parseFloat(room.area.dimensions.split('×')[0]),
      width: parseFloat(room.area.dimensions.split('×')[1]),
      height: parseFloat(room.area.dimensions.split('×')[2].replace('公尺', ''))
    } : null,
    seatingArrangements: {
      theater: {
        capacity: room.capacity.theater || 0,
        description: '劇院型'
      },
      classroom: {
        capacity: room.capacity.classroom || 0,
        description: '會議型（課桌式）'
      },
      horseshoe: {
        capacity: room.capacity.horseshoe || 0,
        description: '馬蹄型（U型）'
      }
    },
    priceDisplay: priceDisplay,
    verified: true,
    verifiedAt: new Date().toISOString(),
    ticcRoomId: room.roomId
  };
});

// 合併場地
const allVenues = [...filteredVenues, ...ticcVenues];

// 重新編號
allVenues.forEach((venue, index) => {
  venue.id = index + 1;
});

// 保存
fs.writeFileSync('sample-data.json', JSON.stringify(allVenues, null, 2));

console.log('\n📊 整合結果:');
console.log(`✅ 新增 TICC 會議室: ${ticcVenues.length} 個`);
console.log(`📁 總場地數: ${allVenues.length} 個`);

// 顯示 TICC 會議室照片狀態
console.log('\n📸 TICC 會議室照片狀態:');
ticcVenues.forEach((venue, i) => {
  console.log(`${i + 1}. ${venue.roomName}`);
  console.log(`   主圖片: ${venue.images.main ? '✅' : '❌'}`);
  console.log(`   畫廊數量: ${venue.images.gallery.length}`);
});

console.log('\n✅ 已更新 sample-data.json');
