'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    router.push('/dashboard');
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 sm:px-6">
      <form onSubmit={handleSubmit} className="w-full max-w-sm">
        <h1 className="font-display text-2xl sm:text-3xl text-ink dark:text-paper mb-1">Welcome back</h1>
        <p className="text-ink/60 dark:text-paper/60 mb-8">Log in to manage your jobs and candidates.</p>

        {error && (
          <p className="mb-4 text-sm text-rust bg-rust/10 border border-rust/20 rounded-md px-3 py-2">
            {error}
          </p>
        )}

        <label className="block text-sm font-medium text-ink dark:text-paper mb-1">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full mb-4 px-3 py-2 border border-ink/15 dark:border-paper/20 rounded-md bg-white dark:bg-ink/40 text-ink dark:text-paper focus:outline-none focus:ring-2 focus:ring-horizon"
        />

        <label className="block text-sm font-medium text-ink dark:text-paper mb-1">Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full mb-6 px-3 py-2 border border-ink/15 dark:border-paper/20 rounded-md bg-white dark:bg-ink/40 text-ink dark:text-paper focus:outline-none focus:ring-2 focus:ring-horizon"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-horizon text-paper py-2.5 rounded-md font-medium hover:bg-horizon-light transition-colors disabled:opacity-50"
        >
          {loading ? 'Logging in...' : 'Log in'}
        </button>
      </form>
    </div>
  );
}