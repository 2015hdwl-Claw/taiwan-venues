const fs = require('fs');
const https = require('https');
const http = require('http');

console.log('🔍 檢測 URL 和圖片正確性...\n');

// 讀取資料
const venues = JSON.parse(fs.readFileSync('sample-data.json', 'utf8'));

// 統計
const stats = {
  totalUrls: 0,
  validUrls: 0,
  invalidUrls: 0,
  timeoutUrls: 0,
  errorUrls: 0,
  totalImages: 0,
  validImages: 0,
  invalidImages: 0,
  timeoutImages: 0,
  errorImages: 0
};

// 錯誤清單
const errors = {
  urls: [],
  images: []
};

// 檢測 URL 的函數
function checkUrl(url, timeout = 5000) {
  return new Promise((resolve) => {
    if (!url || url === '請查詢官網') {
      resolve({ valid: false, error: 'URL 為空' });
      return;
    }
    
    const protocol = url.startsWith('https') ? https : http;
    
    const timer = setTimeout(() => {
      resolve({ valid: false, error: 'timeout' });
    }, timeout);
    
    protocol.get(url, (res) => {
      clearTimeout(timer);
      
      if (res.statusCode >= 200 && res.statusCode < 400) {
        resolve({ valid: true, statusCode: res.statusCode });
      } else if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        // 重定向，跟隨
        resolve({ valid: true, statusCode: res.statusCode, redirect: res.headers.location });
      } else {
        resolve({ valid: false, statusCode: res.statusCode, error: `HTTP ${res.statusCode}` });
      }
    }).on('error', (err) => {
      clearTimeout(timer);
      resolve({ valid: false, error: err.message });
    });
  });
}

// 檢測場地 URL
async function checkVenueUrls() {
  console.log('📡 檢測場地 URL...\n');
  
  const venuesToCheck = venues.slice(0, 50); // 先檢測前 50 個
  
  for (const venue of venuesToCheck) {
    if (venue.url) {
      stats.totalUrls++;
      
      const result = await checkUrl(venue.url);
      
      if (result.valid) {
        stats.validUrls++;
        console.log(`✅ ${venue.name} - ${venue.url}`);
      } else {
        stats.invalidUrls++;
        
        if (result.error === 'timeout') {
          stats.timeoutUrls++;
        } else {
          stats.errorUrls++;
        }
        
        errors.urls.push({
          name: venue.name,
          city: venue.city,
          url: venue.url,
          error: result.error,
          statusCode: result.statusCode
        });
        
        console.log(`❌ ${venue.name} - ${result.error}`);
      }
      
      // 避免請求過快
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
}

// 檢測圖片 URL
async function checkImageUrls() {
  console.log('\n🖼️ 檢測圖片 URL...\n');
  
  const venuesWithImages = venues.filter(v => v.images && v.images.main);
  const imagesToCheck = venuesWithImages.slice(0, 30); // 先檢測前 30 個
  
  for (const venue of imagesToCheck) {
    if (venue.images.main) {
      stats.totalImages++;
      
      const result = await checkUrl(venue.images.main);
      
      if (result.valid) {
        stats.validImages++;
        console.log(`✅ ${venue.name} - 主圖片`);
      } else {
        stats.invalidImages++;
        
        if (result.error === 'timeout') {
          stats.timeoutImages++;
        } else {
          stats.errorImages++;
        }
        
        errors.images.push({
          name: venue.name,
          city: venue.city,
          url: venue.images.main,
          error: result.error,
          statusCode: result.statusCode
        });
        
        console.log(`❌ ${venue.name} - 主圖片: ${result.error}`);
      }
      
      // 避免請求過快
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
}

// 執行檢測
async function runCheck() {
  await checkVenueUrls();
  await checkImageUrls();
  
  console.log('\n📊 檢測結果:\n');
  console.log('URL 檢測:');
  console.log(`  總數: ${stats.totalUrls}`);
  console.log(`  有效: ${stats.validUrls} (${((stats.validUrls / stats.totalUrls) * 100).toFixed(1)}%)`);
  console.log(`  無效: ${stats.invalidUrls} (${((stats.invalidUrls / stats.totalUrls) * 100).toFixed(1)}%)`);
  console.log(`  超時: ${stats.timeoutUrls}`);
  console.log(`  錯誤: ${stats.errorUrls}`);
  
  console.log('\n圖片檢測:');
  console.log(`  總數: ${stats.totalImages}`);
  console.log(`  有效: ${stats.validImages} (${((stats.validImages / stats.totalImages) * 100).toFixed(1)}%)`);
  console.log(`  無效: ${stats.invalidImages} (${((stats.invalidImages / stats.totalImages) * 100).toFixed(1)}%)`);
  console.log(`  超時: ${stats.timeoutImages}`);
  console.log(`  錯誤: ${stats.errorImages}`);
  
  // 保存報告
  const report = {
    timestamp: new Date().toISOString(),
    stats,
    errors
  };
  
  fs.writeFileSync('url-image-validation-report.json', JSON.stringify(report, null, 2));
  
  console.log('\n✅ 已保存報告到: url-image-validation-report.json');
  
  // 顯示錯誤清單
  if (errors.urls.length > 0) {
    console.log('\n❌ URL 錯誤清單:');
    errors.urls.forEach((err, i) => {
      console.log(`${i + 1}. ${err.name} (${err.city})`);
      console.log(`   URL: ${err.url}`);
      console.log(`   錯誤: ${err.error}`);
    });
  }
  
  if (errors.images.length > 0) {
    console.log('\n❌ 圖片錯誤清單:');
    errors.images.forEach((err, i) => {
      console.log(`${i + 1}. ${err.name} (${err.city})`);
      console.log(`   圖片: ${err.url}`);
      console.log(`   錯誤: ${err.error}`);
    });
  }
}

runCheck();
