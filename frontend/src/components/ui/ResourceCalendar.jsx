import React from 'react';
import { Clock, Calendar as CalendarIcon } from 'lucide-react';

const ResourceCalendar = ({ availabilityWindow = "", bookedSlotKeys = new Set() }) => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    const hours = [
        { label: '08:00', value: 8 },
        { label: '10:00', value: 10 },
        { label: '12:00', value: 12 },
        { label: '14:00', value: 14 },
        { label: '16:00', value: 16 },
        { label: '18:00', value: 18 }
    ];

    const isSlotAvailable = (dayName, hourValue) => {
        if (!availabilityWindow) return false;
        const win = availabilityWindow.toUpperCase().trim();
        const timeMatch = win.match(/(\d{1,2}[:.]\d{2})\s*[-TO/]\s*(\d{1,2}[:.]\d{2})/);
        let isTimeAllowed = true;

        if (timeMatch) {
            const startStr = timeMatch[1].replace('.', ':');
            const endStr = timeMatch[2].replace('.', ':');
            const [sH, sM] = startStr.split(':').map(Number);
            const [eH, eM] = endStr.split(':').map(Number);
            const startTimeValue = sH + (sM / 60);
            const endTimeValue = eH + (eM / 60);
            isTimeAllowed = hourValue >= startTimeValue && hourValue < endTimeValue;
        }

        const dayPart = win.split(/\d/)[0].trim();
        let isDayAllowed = false;
        if (dayPart.includes("DAILY")) isDayAllowed = true;
        else if (dayPart.includes('-') || dayPart.includes('TO')) {
            const parts = dayPart.split(/[-]|TO/);
            const startIndex = days.findIndex(d => d.toUpperCase() === parts[0].trim());
            const endIndex = days.findIndex(d => d.toUpperCase() === parts[1].trim());
            const currentDayIdx = days.indexOf(dayName);
            isDayAllowed = currentDayIdx >= startIndex && currentDayIdx <= endIndex;
        } else isDayAllowed = dayPart.includes(dayName.toUpperCase());

        return isDayAllowed && isTimeAllowed;
    };

    const currentDayIndex = new Date().getDay();
    const currentHour = new Date().getHours();
    const todayIndex = [6, 0, 1, 2, 3, 4, 5][currentDayIndex];

    return (
        <div className="bg-[#F8FAFC] rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden font-sans">
            {/* Minimalist Light Header */}
            <div className="p-8 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-[#003366] shadow-sm border border-slate-100">
                        <CalendarIcon size={22} />
                    </div>
                    <div>
                        <h3 className="text-[#003366] font-black text-base uppercase tracking-tight">
                            Weekly <span className="text-[#F39200]">Availability</span>
                        </h3>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                Live System Status
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-slate-200 shadow-sm self-start md:self-center">
                    <Clock size={14} className="text-[#F39200]" />
                    <span className="text-[#003366] text-[10px] font-black uppercase tracking-wider">
                        {availabilityWindow || "Pending Schedule"}
                    </span>
                </div>
            </div>

            {/* The Grid UI */}
            <div className="px-8 pb-8 overflow-x-auto">
                <div className="min-w-[600px] grid grid-cols-8 gap-3">
                    <div className="h-8"></div> {/* Corner Spacer */}
                    {days.map((day, idx) => (
                        <div key={day} className="text-center">
                            <span className={`text-[10px] font-black uppercase tracking-[0.15em] ${idx === todayIndex ? 'text-[#F39200]' : 'text-slate-400'}`}>
                                {day}
                            </span>
                        </div>
                    ))}

                    {hours.map((hourObj) => (
                        <React.Fragment key={hourObj.label}>
                            <div className="flex items-center justify-end pr-3">
                                <span className="text-[10px] font-bold text-slate-400 uppercase">{hourObj.label}</span>
                            </div>
                            {days.map((day, dIdx) => {
                                const withinSchedule = isSlotAvailable(day, hourObj.value);
                                const booked = bookedSlotKeys.has(`${day}-${hourObj.value}`);
                                const available = withinSchedule && !booked;
                                const isLiveNow = dIdx === todayIndex && (currentHour >= hourObj.value && currentHour < hourObj.value + 2);

                                return (
                                    <div
                                        key={`${day}-${hourObj.label}`}
                                        className={`h-14 rounded-2xl border transition-all duration-300 relative
                                            ${available
                                                ? 'bg-[#003380] border-[#003380] shadow-md shadow-blue-600/10'
                                                : booked
                                                    ? 'bg-rose-300/80 border-rose-200 opacity-100'
                                                    : 'bg-slate-400/60 border-slate-100 opacity-100'
                                            }
                                            ${isLiveNow && available ? 'ring-4 ring-[#F39200] ring-offset-2 scale-[1.05] z-10' : ''}
                                        `}
                                    >
                                        {/* Status Indicator Center Dot */}
                                        {available && (
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <div className={`w-1.5 h-1.5 rounded-full ${isLiveNow ? 'bg-[#F39200]' : 'bg-white/30'}`} />
                                            </div>
                                        )}

                                        {isLiveNow && available && (
                                            <span className="absolute -top-2.5 -right-1 bg-[#F39200] text-white text-[7px] font-black px-1.5 py-0.5 rounded shadow-sm uppercase tracking-tighter">
                                                Active
                                            </span>
                                        )}

                                        {booked && (
                                            <span className="absolute -top-2.5 -right-1 bg-rose-500 text-white text-[7px] font-black px-1.5 py-0.5 rounded shadow-sm uppercase tracking-tighter">
                                                Booked
                                            </span>
                                        )}
                                    </div>
                                );
                            })}
                        </React.Fragment>
                    ))}
                </div>
            </div>

            {/* Legend - High Contrast Light Style */}
            <div className="bg-white p-6 flex justify-center gap-10 border-t border-slate-100">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-[#003366]" />
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Available</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-slate-400 opacity-80" />
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Unavailable</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-rose-400" />
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Booked</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded ring-2 ring-[#F39200] bg-[#003366]" />
                    <span className="text-[9px] font-black text-[#F39200] uppercase tracking-widest">Current Slot</span>
                </div>
            </div>
        </div>
    );
};

export default ResourceCalendar;