// ===== 全局變數 =====
let venues = [];
let compareList = [];
let currentTypeIndex = 0;

// 活動類型定義
const activityTypes = [
    {
        id: 'meeting',
        icon: '💼',
        title: '公司會議',
        subtitle: '企業會議、培訓、研討會',
        filter: v => v.venueType === '會議場地' || v.type?.includes('會議')
    },
    {
        id: 'banquet',
        icon: '🎉',
        title: '尾牙春酒',
        subtitle: '企業活動、聚餐、發表會',
        filter: v => v.type?.includes('宴會') || v.venueType === '飯店場地'
    },
    {
        id: 'wedding',
        icon: '💒',
        title: '婚禮婚宴',
        subtitle: '婚禮、訂婚宴、喜宴',
        filter: v => v.type?.includes('宴會') && v.maxCapacityTheater >= 200
    },
    {
        id: 'exhibition',
        icon: '🎨',
        title: '展覽活動',
        subtitle: '展覽、市集、發表會',
        filter: v => v.venueType === '展演場地' || v.type?.includes('展演')
    },
    {
        id: 'outdoor',
        icon: '🌳',
        title: '戶外活動',
        subtitle: '戶外派對、團建活動',
        filter: v => v.type?.includes('戶外') || v.notes?.includes('戶外')
    },
    {
        id: 'training',
        icon: '📚',
        title: '教育訓練',
        subtitle: '課程、工作坊、講座',
        filter: v => v.type?.includes('會議') && v.maxCapacityTheater <= 100
    }
];

// ===== 初始化 =====
document.addEventListener('DOMContentLoaded', async () => {
    await loadVenues();
    renderTypeCarousel();
    updateCarouselIndicators();
});

// ===== 載入資料 =====
async function loadVenues() {
    try {
        const response = await fetch('sample-data.json');
        venues = await response.json();
        console.log(`✅ 載入 ${venues.length} 個場地`);
    } catch (error) {
        console.error('載入場地失敗:', error);
        venues = [];
    }
}

// ===== 活動類型 Carousel =====
function renderTypeCarousel() {
    const carousel = document.getElementById('typeCarousel');
    
    carousel.innerHTML = activityTypes.map((type, index) => {
        const count = venues.filter(type.filter).length;
        return `
            <div class="type-card" onclick="selectType(${index})">
                <div class="type-card-content">
                    <span class="type-card-icon">${type.icon}</span>
                    <h2 class="type-card-title">${type.title}</h2>
                    <p class="type-card-subtitle">${type.subtitle}</p>
                    <div class="type-card-count">
                        ${count} 個場地
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function prevType() {
    const carousel = document.getElementById('typeCarousel');
    const cardWidth = carousel.querySelector('.type-card')?.offsetWidth || 380;
    carousel.scrollBy({ left: -cardWidth - 24, behavior: 'smooth' });
    updateCarouselIndicators();
}

function nextType() {
    const carousel = document.getElementById('typeCarousel');
    const cardWidth = carousel.querySelector('.type-card')?.offsetWidth || 380;
    carousel.scrollBy({ left: cardWidth + 24, behavior: 'smooth' });
    updateCarouselIndicators();
}

function updateCarouselIndicators() {
    const carousel = document.getElementById('typeCarousel');
    const indicators = document.getElementById('carouselIndicators');
    const cards = carousel.querySelectorAll('.type-card');
    const cardWidth = cards[0]?.offsetWidth || 380;
    
    indicators.innerHTML = activityTypes.map((_, index) => `
        <div class="carousel-indicator ${index === 0 ? 'active' : ''}" 
             onclick="scrollToType(${index})"></div>
    `).join('');
    
    // 監聽滾動更新指示器
    carousel.addEventListener('scroll', () => {
        const scrollLeft = carousel.scrollLeft;
        const currentIndex = Math.round(scrollLeft / (cardWidth + 24));
        document.querySelectorAll('.carousel-indicator').forEach((ind, i) => {
            ind.classList.toggle('active', i === currentIndex);
        });
    });
}

function scrollToType(index) {
    const carousel = document.getElementById('typeCarousel');
    const cards = carousel.querySelectorAll('.type-card');
    const cardWidth = cards[0]?.offsetWidth || 380;
    carousel.scrollTo({ left: index * (cardWidth + 24), behavior: 'smooth' });
}

// ===== 選擇活動類型 =====
function selectType(index) {
    currentTypeIndex = index;
    const type = activityTypes[index];
    
    // 隱藏選擇器，顯示場地列表
    document.getElementById('typeSelectorSection').style.display = 'none';
    document.getElementById('venuesSection').style.display = 'block';
    
    // 更新標題
    document.getElementById('venuesTitle').textContent = type.title;
    document.getElementById('venuesSubtitle').textContent = type.subtitle;
    
    // 篩選場地
    const filteredVenues = venues.filter(type.filter);
    renderVenues(filteredVenues);
    
    // 更新縣市篩選器
    updateCityFilter(filteredVenues);
}

// ===== 返回選擇 =====
function goBack() {
    document.getElementById('typeSelectorSection').style.display = 'flex';
    document.getElementById('venuesSection').style.display = 'none';
}

// ===== 篩選場地 =====
function updateCityFilter(filteredVenues) {
    const cities = [...new Set(filteredVenues.map(v => v.city))].sort();
    const select = document.getElementById('cityFilter');
    
    select.innerHTML = '<option value="">所有縣市</option>' + 
        cities.map(city => `<option value="${city}">${city}</option>`).join('');
}

function filterVenues() {
    const type = activityTypes[currentTypeIndex];
    const city = document.getElementById('cityFilter').value;
    const capacity = document.getElementById('capacityFilter').value;
    
    let filtered = venues.filter(type.filter);
    
    if (city) {
        filtered = filtered.filter(v => v.city === city);
    }
    
    if (capacity) {
        const capacityRanges = {
            'small': v => (v.maxCapacityTheater || 0) <= 50,
            'medium': v => (v.maxCapacityTheater || 0) > 50 && (v.maxCapacityTheater || 0) <= 200,
            'large': v => (v.maxCapacityTheater || 0) > 200 && (v.maxCapacityTheater || 0) <= 500,
            'xlarge': v => (v.maxCapacityTheater || 0) > 500
        };
        filtered = filtered.filter(capacityRanges[capacity]);
    }
    
    renderVenues(filtered);
}

// ===== 渲染場地列表 =====
function renderVenues(venueList) {
    const grid = document.getElementById('venuesGrid');
    document.getElementById('venueCount').textContent = venueList.length;
    
    if (venueList.length === 0) {
        grid.innerHTML = `
            <div class="empty-state" style="grid-column: 1/-1; text-align: center; padding: 48px;">
                <div style="font-size: 48px; margin-bottom: 16px;">📭</div>
                <h3 style="font-size: 21px; margin-bottom: 8px;">沒有找到符合的場地</h3>
                <p style="color: var(--color-text-secondary);">試試調整篩選條件</p>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = venueList.map(venue => {
        const inCompare = compareList.includes(venue.id);
        return `
            <div class="venue-card" onclick="showVenueDetail(${venue.id})">
                <div class="venue-card-image">
                    <span class="venue-card-badge">${venue.venueType || '場地'}</span>
                    ${venue.venueType === '飯店場地' ? '🏨' : venue.venueType === '展演場地' ? '🎭' : '🏢'}
                </div>
                <div class="venue-card-content">
                    <h3 class="venue-card-name">${venue.name}</h3>
                    <p class="venue-card-room">${venue.roomName || ''}</p>
                    <div class="venue-card-info">
                        <div class="venue-info-item">
                            📍 ${venue.city}
                        </div>
                        <div class="venue-info-item">
                            👥 ${getMaxCapacity(venue)} 人
                        </div>
                    </div>
                    <div class="venue-card-price">
                        ${venue.priceFullDay ? '$' + Number(venue.priceFullDay).toLocaleString() : '需詢價'}
                        <span>/ 全天</span>
                    </div>
                    <div class="venue-card-actions">
                        <button class="btn btn-primary btn-small" onclick="event.stopPropagation(); showVenueDetail(${venue.id})">
                            查看詳情
                        </button>
                        <button class="btn ${inCompare ? 'btn-primary' : 'btn-secondary'} btn-small" 
                                onclick="event.stopPropagation(); toggleCompare(${venue.id})">
                            ${inCompare ? '− 移除' : '+ 比較'}
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// ===== 取得最大容納人數 =====
function getMaxCapacity(venue) {
    return venue.maxCapacityTheater || venue.maxCapacityEmpty || venue.maxCapacityClassroom || 100;
}

// ===== 場地詳情 =====
function showVenueDetail(id) {
    const venue = venues.find(v => v.id === id);
    if (!venue) return;
    
    const modal = document.getElementById('venueModal');
    const content = document.getElementById('modalContent');
    const inCompare = compareList.includes(id);
    
    content.innerHTML = `
        <div class="venue-detail-header">
            <h1 class="venue-detail-title">${venue.name}</h1>
            <p class="venue-detail-subtitle">${venue.roomName || ''} · ${venue.city}</p>
        </div>
        
        <div class="venue-detail-section">
            <h3>基本資訊</h3>
            <div class="venue-detail-grid">
                <div class="venue-detail-item">
                    <span class="venue-detail-label">地址</span>
                    <span class="venue-detail-value">${venue.address || '未提供'}</span>
                </div>
                <div class="venue-detail-item">
                    <span class="venue-detail-label">最大容納</span>
                    <span class="venue-detail-value large">${getMaxCapacity(venue)} 人</span>
                </div>
                <div class="venue-detail-item">
                    <span class="venue-detail-label">全天費用</span>
                    <span class="venue-detail-value large">
                        ${venue.priceFullDay ? '$' + Number(venue.priceFullDay).toLocaleString() : '需詢價'}
                    </span>
                </div>
                <div class="venue-detail-item">
                    <span class="venue-detail-label">可使用時間</span>
                    <span class="venue-detail-value">${venue.availableTimeWeekday || '08:00-22:00'}</span>
                </div>
            </div>
        </div>
        
        ${venue.transportation ? `
            <div class="venue-detail-section">
                <h3>交通資訊</h3>
                <div class="venue-detail-grid">
                    ${venue.transportation.mrt ? `
                        <div class="venue-detail-item">
                            <span class="venue-detail-label">🚇 捷運</span>
                            <span class="venue-detail-value">
                                ${venue.transportation.mrt.station}
                                ${venue.transportation.mrt.walkingMinutes ? ` · 步行 ${venue.transportation.mrt.walkingMinutes} 分鐘` : ''}
                            </span>
                        </div>
                    ` : ''}
                    ${venue.transportation.parking ? `
                        <div class="venue-detail-item">
                            <span class="venue-detail-label">🅿️ 停車</span>
                            <span class="venue-detail-value">
                                ${venue.transportation.parking.name || '有停車場'}
                                ${venue.transportation.parking.hourlyRate ? ` · $${venue.transportation.parking.hourlyRate}/時` : ''}
                            </span>
                        </div>
                    ` : ''}
                </div>
            </div>
        ` : ''}
        
        ${venue.dimensions ? `
            <div class="venue-detail-section">
                <h3>場地尺寸</h3>
                <div class="venue-detail-grid">
                    <div class="venue-detail-item">
                        <span class="venue-detail-label">面積</span>
                        <span class="venue-detail-value large">${venue.dimensions.area || '-'} 坪</span>
                    </div>
                    ${venue.dimensions.length && venue.dimensions.width ? `
                        <div class="venue-detail-item">
                            <span class="venue-detail-label">長寬</span>
                            <span class="venue-detail-value">${venue.dimensions.length} × ${venue.dimensions.width} 公尺</span>
                        </div>
                    ` : ''}
                    ${venue.dimensions.height ? `
                        <div class="venue-detail-item">
                            <span class="venue-detail-label">高度</span>
                            <span class="venue-detail-value">${venue.dimensions.height} 公尺</span>
                        </div>
                    ` : ''}
                </div>
            </div>
        ` : ''}
        
        ${venue.seatingArrangements ? `
            <div class="venue-detail-section">
                <h3>座位配置</h3>
                <div class="venue-detail-tags">
                    ${Object.entries(venue.seatingArrangements).map(([key, arr]) => `
                        <div class="venue-tag">${arr.description || key} · ${arr.capacity} 人</div>
                    `).join('')}
                </div>
            </div>
        ` : ''}
        
        <div class="venue-detail-section">
            <h3>聯絡資訊</h3>
            <div class="venue-detail-grid">
                <div class="venue-detail-item">
                    <span class="venue-detail-label">電話</span>
                    <span class="venue-detail-value">${venue.contactPhone || '未提供'}</span>
                </div>
                ${venue.contactEmail ? `
                    <div class="venue-detail-item">
                        <span class="venue-detail-label">Email</span>
                        <span class="venue-detail-value">${venue.contactEmail}</span>
                    </div>
                ` : ''}
            </div>
        </div>
        
        <div class="venue-detail-actions">
            <a href="tel:${venue.contactPhone}" class="btn btn-primary" onclick="event.stopPropagation()">
                📞 立即致電
            </a>
            <button class="btn ${inCompare ? 'btn-primary' : 'btn-secondary'}" onclick="event.stopPropagation(); toggleCompare(${venue.id}); showVenueDetail(${venue.id});">
                ${inCompare ? '− 從比較移除' : '+ 加入比較'}
            </button>
        </div>
    `;
    
    modal.classList.add('active');
}

function closeModal() {
    document.getElementById('venueModal').classList.remove('active');
}

// ===== 比較功能 =====
function toggleCompare(id) {
    if (compareList.includes(id)) {
        compareList = compareList.filter(i => i !== id);
    } else {
        if (compareList.length >= 3) {
            alert('最多只能比較 3 個場地');
            return;
        }
        compareList.push(id);
    }
    
    updateComparePanel();
    
    // 如果在場地列表頁，重新渲染以更新按鈕狀態
    if (document.getElementById('venuesSection').style.display !== 'none') {
        filterVenues();
    }
}

function updateComparePanel() {
    const panel = document.getElementById('comparePanel');
    const count = document.getElementById('compareCount');
    const viewBtn = document.getElementById('compareViewBtn');
    const items = document.getElementById('compareItems');
    
    count.textContent = compareList.length;
    viewBtn.disabled = compareList.length < 2;
    
    if (compareList.length > 0) {
        panel.classList.add('active');
        
        items.innerHTML = compareList.map(id => {
            const venue = venues.find(v => v.id === id);
            return `
                <div class="compare-item">
                    <span class="compare-item-name">${venue?.name || '未知場地'}</span>
                    <button class="compare-item-remove" onclick="toggleCompare(${id})">✕</button>
                </div>
            `;
        }).join('');
    } else {
        panel.classList.remove('active');
    }
}

function showCompare() {
    if (compareList.length < 2) {
        alert('請至少選擇 2 個場地進行比較');
        return;
    }
    
    const modal = document.getElementById('compareModal');
    const content = document.getElementById('compareContent');
    
    const compareVenues = compareList.map(id => venues.find(v => v.id === id)).filter(v => v);
    
    content.innerHTML = `
        <table class="compare-table">
            <thead>
                <tr>
                    <th>比較項目</th>
                    ${compareVenues.map(v => `
                        <th class="compare-venue-header">
                            <div style="font-weight: 600; font-size: 17px;">${v.name}</div>
                            <div style="font-size: 14px; color: var(--color-text-secondary); font-weight: 400;">${v.roomName || ''}</div>
                        </th>
                    `).join('')}
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>📍 縣市</td>
                    ${compareVenues.map(v => `<td>${v.city}</td>`).join('')}
                </tr>
                <tr>
                    <td>📍 地址</td>
                    ${compareVenues.map(v => `<td style="max-width: 200px; font-size: 14px;">${v.address || '未提供'}</td>`).join('')}
                </tr>
                <tr>
                    <td>👥 最大容納</td>
                    ${compareVenues.map(v => `<td class="compare-value-highlight">${getMaxCapacity(v)} 人</td>`).join('')}
                </tr>
                <tr>
                    <td>💰 全天費用</td>
                    ${compareVenues.map(v => `<td class="compare-value-highlight">${v.priceFullDay ? '$' + Number(v.priceFullDay).toLocaleString() : '需詢價'}</td>`).join('')}
                </tr>
                <tr>
                    <td>📐 場地大小</td>
                    ${compareVenues.map(v => `<td>${v.dimensions?.area ? v.dimensions.area + ' 坪' : '未提供'}</td>`).join('')}
                </tr>
                <tr>
                    <td>🚇 捷運站</td>
                    ${compareVenues.map(v => `<td>${v.transportation?.mrt?.station || '無'}</td>`).join('')}
                </tr>
                <tr>
                    <td>🅿️ 停車費用</td>
                    ${compareVenues.map(v => `<td>${v.transportation?.parking ? '$' + v.transportation.parking.hourlyRate + '/時' : '未提供'}</td>`).join('')}
                </tr>
                <tr>
                    <td>🎭 劇院型</td>
                    ${compareVenues.map(v => `<td>${v.seatingArrangements?.theater?.capacity || v.maxCapacityTheater || '-'} 人</td>`).join('')}
                </tr>
                <tr>
                    <td>📚 會議型</td>
                    ${compareVenues.map(v => `<td>${v.seatingArrangements?.classroom?.capacity || v.maxCapacityClassroom || '-'} 人</td>`).join('')}
                </tr>
                <tr>
                    <td>🍽️ 宴會型</td>
                    ${compareVenues.map(v => `<td>${v.seatingArrangements?.banquet?.capacity || '-'} 人</td>`).join('')}
                </tr>
                <tr>
                    <td>📞 聯絡電話</td>
                    ${compareVenues.map(v => `<td><a href="tel:${v.contactPhone}" style="color: var(--color-accent); text-decoration: none;">${v.contactPhone || '未提供'}</a></td>`).join('')}
                </tr>
            </tbody>
        </table>
    `;
    
    modal.classList.add('active');
}

function closeCompareModal() {
    document.getElementById('compareModal').classList.remove('active');
}

function clearCompare() {
    compareList = [];
    updateComparePanel();
    filterVenues();
}

// ===== 點擊背景關閉 Modal =====
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-backdrop')) {
        e.target.closest('.modal').classList.remove('active');
    }
});

// ===== 鍵盤事件 =====
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeModal();
        closeCompareModal();
    }
});
