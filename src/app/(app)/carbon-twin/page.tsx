/* eslint-disable react/no-unescaped-entities */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Leaf, Car, Home, ShoppingBag, Loader2, ArrowRight, Activity, Sparkles } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { getReportData } from '@/lib/reports';
import { useRouter } from 'next/navigation';

export default function CarbonTwin() {
  const [loading, setLoading] = useState(true);
  const [baseline, setBaseline] = useState<any>(null);
  
  // Slider states (percentages)
  const [publicTransport, setPublicTransport] = useState(0); 
  const [meatReduction, setMeatReduction] = useState(0); 
  const [energyEfficiency, setEnergyEfficiency] = useState(0); 
  const [shoppingReduction, setShoppingReduction] = useState(0); 

  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: assts } = await supabase.from('assessments').select('*').eq('user_id', user.id).order('created_at', { ascending: true });
        if (assts && assts.length > 0) {
          const reportData = getReportData(assts);
          setBaseline(reportData[reportData.length - 1]);
        }
      } else {
        // Fallback to locally cached baseline for guest users
        const localBaseline = localStorage.getItem('carbon_wise_completed_baseline');
        if (localBaseline) {
          try {
            setBaseline(JSON.parse(localBaseline));
          } catch (e) {
            console.error('Failed to parse local baseline:', e);
          }
        }
      }
      setLoading(false);
    }
    loadData();
  }, [supabase]);

  if (loading) {
    return <div className="h-[calc(100vh-8rem)] flex items-center justify-center"><Loader2 className="w-12 h-12 text-blue-600 animate-spin" /></div>;
  }

  // Handle empty state if user hasn't completed assessment
  if (!baseline) {
    return (
      <div className="max-w-4xl mx-auto flex flex-col items-center justify-center h-[calc(100vh-8rem)] text-center space-y-6 px-4 font-sans text-slate-800">
        <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center shadow-inner">
          <Activity className="w-12 h-12 text-[#0F172A] animate-pulse" />
        </div>
        <h2 className="text-section text-[#0F172A] font-serif">Unlock your Carbon Twin</h2>
        <p className="text-body text-slate-700 max-w-lg font-medium">
          The Carbon Twin simulates lifestyle modifications. It requires your baseline carbon footprint metrics to project accurate, personalized reductions.
        </p>
        <Button onClick={() => router.push('/assessment')} className="bg-[#0F172A] hover:bg-[#1E293B] text-white text-lg px-8 py-6 rounded-xl font-bold shadow-md cursor-pointer">
          Take Baseline Assessment <ArrowRight className="ml-2 w-5 h-5" />
        </Button>
      </div>
    );
  }

  // Calculate dynamic savings from sliders based on actual category footprint
  const transportBaseline = baseline.category_breakdown?.transport || 0;
  const energyBaseline = baseline.category_breakdown?.energy || 0;
  const dietBaseline = baseline.category_breakdown?.diet || 0;
  const shoppingBaseline = baseline.category_breakdown?.shopping || 0;

  // Potential savings formulas (Nature Conservancy scaling benchmarks)
  const transportSavings = (publicTransport / 100) * (transportBaseline * 0.7);
  const dietSavings = (meatReduction / 100) * (dietBaseline * 0.75);
  const energySavings = (energyEfficiency / 100) * (energyBaseline * 0.4);
  const shoppingSavings = (shoppingReduction / 100) * (shoppingBaseline * 0.5);

  const totalSavings = transportSavings + dietSavings + energySavings + shoppingSavings;
  const currentFootprint = baseline.total_emissions;
  const projectedFootprint = Math.max(0, currentFootprint - totalSavings);
  const percentageReduction = ((totalSavings / (currentFootprint || 1)) * 100).toFixed(1);

  return (
    <div className="space-y-12 max-w-7xl mx-auto px-4 py-4 text-slate-800 font-sans">
      <div className="flex justify-between items-start flex-wrap gap-4 pb-6 border-b border-slate-200">
        <div>
          <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
            Interactive Twin
          </span>
          <h1 className="text-page text-[#0F172A] mt-1 font-serif">Carbon Twin Simulator</h1>
          <p className="text-body text-slate-700 mt-2 font-medium">Interact with lifestyle sliders to model real-world reductions and simulate your lower-carbon twin.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sliders Panel */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="shadow-sm border border-slate-200 rounded-2xl bg-white">
            <CardHeader className="bg-[#FAFAF8] border-b border-slate-200 py-5">
              <CardTitle className="text-card text-[#0F172A] font-sans font-semibold text-base">Lifestyle Simulations</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-8">
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center text-sm font-bold text-slate-800">
                    <Car className="w-5 h-5 mr-2.5 text-blue-600" /> Public Transit Switch
                  </div>
                  <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full">{publicTransport}%</span>
                </div>
                <Slider defaultValue={[0]} max={100} step={5} onValueChange={(v: any) => setPublicTransport(v[0])} className="py-2" />
                <p className="text-xs text-slate-600 font-medium">Replace vehicle miles with trains, buses, or micro-mobility.</p>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center text-sm font-bold text-slate-800">
                    <Leaf className="w-5 h-5 mr-2.5 text-blue-600" /> Plant-Based Switch
                  </div>
                  <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full">{meatReduction}%</span>
                </div>
                <Slider defaultValue={[0]} max={100} step={5} onValueChange={(v: any) => setMeatReduction(v[0])} className="py-2" />
                <p className="text-xs text-slate-600 font-medium">Transition your diet away from high-carbon red meats and dairy.</p>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center text-sm font-bold text-slate-800">
                    <Home className="w-5 h-5 mr-2.5 text-blue-600" /> Home Energy Efficiency
                  </div>
                  <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full">{energyEfficiency}%</span>
                </div>
                <Slider defaultValue={[0]} max={100} step={5} onValueChange={(v: any) => setEnergyEfficiency(v[0])} className="py-2" />
                <p className="text-xs text-slate-600 font-medium">Install solar panels, use LED lighting, or lower your thermostat.</p>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center text-sm font-bold text-slate-800">
                    <ShoppingBag className="w-5 h-5 mr-2.5 text-blue-600" /> Conscious Shopping
                  </div>
                  <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full">{shoppingReduction}%</span>
                </div>
                <Slider defaultValue={[0]} max={100} step={5} onValueChange={(v: any) => setShoppingReduction(v[0])} className="py-2" />
                <p className="text-xs text-slate-600 font-medium">Reduce raw purchases, choose circular markets, and recycle more.</p>
              </div>

            </CardContent>
          </Card>
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Card className="shadow-sm bg-white border border-slate-200 rounded-2xl">
              <CardContent className="p-8 text-center space-y-2">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Current Footprint</h3>
                <div className="text-4xl sm:text-5xl font-black text-[#0F172A] font-mono">{(currentFootprint / 1000).toFixed(2)}</div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Tons COâ‚‚e / yr</span>
                <p className="text-xs text-slate-500 font-semibold">Your established baseline value</p>
              </CardContent>
            </Card>

            <Card className="shadow-md bg-[#0F172A] text-white border-0 rounded-2xl relative overflow-hidden">
              <div className="absolute -right-8 -bottom-8 w-44 h-44 bg-blue-900/20 rounded-full opacity-35"></div>
              <CardContent className="p-8 text-center space-y-2 relative z-10">
                <h3 className="text-xs font-bold text-blue-300 uppercase tracking-wider">Projected Twin Footprint</h3>
                <div className="text-4xl sm:text-5xl font-black text-white font-mono">{(projectedFootprint / 1000).toFixed(2)}</div>
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">Tons COâ‚‚e / yr</span>
                <p className="text-xs text-slate-400 font-semibold">Estimated with simulated reductions</p>
              </CardContent>
            </Card>
          </div>

          <Card className="shadow-sm border border-blue-100 bg-blue-50/15 rounded-2xl">
            <CardContent className="p-8 space-y-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                <div>
                  <h3 className="text-xl font-bold text-[#0F172A] mb-1 flex items-center gap-2 font-sans">
                    <Sparkles className="w-5 h-5 text-blue-600 animate-pulse" />
                    Ecological Savings Potential
                  </h3>
                  <p className="text-slate-600 text-sm max-w-lg font-semibold leading-relaxed">
                    By making the simulated adjustments, your Carbon Twin will produce significantly lower greenhouse gas emissions annually.
                  </p>
                </div>
                <div className="text-center sm:text-right flex-shrink-0">
                  <div className="text-4xl sm:text-5xl font-black text-blue-600 font-mono">-{percentageReduction}%</div>
                  <div className="text-xs font-bold text-[#0F172A] uppercase tracking-wider mt-1">Total Carbon Reduction</div>
                  <div className="text-blue-700 text-xs font-bold mt-1.5 bg-blue-50 px-3 py-1.5 rounded-full inline-block border border-blue-100">
                    Save {Math.round(totalSavings)} kg COâ‚‚e / yr
                  </div>
                </div>
              </div>

              {/* Dynamic Action Plan */}
              {totalSavings > 0 && (
                <div className="border-t border-blue-100 pt-6 space-y-3">
                  <h4 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider">Simulated Impact Report</h4>
                  <ul className="space-y-2.5 text-xs text-slate-700 font-medium">
                    {publicTransport > 0 && (
                      <li className="flex items-start gap-2">
                        <span className="text-blue-600 font-bold mt-0.5">*</span>
                        <span>Commuting changes saves <strong className="text-slate-900 font-semibold">{Math.round(transportSavings)} kg</strong> of COâ‚‚e by decreasing combustion engine fuel use.</span>
                      </li>
                    )}
                    {meatReduction > 0 && (
                      <li className="flex items-start gap-2">
                        <span className="text-blue-600 font-bold mt-0.5">*</span>
                        <span>Dietary adjustments saves <strong className="text-slate-900 font-semibold">{Math.round(dietSavings)} kg</strong> of COâ‚‚e by replacing high-intensity animal farming demand.</span>
                      </li>
                    )}
                    {energyEfficiency > 0 && (
                      <li className="flex items-start gap-2">
                        <span className="text-blue-600 font-bold mt-0.5">*</span>
                        <span>Electricity adjustments saves <strong className="text-slate-900 font-semibold">{Math.round(energySavings)} kg</strong> of COâ‚‚e by reducing electricity grid dependency.</span>
                      </li>
                    )}
                    {shoppingReduction > 0 && (
                      <li className="flex items-start gap-2">
                        <span className="text-blue-600 font-bold mt-0.5">*</span>
                        <span>Conscious shopping habits saves <strong className="text-slate-900 font-semibold">{Math.round(shoppingSavings)} kg</strong> of COâ‚‚e by selecting circular product streams.</span>
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}


