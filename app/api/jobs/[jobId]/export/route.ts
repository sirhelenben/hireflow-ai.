import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await context.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from('users')
    .select('organization_id')
    .eq('id', user.id)
    .single();
  if (!profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 400 });
  }

  const { data: job } = await supabase.from('jobs').select('id, title').eq('id', jobId).single();
  if (!job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  }

  const { data: applications } = await supabase
    .from('applications')
    .select('id, candidate_profile_id, pipeline_stage, applied_at')
    .eq('job_id', jobId);

  const candidateIds = (applications ?? []).map((a) => a.candidate_profile_id);
  const applicationIds = (applications ?? []).map((a) => a.id);

  const { data: candidates } = candidateIds.length
    ? await supabase.from('candidate_profiles').select('id, full_name, email').in('id', candidateIds)
    : { data: [] };

  const { data: evaluations } = applicationIds.length
    ? await supabase
        .from('ai_evaluations')
        .select('application_id, score, created_at')
        .in('application_id', applicationIds)
        .order('created_at', { ascending: false })
    : { data: [] };

  const latestScoreByApplication = new Map<string, number>();
  for (const evaluation of evaluations ?? []) {
    if (!latestScoreByApplication.has(evaluation.application_id)) {
      latestScoreByApplication.set(evaluation.application_id, evaluation.score);
    }
  }
  const candidateById = new Map((candidates ?? []).map((c) => [c.id, c]));

  const rows = (applications ?? []).map((app) => {
    const candidate = candidateById.get(app.candidate_profile_id);
    const score = latestScoreByApplication.get(app.id);
    return [
      candidate?.full_name ?? '',
      candidate?.email ?? '',
      score !== undefined ? String(score) : '',
      app.pipeline_stage,
      app.applied_at,
    ];
  });

  const header = ['Name', 'Email', 'AI Score', 'Stage', 'Applied At'];
  const csvLines = [header, ...rows].map((row) =>
    row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
  );
  const csv = csvLines.join('\n');

  // Logged per our data-handling design — every export is tracked: who, when, which job, how many
  await supabase.from('export_logs').insert({
    organization_id: profile.organization_id,
    exported_by: user.id,
    job_id: jobId,
    candidate_count: rows.length,
  });

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${job.title.replace(/[^a-z0-9]+/gi, '-')}-applicants.csv"`,
    },
  });
}