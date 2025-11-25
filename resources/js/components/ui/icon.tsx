import type { ComponentType } from 'react';
import type { LucideProps } from 'lucide-react';

interface IconProps {
    // Accept either a Lucide React component, a string identifier, or null
    iconNode?: ComponentType<LucideProps> | string | null;
    className?: string;
}

export function Icon({ iconNode: IconComponent, className }: IconProps) {
    if (!IconComponent) return null;

    if (typeof IconComponent === 'string') {
        // If a string is provided, render it as text/icon identifier.
        return <span className={className}>{IconComponent}</span>;
    }

    return <IconComponent className={className} />;
}
