const fs = require('fs');

const report = JSON.parse(fs.readFileSync('./taipei-full-check-report.json', 'utf8'));

// 篩選有官網且需要更新的場地
const needsUpdate = report.priorityUpdateList.filter(v => v.url);

// 按優先順序分類
const hotels = needsUpdate.filter(v => v.venueType === '飯店場地');
const conference = needsUpdate.filter(v => v.venueType === '會議中心');
const wedding = needsUpdate.filter(v => v.venueType === '婚宴場地');
const others = needsUpdate.filter(v => !['飯店場地', '會議中心', '婚宴場地'].includes(v.venueType));

console.log('=== 第二批更新清單 ===');
console.log('飯店:', hotels.length);
console.log('會議中心:', conference.length);
console.log('婚宴:', wedding.length);
console.log('其他:', others.length);

// 取出第二批（排除已更新的）
const alreadyUpdated = [1032, 1068, 1116, 1126, 1439, 1440];
const batch2 = [
  ...hotels.filter(v => !alreadyUpdated.includes(v.id)).slice(0, 15),
  ...conference.filter(v => !alreadyUpdated.includes(v.id)).slice(0, 10),
  ...wedding.filter(v => !alreadyUpdated.includes(v.id)).slice(0, 5)
];

console.log('\n第二批更新:', batch2.length, '個場地');

// 輸出 JSON
fs.writeFileSync('./batch2-update-list.json', JSON.stringify(batch2, null, 2));

console.log('\n場地清單:');
batch2.forEach((v, i) => {
  console.log((i+1) + '. [' + v.id + '] ' + v.name + ' (' + v.venueType + ')');
  console.log('   ' + v.issues.join(', '));
  console.log('   ' + v.url);
});
