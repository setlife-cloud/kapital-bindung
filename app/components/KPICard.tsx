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
    const statusColor = status === 'good' ? 'bg-emerald-500' :
        status === 'neutral' ? 'bg-amber-500' :
            status === 'alert' ? 'bg-red-600' : 'bg-rose-500';

    const statusTextColor = status === 'good' ? 'text-emerald-700' :
        status === 'neutral' ? 'text-amber-700' :
            status === 'alert' ? 'text-red-700' : 'text-rose-700';

    return (
        <div className={cn(
            "relative overflow-hidden bg-white shadow-sm border border-slate-100 p-3 h-full flex flex-col justify-between",
            className
        )}>
            {/* Status Bar */}
            <div className={cn("absolute top-0 left-0 w-full h-1", statusColor)} />

            <div className="flex flex-col gap-1 mt-1">
                <h3 className="font-heading text-xs uppercase tracking-wide text-slate-500 font-semibold">{title}</h3>
                <div className="text-xl font-bold text-slate-800 tracking-tight">{value}</div>
            </div>

            {(description || subtext) && (
                <div className="mt-2 text-xs">
                    {description && (
                        <div className={cn("font-bold uppercase", statusTextColor)}>
                            {description}
                        </div>
                    )}
                    {subtext && <p className="text-slate-400 mt-0.5">{subtext}</p>}
                </div>
            )}
        </div>
    );
}
