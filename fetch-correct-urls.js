const { chromium } = require('playwright');
const fs = require('fs');

const venues = [
  { name: '台北丹迪旅店', url: 'https://www.dandyhotel.com.tw' },
  { name: '台北京站酒店', url: 'https://www.cityinn.com.tw' },
  { name: '台北亞都麗緻大飯店', url: 'https://www.thelandis.com' },
  { name: '公務人力發展學院', url: 'https://www.hrd.gov.tw' },
  { name: '台北六福客棧', url: 'https://www.leofoo.com.tw' }
];

async function scrapeVenue(browser, venue) {
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  });
  const page = await context.newPage();
  
  try {
    await page.goto(venue.url, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(3000);
    
    const images = await page.evaluate(() => {
      const imgs = Array.from(document.querySelectorAll('img'));
      return imgs
        .filter(img => img.src && img.width > 100 && img.height > 100)
        .map(img => img.src)
        .filter(src => 
          src.startsWith('http') &&
          !src.includes('logo') && 
          !src.includes('icon') &&
          !src.includes('avatar')
        );
    });
    
    await context.close();
    
    return {
      name: venue.name,
      url: venue.url,
      photos: [...new Set(images)].slice(0, 5),
      status: 'success'
    };
    
  } catch (err) {
    await context.close();
    return {
      name: venue.name,
      url: venue.url,
      error: err.message,
      status: 'failed'
    };
  }
}

async function main() {
  console.log('=== 抓取正確官網照片 ===\n');
  
  const browser = await chromium.launch({ headless: true });
  const results = [];
  
  for (let i = 0; i < venues.length; i++) {
    const venue = venues[i];
    process.stdout.write(`[${i + 1}/${venues.length}] ${venue.name}... `);
    
    const result = await scrapeVenue(browser, venue);
    results.push(result);
    
    if (result.status === 'success' && result.photos.length > 0) {
      console.log(`✅ ${result.photos.length} 張`);
    } else if (result.status === 'success') {
      console.log('⚠️ 0 張');
    } else {
      console.log(`❌ ${result.error.slice(0, 30)}`);
    }
  }
  
  await browser.close();
  
  // 更新資料庫
  const data = JSON.parse(fs.readFileSync('venues-all-cities.json', 'utf8'));
  
  let updated = 0;
  results.forEach(r => {
    if (r.status === 'success' && r.photos.length > 0) {
      data.forEach(v => {
        if (v.name.includes(r.name) || r.name.includes(v.name.split('(')[0])) {
          v.images = {
            main: r.photos[0],
            gallery: r.photos,
            source: r.url
          };
          updated++;
        }
      });
    }
  });
  
  fs.writeFileSync('venues-all-cities.json', JSON.stringify(data, null, 2));
  
  console.log(`\n更新資料庫: ${updated} 筆`);
}

main();
