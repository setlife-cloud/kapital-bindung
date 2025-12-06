import * as React from 'react';
import * as SliderPrimitive from '@radix-ui/react-slider';
import { cn } from '../utils/cn';
import { Info } from 'lucide-react';

interface SliderInputProps {
    label: string;
    value: number;
    min: number;
    max: number;
    step?: number;
    unit?: string;
    description?: string;
    onChange: (value: number) => void;
    className?: string;
    formatValue?: (val: number) => string;
}

export function SliderInput({
    label,
    value,
    min,
    max,
    step = 1,
    unit = '',
    description,
    onChange,
    className,
    formatValue
}: SliderInputProps) {

    const formattedValue = formatValue ? formatValue(value) : `${value}${unit}`;

    return (
        <div className={cn("space-y-3", className)}>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        {label}
                    </label>
                    {description && (
                        <div className="group relative">
                            <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                            <div className="absolute left-1/2 bottom-full mb-2 w-48 -translate-x-1/2 p-2 bg-slate-800 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                {description}
                            </div>
                        </div>
                    )}
                </div>
                <span className="text-sm font-mono font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded">
                    {formattedValue}
                </span>
            </div>

            <SliderPrimitive.Root
                className="relative flex w-full touch-none select-none items-center"
                value={[value]}
                max={max}
                min={min}
                step={step}
                onValueChange={(vals: number[]) => onChange(vals[0])}
            >
                <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-slate-200">
                    <SliderPrimitive.Range className="absolute h-full bg-brand-500" />
                </SliderPrimitive.Track>
                <SliderPrimitive.Thumb className="block h-5 w-5 rounded-full border-2 border-brand-500 bg-white ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-brand-50" />
            </SliderPrimitive.Root>
        </div>
    );
}
