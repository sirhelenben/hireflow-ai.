'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NewJobPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [department, setDepartment] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const res = await fetch('/api/jobs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description, department }),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error || 'Something went wrong');
      setLoading(false);
      return;
    }

    router.push('/dashboard/jobs');
    router.refresh();
  }

  return (
    <div className="min-h-screen px-4 sm:px-6 py-10 sm:py-16">
      <form onSubmit={handleSubmit} className="max-w-lg mx-auto">
        <h1 className="font-display text-2xl sm:text-3xl text-ink dark:text-paper mb-1">Create a job posting</h1>
        <p className="text-ink/60 dark:text-paper/60 mb-8">It starts as a draft until you publish it.</p>

        {error && (
          <p className="mb-4 text-sm text-rust bg-rust/10 border border-rust/20 rounded-md px-3 py-2">{error}</p>
        )}

        <label className="block text-sm font-medium text-ink dark:text-paper mb-1">Job title</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="w-full mb-4 px-3 py-2 border border-ink/15 dark:border-paper/20 rounded-md bg-white dark:bg-ink/40 text-ink dark:text-paper focus:outline-none focus:ring-2 focus:ring-horizon"
        />

        <label className="block text-sm font-medium text-ink dark:text-paper mb-1">Department (optional)</label>
        <input
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          className="w-full mb-4 px-3 py-2 border border-ink/15 dark:border-paper/20 rounded-md bg-white dark:bg-ink/40 text-ink dark:text-paper focus:outline-none focus:ring-2 focus:ring-horizon"
        />

        <label className="block text-sm font-medium text-ink dark:text-paper mb-1">Job description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          rows={6}
          className="w-full mb-6 px-3 py-2 border border-ink/15 dark:border-paper/20 rounded-md bg-white dark:bg-ink/40 text-ink dark:text-paper focus:outline-none focus:ring-2 focus:ring-horizon"
        />

        <button
          type="submit"
          disabled={loading}
          className="bg-horizon text-paper px-5 py-2.5 rounded-md font-medium hover:bg-horizon-light transition-colors disabled:opacity-50"
        >
          {loading ? 'Creating...' : 'Create job (as draft)'}
        </button>
      </form>
    </div>
  );
}