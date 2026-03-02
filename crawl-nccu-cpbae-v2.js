const { chromium } = require('playwright');
const fs = require('fs');

async function main() {
  console.log('=== 政大公企中心會議室清單抓取 ===\n');
  
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  const url = 'https://cpbae.nccu.edu.tw/cpbae/space/search';
  console.log('URL:', url);
  
  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
    console.log('頁面已載入');
    
    // 等待頁面渲染
    await page.waitForTimeout(5000);
    
    // 滾動頁面
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(3000);
    
    // 取得標題
    const title = await page.title();
    console.log('標題:', title);
    
    // 取得所有文字內容
    const pageText = await page.evaluate(() => document.body.innerText);
    console.log('\n=== 頁面文字內容（前 3000 字）===');
    console.log(pageText.slice(0, 3000));
    
    // 尋找場地卡片或列表
    console.log('\n=== 尋找場地元素 ===');
    
    const venues = await page.evaluate(() => {
      const results = [];
      
      // 方法 1: 尋找所有包含「人」的元素（可能是容納人數）
      document.querySelectorAll('*').forEach(el => {
        const text = (el.textContent || '').trim();
        if (text.match(/^\d+人$/) || text.match(/^\d+~\d+人$/)) {
          // 找到容納人數，往上找場地名稱
          let parent = el.parentElement;
          for (let i = 0; i < 5 && parent; i++) {
            const parentText = (parent.textContent || '').trim();
            if (parentText.length > 10 && parentText.length < 200) {
              results.push({
                type: 'venue',
                text: parentText.slice(0, 150),
                capacity: text
              });
              break;
            }
            parent = parent.parentElement;
          }
        }
      });
      
      // 方法 2: 尋找場地卡片
      document.querySelectorAll('[class*="card"], [class*="venue"], [class*="room"], [class*="space"]').forEach(el => {
        const text = (el.textContent || '').trim();
        if (text.length > 10 && text.length < 500) {
          results.push({
            type: 'card',
            text: text.slice(0, 200)
          });
        }
      });
      
      // 去重
      const seen = new Set();
      return results.filter(r => {
        const key = r.text.slice(0, 50);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      }).slice(0, 20);
    });
    
    console.log('\n找到的場地:');
    venues.forEach((v, i) => {
      console.log(`\n${i + 1}. [${v.type}]${v.capacity ? ' (' + v.capacity + ')' : ''}`);
      console.log(v.text);
    });
    
    // 截圖
    await page.screenshot({ path: 'nccu-cpbae-screenshot.png', fullPage: true });
    console.log('\n截圖已儲存: nccu-cpbae-screenshot.png');
    
  } catch (e) {
    console.log('錯誤:', e.message);
  }
  
  await browser.close();
  console.log('\n完成');
}

main();
