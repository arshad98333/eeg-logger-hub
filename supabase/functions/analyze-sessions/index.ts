
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabase = createClient(supabaseUrl!, supabaseKey!);

    // Fetch session data
    const { data: sessions, error: sessionError } = await supabase
      .from('sessions')
      .select(`
        *,
        blocks (*)
      `);

    if (sessionError) throw sessionError;

    // Process data by candidate
    const candidateData = sessions.reduce((acc: any, session: any) => {
      if (!acc[session.candidate_name]) {
        acc[session.candidate_name] = [];
      }
      acc[session.candidate_name].push(session);
      return acc;
    }, {});

    // Analyze each candidate's data
    for (const [candidate, sessions] of Object.entries(candidateData)) {
      const sessionAnalysis = sessions.map((session: any) => {
        const electrodeNotes = session.blocks
          .filter((block: any) => block.notes?.includes('electrode'))
          .map((block: any) => block.notes)
          .join(' ');

        return {
          sessionNumber: session.session_number,
          completedBlocks: session.blocks.filter((b: any) => b.start_time && b.end_time).length,
          electrodeNotes,
        };
      });

      const prompt = `Analyze this clinical session data for candidate ${candidate}:
      ${JSON.stringify(sessionAnalysis, null, 2)}
      
      Provide a concise analysis focusing on:
      1. Overall progress (completed sessions vs target)
      2. Session efficiency (completed blocks)
      3. Any electrode-related issues
      4. Areas of improvement
      
      Format the response in a clear, structured way.`;

      const geminiResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: prompt }]
            }]
          })
        }
      );

      const analysis = await geminiResponse.json();
      
      // Store analysis in Supabase
      const { error: insertError } = await supabase
        .from('session_analysis')
        .insert({
          candidate_name: candidate,
          analysis: analysis.candidates?.[0]?.content?.parts?.[0]?.text || 'Analysis unavailable',
          created_at: new Date().toISOString(),
        });

      if (insertError) throw insertError;
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in analyze-sessions function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
