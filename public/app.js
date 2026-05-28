document.addEventListener('DOMContentLoaded', function() {
    const calendarEl = document.getElementById('calendar');
    const roomsContainerEl = document.getElementById('rooms-schedule-container');
    const roomsWrapperEl = document.getElementById('rooms-cards-wrapper');
    const loaderEl = document.getElementById('loader');
    const refreshBtn = document.getElementById('refresh-btn');
    const roomFilter = document.getElementById('room-filter');
    const roomDatePicker = document.getElementById('room-date-picker');
    
    // Tabs elements
    const tabBtns = document.querySelectorAll('.tab-btn[data-tab]');
    const filterAllEvents = document.getElementById('filter-all-events');
    const filterRoomEvents = document.getElementById('filter-room-events');
    const allEventsViewEl = document.getElementById('all-events-view');
    const liveTrackerEl = document.getElementById('live-meetings-tracker');
    const ongoingListEl = document.getElementById('ongoing-meetings-list');
    const upcomingListEl = document.getElementById('upcoming-meetings-list');

    // Custom View Controls
    const btnPrevWeek = document.getElementById('btn-prev-week');
    const btnNextWeek = document.getElementById('btn-next-week');
    const roomsWeekLabel = document.getElementById('rooms-current-week-label');
    const btnViewWeek = document.getElementById('btn-view-week');
    const btnViewDay = document.getElementById('btn-view-day');
    const toggleWeekendsBtn = document.getElementById('toggle-weekends-btn');

    // Modal elements
    const modal = document.getElementById('event-modal');
    const closeModalBtns = document.querySelectorAll('.close-modal, #btn-close-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalTime = document.getElementById('modal-time');
    const modalLocation = document.getElementById('modal-location');

    let allEventsData = []; // Lưu trữ toàn bộ data từ API
    let calendar;
    let currentTab = 'all-events';
    
    // Quản lý trạng thái Custom Rooms View
    let currentRoomsDate = new Date(); // Start at today
    let roomsViewMode = 'week'; // 'week' hoặc 'day'
    let showWeekends = false;

    // Lấy ngày đầu tuần/ngày
    function getStartOfWeek(date) {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        d.setDate(diff);
        d.setHours(0, 0, 0, 0);
        return d;
    }

    function getStartOfDay(date) {
        const d = new Date(date);
        d.setHours(0, 0, 0, 0);
        return d;
    }

    // Khởi tạo FullCalendar
    calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'timeGridWeek',
        locale: 'vi',
        headerToolbar: {
            left: 'prev,next customToday',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
        },
        customButtons: {
            customToday: {
                text: 'Hôm nay',
                click: function() {
                    calendar.changeView('timeGridDay');
                    calendar.today();
                }
            }
        },
        buttonText: {
            month: 'Tháng',
            week: 'Tuần',
            day: 'Ngày'
        },
        slotMinTime: '07:00:00',
        slotMaxTime: '18:00:00',
        slotEventOverlap: false,
        weekends: showWeekends, // Ẩn hiện cuối tuần
        businessHours: {
            daysOfWeek: [ 1, 2, 3, 4, 5 ],
            startTime: '07:30',
            endTime: '16:30',
        },
        nowIndicator: true,
        events: fetchCalendarData,
        eventContent: function(arg) {
            let customHtml = `
                <div class="custom-event">
                    <div class="event-title" title="${arg.event.title}">${arg.event.title}</div>
                </div>
            `;
            return { html: customHtml };
        },
        eventClick: function(info) {
            openEventModal(info.event.title, info.event.start, info.event.end, info.event.extendedProps.location);
        }
    });

    calendar.render();

    function openEventModal(title, start, end, locationStr) {
        const startStr = start ? start.toLocaleString('vi-VN') : 'Không rõ';
        const endStr = end ? end.toLocaleString('vi-VN') : 'Không rõ';
        const location = locationStr || 'Không có thông tin địa điểm';
        
        modalTitle.textContent = title;
        modalTime.textContent = `${startStr} - ${endStr}`;
        modalLocation.textContent = location;
        
        modal.classList.add('show');
    }

    // Hàm gọi API lấy dữ liệu
    function fetchCalendarData(info, successCallback, failureCallback) {
        if (allEventsData && allEventsData.length > 0) {
            if (currentTab === 'all-events') {
                filterAndRenderEvents(allEventsData, successCallback);
            }
            return;
        }

        loaderEl.style.display = 'flex';

        fetch('/api/calendar?t=' + new Date().getTime())
            .then(response => {
                if (!response.ok) throw new Error('Lỗi khi tải dữ liệu');
                return response.text();
            })
            .then(text => {
                try {
                    const data = JSON.parse(text);
                    if (Array.isArray(data)) {
                        allEventsData = data;
                        updateRoomFilterDropdown(data);
                        
                        if (currentTab === 'all-events') {
                            filterAndRenderEvents(data, successCallback);
                        } else {
                            renderRoomsSchedule();
                            if (successCallback) successCallback([]);
                        }
                    } else {
                        throw new Error('Dữ liệu không đúng định dạng');
                    }
                } catch (e) {
                    throw new Error('Lỗi phân tích: ' + e.message);
                }
            })
            .catch(error => {
                console.error(error);
                alert('Không thể tải dữ liệu: ' + error.message);
                if (failureCallback) failureCallback(error);
            })
            .finally(() => {
                loaderEl.style.display = 'none';
            });
    }

    function categorizeLocation(loc) {
        if (!loc) return 'khac';
        const l = loc.toLowerCase();
        if (l.includes('tổng công ty') || l.includes('tct') || l.includes('evn') || l.includes('117 phổ quang')) return 'tct';
        if (l.includes('cơ quan') || l.includes('pcvt') || l.includes('điện lực vũng tàu') || 
            l.includes('pc vũng tàu') || l.includes('a204') || l.includes('a206') || l.includes('cơ sở')) return 'co-quan';
        return 'khac';
    }

    function getColorByDay(dateString) {
        if (!dateString) return 'var(--busy-color)';
        const date = new Date(dateString);
        const day = date.getDay();
        switch (day) {
            case 1: return '#1E88E5'; // Thứ 2
            case 2: return '#F4511E'; // Thứ 3
            case 3: return '#8E24AA'; // Thứ 4
            case 4: return '#00897B'; // Thứ 5
            case 5: return '#E53935'; // Thứ 6
            case 6: return '#757575'; // Thứ 7
            case 0: return '#616161'; // CN
            default: return 'var(--busy-color)';
        }
    }

    // CHUẨN HÓA PHÒNG HỌP THEO QUY TẮC
    function extractRoomName(location) {
        if (!location) return null;
        const l = location.toLowerCase();
        
        // 1. Phòng họp 1 (A206)
        if (l.includes('a206') || /\b206\b/.test(l) || /phòng\s*(họp\s*)?1\b/.test(l)) {
            return 'Phòng họp 1 (A206)';
        }
        
        // 2. Phòng họp 2 (A204)
        if (l.includes('a204') || /\b204\b/.test(l) || /\b205\b/.test(l) || /phòng\s*(họp\s*)?2\b/.test(l)) {
            return 'Phòng họp 2 (A204)';
        }

        // 3. Phòng họp 3 (A203)
        if (l.includes('a203') || (/\b203\b/.test(l) && !l.includes('c203')) || (/phòng\s*(họp\s*)?3\b/.test(l) && !l.includes('c203') && !l.includes('cũ'))) {
            return 'Phòng họp 3 (A203)';
        }

        // 4. Phòng họp 3 cũ (C203)
        if (l.includes('c203') || /phòng\s*(họp\s*)?3\s*cũ\b/.test(l)) {
            return 'Phòng họp 3 cũ (C203)';
        }

        // 5. Hội trường công ty
        if (l.includes('hội trường') || l.includes('60 trần hưng đạo') || l.includes('hoi truong')) {
            return 'Hội trường công ty';
        }

        return null; // Không thuộc 5 phòng trên
    }

    // Logic cho Tab Lịch Chung (FullCalendar)
    function filterAndRenderEvents(data, successCallback) {
        const filteredData = data;

        const busyEvents = filteredData.map(item => {
            if (!item || !item.start) return null;
            const eventColor = getColorByDay(item.start);
            return {
                title: item.title || 'Cuộc họp',
                start: item.start,
                end: item.end || item.start,
                location: item.location || '',
                backgroundColor: eventColor,
                borderColor: eventColor,
                textColor: '#fff',
                classNames: ['busy-event']
            };
        }).filter(e => e !== null);

        updateLiveTracker(busyEvents);

        if (successCallback) successCallback(busyEvents);
    }

    function updateLiveTracker(events) {
        if (!ongoingListEl || !upcomingListEl) return;
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
        const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

        let ongoing = [];
        let upcoming = [];

        events.forEach(evt => {
            const start = new Date(evt.start);
            const end = new Date(evt.end);

            // Bỏ qua nếu không phải hôm nay (tạm thời tracker chỉ quan tâm sự kiện đang/sẽ diễn ra hôm nay)
            if (end < now || start > endOfToday) return;

            if (start <= now && end >= now) {
                ongoing.push(evt);
            } else if (start > now && start <= endOfToday) {
                upcoming.push(evt);
            }
        });

        // Sắp xếp tăng dần theo thời gian bắt đầu
        upcoming.sort((a, b) => new Date(a.start) - new Date(b.start));

        function createEventHTML(evt, isOngoing) {
            const startTime = new Date(evt.start).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
            const endTime = new Date(evt.end).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
            return `
                <div class="tracker-item" onclick="document.dispatchEvent(new CustomEvent('openEventModal', {detail: {title: '${evt.title.replace(/'/g, "\\'")}', start: '${evt.start}', end: '${evt.end}', location: '${evt.location.replace(/'/g, "\\'")}'}}))">
                    <div class="tracker-time">${startTime} - ${endTime}</div>
                    <div class="tracker-title">${evt.title}</div>
                    ${evt.location ? `<div class="tracker-loc">📍 ${evt.location}</div>` : ''}
                </div>
            `;
        }

        if (ongoing.length === 0) {
            ongoingListEl.innerHTML = '<div class="empty-state">Hiện không có cuộc họp nào</div>';
        } else {
            ongoingListEl.innerHTML = ongoing.map(e => createEventHTML(e, true)).join('');
        }

        if (upcoming.length === 0) {
            upcomingListEl.innerHTML = '<div class="empty-state">Không có cuộc họp sắp tới trong ngày</div>';
        } else {
            upcomingListEl.innerHTML = upcoming.map(e => createEventHTML(e, false)).join('');
        }
    }

    // Lắng nghe event mở modal từ tracker
    document.addEventListener('openEventModal', function(e) {
        openEventModal(e.detail.title, new Date(e.detail.start), new Date(e.detail.end), e.detail.location);
    });

    // Logic cho Tab Lịch Phòng Họp (Custom HTML)
    function renderRoomsSchedule() {
        let periodStart, periodEnd, labelText;

        if (roomsViewMode === 'week') {
            periodStart = getStartOfWeek(currentRoomsDate);
            periodEnd = new Date(periodStart);
            const daysToAdd = showWeekends ? 6 : 4; // Nếu hiện cuối tuần thì hết CN (6), không thì hết T6 (4)
            periodEnd.setDate(periodEnd.getDate() + daysToAdd);
            periodEnd.setHours(23, 59, 59);

            const startStr = periodStart.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
            const endStr = periodEnd.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
            labelText = `Tuần: ${startStr} - ${endStr}`;
            
            btnPrevWeek.textContent = '❮ Tuần trước';
            btnNextWeek.textContent = 'Tuần sau ❯';
        } else {
            // Day mode
            periodStart = getStartOfDay(currentRoomsDate);
            periodEnd = new Date(periodStart);
            periodEnd.setHours(23, 59, 59);

            labelText = `Ngày: ${periodStart.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}`;
            
            btnPrevWeek.textContent = '❮ Ngày trước';
            btnNextWeek.textContent = 'Ngày sau ❯';
        }

        // Sync date picker input
        if (roomDatePicker) {
            const tzOffset = (new Date()).getTimezoneOffset() * 60000; // offset in milliseconds
            const localISOTime = (new Date(currentRoomsDate.getTime() - tzOffset)).toISOString().split('T')[0];
            roomDatePicker.value = localISOTime;
        }

        roomsWeekLabel.textContent = labelText;

        const selectedRoom = roomFilter ? roomFilter.value : '';

        // Lọc các sự kiện có phòng chuẩn và trong khoảng thời gian
        const periodEvents = allEventsData.filter(item => {
            if (!item || !item.start || !item.location) return false;
            const itemDate = new Date(item.start);
            if (itemDate < periodStart || itemDate > periodEnd) return false;
            
            const roomName = extractRoomName(item.location);
            if (!roomName) return false; // Chỉ lấy 3 phòng của Điện lực VT
            
            if (selectedRoom) {
                return roomName === selectedRoom;
            }
            return true;
        });

        // Nhóm theo tên phòng chuẩn
        const roomsMap = new Map();
        // Để hiển thị cả 5 phòng ngay cả khi không có sự kiện (nếu chưa chọn phòng lọc)
        const targetRooms = selectedRoom ? [selectedRoom] : ['Phòng họp 1 (A206)', 'Phòng họp 2 (A204)', 'Phòng họp 3 (A203)', 'Phòng họp 3 cũ (C203)', 'Hội trường công ty'];
        
        targetRooms.forEach(room => roomsMap.set(room, []));

        periodEvents.forEach(item => {
            const roomName = extractRoomName(item.location);
            if (roomsMap.has(roomName)) {
                roomsMap.get(roomName).push(item);
            }
        });

        // Generate HTML
        roomsWrapperEl.innerHTML = '';
        
        roomsMap.forEach((events, roomName) => {
            events.sort((a, b) => new Date(a.start) - new Date(b.start));

            const allRoomSlots = generateCombinedSlots(events, periodStart, periodEnd);

            const card = document.createElement('div');
            card.className = 'room-card';

            const header = document.createElement('div');
            header.className = 'room-card-header';
            header.textContent = roomName;
            card.appendChild(header);

            const list = document.createElement('ul');
            list.className = 'room-events-list';

            if (allRoomSlots.length === 0) {
                list.innerHTML = '<li style="padding: 1rem; text-align: center; color: var(--text-secondary);">Không có sự kiện.</li>';
            } else {
                allRoomSlots.forEach(slot => {
                    const li = document.createElement('li');
                    li.className = 'room-event-item';
                    if (slot.isEmpty) li.classList.add('empty-slot');

                    const timeStart = new Date(slot.start).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
                    const timeEnd = new Date(slot.end).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
                    const dateStr = new Date(slot.start).toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit' });

                    const timeDiv = document.createElement('div');
                    timeDiv.className = 'room-event-time';
                    timeDiv.textContent = roomsViewMode === 'week' ? `${dateStr} | ${timeStart} - ${timeEnd}` : `${timeStart} - ${timeEnd}`;
                    
                    const titleDiv = document.createElement('div');
                    titleDiv.className = 'room-event-title';
                    titleDiv.textContent = slot.title;

                    li.appendChild(timeDiv);
                    li.appendChild(titleDiv);

                    if (!slot.isEmpty) {
                        li.style.cursor = 'pointer';
                        li.addEventListener('click', () => {
                            openEventModal(slot.title, new Date(slot.start), new Date(slot.end), slot.location);
                        });
                    }

                    list.appendChild(li);
                });
            }

            card.appendChild(list);
            roomsWrapperEl.appendChild(card);
        });
    }

    function generateCombinedSlots(busyEvents, periodStart, periodEnd) {
        const combined = [];
        const workStartHour = 7;
        const workStartMinute = 30;
        const workEndHour = 16;
        const workEndMinute = 30;

        let currentDay = new Date(periodStart);

        while (currentDay <= periodEnd) {
            const dayOfWeek = currentDay.getDay();
            
            // Nếu không show cuối tuần, bỏ qua T7, CN
            if (!showWeekends && (dayOfWeek === 0 || dayOfWeek === 6)) {
                currentDay.setDate(currentDay.getDate() + 1);
                continue;
            }

            const dayStart = new Date(currentDay);
            dayStart.setHours(workStartHour, workStartMinute, 0, 0);

            const dayEnd = new Date(currentDay);
            dayEnd.setHours(workEndHour, workEndMinute, 0, 0);

            const dailyBusyEvents = busyEvents.filter(event => {
                const eventStart = new Date(event.start);
                const eventEnd = new Date(event.end);
                return eventStart < dayEnd && eventEnd > dayStart;
            }).map(event => {
                return {
                    ...event,
                    start: new Date(Math.max(new Date(event.start), dayStart)),
                    end: new Date(Math.min(new Date(event.end), dayEnd))
                };
            }).sort((a, b) => a.start - b.start);

            let currentTime = new Date(dayStart);

            for (let i = 0; i < dailyBusyEvents.length; i++) {
                const busyEvent = dailyBusyEvents[i];
                
                if (currentTime < busyEvent.start) {
                    combined.push({
                        title: 'Thời gian trống',
                        start: new Date(currentTime),
                        end: new Date(busyEvent.start),
                        isEmpty: true
                    });
                }
                
                combined.push({
                    title: busyEvent.title,
                    start: busyEvent.start,
                    end: busyEvent.end,
                    location: busyEvent.location,
                    isEmpty: false
                });

                currentTime = new Date(Math.max(currentTime, busyEvent.end));
            }

            if (currentTime < dayEnd) {
                combined.push({
                    title: 'Thời gian trống',
                    start: new Date(currentTime),
                    end: new Date(dayEnd),
                    isEmpty: true
                });
            }
            
            currentDay.setDate(currentDay.getDate() + 1);
        }

        return combined;
    }

    function updateRoomFilterDropdown(data) {
        if (!roomFilter) return;
        
        while (roomFilter.options.length > 1) {
            roomFilter.remove(1);
        }

        const sortedRooms = ['Phòng họp 1 (A206)', 'Phòng họp 2 (A204)', 'Phòng họp 3 (A203)', 'Phòng họp 3 cũ (C203)', 'Hội trường công ty'];
        sortedRooms.forEach(room => {
            const option = document.createElement('option');
            option.value = room;
            option.textContent = room;
            roomFilter.appendChild(option);
        });
    }

    // --- EVENTS ---

    // Toggle Weekends
    if (toggleWeekendsBtn) {
        toggleWeekendsBtn.addEventListener('click', () => {
            showWeekends = !showWeekends;
            // Update FullCalendar
            calendar.setOption('weekends', showWeekends);
            // Update Custom View
            if (currentTab === 'room-events') {
                renderRoomsSchedule();
            }
        });
    }

    // View Modes for Rooms
    if (btnViewWeek && btnViewDay) {
        btnViewWeek.addEventListener('click', () => {
            roomsViewMode = 'week';
            btnViewWeek.classList.add('active');
            btnViewDay.classList.remove('active');
            renderRoomsSchedule();
        });

        btnViewDay.addEventListener('click', () => {
            roomsViewMode = 'day';
            btnViewDay.classList.add('active');
            btnViewWeek.classList.remove('active');
            renderRoomsSchedule();
        });
    }

    // Xử lý chuyển Tabs
    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            tabBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            currentTab = this.getAttribute('data-tab');
            
            if (currentTab === 'all-events') {
                filterAllEvents.classList.add('active-filter');
                filterRoomEvents.classList.remove('active-filter');
                allEventsViewEl.style.display = 'flex';
                roomsContainerEl.style.display = 'none';
                calendar.render(); // Re-render to fix sizes
                calendar.refetchEvents();
            } else {
                filterAllEvents.classList.remove('active-filter');
                filterRoomEvents.classList.add('active-filter');
                allEventsViewEl.style.display = 'none';
                roomsContainerEl.style.display = 'block';
                renderRoomsSchedule();
            }
        });
    });

    if (roomFilter) {
        roomFilter.addEventListener('change', function() {
            if (currentTab === 'room-events') {
                renderRoomsSchedule();
            }
        });
    }

    if (roomDatePicker) {
        roomDatePicker.addEventListener('change', function() {
            if (this.value) {
                currentRoomsDate = new Date(this.value);
                if (currentTab === 'room-events') {
                    renderRoomsSchedule();
                }
            }
        });
    }



    if (refreshBtn) {
        refreshBtn.addEventListener('click', function() {
            allEventsData = []; // Clear cache
            if (currentTab === 'all-events') calendar.refetchEvents();
            else fetchCalendarData();
        });
    }

    // Room Week/Day Controls
    if (btnPrevWeek) {
        btnPrevWeek.addEventListener('click', () => {
            if (roomsViewMode === 'week') {
                currentRoomsDate.setDate(currentRoomsDate.getDate() - 7);
            } else {
                currentRoomsDate.setDate(currentRoomsDate.getDate() - 1);
            }
            renderRoomsSchedule();
        });
    }

    if (btnNextWeek) {
        btnNextWeek.addEventListener('click', () => {
            if (roomsViewMode === 'week') {
                currentRoomsDate.setDate(currentRoomsDate.getDate() + 7);
            } else {
                currentRoomsDate.setDate(currentRoomsDate.getDate() + 1);
            }
            renderRoomsSchedule();
        });
    }

    closeModalBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            modal.classList.remove('show');
        });
    });

    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('show');
        }
    });
});
