'use client';

import { Card } from '@/components/ui';
import { Shield, User, Search, Share2, Users, ExternalLink, BookOpen } from 'lucide-react';
import Link from 'next/link';

export default function MediaLiteracyPage() {
    const steps = [
        {
            number: 1,
            title: "Check the Media Outlet",
            icon: <Shield className="w-8 h-8 text-red-500" />,
            desc: "Do you know it? Check the 'about' section. If the language is overly dramatic, be skeptical. Who funds it? What do other trustworthy sources say?"
        },
        {
            number: 2,
            title: "Check the Author",
            icon: <User className="w-8 h-8 text-red-400" />,
            desc: "Does this person exist? Reliable journalists have a track record. If the author is nameless or made up, the story is likely fake."
        },
        {
            number: 3,
            title: "Check the References",
            icon: <Search className="w-8 h-8 text-red-600" />,
            desc: "Are there reliable sources linked? Are quoted experts real specialists? If the story relies on anonymous or no sources, it's suspect."
        },
        {
            number: 4,
            title: "Think Before You Share",
            icon: <Share2 className="w-8 h-8 text-red-500" />,
            desc: "Catchy headlines generate clicks but may distort reality. Is it satire? Verify with mainstream media before spreading it."
        },
        {
            number: 5,
            title: "Join the Myth-Busters",
            icon: <Users className="w-8 h-8 text-red-700" />,
            desc: "Report fake stories. Spread the word. Follow fact-checkers like @StopFakingNews or @DFRLab to stay ahead of tricks."
        }
    ];

    const resources = [
        {
            title: "The Importance of Media Literacy",
            source: "Reading Partners",
            desc: "Read an explained article on why media literacy is essential in the modern information environment.",
            url: "https://readingpartners.org/blog/importance-media-literacy/"
        },
        {
            title: "Why Media Literacy Matters",
            source: "Pressbooks Introduction",
            desc: "An accessible text explaining media literacy and its impact on how we interpret media.",
            url: "https://media.pressbooks.com/chapter/why-media-literacy-matters/"
        },
        {
            title: "Media Literacy Against Disinformation",
            source: "EDMO",
            desc: "Explains how critical media skills help people assess and counter misinformation.",
            url: "https://edmo.eu/media-literacy/"
        },
        {
            title: "Why is Media Literacy Important?",
            source: "NAMLE",
            desc: "Practical explanation of what media literacy is and why people need it today.",
            url: "https://namle.net/"
        },
        {
            title: "What Is Media Literacy and Why Is It Essential?",
            source: "Cal Lutheran",
            desc: "A clear article about how media literacy helps people evaluate messages and bias.",
            url: "https://www.callutheran.edu/news/media-literacy.html"
        },
        {
            title: "What Is Media Literacy?",
            source: "SNHU",
            desc: "Explains how media influences beliefs and how literacy helps interpret it.",
            url: "https://www.snhu.edu/about-us/newsroom/liberal-arts/what-is-media-literacy"
        },
        {
            title: "What Is Media Literacy and Why It Matters?",
            source: "FutureLearn",
            desc: "Discusses how media literacy lets people question intent and avoid negative impacts.",
            url: "https://www.futurelearn.com/info/blog/what-is-media-literacy"
        }
    ];

    return (
        <main className="min-h-screen bg-neutral-100 dark:bg-neutral-900 pattern-grid-lg py-12 px-4">
            <div className="max-w-6xl mx-auto space-y-16">

                {/* Hero */}
                <div className="text-center space-y-4">
                    <h1 className="text-5xl font-serif font-black uppercase text-foreground">Media Literacy Hub</h1>
                    <p className="text-xl text-muted-foreground font-light max-w-2xl mx-auto">
                        In an era of information overload, the ability to discern truth from fabrication is a superpower.
                        Equip yourself with the tools to navigate the digital landscape.
                    </p>
                </div>

                {/* 5 Steps Section */}
                <div className="space-y-8">
                    <div className="flex items-center gap-4 justify-center">
                        <Shield className="w-6 h-6 text-primary" />
                        <h2 className="text-3xl font-bold font-serif uppercase tracking-widest text-center">How to Spot Fake News</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {steps.map((step) => (
                            <div key={step.number} className="group relative">
                                {/* Glass Block */}
                                <div className="relative h-full overflow-hidden rounded-2xl border border-white/20 bg-gradient-to-br from-white/40 to-white/5 backdrop-blur-xl transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_rgba(239,68,68,0.3)] dark:border-white/10 dark:from-white/10 dark:to-transparent">

                                    {/* Red Edge Glow (Inset) */}
                                    <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-red-500/20 group-hover:ring-red-500/50 transition-all duration-500" />

                                    {/* Glossy Reflection Gradient overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-transparent opacity-50 pointer-events-none" />

                                    <div className="relative p-8 space-y-6">

                                        {/* Content */}
                                        <div className="relative z-10 w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-600 shadow-inner group-hover:scale-110 transition-transform duration-500">
                                            {step.icon}
                                        </div>

                                        <div>
                                            <h3 className="text-2xl font-bold font-serif mb-3 text-foreground/90">{step.title}</h3>
                                            <p className="text-muted-foreground leading-relaxed font-medium">
                                                {step.desc}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Bottom Red Line Accent */}
                                    <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-red-500/0 via-red-500/50 to-red-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Resources Section */}
                <div className="space-y-8">
                    <div className="flex items-center gap-4 justify-center border-t border-red-500/10 pt-20">
                        <BookOpen className="w-6 h-6 text-red-500" />
                        <h2 className="text-3xl font-bold font-serif uppercase tracking-widest text-center">Essential Readings</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {resources.map((res, i) => (
                            <Link href={res.url} key={i} target="_blank" className="group block h-full">
                                <div className="relative h-full overflow-hidden rounded-xl border border-white/10 bg-white/5 backdrop-blur-md p-6 transition-all duration-300 hover:bg-white/10 hover:border-red-500/30 hover:shadow-lg hover:shadow-red-500/5">
                                    <div className="flex flex-col justify-between h-full gap-4">
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-start">
                                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-red-500">{res.source}</span>
                                                <ExternalLink className="w-4 h-4 text-muted-foreground opacity-30 group-hover:opacity-100 transition-opacity" />
                                            </div>
                                            <h3 className="text-lg font-bold font-serif group-hover:text-red-500 transition-colors">{res.title}</h3>
                                            <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">{res.desc}</p>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </main>
    );
}
