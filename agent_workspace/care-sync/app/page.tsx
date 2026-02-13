'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Heart, Shield, Mic, Camera, Lock, Users, Calendar, Activity,
  ChevronRight, ArrowRight, Sparkles, Clock, CheckCircle2,
  AlertTriangle, Phone, Pill, FileText, Upload, Eye,
  Sun, Moon, Plus, Bell, Search, MoreHorizontal,
  MessageCircle, TrendingUp, Zap, Star, Play, Square,
} from 'lucide-react';

// ─── VIEW TYPES ───
type View = 'landing' | 'dashboard' | 'senior';

// ─── LIVE CLOCK HOOK ───
function useClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return time;
}

// ─── MAIN APP ───
export default function CareSync() {
  const [view, setView] = useState<View>('landing');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="min-h-screen">
      {/* ─── VIEW SWITCHER NAV ─── */}
      <nav
        className="fixed top-4 left-1/2 -translate-x-1/2 z-50 card-glass px-2 py-2 flex gap-1"
        style={{ borderRadius: 'var(--radius-xl)' }}
      >
        {([
          { key: 'landing', label: 'Landing', icon: Heart },
          { key: 'dashboard', label: 'Dashboard', icon: Activity },
          { key: 'senior', label: 'Senior Mode', icon: Eye },
        ] as const).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setView(key)}
            className="relative px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 flex items-center gap-2"
            style={{
              fontFamily: 'var(--font-body)',
              background: view === key ? 'var(--sage-600)' : 'transparent',
              color: view === key ? '#fff' : 'var(--clay-600)',
            }}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </nav>

      {/* ─── VIEWS ─── */}
      {view === 'landing' && <LandingView />}
      {view === 'dashboard' && <DashboardView />}
      {view === 'senior' && <SeniorView />}
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// LANDING VIEW
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function LandingView() {
  return (
    <div className="gradient-hero min-h-screen">
      {/* ─── HEADER ─── */}
      <header className="max-w-6xl mx-auto px-6 pt-24 pb-4 flex items-center justify-between animate-slide-up">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'var(--sage-600)' }}
          >
            <Heart size={20} color="#fff" strokeWidth={2.5} />
          </div>
          <span
            className="text-xl tracking-tight"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--clay-900)' }}
          >
            Care-Sync
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button className="btn-secondary" style={{ padding: '10px 20px', fontSize: '14px' }}>
            Sign In
          </button>
          <button className="btn-primary" style={{ padding: '10px 20px', fontSize: '14px' }}>
            Get Started Free
          </button>
        </div>
      </header>

      {/* ─── HERO ─── */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-24">
        <div className="max-w-3xl mx-auto text-center stagger">
          {/* Badge */}
          <div className="flex justify-center mb-8">
            <span className="chip chip-sage">
              <Sparkles size={14} />
              Powered by Agentic AI
            </span>
          </div>

          {/* Headline */}
          <h1
            className="text-6xl md:text-7xl leading-[1.05] tracking-tight mb-6"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--clay-900)' }}
          >
            Care that stays{' '}
            <span
              className="relative inline-block"
              style={{ color: 'var(--sage-600)' }}
            >
              connected
              <svg
                className="absolute -bottom-2 left-0 w-full"
                viewBox="0 0 280 12"
                fill="none"
                style={{ height: '12px' }}
              >
                <path
                  d="M2 8c40-6 80-6 120-2s80 2 156-4"
                  stroke="var(--sage-300)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  fill="none"
                />
              </svg>
            </span>
          </h1>

          {/* Subheadline */}
          <p
            className="text-xl leading-relaxed max-w-xl mx-auto mb-10"
            style={{ color: 'var(--clay-500)', fontWeight: 500 }}
          >
            The family care platform that turns medical visits into action items,
            scans medications for conflicts, and keeps your most sensitive documents
            under zero-knowledge encryption.
          </p>

          {/* CTAs */}
          <div className="flex items-center justify-center gap-4">
            <button className="btn-primary" style={{ padding: '16px 32px', fontSize: '16px' }}>
              Start Coordinating
              <ArrowRight size={18} />
            </button>
            <button className="btn-secondary" style={{ padding: '16px 32px', fontSize: '16px' }}>
              <Play size={16} />
              Watch Demo
            </button>
          </div>

          {/* Trust */}
          <div
            className="mt-10 flex items-center justify-center gap-6 text-sm"
            style={{ color: 'var(--clay-400)' }}
          >
            <span className="flex items-center gap-1.5">
              <Shield size={14} style={{ color: 'var(--sage-500)' }} />
              HIPAA-Aligned
            </span>
            <span style={{ color: 'var(--clay-200)' }}>|</span>
            <span className="flex items-center gap-1.5">
              <Lock size={14} style={{ color: 'var(--sage-500)' }} />
              Zero-Knowledge Vault
            </span>
            <span style={{ color: 'var(--clay-200)' }}>|</span>
            <span className="flex items-center gap-1.5">
              <Zap size={14} style={{ color: 'var(--sage-500)' }} />
              Real-Time Sync
            </span>
          </div>
        </div>

        {/* ─── HERO VISUAL: FLOATING CARDS ─── */}
        <div className="relative mt-20 max-w-4xl mx-auto h-[340px]">
          {/* Doctor Digest Card */}
          <div
            className="card-warm absolute left-0 top-0 w-[320px] p-5 animate-float"
            style={{ animationDelay: '0s' }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: 'var(--lav-100)' }}
              >
                <Mic size={18} style={{ color: 'var(--lav-600)' }} />
              </div>
              <div>
                <p className="text-sm font-bold" style={{ color: 'var(--clay-800)' }}>Doctor Digest</p>
                <p className="text-xs" style={{ color: 'var(--clay-400)' }}>AI Medical Scribe</p>
              </div>
            </div>
            {/* Audio Waveform Visual */}
            <div className="flex items-end gap-[3px] h-12 mb-3">
              {[40, 65, 30, 80, 50, 70, 25, 60, 45, 75, 35, 55, 80, 40, 65, 30, 70, 50, 85, 35, 60, 45, 70, 30].map(
                (h, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-full animate-pulse-soft"
                    style={{
                      height: `${h}%`,
                      background: `var(--lav-${i % 3 === 0 ? '300' : '200'})`,
                      animationDelay: `${i * 120}ms`,
                    }}
                  />
                )
              )}
            </div>
            <div
              className="rounded-xl p-3 text-xs leading-relaxed"
              style={{ background: 'var(--lav-50)', color: 'var(--lav-700)' }}
            >
              <p className="font-bold mb-1">AI Summary:</p>
              <p>Increase Metformin to 1000mg. Schedule follow-up in 3 weeks. Begin physical therapy.</p>
            </div>
          </div>

          {/* Med Scanner Card */}
          <div
            className="card-warm absolute right-0 top-8 w-[300px] p-5 animate-float"
            style={{ animationDelay: '2s' }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: 'var(--blush-100)' }}
              >
                <Camera size={18} style={{ color: 'var(--blush-600)' }} />
              </div>
              <div>
                <p className="text-sm font-bold" style={{ color: 'var(--clay-800)' }}>Med Scanner</p>
                <p className="text-xs" style={{ color: 'var(--clay-400)' }}>Conflict Detection</p>
              </div>
            </div>
            {/* Scan result */}
            <div
              className="rounded-xl p-3 mb-3 flex items-center gap-3"
              style={{ background: 'var(--sage-50)', border: '1px solid var(--sage-200)' }}
            >
              <CheckCircle2 size={18} style={{ color: 'var(--sage-500)' }} />
              <div>
                <p className="text-xs font-bold" style={{ color: 'var(--sage-700)' }}>Lisinopril 10mg</p>
                <p className="text-[11px]" style={{ color: 'var(--sage-500)' }}>No conflicts detected</p>
              </div>
            </div>
            <div
              className="rounded-xl p-3 flex items-center gap-3"
              style={{ background: 'var(--blush-50)', border: '1px solid var(--blush-200)' }}
            >
              <AlertTriangle size={18} style={{ color: 'var(--blush-500)' }} />
              <div>
                <p className="text-xs font-bold" style={{ color: 'var(--blush-700)' }}>Ibuprofen 400mg</p>
                <p className="text-[11px]" style={{ color: 'var(--blush-500)' }}>
                  Conflict with Lisinopril
                </p>
              </div>
            </div>
          </div>

          {/* Vault Card */}
          <div
            className="card-warm absolute left-1/2 -translate-x-1/2 bottom-0 w-[280px] p-5 animate-float"
            style={{ animationDelay: '4s' }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: 'var(--clay-100)' }}
              >
                <Lock size={18} style={{ color: 'var(--clay-600)' }} />
              </div>
              <div>
                <p className="text-sm font-bold" style={{ color: 'var(--clay-800)' }}>The Vault</p>
                <p className="text-xs" style={{ color: 'var(--clay-400)' }}>AES-256 Encrypted</p>
              </div>
            </div>
            <div className="space-y-2">
              {['Lab Results — Oct 2024', 'Insurance Card', 'Prescription History'].map((name, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs"
                  style={{
                    background: 'var(--clay-50)',
                    border: '1px solid var(--clay-200)',
                    color: 'var(--clay-600)',
                  }}
                >
                  <FileText size={13} style={{ color: 'var(--clay-400)' }} />
                  <span className="font-medium">{name}</span>
                  <Shield size={10} className="ml-auto" style={{ color: 'var(--sage-400)' }} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── FEATURES SECTION ─── */}
      <section
        className="py-24"
        style={{
          background: 'linear-gradient(180deg, var(--clay-100) 0%, var(--clay-50) 100%)',
        }}
      >
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="chip chip-sage mb-4">
              <Zap size={13} />
              Core Features
            </span>
            <h2
              className="text-4xl md:text-5xl tracking-tight mt-4"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--clay-900)' }}
            >
              Everything your family needs
            </h2>
            <p className="mt-4 text-lg max-w-lg mx-auto" style={{ color: 'var(--clay-500)' }}>
              From real-time coordination to AI-powered medical tools — all in one place.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 stagger">
            {[
              {
                icon: Mic,
                title: 'Doctor Digest',
                desc: 'Record consultations. AI transcribes, summarizes, and creates prioritized action items automatically.',
                color: 'lav',
                chip: 'Audio AI',
              },
              {
                icon: Camera,
                title: 'Med-Cabinet Scanner',
                desc: 'Snap a photo of any medication. AI checks for drug interactions against your family profile.',
                color: 'blush',
                chip: 'Vision AI',
              },
              {
                icon: Lock,
                title: 'The Vault',
                desc: 'Zero-knowledge encrypted document storage. Not even we can read your files. Only your password unlocks them.',
                color: 'clay',
                chip: 'AES-256',
              },
              {
                icon: Calendar,
                title: "Who's On Duty?",
                desc: 'Real-time shift calendar synced across all family members. Never miss a care transition.',
                color: 'sage',
                chip: 'Real-time',
              },
              {
                icon: Activity,
                title: 'Family Feed',
                desc: 'Live activity stream. See updates, completed tasks, and care notes from every family member.',
                color: 'sage',
                chip: 'Live Sync',
              },
              {
                icon: Eye,
                title: 'Senior Passive Mode',
                desc: 'High-contrast, large-type dashboard for care recipients. Clock, next visitor, medication status.',
                color: 'sage',
                chip: 'WCAG AAA',
              },
            ].map((f, i) => {
              const colorMap: Record<string, { bg: string; icon: string; chip: string }> = {
                lav: { bg: 'var(--lav-100)', icon: 'var(--lav-600)', chip: 'chip-lav' },
                blush: { bg: 'var(--blush-100)', icon: 'var(--blush-600)', chip: 'chip-blush' },
                clay: { bg: 'var(--clay-200)', icon: 'var(--clay-700)', chip: 'chip-sage' },
                sage: { bg: 'var(--sage-100)', icon: 'var(--sage-600)', chip: 'chip-sage' },
              };
              const c = colorMap[f.color];
              return (
                <div key={i} className="card-warm p-6 group cursor-pointer">
                  <div className="flex items-start justify-between mb-4">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
                      style={{ background: c.bg }}
                    >
                      <f.icon size={22} style={{ color: c.icon }} />
                    </div>
                    <span className={`chip ${c.chip}`} style={{ fontSize: '11px', padding: '4px 10px' }}>
                      {f.chip}
                    </span>
                  </div>
                  <h3
                    className="text-lg font-bold mb-2 tracking-tight"
                    style={{ color: 'var(--clay-800)' }}
                  >
                    {f.title}
                  </h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--clay-500)' }}>
                    {f.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── PRICING ─── */}
      <section className="py-24 max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2
            className="text-4xl md:text-5xl tracking-tight"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--clay-900)' }}
          >
            Simple, honest pricing
          </h2>
          <p className="mt-4 text-lg" style={{ color: 'var(--clay-500)' }}>
            Start free. Upgrade when your family needs AI superpowers.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {/* Free */}
          <div className="card-warm p-8">
            <p className="text-sm font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--clay-400)' }}>
              Free
            </p>
            <p className="text-4xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-display)', color: 'var(--clay-900)' }}>
              $0
            </p>
            <p className="text-sm mt-1 mb-6" style={{ color: 'var(--clay-400)' }}>
              Forever free for basic coordination
            </p>
            <ul className="space-y-3 mb-8">
              {['Shared family calendar', 'Manual task entry', 'Family activity feed', 'Up to 5 family members'].map(
                (item, i) => (
                  <li key={i} className="flex items-center gap-2.5 text-sm" style={{ color: 'var(--clay-600)' }}>
                    <CheckCircle2 size={16} style={{ color: 'var(--sage-400)' }} />
                    {item}
                  </li>
                )
              )}
            </ul>
            <button className="btn-secondary w-full">Get Started</button>
          </div>

          {/* Premium */}
          <div
            className="card-warm p-8 relative overflow-hidden"
            style={{ border: '2px solid var(--sage-300)' }}
          >
            <div
              className="absolute top-0 right-0 px-4 py-1 text-xs font-bold text-white"
              style={{
                background: 'var(--sage-600)',
                borderBottomLeftRadius: 'var(--radius-sm)',
              }}
            >
              RECOMMENDED
            </div>
            <p className="text-sm font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--sage-600)' }}>
              Premium
            </p>
            <div className="flex items-baseline gap-1">
              <p className="text-4xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-display)', color: 'var(--clay-900)' }}>
                $9.99
              </p>
              <span className="text-sm" style={{ color: 'var(--clay-400)' }}>/month</span>
            </div>
            <p className="text-sm mt-1 mb-6" style={{ color: 'var(--clay-400)' }}>
              Full AI-powered care coordination
            </p>
            <ul className="space-y-3 mb-8">
              {[
                'Everything in Free',
                'Doctor Digest (Audio AI)',
                'Med-Cabinet Scanner',
                'The Vault (25GB encrypted)',
                'Priority support',
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-2.5 text-sm" style={{ color: 'var(--clay-600)' }}>
                  <Sparkles size={16} style={{ color: 'var(--sage-500)' }} />
                  {item}
                </li>
              ))}
            </ul>
            <button className="btn-primary w-full sage-glow">
              Start Free Trial
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer
        className="py-12 px-6 text-center text-sm"
        style={{
          borderTop: '1px solid var(--clay-200)',
          color: 'var(--clay-400)',
        }}
      >
        <div className="flex items-center justify-center gap-2 mb-2">
          <Heart size={14} style={{ color: 'var(--sage-500)' }} />
          <span style={{ fontFamily: 'var(--font-display)', color: 'var(--clay-700)', fontSize: '16px' }}>
            Care-Sync
          </span>
        </div>
        <p>Built with compassion. Protected by cryptography.</p>
      </footer>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DASHBOARD VIEW
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const FAMILY_MEMBERS = [
  { name: 'Sarah K.', role: 'Primary Caregiver', initials: 'SK', color: 'var(--sage-500)' },
  { name: 'David K.', role: 'Caregiver', initials: 'DK', color: 'var(--lav-500)' },
  { name: 'Mom', role: 'Senior', initials: 'MK', color: 'var(--blush-400)' },
  { name: 'James K.', role: 'Member', initials: 'JK', color: 'var(--clay-500)' },
];

const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const SHIFTS = [
  { day: 0, time: '8a–2p', person: 'Sarah K.', type: 'medical', color: 'var(--sage-100)', textColor: 'var(--sage-700)' },
  { day: 0, time: '2p–8p', person: 'David K.', type: 'social', color: 'var(--lav-100)', textColor: 'var(--lav-700)' },
  { day: 1, time: '8a–4p', person: 'James K.', type: 'rest', color: 'var(--clay-100)', textColor: 'var(--clay-700)' },
  { day: 2, time: '9a–1p', person: 'Sarah K.', type: 'medical', color: 'var(--sage-100)', textColor: 'var(--sage-700)' },
  { day: 2, time: '3p–7p', person: 'David K.', type: 'social', color: 'var(--lav-100)', textColor: 'var(--lav-700)' },
  { day: 3, time: '10a–6p', person: 'James K.', type: 'admin', color: 'var(--blush-50)', textColor: 'var(--blush-700)' },
  { day: 4, time: '8a–12p', person: 'Sarah K.', type: 'medical', color: 'var(--sage-100)', textColor: 'var(--sage-700)' },
  { day: 5, time: '9a–5p', person: 'David K.', type: 'social', color: 'var(--lav-100)', textColor: 'var(--lav-700)' },
];

const FEED_ITEMS = [
  {
    person: 'Sarah K.',
    initials: 'SK',
    color: 'var(--sage-500)',
    action: 'completed Doctor Digest',
    detail: 'Dr. Patel follow-up — 3 action items created',
    time: '12 min ago',
    type: 'ai',
  },
  {
    person: 'David K.',
    initials: 'DK',
    color: 'var(--lav-500)',
    action: 'updated medication list',
    detail: 'Added Vitamin D3 2000IU — no conflicts',
    time: '1 hr ago',
    type: 'med',
  },
  {
    person: 'James K.',
    initials: 'JK',
    color: 'var(--clay-500)',
    action: 'uploaded to Vault',
    detail: 'Insurance renewal 2025.pdf — encrypted',
    time: '3 hrs ago',
    type: 'vault',
  },
  {
    person: 'Sarah K.',
    initials: 'SK',
    color: 'var(--sage-500)',
    action: 'checked in for shift',
    detail: 'Morning medical shift — Mom was in good spirits',
    time: '5 hrs ago',
    type: 'shift',
  },
];

function DashboardView() {
  const clock = useClock();
  const [isRecording, setIsRecording] = useState(false);

  const hours = clock.getHours();
  const greeting = hours < 12 ? 'Good morning' : hours < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="gradient-warm min-h-screen pt-20 pb-12">
      <div className="max-w-7xl mx-auto px-6">
        {/* ─── TOP BAR ─── */}
        <div className="flex items-center justify-between mb-8 animate-slide-up">
          <div>
            <p className="text-sm font-medium" style={{ color: 'var(--clay-400)' }}>
              {greeting}, Sarah
            </p>
            <h1
              className="text-3xl tracking-tight"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--clay-900)' }}
            >
              Kowalski Family
            </h1>
          </div>
          <div className="flex items-center gap-3">
            {/* Family Avatars */}
            <div className="flex -space-x-2 mr-2">
              {FAMILY_MEMBERS.map((m, i) => (
                <div
                  key={i}
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold ring-2 ring-white"
                  style={{ background: m.color, zIndex: 10 - i }}
                  title={m.name}
                >
                  {m.initials}
                </div>
              ))}
            </div>
            <button
              className="w-10 h-10 rounded-xl flex items-center justify-center relative"
              style={{ background: 'var(--card)', border: '1px solid var(--clay-200)' }}
            >
              <Bell size={18} style={{ color: 'var(--clay-500)' }} />
              <span
                className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[9px] font-bold text-white flex items-center justify-center"
                style={{ background: 'var(--blush-500)' }}
              >
                3
              </span>
            </button>
            <button
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'var(--card)', border: '1px solid var(--clay-200)' }}
            >
              <Search size={18} style={{ color: 'var(--clay-500)' }} />
            </button>
          </div>
        </div>

        {/* ─── MAIN GRID ─── */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* ─── LEFT COLUMN: Calendar + AI Features ─── */}
          <div className="lg:col-span-2 space-y-6">
            {/* Shift Calendar */}
            <div className="card-warm p-6 animate-slide-up delay-100">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <Calendar size={18} style={{ color: 'var(--sage-600)' }} />
                  <h2 className="text-lg font-bold tracking-tight" style={{ color: 'var(--clay-800)' }}>
                    Who&apos;s On Duty?
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium" style={{ color: 'var(--clay-400)' }}>
                    This Week
                  </span>
                  <button
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: 'var(--clay-100)' }}
                  >
                    <Plus size={14} style={{ color: 'var(--clay-600)' }} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-2">
                {WEEK_DAYS.map((day, di) => (
                  <div key={di}>
                    <p
                      className="text-xs font-bold text-center mb-2 uppercase tracking-wider"
                      style={{ color: di === 0 ? 'var(--sage-600)' : 'var(--clay-400)' }}
                    >
                      {day}
                    </p>
                    <div
                      className="rounded-xl p-1.5 min-h-[100px] space-y-1.5"
                      style={{
                        background: di === 0 ? 'var(--sage-50)' : 'var(--clay-50)',
                        border: di === 0 ? '1.5px solid var(--sage-200)' : '1px solid transparent',
                      }}
                    >
                      {SHIFTS.filter((s) => s.day === di).map((shift, si) => (
                        <div
                          key={si}
                          className="rounded-lg px-2 py-1.5 text-[10px] font-semibold leading-tight cursor-pointer transition-transform hover:scale-[1.03]"
                          style={{ background: shift.color, color: shift.textColor }}
                        >
                          <p>{shift.time}</p>
                          <p className="opacity-70 font-medium">{shift.person.split(' ')[0]}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Features Row */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Doctor Digest */}
              <div className="card-warm p-6 animate-slide-up delay-200">
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: 'var(--lav-100)' }}
                  >
                    <Mic size={18} style={{ color: 'var(--lav-600)' }} />
                  </div>
                  <div>
                    <p className="text-sm font-bold" style={{ color: 'var(--clay-800)' }}>Doctor Digest</p>
                    <p className="text-xs" style={{ color: 'var(--clay-400)' }}>Record & transcribe</p>
                  </div>
                  <span className="chip chip-lav ml-auto" style={{ fontSize: '10px', padding: '3px 8px' }}>
                    AI
                  </span>
                </div>

                {/* Recording Button */}
                <button
                  onClick={() => setIsRecording(!isRecording)}
                  className="w-full py-4 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 font-semibold text-sm"
                  style={{
                    background: isRecording ? 'var(--danger)' : 'var(--lav-600)',
                    color: '#fff',
                    boxShadow: isRecording
                      ? '0 0 0 4px rgba(201, 74, 74, 0.2)'
                      : '0 0 0 0px transparent',
                  }}
                >
                  {isRecording ? (
                    <>
                      <Square size={16} className="animate-pulse" />
                      Recording... Tap to Stop
                    </>
                  ) : (
                    <>
                      <Mic size={16} />
                      Start Recording
                    </>
                  )}
                </button>

                {/* Recent Digest */}
                <div className="mt-4 space-y-2">
                  <p className="text-xs font-bold" style={{ color: 'var(--clay-400)' }}>Recent</p>
                  <div
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg cursor-pointer transition-colors"
                    style={{ background: 'var(--lav-50)', border: '1px solid var(--lav-100)' }}
                  >
                    <FileText size={14} style={{ color: 'var(--lav-500)' }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold truncate" style={{ color: 'var(--lav-700)' }}>
                        Dr. Patel — Cardiology
                      </p>
                      <p className="text-[10px]" style={{ color: 'var(--lav-400)' }}>3 action items</p>
                    </div>
                    <ChevronRight size={14} style={{ color: 'var(--lav-300)' }} />
                  </div>
                </div>
              </div>

              {/* Med Scanner */}
              <div className="card-warm p-6 animate-slide-up delay-300">
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: 'var(--blush-100)' }}
                  >
                    <Camera size={18} style={{ color: 'var(--blush-600)' }} />
                  </div>
                  <div>
                    <p className="text-sm font-bold" style={{ color: 'var(--clay-800)' }}>Med Scanner</p>
                    <p className="text-xs" style={{ color: 'var(--clay-400)' }}>Check interactions</p>
                  </div>
                  <span className="chip chip-blush ml-auto" style={{ fontSize: '10px', padding: '3px 8px' }}>
                    AI
                  </span>
                </div>

                <button
                  className="w-full py-4 rounded-xl flex items-center justify-center gap-2 font-semibold text-sm transition-all"
                  style={{ background: 'var(--blush-500)', color: '#fff' }}
                >
                  <Camera size={16} />
                  Scan Medication
                </button>

                {/* Current Meds */}
                <div className="mt-4 space-y-2">
                  <p className="text-xs font-bold" style={{ color: 'var(--clay-400)' }}>
                    Mom&apos;s Medications
                  </p>
                  {[
                    { name: 'Metformin 1000mg', status: 'ok' },
                    { name: 'Lisinopril 10mg', status: 'ok' },
                    { name: 'Vitamin D3 2000IU', status: 'new' },
                  ].map((med, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs"
                      style={{ background: 'var(--clay-50)', border: '1px solid var(--clay-100)' }}
                    >
                      <Pill size={13} style={{ color: 'var(--clay-400)' }} />
                      <span className="font-medium" style={{ color: 'var(--clay-700)' }}>{med.name}</span>
                      {med.status === 'new' && (
                        <span
                          className="ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded"
                          style={{ background: 'var(--sage-100)', color: 'var(--sage-600)' }}
                        >
                          NEW
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ─── RIGHT COLUMN: Feed + Vault ─── */}
          <div className="space-y-6">
            {/* Family Feed */}
            <div className="card-warm p-6 animate-slide-up delay-200">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <Activity size={16} style={{ color: 'var(--sage-600)' }} />
                  <h3 className="text-sm font-bold" style={{ color: 'var(--clay-800)' }}>Family Feed</h3>
                </div>
                <div
                  className="w-2 h-2 rounded-full animate-breathe"
                  style={{ background: 'var(--sage-400)' }}
                  title="Live"
                />
              </div>

              <div className="space-y-4">
                {FEED_ITEMS.map((item, i) => (
                  <div key={i} className="flex gap-3 group">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0 mt-0.5"
                      style={{ background: item.color }}
                    >
                      {item.initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs leading-relaxed" style={{ color: 'var(--clay-700)' }}>
                        <strong>{item.person}</strong>{' '}
                        <span style={{ color: 'var(--clay-500)' }}>{item.action}</span>
                      </p>
                      <p className="text-[11px] mt-0.5" style={{ color: 'var(--clay-400)' }}>
                        {item.detail}
                      </p>
                      <p className="text-[10px] mt-1" style={{ color: 'var(--clay-300)' }}>
                        {item.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* The Vault Quick Access */}
            <div className="card-warm p-6 animate-slide-up delay-400">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Lock size={16} style={{ color: 'var(--clay-600)' }} />
                  <h3 className="text-sm font-bold" style={{ color: 'var(--clay-800)' }}>The Vault</h3>
                </div>
                <span className="text-[10px] font-medium" style={{ color: 'var(--clay-400)' }}>
                  4.2 GB / 25 GB
                </span>
              </div>

              {/* Storage Bar */}
              <div
                className="w-full h-2 rounded-full mb-4 overflow-hidden"
                style={{ background: 'var(--clay-100)' }}
              >
                <div className="h-full rounded-full" style={{ width: '17%', background: 'var(--sage-400)' }} />
              </div>

              <div className="space-y-2">
                {[
                  { name: 'Lab Results — Oct 2024', size: '2.1 MB', icon: FileText },
                  { name: 'Insurance Card (Front)', size: '1.4 MB', icon: FileText },
                  { name: 'Prescription History', size: '856 KB', icon: FileText },
                ].map((doc, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition-colors cursor-pointer"
                    style={{
                      background: 'var(--clay-50)',
                      border: '1px solid var(--clay-100)',
                    }}
                  >
                    <doc.icon size={14} style={{ color: 'var(--clay-400)' }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate" style={{ color: 'var(--clay-700)' }}>
                        {doc.name}
                      </p>
                      <p className="text-[10px]" style={{ color: 'var(--clay-300)' }}>{doc.size}</p>
                    </div>
                    <Shield size={11} style={{ color: 'var(--sage-300)' }} />
                  </div>
                ))}
              </div>

              <button
                className="w-full mt-4 py-3 rounded-xl flex items-center justify-center gap-2 text-xs font-semibold transition-colors"
                style={{
                  background: 'var(--clay-100)',
                  color: 'var(--clay-600)',
                  border: '1px dashed var(--clay-300)',
                }}
              >
                <Upload size={14} />
                Upload & Encrypt
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SENIOR PASSIVE MODE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function SeniorView() {
  const clock = useClock();

  const hours = clock.getHours();
  const minutes = clock.getMinutes();
  const seconds = clock.getSeconds();
  const timeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  const dayName = dayNames[clock.getDay()];
  const monthName = monthNames[clock.getMonth()];
  const dateNum = clock.getDate();

  const getOrdinal = (n: number) => {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };

  return (
    <div className="senior-mode fixed inset-0 flex flex-col p-8 md:p-12 overflow-hidden">
      {/* Ambient glow */}
      <div
        className="absolute top-0 left-0 w-[500px] h-[500px] rounded-full blur-[150px] opacity-20"
        style={{ background: 'var(--accent)' }}
      />
      <div
        className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full blur-[120px] opacity-15"
        style={{ background: 'var(--accent-warm)' }}
      />

      {/* ─── TOP: TIME & DATE ─── */}
      <header className="flex items-start justify-between relative z-10 animate-slide-up">
        <div>
          <div className="flex items-baseline gap-2">
            <span
              className="text-8xl md:text-[120px] font-bold tracking-tighter leading-none"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--text)' }}
            >
              {timeStr}
            </span>
            <span
              className="text-2xl md:text-3xl font-medium"
              style={{
                color: 'var(--accent)',
                animation: 'tick 1s ease-in-out infinite',
              }}
            >
              {seconds.toString().padStart(2, '0')}
            </span>
          </div>
          <p
            className="text-xl md:text-2xl font-medium mt-1"
            style={{ color: 'rgba(255,255,255,0.4)' }}
          >
            {hours < 12 ? 'Good Morning' : hours < 17 ? 'Good Afternoon' : 'Good Evening'}
          </p>
        </div>

        <div className="text-right">
          <p
            className="text-4xl md:text-5xl font-bold tracking-tight"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--text)' }}
          >
            {dayName}
          </p>
          <p className="text-2xl md:text-3xl mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
            {monthName} {getOrdinal(dateNum)}
          </p>
        </div>
      </header>

      {/* ─── CENTER: NEXT VISITOR ─── */}
      <section className="flex-1 flex items-center justify-center relative z-10">
        <div className="text-center animate-slide-up delay-200">
          {/* Visitor Avatar */}
          <div className="relative inline-block mb-6">
            <div
              className="w-32 h-32 md:w-40 md:h-40 rounded-full flex items-center justify-center text-5xl md:text-6xl font-bold animate-breathe"
              style={{
                background: 'linear-gradient(135deg, var(--accent), rgba(79, 168, 130, 0.6))',
                color: 'white',
                boxShadow: '0 0 60px rgba(79, 168, 130, 0.3)',
              }}
            >
              SK
            </div>
            <div
              className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full text-sm font-bold"
              style={{ background: 'var(--accent)', color: '#0c1a14' }}
            >
              2:00 PM
            </div>
          </div>

          <p
            className="text-4xl md:text-5xl font-bold tracking-tight mb-2"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--text)' }}
          >
            Sarah is coming
          </p>
          <p className="text-xl md:text-2xl" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Afternoon medical visit
          </p>
        </div>
      </section>

      {/* ─── BOTTOM: STATUS CARDS ─── */}
      <footer className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 relative z-10 animate-slide-up delay-400">
        {/* Medication Status */}
        <div
          className="rounded-3xl p-6 md:p-8"
          style={{
            background: 'rgba(79, 168, 130, 0.1)',
            border: '3px solid rgba(79, 168, 130, 0.4)',
          }}
        >
          <div className="flex items-center gap-3 mb-3">
            <Pill size={28} style={{ color: 'var(--accent)' }} />
            <p
              className="text-xl md:text-2xl font-bold"
              style={{ color: 'var(--accent)' }}
            >
              Medication
            </p>
          </div>
          <p
            className="text-3xl md:text-4xl font-bold tracking-tight"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--text)' }}
          >
            All Taken
          </p>
          <p className="text-base mt-1" style={{ color: 'rgba(255,255,255,0.35)' }}>
            Next dose at 6:00 PM
          </p>
        </div>

        {/* Care Status */}
        <div
          className="rounded-3xl p-6 md:p-8"
          style={{
            background: 'rgba(184, 162, 221, 0.08)',
            border: '3px solid rgba(184, 162, 221, 0.3)',
          }}
        >
          <div className="flex items-center gap-3 mb-3">
            <Heart size={28} style={{ color: 'var(--lav-300)' }} />
            <p
              className="text-xl md:text-2xl font-bold"
              style={{ color: 'var(--lav-300)' }}
            >
              Feeling
            </p>
          </div>
          <p
            className="text-3xl md:text-4xl font-bold tracking-tight"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--text)' }}
          >
            Comfortable
          </p>
          <p className="text-base mt-1" style={{ color: 'rgba(255,255,255,0.35)' }}>
            Last check-in 30 min ago
          </p>
        </div>

        {/* Emergency */}
        <button
          className="rounded-3xl p-6 md:p-8 text-left transition-transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          style={{
            background: 'rgba(247, 168, 127, 0.1)',
            border: '3px solid rgba(247, 168, 127, 0.4)',
          }}
        >
          <div className="flex items-center gap-3 mb-3">
            <Phone size={28} style={{ color: 'var(--accent-warm)' }} />
            <p
              className="text-xl md:text-2xl font-bold"
              style={{ color: 'var(--accent-warm)' }}
            >
              Need Help?
            </p>
          </div>
          <p
            className="text-3xl md:text-4xl font-bold tracking-tight"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--text)' }}
          >
            Call Sarah
          </p>
          <p className="text-base mt-1" style={{ color: 'rgba(255,255,255,0.35)' }}>
            Tap here to call
          </p>
        </button>
      </footer>
    </div>
  );
}
