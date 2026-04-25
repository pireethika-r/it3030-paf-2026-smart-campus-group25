import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, PlusCircle, Loader2 } from 'lucide-react';
import resourceApi from '../../api/resourceApi';

// Component Imports
import { useResourceData } from '../../hooks/useResourceData';
import ResourceForm from '../../components/forms/ResourceForm';
import StatusAlert from '../../components/common/StatusAlert';
import ActionButton from '../../components/common/ActionButton';

const AddResourcePage = () => {
    const navigate = useNavigate();
    const { resource, handleChange } = useResourceData();
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    const handleCreate = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage({ type: '', text: '' });

        try {
            await resourceApi.createResource(resource);
            setMessage({ type: 'success', text: 'New resource added successfully!' });
            setTimeout(() => navigate('/admin/dashboard?section=Resources'), 1200);
        } catch (err) {
            console.error("Creation error:", err);
            setMessage({
                type: 'error',
                text: err.response?.status === 400
                    ? 'Invalid Data: Please check all required fields.'
                    : 'Server Error: Could not save resource.'
            });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] p-6 md:p-12 font-sans">
            <div className="max-w-3xl mx-auto">
                <button
                    onClick={() => navigate('/admin/dashboard?section=Resources')}
                    className="flex items-center gap-2 text-slate-500 hover:text-[#003366] mb-8 font-bold transition-colors"
                >
                    <ArrowLeft size={18} /> Back to Inventory
                </button>

                <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 overflow-hidden border border-slate-100">
                    <div className="bg-[#003366] p-10 text-white relative overflow-hidden">
                        <div className="relative z-10">
                            <h1 className="text-3xl font-black tracking-tight">
                                Add New <span className="text-[#F39200]">Resource</span>
                            </h1>
                            <p className="text-blue-100/50 text-[10px] font-bold uppercase tracking-[0.2em] mt-2">
                                System Entry � Academic Year 2026
                            </p>
                        </div>
                        <PlusCircle className="absolute -right-4 -bottom-4 text-white/5 w-32 h-32" />
                    </div>

                    <form onSubmit={handleCreate} className="p-10 space-y-8">
                        <StatusAlert message={message} />

                        {/* Automation Enabled message block has been removed from here */}

                        <ResourceForm resource={resource} handleChange={handleChange}>
                            <div className="pt-10">
                                <ActionButton
                                    type="submit"
                                    variant="secondary"
                                    disabled={saving}
                                    icon={saving ? Loader2 : PlusCircle}
                                    className="w-full py-5 rounded-2xl shadow-lg shadow-orange-500/20"
                                >
                                    {saving ? "Registering Resource..." : "Create Resource"}
                                </ActionButton>

                                <p className="text-center text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-6">
                                    Verify all metadata before confirming system registration
                                </p>
                            </div>
                        </ResourceForm>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AddResourcePage;