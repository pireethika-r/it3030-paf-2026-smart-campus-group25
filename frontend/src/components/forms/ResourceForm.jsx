import React from 'react';
import InputField from '../common/InputField';

const ResourceForm = ({ resource, handleChange, children, requireOperatingHours = false }) => {
    
    // Simple check to see if the current input matches basic expected patterns
    const isValidFormat = (str) => {
        if (!str) return false;
        const pattern = /([A-Z,-]+)\s+(\d{1,2}[:.]\d{2})\s*[-TO/]\s*(\d{1,2}[:.]\d{2})/;
        return pattern.test(str.toUpperCase());
    };

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputField
                    label="Resource Name"
                    name="name"
                    value={resource.name || ''}
                    onChange={handleChange}
                    placeholder="e.g. Computing Lab 01"
                    required
                />

                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Category</label>
                    <select
                        name="type"
                        value={resource.type || 'LAB'}
                        onChange={handleChange}
                        className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#008080] outline-none font-semibold text-slate-700 appearance-none transition-all cursor-pointer"
                    >
                        <option value="LAB">Laboratory</option>
                        <option value="LECTURE_HALL">Lecture Hall</option>
                        <option value="MEETING_ROOM">Meeting Room</option>
                        <option value="EQUIPMENT">Equipment</option>
                    </select>
                </div>

                <InputField
                    label="Location (Block/Floor)"
                    name="location"
                    value={resource.location || ''}
                    onChange={handleChange}
                    placeholder="e.g. Block D, Level 3"
                    required
                />

                <InputField
                    label="Total Capacity"
                    name="capacity"
                    type="number"
                    value={resource.capacity || ''}
                    onChange={handleChange}
                    placeholder="Number of units"
                    required
                />

                {/* Automated Status Logic Selection */}
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Operational Status</label>
                    <select
                        name="status"
                        value={resource.status || 'AUTO'}
                        onChange={handleChange}
                        className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#008080] outline-none font-semibold text-slate-700 appearance-none transition-all cursor-pointer"
                    >
                        <option value="AUTO">Automatic (Sync with Hours)</option>
                        <option value="OUT_OF_SERVICE">Out of Service (Manual)</option>
                    </select>
                    <p className={`text-[9px] font-bold ml-1 uppercase tracking-tight transition-colors ${resource.status === 'AUTO' ? 'text-[#008080]' : 'text-rose-500'}`}>
                        {resource.status === 'AUTO'
                            }
                    </p>
                </div>

                {/* Operating Hours with Interactive Helper */}
                <div className="space-y-2">
                    <InputField
                        label="Operating Hours"
                        name="availabilityWindows"
                        value={resource.availabilityWindows || resource.availability_Windows || ''}
                        onChange={handleChange}
                        placeholder="e.g. MON-FRI 08:30 - 17:30"
                        required={requireOperatingHours}
                    />

                    <div className={`mt-2 p-4 rounded-2xl border border-dashed transition-all duration-300 ${
                        isValidFormat(resource.availabilityWindows || resource.availability_Windows) 
                        ? 'bg-emerald-50/50 border-emerald-200' 
                        : 'bg-slate-50 border-slate-200'
                    }`}>
                        <div className="flex justify-between items-center mb-3">
                            <p className="text-[10px] font-black text-[#003366] uppercase tracking-widest flex items-center gap-2">
                                <span className={`w-1.5 h-1.5 rounded-full ${isValidFormat(resource.availabilityWindows || resource.availability_Windows) ? 'bg-emerald-500' : 'bg-slate-300 animate-pulse'}`}></span>
                                Smart Calendar Guide
                            </p>
                            {isValidFormat(resource.availabilityWindows || resource.availability_Windows) && (
                                <span className="text-[8px] font-black text-emerald-600 uppercase bg-emerald-100 px-2 py-0.5 rounded-md">Valid Format</span>
                            )}
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <p className="text-[8px] font-bold text-slate-400 uppercase">Single / Multiple</p>
                                <div className="bg-white p-1.5 rounded-lg border border-slate-100 text-[9px] font-mono text-slate-500 font-bold shadow-sm">
                                    MON 08:00 - 17:00
                                </div>
                                <div className="bg-white p-1.5 rounded-lg border border-slate-100 text-[9px] font-mono text-slate-500 font-bold shadow-sm">
                                    TUE, FRI 09:00 - 14:00
                                </div>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[8px] font-bold text-slate-400 uppercase">Ranges / All Week</p>
                                <div className="bg-white p-1.5 rounded-lg border border-slate-100 text-[9px] font-mono text-slate-500 font-bold shadow-sm">
                                    MON-FRI 08:30 - 17:30
                                </div>
                                <div className="bg-white p-1.5 rounded-lg border border-slate-100 text-[9px] font-mono text-slate-500 font-bold shadow-sm">
                                    DAILY 08:00 - 22:00
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {children}
        </div>
    );
};

export default ResourceForm;