// ===== 台灣企業活動場地媒合平台 v3.0 =====
// 針對大學畢業生優化版本

let venues = [];
let filteredVenues = [];
let currentDate = new Date();
let currentView = 'list';

// ===== 初始化 =====
document.addEventListener('DOMContentLoaded', function() {
    // 強制重新載入資料（解決快取問題）
    localStorage.removeItem('taiwanVenues');
    loadSampleData();
});

// 載入範例資料
function loadSampleData() {
    fetch('sample-data.json')
        .then(response => response.json())
        .then(data => {
            venues = data;
            filteredVenues = data;
            saveToLocalStorage();
            updateStats();
            renderVenues();
            console.log('✅ 已載入 ' + venues.length + ' 筆場地資料');
        })
        .catch(error => {
            console.error('❌ 載入資料失敗:', error);
            alert('資料載入失敗，請重新整理頁面');
        });
}

// ===== 新手引導流程 =====

// 活動類型選擇
function selectActivityType(type) {
    document.querySelectorAll('.activity-card').forEach(card => {
        card.classList.remove('selected');
    });
    event.currentTarget.classList.add('selected');

    // 根據活動類型自動篩選
    const typeMapping = {
        'meeting': { venueType: '會議場地', keywords: ['會議室', '培訓中心'] },
        'banquet': { venueType: '飯店場地', keywords: ['宴會廳', '飯店'] },
        'wedding': { venueType: '婚宴場地', keywords: ['婚宴', '宴會廳'] },
        'seminar': { venueType: '展演場地', keywords: ['展演', '演藝廳'] },
        'outdoor': { venueType: '飯店場地', keywords: ['戶外', '渡假村'] },
        'training': { venueType: '教育場地', keywords: ['教室', '培訓'] }
    };

    const mapping = typeMapping[type];
    if (mapping) {
        // 設定篩選條件
        filteredVenues = venues.filter(v => {
            return v.venueType === mapping.venueType ||
                   mapping.keywords.some(k => (v.type || '').includes(k));
        });
        renderVenues();
    }
}

// 人數選擇
function selectCapacity(range) {
    document.querySelectorAll('.capacity-card').forEach(card => {
        card.classList.remove('selected');
    });
    event.currentTarget.classList.add('selected');

    const capacityMapping = {
        'small': ['micro', 'small'],
        'medium': ['medium', 'medium-large'],
        'large': ['large', 'extra-large']
    };

    const categories = capacityMapping[range];
    if (categories) {
        filteredVenues = venues.filter(v => {
            return categories.includes(v.capacityCategory);
        });
        renderVenues();
    }
}

// 地區選擇
function selectRegion(region) {
    document.querySelectorAll('.region-card').forEach(card => {
        card.classList.remove('selected');
    });
    event.currentTarget.classList.add('selected');

    const regionMapping = {
        'taipei': ['台北市', '新北市'],
        'taoyuan': ['桃園市', '新竹市', '新竹縣'],
        'taichung': ['台中市', '彰化縣', '南投縣'],
        'tainan': ['台南市', '嘉義市', '嘉義縣'],
        'kaohsiung': ['高雄市', '屏東縣'],
        'east': ['宜蘭縣', '花蓮縣', '台東縣']
    };

    const cities = regionMapping[region];
    if (cities) {
        filteredVenues = venues.filter(v => {
            return cities.includes(v.city);
        });
        renderVenues();
    }
}

// 重置所有篩選
function resetAllFilters() {
    filteredVenues = venues;
    document.querySelectorAll('.activity-card, .capacity-card, .region-card').forEach(card => {
        card.classList.remove('selected');
    });
    document.getElementById('searchInput').value = '';
    document.getElementById('categoryFilter').value = '';
    document.getElementById('cityFilter').value = '';
    document.getElementById('capacityFilter').value = '';
    renderVenues();
}

// ===== 搜尋與篩選 =====

function searchVenues() {
    const keyword = document.getElementById('searchInput').value.trim().toLowerCase();
    if (!keyword) {
        filteredVenues = venues;
    } else {
        filteredVenues = venues.filter(v => {
            return (v.name || '').toLowerCase().includes(keyword) ||
                   (v.city || '').toLowerCase().includes(keyword) ||
                   (v.address || '').toLowerCase().includes(keyword) ||
                   (v.roomName || '').toLowerCase().includes(keyword);
        });
    }
    renderVenues();
}

function filterVenues() {
    const category = document.getElementById('categoryFilter').value;
    const city = document.getElementById('cityFilter').value;
    const capacity = document.getElementById('capacityFilter').value;

    filteredVenues = venues.filter(v => {
        // 修正：同時檢查 venueType 和 category
        const matchCategory = !category ||
                              v.venueType === category ||
                              v.category === category;

        const matchCity = !city || v.city === city;

        const matchCapacity = !capacity || v.capacityCategory === capacity;

        return matchCategory && matchCity && matchCapacity;
    });

    renderVenues();
}

// ===== 渲染場地列表 =====

function renderVenues() {
    const container = document.getElementById('venueList');
    const totalEl = document.getElementById('totalVenues');

    if (totalEl) {
        totalEl.textContent = filteredVenues.length;
    }

    if (filteredVenues.length === 0) {
        container.innerHTML = `
            <div class="no-results">
                <div class="no-results-icon">🔍</div>
                <h3>找不到符合條件的場地</h3>
                <p>試試看調整篩選條件，或<a href="#" onclick="resetAllFilters()">重置所有篩選</a></p>
            </div>
        `;
        return;
    }

    let html = '<div class="venue-grid">';

    filteredVenues.forEach(venue => {
        // 計算星級評分（基於價格透明度和設備完整度）
        const rating = calculateRating(venue);
        const stars = '⭐'.repeat(Math.floor(rating));

        // 標籤
        const tags = generateTags(venue);

        html += `
            <div class="venue-card" onclick="showVenueDetail(${venue.id})">
                <div class="venue-header">
                    <div class="venue-type-badge ${getBadgeClass(venue.venueType)}">${getTypeEmoji(venue.venueType)} ${venue.venueType}</div>
                    <div class="venue-rating">${stars} <span class="rating-number">${rating.toFixed(1)}</span></div>
                </div>

                <h3 class="venue-name">${venue.name}</h3>
                ${venue.roomName ? `<p class="venue-room">${venue.roomName}</p>` : ''}

                <div class="venue-info">
                    <div class="info-item">
                        <span class="info-icon">📍</span>
                        <span>${venue.city}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-icon">👥</span>
                        <span>可容納 ${getMaxCapacity(venue)} 人</span>
                    </div>
                    <div class="info-item">
                        <span class="info-icon">💰</span>
                        <span>${getPriceRange(venue)}</span>
                    </div>
                </div>

                <div class="venue-tags">
                    ${tags}
                </div>

                <div class="venue-actions">
                    <button class="btn-primary" onclick="event.stopPropagation(); showVenueDetail(${venue.id})">查看詳情</button>
                    <button class="btn-secondary" onclick="event.stopPropagation(); addToCompare(${venue.id})">加入比較</button>
                </div>
            </div>
        `;
    });

    html += '</div>';
    container.innerHTML = html;
}

// 計算評分
function calculateRating(venue) {
    let score = 3.0;

    // 價格透明度
    if (venue.priceHalfDay || venue.priceFullDay) score += 0.5;
    if (venue.pricePerHour) score += 0.3;

    // 聯絡資訊完整度
    if (venue.contactPhone && venue.contactEmail) score += 0.5;

    // 設備資訊
    if (venue.equipment) score += 0.3;

    // 容納人數明確
    if (venue.maxCapacityEmpty || venue.maxCapacityTheater) score += 0.4;

    return Math.min(5.0, Math.max(2.0, score));
}

// 生成標籤
function generateTags(venue) {
    let tags = [];

    if (venue.equipment && venue.equipment.includes('投影')) {
        tags.push('<span class="tag">📽️ 投影設備</span>');
    }

    if (venue.address && venue.address.includes('捷運')) {
        tags.push('<span class="tag">🚇 近捷運</span>');
    }

    if (venue.notes && venue.notes.includes('停車')) {
        tags.push('<span class="tag">🅿️ 有停車場</span>');
    }

    if (venue.contactEmail) {
        tags.push('<span class="tag">📧 可Email</span>');
    }

    if (venue.priceHalfDay && Number(venue.priceHalfDay) < 50000) {
        tags.push('<span class="tag tag-highlight">💎 CP值高</span>');
    }

    return tags.join('');
}

// 取得最大容納人數
function getMaxCapacity(venue) {
    return venue.maxCapacityEmpty ||
           venue.maxCapacityTheater ||
           venue.maxCapacityClassroom ||
           '未提供';
}

// 取得價格區間
function getPriceRange(venue) {
    if (venue.pricePerHour) {
        return `每小時 $${Number(venue.pricePerHour).toLocaleString()}`;
    } else if (venue.priceHalfDay) {
        return `半天 $${Number(venue.priceHalfDay).toLocaleString()}`;
    } else if (venue.priceFullDay) {
        return `全天 $${Number(venue.priceFullDay).toLocaleString()}`;
    }
    return '需詢價';
}

// 取得類型表情符號
function getTypeEmoji(type) {
    const emojis = {
        '飯店場地': '🏨',
        '會議場地': '📊',
        '展演場地': '🎭',
        '機關場地': '🏛️',
        '婚宴場地': '💒',
        '教育場地': '📚'
    };
    return emojis[type] || '🏢';
}

// 取得徽章樣式
function getBadgeClass(type) {
    const classes = {
        '飯店場地': 'badge-hotel',
        '會議場地': 'badge-meeting',
        '展演場地': 'badge-show',
        '機關場地': 'badge-gov',
        '婚宴場地': 'badge-wedding',
        '教育場地': 'badge-edu'
    };
    return classes[type] || 'badge-default';
}

// ===== 場地詳情 =====

function showVenueDetail(id) {
    const venue = venues.find(v => v.id === id);
    if (!venue) return;

    const modal = document.getElementById('venueModal');
    const content = document.getElementById('modalContent');

    const rating = calculateRating(venue);
    const stars = '⭐'.repeat(Math.floor(rating));

    content.innerHTML = `
        <div class="modal-header">
            <div class="modal-type-badge ${getBadgeClass(venue.venueType)}">${getTypeEmoji(venue.venueType)} ${venue.venueType}</div>
            <button class="modal-close" onclick="closeModal()">✕</button>
        </div>

        <div class="modal-body">
            <h2 class="modal-title">${venue.name}</h2>
            ${venue.roomName ? `<p class="modal-subtitle">${venue.roomName}</p>` : ''}

            <div class="modal-rating">${stars} <span class="rating-number">${rating.toFixed(1)}</span></div>

            <div class="modal-section">
                <h3>📋 基本資訊</h3>
                <div class="info-grid">
                    <div class="info-row">
                        <span class="info-label">📍 地點</span>
                        <span class="info-value">${venue.city} ${venue.address}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">👥 容納人數</span>
                        <span class="info-value">${getMaxCapacity(venue)} 人</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">🎯 活動規模</span>
                        <span class="info-value">${getCategoryName(venue.capacityCategory)}</span>
                    </div>
                </div>
            </div>

            <div class="modal-section">
                <h3>💰 價格資訊</h3>
                <div class="price-cards">
                    ${venue.pricePerHour ? `
                        <div class="price-card">
                            <div class="price-label">每小時</div>
                            <div class="price-value">$${Number(venue.pricePerHour).toLocaleString()}</div>
                        </div>
                    ` : ''}
                    ${venue.priceHalfDay ? `
                        <div class="price-card">
                            <div class="price-label">半天</div>
                            <div class="price-value">$${Number(venue.priceHalfDay).toLocaleString()}</div>
                        </div>
                    ` : ''}
                    ${venue.priceFullDay ? `
                        <div class="price-card">
                            <div class="price-label">全天</div>
                            <div class="price-value">$${Number(venue.priceFullDay).toLocaleString()}</div>
                        </div>
                    ` : ''}
                    ${!venue.pricePerHour && !venue.priceHalfDay && !venue.priceFullDay ? `
                        <div class="price-card">
                            <div class="price-label">價格</div>
                            <div class="price-value">需詢價</div>
                        </div>
                    ` : ''}
                </div>
            </div>

            <div class="modal-section">
                <h3>📞 聯絡資訊</h3>
                <div class="contact-cards">
                    ${venue.contactPhone ? `
                        <a href="tel:${venue.contactPhone}" class="contact-card">
                            <div class="contact-icon">📞</div>
                            <div class="contact-info">
                                <div class="contact-label">電話</div>
                                <div class="contact-value">${venue.contactPhone}</div>
                            </div>
                        </a>
                    ` : ''}
                    ${venue.contactEmail ? `
                        <a href="mailto:${venue.contactEmail}" class="contact-card">
                            <div class="contact-icon">📧</div>
                            <div class="contact-info">
                                <div class="contact-label">Email</div>
                                <div class="contact-value">${venue.contactEmail}</div>
                            </div>
                        </a>
                    ` : ''}
                </div>
            </div>

            ${venue.equipment ? `
                <div class="modal-section">
                    <h3>🎬 設備與服務</h3>
                    <p class="equipment-text">${venue.equipment}</p>
                </div>
            ` : ''}

            ${venue.notes ? `
                <div class="modal-section">
                    <h3>📝 注意事項</h3>
                    <p class="notes-text">${venue.notes}</p>
                </div>
            ` : ''}

            <div class="modal-actions">
                <a href="tel:${venue.contactPhone}" class="btn-action btn-call">📞 立即致電</a>
                <a href="mailto:${venue.contactEmail}" class="btn-action btn-email">📧 發送Email</a>
            </div>
        </div>
    `;

    modal.style.display = 'flex';
}

function closeModal() {
    document.getElementById('venueModal').style.display = 'none';
}

// 取得規模名稱
function getCategoryName(category) {
    const names = {
        'micro': '微型（50人以下）',
        'small': '小型（50-100人）',
        'medium': '中型（100-200人）',
        'medium-large': '中大型（200-500人）',
        'large': '大型（500-1000人）',
        'extra-large': '超大型（1000人以上）'
    };
    return names[category] || '未分類';
}

// ===== 比較功能 =====

let compareList = [];

function addToCompare(id) {
    if (compareList.includes(id)) {
        alert('此場地已在比較清單中');
        return;
    }

    if (compareList.length >= 3) {
        alert('最多只能比較 3 個場地');
        return;
    }

    compareList.push(id);
    alert('已加入比較清單（' + compareList.length + '/3）');
}

// ===== 統計更新 =====

function updateStats() {
    const totalEl = document.getElementById('totalVenues');
    if (totalEl) {
        totalEl.textContent = venues.length;
    }
}

// ===== 儲存功能 =====

function saveToLocalStorage() {
    localStorage.setItem('taiwanVenues', JSON.stringify(venues));
}

// ===== 點擊外部關閉 Modal =====

window.onclick = function(event) {
    const modal = document.getElementById('venueModal');
    if (event.target === modal) {
        closeModal();
    }
}

// ===== 快速篩選功能 =====

function quickFilter(category) {
    document.getElementById('categoryFilter').value = category;
    filterVenues();
}

function filterEnterpriseVenues() {
    const enterpriseTypes = ['飯店場地', '會議場地', '展演場地', '教育場地'];

    filteredVenues = venues.filter(venue => {
        return enterpriseTypes.includes(venue.venueType) ||
               enterpriseTypes.includes(venue.category);
    });

    renderVenues();
}
