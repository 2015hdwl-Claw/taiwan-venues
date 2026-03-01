const fs = require('fs');

// 讀取資料
const data = JSON.parse(fs.readFileSync('venues-all-cities.json', 'utf8'));

console.log('🔍 檢查並修正重複的英文簡稱...\n');

let fixedCount = 0;

const cleanedData = data.map(venue => {
  let name = venue.name;
  
  // 修正重複的英文簡稱
  const patterns = [
    { regex: /\(TICC\)TICC/g, replace: '(TICC)' },
    { regex: /\(NTU\)NTU/g, replace: '(NTU)' },
    { regex: /\([A-Z]{2,}\)\1/g, match => match.substring(0, match.length / 2) }
  ];
  
  patterns.forEach(({ regex, replace }) => {
    if (regex.test(name)) {
      const oldName = name;
      name = name.replace(regex, replace);
      console.log(`修正: "${oldName}" -> "${name}"`);
      fixedCount++;
    }
  });
  
  venue.name = name;
  return venue;
});

// 儲存
fs.writeFileSync('venues-all-cities.json', JSON.stringify(cleanedData, null, 2), 'utf8');

console.log(`\n✅ 修正了 ${fixedCount} 個重複的場地名稱`);
