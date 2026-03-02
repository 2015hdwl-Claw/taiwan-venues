const { chromium } = require('playwright');
const fs = require('fs');

async function main() {
  console.log('=== 政大公企中心會議室清單抓取 ===\n');
  
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  const url = 'https://cpbae.nccu.edu.tw/cpbae/space/introduction';
  console.log('URL:', url);
  
  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
    console.log('頁面已載入');
    
    // 等待頁面渲染
    await page.waitForTimeout(5000);
    
    // 取得標題
    const title = await page.title();
    console.log('標題:', title);
    
    // 取得所有文字內容
    const pageText = await page.evaluate(() => document.body.innerText);
    console.log('\n=== 頁面文字內容（前 2000 字）===');
    console.log(pageText.slice(0, 2000));
    
    // 尋找會議室相關元素
    console.log('\n=== 尋找會議室相關元素 ===');
    
    const rooms = await page.evaluate(() => {
      const results = [];
      
      // 方法 1: 尋找所有連結
      document.querySelectorAll('a').forEach(a => {
        const text = (a.textContent || '').trim();
        const href = a.href || '';
        if (text.length > 0 && text.length < 50 && href.includes('space')) {
          results.push({ type: 'link', text, href });
        }
      });
      
      // 方法 2: 尋找列表項目
      document.querySelectorAll('li, .item, .room, [class*="space"]').forEach(el => {
        const text = (el.textContent || '').trim();
        if (text.length > 2 && text.length < 100) {
          results.push({ type: 'item', text });
        }
      });
      
      // 方法 3: 尋找標題
      document.querySelectorAll('h1, h2, h3, h4, h5').forEach(el => {
        const text = (el.textContent || '').trim();
        if (text.length > 0 && text.length < 100) {
          results.push({ type: 'heading', text });
        }
      });
      
      return results;
    });
    
    console.log('\n找到的元素:');
    rooms.slice(0, 30).forEach((r, i) => {
      console.log(`${i + 1}. [${r.type}] ${r.text}${r.href ? ' | ' + r.href : ''}`);
    });
    
    // 檢查頁面 HTML 結構
    console.log('\n=== 頁面 HTML 結構（關鍵部分）===');
    const html = await page.evaluate(() => {
      // 尋找可能包含會議室清單的區塊
      const blocks = [];
      document.querySelectorAll('div, section, article').forEach(el => {
        const text = (el.textContent || '').trim();
        if (text.includes('會議') || text.includes('教室') || text.includes('場地')) {
          blocks.push({
            tag: el.tagName,
            class: el.className,
            text: text.slice(0, 200)
          });
        }
      });
      return blocks.slice(0, 10);
    });
    
    html.forEach((b, i) => {
      console.log(`\n${i + 1}. <${b.tag} class="${b.class}">`);
      console.log(b.text);
    });
    
  } catch (e) {
    console.log('錯誤:', e.message);
  }
  
  await browser.close();
  console.log('\n完成');
}

main();
