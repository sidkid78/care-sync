'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { format, isToday, isTomorrow, parseISO } from 'date-fns';
import {
  Pill,
  Heart,
  Phone,
  Clock,
  Sun,
  Moon,
  User,
  Loader2,
  ChevronRight,
  Smile,
  Frown,
  Meh,
} from 'lucide-react';

// ─── Types ──────────────────────────────────────────
interface Profile {
  id: string;
  full_name: string | null;
}

interface NextShift {
  title: string;
  start_time: string;
  assigned_name: string | null;
}

interface Medication {
  medication_name: string;
  dosage: string | null;
  frequency: string | null;
}

interface FeedPost {
  content: string;
  created_at: string;
  profiles: { full_name: string | null };
}

// ─── Page ──────────────────────────────────────────
export default function SeniorPage() {
  const supabase = createClient();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [familyId, setFamilyId] = useState<string | null>(null);
  const [now, setNow] = useState(new Date());
  const [nextVisitor, setNextVisitor] = useState<NextShift | null>(null);
  const [meds, setMeds] = useState<Medication[]>([]);
  const [recentPosts, setRecentPosts] = useState<FeedPost[]>([]);
  const [vibePosted, setVibePosted] = useState(false);

  // Live clock
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Load data
  const loadData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/login'); return; }

    const { data: prof } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('id', user.id)
      .single();
    setProfile(prof);

    // Get family
    const { data: membership } = await supabase
      .from('family_members')
      .select('family_id')
      .eq('profile_id', user.id)
      .limit(1)
      .single();

    if (!membership) { router.push('/onboarding'); return; }
    setFamilyId(membership.family_id);

    // Parallel fetches
    const [shiftsRes, medsRes, feedRes] = await Promise.all([
      supabase
        .from('shifts')
        .select('title, start_time, assigned_to_user_id, profiles:assigned_to_user_id(full_name)')
        .eq('family_id', membership.family_id)
        .gte('start_time', new Date().toISOString())
        .order('start_time', { ascending: true })
        .limit(1),
      supabase
        .from('user_medications')
        .select('medication_name, dosage, frequency')
        .eq('profile_id', user.id),
      supabase
        .from('feed_posts')
        .select('content, created_at, profiles(full_name)')
        .eq('family_id', membership.family_id)
        .order('created_at', { ascending: false })
        .limit(3),
    ]);

    if (shiftsRes.data?.[0]) {
      const s = shiftsRes.data[0] as any;
      setNextVisitor({
        title: s.title,
        start_time: s.start_time,
        assigned_name: s.profiles?.full_name || null,
      });
    }

    setMeds((medsRes.data as Medication[]) || []);
    setRecentPosts((feedRes.data as unknown as FeedPost[]) || []);
    setLoading(false);
  }, [supabase, router]);

  useEffect(() => { loadData(); }, [loadData]);

  // Realtime — updates to feed and shifts
  useEffect(() => {
    if (!familyId) return;
    const channel = supabase
      .channel(`senior-${familyId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'feed_posts', filter: `family_id=eq.${familyId}` },
        () => {
          supabase
            .from('feed_posts')
            .select('content, created_at, profiles(full_name)')
            .eq('family_id', familyId)
            .order('created_at', { ascending: false })
            .limit(3)
            .then(({ data }) => setRecentPosts((data as unknown as FeedPost[]) || []));
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'shifts', filter: `family_id=eq.${familyId}` },
        () => {
          supabase
            .from('shifts')
            .select('title, start_time, assigned_to_user_id, profiles:assigned_to_user_id(full_name)')
            .eq('family_id', familyId)
            .gte('start_time', new Date().toISOString())
            .order('start_time', { ascending: true })
            .limit(1)
            .then(({ data }) => {
              if (data?.[0]) {
                const s = data[0] as any;
                setNextVisitor({
                  title: s.title,
                  start_time: s.start_time,
                  assigned_name: s.profiles?.full_name || null,
                });
              }
            });
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [familyId, supabase]);

  // Post a vibe check
  const postVibe = async (mood: string) => {
    if (!familyId || !profile) return;
    await supabase.from('feed_posts').insert({
      family_id: familyId,
      profile_id: profile.id,
      content: `Feeling ${mood} today`,
      post_type: 'vibe_check',
    });
    setVibePosted(true);
    setTimeout(() => setVibePosted(false), 5000);
  };

  // Time-of-day helpers
  const hour = now.getHours();
  const isNight = hour >= 20 || hour < 6;
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
  const TimeIcon = isNight ? Moon : Sun;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0d1117]">
        <Loader2 className="w-10 h-10 animate-spin text-[var(--sage-400)]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d1117] text-white relative overflow-hidden select-none">
      {/* Ambient glow orbs */}
      <div className="absolute top-[-200px] left-[-100px] w-[500px] h-[500px] bg-[var(--sage-600)] opacity-[0.06] rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-150px] right-[-100px] w-[400px] h-[400px] bg-[var(--lav-600)] opacity-[0.05] rounded-full blur-[100px] pointer-events-none" />

      {/* Navigation back */}
      <div className="absolute top-4 right-4 z-20">
        <button
          onClick={() => router.push('/dashboard')}
          className="text-xs text-white/30 hover:text-white/50 transition-colors px-3 py-1.5 rounded-full border border-white/10 hover:border-white/20"
        >
          Exit Senior Mode
        </button>
      </div>

      <div className="flex flex-col items-center justify-center min-h-screen px-6 py-12 max-w-lg mx-auto">
        {/* Greeting */}
        <div className="text-center mb-6">
          <TimeIcon className="w-8 h-8 text-amber-400/60 mx-auto mb-2" />
          <p className="text-lg text-white/40 font-medium">{greeting}</p>
          <p className="text-2xl text-white/70 font-semibold">{profile?.full_name?.split(' ')[0]}</p>
        </div>

        {/* Giant Clock */}
        <div className="text-center mb-10">
          <div className="text-[96px] sm:text-[120px] font-mono font-bold leading-none text-white/90 tracking-tight">
            {format(now, 'h:mm')}
          </div>
          <div className="flex items-center justify-center gap-2 mt-1">
            <span className="text-3xl font-mono text-white/40">{format(now, 'a')}</span>
            <span className="text-white/10 text-xl">·</span>
            <span className="text-lg text-white/30">{format(now, 'EEEE, MMMM d')}</span>
          </div>
        </div>

        {/* Next Visitor Card */}
        {nextVisitor && (
          <div className="w-full card-glass p-6 rounded-3xl mb-6 border border-white/10 bg-white/[0.03]">
            <p className="text-xs uppercase tracking-wider text-white/30 mb-3">Next Visit</p>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-[var(--sage-600)]/20 flex items-center justify-center border border-[var(--sage-600)]/30">
                <User className="w-7 h-7 text-[var(--sage-400)]" />
              </div>
              <div className="flex-1">
                <p className="text-xl font-semibold text-white/80">
                  {nextVisitor.assigned_name || nextVisitor.title}
                </p>
                <p className="text-sm text-white/40">
                  {(() => {
                    const d = parseISO(nextVisitor.start_time);
                    const prefix = isToday(d) ? 'Today' : isTomorrow(d) ? 'Tomorrow' : format(d, 'EEE');
                    return `${prefix} at ${format(d, 'h:mm a')}`;
                  })()}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Status Grid */}
        <div className="w-full grid grid-cols-1 gap-4 mb-8">
          {/* Medications */}
          <div className="p-5 rounded-3xl border border-white/10 bg-white/[0.03]">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-[var(--blush-600)]/20 flex items-center justify-center">
                <Pill className="w-5 h-5 text-[var(--blush-400)]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white/70">Medications</p>
                <p className="text-xs text-white/30">{meds.length} on file</p>
              </div>
            </div>
            {meds.length === 0 ? (
              <p className="text-sm text-white/20">No medications recorded yet.</p>
            ) : (
              <div className="space-y-2">
                {meds.map((m, i) => (
                  <div key={i} className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0">
                    <span className="text-sm text-white/60 font-medium">{m.medication_name}</span>
                    <span className="text-xs text-white/30">{m.dosage} {m.frequency && `· ${m.frequency}`}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* How are you feeling? */}
          <div className="p-5 rounded-3xl border border-white/10 bg-white/[0.03]">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-amber-600/20 flex items-center justify-center">
                <Heart className="w-5 h-5 text-amber-400" />
              </div>
              <p className="text-sm font-semibold text-white/70">How are you feeling?</p>
            </div>
            {vibePosted ? (
              <p className="text-center text-sm text-[var(--sage-400)]">✓ Shared with your family</p>
            ) : (
              <div className="flex justify-center gap-6">
                <button
                  onClick={() => postVibe('great 😊')}
                  className="flex flex-col items-center gap-1.5 group"
                >
                  <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
                    <Smile className="w-7 h-7 text-emerald-400" />
                  </div>
                  <span className="text-xs text-white/30">Good</span>
                </button>
                <button
                  onClick={() => postVibe('okay 😐')}
                  className="flex flex-col items-center gap-1.5 group"
                >
                  <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center group-hover:bg-amber-500/20 transition-colors">
                    <Meh className="w-7 h-7 text-amber-400" />
                  </div>
                  <span className="text-xs text-white/30">Okay</span>
                </button>
                <button
                  onClick={() => postVibe('not well 😔')}
                  className="flex flex-col items-center gap-1.5 group"
                >
                  <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center group-hover:bg-red-500/20 transition-colors">
                    <Frown className="w-7 h-7 text-red-400" />
                  </div>
                  <span className="text-xs text-white/30">Not Good</span>
                </button>
              </div>
            )}
          </div>

          {/* Emergency Call */}
          <button className="p-5 rounded-3xl border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 transition-colors text-left">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                <Phone className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <p className="text-lg font-semibold text-red-400">Emergency Call</p>
                <p className="text-xs text-white/30">Tap to call your emergency contact</p>
              </div>
            </div>
          </button>
        </div>

        {/* Recent Family Updates */}
        {recentPosts.length > 0 && (
          <div className="w-full">
            <p className="text-xs uppercase tracking-wider text-white/20 mb-3">Family Updates</p>
            <div className="space-y-2">
              {recentPosts.map((p, i) => (
                <div key={i} className="flex gap-3 p-3 rounded-2xl border border-white/5 bg-white/[0.02]">
                  <div className="w-8 h-8 rounded-full bg-[var(--lav-600)]/20 flex items-center justify-center shrink-0 text-xs font-semibold text-[var(--lav-400)]">
                    {(p.profiles?.full_name || '?')[0]}
                  </div>
                  <div>
                    <span className="text-xs text-white/40">{p.profiles?.full_name}</span>
                    <p className="text-sm text-white/60">{p.content}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
