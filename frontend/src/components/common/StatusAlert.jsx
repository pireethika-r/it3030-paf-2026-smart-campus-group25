import React from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

const StatusAlert = ({ message }) => {
    if (!message.text) return null;

    const isSuccess = message.type === 'success';

    return (
        <div className={`flex items-center gap-3 p-4 rounded-2xl text-sm font-bold animate-in fade-in slide-in-from-top-2 ${isSuccess
                ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                : 'bg-rose-50 text-rose-600 border border-rose-100'
            }`}>
            {isSuccess ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            {message.text}
        </div>
    );
};

export default StatusAlert;