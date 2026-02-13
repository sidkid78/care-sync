'use client';

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';
import { Loader2, Mail, Lock, User, Heart } from 'lucide-react';

export default function SignupPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const supabase = createClient();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/onboarding`,
      },
    });

    if (signUpError) {
      setError(signUpError.message);
    } else {
      setSuccess(true);
    }
    setLoading(false);
  };

  const handleOAuth = async (provider: 'google') => {
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback?next=/onboarding` },
    });
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--clay-50)] p-4">
        <div className="card-warm p-8 max-w-sm w-full text-center space-y-4">
          <div className="w-16 h-16 bg-[var(--sage-100)] rounded-full flex items-center justify-center mx-auto">
            <Mail className="w-8 h-8 text-[var(--sage-600)]" />
          </div>
          <h2 className="text-xl font-semibold text-[var(--clay-900)]">Verify your email</h2>
          <p className="text-sm text-[var(--clay-500)]">
            We sent a confirmation link to <span className="font-medium text-[var(--clay-700)]">{email}</span>.
            Click the link to activate your account.
          </p>
          <Link
            href="/login"
            className="inline-block text-sm text-[var(--sage-600)] hover:text-[var(--sage-700)] font-medium"
          >
            ← Back to login
          </Link>
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
          <h1 className="text-2xl font-semibold text-[var(--clay-900)]">Create account</h1>
          <p className="text-sm text-[var(--clay-400)]">Start coordinating care for your family</p>
        </div>

        {/* OAuth */}
        <button
          onClick={() => handleOAuth('google')}
          className="w-full flex items-center justify-center gap-3 py-2.5 px-4 border border-[var(--clay-200)] rounded-xl bg-white hover:bg-[var(--clay-50)] transition-colors text-sm font-medium text-[var(--clay-700)]"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[var(--clay-200)]" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-white px-2 text-[var(--clay-400)]">or</span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSignup} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="name" className="text-xs font-medium text-[var(--clay-500)] uppercase tracking-wide">
              Full Name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--clay-400)]" />
              <input
                id="name"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your name"
                required
                className="w-full pl-10 pr-4 py-2.5 border border-[var(--clay-200)] rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[var(--sage-300)] focus:border-[var(--sage-400)] transition-all placeholder:text-[var(--clay-300)]"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="email" className="text-xs font-medium text-[var(--clay-500)] uppercase tracking-wide">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--clay-400)]" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full pl-10 pr-4 py-2.5 border border-[var(--clay-200)] rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[var(--sage-300)] focus:border-[var(--sage-400)] transition-all placeholder:text-[var(--clay-300)]"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="password" className="text-xs font-medium text-[var(--clay-500)] uppercase tracking-wide">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--clay-400)]" />
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 6 characters"
                required
                minLength={6}
                className="w-full pl-10 pr-4 py-2.5 border border-[var(--clay-200)] rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[var(--sage-300)] focus:border-[var(--sage-400)] transition-all placeholder:text-[var(--clay-300)]"
              />
            </div>
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
            Create Account
          </button>
        </form>

        <p className="text-center text-sm text-[var(--clay-400)]">
          Already have an account?{' '}
          <Link href="/login" className="text-[var(--sage-600)] hover:text-[var(--sage-700)] font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
