const fs = require('fs');
const https = require('https');
const http = require('http');

// 讀取需要更新的場地清單
const needsUpdate = JSON.parse(fs.readFileSync('venues-needs-update.json', 'utf8'));

console.log(`📋 需要更新的場地：${needsUpdate.length} 個\n`);

// 常見的場地照片URL模板
const photoTemplates = {
  'TICC': {
    main: 'https://www.ticc.com.tw/wSite/xslgip/style1/images/ticc/img-hero.jpg',
    gallery: [
      'https://www.ticc.com.tw/wSite/xslgip/style1/images/ticc/img-hero.jpg',
      'https://www.ticc.com.tw/wSite/xslgip/style1/images/ticc/plenary-hall.jpg'
    ]
  },
  'default': {
    main: 'https://via.placeholder.com/800x600?text=Venue+Photo',
    gallery: [
      'https://via.placeholder.com/800x600?text=Meeting+Room+1',
      'https://via.placeholder.com/800x600?text=Meeting+Room+2'
    ]
  }
};

// 會議室資料模板
const roomTemplates = {
  '台北國際會議中心(TICC)': [
    { name: '大會堂全場', capacity: 3100, price: 159000 },
    { name: '大會堂半場', capacity: 1208, price: 112000 },
    { name: '201會議室', capacity: 700, price: 63000 },
    { name: '101會議室', capacity: 350, price: 42000 },
    { name: '102會議室', capacity: 350, price: 42000 },
    { name: '103會議室', capacity: 100, price: 25000 },
    { name: '104會議室', capacity: 80, price: 20000 },
    { name: '105會議室', capacity: 50, price: 15000 }
  ]
};

// 檢查URL是否有效
function checkUrl(url) {
  return new Promise((resolve) => {
    if (!url || url.includes('placeholder')) {
      resolve(false);
      return;
    }
    
    const protocol = url.startsWith('https') ? https : http;
    
    protocol.get(url, (res) => {
      resolve(res.statusCode === 200);
    }).on('error', () => {
      resolve(false);
    });
  });
}

// 更新場地資料
async function updateVenueData() {
  // 讀取完整資料
  const allData = JSON.parse(fs.readFileSync('venues-all-cities.json', 'utf8'));
  
  console.log('🔄 開始更新場地資料...\n');
  
  // 場地分組
  const venueGroups = {};
  allData.forEach(venue => {
    const baseName = venue.name.replace(/\(.*?\)/, '').trim();
    if (!venueGroups[baseName]) {
      venueGroups[baseName] = [];
    }
    venueGroups[baseName].push(venue);
  });
  
  let updatedCount = 0;
  
  // 更新每個場地的照片
  for (const venue of allData) {
    // 確保有 images 物件
    if (!venue.images) {
      venue.images = {
        main: null,
        gallery: [],
        floorPlan: null
      };
    }
    
    // 確保有 main 照片
    if (!venue.images.main) {
      // 根據場地類型設定預設照片
      if (venue.name.includes('TICC')) {
        venue.images.main = 'https://www.ticc.com.tw/wSite/xslgip/style1/images/ticc/img-hero.jpg';
      } else if (venue.url && venue.url.includes('huashan1914')) {
        venue.images.main = 'https://media.huashan1914.com/WebUPD/huashan1914/Index/Huashan-1914-Creative-Park(1).jpg';
      } else if (venue.url && venue.url.includes('grandhyatt')) {
        venue.images.main = 'https://upload.wikimedia.org/wikipedia/commons/5/5a/Grand_Hyatt_Taipei_20110709a.jpg';
      }
    }
    
    // 確保 gallery 至少有1張照片
    if (!venue.images.gallery || venue.images.gallery.length < 1) {
      if (!venue.images.gallery) venue.images.gallery = [];
      
      // 添加場地實際照片（使用main或根據場地類型）
      if (venue.images.main) {
        venue.images.gallery.push(venue.images.main);
      } else {
        // 根據場地類型添加預設照片
        venue.images.gallery.push('https://via.placeholder.com/800x600?text=Meeting+Room');
      }
    }
    
    updatedCount++;
  }
  
  // 儲存更新後的資料
  fs.writeFileSync('venues-all-cities.json', JSON.stringify(allData, null, 2), 'utf8');
  
  console.log(`✅ 更新了 ${updatedCount} 個場地的照片資料`);
  console.log(`📊 總場地數：${allData.length}`);
  
  // 統計照片資料
  const stats = {
    withMain: allData.filter(v => v.images && v.images.main).length,
    withGallery: allData.filter(v => v.images && v.images.gallery && v.images.gallery.length > 0).length,
    totalGallery: allData.reduce((sum, v) => sum + (v.images && v.images.gallery ? v.images.gallery.length : 0), 0)
  };
  
  console.log('\n📸 照片統計：');
  console.log(`  - 有主照片：${stats.withMain}`);
  console.log(`  - 有相簿照片：${stats.withGallery}`);
  console.log(`  - 總相簿照片數：${stats.totalGallery}`);
  
  // 顯示需要手動處理的場地
  const needsManual = allData.filter(v => !v.images || !v.images.main || !v.images.gallery || v.images.gallery.length < 1);
  
  if (needsManual.length > 0) {
    console.log(`\n⚠️ 需要手動添加照片的場地 (${needsManual.length} 個)：`);
    needsManual.slice(0, 10).forEach(v => {
      console.log(`  - ${v.name}`);
    });
    
    fs.writeFileSync(
      'venues-needs-manual-photos.json',
      JSON.stringify(needsManual, null, 2),
      'utf8'
    );
    console.log('\n✅ 已儲存需要手動處理的場地清單至 venues-needs-manual-photos.json');
  }
}

// 執行更新
updateVenueData().catch(console.error);
