'use client';

import { createClient } from '@/utils/supabase/client';
import { useEffect, useState } from 'react';
import { Card, Button, Input } from '@/components/ui';
import { useRouter } from 'next/navigation';

export default function AdminPage() {
    const supabase = createClient();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [authorized, setAuthorized] = useState(false);
    const [passwordInput, setPasswordInput] = useState('');
    const [authError, setAuthError] = useState(false);

    const [sources, setSources] = useState<any[]>([]);
    const [flags, setFlags] = useState<any[]>([]);
    const [newSource, setNewSource] = useState({
        domain: '',
        owner_name: '',
        bias_rating: 'Center',
        funding_type: '',
        establishment_year: ''
    });

    const fetchData = async () => {
        const { data } = await supabase.from('source_metadata').select('*');
        if (data) setSources(data);

        // Fetch Flags
        const { data: flagsData } = await supabase.from('content_flags').select('*').order('created_at', { ascending: false });
        if (flagsData) setFlags(flagsData);
    };

    const handlePasswordSubmit = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (passwordInput === 'Soham2905@') {
            setAuthorized(true);
            setAuthError(false);
            fetchData();
        } else {
            setAuthError(true);
            setPasswordInput('');
        }
    };

    useEffect(() => {
        const checkUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) router.push('/');
            setLoading(false);
        };
        checkUser();
    }, []);

    useEffect(() => {
        if (authorized) {
            fetchData();
        }
    }, [authorized]);

    const handleAdd = async () => {
        if (!newSource.domain) return;
        const { error } = await supabase.from('source_metadata').insert([newSource]);
        if (!error) {
            setNewSource({
                domain: '',
                owner_name: '',
                bias_rating: 'Center',
                funding_type: '',
                establishment_year: ''
            });
            fetchData();
        } else {
            alert('Error adding source: ' + error.message);
        }
    };

    if (loading) return null;

    if (!authorized) {
        return (
            <main className="min-h-screen bg-black pattern-grid-lg flex items-center justify-center p-4">
                <Card className="w-full max-w-md p-8 bg-neutral-900 border-neutral-800 shadow-2xl space-y-6">
                    <div className="text-center space-y-2">
                        <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20">
                            <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </div>
                        <h1 className="text-2xl font-serif font-bold text-white tracking-wide">Restricted Access</h1>
                        <p className="text-muted-foreground font-mono text-xs">Enter administrative credentials to access the Admin Console.</p>
                    </div>

                    <form onSubmit={handlePasswordSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Input
                                type="password"
                                placeholder="Passphrase"
                                value={passwordInput}
                                onChange={(e) => setPasswordInput(e.target.value)}
                                className={`bg-neutral-950 border-neutral-800 text-center tracking-widest ${authError ? 'border-red-500/50 focus-visible:ring-red-500' : ''}`}
                                autoFocus
                            />
                            {authError && <p className="text-xs text-red-500 text-center font-bold animate-pulse">Access Denied</p>}
                        </div>
                        <Button type="submit" className="w-full bg-white text-black hover:bg-neutral-200">
                            Authenticate
                        </Button>
                        <Button variant="ghost" type="button" className="w-full text-muted-foreground text-xs" onClick={() => router.push('/')}>
                            Return to Terminal
                        </Button>
                    </form>
                </Card>
            </main>
        );
    }

    // Original Render Content (Admin Dashboard)
    return (
        <main className="min-h-screen bg-neutral-100 dark:bg-neutral-900 p-12">
            <div className="max-w-6xl mx-auto space-y-8">
                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-serif font-bold">Admin Console</h1>
                    <Button variant="outline" onClick={() => router.push('/')}>Exit to Terminal</Button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Add Form */}
                    <Card className="p-6 space-y-4">
                        <h3 className="font-bold text-lg">New Entry</h3>
                        <Input
                            placeholder="Domain (e.g. cnn.com)"
                            value={newSource.domain}
                            onChange={(e) => setNewSource({ ...newSource, domain: e.target.value })}
                        />
                        <Input
                            placeholder="Owner"
                            value={newSource.owner_name}
                            onChange={(e) => setNewSource({ ...newSource, owner_name: e.target.value })}
                        />
                        <select
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            value={newSource.bias_rating}
                            onChange={(e) => setNewSource({ ...newSource, bias_rating: e.target.value })}
                        >
                            <option>Left</option>
                            <option>Center-Left</option>
                            <option>Center</option>
                            <option>Center-Right</option>
                            <option>Right</option>
                        </select>
                        <Input
                            placeholder="Funding (e.g. Subs, Ads, State)"
                            value={newSource.funding_type}
                            onChange={(e) => setNewSource({ ...newSource, funding_type: e.target.value })}
                        />
                        <Input
                            placeholder="Est. Year (e.g. 1920)"
                            type="number"
                            value={newSource.establishment_year}
                            onChange={(e) => setNewSource({ ...newSource, establishment_year: e.target.value })}
                        />
                        <Button className="w-full" onClick={handleAdd}>Commit to Ledger</Button>
                    </Card>

                    {/* Table */}
                    <Card className="lg:col-span-2 p-6 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs uppercase text-muted-foreground bg-muted/50">
                                    <tr>
                                        <th className="px-4 py-3">Domain</th>
                                        <th className="px-4 py-3">Owner</th>
                                        <th className="px-4 py-3">Bias</th>
                                        <th className="px-4 py-3">Funding</th>
                                        <th className="px-4 py-3">Year</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {sources.map((s) => (
                                        <tr key={s.domain} className="bg-background">
                                            <td className="px-4 py-3 font-medium">{s.domain}</td>
                                            <td className="px-4 py-3 text-muted-foreground">{s.owner_name}</td>
                                            <td className="px-4 py-3">
                                                <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">
                                                    {s.bias_rating}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground">{s.funding_type}</td>
                                            <td className="px-4 py-3 text-muted-foreground">{s.establishment_year}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {sources.length === 0 && <div className="p-4 text-center text-muted-foreground">No records found.</div>}
                        </div>
                    </Card>

                    {/* Moderation Queue */}
                    <Card className="p-6 bg-white dark:bg-neutral-800 shadow-xl border-t-4 border-t-red-500">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-serif font-bold flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                Moderation Queue
                            </h2>
                            <span className="text-xs font-mono text-muted-foreground">
                                {flags.filter(f => f.status === 'pending').length} PENDING
                                <span className="opacity-50 mx-2">|</span>
                                {flags.length} TOTAL
                            </span>
                        </div>

                        <div className="space-y-4">
                            {flags.length === 0 ? (
                                <p className="text-sm text-muted-foreground italic">No flags recording.</p>
                            ) : (
                                flags.sort((a, b) => {
                                    if (a.status === 'pending' && b.status !== 'pending') return -1;
                                    if (a.status !== 'pending' && b.status === 'pending') return 1;
                                    return 0;
                                }).map((flag) => (
                                    <div key={flag.id} className={`flex flex-col md:flex-row justify-between gap-4 p-4 border rounded ${flag.status === 'pending' ? 'bg-background/50 border-red-500/20' : 'opacity-60 bg-neutral-100 dark:bg-neutral-800'}`}>
                                        <div className="space-y-1 overflow-hidden">
                                            <div className="flex items-center gap-2">
                                                <p className="font-mono text-xs text-muted-foreground truncate max-w-[300px]" title={flag.url}>{flag.url}</p>
                                                {flag.status !== 'pending' && (
                                                    <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${flag.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-neutral-200 text-neutral-600'}`}>
                                                        {flag.status}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="font-medium text-sm text-red-600">Reason: {flag.reason}</p>
                                            <p className="text-[10px] text-muted-foreground">{new Date(flag.created_at).toLocaleDateString()}</p>
                                        </div>
                                        <div className="flex gap-2 shrink-0 items-center">
                                            {flag.status === 'pending' ? (
                                                <>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="text-xs h-8 text-neutral-500 hover:text-neutral-700"
                                                        onClick={async () => {
                                                            await supabase.from('content_flags').update({ status: 'rejected' }).eq('id', flag.id);
                                                            fetchData();
                                                        }}
                                                    >
                                                        Reject
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        className="text-xs h-8 bg-green-600 hover:bg-green-700 text-white"
                                                        onClick={async () => {
                                                            await supabase.from('content_flags').update({ status: 'approved' }).eq('id', flag.id);
                                                            fetchData();
                                                        }}
                                                    >
                                                        Approve
                                                    </Button>
                                                </>
                                            ) : (
                                                <span className="text-xs italic text-muted-foreground pr-2">Resolved</span>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </Card>
                </div>
            </div>
        </main>
    );
}
