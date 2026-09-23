import { createServiceRoleClient } from '@/lib/supabase/service-role';
import Link from 'next/link';

export default async function CompanyProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = createServiceRoleClient();

  const { data: org } = await supabase
    .from('organizations')
    .select('id, name, description, logo_url, industry')
    .eq('slug', slug)
    .single();

  if (!org) {
    return <div className="min-h-screen flex items-center justify-center"><p className="text-ink dark:text-paper">Company not found.</p></div>;
  }

  const { data: jobs } = await supabase
    .from('jobs')
    .select('id, title, public_slug, department')
    .eq('organization_id', org.id)
    .eq('status', 'published')
    .order('created_at', { ascending: false });

  return (
    <div className="min-h-screen px-4 sm:px-6 py-10 sm:py-16">
      <div className="max-w-2xl mx-auto">
        {org.logo_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={org.logo_url} alt={org.name} className="max-w-[120px] mb-4 rounded-md" />
        )}
        <h1 className="font-display text-2xl sm:text-3xl text-ink dark:text-paper mb-1">{org.name}</h1>
        {org.industry && <p className="text-ink/50 dark:text-paper/50 mb-4">{org.industry}</p>}
        {org.description && <p className="text-ink/80 dark:text-paper/80 mb-10">{org.description}</p>}

        <h2 className="font-display text-xl text-ink dark:text-paper mb-4">Open positions</h2>
        {jobs?.length === 0 && <p className="text-ink/50 dark:text-paper/50">No open positions right now.</p>}

        <div className="flex flex-col gap-4">
          {jobs?.map((job) => (
            <div key={job.id} className="border-b border-ink/10 dark:border-paper/10 pb-4 flex items-center justify-between">
              <div>
                <p className="text-ink dark:text-paper font-medium">{job.title}</p>
                {job.department && <p className="text-ink/50 dark:text-paper/50 text-sm">{job.department}</p>}
              </div>
              <Link href={`/apply/${job.public_slug}`} className="text-amber font-medium text-sm">
                Apply →
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}