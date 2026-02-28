const fs = require('fs');

// URL 驗證腳本（使用 GET 請求）
class URLValidator {
  constructor() {
    this.results = {
      total: 0,
      valid: 0,
      failed: 0,
      errors: {
        dns: [],
        timeout: [],
        ssl: [],
        http404: [],
        http500: [],
        connection: [],
        other: []
      }
    };
  }

  async validateUrl(url, venueName) {
    const startTime = Date.now();
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const response = await fetch(url, {
        method: 'GET',
        signal: controller.signal,
        redirect: 'follow'
      });

      clearTimeout(timeoutId);
      const responseTime = Date.now() - startTime;

      if (response.ok || response.status === 200) {
        return {
          status: 'success',
          responseTime,
          statusCode: response.status
        };
      } else if (response.status === 404) {
        return {
          status: 'error',
          error: 'HTTP 404 Not Found',
          category: 'http404',
          responseTime
        };
      } else if (response.status >= 500) {
        return {
          status: 'error',
          error: `HTTP ${response.status} Server Error`,
          category: 'http500',
          responseTime
        };
      } else if (response.status === 403 || response.status === 405) {
        // 403 和 405 可能網站存在，只是不允許我們的請求
        return {
          status: 'warning',
          error: `HTTP ${response.status} (網站存在但不允許請求)`,
          category: 'other',
          responseTime
        };
      } else {
        return {
          status: 'error',
          error: `HTTP ${response.status}`,
          category: 'other',
          responseTime
        };
      }
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      // 分類錯誤
      if (error.name === 'AbortError') {
        return {
          status: 'error',
          error: 'Timeout (>15s)',
          category: 'timeout',
          responseTime
        };
      } else if (error.code === 'ENOTFOUND' || error.code === 'EAI_AGAIN') {
        return {
          status: 'error',
          error: 'DNS Error - Domain not found',
          category: 'dns',
          responseTime
        };
      } else if (error.code === 'ECONNREFUSED') {
        return {
          status: 'error',
          error: 'Connection refused',
          category: 'connection',
          responseTime
        };
      } else if (error.code === 'CERT_HAS_EXPIRED' || error.code === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE') {
        return {
          status: 'error',
          error: 'SSL Certificate Error',
          category: 'ssl',
          responseTime
        };
      } else {
        return {
          status: 'error',
          error: error.message,
          category: 'other',
          responseTime
        };
      }
    }
  }

  async validateAllUrls(venues) {
    console.log('🔍 開始驗證修正檔案中的 URL...\n');
    console.log(`總場地數: ${venues.length}\n`);

    this.results.total = venues.length;

    for (let i = 0; i < venues.length; i++) {
      const venue = venues[i];
      const progress = ((i + 1) / venues.length * 100).toFixed(1);

      console.log(`[${i + 1}/${venues.length}] (${progress}%) ${venue.name}`);
      console.log(`   URL: ${venue.url}`);

      const result = await this.validateUrl(venue.url, venue.name);

      if (result.status === 'success') {
        this.results.valid++;
        console.log(`   ✅ 成功 (${result.responseTime}ms)\n`);
      } else if (result.status === 'warning') {
        this.results.valid++;
        console.log(`   ⚠️ 警告: ${result.error} (${result.responseTime}ms)\n`);
      } else {
        this.results.failed++;
        this.results.errors[result.category].push({
          name: venue.name,
          city: venue.city,
          url: venue.url,
          error: result.error,
          responseTime: result.responseTime
        });
        console.log(`   ❌ 失敗: ${result.error} (${result.responseTime}ms)\n`);
      }

      // 避免請求過快
      await this.sleep(500);
    }

    return this.results;
  }

  generateReport() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 URL 驗證報告');
    console.log('='.repeat(60) + '\n');

    console.log('總體統計:');
    console.log(`  總場地數: ${this.results.total}`);
    console.log(`  ✅ 有效: ${this.results.valid} (${(this.results.valid / this.results.total * 100).toFixed(1)}%)`);
    console.log(`  ❌ 失敗: ${this.results.failed} (${(this.results.failed / this.results.total * 100).toFixed(1)}%)`);

    console.log('\n失敗原因分析:');
    console.log(`  DNS 錯誤: ${this.results.errors.dns.length}`);
    console.log(`  超時: ${this.results.errors.timeout.length}`);
    console.log(`  SSL 錯誤: ${this.results.errors.ssl.length}`);
    console.log(`  HTTP 404: ${this.results.errors.http404.length}`);
    console.log(`  HTTP 500: ${this.results.errors.http500.length}`);
    console.log(`  連線錯誤: ${this.results.errors.connection.length}`);
    console.log(`  其他: ${this.results.errors.other.length}`);

    // 生成詳細報告
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        total: this.results.total,
        valid: this.results.valid,
        failed: this.results.failed,
        successRate: (this.results.valid / this.results.total * 100).toFixed(1)
      },
      errors: this.results.errors
    };

    return report;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// 主程式
async function main() {
  const validator = new URLValidator();

  try {
    // 讀取修正檔案
    const repairedData = JSON.parse(fs.readFileSync('taiwan_venues_repaired_2026.json', 'utf8'));

    console.log('📊 修正檔案資訊\n');
    console.log('報告日期:', repairedData.report_date);
    console.log('更新數量:', repairedData.updated_count);
    console.log('場地數:', repairedData.venues.length);

    // 驗證所有 URL
    await validator.validateAllUrls(repairedData.venues);

    // 生成報告
    const report = validator.generateReport();

    // 保存報告
    fs.writeFileSync(
      'repaired-url-validation-report.json',
      JSON.stringify(report, null, 2)
    );

    console.log('\n✅ 報告已保存到: repaired-url-validation-report.json');

    // 生成失敗 URL 清單
    const failedUrls = [];
    Object.values(validator.results.errors).forEach(errorList => {
      errorList.forEach(item => {
        failedUrls.push(item);
      });
    });

    fs.writeFileSync(
      'repaired-failed-urls.json',
      JSON.stringify(failedUrls, null, 2)
    );

    console.log('✅ 失敗 URL 清單已保存到: repaired-failed-urls.json');

  } catch (error) {
    console.error('❌ 錯誤:', error.message);
  }
}

main();
