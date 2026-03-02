const { chromium } = require('playwright');
const fs = require('fs');

// 批次 5 場地列表
const venues = [
  {
    id: 83960,
    name: "台北香格里拉遠東國際大飯店",
    originalUrl: "https://www.shangri-la.com",
    city: "台北市"
  },
  {
    id: 63277,
    name: "台北國賓大飯店",
    originalUrl: "https://www.ambassadorhotel.com.tw",
    city: "台北市"
  },
  {
    id: 20173,
    name: "台北喜來登大飯店",
    originalUrl: "https://www.sheraton.com",
    city: "台北市"
  },
  {
    id: 1706,
    name: "台北喜瑞飯店",
    url: "https://www.ambience-hotel.com",
    city: "台北市"
  },
  {
    id: 2505,
    name: "台北北投會館",
    url: "https://www.beitou-hall.com",
    city: "台北市"
  }
];

async function verifyVenue(browser, venue) {
  const result = {
    id: venue.id,
    name: venue.name,
    url: venue.url || venue.originalUrl,
    venueListUrl: null,
    venueMainImageUrl: null,
    roomsCount: 0,
    status: '待修',
    notes: [],
    phases: {}
  };

  const page = await browser.newPage();
  
  try {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`驗證場地: ${venue.name} (ID: ${venue.id})`);
    console.log('='.repeat(60));
    
    // Phase 1: 官網驗證
    console.log('\n[Phase 1] 官網驗證');
    const url = venue.url || venue.originalUrl;
    
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      const title = await page.title();
      console.log(`  ✅ 官網可開啟: ${url}`);
      console.log(`  標題: ${title}`);
      result.phases.phase1 = 'OK';
    } catch (error) {
      console.log(`  ❌ 官網無法開啟: ${error.message}`);
      result.notes.push(`官網錯誤: ${error.message}`);
      result.phases.phase1 = 'ERROR';
      result.status = '待修';
      return result;
    }

    // Phase 2: 會議室頁面尋找
    console.log('\n[Phase 2] 會議室頁面尋找');
    const meetingKeywords = ['會議', '會議室', '宴會', '場地', '租借', '活動', 'meeting', 'conference', 'venue', 'banquet', 'event', 'wedding'];
    
    const links = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('a')).map(a => ({
        text: a.textContent.trim(),
        href: a.href
      }));
    });
    
    const meetingLinks = links.filter(link => {
      const text = link.text.toLowerCase();
      const href = link.href.toLowerCase();
      return meetingKeywords.some(k => text.includes(k) || href.includes(k));
    }).filter(link => !link.href.includes('#') && !link.href.includes('javascript:'));
    
    console.log(`  找到 ${meetingLinks.length} 個會議室相關連結`);
    
    if (meetingLinks.length > 0) {
      console.log('  前 5 個連結:');
      meetingLinks.slice(0, 5).forEach((link, i) => {
        console.log(`    ${i+1}. ${link.text} → ${link.href}`);
      });
      result.phases.phase2 = 'OK';
    } else {
      console.log('  ❌ 找不到會議室頁面');
      result.notes.push('找不到會議室頁面');
      result.phases.phase2 = 'FAILED';
    }

    // Phase 3: 嘗試開啟會議室頁面
    if (meetingLinks.length > 0) {
      console.log('\n[Phase 3] 會議室完整清單');
      const meetingUrl = meetingLinks[0].href;
      
      try {
        await page.goto(meetingUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });
        await page.waitForTimeout(2000);
        
        result.venueListUrl = meetingUrl;
        console.log(`  ✅ 會議室頁面: ${meetingUrl}`);
        
        // 尋找會議室清單
        const rooms = await page.evaluate(() => {
          const roomElements = document.querySelectorAll('[class*="room"], [class*="venue"], [class*="ballroom"], [class*="hall"]');
          const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4'));
          
          const roomNames = headings
            .filter(h => /廳|室|場地|會議室|宴會廳/.test(h.textContent))
            .map(h => h.textContent.trim());
          
          return {
            count: Math.max(roomElements.length, roomNames.length),
            names: roomNames
          };
        });
        
        result.roomsCount = rooms.count;
        console.log(`  會議室數量: ${rooms.count}`);
        if (rooms.names.length > 0) {
          console.log(`  會議室名稱: ${rooms.names.slice(0, 5).join(', ')}`);
        }
        
        result.phases.phase3 = 'OK';
      } catch (error) {
        console.log(`  ❌ 無法開啟會議室頁面: ${error.message}`);
        result.notes.push(`會議室頁面錯誤: ${error.message}`);
        result.phases.phase3 = 'ERROR';
      }
    }

    // Phase 4: 照片抓取
    console.log('\n[Phase 4] 照片抓取（場地外觀）');
    const photos = await page.evaluate(() => {
      const images = Array.from(document.querySelectorAll('img'))
        .filter(img => 
          img.src && 
          img.width > 200 && 
          img.height > 150 &&
          !img.src.includes('logo') &&
          !img.src.includes('icon') &&
          !img.src.includes('avatar') &&
          !img.src.includes('sprite') &&
          !img.src.includes('wikipedia') // 禁止第三方來源
        )
        .map(img => ({
          src: img.src,
          alt: img.alt || ''
        }));
      
      return images.slice(0, 5);
    });
    
    if (photos.length > 0) {
      console.log(`  ✅ 找到 ${photos.length} 張照片`);
      photos.forEach((photo, i) => {
        console.log(`    ${i+1}. ${photo.src.substring(0, 80)}...`);
      });
      result.venueMainImageUrl = photos[0].src;
      result.phases.phase4 = 'OK';
    } else {
      console.log('  ⚠️  未找到符合條件的照片');
      result.notes.push('缺少場地照片');
      result.phases.phase4 = 'WARNING';
    }

    // Phase 5: 品牌/機構場地檢查
    console.log('\n[Phase 5] 品牌/機構場地檢查');
    const brands = ['香格里拉', '國賓', '喜來登', '喜瑞', '北投'];
    const brand = brands.find(b => venue.name.includes(b));
    
    if (brand) {
      console.log(`  品牌: ${brand}`);
      console.log('  ⚠️  需檢查同品牌其他場地是否完整');
      result.phases.phase5 = 'CHECK';
    } else {
      result.phases.phase5 = 'N/A';
    }

    // Phase 6: 資料一致性檢查
    console.log('\n[Phase 6] 資料一致性檢查');
    if (result.venueMainImageUrl) {
      console.log(`  ✅ venueMainImageUrl 已設定`);
      result.phases.phase6 = 'OK';
    } else {
      console.log(`  ❌ 缺少 venueMainImageUrl`);
      result.phases.phase6 = 'FAILED';
    }

    // Phase 7: 狀態判定
    console.log('\n[Phase 7] 狀態判定');
    const phasesOk = Object.values(result.phases).filter(v => v === 'OK').length;
    const totalPhases = Object.keys(result.phases).length;
    
    if (phasesOk >= 4) {
      result.status = '上架';
      console.log(`  ✅ 狀態: 上架 (${phasesOk}/${totalPhases} 階段完成)`);
    } else if (phasesOk >= 2) {
      result.status = '待修';
      console.log(`  ⚠️  狀態: 待修 (${phasesOk}/${totalPhases} 階段完成)`);
    } else {
      result.status = '待修';
      console.log(`  ❌ 狀態: 待修 (${phasesOk}/${totalPhases} 階段完成)`);
    }

  } catch (error) {
    console.log(`\n❌ 驗證錯誤: ${error.message}`);
    result.notes.push(`驗證錯誤: ${error.message}`);
    result.status = '待修';
  } finally {
    await page.close();
  }
  
  return result;
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const results = [];
  
  for (const venue of venues) {
    const result = await verifyVenue(browser, venue);
    results.push(result);
  }
  
  await browser.close();
  
  // 輸出結果
  console.log('\n\n' + '='.repeat(60));
  console.log('批次 5 驗證結果總結');
  console.log('='.repeat(60));
  
  results.forEach(r => {
    console.log(`\nID: ${r.id}`);
    console.log(`名稱: ${r.name}`);
    console.log(`venueListUrl: ${r.venueListUrl || '(未找到)'}`);
    console.log(`venueMainImageUrl: ${r.venueMainImageUrl ? r.venueMainImageUrl.substring(0, 60) + '...' : '(未找到)'}`);
    console.log(`roomsCount: ${r.roomsCount}`);
    console.log(`狀態: ${r.status}`);
    console.log(`備註: ${r.notes.length > 0 ? r.notes.join('; ') : '(無)'}`);
  });
  
  // 保存結果
  const outputPath = '/root/.openclaw/workspace/taiwan-venues/batch5_verification_results.json';
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
  console.log(`\n結果已保存至: ${outputPath}`);
}

main().catch(console.error);
