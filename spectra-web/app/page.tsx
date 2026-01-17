import Link from 'next/link';
import Header from '@/components/Header';
import { Card } from '@/components/ui';
import { ArrowUpRight } from 'lucide-react';
import { createClient } from '@/utils/supabase/server';
import { NutritionLabel } from '@/components/NutritionLabel';

async function getNews(category: string = 'technology') {
  const apiKey = process.env.NEWS_API_KEY;
  if (!apiKey) return [];

  // Default to technology if no category provided, unless specific mapping
  const validCategories = ['business', 'entertainment', 'general', 'health', 'science', 'sports', 'technology'];
  const safeCategory = validCategories.includes(category) ? category : 'technology';

  try {
    const res = await fetch(`https://newsapi.org/v2/top-headlines?country=us&category=${safeCategory}&pageSize=20&apiKey=${apiKey}`, { next: { revalidate: 3600 } });
    const data = await res.json();
    return data.articles || [];
  } catch (e) {
    console.error("News fetch failed", e);
    return [];
  }
}

async function getSourceMetadata(articles: any[]) {
  const supabase = await createClient();
  const domains = [...new Set(articles.map(a => {
    try {
      return new URL(a.url).hostname.replace('www.', '');
    } catch { return null; }
  }).filter(Boolean))];

  if (domains.length === 0) return {};

  // Note: ilike/in query simplification for prototype
  // Real implementation would be better with an OR query or normalizing domains in DB
  const { data } = await supabase.from('source_metadata').select('*');

  // Client-side match to handle partial domain matches easily for this MVP (e.g. 'cnn.com' matching 'us.cnn.com')
  const metadataMap: Record<string, any> = {};
  if (data) {
    domains.forEach(d => {
      const match = data.find((m: any) => d?.includes(m.domain) || m.domain.includes(d));
      if (match) metadataMap[d as string] = match;
    });
  }
  return metadataMap;
}

export default async function Home(props: { searchParams: Promise<{ category?: string }> }) {
  const searchParams = await props.searchParams;
  const category = searchParams?.category || 'technology';
  const articles = await getNews(category);
  const metadataMap = await getSourceMetadata(articles);

  const getMeta = (url: string) => {
    try {
      const domain = new URL(url).hostname.replace('www.', '');
      return metadataMap[domain];
    } catch { return null; }
  };

  const mainArticle = articles[0];
  const sidebarArticles = articles.slice(1, 4);
  const secondaryArticles = articles.slice(4, 6);

  return (
    <main className="min-h-screen bg-neutral-100 dark:bg-neutral-900 pattern-grid-lg">
      <Header />

      <section className="container max-w-screen-2xl py-12 space-y-16">

        {/* Initial Hero / Banner */}
        <div className="text-center space-y-4 py-8 border-b-2 border-primary/20">
          <div className="flex justify-between items-center text-xs font-mono uppercase tracking-widest text-muted-foreground">
            <span>Est. October 2024</span>
            <span className="text-primary font-bold">Special Glass Edition</span>
            <span>Price: One Coin</span>
          </div>
          <h1 className="text-7xl md:text-9xl font-serif font-black tracking-tighter text-foreground uppercase pt-4 leading-[0.8]">
            Smart News Feed
          </h1>
          <p className="text-xl md:text-2xl font-serif italic text-muted-foreground">
            A retro-modern lens for the digital age: automated truth, expertly clarified.
          </p>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Main Headline */}
          <div className="lg:col-span-8 space-y-8">
            {mainArticle ? (
              <Card className="group relative overflow-hidden border-none shadow-2xl h-[600px] flex flex-col justify-end p-8 text-white transition-all hover:shadow-primary/20">
                <div className="absolute inset-0 z-0 bg-neutral-800">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-10" />
                  <img
                    src={mainArticle.urlToImage || "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2670&auto=format&fit=crop"}
                    alt={mainArticle.title}
                    className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-1000 ease-out"
                  />
                </div>

                <div className="relative z-20 space-y-6 max-w-3xl">
                  <div className="flex items-center gap-3">
                    <span className="bg-primary text-primary-foreground px-3 py-1 text-xs font-bold uppercase tracking-widest ">Latest Report</span>
                    <NutritionLabel metadata={getMeta(mainArticle.url)}>
                      <span className="text-xs font-mono uppercase text-white/80 tracking-wider borders-l border-white/20 pl-3 cursor-help hover:text-white hover:bg-white/10 px-2 py-1 rounded transition-all">{mainArticle.source.name}</span>
                    </NutritionLabel>
                  </div>
                  <h2 className="text-4xl md:text-6xl font-serif font-bold leading-[0.9] tracking-tight drop-shadow-xl">
                    {mainArticle.title}
                  </h2>
                  <p className="text-lg md:text-xl text-white/90 font-serif leading-relaxed line-clamp-2 max-w-2xl drop-shadow-md">
                    {mainArticle.description}
                  </p>
                  <Link href={`/analyze?q=${encodeURIComponent(mainArticle.url)}`}>
                    <button className="flex items-center gap-2 text-sm uppercase tracking-widest font-bold text-white hover:text-primary transition-colors hover:underline decoration-2 underline-offset-4 mt-2">
                      Analyze Dossier <ArrowUpRight className="w-4 h-4" />
                    </button>
                  </Link>
                </div>
              </Card>
            ) : (
              <div className="bg-red-50 dark:bg-red-900/20 p-8 text-red-500 border border-red-200 rounded">Unable to load main news feed. Check API Key.</div>
            )}

            {/* Secondary Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {secondaryArticles.map((article: any, i: number) => (
                <Card key={i} className="group overflow-hidden border border-neutral-200 bg-white dark:bg-neutral-900 shadow-sm hover:shadow-md transition-all duration-300">
                  <div className="aspect-[16/10] w-full overflow-hidden relative">
                    <img
                      src={article.urlToImage || "https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=2670&auto=format&fit=crop"}
                      alt="News"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-black/5 group-hover:bg-black/0 transition-colors" />
                  </div>

                  <div className="p-6 flex flex-col gap-4">
                    <div>
                      <NutritionLabel metadata={getMeta(article.url)}>
                        <span className="text-xs font-mono uppercase tracking-widest text-[#ff4400] font-bold block mb-2 cursor-help w-fit">{article.source.name}</span>
                      </NutritionLabel>
                      <h3 className="text-2xl font-serif font-bold leading-wrapper text-neutral-900 dark:text-neutral-100 group-hover:text-[#ff4400] transition-colors line-clamp-3">
                        {article.title}
                      </h3>
                    </div>

                    <div className="mt-2 pt-4 border-t border-neutral-100 dark:border-neutral-800">
                      <Link href={`/analyze?q=${encodeURIComponent(article.url)}`} className="inline-flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-muted-foreground group-hover:text-primary transition-colors">
                        Validate Source <ArrowUpRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Sidebar / Flash Despatches */}
          <div className="lg:col-span-4 space-y-8">
            <Card className="p-8 bg-paper pattern-paper border-2 border-neutral-900/5 h-full relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-transparent to-primary opacity-50" />
              <h3 className="font-serif text-3xl font-black mb-8 border-b-2 border-neutral-900/10 pb-4 text-neutral-800 dark:text-neutral-100 flex items-center justify-between">
                <span>Despatches</span>
                <span className="text-xs font-mono font-normal text-muted-foreground bg-neutral-100 px-2 py-1 rounded-full">LIVE</span>
              </h3>

              <div className="space-y-8">
                {sidebarArticles.map((article: any, i: number) => (
                  <Link key={i} href={`/analyze?q=${encodeURIComponent(article.url)}`}>
                    <div className="group cursor-pointer mb-8 relative pl-6 border-l-2 border-border hover:border-primary transition-colors">
                      <div className="flex justify-between items-baseline mb-2">
                        <NutritionLabel metadata={getMeta(article.url)}>
                          <span className="text-[10px] font-mono uppercase text-muted-foreground tracking-widest hover:text-primary transition-colors">{article.source.name}</span>
                        </NutritionLabel>
                      </div>
                      <h4 className="font-serif text-lg font-bold leading-snug group-hover:text-primary transition-colors line-clamp-3">{article.title}</h4>
                      <p className="text-xs text-muted-foreground mt-2 italic line-clamp-2">{article.description?.slice(0, 80)}...</p>
                    </div>
                  </Link>
                ))}
              </div>
            </Card>
          </div>
        </div>

        {/* The Archive / Complete Feed */}
        {null}

      </section>
    </main>
  );
}
