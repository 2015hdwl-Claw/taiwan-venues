const fs = require('fs');

// 批次收集報告
const collectedVenues = [
  {
    name: "台北國賓大飯店",
    city: "台北市",
    url: "https://www.ambassador-hotels.com/tc/taipei",
    status: "success",
    type: "飯店",
    address: "台北市中山區中山北路63號",
    features: ["五星級", "會議空間", "餐廳", "交通便利"]
  },
  {
    name: "板橋凱撒大飯店",
    city: "新北市",
    url: "https://banqiao.caesarpark.com.tw",
    status: "success",
    type: "飯店",
    features: ["三鐵交匯", "交通便利", "會議空間"]
  },
  {
    name: "福容大飯店淡水漁人碼頭",
    city: "新北市",
    url: "https://www.fullon-hotels.com.tw/fw/",
    status: "success",
    type: "飯店",
    features: ["郵輪造型", "台灣最美飯店", "海景"]
  },
  {
    name: "中正紀念堂",
    city: "台北市",
    url: "https://www.cksmh.gov.tw",
    status: "success",
    type: "展覽場地",
    address: "台北市中正區中山南路21號",
    features: ["展覽", "文化活動"]
  },
  {
    name: "台北小巨蛋",
    city: "台北市",
    url: "https://www.taipeiarena.com",
    status: "failed",
    error: "URL錯誤（域名出售）",
    type: "體育場館"
  },
  {
    name: "高雄市立美術館",
    city: "高雄市",
    url: "https://www.kmfa.gov.tw",
    status: "success",
    type: "展覽場地",
    features: ["藝術展覽"]
  },
  {
    name: "墾丁凱撒大飯店",
    city: "屏東縣",
    url: "https://kenting.caesarpark.com.tw",
    status: "success",
    type: "飯店",
    features: ["南洋風情", "度假勝地", "椰林泳池"]
  },
  {
    name: "宜蘭傳藝中心",
    city: "宜蘭縣",
    url: "https://www.ncfta.gov.tw",
    status: "success",
    type: "文化中心",
    address: "宜蘭縣五結鄉季新村五濱路二段201號",
    phone: "03-970-5815"
  },
  {
    name: "墾丁福華渡假飯店",
    city: "屏東縣",
    url: "https://www.howard-hotels.com.tw",
    status: "success",
    type: "飯店",
    features: ["渡假飯店", "連鎖飯店"]
  },
  {
    name: "CLBC大安商務中心",
    city: "台北市",
    url: "https://www.clbc.tw",
    status: "success",
    type: "商務中心",
    features: ["共同工作空間", "會議室", "活動場地"]
  },
  {
    name: "臺東縣政府文化處",
    city: "臺東縣",
    url: "https://www.taitung.gov.tw",
    status: "success",
    type: "政府機關",
    features: ["文化活動"]
  },
  {
    name: "福容大飯店",
    city: "全台",
    url: "https://www.fullon-hotels.com.tw",
    status: "success",
    type: "連鎖飯店",
    features: ["全台19家分店", "連鎖飯店"]
  },
  {
    name: "國家表演藝術中心",
    city: "台北市",
    url: "https://www.npac-ntch.org",
    status: "success",
    type: "表演場地",
    address: "臺北市中山南路21-1號",
    phone: "02-3393-9777"
  }
];

// 統計
const stats = {
  total: collectedVenues.length,
  success: collectedVenues.filter(v => v.status === 'success').length,
  failed: collectedVenues.filter(v => v.status === 'failed').length,
  types: {}
};

collectedVenues.forEach(v => {
  if (!stats.types[v.type]) {
    stats.types[v.type] = 0;
  }
  stats.types[v.type]++;
});

// 保存報告
const report = {
  timestamp: new Date().toISOString(),
  stats,
  venues: collectedVenues
};

fs.writeFileSync(
  'collection-progress-report.json',
  JSON.stringify(report, null, 2)
);

console.log('📊 收集進度報告\n');
console.log('=====================================\n');
console.log(`總收集數: ${stats.total}`);
console.log(`成功: ${stats.success}`);
console.log(`失敗: ${stats.failed}`);
console.log(`\n場地類型統計:`);
Object.entries(stats.types).forEach(([type, count]) => {
  console.log(`  ${type}: ${count}`);
});

console.log('\n✅ 已保存報告到: collection-progress-report.json');
console.log('\n📋 成功收集的場地:\n');

collectedVenues.filter(v => v.status === 'success').forEach((v, i) => {
  console.log(`${i + 1}. ${v.name} (${v.city})`);
  console.log(`   類型: ${v.type}`);
  if (v.features) {
    console.log(`   特色: ${v.features.join(', ')}`);
  }
  console.log(`   URL: ${v.url}\n`);
});

console.log('\n❌ 失敗的場地:\n');
collectedVenues.filter(v => v.status === 'failed').forEach((v, i) => {
  console.log(`${i + 1}. ${v.name} (${v.city})`);
  console.log(`   錯誤: ${v.error}\n`);
});
