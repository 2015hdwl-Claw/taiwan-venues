const fs = require('fs');

// 讀取資料
const data = JSON.parse(fs.readFileSync('venues-all-cities.json', 'utf8'));

console.log('🔧 修正重複的英文簡稱...\n');

let fixedCount = 0;

const cleanedData = data.map(venue => {
  let name = venue.name;
  const originalName = name;

  // 移除重複的英文簡稱（如 "(Formosan)(Formosan)" -> "(Formosan)"）
  name = name.replace(/\(([A-Za-z]+)\)\(\1\)/g, '($1)');

  // 移除重複的完整模式（如 "Formosan)(Formosan)" -> "Formosan)"）
  name = name.replace(/([A-Za-z]+)\)\(\1\)/g, '$1)');

  // 移除結尾的重複
  name = name.replace(/\(([A-Za-z]+)\)\1\b/g, '($1)');

  if (name !== originalName) {
    console.log(`修正: "${originalName}" -> "${name}"`);
    fixedCount++;
  }

  venue.name = name;
  return venue;
});

// 儲存
fs.writeFileSync('venues-all-cities.json', JSON.stringify(cleanedData, null, 2), 'utf8');

console.log(`\n✅ 修正了 ${fixedCount} 個重複的場地名稱`);

// 顯示剩餘的問題
const stillHasDuplicates = cleanedData.filter(v => /\([A-Za-z]+\)\([A-Za-z]+\)/.test(v.name));
if (stillHasDuplicates.length > 0) {
  console.log(`\n⚠️ 仍有 ${stillHasDuplicates.length} 個場地有重複簡稱：`);
  stillHasDuplicates.slice(0, 5).forEach(v => console.log(`  - ${v.name}`));
}
