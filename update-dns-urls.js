const fs = require('fs');

console.log('🔄 更新 DNS 錯誤場地的 URL...\n');

// 讀取資料
const venues = JSON.parse(fs.readFileSync('sample-data.json', 'utf8'));

console.log(`總場地數: ${venues.length}\n`);

// URL 更新對照表
const urlUpdates = {
  '板橋435藝文特區': 'https://www.435.culture.ntpc.gov.tw/',
  '福容大飯店-淡水漁人碼頭': 'https://www.fullon-hotels.com.tw/fw/tw/',
  '典華旗艦店': 'https://www.denwell.com/',
  '林酒店': 'https://www.thelin.com.tw/',
  '台中市世貿中心': 'https://www.wtctxg.org.tw/',
  '台中國家歌劇院': 'https://www.npac-ntt.org/index',
  '義大皇家酒店': 'https://www.edaroyal.com.tw/',
  '煙波大飯店新竹湖濱館': 'https://hsinchu.lakeshore.com.tw/',
  '嘉義耐斯王子大飯店': 'https://www.niceprincehotel.com.tw/',
  '嘉義長榮文苑酒店': 'https://www.evergreen-hotels.com/branch2/?lang=zh-TW&d1b_Sn=65',
  '宜蘭礁溪老爺酒店': 'https://www.hotelroyal.com.tw/zh-tw/chiaohsi'
};

// 需要刪除的場地
const venuesToDelete = [
  '大億麗緻酒店',
  '基隆市文化中心',
  '新竹市文化局'
];

// 統計
const stats = {
  updated: 0,
  deleted: 0,
  notFound: 0
};

// 更新 URL
console.log('✅ 更新 URL:');
Object.entries(urlUpdates).forEach(([name, newUrl]) => {
  const venue = venues.find(v => v.name === name);
  if (venue) {
    const oldUrl = venue.url;
    venue.url = newUrl;
    venue.urlUpdated = true;
    venue.urlUpdatedAt = new Date().toISOString();
    stats.updated++;
    console.log(`${stats.updated}. ${name}`);
    console.log(`   舊 URL: ${oldUrl}`);
    console.log(`   新 URL: ${newUrl}`);
    console.log('');
  } else {
    stats.notFound++;
    console.log(`⚠️ 找不到場地: ${name}`);
  }
});

// 刪除場地
console.log('\n❌ 刪除場地:');
venuesToDelete.forEach(name => {
  const index = venues.findIndex(v => v.name === name);
  if (index !== -1) {
    const venue = venues[index];
    venues.splice(index, 1);
    stats.deleted++;
    console.log(`${stats.deleted}. ${name} (${venue.city})`);
    console.log(`   原因: 歇業或不存在`);
    console.log('');
  } else {
    console.log(`⚠️ 找不到場地: ${name}`);
  }
});

// 重新編號
venues.forEach((venue, index) => {
  venue.id = index + 1;
});

// 保存
fs.writeFileSync('sample-data.json', JSON.stringify(venues, null, 2));

console.log('\n📊 更新統計:');
console.log(`✅ 更新 URL: ${stats.updated} 個`);
console.log(`❌ 刪除場地: ${stats.deleted} 個`);
console.log(`⚠️ 找不到: ${stats.notFound} 個`);
console.log(`📁 總場地數: ${venues.length} 個`);

// 生成更新報告
const report = {
  timestamp: new Date().toISOString(),
  summary: {
    total: venues.length,
    updated: stats.updated,
    deleted: stats.deleted,
    notFound: stats.notFound
  },
  updatedUrls: Object.entries(urlUpdates).map(([name, url]) => ({
    name,
    newUrl: url
  })),
  deletedVenues: venuesToDelete
};

fs.writeFileSync('url-update-report.json', JSON.stringify(report, null, 2));

console.log('\n✅ 已保存報告到: url-update-report.json');
console.log('✅ 已更新 sample-data.json');
