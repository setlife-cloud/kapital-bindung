import * as React from 'react';
import { cn } from '../utils/cn';
import { KPIStatus } from '../types';

interface KPICardProps {
    title: string;
    value: string | number;
    status?: KPIStatus;
    description?: string; // Interpretation text like "gut", "kritisch"
    subtext?: string;
    className?: string;
}

const statusColors: Record<KPIStatus, string> = {
    good: 'bg-emerald-50 border-emerald-500 text-emerald-900',
    neutral: 'bg-amber-50 border-amber-500 text-amber-900',
    critical: 'bg-rose-50 border-rose-500 text-rose-900',
    alert: 'bg-red-100 border-red-700 text-red-900',
};

const statusIndicators: Record<KPIStatus, string> = {
    good: 'bg-emerald-500',
    neutral: 'bg-amber-500',
    critical: 'bg-rose-500',
    alert: 'bg-red-700',
};

export function KPICard({ title, value, status = 'neutral', description, subtext, className }: KPICardProps) {
    return (
        <div className={cn(
            "relative overflow-hidden rounded-lg border-l-4 p-4 shadow-sm transition-all hover:shadow-md bg-white",
            statusColors[status],
            "border-opacity-100", // ensure border is visible
            className
        )}>
            <div className="flex flex-col gap-1">
                <h3 className="text-sm font-medium opacity-80">{title}</h3>
                <div className="text-2xl font-bold tracking-tight">{value}</div>
                {(description || subtext) && (
                    <div className="mt-2 flex flex-col gap-0.5">
                        {description && <span className={cn("text-xs font-bold uppercase",
                            status === 'good' ? 'text-emerald-700' :
                                status === 'neutral' ? 'text-amber-700' : 'text-rose-700'
                        )}>{description}</span>}
                        {subtext && <p className="text-xs opacity-70">{subtext}</p>}
                    </div>
                )}
            </div>
        </div>
    );
}
