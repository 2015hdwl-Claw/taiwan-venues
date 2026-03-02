const { chromium } = require('playwright');

async function main() {
  console.log('=== 南港展覽館會議室資訊 ===\n');
  
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    const url = 'https://www.tainex.com.tw/venue/room-info/1/3';
    console.log('URL:', url);
    
    await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(5000);
    
    // 滾動頁面
    for (let i = 0; i < 3; i++) {
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(2000);
    }
    
    // 抓取頁面文字
    const pageText = await page.evaluate(() => document.body.innerText);
    console.log('\n=== 頁面文字內容 ===');
    console.log(pageText.slice(0, 5000));
    
    // 尋找會議室相關元素
    console.log('\n=== 尋找會議室資訊 ===');
    
    // 方法 1: 尋找所有卡片或區塊
    const cards = await page.evaluate(() => {
      const results = [];
      
      // 尋找可能的會議室卡片
      document.querySelectorAll('[class*="card"], [class*="room"], [class*="item"], [class*="box"]').forEach(el => {
        const text = (el.textContent || '').trim();
        if (text.length > 50 && text.length < 1000) {
          results.push({ type: 'card', text: text.slice(0, 300) });
        }
      });
      
      // 尋找表格
      document.querySelectorAll('table').forEach(table => {
        const rows = [];
        table.querySelectorAll('tr').forEach(tr => {
          const cells = [];
          tr.querySelectorAll('td, th').forEach(td => {
            cells.push((td.textContent || '').trim());
          });
          if (cells.length > 0 && cells.some(c => c.length > 0)) {
            rows.push(cells);
          }
        });
        if (rows.length > 1) {
          results.push({ type: 'table', rows });
        }
      });
      
      return results;
    });
    
    if (cards.length > 0) {
      console.log('\n找到的元素:');
      cards.forEach((c, i) => {
        if (c.type === 'table') {
          console.log(`\n${i + 1}. [表格]`);
          c.rows.forEach(row => console.log(`   | ${row.join(' | ')} |`));
        } else {
          console.log(`\n${i + 1}. [卡片]`);
          console.log(c.text);
        }
      });
    }
    
    // 截圖
    await page.screenshot({ path: 'nangang-room-info.png', fullPage: true });
    console.log('\n截圖已儲存: nangang-room-info.png');
    
  } catch (e) {
    console.log('錯誤:', e.message);
  }
  
  await browser.close();
}

main();
