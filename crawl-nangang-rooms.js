const { chromium } = require('playwright');

async function main() {
  console.log('=== 南港展覽館會議室清單抓取 ===\n');
  
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    // 開啟會議室頁面
    const url = 'https://www.tainex.com.tw/venue/conference/1/1';
    console.log('URL:', url);
    
    await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(5000);
    
    // 滾動頁面
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(2000);
    
    // 抓取頁面文字內容
    const pageText = await page.evaluate(() => document.body.innerText);
    console.log('\n=== 頁面文字內容 ===');
    console.log(pageText.slice(0, 4000));
    
    // 尋找會議室相關元素
    console.log('\n=== 尋找會議室 ===');
    
    const rooms = await page.evaluate(() => {
      const results = [];
      
      // 方法 1: 尋找表格
      document.querySelectorAll('table tr').forEach(tr => {
        const cells = tr.querySelectorAll('td, th');
        if (cells.length >= 2) {
          const row = [];
          cells.forEach(cell => row.push((cell.textContent || '').trim()));
          if (row[0].length > 0 && row[0].length < 50) {
            results.push({ type: 'table', data: row });
          }
        }
      });
      
      // 方法 2: 尋找會議室卡片
      document.querySelectorAll('[class*="room"], [class*="venue"], [class*="conference"]').forEach(el => {
        const text = (el.textContent || '').trim();
        if (text.length > 10 && text.length < 500) {
          results.push({ type: 'card', text: text.slice(0, 200) });
        }
      });
      
      // 方法 3: 尋找包含「會議室」的文字
      document.querySelectorAll('h1, h2, h3, h4, h5, p, div, span').forEach(el => {
        const text = (el.textContent || '').trim();
        if (text.includes('會議室') && text.length < 100) {
          results.push({ type: 'text', text });
        }
      });
      
      return results;
    });
    
    console.log('\n找到的元素:');
    rooms.forEach((r, i) => {
      if (r.type === 'table') {
        console.log(`${i + 1}. [表格] ${r.data.join(' | ')}`);
      } else {
        console.log(`${i + 1}. [${r.type}] ${r.text}`);
      }
    });
    
    // 截圖
    await page.screenshot({ path: 'nangang-conference.png', fullPage: true });
    console.log('\n截圖已儲存: nangang-conference.png');
    
  } catch (e) {
    console.log('錯誤:', e.message);
  }
  
  await browser.close();
}

main();
