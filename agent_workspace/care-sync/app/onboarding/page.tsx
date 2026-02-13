'use client';

import { useState } from 'react';
import { createFamily, joinFamily } from '@/app/actions/family';
import { useRouter } from 'next/navigation';
import { Users, UserPlus, Loader2, Copy, Check, Heart } from 'lucide-react';

export default function OnboardingPage() {
  const [mode, setMode] = useState<'choose' | 'create' | 'join'>('choose');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inviteCode, setInviteCode] = useState('');
  const [createdCode, setCreatedCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const router = useRouter();

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const formData = new FormData(e.currentTarget);
    const result = await createFamily(formData);

    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      setCreatedCode(result.inviteCode!);
      setLoading(false);
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const result = await joinFamily(inviteCode);

    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      router.push('/dashboard');
    }
  };

  const copyCode = () => {
    if (!createdCode) return;
    navigator.clipboard.writeText(createdCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Family created success
  if (createdCode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--clay-50)] p-4">
        <div className="card-warm p-8 max-w-sm w-full text-center space-y-5">
          <div className="w-16 h-16 bg-[var(--sage-100)] rounded-full flex items-center justify-center mx-auto">
            <Users className="w-8 h-8 text-[var(--sage-600)]" />
          </div>
          <h2 className="text-xl font-semibold text-[var(--clay-900)]">Family created!</h2>
          <p className="text-sm text-[var(--clay-500)]">
            Share this invite code with your family members:
          </p>
          <div className="flex items-center justify-center gap-2">
            <code className="text-2xl font-mono font-bold tracking-widest text-[var(--sage-700)] bg-[var(--sage-50)] px-5 py-3 rounded-xl border border-[var(--sage-200)]">
              {createdCode}
            </code>
            <button
              onClick={copyCode}
              className="p-2 text-[var(--clay-400)] hover:text-[var(--clay-600)] transition-colors"
            >
              {copied ? <Check className="w-5 h-5 text-emerald-500" /> : <Copy className="w-5 h-5" />}
            </button>
          </div>
          <button
            onClick={() => router.push('/dashboard')}
            className="w-full py-2.5 bg-[var(--sage-600)] text-white rounded-xl font-medium text-sm hover:bg-[var(--sage-700)] transition-colors shadow-sm"
          >
            Go to Dashboard →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--clay-50)] p-4">
      <div className="card-warm p-8 max-w-sm w-full space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-gradient-to-br from-[var(--sage-400)] to-[var(--sage-600)] rounded-2xl flex items-center justify-center mx-auto shadow-md">
            <Heart className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-semibold text-[var(--clay-900)]">
            {mode === 'choose' ? 'Set up your care circle' : mode === 'create' ? 'Create a family' : 'Join a family'}
          </h1>
          <p className="text-sm text-[var(--clay-400)]">
            {mode === 'choose'
              ? 'Create a new family group or join an existing one'
              : mode === 'create'
              ? 'Name your family and invite others with a code'
              : 'Enter the invite code shared by your family'}
          </p>
        </div>

        {mode === 'choose' && (
          <div className="space-y-3">
            <button
              onClick={() => setMode('create')}
              className="w-full flex items-center gap-4 p-4 border border-[var(--clay-200)] rounded-xl hover:bg-[var(--sage-50)] hover:border-[var(--sage-300)] transition-all text-left"
            >
              <div className="w-10 h-10 bg-[var(--sage-100)] rounded-full flex items-center justify-center shrink-0">
                <Users className="w-5 h-5 text-[var(--sage-600)]" />
              </div>
              <div>
                <span className="font-medium text-[var(--clay-900)] text-sm">Create a Family</span>
                <p className="text-xs text-[var(--clay-400)]">I&apos;m setting up care coordination</p>
              </div>
            </button>
            <button
              onClick={() => setMode('join')}
              className="w-full flex items-center gap-4 p-4 border border-[var(--clay-200)] rounded-xl hover:bg-[var(--lav-50)] hover:border-[var(--lav-300)] transition-all text-left"
            >
              <div className="w-10 h-10 bg-[var(--lav-100)] rounded-full flex items-center justify-center shrink-0">
                <UserPlus className="w-5 h-5 text-[var(--lav-600)]" />
              </div>
              <div>
                <span className="font-medium text-[var(--clay-900)] text-sm">Join a Family</span>
                <p className="text-xs text-[var(--clay-400)]">I have an invite code</p>
              </div>
            </button>
          </div>
        )}

        {mode === 'create' && (
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[var(--clay-500)] uppercase tracking-wide">
                Family Name
              </label>
              <input
                name="familyName"
                type="text"
                placeholder="e.g. The Johnson Family"
                required
                className="w-full px-4 py-2.5 border border-[var(--clay-200)] rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[var(--sage-300)] focus:border-[var(--sage-400)] transition-all placeholder:text-[var(--clay-300)]"
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-[var(--sage-600)] text-white rounded-xl font-medium text-sm hover:bg-[var(--sage-700)] transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Create Family
            </button>
            <button type="button" onClick={() => { setMode('choose'); setError(null); }} className="w-full text-center text-sm text-[var(--clay-400)] hover:text-[var(--clay-600)]">
              ← Back
            </button>
          </form>
        )}

        {mode === 'join' && (
          <form onSubmit={handleJoin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[var(--clay-500)] uppercase tracking-wide">
                Invite Code
              </label>
              <input
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                placeholder="ABCD1234"
                required
                maxLength={8}
                className="w-full px-4 py-2.5 border border-[var(--clay-200)] rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[var(--lav-300)] focus:border-[var(--lav-400)] transition-all placeholder:text-[var(--clay-300)] text-center font-mono text-lg tracking-widest uppercase"
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-[var(--lav-600)] text-white rounded-xl font-medium text-sm hover:bg-[var(--lav-700)] transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Join Family
            </button>
            <button type="button" onClick={() => { setMode('choose'); setError(null); }} className="w-full text-center text-sm text-[var(--clay-400)] hover:text-[var(--clay-600)]">
              ← Back
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
