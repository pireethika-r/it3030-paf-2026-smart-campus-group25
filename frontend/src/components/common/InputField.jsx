import React from 'react';

const InputField = ({ label, name, value, onChange, placeholder, type = "text", required = false }) => (
    <div className="space-y-2">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
            {label}
        </label>
        <input
            type={type}
            name={name}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            required={required}
            className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#008080] outline-none font-semibold text-slate-700 transition-all"
        />
    </div>
);

export default InputField;