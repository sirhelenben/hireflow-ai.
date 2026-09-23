import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function JobsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: jobs } = await supabase
    .from('jobs')
    .select('id, title, status, created_at')
    .order('created_at', { ascending: false });

  const statusColor: Record<string, string> = {
    draft: 'text-ink/40 dark:text-paper/40',
    published: 'text-moss',
    closed: 'text-ink/40 dark:text-paper/40',
    archived: 'text-ink/30 dark:text-paper/30',
  };

  return (
    <div className="min-h-screen px-4 sm:px-6 py-10 sm:py-16">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-display text-2xl sm:text-3xl text-ink dark:text-paper">Jobs</h1>
          <Link
            href="/dashboard/jobs/new"
            className="bg-amber text-ink px-4 py-2 rounded-md font-medium text-sm hover:brightness-95 transition"
          >
            + Create job
          </Link>
        </div>

        {jobs?.length === 0 && (
          <p className="text-ink/50 dark:text-paper/50">No jobs yet — create your first one to get started.</p>
        )}

        <div className="divide-y divide-ink/10 dark:divide-paper/10">
          {jobs?.map((job) => (
            <Link
              key={job.id}
              href={`/dashboard/jobs/${job.id}`}
              className="flex items-center justify-between py-4 hover:bg-ink/[0.03] dark:hover:bg-paper/[0.05] -mx-2 px-2 rounded-md transition-colors"
            >
              <span className="text-ink dark:text-paper font-medium">{job.title}</span>
              <span className={`text-sm capitalize ${statusColor[job.status] || ''}`}>{job.status}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}