// 第一批：10 個會議中心照片抓取
const { execSync } = require('child_process');
const fs = require('fs');

const venues = [
  { name: "社會創新實驗中心", url: "https://www.siihub.org" },
  { name: "政大公企中心", url: "https://cpbae.nccu.edu.tw" },
  { name: "師大進修推廣學院", url: "https://www.sce.ntnu.edu.tw" },
  { name: "台大校友會館", url: "https://www.ntualumni.org" },
  { name: "台北商務會館", url: "https://www.taipei-business.com" },
  { name: "台北唯客樂文旅", url: "https://www.victoriam.com" },
  { name: "台北北投會館", url: "https://www.beitou-hall.com" },
  { name: "台北八方美學商旅", url: "https://www.hotelbf.com" },
  { name: "台北丹迪旅店", url: "https://www.ttdhotel.com" },
  { name: "北科大創新育成中心", url: "https://www.ntut.edu.tw" }
];

const results = [];

console.log(`開始抓取 ${venues.length} 個場地...\n`);

for (let i = 0; i < venues.length; i++) {
  const venue = venues[i];
  console.log(`[${i + 1}/${venues.length}] ${venue.name}...`);
  
  try {
    // 開啟官網
    execSync(`agent-browser open "${venue.url}" --timeout 15000`, { 
      encoding: 'utf8', 
      timeout: 20000,
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    // 抓取頁面標題確認
    const title = execSync(`agent-browser eval "document.title" 2>&1`, { 
      encoding: 'utf8', 
      timeout: 10000 
    });
    
    // 抓取照片
    const photoResult = execSync(`agent-browser eval "Array.from(document.querySelectorAll('img')).filter(i=>i.src&&i.width>100&&i.height>100).map(i=>i.src).slice(0,10).join('|||')" 2>&1`, { 
      encoding: 'utf8', 
      timeout: 10000 
    });
    
    // 解析照片
    let photos = [];
    const photoMatch = photoResult.match(/https?:\/\/[^"|]+/g);
    if (photoMatch) {
      photos = photoMatch.filter(url => !url.includes('logo') && !url.includes('icon'));
    }
    
    results.push({
      name: venue.name,
      url: venue.url,
      title: title.slice(0, 100),
      photos: photos.slice(0, 5)
    });
    
    console.log(`  標題: ${title.slice(0, 50)}...`);
    console.log(`  照片: ${photos.length} 張\n`);
    
  } catch (err) {
    console.log(`  錯誤: ${err.message.slice(0, 50)}\n`);
    results.push({ name: venue.name, url: venue.url, error: err.message });
  }
}

// 儲存結果
fs.writeFileSync('batch1-results.json', JSON.stringify(results, null, 2));
console.log(`完成！結果儲存到 batch1-results.json`);
console.log(`成功: ${results.filter(r => r.photos?.length > 0).length}/${venues.length}`);
