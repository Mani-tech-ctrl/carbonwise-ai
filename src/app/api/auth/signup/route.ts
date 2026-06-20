import { type NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const { name, email, password, securityQuestion, securityAnswer } = await request.json();

    if (!name || !email || !password || !securityQuestion || !securityAnswer) {
      return NextResponse.json({ error: 'Name, email, password, security question, and answer are required.' }, { status: 400 });
    }

    let supabaseAdmin;
    try {
      supabaseAdmin = createAdminClient();
    } catch (envError: any) {
      return NextResponse.json({ error: envError.message }, { status: 500 });
    }

    const answerHash = crypto
      .createHash('sha256')
      .update(securityAnswer.toLowerCase().trim())
      .digest('hex');

    // Create user in Supabase Auth with email_confirm: true (confirmed immediately)
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: name,
        security_question: securityQuestion,
        security_answer_hash: answerHash,
      }
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Explicitly update profiles table to ensure security question data is persisted
    if (data.user) {
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .update({
          security_question: securityQuestion,
          security_answer_hash: answerHash,
        })
        .eq('id', data.user.id);

      if (profileError) {
        console.error('Failed to update security question in profile:', profileError);
      }
    }

    return NextResponse.json({ success: true, user: data.user });

  } catch (error: any) {
    console.error('Signup API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
