const { chromium } = require('playwright');
const fs = require('fs');

const data = JSON.parse(fs.readFileSync('venues-all-cities.json', 'utf8'));
const toVerify = JSON.parse(fs.readFileSync('batch2-verify-list.json', 'utf8'));

console.log('=== SOP v3.0 批次驗證：其他縣市 ===');
console.log('待驗證官網:', toVerify.length, '個\n');

const results = [];

async function verifyUrl(browser, info, index, total) {
  const mainVenue = info.venues[0];
  console.log(`\n[${index + 1}/${total}] ${mainVenue.name}`);
  console.log('官網:', info.url);
  
  const result = {
    url: info.url,
    venues: info.venues.map(v => ({ id: v.id, name: v.name })),
    status: '驗證中',
    issues: [],
    title: null,
    meetingPageUrl: null,
    photos: []
  };
  
  const page = await browser.newPage();
  
  try {
    await page.goto(info.url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3000);
    
    const title = await page.title();
    result.title = title;
    
    const meetingKeywords = ['會議', '會議室', '宴會', '場地', '租借', '活動', '廳', '空間',
                             'meeting', 'conference', 'venue', 'banquet', 'event', 'space', 'room'];
    
    const meetingLinks = await page.evaluate((keywords) => {
      const links = Array.from(document.querySelectorAll('a'));
      return links
        .filter(a => {
          const text = (a.textContent || '').toLowerCase();
          const href = (a.href || '').toLowerCase();
          return keywords.some(k => text.includes(k) || href.includes(k));
        })
        .map(a => ({ text: (a.textContent || '').trim().slice(0, 50), href: a.href }))
        .filter(link => link.href && link.href.startsWith('http'))
        .slice(0, 10);
    }, meetingKeywords);
    
    if (meetingLinks.length > 0) {
      try {
        await page.goto(meetingLinks[0].href, { waitUntil: 'domcontentloaded', timeout: 20000 });
        await page.waitForTimeout(3000);
        result.meetingPageUrl = meetingLinks[0].href;
        
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await page.waitForTimeout(2000);
        
        const photos = await page.evaluate(() => {
          const imgs = Array.from(document.querySelectorAll('img'));
          return imgs
            .filter(img => img.src && img.width > 200 && img.height > 150 &&
                      !img.src.includes('logo') && !img.src.includes('icon') && !img.src.endsWith('.svg'))
            .map(img => img.src)
            .slice(0, 10);
        });
        
        if (photos.length > 0) result.photos = photos;
        else result.issues.push('缺少會議室照片');
      } catch (e) {
        result.issues.push('會議室頁面無法開啟');
      }
    } else {
      result.issues.push('找不到會議室頁面');
    }
    
    if (result.issues.length === 0 && result.photos.length > 0) result.status = 'OK';
    else if (result.meetingPageUrl) result.status = '部分OK';
    else result.status = '有問題';
    
    info.venues.forEach(v => {
      v.lastVerified = new Date().toISOString();
      if (result.meetingPageUrl) v.meetingPageUrl = result.meetingPageUrl;
      if (result.photos.length > 0) {
        v.images = {
          main: result.photos[0],
          gallery: result.photos,
          source: result.meetingPageUrl || info.url,
          verified: true,
          verifiedAt: new Date().toISOString()
        };
      }
    });
    
  } catch (err) {
    result.status = '錯誤';
    result.error = err.message;
    result.issues.push(err.message);
    info.venues.forEach(v => {
      v.lastVerified = new Date().toISOString();
      v.verificationError = err.message;
    });
  }
  
  await page.close();
  return result;
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  
  for (let i = 0; i < toVerify.length; i++) {
    const result = await verifyUrl(browser, toVerify[i], i, toVerify.length);
    results.push(result);
    await new Promise(r => setTimeout(r, 2000));
    
    if ((i + 1) % 20 === 0) {
      fs.writeFileSync('venues-all-cities.json', JSON.stringify(data, null, 2));
      const ok = results.filter(r => r.status === 'OK').length;
      const partial = results.filter(r => r.status === '部分OK').length;
      console.log(`\n📊 進度: ${i+1}/${toVerify.length} | OK: ${ok} | 部分OK: ${partial}`);
    }
  }
  
  await browser.close();
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  fs.writeFileSync(`batch2-verify-final-${timestamp}.json`, JSON.stringify(results, null, 2));
  fs.writeFileSync('venues-all-cities.json', JSON.stringify(data, null, 2));
  
  console.log('\n=== 最終統計 ===');
  console.log('總官網:', results.length);
  console.log('OK:', results.filter(r => r.status === 'OK').length);
  console.log('部分OK:', results.filter(r => r.status === '部分OK').length);
  console.log('有問題:', results.filter(r => r.status === '有問題').length);
  console.log('錯誤:', results.filter(r => r.status === '錯誤').length);
  console.log('\n✅ 批次2驗證完成');
}

main();
