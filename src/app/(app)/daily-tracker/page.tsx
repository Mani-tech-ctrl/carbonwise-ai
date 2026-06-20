/* eslint-disable react/no-unescaped-entities */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Car, Flame, Leaf, Trash2, Save, Sparkles, Loader2, CheckCircle2, AlertCircle, ShoppingBag, Droplets, ArrowRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function DailyTracker() {
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  
  // Unit Toggle State: 'metric' (default) or 'imperial'
  const [unitSystem, setUnitSystem] = useState<'metric' | 'imperial'>('metric');

  // Daily Form inputs (defaults = 0)
  const [transportMiles, setTransportMiles] = useState<number>(0); // Displays in KM or Miles
  const [transportType, setTransportType] = useState<string>('petrol');
  const [electricityKwh, setElectricityKwh] = useState<number>(0);
  const [dietType, setDietType] = useState<string>('average');
  const [wasteKg, setWasteKg] = useState<number>(0); // Displays in kg or lbs
  const [recyclingKg, setRecyclingKg] = useState<number>(0); // Displays in kg or lbs
  const [clothingItems, setClothingItems] = useState<number>(0);
  const [electronicsItems, setElectronicsItems] = useState<number>(0);
  const [waterUsage, setWaterUsage] = useState<number>(0); // Displays in Liters or Gallons

  const [recentLogs, setRecentLogs] = useState<any[]>([]);

  const supabase = createClient();

  // Load saved unit system on mount
  useEffect(() => {
    const saved = localStorage.getItem('carbon_wise_unit_system');
    if (saved === 'imperial' || saved === 'metric') {
      setTimeout(() => {
        setUnitSystem(saved);
      }, 0);
    }
  }, []);

  const loadDailyLog = async (dateStr: string, activeUnit: 'metric' | 'imperial') => {
    setFetching(true);
    setErrorMsg(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: logs, error } = await supabase
        .from('daily_footprints')
        .select('*')
        .eq('user_id', user.id)
        .eq('log_date', dateStr);

      if (error) throw error;

      if (logs && logs.length > 0) {
        const log = logs[0];
        const inputs = log.raw_inputs || {};
        
        // Stored values are always in METRIC
        const storedMiles = Number(inputs.transportMiles ?? 0); // KM
        const storedWaste = Number(inputs.wasteKg ?? 0); // kg
        const storedRecy = Number(inputs.recyclingKg ?? 0); // kg
        const storedWater = Number(inputs.waterLiters ?? 0); // Liters
        
        // Convert to display units based on activeUnit
        if (activeUnit === 'imperial') {
          setTransportMiles(Number((storedMiles / 1.60934).toFixed(2)));
          setWasteKg(Number((storedWaste / 0.453592).toFixed(2)));
          setRecyclingKg(Number((storedRecy / 0.453592).toFixed(2)));
          setWaterUsage(Number((storedWater / 3.78541).toFixed(2)));
        } else {
          setTransportMiles(storedMiles);
          setWasteKg(storedWaste);
          setRecyclingKg(storedRecy);
          setWaterUsage(storedWater);
        }

        setTransportType(inputs.transportType ?? 'petrol');
        setElectricityKwh(Number(inputs.electricityKwh ?? 0));
        setDietType(inputs.dietType ?? 'average');
        setClothingItems(Number(inputs.shoppingClothing ?? 0));
        setElectronicsItems(Number(inputs.shoppingElectronics ?? 0));
      } else {
        // Reset to default zero values
        setTransportMiles(0);
        setTransportType('petrol');
        setElectricityKwh(0);
        setDietType('average');
        setWasteKg(0);
        setRecyclingKg(0);
        setClothingItems(0);
        setElectronicsItems(0);
        setWaterUsage(0);
      }
    } catch (err: any) {
      console.error('Failed to load daily log:', err);
      setErrorMsg(err.message || 'Error fetching daily log.');
    } finally {
      setFetching(false);
    }
  };

  const loadRecentLogs = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: list, error } = await supabase
        .from('daily_footprints')
        .select('*')
        .eq('user_id', user.id)
        .order('log_date', { ascending: false })
        .limit(5);

      if (error) throw error;
      setRecentLogs(list || []);
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch when date changes
  useEffect(() => {
    const timer = setTimeout(() => {
      loadDailyLog(selectedDate, unitSystem);
      loadRecentLogs();
    }, 0);
    return () => clearTimeout(timer);
  }, [selectedDate]);

  // Handle unit conversions on button toggle
  const handleUnitSystemChange = (sys: 'metric' | 'imperial') => {
    if (sys === unitSystem) return;
    setUnitSystem(sys);
    localStorage.setItem('carbon_wise_unit_system', sys);
    
    if (sys === 'imperial') {
      // Metric -> Imperial
      setTransportMiles(prev => Number((prev / 1.60934).toFixed(2)));
      setWasteKg(prev => Number((prev / 0.453592).toFixed(2)));
      setRecyclingKg(prev => Number((prev / 0.453592).toFixed(2)));
      setWaterUsage(prev => Number((prev / 3.78541).toFixed(2)));
    } else {
      // Imperial -> Metric
      setTransportMiles(prev => Number((prev * 1.60934).toFixed(2)));
      setWasteKg(prev => Number((prev * 0.453592).toFixed(2)));
      setRecyclingKg(prev => Number((prev * 0.453592).toFixed(2)));
      setWaterUsage(prev => Number((prev * 3.78541).toFixed(2)));
    }
  };

  // Real-time calculation helper
  const calculateRealTimeDailyEmissions = () => {
    let transportKm = transportMiles;
    let generalWasteKg = wasteKg;
    let recycledWasteKg = recyclingKg;
    let waterLiters = waterUsage;

    if (unitSystem === 'imperial') {
      transportKm = transportMiles * 1.60934;
      generalWasteKg = wasteKg * 0.453592;
      recycledWasteKg = recyclingKg * 0.453592;
      waterLiters = waterUsage * 3.78541;
    }

    const carFactors: Record<string, number> = { petrol: 0.192, diesel: 0.171, ev: 0.053 };
    const electricityFactor = 0.385; // US grid coefficient
    const dietFactors: Record<string, number> = {
      heavy_meat: 3.3,
      average: 2.5,
      pescatarian: 1.9,
      vegetarian: 1.7,
      vegan: 1.5
    };
    const wasteFactor = 0.58;
    const recyclingFactor = 0.02; // recycling mitigates footprint
    const shoppingClothingFactor = 15.0; // kg CO2 per item
    const shoppingElectronicsFactor = 50.0; // kg CO2 per item
    const waterFactor = 0.0003; // kg CO2 per Liter

    const transEmissions = transportKm * (carFactors[transportType] || 0);
    const elecEmissions = electricityKwh * electricityFactor;
    const foodEmissions = dietFactors[dietType] || 0;
    const wsEmissions = (generalWasteKg * wasteFactor) + (recycledWasteKg * recyclingFactor);
    const shoppingEmissions = (clothingItems * shoppingClothingFactor) + (electronicsItems * shoppingElectronicsFactor);
    const waterEmissions = waterLiters * waterFactor;

    const total = transEmissions + elecEmissions + foodEmissions + wsEmissions + shoppingEmissions + waterEmissions;
    return {
      total,
      breakdown: {
        transport: transEmissions,
        electricity: elecEmissions,
        diet: foodEmissions,
        waste: wsEmissions,
        shopping: shoppingEmissions,
        water: waterEmissions
      }
    };
  };

  const realTimeEmissions = calculateRealTimeDailyEmissions();

  const handleSave = async () => {
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    // Form Validation Checks
    if (
      transportMiles === undefined || isNaN(transportMiles) || transportMiles < 0 ||
      electricityKwh === undefined || isNaN(electricityKwh) || electricityKwh < 0 ||
      wasteKg === undefined || isNaN(wasteKg) || wasteKg < 0 ||
      recyclingKg === undefined || isNaN(recyclingKg) || recyclingKg < 0 ||
      clothingItems === undefined || isNaN(clothingItems) || clothingItems < 0 ||
      electronicsItems === undefined || isNaN(electronicsItems) || electronicsItems < 0 ||
      waterUsage === undefined || isNaN(waterUsage) || waterUsage < 0
    ) {
      setErrorMsg("Validation Error: Inputs cannot be blank, negative, or non-numeric.");
      setLoading(false);
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Unauthenticated session. Please log in.');

      // Convert displays values to METRIC internally for database storage
      let transportKm = transportMiles;
      let generalWasteKg = wasteKg;
      let recycledWasteKg = recyclingKg;
      let waterLiters = waterUsage;

      if (unitSystem === 'imperial') {
        transportKm = transportMiles * 1.60934;
        generalWasteKg = wasteKg * 0.453592;
        recycledWasteKg = recyclingKg * 0.453592;
        waterLiters = waterUsage * 3.78541;
      }

      // Emission calculations matches realTime calculations
      const emissionsResult = calculateRealTimeDailyEmissions();

      const payload = {
        user_id: user.id,
        log_date: selectedDate,
        transport_emissions: emissionsResult.breakdown.transport,
        electricity_emissions: emissionsResult.breakdown.electricity,
        food_emissions: emissionsResult.breakdown.diet,
        waste_emissions: emissionsResult.breakdown.waste,
        total_emissions: emissionsResult.total,
        raw_inputs: {
          transportMiles: transportKm, // always KM
          transportType,
          electricityKwh,
          dietType,
          wasteKg: generalWasteKg, // always kg
          recyclingKg: recycledWasteKg, // always kg
          shoppingClothing: clothingItems,
          shoppingElectronics: electronicsItems,
          waterLiters: waterLiters, // always Liters
          shopping_emissions: emissionsResult.breakdown.shopping,
          water_emissions: emissionsResult.breakdown.water
        }
      };

      const { error } = await supabase
        .from('daily_footprints')
        .upsert(payload, { onConflict: 'user_id,log_date' });

      if (error) throw error;

      setSuccessMsg('Daily carbon footprint logged successfully!');
      loadRecentLogs();
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to save daily log.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Header section with Unit Toggle */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-6 border-b border-slate-200">
        <div>
          <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
            Daily Ledger
          </span>
          <h1 className="text-page text-[#0F172A] mt-1 font-serif">Daily Carbon Tracker</h1>
          <p className="text-body text-slate-700 font-medium">Track your daily emissions and build your sustainability history.</p>
        </div>

        {/* Metric vs Imperial Toggle */}
        <div className="bg-slate-100 p-1.5 rounded-2xl border border-slate-200 flex items-center shadow-sm">
          <button
            onClick={() => handleUnitSystemChange('metric')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              unitSystem === 'metric' 
                ? 'bg-[#0F172A] text-white shadow-sm' 
                : 'text-slate-700 hover:text-[#0F172A]'
            }`}
          >
            Metric (KM, kg, Liters)
          </button>
          <button
            onClick={() => handleUnitSystemChange('imperial')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              unitSystem === 'imperial' 
                ? 'bg-[#0F172A] text-white shadow-sm' 
                : 'text-slate-700 hover:text-[#0F172A]'
            }`}
          >
            Imperial (Miles, lbs, Gal)
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4.5 flex items-center gap-3 shadow-sm animate-in fade-in duration-200">
          <CheckCircle2 className="w-5.5 h-5.5 text-blue-600 shrink-0" />
          <span className="text-small font-bold text-slate-900">{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="bg-red-50 border border-red-200 p-4.5 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5.5 h-5.5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-red-800 text-xs">Validation Failure</h4>
            <p className="text-xs text-red-700 font-medium mt-0.5">{errorMsg}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Daily Input Form */}
        <div className="lg:col-span-2">
          <Card className="shadow-sm border border-slate-200 rounded-3xl overflow-hidden bg-white">
            <CardHeader className="bg-[#0F172A] text-white p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 w-full">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-slate-800 rounded-xl flex items-center justify-center border border-slate-700">
                    <Calendar className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Calendar Entry</span>
                    <CardTitle className="text-card text-white mt-0.5 font-sans font-semibold text-lg">Select Date & Log Activities</CardTitle>
                  </div>
                </div>
                <input 
                  type="date" 
                  value={selectedDate} 
                  onChange={(e) => setSelectedDate(e.target.value)} 
                  className="bg-slate-800 border border-slate-700 text-white font-semibold rounded-xl px-4 py-2 focus:outline-none focus:ring-1 focus:ring-blue-400 text-xs font-mono shadow-sm cursor-pointer"
                />
              </div>
            </CardHeader>
            <CardContent className="p-6 sm:p-8 space-y-6">
              {fetching ? (
                <div className="py-16 flex justify-center items-center gap-2 text-slate-700 font-bold text-small">
                  <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                  Retrieving daily records...
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Transportation */}
                  <div className="space-y-4 border border-slate-200 rounded-2xl p-5 bg-[#FAFAF8]">
                    <div className="flex items-center gap-2 font-bold text-[#0F172A] text-small">
                      <Car className="w-4.5 h-4.5 text-blue-600" />
                      Transportation Commute
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-caption font-bold text-slate-700 uppercase">
                        Distance ({unitSystem === 'metric' ? 'KM' : 'Miles'})
                      </label>
                      <Input 
                        type="number" 
                        min="0" 
                        value={transportMiles} 
                        onChange={(e) => setTransportMiles(Math.max(0, parseFloat(e.target.value) || 0))}
                        className="bg-white border-slate-300 focus-visible:ring-blue-600 font-mono text-small rounded-xl h-11"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-caption font-bold text-slate-700 uppercase">Engine Type</label>
                      <Select value={transportType} onValueChange={(val) => setTransportType(val || 'petrol')}>
                        <SelectTrigger className="bg-white border-slate-300 focus:ring-blue-600 text-small font-semibold rounded-xl h-11">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="petrol">Petrol (Gasoline)</SelectItem>
                          <SelectItem value="diesel">Diesel</SelectItem>
                          <SelectItem value="ev">Electric (EV)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Electricity */}
                  <div className="space-y-4 border border-slate-200 rounded-2xl p-5 bg-[#FAFAF8]">
                    <div className="flex items-center gap-2 font-bold text-[#0F172A] text-small">
                      <Flame className="w-4.5 h-4.5 text-blue-600" />
                      Electricity Usage
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-caption font-bold text-slate-700 uppercase">Electricity Used (kWh)</label>
                      <Input 
                        type="number" 
                        min="0" 
                        value={electricityKwh} 
                        onChange={(e) => setElectricityKwh(Math.max(0, parseFloat(e.target.value) || 0))}
                        className="bg-white border-slate-300 focus-visible:ring-blue-600 font-mono text-small rounded-xl h-11"
                      />
                    </div>
                    <p className="text-[10px] text-slate-500 leading-normal font-semibold">Log your daily grid consumption.</p>
                  </div>

                  {/* Food */}
                  <div className="space-y-4 border border-slate-200 rounded-2xl p-5 bg-[#FAFAF8]">
                    <div className="flex items-center gap-2 font-bold text-[#0F172A] text-small">
                      <Leaf className="w-4.5 h-4.5 text-blue-600" />
                      Food & Diet
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-caption font-bold text-slate-700 uppercase">Dietary Profile</label>
                      <Select value={dietType} onValueChange={(val) => setDietType(val || 'average')}>
                        <SelectTrigger className="bg-white border-slate-300 focus:ring-blue-600 text-small font-semibold rounded-xl h-11">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="heavy_meat">Heavy Meat (Daily red meat)</SelectItem>
                          <SelectItem value="average">Average / Mixed diet</SelectItem>
                          <SelectItem value="pescatarian">Pescatarian (Fish only)</SelectItem>
                          <SelectItem value="vegetarian">Vegetarian (No meat/seafood)</SelectItem>
                          <SelectItem value="vegan">Vegan (Strictly plant-based)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Waste */}
                  <div className="space-y-4 border border-slate-200 rounded-2xl p-5 bg-[#FAFAF8]">
                    <div className="flex items-center gap-2 font-bold text-[#0F172A] text-small">
                      <Trash2 className="w-4.5 h-4.5 text-blue-600" />
                      Waste & Recycling
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-caption font-bold text-slate-700 uppercase">
                        General Waste ({unitSystem === 'metric' ? 'kg' : 'lbs'})
                      </label>
                      <Input 
                        type="number" 
                        min="0" 
                        value={wasteKg} 
                        onChange={(e) => setWasteKg(Math.max(0, parseFloat(e.target.value) || 0))}
                        className="bg-white border-slate-200 focus-visible:ring-blue-600 font-mono text-small rounded-xl h-11"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-caption font-bold text-slate-700 uppercase">
                        Recycled Waste ({unitSystem === 'metric' ? 'kg' : 'lbs'})
                      </label>
                      <Input 
                        type="number" 
                        min="0" 
                        value={recyclingKg} 
                        onChange={(e) => setRecyclingKg(Math.max(0, parseFloat(e.target.value) || 0))}
                        className="bg-white border-slate-200 focus-visible:ring-blue-600 font-mono text-small rounded-xl h-11"
                      />
                    </div>
                  </div>

                  {/* Shopping */}
                  <div className="space-y-4 border border-slate-200 rounded-2xl p-5 bg-[#FAFAF8]">
                    <div className="flex items-center gap-2 font-bold text-[#0F172A] text-small">
                      <ShoppingBag className="w-4.5 h-4.5 text-blue-600" />
                      Shopping Purchases
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-caption font-bold text-slate-700 uppercase">Clothing Items purchased</label>
                      <Input 
                        type="number" 
                        min="0" 
                        value={clothingItems} 
                        onChange={(e) => setClothingItems(Math.max(0, parseInt(e.target.value) || 0))}
                        className="bg-white border-slate-200 focus-visible:ring-blue-600 font-mono text-small rounded-xl h-11"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-caption font-bold text-slate-700 uppercase">Electronics purchased</label>
                      <Input 
                        type="number" 
                        min="0" 
                        value={electronicsItems} 
                        onChange={(e) => setElectronicsItems(Math.max(0, parseInt(e.target.value) || 0))}
                        className="bg-white border-slate-200 focus-visible:ring-blue-600 font-mono text-small rounded-xl h-11"
                      />
                    </div>
                  </div>

                  {/* Water Usage */}
                  <div className="space-y-4 border border-slate-200 rounded-2xl p-5 bg-[#FAFAF8]">
                    <div className="flex items-center gap-2 font-bold text-[#0F172A] text-small">
                      <Droplets className="w-4.5 h-4.5 text-blue-600" />
                      Water Usage
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-caption font-bold text-slate-700 uppercase">
                        Water Consumed ({unitSystem === 'metric' ? 'Liters' : 'Gallons'})
                      </label>
                      <Input 
                        type="number" 
                        min="0" 
                        value={waterUsage} 
                        onChange={(e) => setWaterUsage(Math.max(0, parseFloat(e.target.value) || 0))}
                        className="bg-white border-slate-200 focus-visible:ring-blue-600 font-mono text-small rounded-xl h-11"
                      />
                    </div>
                    <p className="text-[10px] text-slate-500 leading-normal font-semibold">Includes showers, taps, and landscaping.</p>
                  </div>

                </div>
              )}
            </CardContent>
            {!fetching && (
              <CardFooter className="bg-[#FAFAF8] border-t border-slate-200 px-6 sm:px-8 py-5 flex justify-end">
                <Button onClick={handleSave} disabled={loading} className="bg-[#0F172A] hover:bg-[#1E293B] text-white font-semibold h-12 px-8 rounded-xl text-xs cursor-pointer shadow-sm">
                  {loading ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Save className="w-4 h-4 mr-1.5" />}
                  Save Daily Entry
                </Button>
              </CardFooter>
            )}
          </Card>
        </div>

        {/* Real-time Forecast and Recent logs sidebar */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* REAL-TIME EMISSION WIDGET */}
          <Card className="shadow-sm border border-slate-200 bg-white rounded-3xl overflow-hidden">
            <CardHeader className="bg-[#0F172A] text-white py-5 px-6">
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-white">
                <Sparkles className="w-4.5 h-4.5 text-blue-400" />
                Live Carbon Projection
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6 text-slate-800">
              <div className="text-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Calculated for Today</span>
                <div className="text-4xl font-black text-[#0F172A] mt-1 font-mono">
                  {realTimeEmissions.total.toFixed(2)}
                </div>
                <span className="text-xs font-bold text-blue-600 block mt-0.5">kg COâ‚‚e</span>
              </div>

              <div className="border-t border-slate-100 pt-5 space-y-3.5">
                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Category Breakdown</h4>
                
                {/* Vectors */}
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between font-semibold">
                    <span className="text-slate-600">Transportation:</span>
                    <span className="font-bold text-slate-900 font-mono">{realTimeEmissions.breakdown.transport.toFixed(1)} kg</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-blue-600 h-full rounded-full transition-all" style={{ width: `${Math.min(100, (realTimeEmissions.breakdown.transport / (realTimeEmissions.total || 1)) * 100)}%` }}></div>
                  </div>
                </div>

                <div className="space-y-1 text-xs">
                  <div className="flex justify-between font-semibold">
                    <span className="text-slate-600">Electricity:</span>
                    <span className="font-bold text-slate-900 font-mono">{realTimeEmissions.breakdown.electricity.toFixed(1)} kg</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-blue-600 h-full rounded-full transition-all" style={{ width: `${Math.min(100, (realTimeEmissions.breakdown.electricity / (realTimeEmissions.total || 1)) * 100)}%` }}></div>
                  </div>
                </div>

                <div className="space-y-1 text-xs">
                  <div className="flex justify-between font-semibold">
                    <span className="text-slate-600">Food Intake:</span>
                    <span className="font-bold text-slate-900 font-mono">{realTimeEmissions.breakdown.diet.toFixed(1)} kg</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-blue-600 h-full rounded-full transition-all" style={{ width: `${Math.min(100, (realTimeEmissions.breakdown.diet / (realTimeEmissions.total || 1)) * 100)}%` }}></div>
                  </div>
                </div>

                <div className="space-y-1 text-xs">
                  <div className="flex justify-between font-semibold">
                    <span className="text-slate-600">Shopping:</span>
                    <span className="font-bold text-slate-900 font-mono">{realTimeEmissions.breakdown.shopping.toFixed(1)} kg</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-blue-600 h-full rounded-full transition-all" style={{ width: `${Math.min(100, (realTimeEmissions.breakdown.shopping / (realTimeEmissions.total || 1)) * 100)}%` }}></div>
                  </div>
                </div>

                <div className="space-y-1 text-xs">
                  <div className="flex justify-between font-semibold">
                    <span className="text-slate-600">Waste:</span>
                    <span className="font-bold text-slate-900 font-mono">{realTimeEmissions.breakdown.waste.toFixed(1)} kg</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-blue-600 h-full rounded-full transition-all" style={{ width: `${Math.min(100, (realTimeEmissions.breakdown.waste / (realTimeEmissions.total || 1)) * 100)}%` }}></div>
                  </div>
                </div>

                <div className="space-y-1 text-xs">
                  <div className="flex justify-between font-semibold">
                    <span className="text-slate-600">Water usage:</span>
                    <span className="font-bold text-slate-900 font-mono">{realTimeEmissions.breakdown.water.toFixed(1)} kg</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-blue-600 h-full rounded-full transition-all" style={{ width: `${Math.min(100, (realTimeEmissions.breakdown.water / (realTimeEmissions.total || 1)) * 100)}%` }}></div>
                  </div>
                </div>

              </div>
            </CardContent>
          </Card>

          {/* RECENT SUBMISSIONS PANEL */}
          <Card className="shadow-sm border border-slate-200 bg-white rounded-3xl overflow-hidden">
            <CardHeader className="bg-[#0F172A] text-white py-5 px-6">
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-white">
                <Sparkles className="w-4.5 h-4.5 text-blue-400" />
                Recent Logs
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {recentLogs.length === 0 ? (
                <p className="text-caption text-slate-400 font-semibold uppercase text-center py-8">No footprints logged yet.</p>
              ) : (
                <div className="space-y-3">
                  {recentLogs.map((log, idx) => (
                    <div key={idx} className="bg-[#FAFAF8] border border-slate-200 rounded-2xl p-4 flex justify-between items-center hover:shadow-md transition-shadow">
                      <div className="space-y-0.5">
                        <div className="text-xs font-bold text-[#0F172A] font-mono">{log.log_date}</div>
                        <div className="text-[9px] text-slate-500 font-bold uppercase">
                          T: {Math.round(log.raw_inputs?.transportMiles || 0)}KM | E: {Math.round(log.raw_inputs?.electricityKwh || 0)}kWh
                        </div>
                      </div>
                      <span className="text-xs font-bold text-blue-600 font-mono">
                        {Number(log.total_emissions || 0).toFixed(1)} kg
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}


