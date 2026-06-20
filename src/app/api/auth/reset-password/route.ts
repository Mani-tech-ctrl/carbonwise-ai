import { type NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const { email, answer, newPassword } = await request.json();

    if (!email || !answer || !newPassword) {
      return NextResponse.json({ error: 'Email, security answer, and new password are required.' }, { status: 400 });
    }

    if (newPassword.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters long.' }, { status: 400 });
    }

    const supabaseAdmin = createAdminClient();

    // Query profiles for the security question answer hash and user ID
    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .select('id, security_answer_hash')
      .eq('email', email)
      .maybeSingle();

    if (error || !profile) {
      return NextResponse.json({ error: 'Reset failed. Profile not found.' }, { status: 404 });
    }

    if (!profile.security_answer_hash) {
      return NextResponse.json({ error: 'Security question is not configured on this account.' }, { status: 400 });
    }

    const answerHash = crypto
      .createHash('sha256')
      .update(answer.toLowerCase().trim())
      .digest('hex');

    if (answerHash !== profile.security_answer_hash) {
      return NextResponse.json({ error: 'Incorrect security answer.' }, { status: 400 });
    }

    // Update password in Supabase Auth using the Admin API
    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
      profile.id,
      { password: newPassword }
    );

    if (authError) {
      console.error('Supabase Auth Admin update error:', authError);
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: 'Password updated successfully.' });

  } catch (error: any) {
    console.error('Reset password API error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
