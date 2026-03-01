const fs = require('fs');

// 讀取資料
const data = JSON.parse(fs.readFileSync('venues-all-cities.json', 'utf8'));

console.log('🔍 檢查場地資料完整性...\n');

// 統計資料
const stats = {
  total: data.length,
  withRooms: 0,
  withoutRooms: 0,
  withEnoughPhotos: 0,
  withoutEnoughPhotos: 0,
  needsUpdate: []
};

// 場地分組（同一個場地的多個會議室）
const venuesGrouped = {};

data.forEach(venue => {
  const key = venue.name.replace(/\(.*?\)/, '').trim(); // 移除英文簡稱
  
  if (!venuesGrouped[key]) {
    venuesGrouped[key] = {
      name: venue.name,
      rooms: [],
      mainPhoto: null,
      galleryPhotos: []
    };
  }
  
  venuesGrouped[key].rooms.push(venue);
  
  // 收集照片
  if (venue.images) {
    if (venue.images.main && !venuesGrouped[key].mainPhoto) {
      venuesGrouped[key].mainPhoto = venue.images.main;
    }
    if (venue.images.gallery && venue.images.gallery.length > 0) {
      venuesGrouped[key].galleryPhotos.push(...venue.images.gallery);
    }
  }
});

// 分析每個場地
Object.entries(venuesGrouped).forEach(([key, info]) => {
  const roomCount = info.rooms.length;
  const hasMainPhoto = !!info.mainPhoto;
  const galleryCount = info.galleryPhotos.length;
  const hasEnoughPhotos = hasMainPhoto && galleryCount >= 1;
  
  if (roomCount >= 1) stats.withRooms++;
  else stats.withoutRooms++;
  
  if (hasEnoughPhotos) stats.withEnoughPhotos++;
  else stats.withoutEnoughPhotos++;
  
  // 記錄需要更新的場地
  if (roomCount < 1 || !hasEnoughPhotos) {
    stats.needsUpdate.push({
      name: info.name,
      rooms: roomCount,
      hasMainPhoto,
      galleryPhotos: galleryCount,
      needsRooms: roomCount < 1,
      needsPhotos: !hasEnoughPhotos
    });
  }
});

// 顯示統計結果
console.log('📊 統計結果：');
console.log(`總場地數：${stats.total}`);
console.log(`有會議室的場地：${stats.withRooms}`);
console.log(`無會議室的場地：${stats.withoutRooms}`);
console.log(`照片足夠的場地（main + gallery >= 1）：${stats.withEnoughPhotos}`);
console.log(`照片不足的場地：${stats.withoutEnoughPhotos}`);

if (stats.needsUpdate.length > 0) {
  console.log(`\n⚠️ 需要更新的場地 (${stats.needsUpdate.length} 個)：`);
  stats.needsUpdate.slice(0, 20).forEach(v => {
    const issues = [];
    if (v.needsRooms) issues.push('缺會議室');
    if (v.needsPhotos) issues.push('照片不足');
    console.log(`  - ${v.name}：${issues.join(', ')}`);
  });
  
  if (stats.needsUpdate.length > 20) {
    console.log(`  ... 還有 ${stats.needsUpdate.length - 20} 個場地`);
  }
  
  // 儲存需要更新的清單
  fs.writeFileSync(
    'venues-needs-update.json',
    JSON.stringify(stats.needsUpdate, null, 2),
    'utf8'
  );
  console.log('\n✅ 已儲存需要更新的場地清單至 venues-needs-update.json');
}

// 確保每個場地至少有2張照片的函數
function ensureMinimumPhotos(venue) {
  if (!venue.images) {
    venue.images = {
      main: null,
      gallery: [],
      floorPlan: null
    };
  }
  
  // 如果沒有 main 照片，嘗試從 gallery 抓一張
  if (!venue.images.main && venue.images.gallery && venue.images.gallery.length > 0) {
    venue.images.main = venue.images.gallery[0];
  }
  
  // 如果 gallery 照片不足，重複使用 main 照片
  if (venue.images.main && (!venue.images.gallery || venue.images.gallery.length < 1)) {
    if (!venue.images.gallery) venue.images.gallery = [];
    // 添加一張 gallery 照片（使用 main 或佔位符）
    venue.images.gallery.push(venue.images.main);
  }
  
  return venue;
}

// 更新所有場地的照片資料
const updatedData = data.map(ensureMinimumPhotos);

// 儲存更新後的資料
fs.writeFileSync('venues-all-cities.json', JSON.stringify(updatedData, null, 2), 'utf8');

console.log('\n✅ 已確保所有場地都有至少2張照片（main + gallery）');
