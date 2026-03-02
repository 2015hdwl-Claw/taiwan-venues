const { chromium } = require('playwright');

async function main() {
  console.log('=== 南港展覽館會議室租借系統 ===\n');
  
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    const url = 'https://www.tainex.com.tw/venue/app-room/1';
    console.log('URL:', url);
    
    await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(5000);
    
    // 滾動頁面
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(3000);
    
    // 抓取頁面文字
    const pageText = await page.evaluate(() => document.body.innerText);
    console.log('\n=== 頁面文字內容 ===');
    console.log(pageText.slice(0, 5000));
    
    // 尋找會議室清單
    console.log('\n=== 尋找會議室清單 ===');
    
    const rooms = await page.evaluate(() => {
      const results = [];
      
      // 方法 1: 尋找所有選項或列表項目
      document.querySelectorAll('option, li, [class*="room"], [class*="item"]').forEach(el => {
        const text = (el.textContent || '').trim();
        const value = el.value || el.getAttribute('data-value') || '';
        if (text.length > 2 && text.length < 100) {
          results.push({ text, value, tag: el.tagName });
        }
      });
      
      // 方法 2: 尋找下拉選單
      document.querySelectorAll('select').forEach(select => {
        const options = [];
        select.querySelectorAll('option').forEach(opt => {
          options.push({ text: opt.textContent, value: opt.value });
        });
        if (options.length > 1) {
          results.push({ 
            type: 'select', 
            name: select.name || select.id,
            options 
          });
        }
      });
      
      // 方法 3: 尋找表格
      document.querySelectorAll('table').forEach(table => {
        const rows = [];
        table.querySelectorAll('tr').forEach(tr => {
          const cells = [];
          tr.querySelectorAll('td, th').forEach(td => {
            cells.push((td.textContent || '').trim());
          });
          if (cells.length > 0) {
            rows.push(cells);
          }
        });
        if (rows.length > 0) {
          results.push({ type: 'table', rows });
        }
      });
      
      return results;
    });
    
    console.log('\n找到的元素:');
    rooms.forEach((r, i) => {
      if (r.type === 'select') {
        console.log(`\n${i + 1}. [下拉選單] ${r.name}`);
        r.options.forEach(opt => console.log(`   - ${opt.text} (value: ${opt.value})`));
      } else if (r.type === 'table') {
        console.log(`\n${i + 1}. [表格]`);
        r.rows.forEach(row => console.log(`   | ${row.join(' | ')} |`));
      } else {
        console.log(`${i + 1}. [${r.tag}] ${r.text}${r.value ? ` (value: ${r.value})` : ''}`);
      }
    });
    
    // 截圖
    await page.screenshot({ path: 'nangang-app-room.png', fullPage: true });
    console.log('\n截圖已儲存: nangang-app-room.png');
    
  } catch (e) {
    console.log('錯誤:', e.message);
  }
  
  await browser.close();
}

main();
