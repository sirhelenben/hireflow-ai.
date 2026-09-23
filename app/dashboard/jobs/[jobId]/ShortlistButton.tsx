'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const ADVANCED_STAGES = ['interview_scheduled', 'interview_complete', 'offer', 'hired'];

export default function ShortlistButton({ applicationId, currentStage }: { applicationId: string; currentStage: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleShortlist() {
    setLoading(true);
    await fetch(`/api/applications/${applicationId}/shortlist`, { method: 'PATCH' });
    setLoading(false);
    router.refresh();
  }

  if (ADVANCED_STAGES.includes(currentStage)) {
    return <p className="text-moss text-sm font-medium">✓ Advanced to interview</p>;
  }

  return (
    <button
      onClick={handleShortlist}
      disabled={loading}
      className="text-sm bg-amber text-ink px-3 py-1.5 rounded-md font-medium hover:brightness-95 transition disabled:opacity-50"
    >
      {loading ? 'Advancing...' : 'Advance to interview'}
    </button>
  );
}