import React from 'react';

const FormField = ({ label, name, value, onChange, type = "text", placeholder, required = false, options = [] }) => {
    const baseStyles = "w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#008080] outline-none font-semibold text-slate-700 transition-all";

    return (
        <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
            {type === 'select' ? (
                <select name={name} value={value} onChange={onChange} className={baseStyles}>
                    {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
            ) : (
                <input
                    type={type}
                    name={name}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    className={baseStyles}
                    required={required}
                />
            )}
        </div>
    );
};

export default FormField;