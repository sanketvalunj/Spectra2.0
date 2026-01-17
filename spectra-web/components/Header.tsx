'use client';

import Link from 'next/link';
import { Search, User, Shield } from 'lucide-react';
import { Button, Input } from '@/components/ui';
import { createClient } from '@/utils/supabase/client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Header() {
    const [user, setUser] = useState<any>(null);
    const supabase = createClient();
    const router = useRouter();

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
        };
        getUser();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: any, session: { user: any; }) => {
            setUser(session?.user ?? null);
        });

        return () => subscription.unsubscribe();
    }, []);

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.refresh();
    };

    const handleSignIn = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${location.origin}/auth/callback`,
            }
        });
        if (error) {
            console.error("Auth Error:", error);
            alert(`Authentication Error: ${error.message}\n\nPlease check your Supabase Dashboard to ensure the Google Provider is enabled.`);
        }
    };

    // State removed as we switched to direct navigation


    return (
        <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            < div className="container flex h-20 max-w-screen-2xl items-center justify-between">
                {/* Logo Area */}
                <div className="flex items-center gap-2">
                    < Link href="/" className="flex flex-col items-center">
                        < h1 className="font-serif text-4xl font-bold tracking-tighter text-primary text-glow">Spectra</h1>
                        < span className="text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground">Smart Media Gazette</span>
                    </Link >
                </div >

                {/* Navigation & Search */}
                < div className="flex flex-1 items-center justify-center gap-8 md:justify-end md:gap-4">
                    < nav className="hidden md:flex gap-6 text-sm font-medium tracking-wide uppercase text-muted-foreground">
                        <Link href="/?category=general" className="hover:text-foreground transition-colors">Geopolitics</Link>
                        <Link href="/?category=technology" className="hover:text-foreground transition-colors">Silicon</Link>
                        <Link href="/?category=science" className="hover:text-foreground transition-colors">Biosphere</Link>
                    </nav >

                    <div className="hidden md:block">
                        <Link href="/analyze">
                            <Button variant="outline" className="gap-2 border-primary/20 hover:border-primary hover:bg-primary/5">
                                <Search className="w-4 h-4 text-primary" />
                                <span className="uppercase tracking-widest text-xs font-bold text-primary">Investigate Headlines</span>
                            </Button>
                        </Link>
                    </div>

                    {/* User Auth */}
                    < div className="flex items-center gap-2">
                        {
                            user ? (
                                <div className="flex items-center gap-2">
                                    <Link href="/admin">
                                        <Button variant="ghost" size="sm" className="hidden lg:flex gap-2 text-muted-foreground hover:text-primary">
                                            <Shield className="w-4 h-4" />
                                            <span className="text-xs uppercase tracking-wider font-bold">Admin</span>
                                        </Button>
                                    </Link>
                                    <div className="h-4 w-px bg-border/50 mx-2 hidden lg:block" />
                                    <Button variant="ghost" size="sm" onClick={handleSignOut} className="flex gap-2">
                                        < img src={user.user_metadata.avatar_url} alt="User" className="h-6 w-6 rounded-full" />
                                        < span className="hidden sm:inline-block">Sign Out</span>
                                    </Button >
                                </div>
                            ) : (
                                <Button variant="ghost" size="icon" onClick={handleSignIn}>
                                    < User className="h-5 w-5" />
                                </Button >
                            )
                        }
                    </div >
                </div >
            </div >
        </header >
    );
}