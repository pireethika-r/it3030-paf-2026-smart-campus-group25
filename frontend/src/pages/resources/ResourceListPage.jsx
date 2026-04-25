import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Search, Plus, MapPin, Users, Building2, Laptop,
    Presentation, Briefcase, Info, Settings
} from 'lucide-react';
import resourceApi from '../../api/resourceApi';
import { getAuthUser } from '../../auth/roles';

// --- UPDATED SUB-COMPONENT (DOT ONLY) ---
const LiveStatusIndicator = ({ status }) => {
    const getColor = () => {
        if (status === 'ACTIVE') return 'bg-emerald-500';
        if (status === 'BUSY') return 'bg-amber-500';
        return 'bg-rose-500';
    };

    return (
        <span className="relative flex h-2 w-2 mr-2">
            {/* Only pulse if the resource is Available or Busy */}
            {(status === 'ACTIVE' || status === 'BUSY') && (
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${getColor()}`}></span>
            )}
            <span className={`relative inline-flex rounded-full h-2 w-2 ${getColor()}`}></span>
        </span>
    );
};

const ResourceListPage = () => {
    const navigate = useNavigate();
    const [resources, setResources] = useState([]);
    const user = getAuthUser();
    const userRole = user?.role || 'USER';
    const isAdmin = userRole === 'ADMIN';
    const [viewMode, setViewMode] = useState('ADMIN');
    const [filters, setFilters] = useState({
        name: '', type: '', location: '', minCapacity: '', status: ''
    });

    const getStatusPreview = (dbStatus, availabilityWindow) => {
        const normalizedStatus = (dbStatus || '').toUpperCase();
        if (normalizedStatus === 'OUT_OF_SERVICE') return 'OUT OF SERVICE';
        if (!availabilityWindow) return 'No Schedule Set';

        const win = availabilityWindow.toUpperCase().trim();
        const now = new Date();
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const currentDayName = days[now.getDay()].toUpperCase();
        const currentHourValue = now.getHours() + now.getMinutes() / 60;

        const timeMatch = win.match(/(\d{1,2}[:.]\d{2})\s*[-TO/]\s*(\d{1,2}[:.]\d{2})/);
        if (!timeMatch) return 'Invalid Format';

        const [sH, sM] = timeMatch[1].replace('.', ':').split(':').map(Number);
        const [eH, eM] = timeMatch[2].replace('.', ':').split(':').map(Number);
        const isTimeAllowed = currentHourValue >= sH + sM / 60 && currentHourValue < eH + eM / 60;

        const dayPart = win.split(/\d/)[0].trim();
        let isDayAllowed = false;
        if (dayPart.includes('DAILY')) isDayAllowed = true;
        else if (dayPart.includes('-')) {
            const parts = dayPart.split('-');
            const startIdx = days.map((d) => d.toUpperCase()).indexOf(parts[0].trim());
            const endIdx = days.map((d) => d.toUpperCase()).indexOf(parts[1].trim());
            isDayAllowed = now.getDay() >= startIdx && now.getDay() <= endIdx;
        } else {
            isDayAllowed = dayPart.includes(currentDayName);
        }

        return isDayAllowed && isTimeAllowed ? 'Currently: AVAILABLE' : 'Currently: BUSY';
    };

    const getCardTone = (previewText) => {
        if (previewText.includes('AVAILABLE')) return 'ACTIVE';
        if (previewText.includes('OUT OF SERVICE')) return 'OUT_OF_SERVICE';
        return 'BUSY';
    };

    useEffect(() => {
        resourceApi.getAllResources()
            .then(res => setResources(res.data))
            .catch(err => console.error("Backend connection failed:", err));
    }, []);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const clearFilters = () => {
        setFilters({ name: '', type: '', location: '', minCapacity: '', status: '' });
    };

    const getTypeStyles = (type) => {
        switch (type) {
            case 'LAB': return 'bg-blue-50/70 border-blue-200 text-blue-700 border-t-4 border-t-blue-500';
            case 'EQUIPMENT': return 'bg-orange-50/70 border-orange-200 text-orange-700 border-t-4 border-t-orange-500';
            case 'LECTURE_HALL': return 'bg-emerald-50/70 border-emerald-200 text-emerald-700 border-t-4 border-t-emerald-500';
            case 'MEETING_ROOM': return 'bg-violet-50/70 border-violet-200 text-violet-700 border-t-4 border-t-violet-500';
            default: return 'bg-slate-50 border-slate-200 text-slate-700 border-t-4 border-t-slate-400';
        }
    };

    const filteredResources = resources.filter(item => {
        const currentStatus = getCardTone(getStatusPreview(item.status, item.availabilityWindows || item.availability_Windows));
        return (
            item.name.toLowerCase().includes(filters.name.toLowerCase()) &&
            item.type.toLowerCase().includes(filters.type.toLowerCase()) &&
            item.location.toLowerCase().includes(filters.location.toLowerCase()) &&
            currentStatus.toLowerCase().includes(filters.status.toLowerCase()) &&
            (filters.minCapacity === '' || item.capacity >= parseInt(filters.minCapacity))
        );
    });

    const showAdminControls = isAdmin && viewMode === 'ADMIN';

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-20 font-sans relative">
            {isAdmin && (
                <div className="fixed bottom-6 right-6 z-[100] flex gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl">
                    <button
                        type="button"
                        onClick={() => setViewMode('ADMIN')}
                        className={`rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'ADMIN' ? 'bg-[#003366] text-white shadow-lg' : 'bg-slate-100 text-slate-400'}`}
                    >
                        Admin View
                    </button>
                    <button
                        type="button"
                        onClick={() => setViewMode('USER')}
                        className={`rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'USER' ? 'bg-[#003366] text-white shadow-lg' : 'bg-slate-100 text-slate-400'}`}
                    >
                        Student View
                    </button>
                </div>
            )}

            <header style={{ backgroundColor: '#003366' }} className="relative text-white py-14 px-6 overflow-hidden">
                <div className="max-w-7xl mx-auto relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                    <div>
                        <h1 className="text-4xl font-black tracking-tight mb-1">EduTrack <span className="text-[#008080]">Inventory</span></h1>
                        <p className="text-blue-100/70 text-sm font-medium tracking-wide">SLIIT RESOURCE MANAGEMENT SYSTEM</p>
                    </div>
                    {showAdminControls && (
                        <button onClick={() => navigate('/admin/resources/add')} style={{ backgroundColor: '#F39200' }} className="flex items-center gap-2 text-white font-bold px-8 py-3.5 rounded-xl shadow-lg hover:brightness-110 transition-all text-sm">
                            <Plus size={20} strokeWidth={3} /> Add New Resource
                        </button>
                    )}
                </div>
            </header>

            {/* FILTER RIBBON */}
            <div className="bg-white/90 backdrop-blur-md border-b border-gray-200 sticky top-0 z-20 shadow-sm">
                <div className="max-w-7xl mx-auto p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 items-end">
                    {[
                        { label: 'Name', name: 'name', type: 'text', placeholder: 'Search...', icon: Search },
                        { label: 'Category', name: 'type', type: 'select', options: ['LAB', 'LECTURE_HALL', 'MEETING_ROOM', 'EQUIPMENT'] },
                        { label: 'Status', name: 'status', type: 'select', options: ['ACTIVE', 'BUSY', 'OUT_OF_SERVICE'] },
                        { label: 'Location', name: 'location', type: 'text', placeholder: 'Block...', icon: Building2 },
                        { label: 'Min Capacity', name: 'minCapacity', type: 'number', placeholder: 'Qty', icon: Users }
                    ].map((f) => (
                        <div key={f.name} className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">{f.label}</label>
                            <div className="relative">
                                {f.icon && <f.icon className="absolute left-3 top-2.5 text-slate-400" size={14} />}
                                {f.type === 'select' ? (
                                    <select name={f.name} value={filters[f.name]} onChange={handleFilterChange} className="w-full pl-3 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#008080] outline-none font-semibold text-slate-700 text-xs appearance-none">
                                        <option value="">All</option>
                                        {f.options.map(opt => (
                                            <option key={opt} value={opt}>{opt === 'ACTIVE' ? 'Available' : opt.replace('_', ' ')}</option>
                                        ))}
                                    </select>
                                ) : (
                                    <input type={f.type} name={f.name} value={filters[f.name]} onChange={handleFilterChange} placeholder={f.placeholder} className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#008080] outline-none text-xs font-semibold" />
                                )}
                            </div>
                        </div>
                    ))}
                    <button onClick={clearFilters} className="text-slate-400 hover:text-red-500 font-bold text-xs pb-2 transition-colors">Reset</button>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-6 py-12">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredResources.map((item) => {
                        const statusPreview = getStatusPreview(item.status, item.availabilityWindows || item.availability_Windows);
                        const displayStatus = getCardTone(statusPreview);

                        return (
                            <div key={item.id} className={`group ${getTypeStyles(item.type)} border rounded-[2rem] p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 flex flex-col justify-between h-full`}>
                                <div>
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="p-3 bg-white/80 rounded-xl shadow-sm text-slate-700">
                                            {item.type === 'LAB' ? <Laptop size={22} /> : item.type === 'EQUIPMENT' ? <Briefcase size={22} /> : <Presentation size={22} />}
                                        </div>

                                        {/* INTEGRATED STATUS BADGE WITH DOT */}
                                        <div className="flex flex-col items-end">
                                            <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-[9px] font-black tracking-widest uppercase border bg-white shadow-sm ${displayStatus === 'ACTIVE' ? 'border-emerald-200 text-emerald-600' :
                                                    displayStatus === 'BUSY' ? 'border-amber-200 text-amber-600' :
                                                        'border-rose-200 text-rose-600'
                                                }`}>
                                                <LiveStatusIndicator status={displayStatus} />
                                                {statusPreview}
                                            </span>
                                        </div>
                                    </div>
                                    <h3 className="text-xl font-black text-slate-800 leading-tight mb-1">{item.name}</h3>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.15em] mb-6">{item.type.replace('_', ' ')}</p>
                                    <div className="space-y-2 mb-6">
                                        <div className="flex items-center gap-2 text-slate-600 font-bold text-xs bg-white/40 p-2 rounded-lg inline-flex mr-2">
                                            <MapPin size={14} className="text-[#008080]" /> {item.location}
                                        </div>
                                        <div className="flex items-center gap-2 text-slate-600 font-bold text-xs bg-white/40 p-2 rounded-lg inline-flex">
                                            <Users size={14} className="text-[#F39200]" /> {item.capacity}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-3 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                                    {showAdminControls && (
                                        <button onClick={() => navigate(`/admin/resources/manage/${item.id}`)} className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl bg-[#008080] text-white shadow-md hover:shadow-teal-900/20 hover:-translate-y-0.5 transition-all duration-300">
                                            <Settings size={15} />
                                            <span className="font-bold text-[10px] uppercase tracking-widest">Manage</span>
                                        </button>
                                    )}
                                    <button onClick={() => navigate(`/resource/details/${item.id}`)} className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl bg-slate-900 text-white shadow-md hover:bg-slate-800 hover:-translate-y-0.5 transition-all duration-300">
                                        <Info size={15} />
                                        <span className="font-bold text-[10px] uppercase tracking-widest">Details</span>
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </main>
        </div>
    );
};

export default ResourceListPage;