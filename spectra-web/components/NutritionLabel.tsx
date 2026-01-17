import React from 'react';
import { cn } from '@/utils/cn';
import { Card } from '@/components/ui';

interface SourceMetadata {
    domain: string;
    owner_name?: string;
    funding_type?: string;
    bias_rating?: string;
    establishment_year?: number;
    country_of_origin?: string;
}

interface NutritionLabelProps {
    children: React.ReactNode;
    metadata?: SourceMetadata | null;
    className?: string;
}

export function NutritionLabel({ children, metadata, className }: NutritionLabelProps) {
    if (!metadata) return <>{children}</>;

    return (
        <div className={cn("relative group inline-block", className)}>
            {children}

            {/* Tooltip / Label */}
            <div className="absolute left-0 bottom-full mb-2 w-64 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-50">
                <Card className="p-4 bg-black/90 text-white backdrop-blur-xl border border-white/10 shadow-2xl">
                    <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-3">
                        <span className="text-[10px] font-mono uppercase tracking-widest text-[#ff4400] font-bold">Nutrition Label</span>
                    </div >

                    <div className="space-y-3">
                        <div className="flex justify-between items-start text-xs">
                            <span className="text-white/50 uppercase tracking-widest text-[9px] mt-0.5">Owner</span>
                            <span className="text-right font-medium max-w-[60%]">{metadata.owner_name || 'Unknown'}</span>
                        </div>

                        <div className="flex justify-between items-start text-xs">
                            <span className="text-white/50 uppercase tracking-widest text-[9px] mt-0.5">Funding</span>
                            <span className="text-right font-medium">{metadata.funding_type || 'Unverified'}</span>
                        </div>

                        <div className="flex justify-between items-start text-xs">
                            <span className="text-white/50 uppercase tracking-widest text-[9px] mt-0.5">Origin</span>
                            <span className="text-right font-medium">{metadata.country_of_origin || 'Unknown'}</span>
                        </div>

                        <div className="flex justify-between items-center text-xs pt-2 border-t border-white/10">
                            <span className="text-white/50 uppercase tracking-widest text-[9px]">Bias</span>
                            <span className={cn(
                                "px-2 py-0.5 rounded text-[10px] uppercase font-bold",
                                metadata.bias_rating === 'Center' ? 'bg-purple-500/20 text-purple-300' :
                                    metadata.bias_rating?.includes('Left') ? 'bg-blue-500/20 text-blue-300' :
                                        metadata.bias_rating?.includes('Right') ? 'bg-red-500/20 text-red-300' :
                                            'bg-neutral-800'
                            )}>
                                {metadata.bias_rating || 'Pending'}
                            </span>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}
