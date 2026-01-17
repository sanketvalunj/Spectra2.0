'use client';

import { useState, useEffect } from 'react';
import { Button, Input, Card } from '@/components/ui';
import { TrustReport } from '@/components/TrustReport';
import { analyzeContent, rewriteContent, submitFlag } from '@/app/actions/analysis';
import { VisualLieDetector } from '@/components/VisualLieDetector';
import { ArrowRight, Sparkles, AlertTriangle, Flag } from 'lucide-react';

import { createClient } from '@/utils/supabase/client';

function FlagForm({ url }: { url: string }) {
    const [reason, setReason] = useState('');
    const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
    const supabase = createClient();

    const handleSubmit = async () => {
        if (!reason) return;
        setStatus('submitting');
        const res = await submitFlag(url, reason);
        if (res.success) {
            setStatus('success');
            setReason('');
            // Gamification: Client-side trigger
            await supabase.rpc('increment_rank', { amount: 5 });
        } else {
            setStatus('error');
        }
    };
    // ... rest of component
    if (status === 'success') {
        return (
            <div className="text-green-600 text-sm font-bold bg-green-500/10 p-3 rounded flex items-center gap-2">
                <Flag className="w-4 h-4" /> Flag Submitted for Review.
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <Input
                placeholder="Reason (e.g. False claims, Satire...)"
                value={reason}
                onChange={e => setReason(e.target.value)}
                className="bg-white/50"
            />
            <Button size="sm" variant="outline" className="w-full text-red-600 hover:text-red-700 hover:bg-red-50" onClick={handleSubmit} disabled={status === 'submitting'}>
                {status === 'submitting' ? 'Submitting...' : 'Flag as Misinformation'}
            </Button>
        </div>
    );
}

export default function AnalyzePage() {
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [neutralized, setNeutralized] = useState<string | null>(null);
    const supabase = createClient();

    // Auto-analyze if query param exists
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const q = params.get('q');
        if (q) {
            setInput(q);
        }
    }, []);

    const handleAnalyze = async () => {
        setLoading(true);
        setNeutralized(null);
        const data = await analyzeContent(input, input.startsWith('http') ? input : undefined);
        setResult(data);

        if (data && !data.error) {
            // Gamification: Client-side trigger
            await supabase.rpc('increment_rank', { amount: 1 });
        }

        setLoading(false);
    };
    // ... rest of component

    const handleNeutralize = async () => {
        const textToRewrite = result?.fullText || input;
        if (!textToRewrite) return;

        const newContent = await rewriteContent(textToRewrite);
        setNeutralized(newContent);
    };

    return (
        <main className="min-h-screen bg-neutral-100 dark:bg-neutral-900 pattern-grid-lg flex flex-col items-center py-12 px-4">
            <div className="w-full max-w-4xl space-y-8">
                {/* ... existing header ... */}
                <div className="text-center space-y-2">
                    <h1 className="text-4xl font-serif font-black uppercase text-foreground">Glass Box Engine</h1>
                    <p className="text-muted-foreground font-mono text-sm">Input data stream for credibility audit.</p>
                </div>

                <div className="flex gap-2">
                    <Input
                        placeholder="Paste headline or URL here..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        className="h-14 text-lg"
                    />
                    <Button size="lg" className="h-14 px-8" onClick={handleAnalyze} disabled={loading}>
                        {loading ? 'Scanning...' : 'Analyze'} <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                </div>

                {/* Visual Lie Detector Module */}
                <VisualLieDetector />

                {result && result.error && (
                    <div className="p-4 rounded border border-red-500/50 bg-red-500/10 text-red-500">
                        <p className="font-bold">Analysis Error</p>
                        <p className="text-sm">{result.error}</p>
                    </div>
                )}

                {result && !result.error && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-accordion-down">
                        <div className="space-y-6">
                            <TrustReport
                                score={result.score}
                                metrics={result.metrics}
                                sourceMetadata={result.sourceMetadata}
                            />

                            {/* Actions */}
                            <Card className="p-6 space-y-4">
                                <h3 className="font-bold font-serif text-xl border-b pb-2">Heuristic Override</h3>
                                <div className="flex flex-col gap-3">
                                    <Button variant="outline" onClick={handleNeutralize} className="justify-between group">
                                        <span className="flex items-center gap-2"><Sparkles className="w-4 h-4 text-primary" /> De-sensationalize</span>
                                        <span className="text-[0.6rem] uppercase tracking-widest text-muted-foreground group-hover:text-foreground">AI Rewrite</span>
                                    </Button>
                                    {neutralized && (
                                        <div className="p-4 bg-primary/10 border border-primary/20 rounded-md text-sm font-medium h-[300px] overflow-y-auto font-serif leading-relaxed whitespace-pre-wrap">
                                            {neutralized}
                                        </div>
                                    )}
                                </div>
                            </Card>

                            {/* Community Moderation */}
                            <Card className="p-6 space-y-4 border-dashed border-red-500/20 bg-red-500/5">
                                <h3 className="font-bold font-serif text-xl border-b pb-2 text-red-700 dark:text-red-400 flex items-center gap-2">
                                    <AlertTriangle className="w-5 h-5" /> Community Validation
                                </h3>
                                <p className="text-xs text-muted-foreground">Is this analysis incorrect? Flag this source for manual expert review.</p>
                                <FlagForm url={input.startsWith('http') ? input : 'Manual Input: ' + input.substring(0, 30)} />
                            </Card>
                        </div>

                        <div className="space-y-6">
                            <Card className="p-6 h-full border-l-4 border-l-red-500">
                                <div className="flex items-center gap-2 mb-4 text-red-500">
                                    <AlertTriangle className="w-5 h-5" />
                                    <h3 className="font-bold uppercase tracking-widest text-sm">Detected Fallacies</h3>
                                </div>
                                {result.details?.fallacies?.length > 0 ? (
                                    <ul className="space-y-3">
                                        {result.details.fallacies.map((f: string, i: number) => (
                                            <li key={i} className="flex gap-2 items-start text-sm">
                                                <span className="text-red-500 font-mono text-xs mt-1">[{String(i + 1).padStart(2, '0')}]</span>
                                                <span className="text-muted-foreground">{f}</span>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-muted-foreground italic">No logical fallacies detected in this sample.</p>
                                )}
                            </Card>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}
