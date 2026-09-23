import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
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

  const { data: org } = await supabase
    .from('organizations')
    .select('name, slug, description, logo_url, industry')
    .eq('id', profile.organization_id)
    .single();

  return NextResponse.json({ org });
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from('users')
    .select('organization_id, role')
    .eq('id', user.id)
    .single();
  if (!profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 400 });
  }
  if (profile.role !== 'organization_admin') {
    return NextResponse.json({ error: 'Only an organization admin can edit company settings' }, { status: 403 });
  }

  const { description, logoUrl, industry } = await request.json();

  const { error } = await supabase
    .from('organizations')
    .update({
      description: description || null,
      logo_url: logoUrl || null,
      industry: industry || null,
    })
    .eq('id', profile.organization_id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}