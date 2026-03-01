const fs = require('fs');

const allVenues = JSON.parse(fs.readFileSync('venues-all-cities.json', 'utf8'));

// TICC 場地清理計劃
// 保留: 101A, 101AB, 101B, 101C, 101CD, 102, 大會堂全場, 大會堂半場
// 保留舊資料: 103會議室, 201會議室, 202會議室 (2樓會議室，官網資料沒有但可能存在)
// 移除: 大會堂 (已被大會堂全場取代), 101會議室 (已被 101 系列取代)

const idsToRemove = [1070]; // 移除舊的「大會堂」（用大會堂全場取代）
// 保留 1429 (101會議室) 因為可能是不同的小會議室

const cleanedVenues = allVenues.filter(v => !idsToRemove.includes(v.id));

// 寫入清理後的資料
fs.writeFileSync('venues-all-cities.json', JSON.stringify(cleanedVenues, null, 2));

// 統計
const ticcVenues = cleanedVenues.filter(v => v.name.includes('台北國際會議中心'));
console.log(`=== 清理完成 ===`);
console.log(`移除: ${idsToRemove.length} 筆重複資料`);
console.log(`總場地數: ${cleanedVenues.length}`);
console.log(`TICC 場地數: ${ticcVenues.length}`);
console.log(`\nTICC 場地列表:`);
ticcVenues.forEach(v => {
  const cap = v.maxCapacityTheater || 'N/A';
  const price = v.priceHalfDay || 'N/A';
  const photos = v.images?.gallery?.length || 0;
  console.log(`  [${v.id}] ${v.roomName} | ${cap}人 | $${price} | ${photos}張照片`);
});
