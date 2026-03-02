const { chromium } = require('playwright');

async function main() {
  console.log('=== 南港展覽館會議室收費基準 ===\n');
  
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    const url = 'https://www.tainex.com.tw/venue/app-room/1';
    console.log('URL:', url);
    
    await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(3000);
    
    // 尋找所有連結
    const links = await page.evaluate(() => {
      const results = [];
      document.querySelectorAll('a').forEach(a => {
        const text = (a.textContent || '').trim();
        const href = a.href || '';
        if (text.length > 0 && href.length > 0) {
          results.push({ text: text.slice(0, 80), href });
        }
      });
      return results;
    });
    
    console.log('=== 所有連結 ===');
    links.forEach((l, i) => {
      if (l.text.includes('收費') || l.text.includes('會議室') || l.text.includes('附件')) {
        console.log(`${i + 1}. ${l.text}`);
        console.log(`   ${l.href}\n`);
      }
    });
    
    // 找收費基準 PDF
    const feeLink = links.find(l => l.text.includes('收費基準'));
    if (feeLink) {
      console.log('\n=== 收費基準文件 ===');
      console.log('URL:', feeLink.href);
      
      // 如果是 PDF，下載
      if (feeLink.href.includes('.pdf')) {
        console.log('這是 PDF 文件，需要手動下載查看');
      } else {
        // 嘗試開啟
        await page.goto(feeLink.href, { waitUntil: 'networkidle', timeout: 30000 });
        await page.waitForTimeout(3000);
        
        const content = await page.evaluate(() => document.body.innerText);
        console.log('\n內容（前 2000 字）:');
        console.log(content.slice(0, 2000));
      }
    }
    
  } catch (e) {
    console.log('錯誤:', e.message);
  }
  
  await browser.close();
}

main();
