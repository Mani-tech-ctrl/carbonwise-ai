/* eslint-disable react/no-unescaped-entities */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Leaf, Droplets, Zap, CheckCircle2, Circle, Loader2, Sparkles, Award } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

const DEFAULT_CHALLENGES = [
  { title: 'Meatless Monday', description: 'Eat 100% plant-based for one full day.', points: 50, category: 'Diet' },
  { title: 'Public Transit Warrior', description: 'Take public transit to work for 3 consecutive days.', points: 150, category: 'Transport' },
  { title: 'Zero Waste Weekend', description: 'Generate less than 1kg of landfill waste over the weekend.', points: 200, category: 'Waste' },
  { title: 'Unplugged Evening', description: 'Turn off all electronic devices for 4 hours.', points: 100, category: 'Energy' },
  { title: 'Eco shopper', description: 'Buy items only from thrift shops or local sustainable farms.', points: 120, category: 'Shopping' }
];

export default function Challenges() {
  const [challenges, setChallenges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [completingId, setCompletingId] = useState<string | null>(null);
  const supabase = createClient();

  async function loadChallenges(uid: string) {
    const { data, error } = await supabase
      .from('challenges')
      .select('*')
      .eq('user_id', uid)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Failed to load challenges:', error);
      return;
    }

    if (!data || data.length === 0) {
      const rowsToInsert = DEFAULT_CHALLENGES.map(c => ({
        user_id: uid,
        title: c.title,
        description: c.description,
        points: c.points,
        is_completed: false
      }));

      const { error: seedError } = await supabase.from('challenges').insert(rowsToInsert);
      if (seedError) {
        console.error('Error seeding challenges:', seedError);
      } else {
        const { data: reloadedData } = await supabase
          .from('challenges')
          .select('*')
          .eq('user_id', uid)
          .order('created_at', { ascending: true });
        if (reloadedData) setChallenges(reloadedData);
      }
    } else {
      setChallenges(data);
    }
  }

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        await loadChallenges(user.id);
      }
      setLoading(false);
    }
    loadData();
  }, [supabase]);

  const handleMarkComplete = async (challengeId: string, pts: number) => {
    if (!userId) return;
    setCompletingId(challengeId);
    try {
      const { error } = await supabase
        .from('challenges')
        .update({ is_completed: true, completed_at: new Date().toISOString() })
        .eq('id', challengeId);

      if (error) throw error;

      const { data: profile } = await supabase.from('profiles').select('sustainability_score').eq('id', userId).single();
      const currentScore = profile?.sustainability_score || 50;
      const newScore = Math.min(100, currentScore + 2);
      await supabase.from('profiles').update({ sustainability_score: newScore }).eq('id', userId);

      await loadChallenges(userId);
    } catch (e) {
      console.error('Error completing challenge:', e);
    } finally {
      setCompletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="h-[calc(100vh-12rem)] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
      </div>
    );
  }

  const totalPoints = challenges
    .filter(c => c.is_completed)
    .reduce((sum, c) => sum + c.points, 0);

  const getCategoryIcon = (category: string) => {
    switch (category?.toLowerCase()) {
      case 'diet':
        return Leaf;
      case 'energy':
        return Zap;
      case 'waste':
        return Droplets;
      case 'transport':
        return Award;
      default:
        return Sparkles;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 pb-6 border-b border-gray-200">
        <div>
          <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
            Behavioral Decarbonization
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight mt-1">Climate Challenges</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1 font-medium">Participate in sustainability tasks to earn experience points and improve your profile rating.</p>
        </div>
        <div className="bg-blue-50 border border-blue-100 text-slate-900 px-4 py-2.5 rounded-2xl font-extrabold text-base flex items-center gap-2 shadow-sm">
          <Award className="w-5 h-5 text-blue-600 animate-bounce" />
          <span>Total Points: {totalPoints} XP</span>
        </div>
      </div>

      {/* Grid of Challenges */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {challenges.map((challenge) => {
          const category = DEFAULT_CHALLENGES.find(dc => dc.title === challenge.title)?.category || 'General';
          const Icon = getCategoryIcon(category);
          
          return (
            <Card key={challenge.id} className={`shadow-sm border transition-all rounded-3xl flex flex-col justify-between overflow-hidden ${challenge.is_completed ? 'border-blue-200 bg-blue-50/10' : 'border-gray-150 bg-white hover:border-gray-300 hover:shadow-md'}`}>
              <CardHeader className="pb-3 px-6 pt-6">
                <div className="flex justify-between items-start mb-3">
                  <Badge variant="outline" className={`text-[10px] font-bold uppercase rounded-full ${challenge.is_completed ? 'border-blue-200 text-blue-800 bg-blue-100/30' : 'border-gray-200 text-gray-600 bg-gray-50'}`}>
                    {category}
                  </Badge>
                  {challenge.is_completed ? (
                    <CheckCircle2 className="text-blue-600 w-5.5 h-5.5" />
                  ) : (
                    <Circle className="text-gray-250 w-5.5 h-5.5" />
                  )}
                </div>
                <CardTitle className="text-base flex items-center gap-2 text-gray-900 font-extrabold">
                  <Icon className={`w-4.5 h-4.5 shrink-0 ${challenge.is_completed ? 'text-blue-600' : 'text-gray-500'}`} />
                  {challenge.title}
                </CardTitle>
                <CardDescription className="pt-2 text-xs text-gray-500 leading-relaxed font-semibold">
                  {challenge.description}
                </CardDescription>
              </CardHeader>
              <CardFooter className="pt-4 pb-5 border-t border-gray-100 bg-gray-50/30 flex justify-between items-center px-6">
                <span className="font-extrabold text-slate-800 font-mono text-xs">+{challenge.points} XP</span>
                <Button 
                  onClick={() => handleMarkComplete(challenge.id, challenge.points)}
                  disabled={challenge.is_completed || completingId === challenge.id}
                  className={challenge.is_completed 
                    ? 'border-blue-100 text-blue-800 bg-blue-50 hover:bg-blue-100/50 font-bold text-xs h-9 rounded-xl cursor-pointer' 
                    : 'bg-[#0F172A] hover:bg-[#07241c] text-white font-bold text-xs h-9 rounded-xl cursor-pointer shadow-sm'}
                  variant={challenge.is_completed ? 'outline' : 'default'}
                  size="sm"
                >
                  {completingId === challenge.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                  ) : null}
                  {challenge.is_completed ? 'Completed' : 'Mark Complete'}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}


