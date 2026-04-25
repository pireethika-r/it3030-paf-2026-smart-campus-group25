import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Trash2, Loader2 } from 'lucide-react';
import resourceApi from '../../api/resourceApi';

// Import Modular Components
import ActionButton from '../../components/common/ActionButton';
import StatusAlert from '../../components/common/StatusAlert';
import ResourceForm from '../../components/forms/ResourceForm';

// Import Custom Hook
import { useResourceData } from '../../hooks/useResourceData';

const ManageResourcePage = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const { resource, loading, handleChange } = useResourceData(id);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const availabilityWindow = resource?.availabilityWindows || resource?.availability_Windows || '';

    const getLivePreviewStatus = () => {
        if (!availabilityWindow) return "No Schedule Set";

        const win = availabilityWindow.toUpperCase().trim();
        const now = new Date();
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const currentDayName = days[now.getDay()].toUpperCase();
        const currentHourValue = now.getHours() + (now.getMinutes() / 60);

        const timeMatch = win.match(/(\d{1,2}[:.]\d{2})\s*[-TO/]\s*(\d{1,2}[:.]\d{2})/);
        if (!timeMatch) return "Invalid Format";

        const [sH, sM] = timeMatch[1].replace('.', ':').split(':').map(Number);
        const [eH, eM] = timeMatch[2].replace('.', ':').split(':').map(Number);
        const isTimeAllowed = currentHourValue >= (sH + sM / 60) && currentHourValue < (eH + eM / 60);

        const dayPart = win.split(/\d/)[0].trim();
        let isDayAllowed = false;
        if (dayPart.includes("DAILY")) isDayAllowed = true;
        else if (dayPart.includes('-')) {
            const parts = dayPart.split('-');
            const startIdx = days.map(d => d.toUpperCase()).indexOf(parts[0].trim());
            const endIdx = days.map(d => d.toUpperCase()).indexOf(parts[1].trim());
            isDayAllowed = now.getDay() >= startIdx && now.getDay() <= endIdx;
        } else isDayAllowed = dayPart.includes(currentDayName);

        return isDayAllowed && isTimeAllowed ? "Currently: AVAILABLE" : "Currently: BUSY";
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        const operatingHours = (resource?.availabilityWindows || resource?.availability_Windows || '').trim();

        if (!operatingHours) {
            setMessage({ type: 'error', text: 'Validation Failed: Operating Hours is required.' });
            return;
        }

        if (resource.capacity < 0) {
            setMessage({ type: 'error', text: 'Validation Failed: Capacity cannot be negative.' });
            return;
        }

        setSaving(true);
        setMessage({ type: '', text: '' });

        try {
            await resourceApi.updateResource(id, resource);
            setMessage({ type: 'success', text: 'Resource updated successfully!' });
            setTimeout(() => navigate('/admin/dashboard?section=Resources'), 1200);
        } catch (err) {
            console.error("Update error:", err);
            setMessage({ type: 'error', text: 'Update failed. Please check your data.' });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (window.confirm("CRITICAL: Are you sure you want to delete this resource?")) {
            try {
                await resourceApi.deleteResource(id);
                navigate('/admin/dashboard?section=Resources');
            } catch (err) {
                setMessage({ type: 'error', text: 'Could not delete resource.' });
            }
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <Loader2 className="animate-spin text-[#003366]" size={40} />
        </div>
    );

    return (
        <div className="min-h-screen bg-[#F8FAFC] p-6 md:p-12 font-sans">
            <div className="max-w-3xl mx-auto">
                <button
                    onClick={() => navigate('/admin/dashboard?section=Resources')}
                    className="flex items-center gap-2 text-slate-500 hover:text-[#003366] font-bold text-sm mb-8 transition-colors"
                >
                    <ArrowLeft size={18} /> Back to Inventory
                </button>

                <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/60 overflow-hidden border border-slate-100">
                    <div className="bg-[#003366] p-10 text-white flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-black tracking-tight">Manage <span className="text-[#008080]">Resource</span></h1>
                            <p className="text-blue-100/60 text-xs font-bold uppercase tracking-widest mt-2">ID: {id}</p>
                        </div>

                        <div className="hidden md:block text-right">
                            <p className="text-[9px] font-black text-blue-200/40 uppercase tracking-widest mb-1">Status Preview</p>
                            <span className={`text-[10px] font-bold px-3 py-1 rounded-lg border ${getLivePreviewStatus().includes('AVAILABLE')
                                ? 'border-emerald-500/50 text-emerald-400'
                                : 'border-amber-500/50 text-amber-400'
                                }`}>
                                {getLivePreviewStatus()}
                            </span>
                        </div>
                    </div>

                    <form onSubmit={handleUpdate} className="p-10 space-y-8">
                        <StatusAlert message={message} />

                        <ResourceForm resource={resource} handleChange={handleChange} requireOperatingHours>
                            {/* Tips DIV removed from here */}
                            <div className="flex flex-col sm:flex-row gap-4">
                                <ActionButton
                                    type="submit"
                                    disabled={saving}
                                    variant="primary"
                                    icon={saving ? Loader2 : Save}
                                >
                                    {saving ? "Saving..." : "Save Changes"}
                                </ActionButton>

                                <ActionButton
                                    type="button"
                                    variant="danger"
                                    onClick={handleDelete}
                                    icon={Trash2}
                                >
                                    Delete Resource
                                </ActionButton>
                            </div>
                        </ResourceForm>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ManageResourcePage;