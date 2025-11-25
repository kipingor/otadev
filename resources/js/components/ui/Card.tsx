import React from 'react';

export default function Card({ children, className = '' }: any) {
    return <div className={`p-3 border rounded bg-white shadow-sm ${className}`}>{children}</div>;
}
