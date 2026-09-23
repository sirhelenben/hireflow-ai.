'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

type Question = { id: string; question_text: string; question_type: string; options: string[] | null };

export default function ScreeningQuestionsPage() {
  const params = useParams();
  const jobId = params.jobId as string;

  const [questions, setQuestions] = useState<Question[]>([]);
  const [questionText, setQuestionText] = useState('');
  const [questionType, setQuestionType] = useState('text');
  const [optionsInput, setOptionsInput] = useState('');
  const [loading, setLoading] = useState(false);

  async function loadQuestions() {
    const res = await fetch(`/api/jobs/${jobId}/questions`);
    const data = await res.json();
    setQuestions(data.questions || []);
  }

  useEffect(() => {
    let cancelled = false;

    async function loadInitialQuestions() {
      const res = await fetch(`/api/jobs/${jobId}/questions`);
      const data = await res.json();
      if (!cancelled) setQuestions(data.questions || []);
    }

    loadInitialQuestions();
    return () => { cancelled = true; };
  }, [jobId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const options = questionType === 'multiple_choice'
      ? optionsInput.split(',').map((o) => o.trim()).filter(Boolean)
      : undefined;

    await fetch(`/api/jobs/${jobId}/questions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questionText, questionType, options }),
    });

    setQuestionText('');
    setOptionsInput('');
    setLoading(false);
    loadQuestions();
  }

  const inputClass = "w-full mb-3 px-3 py-2 border border-ink/15 dark:border-paper/20 rounded-md bg-white dark:bg-ink/40 text-ink dark:text-paper focus:outline-none focus:ring-2 focus:ring-horizon";

  return (
    <div className="min-h-screen px-4 sm:px-6 py-10 sm:py-16">
      <div className="max-w-md mx-auto">
        <h1 className="font-display text-2xl sm:text-3xl text-ink dark:text-paper mb-6">Screening Questions</h1>

        <div className="flex flex-col gap-2 mb-8">
          {questions.map((q) => (
            <div key={q.id} className="border-b border-ink/10 dark:border-paper/10 pb-2">
              <p className="text-ink dark:text-paper">{q.question_text}</p>
              <p className="text-ink/40 dark:text-paper/40 text-xs capitalize">{q.question_type.replace('_', ' ')}</p>
            </div>
          ))}
          {questions.length === 0 && <p className="text-ink/50 dark:text-paper/50">No questions yet.</p>}
        </div>

        <form onSubmit={handleSubmit}>
          <input placeholder="Question text" value={questionText} onChange={(e) => setQuestionText(e.target.value)} required className={inputClass} />
          <select value={questionType} onChange={(e) => setQuestionType(e.target.value)} className={inputClass}>
            <option value="text">Text answer</option>
            <option value="yes_no">Yes / No</option>
            <option value="multiple_choice">Multiple choice</option>
          </select>
          {questionType === 'multiple_choice' && (
            <input placeholder="Options, comma separated" value={optionsInput} onChange={(e) => setOptionsInput(e.target.value)} className={inputClass} />
          )}
          <button type="submit" disabled={loading} className="bg-horizon text-paper px-4 py-2 rounded-md font-medium text-sm hover:bg-horizon-light transition disabled:opacity-50">
            {loading ? 'Adding...' : 'Add question'}
          </button>
        </form>
      </div>
    </div>
  );
}