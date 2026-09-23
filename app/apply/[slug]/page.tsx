'use client';

import { useState, useRef, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Script from 'next/script';

type Question = {
  id: string;
  question_text: string;
  question_type: string;
  options: string[] | null;
  is_required: boolean;
};

export default function ApplyPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [resume, setResume] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState('');
  const widgetRendered = useRef(false);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch(`/api/public/jobs/${slug}/questions`)
      .then((res) => res.json())
      .then((data) => setQuestions(data.questions || []));
  }, [slug]);

  function renderTurnstile() {
    if (widgetRendered.current) return;
    widgetRendered.current = true;
    // @ts-expect-error - turnstile is loaded globally via the script tag below
    window.turnstile.render('#turnstile-widget', {
      sitekey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
      callback: (token: string) => setTurnstileToken(token),
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!resume) { setError('Please attach your resume'); setLoading(false); return; }
    if (!turnstileToken) { setError('Please complete the verification checkbox'); setLoading(false); return; }

    const missingRequired = questions.find((q) => q.is_required && !answers[q.id]?.trim());
    if (missingRequired) {
      setError(`Please answer: ${missingRequired.question_text}`);
      setLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append('jobSlug', slug);
    formData.append('fullName', fullName);
    formData.append('email', email);
    formData.append('password', password);
    formData.append('resume', resume);
    formData.append('turnstileToken', turnstileToken);
    formData.append('answers', JSON.stringify(
      questions.map((q) => ({ questionId: q.id, answerText: answers[q.id] || '' }))
    ));

    const res = await fetch('/api/applications', { method: 'POST', body: formData });
    const data = await res.json();

    if (!res.ok) { setError(data.error || 'Something went wrong'); setLoading(false); return; }

    setSuccess(`Application submitted! Your reference number is ${data.referenceNumber}`);
    setLoading(false);
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 sm:px-6">
        <div className="max-w-sm text-center">
          <p className="text-ink dark:text-paper text-lg">{success}</p>
        </div>
      </div>
    );
  }

  const inputClass = "w-full mb-4 px-3 py-2 border border-ink/15 dark:border-paper/20 rounded-md bg-white dark:bg-ink/40 text-ink dark:text-paper focus:outline-none focus:ring-2 focus:ring-amber";

  return (
    <>
      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" onLoad={renderTurnstile} />
      <div className="min-h-screen px-4 sm:px-6 py-10 sm:py-16">
        <form onSubmit={handleSubmit} className="max-w-md mx-auto">
          <h1 className="font-display text-2xl sm:text-3xl text-ink dark:text-paper mb-1">Apply for this job</h1>
          <p className="text-ink/60 dark:text-paper/60 mb-8">Takes about two minutes.</p>

          {error && (
            <p className="mb-4 text-sm text-rust bg-rust/10 border border-rust/20 rounded-md px-3 py-2">{error}</p>
          )}

          <label className="block text-sm font-medium text-ink dark:text-paper mb-1">Full name</label>
          <input value={fullName} onChange={(e) => setFullName(e.target.value)} required className={inputClass} />

          <label className="block text-sm font-medium text-ink dark:text-paper mb-1">Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className={inputClass} />

          <label className="block text-sm font-medium text-ink dark:text-paper mb-1">Create a password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} className={inputClass} />

          <label className="block text-sm font-medium text-ink dark:text-paper mb-1">Resume (PDF or DOCX)</label>
          <input
            type="file"
            accept=".pdf,.docx"
            onChange={(e) => setResume(e.target.files?.[0] || null)}
            required
            className="w-full mb-6 text-sm text-ink dark:text-paper file:mr-3 file:py-2 file:px-3 file:rounded-md file:border-0 file:bg-horizon file:text-paper file:text-sm file:font-medium"
          />

          {questions.length > 0 && (
            <h3 className="font-display text-lg text-ink dark:text-paper mb-3">Screening Questions</h3>
          )}
          {questions.map((q) => (
            <div key={q.id} className="mb-4">
              <label className="block text-sm font-medium text-ink dark:text-paper mb-1">
                {q.question_text}{q.is_required ? ' *' : ''}
              </label>
              {q.question_type === 'yes_no' ? (
                <select
                  value={answers[q.id] || ''}
                  onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                  className={inputClass}
                >
                  <option value="">Select...</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              ) : q.question_type === 'multiple_choice' ? (
                <select
                  value={answers[q.id] || ''}
                  onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                  className={inputClass}
                >
                  <option value="">Select...</option>
                  {(q.options || []).map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              ) : (
                <input
                  value={answers[q.id] || ''}
                  onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                  className={inputClass}
                />
              )}
            </div>
          ))}

          <div id="turnstile-widget" className="mb-6" />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-amber text-ink py-2.5 rounded-md font-medium hover:brightness-95 transition disabled:opacity-50"
          >
            {loading ? 'Submitting...' : 'Submit application'}
          </button>
        </form>
      </div>
    </>
  );
}