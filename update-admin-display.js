const fs = require('fs');

// 讀取 admin.html
let html = fs.readFileSync('admin.html', 'utf8');

// 找到並更新照片顯示部分
const oldImagesSection = `const images = venue.images || {};
    const imageKeys = Object.keys(images);
    const imagesHtml = imageKeys.length > 0 
        ? imageKeys.map(k => \`<div class="image-item"><img src="\${images[k]}" alt="\${k}" onerror="this.style.display='none'"></div>\`).join('')
        : '<p style="color:#888;font-size:0.85rem;">無照片</p>';`;

const newImagesSection = `const images = venue.images || {};
    let imagesHtml = '';
    
    // 顯示主照片（用於場地卡片）
    if (images.main) {
        imagesHtml += \`<div class="image-item" style="grid-column: span 2;">
            <img src="\${images.main}" alt="主照片（場地卡片用）" onerror="this.style.display='none'">
            <div style="position:absolute;bottom:0;left:0;right:0;background:rgba(0,0,0,0.7);color:white;padding:0.25rem;font-size:0.7rem;">主照片（場地卡片用）</div>
        </div>\`;
    }
    
    // 顯示 gallery 照片（用於會議室介紹）
    if (images.gallery && images.gallery.length > 0) {
        imagesHtml += images.gallery.map((url, i) => \`<div class="image-item">
            <img src="\${url}" alt="會議室照片 \${i+1}" onerror="this.style.display='none'">
            <div style="position:absolute;bottom:0;left:0;right:0;background:rgba(0,0,0,0.7);color:white;padding:0.25rem;font-size:0.7rem;">會議室照片 \${i+1}</div>
        </div>\`).join('');
    }
    
    // 顯示平面圖（如果有）
    if (images.floorPlan) {
        imagesHtml += \`<div class="image-item" style="grid-column: span 2;">
            <img src="\${images.floorPlan}" alt="平面圖" onerror="this.style.display='none'">
            <div style="position:absolute;bottom:0;left:0;right:0;background:rgba(0,0,0,0.7);color:white;padding:0.25rem;font-size:0.7rem;">平面圖</div>
        </div>\`;
    }
    
    if (!imagesHtml) {
        imagesHtml = '<p style="color:#888;font-size:0.85rem;">無照片</p>';
    }`;

// 替換舊的照片顯示代碼
if (html.includes(oldImagesSection)) {
    html = html.replace(oldImagesSection, newImagesSection);
    console.log('✅ 已更新照片顯示邏輯');
} else {
    console.log('⚠️ 找不到舊的照片顯示代碼，嘗試其他方式...');
    
    // 嘗試找到類似的代碼並替換
    const pattern = /const images = venue\.images \|\| \{\};[\s\S]*?const imagesHtml = [\s\S]*?;/
    
    if (pattern.test(html)) {
        html = html.replace(pattern, newImagesSection);
        console.log('✅ 已通過模式匹配更新照片顯示邏輯');
    } else {
        console.log('❌ 無法找到照片顯示代碼');
    }
}

// 添加照片顯示的樣式
const styleAddition = `
<style>
.image-item {
    position: relative;
    overflow: hidden;
}
.image-item img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}
.image-item > div {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    background: rgba(0,0,0,0.7);
    color: white;
    padding: 0.25rem;
    font-size: 0.7rem;
}
</style>
`;

// 在 </style> 前添加新樣式
if (!html.includes('.image-item img {')) {
    html = html.replace('</style>', styleAddition + '</style>');
    console.log('✅ 已添加照片樣式');
}

// 儲存更新後的 admin.html
fs.writeFileSync('admin.html', html, 'utf8');

console.log('\n✨ admin.html 更新完成！');
console.log('📝 照片現在會顯示：');
console.log('   1. 主照片（用於場地卡片）');
console.log('   2. Gallery 照片（用於會議室介紹）');
console.log('   3. 平面圖（如果有）');
