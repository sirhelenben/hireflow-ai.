import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import ShortlistButton from './ShortlistButton';
import StatusPath from '@/ui/StatusPath';

export default async function JobApplicantsPage({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const { jobId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: job } = await supabase.from('jobs').select('id, title').eq('id', jobId).single();
  if (!job) {
    return <div className="min-h-screen flex items-center justify-center"><p className="text-ink dark:text-paper">Job not found.</p></div>;
  }

  const { data: applications } = await supabase
    .from('applications')
    .select('id, candidate_profile_id, pipeline_stage, applied_at')
    .eq('job_id', jobId)
    .order('applied_at', { ascending: false });

  const candidateIds = (applications ?? []).map((a) => a.candidate_profile_id);
  const applicationIds = (applications ?? []).map((a) => a.id);

  const { data: candidates } = candidateIds.length
    ? await supabase.from('candidate_profiles').select('id, full_name, email').in('id', candidateIds)
    : { data: [] };

  const { data: evaluations } = applicationIds.length
    ? await supabase
        .from('ai_evaluations')
        .select('application_id, score, explanation, created_at')
        .in('application_id', applicationIds)
        .order('created_at', { ascending: false })
    : { data: [] };

  const latestEvalByApplication = new Map<string, { score: number; explanation: string }>();
  for (const evaluation of evaluations ?? []) {
    if (!latestEvalByApplication.has(evaluation.application_id)) {
      latestEvalByApplication.set(evaluation.application_id, {
        score: evaluation.score,
        explanation: evaluation.explanation,
      });
    }
  }

  const candidateById = new Map((candidates ?? []).map((c) => [c.id, c]));

  const rows = (applications ?? []).map((app) => {
    const candidate = candidateById.get(app.candidate_profile_id);
    const evaluation = latestEvalByApplication.get(app.id);
    return {
      applicationId: app.id,
      name: candidate?.full_name ?? 'Unknown',
      email: candidate?.email ?? '',
      pipelineStage: app.pipeline_stage,
      score: evaluation?.score ?? null,
      explanation: evaluation?.explanation ?? '',
    };
  });

  rows.sort((a, b) => (b.score ?? -1) - (a.score ?? -1));

  return (
    <div className="min-h-screen px-4 sm:px-6 py-10 sm:py-16">
      <div className="max-w-3xl mx-auto">
        <h1 className="font-display text-2xl sm:text-3xl text-ink dark:text-paper mb-4">{job.title} — Applicants</h1>

        <div className="flex gap-4 mb-8 text-sm">
          <a href={`/dashboard/jobs/${jobId}/questions`} className="text-horizon dark:text-horizon-light font-medium">
            Manage screening questions
          </a>
          <a href={`/api/jobs/${jobId}/export`} className="text-horizon dark:text-horizon-light font-medium">
            Export CSV
          </a>
        </div>

        {rows.length === 0 && <p className="text-ink/50 dark:text-paper/50">No applicants yet.</p>}

        <div className="flex flex-col gap-6">
          {rows.map((row) => (
            <div key={row.applicationId} className="border-b border-ink/10 dark:border-paper/10 pb-6">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-ink dark:text-paper font-medium">{row.name}</p>
                  <p className="text-ink/50 dark:text-paper/50 text-sm">{row.email}</p>
                </div>
                {row.score !== null && (
                  <span className="text-sm font-semibold text-horizon dark:text-horizon-light">{row.score}/100</span>
                )}
              </div>
              {row.explanation && (
                <p className="text-ink/70 dark:text-paper/70 text-sm mb-3">{row.explanation}</p>
              )}
              <div className="mb-3">
                <StatusPath stage={row.pipelineStage} />
              </div>
              <ShortlistButton applicationId={row.applicationId} currentStage={row.pipelineStage} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}