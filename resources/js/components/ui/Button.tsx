import React from 'react';

export default function Button({ children, className = '', ...props }: any) {
    return (
        <button
            {...props}
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded bg-sky-600 text-white text-sm hover:bg-sky-700 disabled:opacity-60 ${className}`}
        >
            {children}
        </button>
    );
}
