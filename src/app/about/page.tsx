import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Leaf, Shield, Globe, Award, Compass, HeartHandshake } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#FCFCFC] flex flex-col pt-16 font-sans text-[#111827]">
      
      {/* 1. HERO HEADER */}
      <section className="bg-[#0F172A] text-white py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center opacity-25 mix-blend-overlay" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&q=80&w=1600')` }}></div>
        <div className="max-w-4xl mx-auto text-center px-4 relative z-10 space-y-6">
          <span className="text-[10px] font-bold tracking-widest text-blue-200 uppercase bg-slate-950/60 border border-blue-800/40 px-3.5 py-1.5 rounded-full inline-block">
            Our Core Mission
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
            Empowering Conscious Environmental Action
          </h1>
          <p className="text-sm sm:text-base text-gray-300 max-w-xl mx-auto leading-relaxed">
            CarbonWise AI is designed to democratize high-fidelity climate tracking, bringing Stripe-level SaaS quality to global sustainability initiatives.
          </p>
        </div>
      </section>

      {/* 2. VALUE PROPOSITION GRID */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white border border-gray-150 rounded-2xl p-8 shadow-sm">
            <div className="h-10 w-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-700 mb-6">
              <Shield className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-950 mb-3">Science-Based Audits</h3>
            <p className="text-gray-500 text-xs leading-relaxed font-medium">
              We employ carbon calculations aligned with the greenhouse Gas (GHG) Protocol Scope 1, 2, and 3 emission benchmarks, ensuring compliance and precision.
            </p>
          </div>

          <div className="bg-white border border-gray-150 rounded-2xl p-8 shadow-sm">
            <div className="h-10 w-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-700 mb-6">
              <Globe className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-950 mb-3">UN Environment Goals</h3>
            <p className="text-gray-500 text-xs leading-relaxed font-medium">
              Inspired by the United Nations Environment Programme (UNEP) initiatives, our trackers are optimized to align individual action with regional policy targets.
            </p>
          </div>

          <div className="bg-white border border-gray-150 rounded-2xl p-8 shadow-sm">
            <div className="h-10 w-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-800 mb-6">
              <Award className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-950 mb-3">Verified Offsets</h3>
            <p className="text-gray-500 text-xs leading-relaxed font-medium">
              Through planned integrations with Climate Impact Partners, offsets purchased on CarbonWise will represent high-trust, verified environmental projects.
            </p>
          </div>
        </div>
      </section>

      {/* 3. PARTNERS & METHODOLOGY DETAILED */}
      <section className="bg-[#F5F7FA] border-y border-gray-150 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="lg:w-1/2 space-y-6">
              <span className="text-slate-800 text-xs font-extrabold uppercase tracking-widest block">Strategic Benchmarks</span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-950">Partnership Vision</h2>
              <p className="text-gray-600 text-xs sm:text-sm leading-relaxed font-medium">
                To build a high-fidelity carbon calculator, we studied the core public reports published by The Nature Conservancy, UNEP, and carbon-credit authorities.
              </p>
              <p className="text-gray-650 text-xs sm:text-sm leading-relaxed font-medium">
                Our database translates regional grid mixes (e.g. electrical grid emissions per kWh in different zip codes) and agricultural lifecycle calculations into simple, everyday inputs.
              </p>
            </div>
            <div className="lg:w-1/2 bg-white rounded-3xl p-8 border border-gray-200 shadow-sm grid grid-cols-2 gap-6">
              <div className="p-4 border border-gray-100 rounded-2xl bg-gray-50/50 flex flex-col justify-between min-h-[120px]">
                <span className="text-[10px] text-gray-400 font-bold uppercase">Source Data</span>
                <span className="font-extrabold text-[#0F172A] text-xs">The Nature Conservancy</span>
              </div>
              <div className="p-4 border border-gray-100 rounded-2xl bg-gray-50/50 flex flex-col justify-between min-h-[120px]">
                <span className="text-[10px] text-gray-400 font-bold uppercase">Standards</span>
                <span className="font-extrabold text-[#0F172A] text-xs">UN Environment (UNEP)</span>
              </div>
              <div className="p-4 border border-gray-100 rounded-2xl bg-gray-50/50 flex flex-col justify-between min-h-[120px]">
                <span className="text-[10px] text-gray-400 font-bold uppercase">Off-setting</span>
                <span className="font-extrabold text-[#0F172A] text-xs">Climate Impact Partners</span>
              </div>
              <div className="p-4 border border-gray-100 rounded-2xl bg-gray-50/50 flex flex-col justify-between min-h-[120px]">
                <span className="text-[10px] text-gray-400 font-bold uppercase">Methodology</span>
                <span className="font-extrabold text-[#0F172A] text-xs">GHG Protocol Scope 1-3</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 4. CTA */}
      <section className="py-20 text-center max-w-4xl mx-auto px-4 space-y-6">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-950">
          Ready to discover your footprint?
        </h2>
        <p className="text-gray-550 text-xs sm:text-sm max-w-xl mx-auto">
          Start your baseline audit and receive personalized recommendations in less than 5 minutes. No credit card required.
        </p>
        <div>
          <Link href="/assessment">
            <Button className="bg-[#0F172A] hover:bg-[#082a21] text-white px-8 py-3.5 h-12 rounded-xl text-sm font-bold shadow-md cursor-pointer">
              Launch Carbon Calculator
            </Button>
          </Link>
        </div>
      </section>

    </div>
  );
}


