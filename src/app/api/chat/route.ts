/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import { getGeminiModel } from '@/lib/gemini';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    // Verify authentication
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

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch user's latest assessment from Supabase
    const { data: latestAsst } = await supabase
      .from('assessments')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1);

    const assessment = latestAsst && latestAsst.length > 0 ? latestAsst[0] : null;

    // Fetch user's recent daily logs from Supabase
    const { data: dailyLogs } = await supabase
      .from('daily_footprints')
      .select('*')
      .eq('user_id', user.id)
      .order('log_date', { ascending: false })
      .limit(14);

    const model = getGeminiModel('gemini-2.5-flash');
    
    // Construct system instructions
    let systemContext = `You are CarbonWise AI Coach, a friendly, professional, and knowledgeable climate-tech expert.
You help users decrease their daily carbon emissions using data-driven insights, behavioral adjustments, and Mission LiFE principles.
Be direct, encouraging, use precise numbers where possible, and format responses with clean markdown.`;

    if (assessment) {
      systemContext += `\n\nLatest Baseline Assessment Data:
- Total Annualized Emissions: ${assessment.total_emissions.toFixed(1)} kg CO2e
- Scope 1 (Direct): ${assessment.scope_1.toFixed(1)} kg CO2e
- Scope 2 (Energy): ${assessment.scope_2.toFixed(1)} kg CO2e
- Scope 3 (Value Chain): ${assessment.scope_3.toFixed(1)} kg CO2e
- Category Breakdown: 
  - Transport: ${assessment.responses?.category_breakdown?.transport || 0} kg CO2e
  - Energy: ${assessment.responses?.category_breakdown?.energy || 0} kg CO2e
  - Diet: ${assessment.responses?.category_breakdown?.diet || 0} kg CO2e
  - Shopping: ${assessment.responses?.category_breakdown?.shopping || 0} kg CO2e
  - Waste: ${assessment.responses?.category_breakdown?.waste || 0} kg CO2e`;
    }

    if (dailyLogs && dailyLogs.length > 0) {
      systemContext += `\n\nRecent Daily Commute & Utility Logs logged by User:
${dailyLogs.map(log => `- Date: ${log.log_date}, Total: ${Number(log.total_emissions).toFixed(1)} kg CO2e (Transport: ${Number(log.transport_emissions).toFixed(1)} kg, Electricity: ${Number(log.electricity_emissions).toFixed(1)} kg, Diet/Food: ${Number(log.food_emissions).toFixed(1)} kg, Waste: ${Number(log.waste_emissions).toFixed(1)} kg)`).join('\n')}`;
    }

    systemContext += `\n\nAnalyze the data above when answering queries. Do not explicitly state "Here is the context provided to me," just offer direct, context-aware coaching advice.`;

    const fullPrompt = `${systemContext}\n\nUser Question: ${prompt}\n\nCoach Response:`;

    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const text = response.text();

    // Log the AI Insight Request
    const { error: logError } = await supabase
      .from('ai_insight_requests')
      .insert({
        user_id: user.id,
        prompt: prompt
      });

    if (logError) {
      console.error('Failed to log AI insight request:', logError);
    }

    return NextResponse.json({ reply: text });

  } catch (error: any) {
    console.error('Chat API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}


