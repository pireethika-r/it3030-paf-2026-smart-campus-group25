import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    MapPin, Users, Info, Laptop,
    Presentation, Briefcase, ChevronLeft, CalendarDays, Loader2
} from 'lucide-react';
import resourceApi from '../../api/resourceApi';
import { getCalendarBookings } from '../../api/bookingApi';

// Import the Innovative Component
import ResourceCalendar from '../../components/ui/ResourceCalendar';

const ResourceDetailsPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [resource, setResource] = useState(null);
    const [loading, setLoading] = useState(true);
    const [bookedSlotKeys, setBookedSlotKeys] = useState(new Set());
    const availabilityWindow = resource?.availabilityWindows || resource?.availability_Windows || '';

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const toDateString = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const getCurrentWeekRange = () => {
        const today = new Date();
        const start = new Date(today);
        const end = new Date(today);
        const day = today.getDay();
        const diffToMonday = day === 0 ? -6 : 1 - day;
        start.setDate(today.getDate() + diffToMonday);
        end.setDate(start.getDate() + 6);
        return { from: toDateString(start), to: toDateString(end) };
    };

    const buildBookedSlotKeySet = (bookings, resourceName) => {
        const keys = new Set();
        const normalizedResourceName = (resourceName || '').trim().toLowerCase();

        bookings
            .filter((booking) => {
                const status = (booking?.status || '').toUpperCase();
                const bookingResourceName = (booking?.resourceName || '').trim().toLowerCase();
                return (
                    (status === 'APPROVED' || status === 'PENDING') &&
                    bookingResourceName === normalizedResourceName
                );
            })
            .forEach((booking) => {
                if (!booking?.bookingDate || !booking?.startTime || !booking?.endTime) return;

                const date = new Date(`${booking.bookingDate}T00:00:00`);
                const dayName = dayNames[date.getDay()];
                const [startHour, startMinute] = String(booking.startTime).split(':').map(Number);
                const [endHour, endMinute] = String(booking.endTime).split(':').map(Number);
                const startValue = startHour + (startMinute || 0) / 60;
                const endValue = endHour + (endMinute || 0) / 60;

                [8, 10, 12, 14, 16, 18].forEach((slotHour) => {
                    const slotEnd = slotHour + 2;
                    const overlaps = startValue < slotEnd && endValue > slotHour;
                    if (overlaps) {
                        keys.add(`${dayName}-${slotHour}`);
                    }
                });
            });

        return keys;
    };

    // --- SMART STATUS CALCULATION ENGINE ---
    const getSmartStatus = (dbStatus, availabilityWindow) => {
        if (dbStatus === 'OUT_OF_SERVICE') return { label: 'OUT OF SERVICE', color: 'bg-rose-500' };

        // If status is AUTO, ACTIVE, or BUSY, we check the clock
        if (!availabilityWindow) return { label: 'CLOSED', color: 'bg-slate-500' };

        const win = availabilityWindow.toUpperCase().trim();
        const now = new Date();
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const currentDayName = days[now.getDay()].toUpperCase();
        const currentHourValue = now.getHours() + (now.getMinutes() / 60);

        // 1. Time Check
        const timeMatch = win.match(/(\d{1,2}[:.]\d{2})\s*[-TO/]\s*(\d{1,2}[:.]\d{2})/);
        let isTimeAllowed = false;
        if (timeMatch) {
            const startStr = timeMatch[1].replace('.', ':');
            const endStr = timeMatch[2].replace('.', ':');
            const [sH, sM] = startStr.split(':').map(Number);
            const [eH, eM] = endStr.split(':').map(Number);
            isTimeAllowed = currentHourValue >= (sH + sM / 60) && currentHourValue < (eH + eM / 60);
        }

        // 2. Day Check
        const dayPart = win.split(/\d/)[0].trim();
        let isDayAllowed = false;
        if (dayPart.includes("DAILY")) {
            isDayAllowed = true;
        } else if (dayPart.includes('-') || dayPart.includes('TO')) {
            const parts = dayPart.split(/[-]|TO/);
            const startIdx = days.map(d => d.toUpperCase()).indexOf(parts[0].trim());
            const endIdx = days.map(d => d.toUpperCase()).indexOf(parts[1].trim());
            const currentIdx = now.getDay();
            isDayAllowed = currentIdx >= startIdx && currentIdx <= endIdx;
        } else {
            isDayAllowed = dayPart.includes(currentDayName);
        }

        return (isDayAllowed && isTimeAllowed)
            ? { label: 'AVAILABLE NOW', color: 'bg-[#008080]' }
            : { label: 'BUSY / CLOSED', color: 'bg-amber-500' };
    };

    useEffect(() => {
        resourceApi.getResourceById(id)
            .then(res => {
                setResource(res.data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Error fetching resource:", err);
                setLoading(false);
            });
    }, [id]);

    useEffect(() => {
        if (!resource?.name) return;

        const { from, to } = getCurrentWeekRange();
        getCalendarBookings({ from, to })
            .then((bookings) => {
                setBookedSlotKeys(buildBookedSlotKeySet(Array.isArray(bookings) ? bookings : [], resource.name));
            })
            .catch(() => {
                setBookedSlotKeys(new Set());
            });
    }, [resource]);

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <Loader2 className="animate-spin text-[#003366]" size={40} />
        </div>
    );

    if (!resource) return (
        <div className="min-h-screen flex items-center justify-center font-bold text-red-400 uppercase tracking-widest">
            Resource not found.
        </div>
    );

    // Calculate the live status based on current time
    const liveStatus = getSmartStatus(resource.status, availabilityWindow);

    return (
        <div className="min-h-screen bg-[#F8FAFC] p-6 md:p-12 font-sans">
            <div className="max-w-5xl mx-auto">

                {/* Back Navigation */}
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-slate-500 hover:text-[#003366] font-bold text-sm mb-8 transition-colors"
                >
                    <ChevronLeft size={18} /> Back to Catalogue
                </button>

                <div className="bg-white rounded-[3rem] shadow-xl shadow-slate-200/50 overflow-hidden border border-slate-100">

                    {/* Header Block */}
                    <div className="bg-[#003366] p-10 md:p-12 text-white flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-6">
                            <div className="p-5 bg-white/10 backdrop-blur-md rounded-3xl text-[#008080]">
                                {resource.type === 'LAB' ? <Laptop size={42} /> :
                                    resource.type === 'EQUIPMENT' ? <Briefcase size={42} /> :
                                        <Presentation size={42} />}
                            </div>
                            <div>
                                <h1 className="text-3xl md:text-4xl font-black tracking-tight leading-tight">
                                    {resource.name}
                                </h1>
                                <div className="flex items-center gap-3 mt-2">
                                    {/* UPDATED: Dynamic Live Status Badge */}
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase text-white shadow-sm ${liveStatus.color}`}>
                                        {liveStatus.label}
                                    </span>
                                    <p className="text-blue-100/40 text-[10px] font-bold uppercase tracking-widest">ID: {id}</p>
                                </div>
                            </div>
                        </div>
                        <div className="text-left md:text-right">
                            <p className="text-[10px] font-black text-blue-200/50 uppercase tracking-[0.2em] mb-1">Resource Category</p>
                            <p className="text-xl font-bold text-[#008080]">{resource.type.replace('_', ' ')}</p>
                        </div>
                    </div>

                    <div className="p-10 md:p-14">
                        {/* Main Grid: Left Specs, Right Calendar */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">

                            {/* Left Column: Metadata Specs */}
                            <div className="lg:col-span-1 space-y-10">
                                <div className="flex gap-5">
                                    <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-slate-50 rounded-2xl text-slate-400">
                                        <MapPin size={24} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Location</p>
                                        <p className="text-lg font-bold text-slate-700">{resource.location}</p>
                                    </div>
                                </div>

                                <div className="flex gap-5">
                                    <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-slate-50 rounded-2xl text-slate-400">
                                        <Users size={24} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Max Capacity</p>
                                        <p className="text-lg font-bold text-slate-700">{resource.capacity} Students</p>
                                    </div>
                                </div>

                                <div className="flex gap-5">
                                    <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-slate-50 rounded-2xl text-slate-400">
                                        <Info size={24} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">System Mode</p>
                                        <p className="text-lg font-bold text-slate-700 capitalize">
                                            {resource.status === 'AUTO' ? 'Automated Scheduling' : 'Manual Override'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Right Column: Innovative Calendar View */}
                            <div className="lg:col-span-2">
                                {availabilityWindow ? (
                                    <ResourceCalendar availabilityWindow={availabilityWindow} bookedSlotKeys={bookedSlotKeys} />
                                ) : (
                                    <div className="flex min-h-[520px] items-center justify-center rounded-[2rem] border border-dashed border-slate-200 bg-slate-50 px-6 text-center">
                                        <div>
                                            <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">Schedule not configured</p>
                                            <p className="mt-2 text-sm text-slate-500">This resource does not have operating hours saved yet, so the availability grid cannot be shown.</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Footer Action Area */}
                        <div className="mt-16 pt-10 border-t border-slate-50">
                            {/* Disable button if out of service */}
                            <button
                                onClick={() => navigate(`/booking?resourceId=${resource.id}`)}
                                disabled={resource.status === 'OUT_OF_SERVICE'}
                                className={`w-full flex items-center justify-center gap-4 py-6 rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] shadow-2xl transition-all duration-300 ${resource.status === 'OUT_OF_SERVICE'
                                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                                        : 'bg-[#003366] text-white shadow-blue-900/20 hover:brightness-110 hover:-translate-y-1'
                                    }`}
                            >
                                <CalendarDays size={20} />
                                {resource.status === 'OUT_OF_SERVICE' ? 'Resource Unavailable' : 'Confirm Reservation'}
                            </button>
                            <p className="text-center text-slate-300 text-[9px] font-bold uppercase tracking-[0.2em] mt-8">
                                Smart Campus Resource Management System � Module A
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ResourceDetailsPage;