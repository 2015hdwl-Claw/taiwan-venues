// ===== 新增功能 =====

// 日曆視圖相關變數
let currentDate = new Date();
let currentView = 'list';

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
    // 實際應該檢查場地的可用日期
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

// 更新新增場地函數
function addVenueWithNewFields(event) {
    event.preventDefault();
    
    const venue = {
        id: Date.now(),
        name: document.getElementById('venueName').value,
        category: document.getElementById('venueCategory').value, // 新增
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
        maxCapacityEmpty: parseInt(document.getElementById('maxCapacityEmpty').value),
        maxCapacityTheater: document.getElementById('maxCapacityTheater').value || null,
        maxCapacityClassroom: document.getElementById('maxCapacityClassroom').value || null,
        availableTimeWeekday: document.getElementById('availableTimeWeekday').value,
        availableTimeWeekend: document.getElementById('availableTimeWeekend').value,
        photos: document.getElementById('photos').value || null, // 新增
        layoutImages: document.getElementById('layoutImages').value || null, // 新增
        equipment: document.getElementById('equipment').value,
        availabilityNotes: document.getElementById('availabilityNotes').value || null, // 新增
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

// 更新篩選函數
function filterVenuesWithCategory() {
    const categoryFilter = document.getElementById('categoryFilter').value;
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

// 更新詳情顯示
function showVenueDetailsWithPhotos(venueId) {
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
                            <img src="${photo}" alt="照片 ${index + 1}" onclick="openPhoto('${photo}')" style="cursor: pointer;">
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
                            <img src="${layout}" alt="布置圖 ${index + 1}" onclick="openPhoto('${layout}')" style="cursor: pointer;">
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
                <div class="detail-item">
                    <div class="detail-label">場地別</div>
                    <div class="detail-value">${venue.category || '未分類'}</div>
                </div>
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
                    <div class="detail-value">${venue.maxCapacityEmpty} 人</div>
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

// 更新 CSV 匯出（包含新欄位）
function exportToCSVWithNewFields() {
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
        v.name, v.category || '', v.roomName, v.type, v.city, v.address,
        v.contactPerson, v.contactPhone, v.contactEmail,
        v.pricePerHour, v.priceHalfDay, v.priceFullDay,
        v.maxCapacityEmpty, v.maxCapacityTheater, v.maxCapacityClassroom,
        v.availableTimeWeekday, v.availableTimeWeekend,
        v.equipment, v.photos || '', v.layoutImages || '', 
        v.availabilityNotes || '', v.notes, getCategoryName(v.capacityCategory)
    ]);
    
    const csv = [headers, ...rows].map(row => 
        row.map(cell => `"${(cell || '').toString().replace(/"/g, '""')}"`).join(',')
    ).join('\n');
    
    downloadFile(csv, 'taiwan-venues-v2.csv', 'text/csv;charset=utf-8');
}
