import { Card } from '@/components/ui';
import { cn } from '@/utils/cn';

interface TrustReportProps {
    score: number;
    metrics: {
        corroboration: number;
        language: number;
        history: number;
    };
    sourceMetadata?: {
        owner_name: string;
        funding_type: string;
        establishment_year: number;
        bias_rating: string;
    } | null;
    loading?: boolean;
}

export function TrustReport({ score, metrics, sourceMetadata, loading = false }: TrustReportProps) {
    if (loading) return <div className="animate-pulse h-64 bg-muted rounded-lg" />;

    const getColor = (val: number) => {
        if (val >= 80) return "bg-green-500";
        if (val >= 50) return "bg-yellow-500";
        return "bg-red-500";
    };

    return (
        <Card className="p-6 space-y-6 glass-card">
            < div className="flex items-center justify-between border-b pb-4 border-border/50">
                < h3 className="font-mono uppercase tracking-widest text-sm font-bold">Credibility Quotient</h3>
                < span className={
                    cn("text-3xl font-serif font-black", score >= 70 ? "text-green-600" : "text-red-500")}>
                    {score}
                </span>
            </div >

            <div className="space-y-4">
                {/* Metric 1 */}
                <div className="space-y-2">
                    < div className="flex justify-between text-xs font-mono uppercase">
                        < span > Corroboration</span >
                        <span>{metrics.corroboration}%</span>
                    </div >
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                        < div
                            className="h-full bg-primary transition-all duration-1000 ease-out"
                            style={{ width: `${metrics.corroboration}%` }
                            }
                        />
                    </div >
                    <p className="text-[0.65rem] text-muted-foreground">Cross-reference density across verified channels.</p>
                </div >

                {/* Metric 2 */}
                < div className="space-y-2">
                    < div className="flex justify-between text-xs font-mono uppercase">
                        < span > Language Intensity</span >
                        <span className="text-red-500">{metrics.language}% Volatility</span>
                    </div >
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                        {/* Inverted logic: High intensity is bad, so maybe show it as 'Calmness' or just 'Intensity' bar */}
                        <div
                            className="h-full bg-red-500 transition-all duration-1000 ease-out"
                            style={{ width: `${metrics.language}%` }}
                        />
                    </div >
                    <p className="text-[0.65rem] text-muted-foreground">Semantic markers exceeding normative reporting thresholds.</p>
                </div >

                {/* Metric 3 */}
                < div className="space-y-2">
                    < div className="flex justify-between text-xs font-mono uppercase">
                        < span > Source Provenance</span >
                        <span>{metrics.history}/100</span>
                    </div >
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                        < div
                            className="h-full bg-blue-500 transition-all duration-1000 ease-out"
                            style={{ width: `${metrics.history}%` }}
                        />
                    </div >
                    <p className="text-[0.65rem] text-muted-foreground">Historical accuracy and bias alignment audit.</p>
                </div >
            </div >

            {sourceMetadata && (
                <div className="mt-6 pt-6 border-t border-dashed border-border/50">
                    <h4 className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-3">Source Context</h4>
                    <div className="grid grid-cols-2 gap-4 text-xs">
                        <div>
                            <span className="block text-muted-foreground text-[10px]">Entity / Owner</span>
                            <span className="font-bold">{sourceMetadata.owner_name || 'Unknown'}</span>
                        </div>
                        <div>
                            <span className="block text-muted-foreground text-[10px]">Est.</span>
                            <span className="font-bold">{sourceMetadata.establishment_year || 'N/A'}</span>
                        </div>
                        <div>
                            <span className="block text-muted-foreground text-[10px]">Funding</span>
                            <span className="font-bold">{sourceMetadata.funding_type || 'Unverified'}</span>
                        </div>
                        <div>
                            <span className="block text-muted-foreground text-[10px]">Bias Rating</span>
                            <span className="font-bold px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded">{sourceMetadata.bias_rating || 'Pending'}</span>
                        </div>
                    </div>
                </div>
            )}
        </Card >
    );
}
