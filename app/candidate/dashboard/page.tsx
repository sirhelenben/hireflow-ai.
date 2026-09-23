import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import StatusPath from '@/ui/StatusPath';

export default async function CandidateDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/candidate/login');

  const { data: applications } = await supabase
    .from('applications')
    .select('id, job_id, pipeline_stage, applied_at, reference_number')
    .eq('candidate_profile_id', user.id)
    .order('applied_at', { ascending: false });

  const jobIds = (applications ?? []).map((a) => a.job_id);
  const { data: jobs } = jobIds.length
    ? await supabase.from('jobs').select('id, title, organization_id').in('id', jobIds)
    : { data: [] };

  const orgIds = (jobs ?? []).map((j) => j.organization_id);
  const { data: orgs } = orgIds.length
    ? await supabase.from('organizations').select('id, name').in('id', orgIds)
    : { data: [] };

  const jobById = new Map((jobs ?? []).map((j) => [j.id, j]));
  const orgById = new Map((orgs ?? []).map((o) => [o.id, o]));

  return (
    <div className="min-h-screen px-4 sm:px-6 py-10 sm:py-16">
      <div className="max-w-2xl mx-auto">
        <h1 className="font-display text-2xl sm:text-3xl text-ink dark:text-paper mb-1">Your applications</h1>
        <a href="/candidate/profile" className="text-amber font-medium text-sm inline-block mb-8">
          Edit your profile →
        </a>

        {applications?.length === 0 && (
          <p className="text-ink/50 dark:text-paper/50">You haven&apos;t applied to anything yet.</p>
        )}

        <div className="flex flex-col gap-6">
          {applications?.map((app) => {
            const job = jobById.get(app.job_id);
            const org = job ? orgById.get(job.organization_id) : null;
            return (
              <div key={app.id} className="border-b border-ink/10 dark:border-paper/10 pb-6">
                <p className="text-ink dark:text-paper font-medium">{job?.title}</p>
                <p className="text-ink/50 dark:text-paper/50 text-sm mb-3">at {org?.name}</p>
                <div className="mb-3">
                  <StatusPath stage={app.pipeline_stage} />
                </div>
                <p className="text-ink/40 dark:text-paper/40 text-xs">Reference: {app.reference_number}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}