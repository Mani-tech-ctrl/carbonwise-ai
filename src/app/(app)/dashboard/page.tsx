/* eslint-disable react/no-unescaped-entities */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  BarChart, Bar
} from 'recharts';
import { 
  ArrowRight, Loader2, Sparkles, TrendingUp, 
  Calendar, Award, Activity, ShieldCheck
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { getReportData } from '@/lib/reports';

const PIE_COLORS = ['#0F172A', '#2563EB', '#3B82F6', '#F59E0B', '#EF4444'];
const BAR_COLORS = { user: '#2563EB', average: '#E2E8F0' };

const US_BENCHMARK = {
  transport: 4500,
  energy: 4000,
  diet: 2000,
  shopping: 2500,
  waste: 1000,
};

export default function Dashboard() {
  const [assessments, setAssessments] = useState<any[] | null>(null);
  const [dailyLogs, setDailyLogs] = useState<any[]>([]);
  const [challenges, setChallenges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [score, setScore] = useState(0);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase.from('profiles').select('sustainability_score').eq('id', user.id).single();
        if (profile?.sustainability_score) {
          setScore(profile.sustainability_score);
        }

        const { data: assts } = await supabase.from('assessments').select('*').eq('user_id', user.id).order('created_at', { ascending: true });
        setAssessments(assts);

        const { data: logs } = await supabase.from('daily_footprints').select('*').eq('user_id', user.id).order('log_date', { ascending: true });
        setDailyLogs(logs || []);

        const { data: chs } = await supabase.from('challenges').select('*').eq('user_id', user.id);
        setChallenges(chs || []);
      } else {
        router.push('/login');
        return;
      }
      setLoading(false);
    }
    loadData();
  }, [supabase, router]);

  if (loading) {
    return (
      <div className="h-[calc(100vh-12rem)] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
      </div>
    );
  }

  // Gracefully handle empty assessment state
  if (!assessments || assessments.length === 0) {
    return (
      <div className="max-w-4xl mx-auto flex flex-col items-center justify-center h-[calc(100vh-12rem)] text-center space-y-6 px-4">
        <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center shadow-inner">
          <Sparkles className="w-10 h-10 text-[#0F172A] animate-pulse" />
        </div>
        <h2 className="text-section text-[#0F172A]">Your carbon dashboard is empty</h2>
        <p className="text-body text-[#4B5563] max-w-lg font-medium">
          Take your first baseline assessment to analyze your environmental footprint, configure the Carbon Twin simulator, and retrieve AI-powered coaching tips.
        </p>
        <Button onClick={() => router.push('/assessment')} className="bg-[#0F172A] hover:bg-[#1E293B] text-white text-base px-6 py-5 rounded-xl font-bold shadow-md cursor-pointer">
          Take Baseline Assessment <ArrowRight className="ml-2 w-4 h-4" />
        </Button>
      </div>
    );
  }

  const reportData = getReportData(assessments);
  const latest = reportData[reportData.length - 1];

  // Accumulated Daily Stats
  const totalDailyLogged = dailyLogs.reduce((acc, log) => acc + Number(log.total_emissions || 0), 0);
  
  // Weekly Logs (last 7 days)
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const weeklyLogs = dailyLogs.filter(log => new Date(log.log_date) >= oneWeekAgo);
  const weeklyDailyTotal = weeklyLogs.reduce((acc, log) => acc + Number(log.total_emissions || 0), 0);

  // Monthly Logs (last 30 days)
  const oneMonthAgo = new Date();
  oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);
  const monthlyLogs = dailyLogs.filter(log => new Date(log.log_date) >= oneMonthAgo);
  const monthlyDailyTotal = monthlyLogs.reduce((acc, log) => acc + Number(log.total_emissions || 0), 0);

  // Achievements
  const completedChallenges = challenges.filter(c => c.is_completed);
  const achievementsCount = completedChallenges.length;

  // Carbon Twin simulator savings projection (typical 20% savings if they simulate reductions)
  const simulatedSavings = (latest?.total_emissions || 0) * 0.22;
  const projectedFootprint = Math.max(0, (latest?.total_emissions || 0) - simulatedSavings);

  // Recharts Breakdown Pie Chart Data
  const pieData = [
    { name: 'Transportation', value: latest?.category_breakdown?.transport || 0 },
    { name: 'Home Energy', value: latest?.category_breakdown?.energy || 0 },
    { name: 'Food & Diet', value: latest?.category_breakdown?.diet || 0 },
    { name: 'Shopping', value: latest?.category_breakdown?.shopping || 0 },
    { name: 'Waste', value: latest?.category_breakdown?.waste || 0 },
  ].filter(d => d.value > 0);

  // Recharts Benchmarking Bar Chart Data
  const comparisonData = [
    { category: 'Transport', User: Math.round(latest?.category_breakdown?.transport || 0), Average: US_BENCHMARK.transport },
    { category: 'Home Energy', User: Math.round(latest?.category_breakdown?.energy || 0), Average: US_BENCHMARK.energy },
    { category: 'Food & Diet', User: Math.round(latest?.category_breakdown?.diet || 0), Average: US_BENCHMARK.diet },
    { category: 'Shopping', User: Math.round(latest?.category_breakdown?.shopping || 0), Average: US_BENCHMARK.shopping },
    { category: 'Waste', User: Math.round(latest?.category_breakdown?.waste || 0), Average: US_BENCHMARK.waste },
  ];

  // Recharts Daily Tracking trend (past 7 daily logs)
  const dailyTrendData = dailyLogs.slice(-7).map(log => ({
    date: log.log_date.substring(5), // MM-DD
    emissions: Math.round(log.total_emissions)
  }));

  const comparisonRatio = ((latest?.total_emissions || 0) / Object.values(US_BENCHMARK).reduce((a, b) => a + b, 0)) * 100;
  const isBetterThanAverage = comparisonRatio < 100;

  return (
    <div className="space-y-12 animate-in fade-in duration-300 py-4 text-slate-800">
      
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-page text-[#0F172A] mt-1 font-serif">Sustainability Command Center</h1>
          <p className="text-body text-slate-700 mt-2 font-sans font-medium">Track your carbon footprint reductions and view real-time ecological statistics.</p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="bg-blue-50 px-4 py-2 rounded-2xl border border-blue-100 text-sm font-bold flex items-center shadow-sm">
            <ShieldCheck className="w-4 h-4 text-blue-600 mr-2 animate-pulse" />
            <span className="text-slate-700">Sustainability Score:</span>
            <span className="ml-2 px-2.5 py-0.5 bg-[#0F172A] text-white rounded-full font-extrabold">{score} / 100</span>
          </div>
          <Button onClick={() => router.push('/assessment')} className="bg-[#0F172A] hover:bg-[#1E293B] text-white font-semibold h-11 px-6 rounded-xl text-sm cursor-pointer shadow-sm">
            Retake Assessment
          </Button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
        
        {/* Total Emissions (Scope baseline) */}
        <Card className="border-l-4 border-l-[#0F172A] shadow-sm rounded-2xl bg-white border border-slate-200/60">
          <CardContent className="p-6">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Baseline Emissions</span>
            <div className="text-3xl font-bold text-[#0F172A] mt-2 font-mono">
              {(latest?.total_emissions / 1000).toFixed(2)} 
              <span className="text-xs font-bold text-slate-500 uppercase ml-1">Tons</span>
            </div>
            <p className="text-xs text-slate-600 mt-1.5 font-semibold">COâ‚‚e annual benchmark</p>
          </CardContent>
        </Card>

        {/* Daily Footprint Logger Total */}
        <Card className="shadow-sm rounded-2xl bg-white border border-slate-200/60">
          <CardContent className="p-6">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Daily Logs Total</span>
            <div className="text-3xl font-bold text-[#0F172A] mt-2 font-mono">
              {totalDailyLogged.toFixed(1)} 
              <span className="text-xs font-bold text-slate-500 uppercase ml-1">kg</span>
            </div>
            <p className="text-xs text-slate-600 mt-1.5 font-semibold">Accumulated daily logs</p>
          </CardContent>
        </Card>

        {/* Weekly Daily Footprint */}
        <Card className="shadow-sm rounded-2xl bg-white border border-slate-200/60">
          <CardContent className="p-6">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Weekly Progress</span>
            <div className="text-3xl font-bold text-[#0F172A] mt-2 font-mono">
              {weeklyDailyTotal.toFixed(1)} 
              <span className="text-xs font-bold text-slate-500 uppercase ml-1">kg</span>
            </div>
            <p className="text-xs text-slate-600 mt-1.5 font-semibold">Emitted past 7 days</p>
          </CardContent>
        </Card>

        {/* Monthly Daily Footprint */}
        <Card className="shadow-sm rounded-2xl bg-white border border-slate-200/60">
          <CardContent className="p-6">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Monthly Progress</span>
            <div className="text-3xl font-bold text-[#0F172A] mt-2 font-mono">
              {monthlyDailyTotal.toFixed(1)} 
              <span className="text-xs font-bold text-slate-500 uppercase ml-1">kg</span>
            </div>
            <p className="text-xs text-slate-600 mt-1.5 font-semibold">Emitted past 30 days</p>
          </CardContent>
        </Card>

        {/* Achievements / Challenges Completed */}
        <Card className="shadow-sm rounded-2xl bg-white border border-slate-200/60">
          <CardContent className="p-6">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Achievements</span>
            <div className="text-3xl font-bold text-[#0F172A] mt-2 font-mono flex items-center">
              <Award className="w-5 h-5 text-blue-600 mr-1.5 shrink-0" />
              {achievementsCount}
            </div>
            <p className="text-xs text-slate-600 mt-1.5 font-semibold">Challenges completed</p>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Visualization Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Pie Chart: Latest Assessment */}
        <Card className="shadow-sm border border-slate-200/80 rounded-3xl bg-white lg:col-span-1">
          <CardHeader className="border-b border-slate-100 bg-[#FAFAF8] py-5 px-8">
            <CardTitle className="text-card text-[#0F172A] font-sans font-semibold text-base">Emissions Breakdown</CardTitle>
            <CardDescription className="text-small text-slate-500 font-medium">Relative carbon distribution by sector</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] pt-6 pb-4 px-6">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={4} dataKey="value">
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => `${Number(value || 0).toFixed(0)} kg COâ‚‚e`} contentStyle={{ borderRadius: '12px', border: '1px solid #E4E4E0', fontSize: '12px' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px', color: '#374151' }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Bar Chart: Benchmarking Comparisons */}
        <Card className="shadow-sm border border-slate-200/80 rounded-3xl bg-white lg:col-span-1">
          <CardHeader className="border-b border-slate-100 bg-[#FAFAF8] py-5 px-8">
            <CardTitle className="text-card text-[#0F172A] font-sans font-semibold text-base">Benchmarking Comparisons</CardTitle>
            <CardDescription className="text-small text-slate-500 font-medium">Your parameters vs standard US averages (kg COâ‚‚e)</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] pt-6 pb-4 px-6">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparisonData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E4E4E0" />
                <XAxis dataKey="category" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: '10px' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: '10px' }} />
                <Tooltip formatter={(value: any) => `${value} kg`} contentStyle={{ borderRadius: '12px', border: '1px solid #E4E4E0', fontSize: '12px' }} />
                <Legend iconType="square" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="User" fill={BAR_COLORS.user} radius={[4, 4, 0, 0]} />
                <Bar dataKey="Average" fill={BAR_COLORS.average} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Daily Logs Trend Line Chart */}
        <Card className="shadow-sm border border-slate-200/80 rounded-3xl bg-white lg:col-span-1">
          <CardHeader className="border-b border-slate-100 bg-[#FAFAF8] py-5 px-8">
            <CardTitle className="text-card text-[#0F172A] font-sans font-semibold text-base">Daily Tracking Trend</CardTitle>
            <CardDescription className="text-small text-slate-500 font-medium">Footprint tracking progress across recent log dates</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] pt-6 pb-4 px-6">
            {dailyTrendData.length <= 1 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-4">
                <Calendar className="w-8 h-8 text-slate-400 mb-2" />
                <p className="text-small font-bold text-slate-700">More data required</p>
                <p className="text-xs text-slate-600 mt-1 font-semibold leading-relaxed">
                  Log your daily parameters on the Daily Tracker page to unlock real-time history charts.
                </p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E4E4E0" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: '10px' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: '10px' }} />
                  <Tooltip formatter={(value: any) => `${value} kg`} contentStyle={{ borderRadius: '12px', border: '1px solid #E4E4E0', fontSize: '12px' }} />
                  <Line type="monotone" dataKey="emissions" stroke="#2563EB" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

      </div>

      {/* Coach Analysis & Carbon Twin Projections */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Analysis & Twin Projections card */}
        <Card className="shadow-sm border border-slate-200/80 rounded-3xl bg-white md:col-span-2">
          <CardHeader className="border-b border-slate-100 bg-[#FAFAF8] py-5 px-8">
            <CardTitle className="text-card text-[#0F172A] font-sans font-semibold text-base">Ecosystem Analysis & Simulations</CardTitle>
          </CardHeader>
          <CardContent className="py-6 px-8 space-y-6">
            <div className="flex items-start gap-4">
              <div className={`p-2.5 rounded-xl shrink-0 ${isBetterThanAverage ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-800'}`}>
                <TrendingUp className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="font-sans font-bold text-[#111827] text-base">
                  {isBetterThanAverage 
                    ? `You are ${Math.round(100 - comparisonRatio)}% below the national average!` 
                    : `You are ${Math.round(comparisonRatio - 100)}% above the national average.`}
                </h4>
                <p className="text-small text-slate-600 font-medium">
                  Your baseline footprint is {(latest.total_emissions / 1000).toFixed(1)} tons of COâ‚‚e per year. US average is ~14 tons.
                </p>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-6 flex items-start gap-4">
              <div className="p-2.5 bg-blue-50 text-blue-700 rounded-xl shrink-0">
                <Activity className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="font-sans font-bold text-[#111827] text-base">Carbon Twin Projection</h4>
                <p className="text-small text-slate-600 font-medium">
                  Applying simulated lifestyle targets projects a footprint of <span className="text-[#0F172A] font-extrabold font-mono">{(projectedFootprint / 1000).toFixed(2)} Tons</span>. That represents a reduction of <span className="text-blue-600 font-bold">22%</span> ({Math.round(simulatedSavings)} kg COâ‚‚e avoided).
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AI Mentorship CTA card (Dark premium SaaS card widget) */}
        <Card className="bg-gradient-to-br from-[#0F172A] to-slate-800 text-white border-0 shadow-md rounded-3xl flex flex-col justify-between p-8 overflow-hidden relative min-h-[240px]">
          <div className="absolute -right-8 -bottom-8 w-36 h-36 bg-blue-500/10 rounded-full opacity-35 blur-2xl"></div>
          <div className="space-y-4 relative z-10">
            <span className="text-xs font-bold uppercase tracking-widest text-blue-300 bg-slate-900/40 px-3 py-1 rounded-full border border-slate-700/40 inline-block shadow-sm">AI Coach</span>
            <h3 className="text-xl font-bold leading-snug">Get customized carbon actions</h3>
            <p className="text-sm text-slate-300 leading-relaxed font-medium">
              Our Gemini mentor evaluates your questionnaire answers and daily logs to formulate carbon reduction strategies.
            </p>
          </div>
          <Button onClick={() => router.push('/insights')} className="w-full bg-[#2563EB] hover:bg-blue-600 text-white font-bold rounded-xl py-5 text-xs mt-6 shadow-sm relative z-10 transition-all hover:scale-[1.02] cursor-pointer">
            Consult Coach
          </Button>
        </Card>
      </div>
    </div>
  );
}


