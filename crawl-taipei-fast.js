const { chromium } = require('playwright');
const fs = require('fs');

const data = JSON.parse(fs.readFileSync('venues-all-cities.json', 'utf8'));
const toProcess = data.filter(v => 
  v.city === '台北市' && 
  v.status === '上架' && 
  !v.venueListUrl
);

console.log('=== 台北市 venueListUrl 快速補充 ===');
console.log('待處理:', toProcess.length);

// 排除已知有問題的場地
const excludePatterns = [
  'W飯店', '君悅', '艾美', '香格里拉', '萬豪', '洲際', '晶華', '圓山',
  'marriott', 'hyatt', 'shangri-la', 'citizenm', 'palaisdechine'
];

const filtered = toProcess.filter(v => {
  const name = (v.name + v.url).toLowerCase();
  return !excludePatterns.some(p => name.includes(p.toLowerCase()));
});

console.log('排除國際酒店後:', filtered.length);

// 按場地分組
const venueGroups = {};
filtered.forEach(v => {
  const key = v.url || v.name;
  if (!venueGroups[key]) {
    venueGroups[key] = { url: v.url, name: v.name, ids: [] };
  }
  venueGroups[key].ids.push(v.id);
});

const uniqueVenues = Object.values(venueGroups);
console.log('唯一官網數:', uniqueVenues.length);

async function crawlVenue(browser, venue) {
  const page = await browser.newPage();
  const result = { url: venue.url, name: venue.name, ids: venue.ids, venueListUrl: null, error: null };
  
  try {
    // 縮短逾時時間
    await page.goto(venue.url, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(2000);
    
    const links = await page.evaluate(() => {
      const keywords = ['會議', '宴會', '場地', '租借', 'meeting', 'venue', 'conference'];
      const results = [];
      document.querySelectorAll('a').forEach(a => {
        const text = (a.textContent || '').toLowerCase();
        const href = a.href || '';
        if (keywords.some(k => text.includes(k) || href.includes(k))) {
          results.push({ text: (a.textContent || '').trim().slice(0, 60), href });
        }
      });
      return results.filter(l => l.href && l.href.startsWith('http')).slice(0, 10);
    });
    
    if (links.length > 0) {
      result.venueListUrl = links[0].href;
      console.log('✅ ' + venue.name.slice(0, 20) + ' → ' + links[0].href.slice(0, 50));
    } else {
      console.log('⚠️ ' + venue.name.slice(0, 20) + ' 找不到');
      result.error = '找不到';
    }
  } catch (e) {
    console.log('❌ ' + venue.name.slice(0, 20) + ' ' + e.message.slice(0, 40));
    result.error = e.message;
  }
  
  await page.close();
  return result;
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const results = [];
  
  // 處理所有場地
  for (const venue of uniqueVenues) {
    const result = await crawlVenue(browser, venue);
    results.push(result);
    
    if (result.venueListUrl) {
      data.forEach(v => {
        if (result.ids.includes(v.id)) {
          v.venueListUrl = result.venueListUrl;
          v.lastVerified = new Date().toISOString();
        }
      });
    }
    
    await new Promise(r => setTimeout(r, 1000));
  }
  
  await browser.close();
  
  console.log('\n=== 統計 ===');
  console.log('處理:', results.length);
  console.log('成功:', results.filter(r => r.venueListUrl).length);
  console.log('失敗:', results.filter(r => r.error).length);
  
  fs.writeFileSync('venues-all-cities.json', JSON.stringify(data, null, 2));
  console.log('已儲存');
}

main();
