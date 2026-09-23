import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/service-role';
import { parseResumeText } from '@/lib/ai/parse-resume';
import { evaluateCandidate } from '@/lib/ai/evaluate-candidate';
import { sendApplicationConfirmation } from '@/lib/email/send-confirmation';

function generateReferenceNumber() {
  return 'REF-' + Math.random().toString(36).slice(2, 10).toUpperCase();
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const jobSlug = formData.get('jobSlug') as string;
  const fullName = formData.get('fullName') as string;
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const resumeFile = formData.get('resume') as File;
  const turnstileToken = formData.get('turnstileToken') as string;

  if (!jobSlug || !fullName || !email || !password || !resumeFile) {
    return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
  }

  const verifyRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `secret=${process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY}&response=${turnstileToken}`,
  });
  const verifyData = await verifyRes.json();
  if (!verifyData.success) {
    return NextResponse.json({ error: 'Verification failed, please try again' }, { status: 400 });
  }

  const supabase = createServiceRoleClient();

  const { data: job } = await supabase
    .from('jobs')
    .select('id, organization_id, status, title, description')
    .eq('public_slug', jobSlug)
    .single();

  if (!job || job.status !== 'published') {
    return NextResponse.json({ error: 'This job is not accepting applications' }, { status: 404 });
  }

  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (authError || !authData.user) {
    return NextResponse.json({ error: authError?.message || 'Could not create account' }, { status: 400 });
  }
  const candidateId = authData.user.id;

  const { error: profileError } = await supabase.from('candidate_profiles').insert({
    id: candidateId,
    email,
    full_name: fullName,
  });
  if (profileError) {
    await supabase.auth.admin.deleteUser(candidateId);
    return NextResponse.json({ error: 'Could not create profile' }, { status: 500 });
  }

  const { data: application, error: appError } = await supabase
    .from('applications')
    .insert({
      organization_id: job.organization_id,
      job_id: job.id,
      candidate_profile_id: candidateId,
      reference_number: generateReferenceNumber(),
    })
    .select()
    .single();

  if (appError || !application) {
    await supabase.auth.admin.deleteUser(candidateId);
    return NextResponse.json({ error: 'Could not submit application' }, { status: 500 });
  }

  const answersJson = formData.get('answers') as string;
  if (answersJson) {
    const parsedAnswers: { questionId: string; answerText: string }[] = JSON.parse(answersJson);
    for (const answer of parsedAnswers) {
      if (answer.answerText?.trim()) {
        await supabase.from('candidate_screening_answers').insert({
          application_id: application.id,
          screening_question_id: answer.questionId,
          organization_id: job.organization_id,
          answer_text: answer.answerText,
        });
      }
    }
  }

  const filePath = `${job.organization_id}/${application.id}/${resumeFile.name}`;
  const fileBuffer = Buffer.from(await resumeFile.arrayBuffer());

  const { error: uploadError } = await supabase.storage
    .from('resumes')
    .upload(filePath, fileBuffer, { contentType: resumeFile.type });

  if (uploadError) {
    return NextResponse.json({ error: 'Could not upload resume' }, { status: 500 });
  }

  const { data: resumeRow } = await supabase.from('resumes').insert({
    application_id: application.id,
    organization_id: job.organization_id,
    storage_path: filePath,
    original_filename: resumeFile.name,
    mime_type: resumeFile.type,
    file_size_bytes: resumeFile.size,
    file_checksum: 'pending',
  }).select().single();

  try {
    const resumeText = await parseResumeText(fileBuffer, resumeFile.type);

    const { error: parsedTextError } = await supabase.from('resume_parsed_text').insert({
      resume_id: resumeRow!.id,
      organization_id: job.organization_id,
      parsed_text: resumeText,
      parser_version: 'v1',
    });
    if (parsedTextError) {
      console.error('resume_parsed_text INSERT ERROR:', JSON.stringify(parsedTextError, null, 2));
    }

    const { result, promptTokens, completionTokens, totalTokens, processingTimeMs } =
      await evaluateCandidate(job.title, job.description, resumeText);

    const { error: evalError } = await supabase.from('ai_evaluations').insert({
      application_id: application.id,
      organization_id: job.organization_id,
      score: result.score,
      explanation: result.explanation,
      strengths: result.strengths,
      weaknesses: result.weaknesses,
      missing_qualifications: result.missingQualifications,
      model_name: 'gemini-3.6-flash',
      model_version: '3.6',
      prompt_version: 'v1',
      evaluation_schema_version: 'v1',
      processing_time_ms: processingTimeMs,
      prompt_tokens: promptTokens,
      completion_tokens: completionTokens,
      total_tokens: totalTokens,
    });
    if (evalError) {
      console.error('ai_evaluations INSERT ERROR:', JSON.stringify(evalError, null, 2));
    }

    const { error: stageError } = await supabase
      .from('applications')
      .update({ pipeline_stage: 'under_review' })
      .eq('id', application.id);
    if (stageError) {
      console.error('applications UPDATE ERROR:', JSON.stringify(stageError, null, 2));
    }
  } catch (aiError) {
    console.error('AI evaluation failed (application still submitted):', aiError);
  }

  try {
    await sendApplicationConfirmation(email, fullName, job.title, application.reference_number);
  } catch (emailError) {
    console.error('Confirmation email failed (application still submitted):', emailError);
  }

  return NextResponse.json({ success: true, referenceNumber: application.reference_number });
}