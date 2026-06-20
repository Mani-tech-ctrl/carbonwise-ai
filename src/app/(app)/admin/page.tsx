/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, react-hooks/set-state-in-effect, react/no-unescaped-entities */
'use client';

import { useEffect, useState, useMemo } from 'react';
import { 
  Users, LineChart, Activity, FileText, Award, Sparkles, 
  Search, Filter, Shield, UserMinus, UserPlus, Trash2, 
  Loader2, ChevronLeft, ChevronRight, X, FileClock, 
  AlertTriangle, ArrowUpDown, Calendar
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function AdminPanel() {
  const supabase = createClient();

  // State Management
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'logs'>('overview');
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalAssessments: 0,
    totalDailyLogs: 0,
    totalReports: 0,
    totalChallengesCompleted: 0,
    totalAIRequests: 0,
  });

  // Table Controls
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'user' | 'admin'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'disabled'>('all');
  const [sortField, setSortField] = useState<'full_name' | 'email' | 'role' | 'created_at'>('full_name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Modals & Details
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [userAssessments, setUserAssessments] = useState<any[]>([]);
  const [userDailyLogs, setUserDailyLogs] = useState<any[]>([]);
  const [userAIRequests, setUserAIRequests] = useState<any[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [actionModal, setActionModal] = useState<{
    type: 'promote' | 'demote' | 'disable' | 'enable' | 'delete' | null;
    user: any | null;
  }>({ type: null, user: null });
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Load Data
  const loadAdminData = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {

      // ── 1. PROFILES (required — users table) ─────────────────────────────
      const { data: profiles, error: profilesErr } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesErr) {
        console.error('Admin query failed [profiles]:', profilesErr);
        throw new Error(`profiles: ${profilesErr.message}`);
      }

      // ── 2. ASSESSMENTS ────────────────────────────────────────────────────
      let assessments: any[] = [];
      const { data: aData, error: asstsErr } = await supabase
        .from('assessments')
        .select('id, user_id, total_emissions, scope_1, scope_2, scope_3, created_at, updated_at');
      if (asstsErr) {
        console.error('Admin query failed [assessments]:', asstsErr);
      } else {
        assessments = aData || [];
      }

      // ── 3. DAILY FOOTPRINTS ───────────────────────────────────────────────
      let dailyLogs: any[] = [];
      const { data: dData, error: logsErr } = await supabase
        .from('daily_footprints')
        .select('id, user_id, log_date, total_emissions, created_at, updated_at');
      if (logsErr) {
        console.error('Admin query failed [daily_footprints]:', logsErr);
      } else {
        dailyLogs = dData || [];
      }

      // ── 4. REPORTS ────────────────────────────────────────────────────────
      let reports: any[] = [];
      const { data: rData, error: reportsErr } = await supabase
        .from('reports')
        .select('id, user_id, report_type, total_emissions, created_at');
      if (reportsErr) {
        console.error('Admin query failed [reports]:', reportsErr);
      } else {
        reports = rData || [];
      }

      // ── 5. CHALLENGES (optional — may not have admin RLS yet) ────────────
      let challenges: any[] = [];
      const { data: cData, error: challengesErr } = await supabase
        .from('challenges')
        .select('id, user_id, is_completed');
      if (challengesErr) {
        console.warn('Admin query warning [challenges] — table may lack admin RLS policy:', challengesErr.message);
      } else {
        challenges = cData || [];
      }

      // ── 6. AI INSIGHT REQUESTS (optional — table may not exist yet) ──────
      let aiRequests: any[] = [];
      const { data: aiData, error: aiErr } = await supabase
        .from('ai_insight_requests')
        .select('id, user_id, prompt, created_at');
      if (aiErr) {
        console.warn('Admin query warning [ai_insight_requests] — table may not exist yet:', aiErr.message);
      } else {
        aiRequests = aiData || [];
      }

      // ── 7. ADMIN ACTIVITY LOGS (optional) ────────────────────────────────
      let activityLogs: any[] = [];
      const { data: logData, error: activityErr } = await supabase
        .from('admin_activity_logs')
        .select('*')
        .order('created_at', { ascending: false });
      if (activityErr) {
        console.warn('Admin query warning [admin_activity_logs] — table may not exist yet:', activityErr.message);
      } else {
        activityLogs = logData || [];
      }

      // ── 2. COMPUTE STATISTICS ─────────────────────────────────────────────
      setStats({
        totalUsers: profiles.length,
        totalAssessments: assessments.length,
        totalDailyLogs: dailyLogs.length,
        totalReports: reports.length,
        totalChallengesCompleted: challenges.filter((c: any) => c.is_completed).length,
        totalAIRequests: aiRequests.length,
      });

      // ── 3. PROCESS USER RECORDS WITH PER-USER COUNTS ──────────────────────
      const processedUsers = profiles.map((p: any) => {
        const userAssts = assessments.filter((a: any) => a.user_id === p.id);
        const userLogs = dailyLogs.filter((d: any) => d.user_id === p.id);

        const activityDates = [
          new Date(p.updated_at || p.created_at).getTime(),
          ...userAssts.map((a: any) => new Date(a.updated_at || a.created_at).getTime()),
          ...userLogs.map((l: any) => new Date(l.updated_at || l.created_at).getTime()),
        ].filter(d => !isNaN(d));

        const lastActivity = activityDates.length > 0
          ? new Date(Math.max(...activityDates))
          : new Date(p.created_at);

        return {
          ...p,
          assessmentsCount: userAssts.length,
          dailyLogsCount: userLogs.length,
          lastActivity: lastActivity.toISOString(),
          rawAssessments: userAssts,
          rawDailyLogs: userLogs,
        };
      });

      setUsers(processedUsers);
      setLogs(activityLogs);

    } catch (err: any) {
      console.error('Admin panel critical load error:', err);
      setErrorMsg(err.message || 'Unable to query admin database records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  // Handle Sort
  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Filter & Search Logic
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch = 
        (u.full_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (u.email?.toLowerCase() || '').includes(searchTerm.toLowerCase());
      
      const matchesRole = roleFilter === 'all' ? true : u.role === roleFilter;
      const matchesStatus = statusFilter === 'all' ? true : (statusFilter === 'disabled' ? u.is_disabled : !u.is_disabled);

      return matchesSearch && matchesRole && matchesStatus;
    }).sort((a, b) => {
      let valA = a[sortField] || '';
      let valB = b[sortField] || '';

      if (sortField === 'created_at') {
        return sortOrder === 'asc' 
          ? new Date(valA).getTime() - new Date(valB).getTime()
          : new Date(valB).getTime() - new Date(valA).getTime();
      }

      valA = valA.toString().toLowerCase();
      valB = valB.toString().toLowerCase();

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [users, searchTerm, roleFilter, statusFilter, sortField, sortOrder]);

  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / itemsPerPage));
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstItem, indexOfLastItem);

  // View User Details
  const handleViewDetails = async (user: any) => {
    setSelectedUser(user);
    setLoadingDetails(true);
    try {
      // Fetch details
      const { data: assts } = await supabase.from('assessments').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
      const { data: logz } = await supabase.from('daily_footprints').select('*').eq('user_id', user.id).order('log_date', { ascending: false });
      const { data: aiQueries } = await supabase.from('ai_insight_requests').select('*').eq('user_id', user.id).order('created_at', { ascending: false });

      setUserAssessments(assts || []);
      setUserDailyLogs(logz || []);
      setUserAIRequests(aiQueries || []);

      // Log the view action
      await fetch('/api/admin/user-actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'log_view', targetUserId: user.id }),
      });
    } catch (err) {
      console.error('Failed to load user details:', err);
    } finally {
      setLoadingDetails(false);
    }
  };

  // Handle Admin Action Execution
  const executeAdminAction = async () => {
    if (!actionModal.type || !actionModal.user) return;
    setActionLoading(true);
    setErrorMsg(null);

    try {
      const response = await fetch('/api/admin/user-actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: actionModal.type, 
          targetUserId: actionModal.user.id 
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Action execution failed.');

      // Refresh list
      await loadAdminData();
      setActionModal({ type: null, user: null });
      if (selectedUser?.id === actionModal.user.id) {
        setSelectedUser(null);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to complete administrative action.');
    } finally {
      setActionLoading(false);
    }
  };

  const getLogColor = (action: string) => {
    if (action.includes('PROMOTED')) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (action.includes('DEMOTED')) return 'text-amber-600 bg-amber-50 border-amber-200';
    if (action.includes('DISABLED')) return 'text-rose-600 bg-rose-50 border-rose-200';
    if (action.includes('DELETED')) return 'text-red-700 bg-red-50 border-red-200';
    return 'text-slate-600 bg-slate-50 border-slate-200';
  };

  return (
    <div className="mx-auto flex min-h-[calc(100vh-6rem)] max-w-7xl flex-col px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <header className="mb-8 flex flex-col justify-between gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-[#2563EB]">Admin Operations</p>
          <h1 className="mt-2 font-serif text-4xl font-bold tracking-normal text-[#0F172A]">Admin Panel</h1>
          <p className="mt-2 text-sm leading-6 text-slate-700">
            Monitor CarbonWise users, view carbon assessment metrics, and execute moderation tasks securely.
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={loadAdminData} 
            disabled={loading}
            className="rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 h-10 px-4 text-sm font-bold flex gap-2 items-center"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Activity className="h-4 w-4" />}
            Refresh Data
          </Button>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 mb-8 overflow-x-auto gap-2">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-4 px-4 text-sm font-bold border-b-2 transition ${activeTab === 'overview' ? 'border-[#2563EB] text-[#2563EB]' : 'border-transparent text-slate-600 hover:text-[#0F172A]'}`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`pb-4 px-4 text-sm font-bold border-b-2 transition ${activeTab === 'users' ? 'border-[#2563EB] text-[#2563EB]' : 'border-transparent text-slate-600 hover:text-[#0F172A]'}`}
        >
          User Management
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`pb-4 px-4 text-sm font-bold border-b-2 transition ${activeTab === 'logs' ? 'border-[#2563EB] text-[#2563EB]' : 'border-transparent text-slate-600 hover:text-[#0F172A]'}`}
        >
          Admin Activity Logs
        </button>
      </div>

      {errorMsg && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900 animate-in fade-in duration-200">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />
          <div className="flex-1">
            <h5 className="font-bold text-rose-950">Database Operation Error</h5>
            <p className="mt-1 text-xs leading-5 text-rose-800">{errorMsg}</p>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-rose-500 hover:text-rose-700">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col flex-1 items-center justify-center py-20 gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-[#2563EB]" />
          <p className="text-sm font-bold text-slate-600">Syncing carbon dashboard...</p>
        </div>
      ) : (
        <>
          {/* Tab 1: Overview Dashboard */}
          {activeTab === 'overview' && (
            <div className="space-y-8 animate-in fade-in duration-150">
              <div className="grid gap-5 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
                {/* Stats cards */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                  <div className="flex justify-between items-start mb-3">
                    <span className="p-2.5 bg-blue-50 text-blue-600 rounded-xl"><Users className="h-5 w-5" /></span>
                  </div>
                  <div>
                    <p className="text-2xl font-black text-slate-900">{stats.totalUsers}</p>
                    <p className="text-xs font-semibold text-slate-500">Total Users</p>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                  <div className="flex justify-between items-start mb-3">
                    <span className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl"><LineChart className="h-5 w-5" /></span>
                  </div>
                  <div>
                    <p className="text-2xl font-black text-slate-900">{stats.totalAssessments}</p>
                    <p className="text-xs font-semibold text-slate-500">Assessments</p>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                  <div className="flex justify-between items-start mb-3">
                    <span className="p-2.5 bg-orange-50 text-orange-600 rounded-xl"><Activity className="h-5 w-5" /></span>
                  </div>
                  <div>
                    <p className="text-2xl font-black text-slate-900">{stats.totalDailyLogs}</p>
                    <p className="text-xs font-semibold text-slate-500">Daily Logs</p>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                  <div className="flex justify-between items-start mb-3">
                    <span className="p-2.5 bg-purple-50 text-purple-600 rounded-xl"><FileText className="h-5 w-5" /></span>
                  </div>
                  <div>
                    <p className="text-2xl font-black text-slate-900">{stats.totalReports}</p>
                    <p className="text-xs font-semibold text-slate-500">Reports Generated</p>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                  <div className="flex justify-between items-start mb-3">
                    <span className="p-2.5 bg-yellow-50 text-yellow-600 rounded-xl"><Award className="h-5 w-5" /></span>
                  </div>
                  <div>
                    <p className="text-2xl font-black text-slate-900">{stats.totalChallengesCompleted}</p>
                    <p className="text-xs font-semibold text-slate-500">Missions Completed</p>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                  <div className="flex justify-between items-start mb-3">
                    <span className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl"><Sparkles className="h-5 w-5" /></span>
                  </div>
                  <div>
                    <p className="text-2xl font-black text-slate-900">{stats.totalAIRequests}</p>
                    <p className="text-xs font-semibold text-slate-500">AI Consultations</p>
                  </div>
                </div>
              </div>

              {/* Quick Summary Section */}
              <div className="grid gap-6 md:grid-cols-3">
                <div className="md:col-span-2 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
                  <h3 className="font-serif text-xl font-bold text-[#0F172A] mb-4">Platform Growth & Metrics</h3>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="border border-slate-100 rounded-2xl p-4 bg-slate-50/50">
                      <p className="text-xs font-semibold text-slate-500 mb-1">Audit Engagement Rate</p>
                      <p className="text-lg font-extrabold text-[#0F172A]">
                        {stats.totalUsers > 0 ? ((stats.totalAssessments / stats.totalUsers) * 100).toFixed(0) : 0}%
                      </p>
                      <span className="text-[10px] text-slate-500">Assessments per user</span>
                    </div>

                    <div className="border border-slate-100 rounded-2xl p-4 bg-slate-50/50">
                      <p className="text-xs font-semibold text-slate-500 mb-1">Tracker Activity Index</p>
                      <p className="text-lg font-extrabold text-[#0F172A]">
                        {stats.totalUsers > 0 ? (stats.totalDailyLogs / stats.totalUsers).toFixed(1) : 0}
                      </p>
                      <span className="text-[10px] text-slate-500">Logs per registered user</span>
                    </div>

                    <div className="border border-slate-100 rounded-2xl p-4 bg-slate-50/50">
                      <p className="text-xs font-semibold text-slate-500 mb-1">AI Consultation Index</p>
                      <p className="text-lg font-extrabold text-[#0F172A]">
                        {stats.totalUsers > 0 ? (stats.totalAIRequests / stats.totalUsers).toFixed(1) : 0}
                      </p>
                      <span className="text-[10px] text-slate-500">Insight prompts per user</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col">
                  <h3 className="font-serif text-xl font-bold text-[#0F172A] mb-3 flex gap-2 items-center">
                    <FileClock className="h-5 w-5 text-slate-500" /> Recent Activity Log
                  </h3>
                  <div className="flex-1 overflow-y-auto space-y-3 max-h-[220px] pr-1">
                    {logs.slice(0, 4).map((log) => (
                      <div key={log.id} className="text-xs border-b border-slate-100 pb-2">
                        <div className="flex justify-between items-center mb-1">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${getLogColor(log.action)}`}>
                            {log.action.replace('USER_', '')}
                          </span>
                          <span className="text-slate-400">{new Date(log.created_at).toLocaleDateString()}</span>
                        </div>
                        <p className="text-slate-700">Target ID: <code className="bg-slate-50 px-1 py-0.5 rounded font-mono">{log.target_user_id?.slice(0, 8)}...</code></p>
                      </div>
                    ))}
                    {logs.length === 0 && (
                      <p className="text-slate-500 text-xs py-4 text-center">No moderation logs available.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: User Management Table */}
          {activeTab === 'users' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* Filter Panel */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-slate-50/50 border border-slate-200 rounded-2xl p-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                  <Input
                    value={searchTerm}
                    onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                    placeholder="Search users by name or email..."
                    className="pl-9 h-11 border-slate-300 rounded-xl bg-white focus-visible:ring-blue-600"
                  />
                </div>
                <div className="flex flex-wrap gap-2 items-center">
                  <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs">
                    <Filter className="h-3.5 w-3.5 text-slate-500" />
                    <span className="font-bold text-slate-600">Role:</span>
                    <select 
                      value={roleFilter} 
                      onChange={(e: any) => { setRoleFilter(e.target.value); setCurrentPage(1); }}
                      className="border-none font-bold text-slate-800 bg-transparent focus:ring-0 p-0 cursor-pointer"
                    >
                      <option value="all">All Roles</option>
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs">
                    <Shield className="h-3.5 w-3.5 text-slate-500" />
                    <span className="font-bold text-slate-600">Status:</span>
                    <select 
                      value={statusFilter} 
                      onChange={(e: any) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                      className="border-none font-bold text-slate-800 bg-transparent focus:ring-0 p-0 cursor-pointer"
                    >
                      <option value="all">All States</option>
                      <option value="active">Active</option>
                      <option value="disabled">Disabled</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Users Table */}
              <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
                <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                  <thead className="bg-slate-50/70 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-4 cursor-pointer hover:bg-slate-100/50" onClick={() => handleSort('full_name')}>
                        <span className="flex items-center gap-1.5">Full Name <ArrowUpDown className="h-3.5 w-3.5" /></span>
                      </th>
                      <th className="px-6 py-4 cursor-pointer hover:bg-slate-100/50" onClick={() => handleSort('email')}>
                        <span className="flex items-center gap-1.5">Email <ArrowUpDown className="h-3.5 w-3.5" /></span>
                      </th>
                      <th className="px-6 py-4 cursor-pointer hover:bg-slate-100/50" onClick={() => handleSort('role')}>
                        <span className="flex items-center gap-1.5">Role <ArrowUpDown className="h-3.5 w-3.5" /></span>
                      </th>
                      <th className="px-6 py-4 cursor-pointer hover:bg-slate-100/50" onClick={() => handleSort('created_at')}>
                        <span className="flex items-center gap-1.5">Joined <ArrowUpDown className="h-3.5 w-3.5" /></span>
                      </th>
                      <th className="px-6 py-4 text-center">Assessments</th>
                      <th className="px-6 py-4 text-center">Daily Logs</th>
                      <th className="px-6 py-4 text-center">Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {currentUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-slate-50/50 transition">
                        <td className="px-6 py-4 font-bold text-slate-900">{user.full_name || 'CarbonWise User'}</td>
                        <td className="px-6 py-4 text-slate-600">{user.email}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${user.role === 'admin' ? 'bg-blue-50 text-[#2563EB]' : 'bg-slate-100 text-slate-600'}`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-500 text-xs">
                          {new Date(user.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                        </td>
                        <td className="px-6 py-4 text-center font-bold text-slate-800">{user.assessmentsCount}</td>
                        <td className="px-6 py-4 text-center font-bold text-slate-800">{user.dailyLogsCount}</td>
                        <td className="px-6 py-4 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${user.is_disabled ? 'bg-rose-50 text-rose-600 border border-rose-200' : 'bg-green-50 text-green-600 border border-green-200'}`}>
                            {user.is_disabled ? 'Disabled' : 'Active'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-1">
                            <Button 
                              onClick={() => handleViewDetails(user)}
                              className="rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 h-8 px-2 text-xs font-bold"
                            >
                              Inspect
                            </Button>
                            
                            {user.role === 'admin' ? (
                              <Button 
                                onClick={() => setActionModal({ type: 'demote', user: user })}
                                className="rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 h-8 px-2 text-xs font-bold"
                              >
                                Demote
                              </Button>
                            ) : (
                              <Button 
                                onClick={() => setActionModal({ type: 'promote', user: user })}
                                className="rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 h-8 px-2 text-xs font-bold"
                              >
                                Promote
                              </Button>
                            )}

                            {user.is_disabled ? (
                              <Button 
                                onClick={() => setActionModal({ type: 'enable', user: user })}
                                className="rounded-lg bg-green-50 hover:bg-green-100 text-green-700 h-8 px-2 text-xs font-bold"
                              >
                                Enable
                              </Button>
                            ) : (
                              <Button 
                                onClick={() => setActionModal({ type: 'disable', user: user })}
                                className="rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 h-8 px-2 text-xs font-bold"
                              >
                                Disable
                              </Button>
                            )}

                            <Button 
                              onClick={() => setActionModal({ type: 'delete', user: user })}
                              className="rounded-lg bg-red-50 hover:bg-red-100 text-red-700 h-8 px-2 text-xs font-bold"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredUsers.length === 0 && (
                      <tr>
                        <td colSpan={8} className="px-6 py-12 text-center text-slate-500 font-medium">
                          No users found matching search query and filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-xs text-slate-500 font-bold">
                    Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredUsers.length)} of {filteredUsers.length} users
                  </p>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 h-9 px-3 text-xs font-bold flex gap-1 items-center"
                    >
                      <ChevronLeft className="h-4 w-4" /> Prev
                    </Button>
                    <span className="flex items-center px-3 text-xs font-bold text-slate-700">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 h-9 px-3 text-xs font-bold flex gap-1 items-center"
                    >
                      Next <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Activity Logs */}
          {activeTab === 'logs' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                  <thead className="bg-slate-50/70 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-4">Timestamp</th>
                      <th className="px-6 py-4">Admin ID</th>
                      <th className="px-6 py-4">Action Type</th>
                      <th className="px-6 py-4">Target User ID</th>
                      <th className="px-6 py-4">Details / Metadata</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {logs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/50 transition">
                        <td className="px-6 py-4 text-slate-500 text-xs font-mono">
                          {new Date(log.created_at).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 font-mono text-xs text-slate-600">{log.admin_id}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded text-xs font-bold border ${getLogColor(log.action)}`}>
                            {log.action}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-mono text-xs text-slate-600">{log.target_user_id || 'N/A'}</td>
                        <td className="px-6 py-4 text-slate-500 text-xs">
                          {log.metadata ? JSON.stringify(log.metadata) : '{}'}
                        </td>
                      </tr>
                    ))}
                    {logs.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-slate-500 font-medium">
                          No audit activity logs found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* User Details Drawer/Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-4xl max-h-[85vh] overflow-y-auto bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 md:p-8 flex flex-col animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex justify-between items-start border-b border-slate-100 pb-4 mb-6">
              <div>
                <span className="text-xs font-bold uppercase tracking-wide text-blue-600">User Audit Inspect</span>
                <h2 className="text-2xl font-serif font-bold text-slate-900 mt-1">{selectedUser.full_name || 'CarbonWise User'}</h2>
                <p className="text-slate-500 text-xs mt-1">ID: <code className="bg-slate-50 px-1 py-0.5 rounded font-mono">{selectedUser.id}</code></p>
              </div>
              <button 
                onClick={() => { setSelectedUser(null); setUserAssessments([]); setUserDailyLogs([]); setUserAIRequests([]); }}
                className="p-1 rounded-lg bg-slate-100 text-slate-500 hover:text-slate-700 hover:bg-slate-200 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {loadingDetails ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-[#2563EB]" />
                <p className="text-xs font-bold text-slate-500">Querying user audit logs...</p>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-3">
                {/* Profile Card */}
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 flex flex-col justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm mb-4 border-b border-slate-200/60 pb-2">Profile Card</h4>
                    <div className="space-y-3.5 text-xs">
                      <div>
                        <span className="block text-slate-400 font-semibold mb-1">Email Address</span>
                        <span className="font-bold text-slate-800">{selectedUser.email}</span>
                      </div>
                      <div>
                        <span className="block text-slate-400 font-semibold mb-1">Account Role</span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${selectedUser.role === 'admin' ? 'bg-blue-50 text-[#2563EB]' : 'bg-slate-200 text-slate-700'}`}>
                          {selectedUser.role}
                        </span>
                      </div>
                      <div>
                        <span className="block text-slate-400 font-semibold mb-1">Moderation Status</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${selectedUser.is_disabled ? 'bg-rose-50 text-rose-600 border border-rose-200' : 'bg-green-50 text-green-600 border border-green-200'}`}>
                          {selectedUser.is_disabled ? 'Disabled / Banned' : 'Active'}
                        </span>
                      </div>
                      <div className="flex gap-1.5 items-center">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        <div>
                          <span className="block text-slate-400 font-semibold">Joined Platform</span>
                          <span className="font-bold text-slate-700">{new Date(selectedUser.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions inside detailed view */}
                  <div className="mt-6 border-t border-slate-200/60 pt-4 space-y-2">
                    {selectedUser.role === 'admin' ? (
                      <Button 
                        onClick={() => setActionModal({ type: 'demote', user: selectedUser })}
                        className="w-full rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 h-9 text-xs font-bold"
                      >
                        Demote to User
                      </Button>
                    ) : (
                      <Button 
                        onClick={() => setActionModal({ type: 'promote', user: selectedUser })}
                        className="w-full rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 h-9 text-xs font-bold"
                      >
                        Promote to Admin
                      </Button>
                    )}

                    {selectedUser.is_disabled ? (
                      <Button 
                        onClick={() => setActionModal({ type: 'enable', user: selectedUser })}
                        className="w-full rounded-xl bg-green-50 hover:bg-green-100 text-green-700 h-9 text-xs font-bold"
                      >
                        Re-Enable Account
                      </Button>
                    ) : (
                      <Button 
                        onClick={() => setActionModal({ type: 'disable', user: selectedUser })}
                        className="w-full rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 h-9 text-xs font-bold"
                      >
                        Disable User Account
                      </Button>
                    )}
                  </div>
                </div>

                {/* Audit Content lists */}
                <div className="md:col-span-2 space-y-6">
                  {/* Carbon Footprint Baseline Trends */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-5">
                    <h4 className="font-bold text-slate-900 text-sm mb-3 flex items-center gap-1.5"><LineChart className="h-4 w-4 text-[#2563EB]" /> Carbon Footprint Trends</h4>
                    {userAssessments.length > 0 ? (
                      <div className="grid gap-3 sm:grid-cols-4">
                        <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-center">
                          <p className="text-xs font-bold text-slate-500">Total Emissions</p>
                          <p className="text-base font-extrabold text-[#0F172A] mt-1">{Number(userAssessments[0].total_emissions).toFixed(0)} kg</p>
                        </div>
                        <div className="bg-blue-50/30 border border-blue-100/50 rounded-xl p-3 text-center">
                          <p className="text-xs font-bold text-blue-700">Scope 1 (Direct)</p>
                          <p className="text-sm font-extrabold text-blue-900 mt-1">{Number(userAssessments[0].scope_1 || 0).toFixed(0)} kg</p>
                        </div>
                        <div className="bg-amber-50/30 border border-amber-100/50 rounded-xl p-3 text-center">
                          <p className="text-xs font-bold text-amber-700">Scope 2 (Energy)</p>
                          <p className="text-sm font-extrabold text-amber-900 mt-1">{Number(userAssessments[0].scope_2 || 0).toFixed(0)} kg</p>
                        </div>
                        <div className="bg-purple-50/30 border border-purple-100/50 rounded-xl p-3 text-center">
                          <p className="text-xs font-bold text-purple-700">Scope 3 (Other)</p>
                          <p className="text-sm font-extrabold text-purple-900 mt-1">{Number(userAssessments[0].scope_3 || 0).toFixed(0)} kg</p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 italic">No baseline carbon assessment audit completed yet.</p>
                    )}
                  </div>

                  {/* Recent History Tab contents */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-5">
                    <h4 className="font-bold text-slate-900 text-sm mb-3 flex items-center gap-1.5"><Activity className="h-4 w-4 text-emerald-600" /> Recent Daily Tracker Logs</h4>
                    <div className="overflow-y-auto max-h-[150px] space-y-2 pr-1">
                      {userDailyLogs.map((log) => (
                        <div key={log.id} className="flex justify-between items-center text-xs border-b border-slate-100 pb-2">
                          <span className="font-bold text-slate-700">{log.log_date}</span>
                          <span className="text-slate-500 font-mono">Emissions: {Number(log.total_emissions).toFixed(1)} kg CO2e</span>
                        </div>
                      ))}
                      {userDailyLogs.length === 0 && (
                        <p className="text-xs text-slate-500 italic py-2">No daily tracker entries logged.</p>
                      )}
                    </div>
                  </div>

                  {/* AI Insights usage */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-5">
                    <h4 className="font-bold text-slate-900 text-sm mb-3 flex items-center gap-1.5"><Sparkles className="h-4 w-4 text-indigo-600" /> AI Insights Consultations ({userAIRequests.length})</h4>
                    <div className="overflow-y-auto max-h-[150px] space-y-2 pr-1">
                      {userAIRequests.map((req) => (
                        <div key={req.id} className="text-xs border-b border-slate-100 pb-2">
                          <p className="text-slate-400 text-[10px]">{new Date(req.created_at).toLocaleString()}</p>
                          <p className="text-slate-700 mt-0.5 italic">"{req.prompt}"</p>
                        </div>
                      ))}
                      {userAIRequests.length === 0 && (
                        <p className="text-xs text-slate-500 italic py-2">No AI consultation questions asked.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Confirmation Actions Dialog Modal */}
      {actionModal.type && actionModal.user && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 animate-in zoom-in-95 duration-150">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 mb-4">
              <AlertTriangle className="h-6 w-6" />
            </div>
            
            <h3 className="text-lg font-serif font-bold text-slate-900">
              Confirm Moderation Action
            </h3>
            
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Are you sure you want to <strong className="text-slate-900">{actionModal.type.toUpperCase()}</strong> the account of{' '}
              <strong>{actionModal.user.full_name || actionModal.user.email}</strong>?
              {actionModal.type === 'delete' && (
                <span className="block mt-2 text-rose-700 font-bold text-xs bg-rose-50 border border-rose-100 rounded-xl p-2">
                  WARNING: This will permanently delete the user's login credentials and wipe all carbon footprint logs. This action is irreversible.
                </span>
              )}
            </p>

            <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-4">
              <Button
                type="button"
                onClick={() => setActionModal({ type: null, user: null })}
                disabled={actionLoading}
                className="rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 h-10 px-4 text-xs font-bold"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={executeAdminAction}
                disabled={actionLoading}
                className={`rounded-xl h-10 px-4 text-xs font-bold text-white flex gap-1.5 items-center ${
                  actionModal.type === 'delete' ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {actionLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Confirm Action
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
