'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function SignupPage() {
  const router = useRouter();
  const [orgName, setOrgName] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const res = await fetch('/api/auth/signup-organization', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ organizationName: orgName, fullName, email, password }),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error || 'Something went wrong');
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    router.push('/dashboard');
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 sm:px-6">
      <form onSubmit={handleSubmit} className="w-full max-w-sm">
        <h1 className="font-display text-2xl sm:text-3xl text-ink dark:text-paper mb-1">Create your organization</h1>
        <p className="text-ink/60 dark:text-paper/60 mb-8">Set up HireFlow AI for your team in a minute.</p>

        {error && (
          <p className="mb-4 text-sm text-rust bg-rust/10 border border-rust/20 rounded-md px-3 py-2">{error}</p>
        )}

        {[
          { label: 'Organization name', value: orgName, set: setOrgName, type: 'text' },
          { label: 'Your full name', value: fullName, set: setFullName, type: 'text' },
          { label: 'Email', value: email, set: setEmail, type: 'email' },
        ].map((f) => (
          <div key={f.label} className="mb-4">
            <label className="block text-sm font-medium text-ink dark:text-paper mb-1">{f.label}</label>
            <input
              type={f.type}
              value={f.value}
              onChange={(e) => f.set(e.target.value)}
              required
              className="w-full px-3 py-2 border border-ink/15 dark:border-paper/20 rounded-md bg-white dark:bg-ink/40 text-ink dark:text-paper focus:outline-none focus:ring-2 focus:ring-horizon"
            />
          </div>
        ))}

        <div className="mb-6">
          <label className="block text-sm font-medium text-ink dark:text-paper mb-1">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            className="w-full px-3 py-2 border border-ink/15 dark:border-paper/20 rounded-md bg-white dark:bg-ink/40 text-ink dark:text-paper focus:outline-none focus:ring-2 focus:ring-horizon"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-horizon text-paper py-2.5 rounded-md font-medium hover:bg-horizon-light transition-colors disabled:opacity-50"
        >
          {loading ? 'Creating...' : 'Create account'}
        </button>

        <p className="mt-6 text-sm text-ink/60 dark:text-paper/60 text-center">
          Already have an account? <a href="/login" className="text-horizon dark:text-horizon-light font-medium">Log in</a>
        </p>
      </form>
    </div>
  );
}