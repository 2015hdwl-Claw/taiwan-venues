// ===== 活動大師 EventMaster - 純靜態版本 =====
// 不依賴 API，所有資料都在前端

// ===== 全局變數 =====
let filteredVenues = [];
let currentPage = 1;
const VENUES_PER_PAGE = 20;

// ===== 初始化 =====
document.addEventListener('DOMContentLoaded', () => {
    // 載入縣市選項
    loadCityOptions();
    
    // 載入場地類型選項
    loadTypeOptions();
    
    // 顯示所有場地
    filteredVenues = VENUES_DATA;
    renderVenues();
    
    // 綁定搜尋框
    document.getElementById('heroSearch').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') quickSearch();
    });
});

// ===== 載入縣市選項 =====
function loadCityOptions() {
    const cities = [...new Set(VENUES_DATA.map(v => v.city))].sort();
    
    const citySelect = document.getElementById('cityFilter');
    const eventCitySelect = document.getElementById('eventCity');
    
    cities.forEach(city => {
        const option = document.createElement('option');
        option.value = city;
        option.textContent = city;
        citySelect.appendChild(option);
        
        const option2 = option.cloneNode(true);
        eventCitySelect.appendChild(option2);
    });
}

// ===== 載入場地類型選項 =====
function loadTypeOptions() {
    const types = [...new Set(VENUES_DATA.map(v => v.venueType).filter(t => t))].sort();
    
    const typeSelect = document.getElementById('typeFilter');
    types.forEach(type => {
        const option = document.createElement('option');
        option.value = type;
        option.textContent = type;
        typeSelect.appendChild(option);
    });
}

// ===== 快速搜尋 =====
function quickSearch() {
    const keyword = document.getElementById('heroSearch').value.trim();
    
    if (keyword) {
        filteredVenues = VENUES_DATA.filter(v => 
            v.name.includes(keyword) || 
            v.city.includes(keyword) ||
            v.address?.includes(keyword) ||
            v.venueType?.includes(keyword)
        );
    } else {
        filteredVenues = VENUES_DATA;
    }
    
    currentPage = 1;
    renderVenues();
    
    // 滾動到結果區
    document.getElementById('search').scrollIntoView({ behavior: 'smooth' });
}

// ===== 應用篩選 =====
function applyFilters() {
    const city = document.getElementById('cityFilter').value;
    const type = document.getElementById('typeFilter').value;
    const capacity = document.getElementById('capacityFilter').value;
    const price = document.getElementById('priceFilter').value;
    
    filteredVenues = VENUES_DATA.filter(v => {
        // 縣市篩選
        if (city && v.city !== city) return false;
        
        // 類型篩選
        if (type && v.venueType !== type) return false;
        
        // 容納人數篩選
        if (capacity) {
            const cap = v.maxCapacity || v.maxCapacityTheater || 0;
            if (capacity === '500+') {
                if (cap < 500) return false;
            } else {
                if (cap > parseInt(capacity)) return false;
            }
        }
        
        // 價格篩選
        if (price) {
            const p = v.priceHalfDay || v.minPrice || 0;
            if (price === '100000+') {
                if (p < 100000) return false;
            } else {
                if (p > parseInt(price)) return false;
            }
        }
        
        return true;
    });
    
    currentPage = 1;
    renderVenues();
}

// ===== 重設篩選 =====
function resetFilters() {
    document.getElementById('cityFilter').value = '';
    document.getElementById('typeFilter').value = '';
    document.getElementById('capacityFilter').value = '';
    document.getElementById('priceFilter').value = '';
    document.getElementById('heroSearch').value = '';
    
    filteredVenues = VENUES_DATA;
    currentPage = 1;
    renderVenues();
}

// ===== 渲染場地列表 =====
function renderVenues() {
    const grid = document.getElementById('venuesGrid');
    const countEl = document.getElementById('resultsCount');
    
    // 更新計數
    countEl.textContent = `找到 ${filteredVenues.length} 個場地`;
    
    // 分頁
    const start = (currentPage - 1) * VENUES_PER_PAGE;
    const end = start + VENUES_PER_PAGE;
    const pageVenues = filteredVenues.slice(start, end);
    
    if (pageVenues.length === 0) {
        grid.innerHTML = `
            <div class="no-results">
                <p>沒有找到符合條件的場地</p>
                <button onclick="resetFilters()" class="btn btn-secondary">重設篩選</button>
            </div>
        `;
        return;
    }
    
    // 渲染卡片
    grid.innerHTML = pageVenues.map(venue => `
        <div class="venue-card" onclick="showVenueDetail(${venue.id})">
            <div class="venue-image">
                ${venue.images?.main 
                    ? `<img src="${venue.images.main}" alt="${venue.name}" loading="lazy" onerror="this.parentElement.innerHTML='<div class=\\'venue-image-placeholder\\'>🏢</div>'">`
                    : `<div class="venue-image-placeholder">🏢</div>`
                }
                ${venue.verified ? '<span class="venue-badge verified">✓ 已驗證</span>' : ''}
            </div>
            
            <div class="venue-info">
                <h3 class="venue-name">${venue.name}</h3>
                
                <div class="venue-meta">
                    <span class="venue-type">${venue.venueType || '場地'}</span>
                    <span class="venue-city">📍 ${venue.city}</span>
                </div>
                
                <p class="venue-address">${venue.address || '地址未提供'}</p>
                
                <div class="venue-stats">
                    <div class="stat">
                        <span class="stat-icon">👥</span>
                        <span class="stat-value">${venue.maxCapacity || venue.maxCapacityTheater || '-'} 人</span>
                    </div>
                    <div class="stat">
                        <span class="stat-icon">💰</span>
                        <span class="stat-value">${formatPrice(venue.priceHalfDay || venue.minPrice)}</span>
                    </div>
                </div>
                
                <div class="venue-actions">
                    <button class="btn btn-primary btn-sm" onclick="event.stopPropagation(); showVenueDetail(${venue.id})">
                        查看詳情
                    </button>
                </div>
            </div>
        </div>
    `).join('');
    
    // 分頁控制
    if (filteredVenues.length > VENUES_PER_PAGE) {
        grid.innerHTML += `
            <div class="pagination">
                ${currentPage > 1 ? `<button onclick="prevPage()" class="btn btn-secondary">上一頁</button>` : ''}
                <span class="page-info">第 ${currentPage} 頁 / 共 ${Math.ceil(filteredVenues.length / VENUES_PER_PAGE)} 頁</span>
                ${end < filteredVenues.length ? `<button onclick="nextPage()" class="btn btn-secondary">下一頁</button>` : ''}
            </div>
        `;
    }
}

// ===== 分頁控制 =====
function nextPage() {
    currentPage++;
    renderVenues();
    document.getElementById('search').scrollIntoView({ behavior: 'smooth' });
}

function prevPage() {
    currentPage--;
    renderVenues();
    document.getElementById('search').scrollIntoView({ behavior: 'smooth' });
}

// ===== 格式化價格 =====
function formatPrice(price) {
    if (!price) return '電洽';
    if (price >= 10000) {
        return `${(price / 10000).toFixed(0)} 萬`;
    }
    return `${price.toLocaleString()} 元`;
}

// ===== 顯示場地詳情 =====
function showVenueDetail(venueId) {
    const venue = VENUES_DATA.find(v => v.id === venueId);
    if (!venue) return;
    
    const detailHtml = `
        <div class="venue-detail">
            <div class="venue-detail-image">
                ${venue.images?.main 
                    ? `<img src="${venue.images.main}" alt="${venue.name}">`
                    : `<div class="venue-image-placeholder large">🏢</div>`
                }
            </div>
            
            <h2>${venue.name}</h2>
            ${venue.verified ? '<span class="verified-badge">✓ 資料已驗證</span>' : ''}
            
            <div class="venue-detail-meta">
                <span>${venue.venueType || '場地'}</span>
                <span>📍 ${venue.city}</span>
            </div>
            
            <div class="venue-detail-section">
                <h3>📍 地址</h3>
                <p>${venue.address || '未提供'}</p>
            </div>
            
            <div class="venue-detail-section">
                <h3>👥 容納人數</h3>
                <p>劇院式：${venue.maxCapacityTheater || venue.maxCapacity || '-'} 人</p>
                ${venue.maxCapacityClassroom ? `<p>課桌式：${venue.maxCapacityClassroom} 人</p>` : ''}
            </div>
            
            <div class="venue-detail-section">
                <h3>💰 價格</h3>
                <p>半天：${formatPrice(venue.priceHalfDay)}</p>
                ${venue.priceFullDay ? `<p>全天：${formatPrice(venue.priceFullDay)}</p>` : ''}
            </div>
            
            ${venue.equipment ? `
            <div class="venue-detail-section">
                <h3>🎬 設備</h3>
                <p>${venue.equipment}</p>
            </div>
            ` : ''}
            
            <div class="venue-detail-section">
                <h3>📞 聯絡資訊</h3>
                ${venue.contactPhone ? `<p>電話：${venue.contactPhone}</p>` : ''}
                ${venue.contactEmail ? `<p>Email：${venue.contactEmail}</p>` : ''}
                ${venue.url ? `<p><a href="${venue.url}" target="_blank" rel="noopener">官網連結</a></p>` : ''}
            </div>
            
            <div class="venue-detail-actions">
                <a href="#submit-demand" onclick="closeModal()" class="btn btn-primary btn-lg">立即諮詢</a>
                ${venue.url ? `<a href="${venue.url}" target="_blank" rel="noopener" class="btn btn-secondary btn-lg">前往官網</a>` : ''}
            </div>
        </div>
    `;
    
    document.getElementById('venueDetail').innerHTML = detailHtml;
    document.getElementById('venueModal').style.display = 'flex';
}

// ===== 關閉 Modal =====
function closeModal() {
    document.getElementById('venueModal').style.display = 'none';
}

// ===== 提交需求 =====
function submitDemand(event) {
    event.preventDefault();
    
    // 收集表單資料
    const formData = {
        eventType: document.getElementById('eventType').value,
        eventCapacity: document.getElementById('eventCapacity').value,
        eventBudget: document.getElementById('eventBudget').value,
        eventCity: document.getElementById('eventCity').value,
        eventDate: document.getElementById('eventDate').value,
        eventNote: document.getElementById('eventNote').value,
        contactName: document.getElementById('contactName').value,
        contactPhone: document.getElementById('contactPhone').value,
        contactEmail: document.getElementById('contactEmail').value,
        timestamp: new Date().toISOString()
    };
    
    // TODO: 發送到後端或 LINE
    console.log('需求已提交：', formData);
    
    // 顯示成功訊息
    document.getElementById('demandForm').reset();
    document.getElementById('successModal').style.display = 'flex';
}

function closeSuccessModal() {
    document.getElementById('successModal').style.display = 'none';
}

// ===== 點擊 Modal 外部關閉 =====
window.onclick = function(event) {
    const modal = document.getElementById('venueModal');
    const successModal = document.getElementById('successModal');
    
    if (event.target === modal) {
        closeModal();
    }
    if (event.target === successModal) {
        closeSuccessModal();
    }
}
