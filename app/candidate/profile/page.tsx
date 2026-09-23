'use client';

import { useEffect, useState } from 'react';

type WorkEntry = { company: string; title: string; startDate: string; endDate: string; description: string };

export default function CandidateProfilePage() {
  const [age, setAge] = useState('');
  const [employmentStatus, setEmploymentStatus] = useState('');
  const [field, setField] = useState('');
  const [workHistory, setWorkHistory] = useState<WorkEntry[]>([]);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/candidate/profile')
      .then((res) => res.json())
      .then((data) => {
        if (data.profile) {
          setAge(data.profile.age?.toString() || '');
          setEmploymentStatus(data.profile.current_employment_status || '');
          setField(data.profile.field || '');
          setWorkHistory(data.profile.work_history || []);
        }
        setLoading(false);
      });
  }, []);

  function addWorkEntry() {
    setWorkHistory([...workHistory, { company: '', title: '', startDate: '', endDate: '', description: '' }]);
  }

  function updateWorkEntry(index: number, field: keyof WorkEntry, value: string) {
    const updated = [...workHistory];
    updated[index][field] = value;
    setWorkHistory(updated);
  }

  function removeWorkEntry(index: number) {
    setWorkHistory(workHistory.filter((_, i) => i !== index));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaved(false);
    await fetch('/api/candidate/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        age: age ? parseInt(age) : null,
        currentEmploymentStatus: employmentStatus,
        field,
        workHistory,
      }),
    });
    setSaved(true);
  }

  if (loading) return <div style={{ maxWidth: 500, margin: '4rem auto' }}><p>Loading...</p></div>;

  return (
    <form onSubmit={handleSave} style={{ maxWidth: 500, margin: '4rem auto' }}>
      <h1>Your profile</h1>
      {saved && <p style={{ color: 'green' }}>Saved!</p>}

      <label>Age</label>
      <input type="number" value={age} onChange={(e) => setAge(e.target.value)} style={{ display: 'block', width: '100%', marginBottom: 8 }} />

      <label>Current employment status</label>
      <select value={employmentStatus} onChange={(e) => setEmploymentStatus(e.target.value)} style={{ display: 'block', width: '100%', marginBottom: 8 }}>
        <option value="">Select...</option>
        <option value="employed">Employed</option>
        <option value="unemployed">Unemployed</option>
        <option value="open_to_offers">Open to offers</option>
        <option value="student">Student</option>
      </select>

      <label>Field / Industry</label>
      <input value={field} onChange={(e) => setField(e.target.value)} placeholder="e.g. Software Engineering" style={{ display: 'block', width: '100%', marginBottom: 8 }} />

      <h3>Work history</h3>
      {workHistory.map((entry, i) => (
        <div key={i} style={{ border: '1px solid #444', padding: 8, marginBottom: 8 }}>
          <input placeholder="Company" value={entry.company} onChange={(e) => updateWorkEntry(i, 'company', e.target.value)} style={{ display: 'block', width: '100%', marginBottom: 4 }} />
          <input placeholder="Job title" value={entry.title} onChange={(e) => updateWorkEntry(i, 'title', e.target.value)} style={{ display: 'block', width: '100%', marginBottom: 4 }} />
          <input placeholder="Start date" value={entry.startDate} onChange={(e) => updateWorkEntry(i, 'startDate', e.target.value)} style={{ display: 'block', width: '100%', marginBottom: 4 }} />
          <input placeholder="End date (or 'Present')" value={entry.endDate} onChange={(e) => updateWorkEntry(i, 'endDate', e.target.value)} style={{ display: 'block', width: '100%', marginBottom: 4 }} />
          <textarea placeholder="Description" value={entry.description} onChange={(e) => updateWorkEntry(i, 'description', e.target.value)} style={{ display: 'block', width: '100%', marginBottom: 4 }} />
          <button type="button" onClick={() => removeWorkEntry(i)}>Remove</button>
        </div>
      ))}
      <button type="button" onClick={addWorkEntry} style={{ marginBottom: 16 }}>+ Add work experience</button>

      <br />
      <button type="submit">Save profile</button>
    </form>
  );
}