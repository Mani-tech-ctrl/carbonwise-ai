/* eslint-disable @typescript-eslint/no-explicit-any */
import { type NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  try {
    const { action, targetUserId, metadata = {} } = await request.json();

    if (!action || !targetUserId) {
      return NextResponse.json({ error: 'Action and Target User ID are required.' }, { status: 400 });
    }

    // 1. Authenticate caller and verify they are an admin
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // Ignore cookie mutations in route
            }
          },
        },
      }
    );

    const { data: { user: adminUser } } = await supabase.auth.getUser();

    if (!adminUser) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    // Query database to check role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', adminUser.id)
      .maybeSingle();

    if (profileError || !profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden. Admin privileges required.' }, { status: 403 });
    }

    // 2. Initialize Supabase Admin Client (Service Role)
    const supabaseAdmin = createAdminClient();

    let logAction = '';

    // 3. Process actions
    switch (action) {
      case 'disable': {
        // Update database profile
        const { error: dbError } = await supabaseAdmin
          .from('profiles')
          .update({ is_disabled: true })
          .eq('id', targetUserId);

        if (dbError) throw dbError;

        // Ban in Supabase Auth (10 years)
        const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
          targetUserId,
          { ban_duration: '87600h' }
        );

        if (authError) throw authError;

        logAction = 'USER_DISABLED';
        break;
      }

      case 'enable': {
        // Update database profile
        const { error: dbError } = await supabaseAdmin
          .from('profiles')
          .update({ is_disabled: false })
          .eq('id', targetUserId);

        if (dbError) throw dbError;

        // Unban in Supabase Auth
        const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
          targetUserId,
          { ban_duration: 'none' }
        );

        if (authError) throw authError;

        logAction = 'USER_ENABLED';
        break;
      }

      case 'delete': {
        // Delete in Supabase Auth (cascades to profiles and related records)
        const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(
          targetUserId
        );

        if (authError) throw authError;

        logAction = 'USER_DELETED';
        break;
      }

      case 'promote': {
        const { error: dbError } = await supabaseAdmin
          .from('profiles')
          .update({ role: 'admin' })
          .eq('id', targetUserId);

        if (dbError) throw dbError;

        logAction = 'USER_PROMOTED';
        break;
      }

      case 'demote': {
        const { error: dbError } = await supabaseAdmin
          .from('profiles')
          .update({ role: 'user' })
          .eq('id', targetUserId);

        if (dbError) throw dbError;

        logAction = 'USER_DEMOTED';
        break;
      }

      case 'log_view': {
        logAction = 'USER_VIEWED';
        break;
      }

      default:
        return NextResponse.json({ error: `Invalid action: ${action}` }, { status: 400 });
    }

    // 4. Log the admin action to public.admin_activity_logs
    const { error: logError } = await supabaseAdmin
      .from('admin_activity_logs')
      .insert({
        admin_id: adminUser.id,
        action: logAction,
        target_user_id: targetUserId,
        metadata: metadata
      });

    if (logError) {
      console.error('Failed to log admin action:', logError);
    }

    return NextResponse.json({ success: true, message: `Action ${action} executed and logged.` });

  } catch (error: any) {
    console.error('Admin actions route error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
