/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { AlertCircle, ArrowRight, Loader2, Send, Sparkles, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createClient } from '@/lib/supabase/client';
import { getReportData } from '@/lib/reports';

type Message = { role: 'user' | 'assistant'; content: string };

const LOADING_STATES = [
  'Thinking...',
  'Reviewing your emissions data...',
  'Generating recommendations...',
  'Preparing a personalized response...',
];

export default function AIInsights() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingStateIndex, setLoadingStateIndex] = useState(0);
  const [fetchingData, setFetchingData] = useState(true);
  const [assessmentContext, setAssessmentContext] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  useEffect(() => {
    if (!loading) {
      setLoadingStateIndex(0);
      return;
    }

    const interval = setInterval(() => {
      setLoadingStateIndex((prev) => (prev + 1) % LOADING_STATES.length);
    }, 2500);

    return () => clearInterval(interval);
  }, [loading]);

  useEffect(() => {
    async function loadData() {
      setFetchingData(true);
      setErrorMsg(null);
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;
        if (!user) {
          setAssessmentContext(null);
          return;
        }

        const { data: assessments, error } = await supabase
          .from('assessments')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true });

        if (error) throw error;
        if (assessments && assessments.length > 0) {
          const reportData = getReportData(assessments);
          setAssessmentContext(reportData[reportData.length - 1]);
        } else {
          setAssessmentContext(null);
        }
      } catch (err: any) {
        setErrorMsg(err.message || 'Unable to load your carbon baseline.');
      } finally {
        setFetchingData(false);
      }
    }

    loadData();
  }, [supabase]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = async () => {
    const prompt = input.trim();
    if (!prompt || loading) return;

    setMessages((prev) => [...prev, { role: 'user', content: prompt }]);
    setInput('');
    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gemini request failed.');
      if (!data.reply) throw new Error('Gemini returned an empty response.');

      setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);
    } catch (err: any) {
      setErrorMsg(err.message || 'Unable to reach Gemini right now.');
    } finally {
      setLoading(false);
    }
  };

  if (fetchingData) {
    return (
      <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-[#2563EB]" />
          <p className="mt-4 text-sm font-bold text-slate-700">Loading your climate context</p>
        </div>
      </div>
    );
  }

  if (!assessmentContext) {
    return (
      <div className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-3xl flex-col items-center justify-center px-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-[#2563EB]">
          <Sparkles className="h-8 w-8" />
        </div>
        <h1 className="mt-6 font-serif text-4xl font-bold tracking-normal text-[#0F172A]">Create a baseline before asking Gemini.</h1>
        <p className="mt-4 max-w-xl text-base leading-7 text-slate-700">
          AI Insights uses your saved assessment and recent daily tracker data. Complete the calculator once, then return for personalized Gemini recommendations.
        </p>
        {errorMsg && (
          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-left text-sm text-amber-900">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
        <Link href="/assessment" className="mt-8 inline-flex items-center rounded-xl bg-[#2563EB] px-6 py-3 text-sm font-bold text-white shadow-sm shadow-blue-600/20 hover:bg-blue-700">
          Start calculator
          <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-6rem)] max-w-6xl flex-col px-4 py-6 sm:px-6 lg:px-8">
      <header className="mb-5 flex flex-col justify-between gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-[#2563EB]">Gemini climate coach</p>
          <h1 className="mt-2 font-serif text-4xl font-bold tracking-normal text-[#0F172A]">AI Insights</h1>
          <p className="mt-2 text-sm leading-6 text-slate-700">
            Ask a question about your footprint. Responses are generated live by Gemini using your latest assessment and daily logs.
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm">
          <p className="font-bold text-[#0F172A]">{Number(assessmentContext.total_emissions || 0).toFixed(0)} kg CO2e</p>
          <p className="text-xs text-slate-600">Latest annual baseline</p>
        </div>
      </header>

      <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="min-h-0 flex-1 overflow-y-auto bg-[#FAFAF8] p-4 sm:p-6">
          {messages.length === 0 && !loading ? (
            <div className="flex h-full items-center justify-center">
              <div className="max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
                <Sparkles className="mx-auto h-8 w-8 text-[#2563EB]" />
                <h2 className="mt-4 font-serif text-2xl font-bold tracking-normal text-[#0F172A]">No conversation yet</h2>
                <p className="mt-3 text-sm leading-6 text-slate-700">
                  Enter a specific question about commuting, electricity, food, waste, or reduction priorities to generate your first Gemini insight.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {messages.map((message, index) => (
                <div key={index} className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {message.role === 'assistant' && <Avatar icon="assistant" />}
                  <div className={`max-w-[86%] rounded-2xl px-4 py-3 text-sm leading-7 shadow-sm ${message.role === 'user' ? 'bg-[#0F172A] text-white' : 'border border-slate-200 bg-white text-slate-800'}`}>
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  </div>
                  {message.role === 'user' && <Avatar icon="user" />}
                </div>
              ))}
              {loading && (
                <div className="flex gap-3">
                  <Avatar icon="assistant" />
                  <div className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm min-w-[200px] transition-all duration-300">
                    <span className="text-slate-500 font-semibold transition-all duration-300">
                      {LOADING_STATES[loadingStateIndex]}
                    </span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-blue-600 animate-bounce" style={{ animationDelay: '0ms', animationDuration: '0.8s' }} />
                      <span className="h-2.5 w-2.5 rounded-full bg-blue-600 animate-bounce" style={{ animationDelay: '150ms', animationDuration: '0.8s' }} />
                      <span className="h-2.5 w-2.5 rounded-full bg-blue-600 animate-bounce" style={{ animationDelay: '300ms', animationDuration: '0.8s' }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {errorMsg && (
          <div className="border-t border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900 sm:px-6">
            <span className="inline-flex items-center gap-2"><AlertCircle className="h-4 w-4" />{errorMsg}</span>
          </div>
        )}

        <div className="border-t border-slate-200 bg-white p-4 sm:p-5">
          <div className="flex gap-3">
            <Input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') sendMessage();
              }}
              placeholder="Ask Gemini for a reduction plan based on your footprint..."
              className="h-12 rounded-xl border-slate-300 bg-white text-sm text-[#0F172A] focus-visible:ring-[#2563EB]"
              aria-label="Message Gemini climate coach"
            />
            <Button type="button" onClick={sendMessage} disabled={loading || !input.trim()} className="h-12 rounded-xl bg-[#2563EB] px-5 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              <span className="sr-only">Send</span>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

function Avatar({ icon }: { icon: 'assistant' | 'user' }) {
  return (
    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${icon === 'assistant' ? 'bg-blue-50 text-[#2563EB]' : 'bg-[#0F172A] text-white'}`}>
      {icon === 'assistant' ? <Sparkles className="h-4 w-4" /> : <User className="h-4 w-4" />}
    </div>
  );
}


