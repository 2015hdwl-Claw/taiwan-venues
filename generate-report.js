const fs = require('fs');

// 讀取資料
const data = JSON.parse(fs.readFileSync('venues-all-cities.json', 'utf8'));

console.log('📊 場地資料庫完整報告\n');
console.log('=' .repeat(60));

// 基本統計
const stats = {
  total: data.length,
  withEnglishAbbr: data.filter(v => /\([A-Za-z]{2,}\)/.test(v.name)).length,
  withoutEnglishAbbr: data.filter(v => !/\([A-Za-z]{2,}\)/.test(v.name)).length,
  withRooms: 0,
  withoutRooms: 0,
  withMainPhoto: data.filter(v => v.images && v.images.main).length,
  withoutMainPhoto: data.filter(v => !v.images || !v.images.main).length,
  withGallery: data.filter(v => v.images && v.images.gallery && v.images.gallery.length > 0).length,
  withoutGallery: data.filter(v => !v.images || !v.images.gallery || v.images.gallery.length === 0).length,
  withEnoughPhotos: data.filter(v => v.images && v.images.main && v.images.gallery && v.images.gallery.length >= 1).length
};

// 場地分組統計
const venueGroups = {};
data.forEach(venue => {
  const baseName = venue.name.replace(/\(.*?\)/, '').trim();
  if (!venueGroups[baseName]) {
    venueGroups[baseName] = {
      name: venue.name,
      rooms: []
    };
  }
  venueGroups[baseName].rooms.push(venue);
});

stats.venuesWithMultipleRooms = Object.values(venueGroups).filter(g => g.rooms.length > 1).length;
stats.venuesWithSingleRoom = Object.values(venueGroups).filter(g => g.rooms.length === 1).length;

// 依城市統計
const cities = {};
data.forEach(venue => {
  const city = venue.city || '未知';
  if (!cities[city]) cities[city] = 0;
  cities[city]++;
});

// 依類型統計
const types = {};
data.forEach(venue => {
  const type = venue.venueType || '未分類';
  if (!types[type]) types[type] = 0;
  types[type]++;
});

// 顯示報告
console.log('\n📈 基本統計：');
console.log(`  總場地數：${stats.total}`);
console.log(`  獨立場地數（不重複）：${Object.keys(venueGroups).length}`);

console.log('\n🏷️ 場地名稱格式：');
console.log(`  ✅ 有英文簡稱：${stats.withEnglishAbbr} (${(stats.withEnglishAbbr/stats.total*100).toFixed(1)}%)`);
console.log(`  ❌ 無英文簡稱：${stats.withoutEnglishAbbr}`);

console.log('\n🏛️ 會議室統計：');
console.log(`  有多個會議室的場地：${stats.venuesWithMultipleRooms}`);
console.log(`  單一會議室的場地：${stats.venuesWithSingleRoom}`);

console.log('\n📷 照片統計：');
console.log(`  ✅ 有主照片：${stats.withMainPhoto} (${(stats.withMainPhoto/stats.total*100).toFixed(1)}%)`);
console.log(`  ✅ 有相簿照片：${stats.withGallery} (${(stats.withGallery/stats.total*100).toFixed(1)}%)`);
console.log(`  ✅ 照片完整（main + gallery >= 1）：${stats.withEnoughPhotos} (${(stats.withEnoughPhotos/stats.total*100).toFixed(1)}%)`);

console.log('\n📍 依城市分佈（前10）：');
Object.entries(cities)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 10)
  .forEach(([city, count]) => {
    console.log(`  ${city}：${count}`);
  });

console.log('\n🏷️ 依類型分佈（前10）：');
Object.entries(types)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 10)
  .forEach(([type, count]) => {
    console.log(`  ${type}：${count}`);
  });

// 檢查需要改進的場地
console.log('\n⚠️ 需要改進的項目：');

const noEnglishAbbr = data.filter(v => !/\([A-Za-z]{2,}\)/.test(v.name));
if (noEnglishAbbr.length > 0) {
  console.log(`\n  1. 缺少英文簡稱的場地 (${noEnglishAbbr.length} 個)：`);
  noEnglishAbbr.slice(0, 10).forEach(v => console.log(`    - ${v.name}`));
  if (noEnglishAbbr.length > 10) {
    console.log(`    ... 還有 ${noEnglishAbbr.length - 10} 個`);
  }
}

const noEnoughPhotos = data.filter(v => !v.images || !v.images.main || !v.images.gallery || v.images.gallery.length < 1);
if (noEnoughPhotos.length > 0) {
  console.log(`\n  2. 照片不足的場地 (${noEnoughPhotos.length} 個)：`);
  noEnoughPhotos.slice(0, 10).forEach(v => console.log(`    - ${v.name}`));
  if (noEnoughPhotos.length > 10) {
    console.log(`    ... 還有 ${noEnoughPhotos.length - 10} 個`);
  }
}

// 顯示範例場地
console.log('\n✅ 完整資料的場地範例：');
const goodExamples = data
  .filter(v => v.images && v.images.main && v.images.gallery && v.images.gallery.length >= 1 && /\([A-Za-z]{2,}\)/.test(v.name))
  .slice(0, 5);

goodExamples.forEach(v => {
  console.log(`\n  📍 ${v.name}`);
  console.log(`     會議室：${v.roomName || '-'}`);
  console.log(`     主照片：${v.images.main ? '✅' : '❌'}`);
  console.log(`     相簿照片：${v.images.gallery ? v.images.gallery.length : 0} 張`);
});

console.log('\n' + '='.repeat(60));
console.log('\n✅ 報告完成！');

// 儲存報告
const report = {
  generatedAt: new Date().toISOString(),
  stats,
  cities,
  types,
  needsImprovement: {
    noEnglishAbbr: noEnglishAbbr.length,
    noEnoughPhotos: noEnoughPhotos.length
  }
};

fs.writeFileSync('data-quality-report.json', JSON.stringify(report, null, 2), 'utf8');
console.log('\n💾 報告已儲存至 data-quality-report.json');
