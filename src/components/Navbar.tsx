/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  Activity, BarChart3, ChevronDown, LogOut, Menu, Sparkles, User, Settings, FileText, X 
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { triggerAuthModal } from '@/components/AuthModal';

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const profileRef = useRef<HTMLDivElement>(null);

  const [user, setUser] = useState<any>(null);
  const [name, setName] = useState('');
  const [role, setRole] = useState('user');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (!user) {
        setName('');
        setRole('user');
        return;
      }
      const { data: profile } = await supabase.from('profiles').select('full_name, role').eq('id', user.id).maybeSingle();
      const userName = user.user_metadata?.display_name || profile?.full_name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';
      setName(userName);
      setRole(profile?.role || 'user');
    }

    loadUser();
    
    // Listen for custom profile update event
    window.addEventListener('profile-updated', loadUser);

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadUser();
      } else {
        setName('');
        setRole('user');
      }
    });

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('profile-updated', loadUser);
    };
  }, [supabase]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setMobileMenuOpen(false);
      setProfileDropdownOpen(false);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [pathname]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setProfileDropdownOpen(false);
    router.push('/login');
  };

  const isActive = (href: string) => href === '/' ? pathname === '/' : pathname.startsWith(href);

  // Dynamic Navigation Links
  const getNavLinks = () => {
    if (user) {
      const links = [
        { href: '/', label: 'Home' },
        { href: '/dashboard', label: 'Dashboard' },
        { href: '/assessment', label: 'Calculator' },
        { href: '/daily-tracker', label: 'Daily Tracker' },
        { href: '/reports', label: 'Reports' },
        { href: '/insights', label: 'AI Insights' },
        { href: '/articles', label: 'Articles' },
      ];
      if (role === 'admin') {
        links.push({ href: '/admin', label: 'Admin' });
      }
      return links;
    } else {
      return [
        { href: '/', label: 'Home' },
        { href: '/assessment', label: 'Calculator' },
        { href: '/carbon-twin', label: 'Carbon Twin' },
        { href: '/articles', label: 'Articles' },
        { href: '/about', label: 'About' },
      ];
    }
  };

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    const protectedRoutes = ['/dashboard', '/daily-tracker', '/reports', '/insights', '/profile'];
    const isProtected = protectedRoutes.some(route => href === route || href.startsWith(route + '/'));
    
    if (isProtected && !user) {
      e.preventDefault();
      triggerAuthModal();
    }
  };

  const navLinks = getNavLinks();

  return (
    <nav className="fixed left-0 right-0 top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0F172A] text-white shadow-sm">
            <BarChart3 className="h-5 w-5 text-[#F59E0B]" />
          </span>
          <span className="text-lg font-black tracking-normal text-[#0F172A]">CarbonWise<span className="text-[#2563EB]">.</span></span>
        </Link>

        {/* Desktop Navigation Links */}
        <div className="hidden items-center gap-1 lg:flex">
          {navLinks.map((link) => (
            <Link 
              key={link.href} 
              href={link.href} 
              onClick={(e) => handleLinkClick(e, link.href)}
              className={`rounded-lg px-3 py-2 text-sm font-bold transition ${isActive(link.href) ? 'bg-blue-50 text-[#2563EB]' : 'text-slate-700 hover:bg-slate-50 hover:text-[#0F172A]'}`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Desktop CTA / Profile Dropdown */}
        <div className="hidden items-center gap-3 lg:flex">
          {user ? (
            <div className="relative" ref={profileRef}>
              <button
                type="button"
                onClick={() => setProfileDropdownOpen((open) => !open)}
                className="flex items-center gap-2 rounded-full border border-slate-200 bg-white py-1.5 pl-2 pr-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-2"
                aria-expanded={profileDropdownOpen}
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#0F172A] text-xs text-white">
                  {name ? name.charAt(0).toUpperCase() : <User className="h-4 w-4" />}
                </span>
                <span className="max-w-32 truncate">{name || 'Account'}</span>
                <ChevronDown className={`h-4 w-4 transition ${profileDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
                  <div className="border-b border-slate-100 px-3 py-3">
                    <p className="text-xs font-semibold text-slate-500">Signed in as</p>
                    <p className="truncate text-sm font-bold text-[#0F172A]">{user.email}</p>
                  </div>
                  <Link href="/profile" className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"><User className="h-4 w-4" />Profile</Link>
                  <Link href="/profile" className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"><Settings className="h-4 w-4" />Settings</Link>
                  <Link href="/reports" className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"><FileText className="h-4 w-4" />Reports</Link>
                  {role === 'admin' && (
                    <Link href="/admin" className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold text-[#2563EB] hover:bg-blue-50">
                      <Settings className="h-4 w-4 text-[#2563EB]" />
                      Admin Panel
                    </Link>
                  )}
                  <button type="button" onClick={handleLogout} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-bold text-red-600 hover:bg-red-50 cursor-pointer"><LogOut className="h-4 w-4" />Log out</button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link href="/login" className="rounded-lg px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 hover:text-[#0F172A]">Login</Link>
              <Link href="/signup" className="rounded-xl bg-[#2563EB] px-4 py-2.5 text-sm font-bold text-white shadow-sm shadow-blue-600/20 hover:bg-blue-700">Get Started</Link>
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen((open) => !open)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-[#0F172A] lg:hidden"
          aria-label="Toggle navigation menu"
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="border-t border-slate-200 bg-white px-4 py-4 shadow-xl lg:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-1">
            {navLinks.map((link) => (
              <Link 
                key={link.href} 
                href={link.href} 
                onClick={(e) => handleLinkClick(e, link.href)}
                className="rounded-xl px-3 py-3 text-sm font-bold text-slate-800 hover:bg-blue-50"
              >
                {link.label}
              </Link>
            ))}
            
            <div className="mt-2 border-t border-slate-100 pt-3">
              {user ? (
                <button 
                  type="button" 
                  onClick={handleLogout} 
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-600 cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />Log out
                </button>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2">
                  <Link href="/login" className="rounded-xl border border-slate-200 px-4 py-3 text-center text-sm font-bold text-slate-800">Login</Link>
                  <Link href="/signup" className="rounded-xl bg-[#2563EB] px-4 py-3 text-center text-sm font-bold text-white">Get Started</Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
