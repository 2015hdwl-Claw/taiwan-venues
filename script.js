// ===== 現代化場地媒合平台 v3.2 Pro Max =====
// 漸進式揭示 + 現代化 UI + 場地詳細資訊

let venues = [];
let filteredVenues = [];
let currentStep = 1;
let selectedActivity = null;
let selectedCapacity = null;
let selectedRegion = null;

// ===== 初始化 =====
document.addEventListener('DOMContentLoaded', function() {
    loadSampleData();
});

// 載入範例資料
function loadSampleData() {
    fetch('sample-data.json')
        .then(response => response.json())
        .then(data => {
            venues = data;
            filteredVenues = data;
            updateVenueCount();
            renderVenues();
            console.log('✅ 已載入 ' + venues.length + ' 筆場地資料');
        })
        .catch(error => {
            console.error('❌ 載入資料失敗:', error);
            showEmptyState();
        });
}

// ===== 漸進式揭示邏輯 =====

function showStep(step) {
    // 隱藏所有步驟
    document.querySelectorAll('.guide-step').forEach(el => {
        el.classList.remove('active');
    });

    // 顯示目標步驟
    const targetStep = document.getElementById('step' + step);
    if (targetStep) {
        targetStep.classList.add('active');
    }

    // 更新進度點
    updateProgressDots(step);

    // 滾動到步驟
    setTimeout(() => {
        targetStep.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);

    currentStep = step;
}

function updateProgressDots(step) {
    const dots = document.querySelectorAll('.step-dot');
    dots.forEach((dot, index) => {
        if (index < step) {
            dot.classList.remove('active');
            dot.classList.add('completed');
        } else if (index === step) {
            dot.classList.remove('completed');
            dot.classList.add('active');
        } else {
            dot.classList.remove('active', 'completed');
        }
    });
}

// ===== 活動類型篩選 =====

function selectActivityType(type) {
    // 更新卡片選擇狀態
    document.querySelectorAll('.activity-card').forEach(card => {
        card.classList.remove('active');
    });
    event.currentTarget.classList.add('active');

    // 設定篩選條件
    selectedActivity = type;

    const activityMapping = {
        'meeting': '會議場地',
        'banquet': '飯店場地',
        'wedding': '婚宴場地',
        'seminar': '展演場地',
        'outdoor': '飯店場地',
        'training': '教育場地'
    };

    const activityName = activityMapping[type];

    // 篩選場地
    filterByActivity(activityName);

    // 顯示步驟 2
    setTimeout(() => {
        showStep(2);
    }, 300);
}

function filterByActivity(venueType) {
    filteredVenues = venues.filter(v => {
        return v.venueType === venueType || v.category === venueType;
    });

    renderVenues();
}

// ===== 規模篩選 =====

function selectCapacity(range) {
    // 更新卡片選擇狀態
    document.querySelectorAll('.capacity-card').forEach(card => {
        card.classList.remove('active');
    });
    event.currentTarget.classList.add('active');

    const capacityMapping = {
        'small': ['micro', 'small'],
        'medium': ['medium', 'medium-large'],
        'large': ['large', 'extra-large']
    };

    const categories = capacityMapping[range];
    selectedCapacity = categories;

    // 篩選場地
    filterByCapacity(categories);

    // 顯示步驟 3
    setTimeout(() => {
        showStep(3);
    }, 300);
}

function filterByCapacity(categories) {
    filteredVenues = venues.filter(v => {
        return categories.includes(v.capacityCategory);
    });

    renderVenues();
}

// ===== 地區篩選 =====

function selectRegion(region) {
    // 更新卡片選擇狀態
    document.querySelectorAll('.region-card').forEach(card => {
        card.classList.remove('active');
    });
    event.currentTarget.classList.add('active');

    const regionMapping = {
        'taipei': ['台北市', '新北市'],
        'taoyuan': ['桃園市', '新竹市', '新竹縣'],
        'taichung': ['台中市', '彰化縣', '南投縣'],
        'tainan': ['台南市', '嘉義市', '嘉義縣'],
        'kaohsiung': ['高雄市', '屏東縣'],
        'east': ['宜蘭縣', '花蓮縣', '台東縣']
    };

    const cities = regionMapping[region];
    selectedRegion = cities;

    // 篩選場地
    filterByRegion(cities);

    // 顯示步驟 4
    setTimeout(() => {
        showStep(4);
    }, 300);
}

function filterByRegion(cities) {
    filteredVenues = venues.filter(v => {
        return cities.includes(v.city);
    });

    renderVenues();
}

// ===== 場地渲染 =====

function renderVenues() {
    const container = document.getElementById('venuesSection');

    if (filteredVenues.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🔍</div>
                <h3>找不到符合條件的場地</h3>
                <p>試試看調整篩選條件，或重設所有篩選</p>
                <button onclick="resetAllFilters()">重設篩選</button>
            </div>
        `;
        return;
    }

    const html = `<div class="venues-grid">
        ${filteredVenues.map(venue => createVenueCard(venue)).join('')}
    </div>`;

    container.innerHTML = html;
}

function createVenueCard(venue) {
    const rating = calculateRating(venue);
    const stars = '⭐'.repeat(Math.floor(rating));
    const tags = generateTags(venue);

    return `
        <div class="venue-card" onclick="showVenueDetail(${venue.id})">
            <div class="venue-header">
                <div class="venue-badge">
                    ${getTypeEmoji(venue.venueType)} ${venue.venueType}
                </div>
                <div class="venue-rating">
                    <span class="venue-stars">${stars}</span>
                    <span class="venue-rating-number">${rating.toFixed(1)}</span>
                </div>
            </div>

            <h3 class="venue-name">${venue.name}</h3>
            ${venue.roomName ? `<p class="venue-subtitle">${venue.roomName}</p>` : ''}

            <div class="venue-info-grid">
                <div class="venue-info-item">
                    <span class="venue-info-icon">📍</span>
                    <div class="venue-info-content">
                        <div class="venue-info-label">地點</div>
                        <div class="venue-info-value">${venue.city}</div>
                    </div>
                </div>
                <div class="venue-info-item">
                    <span class="venue-info-icon">👥</span>
                    <div class="venue-info-content">
                        <div class="venue-info-label">可容納</div>
                        <div class="venue-info-value">${getMaxCapacity(venue)} 人</div>
                    </div>
                </div>
                <div class="venue-info-item">
                    <span class="venue-info-icon">💰</span>
                    <div class="venue-info-content">
                        <div class="venue-info-label">價格</div>
                        <div class="venue-info-value">${getPriceRange(venue)}</div>
                    </div>
                </div>
                <div class="venue-info-item">
                    <span class="venue-info-icon">⭐</span>
                    <div class="venue-info-content">
                        <div class="venue-info-label">評分</div>
                        <div class="venue-info-value">${rating.toFixed(1)}</div>
                    </div>
                </div>
            </div>

            ${tags.length > 0 ? `<div class="venue-tags">${tags}</div>` : ''}

            <div class="venue-price">
                <div>
                    <div class="venue-price-label">價格區間</div>
                    <div class="venue-price-value">${getPriceRange(venue)}</div>
                </div>
                <div style="font-size: 1.5em;">💳</div>
            </div>

            <div class="venue-actions">
                <button class="btn-primary" onclick="event.stopPropagation(); showVenueDetail(${venue.id})">
                    查看詳情
                </button>
                <button class="btn-secondary" onclick="event.stopPropagation(); addToCompare(${venue.id})">
                    加入比較
                </button>
            </div>
        </div>
    `;
}

// 計算評分
function calculateRating(venue) {
    let score = 3.0;

    if (venue.priceHalfDay || venue.priceFullDay) score += 0.5;
    if (venue.pricePerHour) score += 0.3;

    if (venue.contactPhone && venue.contactEmail) score += 0.5;

    if (venue.equipment) score += 0.3;

    if (venue.maxCapacityEmpty || venue.maxCapacityTheater) score += 0.4;

    return Math.min(5.0, Math.max(2.0, score));
}

// 生成標籤
function generateTags(venue) {
    let tags = [];

    if (venue.equipment && venue.equipment.includes('投影')) {
        tags.push('<span class="venue-tag">📽️ 投影設備</span>');
    }

    if (venue.address && venue.address.includes('捷運')) {
        tags.push('<span class="venue-tag">🚇 近捷運</span>');
    }

    if (venue.notes && venue.notes.includes('停車')) {
        tags.push('<span class="venue-tag">🅿️ 有停車場</span>');
    }

    if (venue.contactEmail) {
        tags.push('<span class="venue-tag">📧 可Email</span>');
    }

    if (venue.priceHalfDay && Number(venue.priceHalfDay) < 50000) {
        tags.push('<span class="venue-tag featured">💎 CP值高</span>');
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
        return `$${Number(venue.pricePerHour).toLocaleString()}/時`;
    } else if (venue.priceHalfDay) {
        return `$${Number(venue.priceHalfDay).toLocaleString()}/半天`;
    } else if (venue.priceFullDay) {
        return `$${Number(venue.priceFullDay).toLocaleString()}/全天`;
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

function resetAllFilters() {
    filteredVenues = venues;
    selectedActivity = null;
    selectedCapacity = null;
    selectedRegion = null;

    // 重置所有卡片
    document.querySelectorAll('.activity-card').forEach(card => card.classList.remove('active'));
    document.querySelectorAll('.capacity-card').forEach(card => card.classList.remove('active'));
    document.querySelectorAll('.region-card').forEach(card => card.classList.remove('active'));
    document.getElementById('searchInput').value = '';
    document.getElementById('categoryFilter').value = '';
    document.getElementById('cityFilter').value = '';
    document.getElementById('capacityFilter').value = '';

    // 顯示步驟 1
    showStep(1);

    renderVenues();
}

function updateVenueCount() {
    const countEl = document.getElementById('totalVenues');
    if (countEl) {
        countEl.textContent = venues.length;
    }
}

// ===== 場地詳情 Modal =====

function showVenueDetail(id) {
    const venue = venues.find(v => v.id === id);
    if (!venue) return;

    const modal = document.getElementById('venueModal');
    const content = document.getElementById('modalContent');
    const badge = document.getElementById('modalBadge');

    const rating = calculateRating(venue);
    const stars = '⭐'.repeat(Math.floor(rating));

    badge.innerHTML = `${getTypeEmoji(venue.venueType)} ${venue.venueType}`;

    content.innerHTML = `
        <h2 class="modal-title">${venue.name}</h2>
        ${venue.roomName ? `<p class="modal-subtitle">${venue.roomName}</p>` : ''}

        <div class="modal-rating">
            <span class="venue-stars">${stars}</span>
            <span class="venue-rating-number">${rating.toFixed(1)}</span>
        </div>

        <div class="modal-section">
            <h3>📋 基本資訊</h3>
            <div class="info-row">
                <span class="info-label">📍 地點</span>
                <span class="info-value">${venue.city} ${venue.address}</span>
            </div>
            <div class="info-row">
                <span class="info-label">👥 可容納人數</span>
                <span class="info-value">${getMaxCapacity(venue)} 人</span>
            </div>
            <div class="info-row">
                <span class="info-label">🎯 活動規模</span>
                <span class="info-value">${getCategoryName(venue.capacityCategory)}</span>
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
            <div class="contact-card">
                <span class="contact-icon">📞</span>
                <div class="contact-info">
                    <div class="contact-label">電話</div>
                    <div class="contact-value">${venue.contactPhone || '未提供'}</div>
                </div>
            </div>
            ${venue.contactEmail ? `
                <a href="mailto:${venue.contactEmail}" class="contact-card">
                    <span class="contact-icon">📧</span>
                    <div class="contact-info">
                        <div class="contact-label">Email</div>
                        <div class="contact-value">${venue.contactEmail}</div>
                    </div>
                </a>
            ` : ''}
        </div>

        ${venue.equipment ? `
            <div class="modal-section">
                <h3>🎬 設備與服務</h3>
                <ul class="equipment-list">
                    ${venue.equipment.split('、').map(item => `<li>${item}</li>`).join('')}
                </ul>
            </div>
        ` : ''}

        ${venue.notes ? `
            <div class="modal-section">
                <h3>📝 注意事項</h3>
                <p style="color: var(--text-secondary); line-height: 1.6;">${venue.notes}</p>
            </div>
        ` : ''}

        <div class="modal-actions">
            <a href="tel:${venue.contactPhone}" class="btn-action btn-call">
                📞 立即致電
            </a>
            ${venue.contactEmail ? `
                <a href="mailto:${venue.contactEmail}" class="btn-action btn-email">
                    📧 發送Email
                </a>
            ` : ''}
        </div>
    `;

    modal.classList.add('active');
}

function closeModal() {
    document.getElementById('venueModal').classList.remove('active');
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

// ===== 工具函數 =====

function showEmptyState() {
    const container = document.getElementById('venuesSection');
    container.innerHTML = `
        <div class="empty-state">
            <div class="empty-state-icon">📭</div>
            <h3>暫無資料</h3>
            <p>資料載入中，請稍後再試</p>
        </div>
    `;
}

// ===== 點擊外部關閉 Modal =====

window.onclick = function(event) {
    const modal = document.getElementById('venueModal');
    if (event.target === modal) {
        closeModal();
    }
}
