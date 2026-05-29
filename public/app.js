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

    let allEventsData = []; // LÆ°u trá»¯ toÃ n bá»™ data tá»« API
    let calendar;
    let currentTab = 'all-events';
    
    // Quáº£n lÃ½ tráº¡ng thÃ¡i Custom Rooms View
    let currentRoomsDate = new Date(); // Start at today
    let roomsViewMode = 'week'; // 'week' hoáº·c 'day'
    let showWeekends = false;

    // Láº¥y ngÃ y Ä‘áº§u tuáº§n/ngÃ y
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

    // Khá»Ÿi táº¡o FullCalendar
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
                text: 'HÃ´m nay',
                click: function() {
                    calendar.changeView('timeGridDay');
                    calendar.today();
                }
            }
        },
        buttonText: {
            month: 'ThÃ¡ng',
            week: 'Tuáº§n',
            day: 'NgÃ y'
        },
        slotMinTime: '07:00:00',
        slotMaxTime: '18:00:00',
        slotEventOverlap: false,
        weekends: showWeekends, // áº¨n hiá»‡n cuá»‘i tuáº§n
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
        const startStr = start ? start.toLocaleString('vi-VN') : 'KhÃ´ng rÃµ';
        const endStr = end ? end.toLocaleString('vi-VN') : 'KhÃ´ng rÃµ';
        const location = locationStr || 'KhÃ´ng cÃ³ thÃ´ng tin Ä‘á»‹a Ä‘iá»ƒm';
        
        modalTitle.textContent = title;
        modalTime.textContent = `${startStr} - ${endStr}`;
        modalLocation.textContent = location;
        
        modal.classList.add('show');
    }

    // HÃ m gá»i API láº¥y dá»¯ liá»‡u
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
                if (!response.ok) throw new Error('Lá»—i khi táº£i dá»¯ liá»‡u');
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
                        throw new Error('Dá»¯ liá»‡u khÃ´ng Ä‘Ãºng Ä‘á»‹nh dáº¡ng');
                    }
                } catch (e) {
                    throw new Error('Lá»—i phÃ¢n tÃ­ch: ' + e.message);
                }
            })
            .catch(error => {
                console.error(error);
                alert('KhÃ´ng thá»ƒ táº£i dá»¯ liá»‡u: ' + error.message);
                if (failureCallback) failureCallback(error);
            })
            .finally(() => {
                loaderEl.style.display = 'none';
            });
    }

    function categorizeLocation(loc) {
        if (!loc) return 'khac';
        const l = loc.toLowerCase();
        if (l.includes('tá»•ng cÃ´ng ty') || l.includes('tct') || l.includes('evn') || l.includes('117 phá»• quang')) return 'tct';
        if (l.includes('cÆ¡ quan') || l.includes('pcvt') || l.includes('Ä‘iá»‡n lá»±c vÅ©ng tÃ u') || 
            l.includes('pc vÅ©ng tÃ u') || l.includes('a204') || l.includes('a206') || l.includes('cÆ¡ sá»Ÿ')) return 'co-quan';
        return 'khac';
    }

    function getColorByDay(dateString) {
        if (!dateString) return 'var(--busy-color)';
        const date = new Date(dateString);
        const day = date.getDay();
        switch (day) {
            case 1: return '#1E88E5'; // Thá»© 2
            case 2: return '#F4511E'; // Thá»© 3
            case 3: return '#8E24AA'; // Thá»© 4
            case 4: return '#00897B'; // Thá»© 5
            case 5: return '#E53935'; // Thá»© 6
            case 6: return '#757575'; // Thá»© 7
            case 0: return '#616161'; // CN
            default: return 'var(--busy-color)';
        }
    }

    // CHUáº¨N HÃ“A PHÃ’NG Há»ŒP THEO QUY Táº®C
    function extractRoomName(location) {
        if (!location) return null;
        const l = location.toLowerCase();
        
        // 1. PhÃ²ng há»p 1 (A206)
        if (l.includes('a206') || /\b206\b/.test(l) || /phÃ²ng\s*(há»p\s*)?1\b/.test(l)) {
            return 'PhÃ²ng há»p 1 (A206)';
        }
        
        // 2. PhÃ²ng há»p 2 (A204)
        if (l.includes('a204') || /\b204\b/.test(l) || /\b205\b/.test(l) || /phÃ²ng\s*(há»p\s*)?2\b/.test(l)) {
            return 'PhÃ²ng há»p 2 (A204)';
        }

        // 3. PhÃ²ng há»p 3 (A203)
        if (l.includes('a203') || (/\b203\b/.test(l) && !l.includes('c203')) || (/phÃ²ng\s*(há»p\s*)?3\b/.test(l) && !l.includes('c203') && !l.includes('cÅ©'))) {
            return 'PhÃ²ng há»p 3 (A203)';
        }

        // 4. PhÃ²ng há»p 3 cÅ© (C203)
        if (l.includes('c203') || /phÃ²ng\s*(há»p\s*)?3\s*cÅ©\b/.test(l)) {
            return 'PhÃ²ng há»p 3 cÅ© (C203)';
        }

        // 5. Há»™i trÆ°á»ng cÃ´ng ty
        if (l.includes('há»™i trÆ°á»ng') || l.includes('60 tráº§n hÆ°ng Ä‘áº¡o') || l.includes('hoi truong')) {
            return 'Há»™i trÆ°á»ng cÃ´ng ty';
        }

        return null; // KhÃ´ng thuá»™c 5 phÃ²ng trÃªn
    }

    // Logic cho Tab Lá»‹ch Chung (FullCalendar)
    function filterAndRenderEvents(data, successCallback) {
        const filteredData = data;

        const busyEvents = filteredData.map(item => {
            if (!item || !item.start) return null;
                        const roomCode = extractRoomName(item.location);
            let eventColor = '#7f8c8d'; // Mặc định cho 'Khác'
            if (roomCode === 'Phòng họp 1 (A206)') eventColor = '#e74c3c'; // Đỏ
            else if (roomCode === 'Phòng họp 2 (A204)') eventColor = '#3498db'; // Xanh dương
            else if (roomCode === 'Phòng họp 3 (A203)') eventColor = '#e67e22'; // Cam
            else if (roomCode === 'Phòng họp 3 cũ (C203)') eventColor = '#9b59b6'; // Tím
            else if (roomCode === 'Hội trường công ty') eventColor = '#1abc9c'; // Xanh lá
            return {
                title: item.title || 'Cuá»™c há»p',
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

            // Bá» qua náº¿u khÃ´ng pháº£i hÃ´m nay (táº¡m thá»i tracker chá»‰ quan tÃ¢m sá»± kiá»‡n Ä‘ang/sáº½ diá»…n ra hÃ´m nay)
            if (end < now || start > endOfToday) return;

            if (start <= now && end >= now) {
                ongoing.push(evt);
            } else if (start > now && start <= endOfToday) {
                upcoming.push(evt);
            }
        });

        // Sáº¯p xáº¿p tÄƒng dáº§n theo thá»i gian báº¯t Ä‘áº§u
        upcoming.sort((a, b) => new Date(a.start) - new Date(b.start));

        function createEventHTML(evt, isOngoing) {
            const startTime = new Date(evt.start).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
            const endTime = new Date(evt.end).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
            return `
                <div class="tracker-item" onclick="document.dispatchEvent(new CustomEvent('openEventModal', {detail: {title: '${evt.title.replace(/'/g, "\\'")}', start: '${evt.start}', end: '${evt.end}', location: '${evt.location.replace(/'/g, "\\'")}'}}))">
                    <div class="tracker-time">${startTime} - ${endTime}</div>
                    <div class="tracker-title">${evt.title}</div>
                    ${evt.location ? `<div class="tracker-loc">ðŸ“ ${evt.location}</div>` : ''}
                </div>
            `;
        }

        if (ongoing.length === 0) {
            ongoingListEl.innerHTML = '<div class="empty-state">Hiá»‡n khÃ´ng cÃ³ cuá»™c há»p nÃ o</div>';
        } else {
            ongoingListEl.innerHTML = ongoing.map(e => createEventHTML(e, true)).join('');
        }

        if (upcoming.length === 0) {
            upcomingListEl.innerHTML = '<div class="empty-state">KhÃ´ng cÃ³ cuá»™c há»p sáº¯p tá»›i trong ngÃ y</div>';
        } else {
            upcomingListEl.innerHTML = upcoming.map(e => createEventHTML(e, false)).join('');
        }
    }

    // Láº¯ng nghe event má»Ÿ modal tá»« tracker
    document.addEventListener('openEventModal', function(e) {
        openEventModal(e.detail.title, new Date(e.detail.start), new Date(e.detail.end), e.detail.location);
    });

    // Logic cho Tab Lá»‹ch PhÃ²ng Há»p (Custom HTML)
    function renderRoomsSchedule() {
        let periodStart, periodEnd, labelText;

        if (roomsViewMode === 'week') {
            periodStart = getStartOfWeek(currentRoomsDate);
            periodEnd = new Date(periodStart);
            const daysToAdd = showWeekends ? 6 : 4; // Náº¿u hiá»‡n cuá»‘i tuáº§n thÃ¬ háº¿t CN (6), khÃ´ng thÃ¬ háº¿t T6 (4)
            periodEnd.setDate(periodEnd.getDate() + daysToAdd);
            periodEnd.setHours(23, 59, 59);

            const startStr = periodStart.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
            const endStr = periodEnd.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
            labelText = `Tuáº§n: ${startStr} - ${endStr}`;
            
            btnPrevWeek.textContent = 'â® Tuáº§n trÆ°á»›c';
            btnNextWeek.textContent = 'Tuáº§n sau â¯';
        } else {
            // Day mode
            periodStart = getStartOfDay(currentRoomsDate);
            periodEnd = new Date(periodStart);
            periodEnd.setHours(23, 59, 59);

            labelText = `NgÃ y: ${periodStart.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}`;
            
            btnPrevWeek.textContent = 'â® NgÃ y trÆ°á»›c';
            btnNextWeek.textContent = 'NgÃ y sau â¯';
        }

        // Sync date picker input
        if (roomDatePicker) {
            const tzOffset = (new Date()).getTimezoneOffset() * 60000; // offset in milliseconds
            const localISOTime = (new Date(currentRoomsDate.getTime() - tzOffset)).toISOString().split('T')[0];
            roomDatePicker.value = localISOTime;
        }

        roomsWeekLabel.textContent = labelText;

        const selectedRoom = roomFilter ? roomFilter.value : '';

        // Lá»c cÃ¡c sá»± kiá»‡n cÃ³ phÃ²ng chuáº©n vÃ  trong khoáº£ng thá»i gian
        const periodEvents = allEventsData.filter(item => {
            if (!item || !item.start || !item.location) return false;
            const itemDate = new Date(item.start);
            if (itemDate < periodStart || itemDate > periodEnd) return false;
            
            const roomName = extractRoomName(item.location);
            if (!roomName) return false; // Chá»‰ láº¥y 3 phÃ²ng cá»§a Äiá»‡n lá»±c VT
            
            if (selectedRoom) {
                return roomName === selectedRoom;
            }
            return true;
        });

        // NhÃ³m theo tÃªn phÃ²ng chuáº©n
        const roomsMap = new Map();
        // Äá»ƒ hiá»ƒn thá»‹ cáº£ 5 phÃ²ng ngay cáº£ khi khÃ´ng cÃ³ sá»± kiá»‡n (náº¿u chÆ°a chá»n phÃ²ng lá»c)
        const targetRooms = selectedRoom ? [selectedRoom] : ['PhÃ²ng há»p 1 (A206)', 'PhÃ²ng há»p 2 (A204)', 'PhÃ²ng há»p 3 (A203)', 'PhÃ²ng há»p 3 cÅ© (C203)', 'Há»™i trÆ°á»ng cÃ´ng ty'];
        
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
                list.innerHTML = '<li style="padding: 1rem; text-align: center; color: var(--text-secondary);">KhÃ´ng cÃ³ sá»± kiá»‡n.</li>';
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
            
            // Náº¿u khÃ´ng show cuá»‘i tuáº§n, bá» qua T7, CN
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
                        title: 'Thá»i gian trá»‘ng',
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
                    title: 'Thá»i gian trá»‘ng',
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

        const sortedRooms = ['PhÃ²ng há»p 1 (A206)', 'PhÃ²ng há»p 2 (A204)', 'PhÃ²ng há»p 3 (A203)', 'PhÃ²ng há»p 3 cÅ© (C203)', 'Há»™i trÆ°á»ng cÃ´ng ty'];
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

    // Xá»­ lÃ½ chuyá»ƒn Tabs
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
