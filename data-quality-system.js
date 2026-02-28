const fs = require('fs');

console.log('🔄 嚴謹的資料品質檢查系統\n');

// 嚴謹的資料品質標準
const DATA_QUALITY_STANDARD = {
  requiredFields: [
    'name',
    'city',
    'address',
    'contactPhone',
    'url',
    'venueType'
  ],
  
  recommendedFields: [
    'images.main',
    'dimensions.area',
    'maxCapacityTheater',
    'priceHalfDay',
    'priceFullDay',
    'availableTimeWeekday',
    'contactEmail'
  ],
  
  qualityLevels: {
    COMPLETE: 'complete',
    PARTIAL: 'partial',
    INCOMPLETE: 'incomplete',
    UNVERIFIED: 'unverified',
    GUESSED: 'guessed'
  }
};

// 取得嵌套值
function getNestedValue(obj, path) {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : null;
  }, obj);
}

// 檢查單一場地的資料品質
function checkVenueQuality(venue) {
  const issues = [];
  let qualityLevel = 'COMPLETE';
  
  // 檢查必填欄位
  DATA_QUALITY_STANDARD.requiredFields.forEach(field => {
    const value = getNestedValue(venue, field);
    if (!value || value === '' || value === '請查詢官網' || value === null || value === undefined) {
      issues.push(`缺少必填欄位: ${field}`);
      qualityLevel = 'INCOMPLETE';
    }
  });
  
  // 檢查建議欄位
  DATA_QUALITY_STANDARD.recommendedFields.forEach(field => {
    const value = getNestedValue(venue, field);
    if (!value || value === '' || value === '請查詢官網' || value === null || value === undefined) {
      if (qualityLevel === 'COMPLETE') {
        qualityLevel = 'PARTIAL';
      }
      issues.push(`缺少建議欄位: ${field}`);
    }
  });
  
  // 檢查資料來源
  if (!venue.dataSource || !venue.verified) {
    qualityLevel = 'UNVERIFIED';
    issues.push('缺少資料來源標記');
  }
  
  // 檢查是否為猜測資料
  if (venue.notes && (
    venue.notes.includes('適合') || 
    venue.notes.includes('可能') ||
    venue.notes.includes('大約') ||
    venue.notes.includes('約')
  ) {
      qualityLevel = 'GUESSED';
      issues.push('資料可能為猜測');
    }
  
  return {
      qualityLevel,
      issues,
      hasAllRequired: DATA_QUALITY_STANDARD.requiredFields.every(f => {
        const value = getNestedValue(venue, f);
        return value && value !== '' && value !== '請查詢官網' && value !== null && value !== undefined;
      }),
      hasAllRecommended: DATA_QUALITY_STANDARD.recommendedFields.every(f => {
        const value = getNestedValue(venue, f);
        return value && value !== '' && value !== null && value !== undefined;
      })
    };
  }

// 批次檢查所有場地
function checkAllVenues() {
  const venues = JSON.parse(fs.readFileSync('sample-data.json', 'utf8'));
  const results = {
    total: venues.length,
    complete: 0,
    partial: 0,
    incomplete: 0,
    unverified: 0,
    guessed: 0,
    issues: []
  };
  
  venues.forEach(venue => {
    const quality = checkVenueQuality(venue);
    results[quality.qualityLevel]++;
    
    if (quality.issues.length > 0) {
      results.issues.push({
          id: venue.id,
          name: venue.name,
          roomName: venue.roomName,
          city: venue.city,
          qualityLevel: quality.qualityLevel,
          issues: quality.issues
        });
      }
    }
  });
  
  // 生成報告
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      total: results.total,
      complete: results.complete,
      partial: results.partial,
      incomplete: results.incomplete,
      unverified: results.unverified,
      guessed: results.guessed
    },
    details: results.issues
  };
  
  // 保存報告
  fs.writeFileSync(
    'venue-quality-report.json',
    JSON.stringify(report, null, 2)
  );
  
  // 顯示統計
  console.log('📊 匴地資料品質檢查報告\n');
  console.log(`總場地數: ${results.total}`);
  console.log(`✅ 完整: ${results.complete} (${((results.complete / results.total) * 100).toFixed(1)}%)`);
  console.log(`⚠️ 部分: ${results.partial} (${((results.partial / results.total) * 100).toFixed(1)}%)`);
  console.log(`❌ 不完整: ${results.incomplete} (${((results.incomplete / results.total) * 100).toFixed(1)}%)`);
  console.log(`⚠️ 未驗證: ${results.unverified} (${((results.unverified / results.total) * 100).toFixed(1)}%)`);
  console.log(`❌ 猭測: ${results.guessed} (${((results.guessed / results.total) * 100).toFixed(1)}%)`);
  
  console.log('\n詳細報告已保存到: venue-quality-report.json');
  
  return report;
}

// 嚴謹的資料更新函數
function updateVenueSafely(venueId, updates, source) {
  const venues = JSON.parse(fs.readFileSync('sample-data.json', 'utf8'));
  const index = venues.findIndex(v => v.id === venueId);
  
  if (index === -1) {
    throw new Error(`找不到場地 ID: ${venueId}`);
  }
  
  // 標記資料來源
  const sourceInfo = {
    dataSource: source,
    verified: true,
    verifiedAt: new Date().toISOString(),
    dataSourceUrl: updates.url || venues[index].url
  };
  
  // 合併更新
  venues[index] = {
    ...venues[index],
    ...updates,
    ...sourceInfo
  };
  
  // 保存
  fs.writeFileSync('sample-data.json', JSON.stringify(venues, null, 2));
  
  return venues[index];
}

// 匯出
module.exports = {
  DATA_QUALITY_STANDARD,
  checkVenueQuality,
  checkAllVenues,
  updateVenueSafely
};
