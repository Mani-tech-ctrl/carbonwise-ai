import { type NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email address is required.' }, { status: 400 });
    }

    const supabaseAdmin = createAdminClient();

    // Query profiles for the security question
    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .select('security_question')
      .eq('email', email)
      .maybeSingle();

    if (error) {
      console.error('Error fetching security question:', error);
      return NextResponse.json({ error: 'Failed to retrieve security question.' }, { status: 500 });
    }

    if (!profile) {
      return NextResponse.json({ error: 'No account found with this email address.' }, { status: 404 });
    }

    if (!profile.security_question) {
      return NextResponse.json({ 
        error: 'No security question is configured for this account. Please contact support.' 
      }, { status: 400 });
    }

    return NextResponse.json({ securityQuestion: profile.security_question });

  } catch (error: any) {
    console.error('Forgot password query error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
