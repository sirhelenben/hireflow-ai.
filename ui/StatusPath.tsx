const STAGES = ['applied', 'under_review', 'interview_scheduled', 'interview_complete', 'offer', 'hired'] as const;

const LABELS: Record<string, string> = {
  applied: 'Applied',
  under_review: 'In review',
  interview_scheduled: 'Interview scheduled',
  interview_complete: 'Interview complete',
  offer: 'Offer',
  hired: 'Hired',
  rejected: 'Not selected',
};

export default function StatusPath({ stage }: { stage: string }) {
  if (stage === 'rejected') {
    return (
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-rust" />
        <span className="text-sm font-medium text-rust">Not selected</span>
      </div>
    );
  }

  const currentIndex = STAGES.indexOf(stage as typeof STAGES[number]);

  return (
    <div className="flex items-center flex-wrap gap-y-2">
      {STAGES.map((s, i) => {
        const passed = i <= currentIndex;
        const isLast = i === STAGES.length - 1;
        return (
          <div key={s} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <span className={`h-2.5 w-2.5 rounded-full ${passed ? 'bg-horizon' : 'bg-ink/15 dark:bg-paper/15'}`} />
              <span className={`text-xs ${passed ? 'text-ink dark:text-paper' : 'text-ink/40 dark:text-paper/40'}`}>{LABELS[s]}</span>
            </div>
            {!isLast && (
              <span className={`h-px w-8 mx-1 ${i < currentIndex ? 'bg-horizon' : 'bg-ink/15 dark:bg-paper/15'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}