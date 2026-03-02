const { chromium } = require('playwright');
const fs = require('fs');

async function main() {
  console.log('=== 南港展覽館會議室清單抓取 ===\n');
  
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    // 開啟首頁
    await page.goto('https://www.tainex.com.tw/', { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(3000);
    
    const title = await page.title();
    console.log('標題:', title);
    
    // 抓取頁面文字內容
    const pageText = await page.evaluate(() => document.body.innerText);
    console.log('\n=== 頁面文字內容（前 3000 字）===');
    console.log(pageText.slice(0, 3000));
    
    // 尋找所有連結
    console.log('\n=== 所有連結 ===');
    const links = await page.evaluate(() => {
      const results = [];
      document.querySelectorAll('a').forEach(a => {
        const text = (a.textContent || '').trim();
        const href = a.href || '';
        if (text.length > 0 && text.length < 50 && href.includes('tainex')) {
          results.push({ text, href });
        }
      });
      return results.filter((l, i, arr) => 
        arr.findIndex(x => x.href === l.href) === i
      ).slice(0, 30);
    });
    
    links.forEach((l, i) => console.log(`${i + 1}. ${l.text} | ${l.href}`));
    
    // 尋找會議室相關頁面
    console.log('\n=== 尋找會議室頁面 ===');
    const roomLinks = links.filter(l => 
      l.text.includes('會議') || l.text.includes('場地') || l.text.includes('租借') ||
      l.href.includes('room') || l.href.includes('venue') || l.href.includes('space')
    );
    
    console.log('找到的會議室相關連結:');
    roomLinks.forEach((l, i) => console.log(`${i + 1}. ${l.text} | ${l.href}`));
    
    // 嘗試開啟會議室頁面
    if (roomLinks.length > 0) {
      console.log('\n=== 開啟會議室頁面 ===');
      await page.goto(roomLinks[0].href, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(3000);
      
      const roomText = await page.evaluate(() => document.body.innerText);
      console.log(roomText.slice(0, 2000));
    }
    
  } catch (e) {
    console.log('錯誤:', e.message);
  }
  
  await browser.close();
  console.log('\n完成');
}

main();
