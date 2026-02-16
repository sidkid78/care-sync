import Link from 'next/link';
import {
  Heart, Shield, Mic, Camera, Lock, Users, Calendar, Activity,
  ArrowRight, Sparkles, CheckCircle2,
  AlertTriangle, Pill, FileText, Eye,
  Zap, Star, Play,
} from 'lucide-react';

// ─── LANDING PAGE (Static — no 'use client' needed) ───
export default function LandingPage() {
  return (
    <div className="gradient-hero min-h-screen">
      {/* ─── HEADER ─── */}
      <header className="max-w-6xl mx-auto px-6 pt-8 pb-4 flex items-center justify-between animate-slide-up">
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
          <Link
            href="/login"
            className="btn-secondary"
            style={{ padding: '10px 20px', fontSize: '14px' }}
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            className="btn-primary"
            style={{ padding: '10px 20px', fontSize: '14px' }}
          >
            Get Started Free
          </Link>
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
            className="text-4xl md:text-6xl lg:text-7xl leading-[1.05] tracking-tight mb-6"
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
            <Link
              href="/signup"
              className="btn-primary"
              style={{ padding: '16px 32px', fontSize: '16px' }}
            >
              Start Coordinating
              <ArrowRight size={18} />
            </Link>
            <Link
              href="/login"
              className="btn-secondary"
              style={{ padding: '16px 32px', fontSize: '16px' }}
            >
              Sign In
              <ArrowRight size={18} />
            </Link>
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
        <div className="relative mt-12 md:mt-20 max-w-4xl mx-auto h-auto md:h-[340px] flex flex-col md:block gap-4">
          {/* Doctor Digest Card */}
          <div
            className="card-warm relative md:absolute left-0 top-0 w-full md:w-[320px] p-5 animate-float"
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
                    className="flex-1 rounded-full"
                    style={{
                      height: `${h}%`,
                      background: `var(--lav-${i % 3 === 0 ? '300' : '200'})`,
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
            className="card-warm relative md:absolute right-0 top-8 w-full md:w-[300px] p-5 animate-float"
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
            className="card-warm relative md:absolute left-1/2 md:-translate-x-1/2 bottom-0 w-full md:w-[280px] p-5 animate-float"
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 stagger">
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
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
            <Link href="/signup" className="btn-secondary w-full text-center block">
              Get Started
            </Link>
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
            <Link href="/signup" className="btn-primary w-full sage-glow text-center block">
              Start Free Trial
              <ArrowRight size={16} />
            </Link>
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
        <div className="mt-4">
          <Link href="/educational1.html" className="text-xs hover:text-[var(--sage-600)] underline underline-offset-4 mr-4">
            System Architecture
          </Link>
          <Link href="/architectural.html" className="text-xs hover:text-[var(--sage-600)] underline underline-offset-4 mr-4">
            Security Blueprint
          </Link>
          <Link href="/engineering.html" className="text-xs hover:text-[var(--sage-600)] underline underline-offset-4">
            Engineering Spec
          </Link>
        </div>
      </footer>
    </div>
  );
}
