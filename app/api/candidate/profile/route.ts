import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from('candidate_profiles')
    .select('full_name, email, age, current_employment_status, field, work_history')
    .eq('id', user.id)
    .single();

  return NextResponse.json({ profile });
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { age, currentEmploymentStatus, field, workHistory } = await request.json();

  const { error } = await supabase
    .from('candidate_profiles')
    .update({
      age: age || null,
      current_employment_status: currentEmploymentStatus || null,
      field: field || null,
      work_history: workHistory || [],
    })
    .eq('id', user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}