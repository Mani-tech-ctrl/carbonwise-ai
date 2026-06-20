/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/set-state-in-effect */
"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Target, Flame, Leaf, User, Activity, Award, Calendar, Loader2, Edit3, X, Save, AlertCircle, CheckCircle2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function Profile() {
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState({
    totalAssessments: 0,
    latestEmissions: 0,
    carbonReduction: 0,
  });
  const [timeline, setTimeline] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  // Edit form states
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editFullName, setEditFullName] = useState('');
  const [editDisplayName, setEditDisplayName] = useState('');
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  async function loadProfile() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      // Select only existing columns from the profiles table
      const { data: profileData } = await supabase.from('profiles').select('full_name, created_at, sustainability_score').eq('id', user.id).single();
      if (profileData) {
        setProfile({
          ...profileData,
          display_name: user.user_metadata?.display_name || '',
          email: user.email,
        });
        setEditFullName(profileData.full_name || '');
        setEditDisplayName(user.user_metadata?.display_name || '');
      }

      const { data: assessments } = await supabase.from('assessments').select('*').eq('user_id', user.id).order('created_at', { ascending: true });
      const { data: dailyLogs } = await supabase.from('daily_footprints').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
      const { data: challenges } = await supabase.from('challenges').select('*').eq('user_id', user.id).eq('is_completed', true);

      // Calculate stats
      if (assessments && assessments.length > 0) {
        const latest = assessments[assessments.length - 1];
        const first = assessments[0];
        
        let reduction = 0;
        if (assessments.length > 1 && first.total_emissions > 0) {
          reduction = ((first.total_emissions - latest.total_emissions) / first.total_emissions) * 100;
        }

        setStats({
          totalAssessments: assessments.length,
          latestEmissions: latest.total_emissions,
          carbonReduction: reduction,
        });
      }

      // Build Chronological Timeline Events
      const events: any[] = [];
      
      if (assessments) {
        assessments.forEach(a => {
          events.push({
            id: a.id,
            date: new Date(a.created_at),
            type: 'assessment',
            label: 'Baseline Assessment Created',
            description: `Annualized footprint baseline computed at ${Math.round(a.total_emissions)} kg CO₂e.`
          });
        });
      }

      if (dailyLogs) {
        dailyLogs.forEach(d => {
          events.push({
            id: d.id,
            date: new Date(d.created_at || d.log_date),
            type: 'daily',
            label: 'Daily Carbon Log Saved',
            description: `Logged daily footprint activities. Total emissions computed: ${Number(d.total_emissions).toFixed(1)} kg CO₂e.`
          });
        });
      }

      if (challenges) {
        challenges.forEach(c => {
          events.push({
            id: c.id,
            date: new Date(c.updated_at || c.created_at),
            type: 'challenge',
            label: 'Carbon Challenge Completed',
            description: `Successfully accomplished the challenge: "${c.title}" for score points.`
          });
        });
      }

      // Sort timeline events: newest first
      events.sort((a, b) => b.date.getTime() - a.date.getTime());
      setTimeline(events.slice(0, 10)); // Display recent 10 events
    }
    setLoading(false);
  }

  useEffect(() => {
    loadProfile();
  }, [supabase]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editFullName.trim()) {
      setErrorMsg("Full Name is required.");
      return;
    }
    setSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No authenticated session found.");

      // 1. Update profiles table using existing columns only
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: editFullName.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // 2. Save display_name to user metadata to avoid database schema alteration
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          full_name: editFullName.trim(),
          display_name: editDisplayName.trim() || null
        }
      });

      if (authError) throw authError;

      setSuccessMsg("Profile updated successfully!");
      
      // Dispatch custom event to update Navbar name
      window.dispatchEvent(new Event('profile-updated'));

      // Reload local profile state
      await loadProfile();

      setTimeout(() => {
        setSuccessMsg(null);
        setIsEditOpen(false);
      }, 1500);

    } catch (err: any) {
      console.error("Error updating profile:", err);
      setErrorMsg(err.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setIsEditOpen(false);
    setErrorMsg(null);
    setSuccessMsg(null);
    if (profile) {
      setEditFullName(profile.full_name || '');
      setEditDisplayName(profile.display_name || '');
    }
  };

  if (loading) {
    return (
      <div className="h-[calc(100vh-12rem)] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
      </div>
    );
  }

  const name = profile?.full_name || 'CarbonWise User';
  const displayName = profile?.display_name || '';
  const email = profile?.email || '';
  const score = profile?.sustainability_score || 0;
  const joinDate = profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'recently';

  return (
    <div className="space-y-12 animate-in fade-in duration-300 py-4 text-slate-800 font-sans">
      
      {/* Profile Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pb-6 border-b border-slate-200">
        <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
          <div className="w-20 h-20 bg-gradient-to-br from-[#0F172A] to-slate-800 rounded-2xl flex items-center justify-center shadow-sm text-white">
            <User className="w-10 h-10" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
              User Account
            </span>
            <h1 className="text-page text-[#0F172A] mt-1 font-serif">
              {displayName || name}
            </h1>
            {displayName && (
              <p className="text-xs font-bold text-slate-500 mt-1">Full Name: {name}</p>
            )}
            <p className="text-body text-slate-705 mt-1.5 font-medium">{email}</p>
            <div className="mt-3 flex justify-center sm:justify-start gap-2">
              <span className="px-3.5 py-1.5 bg-[#FAFAF8] border border-slate-200 text-slate-500 text-xs rounded-full font-bold uppercase tracking-wide">Joined {joinDate}</span>
            </div>
          </div>
        </div>
        <div className="flex-shrink-0">
          <Button onClick={() => setIsEditOpen(true)} className="bg-[#0F172A] hover:bg-[#1E293B] text-white font-semibold h-11 px-6 rounded-xl text-sm cursor-pointer shadow-sm flex items-center gap-2">
            <Edit3 className="w-4 h-4" /> Edit Profile
          </Button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
        
        {/* Sustainability Score (Slate premium card) */}
        <Card className="bg-[#0F172A] text-white border-0 shadow-md rounded-2xl relative overflow-hidden min-h-[120px] flex flex-col justify-between p-6">
          <div className="absolute -right-6 -bottom-6 w-20 h-20 bg-white/10 rounded-full opacity-20 blur-xl"></div>
          <div className="flex justify-between items-center w-full">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">Sustainability Score</span>
            <Leaf className="w-4.5 h-4.5 text-blue-400" />
          </div>
          <div className="text-3xl font-black mt-4 font-mono">{score} <span className="text-xs font-bold text-slate-400">/ 100</span></div>
        </Card>

        {/* Total Assessments */}
        <Card className="shadow-sm border border-slate-200 rounded-2xl bg-white p-6 flex flex-col justify-between min-h-[120px]">
          <div className="flex justify-between items-center w-full">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Assessments</span>
            <Activity className="w-4.5 h-4.5 text-blue-600" />
          </div>
          <div className="text-3xl font-bold text-[#0F172A] mt-4 font-mono">{stats.totalAssessments}</div>
        </Card>

        {/* Latest Emissions */}
        <Card className="shadow-sm border border-slate-200 rounded-2xl bg-white p-6 flex flex-col justify-between min-h-[120px]">
          <div className="flex justify-between items-center w-full">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Latest Emissions</span>
            <Flame className="w-4.5 h-4.5 text-amber-500" />
          </div>
          <div className="text-3xl font-bold text-[#0F172A] mt-4 font-mono">{(stats.latestEmissions / 1000).toFixed(1)} <span className="text-xs font-bold text-slate-500">Tons</span></div>
        </Card>

        {/* Carbon Reduction */}
        <Card className="shadow-sm border border-slate-200 rounded-2xl bg-white p-6 flex flex-col justify-between min-h-[120px]">
          <div className="flex justify-between items-center w-full">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Reduction Margin</span>
            <Target className="w-4.5 h-4.5 text-blue-600" />
          </div>
          <div className="text-3xl font-bold text-[#0F172A] mt-4 font-mono">
            {stats.carbonReduction > 0 ? `-${stats.carbonReduction.toFixed(1)}%` : `${stats.carbonReduction.toFixed(1)}%`}
          </div>
        </Card>
      </div>

      {/* Activity Timeline Card */}
      <Card className="shadow-sm border border-slate-200 rounded-3xl bg-white overflow-hidden">
        <CardHeader className="border-b border-slate-100 bg-[#FAFAF8] py-5 px-8">
          <CardTitle className="text-card text-[#0F172A] font-sans font-semibold text-base">Activity Timeline</CardTitle>
        </CardHeader>
        <CardContent className="pt-6 px-8 pb-8">
          {timeline.length === 0 ? (
            <p className="text-xs text-slate-500 font-bold uppercase text-center py-8">No footprint activities logged in timeline.</p>
          ) : (
            <div className="relative border-l-2 border-slate-100 pl-6 ml-3 space-y-6">
              {timeline.map((event, idx) => (
                <div key={idx} className="relative">
                  {/* Timeline dot */}
                  <span className="absolute -left-[32px] top-1 h-5 w-5 bg-white border border-slate-200 rounded-full flex items-center justify-center shadow-sm z-10">
                    {event.type === 'assessment' && <Activity className="w-2.5 h-2.5 text-blue-600" />}
                    {event.type === 'daily' && <Calendar className="w-2.5 h-2.5 text-amber-500" />}
                    {event.type === 'challenge' && <Award className="w-2.5 h-2.5 text-blue-600" />}
                  </span>
                  <div>
                    <span className="text-xs font-bold text-slate-500 uppercase font-mono">
                      {event.date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} at {event.date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <h4 className="font-sans font-bold text-sm sm:text-base text-[#0F172A] mt-0.5">{event.label}</h4>
                    <p className="text-sm text-slate-600 leading-relaxed mt-1 font-medium">{event.description}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* EDIT PROFILE MODAL */}
      {isEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm animate-in fade-in duration-200" role="dialog" aria-modal="true">
          <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl border border-slate-200/80 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 p-6 bg-slate-50/50">
              <h3 className="font-serif text-lg font-bold text-[#0F172A]">Edit Profile Details</h3>
              <button 
                type="button" 
                onClick={handleClose} 
                className="rounded-full p-1.5 text-slate-500 hover:bg-slate-100 hover:text-[#0F172A] transition cursor-pointer"
                aria-label="Close modal"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>
            
            <form onSubmit={handleSaveProfile} className="p-6 space-y-4">
              {successMsg && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center gap-3 shadow-sm">
                  <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0" />
                  <span className="text-xs font-semibold text-slate-900">{successMsg}</span>
                </div>
              )}

              {errorMsg && (
                <div className="bg-red-50 border border-red-200 p-4 rounded-xl flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-red-800 text-xs">Update Failed</h4>
                    <p className="text-xs text-red-700 font-medium mt-0.5">{errorMsg}</p>
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label htmlFor="edit-email" className="text-xs font-bold text-slate-700 uppercase tracking-wide block">
                  Email Address (Read-only)
                </label>
                <Input
                  id="edit-email"
                  type="email"
                  disabled
                  value={email}
                  className="bg-slate-50 border-slate-200 text-slate-500 cursor-not-allowed font-medium rounded-xl h-11"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="edit-name" className="text-xs font-bold text-slate-700 uppercase tracking-wide block">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <Input
                  id="edit-name"
                  type="text"
                  required
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  className="bg-white border-slate-300 focus-visible:ring-blue-600 font-medium rounded-xl h-11 text-[#0F172A]"
                  placeholder="Jane Doe"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="edit-display-name" className="text-xs font-bold text-slate-700 uppercase tracking-wide block">
                  Display Name (Optional)
                </label>
                <Input
                  id="edit-display-name"
                  type="text"
                  value={editDisplayName}
                  onChange={(e) => setEditDisplayName(e.target.value)}
                  className="bg-white border-slate-300 focus-visible:ring-blue-600 font-medium rounded-xl h-11 text-[#0F172A]"
                  placeholder="Jane"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  className="border-slate-300 text-slate-800 hover:bg-slate-50 bg-white font-semibold rounded-xl h-11 text-xs cursor-pointer shadow-sm"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={saving}
                  className="bg-[#0F172A] hover:bg-[#1E293B] text-white font-semibold rounded-xl h-11 text-xs cursor-pointer shadow-sm flex items-center justify-center gap-1.5"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" /> Save Changes
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
