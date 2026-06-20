'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function AuthModal() {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener('open-auth-modal', handleOpen);
    return () => window.removeEventListener('open-auth-modal', handleOpen);
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm animate-in fade-in duration-200" role="dialog" aria-modal="true">
      <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl border border-slate-200/80 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-slate-100 p-6 bg-slate-50/50">
          <h3 className="font-serif text-lg font-bold text-[#0F172A]">Create Your Free CarbonWise Account</h3>
          <button 
            type="button" 
            onClick={() => setIsOpen(false)} 
            className="rounded-full p-1.5 text-slate-500 hover:bg-slate-100 hover:text-[#0F172A] transition cursor-pointer"
            aria-label="Close modal"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>
        <div className="p-6 space-y-6">
          <p className="text-sm leading-relaxed text-slate-650 font-semibold">
            Save your assessments, track emissions over time, unlock AI insights, and generate detailed sustainability reports.
          </p>
          <div className="space-y-3">
            {[
              'Save assessment history',
              'Daily emissions tracking',
              'Personalized AI recommendations',
              'Downloadable reports',
              'Carbon reduction analytics'
            ].map((benefit) => (
              <div key={benefit} className="flex items-center gap-3 text-xs font-bold text-slate-700">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                  <Check className="h-3 w-3 stroke-[3]" />
                </span>
                {benefit}
              </div>
            ))}
          </div>
          <div className="grid gap-2.5 pt-2">
            <Button
              onClick={() => {
                setIsOpen(false);
                router.push('/signup');
              }}
              className="w-full bg-[#2563EB] hover:bg-blue-700 text-white font-bold rounded-xl h-11 text-xs cursor-pointer shadow-sm"
            >
              Create Free Account
            </Button>
            <Button
              onClick={() => {
                setIsOpen(false);
                router.push('/login');
              }}
              variant="outline"
              className="w-full border-slate-350 text-slate-800 hover:bg-slate-50 bg-white font-bold rounded-xl h-11 text-xs cursor-pointer shadow-sm"
            >
              Login
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function triggerAuthModal() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('open-auth-modal'));
  }
}
