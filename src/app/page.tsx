/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, BarChart3, BookOpen, CheckCircle2, ExternalLink, LineChart, Sparkles, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { triggerAuthModal } from '@/components/AuthModal';

const climateStats = [
  { value: '75%+', label: 'of global greenhouse gas emissions come from fossil fuels', tone: 'bg-[#0F172A] text-white' },
  { value: '2050', label: 'is the global net-zero milestone for a livable climate pathway', tone: 'bg-white text-[#0F172A]' },
  { value: '1.5C', label: 'is the Paris-aligned warming limit that demands rapid cuts this decade', tone: 'bg-white text-[#0F172A]' },
  { value: '13', label: 'UN Sustainable Development Goal focused on climate action', tone: 'bg-white text-[#0F172A]' },
];

const unArticles = [
  {
    title: 'What Is Climate Change?',
    eyebrow: 'UN Climate Action',
    readTime: '5 min read',
    href: 'https://www.un.org/en/climatechange/what-is-climate-change',
    summary:
      'A clear UN primer on the causes of climate change, the role of greenhouse gases, and why every fraction of warming changes risk for people, cities, food systems, and ecosystems.',
  },
  {
    title: 'Renewable Energy: Powering a Safer Future',
    eyebrow: 'Energy Transition',
    readTime: '6 min read',
    href: 'https://www.un.org/en/climatechange/what-is-renewable-energy',
    summary:
      'A practical overview of solar, wind, hydro, geothermal, and other renewable sources, with the economic and public-health case for replacing fossil fuel dependence.',
  },
  {
    title: 'Net Zero Coalition',
    eyebrow: 'Decarbonization',
    readTime: '7 min read',
    href: 'https://www.un.org/en/climatechange/net-zero-coalition',
    summary:
      'The UN explanation of net zero, why near-term emission reductions matter more than distant pledges, and what credible transition planning needs to include.',
  },
];

export default function Home() {
  const [selectedArticle, setSelectedArticle] = useState<(typeof unArticles)[number] | null>(null);
  const [user, setUser] = useState<any>(null);
  const supabase = createClient();

  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    }
    loadUser();
  }, [supabase]);

  const handleProtectedClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    const protectedRoutes = ['/dashboard', '/daily-tracker', '/reports', '/insights'];
    if (protectedRoutes.includes(href) && !user) {
      e.preventDefault();
      triggerAuthModal();
    }
  };

  return (
    <main className="min-h-screen bg-[#FAFAF8] text-[#0F172A]">
      <section className="pt-32 pb-16 sm:pt-36 sm:pb-24">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-[1.08fr_0.92fr] lg:px-8">
          <div className="flex flex-col justify-center">
            <div className="mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-bold uppercase tracking-wide text-slate-700">
              <Sparkles className="h-3.5 w-3.5 text-[#2563EB]" />
              Premium climate intelligence
            </div>
            <h1 className="max-w-4xl font-serif text-5xl font-bold leading-[1.05] tracking-normal text-[#0F172A] sm:text-6xl lg:text-7xl">
              Measure the footprint behind modern life.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-700">
              CarbonWise turns everyday transport, energy, food, waste, and purchase data into a clear carbon baseline, daily ledger, and Gemini-powered reduction plan.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/assessment"
                className="inline-flex h-[52px] items-center justify-center rounded-xl bg-[#2563EB] px-6 text-sm font-bold text-white shadow-sm shadow-blue-600/20 transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-2"
              >
                Calculate My Footprint
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
              {user ? (
                <Link
                  href="/dashboard"
                  className="inline-flex h-[52px] items-center justify-center rounded-xl border border-slate-300 bg-white px-6 text-sm font-bold text-[#0F172A] transition hover:border-slate-400 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-2"
                >
                  Go to Dashboard
                </Link>
              ) : (
                <Link
                  href="/signup"
                  className="inline-flex h-[52px] items-center justify-center rounded-xl border border-slate-300 bg-white px-6 text-sm font-bold text-[#0F172A] transition hover:border-slate-400 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-2"
                >
                  Create Free Account
                </Link>
              )}
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="rounded-3xl bg-[#0F172A] p-6 text-white">
              <div className="flex items-center justify-between border-b border-white/10 pb-5">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-blue-200">Live baseline preview</p>
                  <p className="mt-1 text-sm text-slate-300">Assessment-ready emission model</p>
                </div>
                <LineChart className="h-6 w-6 text-[#F59E0B]" />
              </div>
              <div className="grid gap-4 py-6 sm:grid-cols-3">
                {['Transport', 'Energy', 'Food'].map((item, index) => (
                  <div key={item} className="rounded-2xl bg-white/8 p-4 ring-1 ring-white/10">
                    <p className="text-xs font-semibold text-slate-300">{item}</p>
                    <div className="mt-5 h-24 rounded-xl bg-white/10 p-2">
                      <div className="flex h-full items-end gap-1.5">
                        {[42, 70, 56, 84].map((height, barIndex) => (
                          <span
                            key={`${item}-${barIndex}`}
                            className={`w-full rounded-t-md ${index === 1 ? 'bg-[#F59E0B]' : 'bg-[#2563EB]'}`}
                            style={{ height: `${Math.max(24, height - index * 10)}%` }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="rounded-2xl bg-white p-4 text-[#0F172A]">
                <div className="flex items-center gap-3">
                  <BarChart3 className="h-5 w-5 text-[#2563EB]" />
                  <div>
                    <p className="text-sm font-bold">Audit, track, improve</p>
                    <p className="text-xs leading-5 text-slate-600">Built for real submissions, daily calculations, and authenticated AI coaching.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="climate-statistics" className="border-y border-slate-200 bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-wide text-[#2563EB]">Climate statistics</p>
            <h2 className="mt-3 font-serif text-3xl font-bold tracking-normal sm:text-4xl">The case for better personal carbon accounting is numerical.</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-4">
            {climateStats.map((stat) => (
              <div key={stat.value} className={`rounded-2xl border border-slate-200 p-6 shadow-sm ${stat.tone}`}>
                <p className="font-serif text-4xl font-bold tracking-normal">{stat.value}</p>
                <p className={`mt-5 text-sm leading-6 ${stat.tone.includes('text-white') ? 'text-slate-200' : 'text-slate-700'}`}>{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
            <div className="max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-wide text-[#2563EB]">Featured UN climate articles</p>
              <h2 className="mt-3 font-serif text-3xl font-bold tracking-normal sm:text-4xl">Source material for serious climate decisions.</h2>
            </div>
            <Link href="/articles" className="inline-flex items-center text-sm font-bold text-[#2563EB] hover:text-blue-700">
              View knowledge hub
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {unArticles.map((article) => (
              <article key={article.title} className="flex min-h-[300px] flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                <div>
                  <div className="mb-8 flex items-center justify-between">
                    <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-[#2563EB]">{article.eyebrow}</span>
                    <BookOpen className="h-5 w-5 text-slate-500" />
                  </div>
                  <h3 className="font-serif text-2xl font-bold leading-tight tracking-normal text-[#0F172A]">{article.title}</h3>
                  <p className="mt-4 text-sm leading-6 text-slate-700">{article.summary}</p>
                </div>
                <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-4">
                  <span className="text-xs font-bold uppercase tracking-wide text-slate-600">{article.readTime}</span>
                  <button
                    type="button"
                    onClick={() => setSelectedArticle(article)}
                    className="inline-flex items-center text-sm font-bold text-[#2563EB] hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-2"
                  >
                    Read more
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#0F172A] py-16 text-white sm:py-20">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:px-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-blue-200">Complete workflow</p>
            <h2 className="mt-3 font-serif text-3xl font-bold tracking-normal sm:text-4xl">Every core action routes to a working product surface.</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              ['Baseline calculator', '/assessment'],
              ['Daily tracker', '/daily-tracker'],
              ['AI insights', '/insights'],
              ['Reports', '/reports'],
            ].map(([label, href]) => (
              <Link 
                key={href} 
                href={href} 
                onClick={(e) => handleProtectedClick(e, href)}
                className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-5 text-sm font-bold transition hover:bg-white/10"
              >
                <span className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-[#F59E0B]" />
                  {label}
                </span>
                <ArrowRight className="h-4 w-4 text-blue-200" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white py-10">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p className="font-bold text-[#0F172A]">CarbonWise AI</p>
          <div className="flex flex-wrap gap-4">
            <Link href="/about" className="hover:text-[#2563EB]">About</Link>
            <Link href="/articles" className="hover:text-[#2563EB]">Articles</Link>
            <Link href="/login" className="hover:text-[#2563EB]">Log in</Link>
            <Link href="/signup" className="hover:text-[#2563EB]">Get started</Link>
          </div>
        </div>
      </footer>

      {selectedArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="article-title">
          <div className="max-h-[88vh] w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-200 p-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-[#2563EB]">{selectedArticle.eyebrow}</p>
                <h3 id="article-title" className="mt-2 font-serif text-3xl font-bold tracking-normal text-[#0F172A]">{selectedArticle.title}</h3>
              </div>
              <button type="button" onClick={() => setSelectedArticle(null)} className="rounded-full p-2 text-slate-600 hover:bg-slate-100 hover:text-[#0F172A]" aria-label="Close article">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-5 overflow-y-auto p-6">
              <p className="text-base leading-8 text-slate-700">{selectedArticle.summary}</p>
              <p className="text-sm leading-7 text-slate-600">
                This featured reading is maintained by the United Nations Climate Action team. Open the source for the complete article, definitions, and latest editorial updates.
              </p>
              <a
                href={selectedArticle.href}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center rounded-xl bg-[#0F172A] px-5 py-3 text-sm font-bold text-white hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-2"
              >
                Open UN source
                <ExternalLink className="ml-2 h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}


