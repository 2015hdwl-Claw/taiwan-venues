const fs = require('fs');

// 自動搜尋正確 URL 的腳本
class URLSearcher {
  constructor() {
    this.results = {
      total: 0,
      found: 0,
      notFound: 0,
      venues: []
    };
  }

  async searchVenue(venue) {
    const searchTerm = `${venue.name} ${venue.city} 官方網站`;
    
    try {
      console.log(`\n🔍 搜尋: ${venue.name} (${venue.city})`);
      console.log(`   搜尋詞: ${searchTerm}`);
      
      // 使用 web_search 工具搜尋
      const searchResults = await this.webSearch(searchTerm);
      
      if (searchResults && searchResults.length > 0) {
        // 找到最可能的官方網站
        const officialUrl = this.findOfficialUrl(searchResults, venue.name);
        
        if (officialUrl) {
          console.log(`   ✅ 找到: ${officialUrl}`);
          return {
            status: 'found',
            url: officialUrl,
            searchResults: searchResults.slice(0, 3)
          };
        }
      }
      
      console.log(`   ❌ 未找到官方網站`);
      return {
        status: 'not_found',
        url: null,
        searchResults: searchResults ? searchResults.slice(0, 3) : []
      };
    } catch (error) {
      console.log(`   ❌ 搜尋錯誤: ${error.message}`);
      return {
        status: 'error',
        url: null,
        error: error.message
      };
    }
  }

  async webSearch(query) {
    // 這裡需要調用實際的 web_search 工具
    // 由於我們在 Node.js 環境中，我們需要模擬或使用外部工具
    // 暫時返回空陣列，實際使用時需要整合
    return [];
  }

  findOfficialUrl(searchResults, venueName) {
    // 優先尋找包含場地名稱的官方網站
    for (const result of searchResults) {
      const url = result.url || result.link;
      const title = result.title || '';
      
      // 檢查是否是官方網站
      if (this.isOfficialSite(url, title, venueName)) {
        return url;
      }
    }
    
    // 如果沒有找到明確的官方網站，返回第一個結果
    if (searchResults.length > 0) {
      return searchResults[0].url || searchResults[0].link;
    }
    
    return null;
  }

  isOfficialSite(url, title, venueName) {
    // 檢查 URL 和標題是否包含場地名稱的關鍵字
    const keywords = venueName.split(/[\s\-\_\.]/);
    const urlLower = url.toLowerCase();
    const titleLower = title.toLowerCase();
    
    // 檢查是否包含至少一個關鍵字
    const hasKeyword = keywords.some(keyword => 
      keyword.length > 2 && 
      (urlLower.includes(keyword.toLowerCase()) || titleLower.includes(keyword.toLowerCase()))
    );
    
    // 檢查是否是官方網站的特徵
    const isOfficial = 
      urlLower.includes('official') ||
      urlLower.includes('com.tw') ||
      urlLower.includes('.tw') ||
      titleLower.includes('官方') ||
      titleLower.includes('official');
    
    return hasKeyword || isOfficial;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// 主程式
async function main() {
  const searcher = new URLSearcher();

  try {
    // 讀取失敗的 URL 清單
    const failedUrls = JSON.parse(fs.readFileSync('repaired-failed-urls.json', 'utf8'));

    console.log('📊 失敗 URL 清單\n');
    console.log('總數:', failedUrls.length);

    console.log('\n⚠️ 注意: 此腳本需要整合 web_search 工具才能正常運作');
    console.log('請使用 OpenClaw 的 web_search 工具進行搜尋\n');

    // 保存範例清單供手動搜尋使用
    const searchList = failedUrls.map(v => ({
      name: v.name,
      city: v.city,
      oldUrl: v.url,
      error: v.error
    }));

    fs.writeFileSync(
      'venues-to-search.json',
      JSON.stringify(searchList, null, 2)
    );

    console.log('✅ 已生成搜尋清單: venues-to-search.json');
    console.log('\n建議使用 web_search 工具逐個搜尋這些場地');

  } catch (error) {
    console.error('❌ 錯誤:', error.message);
  }
}

main();
