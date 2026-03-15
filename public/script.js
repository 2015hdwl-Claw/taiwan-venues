// ===== 配置 =====
const API_BASE = 'https://taiwan-venue-api.vercel.app';
let currentPage = 1;
let currentView = 'grid';
let searchTimeout = null;
let sessionId = null;
let savedSearchState = null; // 保存搜尋狀態

// ===== 初始化 =====
document.addEventListener('DOMContentLoaded', async () => {
    // 生成 session ID
    sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    
    // 載入篩選器選項
    await loadFilters();
    
    // 載入場地
    await loadVenues();
});

// ===== 載入篩選器 =====
async function loadFilters() {
    try {
        // 載入城市
        const citiesRes = await fetch(`${API_BASE}/api/cities`);
        const citiesData = await citiesRes.json();
        
        const citySelect = document.getElementById('cityFilter');
        citiesData.cities.forEach(city => {
            const option = document.createElement('option');
            option.value = city;
            option.textContent = city;
            citySelect.appendChild(option);
        });
        
        // 載入場地類型
        const typesRes = await fetch(`${API_BASE}/api/venue-types`);
        const typesData = await typesRes.json();
        
        const typeSelect = document.getElementById('typeFilter');
        typesData.types.forEach(type => {
            const option = document.createElement('option');
            option.value = type;
            option.textContent = type;
            typeSelect.appendChild(option);
        });
    } catch (error) {
        console.error('載入篩選器失敗:', error);
    }
}

// ===== 保存搜尋條件 =====
function saveSearchState() {
    const state = {
        keyword: document.getElementById('searchInput')?.value || '',
        city: document.getElementById('cityFilter')?.value || '',
        venueType: document.getElementById('typeFilter')?.value || '',
        capacity: document.getElementById('capacityFilter')?.value || '',
        maxPrice: document.getElementById('priceFilter')?.value || '',
        timestamp: Date.now()
    };
    
    // 保存到 localStorage
    localStorage.setItem('venueSearchState', JSON.stringify(state));
    savedSearchState = state;
    
    console.log('搜尋條件已保存:', state);
}

// ===== 恢復搜尋條件 =====
function restoreSearchState() {
    try {
        const saved = localStorage.getItem('venueSearchState');
        if (!saved) return false;
        
        const state = JSON.parse(saved);
        
        // 檢查是否過期（超過 30 分鐘）
        if (Date.now() - state.timestamp > 30 * 60 * 1000) {
            localStorage.removeItem('venueSearchState');
            return false;
        }
        
        // 恢復搜尋條件
        const searchInput = document.getElementById('searchInput');
        const cityFilter = document.getElementById('cityFilter');
        const typeFilter = document.getElementById('typeFilter');
        const capacityFilter = document.getElementById('capacityFilter');
        const priceFilter = document.getElementById('priceFilter');
        
        if (searchInput) searchInput.value = state.keyword;
        if (cityFilter) cityFilter.value = state.city;
        if (typeFilter) typeFilter.value = state.venueType;
        if (capacityFilter) capacityFilter.value = state.capacity;
        if (priceFilter) priceFilter.value = state.maxPrice;
        
        console.log('搜尋條件已恢復:', state);
        return true;
    } catch (error) {
        console.error('恢復搜尋條件失敗:', error);
        return false;
    }
}

// ===== 載入場地 =====
async function loadVenues(offset = 0) {
    showLoading(true);
    
    try {
        const keyword = document.getElementById('searchInput').value;
        const city = document.getElementById('cityFilter').value;
        const venueType = document.getElementById('typeFilter').value;
        const capacity = document.getElementById('capacityFilter').value;
        const maxPrice = document.getElementById('priceFilter').value;
        
        // 保存搜尋條件
        saveSearchState();
        
        // 建立查詢參數
        const params = new URLSearchParams();
        params.append('limit', '20');
        params.append('offset', offset);
        
        if (keyword) params.append('keyword', keyword);
        if (city) params.append('city', city);
        if (venueType) params.append('venueType', venueType);
        if (capacity) {
            const capacityMap = {
                'small': '50',
                'medium': '200',
                'large': '500',
                'xlarge': '1000'
            };
            params.append('minCapacity', capacityMap[capacity]);
        }
        if (maxPrice) params.append('maxPrice', maxPrice);
        
        const response = await fetch(`${API_BASE}/api/search?${params}`);
        const data = await response.json();
        
        showLoading(false);
        
        if (data.results.length === 0) {
            showEmpty(true);
            hideGrid(true);
        } else {
            showEmpty(false);
            hideGrid(false);
            renderVenues(data.results);
            renderPagination(data.total, offset);
        }
        
        // 更新計數
        document.getElementById('venuesCount').textContent = `(${data.total} 個場地)`;
        
    } catch (error) {
        console.error('載入場地失敗:', error);
        showLoading(false);
        showError('載入失敗，請稍後再試');
    }
}

// ===== 渲染場地 =====
function renderVenues(venues) {
    const grid = document.getElementById('venuesGrid');
    
    grid.innerHTML = venues.map(venue => `
        <div class="venue-card ${currentView === 'list' ? 'list-view' : ''}" onclick="showVenueDetail(${venue.id})">
            <div class="venue-image">
                ${venue.images?.main 
                    ? `<img src="${venue.images.main}" alt="${venue.name}" loading="lazy">`
                    : `<div class="venue-image-placeholder">🏢</div>`
                }
                ${venue.status === '下架' ? '<span class="venue-badge offline">已下架</span>' : ''}
            </div>
            
            <div class="venue-info">
                <h3 class="venue-name">${venue.name}</h3>
                
                <div class="venue-meta">
                    <span class="venue-type">${venue.venueType}</span>
                    <span class="venue-city">📍 ${venue.city}</span>
                </div>
                
                <p class="venue-address">${venue.address}</p>
                
                <div class="venue-stats">
                    <div class="stat">
                        <span class="stat-icon">👥</span>
                        <span class="stat-value">${venue.maxCapacity || '-'} 人</span>
                    </div>
                    <div class="stat">
                        <span class="stat-icon">💰</span>
                        <span class="stat-value">${venue.minPrice ? formatPrice(venue.minPrice) : '電洽'}</span>
                    </div>
                    <div class="stat">
                        <span class="stat-icon">🚪</span>
                        <span class="stat-value">${venue.rooms?.length || 0} 間</span>
                    </div>
                </div>
                
                <div class="venue-actions">
                    <button class="btn btn-secondary btn-sm" onclick="event.stopPropagation(); showVenueDetail(${venue.id})">
                        查看詳情
                    </button>
                    <button class="btn btn-primary btn-sm" onclick="event.stopPropagation(); bookingInquiry(${venue.id})">
                        預訂諮詢
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// ===== 場地詳情 =====
async function showVenueDetail(venueId) {
    try {
        const response = await fetch(`${API_BASE}/api/venues/${venueId}`);
        const venue = await response.json();
        
        const detailHtml = `
            <div class="venue-detail-header">
                ${venue.images?.main 
                    ? `<img src="${venue.images.main}" alt="${venue.name}" class="venue-detail-image">`
                    : `<div class="venue-detail-image-placeholder">🏢</div>`
                }
                <h2>${venue.name}</h2>
                <div class="venue-detail-meta">
                    <span>${venue.venueType}</span>
                    <span>📍 ${venue.city}</span>
                </div>
            </div>
            
            <div class="venue-detail-section">
                <h3>📍 地址</h3>
                <p>${venue.address}</p>
            </div>
            
            <div class="venue-detail-section">
                <h3>📞 聯絡資訊</h3>
                <p><strong>聯絡人：</strong>${venue.contactPerson}</p>
                <p><strong>電話：</strong>${venue.contactPhone}</p>
                <p><strong>Email：</strong>${venue.contactEmail}</p>
            </div>
            
            ${venue.url ? `
                <div class="venue-detail-section">
                    <h3>🌐 官方網站</h3>
                    <a href="${venue.url}" target="_blank" class="btn btn-secondary">${venue.url}</a>
                </div>
            ` : ''}
            
            <div class="venue-detail-section">
                <h3>🚪 會議室 (${venue.rooms?.length || 0} 間)</h3>
                <div class="rooms-list">
                    ${venue.rooms?.map(room => `
                        <div class="room-card">
                            <h4>${room.name}</h4>
                            <div class="room-info">
                                <span>👥 ${room.capacity.theater || '-'} 人（劇院式）</span>
                                <span>👥 ${room.capacity.classroom || '-'} 人（教室式）</span>
                            </div>
                            <div class="room-pricing">
                                <span>半日：${room.pricing.halfDay ? formatPrice(room.pricing.halfDay) : '電洽'}</span>
                                <span>全日：${room.pricing.fullDay ? formatPrice(room.pricing.fullDay) : '電洽'}</span>
                            </div>
                            <div class="room-equipment">
                                ${room.equipment?.map(eq => `<span class="equipment-tag">${eq}</span>`).join('') || ''}
                            </div>
                        </div>
                    `).join('') || '<p>暫無會議室資訊</p>'}
                </div>
            </div>
            
            <div class="venue-detail-actions">
                <button class="btn btn-primary btn-lg" onclick="bookingInquiry(${venue.id})">
                    📧 發送預訂諮詢
                </button>
                <button class="btn btn-secondary btn-lg" onclick="closeVenueModal()">
                    關閉
                </button>
            </div>
        `;
        
        document.getElementById('venueDetail').innerHTML = detailHtml;
        document.getElementById('venueModal').style.display = 'flex';
        
    } catch (error) {
        console.error('載入場地詳情失敗:', error);
        alert('載入失敗，請稍後再試');
    }
}

function closeVenueModal() {
    document.getElementById('venueModal').style.display = 'none';
}

// ===== 預訂諮詢 =====
function bookingInquiry(venueId) {
    // 先取得場地資訊
    fetch(`${API_BASE}/api/venues/${venueId}`)
        .then(res => res.json())
        .then(venue => {
            const subject = encodeURIComponent(`場地預訂諮詢：${venue.name}`);
            const body = encodeURIComponent(
`您好，

我想預訂以下場地：

場地名稱：${venue.name}
地址：${venue.address}

活動資訊：
- 活動日期：
- 活動時間：
- 預計人數：
- 活動類型：

聯絡資訊：
- 姓名：
- 電話：
- Email：

請提供場地報價與檔期資訊，謝謝！

---
此信件由 EventMaster 活動大師系統發送
${window.location.href}
            `);
            
            const mailto = `mailto:${venue.contactEmail}?subject=${subject}&body=${body}`;
            window.location.href = mailto;
        })
        .catch(error => {
            console.error('預訂諮詢失敗:', error);
            alert('預訂諮詢失敗，請稍後再試');
        });
}

// ===== 搜尋 =====
function handleSearch(event) {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        loadVenues(0);
    }, 500);
}

function searchVenues() {
    loadVenues(0);
}

function applyFilters() {
    loadVenues(0);
}

// ===== 分頁 =====
function renderPagination(total, currentOffset) {
    const pagination = document.getElementById('pagination');
    const limit = 20;
    const totalPages = Math.ceil(total / limit);
    const currentPage = Math.floor(currentOffset / limit) + 1;
    
    if (totalPages <= 1) {
        pagination.style.display = 'none';
        return;
    }
    
    let html = '';
    
    // 上一頁
    if (currentPage > 1) {
        html += `<button class="page-btn" onclick="loadVenues(${(currentPage - 2) * limit})">← 上一頁</button>`;
    }
    
    // 頁碼
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, currentPage + 2);
    
    for (let i = startPage; i <= endPage; i++) {
        const activeClass = i === currentPage ? 'active' : '';
        html += `<button class="page-btn ${activeClass}" onclick="loadVenues(${(i - 1) * limit})">${i}</button>`;
    }
    
    // 下一頁
    if (currentPage < totalPages) {
        html += `<button class="page-btn" onclick="loadVenues(${currentPage * limit})">下一頁 →</button>`;
    }
    
    pagination.innerHTML = html;
    pagination.style.display = 'flex';
}

// ===== 視圖切換 =====
function setView(view) {
    currentView = view;
    
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.currentTarget.classList.add('active');
    
    const grid = document.getElementById('venuesGrid');
    if (view === 'list') {
        grid.classList.add('list-view');
    } else {
        grid.classList.remove('list-view');
    }
}

// ===== AI 聊天 =====
function toggleChat() {
    const chatWindow = document.getElementById('chatWindow');
    chatWindow.style.display = chatWindow.style.display === 'none' ? 'flex' : 'none';
}

function handleChatKeyup(event) {
    if (event.key === 'Enter') {
        sendMessage();
    }
}

async function sendMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    
    if (!message) return;
    
    // 顯示用戶訊息
    addChatMessage('user', message);
    input.value = '';
    
    // 顯示輸入中
    const loadingDiv = addChatMessage('bot', '思考中...', true);
    
    try {
        const response = await fetch(`${API_BASE}/api/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message,
                sessionId
            })
        });
        
        const data = await response.json();
        
        // 移除載入中
        loadingDiv.remove();
        
        if (data.success) {
            addChatMessage('bot', data.message);
            
            // 如果有推薦場地
            if (data.venues && data.venues.length > 0) {
                const venuesHtml = data.venues.map(v => `
                    <div class="chat-venue-card" onclick="showVenueDetail(${v.id})">
                        <strong>${v.name}</strong>
                        <span>${v.city}</span>
                        <span>👥 ${v.maxCapacity} 人</span>
                    </div>
                `).join('');
                
                addChatMessage('bot', `<div class="chat-venues">${venuesHtml}</div>`);
            }
        } else {
            addChatMessage('bot', data.message || '抱歉，我現在有點問題。請稍後再試。');
        }
        
    } catch (error) {
        loadingDiv.remove();
        addChatMessage('bot', '網路連線失敗，請稍後再試。');
        console.error('聊天錯誤:', error);
    }
}

function addChatMessage(type, content, isTemporary = false) {
    const messagesDiv = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${type}`;
    messageDiv.innerHTML = `<div class="message-content">${content}</div>`;
    
    messagesDiv.appendChild(messageDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
    
    if (isTemporary) {
        return messageDiv;
    }
}

// ===== UI 輔助函數 =====
function showLoading(show) {
    document.getElementById('loadingState').style.display = show ? 'flex' : 'none';
}

function showEmpty(show) {
    document.getElementById('emptyState').style.display = show ? 'flex' : 'none';
}

function hideGrid(hide) {
    document.getElementById('venuesGrid').style.display = hide ? 'none' : 'grid';
}

function showError(message) {
    alert(message);
}

function formatPrice(price) {
    return price.toLocaleString('zh-TW') + '元';
}

// ===== 返回按鈕 =====
function goBack() {
    console.log('返回按鈕被點擊');
    
    // 切換顯示區塊
    const typeSelectorSection = document.getElementById('typeSelectorSection');
    const venuesSection = document.getElementById('venuesSection');
    
    if (typeSelectorSection && venuesSection) {
        typeSelectorSection.style.display = 'flex';
        venuesSection.style.display = 'none';
    }
    
    // 恢復搜尋條件（下次進入時會自動恢復）
    console.log('搜尋條件已保存，下次進入時會自動恢復');
}

// ===== 初始化時恢復搜尋條件 =====
document.addEventListener('DOMContentLoaded', async () => {
    // 生成 session ID
    sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    
    // 載入篩選器選項
    await loadFilters();
    
    // 恢復搜尋條件
    const restored = restoreSearchState();
    
    // 載入場地（如果有恢復的條件，會自動套用）
    await loadVenues();
    
    if (restored) {
        console.log('✅ 搜尋條件已自動恢復');
    }
});

// ===== 點擊外部關閉 Modal =====
window.onclick = function(event) {
    const modal = document.getElementById('venueModal');
    if (event.target === modal) {
        closeVenueModal();
    }
}
// v1773501112
