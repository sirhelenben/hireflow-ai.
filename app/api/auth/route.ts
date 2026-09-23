import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/service-role';

function slugify(name: string) {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
}

export async function POST(request: NextRequest) {
  const { organizationName, fullName, email, password } = await request.json();

  if (!organizationName || !fullName || !email || !password) {
    return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
  }

  const supabase = createServiceRoleClient();

  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (authError || !authData.user) {
    return NextResponse.json({ error: authError?.message || 'Could not create account' }, { status: 400 });
  }
  const userId = authData.user.id;

  const slug = `${slugify(organizationName)}-${userId.slice(0, 6)}`;
  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .insert({ name: organizationName, slug })
    .select()
    .single();

  if (orgError || !org) {
    await supabase.auth.admin.deleteUser(userId);
    return NextResponse.json({ error: 'Could not create organization' }, { status: 500 });
  }

  const { error: profileError } = await supabase.from('users').insert({
    id: userId,
    organization_id: org.id,
    email,
    full_name: fullName,
    role: 'organization_admin',
  });

  if (profileError) {
    await supabase.auth.admin.deleteUser(userId);
    await supabase.from('organizations').delete().eq('id', org.id);
    return NextResponse.json({ error: 'Could not create user profile' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}