/* eslint-disable react/no-unescaped-entities */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle2, 
  Loader2, 
  AlertCircle, 
  Sparkles, 
  Save, 
  Car, 
  Flame, 
  ShoppingBag, 
  Trash2,
  Users,
  MapPin,
  Compass,
  Utensils,
  Plug,
  Info,
  Globe,
  Plus,
  Minus,
  X,
  TrendingDown,
  Leaf,
  BarChart3,
  Star
} from 'lucide-react';
import { calculateCarbonFootprint, normalizeAssessmentData, AssessmentData } from '@/lib/carbon-engine';
import { createClient } from '@/lib/supabase/client';

export default function Assessment() {
  const [step, setStep] = useState(0); // 0 to 16
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [hasDraft, setHasDraft] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [resultsData, setResultsData] = useState<any>(null);
  const [ctaDismissed, setCtaDismissed] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const totalSteps = 16;
  const router = useRouter();
  const supabase = createClient();

  // Unit System state: 'metric' (default) or 'imperial'
  const [unitSystem, setUnitSystem] = useState<'metric' | 'imperial'>('metric');

  // Onboarding parameters
  const [onboarding, setOnboarding] = useState<{
    goal: string;
    householdSize: string;
    region: string;
  }>({
    goal: 'reduce',
    householdSize: '1',
    region: 'us'
  });

  const [formData, setFormData] = useState<AssessmentData>({
    transport: {
      carMiles: 0,
      carType: 'petrol',
      flightShort: 0,
      flightLong: 0,
    },
    energy: {
      electricityKwh: 0,
      heatingOilLiters: 0,
      naturalGasKwh: 0,
    },
    diet: 'average',
    shopping: {
      clothingItems: 0,
      electronicsItems: 0,
    },
    waste: {
      generalKg: 0,
      recyclingKg: 0,
    }
  });

  // Check auth status on mount
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setIsLoggedIn(!!data?.user);
    });
  }, []);

  // Load saved unit system on mount
  useEffect(() => {
    const saved = localStorage.getItem('carbon_wise_unit_system');
    if (saved === 'imperial' || saved === 'metric') {
      setTimeout(() => {
        setUnitSystem(saved);
      }, 0);
    }
  }, []);

  // Load draft on mount
  useEffect(() => {
    const savedDraft = localStorage.getItem('carbon_wise_draft');
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft);
        if (parsed.formData && parsed.step !== undefined) {
          const timer = setTimeout(() => {
            setHasDraft(true);
          }, 0);
          return () => clearTimeout(timer);
        }
      } catch (e) {
        console.error('Error parsing draft:', e);
      }
    }
  }, []);

  // Auto-save draft on change
  useEffect(() => {
    if (step > 0) {
      localStorage.setItem('carbon_wise_draft', JSON.stringify({
        step,
        formData,
        onboarding,
        unitSystem,
        updatedAt: new Date().toISOString()
      }));
    }
  }, [formData, step, onboarding, unitSystem]);

  const handleResumeDraft = () => {
    const savedDraft = localStorage.getItem('carbon_wise_draft');
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft);
        setFormData(parsed.formData);
        if (parsed.onboarding) setOnboarding(parsed.onboarding);
        if (parsed.unitSystem) setUnitSystem(parsed.unitSystem);
        setStep(parsed.step);
        setHasDraft(false);
        setSaveSuccessMsg('Draft restored successfully!');
        setTimeout(() => setSaveSuccessMsg(null), 3000);
      } catch (e) {
        console.error('Failed to restore draft:', e);
      }
    }
  };

  const handleDiscardDraft = () => {
    localStorage.removeItem('carbon_wise_draft');
    setHasDraft(false);
  };

  const handleManualSave = () => {
    localStorage.setItem('carbon_wise_draft', JSON.stringify({
      step,
      formData,
      onboarding,
      unitSystem,
      updatedAt: new Date().toISOString()
    }));
    setSaveSuccessMsg('Draft progress cached successfully.');
    setTimeout(() => setSaveSuccessMsg(null), 3000);
  };

  const getCalculationData = (data: AssessmentData, system: 'metric' | 'imperial'): AssessmentData => {
    const safeData = normalizeAssessmentData(data);
    if (system === 'metric') {
      return {
        ...safeData,
        transport: {
          ...safeData.transport,
          carMiles: safeData.transport.carMiles / 1.60934, // convert display KM to miles for the engine
        },
      };
    } else {
      return {
        ...safeData,
        energy: {
          ...safeData.energy,
          heatingOilLiters: (safeData.energy.heatingOilLiters || 0) * 3.78541, // convert display Gallons to Liters
        },
        waste: {
          ...data.waste,
          generalKg: data.waste.generalKg * 0.453592, // convert display lbs to kg
          recyclingKg: data.waste.recyclingKg * 0.453592, // convert display lbs to kg
        }
      };
    }
  };

  const getMetricDataForStorage = (data: AssessmentData, system: 'metric' | 'imperial'): AssessmentData => {
    const safeData = normalizeAssessmentData(data);
    if (system === 'metric') {
      return safeData;
    } else {
      return {
        ...safeData,
        transport: {
          ...safeData.transport,
          carMiles: safeData.transport.carMiles * 1.60934, // Miles -> KM
        },
        energy: {
          ...data.energy,
          heatingOilLiters: (data.energy.heatingOilLiters || 0) * 3.78541, // Gallons -> Liters
        },
        waste: {
          ...data.waste,
          generalKg: data.waste.generalKg * 0.453592, // lbs -> kg
          recyclingKg: data.waste.recyclingKg * 0.453592, // lbs -> kg
        }
      };
    }
  };

  const handleUnitSystemChange = (sys: 'metric' | 'imperial') => {
    if (sys === unitSystem) return;
    setUnitSystem(sys);
    localStorage.setItem('carbon_wise_unit_system', sys);

    setFormData(prev => {
      const updated = { ...prev };
      if (sys === 'imperial') {
        updated.transport = {
          ...updated.transport,
          carMiles: Number((updated.transport.carMiles / 1.60934).toFixed(2))
        };
        updated.energy = {
          ...updated.energy,
          heatingOilLiters: Number(((updated.energy.heatingOilLiters || 0) / 3.78541).toFixed(2))
        };
        updated.waste = {
          ...updated.waste,
          generalKg: Number((updated.waste.generalKg / 0.453592).toFixed(2)),
          recyclingKg: Number((updated.waste.recyclingKg / 0.453592).toFixed(2))
        };
      } else {
        updated.transport = {
          ...updated.transport,
          carMiles: Number((updated.transport.carMiles * 1.60934).toFixed(2))
        };
        updated.energy = {
          ...updated.energy,
          heatingOilLiters: Number(((updated.energy.heatingOilLiters || 0) * 3.78541).toFixed(2))
        };
        updated.waste = {
          ...updated.waste,
          generalKg: Number((updated.waste.generalKg * 0.453592).toFixed(2)),
          recyclingKg: Number((updated.waste.recyclingKg * 0.453592).toFixed(2))
        };
      }
      return updated;
    });
  };

  const handleNext = () => setStep(s => Math.min(s + 1, totalSteps));
  const handlePrev = () => setStep(s => Math.max(s - 1, 0));

  const updateNestedField = (category: keyof AssessmentData, field: string, value: any) => {
    const stringFields = new Set(['carType']);
    const sanitizedValue = stringFields.has(field)
      ? value
      : (() => {
          const numericValue = typeof value === 'string' ? parseFloat(value) : value;
          return Number.isFinite(numericValue) && numericValue >= 0 ? numericValue : 0;
        })();

    setFormData(prev => ({
      ...prev,
      [category]: typeof prev[category] === 'object'
        ? { ...prev[category], [field]: sanitizedValue }
        : sanitizedValue
    }));
  };

  const setDiet = (value: any) => {
    setFormData(prev => ({ ...prev, diet: value }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const calcData = getCalculationData(formData, unitSystem);
      const results = calculateCarbonFootprint(calcData);

      if (isNaN(results.total)) {
        throw new Error("Calculation failure: resulting carbon footprint total is NaN.");
      }

      const metricInputs = getMetricDataForStorage(formData, unitSystem);
      const localPayload = {
        total_emissions: results.total,
        scope_1: results.scopes.scope1,
        scope_2: results.scopes.scope2,
        scope_3: results.scopes.scope3,
        category_breakdown: results.breakdown,
        responses: { onboarding, raw_inputs: metricInputs, category_breakdown: results.breakdown }
      };

      // Always cache results locally
      localStorage.setItem('carbon_wise_completed_baseline', JSON.stringify(localPayload));
      localStorage.removeItem('carbon_wise_draft');

      // Store results for inline display (works for ALL users)
      setResultsData({ results, onboarding });

      // Silently attempt DB save for logged-in users — non-blocking
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        try {
          await supabase.from('profiles').upsert(
            { id: user.id, email: user.email || '', full_name: user.user_metadata?.full_name || 'CarbonWise User' },
            { onConflict: 'id' }
          );
          await supabase.from('assessments').insert({
            user_id: user.id,
            total_emissions: results.total,
            scope_1: results.scopes.scope1,
            scope_2: results.scopes.scope2,
            scope_3: results.scopes.scope3,
            responses: { onboarding, raw_inputs: metricInputs, category_breakdown: results.breakdown }
          });
          const weekStart = new Date(); weekStart.setDate(weekStart.getDate() - 7);
          const monthStart = new Date(); monthStart.setDate(monthStart.getDate() - 30);
          await supabase.from('reports').insert([
            { user_id: user.id, report_type: 'weekly', file_url: '#weekly-download', period_start: weekStart.toISOString(), period_end: new Date().toISOString(), total_emissions: results.total },
            { user_id: user.id, report_type: 'monthly', file_url: '#monthly-download', period_start: monthStart.toISOString(), period_end: new Date().toISOString(), total_emissions: results.total }
          ]);
          const calculatedScore = Math.max(10, Math.min(100, Math.round(100 - (results.total / 300))));
          await supabase.from('profiles').update({ onboarding_completed: true, sustainability_score: calculatedScore }).eq('id', user.id);
        } catch (dbErr) {
          console.warn('Non-critical: failed to save assessment to DB:', dbErr);
        }
      }

      setShowResults(true);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'An error occurred while processing your assessment.');
    } finally {
      setLoading(false);
    }
  };

  // Recommendation engine based on results
  const getRecommendations = (results: any, onboardingData: any) => {
    const recs: { icon: any; title: string; desc: string; impact: string }[] = [];
    const b = results.breakdown;
    if (b.transport > 2000) recs.push({ icon: Car, title: 'Reduce Driving', desc: 'Consider carpooling, public transit, or cycling for short trips to cut your largest emission source.', impact: 'High Impact' });
    if (b.transport > 1500 && (results.breakdown.transport / results.total) > 0.3) recs.push({ icon: Globe, title: 'Offset Flight Emissions', desc: 'Purchase verified carbon offsets for unavoidable flights through Gold Standard or VCS certified projects.', impact: 'Medium Impact' });
    if (b.energy > 1500) recs.push({ icon: Plug, title: 'Switch to Renewable Energy', desc: 'Contact your utility provider about green energy plans or install rooftop solar panels.', impact: 'High Impact' });
    if (b.energy > 1000) recs.push({ icon: Flame, title: 'Improve Home Insulation', desc: 'Better insulation reduces heating and cooling energy needs by up to 30%.', impact: 'Medium Impact' });
    if (b.diet > 1200) recs.push({ icon: Utensils, title: 'Reduce Meat Consumption', desc: 'Replacing 3 meat meals per week with plant-based alternatives can save over 500 kg CO₂e annually.', impact: 'High Impact' });
    if (b.shopping > 500) recs.push({ icon: ShoppingBag, title: 'Buy Less, Choose Better', desc: 'Extend the life of electronics and choose second-hand clothing to reduce Scope 3 manufacturing emissions.', impact: 'Medium Impact' });
    if (b.waste > 300) recs.push({ icon: Trash2, title: 'Compost Organic Waste', desc: 'Diverting food scraps from landfill reduces methane emissions and produces natural fertilizer.', impact: 'Medium Impact' });
    if (recs.length === 0) recs.push({ icon: Star, title: 'Outstanding Footprint!', desc: 'Your carbon footprint is already well below average. Continue your sustainable habits and inspire others.', impact: 'Keep it up!' });
    return recs.slice(0, 4);
  };

  const currentResults = calculateCarbonFootprint(getCalculationData(formData, unitSystem));

  // Setup step definitions
  const stepInfo = [
    { category: 'Onboarding', title: 'CarbonWise Baseline Audit', desc: 'Welcome to your personalized climate audit. This 16-question survey quantifies your annual emissions baseline across transit, energy, food, and consumption.', icon: Sparkles },
    { category: 'Calibration', title: 'What is your primary climate goal?', desc: 'We align recommendations to fit your ultimate objective.', icon: Compass },
    { category: 'Calibration', title: 'How many occupants live in your household?', desc: 'Used to scale shared electricity, utility heating, and waste loads.', icon: Users },
    { category: 'Calibration', title: 'What is your primary region / location?', desc: 'Calibrates regional grid energy mixes and carbon emission coefficients.', icon: MapPin },
    { category: 'Transportation', title: unitSystem === 'metric' ? 'How many kilometers do you drive per week?' : 'How many miles do you drive per week?', desc: 'Car travel distance directly impacts Scope 1 combustion baselines.', icon: Car },
    { category: 'Transportation', title: 'What engine type does your vehicle use?', desc: 'Calculates the fuel coefficient (Petrol vs. Diesel vs. EV battery grid).', icon: Car },
    { category: 'Transportation', title: 'Short-haul flights taken this past year', desc: 'Flights under 3 hours generate high take-off fuel emissions.', icon: Globe },
    { category: 'Transportation', title: 'Long-haul flights taken this past year', desc: 'Flights over 3 hours release large emissions into the upper atmosphere.', icon: Globe },
    { category: 'Home Energy', title: 'Monthly grid electricity usage (kWh)', desc: 'Grid reliance generates Scope 2 indirect combustion byproducts.', icon: Plug },
    { category: 'Home Energy', title: 'Monthly natural gas usage (kWh)', desc: 'Gas heating burns fuel locally, producing Scope 1 emissions.', icon: Flame },
    { category: 'Home Energy', title: unitSystem === 'metric' ? 'Monthly heating oil usage (Liters)' : 'Monthly heating oil usage (Gallons)', desc: 'Heating oil has a heavy local carbon combustion profile.', icon: Flame },
    { category: 'Food & Nutrition', title: 'Select your dietary profile', desc: 'Industrial meat production releases large volumes of methane.', icon: Utensils },
    { category: 'Consumption', title: 'Monthly clothing / apparel purchases', desc: 'Manufacturing raw materials and logistics drive Scope 3 footprints.', icon: ShoppingBag },
    { category: 'Consumption', title: 'Monthly consumer electronics purchased', desc: 'Gadgets have high manufacturing footprints and raw material mineral extraction.', icon: ShoppingBag },
    { category: 'Waste & Recycling', title: unitSystem === 'metric' ? 'Weekly general landfill waste (kg)' : 'Weekly general landfill waste (lbs)', desc: unitSystem === 'metric' ? 'Average US citizen discards ~15 kg weekly. Organics rotting in landfills generate methane.' : 'Average US citizen discards ~33 lbs weekly. Organics rotting in landfills generate methane.', icon: Trash2 },
    { category: 'Waste & Recycling', title: unitSystem === 'metric' ? 'Weekly recycling collected (kg)' : 'Weekly recycling collected (lbs)', desc: 'Recycling inputs returns materials into circular production flows.', icon: Trash2 },
    { category: 'Summary', title: 'Review Audit Results & Submit', desc: 'Check your live footprint projection and finalize your baseline carbon audit.', icon: CheckCircle2 }
  ];

  // Pre-compute results display values (only when resultsData is available)
  const rd = resultsData;
  const rdTotal = rd?.results?.total ?? 0;
  const rdGlobalAvg = 7000;
  const rdPctVsGlobal = Math.round(((rdTotal - rdGlobalAvg) / rdGlobalAvg) * 100);
  const rdSustainScore = Math.max(10, Math.min(100, Math.round(100 - (rdTotal / 300))));
  const rdScoreLabel = rdSustainScore >= 70 ? 'Excellent' : rdSustainScore >= 50 ? 'Good' : rdSustainScore >= 30 ? 'Average' : 'Needs Work';
  const rdScoreColor = rdSustainScore >= 70 ? 'text-emerald-600' : rdSustainScore >= 50 ? 'text-blue-600' : rdSustainScore >= 30 ? 'text-amber-600' : 'text-red-600';
  const rdCategories = [
    { label: 'Transportation', key: 'transport' as const, color: 'bg-blue-500' },
    { label: 'Home Energy', key: 'energy' as const, color: 'bg-amber-500' },
    { label: 'Food & Diet', key: 'diet' as const, color: 'bg-emerald-500' },
    { label: 'Shopping', key: 'shopping' as const, color: 'bg-purple-500' },
    { label: 'Waste', key: 'waste' as const, color: 'bg-rose-500' },
  ];
  const rdRecs = rd ? getRecommendations(rd.results, rd.onboarding) : [];
  const rdOb = rd?.onboarding;

  return (
    <div className="max-w-6xl mx-auto space-y-6">

      {/* ============================================================
          RESULTS VIEW — shown for ALL users after submission
          ============================================================ */}
      {showResults && resultsData && (
        <div className="space-y-6 animate-in fade-in duration-500">

          {/* Page Title */}
          <div>
            <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
              Assessment Complete
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#0F172A] mt-2 font-serif">Your Carbon Footprint Report</h1>
          </div>

          {/* Non-intrusive CTA Banner — only for guests */}
          {!isLoggedIn && !ctaDismissed && (
            <div className="relative bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-5 text-white shadow-lg">
              <button
                onClick={() => setCtaDismissed(true)}
                className="absolute top-3 right-3 p-1 rounded-full hover:bg-white/20 transition cursor-pointer"
                aria-label="Dismiss"
              >
                <X className="h-4 w-4" />
              </button>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pr-8">
                <div className="h-10 w-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Leaf className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-sm">Want to save your results and track progress over time?</p>
                  <p className="text-blue-100 text-xs mt-0.5">Create a free account to save history, daily tracking, AI insights &amp; personalized dashboard.</p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <Link href="/signup">
                    <Button size="sm" className="bg-white text-blue-700 hover:bg-blue-50 font-bold rounded-xl text-xs h-9 cursor-pointer shadow-sm">
                      Create Free Account
                    </Button>
                  </Link>
                  <Link href="/login">
                    <Button size="sm" variant="outline" className="border-white/40 text-white hover:bg-white/20 font-bold rounded-xl text-xs h-9 cursor-pointer bg-transparent">
                      Login
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Logged-in CTA */}
          {isLoggedIn && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-bold text-emerald-800 text-sm">Your results have been saved to your account!</p>
                <p className="text-emerald-700 text-xs mt-0.5">View your full dashboard with history, reports, and AI insights.</p>
              </div>
              <Button onClick={() => router.push('/dashboard')} size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs cursor-pointer">
                Go to Dashboard
              </Button>
            </div>
          )}

          {/* Score + Meta Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="sm:col-span-2 bg-[#0F172A] rounded-3xl p-6 text-white flex flex-col justify-between">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="h-4 w-4 text-blue-400" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Annual Carbon Footprint</span>
              </div>
              <div>
                <div className="text-5xl font-black font-mono">{rdTotal.toFixed(0)}</div>
                <div className="text-blue-400 font-bold text-sm mt-0.5">kg CO₂e / year</div>
              </div>
              <div className="mt-4">
                <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide">vs. Global Average (7,000 kg)</div>
                <div className={`text-lg font-bold mt-0.5 ${rdPctVsGlobal > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                  {rdPctVsGlobal > 0 ? `+${rdPctVsGlobal}%` : `${rdPctVsGlobal}%`} {rdPctVsGlobal > 0 ? 'above' : 'below'} average
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-3xl p-6 flex flex-col justify-between shadow-sm">
              <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Sustainability Score</div>
              <div className="my-3">
                <div className={`text-5xl font-black font-mono ${rdScoreColor}`}>{rdSustainScore}</div>
                <div className={`text-sm font-bold mt-1 ${rdScoreColor}`}>{rdScoreLabel}</div>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${rdSustainScore >= 70 ? 'bg-emerald-500' : rdSustainScore >= 50 ? 'bg-blue-500' : rdSustainScore >= 30 ? 'bg-amber-500' : 'bg-red-500'}`}
                  style={{ width: `${rdSustainScore}%` }}
                />
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-3xl p-6 flex flex-col justify-between shadow-sm">
              <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Climate Goal</div>
              <div className="my-3">
                <div className="h-10 w-10 bg-blue-50 rounded-xl flex items-center justify-center mb-2">
                  <TrendingDown className="h-5 w-5 text-blue-600" />
                </div>
                <div className="text-sm font-bold text-[#0F172A]">
                  {rdOb?.goal === 'reduce' ? 'Reduce Footprint' : rdOb?.goal === 'offset' ? 'Offset Travel' : 'Eco Challenges'}
                </div>
              </div>
              <div className="text-[10px] text-slate-500 font-medium">
                Region: <span className="font-bold text-slate-700 uppercase">{rdOb?.region || 'US'}</span> · Household: <span className="font-bold text-slate-700">{rdOb?.householdSize || 1}</span>
              </div>
            </div>
          </div>

          {/* Category Breakdown */}
          <Card className="border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
            <CardHeader className="bg-[#0F172A] text-white py-5 px-6">
              <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-blue-400" /> Emissions Breakdown by Category
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {rdCategories.map((cat) => {
                const val = (rd?.results?.breakdown as any)?.[cat.key] || 0;
                const pct = rdTotal > 0 ? (val / rdTotal) * 100 : 0;
                return (
                  <div key={cat.key} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-600">{cat.label}</span>
                      <span className="font-bold text-slate-900 font-mono">{val.toFixed(0)} kg CO₂e <span className="text-slate-400 font-normal">({pct.toFixed(1)}%)</span></span>
                    </div>
                    <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${cat.color} transition-all duration-700`} style={{ width: `${Math.min(100, pct)}%` }} />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Scope Breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: 'Scope 1', sublabel: 'Direct Emissions', desc: 'Fuel combustion & on-site sources', val: rd?.results?.scopes?.scope1, color: 'border-blue-200 bg-blue-50' },
              { label: 'Scope 2', sublabel: 'Indirect Energy', desc: 'Purchased electricity & heat', val: rd?.results?.scopes?.scope2, color: 'border-amber-200 bg-amber-50' },
              { label: 'Scope 3', sublabel: 'Value Chain', desc: 'Supply chain & consumption', val: rd?.results?.scopes?.scope3, color: 'border-emerald-200 bg-emerald-50' },
            ].map((scope) => (
              <div key={scope.label} className={`border rounded-2xl p-5 ${scope.color}`}>
                <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{scope.label} — {scope.sublabel}</div>
                <div className="text-3xl font-black font-mono text-[#0F172A] mt-2">{(scope.val || 0).toFixed(0)}</div>
                <div className="text-xs font-bold text-slate-500 mt-0.5">kg CO₂e</div>
                <div className="text-[10px] text-slate-500 mt-2 font-medium">{scope.desc}</div>
              </div>
            ))}
          </div>

          {/* Recommendations */}
          <div>
            <h2 className="text-lg font-bold text-[#0F172A] mb-4 font-serif flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-blue-500" /> Personalized Recommendations
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {rdRecs.map((rec, i) => {
                const Icon = rec.icon;
                return (
                  <div key={i} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-start gap-4">
                      <div className="h-9 w-9 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Icon className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-[#0F172A] text-sm">{rec.title}</h3>
                          <span className="text-[9px] font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full uppercase tracking-wider">{rec.impact}</span>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed font-medium">{rec.desc}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bottom actions */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="font-bold text-[#0F172A] text-sm">Take another assessment or explore more features</p>
              <p className="text-xs text-slate-500 mt-0.5">Track your progress, set goals, and get AI-powered insights.</p>
            </div>
            <div className="flex gap-3 flex-shrink-0">
              <Button
                onClick={() => { setShowResults(false); setStep(0); setResultsData(null); }}
                variant="outline"
                size="sm"
                className="border-slate-200 text-slate-700 hover:bg-slate-100 bg-white font-semibold rounded-xl text-xs cursor-pointer"
              >
                Retake Assessment
              </Button>
              {isLoggedIn ? (
                <Button onClick={() => router.push('/dashboard')} size="sm" className="bg-[#0F172A] hover:bg-[#1E293B] text-white font-bold rounded-xl text-xs cursor-pointer">
                  Go to Dashboard <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Button>
              ) : (
                <Link href="/signup">
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs cursor-pointer">
                    Save Results Free <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                  </Button>
                </Link>
              )}
            </div>
          </div>

        </div>
      )}

      {/* ============================================================
          WIZARD VIEW — shown while taking the assessment
          ============================================================ */}
      {!showResults && (
      <div className="space-y-6">
      
      {/* Draft Restore Notification */}
      {hasDraft && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm animate-in fade-in duration-300">
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-blue-600 animate-pulse flex-shrink-0" />
            <div>
              <h4 className="font-bold text-[#0F172A] text-sm">Saved Progress Found</h4>
              <p className="text-xs text-slate-600 font-medium">We found an in-progress assessment draft. Resume where you left off?</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={handleResumeDraft} size="sm" className="bg-[#0F172A] hover:bg-[#1E293B] text-white font-semibold rounded-xl text-xs cursor-pointer shadow-sm">
              Resume Progress
            </Button>
            <Button onClick={handleDiscardDraft} size="sm" variant="ghost" className="text-slate-500 hover:text-slate-800 font-semibold text-xs cursor-pointer">
              Discard Draft
            </Button>
          </div>
        </div>
      )}

      {/* Success banner */}
      {saveSuccessMsg && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center gap-3 shadow-sm animate-in fade-in duration-200">
          <CheckCircle2 className="w-5 h-5 text-blue-600" />
          <span className="text-xs font-semibold text-slate-900">{saveSuccessMsg}</span>
        </div>
      )}

      {/* Header Title block */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
            Enterprise Carbon Accounting
          </span>
          <h1 className="text-page mt-1 font-serif text-[#0F172A]">Environmental Baseline Audit</h1>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {step > 0 && (
            <Button onClick={handleManualSave} variant="outline" size="sm" className="border-slate-200 text-slate-800 hover:bg-slate-50 bg-white font-semibold rounded-xl text-xs shadow-sm cursor-pointer h-10">
              <Save className="w-3.5 h-3.5 mr-1.5 text-slate-600" /> Cache Draft
            </Button>
          )}
        </div>
      </div>

      {/* GLOBAL PROGRESS BAR */}
      {step > 0 && (
        <div className="space-y-2 bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-slate-500">
            <span>Question {step} of {totalSteps}: {stepInfo[step].category}</span>
            <span className="text-blue-600 font-mono font-semibold">{Math.round((step / totalSteps) * 100)}% Completed</span>
          </div>
          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner">
            <div 
              className="h-full bg-blue-600 transition-all duration-500" 
              style={{ width: `${(step / totalSteps) * 100}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Error Output */}
      {errorMsg && (
        <div className="bg-red-50 border border-red-255 p-4 rounded-2xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-red-800 text-xs">Submission Failed</h4>
            <p className="text-xs text-red-700 font-medium mt-0.5">{errorMsg}</p>
          </div>
        </div>
      )}

      {/* MAIN CONTAINER GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* WIZARD QUESTION CARD */}
        <div className="lg:col-span-2">
          <Card className="shadow-sm border border-slate-200 bg-white rounded-3xl overflow-hidden min-h-[460px] flex flex-col justify-between">
            <div>
              <CardHeader className="bg-[#0F172A] text-white p-6 sm:p-8">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-slate-800 rounded-xl flex items-center justify-center border border-slate-700">
                    {(() => {
                      const Icon = stepInfo[step].icon;
                      return <Icon className="w-5 h-5 text-blue-400" />;
                    })()}
                  </div>
                  <div>
                    <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
                      {stepInfo[step].category}
                    </span>
                    <CardTitle className="text-card text-white mt-0.5 font-sans font-semibold text-lg sm:text-xl">{stepInfo[step].title}</CardTitle>
                  </div>
                </div>
                <CardDescription className="text-slate-300 text-xs font-medium leading-relaxed mt-3">
                  {stepInfo[step].desc}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="p-6 sm:p-8 space-y-6 text-slate-800">
                
                {/* STEP 0: Onboarding Welcome Screen */}
                {step === 0 && (
                  <div className="space-y-6 py-4">
                    <div className="border border-blue-100 rounded-2xl p-6 bg-blue-50/20 flex gap-4 items-start">
                      <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                      <div className="space-y-1.5">
                        <h4 className="font-bold text-[#0F172A] text-xs uppercase tracking-wider">Methodology Calibration</h4>
                        <p className="text-slate-700 text-xs leading-relaxed font-medium">
                          Our calculation coefficients map emissions to global climate targets. Standardizing inputs scales shared footprints like gas utility heating or general landfill waste per household occupant.
                        </p>
                      </div>
                    </div>
                    <div className="p-6 border border-slate-200 rounded-2xl bg-[#FAFAF8] flex flex-col items-center justify-center text-center">
                      <p className="text-xs text-slate-600 max-w-sm font-medium">
                        Rest assured. Your choices are encrypted locally and can be saved as a draft at any point. Let's start the audit.
                      </p>
                    </div>
                  </div>
                )}

                {/* STEP 1: Primary Goal */}
                {step === 1 && (
                  <div className="grid grid-cols-1 gap-4 pt-2">
                    {[
                      { value: 'reduce', title: 'Identify and Reduce Footprint', desc: 'Pinpoint high-impact daily activities and log offsets to actively decrease your carbon emission output.' },
                      { value: 'offset', title: 'Compensate & Off-set Travel', desc: 'Calculate carbon loads generated by intercontinental commutes and fund verified environmental projects.' },
                      { value: 'challenges', title: 'Eco-Challenges Community', desc: 'Participate in carbon reduction habits alongside other community members for verified compliance scores.' }
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setOnboarding(prev => ({ ...prev, goal: opt.value }))}
                        className={`text-left p-4.5 border rounded-2xl transition-all cursor-pointer ${
                          onboarding.goal === opt.value
                            ? 'bg-blue-50/50 border-blue-400 text-slate-900 shadow-sm ring-1 ring-blue-300'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <h4 className="text-xs font-bold text-[#0F172A]">{opt.title}</h4>
                        <p className="text-[11px] text-slate-600 mt-1 leading-normal font-medium">{opt.desc}</p>
                      </button>
                    ))}
                  </div>
                )}

                {/* STEP 2: Household Occupants */}
                {step === 2 && (
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
                    {[
                      { value: '1', title: '1 Occupant', desc: 'Single Household' },
                      { value: '2', title: '2 People', desc: 'Couple/Roommate' },
                      { value: '3', title: '3 People', desc: 'Small Family' },
                      { value: '4', title: '4 People', desc: 'Average Family' },
                      { value: '5', title: '5+ People', desc: 'Large Household' }
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setOnboarding(prev => ({ ...prev, householdSize: opt.value }))}
                        className={`p-4 border rounded-2xl transition-all text-center flex flex-col justify-between min-h-[110px] cursor-pointer ${
                          onboarding.householdSize === opt.value
                            ? 'bg-blue-50/50 border-blue-400 text-slate-900 shadow-sm ring-1 ring-blue-300'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <div className="h-6 w-6 rounded-full bg-slate-100 text-slate-800 flex items-center justify-center font-bold text-xs mx-auto mb-2">
                          {opt.value === '5' ? '5+' : opt.value}
                        </div>
                        <div>
                          <h4 className="text-[11px] font-bold text-[#0F172A]">{opt.title}</h4>
                          <p className="text-[9px] text-slate-400 mt-0.5 font-semibold">{opt.desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* STEP 3: Region Selection */}
                {step === 3 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    {[
                      { value: 'us', title: 'United States', desc: 'Baseline grid mix utilizes US national carbon coefficients.' },
                      { value: 'eu', title: 'European Union', desc: 'Calibrated to lower carbon intensity and nuclear/hydro power inputs.' },
                      { value: 'asia', title: 'Asia-Pacific Region', desc: 'Calibrated for standard fossil-fuel and coal grid dependencies.' },
                      { value: 'other', title: 'Rest of the World', desc: 'Utilizes global average environmental standards.' }
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setOnboarding(prev => ({ ...prev, region: opt.value }))}
                        className={`text-left p-4.5 border rounded-2xl transition-all cursor-pointer ${
                          onboarding.region === opt.value
                            ? 'bg-blue-50/50 border-blue-400 text-slate-900 shadow-sm ring-1 ring-blue-300'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <h4 className="text-xs font-bold text-[#0F172A]">{opt.title}</h4>
                        <p className="text-[11px] text-slate-600 mt-1 leading-normal font-medium">{opt.desc}</p>
                      </button>
                    ))}
                  </div>
                )}

                {/* STEP 4: Car Commute (Weekly Miles) with field-level toggle */}
                {step === 4 && (
                  <div className="space-y-6 max-w-md mx-auto text-center pt-4">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Weekly Mileage</div>
                    <div className="flex items-center justify-center gap-3">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => updateNestedField('transport', 'carMiles', Math.max(0, formData.transport.carMiles - 10))}
                        className="rounded-full h-11 w-11 border-slate-200 cursor-pointer"
                      >
                        <Minus className="h-4.5 w-4.5 text-slate-600" />
                      </Button>
                      <input
                        type="number"
                        min="0"
                        value={formData.transport.carMiles}
                        onChange={(e) => updateNestedField('transport', 'carMiles', e.target.value)}
                        className="text-4xl font-extrabold text-[#0F172A] text-center w-36 font-mono focus:outline-none border-b border-slate-200 pb-1"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => updateNestedField('transport', 'carMiles', formData.transport.carMiles + 10)}
                        className="rounded-full h-11 w-11 border-slate-200 cursor-pointer"
                      >
                        <Plus className="h-4.5 w-4.5 text-slate-600" />
                      </Button>
                    </div>
                    
                    {/* Unit System field level toggle */}
                    <div className="space-y-3">
                      <span className="text-xs font-bold text-slate-500 block">Unit System:</span>
                      <div className="inline-flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                        <button
                          type="button"
                          onClick={() => handleUnitSystemChange('metric')}
                          className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                            unitSystem === 'metric' 
                              ? 'bg-[#0F172A] text-white shadow-sm' 
                              : 'text-slate-600 hover:text-[#0F172A]'
                          }`}
                        >
                          Kilometers (KM)
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUnitSystemChange('imperial')}
                          className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                            unitSystem === 'imperial' 
                              ? 'bg-[#0F172A] text-white shadow-sm' 
                              : 'text-slate-600 hover:text-[#0F172A]'
                          }`}
                        >
                          Miles
                        </button>
                      </div>
                    </div>

                    <p className="text-[10px] text-slate-500 max-w-xs mx-auto font-medium">
                      Includes grocery routes, daily work transit, and leisure travel.
                    </p>
                  </div>
                )}

                {/* STEP 5: Vehicle Type */}
                {step === 5 && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                    {[
                      { value: 'petrol', title: 'Petrol Gasoline', desc: 'Standard internal combustion engine (ICE).' },
                      { value: 'diesel', title: 'Diesel Engine', desc: 'Higher compression diesel fuel injection.' },
                      { value: 'ev', title: 'Electric Vehicle (EV)', desc: 'Zero tailpipe emissions. Grid charges batteries.' }
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => updateNestedField('transport', 'carType', opt.value)}
                        className={`p-5 border rounded-2xl transition-all text-center flex flex-col justify-between min-h-[140px] cursor-pointer ${
                          formData.transport.carType === opt.value
                            ? 'bg-blue-50/50 border-blue-400 text-slate-900 shadow-sm ring-1 ring-blue-300'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <div className="h-8 w-8 rounded-lg bg-slate-100 text-slate-800 flex items-center justify-center font-bold text-xs mx-auto mb-3">
                          <Car className="h-4 w-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-[#0F172A]">{opt.title}</h4>
                          <p className="text-[10px] text-slate-500 mt-1 leading-normal font-medium">{opt.desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* STEP 6: Short-haul Flights */}
                {step === 6 && (
                  <div className="space-y-4 max-w-md mx-auto text-center pt-4">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Short Flights (Under 3 Hours)</div>
                    <div className="flex items-center justify-center gap-4">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => updateNestedField('transport', 'flightShort', Math.max(0, formData.transport.flightShort - 1))}
                        className="rounded-full h-11 w-11 border-slate-200 cursor-pointer"
                      >
                        <Minus className="h-4.5 w-4.5 text-slate-600" />
                      </Button>
                      <span className="text-6xl font-extrabold text-[#0F172A] w-24 font-mono">
                        {formData.transport.flightShort}
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => updateNestedField('transport', 'flightShort', formData.transport.flightShort + 1)}
                        className="rounded-full h-11 w-11 border-slate-200 cursor-pointer"
                      >
                        <Plus className="h-4.5 w-4.5 text-slate-600" />
                      </Button>
                    </div>
                    <span className="text-sm font-bold text-blue-600 block">Flights taken this past year</span>
                    <p className="text-[10px] text-slate-500 max-w-xs mx-auto leading-normal font-medium">
                      Includes connecting domestic layovers and quick vacation roundtrips.
                    </p>
                  </div>
                )}

                {/* STEP 7: Long-haul Flights */}
                {step === 7 && (
                  <div className="space-y-4 max-w-md mx-auto text-center pt-4">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Long Flights (Over 3 Hours)</div>
                    <div className="flex items-center justify-center gap-4">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => updateNestedField('transport', 'flightLong', Math.max(0, formData.transport.flightLong - 1))}
                        className="rounded-full h-11 w-11 border-slate-200 cursor-pointer"
                      >
                        <Minus className="h-4.5 w-4.5 text-slate-600" />
                      </Button>
                      <span className="text-6xl font-extrabold text-[#0F172A] w-24 font-mono">
                        {formData.transport.flightLong}
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => updateNestedField('transport', 'flightLong', formData.transport.flightLong + 1)}
                        className="rounded-full h-11 w-11 border-slate-200 cursor-pointer"
                      >
                        <Plus className="h-4.5 w-4.5 text-slate-600" />
                      </Button>
                    </div>
                    <span className="text-sm font-bold text-blue-600 block">Flights taken this past year</span>
                    <p className="text-[10px] text-slate-500 max-w-xs mx-auto leading-normal font-medium">
                      Mainly intercontinental, transoceanic, or cross-country flight paths.
                    </p>
                  </div>
                )}

                {/* STEP 8: Electricity Usage */}
                {step === 8 && (
                  <div className="space-y-4 max-w-md mx-auto text-center pt-4">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Grid Consumption</div>
                    <div className="flex items-center justify-center gap-3">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => updateNestedField('energy', 'electricityKwh', Math.max(0, formData.energy.electricityKwh - 100))}
                        className="rounded-full h-11 w-11 border-slate-200 cursor-pointer"
                      >
                        <Minus className="h-4.5 w-4.5 text-slate-600" />
                      </Button>
                      <input
                        type="number"
                        min="0"
                        value={formData.energy.electricityKwh}
                        onChange={(e) => updateNestedField('energy', 'electricityKwh', e.target.value)}
                        className="text-4xl font-extrabold text-[#0F172A] text-center w-36 font-mono focus:outline-none border-b border-slate-200 pb-1"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => updateNestedField('energy', 'electricityKwh', formData.energy.electricityKwh + 100)}
                        className="rounded-full h-11 w-11 border-slate-200 cursor-pointer"
                      >
                        <Plus className="h-4.5 w-4.5 text-slate-600" />
                      </Button>
                    </div>
                    <span className="text-sm font-bold text-blue-600 block">kWh consumed per month</span>
                    <p className="text-[10px] text-slate-400 max-w-xs mx-auto leading-normal font-medium">
                      Check your utility billing statement. The US household average is ~850 kWh/month.
                    </p>
                  </div>
                )}

                {/* STEP 9: Gas Usage */}
                {step === 9 && (
                  <div className="space-y-4 max-w-md mx-auto text-center pt-4">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Natural Gas Grid</div>
                    <div className="flex items-center justify-center gap-3">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => updateNestedField('energy', 'naturalGasKwh', Math.max(0, (formData.energy.naturalGasKwh || 0) - 100))}
                        className="rounded-full h-11 w-11 border-slate-200 cursor-pointer"
                      >
                        <Minus className="h-4.5 w-4.5 text-slate-600" />
                      </Button>
                      <input
                        type="number"
                        min="0"
                        value={formData.energy.naturalGasKwh}
                        onChange={(e) => updateNestedField('energy', 'naturalGasKwh', e.target.value)}
                        className="text-4xl font-extrabold text-[#0F172A] text-center w-36 font-mono focus:outline-none border-b border-slate-200 pb-1"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => updateNestedField('energy', 'naturalGasKwh', (formData.energy.naturalGasKwh || 0) + 100)}
                        className="rounded-full h-11 w-11 border-slate-200 cursor-pointer"
                      >
                        <Plus className="h-4.5 w-4.5 text-slate-600" />
                      </Button>
                    </div>
                    <span className="text-sm font-bold text-blue-600 block">kWh consumed per month</span>
                    <p className="text-[10px] text-slate-400 max-w-xs mx-auto leading-normal font-medium">
                      Calculates direct burner emissions. Enter 0 if your cooking/heating is electric.
                    </p>
                  </div>
                )}

                {/* STEP 10: Heating Oil */}
                {step === 10 && (
                  <div className="space-y-4 max-w-md mx-auto text-center pt-4">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Heating Fuel Tank</div>
                    <div className="flex items-center justify-center gap-3">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => updateNestedField('energy', 'heatingOilLiters', Math.max(0, (formData.energy.heatingOilLiters || 0) - 50))}
                        className="rounded-full h-11 w-11 border-slate-200 cursor-pointer"
                      >
                        <Minus className="h-4.5 w-4.5 text-slate-600" />
                      </Button>
                      <input
                        type="number"
                        min="0"
                        value={formData.energy.heatingOilLiters}
                        onChange={(e) => updateNestedField('energy', 'heatingOilLiters', e.target.value)}
                        className="text-4xl font-extrabold text-[#0F172A] text-center w-36 font-mono focus:outline-none border-b border-slate-200 pb-1"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => updateNestedField('energy', 'heatingOilLiters', (formData.energy.heatingOilLiters || 0) + 50)}
                        className="rounded-full h-11 w-11 border-slate-200 cursor-pointer"
                      >
                        <Plus className="h-4.5 w-4.5 text-slate-600" />
                      </Button>
                    </div>
                    <span className="text-sm font-bold text-blue-600 block">
                      {unitSystem === 'metric' ? 'Liters consumed per month' : 'Gallons consumed per month'}
                    </span>
                    <p className="text-[10px] text-slate-400 max-w-xs mx-auto leading-normal font-medium">
                      Common in colder climates. Enter 0 if you use grid/gas heating.
                    </p>
                  </div>
                )}

                {/* STEP 11: Dietary Profile */}
                {step === 11 && (
                  <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 pt-2">
                    {[
                      { value: 'heavy_meat', title: 'Heavy Meat', desc: 'Daily beef/pork' },
                      { value: 'average', title: 'Average', desc: 'Moderate meat mix' },
                      { value: 'pescatarian', title: 'Pescatarian', desc: 'Veggies & seafood' },
                      { value: 'vegetarian', title: 'Vegetarian', desc: 'Dairy & eggs only' },
                      { value: 'vegan', title: 'Vegan', desc: 'Strictly plant-based' }
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setDiet(opt.value)}
                        className={`p-4 border rounded-2xl transition-all text-center flex flex-col justify-between min-h-[120px] cursor-pointer ${
                          formData.diet === opt.value
                            ? 'bg-blue-50/50 border-blue-400 text-slate-900 shadow-sm ring-1 ring-blue-300'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <div className="h-8 w-8 rounded-lg bg-slate-100 text-slate-800 flex items-center justify-center font-bold text-xs mx-auto mb-2">
                          <Utensils className="h-4 w-4" />
                        </div>
                        <div>
                          <h4 className="text-[11px] font-bold text-[#0F172A]">{opt.title}</h4>
                          <p className="text-[9px] text-slate-500 mt-1 leading-normal font-semibold">{opt.desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* STEP 12: Apparel Purchases */}
                {step === 12 && (
                  <div className="space-y-4 max-w-md mx-auto text-center pt-4">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Apparel Logistics</div>
                    <div className="flex items-center justify-center gap-4">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => updateNestedField('shopping', 'clothingItems', Math.max(0, formData.shopping.clothingItems - 1))}
                        className="rounded-full h-11 w-11 border-slate-200 cursor-pointer"
                      >
                        <Minus className="h-4.5 w-4.5 text-slate-600" />
                      </Button>
                      <span className="text-6xl font-extrabold text-[#0F172A] w-24 font-mono">
                        {formData.shopping.clothingItems}
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => updateNestedField('shopping', 'clothingItems', formData.shopping.clothingItems + 1)}
                        className="rounded-full h-11 w-11 border-slate-200 cursor-pointer"
                      >
                        <Plus className="h-4.5 w-4.5 text-slate-600" />
                      </Button>
                    </div>
                    <span className="text-sm font-bold text-blue-600 block">Clothing items purchased per month</span>
                    <p className="text-[10px] text-slate-455 max-w-xs mx-auto leading-normal font-medium">
                      Includes shirts, pants, shoes, and outerwear. Fast fashion brands carry heavy footprints.
                    </p>
                  </div>
                )}

                {/* STEP 13: Electronics Purchases */}
                {step === 13 && (
                  <div className="space-y-4 max-w-md mx-auto text-center pt-4">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Consumer Devices</div>
                    <div className="flex items-center justify-center gap-4">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => updateNestedField('shopping', 'electronicsItems', Math.max(0, formData.shopping.electronicsItems - 1))}
                        className="rounded-full h-11 w-11 border-slate-200 cursor-pointer"
                      >
                        <Minus className="h-4.5 w-4.5 text-slate-600" />
                      </Button>
                      <span className="text-6xl font-extrabold text-[#0F172A] w-24 font-mono">
                        {formData.shopping.electronicsItems}
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => updateNestedField('shopping', 'electronicsItems', formData.shopping.electronicsItems + 1)}
                        className="rounded-full h-11 w-11 border-slate-200 cursor-pointer"
                      >
                        <Plus className="h-4.5 w-4.5 text-slate-600" />
                      </Button>
                    </div>
                    <span className="text-sm font-bold text-blue-600 block">Gadgets purchased per month</span>
                    <p className="text-[10px] text-slate-455 max-w-xs mx-auto leading-normal font-medium">
                      Calculates average footprint generated during raw mineral mining and factory assembly.
                    </p>
                  </div>
                )}

                {/* STEP 14: General Waste */}
                {step === 14 && (
                  <div className="space-y-4 max-w-md mx-auto text-center pt-4">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Landfill Output</div>
                    <div className="flex items-center justify-center gap-3">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => updateNestedField('waste', 'generalKg', Math.max(0, formData.waste.generalKg - 5))}
                        className="rounded-full h-11 w-11 border-slate-200 cursor-pointer"
                      >
                        <Minus className="h-4.5 w-4.5 text-slate-600" />
                      </Button>
                      <input
                        type="number"
                        min="0"
                        value={formData.waste.generalKg}
                        onChange={(e) => updateNestedField('waste', 'generalKg', e.target.value)}
                        className="text-4xl font-extrabold text-[#0F172A] text-center w-36 font-mono focus:outline-none border-b border-slate-200 pb-1"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => updateNestedField('waste', 'generalKg', formData.waste.generalKg + 5)}
                        className="rounded-full h-11 w-11 border-slate-200 cursor-pointer"
                      >
                        <Plus className="h-4.5 w-4.5 text-slate-600" />
                      </Button>
                    </div>
                    <span className="text-sm font-bold text-blue-600 block">
                      {unitSystem === 'metric' ? 'Kilograms discarded per week' : 'Pounds (lbs) discarded per week'}
                    </span>
                    <p className="text-[10px] text-slate-400 max-w-xs mx-auto leading-normal font-medium">
                      Average US citizen discards ~15 kg weekly. Organics rotting in landfills generate methane.
                    </p>
                  </div>
                )}

                {/* STEP 15: Recycling */}
                {step === 15 && (
                  <div className="space-y-4 max-w-md mx-auto text-center pt-4">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Circular Disposal</div>
                    <div className="flex items-center justify-center gap-3">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => updateNestedField('waste', 'recyclingKg', Math.max(0, formData.waste.recyclingKg - 5))}
                        className="rounded-full h-11 w-11 border-slate-200 cursor-pointer"
                      >
                        <Minus className="h-4.5 w-4.5 text-slate-600" />
                      </Button>
                      <input
                        type="number"
                        min="0"
                        value={formData.waste.recyclingKg}
                        onChange={(e) => updateNestedField('waste', 'recyclingKg', e.target.value)}
                        className="text-4xl font-extrabold text-[#0F172A] text-center w-36 font-mono focus:outline-none border-b border-slate-200 pb-1"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => updateNestedField('waste', 'recyclingKg', formData.waste.recyclingKg + 5)}
                        className="rounded-full h-11 w-11 border-slate-200 cursor-pointer"
                      >
                        <Plus className="h-4.5 w-4.5 text-slate-600" />
                      </Button>
                    </div>
                    <span className="text-sm font-bold text-blue-600 block">
                      {unitSystem === 'metric' ? 'Kilograms recycled per week' : 'Pounds (lbs) recycled per week'}
                    </span>
                    <p className="text-[10px] text-slate-400 max-w-xs mx-auto leading-normal font-medium">
                      Offset value. Diverting plastic, glass, and aluminum avoids raw material manufacturing costs.
                    </p>
                  </div>
                )}

                {/* STEP 16: Summary Screen */}
                {step === 16 && (
                  <div className="text-center py-8 space-y-6">
                    <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto text-blue-600">
                      <CheckCircle2 className="w-10 h-10 animate-bounce" />
                    </div>
                    <div>
                      <h3 className="text-xl sm:text-2xl font-bold text-[#0F172A]">Baseline Complete</h3>
                      <p className="text-slate-500 text-xs max-w-md mx-auto leading-relaxed mt-2 font-medium">
                        We have compiled your answers. Click below to securely submit the data and initialize your CarbonWise dashboard.
                      </p>
                    </div>
                    
                    <div className="pt-2">
                      <Button onClick={handleSubmit} disabled={loading} className="bg-[#0F172A] hover:bg-[#1E293B] text-white px-8 py-5 h-12 rounded-xl text-sm font-semibold shadow-sm cursor-pointer">
                        {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                        Finalize & Submit Audit
                      </Button>
                    </div>
                  </div>
                )}

              </CardContent>
            </div>
            
            {/* STICKY FOOTER NAVIGATION */}
            <CardFooter className="bg-slate-50 border-t border-slate-200 px-6 sm:px-8 py-5 flex justify-between">
              <Button variant="outline" onClick={handlePrev} disabled={step === 0} className="border-slate-200 text-slate-700 hover:bg-slate-100 bg-white font-semibold rounded-xl text-xs h-10 cursor-pointer">
                <ArrowLeft className="w-3.5 h-3.5 mr-1.5" /> Back
              </Button>
              {step < 16 && (
                <Button onClick={handleNext} className="bg-[#0F172A] hover:bg-[#1E293B] text-white font-semibold rounded-xl text-xs h-10 cursor-pointer">
                  Next Step <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                </Button>
              )}
            </CardFooter>
          </Card>
        </div>

        {/* LIVE IMPACT PROJECTION SIDEBAR */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="shadow-sm border border-slate-200 bg-white rounded-3xl overflow-hidden">
            <CardHeader className="bg-[#0F172A] text-white py-5 px-6">
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-white">
                <Sparkles className="w-4.5 h-4.5 text-blue-400" />
                Live Projection
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6 text-slate-800">
              <div className="text-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Estimated Annual Output</span>
                <div className="text-4xl font-black text-[#0F172A] mt-1 font-mono">
                  {currentResults.total.toFixed(0)}
                </div>
                <span className="text-xs font-bold text-blue-600 block mt-0.5">kg COâ‚‚e / Year</span>
              </div>

              <div className="border-t border-slate-100 pt-6 space-y-4">
                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Audit Vector Breakdown</h4>
                
                {/* Vectors */}
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between font-semibold">
                    <span className="text-slate-600">Transportation:</span>
                    <span className="font-bold text-slate-900 font-mono">{currentResults.breakdown.transport.toFixed(0)} kg</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-blue-600 h-full rounded-full transition-all duration-350" style={{ width: `${Math.min(100, (currentResults.breakdown.transport / (currentResults.total || 1)) * 100)}%` }}></div>
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between font-semibold">
                    <span className="text-slate-600">Home Energy:</span>
                    <span className="font-bold text-slate-900 font-mono">{currentResults.breakdown.energy.toFixed(0)} kg</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-blue-600 h-full rounded-full transition-all duration-300" style={{ width: `${Math.min(100, (currentResults.breakdown.energy / (currentResults.total || 1)) * 100)}%` }}></div>
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between font-semibold">
                    <span className="text-slate-600">Nutrition/Food:</span>
                    <span className="font-bold text-slate-900 font-mono">{currentResults.breakdown.diet.toFixed(0)} kg</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-blue-600 h-full rounded-full transition-all duration-300" style={{ width: `${Math.min(100, (currentResults.breakdown.diet / (currentResults.total || 1)) * 100)}%` }}></div>
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between font-semibold">
                    <span className="text-slate-600">Shopping:</span>
                    <span className="font-bold text-slate-900 font-mono">{currentResults.breakdown.shopping.toFixed(0)} kg</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-blue-600 h-full rounded-full transition-all duration-300" style={{ width: `${Math.min(100, (currentResults.breakdown.shopping / (currentResults.total || 1)) * 100)}%` }}></div>
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between font-semibold">
                    <span className="text-slate-600">Waste Ledger:</span>
                    <span className="font-bold text-slate-900 font-mono">{currentResults.breakdown.waste.toFixed(0)} kg</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-blue-600 h-full rounded-full transition-all duration-300" style={{ width: `${Math.min(100, (currentResults.breakdown.waste / (currentResults.total || 1)) * 100)}%` }}></div>
                  </div>
                </div>

              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      </div>
      )}
    </div>
  );
}






