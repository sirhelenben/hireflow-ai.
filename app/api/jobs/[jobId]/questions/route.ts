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

  const { data: questions } = await supabase
    .from('screening_questions')
    .select('id, question_text, question_type, options, display_order')
    .eq('job_id', jobId)
    .order('display_order', { ascending: true });

  return NextResponse.json({ questions: questions ?? [] });
}

export async function POST(
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

  const { questionText, questionType, options } = await request.json();
  if (!questionText) {
    return NextResponse.json({ error: 'Question text is required' }, { status: 400 });
  }

  const { data: question, error } = await supabase
    .from('screening_questions')
    .insert({
      job_id: jobId,
      organization_id: profile.organization_id,
      question_text: questionText,
      question_type: questionType || 'text',
      options: questionType === 'multiple_choice' ? options : null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, question });
}