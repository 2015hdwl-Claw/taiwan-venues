// ===== 台灣活動場地資料庫 v2.0 =====
// 場地資料庫
let venues = [];
let filteredVenues = [];

// 日曆視圖相關變數
let currentDate = new Date();
let currentView = 'list';

// 初始化
document.addEventListener('DOMContentLoaded', function() {
    loadFromLocalStorage();
    
    // 如果沒有資料，自動載入範例資料
    if (venues.length === 0) {
        loadSampleData();
    }
    
    updateStats();
    renderVenues();
});

// 載入範例資料
function loadSampleData() {
    fetch('sample-data.json')
        .then(response => response.json())
        .then(data => {
            venues = data;
            saveToLocalStorage();
            updateStats();
            renderVenues();
            console.log('✅ 已自動載入範例場地資料');
        })
        .catch(error => {
            console.log('⚠️ 無法自動載入範例資料:', error);
        });
}

// ===== 視圖切換 =====

// 切換視圖
function switchView(view) {
    currentView = view;
    
    if (view === 'list') {
        document.getElementById('listView').style.display = 'block';
        document.getElementById('calendarView').style.display = 'none';
        document.querySelectorAll('.view-btn').forEach(btn => btn.classList.remove('active'));
        event.target.classList.add('active');
    } else {
        document.getElementById('listView').style.display = 'none';
        document.getElementById('calendarView').style.display = 'block';
        document.querySelectorAll('.view-btn').forEach(btn => btn.classList.remove('active'));
        event.target.classList.add('active');
        renderCalendar();
    }
}

// ===== 日曆功能 =====

// 渲染日曆
function renderCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // 更新月份標題
    document.getElementById('currentMonth').textContent = `${year}年${month + 1}月`;
    
    // 獲取該月第一天和最後一天
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // 清空日曆
    const calendarDays = document.getElementById('calendarDays');
    calendarDays.innerHTML = '';
    
    // 添加空白天數
    for (let i = 0; i < firstDay.getDay(); i++) {
        calendarDays.innerHTML += '<div class="calendar-day empty"></div>';
    }
    
    // 添加日期
    for (let day = 1; day <= lastDay.getDate(); day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const availableVenues = getAvailableVenues(dateStr);
        
        let statusClass = '';
        let venueCount = 0;
        
        if (availableVenues.length > 5) {
            statusClass = 'available';
            venueCount = availableVenues.length;
        } else if (availableVenues.length > 0) {
            statusClass = 'limited';
            venueCount = availableVenues.length;
        } else {
            statusClass = 'unavailable';
        }
        
        calendarDays.innerHTML += `
            <div class="calendar-day ${statusClass}" onclick="showDayVenues('${dateStr}')">
                <div class="day-number">${day}</div>
                ${venueCount > 0 ? `<div class="venue-count">${venueCount} 個場地</div>` : ''}
            </div>
        `;
    }
}

// 獲取特定日期可用的場地
function getAvailableVenues(dateStr) {
    // 簡化版本：假設所有場地都可用
    return venues;
}

// 顯示某天的場地
function showDayVenues(dateStr) {
    const availableVenues = getAvailableVenues(dateStr);
    
    if (availableVenues.length === 0) {
        alert(`${dateStr} 沒有可用的場地`);
        return;
    }
    
    let message = `${dateStr} 可用的場地：\n\n`;
    availableVenues.forEach((venue, index) => {
        message += `${index + 1}. ${venue.name} - ${venue.city}\n`;
    });
    
    alert(message);
}

// 上個月
function previousMonth() {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar();
}

// 下個月
function nextMonth() {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar();
}

// ===== 表單功能 =====

// 切換表單顯示
function toggleForm() {
    const form = document.getElementById('venueForm');
    form.style.display = form.style.display === 'none' ? 'block' : 'none';
}

// 新增場地（含 v2 新欄位）
function addVenue(event) {
    event.preventDefault();
    
    const venue = {
        id: Date.now(),
        name: document.getElementById('venueName').value,
        category: document.getElementById('venueCategory')?.value || '',
        roomName: document.getElementById('roomName').value,
        type: document.getElementById('venueType').value,
        city: document.getElementById('venueCity').value,
        address: document.getElementById('venueAddress').value,
        contactPerson: document.getElementById('contactPerson').value,
        contactPhone: document.getElementById('contactPhone').value,
        contactEmail: document.getElementById('contactEmail').value,
        pricePerHour: document.getElementById('pricePerHour').value || null,
        priceHalfDay: document.getElementById('priceHalfDay').value || null,
        priceFullDay: document.getElementById('priceFullDay').value || null,
        maxCapacityEmpty: parseInt(document.getElementById('maxCapacityEmpty').value) || 0,
        maxCapacityTheater: document.getElementById('maxCapacityTheater')?.value || null,
        maxCapacityClassroom: document.getElementById('maxCapacityClassroom')?.value || null,
        availableTimeWeekday: document.getElementById('availableTimeWeekday').value,
        availableTimeWeekend: document.getElementById('availableTimeWeekend').value,
        photos: document.getElementById('photos')?.value || null,
        layoutImages: document.getElementById('layoutImages')?.value || null,
        equipment: document.getElementById('equipment').value,
        availabilityNotes: document.getElementById('availabilityNotes')?.value || null,
        notes: document.getElementById('notes').value,
        createdAt: new Date().toISOString()
    };
    
    // 判斷活動規模
    venue.capacityCategory = getCapacityCategory(venue.maxCapacityEmpty);
    
    venues.push(venue);
    saveToLocalStorage();
    updateStats();
    renderVenues();
    
    // 重設表單
    document.getElementById('addVenueForm').reset();
    toggleForm();
    
    alert('場地已成功新增！');
}

// 根據容納人數分類
function getCapacityCategory(capacity) {
    if (!capacity || capacity <= 50) return 'micro';
    if (capacity <= 100) return 'small';
    if (capacity <= 200) return 'medium';
    if (capacity <= 500) return 'medium-large';
    if (capacity <= 1000) return 'large';
    if (capacity <= 5000) return 'extra-large';
    return 'huge';
}

// 取得分類名稱
function getCategoryName(category) {
    const names = {
        'micro': '微型活動',
        'small': '小型活動',
        'medium': '中型活動',
        'medium-large': '中大型活動',
        'large': '大型活動',
        'extra-large': '超大型活動',
        'huge': '巨型活動'
    };
    return names[category] || '未知';
}

// ===== 統計功能 =====

// 更新統計
function updateStats() {
    const counts = {
        'micro': 0,
        'small': 0,
        'medium': 0,
        'medium-large': 0,
        'large': 0,
        'extra-large': 0,
        'huge': 0
    };
    
    venues.forEach(venue => {
        if (counts.hasOwnProperty(venue.capacityCategory)) {
            counts[venue.capacityCategory]++;
        }
    });
    
    document.getElementById('microCount').textContent = counts['micro'];
    document.getElementById('smallCount').textContent = counts['small'];
    document.getElementById('mediumCount').textContent = counts['medium'];
    document.getElementById('mediumLargeCount').textContent = counts['medium-large'];
    document.getElementById('largeCount').textContent = counts['large'];
    document.getElementById('extraLargeCount').textContent = counts['extra-large'];
    document.getElementById('hugeCount').textContent = counts['huge'];
    
    document.getElementById('totalVenues').textContent = `共 ${venues.length} 個場地`;
}

// ===== 渲染功能 =====

// 渲染場地列表
function renderVenues() {
    const container = document.getElementById('venuesList');
    
    if (filteredVenues.length === 0 && venues.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #6c757d; padding: 40px;">尚無場地資料，請點擊「新增場地」開始建立</p>';
        return;
    }
    
    const displayVenues = filteredVenues.length > 0 ? filteredVenues : venues;
    
    if (displayVenues.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #6c757d; padding: 40px;">沒有符合條件的場地</p>';
        return;
    }
    
    container.innerHTML = displayVenues.map(venue => `
        <div class="venue-card" onclick="showVenueDetails(${venue.id})">
            <div class="venue-card-header">
                <div class="venue-name">${venue.name}</div>
                <div class="venue-type">${venue.type}</div>
            </div>
            
            ${venue.category ? `<div class="venue-category-tag">${venue.category}</div>` : ''}
            
            <div class="venue-info">
                ${venue.roomName ? `<div class="venue-info-item"><strong>廳別：</strong>${venue.roomName}</div>` : ''}
                <div class="venue-info-item"><strong>📍</strong> ${venue.city} ${venue.address}</div>
                ${venue.contactPhone ? `<div class="venue-info-item"><strong>📞</strong> ${venue.contactPhone}</div>` : ''}
            </div>
            
            <div class="venue-capacity">
                <div class="capacity-tag">空場 <span>${venue.maxCapacityEmpty || 0}人</span></div>
                ${venue.maxCapacityTheater ? `<div class="capacity-tag">劇院型 <span>${venue.maxCapacityTheater}人</span></div>` : ''}
                ${venue.maxCapacityClassroom ? `<div class="capacity-tag">教室型 <span>${venue.maxCapacityClassroom}人</span></div>` : ''}
            </div>
            
            <div class="venue-price">
                ${venue.pricePerHour ? `<div class="price-item"><span class="price-label">每小時</span><span class="price-value">NT$${Number(venue.pricePerHour).toLocaleString()}</span></div>` : ''}
                ${venue.priceHalfDay ? `<div class="price-item"><span class="price-label">半天</span><span class="price-value">NT$${Number(venue.priceHalfDay).toLocaleString()}</span></div>` : ''}
                ${venue.priceFullDay ? `<div class="price-item"><span class="price-label">全天</span><span class="price-value">NT$${Number(venue.priceFullDay).toLocaleString()}</span></div>` : ''}
            </div>
        </div>
    `).join('');
}

// 顯示場地詳情（含照片和布置圖）
function showVenueDetails(venueId) {
    const venue = venues.find(v => v.id === venueId);
    if (!venue) return;
    
    const modal = document.getElementById('venueModal');
    const details = document.getElementById('venueDetails');
    
    // 照片輪播 HTML
    let photosHTML = '';
    if (venue.photos) {
        const photos = venue.photos.split(';').filter(p => p.trim());
        if (photos.length > 0) {
            photosHTML = `
                <div class="detail-section">
                    <h3>📸 場地照片</h3>
                    <div class="photos-gallery">
                        ${photos.map((photo, index) => `
                            <img src="${photo}" alt="照片 ${index + 1}" onclick="openPhoto('${photo}')" style="cursor: pointer; max-width: 100%; height: 150px; object-fit: cover; border-radius: 8px; margin: 5px;">
                        `).join('')}
                    </div>
                </div>
            `;
        }
    }
    
    // 布置圖 HTML
    let layoutHTML = '';
    if (venue.layoutImages) {
        const layouts = venue.layoutImages.split(';').filter(l => l.trim());
        if (layouts.length > 0) {
            layoutHTML = `
                <div class="detail-section">
                    <h3>📐 場地布置圖</h3>
                    <div class="photos-gallery">
                        ${layouts.map((layout, index) => `
                            <img src="${layout}" alt="布置圖 ${index + 1}" onclick="openPhoto('${layout}')" style="cursor: pointer; max-width: 100%; height: 150px; object-fit: cover; border-radius: 8px; margin: 5px;">
                        `).join('')}
                    </div>
                </div>
            `;
        }
    }
    
    details.innerHTML = `
        <h2 style="margin-bottom: 10px;">${venue.name}</h2>
        ${venue.roomName ? `<p style="color: #6c757d; margin-bottom: 20px;">${venue.roomName}</p>` : ''}
        
        <div class="detail-section">
            <h3>📋 基本資訊</h3>
            <div class="detail-grid">
                ${venue.category ? `
                <div class="detail-item">
                    <div class="detail-label">場地別</div>
                    <div class="detail-value">${venue.category}</div>
                </div>
                ` : ''}
                <div class="detail-item">
                    <div class="detail-label">場地類型</div>
                    <div class="detail-value">${venue.type}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">活動規模</div>
                    <div class="detail-value">${getCategoryName(venue.capacityCategory)}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">縣市</div>
                    <div class="detail-value">${venue.city}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">地址</div>
                    <div class="detail-value">${venue.address}</div>
                </div>
            </div>
        </div>
        
        ${photosHTML}
        ${layoutHTML}
        
        <div class="detail-section">
            <h3>📞 聯絡資訊</h3>
            <div class="detail-grid">
                <div class="detail-item">
                    <div class="detail-label">聯絡人</div>
                    <div class="detail-value">${venue.contactPerson || '未提供'}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">電話</div>
                    <div class="detail-value">${venue.contactPhone || '未提供'}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">電子郵件</div>
                    <div class="detail-value">${venue.contactEmail || '未提供'}</div>
                </div>
            </div>
        </div>
        
        <div class="detail-section">
            <h3>👥 容納人數</h3>
            <div class="detail-grid">
                <div class="detail-item">
                    <div class="detail-label">空場（不放椅子）</div>
                    <div class="detail-value">${venue.maxCapacityEmpty || 0} 人</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">劇院型</div>
                    <div class="detail-value">${venue.maxCapacityTheater || '未提供'} 人</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">教室型</div>
                    <div class="detail-value">${venue.maxCapacityClassroom || '未提供'} 人</div>
                </div>
            </div>
        </div>
        
        <div class="detail-section">
            <h3>💰 場地費用</h3>
            <div class="detail-grid">
                <div class="detail-item">
                    <div class="detail-label">每小時</div>
                    <div class="detail-value">${venue.pricePerHour ? 'NT$' + Number(venue.pricePerHour).toLocaleString() : '未提供'}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">半天</div>
                    <div class="detail-value">${venue.priceHalfDay ? 'NT$' + Number(venue.priceHalfDay).toLocaleString() : '未提供'}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">全天</div>
                    <div class="detail-value">${venue.priceFullDay ? 'NT$' + Number(venue.priceFullDay).toLocaleString() : '未提供'}</div>
                </div>
            </div>
        </div>
        
        <div class="detail-section">
            <h3>🕐 使用時間</h3>
            <div class="detail-grid">
                <div class="detail-item">
                    <div class="detail-label">平日</div>
                    <div class="detail-value">${venue.availableTimeWeekday || '未提供'}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">假日</div>
                    <div class="detail-value">${venue.availableTimeWeekend || '未提供'}</div>
                </div>
            </div>
        </div>
        
        ${venue.availabilityNotes ? `
        <div class="detail-section">
            <h3>📅 可租用時間說明</h3>
            <div class="detail-item">
                <div class="detail-value">${venue.availabilityNotes}</div>
            </div>
        </div>
        ` : ''}
        
        ${venue.equipment ? `
        <div class="detail-section">
            <h3>🎬 設備與費用</h3>
            <div class="detail-item">
                <div class="detail-value">${venue.equipment}</div>
            </div>
        </div>
        ` : ''}
        
        ${venue.notes ? `
        <div class="detail-section">
            <h3>📝 備註</h3>
            <div class="detail-item">
                <div class="detail-value">${venue.notes}</div>
            </div>
        </div>
        ` : ''}
        
        <button onclick="deleteVenue(${venue.id})" style="width: 100%; padding: 12px; background: #dc3545; color: white; border: none; border-radius: 8px; cursor: pointer; margin-top: 20px;">刪除此場地</button>
    `;
    
    modal.style.display = 'block';
}

// 打開照片
function openPhoto(url) {
    window.open(url, '_blank');
}

// 關閉 Modal
function closeModal() {
    document.getElementById('venueModal').style.display = 'none';
}

// 刪除場地
function deleteVenue(venueId) {
    if (confirm('確定要刪除此場地嗎？')) {
        venues = venues.filter(v => v.id !== venueId);
        saveToLocalStorage();
        updateStats();
        renderVenues();
        closeModal();
        alert('場地已刪除');
    }
}

// ===== 搜尋與篩選 =====

// 搜尋場地
function searchVenues() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    
    if (!searchTerm) {
        filteredVenues = [];
        renderVenues();
        return;
    }
    
    filteredVenues = venues.filter(venue => {
        return venue.name.toLowerCase().includes(searchTerm) ||
               venue.city.toLowerCase().includes(searchTerm) ||
               venue.address.toLowerCase().includes(searchTerm) ||
               (venue.roomName && venue.roomName.toLowerCase().includes(searchTerm));
    });
    
    renderVenues();
}

// 篩選場地（含場地別）
function filterVenues() {
    const categoryFilter = document.getElementById('categoryFilter')?.value || '';
    const capacityFilter = document.getElementById('capacityFilter').value;
    const cityFilter = document.getElementById('cityFilter').value;
    const typeFilter = document.getElementById('typeFilter').value;
    
    filteredVenues = venues.filter(venue => {
        const matchCategory = !categoryFilter || venue.category === categoryFilter;
        const matchCapacity = !capacityFilter || venue.capacityCategory === capacityFilter;
        const matchCity = !cityFilter || venue.city === cityFilter;
        const matchType = !typeFilter || venue.type === typeFilter;
        
        return matchCategory && matchCapacity && matchCity && matchType;
    });
    
    renderVenues();
}

// 重設篩選
function resetFilters() {
    document.getElementById('searchInput').value = '';
    document.getElementById('categoryFilter').value = '';
    document.getElementById('capacityFilter').value = '';
    document.getElementById('cityFilter').value = '';
    document.getElementById('typeFilter').value = '';
    
    filteredVenues = [];
    renderVenues();
}

// ===== 匯出功能 =====

// 匯出 CSV（含 v2 新欄位）
function exportToCSV() {
    if (venues.length === 0) {
        alert('沒有資料可匯出');
        return;
    }
    
    const headers = [
        '場地名稱', '場地別', '廳別', '類型', '縣市', '地址', 
        '聯絡人', '電話', '電子郵件',
        '每小時費用', '半天費用', '全天費用',
        '最大容納(空場)', '最大容納(劇院型)', '最大容納(教室型)',
        '平日時間', '假日時間', '設備費用', 
        '場地照片', '場地布置圖', '可租用時間說明', '備註', '活動規模'
    ];
    
    const rows = venues.map(v => [
        v.name, v.category || '', v.roomName || '', v.type, v.city, v.address,
        v.contactPerson || '', v.contactPhone || '', v.contactEmail || '',
        v.pricePerHour || '', v.priceHalfDay || '', v.priceFullDay || '',
        v.maxCapacityEmpty || '', v.maxCapacityTheater || '', v.maxCapacityClassroom || '',
        v.availableTimeWeekday || '', v.availableTimeWeekend || '',
        v.equipment || '', v.photos || '', v.layoutImages || '', 
        v.availabilityNotes || '', v.notes || '', getCategoryName(v.capacityCategory)
    ]);
    
    const csv = [headers, ...rows].map(row => 
        row.map(cell => `"${(cell || '').toString().replace(/"/g, '""')}"`).join(',')
    ).join('\n');
    
    downloadFile(csv, 'taiwan-venues-v2.csv', 'text/csv;charset=utf-8');
}

// 匯出 JSON
function exportToJSON() {
    if (venues.length === 0) {
        alert('沒有資料可匯出');
        return;
    }
    
    const json = JSON.stringify(venues, null, 2);
    downloadFile(json, 'taiwan-venues.json', 'application/json');
}

// 下載檔案
function downloadFile(content, filename, type) {
    const blob = new Blob(['\ufeff' + content], { type: type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// ===== 匯入功能 =====

// 匯入資料
function importData(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            if (file.name.endsWith('.json')) {
                const data = JSON.parse(e.target.result);
                venues = [...venues, ...data];
            } else if (file.name.endsWith('.csv')) {
                const lines = e.target.result.split('\n');
                const headers = lines[0].split(',');
                
                for (let i = 1; i < lines.length; i++) {
                    if (!lines[i].trim()) continue;
                    
                    // 簡易 CSV 解析
                    const values = parseCSVLine(lines[i]);
                    if (values.length < 18) continue;
                    
                    const venue = {
                        id: Date.now() + i,
                        name: values[0] || '',
                        category: values[1] || '',
                        roomName: values[2] || '',
                        type: values[3] || '',
                        city: values[4] || '',
                        address: values[5] || '',
                        contactPerson: values[6] || '',
                        contactPhone: values[7] || '',
                        contactEmail: values[8] || '',
                        pricePerHour: values[9] || null,
                        priceHalfDay: values[10] || null,
                        priceFullDay: values[11] || null,
                        maxCapacityEmpty: parseInt(values[12]) || 0,
                        maxCapacityTheater: values[13] || null,
                        maxCapacityClassroom: values[14] || null,
                        availableTimeWeekday: values[15] || '',
                        availableTimeWeekend: values[16] || '',
                        equipment: values[17] || '',
                        photos: values[18] || null,
                        layoutImages: values[19] || null,
                        availabilityNotes: values[20] || null,
                        notes: values[21] || '',
                        createdAt: new Date().toISOString()
                    };
                    
                    venue.capacityCategory = getCapacityCategory(venue.maxCapacityEmpty);
                    venues.push(venue);
                }
            }
            
            saveToLocalStorage();
            updateStats();
            renderVenues();
            alert('成功匯入資料！');
        } catch (error) {
            alert('匯入失敗：檔案格式不正確');
            console.error(error);
        }
    };
    
    reader.readAsText(file);
    event.target.value = '';
}

// 簡易 CSV 行解析
function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
                current += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    
    result.push(current.trim());
    return result;
}

// ===== 儲存功能 =====

// 儲存到 LocalStorage
function saveToLocalStorage() {
    localStorage.setItem('taiwanVenues', JSON.stringify(venues));
}

// 從 LocalStorage 載入
function loadFromLocalStorage() {
    const saved = localStorage.getItem('taiwanVenues');
    if (saved) {
        venues = JSON.parse(saved);
    }
}

// 點擊 Modal 外部關閉
window.onclick = function(event) {
    const modal = document.getElementById('venueModal');
    if (event.target === modal) {
        closeModal();
    }
}

// ===== 快速篩選功能 =====

// 快速篩選（場地別）
function quickFilter(category) {
    document.getElementById('categoryFilter').value = category;
    filterVenues();
    
    // 更新按鈕狀態
    document.querySelectorAll('.quick-filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
}

// 企業級場地篩選
function filterEnterpriseVenues() {
    // 企業級場地：飯店場地、會議場地、展演場地、教育場地
    const enterpriseTypes = ['飯店場地', '會議場地', '展演場地', '教育場地'];
    
    filteredVenues = venues.filter(venue => {
        return enterpriseTypes.includes(venue.venueType || venue.category);
    });
    
    renderVenues();
    
    // 顯示提示
    const totalEl = document.getElementById('totalVenues');
    if (totalEl) {
        totalEl.textContent = `企業級場地：${filteredVenues.length} 個（共 ${venues.length} 個）`;
    }
}

// 強制重新載入資料
function forceReloadData() {
    localStorage.removeItem('taiwanVenues');
    venues = [];
    loadSampleData();
    alert('資料已重新載入！');
}
