'use server';

import Groq from 'groq-sdk';
import { createClient } from '@/utils/supabase/server';
import * as cheerio from 'cheerio';

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

export async function analyzeContent(content: string, url?: string) {
    let textToAnalyze = content;
    let scrapedBody = "";

    // 1. Scrape if URL is provided
    if (url) {
        try {
            const res = await fetch(url);
            const html = await res.text();
            const $ = cheerio.load(html);
            // Simple heuristic for article body: grab all paragraphs
            $('p').each((_, el) => {
                const p = $(el).text().trim();
                if (p.length > 50) scrapedBody += p + "\n\n";
            });
            if (scrapedBody.length > 200) {
                textToAnalyze = scrapedBody;
            }
        } catch (e) {
            console.error("Scraping failed:", e);
        }
    }

    if (!textToAnalyze && !url) return { error: "No content provided" };

    try {
        // 1. Serper.dev Corroboration Check (Mocked for now or implemented if key is valid)
        // In a real implementation: fetch(`https://google.serper.dev/search`, ...)
        const corroboratedContent = textToAnalyze.substring(0, 1000); // optimizing for search query
        const corroborationScore = await checkCorroboration(corroboratedContent);

        // 2. Groq Llama-3 Analysis for Language Intensity & Fallacies
        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: `You are an expert media literacy analyst. Analyze the provided news text for:
                    1. Emotional intensity (0-100, where 100 is highly inflammatory).
                    2. Logical fallacies (list them).
                    3. Overall objectivity (0-100).
                    
                    Return JSON: { "intensity": number, "fallacies": string[], "objectivity": number, "summary": "string" }`
                },
                {
                    role: "user",
                    content: textToAnalyze.substring(0, 4000) // Increase limit for full article
                }
            ],
            model: "llama-3.3-70b-versatile",
            response_format: { type: "json_object" }
        });

        const analysis = JSON.parse(completion.choices[0]?.message?.content || '{}');

        const supabase = await createClient();

        let historyScore = 50; // Default
        let sourceData = null;

        if (url) {
            try {
                const domain = new URL(url).hostname.replace('www.', '');
                const { data } = await supabase.from('source_metadata').select('*').ilike('domain', `%${domain}%`).single();

                if (data) {
                    sourceData = data;
                    // Formula: Provenance Score
                    // 1. Bias: Center (100) -> Extremes (40)
                    const biasMap: Record<string, number> = {
                        'Center': 100,
                        'Center-Left': 80, 'Center-Right': 80,
                        'Left': 60, 'Right': 60,
                        'Far-Left': 40, 'Far-Right': 40
                    };
                    const biasScore = biasMap[data.bias_rating || ''] || 50;

                    // 2. Age: Older keys trust. >20 years = 100.
                    const age = new Date().getFullYear() - (data.establishment_year || 2000);
                    const ageScore = Math.min(age * 2, 100);

                    historyScore = Math.round((biasScore * 0.6) + (ageScore * 0.4));
                }
            } catch (e) {
                console.log("Metadata lookup failed, using default.");
            }
        }

        // 3. Final Score Calculation
        // Formula: (Corroboration * 0.4) + (Objectivity * 0.3) + (SourceHistory * 0.3)
        const weightedScore = Math.round(
            (corroborationScore * 0.4) +
            ((analysis.objectivity || 50) * 0.3) +
            (historyScore * 0.3)
        );

        return {
            score: weightedScore,
            metrics: {
                corroboration: corroborationScore,
                language: analysis.intensity || 50,
                history: historyScore
            },
            details: analysis,
            sourceMetadata: sourceData,
            fullText: textToAnalyze // Return this so UI can display/rewrite it
        };
    } catch (error) {
        console.error("Analysis failed:", error);
        return { error: "Analysis failed" };
    }
}

async function checkCorroboration(query: string): Promise<number> {
    if (!process.env.SERPER_API_KEY) return 50; // Default if no key

    try {
        const response = await fetch("https://google.serper.dev/search", {
            method: "POST",
            headers: {
                "X-API-KEY": process.env.SERPER_API_KEY,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ q: query.substring(0, 200) }) // Search first snippet
        });

        const data = await response.json();
        // Simple heuristic: If top results mimic the query topic from credible domains, high score.
        // For this MVP, we just count result quantity as a proxy for 'buzz' or match.
        // Real logic would check domain allowlists.
        return Math.min((data.organic?.length || 0) * 10, 100);
    } catch (e) {
        return 50;
    }
}

export async function rewriteContent(text: string) {
    try {
        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: "Rewrite this news article to be purely factual, neutral, and devoid of sensation or clickbait. Maintain the core information but remove charged language. Return the full requested text."
                },
                {
                    role: "user",
                    content: text.substring(0, 6000)
                }
            ],
            model: "llama-3.3-70b-versatile",
        });
        return completion.choices[0]?.message?.content || text;
    } catch (error) {
        return text;
    }
}

export async function submitFlag(url: string, reason: string) {
    const supabase = await createClient();
    if (!url) return { error: "No URL provided" };

    try {
        const { error } = await supabase.from('content_flags').insert([{ url, reason }]);
        if (error) throw error;

        // Gamification: Give points for flagging
        await incrementUserRank(supabase, 5);

        return { success: true };
    } catch (e: any) {
        console.error("Flag submission failed:", e);
        return { error: e.message || "Failed to submit flag" };
    }
}

async function incrementUserRank(supabase: any, points: number) {
    console.log("Attempting to increment rank by:", points);
    try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
            console.error("Rank Update Failed: No authenticated user found in Server Action.", userError);
            return;
        }

        console.log("User found:", user.id);
        const { error } = await supabase.rpc('increment_rank', { amount: points });

        if (error) {
            console.error("Rank RPC Error:", error);
        } else {
            console.log("Rank incremented successfully.");
        }
    } catch (e) {
        console.error("Rank update exception", e);
    }
}
