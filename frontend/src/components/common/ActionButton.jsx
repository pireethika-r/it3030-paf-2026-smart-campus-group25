import React from 'react';

const ActionButton = ({ children, onClick, type = "button", variant = "primary", disabled = false, icon: Icon }) => {
    const variants = {
        primary: "bg-[#008080] text-white shadow-teal-900/20",
        secondary: "bg-[#F39200] text-white shadow-orange-900/20",
        danger: "bg-white border-2 border-rose-100 text-rose-500 hover:bg-rose-50"
    };

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={`w-full flex items-center justify-center gap-2 py-4 font-black text-xs uppercase tracking-[0.2em] rounded-2xl shadow-lg transition-all disabled:opacity-50 hover:brightness-110 ${variants[variant]}`}
        >
            {Icon && <Icon size={18} className={disabled ? "animate-spin" : ""} />}
            {children}
        </button>
    );
};

export default ActionButton;