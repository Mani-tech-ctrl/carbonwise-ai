import { type NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const { email, answer } = await request.json();

    if (!email || !answer) {
      return NextResponse.json({ error: 'Email and security answer are required.' }, { status: 400 });
    }

    const supabaseAdmin = createAdminClient();

    // Query profiles for the security question answer hash
    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .select('security_answer_hash')
      .eq('email', email)
      .maybeSingle();

    if (error || !profile) {
      return NextResponse.json({ error: 'Verification failed. Profile not found.' }, { status: 404 });
    }

    if (!profile.security_answer_hash) {
      return NextResponse.json({ error: 'Security question answer is not set up on this account.' }, { status: 400 });
    }

    const answerHash = crypto
      .createHash('sha256')
      .update(answer.toLowerCase().trim())
      .digest('hex');

    if (answerHash !== profile.security_answer_hash) {
      return NextResponse.json({ error: 'Incorrect security answer.' }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: 'Security answer verified.' });

  } catch (error: any) {
    console.error('Verify answer API error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
