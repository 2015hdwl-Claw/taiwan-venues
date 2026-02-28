const fs = require('fs');
const PDFParser = require('pdf2json');

async function extractPDFContent() {
  console.log('📄 使用 pdf2json 讀取 TICC 價目表 PDF...\n');

  return new Promise((resolve, reject) => {
    const pdfParser = new PDFParser();

    pdfParser.on('pdfParser_dataError', errData => {
      console.error('❌ 錯誤:', errData.parserError);
      reject(errData.parserError);
    });

    pdfParser.on('pdfParser_dataReady', pdfData => {
      console.log('✅ PDF 解析成功！\n');
      
      // 提取文字內容
      let text = '';
      pdfData.Pages.forEach((page, pageIndex) => {
        console.log(`\n--- 第 ${pageIndex + 1} 頁 ---\n`);
        
        page.Texts.forEach(textItem => {
          const textContent = decodeURIComponent(textItem.R[0].T);
          text += textContent + ' ';
          
          // 顯示每個文字項目
          if (textContent.trim()) {
            console.log(textContent);
          }
        });
      });

      // 保存到文字檔案
      fs.writeFileSync('ticc-price-list.txt', text);
      console.log('\n\n✅ 已保存到 ticc-price-list.txt');
      
      resolve(pdfData);
    });

    // 載入 PDF
    pdfParser.loadPDF('ticc-price-list.pdf');
  });
}

extractPDFContent();
