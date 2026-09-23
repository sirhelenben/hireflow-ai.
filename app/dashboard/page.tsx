import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('users')
    .select('full_name, role, organization_id')
    .eq('id', user.id)
    .single();

  let orgName = '';
  if (profile?.organization_id) {
    const { data: org } = await supabase
      .from('organizations')
      .select('name')
      .eq('id', profile.organization_id)
      .single();
    orgName = org?.name ?? '';
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 sm:px-6">
      <div className="w-full max-w-sm">
        <h1 className="font-display text-2xl sm:text-3xl text-ink dark:text-paper mb-1">Welcome, {profile?.full_name}</h1>
        <p className="text-ink/60 dark:text-paper/60 mb-1">{orgName}</p>
        <p className="text-ink/40 dark:text-paper/40 text-sm mb-8 capitalize">{profile?.role?.replace('_', ' ')}</p>

        <div className="flex flex-col gap-3">
          <Link
            href="/dashboard/jobs"
            className="w-full text-center bg-horizon text-paper py-2.5 rounded-md font-medium hover:bg-horizon-light transition-colors"
          >
            View jobs
          </Link>
          <Link
            href="/dashboard/settings"
            className="w-full text-center border border-ink/15 dark:border-paper/20 text-ink dark:text-paper py-2.5 rounded-md font-medium hover:bg-ink/5 dark:hover:bg-paper/10 transition-colors"
          >
            Company profile settings
          </Link>
        </div>
      </div>
    </div>
  );
}