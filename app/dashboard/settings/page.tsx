'use client';

import { useEffect, useState } from 'react';

export default function OrgSettingsPage() {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [industry, setIndustry] = useState('');
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/organization')
      .then((res) => res.json())
      .then((data) => {
        if (data.org) {
          setName(data.org.name || '');
          setSlug(data.org.slug || '');
          setDescription(data.org.description || '');
          setLogoUrl(data.org.logo_url || '');
          setIndustry(data.org.industry || '');
        }
        setLoading(false);
      });
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSaved(false);
    const res = await fetch('/api/organization', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description, logoUrl, industry }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error || 'Something went wrong'); return; }
    setSaved(true);
  }

  const inputClass = "w-full mb-4 px-3 py-2 border border-ink/15 dark:border-paper/20 rounded-md bg-white dark:bg-ink/40 text-ink dark:text-paper focus:outline-none focus:ring-2 focus:ring-horizon";

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><p className="text-ink dark:text-paper">Loading...</p></div>;
  }

  return (
    <div className="min-h-screen px-4 sm:px-6 py-10 sm:py-16">
      <form onSubmit={handleSave} className="max-w-md mx-auto">
        <h1 className="font-display text-2xl sm:text-3xl text-ink dark:text-paper mb-8">Company profile</h1>
        {error && <p className="mb-4 text-sm text-rust bg-rust/10 border border-rust/20 rounded-md px-3 py-2">{error}</p>}
        {saved && <p className="mb-4 text-sm text-moss bg-moss/10 border border-moss/20 rounded-md px-3 py-2">Saved!</p>}

        <label className="block text-sm font-medium text-ink dark:text-paper mb-1">Company name</label>
        <input value={name} disabled className={`${inputClass} opacity-60`} />

        <label className="block text-sm font-medium text-ink dark:text-paper mb-1">Public page</label>
        <p className="text-ink/50 dark:text-paper/50 text-sm mb-4">/company/{slug}</p>

        <label className="block text-sm font-medium text-ink dark:text-paper mb-1">Industry</label>
        <input value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="e.g. Non-profit, Technology" className={inputClass} />

        <label className="block text-sm font-medium text-ink dark:text-paper mb-1">Description</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className={inputClass} />

        <label className="block text-sm font-medium text-ink dark:text-paper mb-1">Logo URL</label>
        <input value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="https://..." className={inputClass} />

        <button type="submit" className="bg-horizon text-paper px-5 py-2.5 rounded-md font-medium hover:bg-horizon-light transition">
          Save
        </button>
      </form>
    </div>
  );
}