const { chromium } = require('playwright');
const fs = require('fs');

async function main() {
  console.log('=== 政大公企中心會議室清單抓取 ===\n');
  
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  // 嘗試多個可能的 URL
  const urls = [
    'https://pbt.nccu.edu.tw/zh_tw/Space',
    'https://pbt.nccu.edu.tw/',
    'https://www.nccu.edu.tw/p/403-1000-3915,236.php?Lang=zh-tw',
    'https://www.nccu.edu.tw/collegeresource',
    'https://sce.nccu.edu.tw/',
    'https://re.sce.nccu.edu.tw/',
  ];
  
  let foundUrl = null;
  
  for (const url of urls) {
    console.log('嘗試:', url);
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      const title = await page.title();
      console.log('  標題:', title);
      if (!title.includes('404') && !title.includes('Error')) {
        foundUrl = url;
        console.log('  ✅ 成功');
        break;
      }
    } catch (e) {
      console.log('  ❌', e.message.slice(0, 50));
    }
  }
  
  if (!foundUrl) {
    console.log('\n所有 URL 都無法連線，嘗試從政大首頁搜尋...');
    
    try {
      await page.goto('https://www.nccu.edu.tw', { waitUntil: 'domcontentloaded', timeout: 30000 });
      console.log('已開啟政大首頁');
      
      // 搜尋公企中心
      const searchInput = await page.$('input[type="search"], input[name="q"], input[placeholder*="搜尋"]');
      if (searchInput) {
        await searchInput.fill('公企中心 場地');
        await page.keyboard.press('Enter');
        await page.waitForTimeout(3000);
        
        const title = await page.title();
        console.log('搜尋結果頁:', title);
        
        // 抓取搜尋結果
        const links = await page.evaluate(() => {
          const results = [];
          document.querySelectorAll('a').forEach(a => {
            const text = (a.textContent || '').trim();
            const href = a.href;
            if (text.includes('公企') || text.includes('場地') || text.includes('會議')) {
              results.push({ text: text.slice(0, 50), href });
            }
          });
          return results.slice(0, 10);
        });
        
        console.log('\n找到的連結:');
        links.forEach(l => console.log('-', l.text, '|', l.href));
      }
    } catch (e) {
      console.log('錯誤:', e.message);
    }
  }
  
  await browser.close();
  console.log('\n完成');
}

main();
