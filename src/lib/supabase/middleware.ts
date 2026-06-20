import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  // Validate environment variables first to avoid silent crash
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.error('CRITICAL ERROR: Supabase environment variables are missing! Check your .env.local file.')
    return supabaseResponse
  }

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, }) => request.cookies.set(name, value))
            supabaseResponse = NextResponse.next({
              request,
            })
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Define protected routes according to the hybrid guest model
    const protectedPrefixes = [
      '/dashboard',
      '/daily-tracker',
      '/reports',
      '/profile',
      '/insights',
      '/challenges',
      '/admin'
    ]

    const isProtected = protectedPrefixes.some(prefix =>
      request.nextUrl.pathname === prefix || request.nextUrl.pathname.startsWith(prefix + '/')
    )

    if (!user && isProtected) {
      // Redirect unauthenticated users to login page
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }

    if (user) {
      // Check role and disabled status in profiles
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, is_disabled')
        .eq('id', user.id)
        .maybeSingle()

      if (profile?.is_disabled) {
        // Clear session and redirect to login if disabled
        await supabase.auth.signOut()
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        return NextResponse.redirect(url)
      }

      // Enforce admin-only access for /admin routes
      if (request.nextUrl.pathname === '/admin' || request.nextUrl.pathname.startsWith('/admin/')) {
        if (!profile || profile.role !== 'admin') {
          const url = request.nextUrl.clone()
          url.pathname = '/dashboard'
          return NextResponse.redirect(url)
        }
      }
    }

    // Redirect authenticated users away from auth pages
    const isAuthRoute = [
      '/login',
      '/signup',
      '/verify-email',
      '/forgot-password',
      '/reset-password',
      '/verify-otp'
    ].some(prefix => request.nextUrl.pathname === prefix || request.nextUrl.pathname.startsWith(prefix + '/'))

    if (user && isAuthRoute) {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }
  } catch (error) {
    console.error('Supabase Auth error in middleware:', error)
  }

  return supabaseResponse
}


