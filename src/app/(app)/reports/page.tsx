/* eslint-disable react/no-unescaped-entities */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  FileText, Table, Loader2, Calendar, 
  Search, BarChart3, AlertCircle, Trash2, CheckCircle2
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { 
  generateWeeklyReportPDF, generateMonthlyReportPDF, exportToCSV, getReportData,
  exportDailyLogsToCSV, generateDailyLogsReportPDF 
} from '@/lib/reports';

export default function Reports() {
  const [assessments, setAssessments] = useState<any[] | null>(null);
  const [dailyLogs, setDailyLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'assessments' | 'daily'>('assessments');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const supabase = createClient();
  const router = useRouter();

  async function loadData() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: assts } = await supabase.from('assessments').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
        setAssessments(assts);

        const { data: logs } = await supabase.from('daily_footprints').select('*').eq('user_id', user.id).order('log_date', { ascending: false });
        setDailyLogs(logs || []);
      } else {
        router.push('/login');
        return;
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Failed to pull emission archives.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 0);
    return () => clearTimeout(timer);
  }, [supabase, router]);

  const handleDeleteDailyLog = async (id: string) => {
    if (!confirm('Are you sure you want to delete this daily log entry?')) return;
    try {
      const { error } = await supabase.from('daily_footprints').delete().eq('id', id);
      if (error) throw error;
      setSuccessMsg('Daily log entry successfully deleted.');
      loadData();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to delete daily log.');
      setTimeout(() => setErrorMsg(null), 4000);
    }
  };

  if (loading) {
    return (
      <div className="h-[calc(100vh-12rem)] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
      </div>
    );
  }

  const transformedAssessments = getReportData(assessments);

  // Filters
  const filteredAssessments = transformedAssessments.filter(a => 
    new Date(a.created_at).toLocaleDateString().includes(searchTerm) ||
    a.total_emissions.toFixed(1).includes(searchTerm)
  );

  const filteredDailyLogs = dailyLogs.filter(log => 
    log.log_date.includes(searchTerm) ||
    log.total_emissions.toFixed(1).includes(searchTerm)
  );

  return (
    <div className="space-y-12 animate-in fade-in duration-300 py-4 text-slate-800">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-page text-[#0F172A] mt-1 font-serif">Reports Hub</h1>
          <p className="text-body text-slate-700 mt-2 font-medium">Generate, render, and export carbon logs and verified emission sheets.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          {activeTab === 'assessments' ? (
            <>
              <Button onClick={() => generateWeeklyReportPDF(assessments)} className="bg-[#0F172A] hover:bg-[#1E293B] text-white font-semibold h-11 px-5 rounded-xl shadow-sm text-sm cursor-pointer">
                <FileText className="w-4 h-4 mr-2" /> Weekly PDF
              </Button>
              <Button onClick={() => generateMonthlyReportPDF(assessments)} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold h-11 px-5 rounded-xl shadow-sm text-sm cursor-pointer">
                <FileText className="w-4 h-4 mr-2" /> Monthly PDF
              </Button>
              <Button onClick={() => exportToCSV(assessments)} variant="outline" className="border-slate-200 text-[#0F172A] hover:bg-slate-50 bg-white font-semibold h-11 px-5 rounded-xl text-sm cursor-pointer">
                <Table className="w-4 h-4 mr-2 text-slate-600" /> Export CSV
              </Button>
            </>
          ) : (
            <>
              <Button onClick={() => generateDailyLogsReportPDF(dailyLogs)} className="bg-[#0F172A] hover:bg-[#1E293B] text-white font-semibold h-11 px-5 rounded-xl shadow-sm text-sm cursor-pointer">
                <FileText className="w-4 h-4 mr-2" /> Logs PDF
              </Button>
              <Button onClick={() => exportDailyLogsToCSV(dailyLogs)} variant="outline" className="border-slate-200 text-[#0F172A] hover:bg-slate-50 bg-white font-semibold h-11 px-5 rounded-xl text-sm cursor-pointer">
                <Table className="w-4 h-4 mr-2 text-slate-600" /> Export Logs CSV
              </Button>
            </>
          )}
        </div>
      </div>

      {successMsg && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center gap-3 shadow-sm animate-in fade-in duration-200">
          <CheckCircle2 className="w-5 h-5 text-blue-600" />
          <span className="text-sm font-semibold text-slate-900">{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-red-800 text-sm">Error</h4>
            <p className="text-xs text-red-700 font-medium mt-0.5">{errorMsg}</p>
          </div>
        </div>
      )}

      {/* Tabs Selector Toggle */}
      <div className="flex gap-6 border-b border-slate-200 pb-1">
        <button 
          onClick={() => { setActiveTab('assessments'); setSearchTerm(''); }}
          className={`pb-3 text-sm font-bold border-b-2 px-1 transition-all cursor-pointer ${activeTab === 'assessments' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-600 hover:text-[#0F172A]'}`}
        >
          Assessments Audit ({transformedAssessments.length})
        </button>
        <button 
          onClick={() => { setActiveTab('daily'); setSearchTerm(''); }}
          className={`pb-3 text-sm font-bold border-b-2 px-1 transition-all cursor-pointer ${activeTab === 'daily' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-600 hover:text-[#0F172A]'}`}
        >
          Daily Footprint Logs ({dailyLogs.length})
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Main Records Directory table */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-sm border border-slate-200 rounded-3xl bg-white overflow-hidden">
            <CardHeader className="bg-[#FAFAF8] border-b border-slate-200 py-5 px-8">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div>
                  <CardTitle className="text-card text-[#0F172A] font-sans font-semibold text-base">
                    {activeTab === 'assessments' ? 'Baseline Assessment Archive' : 'Daily Logs History'}
                  </CardTitle>
                  <CardDescription className="text-small text-slate-600 mt-1 font-medium">
                    Search and audit logged footprint parameters.
                  </CardDescription>
                </div>
                <div className="relative max-w-xs w-full">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                  <input 
                    type="text" 
                    placeholder="Search logs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-slate-200 bg-white rounded-xl text-xs outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 font-semibold shadow-sm text-[#0F172A]"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              
              {activeTab === 'assessments' ? (
                <table className="w-full text-left border-collapse min-w-[600px]">
                  <thead>
                    <tr className="bg-[#FAFAF8] text-xs font-bold text-slate-500 uppercase border-b border-slate-200">
                      <th className="p-4 pl-8">Assessment Date</th>
                      <th className="p-4">Direct (Scope 1)</th>
                      <th className="p-4">Energy (Scope 2)</th>
                      <th className="p-4">Chain (Scope 3)</th>
                      <th className="p-4 text-right pr-8">Total Emissions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-small text-slate-700 font-semibold">
                    {filteredAssessments.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center p-8 text-slate-500">No matching assessment sheets found.</td>
                      </tr>
                    ) : (
                      filteredAssessments.map((a) => (
                        <tr key={a.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="p-4 pl-8 text-[#0F172A] flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-[#0F172A]" />
                            {new Date(a.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                          </td>
                          <td className="p-4 font-mono">{a.scope_1.toFixed(0)} kg</td>
                          <td className="p-4 font-mono">{a.scope_2.toFixed(0)} kg</td>
                          <td className="p-4 font-mono">{a.scope_3.toFixed(0)} kg</td>
                          <td className="p-4 text-right pr-8 font-mono font-bold text-[#0F172A]">
                            {a.total_emissions.toFixed(0)} kg COâ‚‚e
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              ) : (
                <table className="w-full text-left border-collapse min-w-[600px]">
                  <thead>
                    <tr className="bg-[#FAFAF8] text-xs font-bold text-slate-500 uppercase border-b border-slate-200">
                      <th className="p-4 pl-8">Log Date</th>
                      <th className="p-4">Transport</th>
                      <th className="p-4">Electricity</th>
                      <th className="p-4">Food / Diet</th>
                      <th className="p-4">Waste</th>
                      <th className="p-4 text-right pr-8">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-small text-slate-700 font-semibold">
                    {filteredDailyLogs.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center p-8 text-slate-600">No matching daily logs found.</td>
                      </tr>
                    ) : (
                      filteredDailyLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="p-4 pl-8 text-[#0F172A] font-mono">{log.log_date}</td>
                          <td className="p-4 font-mono">{Number(log.transport_emissions).toFixed(1)} kg</td>
                          <td className="p-4 font-mono">{Number(log.electricity_emissions).toFixed(1)} kg</td>
                          <td className="p-4 font-mono">{Number(log.food_emissions).toFixed(1)} kg</td>
                          <td className="p-4 font-mono">{Number(log.waste_emissions).toFixed(1)} kg</td>
                          <td className="p-4 text-right pr-8 flex justify-end gap-2 items-center">
                            <span className="font-mono font-bold text-blue-600 mr-4">{Number(log.total_emissions).toFixed(1)} kg</span>
                            <button onClick={() => handleDeleteDailyLog(log.id)} className="p-1.5 text-slate-500 hover:text-red-500 transition-colors cursor-pointer bg-transparent border-0">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}

            </CardContent>
          </Card>
        </div>

        {/* Side Panel compliance summary */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="shadow-sm border border-slate-200 rounded-3xl bg-white">
            <CardHeader className="border-b border-slate-100 py-5 px-8">
              <CardTitle className="text-card text-[#0F172A] font-sans font-semibold text-base">Environmental Audits</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 px-8 space-y-4">
              <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider text-slate-500">
                <span>Metric</span>
                <span>Value</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-600 font-medium">Total Baseline Audits:</span>
                <span className="font-bold text-[#0F172A] font-mono">{transformedAssessments.length}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-600 font-medium">Total Daily Logs:</span>
                <span className="font-bold text-[#0F172A] font-mono">{dailyLogs.length}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-600 font-medium">Summed Daily Footprint:</span>
                <span className="font-bold text-blue-600 font-mono">
                  {dailyLogs.reduce((acc, log) => acc + Number(log.total_emissions || 0), 0).toFixed(1)} kg
                </span>
              </div>
              
              <div className="border-t border-slate-100 pt-6">
                <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 flex items-start gap-3">
                  <BarChart3 className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-[#0F172A] text-sm">GHG Scope Standards</h4>
                    <p className="text-xs text-slate-600 mt-2 leading-relaxed font-medium">
                      Emission factors conform to EPA greenhouse Gas Protocols and regional power grid standards, classifying direct (Scope 1), purchased grid utilities (Scope 2), and value chain/consumption (Scope 3) categories.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}


