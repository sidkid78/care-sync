'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import DoctorDigestRecorder from '@/components/ai/DoctorDigestRecorder';
import MedScanner from '@/components/ai/MedScanner';
import ShiftCalendar from '@/components/shifts/ShiftCalendar';
import {
  Heart,
  Calendar,
  Mic,
  Pill,
  Shield,
  LogOut,
  Users,
  Plus,
  Clock,
  MessageSquare,
  Loader2,
  Copy,
  Check,
  ChevronRight,
  Stethoscope,
  Camera,
  Lock,
  Send,
} from 'lucide-react';
import { format, isToday, isTomorrow, startOfWeek, addDays } from 'date-fns';

// ─── Types ──────────────────────────────────────────────
interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  role: string;
  subscription_status: string;
}

interface Family {
  id: string;
  name: string;
  invite_code: string;
}

interface FamilyMember {
  profile_id: string;
  role_in_family: string;
  profiles: { full_name: string | null; avatar_url: string | null };
}

interface Shift {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  shift_type: string;
  assigned_to_user_id: string | null;
  profiles?: { full_name: string | null } | null;
}

interface FeedPost {
  id: string;
  content: string;
  post_type: string;
  created_at: string;
  profiles: { full_name: string | null; avatar_url: string | null };
}

interface Consultation {
  id: string;
  summary: string | null;
  action_items: { task: string; priority: string }[];
  status: string;
  created_at: string;
}

// ─── Helpers ──────────────────────────────────────────────
const SHIFT_COLORS: Record<string, string> = {
  general: 'bg-[var(--sage-200)] border-[var(--sage-400)]',
  medical: 'bg-[var(--blush-200)] border-[var(--blush-400)]',
  social: 'bg-[var(--lav-200)] border-[var(--lav-400)]',
  rest: 'bg-[var(--clay-200)] border-[var(--clay-400)]',
  admin: 'bg-amber-100 border-amber-300',
};

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

// ─── Dashboard ──────────────────────────────────────────────
export default function DashboardPage() {
  const supabase = createClient();
  const router = useRouter();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [family, setFamily] = useState<Family | null>(null);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [feed, setFeed] = useState<FeedPost[]>([]);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'shifts' | 'digest' | 'scanner' | 'vault'>('overview');
  const [newPost, setNewPost] = useState('');
  const [postingFeed, setPostingFeed] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);

  // ─── Data Fetching ──────────────────────────────────────
  const loadData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/login'); return; }

    // Profile
    const { data: prof } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    setProfile(prof);

    // Family membership
    const { data: membership } = await supabase
      .from('family_members')
      .select('family_id, role_in_family, families(id, name, invite_code)')
      .eq('profile_id', user.id)
      .limit(1)
      .single();

    if (!membership?.families) {
      router.push('/onboarding');
      return;
    }

    const fam = membership.families as unknown as Family;
    setFamily(fam);

    // Parallel queries
    const [membersRes, shiftsRes, feedRes, consultRes] = await Promise.all([
      supabase
        .from('family_members')
        .select('profile_id, role_in_family, profiles(full_name, avatar_url)')
        .eq('family_id', fam.id),
      supabase
        .from('shifts')
        .select('*, profiles:assigned_to_user_id(full_name)')
        .eq('family_id', fam.id)
        .gte('start_time', startOfWeek(new Date()).toISOString())
        .lte('start_time', addDays(startOfWeek(new Date()), 7).toISOString())
        .order('start_time', { ascending: true }),
      supabase
        .from('feed_posts')
        .select('*, profiles(full_name, avatar_url)')
        .eq('family_id', fam.id)
        .order('created_at', { ascending: false })
        .limit(20),
      supabase
        .from('medical_consultations')
        .select('*')
        .eq('family_id', fam.id)
        .order('created_at', { ascending: false })
        .limit(5),
    ]);

    setMembers((membersRes.data as unknown as FamilyMember[]) || []);
    setShifts((shiftsRes.data as Shift[]) || []);
    setFeed((feedRes.data as unknown as FeedPost[]) || []);
    setConsultations((consultRes.data as Consultation[]) || []);
    setLoading(false);
  }, [supabase, router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ─── Realtime ──────────────────────────────────────────────
  useEffect(() => {
    if (!family) return;

    const channel = supabase
      .channel(`family-${family.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'feed_posts', filter: `family_id=eq.${family.id}` },
        (payload) => {
          // Fetch the full post with profile join
          supabase
            .from('feed_posts')
            .select('*, profiles(full_name, avatar_url)')
            .eq('id', payload.new.id)
            .single()
            .then(({ data }) => {
              if (data) setFeed((prev) => [data as unknown as FeedPost, ...prev]);
            });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'shifts', filter: `family_id=eq.${family.id}` },
        () => {
          // Reload shifts on any change
          supabase
            .from('shifts')
            .select('*, profiles:assigned_to_user_id(full_name)')
            .eq('family_id', family.id)
            .gte('start_time', startOfWeek(new Date()).toISOString())
            .lte('start_time', addDays(startOfWeek(new Date()), 7).toISOString())
            .order('start_time', { ascending: true })
            .then(({ data }) => setShifts((data as Shift[]) || []));
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'medical_consultations', filter: `family_id=eq.${family.id}` },
        () => {
          supabase
            .from('medical_consultations')
            .select('*')
            .eq('family_id', family.id)
            .order('created_at', { ascending: false })
            .limit(5)
            .then(({ data }) => setConsultations((data as Consultation[]) || []));
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [family, supabase]);

  // ─── Actions ──────────────────────────────────────────────
  const handlePostFeed = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPost.trim() || !family || !profile) return;
    setPostingFeed(true);
    await supabase.from('feed_posts').insert({
      family_id: family.id,
      profile_id: profile.id,
      content: newPost.trim(),
      post_type: 'update',
    });
    setNewPost('');
    setPostingFeed(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const copyInvite = () => {
    if (!family) return;
    navigator.clipboard.writeText(family.invite_code);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--clay-50)]">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--sage-500)]" />
      </div>
    );
  }

  // ─── Tab Navigation ──────────────────────────────────────
  const tabs = [
    { id: 'overview' as const, label: 'Overview', icon: Heart },
    { id: 'shifts' as const, label: 'Shifts', icon: Calendar },
    { id: 'digest' as const, label: 'Doctor Digest', icon: Stethoscope },
    { id: 'scanner' as const, label: 'Med Scanner', icon: Camera },
    { id: 'vault' as const, label: 'Vault', icon: Lock },
  ];

  return (
    <div className="min-h-screen bg-[var(--clay-50)]">
      {/* Top Bar */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-[var(--clay-200)]">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-[var(--sage-400)] to-[var(--sage-600)] rounded-xl flex items-center justify-center">
              <Heart className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-[var(--clay-900)]">{family?.name}</h1>
              <p className="text-xs text-[var(--clay-400)]">{getGreeting()}, {profile?.full_name?.split(' ')[0]}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Member avatars */}
            <div className="flex -space-x-2 mr-2">
              {members.slice(0, 4).map((m) => (
                <div
                  key={m.profile_id}
                  className="w-7 h-7 rounded-full bg-[var(--sage-200)] border-2 border-white flex items-center justify-center text-xs font-semibold text-[var(--sage-700)]"
                  title={m.profiles?.full_name || 'Member'}
                >
                  {(m.profiles?.full_name || '?')[0]}
                </div>
              ))}
              {members.length > 4 && (
                <div className="w-7 h-7 rounded-full bg-[var(--clay-200)] border-2 border-white flex items-center justify-center text-xs text-[var(--clay-500)]">
                  +{members.length - 4}
                </div>
              )}
            </div>
            <button
              onClick={copyInvite}
              className="text-xs text-[var(--clay-400)] hover:text-[var(--clay-600)] flex items-center gap-1 px-2 py-1 rounded-md hover:bg-[var(--clay-100)] transition-colors"
              title="Copy invite code"
            >
              {codeCopied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
              <span className="font-mono">{family?.invite_code}</span>
            </button>
            <button
              onClick={() => router.push('/senior')}
              className="text-xs text-[var(--clay-400)] hover:text-[var(--clay-600)] px-2 py-1 rounded-md hover:bg-[var(--clay-100)] transition-colors"
              title="Senior Mode"
            >
              👴 Senior
            </button>
            <button
              onClick={handleSignOut}
              className="p-2 text-[var(--clay-400)] hover:text-[var(--clay-600)] rounded-lg hover:bg-[var(--clay-100)] transition-colors"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-5xl mx-auto px-4 flex gap-1 -mb-px">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-t-lg transition-colors border-b-2 ${
                activeTab === t.id
                  ? 'border-[var(--sage-600)] text-[var(--sage-700)] bg-white'
                  : 'border-transparent text-[var(--clay-400)] hover:text-[var(--clay-600)]'
              }`}
            >
              <t.icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* ─── Overview Tab ─── */}
        {activeTab === 'overview' && (
          <>
            {/* Weekly Shifts */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-[var(--clay-700)] flex items-center gap-2">
                  <Calendar className="w-4 h-4" /> This Week
                </h2>
              </div>
              {shifts.length === 0 ? (
                <div className="card-warm p-6 text-center text-sm text-[var(--clay-400)]">
                  No shifts this week. Tap + to add one.
                </div>
              ) : (
                <div className="grid gap-2">
                  {shifts.map((s) => {
                    const start = new Date(s.start_time);
                    const dayLabel = isToday(start) ? 'Today' : isTomorrow(start) ? 'Tomorrow' : format(start, 'EEE');
                    return (
                      <div
                        key={s.id}
                        className={`flex items-center gap-3 p-3 rounded-xl border-l-4 bg-white ${SHIFT_COLORS[s.shift_type] || SHIFT_COLORS.general}`}
                      >
                        <div className="text-center w-12 shrink-0">
                          <div className="text-xs font-bold text-[var(--clay-500)] uppercase">{dayLabel}</div>
                          <div className="text-lg font-semibold text-[var(--clay-800)]">{format(start, 'd')}</div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[var(--clay-800)] truncate">{s.title}</p>
                          <p className="text-xs text-[var(--clay-400)]">
                            {format(start, 'h:mm a')} – {format(new Date(s.end_time), 'h:mm a')}
                            {s.profiles?.full_name && <span> · {s.profiles.full_name}</span>}
                          </p>
                        </div>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-white/80 text-[var(--clay-500)] capitalize">
                          {s.shift_type}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Recent Consultations */}
            {consultations.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-[var(--clay-700)] flex items-center gap-2 mb-3">
                  <Mic className="w-4 h-4" /> Recent Digests
                </h2>
                <div className="grid gap-2">
                  {consultations.map((c) => (
                    <div key={c.id} className="card-warm p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          c.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {c.status}
                        </span>
                        <span className="text-xs text-[var(--clay-400)]">{format(new Date(c.created_at), 'MMM d, h:mm a')}</span>
                      </div>
                      {c.summary && <p className="text-sm text-[var(--clay-700)]">{c.summary}</p>}
                      {c.action_items?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {c.action_items.map((a, i) => (
                            <span
                              key={i}
                              className={`text-xs px-2 py-0.5 rounded-md border ${
                                a.priority === 'high' ? 'bg-red-50 border-red-200 text-red-700' :
                                a.priority === 'medium' ? 'bg-amber-50 border-amber-200 text-amber-700' :
                                'bg-emerald-50 border-emerald-200 text-emerald-700'
                              }`}
                            >
                              {a.task}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Family Feed */}
            <section>
              <h2 className="text-sm font-semibold text-[var(--clay-700)] flex items-center gap-2 mb-3">
                <MessageSquare className="w-4 h-4" /> Family Feed
                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" title="Live" />
              </h2>

              {/* Compose */}
              <form onSubmit={handlePostFeed} className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={newPost}
                  onChange={(e) => setNewPost(e.target.value)}
                  placeholder="Share an update with your family…"
                  className="flex-1 px-4 py-2.5 border border-[var(--clay-200)] rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[var(--sage-300)] transition-all placeholder:text-[var(--clay-300)]"
                />
                <button
                  type="submit"
                  disabled={postingFeed || !newPost.trim()}
                  className="px-4 py-2.5 bg-[var(--sage-600)] text-white rounded-xl disabled:opacity-50 transition-colors hover:bg-[var(--sage-700)]"
                >
                  {postingFeed ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </form>

              {feed.length === 0 ? (
                <div className="text-center text-sm text-[var(--clay-400)] py-8">
                  No posts yet. Share the first update!
                </div>
              ) : (
                <div className="space-y-3">
                  {feed.map((p) => (
                    <div key={p.id} className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-[var(--lav-200)] flex items-center justify-center shrink-0 text-xs font-semibold text-[var(--lav-700)]">
                        {(p.profiles?.full_name || '?')[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2">
                          <span className="text-sm font-medium text-[var(--clay-800)]">{p.profiles?.full_name || 'Unknown'}</span>
                          <span className="text-xs text-[var(--clay-400)]">{format(new Date(p.created_at), 'h:mm a')}</span>
                        </div>
                        <p className="text-sm text-[var(--clay-600)] mt-0.5">{p.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}

        {/* ─── Shifts Tab ─── */}
        {activeTab === 'shifts' && family && (
          <section>
            <ShiftCalendar familyId={family.id} members={members as any} />
          </section>
        )}

        {/* ─── Doctor Digest Tab ─── */}
        {activeTab === 'digest' && family && (
          <section>
            <div className="card-warm p-5 space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-[var(--clay-900)]">Doctor Digest</h2>
                <p className="text-sm text-[var(--clay-400)]">Record a consultation — Gemini extracts a summary and action items.</p>
              </div>
              <DoctorDigestRecorder familyId={family.id} />
            </div>
          </section>
        )}

        {/* ─── Med Scanner Tab ─── */}
        {activeTab === 'scanner' && (
          <section>
            <div className="card-warm p-5 space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-[var(--clay-900)]">Med-Cabinet Scanner</h2>
                <p className="text-sm text-[var(--clay-400)]">Scan a medication label to check for drug interactions.</p>
              </div>
              <MedScanner />
            </div>
          </section>
        )}

        {/* ─── Vault Tab ─── */}
        {activeTab === 'vault' && (
          <section>
            <div className="card-warm p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[var(--lav-100)] rounded-xl flex items-center justify-center">
                  <Shield className="w-5 h-5 text-[var(--lav-600)]" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-[var(--clay-900)]">Zero-Knowledge Vault</h2>
                  <p className="text-sm text-[var(--clay-400)]">Files are encrypted on your device. We never see your data.</p>
                </div>
              </div>
              <p className="text-sm text-[var(--clay-500)] bg-[var(--lav-50)] p-3 rounded-lg border border-[var(--lav-200)]">
                🔒 AES-256-GCM encryption with PBKDF2 key derivation (600,000 iterations).
                Your files are encrypted before they leave your browser.
              </p>
              <div className="text-center text-sm text-[var(--clay-400)] py-4">
                Vault UI coming soon — encryption engine is production-ready.
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
