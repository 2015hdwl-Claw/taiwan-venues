const fs = require('fs');
const pdf = require('pdf-parse');

async function extractPDFContent() {
  console.log('📄 讀取 TICC 價目表 PDF...\n');

  try {
    const dataBuffer = fs.readFileSync('ticc-price-list.pdf');
    const data = await pdf(dataBuffer);

    console.log('✅ PDF 內容提取成功！\n');
    console.log('--- PDF 文字內容 ---\n');
    console.log(data.text);
    console.log('\n--- PDF 資訊 ---');
    console.log(`頁數: ${data.numpages}`);
    console.log(`文字長度: ${data.text.length} 字元`);

    // 保存到文字檔案
    fs.writeFileSync('ticc-price-list.txt', data.text);
    console.log('\n✅ 已保存到 ticc-price-list.txt');

  } catch (error) {
    console.error('❌ 錯誤:', error.message);
  }
}

extractPDFContent();
