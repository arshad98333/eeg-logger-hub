
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
        const completedBlocks = session.blocks.filter((block: any) => 
          block.start_time && block.end_time
        ).length;

        const notes = session.blocks
          .map((block: any) => block.notes)
          .filter(Boolean)
          .join(' ');

        return {
          sessionNumber: session.session_number,
          completedBlocks,
          totalBlocks: session.blocks.length,
          notes
        };
      });

      const totalCompletedBlocks = sessionAnalysis.reduce((sum: number, s: any) => sum + s.completedBlocks, 0);
      const totalBlocks = sessionAnalysis.reduce((sum: number, s: any) => sum + s.totalBlocks, 0);
      const completionRate = Math.round((totalCompletedBlocks / totalBlocks) * 100);
      
      const analysis = `Candidate completed ${sessions.length} sessions with a ${completionRate}% completion rate. ` +
        `Average blocks completed per session: ${(totalCompletedBlocks / sessions.length).toFixed(1)}. ` +
        `Current status: ${sessions.length >= 12 ? 'Qualified' : 'In Progress'}.`;

      // Store analysis in Supabase
      const { error: insertError } = await supabase
        .from('session_analysis')
        .insert({
          candidate_name: candidate,
          analysis: analysis,
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
